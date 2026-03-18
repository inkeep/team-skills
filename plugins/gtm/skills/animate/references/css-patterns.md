Use when: Generating Tier 1 or Tier 2 animations (CSS-only or CSS + IntersectionObserver)
Priority: P0
Impact: Without these patterns, the agent defaults to Motion for animations CSS handles natively

---

# CSS Animation Patterns

Copy-paste-ready patterns for the most common marketing site animations. Each pattern includes the component code, Tailwind classes, and `prefers-reduced-motion` handling.

---

## Animation Tokens (define once, use everywhere)

When generating multiple animated components for the same project, check if animation tokens already exist in `globals.css` or the Tailwind theme. If not, define them to prevent timing drift across the codebase:

```css
:root {
  --ease-default: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-bounce: cubic-bezier(0.3, 1.17, 0.55, 0.99); /* >1 y2 = overshoot */
  --ease-spring: linear(
    0, 0.004, 0.016, 0.035, 0.063, 0.098, 0.141, 0.191, 0.25, 0.316,
    0.391 36.8%, 0.563, 0.65, 0.726 58.2%, 0.862, 0.905, 0.937, 0.96,
    0.977, 0.988, 0.995, 1.001, 1.004, 1.005, 1.005 81.3%, 1.003,
    1.001 88.4%, 1 93.3%
  );
  --duration-micro: 200ms;    /* hover, tap, micro-interactions */
  --duration-entrance: 500ms; /* standard fade-up */
  --duration-hero: 1200ms;    /* hero reveals */
  --stagger-interval: 80ms;   /* between grid/list items */
}
```

**Easing cheat sheet:**
- `ease-out` or `var(--ease-default)` — standard entrance (decelerate into place)
- `var(--ease-bounce)` — overshoot entrance (Linear uses this for title slide-ups — the `1.17` y1 value (2nd parameter) exceeds 1.0, creating a bounce-past effect)
- `var(--ease-spring)` — CSS `linear()` spring approximation (Baseline 2023, ~88% support). Visually indistinguishable from a JS spring for non-interactive elements. Reserve Motion springs only for drag targets or rapidly toggled interactive elements that need velocity-aware interruption.

**Animation values should be proportional to the trigger size:**
- Hover on small button: `scale(1.02)` not `scale(1.2)`
- Card entrance: `translateY(20px)` not `translateY(100px)`
- Large hero element: `scale(0.9→1)` or `translateY(40px)` is appropriate
- Micro-interactions (< 200ms): keep transforms minimal — `scale(0.95→1)`, `translateY(2px)`

---

## 1. Fade-Up Entrance (The Universal Pattern)

The single most common animation on SaaS marketing sites. Every inspected site (Linear, Stripe, Vercel, Raycast, Clerk, Resend, Notion, Liveblocks) uses some variation.

**Upgrade: blur + fade.** Adding `filter: blur(6px)` to the entrance transition gives a depth-of-field quality that pure opacity + translate lacks. Change the transition property to `transition-[opacity,translate,scale,rotate,filter]` and add `blur-sm` to the hidden state, `blur-0` to the visible state. This is what Magic UI's BlurFade component does (19k stars).

**Tier:** 2 (CSS + IntersectionObserver)

```tsx
"use client";

import { useRef, useEffect, useState } from "react";

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
  duration?: number; // ms
  as?: keyof JSX.IntrinsicElements;
}

export function FadeUp({
  children,
  className = "",
  delay = 0,
  duration = 500,
  as: Tag = "div",
}: FadeUpProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as any}
      className={`transition-[opacity,translate,scale,rotate] ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
```

**With `react-intersection-observer` (if already in the project):**

```tsx
"use client";

import { useInView } from "react-intersection-observer";

