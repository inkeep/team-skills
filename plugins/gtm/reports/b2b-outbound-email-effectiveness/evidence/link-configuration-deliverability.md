# Dimension 32: Link Configuration & Deliverability in Cold Email

## Evidence Document | Research Worker W27

**Research Date:** 2026-02-07
**Dimension:** Link Configuration & Deliverability
**Scope:** Technical deep-dive on how link presence, type, configuration, and tracking affect cold email inbox placement
**Sources:** 50+ sources across cold email platforms (Instantly, Smartlead, Lemlist, Woodpecker, Reply.io, Apollo), deliverability testing tools (GlockApps, MailReach, MailGenius, Postmark), email authentication standards (RFC 8058, DMARC, SPF/DKIM), ESP documentation (Google Workspace, Microsoft Defender), URL reputation systems (Spamhaus DBL, SURBL, URIBL, Google Safe Browsing), and practitioner data (SmartReach 2.3M+ email analysis, Instantly 2026 Benchmark Report)

---

## Finding 1: Quantified Inbox Placement by Link Count -- Steep Drop-Off Above 2 Links

**Confidence:** HIGH
**Evidence Source:** SmartReach analysis of 2.3M+ sales emails; Mailchimp 2024 Email Deliverability Report (cited by SmartReach)
**Key Data:**
- Inbox placement by link count: 1-2 links = 89%, 3-4 links = 76%, 5-6 links = 58%, 7+ links = 34%
- Emails with 6+ links are 73% more likely to be marked as spam compared to emails with 1-2 links
- SpamAssassin adds approximately 0.8 points per additional link beyond the third; default spam threshold is 5.0
- 1-2 relevant links correlate with +34% open rates and +28% response rates vs. 5+ links (SmartReach internal analysis)
- SaaS case study: limiting to 1 strategic link per cold email improved open rates from 18% to 31% in 6 weeks
- Validity 2025 Report: "too many links" ranked among top reasons 22% of legitimate emails end up in spam
- SmartReach calculation: for a team sending 10,000 emails/month, fixing link issues alone could boost responses from 46 to 119 (2.6x)

**Implication:** Cold emails should contain 0-1 links maximum. The data shows a 55-percentage-point difference in inbox placement between 1-2 links (89%) and 7+ links (34%). This is not a marginal optimization -- it is one of the highest-leverage deliverability decisions available.

---

## Finding 2: Zero Links in First Touch Is the Consensus Best Practice

**Confidence:** HIGH
**Evidence Source:** EmailChaser, Woodpecker, Apollo, MailGenius, Instantly, MailReach, Clay
**Key Data:**
- EmailChaser: "Keep your first cold email with no links, images, videos, or attachments" -- once the first email lands in inbox, subsequent emails with links perform better
- Woodpecker: "Don't include any links in your first email to a prospect because it could negatively affect your deliverability"
- MailGenius: "For cold outreach emails, it's best to limit yourself to one link or even no links at all"
- Clay (2024 deliverability guide): recommends stripping all links from initial cold outreach
- Key mechanism: once a prospect replies to your first email, links in subsequent messages no longer negatively impact deliverability -- the conversation thread is established
- Alternative approach: "If prospects want to learn more about you, they will copy the domain associated with your email address and paste it in their browser"
- Instantly 2026 Benchmark: best performing campaigns maintain first-touch emails under 80 words with a single CTA (no link)

**Implication:** The first email in a cold sequence should contain zero links. Use a text-only approach for initial contact. Once the thread has engagement (reply), links in follow-ups carry substantially lower risk.

---

## Finding 3: Click-Tracking Redirects Produce a Measurable -10% to -15% Reply Rate Penalty

**Confidence:** HIGH
**Evidence Source:** Instantly Cold Email Benchmark Report 2026 (platform-wide data Jan 1 - Dec 18, 2025); Woodpecker, Lemlist, MailForge
**Key Data:**
- Instantly 2026 Benchmark: "Campaigns using email tracking pixels show a -10% to -15% reply rate correlation, likely due to increased spam filtering sensitivity to tracking tags"
- This is from the largest available cold email dataset (platform-wide Instantly data)
- Woodpecker explicitly advises against link tracking in their help documentation: article titled "Why we do not recommend link tracking"
- Woodpecker's explanation: "Link tracking needs a redirect mechanism... redirects are also used by spammers and scammers, and companies like Google protect their users by monitoring and filtering out messages that contain redirect links"
- Default tracking domains are shared across thousands of platform users, tying sender reputation to other users' practices
- Lemlist: "When you use default tracking domains, the URL for links and pixels don't match your email sender domain, creating a mismatch that email providers like Google flag as suspicious"
- When even a cold email platform (Woodpecker) advises against its own tracking feature, the signal is unambiguous

**Implication:** Click tracking via redirect is one of the highest-risk link configurations. The Instantly data quantifies this at -10% to -15% reply rate. If tracking is required, a custom tracking domain aligned with your sending domain is mandatory. For most cold email, disable click tracking entirely and measure success via reply rate.

---

## Finding 4: Open Tracking Pixels Increase Spam Probability by 15%

