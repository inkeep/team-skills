Use when: Deciding which animation tier to use for a specific request
Priority: P0
Impact: Wrong tier selection leads to unnecessary bundle size (Motion when CSS suffices) or broken animations (CSS when Motion is needed)

---

# Animation Tier Decision Framework

## The four tiers

### Tier 1: Pure CSS (no JavaScript required)

**Use for:** Hover effects, focus states, background animations, gradient transitions, SVG line drawing, 3D perspective transforms, scroll-driven parallax (via `animation-timeline`), decorative effects.

**No `"use client"` needed.** Works in React Server Components.

**Decision criteria:** Animation is triggered by CSS pseudo-classes (`:hover`, `:focus`, `:active`), runs on page load via `@keyframes`, or is driven by scroll position via `animation-timeline`.

**Browser support notes:**
- `@keyframes`, `transition`, `transform`, `clip-path` — universal
- `@property` for custom property animation — Baseline 2024 (all modern browsers)
- `@starting-style` for entry animations — Baseline 2024
- `animation-timeline: scroll() / view()` — Chrome 115+, Safari 26+, Firefox requires flag (~83% global support as of March 2026)
- `linear()` timing function for spring approximation — Baseline 2023

### Tier 2: CSS + IntersectionObserver (minimal JavaScript)

**Use for:** Fade-up on scroll, staggered entrance animations, scroll-triggered reveals, one-shot entrance animations, parallax effects (cross-browser fallback).

**This is the most common tier.** Linear, Resend, and Liveblocks all use this pattern.

**Decision criteria:** Animation needs scroll-trigger detection but is otherwise achievable with CSS transitions. No exit animations needed. Element stays in the DOM after animating in.

**Implementation pattern:**
1. Component renders with "hidden" CSS state (e.g., `opacity-0 translate-y-8`)
2. IntersectionObserver detects when element enters viewport
3. CSS class toggles to "visible" state (e.g., `opacity-100 translate-y-0`)
4. CSS `transition` handles the interpolation

**Requires `"use client"`** because IntersectionObserver uses React hooks. But the animation itself runs on the compositor thread (CSS), not the main thread.

### Tier 3: CSS + View Transitions API (emerging)

**Use for:** Page transitions, tab content cross-fading, shared element morphing between routes.

**Status (March 2026):** The View Transitions API is Baseline for same-document transitions. However, Next.js integration is still `experimental`. **Do not adopt for production** until the `experimental` flag is removed.

**Decision criteria:** Need shared element transitions between routes or pages. Willing to use experimental features. Not shipping to production yet.

### Tier 4: Motion (surgical use only)

**Use for:** Exit animations on unmount, animated tab indicators, drag interactions, layout animations, complex multi-element orchestration.

**Always requires `"use client"`.** Adds ~5KB (LazyMotion) to ~32KB (full) to the bundle.

**Important:** If the element stays in the DOM and visibility is toggled via CSS class, CSS `transition-behavior: allow-discrete` (Chrome 117+, Safari 17.4+, Firefox 129+) can animate to/from `display: none` WITHOUT Motion. AnimatePresence is only necessary when React removes the element from the tree via `{show && <Component />}`.

**Decision criteria — one or more of these must be true:**
- Element uses React conditional rendering (`{show && <Component />}`) and needs to animate out before removal
- Element needs to animate between different DOM positions (shared element transition)
- User can drag, swipe, or pinch an element
- Layout changes need to animate (list reordering, panel resizing)
- Parent/child animation timing must cascade dynamically with unknown child count

**If none of these are true, use CSS.** The question is never "can Motion do this?" (it can do everything CSS can). The question is "does this NEED Motion?"

## Decision flowchart (full version)

```
START: What triggers the animation?
│
├── CSS pseudo-class (:hover, :focus, :active)?
│   └── Tier 1: CSS transition
│
├── Page load / always running?
│   └── Tier 1: CSS @keyframes
│
├── Scroll position (parallax, progress bar)?
│   ├── Need cross-browser (including Firefox)? → Tier 2: CSS + IO with scroll calc
│   └── Chrome/Safari sufficient? → Tier 1: CSS animation-timeline
│
├── Element scrolls into viewport?
│   ├── Needs exit animation when scrolling away? → Tier 4: Motion whileInView + exit
│   └── One-shot entrance only? → Tier 2: CSS + IntersectionObserver
│
├── Element mounts/unmounts in React?
│   ├── Needs animation on unmount? → Tier 4: Motion AnimatePresence
│   └── Only animates on mount? → Tier 2: CSS + IO (or CSS @starting-style)
│
├── User gesture (drag, swipe, pinch)?
│   └── Tier 4: Motion drag/gesture
│
├── Element changes DOM position or size?
│   └── Tier 4: Motion layout/layoutId
│
├── Animating height to/from auto (accordion, expand/collapse)?
│   └── Tier 4: Motion animate={{ height: "auto" }}
│     (CSS interpolate-size: allow-keywords exists but is not Baseline)
│
├── Coordinated multi-element sequence with dynamic timing?
│   ├── Fixed timing (known delays)? → Tier 2: CSS animation-delay
│   └── Dynamic (depends on child count or runtime state)? → Tier 4: Motion variants
│
└── Route/page transition?
    ├── Production? → Tier 2: CSS + class toggle during navigation
    └── Experimental OK? → Tier 3: View Transitions API
```

## Bundle optimization (when using Motion)

When Motion is necessary, minimize its footprint:

```tsx
// Use LazyMotion to load only the features you need (~5KB vs ~32KB)
import { LazyMotion, domAnimation } from 'motion/react';

function AnimatedSection({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
```

| Import strategy | Bundle size (gzipped) | Use when |
|----------------|----------------------|----------|
| `import { motion } from 'motion/react'` | Full bundle | Multiple Motion features needed (AnimatePresence + layoutId) |

**LazyMotion pitfalls:**
- Do NOT place `<LazyMotion>` at the root of your app — it can cause unnecessary re-renders of the entire subtree. Place it as close to the animated component as possible.
- `domAnimation` includes: animate, hover/tap/focus gestures, whileInView, exit animations.
- `domMax` adds: drag, layout animations, useScroll, SVG path animations.
- If you only need AnimatePresence + basic motion, use `domAnimation`. Only upgrade to `domMax` if you need drag or layout features.
- Version upgrades can increase bundle size even with LazyMotion — pin versions and audit bundle on upgrade.
| `LazyMotion` + `domAnimation` | ~5KB | Only this component needs Motion on the page |
| `LazyMotion` + `domMax` | ~17KB | Need layout animations, drag, or advanced features |
