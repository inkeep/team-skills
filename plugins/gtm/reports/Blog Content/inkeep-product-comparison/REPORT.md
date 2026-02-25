---
title: "Inkeep 1.0 vs 2.0: Technical Product Comparison for GTM Alignment"
description: "Comprehensive technical comparison between Inkeep 1.0 (RAG/support copilot platform) and Inkeep 2.0 (agentic platform for customer operations). Maps capabilities, integration architecture, feature gaps, and marketing-vs-reality discrepancies to enable the sales team to tell a coherent unified platform story."
createdAt: 2026-02-19
updatedAt: 2026-02-19
subjects:
  - Inkeep 1.0
  - Inkeep 2.0
  - Inkeep Agent Platform
topics:
  - product comparison
  - GTM alignment
  - feature gap analysis
  - marketing verification
  - competitive positioning
---

# Inkeep 1.0 vs 2.0: Technical Product Comparison for GTM Alignment

**Purpose:** Provide the GTM/sales team with a grounded technical understanding of what Inkeep 1.0 and 2.0 each actually do, how they connect, where the unified story holds up, and where it requires careful navigation.

---

## Executive Summary

Inkeep 1.0 and 2.0 are **architecturally independent products** — separate monorepos, separate databases, separate auth systems, separate deployment infrastructure. They connect via a single protocol bridge: 1.0 exposes an MCP Server that 2.0 agents can consume for RAG/search capabilities.

**Key Findings:**

- **1.0's strength is depth in support/RAG:** 50+ content source connectors, a 5-mode support copilot ("Keep") with prehook API for dynamic context injection, auto-reply (confidence-gated via `inkeep-qa`), smart routing (`inkeep-context` with Zod schema extraction), rich analytics (AI-powered content gap reports, feature request synthesis), and 7 widget components across 40+ framework integrations. All 13 customer testimonials reference 1.0 capabilities.
- **2.0's strength is breadth in agent infrastructure:** Multi-agent composition, bidirectional MCP (host + server), visual builder + TypeScript SDK with genuine 2-way sync, OpenTelemetry observability (+ Langfuse, Datadog, Sentry), evaluation framework, self-hosted deployment across 6+ cloud targets, A2A protocol with 8+ framework interop, and intelligent memory compression. This is genuinely differentiated from competitors.
- **The bridge between them creates a maturity continuum:** 1.0's RAG is available to 2.0 agents via MCP. Auto-reply evolves from 1.0 templates to 2.0 agents with extensible MCPs (CRM, APM, CDP). The platform story is: day-1 support value (1.0) → extended support automation (1.0→2.0) → internal copilots and agentic workflows (2.0).
- **The platform vision extends far beyond support:** 2.0 enables CSM copilots, meeting prep agents, daily sales briefs, lead qualification, QBR generation — categories no support AI competitor covers. The distinction is "internal copilots" (conversational, Slack/UI) vs "agentic workflows" (trigger/schedule-based, autonomous).
- **Five critical asymmetries** still need management in sales conversations: support copilot, analytics, content ingestion, search bar, and authentication remain siloed to one platform.
- **Marketing claims are substantiated:** Auto-reply, smart routing, and sales use cases are all confirmed. "33+ content sources" is conservative (actually 50+). Auto-reply and routing work today in 1.0 and are achievable via 2.0 platform (professional services handles custom setup pending template library).
- **Competitively, the combined platform is uniquely positioned** at the intersection of RAG expertise (vs Kapa.ai), agent infrastructure (vs n8n/LangGraph/CrewAI), and customer ops focus (vs Intercom/Decagon/Sierra). No single competitor covers all three circles, and none offer the day-1→agent platform maturity continuum.

---

## Research Rubric

| # | Dimension | Priority | Status |
|---|-----------|----------|--------|
| 1 | Inkeep 1.0 Capability Inventory | P0 | CONFIRMED |
| 2 | Inkeep 2.0 Capability Inventory | P0 | CONFIRMED |
| 3 | Integration Architecture | P0 | CONFIRMED |
| 4 | Feature Gap Matrix | P0 | CONFIRMED |
| 5 | Marketing Claims vs Code Reality | P0 | CONFIRMED |
| 6 | Unified Story Coherence | P1 | CONFIRMED |
| 7 | Platform Vision & Use Cases | P0 | CONFIRMED |
| 8 | Competitive Landscape | P1 | CONFIRMED |
| 9 | 1.0 Docs-Sourced Supplement | P0 | CONFIRMED |
| 10 | 2.0 Docs-Sourced Supplement | P0 | CONFIRMED |

**Non-goals:** Pricing deep-dive, infrastructure/deployment architecture.

---

## Detailed Findings

### 1. Inkeep 1.0 Capability Inventory

**Finding:** 1.0 is a mature, vertically-integrated RAG + support platform with deep content ingestion and polished support agent tooling.

**Evidence:** [evidence/inkeep-1-capabilities.md](evidence/inkeep-1-capabilities.md)

**Capability Summary:**

