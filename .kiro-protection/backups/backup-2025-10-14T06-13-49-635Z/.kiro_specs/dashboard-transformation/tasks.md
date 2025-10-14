# Dashboard Transformation - Implementation Tasks

## Phase 1: Kritische VC-Token Reparatur (Sofort)

- [x] 1. VC-Confirm Function reparieren
  - Analysiere aktuelle vc-confirm Function
  - Implementiere Redirect zu matbakh.app/vc/result?t=token
  - Teste Token-Weiterleitung
  - _Requirements: US-4.1, US-4.2_

- [x] 1.1 VC-Confirm Function Code Update
  - Öffne supabase/functions/vc-confirm/index.ts
  - Implementiere 302 Redirect zu matbakh.app
  - Füge Error-Handling für ungültige Token hinzu
  - _Requirements: US-4.1, US-4.3_

- [x] 1.2 VCResult Component Token-Handling
  - Update src/pages/vc/VCResult.tsx für Token-Parameter
  - Implementiere Token-Validierung und Daten-Loading
  - Füge Error-States für ungültige/abgelaufene Token hinzu
  - _Requirements: US-4.2, US-4.4_

- [x] 1.3 VC-Token System Testing
  - Teste vc-confirm → vc-result Flow
  - Validiere Token-Parameter-Handling
  - Teste Error-Cases (ungültige/abgelaufene Token)
  - _Requirements: US-4.1, US-4.2, US-4.3_

## Phase 2: Figma Dashboard Analyse und Vorbereitung

- [x] 2. Figma Dashboard Komponenten analysieren
  - Analysiere Restaurant Dashboard System Komponenten
  - Analysiere VC Ergebnis Dashboard Komponenten
  - Erstelle Komponenten-Mapping und Abhängigkeiten
  - _Requirements: TR-1_

- [x] 2.1 Restaurant Dashboard Komponenten-Inventar
  - Liste alle Widgets aus Figma Restaurant Dashboard
  - Analysiere Datenstrukturen und Props
  - Identifiziere gemeinsame UI-Komponenten
  - _Requirements: TR-1, TR-3_

- [x] 2.2 VC Dashboard Komponenten-Inventar
  - Liste alle Widgets aus Figma VC Dashboard
  - Analysiere VC-spezifische Datenstrukturen
  - Identifiziere Unterschiede zu Restaurant Dashboard
  - _Requirements: TR-1, TR-3_

- [x] 2.3 Shared Components Identifikation
  - Identifiziere wiederverwendbare Komponenten
  - Plane gemeinsame UI-Library Struktur
  - Erstelle Komponenten-Architektur Plan
  - _Requirements: TR-1, NFR-3_

## Phase 3: Restaurant Dashboard Implementation

- [-] 3. Restaurant Dashboard Basis-Struktur
  - Erstelle neue RestaurantDashboard.tsx Komponente
  - Implementiere DashboardGrid Layout-System
  - Integriere DashboardHeader Komponente
  - _Requirements: US-1.2, TR-1_

- [ ] 3.1 Core Restaurant Dashboard Widgets
  - Portiere VisibilityScoreWidget.tsx
  - Portiere OrdersRevenueWidget.tsx
  - Portiere ReviewsWidget.tsx
  - Portiere ReservationsWidget.tsx
  - _Requirements: US-1.3, TR-1_

- [ ] 3.2 Extended Restaurant Dashboard Widgets
  - Portiere AnalyticsWidget.tsx
  - Portiere MarketingWidget.tsx
  - Portiere LocationOverviewWidget.tsx
  - Portiere PerformanceTrendsWidget.tsx
  - _Requirements: US-1.3, TR-1_

- [ ] 3.3 Restaurant Dashboard Datenintegration
  - Integriere owner-overview API für Basis-Daten
  - Implementiere Widget-spezifische API-Calls
  - Füge Loading-States und Error-Handling hinzu
  - _Requirements: TR-3, NFR-1_

- [x] 3.4 Restaurant Dashboard Routing Integration
  - Update App.tsx für /dashboard Route
  - Implementiere ProtectedRoute für Restaurant Dashboard
  - Update AuthContext für Dashboard-Redirect nach Login
  - _Requirements: US-1.1, TR-2_

## Phase 4: VC Ergebnis Dashboard Implementation

- [ ] 4. VC Dashboard Basis-Struktur
  - Erstelle neue VCResultDashboard.tsx Komponente
  - Implementiere VC-spezifisches Layout-System
  - Integriere VC-Header mit Ergebnis-Informationen
  - _Requirements: US-2.2, TR-1_

- [ ] 4.1 Core VC Dashboard Widgets
  - Portiere VC-spezifische VisibilityScoreWidget
  - Portiere CompetitorMonitoringWidget.tsx
  - Portiere CallToActionBanner.tsx
  - Portiere ReportPreviewModal.tsx
  - _Requirements: US-2.3, TR-1_

- [ ] 4.2 VC Dashboard Modes und Features
  - Implementiere PublicDashboardMode.tsx
  - Implementiere RestrictedWidget.tsx für Premium-Features
  - Füge VC-spezifische Analytics hinzu
  - _Requirements: US-2.4, TR-1_

- [ ] 4.3 VC Dashboard Datenintegration
  - Integriere vc-result API für Token-basierte Daten
  - Implementiere Competitor-Daten API-Integration
  - Füge VC-Recommendations API-Integration hinzu
  - _Requirements: TR-3, US-2.3_

