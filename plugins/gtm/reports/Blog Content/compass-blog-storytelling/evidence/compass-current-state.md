# Evidence: Compass Current State Analysis

**Dimension:** Compass-Specific Analysis & Recommendations
**Date:** 2026-02-20
**Sources:** /tmp/competitor-intel/compass codebase

---

## Key Files Referenced

- `Rules.md` — 12 Laws for blog writing
- `docs/LawsAndTemplate.md` — Copy/paste template
- `src/lib/prompts/blog-generation-prompts.ts` — 4-step generation code
- `src/prompts/blog/steps/*.md` — Prompt templates
- `src/prompts/shared/writing-laws/full.md` — Writing law enforcement
- `scripts/archive/seed-omar-beliefs.sql` — Team beliefs data

---

## Findings

### Finding: The 12 Laws optimize for scannability and conversion at the expense of connection
**Confidence:** CONFIRMED
**Evidence:** Rules.md analysis

The 12 Laws:
1. **Decision first** (80-130 words) — Prioritizes speed over context
2. **6-8 H2s** — Creates predictable navigation
3. **140-240 words per H2** — Enforces uniformity
4. **Decision Framework required** — Forces evaluation structure
5. **Prescriptions for executives** — Targets conversion
6. **H3 ≤ H2** — Maintains hierarchy
7. **Trade-offs required** — Builds credibility
8. **Media matching** — Tables for comparisons
9. **Intent-signaling titles** — SEO optimization
10. **Enterprise anchors** — Brand credibility
11. **Dual CTAs** — Conversion optimization
12. **Brutally skimmable** — Scanner-first design

**What's optimized:** Scanners, evaluators, converters
**What's ignored:** Readers seeking connection, learning, or narrative

**Key Quote from Rules:** "Enterprise demos come from evaluation intent, not information intent."

**Implications:** The system assumes readers are in evaluation mode. But many readers arrive in exploration mode, seeking to understand a problem before evaluating solutions.

---

### Finding: The generation pipeline systematically strips distinctive voice
**Confidence:** CONFIRMED
**Evidence:** blog-generation-prompts.ts analysis

The 4-step chain:

**Step 1: Research Synthesis**
```
buildResearchSynthesisPrompt() → Claude summarizes external research + proprietary data
```
- Original source voices are lost
- Data becomes bullet points

**Step 2: Outline Generation**
```
buildOutlinePrompt() → Claude creates structured outline
```
- Imposes mode-specific structure (high_volume_brief, standard_blog, enterprise_decision_memo)
- V2 context injection adds compliance rules
- Forces "## Decision" first

**Step 3: Section Writer**
```
buildSectionPrompt() → Claude writes each section
```
- Section-specific word counts enforced (Decision: 80-130, Inkeep: 150-200)
- Special instructions per section type
- "Be substantive, not fluffy" → Be bland, not engaging

**Step 4: Editorial Polish**
```
buildEditorialPolishPrompt() → Claude smooths and finalizes
```
- "Consistent voice (authoritative but accessible)"
- Generates FAQs, takeaways, tags
- Final averaging operation

**Cumulative effect:** Each step moves toward Claude's default "helpful assistant" voice.

---

### Finding: The beliefs system exists but isn't surfacing personality
**Confidence:** CONFIRMED
**Evidence:** seed-omar-beliefs.sql

Omar's beliefs are strong and opinionated:
- "Hybrid search outperforms pure vector search by 15-30%"
- "The best AI agent SDKs feel like native code, not a DSL"
- "AI support agents should admit uncertainty rather than confidently hallucinate"
- "Every AI answer should cite its sources"

**How they're used:** Injected as "evidence" in research synthesis, cited as data points.

**How they should be used:** As the foundation for the author's voice and argument.

**Gap:** The beliefs are treated as facts to cite, not as positions to argue.

---

### Finding: Section templates enforce formulaic structure within sections
**Confidence:** CONFIRMED
**Evidence:** section-writer.system.md, blog-generation-prompts.ts

Decision section requirements:
```
- Opens with blockquote decision box
- 80-130 words MAX
- Be direct and specific
- Do NOT write preamble
```

Inkeep section requirements:
```
- MAXIMUM 2 paragraphs (150-200 words)
- NO subsections or bolded headers
- Focus on 2-3 key differentiators only
- Keep it high-level and strategic
```

Trade-offs section requirements:
```
- 3-4 honest trade-offs
- Format: **[Issue]** — [Explanation]
- Be specific about when/why things break
```

**Effect:** Every blog follows the same section patterns. Readers develop template fatigue.

---

### Finding: The writing laws enforce brevity but not voice
**Confidence:** CONFIRMED
**Evidence:** writing-laws/full.md

Strong rules (brevity/structure):
- Sentence limit: 25 words maximum
- Paragraph limit: 1-3 sentences
- Section limit: 150-300 words per H2
- One idea per paragraph
- Numbers over adjectives
- Active voice
- No meta-commentary

Weak/missing rules (voice/connection):
- No guidance on personal anecdotes
- No permission for humor or surprise
- No encouragement of contrarian takes
- No named author voice guidance
- No story/narrative structure guidance

---

### Finding: Content modes limit format diversity
**Confidence:** CONFIRMED
**Evidence:** blog-generation-prompts.ts:63-69

Three modes only:
1. `high_volume_brief` (≤700 words)
2. `standard_blog` (700-1100 words)
3. `enterprise_decision_memo` (>1100 words)

All three follow the same structural pattern. No option for:
- Story-driven format
- Interview/Q&A format
- Contrarian essay format
- Tutorial/how-to format
- Lessons learned format

---

## Current State Summary

| Dimension | Current Approach | Problem |
|-----------|------------------|---------|
| Structure | Rigid 12-Law template | Predictable, template fatigue |
| Voice | "Authoritative but accessible" | Generic, no personality |
| Authorship | "Inkeep Team" default | Anonymous, no connection |
| Generation | 4-step Claude chain | Voice averaging, homogenization |
| Beliefs | Treated as evidence | Not used for author POV |
| Formats | 3 word-count modes | No narrative/story options |
| Emotional arc | Missing | Scanner-first, no engagement |

---

## Gaps / Follow-ups

- Need to design specific prompt modifications
- Should create alternative blog archetypes
- Need voice guidelines document
