# VSCode Jest Settings Fix

## Problem

Jest Watch Mode hängt und zeigt "exec-error" Status.

## Lösung

Füge diese Zeilen in `.vscode/settings.json` hinzu:

```json
    "jest.jestCommandLine": "npm test --",
    "jest.autoRun": {
        "watch": true,
        "onStartup": ["all-tests"]
    },
    "jest.monitorLongRun": 120000
```

## Schritt-für-Schritt:

1. **VSCode Settings öffnen:**

   - `Cmd + Shift + P`
   - `Preferences: Open Settings (JSON)`

2. **Jest Settings hinzufügen:**

   - Füge die obigen Zeilen vor der letzten `}` ein
   - Achte auf korrekte Komma-Setzung

3. **VSCode neu laden:**
   - `Cmd + Shift + P`
   - `Developer: Reload Window`

## Ergebnis

- Jest Watch Mode läuft stabil
- Keine "long-running tests" Warnungen mehr
- Keine "exec-error" Status mehr

## Backup der kompletten settings.json:

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.completeFunctionCalls": true,
  "typescript.suggest.includeAutomaticOptionalChainCompletions": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.importModuleSpecifierEnding": "minimal",
  "typescript.inlayHints.enumMemberValues.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.parameterTypes.enabled": true,
  "typescript.inlayHints.propertyDeclarationTypes.enabled": true,
  "typescript.inlayHints.variableTypes.enabled": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit",
    "source.removeUnusedImports": "explicit"
  },
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.formatOnType": true,
  "editor.quickSuggestions": {
    "other": "on",
    "comments": "on",
    "strings": "on"
  },
  "editor.suggest.insertMode": "replace",
  "editor.suggest.snippetsPreventQuickSuggestions": false,
  "editor.tabCompletion": "on",
  "editor.wordBasedSuggestions": "matchingDocuments",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "path-intellisense.mappings": {
    "@": "${workspaceRoot}/src"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true,
    "**/src/archive": true,
    "**/.git": true,
    "**/test-results": true,
    "**/playwright-report": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/coverage/**": true,
    "**/src/archive/**": true,
    "**/.git/**": true,
    "**/test-results/**": true,
    "**/playwright-report/**": true
  },
  "jest.jestCommandLine": "npm test --",
  "jest.autoRun": {
    "watch": true,
    "onStartup": ["all-tests"]
  },
  "jest.monitorLongRun": 120000
}
```
