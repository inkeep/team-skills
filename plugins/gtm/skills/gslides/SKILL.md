---
name: gslides
description: Create branded Google Slides presentations using Figma brand assets and Google Slides MCP. Use when asked to create a deck, presentation, pitch, or slides. Supports customer decks, sales presentations, internal updates, and product overviews. Pulls brand tokens (colors, typography, layouts) from Figma and creates slides in Google Slides. Requires figma and google-slides MCP servers.
argument-hint: "[topic or content brief] (optional: existing presentation URL)"
---

# Google Slides Presentation Builder

Create on-brand Google Slides presentations by combining Figma brand assets with Google Slides MCP tools.

## Prerequisites

This skill requires two MCP servers (scoped to the gtm plugin — they only load when working in `plugins/gtm`):
- **figma** — brand asset access (colors, typography, logos, layouts)
- **google-slides** — presentation creation and manipulation (50+ tools for text, images, styling)

If any are missing, instruct the user to run:
```bash
./secrets/setup.sh --skill gslides --account inkeep.1password.com
```
This registers `figma` and `google-slides` MCP servers, sets up gcloud ADC, and pulls Google OAuth credentials.

**Visual asset creation** requires the `graphics` skill (available in the same `gtm` plugin). When the graphics skill is available, this skill delegates visual asset creation to it via subagent. When unavailable, slides are text-only — note the gap and move on.

## Workflow

### 1. Parse the request

Identify:
- **Presentation type**: customer deck, sales pitch, internal update, product overview, competitive comparison
- **Audience**: prospects, customers, internal team, investors, partners
- **Content scope**: what topics/sections to cover
- **Length target**: approximate slide count (default: 8-12 slides)
- **Existing deck**: if user provides a Google Slides URL, use it as the starting point (skip step 2)
- **Content sources**: reports in `~/reports/`, documents, URLs, or inline instructions

### 2. Find a starting point

Before creating anything from scratch, find relevant existing work. Do this in order:

**a) Check master deck templates**

**Load:** `references/master-decks.md`

Match the presentation type to a master deck template. If there's a match, this is the default starting point — clone it, then customize.

**b) Ask about prior versions**

Ask the user if there are existing presentations on this topic, audience, or company. If they provide a Google Slides URL, use `mcp__google-slides__get_presentation` to read it.

**c) Present options to the user**

| What was found | Default action |
|---|---|
| Master deck matches the type | Clone the master deck, then customize for this request |
| Prior customized deck found for same company/topic | Offer to extend or duplicate the prior deck |
| Both master and prior deck found | Ask user: start from master (clean slate) or extend the prior version |
| Nothing relevant found | Create fresh (proceed to step 3) |
| User provided a specific URL in step 1 | Use that deck directly (clone or extend as appropriate) |

Wait for user confirmation before proceeding. If the user says "just create a new one," skip to step 3.

**Cloning a deck:** Use `mcp__google-slides__get_presentation` to read the source deck, then `mcp__google-slides__create_presentation` to create a new copy and replicate the slides. Never modify master decks directly.

### 3. Pull brand assets from Figma

Use the Figma MCP to extract brand tokens from the Inkeep design system.

**Load:** `/brand` and load any reference files relevant to your task following the skill's reference loading guidance for your content. This is important for ensuring you are fully grounded and can leverage brand assets, tokens, and guidance.
**Load:** `references/brand-guidelines.md` for the Figma file URL and slide-specific styling defaults.

Key assets to extract:
- **Color palette**: primary, secondary, accent, background, text colors
- **Typography**: font families, sizes, weights for headings vs body
- **Logo**: URL/export for slide headers or title slide
- **Layout patterns**: common slide structures from the design system

If the Figma MCP is unavailable, use the fallback tokens in `references/brand-guidelines.md`.

If extending or customizing a cloned deck that already has brand styling, skip this step — the styling carries over from the source.

### 4. Plan slide structure

Design the slide deck outline before creating anything.

If working from a cloned deck (master or prior version), read its existing slides first via `mcp__google-slides__get_presentation`. Then plan what to keep, modify, add, or remove.

Common slide types (for new decks or adding slides):

| Slide Type | Purpose | When to Use | Typical visual need |
|---|---|---|---|
| Title slide | Set context, company name, presentation title | Always first | Hero illustration or branded background (optional) |
| Problem/challenge | Frame the pain point | Customer/sales decks | Conceptual diagram or illustration |
| Solution overview | High-level value proposition | Customer/sales decks | System diagram, before/after, or flowchart |
| Feature deep-dive | Specific capability with visual | Product presentations | Product mockup or UI screenshot treatment |
| Social proof | Customer logos, quotes, metrics | Sales decks | Metric callout cards, quote cards, logo wall |
| Architecture/diagram | Technical overview | Technical audiences | Architecture diagram or data flow |
| Comparison/matrix | Feature comparison or competitive positioning | Evaluation stage | Visual comparison layout (optional) |
| CTA/next steps | Clear call to action | Always last | None (text-only) |

Present the slide outline to the user for review before creating or modifying slides.

### 5. Create visual assets

After the user confirms the slide outline, evaluate which slides need visual assets and delegate creation to the `graphics` skill via subagent.

**Load:** `references/graphics-delegation.md`

**a) Scan the outline for visual needs**

Review each slide against the "Typical visual need" column in the table above. Build a list of graphics to create:

| Slide | What the graphic should communicate | Graphic type |
|---|---|---|
| (fill per slide) | (key message / purpose) | (diagram, illustration, mockup, data viz, etc.) |

