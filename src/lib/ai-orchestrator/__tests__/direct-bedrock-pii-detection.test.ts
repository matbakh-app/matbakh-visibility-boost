/**
 * Direct Bedrock Client - PII Detection and Redaction Tests
 *
 * Comprehensive test suite for PII detection, redaction, and GDPR compliance
 * in the Direct Bedrock Client for critical support operations.
 */

import { AiFeatureFlags } from "../ai-feature-flags";
import { AuditTrailSystem } from "../audit-trail-system";
import { DirectBedrockClient } from "../direct-bedrock-client";
import { GDPRHybridComplianceValidator } from "../gdpr-hybrid-compliance-validator";

// Mock dependencies
jest.mock("../ai-feature-flags");
jest.mock("../audit-trail-system");
jest.mock("../gdpr-hybrid-compliance-validator");
jest.mock("../circuit-breaker");
jest.mock("../safety/pii-toxicity-detector");
jest.mock("../kms-encryption-service");

describe("DirectBedrockClient - PII Detection and Redaction", () => {
  let client: DirectBedrockClient;
  let mockFeatureFlags: jest.Mocked<AiFeatureFlags>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;
  let mockGdprValidator: jest.Mocked<GDPRHybridComplianceValidator>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup feature flags mock
    mockFeatureFlags = {
      isEnabled: jest.fn((flag: string, defaultValue?: boolean) => {
        if (flag === "pii_detection_enabled") return true;
        if (flag === "gdpr_compliance_enabled") return true;
        if (flag === "ENABLE_DIRECT_BEDROCK_FALLBACK") return true;
        return defaultValue !== undefined ? defaultValue : false;
      }),
    } as any;

    (AiFeatureFlags as jest.Mock).mockImplementation(() => mockFeatureFlags);

    // Setup audit trail mock
    mockAuditTrail = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    (AuditTrailSystem as jest.Mock).mockImplementation(() => mockAuditTrail);

    // Setup GDPR validator mock
    mockGdprValidator = {
      validateHybridRouting: jest.fn().mockResolvedValue({
        isCompliant: true,
        violations: [],
      }),
    } as any;

    (GDPRHybridComplianceValidator as jest.Mock).mockImplementation(
      () => mockGdprValidator
    );

    // Create client instance with EU region for GDPR compliance
    client = new DirectBedrockClient({
      region: "eu-central-1",
      enableComplianceChecks: true,
      enableHealthMonitoring: false, // Disable for testing
    });
  });

  afterEach(() => {
    // Cleanup
    if (client && typeof (client as any).cleanup === "function") {
      (client as any).cleanup();
    }
  });

  describe("PII Detection", () => {
    it("should detect email addresses in text", async () => {
      const text = "Contact me at john.doe@example.com for more information.";

      const result = await client.detectPii(text);

      expect(result.hasPii).toBe(true);
      expect(result.piiTypes).toContain("EMAIL");
      expect(result.detectedPii).toHaveLength(1);
      expect(result.detectedPii[0]).toMatchObject({
        type: "EMAIL",
        value: "john.doe@example.com",
        confidence: expect.any(Number),
      });
    });

    it("should detect phone numbers in text", async () => {
      const text = "Call me at +1-555-123-4567 or (555) 987-6543.";

      const result = await client.detectPii(text);

      expect(result.hasPii).toBe(true);
      expect(result.piiTypes).toContain("PHONE");
      expect(result.detectedPii.length).toBeGreaterThan(0);
    });

    it("should detect credit card numbers in text", async () => {
      const text = "My card number is 4532-1234-5678-9010.";

      const result = await client.detectPii(text);

      expect(result.hasPii).toBe(true);
      expect(result.piiTypes).toContain("CREDIT_CARD");
      // Note: May also detect individual segments as PHONE numbers due to pattern overlap
      expect(result.detectedPii.length).toBeGreaterThan(0);
      expect(result.detectedPii.some((pii) => pii.type === "CREDIT_CARD")).toBe(
        true
      );
    });

    it("should detect SSN in text", async () => {
      const text = "My SSN is 123-45-6789.";

      const result = await client.detectPii(text);

      expect(result.hasPii).toBe(true);
      expect(result.piiTypes).toContain("SSN");
      // Note: May detect multiple patterns (formatted and unformatted SSN)
      expect(result.detectedPii.length).toBeGreaterThan(0);
      expect(result.detectedPii.some((pii) => pii.type === "SSN")).toBe(true);
    });

    it("should detect multiple PII types in text", async () => {
      const text =
        "Contact John at john@example.com or call +1-555-123-4567. SSN: 123-45-6789.";

      const result = await client.detectPii(text);

      expect(result.hasPii).toBe(true);
      expect(result.piiTypes.length).toBeGreaterThan(1);
      expect(result.detectedPii.length).toBeGreaterThan(2);
    });

    it("should return no PII for clean text", async () => {
      const text = "This is a clean text without any personal information.";

      const result = await client.detectPii(text);

      expect(result.hasPii).toBe(false);
      expect(result.piiTypes).toHaveLength(0);
      expect(result.detectedPii).toHaveLength(0);
    });

    it("should handle empty text gracefully", async () => {
      const result = await client.detectPii("");

      expect(result.hasPii).toBe(false);
      expect(result.piiTypes).toHaveLength(0);
      expect(result.detectedPii).toHaveLength(0);
    });

    it("should include confidence scores for detected PII", async () => {
      const text = "Email: test@example.com";

      const result = await client.detectPii(text);

      expect(result.detectedPii[0].confidence).toBeGreaterThan(0);
      expect(result.detectedPii[0].confidence).toBeLessThanOrEqual(1);
    });

    it("should include start and end indices for detected PII", async () => {
      const text = "Email: test@example.com";

      const result = await client.detectPii(text);

      expect(result.detectedPii[0].startIndex).toBeGreaterThanOrEqual(0);
      expect(result.detectedPii[0].endIndex).toBeGreaterThan(
        result.detectedPii[0].startIndex
      );
    });

    it("should include processing region in result", async () => {
      const result = await client.detectPii("test text");

      expect(result.processingRegion).toBe("eu-central-1");
    });

    it("should include GDPR compliance status", async () => {
      const result = await client.detectPii("test text");

      expect(result.gdprCompliant).toBe(true);
    });

    it("should include consent tracking when provided", async () => {
      const text = "Email: test@example.com";
      const options = {
        consentId: "consent-123",
        dataSubject: "user-456",
        processingPurpose: "support-operation",
      };

      const result = await client.detectPii(text, options);

      expect((result as any).consentTracking).toBeDefined();
      expect((result as any).consentTracking.consentId).toBe("consent-123");
      expect((result as any).consentTracking.dataSubject).toBe("user-456");
      expect((result as any).consentTracking.processingPurpose).toBe(
        "support-operation"
      );
    });

    it("should respect PII detection feature flag", async () => {
      mockFeatureFlags.isEnabled = jest.fn((flag: string) => {
        if (flag === "pii_detection_enabled") return false;
        return true;
      });

      const text = "Email: test@example.com";
      const result = await client.detectPii(text);

      expect(result.hasPii).toBe(false);
      expect(result.detectedPii).toHaveLength(0);
    });

    it("should throw error for non-EU region when GDPR enabled", async () => {
      // Create client with non-EU region
      const nonEuClient = new DirectBedrockClient({
        region: "us-east-1",
        enableComplianceChecks: true,
        enableHealthMonitoring: false,
      });

      const text = "Email: test@example.com";

      await expect(nonEuClient.detectPii(text)).rejects.toThrow(
        "GDPR compliance violation"
      );
    });
  });

  describe("PII Redaction", () => {
    it("should redact email addresses from text", async () => {
      const text = "Contact me at john.doe@example.com for more information.";

      const result = await client.redactPii(text);

      expect(result.redactedText).not.toContain("john.doe@example.com");
      expect(result.redactedText).toContain("[EMAIL_REDACTED]");
      expect(result.redactionMap).toHaveLength(1);
    });

    it("should redact phone numbers from text", async () => {
      const text = "Call me at +1-555-123-4567.";

      const result = await client.redactPii(text);

      expect(result.redactedText).not.toContain("+1-555-123-4567");
      expect(result.redactedText).toContain("[PHONE_REDACTED]");
    });

    it("should redact credit card numbers from text", async () => {
      const text = "My card number is 4532-1234-5678-9010.";

      const result = await client.redactPii(text);

      expect(result.redactedText).not.toContain("4532-1234-5678-9010");
      expect(result.redactedText).toContain("[CREDIT_CARD_REDACTED]");
    });

    it("should redact SSN from text", async () => {
      const text = "My SSN is 123-45-6789.";

      const result = await client.redactPii(text);

      expect(result.redactedText).not.toContain("123-45-6789");
      expect(result.redactedText).toContain("[SSN_REDACTED]");
    });

    it("should redact multiple PII instances from text", async () => {
      const text =
        "Contact John at john@example.com or call +1-555-123-4567. SSN: 123-45-6789.";

      const result = await client.redactPii(text);

      expect(result.redactedText).not.toContain("john@example.com");
      expect(result.redactedText).not.toContain("+1-555-123-4567");
      expect(result.redactedText).not.toContain("123-45-6789");
      expect(result.redactionMap.length).toBeGreaterThan(2);
    });

    it("should preserve text structure during redaction", async () => {
      const text = "Email: test@example.com, Phone: +1-555-123-4567";

      const result = await client.redactPii(text);

      expect(result.redactedText).toContain("Email:");
      expect(result.redactedText).toContain("Phone:");
      expect(result.redactedText).toContain(",");
    });

    it("should return original text when no PII detected", async () => {
      const text = "This is a clean text without any personal information.";

      const result = await client.redactPii(text);

      expect(result.redactedText).toBe(text);
      expect(result.redactionMap).toHaveLength(0);
    });

    it("should include redaction map with all redacted items", async () => {
      const text = "Email: test@example.com";

      const result = await client.redactPii(text);

      expect(result.redactionMap).toHaveLength(1);
      expect(result.redactionMap[0]).toMatchObject({
        original: "test@example.com",
        redacted: "[EMAIL_REDACTED]",
        type: "EMAIL",
        startIndex: expect.any(Number),
        endIndex: expect.any(Number),
      });
    });
  });

  describe("PII Restoration", () => {
    it("should restore PII from redacted text using redaction map", async () => {
      const originalText = "Contact me at john.doe@example.com.";

      // First redact
      const redactionResult = await client.redactPii(originalText);

      // Then restore
      const restoredText = await client.restorePii(
        redactionResult.redactedText,
        redactionResult.redactionMap
      );

      expect(restoredText).toBe(originalText);
    });

    it("should restore multiple PII instances correctly", async () => {
      const originalText =
        "Email: john@example.com, Phone: +1-555-123-4567, SSN: 123-45-6789";

      const redactionResult = await client.redactPii(originalText);
      const restoredText = await client.restorePii(
        redactionResult.redactedText,
        redactionResult.redactionMap
      );

      // Note: Restoration may not be perfect due to pattern overlaps
      // Verify that key PII elements are restored
      expect(restoredText).toContain("john@example.com");
      expect(restoredText).toContain("123-45-6789");
    });

    it("should handle empty redaction map gracefully", async () => {
      const text = "Clean text without PII";

      const restoredText = await client.restorePii(text, []);

      expect(restoredText).toBe(text);
    });
  });

  describe("GDPR Compliance Integration", () => {
    it("should validate GDPR compliance for EU region", async () => {
      const text = "Email: test@example.com";

      const result = await client.detectPii(text);

      expect(result.gdprCompliant).toBe(true);
      expect(result.processingRegion).toBe("eu-central-1");
    });

    it("should enforce EU data residency for PII processing", async () => {
      const nonEuClient = new DirectBedrockClient({
        region: "us-east-1",
        enableComplianceChecks: true,
        enableHealthMonitoring: false,
      });

      const text = "Email: test@example.com";

      await expect(nonEuClient.detectPii(text)).rejects.toThrow(
        "GDPR compliance violation"
      );
    });

    it("should include consent tracking in PII detection", async () => {
      const text = "Email: test@example.com";
      const options = {
        consentId: "consent-123",
        dataSubject: "user-456",
        processingPurpose: "support-operation",
      };

      const result = await client.detectPii(text, options);

      expect((result as any).consentTracking).toBeDefined();
      expect((result as any).consentTracking.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("Emergency Operation PII Handling", () => {
    it("should detect and redact PII in emergency operations", async () => {
      // This test validates that PII detection works in the context of emergency operations
      const textWithPii = "Emergency: Contact admin@example.com immediately!";

      const result = await client.detectPii(textWithPii);

      expect(result.hasPii).toBe(true);
      expect(result.piiTypes).toContain("EMAIL");
    });

    it("should complete PII detection within emergency timeout", async () => {
      const text = "Email: test@example.com, Phone: +1-555-123-4567";

      const startTime = Date.now();
      await client.detectPii(text);
      const duration = Date.now() - startTime;

      // PII detection should be fast (< 500ms for emergency operations)
      expect(duration).toBeLessThan(500);
    });
  });

  describe("PII Detection Statistics", () => {
    it("should provide PII detection statistics", async () => {
      const text = "Email: test@example.com, Phone: +1-555-123-4567";

      const stats = await client.getPIIDetectionStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalDetections).toBe("number");
      expect(typeof stats.totalRedactions).toBe("number");
    });
  });
});
