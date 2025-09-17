/**
 * Rollback Manager Test Suite
 * 
 * This test suite validates rollback functionality including manual rollbacks,
 * emergency rollbacks, validation, and rollback history management.
 */

import { jest } from '@jest/globals';
/**
 * @jest-environment node
 */

import { RollbackManager } from '../rollback-manager';
import { TemplateVersionManager } from '../template-version-manager';
import { PerformanceTrackingManager } from '../performance-tracking-manager';

describe('RollbackManager', () => {
  let manager: RollbackManager;
  let mockVersionManager: jest.Mocked<TemplateVersionManager>;
  let mockPerformanceManager: jest.Mocked<PerformanceTrackingManager>;

  beforeEach(() => {
    manager = new RollbackManager();
    mockVersionManager = new TemplateVersionManager() as jest.Mocked<TemplateVersionManager>;
    mockPerformanceManager = new PerformanceTrackingManager() as jest.Mocked<PerformanceTrackingManager>;
    (manager as any).versionManager = mockVersionManager;
    (manager as any).performanceManager = mockPerformanceManager;
  });

  describe('initiateRollback', () => {
    it('should successfully initiate rollback between compatible versions', async () => {
      const reason = 'Performance degradation detected in production';
      const userId = 'admin-user-123';

      const currentVersion = createMockVersion({
        status: 'deployed',
        environment: 'production',
        templateId: 'template-123'
      });

      const targetVersion = createMockVersion({
        status: 'deprecated',
        environment: 'production',
        templateId: 'template-123' // Same template
      });

      mockVersionManager.getVersion
        .mockResolvedValueOnce(currentVersion)
        .mockResolvedValueOnce(targetVersion)
        .mockResolvedValueOnce(targetVersion);

      mockVersionManager.deployVersion.mockResolvedValueOnce();
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.initiateRollback(currentVersion.id, targetVersion.id, reason, userId);

      expect(result).toMatchObject({
        templateVersionId: currentVersion.id,
        previousVersionId: targetVersion.id,
        reason,
        triggeredBy: userId,
        rollbackType: 'manual',
        status: 'initiated'
      });
      expect(result.id).toBeValidUUID();
      expect(result.triggeredAt).toBeValidTimestamp();
      expect(mockVersionManager.deployVersion).toHaveBeenCalledWith(targetVersion.id, 'production');
    });

    it('should validate current version deployment status', async () => {
      const reason = 'Test rollback validation';
      const userId = 'admin-user';

      const currentVersion = createMockVersion({
        status: 'draft' // Not deployed
      });
      const targetVersion = createMockVersion();

      mockVersionManager.getVersion.mockResolvedValueOnce(currentVersion);

      await expect(
        manager.initiateRollback(currentVersion.id, targetVersion.id, reason, userId)
      ).rejects.toThrow('Can only rollback deployed versions');
    });

    it('should validate template compatibility between versions', async () => {
      const reason = 'Cross-template rollback test';
      const userId = 'admin-user';

      const currentVersion = createMockVersion({
        templateId: 'template-123',
        status: 'deployed'
      });

      const targetVersion = createMockVersion({
        templateId: 'template-456', // Different template
        status: 'deployed'
      });

      mockVersionManager.getVersion
        .mockResolvedValueOnce(currentVersion)
        .mockResolvedValueOnce(targetVersion);

      await expect(
        manager.initiateRollback(currentVersion.id, targetVersion.id, reason, userId)
      ).rejects.toThrow('Cannot rollback to version from different template');
    });

    it('should prevent rollback to archived versions', async () => {
      const reason = 'Archived version rollback test';
      const userId = 'admin-user';

      const currentVersion = createMockVersion({
        templateId: 'template-123',
        status: 'deployed'
      });

      const targetVersion = createMockVersion({
        templateId: 'template-123',
        status: 'archived' // Archived status
      });

      mockVersionManager.getVersion
        .mockResolvedValueOnce(currentVersion)
        .mockResolvedValueOnce(targetVersion);

      await expect(
        manager.initiateRollback(currentVersion.id, targetVersion.id, reason, userId)
      ).rejects.toThrow('Cannot rollback to archived version');
    });
  });

  describe('executeEmergencyRollback', () => {
    it('should execute emergency rollback to last stable version', async () => {
      const templateId = 'template-123';
      const environment = 'production';
      const reason = 'Critical security vulnerability detected';
      const userId = 'security-admin';

      const currentVersion = createMockVersion({
        templateId,
        environment,
        status: 'deployed'
      });

      const lastGoodVersion = createMockVersion({
        templateId,
        environment,
        status: 'deprecated'
      });

      // Mock finding current deployed version
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([currentVersion]));
      
      // Mock finding versions for template
      mockVersionManager.getVersionsByTemplate.mockResolvedValueOnce([
        currentVersion,
        lastGoodVersion
      ]);

      // Mock performance metrics for last good version
      mockPerformanceManager.getPerformanceMetrics.mockResolvedValueOnce(
        createMockPerformanceMetrics({
          templateVersionId: lastGoodVersion.id,
          successRate: 95,
          errorRate: 2,
          totalExecutions: 100
        })
      );

      // Mock rollback execution
      mockVersionManager.getVersion
        .mockResolvedValueOnce(currentVersion)
        .mockResolvedValueOnce(lastGoodVersion)
        .mockResolvedValueOnce(lastGoodVersion);

      mockVersionManager.deployVersion.mockResolvedValueOnce();
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());
      mockSend.mockResolvedValueOnce(createMockDynamoEmptyResponse());

      const result = await manager.executeEmergencyRollback(templateId, environment, reason, userId);

      expect(result).toMatchObject({
        templateVersionId: currentVersion.id,
        previousVersionId: lastGoodVersion.id,
        rollbackType: 'emergency',
        triggeredBy: userId
      });
      expect(result.reason).toContain(reason);
      expect(result.id).toBeValidUUID();
      expect(result.triggeredAt).toBeValidTimestamp();
    });

    it('should handle case when no deployed version exists', async () => {
      const templateId = 'template-without-deployment';
      const environment = 'production';
      const reason = 'Emergency rollback attempt';
      const userId = 'admin-user';

      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([])); // No deployed versions

      await expect(
        manager.executeEmergencyRollback(templateId, environment, reason, userId)
      ).rejects.toThrow(`No deployed version found for template ${templateId} in ${environment}`);
    });

    it('should handle case when no suitable rollback target exists', async () => {
      const templateId = 'template-123';
      const environment = 'production';
      const reason = 'Emergency rollback';
      const userId = 'admin-user';

      const currentVersion = createMockVersion({
        templateId,
        environment,
        status: 'deployed'
      });

      // Mock finding current deployed version but no other versions
      mockSend.mockResolvedValueOnce(createMockDynamoListResponse([currentVersion]));
      mockVersionManager.getVersionsByTemplate.mockResolvedValueOnce([currentVersion]); // Only current version

      await expect(
        manager.executeEmergencyRollback(templateId, environment, reason, userId)
      ).rejects.toThrow();
    });
  });

  describe('validateRollbackTarget', () => {
    it('should validate compatible rollback target with better performance', async () => {
      const currentVersion = createMockVersion({
        templateId: 'template-123',
        version: '2.0.0'
      });

      const targetVersion = createMockVersion({
        templateId: 'template-123',
        version: '1.5.0',
        status: 'deployed'
      });

      mockVersionManager.getVersion
        .mockResolvedValueOnce(currentVersion)
        .mockResolvedValueOnce(targetVersion);

      // Current version has poor performance
      const currentMetrics = createMockPerformanceMetrics({
        templateVersionId: currentVersion.id,
        successRate: 85,
        averageResponseTime: 2000,
        errorRate: 15
      });

      // Target version has better performance
      const targetMetrics = createMockPerformanceMetrics({
        templateVersionId: targetVersion.id,
        successRate: 95,
        averageResponseTime: 1000,
        errorRate: 5
      });

      mockPerformanceManager.getPerformanceMetrics
        .mockResolvedValueOnce(currentMetrics)
        .mockResolvedValueOnce(targetMetrics);

      const result = await manager.validateRollbackTarget(currentVersion.id, targetVersion.id);

      expect(result.isValid).toBe(true);
      expect(result.reasons).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.performanceComparison).toBeDefined();
    });

    it('should identify validation errors for incompatible rollback', async () => {
      const currentVersion = createMockVersion({
        templateId: 'template-123'
      });

      const targetVersion = createMockVersion({
        templateId: 'template-456', // Different template
        status: 'archived'
      });

      mockVersionManager.getVersion
        .mockResolvedValueOnce(currentVersion)
        .mockResolvedValueOnce(targetVersion);

      const result = await manager.validateRollbackTarget(currentVersion.id, targetVersion.id);

      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('Versions belong to different templates');
      expect(result.reasons).toContain('Cannot rollback to archived version');
      expect(result.warnings).toBeDefined();
    });

    it('should warn about potential performance degradation', async () => {
      const currentVersion = createMockVersion({
        templateId: 'template-123',
        version: '2.0.0'
      });

      const targetVersion = createMockVersion({
        templateId: 'template-123',
        version: '1.0.0',
        status: 'deprecated'
      });

      mockVersionManager.getVersion
        .mockResolvedValueOnce(currentVersion)
        .mockResolvedValueOnce(targetVersion);

      // Current version has good performance
      const currentMetrics = createMockPerformanceMetrics({
        templateVersionId: currentVersion.id,
        successRate: 95,
        averageResponseTime: 1000,
        errorRate: 5
      });

      // Target version has worse performance
      const targetMetrics = createMockPerformanceMetrics({
        templateVersionId: targetVersion.id,
        successRate: 80, // Significantly lower
        averageResponseTime: 2000, // Significantly higher
        errorRate: 20
      });

      mockPerformanceManager.getPerformanceMetrics
        .mockResolvedValueOnce(currentMetrics)
        .mockResolvedValueOnce(targetMetrics);

      const result = await manager.validateRollbackTarget(currentVersion.id, targetVersion.id);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Rolling back to deprecated version');
      expect(result.warnings.some(w => w.includes('lower success rate'))).toBe(true);
      expect(result.warnings.some(w => w.includes('higher response time'))).toBe(true);
      expect(result.performanceComparison).toBeDefined();
    });
  });

  describe('getRollbackHistory', () => {
    it('should return chronologically ordered rollback history', async () => {
      const templateId = 'template-123';
      
      const mockVersions = [
        createMockVersion({
          rollbackInfo: createMockRollbackInfo({
            reason: 'Performance issues detected',
            triggeredBy: 'admin-user',
            triggeredAt: '2025-01-09T10:00:00Z',
            rollbackType: 'manual',
            status: 'completed'
          })
        }),
        createMockVersion({
          rollbackInfo: createMockRollbackInfo({
            reason: 'Critical security vulnerability',
            triggeredBy: 'security-team',
            triggeredAt: '2025-01-09T11:00:00Z',
            rollbackType: 'emergency',
            status: 'completed'
          })
        })
      ];

      mockVersionManager.getVersionsByTemplate.mockResolvedValueOnce(mockVersions);

      const result = await manager.getRollbackHistory(templateId);

      expect(result).toHaveLength(2);
      expect(result[0].triggeredAt).toBe('2025-01-09T11:00:00Z'); // Most recent first
      expect(result[1].triggeredAt).toBe('2025-01-09T10:00:00Z');
      expect(result[0].rollbackType).toBe('emergency');
      expect(result[1].rollbackType).toBe('manual');
    });

    it('should handle template with no rollback history', async () => {
      const templateId = 'template-no-rollbacks';
      
      const mockVersions = [
        createMockVersion({ rollbackInfo: null }),
        createMockVersion({ rollbackInfo: null })
      ];

      mockVersionManager.getVersionsByTemplate.mockResolvedValueOnce(mockVersions);

      const result = await manager.getRollbackHistory(templateId);

      expect(result).toHaveLength(0);
    });

    it('should filter out incomplete rollback entries', async () => {
      const templateId = 'template-123';
      
      const mockVersions = [
        createMockVersion({
          rollbackInfo: createMockRollbackInfo({
            status: 'completed'
          })
        }),
        createMockVersion({
          rollbackInfo: createMockRollbackInfo({
            status: 'failed'
          })
        }),
        createMockVersion({ rollbackInfo: null })
      ];

      mockVersionManager.getVersionsByTemplate.mockResolvedValueOnce(mockVersions);

      const result = await manager.getRollbackHistory(templateId);

      expect(result).toHaveLength(2); // Only completed and failed rollbacks
      expect(result.every(r => r.status !== undefined)).toBe(true);
    });
  });
});