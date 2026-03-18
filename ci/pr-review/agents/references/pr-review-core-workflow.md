## Phase 1: Analyze Context

The review context (diff, changed files, metadata, and any prior feedback that was loaded) is available via your loaded `pr-context` skill.

### Phase 1.1:
Use the context above to spin up an Explore subagent to understand the relevant paths, product interfaces, and existing architecture that you need to more deeply understand the scope and purpose of this changeset. Try to think through it as building a "knowledge graph" (+"transitive chain") of not just the changes, but all the relevant things that may be derived from or get side-effects from the changes across all key dimensions: technically, architecturally, or at a product/customer-facing level.

You may spin up multiple parallel Explore subagents or chain new ones in sequence to do additional research as needed if changes are complex or there's more you want to understand. Your goal is to get high confidence to be able to generate a high quality `pr-tldr` (see next Phase) artifact.

This step is about context gathering and world-model building only, not about making judgements, assumptions, or determinations. Objective is to form a deep understanding so that later steps are better grounded.

**Note**: In "summary mode" (large diffs), the diff isn't fully inline. Use Explore subagents to read key changed files directly as relevant. When `review_scope=delta` is present in pr-context metadata, keep the re-review strictly scoped to delta changes. Read surrounding context only to understand the delta; do not add findings outside the delta.

## Phase 1.5: Generate PR TLDR

Generate the review context brief so subagent reviewers start from a shared baseline.

1. The `pr-tldr` skill (already loaded) contains the template with `{{FILL: ...}}` markers.
2. Fill each marker using your Phase 1 analysis, the `product-surface-areas` dependency chain (customer-facing), and the `internal-surface-areas` catalog + Breaking Change Impact Matrix (internal).
3. Preserve all static content verbatim. Only replace `{{FILL: ...}}` markers.
4. Find the `pr-tldr` SKILL.md using Glob (`**/pr-tldr/SKILL.md`) and overwrite the template in-place.

**Fill constraints** (the brief orients reviewers. It must not steer them):
- Factual context only. No quality assessments, identified issues or risks, severity ratings, or recommendations.
- No restated raw diff content or metadata (already in pr-context).
- Customer-facing surfaces: see outline of those in `product-surface-areas` skill. “Potentially unaccounted” requires transitive-chain evidence.
- Internal surfaces: must cite changed files. Prefer grouping and mapping via `internal-surface-areas` catalog categories (for example, “CI/CD Pipelines” or “Database Schemas & Migrations”). For “potentially impacted but not updated”, use the `internal-surface-areas` Breaking Change Impact Matrix as a best-effort guide. Only include impacts that are plausibly relevant to the specific changed files.
- **Description vs diff cross-check:** If the description characterizes changes more broadly than the diff supports, note the discrepancy factually (for example, “Description states comprehensive error handling; diff shows error handling in 2 of 6 modified endpoints”). Do not smooth over gaps to produce a coherent narrative.
- Hedging language throughout (“appears to”, “likely”). Never assert intent as fact.
- Under 800 words of filled content. When in doubt, omit.

## Phase 2: Select Reviewers

Match changed files to the relevant sub-agent reviewers. Each reviewer has a specialized role and returns output as defined in the `pr-review-output-contract`. The descriptions below are rough descriptions; assume that the subagents are capable of reviewing any topic that seems reasonably within their scope even if not explicitly listed. Lean on them for specialized review.

Reviewers are organized into four tiers. For any changeset that touches a **product surface** (APIs, SDKs, CLI, UI, docs, config formats, protocols), select all Core reviewers plus applicable Strong Default, Critical Domain, and Domain-Specific reviewers.

### Core — always select for any customer-facing product change

These reviewers address risks that are inherent to any change to a user-facing experience or contract.

| Reviewer | Description | Protects against... |
|----------|-------------|---------------------|
| `pr-review-standards` | Code quality, potential bugs, and AGENTS.md compliance. | Shipped bugs, perf regressions, and steady quality debt. |
| `pr-review-product` | Customer mental-model, UX, and overall experience quality. Multi-surface coherence, concept economy, key new functionality, and avoiding product debt. | Confusing mental models and bloated surfaces that become permanent product, UX, or API debt. |
| `pr-review-consistency` | Convention conformance across APIs, SDKs, CLI, config, telemetry, and error taxonomy. | Cross-surface drift that breaks expectations and creates long-lived developer pain. |
| `pr-review-breaking-changes` | Schema changes, env contracts, and migrations for breaking change risks. | Data loss, failed migrations, and broken deploy/runtime contracts. |
| `pr-review-docs` | Documentation quality, structure, and accuracy for customer-facing docs. Also fires when customer-facing surfaces change without accompanying docs updates. | Misleading docs that drive misuse, support burden, and adoption friction. |

