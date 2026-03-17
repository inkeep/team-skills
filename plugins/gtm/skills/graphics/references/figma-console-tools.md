# Figma Console MCP — Tools Reference for Graphics

Use when: Creating or modifying native Figma designs via figma-console-mcp
Priority: P0
Impact: Wrong tool usage, inefficient workflows, failed design operations

---

## Overview

The `figma-console` MCP server (southleft/figma-console-mcp) provides 56+ tools for reading and writing native Figma designs. It connects to the Figma Desktop app via a WebSocket bridge plugin.

**Two MCP servers work together for graphics:**

| Server | Role | Key tools |
|---|---|---|
| `figma` (official) | **Read** — brand tokens, design context, screenshots | `get_design_context`, `get_screenshot`, `get_variable_defs` |
| `figma-console` | **Write** — create and modify native Figma objects | `figma_execute`, `figma_create_child`, `figma_set_fills`, `figma_set_text` |

## Prerequisites

The Figma Desktop Bridge plugin must be running in the target Figma file.

**One-time setup (import the plugin):**
1. Open **Figma Desktop** (not browser Figma)
2. Right-click canvas → **Plugins → Development → Import plugin from manifest...**
3. Select the manifest file. Find its path: `npx figma-console-mcp@latest --print-path`
4. The plugin appears permanently in **Plugins → Development → Figma Desktop Bridge**

**Each session (run the plugin):**
1. Open your target Figma file in Figma Desktop
2. Right-click canvas → **Plugins → Development → Figma Desktop Bridge**
3. Wait for the green "MCP Ready" status widget
4. Verify connection: call `figma_get_status` — check `setup.valid` is `true`

If the plugin disconnects (e.g., after tab refresh or file switch), re-run it from the Plugins menu.

**Multiple files:** The bridge can be connected to multiple Figma files simultaneously, but only one file is "active" at a time. When switching between files, call `figma_navigate` with the target file URL before any `figma_execute` calls — otherwise node lookups will silently fail against the wrong file.

## Key Tools for Graphics Creation

### Creating elements

| Tool | Use for |
|---|---|
| `figma_create_child` | Create rectangles, ellipses, text, frames as children of a node |
| `figma_set_text` | Set text content (auto-loads fonts) |
| `figma_set_fills` | Set fill color (hex → Figma RGB auto-conversion) |
| `figma_set_strokes` | Set stroke color |
| `figma_resize_node` | Change dimensions |
| `figma_move_node` | Reposition elements |
| `figma_clone_node` | Duplicate elements |
| `figma_delete_node` | Remove elements |
| `figma_rename_node` | Name layers clearly |

### Reading / navigating

| Tool | Use for |
|---|---|
| `figma_get_file_data` | Read file structure |
| `figma_get_selection` | Get current selection |
| `figma_navigate` | Open a Figma URL |
| `figma_capture_screenshot` | Screenshot via plugin runtime — **guaranteed current state**. Use this after modifying designs via `figma_execute`. |
| `figma_take_screenshot` | Screenshot via REST API — may show stale/cached state after recent changes. Use for initial reads or when the plugin bridge is unavailable. |

**Screenshot rule of thumb:** After any `figma_execute` modification, always verify with `figma_capture_screenshot` (plugin), not `figma_take_screenshot` (REST API). The REST API can lag behind plugin changes, causing false negatives where you think a change didn't apply.

### The power tool: `figma_execute`

`figma_execute` runs arbitrary Figma Plugin API JavaScript inside Figma. Use it for anything the dedicated tools don't cover:

**Auto-layout:**
```javascript
const frame = figma.createFrame();
frame.name = "Card";
frame.layoutMode = "VERTICAL";
frame.primaryAxisAlignItems = "MIN";
frame.counterAxisAlignItems = "MIN";
frame.paddingTop = 24;
frame.paddingBottom = 24;
frame.paddingLeft = 24;
frame.paddingRight = 24;
frame.itemSpacing = 16;
// IMPORTANT: Always set sizing mode explicitly. The default is "FIXED",
// which silently clips content that exceeds the frame's dimensions.
// Use "AUTO" (hug contents) unless you specifically need fixed sizing.
frame.primaryAxisSizingMode = "AUTO";
frame.counterAxisSizingMode = "AUTO";
```

**Text with specific font:**
```javascript
const text = figma.createText();
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
text.fontName = { family: "Inter", style: "Bold" };
text.characters = "Heading Text";
text.fontSize = 32;
text.fills = [{ type: 'SOLID', color: { r: 0.22, g: 0.52, b: 1 } }];
```

**Drop shadow:**
```javascript
const node = figma.currentPage.findOne(n => n.name === "Card");
node.effects = [{
  type: "DROP_SHADOW",
  color: { r: 0, g: 0, b: 0, a: 0.1 },
  offset: { x: 0, y: 4 },
  radius: 12,
  spread: 0,
  visible: true,
  blendMode: "NORMAL"
}];
```

**Rounded corners:**
```javascript
const node = figma.currentPage.findOne(n => n.name === "Card");
node.cornerRadius = 16;
```

**Linear gradient fill:**
```javascript
const node = figma.currentPage.findOne(n => n.name === "Background");
node.fills = [{
  type: "GRADIENT_LINEAR",
  gradientTransform: [[1, 0, 0], [0, 1, 0]],
  gradientStops: [
    { position: 0, color: { r: 0.98, g: 0.97, b: 0.96, a: 1 } },
    { position: 1, color: { r: 0.22, g: 0.52, b: 1, a: 0.06 } }
  ]
}];
```

**Component creation:**
```javascript
const frame = figma.createFrame();
frame.name = "Tag";
frame.layoutMode = "HORIZONTAL";
frame.paddingTop = 6; frame.paddingBottom = 6;
frame.paddingLeft = 12; frame.paddingRight = 12;
frame.itemSpacing = 6;
frame.cornerRadius = 20;
frame.primaryAxisSizingMode = "AUTO";
frame.counterAxisSizingMode = "AUTO";
const component = figma.createComponentFromNode(frame);
```

## Color conversion

`figma_set_fills` accepts hex colors and auto-converts to Figma's 0-1 RGB format. Supported formats: `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`.

For `figma_execute`, convert manually: divide each channel by 255.
- `#3784FF` → `{ r: 0.216, g: 0.518, b: 1.0 }`
- `#FBF9F4` → `{ r: 0.984, g: 0.976, b: 0.957 }`
- `#231F20` → `{ r: 0.137, g: 0.122, b: 0.125 }`

## Common patterns for marketing graphics

### Pattern: Diagram with labeled sections

1. Create outer frame with background fill
2. Create section frames with auto-layout
3. Add text labels and content tags
4. Add connection lines (via vector paths or positioned elements)
5. Style all elements with brand tokens

### Pattern: Card grid

1. Create container frame with auto-layout (HORIZONTAL, wrap)
2. Create card component with auto-layout (VERTICAL)
3. Instantiate cards, set text content per card
4. Apply consistent styling (fills, corners, shadows)

### Pattern: Connection arrows

Use native Figma arrowheads instead of separate arrowhead shapes. Setting `strokeCap: 'ARROW_EQUILATERAL'` on a vector vertex auto-aligns the arrowhead with the path tangent, eliminating misaligned separate arrowhead polygons.

```javascript
// Create a vector path with an arrowhead at the end
const vector = figma.createVector();
vector.vectorPaths = [{
  windingRule: "NONE",
  data: "M 0 0 L 200 0" // adjust coordinates to your layout
}];
vector.strokes = [{ type: 'SOLID', color: { r: 0.42, g: 0.42, b: 0.42 } }];
vector.strokeWeight = 2;
// Set arrowhead on the end vertex
const network = vector.vectorNetwork;
const vertices = network.vertices.map((v, i) => {
  if (i === network.vertices.length - 1) {
    return { ...v, strokeCap: 'ARROW_EQUILATERAL' };
  }
  return v;
});
vector.vectorNetwork = { ...network, vertices };
```

Build connection arrows **after** all elements are in their final positions. If layout changes later, rebuild all arrows from scratch (see SKILL.md Phase D).

**Z-ordering:** In Figma, z-order = child insertion order. The last child appended renders on top. Always `appendChild()` connectors as the very last step. If you add elements to a frame after connectors, the connectors will be hidden behind them.

### Pattern: Hero graphic with text overlay

1. Create background frame at target dimensions
2. Apply gradient or solid fill
3. Add logo element
4. Add heading text (large, brand font)
5. Add supporting text (smaller, secondary color)
6. Add decorative elements (shapes, icons)

### Pattern: Container sizing from content bounds

After placing children in a fixed-size frame, **always verify** the parent is tall/wide enough. Never hardcode container dimensions without measuring content — this is the #1 cause of text cutoff and clipped elements.

```javascript
// After placing all children in a container frame:
const parent = await figma.getNodeByIdAsync('PARENT_ID');
let maxBottom = 0;
for (const child of parent.children) {
  const bottom = child.y + child.height;
  if (bottom > maxBottom) maxBottom = bottom;
}
const requiredHeight = maxBottom + 24; // 24px bottom padding
if (parent.height < requiredHeight) {
  parent.resize(parent.width, requiredHeight);
}
return { was: parent.height, needed: requiredHeight };
```

Run this check after every batch of child placements — especially after text elements, which may be taller than expected depending on font size and line count.

### Pattern: Data visualization (charts, graphs, tables)

For data-driven graphics (comparison tables, pie/donut charts, line/area charts, sparklines), see **`standards/data-visualization.md`** which contains both design guidelines AND tested `figma_execute` code recipes in a single file.

### Pattern: Syntax-highlighted code block (setRangeFills)

Build syntax-highlighted code blocks as native, editable Figma text using per-character coloring. The result is real text (selectable, editable, scalable) — not an image or SVG outline.

**When to use:** Blog thumbnails for technical/API content. The code signals "developer content" at card sizes — it's not meant to be fully readable, but recognizable as code.

**Brand code color palettes:**

Dark background (Tier 1 thumbnails):

| Token type | Color | Token |
|---|---|---|
| Background | `#231F20` | surface/dark |
| Default text | `#FAFAF7` | — |
| Keywords (`const`, `new`, `import`, `async`, `await`) | `#3784FF` | brand/primary |
| Strings (quoted text) | `#FFC883` | brand/golden-sun |
| Comments (`//`) | `#5F5C62` | text/muted |
| Functions/methods | `#69A3FF` | brand/sky-blue |
| Numbers/constants | `#E69F00` | Okabe-Ito orange |
| Types/classes | `#E1DBFF` | brand/accent-cool |
| Punctuation (`.`, `,`, `{`, `}`) | `#8A8790` | — |

Light background (Tier 2 thumbnails):

| Token type | Color | Token |
|---|---|---|
| Background | `#FBF9F4` | bg/primary |
| Default text | `#231F20` | text/primary |
| Keywords | `#3784FF` | brand/primary |
| Strings | `#009E73` | Okabe-Ito green |
| Comments | `#5F5C62` | text/muted |
| Functions/methods | `#29325C` | text/dark-blue |
| Numbers/constants | `#D55E00` | Okabe-Ito vermillion |

```javascript
// Step 1: Load font and create container
await figma.loadFontAsync({ family: "JetBrains Mono", style: "Bold" });

const container = figma.createFrame();
container.name = "mockup-code";
container.layoutMode = 'VERTICAL';
container.layoutSizingHorizontal = 'HUG';
container.layoutSizingVertical = 'HUG';
container.paddingTop = 32; container.paddingBottom = 32;
container.paddingLeft = 32; container.paddingRight = 32;
container.cornerRadius = 16;
container.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }]; // surface/dark

// Step 2: Create text node with full code
const code = figma.createText();
code.name = "body";
code.fontName = { family: "JetBrains Mono", style: "Bold" };
code.fontSize = 22;
code.lineHeight = { value: 160, unit: "PERCENT" };
code.characters = 'const agent = new InkeepAgent({\n  channel: "#support",\n  model: "claude-4"\n});';
// Default text color
code.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.97 } }]; // near-white

// Step 3: Apply per-token colors using setRangeFills
// "const" (0-5) — keyword
code.setRangeFills(0, 5, [figma.util.solidPaint("#3784FF")]);
// "agent" (6-11) — variable (keep default white)
// " = " (12-14) — operator (keep default)
// "new" (14-17) — keyword
code.setRangeFills(14, 17, [figma.util.solidPaint("#3784FF")]);
// "InkeepAgent" (18-29) — class/type
code.setRangeFills(18, 29, [figma.util.solidPaint("#E1DBFF")]);
// "channel" (35-42) — property
code.setRangeFills(35, 42, [figma.util.solidPaint("#69A3FF")]);
// '"#support"' (44-54) — string
code.setRangeFills(44, 54, [figma.util.solidPaint("#FFC883")]);
// "model" (59-64) — property
code.setRangeFills(59, 64, [figma.util.solidPaint("#69A3FF")]);
// '"claude-4"' (66-76) — string
code.setRangeFills(66, 76, [figma.util.solidPaint("#FFC883")]);

container.appendChild(code);
```

**Design guidance:**
- **3-8 lines max** — thumbnails are viewed small. More than 8 lines becomes noise.
- **Show the "money line"** — the most distinctive part of the API. `new InkeepAgent({...})` is better than `import` statements.
- **Use JetBrains Mono Bold** (not Regular) — Bold weight is more readable at small sizes and matches the brand's label font treatment.
- **Slight rotation (2-3°)** and `shadow/brand` (blue glow) when used as a floating element in a split layout.
- **Don't try to highlight every token perfectly.** Keywords (blue), strings (golden), and comments (muted) cover 90% of the visual effect. The rest can stay default color.
- **The code doesn't need to compile.** It needs to LOOK like real code and signal the feature being launched. Simplified pseudocode is fine.

**Figma API reference:**
- `setRangeFills(start, end, fills: Paint[])` — sets fill color on character range
- `figma.util.solidPaint("#hex")` — convenience for creating SolidPaint from CSS hex
- `setRangeFontName(start, end, fontName)` — if mixing monospace + sans in same text node
- Range indices are 0-based, end is exclusive

### Pattern: Spotlight cutout (tutorial highlight)

Create tutorial/walkthrough images where the background is dimmed and the target UI element is highlighted with a spotlight effect. Used for SaaS product tutorials, UX walkthroughs, and "click here" documentation images.

**Technique:** A screenshot is placed as an image fill on a rectangle. A boolean subtract overlay (full-size dark rectangle minus a smaller cutout rectangle) sits on top, dimming everything except the target element. The cutout creates a "window" that reveals the original screenshot at full brightness.

**Getting the base screenshot:**
- **User-provided image** — simplest; user already has screenshots or pastes into Figma
- **Claude in Chrome** — capture authenticated pages the user is already logged into
- **`/browser` skill** — scripted Playwright capture when interaction is needed before capture (dismiss modals, click tabs, scroll to section)

**Step 1: Import screenshot as image fill**

```javascript
// Create the base rectangle with the screenshot as an image fill.
// If the screenshot is already in Figma (user pasted it), skip this step
// and use the existing node. If you have a local PNG file, read it and
// convert to base64, then set as image fill via figma_set_image_fill.
//
// Dimensions should match the screenshot's aspect ratio.
// Common sizes: 1101x735 (3:2), 1200x800 (3:2), 1440x900 (16:10)

const base = figma.createRectangle();
base.name = 'screenshot-base';
base.resize(IMG_WIDTH, IMG_HEIGHT);
base.cornerRadius = 20;
// Image fill is set via figma_set_image_fill tool with the screenshot
```

After importing, use `figma_set_image_fill` to apply the screenshot as the rectangle's fill. Screenshot and verify the image displays correctly before proceeding.

**Step 2: Create the spotlight overlay**

```javascript
// Parameters — adjust per target element
const IMG_WIDTH = 1101;   // match screenshot dimensions
const IMG_HEIGHT = 735;
const CORNER_RADIUS = 20; // outer card rounding
const OVERLAY_OPACITY = 0.5; // 0.5 = 50% dim (good default)

// Each highlight target: { x, y, width, height, cornerRadius, strokeWeight }
// Position is relative to the screenshot's top-left corner.
// Measure from the screenshot where the target element sits.
const highlights = [
  { x: 14, y: 142, width: 241, height: 42, cornerRadius: 14, strokeWeight: 2 }
];

// --- Build the overlay ---

const baseNode = await figma.getNodeByIdAsync('BASE_NODE_ID');
const parent = baseNode.parent;

// 1. Full-size dark rectangle (the mask)
const mask = figma.createRectangle();
mask.name = 'spotlight-mask';
mask.resize(IMG_WIDTH, IMG_HEIGHT);
mask.x = baseNode.x;
mask.y = baseNode.y;
mask.cornerRadius = CORNER_RADIUS;
mask.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];

// 2. Cutout rectangles (one per highlight target)
const cutouts = [];
for (let i = 0; i < highlights.length; i++) {
  const h = highlights[i];
  const cutout = figma.createRectangle();
  cutout.name = `spotlight-cutout-${i + 1}`;
  cutout.resize(h.width, h.height);
  cutout.x = baseNode.x + h.x;
  cutout.y = baseNode.y + h.y;
  cutout.cornerRadius = h.cornerRadius;
  cutout.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
  cutout.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  cutout.strokeWeight = h.strokeWeight;
  cutouts.push(cutout);
}

// 3. Boolean subtract: mask minus cutouts = overlay with holes
const allNodes = [mask, ...cutouts];
const boolOp = figma.union(allNodes, parent);
// Change from union to subtract
boolOp.booleanOperation = 'SUBTRACT';
boolOp.name = 'spotlight-overlay';
boolOp.opacity = OVERLAY_OPACITY;
boolOp.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];

return { overlayId: boolOp.id, highlights: highlights.length };
```

**Step 3 (optional): Add step number badges**

For multi-step tutorials, add numbered circles near each highlight:

```javascript
// Position each badge at the top-right corner of its cutout
const BADGE_SIZE = 28;
const BADGE_OFFSET = -8; // overlap the cutout edge slightly

for (let i = 0; i < highlights.length; i++) {
  const h = highlights[i];

  // Circle background
  const badge = figma.createEllipse();
  badge.name = `step-badge-${i + 1}`;
  badge.resize(BADGE_SIZE, BADGE_SIZE);
  badge.x = baseNode.x + h.x + h.width + BADGE_OFFSET;
  badge.y = baseNode.y + h.y + BADGE_OFFSET;
  badge.fills = [{ type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1.0 } }]; // brand blue #3784FF

  // Number text
  const label = figma.createText();
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  label.fontName = { family: 'Inter', style: 'Bold' };
  label.characters = String(i + 1);
  label.fontSize = 14;
  label.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  label.textAlignHorizontal = 'CENTER';
  label.textAlignVertical = 'CENTER';
  label.resize(BADGE_SIZE, BADGE_SIZE);
  label.x = badge.x;
  label.y = badge.y;
}
```

**Multi-step tutorial series:**

For tutorials with multiple steps, reuse the same base screenshot and create separate groups — one per step — each with a different cutout position:

```javascript
// Step 1: highlight sidebar "Triggers" nav item
const step1Highlights = [{ x: 14, y: 142, width: 241, height: 42, cornerRadius: 14, strokeWeight: 1 }];

// Step 2: highlight "Webhooks" tab
const step2Highlights = [{ x: 394, y: 191, width: 96, height: 33, cornerRadius: 14, strokeWeight: 2 }];

// Step 3: highlight two fields at once
const step3Highlights = [
  { x: 200, y: 300, width: 300, height: 40, cornerRadius: 8, strokeWeight: 2 },
  { x: 200, y: 360, width: 300, height: 40, cornerRadius: 8, strokeWeight: 2 }
];
```

Each step produces one exportable group (screenshot + overlay). Clone the base screenshot rectangle for each step — all share the same image fill (efficient, consistent).

**Configurable parameters:**

| Parameter | Default | Purpose |
|---|---|---|
| `OVERLAY_OPACITY` | 0.5 | Dim level — 0.5 is a good balance between de-emphasis and context visibility |
| `CORNER_RADIUS` | 20 | Outer card rounding — matches typical card/modal appearance |
| Cutout `cornerRadius` | 14 | Pill shape for cutout — matches modern UI element shapes (buttons, tabs, nav items) |
| Cutout `strokeWeight` | 1–2px | White border ring thickness around the highlighted element |
| Cutout `fills` color | `#D9D9D9` | Light gray — visible inside the boolean subtract. White stroke provides the visible ring. |
| Badge color | `#3784FF` | Brand blue for step number circles |

**Design guidance:**

| Concern | Guidance |
|---|---|
| **Cutout padding** | Add 4–8px padding around the target element on each side. Pixel-exact cutouts feel cramped and the white ring barely clears the element. Measure the element's bounds, then expand the cutout rectangle by the padding. |
| **Cutout corner radius** | Match the target element's own border radius when possible (a button with `border-radius: 8px` gets an 8px cutout). Default to 14px pill when the element's radius is unknown. |
| **Cropping vs full-page** | Prefer a **cropped but contextual** screenshot — show enough of the surrounding UI that the user knows where they are (sidebar + main content area) but don't include empty space or irrelevant panels. If the full-page screenshot is 1440x900, crop to the relevant ~1100x735 region. All images in a tutorial series must use the same crop region for visual consistency. |
| **Screenshot resolution** | Capture or import screenshots at **2x retina** resolution. In Figma, this means the image's native pixel dimensions should be 2× the rectangle size (e.g., 2202×1470 image in a 1101×735 rectangle). The analyzed example uses `scalingFactor: 0.5` to achieve this. |
| **Dark UI screenshots** | A black overlay on a dark-themed UI is nearly invisible. For dark UIs, use a **dark navy overlay** (`{ r: 0.05, g: 0.05, b: 0.15 }`) instead of pure black, or increase opacity to 0.6–0.7. Test by screenshotting — if the overlay is hard to see, adjust. |
| **Drop shadow** | Optional but recommended for docs/marketing pages with white backgrounds. Adds depth and grounds the card. Apply to the outer group: `{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.12 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' }` |
| **Consistent sizing across series** | All images in a tutorial series MUST use identical dimensions. Decide the crop region and size once (e.g., 1101×735) and clone that base for every step. Inconsistent sizing creates jarring visual rhythm in docs pages. |
| **Overlay opacity by context** | Light UIs: 0.5 (default). Dark UIs: 0.6–0.7. High-contrast need (single critical action): 0.6. Low-contrast (gentle guidance): 0.3–0.4. |

**When to use this pattern:**
- SaaS product tutorials ("click here to configure webhooks")
- Onboarding walkthroughs ("first, navigate to Settings")
- Documentation images for step-by-step guides
- Feature announcement graphics ("new: check out the Analytics tab")
- Any screenshot where you need to draw the viewer's eye to a specific UI element

**Export:** Set export settings on each step's group: `PNG` at `8x` scale for high-resolution documentation images, or `2x` for web use.

### Pattern: Element reorder (safe swap)

When the user asks to reorder elements within a container (flip rows, swap cards), follow this sequence:

1. **List all children** with IDs, names, and positions — never assume names match expectations
2. **Operate on verified IDs** from `getNodeByIdAsync`, not name-based `.find()` (names are mutable and may not match what you set earlier)
3. **Compute new positions** as simple coordinate swaps between the elements

```javascript
// Safe reorder: list first, then swap by ID
const parent = await figma.getNodeByIdAsync('PARENT_ID');
const children = parent.children.map(n => ({
  id: n.id, name: n.name, x: n.x, y: n.y
}));
// Now use the verified IDs to swap positions
```

### Pattern: Defensive node access

Before operating on a node by ID, **always verify** it exists and is the expected type. Wrong or stale node IDs are the #1 cause of `TypeError` and `cannot read property of undefined` in multi-step sessions.

```javascript
const node = await figma.getNodeByIdAsync('5025:518');
if (!node) {
  return { error: 'Node 5025:518 not found — listing parent children to find correct ID' };
}
if (node.type !== 'FRAME') {
  return { error: `Expected FRAME, got ${node.type} (${node.name})` };
}
// Safe to proceed
```

When referencing IDs from earlier operations across many turns, **list the parent's children first** to confirm IDs haven't shifted — especially after creating or deleting siblings.

## Troubleshooting

| Problem | Fix |
|---|---|
| Element looks wrong after creation | Screenshot → identify issue → fix the specific property → screenshot again |
| Connection lines don't connect | Get the x,y coordinates of both endpoints → recalculate line position → update |
| Font not loading | Prefer `figma_set_text` (handles font loading internally). If using `figma_execute`, check available fonts: `figma.listAvailableFontsAsync()` → use an available alternative. See Known Issues below for `loadFontAsync` timeout details. |
| Lost track of what's been built | Screenshot the working frame → compare against the build plan → identify gaps |
| Design looks incoherent after composition | Compare to composition plan → check if element sizes/positions match → adjust individual elements |
| Plugin not responding | Check `figma_get_status` → if disconnected, ask user to re-launch the Desktop Bridge plugin |
| Frame appears empty but nodes exist | Check `clipsContent` — it defaults to `true`, which hides anything positioned outside the frame bounds. Set `frame.clipsContent = false` to debug, then reposition elements within bounds before re-enabling. Consider building with clipping off during construction and enabling it at the end. |
| Screenshot shows old state after changes | You're likely using `figma_take_screenshot` (REST API, may cache). Switch to `figma_capture_screenshot` (plugin runtime, guaranteed current). See the screenshot tools table above. |

## Known Issues & Workarounds

### Font loading timeouts in `figma_execute`

`figma.loadFontAsync()` called inside `figma_execute` frequently times out, even after 10-15 seconds. This is a known reliability issue with the plugin bridge.

**Workaround:** Use `figma_set_text` instead of `figma_execute` for setting text content. `figma_set_text` handles font loading internally and is more reliable. Reserve `figma_execute` for text operations only when you need to set properties that `figma_set_text` does not support (e.g., `textAutoResize`, `paragraphSpacing`).

**Font verification pattern:** When you must use `figma_execute` for text, verify font availability before building text-heavy compositions. Not all weight variants exist in every file (e.g., `Inter SemiBold` may be unavailable even when `Inter Bold` works).

```javascript
// Verify fonts before building — fail fast, not mid-composition
const fontsNeeded = [
  { family: "Inter", style: "Bold" },
  { family: "Inter", style: "Regular" },
  { family: "Inter", style: "Medium" },
];
const loaded = [];
for (const font of fontsNeeded) {
  try {
    await figma.loadFontAsync(font);
    loaded.push(font);
  } catch {
    console.log(`Font unavailable: ${font.family} ${font.style}`);
  }
}
return loaded; // Check which loaded before proceeding
```

If a needed weight is unavailable, fall back to the nearest available weight (e.g., `Medium` → `Regular`, `SemiBold` → `Bold`).

### `figma_navigate` required before cross-file operations

When the active file changes (switching between files, or after the user navigates to a different file), you **must** call `figma_navigate` with the target file/page URL before `figma_execute` can access nodes in that file. Without this, `getNodeByIdAsync` returns `null` silently — no error is thrown, and operations fail without explanation.

**Pattern:** Always call `figma_navigate` before your first `figma_execute` in a file, and again whenever you suspect the active file may have changed.

### Always use async API variants in `figma_execute`

The plugin bridge runs in `documentAccess: dynamic-page` mode, which means **all synchronous node access APIs fail**. This is not just `getNodeById` — it affects multiple APIs:

```javascript
// All of these FAIL with documentAccess error:
figma.getNodeById('123:456');
node.vectorNetwork = { ... };
figma.currentPage = somePage;
instance.mainComponent;

// Use the async versions instead:
await figma.getNodeByIdAsync('123:456');
await node.setVectorNetworkAsync({ ... });
await figma.setCurrentPageAsync(somePage);
await instance.getMainComponentAsync();
```

**Rule:** If a Figma Plugin API method has an `Async` variant, always use it inside `figma_execute`.

### Batch-removing nodes throws "node does not exist"

When removing multiple nodes in a loop, removing a parent automatically removes all its children. If you then try to `.remove()` a child that was already removed via its parent, Figma throws `Error: The node with id "X" does not exist`.

**Workaround:** Wrap each `.remove()` in a try-catch, or collect only leaf nodes and remove bottom-up:

```javascript
// Safe batch removal
const toRemove = [...nodesToDelete]; // collect IDs first
for (const node of toRemove) {
  try {
    const n = await figma.getNodeByIdAsync(node.id);
    if (n) n.remove();
  } catch (e) {
    // Already removed (parent was deleted first) — safe to skip
  }
}
```

Also be careful with cleanup operations that remove by name prefix (e.g., all nodes starting with "Arrow —") — they can accidentally delete nodes you just created in the same operation.

### `findAll()` on large files crashes the plugin

`figma.root.findAll()` or `figma.root.findOne()` on files with many pages (50+) and thousands of nodes can crash the plugin bridge or hang indefinitely. The search traverses every node in the entire file — not just the current page.

**Workaround:** Always scope searches to a specific page or section by ID:

```javascript
// BAD — traverses entire file, crashes on large files:
const icon = figma.root.findOne(n => n.name === 'icon/search');

// GOOD — scoped to a known page:
const page = await figma.getNodeByIdAsync('5003:63');
const icon = page.findOne(n => n.name === 'icon/search');
```

If you need to search across pages, enumerate `figma.root.children` (the page list) and search each page individually.

### Page context drift after session breaks

After a session break (context compaction, conversation continuation, or long idle), `figma.currentPage` may point to an unexpected page — especially if multiple pages share the same name. `findOne()` and `findAll()` on `figma.currentPage` will silently search the wrong page and return `null`.

**Workaround:** At the start of any resumed session, verify page identity by node ID, not name:

```javascript
// Check where you actually are:
const current = figma.currentPage;
console.log(`Current page: "${current.name}" (${current.id})`);

// Navigate to the correct page by ID:
const target = await figma.getNodeByIdAsync('5003:63');
await figma.setCurrentPageAsync(target);
```

Also call `figma_navigate` with the target file/page URL after any session break, before your first `figma_execute`.

### Auto-layout silent no-ops

Several auto-layout operations are silently ignored — no error thrown, no warning, just nothing happens:

- **Writing x/y on auto-layout children is a no-op.** Children of auto-layout frames have positions computed automatically. Setting `child.x = 100` is silently discarded. INSTEAD: use `itemSpacing`, `paddingTop/Right/Bottom/Left`, and `layoutAlign` on the parent frame to control child positioning.
- **`resize()` on an auto-layout frame no-ops in AUTO-sized dimensions.** If `primaryAxisSizingMode` is `"AUTO"` (hug contents), calling `resize()` on that axis is ignored. INSTEAD: set `primaryAxisSizingMode = "FIXED"` first, then resize, or resize children to change the frame's auto-computed size.
- **Toggling `layoutMode` off/on does NOT restore original state.** Setting `layoutMode = "VERTICAL"` then `layoutMode = "NONE"` leaves children displaced. There is no undo.
- **Default 10px padding** is automatically applied when setting a frame to auto-layout. Always set explicit padding values immediately after enabling auto-layout.

### `figma.mixed` — text properties return a symbol, not a value

When a text node has multiple styles (e.g., mixed font sizes or weights), properties like `fontSize`, `fontName`, `fontWeight` return `figma.mixed` — a unique JavaScript `symbol`, not a number or string. Reading it as a number causes downstream logic failures.

**Workaround:** Always check before reading text properties:
```javascript
if (node.fontSize === figma.mixed) {
  // Use getRangeFontSize() for character-range-level access
} else {
  const size = node.fontSize; // safe to use as number
}
```

Note: `figma.mixed` applies to any property with mixed values, not just text (e.g., `cornerRadius` when corners differ).

### Node ID format: colons in API, hyphens in URLs

Figma URLs use hyphens (`?node-id=5-3`), the Plugin API and REST API use colons (`5:3`). Always convert when copying node IDs from URLs:

```javascript
const nodeId = urlNodeId.replace('-', ':'); // "5-3" → "5:3"
```

### `createNodeFromSvg` limitations

SVG import via `figma.createNodeFromSvg(svgString)` has known issues (confirmed via community reports):

- **Gradient strokes with `url(#...)` references** may fail with "failed to invert transform" errors
- **`<defs>` and `<use>` elements** are not reliably supported — inline all references before import
- **SVGs without explicit `viewBox`/`width`/`height`** import at tiny sizes — always include these attributes
- **Percentage-based gradient coordinates** (`x1="0%"`) may cause failures — use absolute values

INSTEAD of importing complex SVGs: screenshot the original for reference, then recreate a simplified version using basic Figma shapes and vector paths.

## Execution strategy

**Execute figma-console tool calls sequentially, not in parallel.** When multiple tool calls are batched in parallel and one fails, all sibling calls are cancelled. This is a Claude Code platform behavior — one failed `figma_execute` call can cascade and cancel 3-5 other valid operations. Run figma-console operations one at a time.

**Metadata queries can overflow.** `get_metadata` and `get_design_context` on complex files can produce responses exceeding the MCP result size limit (72K-232K characters). When this happens, the output is saved to a temp file. Prefer targeted node-level queries (specific node IDs) over full-file metadata dumps.

## Limitations

- Plugin must be running in the target file (manual step)
- Plugin disconnects on tab refresh (re-launch needed)
- Font must be available in Figma for text operations
- No headless/CI mode — requires Figma Desktop app open
- WebSocket ports 9223-9232 (localhost only)
