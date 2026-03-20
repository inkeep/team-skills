Use when: Writing scripts that need robust error handling
Priority: P1
Impact: Without this, scripts silently produce wrong results or leave orphaned processes

---

# Error Handling Patterns

## Two error surfaces

MCP has two distinct error paths. Confusing them is the #1 source of bugs.

### 1. Protocol/SDK errors — THROWN as exceptions

Connection failures, timeouts, capability mismatches, and malformed responses throw exceptions.

```typescript
try {
  await client.connect(transport);
} catch (err) {
  // ProtocolError: server returned JSON-RPC error
  // SdkError: timeout, disconnection, capability mismatch
  console.error("Connection failed:", String(err));
  process.exit(1);
}
```

### 2. Tool errors — RETURNED in the result

When a tool executes but fails (bad input, internal error, missing resource), the error comes back in the result object — NOT as an exception.

```typescript
const result = await client.callTool({ name: "my_tool", arguments: { id: "bad" } });
// result.isError === true
// result.content === [{ type: "text", text: "Error: resource not found" }]
```

**If you don't check `isError`, the script continues with error content as if it were valid data.**

## The standard script template

```typescript
try {
  await client.connect(transport);

  const result = await client.callTool({ name: "...", arguments: {} });
  if (result.isError) {
    // Tool-level error — decide how to handle
    const errorText = result.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");
    console.error("Tool error:", errorText);
    // Options: skip this call, retry, or abort
  }

  console.log(JSON.stringify(result.content));
} catch (err) {
  // Protocol/connection error
  console.error(JSON.stringify({ error: String(err) }));
  process.exit(1);
} finally {
  // ALWAYS close — prevents orphaned child processes
  await client.close();
}
```

## Timeout handling

Default timeout is 60 seconds per request. For slow operations:

```typescript
const result = await client.callTool(
  { name: "figma_get_design_system_kit", arguments: { fileUrl: "..." } },
  { timeout: 120_000 }, // 2 minutes
);
```

Timeout errors are thrown (protocol-level), not returned.

## Retry pattern

```typescript
async function callWithRetry(
  client: Client,
  name: string,
  args: Record<string, unknown>,
  maxRetries = 2,
) {
  for (let i = 0; i <= maxRetries; i++) {
    const result = await client.callTool({ name, arguments: args });
    if (!result.isError) return result;
    if (i < maxRetries) {
      console.error(`Tool error (attempt ${i + 1}), retrying...`);
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error(`Tool ${name} failed after ${maxRetries + 1} attempts`);
}
```

## Orphan prevention

stdio MCP servers are child processes. If the script exits without `client.close()`, the child process becomes an orphan. The `finally` block is mandatory:

```typescript
try {
  await client.connect(transport);
  // ... calls ...
} finally {
  await client.close();
  // close() sends EOF to stdin, then SIGTERM after 2s, then SIGKILL after 2s
}
```
