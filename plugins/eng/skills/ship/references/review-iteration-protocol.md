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

**Path resolution:** Script paths (`./scripts/...`) are relative to this skill's base directory, not the current working directory. When invoking from a worktree or other directory, use the full path to the skill's `scripts/` folder. If the scripts are not found (e.g., in a Docker or isolated environment where the skill directory is not mounted), fall back to the equivalent `gh api` commands documented inline.

| Script | Purpose | Usage |
|---|---|---|
| `scripts/fetch-pr-feedback.sh` | Fetch reviews, inline comments, discussion comments, CI/CD status | `./scripts/fetch-pr-feedback.sh <pr> [--reviews-only] [--checks-only] [--since ISO]` |
| `scripts/investigate-ci-failures.sh` | Investigate failures: logs, failing steps, main comparison | `./scripts/investigate-ci-failures.sh <pr> [--compare-main] [--log-lines N]` |

For responding to feedback (not scripted — content varies each time):

```bash
# Reply to an inline review comment thread
gh api --method POST repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies -f body="<reply>"

# Resolve an inline review comment thread (after replying)
gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -f id="<thread_node_id>"

# Post a top-level PR comment (for responding to review body or general discussion)
gh pr comment <pr_number> --body "<reply>"
```

To get thread node IDs for resolving, use the GraphQL API or extract them from the output of `fetch-pr-feedback.sh`.

---

## Stage 1: Review loop

Claude Code reviewer feedback is the primary signal. CI/CD is secondary and opportunistic during this stage.

### 1. Push and update PR

```bash
git push
```

Update the PR description if the implementation has changed materially — if the Approach or Changes sections no longer describe what the code actually does, update them. Not every small fix requires a PR body edit.

**Use the SPEC.md as the source material for the PR body.** Distill it — don't copy the entire spec. The PR body should be a high-resolution summary that gives reviewers full context without requiring them to read the spec end-to-end. Link to the full SPEC.md for anyone who wants complete context.

| PR section | Source | What to write |
|---|---|---|
| Summary | SPEC.md §1 (Problem statement) | 1-3 sentences: what this PR does and why. |
| Motivation | SPEC.md §1-§2 (Problem + Goals) | What problem this solves, why now, who benefits. |
| Approach | SPEC.md §9 (Proposed solution) + §10 (Decision log) | Key design decisions and why they were chosen over alternatives. Include decisions made *during implementation* that aren't in the spec. |
| Changes | Implementation-specific | Bullet list of what changed, organized by area. This is the one section the spec can't provide — it reflects what was actually built. |
| Deviations | Implementation-specific | What diverged from the spec and why. Omit if implementation matched the spec exactly. |
| Test plan | Implementation-specific | What was tested, how, and key scenarios verified — both automated and manual. |
| Spec link | — | Link to the SPEC.md file for full context. |

```bash
gh pr edit <number> --body "$(cat <<'EOF'
## Summary
<distill from SPEC.md §1 — what this PR does and why>

## Motivation
<distill from SPEC.md §1-§2 — what problem, why now, who benefits>

## Approach
<distill from SPEC.md §9 + §10 — key design decisions and rationale, including any decisions made during implementation>

## Changes
<bullet list of what actually changed, organized by area>

## Deviations from spec
<what diverged from the SPEC.md during implementation and why — omit if none>

## Test plan
<what was tested, how, and key scenarios verified — both automated and manual>

**Spec:** <link or path to SPEC.md>

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

#### 3e. Close the loop (response mechanics by feedback type)

Different GitHub feedback types have different resolution mechanisms. Use the right one:

| Feedback type | How to respond | How to close |
|---|---|---|
| **Inline review comment thread** (comment on a specific line of code) | Reply to the thread with your reasoning or acknowledgment. | **Resolve the conversation** via `resolveReviewThread` GraphQL mutation. This is the primary closure mechanism — it signals the thread is addressed. |
| **Review body** (top-level text in an APPROVE / REQUEST_CHANGES / COMMENT review) | Post a top-level PR comment addressing the points raised. | No "resolve" mechanism exists. Your reply serves as the closure. If the review requested changes and you have addressed them, the next review cycle from the reviewer supersedes it. |
| **PR discussion comment** (general comment on the PR, not part of a code review) | Reply in the thread. | No "resolve" mechanism. Your reply closes the loop. |
| **CI/CD failure** | Not a comment — handled in Stage 2. | Fix and push, or document as pre-existing. |

**When to resolve vs. when to reply only:**
- **Resolve** inline threads once the matter is settled — whether you accepted (and pushed the fix) or declined (and explained why). Do not leave threads open if you have made a final decision.
- **Do not resolve** threads where you are asking a follow-up question or where you expect further discussion. Leave those open for the reviewer to respond.
- For review-body-level feedback (REQUEST_CHANGES), your top-level PR comment should summarize which items you addressed and which you declined, so the reviewer can quickly re-evaluate.

### 4. Implement changes and test

**For small changes** (< 20 lines, single file, clear fix):
- Make the change directly.

**For medium changes** (20-100 lines, 2-3 files):
- Make the change directly, but run full Tier 1 tests before pushing.

**For large/complex changes** (> 100 lines, architectural, or touching many files):
- Spin up a subagent with clear, specific instructions and full context (see Subagent delegation template below).
- Review the subagent's output before committing. You are still the owner.

Before pushing, evaluate your own changes against the same quality bar you apply to Ralph's output:
- **Correctness**: does the change actually fix the issue or implement the suggestion correctly?
- **Clarity**: could another engineer understand this without explanation?
- **Codebase alignment**: does it follow existing patterns and conventions?
- **Proportionality**: does the fix match the scope of the problem, or did you over-build or under-build?

At minimum, run Tier 1 tests after any changes:
```bash
pnpm test --run
pnpm typecheck
pnpm lint
```

If changes affect user-facing behavior, also run Tier 2 (QA) tests.

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
