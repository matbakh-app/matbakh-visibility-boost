# Dashboard Spec Templates

## Verwendung

Diese Templates definieren die Struktur für alle Dashboard-Komponenten:

- **kpi.md**: Key Performance Indicators mit Formeln und Persona-Anpassungen
- **chart.md**: Visualisierungen mit Data Contracts und Accessibility
- **rule.md**: Empfehlungsregeln mit ROI-Berechnung und One-Click-Actions

## Template-Workflow

1. **Template kopieren**: Entsprechende .md Datei als Basis verwenden
2. **Frontmatter ausfüllen**: dashboard_id, spec_id, source_of_truth setzen
3. **Inhalte anpassen**: Alle Platzhalter durch konkrete Werte ersetzen
4. **Contracts erstellen**: JSON-Schema in _contracts/ Ordner ablegen
5. **Inventory aktualisieren**: Neue Spec in dashboard-inventory.md eintragen

## Governance-Regeln

- **Eindeutigkeit**: Jede spec_id darf nur einmal existieren
- **Canonical Flag**: Nur eine Datei pro spec_id darf canonical: true haben
- **Evidence**: Alle Metriken benötigen dokumentierte Datenquellen
- **Personas**: Mindestens eine Persona-Anpassung pro Komponente

## Qualitätssicherung

- Frontmatter vollständig ausgefüllt
- Alle Platzhalter ersetzt
- JSON-Contract erstellt und validiert
- Microcopy in DE/EN vorhanden
- Edge Cases dokumentiert