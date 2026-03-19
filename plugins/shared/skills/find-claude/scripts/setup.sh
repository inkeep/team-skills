#!/usr/bin/env bash
set -euo pipefail

# Setup script for find-claude skill
# Installs the keyword indexer (always) and optional semantic search (episodic-memory)

REPO_DIR="${HOME}/.claude/oss-repos/episodic-memory"
INDEX_SCRIPT="$(dirname "$0")/index-sessions.ts"

echo "=== find-claude setup ==="
echo ""

# Step 1: Build keyword index (no dependencies, always works)
echo "[1/4] Building keyword index..."
if command -v bun &>/dev/null; then
  bun "$INDEX_SCRIPT" --full 2>&1 | tail -1
else
  echo "  ERROR: bun is required. Install: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

# Step 2: Clone episodic-memory
echo ""
echo "[2/4] Setting up semantic search (episodic-memory)..."
if [ -d "$REPO_DIR" ]; then
  echo "  Already cloned at $REPO_DIR"
  cd "$REPO_DIR" && git pull --quiet 2>/dev/null || true
else
  echo "  Cloning github.com/obra/episodic-memory..."
  git clone --quiet https://github.com/obra/episodic-memory.git "$REPO_DIR"
fi

# Step 3: Install dependencies + link
echo ""
echo "[3/4] Installing dependencies (this compiles native modules)..."
cd "$REPO_DIR"
npm install --quiet 2>&1 | tail -3
npm link --quiet 2>&1 | tail -1

# Verify it's on PATH
if ! command -v episodic-memory &>/dev/null; then
  echo "  WARNING: episodic-memory not found on PATH after npm link."
  echo "  You may need to add npm's global bin to your PATH."
  echo "  Try: export PATH=\"\$(npm config get prefix)/bin:\$PATH\""
fi

# Step 4: Initial sync (embeddings only, no API calls for summaries)
echo ""
echo "[4/4] Initial sync — embedding all sessions (this takes 5-10 minutes on first run)..."
echo "  Summaries are optional and require ANTHROPIC_API_KEY. Semantic search works without them."
echo ""

# Unset API key to skip summarization — user can enable later
ANTHROPIC_API_KEY="" episodic-memory sync 2>&1 | grep -E "^(Syncing|Loading|Embedding|Source|Destination|Indexed|Total|Generating)" || true

echo ""
echo "=== Setup complete ==="
echo ""
echo "Usage:"
echo "  bun $(dirname "$0")/search.ts \"your query\"         # parallel keyword + semantic search"
echo "  bun $(dirname "$0")/index-sessions.ts --stats        # index stats"
echo "  episodic-memory stats                                # semantic index stats"
echo ""
echo "To keep semantic index fresh, run periodically:"
echo "  episodic-memory sync"
echo ""
echo "To enable AI-generated summaries (optional, costs ~\$0.01/conversation):"
echo "  export ANTHROPIC_API_KEY=your-key"
echo "  episodic-memory sync"
