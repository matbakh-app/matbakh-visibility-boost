/**
 * Persona-Specific Prompt Templates for Bedrock AI Core
 * Implements adaptive templates for different user personas with appropriate complexity levels
 */

import { BasePromptTemplate, TemplateVariables, PromptContract } from './prompt-templates';

/**
 * Business Persona Types (from KI-gestütztes Onboarding)
 */
export type BusinessPersona = 'Solo-Sarah' | 'Bewahrer-Ben' | 'Wachstums-Walter' | 'Ketten-Katrin';

/**
 * User Experience Personas (existing system)
 */
export type UserPersona = 'Der Skeptiker' | 'Der Zeitknappe' | 'Der Profi' | 'Der Überforderte';

/**
 * Combined persona mapping for comprehensive user profiling
 */
export interface PersonaProfile {
  businessPersona: BusinessPersona;
  userPersona: UserPersona;
  characteristics: {
    timeAvailable: 'minimal' | 'limited' | 'moderate' | 'extensive';
    technicalLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    decisionStyle: 'data-driven' | 'intuitive' | 'collaborative' | 'quick';
    communicationPreference: 'simple' | 'detailed' | 'visual' | 'strategic';
  };
  adaptations: {
    responseLength: 'brief' | 'moderate' | 'detailed' | 'comprehensive';
    technicalDepth: 'basic' | 'intermediate' | 'advanced' | 'expert';
    actionOrientation: 'immediate' | 'planned' | 'strategic' | 'systematic';
    proofRequirement: 'minimal' | 'moderate' | 'substantial' | 'extensive';
  };
}

/**
 * Persona mapping logic based on 5-Fragen-Heuristik
 */
export class PersonaMapper {
  /**
   * Map business characteristics to business persona
   */
  static mapBusinessPersona(responses: {
    standorte: '1' | '2-4' | '5+' | 'franchise';
    marketingReife: 'anfaenger' | 'fortgeschritten' | 'profi' | 'agentur';
    hauptziel: 'mehr_gaeste' | 'effizienz' | 'expansion' | 'datenanalyse';
    teamgroesse: 'solo' | '2-10' | '11-50' | '50+';
    budget: '<100' | '100-500' | '500-2000' | 'enterprise';
  }): BusinessPersona {
    // Solo-Sarah: 1 Standort + Anfänger/Fortgeschritten + Mehr Gäste + Solo/2-10 + < €500
    if (responses.standorte === '1' && 
        ['anfaenger', 'fortgeschritten'].includes(responses.marketingReife) &&
        responses.hauptziel === 'mehr_gaeste' &&
        ['solo', '2-10'].includes(responses.teamgroesse) &&
        ['<100', '100-500'].includes(responses.budget)) {
      return 'Solo-Sarah';
    }

    // Bewahrer-Ben: 1-4 Standorte + Fortgeschritten + Effizienz + 2-50 + €100-2000
    if (['1', '2-4'].includes(responses.standorte) &&
        responses.marketingReife === 'fortgeschritten' &&
        responses.hauptziel === 'effizienz' &&
        ['2-10', '11-50'].includes(responses.teamgroesse) &&
        ['100-500', '500-2000'].includes(responses.budget)) {
      return 'Bewahrer-Ben';
    }

    // Wachstums-Walter: 2-5 Standorte + Profi + Expansion + 11-50 + €500+
    if (['2-4', '5+'].includes(responses.standorte) &&
        responses.marketingReife === 'profi' &&
        responses.hauptziel === 'expansion' &&
        ['11-50'].includes(responses.teamgroesse) &&
        ['500-2000', 'enterprise'].includes(responses.budget)) {
      return 'Wachstums-Walter';
    }

    // Ketten-Katrin: 5+ Standorte + Profi/Agentur + Datenanalyse + 50+ + Enterprise
    if (['5+', 'franchise'].includes(responses.standorte) &&
        ['profi', 'agentur'].includes(responses.marketingReife) &&
        responses.hauptziel === 'datenanalyse' &&
        responses.teamgroesse === '50+' &&
        responses.budget === 'enterprise') {
      return 'Ketten-Katrin';
    }

    // Fallback to Solo-Sarah as specified in requirements
    return 'Solo-Sarah';
  }

