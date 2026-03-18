Use when: Creating illustrations, decorative graphics, visual metaphors, or any graphic that uses the Inkeep hand-drawn illustration style
Priority: P0
Impact: Off-brand illustrations that don't match the existing visual language on the marketing site

---

# Inkeep Illustration System

Inkeep's illustration style is built on a principle called **"Imperfect Precision"**: hand-drawn containers provide warmth and approachability, while precise filled icons inside them communicate clarity and technical confidence. The scaffolding is human; the content is AI.

This reference covers the visual vocabulary, construction rules, composition patterns, and Quiver generation instructions needed to produce illustrations that match the existing marketing site.

---

## The three-tier visual language

Inkeep illustrations use THREE visual tiers that work together to create depth and hierarchy:

### Tier 1: Background structure (gray, faint)

The distant scaffolding — outer card panels, hexagonal grids, background containers, and connecting lines that recede into the background.

| Property | Value | Notes |
|---|---|---|
| **Stroke color** | `#231F20` (text/primary) | Gray only at this tier |
| **Stroke opacity** | 10-30% (varies by depth) | 10-15% for farthest elements, 20-30% for mid-ground structure |
| **Stroke weight** | 2-4px | 3px is the most common default |
| **Stroke cap** | `NONE` (butt cap) | NOT round — butt caps are the standard (2082 vs 51 measured instances) |
| **Fill** | None, or `#F7F4ED` (bg/surface) | Containers are transparent or cream-filled |
| **Corner radius** | 48-54px for outer containers, 24-32px for inner | See corner radius system below |
| **Path quality** | Slightly irregular | Organic wobble on edges, corners not perfectly sharp |

### Tier 2: Active containers (blue, prominent)

The primary interactive/focal elements — chat panels, calendar frames, flow diagram nodes, card outlines for active UI elements. These use blue stroke, not gray.

| Property | Value | Notes |
|---|---|---|
| **Stroke color** | `#3784FF` (brand/primary) | Blue outlines for active/focal containers |
| **Stroke opacity** | 1.0 (full) | Confident, not faded |
| **Stroke weight** | 3px (standard), 6px for focal emphasis | Heavier weight draws attention |
| **Stroke cap** | `NONE` (butt cap) | Consistent with tier 1 |
| **Fill** | None, or `#D8E6FC` / `#D0E1FF` light blue wash | Blue wash fill behind focal elements (shield, hub center) |
| **Corner radius** | 24-32px | Primary container size |

### Tier 3: Content elements (filled, precise)

The meaningful content — icons, data shapes, indicators, active buttons. These use solid fills.

| Property | Value | Notes |
|---|---|---|
| **Fill color** | `#3784FF` (brand/primary) | Solid fill for icons and active elements |
| **Fill opacity** | 1.0 (full) | Confident, not tentative |
| **Path quality** | Clean, geometric, precise | Circles are circular, lines are straight |
| **Stroke** | Optional — same-hue stroke reinforces emphasis | Focal elements often use fill + stroke of the same color for boldness |

### How the tiers interact

```
Tier 1 (gray bg)     →  Tier 2 (blue containers)  →  Tier 3 (blue fills)
Hex grid, outer cards     Chat panels, flow nodes       Icons, data shapes
#231F20 @ 10-30%          #3784FF @ 100% stroke          #3784FF @ 100% fill
Recedes                   Draws attention                 Carries meaning
```

The progression from faint gray → bold blue stroke → solid blue fill creates visual depth without shadows or gradients.

---

## Semantic color system

Colors carry meaning in Inkeep illustrations. This is not decorative — the color assignments communicate who/what an element represents.

### Primary semantic roles

| Color | Semantic meaning | Examples |
|---|---|---|
| **Blue** (`#3784FF`) | AI / system / Inkeep | AI Assistant responses, system UI, primary data series, active controls |
| **Golden/amber** | Human / user / external content | User questions, image placeholders, links, secondary data, status badges |
| **Gray** (`#231F20` at opacity) | Structure / scaffolding | Containers, backgrounds, connecting lines |

### Golden/amber variants (all serve the "human/user" role)

| Hex | Name | Usage |
|---|---|---|
| `#E5AE61` | Golden sun | Primary warm accent — text, icon fills |
| `#FFCB83` | Light amber | Stroke color for user content containers (chat bubbles, image frames) |
| `#E6B828` | Dark golden | Deeper warm accent, chart data |
| `#FFE6C2` | Warm wash | Background fills for warm areas (at 60-100% opacity) |

### Applying the blue/golden semantic split

In **chat interface** illustrations:
- User message bubbles: golden stroke (`#FFCB83`) container, golden text
- AI response bubbles: blue stroke (`#3784FF`) container, blue text

