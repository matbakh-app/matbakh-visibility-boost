// useForecast Hook - Task 6.4.3.4
// React hook for managing forecast state and operations
// Requirements: B.3

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ScorePoint } from '@/types/score-history';
import { ForecastEngine, type ForecastResult, type ForecastRange } from '@/lib/forecast';

interface UseForecastOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  minDataPoints?: number;
}

interface UseForecastReturn {
  forecast: ForecastResult | null;
  isLoading: boolean;
  error: string | null;
  generateForecast: (data: ScorePoint[], range: ForecastRange) => Promise<void>;
  clearForecast: () => void;
  canGenerateForecast: boolean;
  forecastSummary: ReturnType<typeof ForecastingEngine.getForecastSummary> | null;
}

export const useForecast = (
  historicalData: ScorePoint[],
  options: UseForecastOptions = {}
): UseForecastReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
    minDataPoints = 5
  } = options;

  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have enough data to generate a forecast
  const canGenerateForecast = useMemo(() => {
    return historicalData.length >= minDataPoints;
  }, [historicalData.length, minDataPoints]);

  // Generate forecast
  const generateForecast = useCallback(async (
    data: ScorePoint[],
    range: ForecastRange
  ): Promise<void> => {
    if (!canGenerateForecast) {
      setError(`Nicht genügend Datenpunkte. Benötigt: ${minDataPoints}, vorhanden: ${data.length}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate async operation (in real app, this might be an API call)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = ForecastEngine.generateComprehensiveForecast(data, range);
      setForecast(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler bei der Prognose-Generierung';
      setError(errorMessage);
      setForecast(null);
    } finally {
      setIsLoading(false);
    }
  }, [canGenerateForecast, minDataPoints]);

  // Clear forecast
  const clearForecast = useCallback(() => {
    setForecast(null);
    setError(null);
  }, []);

  // Get forecast summary
  const forecastSummary = useMemo(() => {
    if (!forecast) return null;
    // Create a simple summary from the forecast data
    return {
      trend_description: `${forecast.trend_analysis.direction === 'up' ? 'Aufwärtstrend' : 
                          forecast.trend_analysis.direction === 'down' ? 'Abwärtstrend' : 'Stabiler Verlauf'}`,
      confidence_description: `${forecast.confidence_level > 0.8 ? 'Hohe' : 
                              forecast.confidence_level > 0.6 ? 'Mittlere' : 'Niedrige'} Vorhersagegenauigkeit`,
      key_insights: [`Trend-Stärke: ${(forecast.trend_analysis.strength * 100).toFixed(0)}%`],
      recommended_actions: forecast.trend_analysis.direction === 'down' ? ['Maßnahmen zur Verbesserung prüfen'] : []
    };
  }, [forecast]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !canGenerateForecast || isLoading) {
      return;
    }

    const interval = setInterval(() => {
      if (forecast) {
        // Re-generate forecast with the same range
        generateForecast(historicalData, forecast.forecast_range_days);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, canGenerateForecast, isLoading, forecast, generateForecast, historicalData, refreshInterval]);

  // Clear forecast when data changes significantly
  useEffect(() => {
    if (forecast && historicalData.length > 0) {
      // Check if the latest data point is newer than the forecast generation time
      const latestDataDate = new Date(Math.max(...historicalData.map(d => new Date(d.date).getTime())));
      const forecastGeneratedDate = new Date(forecast.generated_at);
      
      if (latestDataDate > forecastGeneratedDate) {
        // New data available, clear old forecast
        clearForecast();
      }
    }
  }, [historicalData, forecast, clearForecast]);

  return {
    forecast,
    isLoading,
    error,
    generateForecast,
    clearForecast,
    canGenerateForecast,
    forecastSummary
  };
};

// Hook for trend change detection
export const useTrendChangeDetection = (
  historicalData: ScorePoint[],
  windowSize: number = 14
) => {
  const [trendChanges, setTrendChanges] = useState<ReturnType<typeof ForecastingEngine.detectTrendChanges>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const detectChanges = useCallback(async () => {
    if (historicalData.length < windowSize * 2) {
      setTrendChanges([]);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Simple trend change detection (placeholder)
      const changes: any[] = [];
      setTrendChanges(changes);
    } catch (err) {
      console.error('Error detecting trend changes:', err);
      setTrendChanges([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [historicalData, windowSize]);

  // Auto-detect changes when data changes
  useEffect(() => {
    detectChanges();
  }, [detectChanges]);

  return {
    trendChanges,
    isAnalyzing,
    detectChanges
  };
};

export default useForecast;