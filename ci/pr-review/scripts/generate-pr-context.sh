#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF_USAGE'
Usage: generate-pr-context.sh [--target <branch>]

Generates .claude/skills/pr-context/SKILL.md for local review runs.

Options:
  --target <branch>   Target branch to diff against (default: auto-detect)
  -h, --help          Show this help
EOF_USAGE
  exit "${1:-0}"
}

TARGET_BRANCH="auto"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_BRANCH="${2:-}"
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

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

capture_single_line() {
  local var_name="$1"
  shift

  local tmp_file
  local value=""
  tmp_file="$(mktemp)"

  if "$@" > "$tmp_file" 2>/dev/null; then
    IFS= read -r value < "$tmp_file" || true
    rm -f "$tmp_file"
    printf -v "$var_name" '%s' "$value"
    return 0
  fi

  rm -f "$tmp_file"
  return 1
}

REPO_ROOT=""
capture_single_line REPO_ROOT git rev-parse --show-toplevel || true
if [[ -z "$REPO_ROOT" ]]; then
  echo "Must be run from within a git repository" >&2
  exit 1
fi

cd "$REPO_ROOT"
rm -f .claude/skills/pr-context/SKILL.md .claude/pr-diff/full.diff

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

resolve_target_ref() {
  local ref="$1"

  if git rev-parse --verify --quiet "$ref" >/dev/null; then
    printf '%s\n' "$ref"
    return 0
  fi

  if git rev-parse --verify --quiet "origin/$ref" >/dev/null; then
    printf 'origin/%s\n' "$ref"
    return 0
  fi

  return 1
}

parse_repo_slug() {
  local remote_url=""
  capture_single_line remote_url git config --get remote.origin.url || true

  case "$remote_url" in
    git@github.com:*)
      remote_url="${remote_url#git@github.com:}"
      printf '%s\n' "${remote_url%.git}"
      ;;
    https://github.com/*)
      remote_url="${remote_url#https://github.com/}"
      printf '%s\n' "${remote_url%.git}"
      ;;
    ssh://git@github.com/*)
      remote_url="${remote_url#ssh://git@github.com/}"
      printf '%s\n' "${remote_url%.git}"
      ;;
    *)
      printf '%s\n' "$(basename "$REPO_ROOT")"
      ;;
  esac
}

