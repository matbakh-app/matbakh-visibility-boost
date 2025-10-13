/**
 * Security Types for Hybrid Architecture Security Scanner
 *
 * Type definitions for comprehensive security scanning and validation
 * of the hybrid AI architecture.
 */

export interface HybridSecurityConfig {
  scanDepth: "basic" | "standard" | "comprehensive";
  enablePenetrationTesting: boolean;
  enableComplianceValidation: boolean;
  enableVulnerabilityScanning: boolean;
  enableAuditTrailValidation: boolean;
  scanTimeout: number;
  reportFormat: "summary" | "detailed" | "executive";
  excludePatterns: string[];
  includePatterns: string[];
  securityThresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface SecurityScanResult {
  scanId: string;
  timestamp: Date;
  overallSecurityScore: number;
  scanResults: {
    mcpRouting: PathSecurityResult | { error: string };
    directBedrock: PathSecurityResult | { error: string };
    hybridRouting: HybridRoutingSecurityResult | { error: string };
    compliance: ComplianceValidationResult | { error: string };
    penetrationTesting?: PenetrationTestResult | { error: string };
    auditTrail?: AuditTrailValidationResult | { error: string };
  };
  config: HybridSecurityConfig;
  recommendations: string[];
}

export interface PathSecurityResult {
  pathType: "mcp" | "direct_bedrock";
  securityScore: number;
  vulnerabilities: SecurityVulnerability[];
  complianceStatus: PathComplianceStatus;
  recommendations: string[];
}

export interface HybridRoutingSecurityResult {
  pathType: "hybrid";
  integrationSecurityScore: number;
  crossPathVulnerabilities: SecurityVulnerability[];
  routingSecurityValidation: RoutingSecurityValidation;
  recommendations: string[];
}

export interface SecurityVulnerability {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category:
    | "authentication"
    | "authorization"
    | "data_protection"
    | "network_security"
    | "configuration"
    | "injection";
  description: string;
  recommendation: string;
  affectedComponents: string[];
  path?: string;
  piiRisk?: "critical" | "high" | "medium" | "low";
  gdprCompliance?: boolean;
  networkLayer?: string;
  exposureRisk?: "critical" | "high" | "medium" | "low";
  cveId?: string;
  cvssScore?: number;
  exploitability?: "high" | "medium" | "low";
  impact?: "high" | "medium" | "low";
}

export interface PathComplianceStatus {
  compliant: boolean;
  violations: ComplianceViolation[];
  gdprCompliant?: boolean;
  euDataResidencyCompliant?: boolean;
  providerAgreementCompliant?: boolean;
}

export interface ComplianceViolation {
  violationId: string;
  type: "gdpr" | "data_residency" | "provider_agreement" | "security_policy";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  remediation: string;
  affectedData?: string[];
  regulatoryReference?: string;
}

export interface ComplianceValidationResult {
  gdpr: GDPRComplianceResult;
  euDataResidency: EUDataResidencyResult;
  providerAgreements: ProviderAgreementComplianceResult;
  overallCompliant: boolean;
}

export interface GDPRComplianceResult {
  overallCompliant: boolean;
  mcpPathCompliant: boolean;
  directBedrockCompliant: boolean;
  dataProcessingCompliant: boolean;
  consentManagementCompliant: boolean;
  violations: ComplianceViolation[];
}

export interface EUDataResidencyResult {
  compliant: boolean;
  dataLocations: string[];
  crossBorderTransfers: DataTransfer[];
  violations: ComplianceViolation[];
}

export interface DataTransfer {
  transferId: string;
  sourceRegion: string;
  destinationRegion: string;
  dataType: string;
  legalBasis: string;
  approved: boolean;
}

export interface ProviderAgreementComplianceResult {
  overallCompliant: boolean;
  bedrockCompliant: boolean;
  mcpCompliant: boolean;
  agreementViolations: ComplianceViolation[];
}

export interface PenetrationTestResult {
  testId: string;
  testResults: PenetrationTestCase[];
  exploitAttempts: ExploitAttempt[];
  successfulExploits: SuccessfulExploit[];
  securityGaps: SecurityGap[];
}

export interface PenetrationTestCase {
  testName: string;
  testType:
    | "injection"
    | "authentication"
    | "authorization"
    | "data_exposure"
    | "network";
  result: "passed" | "failed" | "vulnerable";
  details: any;
  recommendations?: string[];
}

export interface ExploitAttempt {
  attemptId: string;
  exploitType: string;
  targetComponent: string;
  method: string;
  successful: boolean;
  timestamp: Date;
  details: any;
}

export interface SuccessfulExploit {
  exploitId: string;
  exploitType: string;
  targetComponent: string;
  impact: "critical" | "high" | "medium" | "low";
  dataExposed?: string[];
  privilegesGained?: string[];
  remediation: string;
}

export interface SecurityGap {
  gapId: string;
  category: string;
  description: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  recommendation: string;
  affectedComponents: string[];
}

export interface RoutingSecurityValidation {
  secure: boolean;
  routeIsolation: boolean;
  stateProtection: boolean;
  fallbackSecurity: boolean;
  monitoringSecurity: boolean;
  issues?: RoutingSecurityIssue[];
}

export interface RoutingSecurityIssue {
  issueId: string;
  component: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

export interface AuditTrailValidationResult {
  integrityMaintained: boolean;
  tamperProof: boolean;
  completeness: number; // 0-1 scale
  encryptionStatus: "encrypted" | "partially_encrypted" | "unencrypted";
  issues?: AuditTrailIssue[];
}

export interface AuditTrailIssue {
  issueId: string;
  type: "integrity" | "completeness" | "encryption" | "access_control";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
  affectedLogs?: string[];
}

export interface SecurityReport {
  reportId: string;
  executiveSummary: string;
  detailedFindings: SecurityFinding[];
  riskAssessment: RiskAssessment;
  recommendations: SecurityRecommendation[];
  complianceStatus: ComplianceValidationResult;
  generatedAt?: Date;
  reportFormat?: "executive" | "technical" | "compliance";
}

export interface SecurityFinding {
  findingId: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  evidence: any[];
  impact: string;
  likelihood: "high" | "medium" | "low";
  recommendation: string;
  affectedAssets: string[];
}

export interface RiskAssessment {
  overallRiskLevel: "critical" | "high" | "medium" | "low";
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  residualRisk: "critical" | "high" | "medium" | "low";
}

export interface RiskFactor {
  factor: string;
  impact: "critical" | "high" | "medium" | "low";
  likelihood: "high" | "medium" | "low";
  description: string;
  mitigation?: string;
}

export interface SecurityRecommendation {
  recommendationId: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  implementation: string;
  effort: "low" | "medium" | "high";
  timeline: string;
  dependencies?: string[];
}

// Authentication and Authorization Types
export interface AuthenticationSecurityCheck {
  checkType: "weak_auth" | "bypass" | "session_management" | "multi_factor";
  vulnerable: boolean;
  components: string[];
  details?: any;
}

export interface AuthorizationSecurityCheck {
  checkType:
    | "privilege_escalation"
    | "access_control_bypass"
    | "role_manipulation";
  vulnerable: boolean;
  components: string[];
  details?: any;
}

// Data Protection Types
export interface DataProtectionSecurityCheck {
  checkType:
    | "encryption"
    | "leakage"
    | "pii_protection"
    | "data_classification";
  vulnerable: boolean;
  components: string[];
  piiRisk?: "critical" | "high" | "medium" | "low";
  gdprCompliant?: boolean;
  details?: any;
}

// Network Security Types
export interface NetworkSecurityCheck {
  checkType: "exposure" | "tls_ssl" | "firewall" | "intrusion_detection";
  vulnerable: boolean;
  components: string[];
  layer?: string;
  riskLevel?: "critical" | "high" | "medium" | "low";
  details?: any;
}

// Circuit Breaker Security Types
export interface CircuitBreakerSecurityValidation {
  configurationSecure: boolean;
  failureHandlingSecure: boolean;
  stateTransitionSecure: boolean;
  monitoringSecure: boolean;
  issues?: CircuitBreakerSecurityIssue[];
}

export interface CircuitBreakerSecurityIssue {
  issueType:
    | "configuration"
    | "failure_handling"
    | "state_transition"
    | "monitoring";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

// Injection Testing Types
export interface InjectionTestResult {
  sqlInjection: InjectionTestCase;
  promptInjection: InjectionTestCase;
  commandInjection: InjectionTestCase;
  xssVulnerabilities: InjectionTestCase;
}

export interface InjectionTestCase {
  tested: boolean;
  vulnerable: boolean;
  attempts: number;
  successful: number;
  details?: any[];
}

// Authentication Bypass Testing Types
export interface AuthenticationBypassTestResult {
  bypassAttempts: BypassAttempt[];
  successfulBypasses: SuccessfulBypass[];
  authenticationStrength: "weak" | "moderate" | "strong";
}

export interface BypassAttempt {
  method: string;
  successful: boolean;
  details?: any;
}

export interface SuccessfulBypass {
  method: string;
  impact: "critical" | "high" | "medium" | "low";
  details: any;
}

// Security Scan Configuration Types
export interface ScanConfiguration {
  scanId: string;
  scanType: "quick" | "standard" | "comprehensive" | "compliance_only";
  targetComponents: string[];
  excludeComponents: string[];
  scanDepth: number;
  timeoutMinutes: number;
  parallelScans: boolean;
  reportingLevel: "summary" | "detailed" | "verbose";
}

// Security Metrics Types
export interface SecurityMetrics {
  vulnerabilityCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  complianceScore: number;
  securityScore: number;
  riskScore: number;
  lastScanDate: Date;
  trendData?: SecurityTrendData[];
}

export interface SecurityTrendData {
  date: Date;
  securityScore: number;
  vulnerabilityCount: number;
  complianceScore: number;
}

// Export utility types
export type SecuritySeverity = "critical" | "high" | "medium" | "low";
export type ComplianceType =
  | "gdpr"
  | "data_residency"
  | "provider_agreement"
  | "security_policy";
export type VulnerabilityCategory =
  | "authentication"
  | "authorization"
  | "data_protection"
  | "network_security"
  | "configuration"
  | "injection";
export type ScanDepth = "basic" | "standard" | "comprehensive";
export type ReportFormat = "summary" | "detailed" | "executive";
