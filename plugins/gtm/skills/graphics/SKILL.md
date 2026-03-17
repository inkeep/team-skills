---
name: graphics
description: Create on-brand graphics and visual assets as native editable Figma designs. Use when asked to create graphics, visuals, diagrams, charts, social images, slide assets, marketing materials, or any visual asset that should follow the brand. Creates native Figma objects (frames, text, shapes, auto-layout) for full editability. Can also generate SVG via Quiver.ai (AI-generated vector art), photorealistic raster images via GPT Image 1.5, hand-coded SVG, D2, or Mermaid when code output is specifically needed. Requires figma and figma-console MCP servers. Quiver.ai requires QUIVERAI_API_KEY. GPT Image requires OPENAI_API_KEY.
argument-hint: "[description of graphic needed] (optional: existing Figma URL or asset reference)"
---

# On-Brand Graphics Generator

Create visual assets as native editable Figma designs that follow the Inkeep brand. Primary use case: graphical assets for slide decks, marketing materials, social media, and documentation. Can also generate AI-powered SVGs via Quiver.ai for illustrations, logos, icons, and complex vector art. Can generate photorealistic raster images and edit existing images via GPT Image 1.5.

## Prerequisites

This skill requires two MCP servers:
- **figma** (official, HTTP) — read designs, brand tokens, screenshots, design context. Authenticates via OAuth on first use (Claude Code prompts automatically).
- **figma-console** (southleft/figma-console-mcp, stdio) — create and modify native Figma objects. Requires a Figma Personal Access Token + the Desktop Bridge plugin.

**If MCP servers or credentials are missing** (including `QUIVERAI_API_KEY` for SVG generation, `OPENAI_API_KEY` for raster generation, and `BRANDFETCH_API_KEY` for third-party logo fetching), instruct the user to run:
```bash
./secrets/setup.sh --skill graphics --account inkeep.1password.com
```

### Figma Desktop Bridge (required for native Figma design creation)

The `figma-console` MCP communicates with Figma Desktop via a WebSocket bridge plugin. This cannot be automated — Figma has no CLI/API for plugin management.

**One-time setup (import the plugin):**
1. Open **Figma Desktop** (not browser Figma)
2. Right-click canvas → **Plugins → Development → Import plugin from manifest...**
3. Select the manifest file. To find its path, run: `npx figma-console-mcp@latest --print-path`
4. The plugin now appears permanently in **Plugins → Development → Figma Desktop Bridge**

**Each session (run the plugin):**
1. Open your target Figma file in Figma Desktop
2. Right-click canvas → **Plugins → Development → Figma Desktop Bridge**
3. Wait for the green "MCP Ready" status widget

**If the plugin disconnects** (e.g., after tab refresh or file switch), re-run it from the Plugins menu. The skill checks connection status via `figma_get_status` before building and will guide the user if disconnected.

### Default Graphics Workspace

All Figma design work defaults to the shared **Inkeep Agent Graphics Workspace** unless the user specifies a different target file.

| Property | Value |
|---|---|
| **File name** | Inkeep Agent Graphics Workspace |
| **File key** | `S5kGTPZ0kSjmSxusJ56QJH` |
| **URL** | `https://www.figma.com/design/S5kGTPZ0kSjmSxusJ56QJH/Inkeep-Agent-Graphics-Workspace` |
| **Location** | inkeep → Team project (shared, all team members can access) |

**Target file resolution:**

| Condition | Target file |
|---|---|
| User provides a Figma URL in their request | Use that file |
| User says "create in [file name]" or references an existing file | Use that file |
| No file specified (default) | Use the Graphics Workspace |

**Page-per-project organization:** Each graphics request gets its own page in the workspace. The agent creates a new page at the start of Phase A:

```javascript
// via figma_execute
const page = figma.createPage();
page.name = "[YYYY-MM-DD] Blog — Agents in Slack thumbnails";
await figma.setCurrentPageAsync(page);
```

Page naming: `[YYYY-MM-DD] {medium} — {project description}`. This prevents overlap between sessions and keeps the workspace organized.

**Frame naming within pages:** Follow professional conventions — `AssetType/Platform/Variant` (e.g., `Social/LinkedIn/Post-Dark`, `Blog/Cover/Agents-in-Slack`). Slash-separated names create automatic hierarchy in the Assets panel and nested folders on export.

### Design Tokens (pre-configured in the workspace)

The workspace contains **30 Figma variables** across 4 collections that agents should use instead of hardcoding hex values:

| Collection | Tokens | How to use |
|---|---|---|
| **Inkeep Colors** (9) | `bg/primary`, `bg/surface`, `text/primary`, `text/muted`, `brand/primary`, `brand/accent-warm`, `brand/accent-cool`, `surface/white`, `surface/dark` | Bind to fills via `setBoundVariableForPaint` or `boundVariables` |
| **Inkeep Spacing** (6) | `spacing/xs`(4), `sm`(8), `md`(16), `lg`(24), `xl`(32), `xxl`(48) | Use for padding, gap, margins in auto-layout frames |
| **Inkeep Radius** (5) | `radius/sm`(4), `md`(8), `lg`(16), `xl`(24), `pill`(9999) | Use for `cornerRadius` |
| **Inkeep Typography** (10) | 3 font families + 7 sizes (12-64px) | Reference for font selection and sizing |

**Using tokens in `figma_execute`:**
```javascript
// Look up a color variable by name
const vars = await figma.variables.getLocalVariablesAsync('COLOR');
const brandPrimary = vars.find(v => v.name === 'brand/primary');

// Bind a fill to the variable (instead of hardcoding hex)
const rect = figma.createRectangle();
rect.fills = [figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1 } },
  'color',
  brandPrimary
)];
```

**Why tokens matter:** `figma_lint_design` flags hardcoded colors as warnings. Binding to variables ensures brand consistency cascades — if a brand color changes, all elements update automatically. It also enables future dark mode support by adding a "Dark" mode to the Inkeep Colors collection.

**If working in a non-workspace file** (user specified a different target): fall back to hardcoded hex values from `references/brand-tokens.md`. Tokens are only available in the workspace file.

**Why a shared workspace?** Figma has no API to create new files. The workspace prevents: (1) polluting brand asset files with work-in-progress, (2) requiring the user to create a new file for every request, (3) agents working in random/personal Drafts files that aren't team-accessible.

## Workflow

### Step 0: Create workflow tasks (MANDATORY FIRST ACTION)

⛔ **Before doing anything else**, create these tasks to track workflow progress. This is not optional — skipping this step is the primary cause of the agent jumping straight to building without collecting assets or brand tokens.

Create these tasks in order:
1. `"Graphics: Parse request"` → set to `in_progress`
2. `"Graphics: Collect assets & brand tokens"` → pending
3. `"Graphics: Plan composition"` → pending
4. `"Graphics: Generate graphic"` → pending
5. `"Graphics: Brand consistency check"` → pending
6. `"Graphics: Export & deliver"` → pending

