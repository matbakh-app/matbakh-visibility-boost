import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { 
  QuarantineRecord, 
  ValidationViolation, 
  DatabaseCredentials,
  FileValidationResult 
} from './types';

/**
 * Quarantine management system for non-compliant files
 */
export class QuarantineManager {
  private s3Client: S3Client;
  private dbPool: Pool | null = null;
  private secretsClient: SecretsManagerClient;
  private quarantineBucket: string;

  constructor(quarantineBucket: string = 'matbakh-quarantine-files') {
    this.s3Client = new S3Client({ region: 'eu-central-1' });
    this.secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });
    this.quarantineBucket = quarantineBucket;
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    if (this.dbPool) return;

    try {
      const command = new GetSecretValueCommand({ SecretId: 'matbakh-db-postgres' });
      const secret = await this.secretsClient.send(command);
      
      if (!secret.SecretString) {
        throw new Error('Database secret string is empty');
      }

      const creds: DatabaseCredentials = JSON.parse(secret.SecretString);

      this.dbPool = new Pool({
        host: creds.host,
        user: creds.username,
        password: creds.password,
        database: creds.dbname,
        port: Number(creds.port) || 5432,
        ssl: { rejectUnauthorized: false },
        max: 5,
        min: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Ensure quarantine tables exist
      await this.ensureQuarantineTables();
      
      console.log('Quarantine manager initialized');
    } catch (error) {
      console.error('Failed to initialize quarantine manager:', error);
      throw error;
    }
  }

  /**
   * Quarantine a file that failed validation
   */
  async quarantineFile(
    fileBuffer: Buffer,
    fileName: string,
    originalPath: string,
    userId: string | undefined,
    validationResult: FileValidationResult,
    reason: string
  ): Promise<string> {
    if (!this.dbPool) {
      await this.initialize();
    }

    const quarantineId = this.generateQuarantineId();
    const quarantinePath = `quarantine/${new Date().toISOString().split('T')[0]}/${quarantineId}/${fileName}`;

    try {
      // Store file in quarantine S3 bucket
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.quarantineBucket,
        Key: quarantinePath,
        Body: fileBuffer,
        ServerSideEncryption: 'AES256',
        Metadata: {
          originalFileName: fileName,
          originalPath: originalPath,
          quarantineReason: reason,
          riskLevel: validationResult.riskLevel,
          userId: userId || 'anonymous',
          quarantinedAt: new Date().toISOString()
        },
        Tagging: `Status=quarantined&RiskLevel=${validationResult.riskLevel}&ReviewRequired=true`
      }));

      // Create quarantine record in database
      const quarantineRecord: QuarantineRecord = {
        id: quarantineId,
        fileName,
        originalPath,
        quarantinePath,
        userId,
        reason,
        violations: validationResult.violations,
        quarantinedAt: new Date(),
        reviewRequired: this.requiresManualReview(validationResult),
        status: 'quarantined',
        metadata: {
          fileSize: validationResult.size,
          fileType: validationResult.fileType,
          mimeType: validationResult.mimeType,
          riskLevel: validationResult.riskLevel,
          piiCount: validationResult.piiDetected.length,
          violationCount: validationResult.violations.length
        }
      };

      await this.storeQuarantineRecord(quarantineRecord);

      // Log quarantine event
      console.log(`File quarantined: ${quarantineId}`, {
        fileName,
        reason,
        riskLevel: validationResult.riskLevel,
        violationCount: validationResult.violations.length
      });

      return quarantineId;
    } catch (error) {
      console.error('Failed to quarantine file:', error);
      throw error;
    }
  }

  /**
   * Review quarantined file (approve/reject)
   */
  async reviewQuarantinedFile(
    quarantineId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected',
    reviewNotes?: string
  ): Promise<void> {
    if (!this.dbPool) {
      await this.initialize();
    }

    try {
      // Get quarantine record
      const record = await this.getQuarantineRecord(quarantineId);
      if (!record) {
        throw new Error(`Quarantine record not found: ${quarantineId}`);
      }

      // Update record status
      const query = `
        UPDATE public.quarantine_records 
        SET 
          status = $2,
          reviewed_by = $3,
          reviewed_at = now(),
          metadata = metadata || $4
        WHERE id = $1
      `;

      const reviewMetadata = {
        reviewNotes,
        reviewDecision: decision,
        reviewedAt: new Date().toISOString()
      };

      await this.dbPool!.query(query, [
        quarantineId,
        decision,
        reviewerId,
        JSON.stringify(reviewMetadata)
      ]);

      // If approved, move file to appropriate location
      if (decision === 'approved') {
        await this.releaseFromQuarantine(quarantineId, record);
      }

      console.log(`Quarantined file reviewed: ${quarantineId}`, {
        decision,
        reviewerId,
        fileName: record.fileName
      });
    } catch (error) {
      console.error('Failed to review quarantined file:', error);
      throw error;
    }
  }

  /**
   * Get quarantined files for review
   */
  async getQuarantinedFiles(
    status?: 'quarantined' | 'approved' | 'rejected',
    reviewRequired?: boolean,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    records: QuarantineRecord[];
    totalCount: number;
    hasMore: boolean;
  }> {
    if (!this.dbPool) {
      await this.initialize();
    }

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (reviewRequired !== undefined) {
      conditions.push(`review_required = $${paramIndex}`);
      values.push(reviewRequired);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM public.quarantine_records
      WHERE ${whereClause}
    `;

    const countResult = await this.dbPool!.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT 
        id, file_name, original_path, quarantine_path, user_id, reason,
        violations, quarantined_at, review_required, status, reviewed_by,
        reviewed_at, metadata
      FROM public.quarantine_records
      WHERE ${whereClause}
      ORDER BY quarantined_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);
    const dataResult = await this.dbPool!.query(dataQuery, values);

    const records: QuarantineRecord[] = dataResult.rows.map(row => ({
      id: row.id,
      fileName: row.file_name,
      originalPath: row.original_path,
      quarantinePath: row.quarantine_path,
      userId: row.user_id,
      reason: row.reason,
      violations: row.violations || [],
      quarantinedAt: row.quarantined_at,
      reviewRequired: row.review_required,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      metadata: row.metadata || {}
    }));

    return {
      records,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  }

  /**
   * Get quarantine statistics
   */
  async getQuarantineStatistics(): Promise<{
    totalQuarantined: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    byRiskLevel: Record<string, number>;
    byViolationType: Record<string, number>;
  }> {
    if (!this.dbPool) {
      await this.initialize();
    }

    const queries = [
      'SELECT COUNT(*) as total FROM public.quarantine_records',
      'SELECT COUNT(*) as pending FROM public.quarantine_records WHERE status = \'quarantined\' AND review_required = true',
      'SELECT COUNT(*) as approved FROM public.quarantine_records WHERE status = \'approved\'',
      'SELECT COUNT(*) as rejected FROM public.quarantine_records WHERE status = \'rejected\'',
      `SELECT 
         metadata->>'riskLevel' as risk_level, 
         COUNT(*) as count 
       FROM public.quarantine_records 
       WHERE metadata->>'riskLevel' IS NOT NULL
       GROUP BY metadata->>'riskLevel'`,
      `SELECT 
         violation->>'type' as violation_type,
         COUNT(*) as count
       FROM public.quarantine_records,
       jsonb_array_elements(violations) as violation
       GROUP BY violation->>'type'`
    ];

    const results = await Promise.all(
      queries.map(query => this.dbPool!.query(query))
    );

    const [totalResult, pendingResult, approvedResult, rejectedResult, riskLevelResult, violationTypeResult] = results;

    const byRiskLevel: Record<string, number> = {};
    for (const row of riskLevelResult.rows) {
      byRiskLevel[row.risk_level] = parseInt(row.count);
    }

    const byViolationType: Record<string, number> = {};
    for (const row of violationTypeResult.rows) {
      byViolationType[row.violation_type] = parseInt(row.count);
    }

    return {
      totalQuarantined: parseInt(totalResult.rows[0].total),
      pendingReview: parseInt(pendingResult.rows[0].pending),
      approved: parseInt(approvedResult.rows[0].approved),
      rejected: parseInt(rejectedResult.rows[0].rejected),
      byRiskLevel,
      byViolationType
    };
  }

  /**
   * Clean up old quarantine records
   */
  async cleanupOldRecords(retentionDays: number = 90): Promise<number> {
    if (!this.dbPool) {
      await this.initialize();
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // Get records to delete
      const selectQuery = `
        SELECT id, quarantine_path
        FROM public.quarantine_records
        WHERE quarantined_at < $1 AND status IN ('approved', 'rejected')
      `;

      const recordsResult = await this.dbPool!.query(selectQuery, [cutoffDate]);
      const recordsToDelete = recordsResult.rows;

      // Delete files from S3
      for (const record of recordsToDelete) {
        try {
          await this.s3Client.send(new DeleteObjectCommand({
            Bucket: this.quarantineBucket,
            Key: record.quarantine_path
          }));
        } catch (error) {
          console.warn(`Failed to delete quarantine file from S3: ${record.quarantine_path}`, error);
        }
      }

      // Delete database records
      const deleteQuery = `
        DELETE FROM public.quarantine_records
        WHERE quarantined_at < $1 AND status IN ('approved', 'rejected')
      `;

      const deleteResult = await this.dbPool!.query(deleteQuery, [cutoffDate]);
      const deletedCount = deleteResult.rowCount || 0;

      console.log(`Cleaned up ${deletedCount} old quarantine records`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old quarantine records:', error);
      throw error;
    }
  }

  /**
   * Store quarantine record in database
   */
  private async storeQuarantineRecord(record: QuarantineRecord): Promise<void> {
    if (!this.dbPool) {
      throw new Error('Database not initialized');
    }

    const query = `
      INSERT INTO public.quarantine_records (
        id, file_name, original_path, quarantine_path, user_id, reason,
        violations, quarantined_at, review_required, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    const values = [
      record.id,
      record.fileName,
      record.originalPath,
      record.quarantinePath,
      record.userId,
      record.reason,
      JSON.stringify(record.violations),
      record.quarantinedAt,
      record.reviewRequired,
      record.status,
      JSON.stringify(record.metadata)
    ];

    await this.dbPool.query(query, values);
  }

  /**
   * Get quarantine record by ID
   */
  private async getQuarantineRecord(quarantineId: string): Promise<QuarantineRecord | null> {
    if (!this.dbPool) {
      throw new Error('Database not initialized');
    }

    const query = `
      SELECT 
        id, file_name, original_path, quarantine_path, user_id, reason,
        violations, quarantined_at, review_required, status, reviewed_by,
        reviewed_at, metadata
      FROM public.quarantine_records
      WHERE id = $1
    `;

    const result = await this.dbPool.query(query, [quarantineId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      fileName: row.file_name,
      originalPath: row.original_path,
      quarantinePath: row.quarantine_path,
      userId: row.user_id,
      reason: row.reason,
      violations: row.violations || [],
      quarantinedAt: row.quarantined_at,
      reviewRequired: row.review_required,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      metadata: row.metadata || {}
    };
  }

  /**
   * Release file from quarantine (move to appropriate location)
   */
  private async releaseFromQuarantine(quarantineId: string, record: QuarantineRecord): Promise<void> {
    try {
      // Get file from quarantine bucket
      const getCommand = new GetObjectCommand({
        Bucket: this.quarantineBucket,
        Key: record.quarantinePath
      });

      const fileObject = await this.s3Client.send(getCommand);
      
      if (!fileObject.Body) {
        throw new Error('File body is empty');
      }

      const fileBuffer = Buffer.from(await fileObject.Body.transformToByteArray());

      // Move to appropriate production bucket (this would depend on your file organization)
      const productionBucket = 'matbakh-files-uploads'; // or determine based on file type
      const productionKey = record.originalPath || `approved/${quarantineId}/${record.fileName}`;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: productionBucket,
        Key: productionKey,
        Body: fileBuffer,
        ServerSideEncryption: 'AES256',
        Metadata: {
          ...fileObject.Metadata,
          releasedFromQuarantine: 'true',
          quarantineId: quarantineId,
          releasedAt: new Date().toISOString()
        }
      }));

      // Delete from quarantine bucket
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.quarantineBucket,
        Key: record.quarantinePath
      }));

      console.log(`File released from quarantine: ${quarantineId} -> ${productionKey}`);
    } catch (error) {
      console.error('Failed to release file from quarantine:', error);
      throw error;
    }
  }

  /**
   * Ensure quarantine tables exist
   */
  private async ensureQuarantineTables(): Promise<void> {
    if (!this.dbPool) return;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.quarantine_records (
        id UUID PRIMARY KEY,
        file_name TEXT NOT NULL,
        original_path TEXT NOT NULL,
        quarantine_path TEXT NOT NULL,
        user_id UUID,
        reason TEXT NOT NULL,
        violations JSONB NOT NULL DEFAULT '[]',
        quarantined_at TIMESTAMPTZ NOT NULL,
        review_required BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'approved', 'rejected', 'deleted')),
        reviewed_by UUID,
        reviewed_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_quarantine_records_status_review 
        ON public.quarantine_records(status, review_required);
      
      CREATE INDEX IF NOT EXISTS idx_quarantine_records_user_id 
        ON public.quarantine_records(user_id);
      
      CREATE INDEX IF NOT EXISTS idx_quarantine_records_quarantined_at 
        ON public.quarantine_records(quarantined_at DESC);
    `;

    try {
      await this.dbPool.query(createTableQuery);
    } catch (error) {
      console.error('Failed to create quarantine tables:', error);
    }
  }

  /**
   * Generate unique quarantine ID
   */
  private generateQuarantineId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `quar_${timestamp}_${random}`;
  }

  /**
   * Determine if file requires manual review
   */
  private requiresManualReview(validationResult: FileValidationResult): boolean {
    return (
      validationResult.riskLevel === 'critical' ||
      validationResult.riskLevel === 'high' ||
      validationResult.piiDetected.length > 5 ||
      validationResult.violations.some(v => v.type === 'malicious_content')
    );
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.dbPool) {
      await this.dbPool.end();
      this.dbPool = null;
      console.log('Quarantine manager disconnected');
    }
  }
}