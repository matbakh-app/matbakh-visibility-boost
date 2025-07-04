
import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/de',
  '/en',
  '/angebote',
  '/packages',
  '/services',
  '/kontakt',
  '/contact',
  '/impressum',
  '/datenschutz',
  '/agb',
  '/nutzung',
  '/usage',
  '/b2c',
  '/b2c-en',
  '/business/partner',
];

routes.forEach((route) => {
  test(`Route ${route} loads successfully`, async ({ page }) => {
    await page.goto(route);
    
    // Check that page loads (no 404/500)
    await expect(page).not.toHaveTitle(/404|Not Found|Error/i);
    
    // Check for basic layout elements
    await expect(page.locator('header, nav, main, body')).toBeVisible();
    
    // Check response status
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
  });
});
