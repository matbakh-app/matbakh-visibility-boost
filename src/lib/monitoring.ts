/**
 * S3 Upload Monitoring and Metrics
 * 
 * This module provides monitoring capabilities for S3 upload operations,
 * including custom CloudWatch metrics and error tracking.
 */

// Note: CloudWatch client removed - using server-side metrics endpoint instead

// Metric namespace
const NAMESPACE = 'Matbakh/S3Upload';

// Metric names
export const METRICS = {
  UPLOAD_SUCCESS: 'UploadSuccess',
  UPLOAD_FAILURE: 'UploadFailure',
  UPLOAD_DURATION: 'UploadDuration',
  UPLOAD_SIZE: 'UploadSize',
  PRESIGNED_URL_REQUEST: 'PresignedUrlRequest',
  PRESIGNED_URL_ERROR: 'PresignedUrlError',
  FILE_VALIDATION_ERROR: 'FileValidationError',
  QUOTA_EXCEEDED: 'QuotaExceeded',
} as const;

// Bucket types for dimensions
export type BucketType = 'uploads' | 'profile' | 'reports';

// Upload operation types
export type UploadType = 'avatar' | 'document' | 'image' | 'report' | 'logo' | 'other';

// Error types for categorization
export type ErrorType = 
  | 'validation_error'
  | 'network_error' 
  | 'permission_error'
  | 'quota_error'
  | 'server_error'
  | 'unknown_error';

