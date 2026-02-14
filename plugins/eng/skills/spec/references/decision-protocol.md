Use when: Turning ambiguity into a structured decision backlog; running numbered decision batches; maintaining Open Questions + Decision Log.
Priority: P0
Impact: Conversation drifts; decisions aren't explicit; the user can't drive efficiently; "unknown unknowns" persist.

---

# Decision protocol

## Vocabulary (be strict)
- **Open Question:** Something we cannot decide yet without more info.
- **Decision:** A choice to commit to (even if reversible).
- **Assumption:** A temporary placeholder to unblock progress; must carry confidence + a verification plan.
- **Risk:** A known downside with probability/impact and a mitigation plan.
- **Deferred item:** Out-of-scope for the current phase, but documented with enough detail to pick up later.

## Assumption lifecycle
Assumptions are temporary scaffolding. Every assumption must carry:
- A confidence level (HIGH / MEDIUM / LOW)
- A verification plan (what would confirm or refute it)
- An expiry: by what point in the process must this be resolved?

When an assumption is verified → convert to Decision (with evidence reference).
When an assumption is refuted → cascade: what other decisions relied on this? Update them.

## Tagging schema (apply to every Open Question / Decision)
1) **Type:** Product / Technical / Cross-cutting
2) **Priority:** P0 (must), P1 (should), P2 (nice)
3) **Reversibility:** 1-way door / reversible
4) **Blocking:** blocks Phase 1? yes/no
5) **Confidence:** HIGH / MEDIUM / LOW (or CONFIRMED / INFERRED / UNCERTAIN)

## The numbered decision batch (default interaction contract)
When it's time for user input, present:

- **Decision 1:** <one sentence>
  - Options: A / B / C
  - Practical effect (what changes in the real world)
  - Recommendation (if evidence supports it)
  - Confidence + what increases it

Ask the user explicitly:
> "Reply with a numbered list (1..., 2..., 3...) with your decisions or where you want research."

This is designed to support high decision velocity.

## Decision velocity calibration
In your batch:
- Put "easy/clear" items first (so the user can clear them quickly).
- Put the "hard/uncertain" items next with more context and explicit research proposals.
- Keep batches small enough to answer in one reply (usually 3-8 items).

## Confidence-weighted presentation (don't pretend all items are equally open)
For each item, signal:
- **Ready to decide now:** evidence is strong; recommendation included.
- **Needs research:** recommendation depends on missing evidence; propose a plan.
- **Needs user vision:** requires product strategy/positioning choice; ask directly.

## Uncertainty as a research allocator
Treat any of these as a *signal* to propose research:
- "I think...", "probably...", "maybe...", "not sure..."
- user: "hmmm...", "idk...", "help me think..."
- conflicting constraints or multiple plausible architectures

Your job:
- do not resolve uncertainty by guessing
- convert it into a concrete research plan and/or crisp decision options

## After every decision: cascade analysis
Immediately do:
1) Update Decision Log (what changed, why, date)
2) Identify what the decision unlocks:
   - new requirements
   - new constraints
   - new open questions
3) Identify blast radius:
   - product surfaces touched
   - technical systems touched
4) Update phases/deferrals if needed

## Stop conditions (when to force deeper diligence)
If any decision is a 1-way door (public API, schema, security boundary, naming):
- require explicit confirmation from the user
- propose evidence gathering if confidence isn't HIGH
- ensure the spec records rationale and rollback/migration implications

## When you disagree with the user's decision
If the user makes a decision you believe is wrong:
1. State your concern clearly and specifically (not "I'm not sure about this").
2. Explain what evidence supports a different direction.
3. If it's a 1-way door: push harder — "I want to flag this as high-stakes. Here's what I think we'd regret and why."
4. If it's reversible: record your concern in the decision rationale, note it's revisitable, and move on.
5. Never silently comply with a decision you believe is a mistake — the value of this process is surfacing risks the user might not see on their own.
