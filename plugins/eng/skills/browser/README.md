# Playwright Browser Skill

Browser automation for Claude Code — navigate, screenshot, test, record, and upload.

## Setup

```bash
cd ~/.claude/plugins/marketplaces/inkeep-team-skills/plugins/eng/skills/browser
npm run setup   # installs deps + Chromium
```

## Environment Variables

Copy `.env.example` and fill in what you need. Everything is optional — the skill works without any env vars for basic automation.

| Variable | Required for | Where to get it |
|---|---|---|
| `BUNNY_STREAM_API_KEY` | `uploadToBunny()` | [Bunny Stream dashboard](https://dash.bunny.net/stream) → API & Webhooks |
| `BUNNY_STREAM_LIBRARY_ID` | `uploadToBunny()` | Same page — numeric library ID |
| `VIMEO_CLIENT_ID` | `uploadToVimeo()` | [Vimeo developer apps](https://developer.vimeo.com/apps) |
| `VIMEO_CLIENT_SECRET` | `uploadToVimeo()` | Same app page |
| `VIMEO_ACCESS_TOKEN` | `uploadToVimeo()` | Generate PAT with `upload` scope |
| `HEADLESS` | Visible browser | Set to `false` for headed mode |
| `SLOW_MO` | Debugging | Delay in ms between actions |
| `PW_HEADER_NAME` / `PW_HEADER_VALUE` | Custom headers | Any value — sent with every request |

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
