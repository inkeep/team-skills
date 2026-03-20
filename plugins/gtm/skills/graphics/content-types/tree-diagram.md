Use when: Creating graphics that contain org charts, decision trees, taxonomy diagrams, feature hierarchies, product architecture trees, or any hierarchical node-link structure
Priority: P0
Impact: Without the layout algorithm, trees have unbalanced spacing, off-center parents, and inconsistent level heights — these failures occur 100% of the time for trees with more than 3 nodes

---

# Tree and Hierarchy Diagrams

Tree layouts require a positioning algorithm. An AI agent cannot correctly position tree nodes ad hoc — the bottom-up subtree width computation and parent-centering pass require recursive traversal that must be computed, not estimated.

The architecture: compute positions with the layout algorithm → create Figma frames at those positions → draw connectors last. Individual nodes use auto-layout internally for their content; the tree structure uses absolute positioning.

For connectors between tree nodes, use the **bus connector** pattern in `tools/figma-console.md`. For other connector styles (curved, elbowed), see the existing connector recipes in that file.

---

## Layout algorithm (Walker-based)

This algorithm guarantees three properties:
1. **Level alignment** — all nodes at the same depth share the same y-coordinate
2. **Parent centering** — every parent is centered horizontally over its children
3. **Isomorphic consistency** — identical subtrees render identically regardless of position

Handles variable node sizes (common in marketing graphics where root nodes are larger than leaf nodes).

```javascript
function computeTreeLayout(rootData, config = {}) {
  const {
    siblingGap = 40,         // horizontal gap between sibling nodes
    subtreeGap = 60,         // horizontal gap between subtrees
    levelGap = 80,           // vertical gap between levels
    defaultNodeWidth = 160,
    defaultNodeHeight = 56,
    orientation = 'top-down', // 'top-down' | 'left-to-right' | 'radial'
    canvasWidth = 1200,
    canvasHeight = 800,
    padding = 40,
  } = config;

  // ── Build internal tree ────────────────────────────────────
  let nextId = 0;
  function buildNode(data, depth, parent) {
    const node = {
      id: nextId++,
      label: data.label,
      data: data,
      width: data.width || defaultNodeWidth,
      height: data.height || defaultNodeHeight,
      depth, parent,
      children: [],
      prelim: 0, modifier: 0,
      x: 0, y: 0,
    };
    if (data.children) {
      node.children = data.children.map(c => buildNode(c, depth + 1, node));
    }
    return node;
  }
  const root = buildNode(rootData, 0, null);

  // ── Compute level heights (all nodes at same depth share y) ─
  const levelHeights = {};
  function computeLevelHeights(node) {
    levelHeights[node.depth] = Math.max(levelHeights[node.depth] || 0, node.height);
    node.children.forEach(computeLevelHeights);
  }
  computeLevelHeights(root);

  const levelY = {};
  let cumulativeY = 0;
  const maxDepth = Math.max(...Object.keys(levelHeights).map(Number));
  for (let d = 0; d <= maxDepth; d++) {
    levelY[d] = cumulativeY;
    cumulativeY += (levelHeights[d] || 0) + levelGap;
  }

  // ── FirstWalk (postorder — leaves to root) ─────────────────
  function getLeftSibling(node) {
    if (!node.parent) return null;
    const idx = node.parent.children.indexOf(node);
    return idx > 0 ? node.parent.children[idx - 1] : null;
  }

  function getRightContour(node, modSum = 0, contour = []) {
    const level = node.depth - (root.depth);
    const pos = node.prelim + modSum + node.width;
    if (contour.length <= level) contour.push(pos);
    else contour[level] = Math.max(contour[level], pos);
    node.children.forEach(c => getRightContour(c, modSum + node.modifier, contour));
    return contour;
  }

  function getLeftContour(node, modSum = 0, contour = []) {
    const level = node.depth - (root.depth);
    const pos = node.prelim + modSum;
    if (contour.length <= level) contour.push(pos);
    else contour[level] = Math.min(contour[level], pos);
    node.children.forEach(c => getLeftContour(c, modSum + node.modifier, contour));
    return contour;
  }

  function separateSubtrees(node) {
    for (let i = 1; i < node.children.length; i++) {
      const leftTree = node.children[i - 1];
      const rightTree = node.children[i];
      const leftContour = getRightContour(leftTree);
      const rightContour = getLeftContour(rightTree);
      const minLen = Math.min(leftContour.length, rightContour.length);
      let maxShift = 0;
      for (let level = 0; level < minLen; level++) {
        const gap = rightContour[level] - leftContour[level];
        if (gap < subtreeGap) maxShift = Math.max(maxShift, subtreeGap - gap);
      }
      if (maxShift > 0) {
        rightTree.prelim += maxShift;
        rightTree.modifier += maxShift;
      }
    }
  }

  function firstWalk(node) {
    if (node.children.length === 0) {
      const left = getLeftSibling(node);
      node.prelim = left ? left.prelim + left.width + siblingGap : 0;
    } else {
      node.children.forEach(firstWalk);
      const midpoint = (
        node.children[0].prelim +
        node.children[node.children.length - 1].prelim +
        node.children[node.children.length - 1].width
      ) / 2 - node.width / 2;
      const left = getLeftSibling(node);
      if (left) {
        node.prelim = left.prelim + left.width + subtreeGap;
        node.modifier = node.prelim - midpoint;
        separateSubtrees(node);
      } else {
        node.prelim = midpoint;
      }
    }
  }

  // ── SecondWalk (preorder — root to leaves) ─────────────────
  function secondWalk(node, modSum = 0) {
    node.x = node.prelim + modSum;
    node.y = levelY[node.depth];
    node.children.forEach(c => secondWalk(c, modSum + node.modifier));
  }

  // ── Execute ────────────────────────────────────────────────
  firstWalk(root);
  secondWalk(root);

  // ── Normalize (shift so min x = padding) ───────────────────
  let minX = Infinity;
  function findMinX(node) { minX = Math.min(minX, node.x); node.children.forEach(findMinX); }
  findMinX(root);
  function applyOffset(node) { node.x += padding - minX; node.y += padding; node.children.forEach(applyOffset); }
  applyOffset(root);

  // ── Orientation transform ──────────────────────────────────
  if (orientation === 'left-to-right') {
    function swapXY(node) {
      [node.x, node.y] = [node.y, node.x];
      [node.width, node.height] = [node.height, node.width];
      node.children.forEach(swapXY);
    }
    swapXY(root);
  } else if (orientation === 'radial') {
    let maxX = 0;
    function findMaxX(node) { maxX = Math.max(maxX, node.x + node.width); node.children.forEach(findMaxX); }
    findMaxX(root);
    const cx = canvasWidth / 2, cy = canvasHeight / 2;
    const maxRadius = Math.min(canvasWidth, canvasHeight) / 2 - padding - 60;
    function toRadial(node) {
      if (node.depth === 0) {
        node.x = cx - node.width / 2;
        node.y = cy - node.height / 2;
      } else {
        const angle = ((node.x - padding) / (maxX - padding)) * 2 * Math.PI - Math.PI / 2;
        const radius = (node.depth / maxDepth) * maxRadius;
        node.x = cx + radius * Math.cos(angle) - node.width / 2;
        node.y = cy + radius * Math.sin(angle) - node.height / 2;
      }
      node.children.forEach(toRadial);
    }
    toRadial(root);
  }

  // ── Collect flat lists for rendering ───────────────────────
  const nodes = [], edges = [];
  function collect(node) {
    nodes.push({ id: node.id, label: node.label, x: node.x, y: node.y,
      width: node.width, height: node.height, depth: node.depth, data: node.data });
    for (const child of node.children) {
      edges.push({
        from: { id: node.id, x: node.x, y: node.y, width: node.width, height: node.height },
        to: { id: child.id, x: child.x, y: child.y, width: child.width, height: child.height },
      });
      collect(child);
    }
  }
  collect(root);
  return { nodes, edges, root };
}
```

