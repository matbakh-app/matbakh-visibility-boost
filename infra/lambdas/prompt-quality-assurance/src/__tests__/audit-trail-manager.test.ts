import { jest } from '@jest/globals';
import { AuditTrailManager } from '../audit-trail-manager';
import { mockPromptExecution, mockQualityMetrics, mockUserFeedback } from './setup';

// Mock the AWS SDK
const mockSend = jest.fn();
const mockPutMetricData = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: mockSend
    })
  },
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  QueryCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-cloudwatch', () => ({
  CloudWatchClient: jest.fn().mockImplementation(() => ({
    send: mockPutMetricData
  })),
  PutMetricDataCommand: jest.fn()
}));

describe('AuditTrailManager', () => {
  let auditTrailManager: AuditTrailManager;

  beforeEach(() => {
    auditTrailManager = new AuditTrailManager('test-table', 'eu-central-1');
    jest.clearAllMocks();
  });

  describe('createAuditRecord', () => {
    it('should create audit record successfully', async () => {
      mockSend.mockResolvedValueOnce({});
      mockPutMetricData.mockResolvedValueOnce({});

      const request = {
        execution: mockPromptExecution,
        qualityMetrics: mockQualityMetrics
      };

      const result = await auditTrailManager.createAuditRecord(request);

      expect(result).toBeDefined();
      expect(result.executionId).toBe(mockPromptExecution.id);
      expect(result.templateId).toBe(mockPromptExecution.templateId);
      expect(result.qualityMetrics).toEqual(mockQualityMetrics);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockPutMetricData).toHaveBeenCalledTimes(1);
    });

    it('should handle missing quality metrics by calculating defaults', async () => {
      mockSend.mockResolvedValueOnce({});
      mockPutMetricData.mockResolvedValueOnce({});

      const request = {
        execution: mockPromptExecution
      };

      const result = await auditTrailManager.createAuditRecord(request);

      expect(result.qualityMetrics).toBeDefined();
      expect(result.qualityMetrics.overallScore).toBeGreaterThan(0);
    });

    it('should throw error when DynamoDB operation fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      const request = {
        execution: mockPromptExecution
      };

      await expect(auditTrailManager.createAuditRecord(request)).rejects.toThrow('Failed to create audit record');
    });
  });

  describe('getAuditTrail', () => {
    it('should retrieve audit trail with template filter', async () => {
      const mockAuditRecords = [
        {
          id: 'audit-1',
          templateId: 'template-456',
          qualityMetrics: mockQualityMetrics
        }
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockAuditRecords
      });

      const request = {
        templateId: 'template-456',
        limit: 10
      };

      const result = await auditTrailManager.getAuditTrail(request);

      expect(result).toEqual(mockAuditRecords);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle empty results', async () => {
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      const result = await auditTrailManager.getAuditTrail({});

      expect(result).toEqual([]);
    });

    it('should throw error when query fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('Query error'));

      await expect(auditTrailManager.getAuditTrail({})).rejects.toThrow('Failed to retrieve audit trail');
    });
  });

  describe('getAuditRecord', () => {
    it('should retrieve specific audit record', async () => {
      const mockRecord = {
        id: 'audit-123',
        templateId: 'template-456'
      };

      mockSend.mockResolvedValueOnce({
        Item: mockRecord
      });

      const result = await auditTrailManager.getAuditRecord('audit-123');

      expect(result).toEqual(mockRecord);
    });

    it('should return null when record not found', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await auditTrailManager.getAuditRecord('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('addUserFeedback', () => {
    it('should add user feedback to audit record', async () => {
      mockSend.mockResolvedValueOnce({});
      mockSend.mockResolvedValueOnce({});

      await auditTrailManager.addUserFeedback('audit-123', mockUserFeedback);

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should throw error when update fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('Update error'));

      await expect(
        auditTrailManager.addUserFeedback('audit-123', mockUserFeedback)
      ).rejects.toThrow('Failed to add user feedback');
    });
  });

  describe('getTemplateAuditStats', () => {
    it('should calculate template statistics', async () => {
      const mockAuditRecords = [
        {
          id: 'audit-1',
          qualityMetrics: { overallScore: 0.8, confidence: 0.9 },
          performanceMetrics: { responseTime: 2000, tokenEfficiency: 0.6 },
          userFeedback: { rating: 4 }
        },
        {
          id: 'audit-2',
          qualityMetrics: { overallScore: 0.7, confidence: 0.8 },
          performanceMetrics: { responseTime: 3000, tokenEfficiency: 0.5 },
          userFeedback: { rating: 5 }
        }
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockAuditRecords
      });

      const result = await auditTrailManager.getTemplateAuditStats('template-456');

      expect(result).toBeDefined();
      expect(result.totalExecutions).toBe(2);
      expect(result.averageQualityScore).toBe(0.75);
      expect(result.averageResponseTime).toBe(2500);
      expect(result.userSatisfactionRate).toBe(1); // Both ratings >= 4
    });

    it('should handle empty audit records', async () => {
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      const result = await auditTrailManager.getTemplateAuditStats('template-456');

      expect(result.totalExecutions).toBe(0);
      expect(result.averageQualityScore).toBe(0);
    });
  });

  describe('private helper methods', () => {
    it('should calculate token efficiency correctly', () => {
      const execution = {
        ...mockPromptExecution,
        tokenUsage: { input: 100, output: 200, total: 300 }
      };

      // Access private method through type assertion for testing
      const manager = auditTrailManager as any;
      const efficiency = manager.calculateTokenEfficiency(execution);

      expect(efficiency).toBe(200 / 300); // output / total
    });

    it('should calculate cost per token', () => {
      const execution = mockPromptExecution;

      const manager = auditTrailManager as any;
      const cost = manager.calculateCostPerToken(execution);

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });
  });
});