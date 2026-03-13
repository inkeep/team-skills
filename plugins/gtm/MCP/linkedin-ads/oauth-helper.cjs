#!/usr/bin/env node

const http = require('http');
const { URL } = require('url');

// LinkedIn OAuth credentials - set these environment variables before running
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:3456/callback';
const SCOPES = 'r_ads,r_ads_reporting,r_organization_admin';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables are required');
  process.exit(1);
}

// Step 1: Generate authorization URL
const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;

console.log('\n=== LinkedIn OAuth Helper ===\n');
console.log('Step 1: Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n');
console.log('Step 2: Authorize the app on LinkedIn');
console.log('Step 3: You will be redirected back here automatically\n');
console.log('Waiting for callback on http://localhost:3456 ...\n');

// Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3456`);

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error: ${error}</h1><p>${url.searchParams.get('error_description')}</p>`);
      console.error('Error:', error, url.searchParams.get('error_description'));
      server.close();
      process.exit(1);
    }

    if (code) {
      console.log('Received authorization code, exchanging for access token...\n');

      try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          console.log('=== SUCCESS! ===\n');
          console.log('Access Token:');
          console.log(tokenData.access_token);
          console.log('\nExpires in:', tokenData.expires_in, 'seconds');
          console.log('\n=== Run this command to update your MCP config: ===\n');
          console.log(`claude mcp remove linkedin-ads -s user && claude mcp add linkedin-ads -s user -- node /Users/heeguneom/.claude/mcp-servers/linkedin-ads/build/index.js -e LINKEDIN_ACCESS_TOKEN="${tokenData.access_token}" -e LINKEDIN_AD_ACCOUNT_ID="513440684"`);
          console.log('\n');

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>Success!</h1>
            <p>Access token obtained. Check your terminal for the token and update command.</p>
            <p>You can close this window.</p>
          `);
        } else {
          console.error('Error getting token:', tokenData);
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Error</h1><pre>${JSON.stringify(tokenData, null, 2)}</pre>`);
        }
      } catch (err) {
        console.error('Error:', err);
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>Error</h1><pre>${err.message}</pre>`);
      }

      server.close();
      process.exit(0);
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3456, () => {
  // Try to open the URL automatically
  const { exec } = require('child_process');
  exec(`open "${authUrl}"`);
});
