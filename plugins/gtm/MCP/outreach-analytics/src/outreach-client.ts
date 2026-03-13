/**
 * Outreach API Client with automatic token refresh
 */

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface OutreachConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
}

export class OutreachClient {
  private config: OutreachConfig;
  private tokenData: TokenData;
  private baseUrl = "https://api.outreach.io/api/v2";

  constructor() {
    this.config = {
      clientId: process.env.OUTREACH_CLIENT_ID || "",
      clientSecret: process.env.OUTREACH_CLIENT_SECRET || "",
      accessToken: process.env.OUTREACH_ACCESS_TOKEN || "",
      refreshToken: process.env.OUTREACH_REFRESH_TOKEN || "",
    };

    if (!this.config.accessToken) {
      throw new Error(
        "OUTREACH_ACCESS_TOKEN is required. Run 'npm run auth' first."
      );
    }

    this.tokenData = {
      accessToken: this.config.accessToken,
      refreshToken: this.config.refreshToken,
      expiresAt: Date.now() + 7200 * 1000, // Assume 2 hours initially
    };
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("https://api.outreach.io/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.tokenData.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    this.tokenData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || this.tokenData.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    console.error("Token refreshed successfully");
  }

  private async getValidToken(): Promise<string> {
    // Refresh if token expires in less than 5 minutes
    if (Date.now() > this.tokenData.expiresAt - 300000) {
      await this.refreshAccessToken();
    }
    return this.tokenData.accessToken;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getValidToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Outreach API error ${response.status}: ${error}`);
    }

    return response.json();
  }

  // Convenience methods for common operations
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  // Paginated fetch - gets all pages
  async getAllPages<T>(endpoint: string, maxPages = 10): Promise<T[]> {
    const results: T[] = [];
    let url = endpoint;
    let page = 0;

    while (url && page < maxPages) {
      const response: any = await this.get(url);
      if (response.data) {
        results.push(...response.data);
      }

      // Check for next page
      url = response.links?.next || "";
      if (url) {
        // Extract just the path from the full URL
        url = url.replace(this.baseUrl, "");
      }
      page++;
    }

    return results;
  }
}
