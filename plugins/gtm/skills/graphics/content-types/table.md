Use when: Creating graphics that contain pricing tables, feature comparison matrices, spec tables, evaluation rubrics, or any structured tabular data
Priority: P0
Impact: Without this, tables have misaligned columns, wrong text alignment, no header separation, and inconsistent row heights — the most structurally demanding content type

---

# Data-Dense Tables and Feature Matrices

Tables in Figma have no native primitive — they must be built from nested auto-layout frames. The architecture is rigid: get the column specification wrong and every row is misaligned. Get it right and the grid is self-enforcing.

This file covers the Figma Plugin API construction technique. For chart-specific data visualization (pie, donut, line, area, sparkline), see `content-types/data-visualization.md`.

---

## Core architecture: three-level nested auto-layout

```
Table (VERTICAL auto-layout, fixed width, auto height)
├── Header Row (HORIZONTAL auto-layout, FILL width, fixed height)
│   ├── Cell 0 (FIXED width from column spec, FILL height)
│   ├── Cell 1 (FIXED width from column spec, FILL height)
│   └── Cell N ...
├── Body Row 0 (HORIZONTAL auto-layout, FILL width, fixed height)
│   ├── Cell 0 (FIXED width — same as header cell 0)
│   ├── Cell 1 (FIXED width — same as header cell 1)
│   └── Cell N ...
├── Body Row 1 ...
└── ...
```

**The single most critical constraint:** every cell at column index N gets the same FIXED width across all rows. This is what makes the grid align. The width comes from a column specification defined BEFORE any rows are created.

---

## Column specification (define before building)

The column spec is the contract that ensures grid integrity. Content never determines structure — the spec defines the grid, data fills it.

```javascript
// ── THE critical data structure — define FIRST ──
const columns = [
  { width: 200, align: 'LEFT',   dataType: 'text' },    // Feature name
  { width: 140, align: 'CENTER', dataType: 'icon' },    // Plan A
  { width: 140, align: 'CENTER', dataType: 'icon' },    // Plan B
  { width: 140, align: 'CENTER', dataType: 'icon' },    // Plan C
];
```

### Column width strategies

| Strategy | When to use | Implementation |
|---|---|---|
| **Equal distribution** | Plan columns in comparison matrices | `(tableWidth - firstColWidth) / numDataColumns` |
| **Fixed explicit** | Feature name columns, label columns | Hardcode based on expected content length |
| **Proportional** | Mixed content widths | `(weight / totalWeight) * tableWidth` |

For marketing graphics, **equal distribution for data columns with a wider first column** is the most common and safest pattern.

### Minimum column widths

| Content type | Minimum width | Rationale |
|---|---|---|
| Feature name / text label | 180px | Descriptive labels need room; avoids wrapping |
| Number / currency | 80px | Full value + padding |
| Icon / checkmark | 48px | 16px icon + 32px padding |
| Badge (text label) | 80px | Short label + padding |
| Mixed (icon + text) | 140px | Icon + gap + text + padding |

---

## Alignment rules (deterministic by data type)

Alignment is determined by data type, not by aesthetic preference. Violating these rules is the second-most-visible quality defect in tables.

```javascript
function getAlignment(dataType) {
  switch (dataType) {
    case 'text':       return 'LEFT';
    case 'number':     return 'RIGHT';
    case 'currency':   return 'RIGHT';
    case 'percentage': return 'RIGHT';
    case 'icon':       return 'CENTER';
    case 'check':      return 'CENTER';
    case 'badge':      return 'CENTER';
    case 'date':       return 'LEFT';
    default:           return 'LEFT';
  }
}
```

**Headers inherit their column's alignment.** Never default all headers to LEFT — a right-aligned number column must have a right-aligned header.

---

## Row types and visual hierarchy

Tables have four row types. Each maps to a specific combination of background, typography, and border treatment.

| Row type | Background | Font | Height | Border |
|---|---|---|---|---|
| **Header** | Light gray (2-4% darker than white) | Semi Bold, 1-2px smaller than body | 40-48px | 2px bottom border |
| **Body** | White / alternating 2% gray (zebra) | Regular | 44-52px | Optional 1px bottom |
| **Highlighted** | Light accent tint (e.g., very light blue) | Same as body | Same as body | 2px accent border |
| **Category separator** | Medium gray (4-6%) | Semi Bold, uppercase, tracked | 36-40px | None |

**The header must differ from body rows in at least 2 visual properties** (e.g., background + font weight, or background + border weight). A header that looks like a body row makes the table unreadable.

### Row striping (zebra)

Use very low contrast — 2-3% gray difference. High-contrast stripes create visual noise.

```javascript
function getRowBackground(rowIndex) {
  return rowIndex % 2 === 0
    ? { r: 1, g: 1, b: 1 }              // white
    : { r: 0.98, g: 0.98, b: 0.98 };    // 2% gray
}
```

