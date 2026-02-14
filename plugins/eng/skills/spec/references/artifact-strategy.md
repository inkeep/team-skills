Use when: Choosing what artifacts to create (one doc vs multiple), where to store them, and how to cross-reference research.
Priority: P0
Impact: Specs become untraceable across sessions; decisions get lost; research isn't connected to the plan.

---

# Artifact strategy

## Default artifact set (recommended)
**One canonical spec artifact** that contains both PRD + Technical Spec content:

- `SPEC.md` (PRD section + Technical Spec section)
  - includes: Open Questions, Decision Log, Assumptions, Risks, Appendices/Deferrals

Optional supporting artifacts (only if they reduce friction):
- `OPEN_QUESTIONS.md` (if the backlog is large and changes frequently)
- `DECISIONS.md` (if you want a clean diffable log)
- `CONSUMER_MATRIX.md` and `USER_JOURNEYS.md` (if those are large)

**Research artifacts:**
- Use `/research` when deep evidence is required.
- Route findings to the right bucket (see "Where evidence goes" below).

## Where to store artifacts

**Default:** `~/.claude/specs/<spec-name>/SPEC.md`

Override sources (checked in priority order):

| Priority | Source | Example |
|----------|--------|---------|
| 1 | User says so in the current session | "Put the spec in `docs/rfcs/`" |
| 2 | Env var `CLAUDE_SPECS_DIR` | `CLAUDE_SPECS_DIR=./specs` → `./specs/<spec-name>/SPEC.md` |
| 3 | AI repo config (`CLAUDE.md`, `AGENTS.md`, etc.) | `specs-dir: docs/specs` |
| 4 | Default | `~/.claude/specs/<spec-name>/SPEC.md` |

Do **not** auto-detect repo directories (`docs/`, `rfcs/`, `specs/`) — only use them when explicitly configured.

If the user wants "chat-only": produce Markdown in chat, but still keep a single canonical artifact in the thread.

## "What goes where" (avoid duplication)

**Keep in SPEC (synthesis):**
- Problem, goals, personas/journeys (as needed)
- Requirements + acceptance criteria
- Options + tradeoffs + decision rationale
- Phases + rollout + risks
- References/links to evidence and research reports (not raw evidence dumps)

**Keep in evidence files (proof):**
- code-path traces, file:line references
- dependency type signatures / source excerpts
- codebase pattern analysis (e.g., `/inspect` findings that informed the design)
- transitive dependency chains, blast radius analysis
- external prior art citations
- negative searches ("NOT FOUND")

Evidence should contain primary source material (code snippets, exact output, API shapes) — not just summaries.

## Where evidence goes

When a substantive finding emerges during spec work, route it to the right place:

| Finding type | Destination | Example |
|---|---|---|
| Fits an existing report's topic | Append to existing report's `evidence/` | "We already have a report on auth patterns — add this finding there" |
| Large domain area warranting standalone research | New `/research` report (confirm with user if unsure) | "MCP integration patterns — this is broader than our spec" |
| Spec-specific context that doesn't generalize | Spec-local `evidence/` directory | "How our current webhook handler works — relevant only to this feature's design" |

**Spec-local evidence** lives alongside the spec:

```
~/.claude/specs/<spec-name>/
├── SPEC.md
├── evidence/           # Spec-local findings
│   ├── current-state.md
│   ├── blast-radius.md
│   └── pattern-analysis.md
└── ...
```

Use spec-local evidence for findings that are specific to this feature's design context and wouldn't be useful in a standalone report. Use `/research` reports for findings that have value beyond this spec.

**Evidence file format:** Same structure as `/research` evidence files — dimension-based, with findings, confidence levels, and source references. See the research skill's conventions.

## Multi-session discipline
When a spec spans many interactions:
- Treat `SPEC.md` as the single source of truth.
- At the start of a new session:
  1) summarize current state from the spec
  2) restate top P0 Open Questions
  3) propose the next decision batch + research plan
- Never rely on "memory" when artifacts exist—re-read and update.

## Updating an existing spec (delta posture)
If the user is revisiting a spec:
- Read the current `SPEC.md` first.
- Add a small "Changelog" section or annotate decisions with dates.
- Prefer "surgical edits" over rewriting everything unless the direction changed materially.

## When to split PRD and tech spec into two files
Split only if:
- different audiences genuinely require separation, or
- the doc is too large to reason about in one place

Rule of thumb: if the spec is too large to hold in working context alongside the conversation, consider splitting. But prefer unified unless there's a clear audience separation — a long unified doc is better than two short docs with broken cross-references.

If you split:
- `PRD.md` holds problem, personas, journeys, requirements, success metrics
- `TECH_SPEC.md` holds architecture, data/API, rollout, risks
- both link to a shared `DECISIONS.md` and `OPEN_QUESTIONS.md` (optional)
