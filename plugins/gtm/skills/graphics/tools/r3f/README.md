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
bun tools/r3f/render.ts render \
  --scene my-scene.tsx \
  --output render.png

# Custom dimensions + SwiftShader fallback (CI/Docker)
bun tools/r3f/render.ts render \
  --scene my-scene.tsx \
  --output render.png \
  --width 1280 --height 720 --scale 2 \
  --gpu swiftshader

# Transparent background (for compositing in Figma)
bun tools/r3f/render.ts render \
  --scene my-scene.tsx \
  --output render.png \
  --transparent
```

**GPU modes:**
- `auto` (default): Tries system Chrome first (Apple Metal GPU on macOS), falls back to SwiftShader if Chrome unavailable
- `chrome`: Force system Chrome — best quality (Metal/ANGLE GPU rendering). Requires Google Chrome installed.
- `swiftshader`: Force CPU-only rendering — works anywhere but glass/transmission materials render with reduced quality

**Default output resolution:** `--scale 2` (2560x1440 from 1280x720 viewport) with `multisampling={8}` on EffectComposer is the quality sweet spot. Higher scale factors (3x, 4x) show negligible improvement when multisampling is enabled. Use `--scale 2` unless you specifically need 4K output (`--scale 3` = 3840x2160).

**Module resolution:** The render script automatically symlinks `node_modules` to the scene file's directory before bundling (and cleans up after). Scene files can live anywhere — `/tmp/`, a project directory, etc. — without manual dependency setup.

## Reusable components (`tools/r3f/components.tsx`)

Import shared components instead of rewriting boilerplate in every scene:

```tsx
import { RenderSignal, SVGTo3D } from '../tools/r3f/components';
```

| Component | What it does | Key props |
|---|---|---|
| **`RenderSignal`** | Signals Playwright to capture screenshot | `frames` — set to 8 for MeshTransmissionMaterial scenes |
| **`SVGTo3D`** | Extrudes any SVG string into 3D geometry | `svgString`, `scale`, `depth`, `materials[]`, `curveSegments` |

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

## Additional drei components for marketing renders

Beyond the components documented in the staging section, these drei components are high-value for marketing/product 3D:

| Component | What it does | When to use |
|---|---|---|
| **`MeshReflectorMaterial`** | Reflective floor/surface with blur | "Apple product page" reflective surface under objects |
| **`Caustics`** | Light caustic patterns through glass | Pair with MeshTransmissionMaterial. Set `frames={1}` for static. |
| **`Backdrop`** | Curved studio cyclorama backdrop | Proper photography studio background. Better than a flat plane. |
| **`SoftShadows`** | PCSS soft shadows (one-line drop-in) | Shadows soften with distance from caster. Simpler than AccumulativeShadows. |
| **`Sparkles`** | GPU-instanced floating particles | Subtle ambient particles for hero sections. Use count={50-100}. |
| **`Text3D`** | Extruded 3D text from font JSON | 3D typography for headline renders. |
| **`GradientTexture`** | Procedural linear/radial gradients | Background planes without texture files. |
| **`BakeShadows`** | Bake shadow maps once, stop updating | Free performance win for static renders (which is all we do). |
| **`Decal`** | Project texture onto mesh surface | Logos on product surfaces, stickers on devices. |
| **`MeshDistortMaterial`** | Simplex noise distortion on PBR material | Animated organic blob shapes for backgrounds. |

```tsx
// Reflective floor (one component)
import { MeshReflectorMaterial } from '@react-three/drei';
<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
  <planeGeometry args={[10, 10]} />
  <MeshReflectorMaterial blur={[300, 100]} resolution={1024} mixBlur={1} mixStrength={0.5} mirror={0.5} />
</mesh>

// One-line soft shadows (add anywhere in Canvas)
import { SoftShadows } from '@react-three/drei';
<SoftShadows size={25} samples={16} focus={0} />

// Bake shadows once (add anywhere in Canvas)
import { BakeShadows } from '@react-three/drei';
<BakeShadows />

// Studio backdrop
import { Backdrop } from '@react-three/drei';
<Backdrop floor={0.25} segments={20} receiveShadow>
  <meshStandardMaterial color="#FBF9F4" />
