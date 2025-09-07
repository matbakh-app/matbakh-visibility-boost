/**
 * Secure File Preview System Lambda Handler
 * Main entry point for secure file preview generation with WAF protection
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SecurityProxy } from './security-proxy';
import { ThumbnailGenerator } from './thumbnail-generator';
import { PreviewCacheManager } from './preview-cache';
import { PreviewRequest, PreviewResult, SecurityContext, ThumbnailGenerationOptions, PDFPreviewOptions } from './types';

// Initialize services
const s3Client = new S3Client({ region: 'eu-central-1' });
const securityProxy = new SecurityProxy();
const thumbnailGenerator = new ThumbnailGenerator();
const cacheManager = new PreviewCacheManager();

/**
 * Extract file information from S3 URL
 */
function parseS3Url(s3Url: string): { bucket: string; key: string } | null {
  try {
    // Handle both s3:// and https:// URLs
    if (s3Url.startsWith('s3://')) {
      const parts = s3Url.substring(5).split('/');
      const bucket = parts[0];
      const key = parts.slice(1).join('/');
      return { bucket, key };
    } else if (s3Url.includes('.s3.') || s3Url.includes('.s3-')) {
      const url = new URL(s3Url);
      const bucket = url.hostname.split('.')[0];
      const key = url.pathname.substring(1); // Remove leading slash
      return { bucket, key };
    }
    return null;
  } catch (error) {
    console.error('Failed to parse S3 URL:', error);
    return null;
  }
}

/**
 * Get file from S3
 */
