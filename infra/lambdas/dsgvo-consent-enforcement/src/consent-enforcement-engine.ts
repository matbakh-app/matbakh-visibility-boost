import { 
  ConsentVerificationRequest, 
  ConsentVerificationResult, 
  ConsentType, 
  ConsentRecord,
  ConsentEnforcementConfig,
  AuditLogEntry
} from './types';
import { ConsentDatabase } from './consent-database';
import { ConsentCache } from './consent-cache';

/**
 * Core consent enforcement engine
 */
export class ConsentEnforcementEngine {
  private database: ConsentDatabase;
  private cache: ConsentCache;
  private config: ConsentEnforcementConfig;

  constructor(
    database: ConsentDatabase,
    cache: ConsentCache,
    config: ConsentEnforcementConfig
  ) {
    this.database = database;
    this.cache = cache;
    this.config = config;
  }

  /**
   * Verify consent for a specific operation
   */
  async verifyConsent(request: ConsentVerificationRequest): Promise<ConsentVerificationResult> {
    const { userId, ipAddress, consentTypes, operation, metadata } = request;

    // Check cache first
    const cached = await this.cache.get(userId, ipAddress, consentTypes);
    if (cached && !this.shouldBypassCache(cached)) {
      await this.logAuditEntry({
        userId,
        ipAddress,
        userAgent: metadata?.userAgent,
        operation,
        consentTypes,
        result: cached.isValid ? 'allowed' : 'denied',
        reason: `Cache hit: ${cached.message}`,
        metadata: { ...metadata, source: 'cache' }
      });
      return cached;
    }

    // Get required consents for this operation
    const requiredConsents = this.getRequiredConsents(operation);
    
    // Fetch consent records from database
    const consentRecords = await this.database.getConsentRecords(
      userId, 
      ipAddress, 
      requiredConsents
    );

    // Analyze consent status
    const result = this.analyzeConsentStatus(
      requiredConsents,
      consentRecords,
      operation
    );

    // Cache the result
    await this.cache.set(
      result,
      userId,
      ipAddress,
      consentTypes,
      this.config.cacheExpirationSeconds
    );

    // Log audit entry
    await this.logAuditEntry({
      userId,
      ipAddress,
      userAgent: metadata?.userAgent,
      operation,
      consentTypes,
      result: result.isValid ? 'allowed' : 'denied',
      reason: result.message,
      metadata: { ...metadata, source: 'database' }
    });

    return result;
  }

  /**
   * Get required consents for an operation
   */
  private getRequiredConsents(operation: string): ConsentType[] {
    const operationConsents = this.config.requiredConsentsPerOperation[operation];
    if (operationConsents) {
      return operationConsents;
    }

    // Default consent requirements based on operation type
    switch (operation) {
      case 'upload':
        return ['upload', 'data_storage'];
      case 'analysis':
        return ['vc', 'ai_processing'];
      case 'processing':
        return ['ai_processing', 'data_storage'];
      case 'storage':
        return ['data_storage'];
      case 'sharing':
        return ['third_party_sharing'];
      default:
        return ['analytics']; // Minimal consent for unknown operations
    }
  }

  /**
   * Analyze consent status against requirements
   */
  private analyzeConsentStatus(
    requiredConsents: ConsentType[],
    consentRecords: ConsentRecord[],
    operation: string
  ): ConsentVerificationResult {
    const now = new Date();
    const missingConsents: ConsentType[] = [];
    const expiredConsents: ConsentType[] = [];
    let requiresRenewal = false;

    // Create a map of consent records by type
    const consentMap = new Map<ConsentType, ConsentRecord>();
    for (const record of consentRecords) {
      consentMap.set(record.consentType, record);
    }

    // Check each required consent
    for (const requiredType of requiredConsents) {
      const consentRecord = consentMap.get(requiredType);

      if (!consentRecord) {
        missingConsents.push(requiredType);
        continue;
      }

      // Check if consent was given
      if (!consentRecord.consentGiven) {
        missingConsents.push(requiredType);
        continue;
      }

      // Check if consent has expired
      if (consentRecord.expiresAt && consentRecord.expiresAt < now) {
        expiredConsents.push(requiredType);
        continue;
      }

      // Check if consent is approaching expiration (within grace period)
      if (consentRecord.expiresAt) {
        const gracePeriodMs = this.config.gracePeriodDays * 24 * 60 * 60 * 1000;
        const expirationWarningTime = new Date(consentRecord.expiresAt.getTime() - gracePeriodMs);
        
        if (now > expirationWarningTime) {
          requiresRenewal = true;
        }
      }
    }

    // Determine if the operation is allowed
    const hasAllRequiredConsents = missingConsents.length === 0 && expiredConsents.length === 0;
    
    let isValid = hasAllRequiredConsents;
    let message = '';

    if (isValid) {
      if (requiresRenewal) {
        message = `Operation allowed but consent renewal recommended for: ${requiredConsents.join(', ')}`;
      } else {
        message = `All required consents verified for operation: ${operation}`;
      }
    } else {
      const issues: string[] = [];
      if (missingConsents.length > 0) {
        issues.push(`Missing consents: ${missingConsents.join(', ')}`);
      }
      if (expiredConsents.length > 0) {
        issues.push(`Expired consents: ${expiredConsents.join(', ')}`);
      }
      message = `Operation denied - ${issues.join('; ')}`;
    }

    // In non-strict mode, allow operations with warnings
    if (!this.config.strictMode && !isValid && expiredConsents.length > 0 && missingConsents.length === 0) {
      isValid = true;
      requiresRenewal = true;
      message = `Operation allowed in non-strict mode but consent renewal required for: ${expiredConsents.join(', ')}`;
    }

    return {
      isValid,
      missingConsents,
      expiredConsents,
      consentDetails: consentRecords,
      requiresRenewal,
      message
    };
  }

