---
title: "Compass Blog Storytelling: Why Readers Don't Connect and How to Fix It"
description: "Research into storytelling frameworks, narrative principles, and technical blog best practices to improve Compass blog generation system. Identifies why AI-generated content feels robotic and provides specific recommendations for prompt, template, and pipeline modifications."
createdAt: 2026-02-20
updatedAt: 2026-02-20
version: 2
subjects:
  - Compass
  - Inkeep
topics:
  - content generation
  - storytelling
  - B2B marketing
  - AI writing
---

# Compass Blog Storytelling: Why Readers Don't Connect and How to Fix It

**Purpose:** Identify why Compass-generated blog content fails to connect with readers emotionally, and provide specific, implementable recommendations for modifying prompts, templates, and pipeline architecture to produce content that builds trust and engagement while maintaining conversion effectiveness.

---

## Executive Summary

Compass's blog generation system is highly optimized for **scanners and evaluators**—readers who arrive with a decision to make and want the answer fast. The 12 Laws, 4-step Claude chain, and rigid templates produce content that is structurally sound, SEO-optimized, and conversion-focused.

But readers don't connect because the system **systematically strips everything that creates human connection**: personal voice, narrative arc, emotional resonance, named authorship, contrarian perspective, and surprise.

The research reveals a fundamental tension: **AI-generated content trends toward averageness**. Each step in Compass's 4-step chain moves content further toward Claude's default "helpful assistant" voice. By step 4 (editorial polish), the content has passed through 4 averaging operations.

**Key Findings:**

1. **Stories are remembered 22x more than facts alone** (Stanford research). Compass produces facts in bullet form.

2. **88% of consumers say authenticity matters for brand trust** (Stackla). Anonymous "Inkeep Team" authorship signals inauthenticity.

