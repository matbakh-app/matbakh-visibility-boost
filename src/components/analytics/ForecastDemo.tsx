// ForecastDemo Component - Task 6.4.3.5
// Demo component showcasing the forecasting system with sample data
// Requirements: B.3

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { ScorePoint } from '@/types/score-history';
import type { ForecastRange } from '@/lib/forecast';
import { ForecastChart } from './ForecastChart';
import { ForecastControls } from './ForecastControls';
import { useForecast, useTrendChangeDetection } from '@/hooks/useForecast';

// Generate sample historical data
const generateSampleData = (): ScorePoint[] => {
  const data: ScorePoint[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 60); // 60 days ago

  let baseScore = 65;
  const trend = 0.1; // Slight upward trend
  const volatility = 5; // Random fluctuation

  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Add trend and random noise
    baseScore += trend + (Math.random() - 0.5) * volatility;
    
    // Add some seasonal patterns
    const dayOfWeek = date.getDay();
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 2 : 0;
    
    // Add some events (spikes and dips)
    let eventBoost = 0;
    if (i === 20) eventBoost = 8; // Marketing campaign
    if (i === 35) eventBoost = -5; // Negative review spike
    if (i === 50) eventBoost = 6; // SEO optimization

    const finalScore = Math.max(0, Math.min(100, baseScore + weekendBoost + eventBoost));

    data.push({
      id: `sample-${i}`,
      business_id: 'demo-business',
      score_type: 'overall_visibility',
      score_value: Math.round(finalScore * 10) / 10,
      date: date.toISOString().split('T')[0],
      calculated_at: date.toISOString(),
      source: 'demo',
      meta: {
        demo: true,
        day_of_week: dayOfWeek
      }
    });
  }

  return data;
};

