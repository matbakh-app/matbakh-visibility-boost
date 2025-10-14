/**
 * S3 Upload Monitoring and Metrics
 * 
 * This module provides monitoring capabilities for S3 upload operations,
 * including custom CloudWatch metrics and error tracking.
 */

// Note: CloudWatch client removed - using server-side metrics endpoint instead
import { sendMetrics, flushQueue } from '@/lib/monitoring-transport';

// Helper function to safely get environment variables
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Try import.meta.env first (Vite)
  if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
    return (window as any).import.meta.env[key] || defaultValue;
  }
  
  // Try global import.meta.env (Jest mock)
  if (typeof globalThis !== 'undefined' && (globalThis as any).import?.meta?.env) {
    return (globalThis as any).import.meta.env[key] || defaultValue;
  }
  
  // Fallback to process.env
  return process.env[key] || defaultValue;
}

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

import { viteEnv } from './env';

/**
 * Publishes a custom metric via server-side endpoint
 */
export async function publishMetric(data: MetricData): Promise<void> {
  try {
    // Only publish metrics in production or when explicitly enabled
    const enableMetrics = process.env.NODE_ENV === 'production' || 
                         getEnvVar('VITE_ENABLE_METRICS', 'false') === 'true' ||
                         process.env.VITE_ENABLE_METRICS === 'true';
    if (!enableMetrics) {
      console.log('Metrics disabled in development:', data);
      return;
    }

    // Use server-side metrics endpoint instead of direct CloudWatch calls
    const metricsEndpoint = getEnvVar('VITE_METRICS_ENDPOINT', 'https://api.matbakh.app/metrics');
    
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
    const endpoint = getEnvVar('VITE_METRICS_ENDPOINT', 'https://api.matbakh.app/metrics');
    await sendMetrics({ metrics: batch.map(m => ({ ...m, ns: 'Matbakh/Perf' })) }, endpoint);
    flushQueue(endpoint);
  }

  private startAutoFlush(): void {
    // Skip timer in test environment to prevent Jest open handles
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) return;
    
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

// --- NEW: robuste Größenerkennung -------------------------------------------

type SizeExtractor<T extends any[], R> = (args: T, result?: R) => number | undefined | null;

/**
 * Versucht, die Dateigröße (Bytes) aus Args/Result zu bestimmen.
 * Deckt typische Fälle ab: File/Blob, Buffer/ArrayBuffer, base64, Request/Response, S3-SDK-Result etc.
 */
export function inferFileSizeBytes(args: any[], result?: any): number | undefined {
  // 1) Direkter File/Blob in den Args
  for (const a of args) {
    if (a && typeof a === 'object') {
      // Browser: File/Blob
      if (typeof (a as any).size === 'number' && (a instanceof Blob || a instanceof File || a.type || a.name)) {
        return (a as any).size;
      }
      // Node: Buffer
      if (typeof (a as any).length === 'number' && Buffer.isBuffer?.(a)) {
        return (a as Buffer).length;
      }
      // ArrayBuffer
      if ((a as ArrayBuffer)?.byteLength) {
        return (a as ArrayBuffer).byteLength;
      }
      // Options-Objekt mit expliziter Größe
      if (typeof (a as any).fileSizeBytes === 'number') {
        return (a as any).fileSizeBytes;
      }
      // Request/Fetch Body mit Content-Length Header
      if ((a as Request)?.headers?.get?.('content-length')) {
        const v = Number((a as Request).headers.get('content-length'));
        if (Number.isFinite(v)) return v;
      }
      // S3 PutObjectCommandInput: Body kann Buffer/Uint8Array/stream sein
      if ((a as any).Body) {
        const body = (a as any).Body;
        if (typeof body?.length === 'number') return body.length;             // Buffer / Uint8Array
        if (body?.byteLength) return body.byteLength;                          // ArrayBuffer
        if (typeof body?.size === 'number') return body.size;                  // Blob
        // Streams haben selten Länge – dann fällt es unten auf "unknown"
      }
    }
  }

  // 2) Ergebnis-Objekte tragen manchmal Größe (custom)
  if (result && typeof result === 'object') {
    if (typeof (result as any).uploadedSize === 'number') {
      return (result as any).uploadedSize;
    }
    if (typeof (result as any).size === 'number') {
      return (result as any).size;
    }
    // S3 ManagedUpload: kein Size-Feld – ggf. aus Input ermittelt
  }

  // 3) Fallback: Content-Length Header einer Response (nur wenn direkt hochgeladen wurde)
  if ((result as Response)?.headers?.get?.('content-length')) {
    const v = Number((result as Response).headers.get('content-length'));
    if (Number.isFinite(v)) return v;
  }

  return undefined; // unbekannt
}

// --- UPDATED: Decorator mit Size-Extractor & korrektem recordUploadSuccess ---

/**
 * Dekoriert eine Upload-Funktion und misst Dauer/Erfolg + korrekte Dateigröße.
 * - Extrahiert Größe automatisch (siehe inferFileSizeBytes)
 * - Optional: custom sizeExtractor für Spezialfälle
 */
export function monitorUploadPerformance<T extends any[], R>(
  bucket: BucketType,
  uploadType: UploadType,
  fn: (...args: T) => Promise<R>,
  opts?: {
    sizeExtractor?: SizeExtractor<T, R>;
    onMeasuredSizeBytes?: (bytes: number | undefined) => void; // optional callback
  }
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let sizeBytes: number | undefined;

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      // Reihenfolge: custom extractor > auto inference
      sizeBytes =
        (opts?.sizeExtractor && opts.sizeExtractor(args, result)) ??
        inferFileSizeBytes(args, result);

      // optional callback (z.B. UI-Telemetry)
      opts?.onMeasuredSizeBytes?.(sizeBytes);

      await recordUploadSuccess(
        bucket,
        uploadType,
        typeof sizeBytes === 'number' && Number.isFinite(sizeBytes) ? sizeBytes : 0,
        duration
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Beim Fehler lohnt es sich trotzdem, Größe zu protokollieren, falls ableitbar
      try {
        sizeBytes = (opts?.sizeExtractor && opts.sizeExtractor(args)) ?? inferFileSizeBytes(args);
        opts?.onMeasuredSizeBytes?.(sizeBytes);
      } catch { /* ignore size errors */ }

      let errorType: ErrorType = 'unknown_error';
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('validation')) errorType = 'validation_error';
        else if (msg.includes('network') || msg.includes('fetch')) errorType = 'network_error';
        else if (msg.includes('permission') || msg.includes('403')) errorType = 'permission_error';
        else if (msg.includes('quota') || msg.includes('limit')) errorType = 'quota_error';
        else if (msg.includes('500') || msg.includes('server')) errorType = 'server_error';
      }

      await recordUploadFailure(bucket, uploadType, errorType, error instanceof Error ? error.message : String(error));

      // Metric für „Attempted Size" - auch bei Fehlern die geplante Größe erfassen
      if (typeof sizeBytes === 'number' && Number.isFinite(sizeBytes)) {
        await publishMetric({
          metricName: 'UploadAttemptSize',
          value: sizeBytes,
          unit: 'Bytes',
          dimensions: { Bucket: bucket, UploadType: uploadType },
        });
      }

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
  
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const endpoint = getEnvVar('VITE_METRICS_ENDPOINT', 'https://api.matbakh.app/metrics');
      flushQueue(endpoint);
    }
  });
}