Use when: Building specific visual elements — product mockups, code blocks, badges, metrics, logos, quotes, headers, buttons
Priority: P1
Impact: Inconsistent element styling, missed brand patterns, reinventing existing recipes

---

# Element Patterns

Reusable visual element recipes that apply across all output formats. Each recipe describes **design intent, proportions, and brand rules** — not tool-specific implementation code.

**Adapt proportions to your target format.** All pixel values below are calibrated at blog-cover scale (1280×720 working canvas, exported at 2x to 2560×1440). For fixed-dimension canvases (graphics, slides, video frames), apply these rules. For responsive web, use the spacing/typography tokens directly.

1. **Values define proportions, not absolutes.** A 64px heading at 1280×720 means "heading ≈ 9% of canvas height." Use that proportion on your canvas.
2. **Format file typography tiers take precedence** (when available). If the format file (e.g., `formats/social-og.md`) specifies heading = 84px, use 84px — even though recipes here say 64px.
3. **For elements not in the format file's tiers**, scale the recipe value by (your canvas height ÷ 720). Example: 20px description at 720px height → 18px at 630px height.

---

## Section header pattern

The most-used layout pattern. Every page section opens with this:

```
TAG (JetBrains Mono, 16px, uppercase, brand/primary)
  ↕ 20px gap (always)
HEADING (Neue Haas, 64px, weight 400)
  ↕ 20px gap (always)
DESCRIPTION (Noto Serif, 20px, weight 300, text/muted)
  ↕ 20px gap (always)
[BUTTON 1]  [BUTTON 2] (gap: 24px between buttons)
```

- **20px gap** between all children at blog-cover scale (1280×720) — scale proportionally on other canvases per rule 3 above
- Left-aligned heading max-width: 886px
- Center-aligned description max-width: 768px

---

## Button variants

| Variant | Background | Text | Radius | When to use |
|---|---|---|---|---|
| **primary** | `brand/primary` | White | pill | Main CTA — "GET A DEMO" |
| **primary-light** | `brand/crystal-blue` | `text/dark-blue` | pill | Secondary CTA on light bg |
| **secondary** | `surface/cream-alt` | `text/primary` + border | pill | Alternative action |
| **tertiary** | `surface/cream-alt` | `text/primary` + border | 10px | Compact alternative |
| **outline** | Transparent | `brand/primary` + border | default | Text-focused action |
| **minimal** | None | `text/primary` | none | Inline link-style |

All buttons use **JetBrains Mono, uppercase, weight 500**.

---

## Integration logo card pattern

When displaying integration/partner logos in a grid:
- Each logo in a rounded card with `radius/integration` (11px)
- Soft pastel background by category:
  - `card/warm-peach` — CMS/content platforms
  - `card/lavender` — support/helpdesk platforms
  - `card/soft-blue` — documentation platforms
  - `card/ice-blue` — knowledge base/data sources
- Logos rendered in dark monochrome (not grayscale filter)
- 4-column grid per row

---

## Trusted logos (social proof)

When displaying customer/partner logos in "Trusted by" sections (marquees, grids):
- Display at `opacity: 0.75` with full `grayscale(100%)` CSS filter
- Hover increases opacity to 0.9 and brightness but **keeps grayscale** — logos never appear in full color
- This keeps visual hierarchy focused on Inkeep's brand colors, preventing a rainbow of third-party brand colors from competing

**Distinct from integration logo cards** (above): integration cards show logos on pastel-colored card backgrounds in dark monochrome rendering. Trusted logos float freely with CSS grayscale filter and no card container.

---

## Common design patterns

### Feature card
- **Background:** Rotate through `card/warm-peach`, `card/warm-gray`, `card/light-blue`, `card/light-purple`
- **Radius:** `radius/lg-alt` (32px)
- **Shadow:** `shadow/subtle` at rest, `shadow/medium` on hover
- **Title:** Neue Haas, `font/size-card-title` (40px), weight 400
- **Body:** Noto Serif, `font/size-md` (16px), weight 300
- **Padding:** `spacing/lg` (24px)

