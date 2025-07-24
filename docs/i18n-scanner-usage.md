
# 🔍 i18next-scanner Usage Guide

## Übersicht

Das i18next-scanner Tool automatisiert die Verwaltung von Übersetzungskeys in der matbakh.app. Es scannt den gesamten Code nach verwendeten `t()` Funktionen und aktualisiert die JSON-Dateien entsprechend.

## 🚀 Verwendung

### Basis-Scan ausführen
```bash
npm run i18n:scan
```

### Debug-Modus (detaillierte Ausgabe)
```bash
npm run i18n:scan:debug
```

### Vollständige Validierung
```bash
npm run i18n:full-check
```

### Manuelle Validierung
```bash
node scripts/i18n-scanner-validation.js
```

## 📁 Konfiguration

Die Konfiguration liegt in `i18next-scanner.config.js` im Projekt-Root:

### Wichtige Einstellungen:
- **input**: Scannt alle `.tsx/.ts` Dateien in `src/`
- **removeUnusedKeys**: Entfernt nicht verwendete Keys
- **sort**: Sortiert Keys alphabetisch
- **lngs**: Unterstützte Sprachen (de, en)
- **ns**: Alle verfügbaren Namespaces

### Unterstützte Funktionen:
- `t()` - Standard Translation
- `i18next.t()` - Explizite i18next Calls
- `getTranslation()` - Custom Helper
- `safeT()` - Sichere Translation mit Fallback

## 🔧 Namespaces

Aktuell unterstützte Namespaces:
- `translation` (Standard)
- `auth` (Authentifizierung)
- `admin` (Admin-Panel)
- `dashboard` (Dashboard)
- `landing` (Landing Page)
- `packages` (Pakete)
- `services` (Services)
- `navigation` (Navigation)
- `legal-*` (Rechtliche Seiten)
- und weitere...

## 📊 Validierung

Das erweiterte Validierungsscript prüft:

### ✅ Automatische Checks:
- Leere oder fehlende Keys
- Inkonsistenzen zwischen DE/EN
- Syntaxfehler in JSON-Dateien
- Verfügbarkeit aller Namespace-Dateien

### 📋 Bericht-Ausgabe:
```
📊 Statistiken:
   - Leere Keys: 3
   - Inkonsistente Namespaces: 1

🔍 Leere Keys:
   - de/landing: problem.missed.example
   - en/auth: messages.technicalError

⚠️  Inkonsistenzen:
   - landing:
     * Fehlt in DE: problem.overwhelmed.example
     * Fehlt in EN: solution.timeSaving.title
```

## 🛠️ Workflow

### Empfohlener Entwicklungsablauf:
1. **Code schreiben** mit `t('key.name')`
2. **Scanner ausführen**: `npm run i18n:scan`
3. **Validierung prüfen**: `npm run i18n:full-check`
4. **Texte ergänzen** in JSON-Dateien
5. **Erneute Validierung**: `npm run i18n:validate`

### Bei neuen Features:
1. Keys im Code verwenden
2. Scanner ausführen
3. Beide Sprachen (DE/EN) ausfüllen
4. Testen in beiden Sprachen

## 🚨 Troubleshooting

### Häufige Probleme:

**Scanner findet Keys nicht:**
- Prüfen Sie die Funktionsnamen in der Konfiguration
- Überprüfen Sie die input-Pfade
- Debug-Modus aktivieren

**Inkonsistente Namespaces:**
- Beide Sprachen müssen dieselben Keys haben
- Führen Sie eine manuelle Validierung durch

**Leere Keys:**
- Füllen Sie alle Keys mit sinnvollen Texten
- Verwenden Sie Fallbacks für kritische Keys

## 📈 Best Practices

### Key-Naming:
```javascript
// ✅ Gut
t('dashboard.kpi.visitors.title')
t('auth.login.form.email')

// ❌ Schlecht
t('title')
t('button1')
```

### Namespace-Auswahl:
- `translation` für allgemeine Inhalte
- `auth` für Authentifizierung
- `dashboard` für Dashboard-spezifische Texte
- `legal-*` für rechtliche Inhalte

### Fallbacks verwenden:
```javascript
// ✅ Empfohlen
t('dashboard.title', 'Dashboard')

// ❌ Riskant
t('dashboard.title')
```

## 🔒 Sicherheit

### Validierung:
- Alle Keys werden automatisch auf XSS geprüft
- Gefährliche Inhalte werden blockiert
- Sichere Fallbacks werden generiert

### Produktionsumgebung:
- Keine Debug-Ausgaben
- Graceful Degradation bei fehlenden Keys
- Performance-optimierte Ladevorgänge

## 📅 Wartung

### Regelmäßige Aufgaben:
- **Wöchentlich**: `npm run i18n:scan` ausführen
- **Vor Releases**: Vollständige Validierung
- **Bei neuen Features**: Namespace-Prüfung

### Überwachung:
- Console-Logs auf Missing Keys prüfen
- SessionStorage für Debug-Informationen nutzen
- Automatische Reports bei CI/CD

---

**Weitere Informationen:** Siehe auch `docs/i18n-system.md` für die grundlegende i18n-Architektur.
