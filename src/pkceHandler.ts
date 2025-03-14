/**
 * PKCE Challenge Pair structure
 */
interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Utility class for handling PKCE authentication
 */
export class PKCEHandler {
  private static readonly PKCE_COOKIE_NAME = "authVisage:pkce_verifier";

  /**
   * Generates a PKCE challenge pair
   */
  public static async generate(): Promise<PKCEPair> {
    const codeVerifier = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const codeChallenge = Buffer.from(hash).toString("base64url");

    document.cookie = `${this.PKCE_COOKIE_NAME}=${codeVerifier}; Secure; HttpOnly; SameSite=Lax; Path=/;`;

    return { codeVerifier, codeChallenge };
  }
}
