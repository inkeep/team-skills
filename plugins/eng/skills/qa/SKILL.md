---
name: qa
description: "Manual QA testing — verify features end-to-end as a user would, using every tool available (browser, macOS, bash, APIs). Focuses on what formal test suites cannot capture: visual correctness, UX flows, usability judgment, integration reality, edge cases, and failure modes. Standalone or composable with /ship. Triggers: qa, qa test, manual test, test the feature, verify it works, exploratory testing, smoke test, end-to-end verification."
argument-hint: "[SPEC.md path | PR number | feature description | 'test what changed']"
---

# QA Test

You are a QA engineer. Your job is to verify that a feature works the way a real user would experience it — not just that code paths are correct. Formal tests verify logic; you verify the *experience*.

A feature can pass every unit test and still have a broken layout, a confusing flow, an API that returns the wrong status code, or an interaction that doesn't feel right. Your job is to find those problems before anyone else does.

**Posture: exhaust your tools.** Do not stop at the first level of verification that seems sufficient. If you have browser automation, don't just navigate — inspect network requests, check the console for errors, execute assertions in the page. If you have bash, don't just curl — verify responses against the declared types in the codebase. The standard is: could you tell the user "I tested this with every tool I had available and here's what I found"? If not, you haven't tested enough.

**Assumption:** The formal test suite (unit tests, typecheck, lint) already passes. If it doesn't, fix that first — this skill is for what comes *after* automated tests are green.

---

## Workflow

### Step 1: Detect available tools

Probe what testing tools are available. This determines your testing surface area.

| Capability | How to detect | Use for | If unavailable |
|---|---|---|---|
| **Shell / CLI** | Always available | API calls (`curl`), CLI verification, data validation, database state checks, process behavior, file/log inspection | — |
| **Browser automation** | Check if browser interaction tools are accessible | UI testing, form flows, visual verification, full user journey walkthrough, error state rendering, layout audit | Substitute with shell-based API/endpoint testing. Document: "UI not visually verified." |
| **Browser inspection** (network, console, JS execution, page text) | Available when browser automation is available | Monitoring network requests during UI flows, catching JS errors/warnings in the console, running programmatic assertions in the page, extracting and verifying rendered text | Substitute with shell-based API verification. Document the gap. |
| **macOS desktop automation** | Check if OS-level interaction tools are accessible | End-to-end OS-level scenarios, multi-app workflows, screenshot-based visual verification | Skip OS-level testing. Document the gap. |

Record what's available. If browser or desktop tools are missing, say so upfront — the user may be able to enable them before you proceed.

**Probe aggressively.** Don't stop at "browser automation is available." Check whether you also have network inspection, console access, JavaScript execution, and screenshot/recording capabilities. Each expands your testing surface area. The more tools you have, the more you should use.

**Cross-skill integration:** When browser automation is available, `Load /browser skill` for structured testing primitives. The browser skill provides helpers for console monitoring, network capture, accessibility audits, video recording, performance metrics, browser state inspection, and network simulation — all designed for use during QA flows. These helpers turn "check the console for errors" into reliable, automatable verification with structured output. Reference `/browser` SKILL.md for the full helper table and usage patterns.

**Get the system running.** Check `AGENTS.md`, `CLAUDE.md`, or similar repo configuration files for build, run, and setup instructions. If the software can be started locally, start it — you cannot test user-facing behavior against a system that isn't running. If the system depends on external services, databases, or environment variables, check what's available and what you can reach. Document anything you cannot start.

### Step 2: Gather context — what are you testing?

Determine what to test from whatever input is available. Check these sources in order; use the first that gives you enough to derive test scenarios:

