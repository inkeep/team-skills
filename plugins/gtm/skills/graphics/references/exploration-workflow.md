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

After the user selects, proceed to Step 2 (asset collection) and Phase 1 (diverge).

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
3. Write `state.json` with shared context: Creative Brief, collected assets, Figma IDs, format (see State Persistence below)
4. Create `directions/` directory
5. Write one `directions/<slug>.json` per selected direction — each with a `spec` timeline event containing the concept + Build Spec (see Direction File schema below)

### Build (parallel via /nest-claude)

When building ≥2 directions, spawn parallel Claude Code child processes via `/nest-claude`. Each child is a full Claude Code instance — it can use MCP tools and spawn its own reviewer subagent.

**Why `/nest-claude` instead of the Agent tool:** Subagents cannot spawn other subagents. Each frame needs two-layer verification (which requires spawning a reviewer subagent), so the frame-builder must be a full Claude Code process.

Spawn all children in a single message (concurrent background Bash commands):

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Your state directory is: tmp/graphics/<page-slug>/
Your direction slug is: immersive-slack-thread

1. Load '/brand' skill and '/graphics' skill. Then read these reference files from the graphics skill — they contain the craft knowledge, code recipes, and failure modes you need throughout the build:
   - references/craft-elevation.md (AI failure modes, elevation strategies, spatial fidelity checks)
   - references/method-selection.md (per-atom method decision tree)
   - references/figma-patterns.md (token binding, auto-layout patterns)
   - tools/figma-console.md (Figma API recipes, SVG centering, connector patterns)
   Reference brand and graphics guidance continuously as you build — not just at the start.
2. Read state.json for shared context (Creative Brief, collected assets, Figma IDs, product context)
3. Read directions/immersive-slack-thread.json — this is YOUR direction file. It has your concept, Build Spec, sectionNodeId, and full timeline of what's happened so far. The spec and assets are the parent's best starting point — NOT a prescription. You have full authority to adjust the spec, source better assets, or omit what doesn't serve your frame.
4. CRITICAL: ALL Figma nodes you create must go inside YOUR Section (sectionNodeId from your direction file). Never create at page root. Never touch other Sections. Use getNodeByIdAsync(sectionNodeId) to scope all operations.
5. Build the frame in your Section, run Phase B-E (decomposition, build, elevation)
6. Run Step 5 two-layer verification (spawn reviewer subagent)
7. Fix NEEDS REVISION findings, re-verify (max 3 iterations)
8. Append results to your direction file: spec-update events (if you adjusted the spec), a build event, and feedback events from reviewer rounds" \
    --dangerously-skip-permissions \
    --output-format json \
    < /dev/null 2>&1 | tee tmp/graphics/<page-slug>/directions/immersive-slack-thread-stdout.json
