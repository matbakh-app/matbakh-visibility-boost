
# 🔧 TypeScript Type Upgrades - Supabase Integration

## 📋 Übersicht

Dieses Dokument beschreibt den Prozess zur Aktualisierung der TypeScript-Typen nach Supabase-Migrationen und erklärt die temporären `as any` Workarounds im Code.

## 🚨 Aktueller Status

**Neue Tabellen seit letzter Type-Generation:**
- `facebook_event_templates`
- `lead_events` 
- `lead_sources`
- `lead_todos`
- `lead_check_reports`

**Betroffene Dateien mit temporären Workarounds:**
- `src/hooks/useFacebookEventTemplates.ts`
- `src/hooks/useLeadTracking.ts`

## 🔄 Type-Upgrade Workflow

### 1. Nach jeder Supabase-Migration

```bash
# Supabase-Typen neu generieren
npx supabase gen types typescript --project-id uheksobnyedarrpgxhju --schema public > src/integrations/supabase/types.ts
```

### 2. TypeScript-Cache leeren

```bash
# IDE neustarten oder
tsc --noEmit
```

### 3. TODO-Kommentare im Code suchen und ersetzen

Suche nach: `TODO [TypeSafety]`

### 4. Temporäre `as any` Casts entfernen

**Vorher:**
```ts
const { data, error } = await supabase
  .from('new_table' as any)
  .select('*');

const safeData: any = data;
```

**Nachher:**
```ts
const { data, error } = await supabase
  .from('new_table')
  .select('*');
```

## 🔍 Bekannte Probleme & Lösungen

### Problem: "Property 'id' does not exist on type..."

**Ursache:** Supabase-Typen wurden nach Migration nicht regeneriert.

**Lösung:** Type-Generation ausführen (siehe Schritt 1).

### Problem: "Argument of type 'string' is not assignable to parameter..."

**Ursache:** Tabellen-Name ist in aktuellen Typen nicht bekannt.

**Temporärer Fix:** `as any` Cast verwenden
**Dauerhafte Lösung:** Type-Generation ausführen

## 📝 Checklist für Type-Upgrade

- [ ] Supabase-Typen generiert
- [ ] TypeScript-Cache geleert  
- [ ] Alle `TODO [TypeSafety]` Kommentare bearbeitet
- [ ] `as any` Casts durch echte Typen ersetzt
- [ ] Build erfolgreich ohne TypeScript-Fehler
- [ ] Alle Tests laufen durch

## 🎯 Best Practices

1. **Immer nach Migrationen:** Type-Generation nicht vergessen
2. **Team-Sync:** Alle Entwickler informieren nach Type-Updates
3. **CI/CD:** Type-Generation in Build-Pipeline integrieren (optional)
4. **Dokumentation:** Neue Tabellen in diesem Dokument listen

## 🔗 Links

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [TypeScript Supabase Integration](https://supabase.com/docs/guides/api/generating-types)

---

**Letztes Update:** $(date)
**Nächste geplante Type-Generation:** Nach nächster Migration
