import { z } from 'zod';

// File validation result
export interface FileValidationResult {
  isValid: boolean;
  fileType: string;
  mimeType: string;
  size: number;
  violations: ValidationViolation[];
  piiDetected: PIIDetection[];
  riskLevel: RiskLevel;
  recommendations: string[];
  processingAllowed: boolean;
}

// Validation violation
export interface ValidationViolation {
  type: ViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  confidence: number;
  remediation: string;
}

// PII detection result
export interface PIIDetection {
  type: PIIType;
  value: string; // Redacted/masked value
  location: string;
  confidence: number;
  context: string;
}

// Risk levels
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

// Violation types
export const ViolationTypeSchema = z.enum([
  'unsupported_file_type',
  'file_too_large',
  'malicious_content',
  'pii_detected',
  'missing_consent',
  'encryption_required',
  'retention_violation',
  'access_control_violation'
]);
export type ViolationType = z.infer<typeof ViolationTypeSchema>;

// PII types
export const PIITypeSchema = z.enum([
  'email',
  'phone',
  'ssn',
  'credit_card',
  'iban',
  'passport',
  'drivers_license',
  'name',
  'address',
  'date_of_birth',
  'medical_record',
  'financial_account',
  'biometric_data',
  'ip_address',
  'device_id'
]);
export type PIIType = z.infer<typeof PIITypeSchema>;

// File upload request
export const FileUploadRequestSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().positive(),
  contentType: z.string(),
  userId: z.string().uuid().optional(),
  purpose: z.enum(['profile_image', 'document', 'menu', 'receipt', 'other']),
  consentGiven: z.boolean(),
  metadata: z.record(z.any()).optional()
});

export type FileUploadRequest = z.infer<typeof FileUploadRequestSchema>;

// Upload protection config
export interface UploadProtectionConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  allowedMimeTypes: string[];
  enablePIIDetection: boolean;
  enableMalwareScanning: boolean;
  enableContentAnalysis: boolean;
  requireEncryption: boolean;
  autoQuarantine: boolean;
  strictMode: boolean;
}

// Content analysis result
export interface ContentAnalysisResult {
  textContent?: string;
  language?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  entities?: EntityDetection[];
  inappropriateContent?: boolean;
  businessRelevant?: boolean;
}

// Entity detection
export interface EntityDetection {
  type: string;
  text: string;
  confidence: number;
  offset: number;
  length: number;
}

// Quarantine record
export interface QuarantineRecord {
  id: string;
  fileName: string;
  originalPath: string;
  quarantinePath: string;
  userId?: string;
  reason: string;
  violations: ValidationViolation[];
  quarantinedAt: Date;
  reviewRequired: boolean;
  status: 'quarantined' | 'approved' | 'rejected' | 'deleted';
  reviewedBy?: string;
  reviewedAt?: Date;
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