/**
 * VC Template Integration System
 * Integrates with existing VC API endpoints (/vc/start, /vc/result) for seamless AI enhancement
 */

import { 
  VCAnalysisTemplate, 
  TemplateVariables, 
  templateRegistry 
} from './prompt-templates';
import { createPromptContract, PromptContract } from './prompt-security';

// VC-specific interfaces matching existing system
export interface VCLeadData {
  id: string;
  email: string;
  name?: string;
  business_name?: string;
  business_category?: string;
  business_location?: string;
  marketing_consent?: boolean;
  locale: 'de' | 'en';
  created_at: string;
  confirmed_at?: string;
}

export interface VCContextData {
  lead_id: string;
  business_profile: {
    name: string;
    category: string;
    location?: string;
    website_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    gmb_url?: string;
    benchmark_urls?: string[];
  };
  user_goals?: string[];
  persona_type?: string;
  data_quality_score?: number;
  analysis_preferences?: {
    frameworks: string[];
    detail_level: 'basic' | 'detailed' | 'comprehensive';
    focus_areas: string[];
  };
}

export interface VCAnalysisResult {
  lead_id: string;
  analysis_type: 'visibility_check';
  summary_score: number;
  frameworks: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    porters_five_forces: {
      competitive_rivalry: { score: number; analysis: string };
      supplier_power: { score: number; analysis: string };
      buyer_power: { score: number; analysis: string };
      threat_of_substitution: { score: number; analysis: string };
      threat_of_new_entry: { score: number; analysis: string };
    };
    balanced_scorecard: {
      financial: { score: number; metrics: string[]; recommendations: string[] };
      customer: { score: number; metrics: string[]; recommendations: string[] };
      process: { score: number; metrics: string[]; recommendations: string[] };
      learning: { score: number; metrics: string[]; recommendations: string[] };
    };
  };
  content_strategy: {
    storytelling_ideas: string[];
    photo_recommendations: string[];
    seasonal_opportunities: string[];
    usp_suggestions: string[];
  };
  quick_wins: Array<{
    action: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    time_estimate: string;
    roi_estimate?: string;
  }>;
  long_term_strategy: string[];
  next_steps: string[];
  created_at: string;
  ai_metadata: {
    model_used: string;
    token_usage: number;
    processing_time_ms: number;
    confidence_score: number;
  };
}

/**
 * VC Token System Integration
 * Supports existing VC-Token system for personalized analysis results
 */
export interface VCToken {
  token: string;
  lead_id: string;
  expires_at: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  result_data?: VCAnalysisResult;
}

/**
 * VC Template Builder - Creates prompts for VC analysis
 */
export class VCTemplateBuilder {
  private template: VCAnalysisTemplate;
  private contract: PromptContract;

  constructor(userPersona?: string) {
    this.contract = createPromptContract('vc_analysis', userPersona);
    this.template = new VCAnalysisTemplate(this.contract);
  }

