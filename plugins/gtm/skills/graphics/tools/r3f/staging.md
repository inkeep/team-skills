# Composition & Staging

Use when: Planning what to build (composition, storytelling) and how to stage it (environment, lighting, shadows)
Priority: P0 (composition determines the scene concept; staging determines visual quality)
Impact: Without composition guidance, agents produce random floating shapes with no meaning. Without staging, scenes look flat and amateur.

---

## Physical objects, not extruded graphics

**The #1 quality principle.** Every 3D render should feel like a manufactured object you could pick up off a desk — not a 2D graphic that was pushed through a Play-Doh extruder.

The default R3F approach (SVG → ExtrudeGeometry → float in space) produces flat cookie-cutter shapes. Resend's objects feel machined, heavy, and real. The difference comes from:

| Extruded graphic (amateur) | Manufactured object (premium) |
|---|---|
| Thin extrusion of a 2D shape | Thick volumetric body with mass |
| Icon floating in space | Icon carved/inset INTO a host surface |
| Separate shapes overlapping | Shapes with physical depth relationships (one on top of another, flush) |
| Perfectly smooth surfaces | Subtle surface texture, chamfered edges that catch light |
| Even lighting reveals flatness | Directional lighting reveals depth and form |

**How to apply this:**
- **Start with a volumetric base** — `RoundedBox`, thick slab, or chunky extrusion. NOT a thin wafer.
- **Embed icons INTO surfaces** — use `@react-three/csg` `<Subtraction>` to carve shapes into tile faces. The carved area gets a different material (glass/chrome), creating a manufactured inset feel.
- **Shapes that overlap should be flush** — no floating gaps. If shape B sits on shape A, position B at A's front face (z = A's depth), not hovering 0.15 units in front.
- **Deep extrusions with generous bevels** — depth 0.4-0.6 (not 0.2), bevel 0.08-0.12 (not 0.05). Beveled edges catch light and create the "milled from a block" impression.
- **Add colored rim glow** — `RectAreaLight` behind or below the object with a brand accent color. This lifts the object off the background and adds dimensionality that overhead lighting alone can't create.

This principle overrides convenience. It's more work to build a tile-with-carved-icon than to extrude a logo and float it — but the quality difference is the gap between "AI-generated graphic" and "product photography."

---

## Composition patterns (from Resend deep-dive)

These patterns are extracted from pixel-level analysis of 12 Resend 3D marketing graphics. See `~/reports/3d-depth-graphics-patterns/evidence/resend-deep-dive.md` for the full analysis.

### The composition formula (used in 8/12 Resend images)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────┐                    [New]               │
│   │         │                                        │
│   │  3D     │              Feature                   │
│   │ Object  │              Title                     │
│   │         │                                        │
│   └─────────┘                                        │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← reflective floor
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ ← warm gradient horizon
└──────────────────────────────────────────────────────┘
```

1. **3D object: left 40-60%** of the frame. Never centered — asymmetric placement creates visual energy.
2. **Title text: right-center** with generous padding. Rendered into the image file (or composited in Figma).
3. **"New" badge** — small pill above the title. White background, dark text, rounded rectangle.
4. **Reflective floor** — dark surface with 10-15% reflectivity. Grounds the object. Use `MeshReflectorMaterial`.
5. **Warm gradient horizon** — background transitions from warm amber/brown (~20-30% from bottom) to pure dark/light at edges. Never flat.
6. **30%+ negative space** — the object never fills the frame. Breathing room IS the design.

### Lighting for premium feel

The single biggest quality differentiator between amateur and professional 3D is lighting:

```tsx
// WRONG: flat, even lighting (looks amateur)
<ambientLight intensity={1.0} />

// WRONG: harsh/shiny — concentrated reflections, blown-out hotspots
<Lightformer intensity={3.5} ... />
<directionalLight intensity={1.5} ... />

