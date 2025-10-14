/**
 * AI Operations Audit Trail System
 *
 * Comprehensive audit logging for all AI operations with GDPR compliance
 * Provides structured audit logs for compliance reporting and security monitoring
 */

import { BasicLogger } from "./basic-logger";
import { SafetyCheckResult } from "./safety/guardrails-service";
import { AiRequest, AiResponse, Provider, RouterInputContext } from "./types";

export type AuditEventType =
  | "ai_request_start"
  | "ai_request_complete"
  | "ai_request_error"
  | "provider_selection"
  | "provider_fallback"
  | "safety_check"
  | "pii_detection"
  | "content_filtering"
  | "cache_operation"
  | "cost_tracking"
  | "cost_optimization"
  | "cost_aware_routing"
  | "performance_metrics"
  | "compliance_violation"
  | "data_retention"
  | "user_consent"
  // Hybrid routing specific events
  | "hybrid_routing_decision"
  | "direct_bedrock_operation"
  | "mcp_routing_operation"
  | "intelligent_routing_fallback"
  | "route_health_check"
  | "routing_optimization"
  | "hybrid_compliance_validation"
  | "emergency_pii_redaction"
  | "gdpr_compliance_validation"
  | "pii_redaction"
  // MCP fallback reliability events
  | "mcp_fallback_initiation"
  | "mcp_fallback_completion"
  | "mcp_fallback_reliability_issue";

export type ComplianceStatus =
  | "compliant"
  | "violation"
  | "warning"
  | "pending";

export interface AuditEvent {
  // Core identification
  eventId: string;
  timestamp: string;
  eventType: AuditEventType;
  requestId: string;

  // User and context
  userId?: string;
  tenantId?: string;
  sessionId?: string;

  // AI operation details
  provider?: Provider;
  modelId?: string;
  operation?: string;

  // Content metadata (no actual content for privacy)
  contentHash?: string;
  contentLength?: number;
  contentType?: "prompt" | "response" | "tool_call" | "system_message";

  // Performance and cost
  latencyMs?: number;
  costEuro?: number;
  tokensUsed?: {
    input: number;
    output: number;
  };

  // Safety and compliance
  safetyCheckResult?: {
    allowed: boolean;
    confidence: number;
    violationTypes: string[];
    processingTimeMs: number;
  };

  // PII and data protection
  piiDetected?: boolean;
  piiTypes?: string[];
  dataClassification?: "public" | "internal" | "confidential" | "restricted";
  retentionPolicy?: string;

  // Compliance tracking
  complianceStatus: ComplianceStatus;
  gdprLawfulBasis?: string;
  consentId?: string;
  dataProcessingPurpose?: string;

  // Error handling
  error?: {
    type: string;
    message: string;
    code?: string;
  };

  // Hybrid routing specific fields
  routingDecision?: {
    selectedRoute: "direct" | "mcp";
    reason: string;
    fallbackAvailable: boolean;
    estimatedLatency: number;
    correlationId: string;
    primaryRouteHealth?: boolean;
    fallbackRouteHealth?: boolean;
  };

  // Route health information
  routeHealth?: {
    route: "direct" | "mcp";
    isHealthy: boolean;
    latencyMs: number;
    successRate: number;
    consecutiveFailures: number;
  };

  // Additional metadata
  metadata?: Record<string, any>;

  // Audit trail integrity
  previousEventHash?: string;
  eventHash: string;
}

export interface AuditTrailConfig {
  enableAuditTrail: boolean;
  enableIntegrityChecking: boolean;
  enablePIILogging: boolean;
  retentionDays: number;
  complianceMode: "strict" | "standard" | "minimal";
  encryptionEnabled: boolean;
  anonymizationEnabled: boolean;
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  timeRange: {
    start: string;
    end: string;
  };
  summary: {
    totalEvents: number;
    complianceViolations: number;
    piiDetections: number;
    safetyBlocks: number;
    averageLatency: number;
    totalCost: number;
  };
  violations: AuditEvent[];
  recommendations: string[];
}

/**
 * Audit Trail System for AI Operations
 */
export class AuditTrailSystem {
  private logger: BasicLogger;
  private config: AuditTrailConfig;
  private lastEventHash: string = "";
  private eventCounter: number = 0;

