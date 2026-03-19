# Data Visualization

**Load:** `/brand` skill `references/data-visualization.md` file for chart type selection, data series color palette, labeling standards, and data integrity rules.

This file covers **graphics-specific** implementation: canvas sizing and Figma code recipes.

## Text sizing (at 1080px canvas)

| Element | Minimum | Recommended |
|---|---|---|
| Chart title | 40px | 48-64px |
| Data labels (values, categories) | 18px | 20-24px |
| Axis labels | 16px | 18-20px |
| Source / attribution | 14px | 16-18px |

Always use sans-serif fonts. At social media sizes, every label must be readable on a ~400px mobile display.

## Graphics-specific composition

- **Max 5-8 data points** for social media graphics — more becomes unreadable at card sizes
- **40-60px padding** from frame edges
- At social sizes, legends are too small to read — always direct-label

---

## Recipes (figma_execute code patterns)

> The section below is for the agent building charts programmatically. It provides tested code patterns for `figma_execute`. Non-technical editors can ignore everything below this line.

### Recipe: Data grid / comparison table

Build structured data tables (comparison matrices, evaluation scorecards, decision frameworks) programmatically from data.

```javascript
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

const titleText = figma.createText();
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
titleText.fontName = { family: "Inter", style: "Bold" };
titleText.characters = data.title;
titleText.fontSize = 24;
titleText.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }];
root.appendChild(titleText);

const spacer = figma.createFrame();
spacer.resize(tableW, 16);
spacer.fills = [];
root.appendChild(spacer);

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
    if (val === "✓") t.fills = [{ type: 'SOLID', color: { r: 0.18, g: 0.71, b: 0.49 } }];
    else if (val === "✗") t.fills = [{ type: 'SOLID', color: { r: 0.88, g: 0.12, b: 0.35 } }];
    else if (val === "◐") t.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.70, b: 0.18 } }];
    else t.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }];
    cell.appendChild(t);
  }
}
return { id: root.id, name: root.name };
```

**Customization:** Adjust `CELL_W`/`CELL_H` for content density. Use brand primary (#3784FF) for header. Status icons: ✓ (green), ✗ (red), ◐ (yellow).

---

### Recipe: Pie / donut chart (arcData)

Build pie or donut charts using native Figma ellipses. Each slice is a separate ellipse overlaid at the same position.

```javascript
const data = [
  { label: "Support", value: 40, color: { r: 0.22, g: 0.52, b: 1 } },
  { label: "Sales", value: 30, color: { r: 0.18, g: 0.71, b: 0.49 } },
  { label: "Engineering", value: 20, color: { r: 0.98, g: 0.70, b: 0.18 } },
  { label: "Other", value: 10, color: { r: 0.88, g: 0.12, b: 0.35 } },
];

const total = data.reduce((sum, d) => sum + d.value, 0);
let currentAngle = -Math.PI / 2; // start at 12 o'clock
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

**Key details:** `arcData` uses radians. 0 = 3 o'clock, clockwise. Start at `-Math.PI/2` for 12 o'clock. `innerRadius` 0 = pie, 0.6 = donut. Add labels as separate TextNodes outside the chart.

---

### Recipe: Line / area / sparkline chart (vectorPaths)

Build line charts from data arrays using SVG path syntax.

```javascript
const data = [10, 45, 28, 72, 55, 90, 38];
const width = 400;
const height = 200;
const maxVal = Math.max(...data);
const padding = 20;

const chartFrame = figma.createFrame();
chartFrame.name = "Line Chart";
chartFrame.resize(width + padding * 2, height + padding * 2);
chartFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

const points = data.map((v, i) => ({
  x: padding + (i / (data.length - 1)) * width,
  y: padding + height - (v / maxVal) * height,
}));

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
chartFrame.insertChild(0, area);

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

**Variants:** Sparkline = smaller frame (120x40), no dots/labels, just the line. Multi-line = multiple vectors with different stroke colors. Smooth curves = use `C` (cubic bezier) commands instead of `L`.
