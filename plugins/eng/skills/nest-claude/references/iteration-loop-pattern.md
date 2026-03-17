Use when: Building an iteration loop that spawns fresh child Claude Code instances per iteration, with file-based state persistence across stateless children
Priority: P1
Impact: Without this, you'll reinvent the wheel poorly — missing completion cross-verification, context exhaustion handling, or progress tracking between iterations

---

# Iteration Loop Pattern

A bash loop that spawns fresh, stateless child Claude Code instances — one per iteration — using files on disk as the durable memory between them. Each child reads the current state, does work, updates the state file, and exits. The loop checks progress and decides whether to spawn the next child.

This is the pattern `/implement` uses via `implement.sh`. It generalizes to any multi-step workflow where a single child's context window isn't enough to complete all work.

---

## Loop structure

```bash
#!/bin/bash
set -e

MAX_ITERATIONS=10
MAX_TURNS=75
STATE_FILE="state.json"       # Durable state — survives across children
PROMPT_FILE="prompt.md"       # Child's instructions (reads STATE_FILE)
PROGRESS_FILE="progress.txt"  # Append-only log across iterations

for ((i=1; i<=MAX_ITERATIONS; i++)); do
    OUTPUT_FILE=$(mktemp)

    # Spawn a fresh child — no memory of previous iterations
    env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
        -p "$(cat "$PROMPT_FILE")" \
        --dangerously-skip-permissions \
        --max-turns "$MAX_TURNS" \
        --output-format json \
        < /dev/null \
        2>&1 | tee "$OUTPUT_FILE" || true

    # Child exited. Check progress via the filesystem.
    # (Your completion check logic here — see "Completion detection" below)

    if is_all_work_done "$STATE_FILE" "$OUTPUT_FILE"; then
        rm -f "$OUTPUT_FILE"
        echo "All work complete after $i iterations."
        exit 0
    fi

    rm -f "$OUTPUT_FILE"
    sleep 2
done

echo "Max iterations reached ($MAX_ITERATIONS). Check $STATE_FILE for incomplete work."
exit 1
```

**Key properties:**
- Each child is a fresh `claude -p` process with zero memory of prior iterations.
- `|| true` after the spawning command ensures the loop continues even if the child exits non-zero (context exhaustion, error, etc.).
- The loop doesn't care *why* the child stopped — only whether all work is done.
- `sleep 2` between iterations prevents hammering the API if children fail fast.

---

## State persistence via files

Children are stateless. Files are the memory.

```
Iteration 1:  child reads state.json → does work → updates state.json → exits
Iteration 2:  child reads state.json → picks up where #1 left off → updates → exits
Iteration N:  child reads state.json → finishes remaining work → exits
```

**State file** (e.g., `spec.json` in `/implement`): A structured file (usually JSON) that tracks what work items exist and which are complete. Each child reads it at startup and updates it as it completes work.

**Progress file** (e.g., `progress.txt`): An append-only log. Each child appends what it did, what blocked it, and what it recommends for the next iteration. The parent loop or a human reads this to understand trajectory.

**The prompt file** must instruct the child to:
1. Read the state file to find incomplete work
2. Pick the next item to work on
3. Do the work
4. Update the state file to reflect completion
5. Log progress to the progress file

---

## Completion detection

Two mechanisms, used together:

### 1. Sentinel string (fast check)

The child's prompt instructs it to output a specific string when all work is done:

```
When all items are complete, output exactly: TASK COMPLETE
```

The loop greps for it:

```bash
if grep -q "TASK COMPLETE" "$OUTPUT_FILE"; then
    # Proceed to cross-verification
fi
```

### 2. Cross-verification against state file (trust check)

Never trust the sentinel alone — LLMs can output false completion signals. Always verify against the state file:

```bash
if grep -q "TASK COMPLETE" "$OUTPUT_FILE"; then
    INCOMPLETE=$(jq '[.items[] | select(.done == false)] | length' "$STATE_FILE")
    if [[ "$INCOMPLETE" -gt 0 ]]; then
        echo "Warning: false completion signal — $INCOMPLETE items still incomplete."
        continue  # Keep iterating
    fi
    # Genuinely complete
    exit 0
fi
```

**The sentinel is an optimization, not a guarantee.** The state file is the source of truth.

---

## Context exhaustion handling

When a child hits `--max-turns`, it simply exits. This is not a crash — it's the normal end of a child that ran out of context window. The loop handles it identically to any other exit:

1. `|| true` prevents the non-zero exit code from killing the loop
2. The loop reads the state file to check progress
3. If work remains, it spawns the next iteration
4. The new child reads the updated state file fresh and picks up the next incomplete item

**The child doesn't know it "ran out of context."** It just stops. The loop doesn't know *why* the child stopped. Neither needs to — the state file captures what was accomplished, and the next child starts fresh.

This is why well-sized work items matter: each item should be completable within a single child's context window. If an item consistently doesn't complete in one iteration, it needs to be split smaller (see "Stuck detection" below).

---

## Progress tracking between iterations

After each iteration, read the state file to track trajectory:

```bash
# Count completed vs total
TOTAL=$(jq '.items | length' "$STATE_FILE")
DONE=$(jq '[.items[] | select(.done == true)] | length' "$STATE_FILE")
echo "Iteration $i complete. Progress: $DONE/$TOTAL"
```

Log this to the progress file so the parent (or a human) can see trajectory across iterations:

```bash
echo "## Iteration $i - $(date)" >> "$PROGRESS_FILE"
echo "Progress: $DONE/$TOTAL" >> "$PROGRESS_FILE"
```

### Stuck detection

A work item is "stuck" when it fails across consecutive iterations with the same blocker. Detection:

1. After each iteration, check which items remain incomplete
2. Compare their blockers in the progress file to the previous iteration's blockers
3. If the same item fails with the same blocker 2+ times in a row, it's stuck

**Remediation options:**
- Split the item into smaller pieces (most common — item was too large for one context window)
- Add guidance to the progress file suggesting an alternative approach (the next child will read it)
- Skip the item and note the blocker
- After 3 consecutive failures on the same item, stop and consult a human

---

## Tuning parameters

| Parameter | What it controls | Guidance |
|---|---|---|
| `--max-iterations` | Total loop iterations (safety limit) | Not a target. Well-sized items complete in 1-2 iterations each. Set to 2-3x the number of work items. |
| `--max-turns` | Context budget per child | 50 for focused tasks, 75 for medium complexity, 100 for complex items. Higher = more work per iteration but risk of quality degradation near context limits. |

| Work complexity | --max-iterations | --max-turns |
|---|---|---|
| Small (1-3 items) | 10-15 | 50 |
| Medium (4-8 items) | 20-30 | 75 |
| Large (9+ items) | 30-50 | 100 |

**Reduce `--max-turns`** if children produce low-quality output near the end of their context (sign of context exhaustion degradation).

**Increase `--max-turns`** if children consistently exit mid-item (sign they need more room to finish each unit of work).

---

## Running the loop from a parent Claude Code session

The loop script will typically exceed the Bash tool's 600-second timeout. Launch it in the background:

```
Bash(command: "scripts/my-loop.sh --max-iterations 15 --max-turns 75 --force",
     run_in_background: true,
     description: "Iteration loop run")
```

Poll for completion with `TaskOutput(block: false)`. Between polls, read the progress file to check trajectory. Do NOT make changes to files the children are working on — you'll create conflicts.
