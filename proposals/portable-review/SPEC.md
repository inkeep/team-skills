# Portable Code Review — Spec

**Status:** Draft
**Owner(s):** Edwin
**Last updated:** 2026-02-26
**Links:**
- Current system: `ci/pr-review/` (team-skills) + `agents/.github/workflows/claude-code-review.yml`
- Evidence: `./evidence/` (spec-local findings)

---

## 1) Problem statement
- **Who is affected:** Engineers using the PR review system, and agent workflows (e.g., `/ship`) that want to invoke code review as a composable step.
- **What pain / job-to-be-done:** The review system is currently tightly coupled to GitHub — it can only run as a GitHub Actions CI job triggered by a PR event. This means: (a) reviews cannot be invoked locally during development or as part of an agent loop before pushing; (b) reviews cannot run in a Dockerized VM or non-GitHub CI environment; (c) the `/ship` workflow cannot compose a review step without a live GitHub PR.
- **Why now:** Agent workflows like `/ship` want to compose review as a pre-push quality gate. Running reviews locally shortens the feedback loop and enables review-before-PR patterns.
- **Current workaround(s):** Push code to a PR branch and wait for CI to trigger the review. No local or non-GitHub alternative exists.

## 2) Goals
- G1: Enable the review system to run locally (via Claude Code CLI) against git changes compared to a target branch, without a GitHub PR.
- G2: Keep all 15 child reviewer agents shared and unchanged — they must work identically in both GitHub PR and local modes.
- G3: Enable `/ship` and other agent workflows to invoke review as a composable step.
- G4: Preserve the current GitHub CI review experience unchanged — this is additive, not a migration.

## 3) Non-goals
- NG1: Migrating away from the GitHub CI workflow (it stays as-is).
- NG2: Supporting non-GitHub CI systems (GitLab CI, Bitbucket Pipelines, etc.) in Phase 1.
- NG3: Iterative/delta review tracking in local mode (no "changes since last review" concept locally).
- NG4: Posting results back to GitHub from local mode (local review is local-only).

## 4) Personas / consumers
- P1: **Engineer running local review** — wants to review their changes before pushing, invoked via CLI.
- P2: **Agent workflow (`/ship`)** — wants to invoke review programmatically as a composable step in an automated loop.
- P3: **CI pipeline (current)** — continues to use the GitHub-coupled workflow unchanged.

## 5) User journeys

### P1: Engineer running local review
1. Engineer makes changes on a feature branch, commits locally
2. Runs `./ci/pr-review/scripts/pr-review.sh --target main` (or the individual steps: `generate-pr-context.sh` then `claude -p`)
3. Runs the local review orchestrator (via Claude Code CLI with plugin)
4. Reads the markdown review summary in terminal — scans Critical/Major findings
5. Addresses findings, commits fixes, re-runs if desired
6. Pushes to remote / creates PR with confidence that review-quality issues are addressed

### P2: /ship agent workflow (Phase 3: Local Review)
1. /ship completes Phase 2 (implementation) — all spec.json stories passing
2. /ship invokes `pr-review.sh` via `Bash(run_in_background: true)` — same subprocess pattern as /implement
3. `pr-review.sh` generates pr-context, then spawns `claude -p` with the pr-review-local orchestrator
4. Orchestrator runs full pipeline (dispatch children via Task, judge/filter, format markdown)
5. Output written to `tmp/ship/review-output.md`
6. /ship reads the review output and evaluates each finding:
   - **REQUEST_CHANGES (Critical/Major):** Address findings — fix directly or re-invoke /implement with findings as context, then re-run review
   - **APPROVE WITH SUGGESTIONS:** Methodically evaluate each suggestion for validity, correctness, and applicability (same evidence-based assessment as /review). Implement valid suggestions, decline invalid ones with reasoning. Then proceed.
   - **APPROVE:** Proceed to draft PR creation
7. Once review passes → create draft PR → continue to Phase 4 (testing)

## 6) Requirements
### Functional requirements
| Priority | Requirement | Acceptance criteria | Notes |
|---|---|---|---|
| Must | Local review invocation | Engineer can run a review against `git diff main...HEAD` (or any target branch) from the CLI | |
| Must | Children remain shared | All 15 pr-review-* agents are used identically in both modes | |
| Must | Markdown review output in local mode | Review produces the same markdown summary format as GitHub PR reviews (adapted for local: no suggestion blocks, file:line refs instead of GitHub URLs) | D2 |
| Must | pr-context generation via shell script | A bash script generates pr-context skill from git state (diff, changed files, commit log) before the orchestrator starts | D1 |
| Must | Shared orchestrator core | Phases 1-4 (context building, TLDR, reviewer selection, judging) extracted into a shared file (reference file or skill — A4 open) loaded by both GitHub and local orchestrator shells. 5 surgical edits to remove GitHub-specific content (D9). | D3, D9 |
| Must | Composable by /ship via subprocess | /ship invokes local review via `claude -p` subprocess (review.sh), reads `tmp/ship/review-output.md`, methodically evaluates findings. Max 2 review iterations. | D5, D6, D8 |
| Should | Same review quality | Local reviews use the same orchestration logic (Phase 1-4) as the GitHub path | |
| Could | Support Dockerized/VM execution | Review can run in a container with just git + Claude Code installed | |

