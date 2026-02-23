---
name: graphics
description: Create on-brand graphics and visual assets as native editable Figma designs. Use when asked to create graphics, visuals, diagrams, charts, social images, slide assets, marketing materials, or any visual asset that should follow the brand. Creates native Figma objects (frames, text, shapes, auto-layout) for full editability. Can also generate SVG, D2, or Mermaid when code output is specifically needed. Requires figma and figma-console MCP servers.
argument-hint: "[description of graphic needed] (optional: existing Figma URL or asset reference)"
---

# On-Brand Graphics Generator

Create visual assets as native editable Figma designs that follow the Inkeep brand. Primary use case: graphical assets for slide decks, marketing materials, social media, and documentation.

## Prerequisites

This skill requires two MCP servers (scoped to the gtm plugin):
- **figma** (official) — read designs, brand tokens, screenshots, design context
- **figma-console** (southleft/figma-console-mcp) — create and modify native Figma objects

Additionally, the **Figma Desktop Bridge plugin** must be running in the target Figma file. See `references/figma-console-tools.md` for setup details.

If MCP servers are missing, instruct the user to run:
```bash
~/.claude/plugins/marketplaces/inkeep-team-skills/secrets/setup.sh --skill google-mcp --account inkeep.1password.com
```
For figma-console, also ensure `FIGMA_ACCESS_TOKEN` is set in the MCP config.

## Workflow

### 1. Parse the request

Identify:
- **Graphic type**: diagram, illustration, icon, social image, chart, infographic, hero image, badge
- **Purpose**: where it will be used (slide deck, docs, website, social media, email)
- **Dimensions**: target size and aspect ratio (infer from purpose if not specified)
- **Output format**: Figma design (default — editable native objects), SVG (when code output specifically needed), or D2/Mermaid (for technical diagrams)
- **Existing asset**: if user provides a Figma URL or file reference, use it as the starting point (skip step 2)
- **Content**: what the graphic should depict or communicate

### 2. Find a starting point and collect assets

Before creating from scratch, search for existing assets to build from. **Always use the Figma MCP for navigation** — never the browser.

**a) Check the Brand Assets page first**

The Inkeep Design Assets file (`D7NDSM2peo1iLhkjLxmGP5`) has a curated **Brand Assets** page (node `5003:63`) with 96 atomic graphical elements organized into 7 sections. Search here first for logos, icons, illustrations, backgrounds, and third-party logos.

Use `figma_execute` to search by hierarchical name:
```javascript
const page = figma.root.findOne(n => n.id === '5003:63');
const asset = page.findOne(n => n.name.startsWith('logo/'));
```

**b) Check master design files for broader context**

**Load:** `references/master-designs.md`

This file contains navigation strategy tables for both the BABCO Design Assets file (brand tokens) and the Inkeep Design Assets file (Brand Assets page). Use it to identify which pages to check if the Brand Assets page doesn't have what you need.

**c) Navigate the Figma file via MCP**

Use the Figma MCP to systematically search for relevant existing assets:

1. **List pages** — get the file's page tree to see all available pages and their node IDs
2. **Match pages to task** — use the navigation strategy table in `references/master-designs.md` to identify which pages are most relevant
3. **Read relevant pages** — call the Figma MCP with the page's node ID to see its frames, components, and assets
4. **Drill into promising nodes** — inspect specific frames or components that look relevant to your task
5. **Extract what you need** — get colors, dimensions, layout structure, typography, and export assets

The Figma file has many pages organized by section (COVER, BRAND, COMPLETE, POST LAUNCH, ARCHIVE, Graphics). Pages contain frames with design assets — logos, social graphics, banners, templates, marketing visuals, etc.

**c) Present options to the user**

| What was found | Default action |
|---|---|
| Existing Figma asset closely matches the request | Use it as the structural reference, adapt or build on it |
| Related assets found (similar but not exact) | Show them to user, ask: adapt existing pattern or create fresh |
| Relevant page found but no exact match | Extract layout/style patterns from the page to guide creation |
| Nothing relevant found | Create fresh — propose 2–3 variations in the plan phase (step 4) |
| User provided a specific Figma URL | Use that asset as the reference |

Wait for user confirmation before proceeding.

### 3. Pull brand tokens from Figma

Use the Figma MCP to extract brand tokens from the design system.