  /**
   * Build VC analysis prompt from lead and context data
   */
  buildAnalysisPrompt(leadData: VCLeadData, contextData: VCContextData): string {
    const variables: TemplateVariables = {
      // User context
      user_persona: contextData.persona_type || this.detectPersonaFromData(leadData, contextData),
      user_language: leadData.locale,
      user_experience_level: this.inferExperienceLevel(contextData),

      // Business context
      business_name: contextData.business_profile.name,
      business_category: contextData.business_profile.category,
      business_location: contextData.business_profile.location,
      business_profile: contextData.business_profile,

      // Analysis context
      goals: contextData.user_goals || this.generateDefaultGoals(contextData.business_profile.category),
      data_quality_score: contextData.data_quality_score || this.calculateDataQualityScore(contextData.business_profile),
      analysis_type: 'comprehensive_visibility_check',
      output_format: 'structured',

      // System context
      request_id: `vc_${leadData.id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      feature_flags: {
        include_seasonal_analysis: true,
        include_competitor_benchmarking: true,
        include_content_suggestions: true
      }
    };

    return this.template.generate(variables);
  }

  /**
   * Build persona detection prompt for unknown users
   */
  buildPersonaDetectionPrompt(leadData: VCLeadData, userResponses: string[]): string {
    const personaTemplate = templateRegistry.getTemplate('persona_detection_v1');
    if (!personaTemplate) {
      throw new Error('Persona detection template not found');
    }

    const variables: TemplateVariables = {
      user_responses: userResponses.join('\n\n'),
      user_language: leadData.locale,
      business_context: leadData.business_category || 'restaurant'
    };

    // Use persona detection template
    const contract = createPromptContract('persona_detection');
    const template = new (require('./prompt-templates').PersonaDetectionTemplate)(contract);
    return template.generate(variables);
  }

  /**
   * Detect persona from available data (fallback method)
   */
  private detectPersonaFromData(leadData: VCLeadData, contextData: VCContextData): string {
    // Simple heuristic-based persona detection
    const profile = contextData.business_profile;
    const hasWebsite = !!profile.website_url;
    const hasSocialMedia = !!(profile.instagram_url || profile.facebook_url);
    const hasGMB = !!profile.gmb_url;
    
    const digitalPresenceScore = [hasWebsite, hasSocialMedia, hasGMB].filter(Boolean).length;
    
    // Default persona assignment based on digital presence
    if (digitalPresenceScore === 0) {
      return 'Der Überforderte'; // No digital presence = overwhelmed
    } else if (digitalPresenceScore === 3 && contextData.analysis_preferences?.detail_level === 'comprehensive') {
      return 'Der Profi'; // Full presence + wants detailed analysis = professional
    } else if (contextData.user_goals && contextData.user_goals.some(goal => goal.includes('schnell') || goal.includes('quick'))) {
      return 'Der Zeitknappe'; // Mentions speed = time-pressed
    } else {
      return 'Der Skeptiker'; // Default to skeptic for data-driven approach
    }
  }

  /**
   * Infer experience level from context data
   */
  private inferExperienceLevel(contextData: VCContextData): 'beginner' | 'intermediate' | 'expert' {
    const profile = contextData.business_profile;
    const digitalChannels = [
      profile.website_url,
      profile.instagram_url,
      profile.facebook_url,
      profile.gmb_url
    ].filter(Boolean).length;

    if (digitalChannels >= 3 && contextData.analysis_preferences?.detail_level === 'comprehensive') {
      return 'expert';
    } else if (digitalChannels >= 2) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  /**
   * Generate default goals based on business category
   */
  private generateDefaultGoals(category: string): string[] {
    const categoryGoals: Record<string, string[]> = {
      'restaurant': [
        'Mehr lokale Sichtbarkeit in Google-Suche',
        'Steigerung der Online-Reservierungen',
        'Verbesserung der Google My Business Präsenz',
        'Aufbau einer stärkeren Social Media Präsenz'
      ],
      'cafe': [
        'Erhöhung der Laufkundschaft',
        'Stärkung der Community-Bindung',
        'Verbesserung der Instagram-Präsenz',
        'Optimierung für lokale Suchanfragen'
      ],
      'bar': [
        'Steigerung der Abendgäste',
        'Event-Marketing optimieren',
        'Social Media Engagement erhöhen',
        'Lokale Partnerschaften aufbauen'
      ],
      'hotel': [
        'Erhöhung der direkten Buchungen',
        'Verbesserung der Online-Bewertungen',
        'Optimierung der Buchungsplattform-Präsenz',
        'Stärkung der regionalen Sichtbarkeit'
      ]
    };

    return categoryGoals[category.toLowerCase()] || categoryGoals['restaurant'];
  }

  /**
   * Calculate data quality score based on available information
   */
  private calculateDataQualityScore(profile: any): number {
    let score = 0;
    const maxScore = 100;

    // Basic information (40 points)
    if (profile.name) score += 10;
    if (profile.category) score += 10;
    if (profile.location) score += 20;

    // Digital presence (40 points)
    if (profile.website_url) score += 15;
    if (profile.gmb_url) score += 15;
    if (profile.instagram_url) score += 5;
    if (profile.facebook_url) score += 5;

    // Additional data (20 points)
    if (profile.benchmark_urls && profile.benchmark_urls.length > 0) score += 10;
    if (Object.keys(profile).length > 6) score += 10; // Has additional fields

    return Math.min(score, maxScore);
  }
}

/**
 * VC Analysis Result Parser
 * Parses Claude's structured response into VCAnalysisResult format
 */
export class VCResultParser {
  /**
   * Parse Claude's response into structured VC result
   */
  static parseAnalysisResponse(
    claudeResponse: string,
    leadId: string,
    aiMetadata: {
      model_used: string;
      token_usage: number;
      processing_time_ms: number;
    }
  ): VCAnalysisResult {
    try {
      // Try to extract JSON if Claude returned structured data
      const jsonMatch = claudeResponse.match(/```json\n([\s\S]*?)\n```/);
      let structuredData: any = {};

      if (jsonMatch) {
        try {
          structuredData = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.warn('Failed to parse JSON from Claude response, using text parsing');
        }
      }

      // Parse text-based response if no JSON found
      if (!structuredData.summary_score) {
        structuredData = this.parseTextResponse(claudeResponse);
      }

      // Build standardized result
      const result: VCAnalysisResult = {
        lead_id: leadId,
        analysis_type: 'visibility_check',
        summary_score: structuredData.summary_score || this.extractSummaryScore(claudeResponse),
        frameworks: {
          swot: this.extractSWOT(claudeResponse, structuredData),
          porters_five_forces: this.extractPortersFiveForces(claudeResponse, structuredData),
          balanced_scorecard: this.extractBalancedScorecard(claudeResponse, structuredData)
        },
        content_strategy: this.extractContentStrategy(claudeResponse, structuredData),
        quick_wins: this.extractQuickWins(claudeResponse, structuredData),
        long_term_strategy: this.extractLongTermStrategy(claudeResponse, structuredData),
        next_steps: this.extractNextSteps(claudeResponse, structuredData),
        created_at: new Date().toISOString(),
        ai_metadata: {
          ...aiMetadata,
          confidence_score: this.calculateConfidenceScore(claudeResponse)
        }
      };

      return result;
    } catch (error) {
      console.error('Failed to parse VC analysis response:', error);
      throw new Error('Failed to parse AI analysis response');
    }
  }

  /**
   * Parse text-based response when no JSON is available
   */
  private static parseTextResponse(response: string): any {
    const sections = this.splitIntoSections(response);
    return {
      summary_score: this.extractScoreFromText(sections.summary || ''),
      swot: this.extractSWOTFromText(sections.swot || ''),
      // Add more parsing logic as needed
    };
  }

  /**
   * Extract SWOT analysis from response
   */
  private static extractSWOT(response: string, structuredData: any): any {
    if (structuredData.swot) return structuredData.swot;

    const swotSection = this.extractSection(response, 'SWOT');
    return {
      strengths: this.extractListItems(swotSection, 'Stärken|Strengths'),
      weaknesses: this.extractListItems(swotSection, 'Schwächen|Weaknesses'),
      opportunities: this.extractListItems(swotSection, 'Chancen|Opportunities'),
      threats: this.extractListItems(swotSection, 'Risiken|Threats')
    };
  }

  /**
   * Extract Porter's Five Forces analysis
   */
  private static extractPortersFiveForces(response: string, structuredData: any): any {
    if (structuredData.porters_five_forces) return structuredData.porters_five_forces;

    const porterSection = this.extractSection(response, 'PORTER');
    return {
      competitive_rivalry: { score: 7, analysis: this.extractAnalysis(porterSection, 'Wettbewerb') },
      supplier_power: { score: 5, analysis: this.extractAnalysis(porterSection, 'Lieferanten') },
      buyer_power: { score: 8, analysis: this.extractAnalysis(porterSection, 'Kunden') },
      threat_of_substitution: { score: 6, analysis: this.extractAnalysis(porterSection, 'Substitute') },
      threat_of_new_entry: { score: 7, analysis: this.extractAnalysis(porterSection, 'Neue Anbieter') }
    };
  }

  /**
   * Extract Balanced Scorecard analysis
   */
  private static extractBalancedScorecard(response: string, structuredData: any): any {
    if (structuredData.balanced_scorecard) return structuredData.balanced_scorecard;

    const scorecardSection = this.extractSection(response, 'BALANCED SCORECARD');
    return {
      financial: {
        score: 7,
        metrics: this.extractListItems(scorecardSection, 'Finanz'),
        recommendations: this.extractListItems(scorecardSection, 'Finanz.*Empfehlung')
      },
      customer: {
        score: 8,
        metrics: this.extractListItems(scorecardSection, 'Kunden'),
        recommendations: this.extractListItems(scorecardSection, 'Kunden.*Empfehlung')
      },
      process: {
        score: 6,
        metrics: this.extractListItems(scorecardSection, 'Prozess'),
        recommendations: this.extractListItems(scorecardSection, 'Prozess.*Empfehlung')
      },
      learning: {
        score: 5,
        metrics: this.extractListItems(scorecardSection, 'Lernen|Entwicklung'),
        recommendations: this.extractListItems(scorecardSection, 'Lernen.*Empfehlung|Entwicklung.*Empfehlung')
      }
    };
  }

  /**
   * Extract content strategy recommendations
   */
  private static extractContentStrategy(response: string, structuredData: any): any {
    if (structuredData.content_strategy) return structuredData.content_strategy;

    const contentSection = this.extractSection(response, 'CONTENT|STRATEGIE');
    return {
      storytelling_ideas: this.extractListItems(contentSection, 'Storytelling|Story'),
      photo_recommendations: this.extractListItems(contentSection, 'Foto|Bild|Photo'),
      seasonal_opportunities: this.extractListItems(contentSection, 'Saison|Season'),
      usp_suggestions: this.extractListItems(contentSection, 'USP|Alleinstellung')
    };
  }

  /**
   * Extract quick wins
   */
  private static extractQuickWins(response: string, structuredData: any): any[] {
    if (structuredData.quick_wins) return structuredData.quick_wins;

    const quickWinsSection = this.extractSection(response, 'QUICK WIN|SOFORT');
    const items = this.extractListItems(quickWinsSection, '');
    
    return items.slice(0, 5).map((item, index) => ({
      action: item,
      effort: index < 2 ? 'low' : 'medium',
      impact: index < 3 ? 'high' : 'medium',
      time_estimate: index < 2 ? '15-30 Minuten' : '1-2 Stunden',
      roi_estimate: this.extractROIEstimate(item)
    }));
  }

  /**
   * Extract long-term strategy
   */
  private static extractLongTermStrategy(response: string, structuredData: any): string[] {
    if (structuredData.long_term_strategy) return structuredData.long_term_strategy;

    const strategySection = this.extractSection(response, 'LANGFRISTIG|STRATEGIE');
    return this.extractListItems(strategySection, '');
  }

  /**
   * Extract next steps
   */
  private static extractNextSteps(response: string, structuredData: any): string[] {
    if (structuredData.next_steps) return structuredData.next_steps;

    const stepsSection = this.extractSection(response, 'NÄCHSTE SCHRITTE|NEXT STEPS');
    return this.extractListItems(stepsSection, '');
  }

  // Helper methods for text parsing
  private static extractSection(text: string, sectionPattern: string): string {
    const regex = new RegExp(`(${sectionPattern})[\\s\\S]*?(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);
    return match ? match[0] : '';
  }

  private static extractListItems(text: string, pattern: string = ''): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const item = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '');
        if (!pattern || item.match(new RegExp(pattern, 'i'))) {
          items.push(item);
        }
      }
    }
    
    return items;
  }

  private static extractAnalysis(text: string, keyword: string): string {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
        return lines.slice(i, i + 3).join(' ').trim();
      }
    }
    return `Analyse für ${keyword} nicht verfügbar`;
  }

  private static extractSummaryScore(response: string): number {
    const scoreMatch = response.match(/(\d+)\/100|(\d+)%|Score:\s*(\d+)/i);
    if (scoreMatch) {
      return parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
    }
    return 75; // Default score
  }

  private static extractROIEstimate(action: string): string | undefined {
    const roiMatch = action.match(/(\d+)€|(\d+)\s*Euro/i);
    if (roiMatch) {
      return `~${roiMatch[1] || roiMatch[2]}€ monatlich`;
    }
    return undefined;
  }

  private static calculateConfidenceScore(response: string): number {
    // Simple confidence calculation based on response completeness
    let score = 0.5; // Base score
    
    if (response.includes('SWOT')) score += 0.1;
    if (response.includes('Porter')) score += 0.1;
    if (response.includes('Balanced Scorecard')) score += 0.1;
    if (response.includes('Quick Win')) score += 0.1;
    if (response.length > 2000) score += 0.1;
    if (response.match(/\d+/g)?.length > 5) score += 0.1; // Contains numbers/metrics
    
    return Math.min(score, 1.0);
  }

  private static splitIntoSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const sectionHeaders = ['SWOT', 'PORTER', 'BALANCED SCORECARD', 'CONTENT', 'QUICK WIN'];
    
    for (const header of sectionHeaders) {
      const section = this.extractSection(text, header);
      if (section) {
        sections[header.toLowerCase().replace(' ', '_')] = section;
      }
    }
    
    return sections;
  }
}

