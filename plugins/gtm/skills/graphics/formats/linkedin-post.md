# LinkedIn Post Image

Standard for single-image posts on LinkedIn — the primary B2B social channel.

## Dimensions

| Orientation | Dimensions | Aspect Ratio | Best for |
|---|---|---|---|
| **Square (recommended default)** | 1200 x 1200 px | 1:1 | Safest cross-platform; consistent display |
| **Portrait** | 1080 x 1350 px | 4:5 | Maximum mobile feed real estate |
| **Landscape** | 1200 x 627 px | 1.91:1 | Link-style posts; matches OG preview |

| Property | Value |
|---|---|
| **File formats** | PNG (text/logos), JPG at 85-95% (photos) |
| **Max file size** | 5 MB |
| **Min width** | 200 px (below this, renders as small left-side thumbnail) |

**Default recommendation:** Use **1200 x 1200 px (1:1)** as the default — it works well on both desktop and mobile and is the safest cross-platform choice. Use 4:5 portrait only for LinkedIn-first content where you want maximum mobile feed presence.

## Compression behavior

LinkedIn re-compresses every uploaded image. To minimize quality loss:
- Upload at **exactly** the recommended dimensions (prevents LinkedIn from resizing)
- Use **PNG-24** for any image containing text, logos, or sharp lines
- Export JPEGs at **85-95%** quality — do not pre-compress below this
- Do not upload images smaller than recommended (LinkedIn upscaling destroys quality)
- Do not upload oversized images (triggers aggressive compression, especially on text)

## Engagement data (research-backed)

| Finding | Data | Source |
|---|---|---|
| Images vs text-only | 2x higher engagement | SocialInsider 2025 (1M posts) |
| Infographics | 2.4x better than average images | SocialInsider |
| Personal photos vs stock | Significantly higher engagement | Multiple studies |
| LinkedIn has NO 20% text rule | No algorithmic penalty for text | Confirmed — that was Facebook's policy |

**B2B performance hierarchy:** Carousel > Infographics > Personal/authentic photos > Branded graphics with stats > Stock photography

**Note:** Single-image posts (4.85% engagement) significantly underperform carousels (6.60%). For high-effort content, consider the carousel format instead — see `linkedin-carousel.md`.

## Design guidelines

### Text
- **Headlines: 5-8 words max** — treat social graphics like billboards
- **Total text: under 15-20 words** — keep under 20% of image area
- **Min font: 24pt** at 1200px wide — must be readable on mobile (~400px display)
- **Left-align body text** — most readable. Center only short headlines (1-2 lines)

### Layout (Z-pattern)
Eye-tracking research (NNG, 500+ participants) confirms the Z-pattern for visual content:
1. **Hook/headline** → top-left (gets first fixation)
2. **Key visual** → center
3. **CTA or brand** → bottom-right

### Composition
- **High contrast is the #1 proven visual signal** — more color complexity drives attention in feeds (Notre Dame, peer-reviewed)
- **Symmetrical layouts signal trust** for B2B (JMR, peer-reviewed). Use asymmetry selectively for launches
- **40-60px padding** from edges — avoids cramped look and platform cropping
- **One message per image** — the post caption provides context

### What works (B2B scroll-stoppers)
- **Bold data callouts** — large stat as hero element (most effective B2B pattern)
- **Annotated product mockups** — simplified UI with callouts, not raw screenshots. **Load:** `brand.md` § Artifact Recipes for detailed mockup treatment (float, shadow, radius, edge bleed)
- **Data visualizations** — charts/graphs communicate instantly
- **Faces with emotion** — real people, not neutral corporate headshots
- **Unexpected color contrast** in a muted feed (Von Restorff Effect)
- **Animated GIFs** — 2-3x engagement vs static images; 42% more in B2B-specific tests. Best for process demos, before/after, and micro-interactions. For animated content, use the Remotion workflow — the graphics skill produces static assets only.

### What to avoid
- Stock photography (lowest-performing image type on LinkedIn)
- Screenshots without annotations (cluttered, hard to read at mobile sizes)
- Over-compressed images (LinkedIn compresses again, compounding quality loss)
- Text too small to read on mobile
- Generic motivational quotes (can hurt your LinkedIn relevance score over time)
