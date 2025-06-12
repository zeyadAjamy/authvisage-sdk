import { OAuthStateHandler } from "@/helpers/oauthStateHandler";

describe("OAuthStateHandler", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  describe("generate", () => {
    it("should generate and store a state value in browser environment", () => {
      // Mock crypto.randomUUID to return a predictable value
      const mockUUID = "19648f13-dc8d-4222-aea3-6a89431aa94b";
      jest.spyOn(window.crypto, "randomUUID").mockReturnValue(mockUUID);

      const state = OAuthStateHandler.generate();
      expect(state).toBe(mockUUID);
      expect(window.localStorage.getItem("authVisage:state")).toBe(mockUUID);
    });

    // it("should return empty string in non-browser environment", () => {
    //   // Mock isBrowser to return false
    //   const originalWindow = global.window;
    //   global.window = undefined as unknown as Window & typeof globalThis;
    //   const state = OAuthStateHandler.generate();
    //   expect(state).toBe("");
    //   global.window = originalWindow;
    // });
  });

  describe("validate", () => {
    it("should validate state when it matches stored state", () => {
      window.localStorage.setItem("authVisage:state", "test-state");
      const isValid = OAuthStateHandler.validate("test-state");
      expect(isValid).toBe(true);
      expect(window.localStorage.getItem("authVisage:state")).toBeNull();
    });

    it("should invalidate state when it does not match stored state", () => {
      window.localStorage.setItem("authVisage:state", "test-state");
      const isValid = OAuthStateHandler.validate("wrong-state");
      expect(isValid).toBe(false);
      expect(window.localStorage.getItem("authVisage:state")).toBeNull();
    });

    // it("should return false in non-browser environment", () => {
    //   const originalWindow = global.window;
    //   global.window = undefined as unknown as Window & typeof globalThis;
    //   const isValid = OAuthStateHandler.validate("test-state");
    //   expect(isValid).toBe(false);
    //   global.window = originalWindow;
    // });
  });
});
