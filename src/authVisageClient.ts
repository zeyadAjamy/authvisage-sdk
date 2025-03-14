import { GoTrueClient, GoTrueClientOptions, Session } from "@supabase/auth-js";
import { OAuthStateHandler } from "./oauthStateHandler";
import { PKCEHandler } from "./pkceHandler";

/**
 * Configuration options for AuthVisage authentication client
 */
export interface AuthVisageClientOptions extends GoTrueClientOptions {
  authVisageProjectId: string;
  authVisagePlatformUrl: string;
  redirectUrl: string;
}

/**
 * Structure for OAuth token response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Main AuthVisage client for handling authentication
 */
export class AuthVisageClient extends GoTrueClient {
  private readonly authVisageProjectId: string;
  private readonly authVisagePlatformUrl: string;
  private readonly redirectUrl: string;

  constructor(options: AuthVisageClientOptions) {
    const {
      authVisageProjectId,
      authVisagePlatformUrl,
      redirectUrl,
      ...goTrueOptions
    } = options;
    super(goTrueOptions);

    this.authVisageProjectId = authVisageProjectId;
    this.authVisagePlatformUrl = authVisagePlatformUrl;
    this.redirectUrl = redirectUrl;

    this._handleOAuthCallback().catch(console.error);
  }

  /**
   * Initiates the face login process by redirecting the user to AuthVisage
   */
  public async faceLogin(): Promise<void> {
    try {
      const authUrl = await this._constructAuthUrl();
      window.location.assign(authUrl);
    } catch (error) {
      throw new Error(
        `Face login initiation failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Constructs the OAuth authorization URL
   */
  private async _constructAuthUrl(): Promise<string> {
    const state = OAuthStateHandler.generate();
    const { codeChallenge } = await PKCEHandler.generate();

    const url = new URL(this.authVisagePlatformUrl + "/authorize");
    url.searchParams.append("state", state);
    url.searchParams.append("projectId", this.authVisageProjectId);
    url.searchParams.append("redirect_uri", this.redirectUrl);
    url.searchParams.append("code_challenge", codeChallenge);
    url.searchParams.append("code_challenge_method", "S256");

    return url.toString();
  }

  /**
   * Handles the OAuth callback and exchanges the authorization code for an access token
   */
  private async _handleOAuthCallback(): Promise<string | void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const returnedState = urlParams.get("state");

    if (!code || !returnedState) return;

    if (!OAuthStateHandler.validate(returnedState)) {
      throw new Error("State validation failed! Possible CSRF attack.");
    }

    const response = await fetch(`${this.authVisagePlatformUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        code,
        project_id: this.authVisageProjectId,
        redirect_uri: this.redirectUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = (await response.json()) as TokenResponse;

    if (!data.access_token) {
      throw new Error("Token response missing access_token");
    }

    if (data.refresh_token) {
      this.setSession(data as Session);
    }

    return data.access_token;
  }
}
