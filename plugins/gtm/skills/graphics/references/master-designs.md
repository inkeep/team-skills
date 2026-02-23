# Master Design Files

Use when: Starting a new graphic — check here first for existing Figma assets to reference or adapt
Priority: P0
Impact: Redundant work; inconsistent visuals; missing established design patterns

---

## How master designs work

Master design files are team-maintained Figma files containing canonical components, patterns, and visual assets. They establish the authoritative brand look for each asset type.

**Rules:**
- **Reference, don't modify.** Use master files as visual references when generating code-based graphics. Extract structure, colors, and patterns — don't edit the Figma file.
- **Match the style.** Generated graphics should be visually consistent with the master designs, even though they're produced via code.
- **Pull tokens dynamically.** Use the Figma MCP to read current values rather than hardcoding from memory.

## Design Files

| File | URL | Contains | Use for |
|---|---|---|---|
| BABCO Design Assets | https://www.figma.com/design/by048nPGeK3c6FKMvlmPCz/BABCO-Design-Assetts | Brand guide, color system, typography, logos, social assets, presentation templates, marketing graphics | All graphics — primary brand token and asset source |
| Inkeep Design Assets | https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Design-Assetts | Brand Assets master page — all atomic graphical elements (logos, icons, illustrations, backgrounds, third-party logos) | Primary source for logos, icons, illustrations, backgrounds |

## Navigating Figma files via MCP

The BABCO Design Assets file has many pages organized by section. **Always use the Figma MCP to navigate** — never the browser.

### How to discover pages and assets

1. **List all pages in the file** — call the Figma MCP to get the file's page tree. This returns all page names and their node IDs.
2. **Scan page names** for relevance to your task (logos, social, banners, presentations, etc.)
3. **Read a specific page** by its node ID to see what components and frames it contains.
4. **Drill into nodes** to extract specific assets, styles, colors, and typography.

### Page map (observed structure)

This map is a snapshot to help you start in the right place. Always verify with the Figma MCP — pages may have been added or reorganized.

| Section | Page | What's there | Good for |
|---|---|---|---|
| **COVER** | Full Brand Guide | Complete brand guide — colors, typography, logo usage, gradients | Brand tokens, color palette, typography rules |
| **BRAND** | Final Logos | Official logo assets in various formats | Logo exports, logo usage reference |
| | Inkeep Asks September 19-30 | Campaign-specific assets | Campaign reference |
| | Use cases (x5) [on Vercel] | Use case page designs | Use case visual patterns |
| **COMPLETE** | Tablecloth | Event tablecloth design | Event/trade show graphics |
| | Sept 8 - Pre-built Agents | Agent-related marketing assets | Product marketing visuals |
| | YouTube Banner | YouTube channel banner | Video/social banner dimensions |
| | Presentation Template | Slide deck template designs | Presentation visual patterns |
| | Integrations Page [on Vercel] | Integrations page design | Integration graphics |
| | Sept 8 - OSS vs Enterprise | Comparison/positioning assets | Competitive graphics |
| | Logos + Brand Lite | Logo variants and light brand kit | Quick logo access |
| | Social Assets | Social media graphics | Social posts, cards |
| | Social Banners | Social media banners | Banner dimensions, layouts |
| | Get Demo [on Vercel] | Demo page design | CTA/demo graphics |
| **POST LAUNCH** | *(various)* | Post-launch marketing assets | Campaign materials |
| **ARCHIVE** | Logos + Brand Lite - Needs update | Outdated logo versions | Historical reference only |
| | All Logo Amends | Logo revision history | Historical reference only |
| | Internal QA - Aug 22 | QA screenshots | Not for production use |
| **Graphics** | *(section)* | General graphics assets | Miscellaneous visuals |

### Key node IDs (known)

| Page | Node ID | File |
|---|---|---|
| Full Brand Guide (Brand Guide frame) | `2454-979` | BABCO |
| Brand Assets (master asset page) | `5003:63` | Inkeep Design Assets |
| Logos section | `5003:64` | Inkeep Design Assets |
| Brand Mascot section | `5003:65` | Inkeep Design Assets |
| Illustrations section | `5003:66` | Inkeep Design Assets |
| Icons section | `5003:67` | Inkeep Design Assets |
| UI Elements section | `5003:68` | Inkeep Design Assets |
| Decorative & Backgrounds section | `5003:69` | Inkeep Design Assets |
| Third-Party Logos section | `5003:70` | Inkeep Design Assets |
| Icon Set section | `5006:187898` | Inkeep Design Assets |

> For other pages, use the Figma MCP to get their node IDs dynamically. Node IDs may change if pages are restructured.

### Navigation strategy by task

| What you need | Where to look first | Then |
|---|---|---|
| Logo (any format) | Brand Assets → Logos section (`5003:64`) | Final Logos page |
| Icons (atomic, any type) | Brand Assets → Icon Set (`5006:187898`) — 52 normalized icons | Icons section (`5003:67`) |
| Icons (nav, homepage, product) | Brand Assets → Icons section (`5003:67`) | Graphics page |
| Illustrations (use case, hero, dev) | Brand Assets → Illustrations section (`5003:66`) | Graphics page |
| Background/gradient/texture | Brand Assets → Decorative & Backgrounds (`5003:69`) | Gradient backgrounds page |
| Third-party logos | Brand Assets → Third-Party Logos (`5003:70`) | Integrations page |
| UI mockups (chat, data viz) | Brand Assets → UI Elements (`5003:68`) | — |
| Mascot/Keepie | Brand Assets → Brand Mascot (`5003:65`) | — |
| Brand colors, typography, gradients | Full Brand Guide page (BABCO) | — |
| Social media graphic reference | Social Assets or Social Banners page | — |
| Presentation visual patterns | Presentation Template page | — |
| Product marketing assets | Sept 8 - Pre-built Agents, Use cases pages | — |
| Banner dimensions/layouts | YouTube Banner or Social Banners page | — |
| Event/tradeshow materials | Tablecloth page | — |

