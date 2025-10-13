/**
 * App Navigation E2E Tests
 * Part of System Optimization Enhancement - Task 4
 */

import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to main pages successfully', async ({ page }) => {
    // Test homepage
    await expect(page).toHaveTitle(/matbakh/i);
    
    // Test navigation to VC Quick
    await page.click('a[href*="/vc/quick"]');
    await expect(page).toHaveURL(/\/vc\/quick/);
    await expect(page.locator('h1')).toContainText(/visibility/i);
    
    // Test navigation to dashboard (if accessible)
    await page.goto('/dashboard');
    // Should either show dashboard or redirect to login
    await expect(page).toHaveURL(/\/(dashboard|login|auth)/);
    
    // Test navigation to admin (should require auth)
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/(admin|login|auth)/);
  });

  test('should handle responsive navigation', async ({ page }) => {
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Look for mobile menu button
    const mobileMenuButton = page.locator('[aria-label*="menu"], [data-testid*="mobile-menu"], button:has-text("Menu")');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      // Check if navigation items are visible
      const navItems = page.locator('nav a, [role="navigation"] a');
      await expect(navItems.first()).toBeVisible();
    }
    
    // Test desktop navigation
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopNav = page.locator('nav, [role="navigation"]');
    await expect(desktopNav).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page', { waitUntil: 'domcontentloaded' });
    
    // Should show 404 page or redirect
    const is404 = await page.locator(':text-matches("404|not found", "i")').first().isVisible();
    const redirected = !page.url().includes('non-existent-page');
    
    expect(is404 || redirected).toBeTruthy();
  });

  test('should maintain navigation state across page reloads', async ({ page }) => {
    // Navigate to a specific page
    await page.goto('/vc/quick');
    await expect(page).toHaveURL(/\/vc\/quick/);
    
    // Reload the page
    await page.reload();
    
    // Should still be on the same page
    await expect(page).toHaveURL(/\/vc\/quick/);
    await expect(page.locator('body')).toBeVisible();
  });
});