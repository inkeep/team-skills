# Advanced Features

Use when: Using CSG booleans, path tracing, postprocessing, pre-built .glb models, Meshy AI generation, SVG extrusion, or additional drei components beyond the basics
Priority: P1 (most scenes don't need these; load only when the scene requires a specific advanced feature)
Impact: Missing CSG guidance leads to geometry artifacts; wrong path tracing setup wastes render time; missing .glb workflow leaves the agent stuck on complex geometry

---

## Additional drei components for marketing renders

Beyond the staging components in `staging.md`, these drei components are high-value for marketing/product 3D:

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

See `staging.md` for code examples of `MeshReflectorMaterial`, `Backdrop`, and `GradientTexture` with Inkeep-specific values.

```tsx
// One-line soft shadows (add anywhere in Canvas)
import { SoftShadows } from '@react-three/drei';
<SoftShadows size={25} samples={16} focus={0} />

// Bake shadows once (add anywhere in Canvas — free perf win for static renders)
import { BakeShadows } from '@react-three/drei';
<BakeShadows />
```

---

## Extruding SVG brand assets into 3D (SVGLoader)

Use `SVGLoader` to extrude real SVG paths (logos, brand marks, icons) into 3D geometry. This produces exact shapes from the brand's actual vector artwork.

**Preferred: use the `SVGTo3D` component from `tools/r3f/components.tsx`** — it handles Y-axis flipping, viewBox centering (auto-detected), scaling, path layering, and per-path materials:

```tsx
import { SVGTo3D } from '../tools/r3f/components';

const logoSVG = `<svg viewBox="0 0 360 224">...</svg>`;

<SVGTo3D
  svgString={logoSVG}
  scale={1 / 120}
  depth={0.3}                    // extrude depth (or array per path)
  bevelSegments={12}
  curveSegments={128}            // smooth bezier curves
  materials={[blueClay, glass]}  // override materials per SVG path index
/>
```

For scenes outside the skill directory (where the import path won't resolve), inline the SVG parsing:

```tsx
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as THREE from 'three';

function SVGTo3D({ svgString, scale = 1 / 120 }: { svgString: string; scale?: number }) {
  const group = useMemo(() => {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgString);
    const g = new THREE.Group();

    // Auto-detect viewBox for centering
    const match = svgString.match(/viewBox=["']([^"']+)["']/);
    const [, , vbW, vbH] = match ? match[1].split(/\s+/).map(Number) : [0, 0, 0, 0];
    const offsetX = -vbW / 2;
    const offsetY = -vbH / 2;

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
- **High curveSegments** — SVG bezier curves need `curveSegments: 64-128` to avoid visible straight-line faceting (see geometry quality table in `materials.md`).
- **Inline SVG strings** — pass the SVG markup as a string to `SVGLoader.parse()`. No file loading needed.

---

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

---

## Rendering quality tiers

The pipeline supports two rendering approaches. Choose based on the quality/time tradeoff:

| Tier | Renderer | Time | Quality | Use for |
|------|----------|------|---------|---------|
| **Standard (rasterization)** | R3F default (WebGLRenderer) | ~3s | Good — 70-80% of Blender for glass, full PBR | Most renders: blog covers, social graphics, batch rendering |
| **Hero (path tracing)** | `three-gpu-pathtracer` via `@react-three/gpu-pathtracer` | ~2-5 min | Near-Blender — physically correct GI, caustics, emissive lighting | Tier 1 launches, hero images, cases where visual quality is the focal point |

### When to use path tracing

Path tracing produces Blender-competitive output by tracing light rays through the scene. Benefits:
- **Emissive surfaces illuminate nearby geometry** — a glowing screen naturally lights the keyboard below it
- **Global illumination** — indirect light bouncing creates realistic ambient lighting
- **Physically correct caustics** — light concentration patterns through glass emerge naturally
- **Multi-bounce refraction** — unlimited bounces through glass objects

```tsx
import { Pathtracer, usePathtracer } from '@react-three/gpu-pathtracer';

function Scene() {
  return (
    <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [0, 1, 4], fov: 32 }}>
      <Pathtracer
        samples={3000}        // convergence quality (2000-5000 for clean results)
        bounces={8}           // light bounces (higher = more realistic GI)
        resolutionFactor={1}  // render at full resolution
      >
        <Environment preset="studio" />
        {/* Scene content — same components as rasterized scenes */}
        <GlassTile />
        <EmissiveScreen />    {/* This WILL illuminate nearby surfaces */}
      </Pathtracer>

      <PathtraceSignal samples={3000} />
    </Canvas>
  );
}

// Custom render signal for path tracing — wait for convergence
function PathtraceSignal({ samples }: { samples: number }) {
  const { progress } = usePathtracer();
  const signaled = useRef(false);
  useFrame(() => {
    if (!signaled.current && progress >= 1) {
      signaled.current = true;
      (window as any).status = 'ready';
    }
  });
  return null;
}
```

**Prerequisites:** `@react-three/gpu-pathtracer` (auto-installed). Requires Three.js r180+. Works with WebGL2 in headless Chrome — same pipeline as rasterized renders.

**Limitations:** No postprocessing (SSAO, Bloom) — path tracing handles lighting naturally. No `MeshTransmissionMaterial` — use standard `meshPhysicalMaterial` with `transmission` and `ior` instead. Render time scales with `samples` × scene complexity.

---

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

---

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

**Optimize .glb files with `gltfjsx`** (5.7K stars, pmndrs) before committing:

```bash
# Convert .glb → optimized R3F JSX component + Draco compression (70-90% size reduction)
npx gltfjsx model.glb --transform --types
# Outputs: Model.tsx (typed R3F component) + model-transformed.glb (compressed)
```

The `--transform` flag applies Draco mesh compression and texture resizing. The generated `.tsx` component provides typed props and automatic `useGLTF.preload()`. Use this for every .glb model in the asset pipeline.

### Three geometry tiers

| Tier | Source | When to use | Quality |
|------|--------|-------------|---------|
| **A: Code-built** | SVG extrude + CSG + primitives | Simple shapes: tiles, pills, rings, boxes | Good — full agent control |
| **B: Pre-built .glb** | Modeled in Spline/Blender, exported as .glb | Logo, complex branded shapes (model once, reuse forever) | Highest — any geometry possible |
| **C: AI-generated .glb** | Meshy.ai API → .glb download → useGLTF | Organic/stylized conceptual objects | Good for organic forms |

---

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