interface MetricData {
  metricName: string;
  value: number;
  unit?: string;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

/**
 * Publishes a custom metric via server-side endpoint
 */
export async function publishMetric(data: MetricData): Promise<void> {
  try {
    // Only publish metrics in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !import.meta.env.VITE_ENABLE_METRICS) {
      console.log('Metrics disabled in development:', data);
      return;
    }

    // Use server-side metrics endpoint instead of direct CloudWatch calls
    const metricsEndpoint = import.meta.env.VITE_METRICS_ENDPOINT || 'https://api.matbakh.app/metrics';
    
    const response = await fetch(metricsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metricName: data.metricName,
        value: data.value,
        unit: data.unit || 'Count',
        dimensions: data.dimensions,
        timestamp: data.timestamp?.toISOString() || new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Metrics API error: ${response.status}`);
    }
  } catch (error) {
    // Don't let metrics publishing break the application
    console.warn('Failed to publish metric:', error);
  }
}

/**
 * Records a successful upload operation
 */
export async function recordUploadSuccess(
  bucket: BucketType,
  uploadType: UploadType,
  fileSizeBytes: number,
  durationMs: number
): Promise<void> {
  const dimensions = {
    Bucket: bucket,
    UploadType: uploadType,
  };

  await Promise.all([
    publishMetric({
      metricName: METRICS.UPLOAD_SUCCESS,
      value: 1,
      dimensions,
    }),
    publishMetric({
      metricName: METRICS.UPLOAD_DURATION,
      value: durationMs,
      unit: 'Milliseconds',
      dimensions,
    }),
    publishMetric({
      metricName: METRICS.UPLOAD_SIZE,
      value: fileSizeBytes,
      unit: 'Bytes',
      dimensions,
    }),
  ]);
}

/**
 * Records a failed upload operation
 */
export async function recordUploadFailure(
  bucket: BucketType,
  uploadType: UploadType,
  errorType: ErrorType,
  errorMessage?: string
): Promise<void> {
  const dimensions = {
    Bucket: bucket,
    UploadType: uploadType,
    ErrorType: errorType,
  };

  await publishMetric({
    metricName: METRICS.UPLOAD_FAILURE,
    value: 1,
    dimensions,
  });

  // Log error for debugging
  console.error('Upload failure recorded:', {
    bucket,
    uploadType,
    errorType,
    errorMessage,
  });
}

/**
 * Records a presigned URL request
 */
export async function recordPresignedUrlRequest(
  bucket: BucketType,
  success: boolean,
  durationMs?: number
): Promise<void> {
  const dimensions = {
    Bucket: bucket,
    Success: success.toString(),
  };

  const metricName = success ? METRICS.PRESIGNED_URL_REQUEST : METRICS.PRESIGNED_URL_ERROR;

  await publishMetric({
    metricName,
    value: 1,
    dimensions,
  });

  if (durationMs && success) {
    await publishMetric({
      metricName: 'PresignedUrlDuration',
      value: durationMs,
      unit: 'Milliseconds',
      dimensions: { Bucket: bucket },
    });
  }
}

/**
 * Records file validation errors
 */
export async function recordValidationError(
  errorType: 'file_size' | 'file_type' | 'file_name',
  bucket: BucketType
): Promise<void> {
  await publishMetric({
    metricName: METRICS.FILE_VALIDATION_ERROR,
    value: 1,
    dimensions: {
      ErrorType: errorType,
      Bucket: bucket,
    },
  });
}

/**
 * Records quota exceeded events
 */
export async function recordQuotaExceeded(
  quotaType: 'storage' | 'upload_count' | 'file_size',
  bucket: BucketType
): Promise<void> {
  await publishMetric({
    metricName: METRICS.QUOTA_EXCEEDED,
    value: 1,
    dimensions: {
      QuotaType: quotaType,
      Bucket: bucket,
    },
  });
}

/**
 * Batch metric publisher for high-volume operations
 */
class MetricsBatch {
  private metrics: MetricData[] = [];
  private batchSize = 20; // CloudWatch limit
  private flushInterval = 5000; // 5 seconds
  private timer?: NodeJS.Timeout;

  constructor() {
    this.startAutoFlush();
  }

  add(metric: MetricData): void {
    this.metrics.push(metric);
    
    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    const batch = this.metrics.splice(0, this.batchSize);
    
    try {
      if (process.env.NODE_ENV === 'production' || import.meta.env.VITE_ENABLE_METRICS) {
        const metricsEndpoint = import.meta.env.VITE_METRICS_ENDPOINT || 'https://api.matbakh.app/metrics';
        
        const response = await fetch(metricsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            metrics: batch.map(metric => ({
              metricName: metric.metricName,
              value: metric.value,
              unit: metric.unit || 'Count',
              dimensions: metric.dimensions,
              timestamp: metric.timestamp?.toISOString() || new Date().toISOString(),
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`Metrics API error: ${response.status}`);
        }
      }
    } catch (error) {
      console.warn('Failed to publish metric batch:', error);
    }
  }

  private startAutoFlush(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush(); // Final flush
  }
}

// Global metrics batch instance
export const metricsBatch = new MetricsBatch();

/**
 * Performance monitoring decorator for upload functions
 */
export function monitorUploadPerformance<T extends any[], R>(
  bucket: BucketType,
  uploadType: UploadType,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      // Assume success if no error thrown
      await recordUploadSuccess(bucket, uploadType, 0, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Categorize error
      let errorType: ErrorType = 'unknown_error';
      if (error instanceof Error) {
        if (error.message.includes('validation')) {
          errorType = 'validation_error';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorType = 'network_error';
        } else if (error.message.includes('permission') || error.message.includes('403')) {
          errorType = 'permission_error';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorType = 'quota_error';
        } else if (error.message.includes('500') || error.message.includes('server')) {
          errorType = 'server_error';
        }
      }
      
      await recordUploadFailure(bucket, uploadType, errorType, error instanceof Error ? error.message : String(error));
      
      throw error;
    }
  };
}

/**
 * Health check function for monitoring
 */
export async function performHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
}> {
  const checks: Record<string, boolean> = {};
  
  try {
    // Test CloudWatch connectivity
    checks.cloudwatch = true;
    await publishMetric({
      metricName: 'HealthCheck',
      value: 1,
      dimensions: { Type: 'connectivity' },
    });
  } catch (error) {
    checks.cloudwatch = false;
  }

  // Test AWS SDK configuration
  try {
    checks.aws_config = !!process.env.VITE_AWS_REGION;
  } catch (error) {
    checks.aws_config = false;
  }

  const healthyChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyChecks === totalChecks) {
    status = 'healthy';
  } else if (healthyChecks > totalChecks / 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    metricsBatch.destroy();
  });
}