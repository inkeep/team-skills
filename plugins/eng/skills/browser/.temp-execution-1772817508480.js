
const helpers = require('./lib/helpers');
const { connectToLocalBrowser, getConnectedPage, extractAuthState } = require('./lib/local-browser');

(async () => {
  let connection;
  try {
    console.log('Connecting to Chrome via Playwright MCP Bridge extension...');
    connection = await connectToLocalBrowser();
    const { browser, context, page } = connection;
    console.log('Connected to Chrome. Page ready.\n');

    // Final gradient test with refreshed session + correct headers
await page.goto('https://linear.app/inkeep', { waitUntil: 'domcontentloaded', timeout: 20000 });
await new Promise(r => setTimeout(r, 2000));

const cookies = await context.cookies(['https://linear.app', 'https://client-api.linear.app']);
const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
const sessionCookie = cookies.find(c => c.name.startsWith('session:'));
const uploadsSigCookie = cookies.find(c => c.name.startsWith('uploadsSig:'));
console.log('Session cookie:', sessionCookie?.name, 'len:', sessionCookie?.value.length);
console.log('UploadsSig cookie:', uploadsSigCookie?.name, 'len:', uploadsSigCookie?.value.length);

// Decode uploadsSig JWT
try {
  const parts = uploadsSigCookie.value.split('.');
  const payload = JSON.parse(atob(parts[1]));
  console.log('UploadsSig JWT:', JSON.stringify(payload, null, 2));
} catch (e) { console.log('UploadsSig decode error:', e.message); }

const userAccountId = 'a0ea1403-9657-4098-bea4-ca6906c5549d';
const userId = '19852779-ce8a-4213-942b-5109f36160f1';
const orgId = 'cd96d0c1-81d3-4b25-8de1-1cde8681a6e9';

async function extTest(label, url, opts = {}) {
  try {
    const resp = await page.request.fetch(url, {
      method: opts.method || 'POST',
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      data: opts.data || JSON.stringify({ query: '{ viewer { id name email } }' })
    });
    const body = await resp.text();
    const rh = resp.headers();
    console.log(`  ${label}: ${resp.status()}`);
    console.log(`    Body: ${body.substring(0, 200)}`);
    if (rh['access-control-allow-origin']) console.log(`    ACAO: ${rh['access-control-allow-origin']}`);
    return resp.status();
  } catch (e) {
    console.log(`  ${label}: ERROR ${e.message.substring(0, 80)}`);
    return 0;
  }
}

// External tests (page.request.fetch — like curl)
console.log('\n=== EXTERNAL: Internal API with all headers ===');
await extTest('full-headers-internal', 'https://client-api.linear.app/graphql', {
  headers: {
    Cookie: cookieStr,
    Origin: 'https://linear.app',
    useraccount: userAccountId,
    user: userId,
    organization: orgId
  }
});

console.log('\n=== EXTERNAL: Internal API without org headers ===');
await extTest('no-org-headers', 'https://client-api.linear.app/graphql', {
  headers: {
    Cookie: cookieStr,
    Origin: 'https://linear.app',
    useraccount: userAccountId
  }
});

console.log('\n=== EXTERNAL: Internal API with extension origin ===');
await extTest('ext-origin', 'https://client-api.linear.app/graphql', {
  headers: {
    Cookie: cookieStr,
    Origin: 'chrome-extension://abcdefghijklmnop',
    useraccount: userAccountId,
    user: userId,
    organization: orgId
  }
});

console.log('\n=== EXTERNAL: Internal API no origin ===');
await extTest('no-origin', 'https://client-api.linear.app/graphql', {
  headers: {
    Cookie: cookieStr,
    useraccount: userAccountId,
    user: userId,
    organization: orgId
  }
});

// Minimum cookie set tests
console.log('\n=== MINIMUM COOKIE SET ===');
const sessionOnly = `${sessionCookie.name}=${sessionCookie.value}`;
const uploadsSigOnly = `${uploadsSigCookie.name}=${uploadsSigCookie.value}`;
const sessionPlusUploads = `${sessionOnly}; ${uploadsSigOnly}`;

await extTest('session-only', 'https://client-api.linear.app/graphql', {
  headers: { Cookie: sessionOnly, Origin: 'https://linear.app', useraccount: userAccountId, user: userId, organization: orgId }
});

await extTest('uploadsSig-only', 'https://client-api.linear.app/graphql', {
  headers: { Cookie: uploadsSigOnly, Origin: 'https://linear.app', useraccount: userAccountId, user: userId, organization: orgId }
});

await extTest('session+uploadsSig', 'https://client-api.linear.app/graphql', {
  headers: { Cookie: sessionPlusUploads, Origin: 'https://linear.app', useraccount: userAccountId, user: userId, organization: orgId }
});

// Test issues query externally
console.log('\n=== EXTERNAL: issues query ===');
await extTest('issues-external', 'https://client-api.linear.app/graphql', {
  headers: {
    Cookie: cookieStr,
    Origin: 'https://linear.app',
    useraccount: userAccountId,
    user: userId,
    organization: orgId
  },
  data: JSON.stringify({ query: '{ issues(first: 2) { nodes { id title } } }' })
});

// Test sync endpoint externally
console.log('\n=== EXTERNAL: sync user_sync_groups ===');
await extTest('sync-external', 'https://client-api.linear.app/sync/user_sync_groups', {
  method: 'GET',
  headers: {
    Cookie: cookieStr,
    Origin: 'https://linear.app',
    useraccount: userAccountId,
    user: userId,
    organization: orgId
  },
  data: undefined
});

// Public API with Bearer — test with extracted session JWT as token
console.log('\n=== PUBLIC API: Session JWT as Bearer ===');
await extTest('public-jwt-bearer', 'https://api.linear.app/graphql', {
  headers: { Authorization: `Bearer ${sessionCookie.value}` }
});

console.log('\n=== FINAL GRADIENT COMPLETE ===');


  } catch (error) {
    console.error('Automation error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (connection) await connection.close();
  }
})();
