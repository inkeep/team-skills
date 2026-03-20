#!/usr/bin/env bun

/**
 * SVG logo fetcher — checks multiple sources in parallel and returns the first hit.
 *
 * Single logo:
 *   bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --name "Freshdesk"
 *   bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --name "Pfizer" --domain "pfizer.com"
 *   bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --name "Vercel" --output vercel.svg
 *   bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --name "Nike" --theme dark
 *
 * Batch mode (multiple logos in parallel):
 *   bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --batch "Vercel,Supabase,Clerk,Freshdesk,Pfizer:pfizer.com"
 *   bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --batch "Vercel,Supabase" --output-dir /tmp/logos
 *
 *   Batch format: comma-separated names. Append :domain for Brandfetch hints.
 *   Output: JSON array to stdout. With --output-dir, saves each SVG as {slug}.svg.
 *
 * Sources checked (in parallel where possible):
 *   1. Simple Icons (CDN) — 3,400+ monochrome brand SVGs, no auth
 *   2. Iconify logos/ (API) — full-color via gilbarbara set, no auth
 *   3. Brandfetch (API) — 60M+ brands, requires BRANDFETCH_API_KEY
 *
 * Output: JSON to stdout with svg content, source, and metadata.
 * Status/errors go to stderr (can be suppressed).
 *
 * Requires: BRANDFETCH_API_KEY environment variable (for Brandfetch fallback).
 *           Without it, only Simple Icons and Iconify are checked.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";

// --- Types ---

interface LogoResult {
  found: boolean;
  source: string;
  name: string;
  slug: string;
  format: "svg" | "png";
  theme: string;
  svg: string;
  file?: string;
  url: string;
}

interface SourceCheck {
  source: string;
  check: () => Promise<LogoResult | null>;
}

// --- Slug utilities ---

/** Convert a brand name to a Simple Icons slug */
function toSimpleIconsSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "dot")
    .replace(/\+/g, "plus")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

/** Convert a brand name to an Iconify logos/ slug */
function toIconifySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Infer domain from brand name if not provided */
function inferDomain(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") + ".com";
}

// --- Source checkers ---

async function checkSimpleIcons(name: string): Promise<LogoResult | null> {
  const slug = toSimpleIconsSlug(name);
  const url = `https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/${slug}.svg`;

  try {
    const resp = await fetch(url);
    if (resp.status !== 200) return null;

    const svg = await resp.text();
    if (!svg.includes("<svg")) return null;

    log(`  ✓ Simple Icons: found "${slug}" (${svg.length} bytes, monochrome)`);
    return {
      found: true,
      source: "simple-icons",
      name,
      slug,
      format: "svg",
      theme: "mono",
      svg,
      url,
    };
  } catch {
    return null;
  }
}

async function checkIconifyLogos(name: string): Promise<LogoResult | null> {
  const slug = toIconifySlug(name);

  // Try multiple naming patterns
  const patterns = [
    `${slug}-icon`,
    slug,
    `${slug}-wordmark`,
  ];

  for (const pattern of patterns) {
    const url = `https://api.iconify.design/logos/${pattern}.svg`;
    try {
      const resp = await fetch(url);
      if (resp.status !== 200) continue;

      const svg = await resp.text();
      if (!svg.includes("<svg")) continue;

      log(`  ✓ Iconify logos/: found "${pattern}" (${svg.length} bytes, full-color)`);
      return {
        found: true,
        source: "iconify-logos",
        name,
        slug: pattern,
        format: "svg",
        theme: "color",
        svg,
        url,
      };
    } catch {
      continue;
    }
  }

  return null;
}

