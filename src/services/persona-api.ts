import { viteEnv } from '../lib/vite-env';

// Types
export type PersonaType = 'Solo-Sarah' | 'Bewahrer-Ben' | 'Wachstums-Walter' | 'Ketten-Katrin';

type Persona = 'price-conscious' | 'feature-seeker' | 'decision-maker' | 'technical-evaluator' | 'unknown';

type PersonaSuccess = {
  success: true;
  persona: Persona;
  confidence: number;
  traits: string[];
};

type PersonaError = {
  success: false;
  error: string;
};

export type PersonaResult = PersonaSuccess | PersonaError;

export interface UserBehavior {
  pageViews?: Array<{ path: string; timestamp: number; duration: number }>;
  clickEvents?: Array<{ element: string; timestamp: number }>;
  scrollDepth?: number;
  timeOnSite?: number;
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
  };
}

export interface PersonaDetectionResult {
  detectedPersona: PersonaType;
  confidence: number;
  reasoning: string[];
  alternativePersonas: Array<{ persona: PersonaType; confidence: number }>;
  metadata: {
    analysisTimestamp: string;
    dataQuality: string;
    behaviorComplexity: string;
  };
  traits: {
    decisionMakingStyle: string;
    technologyComfort: string;
    timeAvailability: string;
  };
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
    implementation: string;
  }>;
}

// Mock delay to simulate network latency
const MOCK_DELAY = 100;

function validatePersonaInput(input: any): { ok: boolean; reason?: string } {
  if (!input || typeof input !== 'object') {
    return { ok: false, reason: 'Input must be an object' };
  }

  // Nur bei wirklich ungültigen Inputs (null/undefined arrays) einen Fehler werfen
  if (input.pageViews === null || input.clickEvents === null) {
    return { ok: false, reason: 'Invalid input data' };
  }

  return { ok: true };
}

// Flatten object to searchable string
function flattenStrings(obj: any): string {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map(flattenStrings).join(' ');
  if (typeof obj === 'object') {
    return Object.values(obj).map(flattenStrings).join(' ');
  }
  return '';
}

function localHeuristicDetect(input: any): PersonaResult {
  const hay = flattenStrings(input).toLowerCase();

  const score = { price: 0, feature: 0, decision: 0, tech: 0 };
  const bump = (cond: boolean, key: keyof typeof score, w = 1) => { if (cond) score[key] += w; };

  // price-conscious
  bump(/price|pricing|discount|coupon|budget|cost|\b€|\$/.test(hay), 'price', 2);
  bump(/quote|invoice|billing/.test(hay), 'price', 1);

  // feature-seeker
  bump(/feature|features|capabilities|compare|comparison/.test(hay), 'feature', 2);
  bump(/roadmap|release notes/.test(hay), 'feature', 1);

  // decision-maker
  bump(/book demo|schedule demo|start trial|start_trial|checkout|subscribe|purchase/.test(hay), 'decision', 2);
  bump(/\broi\b|\bkpi\b|stakeholder|case-studies|testimonials|contact/.test(hay), 'decision', 1);

  // technical-evaluator
  bump(/\bdocs?\b|documentation|api|sdk|integration|webhook|schema|ci\/cd/.test(hay), 'tech', 2);
  bump(/\btypescript\b|\bnode\b|\breact\b|\bgraphql\b|\brest\b/.test(hay), 'tech', 1);

  const total = score.price + score.feature + score.decision + score.tech;
  if (total === 0) {
    // „Insufficient data gracefully"
    return { success: true, persona: 'unknown', confidence: 0.3, traits: [] };
  }

  let persona: Persona = 'price-conscious';
  let best = score.price;
  if (score.feature > best) { best = score.feature; persona = 'feature-seeker'; }
  if (score.decision > best) { best = score.decision; persona = 'decision-maker'; }
  if (score.tech > best) { best = score.tech; persona = 'technical-evaluator'; }

  // Hohe Confidence bei klarer Dominanz
  const ratio = best / total; // 0..1
  const confidence = ratio >= 0.5 ? 0.8 : 0.75;

  const traits: string[] = [];
  if (persona === 'price-conscious') traits.push('price-focused');
  if (persona === 'feature-seeker') traits.push('feature-focused');
  if (persona === 'decision-maker') traits.push('ready-to-buy');
  if (persona === 'technical-evaluator') traits.push('technical-focused');

  return { success: true, persona, confidence, traits };
}

