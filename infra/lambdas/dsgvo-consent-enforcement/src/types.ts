import { z } from 'zod';

// Consent types supported by the system
export const ConsentTypeSchema = z.enum([
  'upload',
  'vc',
  'newsletter', 
  'analytics',
  'marketing',
  'ai_processing',
  'data_storage',
  'third_party_sharing'
]);

export type ConsentType = z.infer<typeof ConsentTypeSchema>;

// Consent verification request
export const ConsentVerificationRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  ipAddress: z.string().optional(),
  consentTypes: z.array(ConsentTypeSchema),
  operation: z.enum(['upload', 'analysis', 'processing', 'storage', 'sharing']),
  metadata: z.record(z.any()).optional()
});

export type ConsentVerificationRequest = z.infer<typeof ConsentVerificationRequestSchema>;

// Consent verification result
export interface ConsentVerificationResult {
  isValid: boolean;
  missingConsents: ConsentType[];
  expiredConsents: ConsentType[];
  consentDetails: ConsentRecord[];
  requiresRenewal: boolean;
  message: string;
}

// Consent record from database
export interface ConsentRecord {
  id: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  consentType: ConsentType;
  consentGiven: boolean;
  version: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  meta: Record<string, any>;
}

// Consent enforcement configuration
export interface ConsentEnforcementConfig {
  strictMode: boolean;
  defaultExpirationDays: number;
  gracePeriodDays: number;
  requiredConsentsPerOperation: Record<string, ConsentType[]>;
  cacheExpirationSeconds: number;
}

// Database credentials
export interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}

// Cache entry
export interface CacheEntry {
  data: ConsentVerificationResult;
  expiresAt: number;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  operation: string;
  consentTypes: ConsentType[];
  result: 'allowed' | 'denied' | 'warning';
  reason: string;
  metadata: Record<string, any>;
  timestamp: Date;
}