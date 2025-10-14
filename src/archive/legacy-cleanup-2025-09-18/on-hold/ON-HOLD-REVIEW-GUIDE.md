# On-Hold Components Review Guide

Generated: 2025-09-18T10:55:32.459Z

## Summary

- **Total Components**: 283
- **Risk Levels**: medium: 40, high: 213, critical: 30
- **Origins**: unknown: 246, supabase: 36, lovable: 1

## Common Issues

- Complex component may have hidden dependencies

## Global Recommendations

- 🚨 30 critical components require immediate attention before any migration
- ⚠️ 213 high-risk components need thorough testing and migration planning
- 🔗 41 components have backend dependencies - create migration paths first
- 🔀 61 components handle routes - ensure Kiro alternatives exist
- 📋 Review components in priority order (highest priority first)
- 🧪 Create comprehensive test coverage for each component before migration
- 📖 Document current behavior before making any changes
- 🔄 Consider gradual migration approach for complex components

## Components (Priority Order)


### src/lib/architecture-scanner/enhanced-risk-assessor.ts (Priority: 787.146)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 33 routes
- Large component (600 lines)

#### Potential Impact
- ⚠️ Active route '/middleware' without Kiro alternative
- ⚠️ Active route '/contexts/AuthContext' without Kiro alternative
- ⚠️ Active route '/contexts/ErrorBoundary' without Kiro alternative
- ⚠️ Active route '/services/auth' without Kiro alternative
- ⚠️ Active route '/lib/auth' without Kiro alternative
- ⚠️ Active route '/utils/auth' without Kiro alternative
- ⚠️ Active route '/auth/' without Kiro alternative
- ⚠️ Active route '/api/' without Kiro alternative
- ⚠️ Active route '/pages/dev/' without Kiro alternative
- ⚠️ Active route '/pages/test' without Kiro alternative
- ⚠️ Active route '/components/debug' without Kiro alternative
- ⚠️ Active route '/components/legacy' without Kiro alternative
- ⚠️ Active route '/login' without Kiro alternative
- ⚠️ Active route '/auth/login' without Kiro alternative
- ⚠️ Active route '/register' without Kiro alternative
- ⚠️ Active route '/auth/register' without Kiro alternative
- ⚠️ Active route '/dashboard/old' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/upload/legacy' without Kiro alternative
- ⚠️ Active route '/upload' without Kiro alternative
- ⚠️ Active route '/vc/old' without Kiro alternative
- ⚠️ Active route '/vc/quick' without Kiro alternative
- ⚠️ Active route '/reports/legacy' without Kiro alternative
- ⚠️ Active route '/reports' without Kiro alternative
- ⚠️ Active route '/admin/old' without Kiro alternative
- ⚠️ Active route '/admin' without Kiro alternative
- ⚠️ Active route '/onboarding/legacy' without Kiro alternative
- ⚠️ Active route '/onboarding' without Kiro alternative
- ⚠️ Active route '/pages/auth' without Kiro alternative
- ⚠️ Active route '/pages/' without Kiro alternative
- ⚠️ Active route '/dev/' without Kiro alternative
- ⚠️ Active route '/debug' without Kiro alternative
- ⚠️ Active route '/test' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create Kiro alternative for route /middleware
- 🔧 Create Kiro alternative for route /contexts/AuthContext
- 🔧 Create Kiro alternative for route /contexts/ErrorBoundary
- 🔧 Create Kiro alternative for route /services/auth
- 🔧 Create Kiro alternative for route /lib/auth
- 🔧 Create Kiro alternative for route /utils/auth
- 🔧 Create Kiro alternative for route /auth/
- 🔧 Create Kiro alternative for route /api/
- 🔧 Create Kiro alternative for route /pages/dev/
- 🔧 Create Kiro alternative for route /pages/test
- 🔧 Create Kiro alternative for route /components/debug
- 🔧 Create Kiro alternative for route /components/legacy
- 🔧 Create Kiro alternative for route /login
- 🔧 Create Kiro alternative for route /auth/login
- 🔧 Create Kiro alternative for route /register
- 🔧 Create Kiro alternative for route /auth/register
- 🔧 Create Kiro alternative for route /dashboard/old
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /upload/legacy
- 🔧 Create Kiro alternative for route /upload
- 🔧 Create Kiro alternative for route /vc/old
- 🔧 Create Kiro alternative for route /vc/quick
- 🔧 Create Kiro alternative for route /reports/legacy
- 🔧 Create Kiro alternative for route /reports
- 🔧 Create Kiro alternative for route /admin/old
- 🔧 Create Kiro alternative for route /admin
- 🔧 Create Kiro alternative for route /onboarding/legacy
- 🔧 Create Kiro alternative for route /onboarding
- 🔧 Create Kiro alternative for route /pages/auth
- 🔧 Create Kiro alternative for route /pages/
- 🔧 Create Kiro alternative for route /dev/
- 🔧 Create Kiro alternative for route /debug
- 🔧 Create Kiro alternative for route /test
- 🔧 Break down into smaller components before migration
- 🔧 Verify admin capabilities are preserved

---


### src/components/dashboard/KpiGrid.tsx (Priority: 468.618)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 19 routes
- Large component (230 lines)

#### Potential Impact
- ⚠️ Active route '/dashboard/ai-optimization?kpi=impressions' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=ctr' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=profileViews' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=calls' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=websiteClicks' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=directionsRequests' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=photoViews' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=postViews' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=sessions' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=bounceRate' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=avgSessionDuration' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=pageViews' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=conversions' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=conversionRate' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=newUsers' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=returningUsers' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=instagramFollowers' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=facebookLikes' without Kiro alternative
- ⚠️ Active route '/dashboard/ai-optimization?kpi=socialEngagement' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=impressions
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=ctr
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=profileViews
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=calls
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=websiteClicks
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=directionsRequests
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=photoViews
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=postViews
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=sessions
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=bounceRate
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=avgSessionDuration
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=pageViews
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=conversions
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=conversionRate
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=newUsers
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=returningUsers
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=instagramFollowers
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=facebookLikes
- 🔧 Create Kiro alternative for route /dashboard/ai-optimization?kpi=socialEngagement
- 🔧 Break down into smaller components before migration

---


### src/components/navigation/NavigationConfig.ts (Priority: 410.741)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 16 routes
- Large component (201 lines)

#### Potential Impact
- ⚠️ Active route '/services' without Kiro alternative
- ⚠️ Active route '/angebote' without Kiro alternative
- ⚠️ Active route '/packages' without Kiro alternative
- ⚠️ Active route '/contact' without Kiro alternative
- ⚠️ Active route '/kontakt' without Kiro alternative
- ⚠️ Active route '/impressum' without Kiro alternative
- ⚠️ Active route '/imprint' without Kiro alternative
- ⚠️ Active route '/datenschutz' without Kiro alternative
- ⚠️ Active route '/privacy' without Kiro alternative
- ⚠️ Active route '/agb' without Kiro alternative
- ⚠️ Active route '/terms' without Kiro alternative
- ⚠️ Active route '/nutzung' without Kiro alternative
- ⚠️ Active route '/usage' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/partner/dashboard' without Kiro alternative
- ⚠️ Active route '/admin' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create Kiro alternative for route /services
- 🔧 Create Kiro alternative for route /angebote
- 🔧 Create Kiro alternative for route /packages
- 🔧 Create Kiro alternative for route /contact
- 🔧 Create Kiro alternative for route /kontakt
- 🔧 Create Kiro alternative for route /impressum
- 🔧 Create Kiro alternative for route /imprint
- 🔧 Create Kiro alternative for route /datenschutz
- 🔧 Create Kiro alternative for route /privacy
- 🔧 Create Kiro alternative for route /agb
- 🔧 Create Kiro alternative for route /terms
- 🔧 Create Kiro alternative for route /nutzung
- 🔧 Create Kiro alternative for route /usage
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /partner/dashboard
- 🔧 Create Kiro alternative for route /admin
- 🔧 Break down into smaller components before migration
- 🔧 Verify admin capabilities are preserved

