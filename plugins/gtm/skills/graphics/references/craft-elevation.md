Use when: Phase C (per-atom craft check during build), Phase D (depth stack count during composition), and Phase E (3-pass self-critique elevation loop). First loaded at Phase C — before building atoms — so elevation strategies are available from the start of construction, not just during post-build review.
Priority: P0
Impact: Without this, the model produces structurally correct but visually flat output. Elements meet the spec but lack the richness, depth, and craft that distinguish professional design from mechanical execution.

---

# Craft Elevation Guide

## Governing principle

**The Build Spec is your floor, not your ceiling.** Meeting success criteria means the graphic is correct — not that it's done. Every self-critique iteration should push elements from correct → rich → exceptional. The goal is not "does this pass?" but "is this the best this element can be given the method and context?"

**The horse-drawing problem:** Without explicit craft intent, models front-load effort on the first few elements and progressively simplify everything else. A Slack mockup gets a detailed header but generic message bubbles. A blog cover gets a polished headline but a flat background. Every element must receive the same craft investment — there are no "background" elements that deserve less attention.

**Relationship to the reviewer:** The reviewer (`prompts/visual-evaluation.md`) independently evaluates brand compliance and craft quality AFTER you submit. This guide is your self-critique tool — what you use DURING construction and the elevation loop to catch issues before the reviewer sees them. The reviewer checks whether rules were followed and craft is present; this guide tells you what to ADD and what AI-characteristic mistakes to FIX. The AI failure mode callouts below are patterns the reviewer will catch and NEEDS REVISION — better to fix them yourself than have the reviewer send you back.

**Two modes of elevation:**
1. **Add new atoms** — introduce sub-elements, decorative details, accent icons, textural layers, or brand signature elements that weren't in the Build Spec but make the composition richer
2. **Elevate existing atoms** — push each element from "Correct" (meets spec) to "Elevated" (exceptional craft)

Both modes apply at every self-critique pass. A composition that has all its spec elements at "Elevated" but no decorative depth is still flat. A composition with rich decoration but sloppy core elements is still weak. The strongest graphics combine 5-7 richness techniques simultaneously.

For specific brand tokens, hex values, stroke weights, illustration techniques, and composition patterns referenced below, consult `/brand` (loaded at Step 3). This file tells you WHAT to consider and WHY — the brand system tells you HOW with exact values.

---

## Visual depth stack

Every composition should have multiple visual layers that create depth and richness. Missing layers are the primary cause of "flat" output.

| Layer | What it adds | Without it | How to add it (see `/brand` for exact values) |
|---|---|---|---|
| **1. Background texture** | Subtle grain, gradients, noise, pattern — never a flat solid fill | Looks like a PowerPoint slide | Dot grid at low opacity, radial gradient from bg/primary, hexagonal tessellation, dashed grid for technical content |
| **2. Atmospheric depth** | Light wash fills, ambient glow, color zone shifts between areas | Elements float on a flat plane | Blue wash behind focal element, warm wash behind secondary zone, radial light bloom from primary visual element |
| **3. Structural elements** | Cards, containers, dividers with proper shadows and brand radius | Content has no visual hierarchy | Cards with brand radius (32px+), brand shadow (blue-tinted glow), stacked overlapping panels at slight offset for data-rich areas |
| **4. Content** | Text, mockups, illustrations, data — the core information | Empty frame | (This is the Build Spec — it should already exist) |
| **5. Accent details** | Decorative lines, brand signature elements, icons, color pops | Feels sterile and corporate | Blue swoosh underline, hand-drawn dash separators, dot connector lines, category badges, Lucide icons with semantic color coding |
| **6. Interaction cues** | Overlapping elements, perspective, edge bleed, depth-of-field | Static and lifeless | 2-5° rotation on mockups, element bleed past edge, stacked card panels overlapping, orbit ring curves around focal element |

**Self-check:** Count the layers in your composition. If it's ≤3, it will look flat. Most 10/10 graphics have 5-6 active layers.

