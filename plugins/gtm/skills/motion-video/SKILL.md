---
name: motion-video
description: Creates Remotion videos matching Inkeep's brand identity, design system, and animation language. Use when creating marketing videos, product demos, social content, motion graphics, or any video that must match inkeep.com's visual style. Provides exact colors, easing curves, typography, and reusable components.
---

# Motion Video Skill

Creates on-brand Remotion videos that match the Inkeep website's visual identity and motion language.

## Critical Remotion Rules

Read these BEFORE writing any composition code. Violations cause silent rendering failures.

1. **Use `useCurrentFrame()`** — Never use CSS animations or Tailwind animate classes
2. **Use `<Img>` from remotion** — Not `<img>`, ensures images load before render
3. **Always use `extrapolateRight: "clamp"`** — Prevents values going out of bounds
4. **Frame-based timing** — At 30fps: 30 frames = 1 second, 15 frames = 0.5 second
5. **No CSS transitions** — They don't render correctly in Remotion
6. **Always import brand tokens** — Never define colors or fonts locally

```tsx
// ✅ Correct
import { COLORS, FONTS, SPACING, RADIUS } from "./styles/brand";
import { FadeUp, UnderlineDraw, ScaleIn, Title, Eyebrow, Subtitle } from "./brand";

// ❌ Wrong — never define tokens locally
const COLORS = { primary: "#3784ff" }; // Don't do this!
```

---

## Workflow

Follow these phases in order. Do not skip phases.

### Phase 1: Plan

Determine what to build before writing code.

**1a. Choose video format:**

| Format | Dimensions | Use Case |
|--------|-----------|----------|
| Landscape | 1920x1080 | YouTube, website embeds |
| Square | 1080x1080 | LinkedIn, Instagram feed |
| Portrait | 1080x1920 | Instagram Stories, TikTok |
| Twitter | 1200x675 | Twitter/X video |

**1b. Determine video type** (affects which components and which verification layers):

| Type | Components to consider | Verification |
|------|----------------------|--------------|
| Text reveal / logo animation | FadeUp, Title, UnderlineDraw, ScaleIn, Eyebrow | Layer 1 + 2 |
| Blog / landing page video | Section transitions, text components, logo grid | Layer 1 + 2 |
| Product demo / walkthrough | BrowserFrame, CursorMove, TypingCode, ZoomInto, Terminal | Layer 1 + 2 + 3 |

**1c. Load brand references:**

- **Load:** `/brand` — brand identity, principles, color usage, typography rules, text style rules
- **Load:** `brand/motion-language.md` — easing curves, timing, animation patterns (Remotion-specific)
- For token values: read `.claude/design-system/manifest.md`
- For product demos: **Load:** `references/product-demo-patterns.md` — how to compose walkthrough scenes
- For advanced Remotion features: **Load** the `remotion-best-practices` skill, then read the relevant rule file. Use when the video needs any of these:

| Feature | Rule file |
|---|---|
| 3D content (Three.js / R3F) | `rules/3d.md` |
| Audio (trimming, volume, pitch, speed) | `rules/audio.md` |
| Captions / subtitles | `rules/subtitles.md` → links to display, import, transcribe |
| Charts / data visualization | `rules/charts.md` |
| Dynamic duration / metadata | `rules/calculate-metadata.md` |
| Font loading (Google / local) | `rules/fonts.md` |
| GIF / animated image sync | `rules/gifs.md` |
| Lottie animations | `rules/lottie.md` |
| Maps (Mapbox) | `rules/maps.md` |
| Measuring text / fitting to containers | `rules/measuring-text.md` |
| Parametrizable compositions (Zod) | `rules/parameters.md` |
| Scene transitions (@remotion/transitions) | `rules/transitions.md` |
| Text animations (typewriter, highlight) | `rules/text-animations.md` |
| Transparent video rendering | `rules/transparent-videos.md` |
| Video embedding (trim, loop, speed) | `rules/videos.md` |

**1d. Collect visual assets:**

For each scene in the video, consider whether it needs visual assets beyond text and existing logos:

| Scene content | Asset needed? |
|---|---|
| Feature callout with a concept (e.g., "Knowledge-First") | Likely — custom icon or illustration |
| Integration or partner mention | Likely — third-party logo via `/graphics` |
| "How it works" or architecture explanation | Likely — diagram or flow illustration |
| Metric or statistic as hero visual | Maybe — styled chart or metric card |
| Product UI walkthrough | Maybe — polished mockup for intro frame |
| Premium intro/outro | Maybe — 3D rendered logo tile |
| Text-only headline or announcement | No — existing components suffice |

Check `remotion-videos/public/` and the brand asset library for existing assets.

**If assets are missing** → **Load:** `references/graphics-delegation.md` for the full capabilities catalog, subagent prompt template, and return contract. Spawn `/graphics` subagents in parallel for each missing asset.

**If all assets exist** → proceed to Phase 2.

### Phase 2: Set up composition

Create the composition file using this template:

