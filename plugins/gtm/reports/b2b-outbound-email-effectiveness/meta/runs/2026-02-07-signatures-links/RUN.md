# Run: 2026-02-07-signatures-links

**Status:** Closed
**Intent:** Additive
**Created:** 2026-02-07

## Purpose
Two new dimensions: (1) best practices around email signatures, footers, images, and calendar links in cold outbound; (2) deep technical research on how links in cold emails affect deliverability — subdomains, UTM params, click tracking, custom unsubscribe, link shorteners, number of links, etc.

## Scope

**In-scope (delta only):**
- Dimension 31: Email Signatures, Footers, Images & Calendar Links — do images in signatures hurt deliverability? Should you include a calendar link (Calendly etc.) in cold emails? Plain text vs HTML signatures. What goes in an optimal cold email signature (name, title, phone, company — what data shows). Footer compliance (CAN-SPAM unsubscribe). Professional headshots / logos — help or hurt? Social links in signature. Signature length impact on reply rates. Calendar link as CTA vs separate CTA. "Sent from my iPhone" signatures.
- Dimension 32: Link Configuration & Deliverability in Cold Email — (1) Does including links hurt deliverability? By how much? (2) Same domain vs different subdomain (e.g. sending from hi.inkeep.com with links to links.inkeep.com). (3) UTM parameters impact on deliverability. (4) Custom unsubscribe links vs standard/one-click. (5) Click tracking links vs plain links. (6) Link shorteners (bit.ly, t.ly etc.) impact. (7) Number of links (0 vs 1 vs 2+). (8) HTTP vs HTTPS links. (9) Custom tracking domains — setup and impact. (10) New/cold domains in links vs established domains. (11) Link placement (body vs signature). (12) Google/Microsoft spam filter heuristics around links.

**Out-of-scope (avoid drift):**
- DNS infrastructure (SPF, DKIM, DMARC setup) — mention only if directly relevant to link domains
- Inbox warming procedures
- Email service provider comparisons
- Everything already in dimensions 1-30

**Filter rule:** For each finding, ask: "Does this give a practitioner a specific configuration decision they can make about their email links/signatures?" If yes, include. If no, skip.

## Delta Rubric

| # | Dimension | Depth | Priority | Worker |
|---|-----------|-------|----------|--------|
| 31 | Email Signatures, Footers, Images & Calendar Links | Deep | P0 | W26 |
| 32 | Link Configuration & Deliverability | Deep | P0 | W27 |

## Worker Groupings

| Worker | Dimensions | Rationale |
|--------|-----------|-----------|
| W26 | 31 (Signatures/footers) | Visual elements, signature optimization, calendar links |
| W27 | 32 (Link deliverability) | Technical link configuration, subdomain strategy, tracking, UTM |

## Existing Coverage (what workers should NOT duplicate)

### Already covered:
- Links hurt deliverability generally (dim 30, Finding 7 — Klenty, QuickMail, Smartlead)
- Click tracking adds unique URLs that ESPs detect (dim 30)
- Average cold email CTR is 3.67% (dim 30)
- "Don't optimize for clicks; goal is conversation" (dim 30)
- Reply-gating strategy as alternative to links (dim 30)
- Plain text vs HTML emails — plain text wins for cold (dim 3)
- AI does NOT trigger spam — repetition does (dim 26)
- Content fingerprinting for bulk patterns (dim 26)

### What we NEED that's new:
- W26: Specific data on signature elements, images in cold email, calendar link performance, footer optimization
- W27: Granular technical data on link configuration — subdomain matching, UTM params, tracking domains, unsubscribe link types, number of links, domain reputation in links, HTTPS vs HTTP