export function FadeUp({ children, className = "", delay = 0 }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
```

---

## 1b. Entry Animation without IntersectionObserver — @starting-style

CSS-only entry animation when elements appear in the DOM. No JavaScript required. Baseline August 2024 (Chrome 117+, Firefox 129+, Safari 17.5+).

**Tier:** 1 (Pure CSS)

```css
.card {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

@starting-style {
  .card {
    opacity: 0;
    transform: translateY(20px);
  }
}
```

**Limitations:** Only works with `transition`, not `@keyframes`. Only triggers on first render or `display: none` → visible changes. Does NOT trigger when scrolling into view — use IntersectionObserver (pattern 1) for scroll-triggered entrances.

---

## 1c. CSS Show/Hide with Exit Animation — transition-behavior: allow-discrete

CSS can now animate elements to and from `display: none`. This narrows the gap with Motion's `AnimatePresence` for elements that stay in the DOM but toggle visibility via class changes.

**Tier:** 1 (Pure CSS — Chrome 117+, Safari 17.4+, Firefox 129+)

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease, display 0.3s allow-discrete;
}

@starting-style {
  .toast {
    opacity: 0;
    transform: translateY(20px);
  }
}

.toast.dismissed {
  opacity: 0;
  transform: translateY(-20px);
  display: none;
}
```

**When this replaces AnimatePresence:** When visibility is toggled via CSS class (`el.classList.add("dismissed")`) and the element stays in the DOM.

**When you still need AnimatePresence:** When React removes the element from the tree via `{show && <Component />}` — the element is gone from the DOM before CSS can animate it.

---

## 2. Staggered Grid Entrance

Children animate in sequence with incremental delays. Common for feature grids, logo bars, card layouts.

**Tier:** 2 (CSS + IntersectionObserver)

```tsx
"use client";

import { useRef, useEffect, useState } from "react";

interface StaggerGridProps {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number; // delay between each child, default 100ms
}

export function StaggerGrid({ children, className = "", staggerMs = 100 }: StaggerGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ "--stagger-ms": `${staggerMs}ms` } as React.CSSProperties}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              className={`transition-all duration-500 ease-out
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
              style={{ transitionDelay: `${i * staggerMs}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
```

---

## 3. Hover Card Lift

Subtle upward shift + shadow on hover. No JavaScript needed.

**Tier:** 1 (Pure CSS)

```tsx
// No "use client" needed — this is pure CSS
export function HoverCard({ children, className = "" }) {
  return (
    <div
      className={`transition-[transform,box-shadow] duration-300 ease-out
        hover:-translate-y-1 hover:shadow-lg
        ${className}`}
    >
      {children}
    </div>
  );
}
```

---

## 4. Hero Perspective Reveal (Linear Style)

3D perspective rotation that reveals the hero content. This is Linear's signature animation.

**Tier:** 1-2 (CSS keyframes, optionally triggered by IntersectionObserver)

```tsx
export function HeroPerspectiveReveal({ children, className = "" }) {
  return (
    <div className="[perspective:2000px]">
      <div
        className={`animate-hero-rotate ${className}`}
        style={{
          transformOrigin: "center bottom",
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

**Tailwind CSS (add to your CSS or Tailwind config):**

```css
@keyframes hero-rotate {
  0%   { transform: rotateX(25deg); opacity: 0; }
  25%  { transform: rotateX(25deg) scale(0.9); opacity: 1; }
  60%  { transform: none; }
  100% { transform: none; }
}

.animate-hero-rotate {
  animation: hero-rotate 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-hero-rotate {
    animation: none;
    transform: none;
    opacity: 1;
  }
}
```

---

## 5. SVG Line Draw

Animate an SVG path from invisible to fully drawn. Uses `stroke-dashoffset`.

**Tier:** 1 (Pure CSS)

```css
.line-draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw 1.2s ease-out forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}
```

```tsx
// Use pathLength="1" on the SVG path for normalized dash values
<svg viewBox="0 0 200 100">
  <path
    d="M10 80 Q 95 10 180 80"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    pathLength="1"
    className="line-draw"
  />
</svg>
```

---

## 6. Background Gradient Animation

Animated gradient using `@property` for smooth color/angle interpolation.

**Tier:** 1 (Pure CSS)

```css
@property --gradient-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.animated-gradient {
  background: linear-gradient(
    var(--gradient-angle),
    var(--color-primary, #3784ff),
    var(--color-accent, #667eea)
  );
  animation: rotate-gradient 6s linear infinite;
}

@keyframes rotate-gradient {
  to { --gradient-angle: 360deg; }
}
```

---

## 7. Clip-Path Reveal

Reveal content by animating `clip-path` from hidden to fully visible.

**Tier:** 1-2 (CSS, optionally scroll-triggered)

```css
.reveal-left {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-left.is-visible {
  clip-path: inset(0 0 0 0);
}
```

Variations:
- **From bottom:** `inset(100% 0 0 0)` → `inset(0)`
- **Circle expand:** `circle(0% at 50% 50%)` → `circle(100% at 50% 50%)`
- **Diagonal wipe:** `polygon(0 0, 0 0, 0 100%, 0 100%)` → `polygon(0 0, 100% 0, 100% 100%, 0 100%)`

---

## 8. CSS Scroll-Driven Parallax

Parallax effect with zero JavaScript using `animation-timeline: view()`.

**Tier:** 1 (Pure CSS — Chrome 115+, Safari 26+)

> **Firefox caveat:** `animation-timeline` is disabled by default in Firefox (requires user flag `layout.css.scroll-driven-animations.enabled`). This means **~17% of global users will NOT see scroll-driven animations.** Always pair with an `@supports` fallback. If your site has high Firefox traffic, prefer Tier 2 (CSS + IntersectionObserver) instead.

```css
.parallax-slow {
  animation: parallax-shift linear both;
  animation-timeline: view();
  animation-range: entry 0% exit 100%;
}

@keyframes parallax-shift {
  from { transform: translateY(40px); }
  to   { transform: translateY(-40px); }
}

/* REQUIRED: Fallback for Firefox and unsupported browsers */
@supports not (animation-timeline: view()) {
  .parallax-slow {
    animation: none;
    transform: none;
  }
}
```

**`animation-range` controls WHEN during scroll the animation plays:**

```css
animation-range: entry 0% cover 40%;   /* Start at viewport entry, complete at 40% covered */
animation-range: entry 25% entry 75%;  /* Only during the middle of entry */
animation-range: contain 0% exit 50%;  /* While fully visible through halfway out */
```

---

## 9. Scroll-Triggered Fade-In (CSS `animation-timeline: view()`)

Fade-in as the element scrolls into view. Zero JavaScript.

**Tier:** 1 (Pure CSS — same browser support and Firefox caveat as parallax above)

```css
.scroll-fade-in {
  animation: scroll-reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 40%;
}

@keyframes scroll-reveal {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@supports not (animation-timeline: view()) {
  /* Fallback: just show the element */
  .scroll-fade-in {
    opacity: 1;
    transform: none;
  }
}
```

---

## 10. Animated Counter

Animate a number from 0 to a target value using CSS `@property`.

**Tier:** 1 (Pure CSS)

```css
@property --num {
  syntax: "<integer>";
  inherits: false;
  initial-value: 0;
}

.counter {
  animation: count-up 2s ease-out forwards;
  counter-reset: num var(--num);
}

.counter::after {
  content: counter(num);
}

@keyframes count-up {
  to { --num: 97; } /* target number */
}
```

```tsx
<span className="counter" style={{ "--num-target": 97 } as React.CSSProperties} />
```

---

## 11. Motion Path Animation — offset-path

Animate elements along an arbitrary SVG path. Pure CSS, no JavaScript.

**Tier:** 1 (Pure CSS — Baseline March 2022, Chrome 46+, Firefox 72+, Safari 16+)

```css
.particle {
  offset-path: path("M0,100 C150,0 350,200 500,100");
  offset-rotate: auto; /* element rotates to follow the path direction */
  animation: followPath 3s ease-in-out infinite;
}

@keyframes followPath {
  from { offset-distance: 0%; }
  to   { offset-distance: 100%; }
}
```

Useful for: decorative particle animations on hero sections, logo path animations, orbital motion effects.

---

## 12. State-Driven Animation with :has() — No JavaScript

CSS `:has()` (Baseline 2023) enables animations triggered by child state changes without JavaScript. Useful for accordions, float-label inputs, and interactive elements.

**Tier:** 1 (Pure CSS)

```css
/* Accordion panel — expand when checkbox is checked */
.panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.accordion:has(input:checked) .panel {
  max-height: 500px;
}

/* Float label on input focus */
.input-group:has(input:focus) label,
.input-group:has(input:not(:placeholder-shown)) label {
  color: var(--color-primary);
  transform: translateY(-20px) scale(0.85);
  transition: all 0.2s ease;
}
```

---

## 13. Data-Attribute Animation System

Use `data-*` attributes instead of className toggling for state-driven animations. Cleaner selectors, no string manipulation, multiple states composable. Used by Emil Kowalski's Sonner (12.1k stars, zero animation dependencies).

**Tier:** 1-2 (Pure CSS selectors, JS only toggles the attribute)

```css
/* Define animation states as data-attribute selectors */
[data-state] {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

[data-state="hidden"] {
  opacity: 0;
  transform: translateY(100%);
}

[data-state="visible"] {
  opacity: 1;
  transform: translateY(0);
}

[data-state="exiting"] {
  opacity: 0;
  transform: translateY(calc(var(--lift, 1) * -100%));
}
```

```tsx
// JS side — just toggle an attribute, no className string building
<div
  data-state={isVisible ? "visible" : "hidden"}
  data-position={position} // Compose multiple data attributes
/>
```

**Why this is better than className toggling:** Data attributes can hold values (not just presence/absence), compose cleanly (`data-state` + `data-position` + `data-expanded`), and CSS selectors are more readable than class combinations.

---

## 14. Per-Keyframe Easing

Different `animation-timing-function` values at different keyframe percentages create non-uniform motion profiles within a single animation. Used by Linear's hero glow (fast flash at 10%, slow fade to 100%).

**Tier:** 1 (Pure CSS)

```css
@keyframes glow-reveal {
  0% {
    opacity: 0;
    animation-timing-function: cubic-bezier(0.74, 0.25, 0.76, 1); /* fast ease-in */
  }
  10% {
    opacity: 1;
    animation-timing-function: cubic-bezier(0.12, 0.01, 0.08, 0.99); /* very slow ease-out */
  }
  100% {
    opacity: 0.2;
  }
}

.glow { animation: glow-reveal 4100ms 600ms forwards; }
```

Each keyframe segment uses its own easing curve. The glow flashes to full opacity quickly (0-10% with aggressive ease-in), then slowly fades to 0.2 (10-100% with very slow ease-out). One `@keyframes` rule, two distinct motion profiles.

---

## 15. Parent-Class-Triggered Children

One IntersectionObserver on a parent section, many children animate via CSS ancestor selectors. Reduces observer count and centralizes scroll-trigger logic. Used by Linear's feature sections.

**Tier:** 2 (CSS + IntersectionObserver on parent only)

```tsx
"use client";

import { useRef, useEffect, useState } from "react";

export function AnimatedSection({ children, className = "" }) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={`${isVisible ? "is-visible" : ""} ${className}`}>
      {children}
    </section>
  );
}
```

```css
/* Children respond to parent's is-visible class */
.section-title {
  opacity: 0;
  transform: translateY(40%);
  transition: transform 1000ms cubic-bezier(0.3, 1.17, 0.55, 0.99), opacity 600ms ease;
}

.is-visible .section-title {
  opacity: 1;
  transform: translateY(0);
}

.section-description {
  opacity: 0;
  transform: translateY(20px);
  transition: all 600ms ease 200ms; /* 200ms delay after title */
}

.is-visible .section-description {
  opacity: 1;
  transform: translateY(0);
}
```

One observer, many animated elements. Each child can have its own delay, duration, and easing. No per-element IntersectionObserver needed.

---

## 16. Glass Morphism Border — mask-composite

Gradient border that fades from visible to transparent. Used by Linear for their card borders. Pure CSS, no JavaScript.

**Tier:** 1 (Pure CSS)

```css
.glass-border {
  position: relative;
}

.glass-border::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    rgba(255, 255, 255, 0.3),
    rgba(255, 255, 255, 0) 120%
  );
  mask:
    linear-gradient(black, black) content-box,
    linear-gradient(black, black);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
  pointer-events: none;
}
```

---

## prefers-reduced-motion — Global Pattern

Add this to your global CSS to disable all animations for users who prefer reduced motion:

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

This is a safety net. Individual components should also handle reduced motion when they have non-standard behavior (e.g., an animated counter should show the final value immediately).
