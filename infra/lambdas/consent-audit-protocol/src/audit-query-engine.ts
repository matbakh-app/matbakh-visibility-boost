import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { 
  AuditLogEntry, 
  AuditQueryParams, 
  AuditStatistics, 
  ComplianceReport,
  AuditViolation,
  DatabaseCredentials,
  AuditEventType,
  AuditSeverity,
  AuditSource
} from './types';

/**
 * Query engine for audit logs and compliance reporting
 */
export class AuditQueryEngine {
  private dbPool: Pool | null = null;
  private secretsClient: SecretsManagerClient;

  constructor() {
    this.secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });
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
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      console.log('Audit query engine initialized');
    } catch (error) {
      console.error('Failed to initialize audit query engine:', error);
      throw error;
    }
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(params: AuditQueryParams): Promise<{
    logs: AuditLogEntry[];
    totalCount: number;
    hasMore: boolean;
  }> {
    if (!this.dbPool) {
      await this.initialize();
    }

    if (!this.dbPool) {
      throw new Error('Database not available');
    }

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (params.userId) {
      conditions.push(`user_id = $${paramIndex}`);
      values.push(params.userId);
      paramIndex++;
    }

    if (params.eventType) {
      conditions.push(`event_type = $${paramIndex}`);
      values.push(params.eventType);
      paramIndex++;
    }

    if (params.severity) {
      conditions.push(`severity = $${paramIndex}`);
      values.push(params.severity);
      paramIndex++;
    }

    if (params.source) {
      conditions.push(`source = $${paramIndex}`);
      values.push(params.source);
      paramIndex++;
    }

    if (params.ipAddress) {
      conditions.push(`ip_address = $${paramIndex}`);
      values.push(params.ipAddress);
      paramIndex++;
    }

    if (params.startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      values.push(params.startDate);
      paramIndex++;
    }

    if (params.endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      values.push(params.endDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const limit = params.limit || 100;
    const offset = params.offset || 0;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM public.consent_audit_log
      WHERE ${whereClause}
    `;

    const countResult = await this.dbPool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT 
        id, event_type, severity, user_id, session_id, ip_address, user_agent,
        source, timestamp, consent_interaction, data_access, system_info,
        metadata, checksum
      FROM public.consent_audit_log
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);
    const dataResult = await this.dbPool.query(dataQuery, values);

    const logs: AuditLogEntry[] = dataResult.rows.map(row => ({
      id: row.id,
      eventType: row.event_type,
      severity: row.severity,
      userId: row.user_id,
      sessionId: row.session_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      source: row.source,
      timestamp: row.timestamp,
      consentInteraction: row.consent_interaction,
      dataAccess: row.data_access,
      systemInfo: row.system_info,
      metadata: row.metadata || {},
      checksum: row.checksum
    }));

    return {
      logs,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  }

  /**
   * Get audit statistics for a time period
   */
  async getAuditStatistics(startDate: Date, endDate: Date): Promise<AuditStatistics> {
    if (!this.dbPool) {
      await this.initialize();
    }

    if (!this.dbPool) {
      throw new Error('Database not available');
    }

    const queries = [
      // Total events
      `SELECT COUNT(*) as total FROM public.consent_audit_log 
       WHERE timestamp BETWEEN $1 AND $2`,
      
      // Events by type
      `SELECT event_type, COUNT(*) as count FROM public.consent_audit_log 
       WHERE timestamp BETWEEN $1 AND $2 
       GROUP BY event_type`,
      
      // Events by severity
      `SELECT severity, COUNT(*) as count FROM public.consent_audit_log 
       WHERE timestamp BETWEEN $1 AND $2 
       GROUP BY severity`,
      
      // Events by source
      `SELECT source, COUNT(*) as count FROM public.consent_audit_log 
       WHERE timestamp BETWEEN $1 AND $2 
       GROUP BY source`,
      
      // Unique users
      `SELECT COUNT(DISTINCT user_id) as unique_users FROM public.consent_audit_log 
       WHERE timestamp BETWEEN $1 AND $2 AND user_id IS NOT NULL`,
      
      // Unique IPs
      `SELECT COUNT(DISTINCT ip_address) as unique_ips FROM public.consent_audit_log 
       WHERE timestamp BETWEEN $1 AND $2`
    ];

    const results = await Promise.all(
      queries.map(query => this.dbPool!.query(query, [startDate, endDate]))
    );

    const [totalResult, typeResult, severityResult, sourceResult, usersResult, ipsResult] = results;

    // Process results
    const eventsByType: Record<AuditEventType, number> = {} as any;
    for (const row of typeResult.rows) {
      eventsByType[row.event_type as AuditEventType] = parseInt(row.count);
    }

    const eventsBySeverity: Record<AuditSeverity, number> = {} as any;
    for (const row of severityResult.rows) {
      eventsBySeverity[row.severity as AuditSeverity] = parseInt(row.count);
    }

    const eventsBySource: Record<AuditSource, number> = {} as any;
    for (const row of sourceResult.rows) {
      eventsBySource[row.source as AuditSource] = parseInt(row.count);
    }

    return {
      totalEvents: parseInt(totalResult.rows[0].total),
      eventsByType,
      eventsBySeverity,
      eventsBySource,
      uniqueUsers: parseInt(usersResult.rows[0].unique_users),
      uniqueIPs: parseInt(ipsResult.rows[0].unique_ips),
      timeRange: {
        start: startDate,
        end: endDate
      }
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<ComplianceReport> {
    if (!this.dbPool) {
      await this.initialize();
    }

    if (!this.dbPool) {
      throw new Error('Database not available');
    }

    const reportId = `compliance_${Date.now()}`;

    // Get basic statistics
    const stats = await this.getAuditStatistics(startDate, endDate);

    // Get consent-specific metrics
    const consentQuery = `
      SELECT 
        event_type,
        source,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (
          CASE 
            WHEN consent_interaction->>'expiresAt' IS NOT NULL 
            THEN (consent_interaction->>'expiresAt')::timestamptz - timestamp
            ELSE NULL
          END
        )) / 86400) as avg_duration_days
      FROM public.consent_audit_log
      WHERE timestamp BETWEEN $1 AND $2
        AND event_type IN ('consent_granted', 'consent_withdrawn', 'consent_renewed')
      GROUP BY event_type, source
    `;

    const consentResult = await this.dbPool.query(consentQuery, [startDate, endDate]);

    // Get data processing metrics
    const dataProcessingQuery = `
      SELECT 
        data_access->>'purpose' as purpose,
        data_access->>'legalBasis' as legal_basis,
        data_access->>'operation' as operation,
        COUNT(*) as count
      FROM public.consent_audit_log
      WHERE timestamp BETWEEN $1 AND $2
        AND data_access IS NOT NULL
      GROUP BY data_access->>'purpose', data_access->>'legalBasis', data_access->>'operation'
    `;

    const dataProcessingResult = await this.dbPool.query(dataProcessingQuery, [startDate, endDate]);

    // Get violations
    const violations = await this.getAuditViolations(startDate, endDate);

    // Calculate metrics
    const consentGranted = consentResult.rows
      .filter(row => row.event_type === 'consent_granted')
      .reduce((sum, row) => sum + parseInt(row.count), 0);

    const consentWithdrawn = consentResult.rows
      .filter(row => row.event_type === 'consent_withdrawn')
      .reduce((sum, row) => sum + parseInt(row.count), 0);

    const consentRenewed = consentResult.rows
      .filter(row => row.event_type === 'consent_renewed')
      .reduce((sum, row) => sum + parseInt(row.count), 0);

    const renewalRate = consentGranted > 0 ? (consentRenewed / consentGranted) * 100 : 0;

    const avgConsentDuration = consentResult.rows
      .filter(row => row.avg_duration_days !== null)
      .reduce((sum, row, _, arr) => sum + parseFloat(row.avg_duration_days) / arr.length, 0);

    // Process data processing metrics
    const byPurpose: Record<string, number> = {};
    const byLegalBasis: Record<string, number> = {};
    let totalOperations = 0;

    for (const row of dataProcessingResult.rows) {
      const count = parseInt(row.count);
      totalOperations += count;

      if (row.purpose) {
        byPurpose[row.purpose] = (byPurpose[row.purpose] || 0) + count;
      }

      if (row.legal_basis) {
        byLegalBasis[row.legal_basis] = (byLegalBasis[row.legal_basis] || 0) + count;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (renewalRate < 50) {
      recommendations.push('Consider implementing proactive consent renewal reminders');
    }

    if (violations.length > 0) {
      recommendations.push(`Address ${violations.length} identified compliance violations`);
    }

    if (avgConsentDuration < 180) {
      recommendations.push('Review consent expiration periods - current average is below 6 months');
    }

    const consentByType: Record<string, number> = {};
    const consentBySource: Record<AuditSource, number> = {} as any;

    for (const row of consentResult.rows) {
      if (row.event_type === 'consent_granted') {
        consentBySource[row.source as AuditSource] = (consentBySource[row.source as AuditSource] || 0) + parseInt(row.count);
      }
    }

    return {
      reportId,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      summary: {
        totalConsentInteractions: consentGranted + consentWithdrawn + consentRenewed,
        consentGranted,
        consentWithdrawn,
        dataAccessEvents: totalOperations,
        policyViolations: violations.length
      },
      consentMetrics: {
        byType: consentByType,
        bySource: consentBySource,
        averageConsentDuration: avgConsentDuration,
        renewalRate
      },
      dataProcessingMetrics: {
        totalOperations,
        byPurpose,
        byLegalBasis
      },
      violations,
      recommendations
    };
  }

  /**
   * Get audit violations
   */
  async getAuditViolations(startDate: Date, endDate: Date): Promise<AuditViolation[]> {
    if (!this.dbPool) {
      await this.initialize();
    }

    if (!this.dbPool) {
      throw new Error('Database not available');
    }

    const query = `
      SELECT 
        id, violation_type, severity, description, user_id, timestamp,
        resolved, resolution, metadata
      FROM public.audit_violations
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC
    `;

    const result = await this.dbPool.query(query, [startDate, endDate]);

    return result.rows.map(row => ({
      id: row.id,
      type: row.violation_type,
      severity: row.severity,
      description: row.description,
      userId: row.user_id,
      timestamp: row.timestamp,
      resolved: row.resolved,
      resolution: row.resolution,
      metadata: row.metadata || {}
    }));
  }

  /**
   * Verify audit log integrity
   */
  async verifyIntegrity(logIds: string[]): Promise<{
    verified: string[];
    corrupted: string[];
    missing: string[];
  }> {
    if (!this.dbPool) {
      await this.initialize();
    }

    if (!this.dbPool) {
      throw new Error('Database not available');
    }

    const query = `
      SELECT id, event_type, user_id, timestamp, consent_interaction, data_access, checksum
      FROM public.consent_audit_log
      WHERE id = ANY($1)
    `;

    const result = await this.dbPool.query(query, [logIds]);
    const foundLogs = new Map(result.rows.map(row => [row.id, row]));

    const verified: string[] = [];
    const corrupted: string[] = [];
    const missing: string[] = [];

    for (const logId of logIds) {
      const log = foundLogs.get(logId);
      
      if (!log) {
        missing.push(logId);
        continue;
      }

      // Recalculate checksum
      const data = JSON.stringify({
        id: log.id,
        eventType: log.event_type,
        userId: log.user_id,
        timestamp: log.timestamp.toISOString(),
        consentInteraction: log.consent_interaction,
        dataAccess: log.data_access
      });

      const expectedChecksum = require('crypto').createHash('sha256').update(data).digest('hex');

      if (expectedChecksum === log.checksum) {
        verified.push(logId);
      } else {
        corrupted.push(logId);
      }
    }

    return { verified, corrupted, missing };
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.dbPool) {
      await this.dbPool.end();
      this.dbPool = null;
      console.log('Audit query engine disconnected');
    }
  }
}