---
title: "Support Leadership Personas & Inkeep Feature Mapping"
description: "Comprehensive guide to Manager+ support roles in B2B SaaS—combining persona research (who they are, pain points, metrics, buying behavior) with Inkeep feature mapping (how Inkeep solves their problems). Covers 8 roles: Technical Support Manager, Support Engineering Manager, Director of Technical Support, Customer Support Engineer, VP of Support, Head of Support, Support Operations Manager, and CX Director/VP."
createdAt: 2026-02-25
updatedAt: 2026-02-25
subjects:
  - B2B SaaS support
  - Support engineering
  - Support leadership
  - Inkeep
topics:
  - persona research
  - feature mapping
  - pain point resolution
  - GTM messaging
---

# Support Leadership Personas & Inkeep Feature Mapping

**Purpose:** Provide actionable insights on Manager+ support roles in B2B SaaS—who they are, what they care about, and how Inkeep solves their problems. Use this for blog content, sales messaging, and demo narratives.

---

## Executive Summary

This report covers **8 support leadership personas** with both persona intelligence and Inkeep product mapping:

### Technical Roles (4)
- Technical Support Manager
- Support Engineering Manager
- Director of Technical Support
- Customer Support Engineer

### Non-Technical Leadership (4)
- VP of Support
- Head of Support
- Support Operations Manager
- CX Director / VP Customer Experience

**Key Insight:** Technical support roles are not general support roles. They require engineering-adjacent solutions that speak to escalation management, code-level debugging, and product feedback loops. Generic "AI chatbot" messaging fails with this audience.

### Persona-to-Feature Quick Reference

| Persona | Primary Pain | Top Inkeep Feature | Demo Focus |
|---------|-------------|-------------------|------------|
| Technical Support Manager | Quality vs. speed | Auto-Reply (confidence-gated) | Deflection without quality loss |
| Support Engineering Manager | Escalation friction | Smart Routing + Prehook API | Support-to-engineering handoff |
| Director Technical Support | "Cost center" perception | Analytics + Platform consolidation | ROI dashboard |
| Customer Support Engineer | Repetitive work, 6+ tools | Support Copilot (5 modes) | One search, all sources |
| VP of Support | Frozen headcount, data silos | Multi-agent workflows + Analytics | Board-ready metrics |
| Head of Support | Scaling without headcount | Auto-Reply + 24/7 coverage | Capacity multiplication |
| Support Operations Manager | Tool sprawl, manual processes | 50+ Connectors + Automation | Integration depth |
| CX Director / VP CX | Data silos, cross-functional | Unified platform + Gap analytics | Unified customer view |

---

## Part A: Technical Support Roles

### 1. Technical Support Manager

**Who They Are:**
Manages a team of technical support specialists handling code-level issues, API problems, and integration debugging. Distinct from general support managers—their team requires engineering skills.

**Compensation:** $127K average ($99K-$165K range); Senior: $146K ($114K-$189K)

#### Day-to-Day Activities
- Queue and ticket management (monitoring, prioritization)
- Direct supervision (1:1s, coaching, performance)
- Escalation handling (complex customer issues)
- Cross-functional meetings with engineering/product
- Training and development (onboarding, skills)
- Metrics and reporting (performance, leadership updates)
- Process improvement (workflows, knowledge base)

#### Metrics They Track

| Metric | Target | Inkeep Impact |
|--------|--------|---------------|
| Time to Resolution (TTR) | Lower is better | Auto-reply resolves instantly; Copilot accelerates manual |
| Escalation Rate | <15-20% | AI handles Tier 1; accurate routing reduces ping-pong |
| First Contact Resolution | 60-70% | Copilot researches 50+ sources before first response |
| CSAT | 85%+ | Faster, more accurate responses improve satisfaction |
| SLA Compliance | 90%+ | Auto-reply maintains times during volume spikes |

#### Pain Points → Inkeep Solutions

