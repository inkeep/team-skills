Use when: Ralph Phase 3 — executing the iteration loop via subprocess, handling stuck stories, tuning iteration parameters
Priority: P0
Impact: Without this, Ralph Phase 3 lacks the detail needed for reliable automated execution

---

# Execution Reference

This document contains the operational details for Ralph Phase 3 (Execute). SKILL.md has the workflow; this file has the depth.

---

## Subprocess command

`scripts/ralph.sh` wraps the following core command per iteration:

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "$(cat .claude/ralph-prompt.md)" \
    --dangerously-skip-permissions \
    --max-turns <N> \
    --output-format json
```

| Flag / override | Purpose |
|---|---|
| `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` | Unsets env vars that prevent nested Claude Code sessions. Without this, the subprocess refuses to start. |
| `-p "$(cat ...)"` | Non-interactive mode. Prompt read from the saved file. |
| `--dangerously-skip-permissions` | No TTY for confirmation in `-p` mode. Required for automated execution. |
| `--max-turns <N>` | Limits agentic turns per iteration. Prevents runaway iterations. |
| `--output-format json` | Structured output. Used for completion detection. |

**What the subprocess inherits (from the filesystem):**
- Project-level `CLAUDE.md` / `AGENTS.md`
- `.claude/settings.local.json` and `~/.claude/settings.json`
- MCP server configurations
- Git context (branch, status, etc.)

**What the subprocess does NOT inherit:**
- The invoking agent's context (conversation history, task list, spec understanding)
- Loaded skills (session-scoped; each iteration starts fresh)
- Stop hooks (do NOT fire in `-p` mode)

---

## Background execution

ralph.sh runs can exceed the Bash tool's 600-second timeout. Invoke with `run_in_background: true`:

```
Bash(command: "scripts/ralph.sh --max-iterations 15 --max-turns 75 --force",
     run_in_background: true,
     description: "Ralph execution run N")
```

Poll for completion using `TaskOutput(block: false)` at intervals (e.g., every 60 seconds). When the task completes, read prd.json and progress.txt to assess results.

**While waiting:** Read the spec, review the task list, or do lightweight planning. Do NOT make code changes that could conflict with the running iteration.

---

## Stuck story handling

A story is "stuck" when:
- It has been attempted in 2+ consecutive ralph.sh runs
- `passes` remains `false`
- `progress.txt` shows the same blocker repeated across runs

### Detection

After each ralph.sh run completes, read prd.json and progress.txt:

1. For each story still at `passes: false`, check progress.txt for its most recent entry.
2. Compare the blocker description to the previous run's blocker for the same story.
3. If the blocker is substantively the same (not just wording differences), increment the story's consecutive failure count.

### Remediation

| Situation | Action |
|---|---|
| Story is too large (blocker is "ran out of context" or incomplete implementation) | Split into smaller stories in prd.json, set `passes: false` on the new stories |
| Acceptance criteria are ambiguous (blocker mentions unclear requirements) | Rewrite criteria to be more specific, then re-run |
| External dependency blocking (missing env var, unavailable service) | Skip the story: set `notes` to explain the blocker, move to next |
| Implementation approach is wrong (repeated failures on same code path) | Add guidance to `progress.txt` suggesting an alternative approach |

### Escalation

After 3 consecutive failed runs on the same story, stop and consult the user. Present:
- Which story is stuck
- The repeated blocker from progress.txt
- What remediation was attempted
- Your assessment of why it is not resolving

---

## Tuning

### ralph.sh parameters

| Feature complexity | --max-iterations | --max-turns |
|---|---|---|
| Small (1-3 stories) | 10-15 | 50 |
| Medium (4-8 stories) | 20-30 | 75 |
| Large (9+ stories) | 30-50 | 100 |

Max iterations are safety limits, not targets. Well-sized stories should complete in 1-2 iterations each.

Max turns controls how much work a single iteration can do before being cut off. Increase for complex stories; decrease if iterations produce low-quality output from context exhaustion.

### Run-level parameters (Ralph Phase 3 managing ralph.sh)

| Parameter | Default | Guidance |
|---|---|---|
| Max ralph.sh runs | 3 | Ralph invokes ralph.sh up to 3 times, checking between runs. Increase only if stuck story handling resolves issues between runs. |
| Stuck threshold | 2 consecutive runs | Same story fails with same blocker in 2 runs → apply remediation before next run. |
| Escalation threshold | 3 consecutive runs | Same story fails 3 runs → stop and consult user. |

---

## Error handling

| Error | Cause | Action |
|---|---|---|
| "Claude Code cannot be launched inside another Claude Code session" | `CLAUDECODE` or `CLAUDE_CODE_ENTRYPOINT` env vars not unset | Verify `env -u` prefix in ralph.sh. If running ralph.sh manually, ensure the env override. |
| `command not found: claude` | Claude CLI not on PATH | Automated execution not possible. Artifacts are ready at `.claude/ralph-prompt.md` and `.claude/ralph.sh` — see Phase 3 fallback in SKILL.md for manual instructions. |
| ralph.sh exits with non-zero, no completion signal | Iteration agent hit an error | Read ralph.sh output for details. If transient (network, rate limit), retry once. If persistent, fall back to manual. |
| ralph.sh exits with non-zero after max iterations | Not all stories completed within iteration limit | Read prd.json for incomplete stories and progress.txt for blockers. Apply stuck story handling or consult user. |

---

## Docker execution

Ralph Phase 3 can run inside a Docker container for network-isolated, headless execution. Docker is an **execution environment** — Phases 1-2 always run on host where the skill has full capabilities.

### Three-zone model

```
Host (interactive)           Docker (autonomous)           Host (coordination)
──────────────────           ───────────────────           ───────────────────
Phase 1: SPEC → prd.json
Phase 2: Validate, prompt
  → .claude/ralph-prompt.md
  → .claude/ralph.sh
                             .claude/ralph.sh --force
                             Iterates (headless)
                               reads .claude/ralph-prompt.md
                               writes code, commits
                               updates prd.json
                                                           git log (sees commits)
                                                           git push, gh pr create
