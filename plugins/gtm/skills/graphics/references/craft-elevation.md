Use when: Phase E self-critique loop — evaluating and elevating each element from "correct" to "exceptional." Loaded by the child agent during the self-critique phase.
Priority: P0
Impact: Without this, the model produces structurally correct but visually flat output. Elements meet the spec but lack the richness, depth, and craft that distinguish professional design from mechanical execution.

---

# Craft Elevation Guide

## Governing principle

**The Build Spec is your floor, not your ceiling.** Meeting success criteria means the graphic is correct — not that it's done. Every self-critique iteration should push elements from correct → rich → exceptional. The goal is not "does this pass?" but "is this the best this element can be given the method and context?"

**The horse-drawing problem:** Without explicit craft intent, models front-load effort on the first few elements and progressively simplify everything else. A Slack mockup gets a detailed header but generic message bubbles. A blog cover gets a polished headline but a flat background. Every element must receive the same craft investment — there are no "background" elements that deserve less attention.

---

## Visual depth stack

Every composition should have multiple visual layers that create depth and richness. Evaluate your graphic against this stack — missing layers are the primary cause of "flat" output.

| Layer | What it adds | Without it |
|---|---|---|
| **1. Background texture** | Subtle grain, gradients, noise, pattern — never a flat solid fill | Looks like a PowerPoint slide |
| **2. Atmospheric depth** | Soft shadows, ambient glow, subtle color shifts between zones | Elements float on a flat plane |
| **3. Structural elements** | Cards, containers, dividers with proper shadows and border radius | Content has no visual hierarchy |
| **4. Content** | Text, mockups, illustrations, data — the core information | Empty frame |
| **5. Accent details** | Decorative lines, subtle icons, brand marks, color pops | Feels sterile and corporate |
| **6. Interaction cues** | Overlapping elements, perspective hints, depth-of-field effects | Static and lifeless |

**Self-check:** Count the layers in your composition. If it's ≤3, it will look flat. Most 10/10 graphics have 5-6 active layers.

---

## Per-element elevation strategies

For each element type, here's what separates "correct" from "exceptional." During self-critique, evaluate each element against the relevant strategies.

### Backgrounds
| Correct | Elevated |
|---|---|
| Solid brand color (#FBF9F4) | Subtle radial gradient (cream → slightly warmer at edges) with fine noise texture overlay |
| Single flat fill | Layered: base gradient + subtle geometric pattern at low opacity + vignette at edges |

### Typography
| Correct | Elevated |
|---|---|
| Right font, right size, right color | Deliberate letter-spacing (tighter on headings, looser on labels), optical alignment, weight contrast between hierarchy levels |
| Text placed in the layout | Text that creates visual rhythm — headline dominates, subhead breathes, body recedes |

### Product mockups / UI recreations
| Correct | Elevated |
|---|---|
| Rectangles with text that approximate the UI | Realistic chrome — proper toolbar, actual button styles, real status bar, contextual content (not lorem ipsum) |
| Flat screenshot in a rectangle | Styled with shadow, slight rotation/perspective, rounded corners, and a subtle reflection or surface beneath it |
| Generic placeholder data | Contextually relevant content that tells the same story as the graphic's key message |

### Illustrations (Quiver)
| Correct | Elevated |
|---|---|
| Illustration that matches the prompt | Illustration with intentional color weight — primary accent draws the eye, secondary elements use muted tones |
| Single-style flat illustration | Dual-stroke brand language (hand-drawn gray containers + precise blue fills) with consistent line weight |

### Icons and logos
| Correct | Elevated |
|---|---|
| Logo cloned from Brand Assets, placed in layout | Logo in context — sitting on a card with proper padding, or inside a circle with a subtle shadow, integrated into the visual hierarchy |
| Flat icon placed inline | Icon with consistent visual weight relative to siblings, proper optical sizing (different shapes at the same pixel size look different sizes — circles appear smaller than squares) |

### Cards and containers
| Correct | Elevated |
|---|---|
| Rectangle with rounded corners and content inside | Card with: proper shadow depth (not just `shadow/subtle` — consider the card's z-index in the composition), internal padding following brand spacing tokens, consistent corner radius across all cards |
| Same card style repeated | Cards that vary intentionally — different accent colors per card (rotating through card color tokens), or different content layouts that create visual rhythm while maintaining structural consistency |

### Diagrams and flow elements
| Correct | Elevated |
|---|---|
| Boxes connected with lines | Nodes styled as proper cards (shadow, radius, padding), connectors with directional arrows, color-coded by role (inputs/outputs/processors) |
| Flat arrows between elements | Arrows with consistent curvature, subtle gradient along the path, or width that implies flow volume |

### Image Gen elements (3D heroes, atmospheric backgrounds)
| Correct | Elevated |
|---|---|
| Generated image placed as background fill | Image composited with Figma overlays — gradient fade at edges, brand-colored glow effects, elements that bridge the generated and native layers |
| Single prompt, first result accepted | Iterative prompting with reference images from the brand system, specific material/lighting descriptions, multiple attempts with the best selected |

---

## Contextual elevation reasoning

Elevation strategies must derive from the specific graphic, not generic design advice. During self-critique, reason from:

1. **The Creative Brief** — Who's the audience? A developer-facing graphic earns richness from monospace typography, code-as-visual, and technical precision. An executive-facing graphic earns it from clean data visualization, bold stats, and editorial composition.

2. **The format** — A blog cover seen at 300px in a social feed needs visual punch and thumbnail readability. A slide graphic needs to support a speaker's narrative without competing for attention. The same "elevation" looks different for each.

3. **The content** — A comparison graphic between products earns richness from accurately representing both brands. A product mockup earns it from realistic, contextual UI content. An abstract concept earns it from sophisticated visual metaphor.

4. **The brand system** — Inkeep's brand has specific richness levers: the warm cream palette with strategic blue accents, the hand-drawn illustration language, the generous corner radii, the layered card system. Using these intentionally (not just correctly) is what makes a graphic feel "on-brand" vs "following the rules."

---

## Self-critique elevation prompts

Use these during each iteration of Phase E. They're ordered by the iteration pass they're most relevant to.

### Pass 1 focus: "Is it correct?"
- Does each element meet the Build Spec's success criteria?
- Are brand tokens applied correctly (colors, fonts, spacing)?
- Do compound elements have all their sub-elements?

### Pass 2 focus: "Is it rich?"
- How many layers in the visual depth stack? If ≤3, what's missing?
- For each Tier 2 atom: compare what you built against the "Elevated" column in the strategies above. Are you at "Correct" or "Elevated"?
- Is there visual texture in the background, or is it a flat fill?
- Do the typography choices create visual rhythm, or is everything the same weight?
- For mockups: is the content realistic and contextual, or placeholder?
- For illustrations: do they use the full brand illustration language, or just basic shapes?

### Pass 3 focus: "Is it cohesive and polished?"
- Does the entire composition feel like one unified piece, or a collage of independent elements?
- Are shadows, colors, and lighting consistent across all elements (same light source, same shadow direction)?
- Are spacing values from brand tokens, or ad-hoc pixel values?
- At 400px thumbnail: does it still read clearly? Does the hierarchy hold?
- Would this look at home next to a Stripe, Linear, or Vercel marketing graphic?
