import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive E2E Testing Configuration
 * Part of System Optimization Enhancement - Task 4
 */
export default defineConfig({
  testDir: './test/e2e',
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  
  // Reporting
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Global test settings
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Stable selector configuration
    testIdAttribute: 'data-testid',
    
    // Performance monitoring
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Browser context settings
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9,de;q=0.8'
    }
  },
  
  // Test projects for different scenarios
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    }
  ],
  
  // Development server
  webServer: {
    command: process.env.CI ? 'npm run preview -- --port 5173' : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  
  // Global setup and teardown
  globalSetup: require.resolve('./test/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./test/e2e/global-teardown.ts'),
  
  // Test timeout
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
  
  // Output directory
  outputDir: 'test-results/e2e-artifacts',
});