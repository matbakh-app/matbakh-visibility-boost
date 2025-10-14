/**
 * Audit Trail System - Usage Examples
 *
 * Demonstrates how to use the audit trail system for AI operations
 */

import {
  AuditMiddleware,
  AuditedAiOrchestrator,
  AuditedAiRequest,
} from "../audit-integration";
import {
  AuditEventType,
  AuditTrailSystem,
  auditTrail,
} from "../audit-trail-system";

/**
 * Example 1: Basic Audit Trail Usage
 */
export async function basicAuditTrailExample() {
  console.log("=== Basic Audit Trail Example ===");

  // Create a custom audit trail with specific configuration
  const customAuditTrail = new AuditTrailSystem({
    enableAuditTrail: true,
    enableIntegrityChecking: true,
    enablePIILogging: false, // GDPR compliant - no PII in logs
    retentionDays: 90,
    complianceMode: "strict",
    encryptionEnabled: true,
    anonymizationEnabled: true,
  });

  const requestId = "example-request-001";
  const userId = "user-12345";
  const tenantId = "restaurant-bella-italia";

  // Log AI request start
  await customAuditTrail.logRequestStart(
    requestId,
    {
      prompt: "Analyze the online visibility for Bella Italia restaurant",
      context: {
        userId,
        domain: "culinary",
        pii: false,
        slaMs: 2000,
        budgetTier: "standard",
      },
    },
    userId,
    tenantId
  );

  // Log provider selection
  await customAuditTrail.logProviderSelection(
    requestId,
    "bedrock",
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "Selected Bedrock for culinary domain analysis with high accuracy requirements",
    ["google", "meta"]
  );

  // Log safety check
  await customAuditTrail.logSafetyCheck(
    requestId,
    "bedrock",
    {
      allowed: true,
      confidence: 0.98,
      violations: [],
      processingTimeMs: 120,
    },
    "prompt"
  );

  // Log cost tracking
  await customAuditTrail.logCostTracking(
    requestId,
    "bedrock",
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    0.08,
    { input: 150, output: 300 }
  );

  // Log request completion
  await customAuditTrail.logRequestComplete(
    requestId,
    {
      provider: "bedrock",
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      text: "Your restaurant has excellent Google My Business optimization...",
      latencyMs: 1850,
      costEuro: 0.08,
      success: true,
      requestId,
    },
    userId
  );

  console.log("✅ Basic audit trail logging completed");
}

/**
 * Example 2: Safety Violation Handling
 */
export async function safetyViolationExample() {
  console.log("=== Safety Violation Example ===");

  const requestId = "example-request-002";
  const userId = "user-67890";

  // Simulate a request with PII and toxicity
  await auditTrail.logRequestStart(
    requestId,
    {
      prompt: "Send aggressive marketing emails to john.doe@competitor.com",
      context: {
        userId,
        domain: "general",
        pii: true, // PII detected in prompt
      },
    },
    userId
  );

  // Log safety check with violations
  await auditTrail.logSafetyCheck(
    requestId,
    "bedrock",
    {
      allowed: false,
      confidence: 0.92,
      violations: [
        {
          type: "PII",
          severity: "HIGH",
          confidence: 0.95,
          details: "Email address detected: john.doe@competitor.com",
          position: { start: 45, end: 70 },
        },
        {
          type: "TOXICITY",
          severity: "MEDIUM",
          confidence: 0.78,
          details: "Aggressive language detected",
        },
      ],
      processingTimeMs: 200,
    },
    "prompt"
  );

  // Log request completion with error
  await auditTrail.logRequestComplete(
    requestId,
    {
      provider: "bedrock",
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      latencyMs: 250,
      costEuro: 0,
      success: false,
      error: "Content safety check failed - PII and toxicity detected",
      requestId,
    },
    userId
  );

  console.log("✅ Safety violation audit trail completed");
}

/**
 * Example 3: Provider Fallback Scenario
 */
export async function providerFallbackExample() {
  console.log("=== Provider Fallback Example ===");

  const requestId = "example-request-003";
  const userId = "user-11111";

  await auditTrail.logRequestStart(
    requestId,
    {
      prompt: "Generate restaurant marketing strategy",
      context: {
        userId,
        domain: "culinary",
        slaMs: 1000, // Tight SLA requirement
      },
    },
    userId
  );

  // Primary provider selection
  await auditTrail.logProviderSelection(
    requestId,
    "google",
    "gemini-1.5-pro",
    "Selected Google for low latency requirement",
    ["bedrock", "meta"]
  );

  // Simulate provider failure and fallback
  await auditTrail.logProviderFallback(
    requestId,
    "google",
    "bedrock",
    "Google API timeout after 1.2 seconds",
    new Error("Request timeout")
  );

  // Log successful completion with fallback provider
  await auditTrail.logRequestComplete(
    requestId,
    {
      provider: "bedrock",
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      text: "Marketing strategy: Focus on local SEO and social media presence...",
      latencyMs: 2100, // Exceeded original SLA but completed
      costEuro: 0.12,
      success: true,
      requestId,
    },
    userId
  );

  console.log("✅ Provider fallback audit trail completed");
}

/**
 * Example 4: Using Audited AI Orchestrator
 */
