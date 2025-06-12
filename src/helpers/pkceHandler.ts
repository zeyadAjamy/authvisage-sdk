import { isBrowser } from "@/utils/environment";
import { Buffer } from "buffer";

/**
 * PKCE Challenge Pair structure
 */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Utility class for handling PKCE authentication
 */
export class PKCEHandler {
  private static readonly PKCE_STORAGE_KEY = "authVisage:pkce_verifier";

  /**
   * Generates a PKCE challenge pair
   */
  private static async _sha256Base64UrlEncode(
    inputStr: string
  ): Promise<string> {
    if (!isBrowser()) {
      return "";
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(inputStr);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const base64 = Buffer.from(hash).toString("base64");

    // Convert to base64url by replacing chars and removing padding
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  private static async _storeCodeVerifier(codeVerifier: string): Promise<void> {
    if (!isBrowser()) {
      return;
    }

    localStorage.setItem(this.PKCE_STORAGE_KEY, codeVerifier);
  }

  public static async getCodeVerifier(): Promise<string | null> {
    if (!isBrowser()) {
      return null;
    }

    const codeVerifier = localStorage.getItem(this.PKCE_STORAGE_KEY);
    if (!codeVerifier) {
      throw new Error("Code verifier not found in local storage.");
    }
    return codeVerifier;
  }

  public static async generate(): Promise<PKCEPair> {
    if (!isBrowser()) {
      return { codeVerifier: "", codeChallenge: "" };
    }

    const codeVerifier = crypto.randomUUID();
    const codeChallenge = await this._sha256Base64UrlEncode(codeVerifier);

    await this._storeCodeVerifier(codeVerifier);

    return { codeVerifier, codeChallenge };
  }
}
