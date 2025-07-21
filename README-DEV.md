
# 🛠️ Developer README

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check
```

## 📋 Important Development Notes

### 🔧 TypeScript & Supabase Types

**⚠️ CRITICAL: Nach jeder Supabase-Migration müssen die TypeScript-Typen aktualisiert werden!**

```bash
# Supabase-Typen neu generieren
npx supabase gen types typescript --project-id uheksobnyedarrpgxhju --schema public > src/integrations/supabase/types.ts
```

**Aktuelle temporäre Workarounds im Code:**
- Suche nach `TODO [TypeSafety]` für alle zu aktualisierende Stellen
- Dateien mit `as any` Casts: `src/hooks/useFacebookEventTemplates.ts`, `src/hooks/useLeadTracking.ts`

**Siehe auch:** [TYPE-UPGRADES.md](./TYPE-UPGRADES.md) für vollständigen Workflow

### 🗃️ Aktuelle untypisierte Tabellen
- `facebook_event_templates`
- `lead_events`
- `lead_sources` 
- `lead_todos`
- `lead_check_reports`

### 🔍 Build-Probleme beheben

Häufige TypeScript-Fehler nach Migrationen:
- `Property 'id' does not exist on type...` → Typen generieren
- `Argument of type 'string' is not assignable...` → Typen generieren
- `Cannot find name...` → Cache leeren & TypeScript neustarten

## 📁 Projekt-Struktur

```
src/
├── hooks/           # Custom React Hooks (⚠️ mit temporären any-Casts)
├── types/           # TypeScript Definitionen
├── integrations/    # Supabase Client & Types
└── ...
```

## 🔧 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run type-check   # TypeScript checking
npm run lint         # ESLint
```

## 🚨 Vor jedem Commit

1. [ ] `npm run type-check` ohne Fehler
2. [ ] Alle `TODO [TypeSafety]` bearbeitet (falls neue Tabellen)
3. [ ] Build erfolgreich

---

**Bei Fragen zur Type-Generierung:** Siehe [TYPE-UPGRADES.md](./TYPE-UPGRADES.md)
