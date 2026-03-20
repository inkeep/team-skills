---
name: code-mode
description: "Write and execute scripts that call MCP tools programmatically via @modelcontextprotocol/sdk. Use when orchestrating multiple MCP tool calls (3+), batching operations, or chaining results across tools/servers. Triggers on: multi-tool workflow, batch MCP calls, code mode, programmatic MCP, chain tool results, cross-server orchestration."
---

# Code Mode

Write and execute Bun scripts that call MCP tools programmatically — multiple calls on a single persistent connection, without returning to the LLM between each call.

## When to use

- **Multi-tool orchestration:** 3+ MCP tool calls where intermediate results feed into subsequent calls
- **Batch operations:** Repeated calls with different parameters (e.g., process a list of items)
- **Cross-server workflows:** Combining results from different MCP servers
- **Token-heavy tool sets:** Servers with many tools (like figma-console's 63+) where loading all schemas wastes context

## When NOT to use

- Simple single-tool calls → use the normal tool-call loop
- Tools that require interactive OAuth → authenticate via `claude mcp` first, then use code-mode
- Operations that need human approval between steps → use normal tool-call loop

---

## The Pattern

Scripts are written to `/tmp/claude-code-mode/` (auto-cleaned on session end via hook). The SDK resolves via `NODE_PATH` pointing to the skill's `node_modules/`.

### Step 1: Write the script

```bash
mkdir -p /tmp/claude-code-mode
```

Write the script to `/tmp/claude-code-mode/_run.ts`:

```typescript
#!/usr/bin/env bun
import { getServerConfig, createTransport } from "<path-to-skill>/scripts/mcp-client.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const config = getServerConfig("SERVER_NAME");
if (!config) { console.error("Server not found"); process.exit(1); }

const client = new Client({ name: "cc-code-mode", version: "1.0.0" });
const transport = await createTransport(config);

try {
  await client.connect(transport);

  // Call tools — connection stays open between calls
  const result1 = await client.callTool({
    name: "tool_name",
    arguments: { key: "value" },
  });
  if (result1.isError) throw new Error(JSON.stringify(result1.content));

  const result2 = await client.callTool({
    name: "another_tool",
    arguments: { data: result1.content },
  });

  // Output structured JSON for Claude Code to parse
  console.log(JSON.stringify({ result1: result1.content, result2: result2.content }));
} catch (err) {
  console.error(JSON.stringify({ error: String(err) }));
  process.exit(1);
} finally {
  await client.close();
}
```

### Step 2: Execute the script

```bash
NODE_PATH=<path-to-skill>/scripts/node_modules bun /tmp/claude-code-mode/_run.ts
```

### Step 3: Parse and present results

Read stdout (JSON results) and stderr (server logs/errors). Present findings to the user.

---

## Helper API

The helper at `./mcp-client.ts` reads Claude Code's own config files — no duplicate configuration needed.

### `getServerConfig(name: string): ServerConfig | null`

Returns the resolved config for a named MCP server. Reads from all Claude Code config sources (plugins, user, project) and merges by precedence. Env vars are resolved (`${VAR}`, `${VAR:-default}`).

Returns `null` if the server is not configured.

### `listServers(): { name, type, source }[]`

Returns all available MCP servers with their transport type and config source.

### `createTransport(config: ServerConfig): Transport`

Creates the appropriate MCP transport (StdioClientTransport, StreamableHTTPClientTransport, or SSEClientTransport) from a resolved config. For stdio servers, env vars from the config are explicitly passed to the child process (the SDK filters env vars by default — this is handled automatically).

---

## Available servers

Before writing a script, check what's available:

```bash
bun <path-to-skill>/scripts/mcp-client.ts list
```

To inspect a specific server's resolved config:

```bash
bun <path-to-skill>/scripts/mcp-client.ts get figma-console
```

---

## Discovering tools

If you don't know a server's tools, use `listTools()`:

```typescript
await client.connect(transport);
const { tools } = await client.listTools();
console.log(JSON.stringify(tools.map(t => ({
  name: t.name,
  description: t.description,
  inputSchema: t.inputSchema,
}))));
```

---

## Critical rules

1. **Always use `try/finally` with `client.close()`.** MCP servers (especially stdio) are child processes. Without `close()`, they become orphans.

2. **Always check `isError`.** Tool errors are returned as `{ isError: true, content: [...] }`, NOT thrown. An unchecked error silently produces wrong results.

3. **Output JSON to stdout.** Claude Code reads the script's stdout. Use `console.log(JSON.stringify(...))` for results. Use `console.error()` for debugging — it goes to stderr.

4. **The connection is persistent.** After `client.connect()`, you can call `callTool()` as many times as needed. No reconnection between calls.

5. **Default timeout is 60s.** For slow tools, pass options: `client.callTool({ name, arguments }, { timeout: 120_000 })`.

---

## Error handling

**Load:** `references/error-handling.md` for detailed patterns.

Quick reference:

```typescript
// Tool-level error (returned, not thrown)
const result = await client.callTool({ name: "...", arguments: {} });
if (result.isError) {
  console.error("Tool error:", JSON.stringify(result.content));
  // Decide: skip, retry, or abort
}

// Connection/protocol error (thrown)
try {
  await client.connect(transport);
} catch (err) {
  console.error("Connection failed:", err);
  process.exit(1);
}

// Timeout
try {
  const result = await client.callTool(
    { name: "slow_tool", arguments: {} },
    { timeout: 120_000 },
  );
} catch (err) {
  if (err.message?.includes("timed out")) {
    console.error("Tool timed out");
  }
}
```

---

## Transport types

All three MCP transport types are supported. `createTransport()` auto-selects based on the config's `type` field.

**Load:** `references/transport-patterns.md` for details on each transport.

| Config type | Transport | Notes |
|---|---|---|
| `stdio` | StdioClientTransport | Local process. Env vars passed explicitly. |
| `http` | StreamableHTTPClientTransport | Remote server. Headers supported. |
| `sse` | SSEClientTransport | Legacy. Same API as http. |

---

## Examples

**Load:** `references/examples.md` for full worked examples.

### Multi-tool Figma workflow

```typescript
import { getServerConfig, createTransport } from "<path-to-skill>/scripts/mcp-client.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const config = getServerConfig("figma-console");
if (!config) { console.error("figma-console not configured"); process.exit(1); }

const client = new Client({ name: "cc-code-mode", version: "1.0.0" });
const transport = await createTransport(config);

try {
  await client.connect(transport);

  const tokens = await client.callTool({
    name: "figma_get_variables",
    arguments: { fileUrl: "https://figma.com/design/FILE/...", format: "css" },
  });

  const fileData = await client.callTool({
    name: "figma_get_file_data",
    arguments: { fileUrl: "https://figma.com/design/FILE/...", depth: 1 },
  });

  console.log(JSON.stringify({ tokens: tokens.content, fileData: fileData.content }));
} finally {
  await client.close();
}
```

### Cross-server workflow

```typescript
import { getServerConfig, createTransport } from "<path-to-skill>/scripts/mcp-client.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// Connect to server A
const configA = getServerConfig("server-a");
const clientA = new Client({ name: "cc-code-mode", version: "1.0.0" });
const transportA = await createTransport(configA!);

// Connect to server B
const configB = getServerConfig("server-b");
const clientB = new Client({ name: "cc-code-mode", version: "1.0.0" });
const transportB = await createTransport(configB!);

try {
  await clientA.connect(transportA);
  await clientB.connect(transportB);

  const dataA = await clientA.callTool({ name: "get_data", arguments: {} });
  const dataB = await clientB.callTool({
    name: "process_data",
    arguments: { input: dataA.content },
  });

  console.log(JSON.stringify({ dataA: dataA.content, dataB: dataB.content }));
} finally {
  await clientA.close();
  await clientB.close();
}
```
