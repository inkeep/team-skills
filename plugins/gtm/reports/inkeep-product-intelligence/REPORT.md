# Inkeep Product Intelligence Report

## Executive Summary

Inkeep is an AI agent platform for building customer-facing chat assistants and internal agentic workflows. The platform differentiates through its multi-agent architecture, dual development model (TypeScript SDK + no-code visual builder with 2-way sync), and flexible deployment options including full self-hosting.

**Core positioning:** "The AI agent platform that empowers customer operations teams to build agents that take action across your systems."

**Primary use cases:**
- AI-powered support deflection (Ask AI)
- Agent copilots for support teams (Zendesk, Slack)
- Agentic workflows for automation
- Custom agent development

**Open Source:** The platform is source-available under Elastic License 2.0 (ELv2) with 925+ GitHub stars. Full TypeScript SDK, React UI components, and CLI tools are available at github.com/inkeep/agents.

**Technical Stack:** TypeScript, PostgreSQL + Drizzle ORM, Vercel AI SDK, OpenTelemetry, MCP (Model Context Protocol), React/Next.js, Better Auth, Zod validation.

**Report Depth:** This report includes source code analysis from 50+ files across the GitHub repository, covering SDK primitives, runtime execution, database schemas, CLI implementation, Visual Builder UI, authentication, and cookbook examples.

---

## Part 1: Product Overview

### 1.1 Core Products

| Product | Description | Primary Users |
|---------|-------------|---------------|
| **Ask AI** | Customer-facing AI assistant for help centers, docs, and in-app support | CX teams, DevRel |
| **Copilots** | Agent assist tools embedded in Zendesk, Slack, and other platforms | Support agents |
| **Agentic Workflows** | Automated multi-step processes (ticket triage, KB updates, CRM sync) | Support Ops, CX Ops |
| **Custom Agent Builder** | Platform for building tailored AI agents | Engineering, Product |

### 1.2 Development Approaches

**Dual Development Model:**

1. **TypeScript SDK** (Code-first)
   - Full programmatic agent definition
   - Instructions, tools, behaviors, and relationships as code
   - OpenAI-compatible APIs
   - Vercel AI SDK support

2. **No-Code Visual Builder** (Drag-and-drop)
   - Visual canvas for non-technical teams
   - Agent creation without coding
   - Configuration UI for workflows

**Key differentiator:** Full 2-way sync between code and visual builder. Changes in either environment reflect in the other, enabling technical and non-technical teams to collaborate on the same agents.

### 1.3 Platform Capabilities

| Capability | Details |
|------------|---------|
| **Multi-Agent Architecture** | Sub-agent relationships, specialist routing, workflow orchestration |
| **Unified Search & RAG** | Hybrid retrieval (vector + keyword), intelligent reranking |
| **MCP Integration** | Model Context Protocol for standardized tool communication |
| **Custom Function Tools** | Sandboxed execution environments |
| **UI Component Library** | React, Next.js, vanilla JS chat components |
| **Observability** | OpenTelemetry, SigNoz, Langfuse integration |

---

## Part 2: Technical Architecture

### 2.1 System Components

The Inkeep platform comprises **five integrated services** (from GitHub repo analysis):

| Component | Package | Purpose |
|-----------|---------|---------|
| **agents-api** | Unified REST API | Agent config, execution, evaluation, conversation state, telemetry |
| **agents-manage-ui** | Next.js app | Visual Builder web interface for drag-and-drop agent creation |
| **agents-sdk** | @inkeep/agents-sdk | TypeScript SDK for programmatic agent definition |
| **agents-cli** | @inkeep/agents-cli | CLI tools (`inkeep push`, `inkeep pull`) for code-visual sync |
| **agents-ui** | @inkeep/agents-ui | React component library for embedding chat interfaces |
| **agents-core** | @inkeep/agents-core | Shared database schema, types, validation, data access layer |

### 2.2 API Domains

The `agents-api` is organized into three domains:

| Domain | Path | Responsibilities |
|--------|------|------------------|
| **Manage** | `/domains/manage/` | Agent configuration, projects, tools, credentials, admin operations |
| **Run** | `/domains/run/` | Agent execution, conversations, A2A communication, runtime operations |
| **Evals** | `/domains/evals/` | Evaluation workflows, dataset management, evaluation triggers |

### 2.3 Multi-Agent Orchestration

Inkeep uses **graph-based multi-agent orchestration** rather than linear scripts or single-agent systems.

**Architecture patterns supported:**

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Network** | Agents hand off to each other freely | Maximum flexibility, complex routing |
| **Supervisor** | Coordinator agent manages sub-agents | Structured workflows, clear hierarchy |
| **Sub-agents as Tools** | Agents callable as tools within parent agent | TypeScript implementation, modular design |

**Why multi-agent?** Single agents degrade beyond 5-10 tools (tool overload). Specialized agents with discrete mandates resolve context complexity and conflicting instructions.

**A2A (Agent-to-Agent) Communication:**
- Peer-to-peer graph architecture (1-hop direct communication)
- Agent discovery via `/.well-known/{subAgentId}/agent.json` endpoints
- In-process fetch for same-service calls (avoids load balancer routing issues)
- 60-second timeouts for A2A interactions

### 2.2 RAG Implementation

Inkeep's RAG (Retrieval-Augmented Generation) system follows a three-stage process:

1. **Retriever Stage:** Hybrid search (vector + keyword) across knowledge bases
2. **Augmentation Stage:** Retrieved context combined with query for enhanced prompts
3. **Generator Stage:** LLM composes answer with citations and source attribution

**RAG capabilities:**
- 24-hour deployment timeframe
- Document-level access controls
- Multi-modal ingestion (docs, tickets, code, conversations)
- Continuous learning via user feedback
- Caching for cost and latency reduction

