import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PersonaApiService, personaApi } from '../persona-api';

// Mock fetch
(global as any).fetch = jest.fn();

describe('PersonaApiService', () => {
  let service: PersonaApiService;

  beforeEach(() => {
    service = PersonaApiService.getInstance();
    service.enableMockMode(); // Ensure mock mode is enabled by default
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
    const mockBehavioralData = {
      pageViews: [
        { path: '/pricing', timestamp: Date.now() - 1000, duration: 5000 },
        { path: '/features', timestamp: Date.now() - 2000, duration: 3000 }
      ],
      clickEvents: [
        { element: 'pricing-button', timestamp: Date.now() - 500 },
        { element: 'feature-comparison', timestamp: Date.now() - 1500 }
      ],
      scrollDepth: 0.8,
      timeOnSite: 15000,
      deviceInfo: {
        type: 'desktop',
        os: 'Windows',
        browser: 'Chrome'
      }
    };

    it('should detect price-conscious persona', async () => {
      const priceFocusedData = {
        ...mockBehavioralData,
        pageViews: [
          { path: '/pricing', timestamp: Date.now() - 1000, duration: 10000 },
          { path: '/pricing', timestamp: Date.now() - 2000, duration: 8000 }
        ],
        clickEvents: [
          { element: 'pricing-button', timestamp: Date.now() - 500 },
          { element: 'price-comparison', timestamp: Date.now() - 1000 }
        ]
      };

      const result = await service.detectPersona(priceFocusedData);

      expect(result.success).toBe(true);
      expect(result.persona).toBe('price-conscious');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.traits).toContain('price-focused');
    });
  });
});