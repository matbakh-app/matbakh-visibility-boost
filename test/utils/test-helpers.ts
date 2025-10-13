/**
 * Test Utilities and Helpers
 * Part of System Optimization Enhancement - Task 4
 */

import { Page, expect } from '@playwright/test';
import { TEST_DATA } from '../config/test-config';

/**
 * Wait for the app to be fully loaded and interactive
 */
export async function waitForAppReady(page: Page) {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for React to be ready (if React is detected)
  await page.waitForFunction(() => {
    return window.document.readyState === 'complete';
  });
  
  // Wait for any loading spinners to disappear
  const loadingSelectors = [
    '[data-testid*="loading"]',
    '.loading',
    '.spinner',
    '[aria-label*="loading"]'
  ];
  
  for (const selector of loadingSelectors) {
    const loader = page.locator(selector);
    if (await loader.isVisible()) {
      await loader.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }
}

/**
 * Fill form with test data
 */
export async function fillVCForm(page: Page, data: {
  email?: string;
  businessName?: string;
  location?: string;
}) {
  const { email = 'test@example.com', businessName = 'Test Restaurant', location = 'Berlin' } = data;
  
  // Fill email
  const emailInput = page.locator('input[type="email"], input[name*="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill(email);
  }
  
  // Fill business name
  const businessInput = page.locator('input[name*="business"], input[name*="restaurant"], input[name*="name"]');
  if (await businessInput.isVisible()) {
    await businessInput.fill(businessName);
  }
  
  // Fill location
  const locationInput = page.locator('input[name*="location"], input[name*="city"], input[name*="address"]');
  if (await locationInput.isVisible()) {
    await locationInput.fill(location);
  }
}

/**
 * Check for accessibility violations
 */
export async function checkAccessibility(page: Page) {
  // Basic accessibility checks
  const checks = {
    hasHeadings: await page.locator('h1, h2, h3, h4, h5, h6').count() > 0,
    hasAltTexts: await page.locator('img:not([alt])').count() === 0,
    hasLabels: await page.locator('input:not([aria-label]):not([aria-labelledby])').count() === 0,
    hasSkipLinks: await page.locator('a[href="#main"], a[href="#content"]').count() > 0,
  };
  
  return checks;
}

/**
 * Measure page performance metrics
 */
export async function measurePerformance(page: Page) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
    };
  });
  
  return metrics;
}

/**
 * Check for console errors
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}

/**
 * Simulate slow network conditions
 */
export async function simulateSlowNetwork(page: Page, delay: number = 100) {
  await page.route('**/*', async (route) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.continue();
  });
}

/**
 * Take screenshot with consistent settings
 */
export async function takeConsistentScreenshot(page: Page, name: string, options: any = {}) {
  // Hide dynamic elements
  await page.addStyleTag({
    content: `
      [data-testid*="timestamp"],
      [data-testid*="time"],
      .timestamp,
      .time,
      [data-dynamic="true"] {
        visibility: hidden !important;
      }
    `
  });
  
  return await page.screenshot({
    animations: 'disabled',
    ...options,
    path: `test-results/screenshots/${name}`
  });
}

/**
 * Wait for API calls to complete
 */
export async function waitForApiCalls(page: Page, timeout: number = 5000) {
  // Wait for any pending fetch requests
  await page.waitForFunction(() => {
    // Check if there are any pending fetch requests
    return !window.fetch || (window as any).__pendingRequests === 0;
  }, { timeout });
}

/**
 * Mock API responses for testing
 */
export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);
}

/**
 * Test responsive breakpoints
 */
export const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 }
};

