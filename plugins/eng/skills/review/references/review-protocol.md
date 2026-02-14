Use when: Assessing reviewer feedback (Stage 1, step 3); writing PR body from SPEC.md; delegating to subagents
Priority: P0
Impact: Mechanical/uncritical response to reviews; missed nuance in feedback assessment; unresolved threads

---

# Review Protocol

This reference file contains the detailed protocols for the `/review` skill. The SKILL.md provides the workflow skeleton; this file provides the depth.

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

## PR body from SPEC.md

When a SPEC.md is available, use it as the source material for the PR body. Distill it — don't copy the entire spec. The PR body should be a high-resolution summary that gives reviewers full context without requiring them to read the spec end-to-end. Link to the full SPEC.md for anyone who wants complete context.

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

When no SPEC.md is available, write the PR body directly from the implementation context. The same sections apply — Summary, Motivation, Approach, Changes, Test plan — but you derive them from the code and commit history rather than a spec document.

---

## Assessment protocol

You are a peer engineer evaluating suggestions — not a subordinate implementing directives. Reviewer comments are hypotheses about your code. Some will be correct and valuable. Some will be wrong, inapplicable, or based on incomplete understanding. Your job is to determine which is which, with evidence.

**Do not default to acceptance.** The path of least resistance (just apply every suggestion) produces worse code than thoughtful evaluation. Equally, do not default to rejection — that wastes valid insights.

### 3a. Investigate before deciding

For each suggestion, build enough context to make a **high-confidence judgment**. The amount of investigation should be proportional to the suggestion's stakes:

| If the suggestion is... | Investigation depth |
|---|---|
| Pointing to a potential bug or correctness issue | **Deep.** Read the code path end-to-end. Trace the data flow. Check edge cases. Verify the claim is actually true in this context. |
| Proposing an alternative pattern or approach | **Medium.** Check how the codebase handles similar cases. Consider why the current approach was chosen. Evaluate tradeoffs. |
| Flagging a style/naming/convention issue | **Light.** Quick check of adjacent code for existing conventions. |
| Making a claim you're uncertain about | **Research.** Use web search, `/research`, or codebase inspection to gather evidence. Do not guess. |

Investigation tools (use as needed):
- **Codebase inspection:** Read adjacent files, grep for patterns, trace call chains. Understand what the reviewer may not have seen.
- **Spec/intent check:** If a SPEC.md was provided, re-read the relevant sections. Does the suggestion align with or contradict the design intent?
- **Web search:** For claims about library behavior, API semantics, best practices, or security considerations.
- **`/research`:** For complex questions requiring deep investigation (e.g., "is this pattern actually safer?" or "how do other systems handle this?").
- **Product context:** Consider how the change affects users, other consumers, and downstream systems. A technically valid suggestion may be wrong for the product.

**Litmus test for investigation depth:** Could you explain your reasoning to a senior engineer and defend it with evidence? If not, you have not investigated enough. An assessment backed by "I think" or "it seems" has not met the standard. An assessment backed by "I read the code path and confirmed X" or "I checked the spec and this contradicts section Y" has.

### 3b. Evaluate across multiple dimensions

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

**For non-trivial suggestions** (architectural changes, alternative approaches, scope questions), deepen the evaluation with these additional dimensions:

| Dimension | What to weigh |
|---|---|
| **Necessity** | Does this solve a validated problem in this PR, or a hypothetical one? |
| **Proportionality** | Does the complexity of the suggested change match the complexity of the problem it addresses? |
| **Evidence** | What concrete evidence supports the suggestion over the current approach? |
| **Reversibility** | Can this decision be changed later, or is it a one-way door? |
| **Codebase conventions** | What do established patterns in this codebase suggest? |

If evidence does not warrant the complexity, prefer the simpler approach — but "simpler" means fewer moving parts, not fewer requirements. A response that skips a valid concern is not simpler; it is incomplete.

**Over-indexing looks like:** applying every suggestion without evaluating tradeoffs, refactoring adjacent code that the reviewer didn't flag, adding defensive checks for scenarios that can't occur in this code path.

**Under-indexing looks like:** dismissing architectural suggestions without reading the affected code paths, accepting "it works" as sufficient evidence, declining suggestions because they require effort rather than because they lack merit.

### 3c. Decide and act

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

### 3d. Reply with evidence

- **If accepting:** Brief acknowledgment of what you're fixing and why the reviewer was right. Push the fix, then mark resolved.
- **If declining:** Explain your reasoning with **specific evidence** — code references, spec sections, tradeoff analysis, or research findings. Be respectful but direct. Do not apologize for disagreeing; explain why you disagree. Mark resolved.
- **If partially accepting:** Explain what you're taking and what you're not, and why. This is often the right answer — a suggestion may be directionally correct but the specific implementation wrong.

### 3e. Close the loop (response mechanics by feedback type)

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

---

## Subagent delegation template

When spinning up a subagent for implementation work during the review loop:

```
Task: [specific description of what to change]

Context:
- Working directory: [path]
- PR: [URL]
- Relevant spec section: [section, if SPEC.md is available]

Files to modify:
- [file1]: [what to change and why]
- [file2]: [what to change and why]

Current behavior: [what the code does now]
Expected behavior: [what it should do after the change]

Tests:
- Run: [test command — use the configured test command for this review session]
- Expected result: [what passing looks like]

Constraints:
- Follow existing patterns in adjacent files
- Do not modify files outside the listed scope
- Run typecheck and lint before finishing
```
