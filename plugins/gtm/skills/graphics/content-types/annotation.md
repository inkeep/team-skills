Use when: Creating annotated screenshots, "how it works" callout diagrams, feature callout graphics, step-by-step walkthroughs with numbered callouts, or any graphic that labels/highlights specific regions of a visual
Priority: P0
Impact: Without collision avoidance, badges land on top of content. Without crossing elimination, leader lines cross each other. Without the placement algorithm, annotation quality is unreliable.

---

# Annotation Systems

Annotation placement is formally NP-hard (the Point-Feature Label Placement problem). AI models cannot reliably generate correct placements in a single pass. The correct architecture is two-stage: generate initial placements, then run algorithmic correction (collision detection, position fallback, line uncrossing).

The existing **spotlight cutout** pattern in `tools/figma-console.md` handles one narrow case (dimmed overlay with highlighted target). This file covers the general annotation system: numbered callouts, leader lines, zoom insets, bracket annotations, and the complete placement engine.

---

## Pattern taxonomy (7 patterns)

Use one grammar per graphic. Mixing patterns degrades comprehension.

| Pattern | Structure | Best for | Max per graphic |
|---|---|---|---|
| **Numbered callouts** | Circle badge + leader line + optional label | Multi-feature screenshots | 3-8 |
| **Annotation cards** | Rounded rect card + arrow to target | Feature descriptions | 3-5 |
| **Bracket annotations** | Brace spanning range + midpoint label | Grouping ranges (tiers, phases) | 1-3 |
| **Zoom insets** | Source indicator + magnified frame + connector | Details too small at full scale | 1-3 |
| **Tooltip callouts** | Small container + directional tail/pointer | Single-point annotations mimicking UI | 2-4 |
| **Hotspot indicators** | Dot + concentric rings (no line) | Overview diagrams, entry points | 3-6 |
| **Step walkthroughs** | Sequential numbered badges + flow arrows | Process docs, onboarding | 3-6 steps |

### Sizing conventions

| Component | Value |
|---|---|
| Badge diameter | 20-28px |
| Badge numeral | 11-13px Bold |
| Leader line weight | 1-1.5px |
| Badge-to-element gap | 8-16px |
| Callout card width | 120-200px |
| Callout card font | 11-13px |
| Canvas safe margin | 32-48px |

### Key constraint: 3-5 annotations maximum per graphic

Top B2B SaaS companies (Stripe, Linear, Notion, Figma, Datadog) consistently limit annotations. More than 5 produces visual clutter. If you need more, use a progressive reveal (multi-panel sequence showing one annotation per panel).

---

## Badge construction

```javascript
async function createBadge(label, x, y, style = {}) {
  const {
    diameter = 24,
    fillColor = { r: 0.18, g: 0.44, b: 1 },
    textColor = { r: 1, g: 1, b: 1 },
    fontSize = 13,
    fontFamily = 'Inter',
    fontStyle = 'Bold',
    strokeColor = null,
    strokeWeight = 2,
  } = style;

  await figma.loadFontAsync({ family: fontFamily, style: fontStyle });

  const frame = figma.createFrame();
  frame.name = `Badge/${label}`;
  frame.resize(diameter, diameter);
  frame.cornerRadius = diameter / 2;
  frame.layoutMode = 'HORIZONTAL';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.layoutSizingHorizontal = 'FIXED';
  frame.layoutSizingVertical = 'FIXED';
  frame.fills = [{ type: 'SOLID', color: fillColor }];

  if (strokeColor) {
    frame.strokes = [{ type: 'SOLID', color: strokeColor }];
    frame.strokeWeight = strokeWeight;
    frame.strokeAlign = 'OUTSIDE';
  }

  const text = figma.createText();
  text.fontName = { family: fontFamily, style: fontStyle };
  text.fontSize = fontSize;
  text.characters = label;
  text.fills = [{ type: 'SOLID', color: textColor }];
  text.textAlignHorizontal = 'CENTER';
  frame.appendChild(text);

  frame.x = x;
  frame.y = y;
  return frame;
}
```

---

## Leader line routing

### Line type selection

