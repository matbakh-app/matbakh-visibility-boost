# Implementation Plan - Bedrock AI Core

## Overview

🧠 **Ziel: Bedrock AI Core – Dynamisch, Persona-basiert, Kontext-sensitiv**

Convert the Bedrock AI Core design into a series of implementation tasks that establish a secure, flexible, and extensible AI layer for matbakh.app. The AI Core must integrate with existing specs (KI-gestütztes Onboarding, Dashboard Transformation, VC System) and serve all dashboard requirements with persona-adaptive intelligence.

**✅ TASK 8 COMPLETED:** Lambda-Pipeline Architecture mit Enterprise-Grade Sicherheit, Cost Control und Controlled Web Access implementiert. Production-ready mit 5 neuen TypeScript-Modulen (~2,100 LOC). Siehe [Task 8 Completion Report](../../docs/task-8-completion-report.md).

**Integration Requirements:**
- Support all 4 personas from KI-gestütztes Onboarding: Solo-Sarah, Bewahrer-Ben, Wachstums-Walter, Ketten-Katrin
- Power the Dashboard Transformation with AI-driven insights and recommendations
- Enhance the VC System with intelligent analysis and persona-specific outputs
- Provide dynamic, context-sensitive responses that adapt to user behavior and business data

## Implementation Tasks

- [x] 1. Bedrock Agent Setup Blueprint
  - Create AWS IAM roles and policies for Bedrock access with minimal required permissions
  - Set up BedrockRuntimeClient configuration with proper error handling and retry logic
  - Implement Lambda function structure for AI agent operations
  - Configure AWS Secrets Manager for storing prompt templates and API keys
  - _Requirements: 1.1, 1.4, 10.2, 11.1_

- [x] 1.1 Agent Roles & Berechtigungen
  - Define IAM policy for Bedrock InvokeModel permissions (Claude 3.5 Sonnet only)
  - Create Lambda execution role with VPC access and CloudWatch logging
  - Implement least-privilege access patterns for AI operations
  - Set up cross-service permissions for RDS and S3 access via Lambda proxy
  - _Requirements: 1.4, 10.1, 10.2_

- [x] 1.2 Zugriffsbeschränkung via Prompt
  - Implement prompt-level security guards with explicit allow/deny rules
  - Create soft ruleset system: "Du darfst nur X. Du darfst nicht Y."
  - Design flexible prompt contract system that adapts to different use cases
  - Implement controlled web access via Lambda proxy (no direct external calls)
  - _Requirements: 2.1, 10.1, 11.2_

- [x] 2. Prompt Contract Template System
  - Design base prompt template structure with security guards embedded
  - Create template versioning system with rollback capabilities
  - Implement dynamic template composition based on request type and user persona
  - Build template validation system to ensure security constraints are maintained
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 2.1 Struktur für VC-Auswertung (Integration mit bestehendem VC System)
  - Create VC analysis prompt template with user_persona, business_profile, goals, data_quality_score
  - Implement structured output format for SWOT, Porter's Five Forces, Balanced Scorecard
  - Design extensible template system for Content, Strategy, USP, Recommendations
  - Build prompt template inheritance system for consistent security and structure
  - Integrate with existing VC API endpoints (/vc/start, /vc/result) for seamless AI enhancement
  - Support VC-Token system for personalized analysis results
  - _Requirements: 2.1, 2.2, 2.3, 4.1, Integration with .kiro/specs/vc/requirements.vc-spec.md_

- [x] 3. Intelligente Personas System (Integration mit KI-gestütztem Onboarding)
  - Implement automatic persona detection algorithm based on user behavior and responses
  - Create differentiation logic for: Solo-Sarah, Bewahrer-Ben, Wachstums-Walter, Ketten-Katrin
  - Map existing personas (Der Skeptiker, Der Zeitknappe, Der Profi, Der Überforderte) to business personas
  - Design adaptive questioning system for unknown personas using 5-Fragen-Heuristik from onboarding spec
  - Build persona-specific prompt templates with appropriate complexity levels
  - Integrate with existing persona detection from onboarding flow
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, Integration with .kiro/specs/ki-gestuetztes-onboarding/requirements.md_

