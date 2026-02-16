#!/usr/bin/env bash
# ship-pre-compact.sh — Backup ship-state.json before context compaction.
# Fires on: PreCompact (auto|manual)
# No-op when no state file exists.
set -euo pipefail

if ! command -v jq &>/dev/null; then
  exit 0
fi

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(echo "$INPUT" | jq -r '.cwd')}"
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')

STATE_FILE="${PROJECT_DIR}/.claude/ship-state.json"

# Guard: no state file = no-op
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Create timestamped backup
TIMESTAMP=$(date "+%Y%m%d-%H%M%S")
cp "$STATE_FILE" "${PROJECT_DIR}/.claude/ship-state.backup-${TIMESTAMP}.json"

# Clear injection marker so UserPromptSubmit re-injects after compaction
rm -f "/tmp/ship-injected-${SESSION_ID}"

exit 0
