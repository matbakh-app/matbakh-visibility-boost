import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { formatDate, formatTime, formatDateTime, formatRelativeTime, formatCurrency, formatCompactCurrency, formatNumber, formatPercentage, formatDuration, getDayNames, getMonthNames, capitalizeFirst, formatBusinessHours } from '../utils/formatters';

export type Language = 'de' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, translations: Record<Language, string>) => string;
  // Formatting helpers
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: Date | string) => string;
  formatRelativeTime: (date: Date | string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatCompactCurrency: (amount: number, currency?: string) => string;
  formatNumber: (number: number) => string;
  formatPercentage: (value: number, fractionDigits?: number) => string;
  formatDuration: (minutes: number) => string;
  getDayNames: () => string[];
  getMonthNames: () => string[];
  formatBusinessHours: (openTime: string, closeTime: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation helper function
const createTranslation = (language: Language) => 
  (key: string, translations: Record<Language, string>): string => {
    return translations[language] || translations.de || key;
  };

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize language from localStorage or default to German
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard-language');
      return (stored === 'en' || stored === 'de') ? stored as Language : 'de';
    }
    return 'de';
  });

  // Update localStorage when language changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-language', newLanguage);
    }
  };

  // Translation function
  const t = createTranslation(language);

  // Create language-aware formatters
  const languageFormatters = {
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => 
      formatDate(date, language, options),
    formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => 
      formatTime(date, language, options),
    formatDateTime: (date: Date | string) => 
      formatDateTime(date, language),
    formatRelativeTime: (date: Date | string) => 
      formatRelativeTime(date, language),
    formatCurrency: (amount: number, currency: string = 'EUR') => 
      formatCurrency(amount, language, currency),
    formatCompactCurrency: (amount: number, currency: string = 'EUR') => 
      formatCompactCurrency(amount, language, currency),
    formatNumber: (number: number) => 
      formatNumber(number, language),
    formatPercentage: (value: number, fractionDigits: number = 1) => 
      formatPercentage(value, language, fractionDigits),
    formatDuration: (minutes: number) => 
      formatDuration(minutes, language),
    getDayNames: () => 
      getDayNames(language),
    getMonthNames: () => 
      getMonthNames(language),
    formatBusinessHours: (openTime: string, closeTime: string) => 
      formatBusinessHours(openTime, closeTime, language)
  };

  const value = {
    language,
    setLanguage,
    t,
    ...languageFormatters
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook for component-specific translations
export function useTranslations<T extends Record<string, Record<Language, string>>>(
  translations: T
) {
  const { language } = useLanguage();
  
  return Object.keys(translations).reduce((acc, key) => {
    acc[key as keyof T] = translations[key][language] || translations[key].de || key;
    return acc;
  }, {} as Record<keyof T, string>);
}

// Hook for common UI texts that are used across multiple components
export function useCommonTexts() {
  const { language } = useLanguage();
  
  const commonTexts = {
    // Time-related
    today: { de: 'Heute', en: 'Today' },
    yesterday: { de: 'Gestern', en: 'Yesterday' },
    thisWeek: { de: 'Diese Woche', en: 'This Week' },
    lastWeek: { de: 'Letzte Woche', en: 'Last Week' },
    thisMonth: { de: 'Diesen Monat', en: 'This Month' },
    lastMonth: { de: 'Letzten Monat', en: 'Last Month' },
    
    // Actions
    view: { de: 'Anzeigen', en: 'View' },
    edit: { de: 'Bearbeiten', en: 'Edit' },
    delete: { de: 'Löschen', en: 'Delete' },
    save: { de: 'Speichern', en: 'Save' },
    cancel: { de: 'Abbrechen', en: 'Cancel' },
    confirm: { de: 'Bestätigen', en: 'Confirm' },
    close: { de: 'Schließen', en: 'Close' },
    open: { de: 'Öffnen', en: 'Open' },
    
    // Status
    active: { de: 'Aktiv', en: 'Active' },
    inactive: { de: 'Inaktiv', en: 'Inactive' },
    pending: { de: 'Wartend', en: 'Pending' },
    completed: { de: 'Abgeschlossen', en: 'Completed' },
    failed: { de: 'Fehlgeschlagen', en: 'Failed' },
    
    // Measurements
    total: { de: 'Gesamt', en: 'Total' },
    average: { de: 'Durchschnitt', en: 'Average' },
    minimum: { de: 'Minimum', en: 'Minimum' },
    maximum: { de: 'Maximum', en: 'Maximum' },
    
    // Trends
    increase: { de: 'Steigerung', en: 'Increase' },
    decrease: { de: 'Rückgang', en: 'Decrease' },
    noChange: { de: 'Keine Änderung', en: 'No Change' },
    
    // Quality
    excellent: { de: 'Ausgezeichnet', en: 'Excellent' },
    good: { de: 'Gut', en: 'Good' },
    average: { de: 'Durchschnittlich', en: 'Average' },
    poor: { de: 'Schlecht', en: 'Poor' },
    
    // Loading states
    loading: { de: 'Lädt...', en: 'Loading...' },
    noData: { de: 'Keine Daten', en: 'No Data' },
    error: { de: 'Fehler', en: 'Error' },
    retry: { de: 'Wiederholen', en: 'Retry' },
    
    // Navigation
    next: { de: 'Weiter', en: 'Next' },
    previous: { de: 'Zurück', en: 'Previous' },
    first: { de: 'Erste', en: 'First' },
    last: { de: 'Letzte', en: 'Last' },
    
    // Common widgets terms
    dashboard: { de: 'Dashboard', en: 'Dashboard' },
    overview: { de: 'Übersicht', en: 'Overview' },
    details: { de: 'Details', en: 'Details' },
    settings: { de: 'Einstellungen', en: 'Settings' },
    reports: { de: 'Berichte', en: 'Reports' },
    analytics: { de: 'Analytics', en: 'Analytics' },
    
    // Validation
    required: { de: 'Erforderlich', en: 'Required' },
    optional: { de: 'Optional', en: 'Optional' },
    invalid: { de: 'Ungültig', en: 'Invalid' },
    valid: { de: 'Gültig', en: 'Valid' }
  };

  return Object.keys(commonTexts).reduce((acc, key) => {
    acc[key as keyof typeof commonTexts] = commonTexts[key as keyof typeof commonTexts][language];
    return acc;
  }, {} as Record<keyof typeof commonTexts, string>);
}