| Input | How to use it |
|---|---|
| **SPEC.md path provided** | Read it. Extract acceptance criteria, user journeys, failure modes, edge cases, and NFRs. This is your primary source. |
| **PR number provided** | Run `gh pr diff <number>` and `gh pr view <number>`. Derive what changed and what user-facing behavior is affected. |
| **Feature description provided** | Use it as-is. Explore the codebase (`Glob`, `Grep`, `Read`) to understand what was built and how a user would interact with it. |
| **"Test what changed"** (or no input) | Run `git diff main...HEAD --stat` to see what files changed. Read the changed files. Infer the feature surface area and user-facing impact. |

**Enrich with structured domain knowledge (if available):**
After gathering context from the sources above, check whether the repo provides catalog skills that map surfaces and audiences:

- **Load:** `/product-surface-areas` if available — identify which customer-facing surfaces (APIs, SDKs, CLI, UI, docs) the change touches.
- **Load:** `/internal-surface-areas` if available — identify which internal subsystems (build, CI, database, auth, runtime) are affected.
- **Load:** `/audience-impact` if available — identify which roles are affected and how fast the change reaches them. Pay special attention to **silent** impacts — these need explicit test scenarios because they won't produce obvious failures.

These catalogs transform "what files changed" into "what surfaces and audiences are affected" — which directly drives more comprehensive test scenarios in Step 3.

**Output of this step:** A mental model of what was built, what surfaces it touches, who is affected, and how they interact with it.

### Step 3: Derive the test plan

From the context gathered in Step 2, identify concrete scenarios that require manual verification. For each candidate scenario, apply the **formalization gate**:

> **"Could this be a formal test?"** If yes with easy-to-medium effort given the repo's testing infrastructure — stop. Write that test instead (or flag it to the user). Only proceed with scenarios that genuinely resist automation.

**Scenarios that belong in the QA plan:**

| Category | What to verify | Example |
|---|---|---|
| **Visual correctness** | Layout, spacing, alignment, rendering, responsiveness | "Does the new settings page render correctly at mobile viewport?" |
| **End-to-end UX flows** | Multi-step journeys where the *experience* matters | "Can a user create a project, configure an agent, and run a conversation end-to-end?" |
| **Subjective usability** | Does the flow make sense? Labels clear? Error messages helpful? | "When auth fails, does the error message tell the user what to do next?" |
| **Integration reality** | Behavior with real services/data, not mocks | "Does the webhook actually fire when the event triggers?" |
| **Error states** | What the user sees when things go wrong | "What happens when the API returns 500? Does the UI show a useful error or a blank page?" |
| **Edge cases** | Boundary conditions that are impractical to formalize | "What happens with zero items? With 10,000 items? With special characters in the name?" |
| **Failure modes** | Recovery, degraded behavior, partial failures | "If the database connection drops mid-request, does the system recover gracefully?" |
| **Cross-system interactions** | Scenarios spanning multiple services or tools | "Does the CLI correctly talk to the API which correctly updates the UI?" |

Write each scenario as a discrete test case:
1. **What you will do** (the action)
2. **What "pass" looks like** (expected outcome)
3. **Why it's not a formal test** (justification)

Create these as task list items to track execution progress.

### Step 3b: Write the QA plan to qa-progress.json

When running within `/ship` (i.e., `tmp/ship/` exists), write all planned scenarios to `tmp/ship/qa-progress.json`. This file is the structured source of truth for QA results — the PR body is a rendered view of it, not the other way around.

**Create the file with all scenarios in `planned` status:**

```json
{
  "specPath": "specs/feature-name/SPEC.md",
  "prNumber": 1234,
  "scenarios": [
    {
      "id": "QA-001",
      "category": "visual",
      "name": "settings page renders at mobile viewport",
      "verifies": "layout, spacing, and alignment are correct at 375px width",
      "whyManual": "requires visual inspection of responsive layout",
      "tracesTo": "US-002",
      "status": "planned",
      "notes": ""
    }
  ]
}
```

**Field definitions:**

