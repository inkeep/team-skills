Use when: Creating illustrations, decorative graphics, visual metaphors, or any graphic that uses the Inkeep hand-drawn illustration style
Priority: P0
Impact: Off-brand illustrations that don't match the existing visual language on the marketing site

---

# Inkeep Illustration System

Inkeep's illustration style is built on a principle called **"Imperfect Precision"**: hand-drawn containers provide warmth and approachability, while precise filled icons inside them communicate clarity and technical confidence. The scaffolding is human; the content is AI.

This reference covers the visual vocabulary, construction rules, composition patterns, and Quiver generation instructions needed to produce illustrations that match the existing marketing site.

---

## The dual-stroke language

Every Inkeep illustration uses exactly TWO visual languages in the same image:

### Layer 1: Hand-drawn containers (gray, imprecise)

The structural scaffolding — hexagons, circles, rounded rectangles, card frames, flow lines.

| Property | Value | Notes |
|---|---|---|
| **Stroke color** | `#231F20` (text/primary) | Never blue, never another color |
| **Stroke opacity** | 15-30% | Very faint — these are guidelines, not bold outlines |
| **Stroke width** | 1.2-2.8px (variable) | The variation IS the hand-drawn feel |
| **Linecap** | Round | Always round, never square/butt |
| **Fill** | None, or `#F7F4ED` (bg/surface) at ~80% opacity | Containers are transparent or very lightly filled |
| **Path quality** | Slightly irregular | Avoid perfectly geometric shapes. Organic wobble on straight edges. Corners not perfectly sharp. |
| **Depth** | Line weight variation only | No drop shadows. Thicker strokes = foreground, thinner = background |

### Layer 2: Precise filled elements (blue, exact)

The meaningful content inside the containers — icons, symbols, UI elements, data shapes.

| Property | Value | Notes |
|---|---|---|
| **Fill color** | `#3784FF` (brand/primary) | Solid fill, no stroke |
| **Fill opacity** | 1.0 (full) | Confident, not tentative |
| **Path quality** | Clean, geometric, precise | These ARE perfect shapes — circles are circular, lines are straight |
| **No stroke** | — | Filled elements never have outlines |
| **Secondary fill** | `#E5AE61` (golden amber) | Warm accent for secondary data/highlights. Used sparingly (~20% as often as blue) |

### The contrast is the point

The tension between rough gray containers and clean blue fills is what makes the style distinctive. If everything is precise, it looks corporate. If everything is rough, it looks sketchy. The combination says "human-guided technology."

---

## Color palette (strict — only these colors)

| Role | Hex | Token | Usage frequency |
|---|---|---|---|
| **Primary fill** | `#3784FF` | brand/primary | ~50% of all colored elements |
| **Structure** | `#231F20` at 15-30% opacity | text/primary | All containers and outlines |
| **Warm accent** | `#E5AE61` | brand/golden-sun variant | ~10% — secondary data, warm highlights |
| **Container fill** | `#F7F4ED` | bg/surface | Container interiors |
| **Blue wash** | `#D0E1FF` or `#E1EBFB` | brand/crystal-blue / illustration/wash-blue | Soft background areas |
| **Warm wash** | `#FFE6C2` | brand/accent-warm variant | Secondary background fills |
| **Navy** | `#2D4770` | — | Deep accent, very rare |
| **Code purple** | `#7C65ED` / `#A297E9` | — | Code syntax only |
| **Code green** | `#65BB61` | — | Code syntax only |

**Hard rule:** No other colors. No gradients. No drop shadows. No glows. Depth is created ONLY through line weight variation and layering.

---

## Composition patterns (5 types observed)

### Pattern 1: Hexagonal icon grid

**Used in:** Use case cards (B2B support, product teams)

- 3-5 hexagons arranged in a staggered grid
- Each hexagon: hand-drawn gray stroke, ~40-60px diameter in the card
- Inside each hexagon: one precise blue icon representing a concept
- Hexagons slightly different sizes (not uniform — hand-drawn feel)
- Diagonal arrangement, not a rigid grid — creates energy

**Canvas:** ~256 × 98 (wide landscape card format)

### Pattern 2: Flow diagram

**Used in:** Documentation teams card, developer no-code view, agent workflow

- Left-to-right or top-to-bottom flow
- Nodes: hand-drawn rounded rectangles with cream fill
- Connections: hand-drawn curved lines with slight wobble
- Flow arrows: blue filled arrowheads, hand-drawn stems
- Center focal element: larger, more detailed (often a blue-filled circle)

