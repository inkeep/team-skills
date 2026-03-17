# Data Visualization

Standard for charts, graphs, and data-driven graphics in B2B marketing materials.

## Chart type selection

Choose the simplest chart type that communicates the data. At social media sizes, clarity beats sophistication.

| Chart type | Effectiveness | Use when | Avoid when |
|---|---|---|---|
| **Big number + sparkline** | Highest | Lead with a headline stat, show trend | Multiple data points need comparison |
| **Horizontal bar** | High | Rankings, comparisons (labels more readable) | Time series |
| **Vertical bar** | High | Time series, category comparison | More than 8 categories |
| **Line chart** | Medium | Trends over time (1-2 lines max) | More than 2 lines at social sizes |
| **Donut chart** | Medium | Part-of-whole (better than pie at small sizes) | More than 5 segments |
| **Pie chart** | Low | Avoid at social sizes | Almost always — use bar chart instead |
| **Stacked bar** | Low | Avoid at social sizes | Use small multiples instead |

**Default recommendation:** When in doubt, use a **horizontal bar chart** (most readable) or a **big number callout** (most impactful for B2B).

## Text sizing (at 1080px canvas)

| Element | Minimum | Recommended |
|---|---|---|
| Chart title | 40px | 48-64px |
| Data labels (values, categories) | 18px | 20-24px |
| Axis labels | 16px | 18-20px |
| Source / attribution | 14px | 16-18px |

Always use sans-serif fonts. At social media sizes, every label must be readable on a ~400px mobile display.

## Labeling

**Direct labeling over legends.** Place labels directly on or adjacent to data elements — faster comprehension, fewer interpretation errors.

- Legends only when 5+ data series or geographic maps
- At social sizes, legends are too small to read — always direct-label
- Place values at the end of bars (horizontal) or above bars (vertical)
- Use one decimal place maximum for percentages

## Data viz color palette

Use **brand primary (#3784FF) as the first category color**, then fill remaining categories from the Okabe-Ito colorblind-safe palette:

| Category | Hex | Name |
|---|---|---|
| 1st (brand primary) | `#3784FF` | Inkeep Blue |
| 2nd | `#E69F00` | Orange |
| 3rd | `#009E73` | Bluish Green |
| 4th | `#D55E00` | Vermillion |
| 5th | `#56B4E9` | Sky Blue |
| 6th | `#CC79A7` | Reddish Purple |
| 7th | `#0072B2` | Dark Blue |

**Maximum 5-7 colors** safely distinguishable for colorblind users. Beyond that, add patterns or shapes.

These colors are verified accessible against both white (#FFFFFF) and warm background (#FBF9F4) at WCAG AA contrast ratios.

## Composition

- **Max 5-8 data points** for social media graphics — more becomes unreadable
- **One chart per graphic** — don't combine multiple chart types
- **Start Y-axis at zero** unless you have a compelling, disclosed reason not to
- **Include context** — units, source attribution, comparison baseline
- **40-60px padding** from frame edges

## Code patterns

The following patterns are available in `references/figma-console-tools.md` for building charts programmatically via figma_execute:

| Chart type | Pattern name | Key API |
|---|---|---|
| Comparison table / scorecard | "Data grid / comparison table" | createFrame + createText (auto-layout) |
| Pie / donut chart | "Pie / donut chart (arcData)" | createEllipse with arcData |
| Line / area / sparkline chart | "Line chart (vectorPaths)" | createVector with SVG path syntax |
| Bar chart | "Data grid" pattern adapted | createRectangle per bar + createText |

## Common mistakes

1. **Truncated Y-axis** — distorts perception by up to 400%. Always start at zero unless explicitly noted
2. **Cherry-picked timeframe** — showing only the favorable window undermines credibility
3. **Too many data points** — social media max: 5-8. If you have more, aggregate or focus
4. **Missing context** — no units, no source, no comparison baseline
5. **3D effects** — distort proportions, add no information. Always use flat/2D
6. **Pie charts at small sizes** — unreadable, impossible to compare slices. Use bar charts
7. **Legends instead of direct labels** — forces eye travel between legend and chart, slower comprehension
