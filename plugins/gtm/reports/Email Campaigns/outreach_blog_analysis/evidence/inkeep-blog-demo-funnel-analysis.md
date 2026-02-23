# Inkeep Blog → Demo Funnel Analysis
*Generated: February 19, 2026 | Data range: Last 90 days | Internal (@inkeep.com) users excluded*

---

## Top-Level Funnel Numbers

| Step | Users | Conversion |
|------|-------|------------|
| Blog pageview (any /blog URL) | 8,383 | 100% |
| Demo pageview (/demo) | 245 | **2.92%** |
| Drop-off | 8,138 | **97.08%** |

**Average time to convert: 8h 33m 52s**

> Users who do convert are taking the better part of a workday to decide — the blog is not generating urgency or a clear next step.

---

## Filter Configuration

The "Filter out internal and test users" setting is active and correctly excludes:
- `Host ≠ localhost / localhost:3004`
- `user_email ≠ @inkeep.com`
- `Email address ≠ @inkeep.com`

All funnel numbers in this report are clean of internal traffic via `filterTestAccounts: true`.

---

## Bottleneck #1: Traffic–Persona Mismatch (Biggest Driver of Low CVR)

The highest-traffic blog articles attract the wrong audience. Developer/technical articles dominate traffic volume but convert at <1%, while persona-aligned CX/enterprise articles convert at 8–33%.

### Conversion Rate by Article (Last 90 Days)

| Article | Visitors | Demo CVR | Median Time on Page | Persona |
|---------|----------|----------|---------------------|---------|
| `/blog/composer-vs-swe` | 1,024 | **0.39%** | 14m 1s | 🔴 Developers / coding tools |
| `/blog/agent-frameworks-platforms-overview` | 503 | **0.80%** | 32m 7s | 🔴 Developers / framework builders |
| `/blog` (listing page) | 326 | 9.20% | 25s | 🟡 Mixed |
| `/blog/AI-Customer-Experience` | 309 | **8.74%** | 5h 31m | 🟢 CX / enterprise buyers |
| `/blog/technical-b2b-support-in-2026...` (email outreach) | 280 | 1.07% | 26s | 🟡 Outreach-driven |
| `/blog/inkeep-funding-announcement` | 142 | 3.52% | 9h 49m | 🟡 Mixed |
| `/blog/make-vs-openai-agentkit` | 141 | 1.42% | 18s | 🔴 Developers |
| `/blog/openai-agentkit-vs-n8n-vs-zapier` | 115 | 1.74% | 1h 9m | 🔴 Developers |
| `/blog/mcp-server` | 103 | **5.83%** | 17m 8s | 🟡 Mixed |
| `/blog/what-is-an-ai-agent` | 82 | **20.73%** | 33s | 🟢 Enterprise AI buyers |
| `/blog/ai-agents-in-b2b-customer-support` | 76 | **11.84%** | 1m 37s | 🟢 B2B CX buyers |
| `/blog/what-is-multi-agent-system` | 44 | 6.82% | 10m 31s | 🟡 Mixed |
| `/blog/inkeep-vs-n8n-key-differences` | 30 | **13.33%** | 17m 35s | 🟢 Comparison shoppers |
| `/blog/inkeep-vs-chatgpt` | 24 | **12.50%** | 5d | 🟢 Comparison shoppers |
| `/blog/slack-and-discord-copilots` | 13 | 15.38% | 1s | 🟢 Enterprise product |
| `/blog/ai-customer-service` | 10 | **20.00%** | 36s | 🟢 CX buyers |
| `/demo?cta_id=marketing_cxkit` | 9 | **44.44%** | 18m 31s | 🟢 Highest-intent CX Kit |
| `/blog/inkeep-vs-kapa` | 6 | **33.33%** | 3d 12h | 🟢 High-intent comparison |

### Key Pattern

- **Developer/builder articles** (coding models, agent frameworks, no-code tools): 0.4–1.7% CVR
- **CX/enterprise/B2B support articles**: 8–21% CVR
- **Comparison "vs." articles**: 12–33% CVR (highest intent segment)

`composer-vs-swe` alone accounts for **12.2% of all blog traffic** yet contributes fewer than 4 demo visits from 1,024 visitors.

### Root Cause

Traffic source for `composer-vs-swe`:
- Google.com: 125 visitors
- Direct: 34
- DuckDuckGo: 2
- Hacker News (ycombinator.com): 1
- Perplexity.ai: 1

