Use when: Running the push -> review -> assess -> fix loop (Phase 5)
Priority: P0
Impact: Missed feedback, unresolved threads, mechanical/uncritical response to reviews, infinite loops

---

# Review Iteration Protocol

Phase 5 has two stages. Stage 1 (review loop) runs first and takes priority. Stage 2 (CI/CD resolution) runs after the review loop is finalized.

**Why two stages:** CI/CD pipelines can take a long time. Waiting for CI/CD while Claude Code review feedback is already available wastes time. Review-driven code changes often invalidate the current CI/CD run anyway, so processing reviews first is more efficient.

---

## Scripts

This skill provides two scripts for reliable GitHub data retrieval. Always prefer these over manual `gh` commands — they handle pagination, formatting, and common pitfalls (like `gh pr view --comments` missing inline review comments).

| Script | Purpose | Usage |
|---|---|---|
| `scripts/fetch-pr-feedback.sh` | Fetch reviews, inline comments, discussion comments, CI/CD status | `./scripts/fetch-pr-feedback.sh <pr> [--reviews-only] [--checks-only] [--since ISO]` |
| `scripts/investigate-ci-failures.sh` | Investigate failures: logs, failing steps, main comparison | `./scripts/investigate-ci-failures.sh <pr> [--compare-main] [--log-lines N]` |

For replying to review comment threads (not scripted — content varies each time):
```bash
gh api --method POST repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies -f body="<reply>"
```

---

## Stage 1: Review loop

Claude Code reviewer feedback is the primary signal. CI/CD is secondary and opportunistic during this stage.

### 1. Push and update PR

```bash
git push
```

Update the PR description if the implementation has changed materially:
```bash
gh pr edit <number> --body "$(cat <<'EOF'
## Summary
<updated summary>

## Changes
<bullet list of what changed>

## Test plan
<updated test plan>

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 2. Poll for review feedback

Wait approximately 4 minutes, then check for Claude Code reviewer feedback. Opportunistically check CI/CD at the same time:

```bash
# Primary: fetch all review feedback
./scripts/fetch-pr-feedback.sh <pr-number> --reviews-only

# Secondary (opportunistic): check CI/CD status
./scripts/fetch-pr-feedback.sh <pr-number> --checks-only

