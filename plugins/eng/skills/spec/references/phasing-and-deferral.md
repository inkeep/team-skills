Use when: Negotiating scope (In Scope vs Future Work), applying the resolution completeness gate, classifying Future Work maturity, managing scope changes during investigation, and documenting Future Work items.
Priority: P0
Impact: Unresolved items get labeled "in scope"; implementers re-open design questions; future work loses context; scope drifts silently.

---

# Scoping and future work

## The two-bucket model

Every spec produces two outputs:

| Bucket | What it means | Standard |
|---|---|---|
| **In Scope** | Fully resolved. An implementer can act on this without re-opening design questions. | Passes the resolution completeness gate (below). |
| **Future Work** | Not in this implementation. Documented with enough context to pick up later. | Has a maturity tier and enough documentation to avoid re-research. |

There is no "Phase 2." Items are either resolved enough to implement now, or they are future work with an honest assessment of how much we know about them.

## Scope hypothesis (after the world model)

After building the world model (Step 3), propose a rough In Scope / Out of Scope picture. This is a starting position, not a commitment.

**Anchor the hypothesis in goals.** Ask: "What is the smallest scope where the stated goals are met and the core architecture is validated?" Start there. Everything else is a candidate for Out of Scope — it has to argue its way in.

**Scope-in criteria** (signals an item belongs In Scope):
- Validates a core architectural assumption that can't be tested without it
- Completes an end-to-end user journey that would otherwise be broken
- Is a 1-way door that gets harder to do correctly later if not done now
- Excluding it creates a split-world problem (two paths that later need merging)

**Scope-out criteria** (signals an item is Future Work):
- The stated goals can be met without it
- It's additive to an already-working system (enhancement, not foundation)
- It can be added later without reworking In Scope items
- The investigation needed to fully resolve it is disproportionate to its value right now

Present to the user: "Based on the goals and what we've mapped, here's my initial read on what should be in scope. This will sharpen as we investigate." The user confirms, adjusts, or redirects.

## Scope changes during investigation

Scope changes are expected. Investigation reveals new costs, dependencies, risks, and opportunities that the hypothesis couldn't anticipate.

**When to propose a scope change:**
- Investigation reveals an item is significantly more complex or risky than expected
- Investigation reveals an In Scope item depends on something currently Out of Scope
- Investigation reveals an Out of Scope item is actually necessary for the architecture to validate
- The user provides new context that shifts priorities

**How to propose a scope change:**
Present with evidence: "Investigation revealed [finding]. This means [item] should move [in/out] because [reason]. Options: (a) [move it], (b) [keep current scope but adjust X], (c) [descope related item Y instead]."

The user decides. Scope changes are explicit and evidence-driven — never implicit.

## Scope checkpoints

During the iterative loop, when a cluster of decisions resolves (every 2-3 loop iterations), present the current scope picture:
- **In Scope:** [items] — status of each (resolved / in progress / blocked)
- **Out of Scope:** [items] — maturity tier of each
- **Uncertain:** [items] — what investigation would clarify

This gives the user a whole-picture view at regular intervals. Without these, scope drifts and the user loses track of the overall shape.

## Resolution completeness gate (In Scope quality standard)

Every In Scope item must pass before scope freeze (Step 6):

- [ ] All decisions that affect this item have been made (not deferred, not assumed)
- [ ] 3rd-party dependency selections are named and justified (not "use something that does X")
- [ ] Architectural viability validated (the recommended path works in the current runtime — confirmed by investigation, not assumed)
- [ ] Integration feasibility confirmed for key system boundaries
- [ ] Acceptance criteria are verifiable (an implementer could write tests from them)
- [ ] No dependency on an Out of Scope item

If an item fails the gate, it's either a **blocker** (return to Step 5 to resolve) or it moves to **Future Work** (with the user's agreement).

## Future Work maturity tiers

Not all future work is equal. Label each item honestly:

| Tier | Signal | What's documented |
|---|---|---|
| **Explored** | Investigated during the spec. Clear picture exists. | What we learned + recommended approach + why not in scope now + triggers to revisit. Could be promoted to In Scope with minimal additional work. |
| **Identified** | Known to matter, but not deeply investigated. | What we know + why it matters + what investigation would be needed to scope it. Needs its own spec pass before implementation. |
| **Noted** | Surfaced during the process but not examined. | Brief description + where it came from + why it might matter later. |

The maturity tier describes **how much we actually know** — not how committed we are to doing it or when.

**Documentation format for Future Work:**
- What we learned (if Explored or Identified)
- Why not in scope now
- Maturity tier
- Triggers to revisit (scale, customer demand, failures, dependency changes)
- Implementation sketch (Explored tier only — enough to avoid re-research)

## 1-way doors: require diligence

Examples:
- public API/SDK shape
- persistent data model / schema
- URLs / naming exposed to users
- security/auth trust boundaries
- irreversible migrations

For 1-way doors:
- require explicit user confirmation
- prefer evidence-backed research
- record rationale + rollback/migration strategy

1-way doors that affect In Scope items must be resolved during the spec. 1-way doors that only affect Future Work items can be documented as "will need to be decided when this becomes In Scope."

## Reversible decisions: decide faster

Examples:
- internal factoring
- non-public implementation choices (but 3P dependency selection and architectural viability are not in this category even when they feel internal)
- optional UX enhancements
- feature flags and rollout defaults

For reversible choices:
- decide faster
- record the current choice and why it's good enough for now
- note what would trigger revisiting

## The scope accordion

Use it deliberately:
1) Expand scope to test generality ("does this pattern work for future providers?")
2) Contract to define In Scope
3) Preserve the expanded thinking as Future Work (Explored tier)

This prevents scope creep while preserving insight.

## Minimum viable scope

The minimum viable scope is the smallest set of In Scope items where:
- The stated goals are met
- The core architectural bet is validated
- At least one consumer type is served end-to-end
- Every Future Work item is additive (no rework of In Scope items required)

Use this as the anchor for the scope hypothesis. The user may want a larger scope — that's fine, but each additional item must pass the resolution completeness gate.
