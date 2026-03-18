#!/usr/bin/env bash
set -euo pipefail

# graphics.sh — Post-setup for the /graphics skill
#
# Called by setup.sh when the graphics skill's secrets are pulled.
# Expects SECRETS_FILE env var pointing to the pulled secrets temp file.
#
# What it does:
#   1. Verifies the Figma token works
#   2. Prints Desktop Bridge setup instructions (one-time + per-session)
#
# MCP servers (figma + figma-console) are bundled with the GTM plugin —
# they register automatically on plugin install. No manual MCP setup needed.
#
# FIGMA_ACCESS_TOKEN is pulled from 1Password by setup.sh (shared team token)
# and stored in ~/.claude/settings.json under env. The figma-console MCP server
# picks it up from the environment at startup.

echo ""
echo "=== Graphics Setup ==="

# --- 1. Verify Figma token ---

# Read the token from the secrets temp file (just pulled by setup.sh)
FIGMA_TOKEN=""
if [[ -n "${SECRETS_FILE:-}" && -f "${SECRETS_FILE:-}" ]]; then
  FIGMA_TOKEN=$(node -e "
    const s = JSON.parse(require('fs').readFileSync(process.env.SECRETS_FILE, 'utf8'));
    console.log(s.FIGMA_ACCESS_TOKEN || '');
  " 2>/dev/null || echo "")
fi

if [[ -n "$FIGMA_TOKEN" ]]; then
  echo "  Verifying Figma token..."
  # Test against the Graphics Workspace file (known shared file) rather than /v1/me
  # which requires broader scopes that PATs often lack
  GRAPHICS_FILE_KEY="S5kGTPZ0kSjmSxusJ56QJH"
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://api.figma.com/v1/files/${GRAPHICS_FILE_KEY}/components" \
    -H "X-Figma-Token: $FIGMA_TOKEN" 2>/dev/null || echo "000")

  if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "  ✅ Figma token valid (verified against Graphics Workspace)"
  elif [[ "$HTTP_STATUS" == "403" || "$HTTP_STATUS" == "404" ]]; then
    echo "  ⚠️  Figma token returned $HTTP_STATUS — may be expired or lack file access."
    echo "     Ask a team admin to regenerate it in 1Password."
  else
    echo "  ⚠️  Figma API returned HTTP $HTTP_STATUS. Token may be invalid."
  fi
else
  echo "  ⚠️  FIGMA_ACCESS_TOKEN not found in pulled secrets."
  echo "     Check that the 'Graphics Skill' item in 1Password has this field."
fi

# --- 2. Desktop Bridge plugin guidance ---
#
# figma-console communicates with Figma via a WebSocket bridge plugin.
# This plugin must be imported once and launched each session.
# We can't automate this — Figma has no CLI/API for plugin management.

MANIFEST_PATH=$(npx figma-console-mcp@latest --print-path 2>/dev/null || echo "")

echo ""
echo "  ─────────────────────────────────────────────────"
echo "  Figma Desktop Bridge — required for /graphics"
echo "  ─────────────────────────────────────────────────"
echo ""
echo "  MCP servers (figma + figma-console) are bundled"
echo "  with the GTM plugin — no manual registration needed."
echo ""
echo "  The one manual step: import the Desktop Bridge plugin."
echo ""
echo "  ONE-TIME SETUP:"
echo "    1. Open Figma Desktop (not browser)"
echo "    2. Right-click canvas → Plugins → Development → Import plugin from manifest..."
if [[ -n "$MANIFEST_PATH" ]]; then
  echo "    3. Select this file:"
  echo "       $MANIFEST_PATH"
else
  echo "    3. Run: npx figma-console-mcp@latest --print-path"
  echo "       Then select the manifest.json path it prints."
fi
echo ""
echo "  EACH SESSION:"
echo "    1. Open your target Figma file in Figma Desktop"
echo "    2. Right-click canvas → Plugins → Development → Figma Desktop Bridge"
echo "    3. Wait for green 'MCP Ready' status"
echo ""
echo "  ─────────────────────────────────────────────────"
echo "  ⚠  RESTART CLAUDE CODE to load MCP servers."
echo "  ─────────────────────────────────────────────────"
echo ""
echo "=== Graphics Setup Complete ==="
