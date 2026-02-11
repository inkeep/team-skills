# Inkeep Team Skills

Shared [Agent Skills](https://agentskills.io) for the Inkeep engineering team.

## Install

```bash
npx skills add inkeep/team-skills -y
```

To install a specific skill only:

```bash
npx skills add inkeep/team-skills --skill technical-research
npx skills add inkeep/team-skills --skill write-skill
```

## Update

```bash
npx skills check    # see what's stale
npx skills update   # reinstall from latest
```

## Skills

| Skill | Description |
|-------|-------------|
| `technical-research` | Evidence-driven technical research with formal reports, direct answers, or report updates |
| `write-skill` | Create or revise Claude Code-compatible Agent Skills (SKILL.md + references/scripts/assets) |

## Post-install (technical-research only)

The `technical-research` skill includes a catalogue generator script. If you want to use it:

```bash
cd ~/.claude/skills/technical-research/scripts
bun install
```

## Supported Agents

These skills work with any agent that supports the [Agent Skills](https://agentskills.io) standard, including Claude Code, Cursor, Cline, Codex, and others.