| Category | Capabilities |
|---|---|
| **Content Ingestion** | 50+ source types across 8 categories: doc platforms (Docusaurus, GitBook, Mintlify, ReadMe, etc.), CMS (WordPress, Sanity, Contentful, Prismic, etc.), knowledge management (Notion, Confluence, Google Drive), support tickets (Zendesk, Freshdesk, Help Scout, Intercom), community (Slack, Discord, Discourse), dev platforms (GitHub PRs/issues/releases, OpenAPI specs, GraphQL specs), marketing (Webflow, Framer), files (PDF, CSV, DOCX, YouTube). Automatic indexing, chunking, embedding, re-ranking. |
| **AI API Models** | 4 OpenAI-compatible models: `inkeep-qa` (Q&A with defaults for tone/citations/brand), `inkeep-context` (flexible RAG passthrough, tool calling, JSON mode, image inputs), `inkeep-base` (fast, no RAG), `inkeep-rag` (raw RAG chunks with URLs/excerpts). Each available in `-expert`, `-sonnet-4-5`, `-gpt-4.1`, `-gpt-4.1-mini`, `-gpt-4.1-nano` variants. |
| **Support Copilot ("Keep")** | 5 modes: Draft Answers (editable AI responses), Quick Links (relevant sources), Summaries & To-Dos, Sentiment Analysis, Turn Tickets into FAQ. Prehook API injects dynamic context from CRM/billing/product DBs into copilot decisions. Fully conversational — agents can ask for modifications. |
| **Auto-Reply** | Ticket auto-reply via Vercel templates + `inkeep-qa` API + Zendesk webhooks. Confidence-gated: replies publicly if `very_confident`, else internal note. Live chat auto-reply via Zendesk Messaging with seamless human handoff. |
| **Smart Routing** | `inkeep-context` API: categorize tickets, extract structured fields (Zod schemas), auto-fill subjects, summarize, add internal notes. Route by category (feature_request, account_billing, production_issue). |
| **Platform Integrations** | Zendesk (native Marketplace app "Keep AI Copilot"), 11+ others via Chrome extension: Salesforce, HubSpot, Intercom, Help Scout, Front, Jira, Freshdesk, GitHub Issues, Plain, Atlas, Missive |
| **Analytics** | Usage reports: chat sessions, unique users, thumbs up/down, code snippets copied, shared chats. Content gaps: weekly/monthly AI reports identifying documentation gaps and feature requests. CSV export. Third-party analytics integration. |
| **Widget SDK** | 7 components via @inkeep/cxkit-react: chat button, sidebar chat, embedded chat, search bar, embedded search+chat, intelligent form, custom modal trigger. 40+ framework integrations (Next.js, Docusaurus, Astro, VitePress, Webflow, Framer, GitBook, etc.). JS snippet for any website. |
| **Rules System** | Conditional AI behavior across 10 integration types (Web, SlackBot, GitHub, Discord, API, SupportCopilot, MCP, etc.) |

**Tech Stack:** Next.js 14, Turborepo, Supabase Postgres, Drizzle ORM, Vercel AI SDK, Auth0/NextAuth, Sentry, PostHog, Langfuse.

**Active maintenance:** All apps under active development with regular updates.

---

### 2. Inkeep 2.0 Capability Inventory

**Finding:** 2.0 is a general-purpose agent platform with genuine multi-agent orchestration, code/no-code parity, and enterprise-grade observability.

**Evidence:** [evidence/inkeep-2-capabilities.md](evidence/inkeep-2-capabilities.md)

**Capability Summary:**

| Category | Capabilities |
|---|---|
| **Agent Builder** | Drag-and-drop canvas (XYFlow), property editors, Monaco code editor, React 19 + Radix UI |
| **TypeScript SDK** | Declarative builders: agent(), subAgent(), functionTool(), mcpServer(), credential(), transfer(), artifactComponent(), scheduledTrigger(), evaluationClient() |
| **2-Way Sync** | CLI push/pull between code and visual builder. Database is source of truth. |
| **Multi-Agent** | Delegation (tool-based), transfer (conversation handoff), team composition, A2A protocol with .well-known discovery |
| **MCP Ecosystem** | 4-tier library: native (Atlassian, Notion, Sentry, Linear, Vercel, etc.), bring-your-own, Inkeep-built (Zendesk MCP with create/get/update/list tickets), Composio (~10,000 integrations). Plus custom servers via `inkeep add --mcp`. Streamable HTTP + SSE. |
| **Triggers** | Webhook triggers (HMAC verification, JSON Schema validation, JMESPath transform, message template interpolation) + scheduled triggers (cron or one-time, retry logic, workflow-based execution). Enables event-driven agent invocation from any external service. |
| **Observability** | OpenTelemetry instrumentation, SigNoz/Jaeger exporters, span capture for agent execution, tool calls, LLM generations |
| **Evaluations** | Datasets, evaluators, batch/continuous runs, durable workflow execution (Vercel @workflow) |
| **Chat API** | OpenAI Chat Completions compatible, SSE streaming, file attachments, structured output |
| **Auth/Authz** | Better Auth (GitHub/Google OAuth), SpiceDB for fine-grained RBAC |
| **Deployment** | Docker Compose (self-hosted), Vercel, GCP Cloud Run. Optional: SigNoz, Jaeger, Nango |
| **Models** | OpenAI, Anthropic, Google Gemini, Azure OpenAI, OpenRouter, OpenAI-Compatible via Vercel AI SDK v6 |

**Tech Stack:** Next.js 16, pnpm monorepo, Doltgres + Postgres, SpiceDB, Hono, Vercel AI SDK v6, Better Auth, OpenTelemetry.

**Additional capabilities confirmed via docs (not visible in codebase alone):**

