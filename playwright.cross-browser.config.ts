import { defineConfig, devices } from '@playwright/test';

/**
 * Cross-Browser Testing Configuration
 * Part of System Optimization Enhancement - Task 4
 */
export default defineConfig({
  testDir: './test/cross-browser',
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 3 : undefined,
  
  // Reporting
  reporter: [
    ['html', { outputFolder: 'test-results/cross-browser-report' }],
    ['json', { outputFile: 'test-results/cross-browser-results.json' }],
    ['junit', { outputFile: 'test-results/cross-browser-junit.xml' }],
  ],
  
  // Global test settings
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Stable selector configuration
    testIdAttribute: 'data-testid',
    
    // Cross-browser compatibility settings
    actionTimeout: 15000,
    navigationTimeout: 45000,
    
    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: true,
  },
  
  // Comprehensive browser matrix
  projects: [
    // Desktop browsers - Latest versions
    {
      name: 'chrome-latest',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'firefox-latest',
      use: { 
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'safari-latest',
      use: { 
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'edge-latest',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
    
    // Mobile browsers
    {
      name: 'mobile-chrome-android',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari-ios',
      use: { 
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'mobile-samsung',
      use: { 
        ...devices['Galaxy S9+'],
      },
    },
    
    // Tablet devices
    {
      name: 'tablet-ipad',
      use: { 
        ...devices['iPad Pro'],
      },
    },
    {
      name: 'tablet-android',
      use: { 
        ...devices['Galaxy Tab S4'],
      },
    },
    
    // Different screen resolutions
    {
      name: 'desktop-1920x1080',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'desktop-1366x768',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: 'desktop-4k',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 },
        deviceScaleFactor: 2,
      },
    },
    
    // Accessibility testing
    {
      name: 'accessibility-high-contrast',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      },
    },
    
    // Performance testing on slower devices
    {
      name: 'slow-network',
      use: { 
        ...devices['Desktop Chrome'],
        // Simulate slow 3G
        launchOptions: {
          args: ['--enable-features=NetworkService', '--force-effective-connection-type=slow-2g']
        }
      },
    }
  ],
  
  // Development server
  webServer: {
    command: process.env.CI ? 'npm run preview -- --port 5173' : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  
  // Test timeout
  timeout: 45 * 1000, // Longer timeout for cross-browser compatibility
  expect: {
    timeout: 10 * 1000,
  },
  
  // Output directory
  outputDir: 'test-results/cross-browser-artifacts',
});