# Evidence: E-E-A-T & Authorship Signals

**Dimension:** E-E-A-T & Authorship Signals
**Date:** 2026-02-19
**Sources:** Google official docs, Google API leak analysis, Search Engine Journal, Search Engine Land, Backlinko, Animalz, multiple SEO studies

---

## Key sources referenced

- [Google Search Central: Creating Helpful Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google Quality Rater Guidelines PDF](https://services.google.com/fh/files/misc/hsw-sqrg.pdf)
- [Google API Leak Analysis](https://searchengineland.com/google-search-document-leak-ranking-442617) — iPullRank, SE Ranking, Growfusely
- [Search Engine Journal: Bylines](https://www.searchenginejournal.com/google-author-bylines-not-a-ranking-factor/505218/)
- [Search Engine Land: Content Creators](https://searchengineland.com/google-recognizes-content-creators-a-breakthrough-for-e-e-a-t-and-seo-446919)
- [Animalz: Technical Content](https://www.animalz.co/blog/technical-content)

---

## Findings

### Finding: Trust is the most important E-E-A-T component per Google — "untrustworthy pages have low E-E-A-T no matter how Experienced, Expert, or Authoritative they may seem"
**Confidence:** CONFIRMED
**Evidence:** Google Quality Rater Guidelines (direct quote).

E-E-A-T components:
- **Experience** — first-hand, real-world involvement with the topic
- **Expertise** — demonstrable knowledge or skill
- **Authoritativeness** — recognized as a go-to source
- **Trustworthiness** — accurate, transparent, reliable (most important)

Critical nuance: E-E-A-T is NOT a direct ranking factor — it's a quality evaluation framework used by human raters. But rater data trains algorithms, so alignment is indirectly rewarded.

### Finding: Google's leaked API reveals `authorReputationScore`, `isAuthor`, and `contentEffort` as tracked attributes — authorship plays a more direct role than publicly acknowledged
**Confidence:** CONFIRMED
**Evidence:** May 2024 Google Content Warehouse API leak (iPullRank, Search Engine Land, SE Ranking, Growfusely). Documents are public.

### Finding: Bylines are not a direct ranking factor per Google, but pages with author attribution get cited up to 50% more often in AI-generated answers
**Confidence:** CONFIRMED (byline not a ranking factor) + INFERRED (50% AI citation claim lacks rigorous methodology)
**Evidence:** Google's Danny Sullivan; SEO Clarity, SeoProfy.

Bylines influence rankings through:
1. Entity recognition in Google Knowledge Graph
2. Higher AI search citation rates
3. Improved user trust/dwell time (behavioral signals)

### Finding: Author bio best practices — real name, title, credentials, 50-100 words, third person, professional photo, social links, author schema markup
**Confidence:** CONFIRMED
**Evidence:** Multiple sources (MD Marketing Digital, Digitaloft, WT Digital). 90% of high-performing author pages use third person.

Author schema (JSON-LD) should include: `Person` type, `jobTitle`, `worksFor`, `sameAs` (cross-platform links), `knowsAbout`.

### Finding: First-hand experience signals — the hardest to fake and most valuable differentiator in the AI content era
**Confidence:** CONFIRMED
**Evidence:** Google Quality Rater Guidelines explicitly assess first-hand experience.

**Signals of genuine experience:**
- First-person narrative ("When we migrated...", "In our testing...")
- Specific numbers from real use ("reduced response time from 340ms to 120ms")
- Honest limitations ("failed with datasets over 10GB")
- Original screenshots, diagrams, architecture from actual implementations
- Before/after comparisons with real metrics
- Failure analysis

**Signals of regurgitated content:**
- Generic claims ("improves performance")
- One-sided feature lists
- Stock images or vendor screenshots
- Universal "best practices" with no caveats
- Wikipedia-style timeless descriptions

### Finding: Engineer-authored content outperforms marketing-ghostwritten content for technical topics — developer content that "looks, reads and smells like content marketing will almost always fall flat"
**Confidence:** INFERRED (strong expert consensus, Animalz case studies)
**Evidence:** Animalz. Intercom's model (internal SMEs as writers, content team as editorial support) is the gold standard.

**SaaS authorship models ranked by E-E-A-T:**

| Model | E-E-A-T Strength | Scalability |
|---|---|---|
| Engineer writes, editor polishes | Very High | Low |
| SME interview, writer drafts, SME reviews | High | Medium |
| Marketing writes under real author byline | Medium | High |
| "Admin" or unattributed | Low | High — Avoid |

### Finding: Three-lane SaaS content strategy — technical (SME-authored), business case (marketing-led with data), use-case (customer co-created)
**Confidence:** INFERRED (Animalz framework, widely adopted)

Each lane has different E-E-A-T requirements and optimal authorship models.

---

## Practical Checklist (per post)

**Author Identity:** Real byline, inline bio (50-100 words), dedicated author page, professional photo, author schema markup
**Experience Signals:** First-person narrative, original visuals, specific metrics, honest limitations, temporal context
**Expertise Signals:** Expert quotes, primary source citations, 3-5 relevant external links, internal links
**Trust Signals:** Publication date, last-updated date, conflict disclosure, factual accuracy, contact info

---

## Gaps / follow-ups

- The API leak `authorReputationScore` is confirmed to exist but its weighting in rankings is unknown
- The "50% more AI citations" claim needs more rigorous validation
- No controlled study isolates byline impact on B2B SaaS blog rankings specifically
- Google's E-E-A-T framework continues to evolve
