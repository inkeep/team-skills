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

# Guard: no state file = no-op
if [[ ! -f "$STATE_FILE" ]]; then
  # Still clean up injection marker
  rm -f "/tmp/ship-injected-${SESSION_ID}"
  exit 0
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
