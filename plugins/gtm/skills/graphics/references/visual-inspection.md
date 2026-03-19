Use when: Reviewer subagent needs to understand what resolution it's seeing and what detail level is reliable.
Priority: P1
Impact: Reviewer misjudges detail reliability or misinterprets what it's evaluating.

---

# Visual Inspection — Reviewer Context

This file is for the **reviewer subagent** that evaluates graphics output. The builder's screenshot guidance is inlined in SKILL.md under "How to look at your work."

## Frame-level screenshots

You capture your own screenshots using `scripts/capture-for-review.ts`. This produces two images:

**review.png** (1568px on the longest edge) — Claude's optimal resolution. No downscaling occurred. You are seeing the graphic at full detail.

At this resolution, you can reliably assess:
- Individual text characters, font weight, and tracking
- Spacing between elements (micro-gaps and macro-gaps)
- Color accuracy (though exact hex values are verified by Layer 1, not your job)
- Border radii, shadow quality, and rendering artifacts
- Subtle alignment issues (off-by-a-few-pixels misalignment is visible)
- Whether visual hierarchy reads correctly (what draws the eye first)

**proportional.png** (400px on the longest edge) — strips away fine detail and exposes proportional relationships: visual hierarchy, weight ratios, composition structure, whether the focal point dominates or everything flattens to equal weight.

Evaluate the proportional view separately from the primary screenshot — it reveals different things. A graphic can look detailed and polished at full size but have weak hierarchy at reduced scale (badge competes with heading, composition feels flat, no clear entry point).

## Atom-level screenshots

For complex compositions, you can inspect individual child elements by re-running the same capture script with a child node ID. Each atom screenshot is also exported at 1568px on its longest edge — the same resolution technique as the frame-level view, just focused on a smaller element.

At atom level, you see the element isolated from its parent frame (no surrounding background context). This gives full detail on internal content — text inside mockups, labels on charts, stroke weights in illustrations — that may be too small to assess reliably from the frame-level view.

See "When and how to inspect atoms" in `prompts/visual-evaluation.md` for criteria on when atom inspection is warranted and how to prioritize which elements to inspect.

## What you are NOT seeing

- **Intermediate construction states** — you see the finished output only, not the build progression
- **The Figma layer tree** — Layer 1 programmatic checks handle auto-layout, token binding, layer naming, WCAG contrast
- **The 2x/4x delivery export** — the delivery export is higher resolution but you don't need it. Your review screenshots have full detail for evaluation
- **Exact hex values** — Layer 1 verifies these programmatically. Your job is visual brand feel, not colorimeter readings
