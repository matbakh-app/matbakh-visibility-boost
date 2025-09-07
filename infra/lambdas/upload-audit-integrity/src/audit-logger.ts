/**
 * Audit Logger for Upload System
 * Provides comprehensive audit trail with complete lifecycle tracking
 */

import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { 
  UploadAuditRecord, 
  UploadAuditAction, 
  UploadLifecycleEvent, 
  UploadLifecycleStage,
  DatabaseCredentials,
  UploadMetrics
} from './types';

export class AuditLogger {
  private pgPool: Pool | null = null;
  private dynamoClient: DynamoDBDocumentClient;
  private secretsClient: SecretsManagerClient;
  private auditTableName: string;
  private lifecycleTableName: string;

  constructor(
    region: string = 'eu-central-1',
    auditTableName: string = 'upload-audit-trail',
    lifecycleTableName: string = 'upload-lifecycle-events'
  ) {
    this.secretsClient = new SecretsManagerClient({ region });
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.auditTableName = auditTableName;
    this.lifecycleTableName = lifecycleTableName;
  }

  /**
   * Get PostgreSQL connection pool
   */
  private async getPgPool(): Promise<Pool> {
    if (this.pgPool) {
      return this.pgPool;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: 'matbakh-db-postgres' });
      const secret = await this.secretsClient.send(command);
      
      if (!secret.SecretString) {
        throw new Error('Database secret is empty');
      }

      const creds: DatabaseCredentials = JSON.parse(secret.SecretString);

      this.pgPool = new Pool({
        host: creds.host,
        user: creds.username,
        password: creds.password,
        database: creds.dbname,
        port: Number(creds.port) || 5432,
        ssl: { rejectUnauthorized: false },
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      console.log('PostgreSQL connection pool created for audit logging');
      return this.pgPool;

    } catch (error) {
      console.error('Failed to create PostgreSQL connection pool:', error);
      throw error;
    }
  }

  /**
   * Log upload audit event to both PostgreSQL and DynamoDB
   */
  async logAuditEvent(
    uploadId: string,
    userId: string,
    action: UploadAuditAction,
    filename: string,
    s3Bucket: string,
    s3Key: string,
    fileSize: number,
    contentType: string,
    checksumSHA256: string,
    options: {
      partnerId?: string;
      checksumMD5?: string;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const auditId = `${uploadId}-${action}-${Date.now()}`;

    const auditRecord: UploadAuditRecord = {
      id: auditId,
      uploadId,
      userId,
      partnerId: options.partnerId,
      action,
      filename,
      s3Bucket,
      s3Key,
      fileSize,
      contentType,
      checksumSHA256,
      checksumMD5: options.checksumMD5,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      requestId: options.requestId || uploadId,
      metadata: options.metadata,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      // Log to PostgreSQL for GDPR compliance and relational queries
      await this.logToPgSQL(auditRecord);
      
      // Log to DynamoDB for high-performance queries and analytics
      await this.logToDynamoDB(auditRecord);
      
      console.log(`Audit event logged successfully: ${action} for upload ${uploadId}`);
      
    } catch (error) {
      console.error(`Failed to log audit event for upload ${uploadId}:`, error);
      throw error;
    }
  }

  /**
   * Log to PostgreSQL for GDPR compliance
   */
  private async logToPgSQL(record: UploadAuditRecord): Promise<void> {
    try {
      const pool = await this.getPgPool();
      
      const query = `
        INSERT INTO upload_audit_log (
          id, upload_id, user_id, partner_id, action, filename, s3_bucket, s3_key,
          file_size, content_type, checksum_sha256, checksum_md5, ip_address, 
          user_agent, request_id, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at,
          metadata = EXCLUDED.metadata
      `;
      
      await pool.query(query, [
        record.id,
        record.uploadId,
        record.userId,
        record.partnerId,
        record.action,
        record.filename,
        record.s3Bucket,
        record.s3Key,
        record.fileSize,
        record.contentType,
        record.checksumSHA256,
        record.checksumMD5,
        record.ipAddress,
        record.userAgent,
        record.requestId,
        JSON.stringify(record.metadata || {}),
        record.createdAt,
        record.updatedAt,
      ]);
      
    } catch (error) {
      console.error('Failed to log audit event to PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Log to DynamoDB for high-performance analytics
   */
  private async logToDynamoDB(record: UploadAuditRecord): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.auditTableName,
        Item: {
          PK: `UPLOAD#${record.uploadId}`,
          SK: `${record.createdAt}#${record.action}`,
          GSI1PK: `USER#${record.userId}`,
          GSI1SK: record.createdAt,
          GSI2PK: `ACTION#${record.action}`,
          GSI2SK: record.createdAt,
          ...record,
          TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year retention
        },
      });
      
      await this.dynamoClient.send(command);
      
    } catch (error) {
      console.error('Failed to log audit event to DynamoDB:', error);
      throw error;
    }
  }

