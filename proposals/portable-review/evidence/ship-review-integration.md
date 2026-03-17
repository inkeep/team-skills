---
title: /ship ↔ /review Integration Pattern
description: How /ship currently invokes and consumes review output. Informs D2 (output format) decision.
created: 2026-02-23
last-updated: 2026-02-23
---

## Current integration (CONFIRMED)

### /ship invokes /review at Phase 5
- /review is loaded as a **top-level skill** (not subagent): `Before doing anything, load /review skill`
- /review runs AFTER Phase 4 (docs) and AFTER the PR is marked ready via `gh pr ready`
- /review is explicitly **never delegated to a subagent**: "Load `/review` at the top level — not in a subagent"

### /ship does NOT consume structured review output
- No JSON contract between /review and /ship
- No structured return value from /review
- The integration is **human-mediated**: /review manages its own loop (poll → assess → fix → push), then reports completion narratively
- /ship verifies completion by re-reading PR state (threads resolved, CI green)

### /ship does NOT make autonomous decisions based on review results
- Scope expansions from reviewer feedback require **user approval**: "If a reviewer requests new functionality or scope expansion, do not implement it directly — pause and consult the user."
- /review handles small/medium fixes autonomously (< 100 lines)
- Large architectural rework is escalated back to /ship orchestrator

### State tracking
- `tmp/ship/state.json` tracks: current phase, feature name, spec path, PR number, completed phases, amendments
- Amendments are recorded **after** user consultation, not automatically by /review
- Phase 5 → Phase 6 transition happens only after /review completes (all threads resolved, CI green)

## Implication for D2

Since /ship reads review output as an LLM reading text (Task return value or top-level skill completion), markdown is equally parseable as JSON for this consumer. The structured header line `**(N) Total Issues** | Risk: **X** | Recommendation: **Y**` is trivially extractable by an LLM.

No non-LLM programmatic consumer of review output exists today.

## Existing patterns for inter-agent data passing (CONFIRMED)

| Pattern | Used by | Mechanism |
|---|---|---|
| File-based artifacts | /implement → /ship | `tmp/ship/spec.json`, `tmp/ship/progress.txt` |
| State machine JSON | /ship orchestration | `tmp/ship/state.json` |
| Skill composition (no structured return) | /review + /ship | Top-level skill load, narrative completion |
| Subagent output contracts | PR review children | Finding[] JSON via Task return value |
