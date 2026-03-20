Use when: Delegating visual or text creation to a downstream AI process — subagent, image generation API, evaluation prompt, or any boundary where brand context must cross from one AI to another
Priority: P0
Impact: Downstream process goes off-brand due to missing or degraded brand context. Colors approximate, style drifts, vocabulary mismatches, parallel outputs look inconsistent.

---

# Assembling Brand Context for Downstream AI

When an orchestrating agent delegates work to another AI process (subagent, external API, evaluation model), brand context doesn't flow automatically. The parent agent must explicitly assemble and pass the right brand context for the task. This reference provides the framework for doing that correctly.

**Brand context is one component of a full delegation briefing.** The downstream process also needs task context (what to create), source material (reports, screenshots), output contract (return format), and format constraints (dimensions, platform). Those are covered by the consumer skill's delegation docs (e.g., `graphics-delegation.md`). This file covers the brand component specifically — because it's the one most often missing or degraded at AI boundaries.

**Core principle (from agent information flow research):** Each time information passes through an LLM boundary, fidelity degrades. Pass **original source material** (exact hex values, exact rules) — never summarize brand guidance into vague descriptions. Say `#3784FF` not "brand blue." Say "hand-drawn with organic wobble, no drop shadows" not "Inkeep style."

---

## Step 1: What is the downstream producing?

Determine the output type to identify which brand dimensions are relevant. Only include what matters — irrelevant context wastes the downstream's attention budget.

| Output type | Include | Exclude |
|---|---|---|
| **Illustration / icon** (vector) | Illustration color subset (`#3784FF` linework, `#FFC883` accents, `#231F20` structure, `#EDF3FF` fills), style description (hand-drawn technical, organic wobble, line weight variation), negative constraints (no photorealistic, no gradients, no drop shadows), reference images | Typography, spacing tokens, radius tokens, animation, messaging |
| **Photorealistic / 3D image** (raster) | Background/accent hex values (`#FBF9F4`, `#3784FF`, `#FFC883`), material/lighting keywords (clean, modern, professional, studio lighting), negative constraints (no text in image), reference images | Illustration style (wrong medium), typography (forbidden in image gen), composition guide |
| **Text content** (headlines, descriptions, CTAs) | Brand vocabulary table, messaging principles, emotional territory (trust/control), tone rules, text style rules (sentence case, "Agent" capitalized) | Color palette, illustration style, spacing tokens |
| **Full composition** (complete graphic, slide, video scene) | Everything — full brand identity via `/brand` skill loading + relevant reference files | Nothing excluded — full compositions need comprehensive brand context |
| **Evaluation / judgment** (is this on-brand?) | Expected values to check against: color palette with per-token usage, size minimums, any programmatic results from prior checks | Creation guidance (how to build things) — evaluators judge, they don't create |
| **Audio** (voiceover, sound) | Voice selection parameters, tone descriptors (warm, professional, conversational), pronunciation of brand terms ("Inkeep", "Agent") | Visual brand context |

---

## Step 2: What type of boundary is it?

The delivery mechanism determines how brand context is packaged.

### Claude subagent (has Skill tool)

The subagent can load `/brand` itself — this is the highest-fidelity path because it loads original source material with zero degradation.

**Assembly:**
```
1. Instruct: "Load `/brand` and load any reference files relevant to your task
   following the skill's reference loading guidance."
2. Add task-specific overrides that /brand doesn't know about:
   - Series brief (if parallel — see Step 3)
   - Prospect/customer brand context (company name, domain, where their brand appears)
   - Format constraints (target dimensions, platform requirements)
   - Slide master context (what the layout already provides — don't duplicate)
3. Add content specifics (what to create, key message, audience)
4. Add source material (paths to reports, docs, screenshots — pass originals, not summaries)
```

**Key rule:** Don't summarize `/brand` content in the subagent prompt — let the subagent load the skill directly. Summaries degrade; skill loading preserves.

### External LLM API (Quiver, GPT Image, Gemini, etc.)

Cannot load skills. Gets only what you put in the prompt/parameters. This is the highest-risk boundary.

**Assembly:**
```
1. Compile exact hex values from the brand palette — use the specific subset
   relevant to this output type (see Step 1)
2. Write style keywords as concrete descriptors, not brand jargon:
   ✓ "hand-drawn technical illustration with slight stroke irregularity"
   ✗ "Inkeep illustration style"
3. Write negative constraints explicitly:
   ✓ "No drop shadows. No gradients. No photorealistic elements. No text."
   ✗ "Follow brand guidelines"
4. Attach reference images when the API supports them (see "Reference image
   selection" below) — existing brand assets are the strongest style anchor
5. Use the API's structured channels when available:
   - Quiver: --instructions (persistent constraints) vs --prompt (this-image-specific)
   - GPT Image: edit endpoint with reference image
   - Gemini: inlineData for reference images alongside text prompt
```

**Key rule:** Hex codes, not token names. Style descriptions, not skill references. The API has no context beyond what's in this call.

### Reference image selection

Reference images are the highest-fidelity brand signal you can pass to an external API — more reliable than text descriptions of style. Pick the right reference based on what you're generating:

