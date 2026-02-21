# Blog → Demo → Booking Funnel: Learnings from Session Recordings

**Source:** PostHog Session Replay + Web Analytics  
**Sessions Analyzed:** 3 sessions (Hillsboro USA, Oslo Norway, Frankfurt Germany)  
**Blog Article:** "Technical B2B Support in 2026: What Leaders Must Prepare For"  
**Campaign:** utm_source=email, utm_medium=outreach, utm_campaign=manual_work  
**Report Generated:** 2026-02-18

---

## Funnel Overview

```
325 blog visitors
  → ~275 reach /demo       (~53% drop-off at blog)
      → fraction book call  (~47% bounce on /demo page)
```

---

## Learning 1: The Funnel Is Leaking at Every Stage

From the Web Analytics **Paths** data:

| Page | Visitors | Bounce Rate | End Path Visitors |
|------|----------|------------|-------------------|
| /blog/technical-b2b-support-in-2026-what-leaders-must-prepare-for | 325 | **53.3%** | 280 |
| /demo | 275 | **47.0%** | 141 |

- Over **half of blog visitors leave without taking any action**
- ~50 people who land on the blog never make it to the demo page
- Of those who do reach /demo, nearly half leave without booking
- The biggest single drop-off is at the blog article itself

**Bottleneck:** The blog article is losing the majority of its visitors before they ever see the demo CTA.

---

## Learning 2: Blog Scroll Depth Is Very Low — Users Click Through Before Reading

All three sessions show users clicking to /demo within the first 8–35 seconds:

| Session | Location | Time to /demo Click |
|---------|----------|---------------------|
| Frankfurt (Session 3) | Germany | **00:08** (8 seconds) |
| Hillsboro (Session 1) | Oregon, USA | **00:26** (26 seconds) |
| Oslo (Session 2) | Norway | **00:35** (35 seconds) |

These users arrived from an **email outreach campaign** and are high-intent. They are **not coming to read the article** — they are scanning for a next step. The blog article content may not be the primary conversion driver; the **embedded CTAs** are doing the work.

**Bottleneck:** The article may be too long for this audience. A shorter, more action-oriented landing page might convert better for email outreach traffic.

---

## Learning 3: The Demo CTA Has a Rendering Race Condition

From the Frankfurt session (Session 3), the dead click at **00:05** provides a specific technical bottleneck:

- The user clicked **3,039ms after page load** (before the page was fully interactive)
- The dead click landed on an **empty container div** (`<div class="max-w-[1440px] mx-auto"></div>`) — not the button itself
- The page's FCP was 1532ms, but the CTA button was not yet interactive when the user clicked
- This is a **rendering race condition**: the button is visually visible but not yet functional

**Dead click event details:**
- `Dead click absolute delay`: 3039ms
- `Dead click absolute timeout`: true
- `Dead click mutation timeout`: false

**Bottleneck:** The CTA button renders before it becomes interactive, causing the user's first intent-driven click to fail silently. This is a missed conversion moment.

---

## Learning 4: Two Overlapping CTAs Create Ambiguity

From the session replay screenshots, the blog article contains **two different in-article demo CTAs**:

1. **"Request a demo"** — an inline hyperlink buried in the "Next Steps" section body text
2. **"SEE DEMO (ENTERPRISE)"** — a sticky/embedded button with a `work@email.com` email input field

**Issues identified:**
- The **"ENTERPRISE"** label on the button signals it is only for large companies, which may deter SMB or mid-market leads from clicking — even if they're qualified
- Having two separate CTAs with different labels ("Request a demo" vs "SEE DEMO") for what is presumably the same action creates confusion about which to use
- The email input field on the button suggests a different flow than the hyperlink, adding to the ambiguity

**Bottleneck:** CTA labeling and duplication are likely reducing click-through from prospects who self-select out due to the "ENTERPRISE" qualifier.

---

## Learning 5: The Demo Page Form Has a Friction Problem

The /demo page presents a **"Schedule a call"** form requiring:
- Name
- Work email

Observations from sessions:
- The Oslo user spent ~16 seconds on /demo with **8 keystrokes** — they likely started typing but did not complete the form
- The Hillsboro user spent only ~8 seconds on /demo — not enough time to fill a form
- The Frankfurt user spent ~50 seconds on /demo (the longest), but still no confirmed booking event

