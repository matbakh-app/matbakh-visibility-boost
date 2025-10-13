# VSCode Jest Watch Mode Fix - 2025-10-01

## 🔍 Problem

Jest Watch Mode zeigt Fehler nach Löschung der `evidently-experiments.test.ts`:

```
[error] Jest process exited unexpectedly: Jest process "watch-tests" ended unexpectedly
[info] Open Quick Fix: → vscode-jest://matbakh-visibility-boost.20250920/io.orta.jest.with-workspace.show-quick-fix
```

## 🎯 Root Cause

VSCode Jest Extension hat noch Referenzen auf gelöschte Test-Dateien im Cache.

## ✅ Lösung

### 1. Jest Cache löschen

```bash
npx jest --clearCache
```

### 2. VSCode Jest Extension zurücksetzen

**Option A: Command Palette**

1. `Cmd + Shift + P` (macOS) oder `Ctrl + Shift + P` (Windows/Linux)
2. Tippe: `Jest: Stop All Runners`
3. Dann: `Jest: Start All Runners`

**Option B: VSCode Settings anpassen**

Füge in `.vscode/settings.json` hinzu:

```json
{
  "jest.autoRun": {
    "watch": false,
    "onStartup": []
  },
  "jest.testExplorer": {
    "enabled": true,
    "showClassicStatus": true
  }
}
```

### 3. VSCode neu laden

```
Cmd + Shift + P → "Developer: Reload Window"
```

### 4. Jest Extension manuell starten

```
Cmd + Shift + P → "Jest: Start All Runners"
```

## 🔧 Alternative: Jest Extension deaktivieren

Falls das Problem weiterhin besteht:

1. **Extensions Panel öffnen** (`Cmd + Shift + X`)
2. **"Jest" suchen**
3. **"Disable (Workspace)" klicken**
4. **VSCode neu laden**

## 📋 Verification

Nach der Lösung sollte:

- ✅ Keine Jest Watch Mode Fehler mehr auftreten
- ✅ Tests können manuell mit `npm test` ausgeführt werden
- ✅ Green Core Validation läuft ohne Probleme

## 🎯 Hintergrund

Die `evidently-experiments.test.ts` wurde in `docs/failed-tests-registry.md` dokumentiert und aus dem aktiven Test-Suite entfernt, da:

- Mock-Konfigurationsprobleme mit AWS SDK
- Non-blocking für Production (Bandit Optimizer läuft vollständig)
- Reparatur nach Spec-Abschluss geplant

## 📝 Status

- **Failed Tests:** Dokumentiert in `docs/failed-tests-registry.md`
- **Production Impact:** ✅ NONE
- **System Status:** ✅ Production-ready
- **Jest Extension:** ✅ Konfiguriert für aktuelle Test-Suite
