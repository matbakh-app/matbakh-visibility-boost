# Dashboard Transformation Design

## Architektur-Übersicht

### Aktuelle Probleme
1. **VC-Token Funktionalität defekt**: Links wie `https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?token=...` führen zu Fehlerseiten
2. **Falsche Dashboard-Weiterleitung**: Nach Login landen User auf `/dashboard` mit `OwnerOverview` statt Restaurant Dashboard
3. **Mehrere Dashboard-Implementierungen**: Verwirrende Koexistenz von Admin-, Owner-, Partner- und VC-Dashboards
4. **Figma-Designs nicht implementiert**: Die spezifizierten Figma-Dashboards sind nicht integriert

### Ziel-Architektur

```
matbakh.app/
├── / (Landing Page)
├── /vc/quick (VC Entry Point)
├── /vc/result (VC Ergebnis Dashboard - Figma)
├── /dashboard (Restaurant Dashboard - Figma)
└── /admin/* (Super-Admin nur)
```

## Dashboard-Spezifikationen

### 1. Restaurant Dashboard System (Standard)

**Route**: `/dashboard`  
**Zielgruppe**: Alle angemeldeten Restaurant-Besitzer  
**Quelle**: `docs/Figma-Restaurant Dashboard System-activeate this one please/`

#### Komponenten-Mapping
```typescript
// Hauptkomponenten aus Figma
- DashboardHeader.tsx → Header mit Navigation und User-Info
- DashboardGrid.tsx → Grid-Layout für Widgets
- VisibilityScoreWidget.tsx → Sichtbarkeits-Score
- OrdersRevenueWidget.tsx → Bestellungen & Umsatz
- ReviewsWidget.tsx → Bewertungen-Übersicht
- ReservationsWidget.tsx → Reservierungen
- AnalyticsWidget.tsx → Analytics-Daten
- MarketingWidget.tsx → Marketing-Insights
- LocationOverviewWidget.tsx → Standort-Übersicht
- PerformanceTrendsWidget.tsx → Performance-Trends
```

#### Datenintegration
```typescript
interface RestaurantDashboardData {
  visibilityScore: number;
  orders: OrderMetrics;
  revenue: RevenueMetrics;
  reviews: ReviewMetrics;
  reservations: ReservationMetrics;
  analytics: AnalyticsData;
  marketing: MarketingData;
  location: LocationData;
  trends: TrendData;
}
```

### 2. VisibilityCheck Ergebnis Dashboard

**Route**: `/vc/result`, `/vc/result/dashboard`  
**Zielgruppe**: Nutzer mit VC-Token oder nach VC-Durchführung  
**Quelle**: `docs/Figma-VisibilityCheck-ergebnis-Dashboard/`

#### Komponenten-Mapping
```typescript
// VC-spezifische Komponenten
- DashboardHeader.tsx → VC-Header mit Ergebnis-Info
- VisibilityScoreWidget.tsx → Haupt-VC-Score
- CompetitorMonitoringWidget.tsx → Konkurrenz-Analyse
- AnalyticsWidget.tsx → VC-Analytics
- CallToActionBanner.tsx → Upgrade/Action CTAs
- ReportPreviewModal.tsx → Detailbericht-Vorschau
- PublicDashboardMode.tsx → Öffentlicher Modus
- RestrictedWidget.tsx → Premium-Features
```

#### Token-Integration
```typescript
interface VCResultData {
  token: string;
  score: number;
  confidence: number;
  subscores: VCSubscores;
  recommendations: VCRecommendation[];
  competitorData: CompetitorData;
  reportUrl?: string;
  isPublic: boolean;
}
```

## Technische Implementierung

### 1. Figma-Komponenten Integration

#### Schritt 1: Komponenten-Analyse
```bash
# Analysiere Figma-Komponenten
docs/Figma-Restaurant Dashboard System-activeate this one please/src/components/
docs/Figma-VisibilityCheck-ergebnis-Dashboard/src/components/
```

#### Schritt 2: Komponenten-Port
```typescript
// Neue Dashboard-Struktur
src/
├── pages/
│   ├── dashboard/
│   │   ├── RestaurantDashboard.tsx (Figma Restaurant)
│   │   └── VCResultDashboard.tsx (Figma VC)
│   └── vc/
│       └── VCResult.tsx (Updated für Figma Dashboard)
├── components/
│   ├── dashboard/
│   │   ├── restaurant/ (Figma Restaurant Widgets)
│   │   └── vc/ (Figma VC Widgets)
│   └── figma/ (Shared Figma Components)
```

### 2. Routing-Umstrukturierung

#### App.tsx Updates
```typescript
// Neue Dashboard-Routen
<Route path="/dashboard" element={
  <ProtectedRoute>
    <RestaurantDashboard />
  </ProtectedRoute>
} />

<Route path="/vc/result" element={<VCResultDashboard />} />
<Route path="/vc/result/dashboard" element={<VCResultDashboard />} />

// Admin-Routen nur für Super-Admins
<Route path="/admin/*" element={
  <ProtectedRoute requireRole="super_admin">
    <AdminLayout><Outlet /></AdminLayout>
  </ProtectedRoute>
}>
```