People searching "Composer-1 vs SWE-1.5" are AI developers evaluating coding tools — not enterprise CX leaders evaluating an AI support platform.

---

## Bottleneck #2: Near-100% Exit Rates on High-Traffic Articles

For `/blog/composer-vs-swe`:
- **160 out of 160+ visitors exit directly from the article** (virtually 100% exit rate)
- Only 1 visitor navigated to `/blog`, 1 to `/`, 1 to another article
- Referring traffic is almost entirely from Google (125 visitors) — pure informational intent

Session recordings confirm the pattern: users arrive from Google, read the article (averaging 14 minutes on-page), make **0 clicks**, and leave. One recorded US session: 6m 49s duration, 0 clicks, 2 keystrokes, came from Google, left without interacting with any CTA.

The **blog listing page itself** is also a major exit point: 195 visitors leave from `/blog` as their final page.

---

## Bottleneck #3: High Bounce Rate + Wrong-Intent Traffic at Scale

### Site-Wide Metrics (Feb 3–19, 2026)

| Metric | Value |
|--------|-------|
| Total visitors | 79,100 |
| Page views | 140,000 |
| Sessions | 101,000 |
| Average session duration | 2m 22s |
| **Bounce rate** | **59%** |
| Week-1 retention | 4.9% |

### Top Referring Domains

| Referring Domain | Visitors | Notes |
|-----------------|----------|-------|
| www.google.com | 46,183 | Organic search — informational intent |
| $direct | 22,870 | Direct / dark social |
| search.brave.com | 2,227 | Privacy-focused search |
| github.com | 1,400 | Developer community |
| t.co (Twitter/X) | 628 | Social media |
| www.google.com.hk | 441 | Hong Kong Google |
| kagi.com | 264 | Privacy search |
| www.anthropic.com | 217 | More aligned with AI buyers |


### Page-Level Bounce Rates

| Page | Visitors | Bounce Rate |
|------|----------|-------------|
| `/` (homepage) | 75,174 | 60.5% |
| `/blog` (listing) | 548 | **14.7%** ← low! People explore |
| `/blog/technical-b2b-support...` | 330 | 53.3% |
| `/demo` | 288 | 45.6% |
| `/blog/composer-vs-swe` | 166 | **54.7%** |

The blog listing page (14.7% bounce) shows that people who deliberately navigate to the blog index are engaged — it's the organic search landers on individual articles who immediately leave.

---

## Bottleneck #4: CTA Structure Doesn't Capture Intent Effectively

### Current CTA Setup on Every Blog Article

1. **Sticky bottom bar** (persistent while scrolling):
   - Email input: `work@email.com`
   - Button: **"SEE DEMO (ENTERPRISE)"**
   - Text link: "TRY OSS ON GITHUB →"

2. **Article footer** (after all content):
   - **"Stay Updated — Join Newsletter"** box with email + "JOIN NEWSLETTER" button

### Problems

- **The sticky bar is easy to ignore.** It lives at the very bottom of the viewport, below the fold of content, and blends with browser chrome on mobile. Session recordings show 0-click sessions on articles with 5–7 minute read times.
- **No inline CTAs mid-article.** There is no contextual CTA placed at peak engagement moments (e.g., after key takeaways, after a relevant case study).
- **The newsletter opt-in at article end competes with demo intent.** Users who reach the end of an article are the most engaged — this is when a demo CTA should be most prominent, but the newsletter box captures that moment instead, routing readers into a lower-value outcome.

---

## Bottleneck #5: On-Site Navigation Leakage After Blog Visits

### User Paths Starting at `/blog` Listing (270 sessions, 5-step path)

After visiting `/blog`, users go to:

| Next Destination | Users | Notes |
|-----------------|-------|-------|
| `/blog/tag/ai-customer-experience` | 31 | Content consumption loop |
| `/blog/tag/enterprise-ai-agents` | 28 | Content consumption loop |
| `https://inkeep.com` (homepage) | 35 | Lost in navigation |
| `/blog/AI-Customer-Experience` | 18 | Article consumption |
| `/demo` | **14** | **Only 5.2% reach demo from blog listing** |
| `/blog/inkeep-vs-n8n-key-differences` | 13 | Comparison research |
| `/about` | 7 | Company evaluation |
| `/get-started` | 7 | Forks away from demo funnel |
| `/blog/what-is-an-ai-agent` | 7 | More content |

The vast majority of paths terminate early (the large white space in the Sankey diagram), meaning most users leave without visiting a second page. Of those who stay on-site, they predominantly loop through more blog/tag content rather than proceeding toward a demo.