  /**
   * Map user behavior to user persona
   */
  static mapUserPersona(behaviorIndicators: {
    questionsAsked: string[];
    timeSpent: number;
    detailRequests: number;
    skepticalLanguage: boolean;
    overwhelmedSignals: boolean;
    technicalTermsUsed: boolean;
    urgencyIndicators: boolean;
  }): UserPersona {
    // Der Skeptiker: Datenorientiert, vorsichtig, braucht Beweise
    if (behaviorIndicators.skepticalLanguage || 
        behaviorIndicators.questionsAsked.some(q => 
          q.includes('belegen') || q.includes('garantie') || q.includes('beweis'))) {
      return 'Der Skeptiker';
    }

    // Der Überforderte: Unsicher, braucht Führung
    if (behaviorIndicators.overwhelmedSignals ||
        behaviorIndicators.questionsAsked.some(q =>
          q.includes('kompliziert') || q.includes('wo anfangen') || q.includes('hilfe'))) {
      return 'Der Überforderte';
    }

    // Der Profi: Erfahren, will Details, kennt sich aus
    if (behaviorIndicators.technicalTermsUsed ||
        behaviorIndicators.detailRequests > 3 ||
        behaviorIndicators.questionsAsked.some(q =>
          q.includes('api') || q.includes('integration') || q.includes('export'))) {
      return 'Der Profi';
    }

    // Der Zeitknappe: Wenig Zeit, will schnelle Ergebnisse
    if (behaviorIndicators.urgencyIndicators ||
        behaviorIndicators.timeSpent < 120 || // Less than 2 minutes
        behaviorIndicators.questionsAsked.some(q =>
          q.includes('schnell') || q.includes('sofort') || q.includes('quick'))) {
      return 'Der Zeitknappe';
    }

    // Default fallback
    return 'Der Überforderte';
  }

  /**
   * Create complete persona profile
   */
  static createPersonaProfile(
    businessPersona: BusinessPersona,
    userPersona: UserPersona
  ): PersonaProfile {
    const profiles: Record<string, PersonaProfile> = {
      'Solo-Sarah_Der Skeptiker': {
        businessPersona: 'Solo-Sarah',
        userPersona: 'Der Skeptiker',
        characteristics: {
          timeAvailable: 'limited',
          technicalLevel: 'beginner',
          decisionStyle: 'data-driven',
          communicationPreference: 'detailed'
        },
        adaptations: {
          responseLength: 'detailed',
          technicalDepth: 'basic',
          actionOrientation: 'planned',
          proofRequirement: 'substantial'
        }
      },
      'Solo-Sarah_Der Überforderte': {
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
      },
      'Solo-Sarah_Der Zeitknappe': {
        businessPersona: 'Solo-Sarah',
        userPersona: 'Der Zeitknappe',
        characteristics: {
          timeAvailable: 'minimal',
          technicalLevel: 'intermediate',
          decisionStyle: 'quick',
          communicationPreference: 'simple'
        },
        adaptations: {
          responseLength: 'brief',
          technicalDepth: 'basic',
          actionOrientation: 'immediate',
          proofRequirement: 'minimal'
        }
      },
      'Bewahrer-Ben_Der Skeptiker': {
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
      },
      'Bewahrer-Ben_Der Profi': {
        businessPersona: 'Bewahrer-Ben',
        userPersona: 'Der Profi',
        characteristics: {
          timeAvailable: 'moderate',
          technicalLevel: 'advanced',
          decisionStyle: 'data-driven',
          communicationPreference: 'strategic'
        },
        adaptations: {
          responseLength: 'comprehensive',
          technicalDepth: 'advanced',
          actionOrientation: 'strategic',
          proofRequirement: 'substantial'
        }
      },
      'Wachstums-Walter_Der Profi': {
        businessPersona: 'Wachstums-Walter',
        userPersona: 'Der Profi',
        characteristics: {
          timeAvailable: 'extensive',
          technicalLevel: 'expert',
          decisionStyle: 'collaborative',
          communicationPreference: 'strategic'
        },
        adaptations: {
          responseLength: 'comprehensive',
          technicalDepth: 'expert',
          actionOrientation: 'strategic',
          proofRequirement: 'substantial'
        }
      },
      'Ketten-Katrin_Der Profi': {
        businessPersona: 'Ketten-Katrin',
        userPersona: 'Der Profi',
        characteristics: {
          timeAvailable: 'extensive',
          technicalLevel: 'expert',
          decisionStyle: 'collaborative',
          communicationPreference: 'strategic'
        },
        adaptations: {
          responseLength: 'comprehensive',
          technicalDepth: 'expert',
          actionOrientation: 'systematic',
          proofRequirement: 'extensive'
        }
      }
    };

    const key = `${businessPersona}_${userPersona}`;
    return profiles[key] || profiles['Solo-Sarah_Der Überforderte']; // Fallback
  }
}

