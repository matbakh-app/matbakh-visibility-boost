# 📊 MATBAKH.APP DATABASE TABLE INVENTORY
**Datum:** 28. August 2025  
**Zweck:** Vollständige Auflistung bestehender und fehlender Tabellen mit Begründung

---

## 📋 ÜBERSICHT

| **Kategorie** | **Bestehend** | **Fehlend** | **Gesamt** | **Abdeckung** |
|---------------|---------------|-------------|------------|---------------|
| **Core Business** | 15 | 8 | 23 | 65% |
| **Visibility Check** | 8 | 5 | 13 | 62% |
| **Social Media** | 6 | 7 | 13 | 46% |
| **Authentication** | 2 | 4 | 6 | 33% |
| **Analytics** | 12 | 6 | 18 | 67% |
| **Content Management** | 0 | 8 | 8 | 0% |
| **Admin & Operations** | 10 | 3 | 13 | 77% |
| **Compliance & Security** | 8 | 2 | 10 | 80% |
| **GESAMT** | **61** | **43** | **104** | **59%** |

---

## 🏢 CORE BUSINESS LOGIC

### ✅ **BESTEHENDE TABELLEN (15)**

| **Tabelle** | **Spalten** | **Zweck** | **Status** |
|-------------|-------------|-----------|------------|
| `business_partners` | 30 | Hauptgeschäftsdaten, Restaurant-Partnerschaften | ✅ Vollständig |
| `business_profiles` | 61 | Detaillierte Restaurant-Profile mit Branding | ✅ Vollständig |
| `business_contact_data` | 20 | Kontaktdaten und Adressinformationen | ✅ Vollständig |
| `partner_bookings` | 19 | Commerce-System, Service-Buchungen | ✅ Vollständig |
| `partner_kpis` | 15 | Business-KPIs und Performance-Metriken | ✅ Vollständig |
| `partner_onboarding_steps` | 9 | Onboarding-Workflow-Tracking | ✅ Vollständig |
| `partner_private_contacts` | 8 | Private Kontaktdaten (DSGVO-konform) | ✅ Vollständig |
| `partner_profile_draft` | 6 | Draft-Versionen von Profilen | ✅ Vollständig |
| `partner_upload_quota` | 3 | Upload-Limits und Quota-Management | ✅ Vollständig |
| `service_packages` | 15 | Produktkatalog und Service-Angebote | ✅ Vollständig |
| `service_packages_legacy` | 18 | Legacy-Produktkatalog (Migration) | ✅ Vollständig |
| `service_prices` | 8 | Preisgestaltung und Währungsmanagement | ✅ Vollständig |
| `service_price_history` | 8 | Preisverlauf für Transparenz | ✅ Vollständig |
| `addon_services` | 18 | Zusatzservices und Add-ons | ✅ Vollständig |
| `promo_codes` | 16 | Promocodes und Rabattsystem | ✅ Vollständig |

### ❌ **FEHLENDE TABELLEN (8)**

| **Tabelle** | **Zweck** | **Begründung** | **Priorität** |
|-------------|-----------|----------------|---------------|
| `business_locations` | Multi-Location-Support für Ketten | **Warum:** Restaurants mit mehreren Standorten können nicht verwaltet werden | P1 |
| `business_team_members` | Team-Management und Rollen | **Warum:** Multi-User-Support fehlt, nur ein Owner pro Business | P0 |
| `business_subscriptions` | Abo-Management und Billing | **Warum:** Recurring-Payments können nicht verwaltet werden | P1 |
| `business_integrations` | Third-Party-Integrationen | **Warum:** POS, Booking-Systeme, etc. können nicht verbunden werden | P2 |
| `business_compliance` | DSGVO, Lizenzen, Zertifikate | **Warum:** Compliance-Tracking fehlt für Enterprise-Kunden | P2 |
| `business_notifications` | Business-spezifische Benachrichtigungen | **Warum:** Targeted Notifications für verschiedene Businesses | P2 |
| `business_settings` | Erweiterte Business-Konfiguration | **Warum:** Granulare Einstellungen pro Business fehlen | P2 |
| `business_audit_log` | Änderungsprotokoll für Businesses | **Warum:** Compliance und Nachverfolgung von Änderungen | P1 |

