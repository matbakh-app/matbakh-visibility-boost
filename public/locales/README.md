# Legal Locale Management

⚠️ **CTO-Governance für Legal-Übersetzungen** ⚠️

## Neue Sprachen hinzufügen

Für neue Sprachen (z.B. FR, IT, ES):

1. **Kopiere legal.json** nach `/public/locales/<sprache>/legal.json`
2. **Übersetze jeden Key** – keine KI/Auto-Übersetzung ohne CTO-Review!
3. **PR erst nach CTO-Sign-off** möglich
4. **Alle Keys müssen identisch** zu DE/EN sein (Structure Consistency!)

## Governance-Regeln

- Jede neue Sprache MUSS mit CTO abgesprochen und freigegeben werden!
- Änderungen an bestehenden legal.json Dateien NUR nach CTO-Freigabe
- Konsistenz-Check läuft automatisch in CI/CD
- Kein Merge ohne Legal-Review!

## Struktur-Consistency

**WICHTIG:** Alle Sprachen müssen identische JSON-Struktur haben:
- Gleiche Keys in allen Sprachen
- Gleiche Array-Strukturen
- Gleiche Verschachtelungstiefe

## Aktuell unterstützte Sprachen

- ✅ DE (Deutsch) - `/public/locales/de/legal.json`
- ✅ EN (English) - `/public/locales/en/legal.json`
- 🔄 Weitere Sprachen: Nach CTO-Freigabe

## CI/CD Integration

Das Konsistenz-Check-Skript (`/scripts/check-legal-locales.js`) prüft automatisch:
- Alle Keys sind in allen Sprachen vorhanden
- JSON-Struktur ist konsistent
- Keine fehlenden Übersetzungen

**Build bricht ab bei Inkonsistenzen!**