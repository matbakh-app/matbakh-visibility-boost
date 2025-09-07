/**
 * S3 Metrics Publisher Lambda
 * 
 * This Lambda function receives metrics from the frontend and publishes them to CloudWatch.
 * This avoids exposing AWS credentials to the browser.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

// CloudWatch client
const cloudWatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION || 'eu-central-1',
});

// Metric namespace
const NAMESPACE = 'Matbakh/S3Upload';

// Allowed metric names for security
const ALLOWED_METRICS = [
  'UploadSuccess',
  'UploadFailure', 
  'UploadDuration',
  'UploadSize',
  'PresignedUrlRequest',
  'PresignedUrlError',
  'FileValidationError',
  'QuotaExceeded',
] as const;

// Allowed dimension names
const ALLOWED_DIMENSIONS = [
  'Bucket',
  'UploadType',
  'ErrorType',
  'Success',
  'QuotaType',
] as const;

interface MetricRequest {
  metricName: string;
  value: number;
  unit?: string;
  dimensions?: Record<string, string>;
  timestamp?: string;
}

interface MetricBatch {
  metrics: MetricRequest[];
}

/**
 * Validate metric request
 */
function validateMetricRequest(metric: MetricRequest): boolean {
  // Check metric name
  if (!ALLOWED_METRICS.includes(metric.metricName as any)) {
    return false;
  }

  // Check value
  if (typeof metric.value !== 'number' || !isFinite(metric.value)) {
    return false;
  }

  // Check dimensions
  if (metric.dimensions) {
    for (const [key, value] of Object.entries(metric.dimensions)) {
      if (!ALLOWED_DIMENSIONS.includes(key as any)) {
        return false;
      }
      if (typeof value !== 'string' || value.length > 255) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Publish metrics to CloudWatch
 */
async function publishMetrics(metrics: MetricRequest[]): Promise<void> {
  // Validate all metrics first
  for (const metric of metrics) {
    if (!validateMetricRequest(metric)) {
      throw new Error(`Invalid metric: ${JSON.stringify(metric)}`);
    }
  }

  // Convert to CloudWatch format
  const metricData = metrics.map(metric => ({
    MetricName: metric.metricName,
    Value: metric.value,
    Unit: metric.unit || 'Count',
    Dimensions: metric.dimensions ? Object.entries(metric.dimensions).map(([name, value]) => ({
      Name: name,
      Value: value,
    })) : undefined,
    Timestamp: metric.timestamp ? new Date(metric.timestamp) : new Date(),
  }));

  // Publish to CloudWatch (max 20 metrics per request)
  const chunks = [];
  for (let i = 0; i < metricData.length; i += 20) {
    chunks.push(metricData.slice(i, i + 20));
  }

  for (const chunk of chunks) {
    const command = new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: chunk,
    });

    await cloudWatchClient.send(command);
  }
}

/**
 * Lambda handler
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };

  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body required' }),
      };
    }

    let requestData: MetricRequest | MetricBatch;
    try {
      requestData = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON' }),
      };
    }

    // Handle single metric or batch
    let metrics: MetricRequest[];
    if ('metrics' in requestData) {
      // Batch request
      metrics = requestData.metrics;
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid metrics array' }),
        };
      }
    } else {
      // Single metric
      metrics = [requestData as MetricRequest];
    }

    // Limit batch size
    if (metrics.length > 20) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Too many metrics (max 20)' }),
      };
    }

    // Publish metrics
    await publishMetrics(metrics);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        published: metrics.length 
      }),
    };

  } catch (error) {
    console.error('Error publishing metrics:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};