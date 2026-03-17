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
| Inkeep Agent Graphics Workspace | https://www.figma.com/design/S5kGTPZ0kSjmSxusJ56QJH/Inkeep-Agent-Graphics-Workspace | Shared workspace for AI-generated graphics — one page per project, organized by date and medium | Default target for all new graphics creation (unless user specifies a different file) |

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
| Icon Set section | `5006:187898` | Inkeep Design Assets |
| Illustrations section | `5003:66` | Inkeep Design Assets |
| Customers section | `5045:158` | Inkeep Design Assets |
| Third-Party Logos section | `5003:70` | Inkeep Design Assets |
| Decorative & Backgrounds section | `5003:69` | Inkeep Design Assets |
| UI Elements section | `5003:68` | Inkeep Design Assets |
| Brand Mascot section | `5003:65` | Inkeep Design Assets |

> For other pages, use the Figma MCP to get their node IDs dynamically. Node IDs may change if pages are restructured.

### Navigation strategy by task

| What you need | Where to look first | Fallback |
|---|---|---|
| Logo (any format) | Brand Assets → Logos (`logo/`) | — |
| Any icon | Brand Assets → Icon Set (`iconset/`) | — |
| Illustrations | Brand Assets → Illustrations (`illustration/`) | — |
| Customer assets (logo + case study hero) | Brand Assets → Customers (`customer/`) | — |
| Integration partner logo | Brand Assets → Third-Party Logos (`third-party/`) | `scripts/fetch-logo.ts` for logos not in the library |
| Background, gradient, texture | Brand Assets → Decorative & Backgrounds (`background/`) | — |
| Product UI mockup | Brand Assets → UI Elements (`ui/`) | — |
| Mascot/Keepie | Brand Assets → Brand Mascot (`mascot/`) | — |
| Brand colors, typography, spacing | Design tokens in the Graphics Workspace file | Fallback hex values in `references/brand-tokens.md` |
| Social media graphic reference | Social Assets or Social Banners page (BABCO file) | — |
| Presentation visual patterns | Presentation Template page (BABCO file) | — |

## Brand Assets Page

The Brand Assets page in the Inkeep Design Assets file is a curated collection of all unique atomic graphical elements, organized for AI consumption.

- **File key**: `D7NDSM2peo1iLhkjLxmGP5`
- **Page node ID**: `5003:63`
- **URL**: https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Design-Assetts?node-id=5003:63

### Asset catalog

All assets use **slash-separated hierarchical names**: `{section}/{subcategory}/{variant}`. Search by path prefix to find what you need.

| Section | Path prefix | What's here | How to search |
|---|---|---|---|
| **Logos** | `logo/` | Brand marks in all variants — full logo, icon-only, wordmark, dual-mark, .com, favicons. Each in color/black/white. | `logo/full-color`, `logo/icon/black`, `logo/favicon/` |
| **Icon Set** | `iconset/` | All atomic icons normalized to ~40px. **Search here first for any icon.** Covers use cases, products, platform, utility, navigation, status, brand marks, favicons. | `iconset/search`, `iconset/ai-chat-sparkle`, `iconset/status/` |
| **Illustrations** | `illustration/` | Product illustrations, use-case illustrations, developer page, homepage, security. Descriptively named by subject. | `illustration/use-case/`, `illustration/product/`, `illustration/security/` |
| **Customers** | `customer/` | Per-customer assets — brand mark logo + case study hero illustration, grouped by company. | `customer/posthog/`, `customer/payabli/` |
| **Third-Party Logos** | `third-party/` | Integration partner wordmarks (Slack, GitHub, etc.). For customer logos, check the Customers section instead. | `third-party/slack`, `third-party/github` |
| **Decorative & Backgrounds** | `background/` | Footer gradients, grid patterns, dots, polygons, gradient backgrounds (by size and color), textures. | `background/gradient/wide/`, `background/texture/` |
| **UI Elements** | `ui/` | Product UI mockups — search bar, data visualizations, chat widget. | `ui/data-viz/`, `ui/chat-widget` |
| **Brand Mascot** | `mascot/` | Keepie character. | `mascot/keepie/` |

> **Do not hardcode asset counts or specific names** — the library evolves. Always search dynamically using the path prefixes above.

### How to find an asset

Use `figma_execute` to search by name or prefix. Always scope searches to the Brand Assets page (`5003:63`) — never search the entire file.

```javascript
// Find a specific asset by exact name
const page = await figma.getNodeByIdAsync('5003:63');
const logo = page.findOne(n => n.name === 'logo/full-color');

// Find all assets matching a prefix
const icons = page.findAll(n => n.name.startsWith('iconset/'));

// Find within a specific section
const iconSet = await figma.getNodeByIdAsync('5006:187898');
const searchIcon = iconSet.findOne(n => n.name === 'iconset/search');
```

### How to use an asset

1. Navigate to the Brand Assets file (`figma_navigate`)
2. Search the Brand Assets page (node `5003:63`) by name or prefix
3. Clone it: `asset.clone()`
4. Move the clone into your working file and composition

## Adding a new master design

To add a Figma file, edit this file and add a row to the Design Files table. Include:
- **File**: descriptive name
- **URL**: Figma file URL
- **Contains**: what asset types or components live there
- **Use for**: when to reference this file
