/**
 * Types for Threat Detection Engine
 */
export interface ThreatDetectionRequest {
  promptId: string;
  userId: string;
  templateId?: string;
  prompt: string;
  output?: string;
  metadata?: {
    provider: 'claude' | 'gemini' | 'other';
    model: string;
    tokenCount?: number;
    responseTime?: number;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  };
  context?: {
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
  };
}

export interface ThreatDetectionResult {
  promptId: string;
  threatLevel: ThreatLevel;
  overallScore: number;
  threats: ThreatIssue[];
  responseAction: ResponseAction;
  recommendations: string[];
  processingTime: number;
  timestamp: string;
}

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export type ResponseAction = 
  | 'allow'
  | 'log'
  | 'notify'
  | 'quarantine'
  | 'block'
  | 'emergency_stop';

export interface ThreatIssue {
  type: ThreatType;
  severity: ThreatLevel;
  confidence: number;
  description: string;
  evidence: string[];
  location?: {
    start: number;
    end: number;
    context: string;
  };
  mitigation?: string;
  cweId?: string;
  owaspCategory?: string;
}

export type ThreatType = 
  | 'prompt_injection'
  | 'prompt_leak'
  | 'jailbreak_attempt'
  | 'hallucination_risk'
  | 'pii_exposure'
  | 'malicious_content'
  | 'anomalous_behavior'
  | 'token_abuse'
  | 'rate_limit_violation'
  | 'unauthorized_access'
  | 'data_exfiltration'
  | 'model_manipulation';

export interface ThreatPattern {
  id: string;
  name: string;
  type: ThreatType;
  severity: ThreatLevel;
  patterns: PatternRule[];
  enabled: boolean;
  description: string;
  lastUpdated: string;
  falsePositiveRate?: number;
  detectionRate?: number;
}

export interface PatternRule {
  type: 'regex' | 'keyword' | 'semantic' | 'statistical' | 'ml_model';
  pattern: string;
  weight: number;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  context?: 'prompt' | 'output' | 'both';
  threshold?: number;
}

export interface BehavioralAnalysis {
  tokenUsageAnomaly: boolean;
  responseTimeAnomaly: boolean;
  frequencyAnomaly: boolean;
  patternAnomaly: boolean;
  userBehaviorScore: number;
  sessionRiskScore: number;
  historicalComparison: {
    avgTokens: number;
    avgResponseTime: number;
    typicalPatterns: string[];
  };
}

export interface MLDetectionResult {
  modelName: string;
  confidence: number;
  prediction: 'safe' | 'suspicious' | 'malicious';
  features: Record<string, number>;
  explanation?: string;
}

export interface SecurityMetrics {
  promptId: string;
  userId: string;
  templateId?: string;
  timestamp: string;
  threatLevel: ThreatLevel;
  threatTypes: ThreatType[];
  responseAction: ResponseAction;
  processingTime: number;
  falsePositive?: boolean;
  userFeedback?: 'helpful' | 'false_positive' | 'missed_threat';
  metadata: {
    provider: string;
    model: string;
    tokenCount: number;
    responseTime: number;
    sessionId?: string;
    ipAddress?: string;
  };
}