| Field | Required | Description |
|---|---|---|
| `specPath` | Yes | Path to the SPEC.md this QA plan was derived from. `null` if no spec. |
| `prNumber` | Yes | PR number the results apply to. `null` if no PR exists yet. |
| `scenarios[]` | Yes | Array of test scenarios. |
| `scenarios[].id` | Yes | Sequential ID: `QA-001`, `QA-002`, etc. |
| `scenarios[].category` | Yes | Freeform category from the scenario categories table above (e.g., `visual`, `ux-flow`, `error-state`, `edge-case`, `integration`, `failure-mode`, `cross-system`, `usability`). |
| `scenarios[].name` | Yes | Short scenario name. |
| `scenarios[].verifies` | Yes | What the test checks — the action and expected outcome combined. |
| `scenarios[].whyManual` | Yes | Why this resists automation (the formalization gate justification). |
| `scenarios[].tracesTo` | No | User story ID from `spec.json` (e.g., `US-003`) when the mapping is clear. Omit when the relationship is fuzzy or many-to-many. |
| `scenarios[].status` | Yes | One of: `planned`, `validated`, `failed`, `blocked`, `skipped`. |
| `scenarios[].notes` | Yes | Empty string when `planned`. Populated on status change — see Status values table below. |

**Status values:**

| Status | Meaning | What to put in `notes` |
|---|---|---|
| `planned` | Scenario identified, not yet executed | Empty string |
| `validated` | Passed. If a bug was found and fixed, describe the bug and fix. | `""` for clean pass, or `"found stale cache; added cache-bust on logout"` for fix-and-pass |
| `failed` | Failed and could not be resolved | What failed and why it's unresolvable: `"second tab still shows authenticated state after logout"` |
| `blocked` | Could not execute due to environment or tooling | What prevented execution: `"dev env uses non-expiring tokens; no way to force expiry"` |
| `skipped` | Deliberately skipped | Why: `"no browser automation available"` or `"low priority given available time"` |

When not running within `/ship` (no `tmp/ship/` directory), skip this step — use only the PR body checklist (Step 4) or task list items.

### Step 4: Persist the QA checklist to the PR body

If a PR exists, write the QA checklist to the `## Test plan` section of the PR body. **Always update via `gh pr edit --body` — never post QA results as PR comments.**

**When `tmp/ship/qa-progress.json` exists:** Render the PR body checklist from the JSON file. The file is the source of truth; the PR body is a human-readable view. For each scenario in `scenarios[]`, render as:
```
- [ ] **<category>: <name>** — <verifies> · _Why not a test: <whyManual>_
```

**When no qa-progress.json exists (standalone QA without `/ship`):**

1. Read the current PR body: `gh pr view <number> --json body -q '.body'`
2. If a `## Test plan` section already exists, replace its content with the updated checklist.
3. If no such section exists, append it to the end of the body.
4. Write the updated body back: `gh pr edit <number> --body "<updated body>"`

Section format:

```md
## Test plan

_Manual QA scenarios that resist automation. Updated as tests complete._

- [ ] **<category>: <scenario name>** — <what you'll verify> · _Why not a test: <reason>_
```

If no PR exists, maintain the checklist as task list items only.

### Step 5: Execute — test like a human would

Work through each scenario. Use the strongest tool available for each.

**Testing priority: emulate real users first.** Prefer tools that replicate how a user actually interacts with the system. Browser automation over API calls. SDK/client library calls over raw HTTP. Real user journeys over isolated endpoint checks. Fall back to lower-fidelity tools (curl, direct database queries) for parts of the system that are not user-facing or when higher-fidelity tools are unavailable. For parts of the system touched by the changes but not visible to the customer — use server-side observability (logs, telemetry, database state) to verify correctness beneath the surface.

