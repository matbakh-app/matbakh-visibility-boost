import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { 
  SWOTAnalysisRequest, 
  SWOTAnalysisResult
} from './types';
import { AnalysisError, isAnalysisError, getErrorMessage } from './errors';
import { TextAnalysisEngine } from './text-analysis-engine';
import { ImageAnalysisEngine } from './image-analysis-engine';
import { SWOTGenerationEngine } from './swot-generation-engine';
import { VisualizationEngine } from './visualization-engine';

/**
 * AWS Lambda Handler for Automated SWOT Analysis Engine
 * 
 * Processes restaurant business data to generate comprehensive SWOT analysis:
 * - Analyzes review texts using AWS Comprehend and custom algorithms
 * - Analyzes images using AWS Rekognition and quality assessment
 * - Generates AI-powered SWOT analysis using AWS Bedrock
 * - Creates interactive visualizations and actionable recommendations
 */

const textAnalysisEngine = new TextAnalysisEngine();
const imageAnalysisEngine = new ImageAnalysisEngine();
const swotGenerationEngine = new SWOTGenerationEngine();
const visualizationEngine = new VisualizationEngine();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    console.log('SWOT Analysis request received:', {
      httpMethod: event.httpMethod,
      path: event.path,
      requestId: context.awsRequestId
    });

    // Route based on HTTP method and path
    switch (event.httpMethod) {
      case 'POST':
        if (event.path === '/swot/analyze' || event.path?.endsWith('/analyze')) {
          return await handleSWOTAnalysis(event, context, corsHeaders);
        }
        break;
      
      case 'GET':
        if (event.path === '/swot/health' || event.path?.endsWith('/health')) {
          return await handleHealthCheck(event, context, corsHeaders);
        }
        break;
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Route not found',
        message: `${event.httpMethod} ${event.path} is not supported`,
        availableRoutes: [
          'POST /swot/analyze - Generate SWOT analysis',
          'GET /swot/health - Health check'
        ]
      })
    };

  } catch (error: unknown) {
    console.error('Unhandled error in SWOT analysis handler:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing the request',
        requestId: context.awsRequestId,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Handle SWOT analysis request
 */
async function handleSWOTAnalysis(
  event: APIGatewayProxyEvent,
  context: Context,
  corsHeaders: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing request body',
          message: 'Request body is required for SWOT analysis'
        })
      };
    }

    let request: SWOTAnalysisRequest;
    try {
      request = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }

    // Validate required fields
    const validationError = validateSWOTRequest(request);
    if (validationError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Validation error',
          message: validationError
        })
      };
    }

    console.log(`Starting SWOT analysis for business: ${request.businessName}`);
    console.log(`Analysis includes: ${request.reviewTexts.length} reviews, ${request.images.length} images`);

    // Step 1: Analyze review texts
    const textAnalysis = request.reviewTexts.length > 0 
      ? await textAnalysisEngine.analyzeReviews(request.reviewTexts)
      : { results: new Map(), failedReviews: 0 };

    console.log(`Text analysis completed: ${textAnalysis.results.size} reviews processed`);

    // Step 2: Analyze images
    const imageAnalysis = request.images.length > 0 
      ? await imageAnalysisEngine.analyzeImages(request.images)
      : { results: new Map(), failedImages: 0 };

    console.log(`Image analysis completed: ${imageAnalysis.results.size} images processed`);

    // Step 3: Generate SWOT analysis
    const swotResult = await swotGenerationEngine.generateSWOTAnalysis(
      request,
      textAnalysis.results,
      imageAnalysis.results,
      textAnalysis.failedReviews,
      imageAnalysis.failedImages
    );

    console.log('SWOT generation completed');

    // Step 4: Generate additional visualizations
    const textInsights = textAnalysis.results.size > 0 
      ? textAnalysisEngine.aggregateResults(textAnalysis.results)
      : undefined;

    const imageInsights = imageAnalysis.results.size > 0 
      ? imageAnalysisEngine.aggregateResults(imageAnalysis.results)
      : undefined;

    const additionalVisualizations = visualizationEngine.generateVisualizations(
      swotResult,
      textInsights,
      imageInsights
    );

    // Merge visualizations
    swotResult.visualizations = [...swotResult.visualizations, ...additionalVisualizations];

    console.log('Visualization generation completed');

    const processingTime = Date.now() - startTime;
    console.log(`SWOT analysis completed in ${processingTime}ms`);

    // Add processing metadata with degraded success tracking
    const response = {
      ...swotResult,
      processingTime,
      metadata: {
        requestId: context.awsRequestId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        analysisEngine: 'automated-swot-engine',
        textAnalysisCount: textAnalysis.results.size,
        imageAnalysisCount: imageAnalysis.results.size,
        totalSWOTItems: Object.values(swotResult.swotAnalysis).flat().length,
        totalRecommendations: swotResult.actionRecommendations.length,
        totalVisualizations: swotResult.visualizations.length,
        // Degraded success tracking
        usedFallback: swotResult.metadata?.usedFallback || false,
        failedImages: swotResult.metadata?.failedImages || 0,
        failedReviews: swotResult.metadata?.failedReviews || 0,
        errorKinds: swotResult.metadata?.errorKinds || [],
        partialSuccess: (swotResult.metadata?.usedFallback || swotResult.metadata?.failedImages || swotResult.metadata?.failedReviews) ? true : false
      }
    };

    // Add degraded success header if fallbacks were used
    if (response.metadata.partialSuccess) {
      corsHeaders['X-Degraded'] = 'true';
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response)
    };

  } catch (error: unknown) {
    console.error('SWOT analysis failed:', error);

    const processingTime = Date.now() - startTime;
    
    if (isAnalysisError(error)) {
      return {
        statusCode: error.type === 'validation' ? 400 : 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: error.code,
          message: error.message,
          type: error.type,
          details: error.details,
          processingTime,
          requestId: context.awsRequestId,
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'swot_analysis_failed',
        message: getErrorMessage(error),
        processingTime,
        requestId: context.awsRequestId,
        timestamp: new Date().toISOString()
      })
    };
  }
}

