---
name: nest-claude
description: "Spawn child Claude Code instances from a parent Claude Code session. Covers the env guard pattern, stdin redirection, parallel execution, monitoring, and result collection. Use when you need to run multiple independent Claude Code processes concurrently for tasks like parallel research, bulk code review, multi-repo operations, or any work that benefits from full isolated Claude Code sessions rather than lightweight Task-tool subagents. Triggers: spawn claude, nested claude, parallel claude, child process, subprocess claude, run N instances, concurrent agents, fan-out."
argument-hint: "[number of instances] [task description or prompt file path]"
---

# Nested Claude Code

Spawn full Claude Code child processes from a parent session. Each child gets its own context window, tool access, and session — unlike Task-tool subagents which are lighter but cannot nest and share a process.

**When to use this vs Task-tool subagents:**

| Need | Use |
|---|---|
| Quick subtask, result fits in a message | Task tool (Agent tool) |
| Long-running autonomous work (5+ min) | This pattern (subprocess) |
| Child needs to spawn its own subagents | This pattern (subprocess) |
| Parallel fan-out of N independent tasks | This pattern (subprocess) |
| Work that may exceed 600s Bash timeout | This pattern (background) |

---

## The spawning command

Every nested invocation requires these flags. Missing any one causes failures.

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Your prompt here" \
    --dangerously-skip-permissions \
    --max-turns 75 \
    < /dev/null \
    2>&1
```

| Flag | Why it's required |
|---|---|
| `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` | Claude Code sets these env vars on startup and refuses to launch if they're present. Unsetting them is what makes nesting possible. |
| `-p "..."` | Non-interactive mode. The prompt is the child's sole instruction. |
| `--dangerously-skip-permissions` | No TTY exists for permission prompts in `-p` mode. Without this, the child hangs waiting for confirmation. |
| `--max-turns N` | **Non-negotiable safety limit.** Prevents runaway children. Set at EVERY nesting level. 50-100 for focused tasks, 25-50 for simple tasks. |
| `< /dev/null` | **Critical for Level 2+ nesting.** Claude Code's Bash tool connects stdin via a unix socket. Without this redirect, grandchild processes hang indefinitely at 0% CPU. Always include it — it's harmless at Level 1 and required at Level 2+. |

### Optional flags

Add these based on your needs:

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Your prompt here" \
    --dangerously-skip-permissions \
    --max-turns 75 \
    --output-format json \
    --append-system-prompt "Additional instructions appended to system prompt" \
    --agent my-agent-name \
    --no-session-persistence \
    --max-budget-usd 1.00 \
    < /dev/null \
    2>&1
```

| Flag | Purpose |
|---|---|
| `--output-format json` | Structured output with `result`, `session_id`, `total_cost_usd`, `duration_ms`, `num_turns`. Use for collecting results programmatically. |
| `--output-format stream-json` | Real-time NDJSON stream. Use when you need live visibility into tool calls and progress. |
| `--append-system-prompt "..."` | Inject additional system instructions while preserving Claude Code's built-in defaults. Use `--system-prompt` only if you want to replace ALL defaults (rarely correct). |
| `--agent <name>` | Run as a specific agent defined in `.claude/agents/*.md`. The agent's markdown body becomes the session's system prompt. |
| `--no-session-persistence` | Don't save session to disk. Use for ephemeral children to avoid disk clutter. |
| `--max-budget-usd N` | Cost cap per child. Prevents expensive runaways. |
| `--resume <session-id>` | Continue a previous session with its full context. Use for multi-phase workflows where a child needs to pick up where it left off. |

---

## Parallel execution

To run N children concurrently, launch each as a background Bash command. Two patterns:

### Pattern A: Background Bash commands (simple, up to ~5 children)

Launch each child with `run_in_background: true` on the Bash tool. This returns immediately and gives you a task ID for polling.

```
Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p '...' --dangerously-skip-permissions --max-turns 75 --output-format json < /dev/null 2>&1 | tee /tmp/child-1-output.json",
     run_in_background: true,
     description: "Child 1: research topic A")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p '...' --dangerously-skip-permissions --max-turns 75 --output-format json < /dev/null 2>&1 | tee /tmp/child-2-output.json",
     run_in_background: true,
     description: "Child 2: research topic B")
```

Launch all Bash calls **in a single message** (multiple tool calls in one response) — they execute concurrently.

### Pattern B: Shell script for N children (more than 5, or dynamic)

Write a wrapper script that spawns all children and waits:

