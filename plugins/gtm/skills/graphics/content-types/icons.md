# Icons

> **For marketing icon generation, this file supersedes brand-guide.md's Icon Rules section.** Brand guide rules (outline/stroke 1.5px, 20-24px) target UI/navigation icons only. Marketing icons use fill-based hand-drawn brush — per inventory evidence (94% of existing marketing icons are fill-based).

## Foundational principle

> **The container provides "Imperfect" — the content provides "Precision." A standalone icon provides both.**

Icons inside illustration containers (Tier 3) are clean and geometric — the container's hand-drawn quality carries the brand warmth. Standalone icons carry both halves: the hand-drawn brush texture IS the brand signature at icon scale.

---

## Usage context routing

Before making any style decision, determine the context:

| Context | Which rules apply | Style |
|---|---|---|
| **Standalone** (icon IS the deliverable) | This file (`icons.md`) | Hand-drawn brush |
| **Inside illustration container** (icon is Tier 3 content) | `illustration.md` Tier 3 | Clean geometric fills |
| **Inside composed graphic** (icon alongside other elements, not inside a container) | This file + element consistency check (SKILL.md Step 5) | Hand-drawn brush, checked against neighbors |
| **Inside product mockup** | Lucide (per `product.md`) | Stroke-based, inherited colors |

If the icon is inside a hand-drawn illustration container, use `illustration.md` Tier 3 rules — NOT this file. The container already provides the "Imperfect" half.

---

## Icon taxonomy

Three categories. All use hand-drawn brush texture by default.

### Category A: Marketing concept icons

The primary category. Standalone icons for feature grids, capability lists, slide decks.

- **Complexity:** 3-6 elements
- **Grid:** 40×40 viewBox
- **Texture:** Hand-drawn brush with organic edges and variable line weight
- **Exemplars:** `product-icons/ai-chat-sparkle`, `product-icons/docs-writer`, `product-icons/content-marketer`

### Category B: Simplified concept icons

Lighter weight for denser contexts — pricing tables, feature lists, documentation.

- **Complexity:** 1-3 elements
- **Grid:** 40×40 viewBox
- **Texture:** Simplified hand-drawn — same brush quality, less detail
- **Exemplars:** `feature-icons/headset`, `feature-icons/profile`, `feature-icons/content-writer-pen`

### Category C: Hero/feature icons

Large, prominent, primary visual element. Highest complexity.

- **Complexity:** 5-8 elements
- **Grid:** 40×40 viewBox
- **Texture:** Strong brush texture, may use dual-color mode
- **Exemplars:** `use-case-icons/b2b-customer-support`, `product-icons/enterprise`
- **Boundary:** Beyond 8 elements or 3+ colors → route to `illustration.md`

---

## Construction grid

| Property | Value | Rationale |
|---|---|---|
| ViewBox | `0 0 40 40` | Matches existing icon set; brush texture needs resolution headroom |
| Live area | ~34×34 (centered) | ~3px padding on all sides |
| Circle keyline | 34px diameter | Larger than square for optical weight parity |
| Square keyline | 30×30 | Smaller to match circle's perceived weight |
| Rounded-square keyline | 32×32, r≈6px | Between circle and square |

**For icon sets:** use strict keylines — consistency across the set matters more than individual expression.

**For one-off icons:** loose guidance — the hand-drawn style inherently varies, and over-constraining defeats the organic quality.

---

## Color modes

