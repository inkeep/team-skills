#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: run-local-review.sh [--target <branch>] [--output <file>] [--max-turns <n>] [--prompt <text>] [--docker [compose-file]] [--allow-blocking]

Stages the portable PR review bundle into the current repo's ship dir, then runs it
either on the host or inside the repo's Docker sandbox.

Options:
  --target <branch>      Target branch to diff against (default: auto-detect)
  --output <file>        Output markdown path (default: ${CLAUDE_SHIP_DIR:-tmp/ship}/review-output.md)
  --max-turns <n>        Forward max turns to the staged pr-review.sh wrapper
  --prompt <text>        Forward custom prompt text to the staged pr-review.sh wrapper
  --docker [compose]     Execute inside Docker sandbox. Optionally pass the compose file path.
  --allow-blocking       Exit 0 even if the parsed review summary is still blocking
  -h, --help             Show this help
EOF
  exit "${1:-0}"
}

TARGET_BRANCH="auto"
OUTPUT_FILE=""
DOCKER_EXEC=false
COMPOSE_FILE=""
SHIP_DIR="${CLAUDE_SHIP_DIR:-tmp/ship}"
MAX_TURNS=""
PROMPT_TEXT=""
ALLOW_BLOCKING=false
DOCKER_EXEC_PATH="/home/agent/.local/bin:/home/agent/.claude/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
HOST_CLAUDE_CREDENTIALS_FILE="${HOME}/.claude/.credentials.json"
HOST_CLAUDE_PROFILE_FILE="${HOME}/.claude.json"
REVIEW_API_KEY=""
REVIEW_API_KEY_SOURCE=""

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
    --allow-blocking)
      ALLOW_BLOCKING=true
      shift
      ;;
    --docker)
      DOCKER_EXEC=true
      if [[ $# -gt 1 && "${2:-}" != -* ]]; then
        COMPOSE_FILE="${2}"
        shift 2
      else
        shift
      fi
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
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$REPO_ROOT" ]]; then
  echo "Must be run from within a git repository" >&2
  exit 1
fi

cd "$REPO_ROOT"

if [[ -z "$OUTPUT_FILE" ]]; then
  OUTPUT_FILE="${SHIP_DIR}/review-output.md"
fi
REVIEW_STATUS_FILE="${SHIP_DIR}/review-status.json"

"$SCRIPT_DIR/stage-local-review-bundle.sh"

BUNDLE_SCRIPT="${SHIP_DIR}/pr-review-plugin/scripts/pr-review.sh"
if [[ ! -x "$BUNDLE_SCRIPT" ]]; then
  echo "Staged local review script not found at ${BUNDLE_SCRIPT}" >&2
  exit 1
fi

REVIEW_ARGS=(--target "$TARGET_BRANCH" --output "$OUTPUT_FILE")
if [[ -n "$MAX_TURNS" ]]; then
  REVIEW_ARGS+=(--max-turns "$MAX_TURNS")
fi
if [[ -n "$PROMPT_TEXT" ]]; then
  REVIEW_ARGS+=(--prompt "$PROMPT_TEXT")
fi

resolve_compose_file() {
  local candidate=""

  if [[ -n "$COMPOSE_FILE" ]]; then
    if [[ ! -f "$COMPOSE_FILE" ]]; then
      echo "Compose file not found: $COMPOSE_FILE" >&2
      exit 1
    fi
    printf '%s\n' "$COMPOSE_FILE"
    return 0
  fi

  while IFS= read -r candidate; do
    if rg -n '^[[:space:]]+sandbox:' "$candidate" >/dev/null 2>&1; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done < <(
    find . -maxdepth 5 -type f \
      \( -name 'docker-compose.yml' -o -name 'docker-compose.*.yml' -o -name 'compose.yml' \) \
      | sort
  )

  echo "No compose file with a sandbox service found in this repo" >&2
  exit 1
}

compose_service_running() {
  local compose_file="$1"
  local service="$2"

  docker compose -f "$compose_file" ps --status running --services 2>/dev/null | grep -qx "$service"
}

bring_up_service_with_retries() {
  local compose_file="$1"
  local service="$2"
  local up_args=()
  local attempt=1
  local max_attempts=3
  local delay_seconds=5

  if (( $# > 2 )); then
    up_args=("${@:3}")
  fi

  if compose_service_running "$compose_file" "$service"; then
    return 0
  fi

  while (( attempt <= max_attempts )); do
    echo "Starting Docker service '${service}' (attempt ${attempt}/${max_attempts})..." >&2
    if (( ${#up_args[@]} > 0 )); then
      if docker compose -f "$compose_file" up -d "${up_args[@]}" "$service"; then
        if compose_service_running "$compose_file" "$service"; then
          return 0
        fi
        echo "Docker service '${service}' did not reach running state after compose up" >&2
      fi
    elif docker compose -f "$compose_file" up -d "$service"; then
      if compose_service_running "$compose_file" "$service"; then
        return 0
      fi
      echo "Docker service '${service}' did not reach running state after compose up" >&2
    fi

    if (( attempt == max_attempts )); then
      break
    fi

    echo "Docker service '${service}' failed to start. Retrying in ${delay_seconds}s..." >&2
    sleep "$delay_seconds"
    attempt=$((attempt + 1))
  done

  echo "Failed to start Docker service '${service}' after ${max_attempts} attempts." >&2
  echo "Docker Desktop logs have shown transient DNS/proxy failures during image bootstrap; retry after Docker networking stabilizes." >&2
  exit 1
}

extract_api_key_from_env_file() {
  local env_file="$1"

  [[ -f "$env_file" ]] || return 1

  awk -F= '
    /^ANTHROPIC_API_KEY=/ {
      sub(/^[^=]*=/, "")
      print
      exit
    }
  ' "$env_file"
}

api_key_works() {
  local api_key="$1"

  [[ -n "$api_key" ]] || return 1

  curl --fail --silent --show-error --max-time 15 \
    -H "x-api-key: ${api_key}" \
    -H "anthropic-version: 2023-06-01" \
    https://api.anthropic.com/v1/models >/dev/null
}

select_review_api_key() {
  local repo_env_key=""
  local shell_env_key="${ANTHROPIC_API_KEY:-}"

  repo_env_key="$(extract_api_key_from_env_file "$REPO_ROOT/.env" 2>/dev/null || true)"
  if api_key_works "$repo_env_key"; then
    REVIEW_API_KEY="$repo_env_key"
    REVIEW_API_KEY_SOURCE="repo .env"
    return 0
  fi

  if api_key_works "$shell_env_key"; then
    REVIEW_API_KEY="$shell_env_key"
    REVIEW_API_KEY_SOURCE="shell environment"
    return 0
  fi

  REVIEW_API_KEY=""
  REVIEW_API_KEY_SOURCE=""
  return 1
}

container_supports_claudeai_auth() {
  local compose_file="$1"

  docker compose -f "$compose_file" exec -T sandbox /bin/bash -lc '
    set -euo pipefail
    auth_json="$(unset ANTHROPIC_API_KEY; claude auth status 2>/dev/null || true)"
    if [[ -z "$auth_json" ]]; then
      exit 1
    fi

    printf "%s\n" "$auth_json" | jq -e '.loggedIn == true and .authMethod == "claude.ai"' >/dev/null
  ' >/dev/null 2>&1
}

bootstrap_container_claude_auth() {
  local compose_file="$1"
  local container_id=""

  if [[ ! -f "$HOST_CLAUDE_CREDENTIALS_FILE" || ! -f "$HOST_CLAUDE_PROFILE_FILE" ]]; then
    return 1
  fi

  container_id="$(docker compose -f "$compose_file" ps -q sandbox 2>/dev/null || true)"
  if [[ -z "$container_id" ]]; then
    return 1
  fi

  echo "Bootstrapping sandbox Claude auth from host credentials..." >&2
  docker cp "$HOST_CLAUDE_CREDENTIALS_FILE" "${container_id}:/home/agent/.claude/.credentials.json" >/dev/null
  docker cp "$HOST_CLAUDE_PROFILE_FILE" "${container_id}:/home/agent/.claude.json" >/dev/null
  docker compose -f "$compose_file" exec -T -u root sandbox /bin/bash -lc '
    set -euo pipefail
    chown agent:agent /home/agent/.claude/.credentials.json /home/agent/.claude.json
    chmod 600 /home/agent/.claude/.credentials.json
    chmod 644 /home/agent/.claude.json
  ' >/dev/null

  container_supports_claudeai_auth "$compose_file"
}

run_review_status=0

if [[ "$DOCKER_EXEC" == "true" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "docker CLI is required for --docker mode" >&2
    exit 1
  fi

  RESOLVED_COMPOSE_FILE="$(resolve_compose_file)"

  if ! compose_service_running "$RESOLVED_COMPOSE_FILE" 'proxy'; then
    bring_up_service_with_retries "$RESOLVED_COMPOSE_FILE" 'proxy'
  fi

  if ! compose_service_running "$RESOLVED_COMPOSE_FILE" 'sandbox'; then
    bring_up_service_with_retries "$RESOLVED_COMPOSE_FILE" 'sandbox' --no-deps
  fi

  DOCKER_AUTH_MODE="api-key"
  if select_review_api_key; then
    echo "Using validated Anthropic API key from ${REVIEW_API_KEY_SOURCE}." >&2
  elif container_supports_claudeai_auth "$RESOLVED_COMPOSE_FILE"; then
    DOCKER_AUTH_MODE="claude.ai"
    echo "Sandbox ANTHROPIC_API_KEY failed validation; falling back to existing claude.ai auth." >&2
  elif bootstrap_container_claude_auth "$RESOLVED_COMPOSE_FILE"; then
    DOCKER_AUTH_MODE="claude.ai"
    echo "Sandbox ANTHROPIC_API_KEY failed validation; falling back to host-backed claude.ai auth." >&2
  else
    echo "Sandbox ANTHROPIC_API_KEY validation failed and claude.ai auth is unavailable; proceeding with api-key mode." >&2
  fi

  set +e
  docker compose -f "$RESOLVED_COMPOSE_FILE" exec \
    -e CLAUDE_SHIP_DIR="$SHIP_DIR" \
    -e LOCAL_REVIEW_COMPOSE_FILE="$RESOLVED_COMPOSE_FILE" \
    -e LOCAL_REVIEW_EXECUTION_MODE="docker" \
    -e LOCAL_REVIEW_SOURCE_REPO="/workspace" \
    -e LOCAL_REVIEW_TMP_REPO="/tmp/local-review-workspace" \
    -e LOCAL_REVIEW_AUTH_MODE="$DOCKER_AUTH_MODE" \
    -e LOCAL_REVIEW_API_KEY="$REVIEW_API_KEY" \
    -e PATH="$DOCKER_EXEC_PATH" \
    sandbox \
    /bin/bash -lc '
      set -euo pipefail

      SOURCE_REPO="${LOCAL_REVIEW_SOURCE_REPO:-/workspace}"
      TMP_REPO="${LOCAL_REVIEW_TMP_REPO:-/tmp/local-review-workspace}"

      if [[ "${LOCAL_REVIEW_AUTH_MODE:-api-key}" == "claude.ai" ]]; then
        unset ANTHROPIC_API_KEY
      elif [[ -n "${LOCAL_REVIEW_API_KEY:-}" ]]; then
        export ANTHROPIC_API_KEY="${LOCAL_REVIEW_API_KEY}"
      fi

      rm -rf "$TMP_REPO"
      mkdir -p "$TMP_REPO"

      # Use a slimmed temp workspace so Claude startup does not recurse through
      # heavy local-only trees like .claude/worktrees from the mounted host repo.
      tar -C "$SOURCE_REPO" \
        --exclude="./.claude/worktrees" \
        --exclude="./.claude/skills/pr-context" \
        --exclude="./.claude/pr-diff" \
        --exclude="./node_modules" \
        --exclude="./.next" \
        --exclude="./.turbo" \
        --exclude="./dist" \
        --exclude="./build" \
        --exclude="./tmp/ship/local-review-runs" \
        -cf - . | tar -C "$TMP_REPO" -xf -

      cd "$TMP_REPO"

      set +e
      "$@"
      review_status=$?
      set -e

      mkdir -p "$SOURCE_REPO/tmp/ship"

      if [[ -f "$TMP_REPO/tmp/ship/review-output.md" ]]; then
        cp "$TMP_REPO/tmp/ship/review-output.md" "$SOURCE_REPO/tmp/ship/review-output.md"
      fi

      if [[ -f "$TMP_REPO/tmp/ship/local-review-latest.txt" ]]; then
        cp "$TMP_REPO/tmp/ship/local-review-latest.txt" "$SOURCE_REPO/tmp/ship/local-review-latest.txt"
      fi

      if [[ -d "$TMP_REPO/tmp/ship/local-review-runs" ]]; then
        mkdir -p "$SOURCE_REPO/tmp/ship/local-review-runs"
        cp -R "$TMP_REPO/tmp/ship/local-review-runs/." "$SOURCE_REPO/tmp/ship/local-review-runs/"
      fi

      if [[ -f "$TMP_REPO/.claude/skills/pr-context/SKILL.md" ]]; then
        mkdir -p "$SOURCE_REPO/.claude/skills/pr-context"
        cp "$TMP_REPO/.claude/skills/pr-context/SKILL.md" "$SOURCE_REPO/.claude/skills/pr-context/SKILL.md"
      fi

      if [[ -f "$TMP_REPO/.claude/pr-diff/full.diff" ]]; then
        mkdir -p "$SOURCE_REPO/.claude/pr-diff"
        cp "$TMP_REPO/.claude/pr-diff/full.diff" "$SOURCE_REPO/.claude/pr-diff/full.diff"
      fi

      exit "$review_status"
    ' local-review-in-container \
    "$BUNDLE_SCRIPT" \
    "${REVIEW_ARGS[@]}"
  run_review_status=$?
  set -e
else
  set +e
  "$BUNDLE_SCRIPT" "${REVIEW_ARGS[@]}"
  run_review_status=$?
  set -e
fi

if [[ "$run_review_status" -eq 0 ]]; then
  "$SCRIPT_DIR/parse-local-review-summary.sh" --input "$OUTPUT_FILE" --output "$REVIEW_STATUS_FILE" >/dev/null

  if [[ -f "${SHIP_DIR}/state.json" ]]; then
    jq \
      --arg summaryFile "$OUTPUT_FILE" \
      --arg statusFile "$REVIEW_STATUS_FILE" \
      --arg latestRunFile "${SHIP_DIR}/local-review-latest.txt" \
      --slurpfile reviewStatus "$REVIEW_STATUS_FILE" \
      '
      .localReview = (($reviewStatus[0] // {}) + {
        summaryFile: $summaryFile,
        statusFile: $statusFile,
        latestRunFile: $latestRunFile
      })
      | .lastUpdated = ($reviewStatus[0].generatedAt // .lastUpdated)
      ' "${SHIP_DIR}/state.json" > "${SHIP_DIR}/state.json.tmp" \
      && mv "${SHIP_DIR}/state.json.tmp" "${SHIP_DIR}/state.json"
  fi

  if jq -e '.blocking == true' "$REVIEW_STATUS_FILE" >/dev/null 2>&1; then
    echo "Local review summary is blocking. Fix the validated issues and rerun the gate." >&2
    jq -r '.blockingReasons[]? | "- " + .' "$REVIEW_STATUS_FILE" >&2 || true
    if [[ "$ALLOW_BLOCKING" != true ]]; then
      exit 2
    fi
  fi
fi

exit "$run_review_status"
