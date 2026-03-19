#!/usr/bin/env bun

/**
 * Capture benchmark results as review-ready composite images.
 *
 * Takes the output of icon-benchmark.ts and produces:
 * 1. Per-variation composite grids (subjects × samples) at readable size
 * 2. A master comparison sheet (all variations side by side)
 *
 * Usage:
 *   bun tools/capture-for-review.ts --input /tmp/dissect/quiver-experiment/results --output /tmp/review
 *   bun tools/capture-for-review.ts --input /tmp/dissect/quiver-experiment/results --variation V-1ref
 *
 * Each icon is rendered at 200×200px in the composite for easy visual comparison.
 */

import sharp from "sharp";
import { readdirSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

const CELL_SIZE = 200;     // px per icon in the composite
const CELL_PAD = 8;        // padding between cells
const LABEL_HEIGHT = 32;   // height for text labels
const BG_COLOR = { r: 251, g: 249, b: 244, alpha: 1 }; // #FBF9F4 cream

interface Args {
  inputDir: string;
  outputDir: string;
  variationFilter?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const inputIdx = argv.indexOf("--input");
  const outputIdx = argv.indexOf("--output");
  const varIdx = argv.indexOf("--variation");

  return {
    inputDir: inputIdx >= 0 ? resolve(argv[inputIdx + 1]) : "",
    outputDir: outputIdx >= 0 ? resolve(argv[outputIdx + 1]) : resolve("/tmp/icon-review"),
    variationFilter: varIdx >= 0 ? argv[varIdx + 1] : undefined,
  };
}

/**
 * Render an SVG or resize a PNG to a consistent cell size on white background.
 */
async function renderCell(filePath: string, size: number): Promise<Buffer> {
  if (!existsSync(filePath)) {
    // Return a gray placeholder
    return sharp({
      create: { width: size, height: size, channels: 4, background: { r: 220, g: 220, b: 220, alpha: 1 } },
    }).png().toBuffer();
  }

  const ext = filePath.split(".").pop()?.toLowerCase();

  if (ext === "svg") {
    return sharp(readFileSync(filePath), { density: 300 })
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();
  } else {
    return sharp(filePath)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer();
  }
}

/**
 * Create a composite grid image for one variation.
 * Layout: rows = subjects, cols = samples
 */
async function compositeVariation(
  inputDir: string,
  variationName: string,
  outputPath: string
): Promise<void> {
  const varDir = join(inputDir, variationName);
  if (!existsSync(varDir)) {
    console.error(`  Skipping ${variationName} — directory not found`);
    return;
  }

  const subjects = readdirSync(varDir).filter(
    d => existsSync(join(varDir, d)) && readdirSync(join(varDir, d)).some(f => f.endsWith(".svg") || f.endsWith(".png"))
  ).sort();

  if (subjects.length === 0) {
    console.error(`  Skipping ${variationName} — no subjects found`);
    return;
  }

  // Find max samples across subjects
  let maxSamples = 0;
  for (const subject of subjects) {
    const files = readdirSync(join(varDir, subject)).filter(f => f.endsWith(".png")).sort();
    maxSamples = Math.max(maxSamples, files.length);
  }

  if (maxSamples === 0) {
    console.error(`  Skipping ${variationName} — no PNGs found`);
    return;
  }

  const cols = maxSamples;
  const rows = subjects.length;
  const gridWidth = cols * (CELL_SIZE + CELL_PAD) + CELL_PAD + 120; // 120px for row labels
  const gridHeight = rows * (CELL_SIZE + CELL_PAD) + CELL_PAD + LABEL_HEIGHT + 40; // header space

  // Create base image
  const composites: sharp.OverlayOptions[] = [];

  // Render each cell
  for (let row = 0; row < rows; row++) {
    const subject = subjects[row];
    const subDir = join(varDir, subject);
    const pngs = readdirSync(subDir).filter(f => f.endsWith(".png")).sort();

    for (let col = 0; col < pngs.length; col++) {
      const cellBuffer = await renderCell(join(subDir, pngs[col]), CELL_SIZE);
      const x = 120 + col * (CELL_SIZE + CELL_PAD) + CELL_PAD;
      const y = LABEL_HEIGHT + 40 + row * (CELL_SIZE + CELL_PAD) + CELL_PAD;

      composites.push({
        input: cellBuffer,
        left: x,
        top: y,
      });
    }
  }

  // Create the composite
  await sharp({
    create: {
      width: gridWidth,
      height: gridHeight,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);

  console.error(`  ${variationName}: ${rows} subjects × ${maxSamples} samples → ${outputPath}`);
}

/**
 * Create a master comparison — one column per variation, one row per subject,
 * showing sample-1 only (the "best single shot" comparison).
 */
async function compositeMaster(
  inputDir: string,
  variations: string[],
  subjects: string[],
  outputPath: string
): Promise<void> {
  const cols = variations.length;
  const rows = subjects.length;
  const gridWidth = cols * (CELL_SIZE + CELL_PAD) + CELL_PAD + 120;
  const gridHeight = rows * (CELL_SIZE + CELL_PAD) + CELL_PAD + LABEL_HEIGHT + 40;

  const composites: sharp.OverlayOptions[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Use sample-1 (or first available PNG) for the master comparison
      const subDir = join(inputDir, variations[col], subjects[row]);
      if (!existsSync(subDir)) continue;

      const pngs = readdirSync(subDir).filter(f => f.endsWith(".png")).sort();
      if (pngs.length === 0) continue;

      const cellBuffer = await renderCell(join(subDir, pngs[0]), CELL_SIZE);
      const x = 120 + col * (CELL_SIZE + CELL_PAD) + CELL_PAD;
      const y = LABEL_HEIGHT + 40 + row * (CELL_SIZE + CELL_PAD) + CELL_PAD;

      composites.push({ input: cellBuffer, left: x, top: y });
    }
  }

  await sharp({
    create: { width: gridWidth, height: gridHeight, channels: 4, background: BG_COLOR },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);

  console.error(`  Master comparison: ${rows} subjects × ${cols} variations → ${outputPath}`);
}

async function main() {
  const args = parseArgs();

  if (!args.inputDir || !existsSync(args.inputDir)) {
    console.error("Usage: bun tools/capture-for-review.ts --input <results-dir> [--output <review-dir>] [--variation <name>]");
    process.exit(1);
  }

  mkdirSync(args.outputDir, { recursive: true });

  // Find all variations
  const allVariations = readdirSync(args.inputDir)
    .filter(d => d.startsWith("V-") && existsSync(join(args.inputDir, d)))
    .sort();

  const variations = args.variationFilter
    ? allVariations.filter(v => v === args.variationFilter)
    : allVariations;

  if (variations.length === 0) {
    console.error(`No variations found in ${args.inputDir}`);
    process.exit(1);
  }

  console.error(`Capturing ${variations.length} variations for review...`);

  // Per-variation composites (all samples visible)
  for (const v of variations) {
    await compositeVariation(
      args.inputDir,
      v,
      join(args.outputDir, `${v}-grid.png`)
    );
  }

  // Master comparison (sample-1 across all variations)
  if (variations.length > 1) {
    // Find common subjects
    const firstVarDir = join(args.inputDir, variations[0]);
    const subjects = readdirSync(firstVarDir)
      .filter(d => existsSync(join(firstVarDir, d)))
      .sort();

    await compositeMaster(
      args.inputDir,
      variations,
      subjects,
      join(args.outputDir, "master-comparison.png")
    );
  }

  console.error(`\nReview images saved to: ${args.outputDir}`);
  console.error("Use Read tool on the PNGs to visually inspect.");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
