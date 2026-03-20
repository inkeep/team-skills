Use when: Writing the Atom generation audit in the Build Spec (Step 3). Walk this decision tree for every Tier 2 (generative) atom.
Priority: P0
Impact: Without this, the model defaults to Figma shapes for everything or picks methods without considering alternatives — producing flat, low-fidelity graphics that underuse the available toolchain.

---

# Method Selection Decision Tree

## Governing principle

**The only selection axis is output quality and fidelity for the specific atom.** Speed, API cost, and implementation effort are NEVER factors. When two methods produce genuinely equivalent visual quality, either is acceptable — but never choose a lower-fidelity method for any reason other than the higher-fidelity method being unable to produce the atom at all.

## Compound atoms: recursive decomposition

When an atom is a composed, multi-layer, or multi-element construct (product mockups, chat UIs, styled diagram nodes, infographics), the decision tree applies **recursively**:

1. The compound atom's top-level Tier 2 entry declares the **container method** (usually Figma native for layout/structure)
2. Decompose into sub-elements — each sub-element is classified Tier 1 or Tier 2
3. Walk this decision tree for every Tier 2 sub-element
4. If a sub-element is itself compound, decompose again until every leaf has a single-method declaration

Decomposing reveals that sub-elements like avatars are illustration problems (→ Quiver), logos are asset problems (→ Brand Assets clone), and only layout/text are genuinely Figma-native. See the Build Spec template's compound atom decomposition section for the full rationale and examples.

## Per-atom decision tree

For each Tier 2 atom or sub-element in the Build Spec, walk this tree top-to-bottom. Stop at the first YES.

### 1. Does this atom reproduce an existing mark (logo, icon, badge)?

→ **YES:** Clone from Brand Assets or fetch via `fetch-logo.ts`. NEVER generate — Quiver hallucinates logos, Image Gen reinterprets them through its latent space. The only acceptable source for an existing mark is the canonical asset.

→ **NO:** Continue to step 2.

### 2. Does this atom require photorealism, volumetric effects, film grain, atmospheric depth, or 3D materiality?

→ **YES:** **AI Image Gen (Option E).**
  - Route to **GPT Image** when: transparent background needed (only model with native `background: "transparent"`), image editing/inpainting, or structured illustration with correct layout topology.
  - Route to **Gemini** when: glass/material quality is priority (better refraction, transmission, caustics), 2D→3D brand illustration conversion, or iterative conversational refinement.
  - Route to **both in parallel** when: 3D hero elements or abstract atmospheric art where quality is subjective — present both, let user pick.
  - **Exception → Three.js/R3F (Option F)** when Image Gen cannot achieve the required fidelity:
    - Exact hex-color determinism (same code = same render, pixel-exact brand colors)
    - Parameterized batch rendering (10+ variations with guaranteed identical lighting/materials)
    - Precise geometric boolean operations (CSG: logo carved into surface, hexagonal cutouts)
    - Reusable 3D texture library assets (render once, deterministic forever)

→ **NO:** Continue to step 3.

### 3. Does this atom have complex organic curves, hand-drawn style, the brand "Imperfect Precision" illustration language, or decorative patterns?

→ **YES:** **Quiver (Option D).** Produces editable SVG with semantic layering that scales infinitely.
  - Set `--instructions` with brand color constraints (hex codes, style rules, negative constraints)
  - Use reference images (`--references`) for style consistency with existing brand illustrations
  - For icon sets: **Load** `content-types/icons.md` for the reference-chaining protocol, set coherence rules, and Quiver template
  - **Exception → Figma shapes** only if the illustration is purely geometric with <10 elements (box-and-arrow diagrams, simple grids, basic shape compositions). If the illustration requires >10 distinct shape elements or any organic curves, use Quiver.

→ **NO:** Continue to step 4.

### 4. Is this atom a structural diagram (flowchart, architecture, sequence, entity-relationship)?

→ **YES:** **D2 or Mermaid (Option C) → SVG export → Figma import.** Purpose-built diagram languages produce structurally accurate output. After import, apply brand typography and colors in Figma. If the imported connectors need restyling (curved arrows, dot endpoints, brand stroke weight), rebuild them using the `vectorNetwork` connector recipes in `tools/figma-console.md` — the imported SVG connectors may be straight lines or have non-brand styling.

→ **NO:** Continue to step 5.

### 5. Is this atom purely geometric with <10 elements (rectangles, circles, lines, simple compositions)?

