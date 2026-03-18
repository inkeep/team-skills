Use when: Analyzing each downloaded image — the complete checklist of facets to evaluate
Priority: P0
Impact: Missing facets produces shallow analysis that's not actionable for design decisions

---

# Image Analysis Rubric

For EVERY image analyzed, work through ALL of these facets. Skip none. The proportional measurements are the most valuable output — everything else builds context around those numbers.

## 1. Spatial proportions (MEASURE quantitatively)

| Metric | How to measure | Example output |
|---|---|---|
| **Left margin** | Distance from left edge to first content element, as % of canvas width | "4.2% (80px at 1920w)" |
| **Top margin** | Distance from top edge to first content element, as % of canvas height | "8% (81px at 1008h)" |
| **Right margin** | Distance from right edge to rightmost content. 0% if content bleeds off-edge | "0% (product mockup bleeds past right edge)" |
| **Bottom margin** | Distance from bottom edge to lowest content | "5% (50px at 1008h)" |
| **Content coverage** | % of total canvas area occupied by content (not empty space) | "82% — content fills most of the frame" |
| **Heading size** | Height of heading text as % of canvas height | "14% of height (~140px at 1008h source)" |
| **Text:visual split** | Width ratio between text area (left) and visual area (right), if split layout | "35:65 — visual dominant" |
| **Visual element size** | Main visual (mockup, illustration, 3D object) as % of canvas area | "~55% of canvas" |
| **Center of gravity** | Where the visual "weight" concentrates | "Top-weighted — content starts at 8% and mockup extends to 95% of height" |

**Negative space assessment:**
- Is the empty space DELIBERATE (creating elegance, breathing room, luxury feel)?
- Or ACCIDENTAL (content is too small, centered in a too-large frame)?
- Would filling the space improve or weaken the composition?

## 2. Typography

| Facet | What to observe |
|---|---|
| **Font classification** | Serif, sans-serif, monospace, display. WHY does this choice fit the brand? (Serif = editorial/luxury; sans = modern/clean; mono = technical/developer) |
| **Weight contrast** | How dramatic is the difference between heading and body/subtitle? Ratio estimate (e.g., "heading is ~5x the visual weight of subtitle") |
| **Size relative to canvas** | Heading as % of canvas height. Subtitle as % of canvas height. Badge text as % of canvas height. |
| **Typeface count** | How many different typefaces in one image? (1 = disciplined; 2 = standard; 3+ = risky) |
| **Tracking/letter-spacing** | Tight (negative tracking), normal, wide (positive tracking). Impact on feel? |
| **Line height** | Tight (90-100% — dense, dramatic) or loose (130-150% — airy, readable) |
| **Hierarchy delta** | How dramatic is the visual weight difference between levels? Flat hierarchy (bad — everything looks the same) vs steep hierarchy (good — clear reading order) |
| **Text role** | Is text the PRIMARY element (typography-led design) or SUPPORTING the visual? |

## 3. Color

| Facet | What to observe |
|---|---|
| **Color count** | Number of distinct colors in the SURROUND (background, text, badge, logo) — NOT counting product mockup internals |
| **Temperature** | Warm (oranges, creams, golds) vs cool (blues, grays, whites) vs neutral (black, white, gray only) |
| **Saturation** | Muted/desaturated (sophisticated, mature) vs vivid/saturated (energetic, attention-grabbing) |
| **Hierarchy via color** | What draws the eye FIRST through color contrast? Is color directing attention intentionally? |
| **Accent usage** | How many accent colors? Is there ONE accent or multiple competing accents? |
| **Gradient** | Direction, subtlety (barely visible vs dramatic), number of color stops, what it adds to the composition |
| **Brand encoding** | How does the color palette encode the brand's personality? (Blue = trust; black = premium; green = growth; purple = creative) |

## 4. Texture and depth

| Facet | What to observe |
|---|---|
| **Background flatness** | Is the background a solid flat color or does it have texture? |
| **Texture type** | Dot grid, line grid, grain/noise, subtle gradient, geometric pattern, organic pattern |
| **Texture opacity** | Subtle (2-3% — barely visible) vs moderate (5-8%) vs prominent (10%+ — clearly visible) |
| **Depth techniques** | What creates the illusion of depth: drop shadows, overlapping elements, blur/bokeh, perspective/3D, light bloom/glow |
| **Shadow treatment** | Hard shadows (sharp, graphic) vs soft shadows (diffuse, realistic). Direction consistent? Color-tinted shadows? |
| **Layering** | How many visual "layers" are stacked: background → texture → content → overlays → decorative elements |

