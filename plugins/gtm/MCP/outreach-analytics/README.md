# Outreach Analytics MCP Server

A read-only MCP server for analyzing Outreach.io campaign data with Claude.

## Features

- **Sequence Analytics**: List, compare, and analyze sequence performance
- **Email Metrics**: Open rates, click rates, reply rates, bounce rates
- **Prospect Data**: Search and view prospect engagement history
- **Campaign Summaries**: Aggregate metrics across all active campaigns

## Available Tools

| Tool | Description |
|------|-------------|
| `list_sequences` | List all sequences with stats |
| `get_sequence` | Get sequence details with steps |
| `get_sequence_performance` | Calculate performance metrics |
| `compare_sequences` | Compare multiple sequences (A/B testing) |
| `get_sequence_states` | Get prospects in a sequence |
| `get_mailings` | Get email engagement data |
| `search_prospects` | Search prospects by email/company |
| `get_prospect` | Get detailed prospect info |
| `list_accounts` | List company accounts |
| `get_campaign_summary` | Executive summary of all campaigns |

## Setup

### 1. Register an Outreach OAuth App

1. Go to [developers.outreach.io](https://developers.outreach.io)
2. Click **Create App**
3. Fill in app details:
   - Name: "Campaign Analytics MCP"
4. Copy your **Client ID** and **Client Secret** (secret shown only once!)

### 2. Set Up ngrok (Required - Outreach requires HTTPS)

```bash
# Install ngrok
brew install ngrok

# Start tunnel (in a separate terminal, keep it running)
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

Then in the Outreach Developer Portal, set your Redirect URI to:
```
https://abc123.ngrok-free.app/callback
```

### 3. Install Dependencies

```bash
cd outreach-analytics-mcp
npm install
npm run build
```

### 4. Get OAuth Tokens

```bash
export OUTREACH_CLIENT_ID="your_client_id"
export OUTREACH_CLIENT_SECRET="your_client_secret"
export OUTREACH_REDIRECT_URI="https://abc123.ngrok-free.app/callback"
npm run auth
```

This will:
1. Print an authorization URL
2. Open your browser to authorize
3. Print your access and refresh tokens

### 5. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "outreach-analytics": {
      "command": "node",
      "args": ["/Users/heeguneom/outreach-analytics-mcp/dist/index.js"],
      "env": {
        "OUTREACH_CLIENT_ID": "your_client_id",
        "OUTREACH_CLIENT_SECRET": "your_client_secret",
        "OUTREACH_ACCESS_TOKEN": "your_access_token",
        "OUTREACH_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

### 6. Restart Claude Desktop

Quit and reopen Claude Desktop to load the new server.

## Example Queries

Once connected, you can ask Claude things like:

- "Show me all my active sequences"
- "What's the reply rate for sequence 123?"
- "Compare sequences 123, 456, and 789"
- "Give me an executive summary of all campaigns"
- "Find prospects from Acme Corp"
- "What prospects are currently active in sequence 123?"

## API Scopes Used

This server requests read-only access:

- `sequences.read`
- `sequenceStates.read`
- `sequenceSteps.read`
- `prospects.read`
- `accounts.read`
- `mailings.read`
- `calls.read`
- `tasks.read`
- `users.read`

## Token Refresh

The server automatically refreshes expired tokens using the refresh token. Tokens expire every 2 hours, but the refresh token is long-lived.

## Troubleshooting

### "OUTREACH_ACCESS_TOKEN is required"

Run `npm run auth` to get your initial tokens.

### "Token refresh failed"

Your refresh token may have expired. Run `npm run auth` again.

### Server not appearing in Claude

1. Check the config file syntax (valid JSON?)
2. Verify the path to `dist/index.js` is correct
3. Restart Claude Desktop completely (Cmd+Q on Mac)
