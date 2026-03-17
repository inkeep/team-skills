#!/usr/bin/env bun

/**
 * Brand profile fetcher — returns logo + colors + fonts + company data for a third-party brand.
 *
 * Usage:
 *   bun tools/fetch-brand.ts --name "Zendesk"
 *   bun tools/fetch-brand.ts --name "Zendesk" --domain "zendesk.com"
 *   bun tools/fetch-brand.ts --name "Freshworks"  # uses Search API to resolve domain
 *
 * What it does:
 *   1. If --domain is provided, use it directly
 *   2. If not, try to resolve domain via Brandfetch Search API (free, Client ID auth)
 *   3. Fetch full brand profile from Brandfetch Brand API (colors, fonts, company, logos)
 *   4. Fetch logo SVG via fetch-logo.ts (existing script — Simple Icons → Iconify → Brandfetch)
 *   5. Return combined { logo, colors, fonts, company } profile as JSON
 *
 * Requires:
 *   BRANDFETCH_API_KEY — for Brand API (Bearer token)
 *   BRANDFETCH_CLIENT_ID — for Search API (optional — only needed if --domain not provided)
 *
 * Output: JSON to stdout. Status/errors to stderr.
 */

import { spawnSync } from "child_process";
import { resolve, dirname } from "path";

// --- Types ---

interface BrandColor {
  hex: string;
  type: "accent" | "dark" | "light" | "brand";
  brightness: number;
}

interface BrandFont {
  name: string | null;
  type: "title" | "body";
  origin: "google" | "custom" | "system";
  originId: string | null;
  weights: number[];
}

interface BrandCompany {
  employees: number | null;
  foundedYear: number | null;
  kind: string | null;
  industries: Array<{ name: string; slug: string; score: number }>;
  location: {
    city: string | null;
    country: string | null;
    countryCode: string | null;
  } | null;
}

interface BrandProfile {
  found: boolean;
  name: string;
  domain: string;
  description: string | null;
  qualityScore: number | null;
  colors: BrandColor[];
  fonts: BrandFont[];
  company: BrandCompany | null;
  logo: {
    found: boolean;
    source: string;
    format: string;
    svg: string;
  } | null;
  searchUsed: boolean;
}

// --- Logging (stderr) ---

const verbose = !process.argv.includes("--quiet");
function log(msg: string) {
  if (verbose) process.stderr.write(msg + "\n");
}

// --- Search API: resolve brand name → domain ---

async function resolveViaSearch(name: string): Promise<string | null> {
  const clientId = process.env.BRANDFETCH_CLIENT_ID;
  if (!clientId) {
    log("  ⚠ Search API: BRANDFETCH_CLIENT_ID not set — cannot resolve domain from name");
    return null;
  }

  const url = `https://api.brandfetch.io/v2/search/${encodeURIComponent(name)}?c=${clientId}`;
  try {
    const resp = await fetch(url);
    if (resp.status !== 200) {
      log(`  ✗ Search API: HTTP ${resp.status}`);
      return null;
    }

    const results = await resp.json() as Array<{ name: string; domain: string }>;
    if (!results || results.length === 0) {
      log(`  ✗ Search API: no results for "${name}"`);
      return null;
    }

    // Take the first result — best match by relevance
    const match = results[0];
    log(`  ✓ Search API: "${name}" → ${match.domain} ("${match.name}")`);
    return match.domain;
  } catch (e) {
    log(`  ✗ Search API: fetch error — ${e}`);
    return null;
  }
}

// --- Brand API: fetch full profile ---

