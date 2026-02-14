# Changelog

## 2026-02-08 — 7-Lens Coherence Audit (with new Lens 7: Inline Source Attribution)

**Update type:** Corrective (no new dimensions)
**Why this pass happened:** User requested 7-lens coherence audit. Previous audit used 6 lenses. This pass adds Lens 7 (inline source attribution) and re-examines all 7 lenses for new or previously missed issues.

### Audit findings resolved (26 fixes across 7 lenses)

| # | Sev | Lens | Issue | Resolution |
|---|-----|------|-------|------------|
| 1 | H | L7 | Exec summary: Warmly 12.8% close rate presented without vendor-bias caveat; Warmly sells signal-based outbound tools | Added `[Warmly](URL) — vendor-published, 500+ leads; Warmly sells signal-based outbound tools` in exec summary and section 16 |
| 2 | H | L7 | Exec summary: Velocify "100x" speed-to-respond is a pre-2015 study with undisclosed methodology, presented as factual | Added `pre-2015 study, widely cited but primary methodology undisclosed; directionally supported by Rep.ai 2024` |
| 3 | M | L7 | Exec summary: "76% optimized" breakup response rate had no source | Added `[Kreuzberger/GrowLeads](URL) — single practitioner, methodology undisclosed` |
| 4 | M | L7 | Exec summary: "Brand familiarity #2 driver (46%)" from SmartReach/ProfitOutreach without URLs or sample size | Added `[SmartReach](URL)/[ProfitOutreach](URL) survey; sample size undisclosed` |
| 5 | M | L7 | Exec summary: "AE reply rates 3.2x higher" from Cognism without URL or vendor-published note | Added `[Cognism](URL) 2026 — single source, vendor-published` |
| 6 | M | L7 | Section 15: finding statement lacked source for "100x" and "40-65% positive" | Added `(Digital Bloom)` and `[Velocify](URL) via Kixie — original study pre-2015` |
| 7 | M | L7 | Section 25: "287% vs single-channel" multi-channel stat had no source attribution | Added `(Expandi, Martal — independently cited figure; no shared primary source identified)` |
| 8 | M | L7 | Section 25: "Multi-channel pre-warming lifts reply rates ~40%" had no source | Added `(composite from Letterdrop, Expandi, Martal — no single study isolates pre-warming specifically)` |
| 9 | M | L7 | Section 25: SmartReach/ProfitOutreach 46% brand familiarity survey had no sample size or vendor context | Added `survey data, sample size undisclosed` and `directional estimate from multiple practitioner sources, no single controlled study` for 15-25% open rate claim |
| 10 | M | L7 | Section 3: MailMonitor "23% higher opens" is a single lesser-known source | Added `[MailMonitor](URL) (single source; directionally supported by Gong/Lavender)` |
| 11 | M | L7 | Section 3: Lavender "83% more replies" for mobile-optimized — vendor with product interest in scoring mobile | Added `[Lavender](URL) (vendor data — Lavender's scoring algorithm includes mobile optimization)` |
| 12 | M | L7 | Section 10: timing data (Salesforge +20%, Lemlist 5-8AM, Zeliq Thursday, GetResponse business hours) all single-source | Added URLs and `(single source)` or `(email marketing platform, not cold-email-specific)` as appropriate |
| 13 | M | L7 | Section 18: EmailToolTester consumer survey (1,869 adults) is B2C not B2B | Added `consumer survey, not B2B-specific; B2B buyer behavior may differ` |
| 14 | M | L7 | Section 19: "burstiness scores 5-10 vs human 20-50" had no inline source | Added `(Wagner, The Augmented Educator)` |
| 15 | M | L7 | Section 19: "AI hallucinates ~15%" had no inline source | Added `[GMass](URL) testing of 5 AI personalization tools` |
| 16 | M | L7 | Section 22: UserGems 2.5x/3x and GrowthList 4x/30% — vendor-published data without vendor-bias notes | Added `[UserGems](URL) (vendor data)`, `[GrowthList](URL) (single source)`, `[Klue](URL) (vendor-published customer story)` |
| 17 | M | L7 | Section 27: Lavender coaching stats (42%/200%/300%) are vendor marketing claims | Added `[Lavender](URL) reports... (vendor-published; Lavender sells the coaching tool, so these are marketing claims)` |
| 18 | M | L7 | Section 30: Cognism AE vs SDR gap 3.2x lacks inline URL | Added `[Cognism](URL) 2026 data` |
| 19 | M | L7 | Section 33: Gartner May 2025 "59% NEGATIVE" lacks URL | Added `[Gartner](URL) (May 2025 — survey of B2B buying groups)` |
| 20 | M | L2 | Section 6: "Challenger insight +40% more deals" is overall sales methodology, not cold-email-specific | Added `(Challenger Sale — overall sales methodology, not cold-email-specific; applied directionally to email copy)` |
| 21 | M | L2 | Section 18: "multi-year structural degradation" stated more certainly than evidence supports | Recalibrated to `consistent with multi-year structural degradation... though no single longitudinal study tracks the full period with consistent methodology` |
| 22 | M | L3 | Section 5: Unbounce 371% is primarily landing page data, not email | Added `primarily landing page data, directionally applicable to email; corroborated by Campaign Monitor and Wordstream` |
| 23 | M | L4 | Section 24: "Few-shot 15-40% improvement" is from general AI/ML research, not email-specific | Added `general AI/ML research — not measured in cold email specifically` |
| 24 | M | L7 | Section 20: C-suite "6.4% — 23% higher" stat has no identifiable source | Added `source unidentified in evidence file; directionally consistent with Sales.co` |
| 25 | L | L5 | Exec summary: "under 75 words" in opening paragraph vs "Under 80 words" in Key Findings | Standardized to "under 80 words" |
| 26 | L | L5 | Exec summary: "67% more replies" attributed to the formatting trifecta, but 67% is specifically about reading level | Clarified: `3rd-5th grade reading level alone produces 67% more replies` |
| 27 | L | L4 | Exec summary: "4-8x" top-to-average gap but data says 8.1x; "4x" lower bound unsupported | Changed to `~8x` |
| 28 | L | L1 | Section 9: guilt-based breakup "generates replies but not meetings" appears to conflict with section 29 "33-76% response" | Clarified distinction: guilt-based breakups fail vs loss-aversion-framed breakups succeed |
| 29 | L | L3 | Section 12: "~8% reply rates" for learning-framing is practitioner-reported, not studied | Added `practitioner-reported... no controlled study` |
| 30 | L | L2 | Section 25: Refine Labs "replicated across 40+" has no replication methodology | Added `methodology for replication not published; Refine Labs sells dark-social-focused demand gen services` |
| 31 | L | L7 | Section 6: Corporate Visions "+50% differentiation" needs URL | Added `[Corporate Visions](URL) / Tim Riesterer (academic-partnered research)` |
| 32 | L | L7 | Section 6: "2x more motivating" jointly attributed to Kahneman and Corporate Visions without distinguishing contributions | Separated: `Kahneman/Tversky (Prospect Theory — foundational psychology); Corporate Visions (applied to B2B messaging)` |
| 33 | L | L7 | Section 7: "43% more likely to progress (B2B purchase study)" — primary source unidentified | Added `cited via Smartlead, primary source unidentified` |
| 34 | L | L7 | Section 10: Mailreach "+15-20%" single source | Added `[Mailreach](URL) — single source; directionally supported by Gmail/Outlook engagement-weighting guidelines` |
| 35 | L | L7 | Section 12: GrowLeads "5-10x more effective" — vague metric | Changed to `5-10x higher reply-to-meeting rate` with methodology note |
| 36 | L | L7 | Section 15: Velocify "391%" and "100x" appear inconsistent side by side | Added note explaining different comparison baselines |
| 37 | L | L7 | Section 24: "Claude consistently rated most natural-sounding" — unsourced claim | Added `(Bao et al. 2025... Search Engine Journal concurs)` |
| 38 | L | L7 | Section 31: Backlinko/Pitchbox social link data needs inline URLs | Added `[Backlinko](URL)/[Pitchbox](URL)` |
| 39 | L | L7 | Exec summary: podcast invitation "38%" missing single-study caveat | Added `(38% — single Lemlist study)` |
| 40 | L | L3 | Section 31: Exec summary "personalized audits (10-15%)" is an estimate, not measured | Added `(10-15% est.)` |

