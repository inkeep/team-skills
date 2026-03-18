#!/usr/bin/env npx tsx
/**
 * Remotion Visual Verification Script
 *
 * Renders key frames from a Remotion composition, runs programmatic checks (Layer 1),
 * and optionally evaluates animation flow via Gemini (Layer 3).
 *
 * Layer 2 (brand compliance) is handled by Claude Code reading the rendered PNGs directly.
 *
 * Usage:
 *   npx tsx <path-to-skill>/scripts/verify-composition.ts \
 *     --composition HeadlineReveal \
 *     --frames 0,30,60 \
 *     --layers 1 \
 *     --cwd remotion-videos/
 */

import { parseArgs } from "node:util";
import { existsSync, mkdirSync, writeFileSync, appendFileSync, readFileSync } from "node:fs";
import path from "node:path";

// Brand colors from styles/brand.ts
const BRAND_COLORS: Record<string, string> = {
  primary: "#3784ff",
  primaryLight: "#69a3ff",
  primaryLighter: "#d5e5ff",
  primaryDark: "#29325c",
  background: "#fbf9f4",
  text: "#231f20",
  surface: "#f7f4ed",
  surfaceAlt: "#fff5e1",
  accent: "#e1dbff",
  secondary: "#d0e1ff",
  orange: "#fbe1bc",
  muted: "#5f5c62",
  grayMedium: "#bdbdbd",
  white: "#ffffff",
};

// Valid background colors
const VALID_BACKGROUNDS = new Set(["#fbf9f4", "#f7f4ed", "#fff5e1", "#ffffff"]);

