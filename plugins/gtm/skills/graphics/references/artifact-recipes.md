Use when: Building any visual element that appears across multiple format types (blog covers, social posts, slides, etc.)
Priority: P1
Impact: Without these recipes, non-blog formats get one-liner guidance ("annotated mockup") instead of the full treatment — producing inconsistent, less polished graphics.

---

# Artifact Recipes

Reusable visual element recipes that apply across all output formats. Each recipe describes **design intent, proportions, and brand rules** — not Figma implementation code. For Figma code patterns, see `references/figma-console-tools.md`.

**Adapt proportions to your target format.** These recipes were refined at blog-cover scale (1280×720 working canvas, exported at 2x to 2560×1440) but the principles apply to any format. Scale element sizes and spacing proportionally to your canvas dimensions.

---

## Product mockup treatment

When showing product UI in any graphic:

1. **Float the panel** — slight rotation (2-5°) or perspective adds depth
2. **Make it large** — the mockup should fill 50-60% of the canvas, not sit as a small card in the corner
3. **Let it bleed** — extend past the right and/or bottom edge of the frame. This creates energy and implies "there's more to explore"
4. **Brand shadow** — use `shadow/brand` (blue-tinted glow: `5px 6px 18px rgba(157,194,255,0.20)`) for the Inkeep signature look
5. **Rounded corners** — `radius/lg-alt` (32px) matches the brand's soft, approachable aesthetic
6. **Simplify the UI** — show only the most compelling part (one conversation thread, one dashboard metric), not the full interface
7. **Overlapping panels** — for multi-feature posts, layer 2-3 panels at different depths (Dub.co technique)

**Never use raw product screenshots.** Always stylize — float, angle, add shadow, round corners.

---

## Product-as-marketing

Real product screenshot with minimal chrome — the product IS the message. No headline overlay, no marketing copy. The interface speaks for itself.

**When to use:** Only when the product UI is genuinely well-designed and the visual is self-explanatory. The top-performing brands (Figma, Dub.co, Mercury, Notion) all use this technique — letting the product dominate 70%+ of the canvas.

**Design rules:**
- Style lightly — float, brand shadow, rounded corners — but don't add marketing overlays
- Product should dominate **70%+ of the canvas**
- No headline text overlay on the product screenshot
- Minimal chrome: remove browser bars, notification badges, anything that clutters
- Works best for: dashboards showing impressive data, agent conversations with approve/deny flows, visual builders with completed workflows

**Key distinction from product mockup treatment:** Product mockup (above) stylizes UI as a *supporting element* alongside a headline. Product-as-marketing makes the UI *the entire message* — the product replaces the headline.

Technique inspired by Figma, Dub.co, Mercury, and Notion blog covers.

---

## Code-as-visual

Syntax-highlighted code snippet used as a **design element**, not meant to be fully read. Signals "developer content" at card sizes.

**When to use:** Technical content, API announcements, SDK features, developer-focused posts.

**Design rules:**
- Show **3-8 lines** of the "money line" of the API — the most compelling snippet (`new InkeepAgent({...})`, SDK initialization, MCP server config)
- Brand-colored syntax highlighting:
  - `brand/primary` (#3784FF) for keywords
  - `brand/golden-sun` (#FFC883) for strings
  - `text/primary` (#231F20) for identifiers
  - `text/muted` (#5F5C62) for comments
- Font: JetBrains Mono, weight 400
- Background: `surface/dark` (#231F20) or `bg/surface` (#F7F4ED) — dark backgrounds make code pop
- Corner radius: `radius/lg` (16px)
- Place in the right portion of a split layout, or as a contained element

**Figma implementation:** See Pattern: "Syntax-highlighted code block (setRangeFills)" in `references/figma-console-tools.md` — uses `setRangeFills` for native editable Figma text with per-character color.

Technique inspired by Clerk and Trigger.dev blog covers.

---

## JetBrains Mono badge system

Category badge for labeling graphics. Should be **small and muted** — a whisper, not a shout. It categorizes the content without competing with the heading.

**Badge text options:**

| Badge text | When to use |
|---|---|
| `NEW` | Major feature launch |
| `FEATURE` | Feature update or capability post |
| `GUIDE` | How-to, tutorial, best practices |
| `INTEGRATION` | Partner/integration announcement |
| `UPDATE` | Minor updates, changelog-style posts |

**Styling (restrained — learned from Resend):**
- JetBrains Mono, weight 500, uppercase
- **Size: 9-11px** at 1280w working canvas (18-22px at 2x export) — scale proportionally to your canvas. NOT 14-18px at 1280w — that competes with the heading
- On dark backgrounds: muted dark rounded rect (#333) with light text (#ccc), or `brand/primary` bg with white text at reduced opacity
- On light backgrounds: `brand/primary` (#3784FF) bg with white text, but keep the badge physically small
- Corner radius: `radius/pill` (9999px)
- Padding: 10px vertical, 20px horizontal
- **The badge should be ~1/8 the visual weight of the heading.** If it draws the eye before the heading, it's too prominent.

---

## Metric callout

Large statistic as the hero visual element. Doubles as social proof when the data is impressive.

**When to use:** Content with a key metric — "40% ticket deflection", "2.3s avg response time", "10x faster resolution."

**Design rules:**
- The number is the focal point — Neue Haas Display Pro, large (scale to ~60-80% of heading size)
- Label below the number: JetBrains Mono, uppercase, small
- Embed in a stylized card with `bg/surface` or card-color background
- Card styling: `radius/lg-alt` (32px), `shadow/subtle`
- Can be placed inside a product mockup (Decagon technique) or as a standalone element

Technique inspired by Decagon's blog covers.

---

## Logo composition

Partner or integration logo paired with the Inkeep logo. For announcements, partnerships, and ecosystem posts.

**Design rules:**
- **Partner logo**: always use the real logo from Brand Assets (`third-party/` prefix). Never approximate with text or shapes.
- **Inkeep logo**: use the icon or full wordmark from Brand Assets (`logo/` prefix)
- **Connector**: "×" or "+" symbol between logos, in `text/muted` or `brand/primary`
- **Equal visual weight**: both logos at similar size and prominence — neither should dominate
- **Layout**: centered for standalone compositions, right-aligned for split layouts
- Partner name can use their brand font if recognizable

**Logo sourcing:** See `references/svg-logo-sources.md` for the lookup sequence (Simple Icons → Iconify → Brandfetch).

---

## Quote card

Speaker photo paired with attributed quote text. For testimonials, customer quotes, and thought leadership.

**Design rules:**
- **Quote text**: Neue Haas Display Pro, weight 400, tracking -0.36px, leading 127%
- **Attribution**: JetBrains Mono, weight 500, uppercase — "Name, Title, Company"
- **Attribution color**: `brand/primary` (#3784FF)
- **Speaker photo**: circular crop, sized proportionally to the quote text
- **Container**: gradient background `linear-gradient(248deg, #F3EDFE -17.65%, #DCF2FB 101.25%)` with very light border `border-[#FBF9F4]`

For full token values, see the Testimonial Section recipe in `references/brand-tokens.md` § "Common Design Patterns."