### Testimonial section
- **Background:** Gradient from `gradient/purple-start` (#F3EDFE) to `card/ice-blue` (#DCF2FB) at 248deg
- **Quote:** Neue Haas, `font/size-quote` (32px), weight 400, tracking -0.36, leading 127%
- **Author:** JetBrains Mono, `font/size-md` (16px), weight 500, uppercase
- **Radius:** `radius/lg` (16px)

### Hero section
- **Background:** `bg/primary` (#FBF9F4)
- **H1:** Neue Haas, `font/size-hero` (80px), weight 400, tracking -0.64, leading 95%
- **Subtitle:** Noto Serif, `font/size-body` (20px), weight 300
- **Top padding:** `spacing/hero-top-desktop` (110px)
- **CTA button:** `brand/primary` fill, `radius/pill`, JetBrains Mono uppercase 16px

### Value card (dark background)
- **Background:** `surface/dark` (#231F20)
- **Shadow:** `shadow/value-card`
- **Number label:** JetBrains Mono, `brand/primary` color
- **Icon container:** `card/ice-blue` bg, `radius/xs-alt` (10px)
- **Title:** Neue Haas, white, weight 400
- **Body:** Noto Serif, white at 70% opacity, weight 300

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

---

## Code-as-visual

Syntax-highlighted code snippet used as a **design element**, not meant to be fully read. Signals "developer content" at card sizes.

**When to use:** Technical content, API announcements, SDK features, developer-focused posts.

**Design rules:**
- Show **3-8 lines** of the "money line" of the API — the most compelling snippet
- **Choosing the money line:**
  - Pick the line that shows the simplest path to value (SDK init, not complex config)
  - Prioritize what differentiates the product (agent orchestration, not generic CRUD)
  - Use realistic names and values that match the content's message
- **Code must be real** — use actual SDK/API calls from product docs. Developers spot fake code instantly. Never use `doSomething()`, placeholder function names, or fabricated API paths.
- **Truncation:** Use `// ...` for omitted sections. Never cut mid-statement. Always show complete logical blocks.
- **Syntax highlighting** — use brand-adapted palettes (dark preferred, light available):

  **Dark background** (`surface/dark` #231F20) — code pops, preferred for graphics:

  | Token | Color | Source |
  |---|---|---|
  | Default text | `#FAFAF7` | Near-white |
  | Keywords | `#3784FF` | brand/primary |
  | Strings | `#FFC883` | brand/golden-sun |
  | Functions/methods | `#69A3FF` | brand/sky-blue |
  | Comments | `#5F5C62` | text/muted |
  | Numbers/constants | `#E69F00` | Okabe-Ito orange |
  | Types/classes | `#E1DBFF` | brand/accent-cool |

  **Light background** (`bg/primary` #FBF9F4) — when dark doesn't fit the composition:

  | Token | Color | Source |
  |---|---|---|
  | Default text | `#231F20` | text/primary |
  | Keywords | `#3784FF` | brand/primary |
  | Strings | `#009E73` | Okabe-Ito green |
  | Functions/methods | `#29325C` | text/dark-blue |
  | Comments | `#5F5C62` | text/muted |
  | Numbers/constants | `#D55E00` | Okabe-Ito vermillion |

- Font: JetBrains Mono, weight 400
- Corner radius: `radius/lg` (16px)
- Place in the right portion of a split layout, or as a contained element

**Readable variant:** When code needs to be actually read (video walkthrough, slide tutorial), use the same font and syntax colors but increase to 8-20 lines and scale font size for the medium. Implementation details are medium-specific — see consumer skill references.

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

---

## Quote card

Speaker photo paired with attributed quote text. For testimonials, customer quotes, and thought leadership.

**Design rules:**
- **Quote text**: Neue Haas Display Pro, weight 400, tracking -0.36px, leading 127%
- **Attribution**: JetBrains Mono, weight 500, uppercase — "Name, Title, Company"
- **Attribution color**: `brand/primary` (#3784FF)
- **Speaker photo**: circular crop, sized proportionally to the quote text
- **Container**: gradient background `linear-gradient(248deg, #F3EDFE -17.65%, #DCF2FB 101.25%)` with very light border `border-[#FBF9F4]`

---

## Avatar patterns

**Bot/Agent avatar (Inkeep)** — recommended defaults, can deviate by context:
- Shape: Rounded square (squircle) with `radius/md` (8px). The squircle shape differentiates bot avatars from circular human photo avatars — this is an intentional industry convention (Slack uses squircle for Slackbot, circle for humans).
- Content: Inkeep icon mark (hexagon + blob) in brand colors on `bg/primary` (#FBF9F4) background.
- Sizing: Icon at 70% of container width. Container sizes: 52px for profile headers, 38px for message rows, 24px for compact/inline.
- Centering: Use the SVG visual centering pattern (see `tools/figma-console.md` → Pattern: SVG visual centering) — the Inkeep icon has asymmetric viewBox padding that makes mathematical centering incorrect.

**Person avatar** — prescriptive convention:
- **Always** generate avatars purpose-built for the avatar use case. Square composition where the face fills the frame naturally without cropping.
- **Never** crop a full portrait or body illustration into an avatar — this produces unnatural clipping (hair cut off, ears missing, too much torso) and took 4 iterations to get acceptable in testing.
- Shape: Rounded square (`radius/md`, 8px) for consistency with bot avatars, or circle for photo avatars.
- Generation: Use Quiver with a square-composition prompt specifying head-and-shoulders framing, or source from the Brand Assets library if available.
- Style details (face-based vs. icon-based, character design, color palette) are design judgment that varies by context.

## Product status icons

The product uses **Lucide** icons ([lucide.dev/icons](https://lucide.dev/icons/) — 1700+ searchable icons). These examples are **not exhaustive** — they're the most commonly needed icons for product mockups. Always verify against the actual product code (Step 1c discovery) for the current icon usage.

**Common status/state icons** (from agents-ui):

| State | Lucide Icon | Context |
|---|---|---|
| Approved / completed | `CheckCircle` | Tool approval done, task complete |
| Denied / error output | `XCircle` | Tool denied, execution error |
| Awaiting approval | `Clock` | Tool requires human-in-the-loop |
| Pending / streaming | `Circle` | Input streaming, waiting |
| Running / in-progress | `Loader2` (animated spin) | Tool executing, agent thinking |

**How to use a Lucide icon in a mockup:**
1. **Find the icon name** from the product code (Step 1c), or search [lucide.dev/icons](https://lucide.dev/icons/)
2. **Fetch the SVG** via Iconify (our `fetch-logo.ts` supports this) or directly: `https://unpkg.com/lucide-static/icons/{name}.svg`
3. **Import into Figma** via `figma.createNodeFromSvg(svgString)` — Lucide SVGs are clean and import reliably
4. **Style** according to context: product UI mockups use the product's semantic colors (`text-green-500` for success, `text-red-500` for error); marketing illustrations use brand colors

**Slack Block Kit button styles** (when mocking up Slack integrations):
- Approve: `primary` style = Slack blue background
- Deny: `danger` style = Slack red background
- These are Slack's conventions, not Inkeep's — use Slack's actual button colors when showing the agent in a Slack context.
