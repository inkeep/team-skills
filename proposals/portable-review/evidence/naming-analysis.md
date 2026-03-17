---
title: Naming Analysis — pr-review-* → review-*
description: Blast radius analysis and collision assessment for renaming the review system.
created: 2026-02-23
last-updated: 2026-02-23
---

## Blast radius (CONFIRMED)

| Surface | Files | Occurrences |
|---|---|---|
| `ci/pr-review/` agents + skills | 21 | 260 |
| `ci/closed-pr-review-auto-improver/` | 3 | 97 |
| CI workflows (`agents/` repo) | 2 | 13 |
| `plugins/` cross-references | 4 | ~5 |
| **Total** | **~30 files** | **~375 occurrences** |

## Collision analysis

### `review-*` collides with existing `/review` skill
- `plugins/eng/skills/review/SKILL.md` (name: `review`) is the GitHub PR review iteration loop in /ship Phase 5
- Different purpose: processes human reviewer feedback (poll → assess → fix → push)
- **Resolution:** Rename `/review` skill to `/address-review` (or similar). Blast radius: ~20 references in `plugins/eng/skills/ship/SKILL.md` + the review skill itself. Contained within the eng plugin.

### `code-review-*` — no collisions
No existing concept uses this prefix. Viable but more verbose.

## Decision: `review-*`
- Shorter and cleaner than `code-review-*`
- Collision eliminated by renaming `/review` skill
- Accurate for both PR and local contexts

## Rename mapping

| Current | New |
|---|---|
| `ci/pr-review/` | `ci/review/` |
| `pr-review.md` (orchestrator) | `review-gh.md` |
| `pr-review-local.md` (new) | `review-local.md` |
| `pr-review-standards.md` | `review-standards.md` |
| `pr-review-architecture.md` | `review-architecture.md` |
| ... (all 15 children) | `review-*.md` |
| `pr-review-core` (new skill) | `review-core` |
| `pr-review-output-contract` | `review-output-contract` |
| `pr-review-check-suggestion` | `review-check-suggestion` |
| `pr-tldr` | `review-tldr` |
| `pr-context` (skill name) | `review-context` |
| Plugin name: `pr-review` | `review` |
| `/review` skill (eng) | `/address-review` |

## Cross-repo updates needed

| Repo | File | Change |
|---|---|---|
| agents | `claude-code-review.yml` | `--agent pr-review:pr-review` → `--agent review:review-gh` |
| agents | `closed-pr-review-auto-improver.yml` | Agent references |
| team-skills | `plugins/eng/skills/ship/SKILL.md` | `/review` → `/address-review` |
| team-skills | `plugins/shared/skills/write-agent/SKILL.md` | Example reference |
