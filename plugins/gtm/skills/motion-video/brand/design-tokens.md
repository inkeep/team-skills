---
name: design-tokens
description: Inkeep brand colors, typography, and spacing for Remotion videos
---

# Inkeep Design Tokens

Exact values from the Inkeep website for use in Remotion videos.

## Canonical Source

**Always import tokens** from `remotion-videos/src/styles/brand.ts`:

```tsx
import { COLORS, FONTS, SPACING, RADIUS } from "./styles/brand";
```

Never define tokens locally in video files. Run `pnpm run brand:audit` to enforce.

## Colors

### Primary Palette

```tsx
// From styles/brand.ts - import, don't copy
const COLORS = {
  // Primary brand colors
  primary: "#3784ff",        // azure-blue - CTAs, links, accents
  primaryLight: "#69a3ff",   // sky-blue - hover states, secondary accents
  primaryLighter: "#d5e5ff", // crystal-blue - backgrounds, highlights
  primaryDark: "#29325c",    // blue-dark - dark text on light backgrounds

  // Neutrals
  background: "#fbf9f4",     // morning-mist - page background
  text: "#231f20",           // night-sky - primary text
  surface: "#f7f4ed",        // cream - card backgrounds
  surfaceAlt: "#fff5e1",     // white-cream - alternate surfaces

  // Accents
  accent: "#e1dbff",         // purple-light - badges, highlights
  secondary: "#d0e1ff",      // lavender-blue - secondary elements
  orange: "#fbe1bc",         // orange-light - warnings, accents

  // Grays
  muted: "#5f5c62",          // gray-light - muted text
  grayMedium: "#bdbdbd",     // gray-medium - borders, dividers
};
```

### Semantic Usage

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | #3784ff | Buttons, links, underlines, CTAs |
| `background` | #fbf9f4 | Video background, page background |
| `text` | #231f20 | Headlines, body text |
| `surface` | #f7f4ed | Card backgrounds, sections |
| `accent` | #e1dbff | Badge dots, highlights, decorative elements |

## Typography

### Font Families

```tsx
const FONTS = {
  // Primary - Headlines and body
  primary: "Neue Haas Grotesk Display Pro, Arial, Helvetica, sans-serif",

  // Serif - Subtext, quotes, descriptions
  serif: "Noto Serif, Georgia, serif",

  // Mono - Buttons, code, technical text
  mono: "JetBrains Mono, Consolas, monospace",
};
```

### Font Sizes

| Element | Desktop | Mobile | Weight | Letter Spacing |
|---------|---------|--------|--------|----------------|
| Hero headline | 72px | 48px | 400 (normal) | -0.02em / -1.5px |
| Section headline | 48px | 32px | 400 | -0.02em |
| Subheadline | 24px | 20px | 300 (light) | -0.4px |
| Body text | 16-18px | 16px | 400 | normal |
| Button text | 14-16px | 12-14px | 500 (medium) | -0.64px to -0.96px |
| Badge text | 16-20px | 12-16px | 300 (light) | -0.4px |

### Typography in Remotion

```tsx
// Hero headline style
const heroStyle = {
  fontFamily: FONTS.primary,
  fontSize: 72,
  fontWeight: 400,
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  color: COLORS.text,
};

// Subtext style (serif)
const subtextStyle = {
  fontFamily: FONTS.serif,
  fontSize: 24,
  fontWeight: 300,
  lineHeight: 1.25,
  letterSpacing: "-0.4px",
  color: COLORS.text,
};

// Button text style
const buttonStyle = {
  fontFamily: FONTS.mono,
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1.15,
  letterSpacing: "-0.64px",
  textTransform: "uppercase",
};
```

## Spacing

### Base Unit

Use 4px as the base spacing unit.

```tsx
const SPACING = {
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 16,   // 16px
  lg: 24,   // 24px
  xl: 32,   // 32px
  xxl: 48,  // 48px
  xxxl: 64, // 64px
};
```

### Section Spacing

| Element | Value |
|---------|-------|
| Section padding (vertical) | 64-96px |
| Section padding (horizontal) | 16-44px |
| Container max-width | 1440px |
| Content gap | 24-48px |

## Border Radius

```tsx
const RADIUS = {
  sm: 4,      // Small elements
  md: 8,      // Buttons, inputs
  lg: 16,     // Cards, sections
  xl: 24,     // Large cards
  pill: 9999, // Badges, pills (rounded-full)
};
```
