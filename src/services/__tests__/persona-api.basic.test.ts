import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PersonaApiService, personaApi } from '../persona-api';

// Globale fetch-Attrappe für alle Tests
(global as any).fetch = jest.fn();

describe('PersonaApiService - Basic Suite', () => {
  let service: PersonaApiService;

  beforeEach(() => {
    service = PersonaApiService.getInstance();
    service.enableMockMode();          // Standard: Mock-Mode an
    service.resetForTests();           // internen Zustand säubern
    jest.clearAllMocks();
    ((global as any).fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    service.enableMockMode();          // immer in den Mock-Mode zurück
  });

  // 1) Singleton
  it('returns the same singleton instance', () => {
    const i1 = PersonaApiService.getInstance();
    const i2 = PersonaApiService.getInstance();
    expect(i1).toBe(i2);
    expect(i1).toBe(personaApi);
  });

  // 2) Detection - price-conscious (nur ein Positivfall aus der einfachen Suite)
  it('detects price-conscious with sufficient price signals', async () => {
    const data = {
      pageViews: [
        { path: '/pricing', timestamp: Date.now() - 1000, duration: 10000 },
        { path: '/pricing', timestamp: Date.now() - 2000, duration: 8000 },
      ],
      clickEvents: [
        { element: 'pricing-button', timestamp: Date.now() - 500 },
        { element: 'price-comparison', timestamp: Date.now() - 1000 },
      ],
      scrollDepth: 0.8,
      timeOnSite: 15000,
      deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' },
    };

    const res = await service.detectPersona(data);
    expect(res.success).toBe(true);
    // @ts-expect-error narrow
    expect(res.persona).toBe('price-conscious');
    // @ts-expect-error narrow
    expect(res.confidence).toBeGreaterThanOrEqual(0.7);
    // @ts-expect-error narrow
    expect(res.traits).toContain('price-focused');
  });

  // 3) Detection - unknown (insufficient data)
  it('returns unknown for insufficient data', async () => {
    const minimal = {
      pageViews: [{ path: '/', timestamp: Date.now(), duration: 1000 }],
      clickEvents: [],
      scrollDepth: 0.2,
      timeOnSite: 2000,
      deviceInfo: { type: 'mobile', os: 'iOS', browser: 'Safari' },
    };

    const res = await service.detectPersona(minimal);
    expect(res.success).toBe(true);
    // @ts-expect-error narrow
    expect(res.persona).toBe('unknown');
    // @ts-expect-error narrow
    expect(res.confidence).toBeLessThan(0.5);
  });

  // 4) Recommendations - price-conscious
  it('provides price-conscious recommendations', async () => {
    const r = await service.getPersonaRecommendations('price-conscious');
    expect(r.success).toBe(true);
    expect(r.recommendations).toEqual(expect.arrayContaining([
      'Show pricing upfront', 
      'Highlight cost savings', 
      'Offer free trial'
    ]));
  });

  // 5) Recommendations - feature-seeker
  it('provides feature-seeker recommendations', async () => {
    const r = await service.getPersonaRecommendations('feature-seeker');
    expect(r.success).toBe(true);
    expect(r.recommendations).toEqual(expect.arrayContaining([
      'Showcase key features', 
      'Provide feature comparisons', 
      'Offer product demos'
    ]));
  });

  // 6) Analytics - distribution
  it('exposes analytics distribution keys', async () => {
    const a = await service.getPersonaAnalytics();
    expect(a.success).toBe(true);
    expect(a.data).toHaveProperty('distribution');
    expect(a.data.distribution).toMatchObject({
      'price-conscious': expect.any(Number),
      'feature-seeker': expect.any(Number),
      'decision-maker': expect.any(Number),
      'technical-evaluator': expect.any(Number),
    });
  });

  // 7) Analytics - conversionRates monotonic expectation
  it('has higher conversion for decision-maker than price-conscious', async () => {
    const a = await service.getPersonaAnalytics();
    expect(a.success).toBe(true);
    expect(a.data.conversionRates['decision-maker']).toBeGreaterThan(
      a.data.conversionRates['price-conscious']
    );
  });

  // 8) Mock mode sanity
  it('works in mock mode', async () => {
    service.enableMockMode();
    const data = {
      pageViews: [{ path: '/pricing', timestamp: Date.now(), duration: 5000 }],
      clickEvents: [],
      scrollDepth: 0.5,
      timeOnSite: 5000,
      deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' },
    };

    const res = await service.detectPersona(data);
    expect(res.success).toBe(true);
    // @ts-expect-error narrow
    expect(['price-conscious', 'feature-seeker', 'decision-maker', 'technical-evaluator', 'unknown']).toContain(res.persona);
  });
});