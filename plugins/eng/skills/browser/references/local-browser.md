Use when: User asks to interact with their running Chrome, you need their auth/cookies, or you need to act on their behalf in the browser
Priority: P1
Impact: Without this, agent cannot access user's authenticated sessions or operate in their real browser environment

---

# Local Browser Mode — Chrome Extension Bridge

Connect Playwright to the user's running Chrome browser via the [Playwright MCP Bridge](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm) Chrome extension. This gives the agent access to the user's real browser session — their auth, cookies, extensions, and browsing state.

## When to use which mode

| Task | Local browser | Headless (default) | Peekaboo (macOS) |
|---|---|---|---|
| Test with user's auth/cookies | **Yes** | No (unless state exported first) | No |
| Automated testing in CI/Docker | No | **Yes** | No |
| Interact with native OS dialogs | No | No | **Yes** |
| Screenshot user's actual page state | **Yes** | No (different session) | Yes (screen-level) |
| Act on user's behalf in their browser | **Yes** | No (isolated session) | Partial (visible to user) |
| Test in user's exact browser config | **Yes** | No (clean profile) | Partial |
| Intercept/mock network requests | No (CDP limitation) | **Yes** (`page.route()`) | No |
| Cross-browser testing (Firefox/WebKit) | No (Chrome only) | **Yes** | No |
| Run in Docker/sandbox | No | **Yes** | No |

**Decision rule:** Use local browser when you need the user's session state or are acting on their behalf. Use headless for everything else — it's faster, more capable, and works in any environment.

## Prerequisites

1. **Chrome must be running** on the user's machine
2. **Playwright MCP Bridge extension** must be installed: [Chrome Web Store](https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm)
3. Reload any Chrome tab after installing the extension (one-time)

## How it works

```
┌─────────────┐     WebSocket      ┌──────────────┐     chrome.debugger     ┌─────────────┐
│  Playwright  │ ←───────────────→  │  CDP Relay   │ ←────────────────────→  │   Chrome     │
│  (our code)  │   ws://localhost   │  Server      │   Extension Bridge      │   Extension  │
│              │   /cdp/<uuid>      │  (Node.js)   │   /extension/<uuid>     │   (MCP)      │
└─────────────┘                     └──────────────┘                         └─────────────┘
```

