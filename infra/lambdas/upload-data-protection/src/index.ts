import { S3Event, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { FileValidator } from './file-validator';
import { QuarantineManager } from './quarantine-manager';
import { UploadProtectionConfig } from './types';

// Global instances (cached across Lambda invocations)
let fileValidator: FileValidator | null = null;
let quarantineManager: QuarantineManager | null = null;
let s3Client: S3Client | null = null;

/**
 * Initialize upload protection system
 */
async function initializeSystem(): Promise<{
  validator: FileValidator;
  quarantine: QuarantineManager;
  s3: S3Client;
}> {
  if (fileValidator && quarantineManager && s3Client) {
    return { validator: fileValidator, quarantine: quarantineManager, s3: s3Client };
  }

  // Configuration
  const config: UploadProtectionConfig = {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,txt,doc,docx').split(','),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(','),
    enablePIIDetection: process.env.ENABLE_PII_DETECTION !== 'false',
    enableMalwareScanning: process.env.ENABLE_MALWARE_SCANNING !== 'false',
    enableContentAnalysis: process.env.ENABLE_CONTENT_ANALYSIS !== 'false',
    requireEncryption: process.env.REQUIRE_ENCRYPTION === 'true',
    autoQuarantine: process.env.AUTO_QUARANTINE !== 'false',
    strictMode: process.env.STRICT_MODE === 'true'
  };

  // Initialize components
  fileValidator = new FileValidator(config);
  quarantineManager = new QuarantineManager(process.env.QUARANTINE_BUCKET);
  await quarantineManager.initialize();
  
  s3Client = new S3Client({ region: 'eu-central-1' });

  console.log('Upload protection system initialized', {
    maxFileSize: config.maxFileSize,
    allowedFileTypes: config.allowedFileTypes.length,
    piiDetection: config.enablePIIDetection,
    strictMode: config.strictMode
  });

  return { validator: fileValidator, quarantine: quarantineManager, s3: s3Client };
}

/**
 * Process uploaded file for GDPR compliance
 */
async function processUploadedFile(
  bucket: string,
  key: string,
  validator: FileValidator,
  quarantine: QuarantineManager,
  s3: S3Client
): Promise<void> {
  try {
    console.log(`Processing uploaded file: s3://${bucket}/${key}`);

    // Get file from S3
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const fileObject = await s3.send(getCommand);

    if (!fileObject.Body) {
      throw new Error('File body is empty');
    }

    const fileBuffer = Buffer.from(await fileObject.Body.transformToByteArray());
    const fileName = key.split('/').pop() || key;
    const declaredMimeType = fileObject.ContentType || 'application/octet-stream';
    
    // Extract user ID from metadata or key path
    const userId = fileObject.Metadata?.userid || extractUserIdFromKey(key);

    // Validate file
    const validationResult = await validator.validateFile(
      fileBuffer,
      fileName,
      declaredMimeType,
      userId
    );

    console.log(`File validation completed: ${fileName}`, {
      isValid: validationResult.isValid,
      riskLevel: validationResult.riskLevel,
      violationCount: validationResult.violations.length,
      piiCount: validationResult.piiDetected.length,
      processingAllowed: validationResult.processingAllowed
    });

    // Handle validation results
    if (!validationResult.processingAllowed) {
      // Quarantine the file
      const reason = `File failed validation: ${validationResult.violations.map(v => v.description).join('; ')}`;
      
      const quarantineId = await quarantine.quarantineFile(
        fileBuffer,
        fileName,
        `s3://${bucket}/${key}`,
        userId,
        validationResult,
        reason
      );

      console.log(`File quarantined: ${fileName} -> ${quarantineId}`);

      // Optionally delete original file from upload bucket
      if (process.env.DELETE_QUARANTINED_FILES === 'true') {
        // Implementation would go here - delete from original bucket
        console.log(`Original file would be deleted: s3://${bucket}/${key}`);
      }
    } else if (validationResult.violations.length > 0 || validationResult.piiDetected.length > 0) {
      // File is allowed but has warnings - log for monitoring
      console.warn(`File has warnings but processing allowed: ${fileName}`, {
        violations: validationResult.violations.map(v => ({ type: v.type, severity: v.severity })),
        piiTypes: validationResult.piiDetected.map(p => p.type),
        recommendations: validationResult.recommendations
      });

      // Could implement additional actions here:
      // - Send notifications to admins
      // - Apply additional monitoring
      // - Require additional consent verification
    } else {
      console.log(`File validation passed: ${fileName} - no issues detected`);
    }

    // Store validation results as metadata (for audit purposes)
    // This could be implemented by updating the S3 object metadata
    // or storing results in a database for reporting

  } catch (error) {
    console.error(`Error processing uploaded file s3://${bucket}/${key}:`, error);
    
    // In case of processing error, quarantine the file as a safety measure
    try {
      const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
      const fileObject = await s3.send(getCommand);
      
      if (fileObject.Body) {
        const fileBuffer = Buffer.from(await fileObject.Body.transformToByteArray());
        const fileName = key.split('/').pop() || key;
        
        await quarantine.quarantineFile(
          fileBuffer,
          fileName,
          `s3://${bucket}/${key}`,
          undefined,
          {
            isValid: false,
            fileType: 'unknown',
            mimeType: 'unknown',
            size: fileBuffer.length,
            violations: [{
              type: 'malicious_content',
              severity: 'critical',
              description: 'File processing failed - potential security risk',
              confidence: 0.5,
              remediation: 'Manual review required'
            }],
            piiDetected: [],
            riskLevel: 'critical',
            recommendations: ['Quarantine for manual security review'],
            processingAllowed: false
          },
          `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        
        console.log(`File quarantined due to processing error: ${fileName}`);
      }
    } catch (quarantineError) {
      console.error('Failed to quarantine file after processing error:', quarantineError);
    }
  }
}

/**
 * Extract user ID from S3 key path
 */
function extractUserIdFromKey(key: string): string | undefined {
  // Assuming key format like: user-uploads/{userId}/filename
  // or uploads/{userId}/filename
  const pathParts = key.split('/');
  
  if (pathParts.length >= 2) {
    const potentialUserId = pathParts[1];
    // Basic UUID validation
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(potentialUserId)) {
      return potentialUserId;
    }
  }
  
  return undefined;
}

/**
 * Main Lambda handler for S3 upload events
 */
export const handler = async (event: S3Event, context: Context): Promise<void> => {
  const requestId = context.awsRequestId;
  console.log(`Upload data protection handler invoked [${requestId}]:`, {
    recordCount: event.Records.length
  });

  try {
    // Initialize system
    const { validator, quarantine, s3 } = await initializeSystem();

    // Process each S3 record
    const processingPromises = event.Records.map(async (record) => {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      // Only process PUT events (file uploads)
      if (record.eventName.startsWith('ObjectCreated:')) {
        await processUploadedFile(bucket, key, validator, quarantine, s3);
      } else {
        console.log(`Ignoring non-upload event: ${record.eventName} for ${key}`);
      }
    });

    // Wait for all files to be processed
    await Promise.all(processingPromises);
    
    console.log(`Upload data protection completed [${requestId}]: processed ${event.Records.length} files`);
  } catch (error) {
    console.error(`Error in upload data protection handler [${requestId}]:`, error);
    throw error; // Re-throw to trigger Lambda retry if needed
  }
};

/**
 * Health check handler (for API Gateway integration)
 */
export const healthCheck = async (): Promise<{
  statusCode: number;
  body: string;
}> => {
  try {
    const { validator, quarantine } = await initializeSystem();
    
    // Get quarantine statistics
    const stats = await quarantine.getQuarantineStatistics();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'healthy',
        service: 'upload-data-protection',
        timestamp: new Date().toISOString(),
        statistics: stats
      })
    };
  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'unhealthy',
        service: 'upload-data-protection',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
};