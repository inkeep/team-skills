# inkeep.com Marketing Website Performance Report
**Generated:** March 6, 2026  
**Period:** Last 90 Days (excluding app.inkeep.com)
**Source:** PostHog Web Analytics

---

## Overall Site Performance

| Metric | Value | vs. Prior Period |
|--------|-------|-----------------|
| Visitors | 30.1K | ↓ 35% |
| Page Views | 172K | ↓ 43% |
| Sessions | 45.2K | ↓ 39% |
| Session Duration | 5m 17s | ↑ 2% |
| Bounce Rate | 30% | ↑ 54% |

Traffic has declined significantly vs. the previous period, though session duration is slightly up and remains healthy at 5m+.

---

## Top Pages by Visitors (with Bounce Rate)

| Page | Visitors | Views | Bounce Rate |
|------|----------|-------|-------------|
| / (Homepage) | 17,663 | 35,245 | 23.9% |
| /demo | 1,502 | 2,404 | 39.0% |
| /blog | 1,121 | 1,749 | 24.7% |
| /no-code-agent-visual-builder | 961 | 1,377 | 47.4% |
| /blog/technical-b2b-support-in-2026-what-leaders-must-prepare-for | 791 | 895 | 43.2% |
| /blog/composer-vs-swe | 787 | 979 | 37.8% |
| /unified-search | 743 | 1,051 | 45.4% |
| /careers | 635 | 958 | 26.9% |
| /developers | 630 | 960 | 39.8% |
| /blog/agent-frameworks-platforms-overview | 615 | 778 | 55.9% |
| /use-cases/b2b-customer-support | 591 | 892 | 52.8% |
| /blog/how-technical-b2b-companies-should-measure-ai-support-agent | 583 | 759 | 40.5% |
| /use-cases/documentation-teams | 528 | 795 | 37.6% |
| /enterprise | 523 | 791 | 42.4% |
| /get-started | 481 | 692 | 54.0% |
| /use-cases/b2c-customer-service | 472 | 665 | 56.1% |
| /blog/AI-Customer-Experience | 440 | 589 | 56.8% |
| /coingecko/9db6e7608471 | 422 | 602 | 31.1% |
| /about | 417 | 472 | 30.2% |
| /blog/best-ai-models-2025 | 373 | 450 | 72.3% |
| /cloud-waitlist | 322 | 542 | 32.6% |
| /case-studies | 319 | 527 | 43.7% |
| /use-cases/sales | 315 | 449 | 56.0% |
| /compare | 163 | 379 | 27.7% |

---

## Scroll Depth (50% scroll-through events — Blog/Case Study pages only)

Scroll tracking via user_scrolled_50_percent and user_scrolled_90_percent events is only fired on /blog/ and /case-studies/ pages — NOT on core marketing pages like the homepage or /demo.

| Page | 50% Scroll Events (90d) |
|------|--------------------------|
| /blog/composer-vs-swe | 119 |
| /case-studies/posthog | 35 |
| /blog/agent-frameworks-platforms-overview | 31 |
| /blog/AI-Customer-Experience | 21 |
| /blog/anthropic-openai-mcp-apps-extension | 21 |
| /blog/inkeep-funding-announcement | 19 |
| /blog/gdpval-ai-expert-performance | 16 |
| /case-studies/fingerprint | 16 |
| /case-studies/solana | 15 |
| /blog/org-chart | 14 |
| /case-studies/payabli | 13 |
| /blog/openai-enterprise-ai-adoption | 11 |
| /blog/gpt-5-2-pro-release | 10 |
| /blog/mcp-server | 10 |
| /blog/cursor-2-review | 9 |
| /blog/context-anxiety | 8 |
| /blog/openai-agentkit-vs-inkeep | 7 |

NOTE: The ratio of 50% scroll events to total visitors on /blog/composer-vs-swe (~15%) shows that most blog visitors read at least halfway. Core product/marketing pages don't have scroll tracking — adding it would improve visibility.

---

## Time on Page

- Homepage (/): High variability; baseline 16-50m/day total. Occasional large spikes (outlier sessions).
- /demo: High variability with large daily spikes — some users spend significant time (likely watching demo video or reviewing content).
- Overall site session duration: 5m 17s (healthy for a B2B SaaS marketing site, up 2% vs. prior period).

---

## Next Page Explored (Exit Paths)

### From Homepage (/)
| Next Page | Visitors |
|-----------|----------|
| /demo | 456 |
| /no-code-agent-visual-builder | 347 |
| /careers | 305 |
| /developers | 271 |
| /unified-search | 271 |
| /get-started | 207 |
| /use-cases/b2b-customer-support | 188 |
| /enterprise | 184 |
| /use-cases/documentation-teams | 179 |