| Pain Point | How Inkeep Resolves It |
|------------|------------------------|
| **Quality vs. speed tradeoff** | Confidence-gated auto-reply: public if `very_confident`, internal note if uncertain. No superficial resolutions. |
| **Escalation rate climbing** | Copilot researches 50+ sources before suggesting escalation. AI triage categorizes accurately. |
| **Scaling without headcount** | One copilot assists entire team. Auto-reply handles spikes. Agents run 24/7. |
| **Support-Success misalignment** | Content gap analytics surfaces insights for CS/Product. Weekly reports identify patterns. |
| **Product gap ambiguity** | Smart routing extracts structured fields. Analytics aggregate to distinguish "support issue" from "product gap." |

#### Day-to-Day With vs. Without Inkeep

| Activity | Without Inkeep | With Inkeep |
|----------|---------------|-------------|
| Queue monitoring | Manual triage, one-by-one | Auto-categorized, pre-researched, priority-flagged |
| 1:1 coaching | Review cold tickets | Review AI-suggested responses, coach on edge cases |
| Escalation handling | Dig through docs for context | Copilot provides sources, customer history |
| Process improvement | Guess at doc gaps | AI gap reports identify exactly what to fix |

#### Buying Behavior
- **Budget Authority:** Operational tool budget ($10K-$50K)
- **Evaluation:** "Will this make my team's life easier?"
- **Decision Process:** POC with team subset, agent feedback critical

#### Messaging
- **Problem:** "Your team is spending 60% of time on repetitive issues AI could handle."
- **Solution:** "Inkeep's confidence-gated auto-reply handles routine questions while agents focus on complex issues."
- **Proof:** Escalation reduction, FCR improvements, agent productivity
- **CTA:** "See the 5-minute demo" / "ROI calculator for your team size"

#### Blog Content That Resonates
- "How to reduce escalation rate without adding headcount"
- "The metrics that actually predict support team success"
- "Why confidence-gated auto-reply outperforms pure automation"

---

### 2. Support Engineering Manager

**Who They Are:**
Leadership role overseeing support engineering team, often aligned with engineering org. Bridge between ICs and directors. May report to VP Engineering or CTO.

#### Day-to-Day Activities
- Team management (hiring, mentoring, performance)
- Strategic planning (support strategy, process improvement)
- Resource allocation (budget, tooling decisions)
- Customer satisfaction (ensuring technical quality)
- Cross-functional coordination (engineering, product, CS)

#### Metrics They Track

| Metric | Target | Inkeep Impact |
|--------|--------|---------------|
| Bug Report Quality | High completeness | Structured extraction enforces required fields |
| Escalation Accuracy | Right team, first time | Smart routing with category-based rules |
| Documentation Impact | Measurable ticket reduction | Gap analytics identify exactly what to document |
| Cross-team CSAT | Internal feedback | Better context = happier engineering team |

#### Pain Points → Inkeep Solutions

| Pain Point | How Inkeep Resolves It |
|------------|------------------------|
| **Escalation friction ("ping pong")** | `inkeep-context` API extracts structured fields using Zod schemas. Categorizes accurately on first try. |
| **Support-engineering silos** | Prehook API injects CRM, billing, analytics, APM logs into copilot decisions. Engineering sees full context. |
| **Debugging complexity** | Copilot + RAG searches 50+ sources: docs, GitHub issues/PRs, OpenAPI specs, Slack, Zendesk tickets. |
| **Product gap ambiguity** | AI aggregates feature requests. Weekly reports categorize "support issue" vs "product gap" with evidence. |
| **Short-term vs. long-term** | Content gap analytics identify recurring issues. Data supports prioritizing fixes over band-aids. |

#### Day-to-Day With vs. Without Inkeep

| Activity | Without Inkeep | With Inkeep |
|----------|---------------|-------------|
| Escalation review | Read through long threads | AI summary + extracted fields + relevant sources |
| Engineering handoff | Write detailed context manually | Copilot drafts handoff with all context |
| Bug report quality | Variable by agent | Structured extraction ensures consistency |
| Product roadmap input | "We hear this a lot" | Data-backed feature request reports |