As each step begins, mark its task `in_progress`. When the step completes, mark it `completed`.

**Why this exists:** Without explicit task tracking, the observed failure mode is the agent skipping asset collection (Step 2) and brand token extraction (Step 3), jumping straight to building from scratch with approximated brand elements. This produces off-brand graphics with fake logos and wrong colors.

---

### 1. Parse the request

Identify:
- **Graphic type**: diagram, illustration, icon, social image, chart, infographic, hero image, badge
- **Purpose**: where it will be used (slide deck, docs, website, social media, email)
- **Output medium**: how it will be displayed — this determines minimum text sizes and visual weight

| Medium | Min body text | Min label text | Notes |
|---|---|---|---|
| Slide deck (projected) | 18px | 14px | Will be viewed from distance; err on the side of larger |
| Social media image | 16px | 12px | Viewed on mobile; needs to be legible at small sizes |
| Website / docs | 14px | 11px | Viewed at screen distance |
| Print (poster, handout) | 12pt | 9pt | Physical media; point sizes, not pixels |

If the user doesn't specify the medium, **ask** — text sizing is the most common source of iteration waste. Default to slide deck sizing when the purpose is "presentation" or "deck."

- **Dimensions**: determine from the output medium. **Load the matching standard file** from `standards/` for exact dimensions, design guidelines, and best practices:

| Medium | Standard file | Default size |
|---|---|---|
| Blog cover / thumbnail | `standards/blog-cover.md` | 2560 x 1440 px (16:9) |
| Social / Open Graph image | `standards/social-og.md` | 1200 x 630 px (~1.91:1) |
| Social post (cross-platform) | `standards/social-post.md` | 1200 x 675 px (16:9) |
| LinkedIn single-image post | `standards/linkedin-post.md` | 1200 x 1200 px (1:1) |
| LinkedIn carousel | `standards/linkedin-carousel.md` | 1080 x 1080 px per slide (1:1) |
| LinkedIn banner | `standards/linkedin-banner.md` | 1128 x 191 (company) / 1584 x 396 (personal) |
| Twitter/X | `standards/twitter-x.md` | 1200 x 675 px (16:9) |
| YouTube thumbnail | `standards/youtube-thumbnail.md` | 1280 x 720 px (16:9) |
| YouTube channel banner | `standards/youtube-banner.md` | 2560 x 1440 px (16:9) |
| Email header / newsletter | `standards/email-header.md` | 1200 x 400-600 px (2x retina) |
| Slide deck graphic | `standards/slide-graphic.md` | 960 x 540 px working / 1920 x 1080 export (16:9) |
| Case study hero / thumbnail | `standards/case-study-hero.md` | 1800 x 840 px hero / 800 x 500 px thumbnail |
| Chart / data visualization | `standards/data-visualization.md` | Varies by context — see standard for chart type selection, color palette, text sizing |

If the medium doesn't match any standard file, ask the user for dimensions. Do not guess — wrong dimensions are the most common rework cause.

The standard files also contain **design guidelines specific to each medium** (text sizing, composition, what works/what to avoid). Read the relevant file before planning the graphic — it will inform your composition decisions in Step 3.

- **Content analysis** (when the user provides a blog post, article, or content to create graphics for): Scan the content and suggest a visual approach before planning:

| Content signal | Suggested visual approach |
|---|---|
| Key statistic or metric in the content | **Bold data callout** — large stat as hero element |
| Comparison between options/products | **Split layout or comparison table** — side-by-side with pros/cons |
| Step-by-step process or workflow | **Sequential diagram** — numbered steps with flow arrows |
| Customer quote or testimonial | **Quote card** — speaker photo + quote text |
| Product feature or UI explanation | **Annotated product mockup** — simplified UI with callouts |
| Tutorial, walkthrough, or "click here" guide | **Spotlight cutout** — screenshot with dimmed overlay + highlighted target element (see Pattern: Spotlight cutout in `references/figma-console-tools.md`) |
| Abstract concept or architecture | **Illustration or diagram** — visual metaphor for the concept |
| List of criteria or evaluation rubric | **Data grid or scorecard** — structured table with ratings |
| Announcement or launch | **Bold headline + product visual** — clean, editorial feel |

Present the suggestion to the user: "Based on the content, I'd suggest a [type] approach because [reason]. Does that work, or did you have something different in mind?"

- **Output format**: choose based on the graphic type and what happens to it next:

| Graphic type | Best format | Why |
|---|---|---|
| Slide assets, marketing cards, social images, multi-element layouts | **Figma (Option A)** — default | Editable by designers; precise layout; auto-layout; text control |
| Text-heavy designs (feature tables, pricing, comparisons) | **Figma (Option A)** | Quiver converts text to paths — no editability, imprecise for body copy |
| Illustrations, icons, logos, abstract art, decorative elements | **Quiver (Option D)** | AI generates layered, stylized vectors with complex paths impractical to hand-code |
| Icon sets (multiple matching icons) | **Quiver (Option D)** with references | Generate one, pass it as `--references` for the rest — maintains visual consistency |
| Background patterns, textures, abstract decorative art | **Quiver (Option D)** | Hard to hand-code, easy to describe |
| Charts, graphs, data visualizations (bar, line, pie, donut, sparkline) | **Figma (Option A)** | Native primitives (arcData for pie/donut, vectorPaths for line charts) produce editable, brand-consistent output — see code patterns in `references/figma-console-tools.md`. Load `standards/data-visualization.md` for chart type selection and design guidelines |
| Simple structural SVGs (basic shapes, inline diagrams) | **Hand-coded SVG (Option B)** | Exact control; simple enough to write directly; humans can maintain the code |
| System architecture, flowcharts, sequence diagrams | **D2/Mermaid (Option C)** | Purpose-built diagram languages with automatic layout |
| Converting a raster image to SVG | **Quiver vectorize (Option D)** | AI-powered raster-to-vector conversion |
| Illustration FOR a slide/marketing layout | **Quiver (Option D) → Figma (Option A)** | Generate the illustration with Quiver, import into Figma, compose with brand elements and text — see hybrid workflow in Option D |
| Photorealistic images, product mockups, realistic scenes | **GPT Image (Option E)** | AI-generated raster — photographic quality, studio lighting, realistic materials |
| Hero images with photographic quality | **GPT Image (Option E)** | Raster output at up to 1536x1024; use `--quality high` for best results |
| Image editing (inpainting, background swap, style transfer, object removal) | **GPT Image edit (Option E)** | Modify existing raster images with natural language instructions |
| Raster image FOR a slide/marketing layout | **GPT Image (Option E) → Figma (Option A)** | Generate raster image, place in Figma as image fill, compose with brand elements and text |
| Tutorial walkthrough / UX highlight (SaaS "click here" guides) | **Figma (Option A)** — spotlight cutout pattern | Screenshot as image fill + boolean subtract overlay. See Pattern: Spotlight cutout in `references/figma-console-tools.md` |

