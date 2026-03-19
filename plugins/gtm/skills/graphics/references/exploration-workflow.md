Use when: Following the exploration workflow (the default for any request with meaningful visual direction choices). Loaded after the Creative Brief is confirmed.
Priority: P0
Impact: Without this, the agent builds one direction and iterates reactively instead of exploring options upfront.

---

# Exploration Workflow

This file contains the full exploration workflow for iterative visual direction exploration. It wraps around the existing Steps 3-5 (plan, generate, verify) — calling them per-frame inside an exploration loop.

**When this is loaded:** After the exploration gate in the main workflow determined this is not a trivial edit. Steps 1-1c (parse, brief, product context) are already complete.

---

## Three-phase workflow

**Phase 0: Conceptualize** — Propose 5 direction concepts as text. User selects which to build. *(Summarized inline in SKILL.md — full guidance below.)*

**Phase 1: Diverge** — Build the selected directions as polished Figma frames (parallel via `/nest-claude`). Present to user.

**Phase 2: Iterate** — Respond to whatever the user says. Loop until done.

---

## Phase 0: Conceptualize (full guidance)

The summary in SKILL.md covers the 6-step reasoning process and output format. This section adds guidance on handling user responses and edge cases.

**How the user may respond:**
- Select specific directions ("build 1, 3, and 5")
- Reject a direction ("we never use dark themes")
- Suggest a replacement ("add a data callout version instead")
- Merge ideas ("combine 2 and 5")
- Ask for more options in a specific vein ("give me more options like #1")
- Say "go for it" (build all 5)

The build count is determined by the user's selection — the agent builds exactly what was picked.

After the user selects, update `state.json` with `conceptsProposed`, then proceed to Step 2 (asset collection) and Phase 1 (diverge).

---

## Phase 1: Diverge

**First action when entering Figma: create a fresh page.** Do not use whatever page is currently active — it belongs to a previous session. Create a new page immediately:

```javascript
// via figma_execute
const page = figma.createPage();
page.name = "[YYYY-MM-DD] {Medium} — {Description}";
await figma.setCurrentPageAsync(page);
return { pageId: page.id, pageName: page.name };
```

Store the `pageId` — use `getNodeByIdAsync(pageId)` for all subsequent operations to avoid page context drift if multiple agents are working in the same file.

The only exception: if the user explicitly references an existing page or you're resuming from `state.json` (which already has `figma.pageId`).

### Setup (parent, serialized)

1. Create the Figma page
2. Create N empty Sections (one per selected direction)
3. Write `state.json` with all shared context: Creative Brief, assets, Figma IDs, per-direction assignments (see State Persistence below)
4. Create `build-results/` directory

### Build (parallel via /nest-claude)

When building ≥2 directions, spawn parallel Claude Code child processes via `/nest-claude`. Each child is a full Claude Code instance — it can use MCP tools and spawn its own reviewer subagent.

**Why `/nest-claude` instead of the Agent tool:** Subagents cannot spawn other subagents. Each frame needs two-layer verification (which requires spawning a reviewer subagent), so the frame-builder must be a full Claude Code process.

Spawn all children in a single message (concurrent background Bash commands):

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Your state directory is: tmp/graphics/<page-slug>/
Your direction slug is: immersive-slack-thread

1. Load `/brand` skill and `/graphics` skill
2. Read state.json — find your direction by slug in the directions object
3. That gives you: direction concept, sectionNodeId, Creative Brief, assets, Figma file key
4. CRITICAL: ALL Figma nodes you create must go inside YOUR Section (sectionNodeId). Never create at page root. Never touch other Sections. Use getNodeByIdAsync(sectionNodeId) to scope all operations.
5. Build the frame in your Section, run Phase B-E (decomposition, build, elevation)
6. Run Step 5 two-layer verification (spawn reviewer subagent)
7. Fix NEEDS REVISION findings, re-verify (max 3 iterations)
8. Write results to: build-results/immersive-slack-thread.json" \
    --dangerously-skip-permissions \
    --max-turns 50 \
    --output-format json \
    < /dev/null 2>&1 | tee tmp/graphics/<page-slug>/build-results/immersive-slack-thread-stdout.json