**Confidence:** MEDIUM-HIGH
**Evidence Source:** MailForge (case study data), MailScale, Instantly Benchmark 2026, Saleshandy (Google 2024 policy), Apollo
**Key Data:**
- MailForge: "Emails with tracking pixels are 15% more likely to be flagged as spam compared to those without" (widely cited but original source not independently verified)
- Case study: one Salesforge user achieved 30% improvement in inbox placement and 15% increase in reply rates after disabling open tracking
- Instantly 2026 Benchmark: -10% to -15% reply rate correlation for campaigns using tracking pixels (corroborating the MailForge claim directionally)
- Google's 2024 tracking policy update: Gmail now flags open tracking pixels as suspicious; recipients may see "Images in this message are hidden. This message might be suspicious or spam"
- Apple Mail Privacy Protection (58.96% of email client market share) pre-loads tracking pixels, making open rate data unreliable regardless
- MailScale: "A reply rate of 2% or higher usually suggests good inbox placement" -- use this as proxy instead of open rate
- Apollo recommends: use open tracking selectively for short-term tests, then turn it off

**Implication:** Disable open tracking for cold email campaigns. The deliverability cost (15% more spam-flagging; -10-15% reply rate) outweighs the value of open rate data, which is already unreliable due to Apple Mail's privacy blocking. Use reply rate as the primary performance metric.

---

## Finding 5: Custom Tracking Domains Are Mandatory When Tracking Is Enabled

**Confidence:** HIGH
**Evidence Source:** Instantly, Lemlist, Smartlead, MailReach, GMass, Hunter.io, WarmForge, Reply.io
**Key Data:**
- Lemlist: custom tracking domain "defines a unique sending reputation for your domain" and ensures tracking links use your brand, not the platform's
- Instantly setup timeline: SPF/DKIM/DMARC on Day 1-2, warmup Day 1-14, custom tracking domain CNAME on Day 3-5
- Smartlead offers a dedicated "custom domain tracking link warmup" feature -- the tracking links themselves undergo a reputation-building process
- MailReach: establishing a subdomain on a domain with positive reputation is advantageous as it inherits credibility
- Reply.io: branded links can boost open rates by 5-15% vs. default tracking domains
- DNS setup: CNAME record pointing subdomain (e.g., track.yourdomain.com) to platform tracking server; propagation takes 24-72 hours
- Critical alignment rule: tracking subdomain MUST share the same root domain as sending domain (send from hi.inkeep.com -> track via track.inkeep.com, NOT a different domain)
- Default tracking domains are shared across all platform users -- if other users send spam, the shared tracking domain degrades and YOUR emails suffer

**Implication:** Never use default/shared tracking domains. Create a CNAME record for a subdomain of your sending domain. This is a 15-30 minute setup that prevents the single largest deliverability risk of tracking: shared domain reputation contamination.

---

## Finding 6: Custom Tracking Domains Need Their Own Warmup Period

**Confidence:** MEDIUM-HIGH
**Evidence Source:** Smartlead, Instantly, MailReach
**Key Data:**
- Smartlead explicitly offers "custom domain tracking link warmup" -- sends emails containing tracking links ensuring they land in primary inbox so the links build reputation
- Instantly recommends setting up custom tracking domain between Day 3-5 during warmup phase
- MailReach: tracking domain inherits credibility from parent domain reputation, but new subdomains still need establishment
- DNS propagation takes 24-48 hours; tracking should not be enabled until propagation is confirmed
- Warmup duration: 1-2 weeks minimum before using tracking in live campaigns
- Smartlead configuration: warmup emails with tracking enabled build reputation for the tracking subdomain alongside regular mailbox warmup

**Implication:** After DNS setup, warm up the custom tracking domain for at least 1-2 weeks before using it in live campaigns. Some platforms (Smartlead) automate this process via their warmup feature.

---

## Finding 7: URL Shorteners (bit.ly, t.ly, etc.) Cause Immediate Deliverability Damage

**Confidence:** HIGH
**Evidence Source:** Postmark (investigation data), AWeber, Spamhaus Resource, Word to the Wise, SMTP2GO, Rebrandly
**Key Data:**
- Postmark investigation: blocked emails frequently contained free URL shorteners, most commonly Bitly; removing shorteners and using original URLs returned delivery to normal
- Gmail bounce code: "Our system has detected that this message is suspicious due to the nature of the content and/or the links within"
- Word to the Wise: "Bit.ly gets you blocked" -- documented as early as 2011 and still current as of 2025
- AWeber: "Link shorteners hurt email deliverability" -- dedicated advisory article
- Root cause: free shortener domains are shared infrastructure; when any user sends spam through bit.ly, the domain gets blocklisted by ISPs, and all emails containing bit.ly are collateral damage
- Rebrandly: shared shortener domains appear on SURBL/URIBL blocklists, causing automatic filtering
- SMTP2GO: recommends "caution when using URL shorteners" -- generic URL shortener domains have been repeatedly blacklisted

**Implication:** Never use public URL shorteners (bit.ly, t.ly, tinyurl.com, ow.ly, goo.gl) in any email. If shortened URLs are needed, use a branded short link on your own domain (e.g., l.yourdomain.com/xyz), but recognize that any redirect adds spam filter risk.

---

## Finding 8: Link Domain Reputation Is Checked Against SURBL/URIBL Blocklists Independently