3. **Top technical blogs (Stripe, Lenny's) succeed through named authorship + personal voice**, not polished anonymity.

4. **Customer-as-hero positioning outperforms vendor-as-hero**. Current templates center Inkeep ("How we help") rather than the reader's journey.

5. **The 4-step Claude chain compounds homogenization**. Each step averages voice toward generic AI writing.

**The fix isn't more templates or editing passes**—it's inverting the human/AI relationship and injecting personality at the source.

---

## Research Rubric

| Dimension | Priority | Status |
|-----------|----------|--------|
| Storytelling Frameworks (SUCCESs, StoryBrand, Story Circle) | P0 | CONFIRMED |
| Narrative Arc Principles (Zinsser, Made to Stick) | P0 | CONFIRMED |
| B2B Content That Connects (Emotional + Rational) | P0 | CONFIRMED |
| Technical Blog Benchmarks (Stripe, Lenny's) | P1 | CONFIRMED |
| AI Generation Anti-patterns | P1 | CONFIRMED |
| Compass-Specific Recommendations | P0 | CONFIRMED |

---

## Detailed Findings

### 1. Storytelling Frameworks: What Compass Is Missing

**Finding:** The SUCCESs model (Made to Stick) identifies six elements of memorable content. Compass optimizes for two (Simple, Concrete) and ignores four (Unexpected, Credible, Emotional, Stories).

**Evidence:** [evidence/storytelling-frameworks.md](evidence/storytelling-frameworks.md)

| SUCCESs Element | What It Means | Compass Status |
|-----------------|---------------|----------------|
| Simple | Core message, no clutter | ✅ Strong |
| Unexpected | Violate expectations | ❌ Formulaic structure |
| Concrete | Specific, sensory details | ✅ Numbers over adjectives |
| Credible | Proof points, validation | ⚠️ Present but generic |
| Emotional | Make readers feel | ❌ Enterprise-speak only |
| Stories | Embed in narrative | ❌ Bullet-point driven |

**StoryBrand insight:** "Stop being the hero of your own story—your customer is the hero, and you are the guide."

Current Compass structure centers Inkeep:
- "How we help"
- "Our solution"
- "Inkeep provides..."

**Decision trigger:** If readers bounce after scanning but before engaging, this is the problem. They see a brochure, not a guide.

---

### 2. Narrative Arc Principles: Why Zinsser Still Matters

**Finding:** William Zinsser's four principles of good writing—clarity, simplicity, brevity, humanity—are partially enforced. Compass optimizes heavily for the first three but systematically suppresses humanity/identity.

**Evidence:** [evidence/narrative-principles.md](evidence/narrative-principles.md)

**Zinsser's key insight:** "Your voice is what will connect with readers, making the writing memorable and engaging... writing simply and clearly is the most effective way to develop a unique writing identity."

Compass enforces:
- 25-word sentence limits (brevity ✅)
- 3-line paragraph limits (simplicity ✅)
- Numbers over adjectives (clarity ✅)
- "Inkeep Team" authorship (humanity ❌)

**The missing element:** Personal voice. Compass prompts instruct "authoritative but accessible" without defining whose authority or whose voice.

**Decision trigger:** If content reads like it could have been written by any AI tool, humanity is missing.

---

### 3. B2B Emotional Connection: The Rational-Emotional Balance

**Finding:** B2B buyers—even technical ones—make decisions emotionally and justify rationally. Compass addresses rational needs (frameworks, trade-offs, recommendations) but ignores emotional needs (empathy, relatability, trust).

**Evidence:** [evidence/b2b-emotional-connection.md](evidence/b2b-emotional-connection.md)

**Key insight:** "Even B2B can be emotional—lead with messages that speak to your audience's emotional problem, not just their business problem."

| Reader Need | What Compass Does | What's Missing |
|-------------|-------------------|----------------|
| Rational evaluation | Decision frameworks, tables | Nothing |
| Emotional reassurance | "Enterprise-grade" claims | "I've been in your situation" |
| Trust building | Trade-offs section | Personal stakes, named credibility |
| Fear of wrong decision | Recommendations | Acknowledgment of difficulty |

**Customer-as-hero gap:** Current templates position the reader as an evaluator, not as someone on a journey. The structure assumes they've already decided to buy something—just deciding what.

Many readers arrive earlier in their journey: "I'm frustrated with my current AI support. Is there a better way?" These readers need empathy before frameworks.

---

### 4. Technical Blog Benchmarks: What Stripe and Lenny Do Differently

**Finding:** Top technical blogs achieve consistency through voice standards, not structural templates. Stripe and Lenny's Newsletter share: named authorship, personal expertise, depth over polish, and flexible structure.

**Evidence:** [evidence/technical-blog-benchmarks.md](evidence/technical-blog-benchmarks.md)

**Stripe's approach:**
- Blog posts "written by technologists"—named experts
- Deep technical dives with context
- Quality bar, not template compliance
- "Standardization for quality, not templates employees fill like Mad Libs"

**Lenny's approach:**
- "Casual, tactical, and fluff-free"
- "1:1 writing from a smart operator to peers"
- Each post takes 10–100+ hours
- 50% of popular posts are guest posts (credible experts)
- Personal experience: "I've seen this pattern..."

**The Mad Libs anti-pattern:** Compass's template approach (fill in Decision Framework, fill in Trade-offs, fill in How We Help) is exactly what Stripe explicitly avoids.

**Benchmark comparison:**

| Dimension | Stripe | Lenny's | Compass |
|-----------|--------|---------|---------|
| Author | Named engineers | Named (Lenny + guests) | "Inkeep Team" |
| Voice | Expert-authority | Peer-tactical | Enterprise-formal |
| Structure | Flexible, story-driven | Hook + breakdown | Rigid 12-Law |
| Reader feeling | "Learning from an expert" | "Advice from a peer" | "Reading a brochure" |

---

### 5. AI Generation Anti-patterns: Why the 4-Step Chain Compounds the Problem

**Finding:** AI-generated content trends toward averageness because LLMs predict the most statistically likely next word. Multi-step chains compound this effect—each step averages voice further.

**Evidence:** [evidence/ai-generation-antipatterns.md](evidence/ai-generation-antipatterns.md)

**The homogenization mechanism:**

```
Step 1: Research Synthesis → Original source voices lost
Step 2: Outline Generation → Formulaic structure imposed
Step 3: Section Writer → Word counts enforced, template followed
Step 4: Editorial Polish → Final averaging toward "helpful assistant"
```

**Key quote:** "Most AI-generated content feels like 'slop' because it lacks nuance and originality—it's dull, uninspiring and glaringly average."

**The authenticity problem:** "Even if readers can't explain why, robotic tone feels inauthentic, and authenticity drives credibility."

**What doesn't work:**
- Adding more editing passes (compounds averaging)
- "Humanize this" as a final step (too late)
- More detailed templates (more formulaic output)

**What works:**
- Human authorship with AI assist (not AI authorship with human edit)
- Injecting personal experience at Step 1, not Step 4
- Allowing imperfection (signals human authorship)
- Strong opinions that not everyone agrees with

---

### 6. Compass-Specific Analysis: What Needs to Change

**Finding:** Compass's current architecture systematically produces content that is structurally correct but emotionally flat. The beliefs system contains strong opinions that aren't surfacing as authorial voice.

**Evidence:** [evidence/compass-current-state.md](evidence/compass-current-state.md)

**The 12 Laws problem:** Every law optimizes for scanners and evaluators. None optimize for connection, narrative, or trust.

**Laws 1-4:** Structure for scanning (Decision first, H2 navigation, word limits, frameworks)
**Laws 5-7:** Conversion optimization (prescriptions, H3 limits, trade-offs)
**Laws 8-12:** Polish (media matching, titles, CTAs, skimmability)

**Missing laws:**
- No guidance on narrative arc
- No permission for personal voice
- No encouragement of contrarian takes
- No story structure patterns

**The beliefs gap:** Omar's beliefs are strong and opinionated:
- "Hybrid search outperforms pure vector search by 15-30%"
- "AI support agents should admit uncertainty rather than confidently hallucinate"

These are treated as **evidence to cite**, not **positions to argue**. The system strips the conviction.

---

## Recommendations: Concrete Changes to Compass

### R1: Introduce Blog Archetypes (Not Just Word-Count Modes)

**Current:** Three modes based on length (brief, standard, deep)
**Proposed:** Five archetypes based on reader journey and narrative structure

| Archetype | Purpose | Structure | When to Use |
|-----------|---------|-----------|-------------|
| **Decision Memo** | Help evaluators choose | Decision → Framework → Trade-offs → Recommendation | Comparison posts, "which should I use" |
| **Contrarian Essay** | Challenge accepted wisdom | Hook → Conventional wisdom → Why it's wrong → Evidence → New frame | Thought leadership, differentiation |
| **Lessons Learned** | Share hard-won insights | Setup → What we tried → What failed → What worked → Takeaways | Post-mortems, case studies |
| **Technical Deep-Dive** | Educate with depth | Problem → Context → Approach → Implementation → Results | How-to, architecture posts |
| **Story-Driven** | Connect emotionally | Character → Problem → Journey → Transformation → Application | Origin stories, customer journeys |

**Implementation:** Add `archetype` to blog generation config. Create separate prompt templates per archetype.

---

### R2: Replace Anonymous Authorship with Named Authors + Voice Profiles

**Current:** Default author "Inkeep Team"
**Proposed:** Named authors with distinct voice profiles

**Author Voice Profiles:**

```typescript
const authorProfiles = {
  omar: {
    name: "Omar Nasser",
    role: "Founder",
    voice: "Technical-confident. Speaks from building experience. Uses specific numbers. Willing to say what competitors get wrong.",
    beliefs: ["hybrid search > pure vector", "SDKs should feel native", "citations are non-negotiable"],
    signature_phrases: ["Here's what we've seen...", "The data shows...", "This is where most teams fail..."]
  },
  robert: {
    name: "Robert Chen",
    role: "Engineering",
    voice: "Builder-practical. Code examples. Architecture-first. Admits trade-offs clearly.",
    beliefs: [...],
    signature_phrases: [...]
  }
  // etc.
}
```

**Implementation:**
1. Add author selection to blog generation
2. Inject author profile into Step 1 (research synthesis) and Step 3 (section writer)
3. Include signature phrases and beliefs as voice anchors

---

### R3: Restructure the 4-Step Chain to Inject Human Voice Earlier

**Current chain:**
```
Research → Outline → Section Writer → Polish
   (AI)      (AI)        (AI)          (AI)
```

**Proposed chain:**
```
Human Brief → AI Research → Human Outline Review → AI Draft → Human Voice Pass
  (human)       (AI)           (human)              (AI)        (human)
```

**Key changes:**
1. **Human Brief:** Author writes 2-3 sentences stating their thesis and personal stake
2. **Human Outline Review:** Author approves/modifies structure before section writing
3. **Human Voice Pass:** Author adds personal anecdotes, strengthens opinions, injects personality

**Alternative (if human passes not scalable):**

Add a **Voice Injection** step after Research Synthesis:
```typescript
buildVoiceInjectionPrompt(data: {
  author: AuthorProfile,
  researchBrief: string,
  authorBelief: Belief, // Selected belief relevant to topic
  personalAnecdote?: string, // Optional human input
}): string
```

---

### R4: Add Emotional Arc Requirements to Prompts

**Current prompt (section-writer.system.md):**
```
Write this section ({{targetWords}} words). Requirements:
- Be substantive, not fluffy
```

**Proposed additions:**
```
Write this section ({{targetWords}} words). Requirements:
- Be substantive, not fluffy
- Open with the reader's emotional reality (frustration, fear, confusion)
- Create tension before resolution
- Include one concrete example or anecdote
- End with forward momentum (what reader can do next)
```

**Emotional arc template:**
```
[Reader's current pain] → [Why current approaches fail] → [The insight] → [What this means for reader]
```

---

### R5: Create "Contrarian Hook" Requirement for Thought Leadership

**New prompt addition for thought leadership content:**

```markdown
CONTRARIAN HOOK REQUIREMENT:
This post must open with a contrarian take—something that challenges accepted wisdom in the industry.

Pattern:
"Most teams believe X. [Evidence shows / Our experience is] that Y instead."

Examples from Inkeep beliefs:
- "Most teams measure deflection rate. This metric lies."
- "The industry says 'AI-first.' We say 'accuracy-first.'"
- "Everyone wants chatbots. What customers want is correct answers."

Your contrarian hook for this topic:
```

---

### R6: Modify Writing Laws to Include Voice Requirements

**Add to writing-laws/full.md:**

```markdown
### VOICE (New Section)

**[MUST] Include author perspective**
WHY: Anonymous content doesn't connect. Readers want to know who's speaking.
PATTERN: "In my experience...", "We've found that...", "I've seen this fail when..."

**[MUST] Include one specific example per section**
WHY: Abstract claims don't stick. Concrete examples do.
PATTERN: "For example, when [Company X] implemented [thing], [specific outcome]."

**[SHOULD] Include one contrarian take per post**
WHY: Agreement doesn't differentiate. Strong positions do.
PATTERN: "Unlike [common belief], we've found that [opposite/nuanced view]."

**[SHOULD] Vary emotional register**
WHY: All-rational is cold. All-emotional is fluffy. Mix creates engagement.
PATTERN: Problem (frustration) → Analysis (rational) → Insight (surprising) → Application (empowering)
```

---

### R7: Add Story Arcs to Outline Generation

**Modify buildOutlinePrompt to include narrative structure:**

```typescript
const narrativeGuidance = {
  decision_memo: {
    arc: "Setup → Analysis → Decision → Action",
    emotional_beat: "Overwhelmed → Clarity → Confidence → Momentum"
  },
  contrarian_essay: {
    arc: "Hook → Conventional wisdom → Challenge → Evidence → New frame",
    emotional_beat: "Surprise → Recognition → Doubt → Understanding → Conviction"
  },
  lessons_learned: {
    arc: "Context → Attempt → Failure → Insight → Success",
    emotional_beat: "Ambition → Struggle → Frustration → Aha → Satisfaction"
  }
};
```

---

### R8: Reduce Chain Steps or Inject Human at Key Points

**Option A: Reduce to 2-step chain**
```
Step 1: Research + Outline (combined)
Step 2: Full draft with voice injection
```
Fewer averaging operations = more distinctive voice.

**Option B: Human checkpoint after outline**
```
Step 1: Research Synthesis (AI)
Step 2: Outline (AI) → HUMAN REVIEW/EDIT
Step 3: Section Writer (AI with human-edited outline)
Step 4: Light polish only (AI)
```

**Option C: Author writes intro, AI assists rest**
```
Step 1: Human writes 200-word intro with thesis + personal stake
Step 2: AI expands into full draft, maintaining intro voice
Step 3: Human reviews, adds anecdotes
```

---

## Implementation Priority

| Change | Impact | Effort | Priority |
|--------|--------|--------|----------|
| **Voice Anchor Articles** (5 handwritten) | Critical | High | P0 — Do First |
| R2: Named authorship + voice profiles | High | Medium | P0 |
| R4: Emotional arc requirements | High | Low | P0 |
| R5: Contrarian hook requirement | High | Low | P0 |
| R1: Blog archetypes | Medium | High | P1 |
| R6: Voice requirements in writing laws | Medium | Low | P1 |
| R3: Human voice pass in chain | High | High | P1 |
| R7: Story arcs in outline | Medium | Medium | P2 |
| R8: Reduce chain steps | Medium | Medium | P2 |

**Phase 0: Voice Foundation (Weeks 1-3)**
1. Write 5 voice anchor articles (see detailed briefs above)
2. Extract voice patterns from each author
3. Create author voice profiles

**Phase 1: Prompt Modifications (Week 4)**
1. Inject voice profiles and few-shot examples into prompts
2. Add emotional arc requirements to section-writer prompt
3. Require contrarian hook for thought leadership posts

**Phase 2: Structural Changes (Weeks 5-6)**
1. Create archetype-specific templates
2. Add human review checkpoint after outline
3. Modify writing laws

---

## Voice Anchor Articles: What to Handwrite

Before modifying Compass prompts, the team should handwrite **5 voice anchor articles**. These serve as:
1. **Publishable content** with genuine human voice
2. **Few-shot exemplars** for injection into AI prompts
3. **Voice pattern extraction source** for author profiles

### Why Handwritten Anchors Matter

AI cannot learn voice from templates—it can only mimic patterns from examples. The current Compass system has no examples of what "Omar's voice" or "Robert's voice" actually sounds like. The beliefs database contains *what* they think, not *how* they express it.

**The goal:** Create 5 articles (1,000-1,500 words each) that demonstrate each author's natural voice so distinctively that a reader could identify the author without seeing the byline.

---

### The 5 Voice Anchor Articles

| # | Archetype | Author | Topic | Why This Person |
|---|-----------|--------|-------|-----------------|
| 1 | **Contrarian Essay** | Omar | "Why Deflection Rate Is a Vanity Metric" | Omar has strong opinions on metrics; founder credibility |
| 2 | **Lessons Learned** | Engineering Lead | "What We Got Wrong Building Our First RAG Pipeline" | Technical credibility; vulnerability builds trust |
| 3 | **Technical Deep-Dive** | Engineering | "How We Built Citation-First Architecture (And Why It Matters)" | Shows technical depth; differentiates from competitors |
| 4 | **Story-Driven** | Omar or Customer Success | "The Enterprise That Turned Off Their AI Chatbot—And What We Learned" | Emotional arc; customer-as-hero positioning |
| 5 | **Decision Memo** | Product Lead | "When to Build vs. Buy AI Support: A Framework from 50 Conversations" | Practical value; positions Inkeep as advisor not vendor |

---

### Writing Briefs by Article

#### Article 1: "Why Deflection Rate Is a Vanity Metric"
**Author:** Omar Nasser
**Archetype:** Contrarian Essay
**Word count:** 1,200-1,500 words

**The hook you must open with:**
Start with a specific moment—a conversation, a dashboard screenshot, a customer call—where you realized deflection rate was lying. Make it visceral.

**Structure to follow:**
1. **Hook** (100 words): The moment you realized the industry was measuring the wrong thing
2. **The conventional wisdom** (150 words): Why everyone tracks deflection rate, why it seems logical
3. **Why it's wrong** (300 words): Specific failure modes—hallucinations counted as deflections, frustrated users giving up, etc. Use numbers from real deployments (anonymized).
4. **The better metric** (300 words): Trustworthy resolution rate or equivalent. Define it precisely. Show how it changes decisions.
5. **What this means for buyers** (200 words): How to evaluate AI support vendors differently
6. **The uncomfortable truth** (150 words): Why vendors won't tell you this (it makes their numbers look worse)

**Voice requirements:**
- Use "I" and "we" freely
- Include at least one moment of admitted uncertainty or past mistake
- Name competitors implicitly ("most vendors") not explicitly
- Include one specific number from your actual experience
- End with a strong opinion, not a hedge

**What to consciously avoid:**
- Corporate hedging ("may," "could potentially," "in some cases")
- Generic claims without specifics
- Balanced "both sides" framing—take a position

---

#### Article 2: "What We Got Wrong Building Our First RAG Pipeline"
**Author:** Engineering Lead
**Archetype:** Lessons Learned
**Word count:** 1,200-1,500 words

**The hook you must open with:**
Start with the failure. What broke? When did you realize your approach was wrong? Make the reader feel the pain before the solution.

**Structure to follow:**
1. **The failure** (150 words): What we built, why it seemed right, when we realized it wasn't
2. **Attempt #1** (200 words): The obvious solution we tried first. Why it didn't work.
3. **Attempt #2** (200 words): The clever solution we tried second. Why it also failed.
4. **The insight** (250 words): What we finally understood. The mental model shift.
5. **What worked** (300 words): The actual solution. Be specific—architecture, not hand-waving.
6. **What we'd do differently** (200 words): If starting over today, knowing what we know
7. **Takeaways for readers** (150 words): What this means for someone building similar systems

**Voice requirements:**
- Technical specificity—code patterns, architecture diagrams in prose, actual numbers
- Genuine humility about mistakes (not false modesty)
- Builder-to-builder tone: assume the reader knows what RAG is
- Include at least one "we were embarrassingly wrong about X"

**What to consciously avoid:**
- Rewriting history to make yourselves look smart
- Vague lessons ("test early, iterate often")
- Marketing speak ("best-in-class," "enterprise-grade")

---

#### Article 3: "How We Built Citation-First Architecture (And Why It Matters)"
**Author:** Engineering
**Archetype:** Technical Deep-Dive
**Word count:** 1,200-1,500 words

**The hook you must open with:**
Start with the problem citations solve—a specific hallucination incident, a trust breakdown, a customer escalation. Then: "This is why we made citations non-negotiable."

**Structure to follow:**
1. **The problem** (150 words): Why AI without citations creates organizational risk
2. **The architectural decision** (200 words): What "citation-first" means technically
3. **How it works** (400 words): The actual implementation. Retrieval → verification → presentation. Be specific enough that an engineer could sketch it.
4. **The trade-offs** (200 words): What this architecture costs—latency, complexity, edge cases
5. **Why competitors don't do this** (150 words): The business/technical reasons this isn't standard
6. **Results** (200 words): What changed for customers after implementing this
7. **When this matters most** (150 words): The use cases where citation-first is critical vs. nice-to-have

**Voice requirements:**
- Technical precision—specific latency numbers, architecture patterns, failure modes
- Confident but not arrogant—"we chose this because" not "this is the only way"
- Include one honest limitation or unsolved problem

**What to consciously avoid:**
- Marketing the feature without explaining the engineering
- Hand-waving on technical details
- Claiming it's perfect

---

#### Article 4: "The Enterprise That Turned Off Their AI Chatbot—And What We Learned"
**Author:** Omar or Customer Success Lead
**Archetype:** Story-Driven
**Word count:** 1,000-1,200 words

**The hook you must open with:**
"Six months after launch, [anonymized company] turned off their AI chatbot. Here's the email their VP of Support sent us—and what it taught us about building AI that actually works."

**Structure to follow:**
1. **The setup** (150 words): Who this customer was, why they bought AI support, what they expected
2. **The honeymoon** (100 words): Early wins, initial metrics, internal excitement
3. **The cracks** (200 words): What started going wrong. Escalations, complaints, trust erosion.
4. **The decision** (150 words): Why they turned it off. The email or conversation.
5. **The reflection** (200 words): What we learned. What we changed about our product/approach.
6. **The return** (150 words): How they eventually came back (if they did) or what we'd do differently
7. **What this means for you** (150 words): How to avoid this pattern

**Voice requirements:**
- Story structure—beginning, middle, end, transformation
- Emotional honesty—this was painful, we learned from it
- Customer as hero—their decision to turn it off was right given the circumstances
- Specific details that make it feel real (anonymized but concrete)

**What to consciously avoid:**
- Blaming the customer
- Turning it into a sales pitch for current product
- Generic lessons without the story texture

---

#### Article 5: "When to Build vs. Buy AI Support: A Framework from 50 Conversations"
**Author:** Product Lead or Omar
**Archetype:** Decision Memo
**Word count:** 1,200-1,500 words

**The hook you must open with:**
"We've had this conversation 50 times. Here's the framework we've developed for answering it honestly—even when the honest answer is 'build it yourself.'"

**Structure to follow:**
1. **The question everyone asks** (100 words): Build vs. buy framing
2. **Why the obvious answers are wrong** (200 words): "It depends" isn't helpful. What it actually depends on.
3. **The framework** (400 words): 4-5 decision criteria with clear thresholds. Include a table.
4. **When to build** (200 words): Specific scenarios where building makes sense. Be honest.
5. **When to buy** (200 words): Specific scenarios where buying makes sense.
6. **The hidden costs** (200 words): What people underestimate on both sides
7. **How to decide** (150 words): The actual process—what to evaluate, who to involve

**Voice requirements:**
- Advisor tone—genuinely trying to help reader make the right decision
- Honesty about when NOT to buy from Inkeep
- Specific criteria with numbers ("if you have <X users, build; if >Y, buy")
- Include at least one "most vendors won't tell you this"

**What to consciously avoid:**
- Obvious bias toward "buy" (from Inkeep)
- Vague criteria ("consider your needs")
- Avoiding the hard cases

---

### Voice Pattern Extraction Template

After each article is written, extract these patterns:

```markdown
## Voice Profile: [Author Name]

### Opening Patterns
How do they start articles? First sentences from their writing:
- "[Exact first sentence from Article X]"
- "[Exact first sentence from Article Y]"

### Signature Phrases
Recurring phrases that feel distinctly theirs:
- "[Phrase 1]"
- "[Phrase 2]"
- "[Phrase 3]"

### Opinion Expression
How do they state beliefs?
- Strong: "[Example of strong statement]"
- Hedged: "[Example of appropriate hedging]"

### Technical Specificity
How do they handle technical detail?
- "[Example of technical explanation in their voice]"

### Vulnerability/Honesty
How do they admit uncertainty or mistakes?
- "[Example of admitted mistake or uncertainty]"

### Transition Patterns
How do they move between sections?
- "[Example transition]"

### Closing Patterns
How do they end articles?
- "[Exact closing from Article X]"
```

---

### How to Use Voice Anchors in Prompts

Once articles are written and patterns extracted, inject into Compass prompts:

**In section-writer.system.md:**
```markdown
AUTHOR: {{authorName}}
VOICE PROFILE:
{{authorVoiceProfile}}

VOICE EXAMPLE (from "{{exampleArticleTitle}}"):
"{{150-word excerpt demonstrating this author's voice}}"

Write this section in {{authorName}}'s voice. Match the directness,
specificity, and opinion patterns shown above.
```

**In editorial-polish.system.md:**
```markdown
VOICE CONSISTENCY CHECK:
This article is written by {{authorName}}. Their voice is characterized by:
{{voiceCharacteristics}}

Ensure the final output sounds like it was written by {{authorName}},
not by a generic AI assistant. Preserve their signature phrases and
opinion patterns.
```

---

### Timeline and Ownership

| Week | Deliverable | Owner |
|------|-------------|-------|
| 1 | Article 1 draft (Contrarian Essay) | Omar |
| 1 | Article 2 draft (Lessons Learned) | Engineering Lead |
| 2 | Article 3 draft (Technical Deep-Dive) | Engineering |
| 2 | Article 4 draft (Story-Driven) | Omar / CS Lead |
| 3 | Article 5 draft (Decision Memo) | Product Lead |
| 3 | Voice pattern extraction for all 5 | Content team |
| 4 | Prompt modifications with voice injection | Engineering |
| 4 | Test generation with new prompts | Content team |

**Success criteria:**
- Each article is publishable as-is (genuine value, not just a voice sample)
- Voice patterns are distinct enough to differentiate authors
- AI-generated content using voice anchors reads noticeably more human in blind comparison

---

## Limitations & Open Questions

### What This Research Didn't Cover
- A/B testing of current vs. modified content (would require production data)
- Reader interviews to validate disconnect hypothesis
- Competitor analysis of their content generation approaches
- Quantitative engagement metrics on current Compass output

### Open Questions
1. **How much human involvement is scalable?** The ideal solution involves human checkpoints, but this may not scale for high-volume content.

2. **Can voice profiles work without the actual human?** Injecting Omar's voice through prompts is different than Omar writing. Will readers perceive the difference?

3. **Will breaking structure hurt conversion?** The 12 Laws were derived from "winning" posts. Relaxing them may hurt metrics even if it improves connection.

### Recommended Next Steps
1. **Test with 3 posts:** Generate same topic using current system vs. recommendations. Qualitative review.
2. **Author voice injection:** Implement R2 as a prompt experiment before structural changes.
3. **Reader feedback:** Show both versions to target personas, gather reaction.

---

## References

### Evidence Files
- [evidence/storytelling-frameworks.md](evidence/storytelling-frameworks.md) — SUCCESs, StoryBrand, Story Circle analysis
- [evidence/narrative-principles.md](evidence/narrative-principles.md) — Zinsser, Made to Stick, AI vs human storytelling
- [evidence/b2b-emotional-connection.md](evidence/b2b-emotional-connection.md) — Emotional connection in B2B, customer as hero
- [evidence/technical-blog-benchmarks.md](evidence/technical-blog-benchmarks.md) — Stripe, Lenny's Newsletter patterns
- [evidence/ai-generation-antipatterns.md](evidence/ai-generation-antipatterns.md) — Why AI content feels robotic
- [evidence/compass-current-state.md](evidence/compass-current-state.md) — Compass codebase analysis

### External Sources
- [Made to Stick (Heath Brothers)](https://heathbrothers.com/member-content/made-to-stick-model/)
- [Building a StoryBrand (Donald Miller)](https://storybrand.com)
- [Dan Harmon Story Circle](https://boords.com/blog/storytelling-101-the-dan-harmon-story-circle)
- [Stripe Writing Culture (Slab)](https://slab.com/blog/stripe-writing-culture/)
- [Lenny's Newsletter](https://www.lennysnewsletter.com)
- [Why AI Content Falls Flat (Prose Media)](https://www.prosemedia.com/blog/why-ai-generated-content-falls-flat-without-human-storytelling-to-bring-it-to-life)
- [On Writing Well (Zinsser)](https://www.shortform.com/blog/on-writing-well-book/)
