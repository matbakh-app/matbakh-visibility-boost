import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { 
  buildSecurePrompt, 
  createPromptContract, 
  auditPromptSecurity,
  applySoftRules,
  PERSONA_SOFT_RULES,
  type PromptContract 
} from './prompt-security';
import { 
  templateRegistry,
  VCAnalysisTemplate,
  ContentGenerationTemplate,
  PersonaDetectionTemplate,
  TextRewriteTemplate,
  type TemplateVariables 
} from './prompt-templates';
import { 
  TemplateSecurityValidator,
  TemplateVariableValidator 
} from './template-validation';
import { 
  redactPII, 
  containsPII, 
  generateRedactionReport,
  type RedactionResult 
} from './pii-redactor';
import { 
  withCircuitBreaker, 
  isFallbackResponse,
  getCircuitBreakerMetrics,
  type FallbackResponse 
} from './circuit-breaker';

// Types for Bedrock operations
export interface BedrockRequest {
  prompt?: string; // Optional when using templates
  templateId?: string; // Template-based requests
  templateVariables?: TemplateVariables; // Variables for template
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  requestType: 'vc_analysis' | 'content_generation' | 'persona_detection' | 'text_rewrite';
  userId?: string;
  sessionId?: string;
  skipPIIRedaction?: boolean; // For testing purposes only
  useTemplate?: boolean; // Force template usage
}

export interface BedrockResponse {
  content: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  requestId: string;
  timestamp: string;
  cost?: number;
  piiRedacted?: boolean;
  redactionReport?: any;
  templateUsed?: string;
}

export interface BedrockError {
  code: string;
  message: string;
  requestId?: string;
  retryable: boolean;
}

// Configuration
const BEDROCK_REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = 'anthropic.claude-3-5-sonnet-20240620-v1:0';
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Clients with retry configuration
const bedrockClient = new BedrockRuntimeClient({
  region: BEDROCK_REGION,
  maxAttempts: MAX_RETRIES,
  requestHandler: {
    requestTimeout: REQUEST_TIMEOUT,
  },
});

const secretsClient = new SecretsManagerClient({
  region: BEDROCK_REGION,
  maxAttempts: 2,
});

const dynamoClient = new DynamoDBClient({
  region: BEDROCK_REGION,
  maxAttempts: 2,
});

// Prompt template cache
let promptTemplatesCache: Record<string, string> | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get prompt templates from Secrets Manager with caching
 */
async function getPromptTemplates(): Promise<Record<string, string>> {
  const now = Date.now();
  
  if (promptTemplatesCache && now < cacheExpiry) {
    return promptTemplatesCache;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: 'bedrock/prompt-templates',
    });
    
    const response = await secretsClient.send(command);
    
    if (!response.SecretString) {
      throw new Error('No secret string found in prompt templates');
    }
    
    promptTemplatesCache = JSON.parse(response.SecretString);
    cacheExpiry = now + CACHE_TTL;
    
    return promptTemplatesCache!;
  } catch (error) {
    console.error('Failed to get prompt templates:', error);
    throw new BedrockError({
      code: 'PROMPT_TEMPLATE_ERROR',
      message: 'Failed to load prompt templates from Secrets Manager',
      retryable: true,
    });
  }
}

/**
 * Build secure prompt with embedded guards using the template system or legacy method
 */
async function buildSecurePromptWithGuards(request: BedrockRequest): Promise<{ 
  prompt: string; 
  warnings: string[];
  redactionResult?: RedactionResult;
  templateUsed?: string;
}> {
  let processedPrompt: string;
  let redactionResult: RedactionResult | undefined;
  const warnings: string[] = [];
  let templateUsed: string | undefined;

  // Determine if we should use template system
  const shouldUseTemplate = request.useTemplate || 
    request.templateId || 
    (request.templateVariables && !request.prompt);

  if (shouldUseTemplate) {
    // Template-based prompt generation
    const templateResult = await buildPromptFromTemplate(request);
    processedPrompt = templateResult.prompt;
    warnings.push(...templateResult.warnings);
    templateUsed = templateResult.templateId;
    
    // PII detection on template variables (if provided)
    if (request.templateVariables && !request.skipPIIRedaction) {
      const variableContent = JSON.stringify(request.templateVariables);
      const piiCheck = containsPII(variableContent);
      
      if (piiCheck.hasPII) {
        warnings.push(`PII detected in template variables: ${piiCheck.detectedTypes.join(', ')}`);
        console.warn('PII detected in template variables:', piiCheck);
      }
    }
  } else {
    // Legacy prompt processing
    if (!request.prompt) {
      throw new BedrockError({
        code: 'MISSING_PROMPT',
        message: 'Either prompt or templateId/templateVariables must be provided',
        retryable: false,
      });
    }

    processedPrompt = request.prompt;

    // Step 1: PII Detection and Redaction (unless explicitly skipped)
    if (!request.skipPIIRedaction) {
      const piiCheck = containsPII(request.prompt);
      
      if (piiCheck.hasPII) {
        console.warn(`PII detected in prompt: ${piiCheck.detectedTypes.join(', ')} (${piiCheck.count} instances)`);
        
        redactionResult = redactPII(request.prompt);
        processedPrompt = redactionResult.redactedText;
        
        warnings.push(`PII detected and redacted: ${piiCheck.detectedTypes.join(', ')}`);
        
        // Log redaction for audit
        console.info('PII redaction completed:', {
          requestId: `temp-${Date.now()}`,
          redactionCount: redactionResult.redactionCount,
          detectedTypes: piiCheck.detectedTypes,
        });
      }
    }

    // Step 2: Create prompt contract based on request type
    const contract = createPromptContract(request.requestType, request.userId);
    
    // Step 3: Build secure prompt with embedded security guards
    const { securePrompt, warnings: securityWarnings } = buildSecurePrompt(processedPrompt, contract);
    processedPrompt = securePrompt;
    warnings.push(...securityWarnings);
    
    // Step 4: Apply persona-specific soft rules if persona is detected
    if (request.userId && PERSONA_SOFT_RULES[request.userId]) {
      processedPrompt = applySoftRules(processedPrompt, PERSONA_SOFT_RULES[request.userId]);
    }
    
    // Step 5: Audit the prompt for security compliance
    const auditResult = auditPromptSecurity(request.prompt, processedPrompt, contract);
    if (!auditResult.passed) {
      console.warn('Prompt security audit failed:', auditResult.issues);
      warnings.push(...auditResult.issues);
    }
    
    if (auditResult.recommendations.length > 0) {
      console.info('Prompt security recommendations:', auditResult.recommendations);
    }
  }
  
  return { prompt: processedPrompt, warnings, redactionResult, templateUsed };
}

