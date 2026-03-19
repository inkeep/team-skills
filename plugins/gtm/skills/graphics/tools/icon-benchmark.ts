#!/usr/bin/env bun

/**
 * Icon Generation Benchmark
 *
 * A reusable test harness for evaluating Quiver icon generation quality
 * across different prompting strategies, reference image configurations,
 * and model versions. Designed for scientific comparison.
 *
 * ## Purpose
 *
 * When Quiver releases new models, or when we want to tune our prompting
 * strategy, this script generates a controlled set of icons across
 * multiple variables and produces a comparison grid for human evaluation.
 *
 * ## Scientific Method
 *
 * The experiment controls for random variation by generating N samples
 * per condition (default: 3). Variables are tested independently —
 * each variation changes ONE thing from the baseline so we can attribute
 * differences to that variable.
 *
 * ### Independent variables (what we change):
 * - Number of reference images (0, 1, 2, 4)
 * - Reference diversity (same category vs cross-category)
 * - Instruction detail level (full, minimal, match-reinforced)
 * - Subject matter difficulty (concrete object, product concept, abstract)
 *
 * ### Controlled variables (held constant):
 * - Temperature: 0.4 (with refs) / 0.5 (without refs)
 * - Presence penalty: -0.5
 * - Model: arrow-preview
 * - ViewBox: 40x40 (specified in instructions)
 * - Color palette: dark mode (#231F20 + #3784FF + #F9F9F9)
 *
 * ### Dependent variables (what we measure — via human evaluation):
 * - Brush texture fidelity (does it look hand-drawn like Inkeep icons?)
 * - Color compliance (correct palette, blue accent present?)
 * - Concept clarity (is the subject recognizable?)
 * - Cross-sample consistency (do the 3 samples look like a set?)
 * - Comparison to existing icons (would it blend with the real icon set?)
 *
 * ## Rate Limit Handling
 *
 * Quiver API: 20 requests per 60 seconds per org.
 * The API supports `n` parameter (1-16) to request multiple variants per call.
 * With n=3 (3 samples), each variation = 5 calls (one per subject).
 * All 5 subjects run in parallel per variation — well within the 20/60s limit.
 * Total for 6 variations: 30 API calls (vs 90 if requesting 1 sample per call).
 *
 * ## Usage
 *
 *   # Run full benchmark (all variations)
 *   bun tools/icon-benchmark.ts --output /tmp/benchmark-results
 *
 *   # Run specific variation only
 *   bun tools/icon-benchmark.ts --variation V-1ref --output /tmp/benchmark-results
 *
 *   # Change samples per condition
 *   bun tools/icon-benchmark.ts --samples 5 --output /tmp/benchmark-results
 *
 *   # List available variations
 *   bun tools/icon-benchmark.ts --list
 *
 * ## Output Structure
 *
 *   <output>/
 *   ├── refs/              # Reference images used (for provenance)
 *   ├── V-0ref/            # One dir per variation
 *   │   ├── shield/        # One dir per subject
 *   │   │   ├── sample-1.svg
 *   │   │   ├── sample-1.png
 *   │   │   ├── sample-2.svg
 *   │   │   ├── sample-2.png
 *   │   │   └── sample-3.svg/png
 *   │   ├── chat/
 *   │   └── ...
 *   ├── V-1ref/
 *   │   └── ...
 *   ├── manifest.json      # Full experiment config for reproducibility
 *   └── RESULTS.md         # Human-filled evaluation template
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";

// ============================================================
// CONFIGURATION — edit these to tune the experiment
// ============================================================

/**
 * Test subjects representing the range of real icon requests.
 *
 * Selection criteria:
 * - Cover concrete objects, product concepts, and abstract ideas
 * - Include subjects that exist in the current icon set (for direct comparison)
 * - Include subjects that DON'T exist (to test novel generation)
 * - Vary in inherent visual complexity
 */
const SUBJECTS: Record<string, { prompt: string; difficulty: string; existsInSet: boolean }> = {
  shield: {
    prompt: "A shield shape with a checkmark inside. Security or trust concept.",
    difficulty: "easy-concrete",
    existsInSet: true, // build-trust icon
  },
  chat: {
    prompt: "A speech bubble with a sparkle star. AI chat or assistant concept.",
    difficulty: "easy-concrete",
    existsInSet: true, // ai-chat-sparkle icon
  },
  nodes: {
    prompt: "Two rounded rectangles connected by a curved line with a dot at each junction. Agent workflow or integration concept.",
    difficulty: "medium-structural",
    existsInSet: true, // no-code-agent-studio / visual-builder
  },
  person: {
    prompt: "A person wearing a headset, head and shoulders view. Customer support concept.",
    difficulty: "medium-figurative",
    existsInSet: true, // headset icon
  },
  graph: {
    prompt: "An upward trending arrow with a simple axis line below. Growth or analytics concept.",
    difficulty: "easy-abstract",
    existsInSet: false, // new concept
  },
};

/**
 * Subjects for the reference-chaining set test (P0).
 * These simulate a real "generate 6 feature icons for a pricing page" workflow.
 * Each concept is distinct enough to test whether chaining maintains style
 * across diverse subjects.
 */