**Confidence:** HIGH
**Evidence Source:** SURBL, URIBL, Spamhaus DBL, NameSilo, Suped.com, Barracuda, Cisco Talos
**Key Data:**
- SURBL and URIBL operate as real-time databases tracking domains/URLs associated with spam, phishing, or malicious content
- Unlike IP-based sender reputation, URL-based blocklists examine domains embedded within email content
- NameSilo: "Even if your sending infrastructure is pristine, a single problematic link can trigger filtering"
- Impact is immediate: Gmail, Outlook, Yahoo automatically route messages to spam when a linked domain appears on URIBL/SURBL
- Spamhaus DBL is specifically used by email filters to evaluate domains in message bodies
- Barracuda URL Reputation: can block an email based solely on a poorly-rated URL, regardless of sender reputation
- Tools available: domain blocklist checkers (MXToolbox, Suped) query 8+ databases simultaneously
- Google Safe Browsing integration: domains flagged in Safe Browsing database trigger both email spam classification and browser interstitial warnings

**Implication:** Before including any link in a cold email, check the destination domain against SURBL, URIBL, Spamhaus DBL, and Google Safe Browsing. A single link to a blocklisted domain tanks the entire email's deliverability regardless of sender reputation.

---

## Finding 9: Domain Alignment Between Sender and Link Domains Matters

**Confidence:** MEDIUM-HIGH
**Evidence Source:** Lemlist, ActiveCampaign, Suped.com, HubSpot Community, DMARC alignment documentation (dmarcian, EasyDMARC)
**Key Data:**
- ActiveCampaign: "For optimal email deliverability, the domain in your From address, your email authentication records, and the domain used in your email links should align"
- Suped.com: "Inconsistencies between the From domain and the links in the email content can raise spam flags"
- Subdomain alignment scenarios:
  - Sending from hi.inkeep.com -> links to inkeep.com (root): Safe, relaxed alignment passes
  - Sending from hi.inkeep.com -> links to links.inkeep.com (sibling subdomain): Generally safe, same organizational domain
  - Sending from hi.inkeep.com -> links to totally-different-domain.com: Raises suspicion; link domain reputation is evaluated independently
- DMARC relaxed alignment (default): allows parent domain and child subdomains to pass (email.example.com and example.com both pass)
- DMARC strict alignment (adkim=s): requires exact domain match
- Important distinction: DMARC alignment is about sender authentication (From header vs. SPF/DKIM domains), NOT about link domains; but tracking domain mismatch is a separate phishing signal
- Links to well-known, high-reputation third-party domains (linkedin.com, calendly.com) are safe

**Implication:** Use your root domain or a subdomain of your sending domain for all links. Tracking domains MUST be subdomains of the sending domain. Links to different root domains are evaluated on the linked domain's own reputation. Avoid linking to obscure or unrelated domains.

---

## Finding 10: HTTP Links Are a Negative Signal -- Gmail Specifically Filters Them

**Confidence:** MEDIUM-HIGH
**Evidence Source:** RawkBlog (Gmail testing), Suped.com, ProFundCom, Woodpecker
**Key Data:**
- RawkBlog: "Gmail is flagging non-HTTPS links in email for spam" -- tested and documented that HTTP links in signatures triggered Gmail filtering
- Suped.com: "An HTTP link in itself is not typically a direct trigger for major blocklists" but "signals a potential weakness in email security practices"
- ProFundCom: "mixed content" (mixing HTTP and HTTPS links in same email) identified as one of "two unknown spam issues in emails"
- Woodpecker added SSL to their link tracking mechanism specifically to improve deliverability
- Trend: as the web moves to HTTPS universally, email providers will weight HTTPS more heavily
- Google's guidance: "Web links in the message body should be visible and easy to understand"
- Current status: HTTP alone is not an automatic spam trigger but is a compounding negative signal

**Implication:** Always use HTTPS links. Never mix HTTP and HTTPS in the same email. Ensure custom tracking domains have SSL certificates (most platforms auto-provision). While HTTP is not yet an automatic death sentence, it is a negative signal that compounds with other risk factors.

---

## Finding 11: UTM Parameters Are Safer Than Redirect Tracking

**Confidence:** MEDIUM-HIGH
**Evidence Source:** Klenty, UTM.io, Signature.email, LeadConnector
**Key Data:**
- Klenty: "UTM tags do not directly affect email deliverability, making them a safer tracking alternative"
- UTM parameters append to destination URL (no redirect), so spam filters see the actual domain
- UTM.io: "Spam filters are sensitive to links that redirect, as they often signal an attempt to mask the final destination" -- UTMs avoid this
- Risk factors: URL length increases, spammy words in UTM values (e.g., utm_source=mass_blast) could trigger content filters
- UTM parameters are visible to recipients in browser URL bar, which can reveal campaign metadata
- Alternative: server-side redirect tracking through own domain avoids both UTM visibility and third-party redirect risk
- Best practice: use utm_source only (or utm_source + utm_medium at most); avoid utm_content variants that create unique URLs per recipient (fingerprinting risk)

**Implication:** UTM parameters are the least harmful method for tracking link clicks in cold email. They preserve destination domain visibility to spam filters. Keep UTM strings short and professional. Avoid per-recipient unique UTM values.

---

## Finding 12: Signature Links Count Toward Total Link Budget

**Confidence:** HIGH
**Evidence Source:** Instantly, GMass, GlockApps, Woodpecker, EmailSignatureRescue
**Key Data:**
- Woodpecker: "We recommend having no more than 2 [links] in an email, including the signature"
- Instantly: email signatures are "often the biggest silent killer of cold email deliverability"
- GlockApps: "Having too many links, large images, and huge blocks of HTML code in your signature can cause your email to get marked as spam"
- EmailChaser: "You can include your website's domain in the signature without hyperlinking it. From a deliverability perspective, it's safer to not include any links in your email signature"
- Social media icons add both links AND images, compounding risk
- GMass: "The more you include in a cold email (especially things like links and images), the more likely it is you'll trigger a spam filter"
- A typical rich signature (website + LinkedIn + Twitter + phone) = 3-4 links; combined with 1 body link = 4-5 total, dropping inbox placement to ~58%

