
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  de: {
    translation: {
      nav: {
        home: 'Startseite',
        services: 'Services',
        packages: 'Angebote',
        b2c: 'Für Gäste',
        contact: 'Kontakt',
        imprint: 'Impressum',
        privacy: 'Datenschutz',
        terms: 'AGB'
      },
      hero: {
        title: 'Ihre Google-Sichtbarkeit. Unser Erfolg.',
        subtitle: 'Wir machen Ihr Restaurant online sichtbar und helfen Ihnen dabei, mehr Gäste zu gewinnen. Einfach, effektiv, erfolgreich.',
        cta: 'Mehr Infos',
        consultation: 'Kostenlose Beratung',
        b2cTitle: 'Finden Sie Ihr perfektes Restaurant',
        b2cSubtitle: 'Personalisierte Restaurantsuche basierend auf Ihren Vorlieben und Bedürfnissen.',
        b2cCta: 'Restaurant finden',
        b2cNote: 'Demnächst verfügbar'
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
      features: {
        title: 'Geplante Features',
        subtitle: 'Diese Funktionen werden in Kürze für Restaurantgäste verfügbar sein',
        search: {
          title: 'Personalisierte Suche',
          description: 'Finden Sie Restaurants basierend auf Ihren Vorlieben, Allergien und gewünschtem Ambiente.'
        },
        voting: {
          title: 'Gruppenabstimmung',
          description: 'Laden Sie Freunde ein und stimmen Sie gemeinsam über Ihr nächstes Restaurant ab.'
        },
        booking: {
          title: 'Direktbuchung',
          description: 'Reservieren Sie Ihren Tisch direkt über Google-Integration.'
        },
        weeklyMenu: {
          title: 'Wochenspeiseplan',
          description: 'Erstellen Sie personalisierte Wochenspeisepläne basierend auf Ihren Ernährungszielen und Vorlieben.'
        },
        shoppingList: {
          title: 'Einkaufsliste',
          description: 'Automatisch generierte Einkaufslisten basierend auf Ihrem Wochenspeiseplan und Restaurantbesuchen.'
        },
        calendarManagement: {
          title: 'Kalender-Integration',
          description: 'Verwalten Sie Ihren Speiseplan im Kalender und synchronisieren Sie Restaurantbesuche automatisch.'
        },
        mealAdjustment: {
          title: 'Anpassung bei Restaurantbesuchen',
          description: 'Ihr Wochenspeiseplan passt sich automatisch an geplante Restaurantbesuche an.'
        }
      },
      pricing: {
        title: 'Unsere Angebote',
        subtitle: 'Transparent und fair - wählen Sie das passende Paket für Ihr Restaurant',
        recommended: 'Empfohlen',
        month: 'Monat',
        oneTime: 'Einmalig',
        selectPackage: 'Paket wählen',
        limitedTime: 'Nur für kurze Zeit',
        viewOnly: 'Nur zur Ansicht',
        minDuration: 'Mindestlaufzeit'
      },
      contact: {
        form: {
          title: 'Kontaktformular',
          name: 'Name',
          email: 'E-Mail',
          subject: 'Betreff',
          message: 'Nachricht',
          send: 'Nachricht senden',
          success: 'Ihre Nachricht wurde erfolgreich gesendet!',
          error: 'Fehler beim Senden der Nachricht.',
          validation: {
            nameRequired: 'Name ist erforderlich',
            emailRequired: 'E-Mail ist erforderlich',
            emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
            subjectRequired: 'Betreff ist erforderlich',
            messageRequired: 'Nachricht ist erforderlich'
          }
        }
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
        home: 'Home',
        services: 'Services',
        packages: 'Packages',
        b2c: 'For Guests',
        contact: 'Contact',
        imprint: 'Imprint',
        privacy: 'Privacy',
        terms: 'Terms'
      },
      hero: {
        title: 'Your Google Visibility. Our Success.',
        subtitle: 'We make your restaurant visible online and help you attract more guests. Simple, effective, successful.',
        cta: 'Learn More',
        consultation: 'Free Consultation',
        b2cTitle: 'Find Your Perfect Restaurant',
        b2cSubtitle: 'Personalized restaurant search based on your preferences and needs.',
        b2cCta: 'Find Restaurant',
        b2cNote: 'Coming Soon'
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
      features: {
        title: 'Planned Features',
        subtitle: 'These features will be available soon for restaurant guests',
        search: {
          title: 'Personalized Search',
          description: 'Find restaurants based on your preferences, allergies and desired ambiance.'
        },
        voting: {
          title: 'Group Voting',
          description: 'Invite friends and vote together on your next restaurant.'
        },
        booking: {
          title: 'Direct Booking',
          description: 'Reserve your table directly through Google integration.'
        },
        weeklyMenu: {
          title: 'Weekly Menu Plan',
          description: 'Create personalized weekly meal plans based on your nutritional goals and preferences.'
        },
        shoppingList: {
          title: 'Shopping List',
          description: 'Automatically generated shopping lists based on your weekly meal plan and restaurant visits.'
        },
        calendarManagement: {
          title: 'Calendar Integration',
          description: 'Manage your meal plan in the calendar and automatically sync restaurant visits.'
        },
        mealAdjustment: {
          title: 'Restaurant Visit Adjustments',
          description: 'Your weekly meal plan automatically adjusts to planned restaurant visits.'
        }
      },
      pricing: {
        title: 'Our Packages',
        subtitle: 'Transparent and fair - choose the right package for your restaurant',
        recommended: 'Recommended',
        month: 'Month',
        oneTime: 'One-time',
        selectPackage: 'Select Package',
        limitedTime: 'Limited Time Only',
        viewOnly: 'View Only',
        minDuration: 'Minimum duration'
      },
      contact: {
        form: {
          title: 'Contact Form',
          name: 'Name',
          email: 'Email',
          subject: 'Subject',
          message: 'Message',
          send: 'Send Message',
          success: 'Your message has been sent successfully!',
          error: 'Error sending message.',
          validation: {
            nameRequired: 'Name is required',
            emailRequired: 'Email is required',
            emailInvalid: 'Please enter a valid email address',
            subjectRequired: 'Subject is required',
            messageRequired: 'Message is required'
          }
        }
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
