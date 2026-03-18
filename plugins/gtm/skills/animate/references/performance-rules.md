Use when: Always — load for every animation component generated
Priority: P0
Impact: Violating these rules causes jank, layout thrashing, failed Lighthouse audits, and accessibility complaints

---

# Performance Rules

These rules are non-negotiable. Every animated component must satisfy all of them.

---

## Rule 1: Compositor-Safe Properties Only

Only animate properties that the browser can handle on the compositor thread (GPU) without triggering layout or paint.

**Animate these (compositor-safe):**

| Property | CSS | Tailwind |
|----------|-----|----------|
| `transform` | `transform: translateY(-4px)` | `translate-y-1`, `scale-105`, `rotate-3` |
| `opacity` | `opacity: 0.5` | `opacity-50` |
| `filter` | `filter: blur(4px)` | `blur-sm` |
| `clip-path` | `clip-path: inset(0)` | — (use inline style) |
| `backdrop-filter` | `backdrop-filter: blur(12px)` | `backdrop-blur-md` |

**Never animate these (trigger layout/paint):**

| Property | Why | Use instead |
|----------|-----|-------------|
| `width`, `height` | Triggers layout recalculation for every frame | `transform: scale()` |
| `top`, `left`, `right`, `bottom` | Triggers layout | `transform: translate()` |
| `margin`, `padding` | Triggers layout | `transform: translate()` |
| `border-width` | Triggers layout + paint | `box-shadow` or `outline` |
| `font-size` | Triggers layout | `transform: scale()` |
| `background-color` | Triggers paint (acceptable for hover, avoid in continuous animation) | — |
| `box-shadow` | Triggers paint (acceptable for hover transitions, avoid in loops) | Use a pseudo-element with opacity |

### Box-shadow optimization

If you need to animate box-shadow (e.g., hover card lift), use the pseudo-element trick:

```css
.card {
  position: relative;
}

.card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.card:hover::after {
  opacity: 1;
}
```

This animates `opacity` (compositor-safe) instead of `box-shadow` (paint-triggering).

---

## Rule 2: Always Handle prefers-reduced-motion

Users who set "Reduce motion" in their OS settings should see instant state changes with no animation. This is an accessibility requirement, not optional polish.

**Global safety net (add to global CSS once):**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Also check for data-saver mode (Chromium-only, ~78% support):**

```tsx
function useShouldAnimate() {
  const [shouldAnimate, setShouldAnimate] = useState(false); // SSR-safe default
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as any).connection?.saveData === true;
    setShouldAnimate(!reducedMotion && !saveData);
  }, []);
  return shouldAnimate;
}
```

Note: `navigator.connection.saveData` is Chromium-only (no Safari, no Firefox). Always feature-detect.

**Per-component (when the component has non-decorative animation like a counter or demo):**

```tsx
"use client";

import { useEffect, useState } from "react";

function usePrefersReducedMotion() {
  // Default to true (animations disabled) so that during SSR and hydration,
  // reduced-motion users never see animation flash. This is the canonical
  // pattern from Josh Comeau.
  const [prefersReduced, setPrefersReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
```

**For Motion components:**

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: prefersReduced ? 0 : 0.5 }}
/>
```

---

## Rule 3: Minimize "use client" Boundaries

In Next.js App Router, `"use client"` creates a client boundary — the component and its imports ship JavaScript to the client. CSS animations do not require `"use client"`.

**WARNING:** If you use `motion.div` inside a data-heavy page component, that entire component becomes client-side — including any data-fetching logic. Always isolate Motion into thin wrapper components that accept children (which remain server-rendered).

```
❌ Anti-pattern — entire page becomes client-side just for one animation:

  "use client"
  export default function Page() {
    const data = await fetch(...); // This fetch now happens client-side!
    return <motion.div>{/* lots of content */}</motion.div>
  }

✅ Correct — only the animation wrapper is client-side:

  // Page stays Server Component
  export default function Page() {
    const data = await fetch(...); // Stays on the server
    return <AnimatedSection><Content data={data} /></AnimatedSection>
  }
