#!/usr/bin/env bash
set -euo pipefail

# google-mcp.sh — Configure MCP servers for the GTM plugin
#
# Called by setup.sh when a skill has a "setup" field pointing here.
# Expects SECRETS_FILE env var pointing to the pulled secrets temp file.
#
# What it does:
#   1. Sets up Python venv for google-slides-mcp dependencies
#   2. Registers MCP servers with Claude Code (figma, figma-console, google-slides)
#   3. Prompts for Figma Personal Access Token (per-user, for figma-console-mcp)
#   4. Creates OAuth credentials JSON for gcloud ADC
#   5. Runs gcloud auth application-default login if no ADC exists

echo ""
echo "=== Google MCP Setup ==="

# --- 1. Set up Python venv for google-slides-mcp ---

VENV_DIR="$HOME/.config/inkeep-mcp/google-slides-venv"
PYTHON_WRAPPER="$HOME/bin/python"

if [[ ! -d "$VENV_DIR" ]]; then
  echo "  Creating Python venv for google-slides-mcp..."
  python3 -m venv "$VENV_DIR"
  echo "  Venv created at $VENV_DIR."
else
  echo "  Python venv already exists at $VENV_DIR."
fi

# Install deps from the npx-cached package (find the cache dir)
NPX_CACHE_DIR=$(find "$HOME/.npm/_npx" -path "*/google-slides-mcp/requirements.txt" -exec dirname {} \; 2>/dev/null | head -1)
if [[ -z "$NPX_CACHE_DIR" ]]; then
  echo "  Downloading google-slides-mcp to populate npx cache..."
  npx -y google-slides-mcp --help &>/dev/null || true
  NPX_CACHE_DIR=$(find "$HOME/.npm/_npx" -path "*/google-slides-mcp/requirements.txt" -exec dirname {} \; 2>/dev/null | head -1)
fi

if [[ -n "$NPX_CACHE_DIR" ]]; then
  echo "  Installing Python dependencies in venv..."
  "$VENV_DIR/bin/pip" install -q "langchain>=0.2.0,<0.3.0" 2>/dev/null
  "$VENV_DIR/bin/pip" install -q -r "$NPX_CACHE_DIR/requirements.txt" 2>/dev/null
  echo "  Python dependencies installed."
else
  echo "  WARNING: Could not find google-slides-mcp package. Run 'npx -y google-slides-mcp --help' first."
fi

# Create python wrapper script (the MCP server spawns 'python', not 'python3')
mkdir -p "$(dirname "$PYTHON_WRAPPER")"
cat > "$PYTHON_WRAPPER" << 'WRAPPER'
#!/bin/bash
export VIRTUAL_ENV="$HOME/.config/inkeep-mcp/google-slides-venv"
exec "$HOME/.config/inkeep-mcp/google-slides-venv/bin/python3" "$@"
WRAPPER
# Expand $HOME in the wrapper since it runs in a subprocess
sed -i '' "s|\$HOME|$HOME|g" "$PYTHON_WRAPPER"
chmod +x "$PYTHON_WRAPPER"
echo "  Python wrapper created at $PYTHON_WRAPPER."

# --- 2. Register MCP servers scoped to the team-skills repo ---
#
# MCP servers are registered as project-scoped in ~/.claude.json under the
# git root path (team-skills). Claude Code matches project scope by git root,
# so scoping to a subdirectory (plugins/gtm) won't work.

CLAUDE_JSON="$HOME/.claude.json"
GOOGLE_PROJECT_ID=$(node -e "const s=JSON.parse(require('fs').readFileSync(process.env.SECRETS_FILE,'utf8'));console.log(s.GOOGLE_PROJECT_ID||'inkeep')")
PYTHONPATH_VAL="${NPX_CACHE_DIR:-}"

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

  # Use jq to write all three MCP servers into the gtm project scope
  jq --arg path "$PROJECT_PATH" \
     --arg pythonpath "$PYTHONPATH_VAL" \
     --arg project "$GOOGLE_PROJECT_ID" \
     --arg binpath "$HOME/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" \
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
    } |
    # Add google-slides MCP
    .projects[$path].mcpServers["google-slides"] = {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "google-slides-mcp", "--use-adc", "--project", $project],
      "env": {
        "PATH": $binpath,
        "PYTHONPATH": $pythonpath,
        "PYTHONNOUSERSITE": "1",
        "GOOGLE_CLOUD_PROJECT": $project
      }
    }
  ' "$CLAUDE_JSON" > /tmp/claude-json-mcp-update.json && mv /tmp/claude-json-mcp-update.json "$CLAUDE_JSON"

  echo "  Registered 'figma', 'figma-console', and 'google-slides' (scoped to gtm plugin)."
fi

# --- 3. Figma Personal Access Token (per-user) ---
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
  else
    echo "  Figma Personal Access Token already configured."
  fi
fi

# --- 4. Create OAuth credentials JSON for gcloud ADC ---

CREDS_DIR="$HOME/.config/inkeep-mcp"
CREDS_FILE="$CREDS_DIR/google-oauth-credentials.json"

if [[ -f "$CREDS_FILE" ]]; then
  echo "  OAuth credentials JSON already exists at $CREDS_FILE."
else
  echo "  Creating OAuth credentials JSON..."
  mkdir -p "$CREDS_DIR"

  CREDS_FILE_PATH="$CREDS_FILE" SECRETS_FILE="$SECRETS_FILE" node -e "
    const fs = require('fs');
    const secrets = JSON.parse(fs.readFileSync(process.env.SECRETS_FILE, 'utf8'));
    const clientId = secrets.GOOGLE_CLIENT_ID;
    const clientSecret = secrets.GOOGLE_CLIENT_SECRET;
    const projectId = secrets.GOOGLE_PROJECT_ID || 'inkeep';

    if (!clientId || !clientSecret) {
      console.error('Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found in secrets.');
      process.exit(1);
    }

    const creds = {
      installed: {
        client_id: clientId,
        project_id: projectId,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_secret: clientSecret,
        redirect_uris: ['http://localhost']
      }
    };

    fs.writeFileSync(process.env.CREDS_FILE_PATH, JSON.stringify(creds, null, 2) + '\n');
  "

  chmod 600 "$CREDS_FILE"
  echo "  Created credentials JSON at $CREDS_FILE (chmod 600)."
fi

# --- 5. gcloud ADC login ---

ADC_FILE="$HOME/.config/gcloud/application_default_credentials.json"

if [[ -f "$ADC_FILE" ]]; then
  echo "  gcloud ADC already configured."
else
  echo ""
  echo "  gcloud Application Default Credentials not found."
  echo "  This is needed for the google-slides MCP server (uses ADC)."
  echo ""

  if command -v gcloud &>/dev/null; then
    echo "  Run this command to authenticate (opens a browser):"
    echo ""
    echo "    gcloud auth application-default login \\"
    echo "      --client-id-file=$CREDS_FILE \\"
    echo "      --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/spreadsheets \\"
    echo "      --project=inkeep"
    echo ""

    read -p "  Run gcloud auth now? [Y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]?$ ]]; then
      gcloud auth application-default login \
        --client-id-file="$CREDS_FILE" \
        --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/spreadsheets \
        --project=inkeep
    fi
  else
    echo "  gcloud CLI not found. Install it first:"
    echo "    brew install --cask google-cloud-sdk"
    echo ""
    echo "  Then run the gcloud auth command above."
  fi
fi

echo ""
echo "=== Google MCP Setup Complete ==="
