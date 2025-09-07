import { z } from 'zod';

// Audit event types
export const AuditEventTypeSchema = z.enum([
  'consent_granted',
  'consent_withdrawn',
  'consent_verified',
  'consent_expired',
  'consent_renewed',
  'data_access',
  'data_processing',
  'data_deletion',
  'policy_update',
  'system_access'
]);

export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

// Audit severity levels
export const AuditSeveritySchema = z.enum([
  'info',
  'warning',
  'error',
  'critical'
]);

export type AuditSeverity = z.infer<typeof AuditSeveritySchema>;

// Audit source types
export const AuditSourceSchema = z.enum([
  'web',
  'mobile',
  'api',
  'admin',
  'system',
  'batch'
]);

export type AuditSource = z.infer<typeof AuditSourceSchema>;

// Consent interaction details
export interface ConsentInteraction {
  consentId?: string;
  consentType: string;
  consentVersion: string;
  previousValue?: boolean;
  newValue: boolean;
  expiresAt?: Date;
  metadata: Record<string, any>;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  source: AuditSource;
  timestamp: Date;
  consentInteraction?: ConsentInteraction;
  dataAccess?: DataAccessDetails;
  systemInfo: SystemInfo;
  metadata: Record<string, any>;
  checksum: string;
}

// Data access details
export interface DataAccessDetails {
  operation: 'read' | 'write' | 'delete' | 'export';
  dataType: string;
  recordCount?: number;
  purpose: string;
  legalBasis: string;
  retentionPeriod?: string;
}

// System information
export interface SystemInfo {
  service: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  region: string;
  requestId: string;
}

// Audit configuration
export interface AuditConfig {
  enableCloudWatchLogs: boolean;
  enableS3Archive: boolean;
  enableDatabaseStorage: boolean;
  retentionDays: number;
  archiveAfterDays: number;
  encryptionEnabled: boolean;
  checksumValidation: boolean;
  realTimeAlerts: boolean;
}

// Audit query parameters
export interface AuditQueryParams {
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  source?: AuditSource;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

// Audit statistics
export interface AuditStatistics {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsBySource: Record<AuditSource, number>;
  uniqueUsers: number;
  uniqueIPs: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

// Compliance report
export interface ComplianceReport {
  reportId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalConsentInteractions: number;
    consentGranted: number;
    consentWithdrawn: number;
    dataAccessEvents: number;
    policyViolations: number;
  };
  consentMetrics: {
    byType: Record<string, number>;
    bySource: Record<AuditSource, number>;
    averageConsentDuration: number;
    renewalRate: number;
  };
  dataProcessingMetrics: {
    totalOperations: number;
    byPurpose: Record<string, number>;
    byLegalBasis: Record<string, number>;
  };
  violations: AuditViolation[];
  recommendations: string[];
}

// Audit violation
export interface AuditViolation {
  id: string;
  type: 'missing_consent' | 'expired_consent' | 'unauthorized_access' | 'data_breach' | 'policy_violation';
  severity: AuditSeverity;
  description: string;
  userId?: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
  metadata: Record<string, any>;
}

// Database credentials
export interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}