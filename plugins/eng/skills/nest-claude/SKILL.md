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
    < /dev/null \
    2>&1
```

| Flag | Why it's required |
|---|---|
| `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` | Claude Code sets these env vars on startup. When inherited by a child `claude -p` process, they can cause the child to **hang silently** — the process starts but never connects to the API ([open issue](https://github.com/anthropics/claude-code/issues/26190)). Unsetting them prevents this. |
| `-p "..."` | Non-interactive mode. The prompt is the child's sole instruction. |
| `--dangerously-skip-permissions` | No TTY exists for permission prompts in `-p` mode. Without this, the child hangs waiting for confirmation. |
| `< /dev/null` | **Critical for Level 2+ nesting.** Claude Code's Bash tool connects stdin via a unix socket. Without this redirect, grandchild processes hang indefinitely at 0% CPU. Always include it — it's harmless at Level 1 and required at Level 2+. |

### Optional flags

Add these based on your needs:

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Your prompt here" \
    --dangerously-skip-permissions \
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
| `--json-schema '{"type":"object",...}'` | Validate child's final response against a JSON Schema. Use with `--output-format json`. Structured data lands in the `structured_output` field (not `result`). |
| `--resume <session-id>` | Continue a previous session with its full context. Use for multi-phase workflows where a child needs to pick up where it left off. |

---

## Parallel execution

To run N children concurrently, launch each as a background Bash command. Two patterns:

### Pattern A: Background Bash commands (simple, up to ~5 children)

Launch each child with `run_in_background: true` on the Bash tool. This returns immediately and gives you a task ID for polling.

**Do NOT use `&` (shell backgrounding) inside the command.** The Bash tool's `run_in_background: true` already runs the entire command in a background subprocess. Adding `&` inside causes the shell to exit immediately after spawning the claude process, which orphans it and breaks any output pipes — the parent sees "completed (exit code 0)" instantly while the claude process runs as an orphan with no captured output.

```
Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p '...' --dangerously-skip-permissions --output-format json < /dev/null 2>&1 | tee /tmp/child-1-output.json",
     run_in_background: true,
     description: "Child 1: research topic A")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p '...' --dangerously-skip-permissions --output-format json < /dev/null 2>&1 | tee /tmp/child-2-output.json",
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

A child Claude Code instance typically runs for **5-30 minutes** depending on task complexity. Plan your polling accordingly.

### For background children (Pattern A)

Poll with `TaskOutput(block: false)` to check if each child has finished. Polling every ~5 minutes is reasonable.

**Initial spot check:** If the child uses shared state files (e.g., `spec.json`, `progress.txt`), do an early read of those files (~1-2 minutes after launch) to verify the child got started properly — writing to the correct paths, reading the right inputs, not immediately erroring out. This catches misconfigured prompts or missing files early, before you've waited the full runtime for nothing.

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
    "type": "result",
    "subtype": "success",
    "result": "The child's final text response",
    "session_id": "abc-123-...",
    "total_cost_usd": 0.42,
    "duration_ms": 180000,
    "num_turns": 12
}
```

Extract `result` for the child's text findings. Use `session_id` with `--resume` if you need to continue the session. Use `subtype` to detect exit reason (see exit detection table below).

When using `--json-schema`, the validated structured data is in `structured_output` (not `result`, which will be empty):

```bash
# Text result (no schema)
jq -r '.result'