In **website/UI mockup** illustrations:
- Image placeholders: golden stroke frame with mountain/landscape icon in golden
- Content/text areas: blue stroke containers, blue text lines
- Chat widget panels: blue stroke, blue content

In **data visualization** illustrations:
- Primary data series: blue fills/strokes
- Secondary data series: golden fills/strokes
- Comparison overlays: blue polygon vs golden polygon (radar charts)

---

## Full color palette

| Role | Hex | Opacity | Usage frequency | Notes |
|---|---|---|---|---|
| **Primary blue** | `#3784FF` | 1.0 | ~50% of all colored elements | Icons, active containers, text, data |
| **Background structure** | `#231F20` | 10-30% | ~25% | Tier 1 containers and scaffolding |
| **Foreground structure** | `#231F20` | 40-70% | Rare | Charcoal monochrome illustrations (see Pattern 10) |
| **Golden sun** | `#E5AE61` | 1.0 | ~8% | Warm fills, user text |
| **Light amber** | `#FFCB83` | 1.0 | ~8% | Warm strokes, user containers |
| **Dark golden** | `#E6B828` | 1.0 | ~3% | Chart data, deeper warm accent |
| **Container fill** | `#F7F4ED` | 1.0 | ~8% | Cream interior fill |
| **Blue wash (medium)** | `#D8E6FC` | 1.0 | ~5% | Panel/card background behind focal elements |
| **Blue wash (light)** | `#D0E1FF` / `#E1EBFB` | 0.6-1.0 | ~3% | Softer background wash areas |
| **Blue wash (pale)** | `#E3EDFF` / `#EEF5FC` / `#F2F7FC` | 1.0 | ~1% | Near-white background tint |
| **Warm wash** | `#FFE6C2` | 0.6-1.0 | ~3% | Background fills for warm areas |
| **Navy** | `#2D4770` | 1.0 | Rare | Deep accent |
| **Purple** | `#7C65ED` / `#AC9EF2` | 1.0 | Data viz | Topic clusters in bubble charts, code syntax |
| **Light purple** | `#E1DBFF` | 1.0 | Data viz | Bubble chart topic circle fills |
| **Green** | `#65BB61` | 1.0 | Data viz | Positive ratings (checkmarks), code syntax |
| **Light green** | `#C9F0C7` | 1.0 | Data viz | Status indicator fills |
| **Amber warning** | `#E6B828` | 1.0 | Data viz | Caution indicators in QA tables |

**Purple and green** are used in data visualization illustrations (bubble charts, QA rating tables, radar charts) — not limited to code syntax.

**Hard rules:** No gradients. No drop shadows. No glows. Depth is created through line weight variation, opacity tiers, and layering.

---

## Corner radius system

Illustrations follow a three-tier corner radius hierarchy:

| Tier | Radius | Count | Used for |
|---|---|---|---|
| **Small** | 6-8px | ~88 uses | Inner UI elements: buttons, badges, input fields, small cards |
| **Medium** | 24-32px | ~75 uses | Primary containers: message bubbles, flow nodes, card panels |
| **Large** | 48-54px | ~57 uses | Outer containers: illustration component borders, large panel frames |

Use the tier that matches the element's role in the hierarchy. Nesting follows outside-in: large outer → medium inner → small detail.

---

## Stroke weight system

| Weight | Count | Role |
|---|---|---|
| **3px** | 411 | **Default** — container outlines, icon strokes, standard elements |
| **2px** | 117 | Secondary strokes, connecting lines, finer detail |
| **4px** | 106 | Emphasis strokes, heavier containers, prominent elements |
| **1-1.5px** | 108 | Fine detail, distant background elements, subtle connectors |
| **6px** | 6 | Focal emphasis — shield outlines, key structural elements |
| **Variable (1.8-2.8px)** | ~64 | Hand-drawn variation zone — the organic wobble range |

**Default to 3px.** Use weight variation for depth: heavier = closer/more important, lighter = farther/less important.

---

## Gray opacity tiers

The `#231F20` structural color operates at distinct opacity levels that create the depth hierarchy:

| Opacity | Role | Examples |
|---|---|---|
| **10%** | Farthest background | Barely-visible grids, distant scaffolding |
| **15%** | Background scaffolding | Hexagonal grids, outer panel edges |
| **20%** | Standard containers | Primary gray container outlines (the workhorse) |
| **30%** | Prominent structure | Important structural elements, card edges closer to foreground |
| **40%** | Inner detail | List row separators, dot grid nodes |
| **60-70%** | Charcoal monochrome mode | Homepage dev-section card illustrations (see Pattern 10) |

