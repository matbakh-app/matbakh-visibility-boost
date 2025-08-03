import { Language } from '../hooks/useLanguage';

/**
 * Date and Time Formatting Utilities
 */
export const formatDate = (date: Date | string, language: Language, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
};

export const formatTime = (date: Date | string, language: Language, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: language === 'en'
  };
  
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
};

export const formatDateTime = (date: Date | string, language: Language): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: language === 'en'
  };
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

export const formatRelativeTime = (date: Date | string, language: Language): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
  
  const rtf = new Intl.RelativeTimeFormat(language === 'de' ? 'de-DE' : 'en-US', { numeric: 'auto' });
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return rtf.format(-diffInMinutes, 'minute');
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return rtf.format(-hours, 'hour');
  } else {
    const days = Math.floor(diffInHours / 24);
    return rtf.format(-days, 'day');
  }
};

/**
 * Currency Formatting Utilities
 */
export const formatCurrency = (amount: number, language: Language, currency: string = 'EUR'): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatCompactCurrency = (amount: number, language: Language, currency: string = 'EUR'): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(amount);
};

/**
 * Number Formatting Utilities
 */
export const formatNumber = (number: number, language: Language): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(locale).format(number);
};

export const formatPercentage = (value: number, language: Language, fractionDigits: number = 1): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value / 100);
};

/**
 * Duration Formatting
 */
export const formatDuration = (minutes: number, language: Language): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (language === 'de') {
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${remainingMinutes}m`;
  } else {
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${remainingMinutes}m`;
  }
};

/**
 * Day of Week formatting
 */
export const getDayNames = (language: Language): string[] => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + i);
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
  });
};

export const getMonthNames = (language: Language): string[] => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(i);
    return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
  });
};

/**
 * Common text transformations
 */
export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatBusinessHours = (openTime: string, closeTime: string, language: Language): string => {
  const separator = language === 'de' ? ' - ' : ' - ';
  return `${openTime}${separator}${closeTime}`;
};