# Structured output (with --json-schema)
jq '.structured_output'
```

### File-based IPC (recommended for complex tasks)

For tasks where children produce structured artifacts, have each child write to a designated output file:

```
Prompt: "Research X. Write your findings to /tmp/research/topic-a.md. Include a ## Summary section at the top."
```

The parent reads these files after all children complete. This is more reliable than parsing stdout because:
- Files persist even if the child crashes partway through
- Structured formats (markdown, JSON) are easier to aggregate than free-form text
- Multiple files can be written (findings, evidence, recommendations)
- **Files preserve full fidelity.** When a child writes findings to a file, the parent (or next child) reads them verbatim. When results flow through stdout → parent context → LLM reasoning instead, the information passes through LLM summarization at each boundary — meanings shift, details erode, and errors compound. In multi-agent chains this "broken telephone" effect is measurable. Files bypass it entirely.

### Output location strategy

When your examples use `/tmp`, that signals throwaway output. If the child's work product matters beyond this session, use a project-relative path instead.

| Output type | Where | Why |
|---|---|---|
| Throwaway (logs, scratch, intermediate) | `/tmp/nested-claude-$$/<child-id>/` | Auto-cleaned, no project clutter, `$$` prevents collisions between runs |
| Pass-scoped (parallel results, iteration artifacts) | `<project-dir>/<pass-id>/` (e.g., `output/2026-03-20-batch1/`) | Scope to a pass identifier to prevent collisions between repeated runs; preserved for auditability |
| Deliverables the parent or user needs after the session | Project-relative path (e.g., `reports/`, `output/`) | Survives session, findable, version-controllable |
| Source code modifications | Dedicated directory or git worktree per child | Prevents merge conflicts between parallel children (see "Concurrent source code edits" below) |

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

**Inherited (automatic, no action needed):**
- **Environment variables from the parent shell** — inherited by the child process, but with a critical limitation: **`settings.json` `env` key overrides command-line values.** If `~/.claude/settings.json` (or project/managed settings) defines a key in `"env": {}`, that value overrides any command-line env var of the same name. This means common vars like `CLAUDE_REPORTS_DIR` (often in settings.json) CANNOT be overridden on children. **Novel env vars not in any settings.json** (e.g., `CLAUDE_FANOUT_DEPTH`) propagate correctly. For overridable configuration, use **prompt text as the primary mechanism** — tell the child where to write in the `-p` prompt. Use env vars only for novel keys you control.
- Project-level `CLAUDE.md` / `AGENTS.md`
- `.claude/settings.local.json` and `~/.claude/settings.json`
- MCP server configurations (unless `--strict-mcp-config` is used)
- Git context (branch, status)
- Skills and agents defined in `.claude/` (discoverable on disk, but skill content is only preloaded into context when declared in an agent's `skills:` field — see "Giving children domain knowledge" below)

**NOT inherited:**
- Parent's conversation history
- Parent's loaded skill content or in-session context
- Parent's permission approvals
- **Parent's CLI flags** (`--model`, `--effort`, `--append-system-prompt`, etc.) — each child gets its own flags via its `claude` command
- **Skill `$ARGUMENTS`** — per-invocation strings that must be explicitly included in the child's `-p` prompt if propagation is desired

Each child starts completely fresh. The prompt you pass via `-p` is their entire instruction.

**Critical distinction from Task-tool subagents:** Task/Agent tool subagents (spawned via the Agent tool within a session) do **NOT** inherit parent shell environment variables — they run in fresh, isolated shells. Only nested subprocesses (`claude -p`) inherit env vars. However, env var inheritance is NOT fully reliable — `settings.json` `env` values override command-line values for matching keys. **Use prompt text as the primary mechanism for directing child behavior** (it's Priority 1 in skill resolution hierarchies and cannot be clobbered). Use novel env vars (not in any settings.json) for custom cross-level signaling (e.g., depth counters).

---

## Giving children domain knowledge

Children discover skill and agent files from `.claude/` on disk, but that doesn't mean skills are loaded into their context. There are three mechanisms for giving children domain knowledge, each suited to different situations:

### Mechanism 1: `--agent` with preloaded skills (structured, reusable)

Run the child as a specific agent. The agent's markdown body becomes the system prompt, and any `skills:` in the agent's frontmatter are injected into the child's context at spawn time.

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    --agent security-reviewer \
    -p "Review the auth changes in src/auth.ts" \
    --dangerously-skip-permissions \
    < /dev/null 2>&1
```

Where the agent file declares its skills explicitly:

```yaml
# .claude/agents/security-reviewer.md
---
name: security-reviewer
skills:
  - security-checklist
  - repo-context
tools: Read, Grep, Glob
---
You are a security reviewer. Evaluate changes against your loaded skill standards.
```

**Critical rule:** Children do not inherit skills from the parent. The agent definition must list every skill the child needs. If the parent has `write-docs` loaded and the child needs it, the child's agent must declare `skills: [write-docs]`.

### Mechanism 2: `--append-system-prompt` (lightweight, no files needed)

For one-off children that need specific guidance but don't warrant a full agent definition:

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Review src/auth.ts for vulnerabilities" \
    --append-system-prompt "Focus on OWASP top 10. Check for SQL injection, XSS, and CSRF. Return findings as JSON." \
    --dangerously-skip-permissions \
    < /dev/null 2>&1