→ **YES:** **Figma native shapes (Option A).** Exact control, token-bound colors, designer-editable. Auto-layout for structured layouts. This includes: card backgrounds, divider lines, simple icon compositions from basic shapes, progress bars, simple badges.

→ **NO:** Continue to step 6.

### 6. Does this atom ship as hand-editable code in a repository (inline SVG, committed graphic)?

→ **YES:** **Hand-coded SVG (Option B).** Human-readable, semantic markup that developers can maintain. Import into Figma for review, but the SVG file is the deliverable.

→ **NO:** Continue to step 7.

### 7. None of the above apply.

→ **Justify your method choice explicitly in the Build Spec.** State what quality characteristic of the selected method makes it produce the highest-fidelity result for this specific atom, and what limitation of the alternatives disqualifies them.

→ **Default to Figma (Option A)** when the atom is layout, text, or token-bound elements. But if the atom is visual/illustrative and you're reaching for Figma shapes as a default, reconsider — steps 2-3 likely apply.

---

## Method quality characteristics

Use these when writing the "Why this method" and "Why NOT runner-up" columns.

| Method | Highest-fidelity use cases | Quality limitations |
|---|---|---|
| **Figma native** | Precise layout, editable text, token-bound colors, auto-layout compositions, data visualizations (with code recipes), simple geometric shapes | Cannot produce organic curves, photorealistic effects, or complex illustrations. Shapes beyond ~10 elements become tedious and lack the polish of purpose-built tools. |
| **Quiver** | Complex vector art, organic illustrations, hand-drawn style, decorative patterns, icons, abstract art, brand illustration system. Produces clean, layered, editable SVG. | Converts text to paths (not editable). Hallucates rather than reproduces existing marks. Cannot do photorealism, 3D, or data visualizations with accurate values. |
| **Image Gen (GPT)** | Transparent compositing elements, structured illustrations, image editing/inpainting. Best structural accuracy of the image gen models. | Raster output (pixelates when scaled). Cannot produce editable text. Colors are approximate (latent space interpretation). |
| **Image Gen (Gemini)** | 3D hero objects, glass/material quality, atmospheric effects, 2D→3D conversion, conversational iterative refinement. Best material rendering. | Raster output. No native transparency. Colors are approximate. Cannot produce structurally accurate diagrams. |
| **Three.js/R3F** | Pixel-exact brand colors, parametric batch rendering, CSG boolean operations, reusable deterministic texture library. Code-driven precision. | Requires scene authoring (higher skill floor). Not suited for 2D, text, or diagrams. |
| **D2/Mermaid** | Structurally accurate diagrams, flowcharts, sequence diagrams, architecture. Purpose-built for diagram semantics. | Limited visual styling. Must import to Figma for brand typography/colors. Not suited for illustrations or freeform compositions. |
| **Hand-coded SVG** | Human-readable, maintainable code assets. Semantic markup for developer-facing graphics. | Impractical for complex paths or organic shapes. Not suited for illustrations (use Quiver). |

---

## Boundary guidance

### Quiver vs Image Gen (illustration boundary)
- **Flat/stylized illustrations** (hand-drawn containers, brand icons, "Imperfect Precision" style) → **Quiver.** Editable SVG, scales infinitely, matches brand illustration system.
- **Photorealistic 3D elements** (glass, dark tiles, metallic surfaces, atmospheric effects) → **Image Gen.** Quiver cannot do 3D, glass, or photorealism.
- **Abstract decorative patterns** → **Quiver** if the pattern needs to scale or ship as code. **Image Gen** if the pattern needs volumetric effects, particles, or film grain that SVG cannot express.
- **2D brand illustration → 3D conversion** → **Image Gen** with the original Quiver/Figma illustration as reference input.

### Figma shapes vs Quiver (geometry boundary)
- **Figma shapes OK:** Box-and-arrow diagrams, Venn diagrams, simple grids, progress bars, basic icon compositions from circles/rectangles — any layout where shapes are purely geometric and few (<10 elements).
- **Use Quiver:** Anything with organic curves, hand-drawn style, complex path work, stylized illustrations, decorative patterns, abstract art, or the brand illustration style. If the illustration requires >10 distinct shape elements or any organic curves, use Quiver.

### Image Gen vs Three.js (3D boundary)
- **Image Gen for most 3D:** Produces equivalent visual quality for one-off hero elements, atmospheric backgrounds, and concept exploration.
- **Three.js when Image Gen can't match fidelity:** Exact hex-color determinism, parametric batch consistency, CSG boolean precision, deterministic texture library.
