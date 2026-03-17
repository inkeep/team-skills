# SVG Import Limitations in Figma's `createNodeFromSvg()`

Use when: Importing SVGs into Figma via `figma.createNodeFromSvg()` in `figma_execute`, or diagnosing why an imported SVG looks wrong
Priority: P1
Impact: Failed imports, broken logos, silent visual degradation, wasted debugging time

---

## Official API Surface

```typescript
figma.createNodeFromSvg(svg: string): FrameNode
```

- **Synchronous** — no `await` needed
- Returns a `FrameNode` containing converted SVG content as Figma vector nodes
- Equivalent to the editor's native SVG import (drag-and-drop / paste)
- Official docs reference only the W3C SVG path spec; no detailed feature support matrix is published

**Official limitation (from Figma Help Center):**
> "SVG marker and pattern elements will not be included in the import."

Source: https://help.figma.com/hc/en-us/articles/360040030374

---

## Comprehensive Feature Breakage Catalog

### 1. Gradients (linearGradient, radialGradient)

**Status:** PARTIALLY SUPPORTED — simple gradients work; complex ones break

| Scenario | Result |
|---|---|
| Simple `<linearGradient>` with 2-3 stops, no `gradientTransform` | Usually imports correctly |
| `<radialGradient>` with `gradientTransform` including translate+scale | May fail or render incorrectly |
| Gradient strokes (`stroke="url(#gradient)"`) | Often fails with "failed to invert transform" error |
| Percentage-based gradient coordinates (`x1="0%"`) | May cause import failure — use absolute values instead |
| Gradient referenced from `<defs>` via `url(#id)` | Works when defs structure is standard; fails with complex nesting |
| 10+ gradient definitions (e.g., Firefox logo with 13 gradients) | Import succeeds but colors may be inaccurate or simplified |

**Pre-processing fix:**
- For gradient fills: usually safe to keep as-is if they use simple `gradientTransform` or none at all
- For gradient strokes: convert to filled paths (use SVGO `convertShapeToPath` or manual expansion)
- Replace percentage coordinates with absolute values
- For logos that don't need accurate gradient rendering: flatten to solid fills using the dominant color

### 2. Masks (`<mask>`) and Clip Paths (`<clipPath>`)

**Status:** PARTIALLY SUPPORTED — simple clip paths work; masks are unreliable

| Scenario | Result |
|---|---|
| Simple `<clipPath>` with a single rectangle or ellipse | Usually works |
| `<clipPath>` with complex paths or multiple shapes | May render incorrectly |
| `<mask>` elements (luminance or alpha masks) | Unreliable — may be silently dropped |
| Nested masks or masks referencing other defs | Likely to fail |

**Pre-processing fix:**
- Apply clip paths manually (use a vector editor to intersect paths)
- For masks: rasterize the masked area and embed as an image, or manually create the intersected shapes
- SVGO does not have a plugin that flattens masks/clips — this requires manual intervention or a dedicated tool like Inkscape CLI (`inkscape --export-plain-svg`)

### 3. `<defs>` and `<use>` Elements

**Status:** NOT RELIABLY SUPPORTED — inline all references before import

| Scenario | Result |
|---|---|
| `<defs>` containing gradient definitions referenced by `url(#id)` | Works for simple gradients |
| `<use>` referencing shapes defined in `<defs>` | NOT reliably supported — may be silently dropped |
| `<use>` with `xlink:href` (legacy syntax) | Same as above; may also fail due to namespace issues |
| Deeply nested `<defs>` references | Likely to fail |

**Pre-processing fix:**
- **Inline all `<use>` references** — replace each `<use>` element with a copy of the referenced shape, applying the `<use>` element's transform, x, y, width, height attributes
- SVGO does not have a built-in plugin to inline `<use>` elements (the `reusePaths` plugin does the opposite — it creates `<use>` elements)
- Manual inlining or custom script required: parse the SVG, find `<use>` elements, look up their `href` target in `<defs>`, clone the target, and replace the `<use>` with the clone
- `removeUselessDefs` SVGO plugin removes unreferenced defs (cleanup after inlining)

