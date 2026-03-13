#!/bin/bash

# MCP Server Setup Script for GTM Workflows
# Usage: ./setup-mcp.sh [options]
#
# Options:
#   --all           Install all servers (default)
#   --http          Install HTTP servers only (figma, posthog, crustdata)
#   --npx           Install NPX servers only (hubspot, playwright)
#   --local         Build and install local servers only
#   --help          Show this help message

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_header() { echo -e "\n${GREEN}=== $1 ===${NC}\n"; }

show_help() {
    head -12 "$0" | tail -10
    exit 0
}

install_http_servers() {
    print_header "Installing HTTP Servers"

    echo "Adding Figma..."
    claude mcp add figma -t http -s user -- https://mcp.figma.com/mcp && print_status "Figma added" || print_warning "Figma already exists or failed"

    echo "Adding PostHog..."
    claude mcp add posthog -t http -s user -- https://mcp.posthog.com/mcp && print_status "PostHog added" || print_warning "PostHog already exists or failed"

    echo "Adding Crustdata..."
    claude mcp add crustdata -t http -s user -- https://agents-demos-internal.preview.inkeep.com/meeting-prep-assistant/crustdata/mcp && print_status "Crustdata added" || print_warning "Crustdata already exists or failed"
}

install_npx_servers() {
    print_header "Installing NPX Servers"

    echo "Adding HubSpot..."
    claude mcp add hubspot -s user -- npx -y hubspot-mcp && print_status "HubSpot added" || print_warning "HubSpot already exists or failed"

    echo "Adding Playwright..."
    claude mcp add playwright -s user -- npx -y @playwright/mcp@latest && print_status "Playwright added" || print_warning "Playwright already exists or failed"
}

install_local_servers() {
    print_header "Building and Installing Local Servers"

    # UnifyGTM
    echo "Building UnifyGTM..."
    if [ -d "$SCRIPT_DIR/unifygtm" ]; then
        cd "$SCRIPT_DIR/unifygtm"
        npm install && npm run build

        if [ -z "$UNIFYGTM_API_KEY" ]; then
            print_warning "UNIFYGTM_API_KEY not set. Set it and run:"
            echo "  claude mcp add unifygtm -s user -e UNIFYGTM_API_KEY=\"your-key\" -- node $SCRIPT_DIR/unifygtm/build/index.js"
        else
            claude mcp add unifygtm -s user -e UNIFYGTM_API_KEY="$UNIFYGTM_API_KEY" -- node "$SCRIPT_DIR/unifygtm/build/index.js" && print_status "UnifyGTM added" || print_warning "UnifyGTM already exists or failed"
        fi
    else
        print_error "unifygtm directory not found"
    fi

    # LinkedIn Ads
    echo "Building LinkedIn Ads..."
    if [ -d "$SCRIPT_DIR/linkedin-ads" ]; then
        cd "$SCRIPT_DIR/linkedin-ads"
        npm install && npm run build

        if [ -z "$LINKEDIN_ACCESS_TOKEN" ]; then
            print_warning "LINKEDIN_ACCESS_TOKEN not set. Run oauth-helper.cjs first:"
            echo "  LINKEDIN_CLIENT_ID=\"your-id\" LINKEDIN_CLIENT_SECRET=\"your-secret\" node $SCRIPT_DIR/linkedin-ads/oauth-helper.cjs"
            echo "  Then: claude mcp add linkedin-ads -s user -e LINKEDIN_ACCESS_TOKEN=\"token\" -e LINKEDIN_AD_ACCOUNT_ID=\"id\" -- node $SCRIPT_DIR/linkedin-ads/build/index.js"
        else
            claude mcp add linkedin-ads -s user -e LINKEDIN_ACCESS_TOKEN="$LINKEDIN_ACCESS_TOKEN" -e LINKEDIN_AD_ACCOUNT_ID="${LINKEDIN_AD_ACCOUNT_ID:-}" -- node "$SCRIPT_DIR/linkedin-ads/build/index.js" && print_status "LinkedIn Ads added" || print_warning "LinkedIn Ads already exists or failed"
        fi
    else
        print_error "linkedin-ads directory not found"
    fi

    # Outreach Analytics
    echo "Building Outreach Analytics..."
    if [ -d "$SCRIPT_DIR/outreach-analytics" ]; then
        cd "$SCRIPT_DIR/outreach-analytics"
        npm install && npm run build

        if [ ! -f ".env" ] && [ -z "$OUTREACH_ACCESS_TOKEN" ]; then
            print_warning "Outreach credentials not configured. Copy .env.example to .env and configure:"
            echo "  cp $SCRIPT_DIR/outreach-analytics/.env.example $SCRIPT_DIR/outreach-analytics/.env"
            echo "  Then: claude mcp add outreach-analytics -s user -- node $SCRIPT_DIR/outreach-analytics/dist/index.js"
        else
            claude mcp add outreach-analytics -s user -- node "$SCRIPT_DIR/outreach-analytics/dist/index.js" && print_status "Outreach Analytics added" || print_warning "Outreach Analytics already exists or failed"
        fi
    else
        print_error "outreach-analytics directory not found"
    fi

    cd "$SCRIPT_DIR"
}

verify_installation() {
    print_header "Verifying Installation"
    claude mcp list
}

# Parse arguments
INSTALL_HTTP=false
INSTALL_NPX=false
INSTALL_LOCAL=false

if [ $# -eq 0 ]; then
    INSTALL_HTTP=true
    INSTALL_NPX=true
    INSTALL_LOCAL=true
fi

for arg in "$@"; do
    case $arg in
        --all)
            INSTALL_HTTP=true
            INSTALL_NPX=true
            INSTALL_LOCAL=true
            ;;
        --http)
            INSTALL_HTTP=true
            ;;
        --npx)
            INSTALL_NPX=true
            ;;
        --local)
            INSTALL_LOCAL=true
            ;;
        --help|-h)
            show_help
            ;;
        *)
            print_error "Unknown option: $arg"
            show_help
            ;;
    esac
done

# Run installations
echo -e "${GREEN}"
echo "╔══════════════════════════════════════╗"
echo "║     MCP Server Setup Script          ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

$INSTALL_HTTP && install_http_servers
$INSTALL_NPX && install_npx_servers
$INSTALL_LOCAL && install_local_servers

verify_installation

print_header "Setup Complete"
echo "Run 'claude mcp list' to verify all servers are connected."
