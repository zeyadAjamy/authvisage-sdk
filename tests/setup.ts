// Mock browser APIs when running in Node.js test environment
// This helps test our SDK in both SSR and browser environments

// Setup localStorage mock
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value;
    },
    removeItem: function (key: string) {
      delete store[key];
    },
    clear: function () {
      store = {};
    },
    length: 0,
    key: function () {
      return null;
    },
  };
})();

// Setup crypto.randomUUID mock
const cryptoMock = {
  randomUUID: () => "test-uuid-12345",
  subtle: {
    digest: jest.fn().mockImplementation(() => {
      return Promise.resolve(new Uint8Array([1, 2, 3, 4, 5]));
    }),
  },
};

// Set up window location mock
const windowLocationMock = {
  assign: jest.fn(),
  search: "?code=test-code&state=test-state",
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: "test-session-id" }),
  })
) as jest.Mock;

Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window, "crypto", { value: cryptoMock });
Object.defineProperty(window, "location", { value: windowLocationMock });

// Buffer mock is needed because we use Buffer in the browser
global.Buffer = {
  from: jest.fn().mockImplementation(() => ({
    toString: () => "test-base64-string",
  })),
} as unknown as typeof Buffer;

// Polyfill for TextEncoder in Node.js (for Jest)
import { TextEncoder as NodeTextEncoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  // @ts-expect-error: Assigning Node.js TextEncoder to global for Jest polyfill
  global.TextEncoder = NodeTextEncoder;
}
