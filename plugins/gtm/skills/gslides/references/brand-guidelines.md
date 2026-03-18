# Inkeep Brand Guidelines

Use when: Pulling brand tokens for slide styling
Priority: P0
Impact: Off-brand presentations with inconsistent colors, fonts, or layouts

---

## Brand Identity

Load `/brand` for all Inkeep brand identity guidance — principles, logo rules, typography, color usage, text style rules, and element patterns. The brand skill's reference files provide deep guidance on composition (Z-pattern, split layout, visual hierarchy) and element recipes (section headers, badges, quote cards).

For exact token values (all colors, spacing, radii, shadows, typography scale), read `.claude/design-system/manifest.md`.

## Figma Design System

The canonical brand assets live in the Inkeep Design Assets Figma file:

- **File URL**: https://www.figma.com/design/D7NDSM2peo1iLhkjLxmGP5/Inkeep-Design-Assetts
- **Brand Assets page**: node-id `5003:63`

Use the Figma MCP to pull current values. Always prefer live Figma data over static references.

### How to pull from Figma MCP

**Always use the Figma MCP for navigation** — never the browser.

1. **List pages** — get the file's page tree to see all available pages and node IDs
2. **Read the Brand Assets page** (node `5003:63`) — this contains logos, icons, illustrations, backgrounds
3. Extract color styles — look for design token variables via `figma.variables.getLocalVariablesAsync()`
4. Extract typography — font families, heading/body size scales, weight conventions
5. If you need logos, navigate to the Logos section (node `5003:64`)
6. Export assets as needed for slide use

## Slide Styling Defaults

| Property | Value |
|---|---|
| Slide size | Widescreen 16:9 (default) |
| Background | Warm background (`#FBF9F4`) or white |
| Heading font size | 28-36pt |
| Body font size | 18-24pt |
| Minimum font size | 14pt (footnotes/captions only) |
| Margins | Generous whitespace; don't crowd edges |

## Trusted Customers (for social proof slides)

When building sales or customer decks, these logos can be referenced:
- Postman, Anthropic, Midjourney, Pinecone, PostHog, Solana, Clerk, Clay

Pull current customer logos from the Inkeep website or Figma assets.
