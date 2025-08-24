# 📦 Archivierter Code

In diesem Ordner liegen veraltete Komponenten und Flows, die durch React Router Navigation 
und neue Profile-/Onboarding-Komponenten ersetzt wurden.

## Enthaltene Ordner

- **old-flows/**  
  - `useAppNavigation-v1.ts` – alter Hook für `activeView`-Navigation  
  - `ProfileRoutes-v1.tsx` – ehem. Profile-Routing  
  - Ordner `Figma_Make/` mit alten Prototyp-Komponenten
  - Detaillierte Migration-Dokumentation in `old-flows/README.md`
- **old-visibility-onboarding/**  
  Alte Onboarding-Steps für Visibility Check (Version 1)
- **old-visibility-dashboard/**  
  Alte Dashboard-Views und Widgets (Version 1)
- **old-profile-flow/**  
  Alte Profile-Routing- und Navigations-Implementierungen

## Migration Status: ✅ ABGESCHLOSSEN

**Was wurde entfernt:**
- Alle `useAppNavigation` Hooks
- `activeView`-basierte Navigation
- `navigateToView` Funktionen
- Veraltete Onboarding-/Dashboard-Flows
- Props-basierte Navigation-Callbacks

**Was wurde eingeführt:**
- React Router v6 Navigation (`useNavigate`, `Link`)
- Geschützte Routen mit `ProtectedRoute`
- Browser-History-kompatible Navigation (`navigate(-1)`)
- Saubere Komponenten-Trennung ohne Props-Drilling

## Aktuelle Navigation

```
/profile           → MyProfile (geschützt)
/company-profile   → CompanyProfile (geschützt)
/dashboard/*       → Dashboard-Layout (geschützt)
/onboarding/*      → Neue Onboarding-Flows
```

> Diese Dateien sind nicht build-relevant und dienen nur als Referenz.  
> Nach finaler Abnahme können wir den gesamten `archive/`-Ordner löschen.

## Migration Timeline

- **2025-01-04:** Profile Flow archiviert und durch React Router ersetzt
- **2025-01-05:** Vollständiger Cleanup - `activeView`/`useAppNavigation` entfernt
- **Status:** **Production Ready** ✅