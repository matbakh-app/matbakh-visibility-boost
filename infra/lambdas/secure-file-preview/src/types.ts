/**
 * Types for Secure File Preview System
 */

export interface PreviewRequest {
  fileUrl: string;
  userId: string;
  previewType: PreviewType;
  options?: PreviewOptions;
  securityContext?: SecurityContext;
}

export type PreviewType = 'thumbnail' | 'preview' | 'full';

export interface PreviewOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  page?: number; // For PDF previews
  maxPages?: number;
  watermark?: boolean;
}

export interface SecurityContext {
  ipAddress: string;
  userAgent: string;
  requestId: string;
  timestamp: string;
  rateLimitKey: string;
}

export interface PreviewResult {
  success: boolean;
  previewUrl?: string;
  thumbnailUrl?: string;
  metadata?: FileMetadata;
  error?: string;
  securityWarnings?: string[];
}

export interface FileMetadata {
  filename: string;
  contentType: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  pageCount?: number;
  createdAt: string;
  lastModified: string;
  checksum: string;
}

export interface ThumbnailGenerationOptions {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  fit: 'cover' | 'contain' | 'fill';
  background?: string;
}

export interface PDFPreviewOptions {
  page: number;
  scale: number;
  format: 'jpeg' | 'png';
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

export interface SecurityValidationResult {
  isValid: boolean;
  violations: SecurityViolation[];
  riskScore: number;
  allowPreview: boolean;
}

export interface SecurityViolation {
  type: SecurityViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export type SecurityViolationType = 
  | 'rate_limit_exceeded'
  | 'suspicious_file_type'
  | 'file_size_exceeded'
  | 'malicious_content_detected'
  | 'unauthorized_access'
  | 'invalid_file_structure'
  | 'embedded_script_detected';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (context: SecurityContext) => string;
}

export interface WAFRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  condition: WAFCondition;
  action: WAFAction;
}

export interface WAFCondition {
  type: 'ip_range' | 'user_agent' | 'request_rate' | 'file_type' | 'file_size';
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
  value: string | number;
}

export type WAFAction = 'allow' | 'block' | 'challenge' | 'log';

export interface PreviewCache {
  key: string;
  previewUrl: string;
  thumbnailUrl?: string;
  metadata: FileMetadata;
  createdAt: string;
  expiresAt: string;
  accessCount: number;
  lastAccessed: string;
}

export interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}