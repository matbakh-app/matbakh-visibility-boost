import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { invokeBedrock, healthCheck, BedrockRequest } from './bedrock-client';
import { integratedLoggingManager } from './integrated-logging-manager';
import { randomUUID } from 'crypto';
import { 
  aiOrchestrator,
  AIRequest,
  AIResponse,
  AIRequestType 
} from './ai-agent-orchestrator';
import { 
  ProviderRouter,
  ProviderFactory 
} from './multi-provider-architecture';
import { 
  ContentGenerationPipeline,
  ContentGenerationRequest 
} from './content-generation-pipeline';
import { 
  ImageAnalysisFramework,
  ImageAnalysisRequest 
} from './image-analysis-framework';
import { 
  TranslationSystemArchitecture,
  TranslationRequest 
} from './translation-system-architecture';
import { 
  ContentQualityAssessment,
  QualityAssessmentRequest 
} from './content-quality-assessment';
import { 
  featureFlagIntegration,
  BedrockFeatureIntegration,
  RequestContext 
} from './feature-flag-integration';

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://matbakh.app',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
};

/**
 * Create standardized API response
 */
function createResponse(
  statusCode: number,
  body: any,
  additionalHeaders: Record<string, string> = {}
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, ...additionalHeaders },
    body: JSON.stringify(body),
  };
}

/**
 * Validate request body for Bedrock operations
 */
function validateBedrockRequest(body: any): { valid: boolean; error?: string; request?: BedrockRequest } {
  if (!body) {
    return { valid: false, error: 'Request body is required' };
  }

  if (!body.prompt || typeof body.prompt !== 'string') {
    return { valid: false, error: 'Prompt is required and must be a string' };
  }

  if (body.prompt.length > 100000) {
    return { valid: false, error: 'Prompt exceeds maximum length of 100,000 characters' };
  }

  const validRequestTypes = ['vc_analysis', 'content_generation', 'persona_detection', 'text_rewrite'];
  if (!body.requestType || !validRequestTypes.includes(body.requestType)) {
    return { valid: false, error: `Request type must be one of: ${validRequestTypes.join(', ')}` };
  }

  // Validate optional parameters
  if (body.maxTokens && (typeof body.maxTokens !== 'number' || body.maxTokens < 1 || body.maxTokens > 8000)) {
    return { valid: false, error: 'maxTokens must be a number between 1 and 8000' };
  }

  if (body.temperature && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 1)) {
    return { valid: false, error: 'temperature must be a number between 0 and 1' };
  }

  if (body.topP && (typeof body.topP !== 'number' || body.topP < 0 || body.topP > 1)) {
    return { valid: false, error: 'topP must be a number between 0 and 1' };
  }

  const request: BedrockRequest = {
    prompt: body.prompt,
    requestType: body.requestType,
    maxTokens: body.maxTokens,
    temperature: body.temperature,
    topP: body.topP,
    userId: body.userId,
    sessionId: body.sessionId,
  };

  return { valid: true, request };
}

/**
 * Extract user context from API Gateway event
 */
function extractUserContext(event: APIGatewayProxyEvent): { userId?: string; sessionId?: string } {
  // Try to get user ID from JWT token or API key
  const authHeader = event.headers.Authorization || event.headers.authorization;
  let userId: string | undefined;
  let sessionId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // In a real implementation, you'd validate the JWT token here
      // For now, we'll extract a simple user ID if present
      const token = authHeader.substring(7);
      // This is a placeholder - implement proper JWT validation
      userId = `user-${token.substring(0, 8)}`;
    } catch (error) {
      console.warn('Failed to parse auth token:', error);
    }
  }

  // Try to get session ID from headers
  sessionId = event.headers['X-Session-ID'] || event.headers['x-session-id'];

  return { userId, sessionId };
}

/**
 * Rate limiting check (placeholder implementation)
 */
async function checkRateLimit(userId: string = 'anonymous'): Promise<{ allowed: boolean; remaining?: number }> {
  // TODO: Implement proper rate limiting with DynamoDB or Redis
  // For now, always allow requests
  return { allowed: true, remaining: 100 };
}

/**
 * Create request context for feature flag decisions
 */
