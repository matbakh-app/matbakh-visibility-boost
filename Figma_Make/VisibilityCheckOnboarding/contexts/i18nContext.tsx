import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'de' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get from localStorage or default to 'de'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vc-language');
      return (saved === 'en' || saved === 'de') ? saved : 'de';
    }
    return 'de';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vc-language', lang);
    }
  };

  const translations = {
    de: {
      // Header & Navigation
      'header.title': 'Visibility Check',
      'nav.overview': 'Übersicht',
      'nav.analytics': 'Analyse',
      'nav.scheduling': 'Scheduling',
      'nav.results': 'Ergebnisse',
      'nav.settings': 'Einstellungen',
      
      // Landing Page
      'landing.title': 'Restaurant Sichtbarkeits-Analyse',
      'landing.subtitle': 'Entdecken Sie Ihre Online-Präsenz mit KI-gestützter Analyse',
      'landing.freeAnalysis.title': 'Kostenlose Sichtbarkeitsanalyse starten',
      'landing.freeAnalysis.subtitle': 'Basis-Analyse mit eingeschränkten Features',
      'landing.freeAnalysis.feature1.title': 'Basis-Analyse',
      'landing.freeAnalysis.feature1.desc': 'Grundlegende Sichtbarkeits-Überprüfung Ihrer wichtigsten Plattformen',
      'landing.freeAnalysis.feature2.title': 'Schnelle Insights',
      'landing.freeAnalysis.feature2.desc': 'Sofortige Ergebnisse zu Ihrer digitalen Präsenz',
      'landing.freeAnalysis.feature3.title': 'Erste Empfehlungen',
      'landing.freeAnalysis.feature3.desc': 'Grundlegende Optimierungsvorschläge für bessere Sichtbarkeit',
      'landing.freeAnalysis.button': 'Basis-Analyse starten',
      'landing.freeAnalysis.info': 'Kostenlos • Keine Registrierung erforderlich • 3-5 Minuten',
      
      'landing.code.title': '🎁 Haben Sie einen Gutschein-Code?',
      'landing.code.subtitle': 'Codes erhalten Sie von Partnern oder per Email für erweiterte Analysen',
      'landing.code.placeholder': 'Code eingeben',
      'landing.code.button': 'Code einlösen',
      'landing.code.validating': 'Code wird validiert...',
      'landing.code.success': 'Vollzugang freigeschaltet von',
      'landing.code.error': 'Code ungültig oder abgelaufen',
      'landing.code.expired': 'Code-Einlösefrist abgelaufen',
      'landing.code.used': 'Code bereits verwendet',
      'landing.code.successConfirm': '🎉 Code erfolgreich eingelöst!',
      'landing.code.validUntil': 'Gültig bis',
      'landing.code.benefits': 'Mit Code freigeschaltet:',
      'landing.code.startPremium': 'Premium-Analyse starten',
      
      'landing.account.title': 'Account erstellen',
      'landing.account.subtitle': 'Vollzugang mit persönlichem Dashboard',
      'landing.account.feature1': 'Gespeicherte Analyse-Historie',
      'landing.account.feature2': 'Monatliche Updates',
      'landing.account.feature3': 'Erweiterte Features',
      'landing.account.button': 'Jetzt registrieren',
      
      // Restaurant Info Step
      'restaurant.title': 'Restaurant Information',
      'restaurant.breadcrumb.home': 'VC Startseite',
      'restaurant.breadcrumb.current': 'Restaurant Information',
      'restaurant.step': 'Schritt 1 von 2',
      'restaurant.headline': 'Erzählen Sie uns von Ihrem Restaurant',
      'restaurant.subtitle': 'Diese Informationen helfen uns, eine präzise Analyse zu erstellen',
      'restaurant.name.label': 'Restaurant Name',
      'restaurant.name.placeholder': 'z.B. Ristorante Milano',
      'restaurant.address.label': 'Adresse',
      'restaurant.address.placeholder': 'Straße, PLZ Stadt',
      'restaurant.phone.label': 'Telefon',
      'restaurant.phone.placeholder': '+49 30 12345678',
      'restaurant.website.label': 'Website',
      'restaurant.website.placeholder': 'www.restaurant.de',
      'restaurant.category.label': 'Hauptkategorie',
      'restaurant.category.placeholder': 'Wählen Sie eine Kategorie',
      'restaurant.price.label': 'Preisklasse',
      'restaurant.price.placeholder': 'Wählen Sie eine Preisklasse',
      'restaurant.services.label': 'Zusätzliche Services (optional)',
      'restaurant.back': 'Zurück zur VC-Startseite',
      'restaurant.next': 'Weiter',
      
      // Restaurant Categories
      'restaurant.categories.italian': 'Italienisch',
      'restaurant.categories.german': 'Deutsch',
      'restaurant.categories.asian': 'Asiatisch',
      'restaurant.categories.french': 'Französisch',
      'restaurant.categories.greek': 'Griechisch',
      'restaurant.categories.turkish': 'Türkisch',
      'restaurant.categories.pizza': 'Pizza',
      'restaurant.categories.burger': 'Burger',
      'restaurant.categories.sushi': 'Sushi',
      'restaurant.categories.cafe': 'Café/Bistro',
      'restaurant.categories.fastfood': 'Fast Food',
      'restaurant.categories.finedining': 'Fine Dining',
      'restaurant.categories.vegetarian': 'Vegetarisch/Vegan',
      'restaurant.categories.other': 'Sonstiges',
      
      // Restaurant Services
      'restaurant.services.delivery': 'Lieferservice',
      'restaurant.services.catering': 'Catering',
      'restaurant.services.takeaway': 'Take Away',
      'restaurant.services.breakfast': 'Frühstück',
      'restaurant.services.lunch': 'Mittagstisch',
      'restaurant.services.bar': 'Bar/Cocktails',
      'restaurant.services.terrace': 'Terrasse/Garten',
      'restaurant.services.family': 'Familienfreundlich',
      'restaurant.services.business': 'Business Lunch',
      'restaurant.services.events': 'Events/Feiern',
      
      // Price Ranges
      'restaurant.price.budget': 'Günstig (bis 15€)',
      'restaurant.price.moderate': 'Mittel (15-30€)',
      'restaurant.price.upscale': 'Gehoben (30-50€)',
      'restaurant.price.luxury': 'Luxus (50€+)',
      
      // Website Analysis Step
      'website.title': 'Website & Analyse-Einstellungen',
      'website.breadcrumb.current': 'Website & Analyse-Einstellungen',
      'website.step': 'Schritt 2 von 2',
      'website.headline': 'Website & Vergleiche',
      'website.website.label': 'Website (optional)',
      'website.website.placeholder': 'https://meinrestaurant.de',
      'website.benchmarks.label': 'Vergleichbare Unternehmen (Benchmarks)',
      'website.benchmarks.desc': 'Tragen Sie bis zu 3 Lokale ein, mit denen Sie sich vergleichen möchten.',
      'website.benchmark1.placeholder': 'z. B. Weinbar X in München',
      'website.benchmark2.placeholder': 'optional',
      'website.email.title': 'E-Mail & Datenschutz',
      'website.email.desc': 'Für den PDF-Report und weitere Analysen benötigen wir Ihre E-Mail-Adresse.',
      'website.email.label': 'E-Mail-Adresse',
      'website.email.placeholder': 'ihre.email@beispiel.de',
      'website.email.guestSkip': 'E-Mail-Bestätigung wird für Premium-Codes übersprungen',
      'website.email.warningTitle': 'Wichtig',
      'website.email.warningText': 'Sie erhalten eine Bestätigungs-E-Mail. Erst nach Bestätigung wird der vollständige Report generiert.',
      'website.email.sending': 'Bestätigungs-E-Mail wird gesendet...',
      'website.email.sent': 'E-Mail versendet',
      'website.email.sentText': 'Wir haben eine Bestätigungs-E-Mail an',
      'website.email.clickLink': 'Klicken Sie auf den Link in der E-Mail, um fortzufahren.',
      'website.email.alreadyConfirmed': 'Bereits bestätigt? Hier klicken',
      'website.email.confirmed': 'E-Mail bestätigt',
      'website.email.canStart': 'Sie können nun die Analyse starten.',
      'website.email.simulateConfirm': 'Simuliere E-Mail-Bestätigung',
      'website.email.markConfirmed': 'E-Mail als bestätigt markieren',
      'website.privacy.label': 'Datenschutz-Einverständnis',
      'website.privacy.text': 'Ich stimme der Verarbeitung meiner Daten für die Sichtbarkeits-Analyse zu.',
      'website.emailReport.label': 'E-Mail Report Einverständnis',
      'website.emailReport.text': 'Ich stimme zu, dass der PDF-Report an meine E-Mail-Adresse gesendet wird.',
      'website.marketing.label': 'Marketing-Einverständnis (optional)',
      'website.marketing.text': 'Ich möchte über neue Features und Gastro-Tipps informiert werden.',
      'website.confirmEmail': 'Bestätigungs-E-Mail senden',
      'website.startAnalysis': 'Analyse starten',
      'website.back': 'Zurück zu Step 1',
      
      // Loading Screen
      'loading.title': 'KI-Analyse läuft',
      'loading.subtitle': 'Ihre Sichtbarkeits-Analyse wird erstellt',
      'loading.analyzing': 'Analysiere Ihre Daten',
      'loading.step': 'Schritt',
      'loading.of': 'von',
      'loading.remaining': 'Verbleibend',
      'loading.elapsed': 'Vergangen',
      'loading.running': 'Läuft',
      'loading.pipeline.title': 'Analyse-Pipeline',
      'loading.cancel': 'Analyse abbrechen',
      'loading.cancelNote': 'Die Analyse kann jederzeit abgebrochen werden',
      'loading.info.title': 'Analyse-Informationen',
      'loading.info.plan': 'Plan',
      'loading.info.usage': 'Nutzung',
      'loading.info.priority': 'Priorität',
      'loading.info.type': 'Typ',
      'loading.info.high': 'Hoch',
      'loading.info.normal': 'Normal',
      'loading.info.fullAnalysis': 'Vollständige Analyse',
      
      // Loading Steps
      'loading.steps.init.title': 'System initialisieren',
      'loading.steps.init.desc': 'Vorbereitung der Analyse-Umgebung und KI-Module',
      'loading.steps.collection.title': 'Daten sammeln',
      'loading.steps.collection.desc': 'Erfassung von Restaurant-Informationen und Online-Präsenz',
      'loading.steps.platforms.title': 'Plattformen analysieren',
      'loading.steps.platforms.desc': 'Überprüfung von Google, Social Media und Review-Plattformen',
      'loading.steps.ai.title': 'KI-Verarbeitung',
      'loading.steps.ai.desc': 'Intelligente Analyse und Mustererkennung durch Machine Learning',
      'loading.steps.recommendations.title': 'Empfehlungen generieren',
      'loading.steps.recommendations.desc': 'Erstellung personalisierter Optimierungsvorschläge',
      'loading.steps.final.title': 'Report finalisieren',
      'loading.steps.final.desc': 'Zusammenstellung der Ergebnisse und PDF-Generierung',
      
      // Common
      'common.back': 'Zurück',
      'common.next': 'Weiter',
      'common.cancel': 'Abbrechen',
      'common.save': 'Speichern',
      'common.loading': 'Wird geladen...',
      'common.error': 'Fehler',
      'common.success': 'Erfolgreich',
      'common.required': 'Pflichtfeld',
      
      // Buttons & Actions
      'button.start': 'Starten',
      'button.upgrade': 'Upgrade',
      'button.login': 'Anmelden',
      'button.register': 'Registrieren',
      'button.retry': 'Erneut versuchen',
      'button.continue': 'Fortfahren',
      
      // Dashboard
      'dashboard.welcome': 'Willkommen zurück',
      'dashboard.quickActions': 'Schnellaktionen',
      'dashboard.addRestaurant': 'Restaurant hinzufügen',
      'dashboard.competitorTracking': 'Competitor Tracking',
      'dashboard.multiLocation': 'Multi-Location',
      
      // Analysis
      'analysis.title': 'Sichtbarkeits-Analyse',
      'analysis.overall': 'Gesamtsichtbarkeit',
      'analysis.platforms': 'Plattform-Aufschlüsselung',
      'analysis.recommendations': 'Empfehlungen',
      
      // Plans
      'plan.basic': 'Basic Plan - 1 Analyse täglich',
      'plan.business': 'Business Plan - 3 Analysen täglich',
      'plan.premium': 'Premium Plan - Unbegrenzte Analysen',
      
      // Settings
      'settings.account': 'Account Einstellungen',
      'settings.currentPlan': 'Aktueller Plan',
      'settings.changePlan': 'Plan ändern',
      'settings.language': 'Sprache',
      'settings.privacy': 'Datenschutz',
      'settings.notifications': 'Benachrichtigungen',
    },
    en: {
      // Header & Navigation
      'header.title': 'Visibility Check',
      'nav.overview': 'Overview',
      'nav.analytics': 'Analytics',
      'nav.scheduling': 'Scheduling',
      'nav.results': 'Results',
      'nav.settings': 'Settings',
      
      // Landing Page
      'landing.title': 'Restaurant Visibility Analysis',
      'landing.subtitle': 'Discover your online presence with AI-powered analysis',
      'landing.freeAnalysis.title': 'Start Free Visibility Analysis',
      'landing.freeAnalysis.subtitle': 'Basic analysis with limited features',
      'landing.freeAnalysis.feature1.title': 'Basic Analysis',
      'landing.freeAnalysis.feature1.desc': 'Essential visibility check of your main platforms',
      'landing.freeAnalysis.feature2.title': 'Quick Insights',
      'landing.freeAnalysis.feature2.desc': 'Instant results about your digital presence',
      'landing.freeAnalysis.feature3.title': 'Initial Recommendations',
      'landing.freeAnalysis.feature3.desc': 'Basic optimization suggestions for better visibility',
      'landing.freeAnalysis.button': 'Start Basic Analysis',
      'landing.freeAnalysis.info': 'Free • No registration required • 3-5 minutes',
      
      'landing.code.title': '🎁 Do you have a voucher code?',
      'landing.code.subtitle': 'Get codes from partners or via email for advanced analyses',
      'landing.code.placeholder': 'Enter code',
      'landing.code.button': 'Redeem code',
      'landing.code.validating': 'Validating code...',
      'landing.code.success': 'Full access unlocked by',
      'landing.code.error': 'Code invalid or expired',
      'landing.code.expired': 'Code redemption period expired',
      'landing.code.used': 'Code already used',
      'landing.code.successConfirm': '🎉 Code successfully redeemed!',
      'landing.code.validUntil': 'Valid until',
      'landing.code.benefits': 'Unlocked with code:',
      'landing.code.startPremium': 'Start Premium Analysis',
      
      'landing.account.title': 'Create Account',
      'landing.account.subtitle': 'Full access with personal dashboard',
      'landing.account.feature1': 'Saved analysis history',
      'landing.account.feature2': 'Monthly updates',
      'landing.account.feature3': 'Advanced features',
      'landing.account.button': 'Register now',
      
      // Restaurant Info Step
      'restaurant.title': 'Restaurant Information',
      'restaurant.breadcrumb.home': 'VC Homepage',
      'restaurant.breadcrumb.current': 'Restaurant Information',
      'restaurant.step': 'Step 1 of 2',
      'restaurant.headline': 'Tell us about your restaurant',
      'restaurant.subtitle': 'This information helps us create a precise analysis',
      'restaurant.name.label': 'Restaurant Name',
      'restaurant.name.placeholder': 'e.g. Ristorante Milano',
      'restaurant.address.label': 'Address',
      'restaurant.address.placeholder': 'Street, ZIP City',
      'restaurant.phone.label': 'Phone',
      'restaurant.phone.placeholder': '+1 555 123-4567',
      'restaurant.website.label': 'Website',
      'restaurant.website.placeholder': 'www.restaurant.com',
      'restaurant.category.label': 'Main Category',
      'restaurant.category.placeholder': 'Select a category',
      'restaurant.price.label': 'Price Range',
      'restaurant.price.placeholder': 'Select a price range',
      'restaurant.services.label': 'Additional Services (optional)',
      'restaurant.back': 'Back to VC Homepage',
      'restaurant.next': 'Continue',
      
      // Restaurant Categories
      'restaurant.categories.italian': 'Italian',
      'restaurant.categories.german': 'German',
      'restaurant.categories.asian': 'Asian',
      'restaurant.categories.french': 'French',
      'restaurant.categories.greek': 'Greek',
      'restaurant.categories.turkish': 'Turkish',
      'restaurant.categories.pizza': 'Pizza',
      'restaurant.categories.burger': 'Burger',
      'restaurant.categories.sushi': 'Sushi',
      'restaurant.categories.cafe': 'Café/Bistro',
      'restaurant.categories.fastfood': 'Fast Food',
      'restaurant.categories.finedining': 'Fine Dining',
      'restaurant.categories.vegetarian': 'Vegetarian/Vegan',
      'restaurant.categories.other': 'Other',
      
      // Restaurant Services
      'restaurant.services.delivery': 'Delivery',
      'restaurant.services.catering': 'Catering',
      'restaurant.services.takeaway': 'Take Away',
      'restaurant.services.breakfast': 'Breakfast',
      'restaurant.services.lunch': 'Lunch Menu',
      'restaurant.services.bar': 'Bar/Cocktails',
      'restaurant.services.terrace': 'Terrace/Garden',
      'restaurant.services.family': 'Family-Friendly',
      'restaurant.services.business': 'Business Lunch',
      'restaurant.services.events': 'Events/Celebrations',
      
      // Price Ranges
      'restaurant.price.budget': 'Budget (up to $20)',
      'restaurant.price.moderate': 'Moderate ($20-40)',
      'restaurant.price.upscale': 'Upscale ($40-70)',
      'restaurant.price.luxury': 'Luxury ($70+)',
      
      // Website Analysis Step
      'website.title': 'Website & Analysis Settings',
      'website.breadcrumb.current': 'Website & Analysis Settings',
      'website.step': 'Step 2 of 2',
      'website.headline': 'Website & Comparisons',
      'website.website.label': 'Website (optional)',
      'website.website.placeholder': 'https://myrestaurant.com',
      'website.benchmarks.label': 'Comparable Businesses (Benchmarks)',
      'website.benchmarks.desc': 'Enter up to 3 businesses you want to compare with.',
      'website.benchmark1.placeholder': 'e.g. Wine Bar X in New York',
      'website.benchmark2.placeholder': 'optional',
      'website.email.title': 'E-Mail & Privacy',
      'website.email.desc': 'We need your email address for the PDF report and further analyses.',
      'website.email.label': 'E-Mail Address',
      'website.email.placeholder': 'your.email@example.com',
      'website.email.guestSkip': 'Email confirmation skipped for premium codes',
      'website.email.warningTitle': 'Important',
      'website.email.warningText': 'You will receive a confirmation email. The full report will only be generated after confirmation.',
      'website.email.sending': 'Sending confirmation email...',
      'website.email.sent': 'Email sent',
      'website.email.sentText': 'We have sent a confirmation email to',
      'website.email.clickLink': 'Click the link in the email to continue.',
      'website.email.alreadyConfirmed': 'Already confirmed? Click here',
      'website.email.confirmed': 'Email confirmed',
      'website.email.canStart': 'You can now start the analysis.',
      'website.email.simulateConfirm': 'Simulate email confirmation',
      'website.email.markConfirmed': 'Mark email as confirmed',
      'website.privacy.label': 'Privacy Consent',
      'website.privacy.text': 'I agree to the processing of my data for the visibility analysis.',
      'website.emailReport.label': 'Email Report Consent',
      'website.emailReport.text': 'I agree that the PDF report will be sent to my email address.',
      'website.marketing.label': 'Marketing Consent (optional)',
      'website.marketing.text': 'I want to be informed about new features and restaurant tips.',
      'website.confirmEmail': 'Send confirmation email',
      'website.startAnalysis': 'Start analysis',
      'website.back': 'Back to Step 1',
      
      // Loading Screen
      'loading.title': 'AI Analysis in Progress',
      'loading.subtitle': 'Your visibility analysis is being created',
      'loading.analyzing': 'Analyzing your data',
      'loading.step': 'Step',
      'loading.of': 'of',
      'loading.remaining': 'Remaining',
      'loading.elapsed': 'Elapsed',
      'loading.running': 'Running',
      'loading.pipeline.title': 'Analysis Pipeline',
      'loading.cancel': 'Cancel analysis',
      'loading.cancelNote': 'The analysis can be cancelled at any time',
      'loading.info.title': 'Analysis Information',
      'loading.info.plan': 'Plan',
      'loading.info.usage': 'Usage',
      'loading.info.priority': 'Priority',
      'loading.info.type': 'Type',
      'loading.info.high': 'High',
      'loading.info.normal': 'Normal',
      'loading.info.fullAnalysis': 'Full Analysis',
      
      // Loading Steps
      'loading.steps.init.title': 'Initialize system',
      'loading.steps.init.desc': 'Preparing analysis environment and AI modules',
      'loading.steps.collection.title': 'Collect data',
      'loading.steps.collection.desc': 'Gathering restaurant information and online presence',
      'loading.steps.platforms.title': 'Analyze platforms',
      'loading.steps.platforms.desc': 'Checking Google, social media and review platforms',
      'loading.steps.ai.title': 'AI processing',
      'loading.steps.ai.desc': 'Intelligent analysis and pattern recognition through machine learning',
      'loading.steps.recommendations.title': 'Generate recommendations',
      'loading.steps.recommendations.desc': 'Creating personalized optimization suggestions',
      'loading.steps.final.title': 'Finalize report',
      'loading.steps.final.desc': 'Compiling results and generating PDF report',
      
      // Common
      'common.back': 'Back',
      'common.next': 'Next',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.required': 'Required',
      
      // Buttons & Actions
      'button.start': 'Start',
      'button.upgrade': 'Upgrade',
      'button.login': 'Login',
      'button.register': 'Register',
      'button.retry': 'Retry',
      'button.continue': 'Continue',
      
      // Dashboard
      'dashboard.welcome': 'Welcome back',
      'dashboard.quickActions': 'Quick Actions',
      'dashboard.addRestaurant': 'Add Restaurant',
      'dashboard.competitorTracking': 'Competitor Tracking',
      'dashboard.multiLocation': 'Multi-Location',
      
      // Analysis
      'analysis.title': 'Visibility Analysis',
      'analysis.overall': 'Overall Visibility',
      'analysis.platforms': 'Platform Breakdown',
      'analysis.recommendations': 'Recommendations',
      
      // Plans
      'plan.basic': 'Basic Plan - 1 analysis daily',
      'plan.business': 'Business Plan - 3 analyses daily',
      'plan.premium': 'Premium Plan - Unlimited analyses',
      
      // Settings
      'settings.account': 'Account Settings',
      'settings.currentPlan': 'Current Plan',
      'settings.changePlan': 'Change Plan',
      'settings.language': 'Language',
      'settings.privacy': 'Privacy',
      'settings.notifications': 'Notifications',
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key; // Return key if translation not found
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}