/**
 * Upload Audit & Integrity System Lambda Handler
 * Main entry point for upload audit and integrity verification
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, S3Event } from 'aws-lambda';
import { ChecksumValidator } from './checksum-validator';
import { AuditLogger } from './audit-logger';
import { ReUploadWorkflowManager } from './re-upload-workflow';
import { UploadAuditEvent, IntegrityCheckResult } from './types';

// Initialize services
const checksumValidator = new ChecksumValidator();
const auditLogger = new AuditLogger();
const reUploadManager = new ReUploadWorkflowManager();

/**
 * Handle S3 event for upload completion
 */
async function handleS3Event(event: S3Event): Promise<void> {
  console.log(`Processing ${event.Records.length} S3 records`);

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      console.log(`Processing S3 event: ${record.eventName} for ${bucket}/${key}`);

      // Only process upload completion events
      if (!record.eventName.startsWith('ObjectCreated:')) {
        console.log(`Ignoring non-creation event: ${record.eventName}`);
        continue;
      }

      // Get object metadata to extract upload information
      const objectInfo = await checksumValidator.getS3ObjectInfo(bucket, key);
      const uploadId = objectInfo.metadata['upload-id'] || `s3-${Date.now()}`;
      const userId = objectInfo.metadata['uploaded-by'];
      const expectedChecksum = objectInfo.metadata['checksum-sha256'];
      const expectedFileSize = parseInt(objectInfo.metadata['file-size'] || '0');
      const filename = objectInfo.metadata['original-filename'] || key.split('/').pop() || key;

      if (!userId) {
        console.warn(`No user ID found in metadata for ${bucket}/${key}, skipping`);
        continue;
      }

      // Log upload completion
      await auditLogger.logAuditEvent(
        uploadId,
        userId,
        'upload_completed',
        filename,
        bucket,
        key,
        objectInfo.contentLength,
        objectInfo.contentType,
        expectedChecksum || '',
        {
          partnerId: objectInfo.metadata['partner-id'],
          requestId: objectInfo.metadata['request-id'],
          metadata: {
            etag: objectInfo.etag,
            lastModified: objectInfo.lastModified.toISOString(),
            s3EventName: record.eventName,
          },
        }
      );

      // Perform integrity verification if checksum is available
      if (expectedChecksum && expectedFileSize > 0) {
        await performIntegrityVerification(
          uploadId,
          userId,
          bucket,
          key,
          filename,
          expectedChecksum,
          expectedFileSize,
          objectInfo.contentType
        );
      } else {
        console.warn(`Missing checksum or file size for ${uploadId}, skipping integrity verification`);
      }

    } catch (error) {
      console.error(`Failed to process S3 record:`, error);
      // Continue processing other records
    }
  }
}

/**
 * Perform integrity verification for uploaded file
 */
