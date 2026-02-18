#!/usr/bin/env bash
# Layer 1: Unit tests for ship hook scripts.
# Tests ship-stop-hook.sh and ship-session-end.sh in isolation.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS=0
FAIL=0
TMPDIR=$(mktemp -d)

cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

assert_output_empty() {
  local label="$1" output="$2"
  if [[ -z "$output" ]]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (expected empty, got: $output)"
    FAIL=$((FAIL + 1))
  fi
}

assert_output_contains() {
  local label="$1" output="$2" pattern="$3"
  if echo "$output" | grep -q "$pattern"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (pattern '$pattern' not found in output)"
    FAIL=$((FAIL + 1))
  fi
}

assert_file_exists() {
  local label="$1" path="$2"
  if [[ -f "$path" ]]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (file not found: $path)"
    FAIL=$((FAIL + 1))
  fi
}

assert_file_not_exists() {
  local label="$1" path="$2"
  if [[ ! -f "$path" ]]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (file unexpectedly exists: $path)"
    FAIL=$((FAIL + 1))
  fi
}

make_state_file() {
  local dir="$1" phase="${2:-Phase 2}"
  mkdir -p "${dir}/tmp/ship"
  cat > "${dir}/tmp/ship/state.json" << EOF
{
  "currentPhase": "$phase",
  "featureName": "test-feature",
  "specPath": ".claude/specs/test/SPEC.md",
  "specJsonPath": "tmp/ship/spec.json",
  "branch": "feat/test-feature",
  "worktreePath": "../test-feature",
  "prNumber": 42,
  "qualityGates": { "test": "pnpm test --run", "typecheck": "pnpm typecheck", "lint": "pnpm lint" },
  "completedPhases": ["Phase 0", "Phase 1"],
  "capabilities": { "gh": true, "browser": false, "peekaboo": false, "docker": false },
  "scopeCalibration": "feature",
  "amendments": [],
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

make_loop_file() {
  local dir="$1" iteration="${2:-1}" max="${3:-20}"
  mkdir -p "${dir}/tmp/ship"
  cat > "${dir}/tmp/ship/loop.md" << EOF
---
active: true
iteration: $iteration
max_iterations: $max
completion_promise: "SHIP COMPLETE"
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---
EOF
}

make_transcript() {
  local path="$1" text="$2"
  # Create a JSONL transcript with an assistant message
  echo '{"role":"assistant","message":{"content":[{"type":"text","text":"'"$text"'"}]}}' > "$path"
}

echo "=== Ship Hook Unit Tests ==="
echo ""

# ──────────────────────────────────────
echo "-- ship-stop-hook.sh --"

# Test 1: No loop state file -> allow exit (empty output)
PROJ="$TMPDIR/t1"
mkdir -p "$PROJ"
OUTPUT=$(echo '{"transcript_path":"/dev/null"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null || true)
assert_output_empty "No loop file -> allow exit" "$OUTPUT"

# Test 2: Loop active, no completion promise in transcript -> block exit
PROJ="$TMPDIR/t2"
make_state_file "$PROJ"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript2.jsonl"
make_transcript "$TRANSCRIPT" "I am working on Phase 2. Let me continue implementing."
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Active loop -> blocks exit" "$OUTPUT" '"decision": "block"'
assert_output_contains "Block includes phase" "$OUTPUT" "Phase 2"
assert_output_contains "Block includes feature name" "$OUTPUT" "test-feature"
assert_output_contains "Block includes branch" "$OUTPUT" "feat/test-feature"
assert_output_contains "Block includes spec path" "$OUTPUT" "specs/test/SPEC.md"

# Test 2b: Loop active, agent outputs <input> -> allow exit, keep loop file
PROJ="$TMPDIR/t2b"
make_state_file "$PROJ"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript2b.jsonl"
make_transcript "$TRANSCRIPT" "<input>Input required</input> The reviewer is requesting OAuth support. This was not in the original spec. I researched the options and here are the trade-offs..."
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>&1)
# Should allow exit (no JSON block output on stdout)
STDOUT_ONLY=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null || true)
assert_output_empty "Pause -> allows exit (no block)" "$STDOUT_ONLY"
assert_file_exists "Pause -> loop file kept" "$PROJ/tmp/ship/loop.md"
# Verify iteration was NOT incremented
ITER_AFTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$PROJ/tmp/ship/loop.md" \
  | grep '^iteration:' | sed 's/iteration: *//')
if [[ "$ITER_AFTER" -eq 1 ]]; then
  echo "  PASS: Pause -> iteration not incremented"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Pause -> iteration should be 1, got $ITER_AFTER"
  FAIL=$((FAIL + 1))
fi

# Test 3: Loop active, completion promise BUT state not completed -> block exit
PROJ="$TMPDIR/t3"
make_state_file "$PROJ" "Phase 6"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript3.jsonl"
make_transcript "$TRANSCRIPT" "All done! <complete>SHIP COMPLETE</complete>"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>&1)
# Two-part gate: promise detected but state says Phase 6, not completed
assert_output_contains "Promise but not completed -> continues" "$OUTPUT" "not.*completed"

