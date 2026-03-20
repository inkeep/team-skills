# React Three Fiber 3D Render Pipeline (Option F)

Use when: Creating 3D rendered objects (glassmorphic tiles, clay/plastic objects, metallic surfaces), batch rendering parameterized 3D assets, or any graphic requiring exact brand colors in 3D with deterministic output
Priority: P0 (when using Option F)
Impact: Wrong material setup, failed WebGL rendering, inconsistent 3D quality

---

## Overview

Option F renders 3D scenes to PNG via a local pipeline: write an R3F scene in TSX → bundle with Bun → render in headless Chrome (GPU-accelerated via system Chrome) → capture screenshot via Playwright. No external API, no cost per render, deterministic output.

The pipeline uses **React Three Fiber (R3F)** — a React renderer for Three.js — with **drei** (100+ staging/material/helper components) and **@react-three/postprocessing** (declarative effects). Scenes are written as JSX components, not imperative Three.js code.

This is the programmatic 3D tool — the agent writes the scene as code, controlling every material property, light position, and camera angle with exact values. For exploration or one-off renders where visual polish outweighs precision, prefer GPT Image (Option E).

## When to use Three.js vs other options

| Signal | Use Three.js (Option F) | Use GPT Image (Option E) | Use Quiver (Option D) |
|--------|------------------------|-------------------------|----------------------|
| Need exact brand colors in 3D | ✅ Hex-precise materials | ⚠️ Approximate | N/A (2D) |
| Need glass/transmission effects | ✅ MeshTransmissionMaterial | ✅ Also excellent | N/A |
| Need to batch-render variations | ✅ Loop over parameters | ⚠️ One API call each | ⚠️ One API call each |
| Need deterministic output | ✅ Same code = same render | ❌ Varies each call | ⚠️ Somewhat consistent |
| Need partner logo on 3D object | ✅ Load as texture | ❌ Will hallucinate | N/A |
| Quick concept exploration | ❌ Setup overhead | ✅ Just a prompt | ✅ Just a prompt |
| Need vector/scalable output | ❌ Raster PNG only | ❌ Raster only | ✅ SVG |
| Illustrative/hand-drawn style | ❌ Wrong tool | ❌ Wrong tool | ✅ Designed for this |

**Best use cases for Three.js:**
- Integration icon tiles (partner logo on glassmorphic tile — template once, batch render)
- Conceptual 3D objects for Tier 1 blog cover launches
- Brand hero 3D elements (clay objects, glass elements in Inkeep colors)
- Any 3D asset that needs to match exact brand tokens

## Script usage

```bash
# Basic render (GPU auto-detection)
bun plugins/gtm/skills/graphics/tools/r3f/render.ts render \
  --scene my-scene.tsx \
  --output render.png

# Custom dimensions + SwiftShader fallback (CI/Docker)
bun plugins/gtm/skills/graphics/tools/r3f/render.ts render \
  --scene my-scene.tsx \
  --output render.png \
  --width 1280 --height 720 --scale 2 \
  --gpu swiftshader

# Transparent background (for compositing in Figma)
bun plugins/gtm/skills/graphics/tools/r3f/render.ts render \
  --scene my-scene.tsx \
  --output render.png \
  --transparent
```

**GPU modes:**
- `auto` (default): Tries system Chrome first (Apple Metal GPU on macOS), falls back to SwiftShader if Chrome unavailable
- `chrome`: Force system Chrome — best quality (Metal/ANGLE GPU rendering). Requires Google Chrome installed.
- `swiftshader`: Force CPU-only rendering — works anywhere but glass/transmission materials render with reduced quality

**Default output resolution:** `--scale 2` (2560x1440 from 1280x720 viewport). Use `--scale 3` for 4K (3840x2160).

**Module resolution:** The render script automatically symlinks `node_modules` to the scene file's directory before bundling (and cleans up after). Scene files can live anywhere — `/tmp/`, a project directory, etc. — without manual dependency setup.

## Reusable components (`tools/r3f/components.tsx`)

Import shared components instead of rewriting boilerplate in every scene:

```tsx
import { RenderSignal, SVGTo3D } from '../tools/r3f/components';
```

| Component | What it does | Key props |
|---|---|---|
| **`RenderSignal`** | Signals Playwright to capture screenshot | `frames` — default 8 (enough for MeshTransmissionMaterial + postprocessing to converge) |
| **`SVGTo3D`** | Extrudes any SVG string into 3D geometry. Auto-detects viewBox, handles Y-flip, centering, per-path materials. | `svgString`, `scale`, `depth`, `materials[]`, `curveSegments` |

