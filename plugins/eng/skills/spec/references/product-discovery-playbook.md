Use when: Refining the problem definition, personas, user journeys, requirements, success metrics, and product surface-area impact.
Priority: P0
Impact: You build the wrong thing; the spec lacks user value; tech decisions aren't grounded in real workflows.

---

# Product discovery playbook

## The integrated stance
You are not doing "product first, then tech."
You are refining a single world model where product constraints and technical constraints co-create the solution.

## Required outputs (minimum)
- Problem statement (what pain, for whom, why now)
- Personas / consumer types (specific, not "users")
- One end-to-end user journey per primary persona
- Requirements (prioritized, with acceptance criteria)
- Success metrics + instrumentation plan
- Product surface-area impact map (what UIs, APIs, docs, onboarding change)

## Persona discipline
For each persona, capture:
- Job-to-be-done
- Current workflow
- Pain points / blockers
- Workarounds (what they do today)
- Trust/security sensitivities
- What "success" looks like (observable)

## User journey mapping (happy path + failure path)
For each primary persona:
1) Discovery (how they learn this exists)
2) Setup (steps, prerequisites, what can go wrong)
3) First use (the "aha moment")
4) Ongoing use (daily workflow)
5) Failure/debug (what breaks, what they see, how they recover)
6) Growth (advanced usage)

## Requirements that survive implementation reality
Write requirements as:
- **Must / Should / Could**
- include acceptance criteria
- include "failure experience" requirements (errors, recovery, supportability)

## Product prior art
Research:
- how comparable products explain this
- how they onboard users
- what their default configurations are
- what users complain about publicly

Turn prior art into:
- expectations we must meet (table stakes)
- gaps we can differentiate on
- pitfalls we should avoid

## Product surface-area impact
**First:** Load `/product-surface-areas` skill if available. Use it as the baseline map and identify which surfaces this feature touches — including transitive dependencies via the catalog's impact matrix or dependency graph. Fill gaps only for surfaces the catalog doesn't cover.

**If the skill is not available**, create a map of surfaces impacted:
- dashboard/admin UI
- API endpoints
- SDK methods
- CLI commands (if any)
- docs/onboarding
- error messages
- billing/limits (if relevant)
- telemetry/analytics (product + ops)

For each surface:
- what changes
- why it matters to the user
- what must be consistent (naming, mental model)

## Naming is a product decision
Treat naming as:
- a user mental-model contract
- a likely 1-way door if it appears in public APIs/docs/URLs

If naming is uncertain:
- propose 2-4 options
- show how each appears across surfaces (UI label, API field, CLI command)
- pick the simplest consistent mental model