</Backdrop>
```

## Custom shader materials (`three-custom-shader-material`)

For branded materials beyond what PBR provides (animated gradients, holographic, noise-driven surfaces), use `three-custom-shader-material` (CSM). It extends any Three.js standard material with custom vertex/fragment shaders while keeping PBR lighting, shadows, and all built-in features.

```tsx
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

const material = new CustomShaderMaterial({
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: '...', // custom vertex modifications
  fragmentShader: '...', // custom fragment modifications
  uniforms: { uTime: { value: 0 } },
  // All MeshPhysicalMaterial props still work:
  roughness: 0.3,
  metalness: 0.1,
  transmission: 0.5,
});
```

Auto-installed on first use. Use this instead of writing materials from scratch — you keep PBR lighting for free.

## Scene file requirements

Every scene TSX file must:

1. **Import R3F and React:** `import { Canvas } from '@react-three/fiber'` and `import { createRoot } from 'react-dom/client'`
2. **Mount to `#root`:** `createRoot(document.getElementById('root')!).render(<Scene />)`
3. **Set `window.status = 'ready'`** after the first frame renders — use the `RenderSignal` component (see below)
4. **Read rendering mode** (optional but recommended): read `window.__R3F_MODE__` to configure for compositing vs full quality

### RenderSignal component (required in every scene)

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function RenderSignal() {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      requestAnimationFrame(() => {
        (window as any).status = 'ready';
      });
    }
  });
  return null;
}
```

Place `<RenderSignal />` inside `<Canvas>` as the last child. It waits one frame for postprocessing to complete, then signals Playwright to capture.

**When using `MeshTransmissionMaterial`:** The transmission material renders to an internal FBO that takes multiple frames to converge. Use this enhanced version that waits 8 frames:

```tsx
function RenderSignal({ frames = 1 }: { frames?: number }) {
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

// Standard scenes: <RenderSignal />
// Scenes with MeshTransmissionMaterial: <RenderSignal frames={8} />
```

The render script handles bundling (via `bun build --target browser`), serving, and screenshot capture.

## Inkeep brand material presets

Use these pre-tuned material configurations for brand-consistent 3D. Values are from PoC testing.

### `inkeepBlueClay` — Pitch-style matte plastic in brand blue

```tsx
<meshStandardMaterial
  color="#3784FF"
  roughness={0.82}
  metalness={0}
/>
```

Warm, approachable, matte. The default material for Inkeep 3D objects. Pair with `<Environment>` for soft lighting.

### `inkeepGlass` — Glassmorphic with chromatic aberration (drei)

```tsx
import { MeshTransmissionMaterial } from '@react-three/drei';

<MeshTransmissionMaterial
  color="#3784FF"
  roughness={0.1}
  transmission={0.7}
  thickness={0.4}
  chromaticAberration={0.03}
  anisotropicBlur={0.1}
  clearcoat={0.3}
  clearcoatRoughness={0.1}
  envMapIntensity={1.5}
/>
```

Glass-like with light refraction and chromatic aberration. Better visual quality than vanilla `MeshPhysicalMaterial` — the chromatic aberration and anisotropic blur create a more realistic glass effect. Requires `<Environment>` for reflections (see standard staging below). Best on GPU (Chrome mode).

### `inkeepGlassVanilla` — Fallback glass (no drei dependency)

Use this if you need glass without importing drei's `MeshTransmissionMaterial`:

```tsx
<meshPhysicalMaterial
  color="#3784FF"
  roughness={0.12}
  metalness={0.05}
  transmission={0.65}
  thickness={0.4}
  ior={1.45}
  transparent={true}
  opacity={0.92}
  envMapIntensity={1.5}
  clearcoat={0.3}
  clearcoatRoughness={0.1}
  side={THREE.DoubleSide}
/>
```

### `inkeepGoldenAccent` — Warm accent for secondary elements

```tsx
<meshStandardMaterial
  color="#E5AE61"
  roughness={0.55}
  metalness={0.15}
/>
```

Use for rings, accent shapes, secondary decorative elements. Slight metalness adds warmth.

### `inkeepCrystalBlue` — Light blue for background/depth elements

```tsx
<meshStandardMaterial
  color="#D5E5FF"
  roughness={0.7}
  metalness={0}
/>
```

Matte, desaturated. Use for background pills, secondary tiles, z-stacking depth elements.

### `inkeepDarkMatte` — Dark surface for contrast elements

```tsx
<meshStandardMaterial
  color="#231F20"
  roughness={0.95}
  metalness={0.1}
/>
```

Use sparingly — for dark-background scenes (Tier 1 launches only) or as contrast elements within warm compositions.

## Geometry quality (segment counts)

Low polygon counts produce visible faceting at 2x retina resolution. Use these minimums:

| Geometry | Low quality (visible facets) | Recommended minimum | Notes |
|----------|------------------------------|---------------------|-------|
| `capsuleGeometry` | `[r, l, 8, 16]` | `[r, l, 16, 32]` | Pills, rounded accents |
| `sphereGeometry` | `[r, 16, 16]` | `[r, 48, 48]` | Clay spheres, orbs |
| `torusGeometry` | `[R, r, 16, 32]` | `[R, r, 32, 64]` | Rings, donuts |
| `extrudeGeometry` bevelSegments | 3-4 | 8-16 | Rounded edges on extrusions |
| `extrudeGeometry` curveSegments | 12 (default) | 64-128 | SVG bezier paths — higher = smoother curves |

**Always set `curveSegments: 64` or higher** when extruding SVG paths with bezier curves. The default (12) produces visible straight-line approximations on organic curves.

## Two rendering modes

Every scene must choose one of two modes. **SSAO postprocessing and transparent backgrounds are mutually exclusive** — SSAO creates opaque black in occluded regions on transparent canvases.

| Mode | Background | Postprocessing | Best for |
|------|-----------|---------------|----------|
| **Full quality** | Opaque (`style={{ background: '#FBF9F4' }}` on Canvas) | SSAO + bloom | Blog covers, social graphics — final render with brand background |
| **Compositing** | Transparent (`gl={{ alpha: true }}`, no scene background) | **Unmount `<EffectComposer>` entirely** | 3D element exported for Figma assembly — import as image fill on any background |

**The agent MUST choose the right mode before writing the scene.** Use `--mode full` (default) or `--mode compositing` with the render script.

**Mode-aware Canvas setup:**
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

## Standard Canvas setup

```tsx
<Canvas
  gl={{ preserveDrawingBuffer: true, antialias: true }}
  camera={{ position: [0.5, 1.5, 5], fov: 32 }}
  shadows
  frameloop="always"
  style={{ background: '#FBF9F4' }}
>
```

**FOV guidance:** 30-35 for product/marketing shots (flattering, minimal perspective distortion). 45-50 for wider scene compositions. Never above 60 for marketing renders — too much fisheye.

**Camera position:** Slightly above center (`y: 1-2`) creates a natural "looking at an object on a table" angle. Adjust `z` distance to fill ~60-70% of frame with the primary object.

## Standard staging (drei)

drei provides declarative staging components that replace manual lighting/environment setup.

### Environment (replaces manual HDRI loading)

```tsx
import { Environment } from '@react-three/drei';

<Environment preset="studio" environmentIntensity={0.8} />
```

Built-in presets: `studio`, `city`, `sunset`, `dawn`, `night`, `forest`, `apartment`, `lobby`, `warehouse`, `park`. **`studio` is the default for Inkeep** — clean, neutral, professional lighting.

For custom HDRIs:
```tsx
<Environment files="/assets/custom.hdr" />
```

The render script serves files from `tools/r3f/assets/` at the `/assets/` URL path.

### Lighting (supplement Environment)

```tsx
<ambientLight intensity={0.4} />
<directionalLight
  position={[5, 8, 4]}
  intensity={1.2}
  color="#fff5e6"
  castShadow
  shadow-mapSize-width={2048}
  shadow-mapSize-height={2048}
  shadow-bias={-0.001}
/>
```

The `<Environment>` provides the primary illumination. Add directional lights for key/fill/rim to supplement, not replace.

### ContactShadows (replaces ShadowMaterial ground plane)

```tsx
import { ContactShadows } from '@react-three/drei';

<ContactShadows
  position={[0, -0.5, 0]}
  opacity={0.3}
  scale={10}
  blur={2.5}
  far={3}
/>
```

One component replaces the manual ground plane + ShadowMaterial pattern. Produces soft, contact-aware shadows that ground objects naturally.

### Center (auto-center scene content)

```tsx
import { Center } from '@react-three/drei';

<Center>
  {/* All scene objects centered as a group */}
  <GlassTile position={[-0.9, 0.4, 0]} />
  <ClaySphere position={[1.0, 0.3, -0.2]} />
</Center>
```

### Stage (one-component studio setup)

`Stage` combines Environment + ContactShadows + centering into a single component. Use when you want a quick, polished studio look without configuring each piece separately.

```tsx
import { Stage } from '@react-three/drei';

<Stage
  preset="rembrandt"
  intensity={0.5}
  environment="studio"
  shadows={{ type: 'contact', opacity: 0.3, blur: 2.5 }}
>
  <GlassTile />
  <ClaySphere />
</Stage>
```

**Presets:** `rembrandt` (default — classic 3-point), `portrait`, `upfront`, `soft`. Each preset positions key/fill/back lights differently.

**When to use Stage vs manual setup:**
- **Stage** — quick renders, consistent studio look, agent doesn't need fine control over individual lights
- **Manual (Environment + ContactShadows + lights)** — when you need to tune specific light positions, intensities, or shadow properties for a particular composition

### AccumulativeShadows + RandomizedLight (physically accurate soft shadows)

For higher-quality shadows than `ContactShadows`, use `AccumulativeShadows` with `RandomizedLight`. This renders shadows from many randomized light positions and accumulates them into a soft, physically plausible result.

```tsx
import { AccumulativeShadows, RandomizedLight } from '@react-three/drei';

<AccumulativeShadows
  temporal
  frames={60}
  alphaTest={0.85}
  opacity={0.8}
  scale={10}
  position={[0, -0.5, 0]}
>
  <RandomizedLight
    amount={8}
    radius={4}
    ambient={0.5}
    intensity={1}
    position={[5, 5, -5]}
    bias={0.001}
  />
</AccumulativeShadows>
```

**When to use AccumulativeShadows vs ContactShadows:**
- **ContactShadows** — faster (single pass), good enough for most renders, the default choice
- **AccumulativeShadows** — slower (renders `frames` passes), produces physically softer shadows with realistic penumbra. Use for hero images and Tier 1 blog covers where shadow quality is a focal point.

**Note:** `temporal` spreads accumulation across animation frames. For our single-frame pipeline, set `frames={60}` or higher — R3F will render that many frames before the `RenderSignal` fires.

### Lightformer (custom area lights inside Environment)

For precise control over environment reflections without loading a custom HDRI, use `Lightformer` inside `<Environment>`:

```tsx
import { Environment, Lightformer } from '@react-three/drei';

<Environment preset="studio">
  {/* Add custom area lights to the environment map */}
  <Lightformer
    form="rect"
    intensity={2}
    position={[0, 5, -5]}
    scale={[10, 2, 1]}
    color="#fff5e6"
  />
  <Lightformer
    form="circle"
    intensity={1}
    position={[-5, 2, 0]}
    scale={3}
    color="#d5e5ff"
  />
</Environment>
```

**Forms:** `rect` (default), `circle`, `ring`. Lightformers appear as reflections on glossy/metallic surfaces. Use for custom "studio lighting" without a real HDRI file.

**When to use Lightformer:**
- You want the studio preset but need a specific bright reflection on a glass or metallic surface
- You want to simulate branded colored lighting in reflections
- You need a soft rectangular light reflection (common in product photography)

**Glass reflection recipe (Resend-style):** Large rectangular Lightformers create the characteristic "studio reflection" stripe on glass surfaces. Use `form="rect"` with `scale={[8, 3, 1]}` or wider, positioned behind/above the camera. Add a cool-tinted fill Lightformer from the opposite side for color contrast in reflections. This is the key technique for making `MeshTransmissionMaterial` look polished.

### Staging decision table

| Need | Component | Lines of code |
|------|-----------|---------------|
| Quick studio setup (most renders) | `<Stage>` | 1 component |
| Tuned lighting + simple shadows | `<Environment>` + `<ContactShadows>` + lights | 3-5 components |
| Hero-quality shadows (Tier 1) | `<Environment>` + `<AccumulativeShadows>` + lights | 4-6 components |
| Custom reflections on glass/metal | `<Environment>` + `<Lightformer>` children | 2-4 components |

## Using RoundedBox (drei)

drei's `<RoundedBox>` replaces the manual `RoundedBoxGeometry` import:

```tsx
import { RoundedBox } from '@react-three/drei';

<RoundedBox args={[1.3, 1.3, 0.14]} radius={0.08} smoothness={6} castShadow>
  <MeshTransmissionMaterial color="#3784FF" {...glassProps} />
</RoundedBox>
```

## Extruding SVG brand assets into 3D (SVGLoader)

Use `SVGLoader` to extrude real SVG paths (logos, brand marks, icons) into 3D geometry. This produces exact shapes from the brand's actual vector artwork.

```tsx
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as THREE from 'three';

function SVGTo3D({ svgString, scale = 1 / 120 }: { svgString: string; scale?: number }) {
  const group = useMemo(() => {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    const g = new THREE.Group();

    // SVG viewBox center offset (adjust per SVG)
    const offsetX = -180; // half of viewBox width
    const offsetY = -112; // half of viewBox height

    svgData.paths.forEach((path, i) => {
      const color = path.color;
      const shapes = SVGLoader.createShapes(path);

      shapes.forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.3,
          bevelEnabled: true,
          bevelThickness: 0.06,
          bevelSize: 0.06,
          bevelSegments: 12,
          curveSegments: 128,  // smooth bezier curves
        });

        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.6,
          metalness: 0.05,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;

        // SVG → 3D: flip Y axis, center, scale
        mesh.scale.set(scale, -scale, scale);
        mesh.position.set(offsetX * scale, -offsetY * scale, i * 0.05);

        g.add(mesh);
      });
    });

    return g;
  }, [svgString, scale]);

  return <primitive object={group} />;
}
```

**Key patterns:**
- **Flip Y axis** — SVG Y increases downward, Three.js Y increases upward. Use `mesh.scale.set(scale, -scale, scale)`.
- **Center the geometry** — offset by half the SVG viewBox dimensions before scaling.
- **Layer multiple paths** — offset each path along Z (`i * 0.05`) so overlapping shapes have depth separation.
- **High curveSegments** — SVG bezier curves need `curveSegments: 64-128` to avoid visible straight-line faceting (see geometry quality table above).
- **Inline SVG strings** — pass the SVG markup as a string to `SVGLoader.parse()`. No file loading needed.

## Loading partner logos as textures

For integration icon tiles, load a partner logo as a texture on the tile face:

```tsx
import { useTexture } from '@react-three/drei';

