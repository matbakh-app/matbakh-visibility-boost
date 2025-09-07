/**
 * Types for Upload Audit & Integrity System
 */

export interface UploadAuditEvent {
  uploadId: string;
  userId: string;
  partnerId?: string;
  filename: string;
  originalFilename: string;
  s3Bucket: string;
  s3Key: string;
  contentType: string;
  fileSize: number;
  checksumSHA256: string;
  checksumMD5?: string;
  uploadTimestamp: string;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface IntegrityCheckResult {
  uploadId: string;
  isValid: boolean;
  checksumMatch: boolean;
  fileSizeMatch: boolean;
  contentTypeMatch: boolean;
  corruptionDetected: boolean;
  verificationTimestamp: string;
  errorDetails?: string[];
}

export interface UploadAuditRecord {
  id: string;
  uploadId: string;
  userId: string;
  partnerId?: string;
  action: UploadAuditAction;
  filename: string;
  s3Bucket: string;
  s3Key: string;
  fileSize: number;
  contentType: string;
  checksumSHA256: string;
  checksumMD5?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type UploadAuditAction = 
  | 'upload_initiated'
  | 'upload_completed'
  | 'upload_failed'
  | 'integrity_verified'
  | 'integrity_failed'
  | 'corruption_detected'
  | 'file_quarantined'
  | 'file_deleted'
  | 're_upload_triggered';

export interface UploadLifecycleEvent {
  uploadId: string;
  stage: UploadLifecycleStage;
  timestamp: string;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export type UploadLifecycleStage = 
  | 'validation'
  | 'checksum_calculation'
  | 'presigned_url_generation'
  | 's3_upload'
  | 'integrity_verification'
  | 'database_commit'
  | 'audit_logging'
  | 'completion';

export interface ReUploadWorkflow {
  originalUploadId: string;
  newUploadId: string;
  reason: ReUploadReason;
  maxRetries: number;
  currentRetry: number;
  triggeredAt: string;
  completedAt?: string;
  success?: boolean;
  errorMessage?: string;
}

export type ReUploadReason = 
  | 'corruption_detected'
  | 'checksum_mismatch'
  | 'file_size_mismatch'
  | 'content_type_mismatch'
  | 'user_requested'
  | 'system_recovery';

export interface UploadMetrics {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  corruptedFiles: number;
  reUploadTriggered: number;
  averageFileSize: number;
  averageUploadDuration: number;
  integrityCheckSuccessRate: number;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}

export interface S3ObjectInfo {
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  etag: string;
  lastModified: Date;
  metadata: Record<string, string>;
}