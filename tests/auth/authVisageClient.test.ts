import { AuthVisageClient } from "@/auth/authVisageClient";
import { OAuthStateHandler } from "@/helpers/oauthStateHandler";
import { PKCEHandler } from "@/helpers/pkceHandler";
import { isBrowser } from "@/utils/environment";
import { createTestJWT, createTestUserPayload } from "../utils/test-helpers";

// Mock all dependencies
jest.mock("@/helpers/oauthStateHandler");
jest.mock("@/helpers/pkceHandler");
jest.mock("@/utils/environment", () => ({
  isBrowser: jest.fn(),
}));

// Mock TokenManager with actual functionality
const mockTokenManager = {
  setSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  getAccessToken: jest.fn(),
  logout: jest.fn(),
};

jest.mock("@/auth/tokenManager", () => ({
  TokenManager: jest.fn().mockImplementation(() => mockTokenManager),
}));

const validClientOptions = {
  projectId: "5e27e696-7ed2-4ebb-980f-a0b57ae3f134",
  platformUrl: "https://auth.example.com",
  backendUrl: "https://api.example.com",
  redirectUrl: "https://myapp.com/auth/callback",
};

describe("AuthVisageClient", () => {
  let originalLocation: Location;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Store originals
    originalLocation = window.location;
    originalFetch = global.fetch;

    // Reset all mocks
    jest.clearAllMocks();

    // Mock browser environment by default
    (isBrowser as jest.Mock).mockReturnValue(true);

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        href: "https://myapp.com/auth/callback",
        origin: "https://myapp.com",
        pathname: "/auth/callback",
        search: "",
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
      },
      writable: true,
    });

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Setup default successful responses
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: "session-123" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: createTestJWT(createTestUserPayload()),
            refresh_token: "rt_67890",
            expires_in: 3600,
            token_type: "Bearer",
          }),
      });

    // Setup OAuth handlers
    (OAuthStateHandler.generate as jest.Mock).mockReturnValue("state_abc123");
    (OAuthStateHandler.validate as jest.Mock).mockReturnValue(true);

    (PKCEHandler.generate as jest.Mock).mockResolvedValue({
      codeVerifier: "verifier_xyz789",
      codeChallenge: "challenge_def456",
    });
    (PKCEHandler.getCodeVerifier as jest.Mock).mockResolvedValue(
      "verifier_xyz789"
    );
  });

  afterEach(() => {
    // Restore originals
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should create instance with valid configuration", () => {
      const client = new AuthVisageClient(validClientOptions);

      expect(client).toBeInstanceOf(AuthVisageClient);
      expect(client.auth).toBeDefined();
    });

    it("should validate client options on instantiation", () => {
      const invalidClientOptions = {
        ...validClientOptions,
        platformUrl: "not-a-valid-url",
      };

      expect(() => new AuthVisageClient(invalidClientOptions)).toThrow(
        /Invalid client options.*Platform URL must be a valid URL/
      );
    });

    it("should require all mandatory configuration fields", () => {
      const incompleteOptions = {
        projectId: "test-project",
        // Missing platformUrl, backendUrl, redirectUrl
      };

      expect(
        () =>
          new AuthVisageClient(incompleteOptions as typeof validClientOptions)
      ).toThrow(/Invalid client options/);
    });

    it("should handle server-side rendering gracefully", () => {
      (isBrowser as jest.Mock).mockReturnValue(false);

      const client = new AuthVisageClient(validClientOptions);

      expect(client).toBeInstanceOf(AuthVisageClient);
      expect(client.auth).toBeDefined();
      // In SSR, no browser-specific initialization should occur
    });
  });

  describe("Face Login Flow", () => {
    it("should initiate face login with proper auth URL construction", async () => {
      const client = new AuthVisageClient(validClientOptions);

      await client.faceLogin();

      // Verify session creation was requested
      expect(fetch).toHaveBeenCalledWith(
        `${validClientOptions.backendUrl}/oauth/create-session`
      );

      // Verify OAuth handlers were called
      expect(OAuthStateHandler.generate).toHaveBeenCalled();
      expect(PKCEHandler.generate).toHaveBeenCalled();

      // Verify redirect occurred with proper URL structure
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(
            `^${validClientOptions.platformUrl.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            )}/authorize\\?` +
              ".*state=state_abc123.*" +
              `.*projectId=${validClientOptions.projectId}.*` +
              ".*code_challenge=challenge_def456.*" +
              ".*code_challenge_method=S256.*" +
              ".*session_id=session-123.*"
          )
        )
      );
    });

    it("should handle session creation failure gracefully", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Session service unavailable"));

      const client = new AuthVisageClient(validClientOptions);

      await expect(client.faceLogin()).rejects.toThrow(
        "Face login failed: Session service unavailable"
      );
    });

    it("should handle malformed session response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      });

      const client = new AuthVisageClient(validClientOptions);

      await expect(client.faceLogin()).rejects.toThrow("Face login failed");
    });

    it("should handle PKCE generation failure", async () => {
      (PKCEHandler.generate as jest.Mock).mockRejectedValueOnce(
        new Error("Crypto not available")
      );

      const client = new AuthVisageClient(validClientOptions);

      await expect(client.faceLogin()).rejects.toThrow(
        "Face login failed: Crypto not available"
      );
    });
  });

  describe("OAuth Callback Handling", () => {
    let authStateCallback: jest.Mock;

    beforeEach(() => {
      authStateCallback = jest.fn();
    });

    it("should process OAuth callback automatically on page load", async () => {
      // Simulate OAuth redirect with code and state
      window.location.search = "?code=auth_code_123&state=state_abc123";

      // Mock localStorage state
      (window.localStorage.getItem as jest.Mock)
        .mockReturnValueOnce("state_abc123") // authVisage:state
        .mockReturnValueOnce("verifier_xyz789"); // authVisage:pkce_verifier      // Mock successful token exchange
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: createTestJWT(createTestUserPayload()),
            refresh_token: "new_refresh_token",
            expires_in: 3600,
          }),
      });

      const client = new AuthVisageClient(validClientOptions);
      client.auth.onAuthStateChange(authStateCallback);

      // Wait for async OAuth callback processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify state validation occurred
      expect(OAuthStateHandler.validate).toHaveBeenCalledWith("state_abc123");

      // Verify PKCE verifier retrieval
      expect(PKCEHandler.getCodeVerifier).toHaveBeenCalled();

      // Verify token exchange request
      expect(fetch).toHaveBeenCalledWith(
        `${validClientOptions.backendUrl}/oauth/token`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            code: "auth_code_123",
            code_verifier: "verifier_xyz789",
          }),
        })
      ); // Verify session was set
      expect(client.auth.setSession).toHaveBeenCalledWith(
        expect.objectContaining({
          access_token: expect.any(String), // Valid JWT token
          refresh_token: "new_refresh_token",
          expires_in: 3600,
        })
      );
    });

    it("should ignore callback when URL lacks required parameters", async () => {
      window.location.search = "?code=auth_code_123"; // Missing state

      const client = new AuthVisageClient(validClientOptions);
      client.auth.onAuthStateChange(authStateCallback);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(OAuthStateHandler.validate).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/oauth/token"),
        expect.anything()
      );
      expect(client.auth.setSession).not.toHaveBeenCalled();
    });

    it("should handle state validation failure securely", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      window.location.search = "?code=auth_code_123&state=malicious_state";

      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(
        "legitimate_state"
      ); // Different from URL state

      (OAuthStateHandler.validate as jest.Mock).mockReturnValue(false);

      const client = new AuthVisageClient(validClientOptions);
      client.auth.onAuthStateChange(authStateCallback);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(OAuthStateHandler.validate).toHaveBeenCalledWith(
        "malicious_state"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "State validation failed! Possible CSRF attack."
      );
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/oauth/token"),
        expect.anything()
      );
      expect(client.auth.setSession).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle missing PKCE verifier gracefully", async () => {
      window.location.search = "?code=auth_code_123&state=state_abc123";

      (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(
        "state_abc123"
      );
      (PKCEHandler.getCodeVerifier as jest.Mock).mockResolvedValue(null);

      const client = new AuthVisageClient(validClientOptions);
      client.auth.onAuthStateChange(authStateCallback);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(OAuthStateHandler.validate).toHaveBeenCalledWith("state_abc123");
      expect(PKCEHandler.getCodeVerifier).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/oauth/token"),
        expect.anything()
      );
      expect(client.auth.setSession).not.toHaveBeenCalled();
    });

    it("should handle token exchange failure", async () => {
      window.location.search = "?code=auth_code_123&state=state_abc123";

      (window.localStorage.getItem as jest.Mock)
        .mockReturnValueOnce("state_abc123")
        .mockReturnValueOnce("verifier_xyz789");

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
      });

      const client = new AuthVisageClient(validClientOptions);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetch).toHaveBeenCalledWith(
        `${validClientOptions.backendUrl}/oauth/token`,
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(client.auth.setSession).not.toHaveBeenCalled();
    });

    it("should handle malformed token response", async () => {
      window.location.search = "?code=auth_code_123&state=state_abc123";

      (window.localStorage.getItem as jest.Mock)
        .mockReturnValueOnce("state_abc123")
        .mockReturnValueOnce("verifier_xyz789");

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            // Missing access_token
            refresh_token: "refresh_token",
            expires_in: 3600,
          }),
      });

      const client = new AuthVisageClient(validClientOptions);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.auth.setSession).not.toHaveBeenCalled();
    });
  });

  describe("Authentication State Management", () => {
    it("should provide access to TokenManager instance", () => {
      const client = new AuthVisageClient(validClientOptions);

      expect(client.auth).toBeDefined();
      expect(typeof client.auth.setSession).toBe("function");
      expect(typeof client.auth.onAuthStateChange).toBe("function");
      expect(typeof client.auth.getAccessToken).toBe("function");
      expect(typeof client.auth.logout).toBe("function");
    });

    it("should support auth state change listeners", () => {
      const client = new AuthVisageClient(validClientOptions);
      const callback = jest.fn();

      client.auth.onAuthStateChange(callback);

      expect(client.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should validate configuration thoroughly", () => {
      const testCases = [
        {
          options: { ...validClientOptions, projectId: "" },
          expectedError: /Project ID/i,
        },
        {
          options: { ...validClientOptions, platformUrl: "ftp://invalid.com" },
          expectedError: /Platform URL/i,
        },
        {
          options: { ...validClientOptions, backendUrl: "not-a-url" },
          expectedError: /Backend URL/i,
        },
        {
          options: { ...validClientOptions, redirectUrl: "javascript:void(0)" },
          expectedError: /Redirect URL/i,
        },
      ];

      testCases.forEach(({ options, expectedError }) => {
        expect(() => new AuthVisageClient(options)).toThrow(expectedError);
      });
    });

    it("should handle network failures gracefully", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const client = new AuthVisageClient(validClientOptions);

      await expect(client.faceLogin()).rejects.toThrow(
        "Face login failed: Network error"
      );
    });

    it("should not interfere with non-OAuth URLs", async () => {
      window.location.search = "?unrelated=parameter&other=value";

      new AuthVisageClient(validClientOptions);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(OAuthStateHandler.validate).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/oauth/token"),
        expect.anything()
      );
    });
  });
});