async function getFileFromS3(bucket: string, key: string): Promise<{
  buffer: Buffer;
  contentType: string;
  contentLength: number;
  lastModified: Date;
  etag: string;
}> {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('Empty response body from S3');
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
    
    return {
      buffer,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength || buffer.length,
      lastModified: response.LastModified || new Date(),
      etag: response.ETag?.replace(/"/g, '') || '',
    };
    
  } catch (error) {
    console.error(`Failed to get file from S3: ${bucket}/${key}`, error);
    throw new Error(`Failed to retrieve file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate preview for file
 */
async function generatePreview(
  fileBuffer: Buffer,
  contentType: string,
  previewRequest: PreviewRequest
): Promise<{
  previewBuffer: Buffer;
  thumbnailBuffer?: Buffer;
  metadata: any;
}> {
  const { previewType, options = {} } = previewRequest;
  
  if (contentType.startsWith('image/')) {
    // Generate image thumbnail/preview
    const thumbnailOptions: ThumbnailGenerationOptions = {
      width: options.width || (previewType === 'thumbnail' ? 200 : 800),
      height: options.height || (previewType === 'thumbnail' ? 200 : 600),
      quality: options.quality || 85,
      format: options.format || 'jpeg',
      fit: 'contain',
      background: '#ffffff',
    };
    
    const result = await thumbnailGenerator.generateImageThumbnail(
      fileBuffer,
      thumbnailOptions,
      contentType
    );
    
    // Add watermark if requested
    let previewBuffer = result.thumbnailBuffer;
    if (options.watermark) {
      previewBuffer = await thumbnailGenerator.addSecurityWatermark(
        previewBuffer,
        'SECURE PREVIEW'
      );
    }
    
    return {
      previewBuffer,
      thumbnailBuffer: previewType === 'full' ? result.thumbnailBuffer : undefined,
      metadata: result.metadata,
    };
    
  } else if (contentType === 'application/pdf') {
    // Generate PDF preview
    const pdfOptions: PDFPreviewOptions = {
      page: options.page || 1,
      scale: 1.5,
      format: options.format === 'png' ? 'png' : 'jpeg',
      quality: options.quality || 85,
      maxWidth: options.width || 800,
      maxHeight: options.height || 1000,
    };
    
    const result = await thumbnailGenerator.generatePDFPreview(
      fileBuffer,
      pdfOptions
    );
    
    return {
      previewBuffer: result.previewBuffer,
      metadata: result.metadata,
    };
    
  } else {
    throw new Error(`Unsupported content type for preview: ${contentType}`);
  }
}

/**
 * Handle preview generation request
 */
async function handlePreviewRequest(
  previewRequest: PreviewRequest,
  securityContext: SecurityContext
): Promise<PreviewResult> {
  try {
    // Parse S3 URL
    const s3Info = parseS3Url(previewRequest.fileUrl);
    if (!s3Info) {
      return {
        success: false,
        error: 'Invalid S3 URL format',
      };
    }
    
    // Get file from S3
    const fileInfo = await getFileFromS3(s3Info.bucket, s3Info.key);
    
    // Validate security
    const securityResult = await securityProxy.validateSecurity(
      securityContext,
      fileInfo.contentLength,
      fileInfo.contentType,
      s3Info.key.split('/').pop() || s3Info.key
    );
    
    if (!securityResult.allowPreview) {
      return {
        success: false,
        error: 'Preview blocked by security policy',
        securityWarnings: securityResult.violations.map(v => v.description),
      };
    }
    
    // Check cache first
    const cacheKey = cacheManager.generateCacheKey(
      previewRequest.fileUrl,
      previewRequest.userId,
      previewRequest.previewType,
      previewRequest.options
    );
    
    const cachedPreview = await cacheManager.getCachedPreview(cacheKey);
    if (cachedPreview) {
      console.log(`Serving cached preview: ${cacheKey}`);
      return {
        success: true,
        previewUrl: cachedPreview.previewUrl,
        thumbnailUrl: cachedPreview.thumbnailUrl,
        metadata: cachedPreview.metadata,
      };
    }
    
    // Generate new preview
    console.log(`Generating new preview: ${cacheKey}`);
    const previewResult = await generatePreview(
      fileInfo.buffer,
      fileInfo.contentType,
      previewRequest
    );
    
    // Store in cache
    const cacheResult = await cacheManager.storeCachedPreview(
      cacheKey,
      previewResult.previewBuffer,
      previewResult.thumbnailBuffer || null,
      {
        filename: s3Info.key.split('/').pop() || s3Info.key,
        contentType: fileInfo.contentType,
        fileSize: fileInfo.contentLength,
        dimensions: previewResult.metadata.dimensions,
        pageCount: previewResult.metadata.pageCount,
        createdAt: new Date().toISOString(),
        lastModified: fileInfo.lastModified.toISOString(),
        checksum: fileInfo.etag,
      }
    );
    
    return {
      success: true,
      previewUrl: cacheResult.previewUrl,
      thumbnailUrl: cacheResult.thumbnailUrl,
      metadata: previewResult.metadata,
      securityWarnings: securityResult.violations.length > 0 
        ? securityResult.violations.map(v => v.description)
        : undefined,
    };
    
  } catch (error) {
    console.error('Preview generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle API Gateway requests
 */
async function handleAPIRequest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { httpMethod, path, pathParameters, queryStringParameters, body, headers } = event;
  
  try {
    // CORS headers
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    // Extract security context
    const securityContext: SecurityContext = {
      ipAddress: event.requestContext.identity.sourceIp || 'unknown',
      userAgent: headers['User-Agent'] || headers['user-agent'] || 'unknown',
      requestId: event.requestContext.requestId,
      timestamp: new Date().toISOString(),
      rateLimitKey: `${event.requestContext.identity.sourceIp}:${headers.authorization || 'anonymous'}`,
    };

    // Route requests
    if (path === '/preview/generate' && httpMethod === 'POST') {
      if (!body) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const previewRequest: PreviewRequest = JSON.parse(body);
      
      // Validate required fields
      if (!previewRequest.fileUrl || !previewRequest.userId || !previewRequest.previewType) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing required fields: fileUrl, userId, previewType' }),
        };
      }

      const result = await handlePreviewRequest(previewRequest, securityContext);
      
      return {
        statusCode: result.success ? 200 : 400,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    }

    if (path === '/preview/cache/stats' && httpMethod === 'GET') {
      const stats = await cacheManager.getCacheStatistics();
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(stats),
      };
    }

    if (path.startsWith('/preview/cache/invalidate/') && httpMethod === 'DELETE') {
      const fileUrl = decodeURIComponent(pathParameters?.fileUrl || '');
      if (!fileUrl) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'File URL is required' }),
        };
      }

      const deletedCount = await cacheManager.invalidateFileCache(fileUrl);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ deletedCount }),
      };
    }

    if (path === '/preview/security/rate-limit' && httpMethod === 'GET') {
      const userId = queryStringParameters?.userId || 'anonymous';
      const ipAddress = securityContext.ipAddress;
      
      const rateLimitStatus = securityProxy.getRateLimitStatus(userId, ipAddress);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(rateLimitStatus),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
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
  event: APIGatewayProxyEvent | any,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Secure File Preview System invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Handle API Gateway events
    if ('httpMethod' in event) {
      return await handleAPIRequest(event as APIGatewayProxyEvent);
    } else {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Unsupported event type',
        }),
      };
    }

  } catch (error) {
    console.error('Handler error:', error);
    
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
};