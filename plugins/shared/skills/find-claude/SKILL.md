---
name: find-claude
description: Search, navigate, and resume Claude Code conversation histories. Find conversations by topic, PR, branch, worktree, skill used, files modified, repo, or recency. Use when asked to find a prior conversation, recall past work, resume interrupted sessions, or search chat history. Triggers on find conversation, prior conversation, previous session, resume session, where did we, what was I working on, find the chat, search history.
argument-hint: "[search query] (e.g. 'openbolt spec', 'PR #2212', 'today', '/spec skill')"
---

# Find Claude — Conversation History Search

Search and navigate Claude Code conversation histories across all projects. Two-phase: **index** for fast lookup, **grep** as fallback for deep content search.

## Step 0: Ensure search is ready

Check if the keyword index exists:

```bash
test -f ~/.claude/session-index/index.json && echo "INDEX EXISTS" || echo "NO INDEX"
```

**If NO INDEX** (first time): run the full setup script. This builds the keyword index and optionally installs semantic search (episodic-memory). Tell the user what's happening — first-time setup takes a few minutes.

```bash
bash ~/.claude/skills/find-claude/scripts/setup.sh
```

**If INDEX EXISTS**: run an incremental update (<1s):

```bash
bun ~/.claude/skills/find-claude/scripts/index-sessions.ts
```

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

## Step 2: Search (keyword + semantic in parallel)

Use the unified search script. It runs keyword search (our index) and semantic search (episodic-memory embeddings) **in parallel**, merges results by session ID, and boosts sessions found by both engines.

```bash
# Free-text search (runs both keyword + semantic, merges results)
bun ~/.claude/skills/find-claude/scripts/search.ts "figma hook cleanup"

# Filtered searches (keyword filters + semantic in parallel)
bun ~/.claude/skills/find-claude/scripts/search.ts --skill eng:spec "openbolt"
bun ~/.claude/skills/find-claude/scripts/search.ts --pr 2212
bun ~/.claude/skills/find-claude/scripts/search.ts --branch feat/auth
bun ~/.claude/skills/find-claude/scripts/search.ts --today
bun ~/.claude/skills/find-claude/scripts/search.ts --file manage-schema.ts
bun ~/.claude/skills/find-claude/scripts/search.ts --worktree agents-pr2212
bun ~/.claude/skills/find-claude/scripts/search.ts --repo doltgresql
bun ~/.claude/skills/find-claude/scripts/search.ts --limit 30 "auth"
```

Flags can be combined: `--skill eng:spec --branch feat/auth "credential"` requires all flag conditions AND scores text terms.

**How scoring works:**
- **Keyword score:** `lastUserMessages` (3x), `firstUserMessages` (2x), `continuationSummaries` (2x), structured fields (1x)
- **Semantic score:** Cosine similarity from local MiniLM-L6 embeddings (384-dim) against every user/assistant exchange
- **Combined:** Sessions found by both engines get boosted. Sorted by combined score then recency.
- **Default limit:** 20 results

The output is JSON with `foundBy: ["keyword", "semantic"]` indicating which engine(s) found each result. Read it and synthesize human-readable summaries per Step 4.

**Fallback:** If episodic-memory is not installed, only keyword search runs (still works, just no semantic layer).

**Dependency:** Semantic search requires [episodic-memory](https://github.com/obra/episodic-memory) installed at `~/.claude/oss-repos/episodic-memory/` with `npm link`. Run `episodic-memory sync` to index new sessions.

## Step 3: Grep fallback

If both keyword and semantic search return no matches (the keyword may be buried in the middle of a conversation, not captured in bookends, summaries, or embedding text):

```bash
grep -rl "KEYWORD" ~/.claude/projects/*/*.jsonl
```

For each hit, extract first + last user messages using `head`/`tail` and inline parsing to present context.

Compression does NOT delete messages from the JSONL file — it only affects the live context window. The full history is always on disk, so grep always searches complete content.

## Step 4: Present results

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
