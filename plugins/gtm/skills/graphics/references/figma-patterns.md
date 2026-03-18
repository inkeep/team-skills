Use when: Applying brand tokens in Figma or in code-based outputs (SVG, Quiver, GPT Image)
Priority: P0
Impact: Hardcoded values instead of bound variables; lint failures; inconsistent token usage

---

# Applying Tokens

## In Figma

### Bind fills to color variables (preferred — passes `figma_lint_design`)
```javascript
const vars = await figma.variables.getLocalVariablesAsync('COLOR');
const token = vars.find(v => v.name === 'brand/primary');
const rect = figma.createRectangle();
rect.fills = [figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1 } },
  'color',
  token
)];
```

### Hardcoded hex fallback (when variables unavailable — will trigger `figma_lint_design` warning)
```
figma_set_fills: nodeId + hex color (e.g., "#FBF9F4", "#3784FF")
```

### Typography
```javascript
await figma.loadFontAsync({ family: "Neue Haas Grotesk Display Pro", style: "45 Light" });
text.fontName = { family: "Neue Haas Grotesk Display Pro", style: "45 Light" };
text.fontSize = 64;
text.letterSpacing = { value: -0.64, unit: "PIXELS" };
text.lineHeight = { value: 95, unit: "PERCENT" };
text.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }]; // text/primary
```

### Shadows (apply via effects array)
```javascript
node.effects = [{
  type: "DROP_SHADOW",
  color: { r: 0, g: 0, b: 0, a: 0.04 },
  offset: { x: 0, y: 4 },
  radius: 18.4,
  spread: 0,
  visible: true,
  blendMode: "NORMAL"
}]; // shadow/subtle
```

---

## In Code (SVG, Quiver, GPT Image)

### SVG / Quiver `--instructions`
```
Brand colors: background #FBF9F4, primary blue #3784FF, text #231F20, accent #FFC883
Style: clean, minimal. No gradients unless specified.
```

### GPT Image prompt
```
Warm cream background (#FBF9F4), blue accents (#3784FF), golden highlights (#FFC883).
Clean, modern, minimal aesthetic. Professional studio lighting.
```

### Illustration style
- Primary linework: `brand/primary` (#3784FF)
- Accent: `brand/golden-sun` (#FFC883)
- Structure: `text/primary` (#231F20)
- Fill areas: `illustration/wash-blue` (#EDF3FF) or `brand/crystal-blue` (#D5E5FF)
- Hand-drawn with slight irregularity, no shadows, depth via line weight variation