const SET_SUBJECTS: Record<string, { prompt: string }> = {
  security: { prompt: "A shield with a lock. Data security and compliance." },
  analytics: { prompt: "A bar chart with an upward trend line. Performance analytics." },
  integrations: { prompt: "Two puzzle pieces connecting. Platform integrations." },
  customization: { prompt: "A paintbrush with a gear. Customization and configuration." },
  scalability: { prompt: "Stacked layers expanding upward. Scalability and growth." },
  support: { prompt: "A person with a speech bubble and a heart. Customer support." },
};

/**
 * Reference image exemplars from the existing Inkeep icon set.
 *
 * These are the "best of" for each category — selected for strong
 * brush texture and representative complexity. Rendered to PNG
 * before use (Quiver's vision encoder processes raster, not SVG).
 *
 * The catA_extra and catB_extra sets provide additional same-category
 * icons for the V-4ref-same experiments.
 */
const REFERENCE_EXEMPLARS: Record<string, string> = {
  // Primary exemplars (one per category)
  catA:       "product-icons/ai-chat-sparkle",       // Medium complexity, clean brush
  catA_alt:   "product-icons/enterprise",             // High complexity, heavy brush (handshake)
  catB:       "feature-icons/headset",                // Minimal, clean, single concept
  catC:       "use-case-icons/b2b-customer-support",  // Heaviest brush, most complex

  // Additional Cat A exemplars (for V-4ref-same-catA)
  catA_extra1: "product-icons/docs-writer",           // Medium complexity, document concept
  catA_extra2: "product-icons/content-marketer",      // Medium complexity, marketing concept

  // Additional Cat B exemplars (for V-4ref-same-catB)
  catB_extra1: "feature-icons/profile",               // Simple person silhouette
  catB_extra2: "feature-icons/content-writer-pen",    // Simple pen icon
  catB_extra3: "ui-icons/bug",                        // Simple bug shape (used in ticket-categories too)
};

/**
 * Instruction templates.
 *
 * These go in the `--instructions` parameter (separate from `--prompt`).
 * The prompt describes WHAT to draw; instructions describe HOW to style it.
 *
 * Naming: the prompt channel describes WHAT, the instructions channel describes HOW,
 * and the references channel shows WHAT IT SHOULD LOOK LIKE. Three channels, each
 * doing one job, no overlap.
 */
const INSTRUCTIONS: Record<string, string> = {
  /** V1 — the current baseline. Won initial testing over detailed (V3) and texture-focused (V4).
   * Key insight: specific outcomes ("Colors: primary #231F20") outperform process descriptions
   * ("the marker leaves visible texture"). Constraints > physics lessons. */
  full: [
    "Icon style. 40x40 viewBox.",
    "Hand-drawn brush texture with organic edges and variable line weight.",
    "Fill-based compound paths (not stroke).",
    "Colors: primary #231F20 dark, accent #3784FF blue, light fill #F9F9F9.",
    "No gradients, no shadows.",
    "Simple composition, 3-6 elements max.",
  ].join(" "),

  /** Simplified — for Category B icons. Same as full but with reduced element count. */
  simplified: [
    "Icon style. 40x40 viewBox.",
    "Hand-drawn brush texture with organic edges and variable line weight.",
    "Fill-based compound paths (not stroke).",
    "Colors: primary #231F20 dark, accent #3784FF blue, light fill #F9F9F9.",
    "No gradients, no shadows.",
    "Very simple composition, 1-3 elements max. Minimal detail.",
  ].join(" "),

  /** Minimal — color constraints only. Tests whether reference can carry style alone.
   * RESULT from round 1: produces cleaner/more geometric icons — proves instructions matter. */
  minimal: [
    "Colors: primary #231F20 dark, accent #3784FF blue, light fill #F9F9F9.",
    "No gradients. No text. 40x40 viewBox.",
  ].join(" "),

  /** Match — V1 + explicit instruction to match reference.
   * RESULT from round 1: HARMFUL — causes reference subject leakage (sparkles contaminate
   * unrelated concepts). NEVER USE. Kept here for documentation only. */
  match: [
    "Icon style. 40x40 viewBox.",
    "Hand-drawn brush texture with organic edges and variable line weight.",
    "Fill-based compound paths (not stroke).",
    "Colors: primary #231F20 dark, accent #3784FF blue, light fill #F9F9F9.",
    "No gradients, no shadows.",
    "Simple composition, 3-6 elements max.",
    "Match the brush texture and visual weight of the reference image exactly.",
  ].join(" "),
};

