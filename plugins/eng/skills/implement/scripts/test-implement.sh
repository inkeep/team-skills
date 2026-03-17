#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPLEMENT_SCRIPT="${SCRIPT_DIR}/implement.sh"

PASS=0
FAIL=0
TMPDIR=$(mktemp -d)

cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

assert_equals() {
  local label="$1" actual="$2" expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (expected '$expected', got '$actual')"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local label="$1" file="$2" pattern="$3"
  if grep -q "$pattern" "$file"; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label (pattern '$pattern' not found)"
    FAIL=$((FAIL + 1))
  fi
}

make_repo() {
  local repo="$1"
  mkdir -p "$repo/tmp/ship"
  (
    cd "$repo"
    git init -q -b main
    git config user.email "codex@example.com"
    git config user.name "Codex"
    echo "init" > README.md
    git add README.md
    git commit -q -m "init"
    git checkout -q -b feat/test-feature
  )
  echo "prompt" > "$repo/tmp/ship/implement-prompt.md"
}

write_single_story_spec() {
  local repo="$1"
  cat > "$repo/tmp/ship/spec.json" <<'EOF'
{
  "project": "Test Project",
  "branchName": "implement/test-feature",
  "description": "Test feature",
  "implementationContext": "Test context",
  "userStories": [
    {
      "id": "US-001",
      "title": "Failing story",
      "description": "As a user, I want a failing story",
      "acceptanceCriteria": ["Typecheck passes"],
      "priority": 1,
      "passes": false,
      "notes": "",
      "attemptCount": 0,
      "status": "pending"
    }
  ]
}
EOF
}

write_two_story_spec() {
  local repo="$1"
  cat > "$repo/tmp/ship/spec.json" <<'EOF'
{
  "project": "Test Project",
  "branchName": "implement/test-feature",
  "description": "Test feature",
  "implementationContext": "Test context",
  "userStories": [
    {
      "id": "US-001",
      "title": "Already blocked story",
      "description": "As a user, I want a blocked story",
      "acceptanceCriteria": ["Typecheck passes"],
      "priority": 1,
      "passes": false,
      "notes": "Blocked after 3 attempts. Waiting for guidance.",
      "attemptCount": 3,
      "status": "blocked"
    },
    {
      "id": "US-002",
      "title": "Finishing story",
      "description": "As a user, I want a finishing story",
      "acceptanceCriteria": ["Typecheck passes"],
      "priority": 2,
      "passes": false,
      "notes": "",
      "attemptCount": 0,
      "status": "pending"
    }
  ]
}
EOF
}

make_claude_stub() {
  local bin_dir="$1" mode="$2"
  mkdir -p "$bin_dir"
  cat > "$bin_dir/claude" <<EOF
#!/usr/bin/env node
const fs = require('fs');
const mode = '$mode';
const shipDir = process.env.CLAUDE_SHIP_DIR || 'tmp/ship';
const specFile = shipDir + '/spec.json';

function loadSpec() {
  return JSON.parse(fs.readFileSync(specFile, 'utf8'));
}

function saveSpec(spec) {
  fs.writeFileSync(specFile, JSON.stringify(spec, null, 2) + '\n');
}

switch (mode) {
  case 'fail':
    console.log('{"result":"incomplete"}');
    break;
  case 'succeed-first': {
    const spec = loadSpec();
    spec.userStories = spec.userStories.map((story) =>
      story.id === 'US-001' ? { ...story, passes: true } : story,
    );
    saveSpec(spec);
    console.log('<promise>IMPLEMENTATION COMPLETE</promise>');
    break;
  }
  case 'succeed-second': {
    const spec = loadSpec();
    spec.userStories = spec.userStories.map((story) =>
      story.id === 'US-002' ? { ...story, passes: true } : story,
    );
    saveSpec(spec);
    console.log('{"result":"completed second story"}');
    break;
  }
  default:
    console.error('unknown stub mode:', mode);
    process.exit(1);
}
EOF
  chmod +x "$bin_dir/claude"
}

