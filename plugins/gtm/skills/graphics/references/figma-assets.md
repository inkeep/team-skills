Use when: Navigating the Figma Inkeep Brand Assets file to find logos, icons, illustrations, backgrounds, and other brand assets
Priority: P0
Impact: Wrong assets, missed existing components, unnecessary recreation of assets that already exist

---

# Asset Library

## How master designs work

Master design files are team-maintained Figma files containing canonical components, patterns, and visual assets. They establish the authoritative brand look for each asset type.

**Rules:**
- **Reference, don't modify.** Use master files as visual references when generating code-based graphics. Extract structure, colors, and patterns — don't edit the Figma file.
- **Match the style.** Generated graphics should be visually consistent with the master designs, even though they're produced via code.
- **Pull tokens dynamically.** Use the Figma MCP to read current values rather than hardcoding from memory.

## Design Files

| File | URL | Contains | Use for |
|---|---|---|---|
| Inkeep Brand Assets | https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Brand-Assets | Brand Assets master page — all atomic graphical elements (logos, icons, illustrations, backgrounds, third-party logos), design tokens (5 variable collections) | Primary source for all brand assets and tokens |
| Inkeep Agent Graphics Workspace | https://www.figma.com/design/S5kGTPZ0kSjmSxusJ56QJH/Inkeep-Agent-Graphics-Workspace | Shared workspace for AI-generated graphics — one page per project, organized by date and medium | Default target for all new graphics creation (unless user specifies a different file) |

## Navigating Figma files via MCP

**Always use the Figma MCP to navigate** — never the browser.

### How to discover pages and assets

1. **List all pages in the file** — call the Figma MCP to get the file's page tree. This returns all page names and their node IDs.
2. **Scan page names** for relevance to your task (logos, social, banners, presentations, etc.)
3. **Read a specific page** by its node ID to see what components and frames it contains.
4. **Drill into nodes** to extract specific assets, styles, colors, and typography.

### Key node IDs (known)

| Page | Node ID |
|---|---|
| Brand Assets (master asset page) | `5003:63` |
| Logos section | `5003:64` |
| Icon Set section | `5006:187898` |
| Illustrations section | `5003:66` |
| Customers section | `5045:158` |
| Third-Party Logos section | `5003:70` |
| Decorative & Backgrounds section | `5003:69` |
| UI Elements section | `5003:68` |
| Brand Mascot section | `5003:65` |
| Reference Examples section | `5097:4194` |

> For other pages, use the Figma MCP to get their node IDs dynamically. Node IDs may change if pages are restructured.

### Navigation strategy by task

| What you need | Where to look first | Fallback |
|---|---|---|
| Logo (any format) | Brand Assets → Logos (`logo/`) | — |
| Any icon | Brand Assets → Icon Set (`iconset/`) | — |
| Illustrations | Brand Assets → Illustrations (`illustration/`) | — |
| Customer assets (logo + case study hero) | Brand Assets → Customers (`customer/`) | — |
| Integration partner logo | Brand Assets → Third-Party Logos (`third-party/`) | `tools/fetch-logo.ts` for logos not in the library |
| Background, gradient, texture | Brand Assets → Decorative & Backgrounds (`background/`) | — |
| Product UI mockup | Brand Assets → UI Elements (`ui/`) | — |
| Mascot/Keepie | Brand Assets → Brand Mascot (`mascot/`) | — |
| Brand colors, typography, spacing | Design tokens in the Inkeep Brand Assets file | Token values in `tokens/marketing.md` |
| Need visual inspiration or style reference | Reference Examples (`_reference/` prefix) | Gradient swatches, UI screenshots, illustration variants. For style matching only — do NOT place in compositions. |

## Brand Assets Page

The Brand Assets page in the Inkeep Brand Assets file is a curated collection of all unique atomic graphical elements, organized for AI consumption.

Production sections contain only **COMPONENT** nodes — every item is a published library component accessible via `importComponentByKeyAsync`. The Reference Examples section contains FRAME/INSTANCE items that are not published as library components.

- **File key**: `D7NDSM2peo1iLhkjLxmGP5`
- **Page node ID**: `5003:63`
- **URL**: https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Brand-Assets?node-id=5003:63

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

> Items prefixed with `_reference/` are in the **Reference Examples** section — non-publishable reference material (gradient swatches, UI screenshots, illustration variants, case study heroes). These are for visual inspiration only — do NOT clone or place them in compositions.

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

### Preferred method: import from published library

The Inkeep Brand Assets file is published as a team library. Use `importComponentByKeyAsync` for asset acquisition — no cross-file navigation needed:

```javascript
// Import by component key (preferred — no file navigation needed)
const component = await figma.importComponentByKeyAsync(componentKey);
const instance = component.createInstance();
instance.x = targetX;
instance.y = targetY;
```

**Discovering component keys (fastest → slowest):**

1. **Pre-computed lookup** — read `tokens/figma.json`. Contains every component's `key`, `id`, and `fileKey` indexed by name. No API call needed.
2. **REST API** — `GET /v1/files/D7NDSM2peo1iLhkjLxmGP5/components` — each component in the response includes a `key` field.
3. **Runtime discovery** — navigate to Inkeep Brand Assets file, find the node by name, read `node.key`.

### Fallback: cross-file clone

If `importComponentByKeyAsync` fails (component key changed, library update pending, or asset is in Reference Examples and not published), fall back to the cross-file clone workflow:

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
