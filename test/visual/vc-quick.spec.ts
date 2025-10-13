/**
 * VC Quick Visual Regression Tests
 * Part of System Optimization Enhancement - Task 4
 */

import { test, expect } from '@playwright/test';

test.describe('VC Quick Visual Tests', () => {
  test('should match VC Quick page layout', async ({ page }) => {
    await page.goto('/vc/quick');
    await page.waitForLoadState('networkidle');
    
    // Consistent font styling
    await page.addStyleTag({
      content: `* { font-family: Arial, sans-serif !important; }`
    });
    
    // Hide dynamic elements
    await page.addStyleTag({
      content: `
        [data-testid*="timestamp"],
        [data-testid*="time"],
        .timestamp,
        .time,
        [data-testid*="loading"] {
          visibility: hidden !important;
        }
      `
    });
    
    await expect(page).toHaveScreenshot('vc-quick-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match VC Quick form', async ({ page }) => {
    await page.goto('/vc/quick');
    await page.waitForLoadState('networkidle');
    
    // Consistent font styling
    await page.addStyleTag({
      content: `* { font-family: Arial, sans-serif !important; }`
    });
    
    const form = page.locator('form, [data-testid*="form"]').first();
    if (await form.isVisible()) {
      await expect(form).toHaveScreenshot('vc-quick-form.png');
    }
  });

  test('should match VC Quick form with validation errors', async ({ page }) => {
    await page.goto('/vc/quick');
    await page.waitForLoadState('networkidle');
    
    // Consistent font styling
    await page.addStyleTag({
      content: `* { font-family: Arial, sans-serif !important; }`
    });
    
    // Try to trigger validation by submitting empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Start")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for validation errors to appear
      await page.waitForTimeout(500);
      
      const form = page.locator('form, [data-testid*="form"]').first();
      if (await form.isVisible()) {
        await expect(form).toHaveScreenshot('vc-quick-form-errors.png');
      }
    }
  });

  test('should match VC Quick mobile layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/vc/quick');
    await page.waitForLoadState('networkidle');
    
    // Consistent font styling
    await page.addStyleTag({
      content: `* { font-family: Arial, sans-serif !important; }`
    });
    
    await expect(page).toHaveScreenshot('vc-quick-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});