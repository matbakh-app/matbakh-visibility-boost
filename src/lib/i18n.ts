
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  de: {
    translation: {
      nav: {
        contact: 'Kontakt',
        imprint: 'Impressum',
        privacy: 'Datenschutz',
        terms: 'AGB'
      },
      hero: {
        title: 'Ihre Google-Sichtbarkeit. Unser Erfolg.',
        subtitle: 'Wir machen Ihr Restaurant online sichtbar und helfen Ihnen dabei, mehr Gäste zu gewinnen. Einfach, effektiv, erfolgreich.',
        cta: 'Mehr Infos',
        consultation: 'Kostenlose Beratung'
      },
      services: {
        title: 'Unsere Services',
        subtitle: 'Professionelle Lösungen für Ihre Online-Präsenz',
        setup: {
          title: 'Google Business Setup',
          description: 'Professionelle Einrichtung und Optimierung Ihres Google Business Profils für maximale Sichtbarkeit.'
        },
        management: {
          title: 'Social Media Management',
          description: 'Kontinuierliche Betreuung Ihrer Social Media Kanäle mit professionellen Inhalten und Engagement.'
        },
        analytics: {
          title: 'Analytics & Insights',
          description: 'Detaillierte Analysen und Berichte über Ihre Online-Performance und Kundeninteraktionen.'
        }
      },
      pricing: {
        title: 'Unsere Angebote',
        subtitle: 'Transparent und fair - wählen Sie das passende Paket für Ihr Restaurant',
        recommended: 'Empfohlen',
        month: 'Monat',
        oneTime: 'Einmalig',
        selectPackage: 'Paket wählen',
        limitedTime: 'Nur für kurze Zeit'
      },
      footer: {
        company: 'Unternehmen',
        legal: 'Rechtliches',
        contact: 'Kontakt',
        imprint: 'Impressum',
        privacy: 'Datenschutz',
        terms: 'AGB'
      }
    }
  },
  en: {
    translation: {
      nav: {
        contact: 'Contact',
        imprint: 'Imprint',
        privacy: 'Privacy',
        terms: 'Terms'
      },
      hero: {
        title: 'Your Google Visibility. Our Success.',
        subtitle: 'We make your restaurant visible online and help you attract more guests. Simple, effective, successful.',
        cta: 'Learn More',
        consultation: 'Free Consultation'
      },
      services: {
        title: 'Our Services',
        subtitle: 'Professional solutions for your online presence',
        setup: {
          title: 'Google Business Setup',
          description: 'Professional setup and optimization of your Google Business Profile for maximum visibility.'
        },
        management: {
          title: 'Social Media Management',
          description: 'Continuous management of your social media channels with professional content and engagement.'
        },
        analytics: {
          title: 'Analytics & Insights',
          description: 'Detailed analytics and reports about your online performance and customer interactions.'
        }
      },
      pricing: {
        title: 'Our Packages',
        subtitle: 'Transparent and fair - choose the right package for your restaurant',
        recommended: 'Recommended',
        month: 'Month',
        oneTime: 'One-time',
        selectPackage: 'Select Package',
        limitedTime: 'Limited Time Only'
      },
      footer: {
        company: 'Company',
        legal: 'Legal',
        contact: 'Contact',
        imprint: 'Imprint',
        privacy: 'Privacy',
        terms: 'Terms'
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'de',
  fallbackLng: 'de',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
