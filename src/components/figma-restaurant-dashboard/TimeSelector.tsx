import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

type TimePeriod = 'heute' | '7t' | '30t' | '90t';

interface TimeSelectorProps {
  defaultPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod, isLoading: boolean) => void;
  className?: string;
}

export default function TimeSelector({ defaultPeriod, onPeriodChange, className = '' }: TimeSelectorProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(defaultPeriod);
  const [isLoading, setIsLoading] = useState(false);

  const periods = [
    { key: 'heute' as TimePeriod, label: 'Heute' },
    { key: '7t' as TimePeriod, label: '7T' },
    { key: '30t' as TimePeriod, label: '30T' },
    { key: '90t' as TimePeriod, label: '90T' }
  ];

  const handlePeriodChange = async (period: TimePeriod) => {
    if (period === selectedPeriod || isLoading) return;
    
    setIsLoading(true);
    setSelectedPeriod(period);
    onPeriodChange(period, true);
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
      onPeriodChange(period, false);
    }, 1000);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex bg-white border border-gray-200 rounded-md shadow-sm">
        {periods.map((period, index) => (
          <button
            key={period.key}
            onClick={() => handlePeriodChange(period.key)}
            disabled={isLoading}
            className={`
              w-12 h-9 md:w-10 md:h-7 text-xs font-medium transition-all duration-200 flex items-center justify-center min-h-[44px] md:min-h-[auto]
              ${index === 0 ? 'rounded-l-md' : ''}
              ${index === periods.length - 1 ? 'rounded-r-md' : ''}
              ${selectedPeriod === period.key 
                ? 'bg-[#4F46E5] text-white shadow-sm' 
                : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-r border-gray-200 last:border-r-0'
              }
              ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            {isLoading && selectedPeriod === period.key ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              period.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
}