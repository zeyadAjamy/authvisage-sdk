import type { Config } from "jest";

const config: Config = {
  // Use SWC for ultra-fast transforms with TypeScript support
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
          target: "es2018",
          loose: false,
        },
        module: {
          type: "commonjs",
        },
        sourceMaps: true,
      },
    ],
  },

  // Transform ignore patterns
  transformIgnorePatterns: ["node_modules/(?!(@swc/helpers)/)"],

  // Automatically clear mock calls between tests
  clearMocks: true,

  // Use jsdom for browser environment simulation
  testEnvironment: "jsdom",

  // The directory where Jest should output coverage files
  coverageDirectory: "coverage",

  // Collect coverage from these directories
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/index.ts",
  ],

  // The paths to modules that run some code to configure the testing environment
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // An array of regexp pattern strings that match test files
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],

  // Path mapping for TypeScript
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Cache settings for faster runs
  cache: true,
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",

  // Use maxWorkers to optimize performance
  maxWorkers: "50%",

  // Fast bail option to abort test run if a test fails
  bail: 1,

  // Don't watch for file changes in these paths
  watchPathIgnorePatterns: ["node_modules", "coverage", "dist"],

  // Set testTimeout to something reasonable
  testTimeout: 10000,

  // Coverage configuration
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage reporters - include json-summary for GitHub integration
  coverageReporters: ["text", "lcov", "html", "json-summary"],

  // Additional patterns to ignore for coverage
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/",
    "/dist/",
    "/coverage/",
  ],

  // Enable experimental features for better performance
  workerIdleMemoryLimit: "512MB",

  // Optimize module resolution
  haste: {
    enableSymlinks: false,
  },

  // Faster module resolution
  resolver: undefined,

  // Reset modules between tests for isolation
  resetModules: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Module file extensions Jest will look for
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Ignore patterns for test files
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/coverage/",
  ],

  // Global variables available in tests
  globals: {
    "ts-jest": {
      useESM: false,
    },
  },

  // Detect open handles for better cleanup
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,
  // Collect coverage only when explicitly requested
  collectCoverage: false,
};

export default config;
