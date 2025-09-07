/**
 * Integration layer between Bedrock AI Core and KI-gestütztes Onboarding
 * Connects persona detection with the existing onboarding flow
 */

import {
  BusinessPersona,
  UserPersona,
  PersonaMapper,
  AdaptiveQuestioningSystem
} from './persona-templates';
import {
  PersonaDetectionEngine,
  PersonaDetectionResult,
  UserBehaviorPattern
} from './persona-detection-engine';
import {
  PersonaSwitchingManager,
  PersonaSwitchDecision
} from './persona-switching-manager';

/**
 * Onboarding event data structure
 */
export interface OnboardingEvent {
  type: 'onb_start' | 'persona_assigned' | 'consent_granted' | 'vc_started' | 'vc_result_ready' | 'onb_complete' | 'handover_booked';
  timestamp: string;
  userId: string;
  payload: Record<string, any>;
}

/**
 * 5-Fragen-Heuristik responses from onboarding
 */
export interface OnboardingHeuristicResponses {
  standorte: '1' | '2-4' | '5+' | 'franchise';
  marketingReife: 'anfaenger' | 'fortgeschritten' | 'profi' | 'agentur';
  hauptziel: 'mehr_gaeste' | 'effizienz' | 'expansion' | 'datenanalyse';
  teamgroesse: 'solo' | '2-10' | '11-50' | '50+';
  budget: '<100' | '100-500' | '500-2000' | 'enterprise';
}

/**
 * Onboarding persona integration result
 */
export interface OnboardingPersonaResult {
  detectedPersona: PersonaDetectionResult;
  onboardingFlow: {
    flowType: 'solo-sarah' | 'bewahrer-ben' | 'wachstums-walter' | 'ketten-katrin';
    estimatedDuration: number; // in minutes
    requiredSteps: string[];
    optionalSteps: string[];
    timeToValue: number; // in minutes
  };
  adaptations: {
    uiComplexity: 'minimal' | 'standard' | 'advanced' | 'enterprise';
    guidanceLevel: 'high' | 'medium' | 'low' | 'none';
    featureSet: 'basic' | 'intermediate' | 'advanced' | 'enterprise';
    communicationStyle: 'simple' | 'detailed' | 'technical' | 'strategic';
  };
  nextActions: string[];
}

/**
 * Onboarding Integration Manager
 */
export class OnboardingIntegrationManager {
  private detectionEngine: PersonaDetectionEngine;
  private switchingManager: PersonaSwitchingManager;
  private onboardingEvents: Map<string, OnboardingEvent[]> = new Map();

  constructor() {
    this.detectionEngine = new PersonaDetectionEngine();
    this.switchingManager = new PersonaSwitchingManager();
  }

  /**
   * Process 5-Fragen-Heuristik responses and determine onboarding flow
   */
  async processHeuristicResponses(
    userId: string,
    responses: OnboardingHeuristicResponses,
    additionalContext?: {
      userAgent: string;
      language: 'de' | 'en';
      source: string;
      timestamp: string;
    }
  ): Promise<OnboardingPersonaResult> {
    // Convert to detection engine format
    const detectionResponses = {
      question_0: responses.standorte,
      question_1: responses.marketingReife,
      question_2: responses.hauptziel,
      question_3: responses.teamgroesse,
      question_4: responses.budget
    };

    // Detect persona
    const detectedPersona = await this.detectionEngine.detectPersona(userId, detectionResponses);

    // Emit persona_assigned event
    await this.emitOnboardingEvent({
      type: 'persona_assigned',
      timestamp: new Date().toISOString(),
      userId,
      payload: {
        persona: detectedPersona.primaryPersona,
        confidence: detectedPersona.primaryPersona.confidence,
        method: detectedPersona.detectionMethod,
        responses
      }
    });

    // Generate onboarding flow configuration
    const onboardingFlow = this.generateOnboardingFlow(detectedPersona);
    const adaptations = this.generateOnboardingAdaptations(detectedPersona);
    const nextActions = this.generateNextActions(detectedPersona);

    return {
      detectedPersona,
      onboardingFlow,
      adaptations,
      nextActions
    };
  }

