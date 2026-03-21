---
name: ground
description: "Lightweight topic landscape discovery before committing to a plan. Runs a Probe → Extract → Synthesize pass that produces a structured topic map with ranked dimensions, key entities, research questions, and confidence levels. Use before building rubrics, specs, or analysis frameworks — or standalone to understand a topic landscape. Triggers: ground, landscape, topic map, what's out there, map the space, before researching, pre-scope, discover dimensions."
argument-hint: "[topic to ground] (optional: context to build on)"
---

# Ground

Map a topic landscape before committing to a plan.

Grounding is a three-phase discovery pass — **Probe → Extract → Synthesize** — that produces a structured topic map. It discovers what's out there, not what's true. It is infrastructure for planning skills (`/research`, `/spec`, `/analyze`) and a standalone tool for landscape understanding.

Grounding always runs the same way regardless of how it's invoked. The consumer skill (or user) decides what to do with the topic map — present it, feed it into rubric construction, or use it to scope an analysis. Grounding itself is data collection, not a decision point.

**Requirement:** This skill requires web search capabilities. If web search is unavailable in your environment, this skill cannot run.

---

## When to use this skill

| Situation | Use |
|---|---|
| Need to understand a topic landscape before building a research rubric | This skill |
| Need to scope what dimensions a spec should cover | This skill |
| Need to discover what aspects of a problem exist before analyzing | This skill |
| User says "/ground [topic]" to understand a space | This skill |
| Need to investigate code patterns, trace call chains, map codebase surfaces | `/explore` (codebase grounding, not topic grounding) |
| Need to evaluate evidence for truth, not just discover what exists | `/research` |

---

## Context-awareness

Before generating probes, check what's already in the conversation — a spec, rubric, prior research, domain knowledge the user provided, or an existing topic map from a previous grounding pass.

If existing context is present:
- Identify the areas already covered
- Focus probes on gaps — what's NOT in the existing context
- Do not re-discover what is already established

If no existing context, proceed with full discovery.

---

## The workflow

Before starting, create tasks to track progress through the phases:

1. **Phase 1: Probe** — generate and execute divergent search probes
   - Context check (existing knowledge in conversation?)
   - Wave 1: generate and execute 3 parallel probes
   - Convergence check
   - Wave 2 (if needed): 1-2 adaptive probes
2. **Phase 2: Extract** — pull structured information from probe results
   - Entity extraction
   - Taxonomy generation
   - Gap identification
3. **Phase 3: Synthesize** — generate dimensions, then prune to topic map
   - Step 3a: generate 10-12 candidate dimensions unconstrained
   - Step 3b: critique, merge, rank, prune to 5-7
   - Emit structured topic map

Mark each task as completed as you finish it.

### Phase 1: Probe

Generate divergent search probes and execute them to discover the topic landscape.

**Two-wave execution:**

**Wave 1 — Parallel divergent probes:**
1. Generate 3 probes from different categories in the probe vocabulary below, adapted to the topic. Choose the categories that will produce the most structurally different results for this specific topic.
2. Execute all 3 probes in parallel using web search.
3. Collect the results — titles, snippets, and any structured data (headings, entity mentions, taxonomies).

**Convergence check:** Review Wave 1 results. Did 2+ probes find the same top-level categories with no contradictions? If the landscape appears simple and well-covered, skip Wave 2.

**Wave 2 — Adaptive probes (if needed):**
1. Generate 1-2 additional probes shaped by what Wave 1 revealed — target the gaps, the unexpected threads, or the areas with the thinnest coverage.
2. Execute and collect results.

**Early stopping:** If 2 consecutive probes produce zero new top-level categories, declare formulation achieved and move to Phase 2. Minimum 3 probes before early stopping is allowed.

**Probe generation guidance:**
- Each probe should be structurally different — different framing, different query shape, different content type targeted. The probe vocabulary exemplars below show the structural shape for each category.
- The contrarian probe uses "why [entity] stopped/abandoned X" framing, not "X limitations." This retrieves narrative experience content instead of balanced listicles.
- Adapt probe categories to the topic. Not every topic needs all 5 categories. A well-established academic field may not need a recency probe. A brand-new technology may not need a contrarian probe yet.

#### Probe vocabulary

Five probe categories for topic landscape discovery. Each category has a distinct **purpose** and **structural shape** — adapt the exemplars to the topic, don't fill in blanks. The categories are a starting vocabulary, not a rigid sequence.

**1. Broad Survey**
- **Purpose:** Discover the vocabulary, major sub-areas, and overall shape of the topic. This is always the first probe — it tells you what you're looking at before you zoom in.
- **Structural shape:** The topic in its most general form, framed to surface taxonomies and overviews.
- **Exemplars:**
  - Topic "information foraging theory" → `information foraging theory overview major concepts`
  - Topic "vector database architectures" → `vector database types comparison architectures overview`
- **What good results look like:** Wikipedia-style overviews, survey papers, "introduction to X" articles, taxonomy pages.

