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

      // Should has codeVerifier and codeChallenge of type string
      expect(typeof pkcePair.codeVerifier).toBe("string");
      expect(typeof pkcePair.codeChallenge).toBe("string");

      // Should store code verifier in localStorage
      expect(window.localStorage.getItem("authVisage:pkce_verifier")).toBe(
        pkcePair.codeVerifier
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
      // Mock crypto.subtle.digest to return a predictable ArrayBuffer
      const mockDigest = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const digestSpy = jest
        .spyOn(window.crypto.subtle, "digest")
        .mockResolvedValue(mockDigest);

      // Mock crypto.randomUUID to return a predictable value
      const mockUUID = "19648f13-dc8d-4222-aea3-6a89431aa94b";
      jest.spyOn(window.crypto, "randomUUID").mockReturnValue(mockUUID);

      // Call the public API that uses the hashing internally
      const pkcePair = await PKCEHandler.generate();

      // Validate that we get a proper base64url encoded string
      expect(typeof pkcePair.codeChallenge).toBe("string");
      expect(pkcePair.codeChallenge).toBe("AQIDBAU");
      expect(pkcePair.codeVerifier).toBe(mockUUID);
      expect(digestSpy).toHaveBeenCalledWith("SHA-256", expect.any(Object)); // Verify the input to digest was the encoded UUID
      const call = digestSpy.mock.calls[0];
      const inputArray = call[1] as Uint8Array;

      // Verify it's actually a Uint8Array
      expect(inputArray.constructor.name).toBe("Uint8Array");

      // Verify the input matches the expected encoded UUID (compare as arrays to avoid constructor issues)
      const expectedEncodedUUID = new TextEncoder().encode(mockUUID);
      expect(Array.from(inputArray)).toEqual(Array.from(expectedEncodedUUID));
    });
  });
});
