# Email Header / Newsletter Image

Standard for email marketing images — headers, hero images, and newsletter graphics.

## Dimensions

| Element | Display Width | Create At (2x retina) | Max File Size |
|---|---|---|---|
| **Email template width** | 600 px | — | — |
| **Header / banner** | 600 px | **1200 px** | < 200 KB |
| **Hero image** | 600 px | **1200 px** | < 400 KB |
| **Body images** | 600 px max | **1200 px max** | < 100 KB |

| Property | Value |
|---|---|
| **File formats** | JPG, PNG, or GIF only (no WebP/AVIF — email clients don't support them) |
| **Aspect ratio** | ~3:1 for headers (1200 x 400), ~2:1 for hero images (1200 x 600) |

**Always create images at 2x** the display size for retina sharpness. Constrain with `width="600"` in HTML. Don't rely on `srcset` — email client support is inconsistent.

## Deliverability constraints

| Rule | Limit | Why |
|---|---|---|
| **Individual image** | < 200 KB (ideally < 100 KB) | Loading speed on mobile data |
| **Hero image** | < 400 KB | Acceptable for one large image |
| **Total email HTML** | < 100 KB | Gmail clips emails at 102 KB |
| **Text-to-image ratio** | 60% text / 40% images | Image-heavy emails trigger spam filters |
| **Max images per email** | 3-5 | More than 2 images raises spam risk by 40% |

**Base64 encoding adds ~37%** to transmitted file size. A 100 KB image becomes ~137 KB in the email.

## Dark mode considerations

Many email clients (Apple Mail, Outlook, Gmail) modify images in dark mode:

- **Use transparent PNGs** for logos and icons — they adapt to both light/dark backgrounds
- **Add glow, stroke, or translucent outline** around dark elements on transparent backgrounds
- **Avoid pure black (#000000)** text in images — use dark gray (#1A1A1A). Pure black looks jarring when inverted
- **Use mid-tone colors** with 4.5:1 contrast against both white and black backgrounds
- **Test across clients** — Apple Mail, Outlook 2019+, and Gmail handle dark mode differently

## Design guidelines

### Text
- **Keep text minimal** in images — include key message only
- **Always include alt text** — Outlook blocks images by default in many configurations
- **Min font: 24px** at 1200px (2x) — readable at 600px display
- If the entire message is in the image, it won't be readable when images are blocked

### Composition
- **43% of email opens happen on mobile** — design for mobile first
- **Keep critical content in first 300-500 px vertically** (above the fold)
- **Balanced aspect ratio** — tall banners that look fine on desktop fill entire mobile screens
- Use **`display: block;`** on images to prevent unwanted gaps in email clients

### Brand elements
- Consistent header design across emails builds recognition
- Logo in the header should be a transparent PNG for dark mode compatibility
- Match your email visual identity to your website/social presence

### What to avoid
- Images wider than 600 px display width (email templates clip)
- Relying solely on images to convey the message (images are often blocked)
- Animated GIFs larger than 1 MB (slow loading, some clients don't animate)
- Embedding critical text only in images without alt text fallback
- White logos on white backgrounds without dark mode consideration
