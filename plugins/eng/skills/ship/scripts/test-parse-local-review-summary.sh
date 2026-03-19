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

assert_jq_equals() {
  local label="$1" file="$2" query="$3" expected="$4"
  local actual
  actual=$(jq -r "$query" "$file")
  if [[ "$actual" == "$expected" ]]; then
    pass "$label"
  else
    fail "$label (expected '$expected', got '$actual')"
  fi
}

echo "=== parse-local-review-summary.sh tests ==="
echo ""

INPUT="$TMPDIR/review-output.md"
OUTPUT="$TMPDIR/review-status.json"

cat > "$INPUT" <<'EOF'
## PR Review Summary

**(3) Total Issues** | Risk: **High** | Recommendation: **REQUEST CHANGES**

### 🔴 Critical (1)

### 🟠 Major (2)

### 🟡 Minor (0)

### 💭 Consider (0)

### 🧹 While You're Here (0)

### 🕐 Pending Recommendations (0)
EOF

"$SCRIPT_DIR/parse-local-review-summary.sh" --input "$INPUT" --output "$OUTPUT" >/dev/null
assert_jq_equals "Parser normalizes recommendation" "$OUTPUT" '.recommendation' "REQUEST_CHANGES"
assert_jq_equals "Parser captures critical count" "$OUTPUT" '.counts.critical' "1"
assert_jq_equals "Parser captures major count" "$OUTPUT" '.counts.major' "2"
assert_jq_equals "Parser marks blocking summaries" "$OUTPUT" '.blocking' "true"

cat > "$INPUT" <<'EOF'
## PR Review Summary

**(1) Total Issues** | Risk: **Low** | Recommendation: **APPROVE WITH SUGGESTIONS**

### 🔴 Critical (0)

### 🟠 Major (0)

### 🟡 Minor (1)
EOF

"$SCRIPT_DIR/parse-local-review-summary.sh" --input "$INPUT" --output "$OUTPUT" >/dev/null
assert_jq_equals "Parser keeps minor-only summary non-blocking" "$OUTPUT" '.blocking' "false"
assert_jq_equals "Parser normalizes approve-with-suggestions" "$OUTPUT" '.recommendation' "APPROVE_WITH_SUGGESTIONS"

echo ""
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
