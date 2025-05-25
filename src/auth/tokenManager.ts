import { safeAwait } from "@/utils/safe-await";
import { decodeJwt } from "@/utils/decode-jwt";
import { ListenerManager } from "@/helpers/listenerManager";
import type { User, TokenResponse } from "@/types";

export type Callback = (user: User | null) => void;

export class TokenManager {
  private backendUrl: string;
  private expirationTimer: NodeJS.Timeout | null;
  private listenerManager: ListenerManager<User | null>;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
    this.listenerManager = new ListenerManager<User | null>();
    this.expirationTimer = null;
  }

  /**
   * Handle token expiration by setting a timer.
   * @param expiresIn - The time in seconds until the token expires.
   */
  private _handleTokenExpiration(expiresIn?: number): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
    }

    if (expiresIn) {
      this.expirationTimer = setTimeout(() => {
        this.listenerManager.notify(null);
      }, expiresIn * 1000);
    }
  }

  /**
   * Initializes the user session by validating and decoding the access token, notifying registered listeners,
   * and scheduling automatic token expiration handling.
   *
   * @param session - The token response containing the `access_token` and `expires_in` values.
   * @throws {Error} If the session does not include an `access_token`.
   * @returns A promise that resolves once the session is set and expiration handling is in place.
   */
  public async setSession(session: TokenResponse): Promise<void> {
    if (!session.access_token) {
      throw new Error("Session must contain an access token.");
    }

    const decodedToken = decodeJwt<User>(session.access_token);
    this.listenerManager.notify(decodedToken);

    // Handle token expiration
    this._handleTokenExpiration(session.expires_in);
  }

  /**
   * Sends a refresh request to get a new access token.
   * Assumes the refresh token is stored in cookies.
   */
  public async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.backendUrl}/oauth/refresh-token`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      this.listenerManager.notify(null);
      throw new Error(`Failed to refresh access token: ${response.statusText}`);
    }

    const [data, error] = await safeAwait<TokenResponse>(response.json());
    if (error) {
      throw new Error("Failed to parse token response.");
    }
    this.setSession(data);
    return data.access_token;
  }

  /**
   * Logs the current user out by sending a POST request to the backend logout endpoint.
   *
   * This method includes credentials with the request and throws an error if the response
   * status is not in the 200–299 range. On a successful logout, it notifies all registered
   * listeners with `null`.
   *
   * @returns A promise that resolves when the logout operation completes successfully.
   * @throws {Error} If the logout request fails or the response is not OK.
   */
  public async logout(): Promise<void> {
    const response = await fetch(`${this.backendUrl}/oauth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to sign out: ${response.statusText}`);
    }

    this.listenerManager.notify(null);
  }

  /**
   * Subscribes to authentication state changes.
   *
   * @param callback - Function to be invoked whenever the authentication state updates.
   * @returns A Promise that resolves to an unsubscribe function which,
   *          when called, removes the listener.
   */
  public onAuthStateChange(callback: Callback) {
    const unsubscribe = this.listenerManager.subscribe(callback);
    // Immediately notify the listener with the current user state
    this.getAccessToken();
    return unsubscribe;
  }
}