### Summary by lens

| Lens | Findings | H | M | L |
|------|----------|---|---|---|
| L1: Cross-finding contradictions | 1 | 0 | 0 | 1 |
| L2: Confidence-prose misalignment | 3 | 0 | 2 | 1 |
| L3: Missing conditionality | 3 | 0 | 2 | 1 |
| L4: Evidence-synthesis fidelity | 2 | 0 | 1 | 1 |
| L5: Executive summary coherence | 2 | 0 | 0 | 2 |
| L6: Stance consistency | 0 | 0 | 0 | 0 |
| L7: Inline source attribution (NEW) | 29 | 2 | 22 | 5 |
| **Total** | **40** | **2** | **27** | **11** |

### Key patterns observed

1. **Lens 7 dominated this audit** (29 of 40 findings) — as expected since it was not covered in the previous 6-lens audit. The report consistently named sources but rarely provided URLs or vendor-bias context for single-source statistics.
2. **Vendor-published data needs bias flagging.** The report relies heavily on vendor benchmarks (Warmly, Lavender, UserGems, Klue, Cognism, SmartReach, Refine Labs). These are the best available data but readers should know the vendor relationship. Added vendor-bias notes to all single-vendor stats.
3. **Old/undated studies need temporal context.** Velocify (pre-2015) and the "B2B purchase study" for specificity (43%) lack traceable primary sources. Added provenance notes.
4. **The previous 6-lens audit was thorough.** Only 11 non-Lens-7 issues found, most Low severity. The major cross-finding contradictions, confidence misalignments, and conditionality gaps were well-addressed in the prior pass.

---

## 2026-02-08 — Coherence Audit (Formal Protocol)

**Update type:** Corrective (no new dimensions)
**Why this pass happened:** User requested coherence audit following the formal protocol from `references/coherence-audit.md`. Applied all 6 lenses: cross-finding contradictions, confidence-prose misalignment, missing conditionality, evidence-synthesis fidelity, exec summary coherence, stance consistency.

### Formal audit findings resolved (Phase 2, all 9 findings H→M→L)

