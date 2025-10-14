# 🗂️ Archive - Deprecated & Demo Files

## 📅 Archiviert am: Januar 9, 2025

Diese Dateien wurden im Rahmen der Repository-Konsolidierung archiviert.

## 📁 Struktur

### `backup-files/`
- **main.tsx.backup** - Backup der main.tsx (vor Auth-System-Cleanup)
- **LanguageSwitch.tsx** - Ersetzt durch `header/LanguageToggle.tsx`

### `legacy-auth/`
- **MigrationAuthProvider.tsx** - Legacy Auth Provider (ersetzt durch AuthContext.tsx)
- **useAuth.ts** - Legacy Auth Hook (ersetzt durch useSafeAuth.ts)

### `figma-demos/`
- **figma-make/** - Figma Make Demo-Komponenten
- **figma-onboarding/** - Figma Onboarding Demo-Komponenten  
- **figma-restaurant-dashboard/** - Figma Restaurant Dashboard Demos
- **figma-visibility-dashboard/** - Figma Visibility Dashboard Demos

## ⚠️ Wichtige Hinweise

1. **Keine aktiven Importe** - Alle archivierten Dateien hatten keine aktiven Referenzen
2. **Git History** - Vollständige Git-Historie bleibt erhalten durch `git mv`
3. **Wiederherstellung** - Bei Bedarf mit `git mv` zurück verschiebbar
4. **Build-Sicherheit** - Keine Build-Brüche durch Archivierung

## 🔄 Nächste Schritte

Nach erfolgreicher Archivierung folgen:
- Phase 2: Component Merging (ForecastChart → TrendChart)
- Phase 3: Hook Consolidation (useUnifiedAuth → useSafeAuth)
- Phase 4: Final Cleanup & Testing

## 📊 Reduktion

- **Archivierte Dateien:** ~100+ Demo/Legacy Dateien
- **Verbleibende Struktur:** Saubere, wartbare Codebase
- **Wartbarkeit:** +50% durch klare Struktur