---
name: animate
description: Generate on-page animations for React/Next.js marketing sites using a CSS-first, Motion-surgical approach. Use when creating entrance animations, scroll-triggered reveals, product demos, interactive components, hero sections, or any animated UI element. Also use when asked to add animation, motion, or transitions to a page or component. Triggers on "animate", "animation", "add motion", "scroll animation", "hero animation", "product demo animation", "entrance effect", "fade in", "parallax".
argument-hint: "[description of animation needed] (optional: target component or page path)"
---

# Animate — CSS-First On-Page Animation Skill

Generate production-quality on-page animations for React + Next.js + Tailwind sites. The core principle is **CSS-first, Motion-surgical** — use pure CSS and IntersectionObserver for 80-90% of animations, reach for Motion (Framer Motion) only when CSS genuinely cannot solve the problem.

**Why CSS-first:**
- Zero bundle cost (CSS is free, Motion adds JS to the client bundle)
- No `"use client"` boundary required (preserves React Server Components)
- Compositor-thread animation (transform/opacity) — better performance than main-thread JS
- 4/10 best-in-class SaaS sites (Linear, Stripe, Resend, Liveblocks) use zero JS animation libraries
- The practitioner consensus: Emil Kowalski, Stripe engineering, WordPress Gutenberg all advocate CSS as default

**Motion is irreplaceable for exactly 6 patterns:**
1. Exit animations on React unmount (`AnimatePresence`)
2. Shared element transitions (`layoutId`)
3. Gesture-driven animations (drag, swipe, pinch)
4. Automatic layout animations (FLIP for size/position changes)
5. Complex variant orchestration (parent→child cascading timing)
6. Animating to `height: auto` (accordion expand/collapse) — CSS cannot interpolate to `height: auto`. The emerging `interpolate-size: allow-keywords` (Chrome 129+) will solve this but is not yet Baseline.

If the animation doesn't require one of these five, use CSS.

---

## Workflow

### Step 1: Understand the request

Identify:
- **What type of animation?** Entrance, scroll-triggered, hover, interactive, looping demo, background effect
- **Where does it go?** New component, existing component, page section
- **Does it need to be interactive?** Hover only, click-triggered, scroll-driven, gesture-driven
- **Does anything need to animate OUT (unmount)?** This is the key Motion trigger

### Step 2: Run the tier decision

Walk through this flowchart. Stop at the first YES.

```
Is the animation purely CSS-driven (hover, focus, keyframes, scroll-timeline)?
├── YES → Tier 1: Pure CSS
│         Load: references/css-patterns.md
└── NO
    ├── Does the element need to animate on React unmount?
    │   └── YES → Tier 4: Motion (AnimatePresence)
    │             Load: references/motion-patterns.md
    ├── Does the element need to animate to a new DOM position?
    │   └── YES → Tier 4: Motion (layoutId)
    │             Load: references/motion-patterns.md
    ├── Does the user interact via drag/swipe/pinch?
    │   └── YES → Tier 4: Motion (gestures)
    │             Load: references/motion-patterns.md
    ├── Does the animation need scroll-trigger visibility detection?
    │   └── YES → Tier 2: CSS + IntersectionObserver
    │             Load: references/css-patterns.md
    └── Is the animation a simple entrance triggered by mount?
        └── YES → Tier 2: CSS + IntersectionObserver
                  Load: references/css-patterns.md
```

**When in doubt, default to Tier 2 (CSS + IntersectionObserver).** This covers the vast majority of marketing site animations.

If the request is specifically a **product demo animation** (showing software UI in action, cursor movements, screen transitions), also **Load:** `references/product-demo-patterns.md`

If the built-in patterns don't cover the requested animation type, **Load:** `references/inspiration-repos.md` — OSS repos with inspectable source code for unusual effects.

### Step 3: Discover project conventions

Before generating code, scan the target codebase for existing animation patterns:

1. **Check for Motion usage:** `grep -r "from.*motion" src/ --include="*.tsx" | head -5`
   - Note which components use Motion and what features they use (AnimatePresence, layoutId, drag, or just whileInView)
   - Simple `whileInView` fade-ups are candidates for CSS replacement

2. **Check for existing easing/duration conventions:**
   - Search for `ease:` or `transition:` patterns in existing animated components
   - Match whatever easing and duration the project already uses
   - If no conventions exist, use these defaults:
     - Easing: `ease-out` (CSS) or `[0.25, 0.46, 0.45, 0.94]` (Motion cubic-bezier)
     - Duration: `500ms` for entrances, `300ms` for hover/micro-interactions, `600-800ms` for hero reveals
     - Stagger: `100ms` between items (0.1s delay increment)
     - Entrance translate: `20-30px` upward (`translateY(20px)` → `translateY(0)`)

3. **Check Tailwind version.** Tailwind v4 has breaking changes for animations:
   - `transition-[opacity,transform]` does NOT work — v4 uses individual properties. Use `transition-[opacity,translate,scale,rotate]` instead.
   - `blur-sm` is 8px in v4 (was 4px in v3). Use `blur-xs` for the old `blur-sm` behavior.
   - v4 adds native 3D: `perspective-*`, `rotate-x-*`, `rotate-y-*`, `translate-z-*`, `transform-3d`
   - v4 adds `starting:` variant (maps to `@starting-style`) and `transition-discrete` (maps to `transition-behavior: allow-discrete`)
   - Custom animations use `@theme` in CSS instead of `tailwind.config.js`:
     ```css
     @theme {
       --animate-fade-up: fade-up 0.5s ease-out;
     }
     @keyframes fade-up {
       from { opacity: 0; transform: translateY(20px); }
     }
     ```

