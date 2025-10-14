// Forecasting Engine Tests - Task 6.4.3.6
// Unit tests for the predictive forecasting system
// Requirements: B.3

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ForecastingEngine } from '../forecasting-engine';
import type { ScorePoint } from '@/types/score-history';

describe('ForecastingEngine', () => {
  let sampleData: ScorePoint[];

  beforeEach(() => {
    // Generate sample data with a clear upward trend
    sampleData = [];
    const startDate = new Date('2025-01-01');
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Linear trend: start at 50, increase by 0.5 per day
      const baseScore = 50 + (i * 0.5);
      // Add some random noise
      const noise = (Math.random() - 0.5) * 2;
      
      sampleData.push({
        id: `test-${i}`,
        business_id: 'test-business',
        score_type: 'overall_visibility',
        score_value: baseScore + noise,
        date: date.toISOString().split('T')[0],
        calculated_at: date.toISOString(),
        source: 'test',
        meta: {}
      });
    }
  });

  describe('generateForecast', () => {
    it('should generate forecast with valid data', () => {
      const forecast = ForecastingEngine.generateForecast(sampleData, 7);
      
      expect(forecast).toBeDefined();
      expect(forecast.forecast_points).toHaveLength(7);
      expect(forecast.trend_analysis).toBeDefined();
      expect(forecast.confidence_level).toBeGreaterThan(0);
      expect(forecast.confidence_level).toBeLessThanOrEqual(1);
      expect(forecast.forecast_range_days).toBe(7);
    });

    it('should throw error with insufficient data', () => {
      const insufficientData = sampleData.slice(0, 3);
      
      expect(() => {
        ForecastingEngine.generateForecast(insufficientData, 7);
      }).toThrow('Insufficient data points');
    });

    it('should generate different forecasts for different ranges', () => {
      const forecast7 = ForecastingEngine.generateForecast(sampleData, 7);
      const forecast30 = ForecastingEngine.generateForecast(sampleData, 30);
      
      expect(forecast7.forecast_points).toHaveLength(7);
      expect(forecast30.forecast_points).toHaveLength(30);
      expect(forecast7.forecast_range_days).toBe(7);
      expect(forecast30.forecast_range_days).toBe(30);
    });

    it('should detect upward trend correctly', () => {
      const forecast = ForecastingEngine.generateForecast(sampleData, 7);
      
      expect(forecast.trend_analysis.direction).toBe('rising');
      expect(forecast.trend_analysis.slope).toBeGreaterThan(0);
    });

    it('should detect downward trend correctly', () => {
      // Create downward trending data
      const downwardData = sampleData.map((point, index) => ({
        ...point,
        score_value: 80 - (index * 0.5) // Decreasing trend
      }));
      
      const forecast = ForecastingEngine.generateForecast(downwardData, 7);
      
      expect(forecast.trend_analysis.direction).toBe('falling');
      expect(forecast.trend_analysis.slope).toBeLessThan(0);
    });

    it('should detect stable trend correctly', () => {
      // Create stable data
      const stableData = sampleData.map(point => ({
        ...point,
        score_value: 60 + (Math.random() - 0.5) * 0.1 // Very small random variation
      }));
      
      const forecast = ForecastingEngine.generateForecast(stableData, 7);
      
      expect(forecast.trend_analysis.direction).toBe('stable');
      expect(Math.abs(forecast.trend_analysis.slope)).toBeLessThan(0.1);
    });

    it('should generate forecast points with confidence intervals', () => {
      const forecast = ForecastingEngine.generateForecast(sampleData, 7);
      
      forecast.forecast_points.forEach(point => {
        expect(point.predicted_score).toBeGreaterThanOrEqual(0);
        expect(point.predicted_score).toBeLessThanOrEqual(100);
        expect(point.confidence_lower).toBeLessThanOrEqual(point.predicted_score);
        expect(point.confidence_upper).toBeGreaterThanOrEqual(point.predicted_score);
        expect(point.is_forecast).toBe(true);
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should have increasing uncertainty over time', () => {
      const forecast = ForecastingEngine.generateForecast(sampleData, 30);
      
      const firstPoint = forecast.forecast_points[0];
      const lastPoint = forecast.forecast_points[forecast.forecast_points.length - 1];
      
      const firstInterval = firstPoint.confidence_upper - firstPoint.confidence_lower;
      const lastInterval = lastPoint.confidence_upper - lastPoint.confidence_lower;
      
      expect(lastInterval).toBeGreaterThan(firstInterval);
    });
  });

  describe('detectTrendChanges', () => {
    it('should detect trend changes in data', () => {
      // Create data with a trend change
      const changeData: ScorePoint[] = [];
      const startDate = new Date('2025-01-01');
      
      // First 20 days: upward trend
      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        changeData.push({
          id: `change-${i}`,
          business_id: 'test-business',
          score_type: 'overall_visibility',
          score_value: 50 + (i * 0.5),
          date: date.toISOString().split('T')[0],
          calculated_at: date.toISOString(),
          source: 'test',
          meta: {}
        });
      }
      
      // Next 20 days: downward trend
      for (let i = 20; i < 40; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        changeData.push({
          id: `change-${i}`,
          business_id: 'test-business',
          score_type: 'overall_visibility',
          score_value: 60 - ((i - 20) * 0.3),
          date: date.toISOString().split('T')[0],
          calculated_at: date.toISOString(),
          source: 'test',
          meta: {}
        });
      }
      
      const changes = ForecastingEngine.detectTrendChanges(changeData, 7);
      
      expect(changes.length).toBeGreaterThan(0);
      expect(changes.some(change => change.change_type === 'reversal')).toBe(true);
    });

    it('should return empty array for insufficient data', () => {
      const insufficientData = sampleData.slice(0, 10);
      const changes = ForecastingEngine.detectTrendChanges(insufficientData, 14);
      
      expect(changes).toEqual([]);
    });

    it('should detect acceleration and deceleration', () => {
      // Create data with acceleration
      const accelData: ScorePoint[] = [];
      const startDate = new Date('2025-01-01');
      
      for (let i = 0; i < 50; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Quadratic growth (acceleration)
        const score = 50 + (i * 0.1) + (i * i * 0.01);
        
        accelData.push({
          id: `accel-${i}`,
          business_id: 'test-business',
          score_type: 'overall_visibility',
          score_value: score,
          date: date.toISOString().split('T')[0],
          calculated_at: date.toISOString(),
          source: 'test',
          meta: {}
        });
      }
      
      const changes = ForecastingEngine.detectTrendChanges(accelData, 10);
      
      expect(changes.some(change => change.change_type === 'acceleration')).toBe(true);
    });
  });

  describe('getForecastSummary', () => {
    it('should generate comprehensive forecast summary', () => {
      const forecast = ForecastingEngine.generateForecast(sampleData, 30);
      const summary = ForecastingEngine.getForecastSummary(forecast);
      
      expect(summary.trend_description).toBeDefined();
      expect(summary.confidence_description).toBeDefined();
      expect(Array.isArray(summary.key_insights)).toBe(true);
      expect(Array.isArray(summary.recommended_actions)).toBe(true);
    });

    it('should provide appropriate trend descriptions', () => {
      const forecast = ForecastingEngine.generateForecast(sampleData, 30);
      const summary = ForecastingEngine.getForecastSummary(forecast);
      
      expect(summary.trend_description).toContain('trend');
      
      if (forecast.trend_analysis.direction === 'rising') {
        expect(summary.trend_description).toContain('Aufwärtstrend');
      } else if (forecast.trend_analysis.direction === 'falling') {
        expect(summary.trend_description).toContain('Abwärtstrend');
      } else {
        expect(summary.trend_description).toContain('Stabiler');
      }
    });

    it('should provide confidence descriptions', () => {
      const forecast = ForecastingEngine.generateForecast(sampleData, 30);
      const summary = ForecastingEngine.getForecastSummary(forecast);
      
      expect(summary.confidence_description).toMatch(/(Hohe|Mittlere|Niedrige).*genauigkeit/);
    });

    it('should generate insights based on forecast data', () => {
      const forecast = ForecastingEngine.generateForecast(sampleData, 30);
      const summary = ForecastingEngine.getForecastSummary(forecast);
      
      // Should have insights for significant changes
      const firstForecast = forecast.forecast_points[0];
      const lastForecast = forecast.forecast_points[forecast.forecast_points.length - 1];
      const totalChange = Math.abs(lastForecast.predicted_score - firstForecast.predicted_score);
      
      if (totalChange > 5) {
        expect(summary.key_insights.some(insight => insight.includes('Änderung'))).toBe(true);
      }
    });

    it('should generate appropriate recommendations', () => {
      // Create data with strong downward trend
      const downwardData = sampleData.map((point, index) => ({
        ...point,
        score_value: 80 - (index * 1.0) // Strong downward trend
      }));
      
      const forecast = ForecastingEngine.generateForecast(downwardData, 30);
      const summary = ForecastingEngine.getForecastSummary(forecast);
      
      if (forecast.trend_analysis.direction === 'falling' && forecast.trend_analysis.strength > 0.5) {
        expect(summary.recommended_actions.some(action => 
          action.includes('Maßnahmen') || action.includes('Trendumkehr')
        )).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle data with missing values gracefully', () => {
      const dataWithGaps = sampleData.filter((_, index) => index % 3 !== 0); // Remove every 3rd point
      
      expect(() => {
        ForecastingEngine.generateForecast(dataWithGaps, 7);
      }).not.toThrow();
    });

    it('should handle extreme values correctly', () => {
      const extremeData = sampleData.map((point, index) => ({
        ...point,
        score_value: index % 2 === 0 ? 0 : 100 // Alternating between 0 and 100
      }));
      
      const forecast = ForecastingEngine.generateForecast(extremeData, 7);
      
      expect(forecast.trend_analysis.volatility).toBeGreaterThan(10);
      forecast.forecast_points.forEach(point => {
        expect(point.predicted_score).toBeGreaterThanOrEqual(0);
        expect(point.predicted_score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle identical values', () => {
      const constantData = sampleData.map(point => ({
        ...point,
        score_value: 75 // All values the same
      }));
      
      const forecast = ForecastingEngine.generateForecast(constantData, 7);
      
      expect(forecast.trend_analysis.direction).toBe('stable');
      expect(forecast.trend_analysis.volatility).toBeLessThan(1);
    });

    it('should handle very large datasets efficiently', () => {
      // Generate 1000 data points
      const largeData: ScorePoint[] = [];
      const startDate = new Date('2023-01-01');
      
      for (let i = 0; i < 1000; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        largeData.push({
          id: `large-${i}`,
          business_id: 'test-business',
          score_type: 'overall_visibility',
          score_value: 50 + Math.sin(i / 10) * 10 + (Math.random() - 0.5) * 5,
          date: date.toISOString().split('T')[0],
          calculated_at: date.toISOString(),
          source: 'test',
          meta: {}
        });
      }
      
      const startTime = performance.now();
      const forecast = ForecastingEngine.generateForecast(largeData, 30);
      const endTime = performance.now();
      
      expect(forecast).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
    });
  });

  describe('Statistical Accuracy', () => {
    it('should have reasonable R-squared for linear data', () => {
      // Create perfectly linear data
      const linearData = sampleData.map((point, index) => ({
        ...point,
        score_value: 50 + (index * 0.5) // Perfect linear trend
      }));
      
      const forecast = ForecastingEngine.generateForecast(linearData, 7);
      
      expect(forecast.trend_analysis.r_squared).toBeGreaterThan(0.95);
    });

    it('should have lower R-squared for noisy data', () => {
      // Create very noisy data
      const noisyData = sampleData.map((point, index) => ({
        ...point,
        score_value: 50 + (index * 0.1) + (Math.random() - 0.5) * 20 // High noise
      }));
      
      const forecast = ForecastingEngine.generateForecast(noisyData, 7);
      
      expect(forecast.trend_analysis.r_squared).toBeLessThan(0.8);
    });

    it('should have confidence that correlates with data quality', () => {
      const cleanForecast = ForecastingEngine.generateForecast(sampleData, 7);
      
      const noisyData = sampleData.map(point => ({
        ...point,
        score_value: point.score_value + (Math.random() - 0.5) * 30
      }));
      const noisyForecast = ForecastingEngine.generateForecast(noisyData, 7);
      
      expect(cleanForecast.confidence_level).toBeGreaterThan(noisyForecast.confidence_level);
    });
  });
});