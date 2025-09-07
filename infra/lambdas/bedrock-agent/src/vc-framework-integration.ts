/**
 * VC Framework Integration
 * 
 * Integrates the business framework analysis system with the existing
 * Visibility Check (VC) system, providing enhanced AI-powered analysis
 * for restaurant visibility and business intelligence.
 */

import { FrameworkOrchestrator, FrameworkRequest, FrameworkResponse } from './framework-orchestrator';
import { BusinessData } from './business-framework-engine';

export interface VCBusinessData {
  // From visibility_check_leads table
  lead_id: string;
  email: string;
  confirmed: boolean;
  analysis_status: 'pending_opt_in' | 'in_progress' | 'completed' | 'failed';
  
  // From visibility_check_context_data table
  business_name: string;
  location_city: string;
  location_region: string;
  location_country: string;
  postal_code?: string;
  main_category: string;
  sub_categories: string[];
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  gmb_url?: string;
  benchmark_urls: string[];
  persona_type?: 'skeptiker' | 'ueberforderte' | 'profi' | 'zeitknappe';
  user_goal?: string;
  language: 'de' | 'en';
  
  // Computed visibility metrics
  visibility_scores: {
    google_score: number;
    social_score: number;
    website_score: number;
    overall_score: number;
  };
  
  // Optional competitive analysis data
  competitive_analysis?: {
    local_competitors: Array<{
      name: string;
      url: string;
      estimated_score: number;
      strengths: string[];
    }>;
    industry_benchmarks: {
      average_score: number;
      top_10_percent_score: number;
      category_specific_metrics: Record<string, number>;
    };
  };
}

export interface VCFrameworkAnalysisResult {
  lead_id: string;
  analysis_id: string;
  framework_results: FrameworkResponse;
  vc_specific_insights: {
    visibility_improvement_potential: number; // 0-100
    quick_wins: Array<{
      action: string;
      expected_impact: string;
      effort_level: 'low' | 'medium' | 'high';
      implementation_time: string;
      visibility_score_improvement: number;
    }>;
    strategic_recommendations: Array<{
      category: 'google_presence' | 'social_media' | 'website' | 'reviews' | 'content';
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
      timeline: 'immediate' | 'short_term' | 'long_term';
      expected_roi: string;
    }>;
    competitive_positioning: {
      current_rank: 'below_average' | 'average' | 'above_average' | 'top_performer';
      gap_to_top_10_percent: number;
      key_differentiators: string[];
      competitive_threats: string[];
    };
  };
  persona_adapted_presentation: any;
  created_at: string;
  expires_at: string;
}

export class VCFrameworkIntegration {
  private orchestrator: FrameworkOrchestrator;

  constructor(region: string = 'us-east-1') {
    this.orchestrator = new FrameworkOrchestrator(region);
  }

  /**
   * Convert VC business data to framework engine format
   */
  private convertVCDataToBusinessData(vcData: VCBusinessData): BusinessData {
    return {
      business_name: vcData.business_name,
      location: {
        city: vcData.location_city,
        region: vcData.location_region,
        country: vcData.location_country,
        postal_code: vcData.postal_code
      },
      main_category: vcData.main_category,
      sub_categories: vcData.sub_categories,
      website_url: vcData.website_url,
      social_media: {
        instagram_url: vcData.instagram_url,
        facebook_url: vcData.facebook_url,
        gmb_url: vcData.gmb_url
      },
      visibility_metrics: {
        google_score: vcData.visibility_scores.google_score,
        social_score: vcData.visibility_scores.social_score,
        website_score: vcData.visibility_scores.website_score,
        overall_score: vcData.visibility_scores.overall_score
      },
      competitive_data: vcData.competitive_analysis ? {
        local_competitors: vcData.competitive_analysis.local_competitors.map(comp => ({
          name: comp.name,
          score: comp.estimated_score,
          strengths: comp.strengths
        })),
        industry_average: vcData.competitive_analysis.industry_benchmarks.average_score,
        top_10_percent: vcData.competitive_analysis.industry_benchmarks.top_10_percent_score
      } : undefined,
      cultural_context: this.inferCulturalContext(vcData.location_country, vcData.language)
    };
  }

  /**
   * Infer cultural context based on location and language
   */
  private inferCulturalContext(country: string, language: string): BusinessData['cultural_context'] {
    const culturalMappings: Record<string, any> = {
      'Germany': {
        country_code: 'DE',
        language: 'de',
        regional_preferences: ['Quality', 'Tradition', 'Punctuality', 'Efficiency', 'Local sourcing']
      },
      'Austria': {
        country_code: 'AT',
        language: 'de',
        regional_preferences: ['Quality', 'Tradition', 'Hospitality', 'Local ingredients']
      },
      'Switzerland': {
        country_code: 'CH',
        language: 'de',
        regional_preferences: ['Precision', 'Quality', 'Cleanliness', 'Premium service']
      }
    };

    return culturalMappings[country] || {
      country_code: country.substring(0, 2).toUpperCase(),
      language: language,
      regional_preferences: ['Quality', 'Service', 'Value']
    };
  }

  /**
   * Perform comprehensive VC framework analysis
   */
  async performVCFrameworkAnalysis(vcData: VCBusinessData): Promise<VCFrameworkAnalysisResult> {
    try {
      // Convert VC data to business framework format
      const businessData = this.convertVCDataToBusinessData(vcData);

      // Determine persona type (use provided or infer from user goal)
      const personaType = vcData.persona_type || this.inferPersonaFromUserGoal(vcData.user_goal);

      // Create framework request
      const frameworkRequest: FrameworkRequest = {
        business_data: businessData,
        user_preferences: {
          persona_type: personaType,
          analysis_depth: this.determineAnalysisDepth(vcData),
          language: vcData.language
        },
        context: {
          request_id: `vc-${vcData.lead_id}-${Date.now()}`,
          user_id: vcData.lead_id,
          session_id: `vc-session-${vcData.lead_id}`,
          timestamp: new Date().toISOString()
        }
      };

      // Execute framework analysis
      const frameworkResults = await this.orchestrator.processFrameworkAnalysis(frameworkRequest);

      // Generate VC-specific insights
      const vcInsights = this.generateVCSpecificInsights(vcData, frameworkResults);

      // Create persona-adapted presentation
      const personaPresentation = this.createVCPersonaPresentation(
        frameworkResults,
        vcInsights,
        personaType
      );

      return {
        lead_id: vcData.lead_id,
        analysis_id: frameworkRequest.context.request_id,
        framework_results: frameworkResults,
        vc_specific_insights: vcInsights,
        persona_adapted_presentation: personaPresentation,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

    } catch (error) {
      console.error('VC Framework analysis failed:', error);
      throw new Error(`VC Framework analysis failed for lead ${vcData.lead_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Infer persona type from user goal if not explicitly provided
   */
  private inferPersonaFromUserGoal(userGoal?: string): 'skeptiker' | 'ueberforderte' | 'profi' | 'zeitknappe' {
    if (!userGoal) return 'ueberforderte';

    const goal = userGoal.toLowerCase();
    
    if (goal.includes('schnell') || goal.includes('zeit') || goal.includes('sofort')) {
      return 'zeitknappe';
    }
    
    if (goal.includes('detail') || goal.includes('genau') || goal.includes('beweis') || goal.includes('daten')) {
      return 'skeptiker';
    }
    
    if (goal.includes('professionell') || goal.includes('agentur') || goal.includes('marketing') || goal.includes('strategie')) {
      return 'profi';
    }
    
    return 'ueberforderte';
  }

  /**
   * Determine analysis depth based on VC data completeness
   */
  private determineAnalysisDepth(vcData: VCBusinessData): 'quick' | 'standard' | 'comprehensive' {
    let dataPoints = 0;
    
    if (vcData.website_url) dataPoints++;
    if (vcData.instagram_url) dataPoints++;
    if (vcData.facebook_url) dataPoints++;
    if (vcData.gmb_url) dataPoints++;
    if (vcData.competitive_analysis) dataPoints += 2;
    if (vcData.benchmark_urls.length > 0) dataPoints++;
    
    if (dataPoints >= 6) return 'comprehensive';
    if (dataPoints >= 3) return 'standard';
    return 'quick';
  }

  /**
   * Generate VC-specific insights from framework results
   */
  private generateVCSpecificInsights(
    vcData: VCBusinessData,
    frameworkResults: FrameworkResponse
  ): VCFrameworkAnalysisResult['vc_specific_insights'] {
    
    const currentScore = vcData.visibility_scores.overall_score;
    const improvementPotential = Math.min(100 - currentScore, 40); // Max 40 point improvement

    // Extract quick wins from framework results
    const quickWins = this.extractQuickWins(frameworkResults, vcData);
    
    // Generate strategic recommendations
    const strategicRecommendations = this.generateStrategicRecommendations(frameworkResults, vcData);
    
    // Assess competitive positioning
    const competitivePositioning = this.assessCompetitivePositioning(vcData);

    return {
      visibility_improvement_potential: improvementPotential,
      quick_wins: quickWins,
      strategic_recommendations: strategicRecommendations,
      competitive_positioning: competitivePositioning
    };
  }

  /**
   * Extract quick wins from framework analysis
   */
  private extractQuickWins(
    frameworkResults: FrameworkResponse,
    vcData: VCBusinessData
  ): VCFrameworkAnalysisResult['vc_specific_insights']['quick_wins'] {
    const quickWins: VCFrameworkAnalysisResult['vc_specific_insights']['quick_wins'] = [];

    // Analyze current visibility gaps
    const scores = vcData.visibility_scores;
    
    if (scores.google_score < 70) {
      quickWins.push({
        action: 'Google My Business Profil vervollständigen',
        expected_impact: 'Sichtbarkeit in lokaler Suche +15-25%',
        effort_level: 'low',
        implementation_time: '30-60 Minuten',
        visibility_score_improvement: 8
      });
    }

    if (scores.social_score < 50) {
      quickWins.push({
        action: 'Social Media Profile aktivieren und erste Posts erstellen',
        expected_impact: 'Online-Präsenz +20-30%',
        effort_level: 'medium',
        implementation_time: '2-3 Stunden',
        visibility_score_improvement: 12
      });
    }

    if (!vcData.website_url || scores.website_score < 60) {
      quickWins.push({
        action: 'Website-Grundlagen optimieren (Kontakt, Öffnungszeiten, Speisekarte)',
        expected_impact: 'Conversion Rate +10-20%',
        effort_level: 'medium',
        implementation_time: '1-2 Stunden',
        visibility_score_improvement: 10
      });
    }

    // Add framework-specific quick wins
    if (frameworkResults.recommendations.immediate_actions.length > 0) {
      frameworkResults.recommendations.immediate_actions.slice(0, 2).forEach(action => {
        quickWins.push({
          action: action,
          expected_impact: 'Geschäftsergebnis verbessern',
          effort_level: 'medium',
          implementation_time: '1-3 Stunden',
          visibility_score_improvement: 5
        });
      });
    }

    return quickWins.slice(0, 5); // Limit to top 5 quick wins
  }

  /**
   * Generate strategic recommendations
   */
  private generateStrategicRecommendations(
    frameworkResults: FrameworkResponse,
    vcData: VCBusinessData
  ): VCFrameworkAnalysisResult['vc_specific_insights']['strategic_recommendations'] {
    const recommendations: VCFrameworkAnalysisResult['vc_specific_insights']['strategic_recommendations'] = [];

    // Google presence recommendations
    if (vcData.visibility_scores.google_score < 80) {
      recommendations.push({
        category: 'google_presence',
        recommendation: 'Systematisches Google My Business Management mit regelmäßigen Posts und Bewertungsmanagement',
        priority: 'high',
        timeline: 'immediate',
        expected_roi: '15-25% mehr lokale Anfragen'
      });
    }

    // Social media recommendations
    if (vcData.visibility_scores.social_score < 70) {
      recommendations.push({
        category: 'social_media',
        recommendation: 'Content-Strategie für Instagram und Facebook mit authentischen Food-Posts',
        priority: 'high',
        timeline: 'short_term',
        expected_roi: '20-30% mehr Reichweite'
      });
    }

    // Website recommendations
    if (vcData.visibility_scores.website_score < 70) {
      recommendations.push({
        category: 'website',
        recommendation: 'Mobile-optimierte Website mit Online-Reservierung und aktueller Speisekarte',
        priority: 'medium',
        timeline: 'short_term',
        expected_roi: '10-20% mehr Online-Reservierungen'
      });
    }

    // Add framework-derived strategic recommendations
    frameworkResults.recommendations.strategic_initiatives.slice(0, 2).forEach(initiative => {
      recommendations.push({
        category: 'content',
        recommendation: initiative,
        priority: 'medium',
        timeline: 'long_term',
        expected_roi: 'Langfristige Marktposition stärken'
      });
    });

    return recommendations;
  }

  /**
   * Assess competitive positioning
   */
  private assessCompetitivePositioning(
    vcData: VCBusinessData
  ): VCFrameworkAnalysisResult['vc_specific_insights']['competitive_positioning'] {
    const currentScore = vcData.visibility_scores.overall_score;
    
    let currentRank: 'below_average' | 'average' | 'above_average' | 'top_performer';
    let gapToTop10Percent = 0;

    if (vcData.competitive_analysis) {
      const industryAverage = vcData.competitive_analysis.industry_benchmarks.average_score;
      const top10Percent = vcData.competitive_analysis.industry_benchmarks.top_10_percent_score;
      
      gapToTop10Percent = Math.max(0, top10Percent - currentScore);
      
      if (currentScore >= top10Percent * 0.9) {
        currentRank = 'top_performer';
      } else if (currentScore >= industryAverage * 1.1) {
        currentRank = 'above_average';
      } else if (currentScore >= industryAverage * 0.9) {
        currentRank = 'average';
      } else {
        currentRank = 'below_average';
      }
    } else {
      // Fallback assessment without competitive data
      if (currentScore >= 80) currentRank = 'top_performer';
      else if (currentScore >= 65) currentRank = 'above_average';
      else if (currentScore >= 45) currentRank = 'average';
      else currentRank = 'below_average';
      
      gapToTop10Percent = Math.max(0, 85 - currentScore); // Assume 85 as top 10%
    }

    return {
      current_rank: currentRank,
      gap_to_top_10_percent: gapToTop10Percent,
      key_differentiators: this.identifyDifferentiators(vcData),
      competitive_threats: this.identifyThreats(vcData)
    };
  }

  /**
   * Identify key differentiators
   */
  private identifyDifferentiators(vcData: VCBusinessData): string[] {
    const differentiators: string[] = [];
    
    if (vcData.visibility_scores.google_score > 75) {
      differentiators.push('Starke lokale Online-Präsenz');
    }
    
    if (vcData.visibility_scores.social_score > 70) {
      differentiators.push('Aktive Social Media Community');
    }
    
    if (vcData.website_url && vcData.visibility_scores.website_score > 70) {
      differentiators.push('Professionelle Website');
    }
    
    if (vcData.sub_categories.length > 2) {
      differentiators.push('Vielfältiges Angebot');
    }
    
    return differentiators.length > 0 ? differentiators : ['Authentische Küche', 'Persönlicher Service'];
  }

  /**
   * Identify competitive threats
   */
  private identifyThreats(vcData: VCBusinessData): string[] {
    const threats: string[] = [];
    
    if (vcData.competitive_analysis) {
      const strongCompetitors = vcData.competitive_analysis.local_competitors.filter(c => c.estimated_score > vcData.visibility_scores.overall_score + 10);
      
      if (strongCompetitors.length > 0) {
        threats.push(`${strongCompetitors.length} lokale Konkurrenten mit stärkerer Online-Präsenz`);
      }
    }
    
    if (vcData.visibility_scores.google_score < 50) {
      threats.push('Schwache Auffindbarkeit in lokaler Suche');
    }
    
    if (vcData.visibility_scores.social_score < 40) {
      threats.push('Verpasste Chancen in Social Media Marketing');
    }
    
    return threats.length > 0 ? threats : ['Neue Konkurrenten', 'Veränderte Kundengewohnheiten'];
  }

  /**
   * Create persona-adapted presentation for VC results
   */
  private createVCPersonaPresentation(
    frameworkResults: FrameworkResponse,
    vcInsights: VCFrameworkAnalysisResult['vc_specific_insights'],
    personaType: string
  ): any {
    const basePresentation = {
      overall_score: frameworkResults.analysis_results.executive_summary?.overall_assessment || 'Analyse abgeschlossen',
      improvement_potential: vcInsights.visibility_improvement_potential,
      quick_wins: vcInsights.quick_wins,
      strategic_recommendations: vcInsights.strategic_recommendations,
      competitive_position: vcInsights.competitive_positioning
    };

    switch (personaType) {
      case 'zeitknappe':
        return {
          summary: `Ihr Sichtbarkeits-Score kann um ${vcInsights.visibility_improvement_potential} Punkte verbessert werden`,
          top_3_actions: vcInsights.quick_wins.slice(0, 3).map(qw => ({
            action: qw.action,
            time: qw.implementation_time,
            impact: qw.expected_impact
          })),
          total_time_investment: '2-4 Stunden für erste Verbesserungen',
          expected_result: 'Sichtbarkeit +20-30% in 4-6 Wochen'
        };

      case 'ueberforderte':
        return {
          simple_explanation: 'Ihre Online-Sichtbarkeit hat Verbesserungspotenzial. Wir zeigen Ihnen Schritt für Schritt, was zu tun ist.',
          step_by_step_guide: vcInsights.quick_wins.map((qw, index) => ({
            step: index + 1,
            title: qw.action,
            difficulty: qw.effort_level === 'low' ? 'Einfach' : qw.effort_level === 'medium' ? 'Mittel' : 'Anspruchsvoll',
            time_needed: qw.implementation_time,
            help_available: true
          })),
          support_message: 'Sie sind nicht allein - wir unterstützen Sie bei jedem Schritt.',
          next_step_button: 'Erste Verbesserung starten'
        };

      case 'skeptiker':
        return {
          data_summary: {
            analysis_confidence: frameworkResults.execution_metadata.confidence_score,
            frameworks_used: frameworkResults.frameworks_used,
            data_completeness: frameworkResults.execution_metadata.data_completeness,
            processing_time: frameworkResults.execution_metadata.processing_time_ms
          },
          detailed_metrics: basePresentation,
          proof_points: vcInsights.quick_wins.map(qw => ({
            claim: qw.expected_impact,
            evidence: `Basierend auf ${frameworkResults.frameworks_used.length} Analyse-Frameworks`,
            confidence: 'Hoch'
          })),
          competitive_analysis: vcInsights.competitive_positioning,
          roi_calculations: vcInsights.strategic_recommendations.map(sr => ({
            initiative: sr.recommendation,
            expected_roi: sr.expected_roi,
            timeline: sr.timeline,
            disclaimer: 'Alle Projektionen sind unverbindliche Schätzungen'
          }))
        };

      case 'profi':
        return {
          executive_summary: frameworkResults.analysis_results.executive_summary,
          comprehensive_analysis: frameworkResults.analysis_results,
          vc_insights: vcInsights,
          implementation_roadmap: {
            immediate: vcInsights.quick_wins,
            short_term: vcInsights.strategic_recommendations.filter(sr => sr.timeline === 'short_term'),
            long_term: vcInsights.strategic_recommendations.filter(sr => sr.timeline === 'long_term')
          },
          kpi_tracking: frameworkResults.recommendations.monitoring_kpis,
          export_options: ['PDF Report', 'CSV Data', 'API Access']
        };

      default:
        return basePresentation;
    }
  }

  /**
   * Get framework analysis status for VC lead
   */
  async getVCAnalysisStatus(_leadId: string): Promise<{
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    progress_percentage: number;
    estimated_completion?: string;
    error_message?: string;
  }> {
    // This would typically query a database or cache
    // For now, return a mock implementation
    return {
      status: 'not_started',
      progress_percentage: 0
    };
  }

  /**
   * Update VC analysis with new business data
   */
  async updateVCAnalysis(
    _leadId: string,
    _updatedData: Partial<VCBusinessData>
  ): Promise<VCFrameworkAnalysisResult> {
    // This would typically fetch existing data, merge updates, and re-run analysis
    throw new Error('Update functionality not yet implemented');
  }
}