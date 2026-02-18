#!/bin/bash

# Ship Loop Stop Hook
# Prevents session exit when a ship-loop is active.
# Re-injects a phase-aware prompt to keep the agent working through all ship phases.
#
# State files:
#   tmp/ship/loop.md  — loop control (iteration, max_iterations, completion_promise)
#   tmp/ship/state.json     — ship workflow state (current phase, spec, PR, etc.)
#
# Two-part completion gate: the agent must BOTH output the completion promise
# AND set tmp/ship/state.json currentPhase to "completed" before the loop allows exit.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_INPUT=$(cat)

LOOP_STATE_FILE="tmp/ship/loop.md"
SHIP_STATE_FILE="tmp/ship/state.json"

# Extract session_id from hook input for session isolation
HOOK_SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty' 2>/dev/null || echo "")

# --- Guard: no active loop → allow exit ---
if [[ ! -f "$LOOP_STATE_FILE" ]]; then
  exit 0
fi

# --- Parse loop state frontmatter ---
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$LOOP_STATE_FILE")
ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
COMPLETION_PROMISE=$(echo "$FRONTMATTER" | grep '^completion_promise:' | sed 's/completion_promise: *//' | sed 's/^"\(.*\)"$/\1/')

# Extract session_id from loop state for session isolation
LOOP_SESSION_ID=$(echo "$FRONTMATTER" | grep '^session_id:' | sed 's/session_id: *//' | sed 's/^"\(.*\)"$/\1/' || echo "")

# --- Session isolation: only the owning session controls this loop ---
if [[ -n "$LOOP_SESSION_ID" ]] && [[ -n "$HOOK_SESSION_ID" ]] && [[ "$LOOP_SESSION_ID" != "$HOOK_SESSION_ID" ]]; then
  # This loop belongs to a different session — allow exit without interfering
  exit 0
fi

# Validate numeric fields
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Ship loop: State file corrupted (iteration: '$ITERATION')" >&2
  rm "$LOOP_STATE_FILE"
  exit 0
fi

