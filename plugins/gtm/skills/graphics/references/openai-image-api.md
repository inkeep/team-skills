# OpenAI GPT Image 1.5 API Reference

Use when: Generating raster images via Option E or editing existing images (inpainting, style transfer, background replacement)
Priority: P0 (when using Option E)
Impact: Wrong API usage, failed generation, wasted credits

---

## Overview

GPT Image 1.5 is #1 on LM Arena (Elo 1268) for AI image generation. It produces photorealistic raster images (PNG/JPEG/WebP) from text prompts and can edit existing images via inpainting, background replacement, style transfer, and object removal. This is a different modality from Quiver (SVG vectors) — use it for photographic quality, not scalable vector art.

- **API base:** `https://api.openai.com/v1`
- **Model:** `gpt-image-1.5`
- **Auth:** Bearer token via `OPENAI_API_KEY` environment variable
- **Docs:** https://platform.openai.com/docs/guides/image-generation

## When to use GPT Image vs other options

See the routing table in SKILL.md Step 1 for the full decision matrix. Summary:

**GPT Image excels at:** photorealistic images, product mockups in realistic scenes, hero images, editorial illustrations, image editing (inpainting, background swap, style transfer, object removal), text-in-image rendering (~98% accuracy).

**GPT Image is NOT for:** vector graphics (use Quiver), editable layouts (use Figma), diagrams (use D2/Mermaid), scalable assets (raster pixelates when scaled — use SVG for assets that need multiple sizes).

## Script usage

The script lives at `scripts/image-generate.ts`. Run with bun (zero external dependencies).

### Generate an image

```bash
bun scripts/image-generate.ts generate \
  --prompt "A photorealistic product shot of a laptop on a marble desk, warm studio lighting" \
  --quality high \
  --size 1536x1024 \
  --output hero-image.png
```

### Generate multiple variants

```bash
bun scripts/image-generate.ts generate \
  --prompt "Abstract geometric background in brand blue #3784FF and cream #FBF9F4" \
  --quality medium \
  --n 3 \
  --output bg-variants.png
# Produces: bg-variants-1.png, bg-variants-2.png, bg-variants-3.png
```

### Edit an existing image (inpainting / modification)

```bash
bun scripts/image-generate.ts edit \
  --prompt "Replace the background with a sunset beach scene" \
  --image original-photo.png \
  --quality high \
  --output edited.png
```

### Edit with a mask (targeted region)

```bash
bun scripts/image-generate.ts edit \
  --prompt "Fill the masked area with a potted plant" \
  --image room-photo.png \
  --mask area-to-fill.png \
  --output with-plant.png
```

The mask is a PNG with an alpha channel — transparent areas (alpha=0) indicate where to edit.

### Generate with transparent background

```bash
bun scripts/image-generate.ts generate \
  --prompt "A coffee cup icon" \
  --background transparent \
  --output-format png \
  --output coffee-icon.png
```

### Output format

The script writes image files and prints a JSON result to stdout:

```json
{
  "count": 1,
  "files": ["/absolute/path/to/hero-image.png"]
}
```

**Visual inspection:** Use the Read tool on the output PNG to visually inspect the result. Unlike Quiver SVGs, no conversion is needed — GPT Image output is already raster.

Status messages go to stderr. Capture just the JSON: `bun scripts/image-generate.ts generate --prompt "..." 2>/dev/null`

## CLI parameters

### Generate command

| Parameter | Required | Default | Allowed Values |
|---|---|---|---|
| `--prompt` | yes | — | Text description (max 32,000 chars) |
| `--quality` | no | `high` | `low`, `medium`, `high`, `auto` |
| `--size` | no | `auto` | `auto`, `1024x1024`, `1536x1024`, `1024x1536` |
| `--output` | no | `image-output.png` | File path |
| `--n` | no | `1` | 1–10 |
| `--background` | no | `auto` | `transparent`, `opaque`, `auto` |
| `--output-format` | no | `png` | `png`, `jpeg`, `webp` |

### Edit command

| Parameter | Required | Default | Allowed Values |
|---|---|---|---|
| `--prompt` | yes | — | Editing instruction |
| `--image` | yes | — | Path to source image (PNG/WebP/JPG, <50MB) |
| `--mask` | no | — | Path to mask PNG (transparent = edit region) |
| `--quality` | no | `high` | `low`, `medium`, `high`, `auto` |
| `--size` | no | `auto` | `auto`, `1024x1024`, `1536x1024`, `1024x1536` |
| `--output` | no | `image-output.png` | File path |
| `--n` | no | `1` | 1–10 |
| `--background` | no | `auto` | `transparent`, `opaque`, `auto` |
| `--output-format` | no | `png` | `png`, `jpeg`, `webp` |

## Prompting guide

### For photorealistic images

Be specific about subject, setting, lighting, and camera perspective:

**Good prompt:**
```
"A close-up product photograph of artisan coffee beans spilling from a burlap sack onto a dark wooden table,
warm directional lighting from the left, shallow depth of field, shot from 45 degrees above"
```

**Bad prompt:**
```
"coffee beans"
```

### For brand-consistent images

Include brand colors and style direction in the prompt:

```
"A hero image for a tech company website. Warm cream background (#FBF9F4),
subtle geometric patterns in blue (#3784FF). Clean, modern, minimal.
Professional studio lighting. No text."
```

### For image editing

Be specific about what to change and what to preserve:

```
"Replace only the background: change it to a gradient from cream (#FBF9F4) at the top
to light blue at the bottom. Keep the product and its shadows exactly as they are."
```

### Tips

- **Include lighting direction** — "warm light from the left", "soft diffused studio lighting", "dramatic rim lighting"
- **Include camera perspective** — "shot from above", "eye-level", "45-degree angle", "close-up macro"
- **Include material/texture** — "matte finish", "glossy ceramic", "brushed metal", "rough linen"
- **Negative constraints** — "no text", "no people", "no watermarks", "simple composition"
- **Brand colors** — include hex codes directly in the prompt for color accuracy

## Pricing

| Quality | 1024x1024 | 1536x1024 / 1024x1536 |
|---|---|---|
| Low | $0.011 | $0.016 |
| Medium | $0.042 | $0.063 |
| High | $0.167 | $0.250 |

Default is `high` for best quality. Each variant (`--n`) costs separately.
Be deliberate — don't generate `--n 10` at high quality ($1.70+) without reason.

## Error handling

| Status | Meaning | Action |
|---|---|---|
| 401 | Invalid API key | Check `OPENAI_API_KEY` |
| 402 | Billing error | Check OpenAI account billing |
| 429 | Rate limited | Wait for `Retry-After` seconds |
| 400 (content_policy_violation) | Content policy | Rephrase prompt to avoid policy triggers |
| 400 (other) | Bad request | Check prompt/parameters |
| 500–503 | Server error | Retry after a moment |
