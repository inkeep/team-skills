# Case Study Hero / Thumbnail

Standard for case study images on the Inkeep marketing site.

## Dimensions

| Image type | Working canvas | Export size (at 2x) | Aspect ratio |
|---|---|---|---|
| **Hero image** | 900 x 420 px | 1800 x 840 px | ~2.14:1 |
| **Thumbnail** | 400 x 250 px | 800 x 500 px | 8:5 (1.6:1) |
| **Company logo** | 300 x 300 px | 600 x 600 px | 1:1 (square) |

The site renders case study thumbnails in cards at 16:9 aspect ratio with `object-cover`, so the thumbnail will be cropped from 8:5 to 16:9. Keep focal content in the center.

## Triple-customization system

Case study graphics use a three-layer customization system. Each layer adapts to the specific customer, making every case study feel bespoke while maintaining a recognizable Inkeep template structure.

### Layer 1: Brand-color background

Derive the background color from the **customer's brand**, not Inkeep's palette.

**Workflow:**
1. **Identify the customer's primary brand color.** Visit their website or check their logo for the dominant hue.
2. **Soften it.** Take that hue and reduce saturation to 15-25%, shift lightness to 85-92%. The result should feel like a tinted warm wash, not a colored background.
3. **Blend with Inkeep's warm base.** The softened customer color should sit harmoniously on `bg/primary` (#FBF9F4). If the result feels too cold or saturated, pull it further toward cream.

**Example derivations (for reference, not hardcoded):**
- Red/orange brand → warm peach/coral tint
- Blue brand → periwinkle/lavender tint
- Green/teal brand → seafoam/mint tint
- Purple brand → lavender tint
- Neutral brand → stay close to Inkeep's cream with minimal tinting

### Layer 2: Geometric pattern

Add a geometric pattern across the background at **5-10% opacity**. The pattern creates visual texture and differentiation between case studies in a listing grid.

**Choose a pattern based on the customer's domain:**

| Customer domain | Pattern type | Why it fits |
|---|---|---|
| Security / identity / auth | Circuit board lines, connection nodes | Evokes authentication flows, secure pathways |
| Analytics / data / observability | Hexagonal grid, data node clusters | Evokes data structures, honeycomb data stores |
| Payments / fintech / commerce | Card outlines, dashboard wireframes | Evokes transaction flows, financial dashboards |
| Developer tools / infrastructure | Code brackets, terminal shapes, API arrows | Evokes development workflows |
| Communication / support / CRM | Chat bubbles, message threads, conversation flows | Evokes customer interactions |
| General / no strong domain signal | Diamond grid, dot grid, or isometric grid | Neutral, professional texture |

**Pattern construction:**
- Draw the pattern elements as simple strokes (1-2px) in a neutral gray or the softened brand color
- Set opacity to 5-10% — the pattern should be visible on close inspection but read as "texture" at thumbnail sizes
- Tile or scatter the elements across the full canvas
- Vary density: slightly denser toward the edges, sparser near the center where the logo sits

### Layer 3: Domain-themed accents (optional, adds distinctiveness)

Add small thematic elements at pattern intersections or corners that relate to the customer's specific product domain. These are the details that make each case study feel custom-designed rather than template-generated.

**How to choose accents:**
- Think about what the customer's product DOES, then pick 3-5 small icons or shapes that represent it
- Draw them in the same stroke style as the geometric pattern, at slightly higher opacity (10-15%)
- Place them at natural intersection points in the geometric pattern
- Keep them simple enough to be ignored at thumbnail size but noticeable at hero size

**Example accent logic (apply this thinking to any customer):**
- Customer builds fraud detection → fingerprint shapes, magnifying glass outlines, shield icons
- Customer provides analytics → small chart shapes, trend arrows, data point clusters
- Customer handles payments → card outlines, currency symbols, receipt shapes
- Customer does communication → speech bubble outlines, waveform shapes, notification bells

### Assembly workflow

For any new case study, follow these steps in order:

1. **Research the customer.** Visit their website. Note their primary brand color, their product domain, and what their product looks like.

2. **Fetch their logo.** Check Brand Assets for `third-party/{name}`. If not found, use `scripts/fetch-logo.ts` or download from their website. The logo must be real — never approximated.

3. **Create the background.**
   - Start with a frame at hero dimensions (900 x 420 working)
   - Fill with the softened brand-color tint (Layer 1)
   - Add the geometric pattern (Layer 2) at 5-10% opacity
   - Optionally add domain-themed accents (Layer 3) at 10-15% opacity

4. **Place the customer logo.**
   - Center horizontally, vertically centered or slightly above center
   - Size: ~40-50% of canvas width
   - Place on a white (#FFFFFF) card with `shadow/subtle` and `radius/sm-alt` (12px)
   - Ensure the logo has adequate padding within the white card (~20% of card width on each side)

5. **Create the thumbnail** by duplicating the hero and resizing to 400 x 250 working canvas. The composition should survive center-crop to 16:9.

6. **Verify at small sizes.** Export the thumbnail at 150px wide — the customer logo should still be identifiable and the brand tint should still be visible.

## Design guidelines

### Hero image (900 x 420 working)
- Shown at the top of the case study page
- **Customer's brand should be prominent** — this is their story
- Apply the triple-customization system (brand tint + geometric pattern + domain accents)
- **No text overlay** unless it's a pull quote — the page provides the title and metadata

### Thumbnail (400 x 250 working)
- Shown in case study cards and listing pages
- Cropped to 16:9 in card views — design for center-crop
- Should be recognizable at small sizes (~150px wide in the card grid)
- Customer logo centered + brand-tinted background — the customization is visible even at thumbnail size
- Patterns should read as "texture" not "content" at small sizes

### Company logo (300 x 300 working)
- Displayed in the case study sidebar/metadata
- Square format — center the logo with padding
- White or transparent background
- Ensure the logo renders clearly at 48x48 px (the smallest it appears)

### Brand elements
- **Customer brand takes priority** — use their colors, their logo prominently
- **Inkeep branding is secondary** — small badge or no Inkeep logo at all (the site provides context)