**Do NOT use GPT Image for:**
- Vector graphics (icons, logos, illustrations that need to scale) — use Quiver (Option D). Raster images pixelate when scaled; SVGs scale infinitely.
- Editable layouts, text-heavy designs — use Figma (Option A). Raster images can't be edited by designers.
- Diagrams, flowcharts, architecture — use D2/Mermaid (Option C). GPT Image can't produce structured, accurate diagrams.
- Assets that ship as code (inline SVGs, repo-committed graphics) — use Quiver or hand-coded SVG. Raster files are large and not code-editable.

**Do NOT use Quiver for:**
- Graphics that must include the Inkeep brand mark — Quiver will hallucinate a logo. Use Figma for brand mark placement; Quiver can generate surrounding artwork.
- Data visualizations (charts, graphs) — Quiver can't hit exact data values. Use hand-coded SVG or D2.
- Precise text layout (body copy, tables, feature lists) — Quiver renders text as vector paths, not `<text>` elements. Result is non-editable and imprecise for multi-line copy.
- SVGs that developers will hand-edit — Quiver output is machine-generated paths (clean but not semantic). Hand-coded SVG is better for human-maintained files.
- Exact reproduction of an existing Figma component — use Figma to clone it.

- **Existing asset**: if user provides a Figma URL or file reference, use it as the starting point (skip step 2)
- **Content**: what the graphic should depict or communicate

### 2. Find a starting point, collect assets, and pull brand tokens

⛔ **Mark task "Graphics: Collect assets & brand tokens" as `in_progress` before proceeding.**

Before creating from scratch, search for existing assets to build from. **Always use the Figma MCP for navigation** — never the browser.

**a) Check the Brand Assets page first**

The Inkeep Design Assets file (`D7NDSM2peo1iLhkjLxmGP5`) has a curated **Brand Assets** page (node `5003:63`) with 148 atomic graphical elements organized into 8 sections. Search here first for logos, icons, illustrations, backgrounds, and third-party logos.

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

**d) Present options to the user**

| What was found | Default action |
|---|---|
| Existing Figma asset closely matches the request | Use it as the structural reference, adapt or build on it |
| Related assets found (similar but not exact) | Show them to user, ask: adapt existing pattern or create fresh |
| Relevant page found but no exact match | Extract layout/style patterns from the page to guide creation |
| Nothing relevant found | Create fresh — propose 2–3 variations in the plan phase (step 4) |
| User provided a specific Figma URL | Use that asset as the reference |

Wait for user confirmation before proceeding.

**Building for an existing presentation:** When the graphic targets a specific slide in an existing deck (Google Slides, Keynote, PowerPoint), export the relevant slides as PDF and visually cross-reference before designing. Pay attention to:
- Which specific icons/marks the deck uses (e.g., a favicon variant vs the full logo mark) — don't assume; match exactly
- What text comes from the slide master/layout vs. what's on the slide itself — you'll need to avoid duplicating master-provided elements
- The deck's visual weight and density — match the existing slides' level of detail

**e) Pull brand tokens from Figma**

Use the Figma MCP to extract brand tokens from the design system.

**Load:** `references/brand-tokens.md` for the Figma file URL and fallback token values.

Extract:
- **Color palette**: primary, secondary, accent, background, text colors with exact hex values
- **Typography**: font families, weights, size scale
- **Spacing**: padding, margins, grid units
- **Border radius**: corner rounding conventions
- **Shadows/effects**: drop shadows, glows, gradients

If referencing an existing Figma asset, also extract its specific layout, dimensions, and visual structure.

**f) Verify brand font availability**

The Inkeep brand font (Neue Haas Grotesk Display Pro) is a paid/custom font. If it's not available in the target Figma file, text operations will silently fail or fall back to a default — producing off-brand graphics with no warning.

Check font availability early via `figma_execute`:
```javascript
const fonts = await figma.listAvailableFontsAsync();
const brandFonts = fonts.filter(f => f.fontName.family.includes('Neue Haas'));
console.log('Brand fonts available:', brandFonts.map(f => `${f.fontName.family} ${f.fontName.style}`));
```

- If brand fonts are found → note the available weights (Bold, Roman, Medium, etc.) in the manifest
- If NOT found → warn the user: "The brand font (Neue Haas Grotesk Display Pro) isn't available in this Figma file. It's likely shared via your team's Figma library — enable it in Assets → Team Library. Without it, text will fall back to a default font." Then ask whether to proceed with a fallback font (Inter is the closest available alternative) or wait.

**g) Produce the Asset Manifest (required before proceeding)**

⛔ **Do NOT proceed to planning or building until you have produced this manifest.** This is the checkpoint that prevents the "skip asset collection" failure mode.

Write out an asset manifest listing what was found and what's missing:

```
## Asset Manifest

### Found (will reuse)
- [x] Inkeep logo — node ID: ___, source file: ___
- [x] Third-party logo (Slack) — node ID: ___, source file: ___
- [x] Brand colors: #FBF9F4, #3784FF, #231F20, ...
- [x] Font: Neue Haas Grotesk Display Pro (Bold, Roman, Medium) — verified available via listAvailableFontsAsync

### Not found (will create)
- [ ] Custom illustration — will build from shapes
- [ ] Connection arrows — will create after layout

### Approximations (MUST justify)
- (list any element where you're using a text/shape stand-in instead of the real asset, with reason)
```

**Rules for the manifest:**
- Every logo MUST be cloned from the Brand Assets page — never approximated with text or shapes
- If a needed asset isn't found after searching, explicitly note the search terms used and sections checked
- If cross-file cloning is impractical, explain why and propose an alternative (e.g., recreate simplified version)
- Approximations are only acceptable for decorative elements, never for brand marks or third-party logos

**Mark task "Graphics: Collect assets & brand tokens" as `completed`.**

### 3. Plan the graphic

⛔ **Mark task "Graphics: Plan composition" as `in_progress`. Verify that "Graphics: Collect assets & brand tokens" is `completed` — if not, go back and complete Step 2 first. Do NOT plan without knowing what assets are available.**

Before generating, plan the composition:
- **Layout**: overall structure, element placement, visual hierarchy
- **Content elements**: text, icons, shapes, images, data points
- **Color mapping**: which brand colors apply to which elements
- **Typography mapping**: which font styles for headings, labels, body text

For diagrams: plan the nodes, edges, groupings, and flow direction.

**Confirm high-cost decisions explicitly.** Some choices are expensive to reverse once built — especially connection elements (arrows, lines) that depend on positions of other elements. Before building, get explicit user confirmation on:
- **Flow direction** (clockwise vs counter-clockwise, left-to-right vs top-to-bottom)
- **Element ordering** (which item goes where in a sequence or cycle)
- **Spatial arrangement** (grid vs radial vs freeform; which elements are adjacent)
- **Containment vs connection** — for architecture diagrams, explicitly ask: *"Is X inside Y, or does X connect to Y from outside?"* Getting this wrong requires tearing down and rebuilding the entire composition. Example: "Are delivery channels part of the platform zone, or separate boxes that connect to it?"