```

**Always spawn a child, even for a single direction.** The parent never builds frames — it orchestrates and verifies. This ensures consistent behavior and independent review.

### Each child's build cycle

⛔ **Section isolation (non-negotiable):** Every Figma node the child creates — frames, working atoms, imported SVGs, image fills, text, shapes, EVERYTHING — must be placed inside the child's assigned Section (by `sectionNodeId`). Never create nodes at page root. Never place nodes in another direction's Section. Never use `figma.currentPage` to scope operations — always use `getNodeByIdAsync(sectionNodeId)`. The working atoms frame, the final composition frame, and all intermediate artifacts live inside your Section. If a node ends up outside your Section, move it immediately or delete it. Violating section isolation pollutes other children's work and is the #1 cause of cross-direction contamination in parallel builds.

1. Read `state.json` → find its direction by slug → get concept, sectionNodeId, Creative Brief, assets, **buildSpec** (end-state vision, success criteria, information architecture, atom audit with sub-element decomposition)
2. If Phase 2 iteration: read the direction's `iterations` array for full history — what was built, what feedback was given, what to keep and what to fix
3. Load `/brand` skill and `/graphics` skill
4. Step 3: The Build Spec is already in state.json — verify it's complete (end-state vision, success criteria, information architecture, atom audit). If building a new direction without a spec, write one first.
5. **Position the new frame to the right of existing siblings.** Iterations within a Section go left-to-right. Before creating your frame, query the Section for existing children and compute your x-position:
   ```javascript
   // via figma_execute — find the rightmost frame in the Section
   const section = await figma.getNodeByIdAsync('YOUR_SECTION_NODE_ID');
   let maxRight = 0;
   for (const child of section.children) {
     if (child.type === 'FRAME') {
       const right = child.x + child.width;
       if (right > maxRight) maxRight = right;
     }
   }
   // Position new frame to the right with GAP_X
   const GAP_X = 100;
   const SECTION_PADDING = 60;
   const startX = maxRight > 0 ? maxRight + GAP_X : SECTION_PADDING;
   // After creating the new frame, set: frame.x = startX; frame.y = SECTION_PADDING;
   ```
   For the initial build (no existing children), the frame goes at `(SECTION_PADDING, SECTION_PADDING)`. For iteration v2+, it goes to the right of the previous iteration. This creates the left-to-right progression the user sees on the canvas.
6. **Step 4, Phase B: Verify and deepen the atom decomposition.** The parent's Build Spec contains the initial Atom generation audit. The child verifies it's deep enough and further decomposes where needed:
   - Check every Tier 2 atom — is it compound (3+ sub-elements)? If not yet decomposed, decompose now.
   - For each Tier 2 sub-element, walk the decision tree in `references/method-selection.md`.
   - If a sub-element is itself compound, decompose recursively until every leaf is a single-method declaration.
   - If decomposition reveals new atoms or changes methods, record under `decompositionChanges` in the build-results JSON.
   - Then plan the build order (method-aware: asset fetches → external generations → Figma shapes → imports → compounds → connections).
7. Step 4, Phases A, C-D: Stage assets, build atoms bottom-up, compose final design (targeting Section by node ID). **Place the final composition frame at the x-position computed in step 5** — the working atoms frame can go anywhere within the Section, but the final frame must be positioned for left-to-right iteration progression.
8. **Phase E: 3-pass self-critique (all passes mandatory, recursive).** `references/craft-elevation.md` should already be loaded from Phase C. Pass 1: structural correctness (meet success criteria). Pass 2: craft elevation (push every element from "correct" to "rich" — count depth stack layers, evaluate each atom against elevation strategies, implement ≥2 elevations). Pass 3: cohesion and polish (unified composition, spacing rhythm, thumbnail integrity, micro-polish). **Recursive:** after Pass 3, ask "what would a design lead push back on?" — if the answer isn't "nothing," run another Pass 2 → Pass 3 cycle. Max 5 total passes. Stop when: depth stack ≥5, all atoms at "Elevated," cohesion test passes, no actionable improvement remaining. Do not proceed to the reviewer until the elevation loop exits.
9. Step 5: Two-layer verification loop (max 3 iterations):
   - Layer 1: programmatic checks (`figma_lint_design`, bounds, dimensions). Fix until clean.
   - Layer 2: reviewer subagent (`capture-for-review.ts` → reviewer evaluates at 1568px + 400px). Pass the Build Spec's success criteria AND information architecture as evaluation context.
   - The reviewer returns structured findings. **Record each review round** in the `reviews` array (see build-results schema below) — verdict, findings with evidence, and revision instructions.
   - Read verdict: **PASS** → proceed. **PASS WITH SUGGESTIONS** → implement quick fixes, proceed. **NEEDS REVISION** → assess findings against context, apply valid fixes, restart from Layer 1.
   - After 3 iterations without PASS → write error status to result file.
   - **Every frame must pass the self-critique loop AND the reviewer before the user sees it.** No exceptions. Self-reported verdicts (`SELF-REVIEWED`, `SELF_PASS`) do not count.
10. Write results to `build-results/<direction-slug>.json` including the full `reviews` array from all verification rounds and any `decompositionChanges` from step 6.

### Collect results (parent, serialized)

After all children complete:
1. Read each `build-results/<slug>.json`
2. Append each iteration to the corresponding direction in `state.json`
3. Present to user using the converge contract (see Interaction Model below)

---

## Phase 2: Iterate

Respond to whatever the user says. The user might:
- Narrow to favorites ("I like 1 and 5")
- Ask for sub-variants ("explore different angles of option 1")
- Ask for polish iterations ("make two more refined versions of these")
- Give targeted feedback ("the logo is wrong, fix the avatar")
- Request new directions ("try something completely different")
- Combine ("keep 1A but try option 5 as a dark theme")
- Approve ("these are good, let's export")

**When the user narrows to 2+ favorites:** proactively suggest what elements could combine well — "Direction A's layout with Direction B's color treatment could work well — want me to try a merge?" Merged designs combining the best elements from multiple directions consistently outperform picking a single winner. Default to suggesting a merge unless the directions are too conceptually different to combine coherently.

**When the user can't pick favorites** ("I like parts of all of them," "I'm torn"): help them separate what they're responding to — "Is it the layout you like, or the color treatment? The illustration style, or the concept itself?" This often reveals that elements from different directions can merge, or that the user has a clear conceptual preference but is distracted by surface differences.

The agent's job is always the same:
1. **Interpret** — What is the user asking for? New direction, refinement, fix, or split?
2. **Build** — If ≥2 independent frames: spawn `/nest-claude` children (parallel). If 1 frame or orchestration: parent builds directly (sequential).
3. **Verify** — Step 5 two-layer verification on every frame (children handle this internally when parallel; parent handles when sequential)
4. **Organize** — Place in the correct Section (new section for new direction, next column for iteration)
5. **Persist** — Update `state.json`: append iteration to direction's `iterations` array, record `userVerdict` and `userFeedback` when user responds
6. **Present** — Direct the user to the canvas

### Sub-variant diversity

When the user asks to "explore different angles" or "make variations" of a direction, vary the **visual strategy** (layout, focal point, imagery approach), not just surface styling (colors, fonts, spacing). Each sub-variant should try a different compositional approach to the same concept.

**Transformation menu** (draw from these when generating sub-variants):
- **Substitute** — swap the illustration style, replace the imagery approach (photo → geometric shapes)
- **Magnify/Minify** — make the hero element dominate the canvas, or shrink it and let whitespace breathe
- **Eliminate** — remove all imagery and let typography carry the design, or remove all text except the headline
- **Reverse** — flip the visual hierarchy (subtitle as hero, background becomes foreground)
- **Adapt** — "what if this were a magazine cover?" or "what if this were a data dashboard?"
- **Combine** — integrate text into the illustration, merge two visual elements into one

This is a reasoning aid, not a checklist — use whichever transformations produce the most interesting variants for the specific concept.

### Fixation awareness

**The agent's own prior outputs are fixation anchors.** Polished outputs become *stronger* fixation anchors than rough sketches because they look "finished." Each iteration risks narrowing the creative space rather than expanding it.

Countermeasures:
- When generating sub-variants, reference the **Creative Brief and original concept description** — not just the latest frame. The brief captures the intent; the frame captures one execution of that intent.
- When the user says "something feels off" after several iterations, consider whether the direction has drifted from the original concept. The fix may be a reset, not another incremental change.
- The re-anchor to intent check (every 3-4 rounds) exists for this reason — creative drift is the norm, not the exception.

**When to parallelize vs build sequentially:**

| Situation | Parallel or sequential? |
|---|---|
| Build N selected directions | **Parallel** — each is independent |
| "Build 3 new variations of option 1" | **Parallel** — each variation is independent |
| "Fix the logo on all 3 frames" | **Parallel** — same fix applied independently |
| "Make option 1 darker" | **Sequential** — single frame |
| Canvas orchestration (archive, recolor sections) | **Sequential** — coordination-dependent |
| Feedback interpretation ("something feels off") | **Sequential** — requires parent judgment |

**Expect 3-5+ feedback rounds.** Creative preferences emerge progressively. This is normal.

**When feedback is ambiguous** ("something feels off"): ask for specifics before acting.

**Re-anchor to intent:** After every 3-4 iteration rounds, re-read the Creative Brief from `state.json` to verify work still aligns with the original messaging goals. Internal discipline — don't announce it.

**When a direction splits into sub-directions:** Create new direction entries in `state.json`, each with its own `iterations` array, `sectionNodeId`, and `concept`. Create new Figma Sections. The first iteration of each new direction gets `trigger: "split"`. The parent direction's `status` stays `active` if it still has its own path, or moves to `archived` if fully replaced.

Repeat until user approves, then proceed to Step 6 (export).

---

## Interaction model (CLI context)

The skill runs in Claude Code (CLI) — the agent cannot display images inline. The Figma canvas is the presentation medium.

**Screenshots are internal quality gates:**
- **Builder self-checks** (`figma_capture_screenshot`): Quick visual verification during construction.
- **Reviewer subagent** (`capture-for-review.ts` → reviewer): Full brand compliance + craft evaluation at 1568px + 400px. Runs on every frame before the user sees it.

The user never sees screenshots — they see the work in Figma.

### Converge presentation contract

When presenting options to the user:
1. Direct the user to the Figma canvas: page name, section names
2. Summary table: `| # | Section | Visual concept | Key differentiator |`
3. Agent's recommendation with reasoning (brand fit, thumbnail readability, how well it communicates the key message)
4. At least one acknowledged alternative and what it does well
5. Clear ask: "Pick favorites", "Pick finalists", or "Anything to adjust?"