if [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Ship loop: State file corrupted (max_iterations: '$MAX_ITERATIONS')" >&2
  rm "$LOOP_STATE_FILE"
  exit 0
fi

# --- Check max iterations ---
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "🛑 Ship loop: Max iterations ($MAX_ITERATIONS) reached." >&2
  rm "$LOOP_STATE_FILE"
  exit 0
fi

# --- Check transcript for completion promise ---
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path')

if [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  echo "⚠️  Ship loop: Transcript not found" >&2
  rm "$LOOP_STATE_FILE"
  exit 0
fi

if ! grep -q '"role":"assistant"' "$TRANSCRIPT_PATH"; then
  echo "⚠️  Ship loop: No assistant messages in transcript" >&2
  rm "$LOOP_STATE_FILE"
  exit 0
fi

LAST_LINE=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" | tail -1)
if [[ -z "$LAST_LINE" ]]; then
  echo "⚠️  Ship loop: Failed to extract assistant message" >&2
  rm "$LOOP_STATE_FILE"
  exit 0
fi

LAST_OUTPUT=$(echo "$LAST_LINE" | jq -r '
  .message.content |
  map(select(.type == "text")) |
  map(.text) |
  join("\n")
' 2>&1)

if [[ $? -ne 0 ]] || [[ -z "$LAST_OUTPUT" ]]; then
  echo "⚠️  Ship loop: Failed to parse assistant message" >&2
  rm "$LOOP_STATE_FILE"
  exit 0
fi

# --- Check for pause signal ---
# Agent outputs <input>reason</input> when it needs user input (e.g., scope decision).
# Allow exit WITHOUT removing the loop file — loop stays active for when work resumes.
PAUSE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<input>(.*?)<\/input>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")
if [[ -n "$PAUSE_TEXT" ]] && [[ "$PAUSE_TEXT" != "$LAST_OUTPUT" ]]; then
  echo "⏸️  Ship loop: Paused — $PAUSE_TEXT" >&2
  # Do NOT remove loop file. Do NOT increment iteration.
  # When the user responds and the agent finishes, Stop fires again and the loop continues.
  exit 0
fi

# --- Two-part completion gate ---
if [[ "$COMPLETION_PROMISE" != "null" ]] && [[ -n "$COMPLETION_PROMISE" ]]; then
  PROMISE_TEXT=$(echo "$LAST_OUTPUT" | perl -0777 -pe 's/.*?<complete>(.*?)<\/complete>.*/$1/s; s/^\s+|\s+$//g; s/\s+/ /g' 2>/dev/null || echo "")

  if [[ -n "$PROMISE_TEXT" ]] && [[ "$PROMISE_TEXT" = "$COMPLETION_PROMISE" ]]; then
    # Part 2: verify state.json also says completed
    if [[ -f "$SHIP_STATE_FILE" ]] && command -v jq &>/dev/null; then
      CURRENT_PHASE=$(jq -r '.currentPhase // ""' "$SHIP_STATE_FILE")
      if [[ "$CURRENT_PHASE" != "completed" ]]; then
        echo "⚠️  Ship loop: Promise detected but state.json shows '$CURRENT_PHASE' (not 'completed'). Continuing." >&2
        # Fall through to re-inject — false completion signal
      else
        echo "✅ Ship loop: All phases complete." >&2
        rm "$LOOP_STATE_FILE"
        exit 0
      fi
    else
      # No state file or no jq — trust the promise
      echo "✅ Ship loop: Completion detected." >&2
      rm "$LOOP_STATE_FILE"
      exit 0
    fi
  fi
fi

# --- Build phase-aware re-injection prompt ---
NEXT_ITERATION=$((ITERATION + 1))

# Read state.json for dynamic context
CURRENT_PHASE="unknown"
FEATURE_NAME="unknown"
COMPLETED_PHASES=""
SPEC_PATH=""
PR_NUMBER=""
BRANCH=""
QUALITY_GATES=""
SCOPE=""
PENDING_AMENDMENTS=0

if [[ -f "$SHIP_STATE_FILE" ]] && command -v jq &>/dev/null; then
  CURRENT_PHASE=$(jq -r '.currentPhase // "unknown"' "$SHIP_STATE_FILE")
  FEATURE_NAME=$(jq -r '.featureName // "unknown"' "$SHIP_STATE_FILE")
  COMPLETED_PHASES=$(jq -r '(.completedPhases // []) | join(", ")' "$SHIP_STATE_FILE")
  SPEC_PATH=$(jq -r '.specPath // ""' "$SHIP_STATE_FILE")
  PR_NUMBER=$(jq -r '.prNumber // ""' "$SHIP_STATE_FILE")
  BRANCH=$(jq -r '.branch // ""' "$SHIP_STATE_FILE")
  SCOPE=$(jq -r '.scopeCalibration // ""' "$SHIP_STATE_FILE")
  PENDING_AMENDMENTS=$(jq -r '[(.amendments // [])[] | select(.status == "pending")] | length' "$SHIP_STATE_FILE")

  QG_TEST=$(jq -r '.qualityGates.test // ""' "$SHIP_STATE_FILE")
  QG_TC=$(jq -r '.qualityGates.typecheck // ""' "$SHIP_STATE_FILE")
  QG_LINT=$(jq -r '.qualityGates.lint // ""' "$SHIP_STATE_FILE")
  QG_PARTS=()
  [[ -n "$QG_TEST" ]] && QG_PARTS+=("$QG_TEST")
  [[ -n "$QG_TC" ]] && QG_PARTS+=("$QG_TC")
  [[ -n "$QG_LINT" ]] && QG_PARTS+=("$QG_LINT")
  if [[ ${#QG_PARTS[@]} -gt 0 ]]; then
    QUALITY_GATES=$(IFS=" && "; echo "${QG_PARTS[*]}")
  fi
fi

# Phase description lookup — enough context for the agent to continue without re-reading SKILL.md
PHASE_DESC=""
case "$CURRENT_PHASE" in
  "Phase 0")
    PHASE_DESC="Detect context and starting point — create isolated workspace (worktree), detect capabilities (gh, browser, peekaboo, docker), determine entry point (SPEC.md exists vs spec from scratch), calibrate workflow to scope."
    ;;
  "Phase 1")
    PHASE_DESC="Spec authoring and handoff (COLLABORATIVE — user is active). Step 1: Load /spec skill with the feature description (or use existing SPEC.md if provided). Step 2: Validate the SPEC.md (problem statement, acceptance criteria, test cases, technical design — ask user to fill gaps). Step 3: User confirms handoff. Step 4: Activate execution state — write tmp/ship/state.json, create tmp/ship/loop.md."
    ;;
  "Phase 2")
    PHASE_DESC="Implementation. Step 1: Use /inspect on the target codebase area to understand patterns, conventions, and shared abstractions. Step 2: Load /implement skill with: spec path, codebase context from /inspect, quality gate overrides, browser availability, docker flag if applicable. Wait for implementation to complete. Post-implementation: delegate review to a subagent ('Does implementation match SPEC.md acceptance criteria? Gaps, dead code, TODOs?'). Fix issues. Then create draft PR: Load references/pr-creation.md — push branch, gh pr create --draft with stub body, set prNumber in state.json."
    ;;
  "Phase 3")
    PHASE_DESC="Testing. Load /qa-test skill with spec path (or PR number if no spec). /qa-test handles manual QA lifecycle. PR already exists (created after Phase 2) — /qa-test can post results as PR comments. Exit gate: /qa-test complete, quality gates green if code changed, can explain implementation. After exit gate, write full PR body: load /pull-request with PR number and spec path."
    ;;
  "Phase 4")
    PHASE_DESC="Documentation. Load /docs skill with spec path and PR number. Docs must be committed before review. After Phase 5, re-check if code changes affect docs."
    ;;
  "Phase 5")
    PHASE_DESC="Review iteration loop. Mark PR ready: gh pr ready <pr-number>. Load /review skill with PR number, spec path, quality gates. Do NOT self-review. Handle escalated feedback: in-scope fixes → implement and push, out-of-scope → consult user (only humans approve scope changes), architectural → evaluate via calibration. Re-load /review skill after any new commits."
    ;;
  "Phase 6")
    PHASE_DESC="Completion. Verify: tests passing, typecheck passing, lint passing, no TODO/FIXME from implementation, docs up-to-date. If PR exists: description current, changelog entries, all threads resolved, CI green. Report to user. Set state.json currentPhase to 'completed'."
    ;;
  *)
    PHASE_DESC="Unknown phase — read tmp/ship/state.json to determine current state and proceed accordingly."
    ;;