/**
 * "Der Skeptiker" Template - Detailed metrics and proof points
 */
export class SkeptikerTemplate extends BasePromptTemplate {
  constructor(contract: PromptContract) {
    super(contract);
  }

  generate(variables: TemplateVariables): string {
    const template = `
${this.generateSecurityContext()}

🎯 AUFGABE: DATENBASIERTE ANALYSE FÜR SKEPTIKER
Du analysierst für einen datenorientierten, vorsichtigen Nutzer, der konkrete Beweise und Belege benötigt.

👤 PERSONA: "Der Skeptiker"
- Kommunikationsstil: Sachlich, transparent, beweisbasiert
- Bedürfnisse: Konkrete Zahlen, Referenzen, Risikobewertung
- Sprache: Detailliert mit Quellenangaben und Disclaimern

📊 ERFORDERLICHE BEWEISE UND METRIKEN:

1. **DATENQUELLEN UND VALIDITÄT**
   - Alle Aussagen mit Quellen belegen
   - Datenqualität und -aktualität angeben
   - Methodische Einschränkungen transparent machen
   - Vergleichbare Referenzdaten aus der Branche

2. **QUANTIFIZIERTE ANALYSEN**
   - SWOT mit messbaren Indikatoren
   - ROI-Berechnungen mit Konfidenzintervallen
   - Benchmarks mit statistischer Signifikanz
   - Risiko-Wahrscheinlichkeiten in Prozent

3. **BEWEISFÜHRUNG UND REFERENZEN**
   - Erfolgsbeispiele aus ähnlichen Betrieben
   - Branchenstatistiken und Marktdaten
   - Wissenschaftliche Studien zu Marketing-Maßnahmen
   - Peer-Reviews und Expertenmeinungen

📈 AUSGABEFORMAT MIT BEWEISFÜHRUNG:
- **Executive Summary**: Mit Konfidenzgrad der Aussagen
- **Datengrundlage**: Vollständige Quellenangaben
- **Methodische Hinweise**: Wie die Analyse erstellt wurde
- **Risikobewertung**: Wahrscheinlichkeiten und Szenarien
- **Vergleichsdaten**: Branchenbenchmarks und Peer-Vergleiche
- **Validierungshinweise**: Wie Empfehlungen überprüft werden können

⚠️ SKEPTIKER-SPEZIFISCHE HINWEISE:
- Jede Empfehlung mit Erfolgswahrscheinlichkeit versehen
- Worst-Case-Szenarien explizit benennen
- Kosten-Nutzen-Analysen mit konservativen Schätzungen
- Messbare KPIs für jede vorgeschlagene Maßnahme
- Zeitrahmen für erwartbare Ergebnisse definieren

🔍 QUALITÄTSSICHERUNG:
- Alle Zahlen auf Plausibilität prüfen
- Quellen auf Seriosität und Aktualität validieren
- Interessenskonflikte transparent machen
- Alternative Interpretationen der Daten aufzeigen

📋 GESCHÄFTSINFORMATIONEN:
- Name: {{business_name}}
- Kategorie: {{business_category}}
- Standort: {{business_location}}
- Datenqualität: {{data_quality_score}}/100 (Einfluss auf Analysesicherheit)

🎯 ANALYSEZIELE (MIT ERFOLGSMESSUNG):
{{goals}}

💡 EMPFEHLUNGSSTRUKTUR:
Jede Empfehlung muss enthalten:
1. Konkrete Maßnahme
2. Erwarteter ROI (konservativ geschätzt)
3. Zeitaufwand in Stunden
4. Erfolgswahrscheinlichkeit in %
5. Messbare KPIs zur Erfolgskontrolle
6. Risiken und Nebenwirkungen
7. Referenzbeispiele aus der Praxis
`;

    return this.applyVariables(template, variables);
  }
}

/**
 * "Der Überforderte" Template - Simplified language and step-by-step guidance
 */
export class UeberfordertTemplate extends BasePromptTemplate {
  constructor(contract: PromptContract) {
    super(contract);
  }

