# Evidence: Platform Vision & Use Cases

**Dimension:** Agentic Customer Operations Vision
**Date:** 2026-02-19
**Sources:** Product team context (Edwin Gomez Cuellar, Inkeep co-founder), Inkeep 1.0 docs, Inkeep 2.0 docs + codebase

---

## Key context
This evidence captures the strategic product vision shared directly by the Inkeep team, validated against documentation and codebase capabilities.

---

## Findings

### Finding: Auto-reply and triage have a clear 1.0 → 2.0 evolution path
**Confidence:** CONFIRMED
**Evidence (1.0 implementation):** Vercel templates calling `inkeep-qa` API for auto-reply, `inkeep-context`/`inkeep-rag` for routing/triage. Webhook-triggered from Zendesk. Code-based, template-deployed.

**Evidence (2.0 implementation):** Same outcomes via platform primitives:
- **Trigger**: Webhook from support platform (Zendesk, Freshdesk, etc.) invokes agent
- **Agent**: Custom logic for triage, classification, response generation
- **Inkeep RAG MCP**: Child MCP of the agent for researching company product information
- **Support Platform MCP**: Zendesk MCP (or other platform MCP) for actions — reply, tag, route, escalate
- **Customer MCPs**: Additional context sources — CRM, product analytics, APM, CDP

**Product team context:** "We don't have templates for it yet on 2.0, but you'd do it using triggers and agents using MCPs. Today we tell prospects that we'll provide premium templates and then we basically do the work on the fly to build the agents and MCPs needed. We're working on codifying that into proper templates and an MCP library."

### Finding: MCP library strategy spans 4 tiers
**Confidence:** CONFIRMED (product team)
**Evidence:** The MCP ecosystem is structured as:
1. **Native MCP servers**: Provided by SaaS vendors themselves (Notion, Sentry, Linear, Vercel, etc.)
2. **Bring your own**: Customers connect their existing MCP servers
3. **Custom by Inkeep**: Part of professional services / onboarding — Inkeep builds MCPs for customer-specific systems (e.g., Zendesk MCP)
4. **Composio**: ~10,000 pre-built integrations via Composio platform

### Finding: Platform enables use cases far beyond support — internal copilots and agentic workflows
**Confidence:** CONFIRMED (product vision + platform capabilities)
**Evidence:** The 2.0 platform primitives (agents, sub-agents, MCPs, triggers, skills, Inkeep RAG) enable:

**Internal Copilots** (conversational — talk to them in Slack or UI):
- CSM agent: Ask about account status, support history, usage metrics before QBR preparation
- Internal knowledge agent: Company-specific Q&A across Confluence, Notion, Slack history
- Sales enablement agent: Answer questions about product capabilities, competitive positioning
- Engineering oncall agent: Research incidents using APM/logging MCPs

**Agentic Workflows** (trigger/schedule-based — run autonomously):
- Meeting prep: Researches prospects via web/LinkedIn/Apollo/Clay MCPs, prepares briefing notes
- Daily sales brief: Morning aggregation of meetings, pipeline changes, new leads, account alerts
- Lead qualification: Inbound lead → enrich → score → route to right rep → prepare context
- QBR generation: Aggregates account data → writes QBR document into Notion or elsewhere
- Support triage: Beyond 1.0 routing — categorize + enrich with full customer context + check known issues + route + draft response

**Product team context:** "That's what we mean by internal copilots vs agentic workflows and what the agentic platform enables beyond the traditional 'AI Support Chat + Auto Reply' capabilities that support platform or AI support agent companies often focus on."

### Finding: Extensibility is the key differentiator in 2.0's approach
**Confidence:** CONFIRMED
**Evidence:** The same agent architecture that handles support auto-reply can be extended to:
- Add CRM MCPs to research user/account information
- Add APM MCPs (Datadog, New Relic) to check logs and telemetry
- Add CDP/datalake access for customer context
- Add product analytics (Amplitude, Mixpanel) for usage patterns
- Add communication MCPs (Slack, email) for delivering results

This means a support triage agent can evolve from "categorize and route" to "categorize, enrich with full business context, check for known issues, draft a resolution, and escalate with context" — without changing the core architecture.

---

## Implications for GTM

### Three-tier maturity narrative:
1. **Day 1 (1.0)**: Out-of-box AI chatbot + copilot + auto-reply + routing. Working in 30 minutes.
2. **Month 1-3 (1.0→2.0)**: Extend auto-reply with CRM context. Build custom triage agents.
3. **Month 3+ (2.0)**: CSM copilots, meeting prep agents, daily briefs, internal knowledge agents.

### Competitive reframe:
- Kapa.ai: stops at "docs chatbot" — no path to agents
- Intercom/Decagon/Sierra: stops at "support automation" — can't extend to sales/CSM/internal use cases
- n8n/LangGraph/CrewAI: can build agents but have no RAG backbone or day-1 support value

### Sales conversation shift:
From "AI support chatbot" (crowded market) to "agentic customer operations platform" (unique positioning).

---

## Gaps / follow-ups
- 2.0 template library for auto-reply/triage is in progress — timeline for availability?
- Zendesk MCP: what specific tools does it expose? (reply, tag, route, assign, close?)
- Premium template pricing model for professional services setup
- Customer success stories for the Tier 2/3 use cases (CSM copilots, meeting prep)
