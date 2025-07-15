
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

// KRITISCHER FIX: localStorage säubern bei JSON-Parse-Fehlern
const cleanupCorruptedLocalStorage = () => {
  try {
    const stored = localStorage.getItem('i18nextLng');
    if (stored) {
      // Prüfe ob es valid JSON ist
      try {
        JSON.parse(stored);
        // Wenn erfolgreich geparst, prüfe ob es ein gültiger Sprach-Code ist
        if (stored !== 'de' && stored !== 'en' && !stored.startsWith('"de"') && !stored.startsWith('"en"')) {
          console.warn('🔧 [i18n] Invalid language setting in localStorage, fixing...');
          localStorage.setItem('i18nextLng', 'de');
        }
      } catch (parseError) {
        console.warn('🔧 [i18n] Corrupted localStorage language setting detected, cleaning up...');
        // Versuche zuerst zu reparieren
        if (stored === 'de' || stored === 'en') {
          localStorage.setItem('i18nextLng', `"${stored}"`);
        } else {
          localStorage.setItem('i18nextLng', 'de');
        }
      }
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
};

// Cleanup vor i18n-Initialisierung
cleanupCorruptedLocalStorage();

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Enhanced configuration for maximum stability
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    // COMPLETE: Alle Legal-Namespaces hinzugefügt für beide Sprachen!
    ns: [
      'common', 'translation', 'adminPanel', 'auth', 'nav', 'footer', 'hero', 'features', 'dashboard', 'cookieConsent',
      'landing',
      // Service-Namespaces
      'packages', 'services', 'admin', 'pricing',
      // Legal-Namespaces - ALLE für DE und EN
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
    // KRITISCHER FIX: Sichere localStorage-Behandlung mit robuster Fehlerbehandlung
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      // localStorage Error-Handling - robuster
      lookupLocalStorage: 'i18nextLng',
      // Sichere Parser-Funktion hinzufügen
      convertDetectedLanguage: (lng: string) => {
        // Sicherstellen dass nur gültige Sprachen zurückgegeben werden
        return ['de', 'en'].includes(lng) ? lng : 'de';
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

// Error-Handler für Backend-Loading-Fehler
i18n.on('failedLoading', (lng, ns, msg) => {
  console.warn(`🚨 [i18n] Failed to load namespace "${ns}" for language "${lng}":`, msg);
});

export default i18n;