For decorative scene elements (pills, rings, spheres), use drei primitives directly — they're already one-liners:
```tsx
// Pill accent
<mesh position={pos} rotation={rot} scale={s} castShadow>
  <capsuleGeometry args={[0.055, 0.16, 32, 48]} />
  <meshStandardMaterial color="#D5E5FF" roughness={0.7} />
</mesh>

// Ring accent
<mesh position={pos} rotation={rot} castShadow>
  <torusGeometry args={[0.3, 0.025, 32, 64]} />
  <meshStandardMaterial color="#E5AE61" roughness={0.35} metalness={0.25} />
</mesh>
```

## Scene file requirements

Every scene TSX file must:

1. **Import R3F and React:** `import { Canvas } from '@react-three/fiber'` and `import { createRoot } from 'react-dom/client'`
2. **Mount to `#root`:** `createRoot(document.getElementById('root')!).render(<Scene />)`
3. **Signal render complete** — use the `RenderSignal` component (see below)
4. **Read rendering mode** (optional but recommended): read `window.__R3F_MODE__` to configure for compositing vs full quality

### RenderSignal (required in every scene)

Every scene must signal Playwright when rendering is complete. The canonical implementation is in `tools/r3f/components.tsx`:

```tsx
// If scene is co-located with the skill directory:
import { RenderSignal } from '../tools/r3f/components';

<RenderSignal />           // default: 8 frames
<RenderSignal frames={2} /> // simple scenes without transmission materials
```

For scenes outside the skill directory (e.g., `/tmp/`), inline the component — the render script only symlinks `node_modules`, not local files:

```tsx
function RenderSignal({ frames = 8 }: { frames?: number }) {
  const count = useRef(0);
  useFrame(() => {
    count.current++;
    if (count.current === frames) {
      requestAnimationFrame(() => {
        (window as any).status = 'ready';
      });
    }
  });
  return null;
}
```

Default waits 8 frames — enough for `MeshTransmissionMaterial` and postprocessing to converge their internal FBOs.

The render script handles bundling (via `bun build --target browser`), serving, and screenshot capture.

## Two rendering modes

Every scene must choose one of two modes. **SSAO postprocessing and transparent backgrounds are mutually exclusive** — SSAO creates opaque black in occluded regions on transparent canvases.

| Mode | Background | Postprocessing | Best for |
|------|-----------|---------------|----------|
| **Full quality** | Opaque (`style={{ background: '#FBF9F4' }}` on Canvas) | SSAO + bloom | Blog covers, social graphics — final render with brand background |
| **Compositing** | Transparent (`gl={{ alpha: true }}`, no scene background) | **Unmount `<EffectComposer>` entirely** | 3D element exported for Figma assembly — import as image fill on any background |

**The agent MUST choose the right mode before writing the scene.** Use `--mode full` (default) or `--mode compositing` with the render script.

### Mode-aware Canvas setup (canonical)

```tsx
const mode = (window as any).__R3F_MODE__ || 'full';
const isCompositing = mode === 'compositing';

<Canvas
  gl={{ preserveDrawingBuffer: true, antialias: true, alpha: isCompositing }}
  camera={{ position: [0.5, 1.5, 5], fov: 32 }}
  shadows
  frameloop="always"
  style={{ background: isCompositing ? 'transparent' : '#FBF9F4' }}
>
  {/* IMPORTANT: Set scene.background via R3F — CSS background is not enough when
      EffectComposer is active (it clears to black without this) */}
  {!isCompositing && <color attach="background" args={['#FBF9F4']} />}

  {/* Scene content */}

  {/* Postprocessing: only in full quality mode */}
  {!isCompositing && (
    <EffectComposer multisampling={8}>
      <SSAO radius={0.5} intensity={1.5} luminanceInfluence={0.3} />
      <Bloom threshold={0.9} intensity={0.2} luminanceThreshold={0.9} />
    </EffectComposer>
  )}

  <RenderSignal />
</Canvas>
```

**Why conditional unmount, not `enabled={false}`:** When `<EffectComposer>` unmounts, R3F automatically resumes its default rendering pipeline with full alpha support. Using `enabled={false}` leaves the component mounted with dynamic priority switching, which is less reliable.

### Camera guidance

**FOV:** 30-35 for product/marketing shots (flattering, minimal perspective distortion). 45-50 for wider scene compositions. Never above 60 for marketing renders — too much fisheye.

**Camera position:** Slightly above center (`y: 1-2`) creates a natural "looking at an object on a table" angle. Adjust `z` distance to fill ~60-70% of frame with the primary object.

---

## Scene template: Integration icon tile

A reusable template for rendering partner integration tiles (like Resend's n8n tile or Neon's icon stacks):