| # | Sev | Issue | Resolution |
|---|-----|-------|------------|
| 1 | H | 2.76x metric mischaracterized as "pipeline generated" + triple-attributed (Woodpecker, Instantly, Hunter.io) when it's a reply rate ratio from Hunter.io 11M | Corrected all 3 occurrences: now "2.76x on reply rate — campaigns under 50 recipients achieve 5.8% vs 2.1% (Woodpecker, Instantly, Hunter.io 11M)" in exec summary; "(reply rate ratio, not a pipeline multiplier)" in Section 4 correction paragraph |
| 2 | M | Digital Bloom 2.3x timeline hooks stated without single-source caveat in exec summary | Added "(single source, undisclosed sample size; directionally supported by Salesforge and Gong, specific multiplier uncorroborated)" to exec summary; added "(single source; see dim 1 source note)" in Section 6 |
| 3 | L | AI SDR exec bullet has no companion redirect despite 4 dims moved to Ops | Added "(detail in companion Ops Playbook)" with link |
| 4 | L | Exec summary says "Under 75 words" but evidence consensus is 75-80 | Changed to "Under 80 words" + added "(Lavender; 50-75 for C-suite, up to 150 for ICs — see dim 33)" |
| 5 | L | Braun 35% stated as confirmed fact; evidence labels it INFERRED (self-reported) | Added "Claims" and "(self-reported)" in Section 27 and References |
| 6 | L | Holland 90%+ stated without confidence caveat despite being practitioner-reported with no methodology | Added "(practitioner-reported, unverified)" in exec summary and Section 30; added "(practitioner-reported, no sample size or methodology disclosed)" in Section 20 |
| 7 | L | Backlinko +9.8% social links from PR/journalist outreach context, not B2B sales | Added "(PR/journalist outreach context, may not generalize to B2B sales)" in exec summary |
| 8 | L | Sub-500-char image threshold could be misread as applying to first-touch cold emails | Added "(after reply, when images render)" qualifier + "This does NOT apply to first-touch cold emails — see above" |
| 9 | L | 4.7x multi-channel engagement presented as single-study finding; actually composite from multiple vendors | Changed to "up to 4.7x" + added "(composite — no single study; derived from stacking per-channel lifts)" |

## 2026-02-08 — Follow-up email gap closure: threading, timing & re-sequence strategy (dim 29 addendum)
- Identified 3 minor gaps in dim 29 (Follow-Up Email Messaging Strategy) during post-coherence coverage audit
- Added follow-up threading strategy (same-thread emails 2-3, new-thread email 4+, fake "Re:" = net negative, breakup subjects)
- Added follow-up send timing (graduated spacing 2/4/7/14 days, 3-day first follow-up +31%, role-based timing, vary day/time across touches)
- Added re-sequence strategy after breakup (60-90 day minimum, 3-6 months for cold, multi-threading before re-sequence, 2-3 lifetime sequences max, engagement-based approach)
- Key new sources: Zeliq (role-based timing), Mailreach (email frequency best practices), SalesForge (inbox rotation), Bryan Kreuzberger/HubSpot (76% breakup subject)
- Notable negative searches: no platform publishes follow-up-specific subject line A/B data; no platform publishes follow-up-specific send-time data; next-day follow-up "-11%" figure cited across 4+ platforms but original source untraceable; no published benchmark for total lifetime emails per prospect; Berman's Baking Method cadence not publicly available
- Updated evidence/follow-up-messaging-strategy.md with 3 new findings + 4 new data points in summary table

## 2026-02-08 — Coherence review: fixes #10-13 (cross-dimension contradiction resolution, batch 3)
- Fixed final 4 contradictions with additional research (3 parallel subagents):
- **Fix #10: Digital Bloom "timeline hooks 2.3x" cited as definitive from single source** (exec summary, dims 1, 7, 28) — research confirmed Digital Bloom is a small marketing agency (~5 people), NOT a sending platform. No methodology, sample size, or statistical controls disclosed. The four-hook taxonomy (problem, social proof, numbers, timeline) is proprietary — no other platform uses it. The 2.3x multiplier is NOT corroborated by any independent source. However, the directional insight IS supported by Salesforge (trigger-based 32% vs generic 5.1%), Gong (social proof +41%), and Reply.io (specific metrics outperform vague). Added single-source caveats to all 4 locations, changed language from definitive to directional, noted corroborating sources for the underlying concept.
- **Fix #11: Gong data cited as both "85M" and "28M+" emails** (exec summary, dims 3, 18, references) — research confirmed this is the SAME study (Gong x 30MPC x Outbound Squad, 2024-2025) with an internal consistency error in source materials. "85M+" appears on Gong's guide page, 30MPC's PDF report, all newsletters, and LinkedIn posts; "28M+" appears on only one Gong blog post (likely an error or earlier data cut). Identical stats cited under both numbers (8.1x, 344:1, -57%). Standardized all references to "Gong/30MPC (85M+)" with a note in the references section explaining the discrepancy. Also clarified that Gong Labs studies (304K CTA, 132K ROI, 30K personalization) are separate earlier studies, not subsets.
- **Fix #12: "Pitching -57%" but recommended structure includes product references** (dim 3) — research confirmed these are NOT contradictory. Gong explicitly classifies "pitching" and "social proof" as separate constructs using Smart Tracker AI classifiers, measured separately with opposite effects (-57% vs +41%). Pitching = seller-centric capability messaging (features, buzzwords, ROI claims). Social proof = buyer-centric outcome referencing ("We helped Company cut X from Y to Z"). Added explicit clarification box after the effectiveness hierarchy table explaining this distinction and why Problem > Proof > Offer > CTA is coherent with the anti-pitching data.
- **Fix #13: "I noticed" pattern — simultaneously recommended (dim 1) and flagged as AI slop (dim 18)** — editorial consistency fix, no additional research needed. The report already had the right nuance in dim 20 (4-tier personalization spectrum, declared vs inferred data). Added cross-references between dim 1, dim 18, and dim 20 so readers see the full picture. Clarified that "I noticed" + specific recent observation = effective (proves real research), while "I noticed" + generic observation = AI slop (could be sent to 1,000 people unchanged). The prefix itself is not the problem; the specificity of the observation is.

