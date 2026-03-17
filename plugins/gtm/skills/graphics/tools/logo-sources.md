Use when: A third-party logo is needed but not found in the Brand Assets page (node `5003:70`)
Priority: P0
Impact: Without this, the agent falls back to text pill placeholders instead of using reliable programmatic SVG sources

---

# SVG Logo Sources for Third-Party Brands

When a third-party logo is not in the Brand Assets page, use `tools/fetch-logo.ts` to find and download the SVG in a single call. The script checks all sources in parallel and returns the best result.

## Quick usage

```bash
bun tools/fetch-logo.ts --name "Freshdesk" --domain "freshdesk.com" --output /tmp/freshdesk.svg
```

Options:
- `--name` — brand name (required)
- `--domain` — company domain for Brandfetch lookup (inferred from name if omitted)
- `--output` — save SVG to file (optional — SVG also in JSON output)
- `--theme` — "light" or "dark" (default: light)
- `--prefer` — "color" or "mono" (default: color)

Output: JSON to stdout with `found`, `source`, `name`, `slug`, `format`, `theme`, `svg`, `url`.

## Lookup sequence

The script checks these sources (phase 1 in parallel, phase 2 only if needed):

| Step | Source | Best for | Access pattern | Auth |
|---|---|---|---|---|
| 1 | **Simple Icons** | Broadest tech coverage (3,400+ monochrome SVGs) | CDN: `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/{slug}.svg` | None |
| 2 | **Iconify** | Full-color via gilbarbara logos (1,837) + search | API: `https://api.iconify.design/logos/{slug}-icon.svg` | None |
| 3 | **Brandfetch** | Non-tech brands (60M+ — retail, finance, healthcare, etc.) | Brand API: `https://api.brandfetch.io/v2/brands/{domain}` | `BRANDFETCH_API_KEY` |

Phase 1 (Simple Icons + Iconify) runs in parallel (~200ms). Phase 2 (Brandfetch) only fires when phase 1 finds nothing (~1s).

If all sources fail, the script returns `"found": false`. Fall back to a styled text pill placeholder (brand name in rounded rectangle) and flag for user to replace manually.

### Domain resolution via Brandfetch Search API

When the company domain is unknown (e.g., you only know "Freshworks" but not that the domain is `freshworks.com`), the **Brand Search API** can resolve it:

```
GET https://api.brandfetch.io/v2/search/{name}?c={clientId}
```

- **Auth:** Client ID as query param `c=BRANDFETCH_CLIENT_ID` (not Bearer token)
- **Response:** Array of `{ name, domain, icon, claimed, brandId }` — first result is best match
- **Rate limit:** 500K req/month, 200 req per 5 min per IP
- **Cost:** Free (uses Client ID, not Brand API quota)

This is integrated into `tools/fetch-brand.ts` (full brand profile fetcher) as the domain resolution step when `--domain` is not provided. The `fetch-logo.ts` script still uses naive domain inference (name → `{name}.com`) for speed — use `fetch-brand.ts` when domain inference fails or when you need the full brand profile (colors, fonts, company data) alongside the logo.

### Why this order?

- **Simple Icons first** — most reliable access (CDN, zero auth, no bot protection), widest tech coverage (3,414 brands). Trade-off: monochrome only.
- **Iconify second** — aggregates gilbarbara/logos (1,837 full-color) + Simple Icons. When Simple Icons has a monochrome logo and you need full-color, Iconify's `logos/` prefix provides it. Also has a search API for when the slug is unknown.
- **Brandfetch last** — the only source that covers non-tech brands (Pfizer, Deloitte, JPMorgan, Walmart — none exist in the other two). Uses API quota (2,500 calls/month free tier), so only checked when free sources miss.

### When each source is the only option

| Scenario | Only source |
|---|---|
| Non-tech brand (pharma, finance, retail, healthcare, consulting) | **Brandfetch** |
| Need full-color logo and Simple Icons only has monochrome | **Iconify** (`logos/` prefix) |
| Don't know the slug or exact brand name | **Iconify** (search API) |
| Twilio, Salesforce (not in Simple Icons) | **Iconify** |

---

## Source details

### 1. Simple Icons (most reliable, widest tech coverage)

3,414 brand SVGs via CDN. Monochrome (single brand color per icon). The most battle-tested source — CDN URLs never fail, no auth, no bot protection.

**Direct SVG by slug (no API call needed):**
```
https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/{slug}.svg
```

**With custom color:**
```
https://cdn.simpleicons.org/{slug}/{hex_color}
```

**With dark mode color:**
```
https://cdn.simpleicons.org/{slug}/{light_hex}/{dark_hex}
```

**Slug convention:** lowercase brand name, no spaces, no special characters. Examples:
- Notion → `notion`
- GitHub → `github`
- Google Cloud → `googlecloud`
- VS Code → `visualstudiocode`
- Next.js → `nextdotjs`

For exact slugs, check https://github.com/simple-icons/simple-icons/blob/develop/slugs.md

**Importing into Figma:**
```javascript
// via figma_execute — fetch SVG from CDN and import
const response = await fetch('https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/notion.svg');
const svgString = await response.text();
const node = figma.createNodeFromSvg(svgString);
node.name = 'third-party/notion';
```

**SVG quality:** Extremely clean — Vercel's SVG is 132 bytes (single `<path>`). All use a standard `24x24` viewBox with a `<title>` element. No fills specified (inherits `currentColor`).

**Limitations:** Monochrome only. If the graphic needs full-color logos, either:
- Apply the brand's official hex color as the fill (available in the Simple Icons npm metadata)
- Move to Iconify for a full-color variant
- Replace fills with the graphic's visual treatment color (e.g., grey for a monochrome logo wall)

