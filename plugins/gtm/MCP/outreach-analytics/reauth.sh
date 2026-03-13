#!/bin/bash
#
# Simple Outreach Re-authentication Script
# Usage: ./reauth.sh
#

cd "$(dirname "$0")"

echo ""
echo "============================================"
echo "  Outreach Re-authentication"
echo "============================================"
echo ""

# Check if ngrok is running
if ! pgrep -x "ngrok" > /dev/null; then
    echo "⚠️  ngrok is not running!"
    echo ""
    echo "1. Open a NEW terminal window"
    echo "2. Run: ngrok http 3000"
    echo "3. Come back here and press Enter"
    echo ""
    read -p "Press Enter when ngrok is running..."
fi

echo ""
echo "Starting auth server..."
echo ""

# Run auth and open browser automatically
npm run auth &
AUTH_PID=$!

# Wait for server to start
sleep 2

# Get the auth URL from the .env file and open browser
AUTH_URL="https://api.outreach.io/oauth/authorize?client_id=$(grep OUTREACH_CLIENT_ID .env | cut -d '=' -f2 | sed 's/~/%7E/g')&redirect_uri=$(grep OUTREACH_REDIRECT_URI .env | cut -d '=' -f2 | sed 's/:/%3A/g; s/\//%2F/g')&response_type=code&scope=sequences.read+sequenceStates.read+sequenceSteps.read+prospects.read+accounts.read+mailings.read+calls.read+tasks.read+users.read"

echo "Opening browser..."
open "$AUTH_URL" 2>/dev/null || xdg-open "$AUTH_URL" 2>/dev/null || echo "Open this URL: $AUTH_URL"

# Wait for auth to complete
wait $AUTH_PID

echo ""
echo "============================================"
echo "  Done! Tokens updated in .env"
echo "============================================"
echo ""
echo "If using Claude Desktop, restart it to pick up new tokens."
echo ""