async function fetchBrandProfile(domain: string): Promise<Omit<BrandProfile, "logo" | "searchUsed"> | null> {
  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!apiKey) {
    log("  ⚠ Brand API: BRANDFETCH_API_KEY not set — cannot fetch brand profile");
    return null;
  }

  const url = `https://api.brandfetch.io/v2/brands/${domain}`;
  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (resp.status === 404) {
      log(`  ✗ Brand API: brand not found for "${domain}"`);
      return null;
    }
    if (resp.status === 401) {
      log("  ✗ Brand API: invalid API key");
      return null;
    }
    if (resp.status !== 200) {
      log(`  ✗ Brand API: HTTP ${resp.status}`);
      return null;
    }

    const brand = await resp.json() as any;

    const colors: BrandColor[] = (brand.colors || []).map((c: any) => ({
      hex: c.hex,
      type: c.type,
      brightness: c.brightness,
    }));

    const fonts: BrandFont[] = (brand.fonts || []).map((f: any) => ({
      name: f.name,
      type: f.type,
      origin: f.origin,
      originId: f.originId,
      weights: f.weights || [],
    }));

    const company: BrandCompany | null = brand.company
      ? {
          employees: brand.company.employees,
          foundedYear: brand.company.foundedYear,
          kind: brand.company.kind,
          industries: (brand.company.industries || []).map((i: any) => ({
            name: i.name,
            slug: i.slug,
            score: i.score,
          })),
          location: brand.company.location
            ? {
                city: brand.company.location.city,
                country: brand.company.location.country,
                countryCode: brand.company.location.countryCode,
              }
            : null,
        }
      : null;

    log(`  ✓ Brand API: found "${brand.name}" — ${colors.length} colors, ${fonts.length} fonts`);

    return {
      found: true,
      name: brand.name || domain,
      domain,
      description: brand.description || null,
      qualityScore: brand.qualityScore ?? null,
      colors,
      fonts,
      company,
    };
  } catch (e) {
    log(`  ✗ Brand API: fetch error — ${e}`);
    return null;
  }
}

// --- Logo fetch (delegates to fetch-logo.ts) ---

function fetchLogo(name: string, domain: string, theme: string): { found: boolean; source: string; format: string; svg: string } | null {
  const scriptDir = dirname(resolve(process.argv[1]));
  const fetchLogoPath = resolve(scriptDir, "fetch-logo.ts");

  const result = spawnSync("bun", [fetchLogoPath, "--name", name, "--domain", domain, "--theme", theme, "--quiet"], {
    encoding: "utf-8",
    timeout: 30000,
  });

  if (result.status !== 0) {
    log("  ✗ Logo fetch: fetch-logo.ts failed");
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout);
    if (parsed.found) {
      log(`  ✓ Logo: found via ${parsed.source} (${parsed.format})`);
      return {
        found: true,
        source: parsed.source,
        format: parsed.format,
        svg: parsed.svg,
      };
    }
    return null;
  } catch {
    log("  ✗ Logo fetch: failed to parse output");
    return null;
  }
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let name = "";
  let domain = "";
  let theme = "light";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) name = args[++i];
    else if (args[i] === "--domain" && args[i + 1]) domain = args[++i];
    else if (args[i] === "--theme" && args[i + 1]) theme = args[++i];
    else if (args[i] === "--help") {
      console.log(`
Brand profile fetcher — logo + colors + fonts + company data

Usage:
  bun tools/fetch-brand.ts --name "Zendesk"
  bun tools/fetch-brand.ts --name "Zendesk" --domain "zendesk.com"

Options:
  --name      Brand name (required)
  --domain    Company domain (optional — resolved via Search API if omitted)
  --theme     Preferred logo theme: "light" or "dark" (default: light)
  --quiet     Suppress status messages on stderr

Requires: BRANDFETCH_API_KEY (Brand API)
Optional: BRANDFETCH_CLIENT_ID (Search API — for domain resolution when --domain not provided)
`);
      process.exit(0);
    }
  }

  if (!name) {
    process.stderr.write("Error: --name is required\n");
    process.exit(1);
  }

  log(`\nFetching brand profile: "${name}" (domain: ${domain || "auto-resolve"}, theme: ${theme})\n`);

  let searchUsed = false;

  // Step 1: Resolve domain if not provided
  if (!domain) {
    log("Phase 1: Resolving domain via Search API...");
    const resolved = await resolveViaSearch(name);
    if (resolved) {
      domain = resolved;
      searchUsed = true;
    } else {
      // Fall back to naive inference
      domain = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") + ".com";
      log(`  → Falling back to inferred domain: ${domain}`);
    }
  }

  // Step 2: Fetch brand profile from Brand API
  log("\nPhase 2: Fetching brand profile from Brand API...");
  const profile = await fetchBrandProfile(domain);

  if (!profile) {
    console.log(JSON.stringify({
      found: false,
      name,
      domain,
      searchUsed,
      error: "Brand API returned no data",
    }, null, 2));
    process.exit(0);
  }

  // Step 3: Fetch logo via existing fetch-logo.ts
  log("\nPhase 3: Fetching logo...");
  const logo = fetchLogo(name, domain, theme);

  // Combine and output
  const result: BrandProfile = {
    ...profile,
    logo: logo || null,
    searchUsed,
  };

  log(`\n✓ Brand profile complete: ${result.colors.length} colors, ${result.fonts.length} fonts, logo: ${logo ? "found" : "not found"}\n`);

  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  process.stderr.write(`Fatal error: ${e}\n`);
  process.exit(1);
});
