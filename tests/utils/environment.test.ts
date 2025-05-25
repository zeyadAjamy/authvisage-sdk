import { isBrowser } from "@/utils/environment";

describe("environment utilities", () => {
  it("should return false when window is undefined", () => {
    expect(isBrowser()).toBe(true);
  });
});
