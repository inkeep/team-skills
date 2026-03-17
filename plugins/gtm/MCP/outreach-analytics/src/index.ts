#!/usr/bin/env node
/**
 * Outreach Analytics MCP Server
 *
 * Provides read-only access to Outreach.io data for campaign analysis.
 */

import { config } from "dotenv";
config(); // Load .env file

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OutreachClient } from "./outreach-client.js";

const server = new McpServer({
  name: "outreach-analytics",
  version: "1.0.0",
});

let client: OutreachClient;

// ============================================================================
// SEQUENCES
// ============================================================================

server.registerTool(
  "list_sequences",
  {
    description:
      "List all sequences with their stats. Use this to see all your outreach campaigns.",
    inputSchema: {
      limit: z.number().min(1).max(100).optional().default(50)
        .describe("Number of sequences to return (max 100)"),
      filter_enabled: z.boolean().optional()
        .describe("Filter by enabled/disabled status"),
    },
  },
  async ({ limit, filter_enabled }) => {
    let endpoint = `/sequences?page[limit]=${limit}`;
    if (filter_enabled !== undefined) {
      endpoint += `&filter[enabled]=${filter_enabled}`;
    }

    const data = await client.get<any>(endpoint);

    // Format for readability
    const sequences = data.data.map((seq: any) => ({
      id: seq.id,
      name: seq.attributes.name,
      enabled: seq.attributes.enabled,
      sequenceType: seq.attributes.sequenceType,
      openCount: seq.attributes.openCount,
      clickCount: seq.attributes.clickCount,
      replyCount: seq.attributes.replyCount,
      bounceCount: seq.attributes.bounceCount,
      deliverCount: seq.attributes.deliverCount,
      scheduleCount: seq.attributes.scheduleCount,
      optOutCount: seq.attributes.optOutCount,
      createdAt: seq.attributes.createdAt,
      updatedAt: seq.attributes.updatedAt,
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ count: sequences.length, sequences }, null, 2),
      }],
    };
  }
);

server.registerTool(
  "get_sequence",
  {
    description:
      "Get detailed information about a specific sequence including all steps.",
    inputSchema: {
      sequence_id: z.number().describe("The sequence ID"),
    },
  },
  async ({ sequence_id }) => {
    const data = await client.get<any>(
      `/sequences/${sequence_id}?include=sequenceSteps`
    );

    const seq = data.data;
    const steps = data.included?.filter((i: any) => i.type === "sequenceStep") || [];

    const result = {
      id: seq.id,
      name: seq.attributes.name,
      enabled: seq.attributes.enabled,
      sequenceType: seq.attributes.sequenceType,
      stats: {
        openCount: seq.attributes.openCount,
        clickCount: seq.attributes.clickCount,
        replyCount: seq.attributes.replyCount,
        bounceCount: seq.attributes.bounceCount,
        deliverCount: seq.attributes.deliverCount,
        scheduleCount: seq.attributes.scheduleCount,
        optOutCount: seq.attributes.optOutCount,
      },
      steps: steps.map((step: any) => ({
        id: step.id,
        order: step.attributes.order,
        stepType: step.attributes.stepType,
        interval: step.attributes.interval,
        taskPriority: step.attributes.taskPriority,
      })),
      createdAt: seq.attributes.createdAt,
      updatedAt: seq.attributes.updatedAt,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.registerTool(
  "get_sequence_performance",
  {
    description:
      "Calculate performance metrics for a sequence (open rate, click rate, reply rate, etc.)",
    inputSchema: {
      sequence_id: z.number().describe("The sequence ID"),
    },
  },
  async ({ sequence_id }) => {
    const data = await client.get<any>(`/sequences/${sequence_id}`);
    const attrs = data.data.attributes;

    const delivered = attrs.deliverCount || 0;
    const opened = attrs.openCount || 0;
    const clicked = attrs.clickCount || 0;
    const replied = attrs.replyCount || 0;
    const bounced = attrs.bounceCount || 0;
    const optedOut = attrs.optOutCount || 0;

    const metrics = {
      sequenceId: sequence_id,
      sequenceName: attrs.name,
      totalDelivered: delivered,
      metrics: {
        openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(2) + "%" : "N/A",
        clickRate: delivered > 0 ? ((clicked / delivered) * 100).toFixed(2) + "%" : "N/A",
        replyRate: delivered > 0 ? ((replied / delivered) * 100).toFixed(2) + "%" : "N/A",
        bounceRate: delivered > 0 ? ((bounced / delivered) * 100).toFixed(2) + "%" : "N/A",
        optOutRate: delivered > 0 ? ((optedOut / delivered) * 100).toFixed(2) + "%" : "N/A",
      },
      rawCounts: {
        delivered,
        opened,
        clicked,
        replied,
        bounced,
        optedOut,
      },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }],
    };
  }
);

server.registerTool(
  "compare_sequences",
  {
    description:
      "Compare performance metrics across multiple sequences. Great for A/B testing analysis.",
    inputSchema: {
      sequence_ids: z.array(z.number()).min(2).max(10)
        .describe("Array of sequence IDs to compare"),
    },
  },
  async ({ sequence_ids }) => {
    const results = await Promise.all(
      sequence_ids.map(async (id) => {
        const data = await client.get<any>(`/sequences/${id}`);
        const attrs = data.data.attributes;
        const delivered = attrs.deliverCount || 0;

        return {
          id,
          name: attrs.name,
          delivered,
          openRate: delivered > 0 ? (attrs.openCount / delivered) * 100 : 0,
          clickRate: delivered > 0 ? (attrs.clickCount / delivered) * 100 : 0,
          replyRate: delivered > 0 ? (attrs.replyCount / delivered) * 100 : 0,
          bounceRate: delivered > 0 ? (attrs.bounceCount / delivered) * 100 : 0,
        };
      })
    );

    // Sort by reply rate (usually the most important metric)
    results.sort((a, b) => b.replyRate - a.replyRate);

    const comparison = results.map((r) => ({
      ...r,
      openRate: r.openRate.toFixed(2) + "%",
      clickRate: r.clickRate.toFixed(2) + "%",
      replyRate: r.replyRate.toFixed(2) + "%",
      bounceRate: r.bounceRate.toFixed(2) + "%",
    }));

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ comparison, sortedBy: "replyRate" }, null, 2),
      }],
    };
  }
);

