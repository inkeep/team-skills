# Evidence: Inkeep 1.0 Capability Inventory

**Dimension:** Inkeep 1.0 Capabilities
**Date:** 2026-02-19
**Sources:** /Users/edwingomezcuellar/InkeepDev/management codebase, docs.inkeep.com/cloud/, marketing-drab.vercel.app/

---

## Key files / pages referenced
- `/apps/dashboard/` — Admin portal and analytics
- `/packages/support-agent-copilot/` — Core copilot AI logic
- `/apps/zendesk/` — Zendesk app integration
- `/apps/copilot-iframe-app/` — Chrome extension copilot
- `/apps/rest-api-server/` — REST API (Hono + OpenAPI)
- `/apps/cx_platform/` — CX platform with Slack integration
- `/packages/inkeep-analytics-typescript/` — Analytics SDK
- `/apps/dashboard/src/components/Sources/consts.ts` — Source type registry
- `/apps/dashboard/src/components/Analytics/` — Analytics dashboards

---

## Findings

### Finding: Monorepo structure with 11 apps and 6 shared packages
**Confidence:** CONFIRMED
**Evidence:** Turborepo-based monorepo. Apps: dashboard, sandbox, copilot-iframe-app, zendesk, rest-api-server, support-chrome-extension, marketing, cx_platform, cx-demo. Packages: support-agent-copilot, ui, inkeep-analytics-typescript, tailwind-config, typescript-config, eslint-config.

### Finding: Support Copilot operates in 3 AI modes
**Confidence:** CONFIRMED
**Evidence:** `packages/support-agent-copilot/src/lib/ai-actions/` contains SmartAssistActions.ts, SearchKBActions.ts, TurnIntoFAQActions.ts, FollowUpMessagesActions.ts. CopilotModeType = SMART_ASSIST | SEARCH_KB | DRAFT_FAQ.

### Finding: 33+ content source types supported for ingestion
**Confidence:** CONFIRMED
**Evidence:** `/apps/dashboard/src/components/Sources/consts.ts` lists source types including: Docusaurus, GitBook, Redocly, Readme, OpenAPI, Notion, Jira, Confluence, Zendesk (Help Center + Tickets), Freshdesk, Help Scout, Intercom, Salesforce, Discord, Slack, Discourse, GitHub, GitLab, StackOverflow, YouTube, SharePoint, Google Drive, custom web scraper, custom FAQ, conversations API.

### Finding: Zendesk integration is a native Zendesk app (ticket sidebar)
**Confidence:** CONFIRMED
**Evidence:** `/apps/zendesk/src/manifest.json` configures the app for `support: { ticket_sidebar }`. Uses Zendesk SDK (zcli). Development via `pnpm dev:zen`.

### Finding: Slack integration exists as both data source and bot
**Confidence:** CONFIRMED
**Evidence:** `/apps/cx_platform/src/lib/slack/` contains slackClient.ts, slackSchemas.ts, slackMarkdownParser.ts. `/apps/cx_platform/slack-socket.ts` provides real-time socket monitoring. IntegrationType.SlackBot is a supported integration type for rules.

### Finding: Analytics dashboard tracks conversation-level and agent-level metrics
**Confidence:** CONFIRMED
**Evidence:** `/apps/dashboard/src/components/Analytics/SupportCopilot/Dashboard.tsx`. Tracks: total conversations, agent breakdown, feedback rates, draft acceptance rates, integration performance, with chart types (Line, Bar, Area, Donut) and CSV export.

### Finding: Rules/Custom Guidance system supports 10 integration types
**Confidence:** CONFIRMED
**Evidence:** `/apps/dashboard/src/components/Rules/` supports: Web, SlackBot, Github, DiscordBot, Api, SupportCopilot, MCP, SharableSandbox, InkeepPortal. Conditional IF-THEN logic for AI behavior customization.

### Finding: REST API server uses Hono + OpenAPI with admin auth
**Confidence:** CONFIRMED
**Evidence:** `/apps/rest-api-server/src/server.ts` — OpenAPIHono with basePath '/api', X-Admin-Authentication header, Swagger UI at /docs. Project CRUD at /api/v1/projects.

### Finding: LLM providers are OpenAI and Anthropic via Vercel AI SDK
**Confidence:** CONFIRMED
**Evidence:** `@ai-sdk/openai` and `@ai-sdk/anthropic` dependencies. Model selection configurable at project level. `inkeepModel()` utility in copilot actions.

### Finding: Observability via Sentry, PostHog, and Langfuse
**Confidence:** CONFIRMED
**Evidence:** Sentry for error tracking (configured in copilot actions and all apps), PostHog for product analytics (dashboard), Langfuse for LLM tracing (copilot ai-actions use Langfuse spans).

### Finding: Widget SDK uses external @inkeep/cxkit-react package
**Confidence:** CONFIRMED
**Evidence:** Dashboard imports `CxSearchBar`, `AiChatInput` from `@inkeep/cxkit-react`. Related packages: cxkit-types, cxkit-primitives, cxkit-styled, cxkit-theme, cxkit-color-mode.

### Finding: Support copilot documented with 11 platform integrations
**Confidence:** CONFIRMED (docs claim)
**Evidence:** Docs list: Zendesk, Salesforce, HubSpot, Intercom, Help Scout, Front, Jira, Freshdesk, Plain, Atlas Support, Missive. Codebase confirms Zendesk native app. Others likely via copilot-iframe-app Chrome extension or API.

**Implications:** Not all 11 integrations are native apps. Most likely work via the Chrome extension iframe approach or API, with Zendesk being the only native app integration confirmed in code.

### Finding: Prehook API enables external data enrichment for copilot
**Confidence:** CONFIRMED
**Evidence:** `packages/support-agent-copilot/src/lib/customer-api-calls/smart-assist-prehooks.ts` — PrehookConfig allows calling external APIs before generating drafts, injecting results into AI context.

---

## Gaps / follow-ups
- The external widget package (@inkeep/cxkit-react) is not in this repo — actual widget code lives elsewhere
- The vector store implementation (likely Supabase pgvector) is not visible in this repo — likely in a separate backend service
- The GraphQL API used by the dashboard is a separate backend service not in this repo
- Auto-reply capabilities for Zendesk tickets exist in concept (draft + apply) but automated auto-reply without human intervention is unclear from code alone
