Use when: Writing code-mode scripts for specific use cases
Priority: P2
Impact: Without this, Claude Code may generate scripts with subtle errors

---

# Full Worked Examples

## Example 1: Figma design token extraction

Get design tokens in multiple formats from a single Figma file.

```typescript
#!/usr/bin/env bun
import { getServerConfig, createTransport } from "<path-to-skill>/scripts/mcp-client.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const config = getServerConfig("figma-console");
if (!config) { console.error("figma-console not configured"); process.exit(1); }

const client = new Client({ name: "cc-code-mode", version: "1.0.0" });
const transport = await createTransport(config);

const FILE_URL = "https://www.figma.com/design/FILE_KEY/File-Name";

try {
  await client.connect(transport);

  // Get tokens in CSS
  const css = await client.callTool({
    name: "figma_get_variables",
    arguments: { fileUrl: FILE_URL, format: "css", verbosity: "standard" },
  });
  if (css.isError) throw new Error(`CSS tokens failed: ${JSON.stringify(css.content)}`);

  // Get tokens in Tailwind
  const tailwind = await client.callTool({
    name: "figma_get_variables",
    arguments: { fileUrl: FILE_URL, format: "tailwind", verbosity: "standard" },
  });
  if (tailwind.isError) throw new Error(`Tailwind tokens failed: ${JSON.stringify(tailwind.content)}`);

  // Get tokens in TypeScript
  const ts = await client.callTool({
    name: "figma_get_variables",
    arguments: { fileUrl: FILE_URL, format: "typescript", verbosity: "standard" },
  });
  if (ts.isError) throw new Error(`TS tokens failed: ${JSON.stringify(ts.content)}`);

  console.log(JSON.stringify({
    css: css.content,
    tailwind: tailwind.content,
    typescript: ts.content,
  }));
} finally {
  await client.close();
}
```

## Example 2: Batch tool calls with a list

Process a list of items using the same tool repeatedly.

```typescript
#!/usr/bin/env bun
import { getServerConfig, createTransport } from "<path-to-skill>/scripts/mcp-client.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const config = getServerConfig("figma-console");
if (!config) { console.error("figma-console not configured"); process.exit(1); }

const client = new Client({ name: "cc-code-mode", version: "1.0.0" });
const transport = await createTransport(config);

const componentIds = ["123:456", "789:012", "345:678"];

try {
  await client.connect(transport);

  const results = [];
  for (const nodeId of componentIds) {
    const result = await client.callTool({
      name: "figma_get_component",
      arguments: {
        nodeId,
        fileUrl: "https://www.figma.com/design/FILE_KEY/...",
      },
    });
    if (result.isError) {
      results.push({ nodeId, error: result.content });
    } else {
      results.push({ nodeId, data: result.content });
    }
  }

  console.log(JSON.stringify(results));
} finally {
  await client.close();
}
```

## Example 3: Tool discovery

Discover what tools a server provides and their schemas.

```typescript
#!/usr/bin/env bun
import { getServerConfig, createTransport } from "<path-to-skill>/scripts/mcp-client.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const serverName = process.argv[2] || "figma-console";
const config = getServerConfig(serverName);
if (!config) { console.error(`Server "${serverName}" not found`); process.exit(1); }

const client = new Client({ name: "cc-code-mode", version: "1.0.0" });
const transport = await createTransport(config);

try {
  await client.connect(transport);
  const { tools } = await client.listTools();

  console.log(JSON.stringify(
    tools.map((t) => ({
      name: t.name,
      description: t.description?.slice(0, 100),
      params: Object.keys(t.inputSchema?.properties ?? {}),
    })),
    null,
    2,
  ));
} finally {
  await client.close();
}
```

## Example 4: Chaining results between calls

Use the output of one tool as input to another.

```typescript
#!/usr/bin/env bun
import { getServerConfig, createTransport } from "<path-to-skill>/scripts/mcp-client.ts";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const config = getServerConfig("figma-console");
if (!config) process.exit(1);

const client = new Client({ name: "cc-code-mode", version: "1.0.0" });
const transport = await createTransport(config);

try {
  await client.connect(transport);

  // Step 1: Get file structure
  const file = await client.callTool({
    name: "figma_get_file_data",
    arguments: {
      fileUrl: "https://www.figma.com/design/FILE_KEY/...",
      depth: 2,
      verbosity: "summary",
    },
  });
  if (file.isError) throw new Error(JSON.stringify(file.content));

  // Step 2: Parse to find a specific node (done in script, not via tool)
  const fileText = file.content.find((c: any) => c.type === "text")?.text ?? "";
  const parsed = JSON.parse(fileText);
  const targetNodeId = parsed.document?.children?.[0]?.id;

  if (!targetNodeId) {
    console.log(JSON.stringify({ error: "No nodes found in file" }));
  } else {
    // Step 3: Take screenshot of that node
    const screenshot = await client.callTool({
      name: "figma_take_screenshot",
      arguments: {
        fileUrl: "https://www.figma.com/design/FILE_KEY/...",
        nodeId: targetNodeId,
      },
    });

    console.log(JSON.stringify({
      nodeId: targetNodeId,
      screenshot: screenshot.content,
    }));
  }
} finally {
  await client.close();
}
```