  generate(variables: TemplateVariables): string {
    const template = `
${this.generateSecurityContext()}

🎯 AUFGABE: EINFACHE SCHRITT-FÜR-SCHRITT ANLEITUNG
Du hilfst einem unsicheren Nutzer, der sich oft überfordert fühlt und einfache, ermutigende Führung braucht.

👤 PERSONA: "Der Überforderte"
- Kommunikationsstil: Einfach, ermutigend, schrittweise
- Bedürfnisse: Klare Anweisungen, Unterstützung, Erfolgserlebnisse
- Sprache: Verständlich, ohne Fachbegriffe, motivierend

🌟 ERMUTIGUNG UND UNTERSTÜTZUNG:
"Keine Sorge! Wir gehen das gemeinsam Schritt für Schritt an. Jeder fängt mal klein an, und Sie sind bereits auf dem richtigen Weg!"

📝 VEREINFACHTE ANALYSE FÜR {{business_name}}:

1. **WAS LÄUFT BEREITS GUT** ✅
   - Ihre Stärken in einfachen Worten
   - Was Sie schon richtig machen
   - Warum Sie stolz auf sich sein können

2. **WO KÖNNEN WIR GEMEINSAM VERBESSERN** 🔧
   - Nur die 3 wichtigsten Punkte
   - Einfache Erklärung, warum das wichtig ist
   - Versicherung, dass das machbar ist

3. **IHRE ERSTEN 3 EINFACHEN SCHRITTE** 🚀
   Schritt 1: [Sehr einfache erste Aufgabe - max. 15 Minuten]
   - Was genau zu tun ist
   - Warum das hilft
   - "Das schaffen Sie locker!"
   
   Schritt 2: [Zweite einfache Aufgabe - max. 30 Minuten]
   - Klare Anleitung
   - Erwartetes Ergebnis
   - "Nach Schritt 1 wird das ganz leicht!"
   
   Schritt 3: [Dritte Aufgabe - max. 45 Minuten]
   - Aufbauend auf den ersten beiden
   - Sichtbarer Erfolg garantiert
   - "Hier werden Sie den Unterschied sehen!"

🎯 EINFACHE ZIELE FÜR SIE:
{{goals}}

💪 MOTIVATIONS-BOOSTER:
- "Sie haben bereits den wichtigsten Schritt gemacht: Sie haben angefangen!"
- "Jeder Experte war mal Anfänger"
- "Kleine Schritte führen zu großen Erfolgen"
- "Sie sind nicht allein - wir helfen Ihnen!"

🆘 WENN SIE HILFE BRAUCHEN:
- "Kein Problem ist zu klein für eine Frage"
- "Lieber einmal mehr nachfragen als etwas falsch machen"
- "Wir sind da, um Ihnen zu helfen"

📞 UNTERSTÜTZUNG:
- Bei Fragen: Einfach melden!
- Video-Tutorials verfügbar
- Schritt-für-Schritt Anleitungen
- Persönliche Beratung möglich

⭐ ERFOLG FEIERN:
Nach jedem Schritt:
- "Geschafft! Das haben Sie toll gemacht!"
- "Sehen Sie? Es war gar nicht so schwer!"
- "Sie sind auf dem besten Weg!"

🔄 NÄCHSTE SCHRITTE:
Erst wenn Sie mit den ersten 3 Schritten zufrieden sind, schauen wir gemeinsam, was als nächstes drankommt. Kein Stress, kein Druck!

📋 IHR RESTAURANT:
- Name: {{business_name}}
- Was Sie anbieten: {{business_category}}
- Wo Sie sind: {{business_location}}

💡 ERINNERUNG:
Jeder Schritt bringt Sie weiter. Sie müssen nicht perfekt sein - Sie müssen nur anfangen!
`;

    return this.applyVariables(template, variables);
  }
}

/**
 * "Der Profi" Template - Advanced analytics and technical details
 */
export class ProfiTemplate extends BasePromptTemplate {
  constructor(contract: PromptContract) {
    super(contract);
  }