- [x] 3.1 Prompt-Vorlagen pro Persona
  - Create "Der Skeptiker" templates with detailed metrics and proof points
  - Develop "Der Überforderte" templates with simplified language and step-by-step guidance
  - Build "Der Profi" templates with advanced analytics and technical details
  - Design "Der Zeitknappe" templates prioritizing quick wins and essential actions
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3.2 Fallbeispiele Implementation
  - Create comprehensive test cases for each persona type
  - Implement persona detection validation with real-world scenarios
  - Build persona switching logic for users who change behavior patterns
  - Create fallback mechanisms for edge cases and mixed personas
  - _Requirements: 5.5, 8.3, 8.4_

- [x] 4. Datenerfassungsstrategie
  - Design data collection framework for user and restaurant information
  - Implement progressive data gathering with minimal initial requirements
  - Create data quality scoring system to identify missing or outdated information
  - Build data validation and sanitization pipeline for AI processing
  - _Requirements: 2.4, 8.1, 9.3_

- [x] 4.1 Dynamische Vervollständigung
  - Implement Claude-powered intelligent questioning system for missing data
  - Create context-aware follow-up questions based on existing information
  - Design progressive disclosure system that doesn't overwhelm users
  - Build data completion tracking and progress indicators
  - _Requirements: 2.5, 5.5, 8.1_

- [x] 5. Erweiterbare Analyse-Sektion
  - Implement SWOT analysis generation with restaurant-specific insights
  - Create Balanced Scorecard framework adapted for hospitality industry
  - Build Porter's Five Forces analysis for competitive positioning
  - Integrate Hofstede cultural dimensions for regional adaptation
  - _Requirements: 2.1, 2.2, 2.3, 4.2, 6.5_

- [x] 5.1 Business Framework Integration
  - Create modular analysis system supporting multiple business frameworks simultaneously
  - Implement framework selection logic based on user needs and data availability
  
  - Build framework result aggregation and cross-reference system
  - Design framework-specific output formatting and visualization
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. AI Agent Orchestration & Multi-Provider Architecture
  - Design Bedrock as central orchestrator for all future AI agents and tools
  - Create multi-provider architecture supporting Claude, Gemini, and future AI services
  - Build provider abstraction layer for consistent API interface across all AI tools
  - Implement provider selection logic and intelligent fallback mechanisms
  - Design agent coordination system for complex multi-step AI workflows
  - Create comparative analysis system for dual-model testing and optimization
  - Build foundation for future integrations: Google Calendar, Gmail, Drive, YouTube, Ads
  - _Requirements: 12.1, 12.2, 12.4, Future AI Agent Orchestration_

- [x] 6.1 Content & Bilderkennung Vorbereitung
  - Design content generation pipeline supporting multiple AI providers
  - Create image analysis framework for future Gemini vision capabilities
  - Implement translation system architecture for multi-language content
  - Build content quality assessment and optimization system
  - _Requirements: 3.1, 3.2, 3.5, 6.1, 6.2_

- [x] 7. Logging & Sicherheit Implementation
  - Set up CloudWatch logging for all AI operations with structured log format
  - Create bedrock_agent_logs DynamoDB table for detailed operation tracking
  - Implement PostgreSQL ai_action_logs table for GDPR-compliant archiving
  - Build log retention and cleanup system with configurable TTL
  - _Requirements: 10.1, 10.3, 10.5, 9.1_

- [x] 7.1 DSGVO-Archiv System
  - Implement automatic PII detection and redaction in AI logs
  - Create secure log archival system with encryption at rest
  - Build audit trail system for compliance reporting
  - Design log anonymization and pseudonymization for analytics
  - _Requirements: 10.1, 10.3, 10.4, 9.2_

