
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

// Enhanced missing key handler with protection and fallbacks
const handleMissingKey = (lng: string[], ns: string, key: string, fallbackValue: string) => {
  const keyPath = `${ns}:${key}`;
  
  if (!missingKeys.has(keyPath)) {
    missingKeys.add(keyPath);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 [i18n] Missing translation key: ${keyPath} for language(s): ${lng.join(', ')}`);
      
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
  
  // Return intelligent fallback based on key
  if (fallbackValue) return fallbackValue;
  
  // Generate fallback from key structure
  const keyParts = key.split('.');
  const lastPart = keyParts[keyParts.length - 1];
  
  // Common fallbacks for known patterns
  const fallbacks: Record<string, string> = {
    'title': 'Titel',
    'subtitle': 'Untertitel', 
    'description': 'Beschreibung',
    'loading': 'Lädt...',
    'error': 'Fehler',
    'success': 'Erfolgreich',
    'home': 'Start',
    'services': 'Leistungen',
    'offers': 'Angebote',
    'contact': 'Kontakt',
    'login': 'Login',
    'logout': 'Abmelden',
    'profile': 'Profil',
    'dashboard': 'Dashboard',
    'back': 'Zurück',
    'next': 'Weiter',
    'save': 'Speichern',
    'cancel': 'Abbrechen'
  };
  
  return fallbacks[lastPart] || lastPart || key;
};

// Cleanup corrupted localStorage
const cleanupCorruptedLocalStorage = () => {
  try {
    const stored = localStorage.getItem('i18nextLng');
    if (stored) {
      try {
        JSON.parse(stored);
        if (stored !== 'de' && stored !== 'en' && !stored.startsWith('"de"') && !stored.startsWith('"en"')) {
          console.warn('🔧 [i18n] Invalid language setting in localStorage, fixing...');
          localStorage.setItem('i18nextLng', 'de');
        }
      } catch (parseError) {
        console.warn('🔧 [i18n] Corrupted localStorage language setting detected, cleaning up...');
        if (stored === 'de' || stored === 'en') {
          localStorage.setItem('i18nextLng', `"${stored}"`);
        } else {
          localStorage.setItem('i18nextLng', 'de');
        }
      }
    }
  } catch (error) {
    console.error('localStorage cleanup failed:', error);
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
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    ns: [
      'common', 'translation', 'adminPanel', 'auth', 'nav', 'footer', 'hero', 
      'features', 'dashboard', 'cookieConsent', 'landing', 'packages', 'services', 
      'admin', 'pricing', 'onboarding', 'legal-kontakt', 'legal-impressum',
      'legal-datenschutz', 'legal-agb', 'legal-nutzung', 'legal-privacy',
      'legal-imprint', 'legal-terms', 'legal-usage', 'legal-contact'
    ],
    defaultNS: 'common',
    fallbackNS: ['common', 'translation'],
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-cache'
      }
    },
    interpolation: {
      escapeValue: false
    },
    debug: process.env.NODE_ENV === 'development',
    saveMissing: false,
    missingKeyHandler: handleMissingKey,
    parseMissingKeyHandler: (key: string) => {
      return key.split('.').pop() || key;
    },
    load: 'languageOnly',
    preload: ['de', 'en'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng: string) => {
        return ['de', 'en'].includes(lng) ? lng : 'de';
      }
    }
  });

// Enhanced event handlers
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

i18n.on('failedLoading', (lng, ns, msg) => {
  console.warn(`🚨 [i18n] Failed to load namespace "${ns}" for language "${lng}":`, msg);
});

export default i18n;