| Type | When to use | Code pattern |
|---|---|---|
| **Straight** | Sparse layout, path unobstructed | `vectorNetwork` with 2 vertices, no tangents |
| **Curved (bezier)** | Near-parallel labels, editorial softness | `vectorNetwork` with perpendicular tangents |
| **Elbowed** | Dense/grid-aligned layouts, "redline" aesthetic | `vectorNetwork` with 3 vertices + cornerRadius |

Engineering convention: leader lines at **30°, 45°, or 60°** angles — never horizontal or vertical (avoids confusion with dimension lines and content outlines).

### Straight leader line

```javascript
async function createLeaderLine(x1, y1, x2, y2, options = {}) {
  const {
    strokeWeight = 1.5,
    color = { r: 0.18, g: 0.44, b: 1 },
    endCap = 'ARROW_EQUILATERAL',
    dashed = false,
  } = options;

  const minX = Math.min(x1, x2), minY = Math.min(y1, y2);
  const vector = figma.createVector();

  await vector.setVectorNetworkAsync({
    vertices: [
      { x: x1 - minX, y: y1 - minY, strokeCap: 'NONE' },
      { x: x2 - minX, y: y2 - minY, strokeCap: endCap },
    ],
    segments: [{ start: 0, end: 1 }],
    regions: [],
  });

  vector.x = minX;
  vector.y = minY;
  vector.strokes = [{ type: 'SOLID', color }];
  vector.strokeWeight = strokeWeight;
  if (dashed) vector.dashPattern = [8, 4];
  vector.name = 'Leader Line';
  return vector;
}
```

### Attachment points

- **Circular badges:** tangent point = `center + radius × normalize(target - center)`, plus 2-4px clearance gap
- **Rectangular cards:** nearest edge midpoint
- **Targets:** nearest point on bounding box = `clamp(badgeCenter, targetBBox)` per axis

---

## Collision avoidance (Imhof 8-position model)

Place badges at the first non-colliding position in priority order. This is the standard algorithm for cartographic label placement.

Priority order (relative to target):
1. top-right (highest)
2. top-left
3. bottom-right
4. bottom-left
5. right
6. top
7. left
8. bottom (lowest)

```javascript
function rectsOverlap(a, b, margin = 0) {
  return a.x - margin < b.x + b.w && a.x + a.w + margin > b.x &&
         a.y - margin < b.y + b.h && a.y + a.h + margin > b.y;
}

function candidatePositions(target, badgeW, badgeH, gap = 12) {
  const { x, y, w, h } = target;
  return [
    { dir: 'top-right',    x: x + w + gap,          y: y - gap - badgeH },
    { dir: 'top-left',     x: x - gap - badgeW,     y: y - gap - badgeH },
    { dir: 'bottom-right', x: x + w + gap,          y: y + h + gap },
    { dir: 'bottom-left',  x: x - gap - badgeW,     y: y + h + gap },
    { dir: 'right',        x: x + w + gap,          y: y + h/2 - badgeH/2 },
    { dir: 'top',          x: x + w/2 - badgeW/2,   y: y - gap - badgeH },
    { dir: 'left',         x: x - gap - badgeW,     y: y + h/2 - badgeH/2 },
    { dir: 'bottom',       x: x + w/2 - badgeW/2,   y: y + h + gap },
  ];
}

function findNonCollidingPosition(target, badgeW, badgeH, occupied, gap = 12) {
  const candidates = candidatePositions(target, badgeW, badgeH, gap);
  for (const c of candidates) {
    const proposed = { x: c.x, y: c.y, w: badgeW, h: badgeH };
    if (!occupied.some(r => rectsOverlap(proposed, r, 4))) return c;
  }
  // Fallback: top-right with increased gap
  return candidates[0];
}
```

---

## Crossing elimination (greedy endpoint swap)

After all badges are placed, check for crossing leader lines and swap endpoints to eliminate them. This algorithm always terminates because swapping always reduces total line length.

