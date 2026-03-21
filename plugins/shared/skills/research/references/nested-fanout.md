Use when: (1) At Step 3, when the rubric has 5+ P0/Deep independent dimensions — fanout replaces standard research for the initial pass. (2) At Step 6, when the user requests 2+ deep-dive follow-ups simultaneously. (3) When `--fanout` is passed in headless mode. Spawns parallel /research --headless instances and consolidates findings back into the parent report.
Priority: P1
Impact: Without this, multi-direction deep dives require manual orchestration — crafting prompts, managing temporary directories, analyzing applicability, merging evidence files, enriching the report, and cleaning up. Typical manual effort: 1-2 hours.

---

# Nested Fanout: Parallel Deep-Dive Research with Consolidation

Spawn parallel `/research --headless` instances for multiple follow-up directions, then consolidate all findings back into the parent report. Sub-reports live in a run-scoped `fanout/<run-id>/` directory inside the parent report and are preserved after consolidation for auditability.

---

## When to use nested fanout

Nested fanout triggers at two points in the research workflow:

**At Step 3 (initial research pass):** When the rubric has 5+ P0/Deep dimensions that are largely independent, in-context subagents will produce thin coverage — each gets a fraction of the parent's context window. Nested fanout gives each dimension group its own full context window and research pass. When triggered at Step 3, fanout **replaces Steps 3 AND 4** — sub-instances produce their own research, consolidation produces the final REPORT.md.

**At Step 6 (follow-up iteration):** When the user selects 2+ deep-dive follow-up directions, or when `--fanout` auto-selects them in headless mode. When triggered at Step 6, a parent REPORT.md already exists — the consolidation enriches it with sub-report findings.

**When NOT to use fanout:**
- ≤2 dimensions or directions — use solo mode or Path C update
- Dimensions are light (1-2 facets, single source) — subagents (Step 3.2) suffice
- Dimensions are dependent on each other (output of one informs another) — run sequentially
- User wants a quick landscape scan before going deep — do a standard pass first, then fanout on follow-ups

**Cost and time:** Fanout typically costs 3-5x a standard research pass. Each sub-report is a full `/research --headless` invocation. Budget 15-30 minutes for a 3-5 instance fanout. Use for genuinely deep research where subagent-level investigation is insufficient.

**Step 3 vs Step 6 prompt difference:** At Step 3, the "existing findings" section of the sub-research prompt is empty (no prior research exists). At Step 6, it contains extracted findings from the parent report. The prompt template handles both — `{{extracted_findings_from_parent_evidence}}` is simply empty for Step 3.

---

**Prerequisites:**
- For Step 6: A completed research pass (Steps 1-6) with a parent REPORT.md
- For Step 3: A confirmed rubric (Step 1 complete) and report directory (Step 2 complete)
- 2+ directions/dimensions assessed as "heavy" (3+ facets, multi-source)
- The `/nest-claude` skill for subprocess spawning conventions

**Key constraints:**
- All citations in sub-reports must be external primary sources (GitHub, npm, blogs) — never paths to sibling fanout directories
- Sub-reports inherit the parent's non-goals (don't drift into excluded areas)
- The consolidated parent report reads as one coherent document — not a patchwork of merged content
- Zero citation leakage — no references to `fanout/` sub-report paths survive in the consolidated output (REPORT.md and evidence/ must cite external sources only)

---

## Phase 0: Create workflow checkpoint tasks

⛔ **ALWAYS THE FIRST ACTION.** Before doing anything else, create tasks for each phase:

```
TaskCreate: "Fanout: Create run + assess directions"           → in_progress
TaskCreate: "Fanout: Construct sub-research prompts"           → pending, blocked by #1
TaskCreate: "Fanout: Spawn nested instances"                   → pending, blocked by #2
TaskCreate: "Fanout: Collect results + quality check"          → pending, blocked by #3
TaskCreate: "Fanout: Compute merge plan"                       → pending, blocked by #4
TaskCreate: "Fanout: Execute consolidation"                    → pending, blocked by #5
TaskCreate: "Fanout: Validate + close run + report to user"     → pending, blocked by #6
```

Use `addBlockedBy` to enforce ordering. Mark each task `in_progress` when starting it, `completed` when done.

---

## Phase 1: Create fanout run

**Depth guard:** Check the `CLAUDE_FANOUT_DEPTH` environment variable before proceeding.
- **Unset:** Default to 1 (one level of fanout allowed).
- **0:** Do NOT fan out — fall back to deep research mode (Step 3.2 subagents). Mark the "Create run" task as completed with a note: "Depth limit reached, using subagents instead."
- **≥ 1:** Fanout allowed. Proceed with this phase. The current value will be decremented when spawning sub-instances (Phase 3).

