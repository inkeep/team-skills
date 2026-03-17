# Inkeep GTM Skills

Plugin for the Inkeep GTM team. Includes all [shared skills](../shared/) plus GTM-specific ones.

## Quick setup (Claude Code)

Skills auto-update every session.

**Step 1:** Add the marketplace (one-time):

```bash
claude plugin marketplace add https://github.com/inkeep/team-skills.git && node -e "const f=require('os').homedir()+'/.claude/plugins/known_marketplaces.json',d=require(f);d['inkeep-team-skills'].autoUpdate=true;require('fs').writeFileSync(f,JSON.stringify(d,null,2));console.log('Auto-update enabled for inkeep-team-skills')"
```

**Step 2:** Install the GTM plugin:

```bash
claude plugin install gtm@inkeep-team-skills
```

## (Optional) Quick setup for Cursor

Works with any agent that supports [Agent Skills](https://agentskills.io) (Cursor, Cline, Codex, etc.). Skills do **not** auto-update.

**Step 1:** Install:

```bash
npx skills add inkeep/team-skills/plugins/gtm -y
```

**Step 2:** Update (run manually when you want the latest):

```bash
npx skills update
```

## Skill inventory

### GTM-specific

| Skill | Purpose |
|---|---|
| `/cold-email` | Generate cold outbound emails tailored to B2B personas. Supports 19 persona archetypes (Founder-CEO, CTO, VP Eng, etc.). Enriches prospects via Crustdata MCP when given a LinkedIn URL. |
| `/gslides` | Create branded Google Slides presentations using Figma brand assets and Google Slides MCP. Supports customer decks, sales presentations, internal updates, and product overviews. |
| `/graphics` | Create on-brand graphics as native editable Figma designs. Also supports SVG, D2, and Mermaid output. Uses Figma brand tokens and figma-console-mcp for native Figma object creation. |

### General Purpose

| Skill | Purpose |
|---|---|
| `/research` | Deep research across web + OSS code bases with formal reports and evidence files |
| `/analyze` | Deep analysis of decisions, trade-offs, and open questions |
| `/write-skill` | Author or update Agent Skills (SKILL.md + supporting files) |
| `/write-agent` | Design Claude Code agents and agent prompts (.claude/agents/*.md) |

**Shared:** `research`, `analyze`, `screengrabs`, `write-skill`, `write-agent`

---

## Skill secrets and MCP setup

### Screengrabs (media upload)

`/screengrabs` needs media upload credentials:

```bash
brew install 1password-cli  # skip if already installed
~/.claude/plugins/marketplaces/inkeep-team-skills/secrets/setup.sh --skill screengrabs --account inkeep.1password.com
```

### Graphics (Figma design creation)

`/graphics` needs Figma MCP servers + Quiver.ai API key:

```bash
brew install 1password-cli  # skip if already installed
./secrets/setup.sh --skill graphics --account inkeep.1password.com
```

This will:
1. Pull `QUIVERAI_API_KEY` from 1Password (shared vault)
2. Register `figma` (read-only) and `figma-console` (write) MCP servers
3. Prompt you to create a **Figma Personal Access Token** (opens browser to Figma settings)

**Prerequisites:**
- 1Password CLI with desktop app integration enabled
- Access to the **Shared** vault (ask your team admin)
- Figma account (for the Personal Access Token — per-user, 90-day expiry)

**Figma Desktop Bridge (required for native design creation):**

The `figma-console` MCP talks to Figma via a WebSocket bridge plugin. This requires manual setup — Figma has no CLI for plugin management.

*One-time — import the plugin:*
1. Open **Figma Desktop** (not browser)
2. Right-click canvas → **Plugins → Development → Import plugin from manifest...**
3. Select the manifest file. Find its path: `npx figma-console-mcp@latest --print-path`

*Each session — run the plugin:*
1. Open your target Figma file in Figma Desktop
2. Right-click canvas → **Plugins → Development → Figma Desktop Bridge**
3. Wait for the green "MCP Ready" status widget

The `/graphics` skill checks connection automatically and will guide you if the plugin isn't running.

### Google Slides (presentations)

`/gslides` needs Figma (read-only) + Google Slides MCP servers:

```bash
brew install 1password-cli  # skip if already installed
./secrets/setup.sh --skill gslides --account inkeep.1password.com
```

This will:
1. Pull Google OAuth credentials from 1Password (shared vault)
2. Set up Python venv for google-slides-mcp dependencies
3. Register `figma` (read-only) and `google-slides` MCP servers
4. Create an OAuth credentials JSON for gcloud ADC
5. Prompt you to run `gcloud auth` (one-time browser-based login)

**Prerequisites:**
- 1Password CLI with desktop app integration enabled
- Access to the **Shared** vault (ask your team admin)
- `gcloud` CLI: `brew install --cask google-cloud-sdk`

**What's shared vs per-user:**

| Credential | Scope | Source |
|---|---|---|
| Google Client ID + Secret | Shared (identifies the app) | 1Password Shared vault |
| Google OAuth token | Per-user (your Google account) | `gcloud auth` browser flow |
| Figma OAuth token | Per-user (your Figma account) | Automatic on first Figma MCP use |

---

Run `./secrets/setup.sh --list` to see all available skills and their env vars. See the [main README](../../README.md#skill-secrets-optional) for more details.
