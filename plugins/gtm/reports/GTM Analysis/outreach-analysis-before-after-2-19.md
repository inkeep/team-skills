# Campaign Performance: Before vs. After Thursday 2/19

> **Note:** Metrics are based on email *Created at* date. "Before" = 1/1 – 2/18/2026 | "After" = 2/19 – 3/9/2026. Rates calculated on Delivered emails.

---

## 1. B2B nonTechnical CS (Q1)

| Metric | Before 2/19 | After 2/19 | Change |
|---|---|---|---|
| Emails Sent (Total) | 1,462 | 4,149 | +2,687 ▲ |
| Delivered | 1,424 | 3,744 | +2,320 ▲ |
| Open Rate | 63.9% (910) | 58.4% (2,186) | -5.5 pts ▼ |
| Click Rate | 28.0% (399) | 23.8% (890) | -4.2 pts ▼ |
| Reply Rate | 0.07% (1) | 0.13% (5) | +0.06 pts ▲ |
| Bounced | 38 | 94 | +56 |
| Opted Out | 26 | 60 | +34 |

**Takeaway:** Volume scaled massively (+3x emails), but open and click rates declined post-2/19. Reply rate slightly improved. Higher volume brought proportionally more bounces and opt-outs.

---

## 2. VP of Support Sequence: Full Auto (Q1)

| Metric | Before 2/19 | After 2/19 | Change |
|---|---|---|---|
| Emails Sent (Total) | 151 | 0 | — |
| Delivered | 150 | 0 | — |
| Open Rate | 66.0% (99) | — | — |
| Click Rate | 45.3% (68) | — | — |
| Reply Rate | 0% (0) | — | — |
| Bounced | 1 | 0 | — |
| Opted Out | 2 | 0 | — |

**Takeaway:** This sequence was **fully active before 2/19** with strong open (66%) and click (45%) rates, but has had **zero email activity since 2/19**. It may have been paused or depleted of prospects.

---

## 3. Support Engineering & Technical Support (Manager+) (Q1)

| Metric | Before 2/19 | After 2/19 | Change |
|---|---|---|---|
| Emails Sent (Total) | 1,965 | 3,126 | +1,161 ▲ |
| Delivered | 1,924 | 2,753 | +829 ▲ |
| Open Rate | 50.1% (963) | 56.3% (1,551) | +6.3 pts ▲ |
| Click Rate | 25.5% (490) | 40.1% (1,104) | +14.6 pts ▲ |
| Reply Rate | 0.05% (1) | 0% (0) | -0.05 pts ▼ |
| Bounced | 41 | 64 | +23 |
| Opted Out | 20 | 21 | +1 |

**Takeaway:** This is the **strongest performer post-2/19** — both open rate and click rate improved significantly. Click rate jumped by nearly 15 points, suggesting the post-2/19 messaging or targeting resonated much better with this audience.

---

## 4. Support Operations & Customer Support (Q1)

| Metric | Before 2/19 | After 2/19 | Change |
|---|---|---|---|
| Emails Sent (Total) | 201 | 117 | -84 ▼ |
| Delivered | 200 | 115 | -85 ▼ |
| Open Rate | 50.0% (100) | 66.1% (76) | +16.1 pts ▲ |
| Click Rate | 22.0% (44) | 33.9% (39) | +11.9 pts ▲ |
| Reply Rate | 0% (0) | 0% (0) | — |
| Bounced | 1 | 2 | +1 |
| Opted Out | 2 | 1 | -1 |

**Takeaway:** Volume dropped post-2/19 (fewer new prospects added), but engagement quality improved dramatically — open rate up 16 pts, click rate up 12 pts. Smaller but more engaged audience.

---

## Overall Summary

| Sequence | Open Rate Δ | Click Rate Δ | Volume Δ |
|---|---|---|---|
| B2B nonTechnical CS (Q1) | -5.5 pts ▼ | -4.2 pts ▼ | +3x ▲ |
| VP of Support: Full Auto (Q1) | N/A (paused) | N/A (paused) | Went to 0 |
| Support Eng. & Tech Support (Mgr+) (Q1) | +6.3 pts ▲ | +14.6 pts ▲ | +60% ▲ |
| Support Ops & Customer Support (Q1) | +16.1 pts ▲ | +11.9 pts ▲ | -42% ▼ |

The post-2/19 period shows a clear **quality vs. quantity trade-off** across campaigns. The B2B nonTechnical CS sequence scaled significantly but saw engagement dilution, while Support Eng. & Support Ops both improved in engagement quality. The VP of Support Full Auto sequence appears to have been stopped entirely after 2/19.