| Capability | Detail |
|---|---|
| **Intelligent memory** | Model-aware token budgets — compresses at 50% of context window (200K for GPT-5.2's 400K, 100K for Claude Sonnet 4.5's 200K). Up to 10,000 messages with summarizer. Sub-agents receive filtered history to prevent memory pollution. |
| **Bidirectional MCP** | Not just a host (consuming MCP tools) — also exposes agents *as* MCP servers for Cursor, VS Code, Claude, ChatGPT via POST /run/v1/mcp. |
| **A2A interop** | JSON-RPC 2.0 A2A with documented interop for 8+ frameworks: LangGraph, Google ADK, Microsoft Semantic Kernel, Pydantic AI, AWS Strands, CrewAI, LlamaIndex. |
| **Streaming events** | 12+ event types: agent_generate, agent_reasoning, tool_call, tool_result, transfer, delegation_sent, delegation_returned, artifact_saved, agent_initializing, completion, error, plus tool approval/denial. |
| **Branch/ref API** | Git-like version control for agent configs — list, create, get, delete branches. Doltgres enables native versioning at database layer. |
| **Skills system** | Reusable instruction blocks attached to sub-agents. Always-loaded or on-demand. Indexed ordering. |
| **Context fetchers** | Dynamic data injection at conversation init or per-invocation. Cached per conversation. |
| **Deployment targets** | Docker Compose, Docker Build, Vercel (4 projects), Azure VM, GCP Compute Engine, GCP Cloud Run, AWS EC2, Hetzner. Plus Inkeep Cloud (waitlist). |
| **Observability beyond OTEL** | SigNoz (primary), Langfuse (token tracking, LLM-as-Judge), Datadog APM, Sentry. |
| **AI-powered CLI** | `inkeep pull` uses LLM to generate TypeScript from visual builder state. Supports --force, --introspect, --debug. |
| **License** | Elastic License 2.0 (ELv2) — source-available, fair-code. Same family as Elasticsearch, n8n. |

**Note on Chat API format:** The primary Chat API uses Vercel AI SDK data stream v2 format (text/event-stream), not OpenAI format. Marketing references to "OpenAI-compatible APIs" may refer to the A2A/external interface pattern rather than the primary Chat API.

**Active development:** Core engine stable. Active work on GitHub/Slack integrations, evals, authorization, observability, streaming.

---

### 3. Integration Architecture

**Finding:** The two products are architecturally independent, connected by a single MCP protocol bridge. No shared code, auth, database, or state.

**Evidence:** [evidence/integration-architecture.md](evidence/integration-architecture.md)

**Architecture:**

```
INKEEP 1.0                              INKEEP 2.0
┌─────────────────────┐                ┌──────────────────────┐
│ Dashboard (Analytics,│                │ Visual Builder       │
│ Sources, Rules)      │                │ TypeScript SDK       │
│                      │                │ CLI (push/pull)      │
│ Support Copilot      │                │                      │
│ (SmartAssist, KB,    │                │ Agent Runtime        │
│  DraftFAQ, FollowUp)│                │ (agents-api)         │
│                      │                │  - Multi-agent       │
│ Content Ingestion    │                │  - Tool execution    │
│ (33+ sources)        │                │  - Streaming         │
│                      │                │  - Evals             │
│ RAG Engine           │                │  - A2A protocol      │
│ (vector search)      │                │                      │
│         │            │                │ Observability        │
│    MCP Server ───────┼── MCP ────────►│ (OTel + SigNoz)     │
│                      │  Protocol      │                      │
│ Widget SDK           │                │ Chat Widget          │
│ (@inkeep/cxkit)      │                │ (agents-ui)          │
└─────────────────────┘                └──────────────────────┘
  Auth: Auth0/NextAuth                   Auth: Better Auth
  DB: Supabase Postgres                  DB: Doltgres + Postgres
  Deploy: Cloud only                     Deploy: Cloud + Self-hosted
```

**Key implications:**
- A user must have **separate accounts** for each platform
- **No shared analytics** — 1.0 business metrics and 2.0 traces are separate views
- **No shared content management** — 2.0 agents access 1.0 sources only via MCP, not directly
- **No shared billing** visible in either codebase
- The MCP bridge is the **only integration point** between the two platforms

---

### 4. Feature Gap Matrix

**Finding:** Five critical asymmetries exist that the sales team must navigate when telling the unified platform story.

**Evidence:** [evidence/feature-gap-matrix.md](evidence/feature-gap-matrix.md)

#### Critical Asymmetries

| # | Gap | What It Means for Sales | Resolution Timeline |
|---|-----|------------------------|---------------------|
| **1** | **Support Copilot is 1.0-only** | 1.0 copilot lives in Zendesk/Chrome with 5 modes. 2.0 doesn't have an equivalent yet. | **~4 weeks.** Rebuilding as agent-powered copilot: trigger any agent on demand, MCPs for troubleshooting, human-in-the-loop. Will surpass 1.0's capabilities. |
| **2** | **Business analytics are 1.0-only** | Content gap detection, deflection, agent performance dashboards exist only in 1.0. 2.0 has OTel traces but no business dashboards. | **~4-6 weeks.** Evals + traces + custom event tracking system replacing analytics. Customers will define custom KPIs. |
| **3** | **Content ingestion is 1.0-only** | 50+ source connectors, continuous sync — all 1.0. 2.0 accesses via RAG MCP bridge. | **Months.** RAG stays as standalone service via MCP. Long-term: native data ingestion + RAG in 2.0 platform. |
| **4** | **Search bar widget is 1.0-only** | Standalone semantic search bar only in @inkeep/cxkit-react. 2.0 has chat-based interfaces. | No current plan — low priority (most prospects care about chat). |
| **5** | **Self-hosting is 2.0-only** | 1.0 is cloud-only. Enterprises wanting on-prem get 2.0 but need 1.0's cloud for RAG. | Mitigated by MCP bridge. Full resolution when RAG moves natively to 2.0. |

