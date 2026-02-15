Use when: Claude CLI subprocess is available; ship manages iteration via spawning independent processes (Phase 3, Path A)
Priority: P0
Impact: Without this, ship cannot execute context-isolated iterations with full capabilities

---

# Subprocess Iteration (Path A)

Each implementation iteration spawns a fully independent Claude Code process via `claude -p`. The subprocess is a complete Claude Code instance — it can spawn its own subagents, use MCP servers, access all tools, and read project-level CLAUDE.md/AGENTS.md files. Ship manages the iteration loop by reading prd.json between iterations.

---

## Prerequisites

Before using this path, verify (from Phase 0 detection):
1. Claude CLI is accessible: `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude --version` succeeds
2. The implementation prompt has been saved to a file (e.g., `.claude/ralph-prompt.md`)
3. `prd.json` exists in the working directory

## Subprocess command

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "$(cat .claude/ralph-prompt.md)" \
  --dangerously-skip-permissions \
  --max-turns <max-turns> \
  --output-format json
```

**Why each flag matters:**

| Flag / override | Purpose |
|---|---|
| `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` | **Required.** Unsets two environment variables that Claude Code uses to detect nested sessions. Without this, the subprocess will refuse to start with "Claude Code cannot be launched inside another Claude Code session." |
| `-p "$(cat ...)"` | Passes the implementation prompt via the print/non-interactive flag. The prompt is read from the saved file — not re-emitted by ship. This is deterministic and exact. |
| `--dangerously-skip-permissions` | Allows the subprocess to use tools (Read, Write, Edit, Bash, etc.) without interactive permission prompts. Required because `-p` mode has no TTY for user confirmation. |
| `--max-turns <N>` | Limits the number of agentic turns (API round-trips) within a single iteration. Prevents runaway iterations. See tuning table below. |
| `--output-format json` | Returns structured JSON output. Ship parses this to confirm the iteration completed. |

**What the subprocess inherits from the filesystem (automatically):**
- Project-level `CLAUDE.md` / `AGENTS.md` (read from the working directory)
- `.claude/settings.local.json` (project-level settings)
- User-level `~/.claude/settings.json` (user settings)
- MCP server configurations (from settings files)
- Git context (branch, status, etc.)

**What the subprocess does NOT inherit:**
- Ship's in-memory context (conversation history, task list, understanding of the spec)
- Loaded skills (skills are session-scoped; the subprocess starts fresh)
- Stop hooks do NOT fire in `-p` mode (this is why ship manages the loop, not ralph-loop)

## Iteration loop protocol

```
iteration = 0
max_iterations = <from tuning table>
stuck_tracker = {}  // story_id → consecutive_attempt_count

while iteration < max_iterations:
  1. Run the subprocess command (see below for background execution)
  2. Wait for subprocess to complete
  3. Parse subprocess output (JSON) — verify it completed without error
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

## Background execution

Implementation iterations can exceed the Bash tool's 600-second timeout. Use `run_in_background: true` on the Bash tool call:

```
Bash(command: "env -u CLAUDECODE ...", run_in_background: true, description: "Ralph iteration N")
```

Then poll for completion using the TaskOutput tool with `block: false` at intervals (e.g., every 60 seconds). When the task completes, read the output and proceed to step 3 of the loop.

While waiting, ship can perform lightweight tasks (re-read the spec, review task list) but should NOT make code changes that could conflict with the running iteration.

## Error handling

| Error | Cause | Action |
|---|---|---|
| "Claude Code cannot be launched inside another Claude Code session" | `CLAUDECODE` or `CLAUDE_CODE_ENTRYPOINT` env vars not unset | Add `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` prefix |
| Command not found: `claude` | Claude CLI not on PATH | Automated iteration not possible — save prompt to `.claude/ralph-prompt.md` and give the user manual iteration instructions (see Phase 3 Step 2 in SKILL.md) |
| Subprocess exits with non-zero status | Iteration agent hit an error | Read stderr/output for details. If transient (network, rate limit), retry once. If persistent, save prompt and give the user manual iteration instructions. |
| JSON parse error on output | Subprocess produced non-JSON output | Retry with `--output-format json`. If persistent, read raw output as text. |
| Subprocess runs beyond expected time | Complex iteration, large codebase | Increase `--max-turns`. If consistently slow, consider splitting stories in prd.json. |

## Tuning

| Feature complexity | Max iterations | Max turns per iteration |
|---|---|---|
| Small (1-3 stories) | 10-15 | 50 |
| Medium (4-8 stories) | 20-30 | 75 |
| Large (9+ stories) | 30-50 | 100 |

Max iterations are safety limits, not targets. Well-sized stories should complete in 1-2 iterations each. Max turns controls how much work a single iteration can do before being cut off — increase for complex stories, decrease if iterations are producing low-quality output from context exhaustion.

## Stuck story handling

A story is "stuck" when:
- It has been attempted in 2+ consecutive iterations
- `passes` remains `false`
- `progress.txt` shows the same blocker repeated

| Situation | Action |
|---|---|
| Story is too large (blocker is "ran out of context" or incomplete implementation) | Split into smaller stories in prd.json, reset `passes` on the new stories |
| Acceptance criteria are ambiguous (blocker mentions unclear requirements) | Rewrite criteria to be more specific and re-attempt |
| External dependency blocking (missing env var, unavailable service) | Skip the story, set `notes` to explain the blocker, move to next story |
| Implementation approach is wrong (repeated failures on same code path) | Add guidance to `progress.txt` suggesting an alternative approach for the next iteration |

After 3 consecutive stuck iterations on the same story, pause and consult the user.
