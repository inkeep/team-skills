---
name: find-claude
description: Search, navigate, and resume Claude Code conversation histories. Find conversations by topic, PR, branch, worktree, skill used, files modified, repo, or recency. Use when asked to find a prior conversation, recall past work, resume interrupted sessions, or search chat history. Triggers on find conversation, prior conversation, previous session, resume session, where did we, what was I working on, find the chat, search history.
argument-hint: "[search query] (e.g. 'openbolt spec', 'PR #2212', 'today', '/spec skill')"
---

# Find Claude — Conversation History Search

Search and navigate Claude Code conversation histories across all projects. Two-phase: **index** for fast lookup, **grep** as fallback for deep content search.

## Step 0: Ensure the index exists

Before searching, check if the index is current:

```bash
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts
```

This runs incrementally (~1-3s for updates, ~30-60s for first full scan of ~400 sessions). Only re-scans sessions that changed since last run.

If the index has never been built, run with `--full` for the initial scan:
```bash
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts --full
```

The index lives at `~/.claude/session-index/index.json`.

## Step 1: Classify the search

Determine which search flow applies based on the user's request:

| User says | Flow | Primary fields to search |
|---|---|---|
| "find the conversation about X" | **Topic search** | `firstUserMessages`, `lastUserMessages`, `continuationSummaries` |
| "where was I on X?" / "pick up where I left off" | **Resumption** | `lastUserMessages` (prioritized), then `firstUserMessages` |
| "all conversations about X" | **Comprehensive** | All text fields + `filesModified` + `skills`, group by project |
| "what was I working on today/yesterday?" | **Recency** | Filter by `lastActiveAt` date |
| "conversations where I used /spec" | **Skill filter** | `skills` array |
| "conversations that touched schema.ts" | **File filter** | `filesModified` array |
| "conversations about PR #2212" | **PR filter** | `prs` array |
| "what was I doing on feat/auth?" | **Branch filter** | `branches` array |
| "conversations in the worktree X" | **Worktree filter** | `worktrees` array |
| "all conversations touching doltgresql repo" | **Repo filter** | `repos` array |

## Step 2: Search the index (Layer 1)

Use the `search` subcommand to query the index. It returns compact JSON with only matching sessions — no need to load the full 1MB index.

```bash
# Free-text search (scored by relevance, weighted toward lastUserMessages)
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search "figma port hook"

# Filtered searches
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --skill eng:spec "openbolt"
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --pr 2212
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --branch feat/auth
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --today
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --file manage-schema.ts
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --worktree agents-pr2212
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --repo doltgresql
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --limit 20 "auth"
```

Flags can be combined: `search --skill eng:spec --branch feat/auth "credential"` requires all conditions.

**Scoring:** Text terms are weighted: `lastUserMessages` (3x), `firstUserMessages` (2x), `continuationSummaries` (2x), structured fields like skills/files/PRs/branches (1x). Results are sorted by score then recency.

The output is JSON — read it and synthesize human-readable summaries per Step 5.

## Step 3: Semantic search (Layer 2)

If the keyword search returns few or weak matches, or the user's query is conceptual rather than keyword-based (e.g. "the conversation where we were figuring out how to handle credential refresh"), use episodic-memory for semantic vector search:

```bash
episodic-memory search "credential refresh flow for browser extensions"
```

This embeds the query using a local MiniLM model and searches against 384-dimensional vectors of every user/assistant exchange across all sessions. It finds conversations by meaning, not just keyword overlap.

**When to use semantic vs keyword search:**
- User gives exact terms ("posthog", "PR #2212", "manage-schema.ts") → keyword search (Layer 1) first
- User describes a concept or activity ("the one where we were debugging auth") → semantic search
- Keyword search returns 0 results or nothing relevant → try semantic search
- Both can be run and results merged — they're complementary

