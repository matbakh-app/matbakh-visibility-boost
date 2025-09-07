import axios from 'axios';
import NodeCache from 'node-cache';
// import { v4 as uuidv4 } from 'uuid'; // Currently unused
import {
  Competitor,
  CompetitorDiscoveryError,
  CompetitorDiscoveryConfig,
  BenchmarkingRequest
} from './types';

/**
 * Competitor Discovery Engine
 * 
 * Discovers competitors using multiple data sources:
 * - Google Places API for nearby businesses
 * - Yelp API for restaurant data
 * - Foursquare API for location intelligence
 * - Web scraping for additional data sources
 */
export class CompetitorDiscoveryEngine {
  private cache: NodeCache;
  private config: CompetitorDiscoveryConfig;

  constructor(config: CompetitorDiscoveryConfig) {
    this.config = config;
    this.cache = new NodeCache({ 
      stdTTL: config.cacheTtl,
      checkperiod: config.cacheTtl * 0.2,
      useClones: false
    });
  }

  /**
   * Discover competitors for a given business
   */
  async discoverCompetitors(request: BenchmarkingRequest): Promise<Competitor[]> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first unless force refresh is requested
    if (!request.forceRefresh && this.config.cacheEnabled) {
      const cached = this.cache.get<Competitor[]>(cacheKey);
      if (cached) {
        console.log(`Cache hit for competitor discovery: ${cacheKey}`);
        return cached;
      }
    }

