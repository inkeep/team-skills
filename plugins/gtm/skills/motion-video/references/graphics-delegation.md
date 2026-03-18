Use when: Phase 1 step 1d — visual assets needed for the video don't exist and must be generated
Priority: P1
Impact: Video uses placeholder visuals or skips scenes that need icons/illustrations

# Graphics delegation for video assets

When a video needs visual assets (icons, illustrations, diagrams, backgrounds) that don't exist in `remotion-videos/public/` or the brand asset library, delegate creation to the `/graphics` skill via subagent.

This follows the same pattern `/gslides` uses for slide graphics.

## Delegation contract

Each asset is created by a subagent that loads `/graphics` and follows its full workflow autonomously. The subagent handles tool selection internally — you don't need to decide.

### What you pass to the subagent

Spawn using the **Agent tool** with `subagent_type: "general-purpose"`. The prompt must include:

1. **Instruction to load the skill**: "Load the `graphics` skill and follow its full workflow."
2. **Asset type**: what kind of visual (icon, illustration, diagram, background, third-party logo)
3. **Target format**: "video asset" — transparent background, SVG preferred for vectors, PNG at 4x for raster
4. **What the asset represents**: the concept, feature, or element it depicts
5. **Size guidance**: approximate dimensions needed in the video (e.g., "40x40 icon", "400px wide illustration")
6. **Export instruction**: "Export as SVG if vector, PNG at 4x if raster. Save to `remotion-videos/public/images/generated/`."

### Prompt template

```
Load the `graphics` skill and follow its full workflow.

Create a video asset:
- **Type**: [icon / illustration / diagram / background / third-party logo]
- **Represents**: [what this asset depicts — e.g., "Zendesk integration", "knowledge graph", "AI agent workflow"]
- **Size**: [approximate dimensions — e.g., "40x40 icon", "600x400 illustration"]
- **Format**: Transparent background. SVG preferred for icons/illustrations. PNG at 4x for raster/photos.
- **Style**: Follow Inkeep brand illustration style (hand-drawn technical, blue + cream palette).

Export the final asset. Return using this format:

## Return
- **File path**: [local path to exported SVG/PNG]
- **Dimensions**: [width x height]
- **Format**: [SVG / PNG]
- **Notes**: [anything the video builder needs to know — e.g., "has transparent background", "includes text that may need sizing"]
```

### What the subagent returns

| Field | Required | Purpose |
|---|---|---|
| **File path** | Yes | Path to the exported file (save to `remotion-videos/public/images/generated/`) |
| **Dimensions** | Yes | Width x height of the asset |
| **Format** | Yes | SVG or PNG |
| **Notes** | No | Transparency, text content, special handling needed |

If the subagent cannot produce the asset, it returns a failure message explaining why.

## Using generated assets in Remotion

```tsx
import { Img, staticFile } from "remotion";

// For generated assets saved to public/images/generated/
<Img src={staticFile("images/generated/zendesk-integration-icon.svg")} />
```

## What `/graphics` can generate for your video

Use this table during Phase 1 planning to identify scenes that could benefit from generated assets. Describe what you need — `/graphics` handles tool selection internally.

| What you need | Output | Video scene example |
|---|---|---|
| Custom icon for a feature | On-brand SVG icon | "Knowledge-First" scene with a unique icon |
| Matching icon set (3-6) | Consistent SVG set | Feature overview — each pillar gets its own icon |
| Conceptual illustration | Hand-drawn style SVG | "How it works" — system diagram animating in |
| Decorative background | SVG pattern | Scene background — organic pattern instead of flat cream |
| Chart (bar, donut, sparkline) | Brand-styled PNG | "50% reduction in tickets" with animated chart |
| Metric callout (big number) | Styled number card | "99.9% uptime" as hero visual |
| Data comparison | Styled table/grid | "Before vs After" metrics side by side |
| Third-party logo | Real SVG logo | Integration video — partner logos in LogoGrid |
| Logo composition (co-brand) | Paired logos | "Powered by Inkeep" scene |
| Polished product mockup | Styled screenshot PNG | Product demo intro — polished UI before cursor walkthrough |
| Tutorial spotlight | Overlay + highlight PNG | Walkthrough — highlight a specific button with context dimmed |
| Syntax-highlighted code | Styled code block PNG | "Developer-friendly" scene showing integration code |
| Photorealistic image | Raster PNG | Scene backdrop — realistic environment behind text |
| Image editing (cleanup, bg swap) | Modified PNG | Clean up a screenshot — remove clutter, add blur |
| 3D rendered object | PNG with transparency | Intro — 3D logo tile floating and rotating |
| 3D integration tiles | Batch PNG tiles | Each partner logo on a premium tile |
| Architecture diagram | Auto-laid-out SVG | System overview animating in with staggered reveals |
| Flowchart | Structured SVG | "How a query flows" — step-by-step process |

## When to delegate (by video type)

| Video type | Likely needs | Skip when |
|---|---|---|
| **Text reveal / logo animation** | Nothing | Always — existing assets suffice |
| **Feature announcement** | Custom icon, badge | Using an existing icon |
| **Integration showcase** | Third-party logos | Logos already in `public/` |
| **Product demo** | Polished mockup, spotlight | Using raw screenshots directly |
| **"How it works" explainer** | Diagram, illustration | Rarely skippable |
| **Metrics / results** | Chart, metric card | Using text-only animated numbers |
| **Blog-to-video** | Topic illustration | Blog already has a hero image |
| **Customer testimonial** | Quote card, customer logo | Text-only testimonial scene |
| **Premium intro** | 3D rendered element | Always needs delegation |

## Decision table: delegate vs. skip

| Situation | Action |
|---|---|
| Scene needs an icon/illustration that doesn't exist | **Delegate** — spawn a graphics subagent |
| Scene needs a product screenshot | **Skip** — capture via `/browser` skill or use existing screenshot |
| Scene needs an Inkeep logo variant | **Skip** — use existing logos from `remotion-videos/public/images/logos/` |
| Scene needs a third-party logo (Zendesk, Slack, etc.) | **Delegate** |
| Scene needs a data chart or metric visual | **Delegate** |
| Scene needs a polished product mockup (not raw screenshot) | **Delegate** |
| Scene needs a 3D rendered element | **Delegate** |
| Scene needs a photorealistic backdrop | **Delegate** |
| Scene needs an architecture/flow diagram | **Delegate** |
| Scene only uses text + existing assets | **Skip** — no delegation needed |
| `/graphics` skill is unavailable | **Skip** — use text-only scenes, note the gap to the user |

## Parallel execution

When multiple assets are needed, spawn all graphics subagents simultaneously — use multiple Agent tool calls in a single message. Each subagent operates independently.

If a subagent fails or times out, proceed with text-only content for that scene and inform the user.
