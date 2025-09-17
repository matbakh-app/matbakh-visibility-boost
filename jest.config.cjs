module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Setup files
  setupFiles: ['<rootDir>/src/shared/polyfills/importmeta.js'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/test/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/infra/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/infra/**/*.(test|spec).(ts|tsx|js)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    'infra/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!infra/**/*.d.ts',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/test/smoke/',
    '/test/unit/sync-gmb.test.ts',
    '/test/unit/sync-ga4.test.ts',
  ],

  // Module path ignore patterns
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],

  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: [
    '/node_modules/(?!(@aws-sdk|@testing-library|lucide-react|cheerio|jose|@sparticuz/chromium)/)',
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Global setup
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};