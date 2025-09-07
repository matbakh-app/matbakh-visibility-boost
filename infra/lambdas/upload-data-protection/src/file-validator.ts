import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { 
  FileValidationResult, 
  ValidationViolation, 
  ViolationType, 
  RiskLevel,
  UploadProtectionConfig,
  PIIDetection
} from './types';
import { PIIDetector } from './pii-detector';

/**
 * Comprehensive file validation and security scanning
 */
export class FileValidator {
  private piiDetector: PIIDetector;
  private config: UploadProtectionConfig;

  constructor(config: UploadProtectionConfig) {
    this.config = config;
    this.piiDetector = new PIIDetector();
  }

  /**
   * Validate uploaded file for GDPR compliance and security
   */
  async validateFile(
    fileBuffer: Buffer,
    fileName: string,
    declaredMimeType: string,
    userId?: string
  ): Promise<FileValidationResult> {
    const violations: ValidationViolation[] = [];
    let piiDetected: PIIDetection[] = [];
    let riskLevel: RiskLevel = 'low';
    const recommendations: string[] = [];

    try {
      // 1. File type validation
      const fileTypeResult = await this.validateFileType(fileBuffer, fileName, declaredMimeType);
      if (!fileTypeResult.isValid) {
        violations.push(...fileTypeResult.violations);
      }

      const actualMimeType = fileTypeResult.actualMimeType || declaredMimeType;

      // 2. File size validation
      const sizeResult = this.validateFileSize(fileBuffer.length);
      if (!sizeResult.isValid) {
        violations.push(...sizeResult.violations);
      }

      // 3. Malicious content detection
      const malwareResult = await this.detectMaliciousContent(fileBuffer, actualMimeType);
      if (!malwareResult.isValid) {
        violations.push(...malwareResult.violations);
      }

      // 4. PII detection (if enabled)
      if (this.config.enablePIIDetection) {
        const piiResult = await this.piiDetector.detectPII(fileBuffer, fileName, actualMimeType);
        piiDetected = piiResult.piiDetected;

        if (piiDetected.length > 0) {
          violations.push({
            type: 'pii_detected',
            severity: this.calculatePIISeverity(piiDetected),
            description: `Detected ${piiDetected.length} PII entities in file`,
            confidence: Math.max(...piiDetected.map(p => p.confidence)),
            remediation: 'Review and redact PII before processing, ensure proper consent is obtained'
          });
        }
      }

      // 5. Content analysis and business relevance
      if (this.config.enableContentAnalysis) {
        const contentResult = await this.analyzeContentRelevance(fileBuffer, actualMimeType);
        if (!contentResult.isBusinessRelevant) {
          violations.push({
            type: 'retention_violation',
            severity: 'medium',
            description: 'File content may not be business-relevant for retention',
            confidence: 0.7,
            remediation: 'Review file relevance and apply appropriate retention policies'
          });
        }
      }

      // 6. Encryption requirements
      if (this.config.requireEncryption && !this.isEncrypted(fileBuffer)) {
        violations.push({
          type: 'encryption_required',
          severity: 'high',
          description: 'File is not encrypted but encryption is required',
          confidence: 1.0,
          remediation: 'Encrypt file before storage or processing'
        });
      }

      // Calculate overall risk level
      riskLevel = this.calculateRiskLevel(violations, piiDetected);

      // Generate recommendations
      recommendations.push(...this.generateRecommendations(violations, piiDetected, riskLevel));

      // Determine if processing is allowed
      const processingAllowed = this.isProcessingAllowed(violations, riskLevel);

      return {
        isValid: violations.length === 0 || (!this.config.strictMode && riskLevel !== 'critical'),
        fileType: fileTypeResult.fileExtension || this.getFileExtension(fileName),
        mimeType: actualMimeType,
        size: fileBuffer.length,
        violations,
        piiDetected,
        riskLevel,
        recommendations,
        processingAllowed
      };
    } catch (error) {
      console.error('Error validating file:', error);
      
      return {
        isValid: false,
        fileType: 'unknown',
        mimeType: declaredMimeType,
        size: fileBuffer.length,
        violations: [{
          type: 'malicious_content',
          severity: 'critical',
          description: 'File validation failed due to processing error',
          confidence: 0.5,
          remediation: 'File may be corrupted or contain malicious content'
        }],
        piiDetected: [],
        riskLevel: 'critical',
        recommendations: ['Quarantine file and investigate processing error'],
        processingAllowed: false
      };
    }
  }

  /**
   * Validate file type and detect type spoofing
   */
  private async validateFileType(
    fileBuffer: Buffer,
    fileName: string,
    declaredMimeType: string
  ): Promise<{
    isValid: boolean;
    violations: ValidationViolation[];
    actualMimeType?: string;
    fileExtension?: string;
  }> {
    const violations: ValidationViolation[] = [];

    try {
      // Detect actual file type from content
      const detectedType = await fileTypeFromBuffer(fileBuffer);
      const actualMimeType = detectedType?.mime || declaredMimeType;
      const fileExtension = detectedType?.ext || this.getFileExtension(fileName);

      // Check if file type is allowed
      if (!this.config.allowedFileTypes.includes(fileExtension)) {
        violations.push({
          type: 'unsupported_file_type',
          severity: 'high',
          description: `File type '${fileExtension}' is not allowed`,
          confidence: 1.0,
          remediation: `Convert file to one of the allowed types: ${this.config.allowedFileTypes.join(', ')}`
        });
      }

      // Check if MIME type is allowed
      if (!this.config.allowedMimeTypes.includes(actualMimeType)) {
        violations.push({
          type: 'unsupported_file_type',
          severity: 'high',
          description: `MIME type '${actualMimeType}' is not allowed`,
          confidence: 1.0,
          remediation: `Ensure file has one of the allowed MIME types: ${this.config.allowedMimeTypes.join(', ')}`
        });
      }

      // Check for type spoofing
      if (detectedType && declaredMimeType !== actualMimeType) {
        violations.push({
          type: 'malicious_content',
          severity: 'medium',
          description: `File type mismatch: declared '${declaredMimeType}' but detected '${actualMimeType}'`,
          confidence: 0.8,
          remediation: 'Verify file integrity and ensure correct MIME type declaration'
        });
      }

      return {
        isValid: violations.length === 0,
        violations,
        actualMimeType,
        fileExtension
      };
    } catch (error) {
      console.error('Error validating file type:', error);
      return {
        isValid: false,
        violations: [{
          type: 'malicious_content',
          severity: 'high',
          description: 'Failed to detect file type - file may be corrupted',
          confidence: 0.7,
          remediation: 'Check file integrity and try uploading again'
        }]
      };
    }
  }

  /**
   * Validate file size
   */
  private validateFileSize(fileSize: number): {
    isValid: boolean;
    violations: ValidationViolation[];
  } {
    const violations: ValidationViolation[] = [];

    if (fileSize > this.config.maxFileSize) {
      violations.push({
        type: 'file_too_large',
        severity: 'medium',
        description: `File size ${this.formatFileSize(fileSize)} exceeds maximum allowed size of ${this.formatFileSize(this.config.maxFileSize)}`,
        confidence: 1.0,
        remediation: `Reduce file size to under ${this.formatFileSize(this.config.maxFileSize)}`
      });
    }

    if (fileSize === 0) {
      violations.push({
        type: 'malicious_content',
        severity: 'high',
        description: 'File is empty',
        confidence: 1.0,
        remediation: 'Upload a valid file with content'
      });
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Detect malicious content
   */
  private async detectMaliciousContent(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{
    isValid: boolean;
    violations: ValidationViolation[];
  }> {
    const violations: ValidationViolation[] = [];

    try {
      // Check for suspicious file headers
      const suspiciousHeaders = this.checkSuspiciousHeaders(fileBuffer);
      if (suspiciousHeaders.length > 0) {
        violations.push({
          type: 'malicious_content',
          severity: 'high',
          description: `Suspicious file headers detected: ${suspiciousHeaders.join(', ')}`,
          confidence: 0.8,
          remediation: 'File may contain malicious content - quarantine for review'
        });
      }

      // Check for embedded executables in images
      if (mimeType.startsWith('image/')) {
        const hasEmbeddedExecutable = this.checkEmbeddedExecutable(fileBuffer);
        if (hasEmbeddedExecutable) {
          violations.push({
            type: 'malicious_content',
            severity: 'critical',
            description: 'Image contains embedded executable content',
            confidence: 0.9,
            remediation: 'Reject file - likely malicious'
          });
        }
      }

      // Validate image integrity if it's an image
      if (mimeType.startsWith('image/')) {
        const imageIntegrityResult = await this.validateImageIntegrity(fileBuffer);
        if (!imageIntegrityResult.isValid) {
          violations.push(...imageIntegrityResult.violations);
        }
      }

      return {
        isValid: violations.length === 0,
        violations
      };
    } catch (error) {
      console.error('Error detecting malicious content:', error);
      return {
        isValid: false,
        violations: [{
          type: 'malicious_content',
          severity: 'high',
          description: 'Failed to scan for malicious content',
          confidence: 0.6,
          remediation: 'Quarantine file for manual review'
        }]
      };
    }
  }

  /**
   * Analyze content relevance for business purposes
   */
  private async analyzeContentRelevance(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ isBusinessRelevant: boolean }> {
    try {
      if (this.config.enableContentAnalysis) {
        const piiResult = await this.piiDetector.detectPII('', '', mimeType);
        return {
          isBusinessRelevant: piiResult.contentAnalysis.businessRelevant || false
        };
      }
      
      // Default to business relevant if analysis is disabled
      return { isBusinessRelevant: true };
    } catch (error) {
      console.error('Error analyzing content relevance:', error);
      return { isBusinessRelevant: true };
    }
  }

  /**
   * Check if file is encrypted
   */
  private isEncrypted(fileBuffer: Buffer): boolean {
    // Simple heuristic: check for common encryption signatures
    const encryptionSignatures = [
      Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP with encryption
      Buffer.from('-----BEGIN PGP MESSAGE-----'),
      Buffer.from('-----BEGIN ENCRYPTED PRIVATE KEY-----')
    ];

    return encryptionSignatures.some(signature => 
      fileBuffer.includes(signature)
    );
  }

  /**
   * Check for suspicious file headers
   */
  private checkSuspiciousHeaders(fileBuffer: Buffer): string[] {
    const suspicious: string[] = [];
    
    // Check for executable signatures
    const executableSignatures = [
      { signature: Buffer.from([0x4D, 0x5A]), name: 'PE executable' },
      { signature: Buffer.from([0x7F, 0x45, 0x4C, 0x46]), name: 'ELF executable' },
      { signature: Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), name: 'Mach-O executable' },
      { signature: Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), name: 'Mach-O executable' }
    ];

    for (const { signature, name } of executableSignatures) {
      if (fileBuffer.subarray(0, signature.length).equals(signature)) {
        suspicious.push(name);
      }
    }

    return suspicious;
  }

  /**
   * Check for embedded executables in images
   */
  private checkEmbeddedExecutable(fileBuffer: Buffer): boolean {
    // Look for executable signatures beyond the image header
    const executableSignatures = [
      Buffer.from([0x4D, 0x5A]), // PE
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]) // ELF
    ];

    // Skip first 1KB to avoid false positives from image headers
    const searchBuffer = fileBuffer.subarray(1024);
    
    return executableSignatures.some(signature => 
      searchBuffer.includes(signature)
    );
  }

  /**
   * Validate image integrity using Sharp
   */
  private async validateImageIntegrity(fileBuffer: Buffer): Promise<{
    isValid: boolean;
    violations: ValidationViolation[];
  }> {
    const violations: ValidationViolation[] = [];

    try {
      // Try to process the image with Sharp
      const metadata = await sharp(fileBuffer).metadata();
      
      // Check for reasonable image dimensions
      if (metadata.width && metadata.height) {
        if (metadata.width > 10000 || metadata.height > 10000) {
          violations.push({
            type: 'malicious_content',
            severity: 'medium',
            description: `Image dimensions are unusually large: ${metadata.width}x${metadata.height}`,
            confidence: 0.7,
            remediation: 'Verify image is legitimate and not a decompression bomb'
          });
        }
      }

      return {
        isValid: violations.length === 0,
        violations
      };
    } catch (error) {
      return {
        isValid: false,
        violations: [{
          type: 'malicious_content',
          severity: 'high',
          description: 'Image file is corrupted or invalid',
          confidence: 0.8,
          remediation: 'Reject file - image cannot be processed'
        }]
      };
    }
  }

  /**
   * Calculate PII severity based on detected types
   */
  private calculatePIISeverity(piiDetected: PIIDetection[]): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskTypes = ['ssn', 'credit_card', 'passport', 'medical_record', 'financial_account'];
    const mediumRiskTypes = ['email', 'phone', 'address', 'date_of_birth'];

    const hasHighRisk = piiDetected.some(pii => highRiskTypes.includes(pii.type));
    const hasMediumRisk = piiDetected.some(pii => mediumRiskTypes.includes(pii.type));
    const count = piiDetected.length;

    if (hasHighRisk || count > 10) return 'critical';
    if (hasMediumRisk || count > 5) return 'high';
    if (count > 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(violations: ValidationViolation[], piiDetected: PIIDetection[]): RiskLevel {
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');
    const piiSeverity = piiDetected.length > 0 ? this.calculatePIISeverity(piiDetected) : 'low';

    if (criticalViolations.length > 0 || piiSeverity === 'critical') return 'critical';
    if (highViolations.length > 0 || piiSeverity === 'high') return 'high';
    if (violations.length > 0 || piiSeverity === 'medium') return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    violations: ValidationViolation[],
    piiDetected: PIIDetection[],
    riskLevel: RiskLevel
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('Immediately quarantine file and conduct security review');
    }

    if (piiDetected.length > 0) {
      recommendations.push('Verify user consent for PII processing');
      recommendations.push('Consider data minimization - remove unnecessary PII');
      recommendations.push('Apply appropriate retention policies');
    }

    if (violations.some(v => v.type === 'unsupported_file_type')) {
      recommendations.push('Convert file to supported format before upload');
    }

    if (violations.some(v => v.type === 'file_too_large')) {
      recommendations.push('Compress or resize file to reduce size');
    }

    if (violations.some(v => v.type === 'encryption_required')) {
      recommendations.push('Encrypt file before upload');
    }

    return recommendations;
  }

  /**
   * Determine if processing is allowed based on validation results
   */
  private isProcessingAllowed(violations: ValidationViolation[], riskLevel: RiskLevel): boolean {
    if (riskLevel === 'critical') return false;
    
    const blockingViolations = violations.filter(v => 
      v.type === 'malicious_content' || 
      (v.type === 'unsupported_file_type' && v.severity === 'high')
    );

    return blockingViolations.length === 0;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
  }

  /**
   * Format file size for human readability
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}