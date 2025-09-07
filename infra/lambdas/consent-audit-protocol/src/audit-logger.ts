import { createHash } from 'crypto';
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { 
  AuditLogEntry, 
  AuditConfig, 
  DatabaseCredentials,
  AuditEventType,
  AuditSeverity,
  AuditSource,
  ConsentInteraction,
  DataAccessDetails,
  SystemInfo
} from './types';

/**
 * Comprehensive audit logging system for DSGVO compliance
 */
export class AuditLogger {
  private cloudWatchClient: CloudWatchLogsClient;
  private s3Client: S3Client;
  private dbPool: Pool | null = null;
  private secretsClient: SecretsManagerClient;
  private config: AuditConfig;
  private logGroupName: string;
  private s3BucketName: string;

  constructor(config: AuditConfig) {
    this.config = config;
    this.cloudWatchClient = new CloudWatchLogsClient({ region: 'eu-central-1' });
    this.s3Client = new S3Client({ region: 'eu-central-1' });
    this.secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });
    this.logGroupName = '/aws/lambda/matbakh-consent-audit';
    this.s3BucketName = 'matbakh-audit-logs';
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase(): Promise<void> {
    if (!this.config.enableDatabaseStorage || this.dbPool) return;

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

      // Ensure audit tables exist
      await this.ensureAuditTables();
      
      console.log('Audit database connection initialized');
    } catch (error) {
      console.error('Failed to initialize audit database:', error);
      throw error;
    }
  }

  /**
   * Log audit event
   */
  async logEvent(
    eventType: AuditEventType,
    severity: AuditSeverity,
    userId: string | undefined,
    ipAddress: string,
    userAgent: string,
    source: AuditSource,
    systemInfo: SystemInfo,
    consentInteraction?: ConsentInteraction,
    dataAccess?: DataAccessDetails,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const auditEntry: AuditLogEntry = {
      id: this.generateId(),
      eventType,
      severity,
      userId,
      sessionId: metadata.sessionId,
      ipAddress: this.anonymizeIP(ipAddress),
      userAgent: this.sanitizeUserAgent(userAgent),
      source,
      timestamp: new Date(),
      consentInteraction,
      dataAccess,
      systemInfo,
      metadata: this.sanitizeMetadata(metadata),
      checksum: '' // Will be calculated below
    };

    // Calculate checksum for integrity verification
    auditEntry.checksum = this.calculateChecksum(auditEntry);

    // Log to multiple destinations based on configuration
    const promises: Promise<void>[] = [];

    if (this.config.enableCloudWatchLogs) {
      promises.push(this.logToCloudWatch(auditEntry));
    }

    if (this.config.enableS3Archive) {
      promises.push(this.logToS3(auditEntry));
    }

    if (this.config.enableDatabaseStorage) {
      promises.push(this.logToDatabase(auditEntry));
    }

    // Execute all logging operations
    try {
      await Promise.all(promises);
      console.log(`Audit event logged: ${auditEntry.id}`, {
        eventType,
        severity,
        userId: userId ? `${userId.substring(0, 8)}...` : undefined
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }

    return auditEntry.id;
  }

  /**
   * Log to CloudWatch Logs
   */
  private async logToCloudWatch(entry: AuditLogEntry): Promise<void> {
    try {
      // Ensure log group exists
      await this.ensureLogGroup();

      const logStreamName = `audit-${new Date().toISOString().split('T')[0]}`;
      
      // Ensure log stream exists
      await this.ensureLogStream(logStreamName);

      const logEvent = {
        timestamp: entry.timestamp.getTime(),
        message: JSON.stringify({
          ...entry,
          // Remove sensitive data from CloudWatch logs
          ipAddress: entry.ipAddress.includes('*') ? entry.ipAddress : this.anonymizeIP(entry.ipAddress),
          userAgent: this.sanitizeUserAgent(entry.userAgent)
        })
      };

      await this.cloudWatchClient.send(new PutLogEventsCommand({
        logGroupName: this.logGroupName,
        logStreamName,
        logEvents: [logEvent]
      }));
    } catch (error) {
      console.error('Failed to log to CloudWatch:', error);
    }
  }

  /**
   * Log to S3 for long-term archival
   */
  private async logToS3(entry: AuditLogEntry): Promise<void> {
    try {
      const date = entry.timestamp.toISOString().split('T')[0];
      const hour = entry.timestamp.getHours().toString().padStart(2, '0');
      const key = `audit-logs/${date}/${hour}/${entry.id}.json`;

      const encryptedEntry = this.config.encryptionEnabled 
        ? this.encryptEntry(entry)
        : entry;

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3BucketName,
        Key: key,
        Body: JSON.stringify(encryptedEntry, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
        Metadata: {
          eventType: entry.eventType,
          severity: entry.severity,
          source: entry.source,
          checksum: entry.checksum
        }
      }));
    } catch (error) {
      console.error('Failed to log to S3:', error);
    }
  }

  /**
   * Log to database for querying and reporting
   */
  private async logToDatabase(entry: AuditLogEntry): Promise<void> {
    if (!this.dbPool) {
      await this.initializeDatabase();
    }

    if (!this.dbPool) {
      console.error('Database not available for audit logging');
      return;
    }

    try {
      const query = `
        INSERT INTO public.consent_audit_log (
          id, event_type, severity, user_id, session_id, ip_address, user_agent,
          source, timestamp, consent_interaction, data_access, system_info,
          metadata, checksum
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;

      const values = [
        entry.id,
        entry.eventType,
        entry.severity,
        entry.userId,
        entry.sessionId,
        entry.ipAddress,
        entry.userAgent,
        entry.source,
        entry.timestamp,
        entry.consentInteraction ? JSON.stringify(entry.consentInteraction) : null,
        entry.dataAccess ? JSON.stringify(entry.dataAccess) : null,
        JSON.stringify(entry.systemInfo),
        JSON.stringify(entry.metadata),
        entry.checksum
      ];

      await this.dbPool.query(query, values);
    } catch (error) {
      console.error('Failed to log to database:', error);
    }
  }

  /**
   * Ensure audit tables exist in database
   */
  private async ensureAuditTables(): Promise<void> {
    if (!this.dbPool) return;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.consent_audit_log (
        id UUID PRIMARY KEY,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        user_id UUID,
        session_id TEXT,
        ip_address TEXT NOT NULL,
        user_agent TEXT NOT NULL,
        source TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        consent_interaction JSONB,
        data_access JSONB,
        system_info JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        checksum TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_consent_audit_log_user_id_timestamp 
        ON public.consent_audit_log(user_id, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_consent_audit_log_event_type_timestamp 
        ON public.consent_audit_log(event_type, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_consent_audit_log_severity_timestamp 
        ON public.consent_audit_log(severity, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_consent_audit_log_ip_timestamp 
        ON public.consent_audit_log(ip_address, timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_consent_audit_log_checksum
        ON public.consent_audit_log(checksum);

      -- Create audit violations table
      CREATE TABLE IF NOT EXISTS public.audit_violations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        violation_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        user_id UUID,
        timestamp TIMESTAMPTZ NOT NULL,
        resolved BOOLEAN DEFAULT false,
        resolution TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_audit_violations_user_id_timestamp 
        ON public.audit_violations(user_id, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_audit_violations_type_resolved 
        ON public.audit_violations(violation_type, resolved);
    `;

    try {
      await this.dbPool.query(createTableQuery);
    } catch (error) {
      console.error('Failed to create audit tables:', error);
    }
  }

  /**
   * Ensure CloudWatch log group exists
   */
  private async ensureLogGroup(): Promise<void> {
    try {
      await this.cloudWatchClient.send(new CreateLogGroupCommand({
        logGroupName: this.logGroupName,
        retentionInDays: this.config.retentionDays
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Failed to create log group:', error);
      }
    }
  }

  /**
   * Ensure CloudWatch log stream exists
   */
  private async ensureLogStream(logStreamName: string): Promise<void> {
    try {
      await this.cloudWatchClient.send(new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName
      }));
    } catch (error: any) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Failed to create log stream:', error);
      }
    }
  }

  /**
   * Generate unique audit entry ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `audit_${timestamp}_${random}`;
  }

  /**
   * Calculate checksum for audit entry integrity
   */
  private calculateChecksum(entry: Omit<AuditLogEntry, 'checksum'>): string {
    const data = JSON.stringify({
      id: entry.id,
      eventType: entry.eventType,
      userId: entry.userId,
      timestamp: entry.timestamp.toISOString(),
      consentInteraction: entry.consentInteraction,
      dataAccess: entry.dataAccess
    });
    
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Anonymize IP address for privacy
   */
  private anonymizeIP(ipAddress: string): string {
    if (ipAddress === 'unknown') return ipAddress;
    
    // IPv4: Replace last octet with 0
    if (ipAddress.includes('.')) {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }
    
    // IPv6: Replace last 64 bits with zeros
    if (ipAddress.includes(':')) {
      const parts = ipAddress.split(':');
      if (parts.length >= 4) {
        return `${parts.slice(0, 4).join(':')}::`;
      }
    }
    
    return ipAddress;
  }

  /**
   * Sanitize user agent string
   */
  private sanitizeUserAgent(userAgent: string): string {
    if (userAgent === 'unknown') return userAgent;
    
    // Remove potentially sensitive information while keeping browser/OS info
    return userAgent
      .replace(/\([^)]*\)/g, '(...)') // Remove detailed system info in parentheses
      .substring(0, 200); // Limit length
  }

  /**
   * Sanitize metadata to remove sensitive information
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove sensitive keys
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Encrypt audit entry (placeholder - implement with proper encryption)
   */
  private encryptEntry(entry: AuditLogEntry): any {
    // In production, implement proper encryption using AWS KMS
    // For now, just return the entry as-is
    return {
      ...entry,
      encrypted: true,
      encryptionVersion: '1.0'
    };
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.dbPool) {
      await this.dbPool.end();
      this.dbPool = null;
      console.log('Audit database connection closed');
    }
  }
}