/**
 * Experiment Design Methodology
 * =============================
 *
 * ## Experiment evaluation framework
 *
 * Before adding a variation, evaluate it against these criteria:
 *
 * 1. **What does it test?** — the specific hypothesis
 * 2. **Can we infer it?** — do existing results already answer this?
 * 3. **Would it change icons.md?** — if the result surprised us, would we write different guidance?
 * 4. **Use case coverage** — which real workflows depend on this knowledge?
 *
 * ## Priority levels
 *
 * - **P0:** Tests the actual production workflow. Untested. Would block shipping if wrong.
 * - **P1:** Tests a key variable in the guidance. Could change what we write.
 * - **P2:** Completes the picture. Inferable but worth confirming. Low cost.
 * - **Skip:** Inferable from existing data, or answerable via workflow (not Quiver config).
 *
 * ## Execution phases
 *
 * Experiments run in phases. Each phase's results inform whether later phases are needed.
 *
 * Phase 1 (parallel — foundational):
 *   Standard variations that test one independent variable each against a baseline.
 *   All subjects run in parallel with n=samples per API call.
 *
 * Phase 2 (sequential — workflow validation):
 *   Reference-chaining set test. Each icon depends on the previous output.
 *   Cannot be parallelized. Tests the end-to-end production workflow.
 *
 * ## What NOT to test (and why)
 *
 * - Temperature sweep (0.3 vs 0.4 vs 0.6): Marginal. 0.4 with refs works well.
 *   Wouldn't change guidance — "use 0.4" is stable.
 *
 * - Abstract concepts ("trust", "scalability"): Solved by workflow, not Quiver config.
 *   The agent should translate abstract concepts into visual metaphors before prompting.
 *   That's a workflow step in icons.md, not a generation parameter.
 *
 * - Color mode (recolored refs): Already partially validated (V2 test + recolor test).
 *   Would only change guidance on failure. Prescribe with confidence, test if issues arise.
 *
 * - "Match exactly" instruction: CONFIRMED HARMFUL in round 1 (subject leakage).
 *   No need to retest. Documented as anti-pattern.
 *
 * ## Established findings (from round 1 — 90 icons)
 *
 * These are settled and should not be re-tested unless the model changes:
 *
 * - V1 instruction template > detailed/marker-focused templates
 * - Instructions + references both necessary (neither alone sufficient)
 * - "Match exactly" causes reference subject leakage — NEVER USE
 * - V-4ref (4 diverse refs) = most consistent cross-sample results
 * - V-2ref-same (2 same-category refs) = heaviest brush texture
 * - V-0ref (text only) = usable fallback, inconsistent for sets
 */

/**
 * Experiment variations — organized by phase and priority.
 */
interface Variation {
  name: string;
  description: string;
  /** What independent variable this tests */
  tests: string;
  /** P0 = blocks shipping, P1 = could change guidance, P2 = completes picture */
  priority: "P0" | "P1" | "P2" | "established";
  /** Which phase: 1 = parallel standard, 2 = sequential chaining */
  phase: 1 | 2;
  /** Reference image paths (relative to refs/ dir). Empty = no references. */
  refs: string[];
  /** Which instruction template to use */
  instructions: keyof typeof INSTRUCTIONS;
  /** Temperature override (default 0.4 with refs, 0.5 without) */
  temperature?: number;
  /** If true, this variation was run in round 1 and results are established */
  established?: boolean;
  /** Round 1 result summary (if established) */
  round1Result?: string;
}

const VARIATIONS: Variation[] = [
  // ── Established (round 1) — re-run only for new model validation ──

  {
    name: "V-0ref",
    description: "No reference image — text instructions only",
    tests: "Baseline: how good is text-only generation?",
    priority: "established",
    phase: 1,
    refs: [],
    instructions: "full",
    temperature: 0.5,
    established: true,
    round1Result: "Usable fallback. Inconsistent brush weight across samples. Good color compliance.",
  },
  {
    name: "V-1ref",
    description: "Single reference (ai-chat-sparkle)",
    tests: "Benchmark: single ref + full instructions",
    priority: "established",
    phase: 1,
    refs: ["ai-chat-sparkle.png"],
    instructions: "full",
    established: true,
    round1Result: "Better consistency than V-0ref. Good for single icons, not tight enough for sets.",
  },
  {
    name: "V-2ref-same",
    description: "Two refs from same category (ai-chat-sparkle + enterprise)",
    tests: "Does 2 similar refs strengthen the style signal vs 1?",
    priority: "established",
    phase: 1,
    refs: ["ai-chat-sparkle.png", "enterprise.png"],
    instructions: "full",
    established: true,
    round1Result: "STRONGEST brush texture. Some samples go too heavy. Best for Category C hero icons.",
  },
  {
    name: "V-4ref",
    description: "Maximum 4 refs (all exemplars, diverse categories)",
    tests: "Does maximum visual conditioning produce best results or over-constrain?",
    priority: "established",
    phase: 1,
    refs: ["ai-chat-sparkle.png", "enterprise.png", "headset.png", "b2b-customer-support.png"],
    instructions: "full",
    established: true,
    round1Result: "WINNER for sets. Most consistent cross-sample results. Diverse refs average to balanced weight.",
  },
  {
    name: "V-minimal-inst",
    description: "Reference carries style, instructions carry only color constraints",
    tests: "Can we simplify instructions when the reference provides style?",
    priority: "established",
    phase: 1,
    refs: ["ai-chat-sparkle.png"],
    instructions: "minimal",
    established: true,
    round1Result: "PROVES instructions matter. Cleanest/most geometric output — lost brush texture.",
  },
  {
    name: "V-match",
    description: "Full instructions + explicit 'match the reference' reinforcement",
    tests: "Does explicit 'match' instruction improve fidelity vs implicit conditioning?",
    priority: "established",
    phase: 1,
    refs: ["ai-chat-sparkle.png"],
    instructions: "match",
    established: true,
    round1Result: "HARMFUL. Sparkle elements from ref contaminated unrelated icons. NEVER USE.",
  },

  // ── New experiments — round 2 ──

  {
    name: "V-4ref-same-catA",
    description: "4 refs all from Category A (medium weight icons)",
    tests: "Does matching refs produce tighter style than diverse refs? Tests whether 4 same-weight refs beat 4 diverse refs for Category A output.",
    priority: "P1",
    phase: 1,
    refs: ["ai-chat-sparkle.png", "enterprise.png", "docs-writer.png", "content-marketer.png"],
    instructions: "full",
  },
  {
    name: "V-4ref-same-catB",
    description: "4 refs all from Category B (simplified icons)",
    tests: "Does the same-category pattern hold for simplified icons? Tests whether 4 lightweight refs produce appropriately simpler output.",
    priority: "P2",
    phase: 1,
    refs: ["headset.png", "profile.png", "content-writer-pen.png", "bug.png"],
    instructions: "full",
  },
  {
    name: "V-2ref-mixed",
    description: "Two refs from different categories (ai-chat-sparkle + headset)",
    tests: "Does cross-category diversity at 2 refs achieve similar averaging to V-4ref? Could simplify the default from 4 refs to 2.",
    priority: "P2",
    phase: 1,
    refs: ["ai-chat-sparkle.png", "headset.png"],
    instructions: "full",
  },
  {
    name: "V-element-count",
    description: "V-4ref but with '1-3 elements max' instruction (Category B element count)",
    tests: "Does element count in instructions actually produce simpler icons? Validates the key Category A vs B differentiator.",
    priority: "P1",
    phase: 1,
    refs: ["ai-chat-sparkle.png", "enterprise.png", "headset.png", "b2b-customer-support.png"],
    instructions: "simplified",
  },

  // ── Phase 2: Sequential workflow validation ──
  // NOTE: The reference-chaining set test (P0) uses a special execution mode
  // and is handled by runSetChainTest(), not the standard runVariation().
  // It's listed here for documentation but flagged as phase 2.
  {
    name: "V-set-chain",
    description: "6-icon set using sliding-window reference chaining",
    tests: "Does the production workflow (generate icon #1 from exemplar refs, then chain #1→#2, #1+#2→#3, etc.) maintain coherence across a full set? This is THE critical workflow validation.",
    priority: "P0",
    phase: 2,
    refs: ["ai-chat-sparkle.png", "enterprise.png", "headset.png", "b2b-customer-support.png"],
    instructions: "full",
  },
];

