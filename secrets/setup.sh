#!/usr/bin/env bash
set -euo pipefail

# setup-secrets.sh — Pull skill secrets from 1Password into ~/.claude/settings.json
#
# Reads secrets.json to discover which 1Password items exist per skill,
# then pulls the relevant env vars and merges them into settings.json
# without overwriting existing settings (permissions, model, plugins, etc.).
#
# Idempotent — safe to re-run when new env vars or skills are added.
#
# Security: secrets are piped via stdin to node for the merge step.
# They never appear as command-line arguments (visible in `ps` output).
#
# Usage:
#   ./setup-secrets.sh                              # pull all skills
#   ./setup-secrets.sh --skill screengrabs           # pull one skill
#   ./setup-secrets.sh --list                        # show available skills
#   ./setup-secrets.sh --skill screengrabs --dry-run # preview without writing
#
# Prerequisites:
#   - 1Password CLI: brew install 1password-cli
#   - 1Password desktop app with CLI integration enabled
#   - Access to the shared vault (ask your team admin)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$SCRIPT_DIR/secrets.json"
ACCOUNT=""
DRY_RUN=false
SKILL=""
LIST=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill)   SKILL="$2"; shift 2 ;;
    --account) ACCOUNT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --list)    LIST=true; shift ;;
    -h|--help)
      echo "Usage: $0 [--skill SKILL] [--account ACCOUNT] [--dry-run] [--list]"
      echo ""
      echo "  --skill    Pull secrets for a specific skill only"
      echo "  --account  1Password account (e.g., company.1password.com)"
      echo "  --dry-run  Show which keys would be written without changing settings.json"
      echo "  --list     Show available skills and their env vars"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Read manifest ---

if [[ ! -f "$MANIFEST" ]]; then
  echo "Error: secrets.json not found at $MANIFEST"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "Error: node not found."
  exit 1
fi

# --- List mode ---

if $LIST; then
  MANIFEST_PATH="$MANIFEST" node -e "
    const manifest = JSON.parse(require('fs').readFileSync(process.env.MANIFEST_PATH, 'utf8'));
    const skills = manifest.skills || {};
    const names = Object.keys(skills);
    if (names.length === 0) {
      console.log('No skills defined in secrets.json');
      process.exit(0);
    }
    console.log('Available skills (' + names.length + '):');
    console.log('');
    for (const name of names) {
      const s = skills[name];
      console.log('  ' + name);
      console.log('    1Password item: ' + s.item);
      console.log('    Env vars:');
      for (const v of (s.vars || [])) {
        console.log('      ' + v);
      }
      console.log('');
    }
  "
  exit 0
fi

# --- Resolve which skills to pull ---

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

if ! op account list &>/dev/null; then
  echo "Error: Not signed in to 1Password CLI."
  echo ""
  echo "  1. Open the 1Password desktop app"
  echo "  2. Settings > Developer > 'Integrate with 1Password CLI'"
  echo "  3. Try again"
  exit 1
fi

# Build account flag array (empty if not specified)
OP_ACCOUNT_FLAG=()
if [[ -n "$ACCOUNT" ]]; then
  OP_ACCOUNT_FLAG=(--account "$ACCOUNT")
fi

VAULT=$(echo "$SKILLS_JSON" | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>console.log(JSON.parse(d.join('')).vault))")

if ! op vault get "$VAULT" "${OP_ACCOUNT_FLAG[@]}" &>/dev/null; then
  echo "Error: Cannot access vault '$VAULT'."
  echo "Ask your team admin to share the vault with you in 1Password."
  exit 1
fi

SETTINGS="$HOME/.claude/settings.json"
export SECRETS_FILE=$(mktemp)
trap 'rm -f "$SECRETS_FILE"' EXIT

# Initialize empty secrets object
echo '{}' > "$SECRETS_FILE"

# --- Pull secrets for each skill ---

SKILL_NAMES=$(echo "$SKILLS_JSON" | node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>console.log(Object.keys(JSON.parse(d.join('')).skills).join('\n')))")

for SKILL_NAME in $SKILL_NAMES; do
  ITEM=$(echo "$SKILLS_JSON" | SKILL_NAME="$SKILL_NAME" node -e "const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>console.log(JSON.parse(d.join('')).skills[process.env.SKILL_NAME].item))")

  if ! op item get "$ITEM" --vault="$VAULT" "${OP_ACCOUNT_FLAG[@]}" &>/dev/null 2>&1; then
    echo "Warning: Item '$ITEM' not found in vault '$VAULT' (skill: $SKILL_NAME). Skipping."
    continue
  fi

  echo "Reading secrets for '$SKILL_NAME' from 1Password ($VAULT / $ITEM)..."

  op item get "$ITEM" --vault="$VAULT" "${OP_ACCOUNT_FLAG[@]}" --format=json | \
    SECRETS_FILE="$SECRETS_FILE" node -e "
    const d = [];
    process.stdin.on('data', c => d.push(c));
    process.stdin.on('end', () => {
      const item = JSON.parse(d.join(''));
      const existing = JSON.parse(require('fs').readFileSync(process.env.SECRETS_FILE, 'utf8'));
      let count = 0;
      for (const f of (item.fields || [])) {
        if (f.label && f.label !== 'notesPlain' && f.value) {
          existing[f.label] = f.value;
          count++;
        }
      }
      require('fs').writeFileSync(process.env.SECRETS_FILE, JSON.stringify(existing));
      console.log('  Found ' + count + ' env vars.');
    });
  "
done

# --- Check if we got anything ---

TOTAL=$(node -e "const s=JSON.parse(require('fs').readFileSync(process.env.SECRETS_FILE,'utf8'));console.log(Object.keys(s).length)")

if [[ "$TOTAL" -eq 0 ]]; then
  echo ""
  echo "No secrets found. Make sure the 1Password items exist."
  echo "An admin can create them with: ./push-secrets.sh --account <account>"
  exit 1
fi

# --- Dry run ---

if $DRY_RUN; then
  echo ""
  echo "[dry-run] Would merge these env var keys into $SETTINGS:"
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

mkdir -p "$(dirname "$SETTINGS")"
if [[ ! -f "$SETTINGS" ]]; then
  echo '{}' > "$SETTINGS"
fi

SETTINGS_PATH="$SETTINGS" node -e "
  const fs = require('fs');
  const settings = JSON.parse(fs.readFileSync(process.env.SETTINGS_PATH, 'utf8'));
  const secrets = JSON.parse(fs.readFileSync(process.env.SECRETS_FILE, 'utf8'));

  settings.env = Object.assign(settings.env || {}, secrets);

  fs.writeFileSync(process.env.SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');

  const keys = Object.keys(secrets);
  console.log('');
  console.log('Merged ' + keys.length + ' env vars into ' + process.env.SETTINGS_PATH + ':');
  keys.forEach(k => console.log('  ' + k));
"

echo ""
echo "Done."