## 5. Composition and visual hierarchy

| Facet | What to observe |
|---|---|
| **Eye path** | Where does attention go 1st → 2nd → 3rd? Is there a clear reading order? |
| **Layout structure** | Split (left text / right visual), centered, full-bleed, Z-pattern, L-shape, asymmetric |
| **Edge behavior** | Do elements bleed past the frame edges or stay contained within margins? |
| **Balance** | Symmetric (stable, trustworthy, formal) vs asymmetric (dynamic, exciting, modern) |
| **Focal point** | Is there ONE clear focal point or competing elements? |
| **Flow direction** | Left-to-right? Top-to-bottom? Center-outward? Follows Z-pattern? |
| **Tension** | Is there visual tension (elements pulling in different directions) or harmony (everything settled)? |

## 6. Brand system analysis (requires 3+ images from same company)

| Facet | What to observe |
|---|---|
| **Locked elements** | What NEVER changes across all assets: logo position, font choice, background treatment, corner radius, shadow style, badge format |
| **Variable elements** | What changes per asset: color accent, visual content, specific layout, text content |
| **Template rigidity** | How rigid is the template? Scale: fully custom per post ←→ strict template with only content swapped |
| **Recognizability** | If you saw this thumbnail in a grid of 50 companies, would you recognize it? What creates that recognition? |
| **Consistency vs monotony** | Do they vary enough to avoid boredom while maintaining brand coherence? |
| **Cross-asset-type coherence** | Do their blog covers, changelog entries, and customer stories feel like they come from the same brand? Or do different asset types have disconnected visual languages? |

## 7. Craft details

| Facet | What to observe |
|---|---|
| **Alignment** | Are elements precisely aligned or approximately aligned? Check: text baselines, element edges, spacing uniformity |
| **Corner radius** | Consistent across elements? What radius values (sharp 0px, subtle 4-8px, medium 12-16px, large 24-32px, pill 9999px)? |
| **Stroke weight** | Consistent across icons, borders, dividers? What weight range? |
| **Shadow consistency** | Same shadow treatment on all elevated elements? Direction consistent? |
| **Spacing system** | Does spacing feel systematic (multiples of 4px or 8px) or arbitrary? |
| **Polish level** | 1=rough draft, 2=functional, 3=professional, 4=polished, 5=exceptional (every pixel intentional) |

## 8. Emotional register

| Facet | What to observe |
|---|---|
| **Primary emotion** | What's the dominant feeling? Premium/luxury, playful/fun, trustworthy/stable, cutting-edge/technical, warm/approachable, cold/minimal, bold/confident, sophisticated/refined |
| **Product-feel alignment** | Does the visual emotion match what the product does? (A security product should feel different from a creative tool) |
| **Audience signal** | Who does this visual say the product is FOR? Developers? Designers? Enterprise buyers? Startup founders? |
| **Scroll-stop potential** | Would you stop scrolling in a LinkedIn feed for this? Why or why not? |
| **Memorability** | After seeing this once, would you recognize it again? What sticks in memory? |

## 9. Context analysis (don't skip this)

| Facet | How to check |
|---|---|
| **Grid coherence** | View the blog listing page screenshot — do all thumbnails form a cohesive visual rhythm, or does it feel chaotic/random? |
| **Card-size test** | Mentally (or actually) view the image at ~300px wide. Is the title readable? Is the visual recognizable? |
| **OG preview test** | This image at ~600px wide with a title card below it — does it work as a social share? |
| **Page integration** | On the actual blog post page, does the hero image complement the content below, or feel disconnected? |

## 10. Restraint analysis (what's ABSENT)

This is often the most revealing analysis. Ask:

- What elements did they deliberately LEAVE OUT?
  - No subtitle? No logo on the thumbnail? No badge/category? No product UI?
- Where did they resist the temptation to add more?
- Is every element EARNING its place, or are some purely decorative?
- What's the signal-to-decoration ratio? (High signal = every element communicates; high decoration = elements that just "look nice")
- Would removing ANY element improve the composition? Which one?
