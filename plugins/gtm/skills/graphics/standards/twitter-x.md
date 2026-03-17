# Twitter/X Images

Standard for all image assets on Twitter/X. Note: X is primarily an awareness/thought-leadership channel for B2B SaaS, not lead generation (LinkedIn generates 80% of B2B social leads vs X's 12.73%).

## Dimensions

| Asset | Dimensions | Aspect Ratio | Max Size |
|---|---|---|---|
| **Single image post** | 1200 x 675 px | 16:9 | 5 MB |
| **Multi-image (safest)** | 1200 x 1200 px each | 1:1 | 5 MB |
| **Profile banner** | 1500 x 500 px | 3:1 | 2 MB |
| **Profile picture** | 400 x 400 px (800x800 retina) | 1:1 (circle crop) | 2 MB |

| Property | Value |
|---|---|
| **File formats** | JPG, PNG, GIF, WebP |
| **Uncropped range** | 2:1 to 1:1 display without cropping (since May 2021) |
| **Feed width** | ~504 px on desktop, full-width on mobile |

## Compression behavior

X compresses aggressively via MediaPipe-Optimize:
- JPEG at 72-82% quality with 4:2:0 chroma subsampling
- Images over ~3 MB compressed more aggressively
- **X Premium:** Less aggressive compression, 4x in-network visibility
- **PNG handling:** Under ~900px width with limited colors may be preserved; larger PNGs → JPEG
- **Transparency:** Flattened to white background (except static GIF)

**Best practice:** Export JPG at 90-95%. For text-heavy images, use PNG under 900px or static GIF (preserves transparency).

## Algorithm context (critical for B2B)

| Signal | Effect |
|---|---|
| Native video | Strongest boost (~10x vs text-only) |
| Images / GIFs | Moderate boost; increases dwell time |
| External links | **Severely penalized** — zero median engagement for non-Premium since March 2026 |
| X Premium | 4x in-network, 2x out-of-network visibility |

**Implication:** Post key insights as native text/images. Add links in replies only, or use the article post format.

## Profile banner safe zone (1500 x 500)

- **Safe zone:** Center **1200 x 300-400 px**
- Profile picture (128px circle) overlaps **bottom-left** — avoid content there
- Mobile crops ~50px from top and bottom
- **Text sizing:** Headlines 48-72px, minimum 24px for mobile readability

## Design guidelines

### Text
- **5-8 word headlines** max
- **Min font: 40px** at 1200px wide for mobile readability (feed renders at ~504px desktop)
- **High contrast** essential — test at rendered feed size

### Engagement data

| Content type | Performance |
|---|---|
| **Human faces** | **+38-291% engagement** (Baylor/JMR, peer-reviewed) |
| Posts with images | 2.8x more engagement than text-only |
| Animated GIFs | 55% more engagement than without |

### What works for B2B on X
- **Data visualizations and infographics** — stats and charts stop the scroll
- **Annotated product screenshots** — UI with callouts on key features. **Load:** `references/artifact-recipes.md` for detailed mockup treatment
- **Thought leadership quote cards** — clean, branded text with a strong take
- **Thread openers with images** — compelling visual first tweet, followed by text thread
- **Memes and cultural commentary** — B2B brands using humor see outsized engagement

### What to avoid
- Link-only posts (severely penalized by algorithm since 2026)
- Oversized images that trigger aggressive compression
- Expecting lead generation from X (focus on awareness/thought-leadership)
- Same content as LinkedIn without adapting format (platforms penalize repurposed content)

## Multi-image grid layouts

| Count | Layout | Recommended dimensions |
|---|---|---|
| 2 images | Side by side | 700 x 800 px each (7:8) |
| 3 images | 1 large + 2 stacked | Large: 700x800, Small: 700x400 |
| 4 images | 2x2 grid | 600 x 335 px each |

**Tip:** Square 1200x1200 is safest for multi-image — consistent cropping across positions. Mixing aspect ratios leads to unpredictable cropping.
