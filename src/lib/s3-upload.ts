/**
 * S3 Upload Library with Checksum Support and Enhanced Security
 */

// Note: Using Web Crypto API instead of Node.js crypto for browser compatibility

import { 
  recordUploadSuccess, 
  recordUploadFailure, 
  recordPresignedUrlRequest,
  recordValidationError,
  type BucketType as MonitoringBucketType,
  type UploadType,
  type ErrorType
} from './monitoring';

// Types
export type BucketType = 'matbakh-files-uploads' | 'matbakh-files-profile' | 'matbakh-files-reports';

export interface UploadOptions {
  file: File;
  bucket: BucketType;
  folder?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  validateChecksum?: boolean;
  signal?: AbortSignal; // For upload cancellation
}

export interface UploadResult {
  fileUrl: string;
  cdnUrl?: string;
  uploadId: string;
  checksum?: string;
}

export interface PresignedUrlRequest {
  bucket: BucketType;
  filename: string;
  contentType: string;
  folder?: string;
  fileSize: number;
  checksumSHA256?: string;
  contentMD5?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  cdnUrl?: string;
  expiresAt: string;
  uploadId: string;
  requiredHeaders?: Record<string, string>;
  // For multipart uploads
  isMultipart?: boolean;
  multipartUploadId?: string;
  partUrls?: string[];
}

export interface MultipartUploadPart {
  partNumber: number;
  etag: string;
}

// Configuration
// Statt import.meta.env:
const env = (globalThis as any).importMetaEnv ?? process.env;
const API_BASE_URL = env.VITE_PUBLIC_API_BASE || 'https://api.matbakh.app';
const PRESIGNED_URL_ENDPOINT = env.VITE_PRESIGNED_URL_ENDPOINT || 
  'https://mgnmda4fdc7pd33znjxoocpcqe0vpcby.lambda-url.eu-central-1.on.aws/';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB - threshold for multipart upload
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
  documents: ['application/pdf', 'text/plain', 'text/csv', 'application/json'],
  office: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword',
  ],
};

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
  ...ALLOWED_MIME_TYPES.office,
];

// Image compression settings
const IMAGE_COMPRESSION_SETTINGS = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8, // 80% quality
  format: 'image/jpeg' as const,
};

/**
 * Compress image file before upload
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: string;
  } = {}
): Promise<File> {
  // Only compress images
  if (!ALLOWED_MIME_TYPES.images.includes(file.type)) {
    return file;
  }

  const {
    maxWidth = IMAGE_COMPRESSION_SETTINGS.maxWidth,
    maxHeight = IMAGE_COMPRESSION_SETTINGS.maxHeight,
    quality = IMAGE_COMPRESSION_SETTINGS.quality,
    format = IMAGE_COMPRESSION_SETTINGS.format,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }

          // Create new file with compressed data
          const compressedFile = new File([blob], file.name, {
            type: format,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for compression'));
    };

    // Load image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate file preview (data URL for images, metadata for others)
 */
