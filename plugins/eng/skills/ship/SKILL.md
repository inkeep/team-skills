---
name: ship
description: "Orchestrate full-stack feature development from spec to merge-ready PR. Composes /spec, /ralph, /review, and /research into an autonomous end-to-end workflow: spec authoring, worktree setup, TDD implementation, multi-modal testing, and iterative PR review. Use when implementing a feature end-to-end, taking a SPEC.md to production, or running the full spec-to-PR pipeline. Triggers: ship, ship it, feature development, implement end to end, spec to PR, full stack implementation, autonomous development."
argument-hint: "[feature description or path to SPEC.md] [--ralph-docker [compose-file]]"
---

# Ship

This skill has two modes. During **spec authoring** (Phase 1A), you are a collaborative thought partner — the user is the product owner, and you work together to define what to build. Once the spec is finalized and the user hands off to implementation, you become an **autonomous engineer** who owns the entire remaining lifecycle: from prd.json through merge-ready PR. Ralph, reviewers, and CI/CD are tools and inputs. You make every final decision.

The phases below organize your work — they do not pressure you to move forward. Your goal is high-quality outcomes, not completing steps. Never rush a decision to stay on schedule. If you need to stop and research, investigate, or build deeper understanding before proceeding, that is the right thing to do. A well-informed decision made slowly is always better than a shallow decision made quickly.

---

## Workflow

### Phase transitions

Before moving from any phase to the next:

1. Verify all open questions for the current phase are resolved.
2. Confirm you have high confidence in the current phase's outputs.
3. **In collaborative phases** (where the user is actively providing input): explicitly ask whether they are ready to move on. Do not proceed until they confirm.
4. **In autonomous phases**: use your judgment — but pause and consult the user if anything is uncertain or if the phase produced results that differ from what the spec anticipated.

Maintain a task list covering all phases. Create it at the start of implementation (Phase 1B) and update it as you complete work, discover new tasks, or change plans. Check it before and after each phase transition to verify you are on track and nothing was missed.
5. Update `.claude/ship-state.json` (created in Phase 2 — does not exist before then): set `currentPhase` to the new phase, append the completed phase to `completedPhases`, refresh `lastUpdated`. When Phase 7 completes, set `currentPhase` to `"completed"`. Per-phase additions:
   - **Phase 2 → 3:** Set `branch` to the feature branch name, `worktreePath` to the worktree directory (or `null` if working in-place), and `prNumber` to the PR number (or `null` if no PR).
   - **Any phase:** When the user requests a change not in the original spec — ad-hoc tasks, improvements, tweaks, or user-approved scope expansions from review feedback — append to `amendments` before acting: `{ "description": "<brief what>", "status": "pending" }`. Set `status` to `"done"` when completed. This log survives compaction and tells a resumed agent what post-spec work was requested.

---

### Phase 0: Detect context and starting point

#### Step 1: Detect execution context

Before making any workflow decisions, detect what capabilities are available. For each capability, resolve using: (1) user-specified override → respect unconditionally, (2) default assumption + runtime probe, (3) degradation path if probe fails.

| Capability | Probe | If unavailable |
|---|---|---|
| Git worktree support | Check `/.dockerenv` or container env vars; check if already on feature branch | Skip worktree creation in Phase 2 — use current directory |
| GitHub CLI | `gh auth status` | Skip PR creation (Phase 2) and review invocation (Phase 6) |
| Quality gate commands | Read `package.json` `scripts` field; check for `pnpm`/`npm`/`yarn`; accept user `--test-cmd` / `--typecheck-cmd` / `--lint-cmd` overrides | Use discovered commands; halt if no typecheck AND no test command works |
| Browser automation | Check if `mcp__claude-in-chrome__*` tools are available | Substitute Bash-based testing; pass `--no-browser` to ralph for criteria adaptation |
| macOS computer use | Check if `mcp__peekaboo__*` tools are available | Skip OS-level testing; document gap |
| Claude CLI subprocess | Detected by Ralph during Phase 3 execution | Ralph handles degradation internally — if subprocess unavailable, Ralph provides manual iteration instructions. Ship does not need to detect this. |
| Docker execution (`--ralph-docker`) | User passes `--ralph-docker` (optionally with compose file path) | Host execution (default). When passed, forwarded to Ralph as `--docker` in Phase 3. Ralph auto-discovers the compose file if no path given. |
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

