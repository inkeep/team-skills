# Evidence: Triggers System & MCP Patterns

**Dimension:** 2.0 Trigger/MCP Architecture (auto-reply/triage enablement)
**Date:** 2026-02-19
**Sources:** Inkeep 2.0 codebase (agents-api, agents-sdk, agents-cookbook)

---

## Key files referenced
- `agents-api/src/domains/run/services/TriggerService.ts` — Webhook trigger processing
- `agents-api/src/domains/run/routes/webhooks.ts` — Webhook endpoint handler
- `agents-api/src/domains/manage/routes/triggers.ts` — Trigger CRUD + invocation endpoints
- `agents-api/src/domains/run/services/ScheduledTriggerService.ts` — Cron/one-time scheduling
- `agents-cookbook/template-mcps/zendesk/mcp/route.ts` — Zendesk MCP server implementation
- `agents-cookbook/template-projects/customer-support/tools/zendesk-mcp.ts` — Zendesk MCP integration
- `agents-cookbook/template-projects/meeting-prep/` — Meeting prep agent pattern
- `agents-cookbook/template-projects/docs-assistant/tools/inkeep-rag-mcp.ts` — RAG MCP integration

---

## Findings

### Finding: Webhook triggers provide full auto-reply/triage pipeline
**Confidence:** CONFIRMED
**Evidence:** Webhook trigger flow:
1. External service (e.g., Zendesk) sends JSON payload to `POST /run/tenants/{tenantId}/projects/{projectId}/agents/{agentId}/triggers/{triggerId}`
2. TriggerService validates: auth headers, HMAC signature verification, input schema (JSON Schema via AJV)
3. Payload transformed via JMESPath expressions or object rules
4. Message built from `messageTemplate` with payload interpolation
5. Agent executed asynchronously via `dispatchExecution()`

**Key capabilities:**
- HMAC-SHA256 signature verification (configurable header/algorithm)
- Credential integration for signing secrets (Nango or Keychain with 5-minute cache)
- JSON Schema input validation with detailed error reporting
- JMESPath payload transformation
- Message template interpolation
- Async execution with Vercel `waitUntil()` support

### Finding: Scheduled triggers support cron + one-time with retry logic
**Confidence:** CONFIRMED
**Evidence:** Two modes: cron expression (UTC or custom timezone) OR one-time `runAt` timestamp. Each trigger spawns a workflow runner via `@workflow/api`. Features: configurable maxRetries (default 1), retryDelaySeconds (60), timeoutSeconds (780). Supports manual run, rerun from previous invocation, cancellation. Dashboard endpoint lists upcoming runs across all triggers.

### Finding: Zendesk MCP server exists as cookbook template with 4 tools
**Confidence:** CONFIRMED
**Evidence:** `agents-cookbook/template-mcps/zendesk/mcp/route.ts` exposes:
- `create_zendesk_ticket` — Create with subject, description, priority, type, tags, assignee
- `get_zendesk_ticket` — Fetch by ID
- `update_zendesk_ticket` — Update fields + add comments
- `list_zendesk_tickets` — Paginated with status/assignee filters

Auth: Headers-based (zendesk-subdomain, zendesk-email, zendesk-token). Basic auth over Zendesk REST API v2.

### Finding: Customer support template demonstrates the full auto-reply pattern
**Confidence:** CONFIRMED
**Evidence:** `agents-cookbook/template-projects/customer-support/` implements:
- Multi-agent system with delegation: Support Coordinator → Knowledge Base Agent → Zendesk Agent
- Knowledge Base Agent uses Inkeep RAG MCP for documentation research
- Zendesk Agent uses Zendesk MCP for ticket creation/updates
- Coordinator routes between them based on inquiry type
- Data components (TicketCard) for structured UI rendering

### Finding: Inkeep RAG exposed as MCP at two endpoints
**Confidence:** CONFIRMED
**Evidence:**
- `https://agents.inkeep.com/mcp` — Cloud-hosted MCP wrapper for RAG
- `https://mcp.inkeep.com/inkeep/mcp` — Alternative endpoint with `search-inkeep-docs` tool
- Integration: `mcpTool({ serverUrl: '...', activeTools: ['search-inkeep-docs'] })`
- Agents use `.with({ selectedTools, headers })` to customize per-use

### Finding: Meeting prep agent template exists in cookbook
**Confidence:** CONFIRMED
**Evidence:** `agents-cookbook/template-projects/meeting-prep/` implements:
- Coordinator pattern with sequential delegation
- Company Research Sub-Agent using Exa web search MCP
- Meeting Finder Sub-Agent using Google Calendar MCP
- Output: prepared talking points + meeting context

### Finding: Slack MCP demonstrates role-based tool exposure
**Confidence:** CONFIRMED
**Evidence:** `agents-cookbook/template-mcps/slack/mcp/route.ts` shows:
- Headers-based auth for Slack token + channel info
- Role-based tool exposure (admin/moderator/user) based on `x-user-role` header
- Uses `@slack/web-api` WebClient
- Demonstrates conditional tool registration per request

---

## Implications

The 2.0 platform has all the building blocks for the auto-reply/triage use case:
1. **Webhook triggers**: Receive events from Zendesk (or any support platform)
2. **Agent execution**: Custom logic for classification, enrichment, response generation
3. **Inkeep RAG MCP**: Research product knowledge
4. **Zendesk MCP**: Take actions (reply, tag, route, escalate)
5. **Extensible MCPs**: Add CRM, APM, CDP, etc. for richer context

The gap is **template maturity** — the cookbook has the patterns but they're not yet packaged as turnkey templates. Professional services bridges this gap today.

---

## Gaps / follow-ups
- Zendesk MCP only has 4 tools — missing: search tickets, close ticket, merge tickets, manage tags, assignment routing
- No Freshdesk, Help Scout, or Intercom MCP templates yet
- Customer support template in cookbook needs polish for production use
- Scheduled trigger monitoring dashboard not fully documented
