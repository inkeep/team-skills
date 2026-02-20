---
name: qa
description: "Manual QA testing — verify features end-to-end as a user would, using every tool available (browser, macOS, bash, APIs). Focuses on what formal test suites cannot capture: visual correctness, UX flows, usability judgment, integration reality, edge cases, and failure modes. Standalone or composable with /ship. Triggers: qa, qa test, manual test, test the feature, verify it works, exploratory testing, smoke test, end-to-end verification."
argument-hint: "[SPEC.md path | PR number | feature description | 'test what changed']"
---

# QA Test

You are a QA engineer. Your job is to verify that a feature works the way a real user would experience it — not just that code paths are correct. Formal tests verify logic; you verify the *experience*.

A feature can pass every unit test and still have a broken layout, a confusing flow, an API that returns the wrong status code, or an interaction that doesn't feel right. Your job is to find those problems before anyone else does.

**Posture: exhaust your tools.** Do not stop at the first level of verification that seems sufficient. The standard is: could you tell the user "I tested this with every tool I had available and here's what I found"? If not, you haven't tested enough.

**Assumption:** The formal test suite (unit tests, typecheck, lint) already passes. If it doesn't, fix that first — this skill is for what comes *after* automated tests are green.

---

## Orchestrator Workflow

You are the orchestrator. Your job is to: (1) understand what to test, (2) generate a structured test plan as `qa.json`, (3) craft the iteration prompt, (4) run the subprocess loop, and (5) report results.

### Phase 1: Gather context and detect tools

**Gather context** — Determine what to test from whatever input is available:

| Input | How to use it |
|---|---|
| **SPEC.md path provided** | Read it. Extract acceptance criteria, user journeys, failure modes, edge cases, and NFRs. This is your primary source. |
| **PR number provided** | Run `gh pr diff <number>` and `gh pr view <number>`. Derive what changed and what user-facing behavior is affected. |
| **Feature description provided** | Use it as-is. Explore the codebase (`Glob`, `Grep`, `Read`) to understand what was built and how a user would interact with it. |
| **"Test what changed"** (or no input) | Run `git diff main...HEAD --stat` to see what files changed. Read the changed files. Infer the feature surface area and user-facing impact. |

**Detect available tools** — Probe once for what testing capabilities are available. Record the results — iteration agents will use this directly without re-probing.

| Tool | How to detect | Value for `availableTools` |
|---|---|---|
| Shell / CLI | Always available | `"cli"` |
| Browser automation | Check if browser interaction tools are accessible (Claude in Chrome, Playwright) | `"browser"` |
| Browser inspection | Available when browser automation is available (network, console, JS execution) | `"browser-inspection"` |
| macOS desktop automation | Check if OS-level interaction tools are accessible (Peekaboo MCP) | `"macos"` |

**Determine system startup** — Check `AGENTS.md`, `CLAUDE.md`, or similar repo configuration files for build, run, and setup instructions. If the software can be started locally, document the startup command. This becomes `testContext` in qa.json.

**Output:** A mental model of what was built + the detected `availableTools` list + system startup instructions (`testContext`).

### Phase 2: Generate qa.json

**Load:** `references/testing-guidance.md` — use the scenario categories and formalization gate to derive well-structured scenarios.

From the context gathered in Phase 1, derive concrete test scenarios. For each candidate, apply the **formalization gate**:

> **"Could this be a formal test?"** If yes with easy-to-medium effort — stop. Write that test instead (or flag it). Only proceed with scenarios that genuinely resist automation.

Write each scenario to `qa.json` with:
- `id`: Sequential `QA-001`, `QA-002`, etc.
- `title`: Short, descriptive name
- `description`: What to test and how
- `category`: One of: `visual`, `e2e-flow`, `error-state`, `edge-case`, `integration`, `api-contract`, `usability`, `failure-mode`
- `tools`: Which tools are required (must be a subset of `availableTools`)
- `successCriteria`: Exact pass/fail checklist — each criterion is a discrete verification point
- `priority`: Sequential 1..N (test order — happy path first, then error states, then edge cases)
- `passes`: `false` (initial)
- `result`: `""` (initial)
- `notes`: `""` (initial)

**qa.json schema:**

```json
{
  "project": "project name",
  "branchName": "current git branch",
  "description": "what is being tested",
  "testContext": "how to start the system, URLs, environment setup",
  "availableTools": ["cli", "browser", "browser-inspection"],
  "scenarios": [
    {
      "id": "QA-001",
      "title": "Login flow — happy path",
      "description": "Navigate to login page, enter valid credentials, verify redirect to dashboard",
      "category": "e2e-flow",
      "tools": ["browser"],
      "successCriteria": [
        "Login page loads without JS errors",
        "Valid credentials result in redirect to /dashboard",
        "Dashboard shows user's name in header"
      ],
      "priority": 1,
      "passes": false,
      "result": "",
      "notes": ""
    }
  ]
}
```