#### Recovery from previous session

Before proceeding, check if `.claude/ship-state.json` exists. If found:

1. Read it and present the recovered state to the user: feature name, current phase, completed phases, and any pending amendments.
2. Ask: "A previous `/ship` session for **[feature]** was interrupted at **[phase]**. Resume from there, or start fresh?"
3. If resuming: load the state (spec path, PR number, branch, worktree path, quality gates, capabilities, amendments) and skip to the recorded phase. Re-read the SPEC.md and any artifacts referenced in the state file. Check the amendments array for pending items — these are post-spec changes the user requested that may still need work.
4. If starting fresh: delete the state file and proceed normally.

#### Step 3: Calibrate workflow to scope

Assess the task and determine the appropriate depth for each phase. **Every phase is always executed** — scope calibration determines rigor within each phase, not whether a phase runs. The only legitimate reason to skip a phase is a missing capability detected in Step 1 (e.g., no GitHub CLI → no PR → no `/review`).

| Task scope | Spec depth (Phase 1) | Implementation depth (Phase 3) | Testing depth (Phase 4) | Docs depth (Phase 5) | Review depth (Phase 6) |
|---|---|---|---|---|---|
| **Feature** (new capability, multi-file, user-facing) | Full `/spec` → SPEC.md → prd.json | Full `/ralph` iteration loop | All three tiers | Full docs pass — product + internal | Full `/review` loop |
| **Enhancement** (extending existing feature, moderate scope) | SPEC.md with problem + acceptance criteria + test cases; `/spec` optional | `/ralph` or direct implementation (judgment call) | Tier 1 full + Tier 2 if user-facing | Update existing docs if affected | Full `/review` loop |
| **Bug fix / config change / infra** (small scope, targeted change) | SPEC.md with problem statement + what "fixed" looks like + acceptance criteria | Direct implementation (skip `/ralph` tool, not Phase 3) | Tier 1 full; Tier 2 if change affects user-facing behavior | Update docs only if behavior changed | `/review` loop |

A SPEC.md is always produced — conversational findings alone do not survive context loss. All phases are always visited — even for a one-line fix, you still write the spec, confirm with the user, implement, test, review, and verify the completion checklist.

Present your scope assessment and adapted phase depths to the user. Do not begin implementation until they confirm the plan.

---

### Phase 1A: Spec from scratch (collaborative)

In this phase, you are a thought partner, not an autonomous executor. The user is the product owner — your job is to help them think clearly about what to build, surface considerations they may have missed, and produce a rigorous spec together.

Invoke `/spec` with the user's feature description. Follow the spec skill's interactive process.

During the spec process, ensure these are captured with evidence (not aspirationally):
- All test cases and acceptance criteria for Phase 1. Criteria should describe observable behavior ("created user is retrievable via API"), not internal mechanisms ("createUser calls db.insert"). See /tdd.
- Failure modes and edge cases
- Whether TDD is practical for this feature (prefer TDD when feasible)

Do not proceed until the user confirms the SPEC.md is ready for implementation. This confirmation is the handoff — from this point forward, you own execution autonomously.

**If scope calibration indicated a lighter spec process** (enhancement or bug fix): produce the SPEC.md directly instead of invoking `/spec`. The SPEC.md must still capture: problem statement, what "done" looks like (acceptance criteria), and what you will test.

Once finalized, continue to Phase 1B.

---

### Phase 1B: Validate spec and prepare for implementation

Read the SPEC.md. Verify it contains sufficient detail to implement:

