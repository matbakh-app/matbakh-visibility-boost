/**
 * KMS Encryption Service for Direct Bedrock Operations
 *
 * This module provides KMS-based encryption and decryption for sensitive data
 * in direct Bedrock operations, ensuring GDPR compliance and data protection.
 *
 * Features:
 * - Encrypt/decrypt sensitive operation data
 * - Secure PII storage with KMS encryption
 * - Audit trail integration for encryption operations
 * - Key rotation support
 * - Multi-region key management
 */

import {
  DecryptCommand,
  DescribeKeyCommand,
  EnableKeyRotationCommand,
  EncryptCommand,
  GenerateDataKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListAliasesCommand,
} from "@aws-sdk/client-kms";
import { AiFeatureFlags } from "./ai-feature-flags";
import { AuditTrailSystem } from "./audit-trail-system";

// KMS Configuration
export interface KMSEncryptionConfig {
  region: string;
  keyId?: string; // KMS Key ID or ARN
  keyAlias?: string; // KMS Key Alias (e.g., alias/matbakh-ai)
  enableKeyRotation: boolean;
  encryptionContext?: Record<string, string>; // Additional encryption context
  maxRetries: number;
  timeout: number;
}

// Encryption Request
export interface EncryptionRequest {
  plaintext: string | Buffer;
  encryptionContext?: Record<string, string>;
  keyId?: string; // Override default key
}

// Encryption Response
export interface EncryptionResponse {
  ciphertext: string; // Base64-encoded encrypted data
  keyId: string; // KMS Key ID used for encryption
  encryptionContext?: Record<string, string>;
  encryptionAlgorithm: string;
  timestamp: Date;
}

// Decryption Request
export interface DecryptionRequest {
  ciphertext: string; // Base64-encoded encrypted data
  encryptionContext?: Record<string, string>;
  keyId?: string; // Optional key ID for validation
}

// Decryption Response
export interface DecryptionResponse {
  plaintext: string;
  keyId: string; // KMS Key ID used for decryption
  encryptionContext?: Record<string, string>;
  timestamp: Date;
}

// Data Key Generation Request
export interface DataKeyRequest {
  keySpec?: "AES_256" | "AES_128";
  encryptionContext?: Record<string, string>;
}

// Data Key Response
export interface DataKeyResponse {
  plaintextKey: Buffer; // Plaintext data key (use and discard immediately)
  encryptedKey: string; // Encrypted data key (store for later decryption)
  keyId: string;
}

// Key Rotation Status
export interface KeyRotationStatus {
  keyId: string;
  rotationEnabled: boolean;
  nextRotationDate?: Date;
  lastRotationDate?: Date;
}

// Sensitive Data Types for Encryption
export type SensitiveDataType =
  | "pii"
  | "credentials"
  | "api_keys"
  | "tokens"
  | "operation_context"
  | "user_data"
  | "audit_data";

/**
 * KMS Encryption Service for Direct Bedrock Operations
 */
export class KMSEncryptionService {
  private client: KMSClient;
  private config: KMSEncryptionConfig;
  private featureFlags: AiFeatureFlags;
  private auditTrail: AuditTrailSystem;
  private keyCache: Map<string, { keyId: string; timestamp: Date }>;

  constructor(
    config: Partial<KMSEncryptionConfig> = {},
    auditTrail?: AuditTrailSystem
  ) {
    this.config = {
      region: process.env.AWS_REGION || "eu-central-1",
      keyAlias: process.env.KMS_KEY_ALIAS || "alias/matbakh-ai",
      enableKeyRotation: true,
      maxRetries: 3,
      timeout: 5000,
      ...config,
    };

    // Initialize KMS client
    this.client = new KMSClient({
      region: this.config.region,
      maxAttempts: this.config.maxRetries,
      requestHandler: {
        requestTimeout: this.config.timeout,
      },
    });

    // Initialize feature flags
    this.featureFlags = new AiFeatureFlags();

    // Initialize audit trail
    this.auditTrail =
      auditTrail ||
      new AuditTrailSystem({
        complianceMode: "strict",
        enableIntegrityChecking: true,
        retentionDays: 2555, // 7 years for GDPR compliance
      });

    // Initialize key cache
    this.keyCache = new Map();
  }

