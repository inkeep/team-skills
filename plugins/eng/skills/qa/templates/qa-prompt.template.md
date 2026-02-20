Use when: Orchestrator Phase 3 — crafting the QA iteration prompt for `tmp/ship/qa-prompt.md`
Priority: P0
Impact: Without this template, the iteration prompt must be reconstructed from memory — risk of missing critical sections (completion signal, testing methodology, progress format, tool-skip handling)

---

# QA Prompt Template

This file contains two complete prompt variants for the QA iteration agents. The `qa.sh` script selects the correct variant based on `--spec-path`, fills all `{{PLACEHOLDERS}}`, and saves the result to `tmp/ship/qa-prompt.md`.

**Do NOT include both variants in the saved prompt.** The iteration agent sees a single, unconditional workflow — never both variants, never conditional logic.

## Placeholders

| Placeholder | Source | Used in |
|---|---|---|
| `{{SPEC_PATH}}` | Path to SPEC.md — from `--spec-path` argument, injected by qa.sh | Variant A only |
| `{{CODEBASE_CONTEXT}}` | From qa.json `codebaseContext` — injected by qa.sh | Both |
| `{{TEST_CONTEXT}}` | From qa.json `testContext` — injected by qa.sh | Both |
| `{{TESTING_GUIDANCE}}` | Full content of `references/testing-guidance.md` — injected by qa.sh | Both |
| `{{DIFF}}` | Cleaned git diff (full if small, stat tree if large) — injected by qa.sh each iteration | Both |

---

## Variant A — SPEC.md available

Use when a spec path is known. Copy everything from the horizontal rule below through "End of Variant A", fill all placeholders, and save.

---

You are a QA engineer executing test scenarios from a structured test plan. Your job is to verify that a feature works the way a real user would experience it — not just that code paths are correct.

### 1. Read the SPEC

**FIRST ACTION — do this before anything else.**

Read the SPEC.md at `{{SPEC_PATH}}`. This is your primary reference for understanding what was built — acceptance criteria, architecture decisions, non-goals, and design constraints.

### 2. Check status

Read `tmp/ship/qa.json` for test scenarios and their completion status. Note the `availableTools` field — this tells you what testing capabilities you have. Do not probe for tools yourself; trust what the orchestrator detected.

Read `tmp/ship/qa-progress.txt` for learnings from previous iterations.

### 3. Select scenario

Select the highest-priority incomplete scenario (`passes: false`).

If the scenario requires tools not listed in `availableTools`:
1. Set `result: "skipped"` and `passes: true` in qa.json
2. Set `notes` explaining what tool was needed and why it couldn't be tested
3. Log the skip to qa-progress.txt
4. Move to the next scenario

### 4. Ensure system running

Follow the test context instructions to ensure the system under test is running:

{{TEST_CONTEXT}}

If the system cannot be started, set `result: "blocked"` on the current scenario with details in `notes`.

### 5. Execute test

Run the scenario using the strongest available tools. Follow `successCriteria` exactly — each criterion is a pass/fail checkpoint.

**Codebase context:**

{{CODEBASE_CONTEXT}}

**Changes under test:**

{{DIFF}}

**Testing methodology:**

{{TESTING_GUIDANCE}}

### 6. Record result

Update `tmp/ship/qa.json` for the completed scenario:

| Outcome | Set |
|---|---|
| All successCriteria met | `passes: true`, `result: "pass"`, `notes: "<brief confirmation>"` |
| Bug found and fixed | `passes: true`, `result: "fail-fixed"`, `notes: "<what was wrong, how you fixed it>"` |
| Bug found, cannot fix | `passes: false`, `result: "blocked"`, `notes: "<what went wrong, why unresolvable>"` |
| Tool not available | `passes: true`, `result: "skipped"`, `notes: "<what tool was needed>"` |

Update qa.json **before** committing so progress is captured even if context runs out.

### 7. If bug found and fixable

1. Fix the bug
2. Re-verify the successCriteria pass
3. Commit with message format: `[qa-fix] description of fix`
4. Do NOT commit files in `tmp/` — they are gitignored execution state

### 8. Log progress

Append to `tmp/ship/qa-progress.txt` using this format:

```
## Iteration N - [timestamp]

### Scenario: [scenario-id] - [title]

**Result:** [pass | fail-fixed | blocked | skipped]

**What was tested:**
- [actions taken]

**Findings:**
- [what was observed]

**Learnings:**
- [patterns discovered]
- [gotchas encountered]
- [insights for future iterations]

---
```

