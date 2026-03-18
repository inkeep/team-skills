# Inkeep GTM Skills

Plugin for the Inkeep GTM team. Includes all [shared skills](../shared/) plus GTM-specific ones.

## Prerequisites

Install these before setting up skills. You may already have some of them.

| Prerequisite | Needed for | Install |
|---|---|---|
| **Claude Code** | Everything | [Install guide](https://docs.anthropic.com/en/docs/claude-code/overview) |
| **1Password CLI** | API keys for graphics, video, slides | `brew install 1password-cli` then open 1Password desktop app → Settings → Developer → enable **"Integrate with 1Password CLI"** ([docs](https://developer.1password.com/docs/cli/get-started/)) |
| **1Password vault access** | API keys | Ask your team admin for access to the **Shared** vault |
| **Figma Desktop** | `/graphics`, `/gslides` | [Download](https://www.figma.com/downloads/) — must be the desktop app, not browser Figma |
| **gcloud CLI** | `/gslides` only | `brew install --cask google-cloud-sdk` |

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
| `/graphics` | Create on-brand visuals — blog thumbnails, social images, slide assets, diagrams, charts, illustrations, icons, or any branded graphic. |
| `/motion-video` | Create on-brand marketing videos — product demos, feature announcements, blog-to-video conversions, social video content. |
| `/gslides` | Create on-brand Google Slides presentations — sales decks, customer decks, internal updates, product overviews. |
| `/animate` | Add animations to the marketing site — scroll reveals, hero animations, entrance effects, product demos. |
| `/cold-email` | Generate cold outbound emails for B2B personas. Supports 19 archetypes. Enriches prospects via Crustdata MCP when given a LinkedIn URL. |
| `/brand` | *(background knowledge, not a command)* — Full brand identity loaded automatically by `/graphics`, `/motion-video`, `/gslides`, and `/animate`. Includes colors, typography, illustration style, composition patterns, element recipes, messaging principles, and vocabulary. |

### General purpose (shared with eng)

| Skill | Purpose |
|---|---|
| `/research` | Deep research across web + OSS codebases with formal reports and evidence files |
| `/analyze` | Deep analysis of decisions, trade-offs, and open questions |
| `/write-skill` | Author or update Agent Skills (SKILL.md + supporting files) |
| `/write-agent` | Design Claude Code agents and agent prompts (.claude/agents/*.md) |
| `/screengrabs` | Capture and embed before/after screenshots in GitHub PRs |
| `/media-upload` | Upload video and files to Bunny CDN or Vimeo |

---

## Skill secrets and MCP setup

### Media upload

`/media-upload`, `/screengrabs`, `/motion-video`, and `/qa` need media upload credentials:

```bash
brew install 1password-cli  # skip if already installed
~/.claude/plugins/marketplaces/inkeep-team-skills/secrets/setup.sh --skill media-upload --account inkeep.1password.com
```

### Motion video

`/motion-video` needs a Gemini API key (for visual verification):

```bash
./secrets/setup.sh --skill motion-video --account inkeep.1password.com
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
