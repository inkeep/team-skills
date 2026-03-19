Use when: Request requires multiple output formats (blog cover + OG image + social post + email thumbnail) from a single design
Priority: P0 (when multi-format detected in Step 1)
Impact: Without this, the agent designs each format independently — 3-4x slower and visually inconsistent across formats

---

# Multi-Format Cascade: Master + Derive

When a request requires multiple output formats, design one **master** and derive the others — don't design each independently.

## The pattern

```
Blog Cover (1280×720 working, export @2x → 2560×1440)  ← Master
    ├── OG Image (1200×630)       ← Derive: drop subtitle, shorten title
    ├── Social Post (1200×675)    ← Derive: punchy title, strong visual
    ├── LinkedIn Post (1200×1200) ← Derive: stacked vertical layout
    └── Email Thumbnail (600×300) ← Derive: image crop + brand mark only
```

**Why blog cover as master?** It's the widest aspect ratio and most content-rich format. Deriving narrower/simpler formats by removing content is easier than adding content to expand a minimal format. The master is designed at 1280×720 (1x working canvas) and exported at 2x for the final 2560×1440 output.

## Format adaptation rules

### What stays the same across all formats (invariants)

- Brand marks (logo, logomark) — same asset, possibly different placement
- Color palette and visual treatment
- Core imagery / illustration (cropped differently)
- Typography families and weight hierarchy (sizes scale)

### What changes per format

| Format | Dimensions | Layout | Content | Title | Safe Zone |
|---|---|---|---|---|---|
| **Blog cover** | 1280×720 working, export @2x (16:9) | Full horizontal spread | Title + subtitle + brand mark + illustration + category tag | Full title | Full bleed OK |
| **OG image** | 1200×630 (~1.91:1) | Compressed horizontal, tighter margins | Title + brand mark only | **≤60 characters** (platforms truncate) | 1080×566 (60px margins all sides) |
| **Social post** | 1200×675 (16:9) | Similar to OG but slightly taller | Punchy title + strong visual + brand mark | Shortened/punchy hook | Text covers ≤20-25% of image area |
| **LinkedIn post** | 1200×1200 (1:1) | **Stacked vertical**, centered | Large title + minimal supporting text + brand mark | Full or shortened | Center-weighted composition |
| **Email thumbnail** | 600×300 (2:1) | Tight center crop | Hero image crop + brand mark **only** | **No title** (title is in email body) | Everything important in center 80% |

### Title adaptation strategy

- **Blog cover:** Full title as authored
- **OG image:** Truncate or rewrite to ≤60 characters. If the title is longer, create a shortened version that preserves the core message. Platforms (Twitter, LinkedIn, Facebook) display their own title text alongside the image, so the OG image title is supplementary.
- **Social post:** Punchy/hook version. Can differ more from the original title — optimize for scroll-stopping impact.
- **LinkedIn post (1:1):** Full title if it fits large; shortened if not.
- **Email thumbnail:** No title text in the image.

## Typography tiers by format (quick reference)

When deriving formats from the master, adjust typography for each canvas:

| Format | Canvas | Heading % height | Heading px | Subtitle px | Body px |
|---|---|---|---|---|---|
| Blog cover (master) | 1280×720 | 11-14% | 80-100 | 28-36 | 20 |
| Social OG | 1200×630 | 12-15% | 76-95 | 28 | 20 |
| Social post | 1200×675 | 9-12% | 60-80 | 28-36 | 20-28 |
| LinkedIn 1:1 | 1200×1200 | 5-7% | 60-84 | 28-36 | 28 |
| Email thumbnail | 1200×500 | 10-15% | 48-76 | 28 | 24 |

**Sizing ladder** (Perfect Fourth 1.333 from 20px, snapped to ×4): 20 → 28 → 36 → 48 → 64 → 84 → 112.

When adapting the master to a derived format, re-check the heading against the target canvas height percentage — do not simply reuse the master's pixel values.

## The derive procedure

After the master (blog cover) is designed and approved:

### For each derived format:

1. **Clone the master frame**
   ```javascript
   // via figma_execute
   const master = figma.currentPage.findOne(n => n.name === 'Blog/Cover/...');
   const clone = master.clone();
   clone.name = 'Social/OG/...';  // rename per format
   ```

2. **Resize to target dimensions**
   ```javascript
   clone.resize(1200, 630);  // OG image dimensions
   ```
   Auto-layout constraints handle reflow. Elements with "fill container" width adapt; elements with "hug contents" maintain their size.

3. **Adapt content per format rules**
   - Drop elements not needed (subtitle, category tag, secondary text)
   - Shorten title if exceeding format limit
   - Adjust font sizes if text is too large/small for the new dimensions
   - Reposition brand mark if layout direction changed

4. **Adjust layout direction for square formats (1:1)**
   For LinkedIn 1200×1200: change the master's horizontal layout to vertical stacking. The main composition container's `layoutMode` may need to switch from `"HORIZONTAL"` to `"VERTICAL"`.

5. **Verify each derived format**
   - Screenshot and visually inspect
   - Check that text is readable at the format's intended display size
   - Verify brand mark is visible and properly sized
   - For OG: verify critical content is within the 1080×566 safe zone
   - Run `figma_lint_design` on each derived frame

6. **Run the subjective polish evaluation** (Step 5) on each format individually — derived formats can lose visual balance during adaptation.

## Frame naming for multi-format

Use the slash-separated convention to group related formats:

```
Blog/Cover/Agents-in-Slack
Social/OG/Agents-in-Slack
Social/LinkedIn-Post/Agents-in-Slack
Social/Twitter/Agents-in-Slack
Email/Thumbnail/Agents-in-Slack
```

This creates automatic hierarchy in the Figma Assets panel and nested folders on export.

## When NOT to use cascade

- **Formats with fundamentally different content** — if the social post needs different imagery than the blog cover (e.g., a quote card vs a diagram), design them independently.
- **Single-format requests** — don't derive formats the user didn't ask for.
- **Formats that require different illustration styles** — e.g., blog cover uses a detailed illustration but the email thumbnail needs an icon-only treatment. Design the thumbnail separately.

## Export

Export all format frames from the same Figma page using `figma_execute`:

```javascript
// Export each frame at its native dimensions
const frames = figma.currentPage.children.filter(n => n.type === 'FRAME');
for (const frame of frames) {
  const bytes = await frame.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
  // 2x scale for retina-quality export
}
```

For the blog cover specifically, also export at card thumbnail width (300px) for the thumbnail readability check.
