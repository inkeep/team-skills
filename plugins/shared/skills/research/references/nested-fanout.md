Use when: The user requests 2+ deep-dive follow-ups simultaneously after Step 6, or `--fanout` is passed in headless mode. Spawns parallel /research --headless instances and consolidates findings back into the parent report.
Priority: P1
Impact: Without this, multi-direction deep dives require manual orchestration — crafting prompts, managing temporary directories, analyzing applicability, merging evidence files, enriching the report, and cleaning up. Typical manual effort: 1-2 hours.

---

# Nested Fanout: Parallel Deep-Dive Research with Consolidation

Spawn parallel `/research --headless` instances for multiple follow-up directions, then consolidate all findings back into the parent report. Sub-reports are ephemeral — they live in a temporary directory inside the parent report and are deleted after consolidation.

**Prerequisites:**
- A completed research pass (Steps 1-6) with a parent REPORT.md
- 2+ follow-up directions selected by the user (or auto-selected via `--fanout` in headless mode)
- The `/nest-claude` skill for subprocess spawning conventions

**Key constraints:**
- All citations in sub-reports must be external primary sources (GitHub, npm, blogs) — never paths to sibling fanout directories
- Sub-reports inherit the parent's non-goals (don't drift into excluded areas)
- The consolidated parent report reads as one coherent document — not a patchwork of merged content
- Zero citation leakage — no references to deleted sub-reports survive in the final output

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
TaskCreate: "Fanout: Verify + cleanup + report to user"        → pending, blocked by #6
```

Use `addBlockedBy` to enforce ordering. Mark each task `in_progress` when starting it, `completed` when done.

---

## Phase 1: Create fanout run

Create a new run in the parent report's meta directory:

```bash
mkdir -p <parent-report>/meta/runs/YYYY-MM-DD-fanout
```

Write `RUN.md`:

```markdown
# Run: YYYY-MM-DD-fanout

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
| [direction 1] | pending | fanout/[topic-kebab]/ | |
| [direction 2] | pending | fanout/[topic-kebab]/ | |

## Fanout Directory
`<parent-report>/fanout/`
```

**Stale fanout check:** If `fanout/` already exists (interrupted prior fanout), `rm -rf fanout/` before proceeding. Stale sub-reports are not recoverable — the content was never consolidated.

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
```

**Prompt size target:** 150-300 lines including context. Extract the relevant portions of the parent report — do NOT include the full REPORT.md.

---

## Phase 3: Spawn nested instances

**Load:** The `/nest-claude` skill for subprocess spawning conventions.

For each selected direction, spawn a nested Claude Code instance. Use `CLAUDE_REPORTS_DIR` to direct sub-reports into the fanout directory:

```bash
CLAUDE_REPORTS_DIR="<parent-report-dir>/fanout" \
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
  -p "<constructed prompt from Phase 2>" \
  --dangerously-skip-permissions \
  --no-session-persistence \
  < /dev/null 2>&1
```

Launch all instances **in parallel** — use `run_in_background: true` on each Bash tool call, sending all calls in a single message.

Update RUN.md sub-instance tracking: status → spawned.

The research skill inside each subprocess picks up `CLAUDE_REPORTS_DIR` and creates `<parent-report>/fanout/<topic-kebab>/REPORT.md` using its normal naming conventions.

---

## Phase 4: Collect results + quality check

Wait for all instances to complete. For each:

**Success check:**
1. Verify `fanout/<topic>/REPORT.md` exists
2. Verify it has an Executive Summary section
3. Verify at least 1 evidence file exists in `fanout/<topic>/evidence/`

**Failure handling:**
- If a sub-instance fails or produces low-quality output (missing exec summary or zero evidence files): **retry once** — spawn a new instance with the same prompt.
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

Write the plan to `<parent-report>/fanout/_plan.md`:

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

**Always spawn a dedicated consolidation instance** for this phase. The parent agent's context may be pressured after Phases 1-5. Pass the merge plan + file paths to a nested instance:

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
  -p "Execute the consolidation plan at <parent-report>/fanout/_plan.md. [full consolidation instructions]" \
  --dangerously-skip-permissions \
  --no-session-persistence \
  < /dev/null 2>&1
```

The consolidation instance follows this order (evidence first, REPORT.md second, cleanup last):

### Step 1: Evidence files
- For each target in the merge plan: read source evidence files → write/expand consolidated file with frontmatter
- Verify: grep all new/modified evidence files for `fanout/` paths → zero matches

### Step 2: REPORT.md
- Apply enrichments to existing sections (surgical edits)
- Add new sections at the locations specified in the merge plan
- Add cross-cutting synthesis section (if the merge plan identified one)
- Resolve contradictions per the merge plan
- Update the References section: evidence file list + deduplicated external sources
- Remove any "Related Research" pointers to reports that no longer exist
- Update frontmatter: `updatedAt` to today's date
- Update the "Where we could go from here" section:
  - Remove follow-ups now covered by the fanout
  - Add new follow-ups surfaced by sub-reports
  - Update descriptions of partially-covered follow-ups

### Step 3: Verify
- Grep entire parent report directory for paths containing `fanout/` → zero matches
- Grep for any sub-report directory names as paths → zero matches
- Verify evidence file count matches merge plan
- Verify all evidence files have frontmatter

### Step 4: Clean up
- `rm -rf <parent-report>/fanout/`
- Close the fanout run: update RUN.md Status → Closed, record consolidation summary
- Append to `meta/_changelog.md`:
  ```
  ## YYYY-MM-DD — Nested fanout consolidation

  ### Fanout run: YYYY-MM-DD-fanout
  - Directions pursued: [list]
  - Sub-reports: N successful, M failed
  - Consolidation: N evidence files created/expanded, M REPORT.md sections enriched, K new sections added

  ### Evidence changes
  - [list of evidence files created, expanded, or renamed]

  ### REPORT.md changes
  - [list of sections modified or added]

  ### Contradictions resolved
  - [list, if any]
  ```

### Step 5: Regenerate catalogue
- Run the catalogue generator:
  ```bash
  bun <path-to-skill>/scripts/generate-catalogue.ts
  ```

---

## Phase 7: Report to user

After consolidation completes, read the updated parent REPORT.md and present:

- What was researched (which follow-up directions)
- Key findings from each sub-report (1-2 sentences each)
- What was added to the parent report (sections enriched, new sections, new evidence files)
- Any cross-cutting synthesis generated
- Any failures or gaps (sub-reports that failed after retry)
- New follow-up directions that emerged

Then continue the normal Step 6 flow — the user can pick further follow-ups or signal they're done.

---

## Cost awareness

> **Nested fanout typically costs 3-5x a standard research pass.** Each sub-report is a full `/research --headless` invocation. Use for genuinely deep follow-ups where subagent-level investigation (Step 3.2) is insufficient. For "quick check" or "moderate" follow-ups, standard subagents or Path C updates are more appropriate.
