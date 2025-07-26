
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'de', // Default language
    fallbackLng: 'de',
    debug: false, // Keep debug disabled for production
    
    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // Enhanced fallback options
    fallbackNS: 'common',
    returnNull: false,
    returnEmptyString: false,
    
    // Default fallback for missing keys
    parseMissingKeyHandler: (key: string) => {
      console.warn('Missing i18n key:', key);
      // Extract last part of key as fallback
      const keyParts = key.split('.');
      const lastPart = keyParts[keyParts.length - 1];
      
      // Convert camelCase/snake_case to readable format
      return lastPart
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());
    },
    
    // Updated namespace list to include all required namespaces
    ns: ['common', 'navigation', 'services', 'packages', 'hero', 'landing', 'trust', 'auth', 'adminPanel', 'onboarding', 'dashboard', 'cookieConsent', 'legal-kontakt', 'legal-contact'],
    defaultNS: 'common'
  });

export default i18n;