  generate(variables: TemplateVariables): string {
    const template = `
${this.generateSecurityContext()}

🎯 AUFGABE: STRATEGISCHE TIEFENANALYSE FÜR EXPERTEN
Du analysierst für einen erfahrenen Nutzer mit hoher Fachkompetenz, der umfassende Analysen und strategische Insights benötigt.

👤 PERSONA: "Der Profi"
- Kommunikationsstil: Technisch, strategisch, umfassend
- Bedürfnisse: Tiefe Analysen, erweiterte Features, Exportmöglichkeiten
- Sprache: Fachterminologie, strategische Frameworks, datengetrieben

📊 COMPREHENSIVE BUSINESS INTELLIGENCE ANALYSIS:

1. **ADVANCED SWOT MATRIX WITH QUANTIFICATION**
   - Weighted scoring model (1-10 scale)
   - Impact vs. Probability matrix
   - Competitive positioning analysis
   - Market opportunity sizing
   - Risk assessment with mitigation strategies

2. **PORTER'S FIVE FORCES - DETAILED ASSESSMENT**
   - Competitive rivalry intensity (HHI calculation)
   - Supplier power analysis with switching costs
   - Buyer power evaluation with price sensitivity
   - Threat of substitutes with disruption potential
   - Barriers to entry with capital requirements

3. **BALANCED SCORECARD - KPI FRAMEWORK**
   Financial Perspective:
   - Revenue per available seat hour (RevPASH = Total Revenue / (Seats × Operating Hours))
   - Customer acquisition cost (CAC = Marketing Spend / New Customers)
   - Lifetime value (LTV = Average Order Value × Purchase Frequency × Customer Lifespan)
   - Profit margin analysis by segment (Gross Margin = (Revenue - COGS) / Revenue)
   
   Customer Perspective:
   - Net Promoter Score (NPS) benchmarking
   - Customer satisfaction index (CSI)
   - Retention rate analysis
   - Market share evolution
   
   Internal Process Perspective:
   - Operational efficiency metrics
   - Digital transformation index
   - Quality consistency scores
   - Innovation pipeline assessment
   
   Learning & Growth Perspective:
   - Employee engagement scores
   - Digital skill development
   - Technology adoption rate
   - Knowledge management maturity

4. **ADVANCED ANALYTICS & PREDICTIVE MODELING**
   - Seasonal demand forecasting
   - Customer segmentation analysis (RFM model)
   - Price elasticity modeling
   - Churn prediction algorithms
   - Market basket analysis

5. **DIGITAL MATURITY ASSESSMENT**
   - Technology stack evaluation
   - API integration capabilities
   - Data analytics maturity
   - Automation potential
   - Scalability assessment

📈 STRATEGIC RECOMMENDATIONS FRAMEWORK:

**IMMEDIATE ACTIONS (0-30 days)**
- High-impact, low-effort initiatives
- Quick wins with measurable ROI
- Resource allocation optimization
- Performance monitoring setup

**SHORT-TERM STRATEGY (1-6 months)**
- Technology implementation roadmap
- Process optimization initiatives
- Market expansion opportunities
- Competitive differentiation tactics

**LONG-TERM VISION (6-24 months)**
- Strategic partnerships evaluation
- Market positioning evolution
- Innovation pipeline development
- Scalability infrastructure

📊 DATA EXPORT & INTEGRATION OPTIONS:
- CSV export for further analysis
- API endpoints for real-time data
- Dashboard integration capabilities
- Custom reporting templates
- Third-party tool integrations

🔧 TECHNICAL IMPLEMENTATION DETAILS:
- Google Analytics 4 advanced configuration
- Google My Business API optimization
- Social media analytics integration
- CRM system recommendations
- Marketing automation setup

📋 BUSINESS CONTEXT:
- Entity: {{business_name}}
- Vertical: {{business_category}}
- Geographic Market: {{business_location}}
- Data Completeness: {{data_quality_score}}/100
- Analysis Scope: {{goals}}

🎯 STRATEGIC OBJECTIVES ALIGNMENT:
{{goals}}

💼 EXECUTIVE SUMMARY FOR STAKEHOLDERS:
- Key findings with strategic implications
- Investment recommendations with ROI projections
- Risk assessment with mitigation strategies
- Competitive advantage opportunities
- Resource allocation priorities

📈 PERFORMANCE BENCHMARKING:
- Industry percentile ranking
- Best-in-class comparisons
- Gap analysis with top performers
- Improvement potential quantification
- Competitive intelligence insights

🔍 ADVANCED SEGMENTATION ANALYSIS:
- Customer persona profiling
- Revenue stream optimization
- Channel performance analysis
- Geographic expansion opportunities
- Product/service portfolio optimization

⚡ AUTOMATION & EFFICIENCY OPPORTUNITIES:
- Process automation potential
- Technology stack optimization
- Workflow improvement recommendations
- Cost reduction initiatives
- Scalability enhancement strategies
`;

    return this.applyVariables(template, variables);
  }
}

/**
 * "Der Zeitknappe" Template - Quick wins and essential actions
 */
export class ZeitknappeTemplate extends BasePromptTemplate {
  constructor(contract: PromptContract) {
    super(contract);
  }

