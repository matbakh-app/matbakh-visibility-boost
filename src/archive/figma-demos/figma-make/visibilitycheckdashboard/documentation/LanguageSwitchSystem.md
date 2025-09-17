# Language Switch System Documentation
*Sichtbarkeitsanalyse Dashboard - Complete Internationalization (i18n) Implementation Guide*

## Overview

The Sichtbarkeitsanalyse Dashboard features a comprehensive bilingual system supporting German (DE) as primary and English (EN) as secondary language. This document provides complete implementation details for replicating the language switching functionality elsewhere.

---

## 1. Core Architecture

### Language State Management

The language system is managed through the `useLanguage` hook with the following structure:

```typescript
// Language types in useLanguage.ts
export type Language = 'de' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, translations: Record<Language, string>) => string;
  
  // Formatting helpers integrated into context
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
```

### Language Initialization & Persistence

```typescript
// Language initialization in useLanguage.ts
const [language, setLanguageState] = useState<Language>(() => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dashboard-language');
    return (stored === 'en' || stored === 'de') ? stored as Language : 'de';
  }
  return 'de'; // Default to German
});

// Persistence on change
const setLanguage = (newLanguage: Language) => {
  setLanguageState(newLanguage);
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashboard-language', newLanguage);
  }
};
```

---

## 2. LanguageSwitch Component

### Complete LanguageSwitch Implementation

```tsx
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem 
} from './ui/dropdown-menu';
import { useLanguage, Language } from '../hooks/useLanguage';

interface LanguageSwitchProps {
  variant?: 'button' | 'dropdown' | 'toggle' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showFlag?: boolean;
  disabled?: boolean;
  className?: string;
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({
  variant = 'dropdown',
  size = 'md',
  showLabel = false,
  showFlag = true,
  disabled = false,
  className = ''
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Language configuration
  const languages = {
    de: {
      code: 'de',
      name: 'Deutsch',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      region: 'Deutschland'
    },
    en: {
      code: 'en', 
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      region: 'United States'
    }
  } as const;

  const currentLang = languages[language];
  const otherLang = languages[language === 'de' ? 'en' : 'de'];

  // Size variants
  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  // Toggle between languages (for toggle variant)
  const toggleLanguage = () => {
    const newLang = language === 'de' ? 'en' : 'de';
    setLanguage(newLang);
  };

  // Switch to specific language
  const switchToLanguage = (newLang: Language) => {
    setLanguage(newLang);
    setIsOpen(false);
  };

  // Variant implementations
  switch (variant) {
    case 'toggle':
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          disabled={disabled}
          className={`
            language-toggle
            ${sizeClasses[size]}
            relative overflow-hidden
            transition-all duration-200 ease-in-out
            hover:scale-105 active:scale-95
            focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${className}
          `}
          aria-label={`Switch to ${otherLang.name}`}
          title={`Switch to ${otherLang.name}`}
        >
          {/* Background transition effect */}
          <div 
            className={`
              absolute inset-0 transition-all duration-300 ease-in-out
              ${language === 'de' 
                ? 'bg-gradient-to-br from-red-50 to-yellow-50' 
                : 'bg-gradient-to-br from-blue-50 to-red-50'
              }
              opacity-20 rounded-md
            `}
          />
          
          {/* Current language flag/indicator */}
          <div className={`
            ${iconSizes[size]}
            transition-all duration-200 ease-in-out
            flex items-center justify-center
          `}>
            {showFlag ? (
              <span className="text-base">{currentLang.flag}</span>
            ) : (
              <span className="font-medium text-foreground">
                {currentLang.code.toUpperCase()}
              </span>
            )}
          </div>
        </Button>
      );

    case 'button':
      return (
        <div className="flex items-center gap-2">
          {Object.values(languages).map((lang) => (
            <Button
              key={lang.code}
              variant={language === lang.code ? "default" : "ghost"}
              size="sm"
              onClick={() => switchToLanguage(lang.code as Language)}
              disabled={disabled}
              className={`
                ${sizeClasses[size]}
                transition-all duration-200 ease-in-out
                ${language === lang.code ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${className}
              `}
              aria-label={`Switch to ${lang.name}`}
            >
              {showFlag && <span className="mr-2">{lang.flag}</span>}
              <span className="font-medium">
                {showLabel ? lang.name : lang.code.toUpperCase()}
              </span>
            </Button>
          ))}
        </div>
      );

    case 'compact':
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            px-2 gap-1
            transition-all duration-200 ease-in-out
            hover:bg-accent
            ${className}
          `}
          aria-label={`Current: ${currentLang.name}, switch to ${otherLang.name}`}
        >
          {showFlag && <span>{currentLang.flag}</span>}
          <span className="font-medium text-foreground">
            {currentLang.code.toUpperCase()}
          </span>
        </Button>
      );

    default: // dropdown
      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={`
                language-dropdown-trigger
                ${sizeClasses[size]}
                px-3 gap-2
                transition-all duration-200 ease-in-out
                hover:bg-accent
                data-[state=open]:bg-accent
                ${className}
              `}
              aria-label="Select language"
            >
              <Globe className={iconSizes[size]} />
              
              {showFlag && <span>{currentLang.flag}</span>}
              
              <span className="font-medium text-foreground">
                {showLabel ? currentLang.name : currentLang.code.toUpperCase()}
              </span>
              
              <ChevronDown 
                className={`
                  w-3 h-3 
                  transition-transform duration-200
                  ${isOpen ? 'rotate-180' : 'rotate-0'}
                `} 
              />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-48">
            {Object.values(languages).map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => switchToLanguage(lang.code as Language)}
                className={`
                  flex items-center gap-3 p-3 cursor-pointer
                  transition-all duration-150 ease-in-out
                  hover:bg-accent
                  ${language === lang.code ? 'bg-accent/50' : ''}
                `}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium text-foreground">
                    {lang.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {lang.region}
                  </span>
                </div>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
  }
};