- [x] 8. Lambda-Pipeline Architecture
  - Create Lambda proxy system for all external API calls (no direct S3/RDS/Secrets access from AI)
  - Implement request/response transformation layer for AI operations
  - Build rate limiting and cost control mechanisms
  - Design circuit breaker pattern for external service failures
  - _Requirements: 1.3, 8.2, 8.4, 9.1, 9.4_

- [x] 8.1 Controlled Web Access System
  - Implement Lambda proxy for Google APIs (GMB, Instagram, Trends analysis)
  - Create whitelist system for allowed external domains and endpoints
  - Build request sanitization and validation for external API calls
  - Design response caching system to minimize external API usage
  - _Requirements: 1.3, 3.4, 8.5, 9.3_

- [x] 9. Feature Flag Integration
  - Integrate with existing feature flag system (vc_bedrock_live, vc_bedrock_rollout_percent)
  - Implement gradual rollout system for AI features
  - Create A/B testing framework for different AI approaches
  - Build feature flag-based cost control and emergency shutdown
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Performance & Reliability
  - Implement response time monitoring and alerting (30-second target)
  - Create request queuing system for high-load scenarios
  - Build response caching system with 24-hour TTL
  - Design graceful degradation for AI service failures
  - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 11. Cost Management System
  - Implement token usage tracking and cost calculation
  - Create cost threshold monitoring and alerting system
  - Build usage analytics and optimization recommendations
  - Design automatic cost control and service throttling
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Testing & Validation
  - Create comprehensive test suite for all AI operations
  - Implement persona detection accuracy testing
  - Build prompt template validation and security testing
  - Design load testing for AI service performance
  - _Requirements: 8.3, 10.5, 11.4, 11.5_

- [x] 13. Adaptive UI System & Leistungsportfolio Integration
  - Create React components for AI-powered features in Restaurant Dashboard System
  - Implement real-time AI operation status and progress indicators
  - Build user interface for persona selection and AI preferences
  - Design AI result display components with interactive elements
  - Integrate AI widgets into Figma Dashboard components
  - Support VC Ergebnis Dashboard with AI-enhanced insights
  - Power dashboard widgets with dynamic AI-generated content and recommendations
  - **Build adaptive UI system that automatically adjusts based on available AI services**
  - **Create dynamic service portfolio display that shows/hides features based on active AI agents**
  - **Implement progressive feature disclosure as new AI tools are connected**
  - **Design modular widget system that adapts to expanding AI capabilities**
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, Integration with .kiro/specs/dashboard-transformation/requirements.md, Adaptive UI for expanding AI portfolio_

- [x] 14. Datenverwaltung Visibility Check - End-to-End Flow
  - Implement DSGVO-konforme E-Mail-Erhebung & Double Opt-In process
  - Create visibility_check_leads table with confirm_token_hash and analysis_status tracking
  - Build Datenerhebung system for Sichtbarkeitscheck & Unternehmensdaten
  - Implement visibility_check_context_data table for business information storage
  - Create AI-Analyse integration with Claude/Bedrock prompting system
  - Build ai_action_logs table with comprehensive audit trail
  - Implement Ergebnis-Speicherung in visibility_check_results table
  - Create Dashboard für Superadmin with filtering, export, and follow-up management
  - Build retention system for nicht-registrierte Nutzer (180 days automatic deletion)
  - Implement DSGVO-compliant deletion system with user_consent_tracking
  - _Requirements: 10.1, 10.3, 10.5, 11.1, 12.1, 12.2_

- [x] 15. Documentation & Rollback
  - Create comprehensive API documentation for AI endpoints
  - Build operator guide for AI system management
  - Implement disable-bedrock-agent.sh rollback script
  - Design emergency procedures and troubleshooting guides
  - _Requirements: 7.5, 8.3, 11.5_

