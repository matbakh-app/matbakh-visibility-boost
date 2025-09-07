/**
 * Business Framework Analysis Engine
 * 
 * Implements multiple business analysis frameworks for restaurant intelligence:
 * - SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
 * - Porter's Five Forces (Competitive positioning)
 * - Balanced Scorecard (Multi-dimensional performance)
 * - Hofstede Cultural Dimensions (Regional adaptation)
 * - Nutzwertanalyse (ROI prioritization)
 */

export interface BusinessData {
  business_name: string;
  location: {
    city: string;
    region: string;
    country: string;
    postal_code?: string;
  };
  main_category: string;
  sub_categories: string[];
  website_url?: string;
  social_media: {
    instagram_url?: string;
    facebook_url?: string;
    gmb_url?: string;
  };
  visibility_metrics: {
    google_score: number;
    social_score: number;
    website_score: number;
    overall_score: number;
  };
  competitive_data?: {
    local_competitors: Array<{
      name: string;
      score: number;
      strengths: string[];
    }>;
    industry_average: number;
    top_10_percent: number;
  };
  cultural_context?: {
    country_code: string;
    language: string;
    regional_preferences: string[];
  };
}

export interface SWOTAnalysis {
  strengths: Array<{
    factor: string;
    description: string;
    impact_score: number; // 1-10
    evidence: string[];
  }>;
  weaknesses: Array<{
    factor: string;
    description: string;
    urgency_score: number; // 1-10
    improvement_suggestions: string[];
  }>;
  opportunities: Array<{
    factor: string;
    description: string;
    potential_impact: string;
    timeline: 'short' | 'medium' | 'long';
    effort_required: 'low' | 'medium' | 'high';
  }>;
  threats: Array<{
    factor: string;
    description: string;
    risk_level: 'low' | 'medium' | 'high';
    mitigation_strategies: string[];
  }>;
}

export interface PortersFiveForces {
  competitive_rivalry: {
    intensity: 'low' | 'medium' | 'high';
    factors: string[];
    strategic_implications: string[];
  };
  supplier_power: {
    level: 'low' | 'medium' | 'high';
    key_suppliers: string[];
    recommendations: string[];
  };
  buyer_power: {
    level: 'low' | 'medium' | 'high';
    customer_segments: string[];
    retention_strategies: string[];
  };
  threat_of_substitutes: {
    level: 'low' | 'medium' | 'high';
    substitute_types: string[];
    differentiation_opportunities: string[];
  };
  barriers_to_entry: {
    level: 'low' | 'medium' | 'high';
    entry_barriers: string[];
    competitive_advantages: string[];
  };
  overall_attractiveness: 'low' | 'medium' | 'high';
  strategic_recommendations: string[];
}

export interface BalancedScorecard {
  financial_perspective: {
    metrics: Array<{
      name: string;
      current_status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
      target: string;
      initiatives: string[];
    }>;
  };
  customer_perspective: {
    metrics: Array<{
      name: string;
      current_status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
      target: string;
      initiatives: string[];
    }>;
  };
  internal_process_perspective: {
    metrics: Array<{
      name: string;
      current_status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
      target: string;
      initiatives: string[];
    }>;
  };
  learning_growth_perspective: {
    metrics: Array<{
      name: string;
      current_status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
      target: string;
      initiatives: string[];
    }>;
  };
  strategic_themes: string[];
  key_performance_indicators: string[];
}

export interface HofstedeCulturalDimensions {
  power_distance: {
    score: number; // 0-100
    implications: string[];
    communication_style: string;
  };
  individualism_collectivism: {
    score: number; // 0-100
    implications: string[];
    marketing_approach: string;
  };
  masculinity_femininity: {
    score: number; // 0-100
    implications: string[];
    value_emphasis: string;
  };
  uncertainty_avoidance: {
    score: number; // 0-100
    implications: string[];
    decision_making_style: string;
  };
  long_term_orientation: {
    score: number; // 0-100
    implications: string[];
    planning_horizon: string;
  };
  indulgence_restraint: {
    score: number; // 0-100
    implications: string[];
    customer_behavior: string;
  };
  regional_adaptations: {
    messaging_tone: string;
    visual_preferences: string[];
    service_expectations: string[];
    promotional_strategies: string[];
  };
}

