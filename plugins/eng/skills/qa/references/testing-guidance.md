Use when: Generating qa.json scenarios, injecting into QA iteration prompts, calibrating test depth
Priority: P0
Impact: Without this, scenarios lack structure, testing is shallow, tool capabilities underused

---

# Testing Guidance

This is the authoritative reference for *how to test*. It covers tool capabilities, scenario categories, execution patterns, bug handling, and depth calibration.

The orchestrator uses this to generate well-structured qa.json scenarios. The full content is injected into the iteration prompt so each subprocess has the complete testing methodology.

---

## Tool capabilities

| Capability | Use for | If unavailable |
|---|---|---|
| **Shell / CLI** (always available) | API calls (`curl`), CLI verification, data validation, database state checks, process behavior, file/log inspection | — |
| **Browser automation** | UI testing, form flows, visual verification, full user journey walkthrough, error state rendering, layout audit | Substitute with shell-based API/endpoint testing. Document: "UI not visually verified." |
| **Browser inspection** (network, console, JS execution, page text) | Monitoring network requests during UI flows, catching JS errors/warnings in the console, running programmatic assertions in the page, extracting and verifying rendered text | Substitute with shell-based API verification. Document the gap. |
| **macOS desktop automation** | End-to-end OS-level scenarios, multi-app workflows, screenshot-based visual verification | Skip OS-level testing. Document the gap. |

**Posture: exhaust your tools.** Do not stop at the first level of verification that seems sufficient. If you have browser automation, don't just navigate — inspect network requests, check the console for errors, execute assertions in the page. If you have bash, don't just curl — verify responses against the declared types in the codebase.

**Cross-skill integration:** When browser automation is available, `Load /browser skill` for structured testing primitives. The browser skill provides helpers for console monitoring, network capture, accessibility audits, video recording, performance metrics, browser state inspection, and network simulation.

---

## Scenario categories

When deriving test scenarios, apply the **formalization gate** to each candidate:

> **"Could this be a formal test?"** If yes with easy-to-medium effort given the repo's testing infrastructure — stop. Write that test instead (or flag it). Only proceed with scenarios that genuinely resist automation.

| Category | What to verify | Example |
|---|---|---|
| **visual** | Layout, spacing, alignment, rendering, responsiveness | "Does the new settings page render correctly at mobile viewport?" |
| **e2e-flow** | Multi-step journeys where the *experience* matters | "Can a user create a project, configure an agent, and run a conversation end-to-end?" |
| **usability** | Does the flow make sense? Labels clear? Error messages helpful? | "When auth fails, does the error message tell the user what to do next?" |
| **integration** | Behavior with real services/data, not mocks | "Does the webhook actually fire when the event triggers?" |
| **error-state** | What the user sees when things go wrong | "What happens when the API returns 500? Does the UI show a useful error or a blank page?" |
| **edge-case** | Boundary conditions that are impractical to formalize | "What happens with zero items? With 10,000 items? With special characters in the name?" |
| **failure-mode** | Recovery, degraded behavior, partial failures | "If the database connection drops mid-request, does the system recover gracefully?" |
| **api-contract** | API responses match declared types/schemas | "Does the CLI correctly talk to the API which correctly updates the UI?" |

Each scenario must have:
1. **What you will do** (the action)
2. **What "pass" looks like** (expected outcome — becomes `successCriteria`)
3. **Why it's not a formal test** (justification)

---

## Execution patterns

### Testing priority

**Emulate real users first.** Prefer tools that replicate how a user actually interacts with the system. Browser automation over API calls. SDK/client library calls over raw HTTP. Real user journeys over isolated endpoint checks. Fall back to lower-fidelity tools for parts that are not user-facing or when higher-fidelity tools are unavailable.

### General testing approach

1. Start from a clean state (no cached data, fresh session).
2. Walk the happy path first — end-to-end as the spec describes.
3. Then break it — try every failure mode you identified.
4. Then stress it — boundary conditions, unexpected inputs, concurrent access.
5. Then look at it — visual correctness, usability, "does this feel right?"

### Ad-hoc scripts

