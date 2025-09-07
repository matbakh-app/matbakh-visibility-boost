/**
 * Upload Management API Lambda Handler
 * Provides API endpoints for the upload management dashboard
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { Pool } from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  dbname: string;
  port: string;
}

interface UploadRecord {
  id: string;
  filename: string;
  originalFilename: string;
  s3Url: string;
  s3Bucket: string;
  s3Key: string;
  contentType: string;
  fileSize: number;
  uploadType: string;
  status: string;
  uploadedAt: string;
  expiresAt?: string;
  metadata?: any;
  isPublic: boolean;
  partnerId?: string;
  userId: string;
}

// Cached database pool
let cachedPool: Pool | null = null;

// Initialize AWS clients
const secretsClient = new SecretsManagerClient({ region: 'eu-central-1' });
const s3Client = new S3Client({ region: 'eu-central-1' });

/**
 * Get PostgreSQL connection pool
 */
async function getPgPool(): Promise<Pool> {
  if (cachedPool) {
    return cachedPool;
  }

  try {
    const command = new GetSecretValueCommand({ SecretId: 'matbakh-db-postgres' });
    const secret = await secretsClient.send(command);
    
    if (!secret.SecretString) {
      throw new Error('Database secret is empty');
    }

    const creds: DatabaseCredentials = JSON.parse(secret.SecretString);

    cachedPool = new Pool({
      host: creds.host,
      user: creds.username,
      password: creds.password,
      database: creds.dbname,
      port: Number(creds.port) || 5432,
      ssl: { rejectUnauthorized: false },
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('PostgreSQL connection pool created');
    return cachedPool;

  } catch (error) {
    console.error('Failed to create PostgreSQL connection pool:', error);
    throw error;
  }
}

/**
 * Extract user ID from JWT token (simplified)
 */
function extractUserIdFromToken(authHeader: string): string {
  // In production, properly validate and decode JWT
  // For now, return a placeholder
  return 'current-user-id';
}

/**
 * Get uploads for a user
 */
async function getUploads(
  userId: string,
  filters: any = {},
  page: number = 1,
  pageSize: number = 20
): Promise<{
  uploads: UploadRecord[];
  totalCount: number;
  stats: any;
}> {
  const pool = await getPgPool();
  
  let whereClause = 'WHERE user_id = $1';
  const params: any[] = [userId];
  let paramIndex = 2;

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    whereClause += ` AND status = ANY($${paramIndex})`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.uploadType && filters.uploadType.length > 0) {
    whereClause += ` AND upload_type = ANY($${paramIndex})`;
    params.push(filters.uploadType);
    paramIndex++;
  }

  if (filters.search) {
    whereClause += ` AND (filename ILIKE $${paramIndex} OR original_filename ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.startDate && filters.endDate) {
    whereClause += ` AND uploaded_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(filters.startDate, filters.endDate);
    paramIndex += 2;
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM user_uploads ${whereClause}`;
  const countResult = await pool.query(countQuery, params);
  const totalCount = parseInt(countResult.rows[0].total);

  // Get paginated uploads
  const offset = (page - 1) * pageSize;
  const uploadsQuery = `
    SELECT 
      id, filename, original_filename, s3_url, s3_bucket, s3_key,
      content_type, file_size, upload_type, 
      CASE 
        WHEN uploaded_at IS NULL THEN 'pending'
        WHEN metadata->>'processing' = 'true' THEN 'processing'
        WHEN metadata->>'error' IS NOT NULL THEN 'failed'
        WHEN metadata->>'corrupted' = 'true' THEN 'corrupted'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'expired'
        ELSE 'completed'
      END as status,
      uploaded_at, expires_at, metadata, is_public, partner_id, user_id
    FROM user_uploads 
    ${whereClause}
    ORDER BY uploaded_at DESC NULLS LAST
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  params.push(pageSize, offset);
  const uploadsResult = await pool.query(uploadsQuery, params);

  // Get stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_uploads,
      COUNT(CASE WHEN uploaded_at IS NOT NULL AND metadata->>'error' IS NULL THEN 1 END) as successful_uploads,
      COUNT(CASE WHEN metadata->>'error' IS NOT NULL THEN 1 END) as failed_uploads,
      SUM(file_size) as total_size,
      AVG(file_size) as average_file_size,
      COUNT(CASE WHEN uploaded_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month
    FROM user_uploads 
    WHERE user_id = $1
  `;
  
  const statsResult = await pool.query(statsQuery, [userId]);
  const statsRow = statsResult.rows[0];
  
  const stats = {
    totalUploads: parseInt(statsRow.total_uploads) || 0,
    successfulUploads: parseInt(statsRow.successful_uploads) || 0,
    failedUploads: parseInt(statsRow.failed_uploads) || 0,
    totalSize: parseInt(statsRow.total_size) || 0,
    averageFileSize: parseFloat(statsRow.average_file_size) || 0,
    thisMonth: parseInt(statsRow.this_month) || 0,
    successRate: 0,
    failureRate: 0,
    monthlyGrowth: 0, // Would need historical data
  };

  if (stats.totalUploads > 0) {
    stats.successRate = (stats.successfulUploads / stats.totalUploads) * 100;
    stats.failureRate = (stats.failedUploads / stats.totalUploads) * 100;
  }

  return {
    uploads: uploadsResult.rows,
    totalCount,
    stats,
  };
}

/**
 * Delete an upload
 */
async function deleteUpload(userId: string, uploadId: string): Promise<void> {
  const pool = await getPgPool();
  
  // Get upload details first
  const getQuery = 'SELECT s3_bucket, s3_key FROM user_uploads WHERE id = $1 AND user_id = $2';
  const getResult = await pool.query(getQuery, [uploadId, userId]);
  
  if (getResult.rows.length === 0) {
    throw new Error('Upload not found or access denied');
  }
  
  const upload = getResult.rows[0];
  
  // Delete from S3
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: upload.s3_bucket,
      Key: upload.s3_key,
    });
    await s3Client.send(deleteCommand);
  } catch (error) {
    console.error('Failed to delete from S3:', error);
    // Continue with database deletion even if S3 deletion fails
  }
  
  // Delete from database
  const deleteQuery = 'DELETE FROM user_uploads WHERE id = $1 AND user_id = $2';
  await pool.query(deleteQuery, [uploadId, userId]);
}

/**
 * Get upload analytics
 */
async function getUploadAnalytics(userId: string, timeRange: string): Promise<any> {
  const pool = await getPgPool();
  
  // Calculate date range
  let dateFilter = '';
  switch (timeRange) {
    case '7d':
      dateFilter = "AND uploaded_at >= NOW() - INTERVAL '7 days'";
      break;
    case '30d':
      dateFilter = "AND uploaded_at >= NOW() - INTERVAL '30 days'";
      break;
    case '90d':
      dateFilter = "AND uploaded_at >= NOW() - INTERVAL '90 days'";
      break;
    case '1y':
      dateFilter = "AND uploaded_at >= NOW() - INTERVAL '1 year'";
      break;
    default:
      dateFilter = "AND uploaded_at >= NOW() - INTERVAL '30 days'";
  }

  // Upload trends
  const trendsQuery = `
    SELECT 
      DATE(uploaded_at) as date,
      COUNT(*) as uploads,
      COUNT(CASE WHEN metadata->>'error' IS NULL THEN 1 END) as successful,
      COUNT(CASE WHEN metadata->>'error' IS NOT NULL THEN 1 END) as failed,
      SUM(file_size) as total_size
    FROM user_uploads 
    WHERE user_id = $1 ${dateFilter}
    GROUP BY DATE(uploaded_at)
    ORDER BY date
  `;
  
  const trendsResult = await pool.query(trendsQuery, [userId]);

  // File type distribution
  const typeQuery = `
    SELECT 
      CASE 
        WHEN content_type LIKE 'image/%' THEN 'Images'
        WHEN content_type = 'application/pdf' THEN 'PDFs'
        WHEN content_type LIKE 'text/%' THEN 'Text Files'
        ELSE 'Other'
      END as type,
      COUNT(*) as count,
      SUM(file_size) as size
    FROM user_uploads 
    WHERE user_id = $1 ${dateFilter}
    GROUP BY type
  `;
  
  const typeResult = await pool.query(typeQuery, [userId]);
  const totalFiles = typeResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
  
  const fileTypeDistribution = typeResult.rows.map((row, index) => ({
    type: row.type,
    count: parseInt(row.count),
    size: parseInt(row.size),
    percentage: totalFiles > 0 ? (parseInt(row.count) / totalFiles) * 100 : 0,
    color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4],
  }));

  // Status distribution
  const statusQuery = `
    SELECT 
      CASE 
        WHEN uploaded_at IS NULL THEN 'pending'
        WHEN metadata->>'processing' = 'true' THEN 'processing'
        WHEN metadata->>'error' IS NOT NULL THEN 'failed'
        WHEN metadata->>'corrupted' = 'true' THEN 'corrupted'
        WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'expired'
        ELSE 'completed'
      END as status,
      COUNT(*) as count
    FROM user_uploads 
    WHERE user_id = $1 ${dateFilter}
    GROUP BY status
  `;
  
  const statusResult = await pool.query(statusQuery, [userId]);
  const totalStatuses = statusResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
  
  const statusDistribution = statusResult.rows.map(row => ({
    status: row.status,
    count: parseInt(row.count),
    percentage: totalStatuses > 0 ? (parseInt(row.count) / totalStatuses) * 100 : 0,
    color: row.status === 'completed' ? '#00C49F' : row.status === 'failed' ? '#FF8042' : '#FFBB28',
  }));

  // Performance metrics
  const performanceQuery = `
    SELECT 
      AVG(CASE WHEN metadata->>'upload_duration' IS NOT NULL THEN (metadata->>'upload_duration')::int END) as avg_upload_time,
      COUNT(CASE WHEN metadata->>'error' IS NULL THEN 1 END)::float / COUNT(*) * 100 as success_rate,
      COUNT(CASE WHEN metadata->>'integrity_verified' = 'true' THEN 1 END)::float / COUNT(*) * 100 as integrity_rate
    FROM user_uploads 
    WHERE user_id = $1 ${dateFilter}
  `;
  
  const performanceResult = await pool.query(performanceQuery, [userId]);
  const perfRow = performanceResult.rows[0];
  
  const performanceMetrics = {
    averageUploadTime: parseFloat(perfRow.avg_upload_time) || 0,
    successRate: parseFloat(perfRow.success_rate) || 0,
    failureRate: 100 - (parseFloat(perfRow.success_rate) || 0),
    retryRate: 0, // Would need retry tracking
    integrityCheckRate: parseFloat(perfRow.integrity_rate) || 0,
  };

  // Storage usage
  const storageQuery = `
    SELECT 
      SUM(file_size) as total_used,
      CASE 
        WHEN content_type LIKE 'image/%' THEN 'Images'
        WHEN content_type = 'application/pdf' THEN 'PDFs'
        WHEN content_type LIKE 'text/%' THEN 'Text Files'
        ELSE 'Other'
      END as type,
      SUM(file_size) as type_size
    FROM user_uploads 
    WHERE user_id = $1 ${dateFilter}
    GROUP BY ROLLUP(type)
  `;
  
  const storageResult = await pool.query(storageQuery, [userId]);
  const totalUsed = parseInt(storageResult.rows.find(row => row.type === null)?.total_used) || 0;
  const totalQuota = 10 * 1024 * 1024 * 1024; // 10GB default quota
  
  const byType = storageResult.rows
    .filter(row => row.type !== null)
    .map(row => ({
      type: row.type,
      size: parseInt(row.type_size),
      percentage: totalUsed > 0 ? (parseInt(row.type_size) / totalUsed) * 100 : 0,
    }));

  // Top errors
  const errorsQuery = `
    SELECT 
      metadata->>'error' as error,
      COUNT(*) as count
    FROM user_uploads 
    WHERE user_id = $1 ${dateFilter} AND metadata->>'error' IS NOT NULL
    GROUP BY metadata->>'error'
    ORDER BY count DESC
    LIMIT 10
  `;
  
  const errorsResult = await pool.query(errorsQuery, [userId]);
  const totalErrors = errorsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
  
  const topErrors = errorsResult.rows.map(row => ({
    error: row.error,
    count: parseInt(row.count),
    percentage: totalErrors > 0 ? (parseInt(row.count) / totalErrors) * 100 : 0,
  }));

  return {
    uploadTrends: trendsResult.rows.map(row => ({
      date: row.date,
      uploads: parseInt(row.uploads),
      successful: parseInt(row.successful),
      failed: parseInt(row.failed),
      totalSize: parseInt(row.total_size),
    })),
    fileTypeDistribution,
    statusDistribution,
    performanceMetrics,
    storageUsage: {
      totalUsed,
      totalQuota,
      byType,
    },
    topErrors,
  };
}

/**
 * Export analytics data
 */
async function exportAnalyticsData(
  userId: string,
  format: 'csv' | 'pdf',
  timeRange: string
): Promise<Buffer> {
  const analyticsData = await getUploadAnalytics(userId, timeRange);
  
  if (format === 'csv') {
    // Create CSV export
    const csvData = [
      ['Date', 'Total Uploads', 'Successful', 'Failed', 'Total Size (bytes)'],
      ...analyticsData.uploadTrends.map((trend: any) => [
        trend.date,
        trend.uploads,
        trend.successful,
        trend.failed,
        trend.totalSize,
      ]),
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    return Buffer.from(csvContent, 'utf8');
    
  } else {
    // Create PDF export
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // Add content to PDF
    doc.fontSize(20).text('Upload Analytics Report', 50, 50);
    doc.fontSize(12).text(`Time Range: ${timeRange}`, 50, 80);
    doc.text(`Generated: ${new Date().toISOString()}`, 50, 100);
    
    // Performance metrics
    doc.fontSize(16).text('Performance Metrics', 50, 140);
    doc.fontSize(12)
      .text(`Success Rate: ${analyticsData.performanceMetrics.successRate.toFixed(1)}%`, 50, 170)
      .text(`Average Upload Time: ${(analyticsData.performanceMetrics.averageUploadTime / 1000).toFixed(1)}s`, 50, 190)
      .text(`Integrity Check Rate: ${analyticsData.performanceMetrics.integrityCheckRate.toFixed(1)}%`, 50, 210);
    
    // Storage usage
    doc.fontSize(16).text('Storage Usage', 50, 250);
    doc.fontSize(12)
      .text(`Total Used: ${(analyticsData.storageUsage.totalUsed / (1024 * 1024)).toFixed(1)} MB`, 50, 280)
      .text(`Quota: ${(analyticsData.storageUsage.totalQuota / (1024 * 1024 * 1024)).toFixed(1)} GB`, 50, 300);
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Upload Management API invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

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

    // Extract user ID from authorization header
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    const userId = extractUserIdFromToken(authHeader);

    // Route requests
    if (path === '/uploads' && httpMethod === 'GET') {
      const filters = {
        status: queryStringParameters?.status?.split(','),
        uploadType: queryStringParameters?.uploadType?.split(','),
        search: queryStringParameters?.search,
        startDate: queryStringParameters?.startDate,
        endDate: queryStringParameters?.endDate,
      };
      
      const page = parseInt(queryStringParameters?.page || '1');
      const pageSize = parseInt(queryStringParameters?.pageSize || '20');
      
      const result = await getUploads(userId, filters, page, pageSize);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    }

    if (path.startsWith('/uploads/') && httpMethod === 'DELETE') {
      const uploadId = pathParameters?.uploadId;
      if (!uploadId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Upload ID is required' }),
        };
      }

      await deleteUpload(userId, uploadId);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true }),
      };
    }

    if (path === '/uploads/analytics' && httpMethod === 'GET') {
      const timeRange = queryStringParameters?.timeRange || '30d';
      const analyticsData = await getUploadAnalytics(userId, timeRange);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(analyticsData),
      };
    }

    if (path === '/uploads/analytics/export' && httpMethod === 'POST') {
      if (!body) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Request body is required' }),
        };
      }

      const { format, timeRange } = JSON.parse(body);
      const exportData = await exportAnalyticsData(userId, format, timeRange);
      
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': format === 'csv' ? 'text/csv' : 'application/pdf',
          'Content-Disposition': `attachment; filename="upload-analytics-${timeRange}.${format}"`,
        },
        body: exportData.toString('base64'),
        isBase64Encoded: true,
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
};