// ForecastControls Component - Task 6.4.3.3
// Control panel for forecast settings and range selection
// Requirements: B.3

import React from 'react';
import type { FC } from 'react';
import type { ForecastRange } from '@/lib/forecast';

type ForecastControlsProps = {
  forecastRange: ForecastRange;
  onForecastRangeChange: (range: ForecastRange) => void;
  showConfidenceInterval: boolean;
  onShowConfidenceIntervalChange: (show: boolean) => void;
  showTrendLine: boolean;
  onShowTrendLineChange: (show: boolean) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
};

const forecastRangeOptions: Array<{ value: ForecastRange; label: string; description: string }> = [
  {
    value: 7,
    label: '7 Tage',
    description: 'Kurzfristige Prognose mit hoher Genauigkeit'
  },
  {
    value: 30,
    label: '30 Tage',
    description: 'Mittelfristige Prognose für Monatsplanung'
  },
  {
    value: 90,
    label: '90 Tage',
    description: 'Langfristige Prognose für Quartalsplanung'
  }
];

export const ForecastControls: FC<ForecastControlsProps> = ({
  forecastRange,
  onForecastRangeChange,
  showConfidenceInterval,
  onShowConfidenceIntervalChange,
  showTrendLine,
  onShowTrendLineChange,
  isLoading = false,
  onRefresh,
  className = ''
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className=\"flex flex-wrap items-center justify-between gap-4\">
        {/* Forecast Range Selection */}
        <div className=\"flex-1 min-w-[200px]\">
          <label className=\"block text-sm font-medium text-gray-700 mb-2\">
            Prognosezeitraum
          </label>
          <div className=\"grid grid-cols-3 gap-2\">
            {forecastRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onForecastRangeChange(option.value)}
                disabled={isLoading}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md border transition-colors
                  ${forecastRange === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display Options */}
        <div className=\"flex-1 min-w-[200px]\">
          <label className=\"block text-sm font-medium text-gray-700 mb-2\">
            Anzeigeoptionen
          </label>
          <div className=\"space-y-2\">
            <label className=\"flex items-center gap-2 cursor-pointer\">
              <input
                type=\"checkbox\"
                checked={showConfidenceInterval}
                onChange={(e) => onShowConfidenceIntervalChange(e.target.checked)}
                disabled={isLoading}
                className=\"w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500\"
              />
              <span className=\"text-sm text-gray-700\">Konfidenzintervall anzeigen</span>
            </label>
            
            <label className=\"flex items-center gap-2 cursor-pointer\">
              <input
                type=\"checkbox\"
                checked={showTrendLine}
                onChange={(e) => onShowTrendLineChange(e.target.checked)}
                disabled={isLoading}
                className=\"w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500\"
              />
              <span className=\"text-sm text-gray-700\">Trendlinie anzeigen</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className=\"flex items-end gap-2\">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`
                px-4 py-2 text-sm font-medium rounded-md border transition-colors
                ${isLoading
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                }
              `}
              title=\"Prognose aktualisieren\"
            >
              {isLoading ? (
                <div className=\"flex items-center gap-2\">
                  <div className=\"w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin\"></div>
                  <span>Lädt...</span>
                </div>
              ) : (
                <div className=\"flex items-center gap-2\">
                  <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" />
                  </svg>
                  <span>Aktualisieren</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Range Description */}
      <div className=\"mt-3 pt-3 border-t border-gray-200\">
        <div className=\"text-xs text-gray-600\">
          <span className=\"font-medium\">Hinweis:</span>
          {' '}
          {forecastRangeOptions.find(opt => opt.value === forecastRange)?.description}
          {' '}
          Die Genauigkeit nimmt mit zunehmendem Prognosezeitraum ab.
        </div>
      </div>
    </div>
  );
};

export default ForecastControls;