export async function auditedOrchestratorExample() {
  console.log("=== Audited AI Orchestrator Example ===");

  const orchestrator = new AuditedAiOrchestrator();

  const request: AuditedAiRequest = {
    requestId: "orchestrator-request-001",
    prompt:
      "Analyze competitor pricing strategies for Italian restaurants in Munich",
    context: {
      userId: "user-22222",
      domain: "culinary",
      locale: "de-DE",
      budgetTier: "premium",
      slaMs: 3000,
    },
    userId: "user-22222",
    tenantId: "restaurant-group-bavaria",
    sessionId: "session-abc123",
  };

  try {
    const response = await orchestrator.processRequest(request);

    console.log("Response:", {
      success: response.success,
      provider: response.provider,
      latencyMs: response.latencyMs,
      costEuro: response.costEuro,
      auditEventIds: response.auditEventIds.length,
    });

    console.log("✅ Audited orchestrator request completed successfully");
  } catch (error) {
    console.error("❌ Audited orchestrator request failed:", error);
  }
}

/**
 * Example 5: Using Audit Middleware
 */
export async function auditMiddlewareExample() {
  console.log("=== Audit Middleware Example ===");

  const middleware = new AuditMiddleware();

  // Wrap a custom operation with audit logging
  const result = await middleware.wrapOperation(
    "restaurant-data-analysis",
    "middleware-request-001",
    async () => {
      // Simulate some business logic
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        restaurantId: "rest-123",
        visibilityScore: 85,
        recommendations: [
          "Improve Google My Business photos",
          "Respond to recent reviews",
          "Update business hours",
        ],
      };
    },
    {
      userId: "user-33333",
      provider: "bedrock",
      metadata: {
        analysisType: "visibility-check",
        restaurantType: "italian",
      },
    }
  );

  console.log("Operation result:", result);
  console.log("✅ Audit middleware example completed");
}

/**
 * Example 6: Compliance Reporting
 */
export async function complianceReportingExample() {
  console.log("=== Compliance Reporting Example ===");

  const orchestrator = new AuditedAiOrchestrator();

  // Generate compliance report for the last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const report = await orchestrator.generateComplianceReport(
    startDate,
    endDate,
    "compliance-officer-001"
  );

  console.log("Compliance Report:", {
    reportId: report.reportId,
    timeRange: report.timeRange,
    summary: report.summary,
    recommendationsCount: report.recommendations.length,
  });

  console.log("✅ Compliance reporting example completed");
}

/**
 * Example 7: Audit Trail Integrity Verification
 */
export async function auditIntegrityExample() {
  console.log("=== Audit Trail Integrity Example ===");

  // Simulate audit events for integrity checking
  const mockEvents = [
    {
      eventId: "event-001",
      timestamp: "2025-01-14T10:00:00Z",
      eventType: "ai_request_start" as AuditEventType,
      requestId: "req-001",
      complianceStatus: "pending" as const,
      eventHash: "hash-001",
      previousEventHash: "",
    },
    {
      eventId: "event-002",
      timestamp: "2025-01-14T10:00:01Z",
      eventType: "ai_request_complete" as AuditEventType,
      requestId: "req-001",
      complianceStatus: "compliant" as const,
      eventHash: "hash-002",
      previousEventHash: "hash-001",
    },
  ];

  const orchestrator = new AuditedAiOrchestrator();
  const integrityResult = await orchestrator.verifyAuditIntegrity(mockEvents);

  console.log("Integrity Check Result:", {
    valid: integrityResult.valid,
    errorsCount: integrityResult.errors.length,
    errors: integrityResult.errors,
  });

  console.log("✅ Audit integrity verification completed");
}

/**
 * Example 8: GDPR Compliance Demonstration
 */
export async function gdprComplianceExample() {
  console.log("=== GDPR Compliance Example ===");

  // Create audit trail with strict GDPR settings
  const gdprAuditTrail = new AuditTrailSystem({
    enableAuditTrail: true,
    enablePIILogging: false, // Never log actual PII
    anonymizationEnabled: true, // Always anonymize user IDs
    complianceMode: "strict",
    retentionDays: 90, // GDPR compliant retention
  });

  const requestId = "gdpr-request-001";
  const userId = "user-with-pii-data";

  // Log request with PII context but no actual PII in logs
  await gdprAuditTrail.logRequestStart(
    requestId,
    {
      prompt: "Process customer data for restaurant recommendations",
      context: {
        userId,
        domain: "general",
        pii: true, // Indicates PII is present but doesn't log it
      },
    },
    userId,
    "tenant-eu-restaurant"
  );

  // Log safety check that detects PII
  await gdprAuditTrail.logSafetyCheck(
    requestId,
    "bedrock",
    {
      allowed: false,
      confidence: 0.95,
      violations: [
        {
          type: "PII",
          severity: "HIGH",
          confidence: 0.98,
          details: "Personal data detected - processing blocked",
        },
      ],
      processingTimeMs: 150,
    },
    "prompt"
  );

  console.log("✅ GDPR compliance example completed - no PII logged");
}

/**
 * Run all examples
 */
export async function runAllAuditExamples() {
  console.log("🚀 Running All Audit Trail Examples\n");

  try {
    await basicAuditTrailExample();
    console.log("");

    await safetyViolationExample();
    console.log("");

    await providerFallbackExample();
    console.log("");

    await auditedOrchestratorExample();
    console.log("");

    await auditMiddlewareExample();
    console.log("");

    await complianceReportingExample();
    console.log("");

    await auditIntegrityExample();
    console.log("");

    await gdprComplianceExample();
    console.log("");

    console.log("🎉 All audit trail examples completed successfully!");
  } catch (error) {
    console.error("❌ Error running audit examples:", error);
  }
}

// Export for use in other modules
export { AuditMiddleware, AuditTrailSystem, AuditedAiOrchestrator };
