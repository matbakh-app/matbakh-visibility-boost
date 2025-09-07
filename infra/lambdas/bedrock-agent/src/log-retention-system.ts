/**
 * Log Retention and Cleanup System
 * 
 * Manages log lifecycle, retention policies, and automated cleanup
 * in compliance with GDPR and business requirements.
 */

import { DynamoDBClient, ScanCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DeleteLogGroupCommand, PutRetentionPolicyCommand } from '@aws-sdk/client-cloudwatch-logs';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface RetentionPolicy {
  name: string;
  description: string;
  data_type: 'ai_logs' | 'audit_logs' | 'user_data' | 'system_logs';
  retention_days: number;
  archive_before_deletion: boolean;
  archive_location?: string;
  compliance_requirements: {
    gdpr_article?: string;
    business_justification: string;
    legal_hold_exempt: boolean;
  };
  cleanup_actions: {
    anonymize: boolean;
    encrypt_archive: boolean;
    notify_stakeholders: boolean;
  };
}

export interface CleanupJob {
  job_id: string;
  created_at: string;
  policy_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  target_date_range: {
    start_date: string;
    end_date: string;
  };
  estimated_records: number;
  processed_records: number;
  deleted_records: number;
  archived_records: number;
  errors: string[];
  completion_time?: string;
}

export class LogRetentionSystem {
  private dynamoClient: DynamoDBClient;
  private cloudWatchClient: CloudWatchLogsClient;
  private s3Client: S3Client;
  
  private retentionPolicies: RetentionPolicy[] = [
    {
      name: 'ai_operation_logs',
      description: 'AI operation logs with token usage and performance metrics',
      data_type: 'ai_logs',
      retention_days: 365, // 1 year for operational data
      archive_before_deletion: true,
      archive_location: 's3://matbakh-ai-logs-archive/',
      compliance_requirements: {
        gdpr_article: 'Article 5(1)(e) - Storage limitation',
        business_justification: 'Required for cost analysis and model performance optimization',
        legal_hold_exempt: false
      },
      cleanup_actions: {
        anonymize: true,
        encrypt_archive: true,
        notify_stakeholders: false
      }
    },
    {
      name: 'audit_trail_logs',
      description: 'Comprehensive audit trail for compliance and security',
      data_type: 'audit_logs',
      retention_days: 2555, // 7 years for GDPR compliance
      archive_before_deletion: true,
      archive_location: 's3://matbakh-audit-archive/',
      compliance_requirements: {
        gdpr_article: 'Article 30 - Records of processing activities',
        business_justification: 'Legal requirement for audit trail maintenance',
        legal_hold_exempt: true
      },
      cleanup_actions: {
        anonymize: false, // Keep for legal purposes
        encrypt_archive: true,
        notify_stakeholders: true
      }
    },
    {
      name: 'user_interaction_logs',
      description: 'User interaction and session data',
      data_type: 'user_data',
      retention_days: 90, // 3 months for UX analysis
      archive_before_deletion: false,
      compliance_requirements: {
        gdpr_article: 'Article 17 - Right to erasure',
        business_justification: 'User experience optimization and support',
        legal_hold_exempt: false
      },
      cleanup_actions: {
        anonymize: true,
        encrypt_archive: false,
        notify_stakeholders: false
      }
    },
    {
      name: 'system_performance_logs',
      description: 'System performance and error logs',
      data_type: 'system_logs',
      retention_days: 180, // 6 months for troubleshooting
      archive_before_deletion: true,
      archive_location: 's3://matbakh-system-logs-archive/',
      compliance_requirements: {
        business_justification: 'System maintenance and troubleshooting',
        legal_hold_exempt: false
      },
      cleanup_actions: {
        anonymize: true,
        encrypt_archive: true,
        notify_stakeholders: false
      }
    }
  ];