function createRequestContext(
  event: APIGatewayProxyEvent,
  requestType: string,
  estimatedCost: number = 0.01
): RequestContext {
  const { userId, sessionId } = extractUserContext(event);
  
  return {
    requestType,
    estimatedCost,
    userContext: {
      userId,
      sessionId,
      userSegment: event.headers['X-User-Segment'] || event.headers['x-user-segment'],
      geographicRegion: event.headers['X-Geographic-Region'] || event.headers['x-geographic-region'] || 'unknown',
      timezone: event.headers['X-Timezone'] || event.headers['x-timezone']
    },
    requestId: event.requestContext.requestId || `req_${Date.now()}`
  };
}

/**
 * Initialize orchestration components
 */
const providerRouter = new ProviderRouter();
const providers = ProviderFactory.createDefaultProviders();
providers.forEach(provider => providerRouter.registerProvider(provider));

const contentPipeline = new ContentGenerationPipeline(providerRouter);
const imageFramework = new ImageAnalysisFramework();
const translationSystem = new TranslationSystemArchitecture(providerRouter);
const qualityAssessment = new ContentQualityAssessment();

/**
 * Handle content generation requests
 */
async function handleContentGeneration(
  event: APIGatewayProxyEvent, 
  userId?: string, 
  sessionId?: string
): Promise<APIGatewayProxyResult> {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    
    const contentRequest: ContentGenerationRequest = {
      type: requestBody.type || 'social_media_post',
      format: requestBody.format || 'text',
      platform: requestBody.platform,
      context: {
        businessName: requestBody.businessName || 'Restaurant',
        businessType: requestBody.businessType || 'restaurant',
        location: requestBody.location,
        cuisine: requestBody.cuisine,
        specialties: requestBody.specialties,
        targetAudience: requestBody.targetAudience,
        brandVoice: requestBody.brandVoice || 'friendly',
        ...requestBody.context
      },
      requirements: {
        maxLength: requestBody.maxLength,
        includeHashtags: requestBody.includeHashtags,
        includeCallToAction: requestBody.includeCallToAction,
        tone: requestBody.tone || 'engaging',
        keywords: requestBody.keywords || [],
        ...requestBody.requirements
      },
      persona: requestBody.persona,
      language: requestBody.language || 'en'
    };

    const response = await contentPipeline.generateContent(contentRequest);
    
    return createResponse(200, {
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Content generation error:', error);
    return createResponse(500, {
      error: 'Content generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle image analysis requests
 */
async function handleImageAnalysis(
  event: APIGatewayProxyEvent, 
  userId?: string, 
  sessionId?: string
): Promise<APIGatewayProxyResult> {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    
    const analysisRequest: ImageAnalysisRequest = {
      imageUrl: requestBody.imageUrl,
      imageBase64: requestBody.imageBase64,
      imageMetadata: requestBody.imageMetadata,
      analysisTypes: requestBody.analysisTypes || ['content_analysis', 'quality_assessment'],
      context: {
        businessName: requestBody.businessName || 'Restaurant',
        businessType: requestBody.businessType || 'restaurant',
        cuisine: requestBody.cuisine,
        brandColors: requestBody.brandColors,
        brandStyle: requestBody.brandStyle,
        targetAudience: requestBody.targetAudience,
        ...requestBody.context
      },
      options: requestBody.options || {}
    };

    const response = await imageFramework.analyzeImage(analysisRequest);
    
    return createResponse(200, {
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    return createResponse(500, {
      error: 'Image analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle translation requests
 */
async function handleTranslation(
  event: APIGatewayProxyEvent, 
  userId?: string, 
  sessionId?: string
): Promise<APIGatewayProxyResult> {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    
    const translationRequest: TranslationRequest = {
      sourceText: requestBody.sourceText,
      sourceLanguage: requestBody.sourceLanguage || 'en',
      targetLanguage: requestBody.targetLanguage || 'de',
      translationType: requestBody.translationType || 'content_translation',
      context: {
        businessName: requestBody.businessName || 'Restaurant',
        businessType: requestBody.businessType || 'restaurant',
        industry: 'restaurant',
        region: requestBody.region,
        culturalContext: requestBody.culturalContext || 'business',
        targetAudience: requestBody.targetAudience,
        brandVoice: requestBody.brandVoice,
        ...requestBody.context
      },
      options: requestBody.options || {}
    };

    const response = await translationSystem.translateContent(translationRequest);
    
    return createResponse(200, {
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Translation error:', error);
    return createResponse(500, {
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle quality assessment requests
 */
async function handleQualityAssessment(
  event: APIGatewayProxyEvent, 
  userId?: string, 
  sessionId?: string
): Promise<APIGatewayProxyResult> {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    
    const qualityRequest: QualityAssessmentRequest = {
      content: requestBody.content,
      contentType: requestBody.contentType || 'social_media',
      context: {
        businessName: requestBody.businessName || 'Restaurant',
        industry: 'restaurant',
        targetAudience: requestBody.targetAudience,
        brandGuidelines: requestBody.brandGuidelines,
        platform: requestBody.platform,
        language: requestBody.language || 'en',
        ...requestBody.context
      },
      dimensions: requestBody.dimensions || ['relevance', 'engagement', 'brand_alignment', 'technical_quality'],
      options: requestBody.options || {}
    };

    const response = await qualityAssessment.assessContent(qualityRequest);
    
    return createResponse(200, {
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Quality assessment error:', error);
    return createResponse(500, {
      error: 'Quality assessment failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle workflow execution requests
 */
async function handleWorkflowExecution(
  event: APIGatewayProxyEvent, 
  userId?: string, 
  sessionId?: string
): Promise<APIGatewayProxyResult> {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    
    const workflowId = requestBody.workflowId;
    const input = requestBody.input || {};
    const context = {
      userId,
      sessionId,
      language: requestBody.language || 'en',
      businessContext: {
        businessId: requestBody.businessId,
        industry: 'restaurant',
        location: requestBody.location
      },
      ...requestBody.context
    };

    const response = await aiOrchestrator.executeWorkflow(workflowId, input, context);
    
    return createResponse(200, {
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return createResponse(500, {
      error: 'Workflow execution failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  console.log('Bedrock Agent Lambda invoked:', {
    httpMethod: event.httpMethod,
    path: event.path,
    requestId: context.awsRequestId,
  });

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { message: 'CORS preflight successful' });
  }

  try {
    // Health check endpoint with feature flag integration
    if (event.httpMethod === 'GET' && event.path === '/health') {
      const [bedrockHealth, featureFlagHealth] = await Promise.all([
        healthCheck(),
        featureFlagIntegration.healthCheck()
      ]);
      
      const overallStatus = bedrockHealth.status === 'healthy' && featureFlagHealth.status === 'healthy' 
        ? 'healthy' 
        : 'unhealthy';
      
      return createResponse(
        overallStatus === 'healthy' ? 200 : 503,
        {
          status: overallStatus,
          bedrock: bedrockHealth,
          feature_flags: featureFlagHealth,
          timestamp: new Date().toISOString()
        }
      );
    }

    // Feature flag status endpoint
    if (event.httpMethod === 'GET' && event.path === '/feature-flags/status') {
      const featureFlag = event.queryStringParameters?.flag || 'vc_bedrock_live';
      const status = await featureFlagIntegration.getFeatureStatus(featureFlag);
      
      return createResponse(200, {
        success: true,
        data: status
      });
    }

    // Emergency shutdown endpoint (POST only, requires admin auth)
    if (event.httpMethod === 'POST' && event.path === '/emergency-shutdown') {
      const requestBody = JSON.parse(event.body || '{}');
      const reason = requestBody.reason || 'Manual emergency shutdown';
      const shutdownBy = requestBody.shutdown_by || 'admin';
      
      try {
        await BedrockFeatureIntegration.emergencyShutdown(reason, shutdownBy);
        
        return createResponse(200, {
          success: true,
          message: 'Emergency shutdown completed',
          reason,
          shutdown_by: shutdownBy,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return createResponse(500, {
          error: 'Emergency shutdown failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Orchestrator status endpoint
    if (event.httpMethod === 'GET' && event.path === '/orchestrator/status') {
      const status = aiOrchestrator.getStatus();
      return createResponse(200, {
        success: true,
        data: status
      });
    }

    // Content generation endpoint
    if (event.httpMethod === 'POST' && event.path === '/content/generate') {
      return await handleContentGeneration(event, userId, sessionId);
    }

    // Image analysis endpoint
    if (event.httpMethod === 'POST' && event.path === '/image/analyze') {
      return await handleImageAnalysis(event, userId, sessionId);
    }

    // Translation endpoint
    if (event.httpMethod === 'POST' && event.path === '/translate') {
      return await handleTranslation(event, userId, sessionId);
    }

    // Quality assessment endpoint
    if (event.httpMethod === 'POST' && event.path === '/quality/assess') {
      return await handleQualityAssessment(event, userId, sessionId);
    }

    // Workflow execution endpoint
    if (event.httpMethod === 'POST' && event.path === '/workflow/execute') {
      return await handleWorkflowExecution(event, userId, sessionId);
    }

    // Only allow POST for AI operations
    if (event.httpMethod !== 'POST') {
      return createResponse(405, {
        error: 'Method not allowed',
        message: 'Only POST requests are supported for AI operations',
      });
    }

    // Create request context for feature flag evaluation
    const requestContext = createRequestContext(event, 'bedrock_ai_request', 0.05);

    // Check if Bedrock should be enabled for this request
    const featureDecision = await BedrockFeatureIntegration.shouldEnableBedrock(requestContext);
    
    if (!featureDecision.enabled) {
      console.log(`Bedrock disabled for user: ${featureDecision.reason}`, featureDecision.metadata);
      
      return createResponse(503, {
        error: 'Service unavailable',
        message: 'AI service is not available for your request',
        reason: featureDecision.reason,
        metadata: {
          feature_flag: featureDecision.metadata.feature_flag,
          timestamp: featureDecision.metadata.timestamp
        }
      });
    }

    // Extract user context for backward compatibility
    const { userId, sessionId } = extractUserContext(event);

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return createResponse(429, {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60,
      });
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return createResponse(400, {
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
      });
    }

    const validation = validateBedrockRequest(requestBody);
    if (!validation.valid) {
      return createResponse(400, {
        error: 'Validation error',
        message: validation.error,
      });
    }

    // Add user context to request
    const bedrockRequest = {
      ...validation.request!,
      userId,
      sessionId,
    };

    // Invoke Bedrock
    console.log('Invoking Bedrock with request type:', bedrockRequest.requestType);
    const startTime = Date.now();
    
    try {
      const response = await invokeBedrock(bedrockRequest);
      const responseTime = Date.now() - startTime;
      
      // Record successful AI operation
      await BedrockFeatureIntegration.recordAISuccess(
        requestContext,
        responseTime,
        response.cost || requestContext.estimatedCost,
        85 // Default quality score - would be calculated based on response
      );

      // Return successful response
      return createResponse(200, {
        success: true,
        data: {
          content: response.content,
          requestId: response.requestId || context.awsRequestId,
          timestamp: response.timestamp || new Date().toISOString(),
          tokenUsage: response.tokenUsage || 0,
          estimatedCost: response.cost || requestContext.estimatedCost,
        },
        feature_info: {
          variant: featureDecision.variant,
          rollout_info: featureDecision.rollout_info
        }
      });
      
    } catch (bedrockError) {
      const responseTime = Date.now() - startTime;
      
      // Record AI operation failure
      await BedrockFeatureIntegration.recordAIFailure(
        requestContext,
        'bedrock_invocation_error',
        bedrockError instanceof Error ? bedrockError.message : 'Unknown error'
      );
      
      throw bedrockError; // Re-throw to be handled by outer catch block
    }

  } catch (error) {
    console.error('Lambda execution error:', error);

    // Handle different types of errors
    if (error && typeof error === 'object' && 'code' in error) {
      const bedrockError = error as any;
      
      switch (bedrockError.code) {
        case 'PROMPT_TEMPLATE_ERROR':
        case 'TEMPLATE_NOT_FOUND':
          return createResponse(500, {
            error: 'Configuration error',
            message: 'AI service configuration issue. Please try again later.',
            requestId: context.awsRequestId,
          });
          
        case 'RATE_LIMIT_EXCEEDED':
          return createResponse(429, {
            error: 'Rate limit exceeded',
            message: 'AI service is currently busy. Please try again in a few moments.',
            requestId: context.awsRequestId,
          });
          
        case 'INVALID_RESPONSE_FORMAT':
        case 'EMPTY_RESPONSE':
          return createResponse(502, {
            error: 'AI service error',
            message: 'AI service returned an invalid response. Please try again.',
            requestId: context.awsRequestId,
          });
          
        default:
          return createResponse(500, {
            error: 'AI service error',
            message: 'An error occurred while processing your request.',
            requestId: context.awsRequestId,
          });
      }
    }

    // Generic error handling
    return createResponse(500, {
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      requestId: context.awsRequestId,
    });
  }
}