**The work email field is a specific friction point** for email campaign traffic:
- Users received the outreach to their personal or work email, but may not have that email address immediately available when the form asks for "Work email"
- This creates a moment of hesitation that often results in tab-switching or abandonment

**Bottleneck:** Requiring a work email as the primary identifier on a page reached from an email campaign creates unnecessary friction. The email is already known — pre-filling it or using a simpler form (name only, or calendar embed) could improve completion rates.

---

## Learning 6: Tab Switching on the Demo Page Signals Form Abandonment Intent

In **all three sessions**, after navigating to /demo, the window toggled between hidden and visible states:

| Session | Pattern on /demo |
|---------|-----------------|
| Frankfurt | Window hidden at 00:08, then multiple hidden/visible toggles |
| Hillsboro | Window hidden at 00:24 (before /demo), hidden/visible at 00:31, 00:34 |
| Oslo | Window hidden/visible at 00:35, 00:46 |

This consistent **tab-switching behavior** is a strong signal that users:
1. Open the demo page
2. Switch away — likely to find their work email address, check their calendar, or look something up
3. May or may not return to complete the form

The /demo page has a **47% bounce rate**, confirming many of these context-switching sessions never complete.

**Bottleneck:** The form requires information users don't have at hand. Embedding a **calendar widget** (like Calendly) directly on the /demo page — without requiring email first — would remove this friction entirely.

---

## Learning 7: Performance Is Uneven Across Geographies

Web vitals show a major performance gap between regions:

| Session | Location | FCP | LCP | INP | CLS |
|---------|----------|-----|-----|-----|-----|
| Hillsboro (USA) | Oregon | ✅ 1147ms | ✅ 1147ms | ✅ 40ms | ⚠️ 0.22 → ✅ 0.00 |
| Frankfurt (Germany) | Europe | ✅ 1532ms | ✅ 1532ms | ✅ 24ms | ✅ 0.00 |
| Oslo (Norway) | Europe | ❌ **3452ms** | ⚠️ **3452ms** | ❌ **1032ms** | ✅ 0.04 |

The Oslo session had a **3× slower FCP** than the best performer and an **INP of 1032ms** — meaning the demo form felt broken and unresponsive when typing. This directly contributes to form abandonment.

**Bottleneck:** No CDN or edge caching appears to be serving assets efficiently to Northern Europe. Poor performance in key geographic markets is silently killing conversions before intent can be acted on.

---

## Learning 8: The `$direct` Referrer and Timezone Anomaly Suggest Forwarded Emails

All three sessions show `$direct` as the referring domain despite having tracked UTM parameters. One session (Frankfurt) also shows **two timezones** in the event properties:
- `Timezone: Europe/Berlin`
- `Timezone: America/New_York`

This dual timezone signature occurs when email is opened via a **web-based email client that uses a proxy server**, or when the email has been **forwarded to a different recipient**. This means the outreach campaign may be reaching unintended recipients — or the tracked link is being opened in unexpected environments.

**Insight:** Consider whether the forwarded-email traffic is from the target ICP. If the email is being forwarded to decision-makers by the original recipient, this could actually be a signal of strong interest worth nurturing.

---

## Summary: Prioritized Bottlenecks

| Priority | Bottleneck | Location | Recommended Fix |
|----------|-----------|---------|----------------|
| 🔴 High | 53% blog bounce rate | Blog article | Shorten page for email traffic; add a prominent top-of-page CTA |
| 🔴 High | CTA not interactive at page load | Blog article (00:05) | Fix hydration/interactivity lag on the demo CTA button |
| 🔴 High | Form requires work email | /demo page | Embed calendar widget or pre-fill email from UTM/known context |
| 🟠 Medium | "ENTERPRISE" label deters non-enterprise | Blog CTA button | A/B test label: "See a demo" vs "SEE DEMO (ENTERPRISE)" |
| 🟠 Medium | Two conflicting CTAs | Blog article | Consolidate into one consistent CTA with one label |
| 🟠 Medium | Tab-switching abandonment on /demo | /demo page | Remove multi-step form; use inline calendar booking |
| 🟡 Low | Poor performance in Norway/Northern Europe | All pages | Add CDN edge nodes in Northern Europe; audit asset delivery |
| 🟡 Low | Forwarded email / proxy traffic | Campaign | Investigate whether $direct + dual timezone = forwarded emails |

---

*Analysis based on PostHog Session Replay (Project 21667) and Web Analytics data.*  
*Sessions recorded: Feb 05, 2026. Report generated: Feb 18, 2026.*
