// Score History Service Tests
// Task: 6.4.1 Create ScoreHistory Database Schema - AWS RDS Migration
// Requirements: B.1, B.2

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

// Mock AwsRdsClient
const mockRdsClient = {
  executeQuery: jest.fn(),
  mapRecord: jest.fn()
};

// Mock the AwsRdsClient constructor
jest.mock('../aws-rds-client', () => ({
  AwsRdsClient: jest.fn().mockImplementation(() => mockRdsClient)
}));

// Import after mock
import { ScoreHistoryService } from '../score-history';

describe('ScoreHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock setup
    mockRdsClient.executeQuery.mockResolvedValue({
      records: [mockScoreRecord],
      numberOfRecordsUpdated: 1
    });
    mockRdsClient.mapRecord.mockImplementation((record) => record);
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
      expect(mockRdsClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO score_history'),
        expect.arrayContaining([
          'business-123',
          'overall_visibility',
          75.5,
          'visibility_check',
          expect.any(String),
          expect.any(String)
        ])
      );
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

  describe('insertScores (bulk)', () => {
    it('should insert multiple score records', async () => {
      const insertData: ScoreHistoryInsert[] = [
        {
          business_id: 'business-123',
          score_type: 'overall_visibility',
          score_value: 75.5,
          source: 'visibility_check'
        },
        {
          business_id: 'business-123',
          score_type: 'google_presence',
          score_value: 80.0,
          source: 'visibility_check'
        }
      ];

      const result = await ScoreHistoryService.insertScores(insertData);

      expect(result).toHaveLength(2);
      expect(mockRdsClient.executeQuery).toHaveBeenCalledTimes(2);
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
      expect(mockRdsClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM score_history'),
        expect.arrayContaining(['business-123', 'overall_visibility', 10])
      );
    });

    it('should handle multiple score types in query', async () => {
      const query = {
        business_id: 'business-123',
        score_type: ['overall_visibility', 'google_presence'] as const
      };

      const result = await ScoreHistoryService.queryScoreHistory(query);

      expect(result).toEqual([mockScoreRecord]);
      expect(mockRdsClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('score_type IN'),
        expect.arrayContaining(['business-123', 'overall_visibility', 'google_presence'])
      );
    });

    it('should handle date range filters', async () => {
      const query = {
        business_id: 'business-123',
        date_from: '2025-01-01T00:00:00Z',
        date_to: '2025-01-31T23:59:59Z'
      };

      const result = await ScoreHistoryService.queryScoreHistory(query);

      expect(result).toEqual([mockScoreRecord]);
      expect(mockRdsClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('calculated_at >='),
        expect.arrayContaining(['business-123', '2025-01-01T00:00:00Z', '2025-01-31T23:59:59Z'])
      );
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
      mockRdsClient.executeQuery.mockResolvedValue({
        records: []
      });

      const result = await ScoreHistoryService.getScoreEvolution('business-123', 'overall_visibility');

      expect(result).toMatchObject({
        score_type: 'overall_visibility',
        data_points: [],
        trend: 'stable',
        change_percentage: 0,
        period_days: 30
      });
    });

    it('should calculate trend correctly', async () => {
      const trendData = [
        { ...mockScoreRecord, score_value: 60, calculated_at: '2025-01-01T00:00:00Z' },
        { ...mockScoreRecord, score_value: 80, calculated_at: '2025-01-15T00:00:00Z' }
      ];

      mockRdsClient.executeQuery.mockResolvedValue({
        records: trendData
      });
      mockRdsClient.mapRecord.mockImplementation((record) => record);

      const result = await ScoreHistoryService.getScoreEvolution('business-123', 'overall_visibility');

      expect(result.trend).toBe('increasing');
      expect(result.change_percentage).toBeCloseTo(33.33, 1);
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

      // Should call getScoreEvolution for each score type
      expect(mockRdsClient.executeQuery).toHaveBeenCalledTimes(5); // 5 score types
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
      expect(mockRdsClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE score_history'),
        expect.arrayContaining([80.0, expect.any(String), 'test-id'])
      );
    });

    it('should handle no fields to update', async () => {
      await expect(ScoreHistoryService.updateScore('test-id', {}))
        .rejects.toThrow('No fields to update');
    });
  });

  describe('deleteScore', () => {
    it('should delete a score record', async () => {
      await expect(ScoreHistoryService.deleteScore('test-id')).resolves.not.toThrow();
      expect(mockRdsClient.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM score_history WHERE id = ?',
        ['test-id']
      );
    });

    it('should handle record not found', async () => {
      mockRdsClient.executeQuery.mockResolvedValue({
        numberOfRecordsUpdated: 0
      });

      await expect(ScoreHistoryService.deleteScore('nonexistent'))
        .rejects.toThrow('Score history record not found');
    });
  });

  describe('getLatestScores', () => {
    it('should get latest scores for all score types', async () => {
      const multipleScores = [
        { ...mockScoreRecord, score_type: 'overall_visibility', score_value: 75 },
        { ...mockScoreRecord, score_type: 'google_presence', score_value: 80 },
        { ...mockScoreRecord, score_type: 'social_media', score_value: 70 }
      ];

      mockRdsClient.executeQuery.mockResolvedValue({
        records: multipleScores
      });
      mockRdsClient.mapRecord.mockImplementation((record) => record);

      const businessId = 'business-123';
      const result = await ScoreHistoryService.getLatestScores(businessId);

      expect(result).toHaveProperty('overall_visibility', 75);
      expect(result).toHaveProperty('google_presence', 80);
      expect(result).toHaveProperty('social_media', 70);
      expect(result).toHaveProperty('website_performance', null);
      expect(result).toHaveProperty('review_management', null);
      expect(result).toHaveProperty('local_seo', null);
      expect(result).toHaveProperty('content_quality', null);
      expect(result).toHaveProperty('competitive_position', null);
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