Do not wait for formal test infrastructure. If you need to verify something, write a quick script and run it. Put throwaway artifacts in `tmp/` (typically gitignored). Patterns:
- **Quick verification scripts:** Import a module, call a function, assert the output.
- **Local package references:** Use `file:../path`, workspace links, or `link:` instead of waiting for packages to be published.
- **Consumer-perspective scripts:** Import/require the package the way a downstream consumer would. Verify exports, types, public API surface.
- **REPL exploration:** Use a REPL to interactively probe behavior and test edge cases.
- **Temporary test servers or fixtures:** Spin up a minimal server, seed a test database, create fixture files in `tmp/`.
- **Environment variation:** Test with different environment variables, feature flags, or config values.

### Browser automation

- Navigate to the feature. Click through it. Fill forms. Submit them.
- Walk the full user journey end-to-end — don't just verify individual pages.
- Audit visual layout — does it look right? Is anything misaligned, clipped, or missing?
- Test error states — submit invalid data, disconnect, trigger edge cases.
- Test at different viewport sizes if the feature is responsive.
- Test keyboard navigation and focus management.
- Record a GIF of multi-step flows when it helps demonstrate the result.

### Browser inspection (use alongside browser automation — not instead of)

- **Console monitoring (non-negotiable — do this on every flow):** Start capture BEFORE navigating (`startConsoleCapture`), then check for errors after each major action (`getConsoleErrors`). A page that looks correct but throws JS errors is not correct.
- **Network request verification:** Start capture BEFORE navigating (`startNetworkCapture` with URL filter like `'/api/'`). After the flow, check for failed requests (`getFailedRequests`). Verify: correct endpoints called, status codes expected, no silent failures.
- **Browser state verification:** After mutations, verify state was persisted correctly. Check `getLocalStorage`, `getSessionStorage`, `getCookies`.
- **In-page assertions:** Execute JavaScript in the page to verify DOM state, computed styles, data attributes, or application state not visible on screen.
- **Rendered text verification:** Extract page text to verify content rendering — especially dynamic content, interpolated values, and conditional text.

### Browser-based quality signals (when /browser primitives are available)

- **Accessibility audit:** Run `runAccessibilityAudit` on each major page/view. Report WCAG violations by impact level.
- **Performance baseline:** Capture `capturePerformanceMetrics` to check for obvious regressions — TTFB, FCP, LCP, CLS.
- **Video recording:** For complex multi-step flows, record with `createVideoContext`.
- **Responsive verification:** Run `captureResponsiveScreenshots` to sweep standard breakpoints.
- **Degraded conditions:** Test with `simulateSlowNetwork` and `blockResources` to verify graceful degradation.
- **Dialog handling:** Use `handleDialogs` before navigating. Use `dismissOverlays` for cookie banners.
- **Page structure discovery:** Use `getPageStructure` for accessibility tree and selectors.
- **Tracing:** Use `startTracing`/`stopTracing` for a full Playwright trace of failing flows.
- **PDF & download verification:** Use `generatePdf` and `waitForDownload` for file-based features.

### macOS desktop automation

- Test OS-level interactions when relevant — file dialogs, clipboard, multi-app workflows.
- Take screenshots for visual verification.

### Shell / CLI (always available)

- `curl` API endpoints. Verify status codes, response shapes, error responses.
- **API contract verification:** Read type definitions/schemas in the codebase, then verify real API responses match declared types.
- Test CLI commands with valid and invalid input.
- Verify file outputs, logs, process behavior.
- Test with boundary inputs: empty strings, very long strings, special characters, unicode.
- Test concurrent operations if relevant: can two requests race?

### Data integrity verification (after any mutation)

- Before the mutation: record the relevant state.
- Perform the mutation via UI or API.
- After the mutation: verify the state changed correctly — right values written, no unintended side effects, timestamps/audit fields updated.

### Server-side observability (when available)

- **Application / server logs:** Check for errors, warnings, or unexpected behavior during test flows.
- **Telemetry / OpenTelemetry:** Inspect traces after flows. Verify spans and attributes.
- **Database state:** Query directly to verify mutations wrote correct values.
- **Background jobs / queues:** Verify async work was enqueued and completed correctly.

---

## Bug handling

When you find a bug, assess: do you see the root cause, or just the symptom?

- **Root cause is obvious** (wrong variable, missing class, off-by-one visible in the code) — fix it directly. Write a test if possible, verify, document.
- **Root cause is unclear** (unexpected behavior, cause not visible from the symptom) — load `/debug` for systematic root cause investigation before attempting a fix. QA resumes after the fix is verified.

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
