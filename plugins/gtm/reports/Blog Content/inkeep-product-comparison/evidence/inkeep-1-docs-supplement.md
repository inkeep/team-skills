# Evidence: Inkeep 1.0 Documentation Supplement

**Dimension:** Inkeep 1.0 Capabilities (docs-sourced additions)
**Date:** 2026-02-19
**Sources:** /Users/edwingomezcuellar/docs/website/content (local filesystem)

---

## Key files referenced
- `/docs/website/content/docs/support-tools/auto-reply/tickets.mdx` — Ticket auto-reply implementation
- `/docs/website/content/docs/support-tools/auto-reply/live-chat.mdx` — Live chat auto-reply
- `/docs/website/content/docs/support-tools/ticket-routing/api.mdx` — Smart routing API
- `/docs/website/content/docs/support-tools/agent-copilot/overview.mdx` — Support copilot ("Keep")
- `/docs/website/content/docs/support-tools/agent-copilot/prehook.mdx` — Prehook API for dynamic context
- `/docs/website/content/docs/support-tools/agent-copilot/zendesk.mdx` — Zendesk native app
- `/docs/website/content/docs/ai-api/` — AI API models (inkeep-qa, inkeep-context, inkeep-base, inkeep-rag)
- `/docs/website/content/docs/sources/onboard-new-sources.mdx` — Content source types
- `/docs/website/content/docs/analytics/usage-reports.mdx` — Analytics dashboard
- `/docs/website/content/docs/analytics/content-gaps.mdx` — Content gap detection
- `/docs/website/content/docs/ui-components/overview.mdx` — Widget SDK components
- `/docs/website/content/docs/faqs/pricing.mdx` — Pricing model

---

## Findings

### Finding: Auto-reply is fully implemented via webhook + Vercel template + inkeep-qa API
**Confidence:** CONFIRMED
**Evidence:** Ticket auto-reply uses Zendesk webhooks → Vercel serverless function → `inkeep-qa` API. Confidence-gated: public reply if `very_confident`, internal note otherwise. Customizable by ticket tags and attributes. Template: `zendesk-inkeep-autoreply-template`. Live chat auto-reply also available via Zendesk Messaging with seamless human handoff.

### Finding: Smart routing uses inkeep-context API with structured extraction
**Confidence:** CONFIRMED
**Evidence:** `inkeep-context` API categorizes tickets (feature_request, account_billing, production_issue), extracts structured fields via Zod schemas (invoice IDs, customer references), labels tickets with auto-filled subjects, summarizes and adds internal notes. Model: `inkeep-context-expert` or pinned to specific models (Claude, GPT-4).

### Finding: 4 distinct AI API models with multiple variants each
**Confidence:** CONFIRMED
**Evidence:**
- `inkeep-qa`: Q&A with sensible defaults for tone, citations, brand protection
- `inkeep-context`: Flexible RAG passthrough, tool calling, JSON mode, image inputs
- `inkeep-base`: Fast, no RAG, only general product overview
- `inkeep-rag`: Raw RAG chunks with URLs and excerpts
Each available in variants: `-expert`, `-sonnet-4-5`, `-gpt-4.1`, `-gpt-4.1-mini`, `-gpt-4.1-nano`

### Finding: 50+ content source types across 8 categories
**Confidence:** CONFIRMED
**Evidence:** Doc platforms (Docusaurus, GitBook, Mintlify, ReadMe, MkDocs, VitePress, etc.), CMS (WordPress, Sanity, Contentful, Prismic, DatoCMS, etc.), knowledge management (Notion, Confluence, Google Drive), support tickets (Zendesk, Freshdesk, Help Scout, Intercom), community (Slack, Discord, Discourse), dev platforms (GitHub, OpenAPI specs, GraphQL specs, changelogs), marketing (Webflow, Framer), files (PDF, CSV, DOCX, YouTube). "33+" in marketing is conservative.

### Finding: Prehook API enables dynamic context injection from external systems
**Confidence:** CONFIRMED
**Evidence:** Custom API endpoint receives ticket/user/org attributes, returns enriched context + custom prompt instructions. Use cases: payment/billing from CRM, account info from external systems, activity data from product DB, uptime from monitoring tools. Deployed via Vercel template (`copilot-prehook-template`). Context persists across entire conversation. Encrypted header storage.

### Finding: 7 widget components with 40+ framework integrations
**Confidence:** CONFIRMED
**Evidence:** Components: chat button, sidebar chat, embedded chat, search bar, embedded search+chat, intelligent form, custom modal trigger. Framework integrations: Next.js, Docusaurus, Astro, VitePress, Webflow, Framer, GitBook, ReadMe, Discourse, WordPress, and 30+ more. Both React (`@inkeep/cxkit-react`) and JS snippet deployment.

### Finding: Support copilot has 5 modes, not 4
**Confidence:** CONFIRMED
**Evidence:** Draft Answers (editable AI responses), Quick Links (relevant sources), Summaries & To-Dos (actionable items), Sentiment Analysis (emotional cues + quick replies), Turn Tickets into FAQ (knowledge base generation).

### Finding: Pricing is usage-based with no free tier
**Confidence:** CONFIRMED
**Evidence:** No free tier. 30-day sandbox demo (no payment, no account required). Usage-based pricing quoted on expected patterns. Self-serve plans via Stripe. Enterprise plans with white-labeling add-on. No open-source discounts. Fair use monitoring.

### Finding: Analytics includes AI-powered content gap and feature request reports
**Confidence:** CONFIRMED
**Evidence:** Weekly and monthly automated AI reports with two sections: (1) Features & Functionality (product gaps with AI summaries), (2) Third-Party Integrations (integration requests and tool usage insights). Plus: conversation metrics, thumbs up/down, code snippets copied, shared chats, CSV export.

---

## Gaps / follow-ups
- REST API documentation is "contact support for preview docs" — suggests it may be evolving
- Rate limits: 30 messages/session, per-IP throttling, higher limits on request
- Zendesk live chat auto-reply requires contacting support team (not self-serve template)