### 4. SVG Filters (`<filter>`, `feGaussianBlur`, `feDropShadow`, etc.)

**Status:** NOT SUPPORTED — silently dropped

| Scenario | Result |
|---|---|
| `filter="url(#blur)"` referencing `<feGaussianBlur>` | Filter silently dropped; element renders without blur |
| `<feDropShadow>` | Silently dropped |
| `<feColorMatrix>`, `<feComposite>`, etc. | Silently dropped |
| CSS `filter: blur()` or `filter: drop-shadow()` | Silently dropped |

**Pre-processing fix:**
- Remove all filter references and `<filter>` definitions before import
- Recreate effects in Figma natively after import:
  - Blur → `node.effects = [{ type: 'LAYER_BLUR', radius: N, visible: true }]`
  - Drop shadow → `node.effects = [{ type: 'DROP_SHADOW', color: {...}, offset: {...}, radius: N, ... }]`
- SVGO does not have a filter-removal plugin; use `removeElementsByAttr` with custom config or manual deletion

### 5. Markers (`<marker>`)

**Status:** NOT SUPPORTED — officially documented as excluded

Per Figma's help documentation: "SVG marker and pattern elements will not be included in the import."

**Pre-processing fix:**
- Remove `<marker>` elements
- If arrowheads are needed: add them as separate path elements at line endpoints, or recreate in Figma using `strokeCap: 'ARROW_EQUILATERAL'` on vector vertices (see `figma-console-tools.md` Pattern: Connection arrows)

### 6. Patterns (`<pattern>`)

**Status:** NOT SUPPORTED — officially documented as excluded

Same as markers — explicitly listed as excluded from Figma SVG import.

**Pre-processing fix:**
- Expand patterns inline (each tile becomes an explicit element)
- Or rasterize the patterned area and embed as an image fill

### 7. Stroke Position (inside, outside, center)

**Status:** PARTIALLY SUPPORTED — only center strokes

| Scenario | Result |
|---|---|
| Default center stroke | Works correctly |
| `paint-order` property for inside/outside stroke simulation | Likely ignored |
| SVG 2.0 `stroke-alignment` (not widely supported in SVG renderers either) | Not supported |

**Pre-processing fix:**
- Convert inside/outside strokes to center strokes with adjusted path dimensions
- Or convert stroked paths to filled paths (outline strokes)
- SVGO `convertShapeToPath` can help but doesn't outline strokes; manual conversion needed

### 8. CSS Styles vs Inline Attributes

**Status:** PARTIALLY SUPPORTED — `<style>` blocks may not be parsed correctly

| Scenario | Result |
|---|---|
| Inline `style="fill: red"` attributes | Works |
| Inline XML attributes `fill="red"` | Works (most reliable) |
| `<style>` blocks with class selectors (`.cls-1 { fill: red }`) | May not be parsed correctly; classes may be lost |
| External CSS `<link>` references | Not supported |
| `@media` queries in `<style>` blocks | Not supported |
| CSS custom properties (`var(--color)`) | Not supported |

**Pre-processing fix:**
- SVGO `inlineStyles` plugin — moves CSS declarations from `<style>` blocks into inline `style` attributes on matched elements
- SVGO `convertStyleToAttrs` plugin — converts inline `style` attributes to XML presentation attributes (the most compatible format)
- Chain both: `inlineStyles` first, then `convertStyleToAttrs`

### 9. `<foreignObject>` (HTML embedded in SVG)

**Status:** NOT SUPPORTED — content silently dropped

**Pre-processing fix:**
- Remove `<foreignObject>` elements entirely
- Recreate any embedded HTML content as native SVG elements (`<text>`, `<rect>`, etc.)

### 10. `<text>` Elements

**Status:** PARTIALLY SUPPORTED — text is converted to paths on import

