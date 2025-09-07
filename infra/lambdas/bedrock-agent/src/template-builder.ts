/**
 * Safe Template Builder with JSON Validation and Repair
 * Production-grade template instantiation and output validation
 */

import { templateRegistry, TemplateVariables } from './prompt-templates';
import { 
  validateVCAnalysis, 
  validatePersonaDetection, 
  validateContentGeneration,
  safeValidateJson,
  VCAnalysisOutput,
  PersonaDetectionOutput,
  ContentGenerationOutput,
  ValidationResult
} from './output-contracts';
import { sanitizeTemplateVariable } from './persona-config';

/**
 * Safe template instantiation from registry
 */
export function buildPrompt(templateId: string, vars: TemplateVariables): string {
  const template = templateRegistry.getTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const version = template.versions[template.currentVersion];
  if (!version) {
    throw new Error(`Template version not found: ${templateId}@${template.currentVersion}`);
  }

  const contract = template.defaultContract;
  const instance = new version.templateCtor(contract);

  // Validate required variables
  const { valid, missing } = templateRegistry.validateTemplateVariables(templateId, vars);
  if (!valid) {
    throw new Error(`Missing required variables for ${templateId}: ${missing.join(', ')}`);
  }

  // Sanitize variables
  const sanitizedVars: TemplateVariables = {};
  Object.entries(vars).forEach(([key, value]) => {
    sanitizedVars[key as keyof TemplateVariables] = sanitizeTemplateVariable(key, value);
  });

  return instance.generate(sanitizedVars);
}

/**
 * Bedrock client with JSON repair loop
 */
export class BedrockClientWithRepair {
  private maxRepairAttempts = 2;

  constructor(private bedrockClient: any) {}

