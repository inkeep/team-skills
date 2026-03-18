Use when: The skill's built-in patterns don't cover a requested animation, or you need to see how a specific effect is implemented in production
Priority: P2
Impact: Agent guesses at implementation instead of referencing proven OSS examples

---

# Inspiration Repos

Open-source repositories with inspectable animation source code. Dig into these when the skill's built-in patterns don't cover a specific request.

## When to use this reference

- User requests an animation type not covered by css-patterns.md, motion-patterns.md, or product-demo-patterns.md
- You need to see how a specific complex effect is implemented (not just the concept)
- You're unsure whether CSS or Motion is the right approach for an unusual animation

## Component Libraries (copy-paste animated components)

| Repo | Stars | Approach | Best for | Inspect when |
|------|-------|----------|----------|-------------|
| [Magic UI](https://github.com/magicuidesign/magicui) | ~19k | Motion + CSS, shadcn-compatible | Marketing components: blur-fade, text reveal, animated beams, border beams, shimmer buttons, magic cards | Need a polished marketing component pattern |
| [motion-primitives](https://github.com/ibelick/motion-primitives) | ~5.4k | Motion-first building blocks | Text morph (layoutId per character), border trail (offset-path + mask-composite), animated groups with presets, transition panels | Need composable Motion primitives or clever layoutId usage |
| [React Bits](https://github.com/DavidHDev/react-bits) | ~36.8k | CSS-first, mixed (GSAP, Canvas, WebGL) | Text effects (glitch, variable font), backgrounds (silk shader, aurora), hover transitions | Need an unusual CSS-only text effect or a WebGL background |
| [Aceternity UI](https://github.com/aceternity/aceternity-ui) | ~3.3k | Motion-heavy, 200+ components | 3D card effects, hero parallax, tracing beams, spotlight, infinite scroll, word cycling | Need a complex scroll-driven or 3D perspective pattern |
| [Animate UI](https://github.com/animate-ui/animate-ui) | — | Shadcn CLI-native | Drop-in animated components installable via shadcn CLI | Need a quick component that integrates with shadcn setup |

## Practitioner Repos (study for technique)

| Repo | Stars | What to learn |
|------|-------|--------------|
| [Sonner](https://github.com/emilkowalski/sonner) | ~12.1k | Zero-dependency animation via data-attributes + CSS transitions. Swipe-to-dismiss with velocity detection. CSS custom property composition for stacking. The gold standard for "no animation library needed." |
| [Vaul](https://github.com/emilkowalski/vaul) | ~8.2k | Drawer component with gesture + spring physics. How to build drag interactions without a full animation library. |
| [cmdk](https://github.com/pacocoursey/cmdk) | ~12.3k | Command palette with layout animations. Clean Motion integration in a complex interactive component. |
| [rebuilding-linear.app](https://github.com/frontendfyi/rebuilding-linear.app) | — | CSS-only recreation of Linear's marketing site. Hero 3D rotation, conic gradient glow, SVG line drawing, dynamic glow lines, glass borders (mask-composite), parent-class-triggered children, per-keyframe easing. |

## Experiment Collections (browse for ideas)

| Source | What it covers |
|--------|---------------|
| [Codrops](https://github.com/codrops) | 1,000+ MIT-licensed animation demos. Search by effect type. |
| [awesome-web-effect](https://github.com/nicksrandall/awesome-web-effect) | ~3k stars. Curated WebGL/CSS effect collection. |
| [GSAP Showcase](https://gsap.com/showcase/) | Production sites using GSAP. Good for scroll-driven inspiration. |

## How to inspect a repo for technique

1. Find the component source file (usually in `src/components/`, `registry/`, or `packages/`)
2. Check imports — what animation library (if any)?
3. Look for the animation trigger — IntersectionObserver? useInView? CSS :hover? useScroll?
4. Look for the animation itself — CSS transition? @keyframes? motion.div? useAnimationFrame?
5. Check for `prefers-reduced-motion` handling
6. Extract the minimal pattern and adapt to the project's conventions
