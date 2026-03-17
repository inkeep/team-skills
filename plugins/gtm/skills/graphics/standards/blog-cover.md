# Blog Cover / Thumbnail

Standard for blog post hero images and thumbnail graphics on the Inkeep marketing site.

## Dimensions

| Property | Value |
|---|---|
| **Working canvas** | 1280 x 720 px |
| **Export size** | 2560 x 1440 px (export at **2x scale**) |
| **Aspect ratio** | 16:9 |
| **File format** | PNG |
| **Min acceptable size** | 1600 x 900 px (exported) |

**Why 1x working canvas:** Design tokens (spacing, font sizes) are calibrated for 1x. Claude's vision processing downscales images >1568px, so working at 2560px produces screenshots the AI can't evaluate at full resolution. Figma vectors scale losslessly — export at 2x produces identical quality to working at 2x. All pixel values in this document are at **1280px working scale** unless noted otherwise.

The site renders blog thumbnails at multiple sizes depending on context:
- **Blog post card**: 16:9, responsive (25vw–100vw depending on breakpoint)
- **Featured post**: 2:1 crop (wider — design the center of the image to work at this ratio too)
- **Lead story card**: 960 x 540 px rendering (matches our working canvas closely)
- **Related posts grid**: 16:9, responsive

Design for 16:9 but keep the focal content centered so the 2:1 crop for featured posts doesn't lose important elements.

**OG/social sharing note:** The top-performing companies (Resend, Dub.co, Vercel) all use ~1.91:1 (the OG standard) instead of 16:9. Their thumbnails double as social sharing images without cropping. Our 16:9 thumbnails will be cropped to ~1.91:1 on LinkedIn/Twitter/Slack — avoid critical content in the top and bottom ~7% of the frame.

## Proportions & spacing (measured from exemplars)

These proportions are measured from the top 6 performing companies (Resend, Dub.co, Vercel, Linear, Decagon, Neon). They should be treated as targets, not hard rules.

### Frame margins

| Edge | Target % of dimension | Pixels at 1280×720 | Common mistake |
|---|---|---|---|
| **Left** | 4% | ~50 px | Too generous (>6%) creates floating-in-space look |
| **Top** | 8% | ~58 px | Too much top padding wastes prime visual real estate |
| **Right** | 0-2% (mockup can bleed) | 0-25 px | Containing the mockup — let it bleed past the edge |
| **Bottom** | 5% | ~36 px | Too much bottom padding; content should fill the frame |

**Content coverage target: 80-85% of canvas filled.** Measured across Resend, Dub.co, Decagon, Linear — all fill 75-90% of their canvas. If your thumbnail has large empty areas (especially bottom third), the content is too small or too centered.

**Decagon's product mockups extend from ~15% from top to ~5% from bottom** — nearly the full vertical extent of the frame. Their mockups occupy 60-70% of the canvas. This is the benchmark for product-forward thumbnails.

### Heading size

| Tier | Font size at 1280w | % of canvas height | Visual weight |
|---|---|---|---|
| **Tier 1** | 80-100 px | 11-14% | DOMINANT — the heading is the largest element by far |
| **Tier 2** | 60-80 px | 8-11% | Strong — clearly the primary element |
| **Tier 3** | 50-60 px | 7-8% | Clear — readable but not overwhelming |

**Measured from exemplars:** Resend's headings at 1920w are ~140-160px. At our 1280w working canvas, that's ~93-107px. The heading should be dramatically larger than everything else — at least 5x the badge text size.

### Split layout, visual sizing, and hierarchy

See `references/composition-patterns.md` for the full split layout proportions, edge bleed techniques, and visual hierarchy ratios.

**Blog-cover-specific calibration:**
- Text area: 30-40% of width (left), visual area: 55-65% (right)
- Visual element should occupy 40-60% of canvas area — Decagon's benchmark is 60-70%
- Let visual elements bleed past the right edge
- Heading should be 8-10x the badge's visual weight

## Template tiers

Choose the tier based on the post type. Each tier has different visual treatments and production effort levels.

### Tier 1: Hero Launch (major features, 3-4x/year)

For major product launches, rebrand announcements, or flagship features. Full custom design effort per thumbnail.