Create a new run. The run ID follows the standard convention: `YYYY-MM-DD-<short-label>` (e.g., `2026-03-20-initial`, `2026-03-20-follow-up`). The fanout directory is scoped to this run — multiple fanout passes coexist without collision.

```bash
mkdir -p <parent-report>/meta/runs/<run-id>
mkdir -p <parent-report>/fanout/<run-id>
```

Write `RUN.md`:

```markdown
# Run: <run-id>

**Status:** Active
**Intent:** Fanout
**Created:** YYYY-MM-DD

## Parent Context
**Purpose:** [copied from parent report's rubric — this drives consolidation filtering]
**Primary question:** [from parent rubric]
**Non-goals:** [inherited — sub-research must not drift into these]

## Selected Follow-up Directions

| # | Direction | Facet Count | Source Diversity | Assessment |
|---|---|---|---|---|
| 1 | [direction name] | [count] | [single/multi] | [light/heavy] |
| 2 | ... | ... | ... | ... |

## Sub-instance Tracking

| Direction | Status | Report Path | Notes |
|---|---|---|---|
| [direction 1] | pending | fanout/<run-id>/[topic-kebab]/ | |
| [direction 2] | pending | fanout/<run-id>/[topic-kebab]/ | |

## Fanout Directory
`<parent-report>/fanout/<run-id>/`
```

The `fanout/` directory is **preserved after consolidation** for auditability — sub-reports can be traced back to their source if the consolidated report needs verification or a deeper dive later. Each fanout pass gets its own run-scoped subdirectory, so multiple passes don't collide.

---

## Phase 2: Construct sub-research prompts

For each selected direction, construct a prompt. Include:

| Section | Content | Source |
|---|---|---|
| Parent purpose | The rubric's "research purpose" and "primary question" | Parent REPORT.md |
| Parent non-goals | Inherited — sub-research must respect these | Parent REPORT.md |
| Existing findings | Extracted summary of what the parent established on this topic (10-30 lines) | Parent evidence files + relevant REPORT.md sections |
| Sub-research dimensions | Specific facets to investigate with priorities | Follow-up direction from Step 6 |
| Constraints | External citations only; `--headless` mode; frame findings for parent's purpose | Fixed |

**Prompt template:**

```markdown
You are conducting deep technical research as a follow-up to an existing report.

## PARENT REPORT CONTEXT
**Purpose:** {{parent_purpose}}
**Primary question:** {{parent_primary_question}}
**Non-goals (inherited — do not investigate these):**
{{parent_non_goals}}

## EXISTING FINDINGS ON THIS TOPIC
{{extracted_findings_from_parent_evidence — 10-30 lines, not the full REPORT.md}}

## YOUR RESEARCH TASK
{{follow_up_direction_description}}

## DIMENSIONS TO INVESTIGATE
{{dimensions_list_with_facets_and_priorities}}

## CONSTRAINTS
- All citations must be external primary sources (GitHub repos, npm packages, blog posts, official docs)
- Do NOT reference sibling reports or other fanout directories
- Frame all findings in terms of the parent report's purpose: {{parent_purpose}}
- Use --headless mode for all skill invocations
- **Output location:** Write your report to `{{fanout_dir}}/`. This is mandatory — do not create reports in any other directory.
- **Filename:** The report MUST be named `REPORT.md` (uppercase).
- **Evidence files:** You MUST create evidence files in `evidence/` with frontmatter — do not put all findings inline in REPORT.md.
```

**Prompt size target:** 150-300 lines including context. Extract the relevant portions of the parent report — do NOT include the full REPORT.md.

---

## Phase 3: Spawn nested instances

**Load:** The `/nest-claude` skill for subprocess spawning conventions.

For each selected direction, spawn a nested Claude Code instance. Use `CLAUDE_REPORTS_DIR` to direct sub-reports into the fanout directory, and decrement `CLAUDE_FANOUT_DEPTH` so children have one fewer level of nesting available:

```bash
CLAUDE_FANOUT_DEPTH=$((${CLAUDE_FANOUT_DEPTH:-1} - 1)) \
CLAUDE_REPORTS_DIR="<parent-report-dir>/fanout/<run-id>" \
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
  -p "<constructed prompt from Phase 2>" \
  --dangerously-skip-permissions \
  --no-session-persistence \
  < /dev/null 2>&1
```

If `CLAUDE_FANOUT_DEPTH` after decrement is > 0 AND propagation is desired, include `--fanout` in the sub-instance's prompt so the child can fan out further. If depth reaches 0, omit `--fanout` — the child's Phase 1 depth guard will prevent fanout regardless, but omitting the flag avoids unnecessary routing heuristic evaluation.

Launch all instances **in parallel** — use `run_in_background: true` on each Bash tool call, sending all calls in a single message.

Update RUN.md sub-instance tracking: status → spawned.