**Unblock yourself with ad-hoc scripts.** Do not wait for formal test infrastructure, published packages, or CI pipelines. If you need to verify something, write a quick script and run it. Put all throwaway artifacts — scripts, fixtures, test data, temporary configs — in a `tmp/` directory at the repo root (typically gitignored). These are disposable; they don't need to be production-quality. Specific patterns:
- **Quick verification scripts:** Write a script that imports a module, calls a function, and asserts the output. Run it. Delete it when done (or leave it in `tmp/`).
- **Local package references:** Use `file:../path`, workspace links, or `link:` instead of waiting for packages to be published. Test the code as it exists on disk.
- **Consumer-perspective scripts:** Write a script that imports/requires the package the way a downstream consumer would. Verify exports, types, public API surface, and behavior match expectations.
- **REPL exploration:** Use a REPL (node, python, etc.) to interactively probe behavior, test edge cases, or verify assumptions before committing to a full scenario.
- **Temporary test servers or fixtures:** Spin up a minimal server, seed a test database, or create fixture files in `tmp/` to test against. Tear them down when done.
- **Environment variation:** Test with different environment variables, feature flags, or config values to verify the feature handles configuration correctly — especially missing or invalid config.

**With browser automation:**
- Navigate to the feature. Click through it. Fill forms. Submit them.
- Walk the full user journey end-to-end — don't just verify individual pages.
- Audit visual layout — does it look right? Is anything misaligned, clipped, or missing?
- Test error states — submit invalid data, disconnect, trigger edge cases.
- Test at different viewport sizes if the feature is responsive.
- Test keyboard navigation and focus management.
- Record a GIF of multi-step flows when it helps demonstrate the result.

**With browser inspection (use alongside browser automation — not instead of):**
- **Console monitoring (non-negotiable — do this on every flow):** Start capture BEFORE navigating (`startConsoleCapture`), then check for errors after each major action (`getConsoleErrors`). A page that looks correct but throws JS errors is not correct. Filter logs for specific patterns (`getConsoleLogs` with string/RegExp/function filter) when diagnosing issues.
- **Network request verification:** Start capture BEFORE navigating (`startNetworkCapture` with URL filter like `'/api/'`). After the flow, check for failed requests (`getFailedRequests` — catches 4xx, 5xx, and connection failures). Verify: correct endpoints called, status codes expected, no silent failures. For specific API calls, use `waitForApiResponse` to assert status and inspect response body/JSON.
- **Browser state verification:** After mutations, verify state was persisted correctly. Check `getLocalStorage`, `getSessionStorage`, `getCookies` to confirm the UI action actually wrote expected data. Use `clearAllStorage` between test scenarios for clean-state testing.
- **In-page assertions:** Execute JavaScript in the page to verify DOM state, computed styles, data attributes, or application state that isn't visible on screen. Use `getElementBounds` for layout verification (visibility, viewport presence, computed styles). Use this when visual inspection alone can't confirm correctness (e.g., "is this element actually hidden via CSS, or just scrolled off-screen?").
- **Rendered text verification:** Extract page text to verify content rendering — especially dynamic content, interpolated values, and conditional text.

