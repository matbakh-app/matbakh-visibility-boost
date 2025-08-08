// Number formatting utilities
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('de-DE').format(value);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('de-DE', { 
    style: 'percent', 
    minimumFractionDigits: 1,
    maximumFractionDigits: 1 
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