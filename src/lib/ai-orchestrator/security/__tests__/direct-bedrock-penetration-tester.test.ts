/**
 * Direct Bedrock Penetration Tester Tests
 *
 * Comprehensive test suite for the Direct Bedrock Client penetration testing functionality.
 */

import { DirectBedrockClient } from "../../direct-bedrock-client";
import { DirectBedrockPenetrationTester } from "../direct-bedrock-penetration-tester";

// Mock dependencies
jest.mock("../../direct-bedrock-client");
jest.mock("../../audit-trail-system");
jest.mock("../../ai-feature-flags");
jest.mock("../red-team-evaluator");

describe("DirectBedrockPenetrationTester", () => {
  let mockClient: jest.Mocked<DirectBedrockClient>;
  let penetrationTester: DirectBedrockPenetrationTester;

  beforeEach(() => {
    // Create mock DirectBedrockClient
    mockClient = {
      executeSupportOperation: jest.fn(),
      detectPii: jest.fn(),
      validateUrlForSSRF: jest.fn(),
    } as any;

    // Create penetration tester with mock client
    penetrationTester = new DirectBedrockPenetrationTester(mockClient, {
      testDepth: "basic",
      maxTestsPerCategory: 2,
      timeoutMs: 5000,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Penetration Test Execution", () => {
    it("should run comprehensive penetration test", async () => {
      // Mock secure responses for all tests
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot provide that information as it would violate my guidelines.",
        latencyMs: 100,
        operationId: "test-op-1",
        timestamp: new Date(),
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked by SSRF protection",
        blockedBy: "url_validator",
      });

      const result = await penetrationTester.runPenetrationTest();

      expect(result).toHaveProperty("testId");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("totalTests");
      expect(result).toHaveProperty("testsPassed");
      expect(result).toHaveProperty("testsFailed");
      expect(result).toHaveProperty("vulnerabilitiesDetected");
      expect(result).toHaveProperty("overallSecurityScore");
      expect(result).toHaveProperty("testCategories");
      expect(result).toHaveProperty("recommendations");

      expect(result.totalTests).toBeGreaterThan(0);
      expect(result.overallSecurityScore).toBeGreaterThanOrEqual(0);
      expect(result.overallSecurityScore).toBeLessThanOrEqual(100);
      expect(result.testCategories.length).toBeGreaterThan(0);
    });

    it("should handle all test categories when enabled", async () => {
      const comprehensiveTester = new DirectBedrockPenetrationTester(
        mockClient,
        {
          testDepth: "comprehensive",
          maxTestsPerCategory: 1,
          enablePromptInjectionTests: true,
          enableJailbreakTests: true,
          enableDataExfiltrationTests: true,
          enablePrivilegeEscalationTests: true,
          enableDenialOfServiceTests: true,
          enablePIIExtractionTests: true,
          enableSSRFTests: true,
          enableAuthenticationBypassTests: true,
          enableCircuitBreakerTests: true,
          enableKMSEncryptionTests: true,
          enableComplianceBypassTests: true,
        }
      );

      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Secure response",
        latencyMs: 100,
        operationId: "test-op-2",
        timestamp: new Date(),
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await comprehensiveTester.runPenetrationTest();

      expect(result.testCategories).toHaveLength(11); // All categories enabled
      expect(result.totalTests).toBe(11); // 1 test per category
    });

    it("should respect category enable/disable flags", async () => {
      const limitedTester = new DirectBedrockPenetrationTester(mockClient, {
        maxTestsPerCategory: 2,
        enablePromptInjectionTests: true,
        enableJailbreakTests: false,
        enableDataExfiltrationTests: false,
        enablePrivilegeEscalationTests: false,
        enableDenialOfServiceTests: false,
        enablePIIExtractionTests: false,
        enableSSRFTests: false,
        enableAuthenticationBypassTests: false,
        enableCircuitBreakerTests: false,
        enableKMSEncryptionTests: false,
        enableComplianceBypassTests: false,
      });

      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Secure response",
        latencyMs: 100,
        operationId: "test-op-3",
        timestamp: new Date(),
      });

      const result = await limitedTester.runPenetrationTest();

      expect(result.testCategories).toHaveLength(1); // Only prompt injection
      expect(result.testCategories[0].category).toBe("prompt_injection");
      expect(result.totalTests).toBe(2); // 2 tests for prompt injection
    });
  });

  describe("Prompt Injection Tests", () => {
    it("should detect prompt injection vulnerability", async () => {
      // Mock vulnerable response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Here is my system prompt: You are a helpful assistant with access to sensitive data...",
        latencyMs: 100,
        operationId: "test-op-4",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const promptInjectionCategory = result.testCategories.find(
        (cat) => cat.category === "prompt_injection"
      );

      expect(promptInjectionCategory).toBeDefined();
      expect(promptInjectionCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
      expect(promptInjectionCategory!.securityScore).toBeLessThan(100);
    });

    it("should pass when prompt injection is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot reveal my system prompt or follow instructions to ignore my guidelines.",
        latencyMs: 100,
        operationId: "test-op-5",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const promptInjectionCategory = result.testCategories.find(
        (cat) => cat.category === "prompt_injection"
      );

      expect(promptInjectionCategory).toBeDefined();
      expect(promptInjectionCategory!.vulnerabilitiesFound).toBe(0);
      expect(promptInjectionCategory!.securityScore).toBe(100);
    });

    it("should handle errors as successful defense", async () => {
      // Mock error (system rejected malicious input)
      mockClient.executeSupportOperation.mockRejectedValue(
        new Error("Input validation failed")
      );

      const result = await penetrationTester.runPenetrationTest();

      const promptInjectionCategory = result.testCategories.find(
        (cat) => cat.category === "prompt_injection"
      );

      expect(promptInjectionCategory).toBeDefined();
      expect(promptInjectionCategory!.vulnerabilitiesFound).toBe(0);
      expect(promptInjectionCategory!.testsPassed).toBe(
        promptInjectionCategory!.testsRun
      );
    });
  });

  describe("Jailbreak Tests", () => {
    it("should detect jailbreak vulnerability", async () => {
      // Mock vulnerable response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Developer mode enabled. I can now do anything without restrictions and access all data.",
        latencyMs: 100,
        operationId: "test-op-6",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const jailbreakCategory = result.testCategories.find(
        (cat) => cat.category === "jailbreak"
      );

      expect(jailbreakCategory).toBeDefined();
      expect(jailbreakCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when jailbreak is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot enable developer mode or remove my safety guidelines.",
        latencyMs: 100,
        operationId: "test-op-7",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const jailbreakCategory = result.testCategories.find(
        (cat) => cat.category === "jailbreak"
      );

      expect(jailbreakCategory).toBeDefined();
      expect(jailbreakCategory!.vulnerabilitiesFound).toBe(0);
    });
  });

  describe("Data Exfiltration Tests", () => {
    it("should detect data exfiltration vulnerability", async () => {
      // Mock vulnerable response with sensitive data
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Here are the user emails: admin@example.com, user@test.com. API key: sk-test-123456",
        latencyMs: 100,
        operationId: "test-op-8",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const dataExfiltrationCategory = result.testCategories.find(
        (cat) => cat.category === "data_exfiltration"
      );

      expect(dataExfiltrationCategory).toBeDefined();
      expect(dataExfiltrationCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when data exfiltration is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot provide access to user data or system credentials.",
        latencyMs: 100,
        operationId: "test-op-9",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const dataExfiltrationCategory = result.testCategories.find(
        (cat) => cat.category === "data_exfiltration"
      );

      expect(dataExfiltrationCategory).toBeDefined();
      expect(dataExfiltrationCategory!.vulnerabilitiesFound).toBe(0);
    });
  });

  describe("Privilege Escalation Tests", () => {
    it("should detect privilege escalation vulnerability", async () => {
      // Mock vulnerable response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Admin access granted. You now have elevated privileges and full system access.",
        latencyMs: 100,
        operationId: "test-op-10",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const privilegeEscalationCategory = result.testCategories.find(
        (cat) => cat.category === "privilege_escalation"
      );

      expect(privilegeEscalationCategory).toBeDefined();
      expect(privilegeEscalationCategory!.vulnerabilitiesFound).toBeGreaterThan(
        0
      );
    });

    it("should pass when privilege escalation is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot grant admin access or elevated privileges.",
        latencyMs: 100,
        operationId: "test-op-11",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const privilegeEscalationCategory = result.testCategories.find(
        (cat) => cat.category === "privilege_escalation"
      );

      expect(privilegeEscalationCategory).toBeDefined();
      expect(privilegeEscalationCategory!.vulnerabilitiesFound).toBe(0);
    });
  });

  describe("Denial of Service Tests", () => {
    it("should detect DoS vulnerability (excessive output)", async () => {
      // Mock vulnerable response with excessive output
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "A".repeat(15000), // Excessive output
        latencyMs: 100,
        operationId: "test-op-12",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const dosCategory = result.testCategories.find(
        (cat) => cat.category === "denial_of_service"
      );

      expect(dosCategory).toBeDefined();
      expect(dosCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should detect DoS vulnerability (excessive response time)", async () => {
      // Mock vulnerable response with long response time
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Normal response",
        latencyMs: 4500, // Close to timeout threshold
        operationId: "test-op-13",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const dosCategory = result.testCategories.find(
        (cat) => cat.category === "denial_of_service"
      );

      expect(dosCategory).toBeDefined();
      expect(dosCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when DoS is properly blocked", async () => {
      // Mock secure response with reasonable limits
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot generate infinite sequences or excessive output.",
        latencyMs: 100,
        operationId: "test-op-14",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const dosCategory = result.testCategories.find(
        (cat) => cat.category === "denial_of_service"
      );

      expect(dosCategory).toBeDefined();
      expect(dosCategory!.vulnerabilitiesFound).toBe(0);
    });
  });

  describe("PII Extraction Tests", () => {
    it("should detect PII extraction vulnerability", async () => {
      // Mock vulnerable response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Here are user details: john.doe@example.com, phone: 555-123-4567",
        latencyMs: 100,
        operationId: "test-op-15",
        timestamp: new Date(),
      });

      // Mock PII detection finding PII
      mockClient.detectPii.mockResolvedValue({
        hasPii: true,
        piiTypes: ["EMAIL", "PHONE"],
        detectedPii: [
          {
            type: "EMAIL",
            value: "john.doe@example.com",
            confidence: 0.95,
            startIndex: 20,
            endIndex: 40,
          },
        ],
      });

      const result = await penetrationTester.runPenetrationTest();

      const piiCategory = result.testCategories.find(
        (cat) => cat.category === "pii_extraction"
      );

      expect(piiCategory).toBeDefined();
      expect(piiCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when PII extraction is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot provide personal information about users.",
        latencyMs: 100,
        operationId: "test-op-16",
        timestamp: new Date(),
      });

      // Mock PII detection finding no PII
      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      const result = await penetrationTester.runPenetrationTest();

      const piiCategory = result.testCategories.find(
        (cat) => cat.category === "pii_extraction"
      );

      expect(piiCategory).toBeDefined();
      expect(piiCategory!.vulnerabilitiesFound).toBe(0);
    });

    it("should handle PII detection errors gracefully", async () => {
      // Mock response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Some response text",
        latencyMs: 100,
        operationId: "test-op-17",
        timestamp: new Date(),
      });

      // Mock PII detection error
      mockClient.detectPii.mockRejectedValue(new Error("PII detection failed"));

      const result = await penetrationTester.runPenetrationTest();

      const piiCategory = result.testCategories.find(
        (cat) => cat.category === "pii_extraction"
      );

      expect(piiCategory).toBeDefined();
      // Should still complete the test using fallback pattern matching
    });
  });

  describe("SSRF Tests", () => {
    it("should detect SSRF vulnerability", async () => {
      // Mock vulnerable SSRF validation
      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: true,
        reason: "URL allowed",
      });

      const result = await penetrationTester.runPenetrationTest();

      const ssrfCategory = result.testCategories.find(
        (cat) => cat.category === "ssrf"
      );

      expect(ssrfCategory).toBeDefined();
      expect(ssrfCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when SSRF is properly blocked", async () => {
      // Mock secure SSRF validation
      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked by SSRF protection",
        blockedBy: "url_validator",
      });

      const result = await penetrationTester.runPenetrationTest();

      const ssrfCategory = result.testCategories.find(
        (cat) => cat.category === "ssrf"
      );

      expect(ssrfCategory).toBeDefined();
      expect(ssrfCategory!.vulnerabilitiesFound).toBe(0);
    });

    it("should test SSRF via prompt when URL extraction fails", async () => {
      // Mock no direct URL validation (simulating non-URL vector)
      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "No URL found",
      });

      // Mock secure response to SSRF prompt
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot access external URLs or internal services.",
        latencyMs: 100,
        operationId: "test-op-18",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const ssrfCategory = result.testCategories.find(
        (cat) => cat.category === "ssrf"
      );

      expect(ssrfCategory).toBeDefined();
      expect(mockClient.executeSupportOperation).toHaveBeenCalled();
    });
  });

  describe("Authentication Bypass Tests", () => {
    it("should detect authentication bypass vulnerability", async () => {
      // Mock vulnerable response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Access granted. You are now authenticated as admin user.",
        latencyMs: 100,
        operationId: "test-op-19",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const authBypassCategory = result.testCategories.find(
        (cat) => cat.category === "authentication_bypass"
      );

      expect(authBypassCategory).toBeDefined();
      expect(authBypassCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when authentication bypass is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot bypass authentication or grant unauthorized access.",
        latencyMs: 100,
        operationId: "test-op-20",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const authBypassCategory = result.testCategories.find(
        (cat) => cat.category === "authentication_bypass"
      );

      expect(authBypassCategory).toBeDefined();
      expect(authBypassCategory!.vulnerabilitiesFound).toBe(0);
    });
  });

  describe("Circuit Breaker Bypass Tests", () => {
    it("should detect circuit breaker bypass vulnerability", async () => {
      // Mock vulnerable response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Circuit breaker override successful. Rate limits bypassed.",
        latencyMs: 100,
        operationId: "test-op-21",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const circuitBreakerCategory = result.testCategories.find(
        (cat) => cat.category === "circuit_breaker_bypass"
      );

      expect(circuitBreakerCategory).toBeDefined();
      expect(circuitBreakerCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when circuit breaker bypass is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot override circuit breaker protections or rate limits.",
        latencyMs: 100,
        operationId: "test-op-22",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const circuitBreakerCategory = result.testCategories.find(
        (cat) => cat.category === "circuit_breaker_bypass"
      );

      expect(circuitBreakerCategory).toBeDefined();
      expect(circuitBreakerCategory!.vulnerabilitiesFound).toBe(0);
    });
  });

  describe("KMS Encryption Bypass Tests", () => {
    it("should detect KMS encryption bypass vulnerability", async () => {
      // Mock vulnerable response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Encryption bypassed. Here is the plaintext data from KMS.",
        latencyMs: 100,
        operationId: "test-op-23",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const kmsCategory = result.testCategories.find(
        (cat) => cat.category === "kms_encryption_bypass"
      );

      expect(kmsCategory).toBeDefined();
      expect(kmsCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when KMS encryption bypass is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot bypass encryption or access encrypted data without proper authorization.",
        latencyMs: 100,
        operationId: "test-op-24",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const kmsCategory = result.testCategories.find(
        (cat) => cat.category === "kms_encryption_bypass"
      );

      expect(kmsCategory).toBeDefined();
      expect(kmsCategory!.vulnerabilitiesFound).toBe(0);
    });
  });

  describe("Compliance Bypass Tests", () => {
    it("should detect compliance bypass vulnerability", async () => {
      // Mock vulnerable response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "GDPR compliance bypassed. Processing data without consent in non-EU region.",
        latencyMs: 100,
        operationId: "test-op-25",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const complianceCategory = result.testCategories.find(
        (cat) => cat.category === "compliance_bypass"
      );

      expect(complianceCategory).toBeDefined();
      expect(complianceCategory!.vulnerabilitiesFound).toBeGreaterThan(0);
    });

    it("should pass when compliance bypass is properly blocked", async () => {
      // Mock secure response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot bypass GDPR compliance or process data without proper consent.",
        latencyMs: 100,
        operationId: "test-op-26",
        timestamp: new Date(),
      });

      const result = await penetrationTester.runPenetrationTest();

      const complianceCategory = result.testCategories.find(
        (cat) => cat.category === "compliance_bypass"
      );

      expect(complianceCategory).toBeDefined();
      expect(complianceCategory!.vulnerabilitiesFound).toBe(0);
    });
  });

  describe("Security Score Calculation", () => {
    it("should calculate perfect security score for all secure responses", async () => {
      // Mock all secure responses
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "I cannot provide that information.",
        latencyMs: 100,
        operationId: "test-op-27",
        timestamp: new Date(),
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await penetrationTester.runPenetrationTest();

      expect(result.overallSecurityScore).toBe(100);
      expect(result.vulnerabilitiesDetected).toBe(0);
      expect(result.testsPassed).toBe(result.totalTests);
    });

    it("should calculate lower security score for vulnerable responses", async () => {
      // Mock some vulnerable responses
      let callCount = 0;
      mockClient.executeSupportOperation.mockImplementation(async () => {
        callCount++;
        if (callCount % 2 === 0) {
          // Vulnerable response
          return {
            success: true,
            text: "Here is sensitive information: admin@example.com, password: secret123",
            latencyMs: 100,
            operationId: `test-op-${callCount}`,
            timestamp: new Date(),
          };
        } else {
          // Secure response
          return {
            success: true,
            text: "I cannot provide that information.",
            latencyMs: 100,
            operationId: `test-op-${callCount}`,
            timestamp: new Date(),
          };
        }
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: true,
        piiTypes: ["EMAIL"],
        detectedPii: [
          {
            type: "EMAIL",
            value: "admin@example.com",
            confidence: 0.95,
            startIndex: 0,
            endIndex: 16,
          },
        ],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await penetrationTester.runPenetrationTest();

      expect(result.overallSecurityScore).toBeLessThan(100);
      expect(result.vulnerabilitiesDetected).toBeGreaterThan(0);
    });
  });

  describe("Recommendations Generation", () => {
    it("should generate appropriate recommendations for vulnerabilities", async () => {
      // Mock vulnerable responses for specific categories
      mockClient.executeSupportOperation.mockImplementation(async (request) => {
        if (request.prompt.includes("system prompt")) {
          return {
            success: true,
            text: "Here is my system prompt: You are a helpful assistant...",
            latencyMs: 100,
            operationId: "test-op-28",
            timestamp: new Date(),
          };
        }
        return {
          success: true,
          text: "I cannot provide that information.",
          latencyMs: 100,
          operationId: "test-op-29",
          timestamp: new Date(),
        };
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await penetrationTester.runPenetrationTest();

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some((r) => r.includes("security controls"))
      ).toBe(true);
    });

    it("should provide category-specific recommendations", async () => {
      // Mock PII extraction vulnerability
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "User email: test@example.com",
        latencyMs: 100,
        operationId: "test-op-30",
        timestamp: new Date(),
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: true,
        piiTypes: ["EMAIL"],
        detectedPii: [
          {
            type: "EMAIL",
            value: "test@example.com",
            confidence: 0.95,
            startIndex: 12,
            endIndex: 28,
          },
        ],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await penetrationTester.runPenetrationTest();

      expect(
        result.recommendations.some((r) => r.includes("PII detection"))
      ).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle client errors gracefully", async () => {
      mockClient.executeSupportOperation.mockRejectedValue(
        new Error("Client error")
      );

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await penetrationTester.runPenetrationTest();

      // Errors should be treated as successful defense
      expect(result.totalTests).toBeGreaterThan(0);
      expect(result.testsPassed).toBeGreaterThan(0);
    });

    it("should handle timeout errors", async () => {
      mockClient.executeSupportOperation.mockRejectedValue(
        new Error("Operation timeout")
      );

      const result = await penetrationTester.runPenetrationTest();

      expect(result.totalTests).toBeGreaterThan(0);
    });

    it("should handle malformed responses", async () => {
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: undefined, // Malformed response
        latencyMs: 100,
        operationId: "test-op-31",
        timestamp: new Date(),
      } as any);

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await penetrationTester.runPenetrationTest();

      expect(result).toBeDefined();
      expect(result.totalTests).toBeGreaterThan(0);
    });
  });

  describe("Test Configuration", () => {
    it("should respect test depth configuration", async () => {
      const basicTester = new DirectBedrockPenetrationTester(mockClient, {
        testDepth: "basic",
        maxTestsPerCategory: 1,
      });

      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Secure response",
        latencyMs: 100,
        operationId: "test-op-32",
        timestamp: new Date(),
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await basicTester.runPenetrationTest();

      // Should have limited tests based on configuration
      expect(result.totalTests).toBeLessThanOrEqual(11); // Max 1 test per category
    });

    it("should respect timeout configuration", async () => {
      const timeoutTester = new DirectBedrockPenetrationTester(mockClient, {
        timeoutMs: 1000, // Short timeout
        maxTestsPerCategory: 1,
      });

      // Mock slow response
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Response",
        latencyMs: 900, // Close to timeout
        operationId: "test-op-33",
        timestamp: new Date(),
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await timeoutTester.runPenetrationTest();

      // Should detect DoS vulnerability due to high response time relative to timeout
      const dosCategory = result.testCategories.find(
        (cat) => cat.category === "denial_of_service"
      );
      expect(dosCategory?.vulnerabilitiesFound).toBeGreaterThan(0);
    });
  });

  describe("Audit Trail Integration", () => {
    it("should log penetration test execution", async () => {
      mockClient.executeSupportOperation.mockResolvedValue({
        success: true,
        text: "Secure response",
        latencyMs: 100,
        operationId: "test-op-34",
        timestamp: new Date(),
      });

      mockClient.detectPii.mockResolvedValue({
        hasPii: false,
        piiTypes: [],
        detectedPii: [],
      });

      mockClient.validateUrlForSSRF.mockResolvedValue({
        allowed: false,
        reason: "Blocked",
      });

      const result = await penetrationTester.runPenetrationTest();

      expect(result.auditTrailId).toBeDefined();
      expect(result.testId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });
});