### From /demo
| Next Page | Visitors |
|-----------|----------|
| /get-started | 60 |
| /enterprise | 51 |
| /no-code-agent-visual-builder | 46 |
| /developers | 34 |
| /schedule-demo | 33 |
| /thank-you | 30 |
| /unified-search | 30 |
| /use-cases/sales | 26 |

### From /blog/composer-vs-swe
751 of 787 visitors don't navigate elsewhere (high exit rate typical of organic search blog traffic). Only ~9 go to the homepage after reading.

---

## Pages That Drive Users to /demo (Previous Pages Analysis)

| Source Page | Visitors to /demo |
|-------------|-------------------|
| / (Homepage) | 621 |
| Direct (no prior inkeep.com page) | 588 |
| /unified-search | 74 |
| /use-cases/b2c-customer-service | 45 |
| /enterprise | 43 |
| /use-cases/b2b-customer-support | 40 |
| /no-code-agent-visual-builder | 39 |
| /use-cases/documentation-teams | 38 |
| /get-started | 31 |
| /use-cases/sales | 24 |

## Pages That Most Need Improvement

### 🔴 Critical — High Traffic + High Bounce + No CTA Path to Demo

**`/no-code-agent-visual-builder`** — 961 visitors, **47.7% bounce rate** ↑
This is a high-intent product page. People arrive wanting to understand a specific feature, but the page has no clear "next step" once they've browsed. It shows a product demo video, which is good, but doesn't funnel users toward booking a live demo. The CTA in the nav ("Get a Demo") is competing with a weak mid-page story.

**`/unified-search`** — 743 visitors, **45.4% bounce rate** ↑
The page visually demonstrates the AI assistant but the hero loads partially off-screen. Users may not even see the key value prop. No persistent inline CTA visible in the fold.

**`/enterprise`** — 524 visitors, **42.4% bounce rate** ↑
This is the highest-value segment page (enterprise prospects), yet it has a high bounce rate. The page was loading mostly blank — it may have a render/performance issue. Given that enterprise leads are the most valuable, any friction here has an outsized business impact.

**`/get-started`** — 483 visitors, **52.9% bounce rate** ↑
This is the page someone visits when they're actively trying to start. A 53% bounce rate here is alarming — it means half the people who want to begin are leaving. The page offers two paths (Open Source vs Enterprise/Demo), but the comparison table is very feature-dense and may overwhelm rather than convert.

### 🟠 High Priority — High Traffic + High Bounce

**`/use-cases/b2c-customer-service`** — 473 visitors, **56.1% bounce rate** ↑
**`/use-cases/b2b-customer-support`** — 592 visitors, **52.8% bounce rate** ↑
Use-case pages should be some of the highest-converting pages on the site — they're where intent-matched visitors land. Both have bounce rates above 50%. The pages have good structure (hero, demo CTA, trusted logos) but the messaging may not clearly differentiate from generic AI support tools.

**`/blog/agent-frameworks-platforms-overview`** — 616 visitors, **55.9% bounce rate** ↑ (also an entry path with 558 visitors)
This is driving a significant number of new visitors as an entry page and converting almost none of them. There is no clear bridge from "informational blog content" to "book a demo."

---

## Highest Bounce Rate Pages (Among High-Traffic Pages)

| Page | Visitors | Bounce Rate |
|---|---|---|
| `/blog/ai-business-automation-tools` | 251 | **73.9%** |
| `/blog/best-ai-models-2025` | 374 | **72.3%** |
| `/blog/openai-agentkit-vs-n8n-vs-zapier` | 184 | **60.7%** |
| `/blog/AI-Customer-Experience` | 441 | **56.8%** |
| `/blog/context-engineering-why-agents-fail` | 314 | **58.2%** |
| `/blog/agent-frameworks-platforms-overview` | 616 | **55.9%** |
| `/use-cases/b2c-customer-service` | 473 | **56.1%** |
| `/use-cases/b2b-customer-support` | 592 | **52.8%** |
| `/get-started` | 483 | **52.9%** |

> **`/blog/ai-business-automation-tools` has the highest bounce rate at 73.9%**, followed by `/blog/best-ai-models-2025` at 72.3%. These are broad comparison/listicle posts attracting top-of-funnel traffic with no conversion path.
---

## Key Takeaways & Engagement Summary

### Most Engaged Pages (multi-signal)

