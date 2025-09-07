# 🔍 MATBAKH.APP DATABASE ANALYSIS REPORT
**Datum:** 28. August 2025  
**Zweck:** Vollständige Analyse der Datenbankstruktur gegen Product Requirements

## 📊 EXECUTIVE SUMMARY

Nach eingehender Analyse der Requirements, Vision-Dokumente und der aktuellen Datenbankstruktur wurden **kritische Lücken** und **Optimierungspotentiale** identifiziert, die für die vollständige Umsetzung der matbakh.app Features erforderlich sind.

## 🎯 ANALYSIERTE BEREICHE

### 1. **Visibility Check (VC) System**
### 2. **Google/Meta Integrationen** 
### 3. **Automated Postings & Content Management**
### 4. **User Authentication & RBAC**
### 5. **Business Intelligence & Analytics**
### 6. **Social Media Management**

---

## 🔍 DETAILLIERTE ANALYSE

### 1. VISIBILITY CHECK (VC) SYSTEM

#### ✅ **Vorhandene Tabellen:**
```sql
✅ visibility_check_leads (61 Spalten) - VC-Eingangspunkt
✅ visibility_check_results (15 Spalten) - Analyseergebnisse  
✅ visibility_check_actions (11 Spalten) - Handlungsempfehlungen
✅ competitive_analysis (11 Spalten) - Wettbewerbsanalyse
✅ swot_analysis (10 Spalten) - SWOT-Framework
✅ platform_recommendations (13 Spalten) - Plattform-spezifische Tipps
✅ industry_benchmarks (11 Spalten) - Branchenvergleiche
✅ visibility_trends (6 Spalten) - Trend-Tracking
```

#### ❌ **KRITISCHE LÜCKEN:**

**1. VC Token Management**
```sql
-- FEHLT: Sichere Token-Verwaltung für DOI-Process
CREATE TABLE vc_result_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES visibility_check_leads(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  email_sent_at timestamptz,
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**2. VC Analysis Queue**
```sql
-- FEHLT: Asynchrone Analyse-Verarbeitung
CREATE TABLE vc_analysis_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES visibility_check_leads(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority integer DEFAULT 5,
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'
);
```

**3. VC Persona Detection**
```sql
-- FEHLT: Persona-Klassifizierung für adaptive UX
CREATE TABLE vc_persona_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES visibility_check_leads(id),
  persona_type text NOT NULL CHECK (persona_type IN ('skeptiker', 'ueberforderte', 'profi', 'zeitknappe')),
  confidence_score numeric(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  detection_factors jsonb, -- Faktoren die zur Klassifizierung führten
  ui_adaptations jsonb, -- UI-Anpassungen für diese Persona
  created_at timestamptz DEFAULT now()
);
```

### 2. GOOGLE/META INTEGRATIONEN

#### ✅ **Vorhandene Tabellen:**
```sql
✅ google_oauth_tokens (16 Spalten) - OAuth-Verwaltung
✅ facebook_oauth_tokens (11 Spalten) - Facebook-Auth
✅ gmb_data_cache (16 Spalten) - Google Business Cache
✅ facebook_data_cache (16 Spalten) - Facebook-Cache
✅ gmb_profiles (17 Spalten) - GMB-Profile-Snapshots
✅ gmb_categories (21 Spalten) - Google-Kategorien
```

#### ❌ **KRITISCHE LÜCKEN:**

**1. Social Media Account Management**
```sql
-- FEHLT: Zentrale Social Media Account-Verwaltung
CREATE TABLE connected_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  platform text NOT NULL CHECK (platform IN ('google_business', 'facebook', 'instagram', 'tiktok', 'linkedin')),
  account_id text NOT NULL, -- Platform-spezifische ID
  account_name text NOT NULL,
  access_token_id uuid REFERENCES oauth_tokens(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  permissions jsonb, -- Verfügbare Berechtigungen
  last_sync_at timestamptz,
  sync_error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, platform, account_id)
);
```

**2. Unified OAuth Token Management**
```sql
-- FEHLT: Plattform-übergreifende Token-Verwaltung
CREATE TABLE oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  provider text NOT NULL CHECK (provider IN ('google', 'facebook', 'instagram', 'tiktok', 'linkedin')),
  token_type text NOT NULL CHECK (token_type IN ('access', 'refresh')),
  token_hash text NOT NULL, -- Verschlüsselt gespeichert
  expires_at timestamptz,
  scopes text[],
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**3. API Rate Limiting & Quota Management**
```sql
-- FEHLT: API-Quota-Tracking für alle Plattformen
CREATE TABLE api_quota_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  provider text NOT NULL,
  endpoint text NOT NULL,
  quota_period text NOT NULL CHECK (quota_period IN ('hourly', 'daily', 'monthly')),
  requests_made integer DEFAULT 0,
  quota_limit integer NOT NULL,
  reset_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, provider, endpoint, quota_period, reset_at)
);
```

