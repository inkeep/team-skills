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

**Load:** `/brand` for brand identity (principles, logo rules, typography, color usage, illustration style, composition patterns, element recipes). For applying tokens in Figma code, **Load:** `references/figma-patterns.md`. For full token values, read `tokens/marketing.md`.

| Collection | What it covers | Key usage rules |
|---|---|---|
| **Inkeep Colors** | Core palette, card backgrounds, surface colors, UI utility colors | Bind via `setBoundVariableForPaint`. Card backgrounds rotate through `card/warm-peach`, `card/light-blue`, etc. **Never use #FFFFFF as page background** — use `bg/primary`. |
| **Inkeep Spacing** | Base scale (4-48px) + contextual layout spacing (section gaps, hero padding, page max-width) | Base scale for component internals. Contextual tokens for page layout (`spacing/section-gap` = 100px between sections). |
| **Inkeep Radius** | Full range from 2px micro to 80px large headers | The signature aesthetic uses **large radii**: 32px for feature cards, 47px for use case cards, 60px for hero badges. `radius/pill` (9999) for buttons. |
| **Inkeep Typography** | Font families, semantic sizes, weights, tracking (letter-spacing), leading (line-height) | **Strict rules:** Neue Haas for headings (weight 400), JetBrains Mono for labels (weight 500, **always uppercase**), Noto Serif for body (weight 300). Never mix more than 2 typefaces per component. |
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

### Step 0: Create workflow tasks (MANDATORY FIRST ACTION)

⛔ **Before doing anything else**, create these tasks to track workflow progress. This is not optional — skipping this step is the primary cause of the agent jumping straight to building without collecting assets or brand tokens.

Create these tasks in order:
1. `"Graphics: Parse request"` → set to `in_progress`
2. `"Graphics: Creative brief"` → pending
3. `"Graphics: Collect assets & brand tokens"` → pending
4. `"Graphics: Plan composition"` → pending
5. `"Graphics: Generate graphic"` → pending
6. `"Graphics: Brand consistency check"` → pending
7. `"Graphics: Export & deliver"` → pending

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

- **Dimensions**: determine from the output medium. **Load the matching format file** from `formats/` for exact dimensions, design guidelines, and best practices:

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

  **Load:** `formats/multi-format.md` for the master+derive pattern, per-format content adaptation rules, and the clone→resize→adapt procedure.

  If the user only requests a single format, skip this — the standard workflow applies unchanged.

- **Content analysis** (when the user provides a blog post, article, or content to create graphics for): Scan the content and suggest a visual approach before planning:

| Content signal | Suggested visual approach |
|---|---|
| Key statistic or metric in the content | **Bold data callout** — large stat as hero element |
| Comparison between options/products | **Split layout or comparison table** — side-by-side with pros/cons |
| Step-by-step process or workflow | **Sequential diagram** — numbered steps with flow arrows |
| Customer quote or testimonial | **Quote card** — speaker photo + quote text |
| Product feature or UI explanation | **Annotated product mockup** — simplified UI with callouts. **Load:** `/brand` → `references/product-representation.md` (fidelity decision) → `tokens/product.md` (product UI tokens for inside the mockup) → `references/element-patterns.md` (styling recipe). **Critical:** product mockups use product tokens inside (Inter, white bg, 8px radii) and marketing tokens outside (Neue Haas, cream, 32px radii). |
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
| Charts, graphs, data visualizations (bar, line, pie, donut, sparkline) | **Figma (Option A)** | Native primitives produce editable, brand-consistent output. **Load `content-types/data-visualization.md`** — contains both design guidelines (chart selection, colors, labeling) AND code recipes (arcData, vectorPaths) |
| Simple structural SVGs (basic shapes, inline diagrams) | **Hand-coded SVG (Option B)** | Exact control; simple enough to write directly; humans can maintain the code |
| System architecture, flowcharts, sequence diagrams | **D2/Mermaid (Option C)** | Purpose-built diagram languages with automatic layout |
| Converting a raster image to SVG | **Quiver vectorize (Option D)** | AI-powered raster-to-vector conversion |
| Illustration FOR a slide/marketing layout | **Quiver (Option D) → Figma (Option A)** | Generate the illustration with Quiver, import into Figma, compose with brand elements and text — see hybrid workflow in Option D |
| Photorealistic images, product mockups, realistic scenes | **AI Image Gen (Option E)** | Multi-provider raster generation — GPT Image or Gemini. See provider routing below. |
| 3D hero elements (dark tiles, glass objects, atmospheric renders) | **AI Image Gen (Option E)** | Faster than R3F with comparable quality. Feed brand assets as references for on-brand results. |
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
- **Use Quiver:** anything with organic curves, hand-drawn style, complex path work, stylized illustrations, decorative patterns, abstract art, or the "Imperfect Precision" brand illustration style. If the illustration would take >15 minutes to build from Figma shapes, use Quiver.

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