#### Buying Behavior
- **Budget Authority:** Influences engineering tooling budget
- **Evaluation:** Technical depth, integration with engineering workflow
- **Decision Process:** Technical POC, engineering team feedback

#### Messaging
- **Problem:** "The line between support issue and product gap is costing you."
- **Solution:** "Inkeep extracts structured fields and aggregates patterns. Data, not anecdotes, for roadmap discussions."
- **Proof:** Bug report quality, escalation accuracy, product feedback loop
- **CTA:** "Technical deep-dive on our architecture" / "See the escalation workflow"

#### Blog Content That Resonates
- "Breaking down support-engineering barriers with AI"
- "When is it a support issue vs. a product gap? A framework"
- "Effective escalation management: From support to engineering"

---

### 3. Director of Technical Support

**Who They Are:**
Senior leadership setting vision and strategy for technical support department. Manages multiple teams, works cross-departmentally.

**Compensation:** $120K-$150K base + performance bonuses, equity

#### Day-to-Day Activities
- Shaping and executing technical support strategy
- Developing service level standards
- Driving continuous improvement initiatives
- Managing 5-8 direct reports (including managers)
- Leading cross-functional teams domestically/globally
- Executive summaries of site health
- Driving business unit scorecards and SLAs

#### Metrics They Track

| Metric | Target | Inkeep Impact |
|--------|--------|---------------|
| Department Cost | Budget adherence | AI reduces cost-per-ticket; fewer tools = lower stack cost |
| Headcount Efficiency | Output per FTE | AI multiplies agent capacity |
| Technology ROI | Measurable impact | Clear before/after: deflection, TTR, escalation |
| Strategic NPS | Executive perception | Support delivers product insights, not just resolution |

#### Pain Points → Inkeep Solutions

| Pain Point | How Inkeep Resolves It |
|------------|------------------------|
| **"Cost center" perception** | Analytics demonstrate support as revenue protector. Deflection, CSAT, escalation all quantifiable. |
| **Tool sprawl** | Platform consolidation: chatbot, copilot, auto-reply, routing, analytics, custom agents in one. |
| **Frozen headcount** | Auto-reply handles volume without FTEs. Scheduled agents run overnight. |
| **Rising expectations** | 24/7 AI coverage + consistent quality. Confidence gating ensures quality. |
| **Technology ROI justification** | Day-1 value (1.0) with growth path (2.0). Cost per resolution calculable. |

#### Day-to-Day With vs. Without Inkeep

| Activity | Without Inkeep | With Inkeep |
|----------|---------------|-------------|
| Strategic planning | Gut feel + anecdotes | Data-driven insights from analytics |
| Resource allocation | Reactive to crises | Predictive based on content gaps |
| Executive reporting | Manual metric compilation | Dashboard + AI-generated summaries |
| Technology evaluation | RFPs for each capability | One platform covers multiple needs |

#### Buying Behavior
- **Budget Authority:** Full authority for support technology stack
- **Evaluation:** Strategic alignment, vendor references, support quality
- **Decision Process:** 3-6 month cycles, security review, executive buy-in

#### Messaging
- **Problem:** "Support is still seen as a cost center—how do you prove revenue impact?"
- **Solution:** "Inkeep quantifies support's value: deflection, CSAT, content gap reports that drive product decisions."
- **Proof:** Cost reduction numbers, technology ROI, before/after metrics
- **CTA:** "Executive briefing" / "ROI analysis for enterprise support"

#### Blog Content That Resonates
- "From cost center to value driver: Transforming technical support"
- "AI in technical support: What actually works (and what doesn't)"
- "Building the business case for support technology investments"

---

### 4. Customer Support Engineer / Technical Support Engineer

**Who They Are:**
Individual contributors with engineering-adjacent skills handling complex technical issues. Strong influencers in tool evaluation—primary users of support tooling.

