# YouTube Channel Banner

Standard for YouTube channel art / banner images.

## Dimensions

| Property | Value |
|---|---|
| **Working canvas** | 1280 x 720 px |
| **Export size** | 2560 x 1440 px (export at **2x scale**) |
| **Aspect ratio** | 16:9 |
| **File formats** | JPG, PNG, GIF, BMP |
| **Max file size** | 6 MB |

All pixel values below are at **1280×720 working scale**.

## Typography tiers at 1280×720 working canvas

| Role | % of canvas height | Target range | Scale step |
|---|---|---|---|
| **Heading** | 11-14% | 80-100px | 84 or 112 |
| **Subtitle** | 4-5% | 28-36px | 28 or 36 |
| **Body** | 2.5-3.5% | 18-24px | 20 |

**Safe zone constraint:** All text must fit within the all-device safe zone (618×169 centered at working scale). Size heading for this zone, not the full canvas.

**Sizing ladder** (Perfect Fourth 1.333 from 20px, snapped to ×4): 20 → 28 → 36 → 48 → 64 → 84 → 112. All sizes should be multiples of 4.

## Safe zones (critical)

The banner displays differently on every device. Only the center strip is guaranteed visible everywhere.

| Device | Visible area (at 1280w working) | Visible area (at 2560w exported) |
|---|---|---|
| TV | Full 1280 x 720 | Full 2560 x 1440 |
| Desktop | ~1280 x 212 (centered strip) | ~2560 x 423 |
| Tablet | ~928 x 212 | ~1855 x 423 |
| Mobile | ~773 x 212 | ~1546 x 423 |
| **All-device safe zone** | **618 x 169 (centered)** | **1235 x 338** |

```
┌──────────────────────────────────────────────────┐
│                    TV ONLY                        │
│  ┌────────────────────────────────────────────┐  │
│  │              DESKTOP                        │  │
│  │  ┌──────────────────────────────────┐      │  │
│  │  │        TABLET                     │      │  │
│  │  │  ┌────────────────────────┐      │      │  │
│  │  │  │      MOBILE             │      │      │  │
│  │  │  │  ┌──────────────┐      │      │      │  │
│  │  │  │  │  ALL DEVICES  │      │      │      │  │
│  │  │  │  │  618 x 169   │      │      │      │  │
│  │  │  │  └──────────────┘      │      │      │  │
│  │  │  └────────────────────────┘      │      │  │
│  │  └──────────────────────────────────┘      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**ALL critical content (logo, tagline, CTA) must fit within the center 618 x 169 px area (at working scale).** Anything outside this zone will be cropped on at least one device.

## Design guidelines

### Content for the safe zone
- **Company logo** — centered or left-of-center within the safe zone
- **Tagline or value proposition** — 1 short line
- **Upload schedule or CTA** (optional) — "New videos every Tuesday" or "Subscribe"
- That's it — the safe zone is narrow. Don't try to fit too much

### Composition
- **Design the full 1280 x 720 working canvas** with decorative/brand elements that look good on desktop/TV
- **Keep ALL text and logos within the 618 x 169 safe zone**
- **Gradient or brand-colored background** works well for the outer areas
- **Test across devices** — YouTube's channel customization shows a preview of how it crops

### Brand elements
- Use brand colors and fonts consistently with other YouTube assets (thumbnails, end screens)
- The banner sets the visual tone for the entire channel
- Consider the banner + profile picture as a unified brand impression

### What to avoid
- Text outside the safe zone (will be cropped on mobile)
- Small text (the safe zone is only 169px tall at working scale — keep text large)
- Busy, detailed backgrounds (lost at mobile rendering sizes)
- Outdated information (update the banner when messaging changes)