export interface NutzwertAnalyse {
  initiatives: Array<{
    name: string;
    description: string;
    criteria_scores: {
      revenue_impact: number; // 1-10
      cost_efficiency: number; // 1-10
      implementation_ease: number; // 1-10
      time_to_value: number; // 1-10
      strategic_alignment: number; // 1-10
    };
    weighted_score: number;
    roi_projection: {
      investment_required: string;
      expected_return: string;
      payback_period: string;
      confidence_level: 'low' | 'medium' | 'high';
      disclaimer: string; // Always non-binding
    };
    priority_ranking: number;
    implementation_timeline: string;
  }>;
  weighting_factors: {
    revenue_impact: number;
    cost_efficiency: number;
    implementation_ease: number;
    time_to_value: number;
    strategic_alignment: number;
  };
  top_recommendations: string[];
}

export interface ComprehensiveBusinessAnalysis {
  swot_analysis: SWOTAnalysis;
  porters_five_forces: PortersFiveForces;
  balanced_scorecard: BalancedScorecard;
  cultural_dimensions: HofstedeCulturalDimensions;
  nutzwert_analyse: NutzwertAnalyse;
  cross_framework_insights: {
    strategic_themes: string[];
    priority_actions: string[];
    risk_mitigation: string[];
    growth_opportunities: string[];
  };
  executive_summary: {
    overall_assessment: string;
    key_strengths: string[];
    critical_gaps: string[];
    immediate_actions: string[];
    long_term_strategy: string[];
  };
}

export type FrameworkType = 'swot' | 'porters_five_forces' | 'balanced_scorecard' | 'hofstede' | 'nutzwert' | 'comprehensive';

export interface FrameworkSelectionCriteria {
  user_needs: string[];
  data_availability: {
    competitive_data: boolean;
    financial_metrics: boolean;
    customer_feedback: boolean;
    cultural_context: boolean;
  };
  analysis_depth: 'quick' | 'standard' | 'comprehensive';
  persona_type: 'skeptiker' | 'ueberforderte' | 'profi' | 'zeitknappe';
  business_maturity: 'startup' | 'established' | 'mature';
}

export class BusinessFrameworkEngine {
  private frameworks: Map<FrameworkType, boolean> = new Map();

  constructor() {
    // Initialize available frameworks
    this.frameworks.set('swot', true);
    this.frameworks.set('porters_five_forces', true);
    this.frameworks.set('balanced_scorecard', true);
    this.frameworks.set('hofstede', true);
    this.frameworks.set('nutzwert', true);
    this.frameworks.set('comprehensive', true);
  }

  /**
   * Select appropriate frameworks based on user needs and data availability
   */
  selectFrameworks(criteria: FrameworkSelectionCriteria): FrameworkType[] {
    const selectedFrameworks: FrameworkType[] = [];

    // Always include SWOT for basic analysis
    selectedFrameworks.push('swot');

    // Add frameworks based on persona and analysis depth
    switch (criteria.persona_type) {
      case 'skeptiker':
        // Skeptics want comprehensive data and proof
        selectedFrameworks.push('porters_five_forces', 'balanced_scorecard', 'nutzwert');
        if (criteria.data_availability.cultural_context) {
          selectedFrameworks.push('hofstede');
        }
        break;

      case 'profi':
        // Professionals want all available frameworks
        selectedFrameworks.push('porters_five_forces', 'balanced_scorecard', 'nutzwert');
        if (criteria.data_availability.cultural_context) {
          selectedFrameworks.push('hofstede');
        }
        break;

      case 'zeitknappe':
        // Time-pressed users want quick insights
        selectedFrameworks.push('nutzwert'); // Focus on actionable priorities
        break;

      case 'ueberforderte':
        // Overwhelmed users need simplified analysis
        if (criteria.analysis_depth !== 'quick') {
          selectedFrameworks.push('balanced_scorecard'); // Structured but accessible
        }
        break;
    }

    // Add comprehensive analysis for detailed requests
    if (criteria.analysis_depth === 'comprehensive') {
      selectedFrameworks.push('comprehensive');
    }

    return [...new Set(selectedFrameworks)]; // Remove duplicates
  }

