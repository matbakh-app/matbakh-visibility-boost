# 📦 Archiv

In diesem Ordner liegen alle bisherigen Versionen der Visibility-Check- und Profile-Flows, die 
mittlerweile durch die neuen React-Router-basierten Komponenten ersetzt wurden.

## Ordner

- `old-visibility-onboarding/`  
  Alte Onboarding-Steps für Visibility Check (Version 1).
- `old-visibility-dashboard/`  
  Alte Dashboard-Views und Widgets (Version 1).
- `old-profile-flow/`  
  Alte Profile-Routing- und Navigations-Implementierungen.

## Was wurde archiviert?

### Profile Flow (Archiviert am: 2025-01-04)
- `ProfileRoutes-v1.tsx` - Alte Route-Definitionen mit props-basierten Callbacks
- Grund: Ersetzt durch React Router Navigation in App.tsx

### Visibility Check Components
- Alte Step-basierte Onboarding-Komponenten
- Alte Dashboard-Implementierungen mit proprietärer Navigation
- Grund: Ersetzt durch neue modulare Architektur

> **Hinweis:** Diese Dateien werden nicht mehr build- oder runtime-mäßig genutzt. Sie sind hier 
> nur zur Referenz und können nach endgültiger Abnahme gelöscht werden.

## Migration Notes

- Alle Callbacks (`onNavigateToCompanyProfile`, `onBack`) wurden durch `useNavigate` ersetzt
- Route-Definitionen wurden von komponenten-internen Zuständen zu zentralen App.tsx-Routen verschoben
- `window.location.href` Assignments wurden durch React Router Navigation ersetzt