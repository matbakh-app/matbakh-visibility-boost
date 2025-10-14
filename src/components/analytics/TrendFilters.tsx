// TrendFilters Component - Task 6.4.2.3
// Filter Controls for Visibility Trend Chart
// Requirements: B.3, B.4

import React, { useState } from 'react';
import type { FC } from 'react';
import type { TrendFilters, ScoreType, DateRangePreset, BusinessUnit } from '@/types/score-history';

type TrendFiltersProps = {
  value: TrendFilters;
  onChange: (filters: TrendFilters) => void;
  businessUnits?: BusinessUnit[];
  className?: string;
};

// Score type labels in German
const scoreTypeLabels: Record<ScoreType, string> = {
  overall_visibility: 'Gesamtsichtbarkeit',
  google_presence: 'Google Präsenz',
  social_media: 'Social Media',
  website_performance: 'Website Performance',
  review_management: 'Bewertungsmanagement',
  local_seo: 'Lokale SEO',
  content_quality: 'Content Qualität',
  competitive_position: 'Wettbewerbsposition'
};

// Date range presets
const dateRangePresets: DateRangePreset[] = [
  {
    label: 'Letzte 7 Tage',
    value: 'last_7_days',
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return { from, to };
    }
  },
  {
    label: 'Letzte 30 Tage',
    value: 'last_30_days',
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from, to };
    }
  },
  {
    label: 'Letzte 90 Tage',
    value: 'last_90_days',
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);
      return { from, to };
    }
  },
  {
    label: 'Letztes Jahr',
    value: 'last_year',
    getDates: () => {
      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      return { from, to };
    }
  },
  {
    label: 'Benutzerdefiniert',
    value: 'custom',
    getDates: () => ({ from: new Date(), to: new Date() })
  }
];

export const TrendFilters: FC<TrendFiltersProps> = ({ 
  value, 
  onChange, 
  businessUnits = [], 
  className = '' 
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('last_30_days');
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Handle score type change
  const handleScoreTypeChange = (scoreType: ScoreType) => {
    onChange({
      ...value,
      scoreType
    });
  };

  // Handle date range preset change
  const handleDateRangePresetChange = (presetValue: string) => {
    setSelectedPreset(presetValue);
    
    if (presetValue === 'custom') {
      setShowCustomDates(true);
      return;
    }
    
    setShowCustomDates(false);
    const preset = dateRangePresets.find(p => p.value === presetValue);
    if (preset) {
      const dateRange = preset.getDates();
      onChange({
        ...value,
        dateRange
      });
    }
  };

  // Handle custom date change
  const handleCustomDateChange = (type: 'from' | 'to', date: string) => {
    const newDate = new Date(date);
    onChange({
      ...value,
      dateRange: {
        ...value.dateRange,
        [type]: newDate
      }
    });
  };

  // Handle business unit change
  const handleBusinessUnitChange = (businessUnitId: string) => {
    onChange({
      ...value,
      businessUnit: businessUnitId === 'all' ? undefined : businessUnitId
    });
  };

  // Format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metrik
          </label>
          <select
            value={value.scoreType}
            onChange={(e) => handleScoreTypeChange(e.target.value as ScoreType)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(scoreTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zeitraum
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => handleDateRangePresetChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateRangePresets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Business Unit Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Einheit
          </label>
          <select
            value={value.businessUnit || 'all'}
            onChange={(e) => handleBusinessUnitChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Alle Einheiten</option>
            {businessUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {showCustomDates && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Von
              </label>
              <input
                type="date"
                value={formatDateForInput(value.dateRange.from)}
                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bis
              </label>
              <input
                type="date"
                value={formatDateForInput(value.dateRange.to)}
                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {scoreTypeLabels[value.scoreType]}
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
            {value.dateRange.from.toLocaleDateString('de-DE')} - {value.dateRange.to.toLocaleDateString('de-DE')}
          </span>
          {value.businessUnit && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {businessUnits.find(u => u.id === value.businessUnit)?.name || value.businessUnit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};