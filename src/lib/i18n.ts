
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  de: {
    translation: {
      // Navigation
      "nav.services": "Services",
      "nav.pricing": "Preise",
      "nav.contact": "Kontakt",
      "nav.login": "Anmelden",
      
      // Landing Page
      "landing.tagline": "Sichtbarkeit, die Gäste bringt.",
      "landing.hero.title": "Viele Gastronomen verlieren täglich Gäste – nicht wegen ihres Essens, sondern wegen fehlender Sichtbarkeit.",
      "landing.hero.subtitle": "matbakh hilft Ihnen, Ihre Online-Reputation zu pflegen, Ihre Zielgruppen zu verstehen – und mehr qualifizierte Gäste zu gewinnen.",
      "landing.cta.primary": "Jetzt Google-Profil verbinden",
      "landing.cta.secondary": "Mehr erfahren",
      
      // Service Cards
      "services.profile.title": "Google Profilpflege",
      "services.profile.description": "Wir halten Öffnungszeiten, Menü & Bilder aktuell – vollautomatisch",
      "services.analysis.title": "Sichtbarkeits-Analyse",
      "services.analysis.description": "Erkennen Sie, wie sichtbar Ihr Restaurant ist – und was Gäste suchen",
      "services.analytics.title": "Zielgruppen-Analytics",
      "services.analytics.description": "Lernen Sie, wer Ihre Gäste sind – und wie Sie noch mehr davon gewinnen",
      
      // Info Boxes
      "info.target_group.title": "Was ist eine Zielgruppe?",
      "info.target_group.content": "Ihre Zielgruppe sind die Menschen, die genau zu Ihrem Angebot passen. Familien mit Kindern, Remote-Worker am Nachmittag, Veganer auf der Suche nach Lunch. Je besser Sie sie kennen, desto leichter erreichen Sie sie.",
      "info.usp.title": "Was sind USPs?",
      "info.usp.content": "Ihr USP (Alleinstellungsmerkmal) macht Sie unverwechselbar. Vielleicht ist es der sonnigste Platz am Nachmittag, Ihre glutenfreie Pizza oder das nachhaltige Wochenmenü. Wir helfen, diese Stärken sichtbar zu machen.",
      
      // Pricing
      "pricing.limited_time": "Nur für kurze Zeit",
      "pricing.per_month": "/ Monat",
      "pricing.one_time": "einmalig",
      "pricing.book_now": "Jetzt buchen",
      "pricing.save": "Sie sparen {{amount}}€",
      
      // Common
      "common.loading": "Lädt...",
      "common.error": "Fehler aufgetreten",
      "common.save": "Speichern",
      "common.cancel": "Abbrechen",
      "common.continue": "Weiter",
      "common.back": "Zurück"
    }
  },
  en: {
    translation: {
      // Navigation
      "nav.services": "Services",
      "nav.pricing": "Pricing",
      "nav.contact": "Contact",
      "nav.login": "Login",
      
      // Landing Page
      "landing.tagline": "Visibility that fills your tables.",
      "landing.hero.title": "Many restaurant owners lose guests daily – not because of their food, but because of limited visibility.",
      "landing.hero.subtitle": "matbakh helps you manage your reputation, understand your audience – and attract more ideal guests.",
      "landing.cta.primary": "Connect Google Profile Now",
      "landing.cta.secondary": "Learn more",
      
      // Service Cards
      "services.profile.title": "Google Profile Management",
      "services.profile.description": "We keep your hours, menu & photos updated – fully automatically",
      "services.analysis.title": "Visibility Analysis",
      "services.analysis.description": "Discover how visible your restaurant is – and what guests are searching for",
      "services.analytics.title": "Audience Analytics",
      "services.analytics.description": "Learn who your guests are – and how to attract more of them",
      
      // Info Boxes
      "info.target_group.title": "What is a target audience?",
      "info.target_group.content": "Your target audience consists of people who perfectly match your offering. Families with children, remote workers in the afternoon, vegans looking for lunch. The better you know them, the easier it is to reach them.",
      "info.usp.title": "What are USPs?",
      "info.usp.content": "Your USP (Unique Selling Proposition) makes you unmistakable. Perhaps it's the sunniest afternoon spot, your gluten-free pizza, or the sustainable weekly menu. We help make these strengths visible.",
      
      // Pricing
      "pricing.limited_time": "Limited Time Only",
      "pricing.per_month": "/ month",
      "pricing.one_time": "one-time",
      "pricing.book_now": "Book Now",
      "pricing.save": "You save €{{amount}}",
      
      // Common
      "common.loading": "Loading...",
      "common.error": "Error occurred",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.continue": "Continue",
      "common.back": "Back"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de', // default language
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
