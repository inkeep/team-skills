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

**Load:** `content-types/table.md` for the complete table construction architecture.

Tables are three-level nested auto-layout: VERTICAL table → HORIZONTAL rows → FIXED-width cells. Column widths must be defined as a specification array and applied identically to every row. See the table content-type for the full column-spec-first pattern, alignment rules, row types, checkmark/x-mark cells, canvas adaptation, and AI failure mode prevention.

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
