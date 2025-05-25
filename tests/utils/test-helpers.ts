/**
 * Test helper utilities for generating valid test data
 */

/**
 * Creates a valid JWT token for testing purposes
 * @param payload - The payload to encode in the JWT
 * @returns A valid JWT token string
 */
export function createTestJWT(payload: Record<string, unknown>): string {
  // Create a simple JWT header
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  // Base64 encode header and payload
  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Create a dummy signature (for testing purposes only)
  const signature = "test-signature";

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Creates a test user payload for JWT tokens
 */
export function createTestUserPayload(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    iat: now,
    exp: now + 3600, // Expires in 1 hour
    ...overrides,
  };
}