```bash
#!/bin/bash
set -e
PIDS=()
OUTPUT_DIR="/tmp/nested-claude-$$"
mkdir -p "$OUTPUT_DIR"

PROMPTS=(
    "Research topic A. Write findings to a file."
    "Research topic B. Write findings to a file."
    "Research topic C. Write findings to a file."
)

for i in "${!PROMPTS[@]}"; do
    env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
        -p "${PROMPTS[$i]}" \
        --dangerously-skip-permissions \
        --max-turns 75 \
        --output-format json \
        < /dev/null \
        > "$OUTPUT_DIR/child-$i.json" 2>&1 &
    PIDS+=($!)
    echo "Spawned child $i (PID: ${PIDS[-1]})"
done

echo "Waiting for ${#PIDS[@]} children..."
FAILED=0
for i in "${!PIDS[@]}"; do
    wait "${PIDS[$i]}" || ((FAILED++))
    echo "Child $i finished (exit code: $?)"
done

echo "All children complete. $FAILED failures."
echo "Results in: $OUTPUT_DIR/"
```

Run this script via the Bash tool with `run_in_background: true` since it will take a while.

### Concurrency limits

- There is no hard limit on concurrent `claude -p` subprocesses.
- Practical limit is your API rate limit and machine resources (each child is a separate process).
- 5-10 concurrent children is a reasonable default. Beyond 10, you may hit rate limits.
- The Task-tool subagent system has a ~10 concurrent limit with queuing; subprocess spawning does not have this limit.

---

## Monitoring and result collection

### For background children (Pattern A)

Poll with `TaskOutput(block: false)` to check if each child has finished. Don't poll too frequently — children typically take 3-15 minutes for substantial tasks.

Between polls, read output files to check progress:

```
Read("/tmp/child-1-output.json")
```

### For script-spawned children (Pattern B)

The script waits internally. Poll the script's background task. When it completes, read all output files from the output directory.

### Structured output parsing

With `--output-format json`, the child's final output is a JSON object:

```json
{
    "result": "The child's final text response",
    "session_id": "abc-123-...",
    "total_cost_usd": 0.42,
    "duration_ms": 180000,
    "num_turns": 12
}
```

Extract `result` for the child's findings. Use `session_id` with `--resume` if you need to continue the session.

### File-based IPC (recommended for complex tasks)

For tasks where children produce structured artifacts, have each child write to a designated output file:

```
Prompt: "Research X. Write your findings to /tmp/research/topic-a.md. Include a ## Summary section at the top."
```

The parent reads these files after all children complete. This is more reliable than parsing stdout because:
- Files persist even if the child crashes partway through
- Structured formats (markdown, JSON) are easier to aggregate than free-form text
- Multiple files can be written (findings, evidence, recommendations)

---

## Completion detection

Two approaches depending on the use case:

### Approach 1: Exit-based (simple, recommended)

Wait for the child process to exit. Read its output file. No sentinel strings needed.

### Approach 2: Sentinel + cross-verification (for iteration loops)

If you're building an iteration loop where children update shared state:

1. Child outputs a specific sentinel string when done (e.g., `TASK COMPLETE`)
2. Parent greps for sentinel in output: `grep -q "TASK COMPLETE" "$OUTPUT_FILE"`
3. Parent cross-verifies against the state file (e.g., check that all items are marked done)
4. If sentinel found but state disagrees, re-run — the child lied

Always cross-verify. LLMs can output false completion signals.

---

## What children inherit and don't

**Inherited (from the filesystem):**
- Project-level `CLAUDE.md` / `AGENTS.md`
- `.claude/settings.local.json` and `~/.claude/settings.json`
- MCP server configurations (unless `--strict-mcp-config` is used)
- Git context (branch, status)
- Skills and agents defined in `.claude/`

**NOT inherited:**
- Parent's conversation history
- Parent's accumulated context or loaded skill state
- Parent's permission approvals

Each child starts completely fresh. The prompt you pass via `-p` is their entire instruction.

---

## Nesting depth

```
Level 0: Your interactive session
  |-- Level 1: env -u ... claude -p "..."     (child subprocess)
  |     |-- Level 2: Task tool subagent       (in-process, CANNOT nest further)
  |     |-- Level 2: env -u ... claude -p     (grandchild subprocess, CAN nest further)
  |           |-- Level 3: ...                (same pattern, unlimited depth)
```

- **Subprocess path** (`env -u ... claude -p`): unlimited depth. Each level applies the same guard pattern.
- **Task-tool path**: single level only. Subagents spawned via the Task tool cannot spawn further subagents. This is a hard platform constraint.
- There is no hard depth limit beyond the env var check.
- At every level, include `env -u`, `--max-turns`, `--dangerously-skip-permissions`, and `< /dev/null`.

---

## Environment variables for isolation

When running multiple children concurrently in the same directory, they share filesystem state. For stronger isolation:

| Variable | Purpose | Example |
|---|---|---|
| `CLAUDE_CONFIG_DIR` | Separate config per instance | `/tmp/claude-config-$$-$i` |
| `CLAUDE_CODE_TMPDIR` | Separate temp files per instance | `/tmp/claude-tmp-$$-$i` |
| `ANTHROPIC_MODEL` | Per-instance model selection | `claude-sonnet-4-6` |
| `MCP_TIMEOUT` | Predictable MCP connection timeout | `30000` |
| `MCP_TOOL_TIMEOUT` | Predictable tool execution timeout | `60000` |

Example with isolation:

```bash
CLAUDE_CONFIG_DIR="/tmp/claude-config-$$-$i" \
CLAUDE_CODE_TMPDIR="/tmp/claude-tmp-$$-$i" \
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "..." \
    --dangerously-skip-permissions \
    --max-turns 75 \
    --no-session-persistence \
    < /dev/null \
    2>&1
```

Most use cases don't need this level of isolation. Use it when children might conflict on config or temp files.

---

## Crafting good child prompts

Each child has zero context from the parent. The prompt must be self-contained.

**Include:**
- The full task description
- Any file paths to read
- Output format expectations
- Where to write results (file path)
- What "done" means
- What to do if stuck

**Avoid:**
- Referencing "the previous conversation" or "what we discussed"
- Assuming the child knows anything not in its prompt
- Vague instructions like "continue the work" without specifying what work

**Template:**

```
You are performing [task type] on [subject].

## Task
[Clear, specific objective]

## Context
[Any background the child needs — file paths, constraints, prior findings]

## Output
Write your findings to [file path].
Format: [markdown/json/etc]
Include a ## Summary section at the top with key findings.

## Constraints
- Do not modify any source files
- Focus only on [scope]
- If blocked, write what you found so far and note the blocker
```

---

## Example: Parallel research (5 instances)

Spin up 5 Claude Code instances to research 5 different topics simultaneously:

```
# Launch all 5 in parallel (single message with multiple Bash tool calls)

Bash(command: "mkdir -p /tmp/research && env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research how React Server Components handle streaming. Write a comprehensive analysis to /tmp/research/rsc-streaming.md with a ## Summary at the top.' --dangerously-skip-permissions --max-turns 50 --output-format json --no-session-persistence < /dev/null > /tmp/research/rsc-streaming-meta.json 2>&1",
     run_in_background: true,
     description: "Research: RSC streaming")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research how Next.js App Router caching works. Write findings to /tmp/research/nextjs-caching.md with a ## Summary at the top.' --dangerously-skip-permissions --max-turns 50 --output-format json --no-session-persistence < /dev/null > /tmp/research/nextjs-caching-meta.json 2>&1",
     run_in_background: true,
     description: "Research: Next.js caching")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research Remix loader patterns and how they compare to Next.js. Write findings to /tmp/research/remix-loaders.md with a ## Summary at the top.' --dangerously-skip-permissions --max-turns 50 --output-format json --no-session-persistence < /dev/null > /tmp/research/remix-loaders-meta.json 2>&1",
     run_in_background: true,
     description: "Research: Remix loaders")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research TanStack Router architecture and its approach to type-safe routing. Write findings to /tmp/research/tanstack-router.md with a ## Summary at the top.' --dangerously-skip-permissions --max-turns 50 --output-format json --no-session-persistence < /dev/null > /tmp/research/tanstack-router-meta.json 2>&1",
     run_in_background: true,
     description: "Research: TanStack Router")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research Astro Islands architecture and partial hydration. Write findings to /tmp/research/astro-islands.md with a ## Summary at the top.' --dangerously-skip-permissions --max-turns 50 --output-format json --no-session-persistence < /dev/null > /tmp/research/astro-islands-meta.json 2>&1",
     run_in_background: true,
     description: "Research: Astro Islands")
```

After launching, wait for all to complete (poll every 3-5 minutes), then read and synthesize:

```
# Read all results
Read("/tmp/research/rsc-streaming.md")
Read("/tmp/research/nextjs-caching.md")
Read("/tmp/research/remix-loaders.md")
Read("/tmp/research/tanstack-router.md")
Read("/tmp/research/astro-islands.md")

# Read metadata for cost/duration tracking
Bash(command: "for f in /tmp/research/*-meta.json; do echo '---'; basename $f; jq '{cost: .total_cost_usd, duration_ms: .duration_ms, turns: .num_turns}' $f; done")
```

---

## Parent-child interaction model

A child spawned with `env -u ... claude -p` is fundamentally **fire-and-read**: the parent sends a prompt, the child runs autonomously, the parent reads results after exit. There is no built-in real-time bidirectional communication.

### What does NOT exist

