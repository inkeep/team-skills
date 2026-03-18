Use when: Creating any chart, graph, or data-driven visual — colors, labeling, chart type selection, integrity rules
Priority: P1
Impact: Off-brand chart colors, illegible labels, misleading data presentation, accessibility failures

---

# Data Visualization

Brand standards for charts, graphs, and data-driven visuals across all mediums (graphics, video, slides). For tool-specific implementation (Figma code recipes, canvas-specific sizing), see the consuming skill's own data visualization reference.

---

## Chart type selection

Choose the simplest chart type that communicates the data. Clarity beats sophistication.

| Chart type | Effectiveness | Use when | Avoid when |
|---|---|---|---|
| **Big number + sparkline** | Highest | Lead with a headline stat, show trend | Multiple data points need comparison |
| **Horizontal bar** | High | Rankings, comparisons (labels more readable) | Time series |
| **Vertical bar** | High | Time series, category comparison | More than 8 categories |
| **Line chart** | Medium | Trends over time (1-2 lines max) | More than 2 lines at small sizes |
| **Donut chart** | Medium | Part-of-whole (better than pie at small sizes) | More than 5 segments |
| **Pie chart** | Low | Avoid at small sizes | Almost always — use bar chart instead |
| **Stacked bar** | Low | Avoid at small sizes | Use small multiples instead |

**Default recommendation:** When in doubt, use a **horizontal bar chart** (most readable) or a **big number callout** (most impactful for B2B).

---

## Data series color palette

Use **brand primary (#3784FF) as the first category color**, then fill remaining categories from the Okabe-Ito colorblind-safe palette:

| Series | Hex | Name |
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

### Semantic color mapping (in illustrations)

| Data type | Color | Token |
|---|---|---|
| Primary/main data series | Blue fills/strokes | `brand/primary` |
| Secondary/comparison data | Golden fills/strokes | `brand/golden-sun` |
| Positive indicators (checkmarks, success) | Green | `#009E73` |
| Warning/caution indicators | Amber | `#E69F00` |

---

## Labeling

**Direct labeling over legends.** Place labels directly on or adjacent to data elements — faster comprehension, fewer interpretation errors.

- Legends only when 5+ data series or geographic maps
- Place values at the end of bars (horizontal) or above bars (vertical)
- Use one decimal place maximum for percentages
- Always use sans-serif fonts for data labels

---

## Data integrity rules

- **Start Y-axis at zero** unless you have a compelling, disclosed reason not to — truncated axes distort perception by up to 400%
- **Include context** — units, source attribution, comparison baseline
- **One chart per visual** — don't combine multiple chart types in a single composition
- **No 3D effects** — distort proportions, add no information. Always use flat/2D
- **No cherry-picked timeframes** — showing only the favorable window undermines credibility