### 2.3 Context Engineering

Inkeep addresses the five common agent failure modes:

| Failure Mode | Problem | Inkeep's Approach |
|--------------|---------|-------------------|
| **Context Pollution** | Too much irrelevant data degrades accuracy | Progressive disclosure, just-in-time retrieval |
| **Tool Bloat** | 20-30 tools causes analysis paralysis | Sub-agent specialization (3-7 tools each) |
| **Poor Memory** | Multi-session context loss | Structured persistence, compaction strategies |
| **Vague Prompts** | Unreliable behavior | Explicit guidance on formats, criteria, boundaries |
| **Insufficient Detail** | Models fill gaps with assumptions | Curated examples (3-5 canonical cases) |

**Expected improvements:** 40-70% API cost reduction, 2-3x higher task completion rates.

### 2.4 MCP (Model Context Protocol) Integration

Inkeep supports MCP, the open standard for AI-to-tool communication:

- **Tool Discovery:** Agents query servers to learn available tools dynamically
- **Standardized Calls:** Uniform JSON-RPC format across all tools
- **Structured Responses:** Predictable return formats for consistent parsing

MCP adoption eliminates the M x N integration problem and enables ecosystem evolution without vendor lock-in.

### 2.7 Database Architecture

**PostgreSQL + Drizzle ORM:**

| Schema | Purpose | Storage |
|--------|---------|---------|
| **manage-schema** | Agent configuration, projects, tools, credentials | Doltgres (versioned) |
| **runtime-schema** | Conversations, tasks, execution state | PostgreSQL |

**Data access pattern:** Functional pattern with dependency injection. Database clients passed as parameters for testability.

### 2.8 Credential Management

The SDK provides abstracted credential storage via `InkeepCredentialProvider`:

| Backend | Use Case |
|---------|----------|
| **Memory** | Default, environment variable fallback |
| **Keychain** | OS-level storage (requires `@napi-rs/keyring`) |
| **Nango** | OAuth credential management |
| **Custom** | User-implemented `CredentialStore` interface |

### 2.9 Webhook Signature Verification

Built-in HMAC signature verification for major platforms:

| Platform | Algorithm | Encoding | Notes |
|----------|-----------|----------|-------|
| **GitHub** | SHA256 | Hex | `sha256=` prefix |
| **Slack** | SHA256 | Hex | `v0:{timestamp}:{body}` format |
| **Zendesk** | SHA256 | Base64 | Timestamp header |
| **Stripe** | SHA256 | Hex | Regex extraction |

---

## Part 3: Key Features

### 3.1 AI Chat Assistants

**Deployment channels:**
- Documentation sites
- Help centers
- In-app support widgets
- Slack/Discord communities
- Product embedded

**Capabilities:**
- Instant answers from indexed documentation
- Source attribution with inline citations
- Confidence-based routing (auto-send, draft for review, escalate)
- Custom UI components (forms, cards, rich media)

### 3.2 Agent Copilots

**Integration targets:**
- Zendesk (sidebar)
- Salesforce (embedded)
- Slack (bot)
- Discord (bot)

**Agent assist features:**
- Draft response generation
- Multi-system data correlation (Salesforce, Jira, internal DBs)
- Account-specific context fetching
- Real-time API access during conversations

### 3.3 Agentic Workflows

**Automation use cases:**
- Ticket triage and routing
- Knowledge base updates from support conversations
- CRM data enrichment
- Scheduled reporting
- Cross-system process automation

**Triggering options:**
- Webhook-based (external service invocation)
- Scheduled (cron expressions)
- Event-driven (MCP server integration)

### 3.4 Analytics & Content Intelligence

**Unique capabilities:**

| Feature | Description |
|---------|-------------|
| **Gap Analysis** | Identifies unanswered questions and documentation holes |
| **AI Content Writer** | Generates draft content for knowledge gaps |
| **Query Pattern Recognition** | Tracks emerging issues across thousands of queries |
| **Feature Request Tracking** | Surfaces product feedback from support conversations |

### 3.5 Observability & Debugging

**Traces UI (Visual Builder):**
- Total conversations within 24-hour periods
- Tool calls per conversation (including MCP tools)
- Agent transfer tracking
- Agent delegation tracking

**Telemetry Options:**
- `NoOpTelemetryProvider`: No overhead (default)
- `ConsoleTelemetryProvider`: Development logging
- OpenTelemetry: Full observability with SigNoz/Langfuse/Jaeger

**Debugging Commands (Jaeger/OTLP):**
```bash
# Search traces by agent ID
curl "http://localhost:16686/api/traces?service=inkeep-agents-api&tags=%7B%22agent.id%22:%22qa-agent%22%7D"

# Find error traces
curl "http://localhost:16686/api/traces?service=inkeep-agents-api&tags=%7B%22error%22:%22true%22%7D"
```

### 3.6 Security & Compliance

- SOC 2 compliance
- PII removal capabilities
- Authentication controls
- Document-level access controls
- Audit trails for compliance-sensitive applications
- SpiceDB integration for fine-grained authorization

---

## Part 4: Deployment Options

| Option | Description | Best For |
|--------|-------------|----------|
| **Inkeep Cloud** | Fully managed SaaS | Fastest deployment, minimal ops |
| **Vercel** | Edge deployment | Next.js teams, global performance |
| **Docker Self-Hosted** | Customer infrastructure (AWS, GCP, Azure, Hetzner) | Data residency, regulated industries |
| **Hybrid** | Split deployment | Compliance + managed services |

**Self-hosting differentiator:** Full self-hosted deployment is available, unlike cloud-only competitors. Critical for regulated industries with strict data residency requirements.

