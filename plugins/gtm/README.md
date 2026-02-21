# Inkeep GTM Skills

Plugin for the Inkeep GTM team. Includes all [shared skills](../shared/) plus GTM-specific ones.

## Quick setup

```bash
# Install the plugin (auto-updates every session)
claude plugin marketplace add https://github.com/inkeep/team-skills.git && node -e "const f=require('os').homedir()+'/.claude/plugins/known_marketplaces.json',d=require(f);d['inkeep-team-skills'].autoUpdate=true;require('fs').writeFileSync(f,JSON.stringify(d,null,2));console.log('Auto-update enabled for inkeep-team-skills')"
claude plugin install gtm@inkeep-team-skills
```

<details>
<summary>Alternative: Skills CLI (any agent, not just Claude Code)</summary>

```bash
npx skills add inkeep/team-skills/plugins/gtm -y
```

To manually update:

```bash
npx skills update
```

</details>

---

## Skill inventory

### GTM-specific

| Skill | Purpose |
|---|---|
| `/cold-email` | Generate cold outbound emails tailored to B2B personas. Supports 19 persona archetypes (Founder-CEO, CTO, VP Eng, etc.). Enriches prospects via Crustdata MCP when given a LinkedIn URL. |

### General Purpose

| Skill | Purpose |
|---|---|
| `/research` | Deep research across web + OSS code bases with formal reports and evidence files |
| `/analyze` | Deep analysis of decisions, trade-offs, and open questions |
| `/write-skill` | Author or update Agent Skills (SKILL.md + supporting files) |
| `/write-agent` | Design Claude Code agents and agent prompts (.claude/agents/*.md) |

**Shared:** `research`, `analyze`, `screengrabs`, `write-skill`, `write-agent`

---

## Skill secrets (optional)

`/screengrabs` needs media upload credentials. Pull them with:

```bash
brew install 1password-cli  # skip if already installed
~/.claude/plugins/marketplaces/inkeep-team-skills/secrets/setup.sh --skill screengrabs --account inkeep.1password.com
```

Run `./secrets/setup.sh --list` to see all available skills and their env vars. See the [main README](../../README.md#skill-secrets-optional) for more details.