esac

# --- Read SKILL.md for full skill reference ---
SKILL_MD_PATH="${SCRIPT_DIR}/../../skills/ship/SKILL.md"
SKILL_CONTENT=""
if [[ -f "$SKILL_MD_PATH" ]]; then
  SKILL_CONTENT=$(cat "$SKILL_MD_PATH")
fi

# --- Read state files for auto-injection ---
# Instead of telling the agent to read these files (wasting 2-3 tool calls),
# inject their contents directly into the prompt so the agent can act immediately.

STATE_JSON_CONTENT=""
SPEC_CONTENT=""
SPEC_JSON_CONTENT=""
PROGRESS_CONTENT=""

# state.json — always include (already confirmed it exists from parsing above)
if [[ -f "$SHIP_STATE_FILE" ]]; then
  STATE_JSON_CONTENT=$(cat "$SHIP_STATE_FILE")
fi

# SPEC.md — include if path is known and file exists
if [[ -n "$SPEC_PATH" && "$SPEC_PATH" != "null" && -f "$SPEC_PATH" ]]; then
  SPEC_CONTENT=$(cat "$SPEC_PATH")
fi

# spec.json — include if exists (shows story progress: which pass, which don't)
SPEC_JSON_PATH="tmp/ship/spec.json"
if [[ -f "$SHIP_STATE_FILE" ]] && command -v jq &>/dev/null; then
  SPEC_JSON_PATH=$(jq -r '.specJsonPath // "tmp/ship/spec.json"' "$SHIP_STATE_FILE")
fi
if [[ -f "$SPEC_JSON_PATH" ]]; then
  SPEC_JSON_CONTENT=$(cat "$SPEC_JSON_PATH")
fi

# progress.txt — tail last 100 lines (iteration log can grow large)
PROGRESS_PATH="tmp/ship/progress.txt"
if [[ -f "$PROGRESS_PATH" ]]; then
  TOTAL_LINES=$(wc -l < "$PROGRESS_PATH" | tr -d ' ')
  if [[ "$TOTAL_LINES" -gt 100 ]]; then
    PROGRESS_CONTENT="[... truncated — showing last 100 of ${TOTAL_LINES} lines ...]