---

## Part 5: Unique Value Proposition

### 5.1 Core Differentiators

1. **Multi-Agent Architecture**
   - Graph-based orchestration vs. single-agent systems
   - Specialist routing and handoff patterns
   - Scales complexity without degrading performance

2. **Dual Development Model**
   - TypeScript SDK for engineers
   - No-code visual builder for business teams
   - Full 2-way sync (unique in market)

3. **Self-Hosted Deployment**
   - Full infrastructure control
   - Data residency compliance
   - Not available from most competitors

4. **Content Intelligence**
   - AI-powered gap analysis
   - Automated content generation for KB holes
   - Continuous learning from interactions

5. **Platform Independence**
   - Works across Zendesk, Salesforce, Slack, Discord, custom apps
   - No vendor lock-in to single ecosystem
   - MCP integration for ecosystem evolution

### 5.2 Technical Advantages

| Capability | Inkeep | Typical Competitors |
|------------|--------|---------------------|
| Agent architecture | Multi-agent graph | Single-agent |
| Development model | SDK + Visual + 2-way sync | SDK or Visual (not both) |
| Deployment | Cloud + Self-hosted | Cloud-only |
| UI customization | Full React component library | Pre-built widgets |
| Observability | OpenTelemetry native | Proprietary dashboards |
| Source attribution | Auditable citation chains | Basic or undocumented |

---

## Part 6: Competitive Differentiation

### 6.1 Inkeep vs. Intercom Fin AI

| Dimension | Inkeep | Fin AI |
|-----------|--------|--------|
| **Architecture** | Multi-agent orchestration | Single-agent, no orchestration |
| **SDK** | Full TypeScript agent definition | API wrappers (2 endpoints) |
| **Deployment** | Cloud + self-hosted | Cloud-only (US, EU, AU) |
| **UI** | Full React/JS component library | Intercom Messenger theming only |
| **Observability** | OpenTelemetry native | Proprietary dashboards |
| **Source attribution** | Auditable citation chains | Undocumented |
| **Pricing** | Predictable monthly | $0.99/resolved conversation |

**When Fin AI wins:** Deep Intercom ecosystem investment, simple deflection use case.

**When Inkeep wins:** Multi-agent needs, self-hosting requirements, custom UI, developer platform.

### 6.2 Inkeep vs. Kapa.ai

| Dimension | Inkeep | Kapa.ai |
|-----------|--------|---------|
| **Positioning** | AI infrastructure platform | Standalone RAG chatbot |
| **Agent capabilities** | Multi-agent orchestration | Single-agent RAG only |
| **Content generation** | AI Content Writer (auto-draft) | Gap detection only (manual creation) |
| **Deployment** | Full self-hosted | SaaS + VPC (no on-prem) |
| **UI control** | Full React component library | Pre-built widgets, limited customization |
| **Developer experience** | OpenAI-compatible APIs, unified SDK, MCP | Traditional REST APIs |

**When Kapa wins:** Simple documentation Q&A, no scaling ambitions, existing enterprise customer.

**When Inkeep wins:** Platform needs beyond chatbot, content generation, custom UI, infrastructure flexibility.

### 6.3 Inkeep vs. Salesforce Agentforce

| Dimension | Inkeep | Agentforce |
|-----------|--------|------------|
| **Architecture** | Peer-to-peer graph (1-hop) | Central Atlas orchestrator (3-hop) |
| **SDK** | TypeScript, full code-first | Python, template-focused |
| **UI embedding** | React/JS components, any app | No web embedding libraries |
| **Platform dependency** | Independent, multi-platform | Requires Salesforce Customer 360 |
| **Knowledge intelligence** | Gap analysis, content tracking | Performance metrics only |

**When Agentforce wins:** Deep Salesforce Customer 360 investment, all-Salesforce stack.

**When Inkeep wins:** Platform independence, developer velocity, multi-platform support, content intelligence.

---

## Part 7: Case Studies & Metrics

### 7.1 Fingerprint (Fraud Detection)

| Metric | Result |
|--------|--------|
| Support tickets | 48% reduction (A/B tested) |
| User activation | 18% increase (first API calls) |
| Documentation cycles | Monthly improvements across 3+ teams |

**Quote:** "Inkeep provides feedback loops to improve our docs and identifying the gaps was probably the biggest thing we were able to solve." - Alvin Ciby, Director of Growth

### 7.2 Solana Foundation (Blockchain)

| Outcome | Details |
|---------|---------|
| Support capacity | Extended without hiring additional DevRel engineers |
| Documentation insights | Pattern recognition across thousands of queries |
| Cost efficiency | Predictable monthly vs. variable inference |
| Implementation | 4 weeks including custom crypto guardrails |

**Quote:** "Inkeep solved all this with one platform and a predictable pricing model." - John Liu, Developer Relations

### 7.3 PostHog (Developer Tools)

| Metric | Result |
|--------|--------|
| Total resolved threads | 759 (6 months) |
| AI-resolved threads | 247 |
| Auto-resolution rate | 33% |
| Customer base | 190,000+ |

**Deployment:** Started in community forums, expanded to website search, Slack bot, and product LLM integration.

### 7.4 Payabli (Fintech)

| Metric | Result |
|--------|--------|
| Deflection rate | 80% |
| Time to impact | 2 days |

**Quote:** "I've got Inkeep stuck in everything now." - Casey Smith, Head of Documentation

---

## Part 8: Use Cases by Team