**With browser-based quality signals (when /browser primitives are available):**
- **Accessibility audit:** Run `runAccessibilityAudit` on each major page/view. Report WCAG violations by impact level (critical > serious > moderate). Test keyboard focus order with `checkFocusOrder` — verify tab navigation follows logical reading order, especially on new or changed UI.
- **Performance baseline:** After page load, capture `capturePerformanceMetrics` to check for obvious regressions — TTFB, FCP, LCP, CLS. You're not doing formal perf testing; you're catching "this page takes 8 seconds to load" or "layout shifts when the hero image loads."
- **Video recording:** For complex multi-step flows, record with `createVideoContext`. Attach recordings to QA results as evidence. Especially useful for flows that involve timing, animations, or state transitions that are hard to capture in a screenshot.
- **Responsive verification:** Run `captureResponsiveScreenshots` to sweep standard breakpoints (mobile/tablet/desktop/wide). Compare screenshots for layout breakage, clipping, or missing elements across viewports.
- **Degraded conditions:** Test with `simulateSlowNetwork` (e.g., 500ms latency) and `blockResources` (block images/fonts) to verify graceful degradation. Test `simulateOffline` if the feature has offline handling. These helpers compose with `page.route()` mocks via `route.fallback()`.
- **Dialog handling:** Use `handleDialogs` before navigating to auto-accept/dismiss alerts, confirms, and prompts — then inspect `captured.dialogs` to verify the right dialogs fired. Use `dismissOverlays` to auto-dismiss cookie banners and consent popups that block interaction during test flows.
- **Page structure discovery:** Use `getPageStructure` to get the accessibility tree with suggested selectors. Useful for verifying ARIA roles, element discoverability, and building selectors for unfamiliar pages. Pass `{ interactiveOnly: true }` to focus on actionable elements.
- **Tracing:** Use `startTracing`/`stopTracing` to capture a full Playwright trace (.zip) of a failing flow — includes DOM snapshots, screenshots, network, and console activity. View with `npx playwright show-trace`.
- **PDF & download verification:** Use `generatePdf` to verify PDF export features. Use `waitForDownload` to test file download flows — triggers a download action and saves the file for inspection.

**With macOS desktop automation:**
- Test OS-level interactions when relevant — file dialogs, clipboard, multi-app workflows.
- Take screenshots for visual verification.

**With shell / CLI (always available):**
- `curl` API endpoints. Verify status codes, response shapes, error responses.
- **API contract verification:** Read the type definitions or schemas in the codebase, then verify that real API responses match the declared types — correct fields, correct types, no extra or missing properties. This catches drift between types and runtime behavior.
- Test CLI commands with valid and invalid input.
- Verify file outputs, logs, process behavior.
- Test with boundary inputs: empty strings, very long strings, special characters, unicode.
- Test concurrent operations if relevant: can two requests race?

**Data integrity verification (after any mutation):**
- Before the mutation: record the relevant state (database row, file contents, API response).
- Perform the mutation via the UI or API.
- After the mutation: verify the state changed correctly — right values written, no unintended side effects on related data, timestamps/audit fields updated.
- This catches mutations that appear to succeed (200 OK, UI updates) but write wrong values, miss fields, or corrupt related state.

**Server-side observability (when available):**
Changes touch more of the system than what's visible to the user. After exercising user-facing flows, check server-side signals for problems that wouldn't surface in the browser or API response.
- **Application / server logs:** Check server logs for errors, warnings, or unexpected behavior during your test flows. Tail logs while running browser or API tests.
- **Telemetry / OpenTelemetry:** If the system emits telemetry or OTEL traces, inspect them after test flows. Verify: traces are emitted for the expected operations, spans have correct attributes, no error spans where success is expected.
- **Database state:** Query the database directly to verify mutations wrote correct values — especially when the API or UI reports success but the actual persistence could differ.
- **Background jobs / queues:** If the feature triggers async work (queues, cron, webhooks), verify the jobs were enqueued and completed correctly.

**General testing approach:**
1. Start from a clean state (no cached data, fresh session).
2. Walk the happy path first — end-to-end as the spec describes.
3. Then break it — try every failure mode you identified.
4. Then stress it — boundary conditions, unexpected inputs, concurrent access.
5. Then look at it — visual correctness, usability, "does this feel right?"

### Step 6: Record results

**When `tmp/ship/qa-progress.json` exists:** After each scenario (or batch), update the scenario's `status` and `notes` in the JSON file. Then re-render the PR body's `## Test plan` section from the updated file. The JSON file is the source of truth; the PR body is kept in sync as a human-readable view.

**When no qa-progress.json exists:** Update the `## Test plan` section in the PR body directly using the same read → modify → write mechanism from Step 4.