## 2026-02-08 — Coherence review: fixes #6-9 (cross-dimension contradiction resolution, batch 2)
- Fixed 4 additional contradictions with additional research (4 parallel subagents):
- **Fix #6: Personalization math uses inflated rates** (dim 4) — corrected 25%/10% to 17%/7% (Woodpecker 20M+ emails); added critical caveat that replies ≠ pipeline with quality adjustment showing ~2x meetings, not 4x; clarified "2.76x" as Hunter.io reply rate ratio not pipeline multiplier; added when hyper-personalization wins on total output (enterprise ACV $100K+).
- **Fix #7: "AI does not trigger spam filters" vs "96% AI detection"** (exec summary, dim 18) — resolved: Chiopara et al. 96% is academic proof-of-concept, NOT deployed in production filters. Gmail/Outlook/Yahoo use content fingerprinting and bulk pattern detection, not stylometric AI text analysis. Bouchareb & Morad (2024) confirmed AI emails reach inbox with 0% spam when following best practices. Added Barracuda/Columbia June 2025 finding (51% of spam now AI-generated) as trajectory warning. Both claims now coexist with proper context: current state favors "AI does not trigger filters" but academic capability suggests the window may close.
- **Fix #8: "40% deals lost to no-decision" vs "56% from indecision" — nested stats presented as parallel** (exec summary, dims 13, 22, 34) — corrected attribution from "SBI Growth" to "Dixon/JOLT Effect (2.5M+ conversations)"; clarified range is 40-60%, not a single figure; explicitly stated 56%/44% are nested within the no-decision pool, not separate populations; Gartner/Hank Barnes independently corroborates "almost 40%". Propagated consistent language across all 6 occurrences.
- **Fix #9: "No images in first touch" vs "one image = +20% reply rate"** (dims 3, 31) — resolved by distinguishing first-touch from follow-up emails. Reply.io (2M+ emails, no product bias) shows images lower reply rates by 12.7% on cold outreach. Lemlist's "+20%" does NOT distinguish first-touch from follow-ups and Lemlist has product incentive bias (sells image personalization). Gmail 2024-2025 blocks images from unknown senders. Luru: 2.3x higher bounce rates with images. Practitioner consensus across 6+ platforms: plain text for first touch. Restructured dim 31 image section as "first-touch vs follow-up" with source quality notes.

## 2026-02-08 — Coherence review: fixes #1-5 (cross-dimension contradiction resolution)
- Identified 13 coherence tensions across the 34-dimension report via full-report review
- Fixed top 5 highest-impact contradictions with additional research (4 parallel subagents):
- **Fix #1: "Hope all is well" contradiction** (dims 11/29) — resolved: +24% meetings when personalized to a specific event, -5% when generic filler (Gong 304K). Propagated conditional nuance to exec summary, dim 11 table, and dim 29 touch-by-touch table.
- **Fix #2: Email length reconciliation** (dim 3) — added reconciliation table explaining why sources cite 54/75/80/100/120/150 words: different metrics (reply rate vs interest rate vs booking rate), different email types (first-touch vs follow-ups vs blended), different populations. Rule: first-touch cold email = under 75-80 words; follow-ups = longer (4+ sentences); Lemlist 120 words blends all emails; Reply.io 54 words measures "interest rate" not total reply rate.
- **Fix #3: Numbers in subject lines conflict** (dim 1) — resolved: the +113% stat (Smartlead citing YesWare 115M mixed emails, ~2016) is not cold-email-specific; YesWare cold-only study showed only +45%; Belkins 2024 (5.5M cold B2B) = essentially neutral (27% vs 28%); Lavender -46% lacks methodology but direction supported. Added full reconciliation note, fixed source attribution, refined "what to avoid" from "numbers" to "metrics/percentages/ROI claims."
- **Fix #4: Social links vs zero links tension** (dims 31/32) — clarified: signature links ARE counted by spam filters as links (Smartlead, Allegrow); Backlinko 12M study is outreach/PR emails not cold sales; +9.8% reply benefit and deliverability cost both exist simultaneously. Resolution: one untracked LinkedIn URL in plain-text signature is the consensus acceptable exception within 1-2 total link budget.
- **Fix #5: Trap CTAs vs no-oriented questions** (dims 13/21) — added 4-axis distinction table (context, referent, autonomy, transparency) explaining why these look structurally similar but produce opposite results. Added Voss's own statement that cold-opener use of his technique = manipulation. Cited psychological reactance theory (Brehm 1966). Cross-referenced between dim 13 and dim 21.

