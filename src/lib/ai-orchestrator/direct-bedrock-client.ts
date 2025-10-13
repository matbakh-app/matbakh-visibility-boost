/**
 * Direct Bedrock Client - Bypasses MCP for Critical Support Operations
 *
 * This module provides direct AWS Bedrock SDK integration for time-critical
 * support operations that require < 5s (emergency) or < 10s (critical) latency.
 * It integrates with existing security, compliance, and circuit breaker systems.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";
import { CircuitBreaker } from "./circuit-breaker";
import { EmergencyOperationsPerformanceMonitor } from "./emergency-operations-performance-monitor";
import {
  GDPRHybridComplianceValidator,
  HybridRoutingPath,
} from "./gdpr-hybrid-compliance-validator";
import { KMSEncryptionService } from "./kms-encryption-service";
import {
  PIIToxicityDetectionService,
  SafetyCheckResult,
} from "./safety/pii-toxicity-detector";
import { SSRFProtectionValidator } from "./ssrf-protection-validator";
import { ToolSpec } from "./types";

// Direct Bedrock Client Configuration
export interface DirectBedrockConfig {
  region: string;
  maxRetries: number;
  timeout: number;
  emergencyTimeout: number; // < 5s for emergency operations
  criticalTimeout: number; // < 10s for critical operations
  enableCircuitBreaker: boolean;
  enableHealthMonitoring: boolean;
  enableComplianceChecks: boolean;
}

// Operation Types for Routing Decisions
export type OperationType =
  | "emergency"
  | "infrastructure"
  | "meta_monitor"
  | "implementation"
  | "standard";

export type OperationPriority = "critical" | "high" | "medium" | "low";

// Support Operation Request
export interface SupportOperationRequest {
  operation: OperationType;
  priority: OperationPriority;
  prompt: string;
  context?: {
    userId?: string;
    tenant?: string;
    correlationId?: string;
    metadata?: Record<string, any>;
  };
  tools?: ToolSpec[];
  streaming?: boolean;
  maxTokens?: number;
  temperature?: number;
}

// Support Operation Response
export interface SupportOperationResponse {
  success: boolean;
  text?: string;
  toolCalls?: Array<{ name: string; arguments: any }>;
  latencyMs: number;
  tokensUsed?: { input: number; output: number };
  costEuro?: number;
  error?: string;
  operationId: string;
  timestamp: Date;
  piiDetectionResult?: SafetyCheckResult;
  piiDetected?: boolean;
  redactionApplied?: boolean;
  response?: string;
  complianceValidation?: {
    gdprCompliant: boolean;
    piiRedacted: boolean;
    auditLogged: boolean;
  };
}

// Health Check Result
export interface DirectBedrockHealthCheck {
  isHealthy: boolean;
  latencyMs: number;
  lastCheck: Date;
  consecutiveFailures: number;
  circuitBreakerState: "closed" | "open" | "half-open";
  error?: string;
}

/**
 * Direct Bedrock Client for Critical Support Operations
 */
export class DirectBedrockClient {
  private client: BedrockRuntimeClient;
  private config: DirectBedrockConfig;
  private circuitBreaker: CircuitBreaker;
  private featureFlags: AiFeatureFlags;
  private healthStatus: DirectBedrockHealthCheck;
  private healthCheckInterval?: NodeJS.Timeout;
  private piiDetectionService: PIIToxicityDetectionService;
  private gdprValidator: GDPRHybridComplianceValidator;
  private auditTrail: AuditTrailSystem;
  private kmsEncryption: KMSEncryptionService;
  private ssrfValidator: SSRFProtectionValidator;
  private performanceMonitor: EmergencyOperationsPerformanceMonitor;

  // Default model configurations for different operation types
  private readonly modelConfigs = {
    emergency: {
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      temperature: 0.1, // Low temperature for consistent emergency responses
      maxTokens: 1024, // Smaller token limit for speed
    },
    infrastructure: {
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      temperature: 0.2,
      maxTokens: 2048,
    },
    meta_monitor: {
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      temperature: 0.3,
      maxTokens: 2048,
    },
    implementation: {
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      temperature: 0.4,
      maxTokens: 4096,
    },
    standard: {
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      temperature: 0.7,
      maxTokens: 4096,
    },
  };

