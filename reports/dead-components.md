# Dead Component Detection Report

**Generated:** 2025-09-14  
**Total Components Analyzed:** 860  
**Dead Components Found:** 228

## 📊 Executive Summary

This report identifies components that appear to be no longer used in the codebase. Components are classified by risk level to help prioritize cleanup efforts.

### Risk Distribution
- **Critical Risk:** 2 components
- **High Risk:** 24 components  
- **Medium Risk:** 80 components
- **Low Risk:** 122 components

### Type Distribution
- **Pages:** 1
- **Components:** 171
- **Hooks:** 21
- **Services:** 3
- **Contexts:** 0
- **Utilities:** 28

## 🚨 Critical Risk Components

### forecasting-engine

- **File:** `src/services/forecasting-engine.ts`
- **Type:** Service
- **Size:** 13KB
- **Last Modified:** 2025-09-14
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 1 imports  
**Exports:** ForecastRange, TrendDirection, ForecastPoint, TrendAnalysis, ForecastResult, ForecastingEngine



---

### ProfileService

- **File:** `src/services/ProfileService.ts`
- **Type:** Service
- **Size:** 3KB
- **Last Modified:** 2025-09-14
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 2 imports  
**Exports:** ProfileService



---

## ⚠️ High Risk Components

### DashboardBuilder

- **File:** `src/components/dashboard/DashboardBuilder.tsx`
- **Type:** Component
- **Size:** 21KB
- **Last Modified:** 2025-09-05
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 11 imports  
**Exports:** DashboardBuilder



---

### AuthModal

- **File:** `src/components/auth/AuthModal.tsx`
- **Type:** Component
- **Size:** 15KB
- **Last Modified:** 2025-08-27
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 14 imports  
**Exports:** AuthModal



---

### useS3FileAccess

- **File:** `src/hooks/useS3FileAccess.ts`
- **Type:** Hook
- **Size:** 12KB
- **Last Modified:** 2025-09-01
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 2 imports  
**Exports:** SecureFileUrlOptions, SecureFileUrlResult, UseS3FileAccessOptions, UseS3FileAccessReturn, useS3FileAccess



---

### useDashboard

- **File:** `src/hooks/useDashboard.ts`
- **Type:** Hook
- **Size:** 12KB
- **Last Modified:** 2025-09-05
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 2 imports  
**Exports:** useDashboards, useDashboard, useDashboardTemplates, useDashboardAnalytics, useDashboardMutations, useVisualization, useDataQuery, useDashboardBuilder



---

### MigrationAuthProvider

- **File:** `src/archive/legacy-auth/MigrationAuthProvider.tsx`
- **Type:** Component
- **Size:** 11KB
- **Last Modified:** 2025-08-30
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 5 imports  
**Exports:** MigrationAuthProvider, useMigrationAuth, UnifiedAuthProvider



---

### useAvatar

- **File:** `src/hooks/useAvatar.ts`
- **Type:** Hook
- **Size:** 11KB
- **Last Modified:** 2025-09-01
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 1 imports  
**Exports:** AvatarUploadOptions, UseAvatarOptions, UseAvatarReturn, useAvatar



---

### useUploadHistory

- **File:** `src/hooks/useUploadHistory.ts`
- **Type:** Hook
- **Size:** 11KB
- **Last Modified:** 2025-08-31
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 2 imports  
**Exports:** UploadHistoryItem, UseUploadHistoryOptions, UseUploadHistoryReturn, useUploadHistory



---

### GoogleOAuthManager

- **File:** `src/components/onboarding/GoogleOAuthManager.tsx`
- **Type:** Component
- **Size:** 9KB
- **Last Modified:** 2025-08-24
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 7 imports  
**Exports:** GoogleOAuthManager



---

### AddonServiceEditModal

- **File:** `src/components/admin/AddonServiceEditModal.tsx`
- **Type:** Component
- **Size:** 8KB
- **Last Modified:** 2025-08-24
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 10 imports  
**Exports:** AddonServiceEditModal