```javascript
function segmentsIntersect(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  const d = (bx2-bx1)*(ay1-ay2) - (ax1-ax2)*(by2-by1);
  if (Math.abs(d) < 1e-10) return false;
  const t = ((by1-ay1)*(ax1-ax2) - (ax1-bx1)*(ay1-ay2)) / d;
  const u = ((bx2-bx1)*(by1-ay1) - (by2-by1)*(ax1-bx1)) / d;
  return t > 0 && t < 1 && u > 0 && u < 1;
}

function eliminateCrossings(lines) {
  // lines: [{ badgeX, badgeY, targetX, targetY }, ...]
  const result = lines.map(l => ({ ...l }));
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (segmentsIntersect(
          result[i].badgeX, result[i].badgeY, result[i].targetX, result[i].targetY,
          result[j].badgeX, result[j].badgeY, result[j].targetX, result[j].targetY
        )) {
          // Swap target endpoints
          [result[i].targetX, result[j].targetX] = [result[j].targetX, result[i].targetX];
          [result[i].targetY, result[j].targetY] = [result[j].targetY, result[i].targetY];
          changed = true;
        }
      }
    }
  }
  return result;
}
```

---

## Zoom-inset pipeline

Four-part anatomy: source region indicator → magnified inset frame → connecting lines → optional label.

```javascript
async function createZoomInset(sourceNode, placementX, placementY, options = {}) {
  const {
    magnification = 2,
    borderColor = { r: 0.18, g: 0.44, b: 1 },
    borderWeight = 2,
  } = options;

  // 1. Export source at magnification scale
  const bytes = await sourceNode.exportAsync({
    format: 'PNG',
    constraint: { type: 'SCALE', value: magnification },
  });
  const image = figma.createImage(bytes);

  // 2. Create inset frame
  const bb = sourceNode.absoluteBoundingBox;
  const insetFrame = figma.createFrame();
  insetFrame.name = 'Zoom Inset';
  insetFrame.resize(bb.width, bb.height);
  insetFrame.x = placementX;
  insetFrame.y = placementY;
  insetFrame.clipsContent = true;
  insetFrame.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
  insetFrame.strokes = [{ type: 'SOLID', color: borderColor }];
  insetFrame.strokeWeight = borderWeight;
  insetFrame.strokeAlign = 'OUTSIDE';
  insetFrame.cornerRadius = 8;
  insetFrame.effects = [{
    type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.25 },
    offset: { x: 0, y: 4 }, radius: 12, spread: 0,
    visible: true, blendMode: 'NORMAL',
  }];

  // 3. Source region indicator (dashed rect)
  const indicator = figma.createRectangle();
  indicator.x = bb.x; indicator.y = bb.y;
  indicator.resize(bb.width, bb.height);
  indicator.fills = [{ type: 'SOLID', color: borderColor, opacity: 0.1 }];
  indicator.strokes = [{ type: 'SOLID', color: borderColor }];
  indicator.strokeWeight = borderWeight;
  indicator.dashPattern = [6, 4];
  indicator.name = 'Source Region';

  // 4. Connecting lines (tapered — two corner-to-corner lines)
  const line1 = await createLeaderLine(
    bb.x, bb.y, placementX, placementY,
    { strokeWeight: 1, color: borderColor, endCap: 'NONE', dashed: true }
  );
  const line2 = await createLeaderLine(
    bb.x, bb.y + bb.height, placementX, placementY + bb.height,
    { strokeWeight: 1, color: borderColor, endCap: 'NONE', dashed: true }
  );

  return { insetFrame, indicator, line1, line2 };
}
```

### Zoom-inset positioning rules

- **Preferred positions:** top-right or bottom-right (Western reading order)
- **Exclusion zone:** source region bbox + 20px clearance — inset must NOT occlude source
- **Default magnification:** 2× (convention from SolidWorks, screenshot tools)
- **Multiple insets:** max 3 per graphic, color-code border pairs, no crossing connecting lines

---

## Complete annotation placement engine

Chains all algorithms into a single pipeline: sort targets by reading order → place badges with collision avoidance → compute leader lines → eliminate crossings → create Figma nodes.

