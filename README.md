# Inkeep Team Skills

Shared [Agent Skills](https://agentskills.io) and Claude Code plugin for the Inkeep team.

## Install

| Method | Command | Works in |
|--------|---------|----------|
| **Skills CLI** | `npx skills add inkeep/team-skills -y` | Claude Code, Cursor, Cline, Codex |
| **Plugin marketplace** | `/plugin marketplace add inkeep/team-skills` | Claude Code CLI |
| **Local dev** | `claude --plugin-dir /path/to/team-skills` | Claude Code CLI |

### Skills CLI (recommended)

```bash
npx skills add inkeep/team-skills -y
```

To install a specific skill only:

```bash
npx skills add inkeep/team-skills --skill research
npx skills add inkeep/team-skills --skill write-skill
```

### Claude Code plugin marketplace

```bash
/plugin marketplace add inkeep/team-skills
/plugin install inkeep-team-skills@inkeep-tools
```

## Update

```bash
npx skills check    # see what's stale
npx skills update   # reinstall from latest
```

## Skills

| Skill | Invoke | Description |
|-------|--------|-------------|
| `research` | `/research <topic>` | Evidence-driven technical research with formal reports, direct answers, or report updates |
| `write-skill` | `/write-skill <goal>` | Create or revise Claude Code-compatible Agent Skills (SKILL.md + references/scripts/assets) |

---

## Using `research`

Invoke with `/research <topic>` or let Claude auto-invoke when you ask it to investigate something.

### What it does

Conducts evidence-driven research and produces one of three outputs:

- **Formal report** — persistent artifact in `~/.claude/reports/<name>/` with evidence files. Default for non-trivial research.
- **Direct answer** — findings delivered in conversation. Use when you say "just tell me" or it's a quick question.
- **Report update** — surgical additions to an existing report. Triggered when you reference an existing report.

### Key behaviors

- **Checks existing reports first.** Before starting new research, it scans `~/.claude/reports/` for overlap. If prior research covers your topic, it surfaces those findings and asks whether to reuse, extend, or start fresh.
- **Scopes before researching.** It proposes a research rubric (dimensions, depth, stance) and waits for your confirmation before diving in. You can adjust scope, add/remove dimensions, or change the output format.
- **Evidence-backed.** Every finding links to an evidence file with primary sources (code snippets, doc quotes, URLs). Claims are labeled CONFIRMED / INFERRED / UNCERTAIN / NOT FOUND.
- **Recaps and suggests follow-ups.** After delivering findings, it summarizes key results and offers 2-4 natural next directions.

### Common interactions

```
# New research (defaults to formal report)
/research How does Temporal handle workflow versioning?

# Quick answer (no report)
/research Just tell me — does Better Auth support SCIM?

# Extend an existing report
/research Update the claude-plugins-architecture report with Cowork CLI parity findings

# Compare systems
/research Compare pg-boss vs BullMQ for job queues — focus on persistence, retry, and observability
```

### Report structure

Reports live in `~/.claude/reports/<name>/` with:
- `REPORT.md` — synthesized findings with executive summary, rubric, detailed sections
- `evidence/*.md` — primary-source proof files (one per dimension)
- `meta/_changelog.md` — append-only history of updates

---

## Using `write-skill`

Invoke with `/write-skill <goal>` when you want to create or modify an Agent Skill.

### What it does

Guides you through authoring a SKILL.md (+ optional references/, scripts/, templates/) that works across Claude Code, Cursor, and other agents supporting the [Agent Skills standard](https://agentskills.io).

### Key behaviors

- **Asks clarifying questions first.** Captures intent, audience, constraints, and success criteria before drafting. For ambiguous requests, it offers 2-4 targeted questions with recommended defaults.
- **Routes by request type.** Handles five modes: Create, Refactor, Harden, Integrate (with subagents), and Update (intent-preserving). Updates are conservative by default — it won't change meaning without asking.
- **Outputs the full skill.** Delivers folder tree + complete file contents. No partial stubs.
- **Validates structure.** Checks frontmatter, invocation posture, standalone readability, and progressive disclosure.

### Common interactions

```
# Create a new skill from scratch
/write-skill Create a skill for writing cold outbound emails

# Update an existing skill (preserves intent)
/write-skill Update the research skill — add a coherence audit step

# Refactor for size
/write-skill The pr-review skill is too large, split it into references

# Create a skill from unstructured notes
/write-skill Here are my notes on how we do code review <paste> — turn this into a skill
```

### Skill structure it produces

```
skill-name/
├── SKILL.md              # Main skill (frontmatter + workflow)
├── references/           # Deep-dive docs loaded on demand
├── scripts/              # Executable utilities
└── templates/            # Reusable output templates
```

---

## Post-install (research only)

The `research` skill includes a catalogue generator script. If you want to use it:

```bash
cd ~/.claude/skills/research/scripts
bun install
```

## Supported Agents

These skills work with any agent that supports the [Agent Skills](https://agentskills.io) standard, including Claude Code, Cursor, Cline, Codex, and others.
