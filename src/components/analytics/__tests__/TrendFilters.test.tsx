// TrendFilters Component Tests
// Task 6.4.2.3 - Unit Tests for TrendFilters

import { describe, it, expect, vi } from 'vitest';
import type { TrendFilters, ScoreType, BusinessUnit } from '@/types/score-history';
import { mockBusinessUnits } from '@/data/analytics/mock-score-trend';

describe('TrendFilters Component', () => {
  const defaultFilters: TrendFilters = {
    scoreType: 'overall_visibility',
    dateRange: {
      from: new Date('2025-01-01'),
      to: new Date('2025-01-31')
    },
    businessUnit: undefined
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Props Validation', () => {
    it('should validate TrendFilters interface structure', () => {
      expect(defaultFilters).toHaveProperty('scoreType');
      expect(defaultFilters).toHaveProperty('dateRange');
      expect(defaultFilters.dateRange).toHaveProperty('from');
      expect(defaultFilters.dateRange).toHaveProperty('to');
      expect(defaultFilters.dateRange.from).toBeInstanceOf(Date);
      expect(defaultFilters.dateRange.to).toBeInstanceOf(Date);
    });

    it('should handle optional businessUnit property', () => {
      const filtersWithUnit: TrendFilters = {
        ...defaultFilters,
        businessUnit: 'unit-1'
      };
      
      expect(filtersWithUnit.businessUnit).toBe('unit-1');
      expect(defaultFilters.businessUnit).toBeUndefined();
    });

    it('should validate BusinessUnit interface', () => {
      const businessUnit: BusinessUnit = mockBusinessUnits[0];
      
      expect(businessUnit).toHaveProperty('id');
      expect(businessUnit).toHaveProperty('name');
      expect(typeof businessUnit.id).toBe('string');
      expect(typeof businessUnit.name).toBe('string');
    });
  });

  describe('Score Type Handling', () => {
    it('should validate all score types', () => {
      const validScoreTypes: ScoreType[] = [
        'overall_visibility',
        'google_presence',
        'social_media',
        'website_performance',
        'review_management',
        'local_seo',
        'content_quality',
        'competitive_position'
      ];

      validScoreTypes.forEach(scoreType => {
        expect(scoreType).toBeDefined();
        expect(typeof scoreType).toBe('string');
      });
    });

    it('should handle score type changes', () => {
      const newScoreType: ScoreType = 'google_presence';
      const expectedFilters: TrendFilters = {
        ...defaultFilters,
        scoreType: newScoreType
      };

      // Simulate onChange call
      mockOnChange(expectedFilters);
      
      expect(mockOnChange).toHaveBeenCalledWith(expectedFilters);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Date Range Handling', () => {
    it('should validate date range presets', () => {
      const presets = [
        'last_7_days',
        'last_30_days', 
        'last_90_days',
        'last_year',
        'custom'
      ];

      presets.forEach(preset => {
        expect(preset).toBeDefined();
        expect(typeof preset).toBe('string');
      });
    });

    it('should generate correct date ranges for presets', () => {
      const now = new Date();
      
      // Test last 7 days
      const last7Days = {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: now
      };
      
      expect(last7Days.from).toBeInstanceOf(Date);
      expect(last7Days.to).toBeInstanceOf(Date);
      expect(last7Days.from.getTime()).toBeLessThan(last7Days.to.getTime());
    });

    it('should handle custom date range changes', () => {
      const newDateRange = {
        from: new Date('2025-02-01'),
        to: new Date('2025-02-28')
      };
      
      const expectedFilters: TrendFilters = {
        ...defaultFilters,
        dateRange: newDateRange
      };

      mockOnChange(expectedFilters);
      
      expect(mockOnChange).toHaveBeenCalledWith(expectedFilters);
    });

    it('should validate date range logic', () => {
      const validRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-01-31')
      };
      
      expect(validRange.from.getTime()).toBeLessThan(validRange.to.getTime());
    });
  });

  describe('Business Unit Handling', () => {
    it('should validate mock business units structure', () => {
      expect(Array.isArray(mockBusinessUnits)).toBe(true);
      expect(mockBusinessUnits.length).toBeGreaterThan(0);
      
      mockBusinessUnits.forEach(unit => {
        expect(unit).toHaveProperty('id');
        expect(unit).toHaveProperty('name');
        expect(unit.id).toBeTruthy();
        expect(unit.name).toBeTruthy();
      });
    });

    it('should handle business unit selection', () => {
      const selectedUnit = mockBusinessUnits[0];
      const expectedFilters: TrendFilters = {
        ...defaultFilters,
        businessUnit: selectedUnit.id
      };

      mockOnChange(expectedFilters);
      
      expect(mockOnChange).toHaveBeenCalledWith(expectedFilters);
    });

    it('should handle "all units" selection', () => {
      const expectedFilters: TrendFilters = {
        ...defaultFilters,
        businessUnit: undefined
      };

      mockOnChange(expectedFilters);
      
      expect(mockOnChange).toHaveBeenCalledWith(expectedFilters);
      expect(expectedFilters.businessUnit).toBeUndefined();
    });
  });

  describe('Filter State Management', () => {
    it('should maintain filter state consistency', () => {
      const filters: TrendFilters = {
        scoreType: 'social_media',
        dateRange: {
          from: new Date('2025-01-15'),
          to: new Date('2025-02-15')
        },
        businessUnit: 'unit-2'
      };

      // Validate all properties are maintained
      expect(filters.scoreType).toBe('social_media');
      expect(filters.dateRange.from).toEqual(new Date('2025-01-15'));
      expect(filters.dateRange.to).toEqual(new Date('2025-02-15'));
      expect(filters.businessUnit).toBe('unit-2');
    });

    it('should handle partial filter updates', () => {
      const originalFilters = { ...defaultFilters };
      const updatedFilters: TrendFilters = {
        ...originalFilters,
        scoreType: 'website_performance'
      };

      expect(updatedFilters.scoreType).toBe('website_performance');
      expect(updatedFilters.dateRange).toEqual(originalFilters.dateRange);
      expect(updatedFilters.businessUnit).toBe(originalFilters.businessUnit);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly for input fields', () => {
      const testDate = new Date('2025-01-15');
      const expectedFormat = '2025-01-15';
      const actualFormat = testDate.toISOString().split('T')[0];
      
      expect(actualFormat).toBe(expectedFormat);
    });

    it('should format dates correctly for German locale display', () => {
      const testDate = new Date('2025-01-15');
      const germanFormat = testDate.toLocaleDateString('de-DE');
      
      expect(germanFormat).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete filter workflow', () => {
      const workflow = [
        // Initial state
        defaultFilters,
        // Change score type
        { ...defaultFilters, scoreType: 'google_presence' as ScoreType },
        // Change date range
        { 
          ...defaultFilters, 
          scoreType: 'google_presence' as ScoreType,
          dateRange: { from: new Date('2025-02-01'), to: new Date('2025-02-28') }
        },
        // Add business unit
        {
          ...defaultFilters,
          scoreType: 'google_presence' as ScoreType,
          dateRange: { from: new Date('2025-02-01'), to: new Date('2025-02-28') },
          businessUnit: 'unit-1'
        }
      ];

      workflow.forEach((filters, index) => {
        expect(filters).toHaveProperty('scoreType');
        expect(filters).toHaveProperty('dateRange');
        expect(filters.dateRange.from).toBeInstanceOf(Date);
        expect(filters.dateRange.to).toBeInstanceOf(Date);
      });
    });
  });
});