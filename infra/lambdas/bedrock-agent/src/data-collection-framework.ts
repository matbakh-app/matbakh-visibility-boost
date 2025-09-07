/**
 * Data Collection Framework for Bedrock AI Core
 * 
 * Implements progressive data gathering with minimal initial requirements,
 * data quality scoring, and validation pipeline for AI processing.
 * 
 * Requirements: 2.4, 8.1, 9.3
 */

export interface RestaurantData {
  // Core Business Information
  business_name?: string;
  business_type?: string;
  main_category?: string;
  sub_categories?: string[];
  
  // Location Data
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Contact Information
  phone?: string;
  email?: string;
  website_url?: string;
  
  // Social Media Presence
  google_my_business_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  
  // Business Details
  opening_hours?: {
    [day: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  price_range?: 'budget' | 'mid-range' | 'upscale' | 'fine-dining';
  cuisine_types?: string[];
  specialties?: string[];
  
  // Marketing Data
  target_audience?: string[];
  unique_selling_points?: string[];
  seasonal_offerings?: string[];
  
  // Competitive Context
  local_competitors?: string[];
  benchmark_urls?: string[];
  
  // Metadata
  data_source?: 'user_input' | 'gmb_api' | 'web_scraping' | 'ai_inference';
  last_updated?: string;
  completeness_score?: number;
}

export interface UserContext {
  user_id?: string;
  persona_type?: 'Solo-Sarah' | 'Bewahrer-Ben' | 'Wachstums-Walter' | 'Ketten-Katrin';
  language_preference?: 'de' | 'en';
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  primary_goals?: string[];
  time_availability?: 'limited' | 'moderate' | 'flexible';
  technical_comfort?: 'low' | 'medium' | 'high';
  previous_interactions?: number;
}

export interface DataQualityScore {
  overall_score: number; // 0-100
  category_scores: {
    basic_info: number;
    contact_details: number;
    online_presence: number;
    business_details: number;
    marketing_data: number;
  };
  missing_critical_fields: string[];
  missing_optional_fields: string[];
  data_freshness_score: number;
  confidence_level: 'low' | 'medium' | 'high';
}

export interface DataCollectionPriority {
  field_name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact_on_analysis: number; // 0-100
  collection_difficulty: 'easy' | 'medium' | 'hard';
  persona_relevance: {
    [persona: string]: number; // 0-100
  };
}

export class DataCollectionFramework {
  private static readonly CRITICAL_FIELDS = [
    'business_name',
    'main_category',
    'address.city',
    'address.country'
  ];

  private static readonly HIGH_PRIORITY_FIELDS = [
    'business_type',
    'address.street',
    'phone',
    'website_url',
    'google_my_business_url'
  ];

  private static readonly FIELD_PRIORITIES: DataCollectionPriority[] = [
    {
      field_name: 'business_name',
      priority: 'critical',
      impact_on_analysis: 100,
      collection_difficulty: 'easy',
      persona_relevance: {
        'Solo-Sarah': 100,
        'Bewahrer-Ben': 100,
        'Wachstums-Walter': 100,
        'Ketten-Katrin': 100
      }
    },
    {
      field_name: 'main_category',
      priority: 'critical',
      impact_on_analysis: 95,
      collection_difficulty: 'easy',
      persona_relevance: {
        'Solo-Sarah': 90,
        'Bewahrer-Ben': 95,
        'Wachstums-Walter': 100,
        'Ketten-Katrin': 100
      }
    },
    {
      field_name: 'google_my_business_url',
      priority: 'high',
      impact_on_analysis: 90,
      collection_difficulty: 'medium',
      persona_relevance: {
        'Solo-Sarah': 85,
        'Bewahrer-Ben': 70,
        'Wachstums-Walter': 95,
        'Ketten-Katrin': 90
      }
    },
    {
      field_name: 'target_audience',
      priority: 'medium',
      impact_on_analysis: 75,
      collection_difficulty: 'hard',
      persona_relevance: {
        'Solo-Sarah': 60,
        'Bewahrer-Ben': 50,
        'Wachstums-Walter': 90,
        'Ketten-Katrin': 85
      }
    }
  ];

  /**
   * Calculate data quality score for restaurant data
   */
  static calculateDataQuality(data: RestaurantData): DataQualityScore {
    const scores = {
      basic_info: this.scoreBasicInfo(data),
      contact_details: this.scoreContactDetails(data),
      online_presence: this.scoreOnlinePresence(data),
      business_details: this.scoreBusinessDetails(data),
      marketing_data: this.scoreMarketingData(data)
    };

    const overall_score = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;
    
    const missing_critical = this.CRITICAL_FIELDS.filter(field => !this.getNestedValue(data, field));
    const missing_optional = this.HIGH_PRIORITY_FIELDS.filter(field => !this.getNestedValue(data, field));
    
    const data_freshness = this.calculateFreshnessScore(data.last_updated);
    
    return {
      overall_score: Math.round(overall_score),
      category_scores: scores,
      missing_critical_fields: missing_critical,
      missing_optional_fields: missing_optional,
      data_freshness_score: data_freshness,
      confidence_level: overall_score >= 80 ? 'high' : overall_score >= 60 ? 'medium' : 'low'
    };
  }

  /**
   * Get prioritized list of missing data fields based on persona
   */
  static getPrioritizedMissingFields(
    data: RestaurantData, 
    userContext: UserContext
  ): DataCollectionPriority[] {
    const missingFields = this.FIELD_PRIORITIES.filter(priority => {
      const value = this.getNestedValue(data, priority.field_name);
      return !value || (Array.isArray(value) && value.length === 0);
    });

    // Sort by persona relevance and impact
    return missingFields.sort((a, b) => {
      const personaRelevanceA = userContext.persona_type ? 
        a.persona_relevance[userContext.persona_type] || 0 : 50;
      const personaRelevanceB = userContext.persona_type ? 
        b.persona_relevance[userContext.persona_type] || 0 : 50;
      
      const scoreA = (personaRelevanceA * 0.6) + (a.impact_on_analysis * 0.4);
      const scoreB = (personaRelevanceB * 0.6) + (b.impact_on_analysis * 0.4);
      
      return scoreB - scoreA;
    });
  }

  /**
   * Validate and sanitize restaurant data for AI processing
   */
  static validateAndSanitize(data: RestaurantData): {
    sanitized_data: RestaurantData;
    validation_errors: string[];
    security_warnings: string[];
  } {
    const sanitized_data: RestaurantData = { ...data };
    const validation_errors: string[] = [];
    const security_warnings: string[] = [];

    // Sanitize text fields
    if (sanitized_data.business_name) {
      sanitized_data.business_name = this.sanitizeText(sanitized_data.business_name);
      if (sanitized_data.business_name.length > 100) {
        validation_errors.push('Business name too long (max 100 characters)');
      }
    }

    // Validate URLs
    const urlFields = ['website_url', 'google_my_business_url', 'facebook_url', 'instagram_url'];
    urlFields.forEach(field => {
      const url = this.getNestedValue(sanitized_data, field) as string;
      if (url && !this.isValidUrl(url)) {
        validation_errors.push(`Invalid URL format for ${field}`);
      }
    });

    // Validate email
    if (sanitized_data.email && !this.isValidEmail(sanitized_data.email)) {
      validation_errors.push('Invalid email format');
    }

    // Check for potential PII in business data
    if (sanitized_data.business_name && this.containsPotentialPII(sanitized_data.business_name)) {
      security_warnings.push('Business name may contain personal information');
    }

    // Validate coordinates
    if (sanitized_data.address?.coordinates) {
      const { lat, lng } = sanitized_data.address.coordinates;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        validation_errors.push('Invalid coordinates');
      }
    }

    return {
      sanitized_data,
      validation_errors,
      security_warnings
    };
  }

  /**
   * Determine minimum required fields based on analysis type and persona
   */
  static getMinimumRequiredFields(
    analysisType: 'visibility_check' | 'content_generation' | 'strategic_analysis',
    persona?: string
  ): string[] {
    const baseRequired = ['business_name', 'main_category'];
    
    switch (analysisType) {
      case 'visibility_check':
        return [...baseRequired, 'address.city', 'google_my_business_url'];
      case 'content_generation':
        return [...baseRequired, 'cuisine_types', 'target_audience'];
      case 'strategic_analysis':
        return [...baseRequired, 'address.city', 'local_competitors', 'target_audience'];
      default:
        return baseRequired;
    }
  }

  // Private helper methods
  private static scoreBasicInfo(data: RestaurantData): number {
    let score = 0;
    if (data.business_name) score += 30;
    if (data.business_type) score += 20;
    if (data.main_category) score += 30;
    if (data.sub_categories && data.sub_categories.length > 0) score += 20;
    return score;
  }

  private static scoreContactDetails(data: RestaurantData): number {
    let score = 0;
    if (data.phone) score += 25;
    if (data.email) score += 25;
    if (data.website_url) score += 25;
    if (data.address?.street && data.address?.city) score += 25;
    return score;
  }

  private static scoreOnlinePresence(data: RestaurantData): number {
    let score = 0;
    if (data.google_my_business_url) score += 40;
    if (data.facebook_url) score += 20;
    if (data.instagram_url) score += 20;
    if (data.tiktok_url) score += 20;
    return score;
  }

  private static scoreBusinessDetails(data: RestaurantData): number {
    let score = 0;
    if (data.opening_hours) score += 25;
    if (data.price_range) score += 25;
    if (data.cuisine_types && data.cuisine_types.length > 0) score += 25;
    if (data.specialties && data.specialties.length > 0) score += 25;
    return score;
  }

  private static scoreMarketingData(data: RestaurantData): number {
    let score = 0;
    if (data.target_audience && data.target_audience.length > 0) score += 30;
    if (data.unique_selling_points && data.unique_selling_points.length > 0) score += 30;
    if (data.local_competitors && data.local_competitors.length > 0) score += 40;
    return score;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static calculateFreshnessScore(lastUpdated?: string): number {
    if (!lastUpdated) return 0;
    
    const now = new Date();
    const updated = new Date(lastUpdated);
    const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 7) return 100;
    if (daysDiff <= 30) return 80;
    if (daysDiff <= 90) return 60;
    if (daysDiff <= 180) return 40;
    return 20;
  }

  private static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 1000); // Limit length
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static containsPotentialPII(text: string): boolean {
    // Simple check for potential personal information patterns
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email pattern
    ];
    
    return piiPatterns.some(pattern => pattern.test(text));
  }
}