```

The container accesses `.claude/ralph.sh` and `.claude/ralph-prompt.md` via a bind mount that shares the repo filesystem. No file sync needed — changes are visible immediately on both sides.

### Prerequisites

- Docker infrastructure set up in the repo (typically `.ai-dev/` with compose, proxy, Dockerfile)
- Phase 2 completed on host (`.claude/ralph-prompt.md` and `.claude/ralph.sh` exist)
- Feature branch created and artifacts committed

### Using `--docker` (Phase 3, Step 2)

Pass `--docker` to Ralph to execute inside a Docker container. Ralph discovers the compose file automatically (searches the repo for a `docker-compose.yml` or `compose.yml` defining a `sandbox` service). To skip discovery, pass the path explicitly: `--docker .ai-dev/docker-compose.yml`.

Ralph ensures the sandbox is running, then invokes:

```
docker compose -f <compose-file> exec sandbox .claude/ralph.sh --max-iterations <N> --max-turns <M> --force
```

When `--docker` is omitted, Ralph executes on the host (default).

**Manually (outside the skill):**

```bash
docker compose -f <path-to>/docker-compose.yml up -d
docker compose -f <path-to>/docker-compose.yml exec sandbox .claude/ralph.sh --max-iterations <N> --max-turns <M> --force
```

`--force` is required inside Docker — there is no TTY for interactive prompts.

### Limitations

| Limitation | Why | Workaround |
|---|---|---|
| No validate-prd.ts | bun typically not in container; `$SCRIPT_DIR` differs from skill directory | Phase 2 already validated prd.json on host. ralph.sh gracefully skips when validator is not found. |
| Skill access depends on host mount | Plugins are copied from host at container startup (if mounted) but may drift if host plugins change mid-run | Restart the container to refresh plugins. Iteration agents also read CLAUDE.md/AGENTS.md from the repo. |
| Network restricted | Proxy limits outbound to allowlisted domains | Configure the proxy allowlist for your repo's needs (Claude API, npm registry, GitHub). |

### When to use Docker vs host execution

| Scenario | Recommended |
|---|---|
| Short feature (1-5 stories), developer present | Host execution — simpler, skill manages the loop |
| Long-running feature, run overnight | Docker — network jail, memory limits, detachable |
| CI/CD integration | Docker — reproducible, isolated |
| No Docker infrastructure in repo | Host execution — Docker is optional |

---

## ralph.sh CLI reference

```
ralph.sh [OPTIONS]

Options:
  --max-iterations N   Max iteration loops (default: 10)
  --max-turns N        Max agentic turns per iteration (default: 75)
  --prompt FILE        Prompt file path (default: .claude/ralph-prompt.md)
  --prd FILE           PRD file path (default: prd.json)
  --force              Skip uncommitted changes prompt (required for background execution)
  --create-branch, -b  Create/checkout branch from prd.json branchName field
  -h, --help           Show help
```

When invoked by Ralph Phase 3, always pass `--force` (no interactive prompt in background mode).
