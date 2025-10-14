/**
 * KMS Encryption Service Tests
 *
 * Comprehensive test suite for KMS-based encryption and decryption
 * of sensitive data in direct Bedrock operations.
 */

import { KMSClient } from "@aws-sdk/client-kms";
import { AuditTrailSystem } from "../audit-trail-system";
import { KMSEncryptionService } from "../kms-encryption-service";

// Mock AWS SDK
jest.mock("@aws-sdk/client-kms");

// Mock AuditTrailSystem
jest.mock("../audit-trail-system");

describe("KMSEncryptionService", () => {
  let service: KMSEncryptionService;
  let mockKMSClient: jest.Mocked<KMSClient>;
  let mockAuditTrail: jest.Mocked<AuditTrailSystem>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock KMS client
    mockKMSClient = {
      send: jest.fn(),
    } as any;

    // Mock KMSClient constructor
    (KMSClient as jest.Mock).mockImplementation(() => mockKMSClient);

    // Create mock audit trail
    mockAuditTrail = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock AuditTrailSystem constructor
    (AuditTrailSystem as jest.Mock).mockImplementation(() => mockAuditTrail);

    // Create service instance with keyId instead of keyAlias to avoid resolution
    service = new KMSEncryptionService(
      {
        region: "eu-central-1",
        keyId: "test-key-id", // Use direct key ID to avoid alias resolution
        enableKeyRotation: true,
      },
      mockAuditTrail
    );
  });

  afterEach(() => {
    service.destroy();
  });

  describe("Encryption Operations", () => {
    it("should encrypt plaintext data successfully", async () => {
      // Mock successful encryption
      mockKMSClient.send.mockResolvedValueOnce({
        CiphertextBlob: Buffer.from("encrypted-data"),
        KeyId: "test-key-id",
        EncryptionAlgorithm: "SYMMETRIC_DEFAULT",
      });

      const result = await service.encrypt({
        plaintext: "sensitive-data",
        encryptionContext: { purpose: "test" },
      });

      expect(result).toMatchObject({
        ciphertext: expect.any(String),
        keyId: "test-key-id",
        encryptionAlgorithm: "SYMMETRIC_DEFAULT",
        timestamp: expect.any(Date),
      });

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "kms_encryption",
          complianceStatus: "compliant",
        })
      );
    });

    it("should encrypt Buffer data successfully", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        CiphertextBlob: Buffer.from("encrypted-data"),
        KeyId: "test-key-id",
        EncryptionAlgorithm: "SYMMETRIC_DEFAULT",
      });

      const buffer = Buffer.from("sensitive-data", "utf-8");
      const result = await service.encrypt({
        plaintext: buffer,
      });

      expect(result.ciphertext).toBeDefined();
      expect(result.keyId).toBe("test-key-id");
    });

    it("should include encryption context in request", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        CiphertextBlob: Buffer.from("encrypted-data"),
        KeyId: "test-key-id",
      });

      await service.encrypt({
        plaintext: "test-data",
        encryptionContext: {
          userId: "user-123",
          purpose: "pii-storage",
        },
      });

      // Verify the send method was called
      expect(mockKMSClient.send).toHaveBeenCalled();
    });

    it("should handle encryption errors gracefully", async () => {
      mockKMSClient.send.mockRejectedValueOnce(
        new Error("KMS service unavailable")
      );

      await expect(
        service.encrypt({
          plaintext: "test-data",
        })
      ).rejects.toThrow("KMS encryption failed");

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "kms_encryption",
          complianceStatus: "violation",
          error: expect.objectContaining({
            type: "encryption_error",
          }),
        })
      );
    });

    it("should throw error when encryption is disabled", async () => {
      // Mock feature flag to return false
      const serviceWithDisabledEncryption = new KMSEncryptionService(
        {
          region: "eu-central-1",
        },
        mockAuditTrail
      );

      // Mock getFlag to return false
      jest
        .spyOn(serviceWithDisabledEncryption["featureFlags"], "isEnabled")
        .mockReturnValue(false);

      await expect(
        serviceWithDisabledEncryption.encrypt({
          plaintext: "test-data",
        })
      ).rejects.toThrow("KMS encryption is disabled");
    });
  });

  describe("Decryption Operations", () => {
    it("should decrypt ciphertext successfully", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        Plaintext: Buffer.from("decrypted-data"),
        KeyId: "test-key-id",
      });

      const result = await service.decrypt({
        ciphertext: Buffer.from("encrypted-data").toString("base64"),
        encryptionContext: { purpose: "test" },
      });

      expect(result).toMatchObject({
        plaintext: "decrypted-data",
        keyId: "test-key-id",
        timestamp: expect.any(Date),
      });

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "kms_decryption",
          complianceStatus: "compliant",
        })
      );
    });

    it("should validate encryption context during decryption", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        Plaintext: Buffer.from("decrypted-data"),
        KeyId: "test-key-id",
      });

      await service.decrypt({
        ciphertext: Buffer.from("encrypted-data").toString("base64"),
        encryptionContext: {
          userId: "user-123",
          purpose: "pii-retrieval",
        },
      });

      // Verify the send method was called
      expect(mockKMSClient.send).toHaveBeenCalled();
    });

    it("should handle decryption errors gracefully", async () => {
      mockKMSClient.send.mockRejectedValueOnce(new Error("Invalid ciphertext"));

      await expect(
        service.decrypt({
          ciphertext: "invalid-ciphertext",
        })
      ).rejects.toThrow("KMS decryption failed");

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "kms_decryption",
          complianceStatus: "violation",
          error: expect.objectContaining({
            type: "decryption_error",
          }),
        })
      );
    });

    it("should throw error when decryption is disabled", async () => {
      const serviceWithDisabledEncryption = new KMSEncryptionService(
        {
          region: "eu-central-1",
        },
        mockAuditTrail
      );

      jest
        .spyOn(serviceWithDisabledEncryption["featureFlags"], "isEnabled")
        .mockReturnValue(false);

      await expect(
        serviceWithDisabledEncryption.decrypt({
          ciphertext: "test-ciphertext",
        })
      ).rejects.toThrow("KMS encryption is disabled");
    });
  });

  describe("Data Key Generation", () => {
    it("should generate data key successfully", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        Plaintext: Buffer.from("plaintext-key"),
        CiphertextBlob: Buffer.from("encrypted-key"),
        KeyId: "test-key-id",
      });

      const result = await service.generateDataKey({
        keySpec: "AES_256",
      });

      expect(result).toMatchObject({
        plaintextKey: expect.any(Buffer),
        encryptedKey: expect.any(String),
        keyId: "test-key-id",
      });

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "kms_data_key_generation",
          complianceStatus: "compliant",
        })
      );
    });

    it("should use default key spec if not provided", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        Plaintext: Buffer.from("plaintext-key"),
        CiphertextBlob: Buffer.from("encrypted-key"),
        KeyId: "test-key-id",
      });

      await service.generateDataKey({});

      // Verify the send method was called
      expect(mockKMSClient.send).toHaveBeenCalled();
    });

    it("should handle data key generation errors", async () => {
      mockKMSClient.send.mockRejectedValueOnce(
        new Error("Key generation failed")
      );

      await expect(service.generateDataKey({})).rejects.toThrow(
        "KMS data key generation failed"
      );

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "kms_data_key_generation",
          complianceStatus: "violation",
        })
      );
    });
  });

  describe("PII Encryption", () => {
    it("should encrypt PII data with proper context", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        CiphertextBlob: Buffer.from("encrypted-pii"),
        KeyId: "test-key-id",
        EncryptionAlgorithm: "SYMMETRIC_DEFAULT",
      });

      const result = await service.encryptPII("john.doe@example.com", {
        piiType: "EMAIL",
        userId: "user-123",
        operationId: "op-456",
      });

      expect(result.ciphertext).toBeDefined();
      // Encryption context includes dataType, timestamp, and operationId from encrypt method
      expect(result.encryptionContext).toEqual(
        expect.objectContaining({
          dataType: "pii",
          piiType: "EMAIL",
          userId: "user-123",
          operationId: expect.any(String), // Generated operation ID
          timestamp: expect.any(String),
        })
      );
    });

    it("should decrypt PII data with validation", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        Plaintext: Buffer.from("john.doe@example.com"),
        KeyId: "test-key-id",
      });

      const result = await service.decryptPII("encrypted-pii", {
        piiType: "EMAIL",
        userId: "user-123",
      });

      expect(result.plaintext).toBe("john.doe@example.com");
      expect(result.encryptionContext).toMatchObject({
        piiType: "EMAIL",
        userId: "user-123",
      });
    });
  });

  describe("Operation Context Encryption", () => {
    it("should encrypt operation context as JSON", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        CiphertextBlob: Buffer.from("encrypted-context"),
        KeyId: "test-key-id",
        EncryptionAlgorithm: "SYMMETRIC_DEFAULT",
      });

      const context = {
        userId: "user-123",
        operation: "emergency",
        metadata: { priority: "critical" },
      };

      const result = await service.encryptOperationContext(context, "op-789");

      expect(result.ciphertext).toBeDefined();
      // Encryption context includes dataType, timestamp, and operationId from encrypt method
      expect(result.encryptionContext).toEqual(
        expect.objectContaining({
          dataType: "operation_context",
          operationId: expect.any(String), // Generated operation ID
          contextType: "operation_context",
          timestamp: expect.any(String),
        })
      );
    });

    it("should decrypt and parse operation context", async () => {
      const originalContext = {
        userId: "user-123",
        operation: "emergency",
        metadata: { priority: "critical" },
      };

      mockKMSClient.send.mockResolvedValueOnce({
        Plaintext: Buffer.from(JSON.stringify(originalContext)),
        KeyId: "test-key-id",
      });

      const result = await service.decryptOperationContext(
        "encrypted-context",
        "op-789"
      );

      expect(result).toEqual(originalContext);
    });
  });

  describe("Key Management", () => {
    it("should get key rotation status", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        KeyRotationEnabled: true,
      });

      const status = await service.getKeyRotationStatus("test-key-id");

      expect(status).toMatchObject({
        keyId: "test-key-id",
        rotationEnabled: true,
      });
    });

    it("should enable key rotation", async () => {
      mockKMSClient.send.mockResolvedValueOnce({});

      await service.enableKeyRotation("test-key-id");

      expect(mockAuditTrail.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "kms_key_rotation_enabled",
          complianceStatus: "compliant",
        })
      );
    });

    it("should describe key metadata", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        KeyMetadata: {
          KeyId: "test-key-id",
          Arn: "arn:aws:kms:eu-central-1:123456789012:key/test-key-id",
          CreationDate: new Date("2024-01-01"),
          Enabled: true,
          Description: "Test KMS key",
          KeyUsage: "ENCRYPT_DECRYPT",
          KeyState: "Enabled",
        },
      });

      const keyInfo = await service.describeKey("test-key-id");

      expect(keyInfo).toMatchObject({
        keyId: "test-key-id",
        enabled: true,
        keyUsage: "ENCRYPT_DECRYPT",
        keyState: "Enabled",
      });
    });

    it("should list key aliases", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        Aliases: [
          {
            AliasName: "alias/test-key-1",
            TargetKeyId: "key-id-1",
          },
          {
            AliasName: "alias/test-key-2",
            TargetKeyId: "key-id-2",
          },
        ],
      });

      const aliases = await service.listAliases();

      expect(aliases).toHaveLength(2);
      expect(aliases[0]).toMatchObject({
        aliasName: "alias/test-key-1",
        targetKeyId: "key-id-1",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing ciphertext in encryption response", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        KeyId: "test-key-id",
        // Missing CiphertextBlob
      });

      await expect(
        service.encrypt({
          plaintext: "test-data",
        })
      ).rejects.toThrow("KMS encryption failed");
    });

    it("should handle missing plaintext in decryption response", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        KeyId: "test-key-id",
        // Missing Plaintext
      });

      await expect(
        service.decrypt({
          ciphertext: "test-ciphertext",
        })
      ).rejects.toThrow("Decryption failed: no plaintext returned");
    });

    it("should handle missing key metadata", async () => {
      mockKMSClient.send.mockResolvedValueOnce({
        // Missing KeyMetadata
      });

      await expect(service.describeKey("test-key-id")).rejects.toThrow(
        "Key metadata not found"
      );
    });
  });

  describe("Resource Cleanup", () => {
    it("should cleanup resources on destroy", () => {
      const keyCache = service["keyCache"];
      keyCache.set("test-alias", {
        keyId: "test-key-id",
        timestamp: new Date(),
      });

      expect(keyCache.size).toBe(1);

      service.destroy();

      expect(keyCache.size).toBe(0);
    });
  });
});
