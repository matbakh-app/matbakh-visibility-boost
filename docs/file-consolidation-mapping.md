# 🧹 File Consolidation Mapping Table

## 📊 Redundante/Ähnliche Dateien - Konsolidierungsplan

| Dateiname | Typ | Funktion | Wird importiert von | Ersetzen durch | Status | Aktion |
|-----------|-----|----------|-------------------|----------------|--------|--------|
| **AUTH SYSTEM** |
| `useAuth.ts` (auth/) | Hook | Legacy Auth Hook | Alte Komponenten | `useSafeAuth.ts` | 🔴 Redundant | git mv → Archive |
| `useUnifiedAuth.ts` | Hook | Unified Auth Hook | AuthDebug, Tests | `useSafeAuth.ts` | 🟡 Merge | Merge in useSafeAuth |
| `useSafeAuth.ts` | Hook | Safe Auth Hook | Aktuelle Komponenten | **KEEP** | ✅ Master | - |
| `MigrationAuthProvider.tsx` | Context | Migration Provider | Legacy | `AuthContext.tsx` | 🔴 Redundant | Archive |
| `AuthContext.tsx` | Context | Main Auth Context | App.tsx | **KEEP** | ✅ Master | - |
| `SafeAuthLoader.tsx` | Component | Auth Loader | App.tsx | **KEEP** | ✅ Unique | - |
| **TRANSLATION SYSTEM** |
| `useSafeTranslation.ts` | Hook | Safe i18n Hook | Komponenten | **KEEP** | ✅ Master | - |
| `SafeTranslationLoader.tsx` | Component | i18n Loader | App.tsx | **KEEP** | ✅ Unique | - |
| `LanguageSwitch.tsx` (components/) | Component | Language Toggle | Legacy | `LanguageToggle.tsx` | 🔴 Redundant | git mv → Archive |
| `LanguageToggle.tsx` (header/) | Component | Language Toggle | Header | **KEEP** | ✅ Master | - |
| **CHART/ANALYTICS SYSTEM** |
| `ForecastChart.tsx` | Component | Forecast Chart | Analytics | `TrendChart.tsx` | 🟡 Merge | Merge mit mode prop |
| `TrendChart.tsx` | Component | Trend Chart | Analytics | **KEEP** | ✅ Master | Add forecast mode |
| `TrendChartDemo.tsx` | Component | Demo Component | Dev/Test | `ForecastDemo.tsx` | 🟡 Merge | Merge demos |
| `ForecastDemo.tsx` | Component | Forecast Demo | Dev/Test | **KEEP** | ✅ Master | - |
| `ForecastControls.tsx` | Component | Chart Controls | ForecastChart | Inline in TrendChart | 🟡 Inline | Move to TrendChart |
| `TrendFilters.tsx` | Component | Trend Filters | TrendChart | **KEEP** | ✅ Unique | - |
| `EventControls.tsx` | Component | Event Controls | Analytics | **KEEP** | ✅ Unique | - |
| `ScoreEvolutionChart.tsx` | Component | Score Chart | Score Evolution | `TrendChart.tsx` | 🟡 Merge | Merge mit score mode |
| **FORECAST/ANALYTICS HOOKS** |
| `useForecast.ts` | Hook | Forecast Logic | ForecastChart | **KEEP** | ✅ Master | - |
| `useAnalyticsEvent.ts` | Hook | Analytics Events | Analytics | **KEEP** | ✅ Unique | - |
| **DASHBOARD COMPONENTS** |
| `DashboardGrid.tsx` (dashboard/) | Component | Main Grid | Dashboard | **KEEP** | ✅ Master | - |
| `DashboardGrid.tsx` (figma-*/) | Component | Figma Grid | Figma Demos | Archive | 🔴 Demo | Archive figma/ |
| `AdaptiveDashboardGrid.tsx` | Component | Adaptive Grid | AI Dashboard | **KEEP** | ✅ Unique | - |
| `KpiCard.tsx` | Component | KPI Display | Dashboard | **KEEP** | ✅ Unique | - |
| `KpiGrid.tsx` | Component | KPI Grid | Dashboard | **KEEP** | ✅ Unique | - |
| **VISIBILITY CHECK SYSTEM** |
| `VisibilityCheckPage.tsx` | Component | VC Page | Visibility | **KEEP** | ✅ Master | - |
| `VisibilityResults.tsx` | Component | VC Results | Visibility | **KEEP** | ✅ Master | - |
| `VisibilityResultsEnhanced.tsx` | Component | Enhanced Results | Visibility | Merge in VisibilityResults | 🟡 Merge | Merge features |
| `VisibilityCheckDashboard.tsx` (visibility/) | Component | VC Dashboard | Visibility | **KEEP** | ✅ Master | - |
| `VisibilityCheckDashboard.tsx` (admin/) | Component | Admin VC Dashboard | Admin | **KEEP** | ✅ Different | - |
| **UPLOAD SYSTEM** |
| `UploadManagementDashboard.tsx` | Component | Upload Dashboard | Upload | **KEEP** | ✅ Master | - |
| `UploadPreviewModal.tsx` | Component | Preview Modal | Upload | **KEEP** | ✅ Unique | - |
| `UploadAnalytics.tsx` | Component | Upload Analytics | Upload | **KEEP** | ✅ Unique | - |
| `useUploadManagement.ts` | Hook | Upload Management | Upload | **KEEP** | ✅ Master | - |
| `useUploadHistory.ts` | Hook | Upload History | Upload | **KEEP** | ✅ Unique | - |
| `useUploadAnalytics.ts` | Hook | Upload Analytics | Upload | **KEEP** | ✅ Unique | - |
| **ONBOARDING SYSTEM** |
| `OnboardingLayout.tsx` | Component | Onboarding Layout | Onboarding | **KEEP** | ✅ Master | - |
| `SmartOnboardingWizard.tsx` | Component | Smart Wizard | Onboarding | **KEEP** | ✅ Unique | - |
| `SimpleOnboardingForm.tsx` | Component | Simple Form | Onboarding | **KEEP** | ✅ Alternative | - |
| **PROFILE SYSTEM** |
| `MyProfile.tsx` (Profile/) | Component | Profile Component | Profile | **KEEP** | ✅ Master | - |
| `MyProfile.tsx` (figma-*/) | Component | Figma Profile | Figma Demos | Archive | 🔴 Demo | Archive figma/ |
| `CompanyProfile.tsx` (Profile/) | Component | Company Profile | Profile | **KEEP** | ✅ Master | - |
| `CompanyProfile.tsx` (figma-*/) | Component | Figma Company | Figma Demos | Archive | 🔴 Demo | Archive figma/ |
| **UTILS & HELPERS** |
| `forecast-utils.ts` (lib/forecast/) | Utils | Forecast Utils | Forecast | **KEEP** | ✅ Master | - |
| `forecastEngine.ts` | Utils | Forecast Engine | Forecast | **KEEP** | ✅ Unique | - |
| `event-utils.ts` | Utils | Event Utils | Analytics | **KEEP** | ✅ Unique | - |
| `navigationUtils.ts` | Utils | Navigation Utils | Header | **KEEP** | ✅ Unique | - |
| **MAIN FILES** |
| `main.tsx` | Entry | Main Entry | - | **KEEP** | ✅ Master | - |
| `main.tsx.backup` | Backup | Backup Entry | - | Archive | 🔴 Backup | Archive |
| `App.tsx` | Component | Main App | - | **KEEP** | ✅ Master | - |
| `App.tsx.bak` | Backup | Backup App | - | Archive | 🔴 Backup | Archive |
| **FIGMA DEMOS** |
| `figma-onboarding/*` | Demo | Figma Demos | Demo Routes | Archive | 🔴 Demo | Archive entire folder |
| `figma-restaurant-dashboard/*` | Demo | Figma Demos | Demo Routes | Archive | 🔴 Demo | Archive entire folder |
| `figma-visibility-dashboard/*` | Demo | Figma Demos | Demo Routes | Archive | 🔴 Demo | Archive entire folder |
| `figma-make/*` | Demo | Figma Make | Demo Routes | Archive | 🔴 Demo | Archive entire folder |

