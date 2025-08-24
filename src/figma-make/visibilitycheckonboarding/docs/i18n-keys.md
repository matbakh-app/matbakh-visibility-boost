# i18n Translation Keys - Visibility Check

## Frame-Namen im Figma Design
Alle VC-Frames sollten den Hinweis "uses global LanguageSwitch" erhalten:

- `Landing Page - uses global LanguageSwitch`
- `Restaurant Info Step - uses global LanguageSwitch`
- `Website Analysis Step - uses global LanguageSwitch`
- `AI Loading Screen - uses global LanguageSwitch`
- `Results Screen - uses global LanguageSwitch`

## Übersetzungs-Keys nach Komponenten

### 🏠 **Landing Page (GuestLandingPage.tsx)**
```typescript
// Header
'header.title' // Visibility Check

// Hero Section  
'landing.title' // Restaurant Sichtbarkeits-Analyse
'landing.subtitle' // Entdecken Sie Ihre Online-Präsenz mit KI-gestützter Analyse

// Free Analysis Block
'landing.freeAnalysis.title' // Kostenlose Sichtbarkeitsanalyse starten
'landing.freeAnalysis.subtitle' // Basis-Analyse mit eingeschränkten Features
'landing.freeAnalysis.feature1.title' // Basis-Analyse
'landing.freeAnalysis.feature1.desc' // Grundlegende Sichtbarkeits-Überprüfung...
'landing.freeAnalysis.feature2.title' // Schnelle Insights
'landing.freeAnalysis.feature2.desc' // Sofortige Ergebnisse...
'landing.freeAnalysis.feature3.title' // Erste Empfehlungen
'landing.freeAnalysis.feature3.desc' // Grundlegende Optimierungsvorschläge...
'landing.freeAnalysis.button' // Basis-Analyse starten
'landing.freeAnalysis.info' // Kostenlos • Keine Registrierung erforderlich...

// Code Validation Block
'landing.code.title' // 🎁 Haben Sie einen Gutschein-Code?
'landing.code.subtitle' // Codes erhalten Sie von Partnern...
'landing.code.placeholder' // Code eingeben
'landing.code.button' // Code einlösen
'landing.code.validating' // Code wird validiert...
'landing.code.success' // Vollzugang freigeschaltet von
'landing.code.error' // Code ungültig oder abgelaufen
'landing.code.expired' // Code-Einlösefrist abgelaufen
'landing.code.used' // Code bereits verwendet
'landing.code.successConfirm' // 🎉 Code erfolgreich eingelöst!
'landing.code.validUntil' // Gültig bis
'landing.code.benefits' // Mit Code freigeschaltet:
'landing.code.startPremium' // Premium-Analyse starten

// Account Creation Block
'landing.account.title' // Account erstellen
'landing.account.subtitle' // Vollzugang mit persönlichem Dashboard
'landing.account.feature1' // Gespeicherte Analyse-Historie
'landing.account.feature2' // Monatliche Updates
'landing.account.feature3' // Erweiterte Features
'landing.account.button' // Jetzt registrieren
```

### 🍽️ **Restaurant Info Step (RestaurantInfoStep.tsx)**
```typescript
// Header & Navigation
'restaurant.title' // Restaurant Information
'restaurant.breadcrumb.home' // VC Startseite
'restaurant.breadcrumb.current' // Restaurant Information
'common.back' // Zurück

// Progress & Content
'restaurant.step' // Schritt 1 von 2
'restaurant.headline' // Erzählen Sie uns von Ihrem Restaurant
'restaurant.subtitle' // Diese Informationen helfen uns...

// Form Fields
'restaurant.name.label' // Restaurant Name
'restaurant.name.placeholder' // z.B. Ristorante Milano
'restaurant.address.label' // Adresse
'restaurant.address.placeholder' // Straße, PLZ Stadt
'restaurant.phone.label' // Telefon
'restaurant.phone.placeholder' // +49 30 12345678
'restaurant.website.label' // Website
'restaurant.website.placeholder' // www.restaurant.de
'restaurant.category.label' // Hauptkategorie
'restaurant.category.placeholder' // Wählen Sie eine Kategorie
'restaurant.price.label' // Preisklasse
'restaurant.price.placeholder' // Wählen Sie eine Preisklasse
'restaurant.services.label' // Zusätzliche Services (optional)

// Categories (key: restaurant.categories.xxx)
'restaurant.categories.italian' // Italienisch
'restaurant.categories.german' // Deutsch
'restaurant.categories.asian' // Asiatisch
// ... weitere Kategorien

// Services (key: restaurant.services.xxx)
'restaurant.services.delivery' // Lieferservice
'restaurant.services.catering' // Catering
'restaurant.services.takeaway' // Take Away
// ... weitere Services

// Price Ranges (key: restaurant.price.xxx)
'restaurant.price.budget' // Günstig (bis 15€)
'restaurant.price.moderate' // Mittel (15-30€)
'restaurant.price.upscale' // Gehoben (30-50€)
'restaurant.price.luxury' // Luxus (50€+)

// Actions
'restaurant.back' // Zurück zur VC-Startseite
'restaurant.next' // Weiter
```

