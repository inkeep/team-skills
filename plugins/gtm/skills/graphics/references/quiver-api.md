# Quiver.ai API Reference

Use when: Generating SVGs via Option D (AI-generated SVG) or vectorizing raster images to SVG
Priority: P0 (when using Option D)
Impact: Wrong API usage, failed generation, wasted credits

---

## Overview

Quiver.ai generates production-ready, structured, layered SVG code from text prompts using the Arrow model. Unlike hand-coded SVG, the output includes spatial hierarchy, grouping, and complex vector paths that would be impractical to write by hand.

- **API base:** `https://api.quiver.ai/v1`
- **Model:** `arrow-preview`
- **Auth:** Bearer token via `QUIVERAI_API_KEY` environment variable
- **Docs:** https://docs.quiver.ai/

## When to use Quiver vs other options

See the routing table in SKILL.md Step 1 for the full decision matrix. Summary of Quiver's sweet spot:

**Arrow excels at:** icons, logos, illustrations (flat/stylized), abstract art, decorative elements, background patterns, custom letterforms, technical drawings. It produces clean paths with fewer anchor points than competitors, semantic grouping, and proper layer structure.

**Arrow struggles with:** text rendering (converts to paths — non-editable, imprecise), data visualization (can't hit exact values), photorealism, exact brand logo reproduction, precise pixel-level layouts, complex multi-element scenes (quality degrades as composition complexity increases).

**Key routing rule:** If the graphic needs the Inkeep brand mark, precise text layout, or exact data values — don't use Quiver for those parts. Use the hybrid workflow (Quiver → Figma) to combine AI-generated artwork with Figma-native brand elements and text.

## Script usage

The script lives at `scripts/quiver-generate.ts`. Uses Node.js built-ins for the API call; uses `sharp` (optional) for auto-generating PNG previews. If `sharp` is not installed, SVGs still generate — only PNG previews are skipped.

### Generate SVG from text

```bash
bun scripts/quiver-generate.ts generate \
  --prompt "A minimal logo for a developer tools company" \
  --instructions "Use colors #3784FF and #231F20. Clean geometric style." \
  --temperature 0.5 \
  --output logo.svg
```

### Generate multiple variants

```bash
bun scripts/quiver-generate.ts generate \
  --prompt "Abstract illustration of AI agents collaborating" \
  --instructions "Warm background #FBF9F4, accent #3784FF, minimal flat style" \
  --n 3 \
  --output variants.svg
# Produces: variants-1.svg, variants-2.svg, variants-3.svg
```

### Use reference images for style consistency

Export a Figma asset as PNG, then pass it as a reference:

```bash
bun scripts/quiver-generate.ts generate \
  --prompt "Icon for customer support in the same style" \
  --references /tmp/existing-icon.png \
  --instructions "Match the visual style of the reference. Use #3784FF accent." \
  --output support-icon.svg
```

Up to 4 reference images (local file paths or URLs). References guide the model's visual style.

### Vectorize a raster image

```bash
bun scripts/quiver-generate.ts vectorize \
  --image screenshot.png \
  --auto-crop \
  --target-size 512 \
  --output vectorized.svg
```

### Output format

The script writes SVG files and auto-generates PNG previews (via `sharp`) alongside each SVG. It prints a JSON result to stdout:

```json
{
  "count": 1,
  "files": ["/absolute/path/to/logo.svg"],
  "previews": ["/absolute/path/to/logo.png"]
}
```

**Visual inspection:** Use the Read tool on the PNG preview to visually inspect the output — the Read tool can display images but not SVGs. Then check the SVG source for objective brand compliance (hex values, structure).

Status messages go to stderr, so you can capture just the JSON: `bun scripts/quiver-generate.ts generate --prompt "..." 2>/dev/null`

If `sharp` is not installed, PNG generation fails gracefully (warning only) and the script still outputs the SVGs.

## API parameters reference

### POST /v1/svgs/generations

| Parameter | Required | Default | Description |
|---|---|---|---|
| `model` | yes | — | `"arrow-preview"` |
| `prompt` | yes | — | Text description of desired SVG |
| `instructions` | no | — | Style/formatting guidance (inject brand tokens here) |
| `references` | no | — | Array of up to 4 reference images (URL or base64) |
| `n` | no | 1 | Number of SVGs to generate (1-16) |
| `temperature` | no | 1 | Randomness (0-2). Lower = more deterministic |
| `top_p` | no | 1 | Nucleus sampling (0-1) |
| `presence_penalty` | no | 0 | Encourages pattern diversity (-2 to 2). Positive = explore new patterns, negative = more focused/consistent |
| `max_output_tokens` | no | — | Max output length (up to 131072) |

### POST /v1/svgs/vectorizations

| Parameter | Required | Default | Description |
|---|---|---|---|
| `model` | yes | — | `"arrow-preview"` |
| `image` | yes | — | Base64 data URI or URL of raster image |
| `auto_crop` | no | false | Auto-detect and crop subject before vectorization — cleaner output from messy inputs |
| `target_size` | no | — | Target output size in pixels, square (128-4096) |

**Note:** As of 2026-03-17, the vectorization endpoint may reject some image inputs with "Invalid input" errors. If this occurs, try a different image format or resolution, or fall back to the generation endpoint with a descriptive prompt. This appears to be an API-side issue.

## Prompting guide

See SKILL.md Option D for the full prompting workflow. Key details for reference:

### Prompt structure (5 components)

```
[Subject] + [Style] + [Color palette] + [Composition] + [Constraints]
```

**Style vocabulary Arrow responds to:** flat, geometric, minimal, line art, duotone, isometric, hand-drawn, woodblock, heraldic, calligraphic, ornate, continuous stroke, monochrome, organic.

### Instructions parameter (brand constraints)

The `instructions` parameter is a separate channel from `prompt`. Use it for persistent brand rules:

```
Brand constraints:
- Colors: background #FBF9F4, accent #3784FF, primary #231F20, secondary #6B6B6B
- Style: clean, minimal, geometric, consistent with Inkeep brand
- No photorealistic elements
- No gradients unless explicitly requested
- No text unless explicitly requested (text renders as paths, not editable)
```

### Temperature and presence_penalty tuning

| Intent | Temperature | Presence Penalty | Why |
|---|---|---|---|
| Brand-consistent icon set | 0.3–0.5 | -0.5 to 0 | Low variation + reinforce consistency |
| On-brand illustration | 0.5–0.7 | 0 | Some creative range within brand constraints |
| Creative exploration | 1.0–1.5 | 0.5–1.0 | Maximum variation + push pattern diversity; pair with `--n 3` |

The script exposes `--temperature` and `--presence-penalty` flags for tuning. Combine with `--n 3` to generate variants and pick the best.

### Reference images (visual conditioning)

References are processed through a Vision Transformer (CLIP/SigLIP) into visual tokens that condition the SVG generation. This is **semantic visual understanding**, not pixel-level style transfer — the model extracts high-level features (style, composition, color palette, shape language, line weight) and uses them to influence output.

**What transfers well:**
- Overall visual style (flat, hand-drawn, geometric, organic)
- Color palette and color relationships
- Shape language (rounded vs angular, organic vs geometric)
- Level of detail and complexity
- Line weight characteristics
- Composition patterns

**What doesn't transfer precisely:**
- Exact hex values (use `--instructions` to specify exact colors)
- Fine textures or intricate patterns (may be simplified)
- Pixel-perfect reproduction (this is conditioning, not copying)

**Best practices:**

| Aspect | Recommendation |
|---|---|
| Number of references | 1-2 for clear style direction. 3-4 for robust style signal. Diminishing returns beyond 3. |
| Image format | PNG or JPEG raster. SVGs must be rendered to PNG first (the vision encoder processes raster). |
| Image size | 400-800px is sufficient. The encoder processes at 224-384px internally — very high resolution provides no benefit. |
| Combining with text | `prompt` = what to draw. `instructions` = explicit style rules (hex colors, constraints). `references` = visual examples of the target aesthetic. All three work together. |
| Temperature | Use 0.4-0.6 when references are provided (lower = more faithful to reference style). The SDK example uses 0.4 with references. |
| Consistency across generations | Use the SAME reference(s) + SAME instructions + low temperature for all items in a set. Feed your best output back as reference for subsequent generations to compound consistency. |

**For Inkeep illustration style:** Export an existing illustration from the marketing site as PNG (e.g., the B2B support card with hexagonal icons), pass as reference, and combine with the illustration system instructions from `references/illustration-system.md`:

```bash
# Export existing illustration as reference
curl -sL -o /tmp/inkeep-ref.png "https://inkeep.com/images/use-cases/b2b-customer-support-card-image.svg"
sips -s format png -Z 800 /tmp/inkeep-ref.png --out /tmp/inkeep-ref-800.png

# Generate new illustration matching the style
bun scripts/quiver-generate.ts generate \
  --prompt "Hand-drawn hexagonal grid with precise blue icons — a Slack hash, a chat bubble, and a gear" \
  --references /tmp/inkeep-ref-800.png \
  --instructions "Match the illustration style exactly. TWO layers: (1) faint gray hand-drawn containers at 15-20% opacity, (2) precise blue #3784FF filled icons inside. No shadows, no gradients. Colors: #3784FF blue fills, #231F20 gray outlines, #F7F4ED cream fills." \
  --temperature 0.5 \
  --output slack-illustration.svg
```

## SVG output quality

Arrow generates **native SVG** — not raster-to-trace conversion. Key quality characteristics:

- **Semantic primitives**: Uses `<circle>`, `<rect>`, `<polygon>`, `<text>` instead of path-approximating simple shapes. This means imported elements are individually editable in Figma.
- **Meaningful layer names**: Groups are labeled meaningfully (not `path_1`, `path_2`). Layer structure survives Figma import.
- **Compact paths**: RLRF training penalizes verbose SVG — fewer anchor points than traced alternatives, smaller file sizes.
- **Figma compatibility**: Imports cleanly via `createNodeFromSvg()`. Layer structure preserved. Elements remain editable without extensive cleanup.

**Known issues to check after import:**
- Complex gradients sometimes need manual adjustment in Figma
- Accessibility structure (`aria-*`, `<title>`, `<desc>`) not always clean — add if needed for web use
- Very intricate prompts (many detailed elements) can produce slower generation or incomplete output

## Streaming (optional)

Set `stream: true` to receive Server-Sent Events with progressive output:

1. **`reasoning`** event — model's thinking process
2. **`draft`** event — partial SVG preview (useful for progress visibility)
3. **`content`** event — final complete SVG with usage stats

Terminates with `data: [DONE]`. Useful for long-running generations where you want to show progress, but not necessary for typical use — the default synchronous response works fine for most graphics skill operations.

## Rate limits and credits

- **Rate limit:** 20 requests per 60 seconds per organization
- **Credits:** 1 credit per SVG (requesting `n=3` costs 3 credits)
- **Free tier:** 20 SVGs/week
- **Rate limit headers:** `X-RateLimit-Remaining`, `X-RateLimit-Reset`

If rate-limited (429), the script prints the `Retry-After` value. Wait and retry.

## Error handling

| Status | Meaning | Action |
|---|---|---|
| 401 | Invalid API key | Check `QUIVERAI_API_KEY` |
| 402 | Insufficient credits | Top up at quiver.ai |
| 429 | Rate limited | Wait for `Retry-After` seconds |
| 400 | Bad request | Check prompt/parameters |
| 500-503 | Server error | Retry after a moment |
