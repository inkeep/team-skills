---
name: ship
description: "Orchestrate full-stack feature development from spec to merge-ready PR. Composes /spec, /ralph, /review, and /research into an autonomous end-to-end workflow: spec authoring, worktree setup, TDD implementation, multi-modal testing, and iterative PR review. Use when implementing a feature end-to-end, taking a SPEC.md to production, or running the full spec-to-PR pipeline. Triggers: ship, ship it, feature development, implement end to end, spec to PR, full stack implementation, autonomous development."
argument-hint: "[feature description or path to SPEC.md]"
---

# Ship

This skill has two modes. During **spec authoring** (Phase 1A), you are a collaborative thought partner — the user is the product owner, and you work together to define what to build. Once the spec is finalized and the user hands off to implementation, you become an **autonomous engineer** who owns the entire remaining lifecycle: from prd.json through merge-ready PR. Ralph, reviewers, and CI/CD are tools and inputs. You make every final decision.

The phases below organize your work — they do not pressure you to move forward. Your goal is high-quality outcomes, not completing steps. Never rush a decision to stay on schedule. If you need to stop and research, investigate, or build deeper understanding before proceeding, that is the right thing to do. A well-informed decision made slowly is always better than a shallow decision made quickly.

---

## Workflow

### Phase 0: Detect context and starting point

#### Step 1: Detect execution context

Before making any workflow decisions, detect what capabilities are available. For each capability, resolve using: (1) user-specified override → respect unconditionally, (2) default assumption + runtime probe, (3) degradation path if probe fails.

| Capability | Probe | If unavailable |
|---|---|---|
| Git worktree support | Check `/.dockerenv` or container env vars; check if already on feature branch | Skip worktree creation in Phase 2 — use current directory |
| GitHub CLI | `gh auth status` | Skip PR creation (Phase 2) and review invocation (Phase 5) |
| Quality gate commands | Read `package.json` `scripts` field; check for `pnpm`/`npm`/`yarn`; accept user `--test-cmd` / `--typecheck-cmd` / `--lint-cmd` overrides | Use discovered commands; halt if no typecheck AND no test command works |
| Browser automation | Check if `mcp__claude-in-chrome__*` tools are available | Substitute Bash-based testing; pass `--no-browser` to ralph for criteria adaptation |
| macOS computer use | Check if `mcp__peekaboo__*` tools are available | Skip OS-level testing; document gap |
| Claude CLI subprocess | Run: `env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude --version` | Use same-session ralph-loop (Path D) or Task subagent iteration (Path B) — see Phase 3 |
| Ralph-loop plugin | Check if `/ralph-loop` is available as a skill/plugin | Use Task subagent iteration (Path B) — see Phase 3 |
| /spec skill | Check skill availability | Require SPEC.md as input (no interactive spec authoring) |
| /inspect skill | Check skill availability | Use direct codebase exploration (Glob, Grep, Read) |

Record what's available. This state flows through all subsequent phases.

If any capability is unavailable: briefly state which capabilities are missing and what will be skipped or degraded. Keep to 2-3 sentences. Frame as a negotiation checkpoint — the user may be able to fix the issue (e.g., re-authenticate `gh`, start Chrome extension) before work proceeds.

If all capabilities are available: proceed directly to Step 2.

#### Step 2: Detect starting point

Determine which entry mode applies:

| Condition | Action |
|---|---|
| User provides a path to an existing SPEC.md | Load it. Proceed to Phase 1B. |
| User provides a feature description (no SPEC.md) | Proceed to Phase 1A. If `/spec` is unavailable, ask the user to provide a SPEC.md. |
| Ambiguous | Ask: "Do you have an existing SPEC.md, or should we spec this from scratch?" |

---

### Phase 1A: Spec from scratch (collaborative)

In this phase, you are a thought partner, not an autonomous executor. The user is the product owner — your job is to help them think clearly about what to build, surface considerations they may have missed, and produce a rigorous spec together.

