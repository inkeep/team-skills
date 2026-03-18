#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELPER="$SCRIPT_DIR/ship-setup-isolated-env.sh"
INIT_STATE="$SCRIPT_DIR/ship-init-state.sh"
PASS=0
FAIL=0
TMPDIR=$(mktemp -d)

cleanup() {
  rm -rf "$TMPDIR"
}
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
  local label="$1"
  local path="$2"
  if [[ -f "$path" ]]; then
    pass "$label"
  else
    fail "$label (missing $path)"
  fi
}

assert_file_not_exists() {
  local label="$1"
  local path="$2"
  if [[ ! -f "$path" ]]; then
    pass "$label"
  else
    fail "$label (unexpected file $path)"
  fi
}

assert_contains() {
  local label="$1"
  local path="$2"
  local pattern="$3"
  if grep -Eq "$pattern" "$path"; then
    pass "$label"
  else
    fail "$label (pattern '$pattern' not found in $path)"
  fi
}

assert_jq_equals() {
  local label="$1"
  local path="$2"
  local query="$3"
  local expected="$4"
  local actual
  actual=$(jq -r "$query" "$path" 2>/dev/null || echo "__jq_error__")
  if [[ "$actual" == "$expected" ]]; then
    pass "$label"
  else
    fail "$label (expected '$expected', got '$actual')"
  fi
}

make_isolated_env_cli_repo() {
  local dir="$1"
  local mode="${2:-script}"
  mkdir -p "$dir/scripts" "$dir/.isolated-envs" "$dir/specs/feature-auth"

  cat > "$dir/specs/feature-auth/SPEC.md" <<'EOF'
# Feature Auth
EOF

  cat > "$dir/scripts/isolated-env.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

STATE_DIR=".isolated-envs"
mkdir -p "$STATE_DIR"
CMD="${1:-}"
NAME="${2:-}"

port_for_name() {
  case "$1" in
    feature-auth) echo "4100" ;;
    feature-billing) echo "4200" ;;
    *) echo "4300" ;;
  esac
}

case "$CMD" in
  setup)
    echo "setup:$NAME" >> "$STATE_DIR/log.txt"
    touch "$STATE_DIR/$NAME.setup-called"
    cat > "$STATE_DIR/$NAME.json" <<JSON
{"name":"$NAME","ports":{"api":$(port_for_name "$NAME"),"web":$(($(port_for_name "$NAME")+100))}}
JSON
    ;;
  env)
    [[ -f "$STATE_DIR/$NAME.json" ]] || exit 1
    api_port="$(jq -r '.ports.api' "$STATE_DIR/$NAME.json")"
    web_port="$(jq -r '.ports.web' "$STATE_DIR/$NAME.json")"
    echo "export API_PORT='$api_port'"
    echo "export WEB_PORT='$web_port'"
    ;;
  down)
    rm -f "$STATE_DIR/$NAME.json"
    ;;
  *)
    exit 1
    ;;
esac
EOF
  chmod +x "$dir/scripts/isolated-env.sh"

  if [[ "$mode" == "pnpm" ]]; then
    mkdir -p "$dir/fake-bin"
    cat > "$dir/package.json" <<'EOF'
{
  "name": "fake-isolated-repo",
  "private": true,
  "scripts": {
    "setup-dev": "node ./scripts/setup-dev.js"
  }
}
EOF
    cat > "$dir/fake-bin/pnpm" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == "setup-dev" && "${2:-}" == "--isolated" && -n "${3:-}" ]]; then
  mkdir -p .isolated-envs
  echo "pnpm:$3" >> .isolated-envs/log.txt
  cat > ".isolated-envs/$3.json" <<JSON
{"name":"$3","ports":{"api":5100,"web":5200}}
JSON
  exit 0
fi
exit 1
EOF
    chmod +x "$dir/fake-bin/pnpm"
  fi
}

echo "=== Ship Isolated Env Tests ==="
echo ""