# Test 4: Loop active, completion promise AND state = completed -> allow exit
PROJ="$TMPDIR/t4"
make_state_file "$PROJ" "completed"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript4.jsonl"
make_transcript "$TRANSCRIPT" "Everything is done. <complete>SHIP COMPLETE</complete>"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>&1)
assert_file_not_exists "Completed -> loop file removed" "$PROJ/tmp/ship/loop.md"

# Test 5: Max iterations reached -> allow exit
PROJ="$TMPDIR/t5"
make_state_file "$PROJ"
make_loop_file "$PROJ" 20 20
TRANSCRIPT="$TMPDIR/transcript5.jsonl"
make_transcript "$TRANSCRIPT" "Still working..."
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>&1)
assert_file_not_exists "Max iterations -> loop file removed" "$PROJ/tmp/ship/loop.md"

# Test 6: Iteration counter increments
PROJ="$TMPDIR/t6"
make_state_file "$PROJ"
make_loop_file "$PROJ" 3 20
TRANSCRIPT="$TMPDIR/transcript6.jsonl"
make_transcript "$TRANSCRIPT" "Working on implementation..."
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
CURRENT_ITER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$PROJ/tmp/ship/loop.md" \
  | grep '^iteration:' | sed 's/iteration: *//')
if [[ "$CURRENT_ITER" -eq 4 ]]; then
  echo "  PASS: Iteration incremented from 3 to 4"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Iteration should be 4, got $CURRENT_ITER"
  FAIL=$((FAIL + 1))
fi

# Test 7: Corrupted state file (non-numeric iteration) -> allow exit + cleanup
PROJ="$TMPDIR/t7"
mkdir -p "$PROJ/tmp/ship"
cat > "$PROJ/tmp/ship/loop.md" << 'EOF'
---
active: true
iteration: broken
max_iterations: 20
completion_promise: "SHIP COMPLETE"
---
EOF
TRANSCRIPT="$TMPDIR/transcript7.jsonl"
make_transcript "$TRANSCRIPT" "test"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>&1)
assert_file_not_exists "Corrupted state -> loop file removed" "$PROJ/tmp/ship/loop.md"

# Test 8: Quality gates included in re-injection
PROJ="$TMPDIR/t8"
make_state_file "$PROJ"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript8.jsonl"
make_transcript "$TRANSCRIPT" "continuing work"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Quality gates in prompt" "$OUTPUT" "pnpm test"

# Test 9: Pending amendments mentioned
PROJ="$TMPDIR/t9"
make_state_file "$PROJ"
jq '.amendments = [{"description":"Add dark mode","status":"pending"}]' \
  "${PROJ}/tmp/ship/state.json" > "${PROJ}/tmp/ship/state.tmp" \
  && mv "${PROJ}/tmp/ship/state.tmp" "${PROJ}/tmp/ship/state.json"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript9.jsonl"
