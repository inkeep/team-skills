# Evidence: AI Slop Detection & Tells

**Dimension:** 18 (AI Slop Detection & What Recipients Instantly Reject)
**Date:** 2026-02-06
**Sources:** Liang et al. (2024, arxiv — 25.2x "delves" increase), TextVisualization.app (ChatGPT corpus analysis), Hunter.io (217 decision-makers + 11M emails), Cardon & Coman (2025, Intl J Business Communication — 1,000+ professionals), GMass (AI tool testing), Chiopara et al. (2025, Expert Systems with Applications — 47 stylometric features), Charlie Guo (ignorance.ai taxonomy), Sean Goedecke (seangoedecke.com), AiSDR (21 AI-signaling words), Rui Nunes (ruinunes.com), Folderly (Gmail RETVec + Gemini analysis)

---

## Key sources referenced
- Liang et al. (2024), arxiv.org/html/2406.07016v1 — Peer-reviewed quantification of AI vocabulary markers in academic writing; 66% verbs, 18% adjectives among style-word shifts
- TextVisualization.app — Corpus analysis: "intricate" 115x, "vibrant" 1,260x, "breathtaking" 36,261x overuse vs human baseline
- Hunter.io AI Cold Email Guide (2025) — Survey of 217 decision-makers + 11M emails; ~50% detection accuracy (coin-flip)
- Cardon & Coman (2025), Intl J Business Communication / USC Marshall — 1,000+ professionals: sincerity drops from 83% to 40-52% with heavy AI assistance
- GMass AI personalization tool testing — Documented ~15% hallucination rate, homepage-scraping-as-personalization pattern
- Chiopara et al. (2025), Expert Systems with Applications (ScienceDirect) — 47 stylometric features, 96% detection accuracy with XGBoost
- Charlie Guo, "The Field Guide to AI Slop" (ignorance.ai) — Taxonomy: em dashes, structural monotony, parallelism clichés, Unicode formatting
- Sean Goedecke, "Don't Feed Me AI Slop" (seangoedecke.com) — Definition: low content-density text; visceral reader reactions
- AiSDR practitioner guide — 11 primary + 10 secondary AI-signaling words with email-context replacements
- Rui Nunes, "AI Cold Email Is Killing Cold Email" (ruinunes.com) — 85-95% of AI "personalization" is template with 3-5 swapped fields
- Folderly — Gmail RETVec (38% spam detection improvement) + Gemini AI Inbox analysis (2026)

---

## Findings

### Finding: AI-generated text has a statistically measurable vocabulary fingerprint — style words, not content words
**Confidence:** CONFIRMED
**Evidence:** Liang et al. (2024), arxiv.org/html/2406.07016v1; TextVisualization.app — accessed 2026-02-06

- AI-influenced vocabulary shifts in 2024 consisted almost entirely of style words — 66% verbs, 18% adjectives.
- "Delves" showed 25.2x increase in usage ratio; "showcasing" and "underscores" ~9x increases.
- In raw ChatGPT output: "intricate" appeared 115x more often, "vibrant" 1,260x more, "breathtaking" 36,261x more than human-written text from Project Gutenberg.
- ChatGPT texts lack natural "burstiness" — the clumping of repeated words that characterizes human writing — producing unnaturally uniform distribution.
- Paul Graham publicly dismissed a cold pitch containing "delve" as AI-generated (X post, April 2024).

**Implications:** These vocabulary markers are the most reliable surface-level detection mechanism. In cold email, words like "delve," "leverage," "tapestry," "cutting-edge," "multifaceted," "testament," and "revolutionary" function as instant AI flags. A single flagged word can trigger immediate delete.

---

### Finding: The "uncanny valley" of AI personalization — references feel extracted rather than understood
**Confidence:** CONFIRMED
**Evidence:** GMass cold email AI tool testing; Rui Nunes (ruinunes.com) — accessed 2026-02-06