---

### useBusinessContactData

- **File:** `src/hooks/useBusinessContactData.ts`
- **Type:** Hook
- **Size:** 7KB
- **Last Modified:** 2025-08-24
- **Has Tests:** ❌ No
- **Static Hints:** ✅ No

**Reasons for Detection:**
- No incoming imports
- Not a route component
- Not Kiro-relevant
- No tests found

**Dependencies:** 4 imports  
**Exports:** useBusinessContactData



---

## 📋 All Dead Components

| Risk | Component | Type | Size | Last Modified | Reasons |
|------|-----------|------|------|---------------|---------|
| 🔴 critical | **forecasting-engine** | Service | 13KB | 2025-09-14 | No incoming imports, Not a route component |
| 🔴 critical | **ProfileService** | Service | 3KB | 2025-09-14 | No incoming imports, Not a route component |
| 🟠 high | **DashboardBuilder** | Component | 21KB | 2025-09-05 | No incoming imports, Not a route component |
| 🟠 high | **AuthModal** | Component | 15KB | 2025-08-27 | No incoming imports, Not a route component |
| 🟠 high | **useS3FileAccess** | Hook | 12KB | 2025-09-01 | No incoming imports, Not a route component |
| 🟠 high | **useDashboard** | Hook | 12KB | 2025-09-05 | No incoming imports, Not a route component |
| 🟠 high | **MigrationAuthProvider** | Component | 11KB | 2025-08-30 | No incoming imports, Not a route component |
| 🟠 high | **useAvatar** | Hook | 11KB | 2025-09-01 | No incoming imports, Not a route component |
| 🟠 high | **useUploadHistory** | Hook | 11KB | 2025-08-31 | No incoming imports, Not a route component |
| 🟠 high | **GoogleOAuthManager** | Component | 9KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **AddonServiceEditModal** | Component | 8KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **useBusinessContactData** | Hook | 7KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **useRecommendations** | Hook | 7KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟠 high | **useDashboardData** | Hook | 6KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **useSubCategoriesWithCrossTagsNew** | Hook | 5KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **useFilePreview** | Hook | 5KB | 2025-08-31 | No incoming imports, Not a route component |
| 🟠 high | **useAuth** | Component | 4KB | 2025-08-30 | No incoming imports, Not a route component |
| 🟠 high | **GoogleOAuthCallback** | Component | 4KB | 2025-08-28 | No incoming imports, Not a route component |
| 🟠 high | **useEnhancedVisibilityCheck** | Hook | 4KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **useRealtimeConnection** | Hook | 3KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **useKpiSummary** | Hook | 3KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **useNewServicePackages** | Component | 3KB | 2025-09-14 | No incoming imports, Not a route component |
| 🟠 high | **VisibilityCheckService** | Service | 1KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟠 high | **SafeAuthLoader** | Component | 1KB | 2025-09-08 | No incoming imports, Not a route component |
| 🟠 high | **usePartnerProfile** | Hook | 1KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟠 high | **index** | Hook | 1KB | 2025-08-31 | No incoming imports, Not a route component |
| 🟡 medium | **VCDataManagementFlow** | Component | 27KB | 2025-09-04 | No incoming imports, Not a route component |
| 🟡 medium | **file-input** | Component | 22KB | 2025-09-01 | No incoming imports, Not a route component |
| 🟡 medium | **upload-management** | Component | 22KB | 2025-09-01 | No incoming imports, Not a route component |
| 🟡 medium | **ScoreEvolutionChart** | Component | 19KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **documentation-generator** | Utility | 16KB | 2025-09-14 | No incoming imports, Not a route component |
| 🟡 medium | **refactoring-rules-engine** | Utility | 16KB | 2025-09-14 | No incoming imports, Not a route component |
| 🟡 medium | **upload-demo** | Component | 15KB | 2025-09-01 | No incoming imports, Not a route component |
| 🟡 medium | **VisibilityCheckOnboarding** | Component | 14KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **architecture-scanner** | Utility | 13KB | 2025-09-14 | No incoming imports, Not a route component |
| 🟡 medium | **MultiRegionBenchmark** | Component | 12KB | 2025-09-08 | No incoming imports, Not a route component |
| 🟡 medium | **GoalRecommendationsWidget** | Component | 12KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **ForecastDemo** | Component | 11KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **FigmaTextDemo** | Component | 11KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **recommendationFlow** | Utility | 10KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **DesignSystemDemo** | Component | 9KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **DesignSystemDemo** | Component | 9KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **FacebookConversionsConfig** | Component | 9KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **forecastEngine** | Utility | 9KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **QualityChecklist** | Component | 8KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **QualityChecklist** | Component | 8KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **score-evolution** | Type | 8KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **CookieConsentBanner** | Component | 8KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **forecastUtils** | Utility | 8KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **TrendAnalyticsDemo** | Component | 8KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **BenchmarkComparison** | Component | 8KB | 2025-09-08 | No incoming imports, Not a route component |
| 🟡 medium | **VisibilityCheckDashboard** | Component | 7KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **useDiversifiedCategorySelection** | Hook | 7KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **ConsentBanner** | Component | 6KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **rls-smoke-tests** | Utility | 6KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **risk-matrix** | Utility | 6KB | 2025-09-14 | No incoming imports, Not a route component |
| 🟡 medium | **PackageEditModal** | Component | 6KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **OwnerOverview** | Page | 5KB | 2025-08-27 | No incoming imports, Not a route component |
| 🟡 medium | **useFacebookEventTemplates** | Hook | 5KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **OnboardingLayout** | Component | 5KB | 2025-08-28 | No incoming imports, Not a route component |
| 🟡 medium | **performanceMonitor** | Utility | 5KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **index** | Component | 5KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **useI18nDebug** | Hook | 5KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **AuthModeSelector** | Component | 5KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **QuickVerifyMode** | Component | 5KB | 2025-08-27 | No incoming imports, Not a route component |
| 🟡 medium | **useSmartCategorySelection** | Hook | 4KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **TrendChartDemo** | Component | 4KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **ProfileLayout** | Component | 4KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **StepCard** | Component | 4KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **SimpleApp** | Component | 4KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **chart-utils** | Utility | 4KB | 2025-09-08 | No incoming imports, Not a route component |
| 🟡 medium | **setupTests** | Component | 4KB | 2025-09-14 | No incoming imports, Not a route component |
| 🟡 medium | **onboardingHelpers** | Utility | 4KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **InvisibleModeToggle** | Component | 3KB | 2025-08-26 | No incoming imports, Not a route component |
| 🟡 medium | **OnboardingGate** | Component | 3KB | 2025-08-28 | No incoming imports, Not a route component |
| 🟡 medium | **kv_store** | Component | 3KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟡 medium | **kv_store** | Component | 3KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟡 medium | **env-check** | Utility | 2KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **ModeNudge** | Component | 2KB | 2025-08-26 | No incoming imports, Not a route component |
| 🟡 medium | **TimeSelector** | Component | 2KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **TimeSelector** | Component | 2KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **GoogleRegisterButton** | Component | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **Profile.stories** | Component | 2KB | 2025-09-01 | No incoming imports, Not a route component |
| 🟡 medium | **useI18nValidation** | Hook | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **toggle-group** | Component | 2KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **index** | Utility | 2KB | 2025-09-14 | No incoming imports, Not a route component |
| 🟡 medium | **index** | Component | 2KB | 2025-09-01 | No incoming imports, Not a route component |
| 🟡 medium | **breadcrumb** | Component | 2KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **OAuthErrorBanner** | Component | 1KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **ProfileRoutes-v1** | Component | 1KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **ImageWithFallback** | Component | 1KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **ImageWithFallback** | Component | 1KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **ImageWithFallback** | Component | 1KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟡 medium | **SafeTranslationLoader** | Component | 1KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **AuthDebugInfo** | Component | 1KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **index** | Component | 1KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **index** | Component | 1KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟡 medium | **index** | Component | 1KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟡 medium | **ui** | Type | 0KB | 2025-08-26 | No incoming imports, Not a route component |
| 🟡 medium | **useSyncGa4** | Hook | 0KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **useSyncGmb** | Hook | 0KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟡 medium | **index** | Component | 0KB | 2025-08-26 | No incoming imports, Not a route component |
| 🟡 medium | **info** | Utility | 0KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟡 medium | **info** | Utility | 0KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟡 medium | **index** | Utility | 0KB | 2025-09-07 | No incoming imports, Not a route component |
| 🟡 medium | **DevelopmentTestingCard** | Component | 0KB | 2025-08-24 | No incoming imports, Not a route component |
| 🟢 low | **sidebar** | Component | 23KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **sidebar** | Component | 21KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **sidebar** | Component | 21KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **sidebar** | Component | 21KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **VisibilityResultsEnhanced** | Component | 20KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **file-preview-modal** | Component | 15KB | 2025-09-01 | No incoming imports, Not a route component |
| 🟢 low | **webWorkerManager** | Utility | 14KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **webWorkerManager** | Utility | 14KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **FigmaTextDemo** | Component | 11KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **cacheManager** | Utility | 10KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **cacheManager** | Utility | 10KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **DesignSystemDemo** | Component | 9KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **DesignSystemDemo** | Component | 9KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **QualityChecklist** | Component | 8KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **QualityChecklist** | Component | 8KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **KpiGrid** | Component | 8KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **menubar** | Component | 8KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **menubar** | Component | 8KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **menubar** | Component | 8KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **context-menu** | Component | 8KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **context-menu** | Component | 8KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **context-menu** | Component | 8KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **menubar** | Component | 8KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **facebookEventHelpers** | Utility | 8KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **context-menu** | Component | 7KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **EnhancedBusinessContactStep** | Component | 7KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **navigation-menu** | Component | 7KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **navigation-menu** | Component | 7KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **navigation-menu** | Component | 7KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **ActionModal** | Component | 6KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **SmartQuestionField** | Component | 6KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **carousel** | Component | 6KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **CampaignReport** | Component | 6KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **carousel** | Component | 5KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **carousel** | Component | 5KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **carousel** | Component | 5KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **SmartOnboardingWizard** | Component | 5KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **PromoCodeSection** | Component | 5KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **navigation-menu** | Component | 5KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **InstagramCandidatePicker** | Component | 5KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **RedeemCodeForm** | Component | 5KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **toast** | Component | 5KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **VCResultInvisible** | Component | 5KB | 2025-08-27 | No incoming imports, Not a route component |
| 🟢 low | **DynamicQuestionField** | Component | 4KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **onboardingGuard** | Component | 4KB | 2025-09-12 | No incoming imports, Not a route component |
| 🟢 low | **StepCard** | Component | 4KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **drawer** | Component | 4KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **drawer** | Component | 4KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **drawer** | Component | 4KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **performanceMonitor** | Utility | 4KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **FacebookTestComponent** | Component | 4KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **QuickActions** | Component | 4KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **todoGenerator** | Utility | 4KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **HowItWorksSection** | Component | 3KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **score-history** | Type | 3KB | 2025-09-07 | Not a route component, Not Kiro-relevant |
| 🟢 low | **drawer** | Component | 3KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **calendar** | Component | 3KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **calendar** | Component | 3KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **calendar** | Component | 3KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **pagination** | Component | 3KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **pagination** | Component | 3KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **pagination** | Component | 3KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **pagination** | Component | 3KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **breadcrumb** | Component | 3KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **TrustSection** | Component | 3KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **calendar** | Component | 3KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **navigationValidator** | Utility | 3KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **CheckoutButton** | Component | 2KB | 2025-07-02 | No incoming imports, Not a route component |
| 🟢 low | **breadcrumb** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **breadcrumb** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **TimeSelector** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **TimeSelector** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **pdfReport** | Utility | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **normalizeSocialUrls** | Utility | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **TestimonialSection** | Component | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **input-otp** | Component | 2KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **accordion** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **accordion** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **accordion** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **resizable** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **resizable** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **resizable** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **SocialMediaChart** | Component | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **accordion** | Component | 2KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **VisibilityCheckPage** | Component | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **toggle-group** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **toggle-group** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **toggle-group** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **GA4Chart** | Component | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **toggle-group** | Component | 2KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **resizable** | Component | 2KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **scroll-area** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **scroll-area** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **scroll-area** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **scroll-area** | Component | 2KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **GMBChart** | Component | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **breadcrumb** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **QuickActionButton** | Component | 2KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **hover-card** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **hover-card** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **hover-card** | Component | 2KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **radio-group** | Component | 1KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **radio-group** | Component | 1KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **radio-group** | Component | 1KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **radio-group** | Component | 1KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **SeoHead** | Component | 1KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **VisibilityCheckSection** | Component | 1KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **hover-card** | Component | 1KB | 2025-06-30 | No incoming imports, Not a route component |
| 🟢 low | **ImageWithFallback** | Component | 1KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **ImageWithFallback** | Component | 1KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **ImageWithFallback** | Component | 1KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **QuotaWidget** | Component | 1KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **ForecastChart-legacy** | Component | 1KB | 2025-09-08 | No incoming imports, Not a route component |
| 🟢 low | **businessPartner** | Type | 1KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **DashboardLayout** | Component | 1KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **timeGreeting** | Utility | 0KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **aspect-ratio** | Component | 0KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **aspect-ratio** | Component | 0KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **aspect-ratio** | Component | 0KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **DevelopmentTestingCard** | Component | 0KB | 2025-08-05 | No incoming imports, Not a route component |
| 🟢 low | **resources** | Utility | 0KB | 2025-08-03 | No incoming imports, Not a route component |
| 🟢 low | **aspect-ratio** | Component | 0KB | 2025-06-30 | No incoming imports, Not a route component |


