## 2026-02-23

### Changes
- **SPEC.md created:** Initial draft from intake — problem statement, goals, current state analysis, open questions backlog
- **A1 confirmed:** Children are platform-agnostic (verified tool lists: Read, Grep, Glob, Bash, mcp__exa__web_search_exa only; disallowedTools: Write, Edit, Task)
- **A2 confirmed:** pr-context skill is the stable interface — all agents load via `skills: [pr-context]`

### Pending (carried forward)
- Q1-Q7: All open questions need investigation and decisions
- A3: Need to verify whether children construct GitHub URLs in their output

## 2026-02-23 (session 1, batch 2)

### Changes
- **D1 confirmed:** Shell script for pr-context generation (not orchestrator or separate agent)
- **D2 confirmed:** Markdown output (not JSON) — analyzed /ship integration pattern, found no non-LLM consumer exists
  - Evidence: `evidence/ship-review-integration.md`
- **D3 confirmed:** Shared core skill (`pr-review-core`) + two thin orchestrator shells
- **D4 confirmed:** Three-dot diff (`git diff target...HEAD`), user-configurable target branch
- **A3 confirmed → updated:** URL pattern is injected via pr-context, not hardcoded. Children have zero GitHub URL references.
  - Evidence: `evidence/coupling-analysis.md`
- **A4 created:** Assumption that skill-as-instructions pattern works for multi-phase orchestration
- **A5 created:** Assumption that /ship can extract recommendation from markdown header
- **Q1-Q4, Q6 resolved** → D1-D4
- **Q7 resolved** → D3 (same plugin dir)
- **Q8-Q11 created:** New questions cascading from D1-D4
- **SPEC.md §5 filled:** User journeys for P1 (engineer) and P2 (/ship)
- **SPEC.md §6 updated:** Requirements reflect D1-D4 decisions
- **SPEC.md §9 filled:** Full proposed solution with architecture diagram, component breakdown, invocation patterns
- **SPEC.md §14 updated:** Risks revised — D3 mitigates drift risk, A3 mitigates child dependency risk, new risks added
- **SPEC.md §15 filled:** Three documented deferrals (iterative reviews, non-GitHub CI, JSON output)

### Pending (carried forward)
- Q5: Iterative local reviews — likely deferral, needs confirmation
- Q8-Q11, A4: Still open from batch 2

## 2026-02-23 (session 1, batch 3)

### Changes
- **D5 confirmed:** Local review is /ship Phase 3 (before draft PR). Phases renumbered: Testing→4, Docs→5, Address Review→6, Completion→7.
- **D6 confirmed:** Review iteration controlled by /ship. APPROVE WITH SUGGESTIONS requires methodical evaluation of each suggestion.
- **D7 confirmed:** Rename `pr-review-*` → `review-*`. Existing `/review` skill → `/address-review`.
  - Evidence: `evidence/naming-analysis.md`
  - Blast radius: ~375 occurrences across ~30 files + ~13 in agents/ repo CI workflows
- **D8 confirmed:** Local review invoked via `claude -p` subprocess (review.sh), not Task tool. Same pattern as implement.sh.
  - Evidence: `evidence/ship-phase-sequence.md`
- **Q10 resolved → D8**
- **Q12-Q14 created:** /review skill final name, rename sequencing, CLI flag compatibility
- **SPEC.md §5 updated:** User journeys reflect /ship Phase 3 flow with subprocess pattern
- **SPEC.md §6 updated:** Requirements reflect new naming and subprocess invocation
- **SPEC.md §9 updated:** Architecture diagram, component breakdown, /ship integration all updated with new names, review.sh script, phase table
- **SPEC.md §14 updated:** Added rename blast radius risk and CLI flag compatibility risk

### Pending (carried forward)
- Q5: Iterative local reviews — confirm deferral
- Q8: Phase 1-4 extraction audit
- Q9: Output contract update for local mode
- Q11: Script language
- Q12: Final name for renamed /review skill
- Q13: Rename sequencing
- Q14: CLI flag compatibility verification (claude -p + --agent + --plugin-dir)
- A4: Skill-as-instructions pattern validation
- Phase planning not yet done

## 2026-02-23 (session 1, batch 4)

### Changes
- **D7 reversed → deferred:** User decided to keep `pr-review-*` naming to avoid cross-repo changes to `agents/` CI workflows. All naming reverted to `pr-review-*` throughout SPEC.md (architecture diagram, component breakdown, frontmatter, invocation examples, user journeys, requirements).
- **Deferral 4 created:** Full rename scope documented in §15 — includes team-skills (~375 occurrences, ~30 files), agents repo (~13 occurrences, 2 files), `/review` → `/assess-review` collision resolution.
- **Q12, Q13 deferred** → Deferral 4 (rename-related questions no longer active)
- **§14 risk updated:** Rename blast radius risk marked as deferred
- **SPEC.md §9 line 110:** Added compatibility note explaining why `pr-review-*` prefix is retained

- **Q5 resolved → Deferral 1 confirmed:** No delta scoping. Cap review iterations at 2 in /ship flow. If 2nd review still returns REQUEST_CHANGES, proceed to PR — GitHub review (Phase 6) serves as backstop.
- **SPEC.md §5, §6, §9 updated:** Iteration cap reflected in user journey, requirements, and Phase 3 flow
- **Deferral 1 updated:** Reflects iteration cap rationale

### Pending (carried forward)
- Q8: Phase 1-4 extraction audit (P0 blocker)
- Q9: Output contract update for local mode
- Q11: Script language (P2)
- Q14: CLI flag compatibility verification (P0 blocker)
- A4: Skill-as-instructions pattern validation
- Phase planning (§13) not yet done

## 2026-02-26 (session 2, batch 1)

### Changes
- **D9 confirmed:** Phase 1-4 extraction is "copy verbatim with 5 surgical edits." Audited all phases — ~15 "PR" references are cosmetic. 5 spots need actual change: terminology mapping table, review-delivery preamble, handoff template PR#, Phase 4.2 GitHub section refs, review_scope=delta conditional.
- **D10 confirmed:** Shell scripts in bash. Repo convention: orchestration → bash, validation → TS. Both scripts are orchestration. ci/pr-review/ has zero TS infrastructure.
- **D11 confirmed:** CLI flag combo (`-p` + `--plugin-dir` + `--agent`) — proceed with smoke test at implementation time. Each pairwise combo confirmed. Three-way untested but no documented incompatibilities.
- **Q8 resolved → D9**
- **Q11 resolved → D10**
- **Q14 resolved → D11**
- **Q9 enriched:** Output contract needs ~30 lines changed (reference format instructions). Two options assessed: (A) dual-format guidance in contract, (B) move concern to pr-context. Decision deferred to implementation.
- **A4 enriched → open question:** Zero precedent for procedural skill via frontmatter. Two options assessed: (A) reference file pattern (proven, LOW risk), (B) frontmatter skill (architecturally clean, MEDIUM-HIGH risk). Decision deferred to implementation.
- **SPEC.md §9 Component 3 rewritten:** Detailed extraction edits, open questions with comparison tables for A4 and Q9.
- **SPEC.md §10 updated:** Added D9, D10, D11 to decision log.

### Pending (carried forward)
- Q9: Output contract reference format — options assessed, decision needed at impl time
- A4: Shared core delivery mechanism — options assessed, decision needed at impl time
- Phase planning (§13) not yet done