**Technical Skills Required:**
- API troubleshooting (REST, SOAP, JSON, XML)
- Version control (Git), log analysis, debugging
- Cloud-native (AWS, Azure), scripting (PowerShell, Bash)
- For developer tools: Ruby on Rails, Kubernetes, CI/CD

**Career Progression:**
1. Associate Support Engineer → 2. Support Engineer → 3. Senior → 4. Staff
- Alternative paths: Solutions Architect, Product Manager, DevRel, Engineering

#### Metrics They Track

| Metric | Target | Inkeep Impact |
|--------|--------|---------------|
| Resolution Accuracy | High | RAG ensures accurate, sourced answers |
| Knowledge Contribution | KB articles created | "Turn Ticket into FAQ" lowers friction |
| Complex Case Ratio | Higher = skill growth | AI handles simple; engineer handles complex |
| Tool Efficiency | Time saved per ticket | Copilot reduces research time significantly |

#### Pain Points → Inkeep Solutions

| Pain Point | How Inkeep Resolves It |
|------------|------------------------|
| **Repetitive work** | Auto-reply resolves common questions. Copilot drafts responses for review. |
| **Tooling frustration** | 5-mode copilot: Draft Answers, Quick Links, Summaries, Sentiment, Turn Ticket to FAQ. |
| **Documentation gaps** | RAG searches 50+ sources: GitHub PRs, OpenAPI specs, internal docs, Slack, tickets. |
| **Career growth concern** | AI handles Tier 1; engineers focus on Tier 2/3. Skills stay sharp on complex issues. |
| **Recognition for complexity** | Metrics capture resolution quality, not just speed. |

#### Day-to-Day With vs. Without Inkeep

| Activity | Without Inkeep | With Inkeep |
|----------|---------------|-------------|
| Researching issues | Manual searches across 6+ systems | One copilot searches all sources |
| Drafting responses | Write from scratch | AI draft, refine, send |
| Debugging API issues | Search docs, GitHub, Slack manually | Copilot surfaces OpenAPI specs, PRs, past tickets |
| Creating KB articles | Time-consuming, low priority | "Turn Ticket into FAQ" automates |

#### Buying Behavior
- **Budget Authority:** Limited; strong influencer
- **Evaluation:** Technical depth, integration with existing tools
- **Decision Process:** Trial-first, peer recommendations

#### Messaging
- **Problem:** "You're spending hours searching across 6 different systems for context."
- **Solution:** "Inkeep's copilot searches 50+ sources in one query. Answers with citations."
- **Proof:** Time-to-answer reduction, accuracy, career focus on complex problems
- **CTA:** "Try the copilot free" / "See it debug a real API issue"

#### Blog Content That Resonates
- "Building your technical support toolkit with AI"
- "API troubleshooting: A systematic approach"
- "From support engineer to product manager: Career paths"

---

## Part B: Non-Technical Support Leadership

### 5. VP of Support / VP Customer Support

**Who They Are:**
Senior executive leading entire support department. Develops strategies for customer experience, satisfaction, and loyalty. Reports to CEO, COO, or CRO.

**Compensation:** $246K average ($200K-$362K range)

#### Day-to-Day Activities
- Strategic planning with executive leadership
- Setting short/long-term goals for support org
- Budget planning and resource allocation
- Cross-functional alignment (Sales, Product, CS)
- High-level customer escalation handling
- Board/executive presentations on performance

#### Metrics They Track

| Metric | Target | Inkeep Impact |
|--------|--------|---------------|
| Revenue Impact | Retention/expansion influenced | Analytics connect support to revenue |
| Department Cost | Budget adherence | AI reduces cost-per-ticket |
| CSAT/NPS Trends | Consistent improvement | Faster, accurate responses improve scores |
| Customer Retention | >90% | Better support → lower churn |
| Headcount Efficiency | Output per FTE | AI multiplies agent capacity |

#### Pain Points → Inkeep Solutions

