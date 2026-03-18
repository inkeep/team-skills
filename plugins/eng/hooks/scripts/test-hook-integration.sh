#!/usr/bin/env bash
# Layer 3: Live Claude hook integration test.
# Verifies a real Claude Stop hook fires and that ship-stop-hook.sh
# rewrites state and emits artifacts deterministically.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMPDIR=$(mktemp -d)

cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

fail() {
  echo "FAIL: $1"
  exit 1
}

assert_file_exists() {
  local label="$1"
  local path="$2"
  [[ -f "$path" ]] || fail "$label (missing: $path)"
  echo "PASS: $label"
}

assert_file_contains() {
  local label="$1"
  local path="$2"
  local pattern="$3"
  grep -Eq "$pattern" "$path" || fail "$label (pattern '$pattern' not found in $path)"
  echo "PASS: $label"
}

assert_jq_equals() {
  local label="$1"
  local path="$2"
  local query="$3"
  local expected="$4"
  local actual
  actual=$(jq -r "$query" "$path" 2>/dev/null || echo "__jq_error__")
  [[ "$actual" == "$expected" ]] || fail "$label (expected '$expected', got '$actual')"
  echo "PASS: $label"
}

assert_jq_nonempty() {
  local label="$1"
  local path="$2"
  local query="$3"
  local actual
  actual=$(jq -r "$query" "$path" 2>/dev/null || echo "__jq_error__")
  [[ -n "$actual" && "$actual" != "null" && "$actual" != "__jq_error__" ]] || fail "$label (query '$query' returned '$actual')"
  echo "PASS: $label"
}

echo "=== Ship Stop Hook Integration Test (Layer 3) ==="
echo ""

cd "$TMPDIR"
git init -q
mkdir -p .claude/specs/auth
mkdir -p tmp/ship

cat > .claude/specs/auth/SPEC.md << 'EOF'
# Auth Flow

## Goal
Prove the live Stop hook path is active.
EOF

# Start in Phase 3 with Phase 2 marked complete so the live stop hook must
# evaluate the Phase 2 exit gate and roll the workflow back to Phase 2.
cat > tmp/ship/state.json << 'EOF'
{
  "currentPhase": "Phase 3",
  "featureName": "auth-flow",
  "specPath": ".claude/specs/auth/SPEC.md",
  "specJsonPath": "tmp/ship/spec.json",
  "branch": "feat/auth-flow",
  "worktreePath": null,
  "prNumber": 99,
  "qualityGates": { "test": "", "typecheck": "", "lint": "" },
  "completedPhases": ["Phase 0", "Phase 1", "Phase 2"],
  "capabilities": { "gh": true, "browser": false, "peekaboo": false, "docker": false },
  "scopeCalibration": "feature",
  "amendments": [],
  "lastUpdated": "2026-02-15T14:00:00Z"
}
EOF

cat > tmp/ship/loop.md << 'EOF'
---
active: true
iteration: 1
max_iterations: 3
completion_promise: "SHIP COMPLETE"
started_at: "2026-02-15T14:00:00Z"
---
EOF

HOOK_WRAPPER="$TMPDIR/stop-hook-wrapper.sh"
cat > "$HOOK_WRAPPER" << EOF
#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="$TMPDIR/tmp/ship/hook-input.json"
OUTPUT_FILE="$TMPDIR/tmp/ship/hook-output.json"

cat > "\$INPUT_FILE"

if output=\$("${SCRIPT_DIR}/ship-stop-hook.sh" < "\$INPUT_FILE"); then
  status=0
else
  status=\$?
fi

printf '%s' "\$output" > "\$OUTPUT_FILE"
printf '%s' "\$output"
exit "\$status"
EOF
chmod +x "$HOOK_WRAPPER"

cat > .claude/settings.json << EOF
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$HOOK_WRAPPER"
          }
        ]
      }
    ]
  }
}
EOF

echo "State file + loop file created. Running Claude subprocess..."
echo ""

set +e
RESPONSE=$(CLAUDE_PROJECT_DIR="$TMPDIR" env -u ANTHROPIC_API_KEY -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
  -p "Reply with exactly: ok" \
  --dangerously-skip-permissions \
  --max-turns 1 \
  --settings "$TMPDIR/.claude/settings.json" \
  --output-format json 2>&1)
STATUS=$?
set -e

echo "Exit status: $STATUS"
echo "Response: $RESPONSE"
echo ""

assert_file_exists "Hook input captured" "$TMPDIR/tmp/ship/hook-input.json"
assert_file_exists "Hook output captured" "$TMPDIR/tmp/ship/hook-output.json"
assert_file_exists "Re-injected prompt written" "$TMPDIR/tmp/ship/last-prompt.md"
assert_file_exists "Metrics file written" "$TMPDIR/tmp/ship/metrics.json"

assert_jq_equals "Hook event is Stop" "$TMPDIR/tmp/ship/hook-input.json" '.hook_event_name' "Stop"
assert_jq_nonempty "Hook session id captured" "$TMPDIR/tmp/ship/hook-input.json" '.session_id'
assert_jq_nonempty "Hook transcript path captured" "$TMPDIR/tmp/ship/hook-input.json" '.transcript_path'
assert_jq_equals "Hook blocks exit" "$TMPDIR/tmp/ship/hook-output.json" '.decision' "block"
assert_jq_equals "Workflow rolled back to Phase 2" "$TMPDIR/tmp/ship/state.json" '.currentPhase' "Phase 2"
assert_jq_equals "Metrics report Phase 2 as current" "$TMPDIR/tmp/ship/metrics.json" '.currentPhase' "Phase 2"
assert_jq_equals "Phase 2 iteration count recorded" "$TMPDIR/tmp/ship/metrics.json" '.phaseMetrics["Phase 2"].iterations' "1"
assert_jq_nonempty "Metrics report generatedAt timestamp" "$TMPDIR/tmp/ship/metrics.json" '.generatedAt'
assert_file_contains "Loop iteration incremented" "$TMPDIR/tmp/ship/loop.md" '^iteration: 2$'
assert_file_contains "Re-injected prompt mentions Phase 2" "$TMPDIR/tmp/ship/last-prompt.md" 'CURRENT: Phase 2'
assert_file_contains "Re-injected prompt explains gate failure" "$TMPDIR/tmp/ship/last-prompt.md" 'Exit gate for Phase 2 failed'

echo ""
echo "PASS: Live Claude stop hook fired and ship state was rewritten deterministically"