```tsx
import { useCurrentFrame, interpolate, Sequence, Easing } from "remotion";
import { COLORS, FONTS } from "./styles/brand";
import { FadeUp, Title } from "./brand";

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic), // Standard Inkeep easing
  });

  return (
    <div style={{ backgroundColor: COLORS.background, width: "100%", height: "100%" }}>
      {/* Your content */}
    </div>
  );
};
```

Register the composition in `remotion-videos/src/Root.tsx`.

### Phase 3: Build scenes

Build the composition scene by scene.

**3a. Choose components for each scene:**

| If you need... | Use |
|---|---|
| Text appearing with animation | `FadeUp` (built-in primitive) wrapping `Title`, `Eyebrow`, or `Subtitle` |
| Brand underline on a headline | `UnderlineDraw` (built-in primitive) |
| Logo entrance | `ScaleIn` (built-in primitive) |
| Multiple logos appearing | Copy `components/logo-grid.tsx` |
| Browser showing a product UI | Copy `components/browser-frame.tsx` |
| Cursor clicking through UI | Copy `components/cursor-move.tsx` — layer on top of BrowserFrame |
| Terminal running commands | Copy `components/terminal.tsx` |
| Code being typed | Copy `components/typing-code.tsx` |
| Zooming into a UI detail | Copy `components/zoom-into.tsx` |
| Something custom | Build it — use `useCurrentFrame()` + `interpolate()` with brand tokens |

**3b. For intro/outro frames:**

**Logo assets:** Check `remotion-videos/public/images/logos/` for available logo files. Use `staticFile()` to reference them.

- Intro: logo animation in first 5 seconds
- Content frames: small watermark (40px, 0.4 opacity, bottom-right)
- Outro: large centered logo (400px)

**3c. Assemble with `<Sequence>`:**

Each `<Sequence>` takes `from` (start frame) and `durationInFrames`. At 30fps: multiply seconds by 30 for frame count.

**3d. Run brand audit:**

```bash
cd remotion-videos && pnpm run brand:audit
```

**Load:** `brand-checklist.md` — 44-item manual checklist. Review before proceeding to verification.

### Phase 4: Verify

After creating or editing a composition, you MUST verify the output before considering it done. Do not skip any required layer.

#### Step 0: Create verification tasks

Create tasks to track progress. These survive context compaction and make skipped steps visible.

Create one task per required layer (see Phase 1b table for which layers):
- "Verify [CompositionId]: Layer 1 — programmatic checks"
- "Verify [CompositionId]: Layer 2 — visual brand evaluation"
- "Verify [CompositionId]: Layer 3 — animation flow" (only for motion-heavy)

#### Step 1: Layer 1 — Programmatic checks

Mark the Layer 1 task `in_progress`.

```bash
npx tsx <path-to-skill>/scripts/verify-composition.ts \
  --composition <CompositionId> --layers 1 --cwd remotion-videos/
```

Read `remotion-videos/tmp/verification-result.json`.

**Exit gate:** All frames pass dimension checks AND color sampling shows brand colors at corners. If Layer 1 fails, fix the composition and re-run. Do not proceed to Layer 2 until Layer 1 passes. Mark task `completed` when it passes.

#### Step 2: Layer 2 — Visual brand evaluation (via subagent)

Mark the Layer 2 task `in_progress`.

**You MUST use a subagent for this step — not self-evaluation.** The agent that wrote the composition has confirmation bias. A subagent gets fresh context with no knowledge of the source code.

The subagent will read `prompts/static-frame-evaluation.md` itself — you do not need to load it. Just include the path in the subagent prompt.

Spawn the subagent with the frame paths from Layer 1's `framePaths` output:

```
Agent tool:
  description: "Evaluate rendered frames"
  subagent_type: general-purpose
  prompt: |
    Read the evaluation prompt at:
    <path-to-skill>/prompts/static-frame-evaluation.md

    Then read each of these rendered PNG frames and evaluate them
    against the criteria in that prompt:
    - remotion-videos/tmp/frames/<CompositionId>/frame-0.png
    - remotion-videos/tmp/frames/<CompositionId>/frame-<N>.png
    (list all frame paths from verification-result.json framePaths)

    Context: This is a <Square/Landscape/Portrait> video for
    <LinkedIn/YouTube/website>. The composition is "<CompositionId>".

    Score every frame using the SCORE: format specified in the prompt.
    Report all issues with specific visual evidence.
```

**Exit gate:** All frames have FRAME_PASSED: true. If any frame fails, fix the composition and re-run from Step 1. Mark task `completed` when all frames pass.

#### Step 3: Layer 3 — Animation flow (motion-heavy videos only)

Mark the Layer 3 task `in_progress`.

The script sends the video to Gemini with `prompts/motion-flow-evaluation.md` as the evaluation prompt. You can read that file to understand what dimensions are scored, but the script handles the prompt injection automatically.

```bash
GOOGLE_AI_API_KEY=<key> npx tsx <path-to-skill>/scripts/verify-composition.ts \
  --composition <CompositionId> --layers 3 --cwd remotion-videos/
```

