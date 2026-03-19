# Social / Open Graph Image

Standard for OG images shown when links are shared on Twitter/X, LinkedIn, Slack, Discord, and other platforms.

## Dimensions

| Property | Value |
|---|---|
| **Size** | 1200 x 630 px |
| **Aspect ratio** | ~1.91:1 |
| **File format** | JPG or PNG (no SVG/WebP/GIF — many crawlers don't support them) |
| **Max file size** | Under 300 KB for universal reliability |
| **URL** | Must be an absolute URL (relative paths cause Slack/Facebook failures) |

This is the universal standard for OG images. The site auto-generates OG images for blog posts, case studies, use cases, integrations, and team pages using `@vercel/og` with a white background, Inter font, and 60px padding.

**iMessage caveat (iOS 16+):** The standard 1200x630 image **silently fails** in iMessage link previews. Apple requires at least **2400 x 1256 px** for images to render. Consider serving a larger variant if Apple device sharing is important for your audience.

**When to create a custom OG image instead of using the auto-generated one:**
- Launch announcements or major feature posts (higher stakes — worth the polish)
- Posts likely to be shared heavily on social (the OG image IS the first impression)
- When the auto-generated text-only card doesn't convey the visual nature of the content

## Typography tiers at 1200×630

| Role | % of canvas height | Target range | Scale step |
|---|---|---|---|
| **Heading** | 12-15% | 76-95px | 84 |
| **Subtitle** | 4-5% | 25-32px | 28 |
| **Body** | 3-4% | 19-25px | 20 |
| **Badge** | 1.3-1.6% | 8-10px | — |

**Sizing ladder** (Perfect Fourth 1.333 from 20px, snapped to ×4): 20 → 28 → 36 → 48 → 64 → 84 → 112. For elements not in the table (card titles, metric callouts), pick the scale step that creates correct visual weight relative to the heading. All sizes should be multiples of 4.

## Design guidelines

### Text
- **Use the typography tiers table above** for heading/subtitle/body sizes (heading: 76-95px, not the legacy 48-64px range)
- **Max 8–10 words** for the title — OG previews are small; long titles get truncated by the platform before they get unreadable in the image
- **No body text** — platforms show their own description below the image. Don't duplicate it

### Composition
- **Center-weighted** — platforms crop differently. Twitter crops more aggressively than LinkedIn. Keep content in the center 80% of the frame
- **Simple background** — solid brand color or minimal gradient. The image is small; detail is lost
- **No fine details** — thin lines, small icons, and subtle textures disappear at preview sizes
- **Test at 600 x 315 px** — that's roughly how it renders in most feeds. If it's unclear at that size, simplify

### Platform-specific rendering

| Platform | Display size | Max file size | Gotchas |
|---|---|---|---|
| Twitter/X | ~600 x 314 px | 5 MB | Falls back to og:image if twitter:image missing |
| LinkedIn | ~552 x 289 px | 8 MB | Caches aggressively — use Post Inspector to re-crawl |
| Slack | ~400 x 210 px | ~8 MB | Re-fetches each share; relative URLs fail silently |
| Discord | ~400 x 210 px | ~8 MB | Width/height params don't work |
| **iMessage (iOS 16+)** | Varies | — | **Needs 2400 x 1256 px minimum** — standard 1200x630 silently fails |
| WhatsApp | ~400 x 210 px | **300 KB** | Drops preview entirely if exceeded |
| Notion | Standard OG | — | No special requirements |

### Brand elements
- **Inkeep logo** — small, corner placement (bottom-right or top-left). Don't dominate
- **Brand colors** — use exact palette. The OG image represents the brand on every share
- **Consistent style** — all OG images should feel like they belong to the same family

### What to avoid
- Text near the edges (will be cropped on some platforms)
- Relying on fine detail to convey meaning
- Gradients that look like compression artifacts at low resolution
- White backgrounds with no border — the image blends into the platform's white feed background. Fix: add a subtle 1-2px border (#E5E7EB or brand-colored), or use an off-white like #FBF9F4
- File sizes over 300 KB (WhatsApp drops the preview entirely)
- SVG, WebP, or GIF format (crawlers don't support them)
- Relative URLs (Slack and Facebook crawlers fail silently)