## 📌 Important Implementation Notes

**Flexibility Principles:**
- Claude darf nicht durch zu starre Prompt-Contracts blockiert werden
- Flexibles Prompt-Template-System, das Kiro und Claude je nach Userdaten automatisch erweitern
- Jede Bedrock-Antwort wird versioniert und ist nachvollziehbar
- Claude darf Webanfragen indirekt stellen – via Lambda-Funktion, nicht direkt

**Security Constraints:**
- Kein direkter S3/RDS/Secrets-Zugriff – alles über Lambda-Pipeline
- Alle AI-Operationen werden geloggt und archiviert (DSGVO-ready)
- Prompt-Guards sind in jedem Template embedded und nicht entfernbar
- Explizite Erlaubnisse und Verbote in jedem Prompt

**Extensibility Goals:**
- Vorbereitet für Google Gemini Integration
- Erweiterbar für Google Calendar, Gmail, Drive, YouTube, Ads
- Multi-Provider-Architektur mit einheitlicher API
- Modular aufgebaut für einfache Feature-Erweiterungen
- **Bedrock als zentraler Orchestrator für alle zukünftigen AI-Agenten**
- **Adaptive UI, die sich automatisch an verfügbare AI-Services anpasst**

## 🧩 Erweiterte Requirements Integration

### NEU – Dynamische Promptkontrolle mit KI-Schutzlogik

**ClaudePromptBuilder-Struktur:**
```json
{
  "context": {
    "permissions": {
      "allow_web_requests": true,
      "allow_rds_access": false,
      "allow_s3_uploads": false
    },
    "persona_type": "Solo-Sarah",
    "input_source": "vc-user-form",
    "data_scope": "business_public + user_consent_data"
  },
  "goal": "Analyse der Sichtbarkeit + Handlungsempfehlungen",
  "output_format": "json+text",
  "tone": "einfach, empathisch, lösungsorientiert"
}
```

### Emotionale Intelligenz für Personas

**Persona-Profile mit emotionalen Triggern:**
```json
{
  "persona_profile": {
    "type": "Solo-Sarah",
    "expectations": ["Einfache Lösungen", "Schnelle Erfolge"],
    "emotional_triggers": ["Überforderung vermeiden", "Vertrauen aufbauen"],
    "preferred_style": "einfach, empathisch, ermutigend"
  }
}
```

### VC-Analyse Dreiklang

| Analysebereich | Beschreibung |
|----------------|--------------|
| **Sichtbarkeitsdaten** | Google MB Reviews, Posts, Öffnungszeiten, Bildqualität, Content-Dichte |
| **Storytelling-Potenzial** | USP, regionale Einbindung, kulturelle Wirkung, Saisonalität |
| **Vergleichbarkeit** | Lokale Wettbewerber, Branchenschnitt, Verbesserungspotenzial (Top 10% Ziele) |

### Neue Requirements (aus Ergänzungen)

**Requirement 11: Prompt Feedback Loop & Self-Adjustment**
- Claude fragt aktiv nach, wenn Daten fehlen oder unklar sind
- Claude passt den Stil nach den ersten 3 Antworten an (empathisch vs. direkt)
- Claude gibt Beispiele aus ähnlich erfolgreichen Lokalen zur Inspiration
- Claude erklärt seine Empfehlung mit „Warum"-Bezug