export async function generateFilePreview(file: File): Promise<{
  type: 'image' | 'document' | 'unknown';
  preview?: string; // Data URL for images
  metadata: {
    name: string;
    size: string;
    type: string;
    lastModified: string;
  };
}> {
  const metadata = {
    name: file.name,
    size: formatFileSize(file.size),
    type: file.type || 'unknown',
    lastModified: new Date(file.lastModified).toLocaleDateString(),
  };

  // Generate preview for images
  if (ALLOWED_MIME_TYPES.images.includes(file.type)) {
    try {
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      return {
        type: 'image',
        preview,
        metadata,
      };
    } catch (error) {
      console.warn('Failed to generate image preview:', error);
    }
  }

  // For documents, just return metadata
  const isDocument = ALLOWED_MIME_TYPES.documents.includes(file.type) ||
    ALLOWED_MIME_TYPES.office.includes(file.type);

  return {
    type: isDocument ? 'document' : 'unknown',
    metadata,
  };
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate SHA256 checksum of file (hex format)
 */
async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex checksum to base64 for S3 headers
 */
function hexToBase64(hexString: string): string {
  const bytes = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Calculate MD5 checksum of file (for Content-MD5 header)
 */
async function calculateMD5(file: File): Promise<string> {
  // Note: Web Crypto API doesn't support MD5, so we'll use a fallback
  // In a real implementation, you might want to use a library like crypto-js
  const buffer = await file.arrayBuffer();

  // For now, return empty string - MD5 calculation would need additional library
  // In production, implement proper MD5 calculation
  console.warn('MD5 calculation not implemented in browser - using SHA256 instead');
  return '';
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, maxSize: number = MAX_FILE_SIZE): { valid: boolean; error?: string } {
  const bucketType = 'uploads' as MonitoringBucketType; // Default for validation

  // Check file size
  if (file.size > maxSize) {
    recordValidationError('file_size', bucketType);
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    recordValidationError('file_type', bucketType);
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check filename
  if (file.name.length > 255) {
    recordValidationError('file_name', bucketType);
    return {
      valid: false,
      error: 'Filename is too long (max 255 characters)',
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [/\.\./g, /[<>:"|?*]/g, /^\./g];
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      recordValidationError('file_name', bucketType);
      return {
        valid: false,
        error: 'Filename contains invalid characters',
      };
    }
  }

  return { valid: true };
}

/**
 * Check network connectivity
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a small resource to check connectivity
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('Network connectivity check failed:', error);
    return false;
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return 'Upload failed due to network issues. Please check your internet connection and try again.';
  }

  if (message.includes('authentication') || message.includes('unauthorized')) {
    return 'Authentication required. Please log in and try again.';
  }

  if (message.includes('file size') || message.includes('too large')) {
    return 'File is too large. Please choose a file smaller than 10MB.';
  }

  if (message.includes('file type') || message.includes('not allowed')) {
    return 'File type not supported. Please choose a valid image or document file.';
  }

  if (message.includes('timeout')) {
    return 'Upload timed out. Please try again with a smaller file or check your connection.';
  }

  if (message.includes('abort')) {
    return 'Upload was cancelled.';
  }

  // Return original message if no specific pattern matches
  return error.message || 'Upload failed. Please try again.';
}

/**
 * Get authentication token from storage or context
 */
function getAuthToken(): string | null {
  // Try to get from localStorage first
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (token) {
    return token;
  }

  // Try to get from cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_token' || name === 'access_token') {
      return value;
    }
  }

  return null;
}

/**
 * Request presigned URL from Lambda function
 */
async function requestPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
  const startTime = Date.now();
  const bucketType = request.bucket.replace('matbakh-files-', '') as MonitoringBucketType;

  const authToken = getAuthToken();
  if (!authToken) {
    await recordPresignedUrlRequest(bucketType, false);
    throw new Error('Authentication required - please log in');
  }

  try {
    const response = await fetch(PRESIGNED_URL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(request),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      await recordPresignedUrlRequest(bucketType, false, duration);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    await recordPresignedUrlRequest(bucketType, true, duration);
    return response.json();
  } catch (error) {
    const duration = Date.now() - startTime;
    await recordPresignedUrlRequest(bucketType, false, duration);
    throw error;
  }
}

/**
 * Upload a single part for multipart upload
 */
async function uploadPart(
  partData: Blob,
  uploadUrl: string,
  partNumber: number,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle cancellation
    if (signal) {
      if (signal.aborted) {
        reject(new Error('Upload was cancelled before starting'));
        return;
      }

      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload was cancelled'));
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const etag = xhr.getResponseHeader('ETag');
        if (etag) {
          resolve(etag.replace(/"/g, '')); // Remove quotes from ETag
        } else {
          reject(new Error(`No ETag received for part ${partNumber}`));
        }
      } else {
        reject(new Error(`Part ${partNumber} upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error(`Part ${partNumber} upload failed due to network error`));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error(`Part ${partNumber} upload was aborted`));
    });

    xhr.timeout = 30 * 60 * 1000; // 30 minutes timeout
    xhr.addEventListener('timeout', () => {
      reject(new Error(`Part ${partNumber} upload timed out`));
    });

    xhr.open('PUT', uploadUrl);
    xhr.send(partData);
  });
}

/**
 * Complete multipart upload
 */
async function completeMultipartUpload(
  multipartUploadId: string,
  parts: MultipartUploadPart[],
  fileUrl: string
): Promise<void> {
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/complete-multipart-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      multipartUploadId,
      parts: parts.sort((a, b) => a.partNumber - b.partNumber),
      fileUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to complete multipart upload');
  }
}

/**
 * Upload large file using multipart upload
 */
async function uploadMultipart(
  file: File,
  presignedResponse: PresignedUrlResponse,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!presignedResponse.isMultipart || !presignedResponse.partUrls || !presignedResponse.multipartUploadId) {
    throw new Error('Invalid multipart upload response');
  }

  const partSize = 5 * 1024 * 1024; // 5MB parts
  const totalParts = Math.ceil(file.size / partSize);
  const parts: MultipartUploadPart[] = [];
  let uploadedBytes = 0;

  // Upload parts in parallel (max 3 concurrent uploads)
  const maxConcurrent = 3;
  const partPromises: Promise<void>[] = [];

  for (let i = 0; i < totalParts; i++) {
    const partNumber = i + 1;
    const start = i * partSize;
    const end = Math.min(start + partSize, file.size);
    const partData = file.slice(start, end);
    const uploadUrl = presignedResponse.partUrls[i];

    const partPromise = (async () => {
      try {
        const etag = await uploadPart(partData, uploadUrl, partNumber, signal);
        parts.push({ partNumber, etag });

        uploadedBytes += partData.size;
        const progress = (uploadedBytes / file.size) * 100;
        onProgress?.(progress);
      } catch (error) {
        throw new Error(`Failed to upload part ${partNumber}: ${error}`);
      }
    })();

    partPromises.push(partPromise);

    // Limit concurrent uploads
    if (partPromises.length >= maxConcurrent || i === totalParts - 1) {
      await Promise.all(partPromises);
      partPromises.length = 0; // Clear the array
    }
  }

  // Complete the multipart upload
  await completeMultipartUpload(presignedResponse.multipartUploadId, parts, presignedResponse.fileUrl);
}

/**
 * Upload file to S3 using presigned URL with cancellation support
 */
async function uploadToS3(
  file: File,
  presignedResponse: PresignedUrlResponse,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> {
  // Use multipart upload for large files
  if (presignedResponse.isMultipart) {
    return uploadMultipart(file, presignedResponse, onProgress, signal);
  }

  // Regular single-part upload
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle cancellation
    if (signal) {
      if (signal.aborted) {
        reject(new Error('Upload was cancelled before starting'));
        return;
      }

      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload was cancelled'));
      });
    }

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    // Set timeout for upload (30 minutes max)
    xhr.timeout = 30 * 60 * 1000;
    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out after 30 minutes'));
    });

    xhr.open('PUT', presignedResponse.uploadUrl);

    // Set required headers
    if (presignedResponse.requiredHeaders) {
      Object.entries(presignedResponse.requiredHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    // If presign didn't include Content-Type and we have a file type
    if (!presignedResponse.requiredHeaders?.['Content-Type'] && file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }

    xhr.send(file);
  });
}

/**
 * Commit upload metadata to database
 */
async function commitUpload(uploadId: string, fileUrl: string, checksum?: string): Promise<void> {
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/upload/commit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      uploadId,
      fileUrl,
      checksum,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to commit upload');
  }
}

/**
 * Upload with automatic image compression
 */
export async function uploadWithCompression(
  options: UploadOptions & {
    compressImages?: boolean;
    compressionOptions?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    };
  }
): Promise<UploadResult> {
  const { compressImages = true, compressionOptions, ...uploadOptions } = options;
  let { file } = uploadOptions;

  // Compress image if enabled and file is an image
  if (compressImages && ALLOWED_MIME_TYPES.images.includes(file.type)) {
    try {
      const compressedFile = await compressImage(file, compressionOptions);

      // Only use compressed version if it's actually smaller
      if (compressedFile.size < file.size) {
        file = compressedFile;
        console.log(`Image compressed: ${formatFileSize(uploadOptions.file.size)} → ${formatFileSize(file.size)}`);
      }
    } catch (error) {
      console.warn('Image compression failed, using original file:', error);
    }
  }

  return uploadToS3Enhanced({ ...uploadOptions, file });
}

/**
 * Main upload function with enhanced security and integrity checks
 */
export async function uploadToS3Enhanced(options: UploadOptions): Promise<UploadResult> {
  const { file, bucket, folder, onProgress, onSuccess, onError, validateChecksum = true, signal } = options;
  
  const startTime = Date.now();
  const bucketType = bucket.replace('matbakh-files-', '') as MonitoringBucketType;
  
  // Determine upload type based on file type and folder
  let uploadType: UploadType = 'other';
  if (ALLOWED_MIME_TYPES.images.includes(file.type)) {
    if (folder?.includes('avatar')) uploadType = 'avatar';
    else if (folder?.includes('logo')) uploadType = 'logo';
    else uploadType = 'image';
  } else if (ALLOWED_MIME_TYPES.documents.includes(file.type)) {
    if (folder?.includes('report')) uploadType = 'report';
    else uploadType = 'document';
  }

  try {
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      throw new Error('No internet connection detected. Please check your network and try again.');
    }

    // Check if upload was cancelled before starting
    if (signal?.aborted) {
      throw new Error('Upload was cancelled');
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Calculate checksums if validation is enabled
    let checksumSHA256: string | undefined;
    let contentMD5: string | undefined;

    if (validateChecksum) {
      onProgress?.(5); // 5% - starting checksum calculation
      checksumSHA256 = await calculateSHA256(file);
      onProgress?.(10); // 10% - checksum calculated

      console.log(`File checksum calculated: ${checksumSHA256.substring(0, 8)}...`);

      // MD5 calculation (optional, for Content-MD5 header)
      try {
        contentMD5 = await calculateMD5(file);
      } catch (md5Error) {
        console.warn('MD5 calculation failed, continuing without Content-MD5:', md5Error);
      }
    }

    onProgress?.(15); // 15% - preparing request

    // Request presigned URL (with multipart support for large files)
    const presignedRequest: PresignedUrlRequest = {
      bucket,
      filename: file.name,
      contentType: file.type,
      folder,
      fileSize: file.size,
      checksumSHA256,
      contentMD5,
    };

    const presignedResponse = await requestPresignedUrl(presignedRequest);
    onProgress?.(25); // 25% - presigned URL received

    // Upload file to S3
    await uploadToS3(file, presignedResponse, (uploadProgress) => {
      // Map upload progress to 25-90% range
      const mappedProgress = 25 + (uploadProgress * 0.65);
      onProgress?.(mappedProgress);
    }, signal);

    onProgress?.(90); // 90% - upload complete

    // Commit upload metadata (optional - can be handled by S3 event)
    try {
      await commitUpload(presignedResponse.uploadId, presignedResponse.fileUrl, checksumSHA256);
    } catch (commitError) {
      console.warn('Failed to commit upload metadata (will be handled by S3 event):', commitError);
    }

    onProgress?.(100); // 100% - complete

    const duration = Date.now() - startTime;
    
    // Record successful upload
    await recordUploadSuccess(bucketType, uploadType, file.size, duration);

    const result: UploadResult = {
      fileUrl: presignedResponse.fileUrl,
      cdnUrl: presignedResponse.cdnUrl,
      uploadId: presignedResponse.uploadId,
      checksum: checksumSHA256,
    };

    onSuccess?.(result);
    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const originalError = error instanceof Error ? error : new Error('Unknown upload error');
    
    // Categorize error for monitoring
    let errorType: ErrorType = 'unknown_error';
    const message = originalError.message.toLowerCase();
    
    if (message.includes('validation') || message.includes('file size') || message.includes('file type')) {
      errorType = 'validation_error';
    } else if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      errorType = 'network_error';
    } else if (message.includes('permission') || message.includes('403') || message.includes('unauthorized')) {
      errorType = 'permission_error';
    } else if (message.includes('quota') || message.includes('limit') || message.includes('exceeded')) {
      errorType = 'quota_error';
    } else if (message.includes('500') || message.includes('server') || message.includes('internal')) {
      errorType = 'server_error';
    }
    
    // Record failed upload
    await recordUploadFailure(bucketType, uploadType, errorType, originalError.message);
    
    const userFriendlyMessage = getUserFriendlyErrorMessage(originalError);
    const uploadError = new Error(userFriendlyMessage);

    // Preserve original error for debugging
    (uploadError as any).originalError = originalError;

    onError?.(uploadError);
    throw uploadError;
  }
}

/**
 * Upload with retry logic
 */
export async function uploadWithRetry(
  options: UploadOptions,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToS3Enhanced(options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      console.warn(`Upload attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
    }
  }

  throw lastError!;
}

/**
 * Create an AbortController for upload cancellation
 */
export function createUploadController(): AbortController {
  return new AbortController();
}

/**
 * Upload with automatic retry and better error recovery
 */
export async function uploadWithRetryAndRecovery(
  options: UploadOptions,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check network before each attempt
      if (attempt > 1) {
        const isConnected = await checkNetworkConnectivity();
        if (!isConnected) {
          throw new Error('Network connection lost. Please check your internet connection.');
        }
      }

      return await uploadToS3Enhanced(options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry if upload was cancelled
      if (lastError.message.includes('cancelled') || lastError.message.includes('aborted')) {
        throw lastError;
      }

      // Don't retry validation errors
      if (lastError.message.includes('File size') ||
        lastError.message.includes('File type') ||
        lastError.message.includes('Authentication required')) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
      const delay = baseDelay + jitter;

      await new Promise(resolve => setTimeout(resolve, delay));

      console.warn(`Upload attempt ${attempt} failed, retrying in ${Math.round(delay)}ms:`, lastError.message);
    }
  }

  throw lastError!;
}

/**
 * Batch upload multiple files with cancellation support
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: BucketType,
  folder?: string,
  onProgress?: (fileIndex: number, progress: number) => void,
  signal?: AbortSignal
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Check if batch upload was cancelled
    if (signal?.aborted) {
      throw new Error('Batch upload was cancelled');
    }

    try {
      const result = await uploadToS3Enhanced({
        file,
        bucket,
        folder,
        signal,
        onProgress: (progress) => onProgress?.(i, progress),
      });

      results.push(result);
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error);
      throw error;
    }
  }

  return results;
}

// DSGVO Compliance Functions
import { supabase } from '@/integrations/supabase/client';

/**
 * Delete all files for a user (DSGVO compliance)
 */
export async function deleteUserFiles(userId: string): Promise<{
  success: boolean;
  deletedFiles: string[];
  errors: string[];
}> {
  const deletedFiles: string[] = [];
  const errors: string[] = [];

  try {
    // Get all user files from database
    const { data: userFiles, error } = await supabase
      .from('user_uploads')
      .select('id, s3_url, s3_key, s3_bucket')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user files: ${error.message}`);
    }

    if (!userFiles || userFiles.length === 0) {
      console.log('User data deletion', { userId, deletedFiles: [], message: 'No files found' });
      return { success: true, deletedFiles: [], errors: [] };
    }

    // Delete files from S3
    for (const file of userFiles) {
      try {
        const s3Key = file.s3_key || file.s3_url.split('/').pop();
        
        // Call Lambda function to delete from S3
        const authToken = getAuthToken();
        if (authToken) {
          const response = await fetch(`${API_BASE_URL}/delete-file`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              bucket: file.s3_bucket,
              key: s3Key
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
        
        deletedFiles.push(s3Key);
      } catch (s3Error) {
        errors.push(`Failed to delete ${file.s3_key}: ${s3Error}`);
      }
    }

    // Remove database records
    const { error: deleteError } = await supabase
      .from('user_uploads')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      errors.push(`Failed to delete database records: ${deleteError.message}`);
    }

    // Also clean up profile-related files
    const { error: profileError } = await supabase
      .from('business_profiles')
      .update({ 
        avatar_s3_url: null, 
        logo_s3_url: null 
      })
      .eq('user_id', userId);

    if (profileError) {
      errors.push(`Failed to clean profile files: ${profileError.message}`);
    }

    // Log for audit trail
    console.log('User data deletion', {
      userId,
      deletedFiles,
      errors,
      timestamp: new Date().toISOString()
    });

    return {
      success: errors.length === 0,
      deletedFiles,
      errors
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('User data deletion failed', { userId, error: errorMessage });
    return {
      success: false,
      deletedFiles,
      errors: [errorMessage]
    };
  }
}

/**
 * Generate presigned URL with proper expiration and access control
 */
export async function generatePresignedUrl(options: {
  bucket: BucketType;
  filename: string;
  contentType: string;
  operation: 'upload' | 'download';
  userId?: string;
  folder?: string;
}): Promise<{
  success: boolean;
  uploadUrl?: string;
  downloadUrl?: string;
  fileUrl?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    // Log access for audit trail
    console.log('File access', {
      userId: options.userId,
      filename: options.filename,
      operation: options.operation,
      bucket: options.bucket,
      timestamp: new Date().toISOString()
    });

    const authToken = getAuthToken();
    if (!authToken) {
      return {
        success: false,
        error: 'AUTHENTICATION_REQUIRED'
      };
    }

    const response = await fetch(PRESIGNED_URL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        bucket: options.bucket,
        filename: options.filename,
        contentType: options.contentType,
        operation: options.operation,
        userId: options.userId,
        folder: options.folder
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || 'PERMISSION_DENIED'
      };
    }

    const data = await response.json();
    
    // Calculate expiration based on operation
    const now = new Date();
    const expirationMinutes = options.operation === 'upload' ? 15 : 24 * 60;
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);

    return {
      success: true,
      uploadUrl: options.operation === 'upload' ? data.uploadUrl : undefined,
      downloadUrl: options.operation === 'download' ? data.downloadUrl || data.uploadUrl : undefined,
      fileUrl: data.fileUrl,
      expiresAt: expiresAt.toISOString()
    };
  } catch (error) {
    console.error('Presigned URL generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      options
    });
    
    return {
      success: false,
      error: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Validate file access permissions
 */
export async function validateFileAccess(fileId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_uploads')
      .select('user_id, is_public')
      .eq('id', fileId)
      .single();

    if (error || !data) {
      return false;
    }

    // Allow access if file is public or user owns the file
    return data.is_public || data.user_id === userId;
  } catch (error) {
    console.error('File access validation failed', { fileId, userId, error });
    return false;
  }
}

/**
 * Log file access for audit purposes
 */
export function logFileAccess(options: {
  userId?: string;
  fileId?: string;
  filename: string;
  operation: 'upload' | 'download' | 'delete';
  success: boolean;
  error?: string;
}): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: options.userId,
    fileId: options.fileId,
    filename: options.filename,
    operation: options.operation,
    success: options.success,
    error: options.error,
    userAgent: navigator.userAgent,
    ip: 'client-side' // IP would be logged server-side
  };

  console.log('File access audit', logEntry);

  // In production, this would also send to a logging service
  // Example: send to CloudWatch, Datadog, etc.
}