export default LanguageSwitch;
```

---

## 3. Translation Architecture

### Component-Level Translation Pattern

```tsx
// Standard translation pattern used across components
const ComponentWithTranslations: React.FC = () => {
  const { language } = useLanguage();

  // Translation object structure
  const translations = {
    title: {
      de: 'Dashboard-Übersicht',
      en: 'Dashboard Overview'
    },
    subtitle: {
      de: 'Wichtige Kennzahlen und Performance-Metriken',
      en: 'Key metrics and performance indicators'
    },
    lastUpdated: {
      de: 'Zuletzt aktualisiert',
      en: 'Last updated'
    },
    noData: {
      de: 'Keine Daten verfügbar',
      en: 'No data available'
    },
    loading: {
      de: 'Lädt...',
      en: 'Loading...'
    },
    error: {
      de: 'Fehler beim Laden der Daten',
      en: 'Error loading data'
    }
  };

  // Helper function for easy access
  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  return (
    <div>
      <h1>{getText('title')}</h1>
      <p>{getText('subtitle')}</p>
    </div>
  );
};
```

### Advanced Translation Patterns

```tsx
// Hook for reusable translations
export function useTranslations<T extends Record<string, Record<Language, string>>>(
  translations: T
) {
  const { language } = useLanguage();
  
  return Object.keys(translations).reduce((acc, key) => {
    acc[key as keyof T] = translations[key][language] || translations[key].de || key;
    return acc;
  }, {} as Record<keyof T, string>);
}

// Common UI translations hook
export function useCommonTexts() {
  const { language } = useLanguage();
  
  const commonTexts = {
    // Actions
    save: { de: 'Speichern', en: 'Save' },
    cancel: { de: 'Abbrechen', en: 'Cancel' },
    delete: { de: 'Löschen', en: 'Delete' },
    edit: { de: 'Bearbeiten', en: 'Edit' },
    view: { de: 'Anzeigen', en: 'View' },
    close: { de: 'Schließen', en: 'Close' },
    
    // Status
    active: { de: 'Aktiv', en: 'Active' },
    inactive: { de: 'Inaktiv', en: 'Inactive' },
    pending: { de: 'Wartend', en: 'Pending' },
    completed: { de: 'Abgeschlossen', en: 'Completed' },
    
    // Time
    today: { de: 'Heute', en: 'Today' },
    yesterday: { de: 'Gestern', en: 'Yesterday' },
    thisWeek: { de: 'Diese Woche', en: 'This Week' },
    thisMonth: { de: 'Diesen Monat', en: 'This Month' },
    
    // Quality indicators
    excellent: { de: 'Ausgezeichnet', en: 'Excellent' },
    good: { de: 'Gut', en: 'Good' },
    average: { de: 'Durchschnittlich', en: 'Average' },
    poor: { de: 'Schlecht', en: 'Poor' }
  };

  return Object.keys(commonTexts).reduce((acc, key) => {
    acc[key as keyof typeof commonTexts] = commonTexts[key as keyof typeof commonTexts][language];
    return acc;
  }, {} as Record<keyof typeof commonTexts, string>);
}