async function checkIconifySearch(name: string): Promise<LogoResult | null> {
  const url = `https://api.iconify.design/search?query=${encodeURIComponent(name)}&limit=5`;

  try {
    const resp = await fetch(url);
    if (resp.status !== 200) return null;

    const data = await resp.json() as { icons?: string[] };
    const icons = data.icons || [];

    // Prefer logos/ prefix (full-color), then simple-icons
    const preferred = icons.find(i => i.startsWith("logos:")) ||
                      icons.find(i => i.startsWith("simple-icons:"));
    if (!preferred) return null;

    const [prefix, iconName] = preferred.split(":");
    const svgUrl = `https://api.iconify.design/${prefix}/${iconName}.svg`;
    const svgResp = await fetch(svgUrl);
    if (svgResp.status !== 200) return null;

    const svg = await svgResp.text();
    if (!svg.includes("<svg")) return null;

    const isColor = prefix === "logos";
    log(`  ✓ Iconify search: found "${preferred}" (${svg.length} bytes, ${isColor ? "full-color" : "monochrome"})`);
    return {
      found: true,
      source: `iconify-search (${prefix})`,
      name,
      slug: iconName,
      format: "svg",
      theme: isColor ? "color" : "mono",
      svg,
      url: svgUrl,
    };
  } catch {
    return null;
  }
}

async function checkBrandfetch(name: string, domain: string, theme: string): Promise<LogoResult | null> {
  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!apiKey) {
    log("  ⚠ Brandfetch: BRANDFETCH_API_KEY not set — skipping");
    return null;
  }

  const url = `https://api.brandfetch.io/v2/brands/${domain}`;

  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (resp.status === 401) {
      log("  ✗ Brandfetch: invalid API key");
      return null;
    }
    if (resp.status === 404) {
      log(`  ✗ Brandfetch: brand not found for "${domain}"`);
      return null;
    }
    if (resp.status !== 200) {
      log(`  ✗ Brandfetch: HTTP ${resp.status}`);
      return null;
    }

    const brand = await resp.json() as {
      name: string;
      logos?: Array<{
        type: string;
        theme: string;
        formats?: Array<{ format: string; src: string }>;
      }>;
    };

    // Find SVG logo matching requested theme, fall back to any theme
    const logos = brand.logos || [];
    const svgLogo =
      logos.find(l => l.type === "logo" && l.theme === theme)?.formats?.find(f => f.format === "svg") ||
      logos.find(l => l.type === "logo")?.formats?.find(f => f.format === "svg") ||
      logos.find(l => l.type === "symbol")?.formats?.find(f => f.format === "svg") ||
      logos.find(l => l.type === "icon")?.formats?.find(f => f.format === "svg");

    if (!svgLogo) {
      // Fall back to PNG if no SVG
      const pngLogo =
        logos.find(l => l.type === "logo" && l.theme === theme)?.formats?.find(f => f.format === "png") ||
        logos.find(l => l.type === "logo")?.formats?.find(f => f.format === "png");

      if (pngLogo) {
        log(`  ⚠ Brandfetch: found "${brand.name}" but only PNG available (no SVG)`);
        const pngResp = await fetch(pngLogo.src);
        if (pngResp.status !== 200) return null;
        const buffer = await pngResp.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return {
          found: true,
          source: "brandfetch",
          name: brand.name,
          slug: domain,
          format: "png",
          theme,
          svg: `data:image/png;base64,${base64}`,
          url: pngLogo.src,
        };
      }

      log(`  ✗ Brandfetch: found "${brand.name}" but no logo formats available`);
      return null;
    }

    // Fetch the actual SVG content
    const svgResp = await fetch(svgLogo.src);
    if (svgResp.status !== 200) {
      log(`  ✗ Brandfetch: SVG URL returned HTTP ${svgResp.status}`);
      return null;
    }

    const svg = await svgResp.text();
    if (!svg.includes("<svg")) {
      log("  ✗ Brandfetch: response is not valid SVG");
      return null;
    }

    log(`  ✓ Brandfetch: found "${brand.name}" (${svg.length} bytes, full-color, theme: ${theme})`);
    return {
      found: true,
      source: "brandfetch",
      name: brand.name,
      slug: domain,
      format: "svg",
      theme,
      svg,
      url: svgLogo.src,
    };
  } catch (e) {
    log(`  ✗ Brandfetch: fetch error — ${e}`);
    return null;
  }
}

// --- Main ---

function log(msg: string) {
  console.error(msg);
}