---

## Orientation selection

| Orientation | When to use | Connector style |
|---|---|---|
| **Top-down** (default) | Org charts, product architecture, feature hierarchies — "this contains these" | Elbowed bus connector |
| **Left-to-right** | Decision trees, process flows — sequential reading order | Elbowed horizontal-first |
| **Radial** | Ecosystem maps, taxonomy overviews — all branches equal weight, center is hero | Curved bezier arcs |
| **Indented** | File structures, nested configs — list format more important than spatial layout | L-shaped tree lines |

The algorithm computes positions in top-down orientation. Other orientations apply a coordinate transform at the end (see the algorithm's orientation transform section).

---

## Node styling (depth-based visual weight)

Visual weight should decrease with depth. This creates a natural reading hierarchy.

```javascript
function depthScale(depth) {
  return Math.max(0.5, 1.0 - (depth * 0.17));
}

// Usage:
const nodeWidth = Math.round(baseWidth * depthScale(depth));
const nodeHeight = Math.round(baseHeight * depthScale(depth));
const fontSize = Math.max(12, Math.round(baseFontSize * depthScale(depth)));
const borderWeight = Math.max(1, baseBorder * depthScale(depth));
```

With `baseWidth=240, baseHeight=80, baseFontSize=20, baseBorder=3`:

| Depth | Scale | Width | Height | Font | Border |
|---|---|---|---|---|---|
| 0 (Root) | 1.0 | 240 | 80 | 20px Bold | 3px |
| 1 | 0.83 | 200 | 66 | 17px SemiBold | 2.5px |
| 2 | 0.66 | 158 | 53 | 14px Regular | 2px |
| 3+ | 0.5 | 120 | 40 | 12px Regular | 1.5px |

---

## Capacity limits

Width is the binding constraint — branching multiplies horizontally.

| Canvas | Max depth | Max total nodes | Max leaf count |
|---|---|---|---|
| 1080×1080 (social square) | 3 | 12-15 | 6 at 160px |
| 1200×630 (blog cover) | 3-4 | 15-20 | 7 at 140px |
| 1920×1080 (slide) | 4 | 20-30 | 10 at 160px |

### Pre-render validation

Run before creating any Figma nodes:

```javascript
function validateTreeForCanvas(treeData, config) {
  const { nodes } = computeTreeLayout(treeData, config);
  const maxX = Math.max(...nodes.map(n => n.x + n.width));
  const maxY = Math.max(...nodes.map(n => n.y + n.height));
  const warnings = [];
  if (maxX > config.canvasWidth - config.padding)
    warnings.push(`Tree width (${Math.round(maxX)}px) exceeds canvas. Reduce nodes or use radial.`);
  if (maxY > config.canvasHeight - config.padding)
    warnings.push(`Tree height (${Math.round(maxY)}px) exceeds canvas. Reduce depth.`);
  if (nodes.length > 30)
    warnings.push(`${nodes.length} nodes — consider truncating for readability.`);
  return { valid: warnings.length === 0, warnings };
}
```

### Truncation strategies

1. **Depth truncation** — cap at N levels, show "+X deeper" on cut branches
2. **Breadth truncation** — cap at M children per parent, show "+X more" as a sibling
3. **Selective expansion** — full depth for one "hero" branch, collapse others
4. **Summary leaves** — replace detail with counts ("12 integrations")

---

## Rendering in Figma

```javascript
// ── After computing layout ───────────────────────────────────
const { nodes, edges } = computeTreeLayout(treeData, {
  siblingGap: 30, subtreeGap: 50, levelGap: 70,
  orientation: 'top-down', canvasWidth: 1200, canvasHeight: 800, padding: 40,
});

// ── Create outer frame (NO auto-layout — absolute positioning) ─
const outerFrame = figma.createFrame();
outerFrame.name = "Tree Diagram";
outerFrame.resize(1200, 800);
// outerFrame must NOT have layoutMode set — children need absolute positioning

await figma.loadFontAsync({ family: "Inter", style: "Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

// ── Create node cards ────────────────────────────────────────
const nodeFrames = {};
for (const node of nodes) {
  const card = figma.createFrame();
  card.name = node.label;
  card.layoutMode = "VERTICAL";
  card.primaryAxisAlignItems = "CENTER";
  card.counterAxisAlignItems = "CENTER";
  card.primaryAxisSizingMode = "FIXED";
  card.counterAxisSizingMode = "FIXED";
  card.resize(node.width, node.height);
  card.paddingTop = 12; card.paddingBottom = 12;
  card.paddingLeft = 16; card.paddingRight = 16;
  card.cornerRadius = node.depth === 0 ? 16 : 12;
  card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  card.strokes = [{ type: 'SOLID', color: node.depth < 2
    ? { r: 0.216, g: 0.518, b: 1.0 }   // brand primary for root/L1
    : { r: 0.7, g: 0.7, b: 0.7 }       // gray for deeper levels
  }];
  card.strokeWeight = Math.max(1, 3 * depthScale(node.depth));
  card.strokeAlign = 'INSIDE';
  card.effects = node.depth < 2 ? [{
    type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.06 },
    offset: { x: 0, y: 2 }, radius: 8, spread: 0,
    visible: true, blendMode: "NORMAL"
  }] : [];

  const text = figma.createText();
  text.fontName = node.depth === 0
    ? { family: "Inter", style: "Bold" }
    : { family: "Inter", style: "Regular" };
  text.characters = node.label;
  text.fontSize = Math.max(12, Math.round(16 * depthScale(node.depth)));
  text.textAlignHorizontal = "CENTER";
  card.appendChild(text);

  outerFrame.appendChild(card);
  card.x = node.x;
  card.y = node.y;
  nodeFrames[node.id] = card;
}

// ── Draw connectors LAST (z-ordering) ────────────────────────
// Use the bus connector pattern from tools/figma-console.md
// for each parent→children group
```

**Critical Figma API caveats:**
- `node.vectorNetwork = {...}` silently fails in plugin bridge mode — always use `await node.setVectorNetworkAsync({...})`
- `frame.x`/`frame.y` are no-ops for children of auto-layout parents — the outer frame must NOT have `layoutMode` set
- Font loading must happen before any text creation
- Set `clipsContent = false` during construction, `true` after final verification

---

## AI failure modes

| Failure | Cause | Prevention |
|---|---|---|
| **Unbalanced spacing** | Children placed sequentially from parent's left edge | The algorithm's bottom-up subtree width computation prevents this structurally |
| **Parents off-center** | Parent x set before children are positioned | The algorithm's centering pass (midpoint of children) prevents this structurally |
| **Inconsistent level heights** | Each node's y computed independently | Pre-computed `levelY[]` array shared by all nodes at same depth prevents this structurally |
| **Connector overlaps nodes** | Straight-line connectors between non-adjacent levels | Use bus connector pattern (vertical stem → horizontal bus → vertical drops) |
| **Too many nodes** | No capacity check before building | Pre-render validation catches this |
| **Leaf level misalignment** | Unbalanced branches end at different depths | Optional: extend connectors from shallow leaves to max depth level |

The first three failures are structurally prevented by using the algorithm. The remaining three require supplementary checks.