---

## Text color semantics

Text within illustrations follows the semantic color system:

| Text color | Role | Examples |
|---|---|---|
| `#3784FF` blue | Headings, labels, AI responses, system text | "AI Assistant", "Performance", "Top topics", "Meetings Booked" |
| `#231F20` dark gray | Data labels, neutral body text, table content | Axis labels, descriptions, column headers |
| `#E5AE61` / `#FFCB83` golden | User-generated content, questions, links | "Hi, where can I integrate Inkeep?", "Getting Started with Slack" link |
| Multi-color | Code syntax highlighting | Purple for keywords, green for strings, golden for values |

---

## Composition patterns (11 types observed)

### Pattern 1: Hub-and-spoke radial diagram

**Used in:** Customer support use case card
**Figma component:** `illustration/use-case/customer-support`
**Canvas:** 548 × 558

- Central focal element: blue-stroked rounded square with light blue wash fill, Inkeep logo icon inside
- 5-6 satellite nodes arranged radially around center
- Each satellite: gray hand-drawn rounded square (corner radius ~32px) + blue icon + text label below
- Curved blue connector lines from center to each satellite, with small blue dots at connection points
- Thin blue cross-grid lines behind the arrangement (faint, structural)

### Pattern 2: Chat/conversation interface

**Used in:** Customer service, Slack integration use case cards
**Figma components:** `illustration/use-case/customer-service`, `illustration/use-case/slack-integration`
**Canvas:** 548 × 558

- Outer container: blue-stroked rounded rectangle (32px radius) with "AI Assistant" header + Inkeep logo
- Horizontal blue divider line below header
- User message bubble: golden stroke (`#FFCB83`) rounded rectangle, golden text
- AI response bubbles: blue stroke rounded rectangles, blue text
- Response may include bulleted lists, linked text (golden underline), numbered badges
- Text input bar at bottom: blue stroke rounded rectangle with send button icon
- **Slack variant:** Includes waveform visualization element (vertical blue bars of varying height) between two panels, gray outer container representing Slack UI chrome

### Pattern 3: Flow diagram

**Used in:** Documentation teams card, developer no-code view, agent workflow
**Figma component:** `illustration/use-case/documentation-teams`
**Canvas:** 548 × 558 (use case), varies for developer panels

- Top-to-bottom or left-to-right flow
- Nodes: blue-stroked rounded rectangles (not gray) with blue text and optional golden badges
- Center Inkeep logo node with blue wash fill
- Vertical connecting lines: thin blue stroke
- Action icon (sync/refresh) at connection points: blue filled circle
- Lower container: blue stroke rounded rectangle with list items (gray stroke sub-containers)

### Pattern 4: Product UI mockup (website/marketing)

**Used in:** Marketing teams, product teams, website pages
**Figma components:** `illustration/use-case/marketing-teams`, `illustration/ui-screen/website-pages`
**Canvas:** 548 × 558 (use case), 595 × 584 (UI screen)

- Outer gray container: hand-drawn stroke with window chrome dots (three small circles)
- Inkeep logo node at top with gray curved connector to content below
- Grid layout of content cards inside:
  - Blog/article cards: blue stroke, with golden image placeholder (mountain/landscape icon in golden stroke frame)
  - Content text: blue horizontal lines of varying length (representing text)
  - Chat widget panel: blue stroke, includes AI Assistant header, message bubbles
  - Image gallery: golden stroke rounded squares with golden image icons
- Sync/refresh icon (blue filled circle) connecting Inkeep to the content
- Blue filled checkmark badge on content cards that have been processed

### Pattern 5: Data visualization (analytics panels)

**Used in:** Product feature illustrations (analytics, topics, knowledge QA)
**Figma components:** `illustration/product/analytics-*`, `illustration/product/knowledge-qa`, `illustration/product/topics-qa-*`
**Canvas:** 649 × 836 (portrait — tall card format)

Composed of stacked/overlapping card panels:

**Bar chart panel:**
- Gray hand-drawn outer container with cream fill
- "Performance" heading in blue text
- Horizontal bar chart: blue bars (primary data, `#3784FF` fill + stroke) and golden bars (secondary data, `#E5AE61`/`#FFCB83` fill + stroke)
- Bars have both a light fill AND a bold stroke of the same hue — creates the hand-drawn bar effect
- Gray axis lines, dark gray axis labels

**Radar/spider chart panel:**
- Gray hand-drawn container, cream fill
- Gray dashed concentric polygons (guide web)
- Blue polygon overlay (primary data series) with blue fill at ~20% opacity + blue stroke
- Golden polygon overlay (secondary data series) with golden fill at ~20% opacity + golden stroke
- Small gray dots at data points
- Blue text axis labels (Label 1, Label 2, etc.)
- Date filter badge in upper right (gray stroke rounded rectangle)

