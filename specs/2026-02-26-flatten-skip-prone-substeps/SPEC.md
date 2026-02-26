# Flatten Skip-Prone Substeps in /ship and Child Skills

## Problem statement

The `/ship` orchestrator and its child skills (/spec, /implement, /qa, /docs, /review, /explore) contain ~60 inline substeps at high risk of being skipped by AI agents. These substeps — validation gates, exit checklists, verification steps, and discovery phases — are embedded as prose within larger phases. Agents treat named phases as mandatory waypoints but blow past inline prose, especially steps that produce no visible output.

The most commonly skipped steps include:
- **Validation/audit gates** (checklists that verify phase outputs before proceeding)
- **Exit gates** (re-running quality gates after making fixes)
- **Pre-work understanding** (building codebase context before implementing)
- **Post-work verification** (reviewing implementation output before moving on)

### Root cause

Steps that produce **visible output** (code, PR body, spec document) get executed reliably. Steps that **verify, validate, persist, or enforce discipline** — which produce no visible output — get skipped because they look like optional guidance rather than mandatory waypoints.

### Why this matters

Skipped validation gates lead to: specs that aren't ready for implementation, implementation output that isn't reviewed, QA fixes that introduce regressions, and PRs that ship with incomplete verification. The ship loop's context compaction mechanism compounds the problem — if a verification step is skipped before compaction, the resumed agent has no record it was needed.

---

## Goals

1. Reduce sub-step skipping in /ship and child skills by making high-skip-risk steps structurally harder to skip
2. Improve visibility of progress within phases (for users and for resumed agents after compaction)
3. Ensure child skills are self-contained — standalone invocations get the same safety nets as composed invocations via /ship

## Non-goals

- Rewriting skill logic or changing what the skills do
- Adding new capabilities or features to any skill
- Changing the ship loop's stop hook, state management, or re-entry mechanism
- Building enforcement infrastructure (MCP task servers, custom tooling)

---

## Solution: Three-layer defense

### Layer 1: Explicit phases in SKILL.md

Promote high-skip-risk substeps from inline prose within a larger phase to their own named phases with entry/exit criteria. Named phases act as mandatory waypoints — agents treat them as "I must complete Phase X before Phase X+1."

### Layer 2: Task creation for each phase

