/**
 * Template Feature Flags System
 * Enables dynamic template composition based on feature flags
 */

import { TemplateVariables } from './prompt-templates';

// Feature flag definitions
export interface TemplateFeatureFlags {
  // Analysis frameworks
  include_swot: boolean;
  include_porter_five_forces: boolean;
  include_balanced_scorecard: boolean;
  include_blue_ocean: boolean;
  include_pestel: boolean;

  // Content sections
  include_content_strategy: boolean;
  include_seasonal_analysis: boolean;
  include_competitor_benchmarking: boolean;
  include_roi_estimates: boolean;
  include_quick_wins: boolean;
  include_long_term_strategy: boolean;

  // Persona adaptations
  enable_persona_soft_rules: boolean;
  enable_dynamic_persona_detection: boolean;
  enable_persona_learning: boolean;

  // Output formats
  enable_structured_json: boolean;
  enable_executive_summary: boolean;
  enable_action_items: boolean;
  enable_export_options: boolean;

  // Security and compliance
  enable_strict_pii_redaction: boolean;
  enable_enhanced_security_audit: boolean;
  enable_compliance_checks: boolean;

  // Performance optimizations
  enable_prompt_caching: boolean;
  enable_response_streaming: boolean;
  enable_token_optimization: boolean;

  // Experimental features
  enable_multi_language_output: boolean;
  enable_voice_tone_adaptation: boolean;
  enable_industry_specific_insights: boolean;
  enable_predictive_recommendations: boolean;
}

// Default feature flags
export const DEFAULT_FEATURE_FLAGS: TemplateFeatureFlags = {
  // Core analysis frameworks (stable)
  include_swot: true,
  include_porter_five_forces: true,
  include_balanced_scorecard: true,
  include_blue_ocean: false, // Advanced feature
  include_pestel: false, // Advanced feature

  // Content sections (stable)
  include_content_strategy: true,
  include_seasonal_analysis: true,
  include_competitor_benchmarking: true,
  include_roi_estimates: true,
  include_quick_wins: true,
  include_long_term_strategy: true,

  // Persona features (stable)
  enable_persona_soft_rules: true,
  enable_dynamic_persona_detection: false, // Experimental
  enable_persona_learning: false, // Experimental

  // Output formats (stable)
  enable_structured_json: true,
  enable_executive_summary: true,
  enable_action_items: true,
  enable_export_options: false, // Premium feature

  // Security (always enabled)
  enable_strict_pii_redaction: true,
  enable_enhanced_security_audit: true,
  enable_compliance_checks: true,

  // Performance (gradual rollout)
  enable_prompt_caching: false,
  enable_response_streaming: false,
  enable_token_optimization: true,

  // Experimental (disabled by default)
  enable_multi_language_output: false,
  enable_voice_tone_adaptation: false,
  enable_industry_specific_insights: false,
  enable_predictive_recommendations: false
};

/**
 * Feature Flag Manager
 */
export class TemplateFeatureFlagManager {
  private flags: TemplateFeatureFlags;
  private rolloutPercentages: Record<string, number>;

  constructor(customFlags?: Partial<TemplateFeatureFlags>) {
    this.flags = { ...DEFAULT_FEATURE_FLAGS, ...customFlags };
    this.rolloutPercentages = this.loadRolloutPercentages();
  }

  /**
   * Load rollout percentages from environment or config
   */
  private loadRolloutPercentages(): Record<string, number> {
    return {
      include_blue_ocean: parseInt(process.env.BLUE_OCEAN_ROLLOUT || '10'),
      include_pestel: parseInt(process.env.PESTEL_ROLLOUT || '5'),
      enable_dynamic_persona_detection: parseInt(process.env.DYNAMIC_PERSONA_ROLLOUT || '20'),
      enable_persona_learning: parseInt(process.env.PERSONA_LEARNING_ROLLOUT || '15'),
      enable_export_options: parseInt(process.env.EXPORT_OPTIONS_ROLLOUT || '50'),
      enable_prompt_caching: parseInt(process.env.PROMPT_CACHING_ROLLOUT || '30'),
      enable_response_streaming: parseInt(process.env.RESPONSE_STREAMING_ROLLOUT || '25'),
      enable_multi_language_output: parseInt(process.env.MULTI_LANGUAGE_ROLLOUT || '10'),
      enable_voice_tone_adaptation: parseInt(process.env.VOICE_TONE_ROLLOUT || '15'),
      enable_industry_specific_insights: parseInt(process.env.INDUSTRY_INSIGHTS_ROLLOUT || '20'),
      enable_predictive_recommendations: parseInt(process.env.PREDICTIVE_ROLLOUT || '5')
    };
  }