**Implication:** For cold email, use a minimal plain-text signature. If links are included, count them toward the total budget of 1-2 maximum. A LinkedIn URL mentioned as plain text (not hyperlinked) is the safest credential signal. Avoid social media icon blocks entirely.

---

## Finding 13: Link Placement -- Body vs. Signature Has Nuanced Impact

**Confidence:** MEDIUM
**Evidence Source:** EmailChaser, GMass, Woodpecker, Sparkle.io
**Key Data:**
- EmailChaser: "Don't put the link in the body of the email. Slip it into the signature block to keep the CTA low-pressure"
- Woodpecker: body links are more heavily scrutinized by spam filters than signature links
- GMass: for cold outreach, text-only body with minimal signature (one link) is optimal
- However, signature links still count toward total link count
- Resolution: if email body has 0 links, 1 signature link is safe; if body has a link, signature should have 0
- Post-response: once a prospect replies, links in both body and signature carry minimal risk

**Implication:** The safest configuration for first touch: 0 links in body + 0-1 links in signature. For follow-ups: 1 link in body (if needed) + 0 signature links. Never have links in both body and signature on a first cold email.

---

## Finding 14: Text-Based Opt-Out Beats Hyperlinked Unsubscribe for Cold Email

**Confidence:** MEDIUM-HIGH
**Evidence Source:** Woodpecker, MailForge, Klenty, MailReach, EmailChaser, CAN-SPAM Act, RFC 8058
**Key Data:**
- CAN-SPAM requires an opt-out mechanism but does NOT require a hyperlinked unsubscribe; text-based opt-out satisfies the requirement
- MailReach: "Unsubscribe links may lower cold email deliverability because they are links, mark you as more likely to be spam or promotional, and flag to users that they're part of an automated sequence"
- Woodpecker: "Make your opt-out message sound natural... ditch legal verbose and stick to smaller, friendlier sentences"
- RFC 8058 List-Unsubscribe-Post header required only for bulk senders (5,000+ emails/day to Gmail/Yahoo) sending marketing/promotional emails
- Cold email operations (50-80 emails/day per mailbox) fall well under 5,000/day per domain in most cases
- However: absence of unsubscribe option risks recipients clicking "Report Spam" instead -- catastrophically worse for sender reputation
- Gmail spam complaint rate must stay below 0.3%; an easy opt-out reduces complaint rates
- The paradox resolves: text-based opt-out provides the opt-out mechanism without adding a link or signaling automation

**Implication:** For cold email under 5K/day, use a natural text-based opt-out ("Not the right person? Just let me know.") instead of a hyperlinked unsubscribe. This satisfies CAN-SPAM, avoids adding a link, and avoids the "mass email" signal. For 5K+/day senders, implement List-Unsubscribe-Post header per RFC 8058.

---

## Finding 15: New/Cold Domains in Links Carry Higher Risk

**Confidence:** MEDIUM-HIGH
**Evidence Source:** MailReach, Google Safe Browsing, Suped.com, Woodpecker, Spamhaus
**Key Data:**
- MailReach: "Newer domains often lack the trust email providers demand, leading to spam folder placement or outright rejections"
- Google Safe Browsing: "Newly registered domains often lack a reputation and are more likely to be blacklisted"
- Suped.com: "When a domain is flagged [by Safe Browsing], email providers use this information to assess the safety of links within emails"
- Domain age thresholds: domains < 24 hours old may be auto-rejected by Spamhaus-subscribing ISPs; domains < 30 days old face elevated scrutiny
- Domain warming for sending: 3-6 weeks; similar principle applies to link destination domains
- MailReach: "Email deliverability isn't about how old your domain is -- it's about how much trust you build"
- Well-known domains (linkedin.com, calendly.com) carry positive reputation that helps deliverability
- Google Search Console Security Issues tab provides notification when your domain is flagged

**Implication:** Link domains need 30+ days of age and live content before use in cold emails. Regularly check linked domains against Google Safe Browsing Transparency Report. Links to established platforms (LinkedIn, Calendly) are safe and can signal legitimacy.

---

## Finding 16: Gmail's Multi-Layer Link Evaluation Is the Most Sophisticated

**Confidence:** HIGH
**Evidence Source:** Google documentation, Allegrow, Folderly, GlockApps, Proofpoint
**Key Data:**
- Gmail evaluates links through 5+ overlapping systems:
  1. Safe Browsing: checks all URLs against known-malicious database
  2. Click-time Protection: re-evaluates links even after delivery when clicked
  3. Enhanced Safe Browsing: deeper URL scanning before delivery
  4. RETVec (ML model): analyzes links as part of holistic content analysis; improved spam detection by 38%, reduced false positives by 19.4%
  5. Domain Reputation Clustering: associates sending domain reputation with link engagement patterns
- From November 2025: non-compliant bulk senders face outright rejection (4xx/5xx), not just spam folder
- Google retired IP/Domain Reputation dashboards; now uses "Compliance Status" and "Spam Rate" metrics
- Spam rate threshold: must stay below 0.3% user-reported spam rate
- Gmail AI is personalized: learns from individual user interactions; if recipients ignore link-heavy messages, future similar emails are increasingly filtered
- Gmail Promotions tab triggers: excessive links, sales-driven terms, tracking redirects, sender behavior patterns

