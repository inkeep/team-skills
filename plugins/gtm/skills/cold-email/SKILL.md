---
name: cold-email
description: Generate cold emails for B2B personas. Use when asked to write cold outreach, sales emails, or prospect messaging. Supports 19 persona archetypes (Founder-CEO, CTO, VP Engineering, CIO, CPO, Product Directors, VP CX, Head of Support, Support Ops, DevRel, Head of Docs, Technical Writer, Head of Community, VP Growth, Head of AI, etc.). Can generate first-touch and follow-up emails.
argument-hint: "{persona} {company/context}"
---

# Cold Email Generation

Generate high-quality cold emails tailored to specific B2B personas, using evidence-backed messaging strategies.

## Workflow

1. **Parse the request**
  :Identify the target persona (see Persona Quick Reference below)
  :Extract company context (name, industry, size, any signals like funding, hiring, product launches)
  :Determine email type: first-touch or follow-up (default: first-touch)

2. **Load persona-specific guidance**
  :Read `references/personas.md` for the matching persona archetype
  :Note their pain points, buying behavior, and anti-patterns

3. **Match product capability to persona pain**
  :Read `references/product-intel.md` for Inkeep product context
  :Identify which product pillar (Ask AI, Copilots, Workflows, Build Your Own) solves their problem
  :Select relevant proof point (e.g., "48% ticket reduction" for support, "18% activation" for product)
  :Never lead with product features — lead with outcome, then connect to capability

4. **Select content CTA** (optional but recommended)
  :Read `references/blog-mapping.md` to find relevant articles for this persona
  :Match buying stage: Awareness (cold), Consideration (exploring), Decision (evaluating)
  :For multi-step sequences: Select 2 articles with different angles for emails 2 and 3

5. **Add social proof** (when relevant)
  :Read `references/customer-proof.md` to find industry-matched customers
  :Use 1-2 customer names that match prospect by industry and size

6. **Draft the email**
  :Follow the Email Structure below
  :Apply persona-specific messaging angle
  :Weave in product benefit naturally (not as a pitch)
  :Keep it short (under 80 words for first-touch, under 150 for follow-ups)

7. **Output the email**
  :Provide subject line + body
  :If multiple variants requested, provide 2-3 options

---

## Persona Quick Reference

| Persona | Key Pain Point | CTA Style |
|---------|---------------|-----------|
| **Founder-CEO** | Growth slowdown, CAC efficiency | Business outcomes, ROI data |
| **CTO / Founder-CTO** | AI adoption, security, tech debt | Technical depth, architecture |
| **VP of Engineering** | Developer productivity (32% coding time) | DORA metrics, team efficiency |
| **CIO / VP IT** | AI strategy, vendor consolidation, security | TCO, compliance, enterprise integration |
| **CPO / VP Product** | Stakeholder conflicts, AI integration | User engagement, feature adoption |
| **Director/Head of Product** | Proving product ROI, alignment | Cross-functional case studies |
| **Senior PM / GPM** | Feature impact measurement | Peer testimonials, frameworks |
| **Technical / Platform PM** | Quantifying infrastructure value | DevEx metrics, architecture |
| **VP of CX/CS** | Proving ROI, NRR protection | Dollar-denominated outcomes |
| **Director of CX/Support** | Organizational silos (73%) | CSAT, FRT improvements |
| **Head of Support** | Knowledge gaps (51%), team capacity | Ticket deflection, agent productivity |
| **Support Ops / CX Ops** | Tool sprawl (81%), integration | API depth, TCO, automation ROI |
| **CSM / Onboarding Manager** | Time-to-Value, burnout | Time savings, automation |
| **Support Team Lead** | Agent productivity, FCR | Quick wins, templates |
| **Head of DevRel** | Proving DevRel ROI, content efficiency | Developer activation metrics |
| **Senior Developer Advocate** | Wearing many hats, content volume | Time savings, peer usage |
| **Junior Developer Advocate** | Career path, credibility, tool overload | Free resources, templates, peer usage |
| **Head of Technical Writing** | Docs going stale (30% SME time) | Freshness, support ticket reduction |
| **Technical Writer (IC)** | Review bottlenecks, SME coordination | Templates, peer testimonials, free trial |
| **Head of Community** | Proving ROI (58%), resources | Engagement, retention impact |
| **VP/Head of Growth** | Lead quality (61%), rising CAC | Activation, conversion data |
| **Head of AI** | POC abandonment (42%), data quality | POC-to-production, governance |
| **Content Creator (Recruiting)** | Budget constraints (8%), video cost | Efficiency, cost vs agency |

