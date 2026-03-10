# LinkedIn Ad Creative Performance Comparison

**Report Date:** March 10, 2026
**Analysis Period:** December 11, 2025 – March 10, 2026
**Account:** Inkeep

---

## Executive Summary

This report compares the performance of two LinkedIn ad creative types: **Video** and **PDF/Carousel**. The video creative significantly outperforms PDF/Carousel across nearly all key metrics, delivering 9x better cost-per-lead efficiency and 4.4x greater reach for 27% less spend.

**Recommendation:** Reallocate budget from PDF/Carousel to video campaigns.

---

## Campaign Overview

| Campaign | Type | Status | Daily Budget | Total Spent |
|----------|------|--------|--------------|-------------|
| Feb 3 -- videos | Video (76 sec) | Paused | $150 | $3,527.17 |
| Feb 2nd -- Manual vs Fragmented -- Carousel | PDF/Carousel | Paused | $150 | $4,858.55 |

---

## Performance Comparison

### Reach & Impressions

| Metric | Video | PDF/Carousel | Difference |
|--------|-------|--------------|------------|
| Impressions | 85,322 | 20,474 | Video +317% |
| Reach | 78,172 | 17,805 | Video +339% |
| Avg Frequency | 1.09 | 1.15 | Similar |

**Analysis:** Video achieved 4.2x more impressions and reached 4.4x more unique users while spending $1,331 less.

---

### Cost Efficiency

| Metric | Video | PDF/Carousel | Difference |
|--------|-------|--------------|------------|
| Total Spent | $3,527.17 | $4,858.55 | Video -27% |
| CPM (Cost per 1,000 Impressions) | $41.34 | $237.30 | Video 5.7x cheaper |
| CPC (Cost per Click) | $7.08 | $62.29 | Video 8.8x cheaper |

**Analysis:** Video delivers dramatically better cost efficiency. Every $1 spent on video generates approximately $5.70 worth of impressions compared to PDF/Carousel.

---

### Engagement Metrics

| Metric | Video | PDF/Carousel | Difference |
|--------|-------|--------------|------------|
| Clicks | 498 | 78 | Video +538% |
| CTR (Click-Through Rate) | 0.584% | 0.381% | Video +53% |
| Total Engagements | 919 | 1,562 | PDF +70% |
| Reactions | 38 | 24 | Video +58% |
| Comments | 2 | 0 | Video |
| Shares | 1 | 1 | Tie |

**Analysis:** While PDF/Carousel shows higher total engagements (likely carousel swipes), video drives significantly more clicks (6.4x) — the more valuable action for lead generation campaigns.

---

### Lead Generation Performance

| Metric | Video | PDF/Carousel | Difference |
|--------|-------|--------------|------------|
| Lead Forms Opened | 334 | 40 | Video +735% |
| Leads Captured | 13 | 2 | Video +550% |
| Lead Form Completion Rate | 3.89% | 5.00% | PDF +29% |
| Cost Per Lead | $271.32 | $2,429.27 | Video 9x cheaper |

**Analysis:** Video generated 13 leads vs 2 for PDF/Carousel, at a cost of $271 vs $2,429 per lead. While PDF shows a slightly higher form completion rate (5% vs 3.9%), the volume difference makes video the clear winner for lead generation efficiency.

---

### Video-Specific Metrics

| Metric | Value |
|--------|-------|
| Video Length | 76 seconds |
| Video Views | 26,927 |
| Video View Rate | 31.56% |
| Video Completions | 479 |
| Video Completion Rate | 1.78% |

**Analysis:** Nearly 1 in 3 impressions resulted in a video view. The low completion rate (1.78%) suggests the 76-second video may be too long — consider testing shorter versions.

---

### PDF/Carousel-Specific Metrics

| Metric | Value |
|--------|-------|
| Download Clicks | 1 |
| Document Completions (100%) | 0 |

