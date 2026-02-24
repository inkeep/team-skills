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

# 3. TypeScript LSP companion plugin
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install typescript-lsp@claude-plugins-official
```

## E2E Feature Development Skills

From Claude Code, run:

```bash
\ship <feature description, bug, or improvement>
```

| Skill | Purpose |
|---|---|
| `/ship` | End-to-end orchestrator: takes you from spec through merge-ready PR. |

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

## General Purpose Skills

These are generally useful skills for investigating things and aiding in **decision making**.

| Skill | Purpose |
|---|---|
| `/research` | Deep technical research across web + OSS code bases |
| `/explore` | Build deep understanding of a codebase area or system topic. Three lenses: surface mapping (what product/internal surfaces does this touch?), pattern inspection (what conventions exist here?), system tracing (what does this connect to and what breaks?). |
| `/analyze` | Deeply compare pros and cons of a given decision. |
| `/debug` | Systematic root cause investigation for code defects. Loaded by other skills (qa, implement, ship) when they hit failures. |

### Other

| Skill | Purpose |
|---|---|
| `/write-skill` | Author or update Claude Code skills (SKILL.md + supporting files) |
| `/write-agent` | Design Claude Code agents and agent prompts (.claude/agents/*.md) |
| `/tdd` | Background knowledge for behavior-focused testing (auto-loaded by spec, ship, and implement) |

### Browser Automation

| Skill | Purpose |
|---|---|
| `/browser` | Playwright automation — write and run scripts for testing, screenshots, form filling, accessibility audits, network inspection. Works in CI/Docker. |

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
echo -e "tmp\nspecs" >> .gitignore
```

**That's it.** 

## Execution contexts

Skills work across two execution environments. `/ship` detects the context in Phase 0 and sets the context for the run.

| Context | What's available | What degrades |
|---|---|---|
| **Git worktree** | Same as host, isolated directory | Nothing (full capability) |
| **Docker container** | Git, filesystem — but no gh CLI, no browser, no macOS tools | PR creation/review skipped, browser testing substituted with Bash |

## Directory paths config (Optional)

**Optional directory overrides** (set only if you want non-default locations):

| Variable | Default | What it controls |
|---|---|---|
| `CLAUDE_REPORTS_DIR` | `<repo>/reports/` or `~/reports/` | Where `/research` stores reports and evidence |
| `CLAUDE_SHIP_DIR` | `tmp/ship` | Where `/ship` and `/implement` store workflow state |
| `CLAUDE_SPECS_DIR` | `<repo>/specs/` or `~/.claude/specs/` | Where `/spec` stores spec artifacts |

## Optional: Browser automation

Needed for `/browser`, `/qa`, and any skill that launches a browser.

```bash
# Playwright + Chromium
npm run setup --prefix ~/.claude/plugins/marketplaces/inkeep-team-skills/plugins/eng/skills/browser
```

**Local browser mode** — lets the agent use your Chrome with your logged-in sessions, cookies, and extensions instead of a fresh Chromium instance. Install the [Playwright MCP Bridge](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm) extension, then reload any Chrome tab. No env vars needed.

```bash
open "https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm"
```

## Optional: Screengrabs secrets (1Password)

Only needed if you use media upload helpers (`uploadToBunnyStorage()`, `uploadToBunny()`, `uploadToVimeo()`). All other skills work without any env vars.

```bash
# Per-project dep for capture + annotation
pnpm add -Dw sharp tsx

# Pull credentials from 1Password
# Requires: 1Password app → Settings → Developer → "Integrate with 1Password CLI"
brew install 1password-cli  # skip if already installed
~/.claude/plugins/marketplaces/inkeep-team-skills/secrets/setup.sh --account inkeep.1password.com
```

The script reads `secrets/secrets.json` to discover which 1Password items to pull, then merges the env vars into `~/.claude/settings.json` without overwriting your other settings.

**Usage:**

```bash
./secrets/setup.sh                              # pull all skills' secrets
./secrets/setup.sh --skill screengrabs           # pull just screengrabs secrets
./secrets/setup.sh --list                        # show available skills and their vars
./secrets/setup.sh --skill screengrabs --dry-run # preview without writing
```

**Current skills and their env vars** (defined in `secrets/secrets.json`):

| Skill | 1Password Item | Env vars |
|---|---|---|
| `screengrabs` | Screengrabs | `BUNNY_STORAGE_API_KEY`, `BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_HOSTNAME`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`, `VIMEO_CLIENT_ID`, `VIMEO_CLIENT_SECRET`, `VIMEO_ACCESS_TOKEN` |

<details>
<summary>Don't have 1Password?</summary>

Manually add empty placeholders and fill in values from the service dashboards ([Bunny Storage](https://dash.bunny.net/storage), [Bunny Stream](https://dash.bunny.net/stream), [Vimeo developer apps](https://developer.vimeo.com/apps)):

```bash
node -e "const fs=require('fs'),p=require('path').join(require('os').homedir(),'.claude','settings.json');const s=fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{};const add={BUNNY_STORAGE_API_KEY:'',BUNNY_STORAGE_ZONE_NAME:'',BUNNY_STORAGE_HOSTNAME:'',BUNNY_STREAM_API_KEY:'',BUNNY_STREAM_LIBRARY_ID:'',VIMEO_CLIENT_ID:'',VIMEO_CLIENT_SECRET:'',VIMEO_ACCESS_TOKEN:''};s.env=Object.assign(add,s.env||{});fs.writeFileSync(p,JSON.stringify(s,null,2)+'\n');console.log('Env placeholders added to '+p+' — fill in your values.')"
```

</details>

