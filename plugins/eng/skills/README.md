# Engineering Skills

Skills are on-demand procedural knowledge that Claude loads when relevant. They are not always-on (that's CLAUDE.md/AGENTS.md) and not deterministic actions (that's tools/MCP). Think of them as "how an experienced engineer would approach X" — portable across repos and contexts.

---

## Skill inventory

| Skill | Invocation | Purpose |
|---|---|---|
| `/ship` | User or model | End-to-end feature development orchestrator: spec through merge-ready PR |
| `/spec` | User or model | Interactive spec authoring (PRD + technical design) |
| `/ralph` | User or model | Autonomous implementation methodology: SPEC.md to working code via iterative loop |
| `/review` | User or model | PR review iteration: poll feedback, assess, fix, resolve threads, drive CI green |
| `/inspect` | User or model | Codebase inspection — discover patterns, trace flows, map blast radius |
| `/research` | User or model | Technical research with optional persistent reports |
| `tdd` | Model-only | Background knowledge for behavior-focused testing (auto-loaded; key principles distilled inline in spec, ship, and ralph) |
| `/write-skill` | User or model | Author or update Claude Code skills (SKILL.md + supporting files) |
| `/write-agent` | User or model | Design Claude Code agents and agent prompts (.claude/agents/*.md) |

---

## How the skills relate

`/ship` is the top-level orchestrator. It composes the other skills into an end-to-end workflow:

```
/ship
 ├── Phase 0: Detect context (capabilities, execution environment)
 ├── Phase 1A: /spec ─── interactive spec authoring with the user
 ├── Phase 1B: Validate spec, /inspect the codebase, /ralph Phase 1 (convert to prd.json)
 ├── Phase 2: Environment setup (worktree or container branch)
 ├── Phase 3: /ralph Phases 2-4 (implementation via /ralph-loop or ship-managed iteration)
 ├── Phase 4: Testing (Tier 1 formal + Tier 2 QA + Tier 3 edge cases)
 ├── Phase 5: /review (PR feedback loop + CI/CD resolution)
 └── Phase 6: Completion
```

Each composed skill also works standalone — you can invoke `/spec`, `/ralph`, `/review`, `/inspect`, or `/research` independently without going through `/ship`.

---

## Execution contexts

Skills work across three execution environments. `/ship` detects the context in Phase 0 and passes capability information to composed skills. Standalone skills use sensible defaults and degrade gracefully.

| Context | What's available | What degrades |
|---|---|---|
| **Direct on host** | Everything — git, gh CLI, browser, macOS tools, ralph-loop | Nothing (full capability) |
| **Git worktree** | Same as host, isolated directory | Nothing (full capability) |
| **Docker container** | Git, filesystem — but no gh CLI, no browser, no macOS tools, possibly no ralph-loop | PR creation/review skipped, browser testing substituted with Bash, ship manages iteration if ralph-loop unavailable |

---

## When to use which skill

| You want to... | Use |
|---|---|
| Build a feature end-to-end from idea to PR | `/ship` |
| Write a spec (PRD + tech design) | `/spec` |
| Convert a spec to prd.json and implement iteratively | `/ralph` |
| Iterate on PR review feedback and get CI green | `/review` |
| Understand patterns or trace code flow before acting | `/inspect` |
| Investigate a technology, compare approaches, gather evidence | `/research` |
| Create or update a skill | `/write-skill` |
| Create or update a subagent definition | `/write-agent` |