  /**
   * Generate framework-specific analysis prompts for Claude
   */
  generateFrameworkPrompts(
    frameworks: FrameworkType[],
    businessData: BusinessData,
    criteria: FrameworkSelectionCriteria
  ): Map<FrameworkType, string> {
    const prompts = new Map<FrameworkType, string>();

    frameworks.forEach(framework => {
      switch (framework) {
        case 'swot':
          prompts.set(framework, this.generateSWOTPrompt(businessData, criteria));
          break;
        case 'porters_five_forces':
          prompts.set(framework, this.generatePortersPrompt(businessData, criteria));
          break;
        case 'balanced_scorecard':
          prompts.set(framework, this.generateBalancedScorecardPrompt(businessData, criteria));
          break;
        case 'hofstede':
          prompts.set(framework, this.generateHofstedePrompt(businessData, criteria));
          break;
        case 'nutzwert':
          prompts.set(framework, this.generateNutzwertPrompt(businessData, criteria));
          break;
        case 'comprehensive':
          prompts.set(framework, this.generateComprehensivePrompt(businessData, criteria));
          break;
      }
    });

    return prompts;
  }

  private generateSWOTPrompt(businessData: BusinessData, criteria: FrameworkSelectionCriteria): string {
    return `
Führe eine SWOT-Analyse für das Restaurant "${businessData.business_name}" durch.

**Geschäftsdaten:**
- Standort: ${businessData.location.city}, ${businessData.location.region}
- Kategorie: ${businessData.main_category}
- Unterkategorien: ${businessData.sub_categories.join(', ')}
- Sichtbarkeits-Score: ${businessData.visibility_metrics.overall_score}/100
- Google Score: ${businessData.visibility_metrics.google_score}/100
- Social Media Score: ${businessData.visibility_metrics.social_score}/100

**Analysiere systematisch:**

1. **STÄRKEN (Strengths):**
   - Identifiziere 3-5 Hauptstärken basierend auf den Daten
   - Bewerte jede Stärke mit Impact-Score (1-10)
   - Liefere konkrete Belege für jede Stärke

2. **SCHWÄCHEN (Weaknesses):**
   - Identifiziere 3-5 Hauptschwächen
   - Bewerte Dringlichkeit (1-10)
   - Schlage konkrete Verbesserungsmaßnahmen vor

3. **CHANCEN (Opportunities):**
   - Identifiziere 3-5 Marktchancen
   - Kategorisiere nach Zeithorizont (kurz/mittel/lang)
   - Bewerte Aufwand (niedrig/mittel/hoch)

4. **BEDROHUNGEN (Threats):**
   - Identifiziere 3-5 Risiken
   - Bewerte Risiko-Level (niedrig/mittel/hoch)
   - Schlage Gegenmaßnahmen vor

**Ausgabeformat:** Strukturiertes JSON gemäß SWOTAnalysis Interface.
**Sprache:** Deutsch, gastronomiespezifisch, ${this.getPersonaTone(criteria.persona_type)}
`;
  }