---

## 🔍 VISIBILITY CHECK SYSTEM

### ✅ **BESTEHENDE TABELLEN (8)**

| **Tabelle** | **Spalten** | **Zweck** | **Status** |
|-------------|-------------|-----------|------------|
| `visibility_check_leads` | 61 | VC-Eingangspunkt, Lead-Erfassung | ✅ Vollständig |
| `visibility_check_results` | 15 | Analyseergebnisse und Scores | ✅ Vollständig |
| `visibility_check_actions` | 11 | Handlungsempfehlungen | ✅ Vollständig |
| `competitive_analysis` | 11 | Wettbewerbsanalyse und Benchmarking | ✅ Vollständig |
| `swot_analysis` | 10 | SWOT-Framework-Integration | ✅ Vollständig |
| `platform_recommendations` | 13 | Plattform-spezifische Empfehlungen | ✅ Vollständig |
| `industry_benchmarks` | 11 | Branchenvergleiche und Standards | ✅ Vollständig |
| `visibility_trends` | 6 | Trend-Tracking über Zeit | ✅ Vollständig |

### ❌ **FEHLENDE TABELLEN (5)**

| **Tabelle** | **Zweck** | **Begründung** | **Priorität** |
|-------------|-----------|----------------|---------------|
| `vc_result_tokens` | Sichere Token-Verwaltung für DOI | **Warum:** DOI-Process ist unsicher, Token können nicht verwaltet werden | P0 |
| `vc_analysis_queue` | Asynchrone Analyse-Verarbeitung | **Warum:** Lange Analysen blockieren UI, keine Queue-Verwaltung | P0 |
| `vc_persona_analysis` | Persona-Klassifizierung (4 Typen) | **Warum:** Adaptive UX basierend auf Nutzertyp nicht möglich | P1 |
| `vc_competitor_tracking` | Kontinuierliches Competitor-Monitoring | **Warum:** Einmalige Analyse, kein kontinuierliches Tracking | P1 |
| `vc_improvement_tracking` | Fortschritt-Tracking nach Empfehlungen | **Warum:** ROI der Empfehlungen kann nicht gemessen werden | P2 |

---

## 📱 SOCIAL MEDIA MANAGEMENT

### ✅ **BESTEHENDE TABELLEN (6)**

| **Tabelle** | **Spalten** | **Zweck** | **Status** |
|-------------|-------------|-----------|------------|
| `google_oauth_tokens` | 16 | Google OAuth-Verwaltung | ✅ Vollständig |
| `facebook_oauth_tokens` | 11 | Facebook OAuth-Verwaltung | ✅ Vollständig |
| `gmb_data_cache` | 16 | Google Business Cache | ✅ Vollständig |
| `facebook_data_cache` | 16 | Facebook-Daten-Cache | ✅ Vollständig |
| `gmb_profiles` | 17 | GMB-Profile-Snapshots | ✅ Vollständig |
| `facebook_webhook_events` | 11 | Facebook-Webhook-Verarbeitung | ✅ Vollständig |

### ❌ **FEHLENDE TABELLEN (7)**

| **Tabelle** | **Zweck** | **Begründung** | **Priorität** |
|-------------|-----------|----------------|---------------|
| `connected_social_accounts` | Zentrale Social-Account-Verwaltung | **Warum:** Fragmentierte OAuth-Verwaltung, keine einheitliche Übersicht | P0 |
| `social_media_posts` | Post-Tracking über alle Plattformen | **Warum:** Performance-Analyse unmöglich, kein Post-Management | P0 |
| `content_calendar` | Content-Scheduling und -Planung | **Warum:** Automated Postings nicht möglich, keine Planung | P0 |
| `content_templates` | Wiederverwendbare Content-Vorlagen | **Warum:** Skalierbare Content-Erstellung unmöglich | P1 |
| `social_media_interactions` | Kommentare, Likes, Mentions-Management | **Warum:** Community-Management nicht möglich | P1 |
| `content_analytics` | Content-Performance-Tracking | **Warum:** ROI von Content kann nicht gemessen werden | P1 |
| `api_quota_usage` | API-Rate-Limiting für alle Plattformen | **Warum:** Rate-Limits werden überschritten, API-Blocks | P1 |

