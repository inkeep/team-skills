Use when: Writing the final evidence file for a company dissection
Priority: P0
Impact: Inconsistent output format makes cross-company synthesis difficult

---

# Output Template

Write one file per company. Follow this structure exactly — the orchestrator relies on consistent headings for cross-company synthesis.

```markdown
# Brand Dissection: {Company Name}

**Domain:** {domain}
**Date:** {YYYY-MM-DD}
**Source dimensions observed:** {list all unique aspect ratios found, e.g., "1920×1008 (1.90:1), 1200×630 (1.90:1)"}
**Images analyzed:** {total count across all asset types}

---

## Overview

[2-3 sentences: What does this company do? What is their visual identity in a nutshell? Where do they fall on the spectrum from minimal to maximal, dark to light, product-forward to abstract?]

---

## Brand System Summary

### Locked elements (constant across all assets)
- Logo: [position, size, variant used]
- Typography: [font(s), weight(s), always present]
- Background: [color/treatment always used]
- Other: [badge format, corner radius, shadow style, etc.]

### Variable elements (changes per asset)
- [Color accent, visual content, layout specifics, etc.]

### Emotional register
[Primary emotion: premium/playful/trustworthy/technical/warm/cold/bold/sophisticated]
[Does it match their product positioning?]

### Recognizability score: {1-5}/5
[Would you identify this in a grid of 50 thumbnails? What creates recognition?]

---

## Asset Analysis

### 1. Blog Covers / Feature Launch Graphics

**Pages visited:** [URLs]
**Images analyzed:** {count}
**Source dimensions:** {W×H, aspect ratio}
**Evidence images:** `images/{slug}/blog-{name1}.png`, `images/{slug}/blog-{name2}.png`, ...

#### Proportional measurements

| Metric | Value |
|---|---|
| Left margin | {% (Npx at source width)} |
| Top margin | {% (Npx at source height)} |
| Right margin | {% or "bleeds"} |
| Bottom margin | {% (Npx at source height)} |
| Content coverage | {% of canvas} |
| Heading size (% of height) | {% (~Npx at source)} |
| Text:visual split | {X:Y} |
| Colors in surround | {N} |
| Visual element % of canvas | {% } |

#### Visual approach
[Classification: dark cinematic / light product-forward / abstract minimal / typography-led / editorial illustration / hybrid]

#### Typography
[Font classification, weight contrast, hierarchy delta, typeface count, tracking, text role]

#### Color
[Palette colors, temperature, saturation, gradient details, accent count]

#### Texture & depth
[Background treatment, texture type and opacity, depth techniques, shadow treatment]

#### Composition
[Layout structure, eye path, edge bleed, balance type, focal point]

#### What works
[Specific strengths — be concrete]

#### What doesn't work
[Specific weaknesses — be honest. Write "None observed" only if genuinely exceptional]

#### Standout technique
[The ONE technique another company should steal from this asset type]

---

### 2. Changelog Graphics

[Same structure as above — or:]

**Not found:** No changelog page exists at {URLs checked}.

---

### 3. Integration / Partner Cards

[Same structure]

---

### 4. Customer Stories / Case Studies

[Same structure]

---

### 5. Testimonial / Quote Cards

[Same structure — these may be found inline on pages rather than as standalone assets]

---

### 6. Logo Wall / Social Proof

[Same structure — note: this is usually a section on a page, not a standalone image. Analyze the section design:]
- Logo count
- Treatment: monochrome vs full color
- Grid density and spacing
- Background treatment
- Organization method (by industry, alphabetical, random)

---

### 7. Stat / Metric Cards

[Same structure — these may be embedded in other assets (blog thumbnails, case studies) rather than standalone]

---

### 8. Landing Page Hero

[Same structure — the main above-the-fold visual on the homepage]

---

### 9. Product UI Presentation

[This is a cross-cutting observation, not a single image analysis. Across ALL pages visited, how does this company show their product?]

| Approach | Frequency | Where used |
|---|---|---|
| Raw screenshot | {never/rare/sometimes/often/always} | [pages] |
| Annotated screenshot | {frequency} | [pages] |
| Stylized mockup (floating, angled, shadowed) | {frequency} | [pages] |
| Abstract representation | {frequency} | [pages] |
| Never shown | {frequency} | [pages] |

[Analysis: What's their philosophy on product visibility in marketing? Do they show a lot of UI or keep it abstract? When they DO show UI, how do they style it?]

---

## Quality Ratings

| Dimension | Score (1-5) | Notes |
|---|---|---|
| Consistency | {score} | {1-sentence justification} |
| Craft quality | {score} | {1-sentence justification} |
| Creativity / distinctiveness | {score} | {1-sentence justification} |
| Product showcase effectiveness | {score} | {1-sentence justification} |
| Small-size readability | {score} | {1-sentence justification} |
| Brand system strength | {score} | {1-sentence justification} |
| Emotional coherence | {score} | {1-sentence justification} |
| **Overall** | **{score}** | **{1-sentence summary}** |

---

## Key Takeaways

1. **[Most important lesson]** — [why it matters, what specifically to learn]
2. **[Second lesson]** — [why, what to learn]
3. **[Third lesson]** — [why, what to learn]

---

## Evidence Images

All analyzed images are saved to `images/{company-slug}/` alongside this file.

### Image inventory
| File | Source URL | Source dimensions | Asset type | Key observation |
|---|---|---|---|---|
| `images/{slug}/{type}-{name}.png` | {source URL} | {W×H (aspect ratio)} | {type} | {1-line: what makes this image notable} |
| ... | ... | ... | ... | ... |

### Best-of highlights
[List the 2-3 images from this company that best represent their design quality — the ones the orchestrator should look at first when synthesizing]

1. `images/{slug}/{file}` — [why this is their best work]
2. `images/{slug}/{file}` — [why]
3. `images/{slug}/{file}` — [why]
```

## Notes on filling the template

- **"Not found" is a valid answer.** If a company doesn't have a changelog or customer stories page, say so and move on. Don't force-fit.
- **Proportional measurements are required for every image analyzed.** If you can't measure margins (e.g., the image is abstract with no clear "content area"), note why and skip the table.
- **Quality ratings require justification.** A bare number is useless. The 1-sentence note is mandatory.
- **"What doesn't work" must be filled honestly.** Only write "None observed" if the asset is genuinely exceptional. Every company has weaknesses — finding them is part of the value.
- **Evidence images must be saved.** Every image referenced in the analysis must exist in `images/{company-slug}/`. The dissection is incomplete without its visual evidence.
- **Best-of highlights help the orchestrator.** When synthesizing 23 companies, the orchestrator can't look at every image. The highlights tell it where to focus.