**Load:** `references/brand-tokens.md` for the Figma file URL and fallback token values.

Extract:
- **Color palette**: primary, secondary, accent, background, text colors with exact hex values
- **Typography**: font families, weights, size scale
- **Spacing**: padding, margins, grid units
- **Border radius**: corner rounding conventions
- **Shadows/effects**: drop shadows, glows, gradients

If referencing an existing Figma asset, also extract its specific layout, dimensions, and visual structure.

### 4. Plan the graphic

Before generating, plan the composition:
- **Layout**: overall structure, element placement, visual hierarchy
- **Content elements**: text, icons, shapes, images, data points
- **Color mapping**: which brand colors apply to which elements
- **Typography mapping**: which font styles for headings, labels, body text

For diagrams: plan the nodes, edges, groupings, and flow direction.

**When the graphic is visually novel** (no existing asset to adapt, no established pattern to follow): default to proposing **2–3 variations** of the composition rather than committing to a single direction. Variations can differ in layout structure, visual metaphor, information hierarchy, or stylistic approach. Present them as lightweight sketches or descriptions — enough for the user to pick a direction before you invest in full execution. This front-loads the biggest design decision and avoids multiple full rebuilds.

If the graphic is adapting an existing asset or following an established pattern, a single plan with user confirmation is sufficient.

Present the plan to the user for review before generating.

### 5. Generate the graphic

**Load:** `references/figma-console-tools.md` for tool reference and common patterns.

Choose the generation method based on graphic type and output needs:

**Option A: Native Figma design (default — recommended for most graphics)**

Best for: slide assets, marketing visuals, diagrams, social images, cards, hero graphics — anything that benefits from editability.

Before starting, verify the Desktop Bridge plugin is running:
1. Call `figma_get_status` to check connection
2. If not connected, ask user to launch the Desktop Bridge plugin in their target Figma file

Follow the five-phase workflow below. Do NOT try to build the entire graphic in one pass.

#### Phase A: Collect reusable assets

**Goal:** Find every existing asset you can reuse. Never create what already exists.

From the composition plan (Step 4), list every visual element the graphic requires — logos, icons, components, typography styles, color values, decorative elements. Then search for each one:

1. **Search Brand Assets page first** — the Inkeep Design Assets file has a curated Brand Assets page (node `5003:63`) with 96 assets organized by path prefix (`logo/`, `icon/`, `illustration/`, `background/`, `third-party/`, `ui/`, `mascot/`). Search here before looking elsewhere.
2. **Logos** — `logo/full-color`, `logo/black`, `logo/white`, `logo/icon/*`, `logo/wordmark/*`, `logo/favicon/*`
3. **Icons** — `icon/nav/*` (14 variants), `icon/homepage/*`, `icon/customer/*`
4. **Illustrations** — `illustration/use-case/*`, `illustration/abstract/*`, `illustration/dev-page/*`, `illustration/homepage/*`
5. **Backgrounds** — `background/gradient/*`, `background/footer/*`, `background/polygon/*`, `background/grid`
6. **Third-party logos** — `third-party/slack`, `third-party/github`, `third-party/notion`, etc.
7. **Fall back to BABCO** — for brand tokens (colors, typography, spacing), check the BABCO Design Assets file Brand Guide page
8. **Typography** — pull exact font family/weight/size from the Brand Guide page
9. **Colors** — pull exact hex values from the Brand Guide page

For each asset found, record what it is, where it is (file key + node ID), and how you'll use it (clone, export, extract style values). For assets you'll incorporate, stage them: clone nodes into your working page, or note exact style values.

**Checkpoint:** List all assets collected and mark what's missing:
```
Assets collected:
- [x] Inkeep logo (node 123:456, cloned to working page)
- [x] Brand colors: #FBF9F4, #3784FF, #231F20, #6B6B6B
- [x] Font: Inter Bold 32px for headings, Inter Regular 16px for body
- [ ] Feature icons — NOT FOUND (need to create)
- [ ] Connection lines — need to create
```

#### Phase B: Gap analysis and creation plan

**Goal:** For every element NOT found in Phase A, plan exactly how to create it.

For each gap, define:
- **What it looks like** — dimensions, colors, shape, style (reference similar elements from master designs)
- **How to build it** — which figma-console tools to use
- **Inspiration source** — if a similar element exists but isn't an exact match, note its node ID