| Output type | Best reference source | Where to find it |
|---|---|---|
| **Illustration** | An existing illustration from the same category (use-case, product, security) | `assets/illustrations/` or export from Figma Brand Assets → Illustrations section |
| **Icon set** | An existing icon from the same set or visual family | `assets/icon-set/` |
| **3D render** | An existing 3D render, dark-tile asset, or prior generated 3D output | Export from Figma or reuse from prior generation in this session |
| **Photorealistic image** | An existing product mockup or brand photo | Export from Figma Brand Assets → UI Elements section |
| **Background/texture** | An existing gradient or decorative background | `assets/decorative-and-backgrounds/` |

**Compounding consistency:** When generating multiple assets in the same style (e.g., an icon set of 4 icons), generate the first one, then use it as the reference for all subsequent ones. Each generation anchors to the previous output, compounding style consistency across the set. For icon set generation specifically, see `graphics` skill `content-types/icons.md` for the validated reference-chaining protocol (sliding window with re-anchoring every 3rd icon).

**Sizing:** Export reference images at 768-1024px on the longest edge. Too small loses detail; too large wastes tokens. PNG format for all references.

### Evaluation prompt (Claude subagent or Gemini)

The evaluator needs to know what "on-brand" means for THIS specific output, not how to create brand-compliant work.

**Assembly:**
```
1. Include the expected brand values as a lookup table:
   - Color palette with hex values AND expected usage per token
   - Size minimums (48px headlines, 24px body)
   - Any format-specific requirements (1080x1080 for LinkedIn, etc.)
2. Include results from prior verification layers (programmatic color sampling,
   lint results) as grounding context
3. Do NOT include creation guidance (composition patterns, element recipes,
   illustration style) — the evaluator judges output, it doesn't create it
```

### Deterministic tool (Figma MCP, R3F, Google Slides MCP)

No brand packet needed. The parent agent writes code that references brand tokens directly. Brand enforcement is in the agent's code generation, not in the tool.

**Verification:** Use post-execution checks (`figma_lint_design`, `brand:audit`, color sampling) to catch any tokens the agent missed.

---

## Step 3: Is this one of many parallel outputs?

When multiple downstream processes produce assets for the same project, they must look like they came from one designer. Without coordination, each process makes independent style decisions that may conflict.

### Series brief (required for parallel outputs)

Before spawning any parallel subagents, the parent agent locks these visual constants and passes the **identical brief** to every subagent:

| Decision | What to lock | How to choose |
|---|---|---|
| **Background treatment** | Warm cream / dark / white | Match the project's overall palette — warm cream is the brand default |
| **Illustration style** | Hand-drawn (dual-stroke) / abstract geometric / photorealistic / none | Use hand-drawn when any asset needs a conceptual illustration; "none" if all assets are diagrams or mockups |
| **Accent color** | One hex from the brand card palette | Use the SAME accent across all assets — don't rotate per-asset |
| **Visual density** | Sparse / moderate / dense | Match the project's tone — sales content is typically sparse to moderate |
| **Logo variant** | Primary / icon-only / none | Match what the surrounding layout uses — don't mix variants |

**Why this works:** Each subagent loads `/brand` independently for the full brand system, then applies the series brief as project-specific overrides. The brand skill provides the foundation; the series brief provides the coordination layer.

### Single output

No series brief needed. Standard brand context (Step 1 + Step 2) is sufficient.

### Evaluation of existing output

Pass the **same brand context the creator had** so the evaluator judges against the same standard. If the creator got a series brief, the evaluator should know about it too.

---

## Step 4: Verify after every boundary crossing

Every visual output that crosses a brand boundary should be verified before being used in the final composition. The verification strategy depends on the boundary type:

| Boundary | Verification |
|---|---|
| Claude subagent | Review the returned asset visually (screenshot). Check the subagent's return packet for any noted issues. |
| External image API | Verify hex colors in the output (for SVG: grep hex values in source; for raster: visual review in composition). The hybrid workflow (API → Figma) provides a natural verification point. |
| Evaluation API | Check that the evaluator's scoring dimensions cover brand compliance. If scores are low, fix and re-evaluate. |
| Deterministic tool | Run post-execution lint (`figma_lint_design`, `brand:audit`). These catch what visual review might miss. |

**If verification fails:** Fix the specific issue and re-run the downstream process. Do not proceed with off-brand output — it compounds through the rest of the pipeline.

---

## Quick reference: common delegation scenarios

| Scenario | Output type | Boundary | Series brief? | Key brand context |
|---|---|---|---|---|
| Blog cover illustration via Quiver | Illustration | External API | No | Illustration colors, style description, negative constraints, 2-3 reference PNGs |
| 3D hero image via GPT Image | Photorealistic | External API | No | Background/accent hex values, material keywords, "no text in image", reference images |
| 4 scene icons for a video | Illustration | Claude subagent ×4 | **Yes** | "Load /brand" + series brief (locked background, style, accent, density) |
| Sales deck visuals | Full composition | Claude subagent ×N | **Yes** | "Load /brand" + series brief + prospect brand context |
| Layer 2 frame evaluation | Evaluation | Claude subagent | No | Brand color table with expected usage, size minimums, Layer 1 results |
| Video voiceover | Audio | External API | No | Voice selection params, tone (warm, professional, conversational) |
