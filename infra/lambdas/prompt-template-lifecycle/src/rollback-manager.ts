import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  RollbackInfo,
  TemplateVersion,
  Environment,
  VersionStatus
} from './types';
import { TemplateVersionManager } from './template-version-manager';
import { PerformanceTrackingManager } from './performance-tracking-manager';

export class RollbackManager {
  private dynamoClient: DynamoDBDocumentClient;
  private versionsTable: string;
  private versionManager: TemplateVersionManager;
  private performanceManager: PerformanceTrackingManager;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-central-1'
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.versionsTable = process.env.VERSIONS_TABLE || 'template-versions';
    this.versionManager = new TemplateVersionManager();
    this.performanceManager = new PerformanceTrackingManager();
  }

  async initiateRollback(
    currentVersionId: string,
    targetVersionId: string,
    reason: string,
    userId: string,
    rollbackType: 'manual' | 'automatic' | 'emergency' = 'manual'
  ): Promise<RollbackInfo> {
    const currentVersion = await this.versionManager.getVersion(currentVersionId);
    const targetVersion = await this.versionManager.getVersion(targetVersionId);

    if (!currentVersion || !targetVersion) {
      throw new Error('Version not found for rollback');
    }

    if (currentVersion.templateId !== targetVersion.templateId) {
      throw new Error('Cannot rollback to version from different template');
    }

    if (currentVersion.status !== 'deployed') {
      throw new Error('Can only rollback deployed versions');
    }

    if (targetVersion.status === 'archived') {
      throw new Error('Cannot rollback to archived version');
    }

    const rollbackId = uuidv4();
    const now = new Date().toISOString();

    const rollbackInfo: RollbackInfo = {
      id: rollbackId,
      templateVersionId: currentVersionId,
      previousVersionId: targetVersionId,
      reason,
      triggeredBy: userId,
      triggeredAt: now,
      rollbackType,
      affectedEnvironments: [currentVersion.environment],
      rollbackDuration: 0,
      status: 'initiated'
    };

    // Update current version with rollback info
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: currentVersionId },
      UpdateExpression: 'SET rollbackInfo = :rollbackInfo, #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':rollbackInfo': rollbackInfo,
        ':status': 'deprecated'
      }
    }));

    // Execute rollback
    try {
      await this.executeRollback(rollbackInfo);
    } catch (error) {
      await this.markRollbackFailed(rollbackId, error as Error);
      throw error;
    }

    return rollbackInfo;
  }

  async executeEmergencyRollback(
    templateId: string,
    environment: Environment,
    reason: string,
    userId: string
  ): Promise<RollbackInfo> {
    // Find current deployed version
    const currentVersion = await this.getCurrentDeployedVersion(templateId, environment);
    if (!currentVersion) {
      throw new Error(`No deployed version found for template ${templateId} in ${environment}`);
    }

    // Find last known good version
    const lastGoodVersion = await this.getLastKnownGoodVersion(templateId, environment, currentVersion.id);
    if (!lastGoodVersion) {
      throw new Error(`No suitable rollback target found for template ${templateId}`);
    }

    return await this.initiateRollback(
      currentVersion.id,
      lastGoodVersion.id,
      `Emergency rollback: ${reason}`,
      userId,
      'emergency'
    );
  }

  async scheduleAutomaticRollback(
    versionId: string,
    conditions: RollbackConditions,
    userId: string
  ): Promise<void> {
    const version = await this.versionManager.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Store rollback conditions in version metadata
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: versionId },
      UpdateExpression: 'SET automaticRollbackConditions = :conditions',
      ExpressionAttributeValues: {
        ':conditions': {
          ...conditions,
          scheduledBy: userId,
          scheduledAt: new Date().toISOString()
        }
      }
    }));

    // In a real implementation, you would set up CloudWatch alarms or scheduled checks
    console.log(`Automatic rollback conditions set for version ${versionId}:`, conditions);
  }

  async checkAutomaticRollbackConditions(versionId: string): Promise<boolean> {
    const version = await this.versionManager.getVersion(versionId);
    if (!version || !version.automaticRollbackConditions) {
      return false;
    }

    const conditions = version.automaticRollbackConditions;
    const metrics = await this.performanceManager.getPerformanceMetrics(versionId);
    
    if (!metrics) {
      return false;
    }

    // Check error rate threshold
    if (conditions.maxErrorRate && metrics.errorRate > conditions.maxErrorRate) {
      await this.initiateRollback(
        versionId,
        conditions.fallbackVersionId,
        `Automatic rollback: Error rate ${metrics.errorRate}% exceeds threshold ${conditions.maxErrorRate}%`,
        'system',
        'automatic'
      );
      return true;
    }

    // Check response time threshold
    if (conditions.maxResponseTime && metrics.averageResponseTime > conditions.maxResponseTime) {
      await this.initiateRollback(
        versionId,
        conditions.fallbackVersionId,
        `Automatic rollback: Response time ${metrics.averageResponseTime}ms exceeds threshold ${conditions.maxResponseTime}ms`,
        'system',
        'automatic'
      );
      return true;
    }

    // Check success rate threshold
    if (conditions.minSuccessRate && metrics.successRate < conditions.minSuccessRate) {
      await this.initiateRollback(
        versionId,
        conditions.fallbackVersionId,
        `Automatic rollback: Success rate ${metrics.successRate}% below threshold ${conditions.minSuccessRate}%`,
        'system',
        'automatic'
      );
      return true;
    }

    return false;
  }

  async getRollbackHistory(templateId: string): Promise<RollbackInfo[]> {
    const versions = await this.versionManager.getVersionsByTemplate(templateId);
    const rollbacks = versions
      .filter(v => v.rollbackInfo)
      .map(v => v.rollbackInfo!)
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

    return rollbacks;
  }

  async getRollbackInfo(rollbackId: string): Promise<RollbackInfo | null> {
    // Find version with this rollback ID
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.versionsTable,
      IndexName: 'rollbackId-index',
      KeyConditionExpression: 'rollbackInfo.id = :rollbackId',
      ExpressionAttributeValues: {
        ':rollbackId': rollbackId
      }
    }));

    const version = result.Items?.[0] as TemplateVersion;
    return version?.rollbackInfo || null;
  }

  async validateRollbackTarget(
    currentVersionId: string,
    targetVersionId: string
  ): Promise<{
    isValid: boolean;
    reasons: string[];
    warnings: string[];
  }> {
    const currentVersion = await this.versionManager.getVersion(currentVersionId);
    const targetVersion = await this.versionManager.getVersion(targetVersionId);

    const reasons: string[] = [];
    const warnings: string[] = [];

    if (!currentVersion) {
      reasons.push('Current version not found');
    }

    if (!targetVersion) {
      reasons.push('Target version not found');
    }

    if (currentVersion && targetVersion) {
      if (currentVersion.templateId !== targetVersion.templateId) {
        reasons.push('Versions belong to different templates');
      }

      if (targetVersion.status === 'archived') {
        reasons.push('Cannot rollback to archived version');
      }

      if (targetVersion.status === 'deprecated') {
        warnings.push('Rolling back to deprecated version');
      }

      // Check if target version is older
      const currentVersionNum = this.parseVersion(currentVersion.version);
      const targetVersionNum = this.parseVersion(targetVersion.version);
      
      if (targetVersionNum >= currentVersionNum) {
        warnings.push('Target version is not older than current version');
      }

      // Check performance differences
      const currentMetrics = await this.performanceManager.getPerformanceMetrics(currentVersionId);
      const targetMetrics = await this.performanceManager.getPerformanceMetrics(targetVersionId);

      if (currentMetrics && targetMetrics) {
        if (targetMetrics.successRate < currentMetrics.successRate - 10) {
          warnings.push(`Target version has significantly lower success rate (${targetMetrics.successRate}% vs ${currentMetrics.successRate}%)`);
        }

        if (targetMetrics.averageResponseTime > currentMetrics.averageResponseTime * 1.5) {
          warnings.push(`Target version has significantly higher response time (${targetMetrics.averageResponseTime}ms vs ${currentMetrics.averageResponseTime}ms)`);
        }
      }
    }

    return {
      isValid: reasons.length === 0,
      reasons,
      warnings
    };
  }

  private async executeRollback(rollbackInfo: RollbackInfo): Promise<void> {
    const startTime = Date.now();

    try {
      // Update rollback status to in_progress
      await this.updateRollbackStatus(rollbackInfo.templateVersionId, 'in_progress');

      // Deploy target version
      const targetVersion = await this.versionManager.getVersion(rollbackInfo.previousVersionId);
      if (!targetVersion) {
        throw new Error('Target version not found');
      }

      await this.versionManager.deployVersion(rollbackInfo.previousVersionId, rollbackInfo.affectedEnvironments[0]);

      // Calculate rollback duration
      const duration = Date.now() - startTime;

      // Update rollback status to completed
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.versionsTable,
        Key: { id: rollbackInfo.templateVersionId },
        UpdateExpression: 'SET rollbackInfo.#status = :status, rollbackInfo.rollbackDuration = :duration',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':duration': duration
        }
      }));

    } catch (error) {
      await this.markRollbackFailed(rollbackInfo.id, error as Error);
      throw error;
    }
  }

  private async getCurrentDeployedVersion(
    templateId: string,
    environment: Environment
  ): Promise<TemplateVersion | null> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.versionsTable,
      IndexName: 'templateId-environment-index',
      KeyConditionExpression: 'templateId = :templateId AND environment = :environment',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':templateId': templateId,
        ':environment': environment,
        ':status': 'deployed'
      },
      ScanIndexForward: false,
      Limit: 1
    }));

    return result.Items?.[0] as TemplateVersion || null;
  }

  private async getLastKnownGoodVersion(
    templateId: string,
    environment: Environment,
    excludeVersionId: string
  ): Promise<TemplateVersion | null> {
    const versions = await this.versionManager.getVersionsByTemplate(templateId);
    
    // Filter for versions that were previously deployed in this environment
    // and have good performance metrics
    const candidates = versions.filter(v => 
      v.id !== excludeVersionId &&
      v.environment === environment &&
      ['deployed', 'deprecated'].includes(v.status) &&
      !v.rollbackInfo // Avoid versions that were rolled back
    );

    if (candidates.length === 0) {
      return null;
    }

    // Sort by version number (descending) and return the most recent
    candidates.sort((a, b) => this.parseVersion(b.version) - this.parseVersion(a.version));
    
    // Prefer versions with good performance metrics
    for (const candidate of candidates) {
      const metrics = await this.performanceManager.getPerformanceMetrics(candidate.id);
      if (metrics && metrics.successRate > 90 && metrics.errorRate < 5) {
        return candidate;
      }
    }

    // Fallback to most recent version
    return candidates[0];
  }

  private async updateRollbackStatus(versionId: string, status: 'in_progress' | 'completed' | 'failed'): Promise<void> {
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: versionId },
      UpdateExpression: 'SET rollbackInfo.#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    }));
  }

  private async markRollbackFailed(rollbackId: string, error: Error): Promise<void> {
    // Find version with this rollback ID and mark as failed
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.versionsTable,
      FilterExpression: 'rollbackInfo.id = :rollbackId',
      ExpressionAttributeValues: {
        ':rollbackId': rollbackId
      }
    }));

    const version = result.Items?.[0] as TemplateVersion;
    if (version) {
      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.versionsTable,
        Key: { id: version.id },
        UpdateExpression: 'SET rollbackInfo.#status = :status, rollbackInfo.errorMessage = :error',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'failed',
          ':error': error.message
        }
      }));
    }
  }

  private parseVersion(version: string): number {
    const parts = version.split('.').map(Number);
    const [major = 0, minor = 0, patch = 0] = parts;
    return major * 10000 + minor * 100 + patch;
  }
}

interface RollbackConditions {
  maxErrorRate?: number;
  maxResponseTime?: number;
  minSuccessRate?: number;
  fallbackVersionId: string;
  checkInterval?: number; // minutes
}

declare module './types' {
  interface TemplateVersion {
    automaticRollbackConditions?: RollbackConditions & {
      scheduledBy: string;
      scheduledAt: string;
    };
  }
}