---

## Cell content patterns

### Checkmark / x-mark / dash

```javascript
async function createIconCell(value, cellFrame) {
  const font = { family: "Inter", style: "Regular" };
  await figma.loadFontAsync(font);

  const text = figma.createText();
  text.fontName = font;
  text.fontSize = 18;
  text.textAlignHorizontal = 'CENTER';
  text.textAlignVertical = 'CENTER';
  text.layoutSizingHorizontal = 'FILL';

  switch (value) {
    case 'check':
      text.characters = "✓";
      text.fills = [{ type: 'SOLID', color: { r: 0.13, g: 0.72, b: 0.35 } }];
      break;
    case 'cross':
      text.characters = "✕";
      text.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.18, b: 0.18 } }];
      break;
    case 'dash':
      text.characters = "—";
      text.fills = [{ type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.7 } }];
      break;
    case 'partial':
      text.characters = "◐";
      text.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.65, b: 0.13 } }];
      break;
  }
  cellFrame.appendChild(text);
}
```

**Accessibility:** Use shape + color, not color alone. ✓ (green), ✕ (red), — (gray), ◐ (amber) communicate meaning through both glyph shape and color.

### Category separator row

```javascript
function createCategorySeparator(label, tableWidth) {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL';
  row.resize(tableWidth, 40);
  row.layoutSizingHorizontal = 'FILL';
  row.layoutSizingVertical = 'FIXED';
  row.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
  row.paddingLeft = 16;
  row.paddingRight = 16;
  row.counterAxisAlignItems = 'CENTER';

  const text = figma.createText();
  text.characters = label.toUpperCase();
  text.letterSpacing = { value: 4, unit: 'PERCENT' };
  row.appendChild(text);
  return row;
}
```

### Highlighted column (for "recommended" plan)

Apply an accent background tint to every cell at the highlighted column index, not to the row:

```javascript
// After creating each cell:
if (colIdx === highlightedColumnIndex) {
  cell.fills = [{ type: 'SOLID', color: accentTint }]; // very light accent
}
```

---

## Canvas adaptation

Tables must adapt to canvas size. The binding constraint is column count.

| Canvas | Max columns | Body font | Cell H-padding | Row height |
|---|---|---|---|---|
| Blog cover (1280×720) | 6-7 | 14px | 16px | 48px |
| Social post (1200×675) | 5-6 | 13px | 14px | 44px |
| Slide (960×540) | 4-5 | 12px | 12px | 40px |
| LinkedIn square (1080×1080) | 5-6 | 13px | 14px | 44px |

### When to simplify

| Condition | Action |
|---|---|
| Columns exceed canvas max | Remove least-important columns |
| Rows > 12 on 720px canvas | Truncate to top 10 + "and N more…" row |
| Rows > 8 on 540px canvas | Truncate to top 6 + summary |
| Effective column width < 80px | Column is too narrow — remove or merge |
| Many columns, few rows | Consider transposing (swap rows and columns) |

---

## AI failure modes

These are the specific patterns that produce incorrect table output. All are preventable by adopting the column-specification-first approach.

| # | Failure | Cause | Visual result | Prevention |
|---|---|---|---|---|
| 1 | **Inconsistent column widths** | Cell widths set per-cell instead of per-column | Ragged, misaligned grid | Define column width array; apply identically to all rows |
| 2 | **Wrong text alignment** | Left-aligning all content, or center-aligning everything | Numbers don't compare; text wastes space | Alignment from data-type lookup, never aesthetic preference |
| 3 | **No header separation** | Header styled identically to body rows | Can't distinguish labels from data | Header must differ in ≥2 properties (background, weight, size, border) |
| 4 | **No row striping or separators** | All rows have same background, no borders | "Wall of data" — eye loses tracking | Zebra striping OR horizontal dividers OR generous padding |
| 5 | **Cell misalignment across columns** | Different row structures, missing cells | Shifted data, wrong column attribution | Every row has exactly `columns.length` cells — enforce in code |
| 6 | **Text overflow/truncation** | Content exceeds cell bounds without handling | Clipped or invisible data | `textAutoResize: 'HEIGHT'` for wrapping, or validate content length |
| 7 | **Missing grid structure** | No borders, no striping, no padding distinction | Table looks like unstructured text | At minimum: row striping + header separation |

---

## Complete build flow

