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
| **5. Accent details** | Decorative lines, brand accents, icons, color pops | Feels sterile and corporate | Category badges, Lucide icons with semantic color coding, hand-drawn dash separators, dot connector lines, optional blue swoosh underline (predefined asset only) |
| **6. Interaction cues** | Overlapping elements, perspective, edge bleed, depth-of-field | Static and lifeless | 2-5° rotation on mockups, element bleed past edge, stacked card panels overlapping, orbit ring curves around focal element |

**Self-check:** Count the layers in your composition. If it's ≤3, it will look flat. Most 10/10 graphics have 5-6 active layers.

---

## Additive elevation: atoms you can introduce

These are sub-elements and details you can ADD during self-critique to increase richness. They go beyond the Build Spec. Scan this list during Pass 2 and ask: "Which of these would make this specific graphic richer?"

### Brand signature elements (see `content-types/illustration.md` for specs)
- **Blue swoosh underline** — optional brand accent. If used, import the predefined PNG asset from `/icons/line-curve-blue.png` and resize to fit the underlined word. Do NOT generate programmatically. Underlines the value/emotion word, not the product name.
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
| Text placed in the layout | Text that creates visual rhythm — headline dominates (10x badge weight), subhead breathes, body recedes. JetBrains Mono uppercase for all labels/badges. Optionally add blue swoosh underline on key word (predefined asset only). |

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
→ **Fix:** Every illustration must use ALL three tiers. Check: (1) Are there gray containers at 10-30% opacity forming the background scaffolding? (2) Are there blue-stroke containers at 100% opacity as the focal elements? (3) Are there solid blue fills carrying the meaningful content (icons, data shapes)? If any tier is missing, the illustration is incomplete. **Load:** `content-types/illustration.md` file for the exact tier specs.

**Failure: Inconsistent or wrong stroke weights**
The model uses uniform stroke weight everywhere, or uses weights that don't match the hierarchy (thick strokes on background elements, thin strokes on focal ones — the opposite of correct).
→ **Fix:** Stroke weight creates the hierarchy: 1.5px for distant/background elements, 3px for standard elements (the default), 4px for emphasis, 6px for focal-point emphasis only. Butt linecaps (NONE), never round. If everything is the same weight, the illustration has no depth. Variable 1.8-2.8px wobble for hand-drawn organic quality.

**Failure: Too few elements / too sparse**
The model creates an illustration with 2-3 elements when the composition needs 5-7 to feel rich. A "hub-and-spoke" diagram has a center and 2 spokes instead of 4-5. A product illustration shows one panel instead of a layered composition.
→ **Fix:** Brand illustrations typically have 5-7 distinct visual elements (not counting decorative accents like dot connectors). Count the elements — if you have fewer than 4, the illustration will feel sparse. Add: satellite elements around the focal point, connecting lines with dot endpoints, secondary containers that provide context, accent elements that add visual density without competing for attention.