filter_untracked_file() {
  local path="$1"

  case "$path" in
    tmp/ship/*|dist/*|build/*|.next/*|.turbo/*|node_modules/*|.claude/skills/pr-context/*|.claude/pr-diff/*|.codex/*|.agents/skills/pr-context/*|*.lock|pnpm-lock.yaml|package-lock.json|yarn.lock)
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

if [[ -z "$TARGET_BRANCH" || "$TARGET_BRANCH" == "auto" ]]; then
  TARGET_BRANCH="$("$SCRIPT_DIR/detect-target-branch.sh")"
fi

TARGET_REF="$(resolve_target_ref "$TARGET_BRANCH" || true)"
if [[ -z "$TARGET_REF" ]]; then
  echo "Could not resolve target branch '$TARGET_BRANCH' (checked '$TARGET_BRANCH' and 'origin/$TARGET_BRANCH')" >&2
  exit 1
fi

DIFF_PATHSPEC=(
  --
  .
  ':!*.lock'
  ':!pnpm-lock.yaml'
  ':!package-lock.json'
  ':!yarn.lock'
  ':!tmp/ship/**'
  ':!dist/**'
  ':!build/**'
  ':!.next/**'
  ':!.turbo/**'
  ':!node_modules/**'
  ':!.codex/**'
  ':!.agents/skills/pr-context/**'
)
CURRENT_BRANCH=""
HEAD_SHA=""
MERGE_BASE=""
AUTHOR_NAME="unknown"
capture_single_line CURRENT_BRANCH git rev-parse --abbrev-ref HEAD
capture_single_line HEAD_SHA git rev-parse HEAD
capture_single_line MERGE_BASE git merge-base "$TARGET_REF" HEAD
capture_single_line AUTHOR_NAME git config user.name || true
REPO_SLUG="$(parse_repo_slug)"
COMMIT_LOG="$(git log --oneline --reverse "$TARGET_REF"...HEAD || true)"
COMMIT_COUNT="$(git rev-list --count "$TARGET_REF"...HEAD || echo "0")"

TRACKED_FILES="$(git diff --name-only "$MERGE_BASE" "${DIFF_PATHSPEC[@]}")"

TRACKED_DIFF_STATS="$(git diff --stat "$MERGE_BASE" "${DIFF_PATHSPEC[@]}")"

NUMSTAT="$(git diff --numstat "$MERGE_BASE" "${DIFF_PATHSPEC[@]}")"

TRACKED_DIFF_TMP="$(mktemp)"
TRACKED_DIFF_STATUS=0
TRACKED_DIFF_TIMEOUT_SECONDS=20
TRACKED_DIFF_TIMED_OUT=false
UNTRACKED_TMP=""
trap 'rm -f "$UNTRACKED_TMP" "$TRACKED_DIFF_TMP"' EXIT

if command -v timeout >/dev/null 2>&1; then
  timeout "$TRACKED_DIFF_TIMEOUT_SECONDS" git diff "$MERGE_BASE" "${DIFF_PATHSPEC[@]}" > "$TRACKED_DIFF_TMP" || TRACKED_DIFF_STATUS=$?
else
  git diff "$MERGE_BASE" "${DIFF_PATHSPEC[@]}" > "$TRACKED_DIFF_TMP" || TRACKED_DIFF_STATUS=$?
fi

if [[ "$TRACKED_DIFF_STATUS" -eq 124 ]]; then
  TRACKED_DIFF_TIMED_OUT=true
elif [[ "$TRACKED_DIFF_STATUS" -ne 0 ]]; then
  echo "Failed to generate tracked diff" >&2
  exit "$TRACKED_DIFF_STATUS"
fi

ADDITIONS="$(printf '%s\n' "$NUMSTAT" | awk '$1 != "-" {s+=$1} END{print s+0}')"
DELETIONS="$(printf '%s\n' "$NUMSTAT" | awk '$2 != "-" {s+=$2} END{print s+0}')"

UNTRACKED_LIST=""
UNTRACKED_STATS=""
UNTRACKED_COUNT=0
UNTRACKED_TMP="$(mktemp)"

git ls-files --others --exclude-standard -z > "$UNTRACKED_TMP"

while IFS= read -r -d '' file; do
  if ! filter_untracked_file "$file"; then
    continue
  fi

  UNTRACKED_COUNT=$((UNTRACKED_COUNT + 1))
  UNTRACKED_LIST+="${file}"$'\n'
  UNTRACKED_STATS+="new file | ${file}"$'\n'
done < "$UNTRACKED_TMP"

CHANGED_FILES="$TRACKED_FILES"
if [[ -n "$UNTRACKED_LIST" ]]; then
  CHANGED_FILES+=$'\n'"$UNTRACKED_LIST"
fi

CHANGED_FILES="$(printf '%s' "$CHANGED_FILES" | sed '/^$/d')"
FILE_COUNT="$(printf '%s\n' "$CHANGED_FILES" | sed '/^$/d' | wc -l | tr -d ' ')"

DIFF_STATS="$TRACKED_DIFF_STATS"
if [[ -n "$UNTRACKED_STATS" ]]; then
  DIFF_STATS+=$'\n'"$UNTRACKED_STATS"
fi
DIFF_STATS="$(printf '%s' "$DIFF_STATS" | sed '/^$/d')"
mkdir -p .claude/skills/pr-context .claude/pr-diff
printf "%s\n" "$TARGET_BRANCH" > .claude/pr-diff/local-review-target-branch.txt

DIFF_MODE="inline"
DIFF_SIZE=0
DIFF_MODE_DESCRIPTION="full tracked diff included below"
if [[ "$TRACKED_DIFF_TIMED_OUT" == "true" ]]; then
  DIFF_MODE="summary"
  DIFF_MODE_DESCRIPTION="reviewers must read tracked file diffs on-demand (full diff generation timed out)"
  DIFF_CONTENT="$(cat <<EOF
> **⚠️ LARGE LOCAL REVIEW (summary mode)** — Full tracked diff generation exceeded ${TRACKED_DIFF_TIMEOUT_SECONDS}s, so reviewers must inspect file diffs on-demand.
>
> **How to read diffs on-demand:**
> - Specific file: \`git diff ${MERGE_BASE} -- path/to/file.ts\`
> - Changed files list: see the "Changed Files" section below
> - Untracked files: inspect the file directly in the working tree
EOF
)"
elif [[ ! -s "$TRACKED_DIFF_TMP" ]]; then
  DIFF_CONTENT="$(cat <<'EOF'
```diff
# No tracked diff detected against the target branch.
```
EOF
)"
else
  DIFF_SIZE="$(wc -c < "$TRACKED_DIFF_TMP" | tr -d ' ')"
  if [[ "$DIFF_SIZE" -le 100000 ]]; then
  DIFF_CONTENT="$(cat <<EOF
\`\`\`diff
$(cat "$TRACKED_DIFF_TMP")
\`\`\`
EOF
)"
  else
    DIFF_MODE="summary"
    DIFF_MODE_DESCRIPTION="reviewers must read tracked file diffs on-demand"
    cp "$TRACKED_DIFF_TMP" .claude/pr-diff/full.diff
    DIFF_CONTENT="$(cat <<EOF
> **⚠️ LARGE LOCAL REVIEW (summary mode)** — The diff (~${DIFF_SIZE} bytes across ~${FILE_COUNT} files) exceeds the inline threshold (~100KB).
> The full diff is written to \`.claude/pr-diff/full.diff\`.
>
> **How to read diffs on-demand:**
> - Specific file: \`git diff ${MERGE_BASE} -- path/to/file.ts\`
> - Full diff: read \`.claude/pr-diff/full.diff\`
> - Untracked files: inspect the file directly in the working tree
EOF
)"
  fi
fi

SIZE_VALUE="${COMMIT_COUNT} commits · +${ADDITIONS}/-${DELETIONS} · ${FILE_COUNT} files"
if [[ "$UNTRACKED_COUNT" -gt 0 ]]; then
  SIZE_VALUE+=" (${UNTRACKED_COUNT} untracked)"
fi

{
  cat <<'EOF'
---
name: pr-context
description: Local review context generated from git state.
---

# PR Review Context

(!IMPORTANT)

Use this context to:
1. Get an initial sense of the purpose and scope of the local changes
2. Review the current branch against the target branch without relying on GitHub APIs
3. Identify what needs attention before the changes are pushed

---

## PR Metadata

| Field | Value |
|---|---|
EOF
  printf '| **PR** | Local review — %s vs %s |\n' "$CURRENT_BRANCH" "$TARGET_REF"
  printf '| **Author** | %s |\n' "$AUTHOR_NAME"
  printf '| **Base** | `%s` |\n' "$TARGET_REF"
  printf '| **Repo** | %s |\n' "$REPO_SLUG"
  printf '| **Head SHA** | `%s` |\n' "$HEAD_SHA"
  printf '| **Size** | %s |\n' "$SIZE_VALUE"
  printf '%s\n' '| **Labels** | _None — local review._ |'
  printf '%s\n' '| **Review state** | LOCAL |'
  printf '| **Diff mode** | `%s` — %s |\n' "$DIFF_MODE" "$DIFF_MODE_DESCRIPTION"
  printf '%s\n' '| **Event** | `local:manual` |'
  printf '%s\n' '| **Trigger command** | `local-review` |'
  printf '%s\n' '| **Review scope** | `full` — local review uses the full branch diff against the target branch |'
  cat <<'EOF'

## Description

Local review — no PR description is available.

## Linked Issues

_No linked issues in local review mode._

## Commit History

Commits reachable from HEAD and not in the target branch (oldest → newest). Local staged and unstaged changes may also be present in the diff below.

```
EOF
  printf '%s\n' "$COMMIT_LOG"
  cat <<'EOF'
```

## Changed Files

Per-file diff stats (for prioritizing review effort). Untracked files are listed below but are not converted into synthetic patch text by this generator:

```
EOF
  printf '%s\n' "$DIFF_STATS"
  cat <<'EOF'
```

Full file list (including untracked files when present):

```
EOF
  printf '%s\n' "$CHANGED_FILES"
  cat <<'EOF'
```

## Diff

EOF
  printf '%s\n' "$DIFF_CONTENT"
  if [[ "$UNTRACKED_COUNT" -gt 0 ]]; then
    printf '\n> **Note:** %s untracked file(s) are listed above. Review them directly in the working tree if they are relevant.\n' "$UNTRACKED_COUNT"
  fi
  cat <<'EOF'

## Changes Since Last Review

_N/A — local review (no prior GitHub review baseline)._

## Prior Feedback

> **IMPORTANT:** Local review mode does not load prior PR threads or prior review summaries. Treat this as a first-pass review of the current local changes unless the invoker provided additional context elsewhere.

### Automated Review Comments

_None (local review)._

### Human Review Comments

_None (local review)._

### Previous Review Summaries

_None (local review)._

### PR Discussion

_None (local review)._

## GitHub URL Base (for hyperlinks)

No GitHub PR context is available in local review mode.
- For in-repo citations, use repo-relative `path:line` or `path:start-end` references instead of GitHub blob URLs.
- External docs may still use standard markdown hyperlinks.
EOF
} > .claude/skills/pr-context/SKILL.md

printf 'Local PR context skill generated at .claude/skills/pr-context/SKILL.md\n'
