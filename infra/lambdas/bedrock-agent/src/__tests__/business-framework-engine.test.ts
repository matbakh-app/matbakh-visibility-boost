/**
 * Tests for Business Framework Engine
 */

import { 
  BusinessFrameworkEngine, 
  BusinessData, 
  FrameworkSelectionCriteria,
  FrameworkType 
} from '../business-framework-engine';

describe('BusinessFrameworkEngine', () => {
  let engine: BusinessFrameworkEngine;
  let mockBusinessData: BusinessData;
  let mockCriteria: FrameworkSelectionCriteria;

  beforeEach(() => {
    engine = new BusinessFrameworkEngine();
    
    mockBusinessData = {
      business_name: 'Test Restaurant',
      location: {
        city: 'Berlin',
        region: 'Berlin',
        country: 'Germany',
        postal_code: '10115'
      },
      main_category: 'Restaurant',
      sub_categories: ['Italian', 'Pizza'],
      website_url: 'https://test-restaurant.de',
      social_media: {
        instagram_url: 'https://instagram.com/testrestaurant',
        facebook_url: 'https://facebook.com/testrestaurant',
        gmb_url: 'https://goo.gl/maps/test'
      },
      visibility_metrics: {
        google_score: 65,
        social_score: 45,
        website_score: 55,
        overall_score: 55
      },
      competitive_data: {
        local_competitors: [
          { name: 'Competitor A', score: 75, strengths: ['Location', 'Reviews'] },
          { name: 'Competitor B', score: 60, strengths: ['Price', 'Menu'] }
        ],
        industry_average: 62,
        top_10_percent: 85
      },
      cultural_context: {
        country_code: 'DE',
        language: 'de',
        regional_preferences: ['Quality', 'Tradition', 'Local sourcing']
      }
    };

    mockCriteria = {
      user_needs: ['detailed_analysis', 'competitive_insights'],
      data_availability: {
        competitive_data: true,
        financial_metrics: true,
        customer_feedback: true,
        cultural_context: true
      },
      analysis_depth: 'standard',
      persona_type: 'profi',
      business_maturity: 'established'
    };
  });

  describe('Framework Selection', () => {
    test('should select appropriate frameworks for Skeptiker persona', () => {
      const criteria: FrameworkSelectionCriteria = {
        ...mockCriteria,
        persona_type: 'skeptiker'
      };

      const frameworks = engine.selectFrameworks(criteria);

      expect(frameworks).toContain('swot');
      expect(frameworks).toContain('porters_five_forces');
      expect(frameworks).toContain('balanced_scorecard');
      expect(frameworks).toContain('nutzwert');
      expect(frameworks).toContain('hofstede');
    });

    test('should select minimal frameworks for Zeitknappe persona', () => {
      const criteria: FrameworkSelectionCriteria = {
        ...mockCriteria,
        persona_type: 'zeitknappe'
      };

      const frameworks = engine.selectFrameworks(criteria);

      expect(frameworks).toContain('swot');
      expect(frameworks).toContain('nutzwert');
      expect(frameworks.length).toBeLessThanOrEqual(3);
    });

    test('should select simplified frameworks for Ueberforderte persona', () => {
      const criteria: FrameworkSelectionCriteria = {
        ...mockCriteria,
        persona_type: 'ueberforderte',
        analysis_depth: 'quick'
      };

      const frameworks = engine.selectFrameworks(criteria);

      expect(frameworks).toContain('swot');
      expect(frameworks.length).toBeLessThanOrEqual(2);
    });

    test('should include comprehensive analysis for detailed requests', () => {
      const criteria: FrameworkSelectionCriteria = {
        ...mockCriteria,
        analysis_depth: 'comprehensive'
      };

      const frameworks = engine.selectFrameworks(criteria);

      expect(frameworks).toContain('comprehensive');
    });
  });

  describe('Prompt Generation', () => {
    test('should generate SWOT analysis prompt', () => {
      const frameworks: FrameworkType[] = ['swot'];
      const prompts = engine.generateFrameworkPrompts(frameworks, mockBusinessData, mockCriteria);

      const swotPrompt = prompts.get('swot');
      expect(swotPrompt).toBeDefined();
      expect(swotPrompt).toContain('SWOT-Analyse');
      expect(swotPrompt).toContain(mockBusinessData.business_name);
      expect(swotPrompt).toContain('Berlin');
      expect(swotPrompt).toContain('Restaurant');
    });

    test('should generate Porter\'s Five Forces prompt', () => {
      const frameworks: FrameworkType[] = ['porters_five_forces'];
      const prompts = engine.generateFrameworkPrompts(frameworks, mockBusinessData, mockCriteria);

      const portersPrompt = prompts.get('porters_five_forces');
      expect(portersPrompt).toBeDefined();
      expect(portersPrompt).toContain('Porter\'s Five Forces');
      expect(portersPrompt).toContain('Wettbewerbsintensität');
      expect(portersPrompt).toContain('Lieferantenmacht');
    });

    test('should generate Balanced Scorecard prompt', () => {
      const frameworks: FrameworkType[] = ['balanced_scorecard'];
      const prompts = engine.generateFrameworkPrompts(frameworks, mockBusinessData, mockCriteria);

      const scorecardPrompt = prompts.get('balanced_scorecard');
      expect(scorecardPrompt).toBeDefined();
      expect(scorecardPrompt).toContain('Balanced Scorecard');
      expect(scorecardPrompt).toContain('Finanzperspektive');
      expect(scorecardPrompt).toContain('Kundenperspektive');
    });

    test('should generate Hofstede cultural dimensions prompt', () => {
      const frameworks: FrameworkType[] = ['hofstede'];
      const prompts = engine.generateFrameworkPrompts(frameworks, mockBusinessData, mockCriteria);

      const hofstedePrompt = prompts.get('hofstede');
      expect(hofstedePrompt).toBeDefined();
      expect(hofstedePrompt).toContain('Hofstede');
      expect(hofstedePrompt).toContain('Machtdistanz');
      expect(hofstedePrompt).toContain('DE');
    });

    test('should generate Nutzwertanalyse prompt', () => {
      const frameworks: FrameworkType[] = ['nutzwert'];
      const prompts = engine.generateFrameworkPrompts(frameworks, mockBusinessData, mockCriteria);

      const nutzwertPrompt = prompts.get('nutzwert');
      expect(nutzwertPrompt).toBeDefined();
      expect(nutzwertPrompt).toContain('Nutzwertanalyse');
      expect(nutzwertPrompt).toContain('ROI-Projektion');
      expect(nutzwertPrompt).toContain('unverbindlich');
    });

    test('should adapt prompt tone for different personas', () => {
      const skeptikerCriteria: FrameworkSelectionCriteria = {
        ...mockCriteria,
        persona_type: 'skeptiker'
      };

      const zeitknappeCriteria: FrameworkSelectionCriteria = {
        ...mockCriteria,
        persona_type: 'zeitknappe'
      };

      const skeptikerPrompts = engine.generateFrameworkPrompts(['swot'], mockBusinessData, skeptikerCriteria);
      const zeitknappePrompts = engine.generateFrameworkPrompts(['swot'], mockBusinessData, zeitknappeCriteria);

      const skeptikerPrompt = skeptikerPrompts.get('swot');
      const zeitknappePrompt = zeitknappePrompts.get('swot');

      expect(skeptikerPrompt).toContain('datenbasiert');
      expect(zeitknappePrompt).toContain('Quick Wins');
    });
  });

  describe('Result Aggregation', () => {
    test('should aggregate multiple framework results', () => {
      const mockResults = new Map();
      
      mockResults.set('swot', {
        strengths: [{ factor: 'Location', description: 'Prime location', impact_score: 8, evidence: ['High foot traffic'] }],
        weaknesses: [{ factor: 'Online presence', description: 'Limited social media', urgency_score: 7, improvement_suggestions: ['Increase posting frequency'] }],
        opportunities: [{ factor: 'Local events', description: 'Partner with events', potential_impact: 'High', timeline: 'short', effort_required: 'medium' }],
        threats: [{ factor: 'Competition', description: 'New competitors', risk_level: 'medium', mitigation_strategies: ['Differentiate menu'] }]
      });

      mockResults.set('nutzwert', {
        initiatives: [
          {
            name: 'Social Media Boost',
            description: 'Increase social media activity',
            criteria_scores: { revenue_impact: 7, cost_efficiency: 8, implementation_ease: 9, time_to_value: 8, strategic_alignment: 7 },
            weighted_score: 7.8,
            roi_projection: { investment_required: '500€', expected_return: '2000€', payback_period: '3 months', confidence_level: 'medium', disclaimer: 'Alle Projektionen sind unverbindlich' },
            priority_ranking: 1,
            implementation_timeline: '2-4 weeks'
          }
        ],
        weighting_factors: { revenue_impact: 0.3, cost_efficiency: 0.25, implementation_ease: 0.2, time_to_value: 0.15, strategic_alignment: 0.1 },
        top_recommendations: ['Social Media Boost', 'Google My Business optimization']
      });

      const aggregated = engine.aggregateFrameworkResults(mockResults, mockBusinessData);

      expect(aggregated).toBeDefined();
      expect(aggregated.swot_analysis).toBeDefined();
      expect(aggregated.nutzwert_analyse).toBeDefined();
      expect(aggregated.cross_framework_insights).toBeDefined();
      expect(aggregated.executive_summary).toBeDefined();
      
      expect(aggregated.cross_framework_insights.priority_actions).toContain('Social Media Boost');
      expect(aggregated.executive_summary.overall_assessment).toContain(mockBusinessData.business_name);
    });
  });

  describe('Persona-Specific Formatting', () => {
    let mockAnalysis: any;

    beforeEach(() => {
      mockAnalysis = {
        swot_analysis: {
          strengths: [{ factor: 'Location', description: 'Great location', impact_score: 8, evidence: ['High traffic'] }],
          weaknesses: [{ factor: 'Social media', description: 'Weak presence', urgency_score: 7, improvement_suggestions: ['Post more'] }],
          opportunities: [{ factor: 'Events', description: 'Local events', potential_impact: 'High', timeline: 'short', effort_required: 'medium' }],
          threats: [{ factor: 'Competition', description: 'New competitors', risk_level: 'medium', mitigation_strategies: ['Differentiate'] }]
        },
        nutzwert_analyse: {
          initiatives: [
            {
              name: 'Social Media',
              weighted_score: 8.5,
              roi_projection: { investment_required: '500€', expected_return: '2000€', payback_period: '3 months', confidence_level: 'high', disclaimer: 'Unverbindlich' }
            }
          ]
        },
        executive_summary: {
          overall_assessment: 'Good potential with room for improvement',
          immediate_actions: ['Improve social media', 'Optimize GMB', 'Collect reviews'],
          long_term_strategy: ['Build brand', 'Expand reach']
        }
      };
    });

    test('should format for time-pressed persona', () => {
      const formatted = engine.formatForPersona(mockAnalysis, 'zeitknappe');

      expect(formatted).toHaveProperty('quick_summary');
      expect(formatted).toHaveProperty('top_3_actions');
      expect(formatted).toHaveProperty('time_investment');
      expect(formatted.top_3_actions).toHaveLength(3);
    });

    test('should format for overwhelmed persona', () => {
      const formatted = engine.formatForPersona(mockAnalysis, 'ueberforderte');

      expect(formatted).toHaveProperty('simple_explanation');
      expect(formatted).toHaveProperty('step_by_step_guide');
      expect(formatted).toHaveProperty('next_step_button');
      expect(formatted.step_by_step_guide).toBeInstanceOf(Array);
    });

    test('should format for skeptic persona', () => {
      const formatted = engine.formatForPersona(mockAnalysis, 'skeptiker');

      expect(formatted).toHaveProperty('data_summary');
      expect(formatted).toHaveProperty('detailed_analysis');
      expect(formatted).toHaveProperty('proof_points');
      expect(formatted).toHaveProperty('roi_calculations');
      expect(formatted.data_summary.frameworks_used).toBeInstanceOf(Array);
    });

    test('should return full analysis for professional persona', () => {
      const formatted = engine.formatForPersona(mockAnalysis, 'profi');

      expect(formatted).toEqual(mockAnalysis);
    });

    test('should format standard output for unknown persona', () => {
      const formatted = engine.formatForPersona(mockAnalysis, 'unknown');

      expect(formatted).toHaveProperty('executive_summary');
      expect(formatted).toHaveProperty('key_insights');
      expect(formatted).toHaveProperty('detailed_analysis');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing competitive data', () => {
      const dataWithoutCompetitive = {
        ...mockBusinessData,
        competitive_data: undefined
      };

      const criteria: FrameworkSelectionCriteria = {
        ...mockCriteria,
        data_availability: {
          ...mockCriteria.data_availability,
          competitive_data: false
        }
      };

      const frameworks = engine.selectFrameworks(criteria);
      const prompts = engine.generateFrameworkPrompts(frameworks, dataWithoutCompetitive, criteria);

      // Should not include Porter's Five Forces without competitive data
      expect(frameworks).not.toContain('porters_five_forces');
      expect(prompts.has('porters_five_forces')).toBe(false);
    });

    test('should handle missing cultural context', () => {
      const dataWithoutCulture = {
        ...mockBusinessData,
        cultural_context: undefined
      };

      const frameworks: FrameworkType[] = ['hofstede'];
      const prompts = engine.generateFrameworkPrompts(frameworks, dataWithoutCulture, mockCriteria);

      const hofstedePrompt = prompts.get('hofstede');
      expect(hofstedePrompt).toBe('');
    });

    test('should provide fallback for empty analysis results', () => {
      const emptyResults = new Map();
      const aggregated = engine.aggregateFrameworkResults(emptyResults, mockBusinessData);

      expect(aggregated.executive_summary).toBeDefined();
      expect(aggregated.executive_summary.overall_assessment).toContain(mockBusinessData.business_name);
    });
  });
});