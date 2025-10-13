/**
 * Direct Bedrock Client - KMS Integration Tests
 *
 * Tests for KMS encryption integration in Direct Bedrock Client
 * for securing sensitive operation data.
 */

import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { KMSClient } from "@aws-sdk/client-kms";

// Mock AWS SDK clients
jest.mock("@aws-sdk/client-bedrock-runtime");
jest.mock("@aws-sdk/client-kms");
jest.mock("../audit-trail-system");
jest.mock("../safety/pii-toxicity-detector");
jest.mock("../gdpr-hybrid-compliance-validator");

// Mock KMSEncryptionService with a factory function
jest.mock("../kms-encryption-service", () => {
  const mockService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    encryptPII: jest.fn(),
    decryptPII: jest.fn(),
    encryptOperationContext: jest.fn(),
    decryptOperationContext: jest.fn(),
    getKeyRotationStatus: jest.fn(),
    destroy: jest.fn(),
  };

  return {
    KMSEncryptionService: jest.fn().mockImplementation(() => mockService),
    __mockService: mockService, // Export for test access
  };
});

// Import after mocks are set up
import { DirectBedrockClient } from "../direct-bedrock-client";

// Get the mock service from the module mock
const mockKMSService = (require("../kms-encryption-service") as any)
  .__mockService;

