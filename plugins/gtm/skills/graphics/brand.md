Use when: Planning any graphic composition (always loaded)
Priority: P0
Impact: Off-brand design — wrong colors, fonts, proportions, patterns, asset navigation

---

# Brand Guide

This reference captures the **rules and principles** from Inkeep's brand system — the qualitative guidance that tokens alone don't provide. For exact token values (hex colors, spacing px, radius px), see the Brand Tokens section below.

## Brand Principles

Every design decision should reflect these four principles:

1. **Human + AI Collaboration** — Technology feels cooperative and understandable. Visuals emphasize partnership, not replacement.
2. **Developer Clarity** — Structure and readability before decoration. Clear hierarchy, logical organization, precise communication.
3. **Imperfect Precision** — Hand-drawn visuals introduce warmth into technical environments. Slight irregularities create approachability.
4. **Practical Intelligence** — Visuals explain systems and outcomes, not abstract concepts. Every graphic serves a functional purpose.

---

## Logo Selection Rules

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

## Section Header Pattern

The most-used layout pattern. Every page section opens with this:

```
TAG (JetBrains Mono, 16px, uppercase, brand/primary)
  ↕ 20px gap (always)
HEADING (Neue Haas, 64px, weight 400)
  ↕ 20px gap (always)
DESCRIPTION (Noto Serif, 20px, weight 300, text/muted)
  ↕ 20px gap (always)
[BUTTON 1]  [BUTTON 2] (gap: 24px between buttons)
```

- **Fixed 20px gap** between all children — never varies
- Left-aligned heading max-width: 886px
- Center-aligned description max-width: 768px

---

## Button Variants

| Variant | Background | Text | Radius | When to use |
|---|---|---|---|---|
| **primary** | `brand/primary` | White | pill | Main CTA — "GET A DEMO" |
| **primary-light** | `brand/crystal-blue` | `text/dark-blue` | pill | Secondary CTA on light bg |
| **secondary** | `surface/cream-alt` | `text/primary` + border | pill | Alternative action |
| **tertiary** | `surface/cream-alt` | `text/primary` + border | 10px | Compact alternative |
| **outline** | Transparent | `brand/primary` + border | default | Text-focused action |
| **minimal** | None | `text/primary` | none | Inline link-style |

All buttons use **JetBrains Mono, uppercase, weight 500**.

---

## Integration Logo Card Pattern

When displaying integration/partner logos in a grid:
- Each logo in a rounded card with `radius/integration` (11px)
- Soft pastel background by category:
  - `card/warm-peach` — CMS/content platforms
  - `card/lavender` — support/helpdesk platforms
  - `card/soft-blue` — documentation platforms
  - `card/ice-blue` — knowledge base/data sources
- Logos rendered in dark monochrome (not grayscale filter)
- 4-column grid per row

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

### When generating illustrations via Quiver

Include these style rules in the `--instructions` parameter:
```
Style: hand-drawn technical illustration with slight stroke irregularity.
Primary linework: #3784FF (Azure Blue). Accent: #FFC883 (Golden Sun).
Structure/detail: #231F20. Fill areas: #EDF3FF (light blue wash).
No drop shadows. Depth via line weight variation only.
One clear focal point. Generous whitespace. No photorealistic elements.
```

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

30 pre-designed gradient backgrounds exist in the brand system assets (1920x1080 PNG). When using these as image fills in a working canvas (e.g., 1280×720), import the PNG and set as an image fill with `scaleMode: 'FILL'` — it will scale to fit the frame and export cleanly at any scale.

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

# Brand Tokens

## Token Source

The canonical design tokens are **Figma variables** in the Inkeep Design Assets file (`D7NDSM2peo1iLhkjLxmGP5`). The tokens are organized into 5 collections. Always look up current values dynamically via `figma.variables.getLocalVariablesAsync()` — the tables below are reference guides, not exhaustive inventories.

**To discover all available tokens:**
```javascript
// List all token collections and their variables
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
for (const c of collections) {
  const collVars = vars.filter(v => v.variableCollectionId === c.id);
  console.log(`${c.name}: ${collVars.map(v => v.name).join(', ')}`);
}
```

---

## 1. Inkeep Colors

### Core palette

