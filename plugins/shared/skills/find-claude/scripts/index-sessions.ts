#!/usr/bin/env bun
/**
 * Index Claude Code conversation histories for fast search.
 *
 * Scans all .jsonl session files in ~/.claude/projects/*, extracts searchable
 * metadata, and writes a compact index to ~/.claude/session-index/index.json.
 *
 * Incremental: only re-scans sessions whose file size changed since last scan.
 *
 * Usage:
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts              # incremental
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts --full       # full re-index
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts --stats      # print stats
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search "query terms"  # search
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --skill eng:spec "openbolt"
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --pr 2212
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --branch feat/auth
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --today
 *   bun ~/.claude/skills/find-claude/scripts/index-sessions.ts search --file manage-schema.ts
 */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join, basename } from "path";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const HOME = homedir();
const CLAUDE_DIR = join(HOME, ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");
const INDEX_DIR = join(CLAUDE_DIR, "session-index");
const INDEX_FILE = join(INDEX_DIR, "index.json");
const SCAN_STATE_FILE = join(INDEX_DIR, "last-scan.json");

const MAX_FIRST_USER_MSGS = 3;
const MAX_LAST_USER_MSGS = 3;
const MAX_CONTINUATION_SUMMARY_CHARS = 600;
const MAX_FILES_MODIFIED = 50;
const MAX_USER_MSG_CHARS = 300;

const PR_URL_RE = /github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/g;
const GH_PR_CMD_RE = /gh\s+pr\s+\w+\s+(\d+)/g;
const GH_REPO_FLAG_RE = /--repo\s+([\w.-]+\/[\w.-]+)/g;
const WORKTREE_ADD_RE = /git\s+worktree\s+add\s+(\S+)/g;
const CONTINUATION_PREFIX =
  "This session is being continued from a previous conversation";

interface SessionEntry {
  id: string;
  project: string;
  launchDir: string;
  startedAt: string | null;
  lastActiveAt: string | null;
  messageCount: number;
  fileSizeBytes: number;
  firstUserMessages: string[];
  lastUserMessages: string[];
  branches: string[];
  cwds: string[];
  worktrees: string[];
  prs: string[];
  repos: string[];
  skills: string[];
  filesModified: string[];
  toolCounts: Record<string, number>;
  compactionCount: number;
  continuationSummaries: string[];
}

function decodeProjectDir(dirname: string): string {
  // The project dir encodes a filesystem path with dashes replacing /.
  // Problem: directory names themselves can contain dashes (e.g. "marketing-site-v2").
  // Solution: use the cwd from the first entry of any session in this project,
  // which is the actual filesystem path. We cache this in a lookup built during indexing.
  // Fallback: verify candidate paths exist on disk.
  const username = basename(HOME);
  const prefix = `-Users-${username}-`;
  if (dirname === `-Users-${username}`) return HOME;
  if (dirname.startsWith("-private-")) {
    return "/" + dirname.slice(1).replace(/-/g, "/");
  }
  if (!dirname.startsWith(prefix)) {
    return "/" + dirname.replace(/^-/, "").replace(/-/g, "/");
  }

  const rest = dirname.slice(prefix.length);
  if (!rest) return HOME;

  // Try to reconstruct the path by checking which segments exist on disk.
  // Walk the encoded string greedily: at each position, try the longest
  // directory name that exists, consuming dashes as part of the name or as separators.
  const parts = rest.split("-");
  let current = HOME;
  let i = 0;
  while (i < parts.length) {
    // Try joining progressively more parts to find the longest existing dir name
    let matched = false;
    for (let len = parts.length - i; len >= 1; len--) {
      const candidate = parts.slice(i, i + len).join("-");
      const candidatePath = join(current, candidate);
      try {
        if (statSync(candidatePath).isDirectory()) {
          current = candidatePath;
          i += len;
          matched = true;
          break;
        }
      } catch {
        // doesn't exist, try shorter
      }
    }
    if (!matched) {
      // No existing path found — fall back to single segment
      current = join(current, parts[i]);
      i++;
    }
  }
  return current;
}

function extractFromCommand(
  cmd: string,
  prs: Set<string>,
  repos: Set<string>,
  worktrees: Set<string>,
) {
  for (const m of cmd.matchAll(PR_URL_RE)) {
    prs.add(`${m[1]}/${m[2]}#${m[3]}`);
    repos.add(`${m[1]}/${m[2]}`);
  }
  for (const m of cmd.matchAll(GH_PR_CMD_RE)) {
    prs.add(`#${m[1]}`);
  }
  for (const m of cmd.matchAll(GH_REPO_FLAG_RE)) {
    repos.add(m[1]);
  }
  for (const m of cmd.matchAll(WORKTREE_ADD_RE)) {
    worktrees.add(m[1]);
  }
}

async function extractSession(filepath: string): Promise<SessionEntry | null> {
  const stat = statSync(filepath);
  const sessionId = basename(filepath, ".jsonl");
  const projectDir = basename(join(filepath, ".."));

  const branches = new Set<string>();
  const cwds = new Set<string>();
  const worktrees = new Set<string>();
  const prs = new Set<string>();
  const repos = new Set<string>();
  const skills = new Set<string>();
  const filesModified = new Set<string>();
  const toolCounts: Record<string, number> = {};
  const allUserMessages: string[] = [];
  const continuationSummaries: string[] = [];
  let firstTimestamp: string | null = null;
  let lastTimestamp: string | null = null;
  let firstCwd: string | null = null;
  let messageCount = 0;
  let compactionCount = 0;

  try {
    const rl = createInterface({
      input: createReadStream(filepath, { encoding: "utf-8" }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      let d: any;
      try {
        d = JSON.parse(line);
      } catch {
        continue;
      }

      const msgType = d.type || "";
      const timestamp = d.timestamp;

      if (timestamp) {
        if (!firstTimestamp) firstTimestamp = timestamp;
        lastTimestamp = timestamp;
      }

      if (d.gitBranch) branches.add(d.gitBranch);
      if (d.cwd) {
        cwds.add(d.cwd);
        if (!firstCwd) firstCwd = d.cwd;
      }

      if (msgType === "system" && d.subtype === "compact_boundary") {
        compactionCount++;
      }

      const msg = d.message;
      if (!msg || typeof msg !== "object") continue;
      const role = msg.role || "";
      const content = msg.content;

      if (role === "user" || role === "assistant") messageCount++;

      // Extract user messages
      if (role === "user" && typeof content === "string" && content.trim()) {
        const clean = content.trim();
        // Skip system-injected messages
        if (
          clean.startsWith("<system-reminder>") ||
          clean.startsWith("<task-notification>") ||
          clean.startsWith("<local-command-caveat>") ||
          clean.startsWith("<command-name>")
        ) {
          continue;
        }
        allUserMessages.push(clean.slice(0, MAX_USER_MSG_CHARS));

        if (clean.startsWith(CONTINUATION_PREFIX)) {
          continuationSummaries.push(
            clean.slice(0, MAX_CONTINUATION_SUMMARY_CHARS),
          );
        }
      }

      // Extract tool uses from assistant messages
      if (role === "assistant" && Array.isArray(content)) {
        for (const item of content) {
          if (!item || typeof item !== "object" || item.type !== "tool_use")
            continue;

          const toolName = item.name || "";
          toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
          const inp = item.input;
          if (!inp || typeof inp !== "object") continue;

          if (toolName === "Skill" && inp.skill) {
            skills.add(inp.skill);
          }

          if ((toolName === "Write" || toolName === "Edit") && inp.file_path) {
            filesModified.add(inp.file_path);
          }

          if (toolName === "Bash" && inp.command) {
            extractFromCommand(inp.command, prs, repos, worktrees);
          }
        }
      }

      // Scan user messages for PR URLs
      if (role === "user" && typeof content === "string") {
        for (const m of content.matchAll(PR_URL_RE)) {
          prs.add(`${m[1]}/${m[2]}#${m[3]}`);
          repos.add(`${m[1]}/${m[2]}`);
        }
      }
    }
  } catch (e) {
    console.error(`  Error processing ${basename(filepath)}: ${e}`);
    return null;
  }

  return {
    id: sessionId,
    project: projectDir,
    launchDir: firstCwd || decodeProjectDir(projectDir),
    startedAt: firstTimestamp,
    lastActiveAt: lastTimestamp,
    messageCount,
    fileSizeBytes: stat.size,
    firstUserMessages: allUserMessages.slice(0, MAX_FIRST_USER_MSGS),
    lastUserMessages:
      allUserMessages.length > MAX_FIRST_USER_MSGS
        ? allUserMessages.slice(-MAX_LAST_USER_MSGS)
        : [],
    branches: [...branches].sort(),
    cwds: [...cwds].sort(),
    worktrees: [...worktrees].sort(),
    prs: [...prs].sort(),
    repos: [...repos].sort(),
    skills: [...skills].sort(),
    filesModified: [...filesModified].sort().slice(0, MAX_FILES_MODIFIED),
    toolCounts: Object.fromEntries(
      Object.entries(toolCounts).sort(([, a], [, b]) => b - a),
    ),
    compactionCount,
    continuationSummaries,
  };
}

function findAllSessions(): string[] {
  const sessions: string[] = [];
  if (!existsSync(PROJECTS_DIR)) return sessions;

  for (const projName of readdirSync(PROJECTS_DIR)) {
    const projPath = join(PROJECTS_DIR, projName);
    try {
      if (!statSync(projPath).isDirectory()) continue;
    } catch {
      continue;
    }
    for (const file of readdirSync(projPath)) {
      if (!file.endsWith(".jsonl")) continue;
      const fp = join(projPath, file);
      try {
        if (statSync(fp).size > 0) sessions.push(fp);
      } catch {
        continue;
      }
    }
  }
  return sessions;
}

function loadJSON<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return fallback;
  }
}

function saveJSON(path: string, data: unknown) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

async function indexSessions(full: boolean) {
  const start = Date.now();
  const sessions = findAllSessions();
  const scanState: Record<string, number> = full
    ? {}
    : loadJSON(SCAN_STATE_FILE, {});
  const existingIndex: Record<string, SessionEntry> = full
    ? {}
    : Object.fromEntries(
        loadJSON<SessionEntry[]>(INDEX_FILE, []).map((e) => [e.id, e]),
      );

  const newState: Record<string, number> = {};
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < sessions.length; i++) {
    const sessionPath = sessions[i];
    const sid = basename(sessionPath, ".jsonl");
    const size = statSync(sessionPath).size;

    if (!full && scanState[sid] === size && existingIndex[sid]) {
      newState[sid] = size;
      skipped++;
      continue;
    }

    if ((i + 1) % 20 === 0 || i === 0) {
      process.stderr.write(`  Indexing ${i + 1}/${sessions.length}...\n`);
    }

    const entry = await extractSession(sessionPath);
    if (entry) {
      existingIndex[sid] = entry;
      newState[sid] = size;
      updated++;
    } else {
      newState[sid] = size;
    }
  }

  // Remove entries for deleted sessions
  const currentIds = new Set(sessions.map((p) => basename(p, ".jsonl")));
  const removed: string[] = [];
  for (const sid of Object.keys(existingIndex)) {
    if (!currentIds.has(sid)) {
      delete existingIndex[sid];
      removed.push(sid);
    }
  }

  // Sort by lastActiveAt descending
  const entries = Object.values(existingIndex).sort((a, b) =>
    (b.lastActiveAt || "").localeCompare(a.lastActiveAt || ""),
  );

  saveJSON(INDEX_FILE, entries);
  saveJSON(SCAN_STATE_FILE, newState);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.error(
    `Indexed ${updated} sessions, skipped ${skipped} unchanged, ` +
      `removed ${removed.length} deleted. ` +
      `Total: ${entries.length} sessions in ${elapsed}s.`,
  );
}

function printStats() {
  const entries = loadJSON<SessionEntry[]>(INDEX_FILE, []);
  if (!entries.length) {
    console.log("No index found. Run: bun ~/.claude/skills/find-claude/scripts/index-sessions.ts");
    return;
  }

  const totalMsgs = entries.reduce((s, e) => s + (e.messageCount || 0), 0);
  const totalSize = entries.reduce((s, e) => s + (e.fileSizeBytes || 0), 0);
  const projects = new Set(entries.map((e) => e.project));
  const allSkills = new Set(entries.flatMap((e) => e.skills || []));
  const allPrs = new Set(entries.flatMap((e) => e.prs || []));
  const allBranches = new Set(entries.flatMap((e) => e.branches || []));

  console.log(`Sessions:    ${entries.length}`);
  console.log(`Projects:    ${projects.size}`);
  console.log(`Messages:    ${totalMsgs.toLocaleString()}`);
  console.log(`Total size:  ${(totalSize / 1e9).toFixed(2)} GB`);
  console.log(`Skills used: ${allSkills.size}`);
  console.log(`PRs touched: ${allPrs.size}`);
  console.log(`Branches:    ${allBranches.size}`);
  console.log(`Index file:  ${INDEX_FILE}`);
  console.log(
    `Most recent: ${entries[0]?.lastActiveAt?.slice(0, 10) || "N/A"}`,
  );
}

