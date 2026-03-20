#!/usr/bin/env bun
/**
 * Unified search entrypoint for find-claude.
 * Runs keyword search (index-sessions.ts) and semantic search (episodic-memory)
 * in parallel, merges and deduplicates results by session ID.
 *
 * Sessions found by both engines get a score boost.
 *
 * Usage:
 *   bun ~/.claude/skills/find-claude/scripts/search.ts "figma hook cleanup"
 *   bun ~/.claude/skills/find-claude/scripts/search.ts --skill eng:spec "openbolt"
 *   bun ~/.claude/skills/find-claude/scripts/search.ts --pr 2212
 *   bun ~/.claude/skills/find-claude/scripts/search.ts --today
 *   bun ~/.claude/skills/find-claude/scripts/search.ts --limit 30 "auth"
 */

import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { which } from "bun";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEYWORD_SCRIPT = join(__dirname, "index-sessions.ts");
const DEFAULT_LIMIT = 20;

interface KeywordResult {
  score: number;
  id: string;
  launchDir: string;
  date: string;
  startedAt: string | null;
  lastActiveAt: string | null;
  messageCount: number;
  compactionCount: number;
  branches: string[];
  prs: string[];
  skills: string[];
  filesModified: number;
  firstUserMessages: string[];
  lastUserMessages: string[];
  continuationSummaries: string[];
  worktrees: string[];
  repos: string[];
}

interface SemanticResult {
  sessionId: string;
  project: string;
  date: string;
  similarity: number;
  snippet: string;
}

interface MergedResult extends KeywordResult {
  semanticScore: number;
  combinedScore: number;
  foundBy: ("keyword" | "semantic")[];
}

// Parse args: extract --limit, pass everything else through to keyword search
const rawArgs = process.argv.slice(2);
let limit = DEFAULT_LIMIT;
const passthrough: string[] = [];
const textTerms: string[] = [];

for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--limit" && rawArgs[i + 1]) {
    limit = parseInt(rawArgs[++i], 10) || DEFAULT_LIMIT;
  } else if (rawArgs[i].startsWith("--")) {
    passthrough.push(rawArgs[i]);
    if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith("--")) {
      passthrough.push(rawArgs[++i]);
    }
  } else {
    // Pass the full string to both engines — keyword engine splits on whitespace internally
    textTerms.push(rawArgs[i]);
    passthrough.push(rawArgs[i]);
  }
}

function runProcess(
  cmd: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.on("close", (code: number) => resolve({ stdout, stderr, code: code ?? 1 }));
    proc.on("error", () => resolve({ stdout, stderr, code: 1 }));
  });
}

function extractSessionId(archivePath: string): string | null {
  // Extract session UUID from archive path like .../c8b7be5c-6995-4f92-85e1-fc77e1a131e1.jsonl
  const match = archivePath.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl/i,
  );
  return match ? match[1] : null;
}

function parseSemanticOutput(stdout: string): SemanticResult[] {
  const results: SemanticResult[] = [];
  const lines = stdout.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match lines like: 1. [-Users-edwingomezcuellar-team-skills, 2026-03-19] - 14% match
    const headerMatch = line.match(
      /^\d+\.\s+\[([^\]]+),\s*(\d{4}-\d{2}-\d{2})\]\s*-\s*(\d+)%\s*match/,
    );
    if (headerMatch) {
      const [, project, date, pct] = headerMatch;
      // Next line is the snippet
      const snippet = (lines[i + 1] || "").trim().replace(/^"(.*)"$/, "$1");
      // Line after that has the file path with session ID
      const pathLine = lines[i + 2] || "";
      const sessionId = extractSessionId(pathLine);

      if (sessionId) {
        results.push({
          sessionId,
          project: project.trim(),
          date,
          similarity: parseInt(pct, 10) / 100,
          snippet,
        });
      }
    }
  }
  return results;
}

