# Brand Tokens for Graphics

Use when: Generating graphics that need brand-consistent colors, typography, and styling
Priority: P0
Impact: Off-brand visuals with wrong colors, fonts, or styling

---

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