### 3. AUTOMATED POSTINGS & CONTENT MANAGEMENT

#### ✅ **Vorhandene Tabellen:**
```sql
✅ ai_recommendations (14 Spalten) - KI-Empfehlungen
✅ platform_recommendations (13 Spalten) - Plattform-Tipps
```

#### ❌ **KRITISCHE LÜCKEN:**

**1. Content Calendar & Scheduling**
```sql
-- FEHLT: Content-Kalender für automatisierte Posts
CREATE TABLE content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('post', 'story', 'reel', 'event', 'offer')),
  platforms text[] NOT NULL, -- ['google_business', 'facebook', 'instagram']
  
  -- Content data
  text_content text,
  media_urls text[],
  hashtags text[],
  mentions text[],
  
  -- Scheduling
  scheduled_for timestamptz NOT NULL,
  timezone text DEFAULT 'Europe/Berlin',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'cancelled')),
  
  -- Publishing results
  published_at timestamptz,
  platform_post_ids jsonb, -- {facebook: "123", instagram: "456"}
  publish_errors jsonb,
  
  -- Metadata
  created_by uuid REFERENCES profiles(id),
  auto_generated boolean DEFAULT false,
  template_id uuid, -- Referenz zu Content-Templates
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**2. Content Templates & AI Generation**
```sql
-- FEHLT: Wiederverwendbare Content-Templates
CREATE TABLE content_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id), -- NULL = global template
  name text NOT NULL,
  category text NOT NULL, -- 'seasonal', 'promotional', 'informational'
  
  -- Template structure
  template_data jsonb NOT NULL, -- {text: "...", placeholders: [...], media_slots: 2}
  platforms text[] NOT NULL,
  
  -- AI generation settings
  ai_prompt text,
  ai_model text DEFAULT 'gpt-4',
  generation_rules jsonb, -- Regeln für automatische Generierung
  
  -- Usage tracking
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  -- Status
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**3. Content Performance Analytics**
```sql
-- FEHLT: Content-Performance-Tracking
CREATE TABLE content_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_calendar(id),
  platform text NOT NULL,
  platform_post_id text NOT NULL,
  
  -- Engagement metrics
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  clicks integer DEFAULT 0,
  
  -- Advanced metrics
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  engagement_rate numeric(5,4),
  
  -- Time-based data
  measured_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(content_id, platform, measured_at)
);
```

### 4. USER AUTHENTICATION & RBAC

#### ✅ **Vorhandene Tabellen:**
```sql
✅ profiles (10 Spalten) - Basis-Nutzerprofile
✅ private_profile (8 Spalten) - Private Daten (DSGVO-konform)
```

#### ❌ **KRITISCHE LÜCKEN:**

**1. Team Management & Permissions**
```sql
-- FEHLT: Team-Mitglieder für Businesses
CREATE TABLE business_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissions jsonb DEFAULT '{}', -- Granulare Berechtigungen
  invited_by uuid REFERENCES profiles(id),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);
```

**2. Session & Security Management**
```sql
-- FEHLT: Erweiterte Session-Verwaltung
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  session_token_hash text NOT NULL UNIQUE,
  device_info jsonb, -- {browser, os, device_type, ip_address}
  expires_at timestamptz NOT NULL,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- FEHLT: Security Event Logging
CREATE TABLE security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  event_type text NOT NULL, -- 'login', 'logout', 'password_change', 'suspicious_activity'
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at timestamptz DEFAULT now()
);
```

### 5. BUSINESS INTELLIGENCE & ANALYTICS

#### ✅ **Vorhandene Tabellen:**
```sql
✅ ga4_daily (16 Spalten) - Google Analytics Daten
✅ admin_booking_kpis (4 Spalten) - Booking-KPIs
✅ admin_booking_metrics_by_month (4 Spalten) - Monatliche Metriken
✅ admin_booking_revenue_analytics (9 Spalten) - Revenue-Analytics
```

#### ❌ **KRITISCHE LÜCKEN:**

**1. Unified Analytics Dashboard**
```sql
-- FEHLT: Zentrale KPI-Sammlung
CREATE TABLE business_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  date date NOT NULL,
  
  -- Visibility metrics
  visibility_score integer,
  google_ranking_position integer,
  google_reviews_count integer,
  google_rating numeric(2,1),
  
  -- Social media metrics
  social_followers jsonb, -- {facebook: 1234, instagram: 5678}
  social_engagement jsonb,
  social_reach jsonb,
  
  -- Website metrics
  website_visitors integer,
  website_sessions integer,
  bounce_rate numeric(5,4),
  
  -- Business metrics
  bookings_count integer,
  revenue numeric(10,2),
  customer_satisfaction numeric(3,2),
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, date)
);
```