  /**
   * Update persona based on onboarding behavior
   */
  async updatePersonaFromBehavior(
    userId: string,
    behaviorData: Partial<UserBehaviorPattern>,
    currentPersona: PersonaDetectionResult
  ): Promise<{
    updatedPersona: PersonaDetectionResult;
    switchDecision: PersonaSwitchDecision;
    adaptations: OnboardingPersonaResult['adaptations'];
  }> {
    // Evaluate if persona switching is needed
    const switchDecision = await this.switchingManager.evaluatePersonaSwitch(
      userId,
      currentPersona,
      behaviorData
    );

    let updatedPersona = currentPersona;

    if (switchDecision.shouldSwitch) {
      // Create new persona detection result
      updatedPersona = {
        primaryPersona: {
          business: switchDecision.toPersona.business,
          user: switchDecision.toPersona.user,
          confidence: switchDecision.confidence
        },
        alternativePersonas: currentPersona.alternativePersonas,
        detectionMethod: 'behavioral',
        uncertaintyFactors: [],
        recommendedActions: switchDecision.adaptations
      };

      // Emit persona change event
      await this.emitOnboardingEvent({
        type: 'persona_assigned',
        timestamp: new Date().toISOString(),
        userId,
        payload: {
          previousPersona: currentPersona.primaryPersona,
          newPersona: updatedPersona.primaryPersona,
          switchReason: switchDecision.reason,
          switchEvent: switchDecision.switchEvent
        }
      });
    }

    const adaptations = this.generateOnboardingAdaptations(updatedPersona);

    return {
      updatedPersona,
      switchDecision,
      adaptations
    };
  }

  /**
   * Handle onboarding completion and prepare for VC
   */
  async completeOnboarding(
    userId: string,
    finalPersona: PersonaDetectionResult,
    collectedData: {
      businessName: string;
      businessCategory: string;
      location: string;
      email: string;
      language: 'de' | 'en';
      consent: {
        profiling: boolean;
        marketing: boolean;
        apiAccess: boolean;
      };
      additionalData?: Record<string, any>;
    }
  ): Promise<{
    vcConfiguration: {
      analysisType: 'basic' | 'detailed' | 'comprehensive' | 'enterprise';
      expectedDuration: number;
      personaAdaptations: string[];
    };
    nextSteps: string[];
  }> {
    // Emit onboarding complete event
    await this.emitOnboardingEvent({
      type: 'onb_complete',
      timestamp: new Date().toISOString(),
      userId,
      payload: {
        persona: finalPersona.primaryPersona,
        duration: this.calculateOnboardingDuration(userId),
        completionRate: this.calculateCompletionRate(userId),
        collectedData
      }
    });

    // Configure VC based on persona
    const vcConfiguration = this.configureVCForPersona(finalPersona, collectedData);
    const nextSteps = this.generatePostOnboardingSteps(finalPersona, collectedData);

    return {
      vcConfiguration,
      nextSteps
    };
  }

  /**
   * Handle user feedback about onboarding experience
   */
  async handleOnboardingFeedback(
    userId: string,
    currentPersona: PersonaDetectionResult,
    feedback: {
      experienceRating: 1 | 2 | 3 | 4 | 5;
      difficultyLevel: 'too_easy' | 'just_right' | 'too_difficult';
      paceRating: 'too_fast' | 'just_right' | 'too_slow';
      helpfulnessRating: 1 | 2 | 3 | 4 | 5;
      suggestions?: string;
    }
  ): Promise<PersonaSwitchDecision> {
    // Convert feedback to persona feedback format
    const personaFeedback = feedback.difficultyLevel === 'just_right' &&
      feedback.paceRating === 'just_right' &&
      feedback.experienceRating >= 4 ? 'correct' :
      feedback.experienceRating <= 2 ? 'incorrect' : 'partially_correct';

    const preferredComplexity = feedback.difficultyLevel === 'too_easy' ? 'more_detailed' :
      feedback.difficultyLevel === 'too_difficult' ? 'simpler' : 'just_right';

    const timeConstraints = feedback.paceRating === 'too_fast' ? 'more_time' :
      feedback.paceRating === 'too_slow' ? 'less_time' : 'appropriate';

    const switchDecision = await this.switchingManager.evaluatePersonaSwitch(
      userId,
      currentPersona,
      {}, // No new behavior data
      {
        personaFeedback,
        preferredComplexity,
        timeConstraints
      }
    );

    // Emit feedback event
    await this.emitOnboardingEvent({
      type: 'persona_assigned',
      timestamp: new Date().toISOString(),
      userId,
      payload: {
        feedbackReceived: feedback,
        switchDecision,
        previousPersona: currentPersona.primaryPersona
      }
    });

    return switchDecision;
  }