---

## 🔐 AUTHENTICATION & USER MANAGEMENT

### ✅ **BESTEHENDE TABELLEN (2)**

| **Tabelle** | **Spalten** | **Zweck** | **Status** |
|-------------|-------------|-----------|------------|
| `profiles` | 10 | Basis-Nutzerprofile mit Rollen | ✅ Vollständig |
| `private_profile` | 8 | Private Daten (DSGVO-konform) | ✅ Vollständig |

### ❌ **FEHLENDE TABELLEN (4)**

| **Tabelle** | **Zweck** | **Begründung** | **Priorität** |
|-------------|-----------|----------------|---------------|
| `oauth_tokens` | Unified OAuth-Token-Management | **Warum:** Fragmentierte Token-Verwaltung, Sicherheitsrisiko | P0 |
| `user_sessions` | Erweiterte Session-Verwaltung | **Warum:** Session-Tracking und -Security fehlt | P0 |
| `user_permissions` | Granulare Berechtigungen | **Warum:** Nur grobe Rollen, keine feinen Berechtigungen | P1 |
| `user_activity_log` | User-Activity-Tracking | **Warum:** Audit-Trail für User-Aktionen fehlt | P2 |

---

## 📊 ANALYTICS & BUSINESS INTELLIGENCE

### ✅ **BESTEHENDE TABELLEN (12)**

| **Tabelle** | **Spalten** | **Zweck** | **Status** |
|-------------|-------------|-----------|------------|
| `ga4_daily` | 16 | Google Analytics Daten | ✅ Vollständig |
| `admin_booking_kpis` | 4 | Admin-Dashboard KPIs | ✅ Vollständig |
| `admin_booking_metrics_by_month` | 4 | Monatliche Booking-Metriken | ✅ Vollständig |
| `admin_booking_revenue_analytics` | 9 | Revenue-Analytics | ✅ Vollständig |
| `lead_events` | 12 | Event-Tracking für Leads | ✅ Vollständig |
| `oauth_event_logs` | 12 | OAuth-Event-Logging | ✅ Vollständig |
| `fb_conversion_logs` | 11 | Facebook-Conversion-Tracking | ✅ Vollständig |
| `fb_conversions_config` | 7 | Facebook-Pixel-Konfiguration | ✅ Vollständig |
| `matching_performance` | 9 | Matching-Algorithmus-Performance | ✅ Vollständig |
| `restaurant_analytics` | 10 | Restaurant-spezifische Analytics | ✅ Vollständig |
| `user_shares` | 14 | Social-Sharing-Tracking | ✅ Vollständig |
| `visibility_health_monitor` | 9 | VC-System-Health-Monitoring | ✅ Vollständig |

### ❌ **FEHLENDE TABELLEN (6)**

| **Tabelle** | **Zweck** | **Begründung** | **Priorität** |
|-------------|-----------|----------------|---------------|
| `business_kpis` | Zentrale KPI-Sammlung pro Business | **Warum:** KPIs sind fragmentiert, keine einheitliche Sicht | P0 |
| `dashboard_widgets` | Personalisierbare Dashboard-Konfiguration | **Warum:** Starre Dashboards, keine Personalisierung möglich | P1 |
| `custom_reports` | Benutzerdefinierte Report-Konfiguration | **Warum:** Nur vordefinierte Reports, keine Custom-Reports | P2 |
| `data_export_logs` | Tracking von Datenexporten (DSGVO) | **Warum:** DSGVO-Compliance für Datenexporte fehlt | P1 |
| `analytics_alerts` | Automatische Alerts bei KPI-Änderungen | **Warum:** Proaktive Benachrichtigungen bei Problemen fehlen | P2 |
| `cohort_analysis` | Kohortenanalyse für User-Retention | **Warum:** User-Retention-Analyse nicht möglich | P2 |

---

## 📝 CONTENT MANAGEMENT

### ✅ **BESTEHENDE TABELLEN (0)**

*Keine Content-Management-Tabellen vorhanden*

### ❌ **FEHLENDE TABELLEN (8)**

