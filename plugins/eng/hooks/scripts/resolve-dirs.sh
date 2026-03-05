#!/bin/bash
# resolve-dirs.sh — SessionStart hook that resolves configurable skill directories.
#
# Bridges the gap between settings.json `env` vars (invisible to the agent's
# reasoning context) and the agent's need to know resolved paths for mkdir,
# file creation, and catalogue scanning.
#
# Two outputs:
#   1. stdout → injected into agent conversation context (agent can "see" it)
#   2. CLAUDE_ENV_FILE → persisted for all Bash commands in the session
#
# Variables resolved:
#   CLAUDE_REPORTS_DIR  — used by /research (default: <repo>/reports or ~/reports)
#   CLAUDE_SPECS_DIR    — used by /spec (default: <repo>/specs or ~/.claude/specs)
#   CLAUDE_SHIP_DIR     — used by /ship, /implement (default: tmp/ship)

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")

# --- Resolve reports dir ---
if [ -z "${CLAUDE_REPORTS_DIR:-}" ]; then
  if [ -n "$REPO_ROOT" ]; then
    CLAUDE_REPORTS_DIR="$REPO_ROOT/reports"
  else
    CLAUDE_REPORTS_DIR="$HOME/reports"
  fi
fi

# --- Resolve specs dir ---
if [ -z "${CLAUDE_SPECS_DIR:-}" ]; then
  if [ -n "$REPO_ROOT" ]; then
    CLAUDE_SPECS_DIR="$REPO_ROOT/specs"
  else
    CLAUDE_SPECS_DIR="$HOME/.claude/specs"
  fi
fi

# --- Resolve ship dir ---
if [ -z "${CLAUDE_SHIP_DIR:-}" ]; then
  CLAUDE_SHIP_DIR="tmp/ship"
fi

# --- Inject into agent context (stdout) ---
echo "resolved-reports-dir: $CLAUDE_REPORTS_DIR"
echo "resolved-specs-dir: $CLAUDE_SPECS_DIR"
echo "resolved-ship-dir: $CLAUDE_SHIP_DIR"

# --- Persist for Bash commands (CLAUDE_ENV_FILE) ---
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export CLAUDE_REPORTS_DIR=\"$CLAUDE_REPORTS_DIR\"" >> "$CLAUDE_ENV_FILE"
  echo "export CLAUDE_SPECS_DIR=\"$CLAUDE_SPECS_DIR\"" >> "$CLAUDE_ENV_FILE"
  echo "export CLAUDE_SHIP_DIR=\"$CLAUDE_SHIP_DIR\"" >> "$CLAUDE_ENV_FILE"
fi
