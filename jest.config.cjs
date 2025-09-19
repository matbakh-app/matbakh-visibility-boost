/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // Transform configuration (fixes ts-jest warning)
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Test path ignore patterns (clean separation)
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/archive/',     // archiviertes Zeug
    '<rootDir>/archive/',         // alle Archive-Verzeichnisse
    '<rootDir>/test/unit/',       // Deno-Tests -> separat laufen lassen
    '<rootDir>/test/smoke/',      // Playwright-Tests -> separat laufen lassen
    '<rootDir>/infra/',           // Lambda-Tests -> separat laufen lassen
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/archive/**',
  ],
  
  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: [
    '/node_modules/(?!(@aws-sdk|@testing-library|lucide-react|cheerio|jose|@sparticuz/chromium)/)',
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
};