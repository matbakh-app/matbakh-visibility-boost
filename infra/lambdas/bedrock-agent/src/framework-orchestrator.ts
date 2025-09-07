/**
 * Framework Orchestrator
 * 
 * Manages the selection, execution, and aggregation of multiple business frameworks
 * based on user needs, data availability, and persona requirements.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { 
  BusinessFrameworkEngine, 
  BusinessData, 
  FrameworkSelectionCriteria, 
  FrameworkType,
  ComprehensiveBusinessAnalysis 
} from './business-framework-engine';

export interface FrameworkRequest {
  business_data: BusinessData;
  user_preferences: {
    persona_type: 'skeptiker' | 'ueberforderte' | 'profi' | 'zeitknappe';
    analysis_depth: 'quick' | 'standard' | 'comprehensive';
    specific_frameworks?: FrameworkType[];
    language: 'de' | 'en';
  };
  context: {
    request_id: string;
    user_id?: string;
    session_id?: string;
    timestamp: string;
  };
}

export interface FrameworkResponse {
  request_id: string;
  analysis_results: ComprehensiveBusinessAnalysis | any;
  frameworks_used: FrameworkType[];
  execution_metadata: {
    processing_time_ms: number;
    tokens_used: number;
    confidence_score: number;
    data_completeness: number;
  };
  persona_adapted_output: any;
  recommendations: {
    immediate_actions: string[];
    strategic_initiatives: string[];
    monitoring_kpis: string[];
  };
}

export class FrameworkOrchestrator {
  private bedrockClient: BedrockRuntimeClient;
  private frameworkEngine: BusinessFrameworkEngine;
  private modelId: string = 'anthropic.claude-3-5-sonnet-20240620-v1:0';

  constructor(region: string = 'us-east-1') {
    this.bedrockClient = new BedrockRuntimeClient({ region });
    this.frameworkEngine = new BusinessFrameworkEngine();
  }

  /**
   * Main orchestration method - processes framework analysis request
   */
  async processFrameworkAnalysis(request: FrameworkRequest): Promise<FrameworkResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Assess data availability and completeness
      const dataAssessment = this.assessDataCompleteness(request.business_data);
      
      // 2. Create selection criteria
      const selectionCriteria: FrameworkSelectionCriteria = {
        user_needs: this.extractUserNeeds(request.user_preferences),
        data_availability: dataAssessment,
        analysis_depth: request.user_preferences.analysis_depth,
        persona_type: request.user_preferences.persona_type,
        business_maturity: this.assessBusinessMaturity(request.business_data)
      };

      // 3. Select appropriate frameworks
      const selectedFrameworks = request.user_preferences.specific_frameworks || 
        this.frameworkEngine.selectFrameworks(selectionCriteria);

      // 4. Generate framework-specific prompts
      const frameworkPrompts = this.frameworkEngine.generateFrameworkPrompts(
        selectedFrameworks,
        request.business_data,
        selectionCriteria
      );

      // 5. Execute framework analyses with Claude
      const frameworkResults = new Map<FrameworkType, any>();
      let totalTokens = 0;

      for (const [framework, prompt] of frameworkPrompts) {
        try {
          const result = await this.executeFrameworkAnalysis(framework, prompt, request.context);
          frameworkResults.set(framework, result.analysis);
          totalTokens += result.tokens_used;
        } catch (error) {
          console.error(`Framework ${framework} analysis failed:`, error);
          // Continue with other frameworks
        }
      }

      // 6. Aggregate results if multiple frameworks
      let analysisResults: ComprehensiveBusinessAnalysis | any;
      if (frameworkResults.size > 1) {
        analysisResults = this.frameworkEngine.aggregateFrameworkResults(
          frameworkResults,
          request.business_data
        );
      } else {
        analysisResults = frameworkResults.values().next().value;
      }

      // 7. Adapt output for persona
      const personaAdaptedOutput = this.frameworkEngine.formatForPersona(
        analysisResults,
        request.user_preferences.persona_type
      );

      // 8. Generate recommendations
      const recommendations = this.generateRecommendations(analysisResults, selectionCriteria);

      // 9. Calculate confidence and processing metrics
      const processingTime = Date.now() - startTime;
      const confidenceScore = this.calculateConfidenceScore(frameworkResults, dataAssessment);

      return {
        request_id: request.context.request_id,
        analysis_results: analysisResults,
        frameworks_used: selectedFrameworks,
        execution_metadata: {
          processing_time_ms: processingTime,
          tokens_used: totalTokens,
          confidence_score: confidenceScore,
          data_completeness: dataAssessment.completeness_score
        },
        persona_adapted_output: personaAdaptedOutput,
        recommendations
      };

    } catch (error) {
      console.error('Framework orchestration failed:', error);
      throw new Error(`Framework analysis failed: ${error.message}`);
    }
  }

  /**
   * Execute individual framework analysis with Claude
   */
  private async executeFrameworkAnalysis(
    framework: FrameworkType,
    prompt: string,
    context: FrameworkRequest['context']
  ): Promise<{ analysis: any; tokens_used: number }> {
    
    const securityGuards = this.buildSecurityGuards();
    const fullPrompt = `${securityGuards}\n\n${prompt}\n\n**Wichtig:** Antworte ausschließlich mit strukturiertem JSON gemäß dem angegebenen Interface.`;

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ]
      }),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract JSON from Claude's response
    const analysisResult = this.extractJSONFromResponse(responseBody.content[0].text);
    
    return {
      analysis: analysisResult,
      tokens_used: responseBody.usage?.input_tokens + responseBody.usage?.output_tokens || 0
    };
  }

  /**
   * Build security guards for Claude prompts
   */
  private buildSecurityGuards(): string {
    return `
**🔒 SICHERHEITS-RICHTLINIEN (Nicht entfernbar):**

Du arbeitest als Business-Analyse-Assistent für matbakh.app, eine Restaurant-Management-Plattform.

**Du darfst:**
- Geschäftsdaten analysieren und strukturierte Empfehlungen geben
- Branchenspezifische Insights für die Gastronomie liefern
- ROI-Projektionen erstellen (immer mit "unverbindlich" Disclaimer)
- Wettbewerbsanalysen basierend auf öffentlichen Daten durchführen

**Du darfst NICHT:**
- Personenbezogene Daten speichern oder weiterleiten
- Externe APIs direkt aufrufen
- Garantien für Geschäftsergebnisse geben
- Sensible Unternehmensdaten außerhalb des Kontexts verwenden

**Ausgabe-Anforderungen:**
- Immer strukturiertes JSON gemäß vorgegebenem Interface
- Deutsche Sprache für Gastronomiebetriebe
- Konkrete, umsetzbare Empfehlungen
- ROI-Projektionen mit Disclaimer "Alle Projektionen sind unverbindlich"
`;
  }

  /**
   * Extract JSON from Claude's response text
   */
  private extractJSONFromResponse(responseText: string): any {
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try to parse the entire response
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to extract JSON from response:', error);
      // Return a fallback structure
      return {
        error: 'Failed to parse analysis results',
        raw_response: responseText
      };
    }
  }

  /**
   * Assess data completeness for framework selection
   */
  private assessDataCompleteness(businessData: BusinessData): FrameworkSelectionCriteria['data_availability'] & { completeness_score: number } {
    let completenessScore = 0;
    let totalChecks = 0;

    // Check competitive data
    const hasCompetitiveData = !!businessData.competitive_data;
    completenessScore += hasCompetitiveData ? 25 : 0;
    totalChecks += 25;

    // Check financial metrics (inferred from visibility scores)
    const hasFinancialMetrics = businessData.visibility_metrics.overall_score > 0;
    completenessScore += hasFinancialMetrics ? 25 : 0;
    totalChecks += 25;

    // Check customer feedback (inferred from social scores)
    const hasCustomerFeedback = businessData.visibility_metrics.social_score > 0;
    completenessScore += hasCustomerFeedback ? 25 : 0;
    totalChecks += 25;

    // Check cultural context
    const hasCulturalContext = !!businessData.cultural_context;
    completenessScore += hasCulturalContext ? 25 : 0;
    totalChecks += 25;

    return {
      competitive_data: hasCompetitiveData,
      financial_metrics: hasFinancialMetrics,
      customer_feedback: hasCustomerFeedback,
      cultural_context: hasCulturalContext,
      completeness_score: (completenessScore / totalChecks) * 100
    };
  }

  /**
   * Extract user needs from preferences
   */
  private extractUserNeeds(preferences: FrameworkRequest['user_preferences']): string[] {
    const needs: string[] = [];

    switch (preferences.persona_type) {
      case 'skeptiker':
        needs.push('detailed_metrics', 'proof_points', 'competitive_analysis');
        break;
      case 'profi':
        needs.push('comprehensive_analysis', 'strategic_frameworks', 'advanced_metrics');
        break;
      case 'zeitknappe':
        needs.push('quick_insights', 'priority_actions', 'time_efficient');
        break;
      case 'ueberforderte':
        needs.push('simple_explanations', 'step_by_step', 'guidance');
        break;
    }

    if (preferences.analysis_depth === 'comprehensive') {
      needs.push('multi_framework', 'cross_analysis', 'strategic_planning');
    }

    return needs;
  }

  /**
   * Assess business maturity level
   */
  private assessBusinessMaturity(businessData: BusinessData): FrameworkSelectionCriteria['business_maturity'] {
    const overallScore = businessData.visibility_metrics.overall_score;
    
    if (overallScore < 30) {
      return 'startup';
    } else if (overallScore < 70) {
      return 'established';
    } else {
      return 'mature';
    }
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    analysisResults: any,
    criteria: FrameworkSelectionCriteria
  ): FrameworkResponse['recommendations'] {
    const recommendations = {
      immediate_actions: [] as string[],
      strategic_initiatives: [] as string[],
      monitoring_kpis: [] as string[]
    };

    // Extract recommendations based on available analysis
    if (analysisResults.swot_analysis) {
      // Add immediate actions from weaknesses
      analysisResults.swot_analysis.weaknesses?.slice(0, 3).forEach((weakness: any) => {
        if (weakness.improvement_suggestions) {
          recommendations.immediate_actions.push(...weakness.improvement_suggestions.slice(0, 1));
        }
      });

      // Add strategic initiatives from opportunities
      analysisResults.swot_analysis.opportunities?.slice(0, 3).forEach((opportunity: any) => {
        if (opportunity.timeline === 'medium' || opportunity.timeline === 'long') {
          recommendations.strategic_initiatives.push(opportunity.description);
        }
      });
    }

    if (analysisResults.nutzwert_analyse) {
      // Add top priority actions
      analysisResults.nutzwert_analyse.initiatives?.slice(0, 3).forEach((initiative: any) => {
        recommendations.immediate_actions.push(initiative.name);
      });
    }

    if (analysisResults.balanced_scorecard) {
      // Add KPIs from scorecard
      recommendations.monitoring_kpis.push(...(analysisResults.balanced_scorecard.key_performance_indicators || []));
    }

    // Ensure we have fallback recommendations
    if (recommendations.immediate_actions.length === 0) {
      recommendations.immediate_actions = [
        'Google My Business Profil vervollständigen',
        'Kundenbewertungen aktiv managen',
        'Social Media Präsenz aufbauen'
      ];
    }

    if (recommendations.strategic_initiatives.length === 0) {
      recommendations.strategic_initiatives = [
        'Digitale Marketingstrategie entwickeln',
        'Kundenbindungsprogramm implementieren',
        'Lokale Partnerschaften aufbauen'
      ];
    }

    if (recommendations.monitoring_kpis.length === 0) {
      recommendations.monitoring_kpis = [
        'Google My Business Aufrufe',
        'Online-Bewertungen Durchschnitt',
        'Social Media Engagement Rate',
        'Website-Traffic aus lokaler Suche'
      ];
    }

    return recommendations;
  }

  /**
   * Calculate confidence score based on analysis quality
   */
  private calculateConfidenceScore(
    frameworkResults: Map<FrameworkType, any>,
    dataAssessment: { completeness_score: number }
  ): number {
    let confidenceScore = 0;

    // Base confidence on data completeness
    confidenceScore += dataAssessment.completeness_score * 0.4;

    // Add confidence based on number of successful frameworks
    const successfulFrameworks = frameworkResults.size;
    confidenceScore += Math.min(successfulFrameworks * 15, 60); // Max 60 points for frameworks

    // Ensure score is between 0 and 100
    return Math.min(Math.max(confidenceScore, 0), 100);
  }

  /**
   * Validate framework results for quality assurance
   */
  private validateFrameworkResults(results: Map<FrameworkType, any>): boolean {
    for (const [framework, result] of results) {
      if (!result || typeof result !== 'object') {
        console.warn(`Invalid result for framework ${framework}`);
        return false;
      }

      // Framework-specific validation
      switch (framework) {
        case 'swot':
          if (!result.strengths || !result.weaknesses || !result.opportunities || !result.threats) {
            console.warn(`Incomplete SWOT analysis`);
            return false;
          }
          break;
        case 'nutzwert':
          if (!result.initiatives || !Array.isArray(result.initiatives)) {
            console.warn(`Invalid Nutzwertanalyse structure`);
            return false;
          }
          break;
      }
    }

    return true;
  }

  /**
   * Get available frameworks for a given business context
   */
  getAvailableFrameworks(businessData: BusinessData): FrameworkType[] {
    const available: FrameworkType[] = ['swot']; // Always available

    // Add frameworks based on data availability
    if (businessData.competitive_data) {
      available.push('porters_five_forces');
    }

    if (businessData.visibility_metrics.overall_score > 0) {
      available.push('balanced_scorecard', 'nutzwert');
    }

    if (businessData.cultural_context) {
      available.push('hofstede');
    }

    // Comprehensive analysis available if multiple frameworks possible
    if (available.length >= 3) {
      available.push('comprehensive');
    }

    return available;
  }
}