Do NOT include: frame IDs, coordinates, tool calls made, task status. Messages carry substance, not mechanics.

### Ask-or-proceed protocol

| Situation | Action |
|---|---|
| Building frames, collecting assets, organizing canvas | **Proceed** |
| All frames built for a round | **Ask** — present and wait |
| User gives explicit feedback ("make the logo bigger") | **Proceed** — apply the fix |
| User gives ambiguous feedback ("something feels off") | **Ask** — request specifics |
| User approves finals | **Proceed** to export |

---

## Canvas organization

Use **Figma Sections** as the organizational primitive. Sections are native canvas elements that show in the layer panel, have selectable boundaries, support color coding, and can be linked for sharing.

**The canvas IS the user interface.** Since the agent can't display images in the CLI, the Figma canvas is the only place the user sees the work. It must be self-explanatory.

### Hierarchy

| Level | Figma primitive | Purpose | Example |
|---|---|---|---|
| **File** | File | One workspace | Inkeep Agent Graphics Workspace |
| **Page** | Page | One project | `[2026-03-18] Blog — Agents in Slack covers` |
| **Section** | Section | One direction | `Immersive Slack Thread` |
| **Frame** | Frame | One iteration | `Blog/Cover/1A-v2` |
| **Layers** | Mixed | Elements inside a frame | `bg`, `headline`, `logo-lockup` |

