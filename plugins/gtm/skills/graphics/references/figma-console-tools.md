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

The Figma Desktop Bridge plugin must be running in the target Figma file:

1. Figma Desktop app must be open (not browser Figma)
2. The Desktop Bridge plugin must be imported from the figma-console-mcp repo's `figma-desktop-bridge/manifest.json`
3. Run the plugin in the file you want to work with
4. Verify connection: call `figma_get_status`

If the plugin disconnects (e.g., after tab refresh), it must be re-launched manually.

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

### Pattern: Hero graphic with text overlay

1. Create background frame at target dimensions
2. Apply gradient or solid fill
3. Add logo element
4. Add heading text (large, brand font)
5. Add supporting text (smaller, secondary color)
6. Add decorative elements (shapes, icons)

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

## Execution strategy

**Execute figma-console tool calls sequentially, not in parallel.** When multiple tool calls are batched in parallel and one fails, all sibling calls are cancelled. This is a Claude Code platform behavior — one failed `figma_execute` call can cascade and cancel 3-5 other valid operations. Run figma-console operations one at a time.

**Metadata queries can overflow.** `get_metadata` and `get_design_context` on complex files can produce responses exceeding the MCP result size limit (72K-232K characters). When this happens, the output is saved to a temp file. Prefer targeted node-level queries (specific node IDs) over full-file metadata dumps.

## Limitations

- Plugin must be running in the target file (manual step)
- Plugin disconnects on tab refresh (re-launch needed)
- Font must be available in Figma for text operations
- No headless/CI mode — requires Figma Desktop app open
- WebSocket ports 9223-9232 (localhost only)
