#!/usr/bin/env bun

/**
 * AI Image Generation — multi-provider (GPT Image 1.5 + Gemini 3.1 Flash Image).
 *
 * Usage:
 *   bun plugins/gtm/skills/graphics/tools/image-generate.ts generate --prompt "..." [--provider gpt|gemini|both] [--reference ref.png] [--quality high] [--output out.png]
 *   bun plugins/gtm/skills/graphics/tools/image-generate.ts edit --prompt "..." --image input.png [--provider gpt|gemini] [--mask mask.png] [--output out.png]
 *
 * Providers:
 *   gpt    — OpenAI GPT Image 1.5. Supports transparent backgrounds, mask-based editing.
 *   gemini — Google Gemini 3.1 Flash Image. Better 3D/glass quality, native reference images, conversational editing.
 *   both   — Generate on both in parallel. Outputs two files: <name>-gpt.png + <name>-gemini.png
 *
 * Requires: OPENAI_API_KEY (for gpt/both), GOOGLE_AI_API_KEY (for gemini/both).
 * Setup: ./secrets/setup.sh --skill graphics --account inkeep.1password.com
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, parse as parsePath } from "path";

// --- Config ---
const OPENAI_BASE = "https://api.openai.com/v1";
const GPT_MODEL = "gpt-image-1.5";
const GEMINI_MODEL = "gemini-3.1-flash-image-preview";

interface ScriptResult {
  count: number;
  files: string[];
  provider?: string;
}

// --- API Keys ---
function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error(
      "Error: OPENAI_API_KEY not set.\n" +
        "  ./secrets/setup.sh --skill graphics --account inkeep.1password.com"
    );
    process.exit(1);
  }
  return key;
}

function getGeminiKey(): string {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) {
    console.error(
      "Error: GOOGLE_AI_API_KEY not set.\n" +
        "  ./secrets/setup.sh --skill graphics --account inkeep.1password.com"
    );
    process.exit(1);
  }
  return key;
}

// --- OpenAI helpers ---
async function openaiRequest(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) {
    const err = body?.error;
    throw { status: res.status, headers: res.headers, body, message: err?.message, code: err?.code };
  }
  const remaining = res.headers.get("x-ratelimit-remaining-requests");
  if (remaining !== null) console.error(`  GPT rate limit remaining: ${remaining}`);
  return body;
}

// --- Gemini helpers ---
async function geminiGenerate(prompt: string, referencePath?: string): Promise<Buffer> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: getGeminiKey() });

  const parts: any[] = [];
  if (referencePath) {
    const b64 = readFileSync(referencePath).toString("base64");
    parts.push({ inlineData: { mimeType: "image/png", data: b64 } });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts }],
    config: { responseModalities: ["IMAGE"] },
  });

  const resParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of resParts) {
    if ((part as any).inlineData) {
      return Buffer.from((part as any).inlineData.data, "base64");
    }
  }
  throw new Error("No image in Gemini response");
}

async function geminiEdit(prompt: string, imagePath: string): Promise<Buffer> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: getGeminiKey() });

  const imageB64 = readFileSync(imagePath).toString("base64");

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/png", data: imageB64 } },
        { text: prompt },
      ],
    }],
    config: { responseModalities: ["IMAGE"] },
  });

  const resParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of resParts) {
    if ((part as any).inlineData) {
      return Buffer.from((part as any).inlineData.data, "base64");
    }
  }
  throw new Error("No image in Gemini response");
}

// --- GPT generation (with optional reference via edit endpoint) ---
async function gptGenerate(args: Record<string, string>): Promise<Buffer[]> {
  const hasReference = args.reference && existsSync(resolve(args.reference));

  if (hasReference) {
    // Use edit endpoint with reference image as style guide
    const formData = new FormData();
    formData.append("model", GPT_MODEL);
    formData.append("prompt", args.prompt);
    formData.append("image", Bun.file(resolve(args.reference)));
    formData.append("quality", args.quality || "high");
    formData.append("size", args.size || "1536x1024");
    formData.append("output_format", args["output-format"] || "png");
    if (args.background) formData.append("background", args.background);

    const response = await openaiRequest(`${OPENAI_BASE}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getOpenAIKey()}` },
      body: formData,
    });
    return response.data.map((d: any) => Buffer.from(d.b64_json, "base64"));
  } else {
    // Standard generation endpoint
    const payload: Record<string, any> = {
      model: GPT_MODEL,
      prompt: args.prompt,
      quality: args.quality || "high",
      size: args.size || "auto",
      output_format: args["output-format"] || "png",
    };
    if (args.n) payload.n = parseInt(args.n, 10);
    if (args.background) payload.background = args.background;

    const response = await openaiRequest(`${OPENAI_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAIKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return response.data.map((d: any) => Buffer.from(d.b64_json, "base64"));
  }
}

// --- Write output files ---
function writeOutput(buf: Buffer, outputPath: string): string {
  writeFileSync(outputPath, buf);
  return resolve(outputPath);
}

// --- Main commands ---
async function generate(args: Record<string, string>): Promise<ScriptResult> {
  if (!args.prompt) {
    console.error("Error: --prompt is required");
    process.exit(1);
  }

  const provider = args.provider || "gpt";
  const ext = `.${args["output-format"] || "png"}`;
  const outBase = args.output || `image-output${ext}`;
  const { name, dir } = parsePath(outBase);
  const outDir = dir || ".";
  const files: string[] = [];

  if (provider === "both") {
    console.error(`Generating on GPT Image + Gemini in parallel...`);

    const [gptResult, geminiResult] = await Promise.allSettled([
      (async () => {
        const t0 = Date.now();
        console.error(`  GPT Image 1.5 (${args.quality || "high"})...`);
        const bufs = await gptGenerate(args);
        console.error(`  ✓ GPT: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        return bufs[0];
      })(),
      (async () => {
        const t0 = Date.now();
        console.error(`  Gemini 3.1 Flash Image...`);
        const buf = await geminiGenerate(args.prompt, args.reference ? resolve(args.reference) : undefined);
        console.error(`  ✓ Gemini: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        return buf;
      })(),
    ]);

    if (gptResult.status === "fulfilled") {
      const path = writeOutput(gptResult.value, `${outDir}/${name}-gpt${ext}`);
      files.push(path);
      console.error(`  GPT output: ${path}`);
    } else {
      console.error(`  ✗ GPT failed: ${(gptResult.reason as any)?.message?.slice(0, 100)}`);
    }

    if (geminiResult.status === "fulfilled") {
      const path = writeOutput(geminiResult.value, `${outDir}/${name}-gemini${ext}`);
      files.push(path);
      console.error(`  Gemini output: ${path}`);
    } else {
      console.error(`  ✗ Gemini failed: ${(geminiResult.reason as any)?.message?.slice(0, 100)}`);
    }

  } else if (provider === "gemini") {
    const t0 = Date.now();
    console.error(`Generating with Gemini 3.1 Flash Image...`);
    const buf = await geminiGenerate(args.prompt, args.reference ? resolve(args.reference) : undefined);
    const path = writeOutput(buf, outBase);
    files.push(path);
    console.error(`✓ Gemini: ${((Date.now() - t0) / 1000).toFixed(1)}s → ${path}`);

  } else {
    // Default: GPT
    const t0 = Date.now();
    const refNote = args.reference ? " (with reference image)" : "";
    console.error(`Generating with GPT Image 1.5${refNote}...`);
    const bufs = await gptGenerate(args);

    if (bufs.length === 1) {
      const path = writeOutput(bufs[0], outBase);
      files.push(path);
    } else {
      for (let i = 0; i < bufs.length; i++) {
        const path = writeOutput(bufs[i], `${outDir}/${name}-${i + 1}${ext}`);
        files.push(path);
      }
    }
    console.error(`✓ GPT: ${((Date.now() - t0) / 1000).toFixed(1)}s → ${files.join(", ")}`);
  }

  const result: ScriptResult = { count: files.length, files, provider };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function edit(args: Record<string, string>): Promise<ScriptResult> {
  if (!args.prompt) { console.error("Error: --prompt is required"); process.exit(1); }
  if (!args.image) { console.error("Error: --image is required"); process.exit(1); }

  const imagePath = resolve(args.image);
  if (!existsSync(imagePath)) { console.error(`Error: file not found: ${imagePath}`); process.exit(1); }

  const provider = args.provider || "gpt";
  const ext = `.${args["output-format"] || "png"}`;
  const outPath = args.output || `image-edit${ext}`;
  const files: string[] = [];

  if (provider === "gemini") {
    // Gemini: conversational editing via generateContent
    const t0 = Date.now();
    console.error(`Editing with Gemini (conversational)...`);
    const buf = await geminiEdit(args.prompt, imagePath);
    const path = writeOutput(buf, outPath);
    files.push(path);
    console.error(`✓ Gemini: ${((Date.now() - t0) / 1000).toFixed(1)}s → ${path}`);
  } else {
    // Default: GPT mask-based editing
    const t0 = Date.now();
    console.error(`Editing with GPT Image 1.5...`);

    const formData = new FormData();
    formData.append("model", GPT_MODEL);
    formData.append("prompt", args.prompt);
    formData.append("image", Bun.file(imagePath));
    formData.append("quality", args.quality || "high");
    formData.append("size", args.size || "auto");
    formData.append("output_format", args["output-format"] || "png");
    if (args.n) formData.append("n", args.n);
    if (args.background) formData.append("background", args.background);

    if (args.mask) {
      const maskPath = resolve(args.mask);
      if (!existsSync(maskPath)) { console.error(`Error: mask not found: ${maskPath}`); process.exit(1); }
      formData.append("mask", Bun.file(maskPath));
    }

    const response = await openaiRequest(`${OPENAI_BASE}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getOpenAIKey()}` },
      body: formData,
    });

    for (const d of response.data) {
      const path = writeOutput(Buffer.from(d.b64_json, "base64"), outPath);
      files.push(path);
    }
    console.error(`✓ GPT: ${((Date.now() - t0) / 1000).toFixed(1)}s → ${files.join(", ")}`);
  }

  const result: ScriptResult = { count: files.length, files, provider };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// --- CLI ---
function parseCliArgs(argv: string[]): { command: string; args: Record<string, string> } {
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
  const { command, args } = parseCliArgs(process.argv);

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
          "AI Image Generation — GPT Image 1.5 + Gemini 3.1 Flash Image\n\n" +
          "Usage:\n" +
          '  bun plugins/gtm/skills/graphics/tools/image-generate.ts generate --prompt "..." [--provider gpt|gemini|both] [--reference ref.png] [--quality high] [--output out.png]\n' +
          '  bun plugins/gtm/skills/graphics/tools/image-generate.ts edit --prompt "..." --image input.png [--provider gpt|gemini] [--mask mask.png] [--output out.png]\n\n' +
          "Providers:\n" +
          "  gpt    — OpenAI GPT Image 1.5 (default). Transparent backgrounds, mask editing.\n" +
          "  gemini — Google Gemini 3.1 Flash. Better 3D/glass, native references, conversational editing.\n" +
          "  both   — Parallel generation. Outputs <name>-gpt.png + <name>-gemini.png\n\n" +
          "Reference images:\n" +
          "  --reference path/to/brand-asset.png  Feed a design system asset as style anchor.\n" +
          "  GPT: sent via edit endpoint (input_fidelity: high). Gemini: sent as inlineData.\n"
        );
        process.exit(1);
    }
  } catch (err: any) {
    if (err.status === 429) {
      console.error(`Rate limited. Retry after ${err.headers?.get?.("retry-after") || "unknown"} seconds.`);
    } else if (err.status === 401) {
      console.error("Invalid API key. Check OPENAI_API_KEY / GOOGLE_AI_API_KEY.");
    } else if (err.code === "content_policy_violation") {
      console.error(`Content policy violation: ${err.message}`);
    } else if (err.status === 400) {
      console.error(`Bad request: ${err.message}`);
    } else if (err.status >= 500) {
      console.error(`Server error (${err.status}). Try again.`);
    } else {
      console.error("Error:", err.message || err);
    }
    process.exit(1);
  }
}

main();