| Team | Primary Use Case | Key Value |
|------|------------------|-----------|
| **CX/Support** | Ticket deflection, agent copilots | Capacity scaling without headcount |
| **DevRel** | Documentation AI, community support | Developer activation, content efficiency |
| **Technical Writing** | KB gap analysis, content generation | Docs staying fresh, reduced SME time |
| **Product** | Feature request tracking, in-app support | User feedback capture, activation rates |
| **Engineering** | Custom agent development, integrations | TypeScript SDK, flexible architecture |
| **Support Ops** | Workflow automation, multi-channel | Tool consolidation, process automation |

---

## Part 9: Build vs. Buy Considerations

### When to Buy (Inkeep)

- Less than 6 dedicated engineers for AI
- Need production deployment in days/weeks, not months
- Require native Zendesk/Salesforce integration
- Need content intelligence (gap analysis, auto-generation)
- Compliance requires audit trails and source attribution

### When to Build

- 6+ dedicated engineers with 12+ months runway
- Highly custom use case beyond support/docs
- Existing RAG infrastructure and expertise
- Unique data or model requirements

**Industry context:** 42% of companies abandoned AI initiatives in 2024 (up from 17%). 73% of RAG implementations happen at large organizations due to engineering capacity requirements.

---

## Part 10: Technical Integration Points

### 10.1 Knowledge Sources

- Documentation sites (all major platforms)
- GitHub repositories
- Community forums (Discourse, etc.)
- Support tickets (Zendesk, Intercom, Freshdesk)
- Slack/Discord conversations
- Internal handbooks and wikis
- API documentation
- Code repositories

### 10.2 Deployment Integrations

| Category | Integrations |
|----------|--------------|
| **Support platforms** | Zendesk, Salesforce, Intercom, Freshdesk |
| **Communication** | Slack, Discord |
| **Documentation** | Fumadocs, Docusaurus, GitBook, ReadMe, Mintlify |
| **Observability** | OpenTelemetry, SigNoz, Langfuse, Datadog, Grafana |
| **Infrastructure** | Vercel, Docker, AWS, GCP, Azure, Hetzner |
| **Third-party tools** | Composio, Pinecone, Firecrawl |

### 10.3 API & SDK

- OpenAI-compatible APIs
- TypeScript SDK (primary)
- React component library
- Next.js integration
- Vanilla JavaScript SDK
- Vercel AI SDK support
- MCP server integration

---

## Part 11: TypeScript SDK Deep Dive

### 11.1 SDK Primitives

The `@inkeep/agents-sdk` provides builder functions for declarative agent definition:

| Primitive | Purpose | Example |
|-----------|---------|---------|
| `agent()` | Top-level container for multiple sub-agents | Root agent definition |
| `subAgent()` | Sub-agent configurations with specialized behavior | Specialist agents |
| `tool()` | Custom tool definitions | API integrations |
| `trigger()` | Webhook trigger setup | External event handling |
| `mcpServer()` | MCP server integration | Tool discovery |
| `mcpTool()` | MCP tool definition | Standardized tools |
| `credentialReference()` | Secure credential references | API keys, OAuth |
| `dataComponent()` | Data handling components | Structured data |
| `artifactComponent()` | Artifact rendering | Citations, media |
| `externalAgent()` | External agent references | Cross-system agents |
| `transfer()` | Agent transfer definitions | Handoff patterns |

### 11.2 Agent Definition Example

```typescript
import { agent, subAgent } from "@inkeep/agents-sdk";
import { consoleMcp } from "./mcp";

const helloAgent = subAgent({
  id: "hello-agent",
  name: "Hello Agent",
  description: "Says hello",
  canUse: () => [consoleMcp],
  prompt: `Reply to the user and console log "hello world"...`,
});

export const basicAgent = agent({
  id: "basic-agent",
  name: "Basic Agent",
  description: "A basic agent",
  defaultSubAgent: helloAgent,
  subAgents: () => [helloAgent],
});
```

### 11.3 Runtime Classes

| Class | Purpose |
|-------|---------|
| `Agent` | Agent operations and lifecycle |
| `AgentGraph` | Multi-agent graph management |
| `Tool` | Base tool functionality |
| `Runner` | Graph execution engine |

### 11.4 CLI Commands

| Command | Purpose |
|---------|---------|
| `inkeep init` | Initialize a new project |
| `inkeep push` | Deploy configurations to cloud |
| `inkeep pull` | Retrieve configurations from cloud |
| `inkeep list-agent` | Display agents (with `--project` filter) |

### 11.5 UI Component Library

The `@inkeep/agents-ui` package provides React components:

```typescript
import { ChatWidget } from '@inkeep/agents-ui';

<ChatWidget
  apiUrl="https://your-api-endpoint.com"
  subAgentId="your-agent-id"
/>
```

**Features:**
- Chat interface components
- Message rendering with markdown
- Streaming response handling
- Tool call visualization
- Tailwind CSS styling

### 11.6 Project Structure

Projects bundle agents, tools, and configuration:

```typescript
import { project } from '@inkeep/agents-sdk';
import { customerSupport } from './agents/customer-support.js';
import { knowledgeBaseMcpTool } from './tools/knowledge-base-mcp.js';
import { zendeskMcpTool } from './tools/zendesk-mcp.js';

export const myProject = project({
  id: 'customer-support',
  name: 'Customer Support',
  description: 'Customer support template',
  agents: () => [customerSupport],
  tools: () => [knowledgeBaseMcpTool, zendeskMcpTool],
});
```

### 11.7 MCP Tool Definition

MCP tools connect to external services:

```typescript
import { mcpTool } from '@inkeep/agents-sdk';

export const zendeskMcpTool = mcpTool({
  id: 'zendesk-mcp',
  name: 'Zendesk',
  serverUrl: 'https://zendesk-mcp-sand.vercel.app/mcp',
});

export const knowledgeBaseMcpTool = mcpTool({
  id: 'knowledge-base-mcp',
  name: 'Knowledge Base MCP',
  serverUrl: 'https://mcp.inkeep.com/inkeep/mcp',
  imageUrl: 'https://cdn-icons-png.flaticon.com/512/12535/12535014.png',
});
```