| Scenario | Result |
|---|---|
| `<text>` with simple content and a system font | Converted to vector paths (non-editable, but visually correct if font is available) |
| `<text>` with `font-family` referencing a custom/web font | May render with a fallback font before being converted to paths |
| `<tspan>` elements for multi-style text | May lose positioning or style differentiation |
| `<textPath>` (text on a path) | May work for simple cases; complex cases may fail |
| Text with CSS `font-feature-settings`, `letter-spacing`, etc. | May be ignored |

**Pre-processing fix:**
- For text that must be editable in Figma: remove `<text>` elements from the SVG, import the vector artwork, then recreate text as native Figma TextNodes via `figma.createText()` and `figma.loadFontAsync()`
- For text that's OK as vector paths: convert text to outlines in a vector editor before import (ensures the visual is preserved regardless of font availability)
- `removeEmptyText` SVGO plugin removes empty text elements

### 11. Embedded Images (base64, external URLs)

**Status:** PARTIALLY SUPPORTED

| Scenario | Result |
|---|---|
| `<image>` with `href="data:image/png;base64,..."` (embedded base64 PNG) | Usually imports correctly |
| `<image>` with `href="https://..."` (external URL) | NOT supported — external images are not fetched during import |
| `<image>` with `xlink:href` (legacy syntax) | May work for base64; external URLs still fail |

**Pre-processing fix:**
- Fetch external images and convert to base64 data URIs before import
- `removeRasterImages` SVGO plugin removes all embedded raster images (use this when you want vector-only import and will handle images separately)
- For logos with embedded images: consider whether the image portion should be imported separately as a Figma image fill

### 12. `viewBox` and `preserveAspectRatio`

**Status:** SUPPORTED with caveats

| Scenario | Result |
|---|---|
| SVG with explicit `viewBox` and `width`/`height` | Works correctly — Figma uses these to set the frame dimensions |
| SVG with `viewBox` but NO `width`/`height` | May import at unexpected dimensions (very small or very large) |
| SVG with neither `viewBox` nor `width`/`height` | Imports at tiny default size |
| `preserveAspectRatio` attribute | Likely ignored — Figma uses viewBox to set dimensions, then scales the content to fit |

**Pre-processing fix:**
- **Always ensure the SVG has both `viewBox` AND explicit `width`/`height` attributes**
- If missing, add them: parse the content bounding box and set `viewBox="0 0 W H"` with matching `width="W"` `height="H"`
- SVGO `removeDimensions` plugin removes `width`/`height` — **do NOT use this** for Figma-bound SVGs
- SVGO `removeViewBox` plugin removes viewBox — **do NOT use this** for Figma-bound SVGs

### 13. Complex Path Data

**Status:** GENERALLY SUPPORTED — Figma handles standard SVG path commands well

| Scenario | Result |
|---|---|
| Standard path commands (M, L, C, Q, A, Z) | Works correctly |
| Relative path commands (m, l, c, q, a, z) | Works correctly |
| Very long path data (100KB+) | May cause performance issues or timeout in plugin context |
| Shorthand commands (S, T, H, V) | Works correctly |

**Pre-processing fix:**
- `convertPathData` SVGO plugin optimizes path data (reduces points, simplifies curves)
- For very large SVGs (>100KB): consider simplifying paths or splitting into multiple import calls

### 14. Opacity and Blend Modes

**Status:** PARTIALLY SUPPORTED

| Scenario | Result |
|---|---|
| Element-level `opacity="0.5"` | Works |
| `fill-opacity` and `stroke-opacity` | Works |
| `mix-blend-mode` CSS property | Not supported — silently ignored |
| `isolation` CSS property | Not supported |

### 15. Transforms

**Status:** GENERALLY SUPPORTED

| Scenario | Result |
|---|---|
| `transform="translate(x,y)"` | Works |
| `transform="rotate(deg)"` | Works |
| `transform="scale(x,y)"` | Works |
| `transform="matrix(a,b,c,d,e,f)"` | Works |
| `transform="skewX(deg)"` / `skewY(deg)` | Works |
| Nested transforms on groups | Works (transforms are composed) |

### 16. Animations (`<animate>`, `<animateTransform>`, CSS animations)

**Status:** NOT SUPPORTED — animation attributes silently dropped

The imported SVG represents a single static frame.

---

## SVGO Configuration for Figma Compatibility

The following SVGO config maximizes compatibility with `createNodeFromSvg()`:

```javascript
// svgo.config.js — optimized for Figma import
module.exports = {
  plugins: [
    // Phase 1: Convert CSS to inline attributes (most compatible format)
    'inlineStyles',
    'convertStyleToAttrs',

    // Phase 2: Clean up structure
    'removeUselessDefs',      // Remove unreferenced <defs> children
    'removeEmptyContainers',  // Remove empty groups
    'removeEmptyText',        // Remove empty text elements
    'collapseGroups',         // Flatten unnecessary nesting
    'removeComments',         // Remove comments
    'removeMetadata',         // Remove metadata
    'removeDoctype',          // Remove doctype
    'removeEditorsNSData',    // Remove editor-specific data (Inkscape, Illustrator)
    'removeXMLProcInst',      // Remove XML processing instructions

    // Phase 3: Optimize paths and shapes
    'convertPathData',        // Optimize path data
    'convertShapeToPath',     // Convert shapes to paths
    'convertEllipseToCircle', // Simplify circles
    'convertTransform',       // Optimize transforms
    'mergePaths',             // Merge adjacent paths where possible

    // Phase 4: Clean up attributes
    'cleanupAttrs',
    'cleanupNumericValues',
    'cleanupIds',             // Minify IDs (keeps referenced ones)
    'removeUnknownsAndDefaults',
    'removeNonInheritableGroupAttrs',
    'removeUselessStrokeAndFill',
    'removeEmptyAttrs',
    'sortAttrs',

    // DO NOT include these (they break Figma import):
    // 'removeDimensions',    -- removes width/height, causes tiny import
    // 'removeViewBox',       -- removes viewBox, causes sizing issues
    // 'reusePaths',          -- creates <use> elements, not reliably supported
    // 'removeRasterImages',  -- only use if you want to strip embedded images
  ]
};
```

**Plugins NOT in SVGO that would help:**
- **Inline `<use>` references** — no built-in SVGO plugin does this. Requires custom script or manual work.
- **Remove `<filter>` elements** — no dedicated plugin. Use `removeElementsByAttr` or manual removal.
- **Flatten masks/clips** — no SVGO plugin. Requires Inkscape CLI or manual vector operations.

---

## Impact Assessment by SVG Source

### Simple Icons (cdn.jsdelivr.net/npm/simple-icons)

**Risk: NONE** — these SVGs are guaranteed safe for `createNodeFromSvg()`

Structure analysis of Simple Icons SVGs:
- Single `<path>` element with no fill attribute (inherits `currentColor`)
- Standard `viewBox="0 0 24 24"` with `role="img"` and `<title>`
- No gradients, no defs, no use, no filters, no masks, no CSS, no text, no embedded images
- Typical file size: 100-500 bytes
- Example (Notion): `<svg viewBox="0 0 24 24"><title>Notion</title><path d="..."/></svg>`

**Verdict:** Import directly — no pre-processing needed. Just add a fill color after import if needed.

### Iconify logos/ (api.iconify.design/logos/)

**Risk: LOW to MODERATE** — most logos import cleanly; ~10-15% have gradient issues

Structure analysis across sampled logos:

| Logo | Paths | Gradients | Defs | Use | Filters | CSS | Risk |
|---|---|---|---|---|---|---|---|
| Slack | 4 paths | None | None | None | None | None | NONE |
| Google | 4 paths | None | None | None | None | None | NONE |
| Chrome | 5 paths | None | None | None | None | None | NONE |
| Microsoft | 4 paths | None | None | None | None | None | NONE |
| Dropbox | 1 path | None | None | None | None | None | NONE |
| Stripe | 1 path | None | None | None | None | None | NONE |
| Apple | 1 path | None | None | None | None | None | NONE |
| Instagram | 1 path | None | None | None | None | None | NONE |
| Spotify | 1 path | None | None | None | None | None | NONE |
| Firefox | 13+ paths | 11 radial + 2 linear | Yes (13 gradients) | None | None | None | **MODERATE** |

Most gilbarbara logos are simple multi-path SVGs with solid fills — safe for direct import. Logos for brands with gradient brand marks (Firefox, Instagram gradient version, Opera) have complex gradient definitions that may not import perfectly.

**Verdict:** Import directly for most logos. For gradient-heavy logos (Firefox, Instagram gradient, Opera): import and screenshot to verify. If broken, use Simple Icons monochrome version instead and apply brand color.

### Brandfetch (api.brandfetch.io)

**Risk: LOW to HIGH** — varies dramatically by brand

Brandfetch returns brand-uploaded SVGs with no normalization. Quality ranges from clean Simple Icons-quality files to complex Illustrator exports with:
- CSS `<style>` blocks with class selectors
- `<defs>` with gradient definitions
- `<clipPath>` and `<mask>` elements
- Embedded raster images (base64 PNGs/JPGs inside the SVG)
- Non-standard namespaces (Illustrator, Sketch metadata)
- Very large file sizes (10-500KB)

**Verdict:** Always pre-process with SVGO before import. After import, screenshot to verify. If the logo looks wrong:
1. Try SVGO with the Figma-optimized config above
2. If still broken, try fetching a simpler variant (icon vs full logo)
3. If still broken, fall back to Simple Icons or Iconify monochrome version
4. Last resort: use the PNG variant from Brandfetch (import as image fill, not vector)

### Quiver.ai (AI-generated SVGs)

**Risk: LOW** — Quiver output is generally clean

Quiver's Arrow model produces structured SVGs with:
- Named groups (`<g>`) for semantic layers
- Path elements with inline fill attributes (no CSS classes)
- Standard viewBox with explicit width/height
- No filters, no masks, no use/defs references, no embedded images
- Possible: gradient definitions (linear/radial) when requested
- Text rendered as `<path>` elements (not `<text>`) — non-editable but visually correct

**Verdict:** Import directly in most cases. If the prompt included gradients, verify gradient rendering after import. Text will import as vector paths (non-editable) — this is expected behavior, not a bug. For editable text, recreate as Figma TextNodes after import.

---

## Recommended Workaround Chain

When importing an SVG via `createNodeFromSvg()`, follow this decision tree:

### Step 1: Assess the SVG source

```
Is the source Simple Icons?
  → Import directly. No pre-processing needed. Skip to Step 4.

Is the source Iconify logos/?
  → Quick-check: does it have <defs>, <linearGradient>, <radialGradient>,
    <filter>, <mask>, <use>, or <style> blocks?
    No  → Import directly. Skip to Step 4.
    Yes → Go to Step 2.

Is the source Brandfetch?
  → Always go to Step 2.

Is the source Quiver?
  → Import directly. Skip to Step 4.

Is the source unknown / user-provided?
  → Always go to Step 2.
```

### Step 2: Pre-process with SVGO

Run the SVG through SVGO with the Figma-optimized config:

```javascript
// In figma_execute or via local script
const { optimize } = require('svgo');
const result = optimize(svgString, {
  plugins: [
    'inlineStyles',
    'convertStyleToAttrs',
    'removeUselessDefs',
    'removeEmptyContainers',
    'collapseGroups',
    'convertPathData',
    'convertShapeToPath',
    'cleanupAttrs',
    'cleanupNumericValues',
    'cleanupIds',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
  ]
});
const cleanSvg = result.data;
```

