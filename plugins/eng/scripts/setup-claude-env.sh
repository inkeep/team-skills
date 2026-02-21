#!/usr/bin/env bash
set -euo pipefail

# setup-claude-env.sh — Pull Claude Code secrets from 1Password into settings.json
#
# Merges env vars from a shared 1Password item into ~/.claude/settings.json
# without overwriting existing settings (permissions, model, plugins, etc.).
#
# Idempotent — safe to re-run when new env vars are added.
#
# Security: secrets are piped via stdin to node for the merge step.
# They never appear as command-line arguments (visible in `ps` output).
#
# Usage:
#   ./setup-claude-env.sh [--vault VAULT] [--item ITEM] [--account ACCOUNT] [--dry-run]
#
# Prerequisites:
#   - 1Password CLI: brew install 1password-cli
#   - 1Password desktop app with CLI integration enabled
#   - Access to the shared vault (ask your team admin)

VAULT="Shared"
ITEM="Claude Code Secrets"
ACCOUNT=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)   VAULT="$2"; shift 2 ;;
    --item)    ITEM="$2"; shift 2 ;;
    --account) ACCOUNT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--vault VAULT] [--item ITEM] [--account ACCOUNT] [--dry-run]"
      echo ""
      echo "  --vault    1Password vault name (default: Shared)"
      echo "  --item     Item title (default: Claude Code Secrets)"
      echo "  --account  1Password account (e.g., company.1password.com)"
      echo "  --dry-run  Show which keys would be written without changing settings.json"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Build account flag array (empty if not specified)
OP_ACCOUNT_FLAG=()
if [[ -n "$ACCOUNT" ]]; then
  OP_ACCOUNT_FLAG=(--account "$ACCOUNT")
fi

SETTINGS="$HOME/.claude/settings.json"

# --- Preflight checks ---

if ! command -v op &>/dev/null; then
  echo "Error: 1Password CLI (op) not found."
  echo ""
  echo "Install it:"
  echo "  brew install 1password-cli"
  echo ""
  echo "Then enable CLI integration in 1Password desktop app:"
  echo "  Settings > Developer > 'Integrate with 1Password CLI'"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "Error: node not found."
  exit 1
fi

if ! op account list &>/dev/null; then
  echo "Error: Not signed in to 1Password CLI."
  echo ""
  echo "  1. Open the 1Password desktop app"
  echo "  2. Settings > Developer > 'Integrate with 1Password CLI'"
  echo "  3. Try again"
  exit 1
fi

if ! op vault get "$VAULT" "${OP_ACCOUNT_FLAG[@]}" &>/dev/null; then
  echo "Error: Cannot access vault '$VAULT'."
  echo "Ask your team admin to share the vault with you in 1Password."
  exit 1
fi

if ! op item get "$ITEM" --vault="$VAULT" "${OP_ACCOUNT_FLAG[@]}" &>/dev/null 2>&1; then
  echo "Error: Item '$ITEM' not found in vault '$VAULT'."
  echo "Ask your team admin to run 1password-push.sh first."
  exit 1
fi

# --- Read all fields from the 1Password item as JSON ---
# op outputs the full item; node extracts field labels and values.
# The JSON blob stays in a pipe — never in argv.

echo "Reading secrets from 1Password ($VAULT / $ITEM)..."

# Get the item JSON and extract env var fields into a clean {key: value} object.
# Pipe the whole thing — secrets stay in the pipe, never in argv.
export SECRETS_FILE=$(mktemp)
trap 'rm -f "$SECRETS_FILE"' EXIT

op item get "$ITEM" --vault="$VAULT" "${OP_ACCOUNT_FLAG[@]}" --format=json | SECRETS_FILE="$SECRETS_FILE" node -e "
  const d = [];
  process.stdin.on('data', c => d.push(c));
  process.stdin.on('end', () => {
    const item = JSON.parse(d.join(''));
    const secrets = {};
    let count = 0;
    for (const f of (item.fields || [])) {
      if (f.label && f.label !== 'notesPlain' && f.value) {
        secrets[f.label] = f.value;
        count++;
      }
    }
    if (count === 0) {
      process.stderr.write('Error: No fields found in item.\\n');
      process.exit(1);
    }
    // Write secrets to temp file — not to argv
    require('fs').writeFileSync(process.env.SECRETS_FILE, JSON.stringify(secrets));
    console.log('Found ' + count + ' env vars.');
  });
"

if $DRY_RUN; then
  echo ""
  echo "[dry-run] Would merge these env var keys into $SETTINGS:"
  # Show only keys, not values
  node -e "
    const secrets = JSON.parse(require('fs').readFileSync(process.env.SECRETS_FILE, 'utf8'));
    for (const k of Object.keys(secrets)) {
      console.log('  ' + k);
    }
  "
  echo ""
  echo "[dry-run] No changes made."
  exit 0
fi

# --- Merge into settings.json ---
# Node reads the secrets from the temp file and merges into settings.json.
# Secrets stay in process memory — never in argv.

mkdir -p "$(dirname "$SETTINGS")"
if [[ ! -f "$SETTINGS" ]]; then
  echo '{}' > "$SETTINGS"
fi

SETTINGS_PATH="$SETTINGS" node -e "
  const fs = require('fs');
  const settings = JSON.parse(fs.readFileSync(process.env.SETTINGS_PATH, 'utf8'));
  const secrets = JSON.parse(fs.readFileSync(process.env.SECRETS_FILE, 'utf8'));

  // Merge: new secrets update the env section, everything else preserved
  settings.env = Object.assign(settings.env || {}, secrets);

  fs.writeFileSync(process.env.SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');

  const keys = Object.keys(secrets);
  console.log('');
  console.log('Merged ' + keys.length + ' env vars into ' + process.env.SETTINGS_PATH + ':');
  keys.forEach(k => console.log('  ' + k));
"

# Temp file with secrets is auto-deleted by the trap

echo ""
echo "Done. Your Claude Code environment is ready."
