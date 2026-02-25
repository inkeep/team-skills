# Evidence: AI Slop — Tell-Tale Signs, Trust Damage & De-AI Editing

**Dimension:** AI Content Tells, Reader Trust Erosion, Content Flood, De-AI Editing, Blog Anti-Patterns
**Date:** 2026-02-19
**Sources:** Liang et al. (2024, 14.2M PubMed abstracts), GPTZero (3.3M texts), Cardon & Coman (2025, 1,100 professionals), Rae et al. (CHI '24, 1,641 participants), Bynder (consumer survey), NIM (600 marketers), Originality.ai (500 keywords ongoing study), Google API leak, ContentGems (10,000 AI articles), Shaib et al. (2025, arXiv — "Measuring AI Slop"), The Register (semantic ablation), AirOps, multiple practitioner sources

---

## Key sources referenced

- [Liang et al. (2024) — "Delving into ChatGPT usage"](https://arxiv.org/html/2406.07016v1) — 14.2M PubMed abstracts; "delves" 25.2x increase
- [GPTZero AI Vocabulary](https://gptzero.me/ai-vocabulary) — 3.3M texts; "complex and multifaceted" 700x AI-to-human ratio
- [Cardon & Coman (2025) — SAGE Journals](https://journals.sagepub.com/doi/10.1177/23294884251350599) — 1,100 professionals; sincerity 83% → 40-52%
- [Rae et al. (CHI '24)](https://dl.acm.org/doi/full/10.1145/3613904.3642076) — 1,641 participants; trust penalty falls on brand, not content
- [Bynder Human Touch Study](https://www.bynder.com/en/press-media/ai-vs-human-made-content-study/) — 56% prefer AI unlabeled, 52% disengage when suspected
- [Originality.ai ongoing study](https://originality.ai/ai-content-in-google-search-results) — 500 keywords, AI content grew 8.5x in search results
- [Hobo Web: contentEffort](https://www.hobo-web.co.uk/what-is-googles-content-effort-signal/) — LLM-based effort estimation from leaked API
- [The Register: Semantic Ablation](https://www.theregister.com/2026/02/16/semantic_ablation_ai_writing/) — algorithmic erosion of high-entropy information
- [AirOps: AI Slop](https://www.airops.com/blog/ai-slop) — practitioner guide to spotting and fixing AI content
- [arXiv: Measuring AI "Slop" in Text (Shaib et al., 2025)](https://arxiv.org/abs/2509.19163)

---

## Findings

### Finding: AI-generated text has a statistically measurable vocabulary fingerprint — specific words appear 10-700x more often in AI output than human writing
**Confidence:** CONFIRMED
**Evidence:** Liang et al. (2024, arxiv); GPTZero (3.3M texts); Scientific American (2025)

**Frequency multipliers (AI vs human baseline):**

| Word/Phrase | Multiplier | Source |
|---|---|---|
| "complex and multifaceted" | 700x | GPTZero |
| "objective study aimed" | 269x | GPTZero |
| "crucial role in shaping" | 182x | GPTZero |
| "intricate interplay" | 100x | GPTZero |
| "today's fast-paced world" | 107x | GPTZero |
| "delves" | 25.2x | Liang et al. |
| "intricate" | ~22x | Liang et al. |
| "meticulously" | ~22x | Liang et al. |
| "showcasing" | 9.2x | Liang et al. |
| "underscores" | 9.1x | Liang et al. |
| "aligns" | 16x | GPTZero |

**Model-specific fingerprints:**
- **ChatGPT:** "delve," "align," "underscore," "noteworthy," "versatile," heavy em dashes, formal clinical tone
- **Claude:** "I think," "it seems," "according to," hedging, balanced perspectives, fewer em dashes
- **Gemini:** conversational, simple vocabulary, "below," "example," minimal formatting

At least 10-13.5% of 2024 PubMed abstracts were LLM-processed; 30-40% in some subcorpora.

### Finding: Eight structural tells create a visual "AI signature" — sentence uniformity, paragraph rigidity, heading patterns, transition overuse, list abuse, hedging, punctuation, and the acknowledge-then-pivot pattern
**Confidence:** CONFIRMED
**Evidence:** Pangram Labs, Inside Higher Ed, AirOps, Washington Post (em dash), multiple practitioner sources.

1. **Sentence length uniformity (low burstiness):** AI averages 15-20 words with minimal variation. Burstiness score B = sigma/mu * 100; AI scores significantly lower. Editing to vary lengths reduces detection by 40%.
2. **Paragraph rigidity:** All paragraphs roughly same length, identical internal structure (topic → evidence → summary), equal treatment of all sections regardless of importance.
3. **Formulaic headings:** Title case, "The Role of X in Y," "Understanding X," excessive parallelism across heading levels.
4. **Transition word overuse:** "Furthermore," "Moreover," "Additionally" as paragraph openers at rates far exceeding human writing. Inside Higher Ed: AI essays "far more likely" to start paragraphs with these.
5. **List/bullet abuse:** Converts nuanced arguments into numbered lists; parallel-structured items with identical grammatical pattern; "Rule of Three" obsession.
6. **The acknowledge-then-pivot:** "While [topic] is certainly complex, it's important to understand that..." Reflects RLHF training to appear balanced. Appears even when no concession is needed.
7. **Excessive hedging:** 3.2x more hedging language than human-written content. "It's worth noting," "it's important to consider," "could potentially," "some experts suggest."
8. **Punctuation tells:** Em dash overuse (tripled in tech subreddits in one year; OpenAI added opt-out Nov 2025). Consistent Oxford comma. Zero sentence fragments. Minimal contractions.

### Finding: "Semantic ablation" — AI systematically erodes high-entropy information through three stages, producing the "median voice" that sounds like everyone and no one
**Confidence:** CONFIRMED
**Evidence:** The Register (Feb 2026), Averi.ai, EasyContent.io.

**Three stages of semantic degradation:**
1. **Metaphoric cleansing:** Unconventional metaphors replaced with generic alternatives
2. **Lexical flattening:** Domain-specific jargon substituted with common synonyms, reducing semantic density
3. **Structural collapse:** Complex reasoning forced into predictable templates, destroying nuance

75% of marketers use AI tools; most are "inadvertently erasing what makes their brands unique, resulting in companies sounding eerily similar — polished, professional, and utterly forgettable."

Measurement: entropy decay — running text through successive AI refinement loops causes vocabulary diversity (type-token ratio) to collapse.

### Finding: Perceived AI authorship triggers a trust penalty on the brand/creator, not on the content itself — sincerity drops from 83% to 40-52%
**Confidence:** CONFIRMED
**Evidence:** Cardon & Coman (2025, SAGE); Rae et al. (CHI '24); Bynder; NIM (2024-2025).

- **Sincerity:** 83% (low AI) → 40-52% (high AI) — Cardon & Coman, 1,100 professionals
- **Professionalism:** 95% → 69-73% — same study
- **Creator penalty:** Trust penalty falls on the brand, not the content. Readers perceive less effort and qualification in the creator, even when content quality judgments remain unchanged (CHI '24, 1,641 participants)
- **Engagement paradox:** 56% prefer AI content when unlabeled, but 52% disengage when they suspect AI involvement (Bynder)
- **Preference collapse:** Preference for AI content dropped from 60% (2023) to 26% (2025)
- **Disclosure paradox:** 63% want disclosure, but disclosure reduces credibility, creativity, and shareability across every study

B2B buyers react more negatively due to: higher stakes, greater AI literacy (62% fact-check AI content), expectation of original insight (86% want content that challenges assumptions per Edelman).

### Finding: AI content in Google search results grew 8.5x from pre-GPT-2 levels; 74.2% of newly published web pages contain detectable AI content — platform engagement is declining across the board
**Confidence:** CONFIRMED
**Evidence:** Originality.ai (500 keywords, ongoing); Amra and Elma; Siege Media; CoSchedule.

- AI content in top 20 search results: 2.27% (pre-GPT-2) → 19.56% peak (July 2025)
- 74.2% of nearly a million newly published web pages contained detectable AI content (April 2025)
- 189% increase in AI posts on LinkedIn; 50%+ of long-form LinkedIn posts likely AI-generated
- Instagram engagement: 2.18% (2021) → 1.59% (2024), -27%
- LinkedIn organic reach down 50% for 95% of creators
- 75% of marketers report declining results from content efforts
- "AI slop" mentions increased 9x in 2025 (Merriam-Webster named "slop" 2025 Word of the Year)

### Finding: Google's leaked `contentEffort` attribute is an LLM-based effort estimation that evaluates depth, originality, multimedia sophistication, and replicability difficulty — creating direct countermeasure to scaled AI content
**Confidence:** CONFIRMED
**Evidence:** Hobo Web (leaked API analysis), confirmed through DOJ v. Google antitrust trial exhibits.

`contentEffort` evaluates:
- Depth and originality (unique data/research)
- Multimedia sophistication (original photography vs stock)
- Structural complexity (logical hierarchies, comprehensive coverage)
- Replicability difficulty (how easily competitors or AI could reproduce)
- Expert citations/interviews signaling substantive research

Google's March 2024 update aimed for 45% reduction in low-quality content. 83% of top-ranking results remain human-generated (Gotch SEO, 487 SERPs). Sites with 80-90% unedited AI content face deindexing risk.

### Finding: Brand damage case studies — Sports Illustrated (CEO fired), CNET (53% error rate, Wikipedia downgrade), Coca-Cola ("soulless" backlash) demonstrate concrete consequences of AI content failures
**Confidence:** CONFIRMED
**Evidence:** NPR, Washington Post, CNN, Futurism, NNGroup.

- **Sports Illustrated:** Fake AI-generated authors with AI photos. CEO, COO, and President all fired.
- **CNET:** 77 AI articles, corrections on 41 (53% error rate). Basic math errors. Wikipedia downgraded reliability.
- **Coca-Cola:** AI holiday campaign widely called "soulless." Reputational damage.
- **Queensland Symphony Orchestra:** AI ad with distorted hands condemned as "worst AI generated artwork."

### Finding: Five-pass de-AI editing framework transforms AI drafts into publishable human-quality content — but requires 60-70% of sentences meaningfully rewritten
**Confidence:** CONFIRMED
**Evidence:** Jasper, Rellify, Stellar Content, eesel.ai, AirOps, Copy.ai, Orbit Media 2025.

1. **Structural demolition** — break AI's template DNA; reorder by argument logic, vary section depth
2. **Voice injection** — replace median voice with identifiable authorial presence; add first-person, opinions, industry shorthand, parenthetical asides
3. **Specificity pass** — replace every vague claim with concrete detail (the "competitor test": could a competitor publish this same content?)
4. **Hedging removal** — strip "it's worth noting," "could potentially," "some experts suggest"
5. **Pattern breaking** — vary sentence length dramatically, use fragments, start with "And" or "But," use questions

**Performance data (Orbit Media 2025):**
- Human-written content: 5.44x more traffic
- Human content: 41% longer sessions, 18% lower bounce
- Human-edited AI content: 54% cheaper, converts 21% better
- AI + human editing: 42% higher ROI than purely manual workflows
- Marketers who use AI for complete drafts are less likely to report strong results

### Finding: Ten blog-specific anti-patterns uniquely associated with AI-generated content
**Confidence:** CONFIRMED
**Evidence:** AirOps, arXiv (Shaib et al. 2025), Originality.ai, practitioner consensus.

1. **The Perfectly Structured Nothing** — flawless H2/H3 hierarchy, says nothing not already in top 5 Google results
2. **The Surface-Level Expert** — covers complex topic at definitions + pros/cons level only; all setup, no payoff
3. **The Uniform Listicle** — every item follows same template, same length; remove item names and they're interchangeable
4. **The "In Today's..." Opener** — "In today's competitive landscape..." (107x more likely in AI output)
5. **The Restatement Conclusion** — "In conclusion, we've explored how..." adds zero new value
6. **The "Both Sides" Fence-Sitting** — presents every viewpoint without taking a position; "it depends on your specific needs" without specifying for whom
7. **The Missing Proof** — "Studies show..." (which studies?), "Industry leaders recommend..." (name them)
8. **The Sentiment Sandwich** — every negative immediately neutralized: "While X has challenges, the benefits far outweigh the drawbacks"
9. **The Absence of Failure** — no failure stories, negative results, or "what didn't work"
10. **The Stock Photo Dependency** — no original screenshots, data visualizations, or proprietary visuals

### Finding: Ten irreducible human elements that AI fundamentally cannot replicate — these are the durable competitive moat for content
**Confidence:** CONFIRMED

1. **Original research** — surveys, proprietary datasets, A/B tests
2. **Genuine experience narratives** — specific implementation stories with emotional weight
3. **Authentic voice** — genuine humor, sarcasm, vulnerability, irreverence
4. **Cultural references** — niche, timely, community-specific references signaling genuine membership
5. **Industry-specific humor** — jokes from shared pain (enterprise procurement absurdity, tool UX frustration)
6. **Contrarian opinions with real conviction** — career risk, reputation stake, lived experience behind claims
7. **Failure stories** — specific numbers, named decisions, honest post-mortems
8. **Proprietary implementation data** — real benchmarks, customer metrics, dashboard screenshots
9. **Relationship-based insights** — conversations with customers, partners, peers not published anywhere
10. **Genuine uncertainty** — "I don't know" and "I'm not sure" from intellectual honesty vs AI hedging for safety

---

## Gaps / follow-ups

- No controlled study isolates AI slop impact on B2B SaaS blog engagement specifically (vs general content)
- Preference collapse (60% → 26%) is from single-source aggregation; needs independent replication
- De-AI editing time estimates are from practitioner workflows, not time-motion studies
- Model-specific fingerprints are evolving as models improve; "delves" may become less prevalent
- Cultural/linguistic variation in AI detection — documented tells are English/US-centric
- Long-term brand damage from AI content is under-studied quantitatively