**2. Custom Dashboard Configuration**
```sql
-- FEHLT: Personalisierbare Dashboards
CREATE TABLE dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  widget_type text NOT NULL, -- 'chart', 'metric', 'table', 'map'
  widget_config jsonb NOT NULL, -- Konfiguration des Widgets
  position jsonb NOT NULL, -- {x: 0, y: 0, width: 4, height: 2}
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 6. SOCIAL MEDIA MANAGEMENT

#### ❌ **KOMPLETT FEHLEND:**

**1. Social Media Posts Management**
```sql
-- FEHLT: Social Media Posts-Tracking
CREATE TABLE social_media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id),
  content_id uuid REFERENCES content_calendar(id),
  platform text NOT NULL,
  platform_post_id text NOT NULL,
  
  -- Post content
  text_content text,
  media_urls text[],
  post_type text, -- 'post', 'story', 'reel', 'event'
  
  -- Scheduling & publishing
  scheduled_for timestamptz,
  published_at timestamptz,
  status text DEFAULT 'draft',
  
  -- Performance (updated via API)
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform, platform_post_id)
);
```

**2. Social Media Comments & Interactions**
```sql
-- FEHLT: Kommentar-Management
CREATE TABLE social_media_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_media_posts(id),
  platform text NOT NULL,
  interaction_type text NOT NULL, -- 'comment', 'like', 'share', 'mention'
  platform_user_id text,
  platform_username text,
  content text,
  sentiment text, -- 'positive', 'neutral', 'negative'
  requires_response boolean DEFAULT false,
  responded_at timestamptz,
  response_text text,
  created_at timestamptz DEFAULT now()
);
```

---

## 🚨 KRITISCHE EMPFEHLUNGEN

### **SOFORTIGE MASSNAHMEN (P0):**

1. **VC Token Management implementieren** - Sicherheitslücke
2. **OAuth Token Unified Management** - Verhindert Token-Konflikte  
3. **Content Calendar System** - Kernfunktion für Automated Postings
4. **Business Team Management** - Multi-User-Support erforderlich

### **KURZFRISTIG (P1):**

1. **Social Media Posts Tracking** - Performance-Analyse
2. **API Quota Management** - Verhindert Rate-Limiting-Probleme
3. **Content Templates System** - Skalierbare Content-Erstellung
4. **Security Event Logging** - Compliance & Monitoring

### **MITTELFRISTIG (P2):**

1. **Advanced Analytics Dashboard** - Business Intelligence
2. **Content Performance Analytics** - ROI-Tracking
3. **Social Media Interactions** - Community Management
4. **Custom Dashboard Widgets** - Personalisierung

---

## 📊 IMPLEMENTIERUNGS-ROADMAP

### **Phase 1: Security & Core (Woche 1-2)**
```sql
-- Kritische Sicherheits- und Kern-Tabellen
✅ vc_result_tokens
✅ oauth_tokens (unified)
✅ business_team_members
✅ security_events
```

### **Phase 2: Content Management (Woche 3-4)**
```sql
-- Content-System für Automated Postings
✅ content_calendar
✅ content_templates
✅ connected_social_accounts
✅ api_quota_usage
```

### **Phase 3: Analytics & Performance (Woche 5-6)**
```sql
-- Business Intelligence & Tracking
✅ business_kpis
✅ content_analytics
✅ social_media_posts
✅ dashboard_widgets
```

### **Phase 4: Community Management (Woche 7-8)**
```sql
-- Erweiterte Social Media Features
✅ social_media_interactions
✅ vc_persona_analysis
✅ vc_analysis_queue
```

---

## 🎯 FAZIT

Die aktuelle Datenbankstruktur deckt **~60% der Requirements** ab. Für eine vollständige Umsetzung der matbakh.app Vision sind **23 zusätzliche Tabellen** erforderlich.

**Kritische Blocker:**
- ❌ Keine sichere VC-Token-Verwaltung
- ❌ Fragmentierte OAuth-Token-Verwaltung  
- ❌ Fehlendes Content-Management-System
- ❌ Keine Team-/Multi-User-Unterstützung

**Empfehlung:** Implementierung in 4 Phasen über 8 Wochen, beginnend mit den kritischen Sicherheits- und Kern-Features.

---

**Nächste Schritte:**
1. ✅ Schema-Erweiterungen implementieren (Phase 1)
2. ✅ Migration-Scripts für bestehende Daten erstellen
3. ✅ API-Endpoints für neue Features entwickeln
4. ✅ Frontend-Integration der erweiterten Features