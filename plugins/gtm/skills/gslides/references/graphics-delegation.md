# Graphics Skill Delegation

Use when: Step 5 (Create visual assets) — spawning subagents to create graphics for slides
Priority: P0
Impact: Missing or off-brand visuals; slides without graphics where they would communicate better

---

## Series brief (deck-wide visual consistency)

When creating multiple graphics for a single deck, all subagents must share the same visual decisions. Before spawning any subagents, create a **series brief** that locks the visual constants:

| Decision | Options | How to choose |
|---|---|---|
| **Background treatment** | Warm cream (`#FBF9F4`) / dark / white | Match the deck's slide backgrounds — warm cream is the brand default |
| **Illustration style** | Dual-stroke (brand default) / abstract geometric / none | Use dual-stroke when any slide needs a conceptual illustration; "none" if all graphics are diagrams or mockups |
| **Accent color** | Pick one from the brand card background palette | Use the same accent across all graphics in the deck — don't rotate per-graphic |
| **Visual density** | Sparse / moderate / dense | Match the deck's overall tone — sales decks are typically sparse to moderate |
| **Logo variant** | Primary / icon-only / none | Match what the slide master uses — don't mix variants across graphics |

Pass this series brief to **every** subagent in the deck. This is how parallel subagents produce coherent output without seeing each other's work.

## Prospect/customer context (sales decks)

When creating a sales deck personalized for a specific prospect or customer, include their company details so the graphics skill can fetch their real brand data:

- **Company name**: the prospect's company name
- **Domain**: their website domain (e.g., `stripe.com`)
- **Where their brand appears**: which graphics should feature their brand (e.g., "comparison slide uses their logo and colors", "feature mockup shows their company name in the UI")

This is optional — omit for internal decks, general-purpose presentations, or decks not targeting a specific company.

---

## Delegation contract

Each graphic is created by a subagent that loads the `graphics` skill. The subagent handles the full graphics workflow autonomously: creative brief, asset collection, composition, generation, and export.

### What you pass to the subagent

Spawn using the **Agent tool** with `subagent_type: "general-purpose"`. The prompt must include:

1. **Instruction to load the skill**: "Load the `graphics` skill and follow its full workflow."
2. **Graphic type**: what kind of visual (diagram, illustration, product mockup, data visualization, metric callout, etc.)
3. **Target format**: "slide deck graphic" — this tells the graphics skill to use its `standards/slide-graphic.md` standard (960x540 working canvas, 16:9, projection-optimized text sizing)
4. **What the graphic should communicate**: the key message, purpose, and audience for this specific slide
5. **Slide master context** (if applicable): what elements the slide layout already provides (headers, footers, logos, page numbers) — so the graphic doesn't duplicate them
6. **Content specifics**: any concrete content the graphic must include (product name, feature details, data points, company names, metrics). Distinguish what the user provided directly vs. what you inferred from source material — prefix with "User-provided:" or "Inferred from [source]:" so the graphics skill can calibrate how literally to interpret each item.
7. **Content sources** (if available): paths to reports, documents, or URLs that inform this graphic. Pass original source material so the graphics subagent can do its own research rather than working solely from your summary — this reduces information fidelity loss at the agent boundary. For feature deep-dives, include paths to product screenshots or URLs if available.
8. **Series brief**: the locked visual decisions for this deck (background treatment, illustration style, accent color, visual density, logo variant). Same for every subagent in the deck — see "Series brief" section above.
9. **Prospect context** (sales decks only): company name, domain, and where their brand should appear. Omit for non-sales or non-personalized decks.
10. **Export and return instruction**: "Export the final graphic as PNG at 4x scale from Figma. Return the result in the structured format below."

### Prompt template

```
Load the `graphics` skill and follow its full workflow.

Create a slide deck graphic:
- **Type**: [diagram / illustration / icon set / product mockup / data visualization / metric callout / quote card / logo wall / code block / 3D render / photorealistic image]
- **Message**: [what this graphic should communicate to the audience]
- **Audience**: [who will see this slide — prospects, technical team, executives, etc.]
- **Content**: [specific elements — prefix each with "User-provided:" or "Inferred from [source]:"]
- **Sources**: [paths to reports, docs, or URLs that inform this graphic — or "none"]
- **Slide context**: [what the slide master already provides — or "new deck, no master elements"]
- **Format**: Slide deck graphic (960x540 working canvas, 16:9). Follow `standards/slide-graphic.md`.

Series brief (apply to ALL graphics in this deck):
- **Background**: [warm cream #FBF9F4 / dark / white]
- **Illustration style**: [dual-stroke / abstract geometric / none]
- **Accent color**: [hex code from brand palette]
- **Visual density**: [sparse / moderate / dense]
- **Logo variant**: [primary / icon-only / none]

[If sales deck for a specific prospect:]
Prospect: [company name] ([domain]). Their brand appears in: [which graphics and how].
Pull their real brand colors and logo — do not guess.

Export as PNG at 4x scale from Figma. Return using this format:

## Return
- **Figma URL**: [link to the Figma frame]
- **Image URL/path**: [publicly accessible URL or local file path of exported PNG]
- **Dimensions**: [width x height in Figma px, e.g., 960x540]
- **Placement**: [full-slide | inset — if inset, specify suggested position and size in Figma px]
- **Notes**: [anything gslides needs to know — e.g., "contains text that overlaps with slide header area", "designed for dark background"]
```