| Result | How to record |
|---|---|
| **Pass** | Check the box: `- [x]` |
| **Fail → fixed** | Check the box, append: `— Fixed: <what was wrong and how>` |
| **Fail → blocked** | Leave unchecked, append: `— BLOCKED: <what went wrong, why unresolvable>` |
| **Skipped (tool limitation)** | Leave unchecked, append: `— Skipped: <reason, e.g., no browser automation>` |

**When you find a bug:**

First, assess: do you see the root cause, or just the symptom?

- **Root cause is obvious** (wrong variable, missing class, off-by-one visible in the code) — fix it directly. Write a test if possible, verify, document.
- **Root cause is unclear** (unexpected behavior, cause not visible from the symptom) — load `/debug` for systematic root cause investigation before attempting a fix. QA resumes after the fix is verified.

After fixing a bug, record it: update the scenario's `status` to `validated` and put the bug description + fix in `notes` (e.g., `"found stale cache; added cache-bust on logout"`). If the bug was discovered **outside any planned scenario** — while navigating between tests or doing exploratory poking — add a new scenario to `scenarios[]` with the next sequential ID, describe what you found and fixed, and mark it `validated` with the fix in `notes`.

**Test suite gap discovery:** During execution, you may discover behaviors that should have formal test coverage but don't — an edge case with no unit test, a behavior path with no integration test, an untested but easily testable integration point. When this happens: write the test (following the repo's testing patterns and `/tdd` conventions), then record it in the scenario's `notes` alongside any bug fix notes (e.g., `"also wrote unit test for session invalidation — no existing coverage"`). This is the same posture as bug fixing — QA finds it, QA fixes it, QA records it in the scenario where it was discovered.

### Step 7: Report

**If a PR exists:** The `## Test plan` section in the PR body is your primary report. Ensure it's up-to-date with all results (pass/fail/fixed/blocked/skipped). Do not add a separate PR comment — the PR body section is the report.

**If no PR exists:** Report directly to the user with:

- Total scenarios tested vs. passed vs. failed vs. skipped
- Bugs found and fixed (with brief description of each)
- Gaps — what could NOT be tested due to tool limitations or environment constraints
- Judgment call — your honest assessment: is this feature ready for human review?

The skill's job is to fix what it can, document what it found, and hand back a clear picture. Unresolvable issues and gaps are documented, not silently swallowed — but they do not block forward progress. The invoker (user or /ship) decides what to do about remaining items.

---

## Calibrating depth to risk

Not every feature needs deep QA. Match effort to risk:

| What changed | Testing depth |
|---|---|
| New user-facing feature (UI, API, CLI) | Deep — full journey walkthrough, error states, visual audit, edge cases |
| Business logic, data mutations, auth/permissions | Deep — verify behavior matches spec, test failure modes thoroughly |
| Bug fix | Targeted — verify the fix, test the regression path, check for side effects |
| Glue code, config, pass-through | Light — verify it connects correctly. Don't over-test plumbing. |
| Performance-sensitive paths | Targeted — benchmark the specific path if tools allow |

**Over-testing looks like:** Manually verifying things already covered by passing unit tests. Clicking through UIs that haven't changed. Testing framework behavior instead of feature behavior.

**Under-testing looks like:** Declaring confidence from unit tests alone when the feature has user-facing surfaces. Skipping error-path testing. Not testing the interaction between new and existing code. Never opening the UI.

---

## Anti-patterns

- **Treating QA as a checkbox.** "I tested it" means nothing without specifics. Every scenario must have a concrete action and expected outcome.
- **Only testing the happy path.** Real users encounter errors, edge cases, and unexpected states. Test those.
- **Duplicating formal tests.** If the test suite already covers it, don't repeat it manually. Your time is for what the test suite *can't* do.
- **Skipping tools that are available.** If browser automation is available and the feature has a UI — use it. Don't substitute with curl when you can click through the real thing.
- **Silent gaps.** If you can't test something, say so explicitly. An undocumented gap is worse than a documented one.
