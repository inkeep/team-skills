Use when: Proposing/structuring research to validate assertions; deciding when to run /research; ensuring product research gets equal rigor.
Priority: P0
Impact: Decisions are made on vibes; prior art is missed; dependency constraints are discovered too late.

---

# Research playbook

## Philosophy
Research is not a user-triggered add-on. It's the default mechanism for:
- validating assertions
- expanding the option space
- discovering hidden constraints, risks, and opportunities

Your job is to propose research **proactively** at every reasonable decision point, while keeping the user in control of what to spend time on.

## When to invoke `/research`
Use it when you need **evidence-backed** answers (especially for 1-way doors), including:
- Internal current-state traces (end-to-end code path)
- Internal prior art (existing patterns in the codebase)
- OSS/library capability checks (types/source)
- External technical prior art (similar OSS systems and architecture patterns)
- Security/auth boundaries and threat-model-relevant behavior

Use it especially when:
- a decision depends on "does our system currently do X?"
- a decision depends on "does dependency Y support capability Z?"
- you need an auditable evidence trail (high-stakes)

## Product research with technical rigor
Product research should get the same depth discipline:
- Competitor/product prior art (positioning + UX, not just tech)
- User complaints/issues (forums, GitHub issues, docs friction)
- Terminology/naming conventions in the ecosystem
- Common onboarding flows and failure modes

If the product research needs citations/evidence, it's valid to use `/research` as the execution engine (web/OSS + evidence capture), but keep the outputs framed as product learning.

## Research menus (pick the smallest set that answers the decision)

### A) External prior art (product + technical)
- 3-5 comparable products/projects
- What they chose
- Why (if knowable)
- Where their context differs from ours
- What we can reuse vs where we should diverge

### B) Internal prior art (pattern reuse)
- Where in our codebase we solved analogous problems
- What parts are reusable
- What parts must differ (because constraints changed)

### C) Current-state trace (end-to-end reality)
Trace from entrypoint → runtime → config → storage → UI/UX → ops.
Goal: discover hidden constraints and latent bugs.

### D) Dependency constraints
Verify with types/source (not just docs):
- capability present?
- extension points?
- failure semantics?
- performance implications?

### E) Risk and blast radius research
For changes with wide impact:
- List every system that directly or indirectly depends on the changed area
- For each: what's the coupling? Tight (shared DB) or loose (API contract)?
- What's the worst-case failure mode?
- Can the change be deployed independently or does it require coordination?
- Identify silent failure modes (things that break without producing errors)

## How to convert research into decision inputs
After research completes, translate findings into this format before presenting options:

1. **What we learned** (2-6 bullets) — key facts, confirmed behaviors, capabilities/limitations
2. **What constraints this creates** (1-3 bullets) — options eliminated, requirements imposed, boundaries discovered
3. **What options remain viable** (2-4 bullets) — only options that survive the evidence
4. **Recommendation** + confidence + what would change it

Then update: Decision Log, Open Questions, Risks, and Phasing (if research changes feasibility or sequencing).

Do not paste raw research into the spec. Summarize the load-bearing findings and link to evidence files for the full trail.

## Negative searches
If you tried to verify something and couldn't find it:
- record "NOT FOUND" (what you searched, where)
- treat it as uncertainty, not as a fact

## Parallelization (when available)
If there are multiple independent research tracks:
- split into 3-6 parallel investigations
- each returns findings + evidence
- you synthesize into decisions