    try {
      console.log(`Discovering competitors for ${request.businessName} within ${request.radius}m`);
      
      // Discover competitors from multiple sources
      const [googleCompetitors, yelpCompetitors, foursquareCompetitors] = await Promise.allSettled([
        this.discoverFromGoogle(request),
        this.discoverFromYelp(request),
        this.discoverFromFoursquare(request)
      ]);

      // Merge and deduplicate competitors
      const allCompetitors: Competitor[] = [];
      
      if (googleCompetitors.status === 'fulfilled') {
        allCompetitors.push(...googleCompetitors.value);
      } else {
        console.warn('Google competitor discovery failed:', googleCompetitors.reason);
      }

      if (yelpCompetitors.status === 'fulfilled') {
        allCompetitors.push(...yelpCompetitors.value);
      } else {
        console.warn('Yelp competitor discovery failed:', yelpCompetitors.reason);
      }

      if (foursquareCompetitors.status === 'fulfilled') {
        allCompetitors.push(...foursquareCompetitors.value);
      } else {
        console.warn('Foursquare competitor discovery failed:', foursquareCompetitors.reason);
      }

      // Deduplicate and filter competitors
      const uniqueCompetitors = this.deduplicateCompetitors(allCompetitors);
      const filteredCompetitors = this.filterCompetitors(uniqueCompetitors, request);
      const rankedCompetitors = this.rankCompetitors(filteredCompetitors, request);

      // Limit to requested number
      const finalCompetitors = rankedCompetitors.slice(0, request.maxCompetitors);

      // Cache results
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, finalCompetitors);
      }

      console.log(`Discovered ${finalCompetitors.length} competitors for ${request.businessName}`);
      return finalCompetitors;

    } catch (error) {
      console.error('Competitor discovery failed:', error);
      throw new CompetitorDiscoveryError(
        `Failed to discover competitors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Discover competitors using Google Places API
   */
  private async discoverFromGoogle(request: BenchmarkingRequest): Promise<Competitor[]> {
    const competitors: Competitor[] = [];
    
    try {
      // Search for nearby restaurants
      const searchUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const params = {
        location: `${request.coordinates.lat},${request.coordinates.lng}`,
        radius: request.radius.toString(),
        type: 'restaurant',
        key: this.config.googleMapsApiKey
      };

      const response = await axios.get(searchUrl, { 
        params,
        timeout: this.config.requestTimeout 
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      for (const place of response.data.results) {
        // Skip the business itself
        if (place.name.toLowerCase() === request.businessName.toLowerCase()) {
          continue;
        }

        const competitor: Competitor = {
          id: `google_${place.place_id}`,
          name: place.name,
          address: place.vicinity || place.formatted_address || 'Address not available',
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          category: this.mapGoogleCategory(place.types),
          subcategory: place.types?.[1] || undefined,
          distance: this.calculateDistance(
            request.coordinates,
            { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
          ),
          discoveredAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          status: place.business_status === 'OPERATIONAL' ? 'active' : 'unknown',
          confidence: this.calculateGoogleConfidence(place),
          sources: ['google_places']
        };

        competitors.push(competitor);
      }

      // Handle pagination if needed
      if (response.data.next_page_token && competitors.length < request.maxCompetitors) {
        await this.delay(2000); // Google requires delay before next page
        const nextPageCompetitors = await this.fetchGoogleNextPage(
          response.data.next_page_token,
          request
        );
        competitors.push(...nextPageCompetitors);
      }

    } catch (error) {
      console.error('Google competitor discovery error:', error);
      throw new CompetitorDiscoveryError(
        `Google Places API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }

    return competitors;
  }

  /**
   * Discover competitors using Yelp API
   */
  private async discoverFromYelp(_request: BenchmarkingRequest): Promise<Competitor[]> {
    const competitors: Competitor[] = [];
    
    try {
      // Note: This would require Yelp API key and proper authentication
      // For now, we'll return empty array as Yelp API requires business approval
      console.log('Yelp competitor discovery not implemented - requires API approval');
      return competitors;

    } catch (error) {
      console.error('Yelp competitor discovery error:', error);
      return competitors; // Don't throw, just return empty array
    }
  }

  /**
   * Discover competitors using Foursquare API
   */
  private async discoverFromFoursquare(_request: BenchmarkingRequest): Promise<Competitor[]> {
    const competitors: Competitor[] = [];
    
    try {
      // Note: This would require Foursquare API key
      // For now, we'll return empty array
      console.log('Foursquare competitor discovery not implemented - requires API key');
      return competitors;

    } catch (error) {
      console.error('Foursquare competitor discovery error:', error);
      return competitors; // Don't throw, just return empty array
    }
  }

  /**
   * Fetch next page from Google Places API
   */
  private async fetchGoogleNextPage(
    nextPageToken: string,
    request: BenchmarkingRequest
  ): Promise<Competitor[]> {
    const competitors: Competitor[] = [];
    
    try {
      const searchUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const params = {
        pagetoken: nextPageToken,
        key: this.config.googleMapsApiKey
      };

      const response = await axios.get(searchUrl, { 
        params,
        timeout: this.config.requestTimeout 
      });

      if (response.data.status !== 'OK') {
        console.warn(`Google Places next page error: ${response.data.status}`);
        return competitors;
      }

      for (const place of response.data.results) {
        // Skip the business itself
        if (place.name.toLowerCase() === request.businessName.toLowerCase()) {
          continue;
        }

        const competitor: Competitor = {
          id: `google_${place.place_id}`,
          name: place.name,
          address: place.vicinity || place.formatted_address || 'Address not available',
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          category: this.mapGoogleCategory(place.types),
          subcategory: place.types?.[1] || undefined,
          distance: this.calculateDistance(
            request.coordinates,
            { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
          ),
          discoveredAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          status: place.business_status === 'OPERATIONAL' ? 'active' : 'unknown',
          confidence: this.calculateGoogleConfidence(place),
          sources: ['google_places']
        };

        competitors.push(competitor);
      }

    } catch (error) {
      console.error('Google next page fetch error:', error);
    }

    return competitors;
  }

  /**
   * Deduplicate competitors based on name and location similarity
   */
  private deduplicateCompetitors(competitors: Competitor[]): Competitor[] {
    const unique: Competitor[] = [];
    const seen = new Set<string>();

    for (const competitor of competitors) {
      // Create a key based on normalized name and approximate location
      const normalizedName = competitor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const locationKey = `${Math.round(competitor.coordinates.lat * 1000)}_${Math.round(competitor.coordinates.lng * 1000)}`;
      const key = `${normalizedName}_${locationKey}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(competitor);
      } else {
        // Merge sources if duplicate found
        const existing = unique.find(c => {
          const existingKey = `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.round(c.coordinates.lat * 1000)}_${Math.round(c.coordinates.lng * 1000)}`;
          return existingKey === key;
        });
        
        if (existing) {
          existing.sources = [...new Set([...existing.sources, ...competitor.sources])];
          existing.confidence = Math.max(existing.confidence, competitor.confidence);
        }
      }
    }

    return unique;
  }

  /**
   * Filter competitors based on request criteria
   */
  private filterCompetitors(competitors: Competitor[], request: BenchmarkingRequest): Competitor[] {
    return competitors.filter(competitor => {
      // Filter by status
      if (!request.includeInactive && competitor.status !== 'active') {
        return false;
      }

      // Filter by distance (should already be within radius, but double-check)
      if (competitor.distance > request.radius) {
        return false;
      }

      // Filter by category relevance
      if (!this.isCategoryRelevant(competitor.category, request.category)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Rank competitors by relevance and quality
   */
  private rankCompetitors(competitors: Competitor[], request: BenchmarkingRequest): Competitor[] {
    return competitors.sort((a, b) => {
      // Primary sort: confidence score
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) {
        return confidenceDiff;
      }

      // Secondary sort: distance (closer is better)
      const distanceDiff = a.distance - b.distance;
      if (Math.abs(distanceDiff) > 100) {
        return distanceDiff;
      }

      // Tertiary sort: category relevance
      const aRelevance = this.getCategoryRelevanceScore(a.category, request.category);
      const bRelevance = this.getCategoryRelevanceScore(b.category, request.category);
      
      return bRelevance - aRelevance;
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Map Google Place types to our category system
   */
  private mapGoogleCategory(types: string[]): string {
    const categoryMap: Record<string, string> = {
      'restaurant': 'restaurant',
      'food': 'restaurant',
      'meal_takeaway': 'restaurant',
      'meal_delivery': 'restaurant',
      'cafe': 'cafe',
      'bar': 'bar',
      'bakery': 'bakery',
      'night_club': 'nightclub',
      'lodging': 'hotel'
    };

    for (const type of types) {
      if (categoryMap[type]) {
        return categoryMap[type];
      }
    }

    return 'restaurant'; // default
  }

  /**
   * Calculate confidence score for Google Places result
   */
  private calculateGoogleConfidence(place: any): number {
    let confidence = 0.7; // base confidence for Google data

    // Boost confidence based on available data
    if (place.rating && place.user_ratings_total) {
      confidence += 0.1;
      if (place.user_ratings_total > 50) confidence += 0.1;
      if (place.user_ratings_total > 200) confidence += 0.1;
    }

    if (place.photos && place.photos.length > 0) {
      confidence += 0.05;
    }

    if (place.price_level) {
      confidence += 0.05;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Check if competitor category is relevant to business category
   */
  private isCategoryRelevant(competitorCategory: string, businessCategory: string): boolean {
    const relevantCategories: Record<string, string[]> = {
      'restaurant': ['restaurant', 'cafe', 'bar', 'bakery'],
      'cafe': ['cafe', 'restaurant', 'bakery'],
      'bar': ['bar', 'restaurant', 'nightclub'],
      'hotel': ['hotel', 'lodging'],
      'bakery': ['bakery', 'cafe', 'restaurant']
    };

    const relevant = relevantCategories[businessCategory.toLowerCase()] || [businessCategory.toLowerCase()];
    return relevant.includes(competitorCategory.toLowerCase());
  }

  /**
   * Get category relevance score
   */
  private getCategoryRelevanceScore(competitorCategory: string, businessCategory: string): number {
    if (competitorCategory.toLowerCase() === businessCategory.toLowerCase()) {
      return 1.0;
    }

    const relevanceScores: Record<string, Record<string, number>> = {
      'restaurant': {
        'cafe': 0.8,
        'bar': 0.7,
        'bakery': 0.6
      },
      'cafe': {
        'restaurant': 0.8,
        'bakery': 0.9
      },
      'bar': {
        'restaurant': 0.7,
        'nightclub': 0.8
      }
    };

    return relevanceScores[businessCategory.toLowerCase()]?.[competitorCategory.toLowerCase()] || 0.3;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: BenchmarkingRequest): string {
    const key = `competitors_${request.coordinates.lat}_${request.coordinates.lng}_${request.radius}_${request.category}_${request.maxCompetitors}`;
    return key.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    };
  }
}