function LogoOnTile({ logoPath }: { logoPath: string }) {
  const texture = useTexture(logoPath);
  return (
    <mesh position={[0, 0, 0.08]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshStandardMaterial map={texture} transparent roughness={0.3} metalness={0.05} />
    </mesh>
  );
}
```

For SVG logos, convert to PNG first (the TextureLoader doesn't handle SVG directly). Use `sips` on macOS or the fetch-logo script to get a raster version.

## Hybrid workflow: Three.js → Figma

When the final deliverable needs 3D elements composed with brand text, badges, and layout:

1. **Write the scene** in TSX using the material presets above
2. **Render to PNG** via `bun tools/r3f/render.ts render --scene scene.tsx --output 3d-element.png --mode compositing`
3. **Import into Figma** — use `figma_execute` to create a rectangle with an image fill from the PNG
4. **Compose in Figma** using the Option A workflow — add brand text, badges, backgrounds around the 3D element
5. **Apply brand consistency** — verify the 3D render looks right alongside Figma-native elements

This is the right default for blog covers and social graphics that need both 3D visual elements and precise text layout.

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
function RenderSignal() {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
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
          roughness={0.1}
          transmission={0.7}
          thickness={0.4}
          chromaticAberration={0.03}
          anisotropicBlur={0.1}
          clearcoat={0.3}
          clearcoatRoughness={0.1}
          envMapIntensity={1.5}
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

      <Environment preset="studio" environmentIntensity={0.8} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.2}
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

## CSG boolean operations (carving shapes into shapes)

### Declarative: `@react-three/csg` (recommended)

Use `@react-three/csg` for declarative boolean operations — e.g., carving a rounded cutout into a tile face or subtracting one shape from another.

```tsx
import { Geometry, Base, Subtraction } from '@react-three/csg';

<mesh>
  <Geometry useGroups>
    <Base>
      {/* The tile body */}
      <boxGeometry args={[2, 2, 0.3]} />
      <meshStandardMaterial color="#3784FF" roughness={0.82} />
    </Base>
    <Subtraction position={[0, 0, 0.1]}>
      {/* Rounded cutout in the tile face */}
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial color="#D5E5FF" roughness={0.7} />
    </Subtraction>
  </Geometry>
</mesh>
```

**Components:** `<Base>` (foundation), `<Subtraction>` (A − B), `<Addition>` (A + B), `<Intersection>` (A ∩ B), `<Difference>` (A ⊕ B)

**Key prop:** `useGroups` on `<Geometry>` — each operation keeps its own material, enabling multi-material CSG results (e.g., hexagon body in blue, carved inset in lighter blue).

### Imperative fallback: `three-bvh-csg`

For finer control or when you need operations not exposed by `@react-three/csg` (like `HOLLOW_SUBTRACTION`):

```tsx
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { useEffect, useRef } from 'react';

function CSGMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const evaluator = new Evaluator();
    const hexBrush = new Brush(hexagonGeometry);
    const blobBrush = new Brush(blobGeometry);
    blobBrush.position.set(0, 0, 0.02);
    blobBrush.updateMatrixWorld();

    const result = evaluator.evaluate(hexBrush, blobBrush, SUBTRACTION);
    if (meshRef.current) meshRef.current.geometry = result.geometry;
  }, []);

  return (
    <mesh ref={meshRef} castShadow>
      <meshStandardMaterial color="#3784FF" roughness={0.82} />
    </mesh>
  );
}
```

**Operations:** `ADDITION` (∪), `SUBTRACTION` (−), `REVERSE_SUBTRACTION`, `INTERSECTION` (∩), `DIFFERENCE` (⊕)

**Constraint:** All geometry must be two-manifold (water-tight, no holes). ExtrudeGeometry with bevel produces manifold meshes. If CSG fails with artifacts, check that both geometries are closed solids.

**When to use CSG:**
- Rounded cutouts or insets in tiles
- Any "one shape removed from another" composition

**When NOT to use CSG — use a pre-built .glb instead:**
- The boolean is complex (multiple nested operations)
- You need the result to be pixel-perfect (model it properly in a 3D tool)

## Matcap materials (instant clay quality)

`MeshMatcapMaterial` bakes lighting into a single texture — the material always looks the same regardless of scene lights. Use this for consistent "Pitch-style" clay quality without tuning.

```tsx
import { useTexture } from '@react-three/drei';

