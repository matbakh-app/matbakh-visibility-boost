# Dashboard Transformation Requirements

## Übersicht

Komplette Transformation der Dashboard-Architektur von den aktuellen Admin/Owner Dashboards zu den spezifizierten Figma-Dashboards. Es sollen nur noch zwei Dashboards existieren:

1. **Restaurant Dashboard System** - Standard Dashboard für alle Nutzer/Subscribers
2. **VisibilityCheck Ergebnis Dashboard** - Spezifisches Dashboard für VC-Ergebnisse

## User Stories

### US-1: Restaurant Dashboard als Standard
**Als Restaurant-Besitzer** möchte ich nach dem Login das Restaurant Dashboard System sehen, **damit ich** alle wichtigen Geschäftskennzahlen auf einen Blick habe.

#### Acceptance Criteria
1. WHEN ich mich bei matbakh.app anmelde THEN lande ich auf `/dashboard` mit dem Restaurant Dashboard System
2. WHEN ich auf `/dashboard` navigiere THEN sehe ich das Figma Restaurant Dashboard System Layout
3. WHEN ich das Dashboard lade THEN werden alle Widgets aus der Figma-Spezifikation angezeigt
4. WHEN ich das Dashboard verwende THEN ist es vollständig responsive und funktional

### US-2: VC Ergebnis Dashboard
**Als Nutzer der einen VC durchgeführt hat** möchte ich meine Ergebnisse im spezialisierten VC Dashboard sehen, **damit ich** detaillierte Insights zu meiner Sichtbarkeit erhalte.

#### Acceptance Criteria
1. WHEN ich einen VC-Token verwende THEN lande ich auf `/vc/result` mit dem VC Ergebnis Dashboard
2. WHEN ich `/vc/result/dashboard` besuche THEN sehe ich das Figma VC Dashboard Layout
3. WHEN das VC Dashboard lädt THEN werden alle VC-spezifischen Widgets angezeigt
4. WHEN ich das VC Dashboard verwende THEN kann ich zwischen verschiedenen Ansichtsmodi wechseln

### US-3: Deaktivierung alter Dashboards
**Als System-Administrator** möchte ich alle alten Dashboard-Implementierungen deaktivieren, **damit nur** die neuen Figma-Dashboards verwendet werden.

#### Acceptance Criteria
1. WHEN ich `/admin` besuche THEN wird das Admin-Dashboard nur für Super-Admins angezeigt
2. WHEN ich alte Dashboard-URLs aufrufe THEN werde ich zu den neuen Dashboards weitergeleitet
3. WHEN ich die Navigation verwende THEN sind nur die neuen Dashboard-Links verfügbar
4. WHEN ich die App durchsuche THEN finde ich keine Referenzen zu alten Dashboards

### US-4: VC-Token Funktionalität
**Als Nutzer mit einem VC-Token** möchte ich direkt zu meinen Ergebnissen gelangen, **damit ich** schnell meine Visibility-Analyse sehen kann.

#### Acceptance Criteria
1. WHEN ich einen VC-Confirm-Link klicke THEN funktioniert die Token-Verarbeitung korrekt
2. WHEN der Token gültig ist THEN werde ich zum VC Ergebnis Dashboard weitergeleitet
3. WHEN der Token ungültig ist THEN sehe ich eine aussagekräftige Fehlermeldung
4. WHEN ich `/vc/result?t=token` aufrufe THEN wird das VC Dashboard mit meinen Daten geladen

## Technische Anforderungen

### TR-1: Figma Dashboard Integration
- Integration der kompletten Figma Restaurant Dashboard System Komponenten
- Integration der kompletten Figma VC Ergebnis Dashboard Komponenten
- Beibehaltung aller Figma Design-Spezifikationen
- Responsive Design für alle Bildschirmgrößen