  constructor() {
    this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-central-1' });
    this.cloudWatchClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'eu-central-1' });
    this.s3Client = new S3Client({ region: process.env.AWS_REGION || 'eu-central-1' });
  }

  /**
   * Execute cleanup based on retention policies
   */
  async executeCleanup(policyName?: string): Promise<CleanupJob[]> {
    const policiesToExecute = policyName 
      ? this.retentionPolicies.filter(p => p.name === policyName)
      : this.retentionPolicies;

    const jobs: CleanupJob[] = [];

    for (const policy of policiesToExecute) {
      const job = await this.createCleanupJob(policy);
      jobs.push(job);
      
      try {
        await this.executeCleanupJob(job, policy);
      } catch (error) {
        job.status = 'failed';
        job.errors.push(`Cleanup failed: ${error.message}`);
      }
    }

    return jobs;
  }

  /**
   * Create a new cleanup job
   */
  private async createCleanupJob(policy: RetentionPolicy): Promise<CleanupJob> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_days);

    const job: CleanupJob = {
      job_id: `cleanup_${policy.name}_${Date.now()}`,
      created_at: new Date().toISOString(),
      policy_name: policy.name,
      status: 'pending',
      target_date_range: {
        start_date: '2020-01-01T00:00:00Z', // Start from beginning
        end_date: cutoffDate.toISOString()
      },
      estimated_records: 0,
      processed_records: 0,
      deleted_records: 0,
      archived_records: 0,
      errors: []
    };

    return job;
  }

  /**
   * Execute a specific cleanup job
   */
  private async executeCleanupJob(job: CleanupJob, policy: RetentionPolicy): Promise<void> {
    job.status = 'running';

    switch (policy.data_type) {
      case 'ai_logs':
        await this.cleanupAILogs(job, policy);
        break;
      case 'audit_logs':
        await this.cleanupAuditLogs(job, policy);
        break;
      case 'user_data':
        await this.cleanupUserData(job, policy);
        break;
      case 'system_logs':
        await this.cleanupSystemLogs(job, policy);
        break;
    }

    job.status = 'completed';
    job.completion_time = new Date().toISOString();

    // Notify stakeholders if required
    if (policy.cleanup_actions.notify_stakeholders) {
      await this.notifyStakeholders(job, policy);
    }
  }

  /**
   * Cleanup AI operation logs from DynamoDB
   */
  private async cleanupAILogs(job: CleanupJob, policy: RetentionPolicy): Promise<void> {
    const tableName = process.env.BEDROCK_LOGS_TABLE || 'bedrock_agent_logs';
    
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: '#timestamp < :cutoff_date',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: marshall({
        ':cutoff_date': job.target_date_range.end_date
      })
    });

    const result = await this.dynamoClient.send(scanCommand);
    const items = result.Items?.map(item => unmarshall(item)) || [];
    
    job.estimated_records = items.length;

    for (const item of items) {
      try {
        // Archive if required
        if (policy.archive_before_deletion) {
          await this.archiveRecord(item, policy);
          job.archived_records++;
        }

        // Delete from DynamoDB
        const deleteCommand = new DeleteItemCommand({
          TableName: tableName,
          Key: marshall({
            operation_id: item.operation_id,
            timestamp: item.timestamp
          })
        });

        await this.dynamoClient.send(deleteCommand);
        job.deleted_records++;
        job.processed_records++;

      } catch (error) {
        job.errors.push(`Failed to process record ${item.operation_id}: ${error.message}`);
      }
    }
  }

  /**
   * Cleanup audit logs
   */
  private async cleanupAuditLogs(job: CleanupJob, policy: RetentionPolicy): Promise<void> {
    const tableName = process.env.AUDIT_TRAIL_TABLE || 'bedrock_audit_trail';
    
    // Similar implementation to cleanupAILogs but for audit table
    // Note: Audit logs have longer retention and special handling
    
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: '#timestamp < :cutoff_date',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: marshall({
        ':cutoff_date': job.target_date_range.end_date
      })
    });

    const result = await this.dynamoClient.send(scanCommand);
    const items = result.Items?.map(item => unmarshall(item)) || [];
    
    job.estimated_records = items.length;

    // For audit logs, we typically only archive, not delete
    for (const item of items) {
      try {
        await this.archiveRecord(item, policy);
        job.archived_records++;
        job.processed_records++;
      } catch (error) {
        job.errors.push(`Failed to archive audit record ${item.audit_id}: ${error.message}`);
      }
    }
  }

  /**
   * Cleanup user interaction data
   */
  private async cleanupUserData(job: CleanupJob, policy: RetentionPolicy): Promise<void> {
    // Implementation for user data cleanup
    // This would involve multiple tables and careful handling of GDPR requirements
    job.processed_records = 0; // Placeholder
  }

  /**
   * Cleanup CloudWatch system logs
   */
  private async cleanupSystemLogs(job: CleanupJob, policy: RetentionPolicy): Promise<void> {
    // Set retention policy on CloudWatch log groups
    const logGroups = [
      '/aws/lambda/bedrock-agent',
      '/aws/lambda/web-proxy',
      '/aws/lambda/s3-upload-processor'
    ];

    for (const logGroupName of logGroups) {
      try {
        const command = new PutRetentionPolicyCommand({
          logGroupName,
          retentionInDays: policy.retention_days
        });

        await this.cloudWatchClient.send(command);
        job.processed_records++;
      } catch (error) {
        job.errors.push(`Failed to set retention for ${logGroupName}: ${error.message}`);
      }
    }
  }

  /**
   * Archive record to S3
   */
  private async archiveRecord(record: any, policy: RetentionPolicy): Promise<void> {
    if (!policy.archive_location) return;

    const archiveKey = `${policy.name}/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${record.operation_id || record.audit_id || Date.now()}.json`;
    
    let content = JSON.stringify(record);
    
    // Anonymize if required
    if (policy.cleanup_actions.anonymize) {
      content = this.anonymizeRecord(content);
    }

    const putCommand = new PutObjectCommand({
      Bucket: policy.archive_location.replace('s3://', '').split('/')[0],
      Key: archiveKey,
      Body: content,
      ServerSideEncryption: policy.cleanup_actions.encrypt_archive ? 'AES256' : undefined,
      Metadata: {
        'retention-policy': policy.name,
        'archived-at': new Date().toISOString(),
        'original-timestamp': record.timestamp || new Date().toISOString()
      }
    });

    await this.s3Client.send(putCommand);
  }

  /**
   * Anonymize record content
   */
  private anonymizeRecord(content: string): string {
    // Simple anonymization - replace common PII patterns
    return content
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_ANONYMIZED]')
      .replace(/\b\d{11}\b/g, '[ID_ANONYMIZED]')
      .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_ANONYMIZED]');
  }

  /**
   * Notify stakeholders about cleanup completion
   */
  private async notifyStakeholders(job: CleanupJob, policy: RetentionPolicy): Promise<void> {
    const notification = {
      subject: `Log Cleanup Completed: ${policy.name}`,
      message: `
        Cleanup job ${job.job_id} has been completed.
        
        Policy: ${policy.name}
        Status: ${job.status}
        Records Processed: ${job.processed_records}
        Records Deleted: ${job.deleted_records}
        Records Archived: ${job.archived_records}
        Errors: ${job.errors.length}
        
        Completion Time: ${job.completion_time}
      `,
      metadata: {
        job_id: job.job_id,
        policy_name: policy.name,
        completion_status: job.status
      }
    };

    // In a real implementation, this would send notifications via SNS, email, or Slack
    console.log('CLEANUP_NOTIFICATION:', notification);
  }

  /**
   * Get retention policy by name
   */
  getRetentionPolicy(name: string): RetentionPolicy | undefined {
    return this.retentionPolicies.find(p => p.name === name);
  }

  /**
   * List all retention policies
   */
  listRetentionPolicies(): RetentionPolicy[] {
    return [...this.retentionPolicies];
  }

  /**
   * Add custom retention policy
   */
  addRetentionPolicy(policy: RetentionPolicy): void {
    this.retentionPolicies.push(policy);
  }

  /**
   * Update retention policy
   */
  updateRetentionPolicy(name: string, updates: Partial<RetentionPolicy>): boolean {
    const index = this.retentionPolicies.findIndex(p => p.name === name);
    if (index === -1) return false;

    this.retentionPolicies[index] = { ...this.retentionPolicies[index], ...updates };
    return true;
  }

  /**
   * Get cleanup job status
   */
  async getCleanupJobStatus(jobId: string): Promise<CleanupJob | null> {
    // In a real implementation, this would query a jobs table
    return null;
  }

  /**
   * Schedule automatic cleanup
   */
  async scheduleAutomaticCleanup(): Promise<void> {
    // This would set up CloudWatch Events/EventBridge rules
    // to trigger cleanup jobs on a schedule
    console.log('Automatic cleanup scheduling would be implemented here');
  }
}

// Export singleton instance
export const logRetentionSystem = new LogRetentionSystem();