**Analysis:** Document engagement is extremely low, indicating the PDF content may not be compelling or the format is not resonating with the audience.

---

## Key Insights

### 1. Video Dominates on Efficiency
- **5.7x lower CPM** means video gets significantly more visibility per dollar
- **8.8x lower CPC** indicates video content resonates better with the audience
- **9x lower CPL** makes video the clear choice for lead generation

### 2. Scale Advantage
Video reached 78,172 unique users compared to just 17,805 for PDF/Carousel — a 4.4x difference. For brand awareness and top-of-funnel reach, video is superior.

### 3. PDF/Carousel Underperformance
The PDF/Carousel campaign shows concerning metrics:
- Zero document completions
- Only 1 download click
- CPM of $237 is extremely high for LinkedIn
- CPL of $2,429 is likely unsustainable

### 4. Video Optimization Opportunity
The 1.78% video completion rate suggests room for improvement:
- Consider shorter video cuts (15-30 seconds)
- Front-load the key message in the first 10 seconds
- Test different hooks to improve retention

---

## Recommendations

### Immediate Actions
1. **Reallocate Budget:** Shift PDF/Carousel budget to video campaigns
2. **Pause PDF/Carousel:** Current performance does not justify continued spend
3. **Scale Video:** Increase video campaign daily budget from $150

### Testing Opportunities
1. **Video Length:** Create 15, 30, and 45-second cuts to test completion rates
2. **Ad Copy Variations:** Test different intro text and headlines
3. **Audience Segments:** Analyze which audiences perform best with video

### Long-Term Strategy
1. Invest in video content production as primary creative format
2. Use static/carousel formats for retargeting warm audiences only
3. Establish CPL benchmarks: Target <$300 for video campaigns

---

## PostHog Attribution Analysis

### Website Traffic from LinkedIn

| Source | Unique Visitors | Events |
|--------|-----------------|--------|
| Organic LinkedIn (profile links) | 17 | ~1,059 |
| Paid Campaign (abm-b2b-saas-cx) | 1 | ~4 |
| Total LinkedIn Traffic | 19 | ~1,200 |

### Identified LinkedIn Visitors

| Email | Company | LinkedIn Events | Demo Conversion |
|-------|---------|-----------------|-----------------|
| taishi.iwasaki@datadoghq.com | Datadog | 11 | No |
| sarah@posthog.com | PostHog | 3 | No |
| alek@reflex.dev | Reflex | 2 | No |

### Demo Conversions from LinkedIn

**Finding: No demos can be directly attributed to LinkedIn ads in PostHog.**

- The 15 leads captured (13 video, 2 PDF) came through LinkedIn's native lead gen forms
- These leads are not tracked in PostHog website analytics
- None of the identified LinkedIn website visitors completed a demo booking event

### Attribution Gap

There is a tracking disconnect between:
1. **LinkedIn Lead Gen Forms** → 15 leads captured (reported in LinkedIn Ads)
2. **PostHog Website Tracking** → 0 demo conversions from LinkedIn visitors

**Possible reasons:**
- LinkedIn leads may have booked demos directly via email/calendar links (not tracked)
- Lead-to-demo conversion may still be in progress
- UTM parameters are not persisting through the demo booking flow

### Recommendations for Attribution

1. **Sync LinkedIn leads to CRM** (HubSpot) and track their journey to demo
2. **Add UTM persistence** to the demo booking flow to capture source attribution
3. **Create a LinkedIn → Demo funnel** in PostHog to track multi-touch attribution
4. **Match LinkedIn lead emails** against PostHog person properties for manual attribution

---

## Data Sources

- Video Campaign: `campaign_video_creative_performance_report.csv`
- PDF Campaign: `campaign_PDF_creative_performance_report.csv`
- Platform: LinkedIn Ads
- Website Analytics: PostHog (Project ID: 21667)
- Export Date: March 10, 2026

---

*Report generated by Claude Code*
