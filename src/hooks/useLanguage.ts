import { useTranslation } from 'react-i18next';

export interface UseLanguageReturn {
  language: 'de' | 'en';
  setLanguage: (lang: 'de' | 'en') => void;
  t: (key: string, fallback?: string) => string;
}

export const useLanguage = (): UseLanguageReturn => {
  const { i18n, t } = useTranslation();
  
  const language = (i18n.language === 'en' || i18n.language === 'de') ? i18n.language : 'de';
  
  const setLanguage = (lang: 'de' | 'en') => {
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