Each skill creates TaskCreate entries for its own phases when invoked. Tasks provide:
- **Visibility** — user sees granular progress via `/tasks`; a skipped step shows up as `pending` when surrounding tasks are `completed`
- **Compaction survival** — resumed agent sees uncompleted tasks and knows what's left
- Tasks are advisory (don't enforce execution order), but explicit phases in the skill instructions drive the actual order

### Layer 3: Phase artifacts/gates (where applicable)

Critical phases must produce a tangible output that downstream phases check for. If the artifact doesn't exist, the next phase cannot proceed. This is the only mechanism that actually enforces completion.

---

## Changes by file

### 1. Ship SKILL.md

#### 1a. Update phase task list (9 → 11 phases)

Current task list:
1. Phase 0: Detect context and starting point
2. Phase 1: Spec authoring and handoff
3. Phase 2: Implementation
4. Create draft PR
5. Phase 3: Testing
6. Write PR body
7. Phase 4: Documentation
8. Phase 5: Review iteration loop
9. Phase 6: Completion

New task list:
1. Phase 0: Detect context and starting point
2. Phase 1: Spec authoring and handoff
3. **Phase 2a: Build codebase understanding** ← promoted from Phase 2 Step 1
4. Phase 2b: Implementation
5. **Phase 2c: Post-implementation ownership review** ← promoted from Phase 2 Step 3
6. Create draft PR
7. Phase 3: Testing
8. Write PR body
9. Phase 4: Documentation
10. Phase 5: Review iteration loop
11. Phase 6: Completion

#### 1b. Always invoke /spec

Update the scope calibration table so all three scope levels invoke /spec with a `--scope` parameter. Remove the "scaffold directly for lightweight specs" path.

Current:
| Feature | Full `/spec` |
| Enhancement | SPEC.md with problem + acceptance criteria; `/spec` optional |
| Bug fix | SPEC.md with problem statement + what "fixed" looks like |

New:
| Feature | `/spec --scope feature` — full rigor |
| Enhancement | `/spec --scope enhancement` — moderate (problem + criteria + test cases + technical direction) |
| Bug fix | `/spec --scope bugfix` — lightweight (problem + root cause + fix + criteria) |

Remove the paragraph at the end of Phase 1 Step 1 that says "If scope calibration indicated a lighter spec process (enhancement or bug fix): refine the scaffold directly instead of invoking /spec."

#### 1c. Promote "Build codebase understanding" to Phase 2a

Currently buried as Phase 2 Step 1. Make it a standalone phase with:
- **Entry:** Phase 1 complete, spec handed off
- **Activity:** Load /explore on target area (purpose: implementing). Build architectural understanding.
- **Exit artifact:** Persist findings to `tmp/ship/codebase-context.md` so they survive compaction and feed /implement's prompt
- **Exit criteria:** Can articulate what the feature does, how it works technically, what's riskiest, what to test first

#### 1d. Promote "Post-implementation ownership review" to Phase 2c

Currently buried as Phase 2 Step 3. Make it a standalone phase with:
- **Entry:** /implement complete (Phase 2b)
- **Activity:** Delegate targeted verification to subagent. Check: implementation matches spec? Gaps? Dead code? Unresolved TODOs? Every acceptance criterion has a test?
- **Exit criteria:** Satisfied with the output. Quality gates green after any fixes.
- Note: /implement now has its own Phase 4 (Verify Output) which handles mechanical verification. This phase is the deeper ownership review — "would you ship this code?"

#### 1e. Simplify Phase 3 exit gate

The core gate (re-run quality gates after /qa's fixes) moves into /qa itself. Ship keeps a lightweight confirmation:
- `/qa` reported completion with results
- Quality gates confirmed green (by /qa's new Step 6b)
- Can explain the implementation to another engineer

#### 1f. Remove spec validation gate from Phase 1

The 4-item implementation-readiness checklist moves into /spec's Step 8 (quality bar). Ship's Phase 1 Step 2 simplifies to: "Load /spec. When /spec completes (including its validation gate), confirm with the user that the spec is ready for implementation handoff."

---

### 2. /spec SKILL.md

#### 2a. Accept `--scope` parameter

Add a "Scope calibration" section before the workflow:

| Scope | Depth |
|---|---|
| feature (default) | Full rigor — all 8 steps |
| enhancement | Steps 1-5 + quality bar. Phase planning optional. |
| bugfix | Steps 1-4 + quality bar. Focus on root cause + fix + verification. |

All scopes require the implementation-readiness validation gate (Step 8).

#### 2b. Expand Step 8 with implementation-readiness validation

Current Step 8 is "Quality bar + are we actually done?" — focused on spec quality. Expand to also include ship's implementation-readiness checklist:

Additional checks:
- [ ] Problem statement and goals are clear
- [ ] Scope, requirements, and acceptance criteria are defined
- [ ] Test cases are enumerated (or derivable from acceptance criteria)
- [ ] Technical design exists (architecture, data model, API shape — at least directionally)

When composed by /ship, Step 8 also confirms with the user that the spec is ready for implementation handoff. When standalone, Step 8 reports readiness status.

---

### 3. /implement SKILL.md

#### 3a. Add Phase 4: Verify Output

After the current Phase 3 (Execute), add a new phase that handles mechanical verification:

**Phase 4: Verify Output**
- [ ] All stories pass (or stuck stories have documented notes)
- [ ] Quality gates green (re-run typecheck, lint, test)
- [ ] No obvious regressions (scan progress.txt for warnings)
- [ ] Branch is clean (no untracked/uncommitted source files)

When verification fails: fix quality gate failures, re-invoke implement.sh for stuck stories (max 3 runs), escalate unresolvable blockers.

This separates the mechanical "is the output sound?" check (which /implement should always do) from the deeper "are you satisfied with this code?" ownership review (which ship handles in Phase 2c).

---

### 4. /qa SKILL.md

#### 4a. Add Step 6b: Verify your fixes

Between Step 6 (Record results) and Step 7 (Report), add:

**Step 6b: Verify your fixes**
If any code changes were made during testing (bug fixes, test additions), re-run quality gates (typecheck, lint, test) and verify green before reporting. QA fixes bugs — this step verifies those fixes don't introduce regressions.

This runs whether /qa is invoked by /ship or standalone.

---

## Implementation phases

### Phase 1: Child skills that gain new responsibilities (can parallel)
- **1a. /spec** — Add `--scope` parameter + expand Step 8 with implementation-readiness validation
- **1b. /implement** — Add Phase 4: Verify Output
- **1c. /qa** — Add Step 6b: Verify your fixes

### Phase 2: Ship orchestrator (depends on Phase 1)
- **2a.** Update phase task list (9 → 11)
- **2b.** Always invoke /spec (update scope calibration table, remove lightweight-spec path)
- **2c.** Promote "Build codebase understanding" to Phase 2a
- **2d.** Promote "Post-implementation ownership review" to Phase 2c
- **2e.** Simplify Phase 3 exit gate (core gate now in /qa)
- **2f.** Simplify Phase 1 Step 2 (validation now in /spec)

### Phase 3: Artifact gates (depends on Phase 2)
- Define `tmp/ship/codebase-context.md` as the required output of Phase 2a
- Ship checks for its existence before invoking /implement
- /implement reads it for the codebase context placeholder

---

## Acceptance criteria

- [ ] /spec accepts `--scope feature|enhancement|bugfix` and calibrates depth
- [ ] /spec Step 8 includes implementation-readiness checklist (problem, criteria, tests, design)
- [ ] /implement has a Phase 4 (Verify Output) with mechanical verification checklist
- [ ] /qa has a Step 6b that re-runs quality gates after any code changes made during testing
- [ ] Ship task list creates 11 tasks (up from 9)
- [ ] Ship always invokes /spec (no "scaffold directly" path for lightweight specs)
- [ ] "Build codebase understanding" is an explicit ship phase with `tmp/ship/codebase-context.md` as output artifact
- [ ] "Post-implementation ownership review" is an explicit ship phase
- [ ] Ship Phase 3 exit gate defers quality-gate verification to /qa's Step 6b
- [ ] Ship Phase 1 Step 2 defers spec validation to /spec's Step 8
- [ ] All changes are backward compatible — no breaking changes to skill invocation patterns

## Test cases

- [ ] Run /spec standalone with `--scope bugfix` — verify it produces a lightweight spec and runs the implementation-readiness gate
- [ ] Run /implement standalone — verify Phase 4 catches a quality gate failure (introduce a deliberate type error)
- [ ] Run /qa standalone with a bug fix during testing — verify Step 6b re-runs quality gates
- [ ] Run /ship end-to-end — verify the task list shows 11 phases, /spec is always invoked, codebase-context.md is produced, ownership review runs as its own phase

---

## Decision log

| # | Decision | Rationale | Reversibility |
|---|---|---|---|
| D1 | Promote 2 substeps to ship phases (not 5) | 3 of the 5 candidates belong in child skills. Only "build codebase understanding" and "post-implementation ownership review" are genuinely orchestrator-level. | Reversible |
| D2 | Move 3 substeps into child skills instead of keeping at ship level | Spec validation → /spec (because /spec always runs now). Testing exit gate → /qa (should verify its own fixes). Implementation verification → /implement (mechanical check belongs in the tool). | Reversible |
| D3 | Always invoke /spec even for lightweight specs | Removes the "scaffold directly" path that bypassed /spec's quality bar. /spec gains a `--scope` parameter to calibrate depth. | Reversible |
| D4 | Use three-layer approach (phases + tasks + artifacts) | Phases prevent skipping, tasks detect it, artifacts enforce it. No single mechanism covers all failure modes. | Reversible |
| D5 | Persist codebase understanding to `tmp/ship/codebase-context.md` | Currently only lives in agent context — lost on compaction. File survives compaction and feeds /implement's prompt. | Reversible |

## Open questions

None — all questions resolved during analysis.

## Research references

- [Task Management in Claude Code CLI](../../reports/claude-code-task-management/REPORT.md) — confirms tasks can be created anytime but cannot be inserted between existing tasks; subagents lack Task* tools; execution order is advisory
