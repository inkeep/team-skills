Use when: Need CLI flag reference, architecture details, or degradation behavior for the verification system
Priority: P1
Impact: Missing CLI options or misunderstanding layer architecture

# Visual verification — reference

CLI reference and architecture details for the verification system. For the step-by-step workflow, see the **Visual Verification** section in SKILL.md.

## Architecture

Three layers run sequentially with early exit:

| Layer | What it checks | How | Exit condition |
|-------|---------------|-----|----------------|
| **Layer 1** | Dimensions, brand colors | `renderStill()` → PNG → `sharp` pixel sampling at 5 positions | All frames pass dimension + color checks |
| **Layer 2** | Text, brand feel, elements, layout | Subagent reads PNGs + evaluation prompt (fresh context, no source code knowledge) | All frames FRAME_PASSED: true |
| **Layer 3** | Timing, transitions, easing, choreography, pacing | `renderMedia()` → MP4 → Gemini Pro evaluates video | OVERALL_SCORE >= 6.0, no dimension below 4 |

Layer 2 uses a subagent (not self-evaluation) to prevent confirmation bias — see SKILL.md for the rationale and subagent prompt template.

## CLI reference

```bash
npx tsx <path-to-skill>/scripts/verify-composition.ts [flags]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--composition` | (required) | Composition ID from Root.tsx |
| `--frames` | auto (0, 25%, 50%, 75%, last) | Comma-separated frame numbers |
| `--layers` | `1` | Which layers: `1`, `1,3`, or `3` |
| `--output` | `tmp/verification-result.json` | Result JSON path |
| `--cwd` | `remotion-videos/` | Remotion project root |
| `--props` | `{}` | JSON input props for calculateMetadata |
| `--flow-model` | `pro` | Gemini model: `pro` or `flash` |
| `--save-frames` | `true` | Save rendered PNGs to tmp/frames/ |

## Degradation

| Missing | Behavior |
|---------|----------|
| `GOOGLE_AI_API_KEY` | Layer 3 skipped, result shows `ran: false` |
| `sharp` not installed | Color sampling skipped in Layer 1 |
| Composition not found | Error with available IDs |

## Output files

| File | Purpose |
|------|---------|
| `tmp/verification-result.json` | Latest result (overwritten each run) |
| `tmp/verification-history.jsonl` | One-line-per-run trend log |
| `tmp/frames/<CompositionId>/frame-<N>.png` | Rendered frame PNGs for Layer 2 |

## Result JSON structure

```
{
  compositionId: string,
  layers: {
    programmatic: { ran, passed, frames: [{ frame, dimensions, colorSamples }] },
    visual: null,  // Layer 2 handled by subagent, not script
    flow: { ran, passed, model, scores, overall_score, evaluation }
  },
  overall: { passed, summary, layersRan, layersPassed },
  framePaths: string[]  // paths to rendered PNGs for Layer 2 subagent
}
```