**Bubble chart panel (topics/knowledge QA):**
- Gray hand-drawn outer container
- Circles of varying sizes representing topics:
  - Blue circles (large/medium): blue stroke + light blue fill (`#D8E6FC`) — primary topics
  - Purple circles (small/medium): purple stroke (`#7C65ED`) + light purple fill (`#E1DBFF`) — secondary topics
  - Blue text lines inside circles represent topic content
- Gray hand-drawn tooltip card with text lines
- Below: QA table with rows — blue text for questions, green checkmarks for good ratings, golden/amber warnings for issues

### Pattern 6: Code editor panel

**Used in:** Developer page (TypeScript view)
**Figma component:** `illustration/dev-page/typescript`
**Canvas:** 649 × 643

- Tab bar at top: active tab ("TYPESCRIPT") has hand-drawn rounded outline, inactive tab ("VISUAL BUILDER") is plain text
- Main container: gray hand-drawn rounded rectangle with cream/white fill
- Inner code area: lighter gray container
- Multi-color syntax-highlighted code in monospace font:
  - Purple (`#7C65ED`): keywords (`import`, `const`, `model:`)
  - Green (`#65BB61`): strings
  - Golden (`#E5AE61`): values, property names
  - Dark gray (`#231F20`): punctuation, structure

### Pattern 7: Tree/hierarchy diagram

**Used in:** Developer page (Visual Builder view)
**Figma component:** `illustration/dev-page/visual-builder-complex`
**Canvas:** 649 × 633

- Tab bar at top (same as code editor, but "VISUAL BUILDER" active)
- Outer container: cream fill with very faint dot grid background
- Pill-shaped filter buttons at top left ("Agent", "MCP") with gray stroke
- Tree structure flowing top-to-bottom:
  - Root node: blue-stroked rounded rectangle with agent icon + "Help Agent" label + "Default" badge
  - Child nodes: blue-stroked rounded rectangles with descriptions
  - Leaf nodes: blue-stroked pill/capsule shapes with tool icons + names
  - Connectors: gray curved Bezier paths between parent-child nodes
  - Small gray circle dots at connection points on node edges

### Pattern 8: Security/trust illustration

**Used in:** Security page
**Figma components:** `illustration/security/auth-password`, `illustration/security/shield-hexgrid`
**Canvas:** 649 × 836

**Auth/password variant:**
- Stacked gray card panels (3-4 cards with slight offset for depth)
- Golden stroke horizontal lines representing data fields
- Purple dashed vertical lines on left edge (representing sidebar/tabs)
- Focal element: blue-stroked capsule shape overlapping the cards
  - Three blue asterisks (***) inside for password representation
  - Blue lock icon overlapping the capsule edge

**Shield/hexgrid variant:**
- Background: tessellated hexagonal grid in gray stroke at 20% opacity
- Small cream-filled dots (`#F7F4ED`) at hex grid vertices
- Focal: large shield shape with blue stroke (6px weight) + light blue fill (`#D8E6FC`)
- Inkeep logo icon centered inside shield (blue fill)
- Orbit rings: two blue elliptical curves wrapping around the shield at ~50-80% opacity

### Pattern 9: Meeting scheduler / calendar UI

**Used in:** Product UI screens
**Figma component:** `illustration/ui-screen/meeting-scheduler`
**Canvas:** 649 × 600

- Blue-stroked speech bubble at top with question text ("What day and time work best for you?")
- Calendar widget: blue-stroked container with month navigation (< June 2025 >)
  - Day grid: gray text for weekdays, blue text for dates
  - Selected date: blue filled rounded square (8px radius)
  - Blue send button (arrow icon) in bottom right
- Meetings list below/overlapping: blue-stroked container with "Meetings Booked" heading
  - List rows: gray hand-drawn rounded rectangles
  - Each row: blue avatar icon + name text + role text
  - Three-dot menu icons in gray

### Pattern 10: Charcoal monochrome mini-illustrations

**Used in:** Homepage developer section cards (Multi-Agent SDK, UI Components, RAG & data connectors, MCP and tools)
**Figma component:** `illustration/homepage/dev-section`
**Canvas:** 761 × 1057 (container for 4 cards in 2x2 grid)

**This is a distinct illustration mode** — NOT the standard blue+gray dual-layer style:

- **Monochrome only** — dark gray/charcoal outlines at 60-70% opacity, NO blue, NO golden
- Heavier, rougher strokes (~2-3px, `#231F20` at 60-70%)
- Simple line art: rounded pill/capsule shapes, connection lines, basic icons
- Small format (~150×150px illustration area within each card)
- Set on **colored card backgrounds**:
  - Light blue (`#D8E6FC` area) — Multi-Agent SDK
  - Warm peach (`#FFE6C2` area) — UI Components
  - Light purple (`#E1DBFF` area) — RAG & data connectors
  - Light cyan (`#DCF2FB` area) — MCP and tools
- Each card has: mini illustration at top → bold heading → description → "SHOW MORE" link with arrow

**Conceptual shorthand:**
- Multi-Agent SDK: two agent pills connected by a curved line with circle node
- UI Components: search bar pill + sparkle icon → results container
- RAG: hexagonal graph structure → data card
- MCP: three connected rounded rectangles in a vertical chain

### Pattern 11: Process step icons

**Used in:** Homepage process steps (Connect data, Create agents, Equip tools, Ship & monitor, Success)
**Figma components:** `illustration/process/*`
**Canvas:** 90-91 × 90-91 (square, very small)

**Another distinct mode** — dense single-concept pictograms:

- Light blue wash background (`#D0E1FF`) with large corner radius (~24px)
- Blue-only elements: `#3784FF` fill and/or stroke, no gray, no golden
- Dense composition — fills most of the tiny canvas, minimal whitespace
- Single-concept icons: data cards cascading, agent nodes connected, hexagonal tool shape, browser window with chart, star with sparkle rays
- These use fill + stroke of the same blue — contradicting the old "filled elements never have outlines" rule

### Pattern 12: Two-element scene

**Used in:** Sales card (two avatars with waveform), documentation card (input → sync → output)

- Two focal elements on opposite sides (left and right)
- Connecting element in the center (waveform, arrow, sync icon)
- Both focal elements use the hand-drawn circle/container
- Center element: precise blue fill
- Minimal — only 3 elements total

**Canvas:** 256 × 98 (wide card)

---

## Illustration size classes

The Figma components fall into clear size tiers:

| Class | Dimensions | Examples |
|---|---|---|
| **Micro** | 90-91px square | Process step icons |
| **Small** | 256 × 98 | Use case card inline illustrations (wide landscape) |
| **Medium** | 452-649 × 548-838 | Feature panels, product UI screens, security panels |
| **Large** | 761 × 1057, 1345 × 740 | Homepage composite sections (dev cards, use case grid) |

---

## Depth and layering techniques

Beyond the three-tier color system, illustrations use these techniques for spatial depth:

| Technique | Description | Examples |
|---|---|---|
| **Stacked card panels** | Cards overlapping at slight offset (2-4 panels deep) | Analytics illustrations, auth/password security |
| **Blue wash focal area** | Light blue fill (`#D8E6FC`) behind the most important element | Shield interior, hub center, active panel |
| **Orbit rings** | Elliptical blue stroke curves wrapping around focal elements | Security shield |
| **Dot grid nodes** | Small cream-filled circles at grid vertices | Security hexgrid |
| **Bleeding/cropping** | Elements extend past the illustration boundary | Bubble charts cropped at edges, bar charts extending off-canvas |
| **Opacity gradation** | Background elements at 10-15%, midground at 20-30%, foreground at full | Consistent across all illustration types |

---

## Signature decorative elements

### Blue swoosh underline — Inkeep's signature element

A hand-drawn blue brush stroke that underlines a key word in headlines. This is Inkeep's most distinctive brand element — used on 8+ pages across the marketing site (homepage, developers, enterprise, agent workforce, about, visual builder, unified search). It embodies "Imperfect Precision" — a rough, organic mark on precise typography.

**The swoosh is to Inkeep what the gradient wave is to Stripe.** It should appear on every blog thumbnail, social graphic, and marketing visual that has a headline.

#### Source asset

- File: `/icons/line-curve-blue.png` (580 × 18px raster)
- Color: `#3784FF` (brand/primary)
- Character: irregular brush stroke, slight upward curve left-to-right, variable thickness (thicker in the middle, thinner at ends)
- On the website it animates with a scaleX reveal from left, but in static graphics it appears fully drawn

#### Which word to underline

The swoosh underlines the **value/emotion word** — not the product name, not the feature name, but the BENEFIT or PROMISE.

| Headline | Underlined word | Why |
|---|---|---|
| "AI Agents for customer operations" | **customer operations** | The benefit — what the product enables |
| "The Open Agent Builder" | **Open** | The differentiator — what makes it special |
| "Deploy with confidence" | **confidence** | The emotion — what the buyer feels |
| "Support at scale" | **scale** | The outcome — what's achieved |
| "Built on Trust" | **Trust** | The value — what the company stands for |

