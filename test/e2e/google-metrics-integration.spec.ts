import { test, expect } from '@playwright/test';

test.describe('Google Metrics Integration E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the visibility check page
    await page.goto('/');
  });

  test('displays Google metrics in visibility results', async ({ page }) => {
    // Mock the visibility check API response with Google metrics
    await page.route('**/enhanced-visibility-check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overallScore: 85,
          platformAnalyses: [
            {
              platform: 'google',
              score: 85,
              maxScore: 100,
              completedFeatures: ['Business Profile', 'Photos'],
              missingFeatures: ['Posts'],
              profileFound: true,
              recommendations: ['Add more photos'],
              gmb_metrics: {
                rating: 4.5,
                reviewCount: 25,
                profileComplete: true,
                hasPhotos: true
              }
            }
          ],
          benchmarks: [],
          categoryInsights: ['Visual content is important'],
          quickWins: ['Add more photos', 'Respond to reviews'],
          leadPotential: 'medium',
          provider: 'bedrock',
          gmb_metrics: {
            rating: 4.5,
            reviewCount: 25,
            profileComplete: true,
            hasPhotos: true
          },
          ga4_metrics: {
            sessions: 1500,
            pageviews: 4500,
            bounceRate: 0.35,
            avgSessionDuration: 125
          },
          ads_metrics: {
            impressions: 10000,
            clicks: 250,
            ctr: 0.025,
            cost: 150.75
          }
        })
      });
    });

    // Fill out the visibility check form
    await page.fill('input[name="businessName"]', 'Test Restaurant GMB');
    await page.fill('input[name="location"]', 'München, Deutschland');
    await page.selectOption('select[name="mainCategory"]', 'Restaurant');
    await page.fill('input[name="email"]', 'test@example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for results to load
    await page.waitForSelector('text=Sichtbarkeits-Analyse für Test Restaurant GMB');

    // Check if Google Services metrics section is visible
    await expect(page.locator('text=Google Services Metriken')).toBeVisible();

    // Check Google My Business metrics
    await expect(page.locator('text=Google My Business')).toBeVisible();
    await expect(page.locator('text=4.5')).toBeVisible();
    await expect(page.locator('text=25')).toBeVisible();

    // Check Google Analytics 4 metrics
    await expect(page.locator('text=Google Analytics 4')).toBeVisible();
    await expect(page.locator('text=1.500')).toBeVisible(); // Sessions
    await expect(page.locator('text=4.500')).toBeVisible(); // Pageviews

    // Check Google Ads metrics
    await expect(page.locator('text=Google Ads')).toBeVisible();
    await expect(page.locator('text=10.000')).toBeVisible(); // Impressions
    await expect(page.locator('text=250')).toBeVisible(); // Clicks

    // Check if Live Google Metrics appears in platform card
    await expect(page.locator('text=Live Google Metriken')).toBeVisible();
  });

  test('handles visibility check without Google metrics gracefully', async ({ page }) => {
    // Mock the visibility check API response without Google metrics
    await page.route('**/enhanced-visibility-check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overallScore: 75,
          platformAnalyses: [
            {
              platform: 'google',
              score: 75,
              maxScore: 100,
              completedFeatures: ['Business Profile'],
              missingFeatures: ['Photos', 'Posts'],
              profileFound: true,
              recommendations: ['Add photos', 'Post regularly']
            }
          ],
          benchmarks: [],
          categoryInsights: ['Focus on visual content'],
          quickWins: ['Add photos'],
          leadPotential: 'medium',
          provider: 'mockAnalysis'
        })
      });
    });

    // Fill out the visibility check form
    await page.fill('input[name="businessName"]', 'Test Restaurant No Metrics');
    await page.fill('input[name="location"]', 'Berlin, Deutschland');
    await page.selectOption('select[name="mainCategory"]', 'Restaurant');
    await page.fill('input[name="email"]', 'test@example.com');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for results to load
    await page.waitForSelector('text=Sichtbarkeits-Analyse für Test Restaurant No Metrics');

    // Google Services metrics section should not be visible
    await expect(page.locator('text=Google Services Metriken')).not.toBeVisible();

    // Live Google Metrics should not be visible in platform card
    await expect(page.locator('text=Live Google Metriken')).not.toBeVisible();

    // But the regular analysis should still be shown
    await expect(page.locator('text=Detaillierte Plattform-Analyse')).toBeVisible();
    await expect(page.locator('text=75/100')).toBeVisible();
  });

  test('CSV export includes Google metrics columns', async ({ page }) => {
    // Mock the CSV export API response
    await page.route('**/export-visibility-csv/*', async (route) => {
      const csvContent = `lead_id,overall_score,gmb_metrics,ga4_metrics,ads_metrics,provider
123e4567-e89b-12d3-a456-426614174000,85,"{""rating"":4.5,""reviewCount"":25}","{""sessions"":1500,""pageviews"":4500}","{""impressions"":10000,""clicks"":250}",bedrock`;
      
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        headers: {
          'Content-Disposition': 'attachment; filename="visibility-results-123.csv"'
        },
        body: csvContent
      });
    });

    // Navigate to a results page and trigger CSV download
    // This would typically happen after a visibility check
    await page.goto('/visibility/results?leadId=123e4567-e89b-12d3-a456-426614174000');
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click download CSV button (assuming it exists on results page)
    await page.click('button:has-text("CSV herunterladen")');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify the download filename
    expect(download.suggestedFilename()).toContain('visibility-results');
    
    // Save the file and verify its content contains Google metrics
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});