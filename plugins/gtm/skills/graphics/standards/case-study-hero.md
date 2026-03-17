# Case Study Hero / Thumbnail

Standard for case study images on the Inkeep marketing site.

## Dimensions

| Image type | Size | Aspect ratio |
|---|---|---|
| **Hero image** | 1800 x 840 px | ~2.14:1 |
| **Thumbnail** | 800 x 500 px | 8:5 (1.6:1) |
| **Company logo** | 600 x 600 px | 1:1 (square) |

The site renders case study thumbnails in cards at 16:9 aspect ratio with `object-cover`, so the thumbnail will be cropped from 8:5 to 16:9. Keep focal content in the center.

## Design guidelines

### Hero image (1800 x 840)
- Shown at the top of the case study page
- **Customer's brand should be prominent** — this is their story
- Include the customer's logo (real logo from Brand Assets or imported SVG — never approximated)
- Light, professional backgrounds — avoid competing with the article content below
- **No text overlay** unless it's a pull quote — the page provides the title and metadata

### Thumbnail (800 x 500)
- Shown in case study cards and listing pages
- Cropped to 16:9 in card views — design for center-crop
- Should be recognizable at small sizes (~300px wide)
- Customer logo + clean background is often sufficient
- Avoid fine detail — it's lost at card sizes

### Company logo (600 x 600)
- Displayed in the case study sidebar/metadata
- Square format — center the logo with padding
- White or transparent background
- Ensure the logo renders clearly at 48x48 px (the smallest it appears)

### Brand elements
- **Customer brand takes priority** — use their colors, their logo prominently
- **Inkeep branding is secondary** — small badge or no Inkeep logo at all (the site provides context)
- Pull customer logos from Brand Assets (`third-party/` prefix) when available
