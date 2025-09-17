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

interface ForecastSummary {
  trend_description: string;
  confidence_description: string;
  key_insights: string[];
  recommended_actions: string[];
}

interface TrendChange {
  date: string;
  change_type: 'reversal' | 'acceleration' | 'deceleration';
  magnitude: number;
  confidence: number;
}

interface UseForecastReturn {
  forecast: ForecastResult | null;
  isLoading: boolean;
  error: string | null;
  generateForecast: (data: ScorePoint[], range: ForecastRange) => Promise<void>;
  clearForecast: () => void;
  canGenerateForecast: boolean;
  forecastSummary: ForecastSummary | null;
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
  const forecastSummary = useMemo((): ForecastSummary | null => {
    if (!forecast) return null;
    
    const { trend_analysis } = forecast;
    const trendDirection = trend_analysis.direction;
    
    // Generate trend description
    let trendDesc = 'Stabiler Verlauf';
    if (trendDirection === 'rising') trendDesc = 'Aufwärtstrend';
    if (trendDirection === 'falling') trendDesc = 'Abwärtstrend';
    
    // Generate confidence description
    const confidenceDesc = forecast.confidence_level > 0.8 ? 'Hohe Vorhersagegenauigkeit' : 
                          forecast.confidence_level > 0.6 ? 'Mittlere Vorhersagegenauigkeit' : 
                          'Niedrige Vorhersagegenauigkeit';
    
    // Generate key insights
    const insights: string[] = [
      `Trend-Stärke: ${(trend_analysis.strength * 100).toFixed(0)}%`,
      `R² (Bestimmtheitsmaß): ${trend_analysis.r_squared.toFixed(3)}`,
      `Volatilität: ±${trend_analysis.volatility.toFixed(1)} Punkte`
    ];
    
    // Generate recommended actions
    const actions: string[] = [];
    if (trendDirection === 'falling') {
      actions.push('Maßnahmen zur Verbesserung der Sichtbarkeit prüfen');
      actions.push('Aktuelle SEO-Strategie überdenken');
    } else if (trendDirection === 'rising') {
      actions.push('Erfolgreiche Maßnahmen weiter ausbauen');
      actions.push('Momentum durch zusätzliche Aktivitäten verstärken');
    } else {
      actions.push('Neue Wachstumsimpulse setzen');
      actions.push('Bestehende Strategie optimieren');
    }
    
    return {
      trend_description: trendDesc,
      confidence_description: confidenceDesc,
      key_insights: insights,
      recommended_actions: actions
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
  const [trendChanges, setTrendChanges] = useState<TrendChange[]>([]);
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
      
      // Simple trend change detection algorithm
      const changes: TrendChange[] = [];
      const sortedData = [...historicalData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Analyze windows of data for trend changes
      for (let i = windowSize; i < sortedData.length - windowSize; i++) {
        const beforeWindow = sortedData.slice(i - windowSize, i);
        const afterWindow = sortedData.slice(i, i + windowSize);
        
        // Calculate trends for both windows
        const beforeTrend = ForecastEngine.analyzeTrend(beforeWindow);
        const afterTrend = ForecastEngine.analyzeTrend(afterWindow);
        
        // Detect significant changes
        const slopeDiff = Math.abs(afterTrend.slope - beforeTrend.slope);
        const directionChanged = beforeTrend.direction !== afterTrend.direction;
        
        if (slopeDiff > 0.1 || directionChanged) {
          let changeType: TrendChange['change_type'] = 'acceleration';
          
          if (directionChanged) {
            changeType = 'reversal';
          } else if (Math.abs(afterTrend.slope) < Math.abs(beforeTrend.slope)) {
            changeType = 'deceleration';
          }
          
          changes.push({
            date: sortedData[i].date,
            change_type: changeType,
            magnitude: slopeDiff,
            confidence: Math.min(beforeTrend.r_squared, afterTrend.r_squared)
          });
        }
      }
      
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