  /**
   * Get onboarding recommendations for specific persona
   */
  getOnboardingRecommendations(persona: PersonaDetectionResult): {
    flowRecommendations: string[];
    uiRecommendations: string[];
    contentRecommendations: string[];
    timingRecommendations: string[];
  } {
    const businessPersona = persona.primaryPersona.business;
    const userPersona = persona.primaryPersona.user;

    const recommendations = {
      flowRecommendations: [],
      uiRecommendations: [],
      contentRecommendations: [],
      timingRecommendations: []
    };

    // Business persona specific recommendations
    switch (businessPersona) {
      case 'Solo-Sarah':
        recommendations.flowRecommendations.push(
          'Keep onboarding under 10 minutes',
          'Focus on immediate value',
          'Minimize required fields'
        );
        break;
      case 'Bewahrer-Ben':
        recommendations.flowRecommendations.push(
          'Show ROI calculations',
          'Provide detailed explanations',
          'Offer optional advanced setup'
        );
        break;
      case 'Wachstums-Walter':
        recommendations.flowRecommendations.push(
          'Enable multi-location setup',
          'Show scalability features',
          'Assign account manager'
        );
        break;
      case 'Ketten-Katrin':
        recommendations.flowRecommendations.push(
          'Route to enterprise sales',
          'Provide custom integration assessment',
          'Schedule implementation planning'
        );
        break;
    }

    // User persona specific recommendations
    switch (userPersona) {
      case 'Der Skeptiker':
        recommendations.contentRecommendations.push(
          'Include testimonials and case studies',
          'Provide detailed feature explanations',
          'Show security and compliance information'
        );
        break;
      case 'Der Überforderte':
        recommendations.uiRecommendations.push(
          'Use progress indicators',
          'Provide contextual help',
          'Limit choices per step'
        );
        break;
      case 'Der Profi':
        recommendations.uiRecommendations.push(
          'Enable advanced configuration',
          'Provide API documentation links',
          'Show integration options'
        );
        break;
      case 'Der Zeitknappe':
        recommendations.timingRecommendations.push(
          'Prioritize essential steps',
          'Offer quick setup options',
          'Enable save and continue later'
        );
        break;
    }

    return recommendations;
  }

  /**
   * Generate onboarding flow configuration
   */
  private generateOnboardingFlow(persona: PersonaDetectionResult): OnboardingPersonaResult['onboardingFlow'] {
    const businessPersona = persona.primaryPersona.business;
    const userPersona = persona.primaryPersona.user;

    const flows = {
      'Solo-Sarah': {
        flowType: 'solo-sarah' as const,
        estimatedDuration: userPersona === 'Der Zeitknappe' ? 5 : 10,
        requiredSteps: [
          '5-Fragen-Heuristik',
          'P0-Daten erfassen',
          'Consent erteilen',
          'VC starten'
        ],
        optionalSteps: [
          'Website-Link hinzufügen',
          'GA4 verbinden'
        ],
        timeToValue: 3
      },
      'Bewahrer-Ben': {
        flowType: 'bewahrer-ben' as const,
        estimatedDuration: 20,
        requiredSteps: [
          '5-Fragen-Heuristik',
          'Erweiterte Daten erfassen',
          'Consent + ROI-Tracking',
          'VC starten'
        ],
        optionalSteps: [
          'Beratungstermin buchen',
          'ROI-Ziele definieren'
        ],
        timeToValue: 15
      },
      'Wachstums-Walter': {
        flowType: 'wachstums-walter' as const,
        estimatedDuration: 30,
        requiredSteps: [
          '5-Fragen-Heuristik',
          'Multi-Standort-Setup',
          'Account-Manager-Zuweisung'
        ],
        optionalSteps: [
          'Strategisches Onboarding-Gespräch',
          'Standort-Priorisierung'
        ],
        timeToValue: 60
      },
      'Ketten-Katrin': {
        flowType: 'ketten-katrin' as const,
        estimatedDuration: 45,
        requiredSteps: [
          '5-Fragen-Heuristik',
          'Enterprise-Kontaktformular',
          'Sales-Team-Weiterleitung'
        ],
        optionalSteps: [
          'Custom-Integration-Assessment',
          'Compliance-Review'
        ],
        timeToValue: 120
      }
    };

    return flows[businessPersona];
  }