**Canvas:** Varies (256×98 for cards, 557×432 for developer panels)

### Pattern 3: Product UI mockup

**Used in:** Developer TS view, visual builder, agent workforce panels

- Outer container: large rounded rectangle with hand-drawn gray stroke, cream/white fill
- Dot grid background inside the container (~3-5% opacity gray dots)
- Content: mix of text and small UI elements
- For code editors: rounded rect with very light gray fill, multi-color syntax text
- For flow diagrams: white card nodes connected by gray curved paths with blue arrowheads

**Canvas:** ~560-650 × 430-610 (roughly 4:3 to 16:10)

### Pattern 4: Data visualization

**Used in:** Key benefits (audits, reporting)

- Outer panel: light blue wash background (#D8E6FC area), hand-drawn gray container edge
- Chart elements: bubble charts (blue + golden circles at varying sizes), radar charts (blue + golden polygon overlays), bar charts (blue bars with hand-drawn edges)
- Data labels: clean dark text (#231F20), small sans-serif
- Secondary cards stacked or overlapping the primary card

**Canvas:** 650 × 838 (portrait — tall card format)

### Pattern 5: Two-element scene

**Used in:** Sales card (two avatars with waveform), documentation card (input → sync → output)

- Two focal elements on opposite sides (left and right)
- Connecting element in the center (waveform, arrow, sync icon)
- Both focal elements use the hand-drawn circle/container
- Center element: precise blue fill
- Minimal — only 3 elements total

**Canvas:** 256 × 98 (wide card)

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

TWO visual layers that MUST coexist:
1. CONTAINERS: Hand-drawn, slightly irregular outlines in dark gray at low opacity.
   Hexagons, circles, rounded rectangles — all with organic wobble, never perfectly
   geometric. Stroke only (no fill, or very light cream fill). These are faint
   scaffolding, not bold outlines.
2. CONTENT: Precise, clean, geometric icons and symbols INSIDE the containers.
   Solid blue (#3784FF) fill, no stroke. Person icons, globe icons, document icons,
   gear icons, chat bubbles — whatever represents the concept. These are confident
   and exact.

The contrast between rough containers and precise fills IS the style.

Colors (ONLY these):
- Blue: #3784FF (primary fills for icons and active elements)
- Dark gray: #231F20 at 15-20% opacity (container outlines only)
- Golden amber: #E5AE61 (secondary accent, use sparingly)
- Light blue wash: #D0E1FF (background fill areas)
- Cream: #F7F4ED (container interior fills)

Rules:
- No drop shadows
- No gradients
- No photorealistic elements
- Generous whitespace
- Round linecaps on all strokes
- Line weight variation for depth (thicker = foreground)
- Maximum 5-7 distinct elements per illustration
- Flat, minimal, hand-drawn technical style
```

### Quiver `--prompt` examples

| Content | Prompt |
|---|---|
| Use case: customer support | "Hand-drawn hexagonal containers in faint gray, arranged diagonally. Inside each: a precise blue icon — a chat bubble, a person silhouette, a checkmark, a document. Connected by faint dotted lines. Minimal, airy, generous whitespace." |
| Feature: agent workflow | "Left-to-right flow diagram. Hand-drawn rounded rectangle nodes with cream fill. Blue arrows connecting them. First node has a lightning bolt icon, middle node has a gear, last node has a checkmark. Faint dot grid background." |
| Concept: security/permissions | "A hand-drawn shield outline (slightly irregular, gray) centered on a hexagonal grid background (faint gray). Inside the shield: a precise blue lock icon. Orbit rings (hand-drawn gray curves) around the shield." |
| Concept: data analytics | "Two overlapping hand-drawn card panels. Front panel: a bubble chart with blue and golden circles of varying sizes. Back panel: a radar/spider chart with blue and golden polygons. Faint gray card outlines, light blue wash background." |

### The key construction question: how to get the "hand-drawn" quality

The dual-stroke language requires organic, slightly irregular paths for containers — hexagons that aren't perfectly geometric, circles with subtle wobble. An agent building in Figma natively will produce rigid, perfect shapes. This is wrong — it loses the entire "imperfect" half of "Imperfect Precision."

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

Many Inkeep illustrations use a subtle dot grid as background texture. Build in Figma:

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
| Connecting lines | 1-3px stroke weight | Thin, faint — structure not content |
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
