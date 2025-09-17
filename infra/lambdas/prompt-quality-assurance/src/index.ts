import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuditTrailManager } from './audit-trail-manager';
import { QualityScoringEngine } from './quality-scoring-engine';
import { OptimizationRecommendationEngine } from './optimization-recommendation-engine';
import { AutomatedTestingFramework } from './automated-testing-framework';
import {
  QualityAssuranceResponse,
  CreateAuditRecordRequest,
  GetAuditTrailRequest,
  AnalyzeQualityRequest,
  GenerateRecommendationsRequest,
  RunTestSuiteRequest,
  QualityAssuranceError,
  ValidationError
} from './types';

// Initialize components
const DYNAMO_TABLE_NAME = process.env.DYNAMO_TABLE_NAME || 'prompt-quality-assurance';
const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';

const auditTrailManager = new AuditTrailManager(DYNAMO_TABLE_NAME, AWS_REGION);
const qualityScoringEngine = new QualityScoringEngine(AWS_REGION);
const optimizationEngine = new OptimizationRecommendationEngine(auditTrailManager);
const testingFramework = new AutomatedTestingFramework(DYNAMO_TABLE_NAME, AWS_REGION);

/**
 * Main Lambda handler for Prompt Quality Assurance System
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const { httpMethod, path, body } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Route requests based on path and method
    let result: any;
    
    switch (httpMethod) {
      case 'POST':
        result = await handlePostRequest(pathSegments, body);
        break;
      case 'GET':
        result = await handleGetRequest(pathSegments, (event.queryStringParameters as Record<string, string>) || {});
        break;
      case 'PUT':
        result = await handlePutRequest(pathSegments, body);
        break;
      default:
        throw new ValidationError(`Unsupported HTTP method: ${httpMethod}`);
    }

    const response: QualityAssuranceResponse = {
      success: true,
      data: result,
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error processing request:', error);
    
    const errorResponse: QualityAssuranceResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    const statusCode = error instanceof QualityAssuranceError ? error.statusCode : 500;

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify(errorResponse)
    };
  }
};

/**
 * Handle POST requests
 */
async function handlePostRequest(pathSegments: string[], body: string | null): Promise<any> {
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  const requestData = JSON.parse(body);
  const endpoint = pathSegments[0];

  switch (endpoint) {
    case 'audit':
      return await handleAuditOperations(pathSegments.slice(1), requestData, 'POST');
    
    case 'quality':
      return await handleQualityOperations(pathSegments.slice(1), requestData, 'POST');
    
    case 'recommendations':
      return await handleRecommendationOperations(pathSegments.slice(1), requestData, 'POST');
    
    case 'testing':
      return await handleTestingOperations(pathSegments.slice(1), requestData, 'POST');
    
    default:
      throw new ValidationError(`Unknown endpoint: ${endpoint}`);
  }
}

/**
 * Handle GET requests
 */
async function handleGetRequest(pathSegments: string[], queryParams: Record<string, string>): Promise<any> {
  const endpoint = pathSegments[0];

  switch (endpoint) {
    case 'audit':
      return await handleAuditOperations(pathSegments.slice(1), queryParams, 'GET');
    
    case 'quality':
      return await handleQualityOperations(pathSegments.slice(1), queryParams, 'GET');
    
    case 'recommendations':
      return await handleRecommendationOperations(pathSegments.slice(1), queryParams, 'GET');
    
    case 'testing':
      return await handleTestingOperations(pathSegments.slice(1), queryParams, 'GET');
    
    case 'health':
      return { status: 'healthy', timestamp: new Date().toISOString() };
    
    default:
      throw new ValidationError(`Unknown endpoint: ${endpoint}`);
  }
}

/**
 * Handle PUT requests
 */
async function handlePutRequest(pathSegments: string[], body: string | null): Promise<any> {
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  const requestData = JSON.parse(body);
  const endpoint = pathSegments[0];

  switch (endpoint) {
    case 'audit':
      return await handleAuditOperations(pathSegments.slice(1), requestData, 'PUT');
    
    default:
      throw new ValidationError(`PUT not supported for endpoint: ${endpoint}`);
  }
}

