import { OAuthStateHandler } from "@/helpers/oauthStateHandler";
import { PKCEHandler } from "@/helpers/pkceHandler";
import {
  clientOptionsSchema,
  type ClientOptions,
} from "@/schemas/clientOptions";
import { safeAwait } from "@/utils/safe-await";
import { TokenManager } from "@/auth/tokenManager";
import type { TokenResponse } from "@/types";

/**
 * Main AuthVisage client for handling authentication
 */
export class AuthVisageClient {
  private readonly projectId: string;
  private readonly platformUrl: string;
  private readonly backendUrl: string;
  private readonly redirectUrl: string;
  public readonly auth: TokenManager;

  constructor(options: ClientOptions) {
    const { platformUrl, projectId, backendUrl, redirectUrl } = options;

    const { error } = clientOptionsSchema.safeParse(options);
    if (error) {
      const message = error.issues[0].message;
      throw new Error(
        `Invalid client options: ${message} (path: ${error.issues[0].path.join(
          "."
        )})`
      );
    }

    this.projectId = projectId;
    this.platformUrl = platformUrl;
    this.backendUrl = backendUrl;
    this.redirectUrl = redirectUrl;
    this.auth = new TokenManager(backendUrl);

    this._handleOAuthCallback().catch(console.error);
  }

  /**
   * Get Session id from the backend
   * @returns Session id
   */
  private async _getSessionId(): Promise<string> {
    const response = await fetch(`${this.backendUrl}/create-session`);

    if (!response.ok) {
      throw new Error("Session retrieval failed." + response.statusText);
    }

    const [data, error] = await safeAwait<{ id: string }>(response.json());
    if (error) {
      throw new Error("Failed to parse session ID response.");
    }
    return data.id;
  }

  /**
   * Constructs the OAuth authorization URL
   */
  private async _constructAuthUrl(): Promise<string> {
    const state = OAuthStateHandler.generate();
    const pkcePair = await PKCEHandler.generate();
    const sessionId = await this._getSessionId();

    const url = new URL(this.platformUrl + "/authorize");
    url.searchParams.append("state", state);
    url.searchParams.append("projectId", this.projectId);
    url.searchParams.append("redirect_uri", this.redirectUrl);
    url.searchParams.append("code_challenge", pkcePair.codeChallenge);
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("session_id", sessionId);

    return url.toString();
  }

  /**
   * Handles the OAuth callback and exchanges the authorization code for an access token
   */
  private async _handleOAuthCallback(): Promise<string | void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const returnedState = urlParams.get("state");
    const codeVerifier = PKCEHandler.getCodeVerifier();

    if (!code || !returnedState) {
      throw new Error(
        "Missing authorization code or state in the URL parameters."
      );
    }

    if (!OAuthStateHandler.validate(returnedState)) {
      throw new Error("State validation failed! Possible CSRF attack.");
    }

    const response = await fetch(`${this.backendUrl}/token`, {
      method: "POST",
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const [data, error] = await safeAwait<TokenResponse>(response.json());

    if (error) {
      throw new Error("Failed to parse token response.");
    }

    if (!data.access_token) {
      throw new Error("Token response missing access_token");
    }

    if (data.refresh_token) {
      this.auth.setSession(data);
    }

    return data.access_token;
  }

  /**
   * Initiates the face login process by redirecting the user to AuthVisage
   */
  public async faceLogin(): Promise<void> {
    const [data, error] = await safeAwait(this._constructAuthUrl());
    if (error) {
      throw new Error(`Face login failed: ${error.message}`);
    }
    window.location.assign(data);
  }
}
