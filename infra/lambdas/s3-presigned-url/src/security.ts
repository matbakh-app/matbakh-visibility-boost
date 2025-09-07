/**
 * Security utilities for S3 presigned URL Lambda function
 */

import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { AppError } from './errors';

// File type validation with comprehensive MIME type checking
export const SECURITY_CONFIG = {
  // Maximum file size (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  // Presigned URL expiry (15 minutes)
  PRESIGNED_URL_EXPIRY: 15 * 60,
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10, // 10 requests per minute per user
  
  // Allowed origins for CORS
  ALLOWED_ORIGINS: [
    'https://matbakh.app',
    'http://localhost:5173',
    'http://localhost:3000', // Development
  ],
};

// Comprehensive MIME type whitelist
export const ALLOWED_MIME_TYPES = {
  // Images
  images: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
  ],
  
  // Documents
  documents: [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
  ],
  
  // Office documents
  office: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/msword', // .doc
    'application/vnd.ms-excel', // .xls
    'application/vnd.ms-powerpoint', // .ppt
  ],
  
  // Archives (limited)
  archives: [
    'application/zip',
    'application/x-zip-compressed',
  ],
};

// Get all allowed MIME types as flat array
export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
  ...ALLOWED_MIME_TYPES.office,
  ...ALLOWED_MIME_TYPES.archives,
];

// Dangerous file extensions to block
export const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.bin',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.psm1',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl',
];

// Suspicious filename patterns
export const SUSPICIOUS_PATTERNS = [
  /\.\./g, // Directory traversal
  /[<>:"|?*]/g, // Invalid filename characters
  /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
  /^\./g, // Hidden files (starting with dot)
];

/**
 * Validate MIME type against whitelist
 */
export function validateMimeType(contentType: string): boolean {
  const normalizedType = contentType.toLowerCase().trim();
  return ALL_ALLOWED_MIME_TYPES.includes(normalizedType);
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return !BLOCKED_EXTENSIONS.includes(extension);
}

/**
 * Validate filename for security issues
 */
export function validateFilename(filename: string): { valid: boolean; reason?: string } {
  // Check length
  if (filename.length > 255) {
    return { valid: false, reason: 'Filename too long (max 255 characters)' };
  }
  
  // Check for empty filename
  if (!filename.trim()) {
    return { valid: false, reason: 'Filename cannot be empty' };
  }
  
  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(filename)) {
      return { valid: false, reason: 'Filename contains invalid characters or patterns' };
    }
  }
  
  // Check file extension
  if (!validateFileExtension(filename)) {
    return { valid: false, reason: 'File extension not allowed' };
  }
  
  return { valid: true };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 200); // Limit length
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= SECURITY_CONFIG.MAX_FILE_SIZE;
}

/**
 * Rate limiting implementation
 */
export class RateLimiter {
  private static store = new Map<string, { count: number; resetTime: number }>();
  
  static checkLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.store.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize rate limit
      this.store.set(userId, { 
        count: 1, 
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW 
      });
      return true;
    }
    
    if (userLimit.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }
  
  static getRemainingRequests(userId: string): number {
    const userLimit = this.store.get(userId);
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS;
    }
    return Math.max(0, SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - userLimit.count);
  }
  
  static getResetTime(userId: string): number {
    const userLimit = this.store.get(userId);
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return Date.now() + SECURITY_CONFIG.RATE_LIMIT_WINDOW;
    }
    return userLimit.resetTime;
  }
}

/**
 * Bucket-specific validation rules
 */
export const BUCKET_RULES = {
  'matbakh-files-uploads': {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [...ALLOWED_MIME_TYPES.images, ...ALLOWED_MIME_TYPES.documents, ...ALLOWED_MIME_TYPES.office],
    requiresAuth: true,
    allowedFolders: ['user-uploads', 'ai-generated', 'temp'],
  },
  'matbakh-files-profile': {
    maxFileSize: 5 * 1024 * 1024, // 5MB for profile images
    allowedTypes: ALLOWED_MIME_TYPES.images,
    requiresAuth: true,
    allowedFolders: ['avatars', 'logos', 'cm-images'],
  },
  'matbakh-files-reports': {
    maxFileSize: 20 * 1024 * 1024, // 20MB for reports
    allowedTypes: [...ALLOWED_MIME_TYPES.documents, ...ALLOWED_MIME_TYPES.images],
    requiresAuth: false, // Public via CloudFront
    allowedFolders: ['vc-reports', 'pdf-exports', 'tmp'],
  },
} as const;