// RIGHT: soft, luxurious — light rolls across surfaces gently
<ambientLight intensity={0.25} />
<directionalLight position={[4, 6, 3]} intensity={0.8} color="#fff5e6" castShadow />
// No fill light — let shadows go dark
```

**Key principles:**
- **Single dominant light source,** NOT even illumination. Shadows going to near-black is what creates the premium, editorial feel.
- **Soft, not harsh.** Luxury = light that rolls across surfaces gently, not concentrated specular hotspots. Keep Lightformer intensity at 1.0–1.5 (not 2.5+), directional light at 0.8–1.0 (not 1.2+), and `envMapIntensity` on materials at 1.0–1.5 (not 2.5+).
- **Low clearcoat for glass.** High clearcoat (0.7+) creates a sharp reflective shell on top of the transmission — looks like plastic wrap. Use `clearcoat={0.3}` with `clearcoatRoughness={0.15}` for a soft, premium glass feel.
- Add rim/edge light from behind for metallic definition on brass/gold edges.

### Reflective floor setup

```tsx
import { MeshReflectorMaterial } from '@react-three/drei';

<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
  <planeGeometry args={[20, 20]} />
  <MeshReflectorMaterial
    blur={[300, 100]}
    resolution={1024}
    mixBlur={1}
    mixStrength={0.3}    // subtle, not mirror — 0.1-0.4 range
    mirror={0.5}
    color="#FBF9F4"      // warm cream for Inkeep (dark for Resend-style)
  />
</mesh>
```

### Background: never flat

```tsx
import { GradientTexture } from '@react-three/drei';

// Warm cream with subtle gradient (Inkeep style)
<mesh position={[0, 0, -5]} scale={[20, 15, 1]}>
  <planeGeometry />
  <meshBasicMaterial>
    <GradientTexture stops={[0, 0.4, 1]} colors={['#F5F0E8', '#FBF9F4', '#FFFFFF']} />
  </meshBasicMaterial>
</mesh>

// Or use Backdrop for a curved cyclorama
import { Backdrop } from '@react-three/drei';
<Backdrop floor={0.25} segments={20} receiveShadow>
  <meshStandardMaterial color="#FBF9F4" />
</Backdrop>
```

### Inset icon pattern (Resend homepage hero technique)

The highest-polish Resend technique: an icon shape **carved into** a rounded tile, not sitting on top. Creates a manufactured, premium "app icon" feel.

```
┌───────────────┐
│  ┌─────────┐  │  ← dark matte RoundedBox body
│  │ ▼▼▼▼▼▼▼ │  │  ← icon carved INTO face via CSG <Subtraction>
│  │  icon    │  │  ← glass/chrome material in the carved area
│  └─────────┘  │
│    ═══════    │  ← colored rim glow (RectAreaLight behind/below)
└───────────────┘
    pure black bg
```

**How to build it:**
1. `RoundedBox` — dark matte body (`roughness: 0.9`, near-black, `radius: 0.15`)
2. `@react-three/csg` `<Subtraction>` — carve the icon shape into the front face (extrude the icon SVG, position it flush with the tile face, subtract)
3. Glass/chrome on carved area — `MeshTransmissionMaterial` with dark tint, low `transmission` (0.3-0.5), high `metalness` on the carved geometry for reflectivity
4. Colored rim glow — `RectAreaLight` positioned behind or below the tile with brand accent color (`#3784FF` for Inkeep, purple for Resend)
5. Optional: emissive detail inside the carved area (starburst pattern, glow)
6. Pure black background, no gradient, minimal ambient (`0.05-0.1`)

**When to use:** Brand hero (homepage, social OG), app icon renders, premium single-object product shots. NOT for feature announcements (use the standard composition formula for those).

**Inkeep adaptation:** Replace Resend's dark matte body with `inkeepDarkMatte` (#231F20). Use `#3784FF` brand blue for the rim glow instead of purple. Carve the blob shape into a hexagonal tile.

### Background options (choose one per project)