### Section color coding

| Color | Meaning |
|---|---|
| **Default** (no fill) | Active exploration |
| **Green** | Selected finalist |
| **Gray** | Archive — discarded |

### Naming conventions

| Level | Pattern | Examples |
|---|---|---|
| **Page** | `[YYYY-MM-DD] {Medium} — {Description}` | `[2026-03-18] Blog — Agents in Slack covers` |
| **Section** | Human-readable direction name | `Immersive Slack Thread`, `Multi-Agent Cards`, `Archive` |
| **Frame** | `{Medium}/{Format}/{ID}-{Name}` with `-v{N}` for iterations | `Blog/Cover/1A-Immersive-Thread`, `Blog/Cover/1A-v2` |
| **Layers** | Semantic role names | `bg`, `headline`, `bot-avatar-inkeep`, `third-party/slack-icon` |

The section carries the direction name (what concept). The frame carries the iteration ID (which version). Position within the section (left-to-right) shows progression order.

### When a direction splits

| Change type | Same section or new? |
|---|---|
| Refinement / polish iteration (v2, v3) | **Same section** — add frame to the right |
| Conceptually different angle | **New section** — it's its own direction |
| "Try this but darker" | **Same section** — variation, not new concept |
| "What if instead of a thread, we showed channels?" | **New section** — different concept |