$(tail -100 "$PROGRESS_PATH")"
  else
    PROGRESS_CONTENT=$(cat "$PROGRESS_PATH")
  fi
fi

# --- Capture git state ---
# Precompute git context so the agent doesn't waste tool calls on orientation.
# Filters noise (lock files, build artifacts, tmp/) and enriches with diffstat.
GIT_STATUS=""
GIT_DIFFSTAT=""
GIT_LOG=""
GIT_BRANCH_STATUS=""
GIT_CWD=""

GIT_CWD=$(pwd 2>/dev/null || echo "unknown")

if command -v git &>/dev/null && git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  # Filter noise from git status: lock files, build artifacts, ship state files
  GIT_STATUS=$(git status --short 2>/dev/null \
    | grep -v -E '(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|\.lock$)' \
    | grep -v -E '^.. tmp/ship/' \
    | grep -v -E '^.. (dist|\.next|build|\.turbo|node_modules)/' \
    | head -50 || echo "")
  RAW_COUNT=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
  FILTERED_COUNT=$(echo "$GIT_STATUS" | grep -c '.' || echo 0)
  if [[ "$RAW_COUNT" -gt "$FILTERED_COUNT" ]] && [[ "$FILTERED_COUNT" -gt 0 ]]; then
    GIT_STATUS+="
[${RAW_COUNT} total files, ${FILTERED_COUNT} shown — filtered: lock files, build artifacts, tmp/ship/]"
  fi

  # Diffstat for uncommitted changes — shows +/- line counts per file
  GIT_DIFFSTAT=$(git diff --stat HEAD 2>/dev/null \
    | grep -v -E '(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|\.lock$)' \
    | grep -v -E 'tmp/ship/' \
    | grep -v -E '(dist|\.next|build|\.turbo|node_modules)/' \
    || echo "")

  # Scope log to feature branch if we know the branch
  if [[ -n "$BRANCH" && "$BRANCH" != "null" ]]; then
    # Try to find merge-base with common default branches
    MERGE_BASE=""
    for base_candidate in main master; do
      if git rev-parse --verify "$base_candidate" &>/dev/null; then
        MERGE_BASE=$(git merge-base "$base_candidate" HEAD 2>/dev/null || echo "")
        break
      fi
    done
    if [[ -n "$MERGE_BASE" ]]; then
      GIT_LOG=$(git log --oneline --no-merges "${MERGE_BASE}..HEAD" 2>/dev/null | head -30 || echo "")
      TOTAL_BRANCH_COMMITS=$(git log --oneline --no-merges "${MERGE_BASE}..HEAD" 2>/dev/null | wc -l | tr -d ' ')
      if [[ "$TOTAL_BRANCH_COMMITS" -gt 30 ]]; then
        GIT_LOG+="
[... showing 30 of ${TOTAL_BRANCH_COMMITS} commits on branch since ${base_candidate} ...]"
      fi
    else
      GIT_LOG=$(git log --oneline --no-merges -15 2>/dev/null || echo "")
    fi
  else
    GIT_LOG=$(git log --oneline --no-merges -15 2>/dev/null || echo "")
  fi

  # Branch tracking status (ahead/behind remote)
  GIT_BRANCH_STATUS=$(git status --branch --porcelain 2>/dev/null | head -1 | sed 's/^## //' || echo "")
fi

# Build the prompt
PROMPT="[SHIP-LOOP] Iteration ${NEXT_ITERATION} | Phase: ${CURRENT_PHASE}

You are the ship orchestrator for \"${FEATURE_NAME}\"."

[[ -n "$BRANCH" && "$BRANCH" != "null" ]] && PROMPT+="
Branch: ${BRANCH}"
[[ -n "$SPEC_PATH" && "$SPEC_PATH" != "null" ]] && PROMPT+=" | Spec: ${SPEC_PATH}"
[[ -n "$PR_NUMBER" && "$PR_NUMBER" != "null" ]] && PROMPT+=" | PR: #${PR_NUMBER}"

PROMPT+="

COMPLETED: ${COMPLETED_PHASES:-none}
CURRENT: ${CURRENT_PHASE}
${PHASE_DESC}"

