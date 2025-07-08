export const formatCurrency = (value: string | number): string => {
  if (!value) return '';
  
  // Convert to string and remove any non-digit characters except decimal point
  const numericValue = value.toString().replace(/[^\d.]/g, '');
  
  // Convert to number to handle decimal places properly
  const num = parseFloat(numericValue);
  if (isNaN(num)) return '';
  
  // Format with thousands separators (dots for German style)
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

export const parseCurrency = (formattedValue: string): number => {
  if (!formattedValue) return 0;
  
  // Remove all non-digit characters
  const numericValue = formattedValue.replace(/[^\d]/g, '');
  
  return parseInt(numericValue) || 0;
};