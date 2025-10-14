# Phase 1 Implementation Plan - Exakter Umsetzungsplan

**Branch:** `feat/phase1-onboarding-vc-dashboards`  
**Ziel:** 3 End-to-End Flows ohne große Refactorings  
**Status:** 🚀 READY TO IMPLEMENT

## 🎯 SCOPE DEFINITION

### 3 Kern-Flows
1. **Onboarding mit KI-Personas** → `/onboarding` (4 Schritte)
2. **VC-Report Outstanding** → `/vc/result?t=token` (Public + Owner)  
3. **2 Dashboards** → `/dashboard` (Owner) + `/vc/result?t=token` (Public)

### Constraints
- ❌ Kein manueller Code/SQL durch Nutzer
- ❌ Kein Tiefen-Umbau der Altstruktur  
- ✅ Minimal-Schema nur für diese 3 Flows
- ✅ RLS strikt, Public nur über expiring Tokens
- ✅ Evidence/Traceability minimal (Confidence pro Finding)

## 📊 BESTEHENDE INFRASTRUKTUR ANALYSE

### Tabellen die ich nutzen werde:
```sql
-- BESTEHEND (aus Tabellen.md):
✅ profiles (id, role, display_name, created_at, updated_at)
✅ business_partners (→ wird zu restaurants migriert)
✅ visibility_check_leads (→ wird zu vc_runs erweitert)
✅ service_packages (für CTAs)
✅ feature_flags (für Rollout-Kontrolle)

-- NEU ERSTELLEN:
🆕 restaurants (konsolidiert aus business_partners)
🆕 vc_runs (erweitert aus visibility_check_leads)
🆕 vc_results (strukturierte Ergebnisse)
🆕 vc_result_tokens (Public-Access Tokens)
🆕 vc_evidence (minimal Evidence-Tracking)
🆕 content_queue (für Owner-CTAs)
🆕 events (Telemetry)
```

### Dashboard-Dateien die ich nutzen werde:
```typescript
// BESTEHEND:
✅ src/pages/dashboard/RestaurantDashboard.tsx
✅ src/components/dashboard/restaurant/VisibilityScoreWidget.tsx
✅ src/components/dashboard/restaurant/MarketingWidget.tsx
✅ src/components/dashboard/restaurant/LocationOverviewWidget.tsx
✅ src/components/dashboard/restaurant/PerformanceTrendsWidget.tsx

// ERWEITERN:
🔄 src/pages/vc/VCResult.tsx (Public + Owner Views)
🔄 src/pages/vc/VCQuick.tsx (Integration mit Onboarding)

// NEU ERSTELLEN:
🆕 src/pages/onboarding/OnboardingWizard.tsx (4-Step Flow)
🆕 src/components/vc/VCReportOutstanding.tsx (Score + Evidence)
```

## 🗄️ GMB_CATEGORIES CSV STRUKTUR

Du erwähntest die gmb_categories Tabelle. Hier die Spaltenstruktur:

```csv
category_id,name_de,name_en,is_popular,parent_category_id,sort_order,country_availability,keywords,synonyms
gcid_restaurant,Restaurant,Restaurant,true,,1,"DE,AT,CH","restaurant,gastronomie","gastro,lokal"
gcid_pizza,Pizzeria,Pizzeria,true,gcid_restaurant,2,"DE,AT,CH","pizza,italienisch","pizza restaurant"
gcid_burger,Burger Restaurant,Burger Restaurant,true,gcid_restaurant,3,"DE,AT,CH","burger,fastfood","burger laden"
```

**Soll ich diese CSV-Struktur für dich vorbereiten?**
##
 📋 SCHRITT-FÜR-SCHRITT UMSETZUNGSPLAN

### Schritt 1: DB Minimal-Schema (idempotent Migration)

**Datei:** `supabase/migrations/20250828000000_phase1_minimal_schema.sql`

