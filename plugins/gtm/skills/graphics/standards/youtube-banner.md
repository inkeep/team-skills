# YouTube Channel Banner

Standard for YouTube channel art / banner images.

## Dimensions

| Property | Value |
|---|---|
| **Upload size** | 2560 x 1440 px |
| **Aspect ratio** | 16:9 |
| **File formats** | JPG, PNG, GIF, BMP |
| **Max file size** | 6 MB |

## Safe zones (critical)

The banner displays differently on every device. Only the center strip is guaranteed visible everywhere.

| Device | Visible area |
|---|---|
| TV | Full 2560 x 1440 |
| Desktop | ~2560 x 423 px (centered strip) |
| Tablet | ~1855 x 423 px |
| Mobile | ~1546 x 423 px |
| **All-device safe zone** | **1235 x 338 px (centered)** |

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
│  │  │  │  │ 1235 x 338   │      │      │      │  │
│  │  │  │  └──────────────┘      │      │      │  │
│  │  │  └────────────────────────┘      │      │  │
│  │  └──────────────────────────────────┘      │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**ALL critical content (logo, tagline, CTA) must fit within the center 1235 x 338 px area.** Anything outside this zone will be cropped on at least one device.

## Design guidelines

### Content for the safe zone
- **Company logo** — centered or left-of-center within the safe zone
- **Tagline or value proposition** — 1 short line
- **Upload schedule or CTA** (optional) — "New videos every Tuesday" or "Subscribe"
- That's it — the safe zone is narrow. Don't try to fit too much

### Composition
- **Design the full 2560 x 1440** with decorative/brand elements that look good on desktop/TV
- **Keep ALL text and logos within the 1235 x 338 safe zone**
- **Gradient or brand-colored background** works well for the outer areas
- **Test across devices** — YouTube's channel customization shows a preview of how it crops

### Brand elements
- Use brand colors and fonts consistently with other YouTube assets (thumbnails, end screens)
- The banner sets the visual tone for the entire channel
- Consider the banner + profile picture as a unified brand impression

### What to avoid
- Text outside the safe zone (will be cropped on mobile)
- Small text (the safe zone is only 338px tall — keep text large)
- Busy, detailed backgrounds (lost at mobile rendering sizes)
- Outdated information (update the banner when messaging changes)