  /**
   * Generate onboarding adaptations
   */
  private generateOnboardingAdaptations(persona: PersonaDetectionResult): OnboardingPersonaResult['adaptations'] {
    const userPersona = persona.primaryPersona.user;
    const businessPersona = persona.primaryPersona.business;

    const baseAdaptations = {
      uiComplexity: 'standard' as const,
      guidanceLevel: 'medium' as const,
      featureSet: 'intermediate' as const,
      communicationStyle: 'detailed' as const
    };

    // Adapt based on user persona
    switch (userPersona) {
      case 'Der Überforderte':
        baseAdaptations.uiComplexity = 'minimal';
        baseAdaptations.guidanceLevel = 'high';
        baseAdaptations.featureSet = 'basic';
        baseAdaptations.communicationStyle = 'simple';
        break;
      case 'Der Zeitknappe':
        baseAdaptations.uiComplexity = 'minimal';
        baseAdaptations.guidanceLevel = 'low';
        baseAdaptations.featureSet = 'basic';
        baseAdaptations.communicationStyle = 'simple';
        break;
      case 'Der Profi':
        baseAdaptations.uiComplexity = 'advanced';
        baseAdaptations.guidanceLevel = 'low';
        baseAdaptations.featureSet = 'advanced';
        baseAdaptations.communicationStyle = 'technical';
        break;
      case 'Der Skeptiker':
        baseAdaptations.uiComplexity = 'standard';
        baseAdaptations.guidanceLevel = 'medium';
        baseAdaptations.featureSet = 'intermediate';
        baseAdaptations.communicationStyle = 'detailed';
        break;
    }

    // Adapt based on business persona
    if (businessPersona === 'Ketten-Katrin') {
      baseAdaptations.uiComplexity = 'enterprise';
      baseAdaptations.featureSet = 'enterprise';
      baseAdaptations.communicationStyle = 'strategic';
    }

    return baseAdaptations;
  }

  /**
   * Generate next actions for onboarding
   */
  private generateNextActions(persona: PersonaDetectionResult): string[] {
    const businessPersona = persona.primaryPersona.business;
    const userPersona = persona.primaryPersona.user;

    const actions: string[] = [];

    // Business persona actions
    switch (businessPersona) {
      case 'Solo-Sarah':
        actions.push('Start basic VC analysis', 'Set up simple dashboard');
        break;
      case 'Bewahrer-Ben':
        actions.push('Configure ROI tracking', 'Schedule efficiency review');
        break;
      case 'Wachstums-Walter':
        actions.push('Set up multi-location tracking', 'Assign account manager');
        break;
      case 'Ketten-Katrin':
        actions.push('Route to enterprise sales', 'Schedule technical assessment');
        break;
    }

    // User persona adaptations
    if (userPersona === 'Der Überforderte') {
      actions.push('Provide guided tutorial', 'Enable help tooltips');
    } else if (userPersona === 'Der Zeitknappe') {
      actions.push('Show quick wins first', 'Enable express setup');
    } else if (userPersona === 'Der Profi') {
      actions.push('Enable advanced features', 'Provide API documentation');
    } else if (userPersona === 'Der Skeptiker') {
      actions.push('Show proof points', 'Provide case studies');
    }

    return actions;
  }