/**
 * Build prompt from template system
 */
async function buildPromptFromTemplate(request: BedrockRequest): Promise<{
  prompt: string;
  warnings: string[];
  templateId: string;
}> {
  const warnings: string[] = [];
  
  // Determine template ID
  let templateId = request.templateId;
  if (!templateId) {
    // Auto-select template based on request type
    const templateMap: Record<string, string> = {
      'vc_analysis': 'vc_analysis_v1',
      'content_generation': 'content_generation_v1',
      'persona_detection': 'persona_detection_v1',
      'text_rewrite': 'text_rewrite_v1'
    };
    templateId = templateMap[request.requestType];
  }

  if (!templateId) {
    throw new BedrockError({
      code: 'TEMPLATE_NOT_FOUND',
      message: `No template found for request type: ${request.requestType}`,
      retryable: false,
    });
  }

  // Validate template variables
  if (request.templateVariables) {
    const variableValidator = new TemplateVariableValidator();
    const validation = variableValidator.validateVariables(templateId, request.templateVariables);
    
    if (!validation.valid) {
      const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
      if (criticalErrors.length > 0) {
        throw new BedrockError({
          code: 'TEMPLATE_VALIDATION_FAILED',
          message: `Template validation failed: ${criticalErrors.map(e => e.message).join(', ')}`,
          retryable: false,
        });
      }
      
      warnings.push(...validation.errors.map(e => e.message));
    }
    
    warnings.push(...validation.warnings.map(w => w.message));
  }

  // Get template and generate prompt
  const template = templateRegistry.getTemplate(templateId);
  if (!template) {
    throw new BedrockError({
      code: 'TEMPLATE_NOT_FOUND',
      message: `Template ${templateId} not found in registry`,
      retryable: false,
    });
  }

  // Create template instance and generate prompt
  const contract = createPromptContract(request.requestType, request.userId);
  let templateInstance;

  switch (request.requestType) {
    case 'vc_analysis':
      templateInstance = new VCAnalysisTemplate(contract);
      break;
    case 'content_generation':
      templateInstance = new ContentGenerationTemplate(contract);
      break;
    case 'persona_detection':
      templateInstance = new PersonaDetectionTemplate(contract);
      break;
    case 'text_rewrite':
      templateInstance = new TextRewriteTemplate(contract);
      break;
    default:
      throw new BedrockError({
        code: 'UNSUPPORTED_REQUEST_TYPE',
        message: `Unsupported request type: ${request.requestType}`,
        retryable: false,
      });
  }

  const prompt = templateInstance.generate(request.templateVariables || {});
  
  return { prompt, warnings, templateId };
}

/**
 * Log AI operation to DynamoDB for audit trail
 */
