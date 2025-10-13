/**
 * Test Configuration
 * Part of System Optimization Enhancement - Task 4
 */

export interface TestConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  workers: number;
  headless: boolean;
  slowMo: number;
  video: boolean;
  screenshot: boolean;
  trace: boolean;
}

export interface EnvironmentConfig {
  name: string;
  baseURL: string;
  apiURL: string;
  features: {
    auth: boolean;
    payments: boolean;
    analytics: boolean;
  };
}

// Test environments
export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  local: {
    name: 'Local Development',
    baseURL: 'http://localhost:5173',
    apiURL: 'http://localhost:3000/api',
    features: {
      auth: true,
      payments: false,
      analytics: false,
    },
  },
  
  staging: {
    name: 'Staging',
    baseURL: 'https://staging.matbakh.app',
    apiURL: 'https://api-staging.matbakh.app',
    features: {
      auth: true,
      payments: true,
      analytics: true,
    },
  },
  
  production: {
    name: 'Production',
    baseURL: 'https://matbakh.app',
    apiURL: 'https://api.matbakh.app',
    features: {
      auth: true,
      payments: true,
      analytics: true,
    },
  },
};

// Test configurations for different scenarios
export const TEST_CONFIGS: Record<string, TestConfig> = {
  development: {
    baseURL: ENVIRONMENTS.local.baseURL,
    timeout: 30000,
    retries: 0,
    workers: 1,
    headless: false,
    slowMo: 100,
    video: false,
    screenshot: true,
    trace: true,
  },
  
  ci: {
    baseURL: ENVIRONMENTS.local.baseURL,
    timeout: 30000,
    retries: 2,
    workers: 2,
    headless: true,
    slowMo: 0,
    video: true,
    screenshot: true,
    trace: true,
  },
  
  staging: {
    baseURL: ENVIRONMENTS.staging.baseURL,
    timeout: 45000,
    retries: 1,
    workers: 3,
    headless: true,
    slowMo: 0,
    video: true,
    screenshot: true,
    trace: true,
  },
  
  production: {
    baseURL: ENVIRONMENTS.production.baseURL,
    timeout: 60000,
    retries: 3,
    workers: 1,
    headless: true,
    slowMo: 0,
    video: true,
    screenshot: true,
    trace: true,
  },
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals (in milliseconds)
  LCP: 2500,        // Largest Contentful Paint
  FID: 100,         // First Input Delay
  CLS: 0.1,         // Cumulative Layout Shift
  
  // Other metrics
  TTFB: 600,        // Time to First Byte
  FCP: 1800,        // First Contentful Paint
  SI: 3400,         // Speed Index
  TTI: 3800,        // Time to Interactive
  
  // Page load times
  pageLoad: 3000,
  domContentLoaded: 2000,
  
  // Bundle sizes (in KB)
  jsBundle: 500,
  cssBundle: 100,
  totalBundle: 2000,
};

// Accessibility standards
export const ACCESSIBILITY_STANDARDS = {
  level: 'AA',      // WCAG 2.1 AA
  colorContrast: 4.5,
  largeTextContrast: 3.0,
  focusIndicator: true,
  keyboardNavigation: true,
  screenReaderSupport: true,
};

// Browser support matrix
export const BROWSER_SUPPORT = {
  chrome: {
    min: 90,
    current: true,
  },
  firefox: {
    min: 88,
    current: true,
  },
  safari: {
    min: 14,
    current: true,
  },
  edge: {
    min: 90,
    current: true,
  },
};

// Mobile device testing
export const MOBILE_DEVICES = [
  'iPhone 12',
  'iPhone 12 Pro',
  'iPhone SE',
  'Pixel 5',
  'Galaxy S9+',
  'iPad Pro',
  'Galaxy Tab S4',
];

// Test data
export const TEST_DATA = {
  users: {
    valid: {
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User',
    },
    invalid: {
      email: 'invalid-email',
      password: '123',
      name: '',
    },
  },
  
  business: {
    valid: {
      name: 'Test Restaurant Berlin',
      email: 'restaurant@example.com',
      phone: '+49 30 12345678',
      address: 'Musterstraße 1, 10115 Berlin',
      website: 'https://test-restaurant.com',
    },
    invalid: {
      name: '',
      email: 'invalid-email',
      phone: 'invalid-phone',
      address: '',
      website: 'not-a-url',
    },
  },
};

// Get current test configuration
export function getTestConfig(): TestConfig {
  const env = process.env.TEST_ENV || 'development';
  return TEST_CONFIGS[env] || TEST_CONFIGS.development;
}

// Get current environment configuration
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.TEST_ENV || 'local';
  return ENVIRONMENTS[env] || ENVIRONMENTS.local;
}

// Check if feature is enabled in current environment
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  const config = getEnvironmentConfig();
  return config.features[feature];
}