#### AuthContext Updates
```typescript
// Nach Login → Restaurant Dashboard
if (session?.user && event === 'SIGNED_IN') {
  // Redirect nur von Login-Seiten
  if (location.pathname.includes('/login')) {
    navigate('/dashboard', { replace: true });
  }
}
```

### 3. VC-Token System Reparatur

#### Problem-Analyse
```
Aktuell: https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?token=...
Ziel: https://matbakh.app/vc/result?t=...
```

#### VC-Confirm Function Update
```typescript
// supabase/functions/vc-confirm/index.ts
export default async function handler(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  
  // Redirect zu matbakh.app mit Token
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `https://matbakh.app/vc/result?t=${encodeURIComponent(token)}`
    }
  });
}
```

#### VCResult Component Update
```typescript
// src/pages/vc/VCResult.tsx
export function VCResult() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || searchParams.get('token');
  
  // Wenn Token vorhanden → VC Dashboard
  // Sonst → Standard VC Result
  
  if (token) {
    return <VCResultDashboard token={token} />;
  }
  
  return <StandardVCResult />;
}
```

### 4. Datenintegration

#### Restaurant Dashboard APIs
```typescript
// Bestehende APIs nutzen
- /functions/v1/owner-overview → Restaurant-Daten
- /functions/v1/analytics → Analytics-Daten
- /functions/v1/reviews → Bewertungs-Daten
- /functions/v1/reservations → Reservierungs-Daten
```

#### VC Dashboard APIs
```typescript
// VC-spezifische APIs
- /functions/v1/vc-result → VC-Ergebnis-Daten
- /functions/v1/vc-competitors → Konkurrenz-Daten
- /functions/v1/vc-recommendations → Empfehlungen
```

### 5. Cleanup alter Implementierungen

#### Zu entfernende/deaktivierende Komponenten
```typescript
// Alte Dashboard-Komponenten
src/pages/dashboard/OwnerOverview.tsx → ARCHIVIEREN
src/pages/DashboardMain.tsx → ARCHIVIEREN
src/components/dashboard/ (alte Widgets) → ARCHIVIEREN

// Navigation Updates
- Entferne Links zu alten Dashboards
- Update Breadcrumbs
- Update Menü-Strukturen
```

#### Migration-Strategie
```typescript
// 1. Neue Komponenten erstellen
// 2. Routing parallel einrichten
// 3. Feature-Flag für Umschaltung
// 4. Alte Komponenten archivieren
// 5. Cleanup und Optimierung
```

## Performance-Optimierungen

### 1. Code-Splitting
```typescript
// Lazy Loading für Dashboards
const RestaurantDashboard = lazy(() => import('@/pages/dashboard/RestaurantDashboard'));
const VCResultDashboard = lazy(() => import('@/pages/dashboard/VCResultDashboard'));
```

### 2. Widget-Optimierung
```typescript
// Lazy Loading für Widgets
const LazyWidget = ({ component: Component, ...props }) => (
  <Suspense fallback={<LoadingSkeleton />}>
    <Component {...props} />
  </Suspense>
);
```

### 3. Daten-Caching
```typescript
// React Query für Dashboard-Daten
const useRestaurantDashboard = () => {
  return useQuery({
    queryKey: ['restaurant-dashboard'],
    queryFn: fetchRestaurantData,
    staleTime: 5 * 60 * 1000, // 5 Minuten
  });
};
```

## Testing-Strategie

### 1. Unit Tests
- Alle neuen Dashboard-Komponenten
- Widget-Funktionalität
- Token-Verarbeitung
- API-Integration

### 2. Integration Tests
- Dashboard-Routing
- Datenfluss zwischen Komponenten
- VC-Token Flow
- Authentication Flow

### 3. E2E Tests
- Kompletter Login → Dashboard Flow
- VC-Token → Ergebnis Flow
- Navigation zwischen Dashboards
- Responsive Verhalten

## Deployment-Plan

### Phase 1: VC-Token Reparatur (Sofort)
1. VC-Confirm Function reparieren
2. VCResult Component für Token-Handling updaten
3. Deploy und Test

### Phase 2: Restaurant Dashboard (Tag 1)
1. Figma Restaurant Dashboard Komponenten portieren
2. Routing und Navigation updaten
3. Datenintegration implementieren
4. Deploy und Test

### Phase 3: VC Ergebnis Dashboard (Tag 2)
1. Figma VC Dashboard Komponenten portieren
2. VC-spezifische Datenintegration
3. Token-Integration vervollständigen
4. Deploy und Test

### Phase 4: Cleanup (Tag 3)
1. Alte Dashboard-Komponenten archivieren
2. Navigation bereinigen
3. Performance-Optimierungen
4. Finale Tests und Dokumentation

## Monitoring und Metriken

### Dashboard-Performance
- Ladezeiten für beide Dashboards
- Widget-Render-Performance
- API-Response-Zeiten
- Bundle-Größen

### User-Experience
- Dashboard-Nutzung nach Login
- VC-Token Erfolgsrate
- Navigation-Patterns
- Error-Rates

### Business-Metriken
- Dashboard-Engagement
- VC-Conversion nach Dashboard-View
- Feature-Nutzung in Dashboards
- User-Retention