| Token | Hex | When to use |
|---|---|---|
| `bg/primary` | `#FBF9F4` | **Default page background.** Warm cream. Never use pure white (#FFFFFF) as page bg. |
| `bg/surface` | `#F7F4ED` | Card and panel surfaces — provides contrast against page background |
| `text/primary` | `#231F20` | Headings, primary body text (Night Sky) |
| `text/muted` | `#5F5C62` | Secondary text, captions, descriptions |
| `text/dark-blue` | `#29325C` | Dark text on light blue backgrounds |
| `brand/primary` | `#3784FF` | CTAs, links, accents, interactive elements (Azure Blue) |
| `brand/golden-sun` | `#FFC883` | Primary warm accent — badges, highlights, decorative elements |
| `brand/accent-warm` | `#FBE1BC` | Light orange highlight, warm badges |
| `brand/accent-cool` | `#E1DBFF` | Purple highlight, cool badges |
| `brand/sky-blue` | `#69A3FF` | Hover states, secondary blue elements |
| `brand/crystal-blue` | `#D5E5FF` | Subtle highlights, button backgrounds |
| `brand/lavender-blue` | `#D0E1FF` | Decorative backgrounds |

### Surface colors

| Token | Hex | When to use |
|---|---|---|
| `surface/white` | `#FFFFFF` | Cards on colored backgrounds, overlays, modals. **NEVER use as page background.** |
| `surface/dark` | `#231F20` | Dark mode sections, dark card backgrounds |
| `surface/cream-alt` | `#FFF5E1` | Secondary buttons, tertiary elements |
| `surface/gray-medium` | `#BDBDBD` | Disabled states, dividers, borders |

### Card background palette

Use these for card backgrounds to create visual variety across grids. Rotate through them for feature cards and integration cards.

| Token | Hex | When to use |
|---|---|---|
| `card/warm-peach` | `#FFE8CF` | Feature cards — warm peach accent |
| `card/warm-gray` | `#F0ECE3` | Feature cards — neutral warm gray |
| `card/light-blue` | `#DCE8FA` | Feature cards — light blue accent |
| `card/light-purple` | `#ECE7FB` | Feature cards — light purple accent |
| `card/lavender` | `#E9DCFA` | Integration cards — support/helpdesk platforms |
| `card/soft-blue` | `#DAE6FE` | Integration cards — documentation/ticketing |
| `card/ice-blue` | `#DCF2FB` | Integration cards — knowledge base/data sources |

### Utility colors

| Token | Hex | When to use |
|---|---|---|
| `illustration/wash-blue` | `#EDF3FF` | Light blue wash for illustration fill areas |
| `gradient/purple-start` | `#F3EDFE` | Testimonial gradient start color |
| `ui/pink-false` | `#F472B6` | Comparison table "no" indicator |
| `ui/icon-gray` | `#676566` | Close/dismiss icon color |

---

## 2. Inkeep Typography

### Font family rules (strict)

| Font | Token | Use for | Style rules |
|---|---|---|---|
| **Neue Haas Grotesk Display Pro** | `font/family-primary` | Headings (H1, H2), card titles, testimonial quotes | Weight 400 for headings, 300 for descriptions, 500 for interactive/FAQ text |
| **JetBrains Mono** | `font/family-mono` | Labels, tags, buttons, eyebrows, H3/H4 subtitles | **Always weight 500, always uppercase** for UI labels |
| **Noto Serif** | `font/family-serif` | Body copy, descriptions, carousel card text | Weight 300 for body, 400 for bios |
| Geist Sans | `font/family-system` | Utility/fallback | Only when brand fonts unavailable |
| Geist Mono | `font/family-system-mono` | Code blocks fallback | Only when JetBrains Mono unavailable |

**Rule: Never mix more than 2 typefaces in a single component.**

### Typography scale

| Element | Font | Size token | Weight token | Tracking token | Leading token |
|---|---|---|---|---|---|
| Hero H1 | Neue Haas | `font/size-hero` (80px) | `font/weight-heading` (400) | `font/tracking-heading` (-0.64) | `font/leading-tight` (95%) |
| Section H2 | Neue Haas | `font/size-section` (64px) | `font/weight-heading` (400) | `font/tracking-heading` (-0.64) | `font/leading-tight` (95%) |
| Card Title | Neue Haas | `font/size-card-title` (40px) | `font/weight-heading` (400) | `font/tracking-card` (-0.4) | `font/leading-heading` (115%) |
| Testimonial Quote | Neue Haas | `font/size-quote` (32px) | `font/weight-heading` (400) | `font/tracking-quote` (-0.36) | `font/leading-quote` (127%) |
| Subtitle H3 | JetBrains Mono | `font/size-subtitle` (28px) | `font/weight-mono` (500) | `font/tracking-mono` (-0.96) | `font/leading-heading` (115%) |
| Subtitle H4 | JetBrains Mono | `font/size-subtitle-sm` (20px) | `font/weight-mono` (500) | `font/tracking-mono` (-0.96) | `font/leading-heading` (115%) |
| Tag / Eyebrow | JetBrains Mono | `font/size-md` (16px) | `font/weight-mono` (500) | `font/tracking-mono` (-0.96) | `font/leading-heading` (115%) |
| Body Text | Noto Serif | `font/size-body` (20px) | `font/weight-body-light` (300) | `font/tracking-card` (-0.4) | `font/leading-body` (125%) |
| Small Body | Noto Serif | `font/size-md` (16px) | `font/weight-body-light` (300) | `font/tracking-body-sm` (-0.28) | `font/leading-body` (125%) |

---

## 3. Inkeep Spacing

### Base scale (use for component internals)

| Token | Value | When to use |
|---|---|---|
| `spacing/xs` | 4px | Icon-to-label gaps, tight internal spacing |
| `spacing/sm` | 8px | Compact component padding |
| `spacing/md` | 16px | Standard card padding, element gaps |
| `spacing/lg` | 24px | Between content blocks within a section |
| `spacing/xl` | 32px | Between distinct components |
| `spacing/xxl` | 48px | Component gap medium |

### Contextual spacing (use for page layout)

| Token | Value | When to use |
|---|---|---|
| `spacing/component-gap-tight` | 20px | Tight gap between related components |
| `spacing/page-padding-desktop` | 44px | Horizontal page padding on desktop |
| `spacing/section-to-content-sm` | 64px | Small gap from section header to content |
| `spacing/component-gap-large` | 80px | Large gap between components, section-to-content medium |
| `spacing/section-to-content-lg` | 96px | Large gap from section header to content |
| `spacing/section-gap` | 100px | Gap between major page sections |
| `spacing/section-padding-lg` | 112px | Large section vertical padding |
| `spacing/hero-top-desktop` | 110px | Hero section top padding (desktop) |
| `spacing/hero-top-mobile` | 140px | Hero section top padding (mobile) |
| `spacing/page-max-width` | 1280px | Maximum content width |

---

## 4. Inkeep Radius

The brand's signature aesthetic uses **large rounded corners** on cards and containers.

| Token | Value | When to use |
|---|---|---|
| `radius/micro` | 2px | Dots, micro indicators |
| `radius/3xs` | 5px | Small indicators |
| `radius/2xs` | 6px | Code blocks, form elements |
| `radius/sm` | 4px | Subtle rounding, tags |
| `radius/md` | 8px | Default cards, buttons |
| `radius/xs-alt` | 10px | Tertiary buttons, comparison table |
| `radius/integration` | 11px | Integration logo cards |
| `radius/sm-alt` | 12px | Images, general containers |
| `radius/lg` | 16px | Standard cards, modals |
| `radius/md-alt` | 20px | Medium cards, containers |
| `radius/xl` | 24px | Hero elements |
| `radius/lg-alt` | 32px | **Feature cards** — signature large rounding |
| `radius/xl-alt` | 36px | Tab containers |
| `radius/2xl` | 47px | Use case cards |
| `radius/3xl` | 54px | Large cards, feature boxes |
| `radius/4xl` | 60px | Hero badges |
| `radius/5xl` | 80px | Large header elements |
| `radius/pill` | 9999px | Pills, fully rounded badges, buttons |

---

## 5. Inkeep Shadows

| Token | CSS value | When to use |
|---|---|---|
| `shadow/subtle` | `0 4px 18.4px 0 rgba(0,0,0,0.04)` | Cards at rest, form containers |
| `shadow/medium` | `0 8px 30px 0 rgba(0,0,0,0.08)` | Card hover states |
| `shadow/heavy` | `0 8px 32px 0 rgba(0,0,0,0.08)` | Sticky header, comparison table |
| `shadow/brand` | `5px 6px 18px 0 rgba(157,194,255,0.20)` | Header shadow, chat button rest — blue-tinted glow |
| `shadow/brand-hover` | `6px 8px 22px rgba(157,194,255,0.24), 0 10px 36px rgba(0,0,0,0.10)` | Chat button hover — intensified blue glow |
| `shadow/modal` | `0 5.02px 23.091px 0 rgba(0,0,0,0.04)` | Modal and dialog containers |
| `shadow/dropdown` | `0 10px 40px rgba(0,0,0,0.08)` | Dropdown menus, navigation flyouts |
| `shadow/focus` | `0 0 0 2px #FFFFFF, 0 0 0 4px #69A3FF` | Accessibility focus ring |
| `shadow/value-card` | `0px 4px 4px rgba(0,0,0,0.25)` | Value cards on dark backgrounds |

---

## Common Design Patterns

These patterns combine tokens for the most frequently created graphic elements.

### Feature Card
- **Background:** Rotate through `card/warm-peach`, `card/warm-gray`, `card/light-blue`, `card/light-purple`
- **Radius:** `radius/lg-alt` (32px)
- **Shadow:** `shadow/subtle` at rest, `shadow/medium` on hover
- **Title:** Neue Haas, `font/size-card-title` (40px), weight 400
- **Body:** Noto Serif, `font/size-md` (16px), weight 300
- **Padding:** `spacing/lg` (24px)

### Testimonial Section
- **Background:** Gradient from `gradient/purple-start` (#F3EDFE) to `card/ice-blue` (#DCF2FB) at 248deg
- **Quote:** Neue Haas, `font/size-quote` (32px), weight 400, tracking -0.36, leading 127%
- **Author:** JetBrains Mono, `font/size-md` (16px), weight 500, uppercase
- **Radius:** `radius/lg` (16px)

### Hero Section
- **Background:** `bg/primary` (#FBF9F4)
- **H1:** Neue Haas, `font/size-hero` (80px), weight 400, tracking -0.64, leading 95%
- **Subtitle:** Noto Serif, `font/size-body` (20px), weight 300
- **Top padding:** `spacing/hero-top-desktop` (110px)
- **CTA button:** `brand/primary` fill, `radius/pill`, JetBrains Mono uppercase 16px

### Section Header (most-used pattern)
- **Tag/eyebrow:** JetBrains Mono, 16px, weight 500, uppercase, `brand/primary` color
- **Heading:** Neue Haas, `font/size-section` (64px), weight 400
- **Description:** Noto Serif, `font/size-body` (20px), weight 300, `text/muted` color
- **Gap between children:** 20px (fixed, always)

### Value Card (dark background)
- **Background:** `surface/dark` (#231F20)
- **Shadow:** `shadow/value-card`
- **Number label:** JetBrains Mono, `brand/primary` color
- **Icon container:** `card/ice-blue` bg, `radius/xs-alt` (10px)
- **Title:** Neue Haas, white, weight 400
- **Body:** Noto Serif, white at 70% opacity, weight 300

---

## Applying tokens in Figma

### Bind fills to color variables (preferred — passes `figma_lint_design`)
```javascript
const vars = await figma.variables.getLocalVariablesAsync('COLOR');
const token = vars.find(v => v.name === 'brand/primary');
const rect = figma.createRectangle();
rect.fills = [figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1 } },
  'color',
  token
)];
```

### Hardcoded hex fallback (when variables unavailable — will trigger `figma_lint_design` warning)
```
figma_set_fills: nodeId + hex color (e.g., "#FBF9F4", "#3784FF")
```

### Typography
```javascript
await figma.loadFontAsync({ family: "Neue Haas Grotesk Display Pro", style: "45 Light" });
text.fontName = { family: "Neue Haas Grotesk Display Pro", style: "45 Light" };
text.fontSize = 64;
text.letterSpacing = { value: -0.64, unit: "PIXELS" };
text.lineHeight = { value: 95, unit: "PERCENT" };
text.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }]; // text/primary
```

### Shadows (apply via effects array)
```javascript
node.effects = [{
  type: "DROP_SHADOW",
  color: { r: 0, g: 0, b: 0, a: 0.04 },
  offset: { x: 0, y: 4 },
  radius: 18.4,
  spread: 0,
  visible: true,
  blendMode: "NORMAL"
}]; // shadow/subtle
```

---

## Applying tokens in code (SVG, Quiver, GPT Image)

### SVG / Quiver `--instructions`
```
Brand colors: background #FBF9F4, primary blue #3784FF, text #231F20, accent #FFC883
Style: clean, minimal. No gradients unless specified.
```

### GPT Image prompt
```
Warm cream background (#FBF9F4), blue accents (#3784FF), golden highlights (#FFC883).
Clean, modern, minimal aesthetic. Professional studio lighting.
```

### Illustration style
- Primary linework: `brand/primary` (#3784FF)
- Accent: `brand/golden-sun` (#FFC883)
- Structure: `text/primary` (#231F20)
- Fill areas: `illustration/wash-blue` (#EDF3FF) or `brand/crystal-blue` (#D5E5FF)
- Hand-drawn with slight irregularity, no shadows, depth via line weight variation

---

# Artifact Recipes

Reusable visual element recipes that apply across all output formats. Each recipe describes **design intent, proportions, and brand rules** — not Figma implementation code. For Figma code patterns, see `tools/figma-console.md`.

**Adapt proportions to your target format.** These recipes were refined at blog-cover scale (1280×720 working canvas, exported at 2x to 2560×1440) but the principles apply to any format. Scale element sizes and spacing proportionally to your canvas dimensions.

---

## Product mockup treatment

When showing product UI in any graphic:

1. **Float the panel** — slight rotation (2-5°) or perspective adds depth
2. **Make it large** — the mockup should fill 50-60% of the canvas, not sit as a small card in the corner
3. **Let it bleed** — extend past the right and/or bottom edge of the frame. This creates energy and implies "there's more to explore"
4. **Brand shadow** — use `shadow/brand` (blue-tinted glow: `5px 6px 18px rgba(157,194,255,0.20)`) for the Inkeep signature look
5. **Rounded corners** — `radius/lg-alt` (32px) matches the brand's soft, approachable aesthetic
6. **Simplify the UI** — show only the most compelling part (one conversation thread, one dashboard metric), not the full interface
7. **Overlapping panels** — for multi-feature posts, layer 2-3 panels at different depths (Dub.co technique)

**Never use raw product screenshots.** Always stylize — float, angle, add shadow, round corners.

---

## Product-as-marketing

Real product screenshot with minimal chrome — the product IS the message. No headline overlay, no marketing copy. The interface speaks for itself.

**When to use:** Only when the product UI is genuinely well-designed and the visual is self-explanatory. The top-performing brands (Figma, Dub.co, Mercury, Notion) all use this technique — letting the product dominate 70%+ of the canvas.

**Design rules:**
- Style lightly — float, brand shadow, rounded corners — but don't add marketing overlays
- Product should dominate **70%+ of the canvas**
- No headline text overlay on the product screenshot
- Minimal chrome: remove browser bars, notification badges, anything that clutters
- Works best for: dashboards showing impressive data, agent conversations with approve/deny flows, visual builders with completed workflows

**Key distinction from product mockup treatment:** Product mockup (above) stylizes UI as a *supporting element* alongside a headline. Product-as-marketing makes the UI *the entire message* — the product replaces the headline.

Technique inspired by Figma, Dub.co, Mercury, and Notion blog covers.

---

## Code-as-visual

Syntax-highlighted code snippet used as a **design element**, not meant to be fully read. Signals "developer content" at card sizes.

**When to use:** Technical content, API announcements, SDK features, developer-focused posts.

**Design rules:**
- Show **3-8 lines** of the "money line" of the API — the most compelling snippet (`new InkeepAgent({...})`, SDK initialization, MCP server config)
- Brand-colored syntax highlighting:
  - `brand/primary` (#3784FF) for keywords
  - `brand/golden-sun` (#FFC883) for strings
  - `text/primary` (#231F20) for identifiers
  - `text/muted` (#5F5C62) for comments
- Font: JetBrains Mono, weight 400
- Background: `surface/dark` (#231F20) or `bg/surface` (#F7F4ED) — dark backgrounds make code pop
- Corner radius: `radius/lg` (16px)
- Place in the right portion of a split layout, or as a contained element

**Figma implementation:** See Pattern: "Syntax-highlighted code block (setRangeFills)" in `tools/figma-console.md` — uses `setRangeFills` for native editable Figma text with per-character color.

Technique inspired by Clerk and Trigger.dev blog covers.

---

## JetBrains Mono badge system

Category badge for labeling graphics. Should be **small and muted** — a whisper, not a shout. It categorizes the content without competing with the heading.

**Badge text options:**

| Badge text | When to use |
|---|---|
| `NEW` | Major feature launch |
| `FEATURE` | Feature update or capability post |
| `GUIDE` | How-to, tutorial, best practices |
| `INTEGRATION` | Partner/integration announcement |
| `UPDATE` | Minor updates, changelog-style posts |

**Styling (restrained — learned from Resend):**
- JetBrains Mono, weight 500, uppercase
- **Size: 9-11px** at 1280w working canvas (18-22px at 2x export) — scale proportionally to your canvas. NOT 14-18px at 1280w — that competes with the heading
- On dark backgrounds: muted dark rounded rect (#333) with light text (#ccc), or `brand/primary` bg with white text at reduced opacity
- On light backgrounds: `brand/primary` (#3784FF) bg with white text, but keep the badge physically small
- Corner radius: `radius/pill` (9999px)
- Padding: 10px vertical, 20px horizontal
- **The badge should be ~1/8 the visual weight of the heading.** If it draws the eye before the heading, it's too prominent.

---

## Metric callout

Large statistic as the hero visual element. Doubles as social proof when the data is impressive.

**When to use:** Content with a key metric — "40% ticket deflection", "2.3s avg response time", "10x faster resolution."

**Design rules:**
- The number is the focal point — Neue Haas Display Pro, large (scale to ~60-80% of heading size)
- Label below the number: JetBrains Mono, uppercase, small
- Embed in a stylized card with `bg/surface` or card-color background
- Card styling: `radius/lg-alt` (32px), `shadow/subtle`
- Can be placed inside a product mockup (Decagon technique) or as a standalone element

Technique inspired by Decagon's blog covers.

---

## Logo composition

Partner or integration logo paired with the Inkeep logo. For announcements, partnerships, and ecosystem posts.

**Design rules:**
- **Partner logo**: always use the real logo from Brand Assets (`third-party/` prefix). Never approximate with text or shapes.
- **Inkeep logo**: use the icon or full wordmark from Brand Assets (`logo/` prefix)
- **Connector**: "×" or "+" symbol between logos, in `text/muted` or `brand/primary`
- **Equal visual weight**: both logos at similar size and prominence — neither should dominate
- **Layout**: centered for standalone compositions, right-aligned for split layouts
- Partner name can use their brand font if recognizable

**Logo sourcing:** See `tools/logo-sources.md` for the lookup sequence (Simple Icons → Iconify → Brandfetch).

---

## Quote card

Speaker photo paired with attributed quote text. For testimonials, customer quotes, and thought leadership.

**Design rules:**
- **Quote text**: Neue Haas Display Pro, weight 400, tracking -0.36px, leading 127%
- **Attribution**: JetBrains Mono, weight 500, uppercase — "Name, Title, Company"
- **Attribution color**: `brand/primary` (#3784FF)
- **Speaker photo**: circular crop, sized proportionally to the quote text
- **Container**: gradient background `linear-gradient(248deg, #F3EDFE -17.65%, #DCF2FB 101.25%)` with very light border `border-[#FBF9F4]`

For full token values, see the Testimonial Section recipe in the Brand Tokens § "Common Design Patterns" section above.

---

# Composition Patterns

Format-agnostic principles for arranging visual elements. These patterns were refined from analysis of top-performing B2B companies (Resend, Dub.co, Vercel, Linear, Decagon, Neon) and eye-tracking research.

**Adapt proportions to your target format.** Exact percentages were measured at blog-cover scale (1280×720 working canvas, exported at 2x to 2560×1440, 16:9) but the underlying principles apply to any aspect ratio and canvas size. A 1:1 LinkedIn post uses the same hierarchy ratios but different spatial proportions.

---

## Z-pattern layout

Eye-tracking research (NNG, 500+ participants) confirms the Z-pattern for visual content:

1. **Badge/label** → top-left (first fixation) — small, muted
2. **Heading** → left side (primary scan) — DOMINANT, largest element
3. **Visual element** → center-right (eye moves diagonally) — large, may bleed edges
4. **Brand mark** → bottom-left or bottom-right (last fixation) — subtle

This pattern applies to landscape and square formats. For portrait/vertical formats, collapse to a top-to-bottom stack with the same priority ordering.

---

## Split layout proportions

For compositions with text + visual side by side:

| Zone | % of width | Contains |
|---|---|---|
| **Text area (left)** | 30-40% | Badge, heading, subtitle, logo |
| **Visual area (right)** | 55-65% | Product mockup, illustration, visual metaphor |

**The visual area should feel dominant.** Measured from exemplars:
- Decagon: text ~30-35%, mockup ~60-70%
- Dub.co: text ~30-35%, panels ~65-70%
- Resend: text ~45%, 3D object ~50-55%

For square formats (1:1), consider a stacked layout instead — text top, visual bottom — with similar visual dominance.

---

## Visual hierarchy ratios

The hierarchy between elements should be **dramatic, not subtle**:

| Element | Relative visual weight | Size ratio to badge |
|---|---|---|
| **Heading** | 10 | 8-10x |
| **Visual element** | 7-8 | — |
| **Subtitle** | 3 | 1.5-2x |
| **Badge** | 1 (baseline) | 1x |
| **Logo/wordmark** | 0.5 | 0.5x |

**Common mistake:** Badge and heading at similar visual weight (flat hierarchy). The badge should whisper; the heading should shout.

These ratios are relative and scale to any canvas size. The key is maintaining the dramatic spread — not specific pixel values.

---

## Color restraint

**Maximum 3 colors in the surround area** (background, heading text, one accent). The product mockup or visual element inside can have its own color palette — that's fine. The problem is when the badge, heading, subtitle, logo, and mockup surround ALL use different accent colors, creating visual noise.

| Element | Color on dark bg | Color on warm bg |
|---|---|---|
| Heading | White (#FFFFFF) | `text/primary` (#231F20) |
| Subtitle | `brand/golden-sun` (#FFC883) or white at 70% | `text/muted` (#5F5C62) |
| Badge | `brand/primary` bg, white text | `brand/primary` bg, white text |
| Logo/wordmark | `brand/primary` (#3784FF) | `brand/primary` (#3784FF) |

---

## Background texture

**Never use a completely flat background.** Every top company except Vercel adds subtle texture to prevent flatness:

| Technique | How to implement | When to use |
|---|---|---|
| **Dot grid** | Small circles (2-3px) in a regular grid at 2-3% opacity | Default for warm cream backgrounds |
| **Light bloom** | Radial gradient emanating from the visual element, 5-10% opacity | Dark backgrounds with 3D objects |
| **Subtle gradient** | Linear gradient from bg/primary to slightly different warm tone | Warm backgrounds needing depth |
| **Dashed grid** | Thin dashed lines at 3-5% opacity | Technical/developer-focused posts |

---

## Content coverage

**80-85% of canvas should be filled.** Measured across Resend, Dub.co, Decagon, Linear — all fill 75-90% of their canvas.

- If your graphic has large empty areas (especially the bottom third), the content is too small or too centered
- Content block should start within the top 10% and extend to the bottom 10%
- If using a split layout, both columns should be vertically centered relative to each other

**Common mistake:** Excessive padding that creates a "floating in space" look. Content should fill the frame.

---

## Edge bleed

**Extend visual elements past the edge of the frame** to create energy and suggest "there's more beyond the frame."

| Technique | Description | When to use |
|---|---|---|
| **Edge bleed** | Visual extends past the right/bottom edge | Product mockups, 3D objects — creates energy |
| **Contained** | Visual sits within the frame with clear margins | Logo compositions, simple icons |
| **Overlapping** | Multiple panels overlap each other at angles | Showing multi-feature UIs |

Every top company bleeds product mockups past the right edge. Use **contained** only for simple, symmetrical compositions.

---

## Brand system consistency

When creating multiple graphics (a series of blog posts, a social campaign, a slide deck), think about the **SYSTEM**, not just individual images. The top-performing brands (Stripe, Figma, Linear, Resend) lock ~70% of their visual elements and vary ~30%.

**Lock these (constant across ALL graphics in a series):**
- Background treatment (warm cream default, dark for launches — don't alternate randomly)
- Typeface (Neue Haas for headings, always)
- Logo position (same corner, same size)
- Badge format (JetBrains Mono pill, consistent styling)
- Corner radius, shadow style, stroke weight

**Vary these (change per piece):**
- Color accent (rotate through card background palette)
- Visual content (unique mockup, illustration, or code per piece)
- Layout variant (split, centered, or full-bleed — 2-3 modes within the system)

**The restraint principle:** The most confident brands communicate through ABSENCE — what they leave out is more distinctive than what they include. If you're adding elements (extra badges, subtitles, logos, borders) to "make sure the message gets across," consider removing them instead. More elements = less memorable.

**Max 2 typefaces per image.** The brand system uses 3 fonts (Neue Haas, JetBrains Mono, Noto Serif) but any single graphic should use at most 2.

---

## What feels dated

Avoid these — they signal "2022 design" and undermine brand credibility:

- Flat gradients without texture or dimension
- Clip art or generic vector illustrations
- Heavy text overlays with 3+ font sizes
- Bright, saturated color backgrounds without visual depth
- Overly decorated graphics with borders, frames, and multiple elements competing

---

# Asset Library

## How master designs work

Master design files are team-maintained Figma files containing canonical components, patterns, and visual assets. They establish the authoritative brand look for each asset type.

**Rules:**
- **Reference, don't modify.** Use master files as visual references when generating code-based graphics. Extract structure, colors, and patterns — don't edit the Figma file.
- **Match the style.** Generated graphics should be visually consistent with the master designs, even though they're produced via code.
- **Pull tokens dynamically.** Use the Figma MCP to read current values rather than hardcoding from memory.

## Design Files

| File | URL | Contains | Use for |
|---|---|---|---|
| Inkeep Design Assets | https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Design-Assetts | Brand Assets master page — all atomic graphical elements (logos, icons, illustrations, backgrounds, third-party logos), design tokens (5 variable collections) | Primary source for all brand assets and tokens |
| Inkeep Agent Graphics Workspace | https://www.figma.com/design/S5kGTPZ0kSjmSxusJ56QJH/Inkeep-Agent-Graphics-Workspace | Shared workspace for AI-generated graphics — one page per project, organized by date and medium | Default target for all new graphics creation (unless user specifies a different file) |

## Navigating Figma files via MCP

**Always use the Figma MCP to navigate** — never the browser.

### How to discover pages and assets

1. **List all pages in the file** — call the Figma MCP to get the file's page tree. This returns all page names and their node IDs.
2. **Scan page names** for relevance to your task (logos, social, banners, presentations, etc.)
3. **Read a specific page** by its node ID to see what components and frames it contains.
4. **Drill into nodes** to extract specific assets, styles, colors, and typography.

### Key node IDs (known)

| Page | Node ID |
|---|---|
| Brand Assets (master asset page) | `5003:63` |
| Logos section | `5003:64` |
| Icon Set section | `5006:187898` |
| Illustrations section | `5003:66` |
| Customers section | `5045:158` |
| Third-Party Logos section | `5003:70` |
| Decorative & Backgrounds section | `5003:69` |
| UI Elements section | `5003:68` |
| Brand Mascot section | `5003:65` |
| Reference Examples section | `5097:4194` |

> For other pages, use the Figma MCP to get their node IDs dynamically. Node IDs may change if pages are restructured.

### Navigation strategy by task

| What you need | Where to look first | Fallback |
|---|---|---|
| Logo (any format) | Brand Assets → Logos (`logo/`) | — |
| Any icon | Brand Assets → Icon Set (`iconset/`) | — |
| Illustrations | Brand Assets → Illustrations (`illustration/`) | — |
| Customer assets (logo + case study hero) | Brand Assets → Customers (`customer/`) | — |
| Integration partner logo | Brand Assets → Third-Party Logos (`third-party/`) | `tools/fetch-logo.ts` for logos not in the library |
| Background, gradient, texture | Brand Assets → Decorative & Backgrounds (`background/`) | — |
| Product UI mockup | Brand Assets → UI Elements (`ui/`) | — |
| Mascot/Keepie | Brand Assets → Brand Mascot (`mascot/`) | — |
| Brand colors, typography, spacing | Design tokens in the Inkeep Design Assets file | Fallback hex values in the Brand Tokens section above |
| Need visual inspiration or style reference | Reference Examples (`_reference/` prefix) | Gradient swatches, UI screenshots, illustration variants. For style matching only — do NOT place in compositions. |

## Brand Assets Page

The Brand Assets page in the Inkeep Design Assets file is a curated collection of all unique atomic graphical elements, organized for AI consumption.

Production sections contain only **COMPONENT** nodes — every item is a published library component accessible via `importComponentByKeyAsync`. The Reference Examples section contains FRAME/INSTANCE items that are not published as library components.

- **File key**: `D7NDSM2peo1iLhkjLxmGP5`
- **Page node ID**: `5003:63`
- **URL**: https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Design-Assetts?node-id=5003:63

### Asset catalog

All assets use **slash-separated hierarchical names**: `{section}/{subcategory}/{variant}`. Search by path prefix to find what you need.

| Section | Path prefix | What's here | How to search |
|---|---|---|---|
| **Logos** | `logo/` | Brand marks in all variants — full logo, icon-only, wordmark, dual-mark, .com, favicons. Each in color/black/white. | `logo/full-color`, `logo/icon/black`, `logo/favicon/` |
| **Icon Set** | `iconset/` | All atomic icons normalized to ~40px. **Search here first for any icon.** Covers use cases, products, platform, utility, navigation, status, brand marks, favicons. | `iconset/search`, `iconset/ai-chat-sparkle`, `iconset/status/` |
| **Illustrations** | `illustration/` | Product illustrations, use-case illustrations, developer page, homepage, security. Descriptively named by subject. | `illustration/use-case/`, `illustration/product/`, `illustration/security/` |
| **Customers** | `customer/` | Per-customer assets — brand mark logo + case study hero illustration, grouped by company. | `customer/posthog/`, `customer/payabli/` |
| **Third-Party Logos** | `third-party/` | Integration partner wordmarks (Slack, GitHub, etc.). For customer logos, check the Customers section instead. | `third-party/slack`, `third-party/github` |
| **Decorative & Backgrounds** | `background/` | Footer gradients, grid patterns, dots, polygons, gradient backgrounds (by size and color), textures. | `background/gradient/wide/`, `background/texture/` |
| **UI Elements** | `ui/` | Product UI mockups — search bar, data visualizations, chat widget. | `ui/data-viz/`, `ui/chat-widget` |
| **Brand Mascot** | `mascot/` | Keepie character. | `mascot/keepie/` |

> **Do not hardcode asset counts or specific names** — the library evolves. Always search dynamically using the path prefixes above.

> Items prefixed with `_reference/` are in the **Reference Examples** section — non-publishable reference material (gradient swatches, UI screenshots, illustration variants, case study heroes). These are for visual inspiration only — do NOT clone or place them in compositions.

### How to find an asset

Use `figma_execute` to search by name or prefix. Always scope searches to the Brand Assets page (`5003:63`) — never search the entire file.

```javascript
// Find a specific asset by exact name
const page = await figma.getNodeByIdAsync('5003:63');
const logo = page.findOne(n => n.name === 'logo/full-color');

// Find all assets matching a prefix
const icons = page.findAll(n => n.name.startsWith('iconset/'));

// Find within a specific section
const iconSet = await figma.getNodeByIdAsync('5006:187898');
const searchIcon = iconSet.findOne(n => n.name === 'iconset/search');
```

### How to use an asset

### Preferred method: import from published library

The Design Assets file is published as a team library. Use `importComponentByKeyAsync` for asset acquisition — no cross-file navigation needed:

```javascript
// Import by component key (preferred — no file navigation needed)
const component = await figma.importComponentByKeyAsync(componentKey);
const instance = component.createInstance();
instance.x = targetX;
instance.y = targetY;
```

**Discovering component keys:** Use the REST API to list all published components and their keys:
`GET /v1/files/D7NDSM2peo1iLhkjLxmGP5/components` — each component in the response includes a `key` field.

Or discover at runtime: navigate to Design Assets file, find the node by name, read `node.key`.

### Fallback: cross-file clone

If `importComponentByKeyAsync` fails (component key changed, library update pending, or asset is in Reference Examples and not published), fall back to the cross-file clone workflow:

1. Navigate to the Brand Assets file (`figma_navigate`)
2. Search the Brand Assets page (node `5003:63`) by name or prefix
3. Clone it: `asset.clone()`
4. Move the clone into your working file and composition

## Adding a new master design

To add a Figma file, edit this file and add a row to the Design Files table. Include:
- **File**: descriptive name
- **URL**: Figma file URL
- **Contains**: what asset types or components live there
- **Use for**: when to reference this file