```javascript
// ── Step 1: Define column spec (THE contract) ────────────────
const columns = [
  { width: 200, align: 'LEFT',   dataType: 'text' },
  { width: 140, align: 'CENTER', dataType: 'icon' },
  { width: 140, align: 'CENTER', dataType: 'icon' },
  { width: 140, align: 'CENTER', dataType: 'icon' },
];

const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);

// ── Step 2: Validate data against spec ───────────────────────
const data = [
  { type: 'header', cells: ['Feature', 'Starter', 'Pro', 'Enterprise'] },
  { type: 'body',   cells: ['AI Search', 'check', 'check', 'check'] },
  { type: 'body',   cells: ['Custom Models', 'cross', 'check', 'check'] },
  { type: 'body',   cells: ['SSO / SAML', 'cross', 'cross', 'check'] },
];

for (const row of data) {
  if (row.cells.length !== columns.length) {
    return { error: `Row has ${row.cells.length} cells, expected ${columns.length}` };
  }
}

// ── Step 3: Create table frame ───────────────────────────────
const table = figma.createFrame();
table.name = "Feature Comparison";
table.layoutMode = 'VERTICAL';
table.primaryAxisSizingMode = 'AUTO';
table.counterAxisSizingMode = 'FIXED';
table.resize(tableWidth, 100);
table.itemSpacing = 0;
table.paddingTop = 0; table.paddingBottom = 0;
table.paddingLeft = 0; table.paddingRight = 0;
table.fills = [];
table.clipsContent = true;
table.cornerRadius = 12;
table.strokes = [{ type: 'SOLID', color: { r: 0.91, g: 0.91, b: 0.91 } }];
table.strokeWeight = 1;
table.strokeAlign = 'INSIDE';

// ── Step 4: Load fonts ───────────────────────────────────────
await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
await figma.loadFontAsync({ family: "Inter", style: "Regular" });

// ── Step 5: Build rows ───────────────────────────────────────
let bodyRowIndex = 0;

for (const rowData of data) {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL';
  row.layoutSizingHorizontal = 'FILL';
  row.layoutSizingVertical = 'FIXED';
  row.itemSpacing = 0;
  row.paddingTop = 0; row.paddingBottom = 0;
  row.paddingLeft = 0; row.paddingRight = 0;

  if (rowData.type === 'header') {
    row.resize(tableWidth, 44);
    row.fills = [{ type: 'SOLID', color: { r: 0.97, g: 0.97, b: 0.97 } }];
    // Bottom border on header
    row.strokes = [{ type: 'SOLID', color: { r: 0.87, g: 0.87, b: 0.87 } }];
    row.strokeWeight = 2;
    row.strokeAlign = 'INSIDE';
  } else {
    row.resize(tableWidth, 48);
    // Zebra striping
    row.fills = [{ type: 'SOLID', color:
      bodyRowIndex % 2 === 0
        ? { r: 1, g: 1, b: 1 }
        : { r: 0.98, g: 0.98, b: 0.98 }
    }];
    bodyRowIndex++;
  }

  // Build cells
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const col = columns[colIdx];
    const cellValue = rowData.cells[colIdx];

    const cell = figma.createFrame();
    cell.layoutMode = 'HORIZONTAL';
    cell.resize(col.width, row.height);
    cell.layoutSizingHorizontal = 'FIXED';    // ← CRITICAL: from column spec
    cell.layoutSizingVertical = 'FILL';
    cell.fills = [];
    cell.paddingLeft = 16; cell.paddingRight = 16;
    cell.paddingTop = 12; cell.paddingBottom = 12;

    // Alignment from column spec
    cell.primaryAxisAlignItems = col.align === 'LEFT' ? 'MIN'
      : col.align === 'RIGHT' ? 'MAX' : 'CENTER';
    cell.counterAxisAlignItems = 'CENTER';

    // Content
    if (['check', 'cross', 'dash', 'partial'].includes(cellValue)) {
      await createIconCell(cellValue, cell);
    } else {
      const text = figma.createText();
      text.fontName = rowData.type === 'header'
        ? { family: "Inter", style: "Semi Bold" }
        : { family: "Inter", style: "Regular" };
      text.fontSize = rowData.type === 'header' ? 12 : 14;
      text.characters = cellValue;
      text.textAlignHorizontal = col.align;
      text.textAlignVertical = 'CENTER';
      text.layoutSizingHorizontal = 'FILL';
      text.fills = [{ type: 'SOLID', color: rowData.type === 'header'
        ? { r: 0.4, g: 0.4, b: 0.4 }
        : { r: 0.13, g: 0.13, b: 0.13 }
      }];
      cell.appendChild(text);
    }

    row.appendChild(cell);
  }

  table.appendChild(row);
}

return { id: table.id, name: table.name };
```

### Comparison variant

For "Inkeep vs Competitor" comparison graphics, configure the table as:
- First column: feature names (wider, LEFT-aligned)
- Data columns: equal width, CENTER-aligned for icons
- Highlight "our product" column with accent background tint
- Use the constraint object pattern: define all column widths, row heights, and alignments as a single spec object before creating any elements
