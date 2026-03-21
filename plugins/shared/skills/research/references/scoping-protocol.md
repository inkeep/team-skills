Use when: Doing Step 1 scoping for a new research task (formal report or direct answer); building/confirming a rubric before research begins
Priority: P0
Impact: Without this, research tends to drift, skip critical dimensions, or over-investigate irrelevant facets

---

# Collaborative Scoping Protocol (Rubric-First)

**Goal:** Achieve complete clarity and alignment on what to investigate BEFORE any research begins. Help the user think through dimensions they may not have considered.

> If the user is updating an existing report, follow Path C and `references/updating-existing-reports.md`. Do not restart scoping from scratch unless the primary question or scope has changed materially.

---

## 1) Identify Report Type

First, determine which report type best fits:

| Type | Primary Question | Typical Requester Need |
|------|------------------|------------------------|
| **Capability Assessment** | "Can X do Y for our use case?" | Go/no-go decision on adoption |
| **Technology Deep-Dive** | "How does X work internally?" | Understanding for integration or extension |
| **Comparative Analysis** | "Should we use X or Y?" | Selection between alternatives |
| **Integration Research** | "How do we connect X to our system?" | Implementation planning |
| **Architecture Documentation** | "What does this system look like?" | Knowledge capture for team |

If unclear, ask:
> "What decision will this report help you make? What will you DO differently after reading it?"

---

## 2) Build the Research Rubric

**This is the critical alignment step.** Do not skip or rush it.

### A) Ground the topic landscape

Always run `/ground` on the research topic to discover the actual landscape before proposing dimensions — even when the user provides explicit dimensions. Grounding uncovers facets, terminology, and concepts the user may not have thought of, which helps the agent do better research regardless of how well-specified the input is.

When the user provides explicit dimensions, `/ground` runs in context-aware mode: it identifies the areas the user already covered and focuses probes on gaps rather than re-discovering known areas. The user's dimensions are preserved; the topic map supplements them.

When no user dimensions are provided, the topic map becomes the rubric skeleton — dimensions from the topic map map to rubric dimensions, research questions map to facets, priorities are preserved.

In both cases, supplement with `references/dimension-frameworks.md` for any standard dimensions neither the user nor the topic map covers (e.g., "Licensing & Cost" rarely surfaces in web probes but matters for capability assessments).

### B) Iterate on each dimension using Decision Support Protocol

For each proposed dimension, walk through:

```
### Dimension: [Name]

**Why this dimension matters:**
- [Concrete impact on the decision/use case]
- [What you'd miss if you skipped it]

**Facets we could investigate:**
1. [Specific angle/aspect]
2. [Specific angle/aspect]
3. [Specific angle/aspect]

**Facet depth guidance:** For dimensions marked Deep, specify WHAT KIND of depth matters — not just the topic. If a facet only names a topic ("web search probes"), the agent defaults to conceptual coverage ("here's what exists and why it matters"). Deep should go further, but "further" means different things for different dimensions. Examples:

- **Mechanical** — how it actually works step-by-step, with inputs, outputs, decision points (e.g., "how does Firecracker boot a microVM")
- **Quantitative** — specific numbers, benchmarks, measurements at specific scales (e.g., "cost per sandbox-hour at 1K concurrent users")
- **Adversarial** — failure modes, known issues, what critics say, strongest counterarguments (e.g., "gVisor CVE history and known syscall gaps")
- **Comparative** — systematic matrix across multiple alternatives on specific axes (e.g., "isolation technologies compared on boot time, memory overhead, KVM requirement")
- **Practical** — enough detail that someone could implement it, with specific techniques and examples (e.g., "how to generate maximally divergent search queries")
- **Primary source** — go to ground truth (source code, specs, papers), not summaries or blog posts (e.g., "read the Kiwi binary format source, not the blog post about it")

Choose what fits the dimension. A cost dimension needs quantitative depth. A security dimension needs adversarial depth. An architecture dimension might need mechanical + comparative. There's no single default — the right depth type depends on what the reader will DO with the findings.

**Depth options:**
- **Deep:** [What thorough investigation looks like — specify which kind(s) of depth]
- **Moderate:** [What sufficient coverage looks like — conceptual understanding is usually acceptable]
- **Skip:** [Why you might not need this]

**My recommendation:** [Deep/Moderate/Skip] because [reason tied to their stated goal]

**Question:** Should we include this dimension? If yes, which facets matter most?
```

### C) Surface dimensions the user may not have considered

Proactively suggest:
- "Based on your use case, you might also want to consider [dimension] because [specific reason]..."
- "Teams often overlook [dimension] and regret it later when [consequence]..."
- "Given you mentioned [X], there's a related concern around [Y]..."

### D) Identify explicit non-goals

Ask: "What should this report explicitly NOT cover? What's out of scope?"

Document these to prevent scope creep during research.

### E) Capture constraints, context, and research purpose

Gather:
- **Research purpose:** Why does this research matter? What will the reader DO with the findings? What do they care about most? This is the "north star" that guides dimension selection, depth decisions, and follow-up evaluation. Capture it in 2-4 bullets — not a restatement of the primary question, but the broader context that makes the question worth asking.
- **Timeline pressure:** Is this urgent? Does depth need to trade off against speed?
- **Audience:** Who will read this? Technical depth appropriate?
- **Prior knowledge:** What do you already know? What can we skip?
- **Specific concerns:** Any particular risks or gotchas you're worried about?

