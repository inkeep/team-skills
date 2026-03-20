Use when: Connecting to servers with specific transport requirements
Priority: P2
Impact: Without this, scripts may use wrong transport or miss required headers

---

# Transport Patterns

`createTransport(config)` handles transport selection automatically. This reference covers the internals for when you need manual control.

## stdio (local process)

Used for MCP servers that run as local CLI tools (npx, globally installed, etc.).

```typescript
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "some-mcp-server"],
  env: {
    API_KEY: "...",        // MUST be explicit — SDK filters process.env
    ENABLE_FEATURE: "true",
  },
  stderr: "pipe",          // capture server logs (default: "inherit")
  cwd: "/some/dir",        // optional working directory
});
```

**Critical:** The SDK only passes a safe allowlist of env vars to child processes (HOME, PATH, USER, etc.). Any env var the server needs MUST be in the `env` option. `createTransport()` handles this from the resolved config.

**Stderr:** Default is `"inherit"` (server logs go to your terminal). Use `"pipe"` to capture them. After transport is created, access via `transport.stderr` (a PassThrough stream).

## http (Streamable HTTP)

Used for remote MCP servers with Streamable HTTP transport (the modern standard).

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://mcp.example.com/mcp"),
  {
    requestInit: {
      headers: {
        Authorization: "Bearer sk-...",
        "X-Custom": "value",
      },
    },
  },
);
```

## sse (Server-Sent Events — deprecated)

Legacy transport. Same API pattern as http but uses SSE for streaming.

```typescript
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("https://api.example.com/sse"),
  {
    requestInit: {
      headers: { Authorization: "Bearer sk-..." },
    },
  },
);
```

## Transport lifecycle

All transports follow the same lifecycle:

1. `client.connect(transport)` — calls `transport.start()`, sends `initialize`, receives capabilities
2. `client.callTool(...)` — sends JSON-RPC request, waits for response
3. `client.close()` — calls `transport.close()`
   - stdio: sends EOF to stdin → SIGTERM (2s) → SIGKILL (2s)
   - http/sse: closes the HTTP connection
