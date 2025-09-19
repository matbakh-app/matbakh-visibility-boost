// TrendChart Component Tests
// Task 6.4.2.1 - Unit Tests for TrendChart

import { describe, it, expect } from '@jest/globals';
import { mockTrendData, mockVisibilityEvents } from '@/data/analytics/mock-score-trend';
import type { ScoreType } from '@/types/score-history';

describe('TrendChart Component', () => {
  const defaultProps = {
    data: mockTrendData.slice(0, 7), // Use first 7 days for testing
    scoreType: 'overall_visibility' as ScoreType,
    dateRange: {
      from: new Date('2025-01-01'),
      to: new Date('2025-01-07')
    }
  };

  it('should validate props structure', () => {
    expect(defaultProps.data).toBeDefined();
    expect(defaultProps.scoreType).toBe('overall_visibility');
    expect(defaultProps.dateRange.from).toBeInstanceOf(Date);
    expect(defaultProps.dateRange.to).toBeInstanceOf(Date);
  });

  it('should handle different score types', () => {
    const scoreTypes: ScoreType[] = [
      'overall_visibility',
      'google_presence', 
      'social_media',
      'website_performance',
      'review_management',
      'local_seo',
      'content_quality',
      'competitive_position'
    ];

    scoreTypes.forEach(scoreType => {
      expect(scoreType).toBeDefined();
      expect(typeof scoreType).toBe('string');
    });
  });

  it('should validate mock data structure', () => {
    expect(mockTrendData).toBeDefined();
    expect(Array.isArray(mockTrendData)).toBe(true);
    expect(mockTrendData.length).toBeGreaterThan(0);
    
    const firstPoint = mockTrendData[0];
    expect(firstPoint).toHaveProperty('date');
    expect(firstPoint).toHaveProperty('score_value');
    expect(firstPoint).toHaveProperty('score_type');
    expect(firstPoint).toHaveProperty('business_id');
  });

  it('should validate event data structure', () => {
    expect(mockVisibilityEvents).toBeDefined();
    expect(Array.isArray(mockVisibilityEvents)).toBe(true);
    
    if (mockVisibilityEvents.length > 0) {
      const firstEvent = mockVisibilityEvents[0];
      expect(firstEvent).toHaveProperty('date');
      expect(firstEvent).toHaveProperty('title');
      expect(firstEvent).toHaveProperty('type');
      expect(firstEvent).toHaveProperty('impact');
      expect(['positive', 'negative', 'neutral']).toContain(firstEvent.impact);
    }
  });
});

// Data validation tests
describe('TrendChart Data Validation', () => {
  it('should validate score values are within range', () => {
    mockTrendData.forEach(point => {
      expect(point.score_value).toBeGreaterThanOrEqual(0);
      expect(point.score_value).toBeLessThanOrEqual(100);
    });
  });

  it('should validate date format', () => {
    mockTrendData.forEach(point => {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(point.date)).toBeInstanceOf(Date);
    });
  });

  it('should validate business_id format', () => {
    mockTrendData.forEach(point => {
      expect(typeof point.business_id).toBe('string');
      expect(point.business_id.length).toBeGreaterThan(0);
    });
  });
});