  private generatePortersPrompt(businessData: BusinessData, criteria: FrameworkSelectionCriteria): string {
    return `
Führe eine Porter's Five Forces Analyse für "${businessData.business_name}" durch.

**Geschäftskontext:**
- Restaurant in ${businessData.location.city}
- Kategorie: ${businessData.main_category}
- Wettbewerbsposition: ${businessData.competitive_data ? 'Daten verfügbar' : 'Begrenzte Daten'}

**Analysiere die fünf Kräfte:**

1. **Wettbewerbsintensität:**
   - Bewerte lokale Konkurrenz (niedrig/mittel/hoch)
   - Identifiziere Wettbewerbsfaktoren
   - Strategische Implikationen

2. **Lieferantenmacht:**
   - Bewerte Verhandlungsmacht der Lieferanten
   - Identifiziere Schlüssel-Lieferanten
   - Empfehlungen zur Lieferantenbeziehung

3. **Kundenmacht:**
   - Bewerte Verhandlungsmacht der Kunden
   - Identifiziere Kundensegmente
   - Kundenbindungsstrategien

4. **Bedrohung durch Substitute:**
   - Bewerte Substitutionsrisiko
   - Identifiziere Ersatzprodukte/-services
   - Differenzierungsmöglichkeiten

5. **Markteintrittsbarrieren:**
   - Bewerte Eintrittsbarrieren
   - Identifiziere Wettbewerbsvorteile
   - Schutzstrategien

**Gesamtbewertung:** Marktattraktivität und strategische Empfehlungen.
**Ausgabeformat:** Strukturiertes JSON gemäß PortersFiveForces Interface.
**Sprache:** Deutsch, ${this.getPersonaTone(criteria.persona_type)}
`;
  }

  private generateBalancedScorecardPrompt(businessData: BusinessData, criteria: FrameworkSelectionCriteria): string {
    return `
Erstelle eine Balanced Scorecard für "${businessData.business_name}".

**Geschäftsdaten:**
- Sichtbarkeits-Metriken verfügbar
- Standort: ${businessData.location.city}
- Kategorie: ${businessData.main_category}

**Analysiere vier Perspektiven:**

1. **Finanzperspektive:**
   - Umsatzwachstum, Profitabilität, Kosteneffizienz
   - Status: exzellent/gut/verbesserungsbedürftig/kritisch
   - Ziele und Initiativen

2. **Kundenperspektive:**
   - Kundenzufriedenheit, Kundenbindung, Marktanteil
   - Bewertung basierend auf Sichtbarkeitsdaten
   - Verbesserungsmaßnahmen

3. **Interne Prozessperspektive:**
   - Betriebseffizienz, Qualitätsmanagement, Innovation
   - Digitale Präsenz und Prozesse
   - Optimierungspotenziale

4. **Lern- und Entwicklungsperspektive:**
   - Mitarbeiterentwicklung, Technologie, Kultur
   - Digitale Kompetenzen
   - Entwicklungsmaßnahmen

**Strategische Themen:** Identifiziere übergreifende Themen.
**KPIs:** Definiere messbare Leistungsindikatoren.
**Ausgabeformat:** Strukturiertes JSON gemäß BalancedScorecard Interface.
**Sprache:** Deutsch, ${this.getPersonaTone(criteria.persona_type)}
`;
  }