describe("constructor", () => {
  it("should initialize with valid options", () => {
    const client = new AuthVisageClient(validClientOptions);

    expect(client).toBeInstanceOf(AuthVisageClient);
    expect(client.auth).toBeDefined();
  });

  it("should throw an error with invalid options", () => {
    const invalidClientOptions = {
      ...validClientOptions,
      platformUrl: "not-a-url",
    };

    expect(() => new AuthVisageClient(invalidClientOptions)).toThrow(
      "Invalid client options: Platform URL must be a valid URL"
    );
  });
  it("should not call _handleOAuthCallback in non-browser environment", () => {
    // Mock isBrowser to return false
    (isBrowser as jest.Mock).mockReturnValue(false);

    new AuthVisageClient(validClientOptions);
    // We'll spy on setTimeout
    jest.spyOn(global, "setTimeout");

    expect(setTimeout).not.toHaveBeenCalled();
  });
});

describe("faceLogin", () => {
  it("should construct auth URL and redirect", async () => {
    // Mock isBrowser to return true
    (isBrowser as jest.Mock).mockReturnValue(true);

    const client = new AuthVisageClient(validClientOptions);

    await client.faceLogin();

    // Should have called fetch for session ID
    expect(fetch).toHaveBeenCalledWith(
      `${validClientOptions.backendUrl}/oauth/create-session`
    );

    // Should have generated state and PKCE
    expect(OAuthStateHandler.generate).toHaveBeenCalled();
    expect(PKCEHandler.generate).toHaveBeenCalled();

    // Should have redirected
    expect(window.location.assign).toHaveBeenCalledWith(
      expect.stringContaining(`${validClientOptions.platformUrl}/authorize`)
    );
  });

  it("should handle errors during URL construction", async () => {
    // Mock fetch to fail
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    const client = new AuthVisageClient(validClientOptions);

    await expect(client.faceLogin()).rejects.toThrow(
      "Face login failed: Network error"
    );
  });
});