function ClayObject() {
  const matcap = useTexture('/assets/matcap-clay.png');
  return (
    <mesh castShadow>
      <sphereGeometry args={[0.5, 64, 64]} />
      <meshMatcapMaterial matcap={matcap} color="#3784FF" />
    </mesh>
  );
}
```

**First-time setup:** The `tools/r3f/assets/` directory starts empty. Before using matcap features, download:
```bash
# Clay matcap texture — instant Pitch-style clay material
curl -sL -o tools/r3f/assets/matcap-clay.png "https://raw.githubusercontent.com/emmelleppi/matcaps/master/256/C7C0AC_2E181B_543B30_6B6270-256px.png"
```

**Matcap vs PBR decision:**

| Material type | Use for | Responds to lights? | Glass/transmission? | Transparent bg? |
|--------------|---------|--------------------|--------------------|----------------|
| **meshMatcapMaterial** | Clay, ceramic, matte plastic | No — lighting baked in texture | No | ✅ Yes |
| **meshStandardMaterial** | Any PBR surface (metal, rough, etc.) | Yes | No | ✅ Yes |
| **MeshTransmissionMaterial** (drei) | Glass, clearcoat, chromatic aberration | Yes — needs `<Environment>` | Yes | ✅ Yes |
| **meshPhysicalMaterial** | Glass fallback (no drei) | Yes — needs environment | Yes | ✅ Yes |

Matcap is the best choice for clay objects in **compositing mode** (transparent background) because it produces consistent quality without needing scene lights or HDRI.

Free matcap textures: [github.com/emmelleppi/matcaps](https://github.com/emmelleppi/matcaps) (600+ options). Pick a ceramic or clay variant and tint with brand color.

## Postprocessing effects (full quality mode only)

**These effects are incompatible with transparent backgrounds.** Use ONLY in full quality mode (opaque background). In compositing mode, **unmount `<EffectComposer>` entirely** — do not use `enabled={false}`.

```tsx
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';

