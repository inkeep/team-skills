#!/usr/bin/env bash
# ship-session-end.sh — Clean up completed ship workflows on session end.
# Fires on: SessionEnd (async)
# Only deletes state file if currentPhase is "completed".
# Incomplete workflows persist for the next session.
set -euo pipefail

if ! command -v jq &>/dev/null; then
  exit 0
fi

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(echo "$INPUT" | jq -r '.cwd')}"
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')

STATE_FILE="${PROJECT_DIR}/tmp/ship/state.json"

# Guard: no state file — try worktrees before giving up
if [[ ! -f "$STATE_FILE" ]]; then
  RESOLVED=""
  if command -v git &>/dev/null && git -C "$PROJECT_DIR" rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
    while IFS= read -r wt_line; do
      wt_path=$(echo "$wt_line" | awk '{print $1}')
      if [[ -n "$wt_path" ]] && [[ -f "${wt_path}/tmp/ship/state.json" ]]; then
        STATE_FILE="${wt_path}/tmp/ship/state.json"
        PROJECT_DIR="$wt_path"
        RESOLVED=true
        break
      fi
    done < <(git -C "$PROJECT_DIR" worktree list 2>/dev/null)
  fi
  if [[ -z "$RESOLVED" ]]; then
    rm -f "/tmp/ship-injected-${SESSION_ID}"
    exit 0
  fi
fi

CURRENT_PHASE=$(jq -r '.currentPhase // ""' "$STATE_FILE")

# Only clean up if workflow completed
if [[ "$CURRENT_PHASE" == "completed" ]]; then
  rm -f "$STATE_FILE"
  rm -f "${PROJECT_DIR}/tmp/ship/state.backup-"*.json
fi

# Always clean up injection marker
rm -f "/tmp/ship-injected-${SESSION_ID}"

exit 0
