/**
 * OAuth2 Token Retrieval Helper
 *
 * Run this once to get your initial access and refresh tokens:
 *   npm run auth
 *
 * Then copy the tokens to your .env file or Claude Desktop config.
 */

import { config } from "dotenv";
import { createServer } from "http";
import { URL } from "url";

// Load .env file
config();

const CLIENT_ID = process.env.OUTREACH_CLIENT_ID;
const CLIENT_SECRET = process.env.OUTREACH_CLIENT_SECRET;
const REDIRECT_URI = process.env.OUTREACH_REDIRECT_URI || "https://localhost:3000/callback";
const PORT = parseInt(new URL(REDIRECT_URI).port || "3000", 10);

const SCOPES = [
  "sequences.read",
  "sequenceStates.read",
  "sequenceSteps.read",
  "prospects.read",
  "accounts.read",
  "mailings.read",
  "calls.read",
  "tasks.read",
  "users.read",
].join(" ");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Error: Set OUTREACH_CLIENT_ID and OUTREACH_CLIENT_SECRET in your environment");
  console.error("");
  console.error("1. Go to https://developers.outreach.io");
  console.error("2. Create a new application");
  console.error("3. Set redirect URI to: http://localhost:3000/callback");
  console.error("4. Copy your Client ID and Client Secret");
  console.error("5. Set them as environment variables and run this again");
  process.exit(1);
}

const authUrl = new URL("https://api.outreach.io/oauth/authorize");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPES);

console.log("");
console.log("=".repeat(60));
console.log("Outreach OAuth2 Authorization");
console.log("=".repeat(60));
console.log("");

// Try to open browser automatically
const authUrlString = authUrl.toString();
import("child_process").then(({ exec }) => {
  const openCmd = process.platform === "darwin" ? "open" :
                  process.platform === "win32" ? "start" : "xdg-open";
  exec(`${openCmd} "${authUrlString}"`, (err) => {
    if (err) {
      console.log("Could not open browser automatically.");
      console.log("Open this URL manually:");
      console.log("");
      console.log(authUrlString);
    } else {
      console.log("Browser opened! Complete authorization there.");
    }
  });
});

console.log("");
console.log("Waiting for authorization...");
console.log("");

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "", `http://localhost:${PORT}`);

  if (url.pathname === "/callback") {
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`<h1>Authorization Failed</h1><p>${error}</p>`);
      console.error("Authorization failed:", error);
      process.exit(1);
    }

    if (code) {
      try {
        // Exchange code for tokens
        const tokenResponse = await fetch("https://api.outreach.io/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: code,
          }),
        });

        if (!tokenResponse.ok) {
          const err = await tokenResponse.text();
          throw new Error(`Token exchange failed: ${err}`);
        }

        const tokens = await tokenResponse.json();

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto;">
              <h1 style="color: green;">Authorization Successful!</h1>
              <p>Your tokens have been printed to the terminal.</p>
              <p>You can close this window.</p>
            </body>
          </html>
        `);

        console.log("=".repeat(60));
        console.log("SUCCESS! Copy these to your .env file:");
        console.log("=".repeat(60));
        console.log("");
        console.log(`OUTREACH_ACCESS_TOKEN=${tokens.access_token}`);
        console.log("");
        console.log(`OUTREACH_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log("");
        console.log("=".repeat(60));
        console.log("");
        console.log("Or add to Claude Desktop config (env section):");
        console.log("");
        console.log(JSON.stringify({
          OUTREACH_ACCESS_TOKEN: tokens.access_token,
          OUTREACH_REFRESH_TOKEN: tokens.refresh_token,
          OUTREACH_CLIENT_ID: CLIENT_ID,
          OUTREACH_CLIENT_SECRET: CLIENT_SECRET,
        }, null, 2));
        console.log("");

        setTimeout(() => process.exit(0), 1000);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(`<h1>Error</h1><p>${err}</p>`);
        console.error("Token exchange error:", err);
        process.exit(1);
      }
    }
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Callback server listening on port ${PORT}`);
});
