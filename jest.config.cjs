/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Jest Watch Mode Stability Fixes
  watchman: false,
  maxWorkers: process.env.CI ? 2 : 1, // More workers in CI for performance
  forceExit: true,
  detectOpenHandles: true,

  // Enhanced Memory Management
  workerIdleMemoryLimit: '512MB',
  maxConcurrency: process.env.CI ? 10 : 5, // Higher concurrency in CI

  // Enhanced Timeout Settings
  testTimeout: process.env.CI ? 60000 : 30000, // Longer timeout in CI

  // Test Isolation Settings
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,

  // Error Handling & CI Optimization
  errorOnDeprecated: false, // Don't fail on deprecated APIs during migration
  bail: process.env.CI ? 1 : 0, // Fail fast in CI, continue locally

  // Performance optimizations for CI
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Watch Mode Specific
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/.next/',
  ],

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.cjs'],



  // Test path ignore patterns (clean separation)
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/archive/',     // archiviertes Zeug
    '<rootDir>/archive/',         // alle Archive-Verzeichnisse
    '<rootDir>/test/unit/',       // Deno-Tests -> separat laufen lassen
    '<rootDir>/test/smoke/',      // Playwright-Tests -> separat laufen lassen
    '<rootDir>/test/e2e/',        // E2E Playwright-Tests -> separat laufen lassen
    '<rootDir>/test/visual/',     // Visual Playwright-Tests -> separat laufen lassen
    '<rootDir>/test/cross-browser/', // Cross-browser Playwright-Tests -> separat laufen lassen
    '<rootDir>/test/accessibility/', // Playwright accessibility tests
    '<rootDir>/infra/',           // Lambda-Tests -> separat laufen lassen
    '<rootDir>/src/.*/__mocks__/.*', // Ignore mock files without tests
    '.*\\.test\\.(ts|tsx)\\.empty$', // Ignore empty test files
  ],

  // Coverage configuration - Enhanced for Task 8
  collectCoverage: false, // Enable via --coverage flag
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/archive/**',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/test-utils/**',
    '!src/setupTests.cjs',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.config.{ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    },
    // Only apply strict thresholds to files with existing tests
    'src/lib/performance-monitoring.ts': {
      branches: 35,
      functions: 60,
      lines: 50,
      statements: 50
    }
  },

  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: [
    '/node_modules/(?!(@aws-sdk|@testing-library|lucide-react|cheerio|jose|@sparticuz/chromium)/)',
  ],

  // Module name mapping for ESM modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^aws-sdk-client-mock$': '<rootDir>/src/__mocks__/aws-sdk-client-mock.js',
  },

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Reporters - Enhanced for CI integration
  reporters: process.env.CI ? [
    'default',
    '<rootDir>/scripts/jest/fail-on-pending-reporter.cjs',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ] : [
    'default',
    '<rootDir>/scripts/jest/fail-on-pending-reporter.cjs'
  ],
};