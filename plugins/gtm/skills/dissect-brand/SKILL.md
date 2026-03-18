---
name: dissect-brand
description: Analyze a company's visual design language across all marketing asset types — blog covers, changelogs, integrations, customer stories, testimonials, logo walls, stat cards, landing pages, and product UI presentation. Produces a structured evidence file with measured proportions, design system observations, and quality ratings. Use when asked to study, benchmark, or analyze another company's design, brand identity, or marketing graphics.
argument-hint: "<domain> [domain2] [domain3] (optional: --output path/to/output-dir)"
disable-model-invocation: true
---

# Brand Dissection

Systematically analyze how a B2B company designs its marketing graphics. Produces a structured evidence file per company with measured proportions, visual analysis across every design facet, and actionable takeaways.

This skill is designed to be invoked via `/nest-claude` for parallelism — each session analyzes 1-4 companies with its own full context window. Multiple sessions run concurrently, each writing per-company evidence files to a shared output directory. An orchestrator session then synthesizes across all dissections.

## Input

`$ARGUMENTS` contains one or more company domains and an optional output directory:

```
/dissect-brand resend.com decagon.ai neon.com --output ~/reports/visual-playbook/dissections
```

**Defaults:**
- If `--output` is not specified, deliver findings in the conversation (not to a file)
- If `--output` IS specified, write one file per company: `{output-dir}/{domain-slug}.md` (e.g., `resend-com.md`)

## Workflow

### Step 1: Set up workspace

Create directories for image downloads and persistent evidence. Use the company domain slug for namespacing:

```bash
# Temp workspace for raw downloads
mkdir -p /tmp/dissect/thumbs

# Persistent evidence directory (alongside the dissection .md files)
# If --output is ~/reports/visual-playbook/dissections, create:
#   ~/reports/visual-playbook/dissections/images/{company-slug}/
# This preserves the actual images for human review and orchestrator spot-checking
```

For each company being analyzed, create its image evidence directory:
```bash
mkdir -p {output-dir}/images/{company-slug}
```

**Why save images persistently:** The dissection markdown describes what you saw, but the orchestrator and humans need to LOOK at the images to verify claims, spot-check proportional measurements, and make their own judgments. Text descriptions of visual design are inherently lossy — the image is the ground truth.

### Step 2: For each company, discover asset pages

Visit the company's website and locate pages for each asset type. Not every company has all types — skip what doesn't exist, note it as "Not found."

| Asset type | Where to look | What you're looking for |
|---|---|---|
| **Blog covers** | `/blog`, `/news`, `/posts` | Thumbnail/hero images on blog listing + individual posts |
| **Changelog graphics** | `/changelog`, `/updates`, `/releases`, `/whats-new` | Per-entry graphics, template system |
| **Integration cards** | `/integrations`, `/partners`, `/ecosystem`, or integrations section on homepage | Logo pairings, integration showcase cards |
| **Customer stories** | `/customers`, `/case-studies`, `/stories` | Hero images, card thumbnails, metric displays |
| **Testimonial quotes** | Homepage, `/customers`, landing pages | Quote cards, avatar+quote formatting |
| **Logo wall** | Homepage "trusted by" section, `/customers` | Logo grid, treatment (mono vs color), density |
| **Stat/metric cards** | Blog thumbnails, case studies, landing page sections | Standalone stat graphics, data callouts |
| **Landing page hero** | Homepage (`/`) | Main product hero visual, above-the-fold graphic |
| **Product UI presentation** | Blog posts, landing pages, feature pages | How they show their product: raw screenshots, stylized mockups, abstract representations, or never shown |

Use WebFetch to load each page. Extract image URLs from `og:image` meta tags, `img` src attributes, or CSS background-image properties.

### Step 3: Download and prepare images

For each asset type, download 2-4 representative images. Save to BOTH temp (for analysis) and evidence directory (for persistence).

**Naming convention:** `{type}-{slug}.png` where type is one of: `blog`, `changelog`, `integration`, `customer`, `quote`, `logo-wall`, `stat`, `hero`, `product-ui`

```bash
# Download original
curl -sL -o /tmp/dissect/{company}-{type}-{slug}.{ext} "IMAGE_URL"

# Record source dimensions (ALWAYS do this — critical data)
sips -g pixelWidth -g pixelHeight /tmp/dissect/{company}-{type}-{slug}.{ext}

# Resize for analysis (800px max — prevents image reading crashes)
sips -s format png -Z 800 /tmp/dissect/{company}-{type}-{slug}.{ext} \
  --out /tmp/dissect/thumbs/{company}-{type}-{slug}.png

# Save to persistent evidence directory (resized copy for human review)
cp /tmp/dissect/thumbs/{company}-{type}-{slug}.png \
  {output-dir}/images/{company-slug}/{type}-{slug}.png
```

Convert non-PNG formats (avif, webp) during resize:
```bash
sips -s format png -Z 800 source.avif --out /tmp/dissect/thumbs/output.png
```

**What gets saved persistently:**
- Resized PNGs (800px max) in `{output-dir}/images/{company-slug}/` — small enough to browse, large enough to see detail
- Source URLs and dimensions recorded in the dissection markdown (Raw data section)
- The dissection .md file references these images by relative path: `images/{company-slug}/{type}-{slug}.png`

