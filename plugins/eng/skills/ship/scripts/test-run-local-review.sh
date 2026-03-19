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

assert_file_exists() {
  local label="$1" path="$2"
  if [[ -f "$path" ]]; then
    pass "$label"
  else
    fail "$label (missing $path)"
  fi
}

assert_not_exists() {
  local label="$1" path="$2"
  if [[ ! -e "$path" ]]; then
    pass "$label"
  else
    fail "$label (unexpected $path)"
  fi
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

init_repo() {
  local dir="$1"
  mkdir -p "$dir"
  (
    cd "$dir"
    git init -q -b main
    git config user.email "test@example.com"
    git config user.name "Test User"
    echo "console.log('hello');" > index.js
    git add index.js
    git commit -q -m "init"
  )
}

write_stage_script() {
  local path="$1"
  cat > "$path" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exit 0
EOF
  chmod +x "$path"
}

write_review_script() {
  local path="$1"
  cat > "$path" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

mkdir -p "$(dirname "$OUTPUT_FILE")"
mkdir -p tmp/ship/local-review-runs/run-001
echo "run-001" > tmp/ship/local-review-latest.txt

if [[ -f fixed.txt ]]; then
  cat > "$OUTPUT_FILE" <<'MARKDOWN'
## PR Review Summary
**(0) Total Issues** | Risk: **Low** | Recommendation: **APPROVE**
MARKDOWN
else
  cat > "$OUTPUT_FILE" <<'MARKDOWN'
## PR Review Summary
**(1) Total Issues** | Risk: **High** | Recommendation: **REQUEST CHANGES**

### Critical (1)
- Missing fix for the review gate test.
MARKDOWN
fi

cp "$OUTPUT_FILE" tmp/ship/local-review-runs/run-001/review-output.md
EOF
  chmod +x "$path"
}

write_state_file() {
  local path="$1"
  cat > "$path" <<'EOF'
{
  "specPath": "specs/local-review-loop/SPEC.md",
  "qualityGates": {
    "test": "test -f fixed.txt",
    "typecheck": "",
    "lint": ""
  }
}
EOF
}

run_case() {
  local mode="$1"
  local expected_status="$2"
  local repo="$TMPDIR/repo-${mode}"
  local ship_dir="$repo/tmp/ship"
  local stage_script="$TMPDIR/stage-${mode}.sh"
  local review_script="$TMPDIR/review-${mode}.sh"

  init_repo "$repo"
  mkdir -p "$ship_dir"
  mkdir -p "$repo/specs/local-review-loop"
  echo "# Spec" > "$repo/specs/local-review-loop/SPEC.md"
  write_stage_script "$stage_script"
  write_review_script "$review_script"
  write_state_file "$ship_dir/state.json"

  set +e
  (
    cd "$repo"
    CLAUDE_SHIP_DIR="tmp/ship" \
    LOCAL_REVIEW_STAGE_SCRIPT="$stage_script" \
    LOCAL_REVIEW_BUNDLE_SCRIPT="$review_script" \
    LOCAL_REVIEW_FIX_COMMAND='touch fixed.txt' \
    "$SCRIPT_DIR/run-local-review.sh" --repair-mode "$mode" --max-fix-passes 1
  )
  local status=$?
  set -e

  if [[ "$status" == "$expected_status" ]]; then
    pass "run-local-review.sh exits ${expected_status} in ${mode} mode"
  else
    fail "run-local-review.sh exits ${expected_status} in ${mode} mode (got ${status})"
  fi

  case "$mode" in
    off)
      assert_not_exists "Off mode does not create fix marker" "$repo/fixed.txt"
      assert_jq_equals "Off mode leaves blocking review" "$ship_dir/review-status.json" '.blocking' "true"
      ;;
    prompt)
      assert_file_exists "Prompt mode writes repair prompt" "$ship_dir/review-fix-pass-1.prompt.md"
      assert_not_exists "Prompt mode does not run fix command" "$repo/fixed.txt"
      assert_jq_equals "Prompt mode leaves blocking review" "$ship_dir/review-status.json" '.blocking' "true"
      ;;
    auto)
      assert_file_exists "Auto mode runs fix command" "$repo/fixed.txt"
      assert_file_exists "Auto mode writes repair prompt" "$ship_dir/review-fix-pass-1.prompt.md"
      assert_jq_equals "Auto mode clears blocking review" "$ship_dir/review-status.json" '.blocking' "false"
      ;;
  esac
}

echo "=== run-local-review.sh tests ==="
echo ""

run_case off 2
run_case prompt 2
run_case auto 0

echo ""
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
