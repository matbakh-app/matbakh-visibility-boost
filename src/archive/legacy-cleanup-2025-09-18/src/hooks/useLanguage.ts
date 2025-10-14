import { useTranslation } from 'react-i18next';

export type Language = 'de' | 'en';

export interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

export const useLanguage = (): UseLanguageReturn => {
  const { i18n, t } = useTranslation();
  
  const language = (i18n.language === 'en' || i18n.language === 'de') ? i18n.language : 'de';
  
  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
  };

  const tWithFallback = (key: string, fallback?: string) => {
    const translation = t(key);
    return translation !== key ? translation : fallback || key;
  };

  return {
    language,
    setLanguage,
    t: tWithFallback
  };
};