#!/usr/bin/env bash
set -euo pipefail

# launch-bridge.sh — Open a Figma file and launch the Desktop Bridge plugin
#
# Opens a Figma file by key (defaults to the Graphics Workspace), waits for
# the file to load, then launches "Figma Desktop Bridge" by name via
# AppleScript menu navigation (Plugins → Development → Figma Desktop Bridge).
#
# The bridge only needs to run in the file you're creating designs in.
# Brand assets are imported via component keys (tokens/figma.json) — the
# Graphics & Icons file doesn't need to be open.
#
# Prerequisites:
#   - Figma Desktop installed at /Applications/Figma.app
#   - Desktop Bridge plugin imported (one-time setup — see README)
#
# Usage:
#   ./launch-bridge.sh                          # opens Graphics Workspace + bridge
#   ./launch-bridge.sh S5kGTPZ0kSjmSxusJ56QJH  # opens specific file + bridge
#   ./launch-bridge.sh --both                   # opens Graphics Workspace + Graphics & Icons, bridge on both
#   ./launch-bridge.sh --status                 # check if bridge is connected
#
# macOS only (uses osascript + open command).

GRAPHICS_WORKSPACE="S5kGTPZ0kSjmSxusJ56QJH"  # Inkeep Agent Graphics Workspace
DESIGN_ASSETS="D7NDSM2peo1iLhkjLxmGP5"       # Graphics & Icons (Brand Assets)

# --- Status check mode ---
if [[ "${1:-}" == "--status" ]]; then
  WS_PORT=$(lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | grep -E '922[3-9]|923[0-2]' | head -1 | awk '{print $9}' | cut -d: -f2)
  if [[ -n "$WS_PORT" ]]; then
    echo "✅ Desktop Bridge WebSocket server listening on port $WS_PORT"
  else
    echo "❌ No Desktop Bridge WebSocket server found (ports 9223-9232)"
    echo "   Launch with: ./launch-bridge.sh"
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

# --- Determine which files to open ---
BOTH=false
if [[ "${1:-}" == "--both" ]]; then
  BOTH=true
  FILES=("$GRAPHICS_WORKSPACE" "$DESIGN_ASSETS")
  FILE_NAMES=("Graphics Workspace" "Graphics & Icons")
elif [[ -n "${1:-}" ]]; then
  FILES=("$1")
  FILE_NAMES=("$1")
else
  FILES=("$GRAPHICS_WORKSPACE")
  FILE_NAMES=("Graphics Workspace")
fi

FIGMA_WAS_RUNNING=$(pgrep -x "Figma" >/dev/null 2>&1 && echo "yes" || echo "no")

# --- Helper: open file + launch bridge ---
launch_bridge_in_file() {
  local file_key="$1"
  local file_name="$2"

  echo "Opening ${file_name} (${file_key})..."
  open "figma://file/${file_key}"

  if [[ "$FIGMA_WAS_RUNNING" == "no" ]]; then
    echo "Figma is cold-starting — waiting 8s..."
    sleep 8
    FIGMA_WAS_RUNNING="yes"  # only wait long once
  else
    echo "Waiting for file to load (3s)..."
    sleep 3
  fi

  echo "Launching Desktop Bridge in ${file_name}..."
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
    echo "✅ Bridge launched in ${file_name}"
  else
    echo "⚠️  Could not launch bridge in ${file_name}"
    echo "   Plugin may not be imported yet. Import it first:"
    echo "   Plugins → Development → Import plugin from manifest..."
    echo "   Path: $(npx figma-console-mcp@latest --print-path 2>/dev/null || echo 'run: npx figma-console-mcp@latest --print-path')"
    return 1
  fi
}

# --- Launch ---
for i in "${!FILES[@]}"; do
  launch_bridge_in_file "${FILES[$i]}" "${FILE_NAMES[$i]}"
  echo ""
done

if $BOTH; then
  echo "Both files open with bridge running."
  echo "  Graphics Workspace — create designs here"
  echo "  Graphics & Icons — for cross-file clone operations (fallback)"
else
  echo "Ready. Bridge is running in ${FILE_NAMES[0]}."
  echo "  Brand assets are imported via component keys — Graphics & Icons file not needed."
fi