make_transcript "$TRANSCRIPT" "continuing"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Amendments mentioned in prompt" "$OUTPUT" "PENDING AMENDMENTS"

# Test 10: SKILL.md content embedded in systemMessage
PROJ="$TMPDIR/t10"
make_state_file "$PROJ"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript10.jsonl"
make_transcript "$TRANSCRIPT" "working on implementation"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "SKILL.md in systemMessage" "$OUTPUT" "SHIP SKILL REFERENCE"
assert_output_contains "SKILL.md has phase content" "$OUTPUT" "Phase 0: Detect context"

# Test 11: State files auto-injected into prompt
PROJ="$TMPDIR/t11_inject"
make_state_file "$PROJ"
make_loop_file "$PROJ"
# Create SPEC.md
mkdir -p "$PROJ/.claude/specs/test"
cat > "$PROJ/.claude/specs/test/SPEC.md" << 'EOF'
# Test Feature Spec
## Problem
We need to test auto-injection of state files.
## Acceptance Criteria
- State files are injected into the prompt
EOF
# Create spec.json
cat > "$PROJ/tmp/ship/spec.json" << 'EOF'
{"stories":[{"id":"S1","title":"Test story","passes":false}]}
EOF
# Create progress.txt
cat > "$PROJ/tmp/ship/progress.txt" << 'EOF'
[Iteration 1] Started S1 — implementing test feature
[Iteration 1] Blocker: missing dependency
EOF
TRANSCRIPT="$TMPDIR/transcript11_inject.jsonl"
make_transcript "$TRANSCRIPT" "working on implementation"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "state.json injected" "$OUTPUT" "featureName"
assert_output_contains "SPEC.md injected" "$OUTPUT" "test auto-injection"
assert_output_contains "spec.json injected" "$OUTPUT" "Test story"
assert_output_contains "progress.txt injected" "$OUTPUT" "missing dependency"
assert_output_contains "Do not re-read instruction" "$OUTPUT" "do NOT re-read"

# Test 12: progress.txt truncation (large file)
PROJ="$TMPDIR/t12_trunc"
make_state_file "$PROJ"
make_loop_file "$PROJ"
# Create a 150-line progress.txt
for i in $(seq 1 150); do
  echo "[Iteration $i] Line $i of progress" >> "$PROJ/tmp/ship/progress.txt"
done
TRANSCRIPT="$TMPDIR/transcript12_trunc.jsonl"
make_transcript "$TRANSCRIPT" "working"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "progress.txt truncated" "$OUTPUT" "truncated"
assert_output_contains "Truncated shows last lines" "$OUTPUT" "Line 150"

# Test 13: Git state auto-injected into prompt
PROJ="$TMPDIR/t13_git"
make_state_file "$PROJ"
make_loop_file "$PROJ"
# Initialize a git repo with a base commit on main, then a feature branch with work
(cd "$PROJ" && git init -q -b main && git add -A && git commit -q -m "initial commit" \
  && git checkout -q -b feat/test-feature \
  && echo "feature work" > feature.txt && git add feature.txt && git commit -q -m "feat: implement feature" \
  && echo "new file" > newfile.txt)
TRANSCRIPT="$TMPDIR/transcript13_git.jsonl"
make_transcript "$TRANSCRIPT" "working on implementation"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Git state section present" "$OUTPUT" "GIT STATE"
assert_output_contains "git status injected" "$OUTPUT" "newfile.txt"
assert_output_contains "git log injected" "$OUTPUT" "feat: implement feature"
assert_output_contains "Working directory injected" "$OUTPUT" "$PROJ"
assert_output_contains "Do not run git status instruction" "$OUTPUT" "do NOT run git status"
assert_output_contains "Diffstat section present" "$OUTPUT" "Diffstat"
assert_output_contains "Branch tracking present" "$OUTPUT" "Branch:"

