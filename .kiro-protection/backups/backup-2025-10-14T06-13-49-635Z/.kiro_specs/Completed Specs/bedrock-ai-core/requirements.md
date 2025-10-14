# Requirements Document - Bedrock AI Core

## Introduction

The Bedrock AI Core is the central artificial intelligence layer for matbakh.app, providing intelligent analysis and content generation capabilities for restaurant business optimization. This system will primarily leverage Claude 3.5 Sonnet via AWS Bedrock, with future expansion to Google Gemini via Opal integration.

The AI Core will power the Visibility Check system, business analysis, content generation, and strategic recommendations, transforming matbakh.app from a simple tool into an intelligent business advisor for restaurants.

## Core Principles & Security Framework

### 🔑 Core Principles

| Prinzip | Bedeutung |
|---------|-----------|
| **Sicherheitsverantwortung** | Kiro ist verantwortlich für alle IAM-, Prompt- und Logging-Regeln der KI-Nutzung |
| **Prompt-Guarding** | Jedes KI-Modell (Claude, Gemini etc.) darf nur das tun, was im jeweiligen Prompt ausdrücklich erlaubt ist |
| **Agenten statt Direktzugriff** | Alle KI-Zugriffe erfolgen über Lambda-Agenten mit minimalen Rechten |
| **Audit-First** | Jede Antwort der KI wird protokolliert, redacted, archiviert – DSGVO-ready |
| **Prompt-Schutzpflicht** | Explizite Verbote in jedem Prompt (keine Speicherung, kein Nachladen, kein API-Call) |
| **Erweiterbarkeit** | Vorbereitet für: Gemini, Opal, Google Calendar, Gmail, Drive, YouTube, Ads |

### 🧩 Frame 1: Rollenverständnis

**Name:** Matbakh AI Engine  
**Core:** Claude 3.5 Sonnet via AWS Bedrock  
**Erweiterung:** Google Gemini via Opal (optional)  
**Verantwortlicher Agent:** Kiro (IAM + Execution)

**Zweck:** Unterstützt Nutzer:innen, Agenten und Systeme bei:
- Sichtbarkeitsanalysen (VC)
- Content-Erstellung (IG, GBP, Events)
- Tuning von Texten (Rewrite / Phrasing)
- DSGVO-Risikoanalysen
- Handlungsempfehlungen mit ROI-Schätzung

Claude ist keine kreative Instanz, sondern ein strukturierter Assistent mit klaren Regeln.

### 🧩 Frame 2: Prompt-Kernstruktur (für Claude, von Kiro enforced)

**[🧩 KI-Regeln für Claude / Bedrock]**

Du arbeitest im Kontext der Matbakh.app, einer nutzerzentrierten Plattform für Gastronomie, Events und digitale Sichtbarkeit. Du bist ein KI-Assistent, der personalisiert, empathisch und zielführend unterstützt.

**Du darfst:**
- Webanfragen zu öffentlichen Datenquellen durchführen (Google, Instagram, etc.)
- Nutzerfreundliche Hinweise und weiterführende Tipps ergänzen
- Ausgabeformate flexibel gestalten, z. B. Tabelle, Text, CTA
- Kontext interpretieren, um passende Empfehlungen zu geben

**Du darfst NICHT:**
- Sensible Daten speichern oder weiterleiten
- Nicht-freigegebene APIs aufrufen
- Datenbanken ohne Freigabe verändern
- Rückschlüsse auf Personenidentitäten ziehen

**⚠️ Sicherheits- & Handlungslimitierungen (Prompt-Level, durch Kiro enforced):**

1. Du darfst Webanfragen nur dann ausführen, wenn sie ausdrücklich im Prompt erlaubt und technisch möglich sind
2. Du darfst Zusatzinformationen und Empfehlungen geben, wenn sie für den Nutzer nützlich und relevant sind
3. Du darfst dein Ausgabeformat dynamisch anpassen, solange es dem Ziel des Prompts entspricht
4. Du darfst in Ausnahmefällen zusätzliche Hinweise oder Warnungen ergänzen, wenn ein Risiko offensichtlich ist
5. Du darfst keine personenbezogenen Daten speichern, weitergeben oder auf externe Dritte zugreifen

### 🧩 Frame 3: Claude-Bedrock-Zugriffsrahmen