  /**
   * Get effective flags for a user (considering rollout percentages)
   */
  getEffectiveFlags(userId?: string, sessionId?: string): TemplateFeatureFlags {
    const effectiveFlags = { ...this.flags };
    const userHash = this.getUserHash(userId || sessionId || 'anonymous');

    // Apply rollout percentages
    Object.entries(this.rolloutPercentages).forEach(([flagName, percentage]) => {
      if (percentage > 0 && percentage < 100) {
        const isInRollout = (userHash % 100) < percentage;
        effectiveFlags[flagName as keyof TemplateFeatureFlags] = isInRollout;
      }
    });

    return effectiveFlags;
  }

  /**
   * Generate consistent hash for user-based rollouts
   */
  private getUserHash(identifier: string): number {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if a specific feature is enabled
   */
  isEnabled(flagName: keyof TemplateFeatureFlags, userId?: string, sessionId?: string): boolean {
    const effectiveFlags = this.getEffectiveFlags(userId, sessionId);
    return effectiveFlags[flagName];
  }

  /**
   * Get flags for a specific persona
   */
  getPersonaFlags(persona: string, userId?: string, sessionId?: string): TemplateFeatureFlags {
    const baseFlags = this.getEffectiveFlags(userId, sessionId);

    // Persona-specific overrides
    switch (persona) {
      case 'Der Skeptiker':
        return {
          ...baseFlags,
          include_roi_estimates: true,
          include_competitor_benchmarking: true,
          enable_structured_json: true,
          include_porter_five_forces: true,
          include_balanced_scorecard: true
        };

      case 'Der Überforderte':
        return {
          ...baseFlags,
          include_blue_ocean: false,
          include_pestel: false,
          include_porter_five_forces: false, // Too complex
          include_balanced_scorecard: false, // Too complex
          include_quick_wins: true,
          enable_structured_json: false, // Prefer simple text
          include_long_term_strategy: false // Focus on immediate steps
        };

      case 'Der Profi':
        return {
          ...baseFlags,
          include_blue_ocean: true,
          include_pestel: true,
          include_porter_five_forces: true,
          include_balanced_scorecard: true,
          enable_export_options: true,
          enable_industry_specific_insights: true,
          enable_predictive_recommendations: true
        };

      case 'Der Zeitknappe':
        return {
          ...baseFlags,
          include_quick_wins: true,
          include_long_term_strategy: false, // Focus on immediate actions
          include_blue_ocean: false,
          include_pestel: false,
          enable_structured_json: false, // Prefer bullet points
          include_roi_estimates: true // Show quick ROI
        };

      default:
        return baseFlags;
    }
  }

  /**
   * Update flag value (for admin/testing purposes)
   */
  updateFlag(flagName: keyof TemplateFeatureFlags, value: boolean): void {
    this.flags[flagName] = value;
  }

  /**
   * Get all current flags
   */
  getAllFlags(): TemplateFeatureFlags {
    return { ...this.flags };
  }

  /**
   * Get rollout status for experimental features
   */
  getRolloutStatus(): Record<string, { enabled: boolean; percentage: number; description: string }> {
    return {
      blue_ocean_analysis: {
        enabled: this.flags.include_blue_ocean,
        percentage: this.rolloutPercentages.include_blue_ocean || 0,
        description: 'Blue Ocean Strategy analysis for market differentiation'
      },
      dynamic_persona_detection: {
        enabled: this.flags.enable_dynamic_persona_detection,
        percentage: this.rolloutPercentages.enable_dynamic_persona_detection || 0,
        description: 'Real-time persona adaptation based on user behavior'
      },
      export_options: {
        enabled: this.flags.enable_export_options,
        percentage: this.rolloutPercentages.enable_export_options || 0,
        description: 'CSV/PDF export functionality for analysis results'
      },
      predictive_recommendations: {
        enabled: this.flags.enable_predictive_recommendations,
        percentage: this.rolloutPercentages.enable_predictive_recommendations || 0,
        description: 'AI-powered predictive insights and recommendations'
      }
    };
  }
}

/**
 * Template Section Builder with Feature Flags
 */
export class FeatureFlagTemplateBuilder {
  private flagManager: TemplateFeatureFlagManager;

