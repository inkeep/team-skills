# Inkeep Engineering Skills

Plugin for the Inkeep engineering team. Includes all [shared skills](../shared/) plus eng-specific ones.

## Install

Two install methods. Choose based on your setup:

| | Claude Code Plugin (recommended) | Skills CLI |
|---|---|---|
| **Auto-update** | Yes — skills update every session | No — manual `npx skills update` |
| **Agent support** | Claude Code only | Claude Code, Cursor, Cline, Codex, etc. |
| **Best for** | Claude Code-only users who want zero-maintenance updates | Multi-agent users (e.g., Cursor + Claude Code) |

### Option A: Claude Code Plugin (recommended)

Auto-updates on every session. Skills stay current without manual intervention.

```bash
# Add the marketplace with auto-update (one-time)
claude plugin marketplace add https://github.com/inkeep/team-skills.git && node -e "const f=require('os').homedir()+'/.claude/plugins/known_marketplaces.json',d=require(f);d['inkeep-team-skills'].autoUpdate=true;require('fs').writeFileSync(f,JSON.stringify(d,null,2));console.log('Auto-update enabled for inkeep-team-skills')"

# Install the eng plugin
claude plugin install eng@inkeep-team-skills
```

### Option B: Skills CLI (cross-agent)

Works with any agent that supports the [Agent Skills](https://agentskills.io) standard. Updates are manual.

```bash
npx skills add inkeep/team-skills/plugins/eng -y
```

To update:

```bash
npx skills update
```

---

## Skill inventory

Skills are on-demand procedural knowledge that Claude loads when relevant. They are not always-on (that's CLAUDE.md/AGENTS.md) and not deterministic actions (that's tools/MCP). Think of them as "how an experienced engineer would approach X" — portable across repos and contexts.

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
| `/analyze` | User or model | Deep, iterative, evidence-based analysis of situations, decisions, and trade-offs |

**Shared:** `research`, `write-skill`, `write-agent`

Add eng-only skills by creating a folder in `plugins/eng/skills/`.

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
| Analyze a decision, situation, or trade-off in depth | `/analyze` |
| Create or update a skill | `/write-skill` |
| Create or update a subagent definition | `/write-agent` |