describe("DirectBedrockClient - KMS Integration", () => {
  let client: DirectBedrockClient;
  let mockBedrockClient: jest.Mocked<BedrockRuntimeClient>;
  let mockKMSClient: jest.Mocked<KMSClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mock functions
    Object.values(mockKMSService).forEach((mockFn) => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });

    // Mock Bedrock client
    mockBedrockClient = {
      send: jest.fn(),
    } as any;

    (BedrockRuntimeClient as jest.Mock).mockImplementation(
      () => mockBedrockClient
    );

    // Mock KMS client
    mockKMSClient = {
      send: jest.fn(),
    } as any;

    (KMSClient as jest.Mock).mockImplementation(() => mockKMSClient);

    // Create client instance
    client = new DirectBedrockClient({
      region: "eu-central-1",
      enableCircuitBreaker: true,
      enableHealthMonitoring: false,
      enableComplianceChecks: true,
    });
  });

  afterEach(() => {
    if (client) {
      client.destroy();
    }
  });

  describe("Sensitive Data Encryption", () => {
    it("should encrypt sensitive operation data", async () => {
      // Mock KMS encryption response
      mockKMSService.encrypt.mockResolvedValueOnce({
        ciphertext: "encrypted-data-base64",
        keyId: "test-key-id",
        encryptionAlgorithm: "SYMMETRIC_DEFAULT",
        timestamp: new Date(),
      });

      const encrypted = await client.encryptSensitiveData("sensitive-info", {
        operationId: "op-123",
        dataType: "credentials",
        userId: "user-456",
      });

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(mockKMSService.encrypt).toHaveBeenCalled();
    });

    it("should decrypt sensitive operation data", async () => {
      // Mock KMS decryption response
      mockKMSService.decrypt.mockResolvedValueOnce({
        plaintext: "sensitive-info",
        keyId: "test-key-id",
        timestamp: new Date(),
      });

      const decrypted = await client.decryptSensitiveData("encrypted-data", {
        operationId: "op-123",
        dataType: "credentials",
        userId: "user-456",
      });

      expect(decrypted).toBe("sensitive-info");
      expect(mockKMSService.decrypt).toHaveBeenCalled();
    });

    it("should handle encryption errors gracefully", async () => {
      mockKMSService.encrypt.mockRejectedValueOnce(
        new Error("KMS service unavailable")
      );

      await expect(
        client.encryptSensitiveData("test-data", {
          operationId: "op-123",
          dataType: "context",
        })
      ).rejects.toThrow("Failed to encrypt sensitive data");
    });

    it("should handle decryption errors gracefully", async () => {
      mockKMSService.decrypt.mockRejectedValueOnce(
        new Error("Invalid ciphertext")
      );

      await expect(
        client.decryptSensitiveData("invalid-ciphertext", {
          operationId: "op-123",
          dataType: "context",
        })
      ).rejects.toThrow("Failed to decrypt sensitive data");
    });
  });

  describe("PII Encryption for Storage", () => {
    it("should encrypt PII data before storage", async () => {
      mockKMSService.encryptPII.mockResolvedValueOnce({
        ciphertext: "encrypted-pii-base64",
        keyId: "test-key-id",
        encryptionAlgorithm: "SYMMETRIC_DEFAULT",
        timestamp: new Date(),
      });

      const encrypted = await client.encryptPIIForStorage(
        "john.doe@example.com",
        "EMAIL",
        "op-789"
      );

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
    });

    it("should decrypt PII data from storage", async () => {
      mockKMSService.decryptPII.mockResolvedValueOnce({
        plaintext: "john.doe@example.com",
        keyId: "test-key-id",
        timestamp: new Date(),
      });

      const decrypted = await client.decryptPIIFromStorage(
        "encrypted-pii",
        "EMAIL",
        "op-789"
      );

      expect(decrypted).toBe("john.doe@example.com");
    });

    it("should handle PII encryption errors", async () => {
      mockKMSService.encryptPII.mockRejectedValueOnce(
        new Error("Encryption failed")
      );

      await expect(
        client.encryptPIIForStorage("test@example.com", "EMAIL", "op-123")
      ).rejects.toThrow("Failed to encrypt PII for storage");
    });

    it("should handle PII decryption errors", async () => {
      mockKMSService.decryptPII.mockRejectedValueOnce(
        new Error("Decryption failed")
      );

      await expect(
        client.decryptPIIFromStorage("encrypted-pii", "EMAIL", "op-123")
      ).rejects.toThrow("Failed to decrypt PII from storage");
    });
  });

  describe("Operation Context Encryption for Audit", () => {
    it("should encrypt operation context for audit trail", async () => {
      mockKMSService.encryptOperationContext.mockResolvedValueOnce({
        ciphertext: "encrypted-context-base64",
        keyId: "test-key-id",
        encryptionAlgorithm: "SYMMETRIC_DEFAULT",
        timestamp: new Date(),
      });

      const context = {
        userId: "user-123",
        operation: "emergency",
        metadata: { priority: "critical" },
      };

      const encrypted = await client.encryptOperationContextForAudit(
        context,
        "op-456"
      );

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
    });

    it("should decrypt operation context from audit trail", async () => {
      const originalContext = {
        userId: "user-123",
        operation: "emergency",
        metadata: { priority: "critical" },
      };

      mockKMSService.decryptOperationContext.mockResolvedValueOnce(
        originalContext
      );

      const decrypted = await client.decryptOperationContextFromAudit(
        "encrypted-context",
        "op-456"
      );

      expect(decrypted).toEqual(originalContext);
    });

    it("should handle context encryption errors", async () => {
      mockKMSService.encryptOperationContext.mockRejectedValueOnce(
        new Error("Encryption failed")
      );

      await expect(
        client.encryptOperationContextForAudit({ test: "data" }, "op-123")
      ).rejects.toThrow("Failed to encrypt operation context");
    });

    it("should handle context decryption errors", async () => {
      mockKMSService.decryptOperationContext.mockRejectedValueOnce(
        new Error("Decryption failed")
      );

      await expect(
        client.decryptOperationContextFromAudit("encrypted-context", "op-123")
      ).rejects.toThrow("Failed to decrypt operation context");
    });
  });

  describe("KMS Service Access", () => {
    it("should provide access to KMS encryption service", () => {
      const kmsService = client.getKMSEncryptionService();

      expect(kmsService).toBeDefined();
      expect(kmsService).toBe(mockKMSService);
    });

    it("should allow advanced KMS operations through service", async () => {
      const kmsService = client.getKMSEncryptionService();

      // Mock key rotation status
      mockKMSService.getKeyRotationStatus.mockResolvedValueOnce({
        keyId: "test-key-id",
        rotationEnabled: true,
      });

      const rotationStatus = await kmsService.getKeyRotationStatus(
        "test-key-id"
      );

      expect(rotationStatus.rotationEnabled).toBe(true);
    });
  });

  describe("Resource Cleanup", () => {
    it("should cleanup KMS resources on destroy", () => {
      const kmsService = client.getKMSEncryptionService();
      const destroySpy = jest.spyOn(kmsService, "destroy");

      client.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe("Integration with Support Operations", () => {
    it("should encrypt sensitive data in operation context", async () => {
      // Mock KMS encryption for context
      mockKMSService.encryptOperationContext.mockResolvedValueOnce({
        ciphertext: "encrypted-context-base64",
        keyId: "test-key-id",
        encryptionAlgorithm: "SYMMETRIC_DEFAULT",
        timestamp: new Date(),
        encryptionContext: {
          operationId: "op-emergency-001",
          contextType: "operation_context",
        },
      });

      const context = {
        userId: "user-123",
        credentials: "sensitive-api-key",
        metadata: { priority: "high" },
      };

      const encrypted = await client.encryptOperationContextForAudit(
        context,
        "op-emergency-001"
      );

      expect(encrypted).toBeDefined();
      expect(mockKMSService.encryptOperationContext).toHaveBeenCalled();
    });

    it("should decrypt context for audit review", async () => {
      const originalContext = {
        userId: "user-123",
        operation: "infrastructure_audit",
        findings: ["issue-1", "issue-2"],
      };

      mockKMSService.decryptOperationContext.mockResolvedValueOnce(
        originalContext
      );

      const decrypted = await client.decryptOperationContextFromAudit(
        "encrypted-audit-context",
        "op-audit-001"
      );

      expect(decrypted).toEqual(originalContext);
      expect(decrypted.findings).toHaveLength(2);
    });
  });

  describe("GDPR Compliance with KMS", () => {
    it("should encrypt PII in EU region for GDPR compliance", async () => {
      const euClient = new DirectBedrockClient({
        region: "eu-central-1",
        enableComplianceChecks: true,
      });

      mockKMSService.encryptPII.mockResolvedValueOnce({
        ciphertext: "encrypted-pii-base64",
        keyId: "eu-key-id",
        encryptionAlgorithm: "SYMMETRIC_DEFAULT",
        timestamp: new Date(),
      });

      const encrypted = await euClient.encryptPIIForStorage(
        "gdpr-protected-data",
        "PERSONAL_DATA",
        "op-gdpr-001"
      );

      expect(encrypted).toBeDefined();
      expect(mockKMSService.encryptPII).toHaveBeenCalled();

      euClient.destroy();
    });

    it("should maintain encryption context for audit trail", async () => {
      mockKMSService.encrypt.mockResolvedValueOnce({
        ciphertext: "encrypted-data-base64",
        keyId: "test-key-id",
        encryptionAlgorithm: "SYMMETRIC_DEFAULT",
        timestamp: new Date(),
        encryptionContext: {
          operationId: "op-gdpr-002",
          dataType: "pii",
          userId: "eu-user-123",
        },
      });

      await client.encryptSensitiveData("gdpr-data", {
        operationId: "op-gdpr-002",
        dataType: "pii",
        userId: "eu-user-123",
      });

      expect(mockKMSService.encrypt).toHaveBeenCalled();
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should provide detailed error messages on encryption failure", async () => {
      mockKMSService.encrypt.mockRejectedValueOnce(
        new Error("KMS key not found: alias/missing-key")
      );

      await expect(
        client.encryptSensitiveData("test-data", {
          operationId: "op-123",
          dataType: "credentials",
        })
      ).rejects.toThrow("Failed to encrypt sensitive data");
    });

    it("should provide detailed error messages on decryption failure", async () => {
      mockKMSService.decrypt.mockRejectedValueOnce(
        new Error("Invalid encryption context")
      );

      await expect(
        client.decryptSensitiveData("encrypted-data", {
          operationId: "op-123",
          dataType: "credentials",
        })
      ).rejects.toThrow("Failed to decrypt sensitive data");
    });
  });
});