The research skill inside each subprocess picks up `CLAUDE_REPORTS_DIR` and creates `<parent-report>/fanout/<run-id>/<topic-kebab>/REPORT.md` using its normal naming conventions. `CLAUDE_FANOUT_DEPTH` propagates automatically via env var inheritance (see `/nest-claude` "What children inherit").

---

## Phase 4: Collect results + quality check

Wait for all instances to complete. For each:

**Relocation check (run first):** If `fanout/<run-id>/<topic>/REPORT.md` does NOT exist, scan `<reports-dir>/` for recently-created directories matching the sub-research topic name. If found, relocate the directory into `fanout/<run-id>/`. The `CLAUDE_REPORTS_DIR` env var is not 100% reliable — some sub-instances may create reports in the global reports directory instead.

**Success check (after relocation):**
1. Verify `fanout/<run-id>/<topic>/REPORT.md` exists (case-sensitive — must be uppercase `REPORT.md`)
2. Verify it has an Executive Summary section
3. Verify at least 1 evidence file exists in `fanout/<run-id>/<topic>/evidence/`

**Failure handling:**
- If a sub-instance fails any success check (missing REPORT.md, missing exec summary, OR zero evidence files): **retry once** — spawn a new instance with the same prompt.
- If the retry also fails: mark as failed in RUN.md, continue with successful sub-reports. Note the gap.
- If ALL sub-instances fail: report the failures to the user. The parent report stays unchanged. Mark the "Collect results" task as completed with a note. Skip to Phase 7 (report to user).

Update RUN.md sub-instance tracking with final statuses.

---

## Phase 5: Compute merge plan

Read each successful sub-report's REPORT.md (Executive Summary + findings sections). For each section, classify against the parent report's purpose:

| Classification | Criteria | Destination |
|---|---|---|
| **Enrich existing section** | Finding adds depth to a topic already covered in parent REPORT.md | Surgical edit to the relevant parent section |
| **New section** | Finding covers a topic not in parent REPORT.md that serves the parent's purpose | New section in parent REPORT.md |
| **Evidence only** | Detailed reference material that backs up claims but doesn't belong in narrative | Consolidated evidence file |
| **Cross-cutting synthesis** | Insight that spans 2+ sub-reports and doesn't naturally fit in any existing section | New synthesis section in parent REPORT.md |
| **Contradiction** | Sub-report finding contradicts a parent finding | Flag for resolution |
| **Drop** | Content outside parent's purpose or redundant with parent | Not merged |

**Contradiction resolution:** Sub-report finding wins if its evidence is stronger (deeper, more recent research on the specific topic). Parent finding wins if evidence is equivalent and sub-report is speculative. Document the resolution.

**Cross-cutting synthesis heuristic:** After classifying all content, look for insights that:
- Span 2+ sub-reports
- Don't naturally fit in any existing section
- Answer a question the parent's purpose implies but no individual section addresses

If such insights exist → plan a new synthesis section. If not → don't force one.

Write the plan to `<parent-report>/fanout/<run-id>/_plan.md`:

```markdown
# Consolidation Plan

## Parent purpose
{{purpose from rubric}}

## REPORT.md enrichments
| Parent section | What to add | Source sub-report | Est. lines |
|---|---|---|---|

## New sections
| Section name | Content summary | Sources | Insert before |
|---|---|---|---|

## Cross-cutting synthesis
| Insight | Sources | Proposed section |
|---|---|---|

## Contradictions
| Parent claim | Sub-report claim | Evidence comparison | Resolution |
|---|---|---|---|

## Evidence file consolidation
| Target file | Action (expand/create/keep) | Sources |
|---|---|---|

## Post-consolidation follow-ups
| Follow-up from Step 6 | Status after fanout |
|---|---|
| [direction A] | Covered — remove from follow-ups |
| [direction B] | Partially covered — update description |
| [new direction from sub-report] | Add to follow-ups |
```

**Evidence file merge rules:**
- Group by topic, not by source sub-report
- Parent evidence files on the same topic as sub-report evidence → expand the parent file
- Sub-report evidence on new topics → create new consolidated evidence file
- Multiple sub-report evidence files on the same topic → merge into one
- Deduplicate shared findings and citations
- All citations must be external primary sources — never paths to `fanout/`
- All evidence files must have frontmatter (title, description, created, last-updated)

---

## Phase 6: Execute consolidation

Consolidation is a three-step process: the parent writes a consolidation brief, a child instance does the heavy merge work, and the parent validates and finishes.

### Step 1: Parent writes the consolidation brief

The consolidation brief is the most important part of the child's prompt. It captures everything the parent knows about what matters — not just the rubric, but what evolved during the session.

**The brief must include:**

