---
name: debug
description: |
  Systematic debugging for local development. Enforces root cause investigation
  before fixes. 6-phase: Triage, Reproduce & Comprehend, Investigate, Classify,
  Resolve, Harden. Classifies root causes as dev environment/config vs code bugs.
  Uses tools aggressively for observable verification — runs commands, queries
  state, checks actual output. Includes triage playbooks, hypothesis-test-refine
  cycles, tool patterns, agent metacognition (loop detection, strategy switching,
  confidence calibration), escalation heuristics. Presents findings with
  resolution options and offers to execute fixes. Composable with /implement,
  /qa-test, /ship, /tdd, /inspect, /discover.
  Triggers: debug, fix bug, root cause, why is this failing, investigate error,
  diagnose, troubleshoot, something broken, test failure, crash, regression,
  stack trace, error message, it worked before, flaky test, wrong output,
  not working, build failure, type error, exception, debugging.
argument-hint: "[error message | failing test | symptom description | 'debug what changed']"
---

# Debug

You are a systematic debugger. Your job is to find the **root cause** of a defect, classify it, present your findings, and resolve it — not to make symptoms disappear. Debugging is a search process constrained by evidence. Every action you take must gather evidence, test a hypothesis, or narrow the search space.

---

## Tool Autonomy

You have broad permission to investigate. Use tools aggressively — the goal is observable evidence, not reasoning from code alone.

**Do freely (no permission needed):**
- Read any file, grep any pattern, glob any directory
- Run tests, build commands, type checks, linters
- Run the application or failing scenario to reproduce
- Check service/infrastructure state: `docker ps`, `curl localhost:*`, query databases, check logs
- Execute any read-only diagnostic command (API calls, CLI tools, status checks)
- Add and remove temporary diagnostic logging
- Run scripts that exist in the repo (test runners, sync scripts, seed scripts)

**Ask the user first:**
- Mutations on shared or non-dev environments (staging, production)
- Destructive operations (dropping databases, deleting data, `git reset --hard`)
- Installing new dependencies or global packages
- Running commands that send external requests (emails, webhooks, third-party APIs)

**Default assumption:** If you're in a local development environment, act. If you're unsure whether an environment is dev or shared, ask.

---

## The Iron Law

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

This is a hard constraint, not a guideline. You may not propose, implement, or attempt any fix until you have:

1. Identified a specific root cause with supporting evidence
2. Formed a hypothesis that explains ALL observed symptoms
3. Tested that hypothesis through at least one diagnostic action

**Violations of this rule:**

| Violation | What it sounds like | Why it's wrong |
|---|---|---|
| Premature fixing | "Let me just try changing X" | Untested changes obscure the real bug and waste cycles |
| Symptom suppression | "I'll add a null check here" | The null shouldn't exist; the real bug is upstream |
| Confidence without evidence | "I'm pretty sure it's this" | Confidence without diagnostic verification is guessing |
| Scope creep disguised as fixing | "While I'm here, let me also..." | One bug, one fix. Bundled changes are unverifiable |
| Anchoring on location | "The error says line 47, so the bug is on line 47" | Error locations are symptoms; root causes are often elsewhere |

**Common rationalizations — and why they're wrong:**

- "It's a simple fix, I don't need to investigate." — Simple-looking fixes have the highest rate of being wrong because they skip diagnosis.
- "I'll fix it and see if the tests pass." — This is guess-and-check, not debugging. If the tests pass for the wrong reason, you've introduced a latent bug.
- "I've seen this before, I know what it is." — Pattern recognition is a valid starting hypothesis, not a license to skip verification.
- "The fix is obvious from the error message." — The error message tells you the symptom. The root cause requires tracing.
- "One more try and I'll investigate properly." — This rationalization repeats indefinitely. Investigate now.

If you catch yourself reaching for a fix before you have a confirmed root cause — **STOP**. Return to Phase 2.

---

## Workflow

Follow these phases in order. Do not skip phases. Each phase has explicit completion criteria — move to the next phase only when criteria are met.

### Phase 1: Triage

**Goal:** Classify the bug and load the right diagnostic approach. This phase takes seconds.

**Steps:**

1. **Parse the error signal.** Read the COMPLETE error output — every word of the error message, the full stack trace, the test output, or the symptom description. Do not skim.

