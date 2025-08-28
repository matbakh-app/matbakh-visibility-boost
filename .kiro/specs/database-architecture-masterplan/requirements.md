# Matbakh.app Database Architecture Masterplan

**Date:** 2025-08-28  
**Version:** 1.0  
**Status:** 🔬 STRATEGIC ANALYSIS & MASTERPLAN  
**Owner:** CTO

## 🎯 STRATEGIC VISION

### Mission Statement
**"Aufbau einer skalierbaren, KI-nativen Datenarchitektur, die Matbakh.app als führende Plattform für Restaurant-Digitalisierung in DACH etabliert und internationale Expansion ermöglicht."**

### Core Principles
1. **AI-First Architecture** - AWS Bedrock/Claude als Kern der Intelligence
2. **Partner Ecosystem Ready** - Skalierbare Multi-Tenant Architektur  
3. **Privacy by Design** - GDPR-konform, minimale Datensammlung
4. **Real-Time Capabilities** - Live Updates, Notifications, Monitoring
5. **International Scalability** - Multi-Language, Multi-Market ready
6. **Evidence-Based Intelligence** - Jede Aussage mit belegbarer Quelle

## 📊 CURRENT STATE ANALYSIS

### ✅ Erfolgreich Implementiert (Phase 1)
- **Core Authentication:** Supabase Auth + profiles System
- **VC System Foundation:** visibility_check_leads, visibility_check_results
- **Onboarding V2:** 8-Step Flow mit onboarding_progress
- **Partner Foundation:** business_partners, partner_bookings
- **Service Commerce:** service_packages, addon_services
- **AI Integration:** AWS Bedrock mit vc_bedrock_runs
- **Admin System:** RBAC mit admin_* Views

### ⚠️ Kritische Architektur-Lücken Identifiziert

#### 1. Restaurant-Stammdaten (KRITISCH)
**Problem:** Fragmentierte Restaurant-Daten über mehrere Tabellen
- `business_partners` (30 Spalten) vs `business_profiles` (61 Spalten)
- Inkonsistente Adress-Strukturen
- Fehlende Geo-Location für Partner-Matching
- Keine einheitliche Kategorisierung

#### 2. Channel-Integration (KRITISCH)  
**Problem:** Unvollständige Integration-Layer
- Fehlende `google_integrations` Tabelle
- Rudimentäre `meta_integrations` 
- Keine einheitliche Channel-Verwaltung
- OAuth-Token ohne Encryption-at-Rest

#### 3. Analytics Pipeline (KRITISCH)
**Problem:** Keine strukturierte Datensammlung
- Fehlende `analytics_snapshots` für Trend-Analyse
- Keine Benchmark-Datenbank
- Unstrukturierte VC-Ergebnisse in JSONB
- Fehlende Performance-Metriken

#### 4. Evidence & Traceability (KRITISCH)
**Problem:** Keine Quellennachweis-Architektur
- Fehlende Evidence-Ledger für AI-Aussagen
- Keine Confidence-Scoring
- Unvollständige Audit-Trails
- Fehlende Compliance-Dokumentation

## 🏗️ ZIEL-ARCHITEKTUR (Phase 2-4)

### Tier 1: Unified Business Entity Layer

Die aktuelle Fragmentierung zwischen `business_partners` und `business_profiles` muss durch eine einheitliche `restaurants` Tabelle ersetzt werden:

**Konsolidierte Restaurant-Entität:**
- Vereinheitlichte Stammdaten (Name, Kontakt, Adresse)
- Strukturierte Geo-Location für Partner-Matching
- Einheitliche Kategorisierung und Business-Model
- Integrierter Status für Onboarding und Verifikation

### Tier 2: Unified Integration Layer

**Channel-Management Vereinheitlichung:**
- Einheitliche `restaurant_channels` Tabelle für alle Plattformen
- Verschlüsselte OAuth-Token Verwaltung
- Automatisierte Sync-Status Überwachung
- Erweiterte Google/Meta Integration mit Service-spezifischen IDs

### Tier 3: Evidence-Based Analytics Layer

**Strukturierte Analytics mit Quellennachweis:**
- Time-Series `analytics_snapshots` mit Evidence-Tracking
- Confidence-Scoring für alle externen Datenquellen
- AI-Enhanced Recommendations mit ROI-Evidence
- Benchmark-Datenbank mit lokalen und Branchenvergleichen

### Tier 4: Enhanced VC System

**Persona-basierte VC-Optimierung:**
- Erweiterte Lead-Klassifikation mit Persona-Detection
- Strukturierte VC-Results mit Evidence-Trail
- SWOT-Analyse Integration
- Performance-Metriken für kontinuierliche Optimierung

## 🔄 MIGRATION STRATEGY

### Phase 1: Foundation Stabilization (Week 1)
**Ziel:** Kritische Bugs beheben, Basis-Schema konsolidieren

**Kritische Sofort-Maßnahmen:**
1. **Schema Audit:** Vollständige Bestandsaufnahme aller Tabellen
2. **Foreign Key Constraints:** Referentielle Integrität sicherstellen
3. **Performance-Indizes:** Häufige Queries identifizieren und optimieren
4. **RLS Policies:** Vollständige Row Level Security implementieren

