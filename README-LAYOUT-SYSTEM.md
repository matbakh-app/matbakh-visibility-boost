
# 🏗️ Layout & i18n System Documentation

## 📋 Übersicht

Dieses Dokument beschreibt das zentrale Layout-System und die i18n-Namespace-Architektur der matbakh.app.

## 🎯 Layout-Komponenten

### Zentrale Layout-Dateien

| Layout | Verwendung | Enthält |
|--------|------------|---------|
| `AppLayout.tsx` | Alle öffentlichen Seiten | Header, Footer, Logo zentral |
| `LegalLayout.tsx` | Rechtliche Seiten | Minimaler Header, Fokus auf Content |
| `DashboardLayout.tsx` | Partner-Dashboard & Unterseiten | Sidebar, Navigation, Header |
| `AdminLayout.tsx` | Admin-Bereiche | Admin-Navigation, Header |

### Logo-Integration

- **Zentral:** `Header.tsx` enthält das Logo
- **Einzige Quelle:** Logo wird nur einmal gerendert
- **Überall sichtbar:** Durch zentrale Layouts auf allen Seiten

## 🌐 i18n-Namespace-Struktur

### Core Namespaces

| Namespace | Inhalt | Verwendung |
|-----------|--------|------------|
| `common` | Basis-Übersetzungen | Buttons, Aktionen, Status |
| `translation` | Legacy-Inhalte | Wird schrittweise aufgelöst |

### Feature-Namespaces

| Namespace | Inhalt | Verwendung |
|-----------|--------|------------|
| `landing` | Landing-Page Texte | Hero, CTAs, Services |
| `packages` | Paket-Informationen | Titel, Beschreibungen, Preise |
| `services` | Service-Details | Features, Benefits, Beschreibungen |
| `pricing` | Preisgestaltung | Vergleiche, FAQ, Prozesse |
| `admin` | Admin-Interface | Verwaltung, Navigation, Status |
| `dashboard` | Dashboard-Texte | KPIs, Charts, Aktionen |

### Legal Namespaces

| Namespace | Inhalt |
|-----------|--------|
| `legal-impressum` / `legal-imprint` | Impressum |
| `legal-datenschutz` / `legal-privacy` | Datenschutz |
| `legal-agb` / `legal-terms` | AGB |

## 🚀 Neue Seiten erstellen

### 1. Layout wählen

```tsx
// Öffentliche Seite
<AppLayout>
  <MeinContent />
</AppLayout>

// Dashboard-Seite
<DashboardLayout>
  <MeinDashboard />
</DashboardLayout>

// Admin-Seite
<AdminLayout>
  <MeinAdmin />
</AdminLayout>
```

### 2. i18n-Namespace verwenden

```tsx
const { t } = useTranslation('mein-namespace');

// Texte aus JSON laden
<h1>{t('title')}</h1>
<p>{t('description')}</p>
```

### 3. JSON-Dateien erstellen

```
public/locales/de/mein-namespace.json
public/locales/en/mein-namespace.json
```

## 📝 Content-Management

### Phase 1: JSON-basiert ✅
- Alle Texte in strukturierten JSON-Dateien
- Flache Hierarchien für bessere Wartbarkeit
- Separate Namespaces pro Feature

### Phase 2: Admin-Interface (geplant)
- Grafische Bearbeitungsmasken
- Live-Vorschau der Änderungen
- Preise und Features editierbar

### Phase 3: Automatisierung (Zukunft)
- Automatische Übersetzungen
- Content-Versionierung
- Workflow-Management

## 🔧 Entwickler-Guidelines

### Neue Übersetzungen hinzufügen

1. **Namespace registrieren** in `src/lib/i18n.ts`:
```tsx
ns: ['common', 'mein-neuer-namespace', ...]
```

2. **JSON-Dateien erstellen**:
```json
// public/locales/de/mein-namespace.json
{
  "title": "Mein Titel",
  "cta": {
    "button": "Jetzt starten"
  }
}
```

3. **In Komponente verwenden**:
```tsx
const { t } = useTranslation('mein-namespace');
return <h1>{t('title')}</h1>;
```

### Hardcoded Texte vermeiden

❌ **Schlecht:**
```tsx
<h1>Unsere Angebote</h1>
```

✅ **Gut:**
```tsx
const { t } = useTranslation('packages');
<h1>{t('title')}</h1>
```

## 📊 Aktueller Status

### ✅ Implementiert
- [x] Zentrale Layout-Komponenten
- [x] Logo-Integration überall
- [x] Separate i18n-Namespaces
- [x] Packages & Services Namespace
- [x] Admin & Pricing Namespace
- [x] Automatische Namespace-Registrierung

### 🚧 In Arbeit
- [ ] Alle Komponenten auf neue Namespaces migriert
- [ ] Hardcoded Texte eliminiert
- [ ] Admin-Interface für Content-Management

### 🎯 Geplant
- [ ] Preise aus DB steuerbar
- [ ] Live-Content-Editor
- [ ] Multi-Language Content-Sync

## 🎨 Design-Prinzipien

1. **Ein Logo überall** - Zentral in Header.tsx
2. **Konsistente Layouts** - Jede Seite nutzt passenden Layout-Wrapper
3. **Flache i18n-Struktur** - Einfache Schlüssel ohne tiefe Verschachtelung
4. **Feature-basierte Namespaces** - Ein Namespace pro Anwendungsbereich
5. **Admin-steuerbar** - Alle Inhalte später über Admin-Panel editierbar

---

*Stand: Phase 2 abgeschlossen - Zentrale Layouts & i18n-Namespaces implementiert*
