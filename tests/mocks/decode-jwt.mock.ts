/**
 * Mock implementation of JWT decoder
 */
export const decodeJwt = jest.fn((_: string) => {
  return {
    sub: "user-123",
    name: "Test User",
    email: "test@example.com",
  };
});
