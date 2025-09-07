/**
 * Persona Switching Manager
 * Handles dynamic persona changes, fallback mechanisms, and edge case resolution
 */

import {
  BusinessPersona,
  UserPersona,
  PersonaProfile,
  PersonaMapper,
  PersonaTemplateFactory
} from './persona-templates';
import {
  PersonaDetectionEngine,
  PersonaDetectionResult,
  UserBehaviorPattern
} from './persona-detection-engine';

/**
 * Persona switching event types
 */
export type PersonaSwitchEvent = 
  | 'behavior_change'
  | 'confidence_improvement'
  | 'user_feedback'
  | 'session_evolution'
  | 'manual_override'
  | 'fallback_activation';

/**
 * Persona switching decision
 */
export interface PersonaSwitchDecision {
  shouldSwitch: boolean;
  fromPersona: {
    business: BusinessPersona;
    user: UserPersona;
  };
  toPersona: {
    business: BusinessPersona;
    user: UserPersona;
  };
  switchEvent: PersonaSwitchEvent;
  confidence: number;
  reason: string;
  adaptations: string[];
  rollbackPossible: boolean;
}

/**
 * Fallback strategy configuration
 */
export interface FallbackStrategy {
  trigger: 'low_confidence' | 'conflicting_signals' | 'no_data' | 'error';
  fallbackPersona: {
    business: BusinessPersona;
    user: UserPersona;
  };
  confidence: number;
  adaptations: string[];
  escalationPath: 'ask_user' | 'collect_more_data' | 'use_default' | 'manual_review';
}

/**
 * Edge case handling rules
 */
export interface EdgeCaseRule {
  name: string;
  condition: (detection: PersonaDetectionResult, behavior?: Partial<UserBehaviorPattern>) => boolean;
  resolution: PersonaSwitchDecision;
  priority: number;
}

/**
 * Persona Switching Manager
 */
export class PersonaSwitchingManager {
  private detectionEngine: PersonaDetectionEngine;
  private switchHistory: Map<string, PersonaSwitchDecision[]> = new Map();
  private fallbackStrategies: FallbackStrategy[];
  private edgeCaseRules: EdgeCaseRule[];

  constructor() {
    this.detectionEngine = new PersonaDetectionEngine();
    this.initializeFallbackStrategies();
    this.initializeEdgeCaseRules();
  }

  /**
   * Evaluate if persona switching is needed
   */
  async evaluatePersonaSwitch(
    userId: string,
    currentPersona: PersonaDetectionResult,
    newBehaviorData: Partial<UserBehaviorPattern>,
    userFeedback?: {
      personaFeedback: 'correct' | 'incorrect' | 'partially_correct';
      preferredComplexity: 'simpler' | 'more_detailed' | 'just_right';
      timeConstraints: 'more_time' | 'less_time' | 'appropriate';
    }
  ): Promise<PersonaSwitchDecision> {
    // Check for edge cases first
    const edgeCaseDecision = this.checkEdgeCases(currentPersona, newBehaviorData);
    if (edgeCaseDecision) {
      return edgeCaseDecision;
    }

    // Handle user feedback
    if (userFeedback) {
      const feedbackDecision = this.handleUserFeedback(currentPersona, userFeedback);
      if (feedbackDecision.shouldSwitch) {
        return feedbackDecision;
      }
    }

    // Behavioral change analysis
    const behaviorDecision = await this.analyzeBehavioralChange(userId, currentPersona, newBehaviorData);
    if (behaviorDecision.shouldSwitch) {
      return behaviorDecision;
    }

    // Session evolution analysis
    const evolutionDecision = this.analyzeSessionEvolution(userId, currentPersona, newBehaviorData);
    if (evolutionDecision.shouldSwitch) {
      return evolutionDecision;
    }

    // No switch needed
    return {
      shouldSwitch: false,
      fromPersona: {
        business: currentPersona.primaryPersona.business,
        user: currentPersona.primaryPersona.user
      },
      toPersona: {
        business: currentPersona.primaryPersona.business,
        user: currentPersona.primaryPersona.user
      },
      switchEvent: 'behavior_change',
      confidence: currentPersona.primaryPersona.confidence,
      reason: 'No significant changes detected',
      adaptations: [],
      rollbackPossible: false
    };
  }

