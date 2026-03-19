---
name: graphics
description: Create on-brand graphics and visual assets as native editable Figma designs. Use when asked to create graphics, visuals, diagrams, charts, social images, slide assets, marketing materials, or any visual asset that should follow the brand. Creates native Figma objects (frames, text, shapes, auto-layout) for full editability. Can also generate SVG via Quiver.ai (AI-generated vector art), photorealistic raster images via AI image generation (GPT Image 1.5 + Gemini 3.1 Flash Image), 3D renders via R3F/Three.js, hand-coded SVG, D2, or Mermaid. Requires figma and figma-console MCP servers. Quiver.ai requires QUIVERAI_API_KEY. Image gen requires OPENAI_API_KEY and GOOGLE_AI_API_KEY.
argument-hint: "[description of graphic needed] (optional: existing Figma URL or asset reference)"
---

# On-Brand Graphics Generator

Create visual assets as native editable Figma designs that follow the Inkeep brand. Primary use case: graphical assets for slide decks, marketing materials, social media, and documentation. Can also generate AI-powered SVGs via Quiver.ai for illustrations, logos, icons, and complex vector art. Can generate photorealistic raster images via AI image generation (GPT Image 1.5 + Gemini 3.1 Flash Image — multi-provider with reference image support). Can render deterministic 3D scenes via R3F/Three.js.

## Prerequisites

This skill requires two MCP servers:
- **figma** (official, HTTP) — read designs, brand tokens, screenshots, design context. Authenticates via OAuth on first use (Claude Code prompts automatically).
- **figma-console** (southleft/figma-console-mcp, stdio) — create and modify native Figma objects. Requires a Figma Personal Access Token + the Desktop Bridge plugin.

**If MCP servers or credentials are missing** (including `QUIVERAI_API_KEY` for SVG generation, `OPENAI_API_KEY` for GPT Image generation, `GOOGLE_AI_API_KEY` for Gemini image generation, and `BRANDFETCH_API_KEY` for third-party logo fetching), instruct the user to run:
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

Option A — automated (macOS): `bash scripts/launch-bridge.sh` opens the Graphics Workspace and launches the bridge by name via menu automation (Plugins → Development → Figma Desktop Bridge).

Option B — manual:
1. Open your target Figma file in Figma Desktop
2. Right-click canvas → **Plugins → Development → Figma Desktop Bridge**
3. Wait for the green "MCP Ready" status widget

**Connection stability:** The plugin stays connected as long as the Figma tab remains open and the plugin UI is visible. Known disconnect triggers:

| Trigger | Auto-reconnects? | What to do |
|---|---|---|
| Figma tab refresh or file reload | No | Re-launch plugin from Plugins menu |
| Closing the Figma tab with plugin | No | Re-open file, re-launch plugin |
| Figma Desktop app restart | No | Re-launch plugin |
| MCP server restart (Claude Code session restart) | Yes (up to 5 retries) | Wait ~10s, then verify with `figma_get_status` |
| Idle / inactivity | No disconnect | N/A — connection persists |

**If the plugin disconnects mid-session**, try programmatic recovery before asking the user to manually re-launch:
1. Call `figma_reconnect` — forces a WebSocket reconnection. Resolves most stale-connection issues.
2. If that fails, call `figma_reload_plugin` — fully reloads the plugin (equivalent to re-launching from the menu).
3. Only if both fail, guide the user to manually re-launch: right-click canvas → Plugins → Development → Figma Desktop Bridge.

**Multi-file connections:** The plugin can run in multiple Figma files simultaneously — each file gets its own WebSocket connection tracked by `fileKey`. To work across files (e.g., cloning assets from the Inkeep Brand Assets file into the Graphics Workspace), the plugin must be running in **both** files. Verify with `figma_list_open_files` before cross-file operations. Use `figma_navigate` to switch the active file context.

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
return { pageId: page.id, pageName: page.name }; // IMPORTANT: store pageId for all subsequent operations
```

Page naming: `[YYYY-MM-DD] {medium} — {project description}`. This prevents overlap between sessions and keeps the workspace organized.

⚠️ **Parallel-safety (multiple Claude Code instances on the same file):** Multiple agents may operate on the same Figma file simultaneously (on different pages). `figma.currentPage` is **global** — if another agent calls `setCurrentPageAsync`, your `currentPage` reference silently points to the wrong page. To avoid this:
- **Store your page's node ID** from the `createPage()` return value above
- **Always use `getNodeByIdAsync(pageId)`** to scope searches — never `figma.currentPage.findOne()`
- **Always pass explicit `nodeId`** to `figma_capture_screenshot` — never rely on "capture current page"
- Node operations by ID (`getNodeByIdAsync`, `figma_set_text`, `figma_set_fills`) are safe — they target specific nodes regardless of which page is "current"

**Frame naming within pages:** Follow professional conventions — `AssetType/Platform/Variant` (e.g., `Social/LinkedIn/Post-Dark`, `Blog/Cover/Agents-in-Slack`). Slash-separated names create automatic hierarchy in the Assets panel and nested folders on export.

### Design Tokens

The Inkeep Brand Assets file contains the canonical design token system as Figma variables across 5 collections. **Always use these tokens instead of hardcoding hex values.**

**Load:** `/brand` skill for brand identity (principles, logo rules, typography, color usage, illustration style, composition patterns, element recipes). For applying tokens in Figma code, **Load:** `references/figma-patterns.md` file. For full token values, read `tokens/marketing.md`.

| Collection | What it covers | Key usage rules |
|---|---|---|
| **Inkeep Colors** | Core palette, card backgrounds, surface colors, UI utility colors | Bind via `setBoundVariableForPaint`. Card backgrounds rotate through `card/warm-peach`, `card/light-blue`, etc. **Never use #FFFFFF as page background** — use `bg/primary`. |
| **Inkeep Spacing** | Base scale (4-48px) + contextual layout spacing (section gaps, hero padding, page max-width) | Base scale for component internals. Contextual tokens for page layout (`spacing/section-gap` = 100px between sections). |
| **Inkeep Radius** | Full range from 2px micro to 80px large headers | The signature aesthetic uses **large radii**: 32px for feature cards, 47px for use case cards, 60px for hero badges. `radius/pill` (9999) for buttons. |
| **Inkeep Typography** | Font families, semantic sizes, weights, tracking (letter-spacing), leading (line-height) | **Strict rules:** Neue Haas for headings (weight 400), JetBrains Mono for labels (weight 500, **always uppercase**), Noto Serif for body (weight 300). Never mix more than 2 typefaces per component. |

**⚠️ Typography sizing context:** The `font/size-*` tokens in `tokens/marketing.md` (e.g., `font/size-hero: 80px`, `font/size-section: 64px`) are calibrated for the Inkeep marketing **website** at 1280px page width — text on a scrolling page viewed at screen distance. **For standalone graphic canvases** (social banners, blog covers, slides, OG images), derive text sizes from the **format file's canvas-relative typography tiers**, not from these web-page token values. Font families, weights, tracking, and line-heights transfer across contexts; **size values do not**.

**Other property scaling:** Shadows and strokes stay **fixed** at all canvas sizes (they represent depth, not proportion). Corner radii stay **fixed**, but cap at 25% of the element's shortest side to prevent capsule deformation on small elements. Spacing and padding values **>16px scale** by (canvas height ÷ 720) per element-patterns.md rule 3; values ≤16px stay fixed.
| **Inkeep Shadows** | 9 shadow definitions from subtle to brand glow | `shadow/subtle` for cards at rest, `shadow/medium` for hover, `shadow/brand` for blue-tinted glow on branded elements. |

**Discovering tokens dynamically** (always prefer this over hardcoded values):
```javascript
const vars = await figma.variables.getLocalVariablesAsync('COLOR');
const token = vars.find(v => v.name === 'brand/primary');
rect.fills = [figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1 } }, 'color', token
)];
```

**Why tokens matter:** `figma_lint_design` flags hardcoded colors as warnings. Variable binding ensures brand consistency cascades automatically.

**If working in a file without tokens** (user specified a different target): fall back to hex values from `tokens/marketing.md`.

**Why a shared workspace?** Figma has no API to create new files. The workspace prevents: (1) polluting brand asset files with work-in-progress, (2) requiring the user to create a new file for every request, (3) agents working in random/personal Drafts files that aren't team-accessible.

## Workflow

### Exploration is the default

Before starting, assess: **is this a trivial, non-consequential edit of an existing asset** (changing title text, swapping a logo for an updated version, resizing for a different format)?

If **yes** — skip to Step 0 (single-pass mode) and build directly. This is rare.

If **no** — which is the default for any request with meaningful visual direction choices — **Load:** `references/exploration-workflow.md` file and follow the exploration workflow. This applies even to requests that seem "obvious" like diagrams or icons — there are almost always meaningful visual direction choices the user should weigh in on before the agent builds.

The exploration workflow wraps around the existing Steps 0-6. Steps 1-2 (parse, brief, assets) run once at the start. Steps 3-5 (plan, generate, verify) run per-frame inside the exploration loop. Step 6 (export) runs once at the end.

```
Step 1:  Parse request
Step 1b: Creative brief         ← USER CONFIRMS messaging
Step 1c: Product context        ← USER MAY PROVIDE INPUT

Phase 0: Conceptualize          ← USER SELECTS directions (text only)

Step 2:  Collect assets & brand tokens

Phase 1: Diverge (PARALLEL via /nest-claude)
  Parent: create page + N empty Sections, write state.json
  Parent: spawn N child processes (concurrent)
    Each child: read state.json → load skills → plan → build → verify (spawns reviewer) → place in Section
    Each child: write results to build-results/<slug>.json
  Parent: read result files, merge into state.json
  Present to user              ← USER REACTS

Phase 2: Iterate (loop)
  User says something
  Parent: interpret feedback (sequential)
  If ≥2 independent frames: spawn children (PARALLEL)
  If 1 frame or orchestration: parent builds directly
  Present to user              ← USER REACTS
  Repeat until user approves