```

This preserves Claude Code's built-in defaults and adds your instructions on top. Less structured than skills, but no file creation needed.

### Mechanism 3: File-based context (large or dynamic context)

Write context to a known path; instruct the child to read it in the prompt. Already covered in "File-based IPC" above. Best for large context (>10KB), context that changes between children, or context shared across children with different roles.

**When the child needs the parent's judgment (not just data):** Write a "brief" — a synthesis of what the parent learned during the session, what the user cares about, what evolved. This is different from copying a file or passing raw data. The parent reflects on what it knows and distills it into actionable guidance. A brief captures judgment calls ("inotify over NFS is a dealbreaker, not just a consideration") that raw data doesn't convey.

### When to use which

| Situation | Mechanism |
|---|---|
| Multiple children need the same role + domain skills | `--agent` with `skills:` — define once, reuse across spawns |
| One-off child needs a few extra instructions | `--append-system-prompt` — inline, no files |
| Context is large, dynamic, or per-child | File-based — write to disk, child reads it |
| Children need different skills for the same task | Multiple agent files, each with their own `skills:` list |
| Parent has quality standards (validation checklist, stance rules) child must enforce | Embed the key checks directly in the child's prompt. Skills are NOT inherited — if the parent loaded a skill with quality gates, the child won't have them unless given explicitly. |

### Headless mode for loaded skills (mandatory)

Children run non-interactively — there is no human to answer prompts, confirm decisions, or select options. Many skills have interactive gates by default (e.g., `/research` pauses for rubric confirmation, `/spec` presents routing options, `/analyze` may ask clarifying questions).

**When a child loads any skill that supports a headless/non-interactive mode, it must use that mode.** Without it, the skill will try to prompt a human who isn't there — the child will either hang, waste turns waiting for input, or produce degraded output.

**How to signal headless mode:**

| Method | How |
|---|---|
| In the `-p` prompt | Include `--headless` in the skill invocation: `"Load /research --headless and investigate..."` |
| In `--append-system-prompt` | `"When loading skills, always pass --headless."` |
| In an agent's body | Add to the agent's markdown: `"You are running non-interactively. When invoking skills, always use --headless mode."` |

The `--headless` flag is the standard convention across skills for signaling non-interactive execution. Skills that support it will auto-confirm interactive gates, auto-select routing decisions, and skip follow-up prompts — while preserving all quality gates (validation, evidence standards, etc.).

**If a skill does not have a headless mode,** it may still work — many skills have no interactive gates. But if the child gets stuck waiting for input that never comes, the symptom is wasted turns or empty output. The fix is to either add `--headless` support to that skill or work around the interactive step in the prompt.

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
- At every level, include `env -u`, `--dangerously-skip-permissions`, and `< /dev/null`.

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
    --no-session-persistence \
    < /dev/null \
    2>&1
```

Most use cases don't need this level of isolation. Use it when children might conflict on config or temp files.

### Concurrent source code edits

When parallel children **read** the same codebase but write to **separate output files** (research, review, analysis), no special isolation is needed — this is the common case.

When parallel children need to **edit the same source files**, they will create conflicts. If two children might edit the same file, don't run them in parallel without isolation. Two mitigations:

1. **Serialize** — run children sequentially instead of in parallel when their edit scopes overlap. Simplest approach; no infrastructure needed.
2. **Git worktrees** — each child gets its own worktree, edits in isolation, parent merges results:

```bash
# Create a worktree per child
git worktree add "/tmp/worktree-child-$i" HEAD

# Spawn child in its own worktree
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Edit src/auth.ts to fix the session bug. Work in $(pwd)." \
    --dangerously-skip-permissions \
    < /dev/null 2>&1

# After all children finish, merge worktree changes back
cd /path/to/main/repo
git merge --no-ff "/tmp/worktree-child-$i"
git worktree remove "/tmp/worktree-child-$i"
```

---

## Crafting good child prompts

Each child has zero context from the parent. The prompt must be self-contained. **If the prompt is incomplete, the child will silently fabricate what's missing** — it cannot ask you for clarification. The most damaging gaps: missing goals (child executes the wrong task), missing constraints (child takes a wrong approach), and missing inputs (child fabricates file paths, API shapes, or prior findings).

**Include:**
- The full task description
- Any file paths to read
- Output format expectations — ask children to cite what they read or verified vs. what they inferred, so you can evaluate reliability when synthesizing across children (information degrades at agent boundaries; citations let you verify)
- Where to write results (file path)
- What "done" means
- What to do if stuck
- Headless flags for any skills the child will load (see "Headless mode for loaded skills" above)

**Avoid:**
- Referencing "the previous conversation" or "what we discussed"
- Assuming the child knows anything not in its prompt
- Vague instructions like "continue the work" without specifying what work
- **First-person context that causes misattribution.** If your prompt includes context from the parent session, reframe it to third-person. A child that reads "I analyzed the auth flow and found a session fixation bug" may believe *it* performed that analysis. Write instead: "A prior analysis found a session fixation bug in the auth flow" — this gives the child the fact without the false ownership.
- **Long multi-step prompts where later steps are cleanup.** Children may complete the primary task (the "real work") and skip later steps — especially cleanup, logging, and verification. Prefer: give the child the core task only; have the parent handle verification and cleanup after the child exits (see pattern 5: Delegate + validate).

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
For each finding, note whether you verified it directly (read source code, ran a command, checked docs) or inferred it. This helps downstream synthesis.

## Constraints
- Do not modify any source files
- Focus only on [scope]
- If blocked, write what you found so far and note the blocker
- When loading skills, use --headless mode (you are running non-interactively)
```

---

## Example: Parallel research (5 instances)

Spin up 5 Claude Code instances to research 5 different topics simultaneously:

```
# Launch all 5 in parallel (single message with multiple Bash tool calls)