### Phase 2: Data Consolidation (Week 2-3)
**Ziel:** Restaurant-Daten konsolidieren, Channel-Integration vereinheitlichen

**Restaurant Entity Consolidation:**
- Migration von `business_partners` + `business_profiles` → `restaurants`
- Datenbereinigung und Deduplizierung
- Geo-Location Standardisierung
- Referenz-Updates in abhängigen Tabellen

### Phase 3: Analytics & Intelligence (Week 3-4)
**Ziel:** Evidence-basierte Analytics, AI-Integration optimieren

**Evidence Ledger Implementation:**
- Quellennachweis für alle externen Datenquellen
- Confidence-Scoring System
- AI Prompt Versionierung und Traceability
- Benchmark-Datenbank Aufbau

### Phase 4: Partner Ecosystem Enhancement (Week 4-5)
**Ziel:** Partner-System skalieren, Credits optimieren

**Enhanced Partner Management:**
- Erweiterte Partner-Klassifikation
- ML-basiertes Lead-Partner Matching
- Performance-Tracking und Bewertungssystem
- Automatisierte Kapazitäts-Verwaltung

## 🎯 SUCCESS METRICS & KPIs

### Technical KPIs
- **Query Performance:** < 100ms für 95% aller Dashboard-Queries
- **Data Consistency:** 100% referentielle Integrität
- **Evidence Coverage:** 95% aller AI-Aussagen mit belegbaren Quellen
- **API Reliability:** 99.9% Uptime für kritische Endpoints

### Business KPIs  
- **VC Completion Rate:** > 85% (Email → Ergebnis)
- **Lead Quality Score:** > 70% (Partner-Feedback)
- **Partner Satisfaction:** > 4.5/5 (Lead-Qualität)
- **Revenue Attribution:** Klare Zuordnung VC → Conversion

### Data Quality KPIs
- **Confidence Score:** Durchschnitt > 0.8 für alle Evidence-Punkte
- **Source Diversity:** Min. 3 unabhängige Quellen pro Restaurant
- **Freshness:** 90% der Daten < 24h alt
- **Completeness:** 95% aller Pflichtfelder ausgefüllt

## 🚨 RISK MITIGATION

### Data Migration Risks
- **Rollback-Strategie:** Vollständige Backups vor jeder Migration
- **Parallel Running:** Alte und neue Strukturen parallel bis Validierung
- **Gradual Cutover:** Feature-Flag-gesteuerte Migration
- **Data Validation:** Automatisierte Konsistenz-Checks

### Performance Risks
- **Index Strategy:** Alle häufigen Queries analysiert und optimiert
- **Partitioning:** Time-series Daten monatlich partitioniert
- **Caching Layer:** Redis für häufige Abfragen
- **Connection Pooling:** Supabase Connection-Limits beachten

### Compliance Risks
- **GDPR Compliance:** Privacy by Design in allen neuen Strukturen
- **Data Retention:** Automatische Löschung nach definierten Zeiträumen
- **Audit Trails:** Vollständige Nachverfolgbarkeit aller Änderungen
- **Encryption:** Sensitive Daten verschlüsselt at-rest und in-transit

## 📋 IMPLEMENTATION ROADMAP

### Week 1: Foundation (KRITISCH)
- [ ] Schema Audit & Critical Fixes
- [ ] Foreign Key Constraints hinzufügen
- [ ] Performance-Indizes implementieren
- [ ] RLS Policies vervollständigen

### Week 2: Consolidation
- [ ] Restaurant Entity Migration
- [ ] Channel Integration Unification  
- [ ] Data Validation & Cleanup
- [ ] Legacy Table Deprecation

### Week 3: Intelligence
- [ ] Evidence Ledger Implementation
- [ ] AI Prompt Versioning System
- [ ] Analytics Pipeline Enhancement
- [ ] Confidence Scoring Integration

### Week 4: Ecosystem
- [ ] Enhanced Partner Management
- [ ] Advanced Lead Matching
- [ ] Credit System Optimization
- [ ] Performance Monitoring

### Week 5: Validation & Launch
- [ ] End-to-End Testing
- [ ] Performance Benchmarking
- [ ] Security Audit
- [ ] Production Deployment

## 🤝 STAKEHOLDER ALIGNMENT

### Development Team
- **Frontend:** Neue API-Contracts für konsolidierte Entities
- **Backend:** Migration Scripts und neue Edge Functions
- **DevOps:** Database Performance Monitoring
- **QA:** Umfassende Regressionstests

### Business Team
- **Product:** Feature-Parity während Migration
- **Sales:** Partner-System Verbesserungen kommunizieren
- **Support:** Neue Admin-Tools für besseren Service
- **Legal:** GDPR-Compliance Validierung

### External Partners
- **Restaurant-Kunden:** Keine Service-Unterbrechung
- **Marketing-Partner:** Verbesserte Lead-Qualität
- **Integration-Partner:** Stabilere APIs
- **Compliance-Auditor:** Vollständige Dokumentation

---

**NEXT STEPS:** Warten auf deine Freigabe für Phase 1 Implementation. Keine Änderungen ohne explizite Zustimmung!