```markdown
## CONSOLIDATION BRIEF

### What this research is for
[1-3 sentences: who will use this report and for what decisions.
Not copied from the rubric — synthesized from the full conversation context.]

### What matters most (evolved during session)
[5-10 bullets of what the parent learned about user priorities.
These are judgment calls — what grew in importance, what the user
pushed back on, what emerged as critical during sub-report review.
Each bullet should guide the child's emphasis decisions.]

### Stance
[The report's stance + specific enforcement guidance.
E.g., "Factual only. Zero recommendation language — no 'optimal',
'recommended', 'best', 'should'. Replace with data: 'cheapest',
'fastest', 'most commonly used'."]

### What changed from the original rubric
[Any dimensions that grew/shrank in importance, new considerations
surfaced by sub-reports, corrections to initial assumptions.]
```

**This brief is different every time.** It cannot be templated beyond the structure. The parent must actually synthesize what it learned.

### Step 2: Child instance does the heavy merge

Spawn a child instance with: the consolidation brief + the merge plan + validation checklist + file paths.

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
  -p "<consolidation prompt>" \
  --dangerously-skip-permissions \
  --no-session-persistence \
  < /dev/null 2>&1
```

The child's prompt includes (in this order):

1. **The consolidation brief** (from Step 1)
2. **The merge plan** (reference to `fanout/<run-id>/_plan.md`)
3. **Execution instructions:** Read all sub-reports and their evidence files. Write consolidated evidence files first (with frontmatter), then REPORT.md. Follow the merge plan's section structure.
4. **Cross-section reconciliation:** "When the same stat, number, or claim appears in multiple sub-reports, verify they agree. If they differ, use the number backed by the primary source citation. Note any reconciliation in the evidence file."
5. **Validation checklist (embedded in prompt):**
   - Executive summary must reference ALL dimensions from the merge plan — verify none are missing
   - Verify stance consistency per the consolidation brief's stance section
   - When a finding appears in multiple sections, verify the numbers match
   - Confidence labels must match prose certainty (no "clearly" for INFERRED findings)
   - All evidence file references must resolve to actual files
   - Zero references to `fanout/` paths in any output file
6. **File paths:** merge plan location, sub-report paths, evidence output directory, REPORT.md output path
7. **What NOT to do:** Do not delete the fanout/ directory. Do not write changelog. Do not regenerate the catalogue. The parent handles cleanup.

The child's job is: read everything → write consolidated evidence + REPORT.md → run the embedded validation checklist. Nothing else.

### Step 3: Parent validates + synthesizes + cleans up

After the child completes, the **parent agent** (which has the research skill loaded and the full conversation context):

**Validate:**
- Read the consolidated REPORT.md
- Run Step 5 (Validate) from the research skill — the standard validation checklist
- Check cross-finding consistency, stance alignment, exec summary completeness
- Verify evidence file count matches the merge plan

**Synthesize (if needed):**
- If the exec summary doesn't adequately reflect what the parent knows matters, revise it
- If cross-cutting synthesis is missing or weak, add it — the parent is uniquely positioned for this
- If the child missed emphasis on something the user cares about, adjust

**Close run + record:**
- Close the fanout run: update `meta/runs/<run-id>/RUN.md` Status → Closed, record consolidation summary
- Append to `meta/_changelog.md`:
  ```
  ## YYYY-MM-DD — Nested fanout consolidation

  ### Fanout run: <run-id>
  - Directions pursued: [list]
  - Sub-reports: N successful, M failed
  - Consolidation: N evidence files created/expanded, M REPORT.md sections enriched, K new sections added
  - Sub-reports preserved at: fanout/<run-id>/

  ### Evidence changes
  - [list of evidence files created, expanded, or renamed]

  ### REPORT.md changes
  - [list of sections modified or added]

  ### Contradictions resolved
  - [list, if any]
  ```
- Regenerate catalogue:
  ```bash
  bun <path-to-skill>/scripts/generate-catalogue.ts
  ```

**Note:** The `fanout/<run-id>/` directory is intentionally preserved. Sub-reports are kept for auditability — any claim in the consolidated report can be traced back to its source sub-report. The consolidated REPORT.md and evidence files are the current-state artifacts; the fanout sub-reports are frozen at consolidation time.

---

## Phase 7: Report to user

After consolidation and validation are complete, present:

- What was researched (which follow-up directions)
- Key findings from each sub-report (1-2 sentences each)
- What was added to the parent report (sections enriched, new sections, new evidence files)
- Any cross-cutting synthesis generated
- Any contradictions resolved and how
- Any failures or gaps (sub-reports that failed after retry)
- New follow-up directions that emerged

Then continue the normal Step 6 flow — the user can pick further follow-ups or signal they're done.

---

## Cost awareness

> **Nested fanout typically costs 3-5x a standard research pass.** Each sub-report is a full `/research --headless` invocation. Use for genuinely deep follow-ups where subagent-level investigation (Step 3.2) is insufficient. For "quick check" or "moderate" follow-ups, standard subagents or Path C updates are more appropriate.
