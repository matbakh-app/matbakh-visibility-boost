# Matbakh.app Dashboard Verbindungsbericht

## Aktuelle Situation (Stand: August 2025)

✅ **Erfolgreich gelöscht:** Alle Legacy-Dashboard-Komponenten und Seiten
✅ **Neue Architektur:** Modulares Widget-System unter `/dashboard/main` funktionsfähig
✅ **Build-Errors behoben:** Alle TypeScript-Fehler wurden korrigiert

## Vorhandene Supabase-Tabellen für Dashboard-Integration

### ✅ **Bereits verfügbar und kompatibel:**

#### 1. **Business Profiles** (`business_profiles`)
- ✅ Primäre Datenbasis für Restaurant-Profile
- ✅ Felder: `company_name`, `address`, `phone`, `website`, `google_rating`, `google_reviews_count`
- ✅ Social Media: `facebook_page_id`, `instagram_handle`, `facebook_followers`, `instagram_followers`
- ✅ Visibility Check Integration: `vc_completed`, `vc_score`, `vc_results`

#### 2. **Google Analytics Integration** (`ga4_daily`)
- ✅ Tägliche GA4-Metriken verfügbar
- ✅ Felder: `sessions`, `page_views`, `unique_users`, `bounce_rate`, `conversion_rate`
- ✅ Aggregierte Daten: `traffic_sources`, `device_breakdown`, `top_pages`

#### 3. **Google My Business** (`gmb_profiles`) 
- ✅ GMB-Performance-Tracking
- ✅ Felder: `google_rating`, `total_reviews`, `photos_count`, `posts_count`
- ✅ Verification Status und Business Data

#### 4. **Facebook/Meta Integration**
- ✅ `facebook_data_cache`: Social Media Metriken
- ✅ `facebook_oauth_tokens`: API-Verbindungen
- ✅ Felder: `followers_data`, `posts_data`, `insights_data`

### 🔄 **Benötigt Anpassung für neue Dashboard-Widgets:**

#### 1. **Fehlende Widget-spezifische Tabellen:**

```sql
-- Beispiel: Dashboard Widget Settings
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  widget_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  widget_order INTEGER DEFAULT 0,
  widget_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Beispiel: Aggregierte KPI-Zusammenfassungen
CREATE TABLE dashboard_kpi_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  visibility_score INTEGER,
  total_reviews INTEGER,
  avg_rating NUMERIC,
  social_followers INTEGER,
  website_sessions INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 2. **Orders/Lieferdienste Integration** ❌ **FEHLT KOMPLETT**
```sql
-- Benötigt: Delivery Platform Integration
CREATE TABLE delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL, -- 'ubereats', 'deliveroo', 'lieferando'
  order_count INTEGER,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 3. **Reservations/Tischbuchungen** ❌ **FEHLT KOMPLETT**
```sql
-- Benötigt: Table Reservation Tracking
CREATE TABLE restaurant_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  reservation_date DATE,
  party_size INTEGER,
  platform TEXT, -- 'opentable', 'quandoo', 'internal'
  status TEXT DEFAULT 'confirmed',
  no_show BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 4. **Ad Analytics Integration** ❌ **FEHLT KOMPLETT**
```sql
-- Benötigt: Advertising Performance
CREATE TABLE ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL, -- 'google_ads', 'facebook_ads'
  ad_spend NUMERIC,
  clicks INTEGER,
  impressions INTEGER,
  conversions INTEGER,
  ctr NUMERIC,
  cpa NUMERIC,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 5. **Booking Portal Reviews** ❌ **FEHLT KOMPLETT**
```sql
-- Benötigt: Third-party Review Platforms
CREATE TABLE booking_portal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  platform TEXT NOT NULL, -- 'tripadvisor', 'thefork', 'booking.com'
  avg_rating NUMERIC,
  review_count INTEGER,
  ranking_position INTEGER,
  views INTEGER,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Aktuelle Dashboard-Widget Verbindungsstatus

| Widget | Datenquelle | Status | Benötigte Aktion |
|--------|-------------|--------|-------------------|
| ✅ **Visibility Score** | `business_profiles.vc_score` | **Funktional** | Mock-Daten aktiv |
| ✅ **Reviews** | `business_profiles.google_rating` | **Funktional** | Mock-Daten aktiv |
| ❌ **Orders** | Lieferdienst-APIs | **Fehlt** | Tabelle + API-Integration nötig |
| ❌ **Reservations** | Buchungsplattformen | **Fehlt** | Tabelle + API-Integration nötig |
| ❌ **Ad Analytics** | Google/Meta Ads APIs | **Fehlt** | Tabelle + API-Integration nötig |
| ❌ **Booking Portals** | TripAdvisor/TheFork APIs | **Fehlt** | Tabelle + API-Integration nötig |

## Empfohlene nächste Schritte

### 1. **Sofort (MVP-Phase):**
- ✅ Dashboard funktioniert mit Mock-Daten
- 🔄 Supabase-Migationen für fehlende Tabellen ausführen
- 🔄 Widget-API-Endpoints mit echten Daten aus `business_profiles` verbinden

### 2. **Phase 2 (Datenintegration):**
- 📊 GA4-Widget mit `ga4_daily` verbinden
- 📱 Social Media-Widget mit `facebook_data_cache` verbinden 
- 🎯 GMB-Widget mit `gmb_profiles` verbinden

### 3. **Phase 3 (Externe APIs):**
- 🍕 Lieferdienst-APIs integrieren (UberEats, Deliveroo, Lieferando)
- 🪑 Reservierungs-APIs integrieren (OpenTable, Quandoo)
- 📢 Werbeanzeigen-APIs integrieren (Google Ads, Meta Ads)
- ⭐ Bewertungsportal-APIs integrieren (TripAdvisor, TheFork)

## Widget-Feature-Flags Status

Alle Dashboard-Widgets sind über Feature-Flags steuerbar:

```typescript
const WIDGET_FEATURE_FLAGS = {
  visibilityWidget: true,     // ✅ Aktiv
  reviewsWidget: true,        // ✅ Aktiv  
  ordersWidget: false,        // ❌ Deaktiviert (fehlt Backend)
  reservationWidget: false,   // ❌ Deaktiviert (fehlt Backend)
  adAnalyticsWidget: false,   // ❌ Deaktiviert (fehlt Backend)
  bookingWidget: false,       // ❌ Deaktiviert (fehlt Backend)
};
```

## Fazit

Das neue modulare Dashboard ist **technisch bereit** und alle Build-Errors wurden behoben. Die Basis-Widgets funktionieren mit Mock-Daten. Für die vollständige Funktionalität müssen die fehlenden Supabase-Tabellen und API-Integrationen implementiert werden.

**Nächster Schritt:** Supabase-Migrationen für fehlende Tabellen ausführen und Widget-APIs mit echten Daten verbinden.