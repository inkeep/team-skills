Use when: Building product demo animations (showing software UI in action, cursor movements, screen transitions)
Priority: P1
Impact: Without these patterns, product demos lack polish — missing browser chrome, cursor animation, highlight effects

---

# Product Demo Animation Patterns

Patterns for showing product UI in action on a marketing page. These create the "Pylon-style" product animations — looping demos of software features with browser frames, animated cursors, and highlighting.

All patterns are CSS-first. Motion is only used where explicitly noted.

---

## 1. Browser Mockup Frame

A realistic browser chrome wrapping a product screenshot or live content.

```tsx
import Image from "next/image";

interface BrowserFrameProps {
  src: string;
  alt: string;
  url?: string;
  className?: string;
  children?: React.ReactNode; // use instead of src for live content
}

export function BrowserFrame({ src, alt, url = "app.example.com", className = "", children }: BrowserFrameProps) {
  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 shadow-2xl ${className}`}>
      {/* Browser chrome bar */}
      <div className="h-10 bg-gray-100 flex items-center px-4 gap-3 border-b border-gray-200">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        {/* URL bar */}
        <div className="flex-1 flex justify-center">
          <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 min-w-[200px] text-center border border-gray-200">
            {url}
          </div>
        </div>
        <div className="w-[52px]" /> {/* Spacer to balance traffic lights */}
      </div>
      {/* Content */}
      <div className="relative bg-white">
        {children ?? (
          <Image src={src} alt={alt} width={1200} height={750} className="w-full h-auto" />
        )}
      </div>
    </div>
  );
}
```

**With entrance animation:**

```tsx
"use client";

import { useRef, useState, useEffect } from "react";

export function AnimatedBrowserFrame({ children, className = "" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="[perspective:1200px]">
      <div
        className={`transition-all duration-1000 ease-out
          ${isVisible
            ? "opacity-100 [transform:rotateX(0deg)_scale(1)]"
            : "opacity-0 [transform:rotateX(12deg)_scale(0.95)_translateY(40px)]"
          } ${className}`}
      >
        <BrowserFrame>{children}</BrowserFrame>
      </div>
    </div>
  );
}
```

---

## 2. Animated Cursor

A cursor that moves along a path to simulate user interaction.

**CSS approach (predefined path):**

```tsx
"use client";

import { useEffect, useState, useRef } from "react";

interface CursorPoint {
  x: number; // percentage of container width
  y: number; // percentage of container height
  delayMs: number; // pause at this point before moving to next
}

export function AnimatedCursor({
  points,
  durationMs = 600,
  className = "",
}: {
  points: CursorPoint[];
  durationMs?: number;
  className?: string;
}) {
  const [currentPoint, setCurrentPoint] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      setCurrentPoint((prev) => (prev + 1) % points.length);
    }, durationMs + points[currentPoint].delayMs);

    return () => clearTimeout(timer);
  }, [currentPoint, isAnimating, points, durationMs]);

  // Start when visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsAnimating(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const point = points[currentPoint];

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      <div
        className="absolute w-5 h-7 transition-all ease-out"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          transitionDuration: `${durationMs}ms`,
        }}
      >
        {/* Default macOS cursor SVG */}
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
          <path d="M1 1L1 22.5L6.5 17L12 26L16 24L10.5 15H19L1 1Z" fill="white" stroke="black" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
```

**Usage:**
```tsx
<div className="relative">
  <BrowserFrame src="/images/product/dashboard.png" alt="Dashboard" />
  <AnimatedCursor
    points={[
      { x: 30, y: 40, delayMs: 800 },
      { x: 65, y: 25, delayMs: 500 },
      { x: 65, y: 60, delayMs: 1200 },
      { x: 30, y: 40, delayMs: 400 },
    ]}
  />
</div>
```

---

## 3. Feature Highlight Glow

Draw attention to a specific area of a product screenshot.

```css
.highlight-pulse {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 0 0 0 rgba(55, 132, 255, 0.4);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(55, 132, 255, 0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(55, 132, 255, 0); }
}
```

```tsx
<div className="relative">
  <Image src="/images/product/feature.png" alt="Feature" ... />
  {/* Highlight a specific area */}
  <div
    className="highlight-pulse"
    style={{ top: "30%", left: "20%", width: "25%", height: "15%" }}
  />
