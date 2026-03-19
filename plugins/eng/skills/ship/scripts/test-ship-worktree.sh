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
  local label="$1" json="$2" query="$3" expected="$4"
  local actual
  actual=$(printf '%s\n' "$json" | jq -r "$query")
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
    echo "hello" > README.md
    git add README.md
    git commit -q -m "init"
  )
}

echo "=== ship-worktree.sh tests ==="
echo ""

REPO="$TMPDIR/repo"
init_repo "$REPO"

# Test 1: ensure creates a new sibling worktree from main
RESULT=$(cd "$REPO" && "$SCRIPT_DIR/ship-worktree.sh" ensure --feature "Review Hardening")
WORKTREE_PATH=$(printf '%s\n' "$RESULT" | jq -r '.path')
WORKTREE_BRANCH=$(printf '%s\n' "$RESULT" | jq -r '.branch')
assert_jq_equals "Ensure creates worktree" "$RESULT" '.action' "created_worktree"
if [[ -d "$WORKTREE_PATH" ]]; then
  pass "Created worktree path exists"
else
  fail "Created worktree path missing"
fi

# Test 2: ensure reuses a matching clean worktree from main checkout
RESULT=$(cd "$REPO" && "$SCRIPT_DIR/ship-worktree.sh" ensure --feature "Review Hardening")
assert_jq_equals "Ensure reuses clean matching worktree" "$RESULT" '.action' "reuse_existing_worktree"
assert_jq_equals "Ensure returns same branch for reused worktree" "$RESULT" '.branch' "$WORKTREE_BRANCH"

# Test 3: ensure reuses the current worktree when already inside it
RESULT=$(cd "$WORKTREE_PATH" && "$SCRIPT_DIR/ship-worktree.sh" ensure --feature "Something Else")
assert_jq_equals "Ensure reuses current worktree from inside worktree" "$RESULT" '.action' "reuse_current_worktree"
assert_jq_equals "Ensure keeps current branch inside worktree" "$RESULT" '.branch' "$WORKTREE_BRANCH"

# Test 4: cleanup removes merged worktree and branch
(
  cd "$WORKTREE_PATH"
  git config user.email "test@example.com"
  git config user.name "Test User"
  echo "change" > feature.txt
  git add feature.txt
  git commit -q -m "feature work"
)
(cd "$REPO" && git merge --no-ff -q "$WORKTREE_BRANCH" -m "merge worktree")
RESULT=$(cd "$REPO" && "$SCRIPT_DIR/ship-worktree.sh" cleanup --path "$WORKTREE_PATH" --branch "$WORKTREE_BRANCH")
assert_jq_equals "Cleanup reports cleanup action" "$RESULT" '.action' "cleanup_worktree"
if [[ ! -d "$WORKTREE_PATH" ]]; then
  pass "Cleanup removes worktree directory"
else
  fail "Cleanup should remove worktree directory"
fi
if ! (cd "$REPO" && git show-ref --verify --quiet "refs/heads/${WORKTREE_BRANCH}"); then
  pass "Cleanup deletes merged branch"
else
  fail "Cleanup should delete merged branch"
fi

echo ""
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
