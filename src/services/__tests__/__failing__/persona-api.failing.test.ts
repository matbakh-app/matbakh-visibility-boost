import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PersonaApiService, personaApi } from '../persona-api';

// Mock fetch
(global as any).fetch = require('jest').fn();

describe('PersonaApiService - Failing Tests', () => {
  let service: PersonaApiService;

  beforeEach(() => {
    service = PersonaApiService.getInstance();
    service.enableMockMode(); // Ensure mock mode is enabled by default
    service.resetForTests(); // Reset any internal state
    require('jest').clearAllMocks();
    ((global as any).fetch as any).mockClear();
  });

  describe('Complex Persona Detection', () => {
    it('should detect feature-seeker persona with complex data', async () => {
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

    it('should detect decision-maker persona with analytics focus', async () => {
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

    it('should detect technical-evaluator persona with API focus', async () => {
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
  });

  describe('Mock Mode Switching', () => {
    it('should use real API when mock mode is disabled', async () => {
      service.disableMockMode();

      // Mock successful API response
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

      // Re-enable mock mode for other tests
      service.enableMockMode();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Ensure clean state for error handling tests
      jest.clearAllMocks();
      ((global as any).fetch as jest.Mock).mockClear();
      service.resetForTests();
    });

    afterEach(() => {
      // Always restore mock mode after error tests
      service.enableMockMode();
      jest.clearAllMocks();
    });

    it('should handle API errors gracefully', async () => {
      // Disable mock mode for this specific test
      service.disableMockMode();

      // Setup fetch mock for API error scenario
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
      
      // Verify structured error response (not thrown exception)
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Internal server error');
    });

    it('should handle network errors', async () => {
      // Disable mock mode for this specific test
      service.disableMockMode();

      // Setup fetch mock for network error scenario
      ((global as any).fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const mockData = {
        pageViews: [],
        clickEvents: [],
        scrollDepth: 0,
        timeOnSite: 0,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(mockData);
      
      // Verify structured error response (not thrown exception)
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Network error');
    });

    it('should validate input data', async () => {
      // This test uses mock mode (default)
      const invalidData = {
        // Missing required fields
        pageViews: null,
        clickEvents: undefined
      };

      const result = await service.detectPersona(invalidData as any);
      
      // Verify structured error response
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid behavioral data');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full persona workflow', async () => {
      // 1. Detect persona
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

      // 2. Get recommendations for detected persona
      const recommendationsResult = await service.getPersonaRecommendations(detectionResult.persona);
      expect(recommendationsResult.success).toBe(true);
      expect(recommendationsResult.recommendations.length).toBeGreaterThan(0);

      // 3. Track persona analytics
      const analyticsResult = await service.getPersonaAnalytics();
      expect(analyticsResult.success).toBe(true);
      expect(analyticsResult.data.distribution).toBeDefined();
    });
  });
});