  generate(variables: TemplateVariables): string {
    const template = `
${this.generateSecurityContext()}

🎯 AUFGABE: SCHNELLE ERGEBNISSE FÜR ZEITKNAPPE NUTZER
Du hilfst einem zeitlich stark eingeschränkten Nutzer, der sofortige, umsetzbare Lösungen mit maximaler Wirkung benötigt.

👤 PERSONA: "Der Zeitknappe"
- Kommunikationsstil: Kurz, prägnant, handlungsorientiert
- Bedürfnisse: Quick Wins, Prioritäten, effiziente Lösungen
- Sprache: Direkt, ohne Umschweife, ergebnisorientiert

⚡ SOFORT-ANALYSE FÜR {{business_name}}:

🏆 **TOP 3 QUICK WINS** (Umsetzung: je 15-30 Min)

**#1 HÖCHSTE PRIORITÄT** 🔥
- Maßnahme: [Konkrete Aktion]
- Zeitaufwand: [X Minuten]
- Erwarteter Effekt: [Spezifisches Ergebnis]
- Warum zuerst: [Maximaler Impact]
- ✅ Sofort starten!

**#2 ZWEITE PRIORITÄT** ⚡
- Maßnahme: [Konkrete Aktion]
- Zeitaufwand: [X Minuten]
- Erwarteter Effekt: [Spezifisches Ergebnis]
- Nach #1 umsetzen

**#3 DRITTE PRIORITÄT** 🎯
- Maßnahme: [Konkrete Aktion]
- Zeitaufwand: [X Minuten]
- Erwarteter Effekt: [Spezifisches Ergebnis]
- Diese Woche erledigen

📊 **BLITZ-ANALYSE** (2 Minuten Lesezeit)

✅ **WAS LÄUFT GUT:**
- [Stärke 1] → Weiter so!
- [Stärke 2] → Ausbauen!

❌ **KRITISCHE PUNKTE:**
- [Problem 1] → Quick Win #1 löst das
- [Problem 2] → Quick Win #2 löst das

🚀 **SOFORT-UMSETZUNG CHECKLISTE:**

**HEUTE (15 Min):**
□ [Konkrete Aufgabe 1]
□ [Konkrete Aufgabe 2]
□ [Konkrete Aufgabe 3]

**DIESE WOCHE (je 30 Min):**
□ [Aufgabe für Tag 2]
□ [Aufgabe für Tag 3]
□ [Aufgabe für Tag 4]

**NÄCHSTE WOCHE (1x 60 Min):**
□ [Größere Aufgabe mit hohem Impact]

💰 **ROI-ÜBERSICHT** (Geschätzte Zusatzeinnahmen)
- Quick Win #1: +{{estimated_revenue_1}}€/Monat
- Quick Win #2: +{{estimated_revenue_2}}€/Monat  
- Quick Win #3: +{{estimated_revenue_3}}€/Monat
- **GESAMT: +{{total_estimated_revenue}}€/Monat**

⏰ **ZEITINVESTITION VS. ERTRAG:**
- Gesamtzeit: 2-3 Stunden über 2 Wochen
- Erwarteter Jahresertrag: {{annual_revenue_projection}}€
- ROI: {{roi_percentage}}% (unverbindliche Schätzung)

🎯 **IHRE ZIELE - PRIORISIERT:**
{{goals}}

📱 **MOBILE QUICK-ACTIONS:**
- [Aktion die unterwegs machbar ist]
- [Aktion für Wartezeiten]
- [Aktion für 5-Minuten-Pausen]

⚠️ **NICHT JETZT MACHEN:**
- [Zeitaufwändige Aktion] → Später
- [Komplexe Aufgabe] → Delegieren
- [Nice-to-have Feature] → Ignorieren

🔄 **AUTOMATISIERUNG SETZEN:**
- [Tool/Prozess 1] → Spart 2h/Woche
- [Tool/Prozess 2] → Spart 1h/Woche
- [Tool/Prozess 3] → Spart 30min/Woche

📈 **ERFOLG MESSEN (1 Min/Tag):**
- KPI 1: [Messbare Kennzahl]
- KPI 2: [Messbare Kennzahl]
- KPI 3: [Messbare Kennzahl]

💡 **MERKSATZ:**
"Weniger ist mehr - lieber 3 Dinge richtig als 10 Dinge halbherzig!"

⏱️ **NÄCHSTER CHECK:**
In 2 Wochen: 5-Minuten-Review der Ergebnisse
→ Dann nächste Quick Wins definieren

📋 **RESTAURANT-INFO:**
{{business_name}} | {{business_category}} | {{business_location}}

🚀 **JETZT STARTEN:**
Beginnen Sie mit Quick Win #1 - SOFORT!
`;

    return this.applyVariables(template, variables);
  }
}