**Selection rule:** Ask "what is the ONE word a buyer should remember after glancing at this graphic?" That's the swoosh word. It's typically:
- The benefit ("scale", "confidence", "trust")
- The differentiator ("Open", "customer operations")
- The integration/channel name when that IS the news ("Slack", "Zendesk")

Never underline: "Inkeep" (the brand is already on the graphic), generic verbs ("introducing", "announcing"), or articles ("the", "a").

#### How to place it in Figma

```javascript
// 1. Import the swoosh PNG as an image fill on a rectangle
const swoosh = figma.createRectangle();
swoosh.name = "deco-swoosh";

// 2. Size it to match the underlined word's width
// The swoosh should be exactly as wide as the word it underlines
// Height: ~4-6% of the word's font size (e.g., 5px tall for 100px font)
const wordWidth = 280; // measure the word's rendered width
const swooshHeight = 6;
swoosh.resize(wordWidth, swooshHeight);

// 3. Position it just below the word's baseline
// Offset: ~2-4px below the text baseline
swoosh.x = wordNode.x; // align left edge with word start
swoosh.y = wordNode.y + wordNode.height - 2; // just below baseline

// 4. Apply the swoosh image as a fill
// Option A: Use the PNG from the marketing site
// Download: curl -sL -o /tmp/swoosh.png "https://inkeep.com/icons/line-curve-blue.png"
// Then set as image fill on the rectangle

// Option B: Draw a simple hand-drawn line with vectorPaths (faster, no image dependency)
const swooshLine = figma.createVector();
swooshLine.name = "deco-swoosh";
swooshLine.vectorPaths = [{
  windingRule: "NONE",
  // Slight curve with organic wobble
  data: `M 0 ${swooshHeight/2} C ${wordWidth*0.2} ${swooshHeight*0.1} ${wordWidth*0.5} ${swooshHeight*0.9} ${wordWidth} ${swooshHeight*0.3}`
}];
swooshLine.strokes = [{ type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1.0 } }];
swooshLine.strokeWeight = 3;
swooshLine.strokeCap = 'ROUND';
swooshLine.fills = [];
```

**Option B (vectorPaths) is preferred** — it's resolution-independent, doesn't require downloading a PNG, and the agent can vary the curve slightly for each graphic (maintaining the hand-drawn feel of slight irregularity).

#### Dark vs light backgrounds

