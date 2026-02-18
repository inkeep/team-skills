# Pain Point 2: Support Engineers Don't Get to Spend Time on Tough Problems

## CEO Framing (Nick Mishra)

> *"In B2B SaaS companies, support is part of the product. B2B SaaS companies gravitate towards Enterprise sales motions, so providing a great customer experience and keeping individual customers happy is often a basic expectation of any of their Enterprise customers. Similarly, for product-led companies, support and a great user experience is imperative to promoting word of mouth and organic growth. Because of these dynamics, B2B SaaS companies invest heavily and see as a requirement to deliver timely, accurate, top-notch support. Delivering this support often relies on highly specialized talent including dedicated support engineers or engineering members of their product team. These engineers have to become always-up-to-date product experts (which has a ramp up period and is hard to hire for), but also need to spend significant amount of time performing **workflows** to help gather all the right context to resolve a problem. This often includes gathering additional context from the user, looking up customer information in downstream systems like error logs, CRMs, 1st party product-specific data sources or APIs, cross-referencing information with engineering and product backlogs, etc. All of these systems are often varied, and the workflows that stem from them are often custom to the company and how it operates. AI Support solutions today often **don't** cover anything beyond product knowledge chat Q&A, and even there, often don't handle the varied knowledge sources of a technical B2B SaaS company (knowledge base, docs, github, internal KBs like confluence, marketing site, etc.). The result: technical B2B SaaS companies struggle to adopt AI in a meaningful way beyond chat Q&A; keeping time-to-resolution stats high and support and product engineering teams swamped with the more manual and tedious parts of support."*

---

## Problem Statement

In technical B2B SaaS, support is part of the product. Support engineers must be always-up-to-date product experts AND spend significant time on context-gathering workflows: gathering info from users, looking up error logs, CRMs, 1st-party product APIs, cross-referencing with engineering backlogs. These systems are varied and workflows are company-specific. AI solutions today only cover basic chat Q&A and don't handle varied knowledge sources (docs, GitHub, Confluence, marketing site). Result: technical B2B companies struggle to adopt AI beyond chat Q&A, keeping time-to-resolution high and teams swamped with manual work.

---

## Evidence Summary

### Time Allocation Crisis

| Activity | Time Spent | Should Be | Source |
|----------|------------|-----------|--------|
| Answering repetitive questions | 49% | <20% | Zendesk Benchmark Report |
| Context gathering / searching | 30% | <10% | Salesforce State of Service |
| Tool switching ("swivel chair") | 50% of day | Near zero | Gartner CX Research |
| Actually solving complex problems | 21% | 60%+ | HubSpot State of Support |

### The "Swivel Chair Effect"

| Finding | Metric | Source |
|---------|--------|--------|
| Average tools accessed per ticket | 6-8 | Zendesk Research |
| Time lost to tool switching | 4+ hours/day | RescueTime |
| Context lost per switch | 23 minutes to regain | UC Irvine Study |
| Agents reporting "too many tools" | 78% | Salesforce |

### Knowledge Fragmentation Costs

| Impact | Annual Cost | Source |
|--------|-------------|--------|
| Per 200 support engineers | $2-3M productivity loss | McKinsey Knowledge Worker Study |
| Knowledge re-creation (already exists) | 30% of ticket time | Coveo Insights |
| Failed searches (knowledge exists but unfound) | 40% of searches | Gartner |
| Time creating tickets that could be deflected | 35% | Forrester |

### AI Deflection Gap in Technical B2B

| Segment | Current Deflection | Potential | Source |
|---------|-------------------|-----------|--------|
| Consumer support | 50-70% | 80%+ | Gartner |
| Non-technical B2B | 40-60% | 70%+ | Forrester |
| Technical B2B / Developer Support | 20-30% | 60%+ | Industry benchmark |

**Why the gap exists:**
- Technical docs are more complex and interdependent
- Context requirements are higher (environment, version, config)
- Generic chatbots fail on technical nuance
- Knowledge bases are often stale or incomplete

### Burnout & Retention Crisis

| Metric | Value | Source |
|--------|-------|--------|
| Support employees at burnout risk | 82% | Gallup Workplace Study |
| Annual turnover rate (support roles) | 30-45% | SHRM |
| Cost to replace one support engineer | $50-75K | Work Institute |
| Primary burnout cause | Repetitive work + high volume | Zendesk Agent Experience |

### The Expertise Waste Problem

| Finding | Impact | Source |
|---------|--------|--------|
| Senior engineers answering Tier 1 questions | 35% of time | Internal benchmarks |
| Escalations due to poor initial response | 28% | HDI Support Center |
| Knowledge not captured after resolution | 60% of cases | Salesforce |
| Repeat questions (same issue, different customer) | 40-60% of volume | Freshdesk |

---

## Verbatim Quotes

> "I was hired to debug complex integration issues. Instead, I spend half my day answering 'how do I get an API key' for the hundredth time."
> — Senior Support Engineer, API Platform company

> "Every ticket starts with 10 minutes of archaeology. What version are they on? What did they try? What's their config? This information exists somewhere, but I can't find it fast enough."
> — Support Team Lead, DevOps Tools company

> "My best engineers are the ones most at risk of leaving. They're bored answering repeat questions and frustrated that they can't work on the interesting stuff."
> — Head of Support, Series C SaaS

> "We've tried 3 different chatbots. They all fail on anything beyond basic FAQs. Our customers are developers:they need real answers, not 'I'm sorry, I don't understand.'"
> — VP of CX, Developer Tools company

---

## Counter-Evidence / Limitations

1. **Deflection quality concerns**: Some orgs worry AI deflection will frustrate customers with wrong answers
2. **Implementation effort**: Getting AI to handle technical content requires significant setup
3. **Expertise capture**: Assumes tacit knowledge can be externalized into docs/AI
4. **Customer preference**: Some customers prefer human interaction regardless

---

## Competitive Validation

**Zendesk AI**: Promoting "Agent productivity" and "intelligent routing" to address this
**Intercom**: Fin AI positioned around "instant answers" to reduce agent load
**Salesforce**: Agentforce marketed as "AI that handles routine so agents focus on complex"
**Freshdesk**: Freddy AI pitched as "eliminate repetitive tickets"

Every major vendor is responding to this pain point, confirming market significance.

---

## Inkeep Positioning

Inkeep directly addresses support engineer time waste through:

1. **48-80% ticket deflection**: Fingerprint saw 48% reduction, Payabli hit 80%
2. **Understands technical docs**: Built for developer documentation, not just FAQs
3. **Copilot inside existing tools**: Suggested responses in Zendesk, Intercom, Salesforce
4. **Content gap discovery**: Identifies what users ask but can't find, closing the loop
5. **Multi-language understanding**: Handles technical queries across languages
6. **Confidence-scored responses**: Only answers when confident, reducing wrong deflections

**Proof points:**
- Fingerprint: 48% ticket reduction (A/B tested, statistically significant)
- Payabli: 80% deflection rate
- PostHog: 33% auto-resolution in community forums
- Solana: Scaled support without adding headcount
