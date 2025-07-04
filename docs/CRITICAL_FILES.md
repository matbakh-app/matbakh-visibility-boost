# 🚨 Kritische Dateien - Navigation & Routing

## Übersicht

Diese Dateien steuern die gesamte Website-Navigation und dürfen **NIEMALS** ohne explizite Genehmigung geändert werden.

## Kritische Dateien

| Datei | Zweck | Auswirkung bei Änderung |
|-------|-------|------------------------|
| `src/components/navigation/NavigationConfig.ts` | Einzelne Quelle aller Haupt-Links | Komplette Navigation bricht |
| `public/locales/de/nav.json` | Deutsche Navigationslabels | Deutsche Menüs zeigen Fehler |
| `public/locales/en/nav.json` | Englische Navigationslabels | Englische Menüs zeigen Fehler |
| `src/components/header/NavigationMenu.tsx` | Desktop Navigation | Desktop-Menü funktioniert nicht |
| `src/components/navigation/MobileMenu.tsx` | Mobile Navigation | Mobile-Menü funktioniert nicht |
| `src/App.tsx` | Route → Component Mapping | URLs führen ins Leere |
| `public/sitemap.xml` | SEO-relevante URL-Liste | Google kann Seiten nicht finden |

## 4-Schritt-Prozess vor Änderungen

### 1. Absprache
- Issue erstellen mit Beschreibung der geplanten Änderung
- Product-Owner Genehmigung einholen
- Impact-Analyse durchführen

### 2. Impact-Analyse
- Welche URLs werden betroffen?
- Bleiben `/angebote` und `/packages` funktional?
- Sind DE/EN Übersetzungen konsistent?
- Muss `sitemap.xml` angepasst werden?

### 3. Review
- `npm run check:nav` lokal ausführen
- Code-Review von mindestens 1 Maintainer
- Testlauf auf Staging-Environment

### 4. Deploy
- Monitoring nach Deployment aktivieren
- 404-Fehler in Analytics überwachen
- Rollback-Plan bereithalten

## Automatische Validierung

Das System prüft automatisch kritische Navigation-Keys:

```bash
npm run check:nav
```

Diese Prüfung schlägt fehl, wenn wichtige Navigation-Elemente fehlen:
- `home`
- `offers` (für /angebote und /packages)
- `services`
- `contact`

## Notfall-Kontakt

Bei kritischen Navigation-Problemen sofort Product-Owner kontaktieren und Emergency-Rollback durchführen.

---

**⚠️ Merke: Navigation funktioniert aktuell perfekt - keine Änderungen ohne triftigen Grund!**