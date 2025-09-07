/**
 * Persona Detection Engine with Real-World Scenarios and Fallback Mechanisms
 * Implements comprehensive persona detection with edge case handling and switching logic
 */

import {
  BusinessPersona,
  UserPersona,
  PersonaProfile,
  PersonaMapper,
  AdaptiveQuestioningSystem
} from './persona-templates';
import { DETECTION_WEIGHTS, SWITCHING_CONFIG, VALIDATION_LIMITS, clampValue } from './persona-config';

/**
 * Real-world user behavior patterns for persona detection
 */
export interface UserBehaviorPattern {
  sessionDuration: number; // in seconds
  pagesVisited: string[];
  questionsAsked: string[];
  clickPatterns: {
    quickActions: number;
    detailedViews: number;
    helpSections: number;
    exportFeatures: number;
  };
  formInteractions: {
    fieldsCompleted: number;
    timePerField: number;
    validationErrors: number;
    abandonmentRate: number;
  };
  languagePatterns: {
    technicalTermsUsed: string[];
    skepticalPhrases: string[];
    overwhelmedSignals: string[];
    urgencyIndicators: string[];
  };
  deviceContext: {
    isMobile: boolean;
    connectionSpeed: 'slow' | 'medium' | 'fast';
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

/**
 * Persona detection confidence levels
 */
export interface PersonaDetectionResult {
  primaryPersona: {
    business: BusinessPersona;
    user: UserPersona;
    confidence: number;
  };
  alternativePersonas: Array<{
    business: BusinessPersona;
    user: UserPersona;
    confidence: number;
    reason: string;
  }>;
  detectionMethod: 'heuristic' | 'behavioral' | 'hybrid' | 'fallback';
  uncertaintyFactors: string[];
  recommendedActions: string[];
}

/**
 * Edge cases and mixed persona scenarios
 */
export interface MixedPersonaScenario {
  scenario: string;
  businessPersona: BusinessPersona;
  userPersona: UserPersona;
  conflictingSignals: string[];
  resolutionStrategy: 'primary_business' | 'primary_user' | 'adaptive_hybrid' | 'ask_user';
  fallbackPersona: {
    business: BusinessPersona;
    user: UserPersona;
  };
}

/**
 * Persona key type for blending
 */
type PersonaKey = `${BusinessPersona}_${UserPersona}`;

/**
 * Comprehensive Persona Detection Engine
 */
export class PersonaDetectionEngine {
  private detectionHistory: Map<string, PersonaDetectionResult[]> = new Map();
  private behaviorPatterns: Map<string, UserBehaviorPattern> = new Map();
  private personaProbs: Map<string, Map<PersonaKey, number>> = new Map();
  private lastSwitchAt: Map<string, number> = new Map();

  /**
   * Detect persona using multiple methods and confidence scoring
   */
  async detectPersona(
    userId: string,
    heuristicResponses?: Record<string, string>,
    behaviorData?: Partial<UserBehaviorPattern>,
    previousDetections?: PersonaDetectionResult[]
  ): Promise<PersonaDetectionResult> {
    const detectionMethods: Array<{
      method: PersonaDetectionResult['detectionMethod'];
      result: Partial<PersonaDetectionResult>;
      confidence: number;
    }> = [];

    // Method 1: Heuristic-based detection (5-Fragen-Heuristik)
    if (heuristicResponses) {
      const heuristicResult = this.detectFromHeuristic(heuristicResponses);
      detectionMethods.push({
        method: 'heuristic',
        result: heuristicResult,
        confidence: heuristicResult.primaryPersona.confidence
      });
    }

    // Method 2: Behavioral pattern analysis
    if (behaviorData) {
      const behavioralResult = this.detectFromBehavior(behaviorData);
      detectionMethods.push({
        method: 'behavioral',
        result: behavioralResult,
        confidence: behavioralResult.primaryPersona.confidence
      });
    }

    // Method 3: Historical pattern analysis
    if (previousDetections && previousDetections.length > 0) {
      const historicalResult = this.detectFromHistory(previousDetections);
      detectionMethods.push({
        method: 'hybrid',
        result: historicalResult,
        confidence: historicalResult.primaryPersona.confidence
      });
    }

    // Combine detection methods
    const finalResult = this.combineDetectionMethods(detectionMethods);

    // Store detection history
    const history = this.detectionHistory.get(userId) || [];
    history.push(finalResult);
    this.detectionHistory.set(userId, history);

    // Store behavior pattern
    if (behaviorData) {
      this.behaviorPatterns.set(userId, behaviorData as UserBehaviorPattern);
    }

    return finalResult;
  }

  /**
   * Detect persona from 5-Fragen-Heuristik responses
   */
  private detectFromHeuristic(responses: Record<string, string>): PersonaDetectionResult {
    const scores = AdaptiveQuestioningSystem.calculatePersonaScores(responses);
    const bestMatch = AdaptiveQuestioningSystem.determineBestPersona(scores);

    // Map business persona to likely user persona based on responses
    const userPersona = this.inferUserPersonaFromHeuristic(responses, bestMatch.primary);

    return {
      primaryPersona: {
        business: bestMatch.primary,
        user: userPersona,
        confidence: bestMatch.confidence
      },
      alternativePersonas: bestMatch.alternatives.map(alt => ({
        business: alt,
        user: this.inferUserPersonaFromHeuristic(responses, alt),
        confidence: scores[alt] / Math.max(...Object.values(scores)),
        reason: `Alternative business persona based on heuristic scoring`
      })),
      detectionMethod: 'heuristic',
      uncertaintyFactors: bestMatch.confidence < 0.6 ? ['Low confidence in heuristic responses'] : [],
      recommendedActions: bestMatch.confidence < 0.6 ? ['Consider behavioral analysis', 'Ask clarifying questions'] : []
    };
  }

  /**
   * Detect persona from behavioral patterns
   */
  private detectFromBehavior(behaviorData: Partial<UserBehaviorPattern>): PersonaDetectionResult {
    const behaviorIndicators = {
      questionsAsked: behaviorData.languagePatterns?.skepticalPhrases || [],
      timeSpent: behaviorData.sessionDuration || 0,
      detailRequests: behaviorData.clickPatterns?.detailedViews || 0,
      skepticalLanguage: (behaviorData.languagePatterns?.skepticalPhrases?.length || 0) > 0,
      overwhelmedSignals: (behaviorData.languagePatterns?.overwhelmedSignals?.length || 0) > 0,
      technicalTermsUsed: (behaviorData.languagePatterns?.technicalTermsUsed?.length || 0) > 0,
      urgencyIndicators: (behaviorData.languagePatterns?.urgencyIndicators?.length || 0) > 0
    };

    const userPersona = PersonaMapper.mapUserPersona(behaviorIndicators);
    
    // Infer business persona from behavior patterns
    const businessPersona = this.inferBusinessPersonaFromBehavior(behaviorData);

    const confidence = this.calculateBehavioralConfidence(behaviorData);

    return {
      primaryPersona: {
        business: businessPersona,
        user: userPersona,
        confidence
      },
      alternativePersonas: this.generateBehavioralAlternatives(behaviorData, userPersona, businessPersona),
      detectionMethod: 'behavioral',
      uncertaintyFactors: this.identifyBehavioralUncertainties(behaviorData),
      recommendedActions: this.generateBehavioralRecommendations(behaviorData, confidence)
    };
  }

  /**
   * Detect persona from historical patterns
   */
  private detectFromHistory(previousDetections: PersonaDetectionResult[]): PersonaDetectionResult {
    // Analyze trends in previous detections
    const businessPersonaCounts = new Map<BusinessPersona, number>();
    const userPersonaCounts = new Map<UserPersona, number>();

    previousDetections.forEach(detection => {
      const businessCount = businessPersonaCounts.get(detection.primaryPersona.business) || 0;
      businessPersonaCounts.set(detection.primaryPersona.business, businessCount + 1);

      const userCount = userPersonaCounts.get(detection.primaryPersona.user) || 0;
      userPersonaCounts.set(detection.primaryPersona.user, userCount + 1);
    });

    // Find most consistent personas
    const mostConsistentBusiness = Array.from(businessPersonaCounts.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Solo-Sarah';
    
    const mostConsistentUser = Array.from(userPersonaCounts.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Der Überforderte';

    const consistency = Math.max(
      (businessPersonaCounts.get(mostConsistentBusiness) || 0) / previousDetections.length,
      (userPersonaCounts.get(mostConsistentUser) || 0) / previousDetections.length
    );

    return {
      primaryPersona: {
        business: mostConsistentBusiness,
        user: mostConsistentUser,
        confidence: consistency
      },
      alternativePersonas: this.generateHistoricalAlternatives(businessPersonaCounts, userPersonaCounts),
      detectionMethod: 'hybrid',
      uncertaintyFactors: consistency < 0.7 ? ['Inconsistent historical patterns'] : [],
      recommendedActions: consistency < 0.7 ? ['Re-evaluate with fresh behavioral data'] : []
    };
  }

  /**
   * Update persona probabilities with exponential moving average
   */
  private updatePersonaProbs(
    userId: string, 
    winner: PersonaKey, 
    score: number, 
    alpha: number = SWITCHING_CONFIG.emaAlpha
  ): Map<PersonaKey, number> {
    const dist = this.personaProbs.get(userId) || new Map<PersonaKey, number>();
    
    // Decay all existing probabilities
    for (const [k, v] of dist) {
      dist.set(k, v * (1 - alpha));
    }
    
    // Add mass to winner
    dist.set(winner, (dist.get(winner) || 0) + alpha * score);
    
    // Renormalize
    let sum = 0;
    for (const v of dist.values()) {
      sum += v || 0;
    }
    if (sum > 0) {
      for (const [k, v] of dist) {
        dist.set(k, v / sum);
      }
    }
    
    this.personaProbs.set(userId, dist);
    return dist;
  }

  /**
   * Combine multiple detection methods for final result
   */
  private combineDetectionMethods(
    methods: Array<{
      method: PersonaDetectionResult['detectionMethod'];
      result: Partial<PersonaDetectionResult>;
      confidence: number;
      userId?: string;
    }>
  ): PersonaDetectionResult {
    if (methods.length === 0) {
      return this.getFallbackPersona();
    }

    // Calculate weighted scores for each persona combination
    const personaScores = new Map<string, { score: number; methods: string[] }>();

    methods.forEach(({ method, result, confidence }) => {
      if (result.primaryPersona) {
        const key = `${result.primaryPersona.business}_${result.primaryPersona.user}`;
        const existing = personaScores.get(key) || { score: 0, methods: [] };
        existing.score += confidence * DETECTION_WEIGHTS[method];
        existing.methods.push(method);
        personaScores.set(key, existing);
      }
    });

    // Find best combination
    const bestPersona = Array.from(personaScores.entries())
      .sort(([, a], [, b]) => b.score - a.score)[0];

    if (!bestPersona) {
      return this.getFallbackPersona();
    }

    const [personaKey, { score, methods: usedMethods }] = bestPersona;
    const [businessPersona, userPersona] = personaKey.split('_') as [BusinessPersona, UserPersona];

    // Update persona probabilities with blending
    const userId = methods[0]?.userId || 'anonymous';
    const key = personaKey as PersonaKey;
    const dist = this.updatePersonaProbs(userId, key, score);
    
    // Get blended result (most probable persona)
    const blended = Array.from(dist.entries()).sort((a, b) => b[1] - a[1])[0];
    const [blendedBusiness, blendedUser] = blended[0].split('_') as [BusinessPersona, UserPersona];

    // Generate alternatives from other methods
    const alternatives = Array.from(personaScores.entries())
      .filter(([key]) => key !== personaKey)
      .slice(0, 2)
      .map(([key, { score: altScore }]) => {
        const [altBusiness, altUser] = key.split('_') as [BusinessPersona, UserPersona];
        return {
          business: altBusiness,
          user: altUser,
          confidence: altScore,
          reason: `Alternative from combined detection methods`
        };
      });

    return {
      primaryPersona: {
        business: blendedBusiness,
        user: blendedUser,
        confidence: Math.max(score, blended[1])
      },
      alternativePersonas: alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 2),
      detectionMethod: usedMethods.length > 1 ? 'hybrid' : usedMethods[0] as PersonaDetectionResult['detectionMethod'],
      uncertaintyFactors: this.identifyCombinedUncertainties(methods),
      recommendedActions: this.generateCombinedRecommendations(score, usedMethods)
    };
  }

  /**
   * Handle persona switching when user behavior changes
   */
  async handlePersonaSwitching(
    userId: string,
    newBehaviorData: Partial<UserBehaviorPattern>,
    currentPersona: PersonaDetectionResult
  ): Promise<{
    shouldSwitch: boolean;
    newPersona?: PersonaDetectionResult;
    switchReason: string;
    confidence: number;
  }> {
    const newDetection = await this.detectPersona(userId, undefined, newBehaviorData);
    
    const businessChanged = newDetection.primaryPersona.business !== currentPersona.primaryPersona.business;
    const userChanged = newDetection.primaryPersona.user !== currentPersona.primaryPersona.user;
    
    const confidenceDifference = newDetection.primaryPersona.confidence - currentPersona.primaryPersona.confidence;
    
    // Anti-flapping: check minimum dwell time
    const now = Date.now();
    const lastSwitch = this.lastSwitchAt.get(userId) || 0;
    const dwellTimeOk = (now - lastSwitch) > SWITCHING_CONFIG.dwellMs;
    
    // Switch criteria with hysteresis
    const shouldSwitch = (
      (businessChanged || userChanged) &&
      newDetection.primaryPersona.confidence > SWITCHING_CONFIG.minConfidence &&
      confidenceDifference > (SWITCHING_CONFIG.minDelta + SWITCHING_CONFIG.hysteresisMargin) &&
      dwellTimeOk
    );

    if (shouldSwitch) {
      this.lastSwitchAt.set(userId, now);
    }

    let switchReason = '';
    if (!dwellTimeOk) {
      switchReason = `Switch blocked: minimum dwell time not met (${Math.round((SWITCHING_CONFIG.dwellMs - (now - lastSwitch)) / 1000)}s remaining)`;
    } else if (businessChanged && userChanged) {
      switchReason = 'Both business and user persona changed based on new behavior';
    } else if (businessChanged) {
      switchReason = 'Business persona changed based on new behavior patterns';
    } else if (userChanged) {
      switchReason = 'User persona changed based on interaction patterns';
    } else {
      switchReason = 'No significant persona change detected';
    }

    return {
      shouldSwitch,
      newPersona: shouldSwitch ? newDetection : undefined,
      switchReason,
      confidence: newDetection.primaryPersona.confidence
    };
  }

  /**
   * Generate comprehensive test scenarios for persona detection
   */
  static generateTestScenarios(): Array<{
    name: string;
    description: string;
    heuristicResponses?: Record<string, string>;
    behaviorData?: Partial<UserBehaviorPattern>;
    expectedPersona: {
      business: BusinessPersona;
      user: UserPersona;
    };
    edgeCases: string[];
  }> {
    return [
      {
        name: 'Classic Solo-Sarah Overwhelmed',
        description: 'Small restaurant owner, new to digital marketing, needs simple guidance',
        heuristicResponses: {
          question_0: '1',
          question_1: 'anfaenger',
          question_2: 'mehr_gaeste',
          question_3: 'solo',
          question_4: '<100'
        },
        behaviorData: {
          sessionDuration: 180,
          languagePatterns: {
            overwhelmedSignals: ['kompliziert', 'wo anfangen', 'hilfe'],
            technicalTermsUsed: [],
            skepticalPhrases: [],
            urgencyIndicators: []
          },
          clickPatterns: {
            quickActions: 1,
            detailedViews: 0,
            helpSections: 3,
            exportFeatures: 0
          }
        },
        expectedPersona: {
          business: 'Solo-Sarah',
          user: 'Der Überforderte'
        },
        edgeCases: ['User asks technical questions despite being overwhelmed']
      },
      {
        name: 'Bewahrer-Ben Skeptical',
        description: 'Established restaurant owner, wants proof before investing',
        heuristicResponses: {
          question_0: '2-4',
          question_1: 'fortgeschritten',
          question_2: 'effizienz',
          question_3: '11-50',
          question_4: '500-2000'
        },
        behaviorData: {
          sessionDuration: 420,
          languagePatterns: {
            skepticalPhrases: ['belegen', 'garantie', 'beweis', 'risiko'],
            technicalTermsUsed: ['roi', 'kpi', 'analytics'],
            overwhelmedSignals: [],
            urgencyIndicators: []
          },
          clickPatterns: {
            quickActions: 0,
            detailedViews: 5,
            helpSections: 1,
            exportFeatures: 2
          }
        },
        expectedPersona: {
          business: 'Bewahrer-Ben',
          user: 'Der Skeptiker'
        },
        edgeCases: ['Shows urgency despite being methodical']
      },
      {
        name: 'Wachstums-Walter Professional',
        description: 'Growth-focused multi-location owner with expertise',
        heuristicResponses: {
          question_0: '5+',
          question_1: 'profi',
          question_2: 'expansion',
          question_3: '11-50',
          question_4: '500-2000'
        },
        behaviorData: {
          sessionDuration: 600,
          languagePatterns: {
            technicalTermsUsed: ['api', 'integration', 'automation', 'scalability'],
            skepticalPhrases: [],
            overwhelmedSignals: [],
            urgencyIndicators: []
          },
          clickPatterns: {
            quickActions: 2,
            detailedViews: 8,
            helpSections: 0,
            exportFeatures: 4
          }
        },
        expectedPersona: {
          business: 'Wachstums-Walter',
          user: 'Der Profi'
        },
        edgeCases: ['Becomes overwhelmed with complex features']
      },
      {
        name: 'Ketten-Katrin Enterprise',
        description: 'Large chain operator needing comprehensive analytics',
        heuristicResponses: {
          question_0: 'franchise',
          question_1: 'agentur',
          question_2: 'datenanalyse',
          question_3: '50+',
          question_4: 'enterprise'
        },
        behaviorData: {
          sessionDuration: 900,
          languagePatterns: {
            technicalTermsUsed: ['dashboard', 'reporting', 'compliance', 'multi-tenant'],
            skepticalPhrases: ['sla', 'security', 'audit'],
            overwhelmedSignals: [],
            urgencyIndicators: []
          },
          clickPatterns: {
            quickActions: 0,
            detailedViews: 12,
            helpSections: 0,
            exportFeatures: 8
          }
        },
        expectedPersona: {
          business: 'Ketten-Katrin',
          user: 'Der Profi'
        },
        edgeCases: ['Delegates to overwhelmed team member']
      },
      {
        name: 'Mixed Signals - Time-Pressed Expert',
        description: 'Expert user but extremely time-constrained',
        behaviorData: {
          sessionDuration: 90,
          languagePatterns: {
            technicalTermsUsed: ['api', 'export', 'automation'],
            urgencyIndicators: ['schnell', 'sofort', 'quick'],
            skepticalPhrases: [],
            overwhelmedSignals: []
          },
          clickPatterns: {
            quickActions: 5,
            detailedViews: 2,
            helpSections: 0,
            exportFeatures: 3
          }
        },
        expectedPersona: {
          business: 'Solo-Sarah', // Inferred from quick actions
          user: 'Der Zeitknappe'
        },
        edgeCases: ['Technical knowledge conflicts with time pressure']
      },
      {
        name: 'Persona Evolution - Learning User',
        description: 'User who starts overwhelmed but becomes more confident',
        behaviorData: {
          sessionDuration: 300,
          languagePatterns: {
            overwhelmedSignals: ['kompliziert'], // Early signals
            technicalTermsUsed: ['dashboard'], // Later learning
            skepticalPhrases: [],
            urgencyIndicators: []
          },
          clickPatterns: {
            quickActions: 2,
            detailedViews: 3,
            helpSections: 2,
            exportFeatures: 1
          }
        },
        expectedPersona: {
          business: 'Solo-Sarah',
          user: 'Der Überforderte' // Still primary, but evolving
        },
        edgeCases: ['Rapid learning curve changes persona mid-session']
      }
    ];
  }

  /**
   * Fallback persona for edge cases
   */
  private getFallbackPersona(): PersonaDetectionResult {
    return {
      primaryPersona: {
        business: 'Solo-Sarah',
        user: 'Der Überforderte',
        confidence: 0.5
      },
      alternativePersonas: [
        {
          business: 'Solo-Sarah',
          user: 'Der Zeitknappe',
          confidence: 0.3,
          reason: 'Common alternative for unclear signals'
        }
      ],
      detectionMethod: 'fallback',
      uncertaintyFactors: ['Insufficient data for reliable detection'],
      recommendedActions: ['Collect more behavioral data', 'Ask clarifying questions', 'Use adaptive questioning']
    };
  }

  // Helper methods for persona inference and confidence calculation
  private inferUserPersonaFromHeuristic(responses: Record<string, string>, businessPersona: BusinessPersona): UserPersona {
    // Simple mapping based on business persona and response patterns
    const marketingReife = responses.question_1;
    const budget = responses.question_4;

    if (marketingReife === 'anfaenger' || budget === '<100') {
      return 'Der Überforderte';
    }
    if (marketingReife === 'profi' || businessPersona === 'Ketten-Katrin') {
      return 'Der Profi';
    }
    if (budget === 'enterprise') {
      return 'Der Skeptiker';
    }
    return 'Der Überforderte'; // Safe fallback
  }

  private inferBusinessPersonaFromBehavior(behaviorData: Partial<UserBehaviorPattern>): BusinessPersona {
    const exportFeatures = behaviorData.clickPatterns?.exportFeatures || 0;
    const detailedViews = behaviorData.clickPatterns?.detailedViews || 0;
    const technicalTerms = behaviorData.languagePatterns?.technicalTermsUsed?.length || 0;

    if (exportFeatures > 5 || technicalTerms > 8) {
      return 'Ketten-Katrin';
    }
    if (detailedViews > 5 || technicalTerms > 3) {
      return 'Wachstums-Walter';
    }
    if (detailedViews > 2) {
      return 'Bewahrer-Ben';
    }
    return 'Solo-Sarah';
  }

  private calculateBehavioralConfidence(behaviorData: Partial<UserBehaviorPattern>): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on data richness
    if (behaviorData.sessionDuration && behaviorData.sessionDuration > 120) confidence += 0.1;
    if (behaviorData.clickPatterns) confidence += 0.1;
    if (behaviorData.languagePatterns) confidence += 0.1;
    if (behaviorData.formInteractions) confidence += 0.1;

    // Decrease confidence for conflicting signals
    const hasConflicts = this.detectBehavioralConflicts(behaviorData);
    if (hasConflicts) confidence -= 0.2;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private detectBehavioralConflicts(behaviorData: Partial<UserBehaviorPattern>): boolean {
    // Clamp values to prevent outliers
    const quick = clampValue(behaviorData.clickPatterns?.quickActions || 0, 0, VALIDATION_LIMITS.maxQuickActions);
    const detail = clampValue(behaviorData.clickPatterns?.detailedViews || 0, 0, VALIDATION_LIMITS.maxDetailedViews);
    const tech = clampValue(behaviorData.languagePatterns?.technicalTermsUsed?.length || 0, 0, VALIDATION_LIMITS.maxTechnicalTerms);
    const over = clampValue(behaviorData.languagePatterns?.overwhelmedSignals?.length || 0, 0, VALIDATION_LIMITS.maxOverwhelmedSignals);

    // Conflict: High technical usage but overwhelmed signals
    if (tech >= 4 && over >= 3) return true;
    
    // Conflict: Many quick actions but also many detailed views
    if (quick >= 6 && detail >= 8) return true;

    return false;
  }

  private generateBehavioralAlternatives(
    behaviorData: Partial<UserBehaviorPattern>,
    primaryUser: UserPersona,
    primaryBusiness: BusinessPersona
  ): PersonaDetectionResult['alternativePersonas'] {
    const alternatives: PersonaDetectionResult['alternativePersonas'] = [];

    // Generate logical alternatives based on behavior
    if (primaryUser === 'Der Überforderte') {
      alternatives.push({
        business: primaryBusiness,
        user: 'Der Zeitknappe',
        confidence: 0.3,
        reason: 'Could be time-pressed rather than overwhelmed'
      });
    }

    if (primaryUser === 'Der Profi') {
      alternatives.push({
        business: primaryBusiness,
        user: 'Der Skeptiker',
        confidence: 0.4,
        reason: 'Professional users often need proof and validation'
      });
    }

    return alternatives;
  }

  private identifyBehavioralUncertainties(behaviorData: Partial<UserBehaviorPattern>): string[] {
    const uncertainties: string[] = [];

    if (!behaviorData.sessionDuration || behaviorData.sessionDuration < 60) {
      uncertainties.push('Insufficient session time for reliable detection');
    }

    if (this.detectBehavioralConflicts(behaviorData)) {
      uncertainties.push('Conflicting behavioral signals detected');
    }

    if (!behaviorData.languagePatterns || Object.values(behaviorData.languagePatterns).every(arr => arr.length === 0)) {
      uncertainties.push('Limited language pattern data');
    }

    return uncertainties;
  }

  private generateBehavioralRecommendations(behaviorData: Partial<UserBehaviorPattern>, confidence: number): string[] {
    const recommendations: string[] = [];

    if (confidence < 0.6) {
      recommendations.push('Extend observation period for better detection');
    }

    if (!behaviorData.formInteractions) {
      recommendations.push('Monitor form interaction patterns');
    }

    if (this.detectBehavioralConflicts(behaviorData)) {
      recommendations.push('Ask direct clarifying questions to resolve conflicts');
    }

    return recommendations;
  }

  private generateHistoricalAlternatives(
    businessCounts: Map<BusinessPersona, number>,
    userCounts: Map<UserPersona, number>
  ): PersonaDetectionResult['alternativePersonas'] {
    const alternatives: PersonaDetectionResult['alternativePersonas'] = [];

    // Get second most common personas
    const sortedBusiness = Array.from(businessCounts.entries()).sort(([, a], [, b]) => b - a);
    const sortedUser = Array.from(userCounts.entries()).sort(([, a], [, b]) => b - a);

    if (sortedBusiness.length > 1) {
      alternatives.push({
        business: sortedBusiness[1][0],
        user: sortedUser[0]?.[0] || 'Der Überforderte',
        confidence: sortedBusiness[1][1] / sortedBusiness[0][1],
        reason: 'Second most consistent business persona from history'
      });
    }

    if (sortedUser.length > 1) {
      alternatives.push({
        business: sortedBusiness[0]?.[0] || 'Solo-Sarah',
        user: sortedUser[1][0],
        confidence: sortedUser[1][1] / sortedUser[0][1],
        reason: 'Second most consistent user persona from history'
      });
    }

    return alternatives;
  }

  private identifyCombinedUncertainties(methods: Array<{ method: string; confidence: number }>): string[] {
    const uncertainties: string[] = [];

    const avgConfidence = methods.reduce((sum, m) => sum + m.confidence, 0) / methods.length;
    if (avgConfidence < 0.6) {
      uncertainties.push('Low average confidence across detection methods');
    }

    const confidenceVariance = methods.reduce((sum, m) => sum + Math.pow(m.confidence - avgConfidence, 2), 0) / methods.length;
    if (confidenceVariance > 0.1) {
      uncertainties.push('High variance between detection methods');
    }

    return uncertainties;
  }

  private generateCombinedRecommendations(score: number, methods: string[]): string[] {
    const recommendations: string[] = [];

    if (score < 0.7) {
      recommendations.push('Consider additional data collection for higher confidence');
    }

    if (methods.length === 1) {
      recommendations.push('Use multiple detection methods for validation');
    }

    if (!methods.includes('behavioral')) {
      recommendations.push('Collect behavioral data for more accurate detection');
    }

    return recommendations;
  }
}

/**
 * Export comprehensive test scenarios and edge cases
 */
export const PersonaTestScenarios = PersonaDetectionEngine.generateTestScenarios();