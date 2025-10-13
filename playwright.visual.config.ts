import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression Testing Configuration
 * Part of System Optimization Enhancement - Task 4
 */
export default defineConfig({
  testDir: './test/visual',
  
  // Test execution settings
  fullyParallel: false, // Visual tests should run sequentially for consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker for consistent visual results
  
  // Reporting
  reporter: [
    ['html', { outputFolder: 'test-results/visual-report' }],
    ['json', { outputFile: 'test-results/visual-results.json' }],
  ],
  
  // Global test settings
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    
    // Stable selector configuration
    testIdAttribute: 'data-testid',
    
    // Consistent visual testing settings
    viewport: { width: 1280, height: 720 },
    
    // Disable animations for consistent screenshots
    reducedMotion: 'reduce',
    
    // Font rendering consistency
    fontFamily: 'Arial, sans-serif',
    
    // Disable video for visual tests (not needed)
    video: 'off',
  },
  
  // Visual testing projects
  projects: [
    {
      name: 'visual-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // Consistent browser settings for visual testing
        deviceScaleFactor: 1,
        hasTouch: false,
      },
    },
    {
      name: 'visual-mobile',
      use: { 
        ...devices['iPhone 12'],
        // Consistent mobile settings
        deviceScaleFactor: 2,
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
  
  // Visual testing specific settings
  expect: {
    // Visual comparison threshold
    threshold: 0.2,
    // Animation handling
    animations: 'disabled',
  },
  
  // Test timeout
  timeout: 60 * 1000, // Longer timeout for visual tests
  
  // Output directory
  outputDir: 'test-results/visual-artifacts',
});