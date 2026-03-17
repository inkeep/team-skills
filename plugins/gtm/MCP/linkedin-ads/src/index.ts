#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// LinkedIn Marketing API configuration
const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_API_VERSION = "202401"; // January 2024 API version

// Environment variables
const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.LINKEDIN_AD_ACCOUNT_ID;

if (!ACCESS_TOKEN) {
  console.error("Error: LINKEDIN_ACCESS_TOKEN environment variable is required");
  process.exit(1);
}

if (!AD_ACCOUNT_ID) {
  console.error("Error: LINKEDIN_AD_ACCOUNT_ID environment variable is required");
  process.exit(1);
}

// Helper function for LinkedIn API requests
async function linkedinRequest(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any> {
  const url = new URL(`${LINKEDIN_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "LinkedIn-Version": LINKEDIN_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Analytics query helper
async function getAdAnalytics(
  startDate: string,
  endDate: string,
  granularity: string = "DAILY",
  campaignIds?: string[]
): Promise<any> {
  const dateRange = `(start:(year:${startDate.split("-")[0]},month:${parseInt(startDate.split("-")[1])},day:${parseInt(startDate.split("-")[2])}),end:(year:${endDate.split("-")[0]},month:${parseInt(endDate.split("-")[1])},day:${parseInt(endDate.split("-")[2])}))`;

  let accounts = `List(urn:li:sponsoredAccount:${AD_ACCOUNT_ID})`;
  let campaigns = campaignIds
    ? `&campaigns=List(${campaignIds.map(id => `urn:li:sponsoredCampaign:${id}`).join(",")})`
    : "";

  const fields = [
    "impressions",
    "clicks",
    "costInLocalCurrency",
    "costInUsd",
    "externalWebsiteConversions",
    "externalWebsitePostClickConversions",
    "externalWebsitePostViewConversions",
    "leads",
    "landingPageClicks",
    "reactions",
    "comments",
    "shares",
    "follows",
    "videoViews",
    "videoFirstQuartileCompletions",
    "videoMidpointCompletions",
    "videoThirdQuartileCompletions",
    "videoCompletions",
  ].join(",");

  const endpoint = `/adAnalytics?q=analytics&dateRange=${encodeURIComponent(dateRange)}&timeGranularity=${granularity}&accounts=${encodeURIComponent(accounts)}${campaigns}&fields=${fields}&pivot=CAMPAIGN`;

  return linkedinRequest(endpoint);
}

// Create server instance
const server = new Server(
  {
    name: "linkedin-ads-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools = [
  {
    name: "list_campaigns",
    description: "List all campaigns in the LinkedIn ad account with their status, budget, and targeting info",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["ACTIVE", "PAUSED", "ARCHIVED", "COMPLETED", "CANCELED", "DRAFT"],
          description: "Filter by campaign status (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of campaigns to return (default: 50)",
        },
      },
    },
  },
  {
    name: "get_campaign",
    description: "Get detailed information about a specific campaign",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaign_id: {
          type: "string",
          description: "The campaign ID",
        },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "get_campaign_analytics",
    description: "Get performance analytics for campaigns including impressions, clicks, spend, conversions, video metrics, and engagement",
    inputSchema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        end_date: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
        campaign_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of campaign IDs to filter (if empty, returns all campaigns)",
        },
        granularity: {
          type: "string",
          enum: ["DAILY", "MONTHLY", "ALL"],
          description: "Time granularity for metrics (default: DAILY)",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_account_summary",
    description: "Get a high-level summary of ad account performance for a date range",
    inputSchema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        end_date: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "list_campaign_groups",
    description: "List all campaign groups in the ad account",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["ACTIVE", "PAUSED", "ARCHIVED", "CANCELED", "DRAFT"],
          description: "Filter by campaign group status (optional)",
        },
      },
    },
  },
  {
    name: "get_creatives",
    description: "List creatives/ads for a specific campaign",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaign_id: {
          type: "string",
          description: "The campaign ID to get creatives for",
        },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "get_conversion_tracking",
    description: "Get conversion tracking data and conversion events",
    inputSchema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "Start date in YYYY-MM-DD format",
        },
        end_date: {
          type: "string",
          description: "End date in YYYY-MM-DD format",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_campaigns": {
        const limit = (args as any)?.limit || 50;
        const status = (args as any)?.status;

        let endpoint = `/adAccounts/${AD_ACCOUNT_ID}/adCampaigns?count=${limit}`;
        if (status) {
          endpoint += `&search=(status:(values:List(${status})))`;
        }

        const response = await linkedinRequest(endpoint);

        // Format the response
        const campaigns = response.elements?.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          type: campaign.type,
          objectiveType: campaign.objectiveType,
          dailyBudget: campaign.dailyBudget,
          totalBudget: campaign.totalBudget,
          runSchedule: campaign.runSchedule,
          createdAt: campaign.createdAt,
          lastModifiedAt: campaign.lastModifiedAt,
        })) || [];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ campaigns, total: campaigns.length }, null, 2),
            },
          ],
        };
      }

      case "get_campaign": {
        const campaignId = (args as any).campaign_id;
        const response = await linkedinRequest(`/adCampaigns/${campaignId}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "get_campaign_analytics": {
        const startDate = (args as any).start_date;
        const endDate = (args as any).end_date;
        const campaignIds = (args as any).campaign_ids;
        const granularity = (args as any).granularity || "DAILY";

        const response = await getAdAnalytics(startDate, endDate, granularity, campaignIds);

        // Calculate summary metrics
        const elements = response.elements || [];
        const summary = elements.reduce((acc: any, el: any) => {
          acc.totalImpressions += el.impressions || 0;
          acc.totalClicks += el.clicks || 0;
          acc.totalSpend += el.costInUsd || 0;
          acc.totalConversions += el.externalWebsiteConversions || 0;
          acc.totalLeads += el.leads || 0;
          acc.totalVideoViews += el.videoViews || 0;
          acc.totalReactions += el.reactions || 0;
          return acc;
        }, {
          totalImpressions: 0,
          totalClicks: 0,
          totalSpend: 0,
          totalConversions: 0,
          totalLeads: 0,
          totalVideoViews: 0,
          totalReactions: 0,
        });

        // Calculate rates
        summary.ctr = summary.totalImpressions > 0
          ? ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2) + "%"
          : "0%";
        summary.cpc = summary.totalClicks > 0
          ? "$" + (summary.totalSpend / summary.totalClicks).toFixed(2)
          : "$0.00";
        summary.cpm = summary.totalImpressions > 0
          ? "$" + ((summary.totalSpend / summary.totalImpressions) * 1000).toFixed(2)
          : "$0.00";
        summary.costPerConversion = summary.totalConversions > 0
          ? "$" + (summary.totalSpend / summary.totalConversions).toFixed(2)
          : "N/A";
        summary.totalSpend = "$" + summary.totalSpend.toFixed(2);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                dateRange: { start: startDate, end: endDate },
                granularity,
                summary,
                dailyData: elements,
              }, null, 2),
            },
          ],
        };
      }

      case "get_account_summary": {
        const startDate = (args as any).start_date;
        const endDate = (args as any).end_date;

        // Get analytics with ALL granularity for summary
        const response = await getAdAnalytics(startDate, endDate, "ALL");

        // Get campaign count
        const campaignsResponse = await linkedinRequest(
          `/adAccounts/${AD_ACCOUNT_ID}/adCampaigns?count=1`
        );

        const elements = response.elements || [];
        const totalMetrics = elements.reduce((acc: any, el: any) => {
          acc.impressions += el.impressions || 0;
          acc.clicks += el.clicks || 0;
          acc.spend += el.costInUsd || 0;
          acc.conversions += el.externalWebsiteConversions || 0;
          acc.leads += el.leads || 0;
          acc.videoViews += el.videoViews || 0;
          acc.reactions += el.reactions || 0;
          acc.comments += el.comments || 0;
          acc.shares += el.shares || 0;
          acc.follows += el.follows || 0;
          return acc;
        }, {
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          leads: 0,
          videoViews: 0,
          reactions: 0,
          comments: 0,
          shares: 0,
          follows: 0,
        });

        const summary = {
          dateRange: { start: startDate, end: endDate },
          adAccountId: AD_ACCOUNT_ID,
          performance: {
            impressions: totalMetrics.impressions.toLocaleString(),
            clicks: totalMetrics.clicks.toLocaleString(),
            ctr: totalMetrics.impressions > 0
              ? ((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2) + "%"
              : "0%",
            spend: "$" + totalMetrics.spend.toFixed(2),
            cpc: totalMetrics.clicks > 0
              ? "$" + (totalMetrics.spend / totalMetrics.clicks).toFixed(2)
              : "$0.00",
            cpm: totalMetrics.impressions > 0
              ? "$" + ((totalMetrics.spend / totalMetrics.impressions) * 1000).toFixed(2)
              : "$0.00",
          },
          conversions: {
            total: totalMetrics.conversions,
            leads: totalMetrics.leads,
            costPerConversion: totalMetrics.conversions > 0
              ? "$" + (totalMetrics.spend / totalMetrics.conversions).toFixed(2)
              : "N/A",
            costPerLead: totalMetrics.leads > 0
              ? "$" + (totalMetrics.spend / totalMetrics.leads).toFixed(2)
              : "N/A",
          },
          engagement: {
            reactions: totalMetrics.reactions,
            comments: totalMetrics.comments,
            shares: totalMetrics.shares,
            follows: totalMetrics.follows,
            videoViews: totalMetrics.videoViews,
          },
          campaignCount: campaignsResponse.paging?.total || "Unknown",
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case "list_campaign_groups": {
        const status = (args as any)?.status;
        let endpoint = `/adAccounts/${AD_ACCOUNT_ID}/adCampaignGroups`;
        if (status) {
          endpoint += `?search=(status:(values:List(${status})))`;
        }

        const response = await linkedinRequest(endpoint);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "get_creatives": {
        const campaignId = (args as any).campaign_id;
        const response = await linkedinRequest(
          `/adAccounts/${AD_ACCOUNT_ID}/creatives?search=(campaign:(values:List(urn:li:sponsoredCampaign:${campaignId})))`
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "get_conversion_tracking": {
        const startDate = (args as any).start_date;
        const endDate = (args as any).end_date;

        // Get conversion analytics with conversion breakdown
        const dateRange = `(start:(year:${startDate.split("-")[0]},month:${parseInt(startDate.split("-")[1])},day:${parseInt(startDate.split("-")[2])}),end:(year:${endDate.split("-")[0]},month:${parseInt(endDate.split("-")[1])},day:${parseInt(endDate.split("-")[2])}))`;

        const endpoint = `/adAnalytics?q=analytics&dateRange=${encodeURIComponent(dateRange)}&timeGranularity=ALL&accounts=List(urn:li:sponsoredAccount:${AD_ACCOUNT_ID})&fields=externalWebsiteConversions,externalWebsitePostClickConversions,externalWebsitePostViewConversions,leads,oneClickLeads,talentLeads&pivot=CAMPAIGN`;

        const response = await linkedinRequest(endpoint);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
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
  console.error("LinkedIn Ads MCP server running on stdio");
}

main().catch(console.error);
