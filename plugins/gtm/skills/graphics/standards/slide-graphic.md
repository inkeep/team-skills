# Slide Deck Graphic

Standard for graphics created for presentation decks (Google Slides, Keynote, PowerPoint).

## Dimensions

| Property | Value |
|---|---|
| **Full-slide graphic** | 1920 x 1080 px (16:9) |
| **Figma working canvas** | 960 x 540 px (scales 2x for export) |
| **Aspect ratio** | 16:9 |
| **Export format** | PNG at 4x scale (3840 x 2160 px) |

When building in Figma for Google Slides, use 960 x 540 px as the working canvas — this maps to Google Slides' 720 x 405 pt coordinate system at `gslides_pt = figma_px x 0.75`.

**For inset graphics** (diagrams, charts, illustrations placed within a slide):
- Design at the size they'll appear, not full-slide
- Typical inset sizes: 600–800px wide, variable height
- Export at 4x scale for sharpness on high-DPI displays

## Design guidelines

### Text
- **Minimum body text**: 18px (at 960 x 540 canvas) — slides are projected; small text is unreadable
- **Minimum label text**: 14px
- **Headings**: 32–48px
- **Limit text per graphic** — the speaker provides context; the graphic supports, not replaces
- **Sans-serif only** — serif fonts lose legibility at projection distances

### Composition
- **One idea per graphic** — if it takes more than 5 seconds to understand, it's too complex for a slide
- **Visual hierarchy is critical** — the audience's eye should know where to go immediately
- **White space is your friend** — slides projected in a room compete with ambient light; dense graphics become murky
- **Left-to-right flow** for sequential information (processes, timelines, pipelines)
- **Top-to-bottom flow** for hierarchies and stacks

### For diagrams and architecture graphics
- **Max 7 elements** visible at once — more than that and the audience can't follow
- **Use color to group, not to decorate** — each color should mean something
- **Arrows and connections**: minimum 2px stroke weight at 960w. 1px lines disappear on projectors
- **Labels on or directly adjacent to elements** — not in a separate legend that requires eye travel

### Slide master awareness
When building for an existing deck:
- Check what the slide master already provides (headers, footers, logos, page numbers)
- Don't duplicate master-provided elements in your graphic
- Match the deck's visual density — if existing slides are sparse, don't create a dense infographic

### Brand elements
- Check whether the deck template already includes the Inkeep logo — don't double it
- Use brand fonts and colors from the design system
- Maintain visual consistency with other slides in the deck

### Export for Google Slides
1. Export from Figma at 4x scale (`exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 4 } })`)
2. The image needs to be publicly accessible for Google Slides import
3. Coordinate mapping: `x_pt = x_px * 0.75`, `y_pt = y_px * 0.75`
4. Full-slide placement: `x=0, y=0, width=720, height=405` (in points)

### What to avoid
- Thin lines and fine detail (lost on projectors)
- Low-contrast color combinations (light gray on white, blue on purple)
- Screenshots at native resolution (pixelated when projected — take at 2x minimum)
- Embedding data tables as images (use native slide tables for data; use graphics for concepts)
