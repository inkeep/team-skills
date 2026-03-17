#!/usr/bin/env bun

/**
 * Quiver.ai SVG generation script.
 *
 * Usage:
 *   bun tools/quiver-generate.ts generate --prompt "A logo for ..." [--instructions "..."] [--references img1.png,img2.png] [--n 2] [--temperature 0.5] [--presence-penalty 0.5] [--output out.svg]
 *   bun tools/quiver-generate.ts vectorize --image input.png [--auto-crop] [--target-size 512] [--output out.svg]
 *
 * Auto-generates PNG previews alongside SVGs (requires `sharp` module).
 * The agent can then use the Read tool on the PNG to visually inspect the result.
 *
 * Requires: QUIVERAI_API_KEY environment variable.
 * Docs: https://docs.quiver.ai/api-reference/introduction
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, parse as parsePath, extname } from "path";

const API_BASE = "https://api.quiver.ai";
const MODEL = "arrow-preview";

interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

interface ScriptResult {
  count: number;
  files: string[];
  previews: string[];
}

function getApiKey(): string {
  const key = process.env.QUIVERAI_API_KEY;
  if (!key) {
    console.error(
      "Error: QUIVERAI_API_KEY environment variable is not set.\n" +
        "Get an API key at https://quiver.ai → Settings → Developers → API Keys"
    );
    process.exit(1);
  }
  return key;
}

async function request(method: string, urlPath: string, body?: object): Promise<ApiResponse> {
  const url = new URL(urlPath, API_BASE);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (res.status >= 400) {
    throw {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: json,
    };
  }

  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body: json,
  };
}

function imageToBase64(filePath: string): string {
  const abs = resolve(filePath);
  if (!existsSync(abs)) {
    console.error(`Error: file not found: ${abs}`);
    process.exit(1);
  }
  const buf = readFileSync(abs);
  const ext = extname(abs).toLowerCase().replace(".", "");
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : ext === "svg"
            ? "image/svg+xml"
            : "application/octet-stream";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * Convert an SVG file to PNG using sharp.
 * Returns the PNG path on success, null on failure (non-fatal).
 */
async function svgToPng(svgPath: string): Promise<string | null> {
  try {
    const sharp = (await import("sharp")).default;
    const pngPath = svgPath.replace(/\.svg$/i, ".png");
    await sharp(svgPath, { density: 144 }) // 2x density for crisp preview
      .png()
      .toFile(pngPath);
    return pngPath;
  } catch (err: any) {
    console.error(
      `Warning: PNG preview generation failed for ${svgPath}: ${err.message}`
    );
    console.error("  Install sharp for PNG previews: bun add sharp");
    return null;
  }
}

async function generate(args: Record<string, string>): Promise<ScriptResult> {
  if (!args.prompt) {
    console.error("Error: --prompt is required for generate");
    process.exit(1);
  }

  const body: Record<string, any> = {
    model: MODEL,
    prompt: args.prompt,
  };

  if (args.instructions) body.instructions = args.instructions;
  if (args.n) body.n = parseInt(args.n, 10);
  if (args.temperature) body.temperature = parseFloat(args.temperature);
  if (args["presence-penalty"]) body.presence_penalty = parseFloat(args["presence-penalty"]);

  if (args.references) {
    const refs = args.references.split(",").map((r) => r.trim());
    if (refs.length > 4) {
      console.error("Error: maximum 4 reference images allowed");
      process.exit(1);
    }
    body.references = refs.map((r) => {
      if (r.startsWith("http://") || r.startsWith("https://")) return r;
      return imageToBase64(r);
    });
  }

  console.error(`Generating SVG with model ${MODEL}...`);
  const res = await request("POST", "/v1/svgs/generations", body);

  const remaining = res.headers["x-ratelimit-remaining"];
  if (remaining !== undefined) {
    console.error(`Rate limit remaining: ${remaining}`);
  }

  const svgs = extractSvgs(res.body);
  return writeSvgs(svgs, args.output);
}