---

## Part 12: Agent Engineering Best Practices

### 12.1 Core Principles

From Inkeep's agent engineering documentation:

1. **Treat tokens as budget:** Design with attention as a scarce resource
2. **Execution-first writing:** Prompts for what the model will do, not abstract ideals
3. **Reliability through structure:** Clear patterns > detailed explanations

### 12.2 The Goldilocks Zone

| Approach | Problem |
|----------|---------|
| **Too rigid** | Brittle enumeration breaks on unexpected inputs |
| **Too vague** | Abstract principles lack concrete guidance |
| **Just right** | Heuristics that generalize with clear escalation paths |

### 12.3 Design Pattern Selection

| Mechanism | Best For |
|-----------|----------|
| **Always-on rules** | Repository-wide constraints, no routing needed |
| **Skills** | Reusable instructions within conversation context |
| **Subagents** | Single specialized workers with tool restrictions |
| **Workflow orchestrators** | Multi-phase pipelines coordinating multiple agents |

### 12.4 Prompt Structure

Well-designed agent prompts include:
1. Role and mission statements
2. Clear scope boundaries
3. Workflow checklists
4. Tool usage policies
5. Output contracts
6. Escalation rules

---

## Part 13: Licensing & Open Source

### 13.1 License Model

**Elastic License 2.0 (ELv2)** with Supplemental Terms:
- Fair-code, source-available model
- Broad usage permitted
- Restrictions on competitive applications
- Full source code available on GitHub

### 13.2 Open Source Components

| Component | License | Notes |
|-----------|---------|-------|
| agents-sdk | ELv2 | Core SDK |
| agents-ui | ELv2 | React components |
| agents-cli | ELv2 | CLI tools |
| agents-core | ELv2 | Shared infrastructure |

### 13.3 GitHub Repository

- **URL:** https://github.com/inkeep/agents
- **Stars:** 925+
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Monorepo:** Turborepo

---

## Part 14: Cookbook Examples & Templates

### 14.1 Available Templates

| Template | Description | Agents |
|----------|-------------|--------|
| **customer-support** | Multi-agent support with KB and Zendesk | Coordinator, KB Agent, Zendesk Agent |
| **deep-research** | Web research with Firecrawl | Research Coordinator, Web Research, Web Scraping |
| **docs-assistant** | Documentation Q&A | Docs Agent |
| **meeting-prep** | Meeting preparation assistant | Meeting Prep Agent |
| **activities-planner** | Activity planning | Planner Agent |
| **weather-project** | Weather information | Weather Agent |

### 14.2 Customer Support Pattern (Multi-Agent)

This example shows a coordinator pattern with specialist sub-agents:

```typescript
import { agent, subAgent } from '@inkeep/agents-sdk';

// Specialist: Knowledge Base Agent
const knowledgeBaseAgent = subAgent({
  id: 'knowledge-base-agent',
  name: 'Knowledge Base Agent',
  description: 'Answers questions using the internal knowledge base',
  prompt: `You are a helpful assistant that answers questions using the internal knowledge base.
    Use the knowledge base tool to find relevant information.
    If you cannot find a satisfactory answer, clearly indicate that you need to escalate.`,
  canUse: () => [knowledgeBaseMcpTool],
});

// Specialist: Zendesk Agent
const zendeskAgent = subAgent({
  id: 'zendesk-agent',
  name: 'Zendesk Support Agent',
  description: 'Handles customer support inquiries using Zendesk',
  prompt: `You are a helpful customer support agent with access to Zendesk.
    Use the Zendesk tool to help resolve customer inquiries, create tickets, and manage support cases.`,
  canUse: () => [
    zendeskMcpTool.with({
      selectedTools: ['create_zendesk_ticket'],
      headers: {
        'zendesk-subdomain': '{{YOUR_ZENDESK_SUBDOMAIN}}',
        'zendesk-email': '{{YOUR_ZENDESK_EMAIL}}',
        'zendesk-token': '{{YOUR_ZENDESK_TOKEN}}',
      },
    }),
  ],
});

// Coordinator: Routes between specialists
const customerSupportCoordinator = subAgent({
  id: 'customer-support-coordinator',
  name: 'Customer Support Coordinator',
  description: 'Coordinates between knowledge base and Zendesk support',
  prompt: `You are the main customer support coordinator.
    For each inquiry:
    1. First, delegate to the knowledge base agent to find answers
    2. If the KB agent cannot provide a satisfactory answer, delegate to Zendesk agent
    3. Ensure smooth handoff between agents and maintain context`,
  canDelegateTo: () => [knowledgeBaseAgent, zendeskAgent],
});

// Top-level Agent
export const customerSupport = agent({
  id: 'customer-support',
  name: 'Customer Support',
  description: 'Comprehensive customer support system',
  defaultSubAgent: customerSupportCoordinator,
  subAgents: () => [customerSupportCoordinator, knowledgeBaseAgent, zendeskAgent],
});
```

### 14.3 Deep Research Pattern (Pipeline)

This example shows a research pipeline with tool-specific agents:

```typescript
import { agent, subAgent } from '@inkeep/agents-sdk';
import { firecrawlMcpTool } from '../tools/firecrawl-mcp';

// Coordinator: Orchestrates research flow
const deepResearchAssistant = subAgent({
  id: 'deep-research-agent',
  name: 'Deep research agent',
  description: 'A agent that can do deep research on a given topic',
  prompt: `When a user asks a question about a given topic:
    1. First use webResearchAgent to find at least 3 URL sources
    2. Then use webScrapingAgent to scrape each of the 3 URLs
    3. Call webScrapingAgent once for each URL`,
  canDelegateTo: () => [webResearchAgent, webScrapingAgent],
});

// Specialist: URL Discovery
const webResearchAgent = subAgent({
  id: 'web-research-agent',
  name: 'Web research agent',
  description: 'A agent that can use firecrawl_search to find URLs',
  prompt: `You are a helpful assistant that uses firecrawl_search to find URLs.
    Find 3 URLs that are relevant to the user's question.`,
  canUse: () => [firecrawlMcpTool.with({ selectedTools: ['firecrawl_search'] })],
});

// Specialist: Content Extraction
const webScrapingAgent = subAgent({
  id: 'web-scraping-agent',
  name: 'Web scraping agent',
  description: 'A agent that can use firecrawl_scrape to scrape URLs',
  prompt: 'You are a helpful assistant that can use firecrawl_scrape to scrape URLs',
  canUse: () => [firecrawlMcpTool.with({ selectedTools: ['firecrawl_scrape'] })],
});

// Top-level Agent
export const deepResearchAgent = agent({
  id: 'deep-research',
  name: 'Deep research',
  description: 'Intelligent research assistant that discovers, analyzes, and synthesizes information',
  defaultSubAgent: deepResearchAssistant,
  subAgents: () => [deepResearchAssistant, webResearchAgent, webScrapingAgent],
});
```

### 14.4 MCP Template Integrations

| Template | Integration | Purpose |
|----------|-------------|---------|
| **slack** | Slack MCP | Workspace messaging |
| **zendesk** | Zendesk MCP | Ticket management |
| **vercel-template** | Vercel deployment | Edge hosting |

### 14.5 Key Patterns Demonstrated

| Pattern | Example | Key Methods |
|---------|---------|-------------|
| **Delegation** | Coordinator → Specialists | `canDelegateTo: () => [agent1, agent2]` |
| **Tool Restriction** | Specialist uses subset of MCP tools | `tool.with({ selectedTools: ['tool1'] })` |
| **Tool Customization** | Per-agent headers/config | `tool.with({ headers: {...} })` |
| **Hierarchy** | agent → subAgents | `subAgents: () => [coordinator, specialist1, specialist2]` |

---

## Part 15: Database Schema Details

### 15.1 Manage Schema (Doltgres - Versioned)

Core configuration tables:

| Table | Scope | Purpose |
|-------|-------|---------|
| `projects` | Tenant | Project definitions, models, stopWhen |
| `agents` | Project | Agent config, defaultSubAgent, contextConfig |
| `sub_agents` | Agent | Sub-agent prompts, models, conversationHistoryConfig |
| `triggers` | Agent | Webhook triggers, signature verification |
| `scheduled_triggers` | Agent | Cron-based triggers, retries, timeouts |
| `skills` | Project | Reusable skill definitions (name, description, content) |
| `sub_agent_skills` | SubAgent | Skill assignments with index and alwaysLoaded flag |
| `context_configs` | Agent | Headers schema, context variables |

### 15.2 Runtime Schema (PostgreSQL - Not Versioned)

Execution and state tables:

| Table | Scope | Purpose |
|-------|-------|---------|
| `conversations` | Project | Active conversations, activeSubAgentId, metadata |
| `tasks` | SubAgent | Task execution, status, contextId |
| `api_keys` | Project | API key management (hash, prefix, expiry) |
| `trigger_invocations` | Agent | Webhook invocation records |
| `project_metadata` | Tenant | Runtime project existence tracking |
| `work_app_slack_workspaces` | Tenant | Slack workspace installations |

### 15.3 Data Access Layer

**Manage Data Access Files:**
| File | Purpose |
|------|---------|
| `agents.ts` | Agent CRUD operations |
| `subAgents.ts` | Sub-agent management |
| `tools.ts` | Tool configuration |
| `triggers.ts` | Webhook trigger management |
| `scheduledTriggers.ts` | Cron trigger management |
| `skills.ts` | Skill definitions |
| `credentialReferences.ts` | Credential management |
| `externalAgents.ts` | External agent configuration |
| `functions.ts` | Function definitions |
| `functionTools.ts` | Function tool bindings |
| `agentFull.ts` | Full agent graph operations |
| `projectFull.ts` | Full project operations |
| `evalConfig.ts` | Evaluation configuration |

**Runtime Data Access Files:**
| File | Purpose |
|------|---------|
| `conversations.ts` | Conversation state |
| `tasks.ts` | Task execution tracking |
| `messages.ts` | Message storage |
| `apiKeys.ts` | API key management |
| `triggerInvocations.ts` | Webhook invocation logs |
| `evalRuns.ts` | Evaluation run tracking |
| `contextCache.ts` | Context caching |
| `ledgerArtifacts.ts` | Artifact storage |

### 15.4 Validation Schemas

**Core Zod Schemas:**
```typescript
// Resource ID validation
export const ResourceIdSchema = z
  .string()
  .min(1).max(255)
  .regex(/^[a-zA-Z0-9\-_.]+$/)
  .refine(value => value !== 'new');

// Model configuration
export const ModelSettingsSchema = z.object({
  model: z.string().optional(),
  providerOptions: z.record(z.string(), z.any()).optional(),
});

// Stop conditions
export const StopWhenSchema = z.object({
  transferCountIs: z.number().min(1).max(100).optional(),
  stepCountIs: z.number().min(1).max(100).optional(),
});