// ============================================================================
// SEQUENCE STATES (Prospects in Sequences)
// ============================================================================

server.registerTool(
  "get_sequence_states",
  {
    description:
      "Get prospects in a sequence with their current state (active, paused, finished, failed).",
    inputSchema: {
      sequence_id: z.number().describe("The sequence ID"),
      state: z.enum(["active", "paused", "finished", "failed"]).optional()
        .describe("Filter by state"),
      limit: z.number().min(1).max(100).optional().default(50),
    },
  },
  async ({ sequence_id, state, limit }) => {
    let endpoint = `/sequenceStates?filter[sequence][id]=${sequence_id}&page[limit]=${limit}`;
    if (state) {
      endpoint += `&filter[state]=${state}`;
    }

    const data = await client.get<any>(endpoint);

    const states = data.data.map((s: any) => ({
      id: s.id,
      state: s.attributes.state,
      stateChangedAt: s.attributes.stateChangedAt,
      errorReason: s.attributes.errorReason,
      prospectId: s.relationships?.prospect?.data?.id,
      currentStep: s.attributes.currentStepIndex,
      createdAt: s.attributes.createdAt,
    }));

    // Summarize by state
    const summary = states.reduce((acc: any, s: any) => {
      acc[s.state] = (acc[s.state] || 0) + 1;
      return acc;
    }, {});

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ summary, count: states.length, states }, null, 2),
      }],
    };
  }
);

// ============================================================================
// MAILINGS (Email Analytics)
// ============================================================================

server.registerTool(
  "get_mailings",
  {
    description:
      "Get email mailings with detailed engagement data (opens, clicks, replies).",
    inputSchema: {
      sequence_id: z.number().optional()
        .describe("Filter by sequence ID"),
      limit: z.number().min(1).max(100).optional().default(50),
    },
  },
  async ({ sequence_id, limit }) => {
    let endpoint = `/mailings?page[limit]=${limit}`;
    if (sequence_id) {
      endpoint += `&filter[sequence][id]=${sequence_id}`;
    }

    const data = await client.get<any>(endpoint);

    const mailings = data.data.map((m: any) => ({
      id: m.id,
      state: m.attributes.mailboxState,
      subject: m.attributes.subject,
      openCount: m.attributes.openCount,
      clickCount: m.attributes.clickCount,
      repliedAt: m.attributes.repliedAt,
      bouncedAt: m.attributes.bouncedAt,
      deliveredAt: m.attributes.deliveredAt,
      sentAt: m.attributes.mailedAt,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify({ count: mailings.length, mailings }, null, 2) }],
    };
  }
);

// ============================================================================
// PROSPECTS
// ============================================================================

