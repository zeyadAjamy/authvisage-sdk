import { OAuthStateHandler } from "@/helpers/oauthStateHandler";

describe("OAuthStateHandler", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  describe("generate", () => {
    it("should generate and store a state value in browser environment", () => {
      const state = OAuthStateHandler.generate();

      // Should return the mock UUID from our setup
      expect(state).toBe("test-uuid-12345");

      // Check if it was stored in localStorage
      expect(window.localStorage.getItem("authVisage:state")).toBe(
        "test-uuid-12345"
      );
    });
    // it("should return empty string in non-browser environment", () => {
    //   const state = OAuthStateHandler.generate();
    //   expect(state).toBe("");
    // });
  });

  describe("validate", () => {
    it("should validate state when it matches stored state", () => {
      // Set up state in localStorage
      window.localStorage.setItem("authVisage:state", "test-state");

      const isValid = OAuthStateHandler.validate("test-state");
      expect(isValid).toBe(true);

      // State should be removed after validation
      expect(window.localStorage.getItem("authVisage:state")).toBeNull();
    });

    it("should invalidate state when it does not match stored state", () => {
      // Set up state in localStorage
      window.localStorage.setItem("authVisage:state", "test-state");

      const isValid = OAuthStateHandler.validate("wrong-state");
      expect(isValid).toBe(false);

      // State should still be removed after validation
      expect(window.localStorage.getItem("authVisage:state")).toBeNull();
    });

    it("should return false in non-browser environment", () => {
      // Mock window as undefined
      const originalWindow = global.window;
      global.window = undefined as unknown as Window & typeof globalThis;

      const isValid = OAuthStateHandler.validate("test-state");
      expect(isValid).toBe(false);

      // Restore window
      global.window = originalWindow;
    });
  });
});