# Test 14: Git state filters noise (lock files, tmp/ship/, build artifacts)
PROJ="$TMPDIR/t14_filter"
make_state_file "$PROJ"
make_loop_file "$PROJ"
(cd "$PROJ" && git init -q && git add -A && git commit -q -m "initial commit")
# Create files that should be filtered
echo "lock" > "$PROJ/pnpm-lock.yaml"
echo "lock" > "$PROJ/package-lock.json"
mkdir -p "$PROJ/dist" && echo "build" > "$PROJ/dist/bundle.js"
# Create a file that should NOT be filtered
echo "real change" > "$PROJ/src-change.ts"
TRANSCRIPT="$TMPDIR/transcript14_filter.jsonl"
make_transcript "$TRANSCRIPT" "working"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Real file shown" "$OUTPUT" "src-change.ts"
# Lock files and build artifacts should be filtered from status
if echo "$OUTPUT" | grep -q "pnpm-lock.yaml"; then
  echo "  FAIL: Lock file should be filtered (pnpm-lock.yaml found)"
  FAIL=$((FAIL + 1))
else
  echo "  PASS: Lock file filtered from status"
  PASS=$((PASS + 1))
fi
if echo "$OUTPUT" | grep "Uncommitted" -A 50 | grep "dist/" | grep -qv "filtered"; then
  echo "  FAIL: Build artifact should be filtered (dist/ found in status)"
  FAIL=$((FAIL + 1))
else
  echo "  PASS: Build artifacts filtered from status"
  PASS=$((PASS + 1))
fi

# Test 14b: Git state with no repo (non-git directory)
PROJ="$TMPDIR/t14b_nogit"
make_state_file "$PROJ"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript14b_nogit.jsonl"
make_transcript "$TRANSCRIPT" "working"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "No-git still has section" "$OUTPUT" "GIT STATE"
assert_output_contains "No-git shows clean status" "$OUTPUT" "<clean>"

# Test 14c: Branch-scoped log (only feature branch commits, no merges)
PROJ="$TMPDIR/t14c_branch"
make_state_file "$PROJ"
make_loop_file "$PROJ"
(cd "$PROJ" && git init -q && git add -A && git commit -q -m "base commit on main" \
  && git checkout -q -b feat/test-feature \
  && echo "feature" > feature.txt && git add feature.txt && git commit -q -m "feat: add feature")
TRANSCRIPT="$TMPDIR/transcript14c_branch.jsonl"
make_transcript "$TRANSCRIPT" "working"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Branch commit shown" "$OUTPUT" "feat: add feature"
# The base commit should NOT appear (it's on main, before merge-base)
if echo "$OUTPUT" | grep "Commits on branch" -A 10 | grep -q "base commit on main"; then
  echo "  FAIL: Base branch commit should be excluded from scoped log"
  FAIL=$((FAIL + 1))
else
  echo "  PASS: Log scoped to feature branch only"
  PASS=$((PASS + 1))
fi

# Test 15: Session isolation — different session_id allows exit
PROJ="$TMPDIR/t15_session"
make_state_file "$PROJ"
mkdir -p "$PROJ/tmp/ship"
# Create loop file with a session_id already stamped
cat > "$PROJ/tmp/ship/loop.md" << 'EOF'
---
active: true
iteration: 1
max_iterations: 20
completion_promise: "SHIP COMPLETE"
session_id: "session-AAAA"
started_at: "2026-02-17T00:00:00Z"
---
EOF
TRANSCRIPT="$TMPDIR/transcript15_session.jsonl"
make_transcript "$TRANSCRIPT" "working on implementation"
# Pass a DIFFERENT session_id in hook input
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'","session_id":"session-BBBB"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null || true)
assert_output_empty "Different session -> allows exit" "$OUTPUT"
assert_file_exists "Different session -> loop file preserved" "$PROJ/tmp/ship/loop.md"

