#!/usr/bin/env bash
set -euo pipefail

# graphics.sh — Configure MCP servers for the /graphics skill
#
# Called by setup.sh when a skill has a "setup" field pointing here.
# Expects SECRETS_FILE env var pointing to the pulled secrets temp file.
#
# What it does:
#   1. Registers figma (read-only) and figma-console (write) MCP servers
#   2. Prompts for Figma Personal Access Token (per-user, for figma-console-mcp)

echo ""
echo "=== Graphics MCP Setup ==="

# --- 1. Register MCP servers scoped to the team-skills repo ---
#
# MCP servers are registered as project-scoped in ~/.claude.json under the
# git root path (team-skills). Claude Code matches project scope by git root,
# so scoping to a subdirectory (plugins/gtm) won't work.

CLAUDE_JSON="$HOME/.claude.json"

# Resolve the git root path. Claude Code uses git root for project-scoped MCPs.
PROJECT_PATH=""
SCRIPT_DIR_RESOLVED="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -d "$SCRIPT_DIR_RESOLVED/.git" ]]; then
  PROJECT_PATH="$SCRIPT_DIR_RESOLVED"
elif [[ -d "$SCRIPT_DIR_RESOLVED/../.git" ]]; then
  PROJECT_PATH="$(cd "$SCRIPT_DIR_RESOLVED/.." && pwd)"
elif command -v git &>/dev/null; then
  PROJECT_PATH="$(git -C "$SCRIPT_DIR_RESOLVED" rev-parse --show-toplevel 2>/dev/null || echo "")"
fi
# Fallback: marketplace install path (use the repo root, not plugins/gtm)
if [[ -z "$PROJECT_PATH" && -d "$HOME/.claude/plugins/marketplaces/inkeep-team-skills/.git" ]]; then
  PROJECT_PATH="$HOME/.claude/plugins/marketplaces/inkeep-team-skills"
fi

if [[ -z "$PROJECT_PATH" ]]; then
  echo "  WARNING: Could not find git root path. Skipping MCP registration."
  echo "  You may need to register MCP servers manually."
else
  echo "  Registering MCP servers scoped to: $PROJECT_PATH"

  # Read existing figma-console token (if any) so we don't overwrite it
  EXISTING_FIGMA_TOKEN=$(jq -r --arg path "$PROJECT_PATH" \
    '.projects[$path].mcpServers["figma-console"].env.FIGMA_ACCESS_TOKEN // ""' \
    "$CLAUDE_JSON" 2>/dev/null || echo "")

  # Use jq to write figma + figma-console MCP servers into the project scope
  jq --arg path "$PROJECT_PATH" \
     --arg figma_token "${EXISTING_FIGMA_TOKEN:-figd_PLACEHOLDER}" '
    # Ensure the project entry exists
    .projects[$path] //= {
      "allowedTools": [],
      "mcpContextUris": [],
      "mcpServers": {},
      "enabledMcpjsonServers": [],
      "disabledMcpjsonServers": [],
      "hasTrustDialogAccepted": false,
      "projectOnboardingSeenCount": 0
    } |
    # Add figma MCP (official — read-only, brand tokens, design context)
    .projects[$path].mcpServers.figma = {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    } |
    # Add figma-console MCP (southleft — write designs, Plugin API access)
    .projects[$path].mcpServers["figma-console"] = {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "figma-console-mcp@latest"],
      "env": {
        "FIGMA_ACCESS_TOKEN": $figma_token,
        "ENABLE_MCP_APPS": "true"
      }
    }
  ' "$CLAUDE_JSON" > /tmp/claude-json-mcp-update.json && mv /tmp/claude-json-mcp-update.json "$CLAUDE_JSON"

  echo "  Registered 'figma' and 'figma-console' MCP servers."
fi

# --- 2. Figma Personal Access Token (per-user) ---
#
# figma-console-mcp requires a Figma Personal Access Token for REST API calls.
# This is per-user (tied to individual Figma accounts), not shared.