Bash(command: "mkdir -p /tmp/research && env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research how React Server Components handle streaming. Write a comprehensive analysis to /tmp/research/rsc-streaming.md with a ## Summary at the top.' --dangerously-skip-permissions --output-format json --no-session-persistence < /dev/null > /tmp/research/rsc-streaming-meta.json 2>&1",
     run_in_background: true,
     description: "Research: RSC streaming")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research how Next.js App Router caching works. Write findings to /tmp/research/nextjs-caching.md with a ## Summary at the top.' --dangerously-skip-permissions --output-format json --no-session-persistence < /dev/null > /tmp/research/nextjs-caching-meta.json 2>&1",
     run_in_background: true,
     description: "Research: Next.js caching")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research Remix loader patterns and how they compare to Next.js. Write findings to /tmp/research/remix-loaders.md with a ## Summary at the top.' --dangerously-skip-permissions --output-format json --no-session-persistence < /dev/null > /tmp/research/remix-loaders-meta.json 2>&1",
     run_in_background: true,
     description: "Research: Remix loaders")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research TanStack Router architecture and its approach to type-safe routing. Write findings to /tmp/research/tanstack-router.md with a ## Summary at the top.' --dangerously-skip-permissions --output-format json --no-session-persistence < /dev/null > /tmp/research/tanstack-router-meta.json 2>&1",
     run_in_background: true,
     description: "Research: TanStack Router")

Bash(command: "env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p 'Research Astro Islands architecture and partial hydration. Write findings to /tmp/research/astro-islands.md with a ## Summary at the top.' --dangerously-skip-permissions --output-format json --no-session-persistence < /dev/null > /tmp/research/astro-islands-meta.json 2>&1",
     run_in_background: true,
     description: "Research: Astro Islands")
```

After launching, poll every ~5 minutes to check completion, then read and synthesize:

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

The child has no way to signal "I'm stuck" in real-time. It keeps going until it completes, exhausts its context, or hits `--max-budget-usd` (if set), then exits. The parent discovers what happened after the fact:

| Exit reason | How parent detects it | JSON `subtype` field |
|---|---|---|
| Natural completion | Process exits 0 | `"success"` |
| Budget exhausted | Process exits | `"error_max_budget_usd"` |
| Crash / error | Process exits non-zero | `"error_during_execution"` |
| Child wrote "I'm stuck" | Parent reads output file after exit | Grep output for blocker keywords |

### Six interaction patterns (from simplest to most capable)

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

**5. Delegate + validate (for quality-controlled heavy work)**

```
Parent writes brief + dispatches child → child does heavy work (bulk merge, large writes) →
  child exits → parent reads output → parent validates against quality standards →
  parent corrects/synthesizes → parent handles cleanup
```

The child does the context-heavy lifting (reading many files, writing large outputs). The parent retains quality control — it reads the child's output and validates against standards the child may not have (loaded skills, conversation context, user intent). The parent also handles cleanup steps the child might skip. Use when the child's work product needs to meet quality standards the parent enforces.

**6. Custom MCP server (most powerful, requires building infrastructure)**

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
    < /dev/null 2>&1
```

### Choosing a pattern

| Situation | Pattern |
|---|---|
| Independent tasks, just need results | 1. Fire-and-forget |
| Multi-step workflow, children build on prior work | 2. Shared state file |
| Child might get stuck and needs guidance | 3. Terminate and resume |
| Need to watch what children are doing | 4. Stream-json monitoring |
| Child does heavy work, parent must ensure quality | 5. Delegate + validate |
| Child needs human approval mid-task | 6. Custom MCP server |

---

## Common errors and fixes

| Error | Cause | Fix |
|---|---|---|
| "Claude Code cannot be launched inside another Claude Code session" | Missing `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` | Add the env guard |
| Child process hangs at 0% CPU, no output | Missing `< /dev/null` (Level 2+) | Add `< /dev/null` to the command |
| Child hangs waiting for permission | Missing `--dangerously-skip-permissions` | Add the flag |
| "command not found: claude" | Claude CLI not on PATH | Check `which claude` or use full path |
| Bash tool times out (600s) | Child takes longer than 10 minutes | Use `run_in_background: true` |
| Children write conflicting files | Shared output paths | Use unique paths per child (include `$$` or index) |
| Child appears to complete instantly with 0-byte output | Used `&` inside a `run_in_background: true` Bash command (double-backgrounding). The shell exits after `&`, orphaning the claude process and breaking output pipes. | Remove `&` from the command. The Bash tool's `run_in_background: true` already handles backgrounding. The claude command must be the foreground process inside that shell. |