---

## Email Structure (First-Touch)

```
Subject: [2-3 words, internal-camo style, no punctuation]

[1 sentence: Personalized observation or trigger]

[1-2 sentences: Problem statement with loss framing or unconsidered need]

[1 sentence: Social proof:"We helped [similar company] [specific outcome] in [timeframe]"]

[1 sentence: Interest-based CTA with optional content offer]
```

**Characteristics:**
- Under 80 words total (guideline, not hard rule)
- 3rd-5th grade reading level
- Plain text, no links in first-touch email
- 2-3 paragraphs, 1 sentence each
- Start with "you/your" not "I/we"
- Specific numbers, named companies, exact timelines
- Use hyphens only for compound words (edge-case, Tier-1, 50-80%). Never use dashes to connect separate thoughts or clauses.

**Note:** Follow-up emails (2 and 3) should include blog article links as CTAs. See Follow-Up Email Progression below.

---

## Follow-Up Email Progression

When user requests follow-up emails, follow this arc:

| Position | Type | Purpose | Length |
|----------|------|---------|--------|
| Email 1 | Anchor/Pain + Social Proof | Personalized problem + customer proof + interest CTA | Under 80 words |
| Email 2 | Value + Blog CTA | New insight or stat with relevant blog link | Under 100 words |
| Email 3 | Reframe + Blog CTA | Different angle with relevant blog link | Under 75 words |
| Email 4 | Re-Angle/Pivot | Fresh thread, different problem angle | Under 100 words |
| Email 5 | Value-Add | Useful resource, no ask | Under 75 words |
| Email 6 | Objection Preempt | Address likely reason for silence | Under 100 words |
| Email 7 | Breakup | Gracious close, loss aversion | Under 75 words |

**Blog CTA Guidelines (Emails 2 and 3):**
- Select articles from `references/blog-mapping.md` that match the persona
- Email 2: Use article that adds new insight or reinforces problem framing
- Email 3: Use article with different angle (re-frame the problem)
- Include full URL on its own line for easy clicking
- Frame the article: "This covers [specific insight]:" then link
- Keep the ask soft: "Worth 5 minutes if [pain point] is on your radar"

**Follow-up notes:**
- Email 2 has highest leverage (+49% reply lift)
- Follow-ups can be longer (4+ sentences get 15x more meetings)
- Avoid "I never heard back" (-14% meetings)
- "Hope all is well" works only when personalized to specific event
- Blog links add value without being salesy
- Never use meta-language like "Different angle:", "One stat that stood out:", "Bumping this", or "Here's another way to think about it:". Instead, just open with the new angle or stat directly. Let the content speak for itself.
- Use social proof only once per sequence (typically in Email 1). Repeating customer names across emails signals templated outreach.

---

## CTA Patterns by Level

| Level | CTA Approach |
|-------|-------------|
| **Executive (VP+)** | "Worth a quick 15-minute chat?" / "Mind if I send a 2-min Loom?" |
| **Director/Manager** | "See how [similar company] achieved X" / "Happy to share our benchmark" |
| **IC/Individual Contributor** | "Try free" / "Here's a template you can use today" |
| **Technical roles** | "Technical deep-dive available" / "See our API docs" |

**Interest-based CTAs outperform meeting requests 2x** (30% vs 15% response rate).

---

## Anti-Patterns (What Kills Replies)