Don't infer these from ambiguous language — describe your interpretation and confirm before committing.

**When the graphic is visually novel** (no existing asset to adapt, no established pattern to follow): default to proposing **2–3 variations** of the composition rather than committing to a single direction. Variations can differ in layout structure, visual metaphor, information hierarchy, or stylistic approach. Present them as lightweight sketches or descriptions — enough for the user to pick a direction before you invest in full execution. This front-loads the biggest design decision and avoids multiple full rebuilds.

If the graphic is adapting an existing asset or following an established pattern, a single plan with user confirmation is sufficient.

Present the plan to the user for review before generating.

**Mark task "Graphics: Plan composition" as `completed`.**

### 4. Generate the graphic

⛔ **Mark task "Graphics: Generate graphic" as `in_progress`. Before creating ANY Figma elements, verify:**
- [ ] **Asset manifest exists** — Step 2 produced a manifest listing found/missing/approximated assets
- [ ] **Brand tokens collected** — you have exact hex colors and font families from the design system, not from memory or the user's message
- [ ] **Logos are real** — any Inkeep or third-party logos are cloned from the Brand Assets page or fetched via `scripts/fetch-logo.ts`, not approximated with text or shapes
- [ ] **Plan was confirmed** — the user reviewed and approved the composition plan

**If any of these are not met, STOP and complete the missing step before proceeding.**

**Load:** `references/figma-console-tools.md` for tool reference and common patterns.

Choose the generation method based on graphic type and output needs:

**Option A: Native Figma design (default — recommended for most graphics)**

Best for: slide assets, marketing visuals, diagrams, social images, cards, hero graphics, tutorial walkthrough highlights — anything that benefits from editability. For tutorial/walkthrough images with spotlight highlights, see **Pattern: Spotlight cutout** in `references/figma-console-tools.md`.

Before starting, verify the Desktop Bridge plugin is running:
1. Call `figma_get_status` to check connection
2. If `setup.valid` is `true` — proceed
3. If `setup.valid` is `false` — guide the user through these steps:
   - "Open your target Figma file in **Figma Desktop** (not browser)"
   - "Right-click the canvas → **Plugins → Development → Figma Desktop Bridge**"
   - "Wait for the green 'MCP Ready' status widget to appear"
   - If the plugin isn't in the menu: "You need to import it first — run `npx figma-console-mcp@latest --print-path` in your terminal, then in Figma: Right-click → Plugins → Development → Import plugin from manifest... → select that path"
   - After the user confirms, call `figma_get_status` again to verify

Follow the five-phase workflow below. Do NOT try to build the entire graphic in one pass.

#### Phase A: Stage collected assets into the working file

**Goal:** Transfer the assets identified in Step 2's Asset Manifest into the target Figma file. This phase executes the manifest — it does not redo the search.

For each "Found (will reuse)" item in the manifest:
1. **Navigate** to the source file (`figma_navigate`)
2. **Locate** the asset by node ID
3. **Clone or transfer** it into the target file (see cross-file strategies below)
4. **Verify** the cloned asset looks correct (screenshot)

**Cross-file asset transfer strategies:**

| Situation | Strategy |
|---|---|
| Simple shapes or components | Clone within Figma (same file), or recreate in the target file |
| Complex icons/illustrations | Do NOT try to SVG-export and re-import — complex Figma vectors produce 100-500KB SVGs that are impractical to transfer. Instead, screenshot the original for reference and recreate a simplified version in the target file using basic shapes and vector paths. |
| Style values (colors, fonts, spacing) | Extract the values and apply them directly — no need to transfer nodes |

Always call `figma_navigate` to switch active file context before accessing nodes in a different file.

**Missing third-party logos:** When a needed third-party logo isn't in the Brand Assets page:

Use the fetch-logo script to find and download the SVG in a single call. It checks Simple Icons, Iconify, and Brandfetch in parallel and returns the best result:

```bash
bun scripts/fetch-logo.ts --name "Freshdesk" --domain "freshdesk.com" --output /tmp/freshdesk.svg
```

The script outputs JSON to stdout with the SVG content, source, and metadata. Use `--prefer color` (default) for full-color logos or `--prefer mono` for monochrome. Use `--theme dark` for dark-mode variants.

**Load:** `references/svg-logo-sources.md` for source details, coverage gaps, and manual API patterns if needed.

Import the resulting SVG into Figma via `figma.createNodeFromSvg(svgString)` in `figma_execute`. After import:
- Name the node with `third-party/` prefix (e.g., `third-party/freshdesk`)
- Adapt to the graphic's visual treatment — if other logos are monochrome/grey, convert the imported logo to match (replace fills with the target color)
- **Preserve the SVG's aspect ratio when resizing.** Extract the viewBox dimensions (e.g., `viewBox="0 0 24 24"` → 1:1 ratio) and calculate target dimensions from that ratio. Never hardcode arbitrary width/height that doesn't match the viewBox. For example, a 24×24 viewBox resized to 60px wide must be 60×60, not 120×60.
- Scale to match sibling logo sizes (maintaining the aspect ratio above)

If the script returns `"found": false` or SVG import fails, create a styled text pill as a placeholder (brand name in a rounded rectangle) and flag it for the user to replace manually.

**Checkpoint:** All "Found" items from the manifest are staged in the working file. Screenshot to verify.

#### Phase B: Gap analysis and creation plan

**Goal:** For every "Not found" item in the Asset Manifest, plan exactly how to create it.

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

⛔ **Keep each `figma_execute` call to ONE logical operation** — create one element, style one element, move one element. Never create an entire composition in a single call. Large multi-element calls timeout (30s limit), leave partial state when they fail, and skip the per-atom verification that catches issues early. INSTEAD: create → screenshot → verify → next element.

Create a temporary working frame to build atoms in isolation:
```javascript
// via figma_execute
const workingFrame = figma.createFrame();
workingFrame.name = "Working — Atoms";
workingFrame.resize(2000, 2000);
workingFrame.layoutMode = 'VERTICAL';
workingFrame.primaryAxisAlignItems = 'MIN';
workingFrame.counterAxisAlignItems = 'MIN';
workingFrame.itemSpacing = 24;
workingFrame.paddingLeft = workingFrame.paddingRight = workingFrame.paddingTop = workingFrame.paddingBottom = 24;
workingFrame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
```

