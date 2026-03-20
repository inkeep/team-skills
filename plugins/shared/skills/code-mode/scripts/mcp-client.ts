#!/usr/bin/env bun
/**
 * mcp-client.ts — Claude Code MCP config reader + transport factory
 *
 * Reads MCP server configs from Claude Code's own config files:
 *   1. Plugin configs (installed_plugins.json → plugin.json / .mcp.json)
 *   2. User-scope (~/.claude.json top-level mcpServers)
 *   3. Project-local (~/.claude.json projects[cwd].mcpServers)
 *   4. Project-shared (<cwd>/.mcp.json)
 *
 * Higher-numbered sources override lower. Env objects are deep-merged
 * so plugin base config + user token overrides both apply.
 *
 * CLI usage:
 *   bun mcp-client.ts list                   # list all servers
 *   bun mcp-client.ts get <name>             # get resolved config for a server
 *
 * Module usage:
 *   import { getServerConfig, listServers, createTransport } from "./mcp-client.ts";
 */

import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";

// ── Types ──

export interface StdioServerConfig {
  type: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  source?: string;
}

export interface HttpServerConfig {
  type: "http";
  url: string;
  headers?: Record<string, string>;
  source?: string;
}

export interface SseServerConfig {
  type: "sse";
  url: string;
  headers?: Record<string, string>;
  source?: string;
}

export type ServerConfig = StdioServerConfig | HttpServerConfig | SseServerConfig;

interface ServerEntry {
  name: string;
  type: string;
  source: string;
}

// ── Env var resolution ──

/**
 * Resolve ${VAR} and ${VAR:-default} patterns in a string.
 * Literal strings (no ${}) pass through unchanged.
 */
function resolveEnvString(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, expr: string) => {
    const dashIdx = expr.indexOf(":-");
    if (dashIdx !== -1) {
      const name = expr.slice(0, dashIdx);
      const fallback = expr.slice(dashIdx + 2);
      return process.env[name] ?? fallback;
    }
    return process.env[expr] ?? "";
  });
}

/**
 * Resolve env vars in all values of a Record<string, string>.
 */
function resolveEnvRecord(env: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [k, v] of Object.entries(env)) {
    resolved[k] = resolveEnvString(String(v));
  }
  return resolved;
}

/**
 * Resolve ${CLAUDE_PLUGIN_ROOT} and ${CLAUDE_PLUGIN_DATA} in server config values.
 */
function expandPluginVars(
  config: Record<string, any>,
  installPath: string,
  dataPath: string,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === "string") {
      result[k] = v
        .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, installPath)
        .replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, dataPath);
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      result[k] = expandPluginVars(v, installPath, dataPath);
    } else if (Array.isArray(v)) {
      result[k] = v.map((item) =>
        typeof item === "string"
          ? item
              .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, installPath)
              .replace(/\$\{CLAUDE_PLUGIN_DATA\}/g, dataPath)
          : item,
      );
    } else {
      result[k] = v;
    }
  }
  return result;
}

// ── JSON reading helpers ──

function tryReadJson(path: string): any {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function expandTilde(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return join(homedir(), p.slice(1));
  }
  return p;
}

// ── Config source readers ──

/**
 * Read plugin-provided MCP servers from installed_plugins.json.
 * Returns a map of serverName → raw config (with plugin vars expanded).
 */
