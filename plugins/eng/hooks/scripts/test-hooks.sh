#!/usr/bin/env bash
# Layer 1: Unit tests for ship hook scripts.
# Tests each hook in isolation by piping mock JSON stdin and verifying outputs/side-effects.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS=0
FAIL=0
TMPDIR=$(mktemp -d)

cleanup() { rm -rf "$TMPDIR"; rm -f /tmp/ship-injected-test-*; }
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
  local dir="$1" phase="${2:-Phase 3: Implementation}"
  mkdir -p "${dir}/.claude"
  cat > "${dir}/.claude/ship-state.json" << EOF
{
  "currentPhase": "$phase",
  "featureName": "test-feature",
  "specPath": ".claude/specs/test/SPEC.md",
  "prdPath": "prd.json",
  "branch": "feat/test-feature",
  "worktreePath": "../test-feature",
  "prNumber": 42,
  "qualityGates": { "test": "pnpm test --run", "typecheck": "pnpm typecheck", "lint": "pnpm lint" },
  "completedPhases": ["Phase 0", "Phase 1A", "Phase 1B", "Phase 2"],
  "capabilities": { "gh": true, "browser": false, "peekaboo": false, "docker": false },
  "scopeCalibration": "feature",
  "amendments": [],
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

echo "=== Ship Hook Unit Tests ==="
echo ""

# ──────────────────────────────────────
echo "-- ship-session-start.sh --"

# Test 1: No state file -> no output
PROJ="$TMPDIR/t1"
mkdir -p "$PROJ"
OUTPUT=$(echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionStart","session_id":"test-s1","source":"startup"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-start.sh" 2>/dev/null || true)
assert_output_empty "No state file -> empty output" "$OUTPUT"

# Test 2: State file + compact -> outputs additionalContext
PROJ="$TMPDIR/t2"
make_state_file "$PROJ"
OUTPUT=$(echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionStart","session_id":"test-s2","source":"compact"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-start.sh" 2>/dev/null)
assert_output_contains "State file + compact -> has additionalContext" "$OUTPUT" "SHIP WORKFLOW RECOVERY"
assert_output_contains "Output mentions phase" "$OUTPUT" "Phase 3"
assert_output_contains "Output mentions feature" "$OUTPUT" "test-feature"
assert_output_contains "Output includes spec path" "$OUTPUT" "specs/test/SPEC.md"
assert_output_contains "Output includes PR number" "$OUTPUT" "#42"
assert_output_contains "Output includes branch" "$OUTPUT" "feat/test-feature"
assert_output_contains "Output includes quality gates" "$OUTPUT" "pnpm test"

# Test 2b: State file with pending amendments -> mentions amendments
PROJ="$TMPDIR/t2b"
make_state_file "$PROJ"
# Add a pending amendment
jq '.amendments = [{"description":"Add dark mode toggle","status":"pending"}]' \
  "${PROJ}/.claude/ship-state.json" > "${PROJ}/.claude/ship-state.tmp" \
  && mv "${PROJ}/.claude/ship-state.tmp" "${PROJ}/.claude/ship-state.json"
OUTPUT=$(echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionStart","session_id":"test-s2b","source":"compact"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-start.sh" 2>/dev/null)
assert_output_contains "Amendments mentioned in injection" "$OUTPUT" "1 pending"

# Test 3: Completed state + startup -> no output
PROJ="$TMPDIR/t3"
make_state_file "$PROJ" "completed"
OUTPUT=$(echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionStart","session_id":"test-s3","source":"startup"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-start.sh" 2>/dev/null || true)
assert_output_empty "Completed + startup -> empty output" "$OUTPUT"

# Test 4: Compact source -> clears injection marker
PROJ="$TMPDIR/t4"
make_state_file "$PROJ"
touch "/tmp/ship-injected-test-s4"
echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionStart","session_id":"test-s4","source":"compact"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-start.sh" >/dev/null 2>&1
assert_file_not_exists "Compact clears injection marker" "/tmp/ship-injected-test-s4"

echo ""

# ──────────────────────────────────────
echo "-- ship-pre-compact.sh --"

# Test 5: No state file -> no-op
PROJ="$TMPDIR/t5"
mkdir -p "$PROJ/.claude"
echo '{"cwd":"'"$PROJ"'","hook_event_name":"PreCompact","session_id":"test-s5","trigger":"auto"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-pre-compact.sh" 2>/dev/null || true
BACKUP_COUNT=$(find "${PROJ}/.claude" -name "ship-state.backup-*.json" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$BACKUP_COUNT" -eq 0 ]]; then
  echo "  PASS: No state file -> no backup"
  PASS=$((PASS + 1))
else
  echo "  FAIL: No state file -> no backup (found $BACKUP_COUNT backups)"
  FAIL=$((FAIL + 1))
fi

# Test 6: State file -> creates backup
PROJ="$TMPDIR/t6"
make_state_file "$PROJ"
echo '{"cwd":"'"$PROJ"'","hook_event_name":"PreCompact","session_id":"test-s6","trigger":"auto"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-pre-compact.sh" 2>/dev/null
BACKUP_COUNT=$(find "${PROJ}/.claude" -name "ship-state.backup-*.json" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$BACKUP_COUNT" -ge 1 ]]; then
  echo "  PASS: PreCompact creates backup ($BACKUP_COUNT file(s))"
  PASS=$((PASS + 1))
else
  echo "  FAIL: PreCompact did not create backup"
  FAIL=$((FAIL + 1))
fi

echo ""

# ──────────────────────────────────────
echo "-- ship-prompt-inject.sh --"

# Test 7: No state file -> no output
PROJ="$TMPDIR/t7"
mkdir -p "$PROJ"
OUTPUT=$(echo '{"cwd":"'"$PROJ"'","hook_event_name":"UserPromptSubmit","session_id":"test-s7","prompt":"hello"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-prompt-inject.sh" 2>/dev/null || true)
assert_output_empty "No state file -> empty output" "$OUTPUT"

# Test 8: State file, first prompt -> injects context
PROJ="$TMPDIR/t8"
make_state_file "$PROJ"
rm -f "/tmp/ship-injected-test-s8"
OUTPUT=$(echo '{"cwd":"'"$PROJ"'","hook_event_name":"UserPromptSubmit","session_id":"test-s8","prompt":"continue"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-prompt-inject.sh" 2>/dev/null)
assert_output_contains "First prompt -> injects context" "$OUTPUT" "SHIP WORKFLOW ACTIVE"
assert_file_exists "Marker created" "/tmp/ship-injected-test-s8"

# Test 9: Second prompt (already injected) -> no output
OUTPUT=$(echo '{"cwd":"'"$PROJ"'","hook_event_name":"UserPromptSubmit","session_id":"test-s8","prompt":"continue again"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-prompt-inject.sh" 2>/dev/null || true)
assert_output_empty "Second prompt -> no re-injection" "$OUTPUT"

echo ""

# ──────────────────────────────────────
echo "-- ship-session-end.sh --"

# Test 10: Completed state -> deletes file + backups
PROJ="$TMPDIR/t10"
make_state_file "$PROJ" "completed"
touch "${PROJ}/.claude/ship-state.backup-20260215-100000.json"
echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionEnd","session_id":"test-s10","reason":"other"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-end.sh" 2>/dev/null
assert_file_not_exists "Completed -> state deleted" "${PROJ}/.claude/ship-state.json"
assert_file_not_exists "Completed -> backup deleted" "${PROJ}/.claude/ship-state.backup-20260215-100000.json"

# Test 11: Incomplete state -> preserves file
PROJ="$TMPDIR/t11"
make_state_file "$PROJ" "Phase 4: Testing"
echo '{"cwd":"'"$PROJ"'","hook_event_name":"SessionEnd","session_id":"test-s11","reason":"other"}' \
  | CLAUDE_PROJECT_DIR="$PROJ" "$SCRIPT_DIR/ship-session-end.sh" 2>/dev/null
assert_file_exists "Incomplete -> state preserved" "${PROJ}/.claude/ship-state.json"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