**Implication:** Gmail is the most challenging provider for link-heavy cold email. Every link faces multi-layer scrutiny. The personalized AI means low engagement on link-heavy emails creates a negative feedback loop. Optimize for Gmail first -- if deliverability works on Gmail, it works everywhere.

---

## Finding 17: Microsoft Outlook Uses Different Heuristics -- Anchor Text Mismatch Is Critical

**Confidence:** HIGH
**Evidence Source:** Mailtrap, GlockApps, Microsoft documentation, Allegrow
**Key Data:**
- Microsoft is particularly sensitive to anchor text vs. destination URL mismatch: writing "www.calendly.com" as link text when the actual URL goes to a tracking redirect is treated as phishing
- Microsoft introduced LLM-based detection (November 2024) to analyze email language and infer intent
- May 2025 enforcement: mandatory SPF, DKIM, DMARC for high-volume senders to Outlook.com; non-compliant mail rejected
- Microsoft moves suspicious emails to quarantine (harder to find than junk folder)
- Outlook evaluates sender credibility, email structure, content patterns, and link destinations
- Practitioner consensus: Outlook is generally more favorable for B2B cold email than Gmail, but anchor text mismatch is the single most dangerous Outlook-specific mistake
- Safe alternatives: use descriptive text ("Book a meeting") rather than domain names as anchor text; or use raw URL as plain text

**Implication:** When targeting Outlook recipients, never use recognizable domain names as anchor text if the actual link destination differs (tracking redirect). Use descriptive, non-URL anchor text. Microsoft's LLM detection rewards genuine conversational tone over template-style messages.

---

## Finding 18: Email Content Fingerprinting -- Links Are a Primary Vector

**Confidence:** HIGH
**Evidence Source:** Instantly documentation, Iterable, SendGrid
**Key Data:**
- Mailbox providers fingerprint email content: subject lines, body text, links, signatures, CTA patterns
- When identical links appear across thousands of emails from same sending infrastructure, ESPs cluster them as a bulk campaign
- If the fingerprinted campaign generates low engagement or spam complaints, the pattern is associated with spam
- Unique-per-recipient click tracking URLs paradoxically help avoid link fingerprinting but introduce redirect/tracking risks
- Neither approach is ideal: no links eliminates both fingerprinting risk and tracking domain risk
- If links must be included: vary surrounding text/context to reduce fingerprint similarity across campaign

**Implication:** Link content contributes to email fingerprinting. Sending identical emails with identical links to large volumes within short timeframes triggers bulk-campaign classification. Vary email text around links, and avoid identical link placement patterns across your sequence.

---

## Finding 19: Redirect Chains Compound Risk Multiplicatively

**Confidence:** HIGH
**Evidence Source:** Suped.com, deliverability expert documentation
**Key Data:**
- Single redirect (custom tracking to destination): generally acceptable if tracking domain has good reputation
- Two redirects (shortener -> tracking -> destination): elevated risk; each domain evaluated independently
- Three+ redirects: major red flag strongly associated with phishing/link obfuscation
- ISPs follow full redirect chain and evaluate every intermediate domain
- If ANY domain in the chain has poor reputation, the entire email suffers
- Redirect chains also slow link resolution, triggering timeout-based filtering in some corporate email systems

**Implication:** Minimize redirect hops. Ideal: direct link, no redirects. Acceptable: one redirect through custom tracking domain. Dangerous: two+ redirects. Never combine shorteners with tracking domains.

---

## Finding 20: The Link-to-Text Ratio Creates a Structural Argument for Zero Links

**Confidence:** MEDIUM-HIGH
**Evidence Source:** SpamAssassin scoring documentation, Instantly 2026 Benchmark, SmartReach
**Key Data:**
- Recommended link-to-text ratio: 1 link per 125 words minimum
- Instantly benchmark: best performing cold emails are under 80 words
- Tension: an 80-word email with 1 link = 1:80 ratio (higher density than 1:125 recommendation)
- An 80-word email with 0 links = optimal for both length and link-to-text ratio
- SpamAssassin scoring: low text-to-link ratio adds ~0.8 points
- If a link must be included: target 100-125 words minimum to maintain ratio (but this conflicts with optimal length guidance)
- Resolution: the first cold email should have 0 links, which satisfies both optimal length (under 80 words) and optimal link ratio simultaneously

**Implication:** For optimally-length cold emails (under 80 words), any link at all violates the recommended link-to-text ratio. This is a quantitative structural argument for zero links in the initial cold email.

---

## Finding 21: Visible Anchor Text vs Destination URL Mismatch Is a Phishing Signal

**Confidence:** HIGH
**Evidence Source:** Microsoft Outlook documentation, Suped.com, Mailtrap
**Key Data:**
- Dangerous examples: anchor text "www.calendly.com" linking to tracking redirect; anchor text "inkeep.com" linking to "track.platform.io/click?..."
- Microsoft Outlook is particularly strict: detects when domain names in anchor text don't match destination and flags as phishing
- Gmail also detects this but is somewhat less aggressive
- Safe alternatives: descriptive text ("Book a meeting"), generic text ("here" or "this page"), or raw unlinked URL as plain text
- This is one of the most common deliverability mistakes in cold email templates

**Implication:** Never write a domain name as anchor text when the link destination differs from that domain. Use descriptive, non-URL anchor text for all hyperlinks. If you need to reference a URL, paste it as plain text rather than hyperlinking it with misleading anchor text.