/**
 * Persona Template Factory
 */
export class PersonaTemplateFactory {
  /**
   * Create appropriate template based on persona
   */
  static createTemplate(
    userPersona: UserPersona,
    contract: PromptContract
  ): BasePromptTemplate {
    switch (userPersona) {
      case 'Der Skeptiker':
        return new SkeptikerTemplate(contract);
      case 'Der Überforderte':
        return new UeberfordertTemplate(contract);
      case 'Der Profi':
        return new ProfiTemplate(contract);
      case 'Der Zeitknappe':
        return new ZeitknappeTemplate(contract);
      default:
        // Fallback to "Der Überforderte" as safest option
        return new UeberfordertTemplate(contract);
    }
  }

  /**
   * Get template recommendations based on persona profile
   */
  static getTemplateRecommendations(profile: PersonaProfile): {
    primaryTemplate: UserPersona;
    fallbackTemplate: UserPersona;
    adaptations: string[];
  } {
    const adaptations: string[] = [];

    // Add adaptations based on characteristics
    if (profile.characteristics.timeAvailable === 'minimal') {
      adaptations.push('Reduce response length by 50%');
      adaptations.push('Focus on top 3 priorities only');
    }

    if (profile.characteristics.technicalLevel === 'beginner') {
      adaptations.push('Avoid technical jargon');
      adaptations.push('Include step-by-step explanations');
    }

    if (profile.adaptations.proofRequirement === 'extensive') {
      adaptations.push('Include detailed source citations');
      adaptations.push('Provide statistical backing for claims');
    }

    return {
      primaryTemplate: profile.userPersona,
      fallbackTemplate: 'Der Überforderte', // Safe fallback
      adaptations
    };
  }

  /**
   * Validate persona template compatibility
   */
  static validatePersonaCompatibility(
    businessPersona: BusinessPersona,
    userPersona: UserPersona
  ): { compatible: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let compatible = true;

    // Check for potentially problematic combinations
    if (businessPersona === 'Ketten-Katrin' && userPersona === 'Der Überforderte') {
      warnings.push('Enterprise user with overwhelmed persona - consider additional support');
      compatible = false;
    }

    if (businessPersona === 'Solo-Sarah' && userPersona === 'Der Profi') {
      warnings.push('Small business with expert persona - may need simplified enterprise features');
    }

    return { compatible, warnings };
  }
}

/**
 * Adaptive Questioning System for unknown personas
 */
