# Inkeep Product Design Tokens

Product UI tokens extracted from `agents-manage-ui` source code. Use these when creating product mockups (fidelity levels 1–3). For marketing tokens (the surround, headlines, backgrounds), use `tokens/marketing.md`.

> **Two-layer rule:** Inside the product mockup → these tokens. Outside the mockup → marketing tokens from `tokens/marketing.md`. See `references/product-representation.md` for the decision framework.

---

## Foundation

| Property | Value |
|---|---|
| Component library | shadcn/ui — **new-york** style |
| Base color palette | **stone** (Tailwind) |
| Icon library | **lucide** |
| Sans font | **Inter** (Google Fonts, `--font-inter`) |
| Mono font | **JetBrains Mono** (Google Fonts, `--font-jetbrains-mono`) |
| Base radius | `0.625rem` (10px) |
| Brand color constant | `#3784ff` |

## Brand Colors

Defined in `@theme`. Colors marked *(marketing only)* are present in CSS but not used on product UI surfaces.

| Token | Value | Product usage |
|---|---|---|
| `azure-blue` | `#3784ff` | — |
| `sky-blue` | `#69a3ff` | — |
| `crystal-blue` | `#d5e5ff` | — |
| `morning-mist` | `#fbf9f4` | *(marketing only)* |
| `night-sky` | `#231f20` | — |
| `blue-dark` | `#29325c` | — |
| `cream` | `#f7f4ed` | *(marketing only)* |
| `white-cream` | `#fff5e1` | *(marketing only)* |
| `orange-light` | `#fbe1bc` | *(marketing only)* |
| `gray-light` | `#5f5c62` | based on azure blue (#3784ff) |

## Semantic Colors — Light Mode

| Token | Value | Notes |
|---|---|---|
| `background` | `oklch(1 0 0)` |  |
| `foreground` | `var(--color-stone-900)` |  |
| `card` | `oklch(1 0 0)` |  |
| `card-foreground` | `var(--color-stone-900)` |  |
| `popover` | `oklch(1 0 0)` |  |
| `popover-foreground` | `var(--color-stone-900)` |  |
| `primary` | `oklch(0.6321 0.1983 259.59)` |  |
| `primary-foreground` | `oklch(0.985 0 0)` |  |
| `secondary` | `var(--color-stone-100)` |  |
| `secondary-foreground` | `var(--color-stone-800)` |  |
| `muted` | `var(--color-stone-100)` |  |
| `muted-foreground` | `var(--color-stone-600)` |  |
| `accent` | `var(--color-stone-100)` |  |
| `accent-foreground` | `var(--color-stone-800)` |  |
| `destructive` | `oklch(0.577 0.245 27.325)` |  |
| `border` | `var(--color-stone-200)` |  |
| `input` | `var(--color-stone-200)` |  |
| `ring` | `var(--color-stone-400)` |  |
| `chart-1` | `#3784ff` (via `var(--color-azure-blue)`) |  |
| `chart-2` | `oklch(0.6 0.118 184.704)` |  |
| `chart-3` | `oklch(0.398 0.07 227.392)` |  |
| `chart-4` | `oklch(0.828 0.189 84.429)` |  |
| `chart-5` | `oklch(0.769 0.188 70.08)` |  |
| `sidebar` | `var(--color-stone-50)` |  |
| `sidebar-foreground` | `var(--color-stone-900)` |  |
| `sidebar-primary` | `var(--color-stone-800)` |  |
| `sidebar-primary-foreground` | `var(--color-stone-50)` |  |
| `sidebar-accent` | `oklch( 0.3773 0.1488 264.94 / 3.92% )` | based off of azure-900 with lower opacity |
| `sidebar-accent-foreground` | `oklch(0.5468 0.2329 262.71)` (via `var(--color-azure-600)`) |  |
| `sidebar-border` | `var(--color-stone-200)` |  |
| `sidebar-ring` | `var(--color-stone-400)` |  |
| `success` | `oklch(0.6321 0.1983 259.59)` (via `var(--color-azure-500)`) |  |
| `warning` | `oklch(0.65 0.18 75)` |  |

## Semantic Colors — Dark Mode

| Token | Value | Notes |
|---|---|---|
| `background` | `oklch(0.141 0.005 285.823)` |  |
| `foreground` | `oklch(0.985 0 0)` |  |
| `card` | `oklch(0.21 0.006 285.885)` |  |
| `card-foreground` | `oklch(0.985 0 0)` |  |
| `popover` | `oklch(0.21 0.006 285.885)` |  |
| `popover-foreground` | `oklch(0.985 0 0)` |  |
| `primary` | `#69a3ff` (via `var(--color-sky-blue)`) |  |
| `primary-foreground` | `oklch(0.21 0.006 285.885)` |  |
| `secondary` | `oklch(0.274 0.006 286.033)` |  |
| `secondary-foreground` | `oklch(0.985 0 0)` |  |
| `muted` | `oklch(0.274 0.006 286.033)` |  |
| `muted-foreground` | `oklch(0.705 0.015 286.067)` |  |
| `accent` | `oklch(0.274 0.006 286.033)` |  |
| `accent-foreground` | `oklch(0.985 0 0)` |  |
| `destructive` | `oklch(0.704 0.191 22.216)` |  |
| `border` | `oklch(1 0 0 / 10%)` |  |
| `input` | `oklch(1 0 0 / 15%)` |  |
| `ring` | `oklch(0.552 0.016 285.938)` |  |
| `chart-1` | `#69a3ff` (via `var(--color-sky-blue)`) |  |
| `chart-2` | `oklch(0.696 0.17 162.48)` |  |
| `chart-3` | `oklch(0.769 0.188 70.08)` |  |
| `chart-4` | `oklch(0.627 0.265 303.9)` |  |
| `chart-5` | `oklch(0.645 0.246 16.439)` |  |
| `sidebar` | `oklch(0.21 0.006 285.885)` |  |
| `sidebar-foreground` | `oklch(0.985 0 0)` |  |
| `sidebar-primary` | `oklch(0.488 0.243 264.376)` |  |
| `sidebar-primary-foreground` | `oklch(0.985 0 0)` |  |
| `sidebar-accent` | `oklch(0.274 0.006 286.033)` |  |
| `sidebar-accent-foreground` | `oklch(0.985 0 0)` |  |
| `sidebar-border` | `oklch(1 0 0 / 10%)` |  |
| `sidebar-ring` | `oklch(0.552 0.016 285.938)` |  |
| `success` | `#69a3ff` (via `var(--color-sky-blue)`) |  |
| `warning` | `oklch(0.75 0.16 78)` |  |
| `xy-edge-stroke` | `var(--muted-foreground)` |  |

## Radius

| Token | Value | Usage |
|---|---|---|
| `radius` (base) | `0.625rem` (10px) | Base reference |
| `radius-sm` | 6px | Small elements, checkboxes |
| `radius-md` | 8px | Buttons, inputs, badges |
| `radius-lg` | 10px (= base) | Cards |
| `radius-xl` | 14px | Large containers |

## Custom Text Sizes

Beyond standard Tailwind scale:

| Token | Value |
|---|---|
| `text-2xs` | `0.688rem` (11px) |
| `text-1sm` | `0.813rem` (13px) |

## Button Variants

**Signature pattern:** All primary button variants use `font-mono uppercase` — the product's most recognizable typographic trait.

| Variant | Has mono uppercase? | Key distinction |
|---|---|---|
| `default` | Yes | Azure blue fill, white text |
| `destructive` | Yes | Red fill |
| `outline` | Yes | Border on white bg |
| `outline-primary` | Yes | Azure border on white bg |
| `gray-outline` | **No** | Gray border — **no mono/uppercase** |
| `secondary` | Yes | Stone-100 fill |
| `ghost` | Yes | Transparent, accent on hover |
| `link` | Yes | Underline link style |
| `unstyled` | **No** | Inherits parent — **no styling** |
| `destructive-outline` | Yes | Red border on white bg |

**Sizes:** default (h-9), xs (h-7), sm (h-8), lg (h-10), icon (9×9), icon-sm (6×6), unstyled (h-auto)

## Badge Variants

| Variant | Key visual |
|---|---|
| `default` | Standard |
| `secondary` | Standard |
| `primary` | Azure border, mono |
| `destructive` | Standard |
| `outline` | Standard |
| `code` | Muted bg, mono font |
| `count` | Muted bg, mono font |
| `success` | Emerald, mono uppercase |
| `error` | Red, mono uppercase |
| `warning` | Amber, mono uppercase |
| `sky` | Sky tint, mono |
| `violet` | Violet tint, mono |
| `orange` | Orange tint, mono |

## Agent Builder Canvas

The most distinctive product surface. These tokens define its visual identity.

| Element | Value |
|---|---|
| Background dot color | `#a8a29e` (stone-400) |
| Background dot gap | `20px` (snap grid) |
| Node base style | `rounded-lg border bg-card` |
| Node selected | `ring-2 ring-primary` (azure blue ring) |
| Node error | `ring-2 ring-red-300 border-red-300` |
| MCP tool node shape | `rounded-4xl` (pill — visually distinct) |
| Handle size | `h-3 w-3` (12×12px), `border-2 border-border bg-card` |
| Node tab | `font-mono text-xs uppercase` — "Default" label |
| Toolbar buttons | `backdrop-blur-3xl` (glass-morphism) |
| xy-edge-stroke | `var(--border)` |
| xy-edge-stroke-selected | `var(--primary)` |
| edge-delegating-duration | `2s` |
| Node pulse glow | `rgba(105, 163, 255, 0.7)` — 1.5s ease-in-out |
| Delegation flash | `2s steps(1, end)` |

## Animations

| Keyframe | Usage |
|---|---|
| `bounce-dot` | Loading dots (chat, copilot) |
| `shine` | Decorative background sweep |
| `shimmer` | Skeleton loading, copilot thinking |
| `node-pulse` | Executing agent nodes — scale + blue glow |
| `node-animation` | Node state transition |
| `edge-animation` | Edge delegation color flash |

## Reference Scales

Full oklch values in `agents-manage-ui/src/app/globals.css`. Key landmarks:

| Scale | Steps | Key value |
|---|---|---|
| Azure | 11 | `azure-500` = primary (`oklch(0.6321 0.1983 259.59)`) |
| Gray | 11 | Warm undertone (hue 34–106), Stone-based |
| Chart | 5 × 2 modes | Light: azure, teal, dark-teal, gold, orange |

## What NOT to Use Inside Product Mockups

These marketing brand tokens do **not** appear in the product UI:

- **Neue Haas Grotesk Display Pro** — product uses Inter
- **Noto Serif** — product uses Inter
- **Warm cream backgrounds** (`#FBF9F4`, `#F7F4ED`) — product uses pure white
- **Large radii** (32–60px) — product uses 8–14px
- **Brand shadow glow** (`shadow/brand`) — product uses `shadow-xs` to `shadow-sm`
- **Pill-radius buttons** (9999px) — product uses `rounded-md` (8px)

---

## Widget Library Tokens (agents-ui)

Widget-specific tokens from `inkeep/agents-ui`. These define the chat bubble, embedded chat, and widget overlay surfaces.

### Shadows

Source: Tailwind 4 defaults (no overrides in tailwind.config.ts)

| Token | CSS Value |
|---|---|
| `shadow-xs` | `0 1px 2px 0 rgba(0,0,0,0.05)` |
| `shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` |
| `shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` |

### Chat Widget Dimensions

| Property | Value |
|---|---|
| Desktop width | `440px` |
| Max height | `650px` |
| Bottom offset | `0px` |
| Right offset | `0px` |
| Desktop border radius | `12px` (`rounded-xl`) |
| Shadow | `shadow-2xl` → `0 25px 50px -12px rgba(0,0,0,0.25)` |

### Avatar Sizes

| Element | Size | Class |
|---|---|---|
| Message avatar | `24px` | `h-6 w-6` |

### Message Spacing

| Property | Value |
|---|---|
| Wrapper padding | `0px (p-0)` |
| Message gap | `12px (gap-3)` |

### State Colors

| State | Color |
|---|---|
| Error | `#ef4444` |

### Border Colors

| Mode | Border color |
|---|---|
| Light mode | `#e5e7eb` |
