Use when: Choosing what artifacts to create (one doc vs multiple), where to store them, and how to cross-reference research.
Priority: P0
Impact: Specs become untraceable across sessions; decisions get lost; research isn't connected to the plan.

---

# Artifact strategy

## Default artifact set (recommended)
**One canonical spec artifact** that contains both PRD + Technical Spec content:

- `PROPOSAL.md` (PRD section + Technical Spec section)
  - includes: Open Questions, Decision Log, Assumptions, Risks, Appendices/Deferrals

Optional supporting artifacts (only if they reduce friction):
- `OPEN_QUESTIONS.md` (if the backlog is large and changes frequently)
- `DECISIONS.md` (if you want a clean diffable log)
- `CONSUMER_MATRIX.md` and `USER_JOURNEYS.md` (if those are large)

**Research artifacts:**
- Use `/research` when deep evidence is required.
- Keep raw evidence in the research report; keep the spec as synthesis.

## Where to store artifacts (defaults + escape hatches)

| Situation | Default location | Why |
|---|---|---|
| Repo already has a convention (`docs/`, `rfcs/`, `specs/`) | Use that | Aligns with team habits |
| No clear convention | `.claude/specs/<spec-name>/PROPOSAL.md` | Stable, tool-friendly, survives long sessions |
| User wants "chat-only" | Produce Markdown in chat | Still keep a single canonical artifact in the thread |

## "What goes where" (avoid duplication)

**Keep in PROPOSAL (synthesis):**
- Problem, goals, personas/journeys (as needed)
- Requirements + acceptance criteria
- Options + tradeoffs + decision rationale
- Phases + rollout + risks
- References/links to research reports (not raw evidence dumps)

**Keep in /research report (proof):**
- code-path traces, file:line evidence
- dependency type signatures / source excerpts
- external prior art citations
- negative searches ("NOT FOUND")

**Evidence file format:** See `templates/EVIDENCE.md.template` for the standard structure. Evidence files should contain primary source material (code snippets, exact output, API shapes) — not just summaries.

## Multi-session discipline
When a spec spans many interactions:
- Treat `PROPOSAL.md` as the single source of truth.
- At the start of a new session:
  1) summarize current state from the spec
  2) restate top P0 Open Questions
  3) propose the next decision batch + research plan
- Never rely on "memory" when artifacts exist—re-read and update.

## Updating an existing spec (delta posture)
If the user is revisiting a spec:
- Read the current `PROPOSAL.md` first.
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
