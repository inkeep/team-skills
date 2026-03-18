#!/usr/bin/env bash
set -euo pipefail

# launch-bridge.sh — Open a Figma file and launch the Desktop Bridge plugin
#
# Opens a Figma file by key (defaults to the Graphics Workspace), waits for
# the file to load, then launches "Figma Desktop Bridge" by name via
# AppleScript menu navigation (Plugins → Development → Figma Desktop Bridge).
#
# Prerequisites:
#   - Figma Desktop installed at /Applications/Figma.app
#   - Desktop Bridge plugin imported (one-time setup — see README)
#
# Usage:
#   ./launch-bridge.sh                          # opens Graphics Workspace
#   ./launch-bridge.sh S5kGTPZ0kSjmSxusJ56QJH  # opens specific file
#   ./launch-bridge.sh --status                 # just check if bridge is connected
#
# macOS only (uses osascript + open command).

DEFAULT_FILE_KEY="S5kGTPZ0kSjmSxusJ56QJH"  # Inkeep Agent Graphics Workspace
FILE_KEY="${1:-$DEFAULT_FILE_KEY}"

# --- Status check mode ---
if [[ "$FILE_KEY" == "--status" ]]; then
  if command -v npx &>/dev/null; then
    # Quick check: try connecting to the WebSocket server
    WS_PORT=$(lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -E '922[3-9]|923[0-2]' | head -1 | awk '{print $9}' | cut -d: -f2)
    if [[ -n "$WS_PORT" ]]; then
      echo "✅ Desktop Bridge WebSocket server listening on port $WS_PORT"
    else
      echo "❌ No Desktop Bridge WebSocket server found (ports 9223-9232)"
      echo "   Launch with: ./launch-bridge.sh"
    fi
  fi
  exit 0
fi

# --- Preflight ---
if [[ "$(uname)" != "Darwin" ]]; then
  echo "Error: This script requires macOS (uses osascript + Figma Desktop)."
  exit 1
fi

if [[ ! -d "/Applications/Figma.app" ]]; then
  echo "Error: Figma Desktop not found at /Applications/Figma.app"
  echo "  Install from: https://www.figma.com/downloads/"
  exit 1
fi

# --- Open the file ---
echo "Opening Figma file ${FILE_KEY}..."
open "figma://file/${FILE_KEY}"

# Wait for the file to load. Figma needs a few seconds, especially if cold-starting.
FIGMA_WAS_RUNNING=$(pgrep -x "Figma" >/dev/null 2>&1 && echo "yes" || echo "no")
if [[ "$FIGMA_WAS_RUNNING" == "no" ]]; then
  echo "Figma is cold-starting — waiting 8s..."
  sleep 8
else
  echo "Waiting for file to load (3s)..."
  sleep 3
fi

# --- Launch Desktop Bridge by name ---
echo "Launching Figma Desktop Bridge..."
osascript -e '
tell application "Figma" to activate
delay 0.5
tell application "System Events"
  tell process "Figma"
    click menu item "Figma Desktop Bridge" of menu 1 of menu item "Development" of menu 1 of menu bar item "Plugins" of menu bar 1
  end tell
end tell
' 2>/dev/null

if [[ $? -eq 0 ]]; then
  echo ""
  echo "✅ Launched Figma Desktop Bridge."
  echo "   Look for the green 'MCP Ready' status widget in Figma."
else
  echo ""
  echo "⚠️  Could not launch the plugin via menu automation."
  echo "   This usually means the plugin isn't imported yet."
  echo ""
  echo "   One-time setup:"
  echo "     1. Right-click canvas → Plugins → Development → Import plugin from manifest..."
  echo "     2. Select: $(npx figma-console-mcp@latest --print-path 2>/dev/null || echo 'run: npx figma-console-mcp@latest --print-path')"
  echo "     3. Then re-run this script."
fi