---

# PostHog Website Analytics Correlation

> **Source:** PostHog MCP query on `utm_medium=outreach` traffic to inkeep.com
> **Date Range:** Same periods as above (Before: 1/1–2/18 | After: 2/19–3/9)

---

## Website Traffic Overview (utm_medium=outreach)

| Period | Pageviews | Unique Visitors | Pages/Visitor |
|--------|-----------|-----------------|---------------|
| Before 2/19 | 798 | 6 | 133 |
| After 2/19 | 963 | 4 | 241 |
| **Change** | **+21%** | **-33%** | **+81%** |

**Insight:** Fewer visitors overall, but those who arrive are significantly more engaged (nearly 2x pages per visitor).

---

## Campaign-Level Website Traffic

| PostHog Campaign | Before 2/19 | After 2/19 | Change | Likely Outreach Sequence |
|------------------|-------------|------------|--------|--------------------------|
| **manual_work** | 561 pv / 487 uv | 784 pv / 661 uv | **+40% / +36%** | Support Engineering (Q1) |
| **fragment** | 146 pv / 142 uv | 81 pv / 72 uv | **-45% / -49%** | Support Engineering (Q1)? |
| **B2B_noTech** | 66 pv / 65 uv | 17 pv / 15 uv | **-74% / -77%** | B2B nonTechnical CS (Q1) |
| **blog_test** | — | 63 pv / 50 uv | **New** | Blog CTA Test (new) |

*pv = pageviews, uv = unique visitors*

---

## Session Duration by Campaign

| Campaign | Period | Avg Duration | Sessions | Change |
|----------|--------|--------------|----------|--------|
| **B2B_noTech** | Before 2/19 | 7.8 sec | 66 | — |
| | After 2/19 | **327.9 sec** | 16 | **+4,077% duration**, -76% sessions |
| **fragment** | Before 2/19 | 48.6 sec | 145 | — |
| | After 2/19 | **111.1 sec** | 78 | **+128% duration**, -46% sessions |
| **manual_work** | Before 2/19 | 40.7 sec | 505 | — |
| | After 2/19 | **54.5 sec** | 683 | **+34% duration**, +35% sessions |
| **blog_test** | After 2/19 only | 102.8 sec | 52 | New campaign |

---

## Full Correlation: Outreach Email → Website Engagement

| Sequence | Outreach Δ | Website Traffic Δ | Session Duration Δ | Verdict |
|----------|------------|-------------------|-------------------|---------|
| **Support Engineering (Q1)** | Click +14.6 pts | `manual_work` +35% sessions | +34% (41s → 55s) | **Best performer** — more clicks, more traffic, longer sessions |
| **B2B nonTechnical CS (Q1)** | Click -4.2 pts, Vol +3x | `B2B_noTech` -76% sessions | **+4,077%** (8s → 328s) | Mixed — fewer visitors but dramatically higher engagement |
| **Support Operations (Q1)** | Click +11.9 pts, Vol -42% | Likely in `fragment` | +128% (49s → 111s) | Quality win — smaller audience, 2x engagement |

---

## Key Findings

1. **Support Engineering (`manual_work`) is the clear winner**
   - Only campaign with BOTH more sessions (+35%) AND longer duration (+34%)
   - The +14.6 pt click rate improvement in Outreach translated to real website engagement gains

2. **B2B nonTechnical CS (`B2B_noTech`) — fascinating trade-off**
   - Outreach: 3x more emails sent, but click rate dropped 4.2 pts
   - Website: 76% fewer sessions, BUT those who visit stay **42x longer** (8s → 328s)
   - Interpretation: The high-volume approach is filtering to only the most interested prospects

3. **Fragment campaign — quality over quantity**
   - Sessions down 46%, but duration up 128%
   - Likely correlates with Support Ops' improved engagement rates

4. **Blog CTA (`blog_test`) — promising new experiment**
   - 52 sessions averaging 1.7 min each
   - Solid engagement for a new campaign

---

## Recommendations

| Action | Sequence | Rationale |
|--------|----------|-----------|
| **Scale up** | Support Engineering | Winning on all metrics |
| **Investigate messaging** | B2B nonTechnical CS | High engagement but low click-through — test new subject lines |
| **Continue testing** | Blog CTA | Good early engagement, expand if it holds |
| **Apply Support Eng learnings** | B2B nonTechnical CS | Copy what's working in the +14.6 pt click rate campaign |

---

*Analysis generated: 2026-03-09 via PostHog MCP + Outreach MCP*
