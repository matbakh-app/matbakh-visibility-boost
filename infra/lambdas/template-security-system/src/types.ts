/**
 * Types for Template Security System
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  status: TemplateStatus;
  securityLevel: SecurityLevel;
}

export type TemplateStatus = 
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'deprecated'
  | 'archived';

export type SecurityLevel = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

export interface TemplateContent {
  templateId: string;
  content: string;
  contentType: 'prompt' | 'config' | 'schema' | 'code';
  variables: TemplateVariable[];
  dependencies: string[];
  constraints: TemplateConstraint[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
  description?: string;
  sensitive?: boolean;
}

export interface ValidationRule {
  type: 'regex' | 'length' | 'range' | 'enum' | 'custom';
  value: any;
  message?: string;
}

export interface TemplateConstraint {
  type: 'security' | 'performance' | 'compliance' | 'business';
  rule: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
}

export interface TemplateSignature {
  templateId: string;
  version: string;
  algorithm: string;
  keyId: string;
  signature: string;
  timestamp: string;
  signedBy: string;
  contentHash: string;
}

export interface TemplateProvenance {
  templateId: string;
  version: string;
  signature: TemplateSignature;
  auditTrail: AuditEntry[];
  integrity: IntegrityCheck;
  compliance: ComplianceCheck;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction = 
  | 'created'
  | 'updated'
  | 'signed'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'deployed'
  | 'accessed'
  | 'deleted';

export interface IntegrityCheck {
  contentHash: string;
  signatureValid: boolean;
  timestampValid: boolean;
  chainOfTrust: boolean;
  lastVerified: string;
  verificationCount: number;
}

export interface ComplianceCheck {
  gdprCompliant: boolean;
  securityScanPassed: boolean;
  vulnerabilities: SecurityVulnerability[];
  complianceScore: number;
  lastChecked: string;
}

export interface SecurityVulnerability {
  id: string;
  type: VulnerabilityType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  cveId?: string;
  discoveredAt: string;
  status: 'open' | 'acknowledged' | 'fixed' | 'false_positive';
}

export type VulnerabilityType = 
  | 'injection'
  | 'xss'
  | 'insecure_deserialization'
  | 'broken_authentication'
  | 'sensitive_data_exposure'
  | 'xml_external_entities'
  | 'broken_access_control'
  | 'security_misconfiguration'
  | 'known_vulnerabilities'
  | 'insufficient_logging';

export interface TemplateValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  securityIssues: SecurityIssue[];
  performanceIssues: PerformanceIssue[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  recommendation?: string;
}

export interface SecurityIssue {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  cweId?: string;
}

export interface PerformanceIssue {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface TemplateDeployment {
  id: string;
  templateId: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  deployedAt: string;
  deployedBy: string;
  status: DeploymentStatus;
  configuration: Record<string, any>;
  rollbackVersion?: string;
}

export type DeploymentStatus = 
  | 'pending'
  | 'deploying'
  | 'deployed'
  | 'failed'
  | 'rolled_back';

export interface TemplateUsageMetrics {
  templateId: string;
  version: string;
  usageCount: number;
  successRate: number;
  averageExecutionTime: number;
  errorRate: number;
  lastUsed: string;
  popularVariables: Record<string, number>;
  userFeedback: UserFeedback[];
}

export interface UserFeedback {
  userId: string;
  rating: number;
  comment?: string;
  timestamp: string;
  helpful: boolean;
}

export interface TemplateSecurityConfig {
  encryptionRequired: boolean;
  signatureRequired: boolean;
  approvalRequired: boolean;
  auditingEnabled: boolean;
  accessControl: AccessControlConfig;
  retentionPolicy: RetentionPolicy;
}

export interface AccessControlConfig {
  allowedRoles: string[];
  allowedUsers: string[];
  restrictedEnvironments: string[];
  ipWhitelist?: string[];
  timeRestrictions?: TimeRestriction[];
}

export interface TimeRestriction {
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek: number[];
}

export interface RetentionPolicy {
  auditLogRetentionDays: number;
  templateVersionRetentionCount: number;
  signatureRetentionDays: number;
  automaticCleanup: boolean;
}

export interface KMSKeyConfig {
  keyId: string;
  keyArn: string;
  keyAlias: string;
  keyUsage: 'ENCRYPT_DECRYPT' | 'SIGN_VERIFY';
  keySpec: string;
  keyState: string;
  createdAt: string;
  description: string;
}

export interface SigningRequest {
  templateId: string;
  version: string;
  content: string;
  metadata: TemplateMetadata;
  signedBy: string;
  keyId?: string;
}

export interface VerificationRequest {
  templateId: string;
  version?: string;
  signature?: string;
  content?: string;
  strictMode?: boolean;
}

export interface VerificationResult {
  valid: boolean;
  templateId: string;
  version: string;
  signatureValid: boolean;
  contentIntact: boolean;
  timestampValid: boolean;
  signerVerified: boolean;
  chainOfTrustValid: boolean;
  errors: string[];
  warnings: string[];
  verifiedAt: string;
}

export interface TemplateSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  author?: string;
  status?: TemplateStatus;
  securityLevel?: SecurityLevel;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created' | 'updated' | 'usage' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateSearchResult {
  templates: TemplateMetadata[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface TemplateImportRequest {
  source: 'file' | 'url' | 'repository';
  content: string;
  metadata: Partial<TemplateMetadata>;
  validateOnly?: boolean;
  autoApprove?: boolean;
}

export interface TemplateExportRequest {
  templateId: string;
  version?: string;
  format: 'json' | 'yaml' | 'zip';
  includeSignature?: boolean;
  includeAuditTrail?: boolean;
}

export interface TemplateBackup {
  id: string;
  templateId: string;
  version: string;
  backupType: 'manual' | 'automatic' | 'scheduled';
  createdAt: string;
  createdBy: string;
  size: number;
  location: string;
  encrypted: boolean;
  verified: boolean;
}

export interface TemplateRestoreRequest {
  backupId: string;
  targetTemplateId?: string;
  targetVersion?: string;
  restoreMetadata?: boolean;
  restoreContent?: boolean;
  restoreSignature?: boolean;
}

export interface TemplateSecurityScan {
  id: string;
  templateId: string;
  version: string;
  scanType: 'static' | 'dynamic' | 'dependency' | 'compliance';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  findings: SecurityFinding[];
  score: number;
  recommendation: string;
}

export interface SecurityFinding {
  id: string;
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: string;
  recommendation: string;
  references?: string[];
  falsePositive?: boolean;
}

export interface TemplateChangeRequest {
  id: string;
  templateId: string;
  requestedBy: string;
  requestedAt: string;
  changeType: 'update' | 'delete' | 'approve' | 'reject';
  description: string;
  changes: Record<string, any>;
  approvals: Approval[];
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  reviewComments: ReviewComment[];
}

export interface Approval {
  approver: string;
  approvedAt: string;
  decision: 'approve' | 'reject' | 'request_changes';
  comment?: string;
}

export interface ReviewComment {
  id: string;
  reviewer: string;
  comment: string;
  timestamp: string;
  resolved: boolean;
}

export interface TemplateNotification {
  id: string;
  type: 'approval_required' | 'approved' | 'rejected' | 'security_issue' | 'usage_alert';
  templateId: string;
  recipient: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  actionRequired: boolean;
  actionUrl?: string;
}