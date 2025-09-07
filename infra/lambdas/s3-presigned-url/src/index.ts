import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Pool } from 'pg';

// Import security and error handling utilities
import {
  validateMimeType,
  validateFilename,
  validateFileSize,
  validateBucketRules,
  generateSecureS3Key,
  getSecurityHeaders,
  verifyJwtToken,
  verifyJwtTokenUnsafe,
  validateChecksumFormat,
  hexToBase64,
  EnhancedRateLimiter,
  SECURITY_CONFIG,
  BUCKET_RULES,
} from './security';

import {
  AppError,
  ValidationErrors,
  PermissionErrors,
  RateLimitErrors,
  DatabaseErrors,
  S3Errors,
  InternalErrors,
  handleUnknownError,
  createErrorResponse,
} from './errors';

// Types
interface PresignedUrlRequest {
  bucket: 'matbakh-files-uploads' | 'matbakh-files-profile' | 'matbakh-files-reports';
  filename: string;
  contentType: string;
  folder?: string;
  userId?: string;
  partnerId?: string;
  fileSize?: number;
  checksumSHA256?: string;
  contentMD5?: string;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  publicUrl?: string;
  expiresAt: string;
  uploadId?: string;
  requiredHeaders?: Record<string, string>;
}

interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}

// Constants
const ALLOWED_BUCKETS = ['matbakh-files-uploads', 'matbakh-files-profile', 'matbakh-files-reports'] as const;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || '';

// Cached database pool
let cachedPool: Pool | null = null;

// Initialize AWS clients
const s3Client = new S3Client({ region: 'eu-central-1' });
const secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });

/**
 * Get PostgreSQL connection pool with automatic secret retrieval
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
 * Extract file size from request
 */
function extractFileSize(event: APIGatewayProxyEvent, request: PresignedUrlRequest): number {
  // Try to get file size from request body
  if (request.fileSize && request.fileSize > 0) {
    return request.fileSize;
  }
  
  // Try to get from Content-Length header
  const contentLength = event.headers['Content-Length'] || event.headers['content-length'];
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > 0) {
      return size;
    }
  }
  
  // Default to max allowed size for validation (actual size will be checked during upload)
  return SECURITY_CONFIG.MAX_FILE_SIZE;
}

/**
 * Check DSGVO consent for file upload operations
 */
async function checkDsgvoConsent(userId: string): Promise<void> {
  try {
    const pool = await getPgClient();
    
    // Check if user has valid consent for file_upload
    const consentQuery = `
      SELECT consent_type, granted, granted_at, expires_at 
      FROM user_consents 
      WHERE user_id = $1 AND consent_type = 'file_upload' AND granted = true
      ORDER BY granted_at DESC 
      LIMIT 1
    `;
    
    const consentResult = await pool.query(consentQuery, [userId]);
    
    if (consentResult.rows.length === 0) {
      throw new AppError(
        'DSGVO_CONSENT_REQUIRED' as any,
        'DSGVO consent required for file upload operations',
        { 
          userId,
          consentType: 'file_upload',
          message: 'User must provide consent for file upload before proceeding'
        }
      );
    }

    const consent = consentResult.rows[0];
    
    // Check if consent has expired
    if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
      throw new AppError(
        'DSGVO_CONSENT_EXPIRED' as any,
        'DSGVO consent has expired for file upload operations',
        { 
          userId,
          consentType: 'file_upload',
          expiredAt: consent.expires_at,
          message: 'User consent has expired and must be renewed'
        }
      );
    }

    console.log(`DSGVO consent verified for user ${userId} - granted at ${consent.granted_at}`);

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw DatabaseErrors.queryFailed('DSGVO consent check', error as Error);
  }
}

/**
 * Validate user permissions against database
 */
async function validateUserPermissions(userId: string, bucket: string, partnerId?: string): Promise<void> {
  try {
    const pool = await getPgClient();
    
    // Check if user exists and is active
    const userQuery = 'SELECT id, role FROM profiles WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      throw PermissionErrors.userNotFound(userId);
    }

    const user = userResult.rows[0];
    
    // Super admins can access everything
    if (user.role === 'super_admin' || user.role === 'admin') {
      return;
    }

    // For partner-specific buckets, validate partner relationship
    if (partnerId && (bucket === 'matbakh-files-uploads' || bucket === 'matbakh-files-profile')) {
      const partnerQuery = 'SELECT id FROM business_partners WHERE id = $1 AND user_id = $2';
      const partnerResult = await pool.query(partnerQuery, [partnerId, userId]);
      
      if (partnerResult.rows.length === 0) {
        throw PermissionErrors.partnerAccessDenied(userId, partnerId);
      }
    }

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw DatabaseErrors.queryFailed('user permissions validation', error as Error);
  }
}

// Removed - now using generateSecureS3Key from security module

/**
 * Generate public URL for files
 */
