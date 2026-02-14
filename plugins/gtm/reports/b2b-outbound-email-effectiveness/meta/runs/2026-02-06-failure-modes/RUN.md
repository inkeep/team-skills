# Run: 2026-02-06-failure-modes

**Status:** Closed
**Closed:** 2026-02-07
**Intent:** Additive
**Created:** 2026-02-06

## Purpose
Deep dive into failure modes of B2B outbound email — what definitively doesn't work, how recipients detect and reject AI-generated emails, the "AI slop" problem, and evidence-backed patterns that crater reply rates or damage sender reputation.

## Scope

**In-scope (delta only):**
- How recipients detect AI-generated/templated emails (specific tells, patterns, red flags)
- Quantified failure rates — tactics proven to destroy reply rates with data
- The "AI slop" phenomenon: what makes AI outbound feel generic, robotic, or offensive
- Recipient psychology of rejection: what triggers delete vs spam report vs negative brand impression
- Named practitioners/researchers documenting failure patterns with real data
- Real examples of emails that failed and why (teardowns of bad emails)
- Anti-patterns specific to AI-generated outbound vs generic bad email

**Out-of-scope (avoid drift):**
- Everything already covered in dimensions 1-17 (dimension 11 anti-patterns are baseline — this goes deeper on the *why* and the AI-specific angle)
- Deliverability infrastructure (DNS, warming, domains)
- Tool comparisons (features/pricing)
- List building / lead sourcing
- Legal compliance

## Delta Rubric

| # | Dimension | Depth | Priority | Worker |
|---|-----------|-------|----------|--------|
| 18 | AI Slop Detection & What Recipients Instantly Reject | Deep | P0 | W11, W12, W13 |

## Source Quality Rules
Same as prior runs. Prioritize real operator/founder/recipient accounts, data-backed studies, named practitioners. Deprioritize generic tooling company blog posts. Recipient-side evidence (buyer surveys, exec testimonials about what they hate) is especially valuable here.

## Worker Groupings

| Worker | Focus Area | Rationale |
|--------|-----------|-----------|
| W11 | AI detection tells & slop patterns — how people identify AI emails, what makes them "feel" AI | Technical/perceptual detection |
| W12 | Quantified failure modes — tactics with data showing they destroy results, buyer surveys on what they hate | Data-grounded failure evidence |
| W13 | Recipient psychology & brand damage — what triggers spam reports, negative impressions, trust destruction; practitioner post-mortems of campaigns that failed | Psychology + consequences |
