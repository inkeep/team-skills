#!/usr/bin/env bash
set -euo pipefail

# launch-bridge.sh — Open a Figma file and launch the Desktop Bridge plugin
#
# Opens a Figma file by key (defaults to the Graphics Workspace), waits for
# the file to load, then triggers "Run last plugin" (Cmd+Option+P) via
# AppleScript to start the Desktop Bridge.
#
# Prerequisites:
#   - Figma Desktop installed at /Applications/Figma.app
#   - Desktop Bridge plugin imported (one-time setup — see README)
#   - Desktop Bridge must be the LAST plugin you ran in Figma
#     (Cmd+Option+P reruns the most recent plugin)
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

# --- Launch "Run last plugin" ---
echo "Triggering 'Run last plugin' (Cmd+Option+P)..."
osascript \
  -e 'tell application "Figma" to activate' \
  -e 'delay 0.5' \
  -e 'tell application "System Events" to tell process "Figma" to keystroke "p" using {command down, option down}'

echo ""
echo "✅ Sent 'Run last plugin' to Figma."
echo ""
echo "   If the Desktop Bridge was your last plugin, it should now be connecting."
echo "   Look for the green 'MCP Ready' status widget in Figma."
echo ""
echo "   If a DIFFERENT plugin launched instead:"
echo "     1. Close that plugin"
echo "     2. Right-click canvas → Plugins → Development → Figma Desktop Bridge"
echo "     3. Then Cmd+Option+P will remember the bridge for next time"