| **Tabelle** | **Zweck** | **Begründung** | **Priorität** |
|-------------|-----------|----------------|---------------|
| `content_calendar` | Content-Scheduling und -Planung | **Warum:** Automated Postings komplett unmöglich | P0 |
| `content_templates` | Wiederverwendbare Content-Vorlagen | **Warum:** Skalierbare Content-Erstellung unmöglich | P0 |
| `content_generation_jobs` | AI-Content-Generation-Queue | **Warum:** Asynchrone AI-Content-Erstellung nicht möglich | P1 |
| `content_approval_workflow` | Content-Freigabe-Prozess | **Warum:** Team-basierte Content-Freigabe fehlt | P1 |
| `content_performance` | Content-Performance-Tracking | **Warum:** ROI von Content nicht messbar | P1 |
| `content_categories` | Content-Kategorisierung | **Warum:** Content-Organisation und -Filterung fehlt | P2 |
| `content_tags` | Content-Tagging-System | **Warum:** Content-Suche und -Gruppierung unmöglich | P2 |
| `content_versions` | Content-Versionierung | **Warum:** Änderungshistorie und Rollback fehlt | P2 |

---

## 🛠️ ADMIN & OPERATIONS

### ✅ **BESTEHENDE TABELLEN (10)**

| **Tabelle** | **Spalten** | **Zweck** | **Status** |
|-------------|-------------|-----------|------------|
| `auto_tagging_jobs` | 7 | Automatische Kategorisierung | ✅ Vollständig |
| `billing_events` | 3 | Billing-Event-Tracking | ✅ Vollständig |
| `alerts` | 8 | System-Alerts und Benachrichtigungen | ✅ Vollständig |
| `consultation_requests` | 14 | Beratungsanfragen-Management | ✅ Vollständig |
| `waitlist` | 16 | Waitlist-Management | ✅ Vollständig |
| `promo_code_usage` | 4 | Promocode-Usage-Tracking | ✅ Vollständig |
| `service_audit_log` | 7 | Service-Änderungsprotokoll | ✅ Vollständig |
| `google_job_queue` | 10 | Google-API-Job-Queue | ✅ Vollständig |
| `category_cross_tags` | 8 | Kategorie-übergreifende Tags | ✅ Vollständig |
| `category_search_logs` | 7 | Kategorie-Suchverhalten | ✅ Vollständig |

### ❌ **FEHLENDE TABELLEN (3)**

| **Tabelle** | **Zweck** | **Begründung** | **Priorität** |
|-------------|-----------|----------------|---------------|
| `system_health_checks` | Automatische System-Health-Überwachung | **Warum:** Proaktive System-Überwachung fehlt | P1 |
| `feature_flags` | Feature-Flag-Management | **Warum:** A/B-Testing und Feature-Rollouts nicht möglich | P1 |
| `maintenance_windows` | Wartungsfenster-Planung | **Warum:** Geplante Wartungen können nicht kommuniziert werden | P2 |

---

## 🔒 COMPLIANCE & SECURITY

### ✅ **BESTEHENDE TABELLEN (8)**

| **Tabelle** | **Spalten** | **Zweck** | **Status** |
|-------------|-------------|-----------|------------|
| `security_events` | 8 | Security-Event-Logging | ✅ Vollständig |
| `security_alerts` | 11 | Security-Alert-Management | ✅ Vollständig |
| `security_audit_log` | 10 | Security-Audit-Trail | ✅ Vollständig |
| `user_consent_tracking` | 10 | DSGVO-Consent-Tracking | ✅ Vollständig |
| `category_tag_events` | 10 | Kategorie-Änderungsprotokoll | ✅ Vollständig |
| `category_specifics` | 6 | Kategorie-spezifische Daten | ✅ Vollständig |
| `gmb_categories` | 21 | Google-Kategorien-Verwaltung | ✅ Vollständig |
| `main_categories` | 10 | Haupt-Kategorien-System | ✅ Vollständig |

### ❌ **FEHLENDE TABELLEN (2)**

| **Tabelle** | **Zweck** | **Begründung** | **Priorität** |
|-------------|-----------|----------------|---------------|
| `data_retention_policies` | DSGVO-Aufbewahrungsrichtlinien | **Warum:** Automatische Datenlöschung nach DSGVO fehlt | P1 |
| `compliance_reports` | Compliance-Report-Generation | **Warum:** Automatische Compliance-Reports für Audits fehlen | P2 |