1. Homepage (/) — Highest traffic (17.6K visitors), lowest bounce (23.9%), #1 source of demo conversions (456 exits to /demo). Clear engagement winner.

2. /demo — 1,502 visitors, meaningful downstream conversions: 33 → /schedule-demo, 30 → /thank-you. The demo page itself converts well.

3. /blog/composer-vs-swe — Best blog: highest organic search traffic (628/787 from Google), best scroll depth (119 50%-scroll events), HackerNews traffic. Most genuine reading engagement of any blog post.

4. /unified-search — 743 visitors; 3rd highest feeder to /demo (74 visitors → /demo). High-intent product page.

5. /no-code-agent-visual-builder — 961 visitors, actively feeds demo funnel (39 → /demo). Product-aware, conversion-oriented page.

6. /blog index — Low bounce (24.7%), visitors browse multiple posts. Effective content hub.

7. /careers — Low bounce (26.9%), 635 visitors. Significant brand awareness from job-seekers.

### Pages with Engagement Concerns

- /blog/best-ai-models-2025 — 72.3% bounce rate (highest among top pages). Likely off-ICP traffic.
- /get-started — 54% bounce, 481 visitors but only 31 convert to /demo. Needs stronger CTAs.
- /use-cases/b2b-customer-support and /use-cases/b2c-customer-service — Bounce rates 52-56%. Use-case pages not driving next actions effectively.
- /blog/agent-frameworks-platforms-overview — 55.9% bounce despite 615 visitors.

## What's Not Working

**Blog-to-Demo funnel is broken.** Blog posts are the #2 and #4 most common entry paths (behind the homepage). Posts like `/blog/composer-vs-swe` (788 visitors, 37.8% bounce) and `/blog/agent-frameworks-platforms-overview` (616 visitors, 55.9% bounce) bring in substantial traffic but have no effective in-content CTA that connects the article topic to Inkeep's specific value. Generic "Get a Demo" CTAs at the bottom aren't doing the work.

**The `/demo` page itself has a 39% bounce rate.** The page is minimal — just name, work email, and a schedule button. There's no qualification pre-framing, no "what to expect on the call," no social proof on the page itself. People arriving cold from a blog post are not warmed up enough to commit to a calendar event.

**`/zod/mcp` is the #2 traffic page** (1,723 visitors) and appears to be a partner/integration page. With 34.4% bounce and **385 dead clicks** (per Frustrating Pages data), users are hitting non-functional elements. This is wasted high-intent traffic.

**Use-case pages aren't converting.** The B2B and B2C support pages have bounce rates of 52-56%. The hero CTAs ("Get Started" + "Get a Demo" side by side) create decision paralysis, and messaging feels generic.

### Recommendations

1. Add scroll depth tracking to core marketing pages — /demo, /no-code-agent-visual-builder, /enterprise, /get-started, and all use-case pages currently have zero scroll visibility.

2. Strengthen CTAs on /get-started — 54% bounce suggests it's not converting intent into demo requests effectively.

3. Optimize use-case pages — All have 50-56% bounce rates. These are the 2nd-tier funnel pages feeding /demo and could drive more conversions with stronger demo CTAs.

4. Investigate /zod/mcp — It's the #2 traffic page (1,723 visitors, 34.4% bounce) but is an integration/partner page. Worth examining its demo conversion rate separately.

5. Leverage /blog/composer-vs-swe — Highest quality blog by engagement. Consider promoting it more heavily; it clearly resonates (organic search + high scroll depth + HackerNews traffic).

6. **Fix the `/demo` page** — Add a brief "what happens next" explainer, 1-2 testimonials, and a clear expectation-setter ("30-minute call, see it live"). The 39% bounce on an already high-intent page is the most direct conversion leak.

7. **Add contextual mid-article CTAs to high-traffic blog posts** — Especially `/blog/agent-frameworks-platforms-overview`, `/blog/best-ai-models-2025`, and `/blog/AI-Customer-Experience`. CTAs should connect the post topic directly to Inkeep's specific capability, not just say "Get a Demo."

8. **Overhaul `/get-started`** — Simplify the choice. The feature comparison table is overwhelming. Consider a short "who are you?" qualifier (e.g., "individual developer" vs "team/company") that routes users rather than listing everything at once.

9. **Fix `/enterprise` page rendering** — The page appears to load with a blank/incomplete hero, likely causing immediate exits for the most valuable prospect segment.

10. **Improve `/use-cases` pages** — Add customer proof, specific metrics (like the Fingerprint case study: 50% ticket reduction + 18% activation increase), and a stronger pain-point hook in the opening paragraph.


