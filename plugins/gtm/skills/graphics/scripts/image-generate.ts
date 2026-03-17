#!/usr/bin/env bun

/**
 * OpenAI GPT Image 1.5 — raster image generation and editing.
 *
 * Usage:
 *   bun scripts/image-generate.ts generate --prompt "..." [--quality high] [--size 1536x1024] [--n 2] [--output out.png]
 *   bun scripts/image-generate.ts edit --prompt "..." --image input.png [--mask mask.png] [--output out.png]
 *
 * Requires: OPENAI_API_KEY environment variable.
 * Docs: https://platform.openai.com/docs/guides/image-generation
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, parse as parsePath } from "path";

const API_BASE = "https://api.openai.com/v1";
const MODEL = "gpt-image-1.5";

interface ScriptResult {
  count: number;
  files: string[];
}

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error(
      "Error: OPENAI_API_KEY environment variable is not set.\n" +
        "Pull it from 1Password:\n" +
        "  ./secrets/setup.sh --skill graphics --account inkeep.1password.com\n" +
        "Or get a key at https://platform.openai.com/api-keys"
    );
    process.exit(1);
  }
  return key;
}

async function apiRequest(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const body = await res.json();

  if (!res.ok) {
    const err = body?.error;
    throw { status: res.status, headers: res.headers, body, message: err?.message, code: err?.code };
  }

  // Log rate limit info
  const remaining = res.headers.get("x-ratelimit-remaining-requests");
  if (remaining !== null) {
    console.error(`Rate limit remaining: ${remaining}`);
  }

  return body;
}

async function generate(args: Record<string, string>): Promise<ScriptResult> {
  if (!args.prompt) {
    console.error("Error: --prompt is required for generate");
    process.exit(1);
  }

  const payload: Record<string, any> = {
    model: MODEL,
    prompt: args.prompt,
    quality: args.quality || "high",
    size: args.size || "auto",
    output_format: args["output-format"] || "png",
  };

  if (args.n) payload.n = parseInt(args.n, 10);
  if (args.background) payload.background = args.background;

  console.error(
    `Generating image with model ${MODEL} (quality: ${payload.quality}, size: ${payload.size})...`
  );

  const response = await apiRequest(`${API_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return writeImages(response.data, args.output, payload.output_format);
}

async function edit(args: Record<string, string>): Promise<ScriptResult> {
  if (!args.prompt) {
    console.error("Error: --prompt is required for edit");
    process.exit(1);
  }
  if (!args.image) {
    console.error("Error: --image is required for edit");
    process.exit(1);
  }

  const imagePath = resolve(args.image);
  if (!existsSync(imagePath)) {
    console.error(`Error: image file not found: ${imagePath}`);
    process.exit(1);
  }

  const formData = new FormData();
  formData.append("model", MODEL);
  formData.append("prompt", args.prompt);
  formData.append("image", Bun.file(imagePath));
  formData.append("quality", args.quality || "high");
  formData.append("size", args.size || "auto");
  formData.append("output_format", args["output-format"] || "png");

  if (args.n) formData.append("n", args.n);
  if (args.background) formData.append("background", args.background);

  if (args.mask) {
    const maskPath = resolve(args.mask);
    if (!existsSync(maskPath)) {
      console.error(`Error: mask file not found: ${maskPath}`);
      process.exit(1);
    }
    formData.append("mask", Bun.file(maskPath));
  }

  console.error(
    `Editing image with model ${MODEL} (quality: ${args.quality || "high"}, size: ${args.size || "auto"})...`
  );

  // Do NOT set Content-Type manually — fetch sets the multipart boundary automatically
  const response = await apiRequest(`${API_BASE}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: formData,
  });

  return writeImages(response.data, args.output, args["output-format"] || "png");
}

function writeImages(
  data: Array<{ b64_json?: string }>,
  outputArg: string | undefined,
  format: string
): ScriptResult {
  if (!data || data.length === 0) {
    console.error("No images returned.");
    process.exit(1);
  }

  const ext = `.${format}`;
  const files: string[] = [];

  if (data.length === 1) {
    const outPath = outputArg || `image-output${ext}`;
    const buf = Buffer.from(data[0].b64_json!, "base64");
    writeFileSync(outPath, buf);
    files.push(resolve(outPath));
  } else {
    const base = outputArg ? parsePath(outputArg).name : "image-output";
    const dir = outputArg ? parsePath(outputArg).dir || "." : ".";
    for (let i = 0; i < data.length; i++) {
      const outPath = `${dir}/${base}-${i + 1}${ext}`;
      const buf = Buffer.from(data[i].b64_json!, "base64");
      writeFileSync(outPath, buf);
      files.push(resolve(outPath));
    }
  }

  const result: ScriptResult = { count: files.length, files };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function parseArgs(argv: string[]): { command: string; args: Record<string, string> } {
  const args: Record<string, string> = {};
  const command = argv[2];
  for (let i = 3; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] || "";
      i++;
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
      case "edit":
        await edit(args);
        break;
      default:
        console.error(
          "Usage:\n" +
            '  bun scripts/image-generate.ts generate --prompt "..." [--quality high] [--size 1536x1024] [--n 2] [--output out.png]\n' +
            '  bun scripts/image-generate.ts edit --prompt "..." --image input.png [--mask mask.png] [--output out.png]\n'
        );
        process.exit(1);
    }
  } catch (err: any) {
    if (err.status === 429) {
      const retryAfter = err.headers?.get?.("retry-after") || "unknown";
      console.error(`Rate limited. Retry after ${retryAfter} seconds.`);
    } else if (err.status === 401) {
      console.error("Invalid API key. Check OPENAI_API_KEY.");
    } else if (err.status === 402) {
      console.error("Billing error. Check your OpenAI account.");
    } else if (err.code === "content_policy_violation") {
      console.error(`Content policy violation: ${err.message}`);
    } else if (err.status === 400) {
      console.error(`Bad request: ${err.message}`);
    } else if (err.status >= 500) {
      console.error(`OpenAI server error (${err.status}). Try again.`);
    } else {
      console.error("Error:", err.message || err);
    }
    process.exit(1);
  }
}

main();