// A2A Part types
export const PartSchema = z.discriminatedUnion('kind', [
  TextPartSchema,
  FilePartSchema,
  DataPartSchema,
]);
```

### 15.5 Key Schema Features

**Multi-Tenant Architecture:**
```typescript
const tenantScoped = {
  tenantId: varchar('tenant_id', { length: 256 }).notNull(),
  id: varchar('id', { length: 256 }).notNull(),
};

const projectScoped = {
  ...tenantScoped,
  projectId: varchar('project_id', { length: 256 }).notNull(),
};
```

**Conversation History Config:**
```typescript
conversationHistoryConfig: jsonb('conversation_history_config')
  .$type<ConversationHistoryConfig>()
  .default({
    mode: 'full',
    limit: 50,
    maxOutputTokens: 4000,
    includeInternal: false,
    messageTypes: ['chat', 'tool-result'],
  }),
```

**Trigger Signature Verification:**
```typescript
signatureVerification: jsonb('signature_verification')
  .$type<SignatureVerificationConfig | null>()
  .default(null),
```

---

## Part 16: Runtime Architecture (agents-api)

### 16.1 Runtime Agent Class

The `Agent.ts` runtime class handles LLM execution with advanced features:

**Key Capabilities:**
- Streaming and non-streaming generation via Vercel AI SDK
- Mid-generation compression for long contexts
- Tool session management
- MCP client integration
- Transfer and delegation tool creation
- Structured output with JSON post-processing

**Core Methods:**
```typescript
// Generation with stopWhen conditions
export function hasToolCallWithPrefix(prefix: string) {
  return ({ steps }) => {
    const last = steps.at(-1);
    if (last?.toolCalls) {
      return last.toolCalls.some(tc => tc.toolName.startsWith(prefix));
    }
    return false;
  };
}

// Response resolution for AI SDK class instances
export async function resolveGenerationResponse(response) {
  const [steps, text, finishReason, output] = await Promise.all([
    Promise.resolve(response.steps),
    Promise.resolve(response.text),
    Promise.resolve(response.finishReason),
    Promise.resolve(response.output),
  ]);
  return { ...response, steps, text, finishReason, output };
}
```

### 16.2 A2A Protocol Implementation

**Transfer Execution:**
```typescript
export async function executeTransfer({
  tenantId, threadId, projectId, agentId, targetSubAgentId, ref
}) {
  await setActiveAgentForThread(runDbClient)({
    scopes: { tenantId, projectId },
    threadId,
    subAgentId: targetSubAgentId,
    agentId,
    ref,
  });
  return { success: true, targetSubAgentId };
}
```

**A2A Types:**
```typescript
interface A2ATask {
  id: string;
  input: { parts: Part[] };
  context?: {
    conversationId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  };
}

interface TransferData {
  type: 'transfer';
  targetSubAgentId: string;
  fromSubAgentId?: string;
}
```

### 16.3 Execution Limits

| Limit | Default | Purpose |
|-------|---------|---------|
| `AGENT_EXECUTION_MAX_GENERATION_STEPS` | (configured) | Max steps per generation |
| `FUNCTION_TOOL_EXECUTION_TIMEOUT_MS_DEFAULT` | (configured) | Tool execution timeout |
| `LLM_GENERATION_FIRST_CALL_TIMEOUT_MS_STREAMING` | (configured) | First streaming chunk timeout |
| `LLM_GENERATION_MAX_ALLOWED_TIMEOUT_MS` | (configured) | Max total generation time |

---

## Part 17: CLI Implementation

### 17.1 Available Commands

| Command | Purpose |
|---------|---------|
| `inkeep init` | Initialize new project |
| `inkeep push` | Deploy project to cloud |
| `inkeep pull` | Retrieve project from cloud |
| `inkeep dev` | Local development server |
| `inkeep login` | Authenticate |
| `inkeep logout` | Clear credentials |
| `inkeep profile` | Manage profiles |
| `inkeep whoami` | Show current user |
| `inkeep list-agents` | List agents in project |
| `inkeep status` | Show project status |
| `inkeep add` | Add components |
| `inkeep add-ui` | Add UI components |
| `inkeep update` | Update CLI |
| `inkeep config` | Manage configuration |

### 17.2 Push Command Flow

1. **Project Detection:** Find `index.ts` in current or specified directory
2. **Config Loading:** Load from `inkeep.config.ts` with profile/tag support
3. **Environment Setup:** Set `INKEEP_TENANT_ID` and `INKEEP_API_URL`
4. **Project Loading:** Dynamic import of project definition
5. **Credential Loading:** Load environment-specific credentials if `--env` flag
6. **API Sync:** Push configuration to agents-api

**Options:**
```bash
inkeep push --project <path>  # Specify project directory
inkeep push --config <path>   # Specify config file
inkeep push --profile <name>  # Use named profile
inkeep push --env <name>      # Load environment credentials
inkeep push --all             # Push all projects
inkeep push --tag <tag>       # Use tagged config
inkeep push --quiet           # Suppress output
```

---

## Part 18: Visual Builder (agents-manage-ui)

### 18.1 Component Categories

| Category | Components |
|----------|------------|
| **Agent Management** | agent/, agents/, sub-agents |
| **Tools** | mcp-servers/, function-tools |
| **Data** | data-components/, artifact-components/ |
| **Triggers** | triggers/, scheduled-triggers/, project-triggers/ |
| **Evaluation** | evaluations/, evaluators/, evaluation-jobs/, evaluation-run-configs/ |
| **Datasets** | datasets/, dataset-items/ |
| **Auth** | auth/, credentials/, api-keys/ |
| **Skills** | skills/ |
| **External** | external-agents/, work-apps/ |
| **Observability** | traces/ |
| **UI Core** | ui/, form/, editors/, icons/, layout/, sidebar-nav/ |

### 18.2 Server Actions

The UI uses Next.js server actions for CRUD operations:
- Full TypeScript support with Zod validation
- Comprehensive error handling
- Real-time SigNoz traces integration

### 18.3 Traces Visualization

Displays real-time conversation analytics:
- Total conversations (24-hour periods)
- Tool calls per conversation (including MCP)
- Agent transfer tracking
- Agent delegation tracking

---

## Part 19: Authentication & Authorization

### 19.1 Auth Schema (Better Auth)

```typescript
// Core user table
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Session management
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
  expiresAt: timestamp('expires_at'),
});

