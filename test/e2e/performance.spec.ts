/**
 * Performance E2E Tests
 * Part of System Optimization Enhancement - Task 4
 */

import { test, expect } from '@playwright/test';
import { simulateSlowNetwork } from '../utils/test-helpers';

test.describe('Performance Tests', () => {
  test('should load homepage within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`Homepage load time: ${loadTime}ms`);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    const webVitals = await page.evaluate(() => new Promise(resolve => {
      const vitals: any = {};
      
      // LCP
      const lcpObs = new PerformanceObserver((list) => {
        const e = list.getEntries();
        if (e.length) vitals.lcp = e[e.length - 1].startTime;
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // CLS
      let clsValue = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
        vitals.cls = clsValue;
      });
      clsObs.observe({ type: 'layout-shift', buffered: true });
      
      setTimeout(() => resolve(vitals), 2000);
    }));
    
    console.log('Core Web Vitals:', webVitals);
    
    if ((webVitals as any).lcp) expect((webVitals as any).lcp).toBeLessThan(2500);
    if ((webVitals as any).cls !== undefined) expect((webVitals as any).cls).toBeLessThan(0.1);
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G using helper function
    await simulateSlowNetwork(page, 100);
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should still be usable on slow networks (under 10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Slow network load time: ${loadTime}ms`);
  });

  test('should optimize image loading', async ({ page }) => {
    await page.goto('/');
    
    // Check for lazy loading attributes
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check if images have loading="lazy" or similar optimization
      const lazyImages = page.locator('img[loading="lazy"]');
      const lazyImageCount = await lazyImages.count();
      
      console.log(`Total images: ${imageCount}, Lazy loaded: ${lazyImageCount}`);
      
      // At least some images should be lazy loaded (if there are many)
      if (imageCount > 3) {
        expect(lazyImageCount).toBeGreaterThan(0);
      }
    }
  });

  test('should have efficient bundle size', async ({ page }) => {
    // Monitor network requests
    const requests: any[] = [];
    
    page.on('request', (request) => {
      if (request.resourceType() === 'script' || request.resourceType() === 'stylesheet') {
        requests.push({
          url: request.url(),
          type: request.resourceType()
        });
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log(`Total JS/CSS requests: ${requests.length}`);
    
    // Should not have too many separate bundle files
    const jsRequests = requests.filter(r => r.type === 'script');
    const cssRequests = requests.filter(r => r.type === 'stylesheet');
    
    console.log(`JS files: ${jsRequests.length}, CSS files: ${cssRequests.length}`);
    
    // Reasonable limits for bundle splitting
    expect(jsRequests.length).toBeLessThan(20);
    expect(cssRequests.length).toBeLessThan(10);
  });
});