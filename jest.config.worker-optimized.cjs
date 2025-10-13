/**
 * Worker-Optimized Jest Configuration
 * Resolves worker crashes and resource issues
 */
module.exports = {
  // Extend base configuration
  ...require('./jest.config.cjs'),
  
  // Enhanced worker configuration
  maxWorkers: process.env.CI ? "25%" : "50%",
  testTimeout: 30000, // Increased for IO-heavy tests
  workerIdleMemoryLimit: "512MB",
  
  // Memory management
  logHeapUsage: true,
  detectLeaks: false, // Disable in CI to prevent false positives
  
  // Resource limits per worker
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.cjs',
    '<rootDir>/test/setup-worker-limits.js'
  ],
  
  // Run heavy tests in band to prevent worker crashes
  runner: process.env.HEAVY_TESTS ? 'jest-serial-runner' : undefined,
  
  // Enhanced error handling
  errorOnDeprecated: false,
  verbose: process.env.CI ? false : true,
  
  // Optimized for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
      maxWorkers: '50%'
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/src/**/__tests__/**/*.integration.test.{ts,tsx}'],
      maxWorkers: '25%', // Reduced for integration tests
      testTimeout: 45000
    },
    {
      displayName: 'heavy',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.heavy.test.{ts,tsx}'],
      maxWorkers: 1, // Serial execution for heavy tests
      testTimeout: 60000
    }
  ]
};