// OAuth accounts
export const account = pgTable('account', {
  providerId: text('provider_id').notNull(),
  accountId: text('account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  userId: text('user_id').references(() => user.id),
});
```

### 19.2 Multi-Tenant Organization

```typescript
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  // ... organization settings
});

export const member = pgTable('member', {
  organizationId: text('organization_id').references(() => organization.id),
  userId: text('user_id').references(() => user.id),
  role: text('role').notNull(),
});
```

### 19.3 SSO Support

```typescript
export const ssoProvider = pgTable('sso_provider', {
  issuer: text('issuer').notNull(),
  oidcConfig: text('oidc_config'),
  samlConfig: text('saml_config'),
  domain: text('domain').notNull(),
  organizationId: text('organization_id'),
});
```

---

## Part 20: Trigger System

### 20.1 Webhook Triggers

```typescript
class Trigger {
  constructor(config: TriggerConfig) {
    this.config = {
      ...config,
      inputSchema: isZodSchema(config.inputSchema)
        ? convertZodToJsonSchema(config.inputSchema)
        : config.inputSchema,
    };
  }

  // Override configuration
  with(config: Partial<TriggerConfig>): Trigger {
    return new Trigger({ ...this.config, ...config });
  }
}
```

### 20.2 Scheduled Triggers

```typescript
class ScheduledTrigger {
  constructor(config: {
    name: string;
    cronExpression?: string;  // Cron syntax
    runAt?: string;           // One-time execution
    messageTemplate: string;
    maxRetries?: number;
    retryDelaySeconds?: number;
    timeoutSeconds?: number;
  });
}
```

### 20.3 External Agents

```typescript
class ExternalAgent {
  constructor(config: {
    id: string;
    name: string;
    description: string;
    baseUrl: string;  // External agent endpoint
    credentialReference?: CredentialReferenceApiInsert;
  });

  // Add custom headers
  with(options: { headers?: Record<string, string> });

  // Initialize (upsert in database)
  async init(): Promise<void>;
}
```

---

## References

### Source Code
- GitHub Repository: https://github.com/inkeep/agents
- AGENTS.md (Development Guide): https://github.com/inkeep/agents/blob/main/AGENTS.md

**SDK Package (`@inkeep/agents-sdk`):**
- Agent class: `packages/agents-sdk/src/agent.ts`
- SubAgent class: `packages/agents-sdk/src/subAgent.ts`
- Builders: `packages/agents-sdk/src/builders.ts`
- Triggers: `packages/agents-sdk/src/trigger.ts`, `scheduled-trigger.ts`
- External Agents: `packages/agents-sdk/src/external-agent.ts`
- Function Tools: `packages/agents-sdk/src/function-tool.ts`

**Core Package (`@inkeep/agents-core`):**
- Manage Schema: `packages/agents-core/src/db/manage/manage-schema.ts`
- Runtime Schema: `packages/agents-core/src/db/runtime/runtime-schema.ts`
- Auth Schema: `packages/agents-core/src/auth/auth-schema.ts`
- Validation: `packages/agents-core/src/validation/schemas.ts`
- Data Access: `packages/agents-core/src/data-access/`

**Agents API:**
- Runtime Agent: `agents-api/src/domains/run/agents/Agent.ts`
- A2A Protocol: `agents-api/src/domains/run/a2a/`
- Execution Handlers: `agents-api/src/domains/run/handlers/`

**CLI (`@inkeep/agents-cli`):**
- Commands: `agents-cli/src/commands/`
- Push: `agents-cli/src/commands/push.ts`

**Visual Builder:**
- Components: `agents-manage-ui/src/components/`

**Cookbook:**
- Templates: `agents-cookbook/template-projects/`
- MCP Templates: `agents-cookbook/template-mcps/`

### Documentation
- Inkeep Docs: https://docs.inkeep.com/overview
- Agent Engineering Guide: https://docs.inkeep.com/guides/agent-engineering

### Competitive Analysis
- Inkeep vs Fin AI: https://inkeep.com/blog/inkeep-vs-intercom-fin-ai
- Inkeep vs Kapa: https://inkeep.com/blog/inkeep-vs-kapa
- Inkeep vs Agentforce: https://inkeep.com/blog/inkeep-vs-agentforce
- Build vs Buy: https://inkeep.com/blog/build-vs-buy-ai-support-decision-framework-for-2026

### Technical Deep Dives
- AI Agents in B2B Support: https://inkeep.com/blog/ai-agents-in-b2b-customer-support
- Context Engineering: https://inkeep.com/blog/context-engineering-why-agents-fail
- Multi-Agent Systems: https://inkeep.com/blog/what-is-multi-agent-system
- RAG Overview: https://inkeep.com/blog/what-is-rag
- MCP Protocol: https://inkeep.com/blog/a-year-of-mcp

### Case Studies
- Fingerprint: https://inkeep.com/case-studies/fingerprint
- Solana: https://inkeep.com/case-studies/solana
- PostHog: https://inkeep.com/case-studies/posthog
- Payabli: https://inkeep.com/case-studies/payabli
