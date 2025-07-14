
# Layout-System & i18n-Struktur - Entwickler-Dokumentation

## 🏗️ Zentrale Layout-Komponenten

### 1. AppLayout (Standard für öffentliche Seiten)
**Verwendet für:** Landing, Packages, Services, Legal-Seiten, B2C-Bereiche

```tsx
import AppLayout from '@/components/layout/AppLayout';

export default function MyPage() {
  return (
    <AppLayout>
      <div>Mein Seiteninhalt</div>
    </AppLayout>
  );
}
```

**Enthält:**
- Header mit Logo und Navigation
- Footer
- BackHomeButtons (auf Unterseiten)
- Responsive Container

### 2. DashboardLayout (für Partner-Bereiche)
**Verwendet für:** Dashboard, Analytics, Profile-Management

```tsx
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h1>Dashboard Inhalt</h1>
    </DashboardLayout>
  );
}
```

**Enthält:**
- Header mit Logo
- TrialBanner
- Footer
- Container für Dashboard-Content

### 3. AdminLayout (für Admin-Bereiche)
**Verwendet für:** AdminPanel, Content-Management

```tsx
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminPage() {
  return (
    <AdminLayout>
      <div>Admin Inhalt</div>
    </AdminLayout>
  );
}
```

### 4. LegalLayout (für rechtliche Seiten)
**Verwendet für:** Impressum, Datenschutz, AGB, etc.

Bereits vorhanden, funktioniert wie gehabt.

## 🌐 i18n-Namespace-Struktur

### Aktuelle Namespaces:
- `landing.json` - Landing-Page Hero, CTAs, Services
- `packages.json` - **ERSTELLEN** - Alle Paket-Informationen  
- `services.json` - **ERSTELLEN** - Service-Beschreibungen
- `dashboard.json` - Dashboard-Texte
- `admin.json` - **ERSTELLEN** - Admin-Panel-Texte
- `common.json` - Allgemeine Begriffe
- `footer.json` - Footer-Links
- `nav.json` - Navigation

### Verwendung in Komponenten:
```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation('packages'); // Namespace wählen
  
  return (
    <div>
      <h2>{t('basic.title')}</h2>
      <p>{t('basic.description')}</p>
      <span>{t('basic.price')}</span>
    </div>
  );
}
```

## 🎯 Neue Seite erstellen - Checkliste

### ✅ Schritt 1: Layout wählen
```tsx
// Öffentliche Seite
import AppLayout from '@/components/layout/AppLayout';

// Dashboard-Seite  
import DashboardLayout from '@/components/layout/DashboardLayout';

// Admin-Seite
import AdminLayout from '@/components/layout/AdminLayout';
```

### ✅ Schritt 2: i18n-Namespace definieren
```tsx
const { t } = useTranslation('mein-namespace');
```

### ✅ Schritt 3: JSON-Dateien erstellen
- `/public/locales/de/mein-namespace.json`
- `/public/locales/en/mein-namespace.json`

### ✅ Schritt 4: Namespace in i18n.ts registrieren
```typescript
// In src/lib/i18n.ts
ns: ['common', 'landing', 'packages', 'mein-namespace', ...]
```

### ✅ Schritt 5: KEINE Hardcoded-Texte!
```tsx
// ❌ NICHT so:
<h1>Mein Titel</h1>

// ✅ SONDERN so:
<h1>{t('title')}</h1>
```

## 🚀 Logo-System

**Zentrale Logo-Komponente:** `src/components/Logo.tsx`

**Verwendung:**
```tsx
import Logo from '@/components/Logo';

<Logo size="sm" />   // Header
<Logo size="lg" />   // Hero-Sektion  
<Logo size="hero" /> // Große Landing-Pages
```

**Das Logo wird AUTOMATISCH in allen Layouts gerendert via Header.tsx**

## ⚡ Performance & Wartung

### Layout-Vorteile:
- **Ein Logo-Import** → überall sichtbar
- **Einheitliche Navigation** → konsistente UX  
- **Zentrale Komponenten** → einfache Updates
- **Klare Verantwortlichkeiten** → weniger Bugs

### i18n-Vorteile:
- **Admin-steuerbare Inhalte** → keine Code-Deployments für Textänderungen
- **Mehrsprachigkeit** → automatisch für alle Texte
- **SEO-Optimierung** → strukturierte, übersetzbare Metadaten
- **Skalierbarkeit** → neue Sprachen einfach hinzufügbar

## 🔧 Admin-Steuerung (Roadmap)

**Phase 2-3:** Admin-Panel erweitern für:
- Live-Text-Editing aller i18n-Keys
- Preisänderungen ohne Code-Deployment  
- Feature-Toggle für Pakete/Services
- Content-Vorschau vor Publikation

## 🐛 Troubleshooting

### Logo nicht sichtbar?
1. Browser-Cache leeren (Strg+Shift+R)
2. Dev-Server neustarten
3. Prüfen: `/lovable-uploads/cac34de9-55d9-46d4-a2ad-62bc4d429666.png` lädt?

### Layout bricht?
1. Prüfen: Richtiges Layout importiert?
2. Prüfen: Layout-Komponente schliesst mit children?
3. Prüfen: CSS-Konflikte in DevTools?

### i18n-Key fehlt?
1. JSON-Datei erstellt und befüllt?
2. Namespace in i18n.ts registriert?  
3. Browser-Cache für Locales geleert?

---
**Erstellt:** Phase 1 Layout-Konsistenz  
**Nächste Schritte:** Phase 2 i18n-Namespaces erweitern