- GMass tested 5 AI personalization tools: tools restated company homepage marketing language as "personalization."
- ~15% hallucination rate: invented movie titles, fabricated Instagram videos, claimed fictional connections.
- 85-95% of AI "personalized" content was templates with 3-5 fields swapped in (Rui Nunes).
- Result: personalization that references achievements in a way that feels algorithmically extracted rather than genuinely understood — compliments with precision but emotional hollowness.
- Creepiness threshold crossed when referencing personal social media content (e.g., a recipient's recent trip).

**Implications:** The uncanny valley manifests when personalization is technically accurate but contextually hollow. Mentioning a LinkedIn post without engaging with the ideas feels worse than no personalization — it demonstrates effort to simulate caring while failing to actually care.

---

### Finding: Structural and formatting tells create a visual "AI signature" before content is even read
**Confidence:** CONFIRMED
**Evidence:** Charlie Guo (ignorance.ai); Gmelius "20 AI-isms" analysis — accessed 2026-02-06

- Excessive em dash usage (tripled in tech subreddits in one year — now associated with AI so strongly Rolling Stone published a feature on it).
- "It's not X, it's Y" negation structure used reflexively.
- Snappy triads (three-item lists), unearned profundity phrases ("Something shifted").
- Mid-sentence rhetorical questions, bolded words without clear emphasis purpose.
- Unicode text variations (bold/italic via special characters), emoji-prefixed bullet points in professional contexts.
- 20 "AI-isms" identified: excessive bullet points/numbered lists, dense paragraphs lacking white space, overuse of bold, formulaic greetings, generic subject lines.

**Implications:** These formatting patterns are detected pre-consciously — recipients see the visual shape of an email before reading words. Bullet points + bold keywords + formulaic opening = immediate visual classification as automated outreach.

---

### Finding: AI slop is defined by low content density — verbose, generic padding where specificity should exist
**Confidence:** CONFIRMED
**Evidence:** Sean Goedecke (seangoedecke.com); Merriam-Webster 2025 Word of the Year; Benjamin Congdon (benjamincongdon.me) — accessed 2026-02-06

- Slop = content where AI transforms minimal input into polished text that adds padding but no information a human would include. "Surface polish with nothing underneath."
- Merriam-Webster named "slop" 2025 Word of the Year. Online mentions increased 9x from 2024 to 2025, with 82% negative sentiment.
- Congdon: writing mimics the preference of the "median human data annotator" — bland, median-preference output.
- Key test: could this exact sentence have been sent to 1,000 other people unchanged? If yes, it is slop.

**Implications:** In outbound email, slop = "I noticed your company is navigating the complexities of [industry] in today's rapidly evolving landscape." Grammatically perfect but says nothing specific. The absence of concrete metrics, deadlines, or situations is the tell.

---

### Finding: Recipients cannot reliably detect well-crafted AI emails — but bad AI writing is instantly detected
**Confidence:** CONFIRMED
**Evidence:** Hunter.io AI Cold Email Guide (2025), 217 decision-makers + 11M emails — accessed 2026-02-06

- Marketing, tech, and financial services professionals achieved only ~50% accuracy identifying AI-written cold emails (coin-flip).
- Education and manufacturing professionals performed below 50%.
- When respondents correctly identified AI: reasoning was "it sounded repetitive, overly formal, and formulaic."
- Two-thirds of decision-makers said they don't mind AI-written emails as long as they still feel human.
- Conclusion: "bad AI writing stands out; good AI writing blends in."

**Implications:** Detection is asymmetric. The problem is not AI usage but the failure to edit. If you run AI output through basic editing to remove tells, detection approaches zero. But most senders skip editing because the value proposition of AI outbound is speed — and editing destroys speed.

---

### Finding: Heavy AI reliance destroys perceived sincerity — 83% to 40% drop in trust perception
**Confidence:** CONFIRMED
**Evidence:** Cardon & Coman (2025), Intl J Business Communication, USC Marshall — accessed 2026-02-06

- Only 40-52% of employees viewed supervisors as sincere when emails used high AI assistance, vs 83% for low-assistance messages.
- Professionalism perception: 95% (low AI) → 69-73% (high AI).
- Participants accepted low-level AI help (grammar, polishing) but became skeptical with extensive use.
- Heavy AI usage interpreted as laziness or lack of caring.
- Perception gap is asymmetric: people judge their own AI use leniently but others' harshly.

**Implications:** When recipients perceive AI wrote an email asking for their time, they interpret it as the sender valuing their own efficiency over the recipient's experience. The sincerity drop is steepest for messages implying personal engagement — exactly the framing cold emails use.

---

### Finding: Specific "meme-tier" AI phrases function as instant-reject signals in cold outreach
**Confidence:** CONFIRMED
**Evidence:** AiSDR practitioner guide; Rui Nunes (ruinunes.com); Paul Graham X posts (April 2024) — accessed 2026-02-06

- Primary blocklist: "delve," "tapestry," "In today's ever-evolving world," "In summary/In conclusion/In essence," "It's important to note," "cutting-edge," "multifaceted," "testament," "Certainly!", "revolutionary."
- Secondary blocklist: "Harness the power of," "In the ever-evolving landscape of," "As we navigate the complexities of," "Unlocking the potential of," "Seamlessly integrate," "At the forefront of innovation," "A game-changing solution," "Empowering users to."
- Cold email openers: "impressed," "fascinated," "intrigued" have reached meme-level overuse.
- These function as shibboleths — their concentration in AI output is so extreme that presence in a cold email creates a strong Bayesian prior for AI authorship.

**Implications:** A single "delve" is survivable; "delve" + "landscape" + "cutting-edge" in the same email = near-certain AI classification. Practitioners now maintain and share these blocklists actively.

---

### Finding: Spam filters are developing stylometric detection capabilities targeting AI-generated patterns
**Confidence:** CONFIRMED
**Evidence:** Chiopara et al. (2025), Expert Systems with Applications; Folderly (Gmail RETVec) — accessed 2026-02-06

- 47 novel stylometric features for AI email detection achieve 96% accuracy with XGBoost.
- Key features: imperative verb count (AI overuses "click," "verify," "act now"), clause density, first-person pronoun patterns.
- Gmail and Outlook allowed more AI-generated emails through than Yahoo — detection remains inconsistent across ESPs.
- Gmail's RETVec: 38% spam detection improvement, 19.4% false positive reduction, converts text to semantic vectors regardless of obfuscation.
- Gmail's 2026 Gemini integration: AI Inbox summarizes, prioritizes, and filters based on engagement signals — disfavors high-volume, low-engagement streams.

**Implications:** The spam filter landscape is evolving toward content-level AI detection, not just sender reputation. Even emails passing authentication may face content-based filtering if they exhibit AI patterns. Gmail's Gemini creates AI-vs-AI dynamics: AI writing outbound filtered by AI protecting inboxes.

---

### Finding: Tone-voice mismatch triggers cognitive dissonance — recipients sense something is "off" before identifying why
**Confidence:** INFERRED
**Evidence:** HIIG Digital Society Blog; Goedecke (seangoedecke.com); Futurism — accessed 2026-02-06

- NYT journalist used AI for work emails for one week — colleagues wondered if she was annoyed at them (tone didn't match known style).
- Interview participant's AI emails were enthusiastic, but in-person was disinterested — jarring person-text disconnect.
- Visceral reactions reported: "I felt violated. It felt wrong."
- The absence of natural human markers — "rough edges, voice cracks, unexpected pauses, half-formed metaphors" — creates unsettling polish.

**Implications:** AI produces emails uniformly enthusiastic, polished, and positive — always "on" — which paradoxically reduces trust. Real humans writing cold emails include hedging, self-awareness, and tonal imperfections that signal authenticity. AI's relentless positivity is itself a tell.

---

### Finding: Gmail's Gemini-era AI Inbox creates a new filtering layer where AI-sounding content is deprioritized before recipients see it
**Confidence:** INFERRED
**Evidence:** Folderly (2026); Google blog; Attentive analysis — accessed 2026-02-06

- Gmail's January 2026 "AI Inbox" (Gemini 3): briefing-style overview replacing chronological listing.
- System identifies VIPs via interaction frequency, disfavors high-volume low-engagement streams.
- Open rates increased to 45.6% (AI summaries count as opens), but CTR dropped from 4.35% to 3.93% (users read summaries instead of opening).
- AI prioritizes: clear value propositions, specific dates/deadlines, direct CTAs, factual details.
- AI deprioritizes: emotional language, brand storytelling, multiple competing messages, buried key information.

**Implications:** Cold emails must survive evaluation by Gmail's AI before reaching humans. Emails with specific, concrete, factual value propositions survive; generic AI-generated content gets deprioritized. The irony: AI tools generating outbound are filtered by AI tools protecting inboxes.

---

## Negative searches
- Direct A/B study of AI-written vs human-written cold emails with controlled methodology: Not found. Hunter.io tested detection, not performance. Vendor claims lack transparency.
- ESP official documentation confirming AI content detection as distinct spam category: Not found beyond RETVec's general improvements.
- Recipient-side controlled study on cold email AI detection specifically: Not found.

---

## Gaps / follow-ups
- Longitudinal detection accuracy: as models improve (GPT-5, Claude), do vocabulary/structural tells persist or fade?
- Industry-specific detection sensitivity: which B2B buyer segments are most detection-sensitive?
- AI-on-AI filtering dynamics: interaction between AI-generated outbound and AI-filtered inbound lacks empirical study
- Non-English AI detection patterns: documented tells are English/U.S.-centric; "delve" controversy with Nigerian English speakers highlights cultural variation