- **No callback from child to parent.** A child cannot send a message to the parent mid-execution.
- **No permission escalation.** With `--dangerously-skip-permissions` (required), all permissions are auto-approved. The child cannot ask the parent "should I do this?"
- **No pause/resume signal.** The parent cannot pause a running child. The child cannot pause itself and wait for parent input.
- **No progress events.** The parent gets no "child is 50% done" notification (unless the child writes to a file the parent happens to read).
- **No shared memory or message queue.** All communication is file-based.

### What the parent sees when a child gets stuck

The child has no way to signal "I'm stuck" in real-time. It keeps going until it hits `--max-turns` or `--max-budget-usd`, then exits. The parent discovers what happened after the fact:

| Exit reason | How parent detects it | JSON output field |
|---|---|---|
| Natural completion | Process exits 0 | `result.subtype: "success"` |
| Ran out of turns | Process exits | `result.subtype: "error_max_turns"` |
| Budget exhausted | Process exits | `result.subtype: "error_max_budget_usd"` |
| Crash / error | Process exits non-zero | `result.subtype: "error_during_execution"` |
| Child wrote "I'm stuck" | Parent reads output file after exit | Grep output for blocker keywords |

### Five interaction patterns (from simplest to most capable)

**1. Fire-and-forget (default, recommended for most use cases)**

```
Parent launches child → child runs to completion → parent reads output
```

No interaction during execution. This is what the parallel research example uses.

**2. Shared state file (for iteration loops)**

**Load:** `references/iteration-loop-pattern.md` — full operational details for building an iteration loop with this pattern.

```
Parent writes state file → child reads, works, updates state file → parent reads after exit
```

The child writes progress to a known file path (e.g., `spec.json`, `progress.txt`). The parent reads this after the child exits and decides what to do next. This is the pattern `/implement` uses — each iteration is a fresh child that reads `spec.json` to find the next incomplete story.

**3. Terminate and resume (for responding to stuck children)**

```
Parent launches child → child exits (stuck or done) →
  parent reads output, extracts session_id →
  parent launches: claude -p --resume <session_id> "Here's how to get unstuck: ..."
```

The resumed session has the child's full prior context. This is the only way to "respond" to a child mid-workflow. Limitation: MCP server state is lost on resume (new process = new server).

**4. Stream-json monitoring (for real-time visibility)**

With `--output-format stream-json`, the child emits NDJSON lines in real-time:

```json
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"file_path":"src/auth.ts"}}]}}
{"type":"result","subtype":"success","result":"Final answer","total_cost_usd":0.42}
```

A wrapper script can parse this stream to detect tool calls, errors, or keywords as they happen. The parent Claude Code instance cannot easily consume this live (it's waiting on the Bash tool), but an external script can watch and write status to a file the parent polls.

**5. Custom MCP server (most powerful, requires building infrastructure)**

```
Parent starts custom MCP server → passes it via --mcp-config →
  child calls mcp__parent__requestInput → MCP server blocks waiting for response →
  parent (or human via webhook/UI) responds → server unblocks → child continues
```

This is the only pattern enabling **true mid-execution interaction**. The child calls an MCP tool, the server intentionally blocks (waits on a webhook, file watch, or queue), and resumes when it gets a response. The child's session stays alive throughout.

Requires building the MCP server yourself — Claude Code does not provide this out of the box. Use `--mcp-config` to register it and optionally `--strict-mcp-config` to ensure the child only sees your server's tools.

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Do the task. If you need human input, call mcp__parent__requestInput." \
    --mcp-config '{"mcpServers":{"parent":{"command":"node","args":["./my-mcp-server.js"]}}}' \
    --dangerously-skip-permissions \
    --max-turns 75 \
    < /dev/null 2>&1
```

### Choosing a pattern

| Situation | Pattern |
|---|---|
| Independent tasks, just need results | 1. Fire-and-forget |
| Multi-step workflow, children build on prior work | 2. Shared state file |
| Child might get stuck and needs guidance | 3. Terminate and resume |
| Need to watch what children are doing | 4. Stream-json monitoring |
| Child needs human approval mid-task | 5. Custom MCP server |

---

## Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| "Claude Code cannot be launched inside another Claude Code session" | Missing `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` | Add the env guard |
| Child process hangs at 0% CPU, no output | Missing `< /dev/null` (Level 2+) | Add `< /dev/null` to the command |
| Child hangs waiting for permission | Missing `--dangerously-skip-permissions` | Add the flag |
| Child runs forever, burns budget | Missing `--max-turns` | Always set `--max-turns` |
| "command not found: claude" | Claude CLI not on PATH | Check `which claude` or use full path |
| Bash tool times out (600s) | Child takes longer than 10 minutes | Use `run_in_background: true` |
| Children write conflicting files | Shared output paths | Use unique paths per child (include `$$` or index) |
