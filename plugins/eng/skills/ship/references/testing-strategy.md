Use when: Planning and executing tests across all tiers (Phase 4)
Priority: P0
Impact: Gaps in coverage, untested edge cases, false confidence in implementation quality

---

# Testing Strategy

## Three tiers

### Tier 1: Formal test suite (mandatory — always run)

These are automated tests that live in the codebase and run in CI.

**Framework:** Vitest
**Location:** `__tests__/` directories adjacent to the code being tested
**Naming:** `*.test.ts` or `*.spec.ts`
**Timeout:** 60 seconds for A2A interaction tests

```bash
# Run all tests
pnpm test --run

# Run tests for a specific package
cd <package> && pnpm test --run

# Run a specific test file
cd <package> && pnpm test --run <file-path>

# Additional checks
pnpm typecheck
pnpm lint
pnpm format:check
```

**What to test (minimum for new code):**
- Happy path for each new function/endpoint/component
- Error cases: invalid input, missing data, permission denied
- Edge cases identified in the SPEC.md
- Integration points: API calls, database operations, A2A communication

**TDD approach (when practical):**
1. Write a failing test that captures the desired behavior
2. Implement the minimum code to make it pass
3. Refactor while keeping tests green
4. Repeat for the next behavior

**When TDD is NOT practical:**
- Exploratory work where the API shape is still forming
- UI components where visual testing matters more
- Integration tests that require full system setup

In these cases, write tests after implementation but before declaring Phase 3 complete.

### Tier 2: You are the QA engineer (mandatory for user-facing changes)

You own this feature. Tier 2 is where you verify the *experience* — things the formal test suite cannot capture. A feature can pass every unit test and still have a broken layout, a confusing flow, or an interaction that doesn't work as a user would expect.

Think of this the way a good human engineer tests before shipping: they open the UI, click through the feature, try to break it, check that the visual output looks right, walk the full user journey, and stress-test the scenarios the test harness can't reach. You have tools that let you do exactly this — use them.

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
7. Try to break it — attempt scenarios the spec didn't anticipate, abuse edge cases, stress-test the flow

**Recording results:**
Document what you tested and the outcome. If you find a bug during manual testing:
1. Write a formal test that reproduces it (Tier 1) if possible
2. Fix the bug
3. Verify both the formal test and manual test pass

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
- [ ] Tests run in isolation (no shared state between tests, proper `beforeEach` cleanup)
- [ ] Test names describe the behavior being verified, not the implementation
- [ ] Manual testing covered all user-facing paths

## Common testing mistakes

- Writing tests that test the framework, not the feature (e.g., testing that Vitest mocking works)
- Tests that pass when the feature is broken (testing implementation details instead of behavior)
- Skipping error path tests because "it's obvious it works"
- Not testing with realistic data (using `"test"` instead of realistic input)
- Forgetting to test the interaction between new code and existing code