Step 6:  Export & deliver
```

**Same quality bar at every step.** There is no "quick build" mode. Every element in every frame must be correctly rendered — real logos, correct brand fonts, proper token-referenced colors, appropriate shadows. A Phase 1 direction may have fewer elements than a Phase 2 iteration, but every element present is at production quality and passes the reviewer.

---

### Step 0: Create workflow tasks (MANDATORY FIRST ACTION)

⛔ **Before doing anything else**, create these tasks to track workflow progress. This is not optional — skipping this step is the primary cause of the agent jumping straight to building without collecting assets or brand tokens.

**Exploration mode tasks** (default — when following the exploration workflow):
1. `"Graphics: Parse request"` → set to `in_progress`
2. `"Graphics: Creative brief"` → pending
3. `"Graphics: Conceptualize — Propose directions"` → pending
4. `"Graphics: Collect assets & brand tokens"` → pending
5. `"Graphics: Write build specs & Start Nested Claudes"` → pending
6. `"Graphics: Build directions"` → pending
7. `"Graphics: Craft elevation → Review → Polish"` → pending
8. `"Graphics: Present to user"` → pending (blockedBy: [7])
9. `"Graphics: Iterate on user feedback"` → pending
10. `"Graphics: Export & deliver"` → pending

**Single-pass tasks** (bypass — for trivial edits only):
1. `"Graphics: Parse request"` → set to `in_progress`
2. `"Graphics: Creative brief"` → pending
3. `"Graphics: Collect assets & brand tokens"` → pending
4. `"Graphics: Write build spec"` → pending
5. `"Graphics: Build graphic"` → pending
6. `"Graphics: Craft elevation → Review → Polish"` → pending
7. `"Graphics: Export & deliver"` → pending

As each step begins, mark its task `in_progress`. When the step completes, mark it `completed`. Task 7 (Craft elevation → Review → Polish) in exploration mode stays `in_progress` throughout the 3-pass elevation loop and completes when all frames pass the reviewer. Task 8 (Present) cannot start until task 7 completes — this enforces the "every frame must pass the reviewer before the user sees it" rule structurally. Task 9 (Iterate) stays `in_progress` throughout user feedback rounds and completes when the user approves finals.

**Why this exists:** Without explicit task tracking, the observed failure mode is the agent skipping asset collection (Step 2) and brand token extraction (Step 3), jumping straight to building from scratch with approximated brand elements. This produces off-brand graphics with fake logos and wrong colors.

---

### 1. Parse the request

Identify:
- **Graphic type**: diagram, illustration, icon, social image, chart, infographic, hero image, badge
- **Purpose**: where it will be used (slide deck, docs, website, social media, email)
- **Output medium**: how it will be displayed — this determines minimum text sizes and visual weight

| Medium | Min heading | Min body | Min label | Format file (for recommended targets) |
|---|---|---|---|---|
| Blog cover (1280×720) | 60px | 16px | 9px | `formats/blog-cover.md` |
| Social / OG (1200×630) | 64px | 20px | 10px | `formats/social-og.md` |
| Social post (1200×675) | 60px | 20px | 10px | `formats/social-post.md` |
| LinkedIn post (1200×1200) | 60px | 24px | 14px | `formats/linkedin-post.md` |
| LinkedIn carousel (1080×1080) | 54px | 24px | 14px | `formats/linkedin-carousel.md` |
| Twitter/X (1200×675) | 60px | 20px | 10px | `formats/twitter-x.md` |
| YouTube thumbnail (1280×720) | 60px | — | — | `formats/youtube-thumbnail.md` |
| Slide deck (960×540) | 48px | 18px | 9px | `formats/slide-graphic.md` |
| Email header (1200×500) | 48px | 24px | — | `formats/email-header.md` |

These are **minimum floors**, not targets. The format files contain **canvas-relative typography tiers** with recommended sizes that are significantly larger than these minimums. Always read the format file — the tiers are calibrated from empirical measurements of top-performing B2B companies.

If the user doesn't specify the medium, **ask** — text sizing is the most common source of iteration waste. Default to slide deck sizing when the purpose is "presentation" or "deck."

- **Dimensions**: determine from the output medium. **Load:** the matching `formats/<format>.md` file for exact dimensions, design guidelines, and best practices:

| Medium | Standard file | Default size |
|---|---|---|
| Blog cover / thumbnail | `formats/blog-cover.md` | 1280 x 720 px working / 2560 x 1440 export @2x (16:9) |
| Social / Open Graph image | `formats/social-og.md` | 1200 x 630 px (~1.91:1) |
| Social post (cross-platform) | `formats/social-post.md` | 1200 x 675 px (16:9) |
| LinkedIn single-image post | `formats/linkedin-post.md` | 1200 x 1200 px (1:1) |
| LinkedIn carousel | `formats/linkedin-carousel.md` | 1080 x 1080 px per slide (1:1) |
| LinkedIn banner | `formats/linkedin-banner.md` | 1128 x 191 (company) / 1584 x 396 (personal) |
| Twitter/X | `formats/twitter-x.md` | 1200 x 675 px (16:9) |
| YouTube thumbnail | `formats/youtube-thumbnail.md` | 1280 x 720 px (16:9) |
| YouTube channel banner | `formats/youtube-banner.md` | 1280 x 720 px working / 2560 x 1440 export @2x (16:9) |
| Email header / newsletter | `formats/email-header.md` | 1200 x 400-600 px (2x retina) |
| Slide deck graphic | `formats/slide-graphic.md` | 960 x 540 px working / 1920 x 1080 export (16:9) |
| Case study hero / thumbnail | `formats/case-study-hero.md` | 900 x 420 px working / 1800 x 840 export @2x hero / 400 x 250 working / 800 x 500 export @2x thumbnail |
| Chart / data visualization | `content-types/data-visualization.md` | Varies by context — see standard for chart type selection, color palette, text sizing |

If the medium doesn't match any standard file, ask the user for dimensions. Do not guess — wrong dimensions are the most common rework cause.

The standard files also contain **design guidelines specific to each medium** (text sizing, composition, what works/what to avoid). Read the relevant file before planning the graphic — it will inform your composition decisions in Step 3.

- **Multi-format detection**: If the request implies multiple output formats — user says "all sizes," "social + blog," "graphics for this blog post" (which needs blog cover + OG image + social post), or lists several platforms — flag this as a **multi-format request**:
  1. List all target formats and dimensions (load each format's standard file)
  2. Designate the **blog cover (1280×720 working canvas)** as the master — it's the widest and most content-rich format, giving maximum layout flexibility for derivation
  3. In Step 4, design the master first, then derive other formats by cloning and adapting

  **Load:** `formats/multi-format.md` file for the master+derive pattern, per-format content adaptation rules, and the clone→resize→adapt procedure.

  If the user only requests a single format, skip this — the standard workflow applies unchanged.

- **Content analysis** (when the user provides a blog post, article, or content to create graphics for): Scan the content and suggest a visual approach before planning:

| Content signal | Suggested visual approach |
|---|---|
| Key statistic or metric in the content | **Bold data callout** — large stat as hero element |
| Comparison between options/products | **Split layout or comparison table** — side-by-side with pros/cons |
| Step-by-step process or workflow | **Sequential diagram** — numbered steps with flow arrows |
| Customer quote or testimonial | **Quote card** — speaker photo + quote text |
| Product feature or UI explanation | **Annotated product mockup** — simplified UI with callouts. **Load:** `/brand` skill, then load `references/product-representation.md` file (fidelity decision) → `tokens/product.md` file (product UI tokens for inside the mockup) → `references/element-patterns.md` file (styling recipe). **Critical:** product mockups use product tokens inside (Inter, white bg, 8px radii) and marketing tokens outside (Neue Haas, cream, 32px radii). |
| Tutorial, walkthrough, or "click here" guide | **Spotlight cutout** — screenshot with dimmed overlay + highlighted target element (see Pattern: Spotlight cutout in `tools/figma-console.md`) |
| Abstract concept or architecture | **Illustration or diagram** — visual metaphor for the concept |
| List of criteria or evaluation rubric | **Data grid or scorecard** — structured table with ratings |
| Announcement or launch | **Bold headline + product visual** — clean, editorial feel |

Present the suggestion to the user: "Based on the content, I'd suggest a [type] approach because [reason]. Does that work, or did you have something different in mind?"

  Use the content analysis to pre-fill the Creative Brief in Step 1b — extract the key message, hero content, audience, and tone from the content rather than asking the user for them from scratch.

- **Third-party brand detection**: If the graphic features, compares, or showcases a non-Inkeep brand, flag it for **brand profile fetching** in Step 2f. Common triggers:
  - Comparison graphic — blog title contains "vs", "alternative", or a competitor name
  - Case study hero — content names a customer company
  - Customer testimonial / quote card — speaker's company brand color can tint the card background or accent
  - Integration or partner showcase — external brand logos with their real colors
  - Multi-brand diagram — each company's node colored with their brand color
  - Request mentions any specific third-party company by name

  When detected, note the brand name(s) and domain(s) so Step 2f can fetch their colors, fonts, and company data via `scripts/fetch-brand.ts`. This replaces guessing brand colors or defaulting everything to the Inkeep palette.

- **Output format**: choose based on the graphic type and what happens to it next. **When the chosen format involves an external AI API (Quiver, GPT Image, Gemini),** load `/brand` `references/create-brand-packet.md` and follow it to assemble brand context for the API call:

| Graphic type | Best format | Why |
|---|---|---|
| Slide assets, marketing cards, social images, multi-element layouts | **Figma (Option A)** — default | Editable by designers; precise layout; auto-layout; text control |
| Text-heavy designs (feature tables, pricing, comparisons) | **Figma (Option A)** | Quiver converts text to paths — no editability, imprecise for body copy |
| Illustrations, icons, logos, abstract art, decorative elements | **Quiver (Option D)** | AI generates layered, stylized vectors with complex paths impractical to hand-code |
| Icon sets (multiple matching icons) | **Quiver (Option D)** with references | Generate one, pass it as `--references` for the rest — maintains visual consistency |
| Background patterns, textures, abstract decorative art | **Quiver (Option D)** | Hard to hand-code, easy to describe |
| Charts, graphs, data visualizations (bar, line, pie, donut, sparkline) | **Figma (Option A)** | Native primitives produce editable, brand-consistent output. **Load:** `content-types/data-visualization.md` file — contains both design guidelines (chart selection, colors, labeling) AND code recipes (arcData, vectorPaths) |
| Simple structural SVGs (basic shapes, inline diagrams) | **Hand-coded SVG (Option B) → Figma** | Exact control; import into Figma for review; SVG file is the deliverable |
| System architecture, flowcharts, sequence diagrams | **D2/Mermaid (Option C) → Figma** | Purpose-built diagram languages; import into Figma for brand styling and review |
| Converting a raster image to SVG | **Quiver vectorize (Option D)** | AI-powered raster-to-vector conversion |
| Illustration FOR a slide/marketing layout | **Quiver (Option D) → Figma (Option A)** | Generate the illustration with Quiver, import into Figma, compose with brand elements and text — see hybrid workflow in Option D |
| Photorealistic images, product mockups, realistic scenes | **AI Image Gen (Option E)** | Multi-provider raster generation — GPT Image or Gemini. See provider routing below. |
| 3D hero elements (dark tiles, glass objects, atmospheric renders) | **AI Image Gen (Option E)** | Produces equivalent visual quality to R3F for most 3D hero elements. Feed brand assets as references for on-brand results. Use R3F only when Image Gen cannot achieve required fidelity (exact color determinism, parametric precision). |
| Abstract atmospheric backgrounds (gradients, particles, volumetric light) | **AI Image Gen (Option E)** | Generate as raster, place in Figma as background image fill. |
| Image editing (inpainting, background swap, style transfer, object removal) | **AI Image Gen edit (Option E)** | GPT Image edit endpoint for surgical modifications. |
| Raster image FOR a slide/marketing layout | **AI Image Gen (Option E) → Figma (Option A)** | Generate raster element, place in Figma as image fill, compose with brand text and layout. |
| 2D brand illustration → 3D concept | **AI Image Gen (Option E)** | Feed design system illustration as reference → generate 3D interpretation. Gemini excels here. |
| Tutorial walkthrough / UX highlight (SaaS "click here" guides) | **Figma (Option A)** — spotlight cutout pattern | Screenshot as image fill + boolean subtract overlay. See Pattern: Spotlight cutout in `tools/figma-console.md` |
| 3D objects needing **exact hex-color determinism** | **Three.js (Option F)** | Same code = same render. Use when brand color precision is non-negotiable. |
| **Parameterized batch 3D** (loop over configs programmatically) | **Three.js (Option F)** | Code-driven parameter sweeps — image gen can't guarantee identical scenes. |
| 3D texture library (render once, reuse as Figma backgrounds) | **Three.js (Option F)** | One-time renders stored as reusable PNG assets. |
| Precise geometric branded shape (logo carved into surface) | **Three.js (Option F)** with CSG | Image gen can't carve exact shapes — use `@react-three/csg` boolean operations. |
| Infographic (compound: data + illustration + text) | **Figma (Option A)** | Decompose into sub-elements per this routing table. Data viz → Figma primitives, illustrations → Quiver, text → Figma. |
| Badge / trust seal (SOC 2, G2 Leader, etc.) | **Figma (Option A)** | Simple shape + text + optional icon. Native Figma elements. |
| Brand-styled technical diagram | **D2/Mermaid (Option C) → Figma (Option A)** | Generate structure in D2, export SVG, import into Figma via `createNodeFromSvg`, apply brand colors/typography. |

**Quiver (Option D) vs AI Image Gen (Option E) — illustration boundary:**
- **Flat/stylized illustrations** (hand-drawn containers, brand icons, the "Imperfect Precision" style) → **Quiver**. Produces editable SVG that matches the brand illustration system. Scales infinitely.
- **Photorealistic 3D elements** (glass objects, dark tiles, metallic surfaces, atmospheric effects) → **Image gen**. Quiver can't do 3D, glass, or photorealism.
- **Abstract decorative patterns** → **Quiver** if the pattern needs to scale (backgrounds that tile at different sizes) or ship as code. **Image gen** if the pattern needs volumetric effects, particle systems, or film grain that SVG can't express.
- **2D brand illustration → 3D conversion** → **Image gen** with the original Quiver/Figma illustration as a reference image input.

**Do NOT use AI Image Gen for:**
- Vector graphics (icons, logos, illustrations that need to scale) — use Quiver (Option D). Raster images pixelate when scaled; SVGs scale infinitely.
- Editable layouts, text-heavy designs — use Figma (Option A). Raster images can't be edited by designers.
- Diagrams, flowcharts, architecture — use D2/Mermaid (Option C). Image gen can't produce structurally accurate diagrams.
- Assets that ship as code (inline SVGs, repo-committed graphics) — use Quiver or hand-coded SVG. Raster files are large and not code-editable.
- Text rendering — NEVER put text in generated images. Figma handles all text. Image gen produces visual elements only.

**Do NOT use Quiver for:**
- Reproducing an existing brand mark (Inkeep or third-party) — Quiver will hallucinate rather than reproduce. For **novel** logo/icon design, Quiver IS the right tool. For placing existing logos, clone from Figma Brand Assets or fetch via `fetch-logo.ts`.
- Data visualizations (charts, graphs) — Quiver can't hit exact data values. Use Figma (Option A) with native primitives — see `content-types/data-visualization.md` for code recipes.
- Precise text layout (body copy, tables, feature lists) — Quiver renders text as vector paths, not `<text>` elements. Result is non-editable and imprecise for multi-line copy.
- SVGs that developers will hand-edit — Quiver output is machine-generated paths (clean but not semantic). Hand-coded SVG is better for human-maintained files.
- Exact reproduction of an existing Figma component — use Figma to clone it.

**Quiver vs Figma shapes for illustrations:**
- **Figma shapes OK:** box-and-arrow flow diagrams, Venn diagrams, simple grids, progress bars, basic icon compositions from circles/rectangles, any layout where the shapes are purely geometric and few (<10 elements).
- **Use Quiver:** anything with organic curves, hand-drawn style, complex path work, stylized illustrations, decorative patterns, abstract art, or the "Imperfect Precision" brand illustration style. If the illustration requires >10 distinct shape elements or any organic curves, use Quiver.

**Do NOT use Three.js for:**
- One-off 3D renders — try AI Image Gen (Option E) first. See Option F for the full decision framework.
- 2D illustrations, icons, or vector art — use Quiver (Option D). Three.js is for 3D rendering, not flat graphics.
- Text-heavy layouts — use Figma (Option A). Three.js text rendering (Text3D) is not designed for body copy.
- Diagrams or flowcharts — use D2/Mermaid (Option C). Three.js is spatial, not diagrammatic.

**This skill produces static graphics only.** For animated/motion assets (GIFs, videos, Lottie animations), this skill is out of scope.

- **Existing asset**: if user provides a Figma URL or file reference, use it as the starting point (skip step 2)
- **Content**: what the graphic should depict or communicate

**Mark task "Graphics: Parse request" as `completed`.**

---

### 1b. Creative Brief — align on messaging and purpose

⛔ **Mark task "Graphics: Creative brief" as `in_progress` before proceeding.** Do NOT skip to asset collection or visual planning without establishing what the graphic needs to communicate.

The Creative Brief captures the **what** and **why** — who this is for, what it should say, and what the viewer should do. The Build Spec (Step 3) captures the **how** and the **vision** — what the finished graphic should look like, success criteria, visual layout, recipes, and patterns. Separating these prevents the observed failure mode of jumping to visual execution without understanding the message.

**Interaction model: propose-confirm, not interrogate.** Extract as much as possible from context, propose a brief, pause ONCE for confirmation. Do not ask blank questions — always lead with a recommendation.

#### How to produce the brief

**Route based on what the user provided:**

| User provided | What to do |
|---|---|
| **Content** (blog post, feature spec, article) | Extract answers to all 6 fields from the content. Propose the brief with your extractions. Pause for confirmation. |
| **Partial context** ("make a graphic for our Agents feature") | Ask for the 2-3 fields you can't infer (key message, hero content). Propose defaults for the rest based on format + brand knowledge. Pause for confirmation. |
| **Fully-specified request** ("blog cover with headline 'X', showing Y mockup, for Z audience") | Confirm the brief is complete — do not interrogate. Proceed. |

#### Creative Brief template

```
## Creative Brief

### Goal
___ (What should this graphic achieve? Click-through to blog? Brand awareness? Social sharing? Education?)

### Audience
___ (Who sees this? Technical decision-makers, developers, support leaders, general B2B?)

### Key message
___ (One sentence — the single takeaway the viewer should remember)

