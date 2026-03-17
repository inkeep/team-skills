#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOUSAGE'
Usage: pr-review.sh [--target <branch>] [--output <file>] [--max-turns <n>] [--prompt <text>]

Runs the local PR review orchestrator against the current repository.

Options:
  --target <branch>   Target branch to diff against (default: auto-detect)
  --output <file>     Capture the final markdown output to this file
  --max-turns <n>     Max turns for the claude -p subprocess (default: 200)
  --prompt <text>     Prompt passed to claude -p
  -h, --help          Show this help
EOUSAGE
  exit "${1:-0}"
}

TARGET_BRANCH="auto"
OUTPUT_FILE=""
MAX_TURNS="200"
PROMPT_TEXT="Review the current local changes. Complete the full workflow silently. Do not narrate your reasoning, reviewer adjudication, or phase progress. When and only when the review is complete, return the final markdown summary body starting with ## PR Review Summary."

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_BRANCH="${2:-}"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    --max-turns)
      MAX_TURNS="${2:-}"
      shift 2
      ;;
    --prompt)
      PROMPT_TEXT="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SHIP_DIR="${CLAUDE_SHIP_DIR:-tmp/ship}"
REPO_ROOT=""
TMP_OUTPUT=""
REPO_ROOT_TMP="$(mktemp)"
trap 'rm -f "$TMP_OUTPUT" "$REPO_ROOT_TMP"' EXIT

if git rev-parse --show-toplevel > "$REPO_ROOT_TMP" 2>/dev/null; then
  IFS= read -r REPO_ROOT < "$REPO_ROOT_TMP"
fi

if [[ -z "$REPO_ROOT" ]]; then
  echo "Must be run from within a git repository" >&2
  exit 1
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "claude CLI is required" >&2
  exit 1
fi

cd "$REPO_ROOT"

