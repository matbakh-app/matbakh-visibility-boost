import { Pool, PoolClient } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { ConsentRecord, ConsentType, DatabaseCredentials, AuditLogEntry } from './types';

/**
 * Database operations for consent management
 */
export class ConsentDatabase {
  private pool: Pool | null = null;
  private secretsClient: SecretsManagerClient;

  constructor(private secretId: string = 'matbakh-db-postgres') {
    this.secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });
  }

  /**
   * Initialize database connection pool
   */
  async connect(): Promise<void> {
    if (this.pool) return;

    try {
      const command = new GetSecretValueCommand({ SecretId: this.secretId });
      const secret = await this.secretsClient.send(command);
      
      if (!secret.SecretString) {
        throw new Error('Database secret string is empty');
      }

      const creds: DatabaseCredentials = JSON.parse(secret.SecretString);

      this.pool = new Pool({
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

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      console.log('Database connection pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  /**
   * Get consent records for user or IP address
   */
  async getConsentRecords(
    userId?: string,
    ipAddress?: string,
    consentTypes?: ConsentType[]
  ): Promise<ConsentRecord[]> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    let query = `
      SELECT 
        id,
        user_id as "userId",
        ip_address as "ipAddress", 
        user_agent as "userAgent",
        consent_type as "consentType",
        consent_given as "consentGiven",
        COALESCE(meta->>'version', '1.0') as version,
        (meta->>'expiresAt')::timestamptz as "expiresAt",
        created_at as "createdAt",
        updated_at as "updatedAt",
        meta
      FROM public.user_consent_tracking
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (ipAddress) {
      query += ` AND ip_address = $${paramIndex}`;
      params.push(ipAddress);
      paramIndex++;
    }

    if (consentTypes && consentTypes.length > 0) {
      query += ` AND consent_type = ANY($${paramIndex})`;
      params.push(consentTypes);
      paramIndex++;
    }

    // Get most recent consent for each type
    query += `
      ORDER BY consent_type, created_at DESC
    `;

    try {
      const result = await this.pool.query(query, params);
      
      // Group by consent type and take the most recent
      const consentMap = new Map<string, ConsentRecord>();
      
      for (const row of result.rows) {
        const consentType = row.consentType;
        if (!consentMap.has(consentType)) {
          consentMap.set(consentType, {
            id: row.id,
            userId: row.userId,
            ipAddress: row.ipAddress,
            userAgent: row.userAgent,
            consentType: row.consentType,
            consentGiven: row.consentGiven,
            version: row.version,
            expiresAt: row.expiresAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            meta: row.meta || {}
          });
        }
      }

      return Array.from(consentMap.values());
    } catch (error) {
      console.error('Error fetching consent records:', error);
      throw error;
    }
  }

  /**
   * Store new consent record
   */
  async storeConsent(
    userId: string | undefined,
    ipAddress: string,
    userAgent: string,
    consentType: ConsentType,
    consentGiven: boolean,
    version: string = '1.0',
    expiresAt?: Date,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    const meta = {
      ...metadata,
      version,
      ...(expiresAt && { expiresAt: expiresAt.toISOString() }),
      source: 'consent-enforcement-layer'
    };

    const query = `
      INSERT INTO public.user_consent_tracking (
        user_id, ip_address, user_agent, consent_type, consent_given, meta
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const params = [userId, ipAddress, userAgent, consentType, consentGiven, JSON.stringify(meta)];

    try {
      const result = await this.pool.query(query, params);
      const consentId = result.rows[0].id;
      
      console.log(`Stored consent record: ${consentId}`, {
        userId,
        consentType,
        consentGiven,
        version
      });

      return consentId;
    } catch (error) {
      console.error('Error storing consent record:', error);
      throw error;
    }
  }

  /**
   * Update existing consent record
   */
  async updateConsent(
    consentId: string,
    consentGiven: boolean,
    version: string = '1.0',
    expiresAt?: Date,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    const meta = {
      ...metadata,
      version,
      ...(expiresAt && { expiresAt: expiresAt.toISOString() }),
      updatedBy: 'consent-enforcement-layer'
    };

    const query = `
      UPDATE public.user_consent_tracking 
      SET 
        consent_given = $2,
        meta = $3,
        updated_at = now()
      WHERE id = $1
    `;

    const params = [consentId, consentGiven, JSON.stringify(meta)];

    try {
      await this.pool.query(query, params);
      console.log(`Updated consent record: ${consentId}`, { consentGiven, version });
    } catch (error) {
      console.error('Error updating consent record:', error);
      throw error;
    }
  }

  /**
   * Store audit log entry
   */
  async storeAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    // Create audit log table if it doesn't exist
    await this.ensureAuditLogTable();

    const query = `
      INSERT INTO public.consent_audit_log (
        user_id, ip_address, user_agent, operation, consent_types, 
        result, reason, metadata, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const params = [
      entry.userId,
      entry.ipAddress,
      entry.userAgent,
      entry.operation,
      JSON.stringify(entry.consentTypes),
      entry.result,
      entry.reason,
      JSON.stringify(entry.metadata),
      new Date()
    ];

    try {
      await this.pool.query(query, params);
    } catch (error) {
      console.error('Error storing audit log:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  /**
   * Ensure audit log table exists
   */
  private async ensureAuditLogTable(): Promise<void> {
    if (!this.pool) return;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.consent_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        ip_address TEXT,
        user_agent TEXT,
        operation TEXT NOT NULL,
        consent_types JSONB NOT NULL,
        result TEXT NOT NULL CHECK (result IN ('allowed', 'denied', 'warning')),
        reason TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_consent_audit_log_user_id_timestamp 
        ON public.consent_audit_log(user_id, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_consent_audit_log_ip_timestamp 
        ON public.consent_audit_log(ip_address, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_consent_audit_log_operation_timestamp 
        ON public.consent_audit_log(operation, timestamp DESC);
    `;

    try {
      await this.pool.query(createTableQuery);
    } catch (error) {
      console.warn('Error creating audit log table:', error);
    }
  }

  /**
   * Get consent statistics
   */
  async getConsentStats(): Promise<{
    totalConsents: number;
    consentsByType: Record<string, number>;
    recentConsents: number;
  }> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    const queries = [
      'SELECT COUNT(*) as total FROM public.user_consent_tracking',
      `SELECT consent_type, COUNT(*) as count 
       FROM public.user_consent_tracking 
       GROUP BY consent_type`,
      `SELECT COUNT(*) as recent 
       FROM public.user_consent_tracking 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    ];

    try {
      const [totalResult, typeResult, recentResult] = await Promise.all(
        queries.map(query => this.pool!.query(query))
      );

      const consentsByType: Record<string, number> = {};
      for (const row of typeResult.rows) {
        consentsByType[row.consent_type] = parseInt(row.count);
      }

      return {
        totalConsents: parseInt(totalResult.rows[0].total),
        consentsByType,
        recentConsents: parseInt(recentResult.rows[0].recent)
      };
    } catch (error) {
      console.error('Error getting consent stats:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }
}