Read `remotion-videos/tmp/verification-result.json` — the `layers.flow` section contains the full evaluation with per-dimension scores.

**Exit gate:** PASSED: true (overall_score >= 6.0 AND no dimension below 4). If Layer 3 fails, fix timing/easing and re-run Layer 3 only. Mark task `completed` when it passes.

#### Iteration limits

Max iterations per layer: Layer 1 (3), Layer 2 (3), Layer 3 (2). After exceeding limits, escalate to human review.

For CLI flags, architecture details, and degradation behavior, see **[references/visual-verification.md](references/visual-verification.md)**.

---

## Reference

### Brand tokens

All videos MUST import tokens from `remotion-videos/src/styles/brand.ts`:

| Export | Description |
|--------|-------------|
| `COLORS` | 14 brand colors (primary, background, text, surface, etc.) |
| `FONTS` | 3 font families (primary, serif, mono) |
| `SPACING` | 6 spacing values (xs through xxl) |
| `RADIUS` | 5 border radius values |
| `colors` | Legacy alias (azureBlue, morningMist, etc.) |

For full brand identity: Load `/brand`. For token values: `.claude/design-system/manifest.md`. For motion patterns: **[brand/motion-language.md](brand/motion-language.md)**

### Built-in primitives

Import from `remotion-videos/src/brand/`:

| Component | Purpose |
|-----------|---------|
| `FadeUp` | Standard reveal animation (delay, duration, yOffset props) |
| `UnderlineDraw` | Brand underline SVG animation |
| `ScaleIn` | Scale-in with fade for logos |
| `Title` | Pre-styled title component (hero/section/card sizes) |
| `Eyebrow` | Monospace uppercase label |
| `Subtitle` | Secondary text styling |

### Reference components (in this skill folder)

**Brand & text:**
- **[components/text-reveal.tsx](components/text-reveal.tsx)** — Headline/text fade-up animation
- **[components/underline-draw.tsx](components/underline-draw.tsx)** — Blue underline scaleX effect
- **[components/badge-pill.tsx](components/badge-pill.tsx)** — Rotating pill badge with logo
- **[components/logo-grid.tsx](components/logo-grid.tsx)** — Staggered logo grid animation
- **[components/section-fade.tsx](components/section-fade.tsx)** — Section enter/exit transitions

**Product demo:**
- **[components/browser-frame.tsx](components/browser-frame.tsx)** — Browser window mockup with URL bar, tabs, navigation
- **[components/device-frame.tsx](components/device-frame.tsx)** — Phone/tablet/laptop mockup with screen glare
- **[components/terminal.tsx](components/terminal.tsx)** — Terminal with animated command typing and output
- **[components/typing-code.tsx](components/typing-code.tsx)** — Code editor with character-by-character typing
- **[components/cursor-move.tsx](components/cursor-move.tsx)** — Animated cursor with click ripple effect
- **[components/zoom-into.tsx](components/zoom-into.tsx)** — Animated zoom into screenshot region
- **[components/ui-highlight.tsx](components/ui-highlight.tsx)** — Glow/pulse effect highlighting a UI element
- **[components/scrollable-content.tsx](components/scrollable-content.tsx)** — Simulated scrolling in clipped container
- **[components/notification-popup.tsx](components/notification-popup.tsx)** — Toast notification with spring entrance
- **[components/multi-panel-layout.tsx](components/multi-panel-layout.tsx)** — Split-screen with staggered entrance

For composition patterns: **[references/product-demo-patterns.md](references/product-demo-patterns.md)**

### Recommended packages

All local, no cloud APIs:

| Package | What it adds |
|---------|-------------|
| `@remotion/sfx` | Built-in UI sounds (whoosh, click, pop) |
| `@remotion/light-leaks` | WebGL cinematic transition overlays |
| `@remotion/motion-blur` | Frame blending for smoother motion |
| `@remotion/noise` | Procedural noise for organic backgrounds |
| `@remotion/shapes` | Composable SVG shapes (circles, stars, polygons) |
| `@remotion/layout-utils` | `fitText()`, `measureText()` for text overflow |
| `@remotion/paths` | `evolvePath()` for line-drawing animations |
| `remotion-bits` | 40+ animation primitives (AnimatedText, AnimatedCounter, StaggeredMotion, TypeWriter, CodeBlock, GradientTransition) |

### Example prompts

**Simple headline reveal:**
> "Create a 10-second video with the headline 'The Agent Platform for Customer Operations' fading in with the blue underline effect"

**Logo showcase:**
> "Create a 15-second video showing the Inkeep logo animating in, followed by trusted customer logos appearing in a staggered grid"

**Social announcement:**
> "Create a 1080x1080 video announcing a new feature, using Inkeep's motion language and brand colors"

**Product demo:**
> "Create a 30-second product demo video showing the visual builder in action — browser frame with cursor clicking through the UI, zooming into the Agent configuration panel, then showing a success notification"

**Terminal + code walkthrough:**
> "Create a video showing terminal running 'pnpm install @inkeep/agent-sdk', then cut to a code editor typing the integration code"
