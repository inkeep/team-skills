Use when: Laying out any rectangular visual (graphics, video scenes, slides) — arranging elements for visual impact
Priority: P0
Impact: Flat hierarchy, poor eye flow, dated-looking compositions, inconsistent series

---

# Composition Guide

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