Invoke `/spec` with the user's feature description. Follow the spec skill's interactive process.

During the spec process, ensure these are captured with evidence (not aspirationally):
- All test cases and acceptance criteria for Phase 1. Criteria should describe observable behavior ("created user is retrievable via API"), not internal mechanisms ("createUser calls db.insert"). See /tdd.
- Failure modes and edge cases
- Whether TDD is practical for this feature (prefer TDD when feasible)

Do not proceed until the user confirms the SPEC.md is ready for implementation. This confirmation is the handoff — from this point forward, you own execution autonomously.

Once finalized, continue to Phase 1B.

---

### Phase 1B: Validate spec and prepare for implementation

Read the SPEC.md. Verify it contains sufficient detail to implement:

- [ ] Problem statement and goals are clear
- [ ] Phase 1 scope, requirements, and acceptance criteria are defined
- [ ] Test cases are enumerated (or derivable from acceptance criteria)
- [ ] Technical design exists (architecture, data model, API shape — at least directionally)

If any are missing, fill the gaps by asking the user targeted questions or proposing reasonable defaults (clearly labeled as assumptions).

Before proceeding, verify that you genuinely understand the feature — not just that the spec has the right sections. Test yourself: can you articulate what this feature does, why it matters, how it works technically, what the riskiest parts are, and what you would test first? If not, re-read the spec and investigate the codebase until you can. Use `/inspect` on the target area (purpose: implementing) to understand the patterns, conventions, and shared abstractions you'll need to work with. This understanding is what you will use to evaluate Ralph's output and reviewer feedback later.

Then convert to `prd.json` using `/ralph`.

Create a task list for yourself covering all remaining phases. Update it as you progress.

---

### Phase 2: Environment setup

**Load:** `references/worktree-setup.md`

First, detect the current environment:

| Condition | Action |
|---|---|
| Already in a worktree or feature branch (e.g., invoked via Conductor or existing worktree) | Skip worktree creation. Verify branch is not `main`/`master`, dependencies are installed, and the build is clean. Proceed to step 3. |
| In a container (`/.dockerenv` exists or container env detected in Phase 0) | Skip worktree creation — use current directory. Create a feature branch if on `main`/`master`. Proceed to step 2. |
| In the main repo on `main`/`master` | Create a new worktree (step 1). |
| Ambiguous | Run `git worktree list` and `git branch --show-current` to determine. |

1. Create a git worktree from `origin/main`:
   ```
   git worktree add ../<feature-name> -b feat/<feature-name>
   ```
2. Set up the environment: install dependencies with the correct package manager version, run conductor setup if `conductor.json` exists.
3. **If GitHub CLI is available** (detected in Phase 0): Create a draft PR early so CI/CD and reviewers can engage. Use the SPEC.md as the basis for the PR body — distill problem, motivation, and approach from the spec (see `references/worktree-setup.md` step 5 for the template).
   ```
   gh pr create --draft --title "feat: <feature>" --body "<distilled from SPEC.md>"
   ```
   Note the PR URL and number for the review iteration loop.

   **If GitHub CLI is NOT available:** Skip PR creation. Implementation proceeds without PR-based review — the user reviews locally after Phase 4.

---

### Phase 3: Implementation

#### Step 1: Craft the implementation prompt

Invoke `/ralph` to prepare the implementation (Phase 2: prompt crafting). Provide Ralph with:
- Path to the SPEC.md and prd.json — the spec path is critical: Ralph forwards it into the implementation prompt so iteration agents read the full spec as their primary reference every iteration. Do not omit it.
- The codebase context from Phase 1B — the patterns, conventions, and shared abstractions you identified via `/inspect`
- Quality gate command overrides from Phase 0 (which may differ from pnpm defaults)
- Browser availability from Phase 0 (if browser tools are unavailable, pass `--no-browser` so ralph adapts criteria)

