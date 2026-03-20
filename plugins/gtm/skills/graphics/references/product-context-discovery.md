Use when: Step 1c (Product context discovery) — when the Creative Brief's hero content involves product UI, a feature mockup, or any visual that needs to represent what the product actually does
Priority: P0
Impact: Without visual reference, the agent improvises product mockups from memory — producing generic-looking UI that doesn't match the real product

---

# Product Context Discovery

Before building any product mockup, the agent must acquire a **visual reference** of the actual UI it's representing. Improvising product UI from general knowledge produces the "generic SaaS" look — correct in structure but wrong in every detail.

## Reference asset management

All discovered visual references are saved locally so the build phase and reviewer can access them.

**Directory:** `tmp/reference/<project-name>/` (created at the start of discovery)

```bash
mkdir -p tmp/reference/<project-name>
```

**For every useful image found** (screenshot, marketing material, component render, web search result):

1. **Download** to `tmp/reference/<project-name>/`
2. **Resize** for analysis — use sharp to create a ≤1568px version (for detail inspection) and a 400px version (for quick reference):
   ```bash
   bun -e "
   import sharp from 'sharp';
   await sharp('tmp/reference/<project-name>/raw-screenshot.png')
     .resize({ width: 1568, withoutEnlargement: true })
     .jpeg({ quality: 85 })
     .toFile('tmp/reference/<project-name>/slack-thread-1568w.jpg');
   await sharp('tmp/reference/<project-name>/raw-screenshot.png')
     .resize({ width: 400, withoutEnlargement: true })
     .jpeg({ quality: 80 })
     .toFile('tmp/reference/<project-name>/slack-thread-400w.jpg');
   "
   ```
3. **Name descriptively**: `<source>-<what-it-shows>-<resolution>.jpg` — e.g., `slack-marketing-thread-with-bot-1568w.jpg`, `agents-ui-chat-widget-400w.jpg`
4. **Visually inspect** the 400w version (Read tool) to confirm it's actually useful before citing it

**Cite in the Build Spec** — the "Visual reference(s)" field should list the saved paths:
```
- **Visual reference(s):**
  - tmp/reference/agents-in-slack/slack-marketing-thread-1568w.jpg (Slack's own blog — shows thread with bot response)
  - tmp/reference/agents-in-slack/agents-ui-approval-buttons-400w.jpg (from agents-ui component library)
```

These paths then flow into the sub-element plan where each sub-element cites its specific reference image.

### Subagent access to references

Subagents (exploration, build, review) don't inherit the parent's context. When spawning a subagent that needs visual references:

- **Always pass the `tmp/reference/<project-name>/` path** in the subagent's prompt
- **List the specific reference images** relevant to the subagent's task — don't just say "check the reference directory"
- **For the reviewer subagent** (Phase 5): reference images are passed alongside the review screenshots so the reviewer can compare the mockup against the source UI

### When references are code (not images)

Cloning a product repo gives you source code (React components, TypeScript types, CSS/Tailwind classes) — not rendered UI. The discovery subagent must **translate code into visual descriptions** that the builder can use.

When spawning an exploration subagent for a product codebase:

```
Prompt pattern:
"Explore [repo path] to find the [component name] component.
 Extract a VISUAL DESCRIPTION of what it looks like rendered:
 - Layout structure (what elements, in what order, what spacing)
 - Visual properties (colors as hex values, border radii, font sizes, shadows)
 - Sub-elements (avatar, text, buttons — what each looks like)
 - States/variants (default, hover, active, disabled — visual differences)

 Do NOT return raw code. Return a description a designer could build from."
```

Save the visual description to `tmp/reference/<project-name>/<component-name>-description.md`. This becomes a text-based reference alongside any image references.

For components that are straightforward to render, consider also taking a browser screenshot of the component in Storybook or the running app (Strategy 3) to supplement the code-derived description.

---

## Discovery strategy by context

### Our product (Inkeep)

Check `/brand` SKILL.md § "Product Resources" for the current list of repos, app URLs, and what each contains. Clone URLs and app endpoints come from there — don't hardcode them here.

Try these in order. Stop when you have enough visual reference to build the mockup.

**1. Explore the widget/UI library** (brand § Product Resources → Widget library)
Clone and explore the widget component library for the specific UI elements being mockup'd:
```bash
# Clone to tmp — don't pollute the working directory. Get URL from brand § Product Resources.
git clone <widget-library-url> /tmp/agents-ui --depth 1
```
Use a subagent with `/explore` to find the relevant components — their props, styling, layout structure. This gives ground truth for what the chat widget, message bubbles, approval buttons, agent cards, etc. actually look like. Look for:
- Component file structure (what sub-elements exist)
- Styling tokens used (colors, radii, spacing, fonts)
- Props that control variants and states
- Any Storybook or example files showing the component rendered

**2. Explore the product repo — docs first, then code** (brand § Product Resources → Product repo)
Clone the product repo for feature logic and user-facing behavior:
```bash
git clone <product-repo-url> /tmp/agents --depth 1
```

**Check docs first** — the product repo contains documentation that describes features in human-readable terms. Docs are often the fastest path to understanding what a feature does, what the user sees, and what the key concepts are. Use a subagent with `/explore`:
- Search for docs/guides related to the feature (e.g., `docs/*slack*`, `docs/*approval*`, `docs/*tool*`)
- Look for screenshots, diagrams, or UI descriptions embedded in docs
- Extract the user-facing behavior description — what the user sees, what they can do, what the expected flow is