| Pain Point | How Inkeep Resolves It |
|------------|------------------------|
| **"Cost center" perception** | Board-ready analytics: deflection, CSAT impact, content gap reports driving product decisions. |
| **Frozen headcount** | Auto-reply + scheduled agents scale without FTEs. Multi-agent workflows handle complex automation. |
| **Tool sprawl** | Platform consolidation: one vendor, one SOC 2, one integration to maintain. |
| **Data silos** | 50+ connectors unify knowledge. Analytics provide unified view. |
| **Rising expectations** | 24/7 AI coverage, consistent quality, instant responses. |

#### Buying Behavior
- **Budget Authority:** Full department ($500K-$5M+)
- **Evaluation:** Strategic fit, executive references, board-ready ROI
- **Decision Process:** 3-6 months, involves CFO/CEO, security/legal review

#### Messaging
- **Problem:** "The board sees support as a cost center—how do you prove it drives revenue?"
- **Solution:** "Inkeep provides board-ready metrics: revenue influenced, cost reduction, strategic insights."
- **CTA:** "Executive briefing: Support as competitive advantage"

---

### 6. Head of Support / Head of Customer Support

**Who They Are:**
Strategic and operational leader with full authority over department strategy, budget, and personnel. Reports to VP of Support or C-suite.

**Compensation:** $150K-$200K ($120K-$250K with equity)

#### Day-to-Day Activities
- Managing support managers and team leads
- Setting and monitoring performance targets
- Budget management and financial analysis
- Policy and procedure development
- Cross-functional collaboration
- Hiring decisions and team development

#### Metrics They Track

| Metric | Target | Inkeep Impact |
|--------|--------|---------------|
| Response Time | SLA compliance | Auto-reply maintains times during spikes |
| Resolution Rate | >80% | AI handles routine; agents handle complex |
| CSAT | 85%+ | Faster, accurate responses |
| Team Productivity | Tickets per agent | Copilot accelerates resolution |
| Quality Scores | >90% | Consistent AI-assisted responses |

#### Pain Points → Inkeep Solutions

| Pain Point | How Inkeep Resolves It |
|------------|------------------------|
| **Scaling quality with growth** | Auto-reply handles 48-80% deflection. Quality preserved via confidence gating. |
| **Team retention/burnout** | AI handles boring repetitive work. Agents focus on interesting problems. |
| **Process documentation** | Content gap analytics + Turn Ticket to FAQ automates knowledge capture. |
| **Technology decisions** | One platform vs. evaluating multiple point solutions. |
| **Demonstrating impact** | Clear metrics: deflection rate, TTR reduction, CSAT improvement. |

#### Buying Behavior
- **Budget Authority:** Full for support tech ($100K-$500K)
- **Evaluation:** Strategic alignment, integration, vendor support quality
- **Decision Process:** 2-4 months, team pilot, manager buy-in

#### Messaging
- **Problem:** "You're scaling faster than you can hire—quality is at risk."
- **Solution:** "Inkeep deflects 48-80% while maintaining quality. Scale 3x without 3x headcount."
- **CTA:** "See the 15-minute demo" / "Team pilot program details"

---

### 7. Support Operations Manager

**Who They Are:**
Operational efficiency expert responsible for tools, workflows, analytics, and process optimization. The "behind the scenes" team enabling frontline support.

**Compensation:** $73K average ($60K-$95K); Senior: $95K-$120K; Director: $130K-$180K

#### Day-to-Day Activities
- Tool administration and optimization (Zendesk, Intercom)
- Workflow design and automation
- KPI tracking and reporting
- QA program management
- Vendor management and evaluation
- Workforce management and forecasting

#### Metrics They Track

| Metric | Target | Inkeep Impact |
|--------|--------|---------------|
| Automation Rate | >30% | Auto-reply + triggers increase automation |
| Cost per Ticket | Decreasing | AI reduces handling time |
| Tool Adoption | >90% | Copilot embeds in existing tools |
| First Response Time | <4 hours | Auto-reply instant response |
| Data Quality | >95% accuracy | Structured extraction enforces fields |

