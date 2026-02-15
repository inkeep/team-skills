Use when: Planning and executing tests across all tiers (Phase 4)
Priority: P0
Impact: Gaps in coverage, untested edge cases, false confidence in implementation quality

---

# Testing Strategy

## Discover repo conventions first

Before writing or running tests, discover the repo's testing conventions. Sources include:
- Project configuration files (AGENTS.md, CLAUDE.md, .cursor/rules, or equivalent)
- Contributor guides (CONTRIBUTING.md, README)
- Existing test files and their patterns (imports, setup, structure, naming)
- CI/CD configuration (what tests run, what checks are enforced)
- Repo-level AI skills or rules related to testing

Identify: the test framework, test runner commands, directory conventions, naming patterns, setup/teardown patterns, and any repo-specific testing utilities or helpers. Follow what exists — do not introduce new conventions unless the repo has none.

---

## Three tiers

### Tier 1: Formal test suite (mandatory — always run)

Automated tests that live in the codebase and run in CI.

Run the repo's full verification suite — test runner, type checker, linter, and formatter — using the commands defined in the repo's project configuration.

**What to test (minimum for new code):**
- Happy path for each new function/endpoint/component
- Error cases: invalid input, missing data, permission denied
- Edge cases identified in the SPEC.md
- Integration points: API calls, database operations, cross-service communication

**When TDD is practical** (identified in Phase 1A), apply test-driven methodology: write one failing test, implement the minimum code to pass, repeat. Vertical slicing — one test at a time, not all tests first.

**When TDD is NOT practical:**
- Exploratory work where the API shape is still forming
- UI components where visual testing matters more
- Integration tests that require full system setup

In these cases, write tests after implementation but before declaring Phase 3 complete.

### Tier 2: You are the QA engineer (mandatory for user-facing changes)

You own this feature. Tier 2 is where you verify the *experience* — things the formal test suite cannot capture. A feature can pass every unit test and still have a broken layout, a confusing flow, or an interaction that doesn't work as a user would expect.

Think of this the way a good human engineer tests before shipping: they open the UI, click through the feature, try to break it, check that the visual output looks right, walk the full user journey, and stress-test the scenarios the test harness can't reach. You have tools that let you do exactly this — use them.

#### Step 1: Derive the test plan

Before executing any manual tests, identify candidate scenarios from the SPEC.md: user journeys, failure modes, edge cases, and acceptance criteria. For each candidate, apply the formalization gate:

> **"Could this be a formal test?"** If yes with easy-to-medium effort given the repo's current testing infrastructure, write the test (Tier 1) instead. Only include a scenario in the QA checklist if it genuinely resists automation.

Scenarios that belong in the QA checklist (not formal tests):
- **Visual correctness** — layout, spacing, rendering that requires visual judgment
- **End-to-end UX flows** — multi-step journeys where the *experience* matters, not just the logic
- **Subjective usability** — "does this flow make sense?", label clarity, error message helpfulness
- **Integration reality** — behavior that only manifests with real services/data, not mocks
- **Cross-system interactions** — OS-level, multi-app, or browser-specific scenarios the test harness cannot reach

Scenarios that do NOT belong (formalize as Tier 1 instead):
- API behavior testable with integration tests
- Error handling testable with unit tests
- Data validation testable with property-based or parameterized tests
- Any scenario where "it would take effort but it's feasible" — write the test

Write each remaining scenario as a discrete test case with: what you will do, what "pass" looks like, and why it cannot be a formal test. Create these as task list items to track execution progress.

#### Step 2: Persist to PR

If a PR exists, append a `## QA Checklist` section to the PR body with each scenario as a checkbox:

```md
## QA Checklist

_Derived from SPEC.md. Updated during Phase 4 Tier 2 testing.
Each item includes why it is not a formal test._

- [ ] **Happy path: <journey name>** — <what you'll verify> · _Why not a test: <reason>_
- [ ] **Failure mode: <scenario>** — <expected error behavior> · _Why not a test: <reason>_
- [ ] **Edge case: <scenario>** — <boundary condition to check> · _Why not a test: <reason>_
- [ ] **Visual: <element/page>** — <layout/rendering check> · _Why not a test: <reason>_
```

This checklist serves three purposes:
1. **Visibility** — reviewers see exactly what was manually verified
2. **Persistence** — survives context loss; a resumed session picks up where the previous one left off
3. **Accountability** — failures and gaps are documented, not silently skipped

