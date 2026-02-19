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

If you cannot verify current state from the codebase directly:
- investigate using `/research` or `/explore` to confirm
- label what remains uncertain after investigation

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

## Internal surface-area map
Map which internal subsystems this feature touches. This is the internal counterpart to the product surface-area impact map.

**First:** Load `/internal-surface-areas` skill if available. Use it as the baseline and identify which internal surfaces this feature touches — including transitive dependencies via the catalog's dependency graph or impact matrix. Fill gaps only for areas the catalog doesn't cover.

**If the skill is not available**, enumerate from investigation:
- build & package graph
- CI/CD pipelines
- test infrastructure
- database schemas & data access layer
- authentication & authorization infrastructure
- shared runtime types & validation
- observability infrastructure
- runtime engine / core processing
- deployment artifacts
- environment & configuration

For each surface touched:
- what changes
- coupling tightness (shared DB, API contract, event bus, etc.)
- blast radius (direct + transitive dependents)
- failure mode if this surface breaks

## Dependency capability checks
For any design that relies on a third-party capability:
- verify via types/source (not marketing docs)
- confirm extension points
- confirm error semantics
- record alternatives if capability is missing

Investigate directly — use `/research` for deep evidence trails.

When the spec substantively depends on 3P systems, go beyond targeted checks — dispatch Task subagents to investigate capabilities, source code, documentation, and best practices scoped to your scenario. See `references/research-playbook.md` "Third-party dependency investigation."

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