### Exit Paths from `/blog` Listing

| Exit Destination | Visitors |
|-----------------|----------|
| `/blog` (exits from listing itself) | **195** |
| `/blog/tag/enterprise-ai-agents` | 52 |
| `/blog/tag/ai-customer-experience` | 40 |
| `/` (homepage) | 16 |
| `/demo` | **6** |

---

## What's Working (Bright Spots)

| Segment | CVR | Why It Works |
|---------|-----|--------------|
| `/demo?cta_id=marketing_cxkit` | 44.44% | Positioned CX Kit — highest-intent landing |
| Comparison articles (`vs.` content) | 12–33% | Users actively evaluating alternatives = highest buying intent |
| `/blog/ai-agents-in-b2b-customer-support` | 11.84% | Direct persona match: B2B CX decision-makers |
| `/blog/AI-Customer-Experience` | 8.74% | Strong persona match; long time-on-page (5h 31m avg) |
| Email outreach sessions | Fastest conversion time | Warm leads already familiar with Inkeep |

Comparison-article visitors also show the **deepest research behavior**: median time to convert for `inkeep-vs-chatgpt` is 5 days, `inkeep-vs-n8n` is 2d 12h — these users are doing thorough due diligence before booking.

---

## Recommended Actions (Prioritized)

### 1. Redirect Off-Persona Articles to Appropriate CTAs (Immediate)
For developer-targeted articles (`composer-vs-swe`, `agent-frameworks-platforms-overview`, `make-vs-openai-agentkit`, `openai-agentkit-vs-n8n-vs-zapier`):
- Replace or supplement "SEE DEMO (ENTERPRISE)" with **"Try OSS on GitHub"** as the primary CTA
- Add a banner: *"This article covers developer tooling. Looking for enterprise AI support? → Book a demo"*
- Consider adding a contextual bridge sentence at the end: "Wondering how these frameworks connect to enterprise AI support? See what Inkeep builds on top of them."

### 2. Add Inline CTAs at Peak Engagement Points (High Impact)
For persona-aligned articles (AI Customer Experience, B2B support, comparison articles):
- Insert a contextual CTA box after the first major section or key takeaways block
- Example: *"Inkeep helps CX teams deploy AI agents like these. See a 15-min demo →"*
- This captures intent when engagement is highest — not just at the invisible sticky bar or buried article footer

### 3. Replace Newsletter End-of-Article CTA with Demo CTA (Medium Impact)
The "Stay Updated / Join Newsletter" at the end of every article is competing with demo conversion at the highest-engagement moment. Options:
- Replace with a "Ready to see this in action?" demo CTA block with customer logos/social proof
- Or show the newsletter CTA only to visitors who have already visited the demo page (retargeting logic)

### 4. Scale "vs." Comparison Content Aggressively (High Long-Term Impact)
Comparison articles are converting at 12–33% — 4–11x the baseline. Current coverage:
- `inkeep-vs-kapa` ✅ (33%)
- `inkeep-vs-chatgpt` ✅ (12.5%)
- `inkeep-vs-n8n-key-differences` ✅ (13.3%)
- `inkeep-vs-chatgpt` ✅

Gaps to fill: comparisons vs. Intercom AI, Zendesk AI, Salesforce Einstein, Glean, Guru, Notion AI, Freshdesk AI.

### 5. Add a Demo CTA to the `/blog` Listing Page Sidebar (Medium Impact)
195 visitors exit from `/blog` itself. These users deliberately navigated to browse all content — they are warm leads. A sidebar or top-of-page "Want to see what Inkeep does? Book a 15-min demo" module would capture this intent before they leave.

### 6. Consider a Pop-Exit or Scroll-Depth Trigger for High-Traffic Low-CVR Articles (Test)
For `composer-vs-swe` (1,024 visitors, 0.39% CVR): test a scroll-depth trigger at 80% article completion, showing: *"You've been building with AI agents. Inkeep helps you deploy them for enterprise support — see it live."* Even moving CVR from 0.39% → 2% on this article alone would add ~16 demo visits per 90-day window.

---

## Summary: The Core Problem in One Sentence

The blog is an effective **content marketing engine for developers** (good SEO, high engagement, viral tech content) but has not been optimized as a **demand generation funnel for enterprise buyers** — the two audiences require different CTAs, different content bridges, and different conversion pathways.

---

*Data source: PostHog Project 21667 | US Cloud | Funnel window: 14 days | Step order: Sequential*