The Creative Brief captures the **what** and **why** — who this is for, what it should say, and what the viewer should do. The Composition Brief (Step 3) captures the **how** — visual layout, recipes, and patterns. Separating these prevents the observed failure mode of jumping to visual execution without understanding the message.

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
- **Key message** → determines what's visually dominant in the Composition Brief (Step 3)
- **Hero content** → determines which artifact recipe to apply (product mockup? code-as-visual? metric callout?)
- **Audience** → influences tone translation (developer-facing = monospace-forward, technical depth; executive-facing = clean, stat-forward)
- **Goal + CTA** → determines whether the graphic needs a CTA element, urgency signals, or is purely brand/awareness
- **Tone** → maps to warm vs dark background decision, color accent choices, visual density

**Why this exists:** Without this step, the observed failure mode is the agent producing visually polished graphics that communicate the wrong message, feature the wrong content, or target the wrong audience — because it never asked. 95% of design misalignment traces to brief quality (Superside research). The cost of one confirmation round is far lower than the cost of rebuilding a graphic that missed the point.

**Mark task "Graphics: Creative brief" as `completed`.**

---

### 1c. Product context discovery (when hero content involves the product)

**Skip this step if** the hero content is purely typographic, abstract, or logo-based. Only run it when the Creative Brief calls for product UI, a feature mockup, or a visual that needs to represent what the product actually does.

**Goal:** Understand the feature/product well enough to build a convincing visual representation. You don't need to replicate the exact product UI — you need to understand what the feature IS, what its key UI elements are, and what makes it visually distinctive.

**Step 1: Check working directory for product context**

```bash
# Quick detection — does this look like a product codebase?
ls package.json src/ specs/ docs/ PRDs/ .cursor/ CLAUDE.md 2>/dev/null
```

