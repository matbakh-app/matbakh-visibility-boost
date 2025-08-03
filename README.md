# matbakh.app - Restaurant Business Management Platform

## 🔒 CTO-Governance & Audit-Ready Architecture

⚠️ **Neue Entwickler & Auditoren müssen ZUERST `docs/CRITICAL_FILES.md` lesen!** ⚠️

Diese Plattform für Restaurant-Management ist enterprise-ready mit vollständiger CTO-Governance für Legal-Compliance und Audit-Sicherheit.

### 🎯 Legal-Governance System
- **Alle Rechtstexte** zentral in `public/locales/{lang}/legal.json`  
- **Automatisierte Konsistenz-Checks** mit `npm run check-legal`
- **CTO-geschützte Bereiche** mit strikter Review-Pflicht
- **Audit-Dokumentation** in `docs/CRITICAL_FILES.md`

### 🛡️ Entwickler-Onboarding 
1. **PFLICHT**: `docs/CRITICAL_FILES.md` vollständig lesen
2. **PFLICHT**: Legal-Governance-Workflow verstehen  
3. **PFLICHT**: PR-Templates für Legal-Änderungen beachten
4. **TEST**: `npm run check-legal` erfolgreich ausführen

## Project info

**URL**: https://lovable.dev/projects/17fede0a-b45d-4eeb-be93-e21ad2737f99

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 🚨 Kritische Navigations-Dateien

**WARNUNG**: Die folgenden Dateien steuern die gesamte Website-Navigation und dürfen **NIEMALS** ohne explizite Genehmigung geändert werden:

| Datei | Zweck |
|-------|-------|
| `src/components/navigation/NavigationConfig.ts` | Einzelne Quelle aller Haupt-Links |
| `public/locales/*/nav.json` | Beschriftungen für Navigation |
| `src/App.tsx` | Route → Component Mapping |
| `public/sitemap.xml` | SEO-Relevante URL-Liste |

**Änderungs-Prozess** (immer einhalten):
1. Issue erstellen / Product-Owner zustimmen lassen  
2. `npm run check:nav` lokal – darf **keine** Fehler bringen  
3. Code-Review (mind. 1 Maintainer)  
4. Merge & Deploy

📖 **Detaillierte Informationen**: [docs/CRITICAL_FILES.md](docs/CRITICAL_FILES.md)

## Routing & Legal Pages

This app uses a bilingual routing structure with German as the primary language:

- **Legal pages**: All legal pages (Impressum, Datenschutz, AGB, Nutzung) use root-level URLs
- **Language switching**: DE paths like `/impressum` map to EN paths like `/imprint`
- **Navigation**: Centralized in `NavigationConfig.ts` with i18n support
- **Footer**: Uses `getFooterNavItems()` for consistent navigation across languages

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/17fede0a-b45d-4eeb-be93-e21ad2737f99) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
# Trigger CI