export const ForecastDemo: FC = () => {
  const [sampleData] = useState<ScorePoint[]>(generateSampleData);
  const [forecastRange, setForecastRange] = useState<ForecastRange>(30);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(true);

  const {
    forecast,
    isLoading,
    error,
    generateForecast,
    clearForecast,
    canGenerateForecast,
    forecastSummary
  } = useForecast(sampleData, {
    autoRefresh: false,
    minDataPoints: 5
  });

  const {
    trendChanges,
    isAnalyzing
  } = useTrendChangeDetection(sampleData, 14);

  // Generate initial forecast
  useEffect(() => {
    if (canGenerateForecast && !forecast) {
      generateForecast(sampleData, forecastRange);
    }
  }, [canGenerateForecast, forecast, generateForecast, sampleData, forecastRange]);

  // Handle forecast range change
  const handleForecastRangeChange = (range: ForecastRange) => {
    setForecastRange(range);
    if (canGenerateForecast) {
      generateForecast(sampleData, range);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (canGenerateForecast) {
      generateForecast(sampleData, forecastRange);
    }
  };

  return (
    <div className=\"space-y-6\">
      {/* Header */}
      <div className=\"bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200\">
        <h2 className=\"text-2xl font-bold text-gray-800 mb-2\">
          📈 Predictive Forecasting Demo
        </h2>
        <p className=\"text-gray-600\">
          Demonstration der Vorhersage-Engine mit 60 Tagen historischen Daten und verschiedenen Prognosezeiträumen.
          Die Engine verwendet lineare Regression mit Konfidenzintervallen und Trend-Analyse.
        </p>
      </div>

      {/* Controls */}
      <ForecastControls
        forecastRange={forecastRange}
        onForecastRangeChange={handleForecastRangeChange}
        showConfidenceInterval={showConfidenceInterval}
        onShowConfidenceIntervalChange={setShowConfidenceInterval}
        showTrendLine={showTrendLine}
        onShowTrendLineChange={setShowTrendLine}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Error Display */}
      {error && (
        <div className=\"bg-red-50 border border-red-200 rounded-lg p-4\">
          <div className=\"flex items-center gap-2 text-red-800\">
            <svg className=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
              <path fillRule=\"evenodd\" d=\"M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z\" clipRule=\"evenodd\" />
            </svg>
            <span className=\"font-medium\">Fehler bei der Prognose-Generierung</span>
          </div>
          <p className=\"text-red-700 mt-1\">{error}</p>
        </div>
      )}

      {/* Forecast Chart */}
      {forecast && (
        <ForecastChart
          historicalData={sampleData}
          forecast={forecast}
          showConfidenceInterval={showConfidenceInterval}
          showTrendLine={showTrendLine}
          height={500}
        />
      )}

      {/* Forecast Summary */}
      {forecastSummary && (
        <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
          {/* Key Insights */}
          <div className=\"bg-white border border-gray-200 rounded-lg p-6\">
            <h3 className=\"text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2\">
              💡 Wichtige Erkenntnisse
            </h3>
            <div className=\"space-y-3\">
              <div>
                <div className=\"text-sm font-medium text-gray-700\">Trend</div>
                <div className=\"text-gray-600\">{forecastSummary.trend_description}</div>
              </div>
              <div>
                <div className=\"text-sm font-medium text-gray-700\">Konfidenz</div>
                <div className=\"text-gray-600\">{forecastSummary.confidence_description}</div>
              </div>
              {forecastSummary.key_insights.length > 0 && (
                <div>
                  <div className=\"text-sm font-medium text-gray-700 mb-2\">Insights</div>
                  <ul className=\"space-y-1\">
                    {forecastSummary.key_insights.map((insight, index) => (
                      <li key={index} className=\"text-sm text-gray-600 flex items-start gap-2\">
                        <span className=\"text-blue-500 mt-1\">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className=\"bg-white border border-gray-200 rounded-lg p-6\">
            <h3 className=\"text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2\">
              🎯 Empfohlene Maßnahmen
            </h3>
            {forecastSummary.recommended_actions.length > 0 ? (
              <ul className=\"space-y-2\">
                {forecastSummary.recommended_actions.map((action, index) => (
                  <li key={index} className=\"text-sm text-gray-600 flex items-start gap-2\">
                    <span className=\"text-green-500 mt-1\">✓</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className=\"text-gray-600 text-sm\">
                Keine spezifischen Maßnahmen erforderlich. Der aktuelle Trend ist stabil.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Trend Changes */}
      {trendChanges.length > 0 && (
        <div className=\"bg-white border border-gray-200 rounded-lg p-6\">
          <h3 className=\"text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2\">
            📊 Erkannte Trendänderungen
            {isAnalyzing && (
              <div className=\"w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin\"></div>
            )}
          </h3>
          <div className=\"space-y-3\">
            {trendChanges.slice(-5).map((change, index) => (
              <div key={index} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-lg\">
                <div className=\"flex items-center gap-3\">
                  <div className={`w-3 h-3 rounded-full ${
                    change.change_type === 'reversal' ? 'bg-red-500' :
                    change.change_type === 'acceleration' ? 'bg-green-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className=\"text-sm font-medium text-gray-800\">
                      {change.change_type === 'reversal' && 'Trendumkehr'}
                      {change.change_type === 'acceleration' && 'Beschleunigung'}
                      {change.change_type === 'deceleration' && 'Verlangsamung'}
                    </div>
                    <div className=\"text-xs text-gray-600\">
                      {new Date(change.date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                </div>
                <div className=\"text-right\">
                  <div className=\"text-sm text-gray-700\">
                    Stärke: {change.magnitude.toFixed(2)}
                  </div>
                  <div className=\"text-xs text-gray-500\">
                    Konfidenz: {(change.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className=\"bg-gray-50 border border-gray-200 rounded-lg p-6\">
        <h3 className=\"text-lg font-semibold text-gray-800 mb-4\">🔧 Technische Details</h3>
        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm\">
          <div>
            <div className=\"font-medium text-gray-700\">Datenpunkte</div>
            <div className=\"text-gray-600\">{sampleData.length}</div>
          </div>
          <div>
            <div className=\"font-medium text-gray-700\">Zeitraum</div>
            <div className=\"text-gray-600\">60 Tage historisch</div>
          </div>
          <div>
            <div className=\"font-medium text-gray-700\">Algorithmus</div>
            <div className=\"text-gray-600\">Lineare Regression</div>
          </div>
          <div>
            <div className=\"font-medium text-gray-700\">Konfidenzintervall</div>
            <div className=\"text-gray-600\">95% (±1.96σ)</div>
          </div>
        </div>
        
        {forecast && (
          <div className=\"mt-4 pt-4 border-t border-gray-300\">
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 text-sm\">
              <div>
                <div className=\"font-medium text-gray-700\">R² (Bestimmtheitsmaß)</div>
                <div className=\"text-gray-600\">{forecast.trend_analysis.r_squared.toFixed(3)}</div>
              </div>
              <div>
                <div className=\"font-medium text-gray-700\">Steigung (Punkte/Tag)</div>
                <div className=\"text-gray-600\">{forecast.trend_analysis.slope.toFixed(3)}</div>
              </div>
              <div>
                <div className=\"font-medium text-gray-700\">Volatilität (σ)</div>
                <div className=\"text-gray-600\">{forecast.trend_analysis.volatility.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastDemo;