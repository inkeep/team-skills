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

### Pattern: Data grid / comparison table

Build structured data tables (comparison matrices, evaluation scorecards, decision frameworks) programmatically from data. This avoids building each cell manually.

```javascript
// Data grid builder — creates a branded comparison table from structured data
// Input: title, columns (headers), rows (arrays of cell values)

const data = {
  title: "Platform Comparison",
  columns: ["Capability", "Inkeep", "Competitor A", "Competitor B"],
  rows: [
    ["Knowledge base", "✓", "✓", "◐"],
    ["Slack integration", "✓", "✗", "✓"],
    ["Custom workflows", "✓", "◐", "✗"],
    ["SSO / SAML", "✓", "✓", "✗"],
  ]
};

const CELL_W = 200;
const CELL_H = 48;
const HEADER_H = 56;
const PAD = 24;
const tableW = data.columns.length * CELL_W;

// Root frame
const root = figma.createFrame();
root.name = data.title;
root.layoutMode = "VERTICAL";
root.primaryAxisSizingMode = "AUTO";
root.counterAxisSizingMode = "AUTO";
root.paddingTop = PAD; root.paddingBottom = PAD;
root.paddingLeft = PAD; root.paddingRight = PAD;
root.itemSpacing = 0;
root.cornerRadius = 16;
root.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

// Title
const titleText = figma.createText();
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
await figma.loadFontAsync({ family: "Inter", style: "Medium" });
titleText.fontName = { family: "Inter", style: "Bold" };
titleText.characters = data.title;
titleText.fontSize = 24;
titleText.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }];
root.appendChild(titleText);

// Spacer
const spacer = figma.createFrame();
spacer.resize(tableW, 16);
spacer.fills = [];
root.appendChild(spacer);

// Header row
const headerRow = figma.createFrame();
headerRow.name = "Header Row";
headerRow.layoutMode = "HORIZONTAL";
headerRow.primaryAxisSizingMode = "AUTO";
headerRow.counterAxisSizingMode = "FIXED";
headerRow.resize(tableW, HEADER_H);
headerRow.fills = [{ type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1.0 } }];
headerRow.cornerRadius = 8;
root.appendChild(headerRow);

for (const col of data.columns) {
  const cell = figma.createFrame();
  cell.layoutMode = "HORIZONTAL";
  cell.resize(CELL_W, HEADER_H);
  cell.primaryAxisAlignItems = "CENTER";
  cell.counterAxisAlignItems = "CENTER";
  cell.paddingLeft = 12; cell.paddingRight = 12;
  cell.fills = [];
  headerRow.appendChild(cell);

  const t = figma.createText();
  t.fontName = { family: "Inter", style: "Bold" };
  t.characters = col;
  t.fontSize = 14;
  t.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  cell.appendChild(t);
}

// Data rows
for (let i = 0; i < data.rows.length; i++) {
  const row = figma.createFrame();
  row.name = `Row ${i + 1}`;
  row.layoutMode = "HORIZONTAL";
  row.primaryAxisSizingMode = "AUTO";
  row.counterAxisSizingMode = "FIXED";
  row.resize(tableW, CELL_H);
  row.fills = i % 2 === 0
    ? [{ type: 'SOLID', color: { r: 0.969, g: 0.965, b: 0.957 } }]
    : [];
  root.appendChild(row);

  for (const val of data.rows[i]) {
    const cell = figma.createFrame();
    cell.layoutMode = "HORIZONTAL";
    cell.resize(CELL_W, CELL_H);
    cell.primaryAxisAlignItems = "CENTER";
    cell.counterAxisAlignItems = "CENTER";
    cell.paddingLeft = 12; cell.paddingRight = 12;
    cell.fills = [];
    row.appendChild(cell);

    const t = figma.createText();
    t.fontName = { family: "Inter", style: "Regular" };
    t.characters = val;
    t.fontSize = 14;
    // Color-code check/cross marks
    if (val === "✓") t.fills = [{ type: 'SOLID', color: { r: 0.18, g: 0.71, b: 0.49 } }];
    else if (val === "✗") t.fills = [{ type: 'SOLID', color: { r: 0.88, g: 0.12, b: 0.35 } }];
    else if (val === "◐") t.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.70, b: 0.18 } }];
    else t.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }];
    cell.appendChild(t);
  }
}

return { id: root.id, name: root.name };
```

**When to use this pattern:**
- Comparison tables (product vs competitor, feature matrices)
- Evaluation scorecards (criteria × options with ratings)
- Decision frameworks (criteria, what to look for, why it matters)
- Pricing tables (plan names × features)

**Customization points:**
- `CELL_W` / `CELL_H` — adjust for content density
- Header fill color — use brand primary (#3784FF) or adapt to context
- Alternating row colors — brand surface (#F7F4ED) for zebra striping
- Status icons — ✓ (green), ✗ (red), ◐ (yellow) for at-a-glance ratings
- The data object can be constructed from any structured input the user provides

**Advantages over AI-generated table images:**
- Fully editable in Figma (designers can adjust after creation)
- Exact brand fonts and colors (not approximated by AI)
- Scales to any number of rows/columns
- Text remains as text (searchable, accessible, crisp at any zoom)

### Pattern: Pie / donut chart (arcData)

Build pie or donut charts using native Figma ellipses with `arcData`. Each slice is a separate ellipse overlaid at the same position.

```javascript
const data = [
  { label: "Support", value: 40, color: { r: 0.22, g: 0.52, b: 1 } },
  { label: "Sales", value: 30, color: { r: 0.18, g: 0.71, b: 0.49 } },
  { label: "Engineering", value: 20, color: { r: 0.98, g: 0.70, b: 0.18 } },
  { label: "Other", value: 10, color: { r: 0.88, g: 0.12, b: 0.35 } },
];

const total = data.reduce((sum, d) => sum + d.value, 0);
let currentAngle = -Math.PI / 2; // start at 12 o'clock (0 = 3 o'clock)
const size = 200;

const chartFrame = figma.createFrame();
chartFrame.name = "Donut Chart";
chartFrame.resize(size + 40, size + 40);
chartFrame.fills = [];

for (const d of data) {
  const sliceAngle = (d.value / total) * 2 * Math.PI;
  const ellipse = figma.createEllipse();
  ellipse.resize(size, size);
  ellipse.x = 20;
  ellipse.y = 20;
  ellipse.arcData = {
    startingAngle: currentAngle,
    endingAngle: currentAngle + sliceAngle,
    innerRadius: 0.6, // 0 = pie, 0.5-0.8 = donut
  };
  ellipse.fills = [{ type: 'SOLID', color: d.color }];
  ellipse.name = d.label;
  chartFrame.appendChild(ellipse);
  currentAngle += sliceAngle;
}
```

**Key details:**
- `arcData` uses **radians**. 0 = 3 o'clock position, clockwise. Start at `-Math.PI/2` for 12 o'clock.
- `innerRadius`: 0 = full pie chart, 0.5-0.8 = donut chart
- Each slice is a separate ellipse — fully editable, independently colorable
- Add labels as separate TextNodes positioned outside the chart (not inside the ellipse)

**When to use:** Part-of-whole visualizations. For B2B marketing, donut charts (innerRadius 0.6) are more effective than pie charts at social media sizes. But bar charts are generally more effective than either — use donut only when the "part of whole" framing is the point.

---

### Pattern: Line chart (vectorPaths)

Build line charts from data arrays using SVG path syntax in vectorPaths.

```javascript
const data = [10, 45, 28, 72, 55, 90, 38];
const width = 400;
const height = 200;
const maxVal = Math.max(...data);
const padding = 20;

// Create chart container
const chartFrame = figma.createFrame();
chartFrame.name = "Line Chart";
chartFrame.resize(width + padding * 2, height + padding * 2);
chartFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

// Calculate points
const points = data.map((v, i) => ({
  x: padding + (i / (data.length - 1)) * width,
  y: padding + height - (v / maxVal) * height,
}));

// Build SVG path string
const pathData = points
  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
  .join(' ');

// Line
const line = figma.createVector();
line.name = "Trend Line";
line.vectorPaths = [{ windingRule: "NONE", data: pathData }];
line.strokes = [{ type: 'SOLID', color: { r: 0.22, g: 0.52, b: 1 } }];
line.strokeWeight = 2.5;
line.strokeCap = 'ROUND';
line.strokeJoin = 'ROUND';
line.fills = [];
chartFrame.appendChild(line);

// Area fill (optional — close path to bottom)
const areaPath = pathData
  + ` L ${(padding + width).toFixed(1)} ${(padding + height).toFixed(1)}`
  + ` L ${padding} ${(padding + height).toFixed(1)} Z`;
const area = figma.createVector();
area.name = "Area Fill";
area.vectorPaths = [{ windingRule: "NONZERO", data: areaPath }];
area.fills = [{ type: 'SOLID', color: { r: 0.22, g: 0.52, b: 1 } }];
area.opacity = 0.1;
area.strokes = [];
chartFrame.insertChild(0, area); // behind the line

// Data point dots
for (const p of points) {
  const dot = figma.createEllipse();
  dot.resize(6, 6);
  dot.x = p.x - 3;
  dot.y = p.y - 3;
  dot.fills = [{ type: 'SOLID', color: { r: 0.22, g: 0.52, b: 1 } }];
  chartFrame.appendChild(dot);
}
```

**Variants:**
- **Sparkline** (minimal, no axes): same pattern but smaller frame (e.g., 120×40), no dots, no labels — just the line
- **Area chart**: include the area fill path (close to bottom corners + fill with low opacity)
- **Multi-line**: create multiple vectors with different stroke colors, one per data series
- **Smooth curves**: use `C` (cubic bezier) commands in the path string instead of `L` (straight lines) — apply Catmull-Rom to Bezier interpolation for natural-looking curves

**When to use:** Trends over time. Keep to 1-2 lines max for social media graphics. For B2B marketing, a "big number" callout with a small sparkline underneath is the highest-performing combination.

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