```sql
-- 1.1 Erweiterte profiles (falls nicht vorhanden)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de';

-- 1.2 Restaurants (konsolidiert aus business_partners)
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB DEFAULT '{}', -- {street, city, postal_code, country}
  coordinates GEOGRAPHY(POINT, 4326),
  phone TEXT,
  website TEXT,
  primary_category TEXT DEFAULT 'restaurant',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  google_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 1.3 VC System
CREATE TABLE IF NOT EXISTS vc_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'processing', 'completed', 'failed')),
  locale TEXT DEFAULT 'de',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vc_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vc_run_id UUID REFERENCES vc_runs(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  google_score INTEGER CHECK (google_score BETWEEN 0 AND 100),
  social_score INTEGER CHECK (social_score BETWEEN 0 AND 100),
  website_score INTEGER CHECK (website_score BETWEEN 0 AND 100),
  quick_wins JSONB DEFAULT '[]',
  evidence_summary JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vc_result_tokens (
  token TEXT PRIMARY KEY,
  vc_run_id UUID REFERENCES vc_runs(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 1.4 Evidence (minimal)
CREATE TABLE IF NOT EXISTS vc_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vc_run_id UUID REFERENCES vc_runs(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'google_places', 'meta_graph', 'website'
  source_ref TEXT, -- URL oder ID
  confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0.0 AND 1.0),
  payload JSONB DEFAULT '{}',
  captured_at TIMESTAMP DEFAULT NOW()
);

-- 1.5 Content Queue (für Owner CTAs)
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'google_post', 'social_post'
  title TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 1.6 Events (Telemetry)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 1.7 RLS Policies
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_result_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

-- Owner sieht nur eigene Restaurants
CREATE POLICY "restaurants_owner_access" ON restaurants
  FOR ALL TO authenticated USING (owner_id = auth.uid());

-- VC Results nur über Edge Functions (Security Definer)
CREATE POLICY "vc_results_admin_only" ON vc_results
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 1.8 Feature Flags Seed
INSERT INTO feature_flags (key, value, description) VALUES
  ('onboarding_guard_live', 'false', 'Onboarding Guard aktiv'),
  ('vc_doi_live', 'true', 'VC Double-Opt-In aktiv'),
  ('vc_bedrock_live', 'true', 'AWS Bedrock Integration aktiv'),
  ('ui_invisible_default', 'true', 'Invisible UI als Standard')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Schritt 2: Edge Functions Update

**Dateien zu aktualisieren:**
- `supabase/functions/vc-start/index.ts`
- `supabase/functions/vc-result/index.ts`  
- `supabase/functions/vc-verify/index.ts`
- `supabase/functions/og-vc/index.ts`

**vc-start Function:**
```typescript
// Input: { email, restaurant_hint?, locale? }
// 1. Create vc_runs entry (status='started')
// 2. Generate token in vc_result_tokens (7 days expiry)
// 3. Send DOI mail with https://matbakh.app/vc/result?t=<token>
// 4. Log event 'vc_mail_sent'
```

**vc-result Function:**
```typescript
// GET with ?t=token
// 1. Validate token (not expired, set used_at)
// 2. Load vc_results + filtered evidence
// 3. Public: whitelisted fields only (score, categories, quick wins)
// 4. Owner (logged in + matching): + CTAs (re-run, post-queue)
// 5. Headers: Cache-Control: no-store, noindex for robots
```

### Schritt 3: Onboarding UI (KI-Personas)

**Neue Komponenten:**
```typescript
// src/pages/onboarding/OnboardingWizard.tsx
// 4 Schritte mit Auto-Save:
// 1. Profil & Sprache
// 2. Location/Claim (Google Places Lookup)
// 3. Persona-Fragen (Zeitknapp/Überfordert/Skeptiker/Profi)
// 4. Start-Aktion: VC starten

// src/components/onboarding/PersonaDetection.tsx
// Heuristik-Regeln für Persona → andere Texte/Button-Labels

// Events: onb_start, onb_restaurant_created, vc_started
```

### Schritt 4: VC-Report Outstanding

**Erweiterte Komponenten:**
```typescript
// src/components/vc/VCReportOutstanding.tsx
// - Score-Kacheln: Overall + Breakdown (Google/Social/Website/Other)
// - Sektionen: Profil, Reviews, Posts, Fotos, Web-Basics, Quick Wins
// - Evidence-Badges: jede Aussage mit "Beleg" (Quelle + Confidence)
// - CTAs (Owner only): "Jetzt posten", "Termin planen"

// src/components/vc/EvidenceBadge.tsx
// Zeigt Quelle + Confidence Score für jede Aussage
```

### Schritt 5: Dashboard Integration

**Owner Dashboard (`/dashboard`):**
```typescript
// Bestehende Widgets erweitern:
// - VisibilityScoreWidget: letztes vc_results laden
// - MarketingWidget: content_queue anzeigen
// - LocationOverviewWidget: restaurant Stammdaten
// - PerformanceTrendsWidget: Leer-State mit "Starte VC" CTA
```

**Public VC Dashboard (`/vc/result?t=token`):**
```typescript
// src/pages/vc/VCResultPublic.tsx
// - Read-Only View der VC-Ergebnisse
// - Ohne Login, noindex
// - Owner (eingeloggt + passend): zusätzliche CTAs
```

### Schritt 6: UI-Feinschliff & Routing

**Anpassungen:**
- `src/pages/vc/VCQuick.tsx`: Keine Auto-Redirects zu /dashboard
- `src/pages/vc/VCResult.tsx`: Token aus Query lesen, error-resilient
- `src/pages/_kiro/Diagnose.tsx`: Locale-Switch (de/en), immer erreichbar

### Schritt 7: Tests & Abnahme

**Smoke-Test Routes:**
- `/_kiro` → Diagnose lädt
- `/onboarding` → 4-Step Wizard funktioniert
- `/vc/quick` → Email-Eingabe, DOI-Mail
- `/vc/result?t=valid_token` → Ergebnisse sichtbar
- `/dashboard` → Owner-Dashboard mit Widgets
- `/vc/result?t=expired_token` → Freundlicher Fehler

**Dokumentation:**
`docs/live-readiness-phase1.md` mit:
- Flags-Snapshot
- Rollen-Snapshot  
- Deployed Functions
- Geprüfte Routen (OK/FAIL)
- Screenshots/GIFs

## 🎯 DEFINITION OF DONE

✅ Onboarding bis VC-Start ohne Fehler (DE/EN Texte)  
✅ VC-Resultat öffentlich via Token (noindex), Owner-CTAs  
✅ Owner-Dashboard zeigt Score/Widgets oder Leerzustände  
✅ Alle Tabellen mit RLS, Public-Read nur über Functions  
✅ Kurzer Abschluss-Report in docs/live-readiness-phase1.md

**Bereit für Implementation! Soll ich mit Schritt 1 (DB Migration) beginnen?**