// Color distance (simple euclidean in RGB space)
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function closestBrandColor(hex: string): string {
  let closest = "";
  let minDist = Infinity;
  for (const [name, brandHex] of Object.entries(BRAND_COLORS)) {
    const dist = colorDistance(hex, brandHex);
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  }
  return closest;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

// Parse CLI args
const { values: args } = parseArgs({
  options: {
    composition: { type: "string" },
    frames: { type: "string" },
    layers: { type: "string", default: "1" },
    output: { type: "string", default: "tmp/verification-result.json" },
    cwd: { type: "string", default: "remotion-videos/" },
    props: { type: "string", default: "{}" },
    "flow-model": { type: "string", default: "pro" },
    "save-frames": { type: "string", default: "true" },
    bundle: { type: "string" },
  },
});

if (!args.composition) {
  console.error("Error: --composition is required");
  process.exit(1);
}

const compositionId = args.composition;
const requestedLayers = (args.layers || "1").split(",").map(Number);
const outputPath = args.output || "tmp/verification-result.json";
const projectDir = path.resolve(args.cwd || "remotion-videos/");
const inputProps = JSON.parse(args.props || "{}");
const flowModel = args["flow-model"] || "pro";
const saveFrames = args["save-frames"] !== "false";
const startTime = Date.now();

// Resolve frame numbers (will be set after composition metadata is loaded)
let frameNumbers: number[] = [];

async function main() {
  console.log(`Verifying composition: ${compositionId}`);
  console.log(`Project directory: ${projectDir}`);
  console.log(`Layers: ${requestedLayers.join(", ")}`);

  // Ensure output directories exist
  const outputDir = path.dirname(path.resolve(projectDir, outputPath));
  mkdirSync(outputDir, { recursive: true });

  if (saveFrames) {
    mkdirSync(path.resolve(projectDir, `tmp/frames/${compositionId}`), { recursive: true });
  }

  // Change to project directory BEFORE importing — modules resolve from cwd
  const originalCwd = process.cwd();
  process.chdir(projectDir);

  // Dynamic imports (these need the remotion-videos node_modules)
  let bundleFn: any;
  let selectCompositionFn: any;
  let renderStillFn: any;
  let renderMediaFn: any;

  try {
    // Use createRequire to resolve from projectDir's node_modules
    const { createRequire } = await import("node:module");
    const require = createRequire(path.resolve(projectDir, "package.json"));
    const bundler = require("@remotion/bundler");
    bundleFn = bundler.bundle;
    const renderer = require("@remotion/renderer");
    selectCompositionFn = renderer.selectComposition;
    renderStillFn = renderer.renderStill;
    renderMediaFn = renderer.renderMedia;
  } catch (e: any) {
    console.error("Error: Could not import @remotion/bundler or @remotion/renderer.");
    console.error(`Details: ${e.message}`);
    console.error("Make sure these are installed in the remotion-videos project.");
    process.exit(1);
  }

  // Try to import sharp (optional)
  let sharpFn: ((input: Buffer | string) => any) | null = null;
  try {
    const { createRequire: cr } = await import("node:module");
    const req = cr(path.resolve(projectDir, "package.json"));
    sharpFn = req("sharp");
  } catch {
    console.warn("Warning: sharp not available. Skipping color sampling.");
  }

  // Bundle the project
  console.log("Bundling Remotion project...");
  const bundleLocation = args.bundle || await bundleFn({
    entryPoint: path.resolve(projectDir, "src/index.ts"),
    onProgress: (progress: number) => {
      if (progress % 25 === 0) console.log(`  Bundle progress: ${progress}%`);
    },
  });

  // Select composition
  let composition: any;
  try {
    composition = await selectCompositionFn({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });
  } catch (e: any) {
    // Try to list available compositions
    console.error(`Error: Composition "${compositionId}" not found.`);
    console.error("Available compositions can be found in src/Root.tsx");
    process.exit(1);
  }

  console.log(`Composition: ${composition.id} (${composition.width}x${composition.height}, ${composition.durationInFrames} frames at ${composition.fps}fps)`);

  // Resolve frame numbers
  if (args.frames) {
    frameNumbers = args.frames.split(",").map(Number);
  } else {
    // Heuristic: first, 25%, 50%, 75%, last
    const dur = composition.durationInFrames;
    frameNumbers = [
      0,
      Math.floor(dur * 0.25),
      Math.floor(dur * 0.5),
      Math.floor(dur * 0.75),
      dur - 1,
    ];
  }

  console.log(`Frames to verify: ${frameNumbers.join(", ")}`);

  // ========== LAYER 1: Programmatic Checks ==========
  const layer1Result: any = { ran: true, passed: true, frames: [] };

  if (requestedLayers.includes(1)) {
    console.log("\n--- Layer 1: Programmatic Checks ---");

    for (const frameNum of frameNumbers) {
      console.log(`  Rendering frame ${frameNum}...`);

      const framePath = path.resolve(projectDir, `tmp/frames/${compositionId}/frame-${frameNum}.png`);

      try {
        await renderStillFn({
          composition,
          serveUrl: bundleLocation,
          output: framePath,
          frame: frameNum,
        });
      } catch (e: any) {
        console.error(`  Error rendering frame ${frameNum}: ${e.message}`);
        layer1Result.passed = false;
        layer1Result.frames.push({
          frame: frameNum,
          error: e.message,
          dimensions: { width: 0, height: 0, matches: false },
          colorSamples: [],
        });
        continue;
      }

      // Dimension check
      const frameData: any = {
        frame: frameNum,
        dimensions: {
          width: composition.width,
          height: composition.height,
          matches: true, // renderStill uses composition dimensions
        },
        colorSamples: [],
      };

      // Color sampling with sharp
      if (sharpFn) {
        try {
          const image = sharpFn(readFileSync(framePath));
          const metadata = await image.metadata();
          const { width = 0, height = 0 } = metadata;

          // Check actual dimensions vs expected
          frameData.dimensions.width = width;
          frameData.dimensions.height = height;
          frameData.dimensions.matches =
            width === composition.width && height === composition.height;

          if (!frameData.dimensions.matches) {
            layer1Result.passed = false;
          }

          // Sample 5 positions
          const positions = [
            { name: "top-left", x: 5, y: 5 },
            { name: "top-right", x: width - 5, y: 5 },
            { name: "center", x: Math.floor(width / 2), y: Math.floor(height / 2) },
            { name: "bottom-left", x: 5, y: height - 5 },
            { name: "bottom-right", x: width - 5, y: height - 5 },
          ];

          for (const pos of positions) {
            const pixel = await sharpFn(readFileSync(framePath))
              .extract({ left: pos.x, top: pos.y, width: 1, height: 1 })
              .raw()
              .toBuffer();

            const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
            const closest = closestBrandColor(hex);
            const matchesBrand = colorDistance(hex, BRAND_COLORS[closest]) < 30; // threshold

            frameData.colorSamples.push({
              position: pos.name,
              hex,
              matchesBrand,
              closestBrandColor: closest,
            });
          }
        } catch (e: any) {
          console.warn(`  Warning: Color sampling failed for frame ${frameNum}: ${e.message}`);
        }
      }

      layer1Result.frames.push(frameData);
      console.log(`  Frame ${frameNum}: dimensions ${frameData.dimensions.matches ? "OK" : "MISMATCH"}, ${frameData.colorSamples.length} color samples`);
    }
  }

  // ========== LAYER 3: Gemini Flow Evaluation ==========
  let layer3Result: any = null;

  if (requestedLayers.includes(3)) {
    console.log("\n--- Layer 3: Gemini Flow Evaluation ---");

    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.warn("  Warning: GOOGLE_AI_API_KEY not set. Skipping Layer 3.");
      layer3Result = { ran: false, passed: false, model: "", issues: [], warning: "GOOGLE_AI_API_KEY not set" };
    } else {
      try {
        const { createRequire: cr2 } = await import("node:module");
        const req2 = cr2(path.resolve(projectDir, "package.json"));
        const { GoogleGenerativeAI } = req2("@google/generative-ai");

        // Render low-res preview video
        const videoPath = path.resolve(projectDir, `tmp/frames/${compositionId}/preview.mp4`);
        console.log("  Rendering preview video (480p, 15fps)...");

        await renderMediaFn({
          composition,
          serveUrl: bundleLocation,
          codec: "h264",
          outputLocation: videoPath,
          scale: 480 / composition.height,
          everyNthFrame: Math.round(composition.fps / 15),
        });

        // Load flow evaluation prompt
        const promptPath = path.resolve(
          path.dirname(new URL(import.meta.url).pathname),
          "../prompts/motion-flow-evaluation.md"
        );
        let flowPrompt = "Evaluate this video for animation quality, timing, transitions, and pacing.";
        if (existsSync(promptPath)) {
          flowPrompt = readFileSync(promptPath, "utf-8");
        } else {
          console.warn("  Warning: motion-flow-evaluation.md not found, using default prompt.");
        }

        // Build composition context for the prompt
        const compositionContext = [
          `Composition: ${compositionId}`,
          `Dimensions: ${composition.width}x${composition.height}`,
          `Duration: ${composition.durationInFrames} frames at ${composition.fps}fps (${(composition.durationInFrames / composition.fps).toFixed(1)}s)`,
          `Format: ${composition.width === composition.height ? "Square (LinkedIn/Instagram)" : composition.width > composition.height ? "Landscape (YouTube/website)" : "Portrait (Stories/TikTok)"}`,
        ].join("\n");

        // Build Layer 1 context summary for the prompt
        const layer1Context = layer1Result.ran
          ? [
              `Frames rendered: ${layer1Result.frames.length}`,
              `Dimensions: ${layer1Result.frames.every((f: any) => f.dimensions?.matches) ? "All correct" : "MISMATCHES FOUND"}`,
              `Color sampling: ${layer1Result.frames.map((f: any) => {
                const nonBrand = f.colorSamples?.filter((s: any) => !s.matchesBrand) || [];
                return nonBrand.length > 0
                  ? `Frame ${f.frame}: ${nonBrand.length} non-brand color(s) at ${nonBrand.map((s: any) => s.position).join(", ")}`
                  : `Frame ${f.frame}: all brand colors`;
              }).join("; ")}`,
            ].join("\n")
          : "Layer 1 was not run.";

        // Inject context into the prompt
        flowPrompt = flowPrompt
          .replace("{{COMPOSITION_CONTEXT}}", compositionContext)
          .replace("{{LAYER1_CONTEXT}}", layer1Context);

        const videoBuffer = readFileSync(videoPath);
        const modelId = flowModel === "flash" ? "gemini-2.5-flash" : "gemini-2.5-pro";
        console.log(`  Sending to Gemini ${modelId}...`);

        // Use @google/generative-ai directly (not Vercel AI SDK) to avoid CJS/ESM issues
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelId });

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: "video/mp4",
              data: videoBuffer.toString("base64"),
            },
          },
          { text: flowPrompt },
        ]);

        const responseText = result.response.text();

        // Parse scores from markdown response using SCORE: prefix lines
        const dimensions = ["timing", "transitions", "easing", "choreography", "pacing"];
        const scores: Record<string, number> = {};

        for (const dim of dimensions) {
          // Match "### Timing" section followed by "SCORE: N"
          const sectionRegex = new RegExp(`###\\s*${dim}[\\s\\S]*?SCORE:\\s*(\\d+)`, "i");
          const match = responseText.match(sectionRegex);
          if (match) {
            scores[dim] = parseInt(match[1], 10);
          }
        }

        // Extract OVERALL_SCORE and PASSED from the end of the response
        const overallMatch = responseText.match(/OVERALL_SCORE:\s*([\d.]+)/i);
        const passedMatch = responseText.match(/PASSED:\s*(true|false)/i);
        const overallScore = overallMatch ? parseFloat(overallMatch[1]) : 0;
        const explicitPassed = passedMatch ? passedMatch[1] === "true" : null;

        // Determine pass/fail: use explicit if present, otherwise compute from scores
        const dimensionScores = Object.values(scores);
        const anyBelowThreshold = dimensionScores.some((s: number) => s < 4);
        const computedPassed = overallScore >= 6.0 && !anyBelowThreshold;
        const passed = explicitPassed ?? computedPassed;

        layer3Result = {
          ran: true,
          passed,
          model: modelId,
          scores,
          overall_score: overallScore,
          evaluation: responseText,
        };

        console.log(`  Flow evaluation: ${passed ? "PASSED" : "ISSUES FOUND"} (score: ${overallScore}/10)`);
        for (const [dim, score] of Object.entries(scores)) {
          console.log(`    ${dim}: ${score}/10`);
        }
      } catch (e: any) {
        console.error(`  Error in Layer 3: ${e.message}`);
        layer3Result = { ran: true, passed: false, model: flowModel, issues: [], error: e.message };
      }
    }
  }

  // ========== Build Result ==========
  const durationMs = Date.now() - startTime;

  const result = {
    compositionId,
    timestamp: new Date().toISOString(),
    durationMs,
    layers: {
      programmatic: layer1Result,
      visual: null, // Layer 2 is handled by Claude Code reading PNGs directly
      flow: layer3Result,
    },
    overall: {
      passed: layer1Result.passed && (layer3Result === null || !layer3Result.ran || layer3Result.passed),
      summary: buildSummary(layer1Result, layer3Result),
      layersRan: requestedLayers,
      layersPassed: [
        ...(layer1Result.passed ? [1] : []),
        ...(layer3Result?.passed ? [3] : []),
      ],
    },
    framePaths: saveFrames
      ? frameNumbers.map((f) => `tmp/frames/${compositionId}/frame-${f}.png`)
      : [],
  };

  // Write result
  const resultPath = path.resolve(projectDir, outputPath);
  writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(`\nResult written to: ${resultPath}`);

  // Append to history log
  const historyPath = path.resolve(projectDir, "tmp/verification-history.jsonl");
  const historyLine = JSON.stringify({
    ts: result.timestamp,
    comp: compositionId,
    layers: requestedLayers,
    passed: result.overall.passed,
    issues: (layer3Result?.issues?.length ?? 0) + layer1Result.frames.filter((f: any) => !f.dimensions.matches).length,
    durationMs,
  });
  appendFileSync(historyPath, historyLine + "\n");

  // Print summary
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Overall: ${result.overall.passed ? "PASSED" : "ISSUES FOUND"}`);
  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s`);
  console.log(result.overall.summary);

  if (saveFrames && frameNumbers.length > 0) {
    console.log(`\nRendered frames saved to:`);
    for (const fp of result.framePaths) {
      console.log(`  ${fp}`);
    }
    console.log(`\nClaude Code: Read these PNGs via the Read tool for Layer 2 brand evaluation.`);
  }

  process.chdir(originalCwd);
  process.exit(result.overall.passed ? 0 : 1);
}

function buildSummary(layer1: any, layer3: any): string {
  const parts: string[] = [];

  const dimIssues = layer1.frames.filter((f: any) => !f.dimensions?.matches);
  if (dimIssues.length > 0) {
    parts.push(`Layer 1: ${dimIssues.length} frame(s) with dimension mismatches`);
  } else if (layer1.ran) {
    parts.push(`Layer 1: All ${layer1.frames.length} frames passed programmatic checks`);
  }

  if (layer3) {
    if (!layer3.ran) {
      parts.push(`Layer 3: Skipped (${layer3.warning || "not requested"})`);
    } else if (layer3.passed) {
      parts.push(`Layer 3: Flow evaluation passed`);
    } else {
      parts.push(`Layer 3: ${layer3.issues?.length || 0} flow issue(s) found`);
    }
  }

  return parts.join(". ");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