if [[ -n "$PROJECT_PATH" ]]; then
  CURRENT_TOKEN=$(jq -r --arg path "$PROJECT_PATH" \
    '.projects[$path].mcpServers["figma-console"].env.FIGMA_ACCESS_TOKEN // ""' \
    "$CLAUDE_JSON" 2>/dev/null || echo "")

  if [[ -z "$CURRENT_TOKEN" || "$CURRENT_TOKEN" == "figd_PLACEHOLDER" ]]; then
    echo ""
    echo "  Figma Personal Access Token needed for figma-console-mcp."
    echo "  This token is per-user (tied to your Figma account)."
    echo ""
    echo "  To create one:"
    echo "    1. Go to https://www.figma.com/settings (Security tab)"
    echo "    2. Under 'Personal access tokens', click 'Generate new token'"
    echo "    3. Name: figma-console-mcp"
    echo "    4. Expiration: 90 days (max)"
    echo "    5. Scopes: check all under 'Files' and 'Design systems'"
    echo "    6. Click 'Generate token' and copy it"
    echo ""

    # Skip interactive prompts if no TTY (e.g. running from Claude Code)
    if [[ ! -t 0 ]]; then
      echo "  NOTE: Non-interactive shell detected — skipping Figma token prompt."
      echo "  To add your token later, run:"
      echo ""
      echo "    jq --arg token \"figd_YOUR_TOKEN\" --arg path \"$PROJECT_PATH\" \\"
      echo "      '.projects[\$path].mcpServers[\"figma-console\"].env.FIGMA_ACCESS_TOKEN = \$token' \\"
      echo "      ~/.claude.json > /tmp/claude-json-figma-token.json && \\"
      echo "      mv /tmp/claude-json-figma-token.json ~/.claude.json"
      echo ""
    else
      # Try to open Figma settings in the browser
      if command -v open &>/dev/null; then
        read -p "  Open Figma settings in your browser? [Y/n] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]?$ ]]; then
          open "https://www.figma.com/settings"
          echo "  Opened Figma settings. Switch to the 'Security' tab."
          echo ""
        fi
      fi

      read -p "  Paste your Figma token (starts with figd_): " FIGMA_TOKEN
      echo

      if [[ "$FIGMA_TOKEN" == figd_* ]]; then
        jq --arg path "$PROJECT_PATH" --arg token "$FIGMA_TOKEN" \
          '.projects[$path].mcpServers["figma-console"].env.FIGMA_ACCESS_TOKEN = $token' \
          "$CLAUDE_JSON" > /tmp/claude-json-figma-token.json && \
          mv /tmp/claude-json-figma-token.json "$CLAUDE_JSON"
        echo "  Figma token saved to ~/.claude.json."
      else
        echo "  WARNING: Token doesn't start with 'figd_'. Skipping."
        echo "  You can set it manually later in ~/.claude.json under:"
        echo "    .projects[\"$PROJECT_PATH\"].mcpServers[\"figma-console\"].env.FIGMA_ACCESS_TOKEN"
      fi
    fi
  else
    echo "  Figma Personal Access Token already configured."
  fi
fi

# --- 3. Desktop Bridge plugin guidance ---
#
# figma-console communicates with Figma via a WebSocket bridge plugin.
# This plugin must be imported once and run each session.
# We can't automate this — Figma has no CLI/API for plugin management.

MANIFEST_PATH=$(npx figma-console-mcp@latest --print-path 2>/dev/null || echo "")

echo ""
echo "  ─────────────────────────────────────────────────"
echo "  Figma Desktop Bridge — required for /graphics"
echo "  ─────────────────────────────────────────────────"
echo ""
echo "  The figma-console MCP talks to Figma via a Desktop Bridge plugin."
echo "  This is a one-time import + a per-session launch."
echo ""
echo "  ONE-TIME SETUP (import the plugin):"
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
echo "  EACH SESSION (run the plugin):"
echo "    1. Open your target Figma file in Figma Desktop"
echo "    2. Right-click canvas → Plugins → Development → Figma Desktop Bridge"
echo "    3. A small status widget appears — wait for green 'MCP Ready'"
echo ""
echo "  The /graphics skill checks this automatically via figma_get_status"
echo "  and will guide you if the plugin isn't running."
echo ""
echo "  ─────────────────────────────────────────────────"
echo "  ⚠  RESTART CLAUDE CODE to load the new MCP servers."
echo "  ─────────────────────────────────────────────────"
echo "  MCP servers are loaded at startup. Exit Claude Code"
echo "  and reopen it for /graphics to work."
echo ""
echo "=== Graphics MCP Setup Complete ==="