## Brand Assets Page

The Brand Assets page in the Inkeep Design Assets file is a curated collection of all unique atomic graphical elements, organized for AI consumption.

- **File key**: `D7NDSM2peo1iLhkjLxmGP5`
- **Page node ID**: `5003:63`
- **URL**: https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Design-Assetts?node-id=5003:63

### Asset catalog

| Category | Path prefix | Count | Description |
|---|---|---|---|
| Logos | `logo/` | 18 | Full-color, black, white, icon-only, wordmarks, .com variants, favicons |
| Brand Mascot | `mascot/` | 1 | Keepie character variants |
| Illustrations | `illustration/` | 24 | Use case, abstract, detailed, dev page, homepage, customer story |
| Icons | `icon/` | 20 | Navigation icons (04-17), homepage product icons, customer icons |
| UI Elements | `ui/` | 4 | Data viz (analytics, topics), chat widget, search bar |
| Decorative & Backgrounds | `background/` | 16 | Footer gradients, grid, dots, polygons, gradient backgrounds, textures |
| Third-Party Logos | `third-party/` | 13 | Slack, Discord, GitHub, Notion, Jira, Linear, PostHog, etc. |
| Icon Set | `iconset/` | 52 | Consolidated atomic icons extracted from across all pages — use case, product, platform, utility, status, brand mark, and favicon variants |
| **Total** | | **148** | |

### Icon Set

The Icon Set section (`5006:187898`) is a consolidated collection of all atomic icons found across the Figma file, normalized to ~40px and organized by row:

| Row | Path prefix | Count | Description |
|---|---|---|---|
| Use Case Icons | `iconset/b2b-customer-support`, etc. | 6 | B2B/B2C support, documentation, sales, marketing, product |
| Product Icons | `iconset/ask-ai-assistant`, etc. | 6 | AI assistant, search, copilot, docs writer, content marketer, visual builder |
| Resources Icons | `iconset/blog`, `iconset/docs`, `iconset/case-studies` | 3 | Blog, docs, case studies (24px originals) |
| Platform Icons | `iconset/no-code-agent-studio`, etc. | 4 | Agent studio, dev framework, agent workforce, enterprise |
| Brand Marks | `iconset/inkeep-mark/color`, `/black`, `/white` | 3 | Inkeep brand mark in 3 color variants |
| Utility | `iconset/chevron-down`, `iconset/arrow-circle-*`, `iconset/password-lock` | 4 | Navigation and UI utility icons |
| Blue Circles | `iconset/circle-minus`, `iconset/circle-hamburger`, `iconset/brand-mark-outline` | 3 | Blue circle icons and brand mark outline |
| Nav 7 Icons | `iconset/chat-bubbles`, `iconset/shopping-star`, etc. | 5 | Chat, shopping, documents, voice, webpage |
| Nav 8 Icons | `iconset/ai-chat-sparkle`, `iconset/search`, etc. | 6 | AI chat, search, cursor, edit, CMS, flowchart |
| Favicons | `iconset/favicon/filled-light`, `/filled-blue`, `/outline-interlocking` | 3 | Brand mark favicon variants |
| Status Icons | `iconset/status/not-started`, `/in-progress`, `/review`, `/deploy` | 4 | Workflow status icons |
| Compound Icons | `iconset/hex-puzzle`, `iconset/hex-person`, `iconset/circle-person`, `iconset/send-circle`, `iconset/brand-mark-stroke` | 5 | Hexagon-wrapped and circle-wrapped brand icons |

Search for icons by prefix:
```javascript
const page = figma.root.findOne(n => n.id === '5003:63');
const iconSet = page.findOne(n => n.id === '5006:187898');
const icon = iconSet.findOne(n => n.name === 'iconset/search');
```

### How to find an asset

All assets use slash-separated hierarchical names: `{category}/{subcategory}/{variant}`.

Search by path prefix:
- `logo/icon/` → icon-only logo marks
- `illustration/use-case/` → use case page illustrations
- `background/gradient/1920/` → 1920x1080 gradient backgrounds
- `third-party/slack` → Slack logo

Use `figma_execute` to search by name:
```javascript
const page = figma.root.findOne(n => n.id === '5003:63');
const asset = page.findOne(n => n.name === 'logo/full-color');
```

### How to use an asset

1. Navigate to the Brand Assets page (node `5003:63`)
2. Find the asset by its hierarchical name
3. Clone it to your working page: `asset.clone()`
4. Move the clone into your composition and modify as needed

## Adding a new master design

To add a Figma file, edit this file and add a row to the Design Files table. Include:
- **File**: descriptive name
- **URL**: Figma file URL
- **Contains**: what asset types or components live there
- **Use for**: when to reference this file