```javascript
async function annotateTargets(targets, parent, style = {}) {
  const {
    diameter = 24,
    fillColor = { r: 0.18, g: 0.44, b: 1 },
    textColor = { r: 1, g: 1, b: 1 },
    gap = 16,
  } = style;

  // 1. Collect all occupied rects (existing content)
  const occupied = [];
  for (const child of parent.children) {
    const bb = child.absoluteBoundingBox;
    if (bb) occupied.push({ x: bb.x, y: bb.y, w: bb.width, h: bb.height });
  }

  // 2. Sort targets by reading order (top-to-bottom, left-to-right)
  const sorted = [...targets].sort((a, b) => {
    const bbA = a.absoluteBoundingBox, bbB = b.absoluteBoundingBox;
    const rowDiff = Math.abs(bbA.y - bbB.y) < diameter ? 0 : bbA.y - bbB.y;
    return rowDiff !== 0 ? rowDiff : bbA.x - bbB.x;
  });

  // 3. Place badges with collision avoidance
  const placements = [];
  for (const target of sorted) {
    const bb = target.absoluteBoundingBox;
    const targetRect = { x: bb.x, y: bb.y, w: bb.width, h: bb.height };
    const pos = findNonCollidingPosition(targetRect, diameter, diameter, occupied, gap);
    placements.push({ x: pos.x, y: pos.y, targetBB: bb });
    occupied.push({ x: pos.x, y: pos.y, w: diameter, h: diameter });
  }

  // 4. Compute leader lines and eliminate crossings
  let lines = placements.map(p => ({
    badgeX: p.x + diameter / 2,
    badgeY: p.y + diameter / 2,
    targetX: Math.max(p.targetBB.x, Math.min(p.x + diameter/2, p.targetBB.x + p.targetBB.width)),
    targetY: Math.max(p.targetBB.y, Math.min(p.y + diameter/2, p.targetBB.y + p.targetBB.height)),
  }));
  lines = eliminateCrossings(lines);

  // 5. Create Figma nodes
  const annotations = [];
  for (let i = 0; i < sorted.length; i++) {
    const badge = await createBadge(String(i + 1), placements[i].x, placements[i].y, {
      diameter, fillColor, textColor,
    });
    parent.appendChild(badge);

    const leader = await createLeaderLine(
      lines[i].badgeX, lines[i].badgeY,
      lines[i].targetX, lines[i].targetY,
      { strokeWeight: 1.5, color: fillColor, endCap: 'CIRCLE_FILLED' }
    );
    parent.appendChild(leader);

    annotations.push({ badge, leader });
  }

  return annotations;
}
```

---

## AI failure modes

### Critical / High severity (full descriptions)

**FM-B1: Badge on top of annotated element (Critical)**
The badge occludes the very thing it's supposed to highlight. Cause: AI places badge at the target's center instead of adjacent. Prevention: AABB collision test against target bounding box — the badge must NOT overlap the target element.

**FM-Z1: Zoom inset occludes source region (Critical)**
The magnified inset is placed directly over the area it's supposed to show in context. Prevention: exclusion zone check — inset bounding box must not overlap source bbox + 20px margin.

**FM-L2: Leader lines crossing each other (High)**
Two or more leader lines intersect, creating visual confusion about which badge points to which target. Prevention: run `eliminateCrossings()` after placement.

**FM-B6: Wrong reading order (High)**
Badge numbers don't follow spatial position (badge "3" appears above and left of badge "2"). Prevention: sort targets by reading order before assigning numbers.

**FM-L3: Centroid attachment instead of edge (High)**
Leader line terminates at the center of the target element instead of its nearest edge, appearing to "pierce" the element. Prevention: compute nearest-edge attachment point via `clamp(badgeCenter, targetBBox)`.

**FM-L6: Lines behind elements — z-order (High)**
Leader lines render behind content elements, making them invisible. Prevention: append all annotation nodes (badges + lines) AFTER content nodes for correct z-ordering.

### Medium / Low severity (one-line)

- **FM-S1:** Wrong element targeted — semantic mismatch between badge number and what it points at
- **FM-S2:** Badge placed in crop/bleed zone — falls outside canvas safe margin
- **FM-V2:** Inconsistent styles across badges — mixed sizes, colors, or line weights
- **FM-V4:** Text too small at display size — badge numeral unreadable at thumbnail
- **FM-V1:** Annotations compete with content — annotation elements have more visual weight than what they describe
- **FM-B3:** Inconsistent badge sizes — badges at different diameters within one graphic
- **FM-B4:** Badges too close together — clusters of badges that merge visually
- **FM-L4:** Leader lines too long — line exceeds 40% of canvas diagonal
- **FM-V3:** Annotation colors clash with content palette
- **FM-B5:** No grid alignment — badges at slightly different vertical positions when they should align