---

## Finding 22: The 45% Non-Delivery Rate -- Links as a Top Factor

**Confidence:** MEDIUM-HIGH
**Evidence Source:** SmartReach (aggregate industry data), Validity 2025 Benchmark Report
**Key Data:**
- SmartReach: "45% of sales emails never reach the inbox due to spam filtering"
- Validity 2025: "22% of legit emails still end up in spam"
- Validity identifies "too many links" among top reasons for spam placement
- SmartReach: for 10,000 emails/month, fixing link issues alone could boost responses from 46 to 119 (2.6x improvement)
- 67% of sales teams lack clear guidelines on link optimization
- Average US inbox placement: 85% across all email types (Validity 2025), but cold outreach is significantly lower

**Implication:** Link optimization is not a marginal improvement. With 22-45% of sales emails failing to reach inbox, link-related fixes represent one of the highest-leverage changes available to cold email practitioners.

---

## Finding 23: Platform-by-Platform Tracking Capabilities and Defaults

**Confidence:** HIGH
**Evidence Source:** Direct platform documentation from Instantly, Smartlead, Lemlist, Woodpecker, GMass, Apollo, Reply.io
**Key Data:**
- All major cold email platforms support disabling both open and click tracking
- Instantly, Smartlead, Lemlist, Woodpecker, GMass, Apollo, Reply.io all offer custom tracking domain setup
- Smartlead uniquely offers tracking link warmup as a distinct feature
- Reply.io branded links claim: "boost open rates by 5-15%" vs. default tracking domains
- Woodpecker added SSL to tracking specifically to improve deliverability
- Per-campaign granularity: all platforms allow toggling tracking per campaign
- Consensus from deliverability practitioners: disable both open and click tracking for cold email; use reply rate as primary metric

**Implication:** Configure all cold email platforms with: open tracking OFF, click tracking OFF, custom tracking domain ready (for short-term A/B tests). The 5-15% improvement from custom tracking (Reply.io data) is relevant only when compared to default tracking -- no tracking still wins on pure deliverability.

---

## Finding 24: Google Safe Browsing Integration Means Link Domains Are Actively Screened

**Confidence:** HIGH
**Evidence Source:** Google Safe Browsing, MalCare, Suped.com, GMass
**Key Data:**
- Google Safe Browsing is integrated into Gmail's spam filtering
- GMass documented real incident: Safe Browsing flagged a domain, causing all emails with links to that domain to go to spam
- Flagging categories: malware distribution, phishing, social engineering, unwanted software
- New domains, domains without SSL, and domains with thin/no content are more susceptible to flagging
- Most social media platforms and email services integrate with Safe Browsing
- Recovery from blacklist requires: fixing issue, requesting review, waiting for re-evaluation
- Google Search Console Security Issues tab provides notification of flagging

**Implication:** Regularly check all domains you link to against Google Safe Browsing Transparency Report. Ensure outreach domains have valid SSL, real content, and are not proxying suspicious behavior. Monitor Google Search Console for security alerts.

---

## Finding 25: Tracking Domain Blacklisting -- Severe Consequences and 30-90 Day Recovery

**Confidence:** HIGH
**Evidence Source:** Smartlead, Mailpool, Spamhaus, MXToolbox
**Key Data:**
- When a tracking domain is blacklisted: deliverability drops to 0% for all emails using that domain
- All campaigns using the blacklisted domain are affected simultaneously
- Blacklist propagation can happen within hours across major ISPs
- Recovery process: stop campaigns, diagnose via MXToolbox/MultiRBL, fix root cause, submit removal requests, re-warm from under 100 emails/day
- Recovery timeline: 30-90 days for full remediation; some blacklists (Spamhaus) are extremely difficult to clear
- When to abandon: if on Spamhaus with denied appeals, if inbox placement remains 0% after weeks, if Gmail/Outlook/Yahoo are outright blocking
- Mitigation: some operators use multiple tracking subdomains (track1.domain.com, track2.domain.com) to distribute risk

**Implication:** Custom tracking domains carry concentration risk. Monitor continuously with MXToolbox. Consider multiple tracking subdomains for redundancy. The 30-90 day recovery timeline means a blacklisted tracking domain effectively kills campaigns for a quarter.

---

## Summary Decision Matrix: Configuration Recommendations