/**
 * Handle audit trail operations
 */
async function handleAuditOperations(pathSegments: string[], data: any, method: string): Promise<any> {
  const operation = pathSegments[0];

  switch (method) {
    case 'POST':
      if (operation === 'create') {
        const request = data as CreateAuditRecordRequest;
        return await auditTrailManager.createAuditRecord(request);
      }
      break;
    
    case 'GET':
      if (operation === 'trail') {
        const request = data as GetAuditTrailRequest;
        return await auditTrailManager.getAuditTrail(request);
      }
      if (operation === 'record' && pathSegments[1]) {
        return await auditTrailManager.getAuditRecord(pathSegments[1]);
      }
      if (operation === 'stats' && pathSegments[1]) {
        const timeRange = data?.timeRange;
        return await auditTrailManager.getTemplateAuditStats(pathSegments[1], timeRange);
      }
      break;
    
    case 'PUT':
      if (operation === 'feedback' && pathSegments[1]) {
        return await auditTrailManager.addUserFeedback(pathSegments[1], data);
      }
      break;
  }

  throw new ValidationError(`Invalid audit operation: ${method} ${operation}`);
}

/**
 * Handle quality scoring operations
 */
async function handleQualityOperations(pathSegments: string[], data: any, method: string): Promise<any> {
  const operation = pathSegments[0];

  switch (method) {
    case 'POST':
      if (operation === 'analyze') {
        const request = data as AnalyzeQualityRequest;
        return await qualityScoringEngine.analyzeQuality(request);
      }
      if (operation === 'batch') {
        return await qualityScoringEngine.batchAnalyzeQuality(data.executions);
      }
      if (operation === 'feedback') {
        return await qualityScoringEngine.incorporateUserFeedback(data.currentMetrics, data.feedback);
      }
      break;
    
    case 'GET':
      if (operation === 'benchmarks' && pathSegments[1]) {
        const timeRange = data?.timeRange || '30d';
        return await qualityScoringEngine.getQualityBenchmarks(pathSegments[1], timeRange);
      }
      break;
  }

  throw new ValidationError(`Invalid quality operation: ${method} ${operation}`);
}

/**
 * Handle recommendation operations
 */
async function handleRecommendationOperations(pathSegments: string[], data: any, method: string): Promise<any> {
  const operation = pathSegments[0];

  switch (method) {
    case 'POST':
      if (operation === 'generate') {
        const request = data as GenerateRecommendationsRequest;
        return await optimizationEngine.generateRecommendations(request);
      }
      if (operation === 'effectiveness') {
        return await optimizationEngine.trackRecommendationEffectiveness(
          data.recommendationId,
          data.beforeMetrics,
          data.afterMetrics
        );
      }
      break;
  }

  throw new ValidationError(`Invalid recommendation operation: ${method} ${operation}`);
}

/**
 * Handle testing operations
 */
async function handleTestingOperations(pathSegments: string[], data: any, method: string): Promise<any> {
  const operation = pathSegments[0];

  switch (method) {
    case 'POST':
      if (operation === 'create-case') {
        return await testingFramework.createTestCase(data);
      }
      if (operation === 'run-suite') {
        const request = data as RunTestSuiteRequest;
        return await testingFramework.runTestSuite(request);
      }
      if (operation === 'create-framework') {
        return await testingFramework.createValidationFramework(data);
      }
      if (operation === 'validate') {
        return await testingFramework.validateOutput(data.output, data.frameworkId, data.contextData);
      }
      if (operation === 'regression') {
        return await testingFramework.runRegressionTests(
          data.templateId,
          data.newVersion,
          data.baselineVersion
        );
      }
      break;
    
    case 'GET':
      if (operation === 'benchmarks' && pathSegments[1]) {
        return await testingFramework.generatePerformanceBenchmarks(pathSegments[1]);
      }
      break;
  }

  throw new ValidationError(`Invalid testing operation: ${method} ${operation}`);
}

/**
 * Handle OPTIONS requests for CORS
 */
export const optionsHandler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: ''
  };
};