</div>
```

---

## 4. Screen Transition (Slide Between Views)

Animate between multiple product screenshots to show a workflow.

**CSS-only version (class toggle):**

```tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export function ScreenCarousel({
  screens,
  intervalMs = 3000,
  transitionMs = 600,
}: {
  screens: { src: string; alt: string }[];
  intervalMs?: number;
  transitionMs?: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % screens.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [screens.length, intervalMs]);

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform ease-out"
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
          transitionDuration: `${transitionMs}ms`,
        }}
      >
        {screens.map((screen, i) => (
          <div key={i} className="w-full flex-shrink-0">
            <Image src={screen.src} alt={screen.alt} width={1200} height={750} className="w-full h-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Typing Simulation

Simulate text being typed character by character.

**CSS-only (fixed text, known character count):**

```css
.typing {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid;
  width: 0;
  animation:
    typing 2s steps(20) forwards,
    blink 0.7s step-end infinite;
}

@keyframes typing {
  to { width: 20ch; } /* Must match character count */
}

@keyframes blink {
  50% { border-color: transparent; }
}
```

**React version (dynamic text):**

```tsx
"use client";

import { useState, useEffect } from "react";

export function TypeText({ text, speedMs = 50, className = "" }: {
  text: string;
  speedMs?: number;
  className?: string;
}) {
  const [displayedCount, setDisplayedCount] = useState(0);

  useEffect(() => {
    if (displayedCount >= text.length) return;
    const timer = setTimeout(() => setDisplayedCount((c) => c + 1), speedMs);
    return () => clearTimeout(timer);
  }, [displayedCount, text.length, speedMs]);

  return (
    <span className={className}>
      {text.slice(0, displayedCount)}
      <span className="animate-pulse">|</span>
    </span>
  );
}
```

---

## 6. Staggered Data Populate

Grid items or list rows appear one by one, simulating data loading.

```tsx
"use client";

import { useState, useEffect, useRef } from "react";

export function StaggeredPopulate({
  items,
  staggerMs = 80,
  className = "",
}: {
  items: React.ReactNode[];
  staggerMs?: number;
  className?: string;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          // Start populating
          let count = 0;
          const interval = setInterval(() => {
            count++;
            setVisibleCount(count);
            if (count >= items.length) clearInterval(interval);
          }, staggerMs);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, staggerMs]);

  return (
    <div ref={containerRef} className={className}>
      {items.map((item, i) => (
        <div
          key={i}
          className={`transition-all duration-300 ease-out
            ${i < visibleCount ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
```

---

---

## 7. Dynamic Ambient Glow Lines (Linear Pattern)

Spawn decorative glow lines at random intervals to create an ambient hero effect. Each line uses CSS custom properties for dynamic styling and self-removes via `onAnimationEnd` to prevent unbounded DOM growth.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface GlowLine {
  id: string;
  direction: "to top" | "to left";
  duration: number;
  size: number;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function AmbientGlow({ className = "" }: { className?: string }) {
  const [lines, setLines] = useState<GlowLine[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Only spawn when visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const spawnLine = (delay: number) => {
      timeoutRef.current = setTimeout(() => {
        setLines((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            direction: Math.random() > 0.5 ? "to top" : "to left",
            duration: randomBetween(1300, 3500),
            size: randomBetween(10, 30),
          },
        ]);
        spawnLine(randomBetween(800, 2500));
      }, delay);
    };

    spawnLine(randomBetween(800, 1300));
    return () => clearTimeout(timeoutRef.current);
  }, [isVisible]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {lines.map((line) => (
        <div
          key={line.id}
          className="absolute animate-glow-line"
          style={{
            ["--direction" as string]: line.direction,
            ["--size" as string]: `${line.size}px`,
            ["--duration" as string]: `${line.duration}ms`,
            left: `${randomBetween(10, 90)}%`,
            top: `${randomBetween(10, 90)}%`,
          }}
          onAnimationEnd={() =>
            setLines((prev) => prev.filter((l) => l.id !== line.id))
          }
        />
      ))}
    </div>
  );
}
```

**Required CSS:**
```css
@keyframes glow-line {
  from {
    opacity: 0;
    transform: translateY(0);
  }
  20% { opacity: 1; }
  80% { opacity: 1; }
  to {
    opacity: 0;
    transform: translateY(-100px);
  }
}

.animate-glow-line {
  width: var(--size, 20px);
  height: 1px;
  background: linear-gradient(var(--direction, to top), rgba(55, 132, 255, 0.6), transparent);
  animation: glow-line var(--duration, 2s) ease-out forwards;
}
```

**Key technique:** Self-removing elements via `onAnimationEnd` prevent unbounded DOM growth. Each line exists only for the duration of its animation.

---

---

## 8. Animated Connection Beam (SVG Gradient Path)

Visualize connections between product components (e.g., agent → data source → response) with an animated beam of light traveling along an SVG path. More performant than `strokeDashoffset` for long paths.

**Requires Motion** (for gradient coordinate animation).

```tsx
"use client";

import { motion } from "motion/react";

interface BeamProps {
  path: string; // SVG path d attribute
  width?: number;
  height?: number;
  duration?: number;
  className?: string;
}

export function AnimatedBeam({ path, width = 400, height = 200, duration = 2, className = "" }: BeamProps) {
  const gradientId = `beam-${Math.random().toString(36).slice(2)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
    >
      <defs>
        <motion.linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "10%", y1: "0%", y2: "0%" }}
          animate={{ x1: "100%", x2: "110%", y1: "100%", y2: "100%" }}
          transition={{
            duration,
            repeat: Infinity,
            ease: [0.16, 1, 0.3, 1], // easeOutExpo
          }}
        >
          <stop stopColor="transparent" />
          <stop offset="0.5" stopColor="rgba(55, 132, 255, 0.8)" />
          <stop offset="1" stopColor="transparent" />
        </motion.linearGradient>
      </defs>

      {/* Static base path */}
      <path d={path} stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" fill="none" />

      {/* Animated gradient overlay */}
      <path d={path} stroke={`url(#${gradientId})`} strokeWidth="2" fill="none" />
    </svg>
  );
}
```

**Usage for a connection diagram:**
```tsx
<AnimatedBeam
  path="M 50,100 Q 200,20 350,100" // Bezier curve between two points
  width={400}
  height={200}
/>
```

**Key technique:** Animate the `linearGradient` coordinates (x1/y1/x2/y2) instead of `strokeDashoffset`. The gradient "window" slides along the path, creating a beam-of-light effect. More performant for long/complex paths and produces a cleaner glow.

---

## 9. Organic Background Blobs (SVG Goo Filter)

Multiple blurred gradient circles merge like liquid using an SVG `feColorMatrix` threshold filter. Not achievable with CSS alone.

```tsx
export function GooBackground({ colors = ["#3784ff", "#667eea", "#e5ae61"], className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* SVG goo filter — makes overlapping shapes merge */}
      <svg className="hidden">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>

      <div className="absolute inset-0" style={{ filter: "url(#goo)" }}>
        {colors.map((color, i) => (
          <div
            key={i}
            className={`absolute w-[40%] aspect-square rounded-full blur-2xl opacity-70 animate-blob-${i + 1}`}
            style={{
              background: `radial-gradient(circle at center, ${color}, transparent 70%)`,
              mixBlendMode: "hard-light",
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

**Required CSS:**
```css
@keyframes blob-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(30px, -50px) scale(1.1); }
  66%      { transform: translate(-20px, 20px) scale(0.9); }
}
@keyframes blob-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(-40px, 30px) scale(1.15); }
  66%      { transform: translate(25px, -40px) scale(0.85); }
}
@keyframes blob-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(20px, 40px) scale(0.9); }
  66%      { transform: translate(-30px, -20px) scale(1.1); }
}

.animate-blob-1 { animation: blob-1 7s ease-in-out infinite; left: 20%; top: 30%; }
.animate-blob-2 { animation: blob-2 8s ease-in-out infinite; left: 50%; top: 20%; }
.animate-blob-3 { animation: blob-3 9s ease-in-out infinite; left: 35%; top: 50%; }
```

**Key technique:** The `feColorMatrix` with alpha values `0 0 0 18 -8` creates a threshold effect that makes overlapping semi-transparent blurred shapes merge into continuous forms. The blobs animate with simple CSS keyframes; the SVG filter does the visual magic. Use sparingly — SVG filters can be heavy on mobile.

---

## Composing Patterns

A full product demo section typically combines several of these:

```tsx
<section>
  <FadeUp>
    <SectionHeader title="See it in action" />
  </FadeUp>

  <AnimatedBrowserFrame>
    <div className="relative">
      <ScreenCarousel screens={productScreens} />
      <AnimatedCursor points={cursorPath} />
      <div className="highlight-pulse" style={{ top: "35%", left: "50%", width: "20%", height: "10%" }} />
    </div>
  </AnimatedBrowserFrame>
</section>
```