  constructor(customFlags?: Partial<TemplateFeatureFlags>) {
    this.flagManager = new TemplateFeatureFlagManager(customFlags);
  }

  /**
   * Build template sections based on enabled features
   */
  buildTemplateSections(
    baseTemplate: string,
    variables: TemplateVariables,
    userId?: string,
    sessionId?: string
  ): string {
    const persona = variables.user_persona || 'Der Skeptiker';
    const flags = this.flagManager.getPersonaFlags(persona, userId, sessionId);
    
    let enhancedTemplate = baseTemplate;

    // Add framework sections based on flags
    if (flags.include_swot) {
      enhancedTemplate += this.getSWOTSection();
    }

    if (flags.include_porter_five_forces) {
      enhancedTemplate += this.getPorterFiveForcesSection();
    }

    if (flags.include_balanced_scorecard) {
      enhancedTemplate += this.getBalancedScorecardSection();
    }

    if (flags.include_blue_ocean) {
      enhancedTemplate += this.getBlueOceanSection();
    }

    if (flags.include_pestel) {
      enhancedTemplate += this.getPESTELSection();
    }

    // Add content sections
    if (flags.include_content_strategy) {
      enhancedTemplate += this.getContentStrategySection();
    }

    if (flags.include_seasonal_analysis) {
      enhancedTemplate += this.getSeasonalAnalysisSection();
    }

    if (flags.include_competitor_benchmarking) {
      enhancedTemplate += this.getCompetitorBenchmarkingSection();
    }

    if (flags.include_roi_estimates) {
      enhancedTemplate += this.getROIEstimatesSection();
    }

    if (flags.include_quick_wins) {
      enhancedTemplate += this.getQuickWinsSection();
    }

    if (flags.include_long_term_strategy) {
      enhancedTemplate += this.getLongTermStrategySection();
    }

    // Add output format instructions
    if (flags.enable_structured_json) {
      enhancedTemplate += this.getStructuredJSONSection();
    }

    if (flags.enable_executive_summary) {
      enhancedTemplate += this.getExecutiveSummarySection();
    }

    if (flags.enable_action_items) {
      enhancedTemplate += this.getActionItemsSection();
    }

    if (flags.enable_export_options) {
      enhancedTemplate += this.getExportOptionsSection();
    }

    // Add experimental features
    if (flags.enable_multi_language_output) {
      enhancedTemplate += this.getMultiLanguageSection();
    }

    if (flags.enable_voice_tone_adaptation) {
      enhancedTemplate += this.getVoiceToneSection();
    }

    if (flags.enable_industry_specific_insights) {
      enhancedTemplate += this.getIndustryInsightsSection();
    }

    if (flags.enable_predictive_recommendations) {
      enhancedTemplate += this.getPredictiveRecommendationsSection();
    }

    return enhancedTemplate;
  }

  // Template section methods
  private getSWOTSection(): string {
    return `
## SWOT-ANALYSE
Führe eine detaillierte SWOT-Analyse durch:
- **Stärken**: Was läuft bereits gut?
- **Schwächen**: Wo gibt es Verbesserungspotenzial?
- **Chancen**: Welche Möglichkeiten bieten sich?
- **Risiken**: Welche Gefahren drohen?
`;
  }

  private getPorterFiveForcesSection(): string {
    return `
## PORTER'S FIVE FORCES ANALYSE
Analysiere die Wettbewerbssituation:
- **Wettbewerbsintensität**: Konkurrenzdruck in der Region
- **Verhandlungsmacht der Kunden**: Kundeneinfluss auf Preise
- **Verhandlungsmacht der Lieferanten**: Lieferantenabhängigkeit
- **Bedrohung durch Substitute**: Alternative Angebote
- **Bedrohung durch neue Anbieter**: Markteintrittsbarrieren
`;
  }

