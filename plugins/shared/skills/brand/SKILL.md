---
name: brand
description: Inkeep brand identity — principles, logo rules, typography, color usage, text style rules, size minimums. Background knowledge for visual creation skills (graphics, motion-video, gslides). Loaded automatically by consumer skills.
user-invocable: false
---

# Inkeep Brand

Background knowledge for all visual creation. Consumer skills (`/graphics`, `/motion-video`, `/gslides`) load this for Inkeep-specific brand guidance.

## Brand Principles

1. **Human + AI Collaboration** — Technology feels cooperative and understandable. Visuals emphasize partnership, not replacement.
2. **Developer Clarity** — Structure and readability before decoration. Clear hierarchy, logical organization, precise communication.
3. **Imperfect Precision** — Hand-drawn visuals introduce warmth into technical environments. Slight irregularities create approachability.
4. **Practical Intelligence** — Visuals explain systems and outcomes, not abstract concepts. Every graphic serves a functional purpose.

## Logo Selection

Always lead with the **Primary full-color logo** (icon + wordmark) on light backgrounds. Use the white version on dark backgrounds. Monochrome is a **last resort** — only when backgrounds are too busy for color. Minimum clear space = 1x the icon height on all sides. **Never** distort, rotate, recolor, or add effects to the logo.

## Typography

| Font | Use for | Rules |
|---|---|---|
| **Neue Haas Grotesk Display Pro** | H1, H2, card titles, testimonial quotes | 400 for headings, 300 for descriptions, 500 for interactive |
| **JetBrains Mono** | Tags, eyebrows, buttons, H3, H4 | Always 500, **always uppercase** for UI labels |
| **Noto Serif** | Body copy, descriptions, long-form | 300 for body, 400 for bios |

**Never mix more than 2 typefaces in a single component.**

## Color Usage

- **Page backgrounds** — always warm cream (#FBF9F4). Never use pure white (#FFFFFF) as a page background.
- **Card surfaces** — use cream (#F7F4ED) for contrast against page background
- **Feature cards** — rotate through warm-peach, warm-gray, light-blue, light-purple for visual variety
- **Accent colors** (Golden Sun, Orange Light) — use sparingly, never for primary UI
- **Blue icons on blue backgrounds** — **NEVER**. Blue icons disappear on blue. Use white or dark variants instead.

## Text Style Rules

- **Titles in sentence case** — only first letter capitalized
- **"Agent" always capitalized** — it's a brand term
- **Tagline**: "The Agent Platform for Customer Operations"
- **URL format**: `inkeep.com/path` (no https://)

## Logo & Watermark Timing (video/slides)

- Logo appears in the **first 5 seconds**
- Watermark present in content frames (small icon, reduced opacity, bottom-right)
- Watermark excluded from intro/outro scenes
- Outro logo is large and prominent

## Size Minimums

- **Headlines**: 48px minimum (for readability across mediums)
- **Body text**: 24px minimum

## Deep Reference

Load the reference files relevant to what you're building:

| If your content includes... | Load |
|---|---|
| Any layout or arrangement decisions (almost always) | `references/composition-guide.md` — Z-pattern, split layout, visual hierarchy, color restraint, edge bleed, content coverage, brand system consistency |
| Product mockups, code blocks, badges, metric callouts, logos, quotes, headers, buttons | `references/element-patterns.md` — reusable element recipes with exact brand styling |
| Illustrations, icons, diagrams, or gradient backgrounds | `references/brand-guide.md` — illustration style, icon rules, diagram rules, gradient tiers, decorative elements, what feels dated |
| Product screenshots or UI representations | `references/product-representation.md` — fidelity spectrum (6 levels), decision framework, cleaning-up techniques, brand-product bridging |
| Charts, graphs, or data visualization | `references/data-visualization.md` — data series colors, labeling standards, chart type selection, data integrity rules |
| Animation or motion (video scenes, slide transitions) | `references/motion-philosophy.md` — principles, do's/don'ts, standard motion patterns |
| Marketing website copy (headlines, CTAs, landing pages) | `references/copy-patterns.md` — headline formulas, CTA conventions, value framing hierarchy, use case page patterns |

## Token Values & Assets

All token values and brand assets live in this skill:

- `tokens/marketing.md` — marketing brand tokens (colors, typography, spacing, radius, shadows) from Figma
- `tokens/product.md` — product UI tokens (semantic colors, component variants, canvas tokens) from `agents-manage-ui`
- `tokens/figma.json` — Figma component keys and node IDs (for `importComponentByKeyAsync`)
- `assets/` — SVGO-optimized SVGs and PNGs organized by Figma section hierarchy (`logos/`, `icon-set/`, `illustrations/`, `decorative-and-backgrounds/`, `fonts/`)

**Regeneration** (when Figma or product code changes):
- Marketing tokens + assets: `bun scripts/process-manifest.ts <raw-manifest.json>` (requires Figma export first via `generate-manifest.js`)
- Product tokens: `bun scripts/generate-product-manifest.ts` (fetches from GitHub, no local clone needed)
