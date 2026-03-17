# Blog Cover / Thumbnail

Standard for blog post hero images and thumbnail graphics on the Inkeep marketing site.

## Dimensions

| Property | Value |
|---|---|
| **Size** | 2560 x 1440 px |
| **Aspect ratio** | 16:9 |
| **File format** | PNG |
| **Min acceptable size** | 1600 x 900 px |

The site renders blog thumbnails at multiple sizes depending on context:
- **Blog post card**: 16:9, responsive (25vw–100vw depending on breakpoint)
- **Featured post**: 2:1 crop (wider — design the center of the image to work at this ratio too)
- **Lead story card**: 960 x 540 px rendering
- **Related posts grid**: 16:9, responsive

Design for 16:9 but keep the focal content centered so the 2:1 crop for featured posts doesn't lose important elements.

## Design guidelines

### Text
- **Title text**: 80–140px at 2560w (scales down well to card sizes)
- **Subtitle/supporting text**: 40–60px at 2560w
- **Keep text to the left or center** — right-edge text can get cropped on smaller card views
- **Max 2 lines of title text** — thumbnails are viewed small; more text becomes unreadable
- **High contrast** — ensure text is readable even at card sizes (~300px wide)
- **Thumbnail readability test (REQUIRED):** After final composition, export the frame at thumbnail size via `figma_execute` and visually verify the title is still legible:
  ```javascript
  const node = await figma.getNodeByIdAsync('FRAME_ID');
  const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 300 } });
  // Visually verify title text is readable at this size
  ```
  If the title is unreadable at 300px wide, increase font size or simplify the composition. Titles below 100px at 2560w generally fail this test.

### Composition
- **Z-pattern layout** (research-backed, NNG eye-tracking): hook/title top-left, key visual center, brand/CTA bottom-right
- **One clear focal point** — thumbnails are viewed at small sizes; busy compositions turn to noise
- **Leave breathing room** — don't fill edge-to-edge; maintain ~80px padding from frame edges at 2560w
- **High contrast is the #1 proven visual signal** — more color complexity drives attention in feeds (Notre Dame, peer-reviewed)
- **Symmetrical/balanced layouts signal trust** for B2B (JMR, peer-reviewed). Save asymmetry for exciting launches
- **Background should be simple** — solid color, subtle gradient, or minimal pattern. Complex backgrounds compete with the title

### Brand elements
- **Inkeep logo or wordmark** — include but keep subtle (badge, corner placement). The blog already shows "Inkeep" in the page chrome
- **Use brand colors from the design system** — don't eyeball hex values. Primary blue (#3784FF), warm background (#FBF9F4), dark text (#231F20)
- **Third-party logos** — if the post is about an integration (Slack, GitHub, etc.), use the real logo from the Brand Assets page, never an approximation

### What works well
- UI mockup + bold title (shows the product in context)
- Abstract/geometric illustration + title (clean, editorial feel)
- Dark background with light text (stands out in a feed of light thumbnails)
- Single strong visual metaphor (network graph, workflow diagram, etc.)

### What to avoid
- Stock photo aesthetic (generic office scenes, handshakes)
- Too many visual elements competing for attention
- Tiny text that's unreadable at card sizes
- Gradients that make text hard to read
- Putting critical content in the bottom 20% (often cropped or overlaid by the blog card UI)