| What you find | What to do |
|---|---|
| **Product source code** (src/, app/, components/) | Use the Explore agent to search for UI components related to the feature. Look for: component names, prop types, UI states, key interactions. Extract the CONCEPTS, not the code. |
| **Specs or PRDs** (specs/, PRDs/, docs/*.md) | Read any spec related to the feature being graphiced. Extract: what the feature does, what the user sees, key UI elements, user flow. |
| **Marketing site code** (with public/images/) | Check if existing illustrations or screenshots of the feature already exist. These are the canonical "how we show this product" references. |
| **CLAUDE.md or project docs** | Scan for feature descriptions, product overview, or architecture notes that explain what the product does. |
| **Nothing relevant** | Move to Step 2. |

**Step 2: If no product context found, ask the user ONE question**

"The graphic calls for a product mockup of [feature]. To make it look convincing, I need to understand what the feature looks like. Can you point me to any of these?
- A URL showing this feature (live product, staging, or demo)
- A spec, PRD, or doc describing the UI
- An existing screenshot or mockup
- Or just describe the key UI elements in a sentence"

If the user provides context, use it. If they say "just make it up" or "use your best judgment," proceed with a stylized representation using the illustration system (`content-types/illustration.md`).

**Step 3: Capture what you learned**

Write 2-3 bullet points in the Composition Brief (Step 3) under "Product context":
- What the feature does (one sentence)
- Key UI elements the mockup should show (e.g., "conversation thread with agent response + approve/deny buttons")
- Visual metaphor if not showing literal UI (e.g., "network of channel nodes radiating from a central hub")

This grounds the visual in the actual product without requiring pixel-accurate UI reproduction.

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

**Load:** `references/figma-assets.md`

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
4. **For AI image gen with logos:** Export the logo as PNG from step 1 or 2, then feed it as a `--reference` image. Both GPT and Gemini preserve logos faithfully when given as references.

**Record the brand profile in the Asset Manifest** (section h below).

**g) Pull Inkeep brand tokens from Figma**

Use the Figma MCP to extract brand tokens from the design system.

**Load:** `references/figma-assets.md` for the Figma file URL. For token values, read `tokens/marketing.md`.

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

**Load:** `/brand` and load any reference files relevant to your task following the skill's reference loading guidance for your content. This is important for ensuring you are fully grounded and can leverage brand assets, tokens, and guidance. Use these to inform every composition decision below.

**If the graphic includes illustrations, visual metaphors, or decorative elements in the Inkeep hand-drawn style:**
**Load:** `content-types/illustration.md` for the dual-stroke visual language (hand-drawn gray containers + precise blue fills), color palette, composition patterns, Quiver generation instructions, and the blue swoosh underline signature element.

⛔ **Produce a Composition Brief before proceeding.** This is the checkpoint that prevents the "skip reference files" failure mode — planning from general knowledge instead of brand-specific recipes and patterns.

Write out the brief using this template:

```
## Composition Brief

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

### Generation method per element
(For each visual element, declare which tool and why. Consult the output format table in Step 1.)
- Illustrations/icons/abstract art: ___ (Quiver / Figma shapes / N/A — why?)
- Logos (Inkeep): ___ (cloned from Brand Assets node ID: ___)
- Logos (third-party): ___ (cloned from Brand Assets / fetched via fetch-logo.ts / N/A)
- Product screenshots: ___ (Figma mockup / real screenshot + styling / N/A)
- Photorealistic imagery: ___ (GPT Image / N/A)
- Text and layout: Figma (always)
- Hybrid composition needed? ___ (e.g., "Quiver illustration → import to Figma → add text + brand elements")

### Composition plan
- Layout: overall structure, element placement
- Content elements: text, icons, shapes, images, data points
- Color mapping: exact token names from brand-tokens.md for Inkeep elements (not hex from memory). **For third-party brand elements** (competitor side of a comparison, customer in a case study), use colors from the brand profile fetched in Step 2f — map `brand` → primary accent, `dark` → text color, `light` → background tint. If no brand profile was fetched, default to Inkeep palette.
- Typography mapping: font + weight + size for each text element. If the brand profile includes a Google Fonts title font, consider using it for the third-party brand's name/heading to reinforce their identity.
- Illustration style (if applicable): hand-drawn rules from brand-guide.md

### Anti-pattern check
- [ ] Background is NOT flat (has texture/gradient)
- [ ] Surround uses ≤3 colors (mockup internals don't count)
- [ ] Badge is ≤1/8 heading visual weight
- [ ] No raw screenshots (all product UI is stylized)
- [ ] Max 2 typefaces in this graphic
- [ ] Illustrations use Quiver (not hand-built Figma shapes) unless purely geometric
- [ ] Third-party logos are real assets (not text/shape approximations)
```

**Rules for the brief:**
- Every recipe must be explicitly marked YES or NO — skipping the scan is the failure mode this prevents
- Every visual element must declare its generation tool — this prevents defaulting to Figma shapes for everything
- Color values must reference token names (`brand/primary`, `bg/surface`) not bare hex codes from memory
- If no artifact recipes apply (e.g., a pure diagram), note "None — diagram only, using diagram rules from brand-guide.md"
- The anti-pattern check must all pass before presenting to the user. If any fail, fix the plan first.
- If an illustration or icon is marked "Figma shapes" instead of Quiver, justify WHY (only acceptable for purely geometric compositions like simple diagrams)
- If a third-party logo is not sourced from Brand Assets or fetch-logo.ts, STOP — logos must never be approximated

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

Present the Composition Brief to the user for review before generating.

**Mark task "Graphics: Plan composition" as `completed`.**

### 4. Generate the graphic

⛔ **Mark task "Graphics: Generate graphic" as `in_progress`. Before creating ANY Figma elements, verify:**
- [ ] **Asset manifest exists** — Step 2 produced a manifest listing found/missing/approximated assets
- [ ] **Brand tokens collected** — you have exact hex colors and font families from the design system, not from memory or the user's message
- [ ] **Logos are real** — any Inkeep or third-party logos are cloned from the Brand Assets page or fetched via `tools/fetch-logo.ts`, not approximated with text or shapes
- [ ] **Plan was confirmed** — the user reviewed and approved the composition plan

**If any of these are not met, STOP and complete the missing step before proceeding.**

**Load:** `tools/figma-console.md` for tool reference and common patterns.

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

**Load:** `tools/logo-sources.md` for source details, coverage gaps, and manual API patterns if needed.

Import the resulting SVG into Figma via `figma.createNodeFromSvg(svgString)` in `figma_execute`. **Load:** `tools/svg-import.md` if the SVG is complex (gradients, masks, filters) or from Brandfetch (brand-uploaded, variable quality). Simple Icons SVGs always import clean; Iconify logos are ~90% safe. After import:
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

⚠️ **Auto-layout sizing trap:** After setting `layoutMode` on any frame, **always explicitly set both `layoutSizingHorizontal` and `layoutSizingVertical`** in the same call. Figma's defaults are unpredictable — calling `frame.resize(1280, 720)` then `frame.layoutMode = 'VERTICAL'` can silently change the frame's sizing behavior, causing it to collapse to hug its content or stretch unexpectedly. Follow this pattern:

```javascript
// ALWAYS set sizing explicitly after layoutMode
frame.layoutMode = 'VERTICAL';
frame.layoutSizingHorizontal = 'FIXED';  // root frames: always FIXED
frame.layoutSizingVertical = 'FIXED';    // root frames: always FIXED
// For content containers: use 'HUG' or 'FILL' as appropriate
```

Also: **always set `clipsContent = true`** on any frame that is a final deliverable or visual container. Without this, overflowing children appear fine on the canvas but extend beyond the frame bounds — and `figma_capture_screenshot` will NOT show the overflow because it exports at frame bounds with clipping.

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

   Use spacing values from the brand tokens spacing scale (see `tokens/marketing.md`) — never ad-hoc pixel values.

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
- [ ] **If adapting an existing asset:** screenshot the original reference AND your output — compare element-by-element. "The original" means the source Figma file, not any derived copy (not your HTML mockup, not your plan description). Check arrow directions, element ordering, label placement, and logo usage against the actual source.

#### Direction checkpoint (for novel compositions only)

If the graphic involves a **novel composition** (not adapting a template or existing layout), screenshot the rough layout now — before investing in polish. Show the user and ask: **"Layout direction OK before I refine?"**

Skip this for template-based work (blog covers using established patterns, social images from existing layouts, icon variations). The intent is to catch fundamental direction issues before polish investment — not to add a gate on every graphic.

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

**Load:** `tools/quiver.md` for full API details, script usage, and parameter reference.

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
   Each variant costs 1 credit. Don't generate more variants than needed — `--n 2` or `--n 3` is usually sufficient.

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

**Load:** `tools/openai-image.md` for GPT Image API details. `tools/gemini-image.md` for Gemini API details.

**Prerequisites:** `OPENAI_API_KEY` and `GOOGLE_AI_API_KEY` must be set. If missing: `./secrets/setup.sh --skill graphics --account inkeep.1password.com`

### Provider routing — which model to use

| Signal in the task | Provider | Why |
|---|---|---|
| Output needs **transparent background** (element for Figma compositing) | **GPT Image** | Only model with native `background: "transparent"` parameter |
| **Image editing** (inpaint, mask-based modification, surgical changes) | **GPT Image** | Mask-based precision via edit endpoint |
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
- Preserving a logo on a 3D surface → feed the logo as reference (both models preserve it faithfully)
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

**Before reaching for R3F, try AI Image Gen (Option E) first.** Image gen with a brand asset reference produces Resend-quality 3D renders in ~15-45 seconds vs 30-60 minutes to write and iterate an R3F scene. Most 3D hero elements that previously required R3F can now be generated faster at comparable quality via Option E.

**Use R3F (Option F) only when you need:**
- **Exact hex-color determinism** — same code = same render, every time. Image gen approximates colors; R3F is pixel-exact.
- **Parameterized batch rendering** — loop over configs in code (swap icon, change color, adjust angle) for 10+ variations with guaranteed visual consistency. Image gen achieves good batch consistency with reference images but can still drift.
- **3D texture library assets** — render atmospheric textures (hexagonal facets, ribbed spheres, bokeh) once and store as reusable PNGs for Figma backgrounds. This is a one-time investment, not a per-graphic workflow.
- **Interactive iteration** — live browser preview, tweak code, refresh. Useful when learning/exploring 3D techniques.

| Scenario | Try first | Fall back to R3F if |
|---|---|---|
| One-off 3D hero element | **Image gen (Option E)** | Brand color must be pixel-exact, not "close enough" |
| Integration tile series (10+ tiles) | **Image gen + reference anchoring** | Need guaranteed pixel-identical lighting/materials across all tiles |
| Abstract 3D background | **Image gen (Option E)** | Need to render once and reuse as a library texture |
| 3D concept exploration | **Image gen (Option E)** | — (image gen is always faster for exploration) |
| Precise geometric branded shape | **R3F with CSG** | — (image gen can't carve exact shapes) |

Best for: 3D rendered objects with exact brand colors, parameterized batch rendering, and reusable 3D texture library assets. The agent writes the 3D scene as a React Three Fiber (R3F) TSX component — declarative scene graph with drei staging helpers, full control over every material, light, and camera property.

**Load:** `tools/r3f/README.md` for the rendering pipeline, scene template, and reference index to deeper files (materials, staging, advanced features).

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
4. **Subjective polish evaluation** — screenshot the graphic and evaluate these dimensions that automated checks cannot catch:
   - [ ] **Hierarchy:** Squint at the screenshot (or mentally blur it) — does the focal point still stand out? Is there a clear visual entry point?
   - [ ] **Whitespace:** Is spacing deliberate and balanced, or does it feel cramped or randomly distributed? Are micro-gaps (between elements) and macro-gaps (between sections) both intentional?
   - [ ] **Visual weight:** Are heavy elements (large, dark, saturated) balanced by lighter ones? Does the composition feel stable or lopsided?
   - [ ] **Typography:** Are headlines visually comfortable? Is all-caps text tracked out slightly? Does font pairing create contrast without conflict?
   - [ ] **Composition flow:** Does the eye move through the design in the intended order (headline → supporting visual → call-to-action)?

   These are evaluative — note issues and fix what you can. Not every graphic will be perfect on every dimension, but catching obvious imbalances before delivery is the goal.

For SVGs: validate the code is clean and renders correctly.

**Mark task "Graphics: Brand consistency check" as `completed`.**

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
- **Vague Quiver prompts**: "A nice icon" wastes credits and produces random output. Use the 5-component prompt structure: subject + style + color palette + composition + constraints.
- **Skipping Quiver output review**: Always read and verify the generated SVG before delivering — check hex values in the SVG source against the brand palette, not just visual impression
- **Generating too many Quiver variants**: Each variant costs 1 credit. Use `--n 2` or `--n 3` for exploration, not `--n 16`. For brand-consistent work, one well-prompted generation often suffices.
- **Using image gen for vector assets**: Image gen produces raster PNGs that pixelate when scaled. For icons, logos, or illustrations that need to work at multiple sizes, use Quiver (Option D) for SVG output.
- **Using image gen for text or layouts**: NEVER put text in generated images — Figma handles all text. Image gen produces visual elements only, which are composited in Figma.
- **Image gen without visual inspection**: Always Read the output PNG before delivering. The agent can see images — verify the result matches intent before showing the user.
- **Defaulting to one provider**: Use the provider routing table. GPT for transparency/editing, Gemini for 3D/glass quality, both in parallel for 50/50 scenarios. Don't always use GPT just because it's the existing default.
- **Image gen without reference images**: When generating brand-adjacent content (3D tiles, atmospheric backgrounds, illustrations), always check the design system for a relevant reference asset. A matching reference dramatically improves on-brand quality on both providers.
- **Reaching for R3F before trying image gen**: Image gen with a brand asset reference produces comparable 3D quality in seconds. Try Option E first; only fall back to R3F when exact color determinism or parameterized batch rendering is required.
- **Vague image gen prompts**: "A nice photo" produces generic stock imagery. Include subject, materials, lighting direction, camera perspective, hex colors, and negative constraints.
