# Datenmanagement-Konzept: matbakh.app

## 1. Domänen-basierte Tabellengruppierung

### 🏢 **Core Business Domain**
**Zentrale Geschäftslogik & Partner-Management**

| Tabelle | Zweck | Abhängigkeiten |
|---------|-------|----------------|
| `business_partners` | Haupt-Partnerregister | → profiles (user_id) |
| `business_profiles` | Google/Meta-Profilanbindung | → business_partners |
| `partner_bookings` | Service-Buchungen | → business_partners, service_packages |
| `partner_kpis` | Performance-Metriken | → business_partners |
| `partner_upload_quota` | Upload-Limits | → business_partners |

**Datenfluss:** User registriert → Profil → Partner-Account → Service-Buchung → KPI-Tracking

---

### 🔐 **Authentication & Security Domain**
**User-Management, OAuth, Sicherheit**

| Tabelle | Zweck | Abhängigkeiten |
|---------|-------|----------------|
| `profiles` | User-Basis (von auth.users getriggert) | ← auth.users |
| `google_oauth_tokens` | Google-API Zugriff | → profiles |
| `facebook_oauth_tokens` | Meta-API Zugriff | → profiles |
| `oauth_event_logs` | OAuth-Aktivitäten | → profiles |
| `security_events` | Sicherheitsereignisse | → profiles |
| `security_alerts` | Sicherheitswarnungen | → profiles |
| `security_audit_log` | Audit-Trail | → profiles |
| `user_consent_tracking` | DSGVO-Einverständnisse | → profiles |

**Datenfluss:** User-Registrierung → Profile → OAuth-Verbindung → Security-Monitoring

---

### 📊 **Visibility & Analytics Domain**
**Enhanced Sichtbarkeitsprüfung, KI-gestützte Reports, Benchmarking**

| Tabelle | Zweck | Abhängigkeiten | Neue Felder (Enhanced) |
|---------|-------|----------------|------------------------|
| `visibility_check_leads` | Lead-Erfassung (B2B + B2C) | Optional: → profiles | `analysis_error_message`, `report_url`, `report_generated_at` |
| `visibility_check_results` | Detaillierte Analyse-Ergebnisse | → visibility_check_leads | `overall_score`, `platform_analyses`, `benchmarks`, `category_insights`, `quick_wins`, `lead_potential`, `instagram_candidates` |
| `visibility_check_actions` | Action-Logs (Double-Opt-In, etc.) | → visibility_check_leads | Erweitert um `duration_ms`, `language`, `device`, `profile_source` |
| `unclaimed_business_profiles` | Nicht-beanspruchte Profile | → visibility_check_leads | - |
| `competitive_analysis` | Wettbewerbsanalyse | → visibility_check_leads | - |
| `swot_analysis` | SWOT-Auswertungen | → visibility_check_leads | - |
| `industry_benchmarks` | Branchenvergleiche | Standalone | - |

**Enhanced Datenfluss:** 
Lead-Erfassung → Enhanced Analyse (Multi-Platform) → JSONB Results → PDF-Report-Generation → Storage (visibility-reports bucket) → Double-Opt-In → E-Mail mit Download-Link → Optional: B2B Conversion

**KI-Features:**
- Instagram Auto-Detection mit Relevance-Scoring
- Plattform-übergreifende Benchmarks (Google, Facebook, Instagram)
- Dynamische Quick-Wins basierend auf Analyse
- Lead-Potential-Scoring für B2B Conversion

---

### 📈 **Platform Analytics Domain**
**Google, Meta, GA4 Datensammlung**

| Tabelle | Zweck | Abhängigkeiten |
|---------|-------|----------------|
| `ga4_daily` | Google Analytics Metriken | → business_partners |
| `gmb_profiles` | Google My Business Snapshots | → business_partners |
| `gmb_categories` | GMB-Kategorien (Referenz) | Standalone |
| `fb_conversion_logs` | Facebook Pixel Events | → business_partners |
| `fb_conversions_config` | FB Conversions Setup | → business_partners |
| `facebook_webhook_events` | Meta Webhook-Logs | → business_partners |

