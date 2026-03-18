# Materials & Geometry

Use when: Choosing materials for 3D objects and configuring geometry quality
Priority: P0 (material choice determines visual quality and brand consistency)
Impact: Wrong materials look off-brand; low geometry segments produce visible faceting at retina resolution

---

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
  clearcoatRoughness={0.15}
  envMapIntensity={1.2}
/>
```

Glass-like with light refraction and chromatic aberration. Better visual quality than vanilla `MeshPhysicalMaterial` — the chromatic aberration and anisotropic blur create a more realistic glass effect. Requires `<Environment>` for reflections (see `staging.md`). Best on GPU (Chrome mode).

### `inkeepGlassHero` — Maximum quality glass (Tier 1 hero images)

For hero images where glass quality is the focal point, enable iridescence, dispersion, and backside rendering. These are native MeshPhysicalMaterial props that pass through to MeshTransmissionMaterial — achieves 70-80% of Blender glass quality.

```tsx
<MeshTransmissionMaterial
  color="#3784FF"
  roughness={0.05}
  transmission={0.92}
  thickness={0.8}
  chromaticAberration={0.06}
  anisotropicBlur={0.2}
  clearcoat={0.3}
  clearcoatRoughness={0.15}
  envMapIntensity={1.2}
  ior={1.25}
  // Hero-quality additions:
  iridescence={0.8}                    // rainbow color-shift based on viewing angle (r141+)
  iridescenceIOR={1.3}                 // thin-film IOR (1.0-2.333)
  iridescenceThicknessRange={[100, 400]} // nanometer thickness range
  dispersion={0.3}                     // true spectral chromatic aberration (r164+)
  backside={true}                      // render back face refraction (two-bounce glass)
  backsideThickness={0.5}              // back face thickness
  samples={16}                         // refraction samples (higher = smoother)
  resolution={1024}                    // FBO buffer resolution
/>
```

**When to use hero vs standard glass:**
- **Standard (`inkeepGlass`)** — most renders. Fast, good quality.
- **Hero (`inkeepGlassHero`)** — Tier 1 blog covers, launch announcements. `backside` doubles render cost. `iridescence` adds rainbow edge color-shift. `dispersion` adds spectral color separation through the glass volume. Use `<RenderSignal frames={8} />` — these features need multiple frames to converge.

**⚠️ `backside` caveat for thick/organic geometry:** `backside={true}` renders back-face refraction for realistic two-bounce glass — but on thick extruded shapes (SVG extrusions, organic blobs), it refracts empty space behind the geometry and renders **opaque black**. Use `backside` only on **thin shells** (tiles, panels, windows) where there's visible scene content behind the glass. For thick organic shapes like the Inkeep blob, omit `backside` — the standard transmission still looks great with iridescence and dispersion.

### `inkeepGlassVanilla` — Fallback glass (no drei dependency)

Fallback for scenes that explicitly exclude drei (extremely rare). In all other cases, use `inkeepGlass` or `inkeepGlassHero` — they produce significantly better glass via drei's `MeshTransmissionMaterial`.

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

---

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

### Material type decision table

| Material type | Use for | Responds to lights? | Glass/transmission? | Transparent bg? |
|--------------|---------|--------------------|--------------------|----------------|
| **meshMatcapMaterial** | Clay, ceramic, matte plastic | No — lighting baked in texture | No | ✅ Yes |
| **meshStandardMaterial** | Any PBR surface (metal, rough, etc.) | Yes | No | ✅ Yes |
| **MeshTransmissionMaterial** (drei) | Glass, clearcoat, chromatic aberration | Yes — needs `<Environment>` | Yes | ✅ Yes |
| **meshPhysicalMaterial** | Glass fallback (no drei) | Yes — needs environment | Yes | ✅ Yes |

Matcap is the best choice for clay objects in **compositing mode** (transparent background) because it produces consistent quality without needing scene lights or HDRI.

Free matcap textures: [github.com/emmelleppi/matcaps](https://github.com/emmelleppi/matcaps) (600+ options). Pick a ceramic or clay variant and tint with brand color.

---

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

---

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

---

## Using RoundedBox (drei)

drei's `<RoundedBox>` replaces the manual `RoundedBoxGeometry` import:

```tsx
import { RoundedBox } from '@react-three/drei';

<RoundedBox args={[1.3, 1.3, 0.14]} radius={0.08} smoothness={6} castShadow>
  <MeshTransmissionMaterial color="#3784FF" {...glassProps} />
</RoundedBox>
```
