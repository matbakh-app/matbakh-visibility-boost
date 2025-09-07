import { S3Event, S3EventRecord, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';
import { createHash } from 'crypto';

// Types
interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}

interface UploadMetadata {
  userId: string;
  partnerId?: string;
  uploadTimestamp: string;
  requestId: string;
  originalFilename?: string;
}

// Constants
const ALLOWED_BUCKETS = ['matbakh-files-uploads', 'matbakh-files-profile', 'matbakh-files-reports'];

// Cached database pool
let cachedPool: Pool | null = null;

// Initialize AWS clients
const s3Client = new S3Client({ region: 'eu-central-1' });
const secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });

/**
 * Get PostgreSQL connection pool
 */
async function getPgClient(): Promise<Pool> {
  if (cachedPool) {
    return cachedPool;
  }

  try {
    const command = new GetSecretValueCommand({ SecretId: 'matbakh-db-postgres' });
    const secret = await secretsClient.send(command);
    
    if (!secret.SecretString) {
      throw new Error('Secret string is empty');
    }

    const creds: DatabaseCredentials = JSON.parse(secret.SecretString);

    cachedPool = new Pool({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: creds.dbname,
      port: Number(creds.port) || 5432,
      ssl: { rejectUnauthorized: false },
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('PostgreSQL connection pool created successfully');
    return cachedPool;

  } catch (error) {
    console.error('Failed to create PostgreSQL connection pool:', error);
    throw error;
  }
}

/**
 * Extract metadata from S3 object
 */
async function getObjectMetadata(bucket: string, key: string): Promise<{
  contentType: string;
  contentLength: number;
  metadata: Record<string, string>;
  etag: string;
}> {
  try {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    
    return {
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength || 0,
      metadata: response.Metadata || {},
      etag: response.ETag?.replace(/"/g, '') || '',
    };
  } catch (error) {
    console.error(`Failed to get object metadata for ${bucket}/${key}:`, error);
    throw error;
  }
}

/**
 * Parse upload metadata from S3 object metadata
 */
function parseUploadMetadata(metadata: Record<string, string>): UploadMetadata | null {
  const userId = metadata['uploaded-by'];
  const uploadTimestamp = metadata['upload-timestamp'];
  const requestId = metadata['request-id'];
  
  if (!userId || !uploadTimestamp || !requestId) {
    console.warn('Missing required metadata fields:', { userId, uploadTimestamp, requestId });
    return null;
  }
  
  return {
    userId,
    partnerId: metadata['partner-id'] || undefined,
    uploadTimestamp,
    requestId,
    originalFilename: metadata['original-filename'] || undefined,
  };
}

/**
 * Determine upload type based on bucket and key
 */
function determineUploadType(bucket: string, key: string): string {
  if (bucket === 'matbakh-files-profile') {
    if (key.includes('avatars/')) return 'avatar';
    if (key.includes('logos/')) return 'logo';
    return 'image';
  }
  
  if (bucket === 'matbakh-files-reports') {
    return 'report';
  }
  
  if (bucket === 'matbakh-files-uploads') {
    if (key.includes('ai-generated/')) return 'ai-generated';
    return 'document';
  }
  
  return 'unknown';
}

/**
 * Calculate file checksum for integrity verification
 */
async function calculateChecksum(bucket: string, key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response body');
    }
    
    // Convert stream to buffer
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
    // Return empty string if checksum calculation fails
    return '';
  }
}

/**
 * Log upload completion to audit trail for DSGVO compliance
 */
async function logUploadAudit(
  userId: string,
  bucket: string,
  key: string,
  fileSize: number,
  contentType: string,
  requestId: string
): Promise<void> {
  try {
    const pool = await getPgClient();
    
    const auditQuery = `
      INSERT INTO upload_audit_log (
        user_id, action, file_key, bucket, ip_address, user_agent, 
        request_id, file_size, content_type, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(auditQuery, [
      userId,
      'upload_completed',
      key,
      bucket,
      'server-side', // IP not available in S3 event
      'S3-Event-Processor',
      requestId,
      fileSize,
      contentType
    ]);
    
    console.log(`Audit log entry created for upload completion: ${bucket}/${key} by user ${userId}`);
    
  } catch (error) {
    console.error('Error logging upload audit:', error);
    // Don't throw - this is logging, not critical for the upload process
  }
}

/**
 * Store upload record in database
 */
async function storeUploadRecord(
  bucket: string,
  key: string,
  metadata: UploadMetadata,
  objectInfo: {
    contentType: string;
    contentLength: number;
    etag: string;
    checksum?: string;
  }
): Promise<void> {
  try {
    const pool = await getPgClient();
    
    const filename = key.split('/').pop() || key;
    const originalFilename = metadata.originalFilename || filename;
    const s3Url = `s3://${bucket}/${key}`;
    const uploadType = determineUploadType(bucket, key);
    
    // Set expiration for temporary files
    let expiresAt: Date | null = null;
    if (bucket === 'matbakh-files-reports' || key.includes('temp/') || key.includes('tmp/')) {
      expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    }
    
    const insertQuery = `
      INSERT INTO user_uploads (
        user_id, partner_id, filename, original_filename, s3_url, s3_bucket, s3_key,
        content_type, file_size, upload_type, is_public, uploaded_at, expires_at,
        metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
      ON CONFLICT (s3_url) DO UPDATE SET
        file_size = EXCLUDED.file_size,
        content_type = EXCLUDED.content_type,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;
    
    const isPublic = bucket === 'matbakh-files-reports';
    const uploadedAt = new Date(parseInt(metadata.uploadTimestamp));
    
    const metadataJson = {
      etag: objectInfo.etag,
      checksum: objectInfo.checksum || '',
      requestId: metadata.requestId,
      processedAt: new Date().toISOString(),
      bucket,
      key,
    };
    
    await pool.query(insertQuery, [
      metadata.userId,
      metadata.partnerId || null,
      filename,
      originalFilename,
      s3Url,
      bucket,
      key,
      objectInfo.contentType,
      objectInfo.contentLength,
      uploadType,
      isPublic,
      uploadedAt,
      expiresAt,
      JSON.stringify(metadataJson),
    ]);
    
    console.log(`Upload record stored successfully: ${bucket}/${key} for user ${metadata.userId}`);
    
    // Log audit trail for DSGVO compliance (non-blocking)
    await logUploadAudit(
      metadata.userId,
      bucket,
      key,
      objectInfo.contentLength,
      objectInfo.contentType,
      metadata.requestId
    );
    
  } catch (error) {
    console.error(`Failed to store upload record for ${bucket}/${key}:`, error);
    throw error;
  }
}

/**
 * Process a single S3 event record
 */
async function processS3Record(record: S3EventRecord): Promise<void> {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  
  console.log(`Processing S3 event: ${record.eventName} for ${bucket}/${key}`);
  
  // Only process allowed buckets
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    console.warn(`Ignoring event for non-allowed bucket: ${bucket}`);
    return;
  }
  
  // Only process PUT events (object creation)
  if (!record.eventName.startsWith('ObjectCreated:')) {
    console.log(`Ignoring non-creation event: ${record.eventName}`);
    return;
  }
  
  try {
    // Get object metadata
    const objectInfo = await getObjectMetadata(bucket, key);
    
    // Parse upload metadata
    const uploadMetadata = parseUploadMetadata(objectInfo.metadata);
    if (!uploadMetadata) {
      console.warn(`Skipping object without proper metadata: ${bucket}/${key}`);
      return;
    }
    
    // Calculate checksum for integrity verification (optional, can be expensive)
    let checksum = '';
    if (objectInfo.contentLength < 5 * 1024 * 1024) { // Only for files < 5MB
      try {
        checksum = await calculateChecksum(bucket, key);
      } catch (checksumError) {
        console.warn(`Failed to calculate checksum for ${bucket}/${key}:`, checksumError);
      }
    }
    
    // Store upload record in database
    await storeUploadRecord(bucket, key, uploadMetadata, {
      ...objectInfo,
      checksum,
    });
    
    console.log(`Successfully processed upload: ${bucket}/${key}`);
    
  } catch (error) {
    console.error(`Failed to process S3 record for ${bucket}/${key}:`, error);
    // Don't throw - we don't want to fail the entire batch for one record
  }
}

/**
 * Main Lambda handler for S3 events
 */
export const handler = async (event: S3Event, context: Context): Promise<void> => {
  console.log(`S3 upload processor invoked with ${event.Records.length} records`);
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Process all records in parallel
  const promises = event.Records.map(record => processS3Record(record));
  
  try {
    await Promise.allSettled(promises);
    console.log('All S3 records processed');
  } catch (error) {
    console.error('Error processing S3 records:', error);
    throw error;
  }
};