async function vectorize(args: Record<string, string>): Promise<ScriptResult> {
  if (!args.image) {
    console.error("Error: --image is required for vectorize");
    process.exit(1);
  }

  const image = args.image.startsWith("http")
    ? args.image
    : imageToBase64(args.image);

  const vectorizeBody: Record<string, any> = {
    model: MODEL,
    image,
  };

  if (args["auto-crop"] !== undefined) vectorizeBody.auto_crop = true;
  if (args["target-size"]) vectorizeBody.target_size = parseInt(args["target-size"], 10);

  console.error(`Vectorizing image with model ${MODEL}...`);
  const res = await request("POST", "/v1/svgs/vectorizations", vectorizeBody);

  const svgs = extractSvgs(res.body);
  return writeSvgs(svgs, args.output);
}

function extractSvgs(responseBody: any): string[] {
  if (responseBody.choices) {
    return responseBody.choices.map((c: any) => c.svg || c.content || c.message?.content || "");
  }
  if (responseBody.data) {
    return responseBody.data.map((d: any) => d.svg || d.content || "");
  }
  const raw = typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);
  if (raw.includes("<svg")) return [raw];
  console.error("Warning: unexpected response format. Raw response:");
  console.error(JSON.stringify(responseBody, null, 2));
  return [];
}

async function writeSvgs(svgs: string[], outputArg?: string): Promise<ScriptResult> {
  if (svgs.length === 0) {
    console.error("No SVGs returned.");
    process.exit(1);
  }

  const svgPaths: string[] = [];
  const pngPaths: string[] = [];

  if (svgs.length === 1) {
    const outPath = outputArg || "quiver-output.svg";
    writeFileSync(outPath, svgs[0]);
    svgPaths.push(resolve(outPath));
  } else {
    const base = outputArg ? parsePath(outputArg).name : "quiver-output";
    const ext = outputArg ? parsePath(outputArg).ext || ".svg" : ".svg";
    for (let i = 0; i < svgs.length; i++) {
      const outPath = `${base}-${i + 1}${ext}`;
      writeFileSync(outPath, svgs[i]);
      svgPaths.push(resolve(outPath));
    }
  }

  // Auto-generate PNG previews for visual inspection
  for (const svgPath of svgPaths) {
    const pngPath = await svgToPng(svgPath);
    if (pngPath) {
      pngPaths.push(resolve(pngPath));
    }
  }

  const result: ScriptResult = {
    count: svgPaths.length,
    files: svgPaths,
    previews: pngPaths,
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

const BOOLEAN_FLAGS = new Set(["auto-crop"]);

function parseArgs(argv: string[]): { command: string; args: Record<string, string> } {
  const args: Record<string, string> = {};
  const command = argv[2];
  for (let i = 3; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      if (BOOLEAN_FLAGS.has(key)) {
        args[key] = "true";
      } else {
        args[key] = argv[i + 1] || "";
        i++;
      }
    }
  }
  return { command, args };
}

async function main() {
  const { command, args } = parseArgs(process.argv);

  try {
    switch (command) {
      case "generate":
        await generate(args);
        break;
      case "vectorize":
        await vectorize(args);
        break;
      default:
        console.error(
          "Usage:\n" +
            '  bun tools/quiver-generate.ts generate --prompt "..." [--instructions "..."] [--references img1.png,img2.png] [--n 2] [--temperature 0.5] [--presence-penalty 0.5] [--output out.svg]\n' +
            "  bun tools/quiver-generate.ts vectorize --image input.png [--auto-crop] [--target-size 512] [--output out.svg]\n"
        );
        process.exit(1);
    }
  } catch (err: any) {
    if (err.status === 429) {
      const retryAfter = err.headers?.["retry-after"] || "unknown";
      console.error(`Rate limited. Retry after ${retryAfter} seconds.`);
    } else if (err.status === 402) {
      console.error("Insufficient credits. Check your Quiver.ai account.");
    } else if (err.status === 401) {
      console.error("Invalid API key. Check QUIVERAI_API_KEY.");
    } else if (err.status) {
      console.error(`API error ${err.status}:`, JSON.stringify(err.body, null, 2));
    } else {
      console.error("Error:", err.message || err);
    }
    process.exit(1);
  }
}

main();