```

**Always spawn a child, even for a single direction.** The parent never builds frames — it orchestrates and verifies. This ensures consistent behavior and independent review.

### Each child's build cycle

⛔ **Section isolation (non-negotiable):** Every Figma node the child creates — frames, working atoms, imported SVGs, image fills, text, shapes, EVERYTHING — must be placed inside the child's assigned Section (by `sectionNodeId`). Never create nodes at page root. Never place nodes in another direction's Section. Never use `figma.currentPage` to scope operations — always use `getNodeByIdAsync(sectionNodeId)`. The working atoms frame, the final composition frame, and all intermediate artifacts live inside your Section. If a node ends up outside your Section, move it immediately or delete it. Violating section isolation pollutes other children's work and is the #1 cause of cross-direction contamination in parallel builds.

1. Read `state.json` for shared context → Creative Brief, collected assets, Figma file key, product context
2. Read `directions/<your-slug>.json` → your direction file. The latest `spec` event is your Build Spec. Scan `feedback` events for what to act on. Scan `build` events for previous iterations.
3. Load `/brand` skill and `/graphics` skill. Read the key reference files from the graphics skill — these contain craft knowledge, code recipes, and failure modes you need throughout:
   - `references/craft-elevation.md` (AI failure modes, elevation strategies, spatial fidelity)
   - `references/method-selection.md` (per-atom method decision tree)
   - `references/figma-patterns.md` (token binding, auto-layout patterns)
   - `tools/figma-console.md` (Figma API recipes, SVG centering, connector patterns)
   Reference brand and graphics guidance continuously as you build — not just at the start.
4. **Autonomy — you own this direction file.** The parent's `spec` event is a starting point, not a contract. You have full authority to:
   - **Adjust the spec** — change composition, layout, success criteria, atom methods, or anything else that serves the direction better. Append a `spec-update` event for each adjustment with what you changed and why.
   - **Replace, augment, or omit assets** — source different icons from the brand library, create new illustrations via Quiver, fetch additional third-party logos, or skip assets that don't strengthen the composition. Record in `spec-update` events.
   - The reviewer reads your direction file — it sees both the original spec AND your adjustments, so your reasoning is visible.
5. Verify the Build Spec (latest `spec` event + any `spec-update` events you've appended) is complete — end-state vision, success criteria, information architecture, atom audit. If building a new direction without a spec, append a `spec` event first.
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
   - If decomposition reveals new atoms or changes methods, append `spec-update` events to your direction file.
   - Then plan the build order (method-aware: asset fetches → external generations → Figma shapes → imports → compounds → connections).
7. Step 4, Phases A, C-D: Stage assets, build atoms bottom-up, compose final design (targeting Section by node ID). **Place the final composition frame at the x-position computed in step 5** — the working atoms frame can go anywhere within the Section, but the final frame must be positioned for left-to-right iteration progression.
8. **Phase E: 3-pass self-critique (all passes mandatory, recursive).** `references/craft-elevation.md` should already be loaded from Phase C. Pass 1: structural correctness (meet success criteria). Pass 2: craft elevation (push every element from "correct" to "rich" — count depth stack layers, evaluate each atom against elevation strategies, implement ≥2 elevations). Pass 3: cohesion and polish (unified composition, spacing rhythm, thumbnail integrity, micro-polish). **Recursive:** after Pass 3, ask "what would a design lead push back on?" — if the answer isn't "nothing," run another Pass 2 → Pass 3 cycle. Max 5 total passes. Stop when: depth stack ≥5, all atoms at "Elevated," cohesion test passes, no actionable improvement remaining. Do not proceed to the reviewer until the elevation loop exits.
9. Step 5: Two-layer verification loop (max 3 iterations):
   - Layer 1: programmatic checks (`figma_lint_design`, bounds, dimensions). Fix until clean.
   - Layer 2: reviewer subagent (`capture-for-review.ts` → reviewer evaluates at 1568px + 400px). Pass the Build Spec's success criteria AND information architecture as evaluation context.
   - The reviewer returns structured findings. **Append a `feedback` event** to your direction file for each review round — verdict, findings with evidence, and revision instructions.
   - Read verdict: **PASS** → proceed. **PASS WITH SUGGESTIONS** → implement quick fixes, proceed. **NEEDS REVISION** → assess findings against context, apply valid fixes, restart from Layer 1.
   - After 3 iterations without PASS → set direction file `status` to `error`.
   - **Every frame must pass the self-critique loop AND the reviewer before the user sees it.** No exceptions. Self-reported verdicts (`SELF-REVIEWED`, `SELF_PASS`) do not count.
10. Append a `build` event to your direction file with the frame's iteration ID, node ID, and name.

### Collect results (parent, serialized)

After all children complete:
1. Read each `directions/<slug>.json` — children have already appended their timeline events (spec-update, build, feedback)
2. Present to user using the converge contract (see Interaction Model below)

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
5. **Persist** — Append `feedback` event (with user's verdict and feedback) to the direction file. Set `status` and `color` on the direction file if needed (approved/archived).
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

**When a direction splits into sub-directions:** Create new direction files in `directions/`, each with its own `sectionNodeId` and a `spec` event containing the new concept (with `splitFrom` provenance). Create new Figma Sections. The original direction gets a `feedback` event with `"verdict": "split"`. The new direction's first `build` event gets `trigger: "split"`. The original direction's `status` stays `active` if it still has its own path, or moves to `archived` if fully replaced.

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
- `SECTION_PADDING = 60px` offset of first frame from section origin
- Frame dimensions from the format file (e.g., 1280x720 for blog cover)

**Section stacking:** Sections stack **vertically** (top to bottom) — each new direction appears below the previous one. Iterations within a section go **left to right**. This creates a grid: rows = directions, columns = iterations.

**Sections auto-expand.** Figma Sections automatically resize to contain their children. Do not manually set section dimensions — just create the section and `appendChild()` frames into it. The section grows as frames are added.

### Section creation

```javascript
// via figma_execute
const section = figma.createSection();
section.name = "Immersive Slack Thread";
// Transparent background — sections are logical containers, not visual elements
section.fills = [];
// No manual sizing needed — sections auto-expand to contain children
// Place frames inside with section.appendChild(frame)
```

**Transparent sections:** Set `section.fills = []` to remove the default background fill. Sections serve as logical grouping containers on the canvas — they don't need visible backgrounds. This eliminates sizing concerns entirely: the section boundary adapts to whatever frames are inside it.

---

## State persistence

Graphics exploration sessions can be 50+ turns. State is split into two layers: **shared context** (`state.json`, parent-owned, immutable after setup) and **per-direction state** (`directions/<slug>.json`, append-only timeline owned by the child).

### Directory structure

```
tmp/graphics/<page-slug>/
├── state.json              # Shared context only — Creative Brief, collected assets, Figma IDs
├── assets/                 # Collected assets — logos, SVGs, references gathered by parent (starting kit, not prescriptive)
│   ├── slack-logo.svg
│   └── github-logo.svg
└── directions/             # One file per direction — owned by the child, append-only timeline
    ├── immersive-slack-thread.json
    └── multi-agent-cards.json
