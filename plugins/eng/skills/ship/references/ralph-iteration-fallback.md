Use when: Ralph-loop plugin is not available; ship manages iteration directly (Phase 3)
Priority: P0
Impact: No iteration mechanism; implementation stalls after one ralph invocation

---

# Ship-Managed Iteration (Ralph-Loop Fallback)

When the `/ralph-loop` plugin is not available (e.g., Docker container, non-Claude-Code environment), ship manages the iteration loop directly. The implementation prompt and ralph's per-iteration behavior are identical — the only difference is who feeds the prompt back.

---

## Loop protocol

```
iteration = 0
max_iterations = <from Phase 3 tuning table>

while iteration < max_iterations:
  1. Invoke ralph with the implementation prompt (same prompt every iteration)
  2. Wait for ralph to complete (it implements one story and updates prd.json)
  3. Read prd.json — check story completion status
  4. If all stories have passes: true → exit loop (success)
  5. Read progress.txt for blockers or learnings
  6. If the same story has been attempted for 2+ consecutive iterations without progress:
     - Flag as stuck
     - Consider: split the story, rewrite acceptance criteria, or skip and document
  7. iteration++

If loop exits without all stories complete:
  - Report which stories remain incomplete
  - Include progress.txt blockers
  - Consult the user on how to proceed
```

## Key differences from ralph-loop

| Aspect | Ralph-loop | Ship-managed |
|---|---|---|
| Iteration trigger | Stop hook detects non-completion, re-invokes automatically | Ship reads prd.json and re-invokes manually |
| Completion detection | Completion promise string (`IMPLEMENTATION COMPLETE`) | Ship reads `passes: true` on all stories in prd.json |
| Max iterations | `--max-iterations` flag | Ship tracks counter |
| Stuck detection | Ralph-loop has no built-in stuck detection | Ship checks progress.txt for repeated attempts on same story |
| Context between iterations | None (fresh context each time) | None (identical — ralph has no memory either way) |

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

Use the same iteration limits as ralph-loop:

| Feature complexity | Recommended max iterations |
|---|---|
| Small (1-3 stories) | 10-15 |
| Medium (4-8 stories) | 20-30 |
| Large (9+ stories) | 30-50 |

These are safety limits, not targets. Well-sized stories should complete in 1-2 iterations each.