### What the subagent returns (return packet)

The subagent must return a structured response with these fields:

| Field | Required | Purpose |
|---|---|---|
| **Figma URL** | Yes | Link to the editable Figma frame (for designer post-editing) |
| **Image URL/path** | Yes | Publicly accessible URL or local file path of exported PNG |
| **Dimensions** | Yes | Width x height in Figma px (e.g., 960x540 for full-slide) |
| **Placement** | Yes | `full-slide` or `inset` — if inset, includes suggested position and size in Figma px |
| **Notes** | No | Anything that affects placement — text overlap zones, background assumptions, transparency |

If the subagent cannot produce the graphic, it must return a clear failure message explaining why (missing assets, unclear content, tool unavailability) so gslides can inform the user.

## Image placement in Google Slides

Google Slides `add_image` requires a **publicly accessible URL**. If the graphics subagent returns a local file path instead of a public URL:
1. Upload the PNG to Google Drive or a temporary public host
2. Use the public URL with `mcp__google-slides__add_image`

### Coordinate mapping

Figma canvas coordinates map to Google Slides points:
- **Formula**: `gslides_pt = figma_px × 0.75`
- **Full-slide placement** (960x540 Figma canvas): `x=0, y=0, width=720, height=405` (points)
- **Inset graphics**: calculate position and size using the same formula based on where the graphic should appear on the slide

## What `/graphics` can generate for your slides

Describe what you need — `/graphics` handles tool selection internally.

| What you need | Output | Slide example |
|---|---|---|
| Conceptual illustration | On-brand hand-drawn style SVG | Solution overview — "How Inkeep connects to your stack" |
| Matching icon set | Consistent SVG icons | Feature comparison — each capability gets its own icon |
| Decorative background | SVG pattern | Title slide — organic pattern instead of flat color |
| Chart (bar, donut, sparkline) | Brand-styled PNG | Metrics — "50% reduction in tickets" with donut chart |
| Metric callout (big number) | Styled number card | Social proof — "99.9% uptime" hero visual |
| Data comparison table | Styled grid | Competitive comparison — feature matrix |
| Third-party logo | Real SVG logo | Integration slide showing partner ecosystem |
| Logo wall | Grid of logos | Social proof — "Trusted by" logo wall |
| Prospect's brand (sales decks) | Logo + brand colors | Personalized title slide with prospect's identity |
| Polished product mockup | Styled screenshot PNG | Feature deep-dive — product UI as hero visual |
| Tutorial spotlight | Overlay + highlight PNG | Demo walkthrough — highlight a specific panel |
| Syntax-highlighted code | Styled code block PNG | Developer slide showing integration code |
| Photorealistic image | Raster PNG | Title slide hero — abstract AI-themed backdrop |
| Image editing (cleanup, bg swap) | Modified PNG | Clean up a product screenshot for a slide |
| 3D rendered accent | PNG with transparency | Title slide — premium 3D logo tile |
| Architecture diagram | Auto-laid-out SVG | System overview for technical audience |
| Flowchart | Structured SVG | Process — "How a support query flows" |

## Decision table: delegate vs. skip

| Situation | Action |
|---|---|
| Slide needs an illustration, diagram, chart, or custom visual | **Delegate** — spawn a graphics subagent |
| Slide needs a polished product mockup | **Delegate** |
| Slide needs third-party logos not in the asset library | **Delegate** |
| Slide needs a photorealistic image or 3D accent | **Delegate** |
| User provided an image URL | **Skip** — use the URL directly |
| Cloned deck already has adequate visual | **Skip** — keep existing, update only if outdated |
| Slide only needs text, bullets, solid color backgrounds | **Skip** — no graphic needed |
| Visual is just a customer logo extractable from Figma | **Skip** — pull directly, no subagent needed |
| Graphics skill is unavailable | **Skip** — proceed text-only, note the gap |

## Parallel execution

Spawn all graphics subagents simultaneously — use multiple Agent tool calls in a single message. Each subagent operates independently in its own context. Do not wait for one to finish before spawning the next.

If a subagent fails or times out, proceed with text-only content for that slide and inform the user.
