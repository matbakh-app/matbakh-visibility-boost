
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

interface UseI18nValidationReturn {
  t: (key: string, fallback?: string) => string;
  safeT: (key: string, fallback: string) => string;
  validateKey: (key: string) => boolean;
  namespace: string;
}

/**
 * Enhanced i18n hook with automatic fallbacks and validation
 * @param namespace - Translation namespace
 * @returns Enhanced translation functions
 */
export const useI18nValidation = (namespace: string = 'common'): UseI18nValidationReturn => {
  const { t: originalT, i18n } = useTranslation(namespace);

  const t = useCallback((key: string, fallback?: string): string => {
    const result = originalT(key, fallback);
    
    // If no fallback provided and key is returned as-is, generate intelligent fallback
    if (!fallback && result === key) {
      const keyParts = key.split('.');
      const lastPart = keyParts[keyParts.length - 1];
      
      // Common German fallbacks
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
    }
    
    return result;
  }, [originalT]);

  const safeT = useCallback((key: string, fallback: string): string => {
    return originalT(key, fallback);
  }, [originalT]);

  const validateKey = useCallback((key: string): boolean => {
    return i18n.exists(key, { ns: namespace });
  }, [i18n, namespace]);

  return {
    t,
    safeT,
    validateKey,
    namespace
  };
};
