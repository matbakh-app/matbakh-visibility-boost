# Kiro Hackathon Log (matbakh.app)

## Inhaltsverzeichnis (Links zu Sessions)
- [Session 1: KI-gestütztes Onboarding Spec](#session-1-ki-gestütztes-onboarding-spec--2025-01-27-1430)

## Artefakte
- `.kiro/specs/ki-gestuetztes-onboarding/requirements.md` - Vollständige Requirements mit DSGVO/DOI-Block
- `docs/hackathon-kiro.md` - Dieses Dokument

## Entscheidungen
- Fokus auf Solo-Sarah und Bewahrer-Ben für P0
- 5-Fragen-Heuristik für Persona-Erkennung
- DSGVO-konforme DOI-Implementation mit SES
- Progressive 14-Tage Onboarding-Strategie

## Offene Punkte
- Design-Phase für Onboarding-Spec
- Connection Rehearsal Plan
- Missing Matrix Update

---

## Session 1: KI-gestütztes Onboarding Spec – 2025-01-27 14:30

**Ziel**: Vollständige Requirements-Spec für KI-gestütztes Onboarding mit DSGVO-Compliance und progressivem 14-Tage-Plan

**Kontext**: 
- Bestehende Figma-Komponenten: RestaurantInfoStep.tsx, WebsiteAnalysisStep.tsx
- Supabase Backend mit Edge Functions
- 4 definierte Personas: Solo-Sarah, Bewahrer-Ben, Wachstums-Walter, Ketten-Katrin
- AWS SES für E-Mail-Versand, DynamoDB für Token-Storage

**Aktionen**: 
- Requirements-Dokument erstellt mit 16 detaillierten Requirements
- DSGVO/DOI-Compliance Block mit rechtssicheren Consent-Flows
- Progressive Onboarding-Strategie (Day-0 + 14-Tage-Häppchen)
- Event-Taxonomie und KPI-Definition
- Integration mit bestehenden Komponenten spezifiziert

**Entscheidungen**:
- P0 fokussiert auf Solo-Sarah und Bewahrer-Ben
- 5-Fragen-Heuristik statt komplexe KI-Analyse
- Time-to-Value < 3 Min für Solo-Sarah
- DOI-Pflicht für alle E-Mail-Kommunikation
- Progressive Enhancement statt Big-Bang-Onboarding

**Artefakte**: 
- `requirements.md` v1.0 mit 16 Requirements
- DSGVO/DOI-Block mit SES-Templates
- Progressive Onboarding-Plan (14 Tage)

**Risiken/Blocker**:
- API-Abhängigkeiten (Google, Meta) für Vollautomatisierung
- SES-Konfiguration für One-Click-Unsubscribe
- Performance bei < 3 Min Time-to-Value

**Nächste Schritte (Vorschlag)**:
- Design-Phase: Technische Architektur und Komponenten-Design
- Connection Rehearsal Plan für lokale Tests
- Missing Matrix Update mit P0/P1/P2-Priorisierung## Sessio
n 2: Progressive Onboarding Erweiterung – 2025-01-27 15:15

**Ziel**: Erweiterung der Onboarding-Spec um progressive 14-Tage-Strategie mit DSGVO-konformen DOI-Flows

**Kontext**: 
- Bestehende Requirements-Spec mit 16 Requirements
- Fokus auf Absprungrate-Minimierung und Time-to-Value < 3 Min
- SES-Integration für DOI-Mails erforderlich
- DynamoDB für Fortschritts-Tracking

**Aktionen**: 
- Progressive Onboarding-Strategie (Requirements 17-22) hinzugefügt
- Day-0 Mini-Flow (5-7 Min) mit Instant Value definiert
- 14-Tage Häppchen-Plan mit Micro-Tasks (≤ 2 Min je Schritt)
- Kommunikations-Strategie mit E-Mail-Serie und Deep-Links
- Connection Rehearsal Plan mit Copy-Paste-Befehlen erstellt
- Missing Matrix aktualisiert mit P0/P1/P2-Priorisierung

**Entscheidungen**:
- Day-0 fokussiert auf minimale Datenerfassung + sofortigen VC
- Häppchen-Strategie mit optionalen Schritten statt Zwang
- E-Mail-Frequenz-Cap: max. 3/Woche mit List-Unsubscribe
- Deep-Links mit Signierung und Ablaufzeit
- P0 fokussiert auf SES DOI, DynamoDB, GBP API, Persona-Heuristik

**Artefakte**: 
- `requirements.md` v2.0 mit 22 Requirements (Progressive Onboarding)
- `connection-rehearsal-plan.md` - Copy-Paste-Befehle für lokale Tests
- `missing-matrix-updated.md` - P0/P1/P2-Priorisierung mit Sprints
- `hackathon-kiro.md` - Dokumentation dieser Session

**Risiken/Blocker**:
- SES Configuration Set für One-Click-Unsubscribe noch nicht konfiguriert
- DynamoDB OnboardingProgress Tabelle muss erstellt werden
- GBP API Permissions noch nicht vollständig aktiviert
- Performance-Risiko bei < 3 Min TTV für komplexe VC-Analysen

**Nächste Schritte (Vorschlag)**:
- Design-Phase: Technische Architektur für progressive Flows
- SES DOI-Template-Erstellung mit rechtssicheren Texten
- DynamoDB Schema-Definition und Tabellen-Erstellung
- Persona-Heuristik-Algorithmus-Design## Sessio
n 3: Inklusive Kommunikation & Progressive Ansprache – 2025-01-27 16:00

**Ziel**: Integration inklusiver, DSGVO-konformer Kommunikationsstrategien in das progressive Onboarding ohne diskriminierende Inferenz

**Kontext**: 
- Bestehende Progressive Onboarding-Strategie (Requirements 1-22)
- DSGVO-Compliance-Anforderungen für Kommunikation
- Barrierefreiheits-Standards und inklusive UX-Prinzipien
- A/B-Testing-Infrastruktur für Copy-Optimierung

**Aktionen**: 
- Inklusive Kommunikations-Requirements (23-30) hinzugefügt
- Communication Preferences System (≤30 Sek Setup) definiert
- Copy-Varianten-Bibliothek mit 3 Tönen × 3 Anredeformen erstellt
- "Einfach erklärt"-Modus für Barrierefreiheit spezifiziert
- Event-Tracking für Communication-Experimente ohne sensible Daten
- Copy-Matrix mit 5 Kernschritten und E-Mail-Betreffzeilen erstellt

**Entscheidungen**:
- KEIN Inferenz-Profiling sensibler Merkmale (Geschlecht, Herkunft, Alter)
- Präferenzbasierte statt demografische Kommunikation
- Opt-in für alle Communication Preferences mit jederzeit Änderbarkeit
- Token-System für Anrede-Varianten ({GREET_SIE}, {GREET_DU}, {GREET_NEUTRAL})
- "Einfach erklärt"-Modus mit max. 12-15 Wörtern pro Satz
- A/B-Testing für E-Mail-Betreffzeilen (ermutigend vs. faktenfokussiert)

**Artefakte**: 
- `requirements.md` v3.0 mit 30 Requirements (Inklusive Kommunikation)
- `copy-matrix-onboarding.md` - Vollständige Copy-Varianten für 5 Kernschritte
- Communication Preferences Datenmodell mit DSGVO-konformer Struktur
- Event-Taxonomie für ethisches A/B-Testing ohne Diskriminierung

**Risiken/Blocker**:
- Komplexität der Copy-Varianten-Verwaltung (3×3×2 = 18 Varianten pro Schritt)
- A/B-Testing-Infrastruktur muss diskriminierungsfreie Segmentierung sicherstellen
- "Einfach erklärt"-Texte benötigen Fachexpertise für Leichte Sprache
- Performance-Impact durch dynamische Copy-Generierung
- Rechtliche Validierung der DSGVO-Konformität bei Communication Preferences

**Nächste Schritte (Vorschlag)**:
- Design-Phase: UI/UX für Communication Preferences Screen
- Copy-Varianten-CMS für Content-Management
- A/B-Testing-Framework-Setup mit Guardrails
- Barrierefreiheits-Audit und Screenreader-Tests
- Rechtliche Prüfung der inklusiven Kommunikationsstrategie## Ses
sion 4: Data Platform Specification – 2025-01-27 17:00

**Ziel**: Vollständige Datenplattform-Architektur mit DSGVO-konformen Datenflüssen, Aufbewahrung, Segmentierung und Lernschleifen

**Kontext**: 
- Bestehende Infrastruktur: Supabase Postgres, DynamoDB, AWS SES, GA4 Property 495696125
- DSGVO-Compliance-Anforderungen für alle Datenverarbeitungen
- Multi-Armed Bandit für Copy-Optimierung ohne diskriminierende Merkmale
- AWS-zentrierte Data Lake Architektur mit S3, Glue, Athena

**Aktionen**: 
- Vollständiges Dateninventar mit Zweckbindung und Rechtsgrundlagen erstellt
- Kanonische ID-Struktur (user_id, account_id, location_id) definiert
- 3-Schichten-Architektur (OLTP, Data Lake, Analytics) spezifiziert
- Star Schema mit Fakten- und Dimensionstabellen entworfen
- Segmentierung und ML-Feature-Store konzipiert
- Thompson Sampling für ethisches A/B-Testing implementiert
- DSGVO-konforme Retention-Matrix mit Löschpfaden erstellt
- JSON-Schemas für alle Event-Typen definiert

**Entscheidungen**:
- AWS S3 als zentraler Data Lake mit SSE-KMS Verschlüsselung
- Pseudonymisierung (SHA-256) für Analytics-Zwecke
- Consent-Gating für alle ML/Analytics-Verarbeitungen
- Thompson Sampling ab N≥30 Events pro Variante
- 3-Jahres-Retention für ConsentJournal (Legal Obligation)
- Kaskadierte Löschung über alle Systeme (Supabase, DynamoDB, S3, APIs)
- Identity Resolution über email_lower als primären Join-Key

**Artefakte**: 
- `data-platform-spec.md` - Vollständige Datenplattform-Architektur
- `retention-matrix.md` - DSGVO-konforme Aufbewahrungsrichtlinien
- `event-schemas.md` - JSON-Schemas für alle Fact/Dimension Tables
- Star Schema ERD mit Join-Pfaden
- Implementation Roadmap (3 Phasen, 12 Wochen)

**Risiken/Blocker**:
- S3-Kosten bei hohem Datenvolumen (Budget: <$1000/Monat für 10k Users)
- Komplexität der Identity Resolution bei Multi-Provider OAuth
- Performance der Thompson Sampling Algorithmus bei hoher Last
- DSGVO-Compliance bei grenzüberschreitenden Datenübertragungen
- Data Quality bei heterogenen Datenquellen (GA4, GBP, Social APIs)
- Kaskadierte Löschung über externe APIs (Rate Limits, Verfügbarkeit)

**Nächste Schritte (Vorschlag)**:
- Phase 1 Implementation: S3 Data Lake Setup mit Sicherheits-Policies
- Supabase → S3 Export Pipeline mit Airbyte
- DynamoDB Streams → Kinesis Firehose Integration
- AWS Glue Data Catalog Setup für Metadaten-Management
- Thompson Sampling Lambda für Copy-Optimierung
- DSGVO-Compliance Audit und rechtliche Validierung#
# Session 5: Dualer Onboarding-Modus (VCC Quick & Extended) – 2025-01-27 18:00

**Ziel**: Implementation eines dualen Onboarding-Systems mit gamifizierten Tier-Belohnungen und DSGVO-konformer Competition-Mechanik

**Kontext**: 
- Bestehende Progressive Onboarding-Strategie (Requirements 1-30)
- Bedarf nach schnellem Lead-Gen-Modus vs. vollständigem Onboarding
- Gamification-Ansatz mit Tier-System (30%, 50%, 80%, 90%, 95%, 100%)
- Competition-Design mit anonymisierten Peer-Vergleichen
- DSGVO-Compliance bei Gamification und Benchmarking

**Aktionen**: 
- Dualer Modus-Requirements (31-39) mit VCC Quick & Dirty + Extended definiert
- Tier-basiertes Belohnungssystem mit progressiven Report-Freischaltungen
- State Machine für Modus-Übergänge und Pause/Resume-Funktionalität
- Gamification-UI mit Fortschritts-Ring, Badges und anonymisierten Peer-Vergleichen
- DSGVO-Guardrails für ethische Competition ohne sensible Merkmale
- Erweiterte Event-Taxonomie für Tier-Tracking und Resume-Verhalten
- Tier-spezifische Copy-Matrix mit 6 Belohnungsstufen erstellt
- i18n-Struktur für tier-spezifische Inhalte (DE/EN)

**Entscheidungen**:
- VCC Quick & Dirty: ≤ 3 Min für 30%-Report mit sofortigem Wert
- Extended-Modus: 40 Min Gesamtzeit, jederzeit pausierbar mit Deep-Link-Resume
- Gewichtete Progress-Berechnung: Core-Felder höher gewichtet als Non-Core
- Tier-System: 30% (Basis), 50% (Potenzial), 80% (SWOT), 90% (Standort), 95% (Scorecard), 100% (Vollreport + Plan)
- Anonymisierte Peer-Vergleiche: Quartile/Perzentile ohne Firmennamen
- State Machine: 11 States von lead_quick bis complete
- Resume-E-Mails: 24h, 72h, 7 Tage nach Pause
- Report-Versionierung mit Changelog für Transparenz

**Artefakte**: 
- `requirements.md` v4.0 mit 39 Requirements (Dualer Modus + Gamification)
- `copy-matrix-onboarding.md` erweitert um Tier-spezifische Copy-Varianten
- State Machine Definition mit 11 States und Transition-Regeln
- Event-Schema-Erweiterung für Tier-Tracking und Competition-Events
- i18n-Struktur für tier-spezifische Inhalte (vc_result.json, onboarding.json)

**Risiken/Blocker**:
- Gamification-Bias: Nutzer könnten falsche Daten eingeben für bessere Scores
- Competition-Ethik: Peer-Vergleiche könnten demotivierend wirken bei schlechter Performance
- PII-Leakage: Anonymisierte Vergleiche könnten bei kleinen Peer-Gruppen re-identifizierbar werden
- Resume-Komplexität: Deep-Link-Signierung und State-Wiederherstellung technisch anspruchsvoll
- Report-Performance: 6 verschiedene PDF-Generierungen könnten S3-Kosten und Ladezeiten erhöhen
- Tier-Inflation: Nutzer könnten erwarten, dass höhere Tiers immer "besser" sind
- DSGVO-Compliance: Tier-basierte Datenverarbeitung muss rechtlich validiert werden

**Nächste Schritte (Vorschlag)**:
- Design-Phase: UI/UX für Tier-System und Competition-Dashboard
- State Machine Implementation mit DynamoDB-Integration
- PDF-Report-Generator für alle 6 Tier-Stufen
- Deep-Link-Signierung und Resume-Mechanik
- Anonymisierungs-Algorithmus für Peer-Vergleiche
- A/B-Testing-Framework für Tier-Unlock-Strategien
- Rechtliche Prüfung der Gamification-DSGVO-Konformität## 
Session 6: Business Card / Visitenkarte (Conversion-Optimiert) – 2025-01-27 18:30

**Ziel**: Conversion-optimierte Visitenkarten-UI mit Trust-Elementen, Single CTA und minimalen Events für maximale Performance

**Kontext**: 
- Bestehender Dualer Onboarding-Modus (Requirements 31-39)
- Bedarf nach vertrauensbildenden Elementen für höhere Conversion
- Single CTA-Strategie zur Reduktion von Drop-offs
- Barrierefreie "Einfach erklärt"-Funktionalität
- SEO-Optimierung für teilbare Business Cards
- Minimal-Event-Tracking zur Vermeidung von Analytics-Overkill

**Aktionen**: 
- Business Card Requirements (40-50) mit Trust- und Conversion-Fokus definiert
- "Proof & Trust"-Zeile mit 3 Mikro-Badges (DSGVO, E-Mail verifiziert, <3 Min Report)
- Hero-Block mit Single CTA-Strategie (keine zweite Primäraktion)
- Permanent sichtbarer "Einfach erklärt"-Toggle mit sofortiger Umschaltung
- Dezenter Progress-Ring mit Belohnungs-Preview als Tooltip
- i18n-Quick Switch im Header mit E-Mail-Sprach-Synchronisation
- SEO-Optimierung mit OpenGraph + JSON-LD LocalBusiness
- Minimal-Event-Tracking (nur 4 Events) zur Performance-Messung
- Business Card Datenmodell (P0) mit essentiellen Feldern definiert
- Vollständige Copy-Matrix für Visitenkarten-Texte (DE/EN + Einfach erklärt)

**Entscheidungen**:
- Single CTA-Strategie: Nur ein Button zur Reduktion von Drop-offs
- Trust-Badges: 3 Mikro-Badges für sofortige Vertrauensbildung
- "Einfach erklärt" permanent sichtbar: Sofortige Umschaltung ohne Reload
- Progress-Ring dezent: Tooltip statt großer Block für clean UI
- 4-Event-Limit: Vermeidung von Analytics-Overkill bei fokussierter Messung
- 7-Tage-Gültigkeit: Signierte Share-Links für Visitenkarten-Sharing
- LCP < 2s: Performance-Ziel für optimale User Experience
- JSON-LD + OpenGraph: SEO-Optimierung für strukturierte Daten

**Artefakte**: 
- `requirements.md` v5.0 mit 50 Requirements (Business Card Conversion-Optimierung)
- `copy-matrix-onboarding.md` erweitert um vollständige Visitenkarten-Copy
- Business Card Datenmodell mit minimaler, fokussierter Struktur
- 4-Event-Taxonomie für Visitenkarten-Performance-Tracking
- SEO-Meta-Tags-Spezifikation (OpenGraph + JSON-LD LocalBusiness)
- Trust-Badge-System mit Tooltip-Erklärungen

**Risiken/Blocker**:
- Single CTA-Risiko: Könnte bei manchen Nutzern zu wenig Optionen bieten
- Trust-Badge-Inflation: Nutzer könnten Badges als Marketing-Gimmick wahrnehmen
- "Einfach erklärt"-Komplexität: Sofortige Umschaltung aller Texte technisch anspruchsvoll
- Share-Link-Sicherheit: Signierte Links müssen gegen Manipulation geschützt sein
- Performance vs. Features: LCP < 2s bei allen Trust-Elementen und Animationen
- SEO-Duplicate-Content: Geteilte Visitenkarten könnten SEO-Probleme verursachen
- Mobile-Performance: Progress-Ring und Badges könnten auf kleinen Screens problematisch sein

**Nächste Schritte (Vorschlag)**:
- UI/UX-Design für Trust-Badge-Platzierung und Single CTA-Layout
- "Einfach erklärt"-Toggle-Implementation mit Real-time Text-Switching
- Progress-Ring-Animation und Tooltip-System
- Share-Link-Signierung und Sicherheits-Mechanismen
- OpenGraph + JSON-LD Template-System für dynamische SEO-Meta-Tags
- Performance-Optimierung für LCP < 2s Ziel
- A/B-Testing-Setup für Single CTA vs. Multi-CTA Conversion-Vergleich

## Session 8: VC Result Page + SES Diagnostics – 2025-01-27 19:45

**Ziel**: VC Result Page implementieren und SES DOI E-Mail-Delivery-Problem diagnostizieren

**Kontext**: 
- GREENLIGHT #1 erhalten für VC Result Page Implementation
- DOI-E-Mails kommen nicht an - Troubleshooting erforderlich
- Bestehende Supabase Edge Functions für VC-Workflow
- SES-Integration über AWS mit noreply@matbakh.app

**Aktionen**: 
- VC Result Page vollständig implementiert (/vc/result mit 3 Zuständen)
- i18n-Support (DE/EN) mit "Einfach erklärt"-Toggle
- SES DOI Healthcheck Runbook erstellt (scripts/ses_doi_healthcheck.md)
- README um "SES Diagnose in 60 Sek." erweitert
- Kritisches Problem identifiziert: vc-start-analysis ist Placeholder-Funktion
- Enhanced Logging in vc-start-analysis für bessere Diagnose
- Secrets Management Dokumentation hinzugefügt

**Entscheidungen**:
- Single CTA-Design für VC Result Page (kein Dead-End)
- Status-Ermittlung via URL-Parameter (?t=token, ?e=expired|invalid)
- Minimal Event-Tracking (4 Events) für Performance
- SES-Troubleshooting ohne Cloud-Änderungen (nur Diagnostics)
- Enhanced Logging mit Timestamps für bessere Fehleranalyse

**Artefakte**: 
- `src/pages/VCResult.tsx` - VC Result Page Component
- `public/locales/{de,en}/vc_result.json` - i18n-Übersetzungen
- `scripts/ses_doi_healthcheck.md` - Vollständiges SES-Troubleshooting-Runbook
- README-Erweiterung mit Copy-Paste-Diagnose-Befehlen
- Branch: `feat/vc-result-page` (VC Result Page)
- Branch: `feat/ses-diagnostics` (SES Troubleshooting)

**Kritische Erkenntnisse**:
- **VC Result Page**: Vollständig implementiert, alle Akzeptanzkriterien erfüllt
- **SES Problem**: vc-start-analysis ist Placeholder-Funktion, sendet KEINE E-Mails
- **Root Cause**: API antwortet erfolgreich, aber keine E-Mail-Versendung implementiert
- **Workaround**: send-visibility-report Funktion existiert, wird aber nicht aufgerufen

**Risiken/Blocker**:
- **Kritisch**: DOI-E-Mails werden nicht versendet (Placeholder-Funktion)
- **Medium**: vc-start-analysis muss E-Mail-Versendung implementieren
- **Low**: SES-Konfiguration scheint korrekt (Resend API wird verwendet)

**Nächste Schritte (Vorschlag)**:
- **P0**: vc-start-analysis Funktion um E-Mail-Versendung erweitern
- **P0**: Integration mit send-visibility-report für DOI-Flow
- **P1**: SES vs. Resend API Entscheidung (aktuell mixed usage)
- **P1**: End-to-End-Test des kompletten DOI-Flows
- **P2**: Performance-Optimierung der VC Result Page