---

## Additive elevation: atoms you can introduce

These are sub-elements and details you can ADD during self-critique to increase richness. They go beyond the Build Spec. Scan this list during Pass 2 and ask: "Which of these would make this specific graphic richer?"

### Brand signature elements (see `content-types/illustration.md` for specs)
- **Blue swoosh underline** — the most distinctive Inkeep brand element. Should appear on every graphic with a headline unless intentionally minimal. Underlines the value/emotion word, not the product name. Generate via Quiver or hand-coded SVG.
- **Hand-drawn dash separator** — two overlapping curved lines for section dividers. Adds organic warmth between text sections.
- **Dot connector lines** — hand-drawn line with dots for timeline/connection/flow elements.
- **Orbit ring curves** — elliptical strokes wrapping around a focal element. Adds energy and draws the eye inward.

### Decorative icons and badges (see `/brand` element-patterns for specs)
- **Category badge** — JetBrains Mono uppercase (NEW, FEATURE, GUIDE, INTEGRATION, UPDATE). Small — 1/8 the visual weight of the heading.
- **Lucide icons** with semantic color coding — blue for AI/system, golden for human/user, green for success. Inside icon containers with brand background fill.
- **Status badges** with color-coded states for any UI that shows process status.
- **Checkmark badge** on completed/verified cards.

### Structural detail that adds density
- **Stacked overlapping card panels** — 2-4 cards at slight offset. The single most effective depth technique for data-rich compositions.
- **Code snippet blocks** — 3-8 lines of realistic SDK/API code on dark background with brand syntax highlighting. Show the "money line" — the most compelling operation.
- **Metric stat cards** — large number in brand primary on dark background for data callouts.
- **Citation pills** for reference/source indicators.

### Textural background elements (see `/brand` composition-guide for techniques)
- **Dot grid** — low opacity, regular spacing. Prevents flat-background syndrome.
- **Hexagonal tessellation** — adds technical/security atmosphere.
- **Dashed grid** — adds engineering/documentation feel.
- **Light bloom** — radial gradient from a visual element. Creates focal glow.

### Inside product mockups (sub-sub-elements)
- **Tab bar** with active/inactive states
- **Loading indicators** (bouncing 3-dot pattern)
- **Multiple text lines at varying lengths** — implies real content, not a placeholder block
- **Real data values** contextual to the graphic's message
- **Window chrome** — proper toolbar, actual button styles
- **Scroll indicator** or content continuation hint (fade at bottom)

---

## Per-element elevation strategies

For each element type, what separates "Correct" from "Elevated." Evaluate each element during self-critique.

### Backgrounds
| Correct | Elevated |
|---|---|
| Solid brand color fill | Subtle gradient with texture overlay (dot grid or noise at low opacity) |
| Single flat fill | Layered: base gradient + geometric pattern at low opacity + atmospheric wash behind focal element + vignette at edges |

### Typography
| Correct | Elevated |
|---|---|
| Right font, right size, right color | Deliberate letter-spacing (tighter on headings, looser on labels), optical alignment, weight contrast between hierarchy levels, proper leading |
| Text placed in the layout | Text that creates visual rhythm — headline dominates (10x badge weight), subhead breathes, body recedes. Blue swoosh underline on key word. JetBrains Mono uppercase for all labels/badges. |

### Product mockups / UI recreations
| Correct | Elevated |
|---|---|
| Rectangles with text approximating UI | Realistic chrome — toolbar, button styles, status bar, tab bar with active state, contextual content matching the key message |
| Flat screenshot in a rectangle | Styled with brand shadow (blue-tinted glow), slight rotation, generous corner radius, element bleeds past canvas edge. UI internals at 1.5-2x "poster scale" for thumbnail readability. |
| Generic placeholder data | Contextually relevant content — real values, real names, realistic text. Lucide icons with semantic color. Loading indicators and state badges for active UI feel. |
| Single panel | Stacked overlapping panels — sidebar + main content, or multiple feature views layered at slight offset |

