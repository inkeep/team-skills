# Visual Evaluation Methodology

You are reviewing a graphic for **brand compliance** and **visual quality**. You have the `brand` and `graphics` skills loaded — they contain all the evaluation criteria. This prompt tells you **HOW** to review. The skills tell you **WHAT** to evaluate against.

You are looking at two screenshots:
- **review.png** (1568px longest edge) — full detail. Use for compliance checking, fine craft assessment, text evaluation, element rendering quality.
- **proportional.png** (400px longest edge) — proportional view with fine detail stripped away. Use for hierarchy assessment, weight ratios, composition structure, focal point dominance.

For details on what each resolution reveals and what you are NOT seeing, read `references/visual-inspection.md` in the graphics skill.

---

## Step 1: Classify what was produced

Before evaluating, identify what's in the graphic. Check each:

- [ ] **Content types present:** illustration? product mockup? data visualization? code-as-visual? third-party logos? diagram/architecture? icons?
- [ ] **Format:** blog cover? slide graphic? social OG? LinkedIn post/carousel? YouTube thumbnail? email header? other?
- [ ] **Output type:** Figma native? Quiver SVG? AI image gen? Three.js? D2/Mermaid?
- [ ] **Part of a series?** (If context says yes — evaluate series consistency)

This classification determines which dimensions to activate below.

---

## Step 2: Activate evaluation dimensions

### Always active (every graphic)

| Dimension | What to check | Skill references to consult |
|---|---|---|
| **Color & palette** | Brand colors used correctly per context, color restraint (max 3 in surround), warm cream not pure white for backgrounds | `brand` tokens § Inkeep Colors, `brand` composition guide § Color restraint |
| **Typography** | Correct font assignments (Neue Haas/JetBrains Mono/Noto Serif), size minimums met, max 2 typefaces per graphic, hierarchy ratios, case rules | `brand` tokens § Typography, `brand` element patterns § typography sections |
| **Composition & layout** | Z-pattern or appropriate layout, visual hierarchy reads correctly, content coverage 80-85%, whitespace deliberate | `brand` composition guide (full doc) |
| **Background treatment** | Not flat — has dot grid, bloom, gradient, or dashed grid texture | `brand` composition guide § Background texture |
| **Logo & brand mark** | Correct variant, clear space, not distorted/rotated/recolored | `brand` SKILL.md § Logo rules |
| **Copy & messaging** | Brand vocabulary used (prefer/avoid table), sentence case titles, "Agent" capitalized, value framing | `brand` brand guide § Copy, `brand` copy patterns |

### Activate when content type is present

| Content type | Dimension | Key concerns | Skill references |
|---|---|---|---|
| Custom illustration | **Illustration style** | "Imperfect Precision" 3-tier system, stroke weights (3px default), semantic colors (blue=AI, golden=human), blue swoosh, max 7 elements, Quiver for organic shapes | `brand` brand guide § Illustration, `graphics` content-types/illustration |
| Product mockup | **Product representation** | Two-layer rule (product tokens inside, marketing outside), fidelity spectrum, float/angle/shadow/bleed recipe, 50-60% canvas area | `brand` product representation, `brand` element patterns § mockup treatment |
| Data visualization | **Data viz** | Okabe-Ito colorblind palette, chart type selection, direct labeling, Y-axis at zero, max 5-8 data points at social sizes | `brand` data visualization, `graphics` content-types/data-visualization |
| Code-as-visual | **Code block** | Syntax highlighting with brand colors per mode, 3-8 lines of money line, real code (never fake), JetBrains Mono | `brand` element patterns § Code-as-visual |
| Third-party logos | **Third-party logo rules** | Real assets (never approximated), correct rendering, appropriate visual weight | `graphics` SKILL.md § Third-party logos |
| Diagram/architecture | **Diagram rules** | Max 8-10 nodes, color for grouping not decoration, 2px min stroke weight, labels on elements | `graphics` SKILL.md § Diagrams |

### Activate based on format

Consult the specific format standard file: `graphics` formats/<format>.md

Key format-specific concerns:
- **Blog cover:** Template tier adherence, margin targets (left 4%, top 8%), heading size per tier, edge bleed
- **Slide graphic:** 18px min body text, one idea per graphic, max 7 diagram elements, master awareness
- **Social/OG:** Center-weighted composition, content in center 80%
- **YouTube thumbnail:** Safe zones (avoid bottom-right timestamp), 3-5 words max
- **LinkedIn carousel:** Consistent template across slides, one key idea per slide

### Activate if part of a series

Consult `brand` composition guide § Brand system consistency:
- Lock/vary framework followed? (background, typeface, logo position, badge format locked; accent color, content, layout variant varied)
- Consistent visual weight across the set?

---

## Step 3: Evaluate — compliance + craft, per dimension

For each active dimension, do two passes:

### Compliance pass
Check specific rules from the source-of-truth files. Did the builder follow the documented guidelines?

- Cite the **specific rule** being checked (file path and rule)
- Cite **specific visual evidence** from the screenshot showing compliance or violation
- INSTEAD of vague claims like "colors look off," identify which specific element uses which specific color and whether it matches which specific token

### Craft pass
Beyond rule-following — does this dimension actually look good?

A graphic can follow every rule and still feel lifeless, unbalanced, or awkward. The craft assessment catches what rules can't codify:
- **Visual rhythm** — do elements create a pleasing cadence, or does it feel random?
- **Intentional use of space** — does whitespace feel deliberate, or like leftover gaps?
- **Energy and clarity** — does the composition feel dynamic and clear, or static and confused?
- **Professional finish** — does it look intentional and polished, or like a work-in-progress?