**Never do:**
- "Quick chat" / "Quick call" (trivializes their time)
- "Just following up" (no new value)
- Generic "I hope this finds you well"
- "We're a leading provider of..." (template smell)
- ROI claims without context (-15% success rate)
- Pitching your product first (-57% reply rate)
- Multiple CTAs (one ask per email)
- Wall of text (no paragraphs)
- Over 125 words on first touch
- Meta-language that signals templated outreach ("Different angle:", "One stat that stood out:", "Bumping this", "Circling back", "Following up on my last email", "Here's another way to think about it:")
- Sales-speak that reveals you're analyzing across prospects ("One pattern we see:", "What we're hearing from teams like yours", "A trend we've noticed")

**Template smell checklist:**
- Starts with "I/My/We/Our"
- Contains buzzwords ("innovative", "cutting-edge", "all-in-one")
- Includes rounded numbers ("save 40%") instead of specific ("save 37%")
- Has generic social proof ("leading companies")
- Asks for meeting before establishing value
- Reads above 8th grade level
- Uses dashes to connect thoughts ("this:that") instead of commas or periods

---

## Examples

### Good (VP of CX)

**Subject:** Support deflection

Noticed [Company] is scaling fast. Congrats on the Series B.

Most CX teams at this stage see ticket volume outpace headcount 3:1. The ones avoiding burnout are deflecting 40-60% with AI that actually understands technical docs.

Fingerprint cut tickets 48% while increasing activation 18%. Worth a quick look at how?

---

### Good (Head of DevRel)

**Subject:** Docs activation

Saw your talk at [Conference] on developer onboarding friction.

Most DevRel teams spend 50%+ on content creation but struggle to prove impact on activation. The gap is usually between "docs exist" and "developers find answers."

Solana scaled developer support without adding headcount. Happy to share their approach if useful.

---

### Good Follow-Up with Blog CTA (Email 2)

**Subject:** RE: Docs activation

58% of SaaS companies are seeing NRR decline. Usage behavior accounts for 80% of outcomes, yet most AI investment goes to sales instead of CX.

This covers why that's backwards:
https://inkeep.com/blog/why-customer-success-needs-ai-agents-before-sales-does-in-20

Worth 5 minutes if retention is on your radar.

---

### Avoid

**Subject:** Exciting opportunity to revolutionize your customer experience!

Hi [Name],

I hope this email finds you well! My name is [Rep] and I'm reaching out from [Company]. We're a leading provider of AI-powered customer support solutions that help companies like yours achieve up to 50% improvement in customer satisfaction scores.

I'd love to schedule a quick 30-minute call to discuss how we can help [Company] transform their customer experience journey. Would you have time next Tuesday or Wednesday?

Best regards,
[Rep]

*Problems: Opens with "I", uses "leading provider", vague ROI claim, asks for 30-min meeting, no personalization, no social proof, over 100 words.*

---

## Output Format

When generating an email, output:

```
**Subject:** [subject line]

[email body]

---
**Notes:** [Optional: brief explanation of choices made]
```

If generating multiple variants, label them Variant A, B, C.

If generating a follow-up sequence, label by email number and type.

---

## Source Reports

For deeper research beyond the skill references, consult these reports:

| Report | Path | Use For |
|--------|------|---------|
| **B2B Persona Messaging Playbook** | `~/.claude/reports/b2b-persona-messaging-playbook/REPORT.md` | Full persona research: 19 archetypes, pain points, buying behavior, anti-patterns, compensation data |
| **Blog-to-Persona Mapping** | `~/.claude/reports/blog-persona-mapping/REPORT.md` | Article CTAs by persona and buying stage, case study mappings |
| **Customer Social Proof** | `~/.claude/reports/customer-social-proof/REPORT.md` | Customer logos by industry, size, and persona for social proof |

## Skill References

| Reference | File | Use For |
|-----------|------|---------|
| **Personas** | `references/personas.md` | Pain points, metrics, buying behavior, anti-patterns |
| **Blog Mapping** | `references/blog-mapping.md` | Article CTAs by persona, case studies |
| **Customer Proof** | `references/customer-proof.md` | Social proof by industry and size |
| **Product Intel** | `references/product-intel.md` | Inkeep product capabilities, proof points, positioning |
| **Best Practices** | `references/best-practices.md` | Cold email effectiveness data (85M+ emails) |
