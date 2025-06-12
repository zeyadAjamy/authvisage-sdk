import { isBrowser } from "@/utils/environment";
import type { TokenResponse } from "@/types";

/**
 * Utility class for managing session persistence in the browser
 * by storing a unique state value in localStorage.
 */
export class SessionPersistence {
  private static readonly STATE_STORAGE_KEY = "authVisage:sessionState";

  /**
   * Generates and stores a unique state value
   */
  public static setState(state: TokenResponse): void {
    if (!isBrowser()) {
      return;
    }

    const stateString = JSON.stringify(state);
    localStorage.setItem(this.STATE_STORAGE_KEY, stateString);
  }

  /**
   * Retrieves the stored state value
   */
  public static getState(): TokenResponse | null {
    if (!isBrowser()) {
      return null;
    }

    const stateString = localStorage.getItem(this.STATE_STORAGE_KEY);
    if (!stateString) {
      return null;
    }

    try {
      const state: TokenResponse = JSON.parse(stateString);
      localStorage.removeItem(this.STATE_STORAGE_KEY); // Clear after retrieval
      return state;
    } catch (error) {
      console.error("Failed to parse session state:", error);
      return null;
    }
  }

  /**
   * Clears the stored state value
   */
  public static clearState(): void {
    if (!isBrowser()) {
      return;
    }

    localStorage.removeItem(this.STATE_STORAGE_KEY);
  }
}
