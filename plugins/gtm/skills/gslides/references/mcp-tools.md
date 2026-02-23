# MCP Tool Reference

Use when: Creating or modifying slides, choosing between MCP servers for a specific operation
Priority: P0
Impact: Wrong tool chosen; inefficient slide creation; missed capabilities

---

## Server overview

| Server | Transport | Auth | Best for |
|---|---|---|---|
| `figma` | HTTP | OAuth (per-user, on first use) | Brand tokens, design assets, logos |
| `google-slides` | stdio | gcloud ADC | Full slide creation and manipulation (50+ tools) |

## Figma MCP (`figma`)

Access Figma design files for brand tokens and visual assets.

| Capability | Use for |
|---|---|
| Read file/node data | Extract colors, typography, component specs |
| Get styles | Pull named color and text styles from the design system |
| Export assets | Get logo and icon images |

## Google Slides MCP (`google-slides`)

50+ granular Slides tools via `dovstern/google-slides-mcp`.

### Core operations

| Tool | Purpose |
|---|---|
| `create_presentation` | Create a blank presentation |
| `get_presentation` | Get full presentation details |
| `add_slide` | Add a slide with optional layout |
| `duplicate_slide` | Clone an existing slide |
| `delete_slide` | Remove a slide |
| `move_slide` | Reorder slides |

### Content

| Tool | Purpose |
|---|---|
| `add_text_box` | Add a text box with position and size |
| `add_image` | Add an image from URL with position and size |
| `update_text_style` | Style text (font, size, color, bold, italic) |

### Styling

| Tool | Purpose |
|---|---|
| `set_background_color` | Set slide background color |
| `batch_update` | Apply multiple updates in one call |

## Decision guide

| Need | Approach |
|---|---|
| Brand tokens, design assets | Use `figma` MCP to read design system |
| Create a new presentation | `mcp__google-slides__create_presentation` |
| Read an existing deck | `mcp__google-slides__get_presentation` |
| Precise text/image placement | `mcp__google-slides__add_text_box`, `add_image` |
| Bulk styling changes | `mcp__google-slides__batch_update` |
| Clone an existing deck | `mcp__google-slides__get_presentation` to read, then recreate slides |

> Tool names are prefixed with the MCP server name when called, e.g.:
> `mcp__google-slides__create_presentation`