### Non-functional requirements
- Performance: Local review should complete in comparable time to CI review.
- Reliability: Must handle repos of any size (same adaptive diff strategy).
- Cost: Same token usage as CI (same model, same agent count).

## 7) Success metrics & instrumentation
- Review can be invoked locally and produces actionable findings.
- `/ship` can compose review as a step.
- No regressions to GitHub CI review quality or behavior.

## 8) Current state (how it works today)
**Summary:** The review system has a clean 3-layer architecture:
1. **GitHub Workflow** (data layer) — fetches PR metadata, diff, review threads via REST/GraphQL APIs. Generates `pr-context` skill file. All GitHub coupling lives here.
2. **Orchestrator** (`pr-review.md`) — 6-phase workflow. Phases 1-4 are generic (context building, TLDR, reviewer selection, judging). Phases 5-6 are GitHub-coupled (Pending Review API for inline comments + atomic submit).
3. **Child Reviewers** (15 agents) — fully platform-agnostic. Read pr-context skill + codebase, output Finding[] JSON.

**GitHub-specific coupling points:**
- pr-context generation (workflow bash + GitHub REST/GraphQL)
- Orchestrator tools: `mcp__github__create_pending_pull_request_review`, `mcp__github__add_comment_to_pending_review`, `mcp__github__submit_pending_pull_request_review`
- GitHub `suggestion` block syntax in inline comments
- GitHub blob URLs for reference links
- Prior review detection via `## PR Review Summary` heading regex
- "Changes Since Last Review" / delta review scope

**Already generic:**
- All 15 child reviewer agents
- Output contract (Finding[] discriminated union)
- TLDR template
- Phase 1 (context building via Explore subagents)
- Phase 2 (reviewer selection matrix)
- Phase 3 (parallel dispatch via Task tool)
- Phase 4 (judging, filtering, deduplication)
- All domain-specific review skills/checklists

## 9) Proposed solution (vertical slice)

### Architecture overview

The portable review system adds a **local execution path** alongside the existing GitHub CI path. Both paths share the same child reviewers and orchestration core. Names keep the `pr-review-*` prefix for compatibility with the `agents` repo CI workflow (rename deferred — see Deferral 4).

```
                    ┌─────────────────────────────────────┐
                    │          Shared Components          │
                    │                                     │
                    │  Shared Phases 1-4 (ref or skill)   │
                    │  15 child reviewer agents            │
                    │  pr-review-output-contract skill     │
                    │  pr-tldr template skill              │
                    │  Domain-specific skills              │
                    └──────────┬──────────┬───────────────┘
                               │          │
              ┌────────────────┘          └────────────────┐
              ▼                                            ▼
    ┌──────────────────┐                      ┌──────────────────┐
    │   GitHub Path    │                      │   Local Path     │
    │                  │                      │                  │
    │ CI workflow      │                      │ pr-review.sh     │
    │ (generates       │                      │ (generates       │
    │  pr-context via  │                      │  pr-context via  │
    │  GitHub API)     │                      │  git, then       │
    │        ↓         │                      │  claude -p with  │
    │ pr-review.md     │                      │  --plugin-dir    │
    │ (shell: loads    │                      │  --agent)        │
    │  core + Phase    │                      │        ↓         │
    │  5-6 GitHub      │                      │ pr-review-       │
    │  output)         │                      │  local.md        │
    │        ↓         │                      │ (shell: loads    │
    │ GitHub Pending   │                      │  core + Phase    │
    │ Review API       │                      │  5-6 → markdown) │
    │ (inline comments │                      │        ↓         │
    │  + review body)  │                      │ review-output.md │
    └──────────────────┘                      │ (read by /ship   │
                                              │  or engineer)    │
                                              └──────────────────┘
```

### Component breakdown

#### 1. Shell script: `generate-pr-context.sh`

A bash script that generates `.claude/skills/pr-context/SKILL.md` from local git state. Mirrors the CI workflow's pr-context generation step but uses only git commands (no GitHub API).

**Inputs:**
- Target branch (default: `main`, user-configurable)
- Current HEAD

