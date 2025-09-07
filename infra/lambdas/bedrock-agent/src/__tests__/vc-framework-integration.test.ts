/**
 * Tests for VC Framework Integration
 */

import { VCFrameworkIntegration, VCBusinessData } from '../vc-framework-integration';
import { FrameworkResponse } from '../framework-orchestrator';

// Mock the framework orchestrator
jest.mock('../framework-orchestrator', () => ({
  FrameworkOrchestrator: jest.fn().mockImplementation(() => ({
    processFrameworkAnalysis: jest.fn()
  }))
}));

describe('VCFrameworkIntegration', () => {
  let integration: VCFrameworkIntegration;
  let mockVCData: VCBusinessData;
  let mockFrameworkResponse: FrameworkResponse;

  beforeEach(() => {
    integration = new VCFrameworkIntegration('us-east-1');
    
    mockVCData = {
      lead_id: 'lead-123',
      email: 'test@restaurant.de',
      confirmed: true,
      analysis_status: 'in_progress',
      business_name: 'Bella Vista Restaurant',
      location_city: 'Munich',
      location_region: 'Bavaria',
      location_country: 'Germany',
      postal_code: '80331',
      main_category: 'Italian Restaurant',
      sub_categories: ['Pizza', 'Pasta', 'Wine Bar'],
      website_url: 'https://bellavista-munich.de',
      instagram_url: 'https://instagram.com/bellavistamunich',
      facebook_url: 'https://facebook.com/bellavistamunich',
      gmb_url: 'https://goo.gl/maps/bellavista',
      benchmark_urls: [
        'https://competitor1.de',
        'https://competitor2.de',
        'https://competitor3.de'
      ],
      persona_type: 'profi',
      user_goal: 'Improve online visibility and attract more customers',
      language: 'de',
      visibility_scores: {
        google_score: 68,
        social_score: 55,
        website_score: 72,
        overall_score: 65
      },
      competitive_analysis: {
        local_competitors: [
          {
            name: 'Trattoria Roma',
            url: 'https://trattoria-roma.de',
            estimated_score: 78,
            strengths: ['Reviews', 'Location', 'Authenticity']
          },
          {
            name: 'Pizza Express',
            url: 'https://pizza-express-munich.de',
            estimated_score: 62,
            strengths: ['Speed', 'Price', 'Delivery']
          }
        ],
        industry_benchmarks: {
          average_score: 64,
          top_10_percent_score: 85,
          category_specific_metrics: {
            'google_presence': 70,
            'social_engagement': 58,
            'website_quality': 66
          }
        }
      }
    };

    mockFrameworkResponse = {
      request_id: 'vc-lead-123-1234567890',
      analysis_results: {
        swot_analysis: {
          strengths: [
            {
              factor: 'Location',
              description: 'Prime location in Munich city center',
              impact_score: 8,
              evidence: ['High foot traffic', 'Tourist area', 'Public transport access']
            }
          ],
          weaknesses: [
            {
              factor: 'Social Media Presence',
              description: 'Limited social media activity',
              urgency_score: 7,
              improvement_suggestions: ['Increase posting frequency', 'Engage with followers', 'Share food photos']
            }
          ],
          opportunities: [
            {
              factor: 'Local Events',
              description: 'Partner with local events and festivals',
              potential_impact: 'High',
              timeline: 'short',
              effort_required: 'medium'
            }
          ],
          threats: [
            {
              factor: 'Competition',
              description: 'Strong local competition',
              risk_level: 'medium',
              mitigation_strategies: ['Differentiate through authenticity', 'Focus on customer service']
            }
          ]
        },
        executive_summary: {
          overall_assessment: 'Bella Vista Restaurant shows good potential with room for digital improvement',
          key_strengths: ['Prime location', 'Authentic cuisine', 'Good website'],
          critical_gaps: ['Social media activity', 'Review management', 'Local SEO'],
          immediate_actions: ['Boost social media presence', 'Optimize Google My Business', 'Implement review strategy'],
          long_term_strategy: ['Build brand recognition', 'Expand digital presence', 'Develop customer loyalty program']
        }
      },
      frameworks_used: ['swot', 'balanced_scorecard', 'nutzwert'],
      execution_metadata: {
        processing_time_ms: 15000,
        tokens_used: 2500,
        confidence_score: 85,
        data_completeness: 90
      },
      persona_adapted_output: {},
      recommendations: {
        immediate_actions: ['Optimize Google My Business profile', 'Increase social media activity', 'Implement review management'],
        strategic_initiatives: ['Develop content marketing strategy', 'Build local partnerships', 'Create customer loyalty program'],
        monitoring_kpis: ['Google My Business views', 'Social media engagement', 'Online reviews rating', 'Website traffic']
      }
    };
  });

  describe('Data Conversion', () => {
    test('should convert VC data to business framework format', () => {
      const businessData = (integration as any).convertVCDataToBusinessData(mockVCData);

      expect(businessData.business_name).toBe(mockVCData.business_name);
      expect(businessData.location.city).toBe(mockVCData.location_city);
      expect(businessData.location.region).toBe(mockVCData.location_region);
      expect(businessData.location.country).toBe(mockVCData.location_country);
      expect(businessData.main_category).toBe(mockVCData.main_category);
      expect(businessData.sub_categories).toEqual(mockVCData.sub_categories);
      expect(businessData.website_url).toBe(mockVCData.website_url);
      expect(businessData.social_media.instagram_url).toBe(mockVCData.instagram_url);
      expect(businessData.visibility_metrics.overall_score).toBe(mockVCData.visibility_scores.overall_score);
    });

    test('should handle missing competitive data', () => {
      const vcDataWithoutCompetitive = { ...mockVCData, competitive_analysis: undefined };
      const businessData = (integration as any).convertVCDataToBusinessData(vcDataWithoutCompetitive);

      expect(businessData.competitive_data).toBeUndefined();
    });

    test('should infer cultural context correctly', () => {
      const culturalContext = (integration as any).inferCulturalContext('Germany', 'de');

      expect(culturalContext.country_code).toBe('DE');
      expect(culturalContext.language).toBe('de');
      expect(culturalContext.regional_preferences).toContain('Quality');
      expect(culturalContext.regional_preferences).toContain('Tradition');
    });
  });

  describe('Persona Inference', () => {
    test('should infer zeitknappe persona from user goal', () => {
      const persona = (integration as any).inferPersonaFromUserGoal('Ich brauche schnell Ergebnisse');
      expect(persona).toBe('zeitknappe');
    });

    test('should infer skeptiker persona from user goal', () => {
      const persona = (integration as any).inferPersonaFromUserGoal('Ich möchte detaillierte Daten und Beweise sehen');
      expect(persona).toBe('skeptiker');
    });

    test('should infer profi persona from user goal', () => {
      const persona = (integration as any).inferPersonaFromUserGoal('Professionelle Marketing-Strategie entwickeln');
      expect(persona).toBe('profi');
    });

    test('should default to ueberforderte persona', () => {
      const persona = (integration as any).inferPersonaFromUserGoal('Ich weiß nicht genau was ich brauche');
      expect(persona).toBe('ueberforderte');
    });

    test('should default to ueberforderte when no goal provided', () => {
      const persona = (integration as any).inferPersonaFromUserGoal(undefined);
      expect(persona).toBe('ueberforderte');
    });
  });

  describe('Analysis Depth Determination', () => {
    test('should determine comprehensive analysis for complete data', () => {
      const depth = (integration as any).determineAnalysisDepth(mockVCData);
      expect(depth).toBe('comprehensive');
    });

    test('should determine standard analysis for moderate data', () => {
      const moderateData = {
        ...mockVCData,
        competitive_analysis: undefined,
        benchmark_urls: []
      };
      const depth = (integration as any).determineAnalysisDepth(moderateData);
      expect(depth).toBe('standard');
    });

    test('should determine quick analysis for minimal data', () => {
      const minimalData = {
        ...mockVCData,
        website_url: undefined,
        instagram_url: undefined,
        facebook_url: undefined,
        competitive_analysis: undefined,
        benchmark_urls: []
      };
      const depth = (integration as any).determineAnalysisDepth(minimalData);
      expect(depth).toBe('quick');
    });
  });

  describe('Quick Wins Extraction', () => {
    test('should extract quick wins based on visibility scores', () => {
      const quickWins = (integration as any).extractQuickWins(mockFrameworkResponse, mockVCData);

      expect(quickWins).toBeInstanceOf(Array);
      expect(quickWins.length).toBeGreaterThan(0);
      expect(quickWins.length).toBeLessThanOrEqual(5);
      
      const firstWin = quickWins[0];
      expect(firstWin).toHaveProperty('action');
      expect(firstWin).toHaveProperty('expected_impact');
      expect(firstWin).toHaveProperty('effort_level');
      expect(firstWin).toHaveProperty('implementation_time');
      expect(firstWin).toHaveProperty('visibility_score_improvement');
    });

    test('should suggest Google My Business optimization for low Google score', () => {
      const lowGoogleScoreData = {
        ...mockVCData,
        visibility_scores: { ...mockVCData.visibility_scores, google_score: 45 }
      };

      const quickWins = (integration as any).extractQuickWins(mockFrameworkResponse, lowGoogleScoreData);
      
      const gmbWin = quickWins.find((win: any) => win.action.includes('Google My Business'));
      expect(gmbWin).toBeDefined();
      expect(gmbWin.effort_level).toBe('low');
    });

    test('should suggest social media activation for low social score', () => {
      const lowSocialScoreData = {
        ...mockVCData,
        visibility_scores: { ...mockVCData.visibility_scores, social_score: 30 }
      };

      const quickWins = (integration as any).extractQuickWins(mockFrameworkResponse, lowSocialScoreData);
      
      const socialWin = quickWins.find((win: any) => win.action.includes('Social Media'));
      expect(socialWin).toBeDefined();
      expect(socialWin.effort_level).toBe('medium');
    });
  });

  describe('Strategic Recommendations', () => {
    test('should generate strategic recommendations', () => {
      const recommendations = (integration as any).generateStrategicRecommendations(mockFrameworkResponse, mockVCData);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      
      const firstRec = recommendations[0];
      expect(firstRec).toHaveProperty('category');
      expect(firstRec).toHaveProperty('recommendation');
      expect(firstRec).toHaveProperty('priority');
      expect(firstRec).toHaveProperty('timeline');
      expect(firstRec).toHaveProperty('expected_roi');
    });

    test('should prioritize Google presence for low Google scores', () => {
      const lowGoogleData = {
        ...mockVCData,
        visibility_scores: { ...mockVCData.visibility_scores, google_score: 45 }
      };

      const recommendations = (integration as any).generateStrategicRecommendations(mockFrameworkResponse, lowGoogleData);
      
      const googleRec = recommendations.find((rec: any) => rec.category === 'google_presence');
      expect(googleRec).toBeDefined();
      expect(googleRec.priority).toBe('high');
    });
  });

  describe('Competitive Positioning', () => {
    test('should assess competitive positioning correctly', () => {
      const positioning = (integration as any).assessCompetitivePositioning(mockVCData);

      expect(positioning).toHaveProperty('current_rank');
      expect(positioning).toHaveProperty('gap_to_top_10_percent');
      expect(positioning).toHaveProperty('key_differentiators');
      expect(positioning).toHaveProperty('competitive_threats');
      
      expect(['below_average', 'average', 'above_average', 'top_performer']).toContain(positioning.current_rank);
      expect(positioning.gap_to_top_10_percent).toBeGreaterThanOrEqual(0);
    });

    test('should identify above average performance', () => {
      const aboveAverageData = {
        ...mockVCData,
        visibility_scores: { ...mockVCData.visibility_scores, overall_score: 75 }
      };

      const positioning = (integration as any).assessCompetitivePositioning(aboveAverageData);
      expect(positioning.current_rank).toBe('above_average');
    });

    test('should calculate gap to top 10 percent', () => {
      const positioning = (integration as any).assessCompetitivePositioning(mockVCData);
      const expectedGap = mockVCData.competitive_analysis!.industry_benchmarks.top_10_percent_score - mockVCData.visibility_scores.overall_score;
      
      expect(positioning.gap_to_top_10_percent).toBe(expectedGap);
    });
  });

  describe('Persona-Adapted Presentations', () => {
    test('should create zeitknappe presentation', () => {
      const vcInsights = {
        visibility_improvement_potential: 25,
        quick_wins: [
          {
            action: 'Google My Business optimieren',
            expected_impact: 'Sichtbarkeit +15%',
            effort_level: 'low' as const,
            implementation_time: '30 Minuten',
            visibility_score_improvement: 8
          }
        ],
        strategic_recommendations: [],
        competitive_positioning: {
          current_rank: 'average' as const,
          gap_to_top_10_percent: 20,
          key_differentiators: ['Location'],
          competitive_threats: ['Competition']
        }
      };

      const presentation = (integration as any).createVCPersonaPresentation(
        mockFrameworkResponse,
        vcInsights,
        'zeitknappe'
      );

      expect(presentation).toHaveProperty('summary');
      expect(presentation).toHaveProperty('top_3_actions');
      expect(presentation).toHaveProperty('total_time_investment');
      expect(presentation).toHaveProperty('expected_result');
      expect(presentation.summary).toContain('25 Punkte');
    });

    test('should create ueberforderte presentation', () => {
      const vcInsights = {
        visibility_improvement_potential: 25,
        quick_wins: [
          {
            action: 'Google My Business optimieren',
            expected_impact: 'Sichtbarkeit +15%',
            effort_level: 'low' as const,
            implementation_time: '30 Minuten',
            visibility_score_improvement: 8
          }
        ],
        strategic_recommendations: [],
        competitive_positioning: {
          current_rank: 'average' as const,
          gap_to_top_10_percent: 20,
          key_differentiators: ['Location'],
          competitive_threats: ['Competition']
        }
      };

      const presentation = (integration as any).createVCPersonaPresentation(
        mockFrameworkResponse,
        vcInsights,
        'ueberforderte'
      );

      expect(presentation).toHaveProperty('simple_explanation');
      expect(presentation).toHaveProperty('step_by_step_guide');
      expect(presentation).toHaveProperty('support_message');
      expect(presentation).toHaveProperty('next_step_button');
      expect(presentation.step_by_step_guide).toBeInstanceOf(Array);
    });

    test('should create skeptiker presentation', () => {
      const vcInsights = {
        visibility_improvement_potential: 25,
        quick_wins: [
          {
            action: 'Google My Business optimieren',
            expected_impact: 'Sichtbarkeit +15%',
            effort_level: 'low' as const,
            implementation_time: '30 Minuten',
            visibility_score_improvement: 8
          }
        ],
        strategic_recommendations: [
          {
            category: 'google_presence' as const,
            recommendation: 'GMB Management',
            priority: 'high' as const,
            timeline: 'immediate' as const,
            expected_roi: '15% mehr Anfragen'
          }
        ],
        competitive_positioning: {
          current_rank: 'average' as const,
          gap_to_top_10_percent: 20,
          key_differentiators: ['Location'],
          competitive_threats: ['Competition']
        }
      };

      const presentation = (integration as any).createVCPersonaPresentation(
        mockFrameworkResponse,
        vcInsights,
        'skeptiker'
      );

      expect(presentation).toHaveProperty('data_summary');
      expect(presentation).toHaveProperty('detailed_metrics');
      expect(presentation).toHaveProperty('proof_points');
      expect(presentation).toHaveProperty('competitive_analysis');
      expect(presentation).toHaveProperty('roi_calculations');
      expect(presentation.data_summary.confidence_level).toBeDefined();
    });

    test('should create profi presentation', () => {
      const vcInsights = {
        visibility_improvement_potential: 25,
        quick_wins: [
          {
            action: 'Google My Business optimieren',
            expected_impact: 'Sichtbarkeit +15%',
            effort_level: 'low' as const,
            implementation_time: '30 Minuten',
            visibility_score_improvement: 8
          }
        ],
        strategic_recommendations: [
          {
            category: 'google_presence' as const,
            recommendation: 'GMB Management',
            priority: 'high' as const,
            timeline: 'immediate' as const,
            expected_roi: '15% mehr Anfragen'
          }
        ],
        competitive_positioning: {
          current_rank: 'average' as const,
          gap_to_top_10_percent: 20,
          key_differentiators: ['Location'],
          competitive_threats: ['Competition']
        }
      };

      const presentation = (integration as any).createVCPersonaPresentation(
        mockFrameworkResponse,
        vcInsights,
        'profi'
      );

      expect(presentation).toHaveProperty('executive_summary');
      expect(presentation).toHaveProperty('comprehensive_analysis');
      expect(presentation).toHaveProperty('vc_insights');
      expect(presentation).toHaveProperty('implementation_roadmap');
      expect(presentation).toHaveProperty('kpi_tracking');
      expect(presentation).toHaveProperty('export_options');
    });
  });

  describe('Full Integration Test', () => {
    test('should perform complete VC framework analysis', async () => {
      // Mock the orchestrator response
      const mockOrchestrator = (integration as any).orchestrator;
      mockOrchestrator.processFrameworkAnalysis.mockResolvedValue(mockFrameworkResponse);

      const result = await integration.performVCFrameworkAnalysis(mockVCData);

      expect(result).toBeDefined();
      expect(result.lead_id).toBe(mockVCData.lead_id);
      expect(result.analysis_id).toContain('vc-lead-123');
      expect(result.framework_results).toEqual(mockFrameworkResponse);
      expect(result.vc_specific_insights).toBeDefined();
      expect(result.persona_adapted_presentation).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(result.expires_at).toBeDefined();

      // Verify orchestrator was called with correct parameters
      expect(mockOrchestrator.processFrameworkAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          business_data: expect.objectContaining({
            business_name: mockVCData.business_name,
            location: expect.objectContaining({
              city: mockVCData.location_city
            })
          }),
          user_preferences: expect.objectContaining({
            persona_type: mockVCData.persona_type,
            language: mockVCData.language
          })
        })
      );
    });

    test('should handle analysis errors gracefully', async () => {
      const mockOrchestrator = (integration as any).orchestrator;
      mockOrchestrator.processFrameworkAnalysis.mockRejectedValue(new Error('Bedrock API error'));

      await expect(integration.performVCFrameworkAnalysis(mockVCData))
        .rejects.toThrow('VC Framework analysis failed for lead lead-123');
    });
  });

  describe('Status and Updates', () => {
    test('should get analysis status', async () => {
      const status = await integration.getVCAnalysisStatus('lead-123');

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('progress_percentage');
      expect(['not_started', 'in_progress', 'completed', 'failed']).toContain(status.status);
      expect(status.progress_percentage).toBeGreaterThanOrEqual(0);
      expect(status.progress_percentage).toBeLessThanOrEqual(100);
    });

    test('should throw error for update functionality', async () => {
      await expect(integration.updateVCAnalysis('lead-123', { business_name: 'Updated Name' }))
        .rejects.toThrow('Update functionality not yet implemented');
    });
  });
});