If the user hasn't articulated purpose explicitly, surface it:
> "Beyond the primary question, what do you care about most in this research? What outcomes or concerns should guide which angles we go deepest on?"

### F) Determine output format (report vs direct answer vs report update)

**Default: Formal Report (Path A).** Use Path B only when the user explicitly signals they want a quick answer.

If the user explicitly asks for a direct answer or the question is trivially small, confirm the downgrade:
> "This seems like a quick check — I'll answer directly instead of writing a full report. Let me know if you'd rather have a persistent report."

| Output Format | When to use | What you get |
|---------------|-------------|--------------|
| **Formal Report** | Findings need to persist, be shared, or referenced later | REPORT.md + evidence/ files in `<reports-dir>/` |
| **Direct Answer** | Immediate need, won't reference again, speed matters | Findings delivered in conversation (no files created) |
| **Update Existing Report** | A report already exists and you want additive/corrective changes | Surgical edits to REPORT.md and evidence/ (plus update summary) |

**Signals that suggest Formal Report:**
- "write a report", "document this", "create a report"
- "another agent will use this", "for the team"
- Complex multi-day research

**Signals that suggest Direct Answer (require EXPLICIT user opt-in — do not infer from tone):**
- "just tell me", "quick answer", "don't write a report", "no report needed"
- "I don't need a full report, just..."
- User explicitly says they want findings in conversation only

**These are NOT signals for Direct Answer (use Path A by default):**
- Conversational tone or informal phrasing
- "what does X do?", "how does Y work?", "can Z do W?"
- "I need to understand...", "help me figure out..."
- "research this for me", "look into X", "can you /research..."
- Invoking the skill via `/research` (this IS the signal for formal research)

**Signals that suggest Update Existing Report:**
- "update/refresh/extend the report"
- "add these dimensions to the existing report"
- "we learned new info; correct the report"

**If output format is Direct Answer:** Skip Steps 2, 4, 5. Go straight to research, then deliver findings in conversation. Offer to formalize afterward if helpful.

If output format is **Update Existing Report**:
- Follow Path C and load `references/updating-existing-reports.md`.

### G) Determine report stance (conclusions vs factual) — *if formal report or report update*

**This is critical.** Ask the user:

> "Should this report include conclusions and recommendations, or should it be purely factual/academic—presenting findings for another agent or reader to draw conclusions from?"

| Stance | When to use | Report characteristics |
|--------|-------------|------------------------|
| **Conclusions** | User needs a decision recommendation | Includes "Recommendation" section, "Winner" columns in comparisons, prescriptive language |
| **Factual/Academic** | Another agent will draw conclusions, or user wants to decide themselves | No recommendations, no "Winner" columns, presents data without judgment, uses neutral language |

**Default:** Ask. Do not assume the user wants conclusions.

If the user chooses **Factual/Academic** stance:
- Executive Summary becomes "Key Findings" (no recommendations)
- Comparison tables show data only (no "Winner" column)
- Avoid prescriptive language ("should", "recommend", "best")
- Present trade-offs without stating which is better
- Let evidence speak for itself

### H) Identify OSS source availability (for technical research)

For engineering/architecture research, identify which technologies have open source code available:

| Technology | OSS Status | Repo/Source | Notes |
|------------|------------|-------------|-------|
| [Tech A] | Full OSS | github.com/org/repo | Primary source |
| [Tech B] | Partial (SDK only) | github.com/org/sdk | Check staleness |
| [Tech C] | Closed | — | Web search only |

This determines your research approach in Step 3. Source code is ground truth for OSS.

---

## 3) Produce the Research Rubric (for user approval)

Before proceeding, output a complete rubric for user approval:

```markdown
## Research Rubric: [Report Name]

**Report Type:** [Type]
**Primary Question:** [What decision this enables]
**Audience:** [Who will read it]
**Output Format:** [Formal Report / Direct Answer / Update Existing Report]

**Research Purpose:**
- **Why this matters:** [What decision or action this enables — the "so what"]
- **Reader cares most about:** [2-4 specific priorities that should guide depth and angle selection]

### Dimensions to Investigate

| # | Dimension | Facets | Depth | Priority |
|---|-----------|--------|-------|----------|
| 1 | [Name] | [Specific facets] | Deep | P0 |
| 2 | [Name] | [Specific facets] | Moderate | P1 |
| 3 | [Name] | [Specific facets] | Deep | P0 |
| ... | ... | ... | ... | ... |

### Explicit Non-Goals
- [What we will NOT investigate]
- [What is out of scope]

### Constraints
- **Timeline:** [Urgent/Standard/Thorough]
- **Prior knowledge:** [What we can assume]

### Report Stance (if Formal Report or Update)
- **Stance:** [Conclusions / Factual-Academic]
- **Rationale:** [Why this stance - e.g., "another agent will draw conclusions" or "need decision recommendation"]

### OSS Sources (for technical research)
| Technology | OSS Status | Repo | Research Approach |
|------------|------------|------|-------------------|
| [Tech] | Full/Partial/Closed | [URL or —] | Code-first / Web-first / Hybrid |

### Success Criteria
- [What "done" looks like]
- [Specific questions that must be answered]
```

**Get explicit confirmation:** "Does this rubric capture what you need? Any dimensions to add, remove, or reprioritize?"

**Do not proceed until the user confirms the rubric.**
