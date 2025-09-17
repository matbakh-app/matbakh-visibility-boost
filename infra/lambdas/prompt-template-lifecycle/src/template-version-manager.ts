import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  PromptTemplate,
  TemplateVersion,
  VersionStatus,
  Environment,
  TemplateMetadata,
  TemplateVariable
} from './types';

export class TemplateVersionManager {
  private dynamoClient: DynamoDBDocumentClient;
  private templatesTable: string;
  private versionsTable: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'eu-central-1'
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.templatesTable = process.env.TEMPLATES_TABLE || 'prompt-templates';
    this.versionsTable = process.env.VERSIONS_TABLE || 'template-versions';
  }

  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const newTemplate: PromptTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.templatesTable,
      Item: newTemplate,
      ConditionExpression: 'attribute_not_exists(id)'
    }));

    // Create initial version
    await this.createVersion(id, {
      content: template.content,
      variables: template.variables,
      metadata: template.metadata,
      environment: 'development'
    });

    return newTemplate;
  }

  async createVersion(
    templateId: string,
    versionData: {
      content: string;
      variables: TemplateVariable[];
      metadata: TemplateMetadata;
      environment: Environment;
      changelog?: string;
    }
  ): Promise<TemplateVersion> {
    // Get template to validate it exists
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Get latest version number
    const latestVersion = await this.getLatestVersion(templateId);
    const newVersionNumber = this.incrementVersion(latestVersion?.version || '0.0.0');

    const versionId = uuidv4();
    const now = new Date().toISOString();

    const newVersion: TemplateVersion = {
      id: versionId,
      templateId,
      version: newVersionNumber,
      content: versionData.content,
      variables: versionData.variables,
      metadata: {
        ...versionData.metadata,
        changelog: versionData.changelog || 'Initial version'
      },
      status: 'draft',
      environment: versionData.environment,
      approvalWorkflow: {
        id: uuidv4(),
        templateVersionId: versionId,
        status: 'pending',
        stages: this.getDefaultApprovalStages(versionData.environment),
        currentStage: 0,
        requestedBy: versionData.metadata.author,
        requestedAt: now,
        comments: []
      },
      performanceMetrics: {
        templateVersionId: versionId,
        totalExecutions: 0,
        successRate: 0,
        averageResponseTime: 0,
        averageTokenUsage: 0,
        errorRate: 0,
        costPerExecution: 0,
        lastUpdated: now,
        detailedMetrics: {
          executionsByDay: {},
          responseTimePercentiles: { p50: 0, p90: 0, p95: 0, p99: 0 },
          errorsByType: {},
          tokenUsageDistribution: { min: 0, max: 0, avg: 0, median: 0 },
          geographicDistribution: {}
        }
      },
      createdAt: now
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: this.versionsTable,
      Item: newVersion,
      ConditionExpression: 'attribute_not_exists(id)'
    }));

    return newVersion;
  }

  async getTemplate(templateId: string): Promise<PromptTemplate | null> {
    const result = await this.dynamoClient.send(new GetCommand({
      TableName: this.templatesTable,
      Key: { id: templateId }
    }));

    return result.Item as PromptTemplate || null;
  }

  async getVersion(versionId: string): Promise<TemplateVersion | null> {
    const result = await this.dynamoClient.send(new GetCommand({
      TableName: this.versionsTable,
      Key: { id: versionId }
    }));

    return result.Item as TemplateVersion || null;
  }

  async getLatestVersion(templateId: string): Promise<TemplateVersion | null> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.versionsTable,
      IndexName: 'templateId-version-index',
      KeyConditionExpression: 'templateId = :templateId',
      ExpressionAttributeValues: {
        ':templateId': templateId
      },
      ScanIndexForward: false,
      Limit: 1
    }));

    return result.Items?.[0] as TemplateVersion || null;
  }

  async getVersionsByTemplate(templateId: string): Promise<TemplateVersion[]> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.versionsTable,
      IndexName: 'templateId-version-index',
      KeyConditionExpression: 'templateId = :templateId',
      ExpressionAttributeValues: {
        ':templateId': templateId
      },
      ScanIndexForward: false
    }));

    return result.Items as TemplateVersion[] || [];
  }

  async getVersionsByEnvironment(environment: Environment): Promise<TemplateVersion[]> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.versionsTable,
      IndexName: 'environment-status-index',
      KeyConditionExpression: 'environment = :environment',
      ExpressionAttributeValues: {
        ':environment': environment
      }
    }));

    return result.Items as TemplateVersion[] || [];
  }

  async updateVersionStatus(versionId: string, status: VersionStatus): Promise<void> {
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: versionId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    }));
  }

  async deployVersion(versionId: string, targetEnvironment: Environment): Promise<void> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    if (version.status !== 'approved') {
      throw new Error(`Version ${versionId} is not approved for deployment`);
    }

    // Update version status and deployment info
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: versionId },
      UpdateExpression: 'SET #status = :status, environment = :environment, deployedAt = :deployedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'deployed',
        ':environment': targetEnvironment,
        ':deployedAt': new Date().toISOString()
      }
    }));

    // Mark previous versions in the same environment as deprecated
    await this.deprecatePreviousVersions(version.templateId, targetEnvironment, versionId);
  }

  async rollbackVersion(versionId: string, targetVersionId: string, reason: string, userId: string): Promise<void> {
    const currentVersion = await this.getVersion(versionId);
    const targetVersion = await this.getVersion(targetVersionId);

    if (!currentVersion || !targetVersion) {
      throw new Error('Version not found for rollback');
    }

    if (currentVersion.templateId !== targetVersion.templateId) {
      throw new Error('Cannot rollback to version from different template');
    }

    const rollbackId = uuidv4();
    const now = new Date().toISOString();

    // Create rollback record
    const rollbackInfo = {
      id: rollbackId,
      templateVersionId: versionId,
      previousVersionId: targetVersionId,
      reason,
      triggeredBy: userId,
      triggeredAt: now,
      rollbackType: 'manual' as const,
      affectedEnvironments: [currentVersion.environment],
      rollbackDuration: 0,
      status: 'initiated' as const
    };

    // Update current version with rollback info
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: versionId },
      UpdateExpression: 'SET #status = :status, rollbackInfo = :rollbackInfo',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'deprecated',
        ':rollbackInfo': rollbackInfo
      }
    }));

    // Deploy target version
    await this.deployVersion(targetVersionId, currentVersion.environment);

    // Update rollback status
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.versionsTable,
      Key: { id: versionId },
      UpdateExpression: 'SET rollbackInfo.#status = :status, rollbackInfo.rollbackDuration = :duration',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':duration': Date.now() - new Date(now).getTime()
      }
    }));
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.').map(Number);
    const [major, minor, patch] = parts;
    
    // Increment patch version by default
    return `${major}.${minor}.${patch + 1}`;
  }

  private getDefaultApprovalStages(environment: Environment) {
    switch (environment) {
      case 'development':
        return [
          {
            id: uuidv4(),
            name: 'Technical Review',
            approvers: ['tech-lead'],
            requiredApprovals: 1,
            approvals: [],
            status: 'pending' as const,
            autoApprove: true
          }
        ];
      case 'staging':
        return [
          {
            id: uuidv4(),
            name: 'Technical Review',
            approvers: ['tech-lead'],
            requiredApprovals: 1,
            approvals: [],
            status: 'pending' as const
          },
          {
            id: uuidv4(),
            name: 'QA Review',
            approvers: ['qa-lead'],
            requiredApprovals: 1,
            approvals: [],
            status: 'pending' as const
          }
        ];
      case 'production':
        return [
          {
            id: uuidv4(),
            name: 'Technical Review',
            approvers: ['tech-lead'],
            requiredApprovals: 1,
            approvals: [],
            status: 'pending' as const
          },
          {
            id: uuidv4(),
            name: 'QA Review',
            approvers: ['qa-lead'],
            requiredApprovals: 1,
            approvals: [],
            status: 'pending' as const
          },
          {
            id: uuidv4(),
            name: 'Security Review',
            approvers: ['security-lead'],
            requiredApprovals: 1,
            approvals: [],
            status: 'pending' as const
          },
          {
            id: uuidv4(),
            name: 'Business Approval',
            approvers: ['product-owner', 'business-lead'],
            requiredApprovals: 2,
            approvals: [],
            status: 'pending' as const
          }
        ];
    }
  }

  private async deprecatePreviousVersions(templateId: string, environment: Environment, excludeVersionId: string): Promise<void> {
    const versions = await this.getVersionsByTemplate(templateId);
    const previousVersions = versions.filter(v => 
      v.environment === environment && 
      v.status === 'deployed' && 
      v.id !== excludeVersionId
    );

    for (const version of previousVersions) {
      await this.updateVersionStatus(version.id, 'deprecated');
    }
  }
}