// ============================================================
// EXECUTION ENGINE
// ============================================================

const RATE_LIMIT = 20;          // requests per window
const RATE_WINDOW_MS = 65_000;  // 65s (5s buffer over 60s)
const DEFAULT_SAMPLES = 3;

// Resolve icon set path — the brand assets are in the shared skill, not the gtm skill
const ICON_SET_DIR = resolve(
  import.meta.dir,
  "../../../../shared/skills/brand/assets/icon-set"
);

interface RunConfig {
  outputDir: string;
  samples: number;
  variationFilter?: string;
}

async function renderReferences(outputDir: string): Promise<void> {
  const refsDir = join(outputDir, "refs");
  mkdirSync(refsDir, { recursive: true });

  let sharp: any;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Error: sharp is required for rendering references. Run: bun add sharp");
    process.exit(1);
  }

  for (const [key, path] of Object.entries(REFERENCE_EXEMPLARS)) {
    const svgPath = join(ICON_SET_DIR, `${path}.svg`);
    const pngPath = join(refsDir, `${path.split("/").pop()}.png`);

    if (existsSync(pngPath)) continue; // skip if already rendered

    if (!existsSync(svgPath)) {
      console.error(`Warning: exemplar not found: ${svgPath}`);
      continue;
    }

    await sharp(svgPath, { density: 300 })
      .resize(800, 800, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(pngPath);

    console.error(`  Rendered ref: ${pngPath}`);
  }
}

/**
 * Generate N icon samples in a single API call using --n parameter.
 * Returns the number of successfully generated samples.
 *
 * Output files: outputBasePath-1.svg, outputBasePath-2.svg, ...
 * (plus .png previews if sharp is available)
 */
