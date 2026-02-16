#!/usr/bin/env bash
# ship-prompt-inject.sh — Fallback context injection on user prompts.
# Fires on: UserPromptSubmit (every prompt, no matcher support)
# Injects once per compaction cycle using a marker file.
# No-op when no state file exists.
set -euo pipefail

if ! command -v jq &>/dev/null; then
  exit 0
fi

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(echo "$INPUT" | jq -r '.cwd')}"
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')

STATE_FILE="${PROJECT_DIR}/.claude/ship-state.json"

# Guard: no state file = not a ship session
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# Guard: already injected this compaction cycle
MARKER="/tmp/ship-injected-${SESSION_ID}"
if [[ -f "$MARKER" ]]; then
  exit 0
fi

CURRENT_PHASE=$(jq -r '.currentPhase // "unknown"' "$STATE_FILE")
FEATURE_NAME=$(jq -r '.featureName // "unknown"' "$STATE_FILE")

# Skip if completed
if [[ "$CURRENT_PHASE" == "completed" ]]; then
  exit 0
fi

# Mark as injected for this cycle
touch "$MARKER"

# Extract fields for rich injection
SPEC_PATH=$(jq -r '.specPath // ""' "$STATE_FILE")
PRD_PATH=$(jq -r '.prdPath // ""' "$STATE_FILE")
BRANCH=$(jq -r '.branch // ""' "$STATE_FILE")
WORKTREE=$(jq -r '.worktreePath // ""' "$STATE_FILE")
PR_NUMBER=$(jq -r '.prNumber // ""' "$STATE_FILE")
SCOPE=$(jq -r '.scopeCalibration // ""' "$STATE_FILE")
COMPLETED=$(jq -r '(.completedPhases // []) | join(", ")' "$STATE_FILE")
PENDING_AMENDMENTS=$(jq -r '[(.amendments // [])[] | select(.status == "pending")] | length' "$STATE_FILE")

# Build quality gates string
QG_TEST=$(jq -r '.qualityGates.test // ""' "$STATE_FILE")
QG_TC=$(jq -r '.qualityGates.typecheck // ""' "$STATE_FILE")
QG_LINT=$(jq -r '.qualityGates.lint // ""' "$STATE_FILE")
QG_PARTS=()
[[ -n "$QG_TEST" ]] && QG_PARTS+=("$QG_TEST")
[[ -n "$QG_TC" ]] && QG_PARTS+=("$QG_TC")
[[ -n "$QG_LINT" ]] && QG_PARTS+=("$QG_LINT")
QG_STR=""
if [[ ${#QG_PARTS[@]} -gt 0 ]]; then
  QG_STR=$(IFS=" && "; echo "${QG_PARTS[*]}")
fi

# Build context lines
CTX="SHIP WORKFLOW ACTIVE"
CTX+="\nFeature: \"${FEATURE_NAME}\" | Phase: ${CURRENT_PHASE}"
[[ -n "$SCOPE" ]] && CTX+=" | Scope: ${SCOPE}"
[[ -n "$SPEC_PATH" ]] && CTX+="\nSpec: ${SPEC_PATH}"
[[ -n "$PRD_PATH" ]] && CTX+=" | PRD: ${PRD_PATH}"
[[ -n "$PR_NUMBER" && "$PR_NUMBER" != "null" ]] && CTX+="\nPR: #${PR_NUMBER}"
[[ -n "$BRANCH" && "$BRANCH" != "null" ]] && CTX+=" | Branch: ${BRANCH}"
[[ -n "$WORKTREE" && "$WORKTREE" != "null" ]] && CTX+=" | Worktree: ${WORKTREE}"
[[ -n "$QG_STR" ]] && CTX+="\nQuality gates: ${QG_STR}"
[[ -n "$COMPLETED" ]] && CTX+="\nCompleted: ${COMPLETED}"
[[ "$PENDING_AMENDMENTS" -gt 0 ]] && CTX+="\nAmendments: ${PENDING_AMENDMENTS} pending — check ship-state.json amendments array"
CTX+="\n\nIf resuming a /ship workflow, re-read the SPEC.md and check your task list before proceeding. Do not restart completed phases."

# Inject context
jq -n --arg ctx "$(echo -e "$CTX")" '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: $ctx
  }
}'
