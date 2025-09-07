/**
 * Persona Template Scenarios Tests
 * Realistic persona flows with actual VC data simulations
 */

import { 
  VCTemplateBuilder,
  VCResultParser,
  type VCLeadData,
  type VCContextData 
} from '../vc-template-integration';
import { 
  TemplateSecurityValidator,
  TemplateVariableValidator 
} from '../template-validation';

describe('Persona Template Scenarios', () => {
  let securityValidator: TemplateSecurityValidator;
  let variableValidator: TemplateVariableValidator;

  beforeEach(() => {
    securityValidator = new TemplateSecurityValidator();
    variableValidator = new TemplateVariableValidator();
  });

  describe('Der Skeptiker - Data-Driven Analysis', () => {
    const skeptikerLeadData: VCLeadData = {
      id: 'skeptiker-lead-001',
      email: 'owner@datenfokus-restaurant.de',
      name: 'Dr. Klaus Müller',
      business_name: 'Zur Goldenen Waage',
      business_category: 'restaurant',
      business_location: 'Frankfurt am Main',
      locale: 'de',
      created_at: new Date().toISOString()
    };

    const skeptikerContextData: VCContextData = {
      lead_id: 'skeptiker-lead-001',
      business_profile: {
        name: 'Zur Goldenen Waage',
        category: 'restaurant',
        location: 'Frankfurt am Main, Deutschland',
        website_url: 'https://goldene-waage.de',
        gmb_url: 'https://goo.gl/maps/example1',
        instagram_url: 'https://instagram.com/goldenewaage',
        facebook_url: 'https://facebook.com/goldenewaage',
        benchmark_urls: ['competitor1.de', 'competitor2.de']
      },
      user_goals: [
        'Konkrete ROI-Zahlen für Marketing-Investitionen',
        'Messbare Verbesserung der Online-Sichtbarkeit',
        'Vergleichbare Branchenbenchmarks'
      ],
      persona_type: 'Der Skeptiker',
      data_quality_score: 92,
      analysis_preferences: {
        frameworks: ['SWOT', 'Porter', 'Balanced Scorecard'],
        detail_level: 'comprehensive',
        focus_areas: ['metrics', 'benchmarking', 'roi_analysis']
      }
    };

    test('should generate data-heavy prompt for skeptical persona', () => {
      const builder = new VCTemplateBuilder('Der Skeptiker');
      const prompt = builder.buildAnalysisPrompt(skeptikerLeadData, skeptikerContextData);

      // Skeptiker-spezifische Erwartungen
      expect(prompt).toContain('Der Skeptiker');
      expect(prompt).toContain('konkrete ROI-Zahlen');
      expect(prompt).toContain('Branchenbenchmarks');
      expect(prompt).toContain('92/100'); // Data quality score
      expect(prompt).toContain('comprehensive'); // Detail level
      
      // Sicherheitsvalidierung
      const validation = securityValidator.validateTemplate(
        { id: 'test', name: 'test', category: 'vc_analysis', currentVersion: '1.0.0', 
          versions: { '1.0.0': { version: '1.0.0', createdAt: new Date().toISOString(), 
          description: 'test', template: prompt, securityLevel: 'standard' }},
          defaultContract: { permissions: { webAccess: true, dataAccess: 'public', outputFormat: 'structured' },
          restrictions: { noPersonalData: true, noDirectApiCalls: true, noDataStorage: true, noExternalUploads: true },
          context: { requestType: 'vc_analysis', dataScope: 'business_public' }},
          requiredVariables: [], optionalVariables: [] }
      );
      
      expect(validation.securityScore).toBeGreaterThan(80);
    });

    test('should expect structured output with metrics focus', () => {
      const mockClaudeResponse = `
# VISIBILITY CHECK ANALYSE - DATENBASIERTE AUSWERTUNG

## Executive Summary
Basierend auf 92% Datenqualität zeigt "Zur Goldenen Waage" eine überdurchschnittliche digitale Präsenz mit messbaren Optimierungspotenzialen.

## SWOT-ANALYSE (Quantifiziert)

### Stärken (Messbare Faktoren)
- Google My Business: 4.6/5 Sterne (127 Bewertungen) - 15% über Branchendurchschnitt
- Website-Traffic: 2.340 monatliche Besucher - Wachstum +23% YoY
- Social Media Engagement: 3.2% (Instagram) - Branchendurchschnitt: 2.1%

### Schwächen (Quantifizierte Defizite)
- Conversion Rate: 2.1% (Branchenbenchmark: 3.8%)
- Online-Reservierungen: 34% des Gesamtumsatzes (Potenzial: 55%)
- Lokale Suchsichtbarkeit: Position 8-12 für Hauptkeywords

## ROI-PROGNOSEN (Unverbindliche Schätzungen)

### Quick Wins mit ROI-Berechnung
1. **GMB-Optimierung**: 2h Aufwand → +15% lokale Sichtbarkeit → ~800€/Monat zusätzlicher Umsatz
2. **Review-Management**: 30min täglich → +0.3 Sterne → ~1.200€/Monat Umsatzsteigerung
3. **Local SEO**: 4h Setup → Top 5 Rankings → ~2.100€/Monat organischer Traffic-Wert

### Langfristige Investitionen
- **Social Media Strategie**: 1.500€ Setup + 800€/Monat → ROI nach 4 Monaten
- **Website-Optimierung**: 3.200€ einmalig → +1.7% Conversion → 18 Monate Amortisation

## BENCHMARKING-DATEN
- Branchendurchschnitt Sichtbarkeit: 67/100 (Ihr Wert: 74/100)
- Top 10% der Branche: 89/100 (Verbesserungspotenzial: +15 Punkte)
- Lokale Konkurrenz: Durchschnitt 71/100 (Sie liegen +3 Punkte darüber)
      `;

      const result = VCResultParser.parseAnalysisResponse(
        mockClaudeResponse,
        'skeptiker-lead-001',
        {
          model_used: 'claude-3.5-sonnet',
          token_usage: 3200,
          processing_time_ms: 18000
        }
      );

      // Skeptiker erwartet konkrete Zahlen und ROI
      expect(result.quick_wins.length).toBeGreaterThan(0);
      expect(result.quick_wins[0].roi_estimate).toBeDefined();
      expect(result.ai_metadata.confidence_score).toBeGreaterThan(0.8);
      
      // Prüfe auf quantifizierte Metriken
      expect(mockClaudeResponse).toMatch(/\d+%/); // Prozentangaben
      expect(mockClaudeResponse).toMatch(/\d+€/); // Euro-Beträge
      expect(mockClaudeResponse).toMatch(/\d+\/\d+/); // Bewertungen/Scores
    });
  });

  describe('Der Überforderte - Simplified Guidance', () => {
    const überfordertLeadData: VCLeadData = {
      id: 'überfordert-lead-002',
      email: 'maria@kleine-trattoria.de',
      name: 'Maria Rossi',
      business_name: 'Piccola Trattoria',
      business_category: 'restaurant',
      business_location: 'Heidelberg',
      locale: 'de',
      created_at: new Date().toISOString()
    };

    const überfordertContextData: VCContextData = {
      lead_id: 'überfordert-lead-002',
      business_profile: {
        name: 'Piccola Trattoria',
        category: 'restaurant',
        location: 'Heidelberg, Deutschland'
        // Minimale digitale Präsenz - kein Website/Social Media
      },
      user_goals: [
        'Einfache erste Schritte für Online-Präsenz',
        'Nicht zu kompliziert, bitte Schritt für Schritt',
        'Was ist am wichtigsten?'
      ],
      persona_type: 'Der Überforderte',
      data_quality_score: 35,
      analysis_preferences: {
        frameworks: ['SWOT'],
        detail_level: 'basic',
        focus_areas: ['quick_start', 'simple_steps']
      }
    };

    test('should generate simplified, encouraging prompt', () => {
      const builder = new VCTemplateBuilder('Der Überforderte');
      const prompt = builder.buildAnalysisPrompt(überfordertLeadData, überfordertContextData);

      expect(prompt).toContain('Der Überforderte');
      expect(prompt).toContain('Schritt für Schritt');
      expect(prompt).toContain('einfache erste Schritte');
      expect(prompt).toContain('35/100'); // Low data quality
      expect(prompt).toContain('basic'); // Simple detail level
      
      // Überforderte brauchen Ermutigung
      expect(prompt).toMatch(/einfach|simpel|unkompliziert/i);
      expect(prompt).toMatch(/schaffen|können|möglich/i);
    });

    test('should focus on basic quick wins without overwhelming details', () => {
      const mockClaudeResponse = `
# IHRE ERSTEN SCHRITTE ZUR BESSEREN SICHTBARKEIT

## Das Wichtigste zuerst 🌟
Liebe Maria, keine Sorge - wir fangen ganz einfach an! Ihre Piccola Trattoria hat bereits eine gute Basis.

## Was Sie schon gut machen ✅
- Authentische italienische Küche
- Persönlicher Service
- Stammkundschaft vor Ort

## Ihre 3 wichtigsten nächsten Schritte

### Schritt 1: Google My Business (30 Minuten)
**Was ist das?** Ihr Restaurant bei Google anmelden
**Warum wichtig?** Kunden finden Sie bei der Suche
**Wie geht's?** 
1. Gehen Sie zu google.com/business
2. Klicken Sie auf "Jetzt starten"
3. Geben Sie Ihre Restaurantdaten ein
**Ergebnis:** Mehr Kunden finden Sie online

### Schritt 2: Erste Fotos hochladen (15 Minuten)
**Was machen?** 5-10 schöne Fotos von Ihren Gerichten
**Tipp:** Handy-Fotos reichen völlig aus!
**Wo hochladen?** In Ihr Google My Business Profil

### Schritt 3: Erste Bewertungen sammeln (laufend)
**Wie?** Fragen Sie zufriedene Gäste: "Würden Sie uns bei Google bewerten?"
**Ziel:** 10 Bewertungen in den ersten 2 Monaten

## Sie schaffen das! 💪
Jeder Schritt bringt Sie weiter. Fangen Sie heute mit Schritt 1 an - in 30 Minuten sind Sie schon viel weiter!
      `;

      const result = VCResultParser.parseAnalysisResponse(
        mockClaudeResponse,
        'überfordert-lead-002',
        {
          model_used: 'claude-3.5-sonnet',
          token_usage: 1800,
          processing_time_ms: 12000
        }
      );

      // Überforderte brauchen wenige, klare Schritte
      expect(result.quick_wins.length).toBeLessThanOrEqual(3);
      expect(result.next_steps.length).toBeLessThanOrEqual(3);
      
      // Prüfe auf ermutigende Sprache
      expect(mockClaudeResponse).toMatch(/schaffen|können|einfach/i);
      expect(mockClaudeResponse).toMatch(/Schritt \d+/g);
      expect(mockClaudeResponse).toContain('💪'); // Emojis für Ermutigung
    });
  });

  describe('Der Profi - Technical Deep Dive', () => {
    const profiLeadData: VCLeadData = {
      id: 'profi-lead-003',
      email: 'marketing@gourmet-excellence.com',
      name: 'Alexander Weber',
      business_name: 'Gourmet Excellence',
      business_category: 'restaurant',
      business_location: 'München',
      locale: 'de',
      created_at: new Date().toISOString()
    };

    const profiContextData: VCContextData = {
      lead_id: 'profi-lead-003',
      business_profile: {
        name: 'Gourmet Excellence',
        category: 'restaurant',
        location: 'München, Deutschland',
        website_url: 'https://gourmet-excellence.com',
        gmb_url: 'https://goo.gl/maps/example3',
        instagram_url: 'https://instagram.com/gourmetexcellence',
        facebook_url: 'https://facebook.com/gourmetexcellence',
        benchmark_urls: ['michelin-competitor1.com', 'fine-dining-rival.de']
      },
      user_goals: [
        'Strategische Marktpositionierung optimieren',
        'Multi-Channel Attribution analysieren',
        'Competitive Intelligence erweitern',
        'Advanced SEO und Content-Strategie'
      ],
      persona_type: 'Der Profi',
      data_quality_score: 96,
      analysis_preferences: {
        frameworks: ['SWOT', 'Porter', 'Balanced Scorecard', 'Blue Ocean'],
        detail_level: 'comprehensive',
        focus_areas: ['strategic_analysis', 'competitive_intelligence', 'advanced_metrics']
      }
    };

    test('should generate comprehensive technical analysis', () => {
      const builder = new VCTemplateBuilder('Der Profi');
      const prompt = builder.buildAnalysisPrompt(profiLeadData, profiContextData);

      expect(prompt).toContain('Der Profi');
      expect(prompt).toContain('strategische Marktpositionierung');
      expect(prompt).toContain('Multi-Channel Attribution');
      expect(prompt).toContain('96/100'); // High data quality
      expect(prompt).toContain('comprehensive');
      
      // Profi erwartet Fachbegriffe und tiefe Analyse
      expect(prompt).toMatch(/KPI|ROI|Attribution|Segmentierung/i);
      expect(prompt).toMatch(/strategisch|analytisch|systematisch/i);
    });

    test('should provide advanced frameworks and export options', () => {
      const mockClaudeResponse = `
# STRATEGIC VISIBILITY ANALYSIS - EXECUTIVE REPORT

## Executive Dashboard KPIs
- **Digital Maturity Score**: 96/100 (Top 2% der Branche)
- **Market Share (Digital)**: 12.3% (lokaler Fine-Dining Markt)
- **Customer Lifetime Value**: 2.840€ (Branchendurchschnitt: 1.650€)
- **Multi-Touch Attribution**: 67% Online-to-Offline Conversion

## PORTER'S FIVE FORCES ANALYSIS

### Competitive Rivalry (Score: 8.5/10)
**Market Dynamics**: Hochkompetitiver Fine-Dining Markt München
**Key Metrics**:
- 23 direkte Konkurrenten im 5km Radius
- Durchschnittliche Preispositionierung: +15% über Markt
- Differenzierungsfaktoren: Michelin-Empfehlung, Sommelier-Service

### Supplier Power (Score: 6.2/10)
**Strategic Implications**: 
- Premium-Lieferanten mit begrenzter Verfügbarkeit
- Saisonale Preisschwankungen bei Bio-Produkten
- Empfehlung: Diversifizierung der Lieferantenbasis

## ADVANCED SEO ANALYSIS

### Technical SEO Audit
- **Core Web Vitals**: LCP 2.1s, FID 45ms, CLS 0.08
- **Mobile Performance**: 89/100 (Optimierungspotenzial: +8 Punkte)
- **Schema Markup**: Restaurant, Menu, Review - vollständig implementiert

### Content Gap Analysis
**Identifizierte Opportunities**:
1. "Fine Dining München" - Search Volume: 2.400/Monat, Difficulty: 67%
2. "Michelin Restaurant München" - Search Volume: 1.200/Monat, Difficulty: 78%
3. "Weinbegleitung München" - Search Volume: 890/Monat, Difficulty: 45%

## COMPETITIVE INTELLIGENCE

### Benchmark Matrix
| Competitor | Digital Score | GMB Rating | Social Engagement | Est. Traffic |
|------------|---------------|------------|-------------------|--------------|
| Restaurant A | 87/100 | 4.7 (234) | 2.8% | 8.2k/month |
| Restaurant B | 91/100 | 4.6 (189) | 3.1% | 12.1k/month |
| **Your Position** | **96/100** | **4.8 (156)** | **4.2%** | **15.3k/month** |

### Strategic Recommendations

#### Immediate Actions (Q1)
1. **Content Hub Development**: Kulinarische Expertise-Blog → +25% organischer Traffic
2. **Influencer Partnerships**: Food-Blogger Kooperationen → +40% Social Reach
3. **Email Automation**: Segmentierte Kampagnen → +18% Wiederkehrende Gäste

#### Long-term Strategy (Q2-Q4)
1. **Omnichannel Experience**: Unified Customer Journey Mapping
2. **Predictive Analytics**: Reservierungs-Forecasting mit ML
3. **Brand Extension**: Catering/Events als zusätzliche Revenue Streams

## DATA EXPORT OPTIONS
- **CSV Export**: Alle KPIs und Metriken
- **PDF Report**: Executive Summary für Stakeholder
- **API Access**: Real-time Dashboard Integration
- **BI Integration**: Power BI / Tableau Connector verfügbar
      `;

      const result = VCResultParser.parseAnalysisResponse(
        mockClaudeResponse,
        'profi-lead-003',
        {
          model_used: 'claude-3.5-sonnet',
          token_usage: 4500,
          processing_time_ms: 22000
        }
      );

      // Profi erwartet umfassende Analyse
      expect(result.frameworks.porters_five_forces).toBeDefined();
      expect(result.frameworks.balanced_scorecard).toBeDefined();
      expect(result.long_term_strategy.length).toBeGreaterThan(3);
      
      // Prüfe auf technische Tiefe
      expect(mockClaudeResponse).toMatch(/KPI|Score|Analysis|Strategic/g);
      expect(mockClaudeResponse).toContain('Export'); // Export-Optionen
      expect(mockClaudeResponse).toContain('API'); // Technische Integration
    });
  });

  describe('Der Zeitknappe - Quick Wins Focus', () => {
    const zeitknappeLeadData: VCLeadData = {
      id: 'zeitknappe-lead-004',
      email: 'chef@schnell-bistro.de',
      name: 'Thomas Schmidt',
      business_name: 'Bistro Zeitlos',
      business_category: 'restaurant',
      business_location: 'Hamburg',
      locale: 'de',
      created_at: new Date().toISOString()
    };

    const zeitknappeContextData: VCContextData = {
      lead_id: 'zeitknappe-lead-004',
      business_profile: {
        name: 'Bistro Zeitlos',
        category: 'restaurant',
        location: 'Hamburg, Deutschland',
        website_url: 'https://bistro-zeitlos.de',
        gmb_url: 'https://goo.gl/maps/example4'
      },
      user_goals: [
        'Schnelle Verbesserungen mit wenig Aufwand',
        'Was bringt sofort mehr Kunden?',
        'Maximal 30 Minuten pro Woche Zeit'
      ],
      persona_type: 'Der Zeitknappe',
      data_quality_score: 68,
      analysis_preferences: {
        frameworks: ['Quick Wins'],
        detail_level: 'basic',
        focus_areas: ['immediate_impact', 'low_effort', 'automation']
      }
    };

    test('should prioritize quick wins with time estimates', () => {
      const builder = new VCTemplateBuilder('Der Zeitknappe');
      const prompt = builder.buildAnalysisPrompt(zeitknappeLeadData, zeitknappeContextData);

      expect(prompt).toContain('Der Zeitknappe');
      expect(prompt).toContain('schnelle Verbesserungen');
      expect(prompt).toContain('30 Minuten pro Woche');
      expect(prompt).toContain('sofort mehr Kunden');
      
      // Zeitknappe braucht Effizienz-Fokus
      expect(prompt).toMatch(/schnell|sofort|effizient|automatisch/i);
      expect(prompt).toMatch(/Minuten|Zeit|Aufwand/i);
    });

    test('should provide actionable quick wins with ROI and time investment', () => {
      const mockClaudeResponse = `
# SOFORT UMSETZBAR - IHRE TOP 3 QUICK WINS

## ⚡ Priorität 1: Google Bewertungen (15 Min Setup)
**Aufwand**: 15 Minuten einmalig + 2 Min/Tag
**Umsetzung**: QR-Code am Tisch → direkt zu Google Bewertungen
**Erwarteter Effekt**: +0.2 Sterne in 4 Wochen → ~400€ mehr Umsatz/Monat
**Status**: Sofort umsetzbar

## ⚡ Priorität 2: Google Posts (10 Min/Woche)
**Aufwand**: 10 Minuten wöchentlich
**Umsetzung**: Wöchentlich 1 Foto vom Tagesgericht posten
**Erwarteter Effekt**: +15% Sichtbarkeit bei lokalen Suchen → ~250€/Monat
**Automation**: Kann mit Handy-App gemacht werden

## ⚡ Priorität 3: Öffnungszeiten optimieren (5 Min einmalig)
**Aufwand**: 5 Minuten einmalig
**Umsetzung**: Spezielle Öffnungszeiten für Feiertage eintragen
**Erwarteter Effekt**: Weniger verlorene Kunden → ~150€/Monat gerettet
**Tipp**: Direkt in Google My Business App

## 📊 ZUSAMMENFASSUNG
- **Gesamtaufwand**: 30 Min Setup + 12 Min/Woche
- **Erwarteter ROI**: ~800€ zusätzlicher Umsatz/Monat
- **Amortisation**: Sofort (nur Zeitinvestition)
- **Nächster Schritt**: Mit Priorität 1 starten - heute noch!

## 🔄 AUTOMATISIERUNG (Bonus)
- **Google My Business App**: Benachrichtigungen für Bewertungen
- **Handy-Erinnerung**: Wöchentlich Foto posten
- **QR-Code Generator**: Kostenlos online verfügbar
      `;

      const result = VCResultParser.parseAnalysisResponse(
        mockClaudeResponse,
        'zeitknappe-lead-004',
        {
          model_used: 'claude-3.5-sonnet',
          token_usage: 2100,
          processing_time_ms: 14000
        }
      );

      // Zeitknappe erwartet wenige, aber effektive Aktionen
      expect(result.quick_wins.length).toBeLessThanOrEqual(3);
      expect(result.quick_wins[0].time_estimate).toContain('Min');
      expect(result.quick_wins[0].effort).toBe('low');
      expect(result.quick_wins[0].impact).toBe('high');
      
      // Prüfe auf Zeit- und ROI-Fokus
      expect(mockClaudeResponse).toMatch(/\d+ Min/g); // Zeitangaben
      expect(mockClaudeResponse).toMatch(/~\d+€/g); // ROI-Schätzungen
      expect(mockClaudeResponse).toContain('Sofort'); // Immediate impact
      expect(mockClaudeResponse).toContain('Automation'); // Effizienz
    });
  });

  describe('Cross-Persona Security Validation', () => {
    test('all persona prompts should pass security validation', () => {
      const personas = ['Der Skeptiker', 'Der Überforderte', 'Der Profi', 'Der Zeitknappe'];
      
      personas.forEach(persona => {
        const builder = new VCTemplateBuilder(persona);
        const mockContextData: VCContextData = {
          lead_id: 'test-lead',
          business_profile: {
            name: 'Test Restaurant',
            category: 'restaurant'
          },
          persona_type: persona
        };
        
        const mockLeadData: VCLeadData = {
          id: 'test-lead',
          email: 'test@restaurant.com',
          locale: 'de',
          created_at: new Date().toISOString()
        };

        const prompt = builder.buildAnalysisPrompt(mockLeadData, mockContextData);
        
        // Alle Prompts müssen Sicherheitskontext enthalten
        expect(prompt).toContain('SICHERHEITSKONTEXT');
        expect(prompt).toContain('VERBOTENE AKTIONEN');
        expect(prompt).toContain('unverbindlich');
        
        // Persona-spezifische Anpassungen
        expect(prompt).toContain(persona);
      });
    });

    test('all persona templates should have consistent variable validation', () => {
      const personas = ['Der Skeptiker', 'Der Überforderte', 'Der Profi', 'Der Zeitknappe'];
      
      personas.forEach(persona => {
        const validation = variableValidator.validateVariables('vc_analysis_v1', {
          business_name: 'Test Restaurant',
          business_category: 'restaurant',
          user_persona: persona,
          user_language: 'de'
        });
        
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });
  });

  describe('Performance and Token Usage', () => {
    test('should track prompt performance metrics by persona', () => {
      const personas = ['Der Skeptiker', 'Der Überforderte', 'Der Profi', 'Der Zeitknappe'];
      const performanceMetrics: Array<{
        persona: string;
        promptLength: number;
        expectedTokens: number;
        complexity: 'low' | 'medium' | 'high';
      }> = [];

      personas.forEach(persona => {
        const builder = new VCTemplateBuilder(persona);
        const mockContextData: VCContextData = {
          lead_id: 'perf-test',
          business_profile: { name: 'Test', category: 'restaurant' },
          persona_type: persona
        };
        
        const mockLeadData: VCLeadData = {
          id: 'perf-test',
          email: 'test@test.com',
          locale: 'de',
          created_at: new Date().toISOString()
        };

        const prompt = builder.buildAnalysisPrompt(mockLeadData, mockContextData);
        
        // Geschätzte Token-Anzahl (grob: 1 Token ≈ 4 Zeichen)
        const estimatedTokens = Math.ceil(prompt.length / 4);
        
        let complexity: 'low' | 'medium' | 'high' = 'medium';
        if (persona === 'Der Überforderte') complexity = 'low';
        if (persona === 'Der Profi') complexity = 'high';
        
        performanceMetrics.push({
          persona,
          promptLength: prompt.length,
          expectedTokens: estimatedTokens,
          complexity
        });
      });

      // Validiere erwartete Performance-Unterschiede
      const überforderte = performanceMetrics.find(m => m.persona === 'Der Überforderte');
      const profi = performanceMetrics.find(m => m.persona === 'Der Profi');
      
      expect(überforderte?.complexity).toBe('low');
      expect(profi?.complexity).toBe('high');
      expect(profi?.expectedTokens).toBeGreaterThan(überforderte?.expectedTokens || 0);
      
      // Log für Monitoring
      console.log('Persona Performance Metrics:', performanceMetrics);
    });
  });
});