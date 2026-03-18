Use when: The tier decision routes to Tier 4 (Motion is genuinely needed)
Priority: P0
Impact: Without these patterns, the agent uses Motion incorrectly or reaches for it when CSS suffices

---

# Motion Patterns (Tier 4 Only)

Use these patterns ONLY when the tier decision framework confirms CSS cannot solve the problem. Each pattern includes the specific reason CSS falls short.

**Import convention:** Always `import { motion } from "motion/react"` (NOT `framer-motion` — the package was renamed).

---

## 1. Exit Animation on Unmount — AnimatePresence

**Why CSS can't do this:** When React conditionally renders (`{show && <Component />}`), the element is removed from the DOM immediately. CSS cannot animate an element that no longer exists. There is no CSS equivalent. The W3C is working on `@exit-style` but it is not in any browser as of March 2026.

**Frequency on marketing sites:** Common. Used for modals, dropdowns, notification banners, newsletter popups, accordion content, mobile menus.

```tsx
"use client";

import { motion, AnimatePresence } from "motion/react";

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Modal content */}
          <motion.div
            className="fixed inset-x-4 top-1/2 -translate-x-0 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 max-w-lg mx-auto"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## 2. Shared Element Transition — layoutId

**Why CSS can't do this:** An element in position A needs to animate smoothly to position B, where A and B are in different React components or different parts of the tree. CSS cannot interpolate between two DOM positions across components. The View Transitions API can do this, but Next.js support is experimental.

**Frequency on marketing sites:** Moderate. Used for animated tab indicators, sidebar highlights, card-to-detail transitions.

```tsx
"use client";

import { motion } from "motion/react";
import { useState } from "react";

const tabs = ["Features", "Pricing", "Docs"];

function AnimatedTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => setActive(i)}
          className="relative px-4 py-2 text-sm font-medium"
        >
          {active === i && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-white rounded-md shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            />
          )}
          <span className="relative z-10">{tab}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## 3. Tab Content with Exit Animation — AnimatePresence mode="wait"

**Why CSS can't do this:** The outgoing content needs to animate out BEFORE the incoming content animates in. CSS cannot coordinate exit-then-enter across conditional renders.

```tsx
"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

function TabContent({ tabs }) {
  const [active, setActive] = useState(0);

  return (
    <>
      <div className="flex gap-2 mb-4">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={active === i ? "font-bold" : "text-gray-500"}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tabs[active].content}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
```

---

## 4. Drag Interaction

**Why CSS can't do this:** CSS has no gesture tracking. There's no way to track a pointer's position during a drag and map it to element position with inertia and constraints.

**Frequency on marketing sites:** Rare. Occasionally used for sliders, before/after comparisons, swipeable carousels.

```tsx
"use client";

import { motion } from "motion/react";

function DraggableCard() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
      dragElastic={0.1}
      whileDrag={{ scale: 1.05, cursor: "grabbing" }}
      className="w-48 h-32 bg-white rounded-xl shadow-lg cursor-grab"
    />
  );
}
```

---

## 5. Looping Product Demo (State Machine)

**Why Motion (partially):** For simple looping sequences, CSS `@keyframes` with `animation-iteration-count: infinite` works. But for complex multi-phase demos with varying content per phase (showing different UI states, typing text, highlighting elements), a state machine with programmatic frame control is needed.

**This can be done with pure JS + CSS transitions** (no Motion required for the animation itself). Motion's `useAnimationFrame` is convenient but `requestAnimationFrame` works equally well.

```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Phase = "entering" | "showing" | "exiting" | "waiting";

interface DemoStep {
  content: React.ReactNode;
  showDurationMs: number;
}

export function LoopingDemo({ steps, transitionMs = 400, waitMs = 200 }: {
  steps: DemoStep[];
  transitionMs?: number;
  waitMs?: number;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("entering");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const advance = useCallback(() => {
    switch (phase) {
      case "entering":
        timerRef.current = setTimeout(() => setPhase("showing"), transitionMs);
        break;
      case "showing":
        timerRef.current = setTimeout(() => setPhase("exiting"), steps[currentStep].showDurationMs);
        break;
      case "exiting":
        timerRef.current = setTimeout(() => {
          setPhase("waiting");
        }, transitionMs);
        break;
      case "waiting":
        timerRef.current = setTimeout(() => {
          setCurrentStep((s) => (s + 1) % steps.length);
          setPhase("entering");
        }, waitMs);
        break;
    }
  }, [phase, currentStep, steps, transitionMs, waitMs]);

  useEffect(() => {
    advance();
    return () => clearTimeout(timerRef.current);
  }, [advance]);

  const isVisible = phase === "entering" || phase === "showing";

  return (
    <div
      className={`transition-all ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
      style={{ transitionDuration: `${transitionMs}ms` }}
    >
      {steps[currentStep].content}
    </div>
  );
}
```

Note: This pattern uses CSS transitions for the actual animation, not Motion. Motion is only needed if you want exit animations on the swapping content (add `AnimatePresence` around the content).

---

## 6. Layout Animation (List Reordering)

**Why CSS can't do this:** When items in a list change order, CSS cannot interpolate from old position to new position — it snaps. Motion's `layout` prop uses the FLIP technique (First, Last, Invert, Play) to create the illusion of smooth repositioning.

**Frequency on marketing sites:** Low. Occasionally used for filterable grids, sortable lists, drag-to-reorder.

```tsx
"use client";