### Organization is continuous

Every new frame is placed inside its section immediately upon creation. Section colors update when the user selects favorites or discards directions. The agent never presents a frame without it being correctly positioned.

### Layout constants

- `GAP_X = 100px` between frames within a section
- `GAP_Y = 100px` between sections
- `SECTION_PADDING = 60px` inside sections
- Frame dimensions from the format file (e.g., 1280x720 for blog cover)

**Section stacking:** Sections stack **vertically** (top to bottom) — each new direction appears below the previous one. Iterations within a section go **left to right**. This creates a grid: rows = directions, columns = iterations.

**Initial section size:** Set each section's initial dimensions to match the target frame size plus padding: width = frame width + 2×SECTION_PADDING, height = frame height + 2×SECTION_PADDING. This ensures the section starts at a meaningful size rather than collapsing to zero. Sections expand automatically as more iterations are added to the right.

### Section creation

```javascript
// via figma_execute
const section = figma.createSection();
section.name = "Immersive Slack Thread";
// Set initial size to match target frame + padding
const frameW = 1280; // from format file
const frameH = 720;
section.resizeWithoutConstraints(frameW + 2 * 60, frameH + 2 * 60);
// Sections expand as children are added
// Place frames inside with section.appendChild(frame)
```

---

## State persistence

Graphics exploration sessions can be 50+ turns. Without structured state, the agent loses track of which directions were selected, what feedback was given, and what frames exist on the canvas.

### Directory structure

```
tmp/graphics/<page-slug>/
├── state.json              # Shared coordination surface — all project context
├── assets/                 # Third-party logos and other SVGs (referenced by path in state.json)
│   ├── slack-logo.svg
│   └── github-logo.svg
└── build-results/          # Child process outputs (one file per direction per round)
    ├── <direction-slug>.json
    └── ...
```

**SVG file convention:** Save third-party logo SVGs and other fetched assets to the `assets/` subdirectory. Reference them by file path in `state.json` — never inline SVG content directly in JSON. This avoids JSON escaping issues and keeps `state.json` readable.

The `<page-slug>` is derived from the Figma page name by slugifying: lowercase, spaces → hyphens, strip brackets/dates/special chars. Example: `[2026-03-18] Blog — Agents in Slack covers` → `2026-03-18-blog-agents-in-slack`.

`state.json` is the single source of truth. It holds shared context (Creative Brief, assets, Figma IDs), per-direction state, and the full iteration history including user feedback. It also serves as the coordination surface for `/nest-claude` children — each child reads it to get its assignment.

### state.json — direction-oriented model

State is organized by **direction** (not by frame). Each direction tracks its full iteration history — what was built, what feedback was given, what changed. A child building iteration v3 sees the complete history and knows exactly what to keep and what to fix.

