#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASS=0
FAIL=0
TMPDIR=$(mktemp -d)

cleanup() { rm -rf "$TMPDIR"; }
trap cleanup EXIT

pass() {
  echo "  PASS: $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "  FAIL: $1"
  FAIL=$((FAIL + 1))
}

assert_contains() {
  local label="$1" file="$2" expected="$3"
  if grep -Fq "$expected" "$file"; then
    pass "$label"
  else
    fail "$label (missing '$expected')"
  fi
}

REVIEW_FILE="$TMPDIR/review-output.md"
STATUS_FILE="$TMPDIR/review-status.json"
STATE_FILE="$TMPDIR/state.json"
OUTPUT_FILE="$TMPDIR/review-fix.prompt.md"

cat > "$REVIEW_FILE" <<'EOF'
## PR Review Summary
**(2) Total Issues** | Risk: **High** | Recommendation: **REQUEST CHANGES**

### Critical (1)
- Missing null check in auth path.

### Major (1)
- No regression test covers the new branch.
EOF

cat > "$STATUS_FILE" <<'EOF'
{
  "blocking": true,
  "risk": "High",
  "recommendation": "REQUEST_CHANGES",
  "recommendationDisplay": "REQUEST CHANGES",
  "totalIssues": 2,
  "blockingReasons": [
    "Recommendation is REQUEST_CHANGES",
    "1 Critical finding(s) remain",
    "1 Major finding(s) remain"
  ]
}
EOF

cat > "$STATE_FILE" <<'EOF'
{
  "specPath": "specs/review-hardening/SPEC.md",
  "qualityGates": {
    "test": "pnpm test --filter ship",
    "typecheck": "pnpm typecheck",
    "lint": ""
  }
}
EOF

echo "=== build-local-review-fix-prompt.sh tests ==="
echo ""

"$SCRIPT_DIR/build-local-review-fix-prompt.sh" \
  --review "$REVIEW_FILE" \
  --status "$STATUS_FILE" \
  --state "$STATE_FILE" \
  --output "$OUTPUT_FILE" \
  --guidance "Prefer targeted fixes over broad refactors." >/dev/null

assert_contains "Prompt mentions review summary" "$OUTPUT_FILE" 'Review summary:'
assert_contains "Prompt includes spec path" "$OUTPUT_FILE" 'specs/review-hardening/SPEC.md'
assert_contains "Prompt includes blocking reason" "$OUTPUT_FILE" 'Recommendation is REQUEST_CHANGES'
assert_contains "Prompt includes quality gate" "$OUTPUT_FILE" 'pnpm test --filter ship'
assert_contains "Prompt includes extra guidance" "$OUTPUT_FILE" 'Prefer targeted fixes over broad refactors.'
assert_contains "Prompt includes completion marker" "$OUTPUT_FILE" 'LOCAL REVIEW FIX COMPLETE'

echo ""
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