For each element in the build plan:
1. **Create it** using the appropriate figma-console tool
2. **Style it** — apply brand colors, fonts, corner radius, shadows
3. **Name it** — descriptive layer name immediately (`figma_rename_node`). Use these conventions:

   | Layer type | Name | Examples |
   |---|---|---|
   | Background | `bg` | `bg` |
   | Content group | `content` | `content` |
   | Headings | `headline`, `subhead` | `headline` |
   | Body text | `body` | `body` |
   | Images | `img-{desc}` | `img-hero`, `img-avatar` |
   | Icons | `icon/{name}` | `icon/arrow-right` |
   | Decorative | `deco-{desc}` | `deco-gradient`, `deco-line` |
   | Logo | `logo-lockup` | `logo-lockup` |
   | CTA | `cta` | `cta` |
   | Third-party logos | `third-party/{name}` | `third-party/vercel` |

4. **Screenshot it** — `figma_capture_screenshot` to verify it looks correct
5. **Fix issues** — if the screenshot shows problems, fix before continuing

Once simple atoms are verified, compose them into compound elements (group into auto-layout frames, set spacing/padding, screenshot and verify).

**Checkpoint:** Screenshot the entire working frame. Verify:
- [ ] Every planned atom exists (nothing left as placeholder)
- [ ] Brand colors exact, fonts correct
- [ ] **Aspect ratios preserved:** for every imported SVG, compare the rendered width:height ratio against the source viewBox. A 24×24 viewBox must render square; a 100×25 viewBox must render 4:1. If any element looks stretched or squished, fix it before proceeding.
- [ ] Compound elements hold together visually
- [ ] All layers have descriptive names

Fix any issues now — it's much easier to fix individual atoms than after composition.

#### Phase D: Compose the final design

**Goal:** Assemble verified atoms into the final graphic layout.

1. **Create the root frame** at target dimensions with background fill and auto-layout. **Every frame must use auto-layout** — the only exception is decorative overlays (badges, background patterns) which use "Ignore auto layout" to float above content. Set sizing on each element using this matrix:

   | Sizing mode | Use for | Examples |
   |---|---|---|
   | **Hug contents** | Containers that adapt to content | Buttons, badges, tags, inline labels |
   | **Fill container** | Elements that stretch to fill parent | Text blocks in cards, images, content areas |
   | **Fixed** | Elements with mandatory exact dimensions | Logos, icons, avatars, root page frames |

   **Critical rule:** If any child is set to Fill, the parent auto-switches from Hug to Fixed on that axis (circular dependency prevention).

   Use spacing values from the brand tokens spacing scale (see `references/brand-tokens.md`) — never ad-hoc pixel values.

2. **Build the layout structure** — section frames (header, content, footer, etc.) with auto-layout for editability. Stack layers bottom-to-top: `bg` → structure containers → content (text, images) → branding (logo) → decorative overlays. This ordering must be consistent across all frames.
3. **Move atoms into the composition** — move or clone verified atoms from the working frame into their correct sections, position according to the composition plan
4. **Add connection elements last** — lines, arrows, and connectors depend on final positions. Create them after everything else is placed. Verify connections visually — lines should touch their target elements, not float nearby. **If any layout change happens after connectors are placed** (card resizing, repositioning, re-centering), **delete and rebuild all connectors from scratch** — adjusting individual connectors is error-prone and slower than a clean rebuild.

**Dimensional changes cascade.** Changing an element's width or height can cause content to reflow (e.g., text wrapping changes line count, which changes container height, which collapses spacing with neighbors). Screenshot after **every** dimensional change to catch cascading layout breakage before it compounds.

**Checkpoint:** Full screenshot of the composed design. Verify:
- [ ] All elements from the plan are present
- [ ] Layout matches the composition plan
- [ ] Connection elements actually connect to their targets
- [ ] Visual hierarchy reads correctly
- [ ] Text is readable at intended display size (see output medium table in Step 1)
- [ ] No content overflow or collapsed spacing from dimensional changes
- [ ] **Bounds check:** every child element fits within its parent frame. Run this programmatic check via `figma_execute` — don't rely on visual inspection alone for edge clipping (screenshots miss 2-4px overflow). This is the #1 cause of text cutoff and content clipping:
   ```javascript
   const parent = await figma.getNodeByIdAsync('PARENT_ID');
   const issues = [];
   for (const child of parent.children) {
     const cb = child.absoluteBoundingBox;
     const pb = parent.absoluteBoundingBox;
     if (!cb || !pb) continue; // null = invisible node, skip
     if (cb.x < pb.x || cb.y < pb.y ||
         cb.x + cb.width > pb.x + pb.width ||
         cb.y + cb.height > pb.y + pb.height) {
       issues.push({ name: child.name, id: child.id, overflow: 'extends beyond parent' });
     }
   }
   return issues.length ? issues : 'All children within bounds';
   ```
- [ ] **Sibling consistency:** for repeating elements (card grids, icon rows, tag lists), verify that siblings have matching visual weight — equal heights, same number of text lines, consistent padding. A single-line label next to a two-line label misaligns everything below it. Fix content or equalize container sizes before moving on.
- [ ] **If adapting an existing asset:** screenshot the original reference AND your output — compare element-by-element. "The original" means the source Figma file, not any derived copy (not your HTML mockup, not your plan description). Check arrow directions, element ordering, label placement, and logo usage against the actual source.

#### Phase E: Polish and verify

**Goal:** Final refinements and quality check.

**Before major revisions:** If the user requests substantial changes to a composed design (not minor tweaks), duplicate the current frame and rename it as a version snapshot (e.g., "Intelligence Layer — v1"). Work on the copy. This provides safe rollback and enables side-by-side comparison when evaluating changes with the user.

1. **Alignment and spacing** — consistent spacing, proper alignment, visual balance
2. **Layer organization** — descriptive names on all layers, logical layer order (background → structure → content → decorative)
3. **Final screenshot** — verify brand colors exact, typography correct, no placeholders, connections attached, design looks intentional. For imported SVGs, explicitly verify aspect ratios one more time: compare each logo's rendered proportions against its source viewBox — stretched or squished logos are the most common visual defect that passes casual inspection. If adapting an existing asset, do a final A/B comparison with the original source file.
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

**Option D: AI-generated SVG via Quiver (for illustrations, logos, icons, vector art)**

