---
name: browser
description: "Browser automation with Playwright — navigate pages, fill forms, take screenshots, test responsive design, validate UX, test login flows, check links, inspect network requests, inject JavaScript, monitor console errors, capture network traffic, record video, inspect browser state, run accessibility audits, measure performance, and simulate network conditions. Headless by default for CI/Docker. Use when user wants to test websites, automate browser interactions, validate web functionality, or perform browser-based testing. Triggers: playwright, browser test, browser automation, web test, screenshot, responsive test, test the page, automate browser, headless browser, UI test, console errors, console monitoring, network inspection, network capture, accessibility audit, a11y test, performance metrics, web vitals, video recording, browser state, localStorage, network simulation, offline testing."
argument-hint: "[URL or description of what to test/automate]"
---

**IMPORTANT - Path Resolution:**
This skill is installed via the plugin system. Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Expected plugin path: `~/.claude/plugins/marketplaces/inkeep-team-skills/plugins/eng/skills/browser`

# Playwright Browser Automation

General-purpose browser automation skill. Write custom Playwright code for any automation task and execute it via the universal executor.

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Auto-detect dev servers** - For localhost testing, ALWAYS run server detection FIRST:

   ```bash
   cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(servers => console.log(JSON.stringify(servers)))"
   ```

   - If **1 server found**: Use it automatically, inform user
   - If **multiple servers found**: Ask user which one to test
   - If **no servers found**: Ask for URL or offer to help start dev server

2. **Write scripts to /tmp** - NEVER write test files to skill directory; always use `/tmp/playwright-test-*.js`

3. **Use headless browser by default** - Always use `headless: true` unless user specifically requests visible/headed mode. This ensures Docker/CI compatibility.

4. **Parameterize URLs** - Always make URLs configurable via environment variable or constant at top of script

## How It Works

1. You describe what you want to test/automate
2. Auto-detect running dev servers (or ask for URL if testing external site)
3. Write custom Playwright code in `/tmp/playwright-test-*.js` (won't clutter your project)
4. Execute it via: `cd $SKILL_DIR && node run.js /tmp/playwright-test-*.js`
5. Results displayed in real-time
6. Test files auto-cleaned from /tmp by your OS

## Setup (First Time)

```bash
cd $SKILL_DIR
npm run setup
```

This installs Playwright and Chromium browser. Only needed once.

## Execution Pattern

**Step 1: Detect dev servers (for localhost testing)**

```bash
cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
```

**Step 2: Write test script to /tmp with URL parameter**

```javascript
// /tmp/playwright-test-page.js
const { chromium } = require('playwright');

// Parameterized URL (detected or user-provided)
const TARGET_URL = 'http://localhost:3001'; // <-- Auto-detected or from user

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(TARGET_URL);
  console.log('Page loaded:', await page.title());

  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
  console.log('Screenshot saved to /tmp/screenshot.png');

  await browser.close();
})();
```

**Step 3: Execute from skill directory**

```bash
cd $SKILL_DIR && node run.js /tmp/playwright-test-page.js
```

## Common Patterns

### Test a Page (Multiple Viewports)

```javascript
// /tmp/playwright-test-responsive.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Desktop test
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(TARGET_URL);
  console.log('Desktop - Title:', await page.title());
  await page.screenshot({ path: '/tmp/desktop.png', fullPage: true });

  // Mobile test
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: '/tmp/mobile.png', fullPage: true });

  await browser.close();
})();
```

### Test Login Flow

```javascript
// /tmp/playwright-test-login.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${TARGET_URL}/login`);

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('**/dashboard');
  console.log('Login successful, redirected to dashboard');

  await browser.close();
})();
```

### Fill and Submit Form

```javascript
// /tmp/playwright-test-form.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${TARGET_URL}/contact`);

  await page.fill('input[name="name"]', 'John Doe');
  await page.fill('input[name="email"]', 'john@example.com');
  await page.fill('textarea[name="message"]', 'Test message');
  await page.click('button[type="submit"]');

  // Verify submission
  await page.waitForSelector('.success-message');
  console.log('Form submitted successfully');

  await browser.close();
})();
```

### Network Request Inspection

```javascript
// /tmp/playwright-test-network.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture all API requests
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiRequests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');

  console.log('API requests captured:', JSON.stringify(apiRequests, null, 2));

  await browser.close();
})();
```

### JavaScript Injection

```javascript
// /tmp/playwright-test-js-inject.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(TARGET_URL);

  // Inject and execute JavaScript
  const result = await page.evaluate(() => {
    return {
      title: document.title,
      links: document.querySelectorAll('a').length,
      meta: Array.from(document.querySelectorAll('meta')).map(m => ({
        name: m.getAttribute('name'),
        content: m.getAttribute('content')
      })).filter(m => m.name),
      localStorage: Object.keys(window.localStorage),
      cookies: document.cookie
    };
  });

  console.log('Page analysis:', JSON.stringify(result, null, 2));

  await browser.close();
})();
```

### Check for Broken Links

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');

  const links = await page.locator('a[href^="http"]').all();
  const results = { working: 0, broken: [] };

  for (const link of links) {
    const href = await link.getAttribute('href');
    try {
      const response = await page.request.head(href);
      if (response.ok()) {
        results.working++;
      } else {
        results.broken.push({ url: href, status: response.status() });
      }
    } catch (e) {
      results.broken.push({ url: href, error: e.message });
    }
  }

  console.log(`Working links: ${results.working}`);
  console.log(`Broken links:`, results.broken);

  await browser.close();
})();
```