**Requirement 12: Dynamische Unternehmensdaten-Aktualisierung**
- Claude schlägt automatisch neue Felder vor („Wie wichtig ist dir Regionalität?")
- Claude merkt sich bekannte Informationen pro Business-ID und fragt gezielt nach Lücken
- Claude erlaubt „Quick Facts Update" via Button/Prompt
- Claude liefert nach Änderungen sofort ein aktualisiertes Sichtbarkeits-Rating

**Requirement 13: Google & Gemini Integration Ready**
- Claude sammelt Daten & verarbeitet vor
- Claude bereitet Entscheidungen vor, Gemini kann dann handeln
- Claude erzeugt einen „Aktionsplan", den Gemini automatisiert umsetzt

## 📡 Nächste Schritte für Kiro

1. **Spec vorbereiten**: bedrock-ai-core-spec.ts basierend auf diesen Requirements
2. **Prompt-Engine entwerfen**: 
   - Input: Persona, Business-Daten, Ziele
   - Output: Claude Prompt JSON
3. **Claude Prompt Policies**: dynamisch, sicher, skalierbar
4. **AI Logger Middleware**: für /vc, /consent, /upload vorbereiten

## ✅ DATENVERWALTUNG VISIBILITY CHECK – END-TO-END FLOW

### 🔐 1. E-Mail-Erhebung & Double Opt-In
**Zweck:** DSGVO-konforme Identifikation & Lead-Verifizierung  
**Tabelle:** `visibility_check_leads`

**Ablauf:**
1. User gibt E-Mail-Adresse an → Eingabe erforderlich
2. System erstellt neuen `visibility_check_leads`-Eintrag:
   - `email` (Pflicht)
   - `confirm_token_hash`
   - `confirm_expires_at`
   - `analysis_status = pending_opt_in`
3. Double-Opt-In Mail über Resend → `confirm_token_url`
4. Nach Klick: Token & Ablaufzeit prüfen
5. Falls gültig → `confirmed = true` & `confirmed_at` setzen
6. Erst dann → Start der Analyse (VC-Erhebung & Bedrock-Aufruf)

### 📊 2. Datenerhebung: Sichtbarkeitscheck & Unternehmensdaten
**Zweck:** Relevante Unternehmensinformationen für Analyse & Benchmark  
**Tabelle:** `visibility_check_context_data`

**Erhobene Felder:**
- `business_name`, `location` (Adressfelder getrennt)
- `main_category`, `sub_categories[]` (aus `gmb_categories`)
- `website_url`, `instagram_url`, `fb_url`, `gmb_url`
- `benchmark_urls[]` (3 Stück)
- `persona_type` (Bedrock ermittelt)
- `user_goal`, `language`

🔐 **DSGVO-Hinweis:** Keine personenbezogenen Daten – nur Unternehmensdaten  
💡 **Daten werden gespeichert, auch ohne spätere Registrierung**

### 🧠 3. AI-Analyse: Claude / Bedrock Prompting
**Zweck:** Generierung von SWOT, Scorecards, Porter's Five Forces, Kulturdimensionen, Benchmarks, Trends, Handlungsempfehlungen, Content-Ideen  
**Tabelle:** `ai_action_logs` + Bedrock Audit Logs via CloudWatch & DynamoDB

**Vorgehen:**
1. System ruft Claude mit strukturiertem Prompt auf (nur Kontextdaten)
2. Prompt verknüpft mit: `lead_id`, `request_type = 'visibility_check'`, `prompt_hash`, `provider = 'claude-3.5-sonnet'`, `token_usage`
3. Antwort vollständig speichern: Raw-Response, extrahierte Bewertungen & Empfehlungen, Analyse-Metadaten

### 📦 4. Ergebnis-Speicherung
**Zweck:** Darstellung im Frontend, Follow-Up, Superadmin-Auswertung  
**Tabelle:** `visibility_check_results`

**Gespeicherte Felder:**
- `lead_id` (FK), `summary_score`
- `strengths`, `weaknesses`, `opportunities`, `threats`
- `content_suggestions`, `profile_health_score`
- `benchmark_results`, `analysis_json` (kompletter Claude-Output)

### 🧑‍💼 5. Dashboard für Superadmin
**Zweck:** Überblick über alle durchgeführten Checks, Conversion, Insights  
**Zugriff:** Nur über RBAC-Rolle `super_admin`

**Funktionen:**
- Übersicht: Neue Leads, Status, Ergebnisse
- Filter: nach Zeitraum, Kategorie, Sprache, Conversion
- Export: Analyse-Ergebnisse als PDF oder CSV
- Follow-Up Management: Markierung als „kontaktiert", „registriert", „gebucht"

### 🗃️ 6. Optional: Speicherung für nicht-registrierte Nutzer
- Daten bleiben erhalten auch ohne Registrierung
- System verfügbar für Follow-Up (manuell oder per Kampagne)
- Automatische Löschung nach 180 Tagen (außer `retention_policy = 'long'`)

### 🔄 7. Löschung & DSGVO
**Tabellen:** `user_consent_tracking`, `visibility_check_leads`

**Prozess:**
- Nutzer kann jederzeit Anonymisierung per E-Mail-Link beantragen
- System löscht alle Einträge: `visibility_check_leads`, `visibility_check_context_data`, `visibility_check_results`, `ai_action_logs`
- Audit bleibt mit anonymisiertem `lead_id` (für Tokenzählung)

### 🔚 Zusammenfassung

| Abschnitt | Tabelle | Sichtbar für | DSGVO-relevant |
|-----------|---------|--------------|----------------|
| Opt-In | `visibility_check_leads` | Admin, nicht öffentlich | ✅ Ja |
| Kontextdaten | `visibility_check_context_data` | Nur AI intern | ❌ Nein |
| Analyse | `ai_action_logs`, `...results` | Admin + Nutzer | ❌ Nein |
| Dashboard | `visibility_check_results` | Nur Superadmin | ❌ Nein |
| Follow-Up | `visibility_check_leads` | Admin (Filter) | ✅ Ja |
| Löschung | alle oben | DSGVO-konform | ✅ Ja |

## 🎯 Zukunftsvision: Bedrock als AI-Orchestrator

### 🤖 **AI Agent Orchestration**
Bedrock wird der zentrale Orchestrator für alle zukünftigen AI-Agenten und KI-Tools:
- **Google Gemini** (via Opal) für Content-Generierung und Bilderkennung
- **Google Workspace Integration** (Calendar, Gmail, Drive) für Business-Automation
- **YouTube & Ads APIs** für Marketing-Automation
- **Custom AI Agents** für spezifische Restaurant-Workflows
- **Multi-Agent Coordination** für komplexe Business-Prozesse

### 🎨 **Adaptive UI System**
Die UI passt sich automatisch an das verfügbare Leistungsportfolio an:
- **Dynamic Feature Discovery**: Neue AI-Services werden automatisch in der UI verfügbar
- **Progressive Disclosure**: Features werden schrittweise freigeschaltet basierend auf verfügbaren Agenten
- **Modular Widgets**: Dashboard-Komponenten passen sich an erweiterte AI-Capabilities an
- **Service Portfolio Display**: Nutzer sehen nur verfügbare und aktive AI-Services
- **Intelligent Fallbacks**: UI degradiert graceful wenn AI-Services nicht verfügbar sind

### 🔄 **Orchestration Patterns**
- **Sequential Workflows**: Claude analysiert → Gemini generiert Content → YouTube publiziert
- **Parallel Processing**: Mehrere AI-Agenten arbeiten gleichzeitig an verschiedenen Aspekten
- **Conditional Logic**: AI-Entscheidungen bestimmen welche nachgelagerten Agenten aktiviert werden
- **Feedback Loops**: Ergebnisse eines Agenten verbessern die Prompts für andere Agenten

## 🔗 Integration mit bestehenden Specs

- **KI-gestütztes Onboarding**: Persona-Erkennung, 5-Fragen-Heuristik, Progressive Onboarding
- **Dashboard Transformation**: AI-powered widgets, Restaurant Dashboard System, VC Ergebnis Dashboard
- **VC System**: Token-basierte Analyse, DOI-Integration, AWS API endpoints