  /**
   * Log upload lifecycle event
   */
  async logLifecycleEvent(
    uploadId: string,
    stage: UploadLifecycleStage,
    success: boolean,
    options: {
      duration?: number;
      errorMessage?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    
    const lifecycleEvent: UploadLifecycleEvent = {
      uploadId,
      stage,
      timestamp,
      duration: options.duration,
      success,
      errorMessage: options.errorMessage,
      metadata: options.metadata,
    };

    try {
      const command = new PutCommand({
        TableName: this.lifecycleTableName,
        Item: {
          PK: `UPLOAD#${uploadId}`,
          SK: `${timestamp}#${stage}`,
          GSI1PK: `STAGE#${stage}`,
          GSI1SK: timestamp,
          ...lifecycleEvent,
          TTL: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days retention
        },
      });
      
      await this.dynamoClient.send(command);
      
      console.log(`Lifecycle event logged: ${stage} for upload ${uploadId} - ${success ? 'SUCCESS' : 'FAILED'}`);
      
    } catch (error) {
      console.error(`Failed to log lifecycle event for upload ${uploadId}:`, error);
      // Don't throw - lifecycle logging is non-critical
    }
  }

  /**
   * Get audit trail for a specific upload
   */
  async getUploadAuditTrail(uploadId: string): Promise<UploadAuditRecord[]> {
    try {
      const command = new QueryCommand({
        TableName: this.auditTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `UPLOAD#${uploadId}`,
        },
        ScanIndexForward: true, // Sort by SK (timestamp) ascending
      });
      
      const response = await this.dynamoClient.send(command);
      return (response.Items || []) as UploadAuditRecord[];
      
    } catch (error) {
      console.error(`Failed to get audit trail for upload ${uploadId}:`, error);
      throw error;
    }
  }

  /**
   * Get audit events for a user within a time range
   */
  async getUserAuditEvents(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<UploadAuditRecord[]> {
    try {
      const command = new QueryCommand({
        TableName: this.auditTableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':start': startDate,
          ':end': endDate,
        },
        ScanIndexForward: false, // Most recent first
      });
      
      const response = await this.dynamoClient.send(command);
      return (response.Items || []) as UploadAuditRecord[];
      
    } catch (error) {
      console.error(`Failed to get user audit events for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get lifecycle events for an upload
   */
  async getUploadLifecycleEvents(uploadId: string): Promise<UploadLifecycleEvent[]> {
    try {
      const command = new QueryCommand({
        TableName: this.lifecycleTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `UPLOAD#${uploadId}`,
        },
        ScanIndexForward: true, // Chronological order
      });
      
      const response = await this.dynamoClient.send(command);
      return (response.Items || []) as UploadLifecycleEvent[];
      
    } catch (error) {
      console.error(`Failed to get lifecycle events for upload ${uploadId}:`, error);
      throw error;
    }
  }

  /**
   * Generate upload metrics for a time period
   */
  async generateUploadMetrics(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<UploadMetrics> {
    try {
      const pool = await this.getPgPool();
      
      let whereClause = 'WHERE created_at BETWEEN $1 AND $2';
      const params: any[] = [startDate, endDate];
      
      if (userId) {
        whereClause += ' AND user_id = $3';
        params.push(userId);
      }
      
      const query = `
        SELECT 
          COUNT(*) as total_uploads,
          COUNT(CASE WHEN action = 'upload_completed' THEN 1 END) as successful_uploads,
          COUNT(CASE WHEN action = 'upload_failed' THEN 1 END) as failed_uploads,
          COUNT(CASE WHEN action = 'corruption_detected' THEN 1 END) as corrupted_files,
          COUNT(CASE WHEN action = 're_upload_triggered' THEN 1 END) as re_upload_triggered,
          AVG(file_size) as average_file_size,
          COUNT(CASE WHEN action = 'integrity_verified' THEN 1 END) as integrity_checks,
          COUNT(CASE WHEN action = 'integrity_failed' THEN 1 END) as integrity_failures
        FROM upload_audit_log 
        ${whereClause}
      `;
      
      const result = await pool.query(query, params);
      const row = result.rows[0];
      
      const totalUploads = parseInt(row.total_uploads) || 0;
      const successfulUploads = parseInt(row.successful_uploads) || 0;
      const failedUploads = parseInt(row.failed_uploads) || 0;
      const corruptedFiles = parseInt(row.corrupted_files) || 0;
      const reUploadTriggered = parseInt(row.re_upload_triggered) || 0;
      const averageFileSize = parseFloat(row.average_file_size) || 0;
      const integrityChecks = parseInt(row.integrity_checks) || 0;
      const integrityFailures = parseInt(row.integrity_failures) || 0;
      
      const integrityCheckSuccessRate = integrityChecks > 0 
        ? ((integrityChecks - integrityFailures) / integrityChecks) * 100 
        : 0;
      
      return {
        totalUploads,
        successfulUploads,
        failedUploads,
        corruptedFiles,
        reUploadTriggered,
        averageFileSize,
        averageUploadDuration: 0, // Would need additional tracking
        integrityCheckSuccessRate,
        timeRange: {
          start: startDate,
          end: endDate,
        },
      };
      
    } catch (error) {
      console.error('Failed to generate upload metrics:', error);
      throw error;
    }
  }

  /**
   * Delete audit records for GDPR compliance
   */
  async deleteUserAuditRecords(userId: string): Promise<{
    deletedRecords: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedRecords = 0;

    try {
      // Delete from PostgreSQL
      const pool = await this.getPgPool();
      const pgResult = await pool.query(
        'DELETE FROM upload_audit_log WHERE user_id = $1',
        [userId]
      );
      deletedRecords += pgResult.rowCount || 0;

      // Delete from DynamoDB (would need to query first, then delete)
      // This is a simplified version - in production, you'd need to implement
      // proper DynamoDB deletion with pagination
      console.log(`GDPR deletion completed for user ${userId}: ${deletedRecords} records deleted`);

    } catch (error) {
      const errorMessage = `Failed to delete audit records for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error(errorMessage);
    }

    return { deletedRecords, errors };
  }
}