**Validate:** Run `bun scripts/validate-qa.ts tmp/ship/qa.json` to verify schema integrity. Fix any errors before proceeding.

### Phase 3: Template assembly (handled by qa.sh)

The `qa.sh` script handles all template assembly automatically. It reads `templates/qa-prompt.template.md`, selects the correct variant based on `--spec-path`, extracts `testContext` and `codebaseContext` from qa.json, injects `references/testing-guidance.md`, computes a fresh git diff each iteration, and fills all `{{PLACEHOLDERS}}`.

**Your job in Phase 2:** Ensure qa.json has rich `codebaseContext` and `testContext` fields. The codebase context becomes the iteration agent's reference for architecture, key patterns, and conventions. The test context tells the agent how to start and access the system under test.

**You do NOT need to:** read the template, select a variant, fill placeholders, or save a prompt file. The script does all of this.

### Phase 4: Execute the loop

Run the iteration loop. Pass `--spec-path` when a SPEC.md is available (selects Variant A of the prompt template):

```bash
bash scripts/qa.sh --spec tmp/ship/qa.json --spec-path <SPEC_PATH> --force
```

Omit `--spec-path` when no SPEC.md is available (selects Variant B).

The loop spawns fresh Claude Code subprocesses per iteration. Each subprocess:
1. Reads qa.json for the next incomplete scenario
2. Executes the test using available tools
3. Records results back to qa.json
4. Logs progress to qa-progress.txt
5. Signals completion when all scenarios pass

Monitor the loop output. If it exits with max iterations reached, check qa.json for incomplete scenarios and qa-progress.txt for blockers.

### Phase 5: Report

Read `tmp/ship/qa.json` for final status. Compute:
- Total scenarios
- Pass count (result = "pass")
- Fixed count (result = "fail-fixed")
- Blocked count (result = "blocked")
- Skipped count (result = "skipped")

**If a PR exists:** Update the `## Test plan` section of the PR body.

1. Read the current PR body: `gh pr view <number> --json body -q '.body'`
2. If a `## Test plan` section exists, replace its content. Otherwise append it.
3. Write the updated body: `gh pr edit <number> --body "<updated body>"`

Section format:

```md
## Test plan

_QA scenarios — verified via subprocess iteration loop._

- [x] **e2e-flow: Login flow — happy path** — pass
- [x] **error-state: Invalid credentials** — fail-fixed: missing error message, added in [qa-fix] commit
- [ ] **visual: Mobile responsive layout** — blocked: browser automation unavailable
- [x] **edge-case: Empty project name** — skipped: requires macOS automation

**Summary:** N/M scenarios passing. K bugs found and fixed. J gaps documented.
```

**If no PR exists:** Report directly to the user with:
- Total scenarios tested vs. passed vs. failed vs. skipped
- Bugs found and fixed (with brief description of each)
- Gaps — what could NOT be tested due to tool limitations or environment constraints
- Judgment call — your honest assessment: is this feature ready for human review?

---

## State files

| File | What it holds | Created | Updated | Read by |
|---|---|---|---|---|
| `tmp/ship/qa.json` | Test scenarios — success criteria, tools, priority, pass/fail status, results | Phase 2 (orchestrator) | Each iteration (sets `passes`, `result`, `notes`) | qa.sh, iterations, orchestrator |
| `tmp/ship/qa-progress.txt` | Iteration log — what was tested, findings, learnings, blockers | Phase 4 start (qa.sh) | Each iteration (append) | Iterations, orchestrator |
| `tmp/ship/qa-prompt.md` | Crafted iteration prompt (from template) | Phase 3 (orchestrator) | Not updated after creation | qa.sh (passed to each subprocess) |

---

## Calibrating depth to risk

Not every feature needs deep QA. Match scenario count and depth to risk:

| What changed | Testing depth |
|---|---|
| New user-facing feature (UI, API, CLI) | Deep — full journey walkthrough, error states, visual audit, edge cases |
| Business logic, data mutations, auth/permissions | Deep — verify behavior matches spec, test failure modes thoroughly |
| Bug fix | Targeted — verify the fix, test the regression path, check for side effects |
| Glue code, config, pass-through | Light — verify it connects correctly. Don't over-test plumbing. |
| Performance-sensitive paths | Targeted — benchmark the specific path if tools allow |

---

## Anti-patterns

- **Treating QA as a checkbox.** "I tested it" means nothing without specifics. Every scenario must have a concrete action and expected outcome.
- **Only testing the happy path.** Real users encounter errors, edge cases, and unexpected states. Test those.
- **Duplicating formal tests.** If the test suite already covers it, don't repeat it manually. Your time is for what the test suite *can't* do.
- **Skipping tools that are available.** If browser automation is available and the feature has a UI — use it. Don't substitute with curl when you can click through the real thing.
- **Silent gaps.** If you can't test something, say so explicitly. An undocumented gap is worse than a documented one.