### TR-2: Routing-Umstrukturierung
- `/dashboard` → Restaurant Dashboard System (Standard für alle Nutzer)
- `/vc/result` → VC Ergebnis Dashboard
- `/vc/result/dashboard` → VC Ergebnis Dashboard (alternative Route)
- `/admin/*` → Nur für Super-Admins zugänglich

### TR-3: Datenintegration
- Restaurant Dashboard: Integration mit bestehenden Business-Daten APIs
- VC Dashboard: Integration mit VC-Result APIs und Token-System
- Echte Datenanbindung für alle Widgets
- Fallback-Daten für Demo-Zwecke

### TR-4: Cleanup alter Implementierungen
- Entfernung/Deaktivierung von `OwnerOverview.tsx`
- Entfernung/Deaktivierung von `DashboardMain.tsx`
- Cleanup aller Referenzen in Navigation und Routing
- Archivierung alter Dashboard-Komponenten

## Nicht-funktionale Anforderungen

### NFR-1: Performance
- Dashboard-Ladezeit < 2 Sekunden
- Smooth Animationen und Übergänge
- Lazy Loading für schwere Widgets
- Optimierte Bundle-Größe

### NFR-2: Benutzerfreundlichkeit
- Intuitive Navigation zwischen Dashboards
- Konsistente UI/UX gemäß Figma-Designs
- Mehrsprachige Unterstützung (DE/EN)
- Accessibility-Compliance

### NFR-3: Wartbarkeit
- Modulare Widget-Architektur
- Klare Trennung zwischen Restaurant- und VC-Dashboard
- Dokumentierte Komponenten-APIs
- Testbare Implementierung

## Akzeptanzkriterien (Gesamt)

### Funktionale Tests
- [ ] Login führt zum Restaurant Dashboard
- [ ] VC-Token führt zum VC Dashboard
- [ ] Alle Figma-Widgets sind implementiert und funktional
- [ ] Alte Dashboards sind deaktiviert/entfernt
- [ ] Navigation ist aktualisiert
- [ ] Responsive Design funktioniert

### Technische Tests
- [ ] Alle API-Integrationen funktionieren
- [ ] Token-Verarbeitung ist korrekt
- [ ] Error-Handling ist implementiert
- [ ] Performance-Ziele sind erreicht
- [ ] Bundle-Größe ist optimiert

### Deployment Tests
- [ ] Dashboards sind live auf matbakh.app verfügbar
- [ ] Alle URLs funktionieren korrekt
- [ ] Cache-Invalidierung ist erfolgt
- [ ] Monitoring zeigt keine Fehler

## Prioritäten

1. **P0 (Kritisch)**: VC-Token Funktionalität reparieren
2. **P0 (Kritisch)**: Restaurant Dashboard als Standard implementieren
3. **P1 (Hoch)**: VC Ergebnis Dashboard implementieren
4. **P1 (Hoch)**: Alte Dashboards deaktivieren
5. **P2 (Mittel)**: Performance-Optimierungen
6. **P2 (Mittel)**: Vollständige Dokumentation

## Risiken und Abhängigkeiten

### Risiken
- Figma-Komponenten könnten Anpassungen für Integration benötigen
- Bestehende APIs könnten nicht alle benötigten Daten liefern
- Performance-Impact durch neue Dashboard-Komplexität

### Abhängigkeiten
- Figma Dashboard Komponenten müssen analysiert und portiert werden
- VC-Token System muss repariert werden
- Bestehende API-Endpunkte müssen validiert werden

## Definition of Done

- [ ] Beide Figma-Dashboards sind vollständig implementiert
- [ ] Alle User Stories sind erfüllt
- [ ] Alle technischen Anforderungen sind umgesetzt
- [ ] Alte Dashboards sind entfernt/deaktiviert
- [ ] System ist live und funktional auf matbakh.app
- [ ] Dokumentation ist vollständig
- [ ] Tests sind grün
- [ ] Performance-Ziele sind erreicht