// Usage example
const MyComponent = () => {
  const texts = useCommonTexts();
  const customTexts = useTranslations({
    welcome: { de: 'Willkommen', en: 'Welcome' },
    dashboard: { de: 'Dashboard', en: 'Dashboard' }
  });

  return (
    <div>
      <h1>{customTexts.welcome}</h1>
      <button>{texts.save}</button>
    </div>
  );
};
```

---

## 4. Formatting System

### Number & Currency Formatting

```typescript
// From formatters.ts - Localized number formatting
export const formatNumber = (number: number, language: Language): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale).format(number);
};

// Examples:
// DE: 1.234.567 → "1.234.567"
// EN: 1234567 → "1,234,567"

export const formatCurrency = (amount: number, language: Language, currency: string = 'EUR'): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Examples:
// DE: 1234.56 → "1.234,56 €"
// EN: 1234.56 → "€1,234.56"

export const formatPercentage = (value: number, language: Language, fractionDigits: number = 1): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value / 100);
};

// Examples:
// DE: 23.5 → "23,5 %"
// EN: 23.5 → "23.5%"
```

### Date & Time Formatting

```typescript
// Date formatting with language preferences
export const formatDate = (date: Date | string, language: Language, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
};

// Examples:
// DE: new Date(2024, 0, 15) → "15. Jan. 2024"
// EN: new Date(2024, 0, 15) → "Jan 15, 2024"

export const formatTime = (date: Date | string, language: Language): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: language === 'en' // 12-hour for EN, 24-hour for DE
  };
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

// Examples:
// DE: new Date(2024, 0, 1, 14, 30) → "14:30"
// EN: new Date(2024, 0, 1, 14, 30) → "2:30 PM"

// Business hours formatting
export const formatBusinessHours = (openTime: string, closeTime: string, language: Language): string => {
  const separator = language === 'de' ? ' - ' : ' - ';
  return `${openTime}${separator}${closeTime}`;
};

// Day names for charts and calendars
export const getDayNames = (language: Language): string[] => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
  });
};

// Examples:
// DE: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
// EN: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
```

### Brand-Specific Formatting

```typescript
// Brand name (never translated)
export const getBrandName = (language: Language): string => {
  return language === 'de' ? 'Sichtbarkeitsanalyse' : 'Visibility Check';
};

// Localized email addresses
export const getBrandEmail = (language: Language, type: 'support' | 'admin' | 'info' = 'support'): string => {
  const domain = language === 'de' ? 'sichtbarkeitsanalyse.de' : 'visibilitycheck.com';
  return `${type}@${domain}`;
};

// Phone number formatting
export const formatPhoneNumber = (phone: string, language: Language): string => {
  if (!phone.startsWith('+49')) return phone;
  
  const cleanPhone = phone.replace(/\s+/g, '');
  const countryCode = '+49';
  const areaCode = cleanPhone.slice(3, 5);
  const number = cleanPhone.slice(5);
  
  if (language === 'de') {
    // German style: +49 30 12 34 56 78
    const formatted = number.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    return `${countryCode} ${areaCode} ${formatted}`;
  } else {
    // English style: +49 30 1234 5678
    const formatted = number.replace(/(\d{4})(\d{4})/, '$1 $2');
    return `${countryCode} ${areaCode} ${formatted}`;
  }
};
```

---

## 5. Layout Behavior Analysis

### What Changes During Language Switch

#### **Text Content Changes**
```tsx
// All text content updates immediately without page reload
const HeaderExample = () => {
  const { language } = useLanguage();
  
  return (
    <header>
      {/* App name changes based on language */}
      <h1>{language === 'de' ? 'Sichtbarkeitsanalyse' : 'Visibility Check'}</h1>
      
      {/* Subtitle updates */}
      <p>{language === 'de' 
        ? 'Restaurant Performance Dashboard' 
        : 'Restaurant Performance Dashboard'
      }</p>
    </header>
  );
};
```

#### **Number Formatting Changes**
```tsx
// All numbers reformat automatically
const MetricsExample = () => {
  const { formatNumber, formatCurrency, formatPercentage } = useLanguage();
  
  const revenue = 1234567.89;
  const occupancy = 87.5;
  const visitors = 12847;
  
  return (
    <div>
      {/* DE: "1.234.567,89 €" → EN: "€1,234,567.89" */}
      <span>{formatCurrency(revenue)}</span>
      
      {/* DE: "87,5 %" → EN: "87.5%" */}
      <span>{formatPercentage(occupancy)}</span>
      
      {/* DE: "12.847" → EN: "12,847" */}
      <span>{formatNumber(visitors)}</span>
    </div>
  );
};
```

#### **Chart & Graph Labels**
```tsx
// Chart components automatically update labels
const ChartExample = () => {
  const { getDayNames, language } = useLanguage();
  
  const dayNames = getDayNames(); // Auto-localized day names
  
  const data = [
    { day: dayNames[0], revenue: 2840 }, // "So"/"Sun"
    { day: dayNames[1], revenue: 3120 }, // "Mo"/"Mon"
    // ... etc
  ];
  
  return (
    <LineChart data={data}>
      <XAxis dataKey="day" /> {/* Shows localized day names */}
    </LineChart>
  );
};
```

#### **Date & Time Display**
```tsx
// All dates and times reformat
const DateTimeExample = () => {
  const { formatDate, formatTime, formatRelativeTime } = useLanguage();
  
  const now = new Date();
  const businessHour = "19:00";
  
  return (
    <div>
      {/* DE: "15. Jan. 2024" → EN: "Jan 15, 2024" */}
      <span>{formatDate(now)}</span>
      
      {/* DE: "19:00" → EN: "7:00 PM" */}
      <span>{formatTime(businessHour)}</span>
      
      {/* DE: "vor 2 Stunden" → EN: "2 hours ago" */}
      <span>{formatRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000))}</span>
    </div>
  );
};
```

### **Layout Stability During Switch**

The system is designed to maintain layout stability:

```css
/* Text containers use consistent sizing */
.metric-container {
  min-width: 120px; /* Prevents layout shift */
  text-align: center;
}