- [ ] 4.4 VC Dashboard Routing und Token-Integration
  - Update VCResult.tsx für Dashboard-Weiterleitung
  - Implementiere Token-basierte Daten-Loading
  - Füge /vc/result/dashboard Route hinzu
  - _Requirements: US-2.1, US-2.2, TR-2_

## Phase 5: Alte Dashboard Deaktivierung

- [ ] 5. Alte Dashboard Komponenten archivieren
  - Verschiebe OwnerOverview.tsx nach src/archive/
  - Verschiebe DashboardMain.tsx nach src/archive/
  - Archiviere alte Dashboard-Widgets
  - _Requirements: US-3.2, TR-4_

- [ ] 5.1 Navigation und Routing Cleanup
  - Entferne Links zu alten Dashboards aus Navigation
  - Update Breadcrumb-Komponenten
  - Bereinige App.tsx von alten Dashboard-Routen
  - _Requirements: US-3.3, TR-4_

- [ ] 5.2 Admin Dashboard Zugriffsbeschränkung
  - Implementiere Super-Admin-Only Zugriff für /admin
  - Update ProtectedRoute für Admin-Bereiche
  - Teste Admin-Zugriffsbeschränkungen
  - _Requirements: US-3.1, TR-2_

- [ ] 5.3 Code und Referenzen Cleanup
  - Entferne imports zu alten Dashboard-Komponenten
  - Bereinige JSON-Dateien von alten Dashboard-Referenzen
  - Update i18n-Dateien für neue Dashboard-Struktur
  - _Requirements: US-3.4, TR-4_

## Phase 6: Performance und UX Optimierung

- [ ] 6. Dashboard Performance Optimierung
  - Implementiere Lazy Loading für Dashboard-Komponenten
  - Optimiere Widget-Loading mit Suspense
  - Implementiere Dashboard-Daten Caching
  - _Requirements: NFR-1_

- [ ] 6.1 Responsive Design Validierung
  - Teste Restaurant Dashboard auf allen Bildschirmgrößen
  - Teste VC Dashboard Responsiveness
  - Optimiere Mobile-Experience für beide Dashboards
  - _Requirements: US-1.4, US-2.4, NFR-2_

- [ ] 6.2 Accessibility und UX
  - Implementiere Accessibility-Features für Dashboards
  - Füge Keyboard-Navigation hinzu
  - Teste Screen-Reader Kompatibilität
  - _Requirements: NFR-2_

- [ ] 6.3 Mehrsprachige Unterstützung
  - Integriere i18n für alle Dashboard-Texte
  - Teste DE/EN Sprachunterstützung
  - Validiere Figma-Design Konsistenz in beiden Sprachen
  - _Requirements: NFR-2_

## Phase 7: Testing und Qualitätssicherung

- [ ] 7. Unit Tests für Dashboard-Komponenten
  - Schreibe Tests für RestaurantDashboard Komponente
  - Schreibe Tests für VCResultDashboard Komponente
  - Teste alle Widget-Komponenten einzeln
  - _Requirements: NFR-3_

- [ ] 7.1 Integration Tests
  - Teste Dashboard-Routing und Navigation
  - Teste API-Integration für beide Dashboards
  - Teste Token-Flow für VC Dashboard
  - _Requirements: Funktionale Tests_

- [ ] 7.2 E2E Tests
  - Teste kompletten Login → Restaurant Dashboard Flow
  - Teste VC-Token → VC Dashboard Flow
  - Teste Navigation zwischen verschiedenen Bereichen
  - _Requirements: Funktionale Tests_

- [ ] 7.3 Performance Tests
  - Messe Dashboard-Ladezeiten
  - Teste Bundle-Größen nach Optimierung
  - Validiere Performance-Ziele (< 2s Ladezeit)
  - _Requirements: NFR-1, Technische Tests_

## Phase 8: Deployment und Go-Live

- [ ] 8. Staging Deployment
  - Deploye alle Dashboard-Änderungen auf Staging
  - Teste vollständige Funktionalität auf Staging
  - Validiere alle URLs und Redirects
  - _Requirements: Deployment Tests_

- [ ] 8.1 Production Deployment
  - Führe Production Build durch
  - Deploye Frontend zu S3/CloudFront
  - Deploye Supabase Functions Updates
  - Invalidiere CloudFront Cache
  - _Requirements: Deployment Tests_

- [ ] 8.2 Post-Deployment Validierung
  - Teste alle Dashboard-URLs auf matbakh.app
  - Validiere VC-Token Funktionalität live
  - Teste Login → Dashboard Flow live
  - Monitore Error-Rates und Performance
  - _Requirements: Deployment Tests_

- [ ] 8.3 Monitoring und Dokumentation
  - Setup Dashboard-Performance Monitoring
  - Erstelle User-Guide für neue Dashboards
  - Dokumentiere API-Änderungen und neue Endpunkte
  - Erstelle Deployment-Report
  - _Requirements: Definition of Done_

## Hackathon Dokumentation

- [ ] 9. Hackathon Session Dokumentation
  - Dokumentiere alle Probleme und Lösungsansätze
  - Erstelle Before/After Screenshots der Dashboards
  - Dokumentiere Performance-Verbesserungen
  - Erstelle Technical Decision Log
  - _Requirements: Vollständige Dokumentation_

- [ ] 9.1 Lessons Learned Dokumentation
  - Dokumentiere Figma-zu-React Portierung Erkenntnisse
  - Erstelle Best Practices für Dashboard-Entwicklung
  - Dokumentiere Token-System Reparatur-Prozess
  - Erstelle Troubleshooting-Guide für ähnliche Probleme
  - _Requirements: Vollständige Dokumentation_