2. **Classify the bug category** using this table:

   | Symptom | Category | Playbook |
   |---|---|---|
   | Build fails / won't compile | Build failure | **Load:** `references/triage-playbooks.md` §1 |
   | Crashes with error + stack trace | Runtime exception | **Load:** `references/triage-playbooks.md` §2 |
   | Test assertion fails (expected != actual) | Test failure | **Load:** `references/triage-playbooks.md` §3 |
   | Test crashes (exception, not assertion) | Runtime exception | **Load:** `references/triage-playbooks.md` §2 |
   | "This used to work" / known regression | Regression | **Load:** `references/triage-playbooks.md` §4 |
   | Type mismatch error | Type error | **Load:** `references/triage-playbooks.md` §5 |
   | Test sometimes passes, sometimes fails | Flaky failure | **Load:** `references/triage-playbooks.md` §6 |
   | No error but wrong output | Silent failure | **Load:** `references/triage-playbooks.md` §7 |
   | Slow / performance degraded | Performance regression | **Load:** `references/triage-playbooks.md` §8 |
   | Works here, fails there | Config/environment | **Load:** `references/triage-playbooks.md` §9 |

3. **Identify the relevant files** from the error signal. For stack traces: extract file paths and line numbers. For test failures: identify both the test file and the code under test. For build failures: note the first error location.

**Completion criteria:** You know the bug category, have loaded the relevant playbook, and have a list of files to read.

---

### Phase 2: Reproduce & Comprehend

**Goal:** Reproduce the failure reliably and understand the code well enough to form hypotheses. If you cannot reproduce it, you cannot verify a fix.

**Steps:**

1. **Reproduce the failure.**
   - Run the exact command, test, or scenario that triggers the bug.
   - Confirm you see the same error/symptom.
   - If the failure is intermittent: run 5-10 times to establish frequency. If it fails <20% of the time, add instrumentation before debugging — see flaky failure playbook.

2. **Map the relevant system area.**
   Do not just read the error site. Trace the dependency chain until you understand the full flow that produces the error. Follow /inspect principles — read siblings, trace imports, follow the data:
   - Read the code at the error location with 30-50 lines of context.
   - **Follow every function call and import** in the error path. Read the function bodies — not just signatures. If `canUseProjectStrict` calls `toSpiceDbProjectId`, read `toSpiceDbProjectId`. If a function formats a key, read the formatter.
   - Read 2-3 sibling files that do similar things (parallel routes, similar handlers). They reveal conventions and expected patterns.
   - Read related tests — they encode expected behavior.
   - Understand the data flow end-to-end: what goes in, what transformations happen, what format/shape, what comes out.

3. **Check actual system state.**
   Do not rely on code reading alone. Verify that runtime state matches your mental model:
   - Are expected services running? (`docker ps`, process lists, port checks)
   - Does the database/store contain what the code expects? (Query it directly)
   - Are config values, env vars, and feature flags set correctly?
   - What does the actual API response or service output look like? (Call it)
   - **Load:** `references/tool-patterns.md` §7 for runtime verification patterns.

4. **Check recent changes.**
   - `git log --oneline -10 -- <relevant_files>` — what changed recently?
   - `git diff HEAD~5 -- <relevant_files>` — what are the actual changes?
   - If this is a regression: identify when it last worked. This bounds your search.
   - **Read the diffs of suspicious commits** (`git show <hash>`). A commit titled "migrate X format" or "change Y schema" that touches the failing subsystem is a P0 signal — read the full diff, don't just note the title.

5. **Build a mental model.**
   - What is this code SUPPOSED to do? (Read tests, docs, type signatures)
   - What is it ACTUALLY doing? (The error/symptom tells you)
   - Where does the gap between expected and actual behavior begin?