/**
 * Validate bucket-specific rules
 */
export function validateBucketRules(
  bucket: keyof typeof BUCKET_RULES,
  contentType: string,
  fileSize: number,
  folder?: string
): { valid: boolean; reason?: string } {
  const rules = BUCKET_RULES[bucket];
  
  if (!rules) {
    return { valid: false, reason: 'Invalid bucket' };
  }
  
  // Check file size
  if (fileSize > rules.maxFileSize) {
    return { 
      valid: false, 
      reason: `File size exceeds ${rules.maxFileSize / (1024 * 1024)}MB limit for ${bucket}` 
    };
  }
  
  // Check MIME type
  if (!rules.allowedTypes.includes(contentType)) {
    return { 
      valid: false, 
      reason: `File type ${contentType} not allowed for ${bucket}` 
    };
  }
  
  // Check folder
  if (folder && !(rules.allowedFolders as readonly string[]).includes(folder)) {
    return { 
      valid: false, 
      reason: `Folder ${folder} not allowed for ${bucket}` 
    };
  }
  
  return { valid: true };
}

/**
 * Generate secure S3 key with timestamp and sanitization
 */
export function generateSecureS3Key(
  bucket: string,
  folder: string,
  filename: string,
  userId?: string,
  partnerId?: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = sanitizeFilename(filename);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  switch (bucket) {
    case 'matbakh-files-uploads':
      if (partnerId) {
        return `${folder || 'uploads'}/${partnerId}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;
      }
      return `${folder || 'user-uploads'}/${userId || 'anonymous'}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;
      
    case 'matbakh-files-profile':
      if (folder === 'avatars' && userId) {
        return `avatars/${userId}/${timestamp}-${sanitizedFilename}`;
      }
      if (folder === 'logos' && partnerId) {
        return `logos/${partnerId}/${timestamp}-${sanitizedFilename}`;
      }
      return `${folder || 'general'}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;
      
    case 'matbakh-files-reports':
      return `${folder || 'reports'}/${timestamp}-${randomSuffix}-${sanitizedFilename}`;
      
    default:
      throw new Error(`Invalid bucket: ${bucket}`);
  }
}

/**
 * JWT Token verification for Cognito with proper signature verification
 */
interface CognitoJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  'cognito:username'?: string;
  'custom:partner_id'?: string;
  aud?: string;
  iss?: string;
  token_use?: string;
}

// Cognito configuration
const COGNITO_REGION = process.env.COGNITO_REGION || 'eu-central-1';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;

// Create JWKS client for Cognito public keys
let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKSClient() {
  if (!jwksClient) {
    if (!COGNITO_USER_POOL_ID) {
      throw new AppError('AUTH_ERROR' as any, 'Cognito User Pool ID not configured');
    }
    jwksClient = createRemoteJWKSet(new URL(`${COGNITO_ISSUER}/.well-known/jwks.json`));
  }
  return jwksClient;
}

/**
 * Verify JWT token from Cognito with full signature verification
 */
export async function verifyJwtToken(token: string): Promise<CognitoJwtPayload> {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    
    // Verify token with Cognito's public keys
    const { payload } = await jwtVerify(cleanToken, getJWKSClient(), {
      issuer: COGNITO_ISSUER,
      // audience: 'your-app-client-id', // Optional: validate specific client
    });
    
    // Validate required claims
    if (!payload.sub) {
      throw new AppError('AUTH_ERROR' as any, 'Invalid token: missing subject');
    }
    
    // Validate token use (should be 'access' for API access)
    if (payload.token_use && payload.token_use !== 'access') {
      throw new AppError('AUTH_ERROR' as any, 'Invalid token: wrong token use');
    }
    
    return payload as CognitoJwtPayload;
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    // Handle specific jose errors
    if (error instanceof Error) {
      if (error.message.includes('signature verification failed')) {
        throw new AppError('AUTH_ERROR' as any, 'Invalid token signature');
      }
      if (error.message.includes('expired')) {
        throw new AppError('AUTH_ERROR' as any, 'Token expired');
      }
      if (error.message.includes('invalid')) {
        throw new AppError('AUTH_ERROR' as any, 'Invalid token format');
      }
    }
    
    throw new AppError('AUTH_ERROR' as any, 'JWT verification failed', { 
      originalError: (error as Error).message 
    });
  }
}

/**
 * Fallback JWT verification for development/testing (without signature verification)
 */
export async function verifyJwtTokenUnsafe(token: string): Promise<CognitoJwtPayload> {
  try {
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    const decoded = JSON.parse(Buffer.from(cleanToken.split('.')[1], 'base64').toString());
    
    if (!decoded.sub) {
      throw new AppError('AUTH_ERROR' as any, 'Invalid token: missing subject');
    }
    
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new AppError('AUTH_ERROR' as any, 'Token expired');
    }
    
    console.warn('Using unsafe JWT verification - only for development!');
    return decoded as CognitoJwtPayload;
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('AUTH_ERROR' as any, 'Invalid JWT token', { 
      originalError: (error as Error).message 
    });
  }
}

/**
 * Extract user ID from Authorization header or request
 */
export function extractUserId(authHeader?: string, requestUserId?: string): string | null {
  // Try to get from Authorization header first
  if (authHeader) {
    try {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return decoded.sub || null;
    } catch {
      // Fall through to request userId
    }
  }
  
  // Fall back to request userId (for backward compatibility)
  return requestUserId || null;
}

/**
 * Enhanced rate limiting with persistent storage consideration
 */
export class EnhancedRateLimiter {
  private static store = new Map<string, { count: number; resetTime: number; firstRequest: number }>();
  
  static checkLimit(userId: string, customLimit?: number): boolean {
    const now = Date.now();
    const maxRequests = customLimit || SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS;
    const userLimit = this.store.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize rate limit
      this.store.set(userId, { 
        count: 1, 
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
        firstRequest: now
      });
      return true;
    }
    
    if (userLimit.count >= maxRequests) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }
  
  static getRemainingRequests(userId: string): number {
    const userLimit = this.store.get(userId);
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS;
    }
    return Math.max(0, SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - userLimit.count);
  }
  
  static getResetTime(userId: string): number {
    const userLimit = this.store.get(userId);
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return Date.now() + SECURITY_CONFIG.RATE_LIMIT_WINDOW;
    }
    return userLimit.resetTime;
  }
  
  // Clean up old entries to prevent memory leaks
  static cleanup(): void {
    const now = Date.now();
    for (const [userId, limit] of this.store.entries()) {
      if (now > limit.resetTime + SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
        this.store.delete(userId);
      }
    }
  }
}

/**
 * Generate checksum for file integrity
 */
export function generateFileChecksum(content: Buffer): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Convert hex checksum to base64 for S3 ChecksumSHA256
 */
export function hexToBase64(hexString: string): string {
  return Buffer.from(hexString, 'hex').toString('base64');
}

/**
 * Validate checksum format (hex or base64)
 */
export function validateChecksumFormat(checksum: string, format: 'hex' | 'base64' = 'hex'): boolean {
  if (format === 'hex') {
    return /^[a-fA-F0-9]{64}$/.test(checksum); // SHA256 hex = 64 chars
  } else {
    return /^[A-Za-z0-9+/]{43}=$/.test(checksum); // SHA256 base64 = 44 chars with padding
  }
}

/**
 * Security headers for CORS
 */
export function getSecurityHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin && SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : SECURITY_CONFIG.ALLOWED_ORIGINS[0];
    
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}