async function logAIOperation(
  request: BedrockRequest,
  response: BedrockResponse | null,
  error: BedrockError | null
): Promise<void> {
  try {
    const logEntry = {
      request_id: { S: response?.requestId || `error-${Date.now()}` },
      timestamp: { S: new Date().toISOString() },
      request_type: { S: request.requestType },
      user_id: { S: request.userId || 'anonymous' },
      session_id: { S: request.sessionId || 'none' },
      model_id: { S: MODEL_ID },
      input_tokens: { N: response?.tokenUsage.inputTokens.toString() || '0' },
      output_tokens: { N: response?.tokenUsage.outputTokens.toString() || '0' },
      total_tokens: { N: response?.tokenUsage.totalTokens.toString() || '0' },
      estimated_cost: { N: response?.cost?.toString() || '0' },
      success: { BOOL: error === null },
      error_code: { S: error?.code || 'none' },
      error_message: { S: error?.message || 'none' },
      // Redacted prompt (remove sensitive data)
      prompt_hash: { S: hashString(request.prompt) },
      response_length: { N: response?.content.length.toString() || '0' },
    };

    const command = new PutItemCommand({
      TableName: 'bedrock_agent_logs',
      Item: logEntry,
    });

    await dynamoClient.send(command);
  } catch (logError) {
    console.error('Failed to log AI operation:', logError);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Simple hash function for prompt logging
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Calculate estimated cost based on token usage
 * Claude 3.5 Sonnet pricing (as of 2024): $3/1M input tokens, $15/1M output tokens
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000000) * 3.0;
  const outputCost = (outputTokens / 1000000) * 15.0;
  return inputCost + outputCost;
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_BASE
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-retryable errors
      if (error instanceof BedrockError && !error.retryable) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Main function to invoke Bedrock with Claude 3.5 Sonnet (with circuit breaker)
 */
export async function invokeBedrock(request: BedrockRequest): Promise<BedrockResponse | FallbackResponse> {
  const serviceKey = `bedrock-${request.requestType}`;
  
  return withCircuitBreaker(
    serviceKey,
    () => invokeBedrockInternal(request),
    request.requestType
  );
}

/**
 * Internal Bedrock invocation function (wrapped by circuit breaker)
 */
async function invokeBedrockInternal(request: BedrockRequest): Promise<BedrockResponse> {
  const startTime = Date.now();
  let response: BedrockResponse | null = null;
  let error: BedrockError | null = null;
  
  try {
    // Build secure prompt with guards and PII redaction
    const { prompt: securePrompt, warnings, redactionResult, templateUsed } = await buildSecurePromptWithGuards(request);
    
    // Log any security warnings
    if (warnings.length > 0) {
      console.warn('Security warnings for request:', warnings);
    }
    
    // Prepare Bedrock request
    const bedrockRequest: InvokeModelCommandInput = {
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: request.maxTokens || 4000,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 0.9,
        messages: [
          {
            role: 'user',
            content: securePrompt,
          },
        ],
      }),
    };
    
    // Invoke with retry logic
    const bedrockResponse = await retryWithBackoff(async () => {
      const command = new InvokeModelCommand(bedrockRequest);
      return await bedrockClient.send(command);
    });
    
    if (!bedrockResponse.body) {
      throw new BedrockError({
        code: 'EMPTY_RESPONSE',
        message: 'Bedrock returned empty response body',
        requestId: bedrockResponse.$metadata.requestId,
        retryable: true,
      });
    }
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    
    if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
      throw new BedrockError({
        code: 'INVALID_RESPONSE_FORMAT',
        message: 'Bedrock response missing expected content structure',
        requestId: bedrockResponse.$metadata.requestId,
        retryable: false,
      });
    }
    
    const inputTokens = responseBody.usage?.input_tokens || 0;
    const outputTokens = responseBody.usage?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    
    response = {
      content: responseBody.content[0].text,
      tokenUsage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
      requestId: bedrockResponse.$metadata.requestId || `req-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cost: calculateCost(inputTokens, outputTokens),
      piiRedacted: redactionResult?.piiDetected || false,
      redactionReport: redactionResult ? generateRedactionReport(
        redactionResult,
        bedrockResponse.$metadata.requestId || `req-${Date.now()}`,
        request.userId
      ) : undefined,
      templateUsed,
    };
    
    console.log(`Bedrock request completed in ${Date.now() - startTime}ms`, {
      requestId: response.requestId,
      tokens: totalTokens,
      cost: response.cost,
    });
    
    return response;
    
  } catch (err) {
    console.error('Bedrock invocation failed:', err);
    
    if (err instanceof BedrockError) {
      error = err;
    } else {
      error = {
        code: 'UNKNOWN_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        retryable: true,
      };
    }
    
    throw error;
  } finally {
    // Always log the operation for audit trail
    await logAIOperation(request, response, error);
  }
}

/**
 * Health check function for Bedrock connectivity (includes circuit breaker metrics)
 */
export async function healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
  try {
    const testRequest: BedrockRequest = {
      prompt: 'Antworte nur mit "OK" wenn du funktionierst.',
      maxTokens: 10,
      temperature: 0,
      requestType: 'vc_analysis',
      sessionId: 'health-check',
    };
    
    const response = await invokeBedrock(testRequest);
    
    return {
      status: 'healthy',
      details: {
        responseTime: Date.now(),
        tokenUsage: isFallbackResponse(response) ? null : response.tokenUsage,
        modelId: MODEL_ID,
        fallbackUsed: isFallbackResponse(response),
        circuitBreakerMetrics: getCircuitBreakerMetrics(),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        circuitBreakerMetrics: getCircuitBreakerMetrics(),
      },
    };
  }
}