{!isCompositing && (
  <EffectComposer multisampling={8}>
    {/* SSAO — ambient occlusion in crevices (most impactful effect) */}
    <SSAO radius={0.5} intensity={1.5} luminanceInfluence={0.3} />

    {/* Bloom — subtle glow on bright edges */}
    <Bloom threshold={0.9} intensity={0.2} luminanceThreshold={0.9} />
  </EffectComposer>
)}
```

**IMPORTANT: Always set `multisampling={8}` on EffectComposer.** Without it, edges will be jagged — the EffectComposer renders to its own framebuffers that bypass the Canvas `antialias` setting. `multisampling={8}` enables 8x MSAA on the postprocessing render targets.

3 lines of JSX replaces 25+ lines of manual EffectComposer setup. Uses the `postprocessing` library (by vanruesc) under the hood — better quality than Three.js's built-in postprocessing.

## Loading pre-built .glb models

For complex geometry that's hard to build in code (logos with boolean insets, organic shapes, detailed objects), load a pre-modeled .glb file:

```tsx
import { useGLTF } from '@react-three/drei';

function BrandModel({ url, color = '#3784FF' }: { url: string; color?: string }) {
  const { scene } = useGLTF(url);

  // Override materials with brand presets
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.82,
        metalness: 0,
      });
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return <primitive object={scene} scale={2} rotation={[0.15, -0.25, 0.05]} />;
}

