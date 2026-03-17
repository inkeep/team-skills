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
| `max_output_tokens` | no | — | Max output length (up to 131072) |

### POST /v1/svgs/vectorizations

| Parameter | Required | Description |
|---|---|---|
| `model` | yes | `"arrow-preview"` |
| `image` | yes | Base64 data URI or URL of raster image |

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
- Colors: background #FBF9F4, accent #3784FF, primary #1A1A1A, secondary #6B6B6B
- Style: clean, minimal, geometric, consistent with Inkeep brand
- No photorealistic elements
- No gradients unless explicitly requested
- No text unless explicitly requested (text renders as paths, not editable)
```

### Temperature tuning

| Intent | Temperature | Why |
|---|---|---|
| Brand-consistent icon set | 0.3–0.5 | Low variation; each icon should match the others |
| On-brand illustration | 0.5–0.7 | Some creative range within brand constraints |
| Creative exploration | 1.0–1.5 | Maximum variation; pair with `--n 3` for user to pick direction |

Note: the script doesn't expose `--temperature` yet (uses default 1.0). For temperature-sensitive work, modify the script or call the API directly.

### Reference images

For style consistency, export 1-2 existing Figma assets as PNG and pass as `--references`:
- **Icon sets:** generate the first icon, use it as reference for subsequent icons
- **Style matching:** when output must feel like existing brand assets
- **Color transfer:** the model picks up palette from references

References guide style — they don't clone the image.

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
