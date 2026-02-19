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