  /**
   * Apply fallback strategy when detection fails or confidence is low
   */
  applyFallbackStrategy(
    trigger: FallbackStrategy['trigger'],
    currentDetection?: PersonaDetectionResult,
    errorContext?: string
  ): PersonaSwitchDecision {
    const strategy = this.fallbackStrategies.find(s => s.trigger === trigger) || this.fallbackStrategies[0];

    return {
      shouldSwitch: true,
      fromPersona: currentDetection ? {
        business: currentDetection.primaryPersona.business,
        user: currentDetection.primaryPersona.user
      } : {
        business: 'Solo-Sarah',
        user: 'Der Überforderte'
      },
      toPersona: strategy.fallbackPersona,
      switchEvent: 'fallback_activation',
      confidence: strategy.confidence,
      reason: `Fallback activated due to ${trigger}${errorContext ? ': ' + errorContext : ''}`,
      adaptations: strategy.adaptations,
      rollbackPossible: true
    };
  }

  /**
   * Handle manual persona override by user
   */
  handleManualOverride(
    userId: string,
    currentPersona: PersonaDetectionResult,
    targetPersona: {
      business: BusinessPersona;
      user: UserPersona;
    },
    reason?: string
  ): PersonaSwitchDecision {
    const decision: PersonaSwitchDecision = {
      shouldSwitch: true,
      fromPersona: {
        business: currentPersona.primaryPersona.business,
        user: currentPersona.primaryPersona.user
      },
      toPersona: targetPersona,
      switchEvent: 'manual_override',
      confidence: 0.9, // High confidence for manual selection
      reason: reason || 'User manually selected persona',
      adaptations: this.generateAdaptationsForPersona(targetPersona),
      rollbackPossible: true
    };

    // Store in history
    this.recordSwitchDecision(userId, decision);

    return decision;
  }

