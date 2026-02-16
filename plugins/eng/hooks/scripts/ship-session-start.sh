#!/usr/bin/env bash
# ship-session-start.sh — Inject recovery context when a ship-state.json exists.
# Fires on: SessionStart (startup|resume|compact)
# No-op when no state file exists (non-ship sessions).
set -euo pipefail

if ! command -v jq &>/dev/null; then
  exit 0
fi

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(echo "$INPUT" | jq -r '.cwd')}"
SOURCE=$(echo "$INPUT" | jq -r '.source // ""')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')

STATE_FILE="${PROJECT_DIR}/.claude/ship-state.json"

# Guard: no state file = not a ship session
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

CURRENT_PHASE=$(jq -r '.currentPhase // "unknown"' "$STATE_FILE")
FEATURE_NAME=$(jq -r '.featureName // "unknown"' "$STATE_FILE")
LAST_UPDATED=$(jq -r '.lastUpdated // ""' "$STATE_FILE")

# On startup: skip if completed or stale (>7 days)
if [[ "$SOURCE" == "startup" ]]; then
  if [[ "$CURRENT_PHASE" == "completed" ]]; then
    exit 0
  fi
  if [[ -n "$LAST_UPDATED" ]]; then
    LAST_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${LAST_UPDATED%%Z*}" "+%s" 2>/dev/null || echo "0")
    NOW_EPOCH=$(date "+%s")
    AGE_DAYS=$(( (NOW_EPOCH - LAST_EPOCH) / 86400 ))
    if [[ "$AGE_DAYS" -gt 7 ]]; then
      exit 0
    fi
  fi
fi

# On compact: clear injection marker so UserPromptSubmit re-injects
if [[ "$SOURCE" == "compact" ]]; then
  rm -f "/tmp/ship-injected-${SESSION_ID}"
fi

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

# Check CI status for active PR (silent on green/pending/error)
CI_WARNING=""
if [[ -n "$PR_NUMBER" && "$PR_NUMBER" != "null" ]] && command -v gh &>/dev/null; then
  GH_DIR="${WORKTREE}"
  [[ -z "$GH_DIR" || "$GH_DIR" == "null" ]] && GH_DIR="$PROJECT_DIR"
  CI_OUTPUT=$(cd "$GH_DIR" 2>/dev/null && gh pr checks "$PR_NUMBER" 2>/dev/null) || CI_OUTPUT=""
  if [[ -n "$CI_OUTPUT" ]]; then
    FAIL_COUNT=$(echo "$CI_OUTPUT" | grep -c "fail" || true)
    if [[ "$FAIL_COUNT" -gt 0 ]]; then
      FAILING_NAMES=$(echo "$CI_OUTPUT" | grep "fail" | awk '{print $1}' | paste -sd, -)
      CI_WARNING="CI FAILING on PR #${PR_NUMBER}: ${FAIL_COUNT} check(s) failed [${FAILING_NAMES}] — investigate and fix before proceeding"
    fi
  fi
fi

# Build context lines
CTX="SHIP WORKFLOW RECOVERY"
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
[[ -n "$CI_WARNING" ]] && CTX+="\n${CI_WARNING}"
CTX+="\n\nRe-read the SPEC.md and check your task list, then resume from the current phase. Do not restart completed phases."

# Inject recovery context
jq -n --arg ctx "$(echo -e "$CTX")" '{
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: $ctx
  }
}'