### Take Screenshot with Error Handling

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 10000,
    });

    await page.screenshot({
      path: '/tmp/screenshot.png',
      fullPage: true,
    });

    console.log('Screenshot saved to /tmp/screenshot.png');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
```

### Test Responsive Design

```javascript
// /tmp/playwright-test-responsive-full.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001'; // Auto-detected

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  for (const viewport of viewports) {
    console.log(
      `Testing ${viewport.name} (${viewport.width}x${viewport.height})`,
    );

    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    await page.goto(TARGET_URL);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `/tmp/${viewport.name.toLowerCase()}.png`,
      fullPage: true,
    });
  }

  console.log('All viewports tested');
  await browser.close();
})();
```

### Monitor Console Errors During a Flow

Use when verifying a UI flow doesn't produce silent JS errors.

```javascript
// /tmp/playwright-test-console.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Start capturing BEFORE navigation
  const consoleLogs = helpers.startConsoleCapture(page);

  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');

  // Interact with the page
  await page.click('button.submit').catch(() => {});
  await page.waitForTimeout(1000);

  // Check for errors
  const errors = helpers.getConsoleErrors(consoleLogs);
  if (errors.length > 0) {
    console.log(`FAIL: ${errors.length} console error(s):`);
    errors.forEach(e => console.log(`  [${e.type}] ${e.text}`));
  } else {
    console.log('PASS: No console errors');
  }

  // Optionally filter for specific logs
  const apiLogs = helpers.getConsoleLogs(consoleLogs, /api|fetch/i);
  console.log(`API-related logs: ${apiLogs.length}`);

  await browser.close();
})();
```

### Verify Network Requests During UI Flow

Use when checking that the right API calls fire with the right status codes.

```javascript
// /tmp/playwright-test-network-verify.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture only API requests
  const network = helpers.startNetworkCapture(page, '/api/');

  await page.goto(`${TARGET_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  // Check for failed API calls
  const failed = helpers.getFailedRequests(network);
  if (failed.length > 0) {
    console.log(`FAIL: ${failed.length} failed API request(s):`);
    failed.forEach(r => console.log(`  ${r.method} ${r.url} -> ${r.status || r.failure}`));
  } else {
    console.log('PASS: All API requests succeeded');
  }

  // Review all captured requests
  const all = helpers.getCapturedRequests(network);
  console.log(`Total API requests: ${all.length}`);
  all.forEach(r => console.log(`  ${r.status} ${r.method} ${r.url}`));

  await browser.close();
})();
```

### Record Video of a Flow

Use when you need a recording of multi-step browser interaction.

```javascript
// /tmp/playwright-test-video.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await helpers.createVideoContext(browser, {
    outputDir: '/tmp/playwright-videos'
  });
  const page = await context.newPage();

  await page.goto(TARGET_URL);
  await page.click('nav a:first-child');
  await page.waitForTimeout(1000);
  await page.click('button.submit').catch(() => {});
  await page.waitForTimeout(1000);

  // Video is saved when page closes
  const videoPath = await page.video().path();
  await page.close();
  await context.close();

  console.log(`Video saved: ${videoPath}`);
  await browser.close();
})();
```

### Inspect Browser State After Mutation

Use when verifying that a UI action correctly persisted data.

```javascript
// /tmp/playwright-test-state.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(TARGET_URL);

  // Check state before action
  const storageBefore = await helpers.getLocalStorage(page);
  console.log('localStorage before:', JSON.stringify(storageBefore));

  const cookies = await helpers.getCookies(context);
  console.log('Cookies:', cookies.map(c => `${c.name}=${c.value}`));

  // Perform some action that should change state
  await page.click('button.save-preferences').catch(() => {});
  await page.waitForTimeout(500);

  // Check state after action
  const storageAfter = await helpers.getLocalStorage(page);
  console.log('localStorage after:', JSON.stringify(storageAfter));

  // Clean up for next test
  await helpers.clearAllStorage(page);

  await browser.close();
})();
```

### Capture Screenshots for Documentation

Use when writing docs, help articles, or PR screenshots that need consistent, high-quality images of the running UI.

```javascript
// /tmp/playwright-test-doc-screenshot.js
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2, // Retina clarity
  });
  const page = await context.newPage();

  await page.goto(`${TARGET_URL}/settings`);
  await page.waitForLoadState('networkidle');

  // Crop to the relevant section — avoid full-page captures with empty space
  const section = page.locator('.api-keys-section');
  await section.screenshot({
    path: '/tmp/doc-settings-api-keys.png',
    type: 'png',
  });

  // Full-page fallback when you need the whole view
  await page.screenshot({
    path: '/tmp/doc-settings-full.png',
    type: 'png',
    fullPage: false, // Viewport-only — keep it tight
  });

  console.log('Doc screenshots saved to /tmp/doc-*.png');
  await browser.close();
})();
```

**Key settings for doc screenshots:**
- `viewport: { width: 1280, height: 720 }` — standard docs width
- `deviceScaleFactor: 2` — retina resolution for sharp text
- `type: 'png'` — lossless for UI screenshots
- Use `element.screenshot()` to crop to a specific panel instead of full-page
- Target <200KB per image — crop aggressively

### Media Asset Pipeline

Choose the right preset and conversion for your target. Presets set viewport + DPR automatically — no manual config needed.

| Target | Preset | Output | Max size | Why |
|---|---|---|---|---|
| Docs site screenshot | `docs-retina` | 2560×1440 PNG | <500 KB | Retina-sharp for Next.js Image |
| GitHub PR screenshot | `pr-standard` | 1280×720 PNG | <200 KB | Crisp at GitHub's 894px display width |
| GitHub PR GIF | `gif-compact` | 800×450 animated GIF | <10 MB | DPR 1 — GIF's 256-color palette is the bottleneck, not pixel density |

**Capture a docs-quality screenshot with a preset:**

```javascript
// /tmp/playwright-test-preset-screenshot.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Preset sets viewport 1280x720 + DPR 2 → 2560x1440 output
  const context = await helpers.createPresetContext(browser, 'docs-retina');
  const page = await context.newPage();

  await page.goto(`${TARGET_URL}/settings`);
  await page.waitForLoadState('networkidle');

  // Element-level crop for tight framing
  const section = page.locator('.api-keys-section');
  await section.screenshot({ path: '/tmp/doc-api-keys.png', type: 'png' });

  console.log('Docs screenshot: 2560x1440 Retina PNG');
  await browser.close();
})();
```

**Create a step-by-step GIF for a PR:**

```javascript
// /tmp/playwright-test-pr-gif.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  // gif-compact: 800x450 @ DPR 1 — optimized for GitHub's 10MB limit
  const context = await helpers.createPresetContext(browser, 'gif-compact');
  const page = await context.newPage();

  const frames = [];

  // Frame 1: Starting state
  await page.goto(`${TARGET_URL}/settings`);
  await page.waitForLoadState('networkidle');
  frames.push(await page.screenshot({ type: 'png' }));

  // Frame 2: Click action
  await page.click('button.save');
  await page.waitForTimeout(500);
  frames.push(await page.screenshot({ type: 'png' }));

  // Frame 3: Success state
  await page.waitForSelector('.success-toast');
  frames.push(await page.screenshot({ type: 'png' }));

  // Assemble GIF — 3 frames at 2fps = 1.5s loop
  const result = await helpers.screenshotsToGif(frames, '/tmp/pr-demo.gif', {
    width: 800, height: 450, fps: 2
  });

  console.log(`GIF: ${result.path} (${result.sizeMB} MB, ${result.frames} frames)`);
  await browser.close();
})();
```

### Run Accessibility Audit

Use when checking a page for WCAG violations.

```javascript
// /tmp/playwright-test-a11y.js
const { chromium } = require('playwright');
const helpers = require('./lib/helpers');

const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(TARGET_URL);
  await page.waitForLoadState('networkidle');

  const audit = await helpers.runAccessibilityAudit(page);

  console.log(`Accessibility audit: ${audit.violationCount} violation(s), ${audit.passes} passes`);

  if (audit.violationCount > 0) {
    console.log('\nViolations:');
    audit.summary.forEach(v => {
      console.log(`  [${v.impact}] ${v.id}: ${v.description} (${v.nodes} element(s))`);
      console.log(`    Help: ${v.helpUrl}`);
    });
  }

  // Test keyboard focus order
  const focusOrder = await helpers.checkFocusOrder(page, [
    'a[href]:first-of-type',
    'nav a:nth-child(2)',
    'input[type="search"]'
  ]);
  focusOrder.forEach(f => {
    console.log(`  Tab ${f.step}: expected ${f.expectedSelector} -> ${f.matches ? 'PASS' : 'FAIL'}`);
  });

  await browser.close();
})();
```

## Inline Execution (Simple Tasks)

For quick one-off tasks, you can execute code inline without creating files:

```bash
# Take a quick screenshot
cd $SKILL_DIR && node run.js "
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:3001');
await page.screenshot({ path: '/tmp/quick-screenshot.png', fullPage: true });
console.log('Screenshot saved');
await browser.close();
"
```

**When to use inline vs files:**

- **Inline**: Quick one-off tasks (screenshot, check if element exists, get page title)
- **Files**: Complex tests, responsive design checks, anything user might want to re-run

## Available Helpers

All helpers live in `lib/helpers.js`. Use `const helpers = require('./lib/helpers');` in scripts. Organized by what you need to do:

### Page Interaction

| Helper | When to use |
|---|---|
| `helpers.detectDevServers()` | **CRITICAL — run first** for localhost testing. Returns array of detected server URLs. |
| `helpers.safeClick(page, selector, { retries: 3 })` | Click elements that may not be immediately visible/clickable. Auto-retries. |
| `helpers.safeType(page, selector, text)` | Type into inputs. Clears field first by default. |
| `helpers.extractTexts(page, selector)` | Get text from multiple matching elements as array. |
| `helpers.scrollPage(page, 'down', 500)` | Scroll page. Directions: `'down'`, `'up'`, `'top'`, `'bottom'`. |
| `helpers.handleCookieBanner(page)` | Dismiss common cookie consent banners. Run early — clears overlays that block interaction. |
| `helpers.authenticate(page, { username, password })` | Login flow with common field selectors. Auto-waits for redirect. |
| `helpers.extractTableData(page, 'table.results')` | Extract structured data from HTML tables (headers + rows). |
| `helpers.takeScreenshot(page, 'name')` | Save timestamped screenshot. |

### Console Monitoring — catch silent JS errors

| Helper | When to use |
|---|---|
| `helpers.startConsoleCapture(page)` | **Call BEFORE navigating.** Returns a collector that accumulates all console output. |
| `helpers.getConsoleErrors(collector)` | Get only error-level messages and uncaught exceptions from collector. |
| `helpers.getConsoleLogs(collector, filter?)` | Get all logs, or filter by string/RegExp/function. |

### Network Inspection — verify API calls during UI flows

| Helper | When to use |
|---|---|
| `helpers.startNetworkCapture(page, '/api/')` | **Call BEFORE navigating.** Captures request/response pairs. Optional URL filter. |
| `helpers.getFailedRequests(collector)` | Get 4xx, 5xx, and connection failures from collector. |
| `helpers.getCapturedRequests(collector)` | Get all captured request/response entries. |
| `helpers.waitForApiResponse(page, '/api/users', { status: 200 })` | Wait for a specific API call to complete. Returns `{ url, status, body, json }`. |

### Browser State — inspect storage and cookies

| Helper | When to use |
|---|---|
| `helpers.getLocalStorage(page)` | Get all localStorage entries. Pass a key for a single value. |
| `helpers.getSessionStorage(page)` | Get all sessionStorage entries. Pass a key for a single value. |
| `helpers.getCookies(context)` | Get all cookies from browser context. |
| `helpers.clearAllStorage(page)` | Clear localStorage + sessionStorage + cookies. Use for clean-state testing. |

### Video Recording — record browser interactions

| Helper | When to use |
|---|---|
| `helpers.createVideoContext(browser, { outputDir: '/tmp/videos' })` | Create a context that records video. Video saved when page/context closes. |

### Resolution Presets — consistent dimensions per target

| Helper | When to use |
|---|---|
| `helpers.RESOLUTION_PRESETS` | Access preset configs. Keys: `docs-retina`, `pr-standard`, `gif-compact`. Each has `viewport` and `deviceScaleFactor`. |
| `helpers.createPresetContext(browser, 'preset')` | Create a context with preset viewport + DPR. Replaces manual viewport/DPR config. |

### Media Conversion — screenshots to GIF

| Helper | When to use |
|---|---|
| `helpers.screenshotsToGif(frames, path, opts)` | Convert PNG buffers to animated GIF. Options: `width`, `height`, `fps`, `quality`. For PR step-by-step demos. |

### Accessibility — WCAG audits and keyboard navigation

| Helper | When to use |
|---|---|
| `helpers.runAccessibilityAudit(page)` | Inject axe-core and run WCAG 2.0 AA audit. Returns violations with impact/description. Requires internet (CDN). |
| `helpers.checkFocusOrder(page, ['#first', '#second', '#third'])` | Tab through elements and verify focus lands on expected selectors in order. |

### Performance Metrics — measure page speed

| Helper | When to use |
|---|---|
| `helpers.capturePerformanceMetrics(page)` | Capture Navigation Timing (TTFB, DOM interactive) and Web Vitals (FCP, LCP, CLS). Call after page load. |

### Responsive Screenshots — multi-viewport sweep

| Helper | When to use |
|---|---|
| `helpers.captureResponsiveScreenshots(page, url)` | Screenshot at mobile/tablet/desktop/wide breakpoints. Custom breakpoints and output dir optional. |

### Network Simulation — test degraded conditions

| Helper | When to use |
|---|---|
| `helpers.simulateSlowNetwork(page, 500)` | Add artificial latency (ms) to all requests. |
| `helpers.simulateOffline(context)` | Set browser to offline mode. |
| `helpers.blockResources(page, ['image', 'font'])` | Block specific resource types (image, font, stylesheet, script, etc.). |

### Layout Inspection — verify element positioning

| Helper | When to use |
|---|---|
| `helpers.getElementBounds(page, '.selector')` | Get bounding box, visibility, viewport presence, and computed styles. |

## Custom HTTP Headers

Configure custom headers for all HTTP requests via environment variables. Useful for:

- Identifying automated traffic to your backend
- Getting LLM-optimized responses (e.g., plain text errors instead of styled HTML)
- Adding authentication tokens globally

### Configuration

**Single header (common case):**

```bash
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=playwright-skill \
  cd $SKILL_DIR && node run.js /tmp/my-script.js
```

**Multiple headers (JSON format):**

```bash
PW_EXTRA_HEADERS='{"X-Automated-By":"playwright-skill","X-Debug":"true"}' \
  cd $SKILL_DIR && node run.js /tmp/my-script.js
```

### How It Works

Headers are automatically applied when using `helpers.createContext()`:

```javascript
const context = await helpers.createContext(browser);
const page = await context.newPage();
// All requests from this page include your custom headers
```

For scripts using raw Playwright API, use the injected `getContextOptionsWithHeaders()`:

```javascript
const context = await browser.newContext(
  getContextOptionsWithHeaders({ viewport: { width: 1920, height: 1080 } }),
);
```

## Advanced Usage

For comprehensive Playwright API documentation, see [API_REFERENCE.md](API_REFERENCE.md):

- Selectors & Locators best practices
- Network interception & API mocking
- Authentication & session management
- Visual regression testing
- Mobile device emulation
- Performance testing
- Debugging techniques
- CI/CD integration

## Tips

- **CRITICAL: Detect servers FIRST** - Always run `detectDevServers()` before writing test code for localhost testing
- **Custom headers** - Use `PW_HEADER_NAME`/`PW_HEADER_VALUE` env vars to identify automated traffic to your backend
- **Use /tmp for test files** - Write to `/tmp/playwright-test-*.js`, never to skill directory or user's project
- **Parameterize URLs** - Put detected/provided URL in a `TARGET_URL` constant at the top of every script
- **DEFAULT: Headless browser** - Always use `headless: true` for Docker/CI compatibility
- **Headed mode** - Use `headless: false` when user specifically requests visible browser or is debugging locally
- **Wait strategies:** Use `waitForURL`, `waitForSelector`, `waitForLoadState` instead of fixed timeouts
- **Error handling:** Always use try-catch for robust automation
- **Console output:** Use `console.log()` to track progress and show what's happening
- **Docker:** The `--no-sandbox` flag is included by default in helpers for container compatibility

## Troubleshooting

**Playwright not installed:**

```bash
cd $SKILL_DIR && npm run setup
```

**Module not found:**
Ensure running from skill directory via `run.js` wrapper

**Browser doesn't launch in Docker:**
Ensure `--no-sandbox` and `--disable-setuid-sandbox` args are set (included by default in helpers)

**Element not found:**
Add wait: `await page.waitForSelector('.element', { timeout: 10000 })`
