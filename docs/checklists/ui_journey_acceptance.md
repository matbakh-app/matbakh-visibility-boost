# UI Journey Acceptance Checklist

## Invisible UI Mode
- [ ] Toggle „Standard | Kompakt (ohne Scrollen) | System" vorhanden & persistent.
- [ ] VCResult (Invisible): Top-3 ohne Scroll auf Mobile sichtbar.
- [ ] Follow-ups (3–5 Chips) funktionieren; Details per ExpandPanel.
- [ ] Tonalitäts-Präferenz „female_pref" ändert nur Ton, nie die Fakten.
- [ ] Analytics feuern: ui_mode_changed, inv_answer_view, inv_primary_cta_click.

## Standard UI Mode
- [ ] Listen/Tabellen vollständig sichtbar
- [ ] Alle Details ohne zusätzliche Klicks verfügbar
- [ ] Persona-spezifische Anpassungen funktionieren

## Cross-Mode Requirements
- [ ] Moduswechsel ohne Datenverlust
- [ ] Einstellungen persistent über Sessions
- [ ] Responsive Design auf allen Geräten