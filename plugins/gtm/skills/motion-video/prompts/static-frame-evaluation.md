# Static frame evaluation guide

Use this when reading rendered Remotion frame PNGs via the Read tool. Score each dimension 1-10 with specific evidence from the frame. Your value comes from identifying specific, actionable issues — not from confirming the frame "looks fine."

## Brand palette (exact hex values)

| Token | Hex | Expected usage |
|-------|-----|---------------|
| primary | #3784ff | Buttons, links, underlines, CTAs, accents |
| primaryLight | #69a3ff | Hover states, secondary accents |
| primaryLighter | #d5e5ff | Light backgrounds, highlights |
| primaryDark | #29325c | Dark text on light backgrounds |
| background | #fbf9f4 | Page/video background (warm cream) |
| text | #231f20 | Headlines, body text (near-black) |
| surface | #f7f4ed | Card backgrounds, sections (slightly darker cream) |
| surfaceAlt | #fff5e1 | Alternate surfaces |
| accent | #e1dbff | Badge dots, highlights, decorative |
| muted | #5f5c62 | Muted/secondary text |
| white | #ffffff | Pure white (cards, overlays) |

## Scoring dimensions

Rate each dimension 1-10. For each score, cite specific visual evidence from the frame.

### 1. Text readability (25% weight)
- Is all text readable and not truncated or cut off at frame edges?
- Do headlines feel appropriately large (48-72px range)?
- Is there sufficient contrast between text and its background?
- INSTEAD of flagging partially visible text as always wrong, check whether the frame was captured mid-animation. A headline sliding into view at frame 15 of a 30-frame entrance is expected. A headline permanently clipped by its parent container is a bug.
- INSTEAD of trying to identify specific font families (you cannot do this reliably from a screenshot), check whether text styling is consistent — are all headlines the same style? Are all body text elements the same style?

**1-3:** Text is unreadable, severely truncated, or invisible against its background.
**4-6:** Text is readable but has issues — some truncation, inconsistent sizing, or low contrast in places.
**7-8:** All text is clear and well-sized; minor polish opportunities.
**9-10:** Perfect text rendering — every word is legible, well-sized, and properly contrasted.

### 2. Brand compliance (25% weight)
- Is the background warm cream (#fbf9f4) or light surface (#f7f4ed), NOT pure white or dark?
- Are blue accents (#3784ff) used for CTAs, underlines, and highlights?
- Does the overall feel match Inkeep's brand: warm, professional, approachable — NOT cold, dark, or corporate?
- INSTEAD of flagging any non-brand color as a violation, check whether the color serves a contextual purpose. A code block with syntax highlighting will contain non-brand colors. A company logo displayed in the video will use that company's colors. These are expected. A button or heading using an off-brand green is a violation.
- INSTEAD of measuring exact hex values (you cannot do this reliably from a screenshot), check whether colors are visually in the right family. A blue that's clearly Inkeep blue vs. a teal that's clearly wrong. The programmatic Layer 1 checks exact hex values — your job is visual assessment.

**1-3:** Wrong color palette — dark backgrounds, off-brand colors, or cold/corporate feel.
**4-6:** Generally on-brand but with noticeable deviations — a section feels too white, or an accent color is off.
**7-8:** Strong brand compliance; minor areas where the warmth or color usage could be refined.
**9-10:** Unmistakably Inkeep — warm, professional, every color choice reinforces the brand.

### 3. Element integrity (25% weight)
- Are UI elements (buttons, cards, badges) properly rendered with rounded corners?
- Are there any broken images, missing assets, or rendering artifacts (black boxes, placeholder text)?
- In intro/outro frames: is the Inkeep logo visible?
- INSTEAD of requiring every frame to have a logo, check what type of frame this is. Content frames (mid-video) typically don't show the logo. Only intro and outro frames should.
- INSTEAD of flagging "lorem ipsum" as always wrong, check whether the composition is using placeholder text intentionally (a code example, a mock UI). Placeholder text in a headline or CTA is a bug.

**1-3:** Broken images, rendering artifacts, missing elements, or corrupt layout.
**4-6:** All elements render but some look unpolished — inconsistent border radii, slightly misaligned elements.
**7-8:** Clean rendering; minor alignment or polish issues.
**9-10:** Every element is pixel-perfect — consistent radii, clean edges, no artifacts.

### 4. Layout quality (25% weight)
- Is the composition visually balanced (not cramped to one side)?
- Are margins and padding consistent from edges?
- Is there clear visual hierarchy (the viewer's eye knows where to look first)?
- Do any elements extend beyond the frame boundaries?
- INSTEAD of requiring perfect symmetry, check whether asymmetry is intentional. A hero section with text left and an image right is asymmetric by design. Text elements piled randomly with no structure is a layout issue.
- INSTEAD of flagging spacing differences of a few pixels, check whether the overall rhythm feels consistent. Does each section have roughly the same breathing room? Are elements evenly distributed within their containers?

**1-3:** No visual hierarchy; cramped or scattered layout; elements overflow the frame.
**4-6:** Basic structure is there but with noticeable spacing inconsistencies or unclear hierarchy.
**7-8:** Well-structured layout with clear hierarchy; minor spacing refinements possible.
**9-10:** Professional layout — perfect hierarchy, consistent spacing, balanced composition.

## Critical evaluation requirement

You MUST identify at least one specific area for improvement, even in a well-executed frame. Generic approval ("looks good," "on-brand," "clean layout") is an evaluation failure.

Instead, cite specifics: "The headline has strong contrast against the cream background, but the subtitle text at the bottom is only ~14px which may be hard to read in a LinkedIn feed. Consider increasing to 18px for mobile viewability."

## Response format

For each frame, use these exact headings. Use the `SCORE:` prefix on its own line for each dimension so scores are extractable.

### Frame: [frame number]

#### Text readability
SCORE: [1-10]
[Justification citing specific visual evidence from this frame]

#### Brand compliance
SCORE: [1-10]
[Justification citing specific visual evidence from this frame]

#### Element integrity
SCORE: [1-10]
[Justification citing specific visual evidence from this frame]

#### Layout quality
SCORE: [1-10]
[Justification citing specific visual evidence from this frame]

#### Issues
For each issue:
- **Location:** where in the frame (e.g., "bottom-left subtitle", "center card element")
- **Problem:** what's wrong
- **Fix:** concrete suggestion

#### Top improvement
The single most impactful improvement for this frame.

FRAME_SCORE: [weighted average, one decimal]
FRAME_PASSED: [true/false — pass if score >= 6.0 AND no dimension below 4]

## What this evaluation does NOT cover

The following are checked by other layers and should not be redundantly evaluated here:

- **Exact hex color values** — Layer 1 programmatic checks sample pixel colors at 5 positions. Your job is visual brand feel, not colorimeter readings.
- **Exact pixel dimensions** — Layer 1 confirms the frame matches the composition's declared size.
- **Animation state** — A frame captured mid-animation may show partially visible elements. This is expected. Animation quality is evaluated by Layer 3 (Gemini video evaluation).
- **Sub-pixel alignment** — Not perceptible in the final video.