function generatePublicUrl(bucket: string, key: string): string | undefined {
  if (bucket === 'matbakh-files-reports' && CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${key}`;
  }
  return undefined;
}

/**
 * Log upload activity to database with enhanced audit trail
 */
async function logUploadActivity(
  userId: string, 
  bucket: string, 
  key: string, 
  contentType: string, 
  fileSize: number,
  partnerId?: string,
  requestId?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  try {
    const pool = await getPgClient();
    
    // Insert into user_uploads table
    const insertQuery = `
      INSERT INTO user_uploads (
        user_id, partner_id, filename, original_filename, s3_url, s3_bucket, s3_key, 
        content_type, file_size, upload_type, uploaded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `;
    
    const filename = key.split('/').pop() || key;
    const originalFilename = key.split('-').pop() || filename; // Extract original filename
    const s3Url = `s3://${bucket}/${key}`;
    
    // Determine upload type based on bucket and folder
    let uploadType = 'document';
    if (bucket === 'matbakh-files-profile') {
      if (key.includes('avatars/')) uploadType = 'avatar';
      else if (key.includes('logos/')) uploadType = 'profile';
      else uploadType = 'image';
    } else if (bucket === 'matbakh-files-reports') {
      uploadType = 'report';
    }
    
    await pool.query(insertQuery, [
      userId,
      partnerId || null,
      filename,
      originalFilename,
      s3Url,
      bucket,
      key,
      contentType,
      fileSize,
      uploadType
    ]);

    // Enhanced audit logging for DSGVO compliance
    const auditQuery = `
      INSERT INTO upload_audit_log (
        user_id, action, file_key, bucket, ip_address, user_agent, 
        request_id, file_size, content_type, partner_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT DO NOTHING
    `;
    
    await pool.query(auditQuery, [
      userId,
      'presigned_url_generated',
      key,
      bucket,
      ipAddress || 'unknown',
      userAgent || 'unknown',
      requestId || 'unknown',
      fileSize,
      contentType,
      partnerId || null
    ]);
    
    console.log(`Upload activity and audit trail logged for user ${userId}, bucket ${bucket}, size ${fileSize} bytes`);
  } catch (error) {
    console.error('Error logging upload activity:', error);
    // Don't fail the request if logging fails - this is non-critical
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;
  console.log(`Presigned URL request received [${requestId}]:`, JSON.stringify(event, null, 2));

  // Get security headers with proper CORS
  const origin = event.headers.Origin || event.headers.origin;
  const headers = getSecurityHeaders(origin);

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Parse and validate request body
    if (!event.body) {
      throw ValidationErrors.missingRequiredFields(['body']);
    }

    let request: PresignedUrlRequest;
    try {
      request = JSON.parse(event.body);
    } catch (parseError) {
      throw new AppError(
        'VALIDATION_ERROR' as any,
        'Invalid JSON in request body',
        { originalError: (parseError as Error).message }
      );
    }

    // Validate required fields
    const missingFields = [];
    if (!request.bucket) missingFields.push('bucket');
    if (!request.filename) missingFields.push('filename');
    if (!request.contentType) missingFields.push('contentType');
    
    if (missingFields.length > 0) {
      throw ValidationErrors.missingRequiredFields(missingFields);
    }

    // Validate bucket
    if (!ALLOWED_BUCKETS.includes(request.bucket)) {
      throw ValidationErrors.invalidBucket(request.bucket, [...ALLOWED_BUCKETS]);
    }

    // Validate filename
    const filenameValidation = validateFilename(request.filename);
    if (!filenameValidation.valid) {
      throw ValidationErrors.invalidFilename(request.filename, filenameValidation.reason!);
    }

    // Validate MIME type
    if (!validateMimeType(request.contentType)) {
      throw ValidationErrors.invalidMimeType(request.contentType, Object.values(BUCKET_RULES[request.bucket].allowedTypes));
    }

    // Extract and validate file size
    const fileSize = extractFileSize(event, request);
    if (!validateFileSize(fileSize)) {
      throw ValidationErrors.fileSizeExceeded(fileSize, SECURITY_CONFIG.MAX_FILE_SIZE);
    }

    // Validate bucket-specific rules
    const bucketValidation = validateBucketRules(request.bucket, request.contentType, fileSize, request.folder);
    if (!bucketValidation.valid) {
      throw new AppError('VALIDATION_ERROR' as any, bucketValidation.reason!);
    }

    // Extract and verify JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    let userId: string;
    let userEmail: string | undefined;
    
    if (authHeader) {
      try {
        // Use safe verification in production, unsafe in development
        const isProduction = process.env.NODE_ENV === 'production';
        const tokenPayload = isProduction 
          ? await verifyJwtToken(authHeader)
          : await verifyJwtTokenUnsafe(authHeader);
          
        userId = tokenPayload.sub;
        userEmail = tokenPayload.email;
        
        // Extract partner ID from token if available
        if (tokenPayload['custom:partner_id'] && !request.partnerId) {
          request.partnerId = tokenPayload['custom:partner_id'];
        }
        
        console.log(`Authenticated user: ${userId} (${userEmail || 'no email'})`);
        
      } catch (tokenError) {
        console.error('JWT verification failed:', tokenError);
        throw PermissionErrors.invalidToken((tokenError as Error).message);
      }
    } else {
      throw PermissionErrors.authenticationRequired();
    }

    // Check rate limiting with enhanced limiter
    if (!EnhancedRateLimiter.checkLimit(userId)) {
      const resetTime = EnhancedRateLimiter.getResetTime(userId);
      throw RateLimitErrors.rateLimitExceeded(userId, resetTime);
    }

    // DSGVO Compliance: Check consent before allowing upload
    await checkDsgvoConsent(userId);

    // Validate user permissions
    await validateUserPermissions(userId, request.bucket, request.partnerId);

    // Generate secure S3 key
    const s3Key = generateSecureS3Key(
      request.bucket,
      request.folder || '',
      request.filename,
      userId,
      request.partnerId
    );

    // Process and validate checksums for integrity verification
    let checksumSHA256Base64: string | undefined;
    let contentMD5: string | undefined;
    
    if (request.checksumSHA256) {
      // Validate checksum format
      if (validateChecksumFormat(request.checksumSHA256, 'hex')) {
        checksumSHA256Base64 = hexToBase64(request.checksumSHA256);
      } else if (validateChecksumFormat(request.checksumSHA256, 'base64')) {
        checksumSHA256Base64 = request.checksumSHA256;
      } else {
        throw ValidationErrors.invalidFilename(request.filename, 'Invalid SHA256 checksum format');
      }
    }
    
    if (request.contentMD5) {
      // Validate MD5 format (base64 encoded)
      if (!/^[A-Za-z0-9+/]{22}==$/.test(request.contentMD5)) {
        throw ValidationErrors.invalidFilename(request.filename, 'Invalid MD5 checksum format');
      }
      contentMD5 = request.contentMD5;
    }
    
    // Create presigned URL with integrity checks
    const putObjectCommand = new PutObjectCommand({
      Bucket: request.bucket,
      Key: s3Key,
      ContentType: request.contentType,
      ServerSideEncryption: 'AES256',
      ContentLength: fileSize,
      ...(checksumSHA256Base64 && { ChecksumSHA256: checksumSHA256Base64 }),
      ...(contentMD5 && { ContentMD5: contentMD5 }),
      Metadata: {
        'uploaded-by': userId,
        'upload-timestamp': Date.now().toString(),
        'request-id': requestId,
        'original-filename': request.filename,
        ...(userEmail && { 'user-email': userEmail }),
        ...(request.partnerId && { 'partner-id': request.partnerId }),
        ...(request.checksumSHA256 && { 'checksum-sha256-hex': request.checksumSHA256 }),
        ...(checksumSHA256Base64 && { 'checksum-sha256-base64': checksumSHA256Base64 }),
        ...(contentMD5 && { 'content-md5': contentMD5 }),
      },
    });

    let uploadUrl: string;
    try {
      uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
        expiresIn: SECURITY_CONFIG.PRESIGNED_URL_EXPIRY,
      });
    } catch (s3Error) {
      throw S3Errors.presignedUrlFailed(request.bucket, s3Key, s3Error as Error);
    }

    // Generate response URLs
    const fileUrl = `s3://${request.bucket}/${s3Key}`;
    const publicUrl = generatePublicUrl(request.bucket, s3Key);
    const expiresAt = new Date(Date.now() + SECURITY_CONFIG.PRESIGNED_URL_EXPIRY * 1000).toISOString();

    // Extract additional audit information
    const userAgent = event.headers['User-Agent'] || event.headers['user-agent'];
    const ipAddress = event.requestContext?.identity?.sourceIp || 
                     event.headers['X-Forwarded-For'] || 
                     event.headers['x-forwarded-for'];

    // Log upload activity with enhanced audit trail (non-blocking)
    await logUploadActivity(
      userId, 
      request.bucket, 
      s3Key, 
      request.contentType, 
      fileSize, 
      request.partnerId,
      requestId,
      userAgent,
      ipAddress
    );

    // Generate upload ID for tracking
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Prepare required headers for frontend
    const requiredHeaders: Record<string, string> = {
      'Content-Type': request.contentType,
    };
    
    if (checksumSHA256Base64) {
      requiredHeaders['x-amz-checksum-sha256'] = checksumSHA256Base64;
    }
    
    if (contentMD5) {
      requiredHeaders['Content-MD5'] = contentMD5;
    }

    const response: PresignedUrlResponse = {
      uploadUrl,
      fileUrl,
      publicUrl,
      expiresAt,
      uploadId,
      requiredHeaders,
    };

    console.log(`Presigned URL generated successfully [${requestId}] for user ${userId}, bucket ${request.bucket}, size ${fileSize} bytes`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    const appError = handleUnknownError(error);
    return createErrorResponse(appError, headers, requestId);
  }
};