---


### src/lib/architecture-scanner/legacy-component-detector.ts (Priority: 389.535)

- **Risk Level**: critical
- **Origin**: supabase
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Has 3 backend dependencies
- Used in 11 routes
- Large component (468 lines)

#### Potential Impact
- ⚠️ Active lambda dependency 'aws-lambda' without migration path
- ⚠️ Active route '/auth/login' without Kiro alternative
- ⚠️ Active route '/auth/register' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/upload' without Kiro alternative
- ⚠️ Active route '/vc/quick' without Kiro alternative
- ⚠️ Active route '/reports' without Kiro alternative
- ⚠️ Active route '/pages/' without Kiro alternative
- ⚠️ Active route '/routes/' without Kiro alternative
- ⚠️ Active route '/auth/' without Kiro alternative
- ⚠️ Active route '/api/' without Kiro alternative
- ⚠️ Active route '/middleware' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Authentication logic may affect user access
- ⚠️ Database operations may affect data integrity
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create migration path for aws-lambda dependency
- 🔧 Create Kiro alternative for route /auth/login
- 🔧 Create Kiro alternative for route /auth/register
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /upload
- 🔧 Create Kiro alternative for route /vc/quick
- 🔧 Create Kiro alternative for route /reports
- 🔧 Create Kiro alternative for route /pages/
- 🔧 Create Kiro alternative for route /routes/
- 🔧 Create Kiro alternative for route /auth/
- 🔧 Create Kiro alternative for route /api/
- 🔧 Create Kiro alternative for route /middleware
- 🔧 Break down into smaller components before migration
- 🔧 Verify auth flow compatibility
- 🔧 Test database operations thoroughly
- 🔧 Update API endpoints and test integration

---


### src/components/header/navigationUtils.ts (Priority: 358.136)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 14 routes

#### Potential Impact
- ⚠️ Active route '/kontakt' without Kiro alternative
- ⚠️ Active route '/contact' without Kiro alternative
- ⚠️ Active route '/impressum' without Kiro alternative
- ⚠️ Active route '/imprint' without Kiro alternative
- ⚠️ Active route '/datenschutz' without Kiro alternative
- ⚠️ Active route '/privacy' without Kiro alternative
- ⚠️ Active route '/agb' without Kiro alternative
- ⚠️ Active route '/terms' without Kiro alternative
- ⚠️ Active route '/nutzung' without Kiro alternative
- ⚠️ Active route '/usage' without Kiro alternative
- ⚠️ Active route '/b2c' without Kiro alternative
- ⚠️ Active route '/b2c-en' without Kiro alternative
- ⚠️ Active route '/angebote' without Kiro alternative
- ⚠️ Active route '/packages' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /kontakt
- 🔧 Create Kiro alternative for route /contact
- 🔧 Create Kiro alternative for route /impressum
- 🔧 Create Kiro alternative for route /imprint
- 🔧 Create Kiro alternative for route /datenschutz
- 🔧 Create Kiro alternative for route /privacy
- 🔧 Create Kiro alternative for route /agb
- 🔧 Create Kiro alternative for route /terms
- 🔧 Create Kiro alternative for route /nutzung
- 🔧 Create Kiro alternative for route /usage
- 🔧 Create Kiro alternative for route /b2c
- 🔧 Create Kiro alternative for route /b2c-en
- 🔧 Create Kiro alternative for route /angebote
- 🔧 Create Kiro alternative for route /packages

---


### src/hooks/useDashboard.ts (Priority: 341.928)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 12 routes
- Large component (423 lines)
- High function count (19 functions)

#### Potential Impact
- ⚠️ Active route '/dashboards?${params.toString()}' without Kiro alternative
- ⚠️ Active route '/dashboards/${id}' without Kiro alternative
- ⚠️ Active route '/dashboards' without Kiro alternative
- ⚠️ Active route '/dashboards/${id}/clone' without Kiro alternative
- ⚠️ Active route '/dashboards/${id}/share' without Kiro alternative
- ⚠️ Active route '/dashboards/${id}/analytics?${params.toString()}' without Kiro alternative
- ⚠️ Active route '/dashboards/templates?${params.toString()}' without Kiro alternative
- ⚠️ Active route '/dashboards/templates/${templateId}/create' without Kiro alternative
- ⚠️ Active route '/visualizations/render' without Kiro alternative
- ⚠️ Active route '/visualizations/export' without Kiro alternative
- ⚠️ Active route '/data/query' without Kiro alternative
- ⚠️ Active route '/data/sources' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create Kiro alternative for route /dashboards?${params.toString()}
- 🔧 Create Kiro alternative for route /dashboards/${id}
- 🔧 Create Kiro alternative for route /dashboards
- 🔧 Create Kiro alternative for route /dashboards/${id}/clone
- 🔧 Create Kiro alternative for route /dashboards/${id}/share
- 🔧 Create Kiro alternative for route /dashboards/${id}/analytics?${params.toString()}
- 🔧 Create Kiro alternative for route /dashboards/templates?${params.toString()}
- 🔧 Create Kiro alternative for route /dashboards/templates/${templateId}/create
- 🔧 Create Kiro alternative for route /visualizations/render
- 🔧 Create Kiro alternative for route /visualizations/export
- 🔧 Create Kiro alternative for route /data/query
- 🔧 Create Kiro alternative for route /data/sources
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Update API endpoints and test integration

---


### src/components/onboarding/OnboardingGate.tsx (Priority: 332.932)

- **Risk Level**: critical
- **Origin**: supabase
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Has 2 backend dependencies
- Used in 10 routes

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Active route '/_kiro' without Kiro alternative
- ⚠️ Active route '/vc/quick' without Kiro alternative
- ⚠️ Active route '/vc/result' without Kiro alternative
- ⚠️ Active route '/auth' without Kiro alternative
- ⚠️ Active route '/login' without Kiro alternative
- ⚠️ Active route '/register' without Kiro alternative
- ⚠️ Active route '/legal' without Kiro alternative
- ⚠️ Active route '/pricing' without Kiro alternative
- ⚠️ Active route '/services' without Kiro alternative
- ⚠️ Active route '/onboarding' without Kiro alternative
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Create Kiro alternative for route /_kiro
- 🔧 Create Kiro alternative for route /vc/quick
- 🔧 Create Kiro alternative for route /vc/result
- 🔧 Create Kiro alternative for route /auth
- 🔧 Create Kiro alternative for route /login
- 🔧 Create Kiro alternative for route /register
- 🔧 Create Kiro alternative for route /legal
- 🔧 Create Kiro alternative for route /pricing
- 🔧 Create Kiro alternative for route /services
- 🔧 Create Kiro alternative for route /onboarding
- 🔧 Verify auth flow compatibility

---


### src/layouts/LegalLayout.tsx (Priority: 305.606)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 10 routes

#### Potential Impact
- ⚠️ Active route '/datenschutz' without Kiro alternative
- ⚠️ Active route '/impressum' without Kiro alternative
- ⚠️ Active route '/agb' without Kiro alternative
- ⚠️ Active route '/nutzung' without Kiro alternative
- ⚠️ Active route '/kontakt' without Kiro alternative
- ⚠️ Active route '/privacy' without Kiro alternative
- ⚠️ Active route '/imprint' without Kiro alternative
- ⚠️ Active route '/terms' without Kiro alternative
- ⚠️ Active route '/usage' without Kiro alternative
- ⚠️ Active route '/contact' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /datenschutz
- 🔧 Create Kiro alternative for route /impressum
- 🔧 Create Kiro alternative for route /agb
- 🔧 Create Kiro alternative for route /nutzung
- 🔧 Create Kiro alternative for route /kontakt
- 🔧 Create Kiro alternative for route /privacy
- 🔧 Create Kiro alternative for route /imprint
- 🔧 Create Kiro alternative for route /terms
- 🔧 Create Kiro alternative for route /usage
- 🔧 Create Kiro alternative for route /contact

---


### src/components/onboarding/OnboardingLayout.tsx (Priority: 305.183)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 10 routes

