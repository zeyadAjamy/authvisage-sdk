import { TokenManager } from "@/auth/tokenManager";
import * as safeAwait from "@/utils/safe-await";
import * as decodeJwt from "@/utils/decode-jwt";
import type { TokenResponse, User } from "@/types";

jest.mock("@/utils/safe-await");
jest.mock("@/utils/decode-jwt");

describe("TokenManager", () => {
  const backendUrl = "https://api.example.com";
  let tokenManager: TokenManager;

  // Mock response data
  const mockTokenResponse: TokenResponse = {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_in: 3600,
  };

  const mockUser: User = {
    id: "user-123",
    fullname: "Test User",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mocks with default implementations
    (safeAwait.safeAwait as jest.Mock).mockImplementation(async (promise) => {
      try {
        const data = await promise;
        return [data, null];
      } catch (error) {
        return [null, error];
      }
    });

    (decodeJwt.decodeJwt as jest.Mock).mockReturnValue(mockUser);

    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTokenResponse),
    });

    tokenManager = new TokenManager(backendUrl);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("setSession", () => {
    it("should set session and notify listeners", () => {
      const callback = jest.fn();
      tokenManager.onAuthStateChange(callback);

      tokenManager.setSession(mockTokenResponse);

      expect(callback).toHaveBeenCalledWith(mockUser);
      expect(decodeJwt.decodeJwt).toHaveBeenCalledWith(
        mockTokenResponse.access_token
      );
    });

    it("should set up token expiration timer", () => {
      const callback = jest.fn();
      tokenManager.onAuthStateChange(callback);

      tokenManager.setSession(mockTokenResponse);

      // Fast-forward time to just before expiration
      jest.advanceTimersByTime(3599 * 1000);
      expect(callback).toHaveBeenCalledTimes(1);

      // Fast-forward to expiration
      jest.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(null);
    });
  });

  describe("refreshSession", () => {
    it("credentials should be included in refresh request", async () => {
      // Then refresh it
      await tokenManager.getAccessToken();
      expect(fetch).toHaveBeenCalledWith(
        `${backendUrl}/oauth/refresh-token`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: "test-refresh-token",
          }),
        })
      );
    });

    it("should handle failed refresh", async () => {
      // Mock failed fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Invalid token",
      });

      // should return null on failure
      await expect(tokenManager.getAccessToken()).resolves.toEqual(null);
    });
  });

  describe("onAuthStateChange", () => {
    it("should register and notify callback", () => {
      const callback = jest.fn();
      const unsubscribe = tokenManager.onAuthStateChange(callback);

      tokenManager.setSession(mockTokenResponse);
      expect(callback).toHaveBeenCalledWith(mockUser);

      // Unsubscribe and verify no further calls
      unsubscribe();
      tokenManager.setSession({
        ...mockTokenResponse,
        access_token: "new-token",
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("logout", () => {
    it("should clear session and notify listeners", () => {
      tokenManager.logout();

      // Fetch should be called with logout endpoint
      expect(fetch).toHaveBeenCalledWith(`${backendUrl}/oauth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          expires_in: 3600,
        }),
      });
    });

    it("should throw an error on failed logout", async () => {
      // Mock failed fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Logout failed",
      });

      await expect(tokenManager.logout()).rejects.toThrow(
        "Failed to sign out: Logout failed"
      );
    });
  });
});