.button-text {
  min-width: 80px; /* Consistent button sizes */
  text-align: center;
}

/* Flexible containers for varying text lengths */
.text-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap; /* Handles overflow gracefully */
}
```

### **Animation & Transitions**

```css
/* Smooth text transition during language change */
[data-translating="true"] {
  transition: opacity 150ms ease-in-out;
}

[data-translating="true"]:is(.changing) {
  opacity: 0.7;
}

/* Prevent layout jump during transitions */
.language-switch-container {
  transition: all 200ms ease-in-out;
}

.language-switch-container:is([data-switching="true"]) {
  opacity: 0.9;
  transform: scale(0.98);
}
```

---

## 6. Widget-Specific Language Behavior

### **Widget Headers & Titles**
```tsx
// Every widget header updates
const WidgetHeader = ({ widgetType }: { widgetType: string }) => {
  const { language } = useLanguage();
  
  const titles = {
    analytics: { de: 'Website Analytics', en: 'Website Analytics' },
    reviews: { de: 'Bewertungen', en: 'Reviews' },
    orders: { de: 'Bestellungen & Umsatz', en: 'Orders & Revenue' }
  };
  
  return (
    <CardTitle>
      {titles[widgetType]?.[language] || widgetType}
    </CardTitle>
  );
};
```

### **Status Badges & Labels**
```tsx
// Status indicators change language
const StatusBadge = ({ status }: { status: string }) => {
  const { language } = useLanguage();
  
  const statusTexts = {
    excellent: { de: 'Ausgezeichnet', en: 'Excellent' },
    good: { de: 'Gut', en: 'Good' },
    warning: { de: 'Achtung', en: 'Warning' },
    error: { de: 'Fehler', en: 'Error' }
  };
  
  return (
    <Badge variant={status === 'excellent' ? 'default' : 'secondary'}>
      {statusTexts[status]?.[language] || status}
    </Badge>
  );
};
```

### **Form Labels & Placeholders**
```tsx
// Form elements update completely
const FormExample = () => {
  const { language } = useLanguage();
  
  const formTexts = {
    emailLabel: { de: 'E-Mail-Adresse', en: 'Email Address' },
    emailPlaceholder: { de: 'ihre.email@beispiel.de', en: 'your.email@example.com' },
    passwordLabel: { de: 'Passwort', en: 'Password' },
    submitButton: { de: 'Anmelden', en: 'Sign In' }
  };
  
  return (
    <form>
      <label>{formTexts.emailLabel[language]}</label>
      <input 
        type="email" 
        placeholder={formTexts.emailPlaceholder[language]}
      />
      
      <label>{formTexts.passwordLabel[language]}</label>
      <input type="password" />
      
      <button type="submit">
        {formTexts.submitButton[language]}
      </button>
    </form>
  );
};
```

---

## 7. Performance & Loading

### **Lazy Loading Strategy**

```tsx
// Translation lazy loading for large components
const useLazyTranslations = (componentName: string) => {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState(null);
  
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const module = await import(`../translations/${componentName}/${language}.json`);
        setTranslations(module.default);
      } catch (error) {
        console.warn(`Failed to load translations for ${componentName}:${language}`);
        // Fallback to embedded translations
      }
    };
    
    loadTranslations();
  }, [language, componentName]);
  
  return translations;
};

