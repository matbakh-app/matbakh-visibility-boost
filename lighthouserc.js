/**
 * Lighthouse CI Configuration
 * Part of System Optimization Enhancement - Task 4
 * Performance Testing Pipeline
 */

module.exports = {
  ci: {
    // Collection settings
    collect: {
      // URLs to test
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/vc/quick',
        'http://localhost:5173/dashboard',
        'http://localhost:5173/admin',
        'http://localhost:5173/onboarding',
      ],
      
      // Collection options
      numberOfRuns: 3,
      settings: {
        // Performance-focused audits
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        
        // Chrome flags for consistent testing
        chromeFlags: [
          '--headless',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        
        // Throttling settings
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        
        // Screen emulation
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        
        // Form factor
        formFactor: 'desktop',
        
        // Skip certain audits that might be flaky in CI
        skipAudits: [
          'uses-http2',
          'canonical',
        ],
      },
    },
    
    // Upload settings (for CI/CD integration)
    upload: {
      target: 'filesystem',
      outputDir: './test-results/lighthouse',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
    
    // Assertion settings
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Performance metrics
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        
        // Resource optimization
        'unused-css-rules': ['warn', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'modern-image-formats': ['warn', { maxLength: 0 }],
        
        // Accessibility
        'color-contrast': ['error', { minScore: 1 }],
        'heading-order': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        
        // Best practices
        'uses-https': ['error', { minScore: 1 }],
        'no-vulnerable-libraries': ['error', { minScore: 1 }],
      },
    },
    
    // Server settings for local testing
    server: {
      command: 'npm run dev',
      port: 5173,
      timeout: 60000,
    },
  },
};