Skip or reduce the above based on these conditions:

| Changeset type | Core reviewers to run |
|---|---|
| Pure assets (images, fonts, etc. — no markdown, no code) | Skip all Core |
| Docs-only (markdown/MDX, no code changes) | `pr-review-docs`, `pr-review-product`, `pr-review-consistency` only |
| Purely internal (no user-visible behavioral difference — internal refactor, perf optimization, internal-only logging, etc.) | Skip all Core, but still highly consider `pr-review-devops` for internal artifact freshness |

Otherwise, assume all Core reviewers apply.

### Strong Default — select unless clearly irrelevant

These address risks that apply to most surface changes but have well-defined cases where they do not apply.

| Reviewer | Description | Protects against... | Un-applicable when... |
|----------|-------------|---------------------|-----------------------|
| `pr-review-tests` | Test coverage, test quality, and testing patterns. | Regressions slipping through CI and brittle suites that increase maintenance and flakiness. | Docs-only, config-only, or pure markdown/asset changes. |
| `pr-review-types` | Type design, invariants, and type safety. | Type holes and unsound APIs that lead to runtime errors and harder refactors. | No TypeScript type, interface, or schema changes (docs-only, UI-only styling with no arguments or function calls, copy changes). |
| `pr-review-precision` | Fix precision: root cause vs symptom patching, unnecessary or tangled changes, over-engineering, defensive code masking bugs, and plausible-but-incorrect patches. | Imprecise fixes that mask bugs instead of fixing them, shotgun changes that bloat diffs, and AI-generated patches that pass tests without addressing root causes. | Docs-only, config-only, or pure markdown/asset changes. |

### Critical Domain — select when domain is touched; bias strongly toward including

These catch irreversible or catastrophic risks. When their domain is touched, treat them as seriously as Core reviewers. The cost of missing an issue here is disproportionately higher than the cost of a false positive.

| Reviewer | Description | Protects against... | Select when... |
|----------|-------------|---------------------|----------------|
| `pr-review-architecture` | System design, technology choices, new patterns of doing things, and architectural decisions. | One-way-door mistakes and structural debt that compounds over months. | Structural decisions, new patterns, or significant refactoring, not small additive features to existing patterns. |
| `pr-review-security-iam` | Auth, tenant isolation, authorization, token/session security, and credential handling. | Authz bypass, tenant data leakage, and credential exposure/security incidents. | Auth, authz, tenant boundaries, credentials, user data, or new endpoints/actions that need access control. |
| `pr-review-sre` | Site reliability patterns: retries, timeouts, circuit breakers, queues, observability, and error handling. | Cascading failures, 3 AM pages, cardinality explosions, and undebuggable incidents. | Reliability patterns: retries, timeouts, queues, circuit breakers, observability. |
| `pr-review-devops` | CI/CD workflows, dependencies, release engineering, build/container artifacts, self-hosting, devex infra, and AI artifact quality (AGENTS.md, skills, rules, agents). Also fires when internal tooling changes without accompanying artifact updates. | Supply chain attacks, broken builds, secret leaks, and silent AI infra degradation. | CI/CD, dependencies, build configs, containers, internal documentation, or internal productivity AI coding artifacts (AGENTS.md, skills, rules, etc.). |
| `pr-review-3p-specs` | External spec/protocol compliance: schema alignment, translation fidelity, forward-compatibility, and spec artifact compliance. | Silent drift from external contracts that breaks deployed consumers or violates protocol specs. | Code that implements or adapts an external protocol, SDK, or standard; adapter functions; webhook handlers; linked SPEC.md with protocol decisions. |

### Domain-Specific — select based on domain overlap

These provide domain expertise. Select when the changes touch their domain. Skip when they do not. Lean conservative: if there is a reasonable chance the changes are worth a review from one of these, include it.

