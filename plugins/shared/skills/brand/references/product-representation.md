Use when: Creating any graphic that represents the Inkeep product — blog covers, feature announcements, landing page heroes, social posts, docs illustrations. Especially when deciding HOW to show the product (screenshot vs mockup vs illustration vs abstraction).
Priority: P0
Impact: Wrong fidelity level for the context, marketing tokens used inside product mockups, product surfaces shown at inappropriate abstraction levels

---

# Product Representation

Strategic guidance for deciding **how** to represent the Inkeep product in visual assets. This file answers "what fidelity level should I use and why?" — the execution recipes (float, shadow, round corners, bleed) live in `element-patterns.md`.

**Core principle:** Marketing visuals must "correlate to in-product features — not fantastical, glossy and inaccurate representations" (Glenn Hitchcock, Vercel). Abstraction is valid. Fabrication is not.

**Loading guide:** This file provides the strategy (when + why). For execution, also load:
- Fidelity levels 1–3 (product UI visible) → **Load:** `tokens/product.md` file for product design tokens (use INSIDE the mockup), `tokens/marketing.md` file for marketing tokens (use for the SURROUND), and `references/element-patterns.md` file § Product mockup treatment for the styling recipe.
- Fidelity levels 4–5 (abstraction/illustration) → **Load:** `tokens/marketing.md` file for brand tokens and `content-types/illustration.md` file for the illustration system.
- Fidelity level 6 (pure brand) → **Load:** `tokens/marketing.md` file and `references/brand-guide.md` file only.

---

## The fidelity spectrum

Six levels, from most literal to most abstract. Each serves a different cognitive function.

| Level | Name | What the viewer gets | When to use at Inkeep |
|---|---|---|---|
| **1** | **Raw screenshot** | Proof — "this is real" | Documentation, help center, support articles |
| **2** | **Enhanced screenshot** | Directed attention — "look at this part" | Changelogs, feature announcements, release notes |
| **3** | **Stylized product mockup** | Comprehension — "this is how it works" | Blog heroes, landing page sections, case study covers. **Execute:** see `element-patterns.md § Product mockup treatment` |
| **4** | **Concise abstraction** | Mental model — "this is the concept" | Infrastructure features, A2A communication, API/SDK concepts, orchestration patterns |
| **5** | **Conceptual illustration** | Emotional connection — "this is how it feels" | Thought leadership, broad product positioning, brand campaigns. **Execute:** see `content-types/illustration.md` |
| **6** | **Pure brand abstraction** | Identity — "this is who we are" | Event materials, brand campaigns, atmospheric content |

**The spectrum is a palette, not a ladder.** The best companies deploy multiple levels in a single page — a Level 3 hero section with Level 5 spot illustrations and Level 2 changelog entries. Choose per-section, not per-page.

