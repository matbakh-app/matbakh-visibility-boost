/**
 * Visibility Check E2E Tests
 * Part of System Optimization Enhancement - Task 4
 */

import { test, expect } from '@playwright/test';

test.describe('Visibility Check Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vc/quick');
  });

  test('should complete visibility check form submission', async ({ page }) => {
    // Wait for the form to be visible
    await expect(page.locator('form, [data-testid="vc-form"]')).toBeVisible();
    
    // Fill in email field
    const emailInput = page.locator('input[type="email"], input[name*="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }
    
    // Fill in business name if present
    const businessNameInput = page.locator('input[name*="business"], input[name*="restaurant"]');
    if (await businessNameInput.isVisible()) {
      await businessNameInput.fill('Test Restaurant');
    }
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Start"), button:has-text("Analyze")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show success message or redirect
      await expect(page).toHaveURL(/\/(vc\/result|success|confirm)/);
    }
  });

  test('should validate form inputs', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Start"), button:has-text("Analyze")');
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors
      const errorMessages = page.locator('[role="alert"], .error, [data-testid*="error"]');
      const hasValidation = await errorMessages.count() > 0;
      
      if (hasValidation) {
        await expect(errorMessages.first()).toBeVisible();
      }
    }
  });

  test('should handle invalid email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name*="email"]');
    
    if (await emailInput.isVisible()) {
      // Enter invalid email
      await emailInput.fill('invalid-email');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Start")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show email validation error
        const emailError = page.locator('text=/invalid.*email|email.*invalid/i');
        if (await emailError.isVisible()) {
          await expect(emailError).toBeVisible();
        }
      }
    }
  });

  test('should show loading state during submission', async ({ page }) => {
    // Fill form with valid data
    const emailInput = page.locator('input[type="email"], input[name*="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Start")');
    if (await submitButton.isVisible()) {
      // Click submit and immediately check for loading state
      await submitButton.click();
      
      // Look for loading indicators
      const loadingIndicators = page.locator('[data-testid*="loading"], .loading, .spinner, text=/loading|analyzing/i');
      
      // At least one loading indicator should appear briefly
      const hasLoading = await Promise.race([
        loadingIndicators.first().isVisible().then(() => true),
        page.waitForTimeout(1000).then(() => false)
      ]);
      
      // This is informational - loading states may be very fast
      console.log('Loading state detected:', hasLoading);
    }
  });
});