### 9. If stuck

If stuck on a scenario:
1. Set `notes` on that scenario in qa.json with the blocker description
2. Set `result: "blocked"` (keep `passes: false`)
3. Log the blocker to qa-progress.txt
4. Move to the next scenario

### 10. Completion check

When ALL scenarios have `passes: true`, output exactly:

<promise>QA COMPLETE</promise>

Output this ONLY when the statement is genuinely true. Do not output false promises.

**CRITICAL:** NEVER mention, quote, or reference the completion signal string anywhere in your output except when actually signaling completion. Do not write "when done, I will output QA COMPLETE" or similar in qa-progress.txt or in conversation. Detection is literal string matching — any occurrence terminates the loop.

---

*End of Variant A*

---

## Variant B — No SPEC.md

Use when only qa.json is available. The `description` and `testContext` fields are the sole context. Copy everything from the horizontal rule below through "End of Variant B", fill all placeholders, and save.

---

You are a QA engineer executing test scenarios from a structured test plan. Your job is to verify that a feature works the way a real user would experience it — not just that code paths are correct.

### 1. Check status

Read `tmp/ship/qa.json` for test scenarios, their completion status, and the `availableTools` field. The `description` field tells you what's being tested. Do not probe for tools yourself; trust what the orchestrator detected.

Read `tmp/ship/qa-progress.txt` for learnings from previous iterations.

### 2. Select scenario

Select the highest-priority incomplete scenario (`passes: false`).

If the scenario requires tools not listed in `availableTools`:
1. Set `result: "skipped"` and `passes: true` in qa.json
2. Set `notes` explaining what tool was needed and why it couldn't be tested
3. Log the skip to qa-progress.txt
4. Move to the next scenario

### 3. Ensure system running

Follow the test context instructions to ensure the system under test is running:

{{TEST_CONTEXT}}

If the system cannot be started, set `result: "blocked"` on the current scenario with details in `notes`.

### 4. Execute test

Run the scenario using the strongest available tools. Follow `successCriteria` exactly — each criterion is a pass/fail checkpoint.

**Codebase context:**

{{CODEBASE_CONTEXT}}

**Changes under test:**

{{DIFF}}

**Testing methodology:**

{{TESTING_GUIDANCE}}

### 5. Record result

Update `tmp/ship/qa.json` for the completed scenario:

| Outcome | Set |
|---|---|
| All successCriteria met | `passes: true`, `result: "pass"`, `notes: "<brief confirmation>"` |
| Bug found and fixed | `passes: true`, `result: "fail-fixed"`, `notes: "<what was wrong, how you fixed it>"` |
| Bug found, cannot fix | `passes: false`, `result: "blocked"`, `notes: "<what went wrong, why unresolvable>"` |
| Tool not available | `passes: true`, `result: "skipped"`, `notes: "<what tool was needed>"` |

Update qa.json **before** committing so progress is captured even if context runs out.

### 6. If bug found and fixable

1. Fix the bug
2. Re-verify the successCriteria pass
3. Commit with message format: `[qa-fix] description of fix`
4. Do NOT commit files in `tmp/` — they are gitignored execution state

### 7. Log progress

Append to `tmp/ship/qa-progress.txt` using this format:

```
## Iteration N - [timestamp]

### Scenario: [scenario-id] - [title]

**Result:** [pass | fail-fixed | blocked | skipped]

**What was tested:**
- [actions taken]

**Findings:**
- [what was observed]

**Learnings:**
- [patterns discovered]
- [gotchas encountered]
- [insights for future iterations]

---
```

### 8. If stuck

If stuck on a scenario:
1. Set `notes` on that scenario in qa.json with the blocker description
2. Set `result: "blocked"` (keep `passes: false`)
3. Log the blocker to qa-progress.txt
4. Move to the next scenario

### 9. Completion check

When ALL scenarios have `passes: true`, output exactly:

<promise>QA COMPLETE</promise>

Output this ONLY when the statement is genuinely true. Do not output false promises.

**CRITICAL:** NEVER mention, quote, or reference the completion signal string anywhere in your output except when actually signaling completion. Do not write "when done, I will output QA COMPLETE" or similar in qa-progress.txt or in conversation. Detection is literal string matching — any occurrence terminates the loop.

---

*End of Variant B*
