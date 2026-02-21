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

# 4. Local browser mode (optional — lets the agent use your Chrome with your auth/cookies)
#    Install the Playwright MCP Bridge extension:
open "https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm"
#    Then reload any Chrome tab. That's it — no env vars needed.

# 5. TypeScript LSP companion plugin
claude plugin install typescript-lsp@claude-plugins-official

# 6. Environment variables (credentials via 1Password)
#    Requires: 1Password app → Settings → Developer → "Integrate with 1Password CLI"
brew install 1password-cli  # skip if already installed
~/.claude/plugins/marketplaces/inkeep-team-skills/plugins/eng/scripts/setup-claude-env.sh --account inkeep.1password.com
```

> **Step 6 details:** The script pulls shared secrets from 1Password and merges them into `~/.claude/settings.json` without overwriting your other settings.
>
> **Prerequisites:**
> - 1Password desktop app with CLI integration: Settings → Developer → "Integrate with 1Password CLI"
> - Access to the **Shared** vault (ask your team admin)
>
> The script reads these env vars from the shared "Claude Code Secrets" item:
>
> | Variable | Purpose |
> |---|---|
> | `BUNNY_STORAGE_API_KEY` | PR screenshot uploads via `/screengrabs` |
> | `BUNNY_STORAGE_ZONE_NAME` | Storage zone name |
> | `BUNNY_STORAGE_HOSTNAME` | CDN hostname for uploaded assets |
> | `BUNNY_STREAM_API_KEY` | Video uploads via `/browser` |
> | `BUNNY_STREAM_LIBRARY_ID` | Stream library ID |
> | `VIMEO_CLIENT_ID` | Vimeo API access |
> | `VIMEO_CLIENT_SECRET` | Vimeo API secret |
> | `VIMEO_ACCESS_TOKEN` | Vimeo upload token |
>
> **Don't have 1Password?** Manually add empty placeholders and fill in values from the service dashboards ([Bunny Storage](https://dash.bunny.net/storage), [Bunny Stream](https://dash.bunny.net/stream), [Vimeo developer apps](https://developer.vimeo.com/apps)):
> ```bash
> node -e "const fs=require('fs'),p=require('path').join(require('os').homedir(),'.claude','settings.json');const s=fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{};const add={BUNNY_STORAGE_API_KEY:'',BUNNY_STORAGE_ZONE_NAME:'',BUNNY_STORAGE_HOSTNAME:'',BUNNY_STREAM_API_KEY:'',BUNNY_STREAM_LIBRARY_ID:'',VIMEO_CLIENT_ID:'',VIMEO_CLIENT_SECRET:'',VIMEO_ACCESS_TOKEN:''};s.env=Object.assign(add,s.env||{});fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');console.log('Env placeholders added to '+p+' — fill in your values.')"
> ```
>
> **Optional directory overrides** (set only if you want non-default locations):
>
> | Variable | Default | What it controls |
> |---|---|---|
> | `CLAUDE_REPORTS_DIR` | `~/.claude/reports/` | Where `/research` stores reports and evidence |
> | `CLAUDE_SHIP_DIR` | `tmp/ship` | Where `/ship` and `/implement` store workflow state |
> | `CLAUDE_SPECS_DIR` | `<repo>/specs/` or `~/.claude/specs/` | Where `/spec` stores spec artifacts |
>
> Credentials are only needed for the `/browser` skill's `uploadToBunnyStorage()`, `uploadToBunny()`, and `uploadToVimeo()` helpers. Directory overrides and all other skills work without any env vars.
>
> **Admin:** To push your current secrets to 1Password (run once), run:
> ```bash
> ~/.claude/plugins/marketplaces/inkeep-team-skills/plugins/eng/scripts/1password-push.sh --account inkeep.1password.com
> ```

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

## Per-project setup

Each repo that uses these skills needs a few things. Run once per project:

```bash
# 1. Gitignore — /ship writes workflow state to tmp/ and specs/
echo -e "tmp\nspecs" >> .gitignore

# 2. Screenshot support — /screengrabs needs these for capture + annotation
pnpm add -Dw sharp tsx
```

**That's it.** Everything else is auto-detected:

| What | How it's detected |
|---|---|
| Test / typecheck / lint commands | Read from `package.json` `scripts` field. Override with `--test-cmd`, `--typecheck-cmd`, `--lint-cmd`. |
| Package manager | `packageManager` field in `package.json` (falls back to npm) |
| GitHub CLI | `gh auth status` — if missing, PR creation/review phases are skipped |
| Browser automation | `/browser` skill availability (set up via [Quick setup](#quick-setup)) |

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
| `/qa` | 3 | Automate "manual" testing of feature (e.g. Browser automation) |
| `/pr` | After 3 | Write the PR description |
| `/docs` | 4 | Write docs for the changes |
| `/review` | 5 | Address review comments and get CI green |

Each can be used **standalone** as well.

### General Purpose

These are generally useful skills for investigating things and aiding in **decision making**.

| Skill | Invocation | Purpose |
|---|---|---|
| `/research` | User or model | Deep technical research across web + OSS code bases |
| `/explore` | User or model | Build deep understanding of a codebase area or system topic. Three lenses: surface mapping (what product/internal surfaces does this touch?), pattern inspection (what conventions exist here?), system tracing (what does this connect to and what breaks?). |
| `/analyze` | User or model | Deeply compare pros and cons of a given decision. |
| `/debug` | User or model | Systematic root cause investigation for code defects. Loaded by other skills (qa, implement, ship) when they hit failures. |

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