1. `connectToLocalBrowser()` starts a local HTTP server with WebSocket support
2. Creates a `CDPRelayServer` (from Playwright's own MCP extension code)
3. Opens a connection tab in Chrome → extension connects back to the relay
4. Playwright connects to the relay's CDP endpoint via `chromium.connectOverCDP()`
5. The returned `context` is the user's actual browser context

## Helpers

### `connectToLocalBrowser(options?)`

Connect to Chrome. Returns `{ browser, context, page, close() }`.

```javascript
const { connectToLocalBrowser } = require('./lib/local-browser');

const { browser, context, page } = await connectToLocalBrowser();
await page.goto('https://example.com');
// ... interact with page ...
await connection.close(); // Always clean up
```

Options:
- `timeout` (number, default 15000) — ms to wait for extension handshake
- `browserChannel` (string, default 'chrome') — browser to connect to

Set `PLAYWRIGHT_MCP_EXTENSION_TOKEN` env var to bypass the extension's connection approval dialog. Copy the token from the extension popup.

### `getConnectedPage(context, url?)`

Get the page exposed by the extension and optionally navigate.

```javascript
const { getConnectedPage } = require('./lib/local-browser');
const page = await getConnectedPage(context, 'https://github.com');
```

**Note:** `context.newPage()` does NOT work via the extension bridge. The extension exposes one tab per connection — use the `page` returned by `connectToLocalBrowser()` or call `getConnectedPage()` to retrieve it.

### `extractAuthState(context, options?)`

Extract cookies + localStorage (+ optionally IndexedDB) for reuse in headless sessions.

```javascript
const { extractAuthState } = require('./lib/local-browser');
const state = await extractAuthState(context, {
  path: '/tmp/auth-state.json',
  indexedDB: true
});
// Later, in a headless session:
// const ctx = await helpers.loadAuthState(browser, '/tmp/auth-state.json');
```

## Code examples

### Connect and take a screenshot of user's current page

```javascript
const { connectToLocalBrowser } = require('./lib/local-browser');
const helpers = require('./lib/helpers');

const connection = await connectToLocalBrowser();
const pages = connection.context.pages();
if (pages.length > 0) {
  const currentPage = pages[0];
  console.log('Current tab:', await currentPage.title());
  await helpers.takeScreenshot(currentPage, 'user-page');
}
await connection.close();
```

### Extract auth for headless reuse

Login once in Chrome, then reuse across headless sessions:

```javascript
// Step 1: Extract from Chrome (run once)
const { connectToLocalBrowser, extractAuthState } = require('./lib/local-browser');
const conn = await connectToLocalBrowser();
await extractAuthState(conn.context, { path: '/tmp/github-auth.json', indexedDB: true });
await conn.close();

// Step 2: Reuse in headless (run many times)
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');
const browser = await chromium.launch({ headless: true });
const context = await helpers.loadAuthState(browser, '/tmp/github-auth.json');
const page = await context.newPage();
await page.goto('https://github.com/settings/profile');
// Logged in — no manual auth needed
```

### Act on user's behalf

```javascript
const { connectToLocalBrowser } = require('./lib/local-browser');

const connection = await connectToLocalBrowser();
const { page } = connection;
await page.goto('https://app.example.com/settings');
// Fill in form, click buttons, etc. using standard Playwright API
await page.fill('#display-name', 'New Name');
await page.click('button[type="submit"]');
console.log('Settings updated');
await connection.close();
```

## Limitations

### CDP fidelity

The connection uses Chrome DevTools Protocol over the extension bridge, which has **lower fidelity** than Playwright's native protocol:

- **No `page.route()`** — cannot intercept or mock network requests
- **Limited `page.on('request')`** — request interception is restricted
- **No `page.route()` for WebSocket** — cannot mock WebSocket connections
- Standard helpers (screenshots, clicks, typing, navigation, evaluation) work normally

### Browser constraints

- **Chrome/Chromium only** — Firefox and WebKit are not supported
- **Extension must be active** — if disabled or uninstalled, connection fails
- **Local machine only** — does not work in Docker, CI, or remote environments
- **Visible tabs** — new pages open as visible Chrome tabs (not truly hidden)

### Auth state portability

What transfers reliably:
- Session cookies (most web apps)
- JWTs stored in cookies or localStorage
- GitHub authentication
- Internal/dev tool sessions
- Firebase/Supabase auth (with `indexedDB: true`)

What does NOT transfer:
- **Google** — Device Bound Session Credentials (DBSC) tie sessions to the specific browser
- **Cloudflare** — `cf_clearance` cookies are IP-bound
- **Corporate SSO/SAML** — many bind to machine or browser fingerprint
- **WebAuthn/passkeys** — hardware-bound, cannot be extracted
- **sessionStorage** — not included in Playwright's storageState (ephemeral by design)
- **Service workers** — registered per-origin, not portable

### General

- Auth state is a **point-in-time snapshot** — if cookies expire or tokens rotate, re-extract
- Some sites detect automation via CDP signals and may block requests
- The extension connection tab briefly appears in Chrome (auto-handled)

## Troubleshooting

**"Could not connect to Chrome via the Playwright MCP Bridge extension"**
1. Verify Chrome is running
2. Check extension is installed and enabled at `chrome://extensions`
3. Reload any Chrome tab after installing
4. If Chrome was just updated, restart Chrome

**"CDPRelayServer not available"**
- Playwright version too old. Run: `cd $SKILL_DIR && npm install` (needs Playwright >= 1.50)

**Connection works but pages behave oddly**
- CDP mode has lower fidelity. If you need `page.route()` or advanced features, extract auth state and use headless instead.

**Auth state doesn't work in headless**
- The target site may bind sessions to browser fingerprint. Try setting a matching user-agent in the headless context.
