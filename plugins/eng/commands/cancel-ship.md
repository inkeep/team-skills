---
description: "Cancel active Ship Loop"
allowed-tools: ["Bash(test -f *loop.md:*)", "Bash(rm *loop.md)", "Read(*loop.md)"]
hide-from-slash-command-tool: "true"
---

# Cancel Ship Loop

The ship directory is configurable: `$CLAUDE_SHIP_DIR` env var, default `tmp/ship`.

To cancel the ship loop:

1. Resolve the ship directory: `SHIP_DIR="${CLAUDE_SHIP_DIR:-tmp/ship}"`

2. Check if `$SHIP_DIR/loop.md` exists using Bash: `test -f ${CLAUDE_SHIP_DIR:-tmp/ship}/loop.md && echo "EXISTS" || echo "NOT_FOUND"`

3. **If NOT_FOUND**: Say "No active ship loop found."

4. **If EXISTS**:
   - Read `$SHIP_DIR/loop.md` to get the current iteration number from the `iteration:` field
   - Remove the file using Bash: `rm ${CLAUDE_SHIP_DIR:-tmp/ship}/loop.md`
   - Report: "Cancelled ship loop (was at iteration N)" where N is the iteration value

Note: Cancelling the loop does NOT cancel the `/ship` workflow. The state.json file persists in `$SHIP_DIR/`. You can resume the workflow manually or start a new loop.
