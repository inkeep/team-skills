# Gemini 3.1 Flash Image API Reference

Use when: Generating raster images via Option E with the Gemini provider — 3D hero elements, glass/material objects, abstract atmospheric backgrounds, 2D→3D brand asset conversion, or batch series with reference image anchoring
Priority: P0 (when using Option E with Gemini)
Impact: Wrong API usage, failed generation, missed reference image opportunity

---

## Overview

Gemini 3.1 Flash Image (codename "Nano Banana 2") is Google's top-ranked image generation model — #1 on the Arena leaderboard. It's a multimodal LLM that natively outputs images as part of a conversation, unlike GPT Image which is a separate image-only model. This means it supports conversational editing ("make it warmer") and reference images natively in the generation call.

- **Model ID:** `gemini-3.1-flash-image-preview`
- **SDK:** `@google/genai` (TypeScript/Node.js)
- **Auth:** API key via `GOOGLE_AI_API_KEY` environment variable
- **Max resolution:** 4K (4096px) at four tiers: 512, 1K, 2K, 4K
- **Aspect ratios:** 14 options (1:1, 16:9, 9:16, 3:2, 2:3, 4:3, 3:4, 5:4, 4:5, 21:9, 4:1, 1:4, 8:1, 1:8)
- **Reference images:** Up to 14 per request (10 object + 4 character)
- **Transparent background:** NOT natively supported. Use GPT Image when transparency is needed.

## When to use Gemini vs GPT Image

See the provider routing table in SKILL.md Option E. Summary:

**Gemini excels at:** 3D hero elements with glass/material quality, abstract atmospheric compositions, 2D brand asset → 3D interpretation, conversational iterative editing, batch series anchored by reference images.

**Gemini is NOT for:** transparent background compositing (use GPT), mask-based image editing (use GPT), structured illustrations needing exact layout topology (use GPT).

## Script usage

The script lives at `tools/image-generate.ts`. Gemini is accessed via `--provider gemini`.

### Generate an image

```bash
bun tools/image-generate.ts generate \
  --prompt "A translucent blue glass hexagonal prism floating in dark space (#0A0A0A)..." \
  --provider gemini \
  --output glass-hero.png
```

### Generate with a reference image (brand asset anchoring)

```bash
bun tools/image-generate.ts generate \
  --prompt "Using the visual style of this reference, generate a 3D glass shield..." \
  --provider gemini \
  --reference /tmp/brand-illustration.png \
  --output shield-3d.png
```

The reference image is sent as `inlineData` alongside the text prompt. The model uses it as visual context for style, palette, and composition guidance.

### Generate on both providers in parallel

```bash
bun tools/image-generate.ts generate \
  --prompt "A dark matte tile with blue rim glow..." \
  --provider both \
  --output hero-compare.png
# Produces: hero-compare-gpt.png + hero-compare-gemini.png
```

### Conversational editing (Gemini-specific)

Gemini supports multi-turn editing — feed an existing image and ask for modifications:

```bash
bun tools/image-generate.ts edit \
  --prompt "Make the rim glow warmer and increase the glass refraction" \
  --provider gemini \
  --image previous-output.png \
  --output refined.png
```

This uses Gemini's native multimodal input — the image and instruction go in the same `generateContent` call. No mask needed.

## API details

### REST endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent
```

### SDK usage (TypeScript)

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

// Basic generation
const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: "A dark matte tile with blue hexagon, studio lighting",
  config: {
    responseModalities: ["IMAGE"],
    // imageConfig: { aspectRatio: "16:9", imageSize: "2K" }  // optional
  },
});

// With reference image
const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: [{
    role: "user",
    parts: [
      { inlineData: { mimeType: "image/png", data: referenceBase64 } },
      { text: "Generate a 3D version of this illustration style..." },
    ],
  }],
  config: { responseModalities: ["IMAGE"] },
});

// Extract image from response
const parts = response.candidates?.[0]?.content?.parts || [];
for (const part of parts) {
  if (part.inlineData) {
    const imageBuffer = Buffer.from(part.inlineData.data, "base64");
    writeFileSync("output.png", imageBuffer);
  }
}
```

### Key parameters

| Parameter | Values | Notes |
|---|---|---|
| `responseModalities` | `["IMAGE"]` or `["TEXT", "IMAGE"]` | Use `["IMAGE"]` for pure generation, `["TEXT", "IMAGE"]` for generation with explanatory text |
| `imageConfig.aspectRatio` | 14 options (see above) | Default: model chooses based on prompt |
| `imageConfig.imageSize` | `"512"`, `"1K"`, `"2K"`, `"4K"` | Default: 1K. 4K costs ~2x more. |
| Reference images | Up to 14 as `inlineData` parts | 10 object references + 4 character references |

### Output format

Response contains `candidates[0].content.parts[]` — look for parts with `inlineData.data` (base64 PNG). The `mimeType` is typically `image/png`.

## Pricing (per image)

| Resolution | Standard | Batch (50% off) |
|---|---|---|
| 512px | $0.045 | $0.022 |
| 1K (1024px) | $0.067 | $0.034 |
| 2K (2048px) | $0.101 | $0.050 |
| 4K (4096px) | $0.151 | $0.076 |

## Limitations

- **No transparent background parameter.** For compositing elements, use GPT Image with `--background transparent`.
- **No seed/determinism.** Each generation is unique. For batch consistency, use reference image anchoring.
- **Preview status.** Model ID includes `-preview` — may change. Monitor Google AI announcements.
- **No mask-based editing.** Editing is conversational (instruction-based), not pixel-mask-based. For precise region editing, use GPT Image.