### Illustrations (Quiver)
| Correct | Elevated |
|---|---|
| Illustration that matches the prompt | Three-tier color depth — gray scaffolding recedes (10-30% opacity), blue focal elements draw the eye (100%), precise fills carry meaning. Intentional color weight distribution. |
| Single-style flat illustration | Dual-stroke brand language (hand-drawn gray containers + precise blue fills), stroke weight hierarchy (default → focal emphasis → distance), organic wobble on containers |
| Illustration in isolation | Illustration with accent details — small dot connectors between elements, curved connector lines, orbit ring curves for energy |

### Icons and logos
| Correct | Elevated |
|---|---|
| Logo placed in layout | Logo in context — on a card with proper padding, or inside a circle with subtle shadow, integrated into the visual hierarchy |
| Single flat icon | Icon with semantic color coding, inside an icon container with brand background fill. Consistent visual weight relative to siblings via optical sizing. |
| Icons as afterthought | Icon set telling a story — each icon represents a specific step/feature, with matching container style and consistent sizing |

### Cards and containers
| Correct | Elevated |
|---|---|
| Rectangle with rounded corners | Card with brand radius (32px+), appropriate shadow (brand shadow for product elements, subtle for content), internal padding following brand spacing tokens |
| Same card style repeated | Cards rotating through brand card color palette (peach, gray, blue, purple), creating visual rhythm while maintaining structural consistency |
| Single layer of cards | Stacked overlapping panels at slight offset — the primary depth technique for data-rich areas |

### Diagrams and flow elements
| Correct | Elevated |
|---|---|
| Boxes connected with lines | Nodes styled as proper cards with shadow and brand radius, color-coded by semantic role (blue for AI, golden for user, neutral for output) |
| Flat arrows | Curved connector lines with small dot endpoints. Consistent curvature. Hub-and-spoke pattern with atmospheric wash behind focal hub. |
| Nodes as plain rectangles | Nodes with icon containers (Lucide icon + brand background), internal detail (metric label, state badge), stroke weight hierarchy for depth |

### Image Gen elements
| Correct | Elevated |
|---|---|
| Generated image placed as background fill | Image composited with Figma overlays — gradient fade at edges, brand-colored glow effects, elements bridging generated and native layers |
| Single prompt, first result accepted | Iterative prompting with reference images from the brand system, specific material/lighting descriptions, multiple attempts with best selected |

---

## AI failure mode callouts: product mockups

Product mockups and UI recreations are where AI models struggle most. These are the specific patterns to watch for during self-critique — they're characteristic of AI-generated mockups vs designer-built ones.

**Failure: "Rectangles with labels" syndrome**
The model creates colored rectangles with text inside them and calls it a UI. A Slack thread becomes gray boxes with names. A dashboard becomes rectangles in a grid. This is the #1 failure — the model satisfies "this element exists" without achieving "this element looks like the real UI."
→ **Fix:** Every UI element must have its real visual treatment. A Slack message has: avatar (circular, with image or initials), username (bold) + timestamp (muted, smaller), message text (different font weight from the name), and specific padding/spacing that Slack uses. A button has: specific corner radius, specific padding, specific font size, hover state implied by shadow. Compare against the visual reference from Step 1c — if you don't have one, you're improvising, and this failure is almost guaranteed.

**Failure: Generic/placeholder content**
The model fills mockups with "Lorem ipsum," "User Name," "Item 1, Item 2, Item 3," or round numbers like "100" and "50%." Real product UI has irregular, contextual data.
→ **Fix:** Content must tell the same story as the graphic's key message. If the graphic is about "Agents in Slack," the messages should be realistic agent interactions — a user asking a product question, the agent responding with a specific answer, approve/deny buttons for a tool call. If showing metrics, use plausible irregular numbers (847, 23.4%, 12ms) not round placeholders (100, 50%, 0ms).