function usage() {
  console.error(`Usage: bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --name "Brand Name" [options]

Options:
  --name      Brand name to search for (required)
  --domain    Company domain for Brandfetch lookup (inferred from name if omitted)
  --output    Save SVG to this file path (optional — SVG also included in JSON output)
  --theme     Preferred theme: "light" or "dark" (default: light)
  --prefer    Preferred result: "color" or "mono" (default: color)

Output: JSON to stdout with found, source, name, slug, format, theme, svg, url
        Status messages go to stderr.

Examples:
  bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --name "Freshdesk" --domain "freshdesk.com"
  bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --name "Vercel" --output /tmp/vercel.svg
  bun plugins/gtm/skills/graphics/tools/fetch-logo.ts --name "Pfizer" --domain "pfizer.com" --theme dark`);
}

async function main() {
  const args = process.argv.slice(2);
  let name = "";
  let domain = "";
  let output = "";
  let theme = "light";
  let prefer = "color";

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--name": name = args[++i]; break;
      case "--domain": domain = args[++i]; break;
      case "--output": output = args[++i]; break;
      case "--theme": theme = args[++i]; break;
      case "--prefer": prefer = args[++i]; break;
      case "-h": case "--help": usage(); process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        usage();
        process.exit(1);
    }
  }

  if (!name) {
    console.error("Error: --name is required");
    usage();
    process.exit(1);
  }

  if (!domain) {
    domain = inferDomain(name);
  }

  log(`Searching for logo: "${name}" (domain: ${domain}, theme: ${theme})`);
  log("");

  // Phase 1: Check Simple Icons and Iconify in parallel (fast, no auth)
  log("Phase 1: Checking free sources (parallel)...");
  const [simpleResult, iconifyResult, searchResult] = await Promise.all([
    checkSimpleIcons(name),
    checkIconifyLogos(name),
    checkIconifySearch(name),
  ]);

  // Pick best result from phase 1
  let bestResult: LogoResult | null = null;

  if (prefer === "color") {
    // Prefer full-color (Iconify logos/) over monochrome (Simple Icons)
    bestResult = iconifyResult || searchResult || simpleResult;
  } else {
    // Prefer monochrome (Simple Icons) — usually cleaner for logo walls
    bestResult = simpleResult || iconifyResult || searchResult;
  }

  // Phase 2: If no result yet, try Brandfetch (requires API key, uses quota)
  if (!bestResult) {
    log("");
    log("Phase 2: Checking Brandfetch (API key required)...");
    bestResult = await checkBrandfetch(name, domain, theme);
  } else if (!iconifyResult && !searchResult && simpleResult && prefer === "color") {
    // We have monochrome only — check Brandfetch for color version
    log("");
    log("Phase 2: Only monochrome found — checking Brandfetch for full-color...");
    const bfResult = await checkBrandfetch(name, domain, theme);
    if (bfResult && bfResult.format === "svg") {
      bestResult = bfResult;
    }
    // If Brandfetch doesn't have it either, keep the monochrome result
  }

  log("");

  if (!bestResult) {
    log("✗ No logo found in any source.");
    const notFound = {
      found: false,
      source: "none",
      name,
      slug: "",
      format: "svg" as const,
      theme,
      svg: "",
      url: "",
      searched: {
        simpleIcons: toSimpleIconsSlug(name),
        iconify: toIconifySlug(name),
        brandfetch: domain,
      },
    };
    console.log(JSON.stringify(notFound, null, 2));
    process.exit(1);
  }

  // Save to file if requested
  if (output && bestResult.format === "svg") {
    const outPath = resolve(output);
    writeFileSync(outPath, bestResult.svg);
    bestResult.file = outPath;
    log(`Saved SVG to: ${outPath}`);
  }

  log(`✓ Found logo from ${bestResult.source} (${bestResult.format}, ${bestResult.theme})`);

  // Output JSON to stdout (agent reads this)
  console.log(JSON.stringify(bestResult, null, 2));
}

main().catch((e) => {
  console.error(`Fatal error: ${e}`);
  process.exit(1);
});
