Use when: Creating any animated visual (video scenes, slide transitions, animated graphics) — motion principles and patterns
Priority: P1
Impact: Inconsistent animation style, snappy/bouncy motion that doesn't match brand, simultaneous animations that lack hierarchy

---

# Motion Philosophy

Inkeep's animation identity — principles and standard patterns. For tool-specific implementation (Remotion code, easing functions, frame timing), see the consuming skill's own motion reference.

---

## Principles

1. **Smooth, not snappy** — Use ease-out curves, not linear or bounce
2. **Subtle movement** — Y-offset of 20-30px, not dramatic slides
3. **Sequential, not simultaneous** — Stagger elements for visual hierarchy
4. **Purpose-driven** — Every animation should guide attention

---

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Use consistent easing curves | Mix different easing styles |
| Stagger related elements | Animate everything at once |
| Keep Y-offset subtle (20-30px) | Use large dramatic movements |
| Draw underlines left-to-right | Use bounce or spring effects |
| Fade logos to 0.75-0.9 opacity | Leave logos at full opacity |
| Use viewport triggers on scroll | Auto-play all animations |

---

## Standard motion patterns

These patterns define the brand's motion vocabulary. Implementations vary by tool (Remotion uses frames, CSS uses seconds, slides use transitions) but the principles are constant.

### Fade-up reveal (most common)
- Elements appear by fading in while translating up 20-30px
- Duration: ~0.5s (15 frames at 30fps)
- Easing: ease-out cubic
- Use for: most element entrances — text, cards, images

### Underline draw
- Blue underline scales horizontally from left to right
- Duration: ~0.6s (18 frames at 30fps)
- Typically follows a headline reveal with a short delay (~0.5s)
- Direction: always left-to-right

### Staggered grid reveal
- Multiple items appear in sequence, not simultaneously
- Stagger delay: 0.1-0.3s between items (3-9 frames at 30fps)
- Each item uses the standard fade-up pattern
- Creates visual hierarchy and guided attention flow

### Section transitions
- Between major content sections, use a simple opacity fade with slight scale
- Scale: 0.995 → 1.0 (nearly imperceptible, but prevents flat transitions)
- Duration: ~0.5s
- Keep transitions smooth — no hard cuts between content sections