**Failure: Missing UI chrome**
The model builds the content area but skips the container — no window titlebar, no tab bar, no status indicators, no scroll position hint. The mockup looks like a wireframe, not a product.
→ **Fix:** Every mockup needs its chrome layer. For a chat interface: header bar with channel/conversation name + status. For a dashboard: sidebar navigation with active state. For a web app: browser chrome or at minimum a top bar. For mobile: status bar + home indicator. These frame the content and signal "this is a real product."

**Failure: Wrong proportions and spacing**
The model uses arbitrary spacing — too much padding, elements too far apart, text too large relative to the container. Real product UI is denser than marketing layouts. A chat message bubble has 8-12px padding, not 24px. A sidebar has compact 32px row height, not spacious 56px.
→ **Fix:** Product mockups use product tokens (Inter font, white/dark backgrounds, 6-8px border radius, compact spacing) — NOT marketing tokens (Neue Haas, cream backgrounds, 32px radius, generous spacing). The two-layer rule: product tokens INSIDE the mockup, marketing tokens OUTSIDE (the shadow, rotation, corner radius of the mockup frame itself). See `/brand` product-representation and element-patterns references.

**Failure: Flat single-panel presentation**
The model places the mockup as a flat rectangle on the canvas. No depth, no context, no visual interest.
→ **Fix:** Apply the mockup treatment recipe from `/brand` element-patterns: float the mockup with brand shadow (blue-tinted glow), add 2-5° rotation for dynamism, use generous corner radius (32px) on the outer frame, let the mockup bleed past the canvas edge for energy. For data-rich mockups, use stacked overlapping panels (sidebar + main, or multiple views layered at offset).

---

## AI failure mode callouts: illustrations

Illustrations using the Inkeep brand system are the second-hardest content type. The three-tier visual language is specific and the model tends to simplify it.

**Failure: Flat single-tier illustrations**
The model generates illustrations that are all one visual tier — either everything is the same opacity/weight (no depth hierarchy), or everything is solid blue (no scaffolding). The three-tier system (gray scaffolding → blue focal → solid fills) is what creates the brand's distinctive depth, and it's the first thing the model drops.
→ **Fix:** Every illustration must use ALL three tiers. Check: (1) Are there gray containers at 10-30% opacity forming the background scaffolding? (2) Are there blue-stroke containers at 100% opacity as the focal elements? (3) Are there solid blue fills carrying the meaningful content (icons, data shapes)? If any tier is missing, the illustration is incomplete. Load `content-types/illustration.md` for the exact tier specs.

**Failure: Inconsistent or wrong stroke weights**
The model uses uniform stroke weight everywhere, or uses weights that don't match the hierarchy (thick strokes on background elements, thin strokes on focal ones — the opposite of correct).
→ **Fix:** Stroke weight creates the hierarchy: 1.5px for distant/background elements, 3px for standard elements (the default), 4px for emphasis, 6px for focal-point emphasis only. Butt linecaps (NONE), never round. If everything is the same weight, the illustration has no depth. Variable 1.8-2.8px wobble for hand-drawn organic quality.

**Failure: Too few elements / too sparse**
The model creates an illustration with 2-3 elements when the composition needs 5-7 to feel rich. A "hub-and-spoke" diagram has a center and 2 spokes instead of 4-5. A product illustration shows one panel instead of a layered composition.
→ **Fix:** Brand illustrations typically have 5-7 distinct visual elements (not counting decorative accents like dot connectors). Count the elements — if you have fewer than 4, the illustration will feel sparse. Add: satellite elements around the focal point, connecting lines with dot endpoints, secondary containers that provide context, accent elements that add visual density without competing for attention.

**Failure: Generic shapes instead of semantic content**
The model uses circles, squares, and lines as abstract placeholders. A "notification" is represented by a circle. A "document" is a rectangle. These carry no meaning.
→ **Fix:** Shapes must be semantically meaningful. A notification is an icon with a dot badge. A document is a rectangle with horizontal lines implying text. A user is a simple avatar (circle with head/shoulders silhouette). A message is a speech bubble with line-lengths. Each shape should communicate WHAT it represents, not just THAT something exists. Use Lucide icons inside containers for maximum semantic clarity.

