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

  describe('Mock Mode Operations', () => {
    it('should work consistently in mock mode', async () => {
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

    it('should fallback to mock mode when real API is unavailable', async () => {
      service.disableMockMode();

      const mockData = {
        pageViews: [{ path: '/pricing', timestamp: Date.now(), duration: 5000 }],
        clickEvents: [{ element: 'pricing-button', timestamp: Date.now() - 500 }],
        scrollDepth: 0.8,
        timeOnSite: 8000,
        deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' }
      };

      const result = await service.detectPersona(mockData);

      expect(result.success).toBe(true);
      expect(result.persona).toBe('price-conscious');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.detectionMethod).toBe('fallback-mock');
      
      service.enableMockMode();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input data gracefully', async () => {
      service.enableMockMode();

      const invalidData = {
        pageViews: null,
        clickEvents: undefined
      };

      const result = await service.detectPersona(invalidData as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid behavioral data');
    });
  });
});