**Failure: Geometric shapes as placeholders (the #1 "looks AI-generated" tell)**
The model uses circles, squares, and lines as abstract placeholders for things that should have real visual treatment. This is the single most visible craft failure — it instantly signals "a machine made this, not a designer." Common instances:

| AI builds... | Should be... |
|---|---|
| Colored circle → avatar | Illustrated portrait/silhouette (Quiver) or Lucide `user` icon in styled container |
| Plain rectangle → document/card | Card with internal content — text lines at varying lengths, icons, data values |
| Circle/square → icon | Semantic Lucide icon (1700+ available) in branded container with background fill |
| Colored dot → status | Badge with specific icon (checkmark, clock, warning) + label in JetBrains Mono |
| Empty rectangle → image area | Actual image fill (screenshot, generated image, or golden-stroke image placeholder from illustration system) |
| Plain lines → connectors | Curved paths with dot endpoints and directional arrows at brand stroke weight |
| Solid rectangle → button | Styled button with label text, proper padding, corner radius, shadow |
| Colored bar → chart element | Data bar with value label, proper width proportional to data, brand color token |
| Circle → logo/brand mark | Real logo asset cloned from Brand Assets or fetched via `fetch-logo.ts` |
| Rectangle with text → UI element | Proper UI chrome — toolbar, status bar, tab bar with active state, realistic content |

→ **Fix:** Every sub-element should "look like" the thing it represents, not "represent" it abstractly. If you catch yourself building a shape that stands in for something, that's the signal to elevate. Use Lucide icons inside containers for semantic clarity. Use Quiver for illustrated elements that need organic/hand-drawn quality. Use real assets for logos and brand marks. The rule: if a designer would look at the element and say "that's a placeholder," it's not done.

**Failure: Missing accent and connector details**
The model builds the main elements but skips the connective tissue — no lines between nodes, no dot endpoints, no orbit rings. The illustration looks like scattered objects, not a connected system.
→ **Fix:** Add connecting elements: curved lines (3px blue stroke) between related elements, small dots (4-6px filled circles) at connection points, orbit ring curves around the focal element. These connective details are what make the illustration feel like a coherent system rather than a collection of shapes. The brand illustration system relies heavily on connectors — check any illustration on the marketing site.

---

## AI failure mode callouts: arrows, connectors, and flow diagrams

Arrows and curved connectors are where AI models fail most visibly — a single sign error in a tangent vector reverses the curve entirely, and the model can't see the result. These failures are specific to programmatic Figma construction via `figma_execute`.

**Failure: Straight lines where curves are needed**
The model defaults to `vectorPaths` with `M...L` (straight line) for all connectors because that's the simplest recipe. In hub-and-spoke and radial layouts, straight spokes cross over each other. In flow diagrams, straight connectors overlap with nodes they pass near.
→ **Fix:** Use the curved arrow recipe in `tools/figma-console.md` — `vectorNetwork` with non-zero `tangentStart`/`tangentEnd`. Default curvature factor to 0.2-0.3 for any non-trivial layout. Only use zero tangents for explicitly straight connectors.

**Failure: Star pattern instead of circular flow**
In circular/radial process flows, the model computes tangent direction as pointing from each node toward the next node (along the chord). The resulting curves cut across the circle interior, forming a star/asterisk pattern instead of arcs following the circle.
→ **Fix:** Tangent direction must be **perpendicular to the radius** at each node: `angle + π/2` for clockwise, `angle - π/2` for counter-clockwise. Use the circular flow recipe in `tools/figma-console.md`. This is the #1 failure mode — always verify circular flows with a screenshot.

**Failure: Wrong tangent direction (curve loops backward)**
The model sets `tangentStart` pointing away from the target instead of toward it, causing the bezier curve to loop backward before reaching the destination. A single sign flip (`{x: 50, y: 0}` vs `{x: -50, y: 0}`) reverses the curve entirely.
→ **Fix:** `tangentStart` should create a control point that pulls the curve in the intended flow direction. For a leftward-flowing arrow, tangentStart.x should be negative. Screenshot each arrow individually — this error is invisible in the code but obvious visually.

**Failure: Arrowhead misaligned with curve direction**
The model creates arrowheads as separate triangle shapes and rotates them based on the chord angle (straight line between endpoints), not the tangent angle at the endpoint. On a curved path, these are different.
→ **Fix:** NEVER create separate arrowhead shapes. Use `strokeCap: 'ARROW_EQUILATERAL'` on the vertex — it auto-aligns with the curve tangent. This is already documented in `tools/figma-console.md`.

**Failure: Inconsistent curvature across connectors**
Multiple arrows in the same diagram have wildly different curvatures — some barely arc, others are extreme curves. This happens when tangent magnitude is computed independently per arrow without normalization.
→ **Fix:** Normalize tangent magnitude by distance: `magnitude = distance × constant_factor`. Use the SAME factor for all connectors of the same type in a diagram. See consistency rules in `tools/figma-console.md`.

**Failure: Arrow endpoints at node center, not edge**
The model targets the center of the destination node, causing the arrow to either overlap with the node content or extend past it. The arrowhead ends up inside the node instead of touching its boundary.
→ **Fix:** Compute the endpoint at the node's edge: `edgePoint = center - (direction × nodeRadius)` for circles. For rectangles, use ray-rectangle intersection. See the hub-and-spoke recipe in `tools/figma-console.md`.

**Failure: Reversed arc direction (clockwise vs counter-clockwise)**
A process flow labeled "clockwise" renders counter-clockwise, or vice versa. This happens when the perpendicular direction is computed with the wrong sign.
→ **Fix:** `+π/2` from the radial angle = clockwise. `-π/2` = counter-clockwise. Always screenshot and verify direction matches the intended flow. Label the flow direction in the Build Spec so the reviewer can catch reversals.

---

## AI failure mode callouts: spatial fidelity

Spatial fidelity failures are the most common class of "looks AI-generated" defects. They share a root cause: the model assigns coordinates, sizes, and positions per-element without verifying the resulting spatial relationships between elements. Each element may be individually correct, but the composition as a whole has geometric errors that a human designer would never produce. These failures are invisible in code review — they only appear visually.

**Why this is a class, not individual bugs:** These failures co-occur. A composition with one spatial fidelity error almost always has several — distorted logos AND misaligned centering AND inconsistent icon sizes. When you catch one, scan for all of them.

**Failure: Element collision (edges meet or occlude)**
Elements that should have clear separation instead have their bounding boxes intersecting — a text label runs into an adjacent icon, an SVG clips into a neighboring element, a badge overlaps a card edge it shouldn't touch. This happens with any element type: SVGs, text, shapes, containers. The model computes positions that are conceptually reasonable but doesn't verify that the actual rendered bounds maintain clearance.
→ **Fix:** After placing any element near another, run the pairwise collision check (see programmatic spatial fidelity checks in SKILL.md Phase D). Every non-overlapping element pair should have ≥4px clearance between their `absoluteBoundingBox` edges. When intentional overlap IS the design intent (stacked panels, edge bleed, overlapping cards for depth), the overlap must be declared in the Build Spec — any overlap not in the spec is accidental and must be fixed. The rule: **if it's not in the Build Spec, it's a collision, not a design choice.**

**Failure: Distorted or squished elements (wrong aspect ratio)**
Imported SVGs, logos, and icons rendered at a width:height ratio that doesn't match their source viewBox. A square icon becomes a wide rectangle. A horizontal logo gets compressed vertically. This happens when the model sets width and height independently instead of deriving one from the other via the source aspect ratio.
→ **Fix:** For every imported SVG: extract the viewBox (`viewBox="0 0 W H"`), compute the aspect ratio (`W/H`), and constrain resizing to maintain it. A 24×24 viewBox scaled to 60px wide must be 60×60, not 60×40. A 100×25 viewBox at 80px wide must be 80×20. Run the aspect ratio verification check (SKILL.md Phase C + Phase D) on every imported element. The model should NEVER set both width and height to arbitrary values — always derive one axis from the other.

**Failure: Off-center content in containers**
An element inside a container (icon in a circle, logo in a badge, text in a pill) that is visually off-center despite being "mathematically" centered. Two causes: (1) SVGs with viewBox padding larger than their visible content — mathematical centering uses the viewBox, but the eye sees the content, and (2) manual positioning without auto-layout where the model computes approximate coordinates. This is especially visible in avatars, icon badges, and logo lockups.
→ **Fix:** Use auto-layout with center alignment whenever possible — it eliminates the problem structurally. When auto-layout can't be used (absolute-positioned overlays, complex compositions), use the SVG visual centering pattern in `tools/figma-console.md` — compute the actual content bounds via `absoluteBoundingBox` on child paths, then center the content center (not the frame center) in the container. Run the centering verification check (SKILL.md Phase D) on every container+child pair.

**Failure: Role-matched elements at mismatched sizes**
Two or more elements that serve the same semantic role in the composition — two feature icons, two company logos in a comparison, two avatar circles in a flow, two node shapes in a diagram — rendered at noticeably different sizes. They don't need to be adjacent; they can be in different parts of the canvas, in symmetrical positions, in the same row/column, or anywhere the viewer perceives them as "the same kind of thing." The model assigns sizes per-element based on content or available space without considering peer relationships. The viewer reads size as importance — unequal sizes for equal-role elements implies a hierarchy that wasn't intended.
→ **Fix:** In the Build Spec, explicitly tag elements that share a semantic role (e.g., "all integration logos: 48×48", "all feature icons: 40×40 in 56×56 containers", "all agent nodes: 120×80"). During build, set sizes from these role tags, not from per-element judgment. During the Phase D checkpoint, run the peer-size consistency check — group elements by semantic role and verify that all members of each group have matching dimensions (within 2px tolerance). For elements that are optically different sizes at the same pixel dimensions (circles vs squares, dense vs sparse icons), use optical sizing: circles need ~10% larger pixel dimensions to match the visual weight of squares at the same size.

**Failure: Misaligned elements that should share an axis**
Elements that should be vertically or horizontally aligned (e.g., a row of cards, a column of labels, items in a grid) are slightly off — one card is 3px lower than its siblings, labels don't share a baseline, icons in a column aren't horizontally centered on the same axis. The model positions each element independently rather than aligning to a shared reference line.
→ **Fix:** Use auto-layout for any group of elements that should share alignment — it enforces alignment structurally. When manual positioning is necessary, compute the shared axis explicitly (e.g., all items in a row share the same `y + height/2` for vertical centering, all items in a column share the same `x + width/2` for horizontal centering) and set each element's position from that shared value. The alignment check in Phase D catches this programmatically.

---

## Contextual elevation reasoning

Elevation strategies must derive from the specific graphic. During self-critique, reason from:

1. **The Creative Brief** — Developer audience earns richness from code-as-visual (syntax-highlighted blocks with brand palette), monospace craft, technical precision. Executive audience earns it from data visualization, bold metric callouts, editorial composition.

2. **The format** — Blog cover at 300px in a social feed needs visual punch — bold heading, clear focal element, strong brand color accents. Slide graphic needs whitespace and restraint — fewer accent details, more breathing room.

3. **The content** — Comparison graphic: accurately represent both brands (real logos, real colors via fetch-brand.ts). Product mockup: realistic UI chrome, contextual data, poster-scale internals. Architecture diagram: color-coded nodes, meaningful connector patterns, hub-and-spoke focal structure. Abstract concept: brand illustration system's dual-stroke language with three-tier color depth.

4. **The brand system** — Inkeep's richness levers: warm cream + strategic blue accents, hand-drawn illustration language ("imperfect precision"), generous corner radii (32-54px), layered card system with rotating accent colors, three-tier color depth hierarchy. Using these intentionally (not just correctly) is what makes it feel crafted.

---

## Self-critique elevation prompts

### Pass 1 focus: "Is it correct?"
- Does each element meet the Build Spec's success criteria?
- Are brand tokens applied correctly?
- Do compound elements have all their sub-elements?

### Pass 2 focus: "Is it rich?"

**Additive scan — what can I introduce?**
- Would a blue swoosh underline add value here? (Optional — use predefined asset only if it strengthens the composition.)
- Is there a category badge? (If the content has a category.)
- Are there accent icons with semantic color coding where they'd help readers parse at a glance?
- Is there a background texture layer? (Anything that prevents a flat fill.)
- Is there an atmospheric wash behind the focal element?
- For mockups: are there sub-sub-elements that add realism? (Tab bar states, loading indicators, real data, scroll hints, window chrome.)
- For diagrams: are there dot connectors, curved lines, color-coded node roles?
- Are structural elements using stacked overlapping panels for depth?
- Is there at least one brand accent element (hand-drawn dash, orbit rings, dot connectors, category badge)?

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
- At 400px thumbnail: does the hierarchy hold? Are accent elements visible?
- Does the composition fill 80-85% of the canvas?
- Do elements bleed past the edge where appropriate?
- Would this look at home next to a Stripe, Linear, or Vercel marketing graphic?