[[ $PENDING_AMENDMENTS -gt 0 ]] && PROMPT+="
PENDING AMENDMENTS: ${PENDING_AMENDMENTS} — see amendments array in state.json below."

[[ -n "$QUALITY_GATES" ]] && PROMPT+="

QUALITY GATES: ${QUALITY_GATES}"

# --- Inject state files ---
PROMPT+="

=== STATE FILES (auto-injected — do NOT re-read these) ===

--- tmp/ship/state.json ---
${STATE_JSON_CONTENT}
---"

if [[ -n "$SPEC_CONTENT" ]]; then
  PROMPT+="

--- ${SPEC_PATH} ---
${SPEC_CONTENT}
---"
fi

if [[ -n "$SPEC_JSON_CONTENT" ]]; then
  PROMPT+="

--- ${SPEC_JSON_PATH} ---
${SPEC_JSON_CONTENT}
---"
fi

if [[ -n "$PROGRESS_CONTENT" ]]; then
  PROMPT+="

--- tmp/ship/progress.txt ---
${PROGRESS_CONTENT}
---"
fi

PROMPT+="

=== END STATE FILES ===

=== GIT STATE (auto-injected — do NOT run git status, git log, or git diff --stat) ===
Working directory: ${GIT_CWD}
Branch: ${GIT_BRANCH_STATUS:-<unknown>}

Uncommitted changes (filtered: lock files, build artifacts, tmp/ship/):
${GIT_STATUS:-<clean>}

Diffstat (uncommitted, filtered):
${GIT_DIFFSTAT:-<no changes>}

Commits on branch (no merges):
${GIT_LOG:-<no commits>}
=== END GIT STATE ===

Continue from where you left off. All state files and git state are injected above — do not re-read them or run git status/log/diff.

RULES:
- Do NOT restart from Phase 0 or revisit completed phases.
- Do NOT skip any phase. Every phase runs — scope calibration (${SCOPE:-feature}) determines depth.
- After completing each phase, update tmp/ship/state.json: set currentPhase to the next phase, append the completed phase to completedPhases, refresh lastUpdated.
- Delegate investigation to subagents to conserve your context window.
- When you need user input for decisions requiring human judgment, output <input>Input required</input> at the START of your message, then provide a full decision brief (situation, context gathered, options with trade-offs, your recommendation). Only pause after thorough research.
- When ALL phases through Phase 6 are complete, set tmp/ship/state.json currentPhase to \"completed\" and output:
  <complete>SHIP COMPLETE</complete>
- Do NOT output a false promise. The loop continues until genuine completion."

# Update iteration in state file
TEMP_FILE="${LOOP_STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$LOOP_STATE_FILE" > "$TEMP_FILE"
mv "$TEMP_FILE" "$LOOP_STATE_FILE"

# Stamp session_id on first encounter (backward compat for older state files)
if [[ -z "$LOOP_SESSION_ID" ]] && [[ -n "$HOOK_SESSION_ID" ]]; then
  TEMP_FILE="${LOOP_STATE_FILE}.tmp.$$"
  awk -v sid="$HOOK_SESSION_ID" '/^started_at:/{print "session_id: \"" sid "\""}1' "$LOOP_STATE_FILE" > "$TEMP_FILE"
  mv "$TEMP_FILE" "$LOOP_STATE_FILE"
fi

# Build system message — includes full SKILL.md so the agent has complete phase instructions
SYSTEM_MSG="🔄 Ship loop iteration ${NEXT_ITERATION} | Phase: ${CURRENT_PHASE} | To complete: output <complete>SHIP COMPLETE</complete> (ONLY when ALL phases are genuinely done — do not lie to exit!)"

if [[ -n "$SKILL_CONTENT" ]]; then
  SYSTEM_MSG+="

--- SHIP SKILL REFERENCE ---
${SKILL_CONTENT}"
fi

# Log the constructed prompt for debugging (survives compaction for inspection)
if [[ -d "tmp/ship" ]]; then
  echo "$PROMPT" > "tmp/ship/last-prompt.md" 2>/dev/null || true
fi

# Output block decision
jq -n \
  --arg prompt "$PROMPT" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": $prompt,
    "systemMessage": $msg
  }'

exit 0
