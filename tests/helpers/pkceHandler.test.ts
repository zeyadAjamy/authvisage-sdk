import { PKCEHandler } from "@/helpers/pkceHandler";

describe("PKCEHandler", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();

    // Reset any mock function calls
    jest.clearAllMocks();
  });

  describe("generate", () => {
    it("should generate a PKCE pair in browser environment", async () => {
      const pkcePair = await PKCEHandler.generate();

      // Should match our test values from the mock
      expect(pkcePair.codeVerifier).toBe("test-uuid-12345");
      expect(pkcePair.codeChallenge).toBe("test-base64-string");

      // Should store code verifier in localStorage
      expect(window.localStorage.getItem("authVisage:pkce_verifier")).toBe(
        "test-uuid-12345"
      );
    });

    // it("should return empty strings in non-browser environment", async () => {
    //   // Mock window as undefined
    //   const originalWindow = global.window;
    //   global.window = undefined as unknown as Window & typeof globalThis;

    //   const pkcePair = await PKCEHandler.generate();
    //   expect(pkcePair.codeVerifier).toBe("");
    //   expect(pkcePair.codeChallenge).toBe("");

    //   // Restore window
    //   global.window = originalWindow;
    // });
  });

  describe("getCodeVerifier", () => {
    it("should retrieve stored code verifier", async () => {
      // Set up code verifier in localStorage
      window.localStorage.setItem("authVisage:pkce_verifier", "test-verifier");

      const codeVerifier = await PKCEHandler.getCodeVerifier();
      expect(codeVerifier).toBe("test-verifier");
    });

    it("should throw error when code verifier is not found", async () => {
      await expect(PKCEHandler.getCodeVerifier()).rejects.toThrow(
        "Code verifier not found in local storage."
      );
    });

    // it("should return null in non-browser environment", async () => {
    //   // Mock window as undefined
    //   const originalWindow = global.window;
    //   global.window = undefined as unknown as Window & typeof globalThis;

    //   const codeVerifier = await PKCEHandler.getCodeVerifier();
    //   expect(codeVerifier).toBeNull();

    //   // Restore window
    //   global.window = originalWindow;
    // });
  });

  describe("hash and encode", () => {
    it("should hash and encode a string using the public API", async () => {
      // Use predefined expected output
      const expectedOutput = "test-base64-string";

      // Mock the crypto.subtle.digest to return a predefined ArrayBuffer
      jest
        .spyOn(window.crypto.subtle, "digest")
        .mockResolvedValue(new TextEncoder().encode("mocked-digest").buffer);

      // Call the public API that uses the hashing internally
      const pkcePair = await PKCEHandler.generate();

      // Validate the output
      expect(pkcePair.codeChallenge).toBe(expectedOutput);

      // Ensure the hashing function was called with the correct input
      const call = (window.crypto.subtle.digest as jest.Mock).mock.calls[0];
      expect(call[0]).toBe("SHA-256");
      expect(call[1].constructor.name).toBe("Uint8Array");
    });
  });
});
