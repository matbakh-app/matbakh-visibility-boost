/**
 * Test Suite for Persona-Specific Templates
 * Validates persona detection, template generation, and adaptive questioning
 */

import {
  PersonaMapper,
  PersonaTemplateFactory,
  AdaptiveQuestioningSystem,
  UserPersona,
  PersonaProfile,
  SkeptikerTemplate,
  UeberfordertTemplate,
  ProfiTemplate,
  ZeitknappeTemplate
} from '../persona-templates';
import { PromptContract } from '../prompt-security';

describe('PersonaMapper', () => {
  describe('mapBusinessPersona', () => {
    it('should map to Solo-Sarah correctly', () => {
      const responses = {
        standorte: '1' as const,
        marketingReife: 'anfaenger' as const,
        hauptziel: 'mehr_gaeste' as const,
        teamgroesse: 'solo' as const,
        budget: '<100' as const
      };

      const result = PersonaMapper.mapBusinessPersona(responses);
      expect(result).toBe('Solo-Sarah');
    });

    it('should map to Bewahrer-Ben correctly', () => {
      const responses = {
        standorte: '2-4' as const,
        marketingReife: 'fortgeschritten' as const,
        hauptziel: 'effizienz' as const,
        teamgroesse: '11-50' as const,
        budget: '500-2000' as const
      };

      const result = PersonaMapper.mapBusinessPersona(responses);
      expect(result).toBe('Bewahrer-Ben');
    });

    it('should map to Wachstums-Walter correctly', () => {
      const responses = {
        standorte: '5+' as const,
        marketingReife: 'profi' as const,
        hauptziel: 'expansion' as const,
        teamgroesse: '11-50' as const,
        budget: '500-2000' as const
      };

      const result = PersonaMapper.mapBusinessPersona(responses);
      expect(result).toBe('Wachstums-Walter');
    });

    it('should map to Ketten-Katrin correctly', () => {
      const responses = {
        standorte: 'franchise' as const,
        marketingReife: 'agentur' as const,
        hauptziel: 'datenanalyse' as const,
        teamgroesse: '50+' as const,
        budget: 'enterprise' as const
      };

      const result = PersonaMapper.mapBusinessPersona(responses);
      expect(result).toBe('Ketten-Katrin');
    });

    it('should fallback to Solo-Sarah for unclear responses', () => {
      const responses = {
        standorte: '2-4' as const,
        marketingReife: 'profi' as const,
        hauptziel: 'mehr_gaeste' as const,
        teamgroesse: '50+' as const,
        budget: '<100' as const
      };

      const result = PersonaMapper.mapBusinessPersona(responses);
      expect(result).toBe('Solo-Sarah');
    });
  });

  describe('mapUserPersona', () => {
    it('should detect "Der Skeptiker" from behavior', () => {
      const behaviorIndicators = {
        questionsAsked: ['Können Sie das belegen?', 'Welche Garantien gibt es?'],
        timeSpent: 300,
        detailRequests: 2,
        skepticalLanguage: true,
        overwhelmedSignals: false,
        technicalTermsUsed: false,
        urgencyIndicators: false
      };

      const result = PersonaMapper.mapUserPersona(behaviorIndicators);
      expect(result).toBe('Der Skeptiker');
    });

    it('should detect "Der Überforderte" from behavior', () => {
      const behaviorIndicators = {
        questionsAsked: ['Wo soll ich anfangen?', 'Das ist alles so kompliziert'],
        timeSpent: 180,
        detailRequests: 0,
        skepticalLanguage: false,
        overwhelmedSignals: true,
        technicalTermsUsed: false,
        urgencyIndicators: false
      };

      const result = PersonaMapper.mapUserPersona(behaviorIndicators);
      expect(result).toBe('Der Überforderte');
    });

    it('should detect "Der Profi" from behavior', () => {
      const behaviorIndicators = {
        questionsAsked: ['Welche API-Integrationen sind verfügbar?', 'Kann ich Daten exportieren?'],
        timeSpent: 450,
        detailRequests: 5,
        skepticalLanguage: false,
        overwhelmedSignals: false,
        technicalTermsUsed: true,
        urgencyIndicators: false
      };

      const result = PersonaMapper.mapUserPersona(behaviorIndicators);
      expect(result).toBe('Der Profi');
    });

    it('should detect "Der Zeitknappe" from behavior', () => {
      const behaviorIndicators = {
        questionsAsked: ['Was bringt am meisten?', 'Schnelle Lösung?'],
        timeSpent: 90,
        detailRequests: 1,
        skepticalLanguage: false,
        overwhelmedSignals: false,
        technicalTermsUsed: false,
        urgencyIndicators: true
      };

      const result = PersonaMapper.mapUserPersona(behaviorIndicators);
      expect(result).toBe('Der Zeitknappe');
    });
  });

  describe('createPersonaProfile', () => {
    it('should create correct profile for Solo-Sarah + Der Überforderte', () => {
      const profile = PersonaMapper.createPersonaProfile('Solo-Sarah', 'Der Überforderte');
      
      expect(profile.businessPersona).toBe('Solo-Sarah');
      expect(profile.userPersona).toBe('Der Überforderte');
      expect(profile.characteristics.timeAvailable).toBe('limited');
      expect(profile.characteristics.technicalLevel).toBe('beginner');
      expect(profile.adaptations.responseLength).toBe('brief');
      expect(profile.adaptations.proofRequirement).toBe('minimal');
    });

    it('should create correct profile for Bewahrer-Ben + Der Skeptiker', () => {
      const profile = PersonaMapper.createPersonaProfile('Bewahrer-Ben', 'Der Skeptiker');
      
      expect(profile.businessPersona).toBe('Bewahrer-Ben');
      expect(profile.userPersona).toBe('Der Skeptiker');
      expect(profile.characteristics.decisionStyle).toBe('data-driven');
      expect(profile.adaptations.responseLength).toBe('comprehensive');
      expect(profile.adaptations.proofRequirement).toBe('extensive');
    });

    it('should fallback to default profile for unknown combinations', () => {
      const profile = PersonaMapper.createPersonaProfile('Ketten-Katrin', 'Der Zeitknappe');
      
      // Should fallback to Solo-Sarah + Der Überforderte
      expect(profile.businessPersona).toBe('Solo-Sarah');
      expect(profile.userPersona).toBe('Der Überforderte');
    });
  });
});

