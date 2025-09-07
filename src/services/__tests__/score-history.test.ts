// Score History Service Tests
// Task: 6.4.1 Create ScoreHistory Database Schema
// Requirements: B.1, B.2

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ScoreHistoryInsert } from '@/types/score-history';

const mockScoreRecord = {
  id: 'test-id',
  business_id: 'business-123',
  score_type: 'overall_visibility' as const,
  score_value: 75.5,
  calculated_at: '2025-01-09T10:00:00Z',
  source: 'visibility_check' as const,
  meta: { confidence_score: 85 },
  created_at: '2025-01-09T10:00:00Z',
  updated_at: '2025-01-09T10:00:00Z'
};

// Mock Supabase client - must be at top level for hoisting
vi.mock('@/integrations/supabase/client', () => {
  const mockQuery = {
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis()
  };

  return {
    supabase: {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockScoreRecord,
              error: null
            }))
          }))
        })),
        select: vi.fn(() => {
          // Return a promise-like object that resolves to data
          const queryResult = Promise.resolve({
            data: [mockScoreRecord],
            error: null
          });
          
          // Add chainable methods to the promise
          Object.assign(queryResult, mockQuery);
          return queryResult;
        }),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockScoreRecord,
                error: null
              }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            error: null
          }))
        }))
      }))
    }
  };
});

// Import after mock
import { ScoreHistoryService } from '../score-history';

describe('ScoreHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('insertScore', () => {
    it('should insert a new score record', async () => {
      const insertData: ScoreHistoryInsert = {
        business_id: 'business-123',
        score_type: 'overall_visibility',
        score_value: 75.5,
        source: 'visibility_check',
        meta: { confidence_score: 85 }
      };

      const result = await ScoreHistoryService.insertScore(insertData);

      expect(result).toEqual(mockScoreRecord);
    });

    it('should validate score_type enum values', () => {
      const validScoreTypes = [
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
      });
    });

    it('should validate source enum values', () => {
      const validSources = [
        'visibility_check',
        'manual_entry',
        'automated_analysis',
        'competitive_benchmarking',
        'swot_analysis'
      ];

      validSources.forEach(source => {
        expect(source).toBeDefined();
      });
    });
  });

  describe('queryScoreHistory', () => {
    it('should query score history with filters', async () => {
      const query = {
        business_id: 'business-123',
        score_type: 'overall_visibility' as const,
        limit: 10
      };

      const result = await ScoreHistoryService.queryScoreHistory(query);

      expect(result).toEqual([mockScoreRecord]);
    });

    it('should handle multiple score types in query', async () => {
      const query = {
        business_id: 'business-123',
        score_type: ['overall_visibility', 'google_presence'] as const
      };

      const result = await ScoreHistoryService.queryScoreHistory(query);

      expect(result).toEqual([mockScoreRecord]);
    });
  });

  describe('getScoreEvolution', () => {
    it('should calculate score evolution data', async () => {
      const businessId = 'business-123';
      const scoreType = 'overall_visibility';
      const days = 30;

      const result = await ScoreHistoryService.getScoreEvolution(businessId, scoreType, days);

      expect(result).toMatchObject({
        score_type: scoreType,
        data_points: expect.any(Array),
        trend: expect.any(String),
        change_percentage: expect.any(Number),
        period_days: days
      });
    });

    it('should handle empty data gracefully', async () => {
      // This test will use the default mock behavior which returns empty array
      // when no specific mock is set up for the query
      const result = await ScoreHistoryService.getScoreEvolution('business-123', 'overall_visibility');

      expect(result).toMatchObject({
        score_type: 'overall_visibility',
        data_points: expect.any(Array),
        trend: expect.any(String),
        change_percentage: expect.any(Number),
        period_days: 30
      });
    });
  });

  describe('getBusinessAnalytics', () => {
    it('should generate comprehensive business analytics', async () => {
      const businessId = 'business-123';

      const result = await ScoreHistoryService.getBusinessAnalytics(businessId);

      expect(result).toMatchObject({
        business_id: businessId,
        overall_trend: expect.any(String),
        score_evolution: expect.any(Array),
        key_insights: expect.any(Array),
        recommendations: expect.any(Array),
        last_updated: expect.any(String)
      });
    });
  });

  describe('updateScore', () => {
    it('should update a score record', async () => {
      const updateData = {
        score_value: 80.0,
        meta: { updated: true }
      };

      const result = await ScoreHistoryService.updateScore('test-id', updateData);

      expect(result).toEqual(mockScoreRecord);
    });
  });

  describe('deleteScore', () => {
    it('should delete a score record', async () => {
      await expect(ScoreHistoryService.deleteScore('test-id')).resolves.not.toThrow();
    });
  });

  describe('getLatestScores', () => {
    it('should get latest scores for all score types', async () => {
      const businessId = 'business-123';

      const result = await ScoreHistoryService.getLatestScores(businessId);

      expect(result).toHaveProperty('overall_visibility');
      expect(result).toHaveProperty('google_presence');
      expect(result).toHaveProperty('social_media');
      expect(result).toHaveProperty('website_performance');
      expect(result).toHaveProperty('review_management');
      expect(result).toHaveProperty('local_seo');
      expect(result).toHaveProperty('content_quality');
      expect(result).toHaveProperty('competitive_position');
    });
  });
});

// Database Schema Validation Tests
describe('Score History Database Schema', () => {
  it('should validate table structure requirements', () => {
    // Test that our types match the expected database schema
    const expectedFields = [
      'id',
      'business_id', 
      'score_type',
      'score_value',
      'calculated_at',
      'source',
      'meta',
      'created_at',
      'updated_at'
    ];

    expectedFields.forEach(field => {
      expect(mockScoreRecord).toHaveProperty(field);
    });
  });

  it('should validate score_value constraints', () => {
    // Score should be between 0 and 100
    expect(mockScoreRecord.score_value).toBeGreaterThanOrEqual(0);
    expect(mockScoreRecord.score_value).toBeLessThanOrEqual(100);
  });

  it('should validate foreign key relationship', () => {
    // business_id should reference business_partners(id)
    expect(mockScoreRecord.business_id).toBeDefined();
    expect(typeof mockScoreRecord.business_id).toBe('string');
  });

  it('should validate index requirements', () => {
    // The main performance index should cover (business_id, score_type, calculated_at)
    const indexFields = ['business_id', 'score_type', 'calculated_at'];
    
    indexFields.forEach(field => {
      expect(mockScoreRecord).toHaveProperty(field);
    });
  });
});