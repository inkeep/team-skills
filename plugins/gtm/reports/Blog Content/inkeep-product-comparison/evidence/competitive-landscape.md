# Evidence: Competitive Landscape

**Dimension:** Competitive Positioning
**Date:** 2026-02-19
**Sources:** Web research, competitor websites, Inkeep comparison pages, industry analysts

---

## Key sources referenced
- [Inkeep vs Kapa.ai comparison](https://inkeep.com/compare/kapa) — Feature matrix
- [Kapa.ai homepage](https://www.kapa.ai/) — Product capabilities
- [Intercom Fin pricing](https://www.intercom.com/pricing) — Pricing model
- [Decagon AI](https://decagon.ai) — Enterprise positioning
- [Sierra AI](https://sierra.ai/) — Platform and pricing
- [n8n AI features](https://n8n.io/ai/) — Agent builder capabilities
- [LangGraph](https://www.langchain.com/langgraph) — Framework capabilities
- [CrewAI](https://www.crewai.com/) — Multi-agent framework
- [Gartner AI Agent Prediction](https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025)

---

## Findings

### Finding: Kapa.ai is a point solution for developer doc Q&A with no agent capabilities
**Confidence:** CONFIRMED
**Evidence:** Inkeep comparison page lists 12 features unique to Inkeep vs Kapa: no-code builder, SDK, MCP actions, multi-agent architecture, credential management, agent traces. Kapa focuses on ingesting public/private sources for Q&A. 200+ customers, 30M+ questions. Pricing: Free → Pro ($99/mo) → Enterprise.

**Implications:** Inkeep 1.0 matches Kapa on RAG; the combined platform story (1.0 + 2.0) dramatically outpositions Kapa on extensibility and future value.

### Finding: Intercom Fin is a massive, closed-ecosystem support AI ($100M+ ARR)
**Confidence:** CONFIRMED
**Evidence:** Fin resolves 1M+ issues/week, claims 82% resolution rate. Pricing: $0.99/resolution + seat costs ($29-$139/mo). Limitations: not developer-focused, no multi-agent/A2A, 100-file upload limit, 4-8 week ramp-up, platform lock-in. No SDK or open protocols.

**Implications:** Intercom is the dominant incumbent in general support AI. Inkeep's differentiation is developer-focus, open architecture, accessible pricing, and composability.

### Finding: Decagon is enterprise-only ($95K+/yr) with strong proof points but no developer tooling
**Confidence:** CONFIRMED
**Evidence:** Serves Duolingo, Rippling, Affirm. $250M Series D at $4.5B valuation. AOPs for workflow config. Voice + chat + email. Limitations: no public pricing, engineering-heavy setup, no multi-agent A2A/SDK, not developer-focused.

**Implications:** Decagon targets the same enterprise support AI market but is inaccessible to SMBs and lacks developer composability.

### Finding: Sierra has the most mature agent development lifecycle ($10B valuation) but is fully proprietary
**Confidence:** CONFIRMED
**Evidence:** Agent OS 2.0, Agent Studio 2.0, Agent SDK, Agent Data Platform. Outcome-based pricing ($10-20/deflection, ~$50K impl fee). $150M+ ARR. SOC 2, ISO 27001, HIPAA. Multi-agent orchestration. Limitations: no open-source, no self-hosting, enterprise-only, not developer-focused.

**Implications:** Sierra is the closest competitor in sophistication but is entirely closed/proprietary. Inkeep's open architecture is a clear counter-position.

### Finding: n8n has 400+ integrations but is not conversation-native and lacks built-in RAG
**Confidence:** CONFIRMED
**Evidence:** Visual workflow automation with AI agent builder. 400+ pre-built nodes. Self-hosted community edition (free). Limitations: no persistent agent memory, no built-in RAG, no eval framework, no native tracing, workflow-trigger-based (not conversational), no A2A protocol.

**Implications:** n8n is the strongest horizontal competitor due to integration breadth, but building a conversational support agent requires significant custom work.

### Finding: LangGraph is the most flexible agent framework but is code-only, Python-only
**Confidence:** CONFIRMED
**Evidence:** Graph-based state machine architecture. Used by Uber, LinkedIn, Klarna. v1.0 stable release. Python-only. LangSmith for tracing (separate paid product). Limitations: no visual builder, no built-in RAG, no customer ops features, no TypeScript SDK, no credential management.

**Implications:** LangGraph targets sophisticated ML engineers. Inkeep's dual-mode (code + no-code) and domain focus are key differentiators.

### Finding: CrewAI has enterprise security gaps and production scalability concerns
**Confidence:** CONFIRMED
**Evidence:** Role-based multi-agent framework. CrewAI Studio for no-code. Limitations: no RBAC/sandboxing, weak observability, limited long-running agent support, Python-only, no MCP/A2A, known unresolved high-severity bugs. Pricing: Free → $25/mo → $120K/yr.

**Implications:** CrewAI is accessible but lacks production readiness. Inkeep's enterprise security (SpiceDB RBAC), OTEL observability, and TypeScript-native stack are clear advantages.

### Finding: Market is growing rapidly with 46.3% CAGR
**Confidence:** CONFIRMED
**Evidence:** AI agent market: $7.84B (2025) → $52.62B (2030). Gartner: 40% of enterprise apps will include AI agents by 2026 (up from <5%). Multi-agent inquiry growth: 1,445% Q1 2024 to Q2 2025.

---

## Synthesis: Inkeep's Three-Circle Positioning

Inkeep uniquely sits at the intersection of three competitive circles:

1. **RAG/Search Expertise** (vs Kapa.ai) — 33+ source connectors, citation quality, developer content optimization
2. **Agent Platform** (vs n8n/LangGraph/CrewAI) — Multi-agent, A2A, MCP, SDK, no-code builder, evals, traces
3. **Customer Operations Focus** (vs Intercom/Decagon/Sierra) — Conversation management, support integrations, customer-facing analytics

No single competitor covers all three circles.

---

## Gaps / follow-ups
- Sierra's Agent SDK capabilities vs Inkeep's SDK not deeply compared (Sierra's SDK is proprietary/closed)
- n8n's new AI agent features (2026) may narrow the gap on conversation-native capabilities
- Actual customer win/loss data against each competitor would validate positioning claims
