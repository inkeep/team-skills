#!/usr/bin/env bash
# Layer 2: Integration test — Claude subprocess reads ship-state.json.
# Tests the "tripwire" pattern: the state file itself is enough for Claude
# to understand the workflow state, even without hook injection.
set -euo pipefail

TMPDIR=$(mktemp -d)
cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

echo "=== Ship State Integration Test (Layer 2) ==="
echo ""

# Set up a minimal project
cd "$TMPDIR"
git init -q
mkdir -p tmp/ship

# Write a ship-state.json
cat > tmp/ship/state.json << 'EOF'
{
  "currentPhase": "Phase 2: Implementation",
  "featureName": "email-integration",
  "specPath": ".claude/specs/email/SPEC.md",
  "specJsonPath": "tmp/ship/spec.json",
  "completedPhases": ["Phase 0", "Phase 1"],
  "qualityGates": { "test": "pnpm test --run", "typecheck": "pnpm typecheck", "lint": "pnpm lint" },
  "lastUpdated": "2026-02-15T10:30:00Z"
}
EOF

echo "State file created. Running Claude subprocess..."
echo ""

# Run Claude in subprocess mode — ask it to read the state file
RESPONSE=$(env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
  -p "Read the file tmp/ship/state.json and tell me: what phase is the ship workflow at? Just output the phase name, nothing else." \
  --dangerously-skip-permissions \
  --max-turns 5 \
  --output-format json 2>&1 || true)

echo "Response: $RESPONSE"
echo ""

# Check response mentions Phase 2
if echo "$RESPONSE" | grep -qi "Phase 2"; then
  echo "PASS: Claude correctly identified Phase 2 from state file"
  exit 0
else
  echo "FAIL: Claude did not identify Phase 2 in response"
  exit 1
fi