**Notable gaps (brands NOT in Simple Icons):** Twilio, Salesforce, Amplitude, Segment, LaunchDarkly. Use Iconify for these.

---

### 2. Iconify (full-color fallback + search)

275K+ icons from 200+ sets. Aggregates Simple Icons and gilbarbara/logos (1,837 full-color logos), plus Font Awesome Brands and others. Valuable for two things: (1) full-color variants via the `logos/` prefix, and (2) search when you don't know the slug.

**Full-color SVG via gilbarbara logos:**
```
https://api.iconify.design/logos/{slug}-icon.svg
```
This provides full-color versions for brands that Simple Icons only has in monochrome. Tested and confirmed working for: Twilio, Salesforce, HubSpot, Zendesk, Intercom, Supabase, Vercel, Notion.

**Monochrome SVG via Simple Icons:**
```
https://api.iconify.design/simple-icons/{slug}.svg
```

**Search for a brand (when slug is unknown):**
```
GET https://api.iconify.design/search?query=notion&limit=5
```
Returns matches across all aggregated sets with their prefixes and names.

**Common brand prefixes:**
- `logos` — gilbarbara logos (full-color) — try `{slug}-icon` or just `{slug}`
- `simple-icons` — Simple Icons set (monochrome)
- `cib` — CoreUI Brands
- `fa6-brands` — Font Awesome Brands

**When to use Iconify:**
- You have a monochrome SVG from Simple Icons but need full-color → try `logos/{slug}-icon`
- You can't find the logo and don't know the right slug → use the search API
- You want to check multiple icon sets in one call

**Limitations:** Coverage depends on the underlying sets. No non-tech brands (Pfizer, Deloitte, etc. return 0 results).

---

### 3. Brandfetch (non-tech brands — the last mile)

60M+ brands. The only source that covers companies outside tech: retail, finance, healthcare, consulting, manufacturing, etc.

**Use the Brand API** (not the CDN — the CDN requires browser context). The API key is available as `BRANDFETCH_API_KEY` env var (provisioned via `./secrets/setup.sh --skill graphics`).

**Fetch brand data including logo URLs:**
```javascript
// via figma_execute
const response = await fetch('https://api.brandfetch.io/v2/brands/{domain}', {
  headers: { 'Authorization': 'Bearer ' + BRANDFETCH_API_KEY }
});
const brand = await response.json();
// brand.logos[] contains logo objects with .formats[] containing SVG/PNG URLs
```

**Response structure:**
- `brand.logos[]` — each has `.type` ("logo" | "icon" | "symbol"), `.theme` ("light" | "dark"), `.formats[]`
- `format` objects have `.format` ("svg" | "png" | "webp") and `.src` (direct CDN URL, pre-authenticated)

**To get and import the SVG logo:**
```javascript
// via figma_execute
const resp = await fetch('https://api.brandfetch.io/v2/brands/pfizer.com', {
  headers: { 'Authorization': 'Bearer ' + BRANDFETCH_API_KEY }
});
const brand = await resp.json();
const svgLogo = brand.logos
  ?.find(l => l.type === 'logo' && l.theme === 'light')
  ?.formats?.find(f => f.format === 'svg');
if (svgLogo) {
  const svgResp = await fetch(svgLogo.src);
  const svgString = await svgResp.text();
  const node = figma.createNodeFromSvg(svgString);
  node.name = 'third-party/pfizer';
}
```

**Auth:** Requires `BRANDFETCH_API_KEY` env var (Bearer token). Set up automatically by `./secrets/setup.sh --skill graphics`. Stored in 1Password (Shared vault → "Graphics Skill" item).

**When Brandfetch is the only option:** Tested brands with zero coverage in Simple Icons and Iconify:
- Freshdesk, SharePoint, Document360, Outlook (from Inkeep integrations page)
- Pfizer, Deloitte, JPMorgan, Walmart (non-tech)

All returned SVG logos with light/dark theme variants via the Brand API.

**Rate limits:** Free tier: 2,500 API calls/month. Each brand lookup costs 1 call. The SVG URLs in the response are pre-authenticated CDN URLs — fetch them directly without additional auth.

---

## Post-import checklist

After importing a third-party logo from any source:

- [ ] **Name the node** with the `third-party/` prefix convention (e.g., `third-party/vercel`) to match Brand Assets naming
- [ ] **Match visual treatment** — if other logos in the graphic are monochrome/grey, convert the imported logo to match (replace fills with the target color)
- [ ] **Scale to match siblings** — imported logos may be different sizes. Normalize to match other logos in the composition
- [ ] **Verify SVG import** — screenshot after import to confirm it rendered correctly. Some SVGs with gradients, masks, or complex filters may not import cleanly into Figma
- [ ] **If SVG import fails** — try a simpler variant (icon-only vs full wordmark), try a different source, or fall back to the text pill placeholder

## Full brand profiles (beyond logos)

When you need more than just the logo — brand colors, fonts, and company data for comparison graphics, case study heroes, or integration showcases — use the full brand profile script:

```bash
bun tools/fetch-brand.ts --name "Zendesk" --domain "zendesk.com"
```

Returns `{ logo, colors, fonts, company }`. See SKILL.md Step 2f for details and the Asset Manifest integration.

Full Brandfetch API capabilities report: `reports/brandfetch-quiver-extended-capabilities/REPORT.md`

## Additional resources

- Full research report: `reports/svg-logo-apis-brand-collections/REPORT.md`
- Brandfetch capabilities report: `reports/brandfetch-quiver-extended-capabilities/REPORT.md`
- Simple Icons website: https://simpleicons.org/
- Brandfetch developer portal: https://brandfetch.com/developers
- Iconify API docs: https://iconify.design/docs/api/