#### Potential Impact
- ⚠️ Active route '/onboarding' without Kiro alternative
- ⚠️ Active route '/onboarding/restaurant' without Kiro alternative
- ⚠️ Active route '/onboarding/brand' without Kiro alternative
- ⚠️ Active route '/onboarding/menu' without Kiro alternative
- ⚠️ Active route '/onboarding/channels' without Kiro alternative
- ⚠️ Active route '/onboarding/quickwins' without Kiro alternative
- ⚠️ Active route '/onboarding/baseline' without Kiro alternative
- ⚠️ Active route '/onboarding/done' without Kiro alternative
- ⚠️ Active route '/legal/datenschutz' without Kiro alternative
- ⚠️ Active route '/legal/impressum' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /onboarding
- 🔧 Create Kiro alternative for route /onboarding/restaurant
- 🔧 Create Kiro alternative for route /onboarding/brand
- 🔧 Create Kiro alternative for route /onboarding/menu
- 🔧 Create Kiro alternative for route /onboarding/channels
- 🔧 Create Kiro alternative for route /onboarding/quickwins
- 🔧 Create Kiro alternative for route /onboarding/baseline
- 🔧 Create Kiro alternative for route /onboarding/done
- 🔧 Create Kiro alternative for route /legal/datenschutz
- 🔧 Create Kiro alternative for route /legal/impressum

---


### src/lib/architecture-scanner/safe-archival-system.ts (Priority: 305)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 8 routes
- Large component (1263 lines)
- High function count (21 functions)

#### Potential Impact
- ⚠️ Active route '/upload' without Kiro alternative
- ⚠️ Active route '/vc' without Kiro alternative
- ⚠️ Active route '/vc/quick' without Kiro alternative
- ⚠️ Active route '/onboarding' without Kiro alternative
- ⚠️ Active route '/reports' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/auth/login' without Kiro alternative
- ⚠️ Active route '/auth/register' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ Database operations may affect data integrity
- ⚠️ Payment logic may affect revenue
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create Kiro alternative for route /upload
- 🔧 Create Kiro alternative for route /vc
- 🔧 Create Kiro alternative for route /vc/quick
- 🔧 Create Kiro alternative for route /onboarding
- 🔧 Create Kiro alternative for route /reports
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /auth/login
- 🔧 Create Kiro alternative for route /auth/register
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Test database operations thoroughly
- 🔧 Extensive payment flow testing required
- 🔧 Verify admin capabilities are preserved

---


### src/layouts/SimpleLegalLayout.tsx (Priority: 304.14)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 10 routes

#### Potential Impact
- ⚠️ Active route '/datenschutz' without Kiro alternative
- ⚠️ Active route '/impressum' without Kiro alternative
- ⚠️ Active route '/agb' without Kiro alternative
- ⚠️ Active route '/nutzung' without Kiro alternative
- ⚠️ Active route '/kontakt' without Kiro alternative
- ⚠️ Active route '/privacy' without Kiro alternative
- ⚠️ Active route '/imprint' without Kiro alternative
- ⚠️ Active route '/terms' without Kiro alternative
- ⚠️ Active route '/usage' without Kiro alternative
- ⚠️ Active route '/contact' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /datenschutz
- 🔧 Create Kiro alternative for route /impressum
- 🔧 Create Kiro alternative for route /agb
- 🔧 Create Kiro alternative for route /nutzung
- 🔧 Create Kiro alternative for route /kontakt
- 🔧 Create Kiro alternative for route /privacy
- 🔧 Create Kiro alternative for route /imprint
- 🔧 Create Kiro alternative for route /terms
- 🔧 Create Kiro alternative for route /usage
- 🔧 Create Kiro alternative for route /contact

---


### src/components/visibility/SmartActionButtons.tsx (Priority: 280.61400000000003)