### 🌐 **Website Analysis Step (WebsiteAnalysisStep.tsx)**
```typescript
// Header & Navigation
'website.title' // Website & Analyse-Einstellungen
'website.breadcrumb.current' // Website & Analyse-Einstellungen
'website.step' // Schritt 2 von 2
'website.headline' // Website & Vergleiche

// Website Section
'website.website.label' // Website (optional)
'website.website.placeholder' // https://meinrestaurant.de

// Benchmarks Section
'website.benchmarks.label' // Vergleichbare Unternehmen (Benchmarks)
'website.benchmarks.desc' // Tragen Sie bis zu 3 Lokale ein...
'website.benchmark1.placeholder' // z. B. Weinbar X in München
'website.benchmark2.placeholder' // optional

// Email Section
'website.email.title' // E-Mail & Datenschutz
'website.email.desc' // Für den PDF-Report und weitere Analysen...
'website.email.label' // E-Mail-Adresse
'website.email.placeholder' // ihre.email@beispiel.de
'website.email.guestSkip' // E-Mail-Bestätigung wird für Premium-Codes übersprungen

// Privacy Consent
'website.privacy.label' // Datenschutz-Einverständnis
'website.privacy.text' // Ich stimme der Verarbeitung meiner Daten...
'website.emailReport.label' // E-Mail Report Einverständnis
'website.emailReport.text' // Ich stimme zu, dass der PDF-Report...
'website.marketing.label' // Marketing-Einverständnis (optional)
'website.marketing.text' // Ich möchte über neue Features...

// Email Confirmation Flow
'website.email.warningTitle' // Wichtig
'website.email.warningText' // Sie erhalten eine Bestätigungs-E-Mail...
'website.confirmEmail' // Bestätigungs-E-Mail senden
'website.email.sending' // Bestätigungs-E-Mail wird gesendet...
'website.email.sent' // E-Mail versendet
'website.email.sentText' // Wir haben eine Bestätigungs-E-Mail an
'website.email.clickLink' // Klicken Sie auf den Link...
'website.email.alreadyConfirmed' // Bereits bestätigt? Hier klicken
'website.email.confirmed' // E-Mail bestätigt
'website.email.canStart' // Sie können nun die Analyse starten

// Actions
'website.startAnalysis' // Analyse starten
'website.back' // Zurück zu Step 1
```

### ⚡ **AI Loading Screen (AILoadingScreen.tsx)**
```typescript
// Header & Main
'loading.title' // KI-Analyse läuft
'loading.subtitle' // Ihre Sichtbarkeits-Analyse wird erstellt

// Progress Section
'loading.analyzing' // Analysiere Ihre Daten
'loading.step' // Schritt
'loading.of' // von
'loading.remaining' // Verbleibend
'loading.elapsed' // Vergangen
'loading.running' // Läuft

// Pipeline Steps (key: loading.steps.xxx)
'loading.steps.init.title' // System initialisieren
'loading.steps.init.desc' // Vorbereitung der Analyse-Umgebung...
'loading.steps.collection.title' // Daten sammeln
'loading.steps.collection.desc' // Erfassung von Restaurant-Informationen...
'loading.steps.platforms.title' // Plattformen analysieren
'loading.steps.platforms.desc' // Überprüfung von Google, Social Media...
'loading.steps.ai.title' // KI-Verarbeitung
'loading.steps.ai.desc' // Intelligente Analyse und Mustererkennung...
'loading.steps.recommendations.title' // Empfehlungen generieren
'loading.steps.recommendations.desc' // Erstellung personalisierter...
'loading.steps.final.title' // Report finalisieren
'loading.steps.final.desc' // Zusammenstellung der Ergebnisse...

// Info & Actions
'loading.pipeline.title' // Analyse-Pipeline
'loading.info.title' // Analyse-Informationen
'loading.info.plan' // Plan
'loading.info.usage' // Nutzung
'loading.info.priority' // Priorität
'loading.info.type' // Typ
'loading.info.high' // Hoch
'loading.info.normal' // Normal
'loading.info.fullAnalysis' // Vollständige Analyse
'loading.cancel' // Analyse abbrechen
'loading.cancelNote' // Die Analyse kann jederzeit abgebrochen werden
```

### 🔧 **Common Elements**
```typescript
// Navigation & Actions
'common.back' // Zurück
'common.next' // Weiter
'common.cancel' // Abbrechen
'common.save' // Speichern
'common.loading' // Wird geladen...
'common.error' // Fehler
'common.success' // Erfolgreich
'common.required' // Pflichtfeld

// Buttons
'button.start' // Starten
'button.upgrade' // Upgrade
'button.login' // Anmelden
'button.register' // Registrieren
'button.retry' // Erneut versuchen
'button.continue' // Fortfahren

// Plans
'plan.basic' // Basic Plan - 1 Analyse täglich
'plan.business' // Business Plan - 3 Analysen täglich
'plan.premium' // Premium Plan - Unbegrenzte Analysen
```

## Figma-Kommentare für Text-Elemente

Alle Text-Elemente in den VC-Frames sollten mit dem entsprechenden i18n-Key kommentiert werden:

```
// Beispiele für Layer-Kommentare:
"Restaurant Sichtbarkeits-Analyse" → key: landing.title
"Schritt 1 von 2" → key: restaurant.step
"Code eingeben" → key: landing.code.placeholder
"Analyse starten" → key: website.startAnalysis
"KI-Analyse läuft" → key: loading.title
```

## Design-System Integration

- **Typography**: Inter für Headlines (h1-h4), System-Font für Body/Labels
- **Colors**: Primary #4F46E5, Success #10B981, Warning #F59E0B, Error #EF4444
- **Spacing**: 8px Grid-System mit var(--spacing-1) bis var(--spacing-8)
- **Components**: Bestehende shadcn/ui Components (Button, Card, Input, etc.)
- **Language Switch**: Globaler LanguageSwitch-Component in allen Headers

Das System ist vollständig responsive und unterstützt nahtloses Umschalten zwischen DE/EN ohne Reload.