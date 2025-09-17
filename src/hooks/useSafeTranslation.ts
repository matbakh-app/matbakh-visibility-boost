/**
 * Sichere Translation-Hook mit 0-Fehler-Toleranz
 * Verhindert i18n crashes und undefined.toUpperCase() Fehler
 */

import { useTranslation } from 'react-i18next';

export const useSafeTranslation = () => {
  try {
    const { t, i18n } = useTranslation();
    
    // Sichere Sprach-Utilities
    const safeLanguage = i18n?.language || 'de';
    const safeLanguageUpper = safeLanguage.toUpperCase();
    
    const changeLanguage = async (lng: string) => {
      try {
        await i18n?.changeLanguage?.(lng);
      } catch (error) {
        console.warn('⚠️ Language change failed:', error);
      }
    };
    
    const safeT = (key: string, options?: any) => {
      try {
        return t(key, options);
      } catch (error) {
        console.warn(`⚠️ Translation missing for key: ${key}`);
        return key; // Fallback zum Key selbst
      }
    };
    
    return {
      t: safeT,
      i18n,
      language: safeLanguage,
      languageUpper: safeLanguageUpper,
      changeLanguage,
      isReady: !!i18n?.isInitialized,
    };
  } catch (error) {
    console.error('❌ i18n context error:', error);
    
    // Vollständiger Fallback
    return {
      t: (key: string) => key,
      i18n: null,
      language: 'de',
      languageUpper: 'DE',
      changeLanguage: async () => {},
      isReady: false,
    };
  }
};

// Komponente wurde nach src/components/SafeTranslationLoader.tsx ausgelagert