run_case() {
  local repo="$1" stub_mode="$2" output_file="$3"
  local bin_dir="${repo}/bin"
  make_claude_stub "$bin_dir" "$stub_mode"

  set +e
  PATH="${bin_dir}:${PATH}" CLAUDE_BIN="${bin_dir}/claude" CLAUDE_SHIP_DIR="${repo}/tmp/ship" \
    bash "$IMPLEMENT_SCRIPT" --max-iterations 5 --max-turns 1 --max-story-attempts 3 --force \
    >"$output_file" 2>&1
  local exit_code=$?
  set -e

  echo "$exit_code"
}

echo "=== Implement Retry Budget Tests ==="
echo ""

echo "-- blocks a failing story after 3 attempts --"
REPO_FAIL="${TMPDIR}/fail"
make_repo "$REPO_FAIL"
write_single_story_spec "$REPO_FAIL"
OUTPUT_FAIL="${REPO_FAIL}/output.txt"
EXIT_FAIL=$(run_case "$REPO_FAIL" "fail" "$OUTPUT_FAIL")

ATTEMPTS_FAIL=$(jq -r '.userStories[0].attemptCount' "${REPO_FAIL}/tmp/ship/spec.json")
STATUS_FAIL=$(jq -r '.userStories[0].status' "${REPO_FAIL}/tmp/ship/spec.json")
assert_equals "Failing story exits with blocked code" "$EXIT_FAIL" "2"
assert_equals "Failing story attempt count reaches budget" "$ATTEMPTS_FAIL" "3"
assert_equals "Failing story is marked blocked" "$STATUS_FAIL" "blocked"
assert_contains "Blocked summary prompts for input" "$OUTPUT_FAIL" "<input>Blocked stories require attention"

echo ""
echo "-- records a successful first-attempt completion --"
REPO_SUCCESS="${TMPDIR}/success"
make_repo "$REPO_SUCCESS"
write_single_story_spec "$REPO_SUCCESS"
OUTPUT_SUCCESS="${REPO_SUCCESS}/output.txt"
EXIT_SUCCESS=$(run_case "$REPO_SUCCESS" "succeed-first" "$OUTPUT_SUCCESS")

ATTEMPTS_SUCCESS=$(jq -r '.userStories[0].attemptCount' "${REPO_SUCCESS}/tmp/ship/spec.json")
STATUS_SUCCESS=$(jq -r '.userStories[0].status' "${REPO_SUCCESS}/tmp/ship/spec.json")
PASSES_SUCCESS=$(jq -r '.userStories[0].passes' "${REPO_SUCCESS}/tmp/ship/spec.json")
assert_equals "Successful story exits cleanly" "$EXIT_SUCCESS" "0"
assert_equals "Successful story attempt count increments once" "$ATTEMPTS_SUCCESS" "1"
assert_equals "Successful story is marked completed" "$STATUS_SUCCESS" "completed"
assert_equals "Successful story passes" "$PASSES_SUCCESS" "true"

echo ""
echo "-- skips blocked stories and pauses after remaining work is complete --"
REPO_MIXED="${TMPDIR}/mixed"
make_repo "$REPO_MIXED"
write_two_story_spec "$REPO_MIXED"
OUTPUT_MIXED="${REPO_MIXED}/output.txt"
EXIT_MIXED=$(run_case "$REPO_MIXED" "succeed-second" "$OUTPUT_MIXED")

ATTEMPTS_MIXED=$(jq -r '.userStories[1].attemptCount' "${REPO_MIXED}/tmp/ship/spec.json")
STATUS_MIXED=$(jq -r '.userStories[1].status' "${REPO_MIXED}/tmp/ship/spec.json")
assert_equals "Mixed run pauses because blocked story remains" "$EXIT_MIXED" "2"
assert_equals "Second story gets exactly one attempt" "$ATTEMPTS_MIXED" "1"
assert_equals "Second story is marked completed" "$STATUS_MIXED" "completed"
assert_contains "Mixed run summarizes blocked stories" "$OUTPUT_MIXED" "US-001: Already blocked story"

echo ""
echo "PASS: $PASS"
echo "FAIL: $FAIL"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

exit 0
