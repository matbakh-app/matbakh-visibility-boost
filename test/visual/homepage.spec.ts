/**
 * Homepage Visual Regression Tests
 * Part of System Optimization Enhancement - Task 4
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage Visual Tests', () => {
  test('should match homepage screenshot', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Consistent font styling for CI/local consistency
    await page.addStyleTag({
      content: `* { font-family: Arial, sans-serif !important; }`
    });
    
    // Hide dynamic elements that might cause flakiness
    await page.addStyleTag({
      content: `
        [data-testid*="timestamp"],
        [data-testid*="time"],
        .timestamp,
        .time {
          visibility: hidden !important;
        }
      `
    });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match homepage header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Consistent font styling
    await page.addStyleTag({
      content: `* { font-family: Arial, sans-serif !important; }`
    });
    
    const header = page.locator('header, [role="banner"], nav').first();
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('homepage-header.png');
    }
  });

  test('should match homepage hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Consistent font styling
    await page.addStyleTag({
      content: `* { font-family: Arial, sans-serif !important; }`
    });
    
    // Look for hero section
    const heroSelectors = [
      '[data-testid*="hero"]',
      '.hero',
      'main > section:first-child',
      'h1'
    ];
    
    for (const selector of heroSelectors) {
      const hero = page.locator(selector).first();
      if (await hero.isVisible()) {
        await expect(hero).toHaveScreenshot('homepage-hero.png');
        break;
      }
    }
  });

  test('should match homepage footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Consistent font styling
    await page.addStyleTag({
      content: `* { font-family: Arial, sans-serif !important; }`
    });
    
    const footer = page.locator('footer, [role="contentinfo"]').first();
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('homepage-footer.png');
    }
  });
});