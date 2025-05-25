export const decodeJwt = <T = unknown>(token: string): T => {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token: token must be a non-empty string");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token: JWT must have 3 parts separated by dots");
  }

  const payload = parts[1];
  if (!payload) {
    throw new Error("Invalid token: missing payload section");
  }

  try {
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    throw new Error("Invalid token: failed to decode payload");
  }
};
