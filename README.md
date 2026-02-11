# Inkeep Team Skills

Shared [Agent Skills](https://agentskills.io) and Claude Code plugin for the Inkeep team.

## Install

### Claude Code / Cursor / other agents (via skills CLI)

```bash
npx skills add inkeep/team-skills -y
```

To install a specific skill only:

```bash
npx skills add inkeep/team-skills --skill research
npx skills add inkeep/team-skills --skill write-skill
```

### Cowork / Claude Code plugin

```bash
claude --plugin-dir /path/to/team-skills
```

Or add to a project marketplace for team-wide access.

## Update

```bash
npx skills check    # see what's stale
npx skills update   # reinstall from latest
```

## Skills

| Skill | Description |
|-------|-------------|
| `research` | Evidence-driven technical research with formal reports, direct answers, or report updates |
| `write-skill` | Create or revise Claude Code-compatible Agent Skills (SKILL.md + references/scripts/assets) |

## Post-install (research only)

The `research` skill includes a catalogue generator script. If you want to use it:

```bash
cd ~/.claude/skills/research/scripts
bun install
```

## Supported Agents

These skills work with any agent that supports the [Agent Skills](https://agentskills.io) standard, including Claude Code, Cursor, Cline, Codex, and others.