  /**
   * Invoke Bedrock with automatic JSON validation and repair
   */
  async invokeWithValidation<T>(
    prompt: string,
    outputType: 'vc_analysis' | 'persona_detection' | 'content_generation',
    modelParams?: any
  ): Promise<ValidationResult<T>> {
    const validator = this.getValidator(outputType);
    const schemaName = this.getSchemaName(outputType);

    let attempt = 0;
    let lastOutput = '';

    while (attempt <= this.maxRepairAttempts) {
      try {
        const currentPrompt = attempt === 0 ? prompt : this.buildRepairPrompt(prompt, lastOutput, schemaName);
        
        // Invoke Bedrock
        const response = await this.bedrockClient.invoke({
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: this.getMaxTokensForOutput(outputType),
            messages: [
              {
                role: 'user',
                content: currentPrompt
              }
            ],
            temperature: 0.1,
            ...modelParams
          })
        });

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        lastOutput = responseBody.content[0].text;

        // Validate output
        const result = await safeValidateJson<T>(
          lastOutput,
          validator,
          schemaName,
          prompt,
          attempt < this.maxRepairAttempts ? (repairPrompt) => this.invokeRepair(repairPrompt) : undefined
        );

        if (result.valid) {
          return result;
        }

        if (attempt === this.maxRepairAttempts) {
          console.error(`Failed to repair JSON after ${this.maxRepairAttempts} attempts:`, result.errors);
          return result;
        }

        attempt++;
      } catch (error) {
        console.error(`Bedrock invocation attempt ${attempt + 1} failed:`, error);
        
        if (attempt === this.maxRepairAttempts) {
          return {
            valid: false,
            errors: [`Bedrock invocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
          };
        }
        
        attempt++;
      }
    }

    return {
      valid: false,
      errors: ['Maximum repair attempts exceeded']
    };
  }

  /**
   * Invoke repair prompt
   */
  private async invokeRepair(repairPrompt: string): Promise<string> {
    const response = await this.bedrockClient.invoke({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: repairPrompt
          }
        ],
        temperature: 0.0 // Very low temperature for repair
      })
    });

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0].text;
  }

  /**
   * Build repair prompt for invalid JSON
   */
  private buildRepairPrompt(originalPrompt: string, invalidOutput: string, schemaName: string): string {
    return `
🔧 JSON REPAIR MODE - CRITICAL

Your previous output was invalid. You MUST fix it immediately.

ORIGINAL PROMPT:
${originalPrompt}

INVALID OUTPUT:
${invalidOutput}

REPAIR INSTRUCTIONS:
1. Output ONLY valid JSON matching the ${schemaName} schema
2. Fix all validation errors
3. NO explanations, NO markdown, NO additional text
4. Start with { and end with }
5. Ensure all required fields are present
6. Respect all maxLength, maxItems, and enum constraints

REPAIRED JSON:`;
  }

  /**
   * Get validator for output type
   */
  private getValidator(outputType: string) {
    switch (outputType) {
      case 'vc_analysis':
        return validateVCAnalysis;
      case 'persona_detection':
        return validatePersonaDetection;
      case 'content_generation':
        return validateContentGeneration;
      default:
        throw new Error(`Unknown output type: ${outputType}`);
    }
  }

  /**
   * Get schema name for output type
   */
  private getSchemaName(outputType: string): string {
    switch (outputType) {
      case 'vc_analysis':
        return 'VC_ANALYSIS_SCHEMA';
      case 'persona_detection':
        return 'PERSONA_DETECTION_SCHEMA';
      case 'content_generation':
        return 'CONTENT_GENERATION_SCHEMA';
      default:
        return 'UNKNOWN_SCHEMA';
    }
  }

  /**
   * Get max tokens based on output type and persona
   */
  private getMaxTokensForOutput(outputType: string, persona?: string): number {
    const baseTokens = {
      'vc_analysis': 2000,
      'persona_detection': 800,
      'content_generation': 1200
    };

    let tokens = baseTokens[outputType as keyof typeof baseTokens] || 1500;

    // Adjust for persona if provided
    if (persona === 'Der Zeitknappe') {
      tokens = Math.min(tokens, 600);
    } else if (persona === 'Der Überforderte') {
      tokens = Math.min(tokens, 1000);
    }

    return tokens;
  }
}

/**
 * High-level template execution with validation
 */
export async function executeTemplate<T>(
  templateId: string,
  variables: TemplateVariables,
  outputType: 'vc_analysis' | 'persona_detection' | 'content_generation',
  bedrockClient: any,
  modelParams?: any
): Promise<ValidationResult<T>> {
  try {
    // Build prompt
    const prompt = buildPrompt(templateId, variables);
    
    // Execute with validation
    const client = new BedrockClientWithRepair(bedrockClient);
    return await client.invokeWithValidation<T>(prompt, outputType, modelParams);
    
  } catch (error) {
    return {
      valid: false,
      errors: [`Template execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Batch template execution with error handling
 */
export async function executeBatchTemplates<T>(
  requests: Array<{
    templateId: string;
    variables: TemplateVariables;
    outputType: 'vc_analysis' | 'persona_detection' | 'content_generation';
  }>,
  bedrockClient: any,
  concurrency: number = 3
): Promise<Array<ValidationResult<T>>> {
  const results: Array<ValidationResult<T>> = [];
  
  // Process in batches to avoid overwhelming Bedrock
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    
    const batchPromises = batch.map(request =>
      executeTemplate<T>(
        request.templateId,
        request.variables,
        request.outputType,
        bedrockClient
      ).catch(error => ({
        valid: false,
        errors: [`Batch execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      } as ValidationResult<T>))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Template performance monitoring
 */
export class TemplatePerformanceMonitor {
  private metrics: Map<string, {
    totalExecutions: number;
    successfulExecutions: number;
    averageLatency: number;
    repairAttempts: number;
  }> = new Map();

  recordExecution(
    templateId: string,
    success: boolean,
    latencyMs: number,
    repairAttempts: number = 0
  ): void {
    const existing = this.metrics.get(templateId) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageLatency: 0,
      repairAttempts: 0
    };

    existing.totalExecutions++;
    if (success) existing.successfulExecutions++;
    existing.averageLatency = (existing.averageLatency * (existing.totalExecutions - 1) + latencyMs) / existing.totalExecutions;
    existing.repairAttempts += repairAttempts;

    this.metrics.set(templateId, existing);
  }

  getMetrics(templateId?: string) {
    if (templateId) {
      return this.metrics.get(templateId);
    }
    return Object.fromEntries(this.metrics.entries());
  }

  getSuccessRate(templateId: string): number {
    const metrics = this.metrics.get(templateId);
    if (!metrics || metrics.totalExecutions === 0) return 0;
    return metrics.successfulExecutions / metrics.totalExecutions;
  }
}

// Export singleton monitor
export const templatePerformanceMonitor = new TemplatePerformanceMonitor();