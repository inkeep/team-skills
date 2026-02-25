# Inkeep GTM Skills

Plugin for the Inkeep GTM team. Includes all [shared skills](../shared/) plus GTM-specific ones.

## Quick setup

**Step 1:** Add the marketplace (one-time):

```bash
claude plugin marketplace add https://github.com/inkeep/team-skills.git && node -e "const f=require('os').homedir()+'/.claude/plugins/known_marketplaces.json',d=require(f);d['inkeep-team-skills'].autoUpdate=true;require('fs').writeFileSync(f,JSON.stringify(d,null,2));console.log('Auto-update enabled for inkeep-team-skills')"
```

**Step 2:** Install the GTM plugin:

```bash
claude plugin install gtm@inkeep-team-skills
```

<details>
<summary>Alternative: Install for Cursor or other coding agents</summary>

Works with any agent that supports [Agent Skills](https://agentskills.io) (Cursor, Cline, Codex, etc.). Note: skills do **not** auto-update — you'll need to run `npx skills update` manually to get the latest.

```bash
npx skills add inkeep/team-skills/plugins/gtm -y
```

</details>

---

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

### GTM MCP servers (Figma + Google Slides)

`/gslides` and `/graphics` require MCP servers for Figma and Google Slides. The setup script handles everything:

```bash
brew install 1password-cli  # skip if already installed
~/.claude/plugins/marketplaces/inkeep-team-skills/secrets/setup.sh --skill google-mcp --account inkeep.1password.com
```

This will:
1. Pull Google OAuth credentials from 1Password (shared vault)
2. Set up Python venv for google-slides-mcp dependencies
3. Register three MCP servers scoped to the gtm plugin (`figma`, `figma-console`, `google-slides`)
4. Prompt you to create a **Figma Personal Access Token** (opens browser to Figma settings)
5. Create an OAuth credentials JSON for gcloud ADC
6. Prompt you to run `gcloud auth` (one-time browser-based login)

**Prerequisites:**
- 1Password CLI with desktop app integration enabled
- Access to the **Shared** vault (ask your team admin)
- `gcloud` CLI: `brew install --cask google-cloud-sdk`
- Figma account (for the Personal Access Token)

**What's shared vs per-user:**

| Credential | Scope | Source |
|---|---|---|
| Google Client ID + Secret | Shared (identifies the app) | 1Password Shared vault |
| Google OAuth token | Per-user (your Google account) | `gcloud auth` browser flow |
| Figma OAuth token | Per-user (your Figma account) | Automatic on first Figma MCP use |
| Figma Personal Access Token | Per-user (your Figma account) | Figma Settings > Security (90-day expiry, re-generate when expired) |

**For `/graphics` (Figma-native design creation):**

The `/graphics` skill uses `figma-console-mcp` to create native editable Figma designs. This requires:
- **Figma Desktop app** (not browser) with the **Desktop Bridge plugin** running
- The plugin is imported from `figma-console-mcp`'s `figma-desktop-bridge/manifest.json`
- See the [figma-console-mcp README](https://github.com/southleft/figma-console-mcp) for plugin setup

---

Run `./secrets/setup.sh --list` to see all available skills and their env vars. See the [main README](../../README.md#skill-secrets-optional) for more details.