| # | Sub-Topic | Recommendation | Confidence |
|---|-----------|---------------|------------|
| 1 | Does including links hurt deliverability? | Yes. 0 links = best. 1-2 links = 89% inbox. 7+ links = 34% inbox. 73% more spam at 6+ links. | HIGH |
| 2 | Same domain vs. different subdomain | Subdomains of same root are safe (relaxed DMARC). Different root domains raise flags. Tracking domains MUST align with sending domain. | MEDIUM-HIGH |
| 3 | UTM parameters impact | Safe -- no redirect, domain visible to filters. Keep strings short. Preferred over redirect tracking. | MEDIUM-HIGH |
| 4 | Unsubscribe: custom link vs RFC 8058 vs text | Text-based opt-out for < 5K/day ("Not relevant? Let me know."). RFC 8058 header for 5K+/day bulk. | MEDIUM-HIGH |
| 5 | Click tracking vs. plain links | Disable click tracking. -10% to -15% reply penalty (Instantly data). Custom domain mandatory if enabled. | HIGH |
| 6 | Link shorteners | NEVER. Blocklisted (Spamhaus), Gmail auto-blocks. Use branded domains if needed. | HIGH |
| 7 | Optimal number of links | 0 for first touch, 1 for follow-ups, max 2 including signature. +0.8 SpamAssassin points per link beyond 3rd. | HIGH |
| 8 | HTTP vs. HTTPS | Always HTTPS. Gmail flags HTTP. Mixed content is a spam signal. SSL on tracking domains mandatory. | MEDIUM-HIGH |
| 9 | Custom tracking domains | Required for any tracking. CNAME subdomain of sending domain, SSL, warmed 1-2 weeks before live use. | HIGH |
| 10 | New/cold domains in links | 30+ days age minimum. Live content required. Safe Browsing flags new domains. LinkedIn/Calendly links always safe. | MEDIUM-HIGH |
| 11 | Link placement (body vs. signature) | 0 links in body for first touch. Signature can hold 1 text-only domain mention. Total budget: 1-2 max. | MEDIUM |
| 12 | Gmail/Microsoft heuristics | Gmail: multi-layer AI + Safe Browsing + personalized engagement. Microsoft: anchor text mismatch is critical. Keep spam rate < 0.3%. | HIGH |

---

## The Optimal Cold Email Link Configuration (Synthesis)

**Tier 1: Maximum Deliverability (First Email)**
- 0 links in body
- 0-1 links in signature (plain-text domain mention, not hyperlinked)
- No tracking (open or click)
- Text-based opt-out: "If this isn't relevant, reply and I'll remove you"
- Expected inbox placement: 89%+

**Tier 2: Balanced (Follow-up Emails After Engagement)**
- 1 link in body (HTTPS, direct URL, no redirect)
- 0 links in signature
- No click tracking; custom tracking domain if tracking needed
- Total: 1 link maximum
- Expected inbox placement: ~85-89%

**Tier 3: Tracking Enabled (Short-term A/B Tests Only)**
- 1 link in body with custom tracking domain (aligned, warmed, SSL)
- 0 links in signature
- Open tracking disabled; click tracking via custom domain
- Total: 1 link, 1 redirect
- Expected inbox placement: ~76-85%

**Never Use:**
- Public URL shorteners (bit.ly, t.ly)
- Default/shared tracking domains
- HTTP links
- 3+ links in body
- Domain-name anchor text mismatching destination
- Multiple redirect chains

---

---

## Finding 26: Sibling Subdomains Are Treated Identically to Sender Domain for Link Reputation

**Confidence:** HIGH (strong circumstantial — no single authoritative source explicitly states this, but all underlying mechanisms confirm it)

**The specific question:** Sending from `hi.inkeep.com` — are links to `link.inkeep.com` treated differently than links to `hi.inkeep.com` or `inkeep.com`?

**Evidence that root-domain-level evaluation applies:**

