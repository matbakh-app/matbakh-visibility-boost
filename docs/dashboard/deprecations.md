# Dashboard Deprecations

**Zweck:** Dokumentation aller zu entfernenden Dashboard-bezogenen Dateien mit Begründung und Commit-Referenzen.

## Deprecation-Log

*Noch keine Deprecations durchgeführt. Einträge werden hier dokumentiert, wenn redundante Dateien identifiziert und entfernt werden.*

## Format für Einträge

```markdown
### [DATUM] - Dateiname
**Pfad:** `docs/path/to/file.md`
**Grund:** Redundant zu neuer Spec `docs/dashboard/specs/type/spec_id.md`
**Commit:** [commit-hash]
**Ersetzt durch:** `docs/dashboard/specs/kpi/example.md`
```

## Geplante Deprecations

**Nach Spec-Erstellung:**
- Redundante Dashboard-Konzept-Dateien konsolidieren
- Doppelte KPI-Definitionen entfernen
- Veraltete Integration-Reports archivieren

*Konkrete Einträge folgen nach Review der erstellten Specs.*--
-

## Wave-1 Vorschläge (Deprecation-Kandidaten)

**Status:** Proposed - Awaiting User Approval  
**Zeitstempel:** 25. Januar 2025

### Dashboard-Konzept Konsolidierung

#### docs/Dashboard Entwicklung 243cc947bd7880589b66e819132c7a5e.md
**Ersetzt durch:** `docs/dashboard/catalog.md` + spezifische Spec-Dateien  
**Begründung:** Redundant zu neuer strukturierter Dashboard-Spezifikation  
**Migrationsnotizen:** Visibility Hub Konzept → `vc.kpi.total_visibility`, Widget-System → View-Definitionen  
**Status:** proposed

#### docs/vc-complete-vision-2025.md (Dashboard-Abschnitte)
**Ersetzt durch:** `docs/dashboard/catalog.md` + `docs/specs/vc/vision.vc-spec.md`  
**Begründung:** Dashboard-spezifische Inhalte in separaten Specs besser aufgehoben  
**Migrationsnotizen:** Widget-System → Catalog Views, Persona-Anpassungen → Vision Spec  
**Status:** proposed

### Integration-Reports Konsolidierung

#### docs/dashboard-connections-report.md
**Ersetzt durch:** `docs/audits/dashboard-inventory.md`  
**Begründung:** Überlappung mit neuem Inventory-System  
**Migrationsnotizen:** Widget-Integration Status → Inventory Mapping-Tabelle  
**Status:** proposed

#### docs/dashboard-integration-status-bericht.md
**Ersetzt durch:** `docs/audits/dashboard-figma-mapping.md`  
**Begründung:** Detaillierte Integration-Infos in Figma-Mapping besser strukturiert  
**Migrationsnotizen:** Integrationsstatus → Review-Status Tabelle  
**Status:** proposed

### KPI-Definitionen Vereinheitlichung

#### Mehrfache Gewichtungs-Definitionen
**Betroffen:** `docs/specs/vc/requirements.vc-spec.md`, `docs/data-management-concept.md`  
**Ersetzt durch:** `docs/specs/_contracts/kpi_vc_total.json`  
**Begründung:** Einheitliche Formel-Definition verhindert Inkonsistenzen  
**Migrationsnotizen:** Google 40%, Social 30%, Website 20%, Other 10% → JSON Contract  
**Status:** proposed

### Persona-Definitionen Zentralisierung

#### Verteilte Persona-Beschreibungen
**Betroffen:** `docs/STEP 1 User Journey & Personas 240cc947bd7880dd9e23e2a72485fbb1.md` (Dashboard-Teile)  
**Ersetzt durch:** `docs/dashboard/persona-map.md` (zu erstellen)  
**Begründung:** Dashboard-spezifische Persona-Anpassungen zentral verwalten  
**Migrationsnotizen:** Zeitknapp/Überfordert/Skeptiker/Profi → Persona-Map mit Dashboard-Varianten  
**Status:** proposed

## Nächste Schritte

1. **User-Approval:** Warten auf Freigabe für Wave-1 Deprecations
2. **Persona-Map erstellen:** `docs/dashboard/persona-map.md` als Ersatz für verteilte Definitionen
3. **Migration durchführen:** Inhalte in neue Struktur überführen
4. **Cleanup:** Deprecated Dateien entfernen und Querverweise aktualisieren

## Risiko-Bewertung

- **Niedrig:** Catalog und Contracts sind vollständig spezifiziert
- **Mittel:** Persona-Map muss noch erstellt werden
- **Hoch:** Keine kritischen Abhängigkeiten identifiziert
### W
ave-2 (VC Comprehensive System Integration)

#### Current VC Quick Flow Evolution
**Betroffen:** `.kiro/specs/vc/requirements.vc-spec.md`, `.kiro/specs/vc/vision.vc-spec.md`  
**Ersetzt durch:** `.kiro/specs/vc-comprehensive-system/requirements.md`, `.kiro/specs/vc-comprehensive-system/vision.md`  
**Begründung:** Evolution von einfachem Email-Flow zu umfassendem Business Intelligence System  
**Migrationsnotizen:** 
- `/vc/quick` → `/vc` mit Entry Point Detection
- Email-only → Enhanced Identification mit Teaser Results  
- AWS-only → Multi-Provider mit Evidence Tracking
- Basic DOI → Comprehensive Attribution und Analytics
**Status:** proposed · Owner: product · Migration: preserve existing API contracts, add new endpoints, gradual rollout

#### Legacy Entry Points Consolidation
**Betroffen:** Duplicate landing teasers, scattered VC widgets  
**Ersetzt durch:** `view_id: vc_teaser_inline`, `spec_ids: entry_points, teaser_result`  
**Begründung:** Unified entry point system with consistent tracking  
**Migrationsnotizen:** Unify copy & events, retire old widget IDs in next release  
**Status:** proposed · Owner: product