```json
{
  "currentPhase": "iterate",
  "figma": {
    "fileKey": "S5kGTPZ0kSjmSxusJ56QJH",
    "pageId": "32:2"
  },
  "format": "blog-cover",
  "creativeBrief": {
    "goal": "Drive click-through to blog post",
    "audience": "Technical decision-makers",
    "keyMessage": "Inkeep agents now live natively in Slack",
    "heroContent": "Slack thread with @Inkeep mention and response",
    "tone": "Technical, modern, clean, collaborative",
    "cta": "Read the blog post"
  },
  "assets": {
    "inkeepLogoSvg": "<svg>...</svg>",
    "thirdPartyLogos": [{ "name": "Slack", "svg": "<svg>..." }],
    "fontsVerified": true,
    "brandTokensFile": "tokens/marketing.md"
  },
  "productContext": {
    "feature": "Inkeep agents responding in Slack channels with tool approvals",
    "fidelityLevel": "Level 3 — stylized mockup",
    "referenceDir": "tmp/reference/agents-in-slack/",
    "keyUIElements": ["Slack message thread", "bot avatar", "user avatar", "approve/deny buttons", "channel header"]
  },
  "conceptsProposed": [
    { "name": "Slack UI mockup", "selected": true },
    { "name": "Hub-and-spoke", "selected": false }
  ],
  "directions": {
    "immersive-slack-thread": {
      "name": "Immersive Slack Thread",
      "sectionNodeId": "61:390",
      "concept": {
        "name": "Immersive Slack Thread",
        "visual": "Stylized Slack message thread with @Inkeep responding",
        "whyItWorks": "Product-as-marketing — shows the feature in action"
      },
      "buildSpec": {
        "endStateVision": "A warm cream canvas with a large, slightly rotated Slack thread mockup...",
        "successCriteria": [
          "The Slack mockup looks like a real Slack conversation",
          "The heading reads clearly at 300px thumbnail width",
          "The Approve/Deny buttons are recognizable Slack Block Kit style"
        ],
        "thumbnailSketch": "At 400px: heading dominates left, white mockup card visible right...",
        "recipes": { "productMockup": true, "badge": true },
        "atomAudit": {
          "tier1": ["headline → Figma", "badge → Figma", "logo (Inkeep) → Brand Assets clone"],
          "tier2": [
            { "atom": "Slack thread mockup", "candidates": ["Figma native", "Image Gen"], "selected": "Figma native", "why": "Compound element requiring editable sub-elements", "whyNotRunnerUp": "Image Gen: raster, sub-elements not independently editable", "pipeline": "—" }
          ],
          "subElements": [
            { "parent": "Slack thread mockup", "element": "User avatar", "tier": 2, "method": "Quiver portrait", "why": "Organic illustrated style matching brand; Figma circles lack personality", "visualRef": "—", "criterion": "Illustrated, not a colored circle" },
            { "parent": "Slack thread mockup", "element": "Inkeep bot avatar", "tier": 1, "method": "Brand Assets clone", "visualRef": "—", "criterion": "Canonical asset" },
            { "parent": "Slack thread mockup", "element": "Approve button", "tier": 1, "method": "Figma, Slack green", "visualRef": "tmp/reference/slack-buttons.jpg", "criterion": "Slack Block Kit style" }
          ]
        }
      },
      "status": "active",
      "color": "green",
      "iterations": [
        {
          "id": "1A",
          "frameNodeId": "32:152",
          "frameName": "Blog/Cover/1A-Immersive-Thread",
          "trigger": "initial-diverge",
          "instruction": null,
          "reviewerVerdict": "PASS",
          "userVerdict": "needs-fixes",
          "userFeedback": "Logo is wrong, avatar looks generic"
        },
        {
          "id": "1A-v2",
          "frameNodeId": "33:335",
          "frameName": "Blog/Cover/1A-v2",
          "trigger": "user-feedback",
          "instruction": "Fix logo with real SVG, use Inkeep icon for bot avatar",
          "reviewerVerdict": "PASS",
          "userVerdict": "approved"
        }
      ]
    }
  },
  "lastUpdated": "2026-03-18T18:45:00Z"
}
```

### Direction status lifecycle