**Do not default to one level.** The most common failure is using Level 5 illustration for everything (because it's comfortable) when a Level 2–3 product screenshot would be more compelling.

---

## Decision framework

Apply these five filters in order. Each narrows the recommended fidelity range.

### Step 1: Communication goal

| Goal | Fidelity range | Why |
|---|---|---|
| Prove the product works | Level 1–3 | The viewer needs evidence. Abstractions do not prove. |
| Explain how it works | Level 2–4 | The viewer needs a mental model. Full screenshots overwhelm. |
| Convey what it feels like | Level 4–6 | The viewer needs emotional resonance. UI details distract. |
| Build brand recognition | Level 5–6 | The viewer needs identity cues. Product specifics are noise at this stage. |

### Step 2: Product surface

| Surface type | Lean toward | Rationale |
|---|---|---|
| Visible, UI-centric (agent builder canvas, chat widget, traces dashboard) | Level 1–4 | The UI is the value. Show it. |
| Infrastructure / invisible (API, A2A protocol, orchestration engine) | Level 4–6 | There is nothing to screenshot. Abstract the concept. |
| Broad-use with many personas | Level 4–5 | Showing one specific use case limits the viewer's imagination. |

### Step 3: Channel

| Channel | Max useful detail | Recommended level |
|---|---|---|
| Landing page hero (large canvas, 5–7s) | High | Level 3–4 |
| Blog hero / feature announcement | Medium | Level 2–4 |
| Social thumbnail (tiny, <2s attention) | Very low | Level 4–6 |
| Email header (images often disabled) | Minimal | Level 5–6 |
| Documentation illustration | Maximum | Level 1–2 |
| Changelog entry | Medium-high | Level 2–3 |

Channel determines the **ceiling** of useful detail. A raw screenshot at social thumbnail scale is noise. An abstract gradient as a docs illustration is useless.

### Step 4: Audience

| Audience | Preferred fidelity | Why |
|---|---|---|
| Developers | Higher abstraction OK (Level 3–6) | They already know what tools look like. Craft signals matter more. They read docs for detail. |
| Product managers / operators | Medium fidelity (Level 2–3) | Need to see workflows and outcomes. |
| Executives / buyers | Higher abstraction (Level 4–5) | Care about strategic fit, not interface details. |

### Step 5: Competitive context

| Context | Strategy |
|---|---|
| Commodity category | Higher abstraction for emotional differentiation |
| Craft-driven category | Product quality IS the marketing — show the product directly |
| New category (Inkeep's position) | More literal visuals needed — people must understand what the product IS before they respond emotionally |

**For Inkeep today:** The agent platform category is still being established. Default to Level 2–4 for product-specific content (show the real product to build category understanding) and Level 4–5 for positioning/thought leadership content.

---

## Product design system tokens (the key delta from marketing brand)

**The product UI uses different visual tokens than the marketing brand.** When showing product UI inside a marketing graphic, the content INSIDE the mockup must use product tokens. The surround and composition uses marketing brand tokens.

| Dimension | Marketing brand | Product UI (manage-ui) | Chat widget (agents-ui) |
|---|---|---|---|
| **Heading font** | Neue Haas Grotesk Display Pro (400) | Inter (600 / semibold) | Inter |
| **Body font** | Noto Serif (300) | Inter (400) | Inter |
| **Mono / label font** | JetBrains Mono (500, uppercase) | JetBrains Mono (uppercase) | System monospace |
| **Button style** | Pill radius (9999px) | `rounded-md` (8px), `font-mono uppercase` | `rounded-md`, `font-semibold` |
| **Page background** | Warm cream `#FBF9F4` | Pure white | White / `#191919` (dark) |
| **Card surface** | Cream `#F7F4ED` | White | White |
| **Card radius** | 32–60px | 10–14px (`rounded-lg` to `rounded-xl`) | 12px (`rounded-xl`) |
| **Primary accent** | Azure Blue `#3784FF` | Azure Blue `#3784FF` | Customer's brand color (default `#3784FF`) |
| **Dark mode background** | N/A (marketing is light-only) | `oklch(0.141 0.005 285.823)` — cool purple tint | `#191919` |
| **Shadows** | 9 levels including brand glow | `shadow-xs` to `shadow-sm` (minimal, flat) | `shadow-2xl` on chat bubble only |
| **Icons** | — | Lucide React, `size-4` | Lucide React |
| **Visual density** | Spacious (100px section gaps) | Dense, information-rich | Moderate |

### The two-layer rule

When composing a marketing graphic that includes product UI:

- **Inside the mockup** → product tokens (Inter, white backgrounds, 8–14px radii, minimal shadows, Lucide icons)
- **Outside the mockup** (headline, badge, background, surround) → marketing brand tokens (Neue Haas, cream, 32px+ radii, brand shadow, brand colors)

This mirrors Adobe's Spectrum/Consonant architecture: the product design system and marketing design system share atomic foundations (Azure Blue, JetBrains Mono) but diverge in composition, density, and atmosphere.

**"Movie UI" sizing rule:** Product tokens define the **visual style** (Inter font, white background, 8px radius, Lucide icons) — not the **sizes**. UI elements inside a marketing mockup should be **1.5-2x their actual product sizes** so they're comprehensible at graphic/thumbnail scale. A 36px product button becomes 54-72px. 14px product body text becomes 20-28px. The mockup should look like the product but at poster scale — recognizable in a social feed, not pixel-accurate at 1:1.

### What they share (creates subconscious continuity)

- Azure Blue `#3784FF` as primary accent
- JetBrains Mono uppercase for technical labels — the strongest brand continuity signal
- Lucide icon style
- Warm gray undertones in neutral palette

### What deliberately diverges (serves different functional needs)

- Typography (serif + display grotesque in marketing vs all-Inter in product)
- Background (warm cream in marketing vs pure white in product)
- Radii (large in marketing vs standard in product)
- Density (spacious in marketing vs dense in product)
- Shadows (dramatic in marketing vs minimal in product)

---

## Surface-specific fidelity guide

### Agent builder canvas

**Recommended fidelity:** Level 2–3 (enhanced screenshot to stylized mockup)

The most distinctive and visually compelling product surface. Equivalent to Linear's product screenshots — polished enough to show directly.

**Key visual elements to feature:**
- React Flow canvas with stone-400 dot grid (`#a8a29e`, 20px gap)
- Sub-Agent nodes: `rounded-lg`, `border`, `bg-card` — blue `ring-2 ring-primary` selection state
- MCP tool nodes: `rounded-4xl` (pill shape) — visually distinct from agent nodes
- Connecting edges with SVG arrow markers
- Floating toolbar with `backdrop-blur-3xl` (glass-morphism effect)
- Node Library drag palette (left side)
- "Default" tab: `font-mono text-xs uppercase` blue tab above default agent

**For animated formats:** Node pulse animation (scale 1→1.05 + Sky Blue `#69A3FF` glow shadow, 1.5s ease-in-out) is a strong visual element.

**Canvas + sidepane split** is the most common product view and the signature layout: canvas on left, resizable form editor on right.

### Chat widget

**Recommended fidelity:** Level 2–3

Already looks "designed" at rest — the widget is a strong marketing asset.

**Key visual elements:**
- Bubble container: 440px wide, `rounded-xl`, `shadow-2xl` on desktop
- Message bubbles with markdown rendering
- Tool call collapsibles (Hammer icon + state badge: `text-2xs uppercase font-mono`)
- Bouncing dot loading indicator (3 dots, 0.2s stagger)
- Citation pills: `rounded-full bg-gray-100 text-gray-700`

**Theming:** Can show with Inkeep branding (`#3784FF`) or customer branding to demonstrate white-label customization.

### Traces / analytics dashboard

**Recommended fidelity:** Level 3–4 (stylized mockup to concise abstraction)

Too dense to screenshot raw. Crop selectively.

**What to show:**
- Area charts with gradient fills (80%→10% opacity) — one chart is enough
- KPI stat cards: `text-3xl font-mono font-bold tabular-nums`
- Color-coded metric categories (blue = AI calls, green = success/output, purple = tokens, orange = agent, cyan = project)
- Mini success rate bars (24×6px, green/yellow/red thresholds)

**What to crop out:** Full navigation, sidebar, filter dropdowns, pagination — these add density without communicating value.

### Sidepane configuration forms

**Recommended fidelity:** Level 4–5 (concise abstraction or illustration)

Dense and utilitarian — not visually compelling in isolation.

**Better approaches:**
- Show the canvas WITH sidepane visible as context (the split-panel layout is recognizable)
- Abstract the configuration concept into an illustration (e.g., the three-tier illustration system from `content-types/illustration.md`)
- If you must show forms, crop to ONE section with ONE interesting field (model selector, tool toggle grid)

### Ship modal / deployment UI

**Recommended fidelity:** Level 2–3

The live widget preview (left form + right rendered widget) is a compelling split-screen composition.

**Key visual elements:**
- 5-tab interface (Chat UI, MCP, Vercel SDK, Node JS, REST API)
- Code snippets with syntax highlighting
- Live preview panel rendering the actual chat widget

Particularly effective for developer-audience graphics.

### Login / auth pages

**Recommended fidelity:** Level 2 (if showing at all)

Minimal centered card with Inkeep bicolor icon. Clean but not distinctive — feature only when the story is specifically about auth/onboarding.

---

## The cleaning-up process

Step-by-step for transforming real product state into a marketing-ready visual.

### 1. Crop ruthlessly

Show only the minimum UI needed to communicate the feature. One conversation thread, not the full page. One chart + 2 stat cards, not the entire dashboard. The sidebar + one panel, not all four panels open simultaneously.

### 2. Remove chrome

Strip browser bars, notification badges, scrollbar artifacts, debug indicators, dev tool overlays, and operating system chrome. These date the graphic and add visual noise.

### 3. Curate sample data

Replace real or test data with compelling, persona-specific demo data.

- **Agent names:** Descriptive — "Support Agent", "Billing Analyzer", "Onboarding Guide" (not "test-agent-1")
- **Metrics:** Impressive but believable — "78% deflection rate", "2.3s avg response", "1.2M conversations" (not round numbers like "100%")
- **Conversation content:** Realistic user questions and agent responses that demonstrate the value proposition
- **Narrative consistency:** If multiple graphics show the same product, use the same demo scenario across all of them

Never use "John Doe", "Acme Corp", "test@example.com", or obviously placeholder values.

### 4. Reduce density

If the UI is too busy, show a subset of elements. Progressive disclosure applies to marketing graphics too:
- Homepage hero → show one feature surface, simplified
- Product page → show 2–3 surface fragments composed together
- Feature deep-dive → show the specific UI with annotations

### 5. Apply product tokens faithfully

The content inside the mockup must look like the actual product:
- Inter font (not Neue Haas or Noto Serif)
- White backgrounds (not cream)
- 8–14px radii (not 32–60px)
- Minimal shadows (not brand glow)
- Lucide icons at `size-4`
- JetBrains Mono uppercase on buttons and labels

If the mockup uses cream backgrounds and Neue Haas headings inside the product frame, it does not look like the product. This breaks the correlation principle.

### 6. Apply marketing treatment (outside the mockup)

Now style the cleaned-up UI as a marketing asset — this layer uses marketing brand tokens:
- Float the panel with slight rotation (2–5°) or perspective
- Apply brand shadow (`shadow/brand`: blue-tinted glow)
- Round outer corners to `radius/lg-alt` (32px)
- Let it bleed past the right and/or bottom edge of the frame
- See `element-patterns.md § Product mockup treatment` for the full recipe

### 7. Compose with marketing elements

Add the marketing surround:
- Headline in Neue Haas Display Pro
- Badge in JetBrains Mono uppercase (see `element-patterns.md § Badge system`)
- Background in warm cream or dark with texture (see `composition-guide.md § Background treatment`)
- CTA if needed

---

## Anti-patterns

### The uncanny valley

Close-but-wrong mockups — slightly wrong fonts, off-brand colors, impossible layout states — are worse than clearly abstract graphics. The viewer senses something is wrong without knowing what. **Be either pixel-accurate or clearly stylized.** The middle ground is the danger zone.

### Over-idealization

Marketing that looks nothing like the real product erodes trust at onboarding. Academic research (Expectation Disconfirmation Theory) shows the trust damage is non-linear — a small gap is forgiven, but past a threshold the damage is disproportionate and extends beyond the product to the entire brand.

### Over-simplification

Intercom documented that "reducing product visuals to focus on one feature at a time resulted in a lack of comprehension and confusion about what the product did." There is a minimum viable fidelity below which graphics cause confusion rather than clarity. Show enough context for the viewer to understand what they're looking at.

### Fake data

"John Doe" and "Acme Corp" break immersion instantly. Developers in particular spot lazy placeholder data. Industry-specific data matters too — a prospect evaluating Inkeep for customer support doesn't care about e-commerce transaction data in the mockup.

### Marketing tokens inside product mockups

If the mockup shows cream backgrounds, Neue Haas headings, and pill-radius buttons inside the product frame, it does not look like the real product. This violates the two-layer rule. Product mockups must use product tokens (Inter, white, 8–14px radii) with marketing treatment applied only to the outer frame and surround.

### Hiding the product

29.8% of SaaS companies don't show their product at all on their landing page, while 88% of buyers say they wouldn't book a demo without seeing the product. For Inkeep's visual surfaces (agent builder canvas, chat widget), showing the actual product is stronger than abstracting it away. Abstraction should be a deliberate choice for invisible features (API, orchestration), not a crutch for avoiding screenshots.

### Template fatigue

Web design homogenization increased 30–44% between 2008–2019 (CHI 2021, Goree et al.). The "Linear Look" (dark gradients, glassmorphism, blur) went from signaling "thoughtful craft" to "generic SaaS" within two years. AI-generated designs accelerate homogenization further. Default aesthetics now signal "undifferentiated" rather than "professional." Invest in what only Inkeep has — the agent builder canvas, the multi-agent graph visualization, the node pulse animation — not what every SaaS company has.