// Legacy deterministic mock persona detection (kept for compatibility)
function mockDetectPersona(input: any): PersonaResult {
  return localHeuristicDetect(input);
}

// Legacy mock persona detection algorithm (kept for compatibility)
function mockPersonaDetection(behavior: UserBehavior): PersonaDetectionResult {
  let detectedPersona: PersonaType = 'Solo-Sarah';
  let confidence = 0.5;
  const reasoning: string[] = [];

  // Analyze page views for persona indicators
  const pageViews = behavior.pageViews || [];
  const clickEvents = behavior.clickEvents || [];
  const timeOnSite = behavior.timeOnSite || 0;
  const deviceType = behavior.deviceInfo?.type || 'desktop';

  // Price-focused behavior
  const pricingPages = pageViews.filter(pv => pv.path.includes('pricing') || pv.path.includes('price'));
  const pricingClicks = clickEvents.filter(ce => ce.element.includes('pricing') || ce.element.includes('price'));
  
  if (pricingPages.length > 0 || pricingClicks.length > 0) {
    detectedPersona = 'Solo-Sarah'; // Maps to price-conscious
    confidence = 0.8;
    reasoning.push('Price-focused');
  }

  // Feature-focused behavior
  const featurePages = pageViews.filter(pv => 
    pv.path.includes('features') || pv.path.includes('integrations') || pv.path.includes('api'));
  const featureClicks = clickEvents.filter(ce => 
    ce.element.includes('feature') || ce.element.includes('integration'));
  
  if (featurePages.length > 1 || featureClicks.length > 0) {
    detectedPersona = 'Bewahrer-Ben'; // Maps to feature-seeker
    confidence = 0.8;
    reasoning.push('Feature-focused');
  }

  // Decision-maker behavior (analytics, ROI focus)
  const analyticsPages = pageViews.filter(pv => 
    pv.path.includes('analytics') || pv.path.includes('roi') || pv.path.includes('dashboard'));
  const analyticsClicks = clickEvents.filter(ce => 
    ce.element.includes('analytics') || ce.element.includes('roi') || ce.element.includes('dashboard'));
  
  if (analyticsPages.length > 0 || analyticsClicks.length > 0 || timeOnSite > 20000) {
    detectedPersona = 'Wachstums-Walter'; // Maps to decision-maker
    confidence = 0.9;
    reasoning.push('Ready-to-buy');
  }

  // Technical evaluator behavior
  const techPages = pageViews.filter(pv => 
    pv.path.includes('api') || pv.path.includes('technical') || pv.path.includes('enterprise'));
  const techClicks = clickEvents.filter(ce => 
    ce.element.includes('api') || ce.element.includes('technical') || ce.element.includes('enterprise'));
  
  if (techPages.length > 1 || techClicks.length > 0) {
    detectedPersona = 'Ketten-Katrin'; // Maps to technical-evaluator
    confidence = 0.8;
    reasoning.push('Technical-focused');
  }

  // Handle insufficient data - return unknown persona
  // Check for minimal data: very short session, minimal interaction
  const hasMinimalData = pageViews.length <= 1 && clickEvents.length === 0 && timeOnSite < 5000;
  
  if (pageViews.length === 0 && clickEvents.length === 0) {
    return {
      detectedPersona: 'Solo-Sarah', // Will be mapped to 'unknown' in the API response
      confidence: 0.3,
      reasoning: ['Insufficient-data'],
      alternativePersonas: [],
      metadata: {
        analysisTimestamp: new Date().toISOString(),
        dataQuality: 'low',
        behaviorComplexity: 'simple',
      },
      traits: {
        decisionMakingStyle: 'unknown',
        technologyComfort: 'unknown',
        timeAvailability: 'unknown',
      },
      recommendations: [],
    };
  }
  
  if (hasMinimalData) {
    return {
      detectedPersona: 'Solo-Sarah', // Will be mapped to 'unknown' in the API response
      confidence: 0.2,
      reasoning: ['Insufficient-data'],
      alternativePersonas: [],
      metadata: {
        analysisTimestamp: new Date().toISOString(),
        dataQuality: 'low',
        behaviorComplexity: 'simple',
      },
      traits: {
        decisionMakingStyle: 'unknown',
        technologyComfort: 'unknown',
        timeAvailability: 'unknown',
      },
      recommendations: [],
    };
  }

  // Ensure confidence is within bounds
  confidence = Math.min(Math.max(confidence, 0.3), 0.95);

  // Generate alternative personas
  const allPersonas: PersonaType[] = ['Solo-Sarah', 'Bewahrer-Ben', 'Wachstums-Walter', 'Ketten-Katrin'];
  const alternativePersonas = allPersonas
    .filter(p => p !== detectedPersona)
    .map(persona => ({
      persona,
      confidence: Math.max(0.1, confidence - 0.3 - Math.random() * 0.2),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  return {
    detectedPersona,
    confidence,
    reasoning,
    alternativePersonas,
    metadata: {
      analysisTimestamp: new Date().toISOString(),
      dataQuality: pageViews.length > 2 ? 'high' : pageViews.length > 0 ? 'medium' : 'low',
      behaviorComplexity: reasoning.length > 2 ? 'complex' : 'simple',
    },
    traits: {
      decisionMakingStyle: detectedPersona === 'Solo-Sarah' ? 'fast' :
                          detectedPersona === 'Bewahrer-Ben' ? 'cautious' :
                          detectedPersona === 'Wachstums-Walter' ? 'analytical' : 'systematic',
      technologyComfort: deviceType === 'mobile' ? 'intermediate' :
                        detectedPersona === 'Ketten-Katrin' ? 'advanced' : 'beginner',
      timeAvailability: detectedPersona === 'Solo-Sarah' ? 'limited' :
                       detectedPersona === 'Ketten-Katrin' ? 'flexible' : 'moderate',
    },
    recommendations: [
      {
        type: 'ui',
        title: 'Optimize Interface Layout',
        description: `Adapt UI for ${detectedPersona} preferences`,
        priority: 'high',
        implementation: 'Apply persona-specific styling and layout',
      },
      {
        type: 'content',
        title: 'Customize Content Length',
        description: 'Adjust content verbosity based on persona preferences',
        priority: 'medium',
        implementation: 'Use AdaptiveContent components',
      },
    ],
  };
}

/**
 * Mock Persona API Service
 */
export class PersonaApiService {
  private static instance: PersonaApiService;
  private mockEnabled = true;

  private constructor() {}

  static getInstance(): PersonaApiService {
    if (!PersonaApiService.instance) {
      PersonaApiService.instance = new PersonaApiService();
    }
    return PersonaApiService.instance;
  }

  /**
   * Enable or disable mock mode
   */
  setMockEnabled(enabled: boolean) {
    this.mockEnabled = enabled;
  }

  async detectPersona(behavior: UserBehavior): Promise<PersonaResult> {
    const validation = validatePersonaInput(behavior);
    if (!validation.ok) {
      return { success: false, error: 'Invalid behavioral data' };
    }

    // Mock-Mode → immer lokal
    if (this.mockEnabled) {
      await new Promise(res => setTimeout(res, MOCK_DELAY));
      return localHeuristicDetect(behavior);
    }

    try {
      const response = await fetch('/api/persona/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ behavior }),
      });

      if (!response.ok) {
        let errorMsg = `Persona detection failed: ${response.status}`;
        try {
          const data = await response.json();
          if (data && data.error) errorMsg = data.error;
        } catch {}
        return { success: false, error: errorMsg };
      }

      const data = await response.json();
      return { ...data, success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' };
    }
  }

  /**
   * Get persona configuration
   */
  async getPersonaConfig(personaType: PersonaType): Promise<any> {
    if (this.mockEnabled) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      return {
        success: true,
        config: {
          personaType,
          uiPreferences: {
            layout: personaType === 'Solo-Sarah' ? 'compact' : 'detailed',
            colorScheme: 'default',
            navigationStyle: 'sidebar'
          },
          contentPreferences: {
            verbosity: personaType === 'Bewahrer-Ben' ? 'detailed' : 'concise',
            technicalLevel: personaType === 'Ketten-Katrin' ? 'advanced' : 'basic'
          }
        }
      };
    }

    try {
      const response = await fetch(`/api/persona/config/${personaType}`);
      if (!response.ok) {
        return {
          success: false,
          error: 'API_ERROR',
          message: `HTTP ${response.status}`,
        };
      }
      return response.json();
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err?.message || 'Network error',
      };
    }
  }

  /**
   * Get persona recommendations
   */
  async getPersonaRecommendations(personaType: string): Promise<any> {
    if (this.mockEnabled) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      const recommendationMap = {
        'price-conscious': ['Show pricing upfront', 'Highlight cost savings', 'Offer free trial'],
        'feature-seeker': ['Showcase key features', 'Provide feature comparisons', 'Offer product demos'],
        'decision-maker': ['Show social proof', 'Provide case studies', 'Offer direct contact'],
        'technical-evaluator': ['Provide technical documentation', 'Show API examples', 'Highlight security features']
      };
      
      return {
        success: true,
        recommendations: recommendationMap[personaType as keyof typeof recommendationMap] || []
      };
    }

    try {
      const response = await fetch(`/api/persona/recommendations/${personaType}`);
      if (!response.ok) {
        return {
          success: false,
          error: 'API_ERROR',
          message: `HTTP ${response.status}`,
        };
      }
      return response.json();
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err?.message || 'Network error',
      };
    }
  }

  /**
   * Get persona analytics
   */
  async getPersonaAnalytics(): Promise<any> {
    if (this.mockEnabled) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      return {
        success: true,
        data: {
          distribution: {
            'price-conscious': 0.35,
            'feature-seeker': 0.25,
            'decision-maker': 0.25,
            'technical-evaluator': 0.15
          },
          conversionRates: {
            'price-conscious': 0.12,
            'feature-seeker': 0.18,
            'decision-maker': 0.28,
            'technical-evaluator': 0.22
          },
          timeline: [
            { date: '2024-01-01', persona: 'price-conscious', count: 10 },
            { date: '2024-01-02', persona: 'feature-seeker', count: 8 }
          ]
        }
      };
    }

    try {
      const response = await fetch('/api/persona/analytics');
      if (!response.ok) {
        return {
          success: false,
          error: 'API_ERROR',
          message: `HTTP ${response.status}`,
        };
      }
      return response.json();
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err?.message || 'Network error',
      };
    }
  }

  /**
   * Get persona evolution data
   */
  async getPersonaEvolution(userId: string): Promise<any> {
    if (this.mockEnabled) {
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      return {
        success: true,
        data: {
          timeline: [
            { date: '2024-01-01', persona: 'price-conscious' },
            { date: '2024-01-15', persona: 'feature-seeker' }
          ],
          currentPersona: 'feature-seeker',
          previousPersonas: ['price-conscious'],
          confidence: 0.8,
          lastUpdated: new Date().toISOString()
        }
      };
    }

    try {
      const response = await fetch(`/api/persona/evolution/${userId}`);
      if (!response.ok) {
        return {
          success: false,
          error: 'API_ERROR',
          message: `HTTP ${response.status}`,
        };
      }
      return response.json();
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err?.message || 'Network error',
      };
    }
  }

  // Mock mode controls for testing
  enableMockMode() { this.mockEnabled = true; }
  disableMockMode() { this.mockEnabled = false; }
  
  // Test helper for resetting state
  resetForTests() {
    this.mockEnabled = true;
  }
}

// Export singleton instance for backward compatibility
export const personaApi = PersonaApiService.getInstance();

// Export default instance
export default PersonaApiService.getInstance();

// Helper function for state management
export const createPersonaState = (initialPersona?: PersonaType) => {
  return (state: any) => {
    const newState = { ...state };
    if (initialPersona) {
      newState.currentPersona = initialPersona;
    }
    return newState;
  };
};