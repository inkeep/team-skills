Use when: Neither Claude CLI subprocess nor ralph-loop is available; ship manages iteration via Task subagents (Phase 3, Path B — last resort)
Priority: P0
Impact: No iteration mechanism; implementation stalls after one ralph invocation

---

# Task Subagent Iteration (Path B — Last Resort)

When neither the Claude CLI subprocess (Path A) nor the `/ralph-loop` plugin (Path D) is available, ship manages the iteration loop by spawning each iteration as a Task tool subagent. This provides **context isolation** (ship's context is preserved) but **degraded capabilities**.

---

## Capability limitations

Task subagents have important restrictions compared to a full Claude Code subprocess:

| Capability | Task subagent | Full subprocess (Path A) |
|---|---|---|
| Spawn sub-subagents | No (cannot nest Task calls) | Yes |
| Access filesystem skills | No (skills are session-scoped) | Yes (reads from filesystem) |
| MCP server access | Limited | Full |
| Tool access | Core tools (Read, Write, Edit, Bash, Glob, Grep) | All tools |
| Max turns | Configurable via `max_turns` | Configurable via `--max-turns` |
| Context window | Same 200K as parent | Independent 200K |

**Key implication:** The Task subagent is a single-threaded executor. It cannot delegate work to sub-subagents or compose skills. For complex stories that benefit from parallel exploration or skill-guided behavior, prefer Path A or Path D.

## Invocation

Each iteration is a Task tool call with `subagent_type: "general-purpose"`:

```
Task(
  subagent_type: "general-purpose",
  description: "Ralph iteration N",
  prompt: "<full implementation prompt text>",
  max_turns: <max-turns>
)
```

**Critical:** The full implementation prompt text must be passed inline as the `prompt` parameter. Do NOT pass a file path reference — the subagent does not inherit ship's skill context and cannot resolve skill-relative paths. Read the saved prompt file (e.g., `.claude/ralph-prompt.md`) and pass its contents directly.

## Loop protocol

```
iteration = 0
max_iterations = <from tuning table>
stuck_tracker = {}  // story_id → consecutive_attempt_count

while iteration < max_iterations:
  1. Read the implementation prompt from the saved file
  2. Spawn a Task subagent with the prompt text
  3. Wait for the subagent to complete (returns a text response)
  4. Read prd.json — check story completion status (passes: true/false)
  5. If all stories have passes: true → exit loop (success)
  6. Read progress.txt for blockers or learnings from this iteration
  7. Track stuck stories:
     - For each story still at passes: false, increment stuck_tracker[story_id]
     - If stuck_tracker[story_id] >= 2 and progress.txt shows the same blocker:
       flag as stuck (see stuck story handling below)
  8. iteration++

If loop exits without all stories complete:
  - Report which stories remain incomplete
  - Include progress.txt blockers
  - Consult the user on how to proceed
```

## Stuck story handling

A story is "stuck" when:
- It has been attempted in 2+ consecutive iterations
- `passes` remains `false`
- `progress.txt` shows the same blocker repeated

**Actions for stuck stories:**

| Situation | Action |
|---|---|
| Story is too large (blocker is "ran out of context" or incomplete implementation) | Split into smaller stories in prd.json, reset `passes` on the new stories |
| Acceptance criteria are ambiguous (blocker mentions unclear requirements) | Rewrite criteria to be more specific and re-attempt |
| External dependency blocking (missing env var, unavailable service) | Skip the story, set `notes` to explain the blocker, move to next story |
| Implementation approach is wrong (repeated failures on same code path) | Add guidance to `progress.txt` suggesting an alternative approach for the next iteration |

After 3 consecutive stuck iterations on the same story, pause and consult the user.

## Tuning

| Feature complexity | Max iterations | Max turns per iteration |
|---|---|---|
| Small (1-3 stories) | 10-15 | 50 |
| Medium (4-8 stories) | 20-30 | 75 |
| Large (9+ stories) | 30-50 | 100 |

These are safety limits, not targets. Well-sized stories should complete in 1-2 iterations each.
