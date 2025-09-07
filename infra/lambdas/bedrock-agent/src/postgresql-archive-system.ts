/**
 * PostgreSQL Archive System for GDPR Compliance
 * 
 * Implements long-term archiving of AI operations and audit logs
 * in PostgreSQL with proper encryption and anonymization.
 */

import { Pool, PoolClient } from 'pg';
import { createHash, randomBytes, createCipher, createDecipher } from 'crypto';

export interface ArchiveRecord {
  archive_id: string;
  original_id: string;
  record_type: 'ai_operation' | 'audit_event' | 'user_consent' | 'data_access';
  timestamp: string;
  archived_at: string;
  data_hash: string;
  encrypted_data: string;
  anonymization_level: 'none' | 'partial' | 'full';
  retention_until: string;
  compliance_metadata: {
    gdpr_article?: string;
    legal_basis: string;
    data_subject_rights: string[];
    processing_purpose: string;
  };
  access_log: {
    created_by: string;
    accessed_count: number;
    last_accessed?: string;
    access_reason?: string;
  };
}

export interface DataSubjectRequest {
  request_id: string;
  request_type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  data_subject_id: string;
  requested_at: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  completion_deadline: string;
  records_found: number;
  actions_taken: string[];
  response_data?: any;
}

export class PostgreSQLArchiveSystem {
  private pool: Pool;
  private encryptionKey: string;

