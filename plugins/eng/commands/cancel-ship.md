---
description: "Cancel active Ship Loop"
allowed-tools: ["Bash(test -f tmp/ship/loop.md:*)", "Bash(rm tmp/ship/loop.md)", "Read(tmp/ship/loop.md)"]
hide-from-slash-command-tool: "true"
---

# Cancel Ship Loop

To cancel the ship loop:

1. Check if `tmp/ship/loop.md` exists using Bash: `test -f tmp/ship/loop.md && echo "EXISTS" || echo "NOT_FOUND"`

2. **If NOT_FOUND**: Say "No active ship loop found."

3. **If EXISTS**:
   - Read `tmp/ship/loop.md` to get the current iteration number from the `iteration:` field
   - Remove the file using Bash: `rm tmp/ship/loop.md`
   - Report: "Cancelled ship loop (was at iteration N)" where N is the iteration value

Note: Cancelling the loop does NOT cancel the `/ship` workflow. The state.json file persists in tmp/ship/. You can resume the workflow manually or start a new loop.