**Datenfluss:** OAuth-Setup → API-Anbindung → Tägliche Sync → KPI-Dashboard

---

### 💼 **Service & Pricing Domain**
**Pakete, Add-ons, Preisgestaltung**

| Tabelle | Zweck | Abhängigkeiten |
|---------|-------|----------------|
| `service_packages` | Haupt-Service-Pakete | Standalone |
| `service_packages_legacy` | Alte Pakete (Migration) | Standalone |
| `addon_services` | Zusatzdienste | → service_packages |
| `service_prices` | Aktuelle Preise | → service_packages, addon_services |
| `service_price_history` | Preisverlauf | → service_prices |
| `service_audit_log` | Änderungsprotokoll | → service_packages |
| `billing_events` | Abrechnungsereignisse | → business_partners |

**Datenfluss:** Paket-Definition → Preisgestaltung → Buchung → Abrechnung

---

### 🤖 **AI & Recommendations Domain**
**KI-gestützte Empfehlungen & Onboarding**

| Tabelle | Zweck | Abhängigkeiten |
|---------|-------|----------------|
| `ai_recommendations` | KI-generierte Empfehlungen | → business_partners |
| `platform_recommendations` | Plattform-spezifische Tipps | → business_partners |
| `onboarding_questions` | Dynamische Fragen | Standalone |
| `onboarding_steps` | Partner-Onboarding-Status | → business_partners |
| `partner_onboarding_steps` | Onboarding-Verlauf | → business_partners |

**Datenfluss:** Onboarding → Datensammlung → AI-Analyse → Empfehlungen

---

### 🍽️ **B2C Restaurant & Meal Planning Domain**
**Restaurant-Suche, Dudle, Meal-Planning**

| Tabelle | Zweck | Abhängigkeiten |
|---------|-------|----------------|
| `restaurants` | B2C Restaurant-Verzeichnis | Optional: → business_partners |
| `restaurant_features` | Restaurant-Eigenschaften | → restaurants |
| `restaurant_analytics` | B2C Performance | → restaurants |
| `ratings` | Nutzer-Bewertungen | → restaurants, profiles |
| `dudle_sessions` | Gruppen-Abstimmungen | → profiles |
| `dudle_participants` | Session-Teilnehmer | → dudle_sessions |
| `dudle_options` | Abstimmungs-Optionen | → dudle_sessions, restaurants |
| `dudle_votes` | Abstimmungsergebnisse | → dudle_options, dudle_participants |

**Datenfluss:** Restaurant-Suche → Gruppen-Dudle → Abstimmung → Buchung

---

### 🥗 **Nutrition & Meal Planning Domain**
**B2C Ernährungs-Features**

| Tabelle | Zweck | Abhängigkeiten |
|---------|-------|----------------|
| `user_dietary_profiles` | Ernährungsprofile | → profiles |
| `user_preferences` | Nutzer-Vorlieben | → profiles |
| `meal_plans` | Wochenpläne | → profiles |
| `meals` | Einzelne Mahlzeiten | → meal_plans, restaurants |
| `recipes` | Rezeptdatenbank | Standalone |
| `nutrition_logs` | Ernährungstagebuch | → profiles |
| `shopping_lists` | Einkaufslisten | → profiles |
| `shopping_list_items` | Einkaufsartikel | → shopping_lists |

**Datenfluss:** User-Präferenzen → Meal-Plan → Einkaufsliste → Nutrition-Tracking

---

### 🔧 **System & Operations Domain**
**Jobs, Alerts, System-Management**

| Tabelle | Zweck | Abhängigkeiten |
|---------|-------|----------------|
| `google_job_queue` | Async Google API Jobs | → business_partners |
| `alerts` | System-Benachrichtigungen | → profiles, business_partners |
| `notes` | System-Notizen | Standalone |
| `waitlist` | Feature-Wartelisten | → profiles |
| `user_shares` | Social Shares | → profiles |
| `social_media_channels` | Social Media Setup | → business_partners |
| `consultation_requests` | Beratungsanfragen | Standalone |
| `matching_performance` | B2C Matching-Algorithmus | → profiles, restaurants |

---