#### Overlap Areas (Both Platforms)

| Capability | How They Differ |
|---|---|
| **Auto-reply** | 1.0: Vercel templates + `inkeep-qa` API, confidence-gated. 2.0: Webhook trigger → agent → Zendesk MCP, extensible with CRM/APM MCPs. Same outcome, different architecture. 2.0 is more powerful but requires custom setup. |
| **Smart routing** | 1.0: `inkeep-context` API with Zod schema extraction. 2.0: Trigger → agent → Inkeep RAG MCP for context + Zendesk MCP for routing. 2.0 can enrich with more data sources. |
| Chat widget | 1.0: mature, 7 components, 40+ framework integrations (@inkeep/cxkit-react). 2.0: newer, React-based (agents-ui). Different codebases. |
| OpenAI-compatible API | 1.0: fully OpenAI-compatible (4 models). 2.0: Chat API uses Vercel AI SDK format; A2A uses JSON-RPC. |
| Sentry error tracking | Both use Sentry. Separate instances. |
| Langfuse LLM observability | Both can use Langfuse. Separate configurations. |
| Vercel deployment | Both deploy to Vercel. Different apps. |
| Hono REST API | Both use Hono. Different API surfaces. |

#### 2.0-Exclusive Strengths

| Capability | Sales Value |
|---|---|
| Multi-agent composition | "Build teams of specialized agents that route, delegate, and transfer" |
| 2-way code ↔ UI sync | "Engineering and business teams collaborate in their preferred interface" |
| MCP tool ecosystem | "Connect to any tool or service via MCP — or build your own" |
| Evaluation framework | "Test agent quality with datasets and evaluators before deployment" |
| A2A protocol | "Agents discover and communicate with each other automatically" |
| TypeScript SDK | "Developers get full type safety with declarative agent definitions" |
| Webhook + scheduled triggers | "Automate agent invocation from any external event — support tickets, calendar events, form submissions, cron schedules" |
| Self-hosted deployment | "Deploy on your infrastructure — Docker, GCP, AWS, Azure, Hetzner" |
| SpiceDB authorization | "Enterprise-grade fine-grained permissions" |
| Internal copilots & workflows | "Beyond support: CSM copilots, meeting prep agents, daily briefs, lead qualification — all on the same platform" |

---

### 5. Marketing Claims vs Code Reality

**Finding:** All major marketing claims are substantiated. Auto-reply and smart routing are confirmed via 1.0's webhook/API architecture and extensible via 2.0's trigger/agent/MCP pattern.

**Evidence:** [evidence/marketing-vs-reality.md](evidence/marketing-vs-reality.md)

