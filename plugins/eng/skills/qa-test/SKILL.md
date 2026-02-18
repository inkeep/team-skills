---
name: qa-test
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

**Get the system running.** Check `AGENTS.md`, `CLAUDE.md`, or similar repo configuration files for build, run, and setup instructions. If the software can be started locally, start it — you cannot test user-facing behavior against a system that isn't running. If the system depends on external services, databases, or environment variables, check what's available and what you can reach. Document anything you cannot start.

### Step 2: Gather context — what are you testing?

Determine what to test from whatever input is available. Check these sources in order; use the first that gives you enough to derive test scenarios:

| Input | How to use it |
|---|---|
| **SPEC.md path provided** | Read it. Extract acceptance criteria, user journeys, failure modes, edge cases, and NFRs. This is your primary source. |
| **PR number provided** | Run `gh pr diff <number>` and `gh pr view <number>`. Derive what changed and what user-facing behavior is affected. |
| **Feature description provided** | Use it as-is. Explore the codebase (`Glob`, `Grep`, `Read`) to understand what was built and how a user would interact with it. |
| **"Test what changed"** (or no input) | Run `git diff main...HEAD --stat` to see what files changed. Read the changed files. Infer the feature surface area and user-facing impact. |

**Output of this step:** A mental model of what was built, who uses it, and how they interact with it.

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

### Step 4: Persist the QA checklist

If a PR exists, append a `## QA Checklist` section to the PR body:

```md
## QA Checklist

_Manual QA scenarios that resist automation. Updated during testing._

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
- **Console monitoring:** Check the browser console for errors and warnings during every UI interaction. A page that looks correct but throws JS errors is not correct. Filter for errors/exceptions after each major action.
- **Network request verification:** Monitor network requests during UI flows. Verify: correct endpoints are called, response status codes are expected (no silent 4xx/5xx), request/response payloads match what the feature requires. Flag unexpected requests or missing requests.
- **In-page assertions:** Execute JavaScript in the page to verify DOM state, computed styles, data attributes, or application state that isn't visible on screen. Use this when visual inspection alone can't confirm correctness (e.g., "is this element actually hidden via CSS, or just scrolled off-screen?").
- **Rendered text verification:** Extract page text to verify content rendering — especially dynamic content, interpolated values, and conditional text.

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

After each scenario, update the checklist:

| Result | How to record |
|---|---|
| **Pass** | Check the box: `- [x]` |
| **Fail → fixed** | Check the box, append: `— Fixed: <what was wrong and how>` |
| **Fail → blocked** | Leave unchecked, append: `— BLOCKED: <what went wrong, why unresolvable>` |
| **Skipped (tool limitation)** | Leave unchecked, append: `— Skipped: <reason, e.g., no browser automation>` |

**When you find a bug:**
1. Can it be reproduced with a formal test? If yes — write the test first, then fix the bug, then verify both the test and manual scenario pass.
2. If it can't be a test — fix it, verify manually, document what was found and fixed in the checklist.

### Step 7: Report

**If a PR exists:** The QA checklist in the PR body is your primary report. Ensure it's up-to-date with all results (pass/fail/fixed/blocked/skipped). Add a brief summary comment on the PR with the overall assessment.

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