**Then check code** for implementation details:
- API schemas that define the data shape (what fields appear in a message, what an approval request contains)
- Integration code (how @mentions are handled, what message format is sent back)
- Tool definitions (what tools exist, what their outputs look like)

**3. Open the running product** (brand § Product Resources → Running app)
When browser tools are available (Claude in Chrome), open the running app and navigate to the relevant feature:
- Set up a test scenario that shows the UI state you need to mockup
- Screenshot the actual interface at the relevant breakpoint
- Save to `tmp/reference/<project-name>/` and resize with sharp
- This is the definitive visual reference but requires the product to be accessible and the feature to be in a demonstrable state

**4. Check the marketing site for existing representations** (brand § Product Resources → Marketing site / Marketing repo)
The marketing site may already have illustrations, screenshots, or product mockups of the feature:
```bash
# Check the public images directory for existing product screenshots
ls public/images/ | grep -i "agent\|slack\|chat\|widget"
```
Existing marketing representations show how the product has been visually represented before — reuse the same fidelity level and styling unless the Creative Brief calls for something different.

### Third-party products (Slack, Jira, Zendesk, etc.)

When the mockup shows the Inkeep agent operating *within* a third-party product's UI:

**1. Search for the third-party's own marketing materials**
Their website and blog often show exactly the UI patterns you need:
- Visit their product pages for screenshots of the specific feature
- Check their blog for launch posts that show the UI in context
- Their marketing materials are usually the best visual reference because they show the *idealized* version of the UI — which is what a mockup should represent
- **Download and save** any useful images to `tmp/reference/<project-name>/` with descriptive names
- Resize with sharp before inspecting

Use web search: `"[Product] [feature] UI"` or `"[Product] [feature] screenshot"`, scoped to the product's own domain (e.g., `site:slack.com Slack thread bot message`).

**2. Search the web for UI screenshots**
When the product's marketing pages don't show the specific feature/state:
- Search: `"[Product] [feature] interface screenshot"`
- **Download and save** to `tmp/reference/<project-name>/`, resize with sharp before analyzing
- Use as approximate visual reference — the exact UI may differ from search results

**3. Fetch the brand profile**
Already covered in Step 2f (`fetch-brand.ts`) — gets colors, fonts, logo. Cross-reference these with the UI screenshots to ensure the mockup's color palette matches the third-party's actual brand.

### Novel or conceptual UI (doesn't exist yet)

When the mockup represents a feature that hasn't been built yet:
- Skip visual reference acquisition — there's nothing to reference
- Use the illustration system (`content-types/illustration.md`) for conceptual representations
- Or consult specs/PRDs if they describe the intended UI (already covered in existing Step 1c)

## Propagation to nested claudes (exploration workflow)

When using the exploration workflow (`references/exploration-workflow.md`), discovery results must be available to `/nest-claude` children that build individual frames. Children read `state.json` for shared context and their direction file (`directions/<slug>.json`) for direction-specific state.

**Add a `productContext` field to `state.json`** during Step 1c. Product context is shared across all directions, so it belongs in state.json (not in direction files). Keep it lightweight — paths and metadata only, no inline assets:

```json
{
  "productContext": {
    "feature": "Inkeep agents responding in Slack channels with tool approvals",
    "fidelityLevel": "Level 3 — stylized mockup",
    "referenceDir": "tmp/reference/agents-in-slack/",
    "keyUIElements": [
      "Slack message thread with channel header",
      "Bot avatar (Inkeep icon in squircle)",
      "User avatar (purpose-built illustration)",
      "@mention styling (bold + blue)",
      "Approve/Deny action buttons"
    ]
  }
}
```

**Only paths and metadata go in state.json — never inline assets.** The nested claude reads `referenceDir`, lists the files, and loads what it needs. Images, SVGs, and visual descriptions live on disk in `tmp/reference/`, not in state.json.

Product context is **shared across all directions** — every direction building a different visual concept references the same product UI screenshots and feature understanding. This is why it belongs in `state.json`'s shared context (alongside `creativeBrief`, `collectedAssets`, `figma`). Each nested claude reads `state.json` at startup for shared context (Creative Brief, assets, product context) and its direction file for direction-specific state (concept, Build Spec, timeline).

---

## What to capture

After discovery, record in BOTH the Build Spec (for the main agent) AND `state.json` (for nested claudes):

```
### Product context
- **Feature:** [what it does, one sentence]
- **Key UI elements:** [list the components/elements the mockup should show]
- **Visual reference(s):** [paths to screenshots, component file paths, or URLs used as reference]
- **Fidelity level:** [per product-representation.md — Level 2-5]
- **Two-layer check:** product tokens inside mockup, marketing tokens outside
```

These references then flow into the sub-element plan (Step 3, "Generation method per element") where each sub-element cites its visual reference.

## Anti-patterns

- **Improvising from memory** — building a "Slack-looking" interface without checking what Slack actually looks like. The result is always subtly wrong.
- **Using the general brand illustration system for product UI** — the illustration system (hand-drawn, blue/golden semantic colors) is for conceptual illustrations, not product mockups. Product mockups use product tokens.
- **Skipping discovery because the agent "knows" what the product looks like** — training data is stale. The actual product UI changes frequently. Always check current state.
- **Screenshotting at full resolution** — resize to ≤1568px before using as reference. Full-resolution screenshots waste tokens and may exceed vision processing limits.
