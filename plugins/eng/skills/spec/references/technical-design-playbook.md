Use when: Mapping current system behavior, designing architecture, evaluating options, defining API/data/runtime changes, and reasoning about enforcement points.
Priority: P0
Impact: The spec collides with reality during implementation; hidden constraints surface too late.

---

# Technical design playbook

## The integrated stance
Every technical choice must be described with its product implications:
- "What does this mean for users?"
- "What does this mean for operators?"
- "What does this mean for future flexibility?"

## Current state trace (non-negotiable for meaningful changes)
Before recommending architecture:
- trace how the system works today end-to-end
- identify constraints and latent bugs
- identify reusable patterns

If you cannot verify current state:
- label uncertainty
- propose `/research` to confirm

## Internal prior art
Always search for:
- similar config models
- similar auth models
- similar UI patterns
- similar package/module boundaries
- similar runtime/transport patterns

Then explicitly say:
- what we reuse
- what we intentionally diverge from

## Dependency capability checks
For any design that relies on a third-party capability:
- verify via types/source (not marketing docs)
- confirm extension points
- confirm error semantics
- record alternatives if capability is missing

Use `/research` if needed.

## Enforcement architecture
For any policy/filtering/validation question:
- identify the narrowest shared chokepoint
- decide config-time vs runtime enforcement
- ensure the rule cannot be bypassed by untrusted clients

Record this as a decision (often cross-cutting and high-stakes).

## Vertical-slice explanation (default communication format)
When proposing a solution, always include:
- user journey implication
- UX surfaces impacted
- API/SDK shape
- data model change
- runtime/transport behavior
- observability/ops impact
- migration/rollout plan

## Blast radius mapping
If a change touches core primitives:
- list direct dependencies
- list indirect dependencies
- list "likely unaffected" areas with reasoning (don't guess silently)

## Options and tradeoffs
For each viable option:
- performance
- reliability/failure modes
- security boundary changes
- operability (debuggability, telemetry)
- migration complexity
- conceptual simplicity

Then recommend with confidence and evidence.