echo "-- provisions via scripts/isolated-env.sh and writes ship artifacts --"
REPO="$TMPDIR/repo-script"
make_isolated_env_cli_repo "$REPO"
(
  cd "$REPO"
  bash "$HELPER" --feature "Feature Auth"
)
assert_file_exists "isolated-env.sh created" "$REPO/tmp/ship/isolated-env.sh"
assert_file_exists "isolated-env.json created" "$REPO/tmp/ship/isolated-env.json"
assert_jq_equals "metadata captures env name" "$REPO/tmp/ship/isolated-env.json" '.name' "feature-auth"
assert_jq_equals "metadata marks env active" "$REPO/tmp/ship/isolated-env.json" '.active' "true"
assert_contains "env file exports API_PORT" "$REPO/tmp/ship/isolated-env.sh" "^export API_PORT='4100'$"
APP_VALUE="$(
  cd "$REPO"
  bash -lc 'source tmp/ship/isolated-env.sh && printf "%s:%s" "$API_PORT" "$WEB_PORT"'
)"
if [[ "$APP_VALUE" == "4100:4200" ]]; then
  pass "app command can source isolated env file"
else
  fail "app command can source isolated env file (got '$APP_VALUE')"
fi

echo ""
echo "-- prefers pnpm setup-dev --isolated when repo exposes it --"
REPO="$TMPDIR/repo-pnpm"
make_isolated_env_cli_repo "$REPO" "pnpm"
(
  cd "$REPO"
  PATH="$REPO/fake-bin:$PATH" bash "$HELPER" --feature "Feature Billing"
)
assert_contains "pnpm isolated setup path used" "$REPO/.isolated-envs/log.txt" "^pnpm:feature-billing$"
assert_file_not_exists "raw isolated-env setup was skipped" "$REPO/.isolated-envs/feature-billing.setup-called"
assert_contains "pnpm path still writes env exports" "$REPO/tmp/ship/isolated-env.sh" "^export API_PORT='5100'$"

echo ""
echo "-- different feature names preserve different env exports across parallel ship dirs --"
REPO_A="$TMPDIR/repo-a"
REPO_B="$TMPDIR/repo-b"
make_isolated_env_cli_repo "$REPO_A"
make_isolated_env_cli_repo "$REPO_B"
(
  cd "$REPO_A"
  bash "$HELPER" --feature "Feature Auth"
)
(
  cd "$REPO_B"
  bash "$HELPER" --feature "Feature Billing"
)
PORT_A="$(
  cd "$REPO_A"
  bash -lc 'source tmp/ship/isolated-env.sh && printf "%s" "$API_PORT"'
)"
PORT_B="$(
  cd "$REPO_B"
  bash -lc 'source tmp/ship/isolated-env.sh && printf "%s" "$API_PORT"'
)"
if [[ "$PORT_A" != "$PORT_B" ]]; then
  pass "parallel ship dirs keep isolated env ports distinct"
else
  fail "parallel ship dirs keep isolated env ports distinct (both were '$PORT_A')"
fi

echo ""
echo "-- ship-init-state records isolated env metadata in state.json --"
REPO="$TMPDIR/repo-state"
make_isolated_env_cli_repo "$REPO"
(
  cd "$REPO"
  bash "$HELPER" --feature "Feature Auth"
  bash "$INIT_STATE" \
    --feature "feature-auth" \
    --spec "specs/feature-auth/SPEC.md" \
    --branch "feat/feature-auth" \
    --isolated-env true
)
assert_jq_equals "state records isolatedEnv capability" "$REPO/tmp/ship/state.json" '.capabilities.isolatedEnv' "true"
assert_jq_equals "state records isolated env name" "$REPO/tmp/ship/state.json" '.isolatedEnv.name' "feature-auth"
assert_jq_equals "state records isolated env file" "$REPO/tmp/ship/state.json" '.isolatedEnv.envFile' "tmp/ship/isolated-env.sh"
assert_jq_equals "state records isolated env active" "$REPO/tmp/ship/state.json" '.isolatedEnv.active' "true"
assert_jq_equals "state records teardown command" "$REPO/tmp/ship/state.json" '.isolatedEnv.teardownCommand' "./scripts/isolated-env.sh down feature-auth"

echo ""
echo "PASS: $PASS"
echo "FAIL: $FAIL"

if [[ "$FAIL" -ne 0 ]]; then
  exit 1
fi
