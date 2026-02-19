# Playwright Browser Skill

Browser automation for Claude Code — navigate, screenshot, test, record, and upload.

## Setup

```bash
cd ~/.claude/plugins/marketplaces/inkeep-team-skills/plugins/eng/skills/browser
npm run setup   # installs deps + Chromium
```

## Environment Variables

Env vars are configured via Claude Code's `~/.claude/settings.json` `env` field — available in every session, from any directory, survives plugin updates.

**See [eng plugin README](../../README.md#quick-setup) step 5** for the one-liner setup command and credential guide.

### Optional env vars

| Variable | Purpose |
|---|---|
| `HEADLESS` | Set to `false` for visible browser (default: headless) |
| `SLOW_MO` | Delay in ms between actions (debugging) |
| `PW_HEADER_NAME` / `PW_HEADER_VALUE` | Custom HTTP header sent with every request |

## Video Upload Strategy

| Use case | Function | Platform | Why |
|---|---|---|---|
| Internal (team demos, QA recordings) | `uploadToBunny()` | Bunny Stream | Cheapest, explicit VP8/WebM support, JIT encoding, independent company |
| Customer-facing (docs, marketing) | `uploadToVimeo()` | Vimeo | Familiar platform, password-protected links, broad reach |

Both accept WebM directly — no local conversion needed.

## Usage

See [SKILL.md](SKILL.md) for full helper reference and code examples.

```bash
# Run a script
cd $SKILL_DIR && node run.js /tmp/playwright-test.js

# Quick inline
cd $SKILL_DIR && node run.js "
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:3000');
await page.screenshot({ path: '/tmp/screenshot.png' });
await browser.close();
"
```

## Local Browser Mode (User's Chrome)

Connect to the user's running Chrome instead of launching headless. Gives the agent access to the user's auth, cookies, extensions, and browsing state.

### Setup (one-time)

Install the [Playwright MCP Bridge](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm) Chrome extension. That's it — no Chrome restart or special flags needed.

### Usage

```bash
# Standalone connector
cd $SKILL_DIR && node scripts/connect-local.js /tmp/my-script.js

# Or via run.js with --connect flag
cd $SKILL_DIR && node run.js --connect /tmp/my-script.js

# Quick inline
cd $SKILL_DIR && node run.js --connect "console.log(await page.title())"
```

Scripts get pre-wired `browser`, `context`, `page`, `helpers`, `connectToLocalBrowser`, `getConnectedPage`, and `extractAuthState` variables.

Set `PLAYWRIGHT_MCP_EXTENSION_TOKEN` to bypass the extension approval dialog (copy token from extension popup).

### Extract auth for headless reuse

```bash
cd $SKILL_DIR && node run.js --connect "
await extractAuthState(context, { path: '/tmp/auth.json', indexedDB: true });
"
# Then use in headless: helpers.loadAuthState(browser, '/tmp/auth.json')
```

See [references/local-browser.md](references/local-browser.md) for the full routing table, limitations, and auth portability guide.