**What stays in /tmp only:**
- Original full-resolution downloads (too large to keep permanently)

### Step 4: Analyze each image

⛔ **Read images ONE AT A TIME.** After reading each image, write your complete analysis before reading the next. Reading multiple large images in one turn causes crashes.

**Load:** `references/analysis-rubric.md` for the complete list of facets to evaluate per image.

For each image, work through the rubric systematically. The proportional measurements (margins, heading size, content coverage) are the MOST valuable output — measure quantitatively, not qualitatively. Say "heading is ~14% of canvas height at 1920px source" not "large heading."

### Step 5: Assess brand system (after analyzing 3+ images from the same company)

Look ACROSS all the images you've analyzed for this company:

- **Locked elements:** What stays constant? (Logo position, badge style, font, background treatment, corner radius, shadow style)
- **Variable elements:** What changes per asset? (Color, visual content, layout specifics)
- **Recognizability test:** Could you identify this company's thumbnail from a grid of 50 companies? What creates that recognition?
- **Consistency vs monotony:** How do they vary within their system without breaking it?
- **Evolution:** If you see older vs newer posts, has the style evolved? What changed?

### Step 6: Rate and summarize

Rate the company on each dimension (1-5 scale):

| Dimension | What it measures |
|---|---|
| **Consistency** | Do all assets feel like one brand? |
| **Craft quality** | Typography, spacing, color, shadow, alignment — attention to detail |
| **Creativity/distinctiveness** | Unique or generic? Would you remember this? |
| **Product showcase** | How effectively do they show what the product actually does? |
| **Small-size readability** | Does the thumbnail work at ~300px wide (card size)? |
| **Brand system strength** | How well-defined is the locked-vs-variable system? |
| **Emotional coherence** | Does the visual register match the product positioning? |

Write 3 key takeaways — the most important things another company could learn from studying this brand.

### Step 7: Write output

Write the evidence file in the format specified in `references/output-template.md`.

If `--output` was specified, write to `{output-dir}/{domain-slug}.md`. If not, deliver in conversation.

## Operating principles

### Develop taste, don't just catalog

The goal is NOT a spreadsheet of dimensions. For each image, ask:
- What emotion does this evoke?
- Would I stop scrolling for this in a LinkedIn feed? Why or why not?
- What would this look like at 300px wide in a blog card? Does it still work?
- If I removed the text, would the visual alone communicate anything?

### Be honest about quality

Not every company is good at every asset type. If their case study graphics are mediocre, say so — and explain WHY compared to their own blog covers or compared to other companies. The contrast between strong and weak work is instructive.

### Notice what's absent

The best design is often defined by restraint. For each company, actively study:
- What they DON'T include (no subtitle? no logo? no badge? no product UI?)
- Where they resist adding "one more thing"
- The ratio of signal to decoration — is every element earning its place?

### Consider context, not just the image

- View the blog listing page as a WHOLE — do thumbnails create a cohesive visual rhythm?
- Check how the image renders at card size (~300px) and OG preview size (~600px)
- Look at the actual blog post page — how does the hero relate to the content below?

### Measure, don't describe

**Bad:** "The heading is large and bold"
**Good:** "The heading is ~14% of canvas height (~140px at 1920w source), set in what appears to be a Didone serif at weight ~700. It occupies the left 40% of the frame. The weight contrast between heading and subtitle is approximately 5:1."

## Quality bar

Must have:
- [ ] Every asset type page was visited (or confirmed not to exist)
- [ ] At least 2 images downloaded and analyzed per asset type that exists
- [ ] Source dimensions recorded for every image
- [ ] Proportional measurements in the output (margins %, heading %, content coverage %)
- [ ] Brand system assessment (locked vs variable elements)
- [ ] Quality ratings with justification
- [ ] 3 key takeaways
- [ ] Honest assessment — weaknesses noted alongside strengths

Should have:
- [ ] 3-4 images per asset type for Tier 1 companies
- [ ] Typography identification (font classification + reasoning)
- [ ] Color palette documentation
- [ ] Texture/depth analysis
- [ ] Emotional register assessment
- [ ] "What's absent" observations

## Anti-patterns

- **Rushing through images** — proportional measurements are the most valuable output. Don't skip them.
- **Dimension myopia** — measuring pixels while ignoring emotion, craft, and brand system. Consider ALL facets from the rubric.
- **Catalog without judgment** — develop taste. Express opinions. Say what's good, what's mediocre, and why.
- **Isolation analysis** — analyzing images without viewing them in their page context (the listing grid, the post page, social preview size)
- **Forced positivity** — honest assessment of weak work is more useful than manufactured praise
- **Skipping "what's absent"** — restraint is a design choice worth documenting
- **Qualitative measurements** — "large heading" tells the reader nothing. "14% of canvas height" is actionable.
- **Multi-image reads** — reading 2+ images in the same turn causes crashes. ONE AT A TIME.
- **Missing source dimensions** — always record the original pixel size and aspect ratio before resizing