---

## 🎯 PRIORITÄTEN-MATRIX

### **P0 - KRITISCH (Sofort erforderlich)**
| **Tabelle** | **Bereich** | **Blocker für** |
|-------------|-------------|-----------------|
| `vc_result_tokens` | VC System | DOI-Process Sicherheit |
| `vc_analysis_queue` | VC System | Asynchrone VC-Analysen |
| `connected_social_accounts` | Social Media | Unified Social-Management |
| `social_media_posts` | Social Media | Post-Performance-Tracking |
| `content_calendar` | Content | Automated Postings |
| `content_templates` | Content | Skalierbare Content-Erstellung |
| `business_team_members` | Core Business | Multi-User-Support |
| `oauth_tokens` | Authentication | Sichere Token-Verwaltung |
| `user_sessions` | Authentication | Session-Security |
| `business_kpis` | Analytics | Zentrale KPI-Übersicht |

### **P1 - HOCH (Nächste 4 Wochen)**
| **Tabelle** | **Bereich** | **Ermöglicht** |
|-------------|-------------|----------------|
| `vc_persona_analysis` | VC System | Adaptive UX |
| `api_quota_usage` | Social Media | Rate-Limiting-Schutz |
| `social_media_interactions` | Social Media | Community-Management |
| `content_analytics` | Content | Content-ROI-Tracking |
| `dashboard_widgets` | Analytics | Personalisierbare Dashboards |
| `business_subscriptions` | Core Business | Abo-Management |
| `system_health_checks` | Operations | Proaktive Überwachung |
| `feature_flags` | Operations | A/B-Testing |

### **P2 - MITTEL (Nächste 8 Wochen)**
| **Tabelle** | **Bereich** | **Verbessert** |
|-------------|-------------|----------------|
| `vc_improvement_tracking` | VC System | ROI-Messung |
| `content_categories` | Content | Content-Organisation |
| `custom_reports` | Analytics | Flexible Reporting |
| `business_integrations` | Core Business | Third-Party-Konnektivität |
| `compliance_reports` | Security | Audit-Unterstützung |

---

## 📈 IMPLEMENTIERUNGS-ROADMAP

### **Phase 1: Security & Core (Woche 1-2)**
```sql
-- Kritische Sicherheits- und Kern-Features
CREATE TABLE vc_result_tokens (...);
CREATE TABLE oauth_tokens (...);
CREATE TABLE user_sessions (...);
CREATE TABLE business_team_members (...);
```

### **Phase 2: Content & Social (Woche 3-4)**
```sql
-- Content-Management und Social-Media-Features
CREATE TABLE content_calendar (...);
CREATE TABLE content_templates (...);
CREATE TABLE connected_social_accounts (...);
CREATE TABLE social_media_posts (...);
```

### **Phase 3: Analytics & VC (Woche 5-6)**
```sql
-- Business Intelligence und VC-Erweiterungen
CREATE TABLE business_kpis (...);
CREATE TABLE vc_analysis_queue (...);
CREATE TABLE vc_persona_analysis (...);
CREATE TABLE dashboard_widgets (...);
```

### **Phase 4: Operations & Compliance (Woche 7-8)**
```sql
-- Betrieb und Compliance-Features
CREATE TABLE api_quota_usage (...);
CREATE TABLE system_health_checks (...);
CREATE TABLE feature_flags (...);
CREATE TABLE data_retention_policies (...);
```

---

## 🎯 FAZIT

**Aktuelle Situation:**
- ✅ **61 Tabellen vorhanden** (59% Abdeckung)
- ❌ **43 Tabellen fehlen** für vollständige Feature-Umsetzung
- 🚨 **10 kritische Blocker** (P0) verhindern Kern-Features

**Empfehlung:**
Implementierung in 4 Phasen über 8 Wochen, beginnend mit den 10 kritischen P0-Tabellen für Security, VC-System und Content-Management.

**Nächste Schritte:**
1. ✅ P0-Tabellen implementieren (Woche 1-2)
2. ✅ Migration-Scripts für bestehende Daten
3. ✅ API-Endpoints für neue Features
4. ✅ Frontend-Integration der erweiterten Funktionen