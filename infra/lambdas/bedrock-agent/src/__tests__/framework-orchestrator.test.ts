/**
 * Tests for Framework Orchestrator
 */

import { FrameworkOrchestrator, FrameworkRequest } from '../framework-orchestrator';
import { BusinessData } from '../business-framework-engine';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  InvokeModelCommand: jest.fn()
}));

describe('FrameworkOrchestrator', () => {
  let orchestrator: FrameworkOrchestrator;
  let mockRequest: FrameworkRequest;
  let mockBusinessData: BusinessData;

  beforeEach(() => {
    orchestrator = new FrameworkOrchestrator('us-east-1');
    
    mockBusinessData = {
      business_name: 'Test Restaurant Berlin',
      location: {
        city: 'Berlin',
        region: 'Berlin',
        country: 'Germany',
        postal_code: '10115'
      },
      main_category: 'Restaurant',
      sub_categories: ['Italian', 'Pizza', 'Pasta'],
      website_url: 'https://test-restaurant-berlin.de',
      social_media: {
        instagram_url: 'https://instagram.com/testrestaurantberlin',
        facebook_url: 'https://facebook.com/testrestaurantberlin',
        gmb_url: 'https://goo.gl/maps/testrestaurant'
      },
      visibility_metrics: {
        google_score: 72,
        social_score: 58,
        website_score: 65,
        overall_score: 65
      },
      competitive_data: {
        local_competitors: [
          { name: 'Bella Italia', score: 78, strengths: ['Reviews', 'Location'] },
          { name: 'Pizza Express', score: 65, strengths: ['Speed', 'Price'] },
          { name: 'Trattoria Roma', score: 82, strengths: ['Authenticity', 'Atmosphere'] }
        ],
        industry_average: 68,
        top_10_percent: 85
      },
      cultural_context: {
        country_code: 'DE',
        language: 'de',
        regional_preferences: ['Quality ingredients', 'Traditional recipes', 'Local sourcing']
      }
    };

    mockRequest = {
      business_data: mockBusinessData,
      user_preferences: {
        persona_type: 'profi',
        analysis_depth: 'comprehensive',
        language: 'de'
      },
      context: {
        request_id: 'test-request-123',
        user_id: 'user-456',
        session_id: 'session-789',
        timestamp: new Date().toISOString()
      }
    };
  });

  describe('Data Assessment', () => {
    test('should assess data completeness correctly', () => {
      // Access private method through any cast for testing
      const assessment = (orchestrator as any).assessDataCompleteness(mockBusinessData);

      expect(assessment.competitive_data).toBe(true);
      expect(assessment.financial_metrics).toBe(true);
      expect(assessment.customer_feedback).toBe(true);
      expect(assessment.cultural_context).toBe(true);
      expect(assessment.completeness_score).toBe(100);
    });

    test('should handle incomplete data', () => {
      const incompleteData = {
        ...mockBusinessData,
        competitive_data: undefined,
        cultural_context: undefined,
        visibility_metrics: {
          ...mockBusinessData.visibility_metrics,
          social_score: 0
        }
      };

      const assessment = (orchestrator as any).assessDataCompleteness(incompleteData);

      expect(assessment.competitive_data).toBe(false);
      expect(assessment.cultural_context).toBe(false);
      expect(assessment.customer_feedback).toBe(false);
      expect(assessment.completeness_score).toBe(25); // Only financial_metrics true
    });
  });

  describe('Business Maturity Assessment', () => {
    test('should identify startup business', () => {
      const startupData = {
        ...mockBusinessData,
        visibility_metrics: { ...mockBusinessData.visibility_metrics, overall_score: 25 }
      };

      const maturity = (orchestrator as any).assessBusinessMaturity(startupData);
      expect(maturity).toBe('startup');
    });

    test('should identify established business', () => {
      const establishedData = {
        ...mockBusinessData,
        visibility_metrics: { ...mockBusinessData.visibility_metrics, overall_score: 55 }
      };

      const maturity = (orchestrator as any).assessBusinessMaturity(establishedData);
      expect(maturity).toBe('established');
    });

    test('should identify mature business', () => {
      const matureData = {
        ...mockBusinessData,
        visibility_metrics: { ...mockBusinessData.visibility_metrics, overall_score: 85 }
      };

      const maturity = (orchestrator as any).assessBusinessMaturity(matureData);
      expect(maturity).toBe('mature');
    });
  });

  describe('User Needs Extraction', () => {
    test('should extract needs for skeptiker persona', () => {
      const preferences = { ...mockRequest.user_preferences, persona_type: 'skeptiker' as const };
      const needs = (orchestrator as any).extractUserNeeds(preferences);

      expect(needs).toContain('detailed_metrics');
      expect(needs).toContain('proof_points');
      expect(needs).toContain('competitive_analysis');
    });

    test('should extract needs for zeitknappe persona', () => {
      const preferences = { ...mockRequest.user_preferences, persona_type: 'zeitknappe' as const };
      const needs = (orchestrator as any).extractUserNeeds(preferences);

      expect(needs).toContain('quick_insights');
      expect(needs).toContain('priority_actions');
      expect(needs).toContain('time_efficient');
    });

    test('should extract needs for comprehensive analysis', () => {
      const preferences = { ...mockRequest.user_preferences, analysis_depth: 'comprehensive' as const };
      const needs = (orchestrator as any).extractUserNeeds(preferences);

      expect(needs).toContain('multi_framework');
      expect(needs).toContain('cross_analysis');
      expect(needs).toContain('strategic_planning');
    });
  });

  describe('Available Frameworks', () => {
    test('should return all frameworks for complete data', () => {
      const available = orchestrator.getAvailableFrameworks(mockBusinessData);

      expect(available).toContain('swot');
      expect(available).toContain('porters_five_forces');
      expect(available).toContain('balanced_scorecard');
      expect(available).toContain('nutzwert');
      expect(available).toContain('hofstede');
      expect(available).toContain('comprehensive');
    });

    test('should limit frameworks for incomplete data', () => {
      const incompleteData = {
        ...mockBusinessData,
        competitive_data: undefined,
        cultural_context: undefined
      };

      const available = orchestrator.getAvailableFrameworks(incompleteData);

      expect(available).toContain('swot');
      expect(available).toContain('balanced_scorecard');
      expect(available).toContain('nutzwert');
      expect(available).not.toContain('porters_five_forces');
      expect(available).not.toContain('hofstede');
    });

    test('should only return SWOT for minimal data', () => {
      const minimalData = {
        ...mockBusinessData,
        competitive_data: undefined,
        cultural_context: undefined,
        visibility_metrics: {
          google_score: 0,
          social_score: 0,
          website_score: 0,
          overall_score: 0
        }
      };

      const available = orchestrator.getAvailableFrameworks(minimalData);

      expect(available).toEqual(['swot']);
    });
  });

  describe('Security Guards', () => {
    test('should build security guards with proper restrictions', () => {
      const guards = (orchestrator as any).buildSecurityGuards();

      expect(guards).toContain('SICHERHEITS-RICHTLINIEN');
      expect(guards).toContain('Du darfst:');
      expect(guards).toContain('Du darfst NICHT:');
      expect(guards).toContain('Personenbezogene Daten speichern');
      expect(guards).toContain('unverbindlich');
      expect(guards).toContain('strukturiertes JSON');
    });
  });

  describe('JSON Extraction', () => {
    test('should extract valid JSON from response', () => {
      const responseText = 'Here is the analysis: {"strengths": ["location"], "weaknesses": ["social"]}';
      const extracted = (orchestrator as any).extractJSONFromResponse(responseText);

      expect(extracted).toEqual({
        strengths: ['location'],
        weaknesses: ['social']
      });
    });

    test('should handle pure JSON response', () => {
      const responseText = '{"analysis": "complete", "score": 85}';
      const extracted = (orchestrator as any).extractJSONFromResponse(responseText);

      expect(extracted).toEqual({
        analysis: 'complete',
        score: 85
      });
    });

    test('should handle invalid JSON gracefully', () => {
      const responseText = 'This is not JSON at all';
      const extracted = (orchestrator as any).extractJSONFromResponse(responseText);

      expect(extracted).toHaveProperty('error');
      expect(extracted).toHaveProperty('raw_response');
      expect(extracted.raw_response).toBe(responseText);
    });
  });

  describe('Recommendation Generation', () => {
    test('should generate recommendations from SWOT analysis', () => {
      const mockAnalysis = {
        swot_analysis: {
          weaknesses: [
            {
              factor: 'Social Media',
              improvement_suggestions: ['Increase posting frequency', 'Engage with followers']
            },
            {
              factor: 'Reviews',
              improvement_suggestions: ['Ask customers for reviews', 'Respond to existing reviews']
            }
          ],
          opportunities: [
            {
              description: 'Partner with local events',
              timeline: 'medium'
            },
            {
              description: 'Expand delivery options',
              timeline: 'long'
            }
          ]
        }
      };

      const mockCriteria = {
        user_needs: ['strategic_planning'],
        data_availability: {
          competitive_data: true,
          financial_metrics: true,
          customer_feedback: true,
          cultural_context: true
        },
        analysis_depth: 'standard' as const,
        persona_type: 'profi' as const,
        business_maturity: 'established' as const
      };

      const recommendations = (orchestrator as any).generateRecommendations(mockAnalysis, mockCriteria);

      expect(recommendations.immediate_actions).toContain('Increase posting frequency');
      expect(recommendations.strategic_initiatives).toContain('Partner with local events');
      expect(recommendations.strategic_initiatives).toContain('Expand delivery options');
    });

    test('should generate recommendations from Nutzwertanalyse', () => {
      const mockAnalysis = {
        nutzwert_analyse: {
          initiatives: [
            { name: 'Google My Business optimization' },
            { name: 'Social media campaign' },
            { name: 'Review management system' }
          ]
        }
      };

      const mockCriteria = {
        user_needs: ['priority_actions'],
        data_availability: {
          competitive_data: false,
          financial_metrics: true,
          customer_feedback: false,
          cultural_context: false
        },
        analysis_depth: 'quick' as const,
        persona_type: 'zeitknappe' as const,
        business_maturity: 'startup' as const
      };

      const recommendations = (orchestrator as any).generateRecommendations(mockAnalysis, mockCriteria);

      expect(recommendations.immediate_actions).toContain('Google My Business optimization');
      expect(recommendations.immediate_actions).toContain('Social media campaign');
      expect(recommendations.immediate_actions).toContain('Review management system');
    });

    test('should provide fallback recommendations when analysis is empty', () => {
      const emptyAnalysis = {};
      const mockCriteria = {
        user_needs: [],
        data_availability: {
          competitive_data: false,
          financial_metrics: false,
          customer_feedback: false,
          cultural_context: false
        },
        analysis_depth: 'quick' as const,
        persona_type: 'ueberforderte' as const,
        business_maturity: 'startup' as const
      };

      const recommendations = (orchestrator as any).generateRecommendations(emptyAnalysis, mockCriteria);

      expect(recommendations.immediate_actions).toContain('Google My Business Profil vervollständigen');
      expect(recommendations.strategic_initiatives).toContain('Digitale Marketingstrategie entwickeln');
      expect(recommendations.monitoring_kpis).toContain('Google My Business Aufrufe');
    });
  });

  describe('Confidence Score Calculation', () => {
    test('should calculate high confidence for complete data and multiple frameworks', () => {
      const mockResults = new Map();
      mockResults.set('swot', { valid: true });
      mockResults.set('porters_five_forces', { valid: true });
      mockResults.set('balanced_scorecard', { valid: true });
      mockResults.set('nutzwert', { valid: true });

      const dataAssessment = { completeness_score: 100 };

      const confidence = (orchestrator as any).calculateConfidenceScore(mockResults, dataAssessment);

      expect(confidence).toBeGreaterThan(80);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    test('should calculate lower confidence for incomplete data', () => {
      const mockResults = new Map();
      mockResults.set('swot', { valid: true });

      const dataAssessment = { completeness_score: 25 };

      const confidence = (orchestrator as any).calculateConfidenceScore(mockResults, dataAssessment);

      expect(confidence).toBeLessThan(50);
      expect(confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle framework execution errors gracefully', async () => {
      // Mock Bedrock client to throw error
      const mockSend = jest.fn().mockRejectedValue(new Error('Bedrock API error'));
      (orchestrator as any).bedrockClient.send = mockSend;

      const quickRequest = {
        ...mockRequest,
        user_preferences: {
          ...mockRequest.user_preferences,
          analysis_depth: 'quick' as const,
          specific_frameworks: ['swot' as const]
        }
      };

      await expect(orchestrator.processFrameworkAnalysis(quickRequest)).rejects.toThrow('Framework analysis failed');
    });
  });

  describe('Integration Tests', () => {
    test('should process complete framework analysis request', async () => {
      // Mock successful Bedrock response
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              strengths: [{ factor: 'Location', description: 'Prime location', impact_score: 8, evidence: ['High foot traffic'] }],
              weaknesses: [{ factor: 'Social media', description: 'Limited presence', urgency_score: 7, improvement_suggestions: ['Increase activity'] }],
              opportunities: [{ factor: 'Events', description: 'Local partnerships', potential_impact: 'High', timeline: 'short', effort_required: 'medium' }],
              threats: [{ factor: 'Competition', description: 'New competitors', risk_level: 'medium', mitigation_strategies: ['Differentiate'] }]
            })
          }],
          usage: { input_tokens: 1000, output_tokens: 500 }
        }))
      };

      const mockSend = jest.fn().mockResolvedValue(mockResponse);
      (orchestrator as any).bedrockClient.send = mockSend;

      const quickRequest = {
        ...mockRequest,
        user_preferences: {
          ...mockRequest.user_preferences,
          analysis_depth: 'quick' as const,
          specific_frameworks: ['swot' as const]
        }
      };

      const result = await orchestrator.processFrameworkAnalysis(quickRequest);

      expect(result).toBeDefined();
      expect(result.request_id).toBe(quickRequest.context.request_id);
      expect(result.frameworks_used).toContain('swot');
      expect(result.execution_metadata.tokens_used).toBeGreaterThan(0);
      expect(result.execution_metadata.processing_time_ms).toBeGreaterThan(0);
      expect(result.persona_adapted_output).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });
});