Best for: illustrations, icons, logos, abstract art, decorative elements, background patterns, custom letterforms — anything with complex vector paths that would be impractical to hand-code. Arrow (Quiver's model) is #1 on SVG Arena and produces clean, layered, editable SVG with semantic grouping.

**Load:** `references/quiver-api.md` for full API details, script usage, and parameter reference.

**Prerequisite:** `QUIVERAI_API_KEY` must be set. If missing, the script will error with setup instructions. If the user doesn't have a key, direct them to https://quiver.ai → Settings → Developers → API Keys.

**Generation workflow:**

1. **Craft the prompt** using a 5-component structure:

   ```
   [Subject] + [Style] + [Color palette] + [Composition] + [Constraints]
   ```

   | Component | What to include | Example |
   |---|---|---|
   | **Subject** | Specific description of what's depicted | "A rocket launching from a laptop screen" |
   | **Style** | Aesthetic direction using vocabulary the model responds to (see below) | "flat geometric style" |
   | **Color palette** | Explicit hex codes for tight control | "using #3784FF and #FBF9F4" |
   | **Composition** | Framing and spatial arrangement | "centered, square viewport" |
   | **Constraints** | What to exclude or limit | "no text, no gradients, 3-4 colors max" |

   **Style vocabulary Arrow responds well to:** flat, geometric, minimal, line art, duotone, isometric, hand-drawn, woodblock, heraldic, calligraphic, ornate, continuous stroke, monochrome, organic.

   **Good prompt:**
   ```
   "A crane bird in traditional woodblock illustration style with warm earth tones, centered composition, clean lines, no text"
   ```

   **Bad prompt:**
   ```
   "A nice bird picture"
   ```
   Vague prompts produce vague results and burn credits. Be specific about subject, style, and constraints.

2. **Set the `instructions` parameter for persistent brand constraints.** The `instructions` channel is separate from `prompt` — use it for brand rules that apply regardless of the subject:

   ```
   --instructions "Brand constraints:
   - Colors: background #FBF9F4, accent #3784FF, primary #1A1A1A, secondary #6B6B6B
   - Style: clean, minimal, geometric, consistent with Inkeep brand
   - No photorealistic elements
   - No gradients unless explicitly requested
   - No text unless explicitly requested (text renders as paths, not editable)"
   ```

   The separation matters: `prompt` describes *what to draw*, `instructions` describes *how to style it*. This gives tighter, more consistent results than putting everything in one field.

3. **Set temperature based on intent:**

   | Intent | Temperature | Why |
   |---|---|---|
   | Brand-consistent icon set | 0.3–0.5 | Low variation; each icon should match the others |
   | On-brand illustration (known style) | 0.5–0.7 | Some creative range within brand constraints |
   | Creative exploration (novel graphic) | 1.0–1.5 | Maximum variation; generate 2-3 variants for user to pick |

   The script doesn't expose `--temperature` yet — for now, the default (1.0) works for most requests. For icon sets where consistency matters, consider adding temperature support to the script.

4. **Use reference images for style consistency.** Export 1-2 existing brand assets from Figma as PNG and pass as `--references`:

   ```bash
   # Export an existing Figma asset to PNG first (via figma_execute):
   # node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } })

   bun scripts/quiver-generate.ts generate \
     --prompt "Icon for AI-powered search" \
     --references /tmp/existing-brand-icon.png \
     --instructions "Match the visual style of the reference. Use #3784FF accent." \
     --output search-icon.svg
   ```

   **When to use references:**
   - **Icon sets** — generate the first icon, then use it as `--references` for subsequent icons so they all share the same visual language
   - **Style matching** — when the output must feel like it belongs alongside existing brand assets
   - **Color palette transfer** — the model picks up the palette from references

   **When references don't help:**
   - Exact reproduction (references guide style, they don't clone the image)
   - Passing a photo when you want a flat vector (mismatched style signals)

5. **Generate.** For novel graphics, generate 2-3 variants (`--n 3`) so the user can pick a direction:
   ```bash
   bun scripts/quiver-generate.ts generate \
     --prompt "Abstract illustration of AI agents collaborating, flat geometric style" \
     --instructions "Colors: #FBF9F4 background, #3784FF accent, #1A1A1A primary. Minimal, clean." \
     --n 3 \
     --output agent-collab.svg
   ```
   Each variant costs 1 credit. Don't generate more variants than needed — `--n 2` or `--n 3` is usually sufficient.

6. **Review output.** The script auto-generates PNG previews alongside each SVG. Visually inspect the PNG using the Read tool (which displays images), then also check the SVG source for objective compliance:

   **Visual inspection (Read the PNG):**
   - Does the graphic match the prompt intent?
   - Is the visual style consistent with the brand?
   - Is the composition clean and intentional?

   **Source inspection (Read the SVG):**
   - Grep hex values — do they match the brand palette (`#FBF9F4`, `#3784FF`, `#1A1A1A`, `#6B6B6B`)?
   - Any unwanted `<text>` elements when "no text" was specified?
   - Is the SVG valid and reasonable size?

   **If objective failures (wrong colors, unwanted elements):** fix the prompt/instructions and regenerate (up to 2 retries). Don't keep generating indefinitely — if 3 attempts miss, adjust the approach or ask the user.

   **If objectively OK but aesthetics are uncertain:** show the PNG preview to the user and let them drive subjective feedback ("make it more geometric", "try warmer tones", "less busy").

   **Iteration strategy when output misses:**
   - **Wrong style:** Adjust the style vocabulary in the prompt (e.g., "flat geometric" → "minimal line art")
   - **Wrong colors:** Make hex codes more explicit in `instructions`; add "ONLY use these colors"
   - **Too complex:** Add constraints: "simple, 3-5 elements max, clean lines"
   - **Too simple:** Add detail to the subject description; remove "minimal" constraints
   - **Inconsistent with brand:** Add a reference image from Figma exports

**Hybrid workflow: Quiver → Figma (for composed graphics)**

When the final deliverable needs both AI-generated artwork AND brand elements, text, or precise layout — generate the illustration with Quiver, then compose in Figma:

1. **Generate the artwork** with Quiver (steps 1-6 above) — focus on the illustration/icon/decorative element only, not the full layout
2. **Import into Figma:**
   ```javascript
   // via figma_execute
   const fs = require('fs');
   const svgString = '...'; // Read the SVG file content
   const imported = figma.createNodeFromSvg(svgString);
   imported.name = "Quiver — [descriptive name]";
   ```
3. **Compose in Figma** using the Option A workflow — add brand logos (cloned from the design system, never generated by Quiver), text (using proper fonts and `<text>` elements), layout structure, and other elements
4. **Apply brand consistency** — verify the imported Quiver artwork looks right alongside Figma-native elements

This hybrid approach is the right default for: slide deck illustrations, marketing hero images, social graphics that need both artwork and text, any graphic that needs the Inkeep logo alongside custom illustration.

**Vectorization workflow** (raster image to SVG):

```bash
bun scripts/quiver-generate.ts vectorize \
  --image screenshot.png \
  --output vectorized.svg
```

Use this when you need to convert an existing raster asset (screenshot, PNG export, photo) into clean, editable SVG. The vectorization preserves structure and separates elements into layers.

**Option E: AI-generated raster images via GPT Image 1.5 (for photorealistic images, mockups, image editing)**

Best for: photorealistic product shots, hero images, editorial illustrations with photographic quality, image editing (inpainting, background replacement, style transfer, object removal). GPT Image 1.5 is #1 on LM Arena (Elo 1268) — best-in-class for photorealism and text-in-image rendering.

**Load:** `references/openai-image-api.md` for full API details, script usage, and parameter reference.

**Prerequisite:** `OPENAI_API_KEY` must be set. If missing, the script will error with setup instructions. Pull from 1Password: `./secrets/setup.sh --skill graphics --account inkeep.1password.com`

**Generation workflow:**

1. **Craft the prompt** — be specific about subject, setting, lighting, camera perspective, and materials:

   **Good prompt:**
   ```
   "A close-up product photograph of artisan coffee beans spilling from a burlap sack
   onto a dark wooden table, warm directional lighting from the left, shallow depth of field"
   ```

   **Bad prompt:**
   ```
   "coffee beans"
   ```

   For brand-consistent images, include hex colors and style direction:
   ```
   "A hero image for a tech company website. Warm cream background (#FBF9F4),
   subtle geometric patterns in blue (#3784FF). Clean, modern, minimal. No text."
   ```

2. **Generate** — default is `--quality high` for best results:
   ```bash
   bun scripts/image-generate.ts generate \
     --prompt "A photorealistic product shot of a laptop on a marble desk" \
     --quality high \
     --size 1536x1024 \
     --output product-shot.png
   ```

   For exploration, generate 2-3 variants:
   ```bash
   bun scripts/image-generate.ts generate \
     --prompt "Abstract hero image with geometric shapes" \
     --n 3 \
     --output hero-variants.png
   ```
   Each image at high quality costs ~$0.17-0.25. Don't generate more variants than needed.

3. **Review output** — use the Read tool on the PNG to visually inspect:
   - Does the image match the prompt intent?
   - Are brand colors accurate (if specified)?
   - Is the composition and lighting appropriate for the use case?
   - Any artifacts, unwanted text, or quality issues?

   **If the output misses — iteration strategy:**
   - **Wrong lighting/mood:** Add explicit lighting direction ("warm light from left", "soft diffused studio lighting")
   - **Wrong composition:** Specify camera angle ("shot from above", "eye-level", "close-up macro")
   - **Wrong colors:** Include hex codes directly in the prompt
   - **Unwanted elements:** Add negative constraints ("no text", "no people", "no watermarks")
   - **Too generic:** Add material/texture descriptions ("matte finish", "brushed metal", "rough linen")

   **Autonomous retry for objective failures** (wrong subject, completely off-prompt): fix the prompt and regenerate (up to 2 retries). **Aesthetic judgment goes to the user** — show the image and let them direct refinement.

**Editing workflow** (inpainting, background replacement, style transfer):

```bash
# Replace background
bun scripts/image-generate.ts edit \
  --prompt "Replace the background with a gradient from cream #FBF9F4 to light blue" \
  --image original.png \
  --output new-background.png

# Targeted edit with mask (transparent areas = edit region)
bun scripts/image-generate.ts edit \
  --prompt "Fill the masked area with a potted plant" \
  --image room.png \
  --mask area-to-fill.png \
  --output with-plant.png

# Style transfer
bun scripts/image-generate.ts edit \
  --prompt "Apply a warm, vintage film photography look while preserving the subject" \
  --image modern-photo.png \
  --output vintage-style.png
```

**Transparent background** (for compositing in Figma):

```bash
bun scripts/image-generate.ts generate \
  --prompt "A coffee cup, studio lighting, isolated object" \
  --background transparent \
  --output-format png \
  --output coffee-cup.png
```

**Hybrid workflow: GPT Image → Figma (for composed graphics)**

When the final deliverable needs both a photorealistic image AND brand elements, text, or precise layout — generate the raster image with GPT Image, then place it in Figma:

1. **Generate the image** with GPT Image (steps above) — use `--background transparent` if the image will be layered over other elements
2. **Export** the PNG to a location accessible to Figma
3. **Place in Figma** — use `figma_execute` to create an image fill on a rectangle, or guide the user to drag-and-drop the PNG into their Figma file
4. **Compose in Figma** using the Option A workflow — add brand logos, text, layout structure around the raster image
5. **Apply brand consistency** — verify the raster image looks right alongside Figma-native elements

This hybrid approach is the right default for: slide deck hero images, marketing materials that need both photography and text, social graphics with product mockups, any graphic that needs photorealistic imagery alongside brand elements and precise text layout.

### 5. Apply brand consistency

**Mark task "Graphics: Generate graphic" as `completed`. Mark task "Graphics: Brand consistency check" as `in_progress`.**

After generating, verify the graphic matches the brand:
- [ ] Colors match the brand palette exactly (no approximations)
- [ ] Typography uses brand font families
- [ ] Spacing follows brand conventions
- [ ] Visual style is consistent with existing brand assets
- [ ] Appropriate use of gradients, shadows, or effects

For Figma designs:
1. Take a screenshot (`figma_capture_screenshot`) and visually verify
2. Run `figma_lint_design` on the root frame to catch issues screenshots miss:
   - **Hardcoded colors** not bound to variables (visually identical but not token-linked)
   - **Unnamed layers** (default names like "Frame 47", "Rectangle 12")
   - **WCAG contrast violations** (AA 4.5:1 for normal text, 3:1 for large text)
   - **Text below 12px**, interactive targets below 24x24px, line height below 1.5x
   - **Missing text styles**, detached components, frames without auto-layout
3. Fix any critical/warning findings before delivering

For SVGs: validate the code is clean and renders correctly.

**Mark task "Graphics: Brand consistency check" as `completed`.**

### 6. Export and deliver

**Mark task "Graphics: Export & deliver" as `in_progress`.**

**For Figma designs (primary):**
1. Verify the design in Figma:
   - [ ] Correct dimensions and aspect ratio
   - [ ] All layers are named descriptively
   - [ ] Auto-layout is applied where appropriate (for editability)
   - [ ] Text is readable at the intended display size
   - [ ] No orphaned or mispositioned elements
2. Share the Figma file URL with the user
3. If PNG/SVG export is also needed, use `figma_execute` to export or guide the user to export from Figma

**Handoff to Google Slides:** When the graphic needs to land in a Google Slides deck:
1. **Strip master-provided elements** — if the target slide's layout/master provides headers, labels, or icons, create a separate export version of the Figma frame with those elements removed to avoid visual doubling
2. **Export** — use `figma_execute` with `node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 4 } })` for high-res output
3. **Host the image** — Google Slides `add_image_to_slide_tool` requires a publicly accessible URL. Export to base64, save locally as PNG, upload to a temporary host or Google Drive
4. **Place the image** — coordinate mapping from Figma to Google Slides: `gslides_pt = figma_px × 0.75` (for 960×540 Figma canvas → 720×405 pt Google Slides). Full-slide placement: `x=0, y=0, width=720, height=405`
5. **Verify** — export the slide as PDF and visually confirm alignment with the slide master

This pipeline has friction (public hosting, coordinate mapping, master element stripping). When possible, defer to the **gslides skill** for the full insertion workflow.

**For code-based outputs (SVG, D2, Mermaid):**
1. Save the graphic to the appropriate location
2. If multiple formats needed, export both SVG and PNG
3. Verify:
   - [ ] Correct dimensions and aspect ratio
   - [ ] Clean rendering at target size
   - [ ] Text is readable at the intended display size
   - [ ] If SVG: no broken references, valid markup
4. Share the file path or output with the user

⛔ **Final visual inspection (REQUIRED before telling the user the graphic is done).**

Screenshot every deliverable at its final dimensions using `figma_capture_screenshot`. Visually inspect each one and verify:
- [ ] Nothing looks "off" — no clipped text, overflow, misalignment, or visual artifacts
- [ ] Text is fully readable and not truncated or wrapping unexpectedly
- [ ] All elements are within frame bounds (nothing cut off at edges)
- [ ] Colors look correct — no wrong fills, missing backgrounds, or transparency issues
- [ ] Logos and brand marks are present and look right (not placeholder text or shapes)
- [ ] Overall composition looks intentional and professional — not like a work-in-progress

**If ANY issue is found, fix it and re-screenshot before proceeding. Do NOT tell the user the graphic is complete until every deliverable passes this inspection.**

For multi-graphic deliverables (e.g., 5 thumbnail options): screenshot and inspect EACH one individually. Do not declare the set complete after checking only one.

**Mark task "Graphics: Export & deliver" as `completed`.**

## Quality bar

Must have:
- [ ] Checked master designs and Figma before creating from scratch
- [ ] All colors match brand palette exactly
- [ ] Typography uses brand fonts
- [ ] Output format matches the use case (Figma for editable, Quiver for vector illustrations/icons, GPT Image for photorealistic raster, D2 for technical)
- [ ] Deliverable shared with user (Figma URL or file path)
- [ ] For Figma: no placeholder content — every element is real (actual logos, icons, text)
- [ ] For Figma: visual checkpoint completed at each workflow phase
- [ ] For Quiver: brand colors and style constraints passed via `instructions` parameter (never generate without brand instructions)
- [ ] For Quiver: SVG output reviewed — verify hex colors in source match brand palette
- [ ] For GPT Image: output visually inspected via Read tool before delivering
- [ ] For GPT Image: quality set to `high` unless user explicitly requested lower

Should have:
- [ ] Plan reviewed by user before generation
- [ ] Consistent with existing brand assets in style and feel
- [ ] For Figma: layers named descriptively, auto-layout applied for editability
- [ ] For Figma: atoms built and verified individually before composition
- [ ] For SVG: clean, well-structured code
- [ ] For Quiver: reference images used when generating icon sets or matching existing brand style
- [ ] For Quiver: prompt uses 5-component structure (subject + style + palette + composition + constraints)
- [ ] For GPT Image: brand colors included as hex codes in the prompt when brand consistency matters
- [ ] For GPT Image: `--background transparent` used when image will be composited in Figma
- [ ] Multiple sizes if needed for different contexts

## Anti-patterns

- **One-shot generation**: Never try to build the entire graphic in one pass. INSTEAD: one `figma_execute` call per element → screenshot → verify → next element. Build atoms individually in a working frame, then compose into the final layout.
- **Placeholder content**: Never leave "Icon here", empty shapes, or "TODO" labels. INSTEAD: search Brand Assets page (logos, icons, third-party logos), then SVG logo sources (`references/svg-logo-sources.md`). If truly unfindable, create a styled text pill and flag it for the user to replace.
- **Skipping visual checkpoints**: Don't assume it looks right. INSTEAD: `figma_capture_screenshot` after creating each atom, after each dimensional change, and before delivering. Run `figma_lint_design` at Step 5 to catch what screenshots miss (hardcoded colors, contrast, unnamed layers).
- **Creating from scratch when a Figma component exists**: INSTEAD: always search Brand Assets page (node `5003:63`) first — 148 curated assets including logos, icons, illustrations, backgrounds, third-party logos. Check `references/master-designs.md` navigation table for which section to search.
- **Generating SVG when Figma-native is better**: Default to Figma designs for slide/marketing assets — they're editable and reusable. Use SVG only when code output is specifically needed.
- **Approximate colors**: Use exact hex values from the brand, not "close enough" colors
- **Unnamed layers**: Every Figma layer should have a descriptive name, not "Frame 47" or "Rectangle 12"
- **Flat structure without auto-layout**: Use auto-layout frames for sections so the design is easy to edit and resize
- **Ignoring the design system**: Brand tokens exist for a reason — don't freestyle the visual style
- **Skipping the plan**: Always present the composition plan before generating
- **Forgetting to verify connection**: Always check `figma_get_status` before starting Figma operations
- **Hardcoded dimensions in SVG**: Use viewBox for SVGs so they scale properly
- **Hand-coding SVG for complex illustrations**: When the graphic is an illustration, logo, or stylized icon, use Quiver (Option D) instead of writing SVG by hand — Arrow produces layered vectors with complex paths that are impractical to hand-code
- **Using Quiver for text-heavy graphics**: Quiver renders text as vector paths, not `<text>` elements — the result is non-editable, imprecise for body copy, and can't be spell-checked. Use Figma for anything with substantial text.
- **Using Quiver for the brand mark**: Quiver will hallucinate a logo. Always clone the real Inkeep logo from the design system in Figma. Use the hybrid workflow (Quiver → Figma) when you need both custom artwork and the brand mark.
- **Using Quiver for data visualization**: Quiver can't produce charts with accurate data values. Use hand-coded SVG or D2 for bar charts, line graphs, pie charts.
- **Quiver without brand instructions**: Always pass brand tokens in `--instructions` (separate from `prompt`). Without them, Quiver generates with its own palette. Include explicit hex codes and negative constraints ("no gradients unless specified").
- **Vague Quiver prompts**: "A nice icon" wastes credits and produces random output. Use the 5-component prompt structure: subject + style + color palette + composition + constraints.
- **Skipping Quiver output review**: Always read and verify the generated SVG before delivering — check hex values in the SVG source against the brand palette, not just visual impression
- **Generating too many Quiver variants**: Each variant costs 1 credit. Use `--n 2` or `--n 3` for exploration, not `--n 16`. For brand-consistent work, one well-prompted generation often suffices.
- **Using GPT Image for vector assets**: GPT Image produces raster PNGs that pixelate when scaled. For icons, logos, or illustrations that need to work at multiple sizes, use Quiver (Option D) for SVG output.
- **Using GPT Image for editable layouts**: Raster images can't be edited by designers in Figma. Use Figma (Option A) for layouts with text, brand elements, and precise positioning. Use the hybrid workflow (GPT Image → Figma) when you need both.
- **GPT Image without visual inspection**: Always Read the output PNG before delivering. The agent can see images — verify the result matches intent before showing the user.
- **Excessive GPT Image variants at high quality**: Each high-quality image costs $0.17-0.25. Use `--n 2` or `--n 3` for exploration, not `--n 10`. Use `--quality medium` ($0.04) for rapid iteration, then `--quality high` for the final version.
- **Vague GPT Image prompts**: "A nice photo" produces generic stock imagery. Include subject, lighting direction, camera perspective, materials, and negative constraints for photorealistic quality.
