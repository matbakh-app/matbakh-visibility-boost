import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Debug logging for i18n status
const debugI18n = (message: string, data?: any) => {
  console.log(`[i18n Debug] ${message}`, data);
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Enhanced configuration for stability
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    ns: ['translation', 'adminPanel', 'auth', 'nav', 'footer', 'hero', 'features', 'common'],
    defaultNS: 'translation',
    fallbackNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false
    },
    debug: process.env.NODE_ENV === 'development',
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: function (lng, ns, key, fallbackValue) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] Missing translation: ${key} in namespace ${ns} for language ${lng}`);
      }
    }
  });

// Debug current language and loaded namespaces
i18n.on('initialized', (options) => {
  debugI18n('i18n initialized', { 
    language: i18n.language, 
    loadedLanguages: i18n.languages,
    reportNamespaces: i18n.reportNamespaces 
  });
});

i18n.on('languageChanged', (lng) => {
  debugI18n('Language changed to:', lng);
});

i18n.on('loaded', (loaded) => {
  debugI18n('Namespaces loaded:', loaded);
});

export default i18n;