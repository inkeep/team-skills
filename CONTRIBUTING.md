# Contributing to Inkeep Team Skills

This guide covers how to contribute to the skills in this repo while also using them day-to-day.

There are two setup paths depending on where you're starting from:

- **[Fresh Contributor Setup](#fresh-contributor-setup)** — you don't have the marketplace installed yet
- **[Moving from Consumer to Contributor](#moving-from-consumer-to-contributor)** — you already installed via the README and want to start developing

## Architecture Overview

This repo is a **Claude Code plugin marketplace** — a git repo with a `.claude-plugin/marketplace.json` that lists plugins (`eng`, `gtm`, `shared`). Each plugin contains skills, invoked as `/skill-name` in Claude Code.

When installed as a marketplace, Claude Code:
1. Clones the repo into `~/.claude/plugins/marketplaces/inkeep-team-skills/`
2. Copies plugins into a versioned cache at `~/.claude/plugins/cache/inkeep-team-skills/<plugin>/<version>/`
3. Loads skills from the cache (not the marketplace directory) at session startup

This cache layer matters: **editing files in the marketplace directory does NOT immediately affect your running session.** Claude Code reads from the cache.

## Fresh Contributor Setup

```bash
# 1. Clone the repo
git clone https://github.com/inkeep/team-skills.git ~/team-skills

# 2. Add as a local marketplace
claude plugin marketplace add ~/team-skills

# 3. Install your team's plugin
claude plugin install eng@inkeep-team-skills
```

Auto-update is disabled by default for local-path marketplaces, which is what you want — your local changes won't be overwritten by a `git pull` at startup.

## Moving from Consumer to Contributor

If you already have the marketplace installed (consumer setup from the README), follow these steps to transition:

```bash
# 1. Clone the repo to your preferred development location
git clone https://github.com/inkeep/team-skills.git ~/team-skills

# 2. Remove the git-sourced marketplace
claude plugin marketplace remove inkeep-team-skills

# 3. Re-add from your local clone
claude plugin marketplace add ~/team-skills

# 4. Re-install your team's plugin
claude plugin install eng@inkeep-team-skills
```

After this, Claude Code reads skills from `~/team-skills` (via the plugin cache). The git-sourced auto-update is replaced by a local-path marketplace that you control.

## Development Workflow

### Making Changes

1. **Edit skills** in your local clone (`~/team-skills/plugins/<team>/skills/<skill-name>/`)
2. **Restart Claude Code** to pick up changes (the plugin cache refreshes on startup)
3. **Test** by invoking the skill (e.g., `/research test topic`)
4. **Iterate** — edit, restart, test

### Getting Teammates' Changes

Since auto-update is disabled for local-path marketplaces, pull manually:

```bash
cd ~/team-skills && git pull
```

Then restart Claude Code to load the updated skills.

**Tip:** Create a shell alias to streamline this:

```bash
# Add to ~/.zshrc
alias claude-fresh='(cd ~/team-skills && git pull) && claude'
```

### Pushing Your Changes

Standard git workflow:

```bash
cd ~/team-skills
git checkout -b feat/improve-research-skill
# ... make changes ...
git add -A && git commit -m "Improve research skill scoping protocol"
git push origin feat/improve-research-skill
# Open a PR on GitHub
```

After your PR is merged, consumers with auto-update receive the changes on their next Claude Code session. Contributors with local clones need to `git pull`.

### Pushing Secrets to 1Password

To create/update 1Password items for skill secrets (one item per skill, as defined in `secrets/secrets.json`):

```bash
~/.claude/plugins/marketplaces/inkeep-team-skills/secrets/push.sh --account inkeep.1password.com
```

### Version Bumping

Plugin versions are tracked in two places:
- `.claude-plugin/marketplace.json` — the `version` field for each plugin
- `plugins/<team>/.claude-plugin/plugin.json` — the `version` field

Bump versions when shipping meaningful changes. The repo uses a `[version-bump]` commit convention for automated bumps.

## Directory Structure

```
team-skills/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace manifest (lists plugins)
├── plugins/
│   ├── eng/                   # Engineering team plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json   # Plugin manifest
│   │   └── skills/
│   │       ├── ship/         # /ship skill
│   │       ├── research/     # /research skill
│   │       ├── implement/    # /implement skill
│   │       └── ...
│   ├── gtm/                   # GTM team plugin
│   │   └── ...
│   └── shared/                # Cross-team skills
│       └── ...
├── README.md
└── CONTRIBUTING.md            # This file
```

Each skill follows the [Agent Skills](https://agentskills.io) structure:

```
skill-name/
├── SKILL.md              # Main skill file (frontmatter + workflow)
├── references/           # Deep-dive docs loaded on demand via "Load:" directives
├── scripts/              # Executable utilities
└── templates/            # Reusable output templates
```

## Troubleshooting

**Skills not updating after edits:**
The plugin cache may be stale. Delete the cache and restart:
```bash
rm -rf ~/.claude/plugins/cache/inkeep-team-skills/
# Then restart Claude Code
```

**Marketplace not found after re-adding:**
Check `~/.claude/plugins/known_marketplaces.json` — verify `installLocation` points to your local clone path.

**Merge conflicts when pulling:**
Standard git conflict resolution. Stash your WIP, pull, then reapply:
```bash
cd ~/team-skills
git stash
git pull
git stash pop
```

---

## Appendix

### Why Not `--plugin-dir`?

Claude Code has a `--plugin-dir` flag intended for plugin development. We tested it and found limitations that make it unsuitable for this workflow:

- Skills loaded via `--plugin-dir` are **not listed** in the system prompt's skill block (no `/` autocomplete)
- When `--plugin-dir` uses the **same plugin name** as an installed marketplace plugin, the **marketplace version wins** and the `--plugin-dir` version is silently dropped
- Skill invocation from `--plugin-dir` plugins is **unreliable** via the Skill tool

The local-path marketplace approach avoids all of these issues.

### Future Considerations

Things that may change this workflow — watch for updates in [Claude Code releases](https://github.com/anthropics/claude-code/releases) and [issues](https://github.com/anthropics/claude-code/issues).

**`--plugin-dir` shadowing fix:**
If Claude Code fixes `--plugin-dir` to properly shadow marketplace plugins of the same name, the two-copy model becomes viable: keep a remote marketplace for consuming (with auto-update) and use `--plugin-dir` for development. This would eliminate the need for manual `git pull`.

**Plugin cache staleness:**
Multiple open issues ([#17361](https://github.com/anthropics/claude-code/issues/17361), [#14061](https://github.com/anthropics/claude-code/issues/14061), [#15642](https://github.com/anthropics/claude-code/issues/15642)) report that the plugin cache doesn't invalidate after updates. If fixed, both auto-update and local changes would take effect more reliably without needing to manually clear the cache.

**Hot reload for local plugins:**
[Issue #13782](https://github.com/anthropics/claude-code/issues/13782) requests reloading local plugins on startup without a full restart. This would significantly improve the edit-test cycle for skill development.

**Official plugin dev mode:**
If Claude Code ships a dedicated `--dev` or `--link` mode for plugins (similar to `npm link`), it would likely be the canonical development workflow and replace the local-path marketplace approach described here.

**Local marketplace auto-update:**
Currently, local-path marketplaces have auto-update disabled by default. If Claude Code adds reliable auto-update for local-path marketplaces (running `git pull` safely with conflict detection), the contributor workflow becomes identical to the consumer workflow.
