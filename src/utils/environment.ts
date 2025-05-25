/**
 * Safely checks if we're in a browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};