  constructor() {
    this.pool = new Pool({
      host: process.env.RDS_HOST,
      port: parseInt(process.env.RDS_PORT || '5432'),
      database: process.env.RDS_DATABASE,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.encryptionKey = process.env.ARCHIVE_ENCRYPTION_KEY || this.generateEncryptionKey();
    this.initializeSchema();
  }

  /**
   * Initialize database schema for archiving
   */
  private async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Create archive tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_action_logs (
          archive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          original_id VARCHAR(255) NOT NULL,
          record_type VARCHAR(50) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          archived_at TIMESTAMPTZ DEFAULT NOW(),
          data_hash VARCHAR(64) NOT NULL,
          encrypted_data TEXT NOT NULL,
          anonymization_level VARCHAR(20) DEFAULT 'none',
          retention_until TIMESTAMPTZ NOT NULL,
          compliance_metadata JSONB NOT NULL DEFAULT '{}',
          access_log JSONB NOT NULL DEFAULT '{"created_by": "system", "accessed_count": 0}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_ai_action_logs_original_id ON ai_action_logs(original_id);
        CREATE INDEX IF NOT EXISTS idx_ai_action_logs_timestamp ON ai_action_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_ai_action_logs_record_type ON ai_action_logs(record_type);
        CREATE INDEX IF NOT EXISTS idx_ai_action_logs_retention ON ai_action_logs(retention_until);
      `);

      // Create data subject requests table
      await client.query(`
        CREATE TABLE IF NOT EXISTS data_subject_requests (
          request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_type VARCHAR(50) NOT NULL,
          data_subject_id VARCHAR(255) NOT NULL,
          requested_at TIMESTAMPTZ DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'pending',
          completion_deadline TIMESTAMPTZ NOT NULL,
          records_found INTEGER DEFAULT 0,
          actions_taken TEXT[] DEFAULT '{}',
          response_data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_data_subject_requests_subject_id ON data_subject_requests(data_subject_id);
        CREATE INDEX IF NOT EXISTS idx_data_subject_requests_status ON data_subject_requests(status);
        CREATE INDEX IF NOT EXISTS idx_data_subject_requests_deadline ON data_subject_requests(completion_deadline);
      `);

      // Create user consent tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_consent_tracking (
          consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(255) NOT NULL,
          consent_type VARCHAR(100) NOT NULL,
          granted BOOLEAN NOT NULL,
          granted_at TIMESTAMPTZ DEFAULT NOW(),
          withdrawn_at TIMESTAMPTZ,
          ip_address INET,
          user_agent TEXT,
          legal_basis VARCHAR(100),
          processing_purposes TEXT[],
          data_categories TEXT[],
          retention_period INTEGER, -- days
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_consent_user_id ON user_consent_tracking(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_consent_type ON user_consent_tracking(consent_type);
        CREATE INDEX IF NOT EXISTS idx_user_consent_granted ON user_consent_tracking(granted);
      `);

    } finally {
      client.release();
    }
  }

  /**
   * Archive AI operation record
   */
  async archiveAIOperation(record: {
    operation_id: string;
    timestamp: string;
    operation_type: string;
    user_id?: string;
    provider: string;
    token_usage: any;
    execution_time_ms: number;
    status: string;
    pii_detected: boolean;
    compliance_flags: any;
  }): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      const archiveRecord: ArchiveRecord = {
        archive_id: '', // Will be generated by DB
        original_id: record.operation_id,
        record_type: 'ai_operation',
        timestamp: record.timestamp,
        archived_at: new Date().toISOString(),
        data_hash: this.generateDataHash(record),
        encrypted_data: this.encryptData(JSON.stringify(record)),
        anonymization_level: record.pii_detected ? 'partial' : 'none',
        retention_until: this.calculateRetentionDate(365), // 1 year for AI operations
        compliance_metadata: {
          gdpr_article: 'Article 6(1)(f) - Legitimate interests',
          legal_basis: 'Business optimization and service improvement',
          data_subject_rights: ['access', 'rectification', 'erasure', 'portability'],
          processing_purpose: 'AI-powered business analysis and recommendations'
        },
        access_log: {
          created_by: 'bedrock-agent',
          accessed_count: 0
        }
      };

      const query = `
        INSERT INTO ai_action_logs (
          original_id, record_type, timestamp, data_hash, encrypted_data,
          anonymization_level, retention_until, compliance_metadata, access_log
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING archive_id
      `;

      const values = [
        archiveRecord.original_id,
        archiveRecord.record_type,
        archiveRecord.timestamp,
        archiveRecord.data_hash,
        archiveRecord.encrypted_data,
        archiveRecord.anonymization_level,
        archiveRecord.retention_until,
        JSON.stringify(archiveRecord.compliance_metadata),
        JSON.stringify(archiveRecord.access_log)
      ];

      const result = await client.query(query, values);
      return result.rows[0].archive_id;

    } finally {
      client.release();
    }
  }

  /**
   * Handle data subject access request (GDPR Article 15)
   */
  async handleDataSubjectAccessRequest(dataSubjectId: string): Promise<DataSubjectRequest> {
    const client = await this.pool.connect();
    
    try {
      // Create request record
      const requestId = await this.createDataSubjectRequest({
        request_type: 'access',
        data_subject_id: dataSubjectId,
        completion_deadline: this.calculateDeadline(30) // 30 days for access requests
      });

      // Find all records for this data subject
      const query = `
        SELECT archive_id, original_id, record_type, timestamp, anonymization_level,
               compliance_metadata, encrypted_data
        FROM ai_action_logs 
        WHERE encrypted_data LIKE $1 OR compliance_metadata->>'data_subject_id' = $2
      `;

      const result = await client.query(query, [`%${dataSubjectId}%`, dataSubjectId]);
      const records = result.rows;

      // Decrypt and compile response data
      const responseData = {
        data_subject_id: dataSubjectId,
        records_found: records.length,
        processing_activities: records.map(record => ({
          activity_id: record.archive_id,
          original_id: record.original_id,
          type: record.record_type,
          timestamp: record.timestamp,
          legal_basis: record.compliance_metadata.legal_basis,
          processing_purpose: record.compliance_metadata.processing_purpose,
          data_categories: this.extractDataCategories(record.encrypted_data),
          retention_period: record.compliance_metadata.retention_period
        })),
        your_rights: [
          'Right to rectification (Article 16)',
          'Right to erasure (Article 17)',
          'Right to restrict processing (Article 18)',
          'Right to data portability (Article 20)',
          'Right to object (Article 21)'
        ]
      };

      // Update request with response data
      await client.query(`
        UPDATE data_subject_requests 
        SET status = 'completed', records_found = $1, response_data = $2, 
            actions_taken = array_append(actions_taken, 'Data compiled and provided'),
            updated_at = NOW()
        WHERE request_id = $3
      `, [records.length, JSON.stringify(responseData), requestId]);

      return {
        request_id: requestId,
        request_type: 'access',
        data_subject_id: dataSubjectId,
        requested_at: new Date().toISOString(),
        status: 'completed',
        completion_deadline: this.calculateDeadline(30),
        records_found: records.length,
        actions_taken: ['Data compiled and provided'],
        response_data: responseData
      };

    } finally {
      client.release();
    }
  }

  /**
   * Handle data subject erasure request (GDPR Article 17)
   */
  async handleDataSubjectErasureRequest(dataSubjectId: string, reason: string): Promise<DataSubjectRequest> {
    const client = await this.pool.connect();
    
    try {
      const requestId = await this.createDataSubjectRequest({
        request_type: 'erasure',
        data_subject_id: dataSubjectId,
        completion_deadline: this.calculateDeadline(30)
      });

      // Find records to be erased
      const findQuery = `
        SELECT archive_id, original_id, record_type, compliance_metadata
        FROM ai_action_logs 
        WHERE encrypted_data LIKE $1 OR compliance_metadata->>'data_subject_id' = $2
      `;

      const records = await client.query(findQuery, [`%${dataSubjectId}%`, dataSubjectId]);
      const recordsToErase = records.rows;

      let erasedCount = 0;
      const actionsTaken: string[] = [];

      for (const record of recordsToErase) {
        // Check if erasure is legally required or if there are legitimate grounds to retain
        const canErase = this.canEraseRecord(record, reason);
        
        if (canErase) {
          // Anonymize instead of delete to maintain audit trail
          await client.query(`
            UPDATE ai_action_logs 
            SET encrypted_data = $1, anonymization_level = 'full',
                access_log = jsonb_set(access_log, '{erasure_requested}', 'true'),
                updated_at = NOW()
            WHERE archive_id = $2
          `, [this.encryptData('ERASED_BY_DATA_SUBJECT_REQUEST'), record.archive_id]);
          
          erasedCount++;
          actionsTaken.push(`Anonymized record ${record.original_id}`);
        } else {
          actionsTaken.push(`Retained record ${record.original_id} - legal obligation`);
        }
      }

      // Update request status
      await client.query(`
        UPDATE data_subject_requests 
        SET status = 'completed', records_found = $1, 
            actions_taken = $2, updated_at = NOW()
        WHERE request_id = $3
      `, [recordsToErase.length, actionsTaken, requestId]);

      return {
        request_id: requestId,
        request_type: 'erasure',
        data_subject_id: dataSubjectId,
        requested_at: new Date().toISOString(),
        status: 'completed',
        completion_deadline: this.calculateDeadline(30),
        records_found: recordsToErase.length,
        actions_taken: actionsTaken
      };

    } finally {
      client.release();
    }
  }

  /**
   * Track user consent
   */
  async trackUserConsent(consent: {
    user_id: string;
    consent_type: string;
    granted: boolean;
    ip_address?: string;
    user_agent?: string;
    legal_basis?: string;
    processing_purposes?: string[];
    data_categories?: string[];
    retention_period?: number;
  }): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO user_consent_tracking (
          user_id, consent_type, granted, ip_address, user_agent,
          legal_basis, processing_purposes, data_categories, retention_period
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING consent_id
      `;

      const values = [
        consent.user_id,
        consent.consent_type,
        consent.granted,
        consent.ip_address,
        consent.user_agent,
        consent.legal_basis || 'Article 6(1)(a) - Consent',
        consent.processing_purposes || [],
        consent.data_categories || [],
        consent.retention_period || 365
      ];

      const result = await client.query(query, values);
      return result.rows[0].consent_id;

    } finally {
      client.release();
    }
  }

  /**
   * Get consent status for user
   */
  async getUserConsentStatus(userId: string): Promise<any[]> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT consent_type, granted, granted_at, withdrawn_at, legal_basis,
               processing_purposes, data_categories, retention_period
        FROM user_consent_tracking 
        WHERE user_id = $1 
        ORDER BY granted_at DESC
      `;

      const result = await client.query(query, [userId]);
      return result.rows;

    } finally {
      client.release();
    }
  }

  /**
   * Cleanup expired records
   */
  async cleanupExpiredRecords(): Promise<{ deleted_count: number; anonymized_count: number }> {
    const client = await this.pool.connect();
    
    try {
      // Anonymize expired records instead of deleting for audit purposes
      const anonymizeQuery = `
        UPDATE ai_action_logs 
        SET encrypted_data = $1, anonymization_level = 'full',
            access_log = jsonb_set(access_log, '{auto_anonymized}', 'true'),
            updated_at = NOW()
        WHERE retention_until < NOW() AND anonymization_level != 'full'
        RETURNING archive_id
      `;

      const anonymizeResult = await client.query(anonymizeQuery, [
        this.encryptData('ANONYMIZED_EXPIRED_RECORD')
      ]);

      return {
        deleted_count: 0, // We don't delete, only anonymize
        anonymized_count: anonymizeResult.rows.length
      };

    } finally {
      client.release();
    }
  }

  /**
   * Private helper methods
   */
  private async createDataSubjectRequest(request: {
    request_type: string;
    data_subject_id: string;
    completion_deadline: string;
  }): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO data_subject_requests (request_type, data_subject_id, completion_deadline)
        VALUES ($1, $2, $3)
        RETURNING request_id
      `;

      const result = await client.query(query, [
        request.request_type,
        request.data_subject_id,
        request.completion_deadline
      ]);

      return result.rows[0].request_id;
    } finally {
      client.release();
    }
  }

  private generateDataHash(data: any): string {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private encryptData(data: string): string {
    const cipher = createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptData(encryptedData: string): string {
    const decipher = createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
  }

  private calculateRetentionDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  private calculateDeadline(days: number): string {
    return this.calculateRetentionDate(days);
  }

  private canEraseRecord(record: any, reason: string): boolean {
    // Implement business logic for determining if a record can be erased
    // Consider legal obligations, legitimate interests, etc.
    const metadata = record.compliance_metadata;
    
    // Always retain audit logs for legal compliance
    if (record.record_type === 'audit_event') {
      return false;
    }

    // Check if there's a legal obligation to retain
    if (metadata.legal_basis?.includes('legal obligation')) {
      return false;
    }

    return true;
  }

  private extractDataCategories(encryptedData: string): string[] {
    // This would analyze the decrypted data to categorize it
    // For now, return generic categories
    return ['usage_data', 'technical_data', 'preference_data'];
  }
}

// Export singleton instance
export const postgresArchiveSystem = new PostgreSQLArchiveSystem();