/**
 * Template Security System Lambda Handler
 * Main entry point for template security operations including signing, verification, and validation
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { TemplateProvenanceManager } from './template-provenance-manager';
import { TemplateValidator } from './template-validator';
import { 
  SigningRequest, 
  VerificationRequest, 
  TemplateMetadata, 
  TemplateContent 
} from './types';

// Initialize services
const provenanceManager = new TemplateProvenanceManager('eu-central-1');
const templateValidator = new TemplateValidator();

/**
 * Main Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
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

    // Extract user context
    const authHeader = headers.Authorization || headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Authorization required' }),
      };
    }

    // Extract user ID from token (simplified)
    const userId = extractUserIdFromToken(authHeader);

    // Route requests
    if (path.startsWith('/templates/sign')) {
      return await handleSigningRequests(httpMethod, path, pathParameters, body, userId, corsHeaders);
    }

    if (path.startsWith('/templates/verify')) {
      return await handleVerificationRequests(httpMethod, path, pathParameters, body, userId, corsHeaders);
    }

    if (path.startsWith('/templates/validate')) {
      return await handleValidationRequests(httpMethod, path, pathParameters, body, userId, corsHeaders);
    }

    if (path.startsWith('/templates/provenance')) {
      return await handleProvenanceRequests(httpMethod, path, pathParameters, queryStringParameters, userId, corsHeaders);
    }

    if (path.startsWith('/templates/keys')) {
      return await handleKeyManagementRequests(httpMethod, path, pathParameters, body, userId, corsHeaders);
    }

    if (path === '/health' && httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            provenanceManager: 'healthy',
            templateValidator: 'healthy',
            kms: 'healthy',
          },
        }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (error) {
    console.error('Request error:', error);
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

/**
 * Handle template signing requests
 */
async function handleSigningRequests(
  method: string,
  path: string,
  pathParams: any,
  body: string | null,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {

  // POST /templates/sign - Sign a template
  if (path === '/templates/sign' && method === 'POST') {
    if (!body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const signingRequest: SigningRequest = JSON.parse(body);
    
    // Validate required fields
    if (!signingRequest.templateId || !signingRequest.version || !signingRequest.content) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'templateId, version, and content are required' }),
      };
    }

    // Set the signer
    signingRequest.signedBy = userId;

    const signature = await provenanceManager.signTemplate(signingRequest);
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        signature,
        message: 'Template signed successfully',
      }),
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Signing route not found' }),
  };
}

/**
 * Handle template verification requests
 */
async function handleVerificationRequests(
  method: string,
  path: string,
  pathParams: any,
  body: string | null,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {

  // POST /templates/verify - Verify a template signature
  if (path === '/templates/verify' && method === 'POST') {
    if (!body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const verificationRequest: VerificationRequest = JSON.parse(body);
    
    if (!verificationRequest.templateId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'templateId is required' }),
      };
    }

    const result = await provenanceManager.verifyTemplate(verificationRequest);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        verification: result,
        message: result.valid ? 'Template verification passed' : 'Template verification failed',
      }),
    };
  }

  // GET /templates/verify/{templateId} - Quick verification check
  if (path.match(/^\/templates\/verify\/[^\/]+$/) && method === 'GET') {
    const templateId = pathParams?.templateId || path.split('/').pop();
    if (!templateId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Template ID is required' }),
      };
    }

    const result = await provenanceManager.verifyTemplate({ templateId });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        templateId,
        valid: result.valid,
        lastVerified: result.verifiedAt,
        issues: result.errors.length + result.warnings.length,
      }),
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Verification route not found' }),
  };
}

/**
 * Handle template validation requests
 */
async function handleValidationRequests(
  method: string,
  path: string,
  pathParams: any,
  body: string | null,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {

  // POST /templates/validate - Validate template content and metadata
  if (path === '/templates/validate' && method === 'POST') {
    if (!body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { metadata, content } = JSON.parse(body);
    
    if (!metadata || !content) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Both metadata and content are required' }),
      };
    }

    const validationResult = await templateValidator.validateTemplate(metadata, content);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        validation: validationResult,
        message: validationResult.valid ? 'Template validation passed' : 'Template validation failed',
      }),
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Validation route not found' }),
  };
}

/**
 * Handle template provenance requests
 */
async function handleProvenanceRequests(
  method: string,
  path: string,
  pathParams: any,
  queryParams: any,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {

  // GET /templates/provenance/{templateId} - Get template provenance
  if (path.match(/^\/templates\/provenance\/[^\/]+$/) && method === 'GET') {
    const templateId = pathParams?.templateId || path.split('/').pop();
    if (!templateId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Template ID is required' }),
      };
    }

    const version = queryParams?.version;
    const provenance = await provenanceManager.getTemplateProvenance(templateId, version);
    
    if (!provenance) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Template provenance not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        provenance,
      }),
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Provenance route not found' }),
  };
}

/**
 * Handle key management requests
 */
async function handleKeyManagementRequests(
  method: string,
  path: string,
  pathParams: any,
  body: string | null,
  userId: string,
  corsHeaders: Record<string, string>
): Promise<APIGatewayProxyResult> {

  // POST /templates/keys - Create new signing key
  if (path === '/templates/keys' && method === 'POST') {
    const { description } = body ? JSON.parse(body) : {};
    
    const keyConfig = await provenanceManager.createSigningKey(
      description || `Template signing key created by ${userId}`
    );
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        key: keyConfig,
        message: 'Signing key created successfully',
      }),
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Key management route not found' }),
  };
}

/**
 * Extract user ID from authorization token
 */
function extractUserIdFromToken(authHeader: string): string {
  // This is a simplified implementation
  // In production, you would validate the JWT token and extract the user ID
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Decode JWT payload (without verification for this example)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.sub || payload.user_id || 'system';
  } catch (error) {
    return 'system';
  }
}