Determine build order from simplest to most complex:
1. Simple shapes (rectangles, circles — no dependencies)
2. Styled shapes (gradients, shadows, corner radius)
3. Text elements (require font loading)
4. Compound elements (icon + label, card with text + icon)
5. Connection elements (lines/arrows — build last, depend on element positions)

**Checkpoint:** Present the creation plan to the user before proceeding.

#### Phase C: Build atoms (bottom-up)

**Goal:** Create each missing element individually. Verify each one before moving on. Do NOT try to build the entire graphic at once.

Create a temporary working frame to build atoms in isolation:
```javascript
// via figma_execute
const workingFrame = figma.createFrame();
workingFrame.name = "Working — Atoms";
workingFrame.resize(2000, 2000);
workingFrame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
```

For each element in the build plan:
1. **Create it** using the appropriate figma-console tool
2. **Style it** — apply brand colors, fonts, corner radius, shadows
3. **Name it** — descriptive layer name immediately (`figma_rename_node`)
4. **Screenshot it** — `figma_take_screenshot` to verify it looks correct
5. **Fix issues** — if the screenshot shows problems, fix before continuing

Once simple atoms are verified, compose them into compound elements (group into auto-layout frames, set spacing/padding, screenshot and verify).

**Checkpoint:** Screenshot the entire working frame. Verify:
- [ ] Every planned atom exists (nothing left as placeholder)
- [ ] Brand colors exact, fonts correct
- [ ] Compound elements hold together visually
- [ ] All layers have descriptive names

Fix any issues now — it's much easier to fix individual atoms than after composition.

#### Phase D: Compose the final design

**Goal:** Assemble verified atoms into the final graphic layout.

1. **Create the root frame** at target dimensions with background fill and auto-layout
2. **Build the layout structure** — section/group frames (header, content, footer, etc.) with auto-layout for editability
3. **Move atoms into the composition** — move or clone verified atoms from the working frame into their correct sections, position according to the composition plan
4. **Add connection elements last** — lines, arrows, and connectors depend on final positions. Create them after everything else is placed. Verify connections visually — lines should touch their target elements, not float nearby. **If any layout change happens after connectors are placed** (card resizing, repositioning, re-centering), **delete and rebuild all connectors from scratch** — adjusting individual connectors is error-prone and slower than a clean rebuild.

**Dimensional changes cascade.** Changing an element's width or height can cause content to reflow (e.g., text wrapping changes line count, which changes container height, which collapses spacing with neighbors). Screenshot after **every** dimensional change to catch cascading layout breakage before it compounds.

**Checkpoint:** Full screenshot of the composed design. Verify:
- [ ] All elements from the plan are present
- [ ] Layout matches the composition plan
- [ ] Connection elements actually connect to their targets
- [ ] Visual hierarchy reads correctly
- [ ] Text is readable at intended display size
- [ ] No content overflow or collapsed spacing from dimensional changes

#### Phase E: Polish and verify

**Goal:** Final refinements and quality check.

**Before major revisions:** If the user requests substantial changes to a composed design (not minor tweaks), duplicate the current frame and rename it as a version snapshot (e.g., "Intelligence Layer — v1"). Work on the copy. This provides safe rollback and enables side-by-side comparison when evaluating changes with the user.

1. **Alignment and spacing** — consistent spacing, proper alignment, visual balance
2. **Layer organization** — descriptive names on all layers, logical layer order (background → structure → content → decorative)
3. **Final screenshot** — verify brand colors exact, typography correct, no placeholders, connections attached, design looks intentional
4. **Clean up** — delete the "Working — Atoms" frame, remove stray elements

#### Iteration is expected

Visual work is inherently iterative. Expect 5-10+ rounds of feedback and refinement — this is normal, not a sign of failure. Structure for it:
- Deliver a complete first pass, then refine based on user feedback.
- Don't try to make every detail perfect before showing the user — get directional alignment first, then polish.
- When the user requests changes, assess scope: minor tweaks can be applied in place, but major revisions should use the v1/v2 pattern (see Phase E above) so nothing is lost.

**Option B: SVG (when code output is specifically needed)**

Best for: icons that ship as code, inline SVGs for docs/web, assets that must be committed to a repo.

Write SVG code directly using brand tokens:
- Use exact hex colors from the brand palette
- Use brand font families in `<text>` elements
- Use consistent spacing and border radius
- Keep SVG clean and well-structured (named groups, meaningful IDs)

