/**
 * Comprehensive Test Suite for Persona Detection Engine
 * Tests real-world scenarios, edge cases, and fallback mechanisms
 */

import {
  PersonaDetectionEngine,
  PersonaTestScenarios,
  UserBehaviorPattern,
  PersonaDetectionResult
} from '../persona-detection-engine';

describe('PersonaDetectionEngine', () => {
  let engine: PersonaDetectionEngine;

  beforeEach(() => {
    // Use fake timers for deterministic testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    
    engine = new PersonaDetectionEngine();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Real-World Scenario Testing', () => {
    PersonaTestScenarios.forEach(scenario => {
      it(`should correctly detect ${scenario.name}`, async () => {
        const result = await engine.detectPersona(
          'test-user',
          scenario.heuristicResponses,
          scenario.behaviorData
        );

        expect(result.primaryPersona.business).toBe(scenario.expectedPersona.business);
        expect(result.primaryPersona.user).toBe(scenario.expectedPersona.user);
        expect(result.primaryPersona.confidence).toBeGreaterThan(0.5);
        expect(result.detectionMethod).toBeDefined();
      });
    });

    it('should handle Solo-Sarah Overwhelmed scenario with high confidence', async () => {
      const scenario = PersonaTestScenarios.find(s => s.name === 'Classic Solo-Sarah Overwhelmed')!;
      
      const result = await engine.detectPersona(
        'solo-sarah-test',
        scenario.heuristicResponses,
        scenario.behaviorData
      );

      expect(result.primaryPersona.business).toBe('Solo-Sarah');
      expect(result.primaryPersona.user).toBe('Der Überforderte');
      expect(result.primaryPersona.confidence).toBeGreaterThan(0.7);
      expect(result.uncertaintyFactors).toHaveLength(0);
    });

    it('should handle Bewahrer-Ben Skeptical scenario with proof requirements', async () => {
      const scenario = PersonaTestScenarios.find(s => s.name === 'Bewahrer-Ben Skeptical')!;
      
      const result = await engine.detectPersona(
        'bewahrer-ben-test',
        scenario.heuristicResponses,
        scenario.behaviorData
      );

      expect(result.primaryPersona.business).toBe('Bewahrer-Ben');
      expect(result.primaryPersona.user).toBe('Der Skeptiker');
      expect(result.primaryPersona.confidence).toBeGreaterThan(0.6);
      expect(result.detectionMethod).toBe('hybrid');
    });

    it('should handle enterprise Ketten-Katrin scenario', async () => {
      const scenario = PersonaTestScenarios.find(s => s.name === 'Ketten-Katrin Enterprise')!;
      
      const result = await engine.detectPersona(
        'ketten-katrin-test',
        scenario.heuristicResponses,
        scenario.behaviorData
      );

      expect(result.primaryPersona.business).toBe('Ketten-Katrin');
      expect(result.primaryPersona.user).toBe('Der Profi');
      expect(result.primaryPersona.confidence).toBeGreaterThan(0.8);
      expect(result.alternativePersonas).toHaveLength(0); // High confidence, no alternatives needed
    });
  });

  describe('Edge Cases and Mixed Signals', () => {
    it('should handle time-pressed expert with conflicting signals', async () => {
      const behaviorData: Partial<UserBehaviorPattern> = {
        sessionDuration: 90, // Very short - suggests time pressure
        languagePatterns: {
          technicalTermsUsed: ['api', 'export', 'automation', 'integration'], // Expert level
          urgencyIndicators: ['schnell', 'sofort', 'quick'],
          skepticalPhrases: [],
          overwhelmedSignals: []
        },
        clickPatterns: {
          quickActions: 8, // High quick actions
          detailedViews: 2, // But some detailed views
          helpSections: 0,
          exportFeatures: 4 // Expert feature usage
        }
      };

      const result = await engine.detectPersona('mixed-signals-test', undefined, behaviorData);

      expect(result.primaryPersona.user).toBe('Der Zeitknappe');
      expect(result.uncertaintyFactors.length).toBeGreaterThan(0);
      expect(result.recommendedActions).toContain('Extend observation period for better detection');
    });

    it('should detect persona evolution during session', async () => {
      const initialBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 120,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert', 'wo anfangen'],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 0,
          detailedViews: 0,
          helpSections: 5,
          exportFeatures: 0
        }
      };

      const evolvedBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 300,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert'], // Reduced
          technicalTermsUsed: ['dashboard', 'analytics'], // Learning
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 2,
          detailedViews: 4, // Increased exploration
          helpSections: 2, // Reduced help seeking
          exportFeatures: 1 // Starting to use advanced features
        }
      };

      const initialResult = await engine.detectPersona('evolving-user', undefined, initialBehavior);
      const evolvedResult = await engine.detectPersona('evolving-user', undefined, evolvedBehavior, [initialResult]);

      expect(initialResult.primaryPersona.user).toBe('Der Überforderte');
      expect(evolvedResult.primaryPersona.user).toBe('Der Überforderte'); // Still primary but confidence should change
      expect(evolvedResult.primaryPersona.confidence).toBeGreaterThan(initialResult.primaryPersona.confidence);
    });

    it('should handle insufficient data gracefully', async () => {
      const minimalBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 30, // Very short
        clickPatterns: {
          quickActions: 1,
          detailedViews: 0,
          helpSections: 0,
          exportFeatures: 0
        }
      };

      const result = await engine.detectPersona('minimal-data-test', undefined, minimalBehavior);

      expect(result.detectionMethod).toBe('behavioral');
      expect(result.uncertaintyFactors).toContain('Insufficient session time for reliable detection');
      expect(result.recommendedActions.length).toBeGreaterThan(0);
      expect(result.primaryPersona.confidence).toBeLessThan(0.6);
    });

    it('should detect conflicting behavioral patterns', async () => {
      const conflictingBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 300,
        languagePatterns: {
          technicalTermsUsed: ['api', 'integration', 'automation', 'scalability'], // Expert signals
          overwhelmedSignals: ['kompliziert', 'zu viel', 'hilfe'], // Overwhelmed signals
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 8, // Quick actions suggest time pressure
          detailedViews: 10, // But also detailed exploration
          helpSections: 5, // High help usage suggests overwhelm
          exportFeatures: 6 // But advanced feature usage
        }
      };

      const result = await engine.detectPersona('conflicting-test', undefined, conflictingBehavior);

      expect(result.uncertaintyFactors).toContain('Conflicting behavioral signals detected');
      expect(result.recommendedActions).toContain('Ask direct clarifying questions to resolve conflicts');
      expect(result.alternativePersonas.length).toBeGreaterThan(0);
    });
  });

  describe('Persona Switching Logic', () => {
    it('should detect when persona switching is needed', async () => {
      const initialBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 180,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert', 'hilfe'],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 1,
          detailedViews: 0,
          helpSections: 4,
          exportFeatures: 0
        }
      };

      const newBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 120,
        languagePatterns: {
          overwhelmedSignals: [],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: ['schnell', 'sofort', 'quick']
        },
        clickPatterns: {
          quickActions: 6,
          detailedViews: 1,
          helpSections: 0,
          exportFeatures: 0
        }
      };

      const initialResult = await engine.detectPersona('switching-test', undefined, initialBehavior);
      const switchResult = await engine.handlePersonaSwitching('switching-test', newBehavior, initialResult);

      expect(switchResult.shouldSwitch).toBe(true);
      expect(switchResult.newPersona?.primaryPersona.user).toBe('Der Zeitknappe');
      expect(switchResult.switchReason).toContain('persona changed');
    });

    it('should not switch when minimum dwell time not met', async () => {
      const userId = 'dwell-time-test';
      
      const initialBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 180,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert'],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        }
      };

      const newBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 120,
        languagePatterns: {
          urgencyIndicators: ['schnell', 'sofort'],
          overwhelmedSignals: [],
          technicalTermsUsed: [],
          skepticalPhrases: []
        }
      };

      const initialResult = await engine.detectPersona(userId, undefined, initialBehavior);
      
      // Advance time by only 1 minute (less than minimum dwell time of 2 minutes)
      jest.advanceTimersByTime(60 * 1000);
      
      const switchResult = await engine.handlePersonaSwitching(userId, newBehavior, initialResult);

      expect(switchResult.shouldSwitch).toBe(false);
      expect(switchResult.switchReason).toContain('minimum dwell time not met');
    });

    it('should not switch for minor behavioral changes', async () => {
      const stableBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 200,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert'],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 1,
          detailedViews: 1,
          helpSections: 3,
          exportFeatures: 0
        }
      };

      const slightlyDifferentBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 220,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert'],
          technicalTermsUsed: ['dashboard'], // Minor learning
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 2, // Slight increase
          detailedViews: 2, // Slight increase
          helpSections: 2, // Slight decrease
          exportFeatures: 0
        }
      };

      const initialResult = await engine.detectPersona('stable-test', undefined, stableBehavior);
      const switchResult = await engine.handlePersonaSwitching('stable-test', slightlyDifferentBehavior, initialResult);

      expect(switchResult.shouldSwitch).toBe(false);
      expect(switchResult.switchReason).toContain('No significant persona change');
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should provide fallback persona when no data is available', async () => {
      const result = await engine.detectPersona('no-data-test');

      expect(result.detectionMethod).toBe('fallback');
      expect(result.primaryPersona.business).toBe('Solo-Sarah');
      expect(result.primaryPersona.user).toBe('Der Überforderte');
      expect(result.primaryPersona.confidence).toBe(0.5);
      expect(result.uncertaintyFactors).toContain('Insufficient data for reliable detection');
    });

    it('should handle invalid heuristic responses', async () => {
      const invalidResponses = {
        question_0: 'invalid_option',
        question_1: '',
        question_2: 'nonexistent'
      };

      const result = await engine.detectPersona('invalid-test', invalidResponses);

      expect(result.primaryPersona).toBeDefined();
      expect(result.detectionMethod).toBe('heuristic');
      expect(result.uncertaintyFactors.length).toBeGreaterThan(0);
    });

    it('should combine multiple detection methods effectively', async () => {
      const heuristicResponses = {
        question_0: '2-4',
        question_1: 'fortgeschritten',
        question_2: 'effizienz',
        question_3: '11-50',
        question_4: '500-2000'
      };

      const behaviorData: Partial<UserBehaviorPattern> = {
        sessionDuration: 400,
        languagePatterns: {
          skepticalPhrases: ['belegen', 'garantie'],
          technicalTermsUsed: ['roi', 'analytics'],
          overwhelmedSignals: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 0,
          detailedViews: 6,
          helpSections: 1,
          exportFeatures: 3
        }
      };

      const result = await engine.detectPersona('combined-test', heuristicResponses, behaviorData);

      expect(result.detectionMethod).toBe('hybrid');
      expect(result.primaryPersona.business).toBe('Bewahrer-Ben');
      expect(result.primaryPersona.user).toBe('Der Skeptiker');
      expect(result.primaryPersona.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Historical Pattern Analysis', () => {
    it('should learn from historical detection patterns', async () => {
      const userId = 'historical-test';
      
      // Simulate multiple sessions with consistent patterns
      const sessions = [
        {
          heuristic: {
            question_0: '1',
            question_1: 'anfaenger',
            question_2: 'mehr_gaeste',
            question_3: 'solo',
            question_4: '<100'
          },
          behavior: {
            sessionDuration: 150,
            languagePatterns: {
              overwhelmedSignals: ['kompliziert'],
              technicalTermsUsed: [],
              skepticalPhrases: [],
              urgencyIndicators: []
            }
          }
        },
        {
          behavior: {
            sessionDuration: 180,
            languagePatterns: {
              overwhelmedSignals: ['hilfe', 'wo anfangen'],
              technicalTermsUsed: [],
              skepticalPhrases: [],
              urgencyIndicators: []
            }
          }
        },
        {
          behavior: {
            sessionDuration: 200,
            languagePatterns: {
              overwhelmedSignals: ['kompliziert'],
              technicalTermsUsed: ['dashboard'], // Slight learning
              skepticalPhrases: [],
              urgencyIndicators: []
            }
          }
        }
      ];

      const results: PersonaDetectionResult[] = [];
      
      for (const session of sessions) {
        const result = await engine.detectPersona(
          userId,
          session.heuristic,
          session.behavior,
          results
        );
        results.push(result);
      }

      const finalResult = results[results.length - 1];
      
      expect(finalResult.primaryPersona.business).toBe('Solo-Sarah');
      expect(finalResult.primaryPersona.user).toBe('Der Überforderte');
      expect(finalResult.primaryPersona.confidence).toBeGreaterThan(results[0].primaryPersona.confidence);
    });

    it('should detect inconsistent historical patterns', async () => {
      const userId = 'inconsistent-test';
      
      // Simulate inconsistent sessions
      const inconsistentSessions = [
        { business: 'Solo-Sarah', user: 'Der Überforderte', confidence: 0.8 },
        { business: 'Wachstums-Walter', user: 'Der Profi', confidence: 0.7 },
        { business: 'Solo-Sarah', user: 'Der Zeitknappe', confidence: 0.6 }
      ];

      const previousDetections: PersonaDetectionResult[] = inconsistentSessions.map(session => ({
        primaryPersona: session,
        alternativePersonas: [],
        detectionMethod: 'behavioral' as const,
        uncertaintyFactors: [],
        recommendedActions: []
      }));

      const result = await engine.detectPersona(userId, undefined, undefined, previousDetections);

      expect(result.uncertaintyFactors).toContain('Inconsistent historical patterns');
      expect(result.recommendedActions).toContain('Re-evaluate with fresh behavioral data');
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign higher confidence to consistent multi-method detection', async () => {
      const consistentHeuristic = {
        question_0: '1',
        question_1: 'anfaenger',
        question_2: 'mehr_gaeste',
        question_3: 'solo',
        question_4: '<100'
      };

      const consistentBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 180,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert', 'hilfe'],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 1,
          detailedViews: 0,
          helpSections: 4,
          exportFeatures: 0
        }
      };

      const result = await engine.detectPersona('consistent-test', consistentHeuristic, consistentBehavior);

      expect(result.primaryPersona.confidence).toBeGreaterThan(0.8);
      expect(result.uncertaintyFactors).toHaveLength(0);
    });

    it('should assign lower confidence to conflicting detection methods', async () => {
      const heuristicForExpert = {
        question_0: '5+',
        question_1: 'profi',
        question_2: 'expansion',
        question_3: '11-50',
        question_4: '500-2000'
      };

      const behaviorForOverwhelmed: Partial<UserBehaviorPattern> = {
        sessionDuration: 90,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert', 'zu viel', 'hilfe'],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 0,
          detailedViews: 0,
          helpSections: 8,
          exportFeatures: 0
        }
      };

      const result = await engine.detectPersona('conflicting-methods-test', heuristicForExpert, behaviorForOverwhelmed);

      expect(result.primaryPersona.confidence).toBeLessThan(0.7);
      expect(result.uncertaintyFactors.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Generation', () => {
    it('should provide appropriate recommendations for low confidence detection', async () => {
      const ambiguousBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 45, // Very short
        languagePatterns: {
          overwhelmedSignals: [],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 1,
          detailedViews: 1,
          helpSections: 1,
          exportFeatures: 0
        }
      };

      const result = await engine.detectPersona('low-confidence-test', undefined, ambiguousBehavior);

      expect(result.recommendedActions).toContain('Extend observation period for better detection');
      expect(result.recommendedActions.length).toBeGreaterThan(1);
    });

    it('should recommend specific data collection for missing information', async () => {
      const incompleteBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 200,
        clickPatterns: {
          quickActions: 3,
          detailedViews: 2,
          helpSections: 1,
          exportFeatures: 0
        }
        // Missing languagePatterns and formInteractions
      };

      const result = await engine.detectPersona('incomplete-test', undefined, incompleteBehavior);

      expect(result.recommendedActions).toContain('Monitor form interaction patterns');
      expect(result.uncertaintyFactors).toContain('Limited language pattern data');
    });
  });
});