**Failure: Missing accent and connector details**
The model builds the main elements but skips the connective tissue — no lines between nodes, no dot endpoints, no orbit rings, no swoosh. The illustration looks like scattered objects, not a connected system.
→ **Fix:** Add connecting elements: curved lines (3px blue stroke) between related elements, small dots (4-6px filled circles) at connection points, orbit ring curves around the focal element. These connective details are what make the illustration feel like a coherent system rather than a collection of shapes. The brand illustration system relies heavily on connectors — check any illustration on the marketing site.

---

## Contextual elevation reasoning

Elevation strategies must derive from the specific graphic. During self-critique, reason from:

1. **The Creative Brief** — Developer audience earns richness from code-as-visual (syntax-highlighted blocks with brand palette), monospace craft, technical precision. Executive audience earns it from data visualization, bold metric callouts, editorial composition.

2. **The format** — Blog cover at 300px in a social feed needs visual punch — blue swoosh, bold heading, clear focal element. Slide graphic needs whitespace and restraint — fewer accent details, more breathing room.

3. **The content** — Comparison graphic: accurately represent both brands (real logos, real colors via fetch-brand.ts). Product mockup: realistic UI chrome, contextual data, poster-scale internals. Architecture diagram: color-coded nodes, meaningful connector patterns, hub-and-spoke focal structure. Abstract concept: brand illustration system's dual-stroke language with three-tier color depth.

4. **The brand system** — Inkeep's richness levers: warm cream + strategic blue accents, hand-drawn illustration language ("imperfect precision"), generous corner radii (32-54px), layered card system with rotating accent colors, blue swoosh signature element, three-tier color depth hierarchy. Using these intentionally (not just correctly) is what makes it feel crafted.

---

## Self-critique elevation prompts

### Pass 1 focus: "Is it correct?"
- Does each element meet the Build Spec's success criteria?
- Are brand tokens applied correctly?
- Do compound elements have all their sub-elements?

### Pass 2 focus: "Is it rich?"

**Additive scan — what can I introduce?**
- Does the headline have the blue swoosh underline?
- Is there a category badge? (If the content has a category.)
- Are there accent icons with semantic color coding where they'd help readers parse at a glance?
- Is there a background texture layer? (Anything that prevents a flat fill.)
- Is there an atmospheric wash behind the focal element?
- For mockups: are there sub-sub-elements that add realism? (Tab bar states, loading indicators, real data, scroll hints, window chrome.)
- For diagrams: are there dot connectors, curved lines, color-coded node roles?
- Are structural elements using stacked overlapping panels for depth?
- Is there at least one brand signature element (swoosh, hand-drawn dash, orbit rings)?

**Elevation scan — is each element at its best?**
- How many layers in the visual depth stack? If ≤3, what's missing?
- For each Tier 2 atom: compare against the "Elevated" column. Are you at "Correct" or "Elevated"?
- Is typography creating visual rhythm, or is everything similar weight?
- For mockups: is content realistic and contextual? Is UI at poster scale (1.5-2x)?
- For illustrations: are they using the three-tier color depth hierarchy, or just flat fills?
- Are cards rotating through the brand color palette, or all the same?

### Pass 3 focus: "Is it cohesive and polished?"
- Does the entire composition feel like one unified piece?
- Is the three-tier color system working? (Gray recedes, blue draws the eye, fills carry meaning.)
- Are shadows, colors, and lighting consistent across all elements?
- Are spacing values from brand tokens?
- At 400px thumbnail: does the hierarchy hold? Is the swoosh visible?
- Does the composition fill 80-85% of the canvas?
- Do elements bleed past the edge where appropriate?
- Would this look at home next to a Stripe, Linear, or Vercel marketing graphic?