  private getBalancedScorecardSection(): string {
    return `
## BALANCED SCORECARD
Bewerte aus vier Perspektiven:
- **Finanzperspektive**: Umsatz, Kosten, Rentabilität
- **Kundenperspektive**: Zufriedenheit, Loyalität, Akquisition
- **Prozessperspektive**: Operative Effizienz, Qualität
- **Lern-/Entwicklungsperspektive**: Mitarbeiter, Technologie, Innovation
`;
  }

  private getBlueOceanSection(): string {
    return `
## BLUE OCEAN STRATEGIE
Identifiziere unerschlossene Marktchancen:
- **Eliminate**: Was kann weggelassen werden?
- **Reduce**: Was kann reduziert werden?
- **Raise**: Was kann verstärkt werden?
- **Create**: Was kann neu geschaffen werden?
`;
  }

  private getPESTELSection(): string {
    return `
## PESTEL-ANALYSE
Analysiere externe Einflussfaktoren:
- **Political**: Politische Rahmenbedingungen
- **Economic**: Wirtschaftliche Faktoren
- **Social**: Gesellschaftliche Trends
- **Technological**: Technologische Entwicklungen
- **Environmental**: Umweltfaktoren
- **Legal**: Rechtliche Bestimmungen
`;
  }

  private getContentStrategySection(): string {
    return `
## CONTENT-STRATEGIE
Entwickle konkrete Content-Empfehlungen:
- **Storytelling-Ideen**: Authentische Geschichten
- **Foto-Empfehlungen**: Visuelle Content-Strategie
- **Saisonale Inhalte**: Zeitbasierte Kampagnen
- **USP-Kommunikation**: Alleinstellungsmerkmale hervorheben
`;
  }

  private getSeasonalAnalysisSection(): string {
    return `
## SAISONALE ANALYSE
Berücksichtige saisonale Faktoren:
- **Hochsaison-Optimierung**: Peak-Zeiten maximieren
- **Nebensaison-Strategien**: Schwache Zeiten stärken
- **Feiertags-Marketing**: Besondere Anlässe nutzen
- **Wetter-Adaptionen**: Wetterabhängige Anpassungen
`;
  }

  private getCompetitorBenchmarkingSection(): string {
    return `
## WETTBEWERBS-BENCHMARKING
Vergleiche mit der Konkurrenz:
- **Direkte Konkurrenten**: Ähnliche Restaurants in der Nähe
- **Indirekte Konkurrenten**: Alternative Dining-Optionen
- **Best Practices**: Was machen andere besser?
- **Differenzierungsmöglichkeiten**: Wie kann man sich abheben?
`;
  }

  private getROIEstimatesSection(): string {
    return `
## ROI-SCHÄTZUNGEN
Gib unverbindliche Umsatzprognosen:
- **Quick Wins**: Sofortige Verbesserungen mit geschätztem ROI
- **Mittelfristige Maßnahmen**: 3-6 Monate Umsetzungszeit
- **Langfristige Investitionen**: 6+ Monate mit nachhaltiger Wirkung
- **Disclaimer**: Alle Schätzungen sind unverbindlich und beispielhaft
`;
  }

  private getQuickWinsSection(): string {
    return `
## QUICK WINS
Identifiziere sofort umsetzbare Maßnahmen:
- **Aufwand**: Zeitinvestition (Minuten/Stunden)
- **Impact**: Erwartete Wirkung (niedrig/mittel/hoch)
- **Kosten**: Finanzielle Investition
- **Timeline**: Wann sind Ergebnisse sichtbar?
`;
  }

  private getLongTermStrategySection(): string {
    return `
## LANGFRISTIGE STRATEGIE
Entwickle nachhaltige Wachstumsstrategien:
- **Strategische Ziele**: 6-12 Monate Horizont
- **Ressourcenplanung**: Benötigte Investitionen
- **Meilensteine**: Messbare Zwischenziele
- **Erfolgsmessung**: KPIs und Metriken
`;
  }