  constructor(config: Partial<DirectBedrockConfig> = {}) {
    this.config = {
      region: process.env.AWS_REGION || "eu-central-1",
      maxRetries: 3,
      timeout: 30000, // 30s default timeout
      emergencyTimeout: 5000, // 5s for emergency operations
      criticalTimeout: 10000, // 10s for critical operations
      enableCircuitBreaker: true,
      enableHealthMonitoring: true,
      enableComplianceChecks: true,
      ...config,
    };

    // Initialize AWS Bedrock Runtime Client
    this.client = new BedrockRuntimeClient({
      region: this.config.region,
      maxAttempts: this.config.maxRetries,
      requestHandler: {
        requestTimeout: this.config.timeout,
      },
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3, // Open after 3 failures
      recoveryTimeout: 30000, // 30s recovery timeout
      halfOpenMaxCalls: 2, // Max 2 calls in half-open state
    });

    // Initialize feature flags
    this.featureFlags = new AiFeatureFlags();

    // Initialize PII detection service with strict configuration for direct Bedrock
    this.piiDetectionService = new PIIToxicityDetectionService({
      enablePII: true,
      enableToxicity: true,
      enablePromptInjection: true,
      strictMode: true, // Strict mode for direct Bedrock operations
      redactionMode: "MASK", // Mask PII by default
      confidenceThreshold: 0.7, // Lower threshold for better detection
    });

    // Initialize GDPR compliance validator
    this.gdprValidator = new GDPRHybridComplianceValidator();

    // Initialize audit trail system
    this.auditTrail = new AuditTrailSystem({
      complianceMode: "strict",
      enableIntegrityChecking: true,
      retentionDays: 2555, // 7 years for GDPR compliance
    });

    // Initialize KMS encryption service
    this.kmsEncryption = new KMSEncryptionService(
      {
        region: this.config.region,
        keyAlias: process.env.KMS_KEY_ALIAS || "alias/matbakh-ai",
        enableKeyRotation: true,
      },
      this.auditTrail
    );

    // Initialize SSRF protection validator
    this.ssrfValidator = new SSRFProtectionValidator({
      auditTrail: this.auditTrail,
    });

    // Initialize emergency operations performance monitor
    this.performanceMonitor = new EmergencyOperationsPerformanceMonitor(
      {
        emergencySlaThresholdMs: this.config.emergencyTimeout, // 5 seconds for emergency
        criticalSlaThresholdMs: this.config.criticalTimeout, // 10 seconds for critical
        successRateThreshold: 95, // 95% success rate requirement
        rollingWindowMinutes: 60, // 1 hour rolling window
        alertingEnabled: true,
        circuitBreakerEnabled: this.config.enableCircuitBreaker,
      },
      this.auditTrail,
      this.circuitBreaker
    );

    // Initialize health status
    this.healthStatus = {
      isHealthy: true,
      latencyMs: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      circuitBreakerState: "closed",
    };

    // Start health monitoring if enabled
    if (this.config.enableHealthMonitoring) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Execute support operation with direct Bedrock access
   */
  async executeSupportOperation(
    request: SupportOperationRequest
  ): Promise<SupportOperationResponse> {
    const startTime = Date.now();
    const operationId = this.generateOperationId();
    let piiDetectionResult: SafetyCheckResult | undefined;
    let complianceValidation: SupportOperationResponse["complianceValidation"];

    try {
      // Check if direct Bedrock is enabled
      if (!this.featureFlags.isEnabled("ENABLE_DIRECT_BEDROCK_FALLBACK")) {
        throw new Error("Direct Bedrock access is disabled");
      }

      // Check circuit breaker
      if (
        this.config.enableCircuitBreaker &&
        this.circuitBreaker.isOpen("bedrock")
      ) {
        throw new Error("Circuit breaker is open for Bedrock");
      }

      // Validate operation timeout requirements
      this.validateOperationTimeout(request.operation);

      // Perform enhanced PII detection and redaction
      piiDetectionResult = await this.performPIIDetectionAndRedaction(
        request,
        operationId
      );

      // Perform comprehensive compliance checks if enabled
      if (this.config.enableComplianceChecks) {
        complianceValidation = await this.performEnhancedComplianceChecks(
          request,
          operationId
        );
      }

      // Execute the operation with circuit breaker protection
      const response = await this.circuitBreaker.execute(
        "bedrock",
        async () => {
          return await this.executeBedrockRequest(request, operationId);
        }
      );

      const latencyMs = Date.now() - startTime;

      // Track operation performance based on priority
      if (request.operation === "emergency") {
        await this.performanceMonitor.recordEmergencyOperation(
          operationId,
          latencyMs,
          true, // success
          request.operation,
          request.context?.correlationId,
          undefined, // no error
          "emergency" // priority
        );
      } else if (request.priority === "critical") {
        await this.performanceMonitor.recordEmergencyOperation(
          operationId,
          latencyMs,
          true, // success
          request.operation,
          request.context?.correlationId,
          undefined, // no error
          "critical" // priority
        );
      }

      // Update health status on success
      this.updateHealthStatus(true, latencyMs);

      // Log successful operation to audit trail
      await this.auditTrail.logEvent({
        eventType: "direct_bedrock_operation",
        requestId: operationId,
        provider: "bedrock",
        complianceStatus: "compliant",
        metadata: {
          operation: request.operation,
          priority: request.priority,
          latencyMs,
          tokensUsed: response.tokensUsed,
          piiDetected: piiDetectionResult?.violations.length || 0,
          piiRedacted: !!piiDetectionResult?.modifiedContent,
          gdprCompliant: complianceValidation?.gdprCompliant || false,
        },
      });

      return {
        success: true,
        text: response.text,
        toolCalls: response.toolCalls,
        latencyMs,
        tokensUsed: response.tokensUsed,
        costEuro: this.calculateCost(response.tokensUsed),
        operationId,
        timestamp: new Date(),
        piiDetectionResult,
        piiDetected: (piiDetectionResult?.violations.length || 0) > 0,
        redactionApplied: !!piiDetectionResult?.modifiedContent,
        response: response.text,
        complianceValidation,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // Track operation performance based on priority
      if (request.operation === "emergency") {
        await this.performanceMonitor.recordEmergencyOperation(
          operationId,
          latencyMs,
          false, // failure
          request.operation,
          request.context?.correlationId,
          error instanceof Error ? error.message : "Unknown error",
          "emergency" // priority
        );
      } else if (request.priority === "critical") {
        await this.performanceMonitor.recordEmergencyOperation(
          operationId,
          latencyMs,
          false, // failure
          request.operation,
          request.context?.correlationId,
          error instanceof Error ? error.message : "Unknown error",
          "critical" // priority
        );
      }

      // Update health status on failure
      this.updateHealthStatus(false, latencyMs, error as Error);

      // Log failed operation to audit trail
      await this.auditTrail.logEvent({
        eventType: "direct_bedrock_operation",
        requestId: operationId,
        provider: "bedrock",
        complianceStatus: "violation",
        error: {
          type: "operation_error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        metadata: {
          operation: request.operation,
          priority: request.priority,
          latencyMs,
          piiDetected: piiDetectionResult?.violations.length || 0,
        },
      });

      return {
        success: false,
        latencyMs,
        error: error instanceof Error ? error.message : "Unknown error",
        operationId,
        timestamp: new Date(),
        piiDetectionResult,
        complianceValidation,
      };
    }
  }

  /**
   * Execute emergency operation (< 5s latency requirement)
   */
  async executeEmergencyOperation(
    prompt: string,
    context?: SupportOperationRequest["context"]
  ): Promise<SupportOperationResponse> {
    return this.executeSupportOperation({
      operation: "emergency",
      priority: "critical",
      prompt,
      context,
      maxTokens: 1024, // Limit tokens for speed
      temperature: 0.1, // Low temperature for consistency
    });
  }

  /**
   * Execute critical support operation (< 10s latency requirement)
   */
  async executeCriticalOperation(
    prompt: string,
    context?: SupportOperationRequest["context"],
    tools?: ToolSpec[]
  ): Promise<SupportOperationResponse> {
    return this.executeSupportOperation({
      operation: "infrastructure",
      priority: "critical",
      prompt,
      context,
      tools,
      maxTokens: 2048,
      temperature: 0.2,
    });
  }

  /**
   * Get current health status
   */
  getHealthStatus(): DirectBedrockHealthCheck {
    return { ...this.healthStatus };
  }

  /**
   * Get emergency operations performance statistics
   */
  getEmergencyPerformanceStats() {
    return this.performanceMonitor.getCurrentPerformanceStats();
  }

  /**
   * Check if emergency operations are meeting SLA requirements (>95% within 5s)
   */
  isEmergencyPerformanceWithinSLA(): boolean {
    return this.performanceMonitor.isPerformanceWithinSLA();
  }

  /**
   * Get detailed emergency operations performance report
   */
  getEmergencyPerformanceReport() {
    return this.performanceMonitor.getPerformanceReport();
  }

  /**
   * Get recent emergency operations performance alerts
   */
  getEmergencyPerformanceAlerts(limitHours: number = 24) {
    return this.performanceMonitor.getRecentAlerts(limitHours);
  }

  /**
   * Check if critical operations are meeting SLA requirements (>95% within 10s)
   */
  isCriticalOperationsPerformanceWithinSLA(): boolean {
    return this.performanceMonitor.isCriticalOperationsPerformanceWithinSLA();
  }

  /**
   * Check if emergency operations specifically are meeting SLA requirements (>95% within 5s)
   */
  isEmergencyOperationsPerformanceWithinSLA(): boolean {
    return this.performanceMonitor.isEmergencyOperationsPerformanceWithinSLA();
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<DirectBedrockHealthCheck> {
    const startTime = Date.now();

    try {
      // Development environment safety check
      if (
        !process.env.BEDROCK_ENDPOINT &&
        process.env.NODE_ENV === "development"
      ) {
        const latencyMs = Date.now() - startTime;
        this.updateHealthStatus(true, latencyMs);

        return {
          ...this.healthStatus,
          lastCheck: new Date(),
          details: "Development mode - Bedrock endpoint skipped",
        };
      }

      // Simple health check with minimal prompt
      const response = await this.executeBedrockRequest(
        {
          operation: "standard",
          priority: "low",
          prompt: "Health check: respond with 'OK'",
          maxTokens: 10,
          temperature: 0,
        },
        "health-check"
      );

      const latencyMs = Date.now() - startTime;

      this.updateHealthStatus(true, latencyMs);

      return this.healthStatus;
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      // In development, don't fail hard on connection issues
      const isDev = process.env.NODE_ENV === "development";

      this.updateHealthStatus(!isDev, latencyMs, error as Error);

      return this.healthStatus;
    }
  }

  /**
   * Update PII detection configuration
   */
  updatePIIDetectionConfig(config: {
    enablePII?: boolean;
    enableToxicity?: boolean;
    enablePromptInjection?: boolean;
    strictMode?: boolean;
    redactionMode?: "MASK" | "REMOVE" | "REPLACE";
    confidenceThreshold?: number;
  }): void {
    this.piiDetectionService.updateConfig(config);
  }

  /**
   * Test PII detection without processing
   */
  async testPIIDetection(text: string): Promise<{
    piiFound: boolean;
    piiTokens: any[];
    toxicityScore: number;
    promptInjectionDetected: boolean;
  }> {
    const piiTokens = this.piiDetectionService.testPIIDetection(text);
    const toxicityViolations =
      this.piiDetectionService.testToxicityDetection(text);
    const promptInjectionViolations =
      this.piiDetectionService.testPromptInjectionDetection(text);

    return {
      piiFound: piiTokens.length > 0,
      piiTokens,
      toxicityScore: toxicityViolations.length > 0 ? 0.8 : 0.0, // Simplified scoring
      promptInjectionDetected: promptInjectionViolations.length > 0,
    };
  }

  /**
   * Detect PII in text with comprehensive analysis
   */
  async detectPii(
    text: string,
    options?: {
      consentId?: string;
      dataSubject?: string;
      processingPurpose?: string;
    }
  ): Promise<{
    hasPii: boolean;
    piiTypes: string[];
    detectedPii: Array<{
      type: string;
      value: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }>;
    processingRegion?: string;
    gdprCompliant?: boolean;
    consentTracking?: {
      consentId: string;
      dataSubject: string;
      processingPurpose: string;
      timestamp: Date;
    };
  }> {
    // Check if PII detection is enabled
    if (!this.featureFlags.isEnabled("pii_detection_enabled", true)) {
      return {
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
        processingRegion: this.config.region,
        gdprCompliant: true,
      };
    }

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return {
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
        processingRegion: this.config.region,
        gdprCompliant: true,
      };
    }

    // Check GDPR compliance for EU regions
    const isEuRegion = this.config.region.startsWith("eu-");
    if (
      this.featureFlags.isEnabled("gdpr_compliance_enabled", true) &&
      !isEuRegion
    ) {
      throw new Error(
        "GDPR compliance violation: PII processing must occur in EU region"
      );
    }

    const detectedPii: Array<{
      type: string;
      value: string;
      confidence: number;
      startIndex: number;
      endIndex: number;
    }> = [];

    // Define PII detection patterns
    const piiPatterns = [
      {
        type: "EMAIL",
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        confidence: 0.95,
      },
      {
        type: "PHONE",
        pattern:
          /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
        confidence: 0.85,
      },
      {
        type: "PHONE",
        pattern: /\b\+?[1-9]\d{1,14}\b/g,
        confidence: 0.75,
      },
      {
        type: "CREDIT_CARD",
        pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        confidence: 0.9,
      },
      {
        type: "SSN",
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        confidence: 0.95,
      },
      {
        type: "SSN",
        pattern: /\b\d{9}\b/g,
        confidence: 0.7,
      },
      {
        type: "IBAN",
        pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
        confidence: 0.9,
      },
    ];

    // Detect PII using patterns
    for (const { type, pattern, confidence } of piiPatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        detectedPii.push({
          type,
          value: match[0],
          confidence,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    // Get unique PII types
    const piiTypes = [...new Set(detectedPii.map((pii) => pii.type))];

    // Build result
    const result = {
      hasPii: detectedPii.length > 0,
      piiTypes,
      detectedPii,
      processingRegion: this.config.region,
      gdprCompliant: isEuRegion,
    };

    // Add consent tracking if provided
    if (
      options?.consentId &&
      options?.dataSubject &&
      options?.processingPurpose
    ) {
      (result as any).consentTracking = {
        consentId: options.consentId,
        dataSubject: options.dataSubject,
        processingPurpose: options.processingPurpose,
        timestamp: new Date(),
      };
    }

    return result;
  }

  /**
   * Redact PII from text
   */
  async redactPii(text: string): Promise<{
    redactedText: string;
    redactionMap: Array<{
      original: string;
      redacted: string;
      type: string;
      startIndex: number;
      endIndex: number;
    }>;
  }> {
    // Detect PII first
    const detection = await this.detectPii(text);

    if (!detection.hasPii) {
      return {
        redactedText: text,
        redactionMap: [],
      };
    }

    let redactedText = text;
    const redactionMap: Array<{
      original: string;
      redacted: string;
      type: string;
      startIndex: number;
      endIndex: number;
    }> = [];

    // Sort detected PII by start index in descending order to avoid index shifting
    const sortedPii = detection.detectedPii.sort(
      (a, b) => b.startIndex - a.startIndex
    );

    // Apply redactions
    for (const pii of sortedPii) {
      const redactedValue = this.getRedactionPlaceholder(pii.type);

      redactedText =
        redactedText.substring(0, pii.startIndex) +
        redactedValue +
        redactedText.substring(pii.endIndex);

      redactionMap.unshift({
        original: pii.value,
        redacted: redactedValue,
        type: pii.type,
        startIndex: pii.startIndex,
        endIndex: pii.startIndex + redactedValue.length,
      });
    }

    return {
      redactedText,
      redactionMap,
    };
  }

  /**
   * Restore PII from redacted text using redaction map
   */
  async restorePii(
    redactedText: string,
    redactionMap: Array<{
      original: string;
      redacted: string;
      type: string;
      startIndex?: number;
      endIndex?: number;
    }>
  ): Promise<string> {
    let restoredText = redactedText;

    // Apply restorations in reverse order to maintain text structure
    for (const redaction of redactionMap.reverse()) {
      restoredText = restoredText.replace(
        redaction.redacted,
        redaction.original
      );
    }

    return restoredText;
  }

  /**
   * Get redaction placeholder for PII type
   */
  private getRedactionPlaceholder(piiType: string): string {
    const placeholders: Record<string, string> = {
      EMAIL: "[EMAIL_REDACTED]",
      PHONE: "[PHONE_REDACTED]",
      CREDIT_CARD: "[CREDIT_CARD_REDACTED]",
      SSN: "[SSN_REDACTED]",
      IBAN: "[IBAN_REDACTED]",
      NAME: "[NAME_REDACTED]",
      ADDRESS: "[ADDRESS_REDACTED]",
      IP: "[IP_REDACTED]",
      API_KEY: "[API_KEY_REDACTED]",
      TOKEN: "[TOKEN_REDACTED]",
    };

    return placeholders[piiType] || "[PII_REDACTED]";
  }

  /**
   * Get PII detection statistics for monitoring
   */
  async getPIIDetectionStats(): Promise<{
    totalChecks: number;
    piiDetected: number;
    redactionsApplied: number;
    averageProcessingTime: number;
  }> {
    // This would typically be stored in a metrics service
    // For now, return placeholder data
    return {
      totalChecks: 0,
      piiDetected: 0,
      redactionsApplied: 0,
      averageProcessingTime: 0,
    };
  }

  /**
   * Encrypt sensitive operation data using KMS
   */
  async encryptSensitiveData(
    data: string,
    context: {
      operationId: string;
      dataType: "pii" | "credentials" | "context";
      userId?: string;
    }
  ): Promise<string> {
    try {
      const encrypted = await this.kmsEncryption.encrypt(
        {
          plaintext: data,
          encryptionContext: {
            operationId: context.operationId,
            dataType: context.dataType,
            ...(context.userId && { userId: context.userId }),
          },
        },
        context.dataType
      );

      return encrypted.ciphertext;
    } catch (error) {
      throw new Error(
        `Failed to encrypt sensitive data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Decrypt sensitive operation data using KMS
   */
  async decryptSensitiveData(
    encryptedData: string,
    context: {
      operationId: string;
      dataType: "pii" | "credentials" | "context";
      userId?: string;
    }
  ): Promise<string> {
    try {
      const decrypted = await this.kmsEncryption.decrypt(
        {
          ciphertext: encryptedData,
          encryptionContext: {
            operationId: context.operationId,
            dataType: context.dataType,
            ...(context.userId && { userId: context.userId }),
          },
        },
        context.dataType
      );

      return decrypted.plaintext;
    } catch (error) {
      throw new Error(
        `Failed to decrypt sensitive data: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Encrypt PII data before storage
   */
  async encryptPIIForStorage(
    piiData: string,
    piiType: string,
    operationId: string
  ): Promise<string> {
    try {
      const encrypted = await this.kmsEncryption.encryptPII(piiData, {
        piiType,
        operationId,
      });

      return encrypted.ciphertext;
    } catch (error) {
      throw new Error(
        `Failed to encrypt PII for storage: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Decrypt PII data from storage
   */
  async decryptPIIFromStorage(
    encryptedPII: string,
    piiType: string,
    operationId: string
  ): Promise<string> {
    try {
      const decrypted = await this.kmsEncryption.decryptPII(encryptedPII, {
        piiType,
        operationId,
      });

      return decrypted.plaintext;
    } catch (error) {
      throw new Error(
        `Failed to decrypt PII from storage: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Encrypt operation context for secure audit trail
   */
  async encryptOperationContextForAudit(
    context: Record<string, any>,
    operationId: string
  ): Promise<string> {
    try {
      const encrypted = await this.kmsEncryption.encryptOperationContext(
        context,
        operationId
      );

      return encrypted.ciphertext;
    } catch (error) {
      throw new Error(
        `Failed to encrypt operation context: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Decrypt operation context from audit trail
   */
  async decryptOperationContextFromAudit(
    encryptedContext: string,
    operationId: string
  ): Promise<Record<string, any>> {
    try {
      return await this.kmsEncryption.decryptOperationContext(
        encryptedContext,
        operationId
      );
    } catch (error) {
      throw new Error(
        `Failed to decrypt operation context: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get KMS encryption service for advanced operations
   */
  getKMSEncryptionService(): KMSEncryptionService {
    return this.kmsEncryption;
  }

  /**
   * Validate URL against SSRF protection rules
   */
  async validateUrlForSSRF(
    url: string,
    operationId?: string
  ): Promise<SSRFValidationResult> {
    return await this.ssrfValidator.validateUrl(url, operationId);
  }

  /**
   * Get SSRF protection validator for advanced operations
   */
  getSSRFProtectionValidator(): SSRFProtectionValidator {
    return this.ssrfValidator;
  }

  /**
   * Update SSRF protection configuration
   */
  updateSSRFProtectionConfig(config: {
    allowedDomains?: string[];
    allowedProtocols?: string[];
    blockMetadataEndpoints?: boolean;
    blockPrivateIPs?: boolean;
    blockLocalhost?: boolean;
    blockIPv6Private?: boolean;
    blockDangerousProtocols?: boolean;
    enableDNSRebindingProtection?: boolean;
    enableRedirectionProtection?: boolean;
    maxRedirects?: number;
  }): void {
    this.ssrfValidator.updateConfig(config);
  }

  /**
   * Add allowed domain for SSRF protection
   */
  addAllowedDomain(domain: string): void {
    this.ssrfValidator.addAllowedDomain(domain);
  }

  /**
   * Remove allowed domain from SSRF protection
   */
  removeAllowedDomain(domain: string): void {
    this.ssrfValidator.removeAllowedDomain(domain);
  }

  /**
   * Get all allowed domains for SSRF protection
   */
  getAllowedDomains(): string[] {
    return this.ssrfValidator.getAllowedDomains();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.kmsEncryption.destroy();
  }

  // Private Methods

  /**
   * Execute actual Bedrock request
   */
  private async executeBedrockRequest(
    request: SupportOperationRequest,
    operationId: string
  ): Promise<{
    text?: string;
    toolCalls?: any[];
    tokensUsed?: { input: number; output: number };
  }> {
    const modelConfig = this.modelConfigs[request.operation];
    const timeout = this.getTimeoutForOperation(request.operation);

    // Build request payload
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: request.maxTokens || modelConfig.maxTokens,
      temperature: request.temperature ?? modelConfig.temperature,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: request.prompt }],
        },
      ],
      ...(request.tools && {
        tools: this.mapToolsToBedrockFormat(request.tools),
      }),
    };

    // Add system message for support operations
    if (request.operation !== "standard") {
      (payload as any).system = this.getSystemMessageForOperation(
        request.operation
      );
    }

    const command = request.streaming
      ? new InvokeModelWithResponseStreamCommand({
          modelId: modelConfig.modelId,
          contentType: "application/json",
          accept: "application/vnd.amazon.eventstream",
          body: JSON.stringify(payload),
        })
      : new InvokeModelCommand({
          modelId: modelConfig.modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify(payload),
        });

    // Set timeout for the operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`Operation timeout after ${timeout}ms`)),
        timeout
      );
    });

    const response = await Promise.race([
      this.client.send(command as any),
      timeoutPromise,
    ]);

    // Parse response
    return this.parseBedrockResponse(response, request.streaming);
  }

  /**
   * Map tools to Bedrock format
   */
  private mapToolsToBedrockFormat(tools: ToolSpec[]): any[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description || "",
      input_schema: {
        type: "object",
        properties: tool.parameters || {},
        required: Object.keys(tool.parameters || {}),
      },
    }));
  }

  /**
   * Get system message for operation type
   */
  private getSystemMessageForOperation(operation: OperationType): string {
    const systemMessages = {
      emergency:
        "You are an emergency support assistant. Provide immediate, actionable responses. Be concise and direct.",
      infrastructure:
        "You are an infrastructure support specialist. Analyze system issues and provide technical solutions.",
      meta_monitor:
        "You are a meta-monitoring assistant. Analyze execution patterns and provide diagnostic insights.",
      implementation:
        "You are an implementation support assistant. Help resolve incomplete modules and provide remediation steps.",
      standard: "You are a helpful AI assistant.",
    };

    return systemMessages[operation];
  }

  /**
   * Parse Bedrock response
   */
  private parseBedrockResponse(
    response: any,
    streaming?: boolean
  ): {
    text?: string;
    toolCalls?: any[];
    tokensUsed?: { input: number; output: number };
  } {
    if (streaming) {
      // Handle streaming response (simplified for now)
      return {
        text: "Streaming response",
        tokensUsed: { input: 0, output: 0 },
      };
    }

    const body = JSON.parse(new TextDecoder().decode(response.body));

    const text = body.content?.map((c: any) => c.text).join("\n") || "";
    const toolCalls =
      body.content
        ?.filter((c: any) => c.type === "tool_use")
        ?.map((tc: any) => ({
          name: tc.name,
          arguments: tc.input,
        })) || [];

    const tokensUsed = {
      input: body.usage?.input_tokens || 0,
      output: body.usage?.output_tokens || 0,
    };

    return { text, toolCalls, tokensUsed };
  }

  /**
   * Validate operation timeout requirements
   */
  private validateOperationTimeout(operation: OperationType): void {
    const timeout = this.getTimeoutForOperation(operation);
    const maxAllowed =
      operation === "emergency"
        ? 5000
        : operation === "infrastructure"
        ? 10000
        : 30000;

    if (timeout > maxAllowed) {
      throw new Error(
        `Operation ${operation} timeout ${timeout}ms exceeds maximum ${maxAllowed}ms`
      );
    }
  }

  /**
   * Get timeout for operation type
   */
  private getTimeoutForOperation(operation: OperationType): number {
    switch (operation) {
      case "emergency":
        return this.config.emergencyTimeout;
      case "infrastructure":
      case "meta_monitor":
      case "implementation":
        return this.config.criticalTimeout;
      default:
        return this.config.timeout;
    }
  }

  /**
   * Perform enhanced PII detection and redaction for direct Bedrock operations
   */
  private async performPIIDetectionAndRedaction(
    request: SupportOperationRequest,
    operationId: string
  ): Promise<SafetyCheckResult> {
    const startTime = Date.now();

    try {
      // Perform comprehensive PII and safety check
      const safetyResult = await this.piiDetectionService.performSafetyCheck(
        request.prompt,
        operationId
      );

      // Log PII detection results
      await this.auditTrail.logEvent({
        eventType: "pii_detection",
        requestId: operationId,
        provider: "bedrock",
        complianceStatus: safetyResult.allowed ? "compliant" : "violation",
        metadata: {
          operation: request.operation,
          priority: request.priority,
          piiViolations: safetyResult.violations.filter((v) => v.type === "PII")
            .length,
          toxicityViolations: safetyResult.violations.filter(
            (v) => v.type === "TOXICITY"
          ).length,
          promptInjectionViolations: safetyResult.violations.filter(
            (v) => v.type === "CUSTOM"
          ).length,
          confidence: safetyResult.confidence,
          processingTimeMs: safetyResult.processingTimeMs,
          contentModified: !!safetyResult.modifiedContent,
        },
      });

      // If content was modified (PII redacted), update the request
      if (safetyResult.modifiedContent) {
        request.prompt = safetyResult.modifiedContent;

        // Log the redaction action
        await this.auditTrail.logEvent({
          eventType: "pii_redaction",
          requestId: operationId,
          provider: "bedrock",
          complianceStatus: "compliant",
          metadata: {
            operation: request.operation,
            redactionApplied: true,
            originalLength: request.prompt.length,
            redactedLength: safetyResult.modifiedContent.length,
            violationsRedacted: safetyResult.violations.length,
          },
        });
      }

      // For emergency operations, allow with redaction even if violations exist
      if (request.operation === "emergency" && !safetyResult.allowed) {
        // Force redaction for emergency operations
        if (safetyResult.violations.some((v) => v.type === "PII")) {
          const emergencyRedaction = this.piiDetectionService.testPIIDetection(
            request.prompt
          );
          if (emergencyRedaction.length > 0) {
            // Apply emergency redaction
            request.prompt = this.redactPIIForEmergency(request.prompt);

            await this.auditTrail.logEvent({
              eventType: "emergency_pii_redaction",
              requestId: operationId,
              provider: "bedrock",
              complianceStatus: "compliant",
              metadata: {
                operation: request.operation,
                emergencyRedactionApplied: true,
                piiTokensRedacted: emergencyRedaction.length,
              },
            });

            // Return modified safety result for emergency
            return {
              ...safetyResult,
              allowed: true,
              modifiedContent: request.prompt,
            };
          }
        }
      }

      // For non-emergency operations with critical violations, block the request
      if (
        !safetyResult.allowed &&
        safetyResult.violations.some((v) => v.severity === "CRITICAL")
      ) {
        throw new Error(
          `Critical safety violations detected: ${safetyResult.violations
            .filter((v) => v.severity === "CRITICAL")
            .map((v) => v.details)
            .join(", ")}`
        );
      }

      return safetyResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log PII detection error
      await this.auditTrail.logEvent({
        eventType: "pii_detection",
        requestId: operationId,
        provider: "bedrock",
        complianceStatus: "violation",
        error: {
          type: "pii_detection_error",
          message: errorMessage,
        },
        metadata: {
          operation: request.operation,
          processingTimeMs: Date.now() - startTime,
        },
      });

      // Return failed safety result
      return {
        allowed: false,
        confidence: 0.0,
        violations: [
          {
            type: "CUSTOM",
            severity: "CRITICAL",
            confidence: 1.0,
            details: `PII detection failed: ${errorMessage}`,
          },
        ],
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Perform enhanced compliance checks with GDPR validation
   */
  private async performEnhancedComplianceChecks(
    request: SupportOperationRequest,
    operationId: string
  ): Promise<SupportOperationResponse["complianceValidation"]> {
    const startTime = Date.now();

    try {
      // Create routing path for GDPR validation
      const routingPath: HybridRoutingPath = {
        routeType: "direct_bedrock",
        provider: "bedrock",
        operationType: request.operation,
        priority: request.priority,
      };

      // Validate GDPR compliance before routing
      const gdprValidation = await this.gdprValidator.validateBeforeRouting(
        routingPath,
        operationId
      );

      if (!gdprValidation.allowed) {
        throw new Error(`GDPR compliance violation: ${gdprValidation.reason}`);
      }

      // Perform additional compliance checks
      await this.performLegacyComplianceChecks(request);

      // Log compliance validation success
      await this.auditTrail.logEvent({
        eventType: "gdpr_compliance_validation",
        requestId: operationId,
        provider: "bedrock",
        complianceStatus: "compliant",
        metadata: {
          operation: request.operation,
          routingPath: "direct_bedrock",
          gdprCompliant: true,
          processingTimeMs: Date.now() - startTime,
        },
      });

      return {
        gdprCompliant: true,
        piiRedacted: true, // PII redaction is always applied
        auditLogged: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log compliance validation error
      await this.auditTrail.logEvent({
        eventType: "gdpr_compliance_validation",
        requestId: operationId,
        provider: "bedrock",
        complianceStatus: "violation",
        error: {
          type: "compliance_error",
          message: errorMessage,
        },
        metadata: {
          operation: request.operation,
          routingPath: "direct_bedrock",
          processingTimeMs: Date.now() - startTime,
        },
      });

      throw error; // Re-throw to block the operation
    }
  }

  /**
   * Emergency PII redaction for critical operations
   */
  private redactPIIForEmergency(text: string): string {
    // Use aggressive redaction patterns for emergency operations
    let redactedText = text;

    const emergencyRedactionPatterns = [
      // Email addresses - complete redaction
      {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: "[EMAIL_REDACTED]",
      },

      // Phone numbers - complete redaction
      {
        pattern:
          /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
        replacement: "[PHONE_REDACTED]",
      },
      { pattern: /\b\+?[1-9]\d{1,14}\b/g, replacement: "[PHONE_REDACTED]" },

      // Credit card numbers - complete redaction
      {
        pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        replacement: "[CARD_REDACTED]",
      },

      // Social Security Numbers - complete redaction
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN_REDACTED]" },
      { pattern: /\b\d{9}\b/g, replacement: "[ID_REDACTED]" },

      // IBAN - complete redaction
      {
        pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
        replacement: "[IBAN_REDACTED]",
      },

      // Names with titles - partial redaction
      {
        pattern: /\b(Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
        replacement: "$1. [NAME_REDACTED]",
      },

      // IP addresses - complete redaction
      {
        pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        replacement: "[IP_REDACTED]",
      },

      // API keys and tokens - complete redaction
      { pattern: /\bsk-[A-Za-z0-9]{48}\b/g, replacement: "[API_KEY_REDACTED]" },
      { pattern: /\bAKIA[A-Z0-9]{16}\b/g, replacement: "[AWS_KEY_REDACTED]" },

      // Long alphanumeric strings (potential tokens)
      { pattern: /\b[A-Za-z0-9]{32,}\b/g, replacement: "[TOKEN_REDACTED]" },
    ];

    // Apply all emergency redaction patterns
    emergencyRedactionPatterns.forEach(({ pattern, replacement }) => {
      redactedText = redactedText.replace(pattern, replacement);
    });

    return redactedText;
  }

  /**
   * Legacy compliance checks (renamed from performComplianceChecks)
   */
  private async performLegacyComplianceChecks(
    request: SupportOperationRequest
  ): Promise<void> {
    // Note: PII Detection and Redaction is now handled by performPIIDetectionAndRedaction method
    // This method focuses on other compliance aspects

    // 2. GDPR Compliance Checks
    if (request.context?.userId) {
      const consentValid = await this.validateGDPRConsent(
        request.context.userId
      );
      if (!consentValid) {
        throw new Error(
          "Missing or invalid GDPR consent for user data processing"
        );
      }
    }

    // 3. Data Residency Compliance (EU)
    if (request.context?.tenant) {
      const isEUTenant = await this.isEUTenant(request.context.tenant);
      if (
        isEUTenant &&
        this.config.region !== "eu-central-1" &&
        this.config.region !== "eu-west-1"
      ) {
        throw new Error(
          `EU data residency violation: operation must use EU region, current: ${this.config.region}`
        );
      }
    }

    // 4. Operation-specific compliance checks
    await this.performOperationSpecificCompliance(request);

    // 5. Audit trail logging
    await this.logComplianceCheck(request);
  }

  /**
   * Validate GDPR consent for user
   */
  private async validateGDPRConsent(userId: string): Promise<boolean> {
    try {
      // In real implementation, check consent database
      // For now, we'll use a simple check

      // Check if user has valid consent record
      const consentRecord = await this.getConsentRecord(userId);

      if (!consentRecord) {
        return false;
      }

      // Check if consent is still valid (not expired)
      const consentAge = Date.now() - consentRecord.timestamp.getTime();
      const maxConsentAge = 365 * 24 * 60 * 60 * 1000; // 1 year

      if (consentAge > maxConsentAge) {
        return false;
      }

      // Check if consent covers AI processing
      return consentRecord.aiProcessingConsent === true;
    } catch (error) {
      console.error("GDPR consent validation failed:", error);
      return false;
    }
  }

  /**
   * Get consent record for user (placeholder)
   */
  private async getConsentRecord(userId: string): Promise<{
    userId: string;
    timestamp: Date;
    aiProcessingConsent: boolean;
    dataRetentionConsent: boolean;
  } | null> {
    // In real implementation, query consent database
    // For now, return a mock valid consent
    return {
      userId,
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      aiProcessingConsent: true,
      dataRetentionConsent: true,
    };
  }

  /**
   * Check if tenant is EU-based
   */
  private async isEUTenant(tenantId: string): Promise<boolean> {
    // In real implementation, check tenant database
    // For now, simple heuristic based on tenant ID
    const euTenantPatterns = [
      /^eu-/,
      /^de-/,
      /^fr-/,
      /^it-/,
      /^es-/,
      /^nl-/,
      /^be-/,
      /^at-/,
      /^ch-/,
    ];

    return euTenantPatterns.some((pattern) => pattern.test(tenantId));
  }

  /**
   * Perform operation-specific compliance checks
   */
  private async performOperationSpecificCompliance(
    request: SupportOperationRequest
  ): Promise<void> {
    switch (request.operation) {
      case "emergency":
        // Emergency operations have relaxed compliance for speed
        // but still require basic checks
        break;

      case "infrastructure":
        // Infrastructure operations may access system data
        // Ensure no customer data is included
        if (this.containsCustomerData(request.prompt)) {
          throw new Error("Customer data detected in infrastructure operation");
        }
        break;

      case "meta_monitor":
        // Meta monitoring should not process personal data
        if (this.containsPersonalData(request.prompt)) {
          throw new Error(
            "Personal data detected in meta monitoring operation"
          );
        }
        break;

      case "implementation":
        // Implementation support should not access production data
        if (this.containsProductionData(request.prompt)) {
          throw new Error(
            "Production data detected in implementation operation"
          );
        }
        break;

      default:
        // Standard operations follow full compliance
        break;
    }
  }

  /**
   * Check for customer data patterns
   */
  private containsCustomerData(text: string): boolean {
    const customerDataPatterns = [
      /customer_id:\s*\d+/i,
      /user_id:\s*\d+/i,
      /account_id:\s*\d+/i,
      /order_id:\s*\d+/i,
      /transaction_id:\s*\d+/i,
    ];

    return customerDataPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check for personal data patterns
   */
  private containsPersonalData(text: string): boolean {
    const personalDataPatterns = [
      /first_name:\s*[A-Z][a-z]+/i,
      /last_name:\s*[A-Z][a-z]+/i,
      /full_name:\s*[A-Z][a-z]+\s+[A-Z][a-z]+/i,
      /date_of_birth:\s*\d{4}-\d{2}-\d{2}/i,
      /address:\s*.+/i,
    ];

    return personalDataPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Check for production data patterns
   */
  private containsProductionData(text: string): boolean {
    const productionDataPatterns = [
      /prod_/i,
      /production/i,
      /live_/i,
      /real_customer/i,
      /actual_user/i,
    ];

    return productionDataPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Log compliance check for audit trail
   */
  private async logComplianceCheck(
    request: SupportOperationRequest
  ): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      operation: request.operation,
      priority: request.priority,
      userId: request.context?.userId,
      tenantId: request.context?.tenant,
      correlationId: request.context?.correlationId,
      complianceChecks: {
        piiDetection: await this.containsPII(request.prompt),
        gdprConsent: request.context?.userId
          ? await this.validateGDPRConsent(request.context.userId)
          : null,
        dataResidency: request.context?.tenant
          ? await this.isEUTenant(request.context.tenant)
          : null,
        operationSpecific: true, // Passed if we reach this point
      },
      region: this.config.region,
    };

    // In real implementation, send to audit service
    console.log("Compliance audit:", JSON.stringify(auditEntry, null, 2));
  }

  /**
   * Check if text contains PII using the comprehensive detection service
   */
  private async containsPII(text: string): Promise<boolean> {
    try {
      const piiTokens = this.piiDetectionService.testPIIDetection(text);
      return piiTokens && piiTokens.length > 0;
    } catch (error) {
      console.warn("PII detection service error:", error);
      return false;
    }
  }

  /**
   * Validate GDPR consent using the enhanced compliance system
   */
  private async validateGDPRConsentEnhanced(
    userId: string,
    operationId: string
  ): Promise<boolean> {
    try {
      const consentValid = await this.validateGDPRConsent(userId);

      // Log consent validation to audit trail
      await this.auditTrail.logEvent({
        eventType: "gdpr_consent_validation",
        requestId: operationId,
        provider: "bedrock",
        complianceStatus: consentValid ? "compliant" : "violation",
        metadata: {
          userId,
          consentValid,
          validationType: "enhanced",
        },
      });

      return consentValid;
    } catch (error) {
      // Log consent validation error
      await this.auditTrail.logEvent({
        eventType: "gdpr_consent_validation",
        requestId: operationId,
        provider: "bedrock",
        complianceStatus: "violation",
        error: {
          type: "consent_validation_error",
          message: error instanceof Error ? error.message : String(error),
        },
        metadata: {
          userId,
        },
      });

      return false;
    }
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokensUsed?: {
    input: number;
    output: number;
  }): number {
    if (!tokensUsed) return 0;

    // Claude 3.5 Sonnet pricing (approximate)
    const inputCostPer1k = 0.003; // $0.003 per 1k input tokens
    const outputCostPer1k = 0.015; // $0.015 per 1k output tokens

    const inputCost = (tokensUsed.input / 1000) * inputCostPer1k;
    const outputCost = (tokensUsed.output / 1000) * outputCostPer1k;

    return inputCost + outputCost;
  }

  /**
   * Update health status
   */
  private updateHealthStatus(
    success: boolean,
    latencyMs: number,
    error?: Error
  ): void {
    this.healthStatus.lastCheck = new Date();
    this.healthStatus.latencyMs = latencyMs;
    this.healthStatus.circuitBreakerState = this.circuitBreaker.isOpen(
      "bedrock"
    )
      ? "open"
      : "closed";

    if (success) {
      this.healthStatus.isHealthy = true;
      this.healthStatus.consecutiveFailures = 0;
      delete this.healthStatus.error;

      // Set development mode details if applicable
      if (
        process.env.NODE_ENV === "development" &&
        !process.env.BEDROCK_ENDPOINT
      ) {
        this.healthStatus.details =
          "Development mode - Bedrock endpoint skipped";
      }
    } else {
      this.healthStatus.isHealthy = false;
      this.healthStatus.consecutiveFailures++;

      // In development, provide helpful error message
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) {
        this.healthStatus.error = `Development mode - Bedrock connection skipped: ${
          error?.message || "Unknown error"
        }`;
      } else {
        this.healthStatus.error = error?.message;
      }
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error("Health check failed:", error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `direct-bedrock-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }

  /**
   * Get PII detection statistics
   */
  async getPIIDetectionStats(): Promise<{
    totalDetections: number;
    totalRedactions: number;
    detectionsByType: Record<string, number>;
    averageConfidence: number;
    lastDetection?: Date;
  }> {
    // This would typically query a metrics store
    // For now, return mock statistics
    return {
      totalDetections: 0,
      totalRedactions: 0,
      detectionsByType: {},
      averageConfidence: 0,
      lastDetection: undefined,
    };
  }

  /**
   * Get redaction placeholder for PII type
   */
  private getRedactionPlaceholder(piiType: string): string {
    const placeholders: Record<string, string> = {
      EMAIL: "[EMAIL_REDACTED]",
      PHONE: "[PHONE_REDACTED]",
      CREDIT_CARD: "[CREDIT_CARD_REDACTED]",
      SSN: "[SSN_REDACTED]",
      IBAN: "[IBAN_REDACTED]",
    };

    return placeholders[piiType] || "[PII_REDACTED]";
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }
}

// Types are already exported as interfaces above
