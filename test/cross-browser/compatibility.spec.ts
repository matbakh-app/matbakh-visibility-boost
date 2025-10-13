/**
 * Cross-Browser Compatibility Tests
 * Part of System Optimization Enhancement - Task 4
 */

import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('should render correctly across all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Basic functionality should work in all browsers
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/matbakh/i);
    
    console.log(`Testing on ${browserName}`);
  });

  test('should handle CSS Grid and Flexbox', async ({ page }) => {
    await page.goto('/');
    
    // Check for modern CSS support
    const hasGrid = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.display = 'grid';
      return testEl.style.display === 'grid';
    });
    
    const hasFlex = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.display = 'flex';
      return testEl.style.display === 'flex';
    });
    
    expect(hasGrid).toBeTruthy();
    expect(hasFlex).toBeTruthy();
    
    console.log(`CSS Grid support: ${hasGrid}, Flexbox support: ${hasFlex}`);
  });

  test('should support modern JavaScript features', async ({ page }) => {
    await page.goto('/');
    
    // Test for ES6+ support
    const modernJSSupport = await page.evaluate(() => {
      try {
        // Test arrow functions
        const arrow = () => true;
        
        // Test const/let
        const constTest = 'test';
        let letTest = 'test';
        
        // Test template literals
        const template = `template ${constTest}`;
        
        // Test destructuring
        const { length } = 'test';
        
        // Test async/await (basic syntax check)
        const asyncTest = async () => true;
        
        return true;
      } catch (e) {
        return false;
      }
    });
    
    expect(modernJSSupport).toBeTruthy();
  });

  test('should handle touch events on mobile browsers', async ({ page, browserName }) => {
    // Only test touch on mobile browsers
    if (browserName.includes('mobile') || browserName.includes('Mobile')) {
      await page.goto('/');
      
      // Test touch event support
      const hasTouchSupport = await page.evaluate(() => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      });
      
      expect(hasTouchSupport).toBeTruthy();
      console.log(`Touch support on ${browserName}: ${hasTouchSupport}`);
    }
  });

  test('should handle different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },   // iPhone SE
      { width: 375, height: 667 },   // iPhone 6/7/8
      { width: 768, height: 1024 },  // iPad
      { width: 1024, height: 768 },  // iPad Landscape
      { width: 1366, height: 768 },  // Common laptop
      { width: 1920, height: 1080 }, // Full HD
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Page should be usable at all viewport sizes
      await expect(page.locator('body')).toBeVisible();
      
      // Check if content is not overflowing
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      // Some horizontal scroll might be acceptable for very small screens
      if (viewport.width >= 375) {
        expect(hasHorizontalScroll).toBeFalsy();
      }
      
      console.log(`Viewport ${viewport.width}x${viewport.height}: horizontal scroll = ${hasHorizontalScroll}`);
    }
  });

  test('should handle form interactions consistently', async ({ page }) => {
    await page.goto('/vc/quick');
    
    // Test form input interactions
    const emailInput = page.locator('input[type="email"], input[name*="email"]');
    
    if (await emailInput.isVisible()) {
      // Test typing
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
      
      // Test focus/blur
      await emailInput.focus();
      await expect(emailInput).toBeFocused();
      
      await emailInput.blur();
      // Note: blur state is harder to test consistently across browsers
    }
  });

  test('should load external resources correctly', async ({ page }) => {
    const failedRequests: string[] = [];
    
    page.on('requestfailed', (request) => {
      failedRequests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should not have critical resource failures
    const criticalFailures = failedRequests.filter(url => 
      url.includes('.js') || url.includes('.css') || url.includes('font')
    );
    
    expect(criticalFailures.length).toBe(0);
    
    if (failedRequests.length > 0) {
      console.log('Failed requests:', failedRequests);
    }
  });
});