**Dependency:** Requires [episodic-memory](https://github.com/obra/episodic-memory) installed at `~/.claude/oss-repos/episodic-memory/` with `npm link`. Run `episodic-memory sync` periodically to index new sessions (runs automatically via SessionStart hook if installed as a plugin).

**First-time setup:** The initial sync embeds all sessions (~5-10 minutes). After that, incremental syncs are fast.

## Step 4: Grep fallback (Layer 3)

If both keyword and semantic search return no matches (the keyword may be buried in the middle of a conversation, not captured in bookends, summaries, or embedding text):

```bash
grep -rl "KEYWORD" ~/.claude/projects/*/*.jsonl
```

For each hit, extract first + last user messages using `head`/`tail` and inline parsing to present context.

Compression does NOT delete messages from the JSONL file — it only affects the live context window. The full history is always on disk, so grep always searches complete content.

## Step 5: Present results

For every match, synthesize a human-readable summary and explain **why** this session matches the query. Do NOT just dump raw field values — interpret them.

For each result, produce:

```
### {one-line summary synthesized from first/last messages, skills, files, and PRs}

**Why this matches:** {1-2 sentences explaining why this session is relevant to the user's query — connect the search terms to what actually happened in the session}

**Started as:** {natural language paraphrase of firstUserMessages — not raw text dump}
**Left off at:** {natural language paraphrase of lastUserMessages — what state was the work in?}
**Context:** {launchDir} | {branches} | {date} | {messageCount} messages | {compactionCount} compactions
**Skills used:** {skills}
**PRs:** {prs} | **Files modified:** {count}

```bash
cd {launchDir} && claude -r {id}
```
```

**How to write the summary line:** Read the firstUserMessages, lastUserMessages, skills, filesModified, prs, and branches together. Synthesize a short description of what the session was *about* — not what the user literally typed, but what the work was. Examples:
- "Speccing out credential delegation for openbolts using /spec"
- "Debugging doltgres timestamp issues in a worktree (PR #2212)"
- "Researching motion graphics tools and evaluating Remotion vs alternatives"
- "Creating blog cover options for agent-in-slack post using /graphics in Figma"

**How to write the "why this matches" line:** Connect the user's search query to the specific evidence in the session. Examples:
- User searched "openbolt spec" → "This session explored openbolts credential delegation and produced a SPEC.md — the lastUserMessages show the spec was in progress when the session ended."
- User searched "PR #2212" → "PR #2212 (inkeep/agents) was the primary focus — 24 gh pr commands were issued including diff review and body edits."

**Rules:**
- `launchDir` is the directory the user must `cd` into before resuming (Claude Code is project-scoped).
- Show at most 10 results unless the user asks for more.
- If multiple sessions are clearly about the same topic (same branch, overlapping PRs, sequential dates), group them and note the relationship: "These 3 sessions appear to be continuations of the same work" with the most recent one highlighted as the best resume target.
- If a session has `compactionCount > 0`, note this — it indicates a long/complex session where significant work happened.
- If `continuationSummaries` exist, use them to enrich your summary — they capture chronological recaps of pre-compaction work and are often the richest source of what the session accomplished.
- For resumption queries ("where was I on X?"), lead with the **Left off at** state and frame the summary around what remains to be done.

## Understanding the data

### Where sessions live
`~/.claude/projects/{project-path}/{session-id}.jsonl`

The project path encodes the working directory with dashes replacing `/`:
- `~/agents` → `-Users-{username}-agents`
- `~/team-skills` → `-Users-{username}-team-skills`
- `~/InkeepDev/marketing-site-v2/marketing-site` → `-Users-{username}-InkeepDev-marketing-site-v2-marketing-site`
- `~/` → `-Users-{username}`

### What's in each JSONL entry
Each line is a JSON object with `type` (progress, user, assistant, system, file-history-snapshot, queue-operation), plus metadata: `sessionId`, `cwd`, `gitBranch`, `timestamp`, `entrypoint`, `version`.

### What the indexer extracts per session

| Field | Source | Why it matters |
|---|---|---|
| `firstUserMessages` | First 3 user messages | What the conversation started as |
| `lastUserMessages` | Last 3 user messages | Where the conversation left off (handles topic drift) |
| `branches` | `gitBranch` field on every entry | Tracks branch changes mid-session |
| `worktrees` | `git worktree add` commands | Identifies worktree-based work |
| `prs` | PR URLs in user messages + `gh pr` commands | Links sessions to PRs |
| `repos` | PR URLs + `--repo` flags | Which repositories were touched |
| `skills` | `Skill` tool_use entries | Which skills were invoked |
| `filesModified` | `Write`/`Edit` tool_use entries | Which files were changed |
| `toolCounts` | All tool_use entries | Session character (read-heavy, write-heavy, bash-heavy) |
| `compactionCount` | `system:compact_boundary` entries | Session length/complexity indicator |
| `continuationSummaries` | "continued from previous conversation" messages | Captures pre-compaction context (the "compressed middle") |

### Compression and the "needle in the middle" problem
Claude Code compresses context when approaching limits, but compression only affects the live context window — the full message history stays in the JSONL file on disk. The indexer captures both bookends (first + last messages) and continuation summaries (which chronologically recap pre-compaction content). Between these and the grep fallback, no content is unreachable.