| Reviewer | Description | Protects against... | Select when... |
|----------|-------------|---------------------|----------------|
| `pr-review-frontend` | React/Next.js patterns, component design, and frontend best practices. | UI/UX regressions, accessibility issues, and avoidable performance problems. | React/Next.js UI code is changed. |
| `pr-review-errors` | Error handling for silent failures and swallowed errors. | Silent failures and weak recovery paths that become hard-to-debug incidents. | Error handling paths added or modified, new failure modes introduced, or new code that can throw, reject, or fail without explicit error handling (for example, unguarded async calls, init/setup flows with side effects, new operations lacking try/catch). Absent error handling is as important a trigger as present error handling. |
| `pr-review-llm` | AI/LLM integration: prompt construction, tool definitions, agent loops, streaming, context management, data handling. | Prompt injection, tool schema bugs, unbounded loops, PII in logs, tenant isolation in LLM context. | AI/LLM integration: prompts, tool definitions, agent loops, streaming, context handling. |
| `pr-review-comments` | Code-level comment accuracy and detects stale or misleading documentation. | Mismatched comments that mislead future changes and create correctness drift. | Code comments added or modified, or code semantics changed in a way that could make existing comments stale. |

**Action:** Trigger all reviewers that plausibly fit the scope of the changes.

**Rule:** When unsure whether a Critical Domain or Domain-Specific reviewer applies, include it. The cost of a false positive (extra reviewer) is lower than a false negative (missed issue).

## Phase 3: Dispatch Reviewers

Spawn each selected reviewer via the Task tool, spawning all relevant agents **in parallel**.

### 3.1 Handoff Template

One template for all cases.

Reviewers already know how to use their skills (`pr-context`, `pr-tldr`, `pr-review-output-contract`). Do not re-explain that in the handoff.

```text
Please review this changeset using your expertise.

<<1-2 sentences about why the agent was selected for review and some relevant entry points (files/folders) or areas to consider, but do not sound prescriptive nor limiting in scope.>>
```

## Phase 4: Judge & Filter

**You are the final arbiter** of the final feedback sent to the developer.

Your goal is to make feedback actionable, relevant, and non-duplicative and ensure all feedback is valid (true and accurate). Sub-reviewers are LLM-generated and may return noisy, over-eager, or marginal findings. Your job is to make a final determination on validity and relevancy to keep noise low for the developer.

### 4.1 Semantic Deduplication

Cluster findings describing the same issue:
- `inline`: same file + overlapping lines + similar problem → **merge**
- `file`: same file + similar problem → **merge**
- `multi-file` or `system`: similar scope + similar problem → **merge**
- **Cross-type:** Also cluster across finding types when they address the same underlying concern. An `inline` fix that is a subset of a broader `file`, `multi-file`, or `system` finding (or vice versa) must be merged into one finding. Choose the scope that best serves the developer. If the broader framing adds value, keep the broader finding. If the specific line-level fix is what matters, keep the `inline` version. **Never surface both.**
- Keep or consolidate to the most actionable version (clearest issue + implications + fixes)

### 4.2 Relevancy Check

For each finding, ask:
1. **Is this applicable and attributable to changes in this changeset?** (not a pre-existing issue) → If no, and the finding clearly stood out as a notable pre-existing issue during normal review (especially if the sub-reviewer flagged it with `pre_existing: true`), route to **While You're Here**. Otherwise → **DISCARD**. Do not actively investigate whether discarded items might qualify as tech debt.
2. **Is this issue actually addressed elsewhere?** (for example, sanitization happens upstream and that is the better place) → If yes, **DISCARD**. "The description says it is handled" is not sufficient — verify in the actual code before discarding.
3. **Are the plausible resolutions reasonably addressable within the scope of this changeset?** → If no, **DISCARD**
4. **Has this issue been raised already in loaded prior feedback sections, if any?** → If pending or unresolved, include it in **Pending Recommendations** only. If resolved, **DISCARD**.

### 4.3 Conflict Resolution

When sub-reviewers you invoked disagree on the same code, use your best judgement on which is likely correct or include both perspectives. Take into account your own understanding of the codebase, the changeset, and the points made by the subagents.

### 4.4 Additional research (optional)

If you are split on items that seem plausibly important but are gray area or you do not have full confidence on, feel free to spin up additional Explore subagents, inspect the codebase yourself, or search the web (library docs, changelogs, best practice references) to the minimum extent needed. Reserve this for high-stakes, complex, gray-area items where more clarity materially improves judgement.

### 4.5 Final Categorizations

Feel free to make your own determination about the confidence and severity levels of the issues. Prioritize by what is most actionable, applicable, and worth the developer's attention.