async function generateIconSamples(
  prompt: string,
  instructions: string,
  refs: string[],
  temperature: number,
  outputBasePath: string,
  nSamples: number,
): Promise<number> {
  const args = [
    "tools/quiver-generate.ts",
    "generate",
    "--prompt", prompt,
    "--instructions", instructions,
    "--temperature", temperature.toString(),
    "--n", nSamples.toString(),
    "--output", outputBasePath,
  ];

  if (refs.length > 0) {
    args.push("--references", refs.join(","));
  }

  const proc = Bun.spawn(["bun", ...args], {
    cwd: resolve(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) return 0;

  // Count generated files (quiver-generate outputs basename-1.svg, basename-2.svg, ...)
  let count = 0;
  for (let i = 1; i <= nSamples; i++) {
    const svgPath = outputBasePath.replace(/\.svg$/, `-${i}.svg`);
    if (existsSync(svgPath)) count++;
  }
  return count;
}

async function runVariation(
  variation: Variation,
  config: RunConfig
): Promise<{ ok: number; fail: number }> {
  const varDir = join(config.outputDir, variation.name);
  const refsDir = join(config.outputDir, "refs");
  let ok = 0, fail = 0;

  // Build full ref paths
  const refPaths = variation.refs.map(r => join(refsDir, r));

  // Validate refs exist
  for (const r of refPaths) {
    if (!existsSync(r)) {
      console.error(`Error: reference not found: ${r}`);
      return { ok: 0, fail: Object.keys(SUBJECTS).length * config.samples };
    }
  }

  const temp = variation.temperature ?? (variation.refs.length > 0 ? 0.4 : 0.5);
  const inst = INSTRUCTIONS[variation.instructions];

  // Generate all subjects in parallel — one API call per subject with n=samples.
  // With 5 subjects, that's 5 parallel calls (well within 20/60s rate limit).
  const subjectEntries = Object.entries(SUBJECTS);

  console.error(`  ${subjectEntries.length} subjects × ${config.samples} samples = ${subjectEntries.length} API calls (using n=${config.samples})`);

  const results = await Promise.all(
    subjectEntries.map(async ([subjectKey, subject]) => {
      const subDir = join(varDir, subjectKey);
      mkdirSync(subDir, { recursive: true });

      const outputBase = join(subDir, "sample.svg");
      const generated = await generateIconSamples(
        subject.prompt, inst, refPaths, temp, outputBase, config.samples
      );

      if (generated > 0) {
        ok += generated;
        return `    OK: ${subjectKey} (${generated}/${config.samples} samples)`;
      } else {
        fail += config.samples;
        return `    FAIL: ${subjectKey}`;
      }
    })
  );

  for (const r of results) console.error(r);
  return { ok, fail };
}

/**
 * Phase 2: Reference-chaining set test (P0).
 *
 * Simulates the real production workflow:
 * 1. Generate icon #1 using 4 exemplar refs (V-4ref baseline)
 * 2. Render icon #1 to PNG
 * 3. Generate icon #2 using icon #1 as reference
 * 4. Generate icon #3 using icon #1 + icon #2 as references
 * 5. Generate icon #4 using icon #2 + icon #3 (sliding window)
 * 6. Continue for 6 icons total
 *
 * This MUST run sequentially — each icon depends on the previous.
 * Measures: does style drift over 6 generations, or stay anchored?
 */
async function runSetChainTest(
  variation: Variation,
  config: RunConfig,
): Promise<{ ok: number; fail: number }> {
  const varDir = join(config.outputDir, variation.name);
  const refsDir = join(config.outputDir, "refs");
  mkdirSync(varDir, { recursive: true });
  let ok = 0, fail = 0;

  const inst = INSTRUCTIONS[variation.instructions];
  const temp = variation.temperature ?? 0.4;

  // Start with the 4 exemplar refs
  const initialRefs = variation.refs.map(r => join(refsDir, r));
  const setEntries = Object.entries(SET_SUBJECTS);
  const generatedPngs: string[] = [];

  let sharp: any;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Error: sharp is required for set chain test");
    return { ok: 0, fail: setEntries.length };
  }

  for (let i = 0; i < setEntries.length; i++) {
    const [subjectKey, subject] = setEntries[i];
    const subDir = join(varDir, `${i + 1}-${subjectKey}`);
    mkdirSync(subDir, { recursive: true });

    // Determine refs for this icon
    let refs: string[];
    if (i === 0) {
      // Icon #1: use the 4 exemplar refs
      refs = initialRefs;
    } else if (i === 1) {
      // Icon #2: use icon #1
      refs = [generatedPngs[0]];
    } else {
      // Icon #3+: sliding window of latest 2
      refs = generatedPngs.slice(-2);
    }

    console.error(`  [${i + 1}/${setEntries.length}] ${subjectKey} (${refs.length} refs: ${i === 0 ? "exemplars" : "chained"})`);

    const outputBase = join(subDir, "sample.svg");
    const generated = await generateIconSamples(
      subject.prompt, inst, refs, temp, outputBase, config.samples
    );

    if (generated > 0) {
      ok += generated;

      // Render the first sample to PNG for use as reference for next icon
      const firstSvg = outputBase.replace(/\.svg$/, "-1.svg");
      const chainPng = join(subDir, "chain-ref.png");

      if (existsSync(firstSvg)) {
        try {
          await sharp(readFileSync(firstSvg), { density: 300 })
            .resize(800, 800, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .png()
            .toFile(chainPng);
          generatedPngs.push(chainPng);
          console.error(`    → Chained: ${chainPng}`);
        } catch (e: any) {
          console.error(`    → Chain render failed: ${e.message}`);
          // Fall back to exemplar refs for next icon
        }
      }
    } else {
      fail += config.samples;
      console.error(`    → FAILED`);
    }
  }

  return { ok, fail };
}

async function writeManifest(config: RunConfig, variations: Variation[]): Promise<void> {
  const manifest = {
    timestamp: new Date().toISOString(),
    config: {
      samples: config.samples,
      temperature: { withRefs: 0.4, withoutRefs: 0.5 },
      presencePenalty: -0.5,
      model: "arrow-preview",
    },
    subjects: SUBJECTS,
    referenceExemplars: REFERENCE_EXEMPLARS,
    instructions: INSTRUCTIONS,
    variations: variations.map(v => ({
      name: v.name,
      description: v.description,
      tests: v.tests,
      refs: v.refs,
      instructions: v.instructions,
    })),
  };

  writeFileSync(
    join(config.outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

function writeEvaluationTemplate(config: RunConfig, variations: Variation[]): void {
  const lines = [
    "# Icon Benchmark Evaluation",
    "",
    `**Date:** ${new Date().toISOString().split("T")[0]}`,
    `**Samples per condition:** ${config.samples}`,
    "",
    "## Evaluation criteria (rate 1-5 per variation × subject)",
    "",
    "| Criterion | What to look for |",
    "|---|---|",
    "| **Brush texture** | Does it look hand-drawn? Organic edges? Variable line weight? |",
    "| **Color compliance** | Correct palette (#231F20 dark + #3784FF blue + #F9F9F9 light)? |",
    "| **Concept clarity** | Is the subject recognizable at icon scale? |",
    "| **Cross-sample consistency** | Do the 3 samples feel like a set? |",
    "| **Brand match** | Would it blend with the existing Inkeep icon set? |",
    "",
    "## Results",
    "",
  ];

  for (const variation of variations) {
    lines.push(`### ${variation.name}: ${variation.description}`);
    lines.push(`**Tests:** ${variation.tests}`);
    lines.push("");
    lines.push("| Subject | Brush | Color | Clarity | Consistency | Brand | Notes |");
    lines.push("|---|---|---|---|---|---|---|");

    for (const subjectKey of Object.keys(SUBJECTS)) {
      lines.push(`| ${subjectKey} | /5 | /5 | /5 | /5 | /5 | |`);
    }
    lines.push("");
  }

  lines.push("## Summary");
  lines.push("");
  lines.push("| Variation | Avg Brush | Avg Color | Avg Clarity | Avg Consistency | Avg Brand | Winner? |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const v of variations) {
    lines.push(`| ${v.name} | | | | | | |`);
  }
  lines.push("");
  lines.push("## Conclusions");
  lines.push("");
  lines.push("*Fill in after evaluation*");

  writeFileSync(join(config.outputDir, "RESULTS.md"), lines.join("\n"));
}

// ============================================================
// FIGMA EXPORT — generates code to insert results into Figma
// ============================================================

/**
 * Generates a figma_execute code snippet that creates a comparison grid
 * from the benchmark results. The agent can paste this into figma_execute
 * to create the grid in the Graphics Workspace.
 *
 * The grid layout:
 * - Rows: one per subject (shield, chat, nodes, person, graph)
 * - Columns: one per variation (V-0ref, V-1ref, V-2ref-same, ...)
 * - Each cell: 3 samples side by side (to show cross-sample consistency)
 * - Reference images shown in a header row
 *
 * Output: a shell script that uses figma_set_image_fill to populate the grid.
 * The Figma frames must be created first via figma_execute.
 */
function writeFigmaImportScript(config: RunConfig, variations: Variation[]): void {
  const subjects = Object.keys(SUBJECTS);
  const lines = [
    "#!/bin/bash",
    "# Auto-generated Figma import script for icon benchmark results",
    `# Generated: ${new Date().toISOString()}`,
    `# Results dir: ${config.outputDir}`,
    "",
    "# Step 1: Create the grid in Figma using figma_execute",
    "# (paste the JS below into figma_execute, then run this script for image fills)",
    "",
    "cat << 'FIGMA_CODE'",
    "// === Paste into figma_execute to create the grid structure ===",
    "",
    "const page = figma.createPage();",
    `page.name = '[${new Date().toISOString().split("T")[0]}] Icon Benchmark — ${variations.length} Variations × ${subjects.length} Subjects';`,
    "await figma.setCurrentPageAsync(page);",
    "",
    "await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });",
    "await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });",
    "await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });",
    "",
    "const root = figma.createFrame();",
    "root.name = 'Benchmark Grid';",
    "root.layoutMode = 'VERTICAL';",
    "root.layoutSizingHorizontal = 'HUG';",
    "root.layoutSizingVertical = 'HUG';",
    "root.paddingTop = 60; root.paddingBottom = 40;",
    "root.paddingLeft = 40; root.paddingRight = 40;",
    "root.itemSpacing = 24;",
    "root.fills = [{ type: 'SOLID', color: { r: 0.984, g: 0.976, b: 0.957 } }];",
    "",
    "// Title",
    "const title = figma.createText();",
    "title.fontName = { family: 'Inter', style: 'Bold' };",
    `title.characters = 'Icon Benchmark: ${variations.length} Variations × ${subjects.length} Subjects × ${config.samples} Samples';`,
    "title.fontSize = 24;",
    "title.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }];",
    "root.appendChild(title);",
    "",
    "const nodeMap = {};",
    "",
  ];

  // Column headers
  lines.push("// Column headers");
  lines.push("const headerRow = figma.createFrame();");
  lines.push("headerRow.name = 'Headers';");
  lines.push("headerRow.layoutMode = 'HORIZONTAL';");
  lines.push("headerRow.layoutSizingHorizontal = 'HUG';");
  lines.push("headerRow.layoutSizingVertical = 'HUG';");
  lines.push("headerRow.itemSpacing = 16;");
  lines.push("headerRow.fills = [];");
  lines.push("");
  lines.push("const spacer = figma.createFrame();");
  lines.push("spacer.resize(100, 32); spacer.fills = [];");
  lines.push("headerRow.appendChild(spacer);");

  for (const v of variations) {
    const cellWidth = config.samples * 110;  // 100px per sample + 10px gap
    lines.push(`{`);
    lines.push(`  const label = figma.createText();`);
    lines.push(`  label.fontName = { family: 'Inter', style: 'Medium' };`);
    lines.push(`  label.characters = '${v.name}';`);
    lines.push(`  label.fontSize = 11;`);
    lines.push(`  label.fills = [{ type: 'SOLID', color: { r: 0.216, g: 0.518, b: 1.0 } }];`);
    lines.push(`  label.resize(${cellWidth}, 32);`);
    lines.push(`  label.textAlignHorizontal = 'CENTER';`);
    lines.push(`  headerRow.appendChild(label);`);
    lines.push(`}`);
  }
  lines.push("root.appendChild(headerRow);");
  lines.push("");

  // Subject rows
  for (const subject of subjects) {
    lines.push(`// Row: ${subject}`);
    lines.push(`{`);
    lines.push(`  const row = figma.createFrame();`);
    lines.push(`  row.name = 'Row — ${subject}';`);
    lines.push(`  row.layoutMode = 'HORIZONTAL';`);
    lines.push(`  row.layoutSizingHorizontal = 'HUG';`);
    lines.push(`  row.layoutSizingVertical = 'HUG';`);
    lines.push(`  row.counterAxisAlignItems = 'CENTER';`);
    lines.push(`  row.itemSpacing = 16;`);
    lines.push(`  row.fills = [];`);
    lines.push(``);
    lines.push(`  const label = figma.createText();`);
    lines.push(`  label.fontName = { family: 'Inter', style: 'Medium' };`);
    lines.push(`  label.characters = '${subject}';`);
    lines.push(`  label.fontSize = 12;`);
    lines.push(`  label.fills = [{ type: 'SOLID', color: { r: 0.137, g: 0.122, b: 0.125 } }];`);
    lines.push(`  label.resize(100, 20);`);
    lines.push(`  row.appendChild(label);`);

    for (const v of variations) {
      // Cell with N samples side by side
      lines.push(`  {`);
      lines.push(`    const cell = figma.createFrame();`);
      lines.push(`    cell.name = '${v.name}/${subject}';`);
      lines.push(`    cell.layoutMode = 'HORIZONTAL';`);
      lines.push(`    cell.layoutSizingHorizontal = 'HUG';`);
      lines.push(`    cell.layoutSizingVertical = 'HUG';`);
      lines.push(`    cell.itemSpacing = 8;`);
      lines.push(`    cell.fills = [];`);

      for (let i = 1; i <= config.samples; i++) {
        const nodeKey = `${v.name}/${subject}/sample-${i}`;
        lines.push(`    {`);
        lines.push(`      const frame = figma.createFrame();`);
        lines.push(`      frame.name = '${nodeKey}';`);
        lines.push(`      frame.resize(100, 100);`);
        lines.push(`      frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];`);
        lines.push(`      frame.cornerRadius = 8;`);
        lines.push(`      frame.clipsContent = true;`);
        lines.push(`      cell.appendChild(frame);`);
        lines.push(`      nodeMap['${nodeKey}'] = frame.id;`);
        lines.push(`    }`);
      }

      lines.push(`    row.appendChild(cell);`);
      lines.push(`  }`);
    }

    lines.push(`  root.appendChild(row);`);
    lines.push(`}`);
    lines.push(``);
  }

  lines.push("return { pageId: page.id, rootId: root.id, nodeMap };");
  lines.push("FIGMA_CODE");
  lines.push("");
  lines.push("# Step 2: After creating the grid, use the nodeMap to set image fills");
  lines.push("# The figma_execute above returns nodeMap — use it to call figma_set_image_fill");
  lines.push("# for each PNG in the results directory.");
  lines.push("");
  lines.push("echo 'Grid structure created. Now set image fills using figma_set_image_fill'");
  lines.push("echo 'with the node IDs from the nodeMap and PNG paths from:'");
  lines.push(`echo '  ${config.outputDir}/<variation>/<subject>/sample-N.png'`);

  writeFileSync(join(config.outputDir, "figma-import.sh"), lines.join("\n"));
  console.error(`Figma import script: ${join(config.outputDir, "figma-import.sh")}`);
}

// ============================================================
// CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("Available variations:\n");
    const phases = [1, 2] as const;
    for (const phase of phases) {
      console.log(`Phase ${phase}${phase === 1 ? " (parallel)" : " (sequential)"}:`);
      for (const v of VARIATIONS.filter(vv => vv.phase === phase)) {
        const status = v.established ? `[established] ${v.round1Result}` : `[${v.priority}]`;
        console.log(`  ${v.name}: ${v.description}`);
        console.log(`    ${status}`);
        console.log(`    Tests: ${v.tests}`);
        console.log(`    Refs: ${v.refs.length > 0 ? v.refs.join(", ") : "none"}`);
        console.log("");
      }
    }
    return;
  }

  const outputIdx = args.indexOf("--output");
  const outputDir = outputIdx >= 0 ? resolve(args[outputIdx + 1]) : resolve("/tmp/icon-benchmark");

  const samplesIdx = args.indexOf("--samples");
  const samples = samplesIdx >= 0 ? parseInt(args[samplesIdx + 1]) : DEFAULT_SAMPLES;

  const varIdx = args.indexOf("--variation");
  const variationFilter = varIdx >= 0 ? args[varIdx + 1] : undefined;

  const phaseIdx = args.indexOf("--phase");
  const phaseFilter = phaseIdx >= 0 ? parseInt(args[phaseIdx + 1]) as 1 | 2 : undefined;

  const prioIdx = args.indexOf("--priority");
  const prioFilter = prioIdx >= 0 ? args[prioIdx + 1] : undefined;

  // By default, run only NEW experiments (not re-run established ones)
  const includeEstablished = args.includes("--include-established");

  const config: RunConfig = { outputDir, samples, variationFilter };
  mkdirSync(outputDir, { recursive: true });

  // Filter variations
  let selectedVariations = VARIATIONS;

  if (variationFilter) {
    selectedVariations = selectedVariations.filter(v => v.name === variationFilter);
  }
  if (phaseFilter) {
    selectedVariations = selectedVariations.filter(v => v.phase === phaseFilter);
  }
  if (prioFilter) {
    selectedVariations = selectedVariations.filter(v => v.priority === prioFilter);
  }
  if (!includeEstablished) {
    selectedVariations = selectedVariations.filter(v => !v.established);
  }

  if (selectedVariations.length === 0) {
    console.error("No variations selected. Check filters.");
    console.error(`  --variation: ${variationFilter || "(none)"}`);
    console.error(`  --phase: ${phaseFilter || "(none)"}`);
    console.error(`  --priority: ${prioFilter || "(none)"}`);
    console.error(`  --include-established: ${includeEstablished}`);
    console.error(`\nAvailable: ${VARIATIONS.map(v => `${v.name} [${v.priority}${v.established ? ", established" : ""}]`).join(", ")}`);
    process.exit(1);
  }

  // Separate phase 1 (parallel) and phase 2 (sequential)
  const phase1 = selectedVariations.filter(v => v.phase === 1);
  const phase2 = selectedVariations.filter(v => v.phase === 2);

  const phase1Icons = phase1.length * Object.keys(SUBJECTS).length * samples;
  const phase2Icons = phase2.length * Object.keys(SET_SUBJECTS).length * samples;
  const totalIcons = phase1Icons + phase2Icons;

  console.error(`Icon Generation Benchmark`);
  console.error(`  Phase 1 (parallel): ${phase1.length} variations × ${Object.keys(SUBJECTS).length} subjects × ${samples} samples = ${phase1Icons} icons`);
  if (phase2.length > 0) {
    console.error(`  Phase 2 (sequential): ${phase2.length} variations × ${Object.keys(SET_SUBJECTS).length} subjects × ${samples} samples = ${phase2Icons} icons`);
  }
  console.error(`  Total: ${totalIcons} icons`);
  console.error(`  Output: ${outputDir}`);
  console.error(``);

  // Render reference images
  console.error("Rendering reference images...");
  await renderReferences(outputDir);

  // Write experiment manifest, evaluation template, and Figma import script
  await writeManifest(config, selectedVariations);
  writeEvaluationTemplate(config, selectedVariations);
  writeFigmaImportScript(config, selectedVariations);
  console.error(`Manifest: ${join(outputDir, "manifest.json")}`);
  console.error(`Evaluation: ${join(outputDir, "RESULTS.md")}`);
  console.error(`Figma import: ${join(outputDir, "figma-import.sh")}`);
  console.error(``);

  let totalOk = 0, totalFail = 0;

  // ── Phase 1: Parallel standard variations ──
  if (phase1.length > 0) {
    console.error(`═══ Phase 1: ${phase1.length} parallel variations ═══`);
    console.error(``);

    for (let i = 0; i < phase1.length; i++) {
      const variation = phase1[i];
      console.error(`[${i + 1}/${phase1.length}] ${variation.name} [${variation.priority}]: ${variation.description}`);

      if (i > 0) {
        console.error(`  Rate limit pause (${RATE_WINDOW_MS / 1000}s)...`);
        await new Promise(r => setTimeout(r, RATE_WINDOW_MS));
      }

      const result = await runVariation(variation, config);
      totalOk += result.ok;
      totalFail += result.fail;
      console.error(`  → ${result.ok} OK, ${result.fail} failed`);
      console.error(``);
    }
  }

  // ── Phase 2: Sequential reference-chaining ──
  if (phase2.length > 0) {
    console.error(`═══ Phase 2: ${phase2.length} sequential chain test(s) ═══`);
    console.error(``);

    if (phase1.length > 0) {
      console.error(`  Inter-phase pause (${RATE_WINDOW_MS / 1000}s)...`);
      await new Promise(r => setTimeout(r, RATE_WINDOW_MS));
    }

    for (const variation of phase2) {
      console.error(`[P0] ${variation.name}: ${variation.description}`);
      const result = await runSetChainTest(variation, config);
      totalOk += result.ok;
      totalFail += result.fail;
      console.error(`  → ${result.ok} OK, ${result.fail} failed`);
      console.error(``);
    }
  }

  console.error(`Benchmark complete: ${totalOk} OK, ${totalFail} failed`);
  console.error(`Results: ${outputDir}`);
  console.error(`Next step: visually inspect PNGs and fill in ${join(outputDir, "RESULTS.md")}`);
  console.error(`Use capture-for-review.ts to generate composite images for evaluation.`);

  console.log(JSON.stringify({
    totalIcons: totalOk + totalFail,
    ok: totalOk,
    fail: totalFail,
    outputDir,
    resultsFile: join(outputDir, "RESULTS.md"),
  }));
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
