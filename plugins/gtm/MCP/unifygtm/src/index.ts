#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const BASE_URL = "https://api.unifygtm.com/data/v1";

// Get API key from environment
const API_KEY = process.env.UNIFYGTM_API_KEY ?? "";

if (!API_KEY) {
  console.error("Error: UNIFYGTM_API_KEY environment variable is required");
  process.exit(1);
}

// HTTP helper for UnifyGTM API calls
async function unifyRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "X-Api-Key": API_KEY,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`UnifyGTM API error (${response.status}): ${errorText}`);
  }

  // Handle empty responses (e.g., DELETE)
  const text = await response.text();
  if (!text) {
    return { success: true };
  }

  return JSON.parse(text);
}

// Tool definitions
const tools = [
  {
    name: "list_objects",
    description: "List all objects in UnifyGTM",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_object",
    description: "Get details of a specific object by name",
    inputSchema: {
      type: "object" as const,
      properties: {
        object_name: {
          type: "string",
          description: "The name of the object to retrieve",
        },
      },
      required: ["object_name"],
    },
  },
  {
    name: "create_object",
    description: "Create a new object in UnifyGTM",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "The name of the object to create",
        },
        display_name: {
          type: "string",
          description: "The display name of the object",
        },
        description: {
          type: "string",
          description: "Description of the object",
        },
        fields: {
          type: "array",
          description: "Array of field definitions for the object",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              display_name: { type: "string" },
              description: { type: "string" },
            },
          },
        },
      },
      required: ["name"],
    },
  },
  {
    name: "list_records",
    description: "List records for an object with optional pagination",
    inputSchema: {
      type: "object" as const,
      properties: {
        object_name: {
          type: "string",
          description: "The name of the object to list records from",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return (default: 100)",
        },
        offset: {
          type: "number",
          description: "Number of records to skip for pagination (default: 0)",
        },
      },
      required: ["object_name"],
    },
  },
  {
    name: "get_record",
    description: "Get a specific record by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        object_name: {
          type: "string",
          description: "The name of the object",
        },
        record_id: {
          type: "string",
          description: "The ID of the record to retrieve",
        },
      },
      required: ["object_name", "record_id"],
    },
  },
  {
    name: "create_record",
    description: "Create a new record in an object",
    inputSchema: {
      type: "object" as const,
      properties: {
        object_name: {
          type: "string",
          description: "The name of the object to create a record in",
        },
        data: {
          type: "object",
          description: "The record data as key-value pairs",
        },
      },
      required: ["object_name", "data"],
    },
  },
  {
    name: "update_record",
    description: "Update an existing record",
    inputSchema: {
      type: "object" as const,
      properties: {
        object_name: {
          type: "string",
          description: "The name of the object",
        },
        record_id: {
          type: "string",
          description: "The ID of the record to update",
        },
        data: {
          type: "object",
          description: "The updated record data as key-value pairs",
        },
      },
      required: ["object_name", "record_id", "data"],
    },
  },
  {
    name: "delete_record",
    description: "Delete a record",
    inputSchema: {
      type: "object" as const,
      properties: {
        object_name: {
          type: "string",
          description: "The name of the object",
        },
        record_id: {
          type: "string",
          description: "The ID of the record to delete",
        },
      },
      required: ["object_name", "record_id"],
    },
  },
];

// Zod schemas for input validation
const ListObjectsSchema = z.object({});

const GetObjectSchema = z.object({
  object_name: z.string(),
});

const CreateObjectSchema = z.object({
  name: z.string(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    display_name: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
});

const ListRecordsSchema = z.object({
  object_name: z.string(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

const GetRecordSchema = z.object({
  object_name: z.string(),
  record_id: z.string(),
});

const CreateRecordSchema = z.object({
  object_name: z.string(),
  data: z.record(z.unknown()),
});

const UpdateRecordSchema = z.object({
  object_name: z.string(),
  record_id: z.string(),
  data: z.record(z.unknown()),
});

const DeleteRecordSchema = z.object({
  object_name: z.string(),
  record_id: z.string(),
});

// Create server
const server = new Server(
  {
    name: "unifygtm",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case "list_objects": {
        ListObjectsSchema.parse(args);
        result = await unifyRequest("GET", "/objects");
        break;
      }

      case "get_object": {
        const { object_name } = GetObjectSchema.parse(args);
        result = await unifyRequest("GET", `/objects/${encodeURIComponent(object_name)}`);
        break;
      }

      case "create_object": {
        const params = CreateObjectSchema.parse(args);
        result = await unifyRequest("POST", "/objects", params);
        break;
      }

      case "list_records": {
        const { object_name, limit, offset } = ListRecordsSchema.parse(args);
        const queryParams = new URLSearchParams();
        if (limit !== undefined) queryParams.set("limit", limit.toString());
        if (offset !== undefined) queryParams.set("offset", offset.toString());
        const queryString = queryParams.toString();
        const path = `/objects/${encodeURIComponent(object_name)}/records${queryString ? `?${queryString}` : ""}`;
        result = await unifyRequest("GET", path);
        break;
      }

      case "get_record": {
        const { object_name, record_id } = GetRecordSchema.parse(args);
        result = await unifyRequest(
          "GET",
          `/objects/${encodeURIComponent(object_name)}/records/${encodeURIComponent(record_id)}`
        );
        break;
      }

      case "create_record": {
        const { object_name, data } = CreateRecordSchema.parse(args);
        result = await unifyRequest(
          "POST",
          `/objects/${encodeURIComponent(object_name)}/records`,
          data
        );
        break;
      }

      case "update_record": {
        const { object_name, record_id, data } = UpdateRecordSchema.parse(args);
        result = await unifyRequest(
          "PATCH",
          `/objects/${encodeURIComponent(object_name)}/records/${encodeURIComponent(record_id)}`,
          data
        );
        break;
      }

      case "delete_record": {
        const { object_name, record_id } = DeleteRecordSchema.parse(args);
        result = await unifyRequest(
          "DELETE",
          `/objects/${encodeURIComponent(object_name)}/records/${encodeURIComponent(record_id)}`
        );
        break;
      }

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("UnifyGTM MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