- **Risk Level**: critical
- **Origin**: supabase
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Has 3 backend dependencies
- Used in 6 routes
- Large component (299 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Active route '/api/generate-pdf-report?leadId=${leadId}' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/dashboard/profile' without Kiro alternative
- ⚠️ Active route '/packages' without Kiro alternative
- ⚠️ Active route '/auth?mode=register' without Kiro alternative
- ⚠️ Active route '/auth?mode=login' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Authentication logic may affect user access
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Create Kiro alternative for route /api/generate-pdf-report?leadId=${leadId}
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /dashboard/profile
- 🔧 Create Kiro alternative for route /packages
- 🔧 Create Kiro alternative for route /auth?mode=register
- 🔧 Create Kiro alternative for route /auth?mode=login
- 🔧 Break down into smaller components before migration
- 🔧 Verify auth flow compatibility
- 🔧 Update API endpoints and test integration

---


### src/components/Footer.tsx (Priority: 277.49199999999996)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 10 routes

#### Potential Impact
- ⚠️ Active route '/impressum' without Kiro alternative
- ⚠️ Active route '/imprint' without Kiro alternative
- ⚠️ Active route '/datenschutz' without Kiro alternative
- ⚠️ Active route '/privacy' without Kiro alternative
- ⚠️ Active route '/agb' without Kiro alternative
- ⚠️ Active route '/terms' without Kiro alternative
- ⚠️ Active route '/nutzung' without Kiro alternative
- ⚠️ Active route '/usage' without Kiro alternative
- ⚠️ Active route '/kontakt' without Kiro alternative
- ⚠️ Active route '/contact' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /impressum
- 🔧 Create Kiro alternative for route /imprint
- 🔧 Create Kiro alternative for route /datenschutz
- 🔧 Create Kiro alternative for route /privacy
- 🔧 Create Kiro alternative for route /agb
- 🔧 Create Kiro alternative for route /terms
- 🔧 Create Kiro alternative for route /nutzung
- 🔧 Create Kiro alternative for route /usage
- 🔧 Create Kiro alternative for route /kontakt
- 🔧 Create Kiro alternative for route /contact

---


### src/services/__tests__/persona-api.test.ts (Priority: 268.134)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 10 routes
- Large component (365 lines)

#### Potential Impact
- ⚠️ Active route '/pricing' without Kiro alternative
- ⚠️ Active route '/features' without Kiro alternative
- ⚠️ Active route '/integrations' without Kiro alternative
- ⚠️ Active route '/api-docs' without Kiro alternative
- ⚠️ Active route '/case-studies' without Kiro alternative
- ⚠️ Active route '/testimonials' without Kiro alternative
- ⚠️ Active route '/contact' without Kiro alternative
- ⚠️ Active route '/technical-specs' without Kiro alternative
- ⚠️ Active route '/security' without Kiro alternative
- ⚠️ Active route '/api/persona/detect' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /pricing
- 🔧 Create Kiro alternative for route /features
- 🔧 Create Kiro alternative for route /integrations
- 🔧 Create Kiro alternative for route /api-docs
- 🔧 Create Kiro alternative for route /case-studies
- 🔧 Create Kiro alternative for route /testimonials
- 🔧 Create Kiro alternative for route /contact
- 🔧 Create Kiro alternative for route /technical-specs
- 🔧 Create Kiro alternative for route /security
- 🔧 Create Kiro alternative for route /api/persona/detect
- 🔧 Break down into smaller components before migration

---


### src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts (Priority: 241.86)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 6 backend dependencies
- Used in 3 routes
- Large component (442 lines)
- High function count (12 functions)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Active service dependency 'lovable-service' without migration path
- ⚠️ Active route '/Login' without Kiro alternative
- ⚠️ Active route '/auth/login' without Kiro alternative
- ⚠️ Active route '/login' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ Authentication logic may affect user access
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Create migration path for lovable-service dependency
- 🔧 Create Kiro alternative for route /Login
- 🔧 Create Kiro alternative for route /auth/login
- 🔧 Create Kiro alternative for route /login
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Verify auth flow compatibility
- 🔧 Test database operations thoroughly

---


### src/lib/architecture-scanner/dependency-graph.ts (Priority: 229.968)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 7 routes
- Large component (360 lines)

#### Potential Impact
- ⚠️ Active route '/pages/' without Kiro alternative
- ⚠️ Active route '/components/' without Kiro alternative
- ⚠️ Active route '/hooks/' without Kiro alternative
- ⚠️ Active route '/services/' without Kiro alternative
- ⚠️ Active route '/contexts/' without Kiro alternative
- ⚠️ Active route '/lib/' without Kiro alternative
- ⚠️ Active route '/utils/' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /pages/
- 🔧 Create Kiro alternative for route /components/
- 🔧 Create Kiro alternative for route /hooks/
- 🔧 Create Kiro alternative for route /services/
- 🔧 Create Kiro alternative for route /contexts/
- 🔧 Create Kiro alternative for route /lib/
- 🔧 Create Kiro alternative for route /utils/
- 🔧 Break down into smaller components before migration

---


### src/services/persona-api.ts (Priority: 213.51)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Used in 5 routes
- Large component (416 lines)
- High function count (11 functions)

#### Potential Impact
- ⚠️ Active route '/api/persona/detect' without Kiro alternative
- ⚠️ Active route '/api/persona/config/${personaType}' without Kiro alternative
- ⚠️ Active route '/api/persona/recommendations/${personaType}' without Kiro alternative
- ⚠️ Active route '/api/persona/analytics/${personaType}' without Kiro alternative
- ⚠️ Active route '/api/persona/evolution/${userId}' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create Kiro alternative for route /api/persona/detect
- 🔧 Create Kiro alternative for route /api/persona/config/${personaType}
- 🔧 Create Kiro alternative for route /api/persona/recommendations/${personaType}
- 🔧 Create Kiro alternative for route /api/persona/analytics/${personaType}
- 🔧 Create Kiro alternative for route /api/persona/evolution/${userId}
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Update API endpoints and test integration

---


### src/components/Profile/CompanyProfile.tsx (Priority: 210)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 4 routes
- Large component (743 lines)

#### Potential Impact
- ⚠️ Active route '/profile' without Kiro alternative
- ⚠️ Active route '/onboarding' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/billing/upgrade' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Payment logic may affect revenue

#### Suggested Actions
- 🔧 Create Kiro alternative for route /profile
- 🔧 Create Kiro alternative for route /onboarding
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /billing/upgrade
- 🔧 Break down into smaller components before migration
- 🔧 Extensive payment flow testing required

---


### src/lib/architecture-scanner/test-coverage-analyzer.ts (Priority: 200.704)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 6 routes

#### Potential Impact
- ⚠️ Active route '/auth/' without Kiro alternative
- ⚠️ Active route '/services/' without Kiro alternative
- ⚠️ Active route '/api/' without Kiro alternative
- ⚠️ Active route '/components/' without Kiro alternative
- ⚠️ Active route '/hooks/' without Kiro alternative
- ⚠️ Active route '/utils/' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /auth/
- 🔧 Create Kiro alternative for route /services/
- 🔧 Create Kiro alternative for route /api/
- 🔧 Create Kiro alternative for route /components/
- 🔧 Create Kiro alternative for route /hooks/
- 🔧 Create Kiro alternative for route /utils/

---


### src/lib/architecture-scanner/refactoring-rules-engine.ts (Priority: 186.544)

- **Risk Level**: critical
- **Origin**: supabase
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 3 routes
- Large component (534 lines)

#### Potential Impact
- ⚠️ Active route '/auth/' without Kiro alternative
- ⚠️ Active route '/hooks/' without Kiro alternative
- ⚠️ Active route '/services/' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create Kiro alternative for route /auth/
- 🔧 Create Kiro alternative for route /hooks/
- 🔧 Create Kiro alternative for route /services/
- 🔧 Break down into smaller components before migration
- 🔧 Test database operations thoroughly

---


### src/components/auth/GoogleRegisterButton.tsx (Priority: 182.145)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 4 routes

#### Potential Impact
- ⚠️ Active route '/terms' without Kiro alternative
- ⚠️ Active route '/agb' without Kiro alternative
- ⚠️ Active route '/privacy' without Kiro alternative
- ⚠️ Active route '/datenschutz' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /terms
- 🔧 Create Kiro alternative for route /agb
- 🔧 Create Kiro alternative for route /privacy
- 🔧 Create Kiro alternative for route /datenschutz

---


### src/hooks/useUploadManagement.ts (Priority: 181.99099999999999)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Used in 4 routes
- Large component (247 lines)

#### Potential Impact
- ⚠️ Active route '/api/uploads?${params.toString()}' without Kiro alternative
- ⚠️ Active route '/api/uploads/${uploadId}' without Kiro alternative
- ⚠️ Active route '/api/uploads/${uploadId}/download' without Kiro alternative
- ⚠️ Active route '/api/uploads/${uploadId}/retry' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create Kiro alternative for route /api/uploads?${params.toString()}
- 🔧 Create Kiro alternative for route /api/uploads/${uploadId}
- 🔧 Create Kiro alternative for route /api/uploads/${uploadId}/download
- 🔧 Create Kiro alternative for route /api/uploads/${uploadId}/retry
- 🔧 Break down into smaller components before migration
- 🔧 Update API endpoints and test integration

---


### src/components/auth/GoogleOAuthCallback.tsx (Priority: 178.901)

- **Risk Level**: critical
- **Origin**: supabase
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Has 1 backend dependencies
- Used in 3 routes

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/onboarding' without Kiro alternative
- ⚠️ Active route '/login' without Kiro alternative

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /onboarding
- 🔧 Create Kiro alternative for route /login

---


### src/components/FigmaMainRouter.tsx (Priority: 175.924)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 5 routes

#### Potential Impact
- ⚠️ Active route '/visibilitycheck/onboarding/step1' without Kiro alternative
- ⚠️ Active route '/visibilitycheck/onboarding/loading' without Kiro alternative
- ⚠️ Active route '/visibilitycheck/onboarding/step2' without Kiro alternative
- ⚠️ Active route '/visibilitycheck/dashboard/public' without Kiro alternative
- ⚠️ Active route '/visibilitycheck/dashboard/member' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /visibilitycheck/onboarding/step1
- 🔧 Create Kiro alternative for route /visibilitycheck/onboarding/loading
- 🔧 Create Kiro alternative for route /visibilitycheck/onboarding/step2
- 🔧 Create Kiro alternative for route /visibilitycheck/dashboard/public
- 🔧 Create Kiro alternative for route /visibilitycheck/dashboard/member

---


### src/lib/s3-upload.ts (Priority: 175)

- **Risk Level**: critical
- **Origin**: supabase
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Has 1 backend dependencies
- Used in 1 routes
- Large component (1246 lines)
- High function count (36 functions)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Active route '/favicon.ico' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ Database operations may affect data integrity
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Create Kiro alternative for route /favicon.ico
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Test database operations thoroughly
- 🔧 Update API endpoints and test integration

---


### src/components/onboarding/QuickVerifyMode.tsx (Priority: 174.657)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Used in 4 routes

#### Potential Impact
- ⚠️ Active route '/onboarding' without Kiro alternative
- ⚠️ Active route '/verify' without Kiro alternative
- ⚠️ Active route '/dashboard?test=1&mode=verify' without Kiro alternative
- ⚠️ Active route '/partner/onboarding' without Kiro alternative
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Create Kiro alternative for route /onboarding
- 🔧 Create Kiro alternative for route /verify
- 🔧 Create Kiro alternative for route /dashboard?test=1&mode=verify
- 🔧 Create Kiro alternative for route /partner/onboarding
- 🔧 Verify auth flow compatibility

---


### src/hooks/useAvatar.ts (Priority: 166.471)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 3 routes
- Large component (412 lines)
- High function count (12 functions)

#### Potential Impact
- ⚠️ Active route '/images/default-user-avatar.svg' without Kiro alternative
- ⚠️ Active route '/images/default-partner-avatar.svg' without Kiro alternative
- ⚠️ Active route '/images/default-avatar.svg' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ Database operations may affect data integrity
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create Kiro alternative for route /images/default-user-avatar.svg
- 🔧 Create Kiro alternative for route /images/default-partner-avatar.svg
- 🔧 Create Kiro alternative for route /images/default-avatar.svg
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Test database operations thoroughly
- 🔧 Update API endpoints and test integration

---


### src/components/auth/AuthTabsContainer.tsx (Priority: 165.47)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 3 routes

#### Potential Impact
- ⚠️ Active route '/password-reset' without Kiro alternative
- ⚠️ Active route '/legal/terms' without Kiro alternative
- ⚠️ Active route '/legal/privacy' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /password-reset
- 🔧 Create Kiro alternative for route /legal/terms
- 🔧 Create Kiro alternative for route /legal/privacy

---


### src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts (Priority: 158.322)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Used in 2 routes
- Large component (536 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Active route '/legacy/old' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Create Kiro alternative for route /legacy/old
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Break down into smaller components before migration
- 🔧 Test database operations thoroughly

---


### src/lib/architecture-scanner/__tests__/enhanced-risk-assessor.test.ts (Priority: 157.333)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 4 routes
- Large component (393 lines)
- High function count (12 functions)

#### Potential Impact
- ⚠️ Active route '/login' without Kiro alternative
- ⚠️ Active route '/auth/login' without Kiro alternative
- ⚠️ Active route '/legacy/route' without Kiro alternative
- ⚠️ Active route '/dev/debug' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create Kiro alternative for route /login
- 🔧 Create Kiro alternative for route /auth/login
- 🔧 Create Kiro alternative for route /legacy/route
- 🔧 Create Kiro alternative for route /dev/debug
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Test database operations thoroughly

---


### src/components/visibility/VisibilityCheckOnboarding.tsx (Priority: 154.018)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 3 routes
- Large component (343 lines)

#### Potential Impact
- ⚠️ Active route '/visibilitycheck/onboarding/step2' without Kiro alternative
- ⚠️ Active route '/visibilitycheck/onboarding/step1' without Kiro alternative
- ⚠️ Active route '/visibilitycheck/dashboard/results' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /visibilitycheck/onboarding/step2
- 🔧 Create Kiro alternative for route /visibilitycheck/onboarding/step1
- 🔧 Create Kiro alternative for route /visibilitycheck/dashboard/results
- 🔧 Break down into smaller components before migration

---


### src/components/dashboard/restaurant/widgets/ReviewsWidget.tsx (Priority: 148.152)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 3 routes
- Large component (210 lines)

#### Potential Impact
- ⚠️ Active route '/avatars/maria.jpg' without Kiro alternative
- ⚠️ Active route '/avatars/john.jpg' without Kiro alternative
- ⚠️ Active route '/avatars/anna.jpg' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /avatars/maria.jpg
- 🔧 Create Kiro alternative for route /avatars/john.jpg
- 🔧 Create Kiro alternative for route /avatars/anna.jpg
- 🔧 Break down into smaller components before migration

---


### src/services/UserJourneyManager.ts (Priority: 147.18200000000002)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 3 routes
- Large component (229 lines)

#### Potential Impact
- ⚠️ Active route '/visibilitycheck/onboarding/step1' without Kiro alternative
- ⚠️ Active route '/dashboard?source=subscription' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /visibilitycheck/onboarding/step1
- 🔧 Create Kiro alternative for route /dashboard?source=subscription
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Break down into smaller components before migration

---


### src/hooks/useUploadAnalytics.ts (Priority: 134.10500000000002)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Used in 2 routes

#### Potential Impact
- ⚠️ Active route '/api/uploads/analytics?timeRange=${timeRange}' without Kiro alternative
- ⚠️ Active route '/api/uploads/analytics/export' without Kiro alternative
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create Kiro alternative for route /api/uploads/analytics?timeRange=${timeRange}
- 🔧 Create Kiro alternative for route /api/uploads/analytics/export
- 🔧 Update API endpoints and test integration

---


### src/components/ConsentBanner.tsx (Priority: 131.60899999999998)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 2 backend dependencies
- Used in 1 routes

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Active route '/datenschutz' without Kiro alternative
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Create Kiro alternative for route /datenschutz
- 🔧 Verify auth flow compatibility

---


### src/components/upload/UploadPreviewModal.tsx (Priority: 127.565)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Used in 1 routes
- Large component (364 lines)

#### Potential Impact
- ⚠️ Active route '/api/preview/generate' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create Kiro alternative for route /api/preview/generate
- 🔧 Break down into smaller components before migration
- 🔧 Update API endpoints and test integration

---


### src/components/auth/ProtectedRoute.tsx (Priority: 126.602)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/login' without Kiro alternative
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create Kiro alternative for route /login
- 🔧 Test database operations thoroughly

---


### src/components/vc/VCDataManagementFlow.tsx (Priority: 125)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Used in 1 routes
- Large component (803 lines)
- High function count (16 functions)

#### Potential Impact
- ⚠️ Active route '/datenschutz' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Create Kiro alternative for route /datenschutz
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/Profile/MyProfile.tsx (Priority: 124.972)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 2 routes
- Large component (418 lines)
- Many dependencies (17 imports)

#### Potential Impact
- ⚠️ Active route '/admin-panel' without Kiro alternative
- ⚠️ Active route '/company-profile' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Complex dependency tree may cause cascading issues
- ⚠️ Authentication logic may affect user access
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create Kiro alternative for route /admin-panel
- 🔧 Create Kiro alternative for route /company-profile
- 🔧 Break down into smaller components before migration
- 🔧 Map all dependencies and their migration status
- 🔧 Verify auth flow compatibility
- 🔧 Verify admin capabilities are preserved

---


### src/components/visibility/VisibilityCheckForm.tsx (Priority: 123.191)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (518 lines)
- High function count (13 functions)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Test database operations thoroughly

---


### src/hooks/useBusinessContactData.ts (Priority: 122.546)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 2 backend dependencies
- Large component (230 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Authentication logic may affect user access
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration
- 🔧 Verify auth flow compatibility
- 🔧 Test database operations thoroughly

---


### src/components/layout/AppLayout.tsx (Priority: 121.601)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/business/partner' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /business/partner

---


### src/contexts/PersonaContext.tsx (Priority: 119.53999999999999)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Large component (304 lines)
- High function count (12 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/lib/promo-codes.ts (Priority: 118.918)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 2 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Authentication logic may affect user access
- ⚠️ Database operations may affect data integrity
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Verify auth flow compatibility
- 🔧 Test database operations thoroughly
- 🔧 Verify admin capabilities are preserved

---


### src/components/navigation/MobileMenu.tsx (Priority: 118.639)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 3 routes

#### Potential Impact
- ⚠️ Active route '/login' without Kiro alternative
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/dashboard/profile' without Kiro alternative
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create Kiro alternative for route /login
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /dashboard/profile
- 🔧 Verify admin capabilities are preserved

---


### src/hooks/useDashboardData.ts (Priority: 115.964)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 2 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Authentication logic may affect user access
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Verify auth flow compatibility
- 🔧 Verify admin capabilities are preserved

---


### src/services/auth.ts (Priority: 115.607)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes
- Large component (220 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Update API endpoints and test integration

---


### src/components/Notes.tsx (Priority: 114.779)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 2 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Authentication logic may affect user access
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Verify auth flow compatibility
- 🔧 Test database operations thoroughly

---


### src/hooks/useEnhancedVisibilityCheck.ts (Priority: 113.642)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 2 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Authentication logic may affect user access
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Verify auth flow compatibility
- 🔧 Update API endpoints and test integration

---


### src/components/admin/FacebookConversionsConfig.tsx (Priority: 109.027)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (281 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration
- 🔧 Verify admin capabilities are preserved

---


### src/hooks/useServicePackages.ts (Priority: 108.57)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (251 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration
- 🔧 Test database operations thoroughly

---


### src/hooks/useKpiSummary.ts (Priority: 107.665)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 2 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Verify auth flow compatibility

---


### src/components/ui/context-menu.tsx (Priority: 107.246)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useSubCategoriesWithCrossTags.ts (Priority: 107.124)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (208 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration
- 🔧 Test database operations thoroughly

---


### src/hooks/useGoogleConnection.ts (Priority: 106.531)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 2 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Verify auth flow compatibility

---


### src/components/Logo.tsx (Priority: 106.25)

- **Risk Level**: high
- **Origin**: lovable
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/lovable-uploads/cac34de9-55d9-46d4-a2ad-62bc4d429666.png' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /lovable-uploads/cac34de9-55d9-46d4-a2ad-62bc4d429666.png

---


### src/hooks/useOnboardingQuestions.ts (Priority: 106.132)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (204 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration
- 🔧 Test database operations thoroughly

---


### src/components/auth/AuthModeSelector.tsx (Priority: 104.721)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/Profile/ProfileLayout.tsx (Priority: 104.259)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/GoogleOAuthManager.tsx (Priority: 103.939)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (278 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration

---


### src/components/auth/AuthErrorDialog.tsx (Priority: 103.616)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/admin/AddonServiceEditModal.tsx (Priority: 103.575)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (257 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration

---


### src/components/dashboard/AdaptiveDashboardGrid.tsx (Priority: 103.44)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (415 lines)
- Many dependencies (17 imports)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Complex dependency tree may cause cascading issues
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Map all dependencies and their migration status
- 🔧 Verify admin capabilities are preserved

---


### src/components/auth/FeedbackModal.tsx (Priority: 103.022)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/visibility/VisibilityWizard.tsx (Priority: 103.014)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (374 lines)
- High function count (14 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Test database operations thoroughly

---


### src/hooks/useSafePersona.ts (Priority: 102.763)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (246 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Authentication logic may affect user access
- ⚠️ Admin functionality may affect system management
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Verify auth flow compatibility
- 🔧 Verify admin capabilities are preserved
- 🔧 Update API endpoints and test integration

---


### src/hooks/useEnhancedLeadTracking.ts (Priority: 102.468)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (271 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration

---


### src/components/auth/EmailLoginForm.tsx (Priority: 102.384)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/SubCategorySelector.tsx (Priority: 102.18)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (417 lines)
- High function count (18 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/hooks/useS3FileAccess.ts (Priority: 102.173)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (400 lines)
- High function count (11 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Update API endpoints and test integration

---


### src/components/auth/GoogleLoginButton.tsx (Priority: 102.112)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/contexts/AppProviders.tsx (Priority: 102.043)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/auth/FacebookLoginButton.tsx (Priority: 101.849)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/contexts/i18nContext.tsx (Priority: 101.373)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/admin/PackageEditModal.tsx (Priority: 101.339)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies
- Large component (209 lines)

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Break down into smaller components before migration

---


### src/components/auth/OAuthErrorBanner.tsx (Priority: 101.292)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useUploadHistory.ts (Priority: 101.17099999999999)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (390 lines)
- High function count (20 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Update API endpoints and test integration

---


### src/contexts/themeContext.tsx (Priority: 101.112)

- **Risk Level**: critical
- **Origin**: unknown
- **Hold Reason**: Critical system component with multiple high-risk factors

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useCompanyProfile.ts (Priority: 98.407)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Payment logic may affect revenue

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Extensive payment flow testing required

---


### src/hooks/useNewServicePackages.ts (Priority: 97.624)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Test database operations thoroughly

---


### src/components/visibility/VisibilityCheckDashboard.tsx (Priority: 97.218)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 2 routes

#### Potential Impact
- ⚠️ Active route '/register' without Kiro alternative
- ⚠️ Active route '/angebote' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /register
- 🔧 Create Kiro alternative for route /angebote

---


### src/services/benchmark-comparison.ts (Priority: 97.143)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (362 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Verify admin capabilities are preserved

---


### src/components/PricingCard.tsx (Priority: 96.861)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 2 routes

#### Potential Impact
- ⚠️ Active route '/partner/onboarding' without Kiro alternative
- ⚠️ Active route '/${t(' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /partner/onboarding
- 🔧 Create Kiro alternative for route /${t(

---


### src/components/dashboard/widgets/AIContentWidget.tsx (Priority: 96.408)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (437 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/redeem/CampaignReport.tsx (Priority: 95.94800000000001)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency

---


### src/lib/recommendation/recommendationFlow.ts (Priority: 95.811)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (334 lines)
- High function count (14 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/hooks/useS3Upload.ts (Priority: 95.33500000000001)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (375 lines)
- High function count (11 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/hooks/useAIServices.ts (Priority: 95.06700000000001)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (325 lines)
- High function count (19 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/hooks/useSubCategoriesWithCrossTagsNew.ts (Priority: 94.97)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency

---


### src/lib/monitoring.ts (Priority: 94.723)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (388 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Update API endpoints and test integration

---


### src/components/dashboard/widgets/AIAnalysisWidget.tsx (Priority: 94.076)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (430 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/persona/PersonaAdaptiveUI.tsx (Priority: 93.999)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (308 lines)
- High function count (12 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/dashboard/QuickActions.tsx (Priority: 93.717)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 2 routes

#### Potential Impact
- ⚠️ Active route '/dashboard/business/hours' without Kiro alternative
- ⚠️ Active route '/dashboard/business/menu' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /dashboard/business/hours
- 🔧 Create Kiro alternative for route /dashboard/business/menu

---


### src/hooks/useGmbCategories.ts (Priority: 93.595)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency

---


### src/hooks/useFacebookConversions.ts (Priority: 93.58500000000001)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (297 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Test database operations thoroughly

---


### src/lib/forecast/forecastUtils.ts (Priority: 93.483)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (286 lines)
- High function count (16 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/lib/recommendation/recommendationTrigger.ts (Priority: 93.463)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (289 lines)
- High function count (17 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/dashboard/widgets/AIRecommendationsWidget.tsx (Priority: 93.387)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (386 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/header/UserMenu.tsx (Priority: 92.941)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 2 routes

#### Potential Impact
- ⚠️ Active route '/dashboard' without Kiro alternative
- ⚠️ Active route '/profile' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /dashboard
- 🔧 Create Kiro alternative for route /profile

---


### src/hooks/useUnclaimedProfiles.ts (Priority: 92.755)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency

---


### src/components/HeroSection.tsx (Priority: 92.636)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 2 routes

#### Potential Impact
- ⚠️ Active route '/vc/quick' without Kiro alternative
- ⚠️ Active route '/register' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /vc/quick
- 🔧 Create Kiro alternative for route /register

---


### src/lib/navigationValidator.ts (Priority: 92.594)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 2 routes

#### Potential Impact
- ⚠️ Active route '/angebote' without Kiro alternative
- ⚠️ Active route '/packages' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /angebote
- 🔧 Create Kiro alternative for route /packages

---


### src/components/SafePersonaLoader.tsx (Priority: 92.485)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (235 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Verify admin capabilities are preserved

---


### src/hooks/useLocalStorage.ts (Priority: 92.294)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (266 lines)
- High function count (12 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/hooks/useMainCategoryMappingNew.ts (Priority: 92.274)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency

---


### src/components/visibility/VisibilityStepTwo.tsx (Priority: 92.234)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 2 routes

#### Potential Impact
- ⚠️ Active route '/visibilitycheck/onboarding/step1' without Kiro alternative
- ⚠️ Active route '/visibilitycheck/dashboard/results' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /visibilitycheck/onboarding/step1
- 🔧 Create Kiro alternative for route /visibilitycheck/dashboard/results

---


### src/hooks/useProfile.ts (Priority: 92.147)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency

---


### src/hooks/useRecommendations.ts (Priority: 91.764)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (254 lines)
- High function count (12 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/analytics/ForecastDemo.tsx (Priority: 91.686)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (299 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/services/score-history.ts (Priority: 91.643)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (386 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/analytics/ForecastChart.tsx (Priority: 91.437)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (337 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/lib/architecture-scanner/component-map.ts (Priority: 91.243)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (362 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/dashboard/widgets/PersonaSelectionWidget.tsx (Priority: 91.19)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (317 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/onboarding/KpiInputStep.tsx (Priority: 91.022)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (294 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/ui/chart.tsx (Priority: 90.466)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (364 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/dashboard/widgets/AIStatusWidget.tsx (Priority: 89.806)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (266 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/onboarding/GoogleConnectionStep.tsx (Priority: 89.175)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (254 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/onboarding/MainCategorySelector.tsx (Priority: 88.805)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (213 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/dashboard/restaurant/widgets/ReservationsWidget.tsx (Priority: 88.779)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (254 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/lib/forecast/forecastEngine.ts (Priority: 88.717)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (300 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/onboarding/SimpleOnboardingForm.tsx (Priority: 88.686)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (242 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/services/OnboardingService.ts (Priority: 88.447)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (256 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/hooks/useAuthUnified.ts (Priority: 88.328)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact
- ⚠️ Authentication logic may affect user access
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Verify auth flow compatibility
- 🔧 Verify admin capabilities are preserved

---


### src/hooks/useForecast.ts (Priority: 88.161)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (254 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/lib/i18n-validator.ts (Priority: 88.154)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (229 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/dashboard/restaurant/widgets/MarketingWidget.tsx (Priority: 88.121)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (233 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/ui/upload-progress.tsx (Priority: 88.119)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (270 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/dashboard/restaurant/widgets/OrdersRevenueWidget.tsx (Priority: 87.989)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (215 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/analytics/TrendAnalyticsDemo.tsx (Priority: 87.983)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (214 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/hooks/useLeadTracking.ts (Priority: 87.976)

- **Risk Level**: high
- **Origin**: supabase
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (262 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/analytics/TrendFilters.tsx (Priority: 87.796)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (246 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/visibility/VisibilityStepOne.tsx (Priority: 87.322)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Many dependencies (16 imports)

#### Potential Impact
- ⚠️ Complex dependency tree may cause cascading issues

#### Suggested Actions
- 🔧 Map all dependencies and their migration status

---


### src/components/Profile/ProfileFields.tsx (Priority: 87.201)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (259 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/hooks/useBenchmarkComparison.ts (Priority: 87.126)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (244 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/visibility/PlatformProfileCard.tsx (Priority: 87.087)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes
- Large component (338 lines)

#### Potential Impact
- ⚠️ Active route '//' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route //
- 🔧 Break down into smaller components before migration

---


### src/lib/architecture-scanner/usage-analyzer.ts (Priority: 86.8)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (240 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/lib/recommendation/thresholds.ts (Priority: 86.544)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (240 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/analytics/TrendChart.tsx (Priority: 86.13)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes
- Large component (213 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/dashboard/restaurant/widgets/PerformanceTrendsWidget.tsx (Priority: 85.378)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes
- Large component (259 lines)

#### Potential Impact
- ⚠️ Active route '/5' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /5
- 🔧 Break down into smaller components before migration

---


### src/components/invisible/VCResultInvisible.tsx (Priority: 84.648)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/functions/v1/posting-enqueue' without Kiro alternative
- ⚠️ Admin functionality may affect system management
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Create Kiro alternative for route /functions/v1/posting-enqueue
- 🔧 Verify admin capabilities are preserved
- 🔧 Update API endpoints and test integration

---


### src/components/dashboard/DashboardGrid.tsx (Priority: 84.544)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Verify admin capabilities are preserved

---


### src/services/aws-rds-client.ts (Priority: 84.313)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Test database operations thoroughly

---


### src/components/CookieConsentBanner.tsx (Priority: 83.525)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes
- Large component (227 lines)

#### Potential Impact
- ⚠️ Active route '/datenschutz' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /datenschutz
- 🔧 Break down into smaller components before migration

---


### src/services/__tests__/auth.test.ts (Priority: 83.325)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes
- Large component (268 lines)

#### Potential Impact
- ⚠️ Active route '/auth/start' without Kiro alternative
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Create Kiro alternative for route /auth/start
- 🔧 Break down into smaller components before migration

---


### src/components/ui/dropdown-menu.tsx (Priority: 82.295)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/header/NavigationMenu.tsx (Priority: 82.186)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Verify admin capabilities are preserved

---


### src/hooks/useUnifiedAuth.ts (Priority: 81.946)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Verify auth flow compatibility

---


### src/components/ContactForm.tsx (Priority: 81.678)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/PackageComparison.tsx (Priority: 81.665)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/${t(' without Kiro alternative
- ⚠️ Database operations may affect data integrity

#### Suggested Actions
- 🔧 Create Kiro alternative for route /${t(
- 🔧 Test database operations thoroughly

---


### src/components/dashboard/restaurant/RestaurantDashboardHeader.tsx (Priority: 81.625)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/services/vc.ts (Priority: 81.49)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Update API endpoints and test integration

---


### src/lib/rbac.ts (Priority: 81.391)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Verify admin capabilities are preserved

---


### src/hooks/usePartnerProfile.ts (Priority: 81.026)

- **Risk Level**: medium
- **Origin**: supabase
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Has 2 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Verify auth flow compatibility

---


### src/hooks/useAiRecommendations.ts (Priority: 80.991)

- **Risk Level**: medium
- **Origin**: supabase
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Has 2 backend dependencies

#### Potential Impact
- ⚠️ Active database dependency 'supabase-table' without migration path
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Create migration path for supabase-table dependency
- 🔧 Verify auth flow compatibility

---


### src/components/analytics/ForecastControls.tsx (Priority: 80.761)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/analytics/EventControls.tsx (Priority: 80.759)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/select.tsx (Priority: 80.615)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useRestaurantDashboard.ts (Priority: 80.536)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/layout/AdminLayout.tsx (Priority: 80.477)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes


#### Potential Impact
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Verify admin capabilities are preserved

---


### src/components/ui/file-preview-modal.tsx (Priority: 80.469)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (518 lines)
- High function count (16 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements
- ⚠️ API calls may fail with backend changes

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy
- 🔧 Update API endpoints and test integration

---


### src/components/dashboard/widgets/AdAnalyticsWidget.tsx (Priority: 80.443)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/widgets/BookingPortalWidget.tsx (Priority: 80.429)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/restaurant/widgets/AnalyticsWidget.tsx (Priority: 80.295)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/restaurant/widgets/VisibilityScoreWidget.tsx (Priority: 80.285)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ErrorBoundary.tsx (Priority: 80.282)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/TrustElements.tsx (Priority: 80.14)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/DashboardBuilder.tsx (Priority: 80)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (650 lines)
- High function count (11 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/ui/file-input.tsx (Priority: 80)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (682 lines)
- High function count (36 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/ui/upload-management.tsx (Priority: 80)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (650 lines)
- High function count (19 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/lib/architecture-scanner/targeted-test-executor.ts (Priority: 80)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (835 lines)
- High function count (18 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/visibility/MatbakhCategories.ts (Priority: 79.986)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/widgets/ReservationsWidget.tsx (Priority: 79.909)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/command.tsx (Priority: 79.879)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/ServiceSelectionStep.tsx (Priority: 79.864)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/toast.tsx (Priority: 79.845)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useFilePreview.ts (Priority: 79.741)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/lib/architecture-scanner/file-system-crawler.ts (Priority: 79.689)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/alert-dialog.tsx (Priority: 79.42)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/KpiSelector.tsx (Priority: 79.352)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/PromoCodeRedeem.tsx (Priority: 79.334)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/analytics/TrendChartDemo.tsx (Priority: 79.292)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/sheet.tsx (Priority: 79.25)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/image-upload.tsx (Priority: 79.184)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (607 lines)
- High function count (16 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/analytics/EventAnnotations.tsx (Priority: 79.14)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/form.tsx (Priority: 79.085)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/SolutionSection.tsx (Priority: 79.074)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/restaurant/RestaurantDashboardGrid.tsx (Priority: 78.9)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/use-toast.ts (Priority: 78.895)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/upload/UploadManagementDashboard.tsx (Priority: 78.843)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (517 lines)
- High function count (11 functions)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies
- ⚠️ Multiple functions may have different migration requirements

#### Suggested Actions
- 🔧 Break down into smaller components before migration
- 🔧 Analyze each function individually for migration strategy

---


### src/components/ui/dialog.tsx (Priority: 78.835)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/widgets/OrdersWidget.tsx (Priority: 78.81700000000001)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/CategorySelector.tsx (Priority: 78.756)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/widgets/ReviewsWidget.tsx (Priority: 78.661)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/invisible/InvisibleModeToggle.tsx (Priority: 78.499)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/invisible/AnswerCard.tsx (Priority: 77.972)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ProblemSection.tsx (Priority: 77.872)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/widgets/VisibilityScoreWidget.tsx (Priority: 77.846)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/table.tsx (Priority: 77.765)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/KpiCard.tsx (Priority: 77.703)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/PainPointCards.tsx (Priority: 77.632)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/PhotoUploader.tsx (Priority: 77.481)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useMainCategoryMapping.ts (Priority: 77.445)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/WidgetErrorBoundary.tsx (Priority: 77.342)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/invisible/ModeNudge.tsx (Priority: 77.333)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/redeem/RedeemCodeInput.tsx (Priority: 77.274)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/GoogleConnectModal.tsx (Priority: 77.242)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useOnboardingPersistence.ts (Priority: 77.219)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/OnboardingStepIndicator.tsx (Priority: 77.194)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/PackageFAQ.tsx (Priority: 77.166)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/EmptySubCategoriesMessage.tsx (Priority: 77.134)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/LoadingSkeleton.tsx (Priority: 77.133)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/TrialBanner.tsx (Priority: 77.125)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/visibility/VisibilityStepThree.tsx (Priority: 77.013)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/accordion.tsx (Priority: 76.977)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/button.tsx (Priority: 76.899)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/tabs.tsx (Priority: 76.882)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/card.tsx (Priority: 76.877)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/lib/architecture-scanner/types.ts (Priority: 76.75)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/Header.tsx (Priority: 76.691)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/CurrencyInput.tsx (Priority: 76.657)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/invisible/FollowUpChips.tsx (Priority: 76.639)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/lib/i18n.ts (Priority: 76.631)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/locales/{{lng}}/{{ns}}.json' without Kiro alternative
- ⚠️ Admin functionality may affect system management

#### Suggested Actions
- 🔧 Create Kiro alternative for route /locales/{{lng}}/{{ns}}.json
- 🔧 Verify admin capabilities are preserved

---


### src/components/ui/alert.tsx (Priority: 76.583)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/LanguageSwitch.tsx (Priority: 76.554)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/legends/SocialMediaLegend.tsx (Priority: 76.533)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/toggle.tsx (Priority: 76.435)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useSafeTranslation.ts (Priority: 76.43)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/avatar.tsx (Priority: 76.405)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/services/__tests__/vc.test.ts (Priority: 76.359)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/vc/start' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /vc/start

---


### src/hooks/useSafeAuth.ts (Priority: 76.243)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/popover.tsx (Priority: 76.23)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/navigation/NavigationItemMobile.tsx (Priority: 76.194)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/tooltip.tsx (Priority: 76.145)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/switch.tsx (Priority: 76.138)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/badge.tsx (Priority: 76.127)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/legends/GMBLegend.tsx (Priority: 76.092)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/navigation/BackHomeButtons.tsx (Priority: 76.082)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/dashboard/legends/GA4Legend.tsx (Priority: 76.079)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/lib/forecast/types.ts (Priority: 76.078)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/slider.tsx (Priority: 76.077)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/checkbox.tsx (Priority: 76.056)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/I18nDebugger.tsx (Priority: 75.986)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useKpi.ts (Priority: 75.889)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/header/LanguageToggle.tsx (Priority: 75.881)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useUIMode.ts (Priority: 75.88)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/Spinner.tsx (Priority: 75.793)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/input.tsx (Priority: 75.791)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/progress.tsx (Priority: 75.776)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/toaster.tsx (Priority: 75.772)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/textarea.tsx (Priority: 75.771)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/sonner.tsx (Priority: 75.768)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/separator.tsx (Priority: 75.756)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/auth/AuthDebugInfo.tsx (Priority: 75.753)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/label.tsx (Priority: 75.71)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/SimpleTestComponent.tsx (Priority: 75.641)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ThemeToggle.tsx (Priority: 75.624)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/use-mobile.tsx (Priority: 75.565)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/hooks/useAnalyticsEvent.ts (Priority: 75.56)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/WhyMatbakhBanner.tsx (Priority: 75.539)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/ErrorBanner.tsx (Priority: 75.493)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/GuestLandingPage.tsx (Priority: 75.456)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/seo/Canonical.tsx (Priority: 75.45)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/auth/AuthLoadingState.tsx (Priority: 75.432)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/lib/translations/de.ts (Priority: 75.429)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/lib/translations/en.ts (Priority: 75.382)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/lib/env.ts (Priority: 75.361)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/auth/GoogleCtaNotice.tsx (Priority: 75.328)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: High-risk component requiring manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/collapsible.tsx (Priority: 75.315)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/skeleton.tsx (Priority: 75.261)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/lib/utils.ts (Priority: 75.166)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/ui/use-toast.ts (Priority: 75.082)

- **Risk Level**: high
- **Origin**: unknown
- **Hold Reason**: Blocked by active imports - requires manual review

#### Review Notes


#### Potential Impact


#### Suggested Actions
- 🔧 Perform thorough integration testing
- 🔧 Create comprehensive test coverage
- 🔧 Document component behavior before changes

---


### src/components/onboarding/BusinessContactForm.tsx (Priority: 75)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (485 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/ui/sidebar.tsx (Priority: 75)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (762 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/score-evolution/ScoreEvolutionChart.tsx (Priority: 74.20400000000001)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (513 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/ProcessOverview.tsx (Priority: 74.169)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/kontakt' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /kontakt

---


### src/components/visibility/VCLaunchWidget.tsx (Priority: 74.022)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/visibilitycheck/onboarding/step1' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /visibilitycheck/onboarding/step1

---


### src/components/dashboard/widgets/AIInsightsWidget.tsx (Priority: 73.447)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (533 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/onboarding/BusinessBasicsStep.tsx (Priority: 73.231)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (513 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/onboarding/KpiPortfolio.ts (Priority: 72.906)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/5' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /5

---


### src/components/upload/UploadAnalytics.tsx (Priority: 72.209)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (487 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/SeoMeta.tsx (Priority: 72.187)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Used in 1 routes

#### Potential Impact
- ⚠️ Active route '/og-image.jpg' without Kiro alternative

#### Suggested Actions
- 🔧 Create Kiro alternative for route /og-image.jpg

---


### src/lib/architecture-scanner/documentation-generator.ts (Priority: 71.888)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Large component (507 lines)

#### Potential Impact
- ⚠️ Complex component may have hidden dependencies

#### Suggested Actions
- 🔧 Break down into smaller components before migration

---


### src/components/CheckoutButton.tsx (Priority: 67.493)

- **Risk Level**: medium
- **Origin**: unknown
- **Hold Reason**: Medium-risk component - review recommended

#### Review Notes
- Has 1 backend dependencies

#### Potential Impact
- ⚠️ Authentication logic may affect user access

#### Suggested Actions
- 🔧 Verify auth flow compatibility

---


## Next Steps

1. **Review Critical Components First**: Start with highest priority components
2. **Create Migration Plans**: For each component, create a detailed migration strategy
3. **Test Thoroughly**: Ensure comprehensive test coverage before any changes
4. **Document Everything**: Keep detailed records of changes and decisions
5. **Gradual Approach**: Consider migrating components in small batches
6. **Monitor Impact**: Watch for issues after each component migration

## Files Location

- **Components**: `on-hold/src/` (preserves original structure)
- **Analysis Report**: `on-hold/on-hold-analysis-report.json`
- **This Guide**: `on-hold/ON-HOLD-REVIEW-GUIDE.md`
