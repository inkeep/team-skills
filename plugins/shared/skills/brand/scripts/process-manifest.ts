#!/usr/bin/env bun
/**
 * Process a raw Figma manifest JSON into:
 *   1. A markdown manifest (tokens + components)
 *   2. Exported SVG files organized by section hierarchy
 *   3. PNG thumbnails converted locally via resvg-js (no second API call)
 *   4. figma.json with Figma-specific pointers
 *
 * Usage: bun process-manifest.ts <input.json> <output-dir> [--skip-assets] [--png-max 768]
 *
 * Output structure:
 *   <output-dir>/
 *     manifest.md          — markdown manifest with tokens + components
 *     figma.json           — component key, node ID, file key
 *     assets/
 *       svg/               — source-quality SVGs (for code use)
 *       png/               — AI-vision-optimized PNGs (for multimodal models)
 *       icon-set/          — section folders mirror Figma hierarchy
 *       logos/
 *       ...
 *
 * The input JSON is produced by generate-manifest.js running in figma_execute.
 *
 * Token resolution for image export (in order):
 *   1. FIGMA_ACCESS_TOKEN env var
 *   2. ~/.claude.json mcpServers.figma-console.env.FIGMA_ACCESS_TOKEN
 *   3. Skip image export if no token found (manifest.md still generated)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync } from "fs";
import { join, dirname, relative } from "path";
import { homedir } from "os";
import sharp from "sharp";

// ============================================================
// Types
// ============================================================

interface Token {
  name: string;
  type: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  value: string | number | boolean;
  allValues: Record<string, string | number | boolean>;
  description: string;
  scopes: string[];
  codeSyntax: Record<string, string>;
}

interface TokenCollection {
  modes: string[];
  defaultMode: string;
  tokens: Token[];
}

interface Component {
  name: string;
  id: string;
  key: string;
  description: string;
  width: number;
  height: number;
  section: string;
}

interface Manifest {
  generatedAt: string;
  file: { name: string; key: string };
  tokens: Record<string, TokenCollection>;
  sections: { name: string; path: string }[];
  components: Component[];
}

// ============================================================
// Token resolution
// ============================================================

function resolveToken(): string | null {
  if (process.env.FIGMA_ACCESS_TOKEN) {
    return process.env.FIGMA_ACCESS_TOKEN;
  }

  const claudeJsonPath = join(homedir(), ".claude.json");
  if (existsSync(claudeJsonPath)) {
    try {
      const claudeConfig = JSON.parse(readFileSync(claudeJsonPath, "utf-8"));

      // Check top-level mcpServers
      const mcps = claudeConfig.mcpServers || {};
      for (const [name, cfg] of Object.entries(mcps) as [string, any][]) {
        if (name.includes("figma") && cfg?.env?.FIGMA_ACCESS_TOKEN) {
          return cfg.env.FIGMA_ACCESS_TOKEN;
        }
      }

      // Check per-project mcpServers
      const projects = claudeConfig.projects || {};
      for (const proj of Object.values(projects) as any[]) {
        const projMcps = proj?.mcpServers || {};
        for (const [name, cfg] of Object.entries(projMcps) as [string, any][]) {
          if (name.includes("figma") && cfg?.env?.FIGMA_ACCESS_TOKEN) {
            return cfg.env.FIGMA_ACCESS_TOKEN;
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  return null;
}

// ============================================================
// Markdown generation
// ============================================================

function formatValue(val: string | number | boolean, type: string): string {
  if (type === "COLOR") return `\`${val}\``;
  if (type === "FLOAT") {
    const n = Number(val);
    if (n < 0) return `${n.toFixed(2)}px`;
    if (n < 2 && n > 0) return `${Math.round(n * 100)}%`;
    if (n >= 9999) return `${n}px`;
    return `${Math.round(n)}px`;
  }
  if (type === "STRING") return String(val);
  return String(val);
}

const SECTION_ORDER = [
  "Icon Set",
  "Logos",
  "Illustrations",
  "Customers",
  "Decorative & Backgrounds",
  "Building Blocks",
  "Brand Mascot",
  "Reference Examples",
];

function buildSectionMap(
  components: Component[]
): Map<string, Map<string | null, Component[]>> {
  const bySection = new Map<string, Map<string | null, Component[]>>();
  for (const c of components) {
    const parts = c.section ? c.section.split(" > ") : ["(root)"];
    const top = parts[0];
    const sub = parts.length > 1 ? parts[1] : null;
    if (!bySection.has(top)) bySection.set(top, new Map());
    const subs = bySection.get(top)!;
    if (!subs.has(sub)) subs.set(sub, []);
    subs.get(sub)!.push(c);
  }
  return bySection;
}

function generateMarkdown(
  manifest: Manifest,
  assetIndex: Record<string, string> | null
): string {
  const lines: string[] = [];
  const compCount = manifest.components.length;
  const tokenCount = manifest.tokens
    ? Object.values(manifest.tokens).reduce(
        (sum, col) => sum + col.tokens.length,
        0
      )
    : 0;

  // === HEADER ===
  lines.push("# Inkeep Design Assets Manifest");
  lines.push("");
  lines.push(
    `**${compCount} components, ${tokenCount} design tokens** | ` +
      `File: ${manifest.file.name} (\`${manifest.file.key}\`) | ` +
      `Generated: ${manifest.generatedAt.slice(0, 10)}`
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // === QUICK REFERENCE ===
  const bySection = buildSectionMap(manifest.components);

  lines.push("## Quick Reference");
  lines.push("");

  for (const section of SECTION_ORDER) {
    const subs = bySection.get(section);
    if (!subs) continue;
    let total = 0;
    const subParts: string[] = [];
    for (const [subName, items] of subs) {
      total += items.length;
      if (subName !== null) subParts.push(`${subName} (${items.length})`);
    }
    if (subParts.length > 0) {
      lines.push(`- **${section}** (${total}): ${subParts.join(", ")}`);
    } else {
      lines.push(`- **${section}** (${total})`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // === DESIGN TOKENS ===
  if (manifest.tokens && tokenCount > 0) {
    lines.push(
      `## Design Tokens (${tokenCount} variables across ${Object.keys(manifest.tokens).length} collections)`
    );
    lines.push("");

    for (const [colName, colData] of Object.entries(manifest.tokens)) {
      const tokens = colData.tokens;
      lines.push(`### ${colName} (${tokens.length} tokens)`);
      lines.push("");
      lines.push("| Token | Value | Usage |");
      lines.push("|---|---|---|");

      for (const t of tokens) {
        const val = formatValue(t.value, t.type);
        let desc = t.description;
        if (desc.length > 80) desc = desc.slice(0, 77) + "...";
        lines.push(`| \`${t.name}\` | ${val} | ${desc} |`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  // === FULL COMPONENT LISTING ===
  lines.push("## Full Listing");
  lines.push("");

  for (const section of SECTION_ORDER) {
    const subs = bySection.get(section);
    if (!subs) continue;
    let total = 0;
    for (const items of subs.values()) total += items.length;
    lines.push(`### ${section} (${total})`);
    lines.push("");

    for (const [subName, items] of subs) {
      if (subName !== null) lines.push(`#### ${subName}`);
      for (const c of items) {
        const filePath =
          assetIndex && assetIndex[c.name]
            ? `  png:\`assets/png/${assetIndex[c.name]}\` svg:\`assets/svg/${assetIndex[c.name].replace(/\.png$/, ".svg")}\``
            : "";
        lines.push(
          `- \`${c.name}\` ${c.width}×${c.height} — ${c.description}`
        );
        if (filePath) lines.push(filePath);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ============================================================
// Image export
// ============================================================

const FIGMA_API_BASE = "https://api.figma.com/v1";

async function fetchImageUrlsBatch(
  fileKey: string,
  nodeIds: string[],
  token: string,
  format: string,
  scale: number
): Promise<Record<string, string>> {
  const ids = nodeIds.join(",");
  const url = `${FIGMA_API_BASE}/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`;

  const headers: Record<string, string> = token.startsWith("figu_")
    ? { Authorization: `Bearer ${token}` }
    : { "X-Figma-Token": token };

  let res = await fetch(url, { headers });

  // Retry on rate limit (429) with exponential backoff
  if (res.status === 429) {
    for (const wait of [5000, 10000, 20000]) {
      console.log(`    Rate limited, waiting ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
      res = await fetch(url, { headers });
      if (res.status !== 429) break;
    }
  }

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 400 && text.includes("Render timeout")) return {};
    throw new Error(`Figma API ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    err: string | null;
    images: Record<string, string>;
  };
  if (data.err) {
    if (data.err.includes("Render timeout")) return {};
    throw new Error(`Figma API error: ${data.err}`);
  }

  return data.images;
}

async function fetchImageUrls(
  fileKey: string,
  nodeIds: string[],
  token: string,
  format: string,
  scale: number
): Promise<Record<string, string>> {
  const result = await fetchImageUrlsBatch(
    fileKey,
    nodeIds,
    token,
    format,
    scale
  );
  if (Object.keys(result).length > 0) return result;

  // Timeout — retry with smaller sub-batches
  console.log(
    `    Render timeout with ${nodeIds.length} IDs, splitting into sub-batches of 20...`
  );
  const SUB_SIZE = 20;
  const all: Record<string, string> = {};
  for (let i = 0; i < nodeIds.length; i += SUB_SIZE) {
    const sub = nodeIds.slice(i, i + SUB_SIZE);
    const subResult = await fetchImageUrlsBatch(
      fileKey,
      sub,
      token,
      format,
      scale
    );
    if (Object.keys(subResult).length === 0) {
      console.log(
        `    Sub-batch timeout, falling back to individual export (with delays)...`
      );
      for (const id of sub) {
        const single = await fetchImageUrlsBatch(
          fileKey,
          [id],
          token,
          format,
          scale
        );
        Object.assign(all, single);
        // Throttle to avoid rate limits
        await new Promise((r) => setTimeout(r, 200));
      }
    } else {
      Object.assign(all, subResult);
    }
  }
  return all;
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buffer = await res.arrayBuffer();
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  await Bun.write(dest, buffer);
}

function sectionToDir(section: string): string {
  return section
    .split(" > ")
    .map((s) =>
      s
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    )
    .join("/");
}

function componentToFilename(name: string, format: string): string {
  const parts = name.split("/");
  const base = parts[parts.length - 1]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}.${format}`;
}

async function exportAssets(
  manifest: Manifest,
  assetsDir: string,
  token: string,
  format: string,
  scale: number
): Promise<Record<string, string>> {
  const fileKey = manifest.file.key;
  const BATCH_SIZE = 30;
  const allIds = manifest.components.map((c) => c.id);
  const batches: string[][] = [];
  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    batches.push(allIds.slice(i, i + BATCH_SIZE));
  }

  // Fetch all image URLs
  console.log(`\nFetching image URLs (${batches.length} batches)...`);
  const allImageUrls: Record<string, string> = {};
  for (let i = 0; i < batches.length; i++) {
    console.log(
      `  Batch ${i + 1}/${batches.length} (${batches[i].length} components)`
    );
    const urls = await fetchImageUrls(
      fileKey,
      batches[i],
      token,
      format,
      scale
    );
    Object.assign(allImageUrls, urls);
    // Throttle between batches to avoid rate limits
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.log(`Got ${Object.keys(allImageUrls).length} image URLs`);

  // Build download plan
  const downloadPlan: {
    id: string;
    name: string;
    url: string;
    dest: string;
  }[] = [];
  const idToComponent = new Map(manifest.components.map((c) => [c.id, c]));

  for (const [id, url] of Object.entries(allImageUrls)) {
    if (!url) continue;
    const comp = idToComponent.get(id);
    if (!comp) continue;
    const sectionDir = comp.section
      ? sectionToDir(comp.section)
      : "uncategorized";
    const filename = componentToFilename(comp.name, format);
    const dest = join(assetsDir, sectionDir, filename);
    downloadPlan.push({ id, name: comp.name, url, dest });
  }

  // Download with concurrency
  const CONCURRENCY = 10;
  let downloaded = 0;
  let failed = 0;
  const errors: { name: string; error: string }[] = [];

  console.log(
    `\nDownloading ${downloadPlan.length} files (concurrency: ${CONCURRENCY})...`
  );

  for (let i = 0; i < downloadPlan.length; i += CONCURRENCY) {
    const chunk = downloadPlan.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (item) => {
        try {
          await downloadFile(item.url, item.dest);
          downloaded++;
          if (downloaded % 20 === 0 || downloaded === downloadPlan.length) {
            console.log(`  ${downloaded}/${downloadPlan.length} downloaded`);
          }
        } catch (e: any) {
          failed++;
          errors.push({ name: item.name, error: e.message });
        }
      })
    );
  }

  // Build file path mapping (component name → relative path)
  const filePaths: Record<string, string> = {};
  for (const item of downloadPlan) {
    if (!errors.some((e) => e.name === item.name)) {
      filePaths[item.name] = item.dest.replace(assetsDir + "/", "");
    }
  }

  console.log(`\nAssets: ${downloaded} downloaded, ${failed} failed`);
  if (errors.length > 0) {
    for (const e of errors) console.log(`  ERROR: ${e.name}: ${e.error}`);
  }

  return filePaths;
}

// ============================================================
// Main
// ============================================================

const args = Bun.argv.slice(2);
const flags = { skipAssets: false, pngMax: 768 };

const positional: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--skip-assets") {
    flags.skipAssets = true;
  } else if (args[i] === "--png-max" && args[i + 1]) {
    flags.pngMax = Number(args[++i]);
  } else {
    positional.push(args[i]);
  }
}

if (positional.length < 2) {
  console.error(
    "Usage: bun process-manifest.ts <input.json> <output-dir> [--skip-assets] [--png-max 768]"
  );
  process.exit(1);
}

const [inputPath, outputDir] = positional;

// Load and normalize manifest
const raw = await Bun.file(inputPath).json();
const manifest: Manifest = {
  ...raw,
  components: (raw.components || []).map((c: any) => ({
    name: c.name || c.n,
    id: c.id,
    key: c.key || c.k,
    description: c.description || c.d || "",
    width: c.width || c.w,
    height: c.height || c.h,
    section: c.section || c.s || "",
  })),
};

const tokenCount = manifest.tokens
  ? Object.values(manifest.tokens).reduce(
      (sum, col) => sum + col.tokens.length,
      0
    )
  : 0;

console.log(
  `Processing: ${manifest.components.length} components, ${tokenCount} tokens`
);
console.log(`Output: ${outputDir}`);

// Ensure output dir exists
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

// Step 1: Export assets (if token available and not skipped)
// SVG from Figma API → then local SVG→PNG conversion via resvg-js (no second API call)
let pngIndex: Record<string, string> | null = null;
const token = resolveToken();

if (flags.skipAssets) {
  console.log("\nSkipping asset export (--skip-assets)");
} else if (!token) {
  console.log(
    "\nSkipping asset export (no FIGMA_ACCESS_TOKEN found — set env var or configure in ~/.claude.json)"
  );
} else {
  // Export SVGs from Figma (single API pass)
  console.log("\n--- SVG Export (from Figma API) ---");
  const svgDir = join(outputDir, "assets", "svg");
  const svgIndex = await exportAssets(manifest, svgDir, token, "svg", 1);

  // Convert SVGs → PNGs locally via resvg-js (no API calls, instant)
  console.log(`\n--- PNG Conversion (local, resvg-js, ${flags.pngMax}px max) ---`);
  const pngDir = join(outputDir, "assets", "png");
  let converted = 0;
  let failed = 0;
  for (const [name, relPath] of Object.entries(svgIndex)) {
    const svgPath = join(svgDir, relPath);
    const pngRelPath = relPath.replace(/\.svg$/, ".png");
    const pngPath = join(pngDir, pngRelPath);
    try {
      const svgData = readFileSync(svgPath);
      const pngData = await sharp(svgData, { density: 150 })
        .resize(flags.pngMax, flags.pngMax, { fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer();
      const dir = dirname(pngPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      await Bun.write(pngPath, pngData);
      converted++;
    } catch (e: any) {
      failed++;
      console.log(`  WARN: ${name}: ${e.message}`);
    }
  }
  console.log(`  ${converted} converted, ${failed} failed`);

  // Build PNG index (same structure as SVG index but .png extension)
  pngIndex = {};
  for (const [name, relPath] of Object.entries(svgIndex)) {
    pngIndex[name] = relPath.replace(/\.svg$/, ".png");
  }
}

// Step 2: Generate markdown (references PNG paths for AI readability)
const md = generateMarkdown(manifest, pngIndex);
const mdPath = join(outputDir, "manifest.md");
await Bun.write(mdPath, md);

// Step 3: Generate figma.json (Figma-specific pointers for agents composing in Figma)
const figmaPointers: Record<
  string,
  { key: string; id: string; fileKey: string }
> = {};
for (const c of manifest.components) {
  figmaPointers[c.name] = {
    key: c.key,
    id: c.id,
    fileKey: manifest.file.key,
  };
}
const figmaJsonPath = join(outputDir, "figma.json");
await Bun.write(figmaJsonPath, JSON.stringify(figmaPointers, null, 2));

console.log(`\n=== Complete ===`);
console.log(
  `Manifest: ${mdPath} (${md.length} chars, ${md.split("\n").length} lines)`
);
console.log(
  `  ${manifest.components.length} components, ${tokenCount} tokens`
);
console.log(`Figma pointers: ${figmaJsonPath}`);
if (pngIndex) {
  console.log(`Assets: ${Object.keys(pngIndex).length} files (SVG + PNG)`);
  console.log(`  SVG: assets/svg/ (for code use)`);
  console.log(`  PNG: assets/png/ (for AI vision)`);
}