  private generateHofstedePrompt(businessData: BusinessData, criteria: FrameworkSelectionCriteria): string {
    const culturalContext = businessData.cultural_context;
    if (!culturalContext) {
      return '';
    }

    return `
Analysiere kulturelle Dimensionen nach Hofstede für "${businessData.business_name}".

**Kultureller Kontext:**
- Land: ${culturalContext.country_code}
- Sprache: ${culturalContext.language}
- Region: ${businessData.location.region}
- Regionale Präferenzen: ${culturalContext.regional_preferences.join(', ')}

**Analysiere sechs Dimensionen:**

1. **Machtdistanz (0-100):**
   - Score für ${culturalContext.country_code}
   - Implikationen für Serviceerwartungen
   - Kommunikationsstil-Empfehlungen

2. **Individualismus vs. Kollektivismus (0-100):**
   - Kultureller Score
   - Marketing-Ansatz (individuell vs. gemeinschaftlich)
   - Kundenansprache

3. **Maskulinität vs. Femininität (0-100):**
   - Werte-Betonung
   - Service-Philosophie
   - Ambiente-Gestaltung

4. **Unsicherheitsvermeidung (0-100):**
   - Entscheidungsstil der Kunden
   - Informationsbedürfnisse
   - Vertrauensaufbau

5. **Langzeitorientierung (0-100):**
   - Planungshorizont
   - Kundenbindungsstrategien
   - Nachhaltigkeits-Kommunikation

6. **Nachgiebigkeit vs. Beherrschung (0-100):**
   - Kundenverhalten
   - Genuss vs. Zurückhaltung
   - Promotions-Strategien

**Regionale Anpassungen:**
- Messaging-Ton
- Visuelle Präferenzen
- Service-Erwartungen
- Werbe-Strategien

**Ausgabeformat:** Strukturiertes JSON gemäß HofstedeCulturalDimensions Interface.
**Sprache:** Deutsch, kulturell angepasst
`;
  }

  private generateNutzwertPrompt(businessData: BusinessData, criteria: FrameworkSelectionCriteria): string {
    return `
Erstelle eine Nutzwertanalyse für "${businessData.business_name}" zur Priorisierung von Verbesserungsmaßnahmen.

**Geschäftssituation:**
- Aktueller Sichtbarkeits-Score: ${businessData.visibility_metrics.overall_score}/100
- Hauptschwächen identifiziert
- Verbesserungspotenzial vorhanden

**Bewertungskriterien (1-10 Punkte):**
1. **Umsatz-Impact:** Erwartete Umsatzsteigerung
2. **Kosteneffizienz:** Verhältnis Aufwand zu Nutzen
3. **Umsetzbarkeit:** Einfachheit der Implementierung
4. **Time-to-Value:** Geschwindigkeit bis zum Erfolg
5. **Strategische Ausrichtung:** Langfristige Bedeutung

**Gewichtungsfaktoren:**
- Umsatz-Impact: 30%
- Kosteneffizienz: 25%
- Umsetzbarkeit: 20%
- Time-to-Value: 15%
- Strategische Ausrichtung: 10%

**Analysiere Initiativen:**
- Google My Business Optimierung
- Social Media Aktivierung
- Website-Verbesserungen
- Review-Management
- Content-Strategie
- Lokale SEO-Maßnahmen

**Für jede Initiative:**
- Bewertung nach allen Kriterien
- Gewichteter Gesamtscore
- ROI-Projektion mit Disclaimer
- Prioritäts-Ranking
- Umsetzungs-Timeline

**ROI-Projektionen:**
- Investition erforderlich
- Erwartete Rendite
- Amortisationszeit
- Konfidenz-Level
- **WICHTIG:** Immer mit Disclaimer "Alle Projektionen sind unverbindlich"

**Ausgabeformat:** Strukturiertes JSON gemäß NutzwertAnalyse Interface.
**Sprache:** Deutsch, ${this.getPersonaTone(criteria.persona_type)}
`;
  }

  private generateComprehensivePrompt(businessData: BusinessData, criteria: FrameworkSelectionCriteria): string {
    return `
Erstelle eine umfassende Geschäftsanalyse für "${businessData.business_name}" mit Integration aller Frameworks.

**Vollständige Geschäftsdaten verfügbar.**

**Führe durch:**
1. SWOT-Analyse
2. Porter's Five Forces
3. Balanced Scorecard
4. Hofstede Kulturdimensionen (falls Kontext verfügbar)
5. Nutzwertanalyse

**Cross-Framework Integration:**
- Identifiziere strategische Themen über alle Frameworks
- Priorisiere Handlungsfelder basierend auf mehreren Analysen
- Entwickle Risiko-Mitigation basierend auf SWOT + Porter's
- Identifiziere Wachstumschancen aus allen Perspektiven

**Executive Summary:**
- Gesamtbewertung der Geschäftssituation
- Top 3 Stärken (framework-übergreifend)
- Top 3 kritische Lücken
- Top 5 sofortige Maßnahmen
- Langfristige Strategieempfehlungen

**Ausgabeformat:** Strukturiertes JSON gemäß ComprehensiveBusinessAnalysis Interface.
**Sprache:** Deutsch, ${this.getPersonaTone(criteria.persona_type)}
**Umfang:** Vollständige Analyse mit allen Details
`;
  }