function searchIndex(args: string[]) {
  const entries = loadJSON<SessionEntry[]>(INDEX_FILE, []);
  if (!entries.length) {
    console.log(
      "No index found. Run: bun ~/.claude/skills/find-claude/scripts/index-sessions.ts --full",
    );
    return;
  }

  // Parse search flags
  const flagFilters: Array<(e: SessionEntry) => boolean> = [];
  const textTerms: string[] = [];
  let limit = 10;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--skill" && args[i + 1]) {
      const val = args[++i].toLowerCase();
      flagFilters.push((e) =>
        e.skills.some((s) => s.toLowerCase().includes(val)),
      );
    } else if (arg === "--pr" && args[i + 1]) {
      const val = args[++i];
      flagFilters.push((e) => e.prs.some((p) => p.includes(val)));
    } else if (arg === "--branch" && args[i + 1]) {
      const val = args[++i].toLowerCase();
      flagFilters.push((e) =>
        e.branches.some((b) => b.toLowerCase().includes(val)),
      );
    } else if (arg === "--file" && args[i + 1]) {
      const val = args[++i].toLowerCase();
      flagFilters.push((e) =>
        e.filesModified.some((f) => f.toLowerCase().includes(val)),
      );
    } else if (arg === "--worktree" && args[i + 1]) {
      const val = args[++i].toLowerCase();
      flagFilters.push((e) =>
        e.worktrees.some((w) => w.toLowerCase().includes(val)),
      );
    } else if (arg === "--repo" && args[i + 1]) {
      const val = args[++i].toLowerCase();
      flagFilters.push((e) =>
        e.repos.some((r) => r.toLowerCase().includes(val)),
      );
    } else if (arg === "--today") {
      const today = new Date().toISOString().slice(0, 10);
      flagFilters.push(
        (e) => (e.lastActiveAt || "").slice(0, 10) === today,
      );
    } else if (arg === "--limit" && args[i + 1]) {
      limit = parseInt(args[++i], 10) || 10;
    } else if (!arg.startsWith("--")) {
      textTerms.push(arg.toLowerCase());
    }
  }

  // Score and filter
  const scored: Array<{ score: number; entry: SessionEntry }> = [];

  for (const entry of entries) {
    // Apply flag filters (must all pass)
    if (flagFilters.length > 0 && !flagFilters.every((f) => f(entry))) continue;

    // Text scoring
    const allText = [
      ...entry.firstUserMessages,
      ...entry.lastUserMessages,
      ...entry.continuationSummaries,
      ...entry.skills,
      ...entry.filesModified,
      ...entry.prs,
      ...entry.repos,
      ...entry.branches,
      ...entry.worktrees,
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    if (textTerms.length === 0 && flagFilters.length > 0) {
      // Flag-only search — all passing entries get score 1
      score = 1;
    } else {
      for (const term of textTerms) {
        // Count occurrences across fields, weight by field type
        const lastMsgText = entry.lastUserMessages.join(" ").toLowerCase();
        const firstMsgText = entry.firstUserMessages.join(" ").toLowerCase();
        const summaryText = entry.continuationSummaries.join(" ").toLowerCase();

        if (lastMsgText.includes(term)) score += 3; // highest: where they left off
        if (firstMsgText.includes(term)) score += 2; // next: where they started
        if (summaryText.includes(term)) score += 2; // continuation summaries
        if (
          entry.skills.some((s) => s.toLowerCase().includes(term)) ||
          entry.filesModified.some((f) => f.toLowerCase().includes(term)) ||
          entry.prs.some((p) => p.toLowerCase().includes(term)) ||
          entry.branches.some((b) => b.toLowerCase().includes(term))
        )
          score += 1;
      }
    }

    if (score > 0) {
      scored.push({ score, entry });
    }
  }

  // Sort by score desc, then recency
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.entry.lastActiveAt || "").localeCompare(
      a.entry.lastActiveAt || "",
    );
  });

  const results = scored.slice(0, limit);

  if (results.length === 0) {
    console.log("No matches found in index.");
    console.log(
      "Try grep fallback: grep -rl 'KEYWORD' ~/.claude/projects/*/*.jsonl",
    );
    return;
  }

  // Output as JSON for Claude to consume and summarize
  const output = results.map(({ score, entry: e }) => ({
    score,
    id: e.id,
    launchDir: e.launchDir,
    date: (e.lastActiveAt || "").slice(0, 10),
    messageCount: e.messageCount,
    compactionCount: e.compactionCount,
    branches: e.branches,
    prs: e.prs,
    skills: e.skills,
    filesModified: e.filesModified.length,
    firstUserMessages: e.firstUserMessages,
    lastUserMessages: e.lastUserMessages,
    continuationSummaries: e.continuationSummaries,
    worktrees: e.worktrees,
    repos: e.repos,
  }));

  console.log(JSON.stringify(output, null, 2));
}

// Main
const args = process.argv.slice(2);
if (args[0] === "search") {
  searchIndex(args.slice(1));
} else if (args.includes("--stats")) {
  printStats();
} else if (args.includes("--full")) {
  console.error("Full re-index...");
  await indexSessions(true);
} else {
  console.error("Incremental index update...");
  await indexSessions(false);
}
