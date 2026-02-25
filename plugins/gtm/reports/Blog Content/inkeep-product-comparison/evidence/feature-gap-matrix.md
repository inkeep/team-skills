# Evidence: Feature Gap Matrix

**Dimension:** Feature Gap Analysis
**Date:** 2026-02-19
**Sources:** Both codebases, all 4 documentation/marketing surfaces

---

## Feature Comparison Matrix

### Legend
- **1.0** = Only in Inkeep 1.0
- **2.0** = Only in Inkeep 2.0
- **BOTH** = Present in both (may differ in implementation)
- **BRIDGE** = Available in 2.0 via 1.0 MCP bridge
- **MARKETED** = Claimed in marketing but unclear/absent in code

---

### A. Core AI Capabilities

| Feature | Where | Notes |
|---|---|---|
| RAG / Semantic search | **1.0** | Core engine with 33+ source connectors, vector store, hybrid search |
| RAG via MCP bridge | **BRIDGE** | 2.0 agents can access 1.0 RAG via MCP server |
| Multi-agent architecture | **2.0** | Agent teams, delegation, transfer, A2A protocol |
| Agent-to-Agent (A2A) | **2.0** | JSON-RPC protocol with .well-known discovery |
| Scheduled triggers | **2.0** | Cron-based agent execution |
| Webhook triggers | **2.0** | HTTP webhook → agent execution |
| Custom function tools | **2.0** | Sandboxed JS execution with timeout limits |
| MCP tool ecosystem | **2.0** | Connect to any MCP server (Composio, custom, etc.) |
| Custom tool calls | **1.0** | API-level tool calls (simpler than 2.0's system) |
| Evaluation framework | **2.0** | Datasets, evaluators, durable workflow execution |
| Artifact/Data components | **2.0** | Structured outputs with optional crypto verification |

### B. Content & Knowledge Management

| Feature | Where | Notes |
|---|---|---|
| 33+ source connectors | **1.0** | Direct integrations via OAuth (Nango) and APIs |
| Content ingestion pipeline | **1.0** | Fetch → parse → chunk → embed → index → sync |
| Vector search | **1.0** | Semantic + keyword + hybrid search modes |
| Knowledge gap detection | **1.0** | Analytics identifies missing content areas |
| Tune Answers (FAQ refinement) | **1.0** | Manual answer quality improvement |
| Source transformation | **1.0** | Modify content before AI consumption |
| MCP-based data access | **2.0** | Via Unified Search, Pinecone, Context7, Ref, Firecrawl |

### C. Support Team Tools

| Feature | Where | Notes |
|---|---|---|
| Support Copilot (SmartAssist) | **1.0** | Draft answers, summaries, to-dos, sentiment analysis |
| Search KB mode | **1.0** | Agent searches knowledge base within copilot |
| Draft FAQ from tickets | **1.0** | Convert resolved tickets to FAQ content |
| Follow-up message suggestions | **1.0** | AI suggests follow-up responses |
| Prehook API (external enrichment) | **1.0** | Call external APIs to enrich AI context |
| Auto-reply | **MARKETED** | Documented in 1.0 docs/marketing. Code shows draft-and-apply flow, not fully automated loop |
| Smart routing | **MARKETED** | Documented in 1.0 marketing. Not clearly visible in codebase |
| Zendesk native app | **1.0** | Ticket sidebar integration |
| Chrome extension copilot | **1.0** | Works on GitHub issues, plain threads, etc. |
| Slack AI assistant | **1.0** | Via cx_platform Slack integration |

### D. User Interface / Embedding

| Feature | Where | Notes |
|---|---|---|
| Chat button widget | **BOTH** | 1.0: @inkeep/cxkit-react. 2.0: agents-ui React library |
| Search bar widget | **1.0** | Standalone semantic search bar component |
| Embedded chat | **BOTH** | Both provide embeddable chat experiences |
| Intelligent form | **1.0** | Data collection within chat flow |
| Visual agent builder | **2.0** | Drag-and-drop canvas with XYFlow |
| No-code → code sync | **2.0** | inkeep push/pull CLI commands |
| Custom modal trigger | **1.0** | Custom UI triggers for chat |

### E. Builder / Development Experience

| Feature | Where | Notes |
|---|---|---|
| TypeScript SDK | **2.0** | Declarative agent/subagent/tool definitions |
| Visual no-code builder | **2.0** | Canvas-based drag-and-drop |
| 2-way sync (code ↔ UI) | **2.0** | Via CLI push/pull |
| Dashboard config UI | **1.0** | Source management, rules, analytics |
| REST API (OpenAPI) | **BOTH** | 1.0: Hono project CRUD. 2.0: 40+ endpoint categories |
| GraphQL API | **1.0** | Dashboard backend |
| OpenAI-compatible Chat API | **BOTH** | Both support chat completions format |
| CLI tooling | **2.0** | inkeep push/pull/login/dev/validate |
| API playground | **1.0** | GraphQL playground in docs |

### F. Analytics & Observability

| Feature | Where | Notes |
|---|---|---|
| Conversation analytics dashboard | **1.0** | Charts, filters, CSV export, agent breakdown |
| Content gap reporting | **1.0** | Identifies missing documentation areas |
| Deflection metrics | **1.0** | Tracks ticket deflection rates |
| Draft acceptance rates | **1.0** | Copilot effectiveness metrics |
| Agent performance breakdown | **1.0** | Per-support-agent statistics |
| OpenTelemetry tracing | **2.0** | Distributed tracing with span capture |
| SigNoz/Jaeger integration | **2.0** | APM dashboards for debugging |
| Langfuse LLM observability | **BOTH** | 1.0: copilot tracing. 2.0: optional integration |
| PostHog product analytics | **1.0** | Client-side event tracking |
| Sentry error monitoring | **BOTH** | Error tracking in both |

### G. Security & Compliance

| Feature | Where | Notes |
|---|---|---|
| SOC 2 Type II | **MARKETED** | Claimed in 1.0 marketing and 2.0 pricing (Enterprise) |
| PII removal | **MARKETED** | Claimed in both marketing surfaces (Enterprise feature) |
| SpiceDB RBAC | **2.0** | Fine-grained authorization engine |
| Auth0/NextAuth | **1.0** | Authentication system |
| Better Auth + OAuth | **2.0** | Authentication system |
| API key management | **BOTH** | Both support programmatic access |
| Credential management | **2.0** | Nango, Keychain, env var credential stores |
| Content Security Policy | **1.0** | CSP configuration for widgets |
| Multi-tenant isolation | **BOTH** | Both scope data by organization |

### H. Deployment & Infrastructure

| Feature | Where | Notes |
|---|---|---|
| Vercel deployment | **BOTH** | Both support Vercel |
| Docker self-hosted | **2.0** | Full Docker Compose with optional observability |
| Cloud hosting (managed) | **BOTH** | 1.0: Supabase-backed cloud. 2.0: Inkeep Cloud |
| GCP/AWS/Azure deployment | **2.0** | Documented deployment targets |
| Open source (fair-code) | **2.0** | OSS core with managed cloud option |

---

## Critical Asymmetries for Sales Team

### 1. Support Copilot Gap
The flagship support copilot (SmartAssist, SearchKB, DraftFAQ, FollowUp) exists ONLY in 1.0. 2.0 has no equivalent. A customer wanting "support copilot in the agent platform" gets the 1.0 copilot embedded in Zendesk/Chrome, not a 2.0 agent. This is the biggest gap in the unified story.

### 2. Analytics Gap
1.0 has rich business analytics (content gaps, deflection, draft acceptance, agent performance). 2.0 has developer-oriented traces (OTel). There's no way to get "content gap analysis" or "deflection rate" from the 2.0 platform. Business stakeholders who care about support metrics must use 1.0's dashboard.

### 3. Content Ingestion Gap
1.0 has 33+ direct source connectors. 2.0 has ~5 MCP-based data sources. The unified story requires positioning 2.0's access to 1.0's sources via MCP bridge, but this means 2.0 is dependent on 1.0 for knowledge management.

### 4. Search Bar Gap
The standalone search bar widget is 1.0-only. 2.0 provides chat-based interfaces but no dedicated search-bar component.

### 5. Self-Hosting Gap (Reversed)
Self-hosted deployment is 2.0-only. 1.0 appears to be cloud-only (Supabase-backed). Enterprises wanting on-prem need 2.0, but then lose 1.0's rich features unless they also use 1.0's cloud.

---

## Gaps / follow-ups
- Verify auto-reply implementation depth in 1.0 (is it fully automated or always human-in-the-loop?)
- Verify smart routing implementation in 1.0 code
- Understand the actual MCP server endpoint that 1.0 exposes (is it in a separate service?)
- Understand billing/subscription relationship between 1.0 and 2.0