**Background:** `surface/dark` (#231F20) for maximum impact, OR `bg/primary` (#FBF9F4) for brand warmth. Dark is reserved for the biggest moments — it breaks pattern and demands attention. Add subtle texture (dot grid at 2-3% opacity, or light bloom from the visual element) to prevent flatness.

**Layout (split composition):**
- **Left 40-45%:** JetBrains Mono "NEW" badge (small, muted — see `references/artifact-recipes.md` § "JetBrains Mono badge system") → Neue Haas heading (80-100px, weight 95 Black or 75 Bold) → Noto Serif subtitle (16-20px, `text/muted` or `brand/golden-sun` on dark)
- **Right 55-60%:** Custom visual element that fills most of the right side — one of:
  - **Stylized product mockup** — agent conversation UI, dashboard panel, floating at angle with `shadow/brand` (blue-tinted glow) and `radius/lg-alt` (32px). Let it bleed past the right edge.
  - **Visual metaphor** — 3D rendered object or custom illustration representing the feature concept (inspired by Resend/Neon approach)
  - **Partner logo composition** — for major integration launches
- **Bottom-left:** Inkeep wordmark, subtle (brand/primary color, ~24-28px)

**Typography:** Neue Haas Display Pro at 80-100px (heading), Noto Serif at 16-20px (subtitle). JetBrains Mono uppercase for badge at 9-11px.

**Color restraint:** Maximum 3 colors in the surround (bg + heading text + one accent). Let the product mockup carry color complexity.

**When to embed metrics (Decagon technique):** If the feature has impressive stats, show them in the stylized product mockup — "40% ticket deflection", "2.3s avg response time". This makes the thumbnail double as social proof.

---

### Tier 2: Feature Post (regular capability posts, ~monthly)

For feature updates, capability explanations, how-to guides. Template-based, efficient to produce.

**Background:** `bg/primary` (#FBF9F4) with subtle dot grid or texture at 2-3% opacity to add depth. Use a card-color accent element (not a full background fill). Rotate through:
- `card/warm-peach` (#FFE8CF)
- `card/light-blue` (#DCE8FA)
- `card/light-purple` (#ECE7FB)
- `card/warm-gray` (#F0ECE3)

**Layout (split composition):**
- **Left 40-45%:** JetBrains Mono category badge → Neue Haas heading (60-80px) → Post title text for social sharing
- **Right 55-60%:** Choose based on content:
  - **Has compelling UI?** → Stylized product mockup, large, bleeding past right edge. Use `shadow/subtle`, `radius/lg-alt` (32px)
  - **No compelling UI?** → Abstract graphic with brand colors, or icon composition
  - **Has a key metric?** → Embed the stat in a styled card (Neue Haas number, JetBrains Mono label)
  - **Post IS the data?** → **Data-as-thumbnail** — use the chart/graph itself as the full thumbnail with minimal chrome. No title text needed — the data IS the visual. (Mintlify technique: their "ai-traffic" post uses a line chart showing "20.8M total viewership, 9.9M AI" as the entire thumbnail. Works when the data is dramatic enough to be self-explanatory.)

**Typography:** Neue Haas Display Pro at 60-80px (heading). JetBrains Mono uppercase for badge at 9-11px. Include post title in the image — most practical technique for social sharing (Clerk approach).

**Color restraint:** Maximum 3 colors in the surround. Product mockup can have its own color palette.

---

### Tier 3: Integration / Partner (Slack, Zendesk, etc.)

For integration announcements, partner features, ecosystem posts. Fastest to produce — nearly templatable.

**Background:** `bg/primary` (#FBF9F4) or `surface/dark` (#231F20) for major partners.

**Layout (centered or split):**
- JetBrains Mono "INTEGRATION" badge (see `references/artifact-recipes.md` § "JetBrains Mono badge system")
- Neue Haas heading (50-60px): "Inkeep + [Partner]" or feature title
- **Partner logo** (real logo from Brand Assets `third-party/` prefix, never approximated) + Inkeep logo, connected with "×" or "+" symbol
- Logos at equal visual weight, centered or right-aligned

**Typography:** Neue Haas Display Pro heading. JetBrains Mono badge. Partner name can use their brand font if recognizable.

---

## Visual asset type decision tree

For any blog post, decide which visual element to use:

| Content signal | Visual element | Example |
|---|---|---|
| Feature has a compelling UI | **Stylized product mockup** — float the UI, add brand shadow, round corners, brand background. Let it bleed past the right edge. | Agent conversation panel, visual builder canvas |
| Product UI IS the story (the interface speaks for itself) | **Product-as-marketing** — real product screenshot with minimal chrome. No headline overlay, no marketing copy. The product IS the message. Only works when the UI is genuinely well-designed. (Figma, Dub.co, Mercury, Notion technique — the top 5 in our research all do this.) Style it lightly (float, shadow) but let the product dominate 70%+ of the canvas. | Dashboard showing impressive data, agent conversation with approve/deny, visual builder with a completed workflow |
| Integration / partner announcement | **Logo composition** — partner logo + Inkeep logo with connector | Slack + Inkeep logos |
| Abstract concept / architecture | **Visual metaphor** — illustration or abstract graphic representing the concept | Network graph for multi-agent, lock icon for security |
| Key metric or stat | **Metric-embedded mockup** — stylized UI card with large stat number | "40% deflection" in a styled card |
| Technical / API / code content | **Code-as-visual** — syntax-highlighted code snippet as a supporting visual element in the right portion of a split layout. Build using the "Syntax-highlighted code block" pattern in `references/figma-console-tools.md` — uses `setRangeFills` for native editable Figma text with brand colors (brand/primary for keywords, golden-sun for strings). Show 3-8 lines of the "money line" of the API. The code signals "developer content" at card sizes — it's not meant to be fully read. (Clerk + Trigger.dev technique) | `new InkeepAgent({...})`, SDK initialization, MCP server config |
| Comparison / evaluation | **Split layout or data table** — comparison visual | Side-by-side feature comparison |
| No strong visual hook | **Typography-led** — bold title as primary element with minimal supporting graphic | Large Neue Haas heading on warm background |

**Never use:**
- Raw product screenshots (always stylize — float, angle, add shadow, round corners)
- Stock photography
- Generic abstract shapes that don't connect to the feature
- Flat backgrounds with no texture (add subtle dot grid or gradient at 2-3% opacity)

## Brand-specific techniques

### Badge, mockup, background, and composition treatment

**Load:** `references/artifact-recipes.md` for the full badge system (text options, sizing, styling), product mockup treatment (7-step recipe), code-as-visual, metric callout, and logo composition recipes.

**Load:** `references/composition-patterns.md` for background texture techniques (4 options), color restraint rules (max 3 colors in surround), Z-pattern layout, visual hierarchy ratios, and content coverage targets.

**Blog-cover-specific calibration:**
- Badge size: 9-11px at 1280w working canvas (scales to 18-22px at 2x export)
- Mockup should fill 50-60% of canvas — at least as large as Decagon's benchmarks (60-70% coverage)
- Background texture at 2-3% opacity — subtle enough to not compete with content at thumbnail sizes

### Warm vs dark background decision

| Use warm (`bg/primary` #FBF9F4) | Use dark (`surface/dark` #231F20) |
|---|---|
| Default for most posts | Major launches (3-4x/year max) |
| Brand-consistent, approachable | Maximum contrast and impact |
| Product mockups read well on warm | Typography-led designs shine on dark |
| Rotate card accent colors for variety | Use `brand/primary` and `brand/golden-sun` as accents |
| Most competitors use dark — warm stands out | Breaks pattern = attention signal |

## Composition guidelines

### Content positioning
- **Top-weight or tight center** — never leave the bottom third empty
- Content block should start within the top 10% and extend to the bottom 10%
- If using a split layout, both columns should be vertically centered relative to each other

### Thumbnail readability test (REQUIRED)
After final composition, export at thumbnail size and verify:
```javascript
const node = await figma.getNodeByIdAsync('FRAME_ID');
const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 300 } });
```
If the title is unreadable at 300px wide (exported), increase font size or simplify the composition. Headings below 70px at 1280w working canvas generally fail this test.

## Brand system consistency

See `references/composition-patterns.md` § "Brand system consistency" for the full lock/vary framework and restraint principle.

**Blog-cover-specific:** Lock background treatment, typeface, logo position, badge format, and corner radius across all thumbnails in a series. Vary color accent, visual content, and layout variant per post.

## What to avoid

- Raw product screenshots without styling (always float, angle, shadow, round)
- Stock photo aesthetic (generic office scenes, handshakes) — zero top companies use stock photos
- More than 2 lines of title text
- **Excessive padding** — content should fill 75-85% of the frame, not float in empty space
- **Flat backgrounds** — always add subtle texture (dot grid, gradient, light bloom, grain)
- **Too many colors** — limit surround to 3 colors; let the mockup carry color complexity
- **Badge competing with heading** — badge should be 1/8 the visual weight of the heading
- **Small, contained mockups** — product visuals should be large and may bleed edges
- Critical content in the bottom 20% (cropped by blog card UI)
- Using pure white (#FFFFFF) as background — always use `bg/primary` (#FBF9F4)
- Approximating logos with text (always use real logos from Brand Assets)

See also `references/composition-patterns.md` § "What feels dated" for temporal anti-patterns to avoid.

## Exemplar companies to reference

Ranked by overall visual quality from our 23-company brand dissection research (full dissections at `~/reports/visual-playbook/dissections/`):

| Rank | Company | Score | What to study | URL |
|---|---|---|---|---|
| 1 | **Stripe** | 5.0 | The benchmark. Gradient wave as signature element. Restraint as strategy. What you leave out matters more than what you include. | stripe.com/blog |
| 2 | **Figma** | 5.0 | Product-as-marketing. Real product screenshots ARE the graphics. No marketing copy on product images. | figma.com/blog |
| 3 | **Linear** | 4.6 | Extreme editorial restraint. Zero text on thumbnails. Abstract mood pieces. Dark canvas + grid texture. | linear.app/blog |
| 4 | **Resend** | 4.5 | Didone serif typography as brand signature. Monochrome dark. 3D atmospheric objects. | resend.com/changelog |
| 4 | **Notion** | 4.5 | Customer workspaces as marketing material. Social proof through product usage. | notion.so/blog |
| 6 | **PostHog** | 4.4 | Hedgehog mascot storytelling. Most distinctive brand personality. Pink palette. | posthog.com/blog |
| 7 | **Fly.io** | 4.3 | Magazine-quality editorial illustrations. Every post is unique custom art. | fly.io/blog |
| 8 | **Vercel** | 4.1 | Black + white + triangle. Maximum consistency. Typography-led on pure black. | vercel.com/blog |
| 9 | **Neon** | 4.1 | 3D visual metaphors per feature. Dot-pattern textures on dark canvas. | neon.com/blog |
| 10 | **Dub.co** | 3.7 | Floating product panels on light backgrounds. UI-as-marketing. Edge bleed. | dub.co/blog |
