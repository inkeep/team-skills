#!/usr/bin/env bash
set -euo pipefail

# 1password-seed-item.sh — Create a 1Password item with Claude Code secrets
#
# Run once by the person who has the secrets (usually the admin).
# Reads env vars from ~/.claude/settings.json and creates a 1Password item
# that teammates can pull from using setup-claude-env.sh.
#
# Security: secrets are written to a temp file (auto-deleted on exit) and
# passed to `op` via --template. They never appear as command-line arguments
# (which would be visible in `ps` output).
#
# Usage:
#   ./1password-seed-item.sh [--vault VAULT] [--item ITEM] [--account ACCOUNT]
#
# Prerequisites:
#   - 1Password CLI: brew install 1password-cli
#   - 1Password desktop app with CLI integration enabled
#   - ~/.claude/settings.json populated with env vars

VAULT="Shared"
ITEM="Claude Code Secrets"
ACCOUNT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)   VAULT="$2"; shift 2 ;;
    --item)    ITEM="$2"; shift 2 ;;
    --account) ACCOUNT="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--vault VAULT] [--item ITEM] [--account ACCOUNT]"
      echo ""
      echo "  --vault    1Password vault name (default: Shared)"
      echo "  --item     Item title (default: Claude Code Secrets)"
      echo "  --account  1Password account (e.g., company.1password.com)"
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
TEMPLATE_FILE=$(mktemp)
trap 'rm -f "$TEMPLATE_FILE"' EXIT

# --- Preflight checks ---

if ! command -v op &>/dev/null; then
  echo "Error: 1Password CLI (op) not found. Install with: brew install 1password-cli"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "Error: node not found."
  exit 1
fi

if [[ ! -f "$SETTINGS" ]]; then
  echo "Error: $SETTINGS not found. Populate it with env vars first."
  exit 1
fi

if ! op account list &>/dev/null; then
  echo "Error: Not signed in to 1Password CLI."
  echo "  1. Open the 1Password desktop app"
  echo "  2. Settings > Developer > 'Integrate with 1Password CLI'"
  echo "  3. Try again"
  exit 1
fi

if ! op vault get "$VAULT" "${OP_ACCOUNT_FLAG[@]}" &>/dev/null; then
  echo "Error: Vault '$VAULT' not found. Available vaults:"
  op vault list "${OP_ACCOUNT_FLAG[@]}" --format=json | node -e "
    const d=[];process.stdin.on('data',c=>d.push(c));
    process.stdin.on('end',()=>{
      JSON.parse(d.join('')).forEach(v=>console.log('  - '+v.name));
    });
  "
  echo ""
  echo "Create the vault in 1Password, or use --vault to specify an existing one."
  exit 1
fi

if op item get "$ITEM" --vault="$VAULT" "${OP_ACCOUNT_FLAG[@]}" &>/dev/null 2>&1; then
  echo "Item '$ITEM' already exists in vault '$VAULT'."
  echo "To update it, delete the existing item first, then re-run this script."
  echo "  op item delete '$ITEM' --vault='$VAULT'"
  exit 1
fi

# --- Build item template from settings.json ---
# Node reads settings.json and writes a 1Password template JSON to a temp file.
# Secrets stay in process memory and the temp file — never in argv.

echo "Reading env vars from $SETTINGS..."

SETTINGS_PATH="$SETTINGS" ITEM_TITLE="$ITEM" TEMPLATE_PATH="$TEMPLATE_FILE" \
  node -e "
    const fs = require('fs');
    const s = JSON.parse(fs.readFileSync(process.env.SETTINGS_PATH, 'utf8'));
    const env = s.env || {};
    const concealedPattern = /KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL/;

    const fields = [];
    for (const [k, v] of Object.entries(env)) {
      if (!v) continue;
      fields.push({
        id: k,
        label: k,
        type: concealedPattern.test(k) ? 'CONCEALED' : 'STRING',
        value: v,
        section: { id: 'env', label: 'Environment Variables' }
      });
    }

    if (fields.length === 0) {
      console.error('Error: No env vars found in settings.json (or all are empty).');
      process.exit(1);
    }

    const template = {
      title: process.env.ITEM_TITLE,
      category: 'SECURE_NOTE',
      fields: fields
    };

    fs.writeFileSync(process.env.TEMPLATE_PATH, JSON.stringify(template));
    console.log('Found ' + fields.length + ' env vars to store.');
  "

echo "Creating item '$ITEM' in vault '$VAULT'..."

# --template reads the JSON file; secrets never appear in ps output
op item create \
  --vault="$VAULT" \
  "${OP_ACCOUNT_FLAG[@]}" \
  --template="$TEMPLATE_FILE" \
  --format=json | node -e "
    const d=[];process.stdin.on('data',c=>d.push(c));
    process.stdin.on('end',()=>{
      const item = JSON.parse(d.join(''));
      console.log('');
      console.log('Created: ' + item.title + ' (id: ' + item.id + ')');
      console.log('Vault:   ' + item.vault.name);
      const labels = (item.fields||[]).filter(f => f.label && f.label !== 'notesPlain' && f.value).map(f => f.label);
      console.log('Fields:  ' + labels.length);
      console.log('');
      console.log('Stored env vars:');
      labels.forEach(l => console.log('  ' + l));
    });
  "

echo ""
echo "Done. Teammates can now run setup-claude-env.sh to pull these secrets."
echo "Make sure the vault '$VAULT' is shared with your team in 1Password."