```

**SVG file convention:** Save third-party logo SVGs and other fetched assets to the `assets/` subdirectory. Reference them by file path — never inline SVG content directly in JSON. Children may also save newly sourced assets here during their build.

The `<page-slug>` is derived from the Figma page name by slugifying: lowercase, spaces → hyphens, strip brackets/dates/special chars. Example: `[2026-03-18] Blog — Agents in Slack covers` → `2026-03-18-blog-agents-in-slack`.

**Direction discovery:** To find all directions, list `directions/*.json`. To get the overview (name + status), read each file's top-level fields. No index needed — the filesystem is the index.

### state.json — shared context only

`state.json` holds context shared across ALL directions. It is owned by the parent — children read it but never write to it. It contains no direction-specific data and no mutable state.

```json
{
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
  "collectedAssets": {
    "note": "Starting kit — children may use, replace, augment, or omit any of these",
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
  }
}
```

### Direction file — append-only timeline

Each direction gets its own file at `directions/<slug>.json`. This is the **single source of truth** for everything about a direction — concept, spec, builds, reviews, feedback. The parent creates it with the initial `spec` event. The child reads it, appends events, and writes it back. The reviewer reads it to get evaluation context.

**The timeline is append-only.** The only mutable fields are `status`, `color`, and `sectionNodeId` (set once). Everything else is captured as timeline events — nothing is overwritten or deleted.

**Four event types:**

| Type | Writer | What it captures |
|---|---|---|
| `spec` | parent | The full Build Spec — concept, end-state vision, success criteria, thumbnail sketch, recipes, atom audit with sub-element decomposition. Written once as the initial entry. Immutable. For split directions, includes `splitFrom` provenance. |
| `spec-update` | child | A delta to the spec — what field changed, what it changed to, and why. Covers method changes, new/removed atoms, asset replacements, layout adjustments, recipe additions, criteria changes. |
| `build` | child | A frame was built — iteration ID, Figma node ID, frame name, trigger, and instruction (what this iteration was responding to). |
| `feedback` | reviewer / user | Reviewer: verdict + findings + revision instructions. User: verdict + feedback text. |

**Reading pattern for the child:** `spec` event = the brief. All `spec-update` events = adjustments. Last `feedback` event = what to act on. All `build` events = previous iterations for positioning.

```json
{
  "slug": "immersive-slack-thread",
  "name": "Immersive Slack Thread",
  "sectionNodeId": "61:390",
  "status": "active",
  "color": "default",

  "timeline": [
    { "type": "spec", "by": "parent",
      "data": {
        "concept": { "name": "Immersive Slack Thread", "visual": "Stylized Slack message thread with @Inkeep responding", "whyItWorks": "Product-as-marketing — shows the feature in action" },
        "endStateVision": "A warm cream canvas with a large, slightly rotated Slack thread mockup showing an @Inkeep mention, bot response with tool approval buttons, and a subtle dot-grid background texture",
        "successCriteria": [
          "The Slack mockup looks like a real Slack conversation — not rectangles with labels",
          "The heading reads clearly at 300px thumbnail width",
          "The Approve/Deny buttons are recognizable Slack Block Kit style",
          "Background has visible texture (not a flat solid fill)"
        ],
        "thumbnailSketch": "At 400px: heading dominates left, white mockup card visible right, badge whispers top-left, cream background with dot grid barely visible",
        "recipes": { "productMockup": true, "badge": true, "codeAsVisual": false, "metricCallout": false, "logoComposition": true, "quoteCard": false },
        "atomAudit": {
          "tier1": ["headline → Figma", "badge → Figma", "logo (Inkeep) → Brand Assets clone"],
          "tier2": [
            { "atom": "Slack thread mockup", "candidates": ["Figma native", "Image Gen"], "selected": "Figma native", "why": "Compound element requiring editable sub-elements", "whyNotRunnerUp": "Image Gen: raster, sub-elements not independently editable", "pipeline": "—" }
          ],
          "subElements": [
            { "parent": "Slack thread mockup", "element": "User avatar", "tier": 2, "method": "Quiver portrait", "why": "Organic illustrated style matching brand; Figma circles lack personality", "visualRef": "—", "criterion": "Illustrated, not a colored circle" },
            { "parent": "Slack thread mockup", "element": "Inkeep bot avatar", "tier": 1, "method": "Brand Assets clone", "visualRef": "—", "criterion": "Canonical asset" },
            { "parent": "Slack thread mockup", "element": "Channel header bar", "tier": 1, "method": "Figma native", "visualRef": "tmp/reference/slack-channel.png", "criterion": "Slack-accurate" },
            { "parent": "Slack thread mockup", "element": "Approve/Deny buttons", "tier": 1, "method": "Figma native (Slack green)", "visualRef": "tmp/reference/slack-buttons.jpg", "criterion": "Slack Block Kit style" },
            { "parent": "Slack thread mockup", "element": "Message text", "tier": 1, "method": "Figma text", "visualRef": "—", "criterion": "Realistic agent response content" }
          ]
        }
      }
    },

    { "type": "spec-update", "by": "child",
      "data": { "field": "atomAudit.subElements.userAvatar.method", "to": "Quiver illustration", "reason": "Figma circle looked flat — organic portrait matches brand better" } },

    { "type": "build", "by": "child",
      "data": { "id": "1A", "frameNodeId": "32:152", "frameName": "Blog/Cover/1A-Immersive-Thread", "trigger": "initial-diverge", "instruction": null } },

    { "type": "feedback", "by": "reviewer",
      "data": { "verdict": "NEEDS REVISION", "findings": [
        { "issue": "Arrows form sequential cycle instead of converging to center agent", "severity": "critical", "evidence": "4 independent arcs connect nodes clockwise — none point to/from center hub" },
        { "issue": "Arrow curves have inconsistent radii", "severity": "minor", "evidence": "Slack→Tickets arc is ~40% wider than GitHub→KB arc" }
      ], "revisionInstructions": ["Redraw arrows converging to center", "Normalize arc radius across all connectors"] } },

    { "type": "feedback", "by": "reviewer",
      "data": { "verdict": "PASS" } },

    { "type": "feedback", "by": "user",
      "data": { "verdict": "needs-fixes", "feedback": "Logo is wrong, avatar looks generic" } },

    { "type": "spec-update", "by": "child",
      "data": { "field": "atomAudit.subElements.botAvatar.method", "to": "Brand Assets clone", "reason": "User feedback — use canonical asset instead of approximation" } },

    { "type": "build", "by": "child",
      "data": { "id": "1A-v2", "frameNodeId": "33:335", "frameName": "Blog/Cover/1A-v2", "trigger": "user-feedback", "instruction": "Fix logo with real SVG, use Inkeep icon for bot avatar" } },

    { "type": "feedback", "by": "reviewer",
      "data": { "verdict": "PASS" } },

    { "type": "feedback", "by": "user",
      "data": { "verdict": "approved" } }
  ]
}
```

### Direction status lifecycle

| Status | Meaning |
|---|---|
| `active` | Direction is being worked on |
| `approved` | User approved the latest iteration |
| `archived` | Direction was discarded |
| `error` | Child failed after 3 reviewer iterations |

### Section color coding

The `color` field on the direction file maps to Figma Section colors:

| Color | Meaning |
|---|---|
| `default` | Active exploration (no fill) |
| `green` | Selected finalist |
| `gray` | Archived / discarded |

### When state is updated

| Event | Where | What happens |
|---|---|---|
| Step 1c complete | `state.json` | Write `productContext` |
| Page + Sections created | direction files | Create direction files with `sectionNodeId` and initial `spec` event. Write `figma.pageId` to state.json |
| Child adjusts spec | direction file | Child appends `spec-update` event |
| Frame built and verified | direction file | Child appends `build` event |
| Reviewer returns verdict | direction file | Child appends `feedback` event (with findings + revision instructions) |
| User gives feedback | direction file | Parent appends `feedback` event to direction file |
| User approves | direction file | Parent appends `feedback` event with `"verdict": "approved"`. Sets `status` to `approved`, `color` to `green` |
| User archives a direction | direction file | Sets `status` to `archived`, `color` to `gray` |
| Direction splits | new direction files | Create new direction files with `spec` events (including `splitFrom` provenance). Original direction gets a `feedback` event with `"verdict": "split"` |

### Session detection and re-entry

**On any `/graphics` invocation**, check `tmp/graphics/` for existing project state. If state files exist for the current request's topic, offer to resume:

> "I found an existing graphics session for 'Agents in Slack covers' with 3 directions built. Resume that project, or start fresh?"

**On re-entry after context compression**, the agent:
1. Reads `state.json` — shared context (Creative Brief, assets, Figma IDs)
2. Lists `directions/*.json` — reads each file's `status` + `name` for the overview
3. Reads direction files for active directions — the timeline has the full history (specs, builds, feedback)
4. Re-anchors to the Creative Brief (in state.json) — verifies work still aligns with messaging goals
5. Checks Figma canvas via `figma_get_status` — verifies canvas matches state
6. Identifies next action: find directions with `status: active` where the latest `feedback` event has `"verdict": "needs-fixes"`, or where no `build` event exists yet
