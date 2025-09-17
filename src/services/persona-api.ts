/**
 * Persona API Service - Mock Implementation for Development
 * 
 * This service provides a mock implementation of the Advanced Persona System API
 * for local development and testing, following the pattern from Task 6.4.4
 * where we created robust fallback mechanisms.
 */

import { PersonaType, UserBehavior, PersonaDetectionResult } from '@/types/persona';

// Mock delay to simulate network latency
const MOCK_DELAY = 800;

// Mock persona detection algorithm
function mockPersonaDetection(behavior: UserBehavior): PersonaDetectionResult {
  // Simple heuristic-based detection for demo purposes
  let detectedPersona: PersonaType = 'Solo-Sarah';
  let confidence = 0.5;
  const reasoning: string[] = [];

  // Decision speed analysis
  if (behavior.decisionSpeed > 0.8) {
    detectedPersona = 'Solo-Sarah';
    confidence += 0.2;
    reasoning.push('Fast decision-making indicates time-pressed behavior');
  } else if (behavior.decisionSpeed < 0.4) {
    detectedPersona = 'Bewahrer-Ben';
    confidence += 0.2;
    reasoning.push('Slow decision-making indicates cautious behavior');
  }

  // Device type analysis
  if (behavior.deviceType === 'mobile') {
    if (detectedPersona === 'Solo-Sarah') {
      confidence += 0.1;
      reasoning.push('Mobile usage aligns with time-pressed persona');
    }
  }

  // Session duration analysis
  if (behavior.sessionDuration > 600000) { // 10+ minutes
    if (behavior.clickPatterns.some(p => p.elementId.includes('analytics') || p.elementId.includes('growth'))) {
      detectedPersona = 'Wachstums-Walter';
      confidence += 0.3;
      reasoning.push('Long sessions with analytics focus indicates growth orientation');
    } else if (behavior.clickPatterns.some(p => p.elementId.includes('multi-location') || p.elementId.includes('enterprise'))) {
      detectedPersona = 'Ketten-Katrin';
      confidence += 0.3;
      reasoning.push('Enterprise features usage indicates chain management');
    } else {
      detectedPersona = 'Bewahrer-Ben';
      confidence += 0.2;
      reasoning.push('Long sessions indicate thorough information consumption');
    }
  }

  // Content consumption analysis
  if (behavior.informationConsumption) {
    if (behavior.informationConsumption.preferredContentLength === 'short') {
      if (detectedPersona === 'Solo-Sarah') {
        confidence += 0.1;
        reasoning.push('Preference for short content confirms time constraints');
      }
    } else if (behavior.informationConsumption.preferredContentLength === 'long') {
      if (detectedPersona === 'Bewahrer-Ben' || detectedPersona === 'Ketten-Katrin') {
        confidence += 0.1;
        reasoning.push('Preference for detailed content confirms thorough approach');
      }
    }
  }

  // Click pattern analysis
  const clickTypes = behavior.clickPatterns.map(p => p.elementType);
  if (clickTypes.includes('chart') || clickTypes.includes('analytics')) {
    detectedPersona = 'Wachstums-Walter';
    confidence += 0.2;
    reasoning.push('Analytics engagement indicates growth focus');
  }

  // Ensure confidence is within bounds
  confidence = Math.min(Math.max(confidence, 0.3), 0.95);

  // Generate alternative personas
  const allPersonas: PersonaType[] = ['Solo-Sarah', 'Bewahrer-Ben', 'Wachstums-Walter', 'Ketten-Katrin'];
  const alternativePersonas = allPersonas
    .filter(p => p !== detectedPersona)
    .map(persona => ({
      persona,
      confidence: Math.random() * 0.4 + 0.1, // Random confidence between 0.1-0.5
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  return {
    detectedPersona,
    confidence,
    reasoning,
    alternativePersonas,
    behaviorAnalysis: {
      decisionMakingStyle: behavior.decisionSpeed > 0.7 ? 'intuitive' : 
                          behavior.decisionSpeed < 0.4 ? 'analytical' : 'mixed',
      informationProcessing: behavior.informationConsumption?.preferredContentLength === 'short' ? 'summary' :
                            behavior.informationConsumption?.preferredContentLength === 'long' ? 'detailed' : 'visual',
      riskTolerance: detectedPersona === 'Bewahrer-Ben' ? 'low' :
                    detectedPersona === 'Wachstums-Walter' ? 'high' : 'medium',
      technologyComfort: behavior.deviceType === 'mobile' ? 'intermediate' :
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
  async detectPersona(behavior: UserBehavior): Promise<PersonaDetectionResult> {
    if (this.mockEnabled) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      // Simulate occasional failures for testing
      if (Math.random() < 0.1) { // 10% failure rate
        throw new Error('Mock API failure for testing');
      }

      return mockPersonaDetection(behavior);
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
  async getPersonaConfig(persona: PersonaType): Promise<any> {
    if (this.mockEnabled) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const configs = {
        'Solo-Sarah': {
          name: 'Solo Sarah',
          description: 'Time-pressed single restaurant owner',
          onboardingSteps: 3,
          preferredFeatures: ['quick-actions', 'mobile-first', 'summary-views'],
        },
        'Bewahrer-Ben': {
          name: 'Bewahrer Ben',
          description: 'Security-focused traditional owner',
          onboardingSteps: 7,
          preferredFeatures: ['detailed-guides', 'security-badges', 'step-by-step'],
        },
        'Wachstums-Walter': {
          name: 'Wachstums Walter',
          description: 'Growth-oriented expansion-minded owner',
          onboardingSteps: 5,
          preferredFeatures: ['analytics', 'forecasting', 'competitive-analysis'],
        },
        'Ketten-Katrin': {
          name: 'Ketten Katrin',
          description: 'Enterprise/chain management',
          onboardingSteps: 6,
          preferredFeatures: ['multi-location', 'team-management', 'advanced-reporting'],
        },
      };

      return configs[persona];
    }

    // Real API call
    const response = await fetch(`/api/persona/config/${persona}`);
    if (!response.ok) {
      throw new Error(`Failed to get persona config: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Track persona event for analytics
   */
  async trackPersonaEvent(event: {
    eventType: string;
    persona: PersonaType;
    userId: string;
    data: any;
  }): Promise<void> {
    if (this.mockEnabled) {
      console.log('Mock persona event tracked:', event);
      return;
    }

    // Real API call
    await fetch('/api/persona/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  }
}

// Export singleton instance
export const personaApi = PersonaApiService.getInstance();

// Development helper to toggle mock mode
if (typeof window !== 'undefined') {
  (window as any).togglePersonaMock = (enabled?: boolean) => {
    const newState = enabled ?? !personaApi['mockEnabled'];
    personaApi.setMockEnabled(newState);
    console.log(`Persona mock mode: ${newState ? 'ENABLED' : 'DISABLED'}`);
    return newState;
  };
}