**If SVGO is not available in the runtime** (e.g., inside `figma_execute` which runs in Figma's plugin sandbox with no npm access): do manual pre-processing by string manipulation:
1. Remove `<style>` blocks
2. Remove `<filter>` elements and `filter="..."` attributes
3. Ensure `viewBox` and `width`/`height` are present

### Step 3: Import and verify

```javascript
const node = figma.createNodeFromSvg(cleanSvg);
node.name = 'imported-logo';
// Screenshot to verify
```

### Step 4: Verify visual correctness

After import, **always screenshot** via `figma_capture_screenshot` and visually inspect:

| Check | What to look for |
|---|---|
| Colors correct? | Fills match expected brand colors |
| Proportions correct? | Width:height ratio matches viewBox |
| All elements present? | No missing shapes, text, or decorative elements |
| Gradients rendered? | If the source had gradients, check they look correct |
| No artifacts? | No stray lines, misaligned paths, or phantom shapes |

### Step 5: If import failed or looks wrong

**Fallback sequence (try in order):**

1. **Simplify the SVG** — remove problematic elements (gradients → solid fills, filters → remove, use → inline) and re-import
2. **Try a different variant** — icon-only instead of full logo, monochrome instead of color
3. **Try a different source** — Simple Icons (monochrome) if Iconify/Brandfetch failed
4. **Import as raster** — fetch/render the SVG as PNG, then import as an image fill on a rectangle:
   ```javascript
   // Fetch or render SVG to PNG externally, get base64
   const image = await figma.createImageAsync(pngUrl);
   const rect = figma.createRectangle();
   rect.resize(width, height);
   rect.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
   ```
5. **Text pill placeholder** — styled rounded rectangle with brand name text, flagged for manual replacement

### When to give up on vector import entirely

Skip directly to raster import (step 4 above) when the SVG has:
- Multiple overlapping `<mask>` elements
- Complex `<filter>` chains (blur + color matrix + composite)
- `<foreignObject>` with embedded HTML
- File size > 500KB (likely to timeout in plugin context)
- `<pattern>` fills that are core to the design (not just decoration)

---

## Quick Reference: Feature Support Summary

| SVG Feature | Support Level | Pre-processing |
|---|---|---|
| Path commands (M/L/C/Q/A/Z) | FULL | None needed |
| Solid fills and strokes | FULL | None needed |
| Transforms | FULL | None needed |
| Opacity (element-level) | FULL | None needed |
| viewBox + width/height | FULL | Ensure both present |
| Groups (`<g>`) | FULL | None needed |
| Simple gradients | PARTIAL | Verify after import |
| Complex gradients | PARTIAL | May need simplification |
| Gradient strokes | BROKEN | Convert to filled paths |
| `<clipPath>` (simple) | PARTIAL | Verify after import |
| `<mask>` | UNRELIABLE | Flatten manually |
| `<defs>` (gradients) | PARTIAL | Keep simple; remove unused |
| `<use>` elements | UNRELIABLE | Inline all references |
| `<filter>` (blur, shadow) | NOT SUPPORTED | Remove; recreate in Figma |
| `<marker>` | NOT SUPPORTED | Remove; use Figma arrowheads |
| `<pattern>` | NOT SUPPORTED | Expand inline or rasterize |
| `<text>` | CONVERTED TO PATHS | Recreate as Figma TextNodes |
| `<foreignObject>` | NOT SUPPORTED | Remove entirely |
| CSS `<style>` blocks | UNRELIABLE | Inline with SVGO |
| CSS custom properties | NOT SUPPORTED | Resolve to values |
| Embedded base64 images | PARTIAL | Usually works |
| External image URLs | NOT SUPPORTED | Fetch and embed as base64 |
| `mix-blend-mode` | NOT SUPPORTED | Remove |
| Animations | NOT SUPPORTED | Removed automatically |
| `preserveAspectRatio` | IGNORED | Rely on viewBox sizing |

---

## Sources

- Figma Plugin API docs: https://developers.figma.com/docs/plugins/api/figma/ (method signature: `createNodeFromSvg(svg: string): FrameNode`)
- Figma Help Center on SVG import: https://help.figma.com/hc/en-us/articles/360040030374 (markers and patterns excluded)
- Figma Help Center on file import: https://help.figma.com/hc/en-us/articles/360040028034 (SVG converted to editable vector layers)
- SVGO plugin documentation: https://svgo.dev/docs/plugins/
- Community-reported issues documented in `figma-console-tools.md` (gradient strokes, defs/use, viewBox/dimensions, percentage gradients)
- Empirical testing of SVG sources (Simple Icons, Iconify gilbarbara logos, Brandfetch API responses)
