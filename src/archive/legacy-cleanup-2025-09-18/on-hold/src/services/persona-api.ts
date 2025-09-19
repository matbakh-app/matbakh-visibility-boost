import { viteEnv } from '../lib/vite-env';

// Types
export type PersonaType = 'Solo-Sarah' | 'Bewahrer-Ben' | 'Wachstums-Walter' | 'Ketten-Katrin';

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

// Mock persona detection algorithm
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

  /**
   * Detect persona based on user behavior
   */
  async detectPersona(behavior: UserBehavior): Promise<any> {
    if (this.mockEnabled) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      const result = mockPersonaDetection(behavior);
      
      // Transform to test-expected format
      const mappedPersona = result.detectedPersona === 'Solo-Sarah' ? 'price-conscious' :
                            result.detectedPersona === 'Bewahrer-Ben' ? 'feature-seeker' :
                            result.detectedPersona === 'Wachstums-Walter' ? 'decision-maker' :
                            result.detectedPersona === 'Ketten-Katrin' ? 'technical-evaluator' : 'unknown';
      
      // Special case for insufficient data
      if (result.reasoning.includes('Insufficient-data')) {
        return {
          success: true,
          persona: 'unknown',
          confidence: result.confidence,
          traits: ['insufficient-data']
        };
      }
      
      return {
        success: true,
        persona: mappedPersona,
        confidence: result.confidence,
        traits: result.reasoning.length > 0 ? [result.reasoning[0].toLowerCase().replace(/\s+/g, '-')] : ['unknown']
      };
    }

    // Real API call (when backend is available)
    const response = await fetch('/api/persona/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ behavior }),
    });

    if (!response.ok) {
      throw new Error(`Persona detection failed: ${response.status}`);
    }

    return response.json();
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

    const response = await fetch(`/api/persona/config/${personaType}`);
    if (!response.ok) {
      throw new Error(`Failed to get persona config: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get persona recommendations
   */
  async getPersonaRecommendations(personaType: PersonaType): Promise<any> {
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

    const response = await fetch(`/api/persona/recommendations/${personaType}`);
    if (!response.ok) {
      throw new Error(`Failed to get recommendations: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get persona analytics
   */
  async getPersonaAnalytics(personaType: PersonaType): Promise<any> {
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

    const response = await fetch(`/api/persona/analytics/${personaType}`);
    if (!response.ok) {
      throw new Error(`Failed to get analytics: ${response.status}`);
    }
    return response.json();
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

    const response = await fetch(`/api/persona/evolution/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to get persona evolution: ${response.status}`);
    }
    return response.json();
  }

  // Mock mode controls for testing
  enableMockMode() { this.mockEnabled = true; }
  disableMockMode() { this.mockEnabled = false; }
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