#### Pain Points → Inkeep Solutions

| Pain Point | How Inkeep Resolves It |
|------------|------------------------|
| **Tool sprawl** | 50+ native connectors. One platform vs. 5-10 disconnected systems. |
| **Manual processes** | Trigger→Agent→MCP pattern automates workflows. Visual builder for no-code automation. |
| **Data quality** | Structured extraction with Zod schemas enforces consistent tagging. |
| **Reactive mode** | Content gap analytics provide proactive process improvement. |
| **Change management** | Copilot embeds in existing tools (Zendesk, Intercom)—minimal behavior change. |

#### Buying Behavior
- **Budget Authority:** Operational tools ($20K-$100K)
- **Evaluation:** Integration capabilities, automation potential, time-to-value
- **Decision Process:** 1-3 months, technical POC, workflow validation

#### Messaging
- **Problem:** "You're managing 6+ tools that don't integrate."
- **Solution:** "Inkeep connects 50+ sources with pre-built integrations. One platform, not six."
- **CTA:** "Technical integration deep-dive" / "See the automation workflow builder"

---

### 8. CX Director / VP Customer Experience

**Who They Are:**
Senior executive shaping overall customer experience strategy. Spans Support, Success, Product, and Marketing. Focuses on satisfaction, retention, and loyalty.

**Compensation:** CX Director $158K-$225K; VP CX $216K-$324K + equity

#### Day-to-Day Activities
- Customer journey mapping and optimization
- Voice of customer program management
- Cross-functional alignment (Support, Success, Product, Sales)
- NPS/CSAT/CES program oversight
- CX strategy development and execution
- Executive reporting on customer health

#### Metrics They Track

| Metric | Target | Inkeep Impact |
|--------|--------|---------------|
| NPS | 40+ (B2B) | Better support improves loyalty |
| CSAT | 85%+ | Faster, accurate responses |
| CES (Customer Effort) | <3 (low effort) | AI reduces customer effort |
| Customer Retention | >90% | Better experience → lower churn |
| CLV | Increasing | Improved satisfaction → expansion |

#### Pain Points → Inkeep Solutions

| Pain Point | How Inkeep Resolves It |
|------------|------------------------|
| **Data silos** | 50+ connectors create unified knowledge. Analytics across all touchpoints. |
| **Cross-functional alignment** | One platform serves Support, CS, DevRel, Docs. Shared insights. |
| **Complex B2B dynamics** | Multi-agent handles complex workflows across stakeholders. |
| **Proving ROI** | Content gap reports show docs impact. Deflection metrics quantify value. |
| **Evolving expectations** | 24/7 instant AI coverage meets B2C-level expectations. |

#### Buying Behavior
- **Budget Authority:** Cross-functional CX budget ($200K-$1M+)
- **Evaluation:** Unified data, cross-functional impact, analytics depth
- **Decision Process:** 3-6 months, multiple stakeholder buy-in

#### Messaging
- **Problem:** "Customer data is siloed across 10 systems—no unified view."
- **Solution:** "Inkeep unifies knowledge from 50+ sources. One platform for support, docs, community."
- **CTA:** "See the unified customer view in action"

---

## Platform Capabilities Summary

### Inkeep 1.0 (Day-1 Value)

| Capability | Primary Personas | How It Helps |
|------------|------------------|--------------|
| **50+ Content Connectors** | All | One RAG across docs, GitHub, Slack, support platforms |
| **Support Copilot (5 modes)** | CSE, TSM, Head | Draft Answers, Quick Links, Summaries, Sentiment, FAQ |
| **Auto-Reply (confidence-gated)** | TSM, Head, Director | Handles volume while preserving quality |
| **Smart Routing** | SEM, TSM, Ops | Structured extraction, accurate categorization |
| **Content Gap Analytics** | TSM, Director, Docs, CX | AI-powered gap reports, feature request synthesis |

### Inkeep 2.0 (Platform Extensibility)

