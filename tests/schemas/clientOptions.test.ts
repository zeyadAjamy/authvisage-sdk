import { clientOptionsSchema } from "@/schemas/clientOptions";

describe("clientOptionsSchema", () => {
  const validOptions = {
    projectId: "5e27e696-7ed2-4ebb-980f-a0b57ae3f134",
    platformUrl: "https://platform.example.com",
    backendUrl: "https://api.example.com",
    redirectUrl: "https://app.example.com/callback",
  };

  it("should validate valid client options", () => {
    const result = clientOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });

  describe("projectId validation", () => {
    it("should require projectId", () => {
      const { projectId: _, ...noProjectId } = validOptions;
      const result = clientOptionsSchema.safeParse(noProjectId);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Project ID is required");
    });

    it("should reject non-string projectId", () => {
      const invalidOptions = { ...validOptions, projectId: 123 };
      const result = clientOptionsSchema.safeParse(invalidOptions);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Project ID must be a string"
      );
    });
  });

  describe("platformUrl validation", () => {
    it("should require platformUrl", () => {
      const { platformUrl: _, ...noPlatformUrl } = validOptions;
      const result = clientOptionsSchema.safeParse(noPlatformUrl);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Platform URL is required");
    });

    it("should reject invalid URLs", () => {
      const invalidOptions = { ...validOptions, platformUrl: "not-a-url" };
      const result = clientOptionsSchema.safeParse(invalidOptions);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Platform URL must be a valid URL"
      );
    });
  });

  describe("backendUrl validation", () => {
    it("should require backendUrl", () => {
      const { backendUrl: _, ...noBackendUrl } = validOptions;
      const result = clientOptionsSchema.safeParse(noBackendUrl);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Backend URL is required");
    });

    it("should reject invalid URLs", () => {
      const invalidOptions = { ...validOptions, backendUrl: "not-a-url" };
      const result = clientOptionsSchema.safeParse(invalidOptions);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Backend URL must be a valid URL"
      );
    });
  });

  describe("redirectUrl validation", () => {
    it("should require redirectUrl", () => {
      const { redirectUrl: _, ...noRedirectUrl } = validOptions;
      const result = clientOptionsSchema.safeParse(noRedirectUrl);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Redirect URL is required");
    });

    it("should reject invalid URLs", () => {
      const invalidOptions = { ...validOptions, redirectUrl: "not-a-url" };
      const result = clientOptionsSchema.safeParse(invalidOptions);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Redirect URL must be a valid URL"
      );
    });
  });

  it("should reject unknown properties", () => {
    const extraOptions = {
      ...validOptions,
      extraProp: "something-extra",
    };
    const result = clientOptionsSchema.safeParse(extraOptions);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "Invalid client options structure"
    );
  });
});
