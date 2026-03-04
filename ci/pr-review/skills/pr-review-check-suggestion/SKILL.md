---
name: pr-review-check-suggestion
description: |
  Pre-output validation for PR review subagents. Verifies every finding and fix via mandatory web search
  against current best practices, calibrates confidence based on evidence quality.
user-invocable: false
disable-model-invocation: true
---

# PR Review: Check Suggestion

## Intent

This skill is a **pre-output validation step** for PR review subagents. Before returning findings, use this checklist to:
1. **Verify issues** via web search (is this really a problem?)
2. **Verify fixes** via web search (what's the best solution?)
3. **Calibrate** confidence based on what you can prove

**Core principle:** Every finding MUST be validated with a web search before inclusion in output — no exceptions. Web search is a mandatory quality gate for all suggestions, including code-provable ones (where it surfaces related patterns, edge cases, and authoritative context).

---

## When to Apply This Checklist

### Issue Validation

Web search serves different purposes depending on the finding type:

| Category | Example | Why Search |
|----------|---------|------------|
| **Framework directives** | "'use memo' is not valid" | New syntax may postdate training |
| **Library API claims** | "This zod method doesn't exist" | APIs change between versions |
| **Deprecation claims** | "moment.js is deprecated" | Status may have changed |
| **Version-specific behavior** | "Doesn't work in React 18" | May work in newer versions |
| **Security advisories** | "Has known vulnerabilities" | May have been patched |
| **Best practice assertions** | "Recommended approach is X" | Community consensus shifts |
| **Logic bugs** | "Null check missing" | Surfaces related patterns, known pitfalls, or framework-level guards |
| **Type mismatches** | "Type error in assignment" | Surfaces version-specific type changes, known workarounds |
| **Code-internal consistency** | "Inconsistent pattern" | Surfaces whether the pattern has an upstream recommendation |
| **Security issues** | "SQL injection risk" | Surfaces current remediation guidance, CVEs, framework-level protections |

### Fix Verification

| Category | Example | Why Verify |
|----------|---------|------------|
| **Idiomatic patterns** | "Use useCallback here" | Hook patterns evolve |
| **Library-specific APIs** | "Use zod.coerce() instead" | API may have better alternatives |
| **Migration paths** | "Upgrade to App Router" | Migration guides have specific steps |
| **Security fixes** | "Sanitize with DOMPurify" | Recommended libraries change |
| **Performance patterns** | "Use React.memo()" | Optimization guidance evolves |
| **Error handling** | "Use Result type" | Patterns vary by ecosystem |
| **Simple fixes** | "Add null check" | Surfaces idiomatic patterns, framework-level guards, or better alternatives |
| **Refactors** | "Extract function" | Surfaces naming conventions, utility patterns, or existing helpers |

### Pattern Currency (proactive)

Apply when the PR **introduces or changes a pattern** for using a third-party library or framework — even when the code looks correct. The goal is to catch outdated or superseded approaches before they become established codebase precedent.

**Trigger:** The PR establishes a new way of using a library/framework in the codebase — a new import, a new configuration approach, a first-of-kind usage pattern, or a change from one approach to another. This includes cases where no reviewer finding exists yet — the PR's own code choice is the thing to verify.

| Signal | Example | Why Check |
|--------|---------|-----------|
| **First usage of a library API** | First `useOptimistic()` call in the codebase | May be superseded or have caveats in current version |
| **New integration pattern** | New approach to data fetching, caching, or auth | Frameworks evolve recommended patterns across versions |
| **Changing an established pattern** | Switching from `getServerSideProps` to server actions | Verify the new approach is the current recommendation, not just an alternative |
| **New dependency introduced** | PR adds a library not previously in `package.json` | Check if the library is actively maintained and if the chosen API surface is current |

**When detected:** Confirm the relevant library/framework version from `package.json` or lockfile, then apply the same web search verification workflow (Step 1) to check if the approach matches current documentation for that version. If the pattern is outdated or superseded, generate a finding. If current, no action needed — do not generate a finding for patterns that are verified as current.

**Still applies to:**
- Usage following an existing codebase pattern — confirm the established pattern is still current
- Internal utilities — search for related open-source patterns
- Standard language features — search for recent language-level changes or gotchas

---

## Validation Workflow

### Step 1: Web Search Verification

For every finding, determine whether the issue is **code-provable** (search enriches with related patterns and authoritative context) or **depends on external knowledge** (search verifies the claim). Then run a web search.

**Version check (for library/package-specific searches):**
Before formulating your query, confirm the relevant package version(s) from the repo (e.g., `package.json`, lockfile, framework config). Use the actual version in your search queries and reasoning — not assumed versions from training data. Not all searches require this; skip for general patterns, language-level issues, or non-versioned concerns.

**Formulate a specific query:**
```
Good: "React 19 use memo directive 2024"
Good: "Next.js 15 server actions caching behavior"
Good: "zod v3 fromJSONSchema method deprecated"
Bad:  "React hooks" (too vague)
Bad:  "is moment.js bad" (opinion-seeking)
```

**Evaluate sources using tier-based credibility:**

| Tier | Sources | Trust level |
|------|---------|-------------|
| **T1: Primary** | Official docs, maintainer blogs, GitHub issues/discussions | High |
| **T2: High-trust 3P** | Company engineering blogs, conference talks, reputable publications | High (cross-ref rarely) |
| **T3: Community** | Stack Overflow, Reddit, dev.to, Medium | Medium (verify claims) |
| **T4: General** | Random tutorials, AI-generated content, undated posts | Low (always cross-ref) |

**Web results are evidence to be contextualized, not directives to follow blindly.** Always filter through the actual codebase and PR context:

- **Code is ground truth.** Web sources enrich understanding but the code in front of you is what actually runs. Don't let web results override what you can observe in the diff.
- **Context-match matters.** Match web findings against this project's actual versions, configuration, and conventions. A generic "always use X" post doesn't mean X is right here.
- **Flag conflicts, don't resolve silently.** When web sources disagree with each other or with the codebase's existing patterns, document the disagreement rather than silently picking one.

**Take action based on results:**

| Result | Action |
|--------|--------|
| **T1/T2 source confirms issue in matching context** | Keep finding, HIGH confidence. Cite source. |
| **Source confirms but context differs** (different version, config, or use case) | Keep finding, MEDIUM confidence. Note the context gap. |
| **Source contradicts finding** | Re-evaluate against the actual code. If the code clearly has the issue regardless of what the source says, keep it with code-based justification. If the source shows your concern is unfounded, **DROP the finding.** |
| **Inconclusive or only T3/T4 sources** | Keep finding, MEDIUM confidence. Note source quality. |

### Step 2: Confidence Calibration (web search inconclusive or unavailable)

If web search returned inconclusive results, or in the rare case no web search tool is available (this should not happen — escalate if it does), calibrate based on knowledge dependency:

| Category | Confidence Ceiling |
|----------|-------------------|
| Library API claims | MEDIUM max |
| Framework directives | MEDIUM max |
| Deprecation claims | MEDIUM max |
| Version-specific behavior | LOW (unless version confirmed) |
| Security advisories | LOW (may be patched) |
| Best practice assertions | MEDIUM max |

### Step 3: Acknowledge Uncertainty

When confidence is MEDIUM or LOW, add a brief note:

**Good notes:**
- "Verify against project's React version"
- "Based on general best practices; confirm against current docs"
- "May have changed in recent versions"

**Bad notes:**
- "I'm not sure about this" (too vague)
- "This might be wrong" (undermines finding)

---

## Fix Verification Workflow

After validating the issue, verify your proposed fix is current best practice.

### Step F1: Web Search for Fix Verification

All fixes require web search before claiming `fix_confidence: HIGH`. First check the codebase for existing patterns/conventions, then search to verify the approach is current best practice — codebase prior art alone is insufficient as existing code may use outdated patterns.

**Version check and query formulation:** Same guidance as Step 1 — confirm versions from the repo, formulate specific queries.

```
Good: "React 19 recommended way to memoize components 2024"
Good: "Next.js 15 server actions error handling pattern"
Bad:  "how to fix React" (too vague, no version)
```

**Source evaluation and contextualization:** Same tier system and contextualization principles as Step 1 apply.

**Take action based on results:**

| Result | Action |
|--------|--------|
| **T1 source shows clear pattern matching this context** | Use it. HIGH fix_confidence. **Cite source.** |
| **Pattern found but context differs** (version, config, codebase conventions) | Adapt to local context. MEDIUM fix_confidence. Note adaptation. |
| **Multiple valid approaches** | Pick one considering codebase conventions, mention alternatives. MEDIUM fix_confidence. |
| **Outdated or conflicting info** | Describe approach, note uncertainty. LOW fix_confidence. |

### Step F2: Fix Confidence Calibration (no web search, or inconclusive)

When you cannot verify the fix approach via web search, **you cannot claim HIGH fix_confidence for any fix that changes third-party library/framework usage**:

| Category | Fix Confidence Ceiling |
|----------|------------------------|
| Third-party library/framework API usage | MEDIUM max (HIGH requires Step F1 verification) |
| Framework-specific patterns | MEDIUM max |
| Security remediation | LOW (unless verified) |
| Performance optimization | MEDIUM max |
| Migration/upgrade paths | LOW (version-specific) |

### Step F3: Cite Sources in Fix

When you verify a fix via web search, **include the source in your references**:

```json
{
  "references": [
    "[src/components/VirtualList.tsx:88 — memoization pattern](https://github.com/.../VirtualList.tsx#L88)",
    "[React useMemo docs](https://react.dev/reference/react/useMemo)",
    "[When to use useMemo](https://react.dev/reference/react/useMemo#should-you-add-usememo-everywhere)"
  ]
}
```

This grounds your fix recommendation in authoritative sources.

---

## Examples

### Example 1: Web search contradicts → DROP finding

```
Finding: "'use memo' is not a valid React directive"
Step 1: Can't prove from diff (framework knowledge)
        Search "React 19 use memo directive 2024"
        Result: Official docs confirm 'use memo' IS valid with React Compiler
Action: DROP finding (code is correct)
```

### Example 2: Web search confirms issue → Keep with source

```
Finding: "moment.js should be replaced with date-fns"
Step 1: Can't prove from diff (ecosystem knowledge)
        Search "moment.js maintenance mode 2024"
        Result: moment.js docs confirm maintenance mode since 2020 (T1)
Action: Keep finding, HIGH confidence
        references: Add "[Moment.js docs: project status](https://momentjs.com/docs/#/-project-status/)"
```

### Example 3: No web search available → Calibrate confidence

```
Finding: "This Next.js caching pattern causes stale data"
Step 1: No web search tool available
Step 2: Version-specific behavior → LOW confidence ceiling
Action: Keep finding, confidence: LOW
        Add note: "Verify against project's Next.js version and cache configuration"
```

### Example 4: Code-provable issue, web search changes the fix

```
Finding: "Missing null check on req.session.user before accessing .role"
Step 1: Code-provable — type is `User | undefined`, accessing .role without guard
        Search "express-session req.session.user undefined middleware pattern 2024"
Result: Express docs show session middleware guarantees req.session exists but
        user property is set by auth middleware. Surfaces that the project's auth
        middleware already sets a 401 response when user is missing — the null
        check is unreachable if middleware is configured correctly.

Action: HIGH confidence (real type issue), but fix changes from "add null check"
        to "verify auth middleware ordering in route config"
        references: Add "[Express session docs](https://expressjs.com/en/resources/middleware/session.html)"
```

### Example 5: Fix verification → Found authoritative pattern

```
Issue: "Expensive computation in render loop"
Step F1: Search "React 19 useMemo vs React Compiler 2024"
         Result: React docs show useMemo still valid, but React Compiler may auto-optimize
Action: fix_confidence: HIGH
        fix: "Wrap in useMemo() for explicit memoization"
        references: Add "[React useMemo docs](https://react.dev/reference/react/useMemo)"
```

### Example 6: Fix verification → Multiple valid approaches

```
Issue: "Date parsing is brittle"
Step F1: Search "JavaScript date library comparison 2024"
         Result: Multiple valid options (date-fns, dayjs, Temporal API)
Action: fix_confidence: MEDIUM
        fix: "Consider date-fns (lightweight) or dayjs (moment-compatible API)"
        Add note: "Choice depends on bundle size constraints and API preferences"
```

### Example 7: Fix verification → No web search available

```
Issue: "Server action doesn't handle errors"
Step F1: No web search available
Step F2: Framework-specific pattern → MEDIUM max
Action: fix_confidence: MEDIUM
        fix: "Wrap in try-catch and return { error: string } union type"
        Add note: "Verify against Next.js App Router error handling docs"
```

---

## Integration Notes

This skill is preloaded into PR review subagents. It does NOT change:
- Your output format (still JSON array per `pr-review-output-contract`)
- Your role (still read-only reviewer)
- Your scope (still your specific domain)

**Web search tool:** Use `mcp__exa__web_search_exa` (Exa) when available; fall back to other search tools otherwise. If no web search tool is available at all, cap all confidence at MEDIUM and flag to the orchestrator.

---

## Why This Matters

**Verified findings build trust:**
- Web-confirmed issues can be HIGH confidence
- Developers trust the review system more

**Verified fixes are actionable:**
- Cited sources let developers verify recommendations
- Current best practices avoid outdated advice
- Official docs > training data assumptions

**Unverified over-confidence causes harm:**
- Wastes time investigating non-issues
- Erodes trust when findings are wrong
- Real issues get dismissed with false positives
- Outdated fix recommendations create new problems

**Calibrated confidence is actionable:**
- HIGH = "definitely fix this"
- MEDIUM = "likely an issue, worth checking"
- LOW = "flagging for awareness, verify before acting"

**Calibrated fix_confidence guides effort:**
- HIGH = "apply this fix as-is"
- MEDIUM = "directionally correct, may need adjustment"
- LOW = "starting point, verify approach before implementing"