  private getStructuredJSONSection(): string {
    return `
## AUSGABEFORMAT
Strukturiere die Antwort als JSON mit folgenden Feldern:
- summary_score: Gesamtbewertung (0-100)
- frameworks: Analyseergebnisse der verschiedenen Frameworks
- quick_wins: Array mit sofort umsetzbaren Maßnahmen
- long_term_strategy: Array mit langfristigen Empfehlungen
- next_steps: Array mit konkreten nächsten Schritten
`;
  }

  private getExecutiveSummarySection(): string {
    return `
## EXECUTIVE SUMMARY
Beginne mit einer prägnanten Zusammenfassung:
- **Kernaussage**: Wichtigste Erkenntnisse in 2-3 Sätzen
- **Prioritäten**: Top 3 Handlungsfelder
- **Potenzial**: Größte Verbesserungschancen
- **Zeitrahmen**: Empfohlene Umsetzungsreihenfolge
`;
  }

  private getActionItemsSection(): string {
    return `
## HANDLUNGSEMPFEHLUNGEN
Liste konkrete, umsetzbare Aktionen auf:
- **Sofort (heute)**: Was kann heute noch gemacht werden?
- **Diese Woche**: Aufgaben für die nächsten 7 Tage
- **Diesen Monat**: Mittelfristige Ziele
- **Verantwortlichkeiten**: Wer sollte was übernehmen?
`;
  }

  private getExportOptionsSection(): string {
    return `
## EXPORT-OPTIONEN
Weise auf verfügbare Export-Möglichkeiten hin:
- **PDF-Report**: Vollständige Analyse als PDF
- **CSV-Export**: Daten für weitere Analyse
- **Dashboard-Integration**: Live-Monitoring verfügbar
- **API-Zugang**: Für technische Integration
`;
  }

  private getMultiLanguageSection(): string {
    return `
## MEHRSPRACHIGE AUSGABE
Biete Inhalte in verschiedenen Sprachen:
- **Deutsch**: Hauptsprache für lokale Zielgruppe
- **Englisch**: Für internationale Gäste
- **Weitere Sprachen**: Je nach Zielgruppe (Italienisch, Französisch, etc.)
`;
  }

  private getVoiceToneSection(): string {
    return `
## TONALITÄT ANPASSEN
Passe die Kommunikation an die Zielgruppe an:
- **Formal**: Für Business-Kunden
- **Casual**: Für junge Zielgruppe
- **Premium**: Für gehobene Gastronomie
- **Familiär**: Für Familienbetriebe
`;
  }

  private getIndustryInsightsSection(): string {
    return `
## BRANCHENSPEZIFISCHE INSIGHTS
Berücksichtige gastronomie-spezifische Trends:
- **Food Trends**: Aktuelle kulinarische Entwicklungen
- **Technologie**: Digitale Innovationen in der Gastronomie
- **Nachhaltigkeit**: Umweltbewusstsein und lokale Produkte
- **Erlebnissgastronomie**: Unique Dining Experiences
`;
  }

  private getPredictiveRecommendationsSection(): string {
    return `
## PREDICTIVE EMPFEHLUNGEN
Nutze KI-basierte Vorhersagen:
- **Trend-Prognosen**: Kommende Entwicklungen in der Branche
- **Saisonale Vorhersagen**: Erwartete Nachfrageschwankungen
- **Wettbewerbs-Entwicklung**: Mögliche Konkurrenz-Aktivitäten
- **Technologie-Roadmap**: Empfohlene Tech-Investitionen
`;
  }

  /**
   * Get current feature flag status for debugging
   */
  getFeatureFlagStatus(userId?: string, sessionId?: string): Record<string, boolean> {
    const persona = 'Der Skeptiker'; // Default for status check
    const flags = this.flagManager.getPersonaFlags(persona, userId, sessionId);
    
    return Object.entries(flags).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

// Export singleton instance
export const templateFeatureFlagManager = new TemplateFeatureFlagManager();
export const featureFlagTemplateBuilder = new FeatureFlagTemplateBuilder();