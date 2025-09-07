// EventAnnotations Component Tests - Task 6.4.2.4.2.5
// Unit tests for event rendering and positioning

import { describe, it, expect } from 'vitest';
import type { VisibilityEvent, ScorePoint } from '@/types/score-history';
import { getScoreAtDate, filterEvents } from '../EventAnnotations';

describe('EventAnnotations Component', () => {
  const mockScoreData: ScorePoint[] = [
    {
      date: '2025-01-01',
      score_type: 'overall_visibility',
      score_value: 65.5,
      business_id: 'test-business'
    },
    {
      date: '2025-01-02',
      score_type: 'overall_visibility',
      score_value: 70.2,
      business_id: 'test-business'
    },
    {
      date: '2025-01-03',
      score_type: 'overall_visibility',
      score_value: 68.8,
      business_id: 'test-business'
    }
  ];

  const mockEvents: VisibilityEvent[] = [
    {
      id: 'event-1',
      date: '2025-01-01',
      title: 'New Year Campaign',
      type: 'social_media_campaign',
      description: 'Special promotion',
      impact: 'positive'
    },
    {
      id: 'event-2',
      date: '2025-01-02',
      title: 'Google Update',
      type: 'google_algorithm_update',
      description: 'Algorithm change',
      impact: 'negative'
    },
    {
      id: 'event-3',
      date: '2025-01-05',
      title: 'SEO Optimization',
      type: 'seo_optimization',
      impact: 'positive'
    }
  ];

  describe('getScoreAtDate', () => {
    it('should return exact score for matching date', () => {
      const score = getScoreAtDate(mockScoreData, '2025-01-01');
      expect(score).toBe(65.5);
    });

    it('should return closest score for non-matching date', () => {
      const score = getScoreAtDate(mockScoreData, '2025-01-04');
      expect(score).toBe(68.8); // Closest to 2025-01-03
    });

    it('should return default score for empty data', () => {
      const score = getScoreAtDate([], '2025-01-01');
      expect(score).toBe(50);
    });

    it('should handle single data point', () => {
      const singlePoint = [mockScoreData[0]];
      const score = getScoreAtDate(singlePoint, '2025-01-10');
      expect(score).toBe(65.5);
    });
  });

  describe('filterEvents', () => {
    it('should return all events when no filters applied', () => {
      const filtered = filterEvents(mockEvents);
      expect(filtered).toHaveLength(3);
      expect(filtered).toEqual(mockEvents);
    });

    it('should filter events by date range', () => {
      const dateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-02')
      };
      
      const filtered = filterEvents(mockEvents, dateRange);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('event-1');
      expect(filtered[1].id).toBe('event-2');
    });

    it('should filter events by visible types', () => {
      const visibleTypes = ['social_media_campaign', 'seo_optimization'];
      
      const filtered = filterEvents(mockEvents, undefined, visibleTypes);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].type).toBe('social_media_campaign');
      expect(filtered[1].type).toBe('seo_optimization');
    });

    it('should apply both date range and type filters', () => {
      const dateRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-02')
      };
      const visibleTypes = ['social_media_campaign'];
      
      const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('event-1');
    });

    it('should return empty array when no events match filters', () => {
      const dateRange = {
        from: new Date('2025-01-10'),
        to: new Date('2025-01-15')
      };
      
      const filtered = filterEvents(mockEvents, dateRange);
      expect(filtered).toHaveLength(0);
    });

    it('should handle empty visible types array', () => {
      const filtered = filterEvents(mockEvents, undefined, []);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Event Positioning Logic', () => {
    it('should calculate correct positions for events within data range', () => {
      const eventsInRange = filterEvents(mockEvents, {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-03')
      });
      
      expect(eventsInRange).toHaveLength(2);
      
      // Test score positioning
      const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);
      const event2Score = getScoreAtDate(mockScoreData, eventsInRange[1].date);
      
      expect(event1Score).toBe(65.5);
      expect(event2Score).toBe(70.2);
    });

    it('should handle events outside data range gracefully', () => {
      const eventOutsideRange = mockEvents[2]; // 2025-01-05
      const score = getScoreAtDate(mockScoreData, eventOutsideRange.date);
      
      // Should return closest available score (2025-01-03)
      expect(score).toBe(68.8);
    });
  });

  describe('Event Type Validation', () => {
    it('should validate all event types are supported', () => {
      const supportedTypes = [
        'google_algorithm_update',
        'social_media_campaign',
        'review_spike',
        'visibility_dip',
        'seo_optimization',
        'platform_feature',
        'seasonal_event',
        'manual_annotation'
      ];
      
      mockEvents.forEach(event => {
        expect(supportedTypes).toContain(event.type);
      });
    });

    it('should handle events with different impact types', () => {
      const impactTypes = ['positive', 'negative', 'neutral'];
      const eventsWithImpact = mockEvents.filter(e => e.impact);
      
      eventsWithImpact.forEach(event => {
        expect(impactTypes).toContain(event.impact!);
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large number of events efficiently', () => {
      const largeEventSet: VisibilityEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `event-${i}`,
        date: `2025-01-${String(i % 30 + 1).padStart(2, '0')}`,
        title: `Event ${i}`,
        type: 'manual_annotation',
        impact: 'neutral'
      }));
      
      const startTime = performance.now();
      const filtered = filterEvents(largeEventSet, {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-15')
      });
      const endTime = performance.now();
      
      expect(filtered.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
    });

    it('should handle large score dataset efficiently', () => {
      const largeScoreSet: ScorePoint[] = Array.from({ length: 365 }, (_, i) => ({
        date: new Date(2025, 0, i + 1).toISOString().split('T')[0],
        score_type: 'overall_visibility',
        score_value: Math.random() * 100,
        business_id: 'test'
      }));
      
      const startTime = performance.now();
      const score = getScoreAtDate(largeScoreSet, '2025-06-15');
      const endTime = performance.now();
      
      expect(typeof score).toBe('number');
      expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle events with missing optional fields', () => {
      const minimalEvent: VisibilityEvent = {
        id: 'minimal',
        date: '2025-01-01',
        title: 'Minimal Event',
        type: 'manual_annotation'
        // No description or impact
      };
      
      const filtered = filterEvents([minimalEvent]);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(minimalEvent);
    });

    it('should handle invalid date formats gracefully', () => {
      const invalidDateEvent: VisibilityEvent = {
        id: 'invalid',
        date: 'invalid-date',
        title: 'Invalid Date Event',
        type: 'manual_annotation'
      };
      
      // Should not throw error
      expect(() => filterEvents([invalidDateEvent])).not.toThrow();
    });

    it('should handle empty arrays', () => {
      expect(filterEvents([])).toEqual([]);
      expect(getScoreAtDate([], '2025-01-01')).toBe(50);
    });
  });
});