async function performIntegrityVerification(
  uploadId: string,
  userId: string,
  bucket: string,
  key: string,
  filename: string,
  expectedChecksum: string,
  expectedFileSize: number,
  expectedContentType: string
): Promise<void> {
  try {
    console.log(`Starting integrity verification for ${uploadId}`);
    
    const startTime = Date.now();
    
    // Perform integrity check
    const result = await checksumValidator.verifyFileIntegrity(
      bucket,
      key,
      expectedChecksum,
      expectedFileSize,
      expectedContentType,
      uploadId
    );
    
    const duration = Date.now() - startTime;
    
    // Log lifecycle event
    await auditLogger.logLifecycleEvent(
      uploadId,
      'integrity_verification',
      result.isValid,
      {
        duration,
        metadata: {
          checksumMatch: result.checksumMatch,
          fileSizeMatch: result.fileSizeMatch,
          contentTypeMatch: result.contentTypeMatch,
          corruptionDetected: result.corruptionDetected,
        },
      }
    );

    if (result.isValid) {
      // Log successful verification
      await auditLogger.logAuditEvent(
        uploadId,
        userId,
        'integrity_verified',
        filename,
        bucket,
        key,
        expectedFileSize,
        expectedContentType,
        expectedChecksum,
        {
          metadata: {
            verificationDuration: duration,
            verificationTimestamp: result.verificationTimestamp,
          },
        }
      );
      
      console.log(`Integrity verification passed for ${uploadId}`);
      
    } else {
      // Log failed verification
      await auditLogger.logAuditEvent(
        uploadId,
        userId,
        'integrity_failed',
        filename,
        bucket,
        key,
        expectedFileSize,
        expectedContentType,
        expectedChecksum,
        {
          metadata: {
            errorDetails: result.errorDetails,
            verificationTimestamp: result.verificationTimestamp,
            corruptionDetected: result.corruptionDetected,
          },
        }
      );

      // If corruption is detected, trigger re-upload workflow
      if (result.corruptionDetected) {
        await auditLogger.logAuditEvent(
          uploadId,
          userId,
          'corruption_detected',
          filename,
          bucket,
          key,
          expectedFileSize,
          expectedContentType,
          expectedChecksum,
          {
            metadata: {
              errorDetails: result.errorDetails,
            },
          }
        );

        // Determine re-upload reason
        let reason: 'corruption_detected' | 'checksum_mismatch' | 'file_size_mismatch' = 'corruption_detected';
        if (!result.checksumMatch) reason = 'checksum_mismatch';
        else if (!result.fileSizeMatch) reason = 'file_size_mismatch';

        // Trigger re-upload workflow
        await reUploadManager.triggerReUpload(
          uploadId,
          reason,
          userId,
          filename,
          bucket,
          key,
          3 // Max 3 retries
        );
      }
      
      console.error(`Integrity verification failed for ${uploadId}:`, result.errorDetails);
    }

  } catch (error) {
    console.error(`Integrity verification error for ${uploadId}:`, error);
    
    // Log verification error
    await auditLogger.logLifecycleEvent(
      uploadId,
      'integrity_verification',
      false,
      {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }
}

/**
 * Handle API Gateway requests for audit queries
 */
async function handleAPIRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path, pathParameters, queryStringParameters } = event;
  
  try {
    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Route API requests
    if (path.startsWith('/audit/upload/') && httpMethod === 'GET') {
      const uploadId = pathParameters?.uploadId;
      if (!uploadId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Upload ID is required' }),
        };
      }

      const auditTrail = await auditLogger.getUploadAuditTrail(uploadId);
      const lifecycleEvents = await auditLogger.getUploadLifecycleEvents(uploadId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          uploadId,
          auditTrail,
          lifecycleEvents,
        }),
      };
    }

    if (path === '/audit/metrics' && httpMethod === 'GET') {
      const startDate = queryStringParameters?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = queryStringParameters?.endDate || new Date().toISOString();
      const userId = queryStringParameters?.userId;

      const metrics = await auditLogger.generateUploadMetrics(startDate, endDate, userId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(metrics),
      };
    }

    if (path.startsWith('/integrity/verify') && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { bucket, key, expectedChecksum, expectedFileSize, expectedContentType, uploadId } = body;

      if (!bucket || !key || !expectedChecksum || !expectedFileSize || !expectedContentType || !uploadId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required parameters' }),
        };
      }

      const result = await checksumValidator.verifyFileIntegrity(
        bucket,
        key,
        expectedChecksum,
        expectedFileSize,
        expectedContentType,
        uploadId
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    console.error('API request error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent | S3Event | any,
  context: Context
): Promise<APIGatewayProxyResult | void> => {
  console.log('Upload Audit & Integrity System invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Determine event type and route accordingly
    if ('Records' in event && event.Records?.[0]?.eventSource === 'aws:s3') {
      // S3 event
      await handleS3Event(event as S3Event);
      return;
    } else if ('httpMethod' in event) {
      // API Gateway event
      return await handleAPIRequest(event as APIGatewayProxyEvent);
    } else {
      console.error('Unknown event type:', event);
      throw new Error('Unsupported event type');
    }

  } catch (error) {
    console.error('Handler error:', error);
    
    if ('httpMethod' in event) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      };
    }
    
    throw error;
  }
};