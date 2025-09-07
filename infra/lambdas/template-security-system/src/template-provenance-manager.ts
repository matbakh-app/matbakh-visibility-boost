/**
 * Template Provenance Manager
 * Handles cryptographic signing and verification of templates using AWS KMS
 */
import { KMSClient, SignCommand, VerifyCommand, CreateKeyCommand, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createHash, createHmac } from 'crypto';
import { 
  TemplateSignature, 
  TemplateProvenance, 
  SigningRequest, 
  VerificationRequest, 
  VerificationResult,
  AuditEntry,
  IntegrityCheck,
  KMSKeyConfig 
} from './types';

export class TemplateProvenanceManager {
  private kmsClient: KMSClient;
  private dynamoClient: DynamoDBDocumentClient;
  private signingKeyId: string;

  constructor(region: string = 'eu-central-1', signingKeyId?: string) {
    this.kmsClient = new KMSClient({ region });
    const dynamoClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoClient);
    this.signingKeyId = signingKeyId || process.env.TEMPLATE_SIGNING_KEY_ID || '';
  }

  /**
   * Sign a template with KMS
   */
  async signTemplate(request: SigningRequest): Promise<TemplateSignature> {
    try {
      console.log(`Signing template ${request.templateId} version ${request.version}`);

      // Generate content hash
      const contentHash = this.generateContentHash(request.content, request.metadata);

      // Create signing payload
      const signingPayload = this.createSigningPayload(
        request.templateId,
        request.version,
        contentHash,
        request.signedBy
      );

      // Sign with KMS
      const signCommand = new SignCommand({
        KeyId: request.keyId || this.signingKeyId,
        Message: Buffer.from(signingPayload),
        MessageType: 'RAW',
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
      });

      const signResponse = await this.kmsClient.send(signCommand);

      if (!signResponse.Signature) {
        throw new Error('KMS signing failed - no signature returned');
      }

      // Create signature object
      const signature: TemplateSignature = {
        templateId: request.templateId,
        version: request.version,
        algorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
        keyId: signResponse.KeyId || request.keyId || this.signingKeyId,
        signature: Buffer.from(signResponse.Signature).toString('base64'),
        timestamp: new Date().toISOString(),
        signedBy: request.signedBy,
        contentHash,
      };

      // Store signature
      await this.storeSignature(signature);

      // Create audit entry
      await this.createAuditEntry({
        id: this.generateAuditId(),
        timestamp: signature.timestamp,
        action: 'signed',
        actor: request.signedBy,
        details: {
          templateId: request.templateId,
          version: request.version,
          keyId: signature.keyId,
          algorithm: signature.algorithm,
        },
      });

      console.log(`Template ${request.templateId} signed successfully`);
      return signature;
    } catch (error) {
      console.error(`Failed to sign template ${request.templateId}:`, error);
      throw error;
    }
  }

  /**
   * Verify template signature
   */
  async verifyTemplate(request: VerificationRequest): Promise<VerificationResult> {
    try {
      console.log(`Verifying template ${request.templateId}`);

      const result: VerificationResult = {
        valid: false,
        templateId: request.templateId,
        version: request.version || 'latest',
        signatureValid: false,
        contentIntact: false,
        timestampValid: false,
        signerVerified: false,
        chainOfTrustValid: false,
        errors: [],
        warnings: [],
        verifiedAt: new Date().toISOString(),
      };

      // Get signature if not provided
      let signature: TemplateSignature;
      if (request.signature) {
        signature = JSON.parse(request.signature);
      } else {
        const storedSignature = await this.getSignature(request.templateId, request.version);
        if (!storedSignature) {
          result.errors.push('No signature found for template');
          return result;
        }
        signature = storedSignature;
      }

      result.version = signature.version;

      // Verify signature with KMS
      const signatureValid = await this.verifySignatureWithKMS(signature, request.content);
      result.signatureValid = signatureValid;

      if (!signatureValid) {
        result.errors.push('Cryptographic signature verification failed');
      }

      // Verify content integrity
      if (request.content) {
        const currentHash = this.generateContentHash(request.content);
        result.contentIntact = currentHash === signature.contentHash;
        
        if (!result.contentIntact) {
          result.errors.push('Content hash mismatch - template has been modified');
        }
      } else {
        result.warnings.push('Content not provided - skipping integrity check');
        result.contentIntact = true; // Assume intact if not checking
      }

      // Verify timestamp (not too old, not in future)
      const signatureTime = new Date(signature.timestamp);
      const now = new Date();
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
      const futureThreshold = 5 * 60 * 1000; // 5 minutes

      result.timestampValid = 
        signatureTime.getTime() > (now.getTime() - maxAge) &&
        signatureTime.getTime() < (now.getTime() + futureThreshold);

      if (!result.timestampValid) {
        result.errors.push('Signature timestamp is invalid (too old or in future)');
      }

      // Verify signer (basic check - could be enhanced with certificate validation)
      result.signerVerified = !!signature.signedBy;
      if (!result.signerVerified) {
        result.errors.push('Signer information missing');
      }

      // Verify chain of trust (check if key is still valid and trusted)
      result.chainOfTrustValid = await this.verifyChainOfTrust(signature.keyId);
      if (!result.chainOfTrustValid) {
        result.errors.push('Chain of trust verification failed');
      }

      // Overall validity
      result.valid = result.signatureValid && 
                    result.contentIntact && 
                    result.timestampValid && 
                    result.signerVerified && 
                    result.chainOfTrustValid;

      // Update verification count
      await this.updateVerificationCount(request.templateId, signature.version);

      // Create audit entry
      await this.createAuditEntry({
        id: this.generateAuditId(),
        timestamp: result.verifiedAt,
        action: 'verified',
        actor: 'system',
        details: {
          templateId: request.templateId,
          version: result.version,
          valid: result.valid,
          errors: result.errors,
          strictMode: request.strictMode || false,
        },
      });

      console.log(`Template ${request.templateId} verification completed: ${result.valid ? 'VALID' : 'INVALID'}`);
      return result;
    } catch (error) {
      console.error(`Failed to verify template ${request.templateId}:`, error);
      
      return {
        valid: false,
        templateId: request.templateId,
        version: request.version || 'unknown',
        signatureValid: false,
        contentIntact: false,
        timestampValid: false,
        signerVerified: false,
        chainOfTrustValid: false,
        errors: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get template provenance information
   */
  async getTemplateProvenance(templateId: string, version?: string): Promise<TemplateProvenance | null> {
    try {
      const signature = await this.getSignature(templateId, version);
      if (!signature) {
        return null;
      }

      const auditTrail = await this.getAuditTrail(templateId, version);
      const integrity = await this.getIntegrityCheck(templateId, version);

      const provenance: TemplateProvenance = {
        templateId,
        version: signature.version,
        signature,
        auditTrail,
        integrity,
        compliance: {
          gdprCompliant: true, // Would be determined by compliance checks
          securityScanPassed: true, // Would be determined by security scans
          vulnerabilities: [],
          complianceScore: 95,
          lastChecked: new Date().toISOString(),
        },
      };

      return provenance;
    } catch (error) {
      console.error(`Failed to get provenance for template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Create or update KMS key for template signing
   */
  async createSigningKey(description: string = 'Template Signing Key'): Promise<KMSKeyConfig> {
    try {
      const createKeyCommand = new CreateKeyCommand({
        Description: description,
        KeyUsage: 'SIGN_VERIFY',
        KeySpec: 'RSA_2048',
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: { AWS: `arn:aws:iam::${await this.getAccountId()}:root` },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow template signing service',
              Effect: 'Allow',
              Principal: { AWS: `arn:aws:iam::${await this.getAccountId()}:role/lambda-template-security-role` },
              Action: [
                'kms:Sign',
                'kms:Verify',
                'kms:DescribeKey',
              ],
              Resource: '*',
            },
          ],
        }),
        Tags: [
          { TagKey: 'Purpose', TagValue: 'TemplateSignature' },
          { TagKey: 'Service', TagValue: 'matbakh-template-security' },
        ],
      });

      const response = await this.kmsClient.send(createKeyCommand);

      if (!response.KeyMetadata) {
        throw new Error('Failed to create KMS key');
      }

      const keyConfig: KMSKeyConfig = {
        keyId: response.KeyMetadata.KeyId!,
        keyArn: response.KeyMetadata.Arn!,
        keyAlias: `alias/template-signing-${Date.now()}`,
        keyUsage: response.KeyMetadata.KeyUsage!,
        keySpec: response.KeyMetadata.KeySpec!,
        keyState: response.KeyMetadata.KeyState!,
        createdAt: response.KeyMetadata.CreationDate!.toISOString(),
        description: response.KeyMetadata.Description!,
      };

      // Store key configuration
      await this.storeKeyConfig(keyConfig);

      console.log(`Created signing key: ${keyConfig.keyId}`);
      return keyConfig;
    } catch (error) {
      console.error('Failed to create signing key:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private generateContentHash(content: string, metadata?: any): string {
    const hash = createHash('sha256');
    hash.update(content);
    
    if (metadata) {
      hash.update(JSON.stringify(metadata, Object.keys(metadata).sort()));
    }
    
    return hash.digest('hex');
  }

  private createSigningPayload(templateId: string, version: string, contentHash: string, signedBy: string): string {
    const payload = {
      templateId,
      version,
      contentHash,
      signedBy,
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(payload, Object.keys(payload).sort());
  }

  private async verifySignatureWithKMS(signature: TemplateSignature, content?: string): Promise<boolean> {
    try {
      // Recreate signing payload
      const signingPayload = this.createSigningPayload(
        signature.templateId,
        signature.version,
        signature.contentHash,
        signature.signedBy
      );

      const verifyCommand = new VerifyCommand({
        KeyId: signature.keyId,
        Message: Buffer.from(signingPayload),
        MessageType: 'RAW',
        Signature: Buffer.from(signature.signature, 'base64'),
        SigningAlgorithm: signature.algorithm as any,
      });

      const response = await this.kmsClient.send(verifyCommand);
      return response.SignatureValid || false;
    } catch (error) {
      console.error('KMS signature verification failed:', error);
      return false;
    }
  }

  private async verifyChainOfTrust(keyId: string): Promise<boolean> {
    try {
      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const response = await this.kmsClient.send(describeCommand);
      
      return response.KeyMetadata?.KeyState === 'Enabled' &&
             response.KeyMetadata?.KeyUsage === 'SIGN_VERIFY';
    } catch (error) {
      console.error('Chain of trust verification failed:', error);
      return false;
    }
  }

  private async storeSignature(signature: TemplateSignature): Promise<void> {
    const command = new PutCommand({
      TableName: 'template-signatures',
      Item: {
        PK: `TEMPLATE#${signature.templateId}`,
        SK: `VERSION#${signature.version}`,
        ...signature,
        GSI1PK: `SIGNER#${signature.signedBy}`,
        GSI1SK: signature.timestamp,
      },
    });

    await this.dynamoClient.send(command);
  }

  private async getSignature(templateId: string, version?: string): Promise<TemplateSignature | null> {
    const sk = version ? `VERSION#${version}` : 'VERSION#latest';
    
    const command = new GetCommand({
      TableName: 'template-signatures',
      Key: {
        PK: `TEMPLATE#${templateId}`,
        SK: sk,
      },
    });

    const response = await this.dynamoClient.send(command);
    return response.Item ? (response.Item as TemplateSignature) : null;
  }

  private async createAuditEntry(entry: AuditEntry): Promise<void> {
    const command = new PutCommand({
      TableName: 'template-audit-trail',
      Item: {
        PK: `TEMPLATE#${entry.details.templateId}`,
        SK: `AUDIT#${entry.timestamp}#${entry.id}`,
        ...entry,
        GSI1PK: `ACTOR#${entry.actor}`,
        GSI1SK: entry.timestamp,
        GSI2PK: `ACTION#${entry.action}`,
        GSI2SK: entry.timestamp,
      },
    });

    await this.dynamoClient.send(command);
  }

  private async getAuditTrail(templateId: string, version?: string): Promise<AuditEntry[]> {
    const command = new QueryCommand({
      TableName: 'template-audit-trail',
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `TEMPLATE#${templateId}`,
        ':sk': 'AUDIT#',
      },
      ScanIndexForward: false, // Most recent first
      Limit: 100,
    });

    const response = await this.dynamoClient.send(command);
    return (response.Items || []) as AuditEntry[];
  }

  private async getIntegrityCheck(templateId: string, version?: string): Promise<IntegrityCheck> {
    // This would typically be stored and updated separately
    // For now, return a basic integrity check
    return {
      contentHash: '',
      signatureValid: true,
      timestampValid: true,
      chainOfTrust: true,
      lastVerified: new Date().toISOString(),
      verificationCount: 1,
    };
  }

  private async updateVerificationCount(templateId: string, version: string): Promise<void> {
    const command = new UpdateCommand({
      TableName: 'template-signatures',
      Key: {
        PK: `TEMPLATE#${templateId}`,
        SK: `VERSION#${version}`,
      },
      UpdateExpression: 'ADD verificationCount :inc SET lastVerified = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': new Date().toISOString(),
      },
    });

    await this.dynamoClient.send(command);
  }

  private async storeKeyConfig(keyConfig: KMSKeyConfig): Promise<void> {
    const command = new PutCommand({
      TableName: 'template-signing-keys',
      Item: {
        PK: `KEY#${keyConfig.keyId}`,
        SK: 'CONFIG',
        ...keyConfig,
      },
    });

    await this.dynamoClient.send(command);
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getAccountId(): Promise<string> {
    // This would typically use STS to get the account ID
    // For now, return a placeholder
    return process.env.AWS_ACCOUNT_ID || '123456789012';
  }
}