## 🎯 Konsolidierungsplan

### Phase 1: Archive & Cleanup (Sofort)
```bash
# Backup Files
git mv src/main.tsx.backup src/archive/main.tsx.backup
git mv src/App.tsx.bak src/archive/App.tsx.bak

# Figma Demo Folders (komplett archivieren)
git mv src/figma-make src/archive/figma-make
git mv src/components/figma-onboarding src/archive/figma-onboarding
git mv src/components/figma-restaurant-dashboard src/archive/figma-restaurant-dashboard
git mv src/components/figma-visibility-dashboard src/archive/figma-visibility-dashboard

# Legacy Auth
git mv src/auth/useAuth.ts src/archive/useAuth.ts
git mv src/auth/MigrationAuthProvider.tsx src/archive/MigrationAuthProvider.tsx

# Redundant Language Components
git mv src/components/LanguageSwitch.tsx src/archive/LanguageSwitch.tsx
```

### Phase 2: Merge Similar Components
```bash
# Chart System Consolidation
# 1. Merge ForecastChart into TrendChart with mode prop
# 2. Merge TrendChartDemo into ForecastDemo
# 3. Inline ForecastControls into TrendChart

# Visibility System Consolidation  
# 1. Merge VisibilityResultsEnhanced into VisibilityResults
```

### Phase 3: Hook Consolidation
```bash
# Auth Hooks - Merge useUnifiedAuth into useSafeAuth
# Keep useSafeAuth as single source of truth
```

### Phase 4: Final Cleanup
```bash
# Remove unused imports
# Update all references
# Test build & functionality
```

## 📈 Erwartete Reduktion

- **Vor Konsolidierung:** ~400+ Dateien in src/
- **Nach Konsolidierung:** ~300 Dateien in src/
- **Archiviert:** ~100 Demo/Legacy Dateien
- **Wartbarkeit:** +50% durch klare Struktur

## ✅ Zielstruktur

```
src/
├── components/
│   ├── analytics/
│   │   ├── TrendChart.tsx          ← ForecastChart + ScoreEvolution
│   │   ├── ForecastDemo.tsx        ← Alle Demos
│   │   └── EventControls.tsx
│   ├── auth/
│   │   ├── AuthDebugInfo.tsx
│   │   └── ProtectedRoute.tsx
│   └── dashboard/
│       ├── DashboardGrid.tsx       ← Einzige Version
│       └── KpiCard.tsx
├── hooks/
│   ├── useSafeAuth.ts              ← Einheitlich
│   ├── useForecast.ts
│   └── useSafeTranslation.ts
├── contexts/
│   └── AuthContext.tsx             ← Nur noch dieser
└── archive/                        ← Alle Legacy/Demo Files
```

## 🚨 Wichtige Hinweise

1. **Keine Referenz brechen** - Alle Änderungen mit git mv
2. **Tests aktualisieren** - Import-Pfade anpassen
3. **Schrittweise vorgehen** - Phase für Phase
4. **Backup erstellen** - Vor jeder Phase
5. **Build testen** - Nach jeder Änderung