```

**Pattern: Thin client wrapper around server content**

```tsx
// ServerPage.tsx — no "use client", renders on server
import { AnimatedSection } from "./AnimatedSection";

export default function Page() {
  return (
    <main>
      <AnimatedSection>
        {/* This content renders on the server */}
        <h1>Server-rendered heading</h1>
        <p>Server-rendered paragraph with zero client JS</p>
      </AnimatedSection>
    </main>
  );
}
```

```tsx
// AnimatedSection.tsx — thin client wrapper
"use client";

import { useInView } from "react-intersection-observer";

export function AnimatedSection({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section
      ref={ref}
      className={`transition-all duration-500 ease-out
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      {children}
    </section>
  );
}
```

The `AnimatedSection` wrapper is the only client component. All content inside it renders on the server. This is far better than wrapping the entire page in `"use client"` just for a fade-up effect.

---

## Rule 4: Lazy Load Heavy Animated Components

For components with significant JavaScript (complex animations, Motion with AnimatePresence, WebGL), use Next.js `dynamic` import:

```tsx
import dynamic from "next/dynamic";

const HeroAnimation = dynamic(
  () => import("./HeroAnimation"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] opacity-0" aria-hidden />
    ),
  }
);
```

**When to lazy load:**
- Component uses Motion's heavier features (AnimatePresence, Reorder, gesture)
- Component has complex state machines or timers
- Component is below the fold (not visible on initial load)

**When NOT to lazy load:**
- Simple CSS transitions (zero cost, no need to defer)
- Above-the-fold content (lazy loading causes CLS)

---

## Rule 5: will-change Management

`will-change` tells the browser to prepare GPU layers ahead of time. Used correctly, it prevents first-frame jank. Used incorrectly, it wastes GPU memory.

**Rules:**
- Add `will-change` only to elements that will animate imminently
- Remove it after animation completes
- Never apply `will-change` to more than a handful of elements at once
- Never use `will-change: auto` (it does nothing)

**CSS approach (hover-triggered):**

```css
.card {
  transition: transform 0.3s ease;
  /* No will-change at rest */
}

.card:hover {
  will-change: transform;
  transform: translateY(-4px);
}
```

**For scroll-triggered animations:** Add `will-change` when the element is about to enter the viewport (via IntersectionObserver with a larger rootMargin), remove it after animation completes.

---

## Rule 7: Bypass React During Continuous Interactions

During drag, mousemove, or scroll-linked animations at 60fps, do NOT use `setState` to update positions. React re-renders are too slow for per-frame updates.

**Use one of these instead:**

```tsx
// Option 1: Direct CSS custom property mutation (zero React involvement)
function handleMouseMove(e: React.MouseEvent) {
  const el = e.currentTarget as HTMLElement;
  el.style.setProperty("--mouse-x", `${e.clientX}px`);
  el.style.setProperty("--mouse-y", `${e.clientY}px`);
}
// CSS consumes the variables:
// background: radial-gradient(at var(--mouse-x) var(--mouse-y), ...)

// Option 2: Motion's useMotionValue (updates outside React render cycle)
const x = useMotionValue(0);
const y = useMotionValue(0);
function handleMouseMove(e) {
  x.set(e.clientX - rect.left);
  y.set(e.clientY - rect.top);
}
// Use with useMotionTemplate for reactive CSS strings
```

**When this matters:** Any handler that fires at pointer/scroll frequency (mousemove, pointermove, scroll, touchmove). Using `setState` in these handlers causes 60 React re-renders per second, which will jank on any non-trivial component tree.

Source: Emil Kowalski's Sonner uses `el.style.setProperty('--swipe-amount-x', ...)` during drag — zero React re-renders during the entire swipe interaction.

---

## Rule 8: Mobile Considerations

- **Reduce animation complexity on mobile.** Complex multi-layer animations that run smoothly on desktop may jank on low-end phones. Consider simpler animations or shorter durations.
- **Test on real devices.** The Chrome DevTools throttle is not representative of real mobile GPU performance.
- **Avoid continuous animations (infinite loops) on mobile.** They drain battery and compete with scroll performance.
- **Parallax effects should degrade gracefully.** If `animation-timeline` isn't supported, the element should be visible in its final state.