1. **SURBL explicitly normalizes URIs to the root two-level domain** before checking. `link.inkeep.com`, `hi.inkeep.com`, and `inkeep.com` ALL resolve to `inkeep.com` for SURBL purposes. Subdomains are not independently listed. ([SURBL FAQ](https://www.surbl.org/faqs))

2. **Spamhaus DBL primarily lists at the root domain level** — all subdomains of a listed domain return "listed." Recently added hostname-level listings for "abused-legit" category only (legitimate domains with specific abused subdomains). ([Spamhaus DBL docs](https://www.spamhaus.org/blocklists/domain-blocklist/))

3. **Barracuda** supports wildcard domain matching: specifying `abc.com` matches `www.abc.com` and `secure.abc.com`. ([Barracuda Campus](https://campus.barracuda.com/product/emailgatewaydefense/doc/96022988/intent-domain-policies/))

4. **Al Iverson (SpamResource)** explicitly stated ISPs do NOT simply compare tracking domain to sending domain and flag mismatches. Did not address subdomain-level granularity specifically but the statement implies sibling subdomains are fine. ([SpamResource April 2021](https://www.spamresource.com/2021/04/ask-al-what-if-domains-dont-match.html))

5. **Laura Atkins (Word to the Wise)** identifies URL/link domains as building reputation independently from sender domains but does not distinguish subdomain-level granularity. ([Word to the Wise March 2021](https://wordtothewise.com/2021/03/domains-and-reputation/))

6. **Platform behavior confirms root-domain matching:** Smartlead allows a single tracking subdomain across ALL sending accounts regardless of sender subdomain. Woodpecker says links should match "your domain" (not "your exact subdomain"). Lemlist recommends sibling subdomains like `trail.yourdomain.com`. Instantly shows `inst.yourdomain.com` without sender subdomain matching requirement.

**Critical clarification: DMARC alignment does NOT apply to links.** DMARC relaxed/strict alignment governs only the relationship between From header, SPF domain, and DKIM d= domain. Multiple authoritative sources (dmarcian, EasyDMARC, Google DMARC docs) confirm DMARC does not validate URLs in the email body. The "organizational domain" concept from DMARC does NOT formally extend to link evaluation — but URL blocklists independently arrive at the same root-domain-level evaluation.

**The honest gap:** No ESP, ISP, or deliverability expert has explicitly documented that sibling subdomains are treated identically to the exact sender subdomain for link reputation. This inference is based on: (a) URL blocklists explicitly operating at root domain level, (b) platforms universally recommending sibling subdomains, (c) no source ever distinguishing between sibling subdomains.

**Implication:** `link.inkeep.com`, `hi.inkeep.com`, and `inkeep.com` are treated identically for link reputation when sending from `hi.inkeep.com`. Use any subdomain structure that makes operational sense — the spam filter evaluation happens at the root domain level.

**Sources:** SURBL FAQ, Spamhaus DBL docs, Barracuda Campus, SpamResource (Al Iverson), Word to the Wise (Laura Atkins), dmarcian, EasyDMARC, Google DMARC docs, Instantly/Smartlead/Lemlist/Woodpecker platform documentation

---

## Finding 27: Link Cloaking (Iframe-Based, e.g. Dub.co) — Technical Alternative to Redirects

**Confidence:** HIGH (source code verified from dub.co open-source repository)

Dub.co's "link cloaking" is an iframe-based approach, NOT a reverse proxy:

**Technical mechanism (verified from github.com/dubinc/dub source code):**
1. Request hits short link domain
2. Next.js middleware intercepts, uses `NextResponse.rewrite()` to internally route to `/cloaked/[url]`
3. Server responds with **200 OK** (no Location header, no 301/302)
4. HTML body contains full-screen borderless `<iframe src="destination-url">`
5. Click logged server-side in middleware `ev.waitUntil(recordClick(...))` before the rewrite

**Key files:** `apps/web/lib/middleware/link.ts` (line 347 — rewrite vs redirect logic), `apps/web/app/cloaked/[url]/page.tsx` (line 36 — iframe render), `packages/utils/src/functions/is-iframeable.ts` (X-Frame-Options/CSP check)

**HTTP response comparison:**
- Standard redirect: 301 + Location header → Gmail follows redirect chain
- Dub.co cloaking: 200 OK + iframe HTML → Gmail sees normal page, no redirect to follow

**Email deliverability implications:**
- The 200 OK response means redirect-following scanners have nothing to follow — this is a real advantage
- However, sophisticated scanners may extract the iframe `src` attribute and evaluate that URL
- iframes can be treated as suspicious by anti-spam systems
- Many destination sites block iframing (X-Frame-Options: DENY, CSP frame-ancestors)
- Dub.co does NOT market cloaking as an email deliverability feature — positioned as branding only

**Sources:** Dub.co GitHub repo (dubinc/dub), Dub.co help article on link cloaking, Next.js NextResponse documentation

---

## Finding 28: Redirect-Free Tracking Alternatives for Cold Email

**Confidence:** MEDIUM-HIGH (technical analysis; limited deliverability-specific testing data)

Three alternatives to 301 redirects for tracking cold email clicks:

**Option A: Direct link + UTM + server-side logging (best deliverability)**
- Link in email: `inkeep.com/demo?utm_source=cold_email&utm_campaign=feb2026&ref=abc123`
- Zero redirects. Perfect domain alignment with sender. 200 OK response.
- Server-side middleware logs visits with UTM/ref params before serving page
- Per-recipient tracking via unique `ref` param
- Trade-off: email platform (Instantly etc.) doesn't get click data — tracked in own analytics (PostHog, GA)

**Option B: Custom subdomain 301 redirect (good deliverability)**
- Link in email: `link.inkeep.com/schedule` → 301 → `inkeep.com/demo?utm=...`
- Single redirect, same root domain, controlled reputation
- Gmail follows redirect but both domains are inkeep.com family = positive signal
- Small deliverability cost from redirect detection

**Option C: Reverse proxy on subdomain (complex, best tracked deliverability)**
- Link in email: `link.inkeep.com/schedule` serves `inkeep.com/demo` content via reverse proxy with 200 OK
- No redirect for scanners to follow. Click logged server-side.
- Trade-offs: relative URLs break, cookies break, SPA routing breaks, CORS issues. Only practical for simple pages.

**What Gmail/Outlook pre-delivery scanners follow:**
- 301/302 redirects: YES, full chain
- Reverse proxy (200 OK): NO redirect to follow — sees normal page
- JavaScript redirects: NO — scanners don't execute JS
- Meta refresh: INCONSISTENT — some scanners follow, some don't
- Iframe src: MAY extract and evaluate the URL

**The "zero links" literature gap:** The SmartReach 89%→34% data and blanket "zero links" advice are based on datasets where most senders use platform default tracking domains (shared reputation) plus open tracking pixels (15% spam penalty). No published study isolates the deliverability impact of a single clean custom-domain direct link vs. zero links. The mechanisms that make links dangerous (shared domain reputation, phishing-signal redirects, tracking pixels) do not apply to Option A (direct link with UTM).

**Implication:** For senders linking to their own domain, direct links with UTM parameters and server-side logging (Option A) offer the best deliverability — zero redirect overhead, perfect domain alignment, 200 OK response. The "zero links" advice is primarily warning against platform tracking redirects (Option B/C), not against clean direct links to your own domain.

**Sources:** Dub.co source code, SparkPost reverse proxy documentation, Gmail pre-delivery scanning docs, Woodpecker link tracking documentation, Suped redirect deliverability analysis

---

*This evidence document now contains 28 findings. Findings 26-28 added 2026-02-07 (deep dive on subdomain matching, link cloaking mechanics, and redirect-free tracking alternatives). Additional sources: SURBL FAQ, Spamhaus DBL documentation, Barracuda Campus, SpamResource (Al Iverson), Word to the Wise (Laura Atkins), dmarcian, EasyDMARC, Dub.co open-source repository (github.com/dubinc/dub), Gmail/Outlook pre-delivery scanning documentation.*