  /**
   * Configure VC analysis based on persona
   */
  private configureVCForPersona(
    persona: PersonaDetectionResult,
    userData: { businessName: string; businessCategory: string; location: string }
  ): {
    analysisType: 'basic' | 'detailed' | 'comprehensive' | 'enterprise';
    expectedDuration: number;
    personaAdaptations: string[];
  } {
    const businessPersona = persona.primaryPersona.business;
    const userPersona = persona.primaryPersona.user;

    let analysisType: 'basic' | 'detailed' | 'comprehensive' | 'enterprise' = 'basic';
    let expectedDurationMin = 3; // Default 3 minutes
    const personaAdaptations: string[] = [];

    // Set analysis type based on business persona
    switch (businessPersona) {
      case 'Solo-Sarah':
        analysisType = 'basic';
        expectedDurationMin = 3;
        break;
      case 'Bewahrer-Ben':
        analysisType = 'detailed';
        expectedDurationMin = 15;
        break;
      case 'Wachstums-Walter':
        analysisType = 'comprehensive';
        expectedDurationMin = 30;
        break;
      case 'Ketten-Katrin':
        analysisType = 'enterprise';
        expectedDurationMin = 60;
        break;
    }

    // Add user persona adaptations
    switch (userPersona) {
      case 'Der Skeptiker':
        personaAdaptations.push('Include detailed proof points', 'Show data sources', 'Provide confidence intervals');
        break;
      case 'Der Überforderte':
        personaAdaptations.push('Use simple language', 'Provide step-by-step guidance', 'Include visual aids');
        break;
      case 'Der Profi':
        personaAdaptations.push('Include technical details', 'Provide raw data access', 'Enable advanced filtering');
        break;
      case 'Der Zeitknappe':
        personaAdaptations.push('Prioritize quick wins', 'Show summary first', 'Enable fast navigation');
        break;
    }

    return {
      analysisType,
      expectedDuration: expectedDurationMin,
      personaAdaptations
    };
  }

  /**
   * Generate post-onboarding steps
   */
  private generatePostOnboardingSteps(
    persona: PersonaDetectionResult,
    userData: { businessName: string; email: string; consent: any }
  ): string[] {
    const steps: string[] = [];

    steps.push('Start Visibility Check analysis');

    if (userData.consent.marketing) {
      steps.push('Send welcome email series');
    }

    if (persona.primaryPersona.business === 'Ketten-Katrin') {
      steps.push('Schedule enterprise consultation');
    } else if (persona.primaryPersona.business === 'Wachstums-Walter') {
      steps.push('Assign account manager');
    }

    if (persona.primaryPersona.user === 'Der Überforderte') {
      steps.push('Enable guided tour');
    } else if (persona.primaryPersona.user === 'Der Profi') {
      steps.push('Provide advanced feature access');
    }

    return steps;
  }

  /**
   * Emit onboarding event with consent gate and PII handling
   */
  private async emitOnboardingEvent(
    event: OnboardingEvent & { consent?: { analytics?: boolean } }
  ): Promise<void> {
    const allow = event.consent?.analytics ?? true; // Default true or get from global contract
    if (!allow) return;

    // PII minimization
    if (event.payload?.email) {
      const crypto = await import('crypto');
      const salt = process.env.PII_SALT || 'default-salt-change-in-production';
      event.payload.email_hash = crypto.createHash('sha256').update(event.payload.email + salt).digest('hex');
      delete event.payload.email;
    }

    const userEvents = this.onboardingEvents.get(event.userId) || [];
    userEvents.push(event);
    this.onboardingEvents.set(event.userId, userEvents);

    // Log without PII
    console.log(`Onboarding event emitted: ${event.type}`, {
      ...event,
      payload: { ...event.payload /* PII already removed */ }
    });
  }

  /**
   * Calculate onboarding duration in minutes
   */
  private calculateOnboardingDuration(userId: string): number {
    const events = this.onboardingEvents.get(userId) || [];
    const startEvent = events.find(e => e.type === 'onb_start');
    const endEvent = events.find(e => e.type === 'onb_complete');

    if (!startEvent || !endEvent) return 0;

    const ms = new Date(endEvent.timestamp).getTime() - new Date(startEvent.timestamp).getTime();
    return Math.max(0, Math.round(ms / 60000)); // Convert to minutes
  }

  /**
   * Calculate completion rate as percentage
   */
  private calculateCompletionRate(userId: string): number {
    const events = this.onboardingEvents.get(userId) || [];
    const requiredEvents = ['onb_start', 'persona_assigned', 'consent_granted', 'vc_started'];
    const completedEvents = requiredEvents.filter(eventType =>
      events.some(e => e.type === eventType)
    );

    const ratio = completedEvents.length / requiredEvents.length;
    return Math.round(ratio * 100); // Return as percentage
  }
}

// Export singleton instance
export const onboardingIntegrationManager = new OnboardingIntegrationManager();