function readPluginConfigs(): Record<string, Record<string, any>> {
  const servers: Record<string, Record<string, any>> = {};
  const installedPath = join(homedir(), ".claude", "plugins", "installed_plugins.json");
  const installed = tryReadJson(installedPath);
  if (!installed?.plugins) return servers;

  for (const [pluginKey, entries] of Object.entries(installed.plugins) as [string, any[]][]) {
    if (!Array.isArray(entries) || entries.length === 0) continue;
    const entry = entries[0]; // Use first entry (most recent)
    const installPath = expandTilde(entry.installPath);
    if (!installPath || !existsSync(installPath)) continue;

    // Derive data path: ~/.claude/plugins/data/<name>-<marketplace>/
    const parts = pluginKey.split("@");
    const pluginName = parts[0];
    const marketplace = parts[1] || "unknown";
    const dataPath = join(homedir(), ".claude", "plugins", "data", `${pluginName}-${marketplace}`);

    // Source 1: plugin.json mcpServers
    const pluginJson = tryReadJson(join(installPath, ".claude-plugin", "plugin.json"));
    if (pluginJson?.mcpServers && typeof pluginJson.mcpServers === "object") {
      let mcpServers = pluginJson.mcpServers;
      // Handle string path reference (e.g., "./.mcp.json")
      if (typeof mcpServers === "string") {
        const refPath = resolve(installPath, mcpServers);
        mcpServers = tryReadJson(refPath) ?? {};
      }
      for (const [name, config] of Object.entries(mcpServers as Record<string, any>)) {
        const expanded = expandPluginVars(config, installPath, dataPath);
        expanded._source = `plugin:${pluginKey}`;
        servers[name] = expanded;
      }
    }

    // Source 2: .mcp.json at plugin root
    const mcpJsonPath = join(installPath, ".mcp.json");
    const mcpJson = tryReadJson(mcpJsonPath);
    if (mcpJson) {
      // Handle both flat format and { mcpServers: {...} } wrapper
      const entries = mcpJson.mcpServers ?? mcpJson;
      for (const [name, config] of Object.entries(entries as Record<string, any>)) {
        if (typeof config !== "object" || config === null) continue;
        const expanded = expandPluginVars(config, installPath, dataPath);
        expanded._source = `plugin:${pluginKey}:.mcp.json`;
        // Only set if not already set by plugin.json (plugin.json takes precedence within a plugin)
        if (!servers[name]) {
          servers[name] = expanded;
        }
      }
    }
  }

  return servers;
}

/**
 * Read user-scope MCP servers from ~/.claude.json top-level mcpServers.
 */
function readUserScopeConfigs(): Record<string, Record<string, any>> {
  const claudeJson = tryReadJson(join(homedir(), ".claude.json"));
  if (!claudeJson?.mcpServers) return {};
  const servers: Record<string, Record<string, any>> = {};
  for (const [name, config] of Object.entries(claudeJson.mcpServers as Record<string, any>)) {
    servers[name] = { ...config, _source: "user:~/.claude.json" };
  }
  return servers;
}

/**
 * Read project-local MCP servers from ~/.claude.json projects[cwd].mcpServers.
 */
function readProjectLocalConfigs(): Record<string, Record<string, any>> {
  const claudeJson = tryReadJson(join(homedir(), ".claude.json"));
  if (!claudeJson?.projects) return {};
  const cwd = process.cwd();
  const projectConfig = claudeJson.projects[cwd];
  if (!projectConfig?.mcpServers) return {};
  const servers: Record<string, Record<string, any>> = {};
  for (const [name, config] of Object.entries(projectConfig.mcpServers as Record<string, any>)) {
    servers[name] = { ...config, _source: `local:~/.claude.json[${cwd}]` };
  }
  return servers;
}

/**
 * Read project-shared MCP servers from <cwd>/.mcp.json.
 */
function readProjectSharedConfigs(): Record<string, Record<string, any>> {
  const mcpJson = tryReadJson(join(process.cwd(), ".mcp.json"));
  if (!mcpJson) return {};
  // Handle both flat format and { mcpServers: {...} } wrapper
  const entries = mcpJson.mcpServers ?? mcpJson;
  const servers: Record<string, Record<string, any>> = {};
  for (const [name, config] of Object.entries(entries as Record<string, any>)) {
    if (typeof config !== "object" || config === null) continue;
    servers[name] = { ...config, _source: "project:.mcp.json" };
  }
  return servers;
}

// ── Merge logic ──

/**
 * Deep-merge server configs. Higher precedence source overwrites scalar fields,
 * but env objects are merged (higher precedence values win per-key).
 */
function mergeServerConfig(
  base: Record<string, any>,
  override: Record<string, any>,
): Record<string, any> {
  const merged = { ...base, ...override };
  // Deep-merge env objects so plugin base env + user token overrides both apply
  if (base.env && override.env) {
    merged.env = { ...base.env, ...override.env };
  } else if (base.env && !override.env) {
    merged.env = { ...base.env };
  }
  // Track merge chain for debugging
  const baseSrc = base._source ?? "unknown";
  const overSrc = override._source ?? "unknown";
  merged._source = baseSrc === overSrc ? overSrc : `${baseSrc} + ${overSrc}`;
  return merged;
}