| Mode | Primary fill | Secondary fill | Use when |
|---|---|---|---|
| **Dark** | `#231F20` | `#F9F9F9` | Default on light backgrounds; editorial/neutral contexts |
| **Blue branded** | `#3784FF` | `#D0E1FF` | Highlighted/branded contexts; on cream backgrounds |
| **Blue mono** | `#3784FF` | — | Simple indicators, bullets, single-color contexts |
| **Golden mono** | `#E5AE61` | — | Warm accent contexts (use when warmth suits over blue's coolness — no prescribed semantic meaning) |
| **White** | `#FFFFFF` | — | On dark or blue backgrounds |

All colors hardcoded in SVG (not `currentColor`). In Figma, bind to brand variables.

### Containment pattern

When an icon needs a container (feature grids, pricing tables, badge-like presentation), place on a tinted rounded square:

| Icon color | Container fill | Container radius |
|---|---|---|
| Blue (`#3784FF`) | `#D0E1FF` or `#E3EDFF` at 100% | ~20% of container width |
| Dark (`#231F20`) | `#F9F9F9` at 100% | ~20% of container width |
| Golden (`#E5AE61`) | `#FFE6C2` at 100% | ~20% of container width |

### Opacity

**Containment (existing practice):** Background container at 20% opacity, foreground icon at 100%.

**Internal depth (available, not default):** For icons with internal layering (containers with content, stacked elements), use 15-30% opacity on recessed internal elements. Not required for most icons.

---

## Icon-illustration boundary

| Signal | Classification |
|---|---|
| 1-2 colors | Icon → this file |
| 3+ colors | Illustration → `illustration.md` |
| ≤8 SVG elements | Icon |
| >8 SVG elements | Likely illustration — reconsider |
| Contains within viewBox | Icon |
| Intentionally overflows viewBox | Mini-illustration → `illustration.md` |

---

## Generation workflow

```
1. Check brand assets (icon-set/) → use existing if match found (MANDATORY)
2. Check Lucide → ONLY if inside a product mockup
3. Generate with Quiver → for all custom marketing/concept/hero icons
4. Build in Figma → only for geometric compositions (<3 elements, no brush texture needed)
```

**Step 1 is not optional.** Search `brand/assets/icon-set/` and `tokens/marketing.md` before generating. The existing library has 100+ unique icons — the concept you need may already exist.

---

## Quiver generation

### Three channels — each does one job

- `--prompt` = **WHAT** to draw. Always describe a concrete visual, not an abstract concept. "A shield with a checkmark" — not "trust and security."
- `--instructions` = **HOW** to style it. V1 template below.
- `--references` = What it should **LOOK LIKE**. Recolored exemplar PNGs.

Use `--n 3` instead of 3 separate calls. Same credits, 3x more rate-limit efficient.

### V1 instruction template

```
Icon style. 40x40 viewBox.
Hand-drawn brush texture with organic edges and variable line weight.
Fill-based compound paths (not stroke).
Colors: primary #231F20 dark (dominant, 60-70% of icon area),
accent #3784FF blue (20-30%, secondary elements),
light fill #F9F9F9 (10-20%, interior fills).
No gradients, no shadows.
Simple composition, [ELEMENT_COUNT] elements max.
```

Adjust `[ELEMENT_COUNT]` per category: A → 3-6, B → 1-3, C → 5-8.

Adjust colors per target mode — swap hex values and ratios to match the target palette.

### Reference image workflow

**4 style exemplars by default**, recolored to the target palette before use:

| Key | Icon | Category | Role |
|---|---|---|---|
| **catA** | `product-icons/ai-chat-sparkle` | A | Medium complexity, clean brush |
| **catA_alt** | `product-icons/enterprise` | A | High complexity, heavy brush |
| **catB** | `feature-icons/headset` | B | Minimal, clean, single concept |
| **catC** | `use-case-icons/b2b-customer-support` | C | Heaviest brush, most complex |

**Which refs per category:**

| Category | Refs | Which ones |
|---|---|---|
| **A (marketing) + sets** | 4 same-category | catA + catA_alt + docs-writer + content-marketer |
| **B (simplified)** | 4 Cat B | headset + profile + content-writer-pen + bug |
| **C (hero)** | 2 same-category heavy | catA + catA_alt |
| **One-off (quick)** | 2 mixed | catA + catB |
| **Fallback (no refs)** | 0 | V1 instructions alone produce usable but inconsistent icons |

**Recoloring refs to target palette:**

```bash
# 1. Read exemplar SVG
# 2. Replace hex colors:
sed 's/#231[Ff]20/TARGET_PRIMARY/g; s/#[Ff]9[Ff]9[Ff]9/TARGET_SECONDARY/g; s/#3784[Ff][Ff]/TARGET_PRIMARY/g'
# 3. Render to PNG at 800px via sharp
# 4. Pass as --references to Quiver
```

| Target mode | Primary → | Secondary → |
|---|---|---|
| Dark | `#231F20` | `#F9F9F9` |
| Blue branded | `#3784FF` | `#D0E1FF` |
| Blue mono | `#3784FF` | `#3784FF` |
| Golden mono | `#E5AE61` | `#E5AE61` |
| White | `#FFFFFF` | `#FFFFFF` |

### Critical rules

- **Do NOT add "match exactly" to instructions.** Causes reference subject leakage — sparkle elements from the ai-chat-sparkle reference contaminate unrelated icons.
- **Do NOT skip style instructions even with references.** References alone produce cleaner/more geometric icons. The "hand-drawn brush texture" text in instructions IS doing work. Both channels are necessary.
- **Add color ratio to instructions.** Prevents reference color bleeding (the "battery-going-blue" problem).

---

## Set coherence (6-12 matching icons)

### 5 levers

1. **One brush weight** across the set — generate first icon, match subsequent
2. **One corner treatment** — consistent radius on all rounded shapes
3. **Complexity ceiling** — design the most complex icon first, ensure others don't exceed it
4. **Same abstraction level** — all literal, all symbolic, or all exemplar. Don't mix.
5. **Squint test** — blur the set; no icon should appear notably heavier or lighter

### Reference-chaining protocol

```
Icon 1: 4 category-matched exemplar refs → generate
Icon 2: Icon 1 as reference → generate
Icon 3: Icon 1 + Icon 2 as references → generate
Icon 4: 1 exemplar ref + Icon 3 as references → generate (RE-ANCHOR)
Icon 5: Icon 3 + Icon 4 as references → generate
Icon 6: Icon 4 + Icon 5 as references → generate
Icon 7: 1 exemplar ref + Icon 6 as references → generate (RE-ANCHOR)
...
```

**Re-anchor every 3rd icon** with 1 exemplar ref. Pure sliding window drifts toward geometric over 6+ icons.

Temperature 0.4, `--presence-penalty -0.5` throughout. Same instructions for every icon — only the prompt (subject) changes.

---

## Generation count and evaluation

| Context | n= | Why |
|---|---|---|
| Cat A/B with 4 same-category refs | 3 | Tight conditioning — most samples acceptable |
| Cat C hero (2 heavy refs) | 4-5 | Higher variance in brush weight |
| One-off (2 mixed or no refs) | 3-4 | Moderate variance |
| Chain anchor (icon #1 in a set) | 4-5 | Most important — quality cascades to every subsequent icon |
| Chained icons #2+ | 3 | Strong conditioning from chain refs |

### Evaluation criteria (priority order)

| Priority | Criterion | Common failure modes |
|---|---|---|
| **1. Concept clarity** | Wrong subject, reference contamination, concept too abstract |
| **2. Color compliance** | All-blue (ref bleeding), missing accent, wrong colors |
| **3. Brush texture** | Too geometric (insufficient conditioning), too chaotic (over-textured) |
| **4. Visual weight** | Cat A as heavy as Cat C, Cat C as light as Cat B |
| **5. Composition** | Pushed to corner, excessive empty space, overlapping elements |

### Selection decision tree

```
All n fail concept? → Rewrite the PROMPT (more concrete visual metaphor)
All n fail color?   → Fix INSTRUCTIONS or REFERENCES (color ratio, darker ref)
At least 1 passes #1-4? → Select best. Done.
None pass #1-4? → Regenerate with +0.1 temperature or additional ref (max 2 rounds)
```

**Key insight:** If all samples share the SAME problem, the issue is in the inputs, not stochastic variance. Fix the input, then regenerate.

### Post-set evaluation

1. **Grid comparison** — lay all icons side by side. Do they feel like one family?
2. **Squint test** — blur the grid. Any outlier heavier or lighter?
3. **Outlier fix** — regenerate just the outlier using its neighbors as refs
4. **Chain poison check** — if a mid-set icon is weak, check if icons after it degraded

---

## Naming convention

New icons: **object-based**. Name by what it depicts, not what it means.

- `chat-bubble-sparkle` not `ai-assistant`
- `shield-checkmark` not `build-trust`
- `connected-nodes` not `agent-workflow`

Existing icons keep their current names.

---

## Size classes

| Output context | Recommended display size | Notes |
|---|---|---|
| Slide feature grid | 48-64px | Needs to read at projector distance |
| Marketing page feature list | 40-48px | Standard web icon size |
| Pricing table / dense list | 24-32px | Cat B preferred at this size |
| Hero / feature spotlight | 80-120px | Cat C, or Cat A at 2x |
| Social media graphic | 48-80px | Must read at mobile size |
| Inline documentation | 20-24px | Cat B only — A/C too complex |

---

## Quality bar

### Must-have

- [ ] Correct color mode for the context
- [ ] Hand-drawn brush texture visible (not geometric/clean)
- [ ] Subject recognizable without a label
- [ ] Fill-based paths (not stroke-based)
- [ ] ViewBox is `0 0 40 40`
- [ ] Content within ~34×34 live area (~3px padding)

### Should-have

- [ ] Color ratio follows the 60/20/10 guideline (dominant/accent/fill)
- [ ] No reference subject leakage (sparkle contamination, etc.)
- [ ] Appropriate complexity for the category (A: 3-6, B: 1-3, C: 5-8)

### For sets

- [ ] Squint test passes — no outlier heavier or lighter
- [ ] Consistent brush weight across all icons
- [ ] Same abstraction level throughout

---

## Anti-patterns

| Wrong | Right | Why |
|---|---|---|
| Geometric/clean icons for standalone marketing use | Hand-drawn brush texture | Geometric is for Tier 3 inside illustrations, not standalone |
| Stroke-based 1.5px outline icons | Fill-based brush paths | Brand guide stroke rule is for UI/nav only |
| Abstract concept in prompt ("trust and security") | Concrete visual ("shield with checkmark") | Abstract prompts produce unrecognizable output |
| "Match exactly" in Quiver instructions | Implicit reference conditioning (refs only, no mention in instructions) | "Match exactly" causes subject leakage from reference icons |
| Mixing hand-drawn icons with geometric in one set | One style per set | Breaks visual coherence |
| Using 24×24 viewBox | 40×40 viewBox | Existing set uses 40×40; brush texture needs the resolution |

---

## Cross-references

- **Brand guide** (`brand-guide.md`): Icon Rules section targets UI/navigation context only. For marketing icons, this file takes precedence.
- **Illustration system** (`illustration.md`): Tier 3 rules apply when icons are INSIDE illustration containers. This file applies for standalone icons.
- **Design tokens** (`tokens/marketing.md`): Full color palette, component keys, Figma node IDs.
- **Brand assets** (`brand/assets/icon-set/`): 100+ existing icons. Always check before generating new ones.