| Background | Swoosh treatment |
|---|---|
| Warm cream (`bg/primary`) | `#3784FF` (brand/primary) — standard |
| Dark (`surface/dark`) | `#3784FF` (brand/primary) — still works, blue on dark is high contrast |
| Blue watercolor | White (#FFFFFF) swoosh — invert for contrast |

#### When to use it

| Graphic type | Use swoosh? | Notes |
|---|---|---|
| Blog cover (any tier) | **Yes** — on the headline's key word | This is the primary deployment |
| Social post | **Yes** — on the stat or key message word | Reinforces brand across channels |
| Slide deck | **Yes** — on section headings | Consistent with website experience |
| Case study hero | **No** — customer's brand takes priority | The swoosh is Inkeep's element, not the customer's |
| Comparison graphic | **No** — the "vs" format doesn't have a natural swoosh target | Keep comparisons neutral |
| Email header | **Optional** — if there's a headline | Works but test rendering across email clients |

### Hand-drawn dash (`hand-drawn-dash.svg`)

Two overlapping slightly curved lines in warm gray (#7A6A58 and #5F5A53).

**Properties:**
- 120 × 8px viewBox
- Dual-stroke at different opacities (0.7 and 0.4) and widths (1.36 and 0.68)
- Creates a warm, textured separator line

**Use in graphics:** Section dividers, separating text blocks, under subtitles.

### Line with dots (`line-with-dots-blue.svg`)

A hand-drawn blue line with blue dots along its length — a connecting/timeline element.

**Properties:**
- 224 × 6px viewBox, horizontal orientation
- Very organic path with subtle wobble
- Dots are ~4-5px blue circles at intervals
- Used to connect steps or show progression

---

## Generating illustrations with Quiver

When using Quiver (Option D in the graphics skill) to generate Inkeep-style illustrations, use these instructions:

### Quiver `--instructions` template

```
Brand illustration style — "Imperfect Precision":

THREE visual tiers that create depth:

1. BACKGROUND STRUCTURE: Hand-drawn outlines in dark gray (#231F20) at 10-30%
   opacity. Hexagonal grids, outer card panels, background containers. Stroke
   weight 2-3px, butt linecaps. Slightly irregular paths with organic wobble.
   Fill: none or light cream (#F7F4ED). These are faint scaffolding.

2. ACTIVE CONTAINERS: Blue (#3784FF) stroke outlines at full opacity for focal
   panels, chat interfaces, flow nodes, interactive elements. Stroke weight
   3px (standard) or 6px (focal emphasis). Light blue wash fill (#D8E6FC)
   behind the most important element. These draw attention.

3. CONTENT: Precise, clean, geometric icons and symbols INSIDE containers.
   Solid blue (#3784FF) fill. Person icons, globe icons, document icons,
   gear icons, chat bubbles. Some filled elements also have a same-color
   stroke for extra boldness. These carry meaning.

Semantic color coding:
- Blue (#3784FF): AI / system / Inkeep elements
- Golden amber (#E5AE61, #FFCB83): Human / user / external content
- Gray (#231F20 at opacity): Structure and scaffolding
- Light blue wash (#D8E6FC, #D0E1FF): Background fill behind focal elements

Rules:
- No drop shadows, no gradients, no photorealistic elements
- Generous whitespace
- Butt linecaps (NONE), not round
- Default stroke weight: 3px
- Line weight variation for depth (heavier = closer/more important)
- Corner radii: 6-8px inner, 24-32px containers, 48-54px outer
- Maximum 5-7 distinct elements per illustration
- Flat, minimal, hand-drawn technical style
```

### Quiver `--prompt` examples

| Content | Prompt |
|---|---|
| Use case: customer support | "Central blue-stroked rounded square with Inkeep logo, light blue wash fill. Six satellite nodes arranged radially: gray rounded squares each containing a precise blue icon (chat, globe, billing, gear, person, bug). Curved blue connector lines with dots. Faint cross-grid behind." |
| Use case: chat interface | "Blue-stroked chat panel container with header bar. Golden-stroked rounded rectangle for user message on right. Blue-stroked response bubbles on left with bulleted list. Text input bar at bottom with send icon. Alternating blue/golden semantic colors." |
| Feature: agent workflow | "Top-to-bottom flow diagram. Blue-stroked rounded rectangle nodes with text. Gray curved Bezier connectors between nodes. Small circle dots at connection points. Tab bar at top. Pill-shaped filter buttons. Faint dot grid background." |
| Concept: security/permissions | "Tessellated hexagonal grid in faint gray (20% opacity) with cream dots at vertices. Large shield shape centered: blue stroke at 6px weight, light blue wash fill. Inkeep logo inside. Two blue orbit ellipses wrapping around the shield." |
| Concept: data analytics | "Two overlapping hand-drawn card panels on cream background. Front: bubble chart with blue circles (large, light blue fill) and purple circles (small, light purple fill). Blue tooltip card. Below: QA table rows with green checkmarks and golden warning icons." |

### The key construction question: how to get the "hand-drawn" quality

The three-tier system requires organic, slightly irregular paths for containers — hexagons that aren't perfectly geometric, circles with subtle wobble. An agent building in Figma natively will produce rigid, perfect shapes. This is wrong — it loses the entire "imperfect" half of "Imperfect Precision."

**Rule: Use Quiver for ALL hand-drawn containers.** Generate the organic shapes via Quiver (hexagons, circles, rounded rects, flow lines), import as SVG into Figma, then add precise blue fills and text natively in Figma.

Do NOT try to create hand-drawn wobble with Figma vectorPaths — the effort-to-quality ratio is terrible. Quiver produces natural organic paths in one generation.

### When to use Quiver vs Figma native

| Situation | Tool | Why |
|---|---|---|
| **Hand-drawn containers** (hexagons, circles, card frames, flow lines) | **Quiver** | Organic wobble is Quiver's strength. Always generate containers with Quiver. |
| **Precise filled icons** inside containers | **Figma** | Clean geometric shapes (ellipses, rectangles, simple paths) are faster in Figma |
| **Text labels and content** | **Figma** | Real editable text via TextNode + setRangeFills for code |
| New illustration with complex organic shapes | **Quiver** | Full illustration generation with `--references` for style matching |
| Recomposing existing illustration elements | **Figma** | Clone from Brand Assets, rearrange, re-color |
| Code editor mockup | **Figma** | Text needs to be real text (setRangeFills), not vector outlines |
| Data visualization (charts, graphs) | **Figma** | Use the data-visualization.md recipes for precise data |
| Visual metaphor (abstract concept) | **Quiver** | Creative interpretation benefits from AI generation |

### Dot grid backgrounds

Some Inkeep illustrations use a subtle dot grid as background texture. Build in Figma:

```javascript
// Create a dot grid at 3% opacity across a container
const container = await figma.getNodeByIdAsync('CONTAINER_ID');
const gridSpacing = 16; // 16px between dots
const dotSize = 2;

for (let x = gridSpacing; x < container.width; x += gridSpacing) {
  for (let y = gridSpacing; y < container.height; y += gridSpacing) {
    const dot = figma.createEllipse();
    dot.resize(dotSize, dotSize);
    dot.x = x - dotSize/2;
    dot.y = y - dotSize/2;
    dot.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }]; // light gray
    dot.opacity = 0.03; // 3% — barely visible
    container.appendChild(dot);
  }
}
```

**Important:** For large containers this creates many nodes. For thumbnails (1280×720 working canvas), a dot grid with 16px spacing = ~3,600 dots. This is fine for Figma but takes a few seconds to create. Build the dot grid ONCE, then clone the container if you need it in multiple frames.

**Alternative:** For very large grids, create a small tile (e.g., 64×64 with 4 dots) and use it as a pattern fill — but Figma's pattern fill API is limited. The brute-force dot approach is simpler and reliable.

### Hybrid workflow: Quiver → Figma

For most illustrations in marketing graphics:

1. **Generate the illustration with Quiver** using the `--instructions` template above
2. **Import into Figma** via `figma.createNodeFromSvg(svgString)`
3. **Compose in Figma** — add the illustration into a blog cover, social post, or slide alongside brand text, badges, and logos
4. **Apply brand consistency** — verify colors match the palette exactly. Quiver may approximate; correct in Figma if needed.

Use `--references` with an existing Inkeep illustration PNG to guide style matching:
```bash
# Export an existing illustration from the site as reference
curl -sL -o /tmp/inkeep-ref.png "https://inkeep.com/images/use-cases/b2b-customer-support-card-image.svg"
sips -s format png -Z 800 /tmp/inkeep-ref.png --out /tmp/inkeep-ref-800.png

# Generate new illustration matching the style
bun tools/quiver-generate.ts generate \
  --prompt "Hand-drawn hexagonal grid with precise blue Slack hash icon in center, radiating connection lines to channel name labels" \
  --references /tmp/inkeep-ref-800.png \
  --instructions "Match the illustration style of the reference exactly. Use #3784FF for precise fills, #231F20 at 20% for hand-drawn containers. No shadows, no gradients." \
  --output slack-agents-illustration.svg
```

---

## Scale relationships

Measured from the existing illustrations:

| Element | Size relative to canvas | Notes |
|---|---|---|
| Primary container (hexagon, card) | 30-40% of canvas width | The dominant structural element |
| Icons inside containers | 40-60% of container width | Icon fills most of the container space |
| Secondary containers | 60-80% of primary container | Smaller, background depth |
| Connecting lines | 2-3px stroke weight | Standard weight, not thin |
| Dot grid spacing | ~12-16px between dots | Regular, subtle, 3-5% opacity |
| Total element count | 3-7 per illustration | Never more than 7 — restraint over complexity |

---

## Fidelity expectations

Quiver with `--references` + the style instructions above produces illustrations at **80-90% fidelity** to the existing hand-drawn style. The wobble, stroke weight, and overall aesthetic will be stylistically consistent — but not stroke-for-stroke identical to existing illustrations. This is inherent to hand-drawn style: no two hand-drawn illustrations are identical by definition.

| Context | Fidelity needed | Approach | Expected result |
|---|---|---|---|
| **Standalone graphic** (blog cover, social post, slide) | Style-consistent is sufficient | Quiver with reference + instructions | Excellent — no side-by-side comparison |
| **In a grid alongside existing illustrations** (new use case card) | Higher — should feel like the same artist | Quiver with 2-3 references from the same grid + low temperature (0.4) + detailed instructions | Good — slight style drift acceptable, may need Figma touch-up on stroke weights |
| **Replacing an existing illustration** | Highest — must match exactly | Generate with Quiver, then refine in Figma or flag for designer review | Agent produces 80% draft; designer polishes the last 20% if needed |

**The reference image workflow is the key to consistency.** See `tools/quiver.md` § "Reference images" for the full technical details on how references work (visual conditioning via Vision Transformer, what transfers well, best practices for temperature and image sizing).

### Compounding consistency across a set

When generating multiple illustrations that need to feel like a set (e.g., 6 use case cards):

1. Generate the FIRST illustration with careful prompting + instructions
2. Visually inspect — if good, use it as `--references` for the SECOND illustration
3. Use both the first AND second as references for the third
4. Continue compounding — each generation gets the benefit of all prior outputs as style references
5. Keep temperature at 0.4-0.5 throughout

This produces a tighter style cluster than generating all 6 independently.