# Test 15b: Session isolation — same session_id blocks exit
PROJ="$TMPDIR/t15b_session"
make_state_file "$PROJ"
mkdir -p "$PROJ/tmp/ship"
cat > "$PROJ/tmp/ship/loop.md" << 'EOF'
---
active: true
iteration: 1
max_iterations: 20
completion_promise: "SHIP COMPLETE"
session_id: "session-AAAA"
started_at: "2026-02-17T00:00:00Z"
---
EOF
TRANSCRIPT="$TMPDIR/transcript15b_session.jsonl"
make_transcript "$TRANSCRIPT" "working on implementation"
# Pass the SAME session_id
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'","session_id":"session-AAAA"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Same session -> blocks exit" "$OUTPUT" '"decision": "block"'

# Test 15c: Session isolation — no session_id in loop.md (backward compat) -> still blocks
PROJ="$TMPDIR/t15c_session"
make_state_file "$PROJ"
make_loop_file "$PROJ"  # standard loop file with no session_id
TRANSCRIPT="$TMPDIR/transcript15c_session.jsonl"
make_transcript "$TRANSCRIPT" "working on implementation"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'","session_id":"session-CCCC"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "No session_id in loop -> blocks (backward compat)" "$OUTPUT" '"decision": "block"'

# Test 15d: Session_id gets stamped on first encounter
# After 15c, the loop file should now have session-CCCC stamped
LOOP_CONTENT=$(cat "$PROJ/tmp/ship/loop.md")
if echo "$LOOP_CONTENT" | grep -q 'session_id: "session-CCCC"'; then
  echo "  PASS: Session_id stamped on first encounter"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Session_id not stamped (expected session-CCCC in loop.md)"
  FAIL=$((FAIL + 1))
fi

# Test 15e: After stamping, a different session is isolated
TRANSCRIPT="$TMPDIR/transcript15e_session.jsonl"
make_transcript "$TRANSCRIPT" "working"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'","session_id":"session-DDDD"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null || true)
assert_output_empty "After stamp, different session -> allows exit" "$OUTPUT"

# Test 16: Prompt logging — last-prompt.md written on re-injection
PROJ="$TMPDIR/t16_prompt_log"
make_state_file "$PROJ"
make_loop_file "$PROJ"
TRANSCRIPT="$TMPDIR/transcript16_prompt_log.jsonl"
make_transcript "$TRANSCRIPT" "working on implementation"
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_file_exists "Prompt logged to last-prompt.md" "$PROJ/tmp/ship/last-prompt.md"
LOGGED_PROMPT=$(cat "$PROJ/tmp/ship/last-prompt.md")
if echo "$LOGGED_PROMPT" | grep -q "SHIP-LOOP"; then
  echo "  PASS: Logged prompt contains [SHIP-LOOP] header"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Logged prompt missing [SHIP-LOOP] header"
  FAIL=$((FAIL + 1))
fi
if echo "$LOGGED_PROMPT" | grep -q "test-feature"; then
  echo "  PASS: Logged prompt contains feature name"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Logged prompt missing feature name"
  FAIL=$((FAIL + 1))
fi

echo ""

# ──────────────────────────────────────
echo "-- ship-session-end.sh --"

# Test 17: Completed state -> deletes file + backups
PROJ="$TMPDIR/t17"
make_state_file "$PROJ" "completed"
touch "${PROJ}/tmp/ship/state.backup-20260215-100000.json"
echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionEnd","session_id":"test-s17","reason":"other"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-end.sh" 2>/dev/null
assert_file_not_exists "Completed -> state deleted" "${PROJ}/tmp/ship/state.json"
assert_file_not_exists "Completed -> backup deleted" "${PROJ}/tmp/ship/state.backup-20260215-100000.json"

# Test 18: Incomplete state -> preserves file
PROJ="$TMPDIR/t18"
make_state_file "$PROJ" "Phase 3"
echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionEnd","session_id":"test-s18","reason":"other"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-end.sh" 2>/dev/null
assert_file_exists "Incomplete -> state preserved" "${PROJ}/tmp/ship/state.json"