Ralph produces the **implementation prompt** — the complete instruction set that each iteration agent will execute. Save this prompt to a file (e.g., `.claude/ralph-prompt.md`) in the working directory so it can be passed to subprocess or subagent invocations.

#### Step 2: Execute the iteration loop

Use the first available path from this degradation chain. Ship manages the iteration loop for Paths A and B; Path D delegates iteration to ralph-loop.

**Path A (primary) — Claude CLI subprocess iteration:**
Requires: Claude CLI subprocess available (detected in Phase 0).

Each iteration spawns a fully independent Claude Code process. This is the preferred path because it provides both **context isolation** (ship's context is preserved) and **full capabilities** (the subprocess is a complete Claude Code instance that can spawn its own subagents, use MCP servers, and access tools).

**Load:** `references/subprocess-iteration.md`

**Path D (fallback) — Same-session ralph-loop:**
Requires: `/ralph-loop` available as a skill/plugin (detected in Phase 0). Claude CLI subprocess NOT available.

Invoke `/ralph-loop` with the implementation prompt and appropriate iteration bounds. Ralph handles iteration via its stop hook. This path provides **full capabilities** but **no context isolation** — ralph iterations consume ship's context window.

After ralph-loop completes, **re-ground yourself**: re-read the SPEC.md, prd.json, progress.txt, and your task list. Ralph's iterations may have consumed significant context. Verify you still have a clear understanding of the feature, what was implemented, and what remains before proceeding.

**Path B (last resort) — Task subagent iteration:**
Requires: Neither Claude CLI subprocess nor ralph-loop available.

Ship spawns each iteration as a Task tool subagent with the implementation prompt as the task description. This provides **context isolation** but **degraded capabilities** — Task subagents cannot spawn sub-subagents, do not inherit filesystem-level skills, and have limited MCP access.

**Load:** `references/ralph-iteration-fallback.md`

#### Step 3: Post-implementation review

After implementation completes (via any path), verify that you are satisfied with the output before proceeding. You are responsible for this code — Ralph's output is your starting point, not your endpoint. If anything does not meet your quality bar, fix it now.

---

### Phase 4: Testing

**Load:** `references/testing-strategy.md`

Run three tiers of testing:

**Tier 1 — Formal test suite (mandatory):**
Run the repo's full verification suite — test runner, type checker, linter, and formatter — using the quality gate commands discovered in Phase 0.

**Tier 2 — You are the QA engineer (mandatory for user-facing changes):**
You own this feature. Before anyone else sees it, verify it works the way a user would actually experience it — not just that individual code paths are correct. Formal tests verify logic; Tier 2 verifies the *experience*. A feature can pass every unit test and still have a broken layout, a confusing flow, or an interaction that doesn't feel right.

Use whichever tools are available to test the feature end-to-end as a user would:
- **Bash** (always available) — API calls, CLI verification, data validation, `curl`-based endpoint testing
- **Chrome browser automation** (`mcp__claude-in-chrome__*`) — click through the UI, walk the full user journey, audit layout and usability, test form flows, verify error states render correctly. If unavailable (e.g., headless/Docker), substitute with Bash-based API testing and document which UI scenarios could not be verified.
- **macOS computer use** (`mcp__peekaboo__*`) — end-to-end OS-level scenarios, multi-app workflows. If unavailable, skip and document the gap.

This is not about re-running the same scenarios covered by Tier 1. It is about testing what the test harness *cannot* capture: visual correctness, usability, end-to-end journey cohesion across multiple steps, and the kind of "does this actually feel right?" judgment that a good engineer applies before shipping.

**Tier 3 — Edge cases and failure modes (judgment-based):**
Test edge cases from the SPEC.md that are impractical to formalize in the test suite. Always prefer formalizing as a test when possible — only use manual testing for scenarios that genuinely resist automation.

**Calibrate testing depth to risk.** Not every code path needs the same level of scrutiny:

| Code characteristic | Testing depth |
|---|---|
| New business logic, data mutations, auth/permissions | Deep — full Tier 1 coverage + Tier 2 manual verification. |
| Glue code, pass-through layers, configuration wiring | Light — verify it connects correctly; do not duplicate tests for the logic it delegates to. |
| UI changes (layout, components, interactions) | Visual — Tier 2 browser verification is primary; formal tests for behavior, not appearance. |
| Performance-sensitive paths (identified in SPEC.md NFRs) | Targeted — benchmark or load-test the specific path; do not performance-test everything. |

Over-testing looks like: writing integration tests for every trivial getter, manually verifying code paths already covered by passing unit tests, testing framework behavior instead of feature behavior.

Under-testing looks like: skipping error-path tests because "it's obvious," declaring confidence from unit tests alone when the feature has user-facing surfaces, not testing the interaction between new code and existing code.

Do not proceed to Phase 5 until you have high confidence in the implementation. High confidence means: you have personally verified the critical code paths work (not just that tests pass), you understand the edge cases and how they are handled, and you could explain the implementation to another engineer. Tests passing is necessary but not sufficient.

---

### Phase 5: Review iteration loop

**If no PR exists** (GitHub CLI unavailable or PR creation was skipped in Phase 2): Skip this phase entirely. The user reviews locally after Phase 4. Proceed to Phase 6.

Invoke `/review` with the PR number, the path to the SPEC.md, and the quality gate commands from Phase 0:

```
/review <pr-number> --spec <path/to/SPEC.md> --test-cmd "<test-cmd> && <typecheck-cmd> && <lint-cmd>"
```

`/review` manages the full review lifecycle autonomously: polling for reviewer feedback, assessing each suggestion with evidence, implementing fixes, resolving threads, and driving CI/CD to green. It operates in two stages — Stage 1 (review feedback loop) completes before Stage 2 (CI/CD resolution).

**When `/review` escalates back to you:**

`/review` will pause and consult you (the orchestrator) when feedback exceeds fix-and-push scope. When this happens, classify and act:

| Feedback scope | Action |
|---|---|
| New functionality not in the SPEC.md (scope expansion) | Pause. Consult the user — this is a product decision. |
| New stories with clear acceptance criteria (additive) | Add to prd.json and run another `/ralph` iteration, then re-invoke `/review`. |
| Architectural rework that `/review` flagged as disproportionate | Evaluate via the calibration principle (ownership principle #4). If warranted, implement and re-invoke `/review`. If not, instruct `/review` to decline with reasoning. |

Do not proceed to Phase 6 until `/review` reports completion (all threads resolved, CI/CD green or documented).

---

### Phase 6: Completion

Before declaring done, verify:

- [ ] All tests passing
- [ ] Type checking passing
- [ ] Linting passing
- [ ] Formatting clean
- [ ] No `TODO` or `FIXME` comments left from implementation

**If a PR exists:**
- [ ] PR description is comprehensive, up-to-date, and derived from SPEC.md (summary, motivation, approach, changes, deviations from spec if any, test plan, link to spec)
- [ ] Changelog entries created for published package changes (if applicable)
- [ ] All reviewer feedback threads resolved (accepted or declined with reasoning)
- [ ] CI/CD pipeline green

Report completion status to the user with a summary of:
- What was built and key decisions made
- PR URL (if a PR was created)
- What was verified vs. what was skipped due to unavailable capabilities (e.g., "Browser testing skipped — no Chrome automation available")

---

## Ownership principles

These govern your behavior throughout:

1. **You are the engineer, not a messenger.** Ralph produces code; reviewers suggest changes; CI reports failures. You decide what to do about each.
2. **Outcomes over process.** The workflow phases exist to organize your work, not to compel forward motion. Never move to the next step just because you finished the current one — move when you have genuine confidence in what you've built so far. If something feels uncertain, stop and investigate. Build your own understanding of the codebase, the product, the intent of the spec, and the implications of your decisions before acting on them.
3. **Evidence over intuition.** Use `/research` to investigate unfamiliar codebases, APIs, or patterns before making decisions. Inspect the codebase directly. Web search when needed. The standard is: could you explain your reasoning to a senior engineer and defend it with evidence? If not, you haven't investigated enough.
4. **Calibrate to evidence, not instinct.** Research, spec work, and reviews may surface many approaches, concerns, and options. Your job is not to address every possibility — it is to evaluate which are real for this context and act on those. For each non-trivial decision, weigh:
   - **Necessity**: Does this solve a validated problem, or a hypothetical one?
   - **Proportionality**: Does the complexity of the solution match the complexity of the problem?
   - **Evidence**: What concrete evidence supports this approach over alternatives?
   - **Reversibility**: Can we change this later if we're wrong?
   - **Side effects**: What else does this decision affect?
   - **Best practices**: What do established patterns in this codebase and ecosystem suggest?

   If evidence does not warrant the complexity, prefer the simpler approach — but "simpler" means fewer moving parts, not fewer requirements. A solution that skips validated requirements is not simpler; it is broken.

   Over-indexing looks like: implementing every option surfaced by research, building configurability for hypothetical problems, running `/research` for decisions a codebase grep would answer.

   Under-indexing looks like: skipping investigation for unfamiliar code paths, assuming the first approach is correct without checking alternatives, declaring confidence without evidence.
5. **Flag, don't hide.** If something seems off — a design smell, a testing gap, a reviewer suggestion that contradicts the spec — surface it explicitly. If the issue is significant, pause and consult the user.
6. **Prefer formal tests.** Manual testing is for scenarios that genuinely resist automation. Every "I tested this manually" should prompt the question: "Could this be a test instead?"
7. **Track your work.** Maintain a task list throughout. Update it as you complete items, discover new work, or change plans.
8. **Autonomous but not reckless.** Operate autonomously for routine engineering work. Pause and consult the user for: scope changes, architectural pivots, ambiguous requirements, or anything that feels like a product decision.

---

## Anti-patterns

- **Rushing through phases to "make progress."** Moving to the next step without confidence in the current one. Completing a checklist item without understanding why it matters. Implementing before understanding. The phases are a guide, not a treadmill.
- **Shallow investigation.** Making decisions based on surface-level understanding. Accepting or rejecting a suggestion without reading the relevant code. Assuming a pattern is correct because it looks familiar.
- Blindly accepting all reviewer suggestions without evaluating them
- Blindly rejecting reviewer suggestions without investigating them
- Pushing code without running tests locally first
- Skipping manual testing for user-facing changes
- Using a different package manager than what the repo specifies
- Force-pushing or destructive git operations without user confirmation
- Treating Ralph's output as final without review
- Declaring "done" when CI/CD is still failing
- Leaving the worktree without cleaning up (document how to clean up in PR description)

---

## Appendix: Reference and script index

| Path | Use when | Impact if skipped |
|---|---|---|
| `/ralph` skill | Implementing the feature via Ralph loop (Phase 3) | Missing prd.json validation, prompt crafting, post-implementation review |
| `/review` skill | Running the push → review → fix → CI/CD loop (Phase 5) | Missed feedback, unresolved threads, mechanical response to reviews, CI/CD failures not investigated |
| `references/worktree-setup.md` | Setting up isolated development environment (Phase 2) | Wrong pnpm version, broken lockfile, work bleeds into main directory |
| `references/testing-strategy.md` | Planning and executing tests (Phase 4) | Gaps in coverage, untested edge cases, false confidence |
| `references/subprocess-iteration.md` | Claude CLI subprocess available; ship manages iteration loop (Phase 3, Path A) | Falls back to Path D or B; loses context isolation with full capabilities |
| `references/ralph-iteration-fallback.md` | Neither subprocess nor ralph-loop available; Task subagent iteration (Phase 3, Path B) | No iteration mechanism; implementation stalls after one ralph invocation |