export interface ThreatAlert {
  id: string;
  promptId: string;
  userId: string;
  threatLevel: ThreatLevel;
  threatTypes: ThreatType[];
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  escalated: boolean;
  escalatedTo?: string[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface QuarantineEntry {
  id: string;
  promptId: string;
  userId: string;
  prompt: string;
  output?: string;
  threatLevel: ThreatLevel;
  threats: ThreatIssue[];
  quarantinedAt: string;
  quarantinedBy: string;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'escalated';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  releaseScheduled?: string;
  autoReleaseEnabled: boolean;
}

export interface ThreatDetectionConfig {
  enabled: boolean;
  strictMode: boolean;
  realTimeAnalysis: boolean;
  mlDetectionEnabled: boolean;
  behavioralAnalysisEnabled: boolean;
  autoQuarantineEnabled: boolean;
  alertingEnabled: boolean;
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  responseActions: {
    low: ResponseAction;
    medium: ResponseAction;
    high: ResponseAction;
    critical: ResponseAction;
  };
  patterns: ThreatPattern[];
  whitelist: {
    users: string[];
    templates: string[];
    patterns: string[];
  };
  blacklist: {
    users: string[];
    patterns: string[];
    keywords: string[];
  };
}

export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  escalationRules: EscalationRule[];
  templates: NotificationTemplate[];
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'sns' | 'webhook' | 'sms';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
  threatLevels: ThreatLevel[];
}

export interface EscalationRule {
  id: string;
  name: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  enabled: boolean;
}

export interface EscalationCondition {
  type: 'threat_level' | 'threat_count' | 'time_window' | 'user_pattern';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  timeWindow?: number; // minutes
}

export interface EscalationAction {
  type: 'notify' | 'block_user' | 'emergency_stop' | 'create_incident';
  config: Record<string, any>;
  delay?: number; // minutes
}

export interface NotificationTemplate {
  id: string;
  name: string;
  threatLevel: ThreatLevel;
  subject: string;
  body: string;
  variables: string[];
}

export interface ThreatIntelligence {
  id: string;
  type: 'ioc' | 'pattern' | 'signature' | 'behavior';
  value: string;
  threatTypes: ThreatType[];
  severity: ThreatLevel;
  source: string;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  description: string;
  references: string[];
  active: boolean;
}

export interface UserRiskProfile {
  userId: string;
  riskScore: number;
  riskLevel: ThreatLevel;
  factors: RiskFactor[];
  lastUpdated: string;
  threatHistory: ThreatHistoryEntry[];
  behaviorProfile: BehaviorProfile;
  restrictions: UserRestriction[];
}

export interface RiskFactor {
  type: string;
  score: number;
  weight: number;
  description: string;
  evidence: string[];
}

export interface ThreatHistoryEntry {
  timestamp: string;
  threatType: ThreatType;
  severity: ThreatLevel;
  promptId: string;
  resolved: boolean;
}

export interface BehaviorProfile {
  avgTokensPerPrompt: number;
  avgPromptsPerSession: number;
  commonPatterns: string[];
  preferredModels: string[];
  typicalResponseTimes: number[];
  anomalyThreshold: number;
  lastAnalyzed: string;
}

export interface UserRestriction {
  type: 'rate_limit' | 'model_access' | 'feature_block' | 'quarantine';
  value: any;
  reason: string;
  appliedAt: string;
  appliedBy: string;
  expiresAt?: string;
  active: boolean;
}

export interface ThreatDetectionStats {
  period: string;
  totalPrompts: number;
  threatsDetected: number;
  threatsByLevel: Record<ThreatLevel, number>;
  threatsByType: Record<ThreatType, number>;
  responseActions: Record<ResponseAction, number>;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  avgProcessingTime: number;
  topThreats: Array<{
    type: ThreatType;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  topUsers: Array<{
    userId: string;
    threatCount: number;
    riskScore: number;
  }>;
}

export interface ModelPerformanceMetrics {
  modelName: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  avgInferenceTime: number;
  totalPredictions: number;
  lastUpdated: string;
  confusionMatrix: number[][];
  featureImportance: Record<string, number>;
}

export interface ThreatDetectionAudit {
  id: string;
  timestamp: string;
  action: 'detection' | 'quarantine' | 'release' | 'escalation' | 'config_change';
  actor: string;
  promptId?: string;
  userId?: string;
  details: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
  errorMessage?: string;
}

export interface EmergencyResponse {
  id: string;
  triggeredAt: string;
  triggeredBy: string;
  reason: string;
  threatLevel: ThreatLevel;
  affectedUsers: string[];
  affectedSystems: string[];
  actions: EmergencyAction[];
  status: 'active' | 'resolved' | 'escalated';
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

export interface EmergencyAction {
  type: 'system_shutdown' | 'user_block' | 'service_disable' | 'alert_all';
  timestamp: string;
  status: 'pending' | 'executed' | 'failed';
  result?: string;
  error?: string;
}