  private getPersonaTone(persona: string): string {
    switch (persona) {
      case 'skeptiker':
        return 'datenbasiert, mit konkreten Belegen und Metriken';
      case 'ueberforderte':
        return 'einfach verständlich, mit klaren Handlungsanweisungen';
      case 'profi':
        return 'technisch detailliert, mit erweiterten Analysen';
      case 'zeitknappe':
        return 'prägnant, fokussiert auf Quick Wins';
      default:
        return 'ausgewogen und verständlich';
    }
  }

  /**
   * Aggregate results from multiple frameworks
   */
  aggregateFrameworkResults(
    results: Map<FrameworkType, any>,
    businessData: BusinessData
  ): ComprehensiveBusinessAnalysis {
    const swot = results.get('swot') as SWOTAnalysis;
    const porters = results.get('porters_five_forces') as PortersFiveForces;
    const scorecard = results.get('balanced_scorecard') as BalancedScorecard;
    const hofstede = results.get('hofstede') as HofstedeCulturalDimensions;
    const nutzwert = results.get('nutzwert') as NutzwertAnalyse;

    // Cross-framework insights
    const strategicThemes = this.extractStrategicThemes(results);
    const priorityActions = this.extractPriorityActions(results);
    const riskMitigation = this.extractRiskMitigation(results);
    const growthOpportunities = this.extractGrowthOpportunities(results);

    // Executive summary
    const executiveSummary = this.generateExecutiveSummary(results, businessData);

    return {
      swot_analysis: swot,
      porters_five_forces: porters,
      balanced_scorecard: scorecard,
      cultural_dimensions: hofstede,
      nutzwert_analyse: nutzwert,
      cross_framework_insights: {
        strategic_themes: strategicThemes,
        priority_actions: priorityActions,
        risk_mitigation: riskMitigation,
        growth_opportunities: growthOpportunities
      },
      executive_summary: executiveSummary
    };
  }

  private extractStrategicThemes(results: Map<FrameworkType, any>): string[] {
    const themes: string[] = [];
    
    // Extract themes from different frameworks
    const swot = results.get('swot') as SWOTAnalysis;
    const scorecard = results.get('balanced_scorecard') as BalancedScorecard;
    
    if (swot) {
      // Add themes based on SWOT patterns
      if (swot.strengths.some(s => s.factor.includes('digital'))) {
        themes.push('Digitale Transformation');
      }
      if (swot.opportunities.some(o => o.factor.includes('local'))) {
        themes.push('Lokale Marktführerschaft');
      }
    }
    
    if (scorecard) {
      themes.push(...scorecard.strategic_themes);
    }
    
    return [...new Set(themes)];
  }

  private extractPriorityActions(results: Map<FrameworkType, any>): string[] {
    const actions: string[] = [];
    
    const nutzwert = results.get('nutzwert') as NutzwertAnalyse;
    if (nutzwert) {
      actions.push(...nutzwert.top_recommendations);
    }
    
    return actions;
  }

  private extractRiskMitigation(results: Map<FrameworkType, any>): string[] {
    const mitigation: string[] = [];
    
    const swot = results.get('swot') as SWOTAnalysis;
    if (swot) {
      swot.threats.forEach(threat => {
        mitigation.push(...threat.mitigation_strategies);
      });
    }
    
    return mitigation;
  }

  private extractGrowthOpportunities(results: Map<FrameworkType, any>): string[] {
    const opportunities: string[] = [];
    
    const swot = results.get('swot') as SWOTAnalysis;
    if (swot) {
      opportunities.push(...swot.opportunities.map(o => o.description));
    }
    
    return opportunities;
  }