describe("AuthVisageClient - OAuth Callback Processing on Initialization", () => {
  let originalWindowLocation: Location;

  beforeEach(() => {
    // Save the original window.location
    originalWindowLocation = window.location;

    // Mock window.location for each test in this block
    // @ts-expect-error - deliberate mock for testing
    delete window.location;
    Object.defineProperty(window, "location", {
      value: {
        ...originalWindowLocation, // Spread original properties
        assign: jest.fn(),
        search: "", // Default to no search params
        href: "https://app.example.com/callback",
        origin: "https://app.example.com",
        pathname: "/callback",
      },
      writable: true,
    });

    // Reset mocks for handlers to ensure clean state for each test
    (OAuthStateHandler.validate as jest.Mock).mockReset();
    (PKCEHandler.getCodeVerifier as jest.Mock).mockReset();
    // Reset fetch mock if it's too general, or set specific mocks per test
    // For these tests, we often need a specific mock for token exchange
  });

  afterEach(() => {
    // Restore the original window.location
    Object.defineProperty(window, "location", {
      value: originalWindowLocation,
      writable: true,
    });
  });

  it("should automatically process OAuth callback, exchange token, and notify auth state change if URL has code and state", async () => {
    const testCode = "test-auth-code-on-init";
    const testState = "test-state-on-init";
    window.location.search = `?code=${testCode}&state=${testState}`;

    window.localStorage.setItem("authVisage:state", testState);
    window.localStorage.setItem(
      "authVisage:pkce_verifier",
      "test-pkce-verifier-on-init"
    );
    (PKCEHandler.getCodeVerifier as jest.Mock).mockResolvedValue(
      "test-pkce-verifier-on-init"
    );
    (OAuthStateHandler.validate as jest.Mock).mockReturnValue(true);
    const mockSessionData = {
      access_token: createTestJWT(createTestUserPayload()),
      refresh_token: "init-refresh-token",
      expires_in: 3600,
    };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSessionData),
    });
    const client = new AuthVisageClient(validClientOptions);
    const authStateCallback = jest.fn();
    client.auth.onAuthStateChange(authStateCallback);

    // Wait for the async OAuth callback processing (setTimeout in constructor)
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify state validation occurred
    expect(OAuthStateHandler.validate).toHaveBeenCalledWith(testState);

    // Verify PKCE verifier retrieval
    expect(PKCEHandler.getCodeVerifier).toHaveBeenCalled();

    // Verify token exchange request
    expect(fetch).toHaveBeenCalledWith(
      `${validClientOptions.backendUrl}/oauth/token`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          code: testCode,
          code_verifier: "test-pkce-verifier-on-init",
        }),
      })
    );

    // Verify session was set with the mock data
    expect(client.auth.setSession).toHaveBeenCalledWith(mockSessionData);
  });
  it("should do nothing if code or state is missing from URL params on initialization", async () => {
    window.location.search = "?code=only-code-no-state-on-init"; // Missing state
    const client = new AuthVisageClient(validClientOptions);

    // Wait for the async OAuth callback processing (setTimeout in constructor)
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(OAuthStateHandler.validate).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/oauth/token"),
      expect.anything()
    );
    expect(client.auth.setSession).not.toHaveBeenCalled();
  });
  it("should log an error and not proceed if state validation fails on initialization", async () => {
    const testCode = "test-auth-code-fail-state";
    const urlState = "url-state-fail";
    window.location.search = `?code=${testCode}&state=${urlState}`;
    window.localStorage.setItem(
      "authVisage:state",
      "local-storage-state-different"
    );
    (OAuthStateHandler.validate as jest.Mock).mockReturnValue(false);
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // mock isBrowser to return true
    (isBrowser as jest.Mock).mockReturnValue(true);

    const client = new AuthVisageClient(validClientOptions);

    // Wait for the async OAuth callback processing (setTimeout in constructor)
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(OAuthStateHandler.validate).toHaveBeenCalledWith(urlState);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "State validation failed! Possible CSRF attack."
    );
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("/oauth/token"),
      expect.anything()
    );
    expect(client.auth.setSession).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
