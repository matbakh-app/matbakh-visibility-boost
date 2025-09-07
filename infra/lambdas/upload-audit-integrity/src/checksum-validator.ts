/**
 * Checksum Validator for Upload Integrity System
 * Implements SHA-256 checksum validation for all file uploads
 */

import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import { IntegrityCheckResult, S3ObjectInfo } from './types';

export class ChecksumValidator {
  private s3Client: S3Client;

  constructor(region: string = 'eu-central-1') {
    this.s3Client = new S3Client({ region });
  }

  /**
   * Calculate SHA-256 checksum of file in S3
   */
  async calculateS3FileChecksum(bucket: string, key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }
      
      // Convert stream to buffer for checksum calculation
      const chunks: Uint8Array[] = [];
      const reader = response.Body.transformToWebStream().getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const buffer = Buffer.concat(chunks);
      return createHash('sha256').update(buffer).digest('hex');
      
    } catch (error) {
      console.error(`Failed to calculate checksum for ${bucket}/${key}:`, error);
      throw new Error(`Checksum calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get S3 object information including metadata
   */
  async getS3ObjectInfo(bucket: string, key: string): Promise<S3ObjectInfo> {
    try {
      const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.s3Client.send(command);
      
      return {
        bucket,
        key,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength || 0,
        etag: response.ETag?.replace(/"/g, '') || '',
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata || {},
      };
    } catch (error) {
      console.error(`Failed to get object info for ${bucket}/${key}:`, error);
      throw new Error(`Failed to retrieve object information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify file integrity by comparing checksums and metadata
   */
  async verifyFileIntegrity(
    bucket: string,
    key: string,
    expectedChecksum: string,
    expectedFileSize: number,
    expectedContentType: string,
    uploadId: string
  ): Promise<IntegrityCheckResult> {
    const verificationTimestamp = new Date().toISOString();
    const result: IntegrityCheckResult = {
      uploadId,
      isValid: false,
      checksumMatch: false,
      fileSizeMatch: false,
      contentTypeMatch: false,
      corruptionDetected: false,
      verificationTimestamp,
      errorDetails: [],
    };

    try {
      // Get current file information
      const objectInfo = await this.getS3ObjectInfo(bucket, key);
      
      // Calculate current checksum
      const currentChecksum = await this.calculateS3FileChecksum(bucket, key);
      
      // Verify checksum
      result.checksumMatch = currentChecksum.toLowerCase() === expectedChecksum.toLowerCase();
      if (!result.checksumMatch) {
        result.errorDetails!.push(`Checksum mismatch: expected ${expectedChecksum}, got ${currentChecksum}`);
      }
      
      // Verify file size
      result.fileSizeMatch = objectInfo.contentLength === expectedFileSize;
      if (!result.fileSizeMatch) {
        result.errorDetails!.push(`File size mismatch: expected ${expectedFileSize}, got ${objectInfo.contentLength}`);
      }
      
      // Verify content type
      result.contentTypeMatch = objectInfo.contentType === expectedContentType;
      if (!result.contentTypeMatch) {
        result.errorDetails!.push(`Content type mismatch: expected ${expectedContentType}, got ${objectInfo.contentType}`);
      }
      
      // Detect corruption (any mismatch indicates potential corruption)
      result.corruptionDetected = !result.checksumMatch || !result.fileSizeMatch;
      
      // Overall validity
      result.isValid = result.checksumMatch && result.fileSizeMatch && result.contentTypeMatch;
      
      console.log(`Integrity verification for ${uploadId}: ${result.isValid ? 'PASSED' : 'FAILED'}`, {
        checksumMatch: result.checksumMatch,
        fileSizeMatch: result.fileSizeMatch,
        contentTypeMatch: result.contentTypeMatch,
        errorDetails: result.errorDetails,
      });
      
      return result;
      
    } catch (error) {
      result.errorDetails!.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.corruptionDetected = true;
      
      console.error(`Integrity verification failed for ${uploadId}:`, error);
      return result;
    }
  }

  /**
   * Batch verify multiple files
   */
  async batchVerifyIntegrity(
    verificationRequests: Array<{
      bucket: string;
      key: string;
      expectedChecksum: string;
      expectedFileSize: number;
      expectedContentType: string;
      uploadId: string;
    }>
  ): Promise<IntegrityCheckResult[]> {
    const results: IntegrityCheckResult[] = [];
    
    // Process in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = [];
    
    for (let i = 0; i < verificationRequests.length; i += concurrencyLimit) {
      chunks.push(verificationRequests.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(request => 
          this.verifyFileIntegrity(
            request.bucket,
            request.key,
            request.expectedChecksum,
            request.expectedFileSize,
            request.expectedContentType,
            request.uploadId
          )
        )
      );
      
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create failed result for rejected promises
          const request = chunk[index];
          results.push({
            uploadId: request.uploadId,
            isValid: false,
            checksumMatch: false,
            fileSizeMatch: false,
            contentTypeMatch: false,
            corruptionDetected: true,
            verificationTimestamp: new Date().toISOString(),
            errorDetails: [`Batch verification failed: ${result.reason}`],
          });
        }
      });
    }
    
    return results;
  }

  /**
   * Compare two checksums safely
   */
  compareChecksums(checksum1: string, checksum2: string): boolean {
    if (!checksum1 || !checksum2) {
      return false;
    }
    
    return checksum1.toLowerCase() === checksum2.toLowerCase();
  }

  /**
   * Validate checksum format (SHA-256 should be 64 hex characters)
   */
  isValidSHA256(checksum: string): boolean {
    if (!checksum || typeof checksum !== 'string') {
      return false;
    }
    
    // SHA-256 should be exactly 64 hexadecimal characters
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    return sha256Regex.test(checksum);
  }

  /**
   * Generate integrity report for a file
   */
  async generateIntegrityReport(
    bucket: string,
    key: string,
    uploadId: string
  ): Promise<{
    uploadId: string;
    bucket: string;
    key: string;
    currentChecksum: string;
    currentFileSize: number;
    currentContentType: string;
    lastModified: Date;
    etag: string;
    reportGeneratedAt: string;
  }> {
    try {
      const objectInfo = await this.getS3ObjectInfo(bucket, key);
      const currentChecksum = await this.calculateS3FileChecksum(bucket, key);
      
      return {
        uploadId,
        bucket,
        key,
        currentChecksum,
        currentFileSize: objectInfo.contentLength,
        currentContentType: objectInfo.contentType,
        lastModified: objectInfo.lastModified,
        etag: objectInfo.etag,
        reportGeneratedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to generate integrity report for ${uploadId}:`, error);
      throw error;
    }
  }
}