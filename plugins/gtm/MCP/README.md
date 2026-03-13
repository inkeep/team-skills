# MCP Servers for GTM Workflows

This folder contains MCP (Model Context Protocol) servers for GTM analytics and workflows.

## Quick Setup

### HTTP Servers (hosted services)

```bash
# Figma - design tools and Code Connect
claude mcp add figma -t http -s user -- https://mcp.figma.com/mcp

# PostHog - product analytics
claude mcp add posthog -t http -s user -- https://mcp.posthog.com/mcp

# Crustdata - company/person enrichment
claude mcp add crustdata -t http -s user -- https://agents-demos-internal.preview.inkeep.com/meeting-prep-assistant/crustdata/mcp
```

### NPX Servers (npm packages)

```bash
# HubSpot - CRM operations
claude mcp add hubspot -s user -- npx -y hubspot-mcp

# Playwright - browser automation
claude mcp add playwright -s user -- npx -y @playwright/mcp@latest
```

### Local Servers (from this repo)

Clone this repo, then build and add each server:

#### UnifyGTM

```bash
cd MCP/unifygtm
npm install && npm run build
claude mcp add unifygtm -s user -e UNIFYGTM_API_KEY="your-api-key" -- node $(pwd)/build/index.js
```

#### LinkedIn Ads

```bash
cd MCP/linkedin-ads
npm install && npm run build

# Run OAuth helper to get access token (requires client credentials)
LINKEDIN_CLIENT_ID="your-client-id" LINKEDIN_CLIENT_SECRET="your-secret" node oauth-helper.cjs

# Add the server with your token
claude mcp add linkedin-ads -s user -e LINKEDIN_ACCESS_TOKEN="your-token" -e LINKEDIN_AD_ACCOUNT_ID="your-account-id" -- node $(pwd)/build/index.js
```

#### Outreach Analytics

```bash
cd MCP/outreach-analytics
npm install && npm run build

# Copy and configure environment
cp .env.example .env
# Edit .env with your Outreach credentials

claude mcp add outreach-analytics -s user -- node $(pwd)/dist/index.js
```

## Verify Installation

```bash
claude mcp list
```

## Server Capabilities

| Server | Description |
|--------|-------------|
| **figma** | Read designs, create FigJam diagrams, Code Connect mappings |
| **posthog** | Query events, dashboards, feature flags, experiments |
| **crustdata** | Enrich company/person data by domain or LinkedIn |
| **hubspot** | CRM - contacts, companies, deals, tickets, meetings |
| **playwright** | Browser automation, screenshots, form filling |
| **unifygtm** | UnifyGTM API - objects and records |
| **linkedin-ads** | LinkedIn campaign analytics and reporting |
| **outreach-analytics** | Outreach sequence analytics and prospect data |
