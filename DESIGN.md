# Design System: Inkeep

## Overview

A warm, approachable interface for an AI Agent platform serving developer and customer operations teams. The aesthetic bridges technical precision with human warmth — hand-drawn illustration strokes soften structured layouts, generous whitespace creates breathing room in dense product surfaces, and a warm cream foundation replaces the cold sterility of typical SaaS blues and grays.

The personality is confident but not corporate. Humble formidability — authority without arrogance. Visuals emphasize human-AI collaboration (partnership, not replacement), developer clarity (structure before decoration), and practical intelligence (every graphic serves a functional purpose). Slight irregularities in illustration strokes create approachability within technical environments.

The emotional anchor is **trust and control**. The customer should feel they own their AI Agents and can trust them. The narrative enemy is fragmentation and complexity, not a competitor. The customer is framed as a builder — they create, ship, deploy — and Inkeep is the platform that enables them.

## Colors

- **Primary** (#3784FF): Brand blue — CTAs, links, primary accent, icon linework, badge backgrounds, active states
- **Golden Sun** (#FFC883): Warm accent — badges, highlights, decorative elements, subtitle accent on dark backgrounds. Use sparingly, never for primary UI
- **Sky Blue** (#69A3FF): Hover states, secondary blue elements, focus ring outer
- **Crystal Blue** (#D5E5FF): Subtle highlights, button backgrounds, light blue fills, illustration wash
- **Lavender Blue** (#D0E1FF): Decorative backgrounds, secondary surfaces
- **Accent Warm** (#FBE1BC): Warm accent — orange highlight, badges
- **Accent Cool** (#E1DBFF): Cool accent — purple highlight, developer section accent
- **Surface Cream** (#FBF9F4): Main page background — warm cream. NEVER use pure white (#FFFFFF) as a page background
- **Surface Card** (#F7F4ED): Card and panel surfaces, provides subtle contrast against page background
- **Surface Dark** (#231F20): Dark backgrounds, dark mode sections
- **Surface White** (#FFFFFF): White for cards on colored backgrounds, overlays, and modals only — never as page background
- **Text Primary** (#231F20): Headings and primary body text
- **Text Muted** (#5F5C62): Secondary text, captions, descriptions
- **Text Dark Blue** (#29325C): Dark text on light blue backgrounds
- **Card Warm Peach** (#FFE8CF): Feature card background — rotate with siblings for visual variety in grids
- **Card Warm Gray** (#F0ECE3): Feature card background
- **Card Light Blue** (#DCE8FA): Feature card background
- **Card Light Purple** (#ECE7FB): Feature card background
- **Card Lavender** (#E9DCFA): Integration card background — support/helpdesk platforms
- **Card Soft Blue** (#DAE6FE): Integration card background — documentation/ticketing
- **Card Ice Blue** (#DCF2FB): Integration card background — knowledge base/data sources
- **Illustration Wash Blue** (#EDF3FF): Very light blue wash for illustration fill areas
- **Error/False Indicator** (#F472B6): Pink — comparison table "no" indicator
- **Icon Gray** (#676566): Close and dismiss icon color
- **Disabled/Divider** (#BDBDBD): Disabled states, dividers, borders

Blue icons on blue backgrounds — NEVER. Blue icons disappear on blue. Use white or dark variants instead. Maximum 3 colors in the surround area of any composition (background, heading text, one accent).

## Typography

- **Headlines**: Neue Haas Grotesk Display Pro, weight 400, tight leading (95%), negative letter-spacing (-0.64px). Hero H1 at 80px desktop / 40px mobile, Section H2 at 64px desktop / 40px mobile, Card titles at 40px desktop / 32px mobile
- **Body**: Noto Serif, weight 300, relaxed leading (125%), 20px. Warm, explanatory, human-first language
- **Labels/UI**: JetBrains Mono, weight 500, ALWAYS uppercase for UI labels. Tags, eyebrows, buttons, H3 (28px), H4 (20px). Negative letter-spacing (-0.96px)
- **Interactive**: Neue Haas Grotesk Display Pro, weight 500 for FAQ answers, links
- **Descriptions**: Neue Haas Grotesk Display Pro, weight 300

Never mix more than 2 typefaces in a single component. Titles in sentence case — only first letter capitalized. "Agent" always capitalized (brand term). Minimum 48px for headlines, 24px for body text.

Headline/body font relationship: Neue Haas (refined Swiss sans-serif) for structure and impact, Noto Serif for warmth and readability in body text, JetBrains Mono for technical precision in UI chrome. The contrast between the elegant sans-serif headings and the warm serif body creates a "technical yet human" feel.

## Elevation

This design uses whisper-soft shadows that barely announce themselves. Depth is conveyed through surface color variation (cream page → slightly darker cream cards) and subtle shadow on interaction.

- **Cards at rest**: 0 4px 18.4px rgba(0,0,0,0.04) — nearly imperceptible
- **Card hover**: 0 8px 30px rgba(0,0,0,0.08) — gentle lift
- **Sticky header / comparison table**: 0 8px 32px rgba(0,0,0,0.08)
- **Brand glow (header, chat button)**: 5px 6px 18px rgba(157,194,255,0.20) — blue-tinted, distinctive
- **Brand glow hover**: 6px 8px 22px rgba(157,194,255,0.24), 0 10px 36px rgba(0,0,0,0.10) — intensified
- **Modal/dialog**: 0 5px 23px rgba(0,0,0,0.04)
- **Dropdown**: 0 10px 40px rgba(0,0,0,0.08)
- **Focus ring**: 0 0 0 2px #FFFFFF, 0 0 0 4px #69A3FF — white ring + blue ring for accessibility

Never use drop shadows on illustrations — line weight variation handles depth instead.

## Components

- **Buttons**: JetBrains Mono, uppercase, weight 500. Primary uses brand blue (#3784FF) fill with white text, pill radius (9999px). Secondary uses cream-alt (#FFF5E1) with dark text and border. Tertiary uses 10px radius compact alternative. All buttons pill-shaped except tertiary
- **Cards**: Generously rounded corners — feature cards at 32px radius, standard cards at 20px, hero elements at 47-60px. The brand's signature aesthetic uses aggressively large radii compared to typical SaaS. Card surfaces use warm cream (#F7F4ED) with mix-blend-darken. Feature cards rotate through warm-peach, warm-gray, light-blue, light-purple backgrounds
- **Inputs**: 1px border, surface-variant background, 6px radius for form elements
- **Badges/Tags**: JetBrains Mono, uppercase, brand blue background with white text, pill radius
- **Navigation**: Logo in top-left corner, consistent position across all surfaces
- **Integration logo cards**: 11px radius, soft pastel background by category
- **Section headers**: Tag (JetBrains Mono, uppercase, brand blue) → 20px gap → Heading (Neue Haas, 64px) → 20px gap → Description (Noto Serif, muted) → 20px gap → Buttons

Spacing follows an 8px base unit: 4px (xs), 8px (sm), 16px (md), 24px (lg), 32px (xl), 48px (xxl). Section gaps at 100px. Maximum content width 1280px.

## Do's and Don'ts

- Do use warm cream (#FBF9F4) as the default page background — never pure white
- Do use hand-drawn illustration strokes with organic wobble and varying line weight for warmth
- Do stagger animations sequentially for visual hierarchy — never animate everything simultaneously
- Do lead with outcomes in headlines, then capabilities, then features — never lead with features
- Do maintain the Z-pattern layout: badge top-left → heading left → visual center-right → brand bottom
- Do fill 80-85% of any canvas — avoid the "floating in space" look
- Do bleed product mockups past the right edge to create energy
- Don't place blue icons on blue backgrounds — they disappear
- Don't use flat gradients without texture — add dot grids (2-3% opacity) or subtle blooms to prevent flatness
- Don't mix rounded and sharp corners in the same view
- Don't use more than 2 typefaces in a single component
- Don't use "revolutionary", "game-changing", "cutting-edge", "next-gen", or "industry-leading" — the brand voice is confident without hyperbole
- Don't use bounce or spring animation effects — motion is smooth and ease-out, with subtle 20-30px Y-offset
- Don't create decorative elements from scratch before checking the existing hand-drawn asset library (arrows, lines, marks, shapes)
