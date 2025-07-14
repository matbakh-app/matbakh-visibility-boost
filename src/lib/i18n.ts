
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { isSafeTranslationKey, createFallbackText, logMissingKeys } from './i18n-validator';

// Debug logging for i18n status
const debugI18n = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[i18n Debug] ${message}`, data);
  }
};

// Collect missing keys for monitoring
const missingKeys = new Set<string>();

// Enhanced missing key handler with protection
const handleMissingKey = (lng: string[], ns: string, key: string, fallbackValue: string) => {
  const keyPath = `${ns}:${key}`;
  
  if (!missingKeys.has(keyPath)) {
    missingKeys.add(keyPath);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 [i18n] Missing translation key: ${keyPath} for language(s): ${lng.join(', ')}`);
      
      // Sichere sessionStorage-Behandlung mit Error-Handling
      try {
        const existing = JSON.parse(sessionStorage.getItem('i18n-missing-keys') || '[]');
        existing.push({ 
          key: keyPath, 
          languages: lng, 
          timestamp: new Date().toISOString(),
          fallback: fallbackValue 
        });
        sessionStorage.setItem('i18n-missing-keys', JSON.stringify(existing));
      } catch (error) {
        console.error('Failed to log missing i18n key:', error);
      }
    }
  }
  
  // Return a safe fallback that's visible but not breaking
  return fallbackValue || key.split('.').pop() || key;
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Enhanced configuration for maximum stability
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    // ERWEITERT: Alle neuen Legal-Namespaces hinzugefügt!
    ns: [
      'common', 'translation', 'adminPanel', 'auth', 'nav', 'footer', 'hero', 'features', 'dashboard', 'cookieConsent',
      'landing',
      // Service-Namespaces
      'packages', 'services', 'admin', 'pricing',
      // Legal-Namespaces - KRITISCHER FIX: Alle legal-* Namespaces
      'legal-impressum', 'legal-datenschutz', 'legal-agb', 'legal-nutzung', 'legal-kontakt',
      'legal-imprint', 'legal-privacy', 'legal-terms', 'legal-usage', 'legal-contact'
    ],
    defaultNS: 'common',
    fallbackNS: ['common', 'translation'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Add retry logic for failed loads
      requestOptions: {
        cache: 'no-cache'
      }
    },
    interpolation: {
      escapeValue: false
    },
    // Enhanced error handling
    debug: process.env.NODE_ENV === 'development',
    saveMissing: false,
    missingKeyHandler: handleMissingKey,
    // Improved parsing and loading
    parseMissingKeyHandler: (key: string) => {
      return key.split('.').pop() || key;
    },
    // Better error recovery
    load: 'languageOnly',
    preload: ['de', 'en'],
    // KRITISCHER FIX: Sichere localStorage-Behandlung
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      // localStorage Error-Handling
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true
    }
  });

// KRITISCHER FIX: localStorage säubern bei JSON-Parse-Fehlern
try {
  const stored = localStorage.getItem('i18nextLng');
  if (stored && stored !== 'de' && stored !== 'en' && !stored.startsWith('"')) {
    console.warn('🔧 [i18n] Fixing corrupted localStorage language setting');
    localStorage.setItem('i18nextLng', 'de');
  }
} catch (error) {
  console.error('localStorage cleanup failed:', error);
  // Fallback: localStorage komplett löschen für i18n
  try {
    localStorage.removeItem('i18nextLng');
  } catch (e) {
    console.error('Could not clear localStorage:', e);
  }
}

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
