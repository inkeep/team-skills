---
title: /ship Phase Sequence and Subprocess Patterns
description: Complete /ship orchestration flow, PR creation timing, and claude -p subprocess pattern from /implement.
created: 2026-02-23
last-updated: 2026-02-23
---

## /ship Phase Sequence (current)

| Order | Phase | Nature | Description |
|-------|-------|--------|-------------|
| 1 | Phase 0 | Collaborative | Context detection, recovery, scope calibration |
| 2 | Phase 1 | Collaborative | Spec authoring with /spec, state init via ship-init-state.sh |
| 3 | Phase 2 | Autonomous | Implementation via /implement (claude -p subprocess) |
| 4 | *Draft PR creation* | Inter-phase | `gh pr create --draft`, set prNumber in state.json |
| 5 | Phase 3 | Autonomous | Testing via /qa |
| 6 | *Write PR body* | Inter-phase | Screenshots if applicable, load /pr |
| 7 | Phase 4 | Autonomous | Documentation via /docs |
| 8 | Phase 5 | Autonomous | Review: `gh pr ready`, load /review, iterate until threads resolved + CI green |
| 9 | Phase 6 | Autonomous | Completion checklist, report to user |

## PR Creation Timing (CONFIRMED)

1. **Draft PR** — created after Phase 2, before Phase 3. Purpose: give subsequent phases a PR to post results to (QA, docs).
2. **Full PR body** — written after Phase 3, before Phase 4 (via /pr skill).
3. **PR marked ready** — at start of Phase 5, before /review. Transitions from draft to visible.

## claude -p Subprocess Pattern (from /implement)

### Invocation chain
1. /ship loads /implement as top-level skill (same agent context)
2. /implement Phase 3 invokes `implement.sh` via `Bash(run_in_background: true)`
3. `implement.sh` spawns individual claude -p subprocesses per iteration:

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "$(cat "$PROMPT_FILE")" \
    --dangerously-skip-permissions \
    --max-turns "$MAX_TURNS" \
    --output-format json \
    2>&1 | tee "$OUTPUT_FILE" || true
```

### Key implementation details
- `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` — unsets env vars that block nested Claude Code sessions
- `-p "$(cat file)"` — non-interactive mode, prompt from file
- `--dangerously-skip-permissions` — no TTY in -p mode
- `--output-format json` — structured output for completion detection
- `run_in_background: true` — avoids Bash tool 600s timeout
- Completion detected via grep for `IMPLEMENTATION COMPLETE` + spec.json validation

### State/output files
- `tmp/ship/spec.json` — story completion tracking (read + written by subprocess)
- `tmp/ship/progress.txt` — iteration history (appended by subprocess)
- `tmp/ship/implement-prompt.md` — prompt template (read by subprocess)

### What subprocess inherits
- Filesystem (project CLAUDE.md, AGENTS.md, git context, MCP configs)
- Does NOT inherit: parent's conversation context, loaded skills, stop hooks

## /review Current Integration

- Loaded at **top level** via Skill tool (explicitly NOT a subagent)
- Invoked AFTER PR is marked ready: `/review <pr-number> --spec <path> --test-cmd "<cmd>"`
- Manages its own loop: poll → assess → implement fixes → push → repeat
- Escalates scope expansion back to /ship (user approval required)
- Exit condition: all threads resolved + CI green