## 2026-02-08 — Multi-threading persona messaging & objection preemption (run: 2026-02-07-threading-objections, W28/W29)
- Added dimensions 33 (Multi-Threading Persona Messaging) and 34 (Objection Preemption in Email Copy) with 2 new evidence files
- New evidence: multi-threading-persona-messaging.md (25 findings, ~280 lines), objection-preemption-email-copy.md (25 findings, ~240 lines)
- Key new sources: Sales.co (1M emails, 445K C-level — 3.2x quality gap), Gong (1.8M deals — won deals 2x contacts), Outreach (cross-department threading +56% win rates), 6sense 2025 (buying committees = 11 average), Gartner May 2025 (individual-tailored content = 59% NEGATIVE consensus impact), UserGems (previous champions 3x close), CEB/Consensus (51% won't champion internally), Fluint (forwardable emails), Yess.ai (Golden Path, Which-Means Chain), Banas & Rains 2010 (inoculation theory meta-analysis d = 0.43-0.45), O'Keefe 1999/2002 (refutational > one-sided > non-refutational), Cialdini Pre-Suasion 2016 (pre-request framing 29%→77.3%), Tony Hughes (objection naming risk), Sandler Training (permission-based selling), Corporate Visions (unconsidered needs +10%/-16%), JOLT Effect (56% indecision vs 44% status quo)
- Notable new findings for dim 33: Cross-department threading +56% win rate (Outreach); same template to 10+ contacts = 51% reply decline (Belkins); Gartner 59% NEGATIVE consensus from individually-tailored incoherent content; Which-Means Chain translates user pain → manager consequence → executive impact; forwardable emails > direct outreach (51% of willing buyers won't champion); word-count ladder C-suite 50-75 → IC 125-150; begin threading before first meeting; one persona per campaign; three-layer sender architecture (AE/SE/VP)
- Notable new findings for dim 34: Inoculation theory preemptive refutation d = 0.43-0.45 (medium effect); naming objection without refuting = WORSE than not mentioning it (O'Keefe); Gong risk-reversal +32% win rate but reverses at 4+ mentions; 56% of losses are indecision not status quo (JOLT); pre-suasion framing is stronger than in-email preemption (Cialdini); "Most people think X, but Y" = email inoculation formula; sequence-mapped preemption (implicit Email 1, explicit Email 3+); no published A/B test isolating in-email preemption exists (significant research gap)
- Report now covers 34 dimensions (30 active + 4 moved to ops) across 30 evidence files with 90+ named practitioners/researchers

## 2026-02-07 — Report split: AE Copywriting Playbook + GTM Ops Playbook
- Split report into two audience-specific playbooks:
  - **AE Report** (`b2b-outbound-email-effectiveness/`): Copywriting, messaging, psychology, sequences, writing quality — 28 active dimensions for account executives and sales teams
  - **Ops Report** (`b2b-cold-email-deliverability-ops/`): Infrastructure, deliverability, platform selection, link configuration, unit economics, spam filter mechanics — for GTM/sales ops professionals
- Moved dimensions 17 (AI-Native Stack), 23 (Unit Economics), 26 (Platform Insights), 32 (Link Configuration & Deliverability) to Ops Playbook
- Replaced moved dimension sections with cross-references to companion report
- Retained AE-relevant insights from moved dims in remaining dimensions (email length/reading level in dim 3, Day One shortlist in dim 25, rep gap in dim 27, link awareness in dim 30/31)
- Added companion report link to both reports
- Cleaned up executive summary: removed ops-only bullets (CPL/CAC, fully loaded costs, PLG distribution, free tools), kept AE-actionable insights (Day One shortlist, AI ≠ spam trigger, 4-8x rep gap)
- Updated evidence file references with "Moved to Ops Playbook" annotations
- Updated Out of Scope section with cross-references
- Evidence files remain in both report directories (copied, not moved) for independence
- 10 evidence files in ops report: ai-native-stack, cold-email-unit-economics, vendor-insights-new-age, vendor-insights-mature, link-configuration-deliverability, signatures-footers-images-calendar, reply-conversion-warm-outbound, quantified-failure-modes, ai-slop-detection-tells, recipient-psychology-rejection-brand-damage

## 2026-02-07 — Deep dive: subdomain matching, link cloaking, redirect-free tracking (dim 32 addendum)
- Added 3 new findings (26-28) to evidence/link-configuration-deliverability.md
- Finding 26: Sibling subdomains treated identically to sender domain for link reputation — SURBL normalizes to root two-level domain, Spamhaus DBL lists at root level, Barracuda uses wildcard matching, all platforms recommend sibling subdomains. DMARC alignment explicitly does NOT apply to links. No authoritative source distinguishes sibling subdomains. Gap: no single source explicitly states equivalence (strong inference from all underlying mechanisms).
- Finding 27: Link cloaking (dub.co) is iframe-based, not reverse proxy — verified from source code (github.com/dubinc/dub). Returns 200 OK + iframe, no redirect for scanners. Not marketed as email deliverability feature. Sophisticated scanners may extract iframe src.
- Finding 28: Redirect-free tracking ranked — (1) Direct link + UTM + server-side logging = best deliverability, (2) Custom subdomain 301 = very good, (3) Iframe cloaking = good, (4) Reverse proxy = good but complex. The "zero links" literature gap: data conflates all link types; no study isolates clean direct links vs zero links.
- Updated REPORT.md dim 32 with subdomain evidence, "zero links" literature gap, redirect-free tracking hierarchy, cloaking mechanics, scanner behavior matrix

## 2026-02-07 — Email signatures, footers, images & link configuration deliverability (run: 2026-02-07-signatures-links, W26/W27)
- Added dimensions 31 (Email Signatures, Footers, Images & Calendar Links) and 32 (Link Configuration & Deliverability in Cold Email) with 2 new evidence files
- New evidence: signatures-footers-images-calendar.md (335 lines, 20 findings), link-configuration-deliverability.md (561 lines, 25 findings)
- Key new sources: Backlinko/Pitchbox (12M outreach emails — social link impact +9.8%), Lemlist (millions analyzed — image deliverability), Smartlead (image-to-text 500-char threshold, custom tracking domain warmup), Luru (10K+ emails — image type impact), Mailforge (tracking pixel 15% spam risk, -10-15% reply correlation), GMass (signature deliverability), Maildoso/Nikita Bykadarov (500K+/month), Sparkle.io, MailReach (unsubscribe deliverability, custom tracking domains), SmartReach (2.3M+ emails — inbox placement by link count), Spamhaus (DBL, bit.ly blacklist 2014), Barracuda/Cisco Talos (URL reputation), Google Safe Browsing/RETVec/Click-time Protection, Microsoft Defender/Outlook LLM (Nov 2024), Folderly/GlockApps (Gmail AI spam filter), UTM.io, Klenty/Woodpecker (click tracking analysis)
- Notable new findings: Two-phase signature strategy = strongest consensus (minimal plain text first touch → full after reply); calendar links first email = -44% reply rate (Gong 304K); social links +9.8% reply (Backlinko 12M, LinkedIn +11.5%); tracking pixels = 15% higher spam + unreliable (Apple 59% blocks); legal disclaimers not required/not enforceable — remove entirely; images safe at standard volume but TYPE matters (product > marketing, GIFs hurt); physical address legally required ($43,280 penalty); inbox placement 89% at 1-2 links → 34% at 7+ (SmartReach 2.3M+); optimal first email = zero links; open tracking = net-negative (15% spam + -10-15% reply); click tracking = phishing signal (redirect pattern); URL shorteners effectively blacklisted (Spamhaus 2014); custom tracking domain mandatory if tracking (subdomain of sending domain); UTMs safer than click tracking (no redirect); link-to-text ratio proves optimal 80-word email can't safely include any link; Gmail multi-layer evaluation (Safe Browsing + RETVec + click-time); Outlook stricter on anchor text mismatch; subdomain matching for links OK (hi.inkeep.com → links.inkeep.com safe); HTTP specifically filtered by Gmail
- Report now covers 32 dimensions across 28 evidence files with 90+ named practitioners/researchers

## 2026-02-07 — Follow-up messaging strategy & content marketing CTAs (run: 2026-02-07-followups-ctas, W24/W25)
- Added dimensions 29 (Follow-Up Email Messaging Strategy) and 30 (Content Marketing CTAs in Cold Outbound) with 2 new evidence files
- New evidence: follow-up-messaging-strategy.md (470 lines, 20 findings), content-marketing-ctas-cold-outbound.md (686 lines, 25 findings)
- Key new sources: Gong 304K (follow-up length + language impact), Belkins 2025 (reply rate by position), Instantly 2026 (step decay), Salesloft 200M+ (multi-channel cadence), Vidyard 940K+ (video benchmarks), Loom/Intercom/Chili Piper (video reply data), Storylane/Navattic (interactive demo data), Lemlist (podcast 38% reply), Demand Gen Report 2024 (content preferences), Cognism 2026 (AE vs SDR gap), 8 named practitioner frameworks (Tatulea, Nelson, Braun, Coleman, Barrows, Berman, Dorsey, Biberston), Becc Holland 6 Buckets (90%+ self-authored), Sam McKenna SMYKM ($200K pipeline), Justin Michael Method ($1B+), Lavender CTC framework, Howdygo (interactive demo analysis)
- Notable new findings: Email 2 = +49% reply lift (highest-leverage follow-up); 4+ sentence follow-ups = 15x more meetings (Gong); "I never heard back" DECREASES meetings by 14% while "Hope all is well" INCREASES by 24%; optimal progression Pain > Proof > Bump > Re-Angle > Value-Add > Objection > Breakup; breakup emails 33-76% response (loss aversion); CTA escalation micro-commitment → withdrawal (Cialdini); multi-channel +287% engagement (Martal); video follow-ups 3x reply (days 2-20 optimal); informal Step 2 +30% vs formal; 4th follow-up = 3x unsubscribe spike (worsening YoY); referencing prospect's self-authored content = 90%+ executive response (Holland); content format hierarchy: podcast 38% > video 12-19% > interactive demo 2.5x > audit 10-15% > whitepaper <3%; links hurt deliverability → reply-gate content; AE 3.2x higher reply than SDR (authority content effect); gated content fails in cold context → ungated or reply-gated wins; micro-content principle (60-sec video > 30-page guide); "I made this for you" outperforms "I made this for everyone" by 5-15x
- Report now covers 30 dimensions across 26 evidence files with 90+ named practitioners/researchers

## 2026-02-07 — Top performer outliers & vertical comparison (run: 2026-02-07-outliers-verticals, W22/W23)
- Added dimensions 27 (What the Top 1% Actually Do Differently) and 28 (SaaS-to-SaaS vs SaaS-to-Traditional Industry) with 2 new evidence files
- New evidence: top-performers-outlier-behaviors.md, saas-to-saas-vs-traditional-industry.md
- Key new sources: Gong (28M+ emails, 300M+ calls — top performer behavioral data), Lavender (20K+ users coaching data), Outreach/Segment (92% lift case study), Salesloft 2025 Skills Gap Survey, CallCloud (80/20 process-skill ratio), Soma Metrics, 6 named practitioners (Allred, Coleman, Nelson, Murray, Braun, Penner), Digital Bloom (hook x ICP x industry benchmarks), Belkins/Expandi (20M+ LinkedIn outreach by industry), Mailpool, RemoteReps247, Focus Digital (sales cycle by industry), BuiltForB2B (10,000 campaigns), SaaS Capital (ACV), FINRA/HIPAA regulatory context
- Notable new findings: 8.1x meeting gap explained by compounding advantage model (7 factors multiply to 8-10x); gap is ~80% process / 20% talent (closable); Segment reduced 5,000 messages to 3-4 per persona → 92% more qualified opportunities; SaaS-to-SaaS (7.42%) and SaaS-to-Healthcare (7.49%) reply rates are nearly identical; LinkedIn INVERTS the dynamic (Healthcare 9.25% vs SaaS 4.77% — 2x); hook type matters 2.3x more than industry vertical; timeline hooks best everywhere; healthcare buyers best reached outside business hours; sales cycles differ 90d (software) to 155d (pharma) to 6-24 months (government); ICP precision matters more than vertical (2%→11% from narrowing alone); no vendor publishes vertical-specific benchmarks despite having data
- Report now covers 28 dimensions across 24 evidence files with 80+ named practitioners/researchers

## 2026-02-07 — Vendor platform insights: what outbound platforms actually know (run: 2026-02-07-vendor-insights, W20/W21)
- Added dimension 26 (What the Outbound Platforms Actually Know) with 2 new evidence files
- New evidence: vendor-insights-new-age.md (Clay, UnifyGTM, Apollo, Instantly, Lavender, Smartlead, Reply.io, Common Room, Warmly, Lemlist), vendor-insights-mature.md (Outreach, Salesloft, Gong, ZoomInfo, 6sense, HubSpot, Clari, Vidyard, Drift/Qualified)
- Key new sources: Instantly 2026 Benchmark (billions of emails), 6sense 2025 Buyer Experience Report (4,000+ buyers), Outreach 2025 (930K sequences, 29M prospects), Gong (28M+ emails, 300M+ calls, 304K CTA study), Salesloft/Clari (100+ sellers, 400 enterprise leaders), HubSpot (1,000 sales pros), Smartlead (14.3B sends), Reply.io (50M emails), Clay ($1M→$100M ARR), Lavender (28.3M emails), Apollo (275M contacts), Common Room, Warmly, ZoomInfo, Vidyard, Cognism
- Notable new findings: 95% of buyers purchase from Day One shortlist (up from 85%, 6sense); AI does NOT trigger spam filters — repetition does (Instantly); email length compressed to 25-80 words (4-vendor consensus); reading level 3rd-5th grade = 67% more replies (Lavender 28.3M); top reps 8.1x more meetings (Gong 28M+); pitching -57% reply rate (Gong); waterfall enrichment 30%→80% (Clay); product-led growth creates outbound distribution (Clay $1M→$100M ARR); free tools #1 lead gen mechanism (HubSpot 40%); community deals close 70% faster (Common Room 72% vs 42%); first email generates 58% of replies (Instantly); 87% of enterprises missed targets despite AI (Clari); social outranks email 42% vs 26% (HubSpot); cold calling doubles email reply rate even without connection (Gong 300M calls); 100:1 email-to-demo funnel (Smartlead 14.3B)
- Report now covers 26 dimensions across 22 evidence files with 80+ named practitioners/researchers

## 2026-02-07 — Prompt engineering & brand halo effect (run: 2026-02-07-halo-prompts, W18/W19)
- Added dimensions 24 (Prompt Engineering for Cold Email) and 25 (The Brand Halo Effect: What Makes Cold Email Not-Cold) with 2 new evidence files
- New evidence: prompt-engineering-cold-email.md, brand-halo-effect.md
- Key new sources: Chris Silvestri/Every.to (context engineering), Instantly.ai (prompt templates + safe patterns), Regie.ai (system/user prompt architecture), Lavender.ai (scoring: raw AI = 79/100 C+), Nick Garnett (anti-slop eliminated 90%), Letterdrop (92 teams, +15% from LinkedIn), Adam Robinson/RB2B ($0→$5M ARR, 11% email conversion), Refine Labs (85% dark social, 620 conversions), Fame.so (podcast 3x, 40% faster pipeline), Sociabble/GaggleAMP (8x engagement, 7x conversion)
- Notable new findings: 6-component prompt architecture is practitioner consensus; context engineering > prompt engineering; voice cloning via 5-10 writing samples; Claude preferred for natural copy, GPT for research; constraint-based prompting (word limits + forbidden words) highest-ROI additions; few-shot 15-40% improvement; 3 volume tiers (10-50/100-500/500+) need different prompt sophistication; brand familiarity #2 engagement driver (46%); founder-led LinkedIn → 11% cold email conversion (26x); 85% of B2B conversions from dark social; mere exposure 5-7 exposures; employee advocacy 8x/7x; podcast 3x conversion + 40% faster pipeline; multi-channel pre-warming +40%; brand recognition is binary gate for executives
- Report now covers 25 dimensions across 20 evidence files with 70+ named practitioners/researchers

## 2026-02-07 — AI writing tells, personalization line & offer design (run: 2026-02-07-deep-dive, W14/W15/W16)
- Added dimensions 19 (AI Writing Tells: Sentence-Level Patterns & De-AI Editing), 20 (The Personalization Line: Where Helpful Becomes Creepy), 21 (The Offer: What Makes Someone Actually Want to Respond) with 3 new evidence files
- New evidence: ai-sentence-level-tells-de-ai-editing.md, personalization-line-helpful-vs-creepy.md, offer-design-value-exchange.md
- Key new sources: Bao et al. 2025 (aidiolects, 99.88% precision), Saha et al. 2025 (APT-Eval, 14.7K samples), Kim/Barasz/John 2018 HBS (declared vs inferred), Gartner 2025 (1,464 buyers — 53% personalization hurt, 3.2x regret), XM Institute/Qualtrics (23K consumers), Cisco Privacy Benchmark (2,600+ professionals), Sales.co (1M emails), Hormozi ($100M Offers), Cerebral Selling, MyWebAudit, Intercom/Loom, CNIL (Orange EUR 50M fine)
- Notable new findings: 5 sentence-level structural tells independent of vocabulary; model-specific aidiolects classifiable at 99.88% precision; median voice problem (75% of marketers erasing uniqueness); declared vs inferred data is the primary personalization mechanism (not volume); 4-tier personalization spectrum from universally helpful to universally creepy; compelling offers +28% reply rate; offer-to-awareness alignment > copy quality; C-suite 3x more positive (16.76% vs 5.20%); Hormozi Value Equation explains why embedded data beats meeting requests; 50% reply ceiling only achievable with non-commercial offers to <50 prospects
- Report now covers 23 dimensions across 18 evidence files with 70+ named practitioners/researchers

## 2026-02-07 — Competitive displacement & unit economics (run: 2026-02-07-deep-dive, W17)
- Added dimensions 22 (Competitive Displacement) and 23 (Cold Email Unit Economics) with 2 new evidence files
- New evidence: competitive-displacement.md, cold-email-unit-economics.md
- Key new sources: Matt Dixon/JOLT Effect (2.5M+ conversations), Anthony Iannarino (Eat Their Lunch), First Page Sage (CAC by Channel 2026, ~120 firms), GenerateMore.ai (pipeline source breakdown), Phoenix Strategy Group (CAC 2025), Sopro (CPL benchmarks), MarketOwl (campaign economics), Luminik (event CPO), The Bridge Group (SDR attrition), Klue (win rate case study), LeadGenius, Madison Logic, B2B International, Devon Hennig
- Notable new findings: 56% of no-decision losses from indecision not status quo (JOLT); unconsidered needs 10%+ persuasion lift in acquisition but backfires in renewal; trigger events 4x conversion with 24-48hr window; competitor customer targeting 2.5x/3x with name-drop; cold email highest CAC ($1,980) vs referrals lowest ($150) — 13x gap; outbound = 42% of pipeline but 3rd in revenue contribution; partner referrals = 10% pipeline / 31% revenue; fully loaded cost per meeting ~$900 (not $110); SDR attrition 39%, $100K+ replacement cost; AI net effect on cold email economics approximately flat; cold email only viable above ~$50K ACV
- Report now covers 20 dimensions across 15 evidence files with 60+ named practitioners/researchers

## 2026-02-07 — Failure modes & AI slop deep dive (run: 2026-02-06-failure-modes)
- Added dimension 18 (AI Slop, Failure Modes & What Recipients Instantly Reject) with 3 new evidence files
- New evidence: ai-slop-detection-tells.md, quantified-failure-modes.md, recipient-psychology-rejection-brand-damage.md
- Key new sources: Gartner (632 buyers), Forrester (11,352 buyers), Belkins (16.5M emails), Liang et al. (2024 — AI vocabulary), Cardon & Coman (2025 — sincerity perception), Petrova et al. (2025 — creepiness), Balducci & Kim (2025 — reactance), Chiopara et al. (2025 — stylometric detection), Hunter.io (217 decision-makers), CB Insights/Anand Sanwal, Jon Miller
- Notable new findings: reply rates down 40% since 2019 (8.5%→5%); 73% of buyers avoid irrelevant senders; 92% start with vendor in mind; AI vocabulary fingerprint ("delves" 25.2x); sincerity drops 83%→40% with heavy AI; 4th follow-up = 55% reply drop + 20x unsubscribe spike; over-personalization triggers measurable creepiness response; 96% stylometric AI detection accuracy; Gmail Gemini AI Inbox creates AI-vs-AI filtering
- Report now covers 18 dimensions across 13 evidence files with 50+ named practitioners/researchers

## 2026-02-07 — Additive expansion (run: 2026-02-06-additive)
- Added 6 new dimensions (12-17) across 5 new evidence files
- New dimensions: Founder-Led Outbound, Reader Psychology & Contrarian Angles, Real Email Teardowns, Reply-to-Meeting Conversion, Warm/Signal-Based Outbound, AI-Native Stack
- Key new sources: Warmly Research (500+ leads), SaaStr AI SDR ($1M+/90 days), Clay ($3.1B), Bessemer VP, UserGems, Chris Voss, Kahneman/Tversky, Von Restorff, 7 named practitioner frameworks
- Notable new findings: warm outbound 12.8% vs 5% cold close rate; 5-min reply speed = 100x conversion; 40% deals lost to no-decision; AI SDRs need "massive human oversight"; deliverability crisis (inbox placement 49.98% → 27.63%)
- Report now covers 17 dimensions across 10 evidence files with 40+ named practitioners

## 2026-02-06 — Initial research (run: 2026-02-06-initial)
- Created report with 11 dimensions across 5 evidence files
- Sources: 85M+ emails (Gong/30MPC), 200M+ (Lavender), 34M (Hunter.io), 20M (Woodpecker), 5.5M (Belkins), 304K CTA study (Gong Labs), 20+ named practitioners
- All P0 dimensions covered with CONFIRMED evidence
- Key unresolved conflict: subject line casing (Lavender vs Gong/30MPC)
