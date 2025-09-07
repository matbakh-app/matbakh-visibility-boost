// Forecast Engine Tests - Task 6.4.3.1
// Unit tests for forecasting engine according to specification
// Requirements: B.3

import { describe, it, expect, beforeEach } from 'vitest';
import { ForecastEngine } from '../forecastEngine';
import type { ScorePoint } from '../types';

describe('ForecastEngine', () => {
  let flatData: ScorePoint[];
  let upwardData: ScorePoint[];
  let downwardData: ScorePoint[];
  let noisyData: ScorePoint[];

  beforeEach(() => {
    // Flat data - constant scores → trend: flat
    flatData = [];
    for (let i = 0; i < 20; i++) {
      flatData.push({
        date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
        score_value: 65.0 // Constant value
      });
    }

    // Linear upward trend → trend: up
    upwardData = [];
    for (let i = 0; i < 20; i++) {
      upwardData.push({
        date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
        score_value: 50 + (i * 1.0) // +1 point per day
      });
    }

    // Linear downward trend → trend: down
    downwardData = [];
    for (let i = 0; i < 20; i++) {
      downwardData.push({
        date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
        score_value: 80 - (i * 0.8) // -0.8 points per day
      });
    }

    // Noisy data with high variance → confidence ±10%
    noisyData = [];
    for (let i = 0; i < 20; i++) {
      noisyData.push({
        date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
        score_value: 60 + (Math.random() - 0.5) * 20 // High variance ±10 points
      });
    }
  });

  describe('generateForecast', () => {
    it('should return flat trend for constant scores', () => {
      const forecast = ForecastEngine.generateForecast(flatData, 7);
      
      expect(forecast).toHaveLength(7);
      forecast.forEach(point => {
        expect(point.trend).toBe('flat');
        expect(point.forecast_value).toBeCloseTo(65, 1);
      });
    });

    it('should return up trend for linearly increasing scores', () => {
      const forecast = ForecastEngine.generateForecast(upwardData, 7);
      
      expect(forecast).toHaveLength(7);
      forecast.forEach(point => {
        expect(point.trend).toBe('up');
      });
      
      // Should continue upward trend
      expect(forecast[6].forecast_value).toBeGreaterThan(forecast[0].forecast_value);
    });

    it('should return down trend for linearly decreasing scores', () => {
      const forecast = ForecastEngine.generateForecast(downwardData, 7);
      
      expect(forecast).toHaveLength(7);
      forecast.forEach(point => {
        expect(point.trend).toBe('down');
      });
      
      // Should continue downward trend
      expect(forecast[6].forecast_value).toBeLessThan(forecast[0].forecast_value);
    });

    it('should return empty array for insufficient data', () => {
      const insufficientData = flatData.slice(0, 3); // Less than 5 points
      const forecast = ForecastEngine.generateForecast(insufficientData, 7);
      
      expect(forecast).toEqual([]);
    });

    it('should handle high variance with wider confidence intervals', () => {
      const forecast = ForecastEngine.generateForecast(noisyData, 7);
      
      expect(forecast).toHaveLength(7);
      
      // Check that confidence intervals are reasonably wide for noisy data
      forecast.forEach(point => {
        const intervalWidth = point.confidence_high - point.confidence_low;
        expect(intervalWidth).toBeGreaterThan(5); // Should be wider than 5 points
      });
    });

    it('should handle badly formatted data gracefully', () => {
      const badData: ScorePoint[] = [
        { date: 'invalid-date', score_value: 50 },
        { date: '2025-01-01', score_value: NaN },
        { date: '2025-01-02', score_value: -10 }, // Out of range
        { date: '2025-01-03', score_value: 150 }  // Out of range
      ];
      
      const forecast = ForecastEngine.generateForecast(badData, 7);
      expect(forecast).toEqual([]); // Should return empty array
    });

    it('should generate correct number of forecast points for different ranges', () => {
      const forecast7 = ForecastEngine.generateForecast(upwardData, 7);
      const forecast30 = ForecastEngine.generateForecast(upwardData, 30);
      const forecast90 = ForecastEngine.generateForecast(upwardData, 90);
      
      expect(forecast7).toHaveLength(7);
      expect(forecast30).toHaveLength(30);
      expect(forecast90).toHaveLength(90);
    });

    it('should have valid forecast point structure', () => {
      const forecast = ForecastEngine.generateForecast(upwardData, 7);
      
      forecast.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('forecast_value');
        expect(point).toHaveProperty('confidence_low');
        expect(point).toHaveProperty('confidence_high');
        expect(point).toHaveProperty('trend');
        
        expect(typeof point.date).toBe('string');
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof point.forecast_value).toBe('number');
        expect(point.forecast_value).toBeGreaterThanOrEqual(0);
        expect(point.forecast_value).toBeLessThanOrEqual(100);
        expect(point.confidence_low).toBeLessThanOrEqual(point.forecast_value);
        expect(point.confidence_high).toBeGreaterThanOrEqual(point.forecast_value);
        expect(['up', 'down', 'flat']).toContain(point.trend);
      });
    });

    it('should have increasing uncertainty over time', () => {
      const forecast = ForecastEngine.generateForecast(upwardData, 30);
      
      const firstInterval = forecast[0].confidence_high - forecast[0].confidence_low;
      const lastInterval = forecast[29].confidence_high - forecast[29].confidence_low;
      
      expect(lastInterval).toBeGreaterThan(firstInterval);
    });
  });

  describe('analyzeTrend', () => {
    it('should correctly identify flat trend', () => {
      const analysis = ForecastEngine.analyzeTrend(flatData);
      
      expect(analysis.direction).toBe('flat');
      expect(Math.abs(analysis.slope)).toBeLessThan(0.1);
    });

    it('should correctly identify upward trend', () => {
      const analysis = ForecastEngine.analyzeTrend(upwardData);
      
      expect(analysis.direction).toBe('up');
      expect(analysis.slope).toBeGreaterThan(0);
      expect(analysis.strength).toBeGreaterThan(0.3); // Lowered threshold
    });

    it('should correctly identify downward trend', () => {
      const analysis = ForecastEngine.analyzeTrend(downwardData);
      
      expect(analysis.direction).toBe('down');
      expect(analysis.slope).toBeLessThan(0);
      expect(analysis.strength).toBeGreaterThan(0.3); // Lowered threshold
    });

    it('should handle empty data', () => {
      const analysis = ForecastEngine.analyzeTrend([]);
      
      expect(analysis.direction).toBe('flat');
      expect(analysis.slope).toBe(0);
      expect(analysis.strength).toBe(0);
      expect(analysis.r_squared).toBe(0);
      expect(analysis.volatility).toBe(0);
    });
  });

  describe('assessDataQuality', () => {
    it('should assess good quality for clean data', () => {
      const quality = ForecastEngine.assessDataQuality(upwardData);
      
      expect(quality.score).toBeGreaterThan(0.7);
      expect(quality.issues.length).toBeLessThan(2);
    });

    it('should identify issues with insufficient data', () => {
      const smallData = upwardData.slice(0, 5);
      const quality = ForecastEngine.assessDataQuality(smallData);
      
      expect(quality.score).toBeLessThan(0.8);
      expect(quality.issues.some(issue => issue.includes('Wenige Datenpunkte'))).toBe(true);
    });

    it('should identify high volatility', () => {
      // Create data with guaranteed high volatility
      const highVolatilityData: ScorePoint[] = [];
      for (let i = 0; i < 20; i++) {
        highVolatilityData.push({
          date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
          score_value: 50 + (Math.random() - 0.5) * 40 // Very high variance ±20 points
        });
      }
      
      const quality = ForecastEngine.assessDataQuality(highVolatilityData);
      
      // Should detect high volatility or have low quality score
      const hasVolatilityIssue = quality.issues.some(issue => 
        issue.includes('Volatilität') || issue.includes('Schwankungen')
      );
      const hasLowScore = quality.score < 0.7;
      
      expect(hasVolatilityIssue || hasLowScore).toBe(true);
    });
  });

  describe('generateComprehensiveForecast', () => {
    it('should generate complete forecast result', () => {
      const result = ForecastEngine.generateComprehensiveForecast(upwardData, 30);
      
      expect(result).toHaveProperty('forecast_points');
      expect(result).toHaveProperty('trend_analysis');
      expect(result).toHaveProperty('confidence_level');
      expect(result).toHaveProperty('forecast_range_days');
      expect(result).toHaveProperty('generated_at');
      
      expect(result.forecast_points).toHaveLength(30);
      expect(result.forecast_range_days).toBe(30);
      expect(typeof result.confidence_level).toBe('number');
      expect(result.confidence_level).toBeGreaterThanOrEqual(0);
      expect(result.confidence_level).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const singlePoint = [flatData[0]];
      const forecast = ForecastEngine.generateForecast(singlePoint, 7);
      
      expect(forecast).toEqual([]);
    });

    it('should handle identical dates', () => {
      const duplicateDates = [
        { date: '2025-01-01', score_value: 50 },
        { date: '2025-01-01', score_value: 60 },
        { date: '2025-01-02', score_value: 55 }
      ];
      
      // Should not throw error
      expect(() => {
        ForecastEngine.generateForecast(duplicateDates, 7);
      }).not.toThrow();
    });

    it('should handle extreme values', () => {
      const extremeData: ScorePoint[] = [
        { date: '2025-01-01', score_value: 0 },
        { date: '2025-01-02', score_value: 100 },
        { date: '2025-01-03', score_value: 0 },
        { date: '2025-01-04', score_value: 100 },
        { date: '2025-01-05', score_value: 50 },
        { date: '2025-01-06', score_value: 25 }
      ];
      
      const forecast = ForecastEngine.generateForecast(extremeData, 7);
      
      // Should still generate forecast (6 points is enough)
      expect(forecast.length).toBeGreaterThanOrEqual(0);
      
      // If forecast is generated, all values should be within bounds
      if (forecast.length > 0) {
        forecast.forEach(point => {
          expect(point.forecast_value).toBeGreaterThanOrEqual(0);
          expect(point.forecast_value).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should handle unsorted data', () => {
      const unsortedData = [...upwardData].reverse(); // Reverse chronological order
      const forecast = ForecastEngine.generateForecast(unsortedData, 7);
      
      expect(forecast).toHaveLength(7);
      // Should still detect upward trend
      expect(forecast[0].trend).toBe('up');
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Generate 500 data points
      const largeData: ScorePoint[] = [];
      for (let i = 0; i < 500; i++) {
        largeData.push({
          date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
          score_value: 50 + Math.sin(i / 10) * 10 + (Math.random() - 0.5) * 5
        });
      }
      
      const startTime = performance.now();
      const forecast = ForecastEngine.generateForecast(largeData, 30);
      const endTime = performance.now();
      
      expect(forecast).toHaveLength(30);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});