/**
 * Load all MCP server configs, merged by precedence:
 *   plugin < user-scope < project-local < project-shared
 */
function loadAllConfigs(): Record<string, Record<string, any>> {
  const layers = [
    readPluginConfigs(),      // lowest precedence
    readUserScopeConfigs(),
    readProjectLocalConfigs(),
    readProjectSharedConfigs(), // highest precedence
  ];

  const merged: Record<string, Record<string, any>> = {};
  for (const layer of layers) {
    for (const [name, config] of Object.entries(layer)) {
      if (merged[name]) {
        merged[name] = mergeServerConfig(merged[name], config);
      } else {
        merged[name] = { ...config };
      }
    }
  }

  return merged;
}

// ── Normalize config to typed ServerConfig ──

function normalizeConfig(name: string, raw: Record<string, any>): ServerConfig | null {
  const source = raw._source ?? "unknown";
  const type = raw.type ?? (raw.command ? "stdio" : null);

  if (type === "stdio" || (!type && raw.command)) {
    if (!raw.command) return null;
    const config: StdioServerConfig = {
      type: "stdio",
      command: resolveEnvString(raw.command),
      source,
    };
    if (raw.args) config.args = raw.args.map((a: string) => resolveEnvString(String(a)));
    if (raw.env) config.env = resolveEnvRecord(raw.env);
    if (raw.cwd) config.cwd = resolveEnvString(raw.cwd);
    return config;
  }

  if (type === "http") {
    if (!raw.url) return null;
    const config: HttpServerConfig = {
      type: "http",
      url: resolveEnvString(raw.url),
      source,
    };
    if (raw.headers) config.headers = resolveEnvRecord(raw.headers);
    return config;
  }

  if (type === "sse") {
    if (!raw.url) return null;
    const config: SseServerConfig = {
      type: "sse",
      url: resolveEnvString(raw.url),
      source,
    };
    if (raw.headers) config.headers = resolveEnvRecord(raw.headers);
    return config;
  }

  return null;
}

// ── Public API ──

/**
 * Get resolved config for a named MCP server.
 * Returns null if not found.
 */
export function getServerConfig(name: string): ServerConfig | null {
  const all = loadAllConfigs();
  const raw = all[name];
  if (!raw) return null;
  return normalizeConfig(name, raw);
}

/**
 * List all available MCP servers with name, type, and source.
 */
export function listServers(): ServerEntry[] {
  const all = loadAllConfigs();
  const entries: ServerEntry[] = [];
  for (const [name, raw] of Object.entries(all)) {
    const type = raw.type ?? (raw.command ? "stdio" : "unknown");
    entries.push({ name, type, source: raw._source ?? "unknown" });
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create an MCP transport from a resolved server config.
 * Returns a transport instance ready for client.connect().
 */
export async function createTransport(config: ServerConfig) {
  if (config.type === "stdio") {
    const { StdioClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/stdio.js"
    );
    return new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
      cwd: config.cwd,
      stderr: "pipe",
    });
  }

  if (config.type === "http") {
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );
    return new StreamableHTTPClientTransport(new URL(config.url), {
      requestInit: { headers: config.headers ?? {} },
    });
  }

  if (config.type === "sse") {
    const { SSEClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/sse.js"
    );
    return new SSEClientTransport(new URL(config.url), {
      requestInit: { headers: config.headers ?? {} },
    });
  }

  throw new Error(`Unsupported transport type: ${(config as any).type}`);
}

// ── CLI ──

const args = process.argv.slice(2);
const command = args[0];

if (command === "list") {
  const servers = listServers();
  console.log(JSON.stringify(servers, null, 2));
} else if (command === "get") {
  const name = args[1];
  if (!name) {
    console.error("Usage: bun mcp-client.ts get <server-name>");
    process.exit(1);
  }
  const config = getServerConfig(name);
  if (!config) {
    const available = listServers().map((s) => s.name);
    console.error(`Server "${name}" not found. Available: ${available.join(", ")}`);
    process.exit(1);
  }
  console.log(JSON.stringify(config, null, 2));
} else if (command) {
  console.error(`Unknown command: ${command}\nUsage: bun mcp-client.ts [list | get <name>]`);
  process.exit(1);
}
// If no CLI args, this file is being imported as a module — do nothing.
