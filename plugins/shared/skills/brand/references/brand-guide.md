Use when: Creating any visual that needs Inkeep identity guidance beyond the compact rules in SKILL.md
Priority: P0
Impact: Off-brand illustrations, wrong icon style, misused gradients, dated-looking graphics

---

# Brand Guide

Full Inkeep visual identity guidance. For compact essentials, see SKILL.md. For exact token values, see `.claude/design-system/manifest.md`.

## Logo Rules

| Context | Use this variant | Token path |
|---|---|---|
| Standard use on light backgrounds | **Primary** (full-color icon + wordmark) — always lead with this | `logo/full-color` |
| Dark backgrounds | **Secondary** (white version) | `logo/white` |
| Busy/pattern backgrounds | **Monochrome** — last resort only | `logo/black` or `logo/white` |
| App icons, favicons, avatars | **Icon only** | `logo/icon/color` |

**Rules:**
- Always lead with the Primary full-color logo — it's the default
- Monochrome is a **last resort** — only when backgrounds are too busy for color
- Minimum clear space = 1x the icon height on all sides
- **Never** distort, rotate, recolor, or add effects to the logo

---

## Color Usage Rules

Beyond token values, these rules govern **how** colors are applied:

- **Page backgrounds** — always `bg/primary` (#FBF9F4). Never use pure white (#FFFFFF) as a page background.
- **Card surfaces** — use `bg/surface` (#F7F4ED) with `mix-blend-darken` for the signature warm card look
- **Feature card backgrounds** — rotate through `card/warm-peach`, `card/warm-gray`, `card/light-blue`, `card/light-purple` for visual variety in grids
- **Developer sections** — use `brand/accent-cool` (Purple Light) as the accent instead of Golden Sun
- **Accent colors** (Golden Sun, Orange Light) — use sparingly, never for primary UI
- **Blue icons on blue backgrounds** — **NEVER**. Blue icons disappear on blue backgrounds. Use white or dark icon variants instead.
- **Gradients** are subtle — testimonial cards use `linear-gradient(248deg, #F3EDFE → #DCF2FB)`

---

## Typography Rules

### Font assignments (strict)

| Font | Use for | Weight rules | Special rules |
|---|---|---|---|
| **Neue Haas Grotesk Display Pro** | H1, H2, card titles, testimonial quotes | 400 for headings, 300 for descriptions, 500 for interactive/FAQ | — |
| **JetBrains Mono** | Tags, eyebrows, buttons, H3, H4 | Always 500 | **Always uppercase** for UI labels |
| **Noto Serif** | Body copy, descriptions, long-form | 300 for body, 400 for bios | — |

**Never mix more than 2 typefaces in a single component.**

### Voice & tone for text in graphics

When generating text content (headlines, labels, CTAs):
- **Hero headlines:** Short, impactful, in Neue Haas. Action-oriented.
- **Tags/eyebrows:** Uppercase category labels in JetBrains Mono (e.g., "INTEGRATIONS", "USE CASES")
- **Body descriptions:** Warm, explanatory in Noto Serif. Human-first language.
- **Button labels:** Imperative, concise, uppercase JetBrains Mono (e.g., "GET A DEMO →", "START BUILDING")
- **Tone:** Clear and direct, confident but not aggressive, human-first

---

## Illustration Style

### Primary style: Hand-drawn technical

- **Slightly irregular strokes** — hand-drawn feel, avoid perfectly geometric shapes
- **Organic wobble** on geometric forms
- **Line weight varies** for depth — no drop shadows
- **Colors:** Primary linework in `brand/primary` (#3784FF), accents in `brand/golden-sun` (#FFC883), structure in `text/primary` (#231F20)
- **Fills:** `illustration/wash-blue` (#EDF3FF) or `brand/crystal-blue` (#D5E5FF)
- **Composition:** One clear focal point, generous whitespace, diagonal arrangements for energy

### Isometric variant (secondary — use sparingly)

- Maintain hand-drawn line quality even in isometric
- Keep shadows extremely soft or none
- Azure Blue as primary line color
- Used only for: product diagrams, dashboards, storytelling visuals
- **Do NOT overuse** — this is secondary to the hand-drawn style

---

## Diagram Rules

When building workflow diagrams, architecture diagrams, or flow charts:

- **Arrow style:** Simple line + triangle head. Azure Blue for primary flows, gray for secondary.
- **Node labels:** JetBrains Mono, 12-14px, 1-3 words max
- **Flow direction:** Left-to-right OR top-to-bottom. **Never mix within one diagram.**
- **Decision points:** Azure Blue for primary paths, Golden Sun for alternatives
- **Nodes:** Rounded rectangles, hand-drawn strokes, Azure Blue borders, white or Crystal Blue fill
- **Connectors:** At least one clean 90-degree bend — no diagonal spaghetti
- **Spacing:** Minimum 20px between nodes
- **Limit:** Max 8-10 nodes per diagram for clarity

---

## Icon Rules

- **Scale:** 20-24px typical, consistent within each set
- **Stroke weight:** 1.5px recommended
- **Style:** Outline/stroke-based — never mix filled and outline arbitrarily
- **Color:** `brand/primary` for primary icon color, `text/primary` for neutral icons
- **Always pair icons with labels** in navigation — never replace text with icons alone
- **Blue icons on blue backgrounds lose contrast** — use dark or white variants on blue/gradient backgrounds

---

## Gradient Backgrounds

30 pre-designed gradient backgrounds exist in the brand system assets (1920x1080 PNG).

| Tier | Range | Description | Text contrast |
|---|---|---|---|
| Deep | 01-08 | Saturated Azure Blue | Requires white/light text |
| Medium | 09-15 | Blue-to-white transitions | Test contrast case by case |
| Textured | 16-22 | Mixed intensity with grain | Varies |
| Light | 23-30 | Soft, airy blue-white | Standard dark text works |

**Rules:** Use as full-bleed backgrounds with cover mode. Layer content over them — don't place dense text directly on them. Never tile or repeat.

---

## Decorative Elements

Available hand-drawn decorative SVG assets (check the Brand Assets page Decorative & Backgrounds section, or the brand system `assets/illustrations/decorative/` directory):

- **Line separators** — thin Azure Blue lines
- **Emphasis marks** — hand-drawn dashes, underlines, markers
- **Connector dots** — dotted lines for process steps
- **Quote marks** — stylized blue quote marks for testimonials
- **Arrow accents** — hand-drawn decorative arrows
- **Background circles** — overlapping circle patterns

Check for these before creating decorative elements from scratch.

---

## What Feels Dated

Avoid these — they signal "2022 design" and undermine brand credibility:

- Flat gradients without texture or dimension
- Clip art or generic vector illustrations
- Heavy text overlays with 3+ font sizes
- Bright, saturated color backgrounds without visual depth
- Overly decorated graphics with borders, frames, and multiple elements competing