async function main() {
  const fetchLimit = limit + 10; // fetch extra to account for dedup

  // Run both searches in parallel
  const semanticQuery = textTerms.join(" ");
  const hasSemanticQuery = semanticQuery.trim().length > 0;

  const episodicMemoryPath = await which("episodic-memory");

  const [keywordResult, semanticResult] = await Promise.all([
    // Layer 1: keyword search
    runProcess("bun", [
      KEYWORD_SCRIPT,
      "search",
      "--limit",
      String(fetchLimit),
      ...passthrough,
    ]),
    // Layer 2: semantic search (only if there are text terms and episodic-memory is installed)
    hasSemanticQuery && episodicMemoryPath
      ? runProcess("episodic-memory", ["search", semanticQuery])
      : Promise.resolve({ stdout: "", stderr: "", code: 0 }),
  ]);

  // Parse keyword results
  let keywordResults: KeywordResult[] = [];
  try {
    keywordResults = JSON.parse(keywordResult.stdout);
  } catch {
    // No results or parse error
  }

  // Parse semantic results
  const semanticResults = hasSemanticQuery
    ? parseSemanticOutput(semanticResult.stdout)
    : [];

  // Build merged map keyed by session ID
  const merged = new Map<string, MergedResult>();

  // Add keyword results
  for (const kr of keywordResults) {
    merged.set(kr.id, {
      ...kr,
      semanticScore: 0,
      combinedScore: kr.score,
      foundBy: ["keyword"],
    });
  }

  // Deduplicate semantic results by session ID (multiple exchanges can match from same session)
  // Keep the highest similarity score per session
  const semanticBySession = new Map<string, SemanticResult>();
  for (const sr of semanticResults) {
    const existing = semanticBySession.get(sr.sessionId);
    if (!existing || sr.similarity > existing.similarity) {
      semanticBySession.set(sr.sessionId, sr);
    }
  }

  // Merge semantic results into keyword results
  for (const [sessionId, sr] of semanticBySession) {
    const existing = merged.get(sessionId);
    if (existing) {
      // Found by both — boost combined score
      existing.semanticScore = sr.similarity;
      existing.combinedScore += sr.similarity * 10; // normalize semantic to comparable range
      if (!existing.foundBy.includes("semantic")) {
        existing.foundBy.push("semantic");
      }
    } else {
      // Only found by semantic — look up full metadata from keyword index
      // Run a quick lookup by session ID
      merged.set(sessionId, {
        score: 0,
        id: sessionId,
        launchDir: "",
        date: sr.date,
        startedAt: null,
        lastActiveAt: null,
        messageCount: 0,
        compactionCount: 0,
        branches: [],
        prs: [],
        skills: [],
        filesModified: 0,
        firstUserMessages: [sr.snippet],
        lastUserMessages: [],
        continuationSummaries: [],
        worktrees: [],
        repos: [],
        semanticScore: sr.similarity,
        combinedScore: sr.similarity * 10,
        foundBy: ["semantic"],
      });
    }
  }

  // For semantic-only results missing metadata, try to enrich from the full index
  const needsEnrichment = [...merged.values()].filter(
    (r) => r.foundBy.length === 1 && r.foundBy[0] === "semantic" && !r.launchDir,
  );
  if (needsEnrichment.length > 0) {
    // Quick lookup: run keyword search with no text terms but matching session IDs
    // Simpler: just load the index and look up by ID
    try {
      const { readFileSync, existsSync } = await import("fs");
      const { homedir } = await import("os");
      const indexPath = `${homedir()}/.claude/session-index/index.json`;
      if (existsSync(indexPath)) {
        const index: KeywordResult[] = JSON.parse(
          readFileSync(indexPath, "utf-8"),
        );
        const indexById = new Map(index.map((e) => [e.id, e]));
        for (const entry of needsEnrichment) {
          const full = indexById.get(entry.id);
          if (full) {
            entry.launchDir = full.launchDir;
            entry.startedAt = full.startedAt;
            entry.lastActiveAt = full.lastActiveAt;
            entry.messageCount = full.messageCount;
            entry.compactionCount = full.compactionCount;
            entry.branches = full.branches;
            entry.prs = full.prs;
            entry.skills = full.skills;
            entry.filesModified = full.filesModified;
            entry.firstUserMessages = full.firstUserMessages;
            entry.lastUserMessages = full.lastUserMessages;
            entry.continuationSummaries = full.continuationSummaries;
            entry.worktrees = full.worktrees;
            entry.repos = full.repos;
          }
        }
      }
    } catch {
      // Index not available — semantic-only results will have minimal metadata
    }
  }

  // Sort by combined score descending, then by date
  const sorted = [...merged.values()].sort((a, b) => {
    if (b.combinedScore !== a.combinedScore)
      return b.combinedScore - a.combinedScore;
    return (b.date || "").localeCompare(a.date || "");
  });

  const results = sorted.slice(0, limit);

  if (results.length === 0) {
    console.log("No matches found.");
    console.log(
      "Try grep fallback: grep -rl 'KEYWORD' ~/.claude/projects/*/*.jsonl",
    );
    process.exit(0);
  }

  // Output as JSON
  const output = results.map((r) => ({
    id: r.id,
    launchDir: r.launchDir,
    date: r.date,
    startedAt: r.startedAt,
    lastActiveAt: r.lastActiveAt,
    messageCount: r.messageCount,
    compactionCount: r.compactionCount,
    branches: r.branches,
    prs: r.prs,
    skills: r.skills,
    filesModified: r.filesModified,
    firstUserMessages: r.firstUserMessages,
    lastUserMessages: r.lastUserMessages,
    continuationSummaries: r.continuationSummaries,
    worktrees: r.worktrees,
    repos: r.repos,
    keywordScore: r.score,
    semanticScore: r.semanticScore,
    combinedScore: Math.round(r.combinedScore * 100) / 100,
    foundBy: r.foundBy,
  }));

  console.log(JSON.stringify(output, null, 2));
}

main();
