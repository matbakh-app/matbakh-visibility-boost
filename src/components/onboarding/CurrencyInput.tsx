import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, parseCurrency } from '@/utils/currencyFormatter';

interface CurrencyInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = false
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setDisplayValue(formattedValue);
    
    // Convert back to raw number for storage
    const rawValue = parseCurrency(formattedValue);
    onChange(rawValue.toString());
  };

  return (
    <div>
      <Label htmlFor={id} className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {hint && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
    </div>
  );
};