# Inkeep Brand Guidelines

Use when: Pulling brand tokens for slide styling, or as fallback if Figma MCP is unavailable
Priority: P0
Impact: Off-brand presentations with inconsistent colors, fonts, or layouts

---

## Figma Design System

The canonical brand assets live in the BABCO Design Assets Figma file:

- **File URL**: https://www.figma.com/design/by048nPGeK3c6FKMvlmPCz/BABCO-Design-Assetts
- **Brand Guide page**: node-id `2454-979`

Use the Figma MCP to pull current values. Always prefer live Figma data over the fallback tokens below.

## How to pull from Figma MCP

**Always use the Figma MCP for navigation** — never the browser.

1. **List pages** — get the file's page tree to see all available pages and node IDs
2. **Read the Brand Guide page** (node `2454-979`) — this is the primary brand token source
3. Extract color styles — look for named styles like "Gradient - Dev", primary, secondary, background
4. Extract typography — font families, heading/body size scales, weight conventions
5. If you need logos, navigate to the "Final Logos" page (get its node ID from the page tree)
6. Export assets as needed for slide use

The BABCO Design Assets file has many pages (Full Brand Guide, Final Logos, Social Assets, Presentation Template, etc.). For slides, the Brand Guide and Final Logos pages are most relevant. Use the page tree listing to find others if needed.

## Fallback Brand Tokens

Use these only when the Figma MCP is unavailable.

### Colors

| Token | Hex | Usage |
|---|---|---|
| Background (warm) | `#FBF9F4` | Slide backgrounds |
| Primary text | `#1A1A1A` | Headings, body text |
| Secondary text | `#6B6B6B` | Captions, supporting text |
| Accent gradient | `Gradient - Dev` | CTAs, highlights, emphasis |

> These are observed values from a single session. The Figma file is authoritative — pull the full palette dynamically when possible.

### Typography

Pull font families, sizes, and weights from the Figma design system. Observed patterns:
- **Headings**: Large, bold, primary text color
- **Body**: Regular weight, smaller, primary or secondary text color
- **Captions/labels**: Small, secondary text color

### Logo

The Inkeep logo lives in the Figma Brand Guide page. Export via Figma MCP for slide headers.

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
