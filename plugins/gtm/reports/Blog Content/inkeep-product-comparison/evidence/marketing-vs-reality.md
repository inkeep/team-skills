# Evidence: Marketing Claims vs Code Reality

**Dimension:** Marketing Claims vs Code Reality
**Date:** 2026-02-19
**Sources:** All 4 public surfaces cross-referenced with both codebases

---

## Findings

### Finding: "10,000+ integrations" claim is via Composio, not Inkeep-built
**Confidence:** CONFIRMED
**Evidence:** 2.0 docs claim access to 10,000+ integrations via Composio MCP. Code confirms Composio integration exists in agents-mcp package. But Inkeep's own first-party MCP servers are only GitHub and Slack (in agents-work-apps).

**Implications for sales:** Technically true but misleading if a customer expects 10,000 native integrations. The Composio connection provides breadth but each integration's quality/depth varies. Sales should say "access to 10,000+ integrations via our Composio MCP connector."

### Finding: "2-way code-UI sync" is real and implemented
**Confidence:** CONFIRMED
**Evidence:** agents-cli provides `inkeep push` and `inkeep pull` commands. Push parses TypeScript agent definitions and upserts to API. Pull generates TypeScript from API state. Database is source of truth. Visual builder immediately reflects push changes.

**Implications for sales:** This is a genuine differentiator. Can be demonstrated. The claim holds up.

### Finding: "33+ content sources" in 1.0 is accurate
**Confidence:** CONFIRMED
**Evidence:** `/apps/dashboard/src/components/Sources/consts.ts` lists 33+ source type configurations including all documented connectors. OAuth via Nango for most enterprise sources.

**Implications for sales:** Solid claim. Can be shown in dashboard UI.

### Finding: Support copilot "11 platform integrations" — only 1 is a native app
**Confidence:** INFERRED
**Evidence:** Docs list 11 platforms: Zendesk, Salesforce, HubSpot, Intercom, Help Scout, Front, Jira, Freshdesk, Plain, Atlas, Missive. Codebase confirms only Zendesk has a native app (apps/zendesk/). Others likely work via Chrome extension iframe (copilot-iframe-app) that embeds on any support platform page.

**Implications for sales:** The integrations work but the experience varies. Zendesk is native/polished. Others rely on the Chrome extension overlay. Sales should know which platforms have native vs extension-based experiences.

### Finding: "Auto Reply" for tickets — documented but unclear automation level in code
**Confidence:** UNCERTAIN
**Evidence:** 1.0 docs and marketing prominently feature "Auto Reply" and "confidence filtering." Code shows draft generation (SmartAssistActions.ts) with a `cbApplyDraft` callback, but fully automated no-human-in-the-loop auto-reply is not visible in the management repo. It may exist in a separate backend service or via Zendesk webhook configuration.

**Implications for sales:** May need clarification on whether auto-reply means "generates draft for agent to approve" or "automatically sends reply without human review." The code suggests the former with an option for the latter via external configuration.

### Finding: "Smart Routing" — documented in marketing, not clearly visible in code
**Confidence:** UNCERTAIN
**Evidence:** 1.0 marketing claims "Intelligent support forms for ticket deflection" and "Ticket routing and smart labeling." The management codebase shows rules/conditions system that could enable routing, but no dedicated routing engine or classification service is visible.

**Implications for sales:** May be implemented in a separate backend service, or may be a roadmap item that's marketed ahead of availability.

### Finding: "AI for Sales" / "Sales Enablement" — marketed in 2.0, no code evidence
**Confidence:** NOT FOUND
**Evidence:** 2.0 marketing lists "Sales" as a persona use case. No sales-specific agents, tools, or templates found in the agents codebase. test-agents/ and agents-cookbook/ don't contain sales-focused examples.

**Implications for sales:** This is aspirational positioning. The platform CAN be used for sales (it's general-purpose), but there are no pre-built sales agents or templates. Sales team should position as "you can build sales agents" not "we have sales agents."

### Finding: "Only Agent Platform where engineering and business teams ship together" — architecturally true
**Confidence:** CONFIRMED (claim about 2-way sync)
**Evidence:** The 2-way sync between TypeScript SDK and visual builder is a genuine technical achievement. Engineering edits in code, business edits in UI, both stay in sync via the database. No competitor comparison pages show a similar claim being refuted.

**Implications for sales:** Strong differentiator with demo-able proof point.

### Finding: "Fair-code" licensing — confirmed in docs, not verified in source
**Confidence:** INFERRED
**Evidence:** 2.0 docs and pricing reference "Open Source" tier. The agents repo likely uses a source-available license (similar to Sentry, n8n). Specific license file not examined in this research.

### Finding: Customer logos consistent across surfaces but testimonials are 1.0-era only
**Confidence:** CONFIRMED
**Evidence:** 2.0 marketing shows 8 logos (Postman, Anthropic, Midjourney, Pinecone, PostHog, Solana, Clerk, Clay). 1.0 marketing shows 11 logos (adds Render, Neon, Zilliz) plus 13 named testimonials. All 13 testimonials reference 1.0 features (chatbot, search, docs). No testimonials reference 2.0 agent platform features.

**Implications for sales:** Social proof is anchored in 1.0's success. 2.0 doesn't yet have its own customer stories. Sales should be prepared for prospects to notice this gap.

### Finding: 2.0 pricing tiers align with feature availability
**Confidence:** CONFIRMED
**Evidence:** Open Source = agent builder + SDK + MCP + observability (all in OSS codebase). Cloud = managed hosting. Enterprise = adds "Unified AI Search" (1.0 RAG), Slack/support integrations, PII removal, SSO, RBAC, audit logs.

**Implications for sales:** "Unified AI Search" (1.0's RAG) is an Enterprise upsell. Free/Cloud users of 2.0 don't automatically get 1.0's content ingestion. This is a key packaging detail.

### Finding: Competitor comparison pages (vs n8n, vs CrewAI) claim capabilities that span both products
**Confidence:** CONFIRMED
**Evidence:** Comparison pages list features like "unified AI search," "managed knowledge base ingestion," "support for Zendesk, Salesforce" alongside "multi-agent architecture," "2-way code-to-UI sync." These span 1.0 and 2.0 without distinction. A prospect reading these would assume it's one product.

**Implications for sales:** The comparison pages tell the unified story well. But a prospect who signs up for the free OSS tier expecting "unified AI search" won't find it — that's Enterprise/1.0. Sales needs to manage this expectation gap.

---

## Negative searches

* Searched: "auto-reply" implementation in management codebase → found draft generation with apply callback, no fully automated send loop
* Searched: "routing" or "classification" engine in management codebase → found rules system with conditions, no dedicated routing service
* Searched: sales-specific agents or templates in agents codebase → not found
* Searched: shared auth or SSO between 1.0 and 2.0 codebases → not found (completely separate auth systems)
* Searched: shared billing or subscription management → not found

---

## Gaps / follow-ups
- Verify auto-reply and smart routing implementations in separate backend services (not in the management monorepo)
- Verify license file in agents repo for fair-code claim specifics
- Investigate whether any 2.0 customers exist with testimonials in pipeline
