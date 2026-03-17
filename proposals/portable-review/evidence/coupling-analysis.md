---
title: GitHub Coupling Analysis
description: Analysis of where GitHub-specific coupling exists across the review system components.
created: 2026-02-23
last-updated: 2026-02-23
---

## Child Reviewers — CONFIRMED platform-agnostic

### Tool lists (all 15 reviewers)
All children declare the same tool set:
```
tools: Read, Grep, Glob, Bash, mcp__exa__web_search_exa
disallowedTools: Write, Edit, Task
```
No GitHub MCP tools. CONFIRMED: children never call GitHub APIs.

### GitHub URL references in children
Searched all 15 `pr-review-*.md` files for `github.com`, `blob/`, `GitHub URL`, `url.*base`.
**Result: zero matches.** Children do not hardcode any GitHub URLs.

### GitHub URL construction via output contract
The `pr-review-output-contract` skill instructs children to construct GitHub URLs in their `references` field:
- Line 108: "The `pr-context` skill provides the GitHub URL base pattern for constructing links."
- Lines 119-124: Provides `https://github.com/{repo}/blob/{sha}/{path}#L{line}` pattern

**Key insight:** The URL pattern is **injected** via the `pr-context` skill's "GitHub URL Base" section, not hardcoded in children or the output contract. If pr-context provides a different URL pattern (or omits it), children will adapt.

**Implication:** For local mode, we can either:
1. Provide a local URL pattern (e.g., `file://{path}#L{line}` or just `{path}:L{line}`)
2. Omit the section — children would likely fall back to `file:line` format
3. Update the output contract to say "use the URL base from pr-context if available, otherwise use repo-relative `file:line`"

### pr-context section dependencies in children
Searched all 15 `pr-review-*.md` files for references to pr-context-specific sections:
- "prior feedback", "linked issue", "review thread", "automated review", "human review", "review_scope", "delta", "changes since last"
**Result: zero matches.** Children don't reference any of these sections.

Children reference pr-context only generically: "The diff, changed files, and PR metadata are available via your loaded `pr-context` skill"

**Implication:** Children will work with whatever pr-context provides. If sections are absent (e.g., no linked issues, no prior feedback), children simply won't have that context — they won't error or break.

## Orchestrator — GitHub-coupled in Phases 5-6 only

### GitHub MCP tools (Phase 5-6)
```yaml
tools: [...] mcp__github__create_pending_pull_request_review,
       mcp__github__add_comment_to_pending_review,
       mcp__github__submit_pending_pull_request_review
```
These are used only in Phases 5 (inline comments) and 6 (submit review).

### Phases 1-4 — Generic
- Phase 1 (Analyze Context): Reads pr-context skill, spawns Explore subagents. Generic.
- Phase 1.5 (Generate TLDR): Fills template. Generic.
- Phase 2 (Select Reviewers): Selection matrix based on file types. Generic.
- Phase 3 (Dispatch): Spawns children via Task tool. Generic.
- Phase 4 (Judge/Filter): Deduplication, relevancy check, conflict resolution. Generic except for:
  - Phase 4.2 references "already-raised issues" which implies prior feedback awareness
  - This is soft — it says "if any" not "must check"

### Phases 5-6 — GitHub-coupled
- Phase 5: Creates pending review, adds inline comments with GitHub suggestion syntax, deduplicates against prior Active threads
- Phase 6: Submits review atomically with summary body. Uses `## PR Review Summary` heading (regex-coupled to CI workflow).

### The `## PR Review Summary` heading coupling
Line 419 of orchestrator: "The CI workflow uses a regex (`^## PR Review Summary`) to identify prior automated reviews and compute the delta for re-reviews."
This is a coupling between the orchestrator output format and the CI workflow's bash logic.
In local mode, this heading has no functional significance.

## Output Contract — Nearly generic

The `pr-review-output-contract` skill defines the Finding[] JSON schema.
- Schema itself: fully generic (type, file, line, category, issue, references, severity, confidence, fix, fix_confidence)
- Reference format: GitHub URL-coupled (see "GitHub URL construction" above) but injected via pr-context
- Examples: Use GitHub URLs but these are illustrative

**Assessment:** The output contract schema is generic. The reference URL format guidance can be parameterized via pr-context.