server.registerTool(
  "search_prospects",
  {
    description:
      "Search for prospects by email, name, or company.",
    inputSchema: {
      email: z.string().optional().describe("Filter by email (contains)"),
      company: z.string().optional().describe("Filter by company name"),
      limit: z.number().min(1).max(100).optional().default(25),
    },
  },
  async ({ email, company, limit }) => {
    let endpoint = `/prospects?page[limit]=${limit}`;
    if (email) {
      endpoint += `&filter[emails]=${encodeURIComponent(email)}`;
    }
    if (company) {
      endpoint += `&filter[company]=${encodeURIComponent(company)}`;
    }

    const data = await client.get<any>(endpoint);

    const prospects = data.data.map((p: any) => ({
      id: p.id,
      firstName: p.attributes.firstName,
      lastName: p.attributes.lastName,
      email: p.attributes.emails?.[0],
      company: p.attributes.company,
      title: p.attributes.title,
      engagedAt: p.attributes.engagedAt,
      createdAt: p.attributes.createdAt,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify({ count: prospects.length, prospects }, null, 2) }],
    };
  }
);

server.registerTool(
  "get_prospect",
  {
    description: "Get detailed information about a specific prospect.",
    inputSchema: {
      prospect_id: z.number().describe("The prospect ID"),
    },
  },
  async ({ prospect_id }) => {
    const data = await client.get<any>(`/prospects/${prospect_id}`);

    const p = data.data.attributes;
    const prospect = {
      id: data.data.id,
      name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      emails: p.emails,
      phones: p.homePhones || [],
      company: p.company,
      title: p.title,
      location: {
        city: p.addressCity,
        state: p.addressState,
        country: p.addressCountry,
      },
      engagement: {
        engagedAt: p.engagedAt,
        engagedScore: p.engagedScore,
        openCount: p.openCount,
        clickCount: p.clickCount,
        replyCount: p.replyCount,
      },
      tags: p.tags,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(prospect, null, 2) }],
    };
  }
);

// ============================================================================
// ACCOUNTS
// ============================================================================

server.registerTool(
  "list_accounts",
  {
    description: "List accounts (companies) in Outreach.",
    inputSchema: {
      limit: z.number().min(1).max(100).optional().default(50),
      name: z.string().optional().describe("Filter by account name"),
    },
  },
  async ({ limit, name }) => {
    let endpoint = `/accounts?page[limit]=${limit}`;
    if (name) {
      endpoint += `&filter[name]=${encodeURIComponent(name)}`;
    }

    const data = await client.get<any>(endpoint);

    const accounts = data.data.map((a: any) => ({
      id: a.id,
      name: a.attributes.name,
      domain: a.attributes.domain,
      industry: a.attributes.industry,
      numberOfEmployees: a.attributes.numberOfEmployees,
      createdAt: a.attributes.createdAt,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify({ count: accounts.length, accounts }, null, 2) }],
    };
  }
);

// ============================================================================
// ANALYTICS SUMMARY
// ============================================================================

server.registerTool(
  "get_campaign_summary",
  {
    description:
      "Get an overall summary of all active campaigns with aggregated metrics. Great for executive reporting.",
    inputSchema: {},
  },
  async () => {
    const data = await client.get<any>(`/sequences?filter[enabled]=true&page[limit]=100`);

    let totalDelivered = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalReplies = 0;
    let totalBounces = 0;

    const sequences = data.data.map((seq: any) => {
      const attrs = seq.attributes;
      totalDelivered += attrs.deliverCount || 0;
      totalOpens += attrs.openCount || 0;
      totalClicks += attrs.clickCount || 0;
      totalReplies += attrs.replyCount || 0;
      totalBounces += attrs.bounceCount || 0;

      return {
        id: seq.id,
        name: attrs.name,
        delivered: attrs.deliverCount || 0,
        replies: attrs.replyCount || 0,
      };
    });

    // Sort by replies
    sequences.sort((a: any, b: any) => b.replies - a.replies);

    const summary = {
      activeSequences: sequences.length,
      aggregateMetrics: {
        totalDelivered,
        totalOpens,
        totalClicks,
        totalReplies,
        totalBounces,
        overallOpenRate: totalDelivered > 0 ? ((totalOpens / totalDelivered) * 100).toFixed(2) + "%" : "N/A",
        overallClickRate: totalDelivered > 0 ? ((totalClicks / totalDelivered) * 100).toFixed(2) + "%" : "N/A",
        overallReplyRate: totalDelivered > 0 ? ((totalReplies / totalDelivered) * 100).toFixed(2) + "%" : "N/A",
      },
      topPerformers: sequences.slice(0, 5),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    };
  }
);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  try {
    client = new OutreachClient();
    console.error("Outreach client initialized");
  } catch (error) {
    console.error("Failed to initialize Outreach client:", error);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Outreach Analytics MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