# Or fetch everything at once:
./scripts/fetch-pr-feedback.sh <pr-number>
```

**Decision logic:**

| What's available | Action |
|---|---|
| Review feedback ready, CI/CD not done | Proceed to assess review feedback immediately. Do NOT wait for CI/CD. |
| Review feedback ready, CI/CD also ready | Assess both. Handle review feedback first, then CI/CD failures. |
| No review feedback, CI/CD has failures | Assess and fix CI/CD failures while waiting for review. |
| Neither ready | Wait another 2-3 minutes and check again. After 3 checks with no results, proceed with other work and check back later. |

### 3. Assess reviewer feedback

You are a peer engineer evaluating suggestions — not a subordinate implementing directives. Reviewer comments are hypotheses about your code. Some will be correct and valuable. Some will be wrong, inapplicable, or based on incomplete understanding. Your job is to determine which is which, with evidence.

**Do not default to acceptance.** The path of least resistance (just apply every suggestion) produces worse code than thoughtful evaluation. Equally, do not default to rejection — that wastes valid insights.

#### 3a. Investigate before deciding

For each suggestion, build enough context to make a **high-confidence judgment**. The amount of investigation should be proportional to the suggestion's stakes:

| If the suggestion is... | Investigation depth |
|---|---|
| Pointing to a potential bug or correctness issue | **Deep.** Read the code path end-to-end. Trace the data flow. Check edge cases. Verify the claim is actually true in this context. |
| Proposing an alternative pattern or approach | **Medium.** Check how the codebase handles similar cases. Consider why the current approach was chosen. Evaluate tradeoffs. |
| Flagging a style/naming/convention issue | **Light.** Quick check of adjacent code for existing conventions. |
| Making a claim you're uncertain about | **Research.** Use web search, `/research`, or codebase inspection to gather evidence. Do not guess. |

Investigation tools (use as needed):
- **Codebase inspection:** Read adjacent files, grep for patterns, trace call chains. Understand what the reviewer may not have seen.
- **Spec/intent check:** Re-read the relevant SPEC.md sections. Does the suggestion align with or contradict the design intent?
- **Web search:** For claims about library behavior, API semantics, best practices, or security considerations.
- **`/research`:** For complex questions requiring deep investigation (e.g., "is this pattern actually safer?" or "how do other systems handle this?").
- **Product context:** Consider how the change affects users, other consumers, and downstream systems. A technically valid suggestion may be wrong for the product.

#### 3b. Evaluate across multiple dimensions

For each suggestion, assess:

| Dimension | Question to answer |
|---|---|
| **Validity** | Is the premise correct? Does the issue the reviewer identified actually exist? |
| **Correctness** | Is the proposed fix/change actually correct, or does it introduce new problems? |
| **Applicability** | Does this apply in this specific context, or is it generic advice that doesn't fit here? |
| **Relevancy** | Is this relevant to the PR's scope and intent, or is it a tangential improvement? |
| **Tradeoffs** | What are the pros and cons? Does applying the suggestion improve one thing but degrade another? |
| **Side effects** | What else changes if you apply this? Does it affect other code paths, tests, or consumers? |
| **Appropriateness** | Is this the right PR and right time for this change? |

You do not need to evaluate every dimension for every comment. Use judgment — a simple naming suggestion doesn't need a tradeoff analysis. A suggested architectural change does.

#### 3c. Decide and act

After investigation, classify and act:

| Assessment | Action |
|---|---|
| Valid bug or correctness issue (confirmed by evidence) | Fix immediately. High priority. |
| Valid improvement aligned with scope (tradeoffs favorable) | Implement if effort is proportional to value. |
| Valid suggestion but out of scope or inappropriate for this PR | Acknowledge, note as future work, decline for this PR. |
| Incorrect or based on misunderstanding (you have evidence) | Reply explaining why, with evidence. Mark resolved. |
| Technically valid but tradeoffs are unfavorable | Reply explaining the tradeoffs and why you're declining. Mark resolved. |
| Style/preference with no correctness impact | Use your judgment. Prefer consistency with existing codebase. |
| Suggestion contradicts the spec or design intent | Reply referencing the spec. Consult user if ambiguous. |
| Uncertain after investigation | Consult the user. Present what you found and your leaning. |

#### 3d. Reply with evidence

- **If accepting:** Brief acknowledgment of what you're fixing and why the reviewer was right. Push the fix, then mark resolved.
- **If declining:** Explain your reasoning with **specific evidence** — code references, spec sections, tradeoff analysis, or research findings. Be respectful but direct. Do not apologize for disagreeing; explain why you disagree. Mark resolved.
- **If partially accepting:** Explain what you're taking and what you're not, and why. This is often the right answer — a suggestion may be directionally correct but the specific implementation wrong.

### 4. Implement changes and test

**For small changes** (< 20 lines, single file, clear fix):
- Make the change directly.

**For medium changes** (20-100 lines, 2-3 files):
- Make the change directly, but run full Tier 1 tests before pushing.

**For large/complex changes** (> 100 lines, architectural, or touching many files):
- Spin up a subagent with clear, specific instructions and full context (see Subagent delegation template below).
- Review the subagent's output before committing. You are still the owner.

At minimum, run Tier 1 tests after any changes:
```bash
pnpm test --run
pnpm typecheck
pnpm lint
```

If changes affect user-facing behavior, also run Tier 2 (manual integration) tests.

### 5. Push and repeat

Push changes, then return to step 2. Continue the loop.

### 6. Exit Stage 1

Exit the review loop when you determine there is no more actionable, valid review feedback remaining. This means:
- [ ] All reviewer feedback threads are resolved (accepted with code changes or declined with reasoning)
- [ ] You have pushed your latest changes
- [ ] No new review comments have appeared on the latest push

If the same feedback keeps recurring after 3 iterations, pause and consult the user.

Once Stage 1 is complete, proceed to Stage 2.

---

## Stage 2: CI/CD resolution

After the review loop is finalized, shift focus to monitoring and resolving CI/CD pipeline results.

### 1. Monitor pipeline

```bash
./scripts/fetch-pr-feedback.sh <pr-number> --checks-only
```

### 2. Process failures as they appear

Do NOT wait for the entire pipeline to finish. As soon as any check in a given run reports a failure, investigate immediately:

```bash
# Get failure details with logs and main branch comparison
./scripts/investigate-ci-failures.sh <pr-number> --compare-main
```

For each failing check, **classify**:

| Classification | Action |
|---|---|
| Caused by this PR's changes | Fix it. |
| Pre-existing failure (fails on main too) | Note in PR comment. Do not fix unless trivial. |
| Flaky test (passes on retry) | Note in PR comment. Retry if the CI system supports it. |
| Infrastructure issue (timeout, resource, OIDC) | Note in PR comment. Retry. |

### 3. Fix, test, push, and monitor next run

After fixing failures:
1. Run Tier 1 tests locally to verify the fix.
2. Push.
3. Monitor the next CI/CD run.
4. Repeat until the pipeline is green or all remaining failures are documented as pre-existing/unrelated.

### 4. Exit Stage 2

Stop when ALL of these are true:
- [ ] CI/CD pipeline is green (or failures are documented as pre-existing/unrelated)
- [ ] You are satisfied with the implementation quality
- [ ] No pending items in your task list

If CI keeps failing on the same issue after 3 attempts, pause and consult the user.

---

## Subagent delegation template

When spinning up a subagent for implementation work:

```
Task: [specific description of what to change]

Context:
- Working in worktree at: [path]
- PR: [URL]
- SPEC.md section: [relevant section]

Files to modify:
- [file1]: [what to change and why]
- [file2]: [what to change and why]

Current behavior: [what the code does now]
Expected behavior: [what it should do after the change]

Tests:
- Run: pnpm test --run [specific test file if applicable]
- Expected result: [what passing looks like]

Constraints:
- Follow existing patterns in adjacent files
- Do not modify files outside the listed scope
- Run typecheck and lint before finishing
```
