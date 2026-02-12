# Inkeep Team Skills

Shared [Agent Skills](https://agentskills.io) and Claude Code plugins for the Inkeep team.

## Structure

```
plugins/
├── shared/     ← actual skill files (source of truth)
├── eng/        ← engineering team plugin (symlinks shared + eng-only skills)
└── gtm/        ← GTM team plugin (symlinks shared + gtm-only skills)
```

Team plugins symlink to shared skills so everyone gets the common ones, but each team can add their own.

## Shared Skills

| Skill | Invoke | Description |
|-------|--------|-------------|
| `research` | `/research <topic>` | Evidence-driven research with formal reports from web sources, OSS repos, docs, articles |
| `write-skill` | `/write-skill <goal>` | Create or refine Agent Skills (SKILL.md + references/scripts/assets) |
| `write-agent` | `/write-agent <goal>` | Design and write Claude Code agents and prompts |

## Install

```bash
# Add the marketplace (one-time)
claude plugin marketplace add https://github.com/inkeep/team-skills.git

# Install your team's plugin
claude plugin install eng@inkeep-team-skills    # engineering
claude plugin install gtm@inkeep-team-skills    # GTM
```

Or install shared skills across all agents (Claude Code, Cursor, Cline, Codex):

```bash
npx skills add inkeep/team-skills -y
```

## Update

```bash
claude plugin marketplace update inkeep-team-skills
claude plugin update eng    # or gtm
```

## Usage

See [plugins/shared/](plugins/shared/) for detailed skill documentation, or just invoke them:

```bash
/research How does Temporal handle workflow versioning?
/write-skill Create a skill for writing cold outbound emails
/write-agent Create a security reviewer agent
```