If any slides need **product mockups or UI screenshots** (feature deep-dives), gather existing product screenshots, URLs, or spec paths now — the graphics subagent can't browse the product or ask the user. Pass these as content sources in the handoff.

**b) Create a series brief**

Before spawning any subagents, decide the locked visual constants for the deck. See `references/graphics-delegation.md` § Series brief. These decisions apply to every graphic in the deck:
- Background treatment, illustration style, accent color, visual density, logo variant

For sales decks targeting a specific prospect, also capture the prospect's company name and domain for brand personalization.

**c) Skip delegation when:**
- The slide only needs text, bullets, and brand-styled solid color backgrounds
- A suitable image already exists as a public URL (user-provided or from master deck)
- Working from a cloned deck where visuals are already in place and adequate
- The "visual" is just a customer logo extractable directly from Figma

**d) Delegate in parallel**

For each graphic needed, spawn a subagent using the Agent tool. See `references/graphics-delegation.md` for the prompt template and handoff contract. Include the series brief and prospect context (if applicable) in every subagent prompt.

Spawn all graphics subagents in parallel (multiple Agent tool calls in one message). Each subagent loads the `graphics` skill and produces a Figma frame + exported PNG.

**e) Collect results and place images**

When subagents return, collect the exported image URLs. These will be placed during slide creation (step 6) using `mcp__google-slides__add_image`.

If any subagent fails, note the gap and proceed — the slide gets text-only content and you inform the user which visuals could not be created.

### 6. Create or modify the presentation

**Load:** `references/mcp-tools.md` for the full tool reference.

**Place visual assets:** For each slide that has a graphic from step 5, use `mcp__google-slides__add_image` with the exported image URL during slide creation. Full-slide graphics: `x=0, y=0, width=720, height=405` (points). Inset graphics: position and size according to the slide layout.

Choose the approach based on the starting point:

**Option A: Customize a cloned deck (recommended when a master or prior deck was found)**

Best when working from an existing deck that already has structure and styling.

1. The deck was already cloned in step 2
2. Read its slides: `mcp__google-slides__get_presentation`
3. Modify slide content: update text boxes, swap images, adjust titles
4. Add new slides where needed: `mcp__google-slides__add_slide`
5. Remove irrelevant slides: `mcp__google-slides__delete_slide`
6. Reorder if necessary: `mcp__google-slides__move_slide`

**Option B: Slide-by-slide (for new decks)**

Best when creating fresh decks from scratch.

1. Create a blank presentation: `mcp__google-slides__create_presentation`
2. Add slides: `mcp__google-slides__add_slide`
3. Add text boxes with coordinates: `mcp__google-slides__add_text_box`
4. Add images: `mcp__google-slides__add_image`
5. Style text: `mcp__google-slides__update_text_style`

### 7. Apply brand styling

After slides are created or modified, verify brand consistency:
- Slide background colors match brand palette
- Text styles (font family, size, color) match brand typography
- Logo present in header/footer where appropriate
- Color contrast meets readability standards

For cloned decks, styling should already be correct — only verify and fix inconsistencies.

Use `mcp__google-slides__batch_update` for efficient bulk styling.

### 8. Populate content

For each slide:
- Write concise, audience-appropriate copy
- Keep text minimal: max 6 bullet points per slide, max 8 words per bullet
- Use inverted pyramid: key message first, supporting detail below
- Include relevant data points, metrics, or quotes where appropriate
- For sales decks: lead with outcomes and pain points, then connect to capability

For cloned decks, focus on customizing existing content (company name, specific pain points, tailored metrics) rather than rewriting everything.

### 9. Review and deliver

1. Get the presentation URL via `mcp__google-slides__get_presentation`
2. Verify:
   - [ ] Slide count matches the planned outline
   - [ ] Consistent styling across all slides (colors, fonts, spacing)
   - [ ] No orphaned text or empty slides
   - [ ] Readable font sizes (minimum 18pt body, 28pt+ headings)
   - [ ] Title slide and CTA slide present
   - [ ] If cloned: placeholder content has been fully replaced (no leftover "[Company Name]" etc.)
3. Share the presentation URL with the user

## Quality bar

Must have:
- [ ] Checked master decks and Drive before creating from scratch
- [ ] All slides follow brand color palette and typography
- [ ] Title slide with presentation title and company context
- [ ] Content is concise and audience-appropriate
- [ ] Presentation URL shared with the user

Should have:
- [ ] Slide outline reviewed by user before creation
- [ ] Social proof (customer logos/metrics) for sales decks
- [ ] Clear CTA on the final slide
- [ ] Consistent layout patterns across slides
- [ ] If cloned: all placeholder content replaced with actual content
- [ ] Visual assets created for slides that need them (feature deep-dives, architecture diagrams, etc.)

## Anti-patterns

- **Creating from scratch when a master exists**: Always check `references/master-decks.md` first
- **Editing a master deck directly**: Clone it, then customize the copy
- **Leftover placeholders**: If cloning, ensure no "[Company Name]" or template text remains
- **Wall of text**: Never put more than 6 lines of text on a single slide
- **Generic visuals**: Use brand assets from Figma, not generic placeholders
- **Text-only when visuals would communicate better**: If a slide type has a "Typical visual need" in the outline table, create the graphic — don't skip it because it's easier to write bullet points
- **Feature dumps**: Lead with outcomes and pain points, not feature lists
- **Visually inconsistent graphics across slides**: All graphics in a deck must share the same series brief (background, style, accent, density) — create it before spawning subagents
- **Inconsistent styling**: All slides must use the same color palette and typography
- **Missing context**: Every slide should be understandable without the presenter narrating
- **Skipping the outline**: Always present the slide structure before creating slides