import { motion, Reorder } from "motion/react";

function ReorderableList({ items, onReorder }) {
  return (
    <Reorder.Group values={items} onReorder={onReorder} className="space-y-2">
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item}
          className="p-4 bg-white rounded-lg shadow-sm cursor-grab"
          whileDrag={{ scale: 1.02, shadow: "0 8px 24px rgba(0,0,0,0.12)" }}
        >
          {item.label}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

---

---

## 7. Mouse-Tracking Gradient — useMotionTemplate

**Why CSS can't do this:** CSS cannot reactively bind mouse coordinates into gradient functions. `:hover` gives you a binary state, not continuous position tracking.

**Frequency on marketing sites:** Moderate. Used for interactive feature cards, hover effects on pricing tiers, spotlight effects on hero sections.

```tsx
"use client";

import { useMotionValue, motion, useMotionTemplate } from "motion/react";

export function GradientCard({ children, className = "" }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  // Reactive gradient string — updates without React re-renders
  const background = useMotionTemplate`radial-gradient(
    300px circle at ${mouseX}px ${mouseY}px,
    rgba(55, 132, 255, 0.12),
    transparent 80%
  )`;

  // Mouse-tracking border gradient (no extra elements needed)
  const border = useMotionTemplate`radial-gradient(
    200px circle at ${mouseX}px ${mouseY}px,
    rgba(55, 132, 255, 0.3),
    transparent 80%
  )`;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className={`relative rounded-xl border border-transparent ${className}`}
      style={{
        background,
        borderImage: border,
      }}
    >
      {children}
    </motion.div>
  );
}
```

**Key technique:** `useMotionTemplate` constructs a CSS string from motion values. Because motion values update outside React's render cycle, the gradient follows the mouse at 60fps with zero re-renders. The same pattern works for `mask-image`, `box-shadow`, or any CSS function that takes coordinates.

---

## 8. Scroll-Driven Spring — useTransform → useSpring Chain

**Why CSS can't do this:** CSS scroll-driven animations have linear progression. Adding spring physics to scroll-linked values requires JavaScript.

**Frequency on marketing sites:** Moderate. Used for parallax with bounce, elastic scroll progress bars, 3D perspective reveals that settle with spring easing.

```tsx
"use client";

import { useScroll, useTransform, useSpring, motion } from "motion/react";
import { useRef } from "react";

export function SpringParallax({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30 };

  // Chain: scroll position → mapped value → spring physics
  const y = useSpring(
    useTransform(scrollYProgress, [0, 1], [100, -100]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.3], [15, 0]),
    springConfig
  );

  return (
    <div ref={ref}>
      <motion.div style={{ y, rotateX }}>
        {children}
      </motion.div>
    </div>
  );
}
```

**Key technique:** `useTransform` maps scroll progress to a value range. `useSpring` wraps it to add physics-based easing. The spring smooths out the scroll input, adding elastic feel. The `[0, 0.3]` input range for `rotateX` means the 3D effect completes in the first 30% of scroll.

---

## 9. Focus-Pull Text Cycling — Blur + AnimatePresence

**Why CSS can't do this:** Requires exit animations on unmount (AnimatePresence) combined with per-character `filter: blur()` stagger.

**Frequency on marketing sites:** Common in hero sections. "AI for [support → sales → operations]" rotating text.

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function FocusPullWords({ words, intervalMs = 3000 }: {
  words: string[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [words.length, intervalMs]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[index]}
        className="inline-flex"
        exit={{
          opacity: 0,
          y: -20,
          filter: "blur(8px)",
          scale: 1.1,
          position: "absolute",
        }}
      >
        {words[index].split("").map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  );
}
```

**Key technique:** `filter: blur(8px)` → `blur(0px)` on each character simulates a camera focus-pull. Much richer than simple opacity. Setting `position: "absolute"` in the exit prevents layout shift during the crossfade. The per-character stagger (`delay: i * 0.04`) creates a wave effect.

---

## When to use whileInView (Motion) vs IntersectionObserver (CSS)

**Prefer IntersectionObserver + CSS** (Tier 2) — this is the default for all entrance animations:
- Fade-up, slide-in, scale-in, any one-shot entrance
- Staggered grid entrances
- Any scroll-triggered reveal

**Use Motion whileInView** (Tier 4) only when:
- You need the animation to reverse when scrolling away (`viewport={{ once: false }}`)
- You need true spring physics for the entrance (not just ease-out)
- The component already requires Motion for another reason (AnimatePresence, layoutId) AND the `whileInView` is on the same element