**2. Key Concept Deep-Dive**
- **Purpose:** Follow the most prominent thread from the broad survey. Discover the internal structure of the most important sub-area.
- **Structural shape:** Take the single most prominent concept or sub-area from the broad survey and search for it directly. Go one level deeper than the overview.
- **Exemplars:**
  - Broad survey revealed "patch-leaving models" as central → `marginal value theorem information foraging patch leaving`
  - Broad survey revealed "HNSW" as dominant index type → `HNSW algorithm hierarchical navigable small world graph construction`
- **What good results look like:** Technical explanations, foundational papers, detailed comparisons within the sub-area.

**3. Entity/Player Scan**
- **Purpose:** Identify the key authors, frameworks, standards, tools, and organizations that define the space. Entities are the nouns of the landscape — they anchor the taxonomy to real things.
- **Structural shape:** Search for who and what, not what or how. Frame the query around the actors and artifacts.
- **Exemplars:**
  - Topic "information foraging theory" → `Pirolli Card information foraging researchers PARC Xerox`
  - Topic "vector database architectures" → `Pinecone Weaviate Milvus Qdrant Chroma vector database comparison`
- **What good results look like:** Comparison pages, "awesome X" lists, conference programs, tool registries, author pages.

**4. Contrarian/Alternative**
- **Purpose:** Discover what doesn't work, what failed, and what people moved away from. This is the most structurally different probe — it retrieves narrative and experience content instead of encyclopedic content.
- **Structural shape:** Use "why [entity] stopped/abandoned X" framing. Do NOT use "X limitations" or "X vs Y" — those retrieve balanced listicles, not genuine contrarian perspectives.
- **Exemplars:**
  - Topic "information foraging theory" → `why information foraging theory doesn't apply modern search behavior`
  - Topic "vector database architectures" → `why company migrated away from Pinecone vector database problems`
- **What good results look like:** Blog posts titled "Why we stopped using X," HN/Reddit threads with experience reports, post-mortems, migration stories.

**5. Recency Probe**
- **Purpose:** Discover the latest developments — what's new, what's changing, what just emerged. Topics evolve; the broad survey may surface canonical but dated material.
- **Structural shape:** Add the current year and terms like "latest," "new," or "2025/2026" to the most relevant aspect of the topic.
- **Exemplars:**
  - Topic "information foraging theory" → `information foraging theory 2025 2026 new research applications LLM`
  - Topic "vector database architectures" → `vector database 2025 2026 new architectures hybrid search developments`
- **What good results look like:** Recent blog posts, preprints, release announcements, conference talks from the current year.

---

### Phase 2: Extract

From the collected search results (typically ~2-5K words of snippets), extract structured information.

**Skip rules — apply before reading full results:**
- If a result's snippet contains only terms already in the emerging taxonomy, skip it entirely. If you already know these terms, the result won't add new information.
- If extracting from a result and the first substantive section produces zero new entities, skip the remainder of that result. Yield has dropped to zero — leave the patch.

**Extraction steps (can be done in a single pass over the collected material):**

1. **Entity extraction:** Identify concepts, methods, people, organizations, artifacts, and relationships mentioned across the results. Note which entities appear in multiple probes (high signal) vs. only one (may be peripheral).

2. **Taxonomy generation:** Organize the discovered entities into a hierarchical topic structure. What are the major branches? What sits under each branch? Where are the natural groupings?

3. **Gap identification:** What's conspicuously absent from the results? What would you expect to find for this topic that didn't show up? Gaps are as informative as what's present.

Cap at 5 results processed, max 3 extraction passes on the collected text. Quality degrades after 2-3 rounds — additional passes produce diminishing returns.

---

### Phase 3: Synthesize

Two sub-steps: generate broad, then prune sharp.

**Step 3a — Generate:**

Produce 10-12 candidate dimensions unconstrained. Group the extracted entities into natural clusters first, then label each cluster as a dimension. Use Braun & Clarke thematic analysis: entities first, labels second.

Do NOT constrain the count at this stage. Let the model explore the full space of what the evidence suggests.

**Step 3b — Critique + Prune:**

A separate step (within the same response, not a separate prompt) that:

1. **Merges** overlapping dimensions. If two dimensions share most of their key entities, they are likely the same dimension described differently — merge them.
2. **Ranks** each remaining dimension by: relevance to the topic × evidence density from probes × cost-of-being-wrong if this dimension is missed.
3. **Emits** the top 5-7 dimensions with a brief justification for why each was retained.
4. **Assigns priority tiers:** P0 (core to the topic, high evidence density), P1 (important but secondary), P2 (peripheral or speculative).
5. **Generates 1-3 research questions** per dimension — specific questions that would need to be answered to understand this dimension fully.
6. **Outputs** the structured topic map in the format below.

**Structural safeguards:**
- The final topic map must contain at most 9 dimensions (hard ceiling). This is a safety net — the target is 5-7.
- At most 5 dimensions may be assigned P0. If more than 5 feel essential, that is a signal to merge or re-scope.
- Max 2 rounds of self-critique in the prune step. If the dimensions aren't clean after 2 rounds, emit what you have. Quality degrades with additional rounds.

---

## Output format

Emit the topic map as a YAML block in the conversation:

```yaml
topic: "<the topic that was grounded>"
grounding_confidence: high | medium | low
dimensions:
  - name: "<dimension label>"
    priority: P0 | P1 | P2
    key_entities: [entity1, entity2, ...]
    research_questions:
      - "<specific question>"
    evidence_density: high | medium | low
    confidence: high | medium | low

coverage_gaps:
  - "<identified gap not covered by any dimension>"

terminology:
  - "<key term discovered during grounding>"
```

**Field guidance:**
- `grounding_confidence`: How well did the probes cover the topic? `high` = clear taxonomy emerged with convergence across probes. `medium` = reasonable coverage but some areas are thin. `low` = topic is novel or probes returned sparse/conflicting results.
- `evidence_density`: How much material did the probes find for this dimension? `high` = multiple probes surfaced it. `medium` = one probe with substantive results. `low` = inferred from gaps or single mentions.
- `confidence`: How confident are you that this dimension is real and correctly scoped? `high` = convergent evidence. `medium` = supported but could be subdivided or merged differently. `low` = speculative or based on thin evidence.

**Example** (calibration for dimension count and structure):

```yaml
topic: "browser extension session proxy for SaaS APIs"
grounding_confidence: medium
dimensions:
  - name: "Session credential extraction"
    priority: P0
    key_entities: [HttpOnly cookies, service workers, chrome.cookies API, Manifest V3 restrictions]
    research_questions:
      - "Which credential types (cookies, tokens, headers) can a browser extension access, and what are the Manifest V3 constraints?"
    evidence_density: high
    confidence: high
  - name: "Cross-origin request mechanics"
    priority: P0
    key_entities: [CORS, Origin header, declarativeNetRequest, background service worker fetch]
    research_questions:
      - "How do extensions bypass CORS restrictions, and does Manifest V3 change the available mechanisms?"
    evidence_density: high
    confidence: high
  - name: "SaaS API authentication patterns"
    priority: P0
    key_entities: [cookie-based auth, OAuth tokens, CSRF tokens, API keys, session rotation]
    research_questions:
      - "What percentage of SaaS platforms use cookie auth vs. token auth for their internal APIs?"
    evidence_density: medium
    confidence: medium
  - name: "Security and permission boundaries"
    priority: P1
    key_entities: [host_permissions, activeTab, content security policy, extension review policies]
    research_questions:
      - "What permission scope is needed for arbitrary SaaS domain access, and how does this affect store review?"
    evidence_density: medium
    confidence: high
  - name: "Platform-specific API discovery"
    priority: P1
    key_entities: [undocumented APIs, GraphQL introspection, network tab reverse engineering, HAR files]
    research_questions:
      - "What techniques exist for discovering internal SaaS APIs that aren't publicly documented?"
    evidence_density: low
    confidence: medium
  - name: "Rate limiting and detection avoidance"
    priority: P2
    key_entities: [request fingerprinting, bot detection, rate limits, user-agent spoofing]
    research_questions:
      - "How do SaaS platforms detect non-browser API access, and what signals distinguish extension requests from normal browsing?"
    evidence_density: low
    confidence: low

coverage_gaps:
  - "Legal/ToS implications of programmatic SaaS API access via session proxy"
  - "Multi-account or multi-tenant session management"

terminology:
  - "session proxy"
  - "credential relay"
  - "Manifest V3"
  - "declarativeNetRequest"
```

---

## After emitting the topic map

When invoked standalone (`/ground "topic"`), present the topic map and offer next steps:

> "Here's the topic landscape I discovered. You can:
> - `/research` this topic using the map as a rubric skeleton
> - `/spec` a feature informed by these dimensions
> - `/analyze` the space along these dimensions
> - Refine the map — tell me what's missing or wrong"

When invoked by a consumer skill (the topic map is in conversation context for the consumer to use), emit the topic map and return control. The consumer skill decides what to do with it.

---

## Anti-patterns

| Anti-pattern | What it looks like | Correction |
|---|---|---|
| **Crossing into research** | Evaluating whether claims are true, comparing evidence quality, synthesizing findings into conclusions | Stop. Grounding discovers what exists — it does not evaluate truth. Emit the map and let `/research` do the evaluation. |
| **Re-discovering known context** | Running broad probes when the conversation already has a detailed spec or rubric | Check conversation context first. Focus probes on gaps, not the full topic. |
| **Homogenized probes** | All probes use the same framing: "What are the key aspects of X regarding Y?" | Revisit the probe vocabulary. A broad survey, an entity scan, and a contrarian probe should look nothing alike in query structure. |
| **Over-scoping** | Emitting 10+ dimensions, or P0-tagging everything | Generate broad, then prune sharp. The target is 5-7 dimensions. P0 ≤ 5. If it feels like everything is essential, merge more aggressively. |
| **Under-scoping** | Emitting 2-3 dimensions for a complex topic because early probes converged quickly | Check for gaps. If the topic is genuinely complex, quick convergence may mean the probes were too similar. Try a contrarian or recency probe before concluding. |
| **Polishing the map** | Spending multiple rounds refining dimension labels, rewriting research questions, adjusting confidence levels | Max 2 rounds of self-critique. The map is a starting point for downstream skills, not a deliverable. Emit and move on. |