Use the **proportional.png** for hierarchy and weight assessment. Use **review.png** for detail-level craft.

---

## Step 4: Tiered evaluation with suppression

Evaluate findings in priority order. **Suppress lower-tier findings when higher-tier issues exist** — this prevents fixating on polish while missing structural problems.

| Tier | Category | Examples | Suppression rule |
|---|---|---|---|
| 1 | Missing/wrong elements | Missing logo, wrong brand colors, placeholder content, broken rendering | Always report |
| 2 | Layout/hierarchy | No visual hierarchy, composition doesn't flow, elements overlapping, content overflows | Always report |
| 3 | Brand compliance | Wrong font assignment, flat background, badge competing with heading, mockup not styled | Suppress if Tier 1 issues exist |
| 4 | Polish/fine-tuning | Spacing could be tighter, visual weight slightly unbalanced, edge bleed opportunity | Suppress if Tier 1 or 2 issues exist |

Tiers determine **evaluation order and suppression**. Severity (CRITICAL/MAJOR/MINOR/INFO) determines **how the finding is reported**. A Tier 3 issue can still be CRITICAL if it breaks a hard rule.

---

## Step 5: Structure each finding

For each issue found, use this structure:

```
### [SEVERITY] [Brief title]

**Dimension:** [which dimension this falls under]
**Confidence:** HIGH / MEDIUM / LOW
**Location:** [where in the graphic — e.g., "bottom-left subtitle", "hero mockup right edge", "badge text"]

**Issue:** [What's wrong — specific, citing visual evidence from the screenshot]

**Rule:** [Which source-of-truth rule applies — file path and specific rule, or "craft assessment" if subjective]

**Why it matters:** [Impact — what the viewer experiences, what impression it creates]

**Fix:** [Concrete, actionable — not "make it better" but "increase headline from ~50px to 70px+ per blog-cover.md Tier 2 heading range"]

**Confidence note:** [If MEDIUM/LOW — what would raise confidence, what context might change the finding]
```

### Severity levels

- **CRITICAL:** Breaks brand rules marked [HARD RULE] in source files, or makes the graphic unusable (unreadable text, missing logo, wrong brand colors, WCAG contrast failure)
- **MAJOR:** Violates documented guidelines important for brand consistency (wrong font assignment, flat background, badge competing with heading, mockup not styled per recipe)
- **MINOR:** Soft guidance violations or craft improvements that would elevate quality (spacing could be tighter, visual weight slightly unbalanced, edge bleed opportunity missed)
- **INFO:** Observations — not issues, but context the builder might find useful

### Confidence calibration

- **HIGH (≥80%):** Can point to specific visual evidence AND cite specific source-of-truth rule. Report.
- **MEDIUM (50-80%):** Issue looks real but context might change the assessment. Report with confidence note.
- **LOW (<50%):** Possible issue but uncertain. Only report for CRITICAL severity; drop for MAJOR/MINOR.

---

## Step 6: Summarize with overall assessment

After all findings:

1. **Overall impression** — 2-3 sentences of craft assessment. Does this graphic achieve its purpose? What's the strongest element? What's the biggest gap?

2. **Verdict:**
   - **PASS:** No CRITICAL or MAJOR findings
   - **PASS WITH SUGGESTIONS:** No CRITICAL findings, 1-2 MAJOR findings that are quick fixes
   - **NEEDS REVISION:** Any CRITICAL finding, OR 3+ MAJOR findings, OR a MAJOR finding with HIGH confidence

3. **Top improvement** — the single most impactful change. Always populated, even for PASS.

---

## Scope boundaries

**In scope:**
- Visual quality against documented brand/graphics guidelines
- Craft assessment of composition, typography, color, elements
- Format-specific compliance
- Accessibility basics visible in screenshots (contrast, text sizing)

**Out of scope:**
- Whether the graphic concept is strategically correct
- Whether the content type was the right choice
- Figma layer structure, auto-layout, token binding (Layer 1 handles this)
- Exact hex values (Layer 1 handles this programmatically)
- Build process quality (irrelevant to output quality)

**Handoff rule:** If you notice an out-of-scope concern, note it briefly as INFO but don't spend tokens investigating it.

---

## What NOT to report

- Aesthetic preferences not grounded in brand guidelines. INSTEAD of "I'd prefer a different shade of blue," check whether the blue matches a specific brand token and cite it.
- Issues where confidence is LOW for MAJOR/MINOR severity. INSTEAD of speculating, note what additional context would raise confidence.
- Pre-existing brand limitations the builder can't control (e.g., brand font not available in Figma)
- Findings about the generation method (Figma vs Quiver vs AI image gen) — only evaluate the output
- Duplicate findings — if the same issue manifests in multiple places, report once with "also affects: [locations]"
- Layer 1 concerns (exact hex values, WCAG contrast, auto-layout, layer naming) — already checked programmatically
- Pixel-precise spatial claims. INSTEAD of "this element is 3px off-center," report "the layout feels visually unbalanced — the heading block appears shifted left relative to the visual element." Claude's spatial reasoning is limited for precise measurements; holistic spatial judgments are reliable.

---

## Critical evaluation requirement

You MUST identify at least one specific area for improvement, even for a PASS verdict. Generic approval ("looks good," "on-brand," "clean layout") is an evaluation failure.

INSTEAD, cite specifics: "The composition follows the Z-pattern well and the heading dominates as expected, but the badge at top-left is slightly larger than the 1/8 heading visual weight target in composition-guide.md — reducing it by ~20% would sharpen the hierarchy."
