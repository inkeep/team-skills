// local-browser.js
// Connect to user's running Chrome via the Playwright MCP Bridge extension.
// Only viable on user's local machine (not Docker/sandbox).

const http = require('http');
const { createRequire } = require('module');

// The Chrome extension (v0.0.68+) requires @playwright/mcp's relay, not the one
// bundled in playwright@1.58. We resolve CDPRelayServer + chromium from
// @playwright/mcp's own nested playwright (1.59-alpha) which has the matching
// protocol. This can be simplified once playwright@1.59 is stable.
let CDPRelayServer, chromium;
try {
  const mcpRequire = createRequire(require.resolve('@playwright/mcp'));
  const pwPath = mcpRequire.resolve('playwright');
  const pwRequire = createRequire(pwPath);
  ({ CDPRelayServer } = pwRequire('./lib/mcp/extension/cdpRelay'));
  ({ chromium } = require(pwPath));
} catch (err) {
  // Will throw a clear error when connectToLocalBrowser() is called
  CDPRelayServer = null;
  chromium = null;
}

const EXTENSION_STORE_URL =
  'https://chromewebstore.google.com/detail/playwright-mcp-bridge/mmlmfjhmonkocbjadbfplnigmagldckm';

/**
 * Connect to the user's running Chrome browser via the Playwright MCP Bridge extension.
 *
 * Starts a local WebSocket relay server, triggers the extension handshake by opening
 * a connection tab in Chrome, then connects Playwright over CDP. The returned context
 * is the user's existing browser context (with their cookies, extensions, auth state).
 *
 * @param {Object} [options={}]
 * @param {number} [options.timeout=15000] - Max ms to wait for the extension to connect
 * @param {string} [options.browserChannel='chrome'] - Browser channel for finding the executable
 * @returns {Promise<{ browser: import('playwright').Browser, context: import('playwright').BrowserContext, page: import('playwright').Page, close: () => Promise<void> }>}
 */
async function connectToLocalBrowser(options = {}) {
  if (!CDPRelayServer || !chromium) {
    throw new Error(
      'CDPRelayServer not available. This requires @playwright/mcp.\n' +
      'Run: cd $SKILL_DIR && npm install'
    );
  }

  const timeout = options.timeout || 15000;
  const browserChannel = options.browserChannel || 'chrome';

  // Create a local HTTP server for the WebSocket relay
  const server = http.createServer();
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

  // CDPRelayServer attaches its own WebSocket handler to the server.
  // browserChannel is used to find the Chrome executable for spawning the connect tab.
  // userDataDir and executablePath are left undefined to use the user's default profile.
  const relay = new CDPRelayServer(server, browserChannel, undefined, undefined);

  try {
    // This spawns a Chrome tab to chrome-extension://.../connect.html which triggers
    // the extension to connect back to our relay via WebSocket.
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort('timeout'), timeout);

    try {
      await relay.ensureExtensionConnectionForMCPContext(
        { name: 'claude-browser-skill', version: '1.0' },
        abortController.signal
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    server.close();
    // The CDPRelay's internal 5s timeout rejects with a proper Error.
    // Our AbortController safety net rejects with an Event object (no .message).
    // Handle both cases.
    const msg = (err && err.message) ? err.message : String(err);
    const isConnectionFailure = msg.includes('timeout') || msg.includes('Extension')
      || msg.includes('abort') || (err && err.constructor && err.constructor.name === 'Event');
    if (isConnectionFailure) {
      throw new Error(
        'Could not connect to Chrome via the Playwright MCP Bridge extension.\n\n' +
        'Checklist:\n' +
        '1. Chrome must be running\n' +
        '2. Install the extension: ' + EXTENSION_STORE_URL + '\n' +
        '3. Reload any Chrome tab after installing\n\n' +
        'Then retry the command.'
      );
    }
    throw err;
  }

  // Connect Playwright to the relay's CDP endpoint
  const browser = await chromium.connectOverCDP(relay.cdpEndpoint(), { isLocal: true });
  const context = browser.contexts()[0];

  // The extension exposes the connect tab as the initial page. This is the
  // page scripts should use — context.newPage() does NOT work via CDP bridge.
  const pages = context.pages();
  const page = pages[0] || null;

  return {
    browser,
    context,
    page,
    async close() {
      try { await browser.close(); } catch {}
      server.close();
    }
  };
}

/**
 * Get the active page from a CDP-connected browser context and optionally navigate.
 *
 * Note: context.newPage() does NOT work via the extension bridge. The extension
 * exposes one tab per connection. Use this function to get that tab and navigate it.
 *
 * @param {import('playwright').BrowserContext} context - Connected browser context
 * @param {string} [url] - URL to navigate to (optional)
 * @returns {Promise<import('playwright').Page>}
 */
async function getConnectedPage(context, url) {
  const pages = context.pages();
  const page = pages[0];
  if (!page) throw new Error('No pages available in the connected browser context');
  if (url) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
  return page;
}

/**
 * Extract authentication state (cookies + localStorage + optionally IndexedDB) from
 * a connected browser context. The output file can be loaded in headless sessions via
 * helpers.loadAuthState(browser, path).
 *
 * What transfers: cookies, localStorage, IndexedDB (opt-in).
 * What does NOT transfer: sessionStorage, service workers, WebAuthn credentials.
 * Auth systems that bind to browser fingerprint or IP may reject the extracted state.
 *
 * @param {import('playwright').BrowserContext} context - Connected browser context
 * @param {Object} [options={}]
 * @param {string} [options.path] - Save state to this file path (for later reuse)
 * @param {boolean} [options.indexedDB=false] - Include IndexedDB contents
 * @returns {Promise<Object>} Playwright storage state object ({ cookies, origins })
 */
async function extractAuthState(context, options = {}) {
  const stateOpts = {};
  if (options.path) stateOpts.path = options.path;
  if (options.indexedDB) stateOpts.indexedDB = true;

  const state = await context.storageState(stateOpts);
  const summary = {
    cookies: state.cookies ? state.cookies.length : 0,
    origins: state.origins ? state.origins.length : 0,
    path: options.path || null
  };

  console.log(`Auth state extracted: ${summary.cookies} cookies, ${summary.origins} origins` +
    (summary.path ? ` → saved to ${summary.path}` : ''));

  return state;
}

module.exports = {
  connectToLocalBrowser,
  getConnectedPage,
  extractAuthState,
  EXTENSION_STORE_URL
};