## 🧹 Cleanup Recommendations

### Safe to Remove (Low Risk)
122 components can likely be removed safely:

- `src/components/ui/sidebar.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/sidebar.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/sidebar.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/sidebar.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/components/visibility/VisibilityResultsEnhanced.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/components/ui/file-preview-modal.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/webWorkerManager.ts` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/webWorkerManager.ts` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/FigmaTextDemo.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/restaurantdashboardsystem/utils/cacheManager.ts` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckdashboard/utils/cacheManager.ts` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/DesignSystemDemo.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/DesignSystemDemo.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/QualityChecklist.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/QualityChecklist.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/components/dashboard/KpiGrid.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/menubar.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckdashboard/components/ui/menubar.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/visibilitycheckonboarding/components/ui/menubar.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found
- `src/archive/figma-demos/figma-make/restaurantdashboardsystem/components/ui/context-menu.tsx` - No incoming imports, Not a route component, Not Kiro-relevant, No tests found


### Requires Review (Medium+ Risk)
106 components require manual review before removal.

### Cleanup Script
A cleanup script has been generated: `scripts/cleanup-dead-components.sh`

## 📈 Impact Analysis

### Disk Space Savings
- **Total Size:** 1207KB
- **Low Risk:** 557KB (safe to remove)

### Maintenance Reduction
Removing dead components will:
- Reduce cognitive load for developers
- Improve build times
- Simplify dependency management
- Reduce security surface area

## ⚠️ Important Notes

1. **Manual Verification Required:** Always verify components are truly unused before deletion
2. **Git History:** Consider keeping git history for reference
3. **Gradual Removal:** Remove components incrementally to avoid issues
4. **Test After Removal:** Run full test suite after each removal

---

*This report was automatically generated. Always verify findings before taking action.*