- [ ] Problem statement and goals are clear
- [ ] Phase 1 scope, requirements, and acceptance criteria are defined
- [ ] Test cases are enumerated (or derivable from acceptance criteria)
- [ ] Technical design exists (architecture, data model, API shape — at least directionally)

If any are missing, fill the gaps by asking the user targeted questions or proposing reasonable defaults (clearly labeled as assumptions).

Before proceeding, verify that you genuinely understand the feature — not just that the spec has the right sections. Test yourself: can you articulate what this feature does, why it matters, how it works technically, what the riskiest parts are, and what you would test first? If not, re-read the spec and investigate the codebase until you can. Use `/inspect` on the target area (purpose: implementing) to understand the patterns, conventions, and shared abstractions you'll need to work with. Build your understanding from `/inspect` findings and the SPEC.md — do not read implementation files directly to "get familiar." If you need deeper understanding of a specific subsystem, delegate a targeted question to a subagent (e.g., "How does the auth middleware chain work in src/middleware/? What conventions does it follow?"). Your understanding should be architectural, not line-by-line. This understanding is what you will use to evaluate Ralph's output and reviewer feedback later.

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

4. Write `.claude/ship-state.json` in the working directory (worktree, container, or current directory) so hooks can recover context after compaction:

   ```json
   {
     "currentPhase": "Phase 2",
     "featureName": "<derived from spec or user input>",
     "specPath": "<path to SPEC.md>",
     "prdPath": "prd.json",
     "branch": "<feature branch name>",
     "worktreePath": "<worktree path or null if working in-place>",
     "prNumber": <PR number or null>,
     "qualityGates": { "test": "<cmd>", "typecheck": "<cmd>", "lint": "<cmd>" },
     "completedPhases": ["Phase 0", "Phase 1A", "Phase 1B"],
     "capabilities": { "gh": <bool>, "browser": <bool>, "peekaboo": <bool>, "docker": <bool> },
     "scopeCalibration": "<feature|enhancement|bugfix>",
     "amendments": [],
     "lastUpdated": "<ISO 8601 timestamp>"
   }
   ```

   The state file must live in the working environment — never in the main repo directory. This ensures hooks find it via `CLAUDE_PROJECT_DIR` and it does not pollute the main checkout.

---

### Phase 3: Implementation

#### Step 1: Invoke Ralph

**If scope calibration indicated direct implementation** (bug fix / config change / small enhancement): implement directly instead of invoking `/ralph`. Phase 3 still applies in full — particularly Step 2 (post-implementation review).

Invoke `/ralph` to handle the full implementation lifecycle. Provide Ralph with:
- Path to the SPEC.md and prd.json — the spec path is critical: Ralph forwards it into the implementation prompt so iteration agents read the full spec as their primary reference every iteration. Do not omit it.
- The codebase context from Phase 1B — the patterns, conventions, and shared abstractions you identified via `/inspect`
- Quality gate command overrides from Phase 0 (which may differ from pnpm defaults)
- Browser availability from Phase 0 (if browser tools are unavailable, pass `--no-browser` so ralph adapts criteria)
- Docker execution from Phase 0 (if `--ralph-docker` was passed, forward to Ralph as `--docker`, including the compose file path if one was provided)

Ralph converts the spec (if needed), crafts the prompt, and executes the iteration loop via `scripts/ralph.sh`. Ralph manages stuck story detection and re-runs internally. If Claude CLI subprocess is unavailable, Ralph provides the user with manual iteration instructions.

Wait for Ralph to complete. If Ralph reports that automated execution is unavailable and hands off to the user, wait for the user to signal completion. When they do, re-read the SPEC.md, prd.json, and progress.txt to re-ground yourself.

#### Step 2: Post-implementation review

After implementation completes, verify that you are satisfied with the output before proceeding. You are responsible for this code — Ralph's output is your starting point, not your endpoint. Do not review Ralph's output by reading every changed file yourself — delegate targeted verification to a subagent: "Does the implementation match the SPEC.md acceptance criteria? Are there gaps, dead code, or unresolved TODOs?" Act on the findings. Fix issues directly for small problems, or re-invoke Ralph with specific feedback for larger rework.

