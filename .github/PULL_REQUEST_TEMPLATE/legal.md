# Legal Change Checklist

⚠️ **Rechtliche Änderungen erfordern besondere Sorgfalt!** ⚠️

## CTO-Governance Checklist

- [ ] **Änderungen an `/public/locales/(de|en)/legal.json` wurden vom CTO explizit freigegeben**
- [ ] **Kein Merge ohne CTO-Review!**
- [ ] **Changelog am Dateianfang mit Zeitstempel und Bearbeiter ergänzt**
- [ ] **Alle Sprachen (DE/EN) synchron aktualisiert**
- [ ] **Konsistenz-Check (`npm run check-legal`) erfolgreich**

## Inhaltliche Prüfung

- [ ] Rechtschreibung und Grammatik geprüft
- [ ] Juristische Korrektheit bestätigt
- [ ] Alle `lastUpdated` Felder aktualisiert
- [ ] Keine technischen/sensiblen Daten in Rechtstexten

## Technische Validierung

- [ ] JSON-Syntax korrekt (keine Kommentare in Inhalten)
- [ ] Alle Keys in beiden Sprachen vorhanden
- [ ] Arrays korrekt strukturiert
- [ ] Keine Duplikate in anderen Übersetzungsdateien

## Dokumentation

**Beschreibung der Änderungen:**
- Was wurde geändert?
- Warum war die Änderung notwendig?
- Welche rechtlichen Aspekte wurden berücksichtigt?

**CTO-Freigabe:**
- [ ] CTO hat diese Änderung vorab freigegeben
- [ ] Externe rechtliche Beratung eingeholt (falls erforderlich)

---

⚠️ **WICHTIG:** Ohne vollständige CTO-Freigabe wird diese PR automatisch abgelehnt!

**Bei Fragen:** Kontaktiere den CTO bevor du rechtliche Inhalte änderst.