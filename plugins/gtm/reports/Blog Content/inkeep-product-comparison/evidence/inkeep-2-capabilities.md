# Evidence: Inkeep 2.0 Capability Inventory

**Dimension:** Inkeep 2.0 Capabilities
**Date:** 2026-02-19
**Sources:** /Users/edwingomezcuellar/InkeepDev/agents codebase, docs.inkeep.com/overview, inkeep.com/

---

## Key files / pages referenced
- `/agents-api/` — Unified REST API (manage + run + evals domains)
- `/agents-manage-ui/` — No-code visual builder (Next.js)
- `/packages/agents-sdk/` — TypeScript SDK
- `/packages/agents-core/` — DB schemas, types, auth
- `/packages/agents-mcp/` — MCP server implementation
- `/packages/agents-work-apps/` — GitHub/Slack integrations
- `/agents-cli/` — CLI for push/pull sync
- `/agents-ui/` — Chat widget component library
- `/agents-docs/` — Public documentation (Fumadocs)

---

## Findings

### Finding: Monorepo with 7 apps and 5 core packages
**Confidence:** CONFIRMED
**Evidence:** pnpm monorepo. Apps: agents-api, agents-manage-ui, agents-ui, agents-cli, agents-docs. Packages: agents-core (DB/types), agents-sdk (SDK), agents-mcp (MCP), agents-work-apps (GitHub/Slack), ai-sdk-provider. Plus test-agents, agents-cookbook, create-agents-template.

### Finding: Agent builder is a visual drag-and-drop canvas with XYFlow
**Confidence:** CONFIRMED
**Evidence:** `/agents-manage-ui/src/features/agent/` uses XYFlow for graph/DAG visualization, Radix UI, Monaco editor for code editing, React Hook Form + Zod validation. Next.js 16 with React 19 canary.

### Finding: TypeScript SDK provides declarative agent definitions via builder pattern
**Confidence:** CONFIRMED
**Evidence:** `/packages/agents-sdk/src/builderFunctions.ts` exports: agent(), subAgent(), functionTool(), mcpServer(), credential(), transfer(), artifactComponent(), dataComponent(), scheduledTrigger(), evaluationClient(). Full Zod validation.

### Finding: Two-way sync between builder and SDK via CLI push/pull
**Confidence:** CONFIRMED
**Evidence:** `/agents-cli/` provides `inkeep push` (SDK → API), `inkeep pull` (API → SDK), `inkeep login`, `inkeep dev`, `inkeep validate`. Database is source of truth; both UI and SDK are representations.

### Finding: MCP support with Composio integration for 100+ tools
**Confidence:** CONFIRMED (code shows Composio integration)
**Evidence:** `/packages/agents-mcp/` implements MCP server with Streamable HTTP and SSE transports. Composio integration exists for third-party tools. First-party MCP servers for GitHub and Slack in agents-work-apps.

**Implications:** The "10,000+ integrations" claim on docs is from Composio, not Inkeep-built integrations. Actual first-party MCP servers are GitHub and Slack only.

### Finding: Multi-agent composition via delegation and transfer patterns
**Confidence:** CONFIRMED
**Evidence:** `/agents-api/src/domains/run/agents/` implements: createDelegateToAgentTool() for tool-based delegation, transfer() for conversational handoffs with optional conditions. SubAgents can be grouped into teams with many-to-many relations.

### Finding: A2A (Agent-to-Agent) protocol implemented
**Confidence:** CONFIRMED
**Evidence:** `/agents-api/src/domains/run/a2a/handlers.ts` handles A2A communication. `/.well-known/{agentId}/agent.json` exposes agent capabilities. Task-based message model with OpenTelemetry context propagation.

### Finding: Observability via OpenTelemetry with SigNoz/Jaeger exporters
**Confidence:** CONFIRMED
**Evidence:** `/agents-api/src/instrumentation.ts` configures OpenTelemetry Node SDK. OTLP HTTP exporter. Service name: `inkeep-agents-run-api`. Spans capture: agent execution, tool calls, LLM generations, conversation management, MCP interactions.

### Finding: Evaluation framework with datasets, evaluators, and durable workflows
**Confidence:** CONFIRMED
**Evidence:** `/agents-api/src/domains/evals/` contains: EvaluationService.ts, workflow functions (runDatasetItem, evaluateConversation), dataset triggers, evaluation triggers. Uses @workflow/builders for durable execution with Vercel integration.

### Finding: Chat API is OpenAI Chat Completions compatible with SSE streaming
**Confidence:** CONFIRMED
**Evidence:** `/agents-api/src/domains/run/routes/chat.ts` and `chatDataStream.ts`. POST endpoint accepts messages, returns streamed text + tool calls via SSE. Supports file attachments, structured output (artifacts), tool call visualization.

### Finding: Authorization via SpiceDB for fine-grained RBAC
**Confidence:** CONFIRMED
**Evidence:** Docker compose includes spicedb + spicedb-postgres services. `/packages/agents-core/src/auth/authz/` implements permission checks. Roles: view, edit, admin per resource. Multi-tenant isolation.

### Finding: Authentication via Better Auth with GitHub/Google OAuth
**Confidence:** CONFIRMED
**Evidence:** `/packages/agents-core/src/auth/` uses Better Auth library. OAuth providers: GitHub, Google. API key support for programmatic access. Session management with persistent sessions.

### Finding: Dual database architecture — Doltgres for config, Postgres for runtime
**Confidence:** CONFIRMED
**Evidence:** docker-compose.dbs.yml: doltgres-db (5432) for manage database (version-controlled config), postgres-db (5433) for runtime (conversations, messages, tool calls, evals). Drizzle ORM for both.

### Finding: Self-hosted deployment via Docker Compose with optional observability stack
**Confidence:** CONFIRMED
**Evidence:** Root docker-compose.yml and docker-compose.dbs.yml. Core: Doltgres + Postgres + SpiceDB. Optional: SigNoz, Jaeger, Nango, OTEL Collector. Vercel deployment also supported.

### Finding: AI model support for 6+ providers via Vercel AI SDK
**Confidence:** CONFIRMED
**Evidence:** `/packages/agents-core/src/constants/models.ts` — OpenAI, Anthropic, Google Gemini, Azure OpenAI, OpenRouter, OpenAI-Compatible endpoints. All via Vercel AI SDK v6.

### Finding: Sandbox execution for function tools with configurable limits
**Confidence:** CONFIRMED
**Evidence:** `/agents-api/src/domains/run/tools/` — SandboxExecutorFactory creates VercelSandboxExecutor or NativeSandboxExecutor. Limits: 50 max generation steps, 30s tool timeout, 90s LLM timeout.

### Finding: Artifact and Data Components for structured agent outputs
**Confidence:** CONFIRMED
**Evidence:** `/packages/agents-sdk/src/artifact-component.ts` — JSON schema for agent to fill. `data-component.ts` — rendered UI components. Ed25519 signature verification optional.

---

## Gaps / follow-ups
- The support copilot from 1.0 does NOT exist in the 2.0 codebase — there is no equivalent of the SmartAssist/SearchKB/DraftFAQ actions
- The rich analytics dashboard from 1.0 does NOT exist in 2.0 — traces exist but no dedicated analytics views for content gaps, deflection rates, etc.
- The semantic search bar widget from 1.0 does NOT have a direct equivalent in 2.0
- The 33+ content source connectors from 1.0 are NOT directly available in 2.0 — 2.0 relies on MCP servers for data, with Inkeep 1.0 as one possible MCP source
- Scheduled triggers exist in code but workflow complexity beyond simple cron + agent execution is limited
