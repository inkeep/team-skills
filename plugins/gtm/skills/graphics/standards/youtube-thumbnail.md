# YouTube Thumbnail

Standard for YouTube video thumbnails. The thumbnail is the single most important factor in click-through rate.

## Dimensions

| Property | Value |
|---|---|
| **Size** | 1280 x 720 px |
| **Aspect ratio** | 16:9 (required) |
| **Min width** | 640 px |
| **File formats** | JPG, PNG, GIF, BMP |
| **Max file size** | 2 MB |

## Safe zones

```
┌────────────────────────────────────────┐
│  ⚠️ Top-left: "Watch Later" button     │
│                                        │
│                                        │
│           SAFE ZONE                    │
│       (center + left)                  │
│                                        │
│                        ⚠️ Bottom-right: │
│  ⚠️ Bottom: title bar   timestamp      │
└────────────────────────────────────────┘
```

- **Bottom-right corner:** Timestamp overlay — never place text or logos here
- **Bottom edge:** Title bar overlay on hover
- **Top-left:** "Watch Later" button
- **Must be legible at ~168 x 94 px** (suggested videos sidebar — the smallest it renders)

## CTR benchmarks

| Level | CTR | Notes |
|---|---|---|
| Average channels | 3-4% | Baseline |
| B2B qualified audience | 4-7% | Acceptable for niche B2B |
| Top creators | 5-10% | Through systematic A/B testing |

## Design guidelines

### Text
- **3-5 words maximum** — thumbnails are viewed tiny
- **Under 12 characters** significantly outperforms text-heavy designs
- **Bold, sans-serif font** — must be readable at 168px wide
- **High contrast text** — bright on dark or dark on light. Yellow on dark background is a proven high-CTR pattern
- **Rule of thirds:** Subject on one third, text on the other two-thirds (YouTube official guidance)

### Faces (research-backed)
- **Emotional faces increase CTR by 20-42%** (TubeBuddy, 1.2M videos)
- The key word is *emotional* — neutral/corporate headshots don't help
- **Niche matters:** Finance thumbnails better with faces; Business thumbnails can go either way
- Face should occupy roughly **30-50%** of the frame (observational, not from controlled study)
- **Multiple faces outperform single faces** on average

### Composition
- **Bright, saturated backgrounds** outperform muted tones (reds, yellows, blues)
- **Directional shapes** can increase CTR by up to 25% by focusing attention
- **High emotional contrast** between subject and background drives engagement
- **Left-weighted subject, right-weighted text** is the most common high-performing pattern

### A/B testing
- YouTube has **native thumbnail A/B testing** — use it. This is severely underutilized by B2B companies
- Test 2-3 variants per video
- Let tests run for at least 48 hours before concluding

### What works for B2B
- Speaker face with emotional expression + bold stat or question
- Before/after visual comparison
- Product UI with a dramatic "aha moment" highlighted
- Contrarian statement that challenges assumptions

### What to avoid
- Auto-generated thumbnails (always create custom)
- Over-corporate aesthetics (stiff headshots, stock backgrounds)
- Text-heavy designs (more than 5 words)
- Content in the bottom-right (timestamp overlay)
- Low-contrast designs that disappear in suggested videos sidebar
- Same thumbnail template for every video (variety helps in suggested videos)