/**
 * Handle health check request
 */
async function handleHealthCheck(
  event: APIGatewayProxyEvent,
  context: Context,
  corsHeaders: { [key: string]: string }
): Promise<APIGatewayProxyResult> {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'automated-swot-engine',
      requestId: context.awsRequestId,
      environment: {
        region: process.env.AWS_REGION || 'unknown',
        stage: process.env.STAGE || 'unknown',
        nodeVersion: process.version
      },
      capabilities: {
        textAnalysis: true,
        imageAnalysis: true,
        swotGeneration: true,
        visualizations: true,
        aiModels: {
          comprehend: true,
          rekognition: true,
          bedrock: true
        }
      },
      limits: {
        maxReviews: 1000,
        maxImages: 100,
        maxProcessingTime: 300000 // 5 minutes
      }
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(healthStatus)
    };

  } catch (error: unknown) {
    console.error('Health check failed:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'unhealthy',
        error: getErrorMessage(error),
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId
      })
    };
  }
}

/**
 * Validate SWOT analysis request
 */
function validateSWOTRequest(request: any): string | null {
  if (!request) {
    return 'Request object is required';
  }

  if (!request.businessId || typeof request.businessId !== 'string') {
    return 'businessId is required and must be a string';
  }

  if (!request.businessName || typeof request.businessName !== 'string') {
    return 'businessName is required and must be a string';
  }

  if (!request.businessCategory || typeof request.businessCategory !== 'string') {
    return 'businessCategory is required and must be a string';
  }

  if (!request.location || typeof request.location !== 'object') {
    return 'location is required and must be an object';
  }

  if (!request.location.city || typeof request.location.city !== 'string') {
    return 'location.city is required and must be a string';
  }

  if (!request.location.country || typeof request.location.country !== 'string') {
    return 'location.country is required and must be a string';
  }

  if (!Array.isArray(request.reviewTexts)) {
    return 'reviewTexts must be an array';
  }

  if (!Array.isArray(request.images)) {
    return 'images must be an array';
  }

  // Validate review texts
  for (let i = 0; i < request.reviewTexts.length; i++) {
    const review = request.reviewTexts[i];
    if (!review.id || !review.text || !review.platform) {
      return `reviewTexts[${i}] must have id, text, and platform fields`;
    }
    if (typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
      return `reviewTexts[${i}].rating must be a number between 1 and 5`;
    }
  }

  // Validate images
  for (let i = 0; i < request.images.length; i++) {
    const image = request.images[i];
    if (!image.id || !image.url || !image.platform) {
      return `images[${i}] must have id, url, and platform fields`;
    }
  }

  // Validate limits
  if (request.reviewTexts.length > 1000) {
    return 'Maximum 1000 reviews allowed per analysis';
  }

  if (request.images.length > 100) {
    return 'Maximum 100 images allowed per analysis';
  }

  // Validate analysis options if provided
  if (request.analysisOptions) {
    const options = request.analysisOptions;
    
    if (options.analysisDepth && !['basic', 'detailed', 'comprehensive'].includes(options.analysisDepth)) {
      return 'analysisOptions.analysisDepth must be one of: basic, detailed, comprehensive';
    }

    if (options.language && !['de', 'en'].includes(options.language)) {
      return 'analysisOptions.language must be one of: de, en';
    }
  }

  return null; // No validation errors
}

/**
 * Export types for external use
 */
export {
  SWOTAnalysisRequest,
  SWOTAnalysisResult,
  AnalysisError
} from './types';