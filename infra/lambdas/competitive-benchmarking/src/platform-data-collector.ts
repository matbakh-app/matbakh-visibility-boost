import axios from 'axios';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer-core';
import type { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import NodeCache from 'node-cache';
import {
  Competitor,
  PlatformMetrics,
  DataScrapingError,
  ScrapingConfig
} from './types';

/**
 * Platform Data Collector
 * 
 * Collects data from various platforms for competitor analysis:
 * - Google My Business profiles
 * - Instagram business profiles
 * - Facebook pages
 * - Yelp listings
 * - TripAdvisor profiles
 */
export class PlatformDataCollector {
  private cache: NodeCache;
  private config: ScrapingConfig;
  private browser: Browser | null = null;

  constructor(config: ScrapingConfig) {
    this.config = config;
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour cache
      checkperiod: 600,
      useClones: false
    });
  }

  /**
   * Collect platform data for a competitor
   */
  async collectPlatformData(
    competitor: Competitor,
    platforms: string[]
  ): Promise<PlatformMetrics[]> {
    const results: PlatformMetrics[] = [];
    const errors: string[] = [];

    console.log(`Collecting platform data for ${competitor.name} on platforms: ${platforms.join(', ')}`);

    // Collect data from each requested platform
    for (const platform of platforms) {
      try {
        const cacheKey = `${platform}_${competitor.id}`;
        const cached = this.cache.get<PlatformMetrics>(cacheKey);
        
        if (cached) {
          console.log(`Cache hit for ${platform} data: ${competitor.name}`);
          results.push(cached);
          continue;
        }

        let platformData: PlatformMetrics | null = null;

        switch (platform.toLowerCase()) {
          case 'google':
            platformData = await this.collectGoogleData(competitor);
            break;
          case 'instagram':
            platformData = await this.collectInstagramData(competitor);
            break;
          case 'facebook':
            platformData = await this.collectFacebookData(competitor);
            break;
          case 'yelp':
            platformData = await this.collectYelpData(competitor);
            break;
          case 'tripadvisor':
            platformData = await this.collectTripAdvisorData(competitor);
            break;
          default:
            console.warn(`Unsupported platform: ${platform}`);
            continue;
        }

        if (platformData) {
          this.cache.set(cacheKey, platformData);
          results.push(platformData);
        }

      } catch (error) {
        const errorMessage = `Failed to collect ${platform} data for ${competitor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        errors.push(errorMessage);
        
        // Create error platform metrics
        const errorMetrics: PlatformMetrics = {
          platform: platform as any,
          isVerified: false,
          lastScraped: new Date().toISOString(),
          scrapingErrors: [errorMessage]
        };
        results.push(errorMetrics);
      }
    }

    if (errors.length > 0) {
      console.warn(`Platform data collection completed with ${errors.length} errors for ${competitor.name}`);
    }

    return results;
  }

  /**
   * Collect Google My Business data
   */
  private async collectGoogleData(competitor: Competitor): Promise<PlatformMetrics> {
    try {
      // Search for the business on Google
      const searchQuery = `${competitor.name} ${competitor.address}`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.config.userAgent
        },
        timeout: this.config.requestTimeout
      });

      const $ = cheerio.load(response.data);
      
      // Extract Google My Business information
      const platformData: PlatformMetrics = {
        platform: 'google',
        isVerified: false,
        lastScraped: new Date().toISOString()
      };

      // Try to extract rating and review count
      const ratingText = $('[data-attrid="kc:/collection/knowledge_panels/local_reviewable:star_score"]').text();
      const reviewCountText = $('[data-attrid="kc:/collection/knowledge_panels/local_reviewable:review_count"]').text();
      
      if (ratingText && reviewCountText) {
        const rating = parseFloat(ratingText);
        const reviewCount = parseInt(reviewCountText.replace(/[^\d]/g, ''));
        
        if (!isNaN(rating) && !isNaN(reviewCount)) {
          platformData.reviews = {
            count: reviewCount,
            averageRating: rating
          };
        }
      }

      // Try to extract business hours
      const hoursElements = $('[data-attrid*="hours"]');
      if (hoursElements.length > 0) {
        platformData.businessHours = this.parseBusinessHours(hoursElements.text());
      }

      // Try to extract price level
      const priceElements = $('[data-attrid*="price"]');
      if (priceElements.length > 0) {
        platformData.priceLevel = this.parsePriceLevel(priceElements.text());
      }

      return platformData;

    } catch (error) {
      throw new DataScrapingError(
        `Failed to collect Google data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'google',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Collect Instagram data
   */
  private async collectInstagramData(competitor: Competitor): Promise<PlatformMetrics> {
    try {
      // Search for Instagram profile
      const searchQuery = competitor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const profileUrl = `https://www.instagram.com/${searchQuery}/`;
      
      // Use headless browser for Instagram (requires JavaScript)
      if (!this.browser) {
        this.browser = await this.getBrowser();
      }

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent);
      
      try {
        await page.goto(profileUrl, { 
          waitUntil: 'networkidle2',
          timeout: this.config.requestTimeout 
        });

        // Check if profile exists
        const isProfileFound = await page.$('article') !== null;
        
        if (!isProfileFound) {
          throw new Error('Instagram profile not found');
        }

        // Extract profile data
        const profileData = await page.evaluate(() => {
          const followersElement = document.querySelector('a[href*="/followers/"] span');
          const postsElement = document.querySelector('article header section ul li span');
          
          return {
            followers: followersElement ? parseInt(followersElement.textContent?.replace(/[^\d]/g, '') || '0') : 0,
            posts: postsElement ? parseInt(postsElement.textContent?.replace(/[^\d]/g, '') || '0') : 0,
            isVerified: document.querySelector('[title="Verified"]') !== null
          };
        });

        const platformData: PlatformMetrics = {
          platform: 'instagram',
          profileUrl,
          isVerified: profileData.isVerified,
          followers: profileData.followers,
          posts: profileData.posts,
          photos: {
            count: profileData.posts
          },
          lastScraped: new Date().toISOString()
        };

        return platformData;

      } finally {
        await page.close();
      }

    } catch (error) {
      throw new DataScrapingError(
        `Failed to collect Instagram data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'instagram',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Collect Facebook data
   */
  private async collectFacebookData(_competitor: Competitor): Promise<PlatformMetrics> {
    try {
      // Facebook requires more sophisticated scraping due to anti-bot measures
      // For now, return basic structure
      const platformData: PlatformMetrics = {
        platform: 'facebook',
        isVerified: false,
        lastScraped: new Date().toISOString(),
        scrapingErrors: ['Facebook data collection requires advanced authentication']
      };

      return platformData;

    } catch (error) {
      throw new DataScrapingError(
        `Failed to collect Facebook data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'facebook',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Collect Yelp data
   */
  private async collectYelpData(competitor: Competitor): Promise<PlatformMetrics> {
    try {
      // Search for business on Yelp
      const searchUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(competitor.name)}&find_loc=${encodeURIComponent(competitor.address)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.config.userAgent
        },
        timeout: this.config.requestTimeout
      });

      const $ = cheerio.load(response.data);
      
      // Find the business listing
      const businessLink = $('a[href*="/biz/"]').first();
      
      if (!businessLink.length) {
        throw new Error('Business not found on Yelp');
      }

      const businessUrl = 'https://www.yelp.com' + businessLink.attr('href');
      
      // Get detailed business page
      const businessResponse = await axios.get(businessUrl, {
        headers: {
          'User-Agent': this.config.userAgent
        },
        timeout: this.config.requestTimeout
      });

      const $business = cheerio.load(businessResponse.data);
      
      // Extract rating and review count
      const ratingElement = $business('[data-testid="rating"]');
      const reviewCountElement = $business('[data-testid="review-count"]');
      
      const rating = ratingElement.length ? parseFloat(ratingElement.attr('aria-label')?.match(/[\d.]+/)?.[0] || '0') : 0;
      const reviewCount = reviewCountElement.length ? parseInt(reviewCountElement.text().replace(/[^\d]/g, '')) : 0;

      // Extract price level
      const priceElement = $business('[data-testid="price-range"]');
      const priceLevel = priceElement.length ? priceElement.text().length : undefined;

      const platformData: PlatformMetrics = {
        platform: 'yelp',
        profileUrl: businessUrl,
        isVerified: false, // Yelp verification is harder to detect
        reviews: {
          count: reviewCount,
          averageRating: rating
        },
        priceLevel,
        lastScraped: new Date().toISOString()
      };

      return platformData;

    } catch (error) {
      throw new DataScrapingError(
        `Failed to collect Yelp data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'yelp',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Collect TripAdvisor data
   */
  private async collectTripAdvisorData(competitor: Competitor): Promise<PlatformMetrics> {
    try {
      // Search for business on TripAdvisor
      const searchQuery = `${competitor.name} ${competitor.address}`;
      const searchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(searchQuery)}`;
      
      await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.config.userAgent
        },
        timeout: this.config.requestTimeout
      });

      // TripAdvisor has complex structure, simplified extraction
      const platformData: PlatformMetrics = {
        platform: 'tripadvisor',
        isVerified: false,
        lastScraped: new Date().toISOString(),
        scrapingErrors: ['TripAdvisor data collection requires advanced parsing']
      };

      return platformData;

    } catch (error) {
      throw new DataScrapingError(
        `Failed to collect TripAdvisor data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'tripadvisor',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get browser instance for JavaScript-heavy sites
   */
  private async getBrowser(): Promise<Browser> {
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      // Running in Lambda
      return await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: 'new',
        ignoreHTTPSErrors: true,
      });
    } else {
      // Running locally
      return await puppeteer.launch({
        headless: this.config.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  /**
   * Parse business hours from text
   */
  private parseBusinessHours(hoursText: string): Record<string, string> {
    const hours: Record<string, string> = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Simple parsing - in production would need more sophisticated logic
    const lines = hoursText.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < Math.min(lines.length, days.length); i++) {
      hours[days[i]] = lines[i].trim();
    }
    
    return hours;
  }

  /**
   * Parse price level from text
   */
  private parsePriceLevel(priceText: string): number {
    const dollarSigns = (priceText.match(/\$/g) || []).length;
    return Math.min(Math.max(dollarSigns, 1), 4);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    };
  }
}