  /**
   * Check if cache should be bypassed
   */
  private shouldBypassCache(cached: ConsentVerificationResult): boolean {
    // Bypass cache if consent is expired or requires renewal in strict mode
    if (this.config.strictMode && (cached.expiredConsents.length > 0 || cached.requiresRenewal)) {
      return true;
    }
    return false;
  }

  /**
   * Log audit entry
   */
  private async logAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.database.storeAuditLog(entry);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  /**
   * Store new consent
   */
  async storeConsent(
    userId: string | undefined,
    ipAddress: string,
    userAgent: string,
    consentType: ConsentType,
    consentGiven: boolean,
    version: string = '1.0',
    expirationDays?: number,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const expiresAt = expirationDays 
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + this.config.defaultExpirationDays * 24 * 60 * 60 * 1000);

    const consentId = await this.database.storeConsent(
      userId,
      ipAddress,
      userAgent,
      consentType,
      consentGiven,
      version,
      expiresAt,
      metadata
    );

    // Invalidate cache for this user/IP
    await this.cache.invalidate(userId, ipAddress);

    // Log audit entry
    await this.logAuditEntry({
      userId,
      ipAddress,
      userAgent,
      operation: 'consent_update',
      consentTypes: [consentType],
      result: consentGiven ? 'allowed' : 'denied',
      reason: `Consent ${consentGiven ? 'granted' : 'withdrawn'} for ${consentType}`,
      metadata: { ...metadata, consentId, version }
    });

    return consentId;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    userId: string,
    consentType: ConsentType,
    reason: string = 'User requested withdrawal'
  ): Promise<void> {
    // Get existing consent records
    const records = await this.database.getConsentRecords(userId, undefined, [consentType]);
    
    if (records.length === 0) {
      throw new Error(`No consent record found for type: ${consentType}`);
    }

    const latestRecord = records[0];
    
    // Update consent to withdrawn
    await this.database.updateConsent(
      latestRecord.id,
      false, // consent withdrawn
      latestRecord.version,
      undefined, // no expiration for withdrawn consent
      { withdrawalReason: reason, withdrawnAt: new Date().toISOString() }
    );

    // Invalidate cache
    await this.cache.invalidate(userId);

    // Log audit entry
    await this.logAuditEntry({
      userId,
      ipAddress: latestRecord.ipAddress,
      userAgent: latestRecord.userAgent,
      operation: 'consent_withdrawal',
      consentTypes: [consentType],
      result: 'denied',
      reason: `Consent withdrawn: ${reason}`,
      metadata: { consentId: latestRecord.id, withdrawalReason: reason }
    });
  }

  /**
   * Get consent status for user
   */
  async getConsentStatus(userId: string): Promise<{
    consents: ConsentRecord[];
    summary: Record<ConsentType, { given: boolean; expires?: Date; requiresRenewal: boolean }>;
  }> {
    const records = await this.database.getConsentRecords(userId);
    const now = new Date();
    const gracePeriodMs = this.config.gracePeriodDays * 24 * 60 * 60 * 1000;

    const summary: Record<string, { given: boolean; expires?: Date; requiresRenewal: boolean }> = {};

    for (const record of records) {
      const requiresRenewal = record.expiresAt 
        ? now > new Date(record.expiresAt.getTime() - gracePeriodMs)
        : false;

      summary[record.consentType] = {
        given: record.consentGiven,
        expires: record.expiresAt,
        requiresRenewal
      };
    }

    return {
      consents: records,
      summary: summary as Record<ConsentType, { given: boolean; expires?: Date; requiresRenewal: boolean }>
    };
  }
}