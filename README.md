# Inkeep Team Skills

Shared [Agent Skills](https://agentskills.io) and Claude Code plugin for the Inkeep team.

## How it works

Two skills:

| Skill | Invoke | Description |
|-------|--------|-------------|
| `research` | `/research <topic>` | Evidence-driven research with formal reports and evidence files collected from high authority web sources, **inspecting open source code repos**, docs, research articles, etc. |
| `write-skill` | `/write-skill <goal>` | Create or refine/revise Agent Skills (SKILL.md + references/scripts/assets) from existing knowledge or giving it iterative feedback. |


## Use cases:

```
                            YOU
                             |
              ┌──────────────┴──────────────┐
              |                             |
      "How does X work?"          "I need agents to be
      "How do others do Y?"        great at doing X"
              |                             |
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │  /research       │          │  /research       │
     │                  │          │                  │
     │  Prior art &     │          │  Gather the best │
     │  deep dives      │          │  human knowledge │
     └────────┬─────────┘          └────────┬─────────┘
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │  REPORT          │          │  REPORT          │
     │  ├ REPORT.md     │          │  ├ REPORT.md     │
     │  └ evidence/*.md │          │  └ evidence/*.md │
     └────────┬─────────┘          └────────┬─────────┘
              │                             │
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │  Read the report │          │  /write-skill    │
     │  or ask Claude   │          │                  │
     │  questions       │          │  Distill into a  │
     │  about it        │          │  SKILL.md agents │
     └────────┬─────────┘          │  can execute     │
              │                    └────────┬─────────┘
              ▼                             │
     ┌─────────────────┐                    ▼
     │  Want to go      │          ┌─────────────────┐
     │  deeper?         │          │  SKILL           │
     │                  │          │  ├ SKILL.md      │
     │  /research ─────┐│          │  ├ references/   │
     │  with follow-up ││          │  ├ scripts/      │
     └─────────────────┘│          │  └ templates/    │
              ▲          │          └────────┬─────────┘
              └──────────┘                  │
            report is refined               ▼
            & expanded            ┌─────────────────┐
                                  │  Use the skill   │
                                  │  in a real       │
                                  │  session         │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │  Notice a gap?   │
                                  │                  │
                                  │  /write-skill ──┐│
                                  │  with feedback  ││
                                  └─────────────────┘│
                                           ▲          │
                                           └──────────┘
                                         refine until sharp
```

**Use case 1 — Prior art research.** How does Stripe handle webhooks? How does Linear model project hierarchies? What retry strategies does our queue library actually support? `/research` digs through docs, **OSS code repos**, and articles so you get a sourced report instead of guessing or tab-hopping.

**Use case 2 — Skill generation.** Same research step, but then `/write-skill` distills the findings into a SKILL.md that agents can execute. The report is raw analytical knowledge; the skill is the operationalized workflow from that knowledge.

## Install

| Method | Command | Works in |
|--------|---------|----------|
| **Skills CLI** | `npx skills add inkeep/team-skills -y` | Claude Code, Cursor, Cline, Codex |

### Skills CLI (recommended)

```bash
npx skills add inkeep/team-skills -y
```

This will add them to your `~/.claude`, `~/.cursor`, etc. global folders.

## Update

```bash
npx skills update   # reinstall from latest
```

## Using Them

## Using `research`

Invoke by typing `/research <topic>` within Claude Code or Cursor.

### What it does

Conducts evidence-driven research and produces one of three outputs:

- **Formal report** — persistent artifact in `~/.claude/reports/<name>/` with evidence files. **Default** for non-trivial research.
- **Report update** — refinement or additions to an existing report. Triggered when you're iterating on an existing report or mention it e.g. `update X report with new research on XYZ`. Automatically figures out best way to update the report.
- **Direct answer** — findings delivered in conversation. Used when you say "just tell me" or it's a quick question.

### Report structure

Reports live in `~/.claude/reports/<name>/` with:
- `REPORT.md` — synthesized findings with executive summary, rubric, detailed sections
- `evidence/*.md` — primary-source proof files (one per dimension)
- `meta/_changelog.md` — append-only history of updates

To open the directory of reports in Cursor:
`cursor ~/.claude/reports` or simply navigate to it. 

In MacOS, while in your Home directory (e.g. `nickgomez/`, click on `cmd + shift + . ` to see hidden `.claude` folder.)

### Key behaviors

- **Checks existing reports first.** Before starting new research, it scans `~/.claude/reports/` for overlap. If prior research covers your topic, it surfaces those findings and asks whether to reuse, extend, or start fresh.
- **Scopes before researching.** It proposes a research rubric (dimensions, depth, stance) and waits for your confirmation before diving in. You can adjust scope, add/remove dimensions, or change the output format.
- **Evidence-backed.** Every finding links to an evidence file with primary sources (code snippets for OSS repos, doc quotes, research studies, etc.). Claims are labeled CONFIRMED / INFERRED / UNCERTAIN / NOT FOUND. **Auto-prioritizes by time and authority**.
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

---

## Using `write-skill`

Invoke with `/write-skill <goal>` when you want to create or modify an Agent Skill.

### What it does

Guides you through authoring a SKILL.md (+ optional references/, scripts/, templates/) that works across Claude Code, Cursor, and other agents supporting the [Agent Skills standard](https://agentskills.io).

### Key behaviors

- **Asks clarifying questions first.** Captures intent, audience, constraints, and success criteria before drafting. For ambiguous requests, it offers 2-4 targeted questions with recommended defaults.
- **Outputs the full skill.** Delivers folder tree + complete file contents. No partial stubs.
- **Use to update a skill as well!** If you give it feedback on how a skill could behave better (e.g. after trying out a real skill elsewhere), it'll procedurally update the skill in a conservative way to align it with what you describe as the correct behavior.

### Common interactions

```
# Create a new skill from scratch
/write-skill Create a skill for writing cold outbound emails called 'write-email'

# Create a new skill from a report
/write-skill Create a skill for writing cold outbound emails by looking at the 'b2b-outbound-email' report and evidence. Help me turn that knowledge into a skill 'write-email'.
```

### Skill structure it produces

```
skill-name/
├── SKILL.md              # Main skill (frontmatter + workflow)
├── references/           # Deep-dive docs loaded on demand
├── scripts/              # Executable utilities
└── templates/            # Reusable output templates
```

### Auto-improving skills

```
# Update an existing skill (preserves intent)
/write-skill The emails being produced by 'write-email' sound too abstract for the 'b2b-, help me update the skill so that the emails don't use abstract concepts. 

```

Note: after using a skill in an interactive session, you can invoke /write-skill at the end of the session and give it feedback how that session could have gone better.