  constructor(config: Partial<AuditTrailConfig> = {}) {
    this.config = {
      enableAuditTrail: true,
      enableIntegrityChecking: true,
      enablePIILogging: false, // GDPR compliance - no PII in logs by default
      retentionDays: 90,
      complianceMode: "standard",
      encryptionEnabled: true,
      anonymizationEnabled: true,
      ...config,
    };

    this.logger = new BasicLogger("audit-trail-system");
  }

  /**
   * Log AI request start
   */
  async logRequestStart(
    requestId: string,
    request: AiRequest,
    userId?: string,
    tenantId?: string
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "ai_request_start",
      requestId,
      userId: this.config.anonymizationEnabled
        ? this.hashUserId(userId)
        : userId,
      tenantId,
      contentHash: await this.hashContent(request.prompt),
      contentLength: request.prompt.length,
      contentType: "prompt",
      dataClassification: this.classifyContent(request.context),
      complianceStatus: "pending",
      gdprLawfulBasis: this.determineLawfulBasis(request.context),
      dataProcessingPurpose: "ai_analysis",
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    this.logger.info("AI request audit logged", {
      requestId,
      eventId: event.eventId,
      eventType: event.eventType,
    });
  }

  /**
   * Log provider selection decision
   */
  async logProviderSelection(
    requestId: string,
    selectedProvider: Provider,
    modelId: string,
    reason: string,
    alternatives?: Provider[]
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "provider_selection",
      requestId,
      provider: selectedProvider,
      modelId,
      operation: "provider_routing",
      complianceStatus: "compliant",
      metadata: {
        selectionReason: reason,
        alternativeProviders: alternatives,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);
  }

  /**
   * Log safety check results
   */
  async logSafetyCheck(
    requestId: string,
    provider: Provider,
    safetyResult: SafetyCheckResult,
    contentType: "prompt" | "response"
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "safety_check",
      requestId,
      provider,
      contentType,
      safetyCheckResult: {
        allowed: safetyResult.allowed,
        confidence: safetyResult.confidence,
        violationTypes: safetyResult.violations.map((v) => v.type),
        processingTimeMs: safetyResult.processingTimeMs,
      },
      complianceStatus: safetyResult.allowed ? "compliant" : "violation",
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    // Log PII detection if found
    const piiViolations = safetyResult.violations.filter(
      (v) => v.type === "PII"
    );
    if (piiViolations.length > 0) {
      event.piiDetected = true;
      event.piiTypes = piiViolations.map((v) => v.details);
      event.eventType = "pii_detection";
    }

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    // Log compliance violation if safety check failed
    if (!safetyResult.allowed) {
      await this.logComplianceViolation(requestId, "safety_violation", {
        violations: safetyResult.violations,
        provider,
      });
    }
  }