**Git commands used:**
- `git diff <target>...HEAD` — three-dot diff (same semantics as GitHub PRs)
- `git diff <target>...HEAD --stat` — diff stats
- `git diff <target>...HEAD --name-only` — changed file list
- `git log <target>...HEAD --oneline --reverse` — commit history
- `git diff <target>...HEAD --numstat` — additions/deletions per file

**pr-context sections generated:**
| Section | Source | Content |
|---|---|---|
| PR Metadata | git state | Branch name, target branch, HEAD SHA, size (commits, additions, deletions, files) |
| Description | N/A | "Local review — no PR description available." |
| Linked Issues | N/A | "No linked issues (local review)." |
| Commit History | `git log` | Commit log |
| Changed Files | `git diff --stat` + `--name-only` | File list and stats |
| Diff | `git diff` | Full diff (inline mode) or summary (>100KB) |
| Changes Since Last Review | N/A | "N/A — local review (first review)." |
| Prior Feedback | N/A | All subsections: "None (local review)." |
| URL Base | N/A | "References: Use `file:line` format (no URL base in local mode)." |

**Adaptive diff strategy:** Same as CI — if diff exceeds 100KB, switch to summary mode where the full diff is written to `.claude/pr-diff/full.diff` and the pr-context instructs agents to read files on-demand.

#### 2. Wrapper script: `pr-review.sh`

Wraps the full local review invocation (similar to `implement.sh`):

```bash
#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="${1:-main}"
REVIEW_OUTPUT="tmp/ship/review-output.md"
PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 1. Generate pr-context from git state
"$PLUGIN_DIR/scripts/generate-pr-context.sh" --target "$TARGET_BRANCH"

# 2. Run local review orchestrator as claude -p subprocess
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude \
    -p "Review changes against $TARGET_BRANCH. Begin Phase 1." \
    --plugin-dir "$PLUGIN_DIR" \
    --agent pr-review:pr-review-local \
    --dangerously-skip-permissions \
    --max-turns 200 \
    2>&1 | tee "$REVIEW_OUTPUT" || true

echo "Review output written to $REVIEW_OUTPUT"
```

**Key design points:**
- `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT` — unsets env vars that block nested Claude Code sessions (same pattern as implement.sh)
- `--plugin-dir` + `--agent` — loads the pr-review plugin with all agents, skills, and the pr-review-local orchestrator
- `--dangerously-skip-permissions` — no TTY in `-p` mode
- Output captured to `tmp/ship/review-output.md` for /ship to read
- Single invocation (orchestrator handles child dispatch internally via Task)

#### 3. Shared orchestrator core: Phases 1-4

The orchestrator's Phases 1-4 instructions, extracted from the current `pr-review.md`. Both orchestrator shells load this shared content.

**Contains:**
- Role description and key principles (minus GitHub-specific delivery instructions)
- Phase 1: Analyze Context (read pr-context, spawn Explore subagents)
- Phase 1.5: Generate PR TLDR (fill template)
- Phase 2: Select Reviewers (4-tier selection matrix, full reviewer descriptions)
- Phase 3: Dispatch Reviewers (parallel Task dispatch)
- Phase 4: Judge and Filter (deduplication, relevancy, conflict resolution, additional research)

**Does NOT contain:** Phase 5-6 (output delivery) — these differ per mode.

**Extraction edits (D9):** 5 surgical changes needed when extracting from the current `pr-review.md`:
1. **Phase 1 terminology mapping table** (lines 58-67) — maps pr-context sections to GitHub URL patterns (`#discussion_rXXX`, etc.). Move to GitHub shell only.
2. **Preamble "Review delivery" + No Duplication Principle** (lines 14, 29-44) — Phase 5-6 delivery logic. Move to GitHub shell only.
3. **Phase 3 handoff template** — `PR #[NUMBER]: [Title]` → generic identifier (branch name or changeset description).
4. **Phase 4.2 step 4** — references specific GitHub pr-context sections (`Automated Review Comments`, `Human Review Comments`, `Previous Review Summaries`). Generalize to "prior feedback sections, if any."
5. **Phase 1 `review_scope=delta`** — make conditional: "When `review_scope=delta` is present in the context metadata..."

~15 cosmetic "PR" / "this PR" references throughout Phases 1-4 are harmless (mean "changeset") and left unchanged.

**Open question — delivery mechanism (A4):**

How the shared Phases 1-4 content is delivered to both orchestrators is unresolved. Two viable options:

| | Option A: Reference file | Option B: Frontmatter skill |
|---|---|---|
| **Mechanism** | Extract to `references/pr-review-core-workflow.md`. Both orchestrator agent files include `**Load:** references/pr-review-core-workflow.md`. | Extract to `skills/pr-review-core/SKILL.md`. Both orchestrators list in `skills: [pr-review-core, ...]`. |
| **Precedent** | Strong — `/ship`, `/debug`, `/spec` all use `**Load:** references/*.md` to offload procedural content. Battle-tested pattern. | None — all 10 multi-phase procedural skills in the repo are user-invoked or Skill-tool-loaded. All frontmatter skills are reference/data/contract, never procedural workflow. |
| **Risk** | LOW — agent file retains the execution anchor ("Your instructions are this document"). Reference loaded on-demand. | MEDIUM-HIGH — instruction-source ambiguity (agent file vs. skill both have procedural phases). Untested pattern. |
| **Architecture** | Implicit — no plugin-level abstraction. Both agent files must know the path. | Clean — skill is a first-class discoverable unit with a name, plugin tooling handles resolution. |
| **Discoverability** | Lower — reference files are internal to the plugin, not visible in skill listings. | Higher — appears in `skills: [...]` declarations, self-documenting. |

Both achieve the same deduplication goal (one shared file for Phases 1-4). The trade-off is proven safety (Option A) vs. architectural cleanliness (Option B). Decision deferred to implementation.

**Open question — output contract reference format (Q9):**

The output contract's reference formatting instructions (lines 108-137, ~30 lines) tell children to construct GitHub blob URLs. Two options:

| | Option A: Dual-format guidance | Option B: Move concern to pr-context |
|---|---|---|
| **Change** | Reframe instructions: "Use the reference format appropriate for the output target." Add both GitHub URL and `file:line` examples. ~30 lines changed. | Contract says "include file path + line number(s) + description." pr-context tells children what format to use. |
| **Separation of concerns** | Leaky — contract still knows about both modes. | Clean — contract defines structure, pr-context defines presentation. |
| **Risk** | LOW — minimal change, children get explicit guidance for both modes. | MEDIUM — bigger conceptual change to how children think about references. May need output contract schema change (structured refs instead of formatted strings). |
| **Effort** | Small — edit ~30 lines, add examples. | Moderate — rethink the `references` field semantics. |

Decision deferred to implementation.

#### 4. GitHub orchestrator shell: `pr-review.md` (modified)

The existing orchestrator, refactored to:
- Load shared Phases 1-4 content (via reference file or skill — see A4 open question above)
- Retain its own Phase 5-6 (GitHub Pending Review API)
- Retain GitHub-specific preamble content (terminology mapping table, No Duplication Principle, review delivery instructions)
- Keep all current GitHub-specific tools in its frontmatter

**Change from current:** Phases 1-4 instructions move to the shared file. Phase 5-6 instructions + GitHub-specific preamble stay in-place. The agent file becomes smaller.

#### 5. Local orchestrator shell: `pr-review-local.md` (new)

A new agent that:
- Loads shared Phases 1-4 content (via reference file or skill — see A4 open question above)
- Defines its own Phase 5-6: format findings as markdown review summary and output it

**Frontmatter:**
```yaml
name: pr-review-local
tools: Task, Read, Write, Grep, Glob, Bash, mcp__exa__web_search_exa
skills: [pr-context, pr-tldr, product-surface-areas, internal-surface-areas, find-similar, pr-review-output-contract]
model: opus
```
*Note: If A4 resolves to Option B (skill), add `pr-review-core` to the skills list above.*

No `mcp__github__*` tools — this agent never touches GitHub.