### Hero content
___ (What's the visual centerpiece? A specific stat, product UI, illustration concept, or headline?)

### Tone
___ (3-5 adjectives — e.g., "authoritative, technical, clean" or "warm, approachable, human")

### Call to action
___ (What should the viewer DO? Read the blog post, book a demo, share on LinkedIn, remember the brand?)
```

**Rules for the brief:**
- **Propose, don't interrogate.** When content is available, FILL IN the fields with your best extraction and present for confirmation. When content is unavailable, propose reasonable defaults and ask the user to correct what's wrong — don't present 6 blank fields.
- **One confirmation round.** Present the brief, get user confirmation or adjustments, proceed. Do not iterate more than once unless the user's corrections reveal a fundamental misunderstanding.
- **Push back on weak angles.** If the content has a stronger hook than what the user described, surface it: "You mentioned [X], but the content includes [impressive stat/compelling UI/stronger angle] — should we lead with that instead?" This is the designer's contribution to messaging — visual hierarchy IS a messaging decision.
- **Skip when unnecessary.** If the user's request already specifies the message, audience, hero content, and tone (even informally), confirm and proceed — don't force them through a template. Write out the brief for your own reference but don't make the user re-approve what they already said.
- **Context (field 7) is already handled.** Step 1 captures the output medium and dimensions. Don't re-ask.

**How the Creative Brief feeds forward:**
- **Key message** → determines what's visually dominant in the Build Spec (Step 3)
- **Hero content** → determines which artifact recipe to apply (product mockup? code-as-visual? metric callout?)
- **Audience** → influences tone translation (developer-facing = monospace-forward, technical depth; executive-facing = clean, stat-forward)
- **Goal + CTA** → determines whether the graphic needs a CTA element, urgency signals, or is purely brand/awareness
- **Tone** → maps to warm vs dark background decision, color accent choices, visual density

**Why this exists:** Without this step, the observed failure mode is the agent producing visually polished graphics that communicate the wrong message, feature the wrong content, or target the wrong audience — because it never asked. 95% of design misalignment traces to brief quality (Superside research). The cost of one confirmation round is far lower than the cost of rebuilding a graphic that missed the point.

**Mark task "Graphics: Creative brief" as `completed`.**

---

### 1c. Product context discovery (when hero content involves the product)

**Skip this step if** the hero content is purely typographic, abstract, or logo-based. Only run it when the Creative Brief calls for product UI, a feature mockup, or a visual that needs to represent what the product actually does.

**Load:** `references/product-context-discovery.md` file

**Goal:** Acquire a **visual reference** of the actual UI being represented — not improvise from general knowledge. The reference file has the full discovery strategies; this section summarizes the workflow.

**Step 1: Determine context type and discover**

```bash
# Set up reference directory
mkdir -p tmp/reference/<project-name>
```

| Context | Discovery strategy | Key resources |
|---|---|---|
| **Our product (Inkeep)** | Explore widget library → explore product repo (docs first, then code) → open running app → check marketing site for existing representations | See `/brand` § Product Resources for repos, app URLs, and what each contains |
| **Third-party product (Slack, Jira, etc.)** | Search their marketing materials → web search for UI screenshots → fetch brand profile | The third-party's own website/blog, web search scoped to their domain, `fetch-brand.ts` |
| **Novel/conceptual UI** | Skip visual reference — use illustration system | `content-types/illustration.md` |

For each useful image, screenshot, or component render found: **download, resize (sharp → ≤1568px + 400px), and save** to `tmp/reference/<project-name>/` with descriptive names. For code-derived references, have the exploration subagent produce a **visual description** (layout, colors, sub-elements, states) saved as markdown alongside images.

See the reference file for detailed strategies, subagent prompt patterns, and the resize recipe.

**Step 2: If discovery methods don't yield sufficient reference, ask the user ONE question**

"The graphic calls for a product mockup of [feature]. To make it look convincing, I need to understand what the feature looks like. Can you point me to any of these?
- A URL showing this feature (live product, staging, or demo)
- A spec, PRD, or doc describing the UI
- An existing screenshot or mockup
- Or just describe the key UI elements in a sentence"

If the user provides context, use it. If they say "just make it up" or "use your best judgment," proceed with a stylized representation using the illustration system (`content-types/illustration.md`).

**Step 3: Capture and propagate what you learned**

Write in the Build Spec (Step 3) under "Product context":
- What the feature does (one sentence)
- Key UI elements the mockup should show
- Visual reference paths (`tmp/reference/<project-name>/...`)
- Fidelity level (per `references/product-representation.md`)

**In exploration mode:** Also write `productContext` to `state.json` so nested claudes get the references:
```json
"productContext": {
  "feature": "...",
  "fidelityLevel": "Level 3",
  "referenceDir": "tmp/reference/<project-name>/",
  "keyUIElements": ["..."]
}
```

This grounds the visual in the actual product. Every sub-element in the Build Spec's sub-element plan should cite a specific reference from this discovery.

---

### Phase 0: Conceptualize — propose direction concepts (exploration mode only)

⛔ **Mark task "Graphics: Conceptualize — Propose directions" as `in_progress`.** Skip this step if in single-pass mode (trivial edits).

After the Creative Brief is confirmed, propose **5 visual direction concepts** as a text table before any Figma work. This is cheap (text only) and lets the user filter before the agent invests in expensive builds.

**Preparation before ideation.** The agent's "preparation" is Steps 1-1c — the Creative Brief, content analysis, and brand system. Every concept should trace back to something specific in the brief or content, not emerge from general design knowledge. The quality of ideation is bounded by the depth of context gathered.

**How to arrive at the 5 concepts** — reason from the specific inputs gathered so far, not from general knowledge:

1. **Mine the Creative Brief.** What's the key message? What's the hero content? The strongest concepts are visual translations of the key message — not generic layouts with the title pasted on.
2. **Analyze the source content** (if provided). Look for the strongest visual hooks: product UI → mockup, key stat → data callout, before/after → split narrative, system with parts → architecture, metaphor → illustrative concept, user interaction → stylized UI.
3. **Check the format and medium.** **Load:** the format file. What composition patterns work at this size? What are the thumbnail readability constraints?
4. **Check brand composition patterns.** **Load:** `/brand` skill composition guide. What layouts, background treatments, and illustration styles are on-brand?
5. **Consider the audience.** Developer-facing leans monospace-forward. Executive-facing leans stat-forward. The Creative Brief tone should translate into visual treatment choices.
6. **Ensure conceptual diversity** (see diversity self-check below).

**Diversity self-check — verify before presenting:**

The #1 failure mode is generating 5 concepts that are variations on the same idea rather than genuinely different directions. Variation (10 color schemes of one layout) ≠ divergence (10 different visual arguments for the same message).

Before presenting the 5 concepts, verify:
- [ ] At least 3 different visual centerpieces (not 5 variations of "title + graphic right")
- [ ] At least 2 different layout architectures (centered, asymmetric, full-bleed, grid, layered — mix them)
- [ ] At least 2 different imagery approaches (product mockup, illustration, typography-dominant, data callout, abstract/metaphorical, photographic)
- [ ] At least 1 counter-concept that deliberately avoids the most obvious visual approach to the content. If the content is about a product feature, one concept should not show the product UI. If the content is about data, one concept should use a visual metaphor instead of showing numbers. This breaks the agent's fixation on "the obvious answer" and often produces the most interesting direction.

### Incorrect
A blog about "Agents in Slack" → 5 concepts that all show a Slack message thread in different color schemes. This is variation, not divergence. Every concept has the same visual centerpiece (Slack UI).

### Correct
A blog about "Agents in Slack" → (1) Immersive Slack thread mockup, (2) Hub-and-spoke diagram showing multi-channel reach, (3) Bold typographic treatment with key stat "10x faster responses", (4) Illustrated metaphor — helpful colleague joining a conversation, (5) Split composition showing before/after support experience. Each has a different visual centerpiece and argues the message differently.

**Ideation entry points** — how to approach the reasoning depends on the brief:

| Entry point | When to use | How |
|---|---|---|
| **Concept-first** | Brief has a strong message or narrative hook (most common) | Start from the key message; ask "what visual *argues* this point?" for each concept |
| **Reference-first** | User provided visual references or the content suggests a visual domain | Extract *principles* from references (composition rhythm, color temperature, spatial density) — never copy execution |
| **Form-first** | Brief is open-ended or abstract; no obvious visual hook | Explore compositional approaches (typography-dominant, illustration-driven, data-forward) and attach meaning after |

**Present to the user:**

| # | Direction | Visual concept | Why this works for this content |
|---|-----------|---------------|-------------------------------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |
| ... | | | |

The "why" column must connect the concept back to the Creative Brief — not generic design reasoning.

Include: agent's recommendation (which 2-3 are strongest and why), and a clear ask: "Pick which ones to build, or suggest changes."

The user selects which directions to build. The agent builds exactly what was picked. See `references/exploration-workflow.md` for full Phase 0 guidance, canvas organization, state persistence, and the iteration loop.

**Mark task "Graphics: Conceptualize — Propose directions" as `completed`.**

---

### 2. Find a starting point, collect assets, and pull brand tokens

⛔ **Mark task "Graphics: Collect assets & brand tokens" as `in_progress` before proceeding.**

Before creating from scratch, search for existing assets to build from. **Always use the Figma MCP for navigation** — never the browser.

**a) Check the Brand Assets page first**

The Inkeep Brand Assets file (`D7NDSM2peo1iLhkjLxmGP5`) has a curated **Brand Assets** page (node `5003:63`) with brand assets organized into sections (logos, icons, illustrations, customers, third-party logos, backgrounds, UI elements). Search here first for any reusable visual asset.

Use `figma_execute` to search by hierarchical name:
```javascript
const page = figma.root.findOne(n => n.id === '5003:63');
const asset = page.findOne(n => n.name.startsWith('logo/'));
```

**Asset acquisition — preferred method:**

The Inkeep Brand Assets library is published. Use `importComponentByKeyAsync` to pull assets directly into your working file without cross-file navigation:

```javascript
// Preferred: import from published library (no file navigation needed)
const comp = await figma.importComponentByKeyAsync(componentKey);
const instance = comp.createInstance();
```

Discover component keys via REST API: `GET /v1/files/D7NDSM2peo1iLhkjLxmGP5/components`.

If `importComponentByKeyAsync` fails, fall back to the cross-file clone workflow: navigate to the Inkeep Brand Assets file → search by name → `asset.clone()`.

**b) Check master design files for broader context**

**Load:** `references/figma-assets.md` file

This file contains navigation strategy tables for the Inkeep Design Assets file (Brand Assets page). Use it to identify which pages to check if the Brand Assets page doesn't have what you need.

**c) Navigate the Figma file via MCP**

Use the Figma MCP to systematically search for relevant existing assets:

1. **List pages** — get the file's page tree to see all available pages and their node IDs
2. **Match pages to task** — use the navigation strategy table in `references/figma-assets.md` to identify which pages are most relevant
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

**e) Blog thumbnail category color (when applicable)**

When creating a blog thumbnail, check `src/components/blog/category-badge.tsx` in the marketing site repo for the current category→color mapping. Use the matching accent color so the thumbnail aligns with the blog category badge displayed on the site. Do not hardcode category colors here — the source file is the single source of truth.

**f) Fetch third-party brand profile (when creating graphics about/for other companies)**

When the graphic features a third-party brand — comparison thumbnails ("Inkeep vs Zendesk"), case study heroes, integration showcases, partner spotlights — fetch that brand's profile to get their real colors, fonts, and company data instead of guessing.

```bash
bun tools/fetch-brand.ts --name "Zendesk" --domain "zendesk.com"
```

The script returns a structured profile:
```json
{
  "name": "Zendesk",
  "domain": "zendesk.com",
  "colors": [{ "hex": "#03363D", "type": "brand" }, { "hex": "#17494D", "type": "dark" }],
  "fonts": [{ "name": "Neue Haas Grotesk", "type": "title", "origin": "custom" }],
  "company": { "employees": 5001, "industries": [{ "name": "Customer Service Software" }] },
  "logo": { "found": true, "source": "iconify-logos", "svg": "..." }
}
```

If `--domain` is omitted, the script uses the Brandfetch Search API to resolve the company name to a domain (requires `BRANDFETCH_CLIENT_ID` env var). Falls back to naive domain inference if Search API is unavailable.

**Logo acquisition priority (always follow this order):**

1. **First:** Check Figma Brand Assets page (node `5003:63`) — Inkeep logos AND curated third-party logos are here. Clone, don't recreate.
2. **If not in Brand Assets:** `fetch-logo.ts` (logo SVG only) or `fetch-brand.ts` (logo + brand colors + fonts). Use `fetch-brand.ts` when you also need the company's color palette (comparison graphics, case study heroes).
3. **If fetch fails:** Create a styled text pill placeholder (brand name in a rounded rectangle) and flag it for the user to replace manually. NEVER approximate a logo with shapes.
4. **For AI image gen with logos:** Do NOT feed logos as `--reference` images expecting pixel-perfect reproduction — both GPT Image and Gemini reinterpret reference images through their latent space, producing recognizable but altered versions (shifted proportions, font substitution, color drift). Instead, generate the scene/background WITHOUT the logo (prompt: "no text, no logos"), then composite the exact logo as a Figma layer on top of the generated image. This hybrid approach (AI scene + deterministic logo overlay) is the industry standard — Google's own workflow does this.

**Record the brand profile in the Asset Manifest** (section h below).

**g) Pull Inkeep brand tokens from Figma**

Use the Figma MCP to extract brand tokens from the design system.

**Load:** `references/figma-assets.md` file for the Figma file URL. For token values, read `tokens/marketing.md`.

Extract:
- **Color palette**: primary, secondary, accent, background, text colors with exact hex values
- **Typography**: font families, weights, size scale
- **Spacing**: padding, margins, grid units
- **Border radius**: corner rounding conventions
- **Shadows/effects**: drop shadows, glows, gradients

If referencing an existing Figma asset, also extract its specific layout, dimensions, and visual structure.

**h) Verify brand font availability**

The Inkeep brand font (Neue Haas Grotesk Display Pro) is a paid/custom font. If it's not available in the target Figma file, text operations will silently fail or fall back to a default — producing off-brand graphics with no warning.

Check font availability early via `figma_execute`:
```javascript
const fonts = await figma.listAvailableFontsAsync();
const brandFonts = fonts.filter(f => f.fontName.family.includes('Neue Haas'));
console.log('Brand fonts available:', brandFonts.map(f => `${f.fontName.family} ${f.fontName.style}`));
```

- If brand fonts are found → note the available weights (Bold, Roman, Medium, etc.) in the manifest
- If NOT found → warn the user: "The brand font (Neue Haas Grotesk Display Pro) isn't available in this Figma file. It's likely shared via your team's Figma library — enable it in Assets → Team Library. Without it, text will fall back to a default font." Then ask whether to proceed with a fallback font (Inter is the closest available alternative) or wait.

**i) Produce the Asset Manifest (required before proceeding)**

⛔ **Do NOT proceed to planning or building until you have produced this manifest.** This is the checkpoint that prevents the "skip asset collection" failure mode.

Write out an asset manifest listing what was found and what's missing:

```
## Asset Manifest

### Found (will reuse)
- [x] Inkeep logo — node ID: ___, source file: ___
- [x] Third-party logo (Slack) — node ID: ___, source file: ___
- [x] Brand colors: #FBF9F4, #3784FF, #231F20, ...
- [x] Font: Neue Haas Grotesk Display Pro (Bold, Roman, Medium) — verified available via listAvailableFontsAsync

### Third-party brand profile (if applicable)
- [ ] Brand: ___ — fetched via fetch-brand.ts
- [ ] Colors: brand #___, accent #___, dark #___, light #___
- [ ] Fonts: title: ___ (origin: ___), body: ___ (origin: ___)
- [ ] Company: ___ employees, industry: ___
- (or: "N/A — graphic only uses Inkeep branding")

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

**Load:** `/brand` skill and load any reference files relevant to your task following the skill's reference loading guidance for your content. This is important for ensuring you are fully grounded and can leverage brand assets, tokens, and guidance. Use these to inform every composition decision below.

**Load:** `references/method-selection.md` file for the per-atom method selection decision tree. Walk this tree for every generative atom in the Build Spec's Atom generation audit.

**If the graphic includes illustrations, visual metaphors, or decorative elements in the Inkeep hand-drawn style:**
**Load:** `content-types/illustration.md` file for the dual-stroke visual language (hand-drawn gray containers + precise blue fills), color palette, composition patterns, Quiver generation instructions, and the blue swoosh underline signature element.

⛔ **Produce a Build Spec before proceeding.** This is the checkpoint that prevents two failure modes: (1) planning from general knowledge instead of brand-specific recipes, and (2) building without a concrete vision of the finished output. The Build Spec is persisted to `state.json` under `directions[slug].buildSpec` so nest-claude children receive it as their build instructions. The self-critique loop (Phase E) evaluates against this spec's success criteria.

Write out the spec using this template:

```
## Build Spec: [Direction Name]

### End-state vision
Describe in 3-5 sentences what the finished graphic should look like
and feel like. Not which recipes to apply — the actual visual result
as if describing it to someone who will build it.

### Success criteria
3-5 concrete, testable statements specific to THIS graphic.
The self-critique loop and reviewer evaluate against these.
**At least 2 criteria must be semantic** — testing what the viewer
should UNDERSTAND from the spatial arrangement, not just what they
should SEE. Example: "Arrows converge from 3 sources into the agent"
not "Arrows exist between nodes."
**At least 1 criterion must be a craft/richness criterion** — testing
visual depth, texture, or polish, not just presence or correctness.
Example: "Background has visible texture/grain, not a flat solid fill"
or "Mockup contains realistic contextual content, not placeholder text"
or "Composition has ≥4 visual depth layers." This ensures the Phase E
craft elevation pass has a spec-level target to evaluate against.
- [ ] ...
- [ ] ...
- [ ] ...

### Information architecture
What is the semantic structure of this graphic? What relationships
must the spatial arrangement convey WITHOUT reading text?
- Directional flow: ___ (e.g., "3 triggers → agent → KB output")
- Element roles: ___ (which are inputs, processors, outputs, labels?)
- What must be visually distinct? ___ (e.g., "inputs use card colors, output uses neutral")
- What should the viewer understand at a glance? ___ (one sentence)

### Thumbnail sketch
What should this look like at 400px wide? Which elements are
visible vs lost? What's the primary → secondary reading order
at card size?

### Artifact recipes applied
(Scan artifact-recipes.md and select which apply. Mark each YES/NO with a one-line note.)
- Product mockup treatment: ___
- Product-as-marketing: ___
- Code-as-visual: ___
- Badge system: ___ (which badge text: ___)
- Metric callout: ___
- Logo composition: ___
- Quote card: ___

### Composition patterns applied
(Scan composition-patterns.md and select which apply.)
- Layout: ___ (Z-pattern / split / stacked / centered / other)
- Visual hierarchy: ___ (heading size, badge ratio)
- Color restraint: ___ (which 3 colors in surround)
- Background texture: ___ (which technique)
- Content coverage: ___ (estimated fill %)
- Edge bleed: ___ (bleed / contained / overlapping)
- Brand system consistency: ___ (if part of a series — what's locked, what varies)

### Atom generation audit

⛔ **The only selection axis is output quality and fidelity for the specific atom. Speed, API cost, and implementation effort are NEVER factors in method selection.** When two methods produce genuinely equivalent quality for an atom, either is acceptable — but never choose a lower-fidelity method because it's faster or cheaper.

Classify every visual element as Tier 1 or Tier 2, then fill in the appropriate format:

**Tier 1 — Trivially-routed atoms** (method is determined by what the atom IS, not by judgment):
These are atoms where only one method applies. One-line declaration, no justification needed.
- Text elements → Figma (always)
- Existing Inkeep logos → clone from Brand Assets (node ID: ___)
- Existing third-party logos → clone from Brand Assets or fetch via fetch-logo.ts
- Simple Figma token-bound elements (solid-color backgrounds, spacing frames) → Figma native

```
Tier 1: headline → Figma, badge → Figma, body text → Figma,
logo (Inkeep) → Brand Assets clone [node ID], logo (Slack) → fetch-logo.ts
```

**Tier 2 — Generative atoms** (method requires judgment about HOW to render):
These are atoms where multiple methods could plausibly work — illustrations, decorative elements, backgrounds, imagery, icons, diagrams, product mockups. For each, walk the decision tree in `references/method-selection.md` and fill every column:

| Atom | Candidates considered | Selected method | Why this method (quality/fidelity) | Why NOT runner-up | Pipeline |
|---|---|---|---|---|---|
| *(name the specific atom)* | *(list 2+ methods that could produce this atom)* | *(the one you're using)* | *(what makes this method produce the highest-fidelity result for THIS atom — cite specific quality characteristics)* | *(what quality limitation of the runner-up disqualifies it — be specific, not formulaic)* | *(full tool chain if multi-tool, or "—" if single-tool)* |

Example rows:
| Hero illustration (rocket) | Quiver, Figma shapes, Image Gen | Quiver | Complex organic curves in brand "Imperfect Precision" style; produces editable SVG that scales infinitely | Figma shapes: can't achieve organic hand-drawn curves. Image Gen: raster output can't scale, not designer-editable | Quiver → SVG import to Figma → brand color verification → overlay with text |
| Background atmosphere | Image Gen (Gemini), Quiver, Figma gradient | Image Gen (Gemini) | Volumetric light + particle effects that SVG and Figma gradients cannot express; Gemini excels at atmospheric rendering | Quiver: SVG cannot express volumetric/particle effects. Figma: limited to linear/radial/angular gradients | Image Gen → PNG → Figma image fill on background layer |
| "10x faster" stat callout | Figma native | Figma native | Pure text + shape composition requiring exact token binding and designer editability | — (Tier 1 candidate, promoted to Tier 2 because of custom styling decisions) | — |

**Classification rule:** If an atom has only one plausible method, it's Tier 1. If you list only one candidate in a Tier 2 row, reclassify it as Tier 1 or explain specifically why no other method could produce this atom.

**Compound atom decomposition** — when a Tier 2 atom is a composed, multi-layer, or multi-element construct (product mockups, chat interfaces, UI recreations, diagrams with styled nodes, infographics), it must be decomposed into sub-elements. Each sub-element gets its own Tier 1/Tier 2 classification and the same method-selection rigor as top-level atoms. The compound atom's top-level Tier 2 row declares the **container method** (usually Figma for layout). The sub-element table declares how each piece inside is built.

This is recursive — a sub-element can itself be compound (e.g., a "message bubble" inside a "Slack thread" contains avatar + name + text + timestamp + action buttons). Decompose until every leaf element has a clear, single-method declaration.

| Sub-element | Tier | Method | Why (if Tier 2) | Visual reference | Verification |
|---|---|---|---|---|---|
| *(name every sub-element — avatar, text styling, action buttons, headers, icons, emoji, etc.)* | *(1 or 2)* | *(for Tier 1: source declaration. For Tier 2: selected method from decision tree)* | *(Tier 2 only: quality rationale + why NOT runner-up. Tier 1: "—")* | *(path to reference image from Step 1c, or "—" with justification why none needed)* | *(4x zoom for elements <50px, inline check for text styling)* |

Example — "Slack thread mockup" compound atom:
| Sub-element | Tier | Method | Why (if Tier 2) | Visual reference | Verification |
|---|---|---|---|---|---|
| Channel header bar | 1 | Figma native (text + rectangle) | — | tmp/reference/slack-channel.png | Inline check |
| User avatar | 2 | Quiver illustration | Organic, illustrated portrait matching brand "Imperfect Precision" style; Figma circles with initials lack personality. Image Gen raster can't scale if reused | tmp/reference/slack-avatar-style.png | 4x zoom |
| Inkeep bot avatar | 1 | Brand Assets clone [node ID] | — | — (canonical asset) | 4x zoom |
| Slack hash icon | 1 | fetch-logo.ts | — | — | Inline check |
| Approve/Deny buttons | 1 | Figma native (geometric, <5 elements) | — | tmp/reference/slack-buttons.jpg | 4x zoom |
| Message text | 1 | Figma text | — | — | Inline check |
| Emoji reactions | 2 | Quiver | Stylized emoji matching illustration system; Unicode text rendering is system-dependent and uncontrollable. Image Gen raster overkill for small icons | — (brand illustration style) | 4x zoom |

**Why this matters:** Compound atoms are where the model most often defaults to building everything from basic Figma shapes. A Slack mockup built entirely from rectangles and circles looks flat and generic. Decomposing forces the model to recognize that sub-elements like avatars and emoji are illustration problems (→ Quiver), not shape problems (→ Figma rectangles).

⛔ **Completeness gate:**
- Every Tier 2 atom (top-level or sub-element) must have ALL audit columns filled — including quality rationale and why NOT runner-up
- Every Tier 1 atom/sub-element must declare its source
- Compound atoms with 3+ sub-elements MUST have a sub-element table — no exceptions
- Sub-elements that are themselves compound must be further decomposed until all leaves are single-method
- If any Tier 2 entry's rationale references speed, cost, or ease of implementation rather than quality/fidelity, the gate fails — rewrite in terms of output quality
- Every sub-element must have a Visual reference or justified "—". Rows without references produce improvised elements that look generic

### Composition plan
- Layout: overall structure, element placement
- Content elements: text, icons, shapes, images, data points
- Color mapping: exact token names from brand-tokens.md for Inkeep elements (not hex from memory). **For third-party brand elements** (competitor side of a comparison, customer in a case study), use colors from the brand profile fetched in Step 2f — map `brand` → primary accent, `dark` → text color, `light` → background tint. If no brand profile was fetched, default to Inkeep palette.
- Typography mapping: font + weight + size for each text element. If the brand profile includes a Google Fonts title font, consider using it for the third-party brand's name/heading to reinforce their identity.
- Illustration style (if applicable): hand-drawn rules from brand-guide.md

### Scaling validation
- [ ] Heading is 11-15% of canvas height (landscape/wide) or 5-7% (square/portrait)
- [ ] Heading ÷ body size ratio ≥ 3:1 (aim for 4:1)
- [ ] Badge size ≈ 1/8 of heading size (badge whispers, heading shouts)
- [ ] Content fills ≥75% of canvas area (no "floating in space")
- [ ] Squeeze test: heading × (400 ÷ canvas width) ≥ 20px (readable in mobile feed)
- [ ] Text sizes are from the format file's typography tiers, not raw brand token values
- [ ] Border-radius does not exceed 25% of any element's shortest side (prevents capsule deformation on small elements)
- [ ] Every atom inside product mockups is identifiable at 400px thumbnail width (product UI elements should be 1.5-2x their actual product sizes — "poster scale," not pixel-accurate)

### Anti-pattern check
- [ ] Background is NOT flat (has texture/gradient)
- [ ] Surround uses ≤3 colors (mockup internals don't count)
- [ ] No raw screenshots (all product UI is stylized)
- [ ] Max 2 typefaces in this graphic
- [ ] Illustrations use Quiver (not hand-built Figma shapes) unless purely geometric
- [ ] Third-party logos are real assets (not text/shape approximations)
- [ ] Every generative atom (Tier 2) has a method justification grounded in quality/fidelity — not just a method declaration
- [ ] No generative atom defaults to Figma shapes without explicitly ruling out Quiver (for organic/illustrative) or Image Gen (for photorealistic/atmospheric)
- [ ] Every multi-tool atom spells out the full pipeline end-to-end (e.g., "Quiver → SVG import → Figma brand overlay"), not just the primary tool
```

**Rules for the Build Spec:**
- **End-state vision must be concrete** — "a warm cream canvas with a large Slack thread mockup" not "a professional-looking blog cover." The vision should be vivid enough that someone else could build it.
- **Success criteria must be testable** — "heading reads at 300px thumbnail" not "looks good." The self-critique loop evaluates against these.
- **At least 2 success criteria must be semantic** — testing what the composition COMMUNICATES, not just what it CONTAINS. "Arrows converge from 3 sources into the agent" not "arrows exist between nodes." Structural-only criteria produce graphics that look right but say the wrong thing.
- **Information architecture must be filled in** for any graphic with directional flow, hierarchy, or element relationships (diagrams, workflows, hub-and-spoke, convergence patterns). Skip only for purely typographic or decorative graphics with no spatial semantics.
- Every recipe must be explicitly marked YES or NO — skipping the scan is the failure mode this prevents
- Every visual element must declare its generation tool — this prevents defaulting to Figma shapes for everything
- Every sub-element in compound elements must cite a visual reference or justify why none is needed
- Color values must reference token names (`brand/primary`, `bg/surface`) not bare hex codes from memory
- If no artifact recipes apply (e.g., a pure diagram), note "None — diagram only, using diagram rules from brand-guide.md"
- The anti-pattern check must all pass before proceeding. If any fail, fix the plan first.
- If an illustration or icon is marked "Figma shapes" instead of Quiver, justify WHY (only acceptable for purely geometric compositions like simple diagrams)
- If a third-party logo is not sourced from Brand Assets or fetch-logo.ts, STOP — logos must never be approximated
- **Persist the Build Spec** — in exploration mode, write to `state.json` under `directions[slug].buildSpec`. In single-pass mode, write to conversation (it serves as the agent's own execution plan).

**Why this exists:** Without this checkpoint, the observed failure modes are: (1) the agent skipping the Load instructions, planning from general design knowledge, and producing graphics that miss brand-specific treatments (wrong shadow, wrong radius, flat backgrounds, oversized badges); (2) the agent defaulting to basic Figma shapes for everything instead of using Quiver for illustrations, GPT Image for photorealistic imagery, and fetch-logo.ts for third-party logos — producing flat, unpolished graphics that lack the richness the toolchain enables. The brief forces the agent to read the references and commit to the right tools before building.

For diagrams: plan the nodes, edges, groupings, and flow direction. Follow the diagram rules in brand-guide.md (max 8-10 nodes, L-to-R or T-to-B flow, JetBrains Mono labels, 90-degree connector bends).

**Confirm high-cost decisions explicitly.** Some choices are expensive to reverse once built — especially connection elements (arrows, lines) that depend on positions of other elements. Before building, get explicit user confirmation on:
- **Flow direction** (clockwise vs counter-clockwise, left-to-right vs top-to-bottom)
- **Element ordering** (which item goes where in a sequence or cycle)
- **Spatial arrangement** (grid vs radial vs freeform; which elements are adjacent)
- **Containment vs connection** — for architecture diagrams, explicitly ask: *"Is X inside Y, or does X connect to Y from outside?"* Getting this wrong requires tearing down and rebuilding the entire composition. Example: "Are delivery channels part of the platform zone, or separate boxes that connect to it?"

Don't infer these from ambiguous language — describe your interpretation and confirm before committing.

**When the graphic is visually novel** (no existing asset to adapt, no established pattern to follow): default to proposing **2–3 variations** of the composition rather than committing to a single direction. Variations can differ in layout structure, visual metaphor, information hierarchy, or stylistic approach. Present them as lightweight sketches or descriptions — enough for the user to pick a direction before you invest in full execution. This front-loads the biggest design decision and avoids multiple full rebuilds.

If the graphic is adapting an existing asset or following an established pattern, a single plan with user confirmation is sufficient.

Present the Build Spec to the user for review before generating.

**Mark task "Graphics: Write build specs & Start Nested Claudes" (exploration) or "Graphics: Write build spec" (single-pass) as `completed`.**

### 4. Generate the graphic

⛔ **Routing decision (before building anything):**

| Situation | Path |
|---|---|
| **Exploration mode (any number of directions)** | **Always spawn `/nest-claude` children.** Create `state.json`, spawn one child per direction. The parent NEVER builds frames — it orchestrates and verifies. **Load:** `references/exploration-workflow.md` file for the full coordination protocol, state.json schema, and child spawn template. |
| **Single-pass mode (trivial edits only)** | **Direct build.** The parent builds the frame using Phase A-E below. Single-pass is for trivial edits to existing assets (changing title text, swapping a logo) — not for new graphics. |

**The parent is always the orchestrator, never the builder.** Even for a single direction in exploration mode, spawn a child. This ensures: (1) the parent can independently verify all frames without reviewing its own work, (2) consistent code path regardless of direction count, (3) children always run the full build cycle including the reviewer subagent.

The parent's job is: (1) write `state.json` with Build Specs, assets, and Figma IDs, (2) create Figma Sections, (3) spawn children, (4) collect and verify results. Each child loads `/brand` and `/graphics`, reads its Build Spec from `state.json`, builds its frame, and runs its own self-critique + reviewer loop. See `references/exploration-workflow.md` for the full protocol.

⛔ **Mark task "Graphics: Build directions" (exploration) or "Graphics: Build graphic" (single-pass) as `in_progress`. Before creating ANY Figma elements, verify:**
- [ ] **Asset manifest exists** — Step 2 produced a manifest listing found/missing/approximated assets
- [ ] **Brand tokens collected** — you have exact hex colors and font families from the design system, not from memory or the user's message
- [ ] **Logos are real** — any Inkeep or third-party logos are cloned from the Brand Assets page or fetched via `tools/fetch-logo.ts`, not approximated with text or shapes
- [ ] **Build Spec was produced** — Step 3 produced a Build Spec with end-state vision, success criteria, and sub-element plan with visual references
- [ ] **In exploration mode: `state.json` exists** — with creativeBrief, assets, directions, and per-direction buildSpec

**If any of these are not met, STOP and complete the missing step before proceeding.**

**Load:** `tools/figma-console.md` file for tool reference and common patterns.

Choose the generation method based on graphic type and output needs:

**Option A: Native Figma design (default — recommended for most graphics)**

Best for: slide assets, marketing visuals, diagrams, social images, cards, hero graphics, tutorial walkthrough highlights — anything that benefits from editability. For tutorial/walkthrough images with spotlight highlights, see **Pattern: Spotlight cutout** in `tools/figma-console.md`.

Before starting, verify the Desktop Bridge plugin is running:
1. Call `figma_get_status` to check connection
2. If `setup.valid` is `true` — proceed
3. If `setup.valid` is `false` — attempt programmatic recovery first:
   a. Call `figma_reconnect` — wait a few seconds, then re-check `figma_get_status`
   b. If still disconnected, call `figma_reload_plugin` — re-check `figma_get_status`
   c. If still disconnected, guide the user to manually re-launch:
      - "Open your target Figma file in **Figma Desktop** (not browser)"
      - "Right-click the canvas → **Plugins → Development → Figma Desktop Bridge**"
      - "Wait for the green 'MCP Ready' status widget to appear"
      - If the plugin isn't in the menu: "You need to import it first — run `npx figma-console-mcp@latest --print-path` in your terminal, then in Figma: Right-click → Plugins → Development → Import plugin from manifest... → select that path"
   - After the user confirms, call `figma_get_status` again to verify
4. If cross-file operations are needed (e.g., cloning from Inkeep Brand Assets), call `figma_list_open_files` to verify the plugin is running in **all** required files. If a file is missing, ask the user to open the plugin in that file too.

Follow the five-phase workflow below. Do NOT try to build the entire graphic in one pass.

#### How to look at your work

Claude sees images via the Read tool — it presents them visually, not as metadata. But resolution affects what you can reliably assess. Claude's sweet spot is **≤1568px on the long edge**. Above that, images are auto-downscaled (no quality benefit, wasted tokens). Below 200px, quality degrades.

Use the right screenshot method for the situation:

| Situation | Method | Why |
|---|---|---|
| **Quick construction checks** (Phases A–E: "does this atom look right?") | `figma_capture_screenshot` at default scale | Fast, good enough for binary pass/fail verification |
| **Review screenshots** (Phase 5: preparing images for reviewer subagent) | `scripts/capture-for-review.ts` | Exports review.png (1568px) + proportional.png (400px) to disk for subagent |
| **Non-Figma outputs** (Quiver, AI Image Gen, Three.js) | Read the generated PNG directly | Already within range (typically 1024×1024) |
| **Small element detail check** (brand marks, text, or icons <50px) | `figma_capture_screenshot` at `scale: 4` on the specific node ID | Default-scale screenshots render small elements too tiny for quality assessment. Recommended for any element containing brand identity or text that must be legible. |

Every time this workflow says "screenshot" or "visually verify," you're using `figma_capture_screenshot` for quick checks. In Phase 5, run `scripts/capture-for-review.ts` to produce the review screenshots for the reviewer subagent — it exports via the Figma REST API at two resolutions and saves to `tmp/review/<name>/`.

#### Phase A: Stage collected assets into the working file

**Goal:** Transfer the assets identified in Step 2's Asset Manifest into the target Figma file. This phase executes the manifest — it does not redo the search.

**Before cross-file operations**, call `figma_list_open_files` to verify the plugin is running in both the source and target files. If the source file isn't connected, ask the user to open the Desktop Bridge plugin in that file — `figma_navigate` will silently fail if the plugin isn't running in the target file.

For each "Found (will reuse)" item in the manifest:
1. **Navigate** to the source file (`figma_navigate`)
2. **Locate** the asset by node ID
3. **Clone or transfer** it into the target file (see cross-file strategies below)
4. **Verify** the cloned asset looks correct (screenshot — pass explicit `nodeId`, not relying on current page)

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
bun tools/fetch-logo.ts --name "Freshdesk" --domain "freshdesk.com" --output /tmp/freshdesk.svg
```

The script outputs JSON to stdout with the SVG content, source, and metadata. Use `--prefer color` (default) for full-color logos or `--prefer mono` for monochrome. Use `--theme dark` for dark-mode variants.

**Load:** `tools/logo-sources.md` file for source details, coverage gaps, and manual API patterns if needed.

Import the resulting SVG into Figma via `figma.createNodeFromSvg(svgString)` in `figma_execute`. **Load:** `tools/svg-import.md` file if the SVG is complex (gradients, masks, filters) or from Brandfetch (brand-uploaded, variable quality). Simple Icons SVGs always import clean; Iconify logos are ~90% safe. After import:
- Name the node with `third-party/` prefix (e.g., `third-party/freshdesk`)
- Adapt to the graphic's visual treatment — if other logos are monochrome/grey, convert the imported logo to match (replace fills with the target color)
- **Preserve the SVG's aspect ratio when resizing.** Extract the viewBox dimensions (e.g., `viewBox="0 0 24 24"` → 1:1 ratio) and calculate target dimensions from that ratio. Never hardcode arbitrary width/height that doesn't match the viewBox. For example, a 24×24 viewBox resized to 60px wide must be 60×60, not 120×60.
- Scale to match sibling logo sizes (maintaining the aspect ratio above)

If the script returns `"found": false` or SVG import fails, create a styled text pill as a placeholder (brand name in a rounded rectangle) and flag it for the user to replace manually.

**Checkpoint:** All "Found" items from the manifest are staged in the working file. Screenshot to verify.

#### Phase B: Gap analysis, decomposition verification, and creation plan

**Goal:** Verify the Build Spec's atom decomposition is complete, further decompose where needed, and plan the build order for every atom.

**Step B1: Verify and deepen the Atom generation audit.**

The parent wrote the Build Spec with an initial Atom generation audit. The child's first job is to verify it's deep enough and further decompose where needed:

1. **Read the Build Spec's atomAudit** (from state.json or the conversation). For each Tier 2 atom:
   - Is it compound (contains 3+ distinct sub-elements)? If the Build Spec didn't decompose it, decompose it now — list every sub-element, classify each as Tier 1 or Tier 2.
   - For each Tier 2 sub-element, walk the decision tree in `references/method-selection.md`. Write the full audit row (Candidates / Selected / Why / Why NOT / Pipeline).
   - If a sub-element is itself compound, decompose again. Continue until every leaf has a single-method declaration.

2. **Check for gaps the parent couldn't anticipate.** The parent plans from the Creative Brief and references. The child, being closer to execution, may realize:
   - A "simple" atom is actually compound (e.g., "notification badge" turns out to need an icon + count + colored ring)
   - A sub-element needs a different method than the parent assumed (e.g., the parent said "Figma shapes" but the child sees it needs Quiver for organic curves)
   - New sub-elements are needed that weren't in the original plan (e.g., building a chat mockup reveals the need for typing indicators, read receipts, or status icons)

3. **Record any decomposition changes.** If the child deepened or modified the Build Spec's audit, note what changed so the parent can update state.json. Write this to the build-results JSON under a `decompositionChanges` key.

**Step B2: Plan the build for every atom** (both from the original Build Spec and any new decomposition).

For each atom/sub-element that needs to be created, define:
- **What it looks like** — dimensions, colors, shape, style (reference similar elements from master designs)
- **How to build it** — which tool/method per the Atom generation audit (NOT "which figma-console tools to use" — the method was already decided in the audit)
- **Inspiration source** — if a similar element exists but isn't an exact match, note its node ID

Determine build order — method-aware, from simplest to most complex:
1. **Asset fetches** (logos via fetch-logo.ts, Brand Assets clones — no generation, just retrieval)
2. **External generations** (Quiver SVGs, Image Gen PNGs — generate early so they're ready for composition)
3. Simple Figma shapes (rectangles, circles — no dependencies)
4. Styled Figma shapes (gradients, shadows, corner radius)
5. Text elements (require font loading)
6. **Import external outputs into Figma** (SVG import from Quiver, image fill from Image Gen)
7. Compound elements (assemble sub-elements into composed frames)
8. Connection elements (lines/arrows — build last, depend on element positions)

**Checkpoint:** The creation plan accounts for every atom in the audit. Every atom has a build method, a build order position, and a clear definition of what it looks like.

#### Phase C: Build atoms (bottom-up)

**Goal:** Create each missing element individually. Verify each one before moving on. Do NOT try to build the entire graphic at once.

**Load:** `references/craft-elevation.md` file for per-element Correct vs Elevated strategies. Consult during the per-atom craft-check (step 5 below).

⛔ **Keep each `figma_execute` call to ONE logical operation** — create one element, style one element, move one element. Never create an entire composition in a single call. Large multi-element calls timeout (30s limit), leave partial state when they fail, and skip the per-atom verification that catches issues early. INSTEAD: create → screenshot → verify → next element.

⚠️ **Auto-layout sizing trap:** After setting `layoutMode` on any frame, **always explicitly set both `layoutSizingHorizontal` and `layoutSizingVertical`** in the same call. Figma's defaults are unpredictable — calling `frame.resize(1280, 720)` then `frame.layoutMode = 'VERTICAL'` can silently change the frame's sizing behavior, causing it to collapse to hug its content or stretch unexpectedly. Follow this pattern:

```javascript
// ALWAYS set sizing explicitly after layoutMode
frame.layoutMode = 'VERTICAL';
frame.layoutSizingHorizontal = 'FIXED';  // root frames: always FIXED
frame.layoutSizingVertical = 'FIXED';    // root frames: always FIXED
// For content containers: use 'HUG' or 'FILL' as appropriate
```

Also: **always set `clipsContent = true`** on any frame that is a final deliverable or visual container. Without this, overflowing children appear fine on the canvas but extend beyond the frame bounds — and `figma_capture_screenshot` will NOT show the overflow because it exports at frame bounds with clipping.

Create a temporary working frame to build atoms in isolation. **In exploration mode, this frame MUST be placed inside your assigned Section** (by `sectionNodeId`) — never at page root. All atoms, imports, and intermediate artifacts go inside your Section to prevent cross-direction contamination during parallel builds.
```javascript
// via figma_execute — scope to your Section
const section = await figma.getNodeByIdAsync('YOUR_SECTION_NODE_ID');
const workingFrame = figma.createFrame();
workingFrame.name = "Working — Atoms";
section.appendChild(workingFrame); // CRITICAL: place inside Section, not page root
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
5. **Craft-check the atom** — for Tier 2 atoms, evaluate: is this at "Elevated" or just "Correct" per the craft-elevation strategies? If just "Correct," elevate NOW — don't accumulate craft debt. It's far cheaper to elevate an isolated atom than to fix it after composition. Examples: a background that's a flat solid → add a subtle gradient + noise texture. An avatar that's a colored circle → generate a Quiver illustration. A card with no shadow → add proper shadow depth.
6. **Fix issues** — if the screenshot or craft-check shows problems, fix before continuing

Once simple atoms are verified and elevated, compose them into compound elements (group into auto-layout frames, set spacing/padding, screenshot and verify).

**Checkpoint:** Screenshot the entire working frame. Verify:
- [ ] Every planned atom exists (nothing left as placeholder)
- [ ] Brand colors exact, fonts correct
- [ ] **Aspect ratios preserved:** for every imported SVG, compare the rendered width:height ratio against the source viewBox. A 24×24 viewBox must render square; a 100×25 viewBox must render 4:1. If any element looks stretched or squished, fix it before proceeding.
- [ ] Compound elements hold together visually
- [ ] All layers have descriptive names
- [ ] **Per-atom craft check passed** — every Tier 2 atom is at "Elevated" per the craft-elevation strategies, not just "Correct"

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

   Use spacing values from the brand tokens spacing scale (see `tokens/marketing.md`) — never ad-hoc pixel values.

2. **Build the layout structure** — section frames (header, content, footer, etc.) with auto-layout for editability. Stack layers bottom-to-top: `bg` → structure containers → content (text, images) → branding (logo) → decorative overlays. This ordering must be consistent across all frames.
3. **Move atoms into the composition** — move or clone verified atoms from the working frame into their correct sections, position according to the composition plan
4. **Add connection elements last** — lines, arrows, and connectors depend on final positions. Create them after everything else is placed. Verify connections visually — lines should touch their target elements, not float nearby. **If any layout change happens after connectors are placed** (card resizing, repositioning, re-centering), **delete and rebuild all connectors from scratch** — adjusting individual connectors is error-prone and slower than a clean rebuild.

**Dimensional changes cascade.** Changing an element's width or height can cause content to reflow (e.g., text wrapping changes line count, which changes container height, which collapses spacing with neighbors). Screenshot after **every** dimensional change to catch cascading layout breakage before it compounds.

**Checkpoint:** Full screenshot of the composed design. Verify:
- [ ] All elements from the Build Spec are present
- [ ] Layout matches the composition plan
- [ ] Connection elements actually connect to their targets
- [ ] Visual hierarchy reads correctly
- [ ] Text is readable at intended display size (see output medium table in Step 1)
- [ ] **Thumbnail hierarchy check:** Export at 400px width (`node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 400 } })`) and visually verify — does the focal point dominate? Is the heading readable? Does the composition hold or collapse to flat visual weight? Fix hierarchy issues NOW, before investing in polish.
- [ ] No content overflow or collapsed spacing from dimensional changes
- [ ] ⛔ **Bounds check (MANDATORY — screenshots cannot catch this):** `figma_capture_screenshot` exports with clipping — children that overflow outside the frame are invisible in screenshots but broken on the actual canvas. This is not a 2-4px edge case; overflow can be hundreds of pixels (e.g., an auto-layout sidebar that expanded beyond its parent). **You MUST run this programmatic check after every composition step**, not just at the end. Do not trust screenshots alone for layout verification:
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
- [ ] **Visual depth stack count:** How many of the 6 layers are present (background texture, atmospheric depth, structural elements, content, accent details, interaction cues)? If ≤3 layers, the composition will look flat — add missing layers before proceeding to Phase E. This is cheaper to fix now than during self-critique.
- [ ] **If adapting an existing asset:** screenshot the original reference AND your output — compare element-by-element. "The original" means the source Figma file, not any derived copy (not your HTML mockup, not your plan description). Check arrow directions, element ordering, label placement, and logo usage against the actual source.

#### Direction checkpoint (for novel compositions only)

If the graphic involves a **novel composition** (not adapting a template or existing layout), screenshot the rough layout now — before investing in polish. Show the user and ask: **"Layout direction OK before I refine?"**

Skip this for template-based work (blog covers using established patterns, social images from existing layouts, icon variations). The intent is to catch fundamental direction issues before polish investment — not to add a gate on every graphic.

#### Phase E: Self-critique → Elevate → Polish (3-pass iteration loop)

**Goal:** Iteratively push the graphic from correct to rich to exceptional before it reaches the reviewer. The Build Spec is your floor, not your ceiling — meeting success criteria means the graphic is correct, not that it's done. Each pass ratchets quality upward.

**Load:** `references/craft-elevation.md` file for per-element elevation strategies, the visual depth stack, and contextual elevation prompts.

**Before major revisions:** If the user requests substantial changes to a composed design (not minor tweaks), duplicate the current frame and rename it as a version snapshot (e.g., "Intelligence Layer — v1"). Work on the copy. This provides safe rollback and enables side-by-side comparison when evaluating changes with the user.

**Three-pass self-critique (all 3 passes are mandatory, not optional):**

Each pass captures at two resolutions before evaluating:
- Full resolution: `figma_capture_screenshot` at default scale
- Thumbnail: export at 400px width (`node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 400 } })`)

**Pass 1: Structural correctness — "Is it right?"**

Evaluate against the Build Spec's success criteria. For each criterion, assess: does the current output meet it? Be honest — "close enough" is not passing.

Identify and fix:
- Missing elements from the Build Spec
- Broken brand tokens (wrong colors, wrong fonts, wrong spacing)
- Layout or composition errors (overflow, misalignment, wrong hierarchy)
- Elements that were in the spec but got simplified or skipped during build

**Do not proceed to Pass 2 until all success criteria are met.**

**Pass 2: Craft elevation — "Is it rich?"**

This is the pass that separates flat output from professional output. For EVERY element in the composition (not just the weakest one), evaluate against the elevation strategies in `references/craft-elevation.md`:

1. **Count the visual depth stack layers.** How many of the 6 layers (background texture, atmospheric depth, structural elements, content, accent details, interaction cues) are present? Phase D should have caught ≤3 — but composition changes, connector rebuilds, or layout adjustments may have removed layers. Re-verify. If ≤3, add missing layers. Target ≥5 for the stop criteria.

2. **Element-by-element elevation scan.** Walk every Tier 2 atom and ask: "Is this at 'Correct' or 'Elevated' per the craft-elevation strategies?" For each element still at "Correct":
   - What would a senior designer add that you skipped?
   - What subtle detail would reward closer inspection?
   - Is there visual texture, or is it a flat fill/shape?

3. **Contextual richness check.** Reason from the Creative Brief:
   - Does the audience get richness they'll appreciate? (Developer audience → code-as-visual, monospace craft. Executive audience → editorial composition, bold data.)
   - Does the format get the right treatment? (Blog cover → thumbnail punch. Slide graphic → supports the speaker's narrative.)
   - Does the content earn its visual weight? (Product mockup → realistic chrome and contextual data. Diagram → properly styled nodes and meaningful connectors.)

4. **Implement at least 2 improvements** — either elevating existing elements (Correct → Elevated) or adding new atoms from the additive scan (swoosh, badges, texture layers, mockup chrome, connector details). Fix the elements that have the most room to grow. Screenshot after each fix.

**Every element must receive craft investment — there are no "background" elements that deserve less attention.** The horse-drawing problem (front-loading effort on the hero, phoning in everything else) is the primary failure mode this pass prevents.

**Pass 3: Cohesion and polish — "Is it a unified, premium piece?"**

Zoom out from individual elements and evaluate the whole:

1. **Compositional cohesion** — Does everything feel like it belongs in the same visual universe? Consistent lighting direction, shadow style, color temperature, visual language.
2. **Spacing and rhythm** — Are spacing values from brand tokens (not ad-hoc pixel values)? Does the visual rhythm feel intentional — breathing room where it matters, density where it matters?
3. **Thumbnail integrity** — At 400px, does the hierarchy hold? Does the focal point dominate? Is the headline readable?
4. **Micro-polish** — Alignment precision, consistent corner radii, shadow consistency, proper text truncation if needed.
5. **Final question:** Would this look at home next to a Stripe, Linear, or Vercel marketing graphic? If not, what's the gap?

Fix any issues found. Screenshot after fixes to verify.

**Recursive elevation — the 3 passes are a minimum, not a cap.**

After Pass 3, ask: **"If I showed this to a design lead, what would they push back on?"** If the answer is anything other than "nothing," run another elevation cycle (Pass 2 → Pass 3). Craft elevation is recursive — each cycle should find a new layer of detail or polish to add. The standard is not "did I run 3 passes" but "is this genuinely at the highest level of craft I can achieve with the tools available?"

Stop criteria (when to exit the loop):
- The depth stack has ≥5 active layers
- Every Tier 2 atom is at "Elevated" per the craft-elevation strategies
- The composition passes the "Stripe/Linear/Vercel" cohesion test
- You cannot identify a specific, actionable improvement that would materially elevate the output
- Maximum 5 total passes (to prevent infinite loops) — but reaching 5 should be rare. If you're still finding issues at pass 5, the Build Spec or the atom decomposition was insufficiently detailed.

**After exiting the elevation loop, also do:**
- **Layer organization** — descriptive names on all layers, logical layer order (background → structure → content → decorative)
- **Aspect ratio verification** — for imported SVGs, compare each logo's rendered proportions against its source viewBox
- **Clean up** — delete the "Working — Atoms" frame, remove stray elements

#### Iteration is expected

Visual work is inherently iterative. The craft elevation loop handles internal quality iteration. User feedback drives external iteration (Phase 2 in exploration mode). Structure for it:
- The elevation loop produces polished work → reviewer verifies → THEN present to user
- Don't try to make every detail perfect before the reviewer — but DO iterate past the first draft. The reviewer should see elevated work, not work that "passed the criteria."
- When the user requests changes, assess scope: minor tweaks can be applied in place, but major revisions should use the v1/v2 pattern so nothing is lost.

**Option B: SVG (when code output is specifically needed)**

Best for: icons that ship as code, inline SVGs for docs/web, assets that must be committed to a repo.

Write SVG code directly using brand tokens:
- Use exact hex colors from the brand palette
- Use brand font families in `<text>` elements
- Use consistent spacing and border radius
- Keep SVG clean and well-structured (named groups, meaningful IDs)

**Always import into Figma for review:** Even when the final deliverable is an SVG file, import it into the Figma Graphics Workspace via `figma.createNodeFromSvg(svgString)` so it can go through the standard Phase 5 review loop (`capture-for-review.ts` → reviewer subagent). The SVG file is still the deliverable — Figma is just the review surface.

**Option C: D2 / Mermaid diagrams (for technical diagrams)**

Best for: system architecture, flow charts, sequence diagrams, entity relationships.

D2:
1. Write D2 diagram code
2. Apply brand colors via D2 theming
3. Generate SVG output: `d2 input.d2 output.svg`
4. Import into Figma: `figma.createNodeFromSvg(svgString)` — apply brand typography and colors that D2 theming can't fully control. **Load:** `tools/svg-import.md` file if the SVG uses gradients, `<defs>`, or `<use>` elements (these can fail on import).

Mermaid:
1. Write Mermaid syntax
2. Render via CLI or browser
3. Post-process to apply brand colors if needed
4. Import into Figma: `figma.createNodeFromSvg(svgString)` — same as D2. See `tools/svg-import.md` for complex SVG handling.

All SVG outputs go through Figma for the Phase 5 review loop. The SVG file is the deliverable; Figma is the review surface.

**Option D: AI-generated SVG via Quiver (for illustrations, logos, icons, vector art)**

Best for: illustrations, icons, logos, abstract art, decorative elements, background patterns, custom letterforms — anything with complex vector paths that would be impractical to hand-code. Arrow (Quiver's model) is #1 on SVG Arena and produces clean, layered, editable SVG with semantic grouping.

**Load:** `tools/quiver.md` file for full API details, script usage, and parameter reference.

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
   Vague prompts produce vague, low-quality results. Be specific about subject, style, and constraints.

2. **Set the `instructions` parameter for persistent brand constraints.** The `instructions` channel is separate from `prompt` — use it for brand rules that apply regardless of the subject:

   ```
   --instructions "Brand constraints:
   - Colors: background #FBF9F4, accent #3784FF, primary #231F20, secondary #6B6B6B
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

   The script exposes `--temperature` and `--presence-penalty` flags. Use `--presence-penalty` to further control diversity: negative values (-0.5) reinforce consistency (good for icon sets), positive values (0.5–1.0) push pattern diversity (good for exploration).

   **Explore-then-refine for novel graphics:** When creating something without an established visual direction, use a two-phase approach:
   - **Phase 1 (Explore):** `--temperature 1.2 --presence-penalty 0.5 --n 4` — generate diverse directions. Show the user thumbnails and ask which direction to pursue.
   - **Phase 2 (Refine):** `--temperature 0.5 --presence-penalty -0.3 --n 2 --references <phase-1-winner>` — generate polished variants of the chosen direction.

   Skip Phase 1 for work with an established direction (icon sets matching existing style, illustrations described precisely by the user).

4. **Use reference images for style consistency.** Export 1-2 existing brand assets from Figma as PNG and pass as `--references`:

   ```bash
   # Export an existing Figma asset to PNG first (via figma_execute):
   # node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } })

   bun tools/quiver-generate.ts generate \
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
   bun tools/quiver-generate.ts generate \
     --prompt "Abstract illustration of AI agents collaborating, flat geometric style" \
     --instructions "Colors: #FBF9F4 background, #3784FF accent, #231F20 primary. Minimal, clean." \
     --n 3 \
     --output agent-collab.svg
   ```
   For brand-consistent work, 2-3 well-prompted variants (`--n 2` or `--n 3`) typically produce the best result. More variants with weak prompts produce diminishing returns — quality comes from prompt precision, not volume.

6. **Review output.** The script auto-generates PNG previews alongside each SVG. Visually inspect the PNG using the Read tool (which displays images), then also check the SVG source for objective compliance:

   **Visual inspection (Read the PNG):**
   - Does the graphic match the prompt intent?
   - Is the visual style consistent with the brand?
   - Is the composition clean and intentional?

   **Source inspection (Read the SVG):**
   - Grep hex values — do they match the brand palette (`#FBF9F4`, `#3784FF`, `#231F20`, `#6B6B6B`)?
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
bun tools/quiver-generate.ts vectorize \
  --image screenshot.png \
  --output vectorized.svg
```

Use this when you need to convert an existing raster asset (screenshot, PNG export, photo) into clean, editable SVG. The vectorization preserves structure and separates elements into layers.

**Option E: AI Image Generation (multi-provider — GPT Image + Gemini)**

Best for: photorealistic 3D hero elements, glass/material objects, atmospheric backgrounds, image editing, and any visual element that Figma/Quiver/D2 can't produce. This is a raster pipeline — outputs are PNGs composited into Figma for final assembly with text and brand elements.

**Two providers, each with distinct strengths:**

| Provider | Model | Best for | Key advantage |
|---|---|---|---|
| **GPT Image 1.5** (OpenAI) | `gpt-image-1.5` | Transparent compositing elements, image editing, structured illustrations | Only model with native `background: "transparent"` |
| **Gemini 3.1 Flash Image** (Google) | `gemini-3.1-flash-image-preview` | 3D hero objects, glass/material quality, abstract art, 2D→3D conversion | Native reference image input, conversational editing, 4K output |

**Load:** `tools/openai-image.md` file for GPT Image API details. **Load:** `tools/gemini-image.md` file for Gemini API details.

**Prerequisites:** `OPENAI_API_KEY` and `GOOGLE_AI_API_KEY` must be set. If missing: `./secrets/setup.sh --skill graphics --account inkeep.1password.com`

### Provider routing — which model to use

| Signal in the task | Provider | Why |
|---|---|---|
| Output needs **transparent background** (element for Figma compositing) | **GPT Image** | Only model with native `background: "transparent"` parameter |
| **Image editing** (inpaint, mask-based modification, surgical changes) | **GPT Image** | Edit endpoint accepts mask + prompt. Note: GPT Image masks are soft guidance — the model may modify unmasked areas. For pixel-perfect region protection, generate the scene first, then composite protected elements in Figma. |
| **Structured illustration** (needs correct layout topology, readable labels) | **GPT Image** | Better structural accuracy |
| **3D hero element** (dark tile, glass prism, metallic object) | **Both in parallel** | Quality is 50/50 — generate on both, let user pick direction |
| **Abstract atmospheric** (gradients, volumetric light, particle effects) | **Both in parallel** | Subjective aesthetic — GPT leans cinematic, Gemini leans clean/designed |
| **Glass/material quality** is the priority | **Gemini** | Better refraction, transmission, caustic rendering |
| **2D brand asset → 3D interpretation** | **Gemini** | Dramatically better at converting flat illustrations into 3D scenes |
| **Batch series** (10+ similar images, icon swaps) | **Either + reference image** | Both achieve consistent batches when first output anchors subsequent generations |
| **Iterative refinement** ("make it warmer", "shift the glow") | **Gemini** | Native multi-turn conversational editing |
| Not sure / quality matters most | **Both in parallel** | ~45s wall clock for two outputs. Cheap insurance. |

When routing says "both in parallel," the script generates on GPT and Gemini concurrently and outputs two files. Present both to the user: "GPT version (left) vs Gemini version (right) — which direction?"

### Reference image workflow (brand asset anchoring)

**Feeding brand assets from the design system as references dramatically improves on-brand quality.** Both models support reference images — Gemini natively in the generation call, GPT via the edit endpoint.

**When to use references:**
- Generating a 3D hero element → feed the most relevant brand illustration as style DNA
- Generating a batch series → generate image #1 without reference, then use it as reference for #2-N
- Placing a logo on a 3D surface → generate the surface/scene WITHOUT the logo, then composite the exact logo in Figma. Reference images reinterpret logos (shifted proportions, color drift) — they do not preserve them pixel-perfectly.
- Matching the brand's visual language → feed any illustration from the design system that captures the intended aesthetic

**How to find the right reference:**
1. Check the design system manifest for the most semantically relevant asset — illustrations, backgrounds, gradients, or logos that match the visual intent
2. Export the SVG as PNG: `sips -s format png -Z 1024 path/to/asset.svg --out /tmp/reference.png`
3. Pass to the script: `--reference /tmp/reference.png`

**How references work per provider:**
- **GPT Image:** Reference is sent via the `/v1/images/edits` endpoint (not `/generations`). The model treats it as style guidance while generating new content. Set `input_fidelity: "high"` for faithful style transfer.
- **Gemini:** Reference is sent as `inlineData` alongside the text prompt in the `generateContent` call. Up to 14 reference images (10 object + 4 character). The model uses them as visual context.

### Generation workflow

1. **Craft the prompt** — be specific about subject, materials, lighting, camera, and negative constraints:

   ```
   "A premium dark matte rounded-corner tile (#1A1A1A, thick volumetric slab, chamfered edges)
   floating at a slight angle against a very dark background (#0D0D0D). On the tile face: a
   glowing blue hexagonal shape (#3784FF) inset into the surface like a glass element. Behind
   the tile: blue rim glow (#3784FF). Below: dark reflective floor with blurred reflections.
   Single warm spotlight from top-right. FOV ~30°. Resend product photography quality. No text."
   ```

   Include hex colors, lighting direction, camera perspective, material descriptions, and negative constraints. Vague prompts produce vague results.

2. **Choose provider and generate:**

   ```bash
   # GPT Image (transparent element for Figma compositing)
   bun tools/image-generate.ts generate \
     --prompt "..." \
     --provider gpt \
     --quality high \
     --background transparent \
     --output hero-element.png

   # Gemini (3D hero with brand asset reference)
   bun tools/image-generate.ts generate \
     --prompt "..." \
     --provider gemini \
     --reference /tmp/brand-illustration.png \
     --output hero-3d.png

   # Both in parallel (50/50 quality scenarios — let user pick)
   bun tools/image-generate.ts generate \
     --prompt "..." \
     --provider both \
     --reference /tmp/brand-ref.png \
     --output hero-compare.png
   # Produces: hero-compare-gpt.png + hero-compare-gemini.png
   ```

3. **Review output** — use the Read tool on the PNG to visually inspect:
   - Does the image match the prompt intent?
   - Are brand colors close to specified hex values?
   - Is the lighting and atmosphere appropriate?
   - Any artifacts, unwanted elements, or quality issues?

   **If the output misses — iteration strategy:**
   - **Wrong lighting/mood:** Add explicit direction ("warm spotlight from top-right, no fill light, let shadows go dark")
   - **Wrong composition:** Specify camera ("slightly above center, FOV ~30°, object at 40% of frame")
   - **Wrong colors:** Include hex codes AND color names ("brand blue #3784FF", "near-black #1A1A1A")
   - **Wrong materials:** Describe physics ("matte roughness 0.9", "glass transmission with chromatic aberration", "brushed metal")
   - **Not brand-enough:** Add a reference image from the design system
   - **Gemini-specific:** Use conversational follow-up ("make the rim glow warmer", "increase the glass refraction")

   ⚠️ **Always re-anchor on the original design system reference image**, not on the previous AI-generated output. Iterative AI-to-AI generation compounds distortion — models retrained on their own output produce increasingly distorted results (model self-poisoning). Each generation attempt should start fresh from the brand reference.

**Editing workflow** (GPT Image only — Gemini uses conversational editing instead):

```bash
# Replace background
bun tools/image-generate.ts edit \
  --prompt "Replace the background with a gradient from cream #FBF9F4 to light blue" \
  --image original.png \
  --output new-background.png

# Targeted edit with mask
bun tools/image-generate.ts edit \
  --prompt "Fill the masked area with a potted plant" \
  --image room.png \
  --mask area-to-fill.png \
  --output with-plant.png
```

**Transparent background** (GPT Image only — Gemini does not support native transparency):

```bash
bun tools/image-generate.ts generate \
  --prompt "A glass hexagonal prism, studio lighting, isolated object" \
  --provider gpt \
  --background transparent \
  --output glass-element.png
```

**Hybrid workflow: Image Gen → Figma (the default for all production graphics)**

Image gen produces visual elements. Figma does all text, layout, badges, logos, and final assembly. This separation is intentional — image gen handles what Figma can't (photorealistic 3D, atmospheric effects, glass materials), while Figma handles what image gen can't (precise text, brand tokens, editable layout).

1. **Generate the visual element** — use `--background transparent` (GPT) if the element will be layered, or generate a full dark-background scene if it IS the background
2. **Place in Figma** — create a rectangle with image fill, or guide the user to drag-and-drop the PNG
3. **Compose in Figma** using the Option A workflow — add brand logos (cloned from design system), text (using brand fonts), layout structure, and badges around the generated element
4. **Apply brand consistency** — verify the generated element looks right alongside Figma-native elements

**Option F: Three.js 3D render (for deterministic 3D, exact brand colors, parameterized batches)**

**Image Gen (Option E) produces equivalent visual quality to R3F for most 3D scenarios.** Both methods can achieve Resend-quality 3D renders with brand asset references. The selection between them is based on fidelity requirements, not speed.

**Use R3F (Option F) when the atom requires fidelity that Image Gen cannot achieve:**
- **Exact hex-color determinism** — same code = same render, every time. Image gen approximates colors through its latent space; R3F is pixel-exact. Choose R3F when brand color precision is non-negotiable.
- **Parameterized batch rendering** — loop over configs in code (swap icon, change color, adjust angle) for 10+ variations with guaranteed visual consistency. Image gen achieves good batch consistency with reference images but can still drift between generations.
- **3D texture library assets** — render atmospheric textures (hexagonal facets, ribbed spheres, bokeh) as reusable PNGs for Figma backgrounds. Deterministic rendering ensures the texture is identical every time.
- **Precise geometric branded shapes** — CSG boolean operations (`@react-three/csg`) carve exact shapes (logo carved into surface, hexagonal cutouts). Image gen cannot produce geometrically exact boolean operations.

**Use Image Gen (Option E) when R3F's additional fidelity is not required:**

| Scenario | Recommended | Why (quality basis) |
|---|---|---|
| One-off 3D hero element | **Image gen** | Equivalent visual quality; R3F's color determinism is not needed for one-off elements where slight color approximation is acceptable |
| Integration tile series (10+ tiles) | **Evaluate both** | Image gen + reference anchoring for visual quality; R3F if pixel-identical consistency across all tiles is required |
| Abstract 3D background | **Image gen** | Atmospheric/volumetric effects are a strength of image gen; R3F achieves similar quality but requires more scene-building |
| 3D concept exploration | **Image gen** | Equivalent quality for directional exploration; R3F adds no fidelity advantage at the concept stage |
| Precise geometric branded shape | **R3F with CSG** | Image gen cannot carve exact geometric shapes — R3F is the only method that achieves this |

Best for: 3D rendered objects with exact brand colors, parameterized batch rendering, and reusable 3D texture library assets. The agent writes the 3D scene as a React Three Fiber (R3F) TSX component — declarative scene graph with drei staging helpers, full control over every material, light, and camera property.

**Load:** `tools/r3f/README.md` file for the rendering pipeline, scene template, and reference index to deeper files (materials, staging, advanced features).

**Prerequisite:** `three`, `react`, `react-dom`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@react-three/csg`, `playwright`, and `three-bvh-csg` are auto-installed on first use. For GPU-quality rendering, system Google Chrome must be installed (the script uses `channel: 'chrome'` for Metal GPU access on macOS). Optional: `MESHY_API_KEY` for AI-generated 3D meshes via Meshy.ai (only needed for text-to-3D generation, not for code-built scenes).

**Rendering pipeline:**

1. **Write the scene** — create a TSX file using R3F + drei. Scenes are declarative React components:

   ```tsx
   import { Canvas } from '@react-three/fiber';
   import { Environment, ContactShadows, RoundedBox, MeshTransmissionMaterial } from '@react-three/drei';
   import { createRoot } from 'react-dom/client';

   function Scene() {
     return (
       <Canvas gl={{ preserveDrawingBuffer: true, antialias: true }} camera={{ position: [0.5, 1.5, 5], fov: 32 }} shadows>
         <Environment preset="studio" environmentIntensity={0.8} />
         {/* ... scene objects using brand material presets from tools/r3f/README.md ... */}
         <ContactShadows position={[0, -0.5, 0]} opacity={0.3} scale={10} blur={2.5} />
         <RenderSignal />
       </Canvas>
     );
   }
   createRoot(document.getElementById('root')!).render(<Scene />);
   ```

   Use the **brand material presets** from `tools/r3f/README.md`: `inkeepBlueClay` for matte plastic, `inkeepGlass` (drei `MeshTransmissionMaterial`) for glassmorphic, `inkeepGoldenAccent` for warm accents. Use drei's `<Environment preset="studio">` for brand-consistent lighting.

2. **Render to PNG:**
   ```bash
   bun tools/r3f/render.ts render \
     --scene my-scene.tsx \
     --output 3d-element.png \
     --width 1280 --height 720 --scale 2
   ```

   The script bundles the scene via Bun, serves locally, launches system Chrome (GPU-accelerated), waits for the render signal, and captures a screenshot at 2560×1440 (2x retina).

   For transparent backgrounds (compositing in Figma): add `--mode compositing`.

3. **Review output** — use the Read tool on the PNG to visually inspect:
   - Do materials match the intended style (glass, clay, metallic)?
   - Are brand colors correct?
   - Is the composition and lighting appropriate?
   - Any WebGL artifacts?

   **If the output misses:** Adjust material properties (roughness, metalness, transmission), light positions/intensities, or camera angle in the scene file and re-render. Each render takes ~5 seconds.

**Hybrid workflow: Three.js → Figma** — render with `--mode compositing` for transparent PNG, import into Figma, compose with brand text and layout. See `tools/r3f/README.md` § "Hybrid workflow: Three.js → Figma" for the full step-by-step.

### 5. Apply brand consistency

**Mark task "Graphics: Build directions" (or "Graphics: Build graphic") as `completed`. Mark task "Graphics: Craft elevation → Review → Polish" as `in_progress`.**

⛔ **Phase E (self-critique loop) must have completed before entering this step.** If you skipped Phase E, go back and run it now. The reviewer evaluates polished work, not first drafts.

This phase uses a two-layer verification model. Layer 1 catches programmatic issues. Layer 2 spawns a reviewer subagent for visual evaluation. The reviewer evaluates against the same brand and graphics guidelines you follow — compliance checking (did you follow the rules?) plus craft assessment (does it actually look good?).

**Layer 1: Programmatic checks (max 3 iterations)**

For Figma designs:
1. Run `figma_lint_design` on the root frame:
   - **Hardcoded colors** not bound to variables (visually identical but not token-linked)
   - **Unnamed layers** (default names like "Frame 47", "Rectangle 12")
   - **WCAG contrast violations** (AA 4.5:1 for normal text, 3:1 for large text)
   - **Text below 12px**, interactive targets below 24x24px, line height below 1.5x
   - **Missing text styles**, detached components, frames without auto-layout
2. Run programmatic bounds check (see Phase D checkpoint code) — screenshots cannot catch overflow
3. Verify correct canvas dimensions and aspect ratio per the format standard

For Quiver SVG:
- Grep hex values in the SVG source against the brand palette
- Verify viewBox dimensions and aspect ratio match intended output
- Check for `<text>` elements that shouldn't be present (Quiver should render text as paths)
- Flag SVG files >500KB for simple illustrations (indicates path fragmentation or decimal bloat)

Fix any findings. Re-run until Layer 1 is clean (max 3 iterations). Do not proceed to Layer 2 until Layer 1 passes.

**Layer 2: Visual evaluation via reviewer subagent (max 3 iterations)**

Spawn the reviewer subagent. The reviewer is self-sufficient — it captures its own screenshots, inspects atoms as needed, and evaluates against the loaded brand and graphics skills.

```
Agent tool:
  description: "Review graphics output"
  subagent_type: general-purpose
  model: opus
  prompt: |
    You are reviewing a graphic for brand compliance, visual quality,
    and craft richness. A graphic that is technically correct but
    visually flat or generic should receive NEEDS REVISION.

    Before doing anything:
    1. Load the `brand` skill (via Skill tool)
    2. Load the `graphics` skill (via Skill tool)
    3. Read the evaluation methodology at:
       <path-to-graphics-skill>/prompts/visual-evaluation.md
    4. Read the reviewer context at:
       <path-to-graphics-skill>/references/visual-inspection.md
    5. Read the craft elevation guide at:
       <path-to-graphics-skill>/references/craft-elevation.md

    Capture your own screenshots using the capture script:
    ```bash
    bun <path-to-graphics-skill>/scripts/capture-for-review.ts \
      --node-id "<frame-node-id>" \
      --file-key "<file-key>" \
      --name "<graphic-name>"
    ```
    This produces review.png (1568px) + proportional.png (400px)
    in tmp/review/<name>/. Read both via the Read tool.

    For complex compositions with dense detail, inspect individual
    atoms by re-running the script with specific child node IDs:
    ```bash
    bun <path-to-graphics-skill>/scripts/capture-for-review.ts \
      --node-id "<child-node-id>" \
      --file-key "<file-key>" \
      --name "<graphic-name>/atoms/<node-name>"
    ```
    Discover child node IDs via figma_get_file_for_plugin with
    the parent frame's node ID. Inspect FRAME children (mockups,
    cards, sidebars), not leaf nodes (text, rectangles).

    Source file (SVG outputs only — cross-reference with screenshots):
    - <path to .svg file, or "N/A" for Figma/raster outputs>

    Context:
    - Frame node ID: <node-id>
    - File key: <file-key>
    - Format: <format name>
    - Purpose: <what this graphic is for>
    - Dimensions: <WxH working canvas>
    - Output type: <Figma / Quiver SVG / AI Image Gen / etc.>
    - Content types present: <list all — illustration, product mockup, etc.>
    - Part of series: <yes/no>

    Evaluate along THREE dimensions:
    1. Brand compliance — correct tokens, fonts, colors, logo usage
    2. Structural correctness — elements present, hierarchy reads,
       layout matches spec, thumbnail readability
    3. Craft richness — visual depth (count the depth stack layers),
       element-level polish (Correct vs Elevated per craft-elevation
       strategies), compositional cohesion, texture and detail density.
       A flat, generic composition that meets criteria 1-2 is still
       NEEDS REVISION.

    Provide detailed findings with clear reasoning. Cite specific
    visual evidence from the screenshots (and source file when
    available) for every finding.
```

3. **Read the reviewer's verdict and act:**
   - **PASS** → proceed to Phase 6 (export & deliver)
   - **PASS WITH SUGGESTIONS** → implement the suggested quick fixes, proceed to Phase 6 (no re-review needed)
   - **NEEDS REVISION** → read the findings, implement fixes, then restart from Layer 1 (fixes may break programmatic checks). Respect the iteration cap.

4. **After 3 Layer 2 iterations without PASS** → present the reviewer's full findings to the user and let them decide how to proceed.

All SVG outputs (Quiver, hand-coded, D2/Mermaid) should be imported into Figma before reaching this phase — the Figma frame is the review surface. Pass the original SVG file path in the reviewer spawn prompt for source cross-referencing.

**Mark task "Graphics: Craft elevation → Review → Polish" as `completed`.**

### Present to user (gate between review and export/iteration)

⛔ **Mark task "Graphics: Present to user" as `in_progress`. Before presenting ANY frame to the user, verify:**
- [ ] **Self-critique loop completed** — Phase E ran at least 1 iteration on this frame
- [ ] **Reviewer passed** — Layer 2 reviewer returned PASS or PASS WITH SUGGESTIONS (suggestions were implemented)
- [ ] **In exploration mode:** `build-results/<slug>.json` exists with a `reviews` array where the last entry has `"verdict": "PASS"`
- [ ] **No self-certified verdicts** — if any frame's reviews array is empty, or the last verdict is `SELF-REVIEWED` / `SELF_PASS` / any non-reviewer verdict, the frame has NOT been independently reviewed. The parent MUST spawn a reviewer for that frame before presenting.

**If any frame has not passed both the self-critique loop and an independent reviewer, run them now before presenting.** This is the structural enforcement of "every frame must pass the reviewer before the user sees it." Self-reported pass verdicts from the builder do not count.

After presenting and receiving user feedback, mark this task `completed` and proceed to either "Iterate on user feedback" (if changes requested) or "Export & deliver" (if approved).

### 6. Export and deliver

**Mark task "Graphics: Export & deliver" as `in_progress`.**

**Working resolution and export:** Some formats use a smaller working canvas and export at 2x for the final output (blog covers: 1280×720 working → 2560×1440 export, YouTube banners, case study heroes). Figma vectors scale losslessly, so export at 2x with `exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } })`. For formats already at their final pixel size (OG images, social posts, LinkedIn), export at 1x.

**For Figma designs (primary):**
1. Verify the design in Figma:
   - [ ] Correct dimensions and aspect ratio
   - [ ] All layers are named descriptively
   - [ ] Auto-layout is applied where appropriate (for editability)
   - [ ] Text is readable at the intended display size
   - [ ] No orphaned or mispositioned elements
2. Share the Figma file URL with the user
3. If PNG/SVG export is also needed, use `figma_execute` to export. For working-canvas formats, export at 2x scale to produce the final resolution.

**Handoff to Google Slides:** When the graphic needs to land in a Google Slides deck:
1. **Strip master-provided elements** — if the target slide's layout/master provides headers, labels, or icons, create a separate export version of the Figma frame with those elements removed to avoid visual doubling
2. **Export** — use `figma_execute` with `node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 4 } })` for high-res output
3. **Host the image** — Google Slides `add_image_to_slide_tool` requires a publicly accessible URL. Export to base64, save locally as PNG, upload to a temporary host or Google Drive
4. **Place the image** — coordinate mapping from Figma to Google Slides: `gslides_pt = figma_px × 0.75` (for 960×540 Figma canvas → 720×405 pt Google Slides). Full-slide placement: `x=0, y=0, width=720, height=405`
5. **Verify** — export the slide as PDF and visually confirm alignment with the slide master

This pipeline has friction (public hosting, coordinate mapping, master element stripping). When possible, defer to the **gslides skill** for the full insertion workflow.

**For code-based deliverables (SVG, D2, Mermaid):**
The graphic was already imported into Figma and reviewed in Phase 5. For delivery:
1. Save the original SVG file to the appropriate location
2. If PNG export is also needed, export from the Figma frame at the required scale
3. Share the SVG file path + Figma URL with the user

⛔ **Final visual inspection (REQUIRED before telling the user the graphic is done).**

Screenshot every deliverable at its final dimensions using `figma_capture_screenshot`. Visually inspect each one and verify:
- [ ] Nothing looks "off" — no clipped text, overflow, misalignment, or visual artifacts
- [ ] Text is fully readable and not truncated or wrapping unexpectedly
- [ ] All elements are within frame bounds (nothing cut off at edges)
- [ ] **Thumbnail readability (for blog covers/social images):** Export at target card width via `figma_execute`: `await node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 300 } })`. Verify the title is legible and the composition reads clearly at this reduced size. If text is unreadable, the font size is too small — go back and fix before delivering.
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
- [ ] Atom generation audit completed — every Tier 2 atom has quality-based method justification, compound atoms decomposed to leaf elements
- [ ] Craft elevation loop completed — all 3 passes run (+ recursive cycles if warranted), depth stack ≥5 layers, every Tier 2 atom at "Elevated" per craft-elevation strategies
- [ ] Deliverable shared with user (Figma URL or file path)
- [ ] For Figma: no placeholder content — every element is real (actual logos, icons, text)
- [ ] For Figma: visual checkpoint completed at each workflow phase
- [ ] For Quiver: brand colors and style constraints passed via `instructions` parameter (never generate without brand instructions)
- [ ] For Quiver: SVG output reviewed — verify hex colors in source match brand palette
- [ ] For AI Image Gen: output visually inspected via Read tool before delivering
- [ ] For AI Image Gen: correct provider chosen per routing table (GPT for transparency/editing, Gemini for 3D/glass, both for 50/50 scenarios)
- [ ] For AI Image Gen: reference image from design system used when generating brand-adjacent content

Should have:
- [ ] Plan reviewed by user before generation
- [ ] Consistent with existing brand assets in style and feel
- [ ] For Figma: layers named descriptively, auto-layout applied for editability
- [ ] For Figma: atoms built and verified individually before composition
- [ ] For SVG: clean, well-structured code
- [ ] For Quiver: reference images used when generating icon sets or matching existing brand style
- [ ] For Quiver: prompt uses 5-component structure (subject + style + palette + composition + constraints)
- [ ] For AI Image Gen: brand colors included as hex codes in the prompt when brand consistency matters
- [ ] For AI Image Gen: `--background transparent` (GPT only) used when element will be composited in Figma
- [ ] For AI Image Gen: "both in parallel" used for 3D hero elements and abstract art where quality is subjective
- [ ] Multiple sizes if needed for different contexts

## Anti-patterns

- **One-shot generation**: Never try to build the entire graphic in one pass. INSTEAD: one `figma_execute` call per element → screenshot → verify → next element. Build atoms individually in a working frame, then compose into the final layout.
- **Placeholder content**: Never leave "Icon here", empty shapes, or "TODO" labels. INSTEAD: search Brand Assets page (logos, icons, third-party logos), then SVG logo sources (`tools/logo-sources.md`). If truly unfindable, create a styled text pill and flag it for the user to replace.
- **Skipping visual checkpoints**: Don't assume it looks right. INSTEAD: `figma_capture_screenshot` after creating each atom, after each dimensional change, and before delivering. Run `figma_lint_design` at Step 5 to catch what screenshots miss (hardcoded colors, contrast, unnamed layers).
- **Creating from scratch when a Figma component exists**: INSTEAD: always search Brand Assets page (node `5003:63`) first — it has curated logos, icons, illustrations, customer assets, third-party logos, and backgrounds. Check `references/figma-assets.md` navigation table for which section to search.
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
- **Using Quiver for data visualization**: Quiver can't produce charts with accurate data values. Use Figma (Option A) with the code recipes in `content-types/data-visualization.md` — native primitives (arcData for pie/donut, vectorPaths for line charts, rectangles for bar charts) produce editable, brand-consistent charts.
- **Quiver without brand instructions**: Always pass brand tokens in `--instructions` (separate from `prompt`). Without them, Quiver generates with its own palette. Include explicit hex codes and negative constraints ("no gradients unless specified").
- **Vague Quiver prompts**: "A nice icon" produces random, low-quality output. Use the 5-component prompt structure: subject + style + color palette + composition + constraints. Quality comes from prompt precision.
- **Skipping Quiver output review**: Always read and verify the generated SVG before delivering — check hex values in the SVG source against the brand palette, not just visual impression
- **Undirected Quiver generation**: Generating many variants with a vague prompt produces diminishing returns. 2-3 well-prompted variants outperform 16 undirected ones. For brand-consistent work, one precisely-prompted generation often suffices.
- **Using image gen for vector assets**: Image gen produces raster PNGs that pixelate when scaled. For icons, logos, or illustrations that need to work at multiple sizes, use Quiver (Option D) for SVG output.
- **Using image gen for text or layouts**: NEVER put text in generated images — Figma handles all text. Image gen produces visual elements only, which are composited in Figma.
- **Image gen without visual inspection**: Always Read the output PNG before delivering. The agent can see images — verify the result matches intent before showing the user.
- **Defaulting to one provider**: Use the provider routing table. GPT for transparency/editing, Gemini for 3D/glass quality, both in parallel for 50/50 scenarios. Don't always use GPT just because it's the existing default.
- **Image gen without reference images**: When generating brand-adjacent content (3D tiles, atmospheric backgrounds, illustrations), always check the design system for a relevant reference asset. A matching reference dramatically improves on-brand quality on both providers.
- **Using R3F when Image Gen achieves equivalent fidelity**: Image Gen with a brand asset reference produces equivalent visual quality for most 3D hero elements. Use R3F only when the atom requires fidelity Image Gen cannot achieve — exact hex-color determinism, parametric batch consistency, or CSG boolean precision.
- **Vague image gen prompts**: "A nice photo" produces generic stock imagery. Include subject, materials, lighting direction, camera perspective, hex colors, and negative constraints.
- **Skipping the craft elevation loop**: Jumping from Phase D (compose) directly to the reviewer without running the 3-pass elevation loop. The reviewer should see elevated work, not first drafts. A graphic that passes all success criteria but has ≤3 depth stack layers and no brand signature elements (swoosh, dot connectors, accent badges) is not ready for review.
- **Horse-drawing — front-loading craft on the hero, phoning in the rest**: The headline gets letter-spacing and a swoosh, but the background is a flat solid fill, the mockup is rectangles with labels, and the cards are all the same color. INSTEAD: every element receives equal craft investment. Count Tier 2 atoms at "Elevated" — if the hero is elevated but secondary elements aren't, the composition will look uneven.
