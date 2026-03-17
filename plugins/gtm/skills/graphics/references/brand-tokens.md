# Brand Tokens for Graphics

Use when: Generating graphics that need brand-consistent colors, typography, and styling
Priority: P0
Impact: Off-brand visuals with wrong colors, fonts, or styling

---

## Design System Sources

| Source | File | What it provides | Use for |
|---|---|---|---|
| BABCO Design Assets | https://www.figma.com/design/by048nPGeK3c6FKMvlmPCz/BABCO-Design-Assetts | Brand tokens — colors, typography, spacing, gradients | Color palette, font styles, spacing rules |
| Inkeep Design Assets — Brand Assets page | https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Design-Assetts?node-id=5003:63 | Atomic graphical elements — 148 curated assets | Logos, icons, illustrations, backgrounds, third-party logos |

## Figma Design System

The canonical brand tokens live in the BABCO Design Assets Figma file:

- **File URL**: https://www.figma.com/design/by048nPGeK3c6FKMvlmPCz/BABCO-Design-Assetts
- **Brand Guide page**: node-id `2454-979`

Always use the Figma MCP to pull current values. The tokens below are fallbacks only.

## How to pull from Figma MCP

1. Call the Figma MCP to read the brand guide page (node `2454-979`)
2. Extract color styles — look for named styles like "Gradient - Dev", primary, secondary, background
3. Extract typography — font families, heading/body size scales, weight conventions
4. Extract spacing, border radius, and effect tokens if available
5. Export the logo for use in graphics

## Fallback Tokens

Use these only when the Figma MCP is unavailable.

### Colors

| Token | Hex | Usage |
|---|---|---|
| Background (warm) | `#FBF9F4` | Backgrounds, canvases |
| Primary text | `#1A1A1A` | Headings, labels, primary text |
| Secondary text | `#6B6B6B` | Captions, supporting text |
| Accent gradient | `Gradient - Dev` | CTAs, highlights, emphasis, decorative |

> These are observed values. The Figma file is authoritative — pull the full palette dynamically when possible.

### Typography

| Context | Guidance |
|---|---|
| Headings | Large, bold, primary text color |
| Body | Regular weight, smaller, primary or secondary |
| Captions/labels | Small, secondary text color |

### Logo

The Inkeep logo lives in the Figma Brand Guide page. Export via Figma MCP when needed for graphics.

## Applying tokens in Figma (via figma-console)

When creating native Figma designs, apply brand tokens using figma-console tools:

### Colors via dedicated tools
```
figma_set_fills: nodeId + hex color (e.g., "#FBF9F4", "#3784FF", "#231F20")
figma_set_strokes: nodeId + hex color
```

### Colors via figma_execute
```javascript
// Figma uses 0-1 RGB, not hex. Convert: channel / 255
node.fills = [{ type: 'SOLID', color: { r: 0.984, g: 0.976, b: 0.957 } }]; // #FBF9F4
node.fills = [{ type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1.0 } }];   // #3784FF
node.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }]; // #231F20
```

### Typography via figma_execute
```javascript
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
text.fontName = { family: "Inter", style: "Bold" };
text.fontSize = 32;
text.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }];
```

> Note: Use `figma.loadFontAsync()` before setting `fontName`. The font must be available in the Figma file.

---

## Applying tokens in code

### SVG
```xml
<!-- Use exact hex values, not named colors -->
<rect fill="#FBF9F4" />
<text fill="#1A1A1A" font-family="..." font-size="24" font-weight="700">Heading</text>
<text fill="#6B6B6B" font-family="..." font-size="14">Caption</text>
```

### HTML/CSS
```css
:root {
  --bg-warm: #FBF9F4;
  --text-primary: #1A1A1A;
  --text-secondary: #6B6B6B;
}
```

### D2
```d2
# Apply brand colors via D2 style
style: {
  fill: "#FBF9F4"
  stroke: "#1A1A1A"
  font-color: "#1A1A1A"
}
```

### Quiver.ai (via `--instructions` parameter)

Pass brand tokens as the `--instructions` argument to `scripts/quiver-generate.ts`:

```
Use these brand colors:
- Background: #FBF9F4 (warm cream)
- Primary text: #1A1A1A
- Secondary text: #6B6B6B
- Accent: #3784FF (blue)
Clean, minimal, geometric style. No gradients unless specified.
```

For stronger brand consistency, export 1-2 existing Figma assets as PNG and pass them as `--references` — the model will match the visual style.

### GPT Image 1.5 (via `--prompt` text)

Include brand colors as hex codes directly in the prompt for `scripts/image-generate.ts`:

```
A hero image for a tech company website. Warm cream background (#FBF9F4),
subtle geometric accents in blue (#3784FF). Clean, modern, minimal aesthetic.
Professional studio lighting. No text, no watermarks.
```

For image editing, specify what to preserve:

```
Replace only the background with a gradient from cream (#FBF9F4) to white.
Keep the product and its shadows exactly as they are.
```

Unlike Quiver (which has a separate `instructions` parameter), GPT Image uses a single prompt — include both the subject description and style/color constraints in one string.