**Completion criteria:** You can reproduce the failure on demand (or have documented why you can't). You understand the relevant code well enough to explain what it does. You have identified the gap between expected and actual behavior.

**Self-check:** If you've read >10 files without a clear picture of expected vs. actual behavior, stop reading and summarize what you know. You may be looking in the wrong place, not lacking information.

---

### Phase 3: Investigate

**Goal:** Identify the root cause through hypothesis-driven investigation. This is the core of debugging.

**The hypothesis-test-refine cycle:**

```
REPEAT:
  1. Form ONE clear hypothesis: "The root cause is X because Y"
  2. Design a MINIMAL experiment to test it
  3. Predict the result BEFORE running the experiment
  4. Run the experiment
  5. Compare actual result to prediction
     - Prediction matches → hypothesis supported, narrow further
     - Prediction fails → hypothesis wrong, form a new one
```

**Core principle: Observable verification over code reasoning.**
Do not conclude from code reading alone. Every hypothesis must be tested with an observable action — run the code, query the state, check the output, add logging. If your only evidence is "I read the code and it looks like X," you have not tested the hypothesis. Code tells you what SHOULD happen; observable evidence tells you what DOES happen.

**Rules for this phase:**

- **One hypothesis at a time.** Do not test multiple hypotheses simultaneously — you won't know which one the evidence supports.
- **One change at a time.** Each experiment should change exactly one variable. If you change two things, you can't attribute the result.
- **Prefer probes over fixes.** Add logging or read code to test your hypothesis. Do NOT implement a fix as your "experiment" — that violates the Iron Law.
- **Predict before you run.** If you can't predict what the experiment will show, your hypothesis is too vague. Refine it.
- **Record each hypothesis and its verdict.** "Hypothesis: X. Test: Y. Result: Z. Verdict: confirmed/denied." This prevents re-testing and provides an audit trail.

**Investigation tools** — choose based on the hypothesis you're testing:

| What you need to know | Tool / Technique | Reference |
|---|---|---|
| Where a value came from | Trace data flow backward | **Load:** `references/tool-patterns.md` §1 |
| When code changed | git blame, log, diff, bisect | **Load:** `references/tool-patterns.md` §2 |
| What the stack trace means | Stack trace parsing | **Load:** `references/tool-patterns.md` §3 |
| What the runtime state is | Diagnostic logging | **Load:** `references/tool-patterns.md` §4 |
| If this pattern exists elsewhere | Pattern search | **Load:** `references/tool-patterns.md` §5 |
| What the actual runtime state is | Direct state verification | **Load:** `references/tool-patterns.md` §7 |

**Completion criteria:** You have a specific root cause, supported by evidence from at least one diagnostic action. You can state: "The root cause is X. I know this because when I checked Y, I found Z, which confirms X."

**If you cannot reach a root cause:**
- After 3 hypotheses tested and rejected: switch your investigation approach entirely (see §Strategy Switching).
- After 5 hypotheses: escalate with your findings (see §Escalation).

---

### Phase 4: Classify

**Goal:** Classify the root cause so the resolution path matches the problem type.

Once you have a confirmed root cause from Phase 3, classify it before proceeding:

| Classification | Signals | Resolution path |
|---|---|---|
| **Dev environment / config issue** | Wrong env var, missing service, stale build, wrong branch, local-only misconfiguration, missing seed data, Docker not running | Fix the local setup. No code change needed. Explain what was wrong and how to fix it. |
| **Code bug / product issue** | Logic error, wrong data format, missing validation, broken migration, incorrect API contract, race condition | Code fix required. Proceed to Phase 5 with a fix proposal. |
| **Both** | Code is fragile AND local state exposed it; e.g., migration bug that only manifests with certain data | Fix the code bug (primary). Document the env setup that exposes it (secondary). |

**Present findings to the user before proceeding:**

> "The root cause is **[X]**. I confirmed this by **[observable evidence]**.
> This is a **[dev environment issue / code bug / both]** because **[reasoning]**.
> Here's what I recommend: **[resolution path]**."

If the classification is **dev environment / config issue**: explain the fix, offer to execute it, and stop. Do not proceed to Phase 5 — there is no code bug to fix.

If the classification is **code bug** or **both**: proceed to Phase 5.

---

### Phase 5: Resolve

**Goal:** Fix the root cause — not the symptom — then prove the fix works. Present resolution options and execute with the user's consent.

**Steps:**

1. **Present resolution options.**
   Before writing code, explain to the user what you propose and why:
   - What the fix is (concrete: which file, what change, why it's correct)
   - What alternatives exist (if any — e.g., fix upstream vs add validation downstream)
   - What the blast radius is (what other code/tests are affected)
   - Offer to implement the fix: "I can make this change now. Should I proceed?"

2. **Write a failing test** that reproduces the bug (if one doesn't already exist).
   - This is your regression gate. If you can't write a test, document why.
   - The test should fail NOW and pass AFTER your fix.
   - Load `/tdd` for test design guidance if writing a new regression test from scratch.

3. **Implement a single, minimal fix.**
   - Fix the ROOT CAUSE identified in Phase 3. Nothing else.
   - Do not bundle improvements, refactors, or other fixes. One bug, one fix.
   - If the fix requires changes in multiple files, every changed line must be necessary for this specific root cause.

4. **Verify the fix.**
   - Run the originally failing test/command — it should pass.
   - Run all tests in the same file/module — no regressions.
   - Run type check and lint — no new errors.
   - If the bug was user-reported: manually verify the user-facing symptom is gone.
   - **Load:** `references/tool-patterns.md` §6 for the complete verification sequence.

5. **Confirm the fix is correct, not lucky.**
   - Can you explain WHY the fix works?
   - Does it address the root cause from Phase 3, or something else?
   - If the fix differs from what your investigation predicted — go back. Your understanding may be wrong and the fix coincidental.

**Completion criteria:** The failing test passes. The broader test suite passes. You can explain why the fix is correct and how it addresses the root cause.

**If the fix doesn't work:** See §The 3+ Failures Rule.

---

### Phase 6: Harden

**Goal:** Prevent this class of bug from recurring.

**Steps:**

1. **Search for the same pattern elsewhere.**
   - If you found a null-check bug, search for similar unchecked access patterns.
   - If you found a race condition, check other concurrent code paths.
   - **Load:** `references/tool-patterns.md` §5 for pattern search sequences.

2. **Run the full test suite** — not just the targeted tests from Phase 5.
   - If the full suite is too slow, run at minimum the test files that import the modified modules.

3. **Harden where appropriate:**
   - Does this bug reveal a missing validation? Add it at the boundary.
   - Does this bug reveal a confusing API? Consider if the API can be made safer.
   - Is this a footgun others might hit? Add a targeted comment explaining the constraint.

4. **Clean up.**
   - Remove temporary diagnostic logging from investigation.
   - Keep the regression test — that stays permanently.

**Completion criteria:** Full test suite passes. Diagnostic artifacts cleaned up. Similar patterns either fixed or documented.

---

## Red Flags

Monitor for these during every phase. If you detect one, stop and correct course.

| Red flag | Detection | Correction |
|---|---|---|
| **Shotgun debugging** | Making changes without a hypothesis | Stop. Form a hypothesis. Test with a probe, not a fix |
| **Symptom fixing** | Adding a guard/check/catch without understanding why the bad state exists | Stop. Trace the bad state to its origin. Fix there |
| **Confirmation bias** | Only seeking evidence supporting your hypothesis | Actively try to DISPROVE your hypothesis |
| **Scope creep** | "Fixing" related issues alongside the original bug | Stop. One bug, one fix. File other issues separately |
| **Stale code** | Error doesn't match the code you're reading | Verify: fresh build? Right branch? Transpiled output stale? |
| **Tunnel vision** | >5 min on one file without progress | Zoom out. Read callers. Check git history. The bug may be elsewhere |
| **Fix escalation** | Fix keeps growing (more files, more changes) | Stop. A growing fix is attacking the wrong root cause. Return to Phase 3 |

---

## Agent Self-Monitoring

Track these continuously. They detect failure modes before they waste significant time.

### Loop Detection

| Signal | Threshold | Action |
|---|---|---|
| Same tool call with same arguments | 2 times | Flag: you're repeating yourself |
| Consecutive actions with no new information | 3 actions | **Stop.** Summarize what you know, switch approach |
| Same file/function investigated without finding bug | 3 visits | Hypothesis is wrong. Form a different one |
| Fix applied, test still fails, similar fix attempted | 2 cycles | **Stop.** Return to Phase 2, rebuild mental model |
| Files read without forming a hypothesis | 5 reads | **Stop.** You're exploring, not converging. Hypothesize now |
| Total actions without resolution | 20 actions | Evaluate for escalation (see §Escalation) |

### Strategy Switching

When a loop threshold is hit, switch — don't retry:

| If you've been... | Switch to... |
|---|---|
| Reading code without converging | Run it with diagnostic logging, observe actual behavior |
| Adding logging without finding divergence | Use git bisect to narrow the timeframe |
| Focused on one file | Search the entire codebase for the pattern |
| Debugging top-down (from entry point) | Debug bottom-up (from the error site backward) |
| Trusting the error location | Verify: build fresh? right branch? source maps correct? |
| Making the fix bigger | Reset. The fix direction is wrong. Restart Phase 3 |

### Confidence Calibration

Communicate your confidence and act accordingly:

| Level | Criteria | Action |
|---|---|---|
| **High** (>90%) | Error directly points to bug; you see the wrong code; you understand WHY | Fix, test, verify |
| **Medium** (50-90%) | Plausible hypothesis with partial evidence; not fully traced | One more diagnostic before fixing |
| **Low** (<50%) | Multiple plausible causes; generic error; uncertain location | Do NOT fix. Enumerate hypotheses, run diagnostics |
| **None** | No hypothesis after investigation | Escalate with findings |

**Calibration rule:** If you've been wrong twice on the same bug, downgrade all subsequent confidence by one level. Your model of this system is unreliable.

**Verification hierarchy** (higher beats lower):

1. Test execution result — code ran and produced observable output
2. Type checker / linter output — static analysis confirmed
3. Code reading + reasoning — you read it and think it's correct

Never trust level 3 alone. Always get to level 1 or 2 before claiming a fix is correct.

---

## The 3+ Failures Rule

**If 3 or more fix attempts have failed, the problem is not the fix — it's your understanding.**

When this triggers:

1. **STOP making changes.** Revert ALL attempted fixes. Return to the original broken state.
2. **Re-read the original error message.** Not the new errors your fixes may have introduced.
3. **List every hypothesis and why each was wrong.** Look for a pattern — what assumption do they all share?
4. **Question the architecture, not just the code:**
   - Is this actually TWO interacting bugs?
   - Is the code you're looking at even the right code? (Stale build, wrong branch, transpilation)
   - Is the test itself correct? (Tests can have bugs too)
   - Is there an environmental factor you haven't checked?
5. **Try a fundamentally different diagnostic approach** — not a variant of what you've been doing:
   - If reading code → run with logging
   - If adding logging → use git bisect
   - If debugging one file → search the whole codebase
   - If debugging top-down → try bottom-up

If a 4th fix fails: **escalate.** Continuing with a flawed mental model makes things worse.

---

## Escalation

Escalation is a design feature, not a failure. An agent that escalates with good findings is more valuable than one that persists with wrong assumptions.

### When to Escalate

- **Budget exceeded:** 20+ steps without resolution
- **Repeated failures:** 3+ failed fix attempts
- **Scope exceeded:** Bug spans 3+ interconnected systems beyond your context
- **High-risk fix:** Touches auth, payments, data migration, or production config — escalate with proposed fix for review
- **Missing information:** Need production logs, external service state, or user-specific data you can't access
- **Can't reproduce:** Non-deterministic failure after 5+ reproduction attempts
- **Architectural fix needed:** Root cause identified but fix requires changes beyond bug-fix scope

### Escalation Format

Provide ALL of the following:

1. **The original problem** — exact error message or symptom
2. **What you investigated** — files read, hypotheses tested, experiments run
3. **What you learned** — findings, including what you ruled out (negative results are valuable)
4. **Your current best hypothesis** — what you think the issue is, even if unconfirmed
5. **What you need** — specific information or action required from the human

---

## Error Message Interpretation

**Load:** `references/tool-patterns.md` §8 for systematic error message parsing (anatomy, interpretation heuristics, frame selection).

---

## Evidence Gathering

When investigating, gather evidence strategically — instrument at boundaries, not in the middle of logic.

**Load:** `references/tool-patterns.md` §4 for where to instrument, what to capture, and how to interpret results.

---

## Composability

This skill is standalone but integrates with the broader skill ecosystem:

| Situation | Composition |
|---|---|
| Need to understand unfamiliar code before debugging | Load `/inspect` for structured codebase exploration |
| Need to map all surfaces a feature touches | Load `/discover` for cross-surface dependency mapping |
| Need to write a regression test for the fix | Load `/tdd` for test design methodology (focused on greenfield test authoring) |
| Bug found during QA testing | `/qa-test` invokes `/debug` for diagnosis |
| Implementation iteration hits a failure | Agent escalates to invoker, which can load `/debug` for diagnosis |
| Full feature delivery pipeline | When `/ship` encounters failures, debugging methodology from this skill applies |
| Complex multi-faceted issue needs deeper analysis | Load `/analyze` for multi-angle evidence-based analysis |
