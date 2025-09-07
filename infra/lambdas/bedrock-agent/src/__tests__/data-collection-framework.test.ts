/**
 * Tests for Data Collection Framework
 */

import { DataCollectionFramework, RestaurantData, UserContext } from '../data-collection-framework';

describe('DataCollectionFramework', () => {
  const sampleRestaurantData: RestaurantData = {
    business_name: 'Zur Alten Post',
    main_category: 'Restaurant',
    address: {
      street: 'Hauptstraße 123',
      city: 'München',
      postal_code: '80331',
      country: 'Deutschland'
    },
    phone: '+49 89 123456',
    website_url: 'https://zur-alten-post.de',
    google_my_business_url: 'https://goo.gl/maps/example',
    cuisine_types: ['Deutsch', 'Bayerisch'],
    last_updated: new Date().toISOString()
  };

  const sampleUserContext: UserContext = {
    user_id: 'test-user-123',
    persona_type: 'Solo-Sarah',
    language_preference: 'de',
    experience_level: 'beginner',
    primary_goals: ['improve_visibility'],
    time_availability: 'limited'
  };

  describe('calculateDataQuality', () => {
    it('should calculate high quality score for complete data', () => {
      const qualityScore = DataCollectionFramework.calculateDataQuality(sampleRestaurantData);
      
      expect(qualityScore.overall_score).toBeGreaterThan(70);
      expect(qualityScore.confidence_level).toBe('high');
      expect(qualityScore.missing_critical_fields).toHaveLength(0);
    });

    it('should identify missing critical fields', () => {
      const incompleteData: RestaurantData = {
        business_name: 'Test Restaurant'
        // Missing main_category and address.city
      };
      
      const qualityScore = DataCollectionFramework.calculateDataQuality(incompleteData);
      
      expect(qualityScore.missing_critical_fields).toContain('main_category');
      expect(qualityScore.missing_critical_fields).toContain('address.city');
      expect(qualityScore.confidence_level).toBe('low');
    });

    it('should score different categories correctly', () => {
      const qualityScore = DataCollectionFramework.calculateDataQuality(sampleRestaurantData);
      
      expect(qualityScore.category_scores.basic_info).toBeGreaterThan(80);
      expect(qualityScore.category_scores.contact_details).toBeGreaterThan(70);
      expect(qualityScore.category_scores.online_presence).toBeGreaterThan(60);
    });
  });

  describe('getPrioritizedMissingFields', () => {
    it('should prioritize fields based on persona relevance', () => {
      const incompleteData: RestaurantData = {
        business_name: 'Test Restaurant'
        // Missing many fields
      };
      
      const missingFields = DataCollectionFramework.getPrioritizedMissingFields(
        incompleteData,
        sampleUserContext
      );
      
      expect(missingFields.length).toBeGreaterThan(0);
      expect(missingFields[0].priority).toBe('critical');
      
      // Should be sorted by relevance to Solo-Sarah persona
      const firstField = missingFields[0];
      expect(firstField.persona_relevance['Solo-Sarah']).toBeDefined();
    });

    it('should adapt priorities for different personas', () => {
      const profiContext: UserContext = {
        ...sampleUserContext,
        persona_type: 'Wachstums-Walter'
      };
      
      const incompleteData: RestaurantData = {
        business_name: 'Test Restaurant'
      };
      
      const missingFieldsProfi = DataCollectionFramework.getPrioritizedMissingFields(
        incompleteData,
        profiContext
      );
      
      const missingFieldsSarah = DataCollectionFramework.getPrioritizedMissingFields(
        incompleteData,
        sampleUserContext
      );
      
      // Different personas should have different prioritization
      expect(missingFieldsProfi[0].field_name).not.toBe(missingFieldsSarah[0].field_name);
    });
  });

  describe('validateAndSanitize', () => {
    it('should sanitize text fields', () => {
      const dirtyData: RestaurantData = {
        business_name: '  <script>alert("xss")</script>Zur Alten Post  ',
        website_url: 'https://example.com',
        email: 'test@example.com'
      };
      
      const result = DataCollectionFramework.validateAndSanitize(dirtyData);
      
      expect(result.sanitized_data.business_name).toBe('Zur Alten Post');
      expect(result.sanitized_data.business_name).not.toContain('<script>');
      expect(result.validation_errors).toHaveLength(0);
    });

    it('should validate URLs', () => {
      const invalidData: RestaurantData = {
        business_name: 'Test Restaurant',
        website_url: 'not-a-valid-url',
        google_my_business_url: 'also-invalid'
      };
      
      const result = DataCollectionFramework.validateAndSanitize(invalidData);
      
      expect(result.validation_errors.length).toBeGreaterThan(0);
      expect(result.validation_errors.some(error => error.includes('Invalid URL'))).toBe(true);
    });

    it('should validate email format', () => {
      const invalidEmailData: RestaurantData = {
        business_name: 'Test Restaurant',
        email: 'not-an-email'
      };
      
      const result = DataCollectionFramework.validateAndSanitize(invalidEmailData);
      
      expect(result.validation_errors).toContain('Invalid email format');
    });

    it('should detect potential PII', () => {
      const piiData: RestaurantData = {
        business_name: 'John Doe Restaurant 123-45-6789'
      };
      
      const result = DataCollectionFramework.validateAndSanitize(piiData);
      
      expect(result.security_warnings.length).toBeGreaterThan(0);
    });

    it('should validate coordinates', () => {
      const invalidCoordinatesData: RestaurantData = {
        business_name: 'Test Restaurant',
        address: {
          coordinates: {
            lat: 200, // Invalid latitude
            lng: -200 // Invalid longitude
          }
        }
      };
      
      const result = DataCollectionFramework.validateAndSanitize(invalidCoordinatesData);
      
      expect(result.validation_errors).toContain('Invalid coordinates');
    });
  });

  describe('getMinimumRequiredFields', () => {
    it('should return correct fields for visibility check', () => {
      const requiredFields = DataCollectionFramework.getMinimumRequiredFields('visibility_check');
      
      expect(requiredFields).toContain('business_name');
      expect(requiredFields).toContain('main_category');
      expect(requiredFields).toContain('address.city');
      expect(requiredFields).toContain('google_my_business_url');
    });

    it('should return correct fields for content generation', () => {
      const requiredFields = DataCollectionFramework.getMinimumRequiredFields('content_generation');
      
      expect(requiredFields).toContain('business_name');
      expect(requiredFields).toContain('main_category');
      expect(requiredFields).toContain('cuisine_types');
      expect(requiredFields).toContain('target_audience');
    });

    it('should return correct fields for strategic analysis', () => {
      const requiredFields = DataCollectionFramework.getMinimumRequiredFields('strategic_analysis');
      
      expect(requiredFields).toContain('business_name');
      expect(requiredFields).toContain('main_category');
      expect(requiredFields).toContain('address.city');
      expect(requiredFields).toContain('local_competitors');
      expect(requiredFields).toContain('target_audience');
    });
  });

  describe('data freshness scoring', () => {
    it('should give high score for recent data', () => {
      const recentData: RestaurantData = {
        ...sampleRestaurantData,
        last_updated: new Date().toISOString()
      };
      
      const qualityScore = DataCollectionFramework.calculateDataQuality(recentData);
      
      expect(qualityScore.data_freshness_score).toBe(100);
    });

    it('should give lower score for old data', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago
      
      const oldData: RestaurantData = {
        ...sampleRestaurantData,
        last_updated: oldDate.toISOString()
      };
      
      const qualityScore = DataCollectionFramework.calculateDataQuality(oldData);
      
      expect(qualityScore.data_freshness_score).toBeLessThan(80);
    });

    it('should give zero score for data without timestamp', () => {
      const noTimestampData: RestaurantData = {
        ...sampleRestaurantData,
        last_updated: undefined
      };
      
      const qualityScore = DataCollectionFramework.calculateDataQuality(noTimestampData);
      
      expect(qualityScore.data_freshness_score).toBe(0);
    });
  });
});