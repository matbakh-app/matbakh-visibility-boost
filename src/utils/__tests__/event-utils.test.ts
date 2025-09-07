// Event Utils Tests - Task 6.4.2.4.1
// Unit tests for event utility functions

import { describe, it, expect } from 'vitest';
import type { VisibilityEvent } from '@/types/score-history';
import {
  filterEventsByDateRange,
  filterEventsByType,
  filterEventsByImpact,
  sortEventsByDate,
  groupEventsByType,
  getEventsNearDate,
  formatEventForTooltip,
  getEventStatistics,
  isEventOnDate,
  getLastEventBeforeDate,
  validateEvent
} from '../event-utils';

describe('Event Utils', () => {
  const mockEvents: VisibilityEvent[] = [
    {
      id: 'event-1',
      date: '2025-01-01',
      title: 'New Year Campaign',
      type: 'social_media_campaign',
      description: 'Special promotion for new year',
      impact: 'positive'
    },
    {
      id: 'event-2',
      date: '2025-01-15',
      title: 'Google Update',
      type: 'google_algorithm_update',
      description: 'Algorithm change affecting rankings',
      impact: 'negative'
    },
    {
      id: 'event-3',
      date: '2025-02-01',
      title: 'Review Boost',
      type: 'review_spike',
      description: 'Increased reviews after event',
      impact: 'positive'
    },
    {
      id: 'event-4',
      date: '2025-02-15',
      title: 'SEO Optimization',
      type: 'seo_optimization',
      impact: 'neutral'
    }
  ];

  describe('filterEventsByDateRange', () => {
    it('should filter events within date range', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      const filtered = filterEventsByDateRange(mockEvents, startDate, endDate);
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('event-1');
      expect(filtered[1].id).toBe('event-2');
    });

    it('should return empty array when no events in range', () => {
      const startDate = new Date('2025-03-01');
      const endDate = new Date('2025-03-31');
      
      const filtered = filterEventsByDateRange(mockEvents, startDate, endDate);
      
      expect(filtered).toHaveLength(0);
    });
  });

  describe('filterEventsByType', () => {
    it('should filter events by single type', () => {
      const filtered = filterEventsByType(mockEvents, ['social_media_campaign']);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('social_media_campaign');
    });

    it('should filter events by multiple types', () => {
      const filtered = filterEventsByType(mockEvents, [
        'social_media_campaign',
        'review_spike'
      ]);
      
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterEventsByImpact', () => {
    it('should filter events by positive impact', () => {
      const filtered = filterEventsByImpact(mockEvents, ['positive']);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(e => e.impact === 'positive')).toBe(true);
    });

    it('should filter events by multiple impacts', () => {
      const filtered = filterEventsByImpact(mockEvents, ['positive', 'negative']);
      
      expect(filtered).toHaveLength(3);
    });
  });

  describe('sortEventsByDate', () => {
    it('should sort events by date descending (default)', () => {
      const sorted = sortEventsByDate(mockEvents);
      
      expect(sorted[0].date).toBe('2025-02-15');
      expect(sorted[3].date).toBe('2025-01-01');
    });

    it('should sort events by date ascending', () => {
      const sorted = sortEventsByDate(mockEvents, 'asc');
      
      expect(sorted[0].date).toBe('2025-01-01');
      expect(sorted[3].date).toBe('2025-02-15');
    });
  });

  describe('groupEventsByType', () => {
    it('should group events by type', () => {
      const grouped = groupEventsByType(mockEvents);
      
      expect(grouped.social_media_campaign).toHaveLength(1);
      expect(grouped.google_algorithm_update).toHaveLength(1);
      expect(grouped.review_spike).toHaveLength(1);
      expect(grouped.seo_optimization).toHaveLength(1);
    });
  });

  describe('getEventsNearDate', () => {
    it('should get events within 7 days of target date', () => {
      const targetDate = new Date('2025-01-10');
      const nearEvents = getEventsNearDate(mockEvents, targetDate, 7);
      
      // event-1 (2025-01-01) is 9 days before, event-2 (2025-01-15) is 5 days after
      // Only event-2 should be within 7 days
      expect(nearEvents).toHaveLength(1);
      expect(nearEvents[0].id).toBe('event-2');
    });

    it('should get events within custom day range', () => {
      const targetDate = new Date('2025-01-01');
      const nearEvents = getEventsNearDate(mockEvents, targetDate, 20);
      
      expect(nearEvents).toHaveLength(2);
    });
  });

  describe('formatEventForTooltip', () => {
    it('should format event with all details', () => {
      const formatted = formatEventForTooltip(mockEvents[0]);
      
      expect(formatted).toContain('New Year Campaign');
      expect(formatted).toContain('Special promotion for new year');
    });

    it('should format event without description', () => {
      const formatted = formatEventForTooltip(mockEvents[3]);
      
      expect(formatted).toContain('SEO Optimization');
      expect(formatted).not.toContain('\n');
    });
  });

  describe('getEventStatistics', () => {
    it('should calculate event statistics', () => {
      const stats = getEventStatistics(mockEvents);
      
      expect(stats.total).toBe(4);
      expect(stats.byImpact.positive).toBe(2);
      expect(stats.byImpact.negative).toBe(1);
      expect(stats.byImpact.neutral).toBe(1);
      expect(stats.byType).toHaveLength(4);
    });
  });

  describe('isEventOnDate', () => {
    it('should return true for matching date', () => {
      const result = isEventOnDate(mockEvents[0], new Date('2025-01-01'));
      expect(result).toBe(true);
    });

    it('should return false for non-matching date', () => {
      const result = isEventOnDate(mockEvents[0], new Date('2025-01-02'));
      expect(result).toBe(false);
    });
  });

  describe('getLastEventBeforeDate', () => {
    it('should get the most recent event before date', () => {
      const lastEvent = getLastEventBeforeDate(mockEvents, new Date('2025-01-20'));
      
      expect(lastEvent?.id).toBe('event-2');
    });

    it('should return null when no events before date', () => {
      const lastEvent = getLastEventBeforeDate(mockEvents, new Date('2024-12-31'));
      
      expect(lastEvent).toBeNull();
    });
  });

  describe('validateEvent', () => {
    it('should return no errors for valid event', () => {
      const errors = validateEvent(mockEvents[0]);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidEvent = {
        title: 'Test Event'
        // Missing id, date, type
      };
      
      const errors = validateEvent(invalidEvent);
      
      expect(errors).toContain('Event ID is required');
      expect(errors).toContain('Event date is required');
      expect(errors).toContain('Event type is required');
    });

    it('should return error for invalid date', () => {
      const invalidEvent = {
        id: 'test',
        date: 'invalid-date',
        title: 'Test',
        type: 'manual_annotation' as const
      };
      
      const errors = validateEvent(invalidEvent);
      
      expect(errors).toContain('Event date must be a valid date');
    });
  });
});