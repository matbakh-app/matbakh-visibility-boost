import { APIGatewayProxyResult } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  BenchmarkingRequest,
  BenchmarkingResponse,
  BenchmarkingRequestSchema,
  CompetitorDiscoveryConfig,
  ScrapingConfig,
  AnalysisConfig,
  CompetitiveBenchmarkingEvent,
  CompetitiveBenchmarkingContext
} from './types';
import {
  NoCompetitorsError,
  InvalidPayloadError,
  EngineFailureError,
  ConfigurationError
} from './errors';
import { CompetitorDiscoveryEngine } from './competitor-discovery-engine';
import { PlatformDataCollector } from './platform-data-collector';
import { CompetitiveAnalysisEngine } from './competitive-analysis-engine';

// Initialize AWS clients
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-central-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-central-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const SECRETS_ARN = process.env.SECRETS_ARN || '';
const RESULTS_TABLE = process.env.RESULTS_TABLE || 'competitive-benchmarking-results';
const CACHE_TABLE = process.env.CACHE_TABLE || 'competitive-benchmarking-cache';

/**
 * Main Lambda handler for competitive benchmarking
 */
export const handler = async (
  event: CompetitiveBenchmarkingEvent,
  _context: CompetitiveBenchmarkingContext
): Promise<APIGatewayProxyResult> => {
  console.log('[DEBUG] 🟡 Handler start reached.');
  console.log('Competitive benchmarking request received:', JSON.stringify(event, null, 2));

  const startTime = Date.now();
  let discoveryEngine: CompetitorDiscoveryEngine | null = null;
  let dataCollector: PlatformDataCollector | null = null;

  try {
    // Parse and validate request
    console.log('DEBUG: About to parse request');
    const request = await parseRequest(event);
    console.log('DEBUG: Request parsed successfully');
    console.log('Parsed request:', JSON.stringify(request, null, 2));

    // Check cache first
    const cacheKey = generateCacheKey(request);
    const cachedResult = await getCachedResult(cacheKey);
    
    if (cachedResult && !request.forceRefresh) {
      console.log('Returning cached result');
      cachedResult.cacheHit = true;
      
      // JTBD: Ensure requestId is always present for traceability
      if (!cachedResult.requestId) {
        cachedResult.requestId = `cached-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      return createSuccessResponse(cachedResult);
    }

    // Get configuration from secrets
    console.log('DEBUG: About to get configuration');
    const config = await getConfiguration();
    console.log('DEBUG: Configuration retrieved successfully');

    // Initialize engines
    console.log('DEBUG: About to initialize engines');
    discoveryEngine = new CompetitorDiscoveryEngine(config.discovery);
    dataCollector = new PlatformDataCollector(config.scraping);
    const analysisEngine = new CompetitiveAnalysisEngine(config.analysis);
    console.log('DEBUG: Engines initialized successfully');

    // Discover competitors
    console.log('Discovering competitors...');
    let competitors;
    try {
      competitors = await discoveryEngine.discoverCompetitors(request);
      console.log(`Found ${competitors.length} competitors`);
    } catch (error) {
      throw new EngineFailureError('Competitor Discovery', error instanceof Error ? error.message : 'Unknown error');
    }

    if (competitors.length === 0) {
      console.log('[DEBUG] ❌ No competitors found — throwing NoCompetitorsError');
      throw new NoCompetitorsError(`${request.address} (radius: ${request.radius}m)`);
    }

    // Collect platform data for each competitor
    console.log('Collecting platform data...');
    const platformData = new Map();
    
    for (const competitor of competitors) {
      try {
        const platforms = await dataCollector.collectPlatformData(competitor, request.platforms);
        platformData.set(competitor.id, platforms);
      } catch (error) {
        console.error(`Failed to collect platform data for ${competitor.name}:`, error);
        // Continue with other competitors
        platformData.set(competitor.id, []);
      }
    }

    // Analyze competitors and generate insights
    console.log('Analyzing competitors...');
    let analysis;
    try {
      analysis = await analysisEngine.analyzeBenchmarking(request, competitors, platformData);
      
      // JTBD: Ensure requestId is always present for traceability
      if (!analysis.requestId) {
        analysis.requestId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    } catch (error) {
      throw new EngineFailureError('Competitive Analysis', error instanceof Error ? error.message : 'Unknown error');
    }

    // Cache the result
    await cacheResult(cacheKey, analysis);

    // Store result in database
    await storeResult(analysis);

    const processingTime = Date.now() - startTime;
    console.log(`Competitive benchmarking completed in ${processingTime}ms`);

    return createSuccessResponse(analysis);

  } catch (error) {
    console.error('[ERROR] ❌ Uncaught error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // JTBD: Clear error differentiation for reliable job completion
    // Defensive error handling - robust against Jest context problems
    if (error && typeof error === 'object') {
      const err = error as any;
      const name = err.name || err.constructor?.name || 'Error';
      
      console.log('[DEBUG] Error name detected:', name);
      console.log('[DEBUG] Error message:', err.message);
      console.log('[DEBUG] Error statusCode:', err.statusCode);
      
      switch (name) {
        case 'NoCompetitorsError':
        case 'InvalidPayloadError':
          return createErrorResponse(400, err.message || 'Bad request');
        case 'EngineFailureError':
        case 'BenchmarkingError':
        case 'ConfigurationError':
          return createErrorResponse(err.statusCode || 500, err.message || 'Internal server error');
      }
    }
    
    // Fallback for unexpected errors
    console.error('[ERROR] ❌ Unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error occurred';
    return createErrorResponse(500, errorMessage);

  } finally {
    // Cleanup resources
    if (dataCollector) {
      try {
        await dataCollector.cleanup();
      } catch (error) {
        console.error('Failed to cleanup data collector:', error);
      }
    }
  }
};

/**
 * Parse and validate the incoming request
 */
async function parseRequest(event: CompetitiveBenchmarkingEvent): Promise<BenchmarkingRequest> {
  console.log('[DEBUG] 📥 Raw event:', JSON.stringify(event));
  try {
    let requestData: any;

    if (event.httpMethod === 'GET') {
      // Handle GET request with query parameters
      requestData = event.queryStringParameters || {};
      
      // Convert string parameters to appropriate types
      if (requestData.coordinates) {
        const [lat, lng] = requestData.coordinates.split(',').map(Number);
        requestData.coordinates = { lat, lng };
      }
      
      if (requestData.radius) {
        requestData.radius = parseInt(requestData.radius);
      }
      
      if (requestData.maxCompetitors) {
        requestData.maxCompetitors = parseInt(requestData.maxCompetitors);
      }
      
      if (requestData.platforms) {
        requestData.platforms = requestData.platforms.split(',');
      }
      
      if (requestData.includeInactive) {
        requestData.includeInactive = requestData.includeInactive === 'true';
      }
      
      if (requestData.forceRefresh) {
        requestData.forceRefresh = requestData.forceRefresh === 'true';
      }
      
      if (requestData.frameworks) {
        requestData.frameworks = requestData.frameworks.split(',');
      }
      
      if (requestData.culturalContext) {
        try {
          requestData.culturalContext = JSON.parse(requestData.culturalContext);
        } catch (error) {
          // Ignore parsing errors for cultural context
        }
      }

    } else if (event.httpMethod === 'POST') {
      // Handle POST request with JSON body
      if (!event.body) {
        throw new Error('Request body is required for POST requests');
      }
      
      requestData = JSON.parse(event.body);
    } else {
      throw new Error(`Unsupported HTTP method: ${event.httpMethod}`);
    }

    // Validate request using Zod schema
    const validatedRequest = BenchmarkingRequestSchema.parse(requestData);
    return validatedRequest;

  } catch (error) {
    console.error('Request parsing failed:', error);
    throw new InvalidPayloadError(error instanceof Error ? error.message : 'Unknown parsing error');
  }
}

/**
 * Get configuration from AWS Secrets Manager
 */
async function getConfiguration(): Promise<{
  discovery: CompetitorDiscoveryConfig;
  scraping: ScrapingConfig;
  analysis: AnalysisConfig;
}> {
  try {
    const command = new GetSecretValueCommand({ SecretId: SECRETS_ARN });
    const response = await secretsClient.send(command);
    
    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }
    
    const secrets = JSON.parse(response.SecretString);
    
    return {
      discovery: {
        googleMapsApiKey: secrets.GOOGLE_MAPS_API_KEY || '',
        maxRetries: 3,
        retryDelay: 1000,
        requestTimeout: 10000,
        rateLimitDelay: 100,
        cacheEnabled: true,
        cacheTtl: 3600
      },
      scraping: {
        userAgent: 'Mozilla/5.0 (compatible; CompetitiveBenchmarking/1.0)',
        requestTimeout: 15000,
        maxConcurrentRequests: 5,
        retryAttempts: 2,
        retryDelay: 2000,
        respectRobotsTxt: true,
        enableJavaScript: true,
        headless: true
      },
      analysis: {
        weightings: {
          google: 0.4,
          social: 0.3,
          reviews: 0.2,
          photos: 0.1
        },
        thresholds: {
          highVisibility: 70,
          mediumVisibility: 50,
          lowVisibility: 30
        },
        sentimentAnalysis: false, // Disabled for now
        keywordExtraction: false, // Disabled for now
        trendAnalysis: false // Disabled for now
      }
    };

  } catch (error) {
    console.error('Failed to get configuration:', error);
    throw new ConfigurationError(error instanceof Error ? error.message : 'Unknown configuration error');
  }
}

/**
 * Generate cache key for request
 */
function generateCacheKey(request: BenchmarkingRequest): string {
  const key = `bench_${request.coordinates.lat}_${request.coordinates.lng}_${request.radius}_${request.category}_${request.maxCompetitors}_${request.platforms.join('_')}`;
  return key.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Get cached result from DynamoDB
 */
async function getCachedResult(cacheKey: string): Promise<BenchmarkingResponse | null> {
  try {
    const command = new GetCommand({
      TableName: CACHE_TABLE,
      Key: { cacheKey }
    });
    
    const response = await docClient.send(command);
    
    if (!response.Item) {
      return null;
    }
    
    // Check if cache is still valid (24 hours)
    const cacheTime = new Date(response.Item.createdAt).getTime();
    const now = Date.now();
    const cacheAge = now - cacheTime;
    const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (cacheAge > maxCacheAge) {
      console.log('Cache expired, will fetch fresh data');
      return null;
    }
    
    return response.Item.result as BenchmarkingResponse;

  } catch (error) {
    console.error('Failed to get cached result:', error);
    return null; // Don't fail the request if cache lookup fails
  }
}

/**
 * Cache result in DynamoDB
 */
async function cacheResult(cacheKey: string, result: BenchmarkingResponse): Promise<void> {
  try {
    const command = new PutCommand({
      TableName: CACHE_TABLE,
      Item: {
        cacheKey,
        result,
        createdAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
      }
    });
    
    await docClient.send(command);
    console.log('Result cached successfully');

  } catch (error) {
    console.error('Failed to cache result:', error);
    // Don't fail the request if caching fails
  }
}

/**
 * Store result in DynamoDB for analytics
 */
async function storeResult(result: BenchmarkingResponse): Promise<void> {
  try {
    const command = new PutCommand({
      TableName: RESULTS_TABLE,
      Item: {
        requestId: result.requestId,
        businessId: result.businessId,
        analysisDate: result.analysisDate,
        result,
        createdAt: new Date().toISOString()
      }
    });
    
    await docClient.send(command);
    console.log('Result stored successfully');

  } catch (error) {
    console.error('Failed to store result:', error);
    // Don't fail the request if storage fails
  }
}

// Removed getErrorStatusCode - now using BenchmarkingError classes for proper status mapping

/**
 * Create success response
 */
function createSuccessResponse(data: BenchmarkingResponse): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify(data, null, 2)
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: JSON.stringify({
      error: {
        message,
        statusCode,
        timestamp: new Date().toISOString()
      }
    }, null, 2)
  };
}

/**
 * Health check handler
 */
export const healthCheck = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'healthy',
      service: 'competitive-benchmarking',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    })
  };
};
  