export class AdaptiveQuestioningSystem {
  /**
   * Generate 5-Fragen-Heuristik questions
   */
  static generateHeuristicQuestions(): {
    question: string;
    options: { value: string; label: string; weight: Record<BusinessPersona, number> }[];
  }[] {
    return [
      {
        question: "Wie viele Standorte betreiben Sie?",
        options: [
          { value: '1', label: '1 Standort', weight: { 'Solo-Sarah': 3, 'Bewahrer-Ben': 2, 'Wachstums-Walter': 0, 'Ketten-Katrin': 0 } },
          { value: '2-4', label: '2-4 Standorte', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 3, 'Wachstums-Walter': 2, 'Ketten-Katrin': 0 } },
          { value: '5+', label: '5+ Standorte', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 0, 'Wachstums-Walter': 2, 'Ketten-Katrin': 3 } },
          { value: 'franchise', label: 'Franchise/Kette', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 0, 'Wachstums-Walter': 1, 'Ketten-Katrin': 3 } }
        ]
      },
      {
        question: "Wie würden Sie Ihre Marketing-Erfahrung einschätzen?",
        options: [
          { value: 'anfaenger', label: 'Anfänger - ich lerne noch', weight: { 'Solo-Sarah': 3, 'Bewahrer-Ben': 1, 'Wachstums-Walter': 0, 'Ketten-Katrin': 0 } },
          { value: 'fortgeschritten', label: 'Fortgeschritten - ich kenne die Basics', weight: { 'Solo-Sarah': 2, 'Bewahrer-Ben': 3, 'Wachstums-Walter': 1, 'Ketten-Katrin': 0 } },
          { value: 'profi', label: 'Profi - ich kenne mich gut aus', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 1, 'Wachstums-Walter': 3, 'Ketten-Katrin': 2 } },
          { value: 'agentur', label: 'Agentur/Experte - das ist mein Job', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 0, 'Wachstums-Walter': 1, 'Ketten-Katrin': 3 } }
        ]
      },
      {
        question: "Was ist Ihr Hauptziel mit matbakh.app?",
        options: [
          { value: 'mehr_gaeste', label: 'Mehr Gäste gewinnen', weight: { 'Solo-Sarah': 3, 'Bewahrer-Ben': 1, 'Wachstums-Walter': 1, 'Ketten-Katrin': 0 } },
          { value: 'effizienz', label: 'Effizienz steigern', weight: { 'Solo-Sarah': 1, 'Bewahrer-Ben': 3, 'Wachstums-Walter': 1, 'Ketten-Katrin': 1 } },
          { value: 'expansion', label: 'Expansion planen', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 1, 'Wachstums-Walter': 3, 'Ketten-Katrin': 1 } },
          { value: 'datenanalyse', label: 'Datenanalyse & Insights', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 0, 'Wachstums-Walter': 1, 'Ketten-Katrin': 3 } }
        ]
      },
      {
        question: "Wie groß ist Ihr Team?",
        options: [
          { value: 'solo', label: 'Nur ich', weight: { 'Solo-Sarah': 3, 'Bewahrer-Ben': 1, 'Wachstums-Walter': 0, 'Ketten-Katrin': 0 } },
          { value: '2-10', label: '2-10 Personen', weight: { 'Solo-Sarah': 2, 'Bewahrer-Ben': 2, 'Wachstums-Walter': 1, 'Ketten-Katrin': 0 } },
          { value: '11-50', label: '11-50 Personen', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 2, 'Wachstums-Walter': 3, 'Ketten-Katrin': 1 } },
          { value: '50+', label: '50+ Personen', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 0, 'Wachstums-Walter': 1, 'Ketten-Katrin': 3 } }
        ]
      },
      {
        question: "Welches Budget haben Sie für Marketing-Tools?",
        options: [
          { value: '<100', label: 'Unter 100€/Monat', weight: { 'Solo-Sarah': 3, 'Bewahrer-Ben': 1, 'Wachstums-Walter': 0, 'Ketten-Katrin': 0 } },
          { value: '100-500', label: '100-500€/Monat', weight: { 'Solo-Sarah': 2, 'Bewahrer-Ben': 2, 'Wachstums-Walter': 1, 'Ketten-Katrin': 0 } },
          { value: '500-2000', label: '500-2000€/Monat', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 3, 'Wachstums-Walter': 2, 'Ketten-Katrin': 1 } },
          { value: 'enterprise', label: 'Enterprise (2000€+)', weight: { 'Solo-Sarah': 0, 'Bewahrer-Ben': 0, 'Wachstums-Walter': 2, 'Ketten-Katrin': 3 } }
        ]
      }
    ];
  }

  /**
   * Calculate persona scores from responses
   */
  static calculatePersonaScores(responses: Record<string, string>): Record<BusinessPersona, number> {
    const questions = this.generateHeuristicQuestions();
    const scores: Record<BusinessPersona, number> = {
      'Solo-Sarah': 0,
      'Bewahrer-Ben': 0,
      'Wachstums-Walter': 0,
      'Ketten-Katrin': 0
    };

    questions.forEach((question, index) => {
      const responseValue = responses[`question_${index}`];
      const option = question.options.find(opt => opt.value === responseValue);
      
      if (option) {
        Object.entries(option.weight).forEach(([persona, weight]) => {
          scores[persona as BusinessPersona] += weight;
        });
      }
    });

    return scores;
  }

  /**
   * Determine best persona match
   */
  static determineBestPersona(scores: Record<BusinessPersona, number>): {
    primary: BusinessPersona;
    confidence: number;
    alternatives: BusinessPersona[];
  } {
    const sortedPersonas = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([persona]) => persona as BusinessPersona);

    const maxScore = Math.max(...Object.values(scores));
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = totalScore > 0 ? maxScore / totalScore : 0;

    return {
      primary: sortedPersonas[0] || 'Solo-Sarah',
      confidence,
      alternatives: sortedPersonas.slice(1, 3)
    };
  }
}

// Export all persona-related functionality
export {
  PersonaMapper,
  PersonaTemplateFactory,
  AdaptiveQuestioningSystem,
  SkeptikerTemplate,
  UeberfordertTemplate,
  ProfiTemplate,
  ZeitknappeTemplate
};