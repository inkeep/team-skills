# LinkedIn Banner

Standard for LinkedIn company page and personal profile banners.

## Dimensions

| Banner type | Dimensions | Aspect Ratio | Max Size |
|---|---|---|---|
| **Company page** | 1128 x 191 px | ~6:1 | 3 MB |
| **Personal profile** | 1584 x 396 px | 4:1 | 8 MB |

| Property | Value |
|---|---|
| **File format** | PNG (recommended) or JPG |

## Safe zones

### Company page banner (1128 x 191)

```
┌──────────────────────────────────────────┐
│  ┌─────  MOBILE CROP (~15-20% each side) │
│  │  ┌── SAFE ZONE: ~760 x 150 px ──┐    │
│  │  │   (centered)                   │    │
│  │  └────────────────────────────────┘    │
│  └───────────────────────────────────     │
│  ⚠️ Profile logo overlaps bottom-left    │
└──────────────────────────────────────────┘
```

- **Desktop:** Displays full width. Minor top/bottom cropping possible
- **Mobile:** Crops ~15-20% from each side — shows only center ~60-70%
- **Safe zone:** Keep all critical content within center **~760 x 150 px**
- **Profile logo** overlaps bottom-left corner — avoid important content there

### Personal profile banner (1584 x 396)

```
┌──────────────────────────────────────────────────┐
│  ~240px crop ──┐              ┌── ~240px crop     │
│                │   SAFE ZONE  │                    │
│                │ ~1200 x 300  │                    │
│                │  (centered)  │                    │
│  ⚠️ Profile photo overlap    └────────────────    │
│  (~568 x 264 px bottom-left)                      │
└──────────────────────────────────────────────────┘
```

- **Mobile:** Crops ~240px from each side
- **Safe zone:** Center **~1200 x 300 px**
- **Profile photo** obscures ~568 x 264 px in bottom-left — never place important content there
- **Best position for key text:** Right-center (avoids both mobile crop and profile photo overlap)

## Design guidelines

### Text
- **Keep text minimal** — the banner is narrow; text becomes unreadable at small sizes
- **Company banner:** Company tagline or value prop only. 1 line max
- **Personal banner:** Value proposition, role, or key credential. 1-2 lines max
- **High contrast** — must remain legible at rendered size

### Composition
- **Center all critical elements** — both horizontally and vertically
- **Test on both desktop and mobile** before publishing
- **Simple backgrounds** — the banner is a branding element, not an infographic
- **Avoid busy patterns** that compete with the profile photo overlay

### Brand elements
- **Company banner:** Logo + tagline is typical. Keep logo centered or right-of-center
- **Personal banner:** Can include company logo, personal brand elements, or a clean value prop
- **Brand colors should be consistent** with the company page and other LinkedIn assets

### What to avoid
- Important content in the bottom-left (profile photo overlap)
- Important content near edges (mobile cropping)
- Small text that becomes illegible at mobile rendering sizes
- Low-contrast designs that disappear against LinkedIn's light UI
- Busy, cluttered designs — this is a narrow, supporting element
