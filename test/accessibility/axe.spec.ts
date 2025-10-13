/**
 * Accessibility Tests with axe-core
 * Automated WCAG compliance testing
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core into the page
    await injectAxe(page);
  });

  test('Homepage should be accessible', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('VC Quick page should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/vc/quick`);
    await page.waitForLoadState('networkidle');
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Dashboard should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Run accessibility checks with relaxed rules for dashboard complexity
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'aria-labels': { enabled: true },
      },
    });
  });

  test('QA Test page should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/qa-test`);
    await page.waitForLoadState('networkidle');
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Admin pages should be accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Should have no critical accessibility violations', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Get violations and check severity
    const violations = await getViolations(page);
    const criticalViolations = violations.filter(v => v.impact === 'critical');
    const seriousViolations = violations.filter(v => v.impact === 'serious');
    
    // Log violations for debugging
    if (violations.length > 0) {
      console.log(`Found ${violations.length} accessibility violations:`);
      violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description} (${violation.impact})`);
      });
    }
    
    // Fail test if critical violations found
    expect(criticalViolations).toHaveLength(0);
    
    // Warn about serious violations but don't fail
    if (seriousViolations.length > 0) {
      console.warn(`Warning: ${seriousViolations.length} serious accessibility violations found`);
    }
  });

  test('Should support keyboard navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test that focus is visible
    const focusedElementBox = await focusedElement.boundingBox();
    expect(focusedElementBox).toBeTruthy();
  });

  test('Should have proper heading hierarchy', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check for h1 element
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBeGreaterThanOrEqual(1);
    
    // Run specific heading order check
    await checkA11y(page, null, {
      rules: {
        'heading-order': { enabled: true },
      },
    });
  });

  test('Should have alt text for images', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Run specific image alt text check
    await checkA11y(page, null, {
      rules: {
        'image-alt': { enabled: true },
      },
    });
  });

  test('Should have proper form labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/vc/quick`);
    await page.waitForLoadState('networkidle');
    
    // Run specific form label check
    await checkA11y(page, null, {
      rules: {
        'label': { enabled: true },
        'label-title-only': { enabled: true },
      },
    });
  });

  test('Should have sufficient color contrast', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Run specific color contrast check
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    });
  });
});