describe('PersonaTemplateFactory', () => {
  const mockContract: PromptContract = {
    permissions: {
      webAccess: true,
      dataAccess: 'public',
      outputFormat: 'structured'
    },
    restrictions: {
      noPersonalData: true,
      noDirectApiCalls: true,
      noDataStorage: true,
      noExternalUploads: true
    },
    context: {
      requestType: 'vc_analysis',
      dataScope: 'business_public'
    }
  };

  describe('createTemplate', () => {
    it('should create SkeptikerTemplate for "Der Skeptiker"', () => {
      const template = PersonaTemplateFactory.createTemplate('Der Skeptiker', mockContract);
      expect(template).toBeInstanceOf(SkeptikerTemplate);
    });

    it('should create UeberfordertTemplate for "Der Überforderte"', () => {
      const template = PersonaTemplateFactory.createTemplate('Der Überforderte', mockContract);
      expect(template).toBeInstanceOf(UeberfordertTemplate);
    });

    it('should create ProfiTemplate for "Der Profi"', () => {
      const template = PersonaTemplateFactory.createTemplate('Der Profi', mockContract);
      expect(template).toBeInstanceOf(ProfiTemplate);
    });

    it('should create ZeitknappeTemplate for "Der Zeitknappe"', () => {
      const template = PersonaTemplateFactory.createTemplate('Der Zeitknappe', mockContract);
      expect(template).toBeInstanceOf(ZeitknappeTemplate);
    });

    it('should fallback to UeberfordertTemplate for unknown persona', () => {
      const template = PersonaTemplateFactory.createTemplate('Unknown' as UserPersona, mockContract);
      expect(template).toBeInstanceOf(UeberfordertTemplate);
    });
  });

  describe('getTemplateRecommendations', () => {
    it('should provide adaptations for time-constrained users', () => {
      const profile: PersonaProfile = {
        businessPersona: 'Solo-Sarah',
        userPersona: 'Der Zeitknappe',
        characteristics: {
          timeAvailable: 'minimal',
          technicalLevel: 'beginner',
          decisionStyle: 'quick',
          communicationPreference: 'simple'
        },
        adaptations: {
          responseLength: 'brief',
          technicalDepth: 'basic',
          actionOrientation: 'immediate',
          proofRequirement: 'minimal'
        }
      };

      const recommendations = PersonaTemplateFactory.getTemplateRecommendations(profile);
      
      expect(recommendations.primaryTemplate).toBe('Der Zeitknappe');
      expect(recommendations.fallbackTemplate).toBe('Der Überforderte');
      expect(recommendations.adaptations).toContain('Reduce response length by 50%');
      expect(recommendations.adaptations).toContain('Focus on top 3 priorities only');
    });

    it('should provide adaptations for technical beginners', () => {
      const profile: PersonaProfile = {
        businessPersona: 'Solo-Sarah',
        userPersona: 'Der Überforderte',
        characteristics: {
          timeAvailable: 'limited',
          technicalLevel: 'beginner',
          decisionStyle: 'intuitive',
          communicationPreference: 'simple'
        },
        adaptations: {
          responseLength: 'brief',
          technicalDepth: 'basic',
          actionOrientation: 'immediate',
          proofRequirement: 'minimal'
        }
      };

      const recommendations = PersonaTemplateFactory.getTemplateRecommendations(profile);
      
      expect(recommendations.adaptations).toContain('Avoid technical jargon');
      expect(recommendations.adaptations).toContain('Include step-by-step explanations');
    });

    it('should provide adaptations for users requiring extensive proof', () => {
      const profile: PersonaProfile = {
        businessPersona: 'Bewahrer-Ben',
        userPersona: 'Der Skeptiker',
        characteristics: {
          timeAvailable: 'moderate',
          technicalLevel: 'intermediate',
          decisionStyle: 'data-driven',
          communicationPreference: 'detailed'
        },
        adaptations: {
          responseLength: 'comprehensive',
          technicalDepth: 'intermediate',
          actionOrientation: 'systematic',
          proofRequirement: 'extensive'
        }
      };

      const recommendations = PersonaTemplateFactory.getTemplateRecommendations(profile);
      
      expect(recommendations.adaptations).toContain('Include detailed source citations');
      expect(recommendations.adaptations).toContain('Provide statistical backing for claims');
    });
  });

  describe('validatePersonaCompatibility', () => {
    it('should flag incompatible enterprise + overwhelmed combination', () => {
      const result = PersonaTemplateFactory.validatePersonaCompatibility('Ketten-Katrin', 'Der Überforderte');
      
      expect(result.compatible).toBe(false);
      expect(result.warnings).toContain('Enterprise user with overwhelmed persona - consider additional support');
    });

    it('should warn about small business + expert combination', () => {
      const result = PersonaTemplateFactory.validatePersonaCompatibility('Solo-Sarah', 'Der Profi');
      
      expect(result.compatible).toBe(true);
      expect(result.warnings).toContain('Small business with expert persona - may need simplified enterprise features');
    });

    it('should validate compatible combinations', () => {
      const result = PersonaTemplateFactory.validatePersonaCompatibility('Solo-Sarah', 'Der Überforderte');
      
      expect(result.compatible).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});

describe('AdaptiveQuestioningSystem', () => {
  describe('generateHeuristicQuestions', () => {
    it('should generate exactly 5 questions', () => {
      const questions = AdaptiveQuestioningSystem.generateHeuristicQuestions();
      expect(questions).toHaveLength(5);
    });

    it('should have proper question structure', () => {
      const questions = AdaptiveQuestioningSystem.generateHeuristicQuestions();
      
      questions.forEach(question => {
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('options');
        expect(question.options.length).toBeGreaterThan(0);
        
        question.options.forEach(option => {
          expect(option).toHaveProperty('value');
          expect(option).toHaveProperty('label');
          expect(option).toHaveProperty('weight');
          expect(option.weight).toHaveProperty('Solo-Sarah');
          expect(option.weight).toHaveProperty('Bewahrer-Ben');
          expect(option.weight).toHaveProperty('Wachstums-Walter');
          expect(option.weight).toHaveProperty('Ketten-Katrin');
        });
      });
    });

    it('should have balanced weight distribution', () => {
      const questions = AdaptiveQuestioningSystem.generateHeuristicQuestions();
      
      questions.forEach(question => {
        const totalWeights = question.options.reduce((acc, option) => {
          Object.entries(option.weight).forEach(([persona, weight]) => {
            acc[persona] = (acc[persona] || 0) + weight;
          });
          return acc;
        }, {} as Record<string, number>);

        // Each persona should have some representation across options
        Object.values(totalWeights).forEach(weight => {
          expect(weight).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('calculatePersonaScores', () => {
    it('should calculate scores correctly for Solo-Sarah responses', () => {
      const responses = {
        question_0: '1',
        question_1: 'anfaenger',
        question_2: 'mehr_gaeste',
        question_3: 'solo',
        question_4: '<100'
      };

      const scores = AdaptiveQuestioningSystem.calculatePersonaScores(responses);
      
      expect(scores['Solo-Sarah']).toBeGreaterThan(scores['Bewahrer-Ben']);
      expect(scores['Solo-Sarah']).toBeGreaterThan(scores['Wachstums-Walter']);
      expect(scores['Solo-Sarah']).toBeGreaterThan(scores['Ketten-Katrin']);
    });

    it('should calculate scores correctly for Ketten-Katrin responses', () => {
      const responses = {
        question_0: 'franchise',
        question_1: 'agentur',
        question_2: 'datenanalyse',
        question_3: '50+',
        question_4: 'enterprise'
      };

      const scores = AdaptiveQuestioningSystem.calculatePersonaScores(responses);
      
      expect(scores['Ketten-Katrin']).toBeGreaterThan(scores['Solo-Sarah']);
      expect(scores['Ketten-Katrin']).toBeGreaterThan(scores['Bewahrer-Ben']);
      expect(scores['Ketten-Katrin']).toBeGreaterThan(scores['Wachstums-Walter']);
    });

    it('should handle missing responses gracefully', () => {
      const responses = {
        question_0: '1',
        // Missing other responses
      };

      const scores = AdaptiveQuestioningSystem.calculatePersonaScores(responses);
      
      expect(scores['Solo-Sarah']).toBeGreaterThan(0);
      expect(Object.values(scores).every(score => score >= 0)).toBe(true);
    });
  });

  describe('determineBestPersona', () => {
    it('should determine best persona with confidence', () => {
      const scores = {
        'Solo-Sarah': 12,
        'Bewahrer-Ben': 3,
        'Wachstums-Walter': 1,
        'Ketten-Katrin': 0
      };

      const result = AdaptiveQuestioningSystem.determineBestPersona(scores);
      
      expect(result.primary).toBe('Solo-Sarah');
      expect(result.confidence).toBeCloseTo(0.75, 2); // 12/16
      expect(result.alternatives).toContain('Bewahrer-Ben');
      expect(result.alternatives).toHaveLength(2);
    });

    it('should handle tie scenarios', () => {
      const scores = {
        'Solo-Sarah': 5,
        'Bewahrer-Ben': 5,
        'Wachstums-Walter': 2,
        'Ketten-Katrin': 0
      };

      const result = AdaptiveQuestioningSystem.determineBestPersona(scores);
      
      expect(['Solo-Sarah', 'Bewahrer-Ben']).toContain(result.primary);
      expect(result.confidence).toBeCloseTo(5/12, 2);
    });

    it('should fallback to Solo-Sarah for zero scores', () => {
      const scores = {
        'Solo-Sarah': 0,
        'Bewahrer-Ben': 0,
        'Wachstums-Walter': 0,
        'Ketten-Katrin': 0
      };

      const result = AdaptiveQuestioningSystem.determineBestPersona(scores);
      
      expect(result.primary).toBe('Solo-Sarah');
      expect(result.confidence).toBe(0);
    });
  });
});

describe('Persona Template Generation', () => {
  const mockContract: PromptContract = {
    permissions: {
      webAccess: true,
      dataAccess: 'public',
      outputFormat: 'structured'
    },
    restrictions: {
      noPersonalData: true,
      noDirectApiCalls: true,
      noDataStorage: true,
      noExternalUploads: true
    },
    context: {
      requestType: 'vc_analysis',
      dataScope: 'business_public'
    }
  };

  const mockVariables = {
    business_name: 'Test Restaurant',
    business_category: 'Italian Restaurant',
    business_location: 'Berlin, Germany',
    user_persona: 'Der Skeptiker',
    goals: ['Increase visibility', 'Improve reviews'],
    data_quality_score: 85
  };

  describe('SkeptikerTemplate', () => {
    it('should generate template with proof requirements', () => {
      const template = new SkeptikerTemplate(mockContract);
      const result = template.generate(mockVariables);
      
      expect(result).toContain('DATENBASIERTE ANALYSE');
      expect(result).toContain('BEWEISFÜHRUNG');
      expect(result).toContain('QUELLENANGABEN');
      expect(result).toContain('RISIKOBEWERTUNG');
      expect(result).toContain('Test Restaurant');
      expect(result).toContain('Der Skeptiker');
    });

    it('should include security context', () => {
      const template = new SkeptikerTemplate(mockContract);
      const result = template.generate(mockVariables);
      
      expect(result).toContain('SICHERHEITSKONTEXT');
      expect(result).toContain('ERLAUBTE AKTIONEN');
      expect(result).toContain('VERBOTENE AKTIONEN');
    });
  });

  describe('UeberfordertTemplate', () => {
    it('should generate simplified template', () => {
      const template = new UeberfordertTemplate(mockContract);
      const result = template.generate(mockVariables);
      
      expect(result).toContain('SCHRITT-FÜR-SCHRITT');
      expect(result).toContain('ERMUTIGUNG');
      expect(result).toContain('EINFACHE');
      expect(result).toContain('Keine Sorge');
      expect(result).toContain('Test Restaurant');
    });

    it('should include motivational language', () => {
      const template = new UeberfordertTemplate(mockContract);
      const result = template.generate(mockVariables);
      
      expect(result).toContain('Das schaffen Sie');
      expect(result).toContain('MOTIVATIONS-BOOSTER');
      expect(result).toContain('ERFOLG FEIERN');
    });
  });

  describe('ProfiTemplate', () => {
    it('should generate comprehensive technical template', () => {
      const template = new ProfiTemplate(mockContract);
      const result = template.generate(mockVariables);
      
      expect(result).toContain('STRATEGISCHE TIEFENANALYSE');
      expect(result).toContain('ADVANCED ANALYTICS');
      expect(result).toContain('TECHNICAL IMPLEMENTATION');
      expect(result).toContain('API');
      expect(result).toContain('KPI FRAMEWORK');
    });

    it('should include advanced business frameworks', () => {
      const template = new ProfiTemplate(mockContract);
      const result = template.generate(mockVariables);
      
      expect(result).toContain('PORTER\'S FIVE FORCES');
      expect(result).toContain('BALANCED SCORECARD');
      expect(result).toContain('PREDICTIVE MODELING');
      expect(result).toContain('DIGITAL MATURITY');
    });
  });

  describe('ZeitknappeTemplate', () => {
    it('should generate quick wins focused template', () => {
      const template = new ZeitknappeTemplate(mockContract);
      const result = template.generate(mockVariables);
      
      expect(result).toContain('QUICK WINS');
      expect(result).toContain('SOFORT');
      expect(result).toContain('15-30 Min');
      expect(result).toContain('HÖCHSTE PRIORITÄT');
      expect(result).toContain('BLITZ-ANALYSE');
    });

    it('should include time-based structure', () => {
      const template = new ZeitknappeTemplate(mockContract);
      const result = template.generate(mockVariables);
      
      expect(result).toContain('HEUTE');
      expect(result).toContain('DIESE WOCHE');
      expect(result).toContain('NÄCHSTE WOCHE');
      expect(result).toContain('ROI-ÜBERSICHT');
    });
  });
});

describe('Template Variable Validation', () => {
  const mockContract: PromptContract = {
    permissions: {
      webAccess: true,
      dataAccess: 'public',
      outputFormat: 'structured'
    },
    restrictions: {
      noPersonalData: true,
      noDirectApiCalls: true,
      noDataStorage: true,
      noExternalUploads: true
    },
    context: {
      requestType: 'vc_analysis',
      dataScope: 'business_public'
    }
  };

  it('should throw error for missing required variables', () => {
    const template = new SkeptikerTemplate(mockContract);
    const incompleteVariables = {
      business_name: 'Test Restaurant'
      // Missing business_category and user_persona
    };

    expect(() => {
      template.generate(incompleteVariables);
    }).toThrow('Missing required variables');
  });

  it('should handle optional variables gracefully', () => {
    const template = new UeberfordertTemplate(mockContract);
    const minimalVariables = {
      business_name: 'Test Restaurant',
      business_category: 'Restaurant',
      user_persona: 'Der Überforderte'
    };

    expect(() => {
      template.generate(minimalVariables);
    }).not.toThrow();
  });
});