| Status | Meaning |
|---|---|
| `active` | Direction is being worked on |
| `approved` | User approved the latest iteration |
| `archived` | Direction was discarded |

### Iteration fields

| Field | Purpose |
|---|---|
| `id` | Short identifier (1A, 1A-v2, etc.) |
| `frameNodeId` | Figma node ID of the built frame |
| `frameName` | Frame name in Figma (slash-hierarchy) |
| `trigger` | Why created: `initial-diverge`, `user-feedback`, `new-variant`, `split` |
| `instruction` | What the user asked for (null on initial diverge) |
| `reviewerVerdict` | `PASS`, `PASS WITH SUGGESTIONS`, or `NEEDS REVISION` |
| `userVerdict` | `approved`, `needs-fixes`, `archived`, or null (not yet presented) |
| `userFeedback` | What the user said (null if approved or not yet reviewed) |

### Child result file (`build-results/<direction-slug>.json`)

Each `/nest-claude` child writes one iteration entry that the parent appends to the direction. The `reviews` array captures every reviewer round with structured findings for retrospective visibility into reviewer performance.

```json
{
  "directionSlug": "immersive-slack-thread",
  "iteration": {
    "id": "1A",
    "frameNodeId": "61:392",
    "frameName": "Blog/Cover/1A-Immersive-Thread",
    "trigger": "initial-diverge",
    "instruction": null
  },
  "reviews": [
    {
      "round": 1,
      "verdict": "NEEDS REVISION",
      "findings": [
        {
          "issue": "Arrows form a sequential cycle instead of converging to center agent",
          "severity": "critical",
          "evidence": "4 independent arcs connect nodes clockwise — none point to/from center hub"
        },
        {
          "issue": "Arrow curves have inconsistent radii",
          "severity": "minor",
          "evidence": "Slack→Tickets arc is ~40% wider than GitHub→KB arc"
        }
      ],
      "revisionInstructions": ["Redraw arrows converging to center", "Use consistent arc radius"]
    },
    {
      "round": 2,
      "verdict": "PASS",
      "findings": []
    }
  ],
  "decompositionChanges": [
    {
      "atom": "Slack thread mockup",
      "change": "Further decomposed — parent listed 3 sub-elements, child found 7",
      "addedSubElements": [
        { "element": "typing indicator", "tier": 1, "method": "Figma native" },
        { "element": "read receipts", "tier": 1, "method": "Figma native" }
      ],
      "methodChanges": [
        { "element": "user avatar", "parentMethod": "Figma circle", "childMethod": "Quiver illustration", "reason": "Organic portrait needed for brand consistency" }
      ]
    }
  ],
  "status": "complete",
  "error": null
}
```

### When state is updated

Event-driven (not cadence-based):

| Event | What updates in state.json |
|---|---|
| Step 1c complete | Write `productContext` (feature, fidelity, referenceDir, key elements) |
| Phase 0 complete | Write `conceptsProposed` with selections |
| Page + Sections created | Write `figma.pageId`, per-direction `sectionNodeId` |
| Frame built and verified | Append new iteration to direction's `iterations` array |
| All frames presented | Set latest iterations' `userVerdict` to null (awaiting) |
| User gives feedback | Set `userVerdict` to `needs-fixes`, record `userFeedback` |
| User approves | Set `userVerdict` to `approved`, direction `status` to `approved` |
| User archives a direction | Set direction `status` to `archived` |
| Direction splits | Create new direction entries with `trigger: "split"` on first iteration |

### Session detection and re-entry

**On any `/graphics` invocation**, check `tmp/graphics/` for existing project state. If state files exist for the current request's topic, offer to resume:

> "I found an existing graphics session for 'Agents in Slack covers' with 3 directions built. Resume that project, or start fresh?"

**On re-entry after context compression**, the agent:
1. Reads `state.json` — knows current phase, all directions, their full iteration histories
2. Re-anchors to the Creative Brief — verifies work still aligns with messaging goals
3. Checks Figma canvas via `figma_get_status` — verifies canvas matches state
4. Identifies next action: find directions with `status: active` where the latest iteration has `userVerdict: needs-fixes`, or where no iteration exists yet