## 2. Hierarchische Datenabhängigkeiten

```
auth.users (Supabase Auth)
    └── profiles (public.profiles)
        ├── business_partners
        │   ├── business_profiles
        │   ├── partner_bookings
        │   ├── partner_kpis
        │   ├── ai_recommendations
        │   ├── ga4_daily
        │   └── gmb_profiles
        ├── visibility_check_leads
        │   ├── visibility_check_results
        │   ├── visibility_check_actions
        │   └── competitive_analysis
        ├── meal_plans
        │   └── meals
        └── dudle_sessions
            ├── dudle_participants
            ├── dudle_options
            └── dudle_votes
```

---

## 3. Kritische Datenflüsse

### **A) B2B Partner Onboarding**
```
User Registration → profiles → business_partners → 
onboarding_steps → google_oauth_tokens → business_profiles → 
service_packages (booking) → ga4_daily (sync)
```

### **B) Enhanced Visibility Check (Lead-to-Customer)**
```
Anonymer Check → visibility_check_leads (status: pending) → 
Enhanced Analysis (Multi-Platform API Calls) → 
visibility_check_results (JSONB: scores, platforms, benchmarks) → 
PDF Report Generation → Storage (visibility-reports bucket) → 
visibility_check_leads.report_url UPDATE → 
Double-Opt-In Email with Download Link → 
Optional: business_partners (B2B Conversion)
```

**Status Flow:**
- `pending` → Analysis läuft
- `completed` → Report verfügbar 
- `failed` → Fehler in analysis_error_message

### **C) B2C Restaurant Discovery**
```
User Search → restaurants → restaurant_features → 
dudle_sessions → dudle_votes → Booking → 
meal_plans (optional)
```

---

## 4. Performance & Skalierung

### **Read-Heavy Tabellen**
- `industry_benchmarks` (Cache empfohlen)
- `gmb_categories` (Static Reference)
- `onboarding_questions` (Cache empfohlen)

### **Write-Heavy Tabellen**
- `visibility_check_actions` (Event-Log)
- `oauth_event_logs` (Security-Log)
- `fb_conversion_logs` (Pixel-Events)

### **Kritische Indizierung**
```sql
-- Lead-to-Result Lookup
CREATE INDEX idx_visibility_results_lead_id ON visibility_check_results(lead_id);

-- Partner-Analytics
CREATE INDEX idx_ga4_daily_partner_date ON ga4_daily(partner_id, date);

-- B2C Queries
CREATE INDEX idx_restaurants_location ON restaurants USING GIST(location);
```

---

## 5. Datenqualität & Governance

### **Mandatory Fields**
- Alle User-bezogenen Tabellen: `user_id NOT NULL`
- Alle Partner-bezogenen Tabellen: `partner_id NOT NULL`
- Timestamps: `created_at`, `updated_at` mit Auto-Trigger

### **Referential Integrity**
- Soft-Deletes für Business-kritische Daten
- Hard-Deletes nur für Logs (nach Retention-Period)
- CASCADE nur für abhängige Child-Daten

### **DSGVO Compliance**
- `user_consent_tracking` für alle Einverständnisse
- Anonymisierung-Scripts für visibility_check_leads
- Right-to-deletion Implementation

---

## 6. Migration & Cleanup Strategy

### **Deprecated Tables**
- `service_packages_legacy` → Migrate & Drop nach 6 Monaten
- `notes` → Prüfen ob aktiv genutzt

### **Automated Cleanup**
```sql
-- Security Logs älter als 2 Jahre
DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '2 years';

-- Resolved Alerts älter als 1 Jahr
DELETE FROM security_alerts WHERE resolved = true AND resolved_at < NOW() - INTERVAL '1 year';
```

---

## 7. Monitoring & Health Checks

### **Kritische Metriken**
- Double-Opt-In Rate (visibility_check_leads)
- Partner Onboarding Completion Rate
- API Sync Success Rate (GA4, GMB)
- Security Event Frequency

### **Automated Alerts**
- Failed OAuth Refreshes
- Unusual Security Events
- High Error Rates in Conversion Logs
- Storage Quota Exceeded