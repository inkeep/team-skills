# Inkeep Engineering Skills

Plugin for the Inkeep engineering team. Includes all [shared skills](../shared/) plus eng-specific ones.

## Install

Two install methods. Choose based on your setup:

| | Claude Code Plugin (recommended) | Skills CLI |
|---|---|---|
| **Auto-update** | Yes — skills update every session | No — manual `npx skills update` |
| **For...** | Claude Code only | Claude Code, Cursor, Cline, Codex, etc. |
| **Best for** | Claude Code-only users who want zero-maintenance updates | Multi-agent users (e.g., Cursor + Claude Code) |

### Option A: Claude Code Plugin (recommended)

Auto-updates on every session. Skills stay current without manual intervention.

```bash
# Add the marketplace with auto-update (one-time)
claude plugin marketplace add https://github.com/inkeep/team-skills.git && node -e "const f=require('os').homedir()+'/.claude/plugins/known_marketplaces.json',d=require(f);d['inkeep-team-skills'].autoUpdate=true;require('fs').writeFileSync(f,JSON.stringify(d,null,2));console.log('Auto-update enabled for inkeep-team-skills')"

# Install the eng plugin
claude plugin install eng@inkeep-team-skills
```

### Option B: Skills CLI (any agent)

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

Skills are on-demand procedural knowledge that Claude loads when relevant. 

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

Each can be used **standalone** as well:

### General Purpose

These are generally useful skills for investigating things and aiding in **decision making**.

| Skill | Invocation | Purpose |
|---|---|---|
| `/research` | User or model | Deep technical research across web + OSS code bases |
| `/discover` | User or model | Understand all the product knobs and code paths that XYZ feature touches. |
| `/inspect` | User or model | Similar to discover but focused on codebase inspection. |
| `/analyze` | User or model | Deeply compare pros and cons of a given decision. |

### Standalone / supporting

| Skill | Invocation | Purpose |
|---|---|---|
| `/write-skill` | User or model | Author or update Claude Code skills (SKILL.md + supporting files) |
| `/write-agent` | User or model | Design Claude Code agents and agent prompts (.claude/agents/*.md) |
| `/tdd` | Model-only | Background knowledge for behavior-focused testing (auto-loaded; key principles distilled inline in spec, ship, and implement) |

**Shared:** `research`, `write-skill`, `write-agent`

Add eng-only skills by creating a folder in `plugins/eng/skills/`.

---

## How the skills relate

`/ship` is the top-level orchestrator.

Flow it goes in:

```
/ship
 ├── Phase 0: Detect context (capabilities, execution environment)
 ├── Phase 1: /spec ─── spec authoring, validation, and state activation (collaborative)
 │
 ├── ─── AUTOMATION STARTS ───
 │
 ├── Phase 2: /inspect + /implement (codebase understanding, implementation)
 ├── Create draft PR (stub body)
 ├── Phase 3: /qa-test (manual QA verification)
 ├── Write PR body (/pull-request)
 ├── Phase 4: /docs (product + internal documentation surface areas)
 ├── Phase 5: /review (PR feedback loop + CI/CD resolution)
 └── Phase 6: Completion
```

---

## Gitignore requirement

`/ship` and `/implement` write execution state to `tmp/ship/` in the working directory (loop control, workflow state, spec.json, progress.txt, implementation prompt). These are transient files — not part of the deliverable. Add `tmp/` to your repo's `.gitignore`:

```
# Ship/Implement execution state
tmp/
```

---

## Execution contexts

Skills work across two execution environments. `/ship` detects the context in Phase 0 and sets the context for the run.

| Context | What's available | What degrades |
|---|---|---|
| **Git worktree** | Same as host, isolated directory | Nothing (full capability) |
| **Docker container** | Git, filesystem — but no gh CLI, no browser, no macOS tools | PR creation/review skipped, browser testing substituted with Bash |

---

## Recommended companion plugins

These plugins from `claude-plugins-official` complement the eng skills. Install them once — they auto-update with the marketplace.

### TypeScript LSP

Gives Claude Code go-to-definition, find-references, and type-error checking for TypeScript/JavaScript files. Significantly improves code navigation and catch-before-run error detection.

**Prerequisites:**

```bash
npm install -g typescript-language-server typescript
```

**Install:**

```bash
claude plugin install typescript-lsp@claude-plugins-official
```

---

## Recommended: Claude in Chrome setup

Browser automation tools (`mcp__claude-in-chrome__*`) let Claude Code interact with Chrome — navigate pages, fill forms, read content, execute JS, record GIFs, and more.

### 1. Install the extension

Install **"Claude"** by Anthropic from the [Chrome Web Store](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn). Supported browsers: Chrome and Edge only.

Sign into the extension with the **same claude.ai account** your Claude Code CLI uses. (Check your CLI account with `claude config get oauthAccount` — the `emailAddress` field must match.)

### 2. Link to Claude Code

```bash
claude /chrome
```

This installs a native messaging host so Chrome can communicate with Claude Code. **Restart Chrome after first-time setup** so it picks up the new host manifest.

To link within an existing session, type `/chrome` at the prompt.

### 3. Enable by default

So browser tools load on every session without needing `--chrome`:

```bash
claude /chrome
# Select "Enabled by default"
```

This sets `claudeInChromeDefaultEnabled: true` in `~/.claude.json`.

Alternatively, launch a single session with browser tools via `claude --chrome`.

### Troubleshooting

| Symptom | Fix |
|---|---|
| "No Chrome extension connected" | Run `/chrome` to re-link. If that fails, toggle the extension off/on at `chrome://extensions`, then retry. |
| Extension connects to Claude Desktop instead of Code | Both apps register the same extension ID. Quit the one you're not using. ([#20943](https://github.com/anthropics/claude-code/issues/20943)) |
| Connection drops mid-session | Chrome service workers go idle. Run `/chrome` and select reconnect. |
| Stale native host after CLI update | Verify `~/.claude/chrome/chrome-native-host` points to the current binary: `cat ~/.claude/chrome/chrome-native-host` |