If no PR exists, maintain the checklist as task list items only.

#### Step 3: Execute with stateful updates

Work through each scenario using the tools and approach described below. After verifying each one, update the PR checklist:
- **Pass:** Check the box (`- [x]`)
- **Fail → fixed:** Check the box and append: `— Fixed: <what was wrong and how it was fixed>`
- **Fail → blocked:** Leave unchecked and append: `— BLOCKED: <what went wrong and why it couldn't be resolved>`
- **Skipped (tool limitation):** Leave unchecked and append: `— Skipped: <why, e.g., no browser automation available>`

**What Tier 2 covers that Tier 1 cannot:**
- **Visual correctness** — layout, spacing, alignment, responsiveness, error state rendering
- **End-to-end user journeys** — multi-step flows where each step depends on the previous one, tested as a user would experience them (not as isolated unit tests)
- **Usability** — does the flow make sense? Are labels clear? Do error messages help the user recover?
- **Integration reality** — does the feature work when connected to real services, real data, real UI, not just mocks?
- **"Does this feel right?"** — the subjective-but-critical judgment a good engineer applies before shipping

**When to use each tool:**

| Tool | Use for | Example | If unavailable |
|---|---|---|---|
| Bash | API testing, CLI verification, data validation | `curl` to test endpoints, run CLI commands, check database state | Always available |
| Chrome automation (`mcp__claude-in-chrome__*`) | UI testing, form submission, visual verification, full user journey walkthrough | Navigate to UI, fill forms, verify rendering, click through multi-step flows, audit layout | Substitute with Bash-based API/endpoint testing; document untested UI scenarios |
| macOS computer use (`mcp__peekaboo__*`) | End-to-end OS-level scenarios, multi-app workflows | Test desktop interactions, screenshot verification | Skip OS-level testing; document the gap |

Not all tools are available in every environment (e.g., Docker/headless contexts lack browser and OS automation). Use what is available, maximize Bash-based testing as a fallback, and explicitly document any scenarios that could not be verified due to tool limitations.

**Manual testing checklist:**
1. Start from a clean state (fresh database, no cached state)
2. Walk through the happy path as described in the SPEC.md user journeys — end-to-end, not just individual steps
3. Test each failure mode identified in the spec
4. Test with unexpected input (empty strings, very long strings, special characters)
5. Test with boundary conditions (first item, last item, zero items, many items)
6. If the feature has a UI: audit layout and visual correctness, test on different viewport sizes, test keyboard navigation
7. Try to break it — attempt scenarios the spec didn't anticipate

**Recording results:**
The PR QA checklist (Step 2) is your primary recording mechanism. Update it as you execute each scenario. If you find a bug during manual testing:
1. Write a formal test that reproduces it (Tier 1) if possible
2. Fix the bug
3. Verify both the formal test and manual test pass
4. Update the PR checklist with what was found and fixed

### Tier 3: Edge cases and failure modes (judgment-based)

These are scenarios from the SPEC.md that are genuinely difficult to automate.

**Examples of legitimate Tier 3 scenarios:**
- Race conditions under concurrent load
- Behavior under network instability
- Recovery after process crash mid-operation
- Visual rendering in specific browser/OS combinations
- Performance under sustained load

**The judgment test:** Before classifying something as Tier 3, ask: "Could I write a test for this?" If the answer involves "it would be flaky" or "it requires infrastructure we don't have," Tier 3 is appropriate. If the answer is "it would take effort but it's feasible," write the test (Tier 1).

## Test quality bar

Before proceeding from Phase 4 to Phase 5, verify:

- [ ] Every acceptance criterion from SPEC.md Phase 1 has at least one corresponding test
- [ ] Error paths are tested (not just happy paths)
- [ ] Tests are deterministic (no flaky tests — if a test is flaky, fix it or remove it)
- [ ] Tests run in isolation (no shared state between tests, proper setup/teardown cleanup)
- [ ] Test names describe the behavior being verified, not the implementation
- [ ] Manual testing covered all user-facing paths
- [ ] QA checklist in PR body is fully resolved (all items checked, failed, or explicitly skipped with reasons)

## Common testing mistakes

- Writing tests that test the framework, not the feature (e.g., testing that the mocking library works)
- Tests that pass when the feature is broken (testing implementation details instead of behavior)
- Skipping error path tests because "it's obvious it works"
- Not testing with realistic data (using `"test"` instead of realistic input)
- Forgetting to test the interaction between new code and existing code
