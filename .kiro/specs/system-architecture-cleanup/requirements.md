# System Architecture Cleanup & Reintegration - Requirements

## Introduction

Das matbakh.app System hat durch verschiedene Entwicklungsphasen (Vercel-Supabase-Ära, Lovable/MVP-Zeit, Kiro-Neuaufbau) eine "API- und Architektur-Schizophrenie" entwickelt. Verschiedene Systemgenerationen existieren parallel und arbeiten teilweise gegeneinander. Ziel ist die Bereinigung zu einem reinen, funktionierenden Kiro-System.

## Requirements

### Requirement 1: Architektur-Dokumentation & Kontrollpunkt

**User Story:** Als CTO möchte ich eine vollständige Übersicht aller existierenden Systemkomponenten und deren Herkunft, damit ich fundierte Aufräumentscheidungen treffen kann.

#### Acceptance Criteria

1. WHEN das System analysiert wird THEN SHALL eine vollständige Architektur-Map erstellt werden mit Pfad, Ursprung (Lovable/Supabase/Kiro), Nutzungsstatus und Teststatus
2. WHEN Komponenten identifiziert werden THEN SHALL deren aktive Nutzung im Frontend/Backend validiert werden
3. WHEN Kiro-Alternativen existieren THEN SHALL diese explizit dokumentiert werden
4. WHEN die Analyse abgeschlossen ist THEN SHALL eine priorisierte Aufräum-Roadmap erstellt werden

### Requirement 2: Gezielte API-Test-Validierung

**User Story:** Als Entwickler möchte ich nur validierte und funktionsfähige Tests ausführen, damit ich keine Zeit mit fehlerhaften Legacy-Tests verschwende.

#### Acceptance Criteria

1. WHEN Tests selektiert werden THEN SHALL nur Kiro-überarbeitete oder produktiv genutzte Komponenten getestet werden
2. WHEN die source-test-coverage-map.json verwendet wird THEN SHALL eine sichere Test-Auswahl getroffen werden
3. WHEN Tests ausgeführt werden THEN SHALL ein safe-test-report.md generiert werden
4. WHEN Interface-Mismatches erkannt werden THEN SHALL diese vor der Ausführung behoben oder ausgeschlossen werden

### Requirement 3: Legacy-Frontend-Bereinigung

**User Story:** Als System-Architekt möchte ich alle nicht mehr genutzten Frontend-Komponenten entfernen, damit das System sauber und wartbar bleibt.

#### Acceptance Criteria

1. WHEN Legacy-Komponenten identifiziert werden THEN SHALL diese systematisch aus pages/, components/, layouts/, lib/ entfernt werden
2. WHEN Komponenten aus Supabase/Lovable-Phase stammen THEN SHALL diese nur entfernt werden wenn keine Backend-Funktion getriggert wird
3. WHEN zentrale Views umgeleitet werden THEN SHALL diese auf neue Kiro-Dashboards zeigen (/upload, /vc, /onboarding, /reports, /dashboard)
4. WHEN Löschungen durchgeführt werden THEN SHALL ein Backup in src/deprecated/ erstellt werden

### Requirement 4: Versionssperren & Branch-Cleanup

**User Story:** Als DevOps-Verantwortlicher möchte ich verhindern, dass Altlasten wieder ins System gelangen, damit die Architektur-Sauberkeit dauerhaft erhalten bleibt.

#### Acceptance Criteria

1. WHEN Branches bereinigt werden THEN SHALL nur main, kiro-dev, aws-deploy aktiv bleiben
2. WHEN Versionshinweise erstellt werden THEN SHALL diese in README.md, src/deprecated/, deployment-notes/ dokumentiert werden
3. WHEN ARCHIVED-FEATURES.md erstellt wird THEN SHALL diese alle entfernten Features mit Begründung auflisten
4. WHEN Branch-Protection aktiviert wird THEN SHALL verhindert werden dass Legacy-Code wieder eingecheckt wird

### Requirement 5: Kiro-System-Validierung

**User Story:** Als Qualitätssicherer möchte ich sicherstellen, dass nach dem Cleanup nur noch Kiro-generierte und validierte Komponenten aktiv sind.

#### Acceptance Criteria

1. WHEN das Cleanup abgeschlossen ist THEN SHALL das System ausschließlich Kiro-APIs verwenden
2. WHEN Tests ausgeführt werden THEN SHALL nur Kiro-konfigurierte Testframeworks verwendet werden
3. WHEN Auth/Dashboard/Upload/VC-Komponenten geprüft werden THEN SHALL diese ausschließlich Kiro-basiert sein
4. WHEN die Validierung abgeschlossen ist THEN SHALL ein System-Reinheits-Zertifikat erstellt werden

## Success Criteria

- **Architektur-Klarheit:** 100% der Systemkomponenten sind dokumentiert und kategorisiert
- **Test-Effizienz:** Nur validierte Tests werden ausgeführt, 0% falsch-positive Ergebnisse
- **Code-Sauberkeit:** Alle Legacy-Komponenten sind entfernt oder archiviert
- **System-Reinheit:** 100% Kiro-basierte Architektur ohne Altlasten
- **Zukunftssicherheit:** Branch-Protection verhindert Regression zu gemischten Systemen

## Non-Functional Requirements

- **Performance:** Cleanup-Prozess soll in <4 Stunden abgeschlossen sein
- **Sicherheit:** Keine produktiven Daten dürfen während des Cleanups verloren gehen
- **Rollback:** Vollständige Wiederherstellbarkeit durch Backup-System
- **Documentation:** Jeder Schritt muss nachvollziehbar dokumentiert werden