detect_target_branch() {
  local default_branch="main"
  local pr_base=""
  local repo_default=""
  local origin_head=""
  local candidate=""

  print_if_valid_branch() {
    local branch="$1"

    if [[ -z "$branch" ]]; then
      return 1
    fi

    if git show-ref --verify --quiet "refs/heads/${branch}" || \
       git show-ref --verify --quiet "refs/remotes/origin/${branch}"; then
      printf '%s\n' "$branch"
      return 0
    fi

    return 1
  }

  if command -v gh >/dev/null 2>&1; then
    pr_base="$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || true)"
    if print_if_valid_branch "$pr_base"; then
      return 0
    fi

    repo_default="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || true)"
    if print_if_valid_branch "$repo_default"; then
      return 0
    fi
  fi

  origin_head="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  origin_head="${origin_head#origin/}"
  if print_if_valid_branch "$origin_head"; then
    return 0
  fi

  for candidate in "$default_branch" main master trunk develop; do
    if print_if_valid_branch "$candidate"; then
      return 0
    fi
  done

  printf '%s\n' "$default_branch"
}

if [[ -z "$TARGET_BRANCH" || "$TARGET_BRANCH" == "auto" ]]; then
  TARGET_BRANCH="$(detect_target_branch)"
fi

if [[ -z "$OUTPUT_FILE" ]]; then
  OUTPUT_FILE="${SHIP_DIR}/review-output.md"
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"
rm -f "$OUTPUT_FILE"
TMP_OUTPUT="$(mktemp)"
RUNS_DIR="${SHIP_DIR}/local-review-runs"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
HEAD_SHA="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
RUN_BRANCH_SLUG="$(printf '%s' "$CURRENT_BRANCH" | tr '/ ' '--' | tr -cd '[:alnum:]._-')"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-${RUN_BRANCH_SLUG:-branch}-$$"
RUN_DIR="${RUNS_DIR}/${RUN_ID}"
LOCAL_REVIEW_STARTED_AT_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p "$RUN_DIR"
printf '%s\n' "$RUN_DIR" > "${SHIP_DIR}/local-review-latest.txt"
write_run_metadata() {
  local claude_status="${1:-}"
  local finished_at="${2:-}"
  local raw_claude_status="${3:-}"
  local exit_normalization="${4:-}"
  local context_file=".claude/skills/pr-context/SKILL.md"
  local run_metadata="${RUN_DIR}/run-metadata.txt"

  {
    printf 'run_id=%s\n' "$RUN_ID"
    printf 'execution_mode=%s\n' "${LOCAL_REVIEW_EXECUTION_MODE:-host}"
    printf 'current_branch=%s\n' "$CURRENT_BRANCH"
    printf 'target_branch=%s\n' "$TARGET_BRANCH"
    printf 'repo_root=%s\n' "$REPO_ROOT"
    printf 'head_sha=%s\n' "$HEAD_SHA"
    printf 'output_file=%s\n' "$OUTPUT_FILE"
    printf 'plugin_dir=%s\n' "$PLUGIN_DIR"
    printf 'started_at_utc=%s\n' "$LOCAL_REVIEW_STARTED_AT_UTC"
    if [[ -n "${LOCAL_REVIEW_COMPOSE_FILE:-}" ]]; then
      printf 'compose_file=%s\n' "$LOCAL_REVIEW_COMPOSE_FILE"
    fi
    if [[ -f "$context_file" ]]; then
      printf 'context_file=%s\n' "$context_file"
    fi
    if [[ -n "$raw_claude_status" ]]; then
      printf 'claude_raw_exit_code=%s\n' "$raw_claude_status"
    fi
    if [[ -n "$claude_status" ]]; then
      printf 'claude_exit_code=%s\n' "$claude_status"
    fi
    if [[ -n "$exit_normalization" ]]; then
      printf 'exit_normalization=%s\n' "$exit_normalization"
    fi
    if [[ -n "$finished_at" ]]; then
      printf 'finished_at_utc=%s\n' "$finished_at"
    fi
  } > "$run_metadata"
}

write_run_metadata

echo "Local review target branch: ${TARGET_BRANCH}" >&2

generate_run_artifacts() {
  if [[ -f ".claude/skills/pr-context/SKILL.md" ]]; then
    cp ".claude/skills/pr-context/SKILL.md" "${RUN_DIR}/pr-context.md"
  fi

  if [[ -f ".claude/pr-diff/full.diff" ]]; then
    cp ".claude/pr-diff/full.diff" "${RUN_DIR}/full.diff"
  fi

  if [[ -f "${PLUGIN_DIR}/bundle-manifest.txt" ]]; then
    cp "${PLUGIN_DIR}/bundle-manifest.txt" "${RUN_DIR}/bundle-manifest.txt"
  fi
}

run_pr_context_generator() {
  local status=0
  local context_file=".claude/skills/pr-context/SKILL.md"

  if command -v timeout >/dev/null 2>&1; then
    timeout 30 "$SCRIPT_DIR/generate-pr-context.sh" --target "$TARGET_BRANCH" || status=$?

    if [[ "$status" -eq 124 && -s "$context_file" ]]; then
      echo "generate-pr-context.sh timed out after writing ${context_file}; continuing with generated context" >&2
      return 0
    fi

    return "$status"
  fi

  "$SCRIPT_DIR/generate-pr-context.sh" --target "$TARGET_BRANCH"
}

run_pr_context_generator
generate_run_artifacts

has_valid_review_summary() {
  local candidate_file="$1"

  [[ -f "$candidate_file" ]] || return 1
  grep -q '^## PR Review Summary' "$candidate_file" && \
    grep -q 'Recommendation:' "$candidate_file"
}

claude_status=0

env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
  -p "$PROMPT_TEXT" \
  --plugin-dir "$PLUGIN_DIR" \
  --agent pr-review:pr-review-local \
  --dangerously-skip-permissions \
  --max-turns "$MAX_TURNS" \
  2>&1 | tee "$TMP_OUTPUT" || claude_status=$?

raw_claude_status="$claude_status"
exit_normalization=""

if [[ -s "$TMP_OUTPUT" ]]; then
  cp "$TMP_OUTPUT" "${RUN_DIR}/claude-output.log"
fi

if has_valid_review_summary "$OUTPUT_FILE"; then
  cp "$OUTPUT_FILE" "${RUN_DIR}/review-output.md"
  echo "Local review output captured at $OUTPUT_FILE"
elif has_valid_review_summary "$TMP_OUTPUT"; then
  cp "$TMP_OUTPUT" "$OUTPUT_FILE"
  cp "$OUTPUT_FILE" "${RUN_DIR}/review-output.md"
  echo "Local review output captured at $OUTPUT_FILE"
else
  echo "Local review output did not contain the expected markdown summary header" >&2
  claude_status=1
fi

if has_valid_review_summary "$OUTPUT_FILE" && [[ "$raw_claude_status" -ne 0 ]]; then
  echo "Claude exited with status ${raw_claude_status} after writing a valid review summary; treating the artifact as success" >&2
  claude_status=0
  exit_normalization="valid_summary_present"
fi

write_run_metadata "$claude_status" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$raw_claude_status" "$exit_normalization"
echo "Local review run artifacts captured at ${RUN_DIR}"

exit "$claude_status"
