# Inkeep Video Brand Checklist

Mandatory checks for all Inkeep Remotion videos. Videos must pass all items before rendering.

## Brand Identity

### Logo & Watermark
- [ ] **Logo appears in first 5 seconds** - Use `BrandedIntroScene` or similar opening scene
- [ ] **Watermark present in content scenes** - 40px icon, 0.4 opacity, bottom-right corner
- [ ] **Watermark excluded from intro/outro** - Avoid visual clutter on brand-focused scenes
- [ ] **Outro logo is 400px** - Large, prominent logo in closing scene
- [ ] **Logo uses correct asset** - `images/logos/inkeep-logo-core-black.svg`

### Colors
- [ ] **Import from `styles/brand.ts`** - Never define colors locally
- [ ] **Primary color**: `COLORS.primary` (#3784ff)
- [ ] **Background color**: `COLORS.background` (#fbf9f4)
- [ ] **Text color**: `COLORS.text` (#231f20)
- [ ] **Surface color**: `COLORS.surface` (#f7f4ed)
- [ ] **Run `pnpm run brand:audit`** - Must pass with zero issues

### Typography
- [ ] **Import `FONTS` from `styles/brand.ts`** - Never hardcode font families
- [ ] **Primary font**: `FONTS.primary` (Neue Haas Grotesk Display Pro)
- [ ] **Mono font**: `FONTS.mono` (JetBrains Mono)
- [ ] **Serif font**: `FONTS.serif` (Noto Serif)
- [ ] **Headline size**: 48-56px minimum
- [ ] **Body text size**: 24-32px minimum

## Animation Patterns

### Timing
- [ ] **Fade-up duration**: 15-18 frames
- [ ] **Underline draw duration**: 18-20 frames
- [ ] **Stagger delay**: 5-8 frames between elements
- [ ] **Scene transitions**: Smooth, no jumps

### Easing
- [ ] **Primary easing**: `Easing.out(Easing.cubic)` for fade-ups
- [ ] **Bounce easing**: `Easing.out(Easing.back(1.5))` for pop-in effects
- [ ] **Linear easing**: For opacity changes only

### Remotion Requirements
- [ ] **All animations use `useCurrentFrame()`**
- [ ] **All interpolations have `extrapolateLeft: "clamp"`**
- [ ] **All interpolations have `extrapolateRight: "clamp"`**
- [ ] **No CSS transitions anywhere**
- [ ] **All images use `<Img>` from remotion**
- [ ] **All assets use `staticFile()`**

## Content Guidelines

### Text Style
- [ ] **Titles in sentence case** - Only first letter capitalized
- [ ] **"Agent" always capitalized** - It's a brand term
- [ ] **Tagline correct**: "The Agent Platform for Customer Operations"
- [ ] **URL format**: `inkeep.com/path` (no https://)

### LinkedIn Optimization
- [ ] **Format**: 1080×1080 (square)
- [ ] **FPS**: 30
- [ ] **Duration**: 30-60 seconds
- [ ] **Hook in first 3 seconds** - Attention-grabbing opening
- [ ] **Muted-friendly** - All meaning conveyed visually
- [ ] **Text readable** - Minimum 48px headlines, high contrast

## Audio-Visual Sync

### Sync Validation (if word-timing.json exists)
- [ ] **Sync validator passes**
- [ ] **No timing mismatches**
- [ ] **Scene boundaries align with natural pauses**
- [ ] **Displayed text matches spoken words**

## Quick Reference

### Required Components

```tsx
// For content scenes (not intro/outro)
import { Watermark } from '../components/Watermark';

// Add watermark to each content scene
<Sequence from={...} durationInFrames={...}>
  <YourScene />
  <Watermark />
</Sequence>
```

### Required Intro Scene

```tsx
import { BrandedIntroScene } from '../scenes/blog/BrandedIntroScene';

// First scene - logo appears within 5 seconds
<Sequence from={0} durationInFrames={150}>
  <BrandedIntroScene title="Your Blog Title" />
</Sequence>
```

### Required Outro Scene

```tsx
import { BlogOutroScene } from '../scenes/blog/BlogOutroScene';

// Last scene - 400px logo with underline
<Sequence from={...} durationInFrames={90}>
  <BlogOutroScene blogUrl="inkeep.com/blog/slug" />
</Sequence>
```

## Checklist Summary

| Category | Items | Status |
|----------|-------|--------|
| Logo & Watermark | 5 | |
| Colors | 6 | |
| Typography | 6 | |
| Animation Timing | 4 | |
| Animation Easing | 3 | |
| Remotion Requirements | 6 | |
| Text Style | 4 | |
| LinkedIn Optimization | 6 | |
| Audio-Visual Sync | 4 | |
| **Total** | **44** | |

All 44 items must pass before rendering final video.