| Claim | Verdict | Detail |
|---|---|---|
| "33+ content sources" | **CONFIRMED** | Actually 50+ source types across 8 categories (doc platforms, CMS, knowledge management, support tickets, community, dev platforms, marketing, files). "33+" is conservative. |
| "2-way code-UI sync" | **CONFIRMED** | CLI push/pull implemented and functional |
| "10,000+ integrations" | **TECHNICALLY TRUE** | Via Composio MCP connector. Only 2 first-party MCP servers (GitHub, Slack). |
| "11 support platform integrations" | **MOSTLY TRUE** | Zendesk is native app. Others work via Chrome extension iframe. Experience quality varies. |
| "Auto Reply" | **CONFIRMED** | 1.0: Webhook-based via Vercel templates calling `inkeep-qa` API. Zendesk webhook → Vercel function → auto-replies if `very_confident`, else leaves internal note. Template: `zendesk-inkeep-autoreply-template`. Also supports live chat auto-reply via Zendesk Messaging. 2.0: Same outcome via triggers (webhook from Zendesk) → agent → Zendesk MCP for actions. No pre-built template yet (professional services provide custom setup). |
| "Smart Routing" | **CONFIRMED** | 1.0: `inkeep-context` API categorizes tickets, extracts structured fields (Zod schemas), labels, summarizes. Model: `inkeep-context-expert`. 2.0: Same outcome via triggers + agents + Inkeep RAG MCP for context. No pre-built template yet. |
| "AI for Sales" use case | **CONFIRMED (platform-level)** | No pre-built sales templates, but the 2.0 platform enables sales use cases: meeting prep agents (research prospects via web/LinkedIn/Apollo/Clay MCPs), daily brief agents (scheduled triggers), lead qualification and routing agents. These are real capabilities the platform enables, not pre-packaged features. 1.0 prehook API already supports injecting CRM/billing data into copilot. |
| "Only platform where engineering and business teams ship together" | **CONFIRMED** | 2-way sync is genuine and differentiating |
| Customer logos | **CONFIRMED** | Same logos across surfaces (2.0 has subset of 1.0's). All testimonials reference 1.0 features. |
| SOC 2 Type II | **CLAIMED** | In marketing and Enterprise pricing. Not verified against audit report. |
| "Fair-code" / Open Source | **CONFIRMED** | Elastic License 2.0 (ELv2). Source-available, permits broad usage, restricts competitive applications. Same license family as Elasticsearch, n8n. |

**Competitor comparison pages blend 1.0 and 2.0 features without distinction.** The vs-n8n and vs-CrewAI pages list "unified AI search," "managed knowledge base ingestion," and "support for Zendesk/Salesforce" alongside "multi-agent architecture" and "2-way sync." A prospect reading these would assume one product.

---

### 6. Unified Story Coherence

**Finding:** The unified story is aspirationally sound but creates concrete expectation gaps that sales must manage.

#### Where the Story Holds Up

The narrative — "one platform for day-1 needs (chatbot, copilot, search) that grows into a full agent platform" — is compelling and structurally supported:

1. **1.0 genuinely delivers day-1 value:** Proven with 13 customer testimonials, 33+ sources, polished copilot, rich analytics. Fast setup.
2. **2.0 genuinely delivers platform extensibility:** Multi-agent, MCP, custom tools, self-hosting, evals. Real technical depth.
3. **The MCP bridge connects them:** 2.0 agents can leverage 1.0's RAG. This is a real architectural connection, not just marketing.
4. **Comparison pages tell the combined story effectively:** Prospects see the union of capabilities.

#### Where the Story Breaks Down

| Fracture Point | Risk Level | Impact | Resolution |
|---|---|---|---|
| **Separate logins** | ~~HIGH~~ **RESOLVED** | Auth0 SSO bridges the gap. Users sign into 2.0 via "Inkeep Unified Search" or Google SSO. | **Shipped.** Admins manage sources in 1.0, employees access 2.0 via unified SSO. |
| **No unified analytics** | HIGH → MEDIUM | Support leaders want one dashboard. Currently separate. | **4-6 weeks.** Evals + traces + custom KPI tracking replacing analytics in 2.0. |
| **Copilot not in 2.0** | HIGH → MEDIUM | Agent platform story implies copilot should be there. | **~4 weeks.** Agent-powered copilot with MCPs, triggers, human-in-the-loop. Will surpass 1.0. |
| **Content management only in 1.0** | MEDIUM | 2.0 users can't add/manage sources — must use 1.0 dashboard. | **Months.** RAG accessible via MCP. Native ingestion planned long-term. |
| **Testimonials all reference 1.0** | MEDIUM | Social proof doesn't validate 2.0 story. Perceptive prospects notice. | Needs new 2.0 customer stories as platform matures. |
| **Free tier doesn't include RAG** | MEDIUM | OSS users get agent platform but no content ingestion. RAG is Enterprise. | By design — RAG is the upsell path. |
| **Search bar is 1.0-only** | LOW | Most prospects care about chat, not standalone search. | No current plan. Low priority. |

#### Recommendations for Sales Conversations

1. **Lead with outcomes, not architecture.** "Here's what you get on day 1; here's where you grow." The auth is now unified via SSO — don't volunteer the two-codebase split unless asked.

2. **Tell the maturity story.** Day 1: chatbot + copilot + auto-reply (1.0). Month 1: extend auto-reply with CRM/APM context (2.0 agents). Month 3+: CSM copilots, meeting prep, internal knowledge agents. No competitor offers this continuum.

3. **Know the timeline.** Agent-powered copilot: ~4 weeks. Analytics parity (evals + traces + custom KPIs): ~4-6 weeks. Native RAG: months. Be honest about what's live today vs coming soon.

4. **Demo strategically.** Show 1.0 for copilot/analytics/content demos. Show 2.0 for agent builder/multi-agent/extensibility demos. The SSO bridge means you can show a seamless login experience.

5. **Manage the "10,000 integrations" expectation.** Clarify the 4-tier MCP library: native (Notion, Sentry, etc.), bring-your-own, Inkeep-built (Zendesk), and Composio (~10K). Show the 50+ content connectors (1.0) as the RAG backbone.

6. **Position self-hosting correctly.** Self-hosting is 2.0 only. RAG available via MCP bridge to 1.0's cloud. Full on-prem RAG planned when ingestion moves natively to 2.0.

7. **Pricing conversation.** Enterprise agreements with custom pricing today. Usage-based pricing for the agent platform is planned. No self-serve yet — position this as "white-glove onboarding" not "no pricing page."

---

### 7. The Platform Vision: From Support AI to Agentic Customer Operations

**Finding:** The combined platform enables three tiers of capability that map to increasing customer maturity — from out-of-box support AI (1.0) through agentic automation (1.0→2.0 bridge) to fully custom internal copilots and workflows (2.0). This continuum is the core GTM narrative.

#### Tier 1: Out-of-Box Support AI (Inkeep 1.0)

Day-1 value with minimal setup:
- **AI chatbot** on docs/help center (7 widget options, 40+ framework integrations)
- **Support copilot ("Keep")** for agents (5 modes: draft answers, quick links, summaries, sentiment, FAQ generation)
- **Auto-reply** to tickets (confidence-gated: public reply if `very_confident`, internal note otherwise)
- **Smart routing** (categorize, extract fields, auto-label, route to right team)
- **Analytics** (content gaps, feature requests, deflection, usage reports)

All powered by 50+ content source connectors and 4 OpenAI-compatible API models (`inkeep-qa`, `inkeep-context`, `inkeep-base`, `inkeep-rag`).

#### Tier 2: Agentic Support Automation (1.0 → 2.0 Bridge)

When customers outgrow templates and need custom logic:

**How auto-reply evolves from 1.0 → 2.0:**
```
1.0 Pattern:                          2.0 Pattern:
Zendesk webhook                       Zendesk webhook
  → Vercel template                     → Webhook trigger
    → inkeep-qa API                       → Agent (with custom logic)
      → auto-reply if confident             → Inkeep RAG MCP (research)
                                            → Zendesk MCP (reply/tag/route)
                                            → [Customer's MCPs] (enrich)
```

The 2.0 pattern is extensible — customers can add MCPs to:
- Research user/account data from CRM (HubSpot, Salesforce)
- Check product analytics (Amplitude, Mixpanel)
- Query logs from APM (Datadog, New Relic)
- Look up billing status or subscription details
- Access CDP/data lake for customer context

This turns a simple auto-reply into a context-rich, action-capable agent that resolves tickets with full business context — not just documentation answers.

#### Tier 3: Internal Copilots & Agentic Workflows (Inkeep 2.0)

Beyond support, the agent platform enables entirely new categories:

| Use Case | Pattern | How It Works |
|---|---|---|
| **CSM Account Copilot** | Conversational (Slack) | CSM asks agent about account status before QBR. Agent queries CRM, product analytics, support history, billing via MCPs. Can draft QBR into Notion. |
| **Meeting Prep Agent** | Triggered (calendar event) | When meeting is booked, agent researches prospect via web/LinkedIn/Apollo/Clay MCPs, prepares briefing notes. Delivered as daily brief or per-booking. |
| **Lead Qualification** | Triggered (form submission) | Inbound lead triggers agent that enriches from web + CRM, scores qualification, routes to right sales rep, prepares context summary. |
| **Daily Sales Brief** | Scheduled (cron) | Morning agent run aggregates: today's meetings + prep notes, pipeline changes, new leads overnight, key account alerts. Delivered via Slack or email. |
| **Support Triage Agent** | Triggered (ticket creation) | Richer than 1.0 routing: categorize + enrich with customer context + check for known issues + route + draft response + escalate if production issue. |
| **Internal Knowledge Agent** | Conversational (Slack/UI) | Company-specific Q&A across Confluence, Notion, Slack history, internal docs. With RAG from 1.0 + custom tools from 2.0. |

**The key distinction:**
- **Internal copilots** = conversational agents you talk to (in Slack, a UI, etc.)
- **Agentic workflows** = trigger/schedule-based agents that run autonomously and deliver results

Both use the same platform primitives: agents, sub-agents, MCPs, triggers, Inkeep RAG, skills.

#### What This Means for Sales

The competitive narrative shifts from "AI support chatbot" (where Intercom/Decagon/Sierra compete) to "agentic customer operations platform" (where nobody competes):

1. **Day 1:** "Here's your AI chatbot, copilot, and auto-reply. Working in 30 minutes." (1.0)
2. **Month 1:** "Let's extend your auto-reply with CRM context so it resolves more tickets." (1.0→2.0)
3. **Month 3:** "Let's build a CSM copilot and meeting prep agent for your sales team." (2.0)
4. **Month 6:** "Your agents now handle support triage, CSM briefings, sales prep, and internal knowledge — all on one platform." (2.0)

This land-and-expand narrative is what no competitor offers. Kapa.ai stops at step 1. Intercom/Decagon/Sierra do steps 1-2 but can't do 3-4. n8n/LangGraph/CrewAI can do 3-4 but miss the RAG backbone and day-1 value of 1-2.

---

### 8. Competitive Positioning

**Finding:** The combined Inkeep platform (1.0 + 2.0) occupies a unique competitive position at the intersection of three capability circles. No single competitor covers all three.

**Evidence:** [evidence/competitive-landscape.md](evidence/competitive-landscape.md)

#### Three-Circle Positioning

```
            ┌────────────────────┐
            │  RAG / Search      │
            │  Expertise         │
            │  (vs Kapa.ai)      │
            │                    │
            │  33+ connectors    │
            │  Citation quality  │
            │  Dev content opt.  │
            └──────┬─────────────┘
                   │
            ┌──────┴──────┐
            │             │
            │   INKEEP    │ ◄── Only platform at the
            │  (1.0 + 2.0)│     intersection of all three
            │             │
            └──┬───────┬──┘
               │       │
  ┌────────────┴──┐  ┌─┴────────────────┐
  │ Agent Platform │  │ Customer Ops     │
  │ (vs n8n,       │  │ Focus            │
  │  LangGraph,    │  │ (vs Intercom,    │
  │  CrewAI)       │  │  Decagon, Sierra)│
  │                │  │                  │
  │ Multi-agent    │  │ Support copilot  │
  │ A2A + MCP      │  │ Ticket analytics │
  │ SDK + no-code  │  │ Platform integs  │
  │ Evals + traces │  │ Deflection       │
  └────────────────┘  └──────────────────┘
```

#### Competitor Comparison Matrix

| Dimension | **Inkeep (1.0+2.0)** | **Kapa.ai** | **Intercom Fin** | **Decagon** | **Sierra** | **n8n** | **LangGraph** | **CrewAI** |
|---|---|---|---|---|---|---|---|---|
| **Built-in RAG** | 50+ sources, 4 API models | Doc ingestion | 100-file limit | Unknown | Unknown | None | None | None |
| **Multi-agent** | Delegation + transfer | No | No | No | Yes | No (workflow) | Yes (graph) | Yes (roles) |
| **A2A protocol** | JSON-RPC, 8+ interop | No | No | No | No | No | No | No |
| **MCP support** | Host + server (bidirectional) | No | No | No | No | No | No | No |
| **Visual builder** | XYFlow canvas | No | No | AOPs | Agent Studio | Visual flows | No | CrewAI Studio |
| **TypeScript SDK** | Full builder pattern | No | No | No | Agent SDK (proprietary) | JS/TS nodes | Python only | Python only |
| **Evals framework** | Datasets + evaluators | No | No | Unknown | Yes | No | LangSmith (separate) | No |
| **Self-hosted** | Docker + 6 cloud targets | No | No | No | No | Yes (free) | Yes (free) | Yes |
| **Support copilot** | 5-mode copilot + prehook | No | AI resolution | Yes | Yes | No | No | No |
| **Auto-reply + routing** | Confidence-gated + structured extraction | No | AI resolution | AOPs | Agent OS | No | No | No |
| **Support integrations** | Zendesk + 10 via extension | No | Native (closed) | Native | Native | 400+ general | No | No |
| **Business analytics** | Content gaps, deflection | Basic | Resolution metrics | Yes | Agent Data Platform | No | No | No |
| **Observability** | OTEL + Langfuse + Datadog | No | No | Unknown | Yes | No | LangSmith | Weak |
| **RBAC / Authorization** | SpiceDB fine-grained | No | Intercom roles | Unknown | Yes | Basic | No | No |
| **Beyond support** | CSM, sales, internal copilots | No | No | No | No | General automation | General agents | General agents |
| **Open source** | ELv2 (source-available) | No | No | No | No | Fair-code (ELv2) | MIT | Apache 2.0 |

#### Battle Cards (Sales Quick Reference)

**vs Kapa.ai** (1.0 competitor — developer doc Q&A)
- Kapa.ai is a point solution: doc ingestion → Q&A. No agents, no MCP, no builder, no evals.
- Inkeep 1.0 alone beats Kapa: 50+ sources (vs Kapa's limited set), 5-mode support copilot with prehook API, auto-reply with confidence gating, smart routing with structured extraction, AI-powered content gap reports.
- The combined platform story (1.0 + 2.0) is in a different league: "Start with better doc Q&A and support copilot. When you need more, extend into agents that handle triage, CRM lookups, meeting prep, and internal knowledge — all on the same platform."
- Kapa stops at Q&A. With Inkeep, Q&A is just day 1.

**vs Intercom Fin** (enterprise CX incumbent)
- Fin is massive ($100M+ ARR, 1M+ issues/week, 82% resolution) but closed-ecosystem.
- $0.99/resolution + seat costs ($29-$139/mo) — costs compound at scale.
- No multi-agent, no A2A, no SDK, no MCP, no self-hosting. 100-file upload limit. 4-8 week ramp-up.
- Fin stops at support. Inkeep extends to CSM copilots, meeting prep, daily briefs, lead qualification — use cases Intercom can't touch.
- Inkeep differentiators: developer focus, open architecture, composability, extensibility (add CRM/APM/CDP context via MCPs), accessible pricing, self-hosting.

**vs Decagon** (enterprise-only CX)
- $95K+/yr minimum, $250M Series D at $4.5B valuation. Serves Duolingo, Rippling, Affirm.
- Strong enterprise CX features (voice + chat + email) but no developer tooling.
- No public pricing, engineering-heavy setup, no A2A/SDK/MCP.
- Decagon's AOPs are limited to support workflows. Inkeep's agents + triggers + MCPs enable any customer operations workflow.
- Inkeep wins on: accessibility (OSS tier), developer experience, open protocols, time-to-value, extensibility beyond support.

**vs Sierra** (most sophisticated, fully proprietary)
- $10B valuation, $150M+ ARR. Agent OS 2.0, Agent Studio 2.0, Agent SDK, Agent Data Platform.
- Most mature agent development lifecycle. SOC 2, ISO 27001, HIPAA.
- Outcome-based pricing ($10-20/deflection, ~$50K implementation fee).
- **But:** fully proprietary, no open-source, no self-hosting, enterprise-only, locked into Sierra's ecosystem.
- Inkeep counter-position: open architecture (ELv2), self-hosting, developer-first, SMB-accessible, extend with any MCP (CRM, APM, CDP, custom systems). Sierra customers can't easily add a Datadog MCP to check logs during triage — Inkeep customers can.

**vs n8n / LangGraph / CrewAI** (horizontal agent platforms)
- n8n: 400+ integrations but workflow-trigger-based (not conversational), no built-in RAG, no evals, no native tracing.
- LangGraph: most flexible graph-based framework but code-only, Python-only, no visual builder, no customer ops features.
- CrewAI: accessible but enterprise security gaps (no RBAC), weak observability, Python-only, no MCP/A2A.
- Critical difference: To build an auto-reply agent with CRM context on n8n/LangGraph/CrewAI, you'd build the RAG pipeline, connect the support platform, build the CRM integration, implement confidence gating, add observability — months of work. Inkeep delivers that on day 1 (1.0) and extends it with agents (2.0) in weeks.
- Inkeep wins on: domain focus (customer ops), TypeScript-native, dual-mode (code + no-code), built-in RAG via 1.0, production-grade security (SpiceDB), protocol interop (A2A + MCP), day-1 value.

#### Market Context

The AI agent market is projected to grow from $7.84B (2025) to $52.62B (2030) at 46.3% CAGR. [Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025) predicts 40% of enterprise apps will include AI agents by 2026, up from <5% in 2025. Multi-agent inquiry growth: 1,445% from Q1 2024 to Q2 2025.

---

## Limitations & Open Questions

### Known Nuances (Not Uncertainties)
- **Chat API format:** 1.0's AI API is fully OpenAI-compatible (4 models). 2.0's Chat API uses Vercel AI SDK data stream v2 format for richer streaming events. Both are accurate — different APIs serve different purposes.
- **Sierra SDK comparison:** Sierra's proprietary Agent SDK cannot be deeply compared (closed-source). Comparison based on public documentation only.
- **2.0 template maturity:** Auto-reply and smart routing work on 2.0 via triggers + agents + MCPs. Pre-built templates are being codified from professional services engagements. Cookbook has the patterns; production templates are in progress.

### Out of Scope (per Rubric)
- Detailed pricing analysis (covered at summary level in competitive section)
- Infrastructure/deployment architecture details
- Performance benchmarks
- Inkeep Cloud managed hosting specifics (waitlist-only, not yet documented)

### Roadmap Context (as of Feb 2026)

| Question | Status | Detail |
|---|---|---|
| **Auth unification** | **Shipped** | 1.0's Auth0 added as SSO provider to 2.0. Admins manage RAG/sources in 1.0. Employees sign into 2.0 org via "Inkeep Unified Search" (auth method being renamed) or Google SSO for users who don't need source management access. |
| **Support copilot in 2.0** | **~4 weeks** | Rebuilding copilot to go beyond suggestions: trigger any agent on demand, use MCPs to troubleshoot (like the auto-reply extensible flow but human-in-the-loop). |
| **Analytics parity in 2.0** | **~4-6 weeks** | Analytics will be replaced by evals + traces + a generic event tracking system so customers can define custom KPIs. Equivalent coverage to 1.0 analytics within this timeframe. |
| **1.0 → 2.0 migration** | **Phased** | RAG stays as a standalone service for a few months, accessible via MCP bridge. Long-term plan: move data ingestion + RAG capabilities natively into the 2.0 platform. |
| **Billing** | **Enterprise agreements** | Not self-serve Stripe yet. All handled via enterprise agreements and invoices. Planning usage-based pricing for the agent platform to account for open-ended nature. Potentially self-serve later. Custom pricing per customer while ironing out details. |

---

## References

### Evidence Files
- [evidence/inkeep-1-capabilities.md](evidence/inkeep-1-capabilities.md) - Full 1.0 capability inventory from codebase
- [evidence/inkeep-2-capabilities.md](evidence/inkeep-2-capabilities.md) - Full 2.0 capability inventory from codebase
- [evidence/integration-architecture.md](evidence/integration-architecture.md) - Architecture diagram and integration analysis
- [evidence/feature-gap-matrix.md](evidence/feature-gap-matrix.md) - Complete feature comparison matrix
- [evidence/marketing-vs-reality.md](evidence/marketing-vs-reality.md) - Claim-by-claim verification
- [evidence/competitive-landscape.md](evidence/competitive-landscape.md) - Competitor-by-competitor analysis with positioning synthesis
- [evidence/inkeep-2-docs-supplement.md](evidence/inkeep-2-docs-supplement.md) - Docs-sourced 2.0 capabilities not visible in codebase alone
- [evidence/inkeep-1-docs-supplement.md](evidence/inkeep-1-docs-supplement.md) - Docs-sourced 1.0 capabilities: auto-reply, smart routing, AI API models, prehook, pricing
- [evidence/platform-vision-use-cases.md](evidence/platform-vision-use-cases.md) - Platform vision: 1.0→2.0 evolution, internal copilots, agentic workflows, use case patterns
- [evidence/triggers-and-mcp-patterns.md](evidence/triggers-and-mcp-patterns.md) - 2.0 trigger system, Zendesk MCP, customer support template, RAG MCP integration

### External Sources
- [Inkeep 1.0 Docs](https://docs.inkeep.com/cloud/) - Cloud product documentation
- [Inkeep 1.0 Marketing](https://marketing-drab.vercel.app/) - Original marketing site
- [Inkeep 2.0 Docs](https://docs.inkeep.com/overview) - Agent platform documentation
- [Inkeep 2.0 Marketing](https://inkeep.com/) - Current marketing site
- [Inkeep vs Kapa.ai](https://inkeep.com/compare/kapa) - Feature comparison page
- [Kapa.ai](https://www.kapa.ai/) - Competitor: developer doc Q&A
- [Intercom Fin](https://www.intercom.com/pricing) - Competitor: enterprise CX AI
- [Decagon AI](https://decagon.ai) - Competitor: enterprise support AI
- [Sierra AI](https://sierra.ai/) - Competitor: agent platform (proprietary)
- [n8n AI](https://n8n.io/ai/) - Competitor: workflow automation with AI agents
- [LangGraph](https://www.langchain.com/langgraph) - Competitor: graph-based agent framework
- [CrewAI](https://www.crewai.com/) - Competitor: multi-agent framework
- [Gartner AI Agent Prediction](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025) - Market sizing
- [Inkeep TypeScript SDK Memory](https://docs.inkeep.com/typescript-sdk/memory) - Memory management docs
- [Inkeep A2A Protocol](https://docs.inkeep.com/talk-to-your-agents/a2a) - A2A interop documentation
- [Inkeep MCP Server](https://docs.inkeep.com/talk-to-your-agents/mcp-server) - Bidirectional MCP docs
- [Inkeep License](https://docs.inkeep.com/community/license) - ELv2 license documentation
- [Inkeep Deployment](https://docs.inkeep.com/deployment/) - Multi-target deployment guides