# Test 19: Worktree resolution — state files in worktree, hook runs from main repo
PROJ="$TMPDIR/t19_worktree"
mkdir -p "$PROJ"
(cd "$PROJ" && git init -q -b main && echo "init" > init.txt && git add -A && git commit -q -m "init")
WORKTREE="$TMPDIR/t19_wt"
(cd "$PROJ" && git worktree add -q -b feat/test "$WORKTREE")
# State files in the WORKTREE, not the main repo
make_state_file "$WORKTREE"
make_loop_file "$WORKTREE"
TRANSCRIPT="$TMPDIR/transcript19_wt.jsonl"
make_transcript "$TRANSCRIPT" "working on implementation"
# Run hook from the MAIN REPO (not the worktree) — simulates real hook execution
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT"'"}' \
  | (cd "$PROJ" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Worktree: finds state and blocks exit" "$OUTPUT" '"decision": "block"'
assert_output_contains "Worktree: includes feature name" "$OUTPUT" "test-feature"

# Test 19b: Worktree resolution with cwd hint — tries cwd first
PROJ2="$TMPDIR/t19b_worktree"
mkdir -p "$PROJ2"
(cd "$PROJ2" && git init -q -b main && echo "init" > init.txt && git add -A && git commit -q -m "init")
WORKTREE2="$TMPDIR/t19b_wt"
(cd "$PROJ2" && git worktree add -q -b feat/test2 "$WORKTREE2")
make_state_file "$WORKTREE2"
make_loop_file "$WORKTREE2"
TRANSCRIPT2="$TMPDIR/transcript19b_wt.jsonl"
make_transcript "$TRANSCRIPT2" "working"
# Pass cwd in hook input — hook should find state via cwd hint
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT2"'","cwd":"'"$WORKTREE2"'"}' \
  | (cd "$PROJ2" && "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "Worktree cwd hint: blocks exit" "$OUTPUT" '"decision": "block"'

# Test 20a: CLAUDE_PROJECT_DIR resolution — hook runs from plugin dir, state in project dir
PROJ_PLUGIN="$TMPDIR/t20a_plugin_dir"
PROJ_PROJECT="$TMPDIR/t20a_project"
mkdir -p "$PROJ_PLUGIN" "$PROJ_PROJECT"
(cd "$PROJ_PROJECT" && git init -q -b main && echo "init" > init.txt && git add -A && git commit -q -m "init")
make_loop_file "$PROJ_PROJECT"
make_state_file "$PROJ_PROJECT" "Phase 2"
TRANSCRIPT_20a="$TMPDIR/transcript20a.jsonl"
make_transcript "$TRANSCRIPT_20a" "working on implementation"
# Run hook from the PLUGIN directory (not the project) — simulates real plugin hook execution
OUTPUT=$(echo '{"transcript_path":"'"$TRANSCRIPT_20a"'"}' \
  | (cd "$PROJ_PLUGIN" && CLAUDE_PROJECT_DIR="$PROJ_PROJECT" "$SCRIPT_DIR/ship-stop-hook.sh") 2>/dev/null)
assert_output_contains "CLAUDE_PROJECT_DIR: blocks exit from plugin dir" "$OUTPUT" '"decision": "block"'
assert_output_contains "CLAUDE_PROJECT_DIR: includes feature name" "$OUTPUT" "test-feature"

# Test 20: Session-end worktree resolution — finds completed state in worktree
PROJ3="$TMPDIR/t20_wt_end"
mkdir -p "$PROJ3"
(cd "$PROJ3" && git init -q -b main && echo "init" > init.txt && git add -A && git commit -q -m "init")
WORKTREE3="$TMPDIR/t20_wt_end_wt"
(cd "$PROJ3" && git worktree add -q -b feat/test3 "$WORKTREE3")
make_state_file "$WORKTREE3" "completed"
echo '{"cwd":"'"$PROJ3"'","hook_event_name":"SessionEnd","session_id":"test-s20","reason":"other"}' \
  | CLAUDE_PROJECT_DIR="$PROJ3" "$SCRIPT_DIR/ship-session-end.sh" 2>/dev/null
assert_file_not_exists "Session-end worktree: completed state deleted" "${WORKTREE3}/tmp/ship/state.json"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
