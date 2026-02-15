Use when: Evaluating a major design decision across product, technical, and cross-cutting dimensions.
Priority: P0
Impact: Missing a relevant facet leads to rework; decisions lack rigor; important edge cases are discovered too late.

---

# Evaluation facets

Before any major decision, scan these facets. Not every one applies — but check all to identify which do.

If the decision is non-trivial and you have not checked the relevant facets, investigate them before recommending.

---

## Facets with detailed guidance

### Enforcement architecture
**Question:** Where does enforcement happen — client, server, proxy, or multiple layers?
**What to check:**
- Identify the narrowest shared chokepoint
- Decide config-time vs runtime enforcement
- Ensure untrusted clients cannot bypass the rule
- Check for redundant enforcement that could be simplified

### Configuration UX
**Question:** How do users configure this? Where do settings live?
**What to check:**
- Where does the user set this? (Dashboard, CLI, config file, API, env var)
- Is the configuration surface consistent with existing patterns?
- What are sensible defaults?
- What happens if configuration is missing or invalid?

### Naming & semantic correctness
**Question:** Are names consistent across every surface?
**What to check:**
- Pick one canonical term and trace it through every layer (API, DB, UI, docs, CLI)
- Check for synonyms that could cause confusion
- Verify naming against existing codebase conventions
- Check that names are accurate to what they represent (not what they were in an earlier design iteration)

### Failure & edge case UX
**Question:** What happens when things go wrong? What does the user see?
**What to check:**
- For each failure mode: what does the consumer see?
- Are error messages actionable (tell user what to do, not just what went wrong)?
- Are partial failures handled gracefully?
- What's the degraded experience? Is it acceptable?

### Migration & backward compatibility
**Question:** How do existing users transition? What breaks?
**What to check:**
- What existing behavior changes?
- Can migration be automated or does it require manual steps?
- Is there a rollback path?
- Can old and new coexist during transition?

---

## Additional facets (scan for relevance)
- External prior art (product + technical)
- Internal prior art (codebase patterns)
- Current system behavior (end-to-end trace)
- Dependency capabilities (verified from source)
- Conceptual simplicity (user mental model)
- Consumer-specific experience
- Security & trust boundaries
- Reversibility (1-way door vs phaseable)
- Blast radius and cascading effects
- Phased validation strategy
- Vision alignment
- Product+technical interleaving (inseparable)
