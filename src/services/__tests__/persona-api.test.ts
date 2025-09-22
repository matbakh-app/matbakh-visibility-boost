import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PersonaApiService, personaApi } from '../persona-api';

// Mock fetch
(global as any).fetch = jest.fn();

describe('PersonaApiService', () => {
  let service: PersonaApiService;

  beforeEach(() => {
    service = PersonaApiService.getInstance();
    service.enableMockMode();
    jest.clearAllMocks();
    ((global as any).fetch as jest.Mock).mockClear();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PersonaApiService.getInstance();
      const instance2 = PersonaApiService.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(personaApi);
    });
  });

  describe('Persona Detection', () => {
    it('should detect price-conscious persona', async () => {
      const priceFocusedData = {
        pageViews: [
          { path: '/pricing', timestamp: Date.now() - 1000, duration: 10000 },
          { path: '/pricing', timestamp: Date.now() - 2000, duration: 8000 }
        ],
        clickEvents: [
          { element: 'pricing-button', timestamp: Date.now() - 500 },
          { element: 'price-comparison', timestamp: Date.now() - 1000 }
        ],
        scrollDepth: 0.8,
        timeOnSite: 15000,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(priceFocusedData);

      expect(result.success).toBe(true);
      expect(result.persona).toBe('price-conscious');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.traits).toContain('price-focused');
    });

    it('should detect feature-seeker persona', async () => {
      const featureFocusedData = {
        pageViews: [
          { path: '/features', timestamp: Date.now() - 1000, duration: 12000 },
          { path: '/integrations', timestamp: Date.now() - 2000, duration: 8000 },
          { path: '/features/advanced', timestamp: Date.now() - 3000, duration: 6000 }
        ],
        clickEvents: [
          { element: 'feature-details', timestamp: Date.now() - 500 },
          { element: 'integration-guide', timestamp: Date.now() - 1000 }
        ],
        scrollDepth: 0.8,
        timeOnSite: 15000,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(featureFocusedData);

      expect(result.success).toBe(true);
      expect(result.persona).toBe('feature-seeker');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.traits).toContain('feature-focused');
    });

    it('should detect decision-maker persona', async () => {
      const decisionMakerData = {
        pageViews: [
          { path: '/analytics', timestamp: Date.now() - 1000, duration: 8000 },
          { path: '/dashboard', timestamp: Date.now() - 2000, duration: 6000 },
          { path: '/roi-calculator', timestamp: Date.now() - 3000, duration: 4000 }
        ],
        clickEvents: [
          { element: 'analytics-demo', timestamp: Date.now() - 500 },
          { element: 'dashboard-preview', timestamp: Date.now() - 1000 }
        ],
        scrollDepth: 0.9,
        timeOnSite: 25000,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(decisionMakerData);

      expect(result.success).toBe(true);
      expect(result.persona).toBe('decision-maker');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.traits).toContain('ready-to-buy');
    });

    it('should detect technical-evaluator persona', async () => {
      const technicalData = {
        pageViews: [
          { path: '/api-docs', timestamp: Date.now() - 1000, duration: 15000 },
          { path: '/technical-specs', timestamp: Date.now() - 2000, duration: 12000 },
          { path: '/enterprise-features', timestamp: Date.now() - 3000, duration: 8000 }
        ],
        clickEvents: [
          { element: 'api-reference', timestamp: Date.now() - 500 },
          { element: 'technical-documentation', timestamp: Date.now() - 1000 }
        ],
        scrollDepth: 0.8,
        timeOnSite: 20000,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(technicalData);

      expect(result.success).toBe(true);
      expect(result.persona).toBe('technical-evaluator');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.traits).toContain('technical-focused');
    });

    it('should handle insufficient data gracefully', async () => {
      const minimalData = {
        pageViews: [{ path: '/', timestamp: Date.now(), duration: 1000 }],
        clickEvents: [],
        scrollDepth: 0.2,
        timeOnSite: 2000,
        deviceInfo: { type: 'mobile', os: 'iOS', browser: 'Safari' }
      };

      const result = await service.detectPersona(minimalData);

      expect(result.success).toBe(true);
      expect(result.persona).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Persona Recommendations', () => {
    it('should provide price-conscious recommendations', async () => {
      const recommendations = await service.getPersonaRecommendations('price-conscious');
      expect(recommendations.success).toBe(true);
      expect(recommendations.recommendations).toContain('Show pricing upfront');
      expect(recommendations.recommendations).toContain('Highlight cost savings');
      expect(recommendations.recommendations).toContain('Offer free trial');
    });

    it('should provide feature-seeker recommendations', async () => {
      const recommendations = await service.getPersonaRecommendations('feature-seeker');
      expect(recommendations.success).toBe(true);
      expect(recommendations.recommendations).toContain('Showcase key features');
      expect(recommendations.recommendations).toContain('Provide feature comparisons');
      expect(recommendations.recommendations).toContain('Offer product demos');
    });

    it('should provide decision-maker recommendations', async () => {
      const recommendations = await service.getPersonaRecommendations('decision-maker');
      expect(recommendations.success).toBe(true);
      expect(recommendations.recommendations).toContain('Show social proof');
      expect(recommendations.recommendations).toContain('Provide case studies');
      expect(recommendations.recommendations).toContain('Offer direct contact');
    });

    it('should provide technical-evaluator recommendations', async () => {
      const recommendations = await service.getPersonaRecommendations('technical-evaluator');
      expect(recommendations.success).toBe(true);
      expect(recommendations.recommendations).toContain('Provide technical documentation');
      expect(recommendations.recommendations).toContain('Show API examples');
      expect(recommendations.recommendations).toContain('Highlight security features');
    });
  });

  describe('Persona Analytics', () => {
    it('should track persona distribution', async () => {
      const analytics = await service.getPersonaAnalytics();
      expect(analytics.success).toBe(true);
      expect(analytics.data).toHaveProperty('distribution');
      expect(analytics.data.distribution).toHaveProperty('price-conscious');
      expect(analytics.data.distribution).toHaveProperty('feature-seeker');
      expect(analytics.data.distribution).toHaveProperty('decision-maker');
      expect(analytics.data.distribution).toHaveProperty('technical-evaluator');
    });

    it('should provide conversion rates by persona', async () => {
      const analytics = await service.getPersonaAnalytics();
      expect(analytics.success).toBe(true);
      expect(analytics.data).toHaveProperty('conversionRates');
      expect(analytics.data.conversionRates['decision-maker']).toBeGreaterThan(
        analytics.data.conversionRates['price-conscious']
      );
    });

    it('should track persona evolution over time', async () => {
      const userId = 'user-123';
      const evolution = await service.getPersonaEvolution(userId);
      expect(evolution.success).toBe(true);
      expect(evolution.data).toHaveProperty('timeline');
      expect(evolution.data.timeline).toBeInstanceOf(Array);
    });
  });

  describe('Mock Mode', () => {
    it('should work in mock mode when enabled', async () => {
      service.enableMockMode();
      const mockData = {
        pageViews: [{ path: '/pricing', timestamp: Date.now(), duration: 5000 }],
        clickEvents: [],
        scrollDepth: 0.5,
        timeOnSite: 5000,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(mockData);
      expect(result.success).toBe(true);
      expect(['price-conscious', 'feature-seeker', 'decision-maker', 'technical-evaluator'])
        .toContain(result.persona);
    });

    it('should use real API when mock mode is disabled', async () => {
      service.disableMockMode();
      ((global as any).fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          persona: 'price-conscious',
          confidence: 0.85,
          traits: ['price-focused', 'comparison-shopper']
        })
      });

      const mockData = {
        pageViews: [{ path: '/pricing', timestamp: Date.now(), duration: 5000 }],
        clickEvents: [],
        scrollDepth: 0.5,
        timeOnSite: 5000,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(mockData);
      expect(result.success).toBe(true);
      expect(result.persona).toBe('price-conscious');
      expect((global as any).fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/persona/detect'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      service.enableMockMode();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      service.disableMockMode();
      ((global as any).fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      const mockData = {
        pageViews: [],
        clickEvents: [],
        scrollDepth: 0,
        timeOnSite: 0,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(mockData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal server error');
      service.enableMockMode();
    });

    it('should handle network errors', async () => {
      service.disableMockMode();
      ((global as any).fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const mockData = {
        pageViews: [],
        clickEvents: [],
        scrollDepth: 0,
        timeOnSite: 0,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(mockData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      service.enableMockMode();
    });

    it('should validate input data', async () => {
      const invalidData = {
        pageViews: null,
        clickEvents: undefined
      };

      const result = await service.detectPersona(invalidData as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid behavioral data');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full persona workflow', async () => {
      const behavioralData = {
        pageViews: [
          { path: '/pricing', timestamp: Date.now() - 1000, duration: 8000 }
        ],
        clickEvents: [
          { element: 'pricing-button', timestamp: Date.now() - 500 }
        ],
        scrollDepth: 0.9,
        timeOnSite: 12000,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const detectionResult = await service.detectPersona(behavioralData);
      expect(detectionResult.success).toBe(true);

      const recommendationsResult = await service.getPersonaRecommendations(detectionResult.persona);
      expect(recommendationsResult.success).toBe(true);
      expect(recommendationsResult.recommendations.length).toBeGreaterThan(0);

      const analyticsResult = await service.getPersonaAnalytics();
      expect(analyticsResult.success).toBe(true);
      expect(analyticsResult.data.distribution).toBeDefined();
    });
  });
});
