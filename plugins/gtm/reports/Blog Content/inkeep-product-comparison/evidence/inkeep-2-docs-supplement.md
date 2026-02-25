# Evidence: Inkeep 2.0 Documentation Supplement

**Dimension:** Inkeep 2.0 Capabilities (docs-sourced additions)
**Date:** 2026-02-19
**Sources:** docs.inkeep.com/overview, inkeep.com/, docs.inkeep.com/typescript-sdk/, docs.inkeep.com/visual-builder/

---

## Key pages referenced
- https://docs.inkeep.com/typescript-sdk/memory — Conversation memory management
- https://docs.inkeep.com/talk-to-your-agents/a2a — A2A protocol and interop
- https://docs.inkeep.com/talk-to-your-agents/mcp-server — MCP server exposure
- https://docs.inkeep.com/typescript-sdk/data-operations — Streaming events
- https://docs.inkeep.com/typescript-sdk/configure-runtime-limits — Execution limits
- https://docs.inkeep.com/community/license — ELv2 license
- https://docs.inkeep.com/deployment/ — Deployment guides
- https://docs.inkeep.com/guides/observability/ — Tracing integrations

---

## Findings

### Finding: Intelligent memory compression with model-aware token budgets
**Confidence:** CONFIRMED
**Evidence:** With summarizer model: retrieves up to 10,000 messages, compresses at 50% of model context window (200K for GPT-5.2's 400K, 100K for Claude Sonnet 4.5's 200K). Without summarizer: 50 most recent messages, max 8,000 tokens. Sub-agents receive filtered history based on delegation scope — prevents memory pollution from parallel delegations.

### Finding: Bidirectional MCP — Inkeep as both MCP host AND MCP server
**Confidence:** CONFIRMED
**Evidence:** Inkeep consumes MCP servers as tools (host) AND exposes agents as MCP servers for Cursor, VS Code, Claude, ChatGPT to consume. POST /run/v1/mcp endpoint with HTTP JSON-RPC session management.

### Finding: A2A protocol with documented interop for 8+ frameworks
**Confidence:** CONFIRMED
**Evidence:** JSON-RPC 2.0 based A2A with documented interop for: LangGraph, Google ADK, Microsoft Semantic Kernel, Pydantic AI, AWS Strands, CrewAI, LlamaIndex, and major enterprise platforms.

### Finding: License is Elastic License 2.0 (ELv2)
**Confidence:** CONFIRMED
**Evidence:** Source-available, fair-code. Permits broad usage, restricts competitive applications. Same license family as Elasticsearch, n8n.

### Finding: Deployment guides for 6+ infrastructure targets
**Confidence:** CONFIRMED
**Evidence:** Docker Compose (local), Docker Build (custom image), Vercel (4 projects: Manage API, Run API, Manage UI, MCP Server), Azure VM, GCP Compute Engine, GCP Cloud Run, AWS EC2, Hetzner. Inkeep Cloud (waitlist-based managed hosting).

### Finding: Observability integrations beyond OTEL — Langfuse, Datadog APM, Sentry
**Confidence:** CONFIRMED
**Evidence:** SigNoz (primary), Langfuse (LLM-specific: token tracking, dataset creation, LLM-as-Judge), Datadog APM, Sentry (error tracking). LangfuseSpanProcessor for automatic LLM interaction tracing.

### Finding: CLI `inkeep pull` uses AI/LLM to generate TypeScript code from visual state
**Confidence:** CONFIRMED
**Evidence:** `inkeep pull` syncs Visual Builder state to TypeScript files using AI/LLM code generation. Supports --force, --introspect (full regeneration), --debug flags.

### Finding: Rich streaming event system with 12+ event types
**Confidence:** CONFIRMED
**Evidence:** With x-emit-operations header: agent_generate, agent_reasoning, tool_call, tool_result, transfer, delegation_sent, delegation_returned, artifact_saved, agent_initializing, completion, error. Plus tool approval/denial notifications.

### Finding: Branch/ref API for Git-like version control of agent configs
**Confidence:** CONFIRMED
**Evidence:** Branches API: list, create, get, delete. Branch names follow Git naming. Each branch has baseName, fullName, hash. Agent-specific branches. Doltgres backend enables native Git-like versioning at database layer.

### Finding: Skills system for reusable instruction blocks
**Confidence:** CONFIRMED
**Evidence:** Skills defined in SDK or UI. Attached to sub-agents. Configurable as always-loaded vs on-demand. Indexed ordering.

### Finding: Context Fetchers for dynamic data injection
**Confidence:** CONFIRMED
**Evidence:** Fetch external data at conversation initialization or per-invocation. Cached per conversation. Available to prompts and tools.

### Finding: Chat API uses Vercel AI SDK data stream format, NOT OpenAI format
**Confidence:** CONFIRMED
**Evidence:** docs.inkeep.com/talk-to-your-agents/chat-api explicitly states Vercel AI SDK data stream v2 format (text/event-stream). Marketing site mentions "OpenAI-compatible APIs" which may refer to A2A/external interface pattern, not the primary Chat API.

---

## Gaps / follow-ups
- OpenAI-compatibility claim needs clarification — primary Chat API uses Vercel format
- Inkeep Cloud managed hosting details (pricing, SLA, regions) not documented beyond waitlist