**Option C: D2 / Mermaid diagrams (for technical diagrams)**

Best for: system architecture, flow charts, sequence diagrams, entity relationships.

D2:
1. Write D2 diagram code
2. Apply brand colors via D2 theming
3. Generate SVG output: `d2 input.d2 output.svg`

Mermaid:
1. Write Mermaid syntax
2. Render via CLI or browser
3. Post-process to apply brand colors if needed

### 6. Apply brand consistency

After generating, verify the graphic matches the brand:
- [ ] Colors match the brand palette exactly (no approximations)
- [ ] Typography uses brand font families
- [ ] Spacing follows brand conventions
- [ ] Visual style is consistent with existing brand assets
- [ ] Appropriate use of gradients, shadows, or effects

For Figma designs: take a screenshot (`figma_take_screenshot`) and visually verify. Check that layers are well-named and organized.

For SVGs: validate the code is clean and renders correctly.

### 7. Export and deliver

**For Figma designs (primary):**
1. Verify the design in Figma:
   - [ ] Correct dimensions and aspect ratio
   - [ ] All layers are named descriptively
   - [ ] Auto-layout is applied where appropriate (for editability)
   - [ ] Text is readable at the intended display size
   - [ ] No orphaned or mispositioned elements
2. Share the Figma file URL with the user
3. If PNG/SVG export is also needed, use `figma_execute` to export or guide the user to export from Figma

**For code-based outputs (SVG, D2, Mermaid):**
1. Save the graphic to the appropriate location
2. If multiple formats needed, export both SVG and PNG
3. Verify:
   - [ ] Correct dimensions and aspect ratio
   - [ ] Clean rendering at target size
   - [ ] Text is readable at the intended display size
   - [ ] If SVG: no broken references, valid markup
4. Share the file path or output with the user

## Quality bar

Must have:
- [ ] Checked master designs and Figma before creating from scratch
- [ ] All colors match brand palette exactly
- [ ] Typography uses brand fonts
- [ ] Output format matches the use case (Figma for editable, SVG for code, D2 for technical)
- [ ] Deliverable shared with user (Figma URL or file path)
- [ ] For Figma: no placeholder content — every element is real (actual logos, icons, text)
- [ ] For Figma: visual checkpoint completed at each workflow phase

Should have:
- [ ] Plan reviewed by user before generation
- [ ] Consistent with existing brand assets in style and feel
- [ ] For Figma: layers named descriptively, auto-layout applied for editability
- [ ] For Figma: atoms built and verified individually before composition
- [ ] For SVG: clean, well-structured code
- [ ] Multiple sizes if needed for different contexts

## Anti-patterns

- **One-shot generation**: Never try to build the entire graphic in one pass. Follow the bottom-up workflow: collect assets, build atoms individually, verify each one, then compose.
- **Placeholder content**: Never leave "Icon here", empty shapes, or "TODO" labels in the design. If an asset is missing, find it (Phase A) or create it (Phase C).
- **Building connectors before elements (or keeping stale connectors)**: Lines, arrows, and connection elements depend on final positions. Build them last, and rebuild them from scratch whenever layout changes — don't try to nudge individual connectors after cards move.
- **Skipping visual checkpoints**: Every phase must end with a screenshot verification. Don't assume it looks right — verify. Screenshot after every dimensional change too — resizing elements cascades (text reflows, heights change, spacing collapses).
- **Creating from scratch when a Figma component exists**: Always check master designs and the design system first
- **Generating SVG when Figma-native is better**: Default to Figma designs for slide/marketing assets — they're editable and reusable. Use SVG only when code output is specifically needed.
- **Approximate colors**: Use exact hex values from the brand, not "close enough" colors
- **Unnamed layers**: Every Figma layer should have a descriptive name, not "Frame 47" or "Rectangle 12"
- **Flat structure without auto-layout**: Use auto-layout frames for sections so the design is easy to edit and resize
- **Ignoring the design system**: Brand tokens exist for a reason — don't freestyle the visual style
- **Skipping the plan**: Always present the composition plan before generating
- **Forgetting to verify connection**: Always check `figma_get_status` before starting Figma operations
- **Hardcoded dimensions in SVG**: Use viewBox for SVGs so they scale properly
