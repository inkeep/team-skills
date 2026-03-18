---
name: assets
description: Inkeep logo paths, icons, and background assets for Remotion videos
---

# Inkeep Brand Assets

Asset paths from the Inkeep website for use in Remotion videos.

## Logos

### Core Logo

The canonical Inkeep logo is bundled with this skill:

| Asset | Path | Usage |
|-------|------|-------|
| **Core logo (black)** | `inkeep-logo-core-black.svg` (in skill directory) | Primary logo for videos |

### Website Logos

| Asset | Path | Usage |
|-------|------|-------|
| Logo with text (dark) | `/images/logos/logo-with-text-black.svg` | Header, light backgrounds |
| Logo with text (light) | `/images/logos/logo-with-text-white.svg` | Dark backgrounds |
| Logo icon (blue) | `/images/logos/inkeep-logo-blue.svg` | Badges, favicons, small uses |
| Logo icon (white) | `/images/logos/inkeep-logo-white-scale.svg` | Dark backgrounds |
| Core logo (black) | `/images/logos/brand-download/inkeep-logo-core-black.svg` | Brand downloads |

### Usage in Remotion

```tsx
import { Img, staticFile } from "remotion";

// Use staticFile() to reference assets in public/ folder
<Img
  src={staticFile("images/logos/logo-with-text-black.svg")}
  style={{ width: 200 }}
/>

// For animated logo reveal
<Img
  src={staticFile("images/logos/inkeep-logo-blue.svg")}
  style={{
    width: 48,
    height: 48,
    transform: `rotate(${rotation}deg)`,
  }}
/>
```

## Icons

### Arrows

| Asset | Path | Usage |
|-------|------|-------|
| Arrow (black) | `/icons/arrow-black.svg` | Button icons, navigation |
| Arrow (blue) | `/icons/arrow-blue.svg` | Links, CTAs on light bg |
| Arrow (gray) | `/icons/arrow-gray.svg` | Muted navigation |
| Arrow down (black) | `/icons/arrow-black-down.svg` | Dropdowns, expand |
| Arrow up (black) | `/icons/arrow-black-up.svg` | Collapse, scroll up |

### Decorative

| Asset | Path | Usage |
|-------|------|-------|
| Blue underline curve | `/icons/line-curve-blue.png` | Headline underlines |
| Blue line | `/icons/line-blue.svg` | Horizontal dividers |
| Orange line | `/icons/line-orange.svg` | Accent dividers |
| Check (blue) | `/icons/check-blue.svg` | Success, list items |
| Quote (blue) | `/icons/quote-blue.svg` | Testimonial quotes |

### Shapes

| Asset | Path | Usage |
|-------|------|-------|
| Circle (black) | `/icons/circle-black.svg` | Bullet points |
| Circle (orange) | `/icons/circle-orange.png` | Accent dots |
| Circles overlap (blue) | `/icons/circles-overlap-blue.svg` | Decorative |
| Hand-drawn dash | `/icons/hand-drawn-dash.svg` | Informal accents |

## Backgrounds

### Textures

| Asset | Path | Usage |
|-------|------|-------|
| Dot grid | `/images/dots.png` | Section overlays, cards |
| Hero background | `/images/home/home-hero-background.png` | Hero sections |

### Usage in Remotion

```tsx
// Dot grid overlay
<div
  style={{
    backgroundImage: `url(${staticFile("images/dots.png")})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.5,
    position: "absolute",
    inset: 0,
  }}
/>

// Hero background
<Img
  src={staticFile("images/home/home-hero-background.png")}
  style={{
    position: "absolute",
    top: 64,
    right: 0,
    width: 800,
    height: "auto",
  }}
/>
```

## OG Image / Thumbnail

| Asset | Path | Usage |
|-------|------|-------|
| OG Image | `/images/og-image.png` | Social sharing fallback |

## Asset Loading in Remotion

**IMPORTANT:** Always use `staticFile()` for assets in the `public/` folder:

```tsx
import { staticFile, Img } from "remotion";

// Correct - uses staticFile
<Img src={staticFile("images/logos/logo-with-text-black.svg")} />

// Incorrect - won't work in Remotion
<img src="/images/logos/logo-with-text-black.svg" />
```

For remote assets, use `delayRender()` and `continueRender()` to ensure they load:

```tsx
import { delayRender, continueRender, Img } from "remotion";
import { useCallback, useState } from "react";

const [handle] = useState(() => delayRender());

const onLoad = useCallback(() => {
  continueRender(handle);
}, [handle]);

<Img src={remoteSrc} onLoad={onLoad} />
```