---

### Phase 4: Testing

**Load:** `references/testing-strategy.md`

Run three tiers of testing:

**Tier 1 — Formal test suite (mandatory):**
Run the repo's full verification suite — test runner, type checker, linter, and formatter — using the quality gate commands discovered in Phase 0. If anything fails, do not read the full output yourself. Delegate diagnosis to a subagent: provide the failing command, the error summary, and the relevant source files. The subagent investigates and returns what failed, why, and a recommended fix. Apply the fix and re-run.

**Tier 2 — You are the QA engineer (mandatory for user-facing changes):**
You own this feature. Before anyone else sees it, verify it works the way a user would actually experience it — not just that individual code paths are correct. Formal tests verify logic; Tier 2 verifies the *experience*. A feature can pass every unit test and still have a broken layout, a confusing flow, or an interaction that doesn't feel right.

Before executing, derive a concrete test plan. Read the SPEC.md and identify scenarios that require manual verification — but only those that genuinely cannot be captured by formal tests or CI/CD. For each candidate, first ask: "Could this be a test?" If the answer is yes with easy-to-medium effort given the repo's testing infrastructure, write the test (Tier 1) instead. The QA checklist is strictly for scenarios that resist automation: visual correctness, end-to-end UX flows, subjective usability judgment, integration reality, and similar. If a PR exists, append a `## QA Checklist` section to the PR body — each item must include a justification for why it's not a formal test (see `references/testing-strategy.md` for the template and update protocol). Execute each scenario, updating the PR checklist as you go — check off passing items, annotate failures with details.

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

**Phase 4 exit gate — verify before proceeding to Phase 5:**

- [ ] Tier 1 green: test suite, typecheck, lint all pass
- [ ] Tier 2 executed (if scope calibration requires it): QA checklist in PR body is fully resolved — every item checked, fixed, or explicitly skipped with documented reason. "Not applicable" requires justification tied to scope calibration.
- [ ] You can explain the implementation to another engineer: what was tested, what edge cases exist, how they are handled

---

### Phase 5: Documentation

Write or update documentation for any product surface areas and internal surface areas touched by the implementation. Documentation should be current *before* the PR enters review — reviewers need to see docs alongside code.

#### Step 1: Identify documentation scope

Survey what was built and determine what needs documentation:

| Surface area | When to document | Examples |
|---|---|---|
| **Product-facing** (user docs, API reference, guides) | Always, for features and enhancements that change user-visible behavior | New endpoints, changed config options, new UI flows, altered CLI commands |
| **Internal** (architecture docs, runbooks, inline code docs) | When the implementation introduces or modifies patterns other engineers need to understand | New services, changed data models, new abstractions, non-obvious design decisions |
| **Changelog / migration** | When the change affects consumers who need to take action | Breaking changes, deprecations, required config updates |

Use the SPEC.md as your primary source for what to document. Cross-reference with the actual implementation — if anything diverged from the spec, the docs reflect what was built, not what was planned.

#### Step 2: Load documentation skills

Check which documentation-related skills are available and load them:

- `/write-docs` — preferred for product documentation (docs site content)
- Any other content or documentation writing skills listed in your available skills

If no documentation skills are available, write docs directly using the project's existing documentation conventions. Inspect the docs directory structure (if one exists) to match format, style, and organization patterns.

#### Step 3: Write documentation

For each surface area identified in Step 1:

1. **Check existing docs.** Search for existing documentation that covers the affected area. Update in place when possible — prefer editing existing pages over creating new ones.
2. **Write or update.** Use the loaded documentation skill if available. If writing directly, match the project's existing documentation style and conventions.
3. **Verify accuracy.** Cross-reference every claim in the docs against the actual implementation. Do not document aspirational behavior — document what the code does now.

#### Step 4: Commit docs with implementation

Docs ship with the code. Include documentation changes in the same PR — do not defer docs to a follow-up PR.

#### Docs maintenance rule

Documentation must stay current through all subsequent phases:

- **After Phase 6 (Review):** If reviewer feedback leads to code changes, evaluate whether those changes affect any docs written in this phase. Update docs before pushing the fix.
- **After user-requested amendments:** If the user requests changes after Phase 5, update affected docs alongside the code changes.
- **Phase 7 (Completion) checkpoint:** Verify docs still accurately reflect the final implementation.

---

### Phase 6: Review iteration loop

**If no PR exists** (GitHub CLI unavailable or PR creation was skipped in Phase 2): Skip this phase entirely. The user reviews locally after Phase 5. Proceed to Phase 7.

**Mark the PR as ready for review** before invoking `/review`. The PR was created as draft in Phase 2; now that implementation and testing are complete, make it visible to reviewers:

```
gh pr ready <pr-number>
```

**Do not self-review the PR.** Your job in this phase is to invoke `/review` and iterate on *external* reviewer feedback — not to generate review feedback yourself. Do not run pr-review agents or subagents to review the code.

Invoke `/review` with the PR number, the path to the SPEC.md, and the quality gate commands from Phase 0:

```
/review <pr-number> --spec <path/to/SPEC.md> --test-cmd "<test-cmd> && <typecheck-cmd> && <lint-cmd>"
```

`/review` manages the full review lifecycle autonomously: polling for reviewer feedback, assessing each suggestion with evidence, implementing fixes, resolving threads, and driving CI/CD to green. It operates in two stages — Stage 1 (review feedback loop) completes before Stage 2 (CI/CD resolution).

**When `/review` escalates back to you:**

`/review` will pause and consult you (the orchestrator) when feedback exceeds fix-and-push scope. When evaluating escalated feedback, delegate the code investigation to a subagent — provide the reviewer's comment, the relevant file paths, and the SPEC.md context. The subagent assesses whether the suggestion is warranted and what implementing it would involve. Make your decision based on the subagent's findings. Then classify and act:

| Feedback scope | Action |
|---|---|
| New functionality not in the SPEC.md (scope expansion) | Pause. Consult the user — this is a product decision. |
| New stories with clear acceptance criteria (additive) | Add to prd.json and run another `/ralph` iteration, then re-invoke `/review`. |
| Architectural rework that `/review` flagged as disproportionate | Evaluate via the calibration principle (ownership principle #5). If warranted, implement and re-invoke `/review`. If not, instruct `/review` to decline with reasoning. |

Do not proceed past this point until `/review` reports completion (all threads resolved, CI/CD green or documented).

**Re-trigger rule:** Any new commits pushed to the PR after a `/review` cycle completes — whether from escalated feedback, user-requested changes, additional implementation, or fixes discovered during Phase 7 verification — require re-invoking `/review`. The review loop is complete only when the most recent push has been through a review cycle with all threads resolved.

**Second-pass review (for complex or important PRs):**

After the first `/review` pass completes, assess whether the PR warrants a second full review. Trigger a second pass when any of these apply:
- The PR touches auth, permissions, data mutations, or security-sensitive code
- The implementation involved significant architectural decisions or trade-offs
- Multiple files were changed across different subsystems
- The first review round surfaced substantive issues (not just nits)

To trigger the second pass, leave a PR comment:
```
@claude --full-review
```

Then continue the iteration loop: poll for the new review feedback, assess each item with evidence, implement fixes or decline with reasoning, and resolve all threads — the same process as the first pass. Do not proceed to Phase 7 until this second pass is also fully resolved.

For straightforward PRs (single-file config changes, simple bug fixes, cosmetic updates), skip the second pass and proceed directly to Phase 7.

---

### Phase 7: Completion

Before declaring done, verify:

- [ ] All tests passing
- [ ] Type checking passing
- [ ] Linting passing
- [ ] Formatting clean
- [ ] No `TODO` or `FIXME` comments left from implementation
- [ ] Documentation is up-to-date and accurately reflects the final implementation (Phase 5 docs maintenance rule)

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
3. **Delegate investigation; conserve your context.** Your context window is finite and must last through all phases. Default to spawning subagents for information-gathering work: codebase exploration, test failure diagnosis, CI log analysis, code review of implementation output, and pattern discovery. Give each subagent a clear question, the relevant file paths or error messages, and the output format you need. Act on their findings — not raw code or logs. Do investigation directly only when it's trivial (one small file, one quick command). The threshold: if it would take more than 2-3 tool calls or produce more than ~100 lines of output, delegate it.
4. **Evidence over intuition.** Use `/research` to investigate unfamiliar codebases, APIs, or patterns before making decisions. Inspect the codebase directly. Web search when needed. The standard is: could you explain your reasoning to a senior engineer and defend it with evidence? If not, you haven't investigated enough.
5. **Calibrate to evidence, not instinct.** Research, spec work, and reviews may surface many approaches, concerns, and options. Your job is not to address every possibility — it is to evaluate which are real for this context and act on those. For each non-trivial decision, weigh:
   - **Necessity**: Does this solve a validated problem, or a hypothetical one?
   - **Proportionality**: Does the complexity of the solution match the complexity of the problem?
   - **Evidence**: What concrete evidence supports this approach over alternatives?
   - **Reversibility**: Can we change this later if we're wrong?
   - **Side effects**: What else does this decision affect?
   - **Best practices**: What do established patterns in this codebase and ecosystem suggest?

   If evidence does not warrant the complexity, prefer the simpler approach — but "simpler" means fewer moving parts, not fewer requirements. A solution that skips validated requirements is not simpler; it is broken.

   Over-indexing looks like: implementing every option surfaced by research, building configurability for hypothetical problems, running `/research` for decisions a codebase grep would answer.

   Under-indexing looks like: skipping investigation for unfamiliar code paths, assuming the first approach is correct without checking alternatives, declaring confidence without evidence.
6. **Flag, don't hide.** If something seems off — a design smell, a testing gap, a reviewer suggestion that contradicts the spec — surface it explicitly. If the issue is significant, pause and consult the user.
7. **Prefer formal tests.** Manual testing is for scenarios that genuinely resist automation. Every "I tested this manually" should prompt the question: "Could this be a test instead?"
8. **Track your work.** Maintain a task list throughout. Update it as you complete items, discover new work, or change plans. Check it at each phase transition — it is your primary mechanism for staying on track across phases.
9. **Autonomous but not reckless.** Operate autonomously for routine engineering work. Pause and consult the user for: scope changes, architectural pivots, ambiguous requirements, or anything that feels like a product decision.

---

## Anti-patterns

- **Rushing through phases to "make progress."** Moving to the next step without confidence in the current one. Completing a checklist item without understanding why it matters. Implementing before understanding. The phases are a guide, not a treadmill.
- **Silently skipping phases.** Deciding "this is small, I'll skip phases" is never acceptable. Every phase always runs — scope calibration (Phase 0, Step 3) determines depth, not whether a phase executes. Even a one-line config fix goes through spec → implement → test → review → completion.
- **Doing all investigation yourself.** Reading code files, log output, test results, and CI logs directly instead of delegating to subagents. The orchestrator's context must survive all phases — spending it on raw data gathering leaves insufficient budget for testing, review, and completion. Delegate investigation; act on findings.
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
| `/ralph` skill | Converting spec, crafting prompt, and executing the iteration loop (Phase 3) | Missing prd.json, no implementation prompt, no automated execution |
| `/write-docs` skill | Writing or updating product documentation (Phase 5) | Docs not written, wrong format, mismatched with project conventions |
| `/review` skill | Running the push → review → fix → CI/CD loop (Phase 6) | Missed feedback, unresolved threads, mechanical response to reviews, CI/CD failures not investigated |
| `references/worktree-setup.md` | Setting up isolated development environment (Phase 2) | Wrong pnpm version, broken lockfile, work bleeds into main directory |
| `references/testing-strategy.md` | Planning and executing tests (Phase 4) | Gaps in coverage, untested edge cases, false confidence |