/**
 * VC API Integration Helper
 * Provides methods to integrate with existing VC endpoints
 */
export class VCAPIIntegration {
  /**
   * Process VC start request with AI enhancement
   */
  static async enhanceVCStart(leadData: VCLeadData): Promise<{
    token: string;
    ai_ready: boolean;
    persona_hint?: string;
  }> {
    // Generate VC token (existing logic)
    const token = this.generateVCToken(leadData.id);
    
    // Quick persona detection if we have enough data
    let persona_hint: string | undefined;
    if (leadData.business_name && leadData.business_category) {
      const builder = new VCTemplateBuilder();
      const contextData: VCContextData = {
        lead_id: leadData.id,
        business_profile: {
          name: leadData.business_name,
          category: leadData.business_category,
          location: leadData.business_location
        }
      };
      
      persona_hint = builder['detectPersonaFromData'](leadData, contextData);
    }
    
    return {
      token,
      ai_ready: true,
      persona_hint
    };
  }

  /**
   * Process VC result request with AI analysis
   */
  static async enhanceVCResult(
    token: string,
    contextData: VCContextData
  ): Promise<VCAnalysisResult> {
    // Validate token and get lead data (existing logic)
    const leadData = await this.validateTokenAndGetLead(token);
    
    // Build AI analysis prompt
    const builder = new VCTemplateBuilder(contextData.persona_type);
    const prompt = builder.buildAnalysisPrompt(leadData, contextData);
    
    // This would integrate with the existing Bedrock invocation
    // For now, return the prompt that would be sent to Claude
    console.log('Generated VC Analysis Prompt:', prompt);
    
    // Placeholder - in real implementation, this would call invokeBedrock
    throw new Error('AI analysis integration pending - prompt generated successfully');
  }

  /**
   * Generate VC token (placeholder for existing logic)
   */
  private static generateVCToken(leadId: string): string {
    return `vc_${leadId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate token and get lead data (placeholder for existing logic)
   */
  private static async validateTokenAndGetLead(token: string): Promise<VCLeadData> {
    // This would integrate with existing token validation logic
    throw new Error('Token validation integration pending');
  }
}

// Export main integration points
export {
  VCTemplateBuilder,
  VCResultParser,
  VCAPIIntegration
};