| Capability | Primary Personas | How It Helps |
|------------|------------------|--------------|
| **Multi-Agent Composition** | Director, VP, SEM | Complex workflows: triage → research → action |
| **MCP Ecosystem** | SEM, Ops, Director | Connect CRM, APM, CDP for context enrichment |
| **Webhook + Scheduled Triggers** | TSM, Ops, Director | Event-driven automation |
| **TypeScript SDK + Visual Builder** | SEM, Ops | Engineering-friendly with no-code option |
| **Observability (OTEL + Langfuse)** | Director, VP, SEM | Traces, token tracking, evals |
| **Self-Hosted Deployment** | Director, VP, CIO | Docker, GCP, AWS, Azure—data on-prem |

---

## Competitive Differentiation

### vs. Point Solutions (Kapa.ai)
**For TSM/SEM:** "Kapa stops at docs Q&A. Inkeep connects docs, GitHub, Slack, Zendesk, and internal systems—all in one copilot."

### vs. Enterprise CX (Intercom Fin, Decagon)
**For Director/VP:** "Intercom does support automation. Inkeep extends to CSM copilots, meeting prep, daily briefs—one platform for customer operations."

### vs. Horizontal Agent Platforms (n8n, LangGraph)
**For SEM/Ops:** "To build auto-reply with CRM context on n8n, you'd build RAG, connect Zendesk, integrate CRM, add confidence gating—months. Inkeep delivers day 1."

### vs. Native Platform AI (Zendesk AI)
**For Ops/Head:** "Zendesk AI only works with Zendesk Guide. Inkeep works with ANY help desk, pulls from ANY knowledge source."

---

## Content Consumption Patterns

### Communities
| Community | Size | Best For |
|-----------|------|----------|
| **Support Driven** | 13,000+ | Primary community; Slack, events, publications |
| **Tool-specific** | Varies | Zendesk Community, Salesforce Trailblazer |

### Formats That Work
- Technical documentation (proves depth)
- Debugging tutorials (practical, applicable)
- API guides (speaks their language)
- ROI calculators (justifies to leadership)
- Benchmark reports (comparative decision-making)

### Formats That Fail
- Marketing fluff (trust destroyed instantly)
- Generic AI claims ("AI-powered" without specifics)
- Long-form thought leadership (time-constrained)
- High-level strategy decks (want tactical help)

---

## Anti-Patterns

### For Technical Roles
| What Fails | Why |
|------------|-----|
| Generic "AI support" messaging | Burned by AI that doesn't work |
| Marketing fluff | They identify as technical practitioners |
| Feature-dumping | Want business impact |
| Ignoring engineering relationship | Primary operational challenge |
| Enterprise transformation pitches | Time-constrained; want quick wins |

### For Non-Technical Leadership
| What Fails | Why |
|------------|-----|
| Leading with features | Care about business impact |
| Technical jargon overload | May not be technical practitioners |
| Ignoring cross-functional context | Work across Sales, Product, Engineering |
| One-size-fits-all pricing | Support Ops has different budget than VP CX |
| Ignoring data/integration | "Does this connect to our stack?" always asked |

---

## References

### Evidence Files
- technical-support-personas/evidence/technical-support-manager.md
- technical-support-personas/evidence/support-engineering-leadership.md
- technical-support-personas/evidence/customer-support-engineer.md
- technical-support-personas/evidence/non-technical-support-leadership.md
- inkeep-product-comparison/evidence/inkeep-1-capabilities.md
- inkeep-product-comparison/evidence/inkeep-2-capabilities.md

### Related Reports
- [inkeep-product-intelligence](../../inkeep-product-intelligence/REPORT.md) — Full product capabilities
- [inkeep-painpoint-feature-mapping](../inkeep-painpoint-feature-mapping/REPORT.md) — Painpoint pillar mapping
- [b2b-persona-messaging-playbook](../../b2b-persona-messaging-playbook/REPORT.md) — Complete 19 persona playbook