  /**
   * Encrypt sensitive data using KMS
   */
  async encrypt(
    request: EncryptionRequest,
    dataType: SensitiveDataType = "operation_context"
  ): Promise<EncryptionResponse> {
    const startTime = Date.now();
    const operationId = this.generateOperationId();

    try {
      // Check if KMS encryption is enabled
      if (!this.featureFlags.isEnabled("kms_encryption_enabled", true)) {
        throw new Error("KMS encryption is disabled");
      }

      // Get key ID (use provided key or default)
      const keyId = await this.resolveKeyId(request.keyId);

      // Build encryption context
      const encryptionContext = {
        ...this.config.encryptionContext,
        ...request.encryptionContext,
        dataType,
        operationId,
        timestamp: new Date().toISOString(),
      };

      // Convert plaintext to Buffer if string
      const plaintext =
        typeof request.plaintext === "string"
          ? Buffer.from(request.plaintext, "utf-8")
          : request.plaintext;

      // Encrypt data
      const command = new EncryptCommand({
        KeyId: keyId,
        Plaintext: plaintext,
        EncryptionContext: encryptionContext,
      });

      const response = await this.client.send(command);

      if (!response.CiphertextBlob) {
        throw new Error("Encryption failed: no ciphertext returned");
      }

      // Convert ciphertext to base64
      const ciphertext = Buffer.from(response.CiphertextBlob).toString(
        "base64"
      );

      const result: EncryptionResponse = {
        ciphertext,
        keyId: response.KeyId || keyId,
        encryptionContext,
        encryptionAlgorithm:
          response.EncryptionAlgorithm || "SYMMETRIC_DEFAULT",
        timestamp: new Date(),
      };

      // Log encryption operation
      await this.auditTrail.logEvent({
        eventType: "kms_encryption",
        requestId: operationId,
        provider: "kms",
        complianceStatus: "compliant",
        metadata: {
          dataType,
          keyId: result.keyId,
          encryptionAlgorithm: result.encryptionAlgorithm,
          plaintextSize: plaintext.length,
          ciphertextSize: ciphertext.length,
          processingTimeMs: Date.now() - startTime,
        },
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log encryption error
      await this.auditTrail.logEvent({
        eventType: "kms_encryption",
        requestId: operationId,
        provider: "kms",
        complianceStatus: "violation",
        error: {
          type: "encryption_error",
          message: errorMessage,
        },
        metadata: {
          dataType,
          processingTimeMs: Date.now() - startTime,
        },
      });

      throw new Error(`KMS encryption failed: ${errorMessage}`);
    }
  }

  /**
   * Decrypt sensitive data using KMS
   */
  async decrypt(
    request: DecryptionRequest,
    dataType: SensitiveDataType = "operation_context"
  ): Promise<DecryptionResponse> {
    const startTime = Date.now();
    const operationId = this.generateOperationId();

    try {
      // Check if KMS encryption is enabled
      if (!this.featureFlags.isEnabled("kms_encryption_enabled", true)) {
        throw new Error("KMS encryption is disabled");
      }

      // Convert base64 ciphertext to Buffer
      const ciphertext = Buffer.from(request.ciphertext, "base64");

      // Build encryption context for validation
      const encryptionContext = request.encryptionContext;

      // Decrypt data
      const command = new DecryptCommand({
        CiphertextBlob: ciphertext,
        EncryptionContext: encryptionContext,
        ...(request.keyId && { KeyId: request.keyId }),
      });

      const response = await this.client.send(command);

      if (!response.Plaintext) {
        throw new Error("Decryption failed: no plaintext returned");
      }

      // Convert plaintext to string
      const plaintext = Buffer.from(response.Plaintext).toString("utf-8");

      const result: DecryptionResponse = {
        plaintext,
        keyId: response.KeyId || "unknown",
        encryptionContext,
        timestamp: new Date(),
      };

      // Log decryption operation
      await this.auditTrail.logEvent({
        eventType: "kms_decryption",
        requestId: operationId,
        provider: "kms",
        complianceStatus: "compliant",
        metadata: {
          dataType,
          keyId: result.keyId,
          ciphertextSize: ciphertext.length,
          plaintextSize: plaintext.length,
          processingTimeMs: Date.now() - startTime,
        },
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log decryption error
      await this.auditTrail.logEvent({
        eventType: "kms_decryption",
        requestId: operationId,
        provider: "kms",
        complianceStatus: "violation",
        error: {
          type: "decryption_error",
          message: errorMessage,
        },
        metadata: {
          dataType,
          processingTimeMs: Date.now() - startTime,
        },
      });

      throw new Error(`KMS decryption failed: ${errorMessage}`);
    }
  }

  /**
   * Generate data key for envelope encryption
   */
  async generateDataKey(
    request: DataKeyRequest = {}
  ): Promise<DataKeyResponse> {
    const startTime = Date.now();
    const operationId = this.generateOperationId();

    try {
      // Check if KMS encryption is enabled
      if (!this.featureFlags.isEnabled("kms_encryption_enabled", true)) {
        throw new Error("KMS encryption is disabled");
      }

      // Get key ID
      const keyId = await this.resolveKeyId();

      // Build encryption context
      const encryptionContext = {
        ...this.config.encryptionContext,
        ...request.encryptionContext,
        operationId,
        timestamp: new Date().toISOString(),
      };

      // Generate data key
      const command = new GenerateDataKeyCommand({
        KeyId: keyId,
        KeySpec: request.keySpec || "AES_256",
        EncryptionContext: encryptionContext,
      });

      const response = await this.client.send(command);

      if (!response.Plaintext || !response.CiphertextBlob) {
        throw new Error("Data key generation failed");
      }

      const result: DataKeyResponse = {
        plaintextKey: Buffer.from(response.Plaintext),
        encryptedKey: Buffer.from(response.CiphertextBlob).toString("base64"),
        keyId: response.KeyId || keyId,
      };

      // Log data key generation
      await this.auditTrail.logEvent({
        eventType: "kms_data_key_generation",
        requestId: operationId,
        provider: "kms",
        complianceStatus: "compliant",
        metadata: {
          keyId: result.keyId,
          keySpec: request.keySpec || "AES_256",
          processingTimeMs: Date.now() - startTime,
        },
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log data key generation error
      await this.auditTrail.logEvent({
        eventType: "kms_data_key_generation",
        requestId: operationId,
        provider: "kms",
        complianceStatus: "violation",
        error: {
          type: "data_key_generation_error",
          message: errorMessage,
        },
        metadata: {
          processingTimeMs: Date.now() - startTime,
        },
      });

      throw new Error(`KMS data key generation failed: ${errorMessage}`);
    }
  }

  /**
   * Get key rotation status
   */
  async getKeyRotationStatus(keyId?: string): Promise<KeyRotationStatus> {
    try {
      const resolvedKeyId = await this.resolveKeyId(keyId);

      // Get key rotation status
      const command = new GetKeyRotationStatusCommand({
        KeyId: resolvedKeyId,
      });

      const response = await this.client.send(command);

      return {
        keyId: resolvedKeyId,
        rotationEnabled: response.KeyRotationEnabled || false,
        // Note: AWS KMS doesn't provide rotation dates via API
        // These would need to be tracked separately
      };
    } catch (error) {
      throw new Error(
        `Failed to get key rotation status: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Enable key rotation
   */
  async enableKeyRotation(keyId?: string): Promise<void> {
    try {
      const resolvedKeyId = await this.resolveKeyId(keyId);

      const command = new EnableKeyRotationCommand({
        KeyId: resolvedKeyId,
      });

      await this.client.send(command);

      // Log key rotation enablement
      await this.auditTrail.logEvent({
        eventType: "kms_key_rotation_enabled",
        requestId: this.generateOperationId(),
        provider: "kms",
        complianceStatus: "compliant",
        metadata: {
          keyId: resolvedKeyId,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to enable key rotation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Describe KMS key
   */
  async describeKey(keyId?: string): Promise<{
    keyId: string;
    arn: string;
    creationDate?: Date;
    enabled: boolean;
    description?: string;
    keyUsage: string;
    keyState: string;
  }> {
    try {
      const resolvedKeyId = await this.resolveKeyId(keyId);

      const command = new DescribeKeyCommand({
        KeyId: resolvedKeyId,
      });

      const response = await this.client.send(command);

      if (!response.KeyMetadata) {
        throw new Error("Key metadata not found");
      }

      return {
        keyId: response.KeyMetadata.KeyId,
        arn: response.KeyMetadata.Arn || "",
        creationDate: response.KeyMetadata.CreationDate,
        enabled: response.KeyMetadata.Enabled || false,
        description: response.KeyMetadata.Description,
        keyUsage: response.KeyMetadata.KeyUsage || "ENCRYPT_DECRYPT",
        keyState: response.KeyMetadata.KeyState || "Unknown",
      };
    } catch (error) {
      throw new Error(
        `Failed to describe key: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * List key aliases
   */
  async listAliases(): Promise<
    Array<{ aliasName: string; targetKeyId: string }>
  > {
    try {
      const command = new ListAliasesCommand({});
      const response = await this.client.send(command);

      return (
        response.Aliases?.map((alias) => ({
          aliasName: alias.AliasName || "",
          targetKeyId: alias.TargetKeyId || "",
        })) || []
      );
    } catch (error) {
      throw new Error(
        `Failed to list aliases: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Encrypt PII data with additional context
   */
  async encryptPII(
    piiData: string,
    context: {
      piiType: string;
      userId?: string;
      operationId?: string;
    }
  ): Promise<EncryptionResponse> {
    return this.encrypt(
      {
        plaintext: piiData,
        encryptionContext: {
          piiType: context.piiType,
          ...(context.userId && { userId: context.userId }),
          ...(context.operationId && { operationId: context.operationId }),
        },
      },
      "pii"
    );
  }

  /**
   * Decrypt PII data with validation
   */
  async decryptPII(
    encryptedPII: string,
    context: {
      piiType: string;
      userId?: string;
      operationId?: string;
    }
  ): Promise<DecryptionResponse> {
    return this.decrypt(
      {
        ciphertext: encryptedPII,
        encryptionContext: {
          piiType: context.piiType,
          ...(context.userId && { userId: context.userId }),
          ...(context.operationId && { operationId: context.operationId }),
        },
      },
      "pii"
    );
  }

  /**
   * Encrypt operation context for audit trail
   */
  async encryptOperationContext(
    context: Record<string, any>,
    operationId: string
  ): Promise<EncryptionResponse> {
    const contextJson = JSON.stringify(context);

    return this.encrypt(
      {
        plaintext: contextJson,
        encryptionContext: {
          operationId,
          contextType: "operation_context",
        },
      },
      "operation_context"
    );
  }

  /**
   * Decrypt operation context from audit trail
   */
  async decryptOperationContext(
    encryptedContext: string,
    operationId: string
  ): Promise<Record<string, any>> {
    const decrypted = await this.decrypt(
      {
        ciphertext: encryptedContext,
        encryptionContext: {
          operationId,
          contextType: "operation_context",
        },
      },
      "operation_context"
    );

    return JSON.parse(decrypted.plaintext);
  }

  // Private Methods

  /**
   * Resolve key ID from alias or use default
   */
  private async resolveKeyId(keyId?: string): Promise<string> {
    // Use provided key ID if available
    if (keyId) {
      return keyId;
    }

    // Use configured key ID if available
    if (this.config.keyId) {
      return this.config.keyId;
    }

    // Use key alias
    if (this.config.keyAlias) {
      // Check cache first
      const cached = this.keyCache.get(this.config.keyAlias);
      if (cached && Date.now() - cached.timestamp.getTime() < 3600000) {
        // 1 hour cache
        return cached.keyId;
      }

      // Resolve alias to key ID
      const aliases = await this.listAliases();
      const alias = aliases.find((a) => a.aliasName === this.config.keyAlias);

      if (!alias) {
        throw new Error(`Key alias not found: ${this.config.keyAlias}`);
      }

      // Cache the resolved key ID
      this.keyCache.set(this.config.keyAlias, {
        keyId: alias.targetKeyId,
        timestamp: new Date(),
      });

      return alias.targetKeyId;
    }

    throw new Error("No KMS key ID or alias configured");
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `kms-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.keyCache.clear();
  }
}
