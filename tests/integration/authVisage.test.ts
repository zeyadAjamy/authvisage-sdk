import { AuthVisageClient } from "@/auth/authVisageClient";
import { TokenManager } from "@/auth/tokenManager";
import { isBrowser } from "@/utils/environment";
import { createTestJWT, createTestUserPayload } from "../utils/test-helpers";

jest.mock("@/utils/environment", () => ({
  isBrowser: jest.fn(),
}));

// Mock OAuth handlers for integration tests
jest.mock("@/helpers/oauthStateHandler", () => ({
  OAuthStateHandler: {
    generate: jest.fn(() => "test-state"),
    validate: jest.fn(() => true),
  },
}));

jest.mock("@/helpers/pkceHandler", () => ({
  PKCEHandler: {
    generate: jest.fn(() =>
      Promise.resolve({
        codeVerifier: "test-verifier",
        codeChallenge: "test-challenge",
      })
    ),
    getCodeVerifier: jest.fn(() => Promise.resolve("test-verifier")),
  },
}));

describe("AuthVisage SDK Integration Tests", () => {
  // Save originals to restore later
  const originalFetch = global.fetch;
  const originalLocation = window.location;
  beforeEach(() => {
    // Mock browser environment
    (isBrowser as jest.Mock).mockReturnValue(true);

    // Set up test environment
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        assign: jest.fn(),
        search: "",
      },
      writable: true,
    });

    // Mock fetch responses for different endpoints
    global.fetch = jest
      .fn()
      // Session creation
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "test-session-id" }),
        })
      )
      // Token exchange
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: "test-access-token",
              refresh_token: "test-refresh-token",
              expires_in: 3600,
            }),
        })
      );
  });

  afterEach(() => {
    // Restore originals
    global.fetch = originalFetch;
    // Restore location using Object.defineProperty to avoid type issues
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    jest.restoreAllMocks();
  });
  test("Complete authentication flow", async () => {
    // 1. Create client
    const client = new AuthVisageClient({
      projectId: "5e27e696-7ed2-4ebb-980f-a0b57ae3f134",
      platformUrl: "https://platform.example.com",
      backendUrl: "https://api.example.com",
      redirectUrl: "https://app.example.com/callback",
    });

    // 2. Start face login
    await client.faceLogin();

    // Verify redirection happened
    expect(window.location.assign).toHaveBeenCalledWith(
      expect.stringContaining("https://platform.example.com/authorize")
    );

    // 3. Simulate OAuth callback by setting up URL parameters BEFORE creating a new client
    // This simulates the user being redirected back with OAuth callback parameters
    window.location.search = "?code=test-auth-code&state=test-state";

    // Mock localStorage for state validation
    window.localStorage.setItem("authVisage:state", "test-state");
    window.localStorage.setItem("authVisage:pkce_verifier", "test-verifier"); // Reset fetch mock for token exchange
    const testUserPayload = createTestUserPayload();
    const validAccessToken = createTestJWT(testUserPayload);

    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: validAccessToken,
            refresh_token: "test-refresh-token",
            expires_in: 3600,
          }),
      })
    );

    // 4. Set up auth state change listener BEFORE creating client that will handle callback
    const authStateCallback = jest.fn();

    // 5. Create a new client instance which will automatically handle the OAuth callback
    // due to the search parameters we set above
    const callbackClient = new AuthVisageClient({
      projectId: "5e27e696-7ed2-4ebb-980f-a0b57ae3f134",
      platformUrl: "https://platform.example.com",
      backendUrl: "https://api.example.com",
      redirectUrl: "https://app.example.com/callback",
    });

    // Set up the callback listener
    callbackClient.auth.onAuthStateChange(authStateCallback);

    // Wait for the async callback handling to complete
    await new Promise((resolve) => setTimeout(resolve, 10)); // 6. Verify token exchange happened
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/oauth/token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          code: "test-auth-code",
          code_verifier: "test-verifier",
        }),
      })
    ); // 7. Verify auth state change happened and user object is returned
    expect(authStateCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: "test-user-id",
        email: "test@example.com",
        name: "Test User",
      })
    );
  });

  test("Graceful handling in server environment", async () => {
    // Mock non-browser environment
    (isBrowser as jest.Mock).mockReturnValue(false);

    // Create client
    const client = new AuthVisageClient({
      projectId: "5e27e696-7ed2-4ebb-980f-a0b57ae3f134",
      platformUrl: "https://platform.example.com",
      backendUrl: "https://api.example.com",
      redirectUrl: "https://app.example.com/callback",
    });

    // Verify no browser APIs are called during initialization
    expect(window.location.assign).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();

    // Try to access auth-related functionality
    await expect(client.faceLogin()).rejects.toThrow();

    // Core functionality should still be accessible
    expect(client.auth).toBeInstanceOf(TokenManager);
  });
});
