import React, { createContext, useContext, useState } from 'react';

type Language = 'de' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: React.ReactNode;
}

export type { Language };

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('de');

  const translations = {
    de: {
      // Add German translations here
      'visibility.check': 'Sichtbarkeitsprüfung',
      'analysis.running': 'Analyse läuft',
      'results.title': 'Ergebnisse',
    },
    en: {
      // Add English translations here
      'visibility.check': 'Visibility Check',
      'analysis.running': 'Analysis Running',
      'results.title': 'Results',
    },
  };

  const t = (key: string, fallback?: string) => {
    return translations[language][key] || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};