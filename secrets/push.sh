#!/usr/bin/env bash
set -euo pipefail

# push-secrets.sh — Create 1Password items from secrets.json and ~/.claude/settings.json
#
# Run once by the admin who has the secrets. Creates one 1Password item
# per skill defined in secrets.json. Teammates then pull with setup-secrets.sh.
#
# Security: secrets are written to a temp file (auto-deleted on exit) and
# passed to `op` via --template. They never appear as command-line arguments.
#
# Usage:
#   ./push-secrets.sh --account company.1password.com              # push all skills
#   ./push-secrets.sh --account company.1password.com --skill screengrabs  # push one skill
#
# Prerequisites:
#   - 1Password CLI: brew install 1password-cli
#   - 1Password desktop app with CLI integration enabled
#   - ~/.claude/settings.json populated with env vars

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$SCRIPT_DIR/secrets.json"
ACCOUNT=""
SKILL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill)   SKILL="$2"; shift 2 ;;
    --account) ACCOUNT="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--skill SKILL] [--account ACCOUNT]"
      echo ""
      echo "  --skill    Push only a specific skill's item"
      echo "  --account  1Password account (e.g., company.1password.com)"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Preflight checks ---

if [[ ! -f "$MANIFEST" ]]; then
  echo "Error: secrets.json not found at $MANIFEST"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "Error: node not found."
  exit 1
fi

if ! command -v op &>/dev/null; then
  echo "Error: 1Password CLI (op) not found. Install with: brew install 1password-cli"
  exit 1
fi

if ! op account list &>/dev/null; then
  echo "Error: Not signed in to 1Password CLI."
  echo "  1. Open the 1Password desktop app"
  echo "  2. Settings > Developer > 'Integrate with 1Password CLI'"
  echo "  3. Try again"
  exit 1
fi

SETTINGS="$HOME/.claude/settings.json"

if [[ ! -f "$SETTINGS" ]]; then
  echo "Error: $SETTINGS not found. Populate it with env vars first."
  exit 1
fi

OP_ACCOUNT_FLAG=()
if [[ -n "$ACCOUNT" ]]; then
  OP_ACCOUNT_FLAG=(--account "$ACCOUNT")
fi

# --- Read manifest and resolve skills ---

SKILLS_JSON=""
SKILLS_JSON=$(MANIFEST_PATH="$MANIFEST" SKILL_FILTER="$SKILL" node -e "
  const manifest = JSON.parse(require('fs').readFileSync(process.env.MANIFEST_PATH, 'utf8'));
  const skills = manifest.skills || {};
  const filter = process.env.SKILL_FILTER;

  if (filter) {
    if (!skills[filter]) {
      console.error('Error: Skill \"' + filter + '\" not found in secrets.json');
      console.error('Available skills: ' + Object.keys(skills).join(', '));
      process.exit(1);
    }
    const result = { vault: manifest.vault, skills: { [filter]: skills[filter] } };
    console.log(JSON.stringify(result));
  } else {
    const result = { vault: manifest.vault, skills };
    console.log(JSON.stringify(result));
  }
") || exit 1
export SKILLS_JSON

VAULT=$(echo "$SKILLS_JSON" | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>console.log(JSON.parse(d.join('')).vault))")

if ! op vault get "$VAULT" "${OP_ACCOUNT_FLAG[@]}" &>/dev/null; then
  echo "Error: Vault '$VAULT' not found."
  exit 1
fi

# --- Create items per skill ---

TEMPLATE_FILE=$(mktemp)
trap 'rm -f "$TEMPLATE_FILE"' EXIT

SKILL_NAMES=$(echo "$SKILLS_JSON" | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>console.log(Object.keys(JSON.parse(d.join('')).skills).join('\n')))")

for SKILL_NAME in $SKILL_NAMES; do
  ITEM=$(echo "$SKILLS_JSON" | SKILL_NAME="$SKILL_NAME" node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>console.log(JSON.parse(d.join('')).skills[process.env.SKILL_NAME].item))")
  VARS_JSON=$(echo "$SKILLS_JSON" | SKILL_NAME="$SKILL_NAME" node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>console.log(JSON.stringify(JSON.parse(d.join('')).skills[process.env.SKILL_NAME].vars)))")

  # Check if item already exists
  if op item get "$ITEM" --vault="$VAULT" "${OP_ACCOUNT_FLAG[@]}" &>/dev/null 2>&1; then
    echo "Item '$ITEM' already exists in vault '$VAULT'. Skipping."
    echo "  To replace it: op item delete '$ITEM' --vault='$VAULT'"
    continue
  fi

  echo "Creating item '$ITEM' for skill '$SKILL_NAME'..."

  # Build template from settings.json, filtered to this skill's vars
  SETTINGS_PATH="$SETTINGS" ITEM_TITLE="$ITEM" VARS="$VARS_JSON" TEMPLATE_PATH="$TEMPLATE_FILE" \
    node -e "
    const fs = require('fs');
    const s = JSON.parse(fs.readFileSync(process.env.SETTINGS_PATH, 'utf8'));
    const env = s.env || {};
    const vars = JSON.parse(process.env.VARS);
    const concealedPattern = /KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL/;

    const fields = [];
    for (const k of vars) {
      const v = env[k] || '';
      if (!v) {
        console.error('  Warning: ' + k + ' is empty in settings.json');
        continue;
      }
      fields.push({
        id: k,
        label: k,
        type: concealedPattern.test(k) ? 'CONCEALED' : 'STRING',
        value: v,
        section: { id: 'env', label: 'Environment Variables' }
      });
    }

    if (fields.length === 0) {
      console.error('Error: No env vars found for this skill.');
      process.exit(1);
    }

    const template = {
      title: process.env.ITEM_TITLE,
      category: 'SECURE_NOTE',
      fields: fields
    };

    fs.writeFileSync(process.env.TEMPLATE_PATH, JSON.stringify(template));
    console.log('  ' + fields.length + ' env vars to store.');
  "

  op item create \
    --vault="$VAULT" \
    "${OP_ACCOUNT_FLAG[@]}" \
    --template="$TEMPLATE_FILE" \
    --format=json | node -e "
    const d=[];process.stdin.on('data',c=>d.push(c));
    process.stdin.on('end',()=>{
      const item = JSON.parse(d.join(''));
      console.log('  Created: ' + item.title + ' (id: ' + item.id + ')');
    });
  "
done

echo ""
echo "Done. Teammates can now run: ./setup-secrets.sh --account <account>"
echo "Make sure the vault '$VAULT' is shared with your team in 1Password."
