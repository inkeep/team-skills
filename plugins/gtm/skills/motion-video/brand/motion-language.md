---
name: motion-language
description: Inkeep animation easing curves, timing patterns, and motion philosophy for Remotion videos
---

# Inkeep Motion Language

Animation patterns and timing extracted from the Inkeep website for consistent motion in Remotion videos.

## Easing Curves

### Primary Easings

```tsx
// Standard Inkeep easing - smooth, professional feel
// Used for most element reveals, section transitions
const INKEEP_EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Text transition easing - slightly different curve for text
// Used for badge text rotation, headline reveals
const TEXT_EASE = [0.32, 0.72, 0, 1] as const;

// Quick easing - for small, fast interactions
const QUICK_EASE = "easeOut"; // or "easeInOut"
```

### Using Custom Easing in Remotion

Remotion's `interpolate` doesn't directly support cubic-bezier arrays. Use this helper:

```tsx
import { interpolate, Easing } from "remotion";

// Approximate cubic-bezier with Remotion's built-in easings
// INKEEP_EASE [0.25, 0.46, 0.45, 0.94] is close to:
const inkeepEasing = Easing.out(Easing.cubic);

// For more precision, use a bezier approximation:
function bezier(t: number, p1: number, p2: number, p3: number, p4: number) {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p3 + t * t * t;
}

const customEasing = (t: number) => bezier(t, 0.25, 0.46, 0.45, 0.94);

// Usage
const opacity = interpolate(frame, [0, 18], [0, 1], {
  extrapolateRight: "clamp",
  easing: customEasing,
});
```

## Timing Patterns

### Frame-Based Timing (at 30fps)

| Duration | Frames | Usage |
|----------|--------|-------|
| 0.3s | 9 frames | Quick transitions, hover states |
| 0.5s | 15 frames | Element reveals, fade-ins |
| 0.6s | 18 frames | Headline reveals, underline draws |
| 1.0s | 30 frames | Logo rotations, major transitions |
| 8.0s | 240 frames | Badge rotation interval |

### Stagger Delays

| Delay | Frames | Usage |
|-------|--------|-------|
| 0.1s | 3 frames | Tight stagger (list items) |
| 0.2s | 6 frames | Standard stagger (logos) |
| 0.3s | 9 frames | Medium stagger (cards) |
| 0.5s | 15 frames | Underline delay after headline |

### Animation Sequences

**Hero Section Timing:**
```
Frame 0:    Badge pill starts fading in
Frame 9:    Badge visible, headline starts
Frame 15:   Headline visible, starts y-translate
Frame 18:   Headline in position
Frame 30:   Underline starts drawing (0.5s delay)
Frame 48:   Underline complete
Frame 54:   Subtext starts fading in
Frame 72:   Subtext complete
```

## Motion Patterns

### Element Reveals

**Standard fade-up pattern** (most common):
```tsx
const frame = useCurrentFrame();

// Y offset: 20-30px
const translateY = interpolate(frame, [0, 15], [20, 0], {
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});

// Opacity: 0 → 1
const opacity = interpolate(frame, [0, 15], [0, 1], {
  extrapolateRight: "clamp",
});

return (
  <div style={{ transform: `translateY(${translateY}px)`, opacity }}>
    {children}
  </div>
);
```

### Underline Draw

**Blue underline scaleX effect:**
```tsx
const frame = useCurrentFrame();
const FPS = 30;
const DELAY_FRAMES = 15; // 0.5s delay
const DURATION_FRAMES = 18; // 0.6s duration

const scaleX = interpolate(
  frame,
  [DELAY_FRAMES, DELAY_FRAMES + DURATION_FRAMES],
  [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

const opacity = interpolate(
  frame,
  [DELAY_FRAMES, DELAY_FRAMES + 3],
  [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

return (
  <div
    style={{
      transform: `scaleX(${scaleX})`,
      transformOrigin: "left",
      opacity,
    }}
  >
    {/* Underline SVG or image */}
  </div>
);
```

### Badge Rotation

**Pill badge with rotating content:**
```tsx
const frame = useCurrentFrame();
const FPS = 30;
const ROTATION_INTERVAL = 240; // 8 seconds

// Logo spin on load (360° over 1s)
const logoRotation = interpolate(
  frame,
  [0, 30],
  [0, 360],
  { extrapolateRight: "clamp" }
);

// Scale entrance (0.8 → 1)
const scale = interpolate(
  frame,
  [0, 15],
  [0.8, 1],
  { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
);

return (
  <div style={{ transform: `scale(${scale})` }}>
    <img style={{ transform: `rotate(${logoRotation}deg)` }} />
    {/* Badge content */}
  </div>
);
```

### Staggered Grid

**Logo grid with staggered reveal:**
```tsx
const frame = useCurrentFrame();
const STAGGER_DELAY = 6; // 0.2s per item

const logos = ["logo1", "logo2", "logo3", "logo4"];

return (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
    {logos.map((logo, index) => {
      const startFrame = index * STAGGER_DELAY;

      const opacity = interpolate(
        frame,
        [startFrame, startFrame + 15],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

      const translateY = interpolate(
        frame,
        [startFrame, startFrame + 15],
        [20, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

      return (
        <div key={logo} style={{ opacity, transform: `translateY(${translateY}px)` }}>
          {/* Logo */}
        </div>
      );
    })}
  </div>
);
```

## Animation Philosophy

### Principles

1. **Smooth, not snappy** - Use ease-out curves, not linear or bounce
2. **Subtle movement** - Y-offset of 20-30px, not dramatic slides
3. **Sequential, not simultaneous** - Stagger elements for visual hierarchy
4. **Purpose-driven** - Every animation should guide attention

### Do's and Don'ts

| Do | Don't |
|----|-------|
| Use consistent easing curves | Mix different easing styles |
| Stagger related elements | Animate everything at once |
| Keep Y-offset subtle (20-30px) | Use large dramatic movements |
| Draw underlines left-to-right | Use bounce or spring effects |
| Fade logos to 0.75-0.9 opacity | Leave logos at full opacity |
| Use viewport triggers on scroll | Auto-play all animations |

### Section Transitions

Between sections, use a simple opacity fade with slight scale:

```tsx
const TRANSITION_DURATION = 15; // 0.5s

const opacity = interpolate(
  frame,
  [0, TRANSITION_DURATION],
  [0, 1],
  { extrapolateRight: "clamp" }
);

const scale = interpolate(
  frame,
  [0, TRANSITION_DURATION],
  [0.995, 1],
  { extrapolateRight: "clamp" }
);
```