### Step 4: Generate the component

Load the appropriate reference file and generate the component. Follow these rules for ALL output:

**Load:** `references/performance-rules.md` — always, for every animation.

**Component conventions:**
- Add `"use client"` only if the component uses React hooks or Motion. CSS-only animations with no JS interaction do NOT need it.
- Use Tailwind classes for animation properties when they exist (`transition-all`, `duration-500`, `ease-out`). Fall back to inline styles or `@keyframes` in a `<style>` tag or CSS module for complex sequences.
- For IntersectionObserver, prefer `react-intersection-observer` if already in the project, otherwise use the native API with a custom hook.

### Step 5: Verify output

Before delivering, check:

- [ ] Only compositor-safe properties animated (transform, opacity, filter, clip-path)
- [ ] `prefers-reduced-motion` handled (reduced-motion users see instant state, no motion)
- [ ] `"use client"` added only when necessary
- [ ] No unnecessary Motion imports (if CSS solves the problem, don't import motion)
- [ ] Entrance animations use `once: true` (don't replay on every scroll)
- [ ] Component works without JavaScript (CSS animations degrade gracefully)

---

## Quick Reference — Animation Types

| Animation needed | Tier | Approach |
|-----------------|------|----------|
| Fade-up on scroll | 2 | CSS transition + IntersectionObserver class toggle |
| Hover card lift | 1 | CSS `transition` + `:hover` pseudo-class |
| Staggered grid entrance | 2 | CSS `animation-delay` via custom property + IntersectionObserver |
| Hero perspective reveal | 1-2 | CSS `@keyframes` with `rotateX` + perspective container |
| SVG line draw | 1 | CSS `stroke-dashoffset` animation |
| Background gradient | 1 | CSS `@property` + `@keyframes` |
| Tab content swap with exit | 4 | Motion `AnimatePresence mode="wait"` |
| Animated tab indicator | 4 | Motion `layoutId` |
| Modal/dropdown close | 4 | Motion `AnimatePresence` |
| Drag-to-reorder | 4 | Motion `drag` + `Reorder` |
| Scroll-linked parallax | 1 | CSS `animation-timeline: view()` |
| Product demo (UI showcase) | 2 | CSS + IntersectionObserver + product demo patterns |
| Looping product demo | 2-4 | State machine with CSS transitions (or useAnimationFrame for complex sequences) |
| Clip-path reveal | 1 | CSS `clip-path` transition |
| Animated counter | 1 | CSS `@property` with `<integer>` syntax |

---

## Common Mistakes

```
❌ Using motion.div for a simple fade-up entrance
✅ CSS class toggle via IntersectionObserver — avoids adding "use client" boundary and bundle cost

❌ Animating width, height, top, left, margin, padding
✅ Animating transform, opacity, filter, clip-path — compositor-safe

❌ Missing prefers-reduced-motion handling
✅ @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition-duration: 0.01ms !important; } }

❌ Forgetting "use client" on a component that uses Motion hooks
✅ Add "use client" at the top when using motion/react imports

❌ Adding "use client" to a component that only uses CSS animations
✅ CSS animations work in Server Components — no "use client" needed

❌ Entrance animations that replay every time element scrolls in/out of view
✅ Use triggerOnce: true (react-intersection-observer) or observe once then disconnect

❌ AnimatePresence wrapping an element that's always in the DOM
✅ AnimatePresence is only for elements that mount/unmount ({show && <Component />}).
   For class-toggle visibility, use CSS transition-behavior: allow-discrete instead.

❌ Using Motion for scroll-linked parallax when page has no other Motion usage
✅ CSS animation-timeline: view() with @supports fallback — runs on compositor thread

❌ Wrapping an entire page component in "use client" just for one animation
✅ Extract only the animated wrapper as a Client Component; pass content as children

❌ Using Motion for animation that coexists with heavy JS work (route changes, data loading)
✅ Use CSS transitions — they run on the compositor thread and are unaffected by main thread load.
   Documented production issue: Vercel replaced Motion shared layout animations with CSS because
   Motion dropped frames during page transitions when the main thread was busy loading the new page.

❌ Defining the same @keyframes in multiple CSS files across the project
✅ Define animation tokens (duration, easing, keyframes) once in globals.css, reference via custom properties

❌ Putting <LazyMotion> at the app root level
✅ Wrap LazyMotion around only the specific component that needs Motion — root-level causes subtree re-renders
```

---

## Cross-References

- **Need a video version of the animation?** Use the Remotion video pipeline (`/motion-video`, `/video-pipeline`, `/blog-to-video`) — same visual concept, rendered to MP4 for social distribution.
- **Need a static graphic instead?** Use `/graphics` — Figma designs, AI-generated images, 3D renders.
- **Need an interactive 3D element?** Consider React Three Fiber (`@react-three/fiber`) for WebGL content, or Rive for interactive 2D/2.5D.
