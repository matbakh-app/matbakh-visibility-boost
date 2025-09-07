/**
 * Persona Detection Accuracy Test Suite
 * Tests accuracy, consistency, and reliability of persona detection algorithms
 * Requirements: 8.3, 10.5, 11.4, 11.5
 */

import { PersonaDetectionEngine, PersonaDetectionResult, UserBehaviorPattern } from '../persona-detection-engine';
import { PersonaTestScenarios } from '../persona-detection-engine';

describe('Persona Detection Accuracy Testing', () => {
  let engine: PersonaDetectionEngine;
  
  // Accuracy tracking
  const accuracyResults: {
    scenario: string;
    expected: string;
    detected: string;
    confidence: number;
    correct: boolean;
  }[] = [];

  beforeEach(() => {
    engine = new PersonaDetectionEngine();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    // Calculate and report overall accuracy
    const totalTests = accuracyResults.length;
    const correctDetections = accuracyResults.filter(r => r.correct).length;
    const accuracy = (correctDetections / totalTests) * 100;
    
    console.log('\n=== PERSONA DETECTION ACCURACY REPORT ===');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Correct Detections: ${correctDetections}`);
    console.log(`Overall Accuracy: ${accuracy.toFixed(2)}%`);
    console.log(`Target Accuracy: 85%`);
    console.log(`Status: ${accuracy >= 85 ? 'PASS' : 'FAIL'}`);
    
    // Detailed breakdown by persona
    const personaBreakdown = accuracyResults.reduce((acc, result) => {
      const key = result.expected;
      if (!acc[key]) {
        acc[key] = { total: 0, correct: 0 };
      }
      acc[key].total++;
      if (result.correct) acc[key].correct++;
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    console.log('\n=== ACCURACY BY PERSONA ===');
    Object.entries(personaBreakdown).forEach(([persona, stats]) => {
      const accuracy = (stats.correct / stats.total) * 100;
      console.log(`${persona}: ${accuracy.toFixed(1)}% (${stats.correct}/${stats.total})`);
    });

    // Confidence analysis
    const avgConfidence = accuracyResults.reduce((sum, r) => sum + r.confidence, 0) / totalTests;
    const highConfidenceCorrect = accuracyResults.filter(r => r.confidence > 0.8 && r.correct).length;
    const highConfidenceTotal = accuracyResults.filter(r => r.confidence > 0.8).length;
    
    console.log('\n=== CONFIDENCE ANALYSIS ===');
    console.log(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`High Confidence (>80%) Accuracy: ${highConfidenceTotal > 0 ? ((highConfidenceCorrect / highConfidenceTotal) * 100).toFixed(1) : 0}%`);
  });

  describe('Baseline Accuracy Testing', () => {
    PersonaTestScenarios.forEach((scenario, index) => {
      it(`should accurately detect ${scenario.name} (Test ${index + 1})`, async () => {
        const result = await engine.detectPersona(
          `accuracy-test-${index}`,
          scenario.heuristicResponses,
          scenario.behaviorData
        );

        const expectedBusiness = scenario.expectedPersona.business;
        const expectedUser = scenario.expectedPersona.user;
        const detectedBusiness = result.primaryPersona.business;
        const detectedUser = result.primaryPersona.user;

        const businessCorrect = detectedBusiness === expectedBusiness;
        const userCorrect = detectedUser === expectedUser;
        const overallCorrect = businessCorrect && userCorrect;

        // Record accuracy data
        accuracyResults.push({
          scenario: scenario.name,
          expected: `${expectedBusiness}/${expectedUser}`,
          detected: `${detectedBusiness}/${detectedUser}`,
          confidence: result.primaryPersona.confidence,
          correct: overallCorrect
        });

        // Test assertions
        expect(detectedBusiness).toBe(expectedBusiness);
        expect(detectedUser).toBe(expectedUser);
        expect(result.primaryPersona.confidence).toBeGreaterThan(0.5);
        
        // High-confidence detections should be more accurate
        if (result.primaryPersona.confidence > 0.8) {
          expect(overallCorrect).toBe(true);
        }
      });
    });

    it('should maintain consistent detection across multiple runs', async () => {
      const scenario = PersonaTestScenarios[0]; // Use first scenario
      const results: PersonaDetectionResult[] = [];
      const runs = 5;

      for (let i = 0; i < runs; i++) {
        const result = await engine.detectPersona(
          `consistency-test-${i}`,
          scenario.heuristicResponses,
          scenario.behaviorData
        );
        results.push(result);
      }

      // All results should be identical
      const firstResult = results[0];
      results.forEach((result, index) => {
        expect(result.primaryPersona.business).toBe(firstResult.primaryPersona.business);
        expect(result.primaryPersona.user).toBe(firstResult.primaryPersona.user);
        expect(Math.abs(result.primaryPersona.confidence - firstResult.primaryPersona.confidence)).toBeLessThan(0.05);
      });
    });
  });

  describe('Edge Case Accuracy Testing', () => {
    it('should handle ambiguous signals with appropriate confidence', async () => {
      const ambiguousBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 180,
        languagePatterns: {
          technicalTermsUsed: ['dashboard', 'analytics'], // Some technical knowledge
          overwhelmedSignals: ['kompliziert'], // But also overwhelmed
          skepticalPhrases: ['belegen'], // And skeptical
          urgencyIndicators: ['schnell'] // And time-pressed
        },
        clickPatterns: {
          quickActions: 3,
          detailedViews: 3,
          helpSections: 3,
          exportFeatures: 1
        }
      };

      const result = await engine.detectPersona('ambiguous-test', undefined, ambiguousBehavior);

      // Should detect something but with lower confidence
      expect(result.primaryPersona.confidence).toBeLessThan(0.7);
      expect(result.uncertaintyFactors.length).toBeGreaterThan(0);
      expect(result.alternativePersonas.length).toBeGreaterThan(0);

      accuracyResults.push({
        scenario: 'Ambiguous Signals',
        expected: 'Unknown/Mixed',
        detected: `${result.primaryPersona.business}/${result.primaryPersona.user}`,
        confidence: result.primaryPersona.confidence,
        correct: result.primaryPersona.confidence < 0.7 // Correct if low confidence
      });
    });

    it('should handle minimal data scenarios', async () => {
      const minimalBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 45,
        clickPatterns: {
          quickActions: 1,
          detailedViews: 0,
          helpSections: 0,
          exportFeatures: 0
        }
      };

      const result = await engine.detectPersona('minimal-test', undefined, minimalBehavior);

      // Should provide fallback with low confidence
      expect(result.detectionMethod).toBe('behavioral');
      expect(result.primaryPersona.confidence).toBeLessThan(0.6);
      expect(result.uncertaintyFactors).toContain('Insufficient session time for reliable detection');

      accuracyResults.push({
        scenario: 'Minimal Data',
        expected: 'Low Confidence',
        detected: `${result.primaryPersona.business}/${result.primaryPersona.user}`,
        confidence: result.primaryPersona.confidence,
        correct: result.primaryPersona.confidence < 0.6
      });
    });

    it('should handle conflicting heuristic vs behavioral data', async () => {
      // Heuristic suggests expert
      const expertHeuristic = {
        question_0: '5+',
        question_1: 'profi',
        question_2: 'expansion',
        question_3: '11-50',
        question_4: '2000+'
      };

      // Behavior suggests overwhelmed
      const overwhelmedBehavior: Partial<UserBehaviorPattern> = {
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
          helpSections: 6,
          exportFeatures: 0
        }
      };

      const result = await engine.detectPersona('conflict-test', expertHeuristic, overwhelmedBehavior);

      // Should detect conflict and provide reasonable resolution
      expect(result.uncertaintyFactors).toContain('Conflicting behavioral signals detected');
      expect(result.detectionMethod).toBe('hybrid');
      expect(result.alternativePersonas.length).toBeGreaterThan(0);

      // Either persona could be correct, but confidence should be moderate
      expect(result.primaryPersona.confidence).toBeGreaterThan(0.4);
      expect(result.primaryPersona.confidence).toBeLessThan(0.8);

      accuracyResults.push({
        scenario: 'Conflicting Data',
        expected: 'Moderate Confidence',
        detected: `${result.primaryPersona.business}/${result.primaryPersona.user}`,
        confidence: result.primaryPersona.confidence,
        correct: result.primaryPersona.confidence >= 0.4 && result.primaryPersona.confidence <= 0.8
      });
    });
  });

  describe('Temporal Accuracy Testing', () => {
    it('should improve accuracy with historical data', async () => {
      const userId = 'temporal-test';
      const baseHeuristic = {
        question_0: '1',
        question_1: 'anfaenger',
        question_2: 'mehr_gaeste',
        question_3: 'solo',
        question_4: '<100'
      };

      // Session 1: Initial detection
      const session1Behavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 120,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert'],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        }
      };

      const result1 = await engine.detectPersona(userId, baseHeuristic, session1Behavior);

      // Session 2: More data, should be more confident
      const session2Behavior: Partial<UserBehaviorPattern> = {
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

      const result2 = await engine.detectPersona(userId, undefined, session2Behavior, [result1]);

      // Session 3: Even more consistent data
      const session3Behavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 200,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert', 'wo anfangen'],
          technicalTermsUsed: [],
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 0,
          detailedViews: 1,
          helpSections: 5,
          exportFeatures: 0
        }
      };

      const result3 = await engine.detectPersona(userId, undefined, session3Behavior, [result1, result2]);

      // Confidence should improve over time with consistent data
      expect(result2.primaryPersona.confidence).toBeGreaterThan(result1.primaryPersona.confidence);
      expect(result3.primaryPersona.confidence).toBeGreaterThan(result2.primaryPersona.confidence);

      // All should detect the same persona
      expect(result1.primaryPersona.business).toBe('Solo-Sarah');
      expect(result2.primaryPersona.business).toBe('Solo-Sarah');
      expect(result3.primaryPersona.business).toBe('Solo-Sarah');

      expect(result1.primaryPersona.user).toBe('Der Überforderte');
      expect(result2.primaryPersona.user).toBe('Der Überforderte');
      expect(result3.primaryPersona.user).toBe('Der Überforderte');

      accuracyResults.push({
        scenario: 'Temporal Improvement',
        expected: 'Solo-Sarah/Der Überforderte',
        detected: `${result3.primaryPersona.business}/${result3.primaryPersona.user}`,
        confidence: result3.primaryPersona.confidence,
        correct: result3.primaryPersona.business === 'Solo-Sarah' && result3.primaryPersona.user === 'Der Überforderte'
      });
    });

    it('should detect persona evolution accurately', async () => {
      const userId = 'evolution-test';

      // Initial: Overwhelmed beginner
      const initialBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 120,
        languagePatterns: {
          overwhelmedSignals: ['kompliziert', 'hilfe'],
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

      const initialResult = await engine.detectPersona(userId, undefined, initialBehavior);

      // Evolution: Learning and becoming more confident
      jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000); // 1 week later

      const evolvedBehavior: Partial<UserBehaviorPattern> = {
        sessionDuration: 300,
        languagePatterns: {
          overwhelmedSignals: [], // No longer overwhelmed
          technicalTermsUsed: ['dashboard', 'analytics', 'export'], // Learning technical terms
          skepticalPhrases: [],
          urgencyIndicators: []
        },
        clickPatterns: {
          quickActions: 3,
          detailedViews: 6,
          helpSections: 1, // Less help needed
          exportFeatures: 2 // Using advanced features
        }
      };

      const evolvedResult = await engine.detectPersona(userId, undefined, evolvedBehavior, [initialResult]);

      // Should detect evolution from Überforderte to potentially Profi
      expect(initialResult.primaryPersona.user).toBe('Der Überforderte');
      expect(evolvedResult.primaryPersona.user).not.toBe('Der Überforderte');
      expect(['Der Profi', 'Der Zeitknappe']).toContain(evolvedResult.primaryPersona.user);

      accuracyResults.push({
        scenario: 'Persona Evolution',
        expected: 'Evolution Detected',
        detected: `${initialResult.primaryPersona.user} -> ${evolvedResult.primaryPersona.user}`,
        confidence: evolvedResult.primaryPersona.confidence,
        correct: evolvedResult.primaryPersona.user !== initialResult.primaryPersona.user
      });
    });
  });

  describe('Cross-Validation Testing', () => {
    it('should validate detection against known patterns', async () => {
      // Test each persona type with multiple variations
      const personaVariations = {
        'Solo-Sarah/Der Überforderte': [
          {
            heuristic: { question_0: '1', question_1: 'anfaenger', question_2: 'mehr_gaeste', question_3: 'solo', question_4: '<100' },
            behavior: { sessionDuration: 150, languagePatterns: { overwhelmedSignals: ['kompliziert', 'hilfe'] } }
          },
          {
            heuristic: { question_0: '1', question_1: 'anfaenger', question_2: 'sichtbarkeit', question_3: 'solo', question_4: '<100' },
            behavior: { sessionDuration: 120, languagePatterns: { overwhelmedSignals: ['wo anfangen'] } }
          }
        ],
        'Bewahrer-Ben/Der Skeptiker': [
          {
            heuristic: { question_0: '2-4', question_1: 'fortgeschritten', question_2: 'qualitaet', question_3: '2-10', question_4: '100-500' },
            behavior: { sessionDuration: 400, languagePatterns: { skepticalPhrases: ['belegen', 'garantie', 'beweis'] } }
          },
          {
            heuristic: { question_0: '3-5', question_1: 'fortgeschritten', question_2: 'tradition', question_3: '2-10', question_4: '100-500' },
            behavior: { sessionDuration: 350, languagePatterns: { skepticalPhrases: ['sicher', 'vertrauen'] } }
          }
        ],
        'Wachstums-Walter/Der Profi': [
          {
            heuristic: { question_0: '3-5', question_1: 'profi', question_2: 'expansion', question_3: '11-50', question_4: '500-2000' },
            behavior: { sessionDuration: 300, languagePatterns: { technicalTermsUsed: ['roi', 'analytics', 'automation'] } }
          },
          {
            heuristic: { question_0: '4-6', question_1: 'profi', question_2: 'wachstum', question_3: '11-50', question_4: '1000-5000' },
            behavior: { sessionDuration: 280, languagePatterns: { technicalTermsUsed: ['integration', 'scalability'] } }
          }
        ],
        'Ketten-Katrin/Der Profi': [
          {
            heuristic: { question_0: '5+', question_1: 'profi', question_2: 'standardisierung', question_3: '50+', question_4: '2000+' },
            behavior: { sessionDuration: 200, languagePatterns: { technicalTermsUsed: ['api', 'automation', 'reporting'] } }
          },
          {
            heuristic: { question_0: '10+', question_1: 'profi', question_2: 'effizienz', question_3: '100+', question_4: '5000+' },
            behavior: { sessionDuration: 180, languagePatterns: { technicalTermsUsed: ['enterprise', 'scalability'] } }
          }
        ]
      };

      let totalVariations = 0;
      let correctDetections = 0;

      for (const [expectedPersona, variations] of Object.entries(personaVariations)) {
        for (const [index, variation] of variations.entries()) {
          const result = await engine.detectPersona(
            `cross-validation-${expectedPersona}-${index}`,
            variation.heuristic,
            variation.behavior as Partial<UserBehaviorPattern>
          );

          const [expectedBusiness, expectedUser] = expectedPersona.split('/');
          const detectedPersona = `${result.primaryPersona.business}/${result.primaryPersona.user}`;
          const correct = detectedPersona === expectedPersona;

          totalVariations++;
          if (correct) correctDetections++;

          accuracyResults.push({
            scenario: `Cross-Validation ${expectedPersona} Var${index + 1}`,
            expected: expectedPersona,
            detected: detectedPersona,
            confidence: result.primaryPersona.confidence,
            correct
          });

          // Individual assertion for debugging
          expect(result.primaryPersona.business).toBe(expectedBusiness);
          expect(result.primaryPersona.user).toBe(expectedUser);
        }
      }

      // Overall cross-validation accuracy should be high
      const crossValidationAccuracy = (correctDetections / totalVariations) * 100;
      expect(crossValidationAccuracy).toBeGreaterThan(85);
    });
  });

  describe('Performance Accuracy Testing', () => {
    it('should maintain accuracy under load', async () => {
      const concurrentDetections = 20;
      const promises: Promise<PersonaDetectionResult>[] = [];

      // Create concurrent detection requests
      for (let i = 0; i < concurrentDetections; i++) {
        const scenario = PersonaTestScenarios[i % PersonaTestScenarios.length];
        promises.push(
          engine.detectPersona(
            `load-test-${i}`,
            scenario.heuristicResponses,
            scenario.behaviorData
          )
        );
      }

      const results = await Promise.all(promises);

      // Check accuracy under load
      let correctDetections = 0;
      results.forEach((result, index) => {
        const scenario = PersonaTestScenarios[index % PersonaTestScenarios.length];
        const correct = 
          result.primaryPersona.business === scenario.expectedPersona.business &&
          result.primaryPersona.user === scenario.expectedPersona.user;
        
        if (correct) correctDetections++;

        accuracyResults.push({
          scenario: `Load Test ${index + 1}`,
          expected: `${scenario.expectedPersona.business}/${scenario.expectedPersona.user}`,
          detected: `${result.primaryPersona.business}/${result.primaryPersona.user}`,
          confidence: result.primaryPersona.confidence,
          correct
        });
      });

      const loadAccuracy = (correctDetections / concurrentDetections) * 100;
      expect(loadAccuracy).toBeGreaterThan(80); // Slightly lower threshold under load
    });

    it('should maintain accuracy with rapid successive calls', async () => {
      const rapidCalls = 10;
      const scenario = PersonaTestScenarios[0];
      const results: PersonaDetectionResult[] = [];

      // Make rapid successive calls
      for (let i = 0; i < rapidCalls; i++) {
        const result = await engine.detectPersona(
          `rapid-test-${i}`,
          scenario.heuristicResponses,
          scenario.behaviorData
        );
        results.push(result);
      }

      // All results should be consistent
      const firstResult = results[0];
      let consistentResults = 0;

      results.forEach((result, index) => {
        const consistent = 
          result.primaryPersona.business === firstResult.primaryPersona.business &&
          result.primaryPersona.user === firstResult.primaryPersona.user;
        
        if (consistent) consistentResults++;

        accuracyResults.push({
          scenario: `Rapid Call ${index + 1}`,
          expected: `${scenario.expectedPersona.business}/${scenario.expectedPersona.user}`,
          detected: `${result.primaryPersona.business}/${result.primaryPersona.user}`,
          confidence: result.primaryPersona.confidence,
          correct: 
            result.primaryPersona.business === scenario.expectedPersona.business &&
            result.primaryPersona.user === scenario.expectedPersona.user
        });
      });

      const consistencyRate = (consistentResults / rapidCalls) * 100;
      expect(consistencyRate).toBe(100); // Should be perfectly consistent
    });
  });

  describe('Accuracy Regression Testing', () => {
    it('should not regress from baseline accuracy', async () => {
      // This test would compare against stored baseline results
      // For now, we'll test against minimum acceptable accuracy
      
      const testScenarios = PersonaTestScenarios.slice(0, 10); // Use subset for regression test
      let correctDetections = 0;

      for (const [index, scenario] of testScenarios.entries()) {
        const result = await engine.detectPersona(
          `regression-test-${index}`,
          scenario.heuristicResponses,
          scenario.behaviorData
        );

        const correct = 
          result.primaryPersona.business === scenario.expectedPersona.business &&
          result.primaryPersona.user === scenario.expectedPersona.user;

        if (correct) correctDetections++;

        accuracyResults.push({
          scenario: `Regression Test ${index + 1}`,
          expected: `${scenario.expectedPersona.business}/${scenario.expectedPersona.user}`,
          detected: `${result.primaryPersona.business}/${result.primaryPersona.user}`,
          confidence: result.primaryPersona.confidence,
          correct
        });
      }

      const regressionAccuracy = (correctDetections / testScenarios.length) * 100;
      
      // Should maintain at least 85% accuracy
      expect(regressionAccuracy).toBeGreaterThan(85);
      
      // High-confidence detections should be even more accurate
      const highConfidenceResults = accuracyResults.filter(r => r.confidence > 0.8);
      const highConfidenceCorrect = highConfidenceResults.filter(r => r.correct).length;
      const highConfidenceAccuracy = highConfidenceResults.length > 0 ? 
        (highConfidenceCorrect / highConfidenceResults.length) * 100 : 100;
      
      expect(highConfidenceAccuracy).toBeGreaterThan(90);
    });
  });
});