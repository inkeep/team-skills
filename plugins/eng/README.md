# Inkeep Engineering Skills

Plugin for the Inkeep engineering team. Includes all [shared skills](../shared/) plus eng-specific ones.

## Quick setup

Run this once to install the plugin, dependencies, and companion tools:

```bash
# 1. Install the plugin (auto-updates every session)
claude plugin marketplace add https://github.com/inkeep/team-skills.git && node -e "const f=require('os').homedir()+'/.claude/plugins/known_marketplaces.json',d=require(f);d['inkeep-team-skills'].autoUpdate=true;require('fs').writeFileSync(f,JSON.stringify(d,null,2));console.log('Auto-update enabled for inkeep-team-skills')"
claude plugin install eng@inkeep-team-skills

# 2. Global deps
npm install -g typescript-language-server typescript

# 3. Browser automation (Playwright + Chromium)
npm run setup --prefix ~/.claude/plugins/marketplaces/inkeep-team-skills/plugins/eng/skills/browser

# 4. TypeScript LSP companion plugin
claude plugin install typescript-lsp@claude-plugins-official
```

<details>
<summary>Alternative: Skills CLI (any agent, not just Claude Code)</summary>

```bash
npx skills add inkeep/team-skills/plugins/eng -y
```

To manually update:

```bash
npx skills update
```

</details>

---

## Skill inventory

### E2E Feature Development

From Claude Code, run:

```bash
\ship <feature description, bug, or improvement>
```

| Skill | Invocation | Purpose |
|---|---|---|
| `/ship` | User | End-to-end orchestrator: takes you from spec through merge-ready PR. |

`ship` is the entry point for **end-to-end feature development**. It works with you to `spec` out a feature by investigating the codebase and asking you questions. **Speccing is the most important part**. It takes that spec and implements it end to end, including automated testing, PR review, and more.

### Composed by /ship

Ship is an orchestrator that leverages these other skills:

| Skill | Phase | What it does |
|---|---|---|
| `/spec` | 1 | Define what to build — requirements and technical design |
| `/implement` | 2 | Write the code from the spec |
| `/qa-test` | 3 | Automate "manual" testing of feature (e.g. Browser automation) |
| `/pull-request` | After 3 | Write the PR description |
| `/docs` | 4 | Write docs for the changes |
| `/review` | 5 | Address review comments and get CI green |

Each can be used **standalone** as well.

**Gitignore requirement**:

```.gitignore
tmp
specs
```

### General Purpose

These are generally useful skills for investigating things and aiding in **decision making**.

| Skill | Invocation | Purpose |
|---|---|---|
| `/research` | User or model | Deep technical research across web + OSS code bases |
| `/discover` | User or model | Understand all the product knobs and code paths that XYZ feature touches. |
| `/inspect` | User or model | Similar to discover but focused on codebase inspection. |
| `/analyze` | User or model | Deeply compare pros and cons of a given decision. |
| `/debug` | User or model | Systematic root cause investigation for code defects. Loaded by other skills (qa-test, implement, ship) when they hit failures. |

### Browser Automation

| Skill | Invocation | Purpose |
|---|---|---|
| `/browser` | User or model | Playwright automation — write and run scripts for testing, screenshots, form filling, accessibility audits, network inspection. Works in CI/Docker. |

### Other

| Skill | Invocation | Purpose |
|---|---|---|
| `/write-skill` | User or model | Author or update Claude Code skills (SKILL.md + supporting files) |
| `/write-agent` | User or model | Design Claude Code agents and agent prompts (.claude/agents/*.md) |
| `/tdd` | Model-only | Background knowledge for behavior-focused testing (auto-loaded; key principles distilled inline in spec, ship, and implement) |

**Shared:** `research`, `write-skill`, `write-agent`

---

## Execution contexts

Skills work across two execution environments. `/ship` detects the context in Phase 0 and sets the context for the run.

| Context | What's available | What degrades |
|---|---|---|
| **Git worktree** | Same as host, isolated directory | Nothing (full capability) |
| **Docker container** | Git, filesystem — but no gh CLI, no browser, no macOS tools | PR creation/review skipped, browser testing substituted with Bash |

---

## Companion plugins

Installed via [Quick setup](#quick-setup). These auto-update with their marketplace.

| Plugin | What it does |
|---|---|
| `typescript-lsp@claude-plugins-official` | Go-to-definition, find-references, and type-error checking for TypeScript/JavaScript files. |

