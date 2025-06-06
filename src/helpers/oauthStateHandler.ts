import { isBrowser } from "@/utils/environment";

/**
 * Utility class for managing OAuth state
 */
export class OAuthStateHandler {
  private static readonly STATE_STORAGE_KEY = "authVisage:state";

  /**
   * Generates and stores a unique state value
   */
  public static generate(): string {
    if (!isBrowser()) {
      return "";
    }

    const state = crypto.randomUUID();
    localStorage.setItem(this.STATE_STORAGE_KEY, state);
    return state;
  }

  /**
   * Validates the returned state against the stored one
   */
  public static validate(state: string): boolean {
    if (!isBrowser()) {
      return false;
    }

    const storedState = localStorage.getItem(this.STATE_STORAGE_KEY);
    localStorage.removeItem(this.STATE_STORAGE_KEY);
    return storedState === state;
  }
}