```tsx
import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  ContactShadows,
  RoundedBox,
  Center,
  MeshTransmissionMaterial,
} from '@react-three/drei';
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// === CONFIG (parameterize per integration) ===
const TILE_COLOR = '#3784FF';     // Inkeep brand/primary
// const LOGO_PATH = '/tmp/partner-logo.png';  // Partner logo

// === MODE ===
const mode = (window as any).__R3F_MODE__ || 'full';
const isCompositing = mode === 'compositing';

// === RENDER SIGNAL ===
// Import from components.tsx if co-located, or inline for portable scenes:
function RenderSignal({ frames = 8 }: { frames?: number }) {
  const count = useRef(0);
  useFrame(() => {
    count.current++;
    if (count.current === frames) {
      requestAnimationFrame(() => {
        (window as any).status = 'ready';
        console.log('R3F scene rendered successfully');
      });
    }
  });
  return null;
}

// === SCENE COMPONENTS ===

function GlassTile() {
  return (
    <group rotation={[0.05, 0.12, 0.02]}>
      <RoundedBox args={[1.4, 1.4, 0.14]} radius={0.08} smoothness={6} castShadow>
        <MeshTransmissionMaterial
          color={TILE_COLOR}
          roughness={0.05}
          transmission={0.92}
          thickness={0.8}
          chromaticAberration={0.06}
          anisotropicBlur={0.2}
          clearcoat={0.3}
          clearcoatRoughness={0.15}
          envMapIntensity={1.2}
          ior={1.25}
          iridescence={0.8}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[100, 400]}
          dispersion={0.3}
          backside={true}
          backsideThickness={0.5}
          samples={16}
          resolution={1024}
        />
      </RoundedBox>
      {/* White icon on tile */}
      <mesh position={[0, 0, 0.12]}>
        <torusGeometry args={[0.22, 0.055, 24, 48]} />
        <meshStandardMaterial color="white" roughness={0.25} metalness={0.05} />
      </mesh>
      {/* Uncomment to add partner logo:
      <LogoOnTile logoPath={LOGO_PATH} />
      */}
    </group>
  );
}

// === MAIN SCENE ===

function Scene() {
  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: isCompositing }}
      camera={{ position: [0, 0.5, 3.5], fov: 30 }}
      shadows
      frameloop="always"
      style={{ background: isCompositing ? 'transparent' : '#FBF9F4' }}
    >
      {/* Scene background — required when using EffectComposer (CSS background alone renders black) */}
      {!isCompositing && <color attach="background" args={['#FBF9F4']} />}

      <Environment preset="studio" environmentIntensity={0.7} />

      <ambientLight intensity={0.25} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={0.8}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.001}
      />

      <Center>
        <GlassTile />
      </Center>

      <ContactShadows
        position={[0, -0.8, 0]}
        opacity={0.2}
        scale={8}
        blur={2.5}
        far={3}
      />

      {!isCompositing && (
        <EffectComposer multisampling={8}>
          <SSAO radius={0.5} intensity={1.5} luminanceInfluence={0.3} />
          <Bloom threshold={0.9} intensity={0.2} luminanceThreshold={0.9} />
        </EffectComposer>
      )}

      <RenderSignal />
    </Canvas>
  );
}

// === MOUNT ===
createRoot(document.getElementById('root')!).render(<Scene />);
```

---

## Default workflow: R3F renders elements, Figma composes

**Compositing mode (`--mode compositing`) is the default for production use.** R3F produces transparent PNG elements — individual 3D objects, not complete graphics. Figma always does final assembly: text, badges, layout, and background (including 3D texture overlays from the texture library).

This matches how premium 3D marketing teams work: the 3D tool (Spline, Blender, R3F) renders elements. The design tool (Figma) composes the final deliverable.

**The workflow:**

1. **Write the scene** in TSX — focus on the 3D element only, not the full layout
2. **Render to transparent PNG** via `bun plugins/gtm/skills/graphics/tools/r3f/render.ts render --scene scene.tsx --output 3d-element.png --mode compositing`
3. **Import into Figma** — use `figma_execute` to create a rectangle with an image fill from the PNG
4. **Compose in Figma** using the Option A workflow — add brand text, badges, 3D texture background (from texture library), and layout around the 3D element
5. **Apply brand consistency** — verify the 3D render looks right alongside Figma-native elements

**When to use full-quality mode instead** (`--mode full`, opaque background): Only for standalone renders that won't be composited — e.g., a 3D texture sheet for the texture library, or a test render during iteration. For any deliverable that includes text, use compositing → Figma.

---

## Reference files

Load these on demand based on what the scene requires:

| File | **Load** when | What it covers |
|------|---------------|----------------|
| **`staging.md`** | Planning composition and staging | Composition patterns (Resend formula), storytelling framework (concept → object), staging components (Environment, lighting, shadows, Lightformer, Stage, AccumulativeShadows) |
| **`materials.md`** | Choosing materials and geometry | Brand material presets (6 presets), matcap, custom shaders (CSM), geometry quality (segment counts), RoundedBox |
| **`advanced.md`** | Using advanced features | CSG booleans, path tracing, postprocessing, .glb loading (gltfjsx), Meshy AI, SVG extrusion (SVGLoader), additional drei components, partner logo textures |