  /**
   * Get persona switching recommendations
   */
  getPersonaSwitchRecommendations(
    currentPersona: PersonaDetectionResult,
    behaviorData: Partial<UserBehaviorPattern>
  ): Array<{
    targetPersona: { business: BusinessPersona; user: UserPersona };
    reason: string;
    confidence: number;
    benefits: string[];
  }> {
    const recommendations: Array<{
      targetPersona: { business: BusinessPersona; user: UserPersona };
      reason: string;
      confidence: number;
      benefits: string[];
    }> = [];

    // Analyze current persona limitations
    const limitations = this.identifyPersonaLimitations(currentPersona, behaviorData);

    // Generate recommendations based on limitations
    limitations.forEach(limitation => {
      const targetPersona = this.suggestPersonaForLimitation(limitation, currentPersona);
      if (targetPersona) {
        recommendations.push({
          targetPersona,
          reason: limitation.reason,
          confidence: limitation.severity,
          benefits: limitation.potentialBenefits
        });
      }
    });

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Rollback to previous persona
   */
  rollbackPersona(userId: string): PersonaSwitchDecision | null {
    const history = this.switchHistory.get(userId) || [];
    const lastSwitch = history[history.length - 1];

    if (!lastSwitch || !lastSwitch.rollbackPossible) {
      return null;
    }

    const rollbackDecision: PersonaSwitchDecision = {
      shouldSwitch: true,
      fromPersona: lastSwitch.toPersona,
      toPersona: lastSwitch.fromPersona,
      switchEvent: 'manual_override',
      confidence: 0.8,
      reason: 'Rollback to previous persona',
      adaptations: this.generateAdaptationsForPersona(lastSwitch.fromPersona),
      rollbackPossible: false // Can't rollback a rollback
    };

    this.recordSwitchDecision(userId, rollbackDecision);
    return rollbackDecision;
  }

  /**
   * Get switching history for user
   */
  getSwitchHistory(userId: string): PersonaSwitchDecision[] {
    return this.switchHistory.get(userId) || [];
  }

  /**
   * Initialize fallback strategies
   */
  private initializeFallbackStrategies(): void {
    this.fallbackStrategies = [
      {
        trigger: 'no_data',
        fallbackPersona: {
          business: 'Solo-Sarah',
          user: 'Der Überforderte'
        },
        confidence: 0.5,
        adaptations: [
          'Use simplest possible language',
          'Provide step-by-step guidance',
          'Offer multiple help options',
          'Collect more data gradually'
        ],
        escalationPath: 'collect_more_data'
      },
      {
        trigger: 'low_confidence',
        fallbackPersona: {
          business: 'Solo-Sarah',
          user: 'Der Überforderte'
        },
        confidence: 0.6,
        adaptations: [
          'Start with basic features',
          'Ask clarifying questions',
          'Provide multiple complexity options',
          'Monitor user reactions closely'
        ],
        escalationPath: 'ask_user'
      },
      {
        trigger: 'conflicting_signals',
        fallbackPersona: {
          business: 'Solo-Sarah',
          user: 'Der Zeitknappe'
        },
        confidence: 0.4,
        adaptations: [
          'Offer quick wins first',
          'Provide both simple and detailed options',
          'Ask direct preference questions',
          'Use adaptive UI elements'
        ],
        escalationPath: 'ask_user'
      },
      {
        trigger: 'error',
        fallbackPersona: {
          business: 'Solo-Sarah',
          user: 'Der Überforderte'
        },
        confidence: 0.3,
        adaptations: [
          'Use most conservative approach',
          'Provide extensive help and support',
          'Enable manual persona selection',
          'Log for manual review'
        ],
        escalationPath: 'manual_review'
      }
    ];
  }

  /**
   * Initialize edge case handling rules
   */
  private initializeEdgeCaseRules(): void {
    this.edgeCaseRules = [
      {
        name: 'Expert with time pressure',
        condition: (detection, behavior) => {
          const hasExpertSignals = (behavior?.languagePatterns?.technicalTermsUsed?.length || 0) > 3;
          const hasTimeSignals = (behavior?.languagePatterns?.urgencyIndicators?.length || 0) > 0;
          const shortSession = (behavior?.sessionDuration || 0) < 120;
          return hasExpertSignals && (hasTimeSignals || shortSession);
        },
        resolution: {
          shouldSwitch: true,
          fromPersona: { business: 'Solo-Sarah', user: 'Der Profi' },
          toPersona: { business: 'Solo-Sarah', user: 'Der Zeitknappe' },
          switchEvent: 'behavior_change',
          confidence: 0.8,
          reason: 'Expert user with time constraints detected',
          adaptations: ['Prioritize quick wins', 'Provide expert-level shortcuts', 'Minimize explanations'],
          rollbackPossible: true
        },
        priority: 1
      },
      {
        name: 'Overwhelmed enterprise user',
        condition: (detection, behavior) => {
          const isEnterprise = detection.primaryPersona.business === 'Ketten-Katrin';
          const hasOverwhelmedSignals = (behavior?.languagePatterns?.overwhelmedSignals?.length || 0) > 2;
          const highHelpUsage = (behavior?.clickPatterns?.helpSections || 0) > 5;
          return isEnterprise && (hasOverwhelmedSignals || highHelpUsage);
        },
        resolution: {
          shouldSwitch: true,
          fromPersona: { business: 'Ketten-Katrin', user: 'Der Profi' },
          toPersona: { business: 'Ketten-Katrin', user: 'Der Überforderte' },
          switchEvent: 'behavior_change',
          confidence: 0.7,
          reason: 'Enterprise user showing overwhelmed behavior',
          adaptations: ['Simplify enterprise features', 'Provide guided tours', 'Offer personal support'],
          rollbackPossible: true
        },
        priority: 2
      },
      {
        name: 'Learning progression',
        condition: (detection, behavior) => {
          const wasOverwhelmed = detection.primaryPersona.user === 'Der Überforderte';
          const showsLearning = (behavior?.languagePatterns?.technicalTermsUsed?.length || 0) > 0;
          const reducedHelpUsage = (behavior?.clickPatterns?.helpSections || 0) < 2;
          const increasedExploration = (behavior?.clickPatterns?.detailedViews || 0) > 3;
          return wasOverwhelmed && showsLearning && (reducedHelpUsage || increasedExploration);
        },
        resolution: {
          shouldSwitch: true,
          fromPersona: { business: 'Solo-Sarah', user: 'Der Überforderte' },
          toPersona: { business: 'Solo-Sarah', user: 'Der Zeitknappe' },
          switchEvent: 'session_evolution',
          confidence: 0.6,
          reason: 'User showing learning progression and increased confidence',
          adaptations: ['Gradually introduce more features', 'Reduce hand-holding', 'Offer intermediate options'],
          rollbackPossible: true
        },
        priority: 3
      }
    ];

    // Sort by priority
    this.edgeCaseRules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check for edge cases that require special handling
   */
  private checkEdgeCases(
    detection: PersonaDetectionResult,
    behavior?: Partial<UserBehaviorPattern>
  ): PersonaSwitchDecision | null {
    for (const rule of this.edgeCaseRules) {
      if (rule.condition(detection, behavior)) {
        return rule.resolution;
      }
    }
    return null;
  }

  /**
   * Handle user feedback about persona accuracy
   */
  private handleUserFeedback(
    currentPersona: PersonaDetectionResult,
    feedback: {
      personaFeedback: 'correct' | 'incorrect' | 'partially_correct';
      preferredComplexity: 'simpler' | 'more_detailed' | 'just_right';
      timeConstraints: 'more_time' | 'less_time' | 'appropriate';
    }
  ): PersonaSwitchDecision {
    if (feedback.personaFeedback === 'correct' && 
        feedback.preferredComplexity === 'just_right' && 
        feedback.timeConstraints === 'appropriate') {
      return {
        shouldSwitch: false,
        fromPersona: {
          business: currentPersona.primaryPersona.business,
          user: currentPersona.primaryPersona.user
        },
        toPersona: {
          business: currentPersona.primaryPersona.business,
          user: currentPersona.primaryPersona.user
        },
        switchEvent: 'user_feedback',
        confidence: 0.9,
        reason: 'User confirmed persona is correct',
        adaptations: [],
        rollbackPossible: false
      };
    }

    // Determine new persona based on feedback
    let newUserPersona = currentPersona.primaryPersona.user;

    if (feedback.preferredComplexity === 'simpler') {
      newUserPersona = 'Der Überforderte';
    } else if (feedback.preferredComplexity === 'more_detailed') {
      newUserPersona = 'Der Profi';
    }

    if (feedback.timeConstraints === 'less_time') {
      newUserPersona = 'Der Zeitknappe';
    }

    if (feedback.personaFeedback === 'incorrect') {
      // Cycle through personas based on current one
      const personaCycle: UserPersona[] = ['Der Überforderte', 'Der Zeitknappe', 'Der Skeptiker', 'Der Profi'];
      const currentIndex = personaCycle.indexOf(currentPersona.primaryPersona.user);
      newUserPersona = personaCycle[(currentIndex + 1) % personaCycle.length];
    }

    return {
      shouldSwitch: newUserPersona !== currentPersona.primaryPersona.user,
      fromPersona: {
        business: currentPersona.primaryPersona.business,
        user: currentPersona.primaryPersona.user
      },
      toPersona: {
        business: currentPersona.primaryPersona.business,
        user: newUserPersona
      },
      switchEvent: 'user_feedback',
      confidence: 0.8,
      reason: `User feedback indicated preference for ${newUserPersona}`,
      adaptations: this.generateAdaptationsForPersona({
        business: currentPersona.primaryPersona.business,
        user: newUserPersona
      }),
      rollbackPossible: true
    };
  }

  /**
   * Analyze behavioral changes for persona switching
   */
  private async analyzeBehavioralChange(
    userId: string,
    currentPersona: PersonaDetectionResult,
    newBehaviorData: Partial<UserBehaviorPattern>
  ): Promise<PersonaSwitchDecision> {
    const switchResult = await this.detectionEngine.handlePersonaSwitching(
      userId,
      newBehaviorData,
      currentPersona
    );

    return {
      shouldSwitch: switchResult.shouldSwitch,
      fromPersona: {
        business: currentPersona.primaryPersona.business,
        user: currentPersona.primaryPersona.user
      },
      toPersona: switchResult.newPersona ? {
        business: switchResult.newPersona.primaryPersona.business,
        user: switchResult.newPersona.primaryPersona.user
      } : {
        business: currentPersona.primaryPersona.business,
        user: currentPersona.primaryPersona.user
      },
      switchEvent: 'behavior_change',
      confidence: switchResult.confidence,
      reason: switchResult.switchReason,
      adaptations: switchResult.newPersona ? 
        this.generateAdaptationsForPersona({
          business: switchResult.newPersona.primaryPersona.business,
          user: switchResult.newPersona.primaryPersona.user
        }) : [],
      rollbackPossible: true
    };
  }

  /**
   * Analyze session evolution for gradual persona changes
   */
  private analyzeSessionEvolution(
    userId: string,
    currentPersona: PersonaDetectionResult,
    newBehaviorData: Partial<UserBehaviorPattern>
  ): PersonaSwitchDecision {
    // Check for learning progression
    const history = this.switchHistory.get(userId) || [];
    const sessionDuration = newBehaviorData.sessionDuration || 0;
    
    // Long session might indicate user is becoming more comfortable
    if (sessionDuration > 600 && currentPersona.primaryPersona.user === 'Der Überforderte') {
      const technicalTerms = newBehaviorData.languagePatterns?.technicalTermsUsed?.length || 0;
      const detailedViews = newBehaviorData.clickPatterns?.detailedViews || 0;
      
      if (technicalTerms > 1 || detailedViews > 4) {
        return {
          shouldSwitch: true,
          fromPersona: {
            business: currentPersona.primaryPersona.business,
            user: currentPersona.primaryPersona.user
          },
          toPersona: {
            business: currentPersona.primaryPersona.business,
            user: 'Der Zeitknappe' // Intermediate step
          },
          switchEvent: 'session_evolution',
          confidence: 0.6,
          reason: 'User showing increased confidence during extended session',
          adaptations: ['Gradually introduce more features', 'Reduce guidance level'],
          rollbackPossible: true
        };
      }
    }

    return {
      shouldSwitch: false,
      fromPersona: {
        business: currentPersona.primaryPersona.business,
        user: currentPersona.primaryPersona.user
      },
      toPersona: {
        business: currentPersona.primaryPersona.business,
        user: currentPersona.primaryPersona.user
      },
      switchEvent: 'session_evolution',
      confidence: currentPersona.primaryPersona.confidence,
      reason: 'No significant session evolution detected',
      adaptations: [],
      rollbackPossible: false
    };
  }

  /**
   * Generate adaptations for a specific persona
   */
  private generateAdaptationsForPersona(persona: { business: BusinessPersona; user: UserPersona }): string[] {
    const profile = PersonaMapper.createPersonaProfile(persona.business, persona.user);
    const recommendations = PersonaTemplateFactory.getTemplateRecommendations(profile);
    return recommendations.adaptations;
  }

  /**
   * Identify limitations of current persona
   */
  private identifyPersonaLimitations(
    currentPersona: PersonaDetectionResult,
    behaviorData: Partial<UserBehaviorPattern>
  ): Array<{
    reason: string;
    severity: number;
    potentialBenefits: string[];
  }> {
    const limitations: Array<{
      reason: string;
      severity: number;
      potentialBenefits: string[];
    }> = [];

    // Check for mismatched complexity
    const technicalTerms = behaviorData.languagePatterns?.technicalTermsUsed?.length || 0;
    const helpUsage = behaviorData.clickPatterns?.helpSections || 0;

    if (currentPersona.primaryPersona.user === 'Der Überforderte' && technicalTerms > 3) {
      limitations.push({
        reason: 'User shows technical competence but receives simplified content',
        severity: 0.7,
        potentialBenefits: ['More detailed analysis', 'Advanced features access', 'Faster workflow']
      });
    }

    if (currentPersona.primaryPersona.user === 'Der Profi' && helpUsage > 5) {
      limitations.push({
        reason: 'User needs more guidance despite expert persona',
        severity: 0.8,
        potentialBenefits: ['Better onboarding', 'Reduced confusion', 'Higher success rate']
      });
    }

    // Check for time constraints
    const sessionDuration = behaviorData.sessionDuration || 0;
    const quickActions = behaviorData.clickPatterns?.quickActions || 0;

    if (sessionDuration < 120 && quickActions > 3 && currentPersona.primaryPersona.user !== 'Der Zeitknappe') {
      limitations.push({
        reason: 'User shows time pressure but receives detailed content',
        severity: 0.6,
        potentialBenefits: ['Faster results', 'Quick wins focus', 'Reduced cognitive load']
      });
    }

    return limitations;
  }

  /**
   * Suggest persona for specific limitation
   */
  private suggestPersonaForLimitation(
    limitation: { reason: string; severity: number },
    currentPersona: PersonaDetectionResult
  ): { business: BusinessPersona; user: UserPersona } | null {
    if (limitation.reason.includes('technical competence')) {
      return {
        business: currentPersona.primaryPersona.business,
        user: 'Der Profi'
      };
    }

    if (limitation.reason.includes('needs more guidance')) {
      return {
        business: currentPersona.primaryPersona.business,
        user: 'Der Überforderte'
      };
    }

    if (limitation.reason.includes('time pressure')) {
      return {
        business: currentPersona.primaryPersona.business,
        user: 'Der Zeitknappe'
      };
    }

    return null;
  }

  /**
   * Record switch decision in history
   */
  private recordSwitchDecision(userId: string, decision: PersonaSwitchDecision): void {
    const history = this.switchHistory.get(userId) || [];
    history.push(decision);
    this.switchHistory.set(userId, history);
  }
}

// Export singleton instance
export const personaSwitchingManager = new PersonaSwitchingManager();