// Usage in complex components
const ComplexWidget = () => {
  const translations = useLazyTranslations('complex-widget');
  const { language } = useLanguage();
  
  if (!translations) {
    return <SkeletonLoader />;
  }
  
  return (
    <Card>
      <CardTitle>{translations.title}</CardTitle>
      <CardContent>{translations.content}</CardContent>
    </Card>
  );
};
```

### **Memory Management**

```typescript
// Translation cache management
class TranslationCache {
  private cache = new Map<string, Record<string, string>>();
  private maxSize = 50; // Maximum cached translation sets
  
  get(key: string): Record<string, string> | null {
    return this.cache.get(key) || null;
  }
  
  set(key: string, translations: Record<string, string>): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, translations);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const translationCache = new TranslationCache();
```

---

## 8. Advanced Features

### **Language Detection**

```typescript
// Browser language detection with fallback
const detectUserLanguage = (): Language => {
  if (typeof window === 'undefined') return 'de';
  
  // Check localStorage first
  const stored = localStorage.getItem('dashboard-language');
  if (stored === 'de' || stored === 'en') {
    return stored as Language;
  }
  
  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('en')) return 'en';
  
  // Default to German (primary market)
  return 'de';
};
```

### **RTL Support Preparation**

```css
/* Future RTL support structure */
:root {
  --text-direction: ltr;
  --start: left;
  --end: right;
}

:root[dir="rtl"] {
  --text-direction: rtl;
  --start: right;
  --end: left;
}

.text-align-start {
  text-align: var(--start);
}

.margin-start-4 {
  margin-inline-start: 1rem;
}

.border-start {
  border-inline-start: 1px solid var(--border);
}
```

### **Pluralization Handling**

```typescript
// Simple pluralization utility
export const pluralize = (
  count: number, 
  singular: string, 
  plural: string, 
  language: Language
): string => {
  if (language === 'de') {
    // German pluralization rules
    return count === 1 ? singular : plural;
  } else {
    // English pluralization rules
    return count === 1 ? singular : plural;
  }
};

// Usage example
const ItemCount = ({ count }: { count: number }) => {
  const { language } = useLanguage();
  
  const text = pluralize(
    count,
    language === 'de' ? 'Element' : 'item',
    language === 'de' ? 'Elemente' : 'items',
    language
  );
  
  return <span>{count} {text}</span>;
};
```

---

## 9. Integration Checklist

### **Required Setup Steps**

1. **Install Dependencies**
   ```bash
   # No additional dependencies required - uses browser Intl API
   ```

2. **Setup Language Provider**
   ```tsx
   // Wrap your app
   import { LanguageProvider } from './hooks/useLanguage';
   
   function App() {
     return (
       <LanguageProvider>
         <YourAppContent />
       </LanguageProvider>
     );
   }
   ```

3. **Add Language Switch Component**
   ```tsx
   import LanguageSwitch from './components/LanguageSwitch';
   
   function Header() {
     return (
       <header>
         <LanguageSwitch variant="dropdown" showLabel={true} />
       </header>
     );
   }
   ```

4. **Implement Component Translations**
   ```tsx
   import { useLanguage } from './hooks/useLanguage';
   
   function MyComponent() {
     const { language, formatCurrency, formatDate } = useLanguage();
     
     const texts = {
       title: { de: 'Titel', en: 'Title' }
     };
     
     return <h1>{texts.title[language]}</h1>;
   }
   ```

### **Testing Checklist**

- [ ] Language persists across browser sessions
- [ ] All text content updates on switch
- [ ] Numbers format correctly for each language
- [ ] Dates use appropriate format (DD.MM vs MM/DD)
- [ ] Time displays 24h (DE) vs 12h (EN)
- [ ] Currency formatting matches locale
- [ ] Charts update axis labels
- [ ] Form placeholders translate
- [ ] Button text translates
- [ ] Error messages appear in correct language
- [ ] Layout remains stable during switch
- [ ] No text overflow or truncation
- [ ] Performance remains smooth
- [ ] Accessibility attributes update

### **Customization Options**

```tsx
// Custom language configurations
const customLanguageConfig = {
  de: {
    code: 'de',
    name: 'Deutsch',
    flag: '🇩🇪',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h'
  },
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  }
};

// Custom formatting functions
const customFormatCurrency = (amount: number, language: Language) => {
  const config = customLanguageConfig[language];
  // ... custom formatting logic
};
```

This comprehensive documentation provides everything needed to understand and replicate the Sichtbarkeitsanalyse language switching system.