  /**
   * Log AI request completion
   */
  async logRequestComplete(
    requestId: string,
    response: AiResponse,
    userId?: string
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "ai_request_complete",
      requestId,
      userId: this.config.anonymizationEnabled
        ? this.hashUserId(userId)
        : userId,
      provider: response.provider,
      modelId: response.modelId,
      contentHash: response.text
        ? await this.hashContent(response.text)
        : undefined,
      contentLength: response.text?.length,
      contentType: "response",
      latencyMs: response.latencyMs,
      costEuro: response.costEuro,
      tokensUsed: response.success
        ? {
            input: 0, // Would need to be passed from request
            output: response.text?.split(" ").length || 0,
          }
        : undefined,
      complianceStatus: response.success ? "compliant" : "violation",
      error: response.error
        ? {
            type: "ai_response_error",
            message: response.error,
          }
        : undefined,
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);
  }

  /**
   * Log provider fallback
   */
  async logProviderFallback(
    requestId: string,
    fromProvider: Provider,
    toProvider: Provider,
    reason: string,
    error?: Error
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "provider_fallback",
      requestId,
      provider: fromProvider,
      operation: "fallback_routing",
      complianceStatus: "warning",
      error: error
        ? {
            type: error.name,
            message: error.message,
          }
        : undefined,
      metadata: {
        fromProvider,
        toProvider,
        fallbackReason: reason,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);
  }

  /**
   * Log compliance violation
   */
  async logComplianceViolation(
    requestId: string,
    violationType: string,
    details: Record<string, any>
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "compliance_violation",
      requestId,
      complianceStatus: "violation",
      metadata: {
        violationType,
        details,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    // Alert on compliance violations
    this.logger.error("Compliance violation detected", undefined, {
      requestId,
      violationType,
      eventId: event.eventId,
    });
  }

  /**
   * Log cost tracking
   */
  async logCostTracking(
    requestId: string,
    provider: Provider,
    modelId: string,
    costEuro: number,
    tokensUsed: { input: number; output: number }
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "cost_tracking",
      requestId,
      provider,
      modelId,
      costEuro,
      tokensUsed,
      complianceStatus: "compliant",
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);
  }

  /**
   * Log hybrid routing decision
   */
  async logHybridRoutingDecision(
    requestId: string,
    routingDecision: {
      selectedRoute: "direct" | "mcp";
      reason: string;
      fallbackAvailable: boolean;
      estimatedLatency: number;
      correlationId: string;
      primaryRouteHealth?: boolean;
      fallbackRouteHealth?: boolean;
    },
    operationType: string,
    priority: string
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "hybrid_routing_decision",
      requestId,
      operation: "hybrid_routing",
      routingDecision,
      complianceStatus: "compliant",
      metadata: {
        operationType,
        priority,
        routingReason: routingDecision.reason,
        selectedRoute: routingDecision.selectedRoute,
        fallbackAvailable: routingDecision.fallbackAvailable,
        estimatedLatency: routingDecision.estimatedLatency,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    this.logger.info("Hybrid routing decision logged", {
      requestId,
      eventId: event.eventId,
      selectedRoute: routingDecision.selectedRoute,
      reason: routingDecision.reason,
    });
  }

  /**
   * Log direct Bedrock operation
   */
  async logDirectBedrockOperation(
    requestId: string,
    operationType: string,
    priority: string,
    latencyMs: number,
    success: boolean,
    tokensUsed?: { input: number; output: number },
    costEuro?: number,
    error?: string,
    piiDetected?: boolean,
    complianceValidation?: {
      gdprCompliant: boolean;
      piiRedacted: boolean;
      auditLogged: boolean;
    }
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "direct_bedrock_operation",
      requestId,
      provider: "bedrock",
      operation: operationType,
      latencyMs,
      tokensUsed,
      costEuro,
      piiDetected,
      complianceStatus: success ? "compliant" : "violation",
      error: error
        ? {
            type: "direct_bedrock_error",
            message: error,
          }
        : undefined,
      metadata: {
        operationType,
        priority,
        routingPath: "direct_bedrock",
        success,
        gdprCompliant: complianceValidation?.gdprCompliant,
        piiRedacted: complianceValidation?.piiRedacted,
        auditLogged: complianceValidation?.auditLogged,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    this.logger.info("Direct Bedrock operation logged", {
      requestId,
      eventId: event.eventId,
      operationType,
      success,
      latencyMs,
    });
  }

  /**
   * Log MCP routing operation
   */
  async logMCPRoutingOperation(
    requestId: string,
    operationType: string,
    priority: string,
    latencyMs: number,
    success: boolean,
    queueSize?: number,
    retryCount?: number,
    error?: string
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "mcp_routing_operation",
      requestId,
      provider: "bedrock", // MCP routes to Bedrock
      operation: operationType,
      latencyMs,
      complianceStatus: success ? "compliant" : "violation",
      error: error
        ? {
            type: "mcp_routing_error",
            message: error,
          }
        : undefined,
      metadata: {
        operationType,
        priority,
        routingPath: "mcp_integration",
        success,
        queueSize,
        retryCount,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    this.logger.info("MCP routing operation logged", {
      requestId,
      eventId: event.eventId,
      operationType,
      success,
      latencyMs,
    });
  }

  /**
   * Log intelligent routing fallback
   */
  async logIntelligentRoutingFallback(
    requestId: string,
    fromRoute: "direct" | "mcp",
    toRoute: "direct" | "mcp",
    reason: string,
    operationType: string,
    primaryError?: string
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "intelligent_routing_fallback",
      requestId,
      operation: "routing_fallback",
      complianceStatus: "warning",
      error: primaryError
        ? {
            type: "primary_route_error",
            message: primaryError,
          }
        : undefined,
      metadata: {
        fromRoute,
        toRoute,
        fallbackReason: reason,
        operationType,
        primaryError,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    this.logger.warn("Intelligent routing fallback logged", {
      requestId,
      eventId: event.eventId,
      fromRoute,
      toRoute,
      reason,
    });
  }

  /**
   * Log route health check
   */
  async logRouteHealthCheck(
    route: "direct" | "mcp",
    isHealthy: boolean,
    latencyMs: number,
    successRate: number,
    consecutiveFailures: number,
    error?: string
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "route_health_check",
      requestId: `health-check-${route}-${Date.now()}`,
      operation: "health_monitoring",
      latencyMs,
      routeHealth: {
        route,
        isHealthy,
        latencyMs,
        successRate,
        consecutiveFailures,
      },
      complianceStatus: isHealthy ? "compliant" : "warning",
      error: error
        ? {
            type: "health_check_error",
            message: error,
          }
        : undefined,
      metadata: {
        route,
        healthStatus: isHealthy ? "healthy" : "unhealthy",
        successRate,
        consecutiveFailures,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    if (!isHealthy) {
      this.logger.warn("Route health check failed", {
        route,
        eventId: event.eventId,
        consecutiveFailures,
        error,
      });
    }
  }

  /**
   * Log routing optimization
   */
  async logRoutingOptimization(
    recommendations: string[],
    metrics: {
      totalRequests: number;
      directRouteUsage: number;
      mcpRouteUsage: number;
      fallbackUsage: number;
      averageLatency: number;
      successRate: number;
    }
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "routing_optimization",
      requestId: `optimization-${Date.now()}`,
      operation: "routing_analysis",
      complianceStatus: "compliant",
      metadata: {
        recommendations,
        totalRequests: metrics.totalRequests,
        directRouteUsage: metrics.directRouteUsage,
        mcpRouteUsage: metrics.mcpRouteUsage,
        fallbackUsage: metrics.fallbackUsage,
        averageLatency: metrics.averageLatency,
        successRate: metrics.successRate,
        directUsagePercent:
          (metrics.directRouteUsage / metrics.totalRequests) * 100,
        mcpUsagePercent: (metrics.mcpRouteUsage / metrics.totalRequests) * 100,
        fallbackUsagePercent:
          (metrics.fallbackUsage / metrics.totalRequests) * 100,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    this.logger.info("Routing optimization logged", {
      eventId: event.eventId,
      recommendationsCount: recommendations.length,
      totalRequests: metrics.totalRequests,
    });
  }

  /**
   * Log GDPR compliance validation for hybrid routing
   */
  async logGDPRComplianceValidation(
    requestId: string,
    routingPath: "direct_bedrock" | "mcp_integration",
    operationType: string,
    isCompliant: boolean,
    reason?: string,
    processingTimeMs?: number
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "gdpr_compliance_validation",
      requestId,
      operation: "gdpr_validation",
      complianceStatus: isCompliant ? "compliant" : "violation",
      gdprLawfulBasis: isCompliant ? "legitimate_interests" : undefined,
      error: !isCompliant
        ? {
            type: "gdpr_compliance_error",
            message: reason || "GDPR compliance validation failed",
          }
        : undefined,
      metadata: {
        routingPath,
        operationType,
        gdprCompliant: isCompliant,
        validationReason: reason,
        processingTimeMs,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    if (!isCompliant) {
      this.logger.error("GDPR compliance validation failed", undefined, {
        requestId,
        eventId: event.eventId,
        routingPath,
        reason,
      });
    }
  }

  /**
   * Log PII redaction for hybrid routing
   */
  async logPIIRedaction(
    requestId: string,
    routingPath: "direct_bedrock" | "mcp_integration",
    operationType: string,
    redactionApplied: boolean,
    piiViolationsCount: number,
    originalLength?: number,
    redactedLength?: number,
    isEmergencyRedaction?: boolean
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const eventType = isEmergencyRedaction
      ? "emergency_pii_redaction"
      : "pii_redaction";

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType,
      requestId,
      operation: "pii_redaction",
      piiDetected: piiViolationsCount > 0,
      complianceStatus: redactionApplied ? "compliant" : "violation",
      gdprLawfulBasis: "data_protection",
      metadata: {
        routingPath,
        operationType,
        redactionApplied,
        piiViolationsCount,
        originalLength,
        redactedLength,
        isEmergencyRedaction,
        redactionPercentage:
          originalLength && redactedLength
            ? ((originalLength - redactedLength) / originalLength) * 100
            : 0,
      },
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    this.logger.info("PII redaction logged", {
      requestId,
      eventId: event.eventId,
      routingPath,
      redactionApplied,
      piiViolationsCount,
      isEmergencyRedaction,
    });
  }

  /**
   * Log MCP fallback initiation
   */
  async logMCPFallbackInitiation(
    correlationId: string,
    operation: string,
    priority: string,
    primaryFailureReason: string
  ): Promise<void> {
    const auditEvent = {
      eventType: "mcp_fallback_initiation" as const,
      requestId: correlationId,
      timestamp: new Date(),
      metadata: {
        operation,
        priority,
        primaryFailureReason,
        fallbackRoute: "mcp",
      },
    };

    await this.logEvent(auditEvent);
  }

  /**
   * Log MCP fallback completion
   */
  async logMCPFallbackCompletion(
    correlationId: string,
    success: boolean,
    attempts: number,
    totalLatency: number,
    error?: string
  ): Promise<void> {
    const auditEvent = {
      eventType: "mcp_fallback_completion" as const,
      requestId: correlationId,
      timestamp: new Date(),
      metadata: {
        success,
        attempts,
        totalLatency,
        error,
        fallbackRoute: "mcp",
      },
    };

    await this.logEvent(auditEvent);
  }

  /**
   * Log MCP fallback reliability issue
   */
  async logMCPFallbackReliabilityIssue(
    currentSuccessRate: number,
    targetSuccessRate: number,
    recommendations: string[]
  ): Promise<void> {
    const auditEvent = {
      eventType: "mcp_fallback_reliability_issue" as const,
      requestId: this.generateCorrelationId(),
      timestamp: new Date(),
      metadata: {
        currentSuccessRate,
        targetSuccessRate,
        recommendations,
        severity: currentSuccessRate < 0.95 ? "high" : "medium",
      },
    };

    await this.logEvent(auditEvent);
  }

  /**
   * Log general event (flexible method for custom hybrid routing events)
   */
  async logEvent(eventData: {
    eventType: AuditEventType;
    requestId: string;
    provider?: Provider;
    complianceStatus: ComplianceStatus;
    metadata?: Record<string, any>;
    error?: {
      type: string;
      message: string;
    };
  }): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: eventData.eventType,
      requestId: eventData.requestId,
      provider: eventData.provider,
      complianceStatus: eventData.complianceStatus,
      error: eventData.error,
      metadata: eventData.metadata,
      eventHash: "",
      previousEventHash: this.lastEventHash,
    };

    event.eventHash = await this.calculateEventHash(event);
    this.lastEventHash = event.eventHash;

    await this.persistAuditEvent(event);

    this.logger.info("Custom audit event logged", {
      requestId: eventData.requestId,
      eventId: event.eventId,
      eventType: eventData.eventType,
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    // This would typically query a database
    // For now, return a mock report structure
    const reportId = this.generateEventId();

    return {
      reportId,
      generatedAt: new Date().toISOString(),
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalEvents: 0,
        complianceViolations: 0,
        piiDetections: 0,
        safetyBlocks: 0,
        averageLatency: 0,
        totalCost: 0,
      },
      violations: [],
      recommendations: [
        "Implement regular compliance audits",
        "Review PII detection accuracy",
        "Monitor safety check performance",
        "Optimize cost per request",
      ],
    };
  }

  /**
   * Verify audit trail integrity
   */
  async verifyIntegrity(events: AuditEvent[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    if (!this.config.enableIntegrityChecking) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Verify event hash
      const calculatedHash = await this.calculateEventHash({
        ...event,
        eventHash: "",
      });

      if (calculatedHash !== event.eventHash) {
        errors.push(`Event ${event.eventId} has invalid hash`);
      }

      // Verify chain integrity
      if (i > 0) {
        const previousEvent = events[i - 1];
        if (event.previousEventHash !== previousEvent.eventHash) {
          errors.push(`Event ${event.eventId} has broken chain link`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Private helper methods
   */
  private generateEventId(): string {
    this.eventCounter++;
    return `audit_${Date.now()}_${this.eventCounter}`;
  }

  private async hashContent(content: string): Promise<string> {
    // Simple hash for content identification (not for security)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private hashUserId(userId?: string): string | undefined {
    if (!userId) return undefined;
    // Simple hash for user anonymization
    return `user_${userId.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)}`;
  }

  private classifyContent(
    context: RouterInputContext
  ): "public" | "internal" | "confidential" | "restricted" {
    if (context.pii) return "restricted";
    if (context.domain === "legal" || context.domain === "medical")
      return "confidential";
    if (context.tenant) return "internal";
    return "public";
  }

  private determineLawfulBasis(context: RouterInputContext): string {
    // GDPR Article 6 lawful basis
    if (context.pii) return "consent"; // Article 6(1)(a)
    if (context.domain === "legal") return "legal_obligation"; // Article 6(1)(c)
    return "legitimate_interests"; // Article 6(1)(f)
  }

  private async calculateEventHash(
    event: Omit<AuditEvent, "eventHash">
  ): Promise<string> {
    // Simple hash calculation for event integrity
    const eventString = JSON.stringify(event, Object.keys(event).sort());
    let hash = 0;
    for (let i = 0; i < eventString.length; i++) {
      const char = eventString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private async persistAuditEvent(event: AuditEvent): Promise<void> {
    // In production, this would write to a secure audit database
    // For now, use structured logging
    this.logger.info("Audit event", {
      eventId: event.eventId,
      eventType: event.eventType,
      requestId: event.requestId,
      complianceStatus: event.complianceStatus,
      timestamp: event.timestamp,
    });

    // In strict compliance mode, also write to separate audit log
    if (this.config.complianceMode === "strict") {
      console.log(`AUDIT: ${JSON.stringify(event)}`);
    }
  }

  /**
   * Log cost optimization start
   */
  async logCostOptimizationStart(
    strategy: string,
    targetReduction: number
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "cost_optimization",
      strategy,
      targetReduction,
      action: "start",
      complianceStatus: "compliant",
      eventHash: "",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    event.eventHash = await this.calculateEventHash(event);
    await this.persistAuditEvent(event);
  }

  /**
   * Log cost optimization stop
   */
  async logCostOptimizationStop(
    achievedReduction: number,
    totalSavings: number
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "cost_optimization",
      achievedReduction,
      totalSavings,
      action: "stop",
      complianceStatus: "compliant",
      eventHash: "",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    event.eventHash = await this.calculateEventHash(event);
    await this.persistAuditEvent(event);
  }

  /**
   * Log cost-aware routing decision
   */
  async logCostAwareRoutingDecision(
    correlationId: string,
    decision: any,
    operation: string,
    priority: string
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "cost_aware_routing",
      correlationId,
      selectedRoute: decision.selectedRoute,
      estimatedCost: decision.estimatedCost,
      costSavings: decision.costSavings,
      costEfficiencyScore: decision.costEfficiencyScore,
      operation,
      priority,
      reason: decision.reason,
      complianceStatus: "compliant",
      eventHash: "",
      metadata: {
        alternativeRouteCosts: decision.alternativeRouteCosts
          ? Object.fromEntries(decision.alternativeRouteCosts)
          : {},
        timestamp: new Date().toISOString(),
      },
    };

    event.eventHash = await this.calculateEventHash(event);
    await this.persistAuditEvent(event);
  }

  /**
   * Log cost performance evaluation
   */
  async logCostPerformanceEvaluation(
    costReductionPercentage: number,
    totalSavings: number,
    evaluationPeriod: number
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "cost_optimization",
      action: "performance_evaluation",
      costReductionPercentage,
      totalSavings,
      evaluationPeriod,
      complianceStatus: "compliant",
      eventHash: "",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    event.eventHash = await this.calculateEventHash(event);
    await this.persistAuditEvent(event);
  }

  /**
   * Log cost optimization recommendation applied
   */
  async logCostOptimizationRecommendationApplied(
    recommendationId: string,
    type: string,
    expectedSavings: number
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "cost_optimization",
      action: "recommendation_applied",
      recommendationId,
      type,
      expectedSavings,
      complianceStatus: "compliant",
      eventHash: "",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    event.eventHash = await this.calculateEventHash(event);
    await this.persistAuditEvent(event);
  }

  /**
   * Log cost optimization effectiveness
   */
  async logCostOptimizationEffectiveness(
    actualReduction: number,
    totalSavings: number,
    targetReduction: number
  ): Promise<void> {
    if (!this.config.enableAuditTrail) return;

    const event: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: "cost_optimization",
      action: "effectiveness_evaluation",
      actualReduction,
      totalSavings,
      targetReduction,
      targetMet: actualReduction >= targetReduction,
      complianceStatus: "compliant",
      eventHash: "",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    event.eventHash = await this.calculateEventHash(event);
    await this.persistAuditEvent(event);
  }
}

/**
 * Default audit trail instance
 */
export const auditTrail = new AuditTrailSystem();

/**
 * Create audit trail with custom config
 */
export const createAuditTrail = (
  config: Partial<AuditTrailConfig>
): AuditTrailSystem => {
  return new AuditTrailSystem(config);
};