**Phase 5-6 (local output):**
- Phase 5: Format the curated findings as markdown using the same review summary format (Critical/Major/Minor/Consider/While You're Here/Discarded/Reviewer Stats), adapted:
  - No GitHub suggestion blocks
  - References use `file:line` format instead of GitHub blob URLs
  - No "Pending Recommendations" section (no prior review context)
  - Recommendation line kept machine-extractable: `**(N) Total Issues** | Risk: **X** | Recommendation: **Y**`
- Phase 6: Write the markdown to `tmp/ship/review-output.md` (if running under /ship) or output as the agent's final response

### /ship integration: Phase 3 (Local Review)

**Placement in /ship phase sequence (D5):**

| Phase | Name | Description |
|---|---|---|
| Phase 0 | Context detection | Detect context, recovery, scope calibration |
| Phase 1 | Spec | Spec authoring with /spec |
| Phase 2 | Implementation | Implementation via /implement (claude -p subprocess) |
| **Phase 3** | **Local Review** | **NEW: Self-review via pr-review.sh (claude -p subprocess)** |
| *(inter-phase)* | *Draft PR creation* | `gh pr create --draft`, set prNumber in state.json |
| Phase 4 | Testing | Testing via /qa |
| *(inter-phase)* | *Write PR body* | Screenshots if applicable, load /pr |
| Phase 5 | Documentation | Documentation via /docs |
| Phase 6 | Review Feedback | Mark PR ready, load /review, iterate on human reviewer feedback |
| Phase 7 | Completion | Completion checklist, report to user |

**Phase 3 flow (D6 — iteration controlled by /ship):**

1. /ship invokes `pr-review.sh --target main` via `Bash(run_in_background: true)`
2. Script generates pr-context, spawns `claude -p` with pr-review-local orchestrator
3. Orchestrator dispatches children via Task, judges/filters, writes markdown to `tmp/ship/review-output.md`
4. /ship reads the output and evaluates:

| Recommendation | /ship action |
|---|---|
| APPROVE | Proceed to draft PR creation |
| APPROVE WITH SUGGESTIONS | Methodically evaluate each suggestion: investigate validity, assess correctness, determine applicability. Implement valid suggestions. Decline invalid ones with reasoning. Then proceed. |
| REQUEST_CHANGES (Critical/Major) | Address findings — fix directly (< 20 lines) or re-invoke /implement with findings as context. Re-run review.sh to verify. |

5. Review loop repeats until APPROVE or APPROVE WITH SUGGESTIONS (with all valid suggestions addressed), **capped at 2 iterations**. If the second review still returns REQUEST_CHANGES, /ship proceeds to draft PR creation with remaining findings noted — the GitHub review (Phase 6) will catch anything unresolved. Then → draft PR creation → Phase 4.

### Invocation

**Engineer (CLI):**
```bash
# 1. Generate pr-context + run local review in one step
./ci/pr-review/scripts/pr-review.sh --target main

# Or with explicit plugin invocation:
./ci/pr-review/scripts/generate-pr-context.sh --target main
claude -p "Review my changes." --plugin-dir ci/pr-review --agent pr-review:pr-review-local
```

**`/ship` Phase 3 (programmatic):**
```bash
# Invoked as background Bash (same pattern as implement.sh)
Bash(command: "tmp/ship/pr-review.sh --target main", run_in_background: true)

# /ship reads output after completion:
Read("tmp/ship/review-output.md")
# → extracts recommendation, evaluates findings, decides next action
```

### Alternatives considered
- **Option A (D3): Two fully independent orchestrators** — rejected due to drift risk on Phases 1-4.
- **Option B (D3): One orchestrator with conditional phases** — rejected because tool declarations differ between modes, and conditional branching in agent prompts can confuse the model.
- **Option A (D2): JSON output** — rejected because no non-LLM programmatic consumer exists today, markdown captures the orchestrator's curation narrative, and adding JSON later is reversible.
- **Option B (D1): Orchestrator self-generates pr-context** — rejected because it wastes tokens on mechanical work and mixes data gathering with review logic.

## 10) Decision log

| ID | Decision | Type (P/T/X) | 1-way door? | Status | Rationale | Evidence / links | Implications |
|---|---|---|---|---|---|---|---|
| D1 | pr-context generated by shell script (not orchestrator or separate agent) | T | No | Confirmed | Mirrors CI pattern (generate then consume). Zero tokens spent on mechanical work. Testable independently. | evidence/coupling-analysis.md | Need to design script, maintain format sync with CI workflow |
| D2 | Local output is markdown review summary (not JSON) | P/T | No | Confirmed | /ship reads Task return value as text (LLM, not JSON.parse). Markdown captures orchestrator's curation narrative. No non-LLM consumer exists. JSON can be added later if needed. | evidence/ship-review-integration.md | Local orchestrator Phase 5-6 formats markdown. /ship extracts recommendation from structured header line. |
| D3 | Shared core skill + two thin orchestrator shells | T | No (naming is mildly 1-way) | Confirmed | DRY for Phases 1-4. No drift risk. Each shell focused on its output mechanism. Tool declarations differ between modes (GitHub MCP tools vs none). | evidence/coupling-analysis.md | Must extract Phases 1-4 into `pr-review-core` skill. Both shells load it. Existing orchestrator becomes thinner. |
| D4 | Three-dot diff (`git diff target...HEAD`), user-configurable target branch (default: main) | T | No | Confirmed | Matches GitHub PR semantics exactly. Shows only changes on current branch since divergence. | N/A | Shell script uses `git diff <target>...HEAD`. User passes `--target <branch>`. |
| D5 | Local review is /ship Phase 3 (before draft PR creation). Subsequent phases bumped: Testing→4, Docs→5, Address Review→6, Completion→7. | X | No | Confirmed | Pre-push quality gate. Catches issues before anything touches GitHub. Tight local iteration loop. GitHub review (Phase 6) remains for human feedback. | evidence/ship-phase-sequence.md | /ship state.json phase enum expands. Draft PR creation moves after Phase 3. |
| D6 | Review iteration controlled by /ship (not by the script). APPROVE WITH SUGGESTIONS requires methodical evaluation of each suggestion. | X | No | Confirmed | /ship already has the editorial pattern (read output, decide, act). Matches how /ship handles /implement output. Suggestions must be evidence-assessed, not auto-accepted or auto-skipped. | evidence/ship-review-integration.md | /ship Phase 3 includes a read→evaluate→act loop. |
| D7 | Rename `pr-review-*` → `review-*`. Rename existing `/review` skill to `/assess-review`. | X | Mildly 1-way (naming) | Deferred | "review" is accurate for both PR and local contexts. "pr-review" is misleading for local mode. Collision with existing `/review` skill resolved by renaming it to `/assess-review`. **Deferred** to avoid cross-repo changes to `agents/` CI workflows. Keeping `pr-review-*` prefix for now. | evidence/naming-analysis.md | See Deferral 4 for full rename scope. |
| D8 | Local review invoked via `claude -p` subprocess (review.sh), same pattern as implement.sh. Not Task tool. | T | No | Confirmed | Task subagents can't nest — orchestrator needs Task to dispatch children. `claude -p` subprocess is its own process with full tool access. `--plugin-dir` + `--agent` flags load the full plugin environment. | evidence/ship-phase-sequence.md | Need review.sh script. /ship invokes via Bash(run_in_background: true). Output to tmp/ship/review-output.md. |
| D9 | Phase 1-4 extraction: copy verbatim with 5 surgical edits (not full refactor) | T | No | Confirmed | Audit found ~15 "PR" references are cosmetic (means "changeset"). Only 5 spots need actual change: (1) Phase 1 terminology mapping table → GitHub shell only, (2) Preamble review-delivery + No Duplication Principle → GitHub shell only, (3) Phase 3 handoff `PR #[NUMBER]` → generic identifier, (4) Phase 4.2 step 4 GitHub section names → "prior feedback sections, if any", (5) Phase 1 `review_scope=delta` → conditional. | Audit of pr-review.md Phases 1-4 | Extraction is low-risk. Majority of Phase 1-4 content is portable as-is. |
| D10 | Shell scripts written in bash (not TypeScript) | T | No | Confirmed | Repo convention: orchestration/CLI wrapper scripts → bash; schema validation/data processing → TypeScript (Bun). Both `generate-pr-context.sh` and `pr-review.sh` are orchestration (git commands, process spawning). `ci/pr-review/` has zero TS infrastructure. Matches `implement.sh` pattern. | Script language audit across ~/team-skills/ | No new infrastructure needed. |
| D11 | CLI flag combination (`-p` + `--plugin-dir` + `--agent`) — proceed with smoke test at implementation time | T | No | Confirmed | All flags exist in `claude --help`. Each pairwise combo independently confirmed. `--plugin-dir` + `--agent` tested locally (pr-review-consolidation spec, 2026-02-21). Three-way combo untested but no documented incompatibilities. Risk: MEDIUM. Fallback: inline prompt like implement.sh. | claude --help + pr-review-consolidation spec A1/A2 | Smoke test is first implementation task. |

## 11) Open questions

| ID | Question | Type (P/T/X) | Priority | Blocking? | Plan to resolve / next action | Status |
|---|---|---|---|---|---|---|
| Q1 | How should pr-context be generated in local mode? | T | P0 | Yes | — | Resolved → D1 (shell script) |
| Q2 | What should local mode output look like? | P/T | P0 | Yes | — | Resolved → D2 (markdown) |
| Q3 | One orchestrator or two? | T | P0 | Yes | — | Resolved → D3 (shared core + two shells) |
| Q4 | How do reference URLs work without GitHub? | T | P1 | No | — | Resolved → D2 (file:line format; pr-context omits URL base section) |
| Q5 | Should local mode support "prior feedback" / iterative reviews? | P | P1 | No | No delta scoping. Cap iterations at 2 — if 2nd review still fails, proceed to PR and let GitHub review catch it. | Resolved → Deferral 1 confirmed |
| Q6 | What git comparison should local mode use? | T | P0 | Yes | — | Resolved → D4 (three-dot diff, configurable target) |
| Q7 | Where does the local orchestrator agent live? | T | P1 | No | — | Resolved → D3 (same plugin dir: `ci/pr-review/agents/pr-review-local.md`) |
| Q8 | How exactly should Phases 1-4 be extracted into review-core? Copy verbatim, or refactor to remove GitHub-specific language? | T | P0 | Yes | Audited: extraction is "copy verbatim with 5 surgical edits." See §9 Component 3 for details. | Resolved → D9 |
| Q9 | Does the output contract skill need updating for local mode (reference URL guidance)? | T | P1 | No | Yes — ~30 lines of reference formatting instructions (lines 108-137) tell children to construct GitHub blob URLs. Two options under evaluation, see §9 Component 3 notes. | Open — options assessed, decision needed |
| Q10 | How does /ship invoke the local review? | X | P0 | Yes | — | Resolved → D8 (claude -p subprocess via review.sh) |
| Q11 | Should the shell script be bash or TypeScript (consistency with other scripts in the repo)? | T | P2 | No | Bash. Repo convention: orchestration/CLI wrappers → bash; schema validation/data processing → TypeScript (Bun). Both scripts are orchestration. `ci/pr-review/` has zero TS infrastructure. | Resolved → D10 (bash) |
| Q12 | What exact name for the renamed `/review` skill? `address-review`, `resolve-review`, `review-feedback`? | P | P1 | No | User suggested `assess-review`. | Deferred → Deferral 4 |
| Q13 | Should the rename (D7) happen before, after, or concurrently with the structural changes? | T | P1 | No | Recommended: separate atomic commit before structural changes to keep diffs clean | Deferred → Deferral 4 |
| Q14 | Does `claude -p` + `--agent` + `--plugin-dir` actually work together? Need to verify CLI flag compatibility. | T | P0 | Yes | All flags exist in `claude --help`. Each pairwise combo confirmed working (pr-review-consolidation spec tested `--plugin-dir` + `--agent` on 2026-02-21). Three-way combo untested. Risk: MEDIUM. Smoke test needed before implementation. `--max-turns` absent from `--help` but works in implement.sh. | Resolved → D11 (proceed, smoke test at impl time) |

## 12) Assumptions

| ID | Assumption | Confidence | Verification plan | Expiry | Status |
|---|---|---|---|---|---|
| A1 | Children are fully platform-agnostic today — they read pr-context and output JSON with no GitHub API calls | HIGH | Verified: checked frontmatter and tool lists of all 15 reviewers | N/A | Confirmed |
| A2 | The pr-context skill format is the stable interface contract between the data layer and the agents | HIGH | Verified: all agents load it via `skills: [pr-context]` | N/A | Confirmed |
| A3 | The reference URL pattern is injected via pr-context, not hardcoded in children or output contract | HIGH | Verified: children have zero GitHub URL references; output contract says "use the pattern from pr-context"; pr-context provides the URL base section | N/A | Confirmed |
| A4 | Extracting Phases 1-4 into a shared file that both orchestrators load will work without behavioral regression | MEDIUM | Investigated: zero precedent for procedural multi-phase skills via frontmatter in this codebase. All existing frontmatter skills are reference/data/contract. Two viable patterns under evaluation — see §9 Component 3 notes. Decision needed. | Before implementation | Open — options assessed |
| A5 | /ship can reliably extract recommendation from markdown header line via LLM reading | HIGH | /ship is an LLM reading Task return value; structured header `**(N) Total Issues** \| Risk: **X** \| Recommendation: **Y**` is trivially extractable | N/A | Active |

## 13) Phases & rollout plan
*To be designed during spec process.*

## 14) Risks & mitigations
| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Drift between GitHub and local orchestrators | Low (mitigated by D3) | High | D3: shared `pr-review-core` skill contains Phases 1-4. Only Phase 5-6 differs per shell. | Edwin |
| pr-context format divergence between GitHub and local generation | Low | High | Shell script must mirror CI workflow's pr-context structure. Document required vs optional sections. | Edwin |
| Children subtly depend on GitHub-specific pr-context fields | Very Low (mitigated by A3) | Medium | Confirmed: children don't reference prior feedback, linked issues, or review threads. These can safely be absent. | Edwin |
| Phase 1-4 extraction introduces behavioral regression | Low | High | Test the shared core skill with both orchestrator shells before shipping. A4 tracks this. | Edwin |
| Shell script maintenance burden / format sync with CI workflow | Medium | Medium | The CI workflow's review-context generation is ~120 lines of bash. The shell script replicates the structure but is simpler (no GitHub API, no review state). Document the format contract. | Edwin |
| Rename blast radius across repos (deferred) | Medium | Medium | ~375 occurrences across ~30 files in team-skills + 13 in agents/ repo. **Deferred** — keeping `pr-review-*` prefix to avoid cross-repo changes. See Deferral 4. | Edwin |
| `claude -p` + `--agent` + `--plugin-dir` flag combination may not work | Low | High | If flags don't compose, fallback is to inline the full orchestrator prompt in review.sh (like implement.sh inlines its prompt). Q14 tracks verification. | Edwin |

## 15) Appendices (documented deferrals)

### Deferral 1: Iterative/delta local reviews (Q5)
- **What we learned:** GitHub CI tracks prior reviews via `## PR Review Summary` heading regex + commit SHA to compute deltas. This enables scoped re-reviews that only look at new changes. Locally, iteration is capped at 2 runs — no delta scoping needed because re-reviewing the full diff twice is cheap and avoids state management complexity.
- **Why deferred:** Local review is a one-shot pre-push check (capped at 2 iterations). No persistent review state exists locally. Building a local review state store adds complexity (state file lifecycle, staleness, branch switching) for an unclear benefit. The GitHub review (Phase 6) serves as a backstop for anything unresolved after 2 local iterations.
- **Trigger to revisit:** If engineers report running local reviews on very large branches where full re-review is too slow/expensive, or if /ship needs more than 2 iterations to converge.
- **Implementation sketch:** Store last-reviewed commit SHA in `.claude/review-state.json`. Shell script computes delta from that SHA. Local orchestrator supports `review_scope=delta`.

### Deferral 2: Non-GitHub CI systems (NG2)
- **What we learned:** The shared core (Phases 1-4) + shell script pattern is inherently CI-agnostic. A GitLab CI workflow could use the same shell script + local orchestrator.
- **Why deferred:** No immediate need. GitHub CI is the only current deployment target.
- **Trigger to revisit:** If the team adopts GitLab, Bitbucket, or another CI system.
- **Implementation sketch:** Write a GitLab CI workflow that calls the same shell script + local orchestrator (or a third orchestrator shell with GitLab MR API output).

### Deferral 3: JSON output format (D2 alternative)
- **What we learned:** No non-LLM programmatic consumer exists today. /ship reads markdown via LLM. JSON can be added later as a sidecar without breaking the markdown path.
- **Why deferred:** YAGNI — no consumer to shape the schema. Defining a JSON contract now creates a premature 1-way door.
- **Trigger to revisit:** A script, dashboard, or non-LLM tool needs to parse review output.
- **Implementation sketch:** Add `--output-json <path>` flag to the shell script / orchestrator invocation. Output the curated Finding[] with orchestrator metadata alongside the markdown.

### Deferral 4: Rename `pr-review-*` → `review-*` (D7)
- **What we learned:** "review" is more accurate for a system that now works in both PR and local contexts. "pr-review" is misleading for local mode. The rename is mechanical but has significant blast radius. Full analysis in `evidence/naming-analysis.md`.
- **Why deferred:** The rename touches the `agents/` repo CI workflows (`claude-code-review.yml`, `closed-pr-review-auto-improver.yml`). To avoid cross-repo coordination in Phase 1, we keep the `pr-review-*` prefix for now.
- **Trigger to revisit:** When the team is ready to do a coordinated cross-repo rename, or when the `pr-review-*` prefix becomes confusing for users encountering local mode.
- **Scope of work:**
  - **team-skills repo (~375 occurrences across ~30 files):**
    - Rename `ci/pr-review/` directory → `ci/review/`
    - Rename all 15 child agent files: `pr-review-standards.md` → `review-standards.md`, etc.
    - Rename orchestrator: `pr-review.md` → `review-gh.md`
    - Rename local orchestrator: `pr-review-local.md` → `review-local.md`
    - Rename skills: `pr-review-output-contract` → `review-output-contract`, `pr-review-check-suggestion` → `review-check-suggestion`, `pr-review-core` → `review-core`
    - Rename TLDR template: `pr-tldr` → `review-tldr`
    - Rename pr-context skill: `pr-context` → `review-context`
    - Update plugin.json: `"name": "pr-review"` → `"name": "review"`
    - Update all frontmatter `name:` fields in agent files
    - Update all cross-references in `plugins/eng/skills/ship/SKILL.md`, `plugins/shared/skills/write-agent/SKILL.md`, and similar
  - **agents repo (~13 occurrences across 2 files):**
    - `claude-code-review.yml`: `--agent pr-review:pr-review` → `--agent review:review-gh`
    - `closed-pr-review-auto-improver.yml`: Update agent references
  - **Collision resolution:** Rename existing `/review` skill (eng) to `/assess-review` (user preference). Blast radius: ~20 references in `plugins/eng/skills/ship/SKILL.md` + the review skill itself. Contained within the eng plugin.
  - **Recommended approach:** Do as a single atomic commit per repo. Rename in team-skills first, then agents. Use `sed` for mechanical find-and-replace. Full rename mapping in `evidence/naming-analysis.md`.