| Option | Floor | Background | Feel | Best for |
|---|---|---|---|---|
| **Clean white studio** | White + subtle reflection | White/near-white | Apple product photography. Bright, airy. | Website hero, docs |
| **Dark Resend-style** | Near-black (#111) + strong reflection | Dark + warm amber horizon | Dramatic. Objects pop. Premium editorial. | Launch announcements, Tier 1 blogs |
| **Pure brand cream** | Flat #FBF9F4, no reflector | Flat #FBF9F4 | Clean, on-brand, simple. | General marketing, social |
| **Dark-to-brand gradient** | Dark gray (#2a2a2a) + reflection | Dark bottom → brand cream (#FBF9F4) at top | Grounded weight, brand identity. | Versatile — most contexts |

**Avoid:** Warm beige gradients (#E8DFD0, #F0E8DC) — these muddy middle-ground tones look like cardboard. Either go clean (white/cream) or go dark (near-black). Don't split the difference with earth tones unless the brand explicitly uses them.

### Text integration

Resend renders the blog title INTO the 3D image — it's not HTML overlaid on top. This gives the 3D artist control over text size, font, and position relative to the 3D objects.

**For our pipeline:** Use the **Figma hybrid workflow** — render the 3D scene with `--mode compositing` (transparent background), import into Figma, and compose the title text alongside the 3D element. This gives us editable text (brand fonts, precise sizing) with the 3D render underneath. See "Hybrid workflow: Three.js → Figma" in README.md.

### Material restraint

Across 12 Resend images spanning 2 years, they use only **4 materials**:
1. Dark matte body (near-black, roughness ~0.9)
2. Brass/copper accent (metalness ~0.25, warm)
3. Glass with iridescent refraction
4. Emissive screens (green CRT glow)

**The principle:** Pick 3-4 materials that define your brand's 3D personality and use them consistently across every render. For Inkeep: warm cream clay, golden accent, brand blue glass, and brand blue emissive.

### Visual consistency across a series

When creating multiple 3D graphics (e.g., a launch week with 5 feature announcements), lock these elements:
- **Same background treatment** (gradient, floor reflectivity)
- **Same camera angle and FOV**
- **Same lighting setup**
- **Same material palette**

Vary only the **3D object** (the feature metaphor) and the **title text**. This creates visual cohesion across a series — the viewer recognizes the format immediately.

---

## Storytelling framework: concept → object

**The core principle: every 3D object should be a physical metaphor for the software concept it represents.** Do not use random decorative shapes — each object should communicate something about the feature.

### How to map a feature to a 3D object

Ask: "If this software feature were a physical object on a desk, what would it look like?"

| Software concept | Physical metaphor | Why it works |
|---|---|---|
| API endpoint | Machine with inputs/outputs, pipes, connectors | Data flows through a pipeline |
| Schedule/timing | Clock, calendar, timer device | Time is the core concept |
| Integration | Two objects connected by glass tube or bridge | Data flows between systems |
| Search | Magnifying glass, lens, telescope | You look through it to find things |
| Analytics | Dashboard with gauges, charts on a screen | Measuring and displaying data |
| CLI / terminal | Retro computer, keyboard, CRT monitor | You type commands |
| Agent / AI | Robot, brain, neural network sculpture | Autonomous entity |
| Knowledge base | Library, filing cabinet, book stack | Organized information storage |
| Workflow | Conveyor belt, assembly line, Rube Goldberg machine | Steps in sequence |
| Security / auth | Lock, vault, shield, key | Protection and access control |

### What NOT to do

- **No random floating shapes without meaning.** Every pill, sphere, and ring should either represent something specific OR be explicitly decorative depth (and kept minimal — 3-5 accents max).
- **No generic compositions.** "Here's a 3D blob and some pills" communicates nothing. "Here's a calendar machine with glass tube tracks connecting to a send button" communicates "scheduling + delivery."
- **No literal screenshots turned 3D.** Don't extrude a UI screenshot. Instead, build a physical metaphor that captures the essence of the feature.

### The meaning test

For each 3D element in the scene, ask: "If I remove this, does the viewer lose understanding of what the feature does?" If yes, the element is meaningful. If no, it's decoration — keep it minimal and secondary.

---

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
```

The `<Environment>` provides the primary illumination. Add directional lights for key/fill/rim to supplement, not replace. Keep intensities soft — see "Lighting for premium feel" above.

### RectAreaLight (emissive surface approximation)

To fake a glowing screen or surface that illuminates nearby objects without path tracing, co-locate a `RectAreaLight` with an emissive mesh:

```tsx
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
RectAreaLightUniformsLib.init(); // call once before using RectAreaLight

// Glowing screen that lights up the keyboard below
<group position={[0, 1, 0]}>
  {/* Visual: emissive plane */}
  <mesh>
    <planeGeometry args={[1.2, 0.8]} />
    <meshStandardMaterial emissive="#3784FF" emissiveIntensity={2} color="#3784FF" />
  </mesh>
  {/* Light: co-located RectAreaLight casts actual illumination */}
  <rectAreaLight width={1.2} height={0.8} intensity={5} color="#3784FF" />
</group>
```

**Limitations:** RectAreaLight only works with `meshStandardMaterial` and `meshPhysicalMaterial`. Does NOT cast shadows. For physically correct emissive lighting, use the path tracer instead (see `advanced.md`).

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

---

## 3D texture library (reusable atmospheric backgrounds)

Most feature graphics don't need a custom R3F scene — they need a **reusable 3D texture** as an atmospheric background in Figma. This is Resend's most-used 3D asset: ~70% of their posts use pre-rendered texture PNGs at 5-20% opacity, not custom renders.

**The concept:** Render a library of 3D texture sheets once via R3F. Store as transparent PNGs. Reuse in Figma compositions by placing the texture behind content at low opacity. One-time R3F investment, unlimited Figma reuse.

### Recommended textures

| Texture | 3D elements | Mood | Best for |
|---|---|---|---|
| **Hexagonal facets** | Tightly packed extruded hexagons at varying depths | Technical precision, structured data | Analytics, data features, security |
| **Ribbed spheres** | Corrugated/ridged spheres scattered at varying scales | Organic, energetic | General posts, abstract concepts |
| **Elongated capsules** | Pill/capsule shapes at dynamic angles | Movement, velocity, celebration | Milestones, stats, announcements |
| **Angular prisms** | Sharp-edged rectangular blocks, scattered | Architectural, engineered | Infrastructure, API, platform features |
| **Bokeh circles** | Soft out-of-focus circles (not 3D — mesh planes with radial gradient) | Warm, cinematic, editorial | Product launches, case studies |

### Render specs

- **Dimensions:** 2560×1440 (matches blog cover export size at 2x)
- **Background:** Transparent (`--mode compositing`)
- **Object material:** Dark matte (near-black, roughness 0.9) with subtle specular highlights — objects should be barely visible, not colorful
- **Object color:** `#1a1a1a` to `#2a2a2a` range (dark enough to work on both light and dark backgrounds at low opacity)
- **Density:** Fill ~60-70% of the canvas with objects, leaving edges sparse for content breathing room
- **Output:** Transparent PNG per texture type, stored in `tools/r3f/assets/textures/`

### Usage in Figma (compositing workflow)

Place the texture PNG as an image fill on a background rectangle, then adjust opacity:

| Opacity | Effect | When to use |
|---|---|---|
| **5-8%** | Barely visible — adds texture without competing with content | Text-heavy posts, simple features |
| **10-15%** | Noticeable depth — 3D shapes visible but secondary | Standard blog covers, changelog entries |
| **15-20%** | Prominent — 3D shapes are part of the visual composition | Milestones, launch announcements, hero sections |

**On dark backgrounds:** Use the textures at higher opacity (15-25%) — the dark-on-dark creates subtle depth.
**On light backgrounds:** Use at lower opacity (5-12%) — or invert the texture (light objects on transparent) for cream/white backgrounds.

### Why this matters

Without this library, the agent reaches for R3F on every graphic request — writing a custom scene, rendering, compositing. With the library, ~70% of graphics skip R3F entirely: pick a texture, set opacity, compose in Figma. This matches how Resend actually works — their Spline-rendered textures are reused across dozens of posts.
