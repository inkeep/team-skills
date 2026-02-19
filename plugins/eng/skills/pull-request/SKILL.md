---
name: pull-request
description: "Write or update a GitHub PR body — self-contained, stateless, and structured for efficient review. Gathers context from the diff, spec, and implementation to produce a comprehensive PR description. Standalone or composable with /ship and /review. Triggers: PR body, PR description, pull request, write PR, update PR, create PR, PR template."
argument-hint: "[PR number | 'new'] [--spec path/to/SPEC.md]"
---

# Pull Request

Write or update a PR body that gives reviewers everything they need to understand the change without reading the spec, commit history, or any other document.

---

## Principles

- **Self-contained.** The PR body stands on its own. A reviewer should understand what this PR does, why, and what key decisions were made — without reading a spec, commit history, or anything else.
- **Stateless.** The PR body always reflects the current scope of the PR relative to origin/main. It is a snapshot, not a journal. When updating, rewrite affected sections to reflect current reality — do not append change notes or leave revision artifacts.

---

## Workflow

### Step 1: Gather context

Determine what this PR does from whatever is available:

| Input | How to use it |
|---|---|
| **PR number provided** | Run `gh pr diff <number>` and `gh pr view <number>`. Read changed files to understand what was built. |
| **SPEC.md path provided** | Read the spec. Cross-reference with the actual implementation — the code is the source of truth, not the spec. |
| **"new" (no PR yet)** | Run `git diff main...HEAD --stat` and read changed files. Understand what was built from the code. |
| **No input** | Infer from current branch: `gh pr view --json number -q '.number'` or `git diff main...HEAD --stat`. |

When a SPEC.md exists, use it as source material alongside the implementation. The PR body synthesizes both — spec intent and implementation reality — into a unified narrative. When no SPEC.md exists, derive everything from the code and commit history.

### Step 2: Write the PR body

Fill in each section of the template below. Omit sections that don't apply (noted in each section's guidance). Write for the audience: a reviewer who has not seen the spec or the commit history.

#### Summary

What this PR does and why — 1-3 sentences.

#### Motivation

What problem this solves, why now, who benefits.

#### Approach

Brief narrative of how the implementation works at a high level — the architecture, key patterns, and flow.

#### Architectural decisions

Key technical decisions: what was chosen, why, and what was considered. Flag gray areas where reasonable engineers might disagree or where the decision could be revisited. If the implementation diverged from the spec, capture the divergence here as a decision with rationale.

#### Changes

Bullet list of what changed, organized by area.

#### Screenshots / recordings

Visual evidence of UI or behavioral changes. **Omit if no visual changes.**

When the diff touches UI files (components, pages, styles, layouts) and `/screengrabs` is available, invoke it to capture before/after screenshots of affected routes. This automates the most common visual evidence and ensures screenshots are consistent and up-to-date with the actual PR state. Add manual screenshots only for interactions or states that `/screengrabs` cannot capture (e.g., hover states, mid-animation frames, error modals triggered by specific sequences).

#### How to verify

Steps a reviewer can follow to manually verify the behavior. **Omit if changes are purely internal.**

#### Test plan

Manual QA, smoke tests, and verification done **outside** the automated test suite. Do not restate what the test suite covers — reviewers can read the test files. Examples: browser testing, curl/API checks, edge case verification, error state inspection.

**When `/qa-test` has already written a `## Test plan` section on the PR body:** Read the existing PR body before writing. Incorporate the QA checklist items (with their pass/fail/blocked status) into this section — do not discard them. The QA checklist is evidence of testing done; your job is to integrate it into the full PR body, not replace it.

#### Related issues

Links to GitHub issues this PR closes or relates to. Use `Closes #123` syntax where applicable. **Omit if none.**

#### Future considerations

Items surfaced during review that are out of scope for this PR but worth tracking. Updated during the review loop as reviewers raise pre-existing or tangential issues. **Omit if none.**

#### Footer

```
Generated with [Claude Code](https://claude.com/claude-code)
```

### Step 3: Apply

First, verify `gh` CLI is available (`gh auth status`). If unavailable, output the PR body for the user (or the invoking skill) to apply manually — do not fail silently.

**Creating a new PR:**

```bash
git push -u origin <branch>
gh pr create --draft --title "<concise title>" --body "$(cat <<'EOF'
<filled-in PR body>
EOF
)"
```

**Updating an existing PR:**

```bash
gh pr edit <number> --body "$(cat <<'EOF'
<updated PR body>
EOF
)"
```

When updating, rewrite the full body to reflect current reality. Do not patch individual sections — the body is stateless.

---

## When invoked by other skills

When `/ship`, `/review`, or another skill delegates PR body work:

- Accept any context they provide (SPEC.md path, PR number, QA results, review feedback).
- Return the filled-in PR body for them to apply, or apply it directly if a PR number is available.
- The invoking skill decides *when* to update the PR body; this skill handles *how*.
- **When composed with `/ship`:** The draft PR already exists (created after Phase 2 with a stub body). You will be invoked with a PR number to write the full body via `gh pr edit`. You do not need to create the PR — only write the body.

---

## Calibrating depth

Match PR body depth to what changed:

| What changed | PR body depth |
|---|---|
| New feature (multi-file, user-facing) | All sections — full narrative, architectural decisions, screenshots, test plan |
| Enhancement to existing feature | Summary, motivation, approach, changes, test plan. Architectural decisions if design choices were made. |
| Bug fix | Summary, changes, test plan. Motivation if the bug's impact warrants explanation. |
| Config / infra / refactor | Summary, changes. Approach if the refactor strategy matters. |
