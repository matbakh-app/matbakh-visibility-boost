// Number formatting utilities
export const formatNumber = (value: number, language: 'de' | 'en' = 'de'): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale).format(value);
};

export const formatPercentage = (value: number, language: 'de' | 'en' = 'de', decimals: number = 1): string => {
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale, { 
    style: 'percent', 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  }).format(value / 100);
};

export const formatDuration = (minutes: number, language: 'de' | 'en' = 'de'): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (language === 'de') {
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  } else {
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
};

export const getDayNames = (language: 'de' | 'en' = 'de'): string[] => {
  if (language === 'de') {
    return ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
};

export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency
  }).format(amount);
};