  private generateExecutiveSummary(
    results: Map<FrameworkType, any>,
    businessData: BusinessData
  ): ComprehensiveBusinessAnalysis['executive_summary'] {
    const swot = results.get('swot') as SWOTAnalysis;
    const scorecard = results.get('balanced_scorecard') as BalancedScorecard;
    
    return {
      overall_assessment: `${businessData.business_name} zeigt einen Sichtbarkeits-Score von ${businessData.visibility_metrics.overall_score}/100 mit spezifischen Stärken und Verbesserungspotenzialen.`,
      key_strengths: swot?.strengths.slice(0, 3).map(s => s.factor) || [],
      critical_gaps: swot?.weaknesses.slice(0, 3).map(w => w.factor) || [],
      immediate_actions: [
        'Google My Business Profil optimieren',
        'Social Media Präsenz aktivieren',
        'Review-Management implementieren'
      ],
      long_term_strategy: [
        'Digitale Transformation vorantreiben',
        'Kundenbindung systematisch stärken',
        'Lokale Marktposition ausbauen'
      ]
    };
  }

  /**
   * Format results for specific output requirements
   */
  formatForPersona(
    analysis: ComprehensiveBusinessAnalysis,
    persona: string
  ): any {
    switch (persona) {
      case 'zeitknappe':
        return this.formatForTimePressed(analysis);
      case 'ueberforderte':
        return this.formatForOverwhelmed(analysis);
      case 'skeptiker':
        return this.formatForSkeptic(analysis);
      case 'profi':
        return analysis; // Full analysis
      default:
        return this.formatStandard(analysis);
    }
  }

  private formatForTimePressed(analysis: ComprehensiveBusinessAnalysis): any {
    return {
      quick_summary: analysis.executive_summary.overall_assessment,
      top_3_actions: analysis.executive_summary.immediate_actions.slice(0, 3),
      priority_score: analysis.nutzwert_analyse?.initiatives[0]?.weighted_score || 0,
      time_investment: '15-30 Minuten pro Woche',
      expected_impact: 'Sichtbarkeit +20-30% in 3 Monaten'
    };
  }

  private formatForOverwhelmed(analysis: ComprehensiveBusinessAnalysis): any {
    return {
      simple_explanation: 'Ihre digitale Sichtbarkeit hat Verbesserungspotenzial',
      step_by_step_guide: analysis.executive_summary.immediate_actions.map((action, index) => ({
        step: index + 1,
        action: action,
        difficulty: 'Einfach',
        time_needed: '30 Minuten'
      })),
      support_available: true,
      next_step_button: 'Erste Verbesserung starten'
    };
  }

  private formatForSkeptic(analysis: ComprehensiveBusinessAnalysis): any {
    return {
      data_summary: {
        frameworks_used: ['SWOT', 'Porter\'s Five Forces', 'Balanced Scorecard', 'Nutzwertanalyse'],
        confidence_level: 'Hoch',
        data_sources: ['Google My Business', 'Social Media Metriken', 'Wettbewerbsanalyse']
      },
      detailed_analysis: analysis,
      proof_points: analysis.swot_analysis.strengths.map(s => ({
        claim: s.factor,
        evidence: s.evidence,
        score: s.impact_score
      })),
      roi_calculations: analysis.nutzwert_analyse.initiatives.map(i => i.roi_projection)
    };
  }

  private formatStandard(analysis: ComprehensiveBusinessAnalysis): any {
    return {
      executive_summary: analysis.executive_summary,
      key_insights: {
        strengths: analysis.swot_analysis.strengths.slice(0, 3),
        opportunities: analysis.swot_analysis.opportunities.slice(0, 3),
        priority_actions: analysis.cross_framework_insights.priority_actions.slice(0, 5)
      },
      detailed_analysis: analysis
    };
  }
}