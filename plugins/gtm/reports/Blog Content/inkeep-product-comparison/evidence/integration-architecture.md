# Evidence: Integration Architecture Between 1.0 and 2.0

**Dimension:** Integration Points
**Date:** 2026-02-19
**Sources:** Both codebases, docs.inkeep.com/overview, docs.inkeep.com/cloud/

---

## Key files / pages referenced
- `/InkeepDev/agents/packages/agents-mcp/` — MCP server implementation in 2.0
- `/InkeepDev/management/apps/dashboard/src/components/Rules/` — IntegrationType.Mcp in 1.0
- docs.inkeep.com/cloud/ MCP Server documentation
- docs.inkeep.com/overview data connectivity section

---

## Findings

### Finding: 1.0 exposes an MCP Server for use by 2.0 agents
**Confidence:** CONFIRMED (documented, partial code evidence)
**Evidence:** 1.0 docs list "MCP Server" as a developer tool. 1.0 rules system includes IntegrationType.Mcp. 2.0 docs list "Inkeep Unified Search" as a knowledge source / data connector for agents. The connection path is: 2.0 agent → MCP client → 1.0 MCP server → RAG/search over 33+ sources.

**Implications:** This is the primary bridge. 2.0 doesn't replicate 1.0's content ingestion — it delegates to it via MCP.

### Finding: The two codebases are completely separate monorepos with no shared code
**Confidence:** CONFIRMED
**Evidence:** `/InkeepDev/management` and `/InkeepDev/agents` share no packages. Different frameworks (Next.js 14 vs Next.js 16), different auth systems (Auth0/NextAuth vs Better Auth), different database systems (Supabase Postgres vs Doltgres+Postgres+SpiceDB), different API approaches (GraphQL + Hono REST vs Hono REST only).

**Implications:** These are architecturally independent products. Integration is purely at the protocol level (MCP, API). No shared state, no shared auth, no shared database.

### Finding: Shared technology choices but divergent implementations
**Confidence:** CONFIRMED
**Evidence:** Both use: TypeScript, Hono, Vercel AI SDK, Drizzle ORM, Tailwind CSS, shadcn/ui-based components. But versions, patterns, and architectures differ significantly. 2.0 is more modern (React 19, Next.js 16, SpiceDB).

### Finding: User management is separate across platforms
**Confidence:** CONFIRMED
**Evidence:** 1.0 uses Auth0/NextAuth/MSAL. 2.0 uses Better Auth with GitHub/Google OAuth. No shared identity provider. A user must have separate accounts for 1.0 dashboard and 2.0 builder.

**Implications:** The "one platform" story breaks down at the login screen. Users need separate credentials.

### Finding: Analytics are completely siloed
**Confidence:** CONFIRMED
**Evidence:** 1.0 has rich analytics (PostHog, Langfuse, custom dashboards for content gaps, deflection, agent performance). 2.0 has OpenTelemetry traces (SigNoz/Jaeger) for debugging but NO analytics dashboards for business metrics. A customer using both gets two separate views with no cross-platform correlation.

### Finding: 2.0 docs position "Unified Search" as one of several knowledge sources
**Confidence:** CONFIRMED
**Evidence:** 2.0 docs list data connectivity options: Inkeep Unified Search, Pinecone Assistant MCP, Context7, Ref, Firecrawl. Inkeep's own RAG is just one option, not the default or required path.

---

## Integration Architecture Diagram (ASCII)

```
┌──────────────────────────────────────────────────────────┐
│                    INKEEP 1.0                             │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐              │
│  │Dashboard │  │ Support  │  │  Content   │              │
│  │(Analytics│  │ Copilot  │  │ Ingestion  │              │
│  │ Rules,   │  │(SmartAs- │  │ (33+ src)  │              │
│  │ Sources) │  │ sist, KB │  │            │              │
│  │         │  │ Search)  │  │  ┌──────┐  │              │
│  └─────────┘  └──────────┘  │  │Vector│  │              │
│       │            │         │  │Store │  │              │
│       └────────────┴─────────┤  └──┬───┘  │              │
│                              │     │      │              │
│                    ┌─────────┴─────┴──────┘              │
│                    │    RAG Engine                        │
│                    └─────────┬────────────                │
│                              │                            │
│                    ┌─────────┴─────────┐                 │
│                    │   MCP Server      │ ◄── Protocol    │
│                    │   (exposed)       │     Bridge       │
│                    └─────────┬─────────┘                 │
└──────────────────────────────┼───────────────────────────┘
                               │ MCP Protocol
                               │ (Streamable HTTP / SSE)
┌──────────────────────────────┼───────────────────────────┐
│                    INKEEP 2.0│                            │
│                    ┌─────────┴─────────┐                 │
│                    │   MCP Client      │                 │
│                    │   (one of many)   │                 │
│                    └─────────┬─────────┘                 │
│                              │                            │
│  ┌─────────┐    ┌────────────┴───────────┐               │
│  │ Visual  │    │     Agent Runtime       │               │
│  │ Builder │◄──►│  (agents-api)          │               │
│  │ (UI)    │    │  ┌──────┐ ┌──────────┐ │               │
│  └─────────┘    │  │Agents│ │Observa-  │ │               │
│       ▲         │  │Teams │ │bility    │ │               │
│       │ 2-way   │  │Tools │ │(OTel)    │ │               │
│       │ sync    │  └──────┘ └──────────┘ │               │
│       ▼         │  ┌──────┐ ┌──────────┐ │               │
│  ┌─────────┐    │  │Evals │ │ Chat API │ │               │
│  │ SDK     │    │  │      │ │ (SSE)    │ │               │
│  │ (TS)    │◄──►│  └──────┘ └──────────┘ │               │
│  └─────────┘    └────────────────────────┘               │
│                                                           │
│  Other MCP Sources: Composio, GitHub, Slack,             │
│  Pinecone, Context7, Ref, Firecrawl, custom...           │
└──────────────────────────────────────────────────────────┘
```

---

## Gaps / follow-ups
- No evidence of a migration path from 1.0-only customers to unified 1.0+2.0 deployment
- No shared billing or subscription management visible in either codebase
- The MCP bridge is documented but the actual 1.0 MCP server implementation details are in a separate service (not in the management monorepo)
