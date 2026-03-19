#!/usr/bin/env bun
/**
 * capture-for-review.ts
 *
 * Exports a Figma frame as two PNG screenshots for the reviewer subagent:
 *   - review.png    (1568px longest edge — full detail)
 *   - proportional.png (400px longest edge — hierarchy/weight assessment)
 *
 * Uses the Figma REST API (not the plugin runtime) so the output is saved
 * to disk as files the subagent can read via the Read tool.
 *
 * Usage:
 *   bun scripts/capture-for-review.ts \
 *     --node-id "123:456" \
 *     --file-key "S5kGTPZ0kSjmSxusJ56QJH" \
 *     --name "blog-cover-agents-in-slack"
 *
 * Output (stdout JSON):
 *   { "review": "tmp/review/<name>/review.png", "proportional": "tmp/review/<name>/proportional.png" }
 */

import { parseArgs } from "util";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "node-id": { type: "string" },
    "file-key": { type: "string" },
    name: { type: "string" },
  },
});

if (!args["node-id"] || !args["file-key"] || !args.name) {
  console.error(
    "Usage: bun scripts/capture-for-review.ts --node-id <id> --file-key <key> --name <name>"
  );
  console.error("  --node-id   Figma node ID (e.g., '123:456')");
  console.error("  --file-key  Figma file key");
  console.error("  --name      Output directory name (kebab-case)");
  process.exit(1);
}

const nodeId = args["node-id"]!;
const fileKey = args["file-key"]!;
const name = args.name!;

// Figma Personal Access Token — required for REST API
const token =
  process.env.FIGMA_PERSONAL_ACCESS_TOKEN ||
  process.env.FIGMA_ACCESS_TOKEN ||
  process.env.FIGMA_TOKEN;

if (!token) {
  console.error(
    "Error: No Figma access token found. Set FIGMA_PERSONAL_ACCESS_TOKEN, FIGMA_ACCESS_TOKEN, or FIGMA_TOKEN."
  );
  process.exit(1);
}

const outputDir = resolve(`tmp/review/${name}`);
mkdirSync(outputDir, { recursive: true });

/**
 * Get node dimensions from Figma API to compute scale factors.
 */
async function getNodeDimensions(): Promise<{
  width: number;
  height: number;
}> {
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;
  const resp = await fetch(url, {
    headers: { "X-Figma-Token": token! },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Figma API error (${resp.status}): ${text}`);
  }

  const data = (await resp.json()) as any;
  const node = data.nodes?.[nodeId]?.document;

  if (!node) {
    throw new Error(
      `Node ${nodeId} not found in file ${fileKey}. Check node ID and file key.`
    );
  }

  const bbox = node.absoluteBoundingBox || node.size;
  if (!bbox) {
    throw new Error(
      `Node ${nodeId} has no bounding box. It may be invisible or a non-renderable node.`
    );
  }

  return { width: bbox.width, height: bbox.height };
}

/**
 * Export a node as PNG at a given scale factor.
 */
async function exportNode(scale: number): Promise<Buffer> {
  // Step 1: Request the image URL
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&scale=${scale}&format=png`;
  const resp = await fetch(url, {
    headers: { "X-Figma-Token": token! },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Figma image export error (${resp.status}): ${text}`);
  }

  const data = (await resp.json()) as any;
  const imageUrl = data.images?.[nodeId];

  if (!imageUrl) {
    throw new Error(
      `No image URL returned for node ${nodeId}. The node may not be renderable.`
    );
  }

  // Step 2: Download the PNG
  const imageResp = await fetch(imageUrl);
  if (!imageResp.ok) {
    throw new Error(
      `Failed to download image (${imageResp.status}): ${imageResp.statusText}`
    );
  }

  return Buffer.from(await imageResp.arrayBuffer());
}

async function main() {
  console.error(`Capturing review screenshots for "${name}"...`);
  console.error(`  Node: ${nodeId}, File: ${fileKey}`);

  // Get node dimensions to compute scale factors
  const { width, height } = await getNodeDimensions();
  const longestEdge = Math.max(width, height);
  console.error(`  Dimensions: ${width}×${height} (longest edge: ${longestEdge}px)`);

  // Compute scale factors
  // review.png: longest edge at 1568px
  const reviewScale = Math.min(1568 / longestEdge, 4); // Figma max scale is 4
  // proportional.png: longest edge at 400px
  const proportionalScale = Math.min(400 / longestEdge, 4);

  console.error(
    `  Review scale: ${reviewScale.toFixed(3)} → ~${Math.round(longestEdge * reviewScale)}px`
  );
  console.error(
    `  Proportional scale: ${proportionalScale.toFixed(3)} → ~${Math.round(longestEdge * proportionalScale)}px`
  );

  // Export both in parallel
  const [reviewBuf, proportionalBuf] = await Promise.all([
    exportNode(reviewScale),
    exportNode(proportionalScale),
  ]);

  // Save to disk
  const reviewPath = join(outputDir, "review.png");
  const proportionalPath = join(outputDir, "proportional.png");

  writeFileSync(reviewPath, reviewBuf);
  writeFileSync(proportionalPath, proportionalBuf);

  console.error(`  Saved: ${reviewPath} (${(reviewBuf.length / 1024).toFixed(0)} KB)`);
  console.error(`  Saved: ${proportionalPath} (${(proportionalBuf.length / 1024).toFixed(0)} KB)`);

  // Output JSON to stdout (for the builder to parse)
  const result = {
    review: reviewPath,
    proportional: proportionalPath,
  };

  console.log(JSON.stringify(result));
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