// Usage:
<BrandModel url="/assets/inkeep-logo-3d.glb" />
```

Place .glb files in `tools/r3f/assets/` — the render script serves them at `/assets/`.

**Three geometry tiers:**

| Tier | Source | When to use | Quality |
|------|--------|-------------|---------|
| **A: Code-built** | SVG extrude + CSG + primitives | Simple shapes: tiles, pills, rings, boxes | Good — full agent control |
| **B: Pre-built .glb** | Modeled in Spline/Blender, exported as .glb | Logo, complex branded shapes (model once, reuse forever) | Highest — any geometry possible |
| **C: AI-generated .glb** | Meshy.ai API → .glb download → useGLTF | Organic/stylized conceptual objects | Good for organic forms |

## Meshy.ai text-to-3D API (for organic conceptual objects)

Meshy generates 3D meshes from text prompts via REST API. Output is .glb loadable directly via `useGLTF`.

**IMPORTANT:** Meshy is trained on organic forms. It is **poor for precise geometric shapes** (logos, hexagons, clean edges). Use it only for organic/stylized objects like creatures, abstract sculptures, or conceptual metaphors.

```bash
# Set API key (optional — only needed for AI-generated 3D)
export MESHY_API_KEY="your-key-here"
```

**Pipeline: prompt → Meshy API → poll → download .glb → useGLTF → R3F render → Playwright → PNG**

```typescript
// 1. Create preview task — returns the task ID directly as a string
const headers = {
  'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
  'Content-Type': 'application/json',
};
const createRes = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
  method: 'POST', headers,
  body: JSON.stringify({
    mode: 'preview',
    prompt: 'A friendly robot assistant made of smooth blue clay',
    target_polycount: 10000,
    target_formats: ['glb'],
  }),
}).then(r => r.json());
const taskId = createRes.result; // Meshy returns { result: "task-uuid" }

// 2. Poll until complete (status: SUCCEEDED)
let task;
do {
  await new Promise(r => setTimeout(r, 5000));
  task = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`, {
    headers,
  }).then(r => r.json());
  console.log(`Meshy: ${task.status} (${task.progress}%)`);
} while (task.status !== 'SUCCEEDED' && task.status !== 'FAILED');

if (task.status === 'FAILED') throw new Error(`Meshy failed: ${task.task_error?.message}`);

// 3. Download .glb and load via useGLTF in the scene
const glbUrl = task.model_urls.glb;
const glbData = await fetch(glbUrl).then(r => r.arrayBuffer());
await Bun.write('/tmp/meshy-model.glb', glbData);
// Then reference '/tmp/meshy-model.glb' via useGLTF in the scene
```

**Cost:** ~10-20 credits per model (~$0.10-0.20). Preview: ~60s. Refine (with textures): ~2min.
**Formats:** GLB, OBJ, FBX, STL, USDZ.