| Komponente | Zugriff | Verantwortlich |
|------------|---------|----------------|
| BedrockRuntimeClient | InvokeModel | Kiro |
| Lambda-Trigger | POST /ai/* | Kiro |
| Logging | ai_usage_logs, CloudWatch, S3 (TTL) | Kiro |
| IAM-Permission | Bedrock-only, Secrets (Prompt Templates), Logs | Kiro |
| Prompt-Ausführung | via Template mit Guards | Kiro |

### 🧩 Frame 4: Dynamische Prompt-Typen

| Typ | Verhalten |
|-----|-----------|
| `ai/insight` | Claude darf recherchieren, strukturieren, vergleichen |
| `ai/generate` | Claude darf kreativ sein, stilisieren, vorschlagen |
| `ai/rewrite` | Claude darf verbessern, kürzen, vereinfachen |
| `ai/detect` | Claude darf Risiken erkennen, DSGVO-Checks machen |

### 🧩 Frame 5: Initiale Task-Beispiele

**VC-Advisor:** Analysiert Sichtbarkeitsdaten → Sichtbarkeits-Zusammenfassung, 3 Quick Wins, DSGVO-Risiko  
**Content Generator:** Erstellt Instagram/GBP-Beiträge → Caption mit Hashtags, max. 120 Wörter, CTAs  
**Text-Rewriter:** Passt Texte an → Tonlage, Länge, Zielgruppe ohne Superlative, genderneutral

### 🧩 Frame 6: Vorbereitung auf Gemini (Google)

| Name | Pfad | Aktiv bei |
|------|------|-----------|
| Claude Sonnet VC Advisor | `/ai/insight` | VC-Analyse (Sichtbarkeit, DSGVO, Benchmarks) |
| Claude Sonnet Content Assist | `/ai/generate` | Content-Komposition |
| Claude Sonnet Rewrite | `/ai/rewrite` | Textoptimierung |
| Gemini (später) | `/ai/compare` | Dual-Modell-Testphase |

### 🧩 Frame 7: Rolle von Kiro

Kiro übernimmt:
- Template-Verwaltung (zentrale Prompt-DB, Fallback-Templates)
- Prompt-Guards enforcement
- IAM und Secrets Zugang regeln
- Cost-Limits und Alarme kontrollieren
- Modellwahl (Claude vs Gemini) verwalten
- Fallback-Strategien bei Model-Failures implementieren
- Rollback-Skript `disable-bedrock-agent.sh` bereithalten
- UI-Einbindung via Feature-Flags koordinieren

## Requirements

### Requirement 1: AWS Bedrock Integration

**User Story:** As a restaurant owner, I want AI-powered business analysis so that I can receive intelligent insights about my digital presence and optimization opportunities.

#### Acceptance Criteria

1. WHEN the system receives a visibility check request THEN it SHALL invoke AWS Bedrock with Claude 3.5 Sonnet model
2. WHEN Bedrock API is called THEN the system SHALL use the configured model ID "anthropic.claude-3-5-sonnet-20240620-v1:0"
3. IF Bedrock service is unavailable THEN the system SHALL fallback to cached responses or error handling
4. WHEN AI analysis is requested THEN the system SHALL authenticate using AWS credentials from environment variables
5. WHEN processing requests THEN the system SHALL respect AWS Bedrock rate limits and implement proper retry logic

### Requirement 2: Intelligent Visibility Analysis

**User Story:** As a restaurant owner, I want comprehensive AI analysis of my online presence so that I can understand my strengths, weaknesses, and improvement opportunities.

#### Acceptance Criteria

1. WHEN restaurant data is analyzed THEN the system SHALL generate SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
2. WHEN visibility metrics are processed THEN the system SHALL provide Porter's Five Forces analysis for competitive positioning
3. WHEN business data is evaluated THEN the system SHALL create Balanced Scorecard recommendations
4. WHEN analysis is complete THEN the system SHALL generate Nutzwertanalyse with ROI projections (marked as non-binding)
5. WHEN cultural context is available THEN the system SHALL apply Hofstede framework for regional communication adaptation

### Requirement 3: Content Generation Engine

**User Story:** As a restaurant owner, I want AI-generated content suggestions so that I can improve my social media presence and marketing materials.

#### Acceptance Criteria

1. WHEN content generation is requested THEN the system SHALL create restaurant-specific social media posts
2. WHEN photo analysis is performed THEN the system SHALL identify content gaps and suggest specific photo opportunities
3. WHEN brand analysis is complete THEN the system SHALL generate consistent messaging aligned with restaurant identity
4. WHEN seasonal data is available THEN the system SHALL incorporate Google Trends insights for timely content
5. WHEN content is generated THEN the system SHALL provide multi-channel optimization (Google MB, Facebook, Instagram)

### Requirement 4: Strategic Framework Integration

**User Story:** As a business consultant, I want access to professional business analysis frameworks so that I can provide comprehensive strategic advice to restaurant clients.

#### Acceptance Criteria

1. WHEN strategic analysis is requested THEN the system SHALL integrate multiple business frameworks simultaneously
2. WHEN competitive data is available THEN the system SHALL benchmark against local competitors and industry averages
3. WHEN market analysis is performed THEN the system SHALL identify top 10% performance indicators
4. WHEN recommendations are generated THEN the system SHALL prioritize actions by impact and effort required
5. WHEN analysis is complete THEN the system SHALL provide clear next steps with timeline estimates

### Requirement 5: Persona-Adaptive Intelligence

**User Story:** As different types of restaurant owners with varying expertise levels, I want AI responses tailored to my knowledge level and preferences so that I can understand and act on the recommendations.

#### Acceptance Criteria

1. WHEN user persona is "Der Skeptiker" THEN the system SHALL provide detailed metrics and proof points
2. WHEN user persona is "Der Überforderte" THEN the system SHALL simplify language and provide step-by-step guidance
3. WHEN user persona is "Der Profi" THEN the system SHALL include advanced analytics and technical details
4. WHEN user persona is "Der Zeitknappe" THEN the system SHALL prioritize quick wins and essential actions
5. WHEN persona is unknown THEN the system SHALL use adaptive questioning to identify user type

### Requirement 6: Multi-Language AI Support

**User Story:** As a restaurant owner in different regions, I want AI analysis in my preferred language so that I can fully understand the recommendations and insights.

#### Acceptance Criteria

1. WHEN language preference is German THEN the system SHALL generate all AI responses in German
2. WHEN language preference is English THEN the system SHALL provide English AI analysis
3. WHEN regional context is available THEN the system SHALL adapt cultural references and examples
4. WHEN business terms are used THEN the system SHALL translate technical concepts to hospitality-specific language
5. WHEN switching languages THEN the system SHALL maintain context and analysis quality

### Requirement 7: Feature Flag Control System

**User Story:** As a system administrator, I want granular control over AI features so that I can manage rollouts, costs, and system stability.

#### Acceptance Criteria

1. WHEN vc_bedrock_live flag is false THEN the system SHALL use fallback analysis methods
2. WHEN vc_bedrock_rollout_percent is set THEN the system SHALL gradually enable AI features for specified percentage of users
3. WHEN AI costs exceed thresholds THEN the system SHALL automatically throttle or disable expensive operations
4. WHEN new AI features are deployed THEN the system SHALL allow A/B testing through feature flags
5. WHEN system load is high THEN the system SHALL prioritize critical AI operations over optional enhancements

### Requirement 8: Performance and Reliability

**User Story:** As a restaurant owner, I want fast and reliable AI analysis so that I can get insights quickly without system delays or failures.

#### Acceptance Criteria

1. WHEN AI analysis is requested THEN the system SHALL respond within 30 seconds for standard analysis
2. WHEN Bedrock API is slow THEN the system SHALL implement timeout handling and user feedback
3. WHEN analysis fails THEN the system SHALL provide meaningful error messages and retry options
4. WHEN system is under load THEN the system SHALL queue requests and provide status updates
5. WHEN AI responses are generated THEN the system SHALL cache results for 24 hours to improve performance

### Requirement 9: Cost Management and Monitoring

**User Story:** As a business operator, I want transparent AI cost tracking so that I can monitor expenses and optimize usage patterns.

#### Acceptance Criteria

1. WHEN AI operations are performed THEN the system SHALL track token usage and associated costs
2. WHEN cost thresholds are approached THEN the system SHALL send alerts to administrators
3. WHEN usage patterns are analyzed THEN the system SHALL identify optimization opportunities
4. WHEN monthly limits are reached THEN the system SHALL gracefully degrade to free alternatives
5. WHEN cost reports are generated THEN the system SHALL provide detailed breakdowns by feature and user

### Requirement 10: Security and Compliance

**User Story:** As a data protection officer, I want comprehensive AI security and audit capabilities so that I can ensure GDPR compliance and system security.

#### Acceptance Criteria

1. WHEN AI operations are performed THEN the system SHALL log all requests and responses with redaction of sensitive data
2. WHEN prompts are executed THEN the system SHALL enforce security guards preventing unauthorized actions
3. WHEN AI responses are generated THEN the system SHALL archive logs with TTL for compliance requirements
4. WHEN sensitive data is detected THEN the system SHALL automatically redact or block processing
5. WHEN audit reports are requested THEN the system SHALL provide comprehensive usage and compliance data

### Requirement 11: Template and Prompt Management

**User Story:** As a system administrator, I want centralized prompt template management so that I can maintain consistent AI behavior and security controls.

#### Acceptance Criteria

1. WHEN AI requests are made THEN the system SHALL use centralized prompt templates with embedded security guards
2. WHEN templates are updated THEN the system SHALL version control changes and allow rollback
3. WHEN new prompt types are added THEN the system SHALL enforce consistent security limitations
4. WHEN fallback scenarios occur THEN the system SHALL use predefined fallback templates
5. WHEN prompt injection is detected THEN the system SHALL block execution and log security events

### Requirement 12: Future Extensibility

**User Story:** As a product manager, I want a flexible AI architecture so that I can easily integrate additional AI providers and capabilities.

#### Acceptance Criteria

1. WHEN new AI providers are added THEN the system SHALL support multiple providers simultaneously
2. WHEN Google Gemini integration is implemented THEN the system SHALL allow provider selection per request
3. WHEN AI capabilities expand THEN the system SHALL maintain backward compatibility with existing features
4. WHEN provider APIs change THEN the system SHALL abstract differences through a unified interface
5. WHEN new AI models are released THEN the system SHALL support easy model switching and testing