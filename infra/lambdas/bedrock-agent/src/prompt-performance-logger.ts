/**
 * Prompt Performance Logger
 * Tracks prompt performance metrics for optimization and monitoring
 */

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { createHash } from 'crypto';
import { TemplateVariables } from './prompt-templates';

// Performance metrics interface
export interface PromptPerformanceMetrics {
  prompt_hash: string;
  template_id: string;
  template_version: string;
  persona_id?: string;
  user_id?: string;
  session_id?: string;
  timestamp: string;
  prompt_length: number;
  variable_count: number;
  tokens_sent: number;
  tokens_received: number;
  total_tokens: number;
  response_time_ms: number;
  cost_estimate: number;
  security_score: number;
  success: boolean;
  error_code?: string;
  feature_flags?: Record<string, boolean>;
}

export interface PromptHashData {
  template_id: string;
  resolved_variables: Record<string, any>;
  persona_id?: string;
  feature_flags?: Record<string, boolean>;
}

/**
 * Prompt Performance Logger Class
 */
export class PromptPerformanceLogger {
  private dynamoClient: DynamoDBClient;
  private tableName: string;
  private enabled: boolean;

  constructor(region: string = 'eu-central-1') {
    this.dynamoClient = new DynamoDBClient({ region });
    this.tableName = process.env.PROMPT_PERFORMANCE_TABLE || 'prompt_performance_metrics';
    this.enabled = process.env.PROMPT_PERFORMANCE_LOGGING !== 'false';
  }

  /**
   * Generate SHA-256 hash for prompt identification
   */
  generatePromptHash(data: PromptHashData): string {
    const hashInput = JSON.stringify({
      template_id: data.template_id,
      resolved_variables: this.sanitizeVariables(data.resolved_variables),
      persona_id: data.persona_id,
      feature_flags: data.feature_flags || {}
    }, Object.keys(data).sort()); // Deterministic key order

    return createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  /**
   * Sanitize variables for hashing (remove PII, keep structure)
   */
  private sanitizeVariables(variables: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(variables).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Hash sensitive-looking values, keep structure for others
        if (this.isPotentiallySensitive(key, value)) {
          sanitized[key] = createHash('md5').update(value).digest('hex').substring(0, 8);
        } else {
          sanitized[key] = value.length > 50 ? `${value.substring(0, 50)}...` : value;
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeVariables(value);
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  /**
   * Check if a key-value pair might contain sensitive information
   */
  private isPotentiallySensitive(key: string, value: string): boolean {
    const sensitiveKeys = ['email', 'phone', 'address', 'name', 'owner'];
    const sensitivePatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ // Credit card
    ];

    // Check key names
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      return true;
    }

    // Check value patterns
    return sensitivePatterns.some(pattern => pattern.test(value));
  }

  /**
   * Log prompt performance metrics
   */
  async logPerformance(metrics: PromptPerformanceMetrics): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const item = {
        prompt_hash: { S: metrics.prompt_hash },
        template_id: { S: metrics.template_id },
        template_version: { S: metrics.template_version },
        timestamp: { S: metrics.timestamp },
        prompt_length: { N: metrics.prompt_length.toString() },
        variable_count: { N: metrics.variable_count.toString() },
        tokens_sent: { N: metrics.tokens_sent.toString() },
        tokens_received: { N: metrics.tokens_received.toString() },
        total_tokens: { N: metrics.total_tokens.toString() },
        response_time_ms: { N: metrics.response_time_ms.toString() },
        cost_estimate: { N: metrics.cost_estimate.toString() },
        security_score: { N: metrics.security_score.toString() },
        success: { BOOL: metrics.success }
      };

      // Add optional fields
      if (metrics.persona_id) {
        item['persona_id'] = { S: metrics.persona_id };
      }
      if (metrics.user_id) {
        item['user_id'] = { S: metrics.user_id };
      }
      if (metrics.session_id) {
        item['session_id'] = { S: metrics.session_id };
      }
      if (metrics.error_code) {
        item['error_code'] = { S: metrics.error_code };
      }
      if (metrics.feature_flags) {
        item['feature_flags'] = { S: JSON.stringify(metrics.feature_flags) };
      }

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: item
      });

      await this.dynamoClient.send(command);

      // Log summary for CloudWatch
      console.log('Prompt performance logged:', {
        hash: metrics.prompt_hash,
        template: metrics.template_id,
        persona: metrics.persona_id,
        tokens: metrics.total_tokens,
        time: metrics.response_time_ms,
        cost: metrics.cost_estimate
      });

    } catch (error) {
      console.error('Failed to log prompt performance:', error);
      // Don't throw - logging failure shouldn't break main operation
    }
  }

  /**
   * Get performance statistics for a template
   */
  async getTemplatePerformanceStats(templateId: string, days: number = 7): Promise<{
    avg_tokens: number;
    avg_response_time: number;
    avg_cost: number;
    success_rate: number;
    total_requests: number;
  }> {
    // This would require a more complex DynamoDB query with GSI
    // For now, return placeholder data
    console.log(`Getting performance stats for ${templateId} over ${days} days`);
    
    return {
      avg_tokens: 2500,
      avg_response_time: 15000,
      avg_cost: 0.045,
      success_rate: 0.97,
      total_requests: 150
    };
  }

  /**
   * Get persona-specific performance comparison
   */
  async getPersonaPerformanceComparison(days: number = 7): Promise<Record<string, {
    avg_tokens: number;
    avg_response_time: number;
    avg_cost: number;
    complexity_score: number;
  }>> {
    // Placeholder implementation - would query DynamoDB with persona filter
    return {
      'Der Skeptiker': {
        avg_tokens: 3200,
        avg_response_time: 18000,
        avg_cost: 0.058,
        complexity_score: 8.5
      },
      'Der Überforderte': {
        avg_tokens: 1800,
        avg_response_time: 12000,
        avg_cost: 0.032,
        complexity_score: 4.2
      },
      'Der Profi': {
        avg_tokens: 4500,
        avg_response_time: 22000,
        avg_cost: 0.078,
        complexity_score: 9.8
      },
      'Der Zeitknappe': {
        avg_tokens: 2100,
        avg_response_time: 14000,
        avg_cost: 0.038,
        complexity_score: 5.5
      }
    };
  }

  /**
   * Identify optimization opportunities
   */
  async getOptimizationRecommendations(templateId: string): Promise<{
    recommendations: string[];
    potential_savings: {
      tokens: number;
      cost_percent: number;
      time_ms: number;
    };
  }> {
    const stats = await this.getTemplatePerformanceStats(templateId);
    const recommendations: string[] = [];
    const potential_savings = { tokens: 0, cost_percent: 0, time_ms: 0 };

    // Analyze performance and suggest optimizations
    if (stats.avg_tokens > 4000) {
      recommendations.push('Template ist sehr lang - prüfen Sie Kürzungsmöglichkeiten');
      potential_savings.tokens += 500;
      potential_savings.cost_percent += 12;
    }

    if (stats.avg_response_time > 20000) {
      recommendations.push('Lange Antwortzeiten - Template-Komplexität reduzieren');
      potential_savings.time_ms += 3000;
    }

    if (stats.success_rate < 0.95) {
      recommendations.push('Niedrige Erfolgsrate - Template-Validierung verbessern');
    }

    if (stats.avg_cost > 0.06) {
      recommendations.push('Hohe Kosten pro Request - Prompt-Effizienz optimieren');
      potential_savings.cost_percent += 15;
    }

    return { recommendations, potential_savings };
  }
}

/**
 * Template Builder with Performance Logging
 */
export class PerformanceAwareTemplateBuilder {
  private performanceLogger: PromptPerformanceLogger;

  constructor() {
    this.performanceLogger = new PromptPerformanceLogger();
  }

  /**
   * Build template with performance tracking
   */
  async buildTemplateWithTracking(
    templateId: string,
    templateVersion: string,
    variables: TemplateVariables,
    personaId?: string,
    userId?: string,
    sessionId?: string,
    featureFlags?: Record<string, boolean>
  ): Promise<{
    prompt: string;
    hash: string;
    startTime: number;
  }> {
    const startTime = Date.now();
    
    // Generate prompt hash
    const hash = this.performanceLogger.generatePromptHash({
      template_id: templateId,
      resolved_variables: variables,
      persona_id: personaId,
      feature_flags: featureFlags
    });

    // Build prompt (this would integrate with actual template building)
    const prompt = `Generated prompt for ${templateId} with hash ${hash}`;

    return { prompt, hash, startTime };
  }

  /**
   * Complete performance logging after response
   */
  async completePerformanceLog(
    hash: string,
    templateId: string,
    templateVersion: string,
    startTime: number,
    promptLength: number,
    variableCount: number,
    tokensSent: number,
    tokensReceived: number,
    cost: number,
    securityScore: number,
    success: boolean,
    errorCode?: string,
    personaId?: string,
    userId?: string,
    sessionId?: string,
    featureFlags?: Record<string, boolean>
  ): Promise<void> {
    const responseTime = Date.now() - startTime;

    const metrics: PromptPerformanceMetrics = {
      prompt_hash: hash,
      template_id: templateId,
      template_version: templateVersion,
      persona_id: personaId,
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      prompt_length: promptLength,
      variable_count: variableCount,
      tokens_sent: tokensSent,
      tokens_received: tokensReceived,
      total_tokens: tokensSent + tokensReceived,
      response_time_ms: responseTime,
      cost_estimate: cost,
      security_score: securityScore,
      success: success,
      error_code: errorCode,
      feature_flags: featureFlags
    };

    await this.performanceLogger.logPerformance(metrics);
  }
}

// Export singleton instance
export const promptPerformanceLogger = new PromptPerformanceLogger();
export const performanceAwareBuilder = new PerformanceAwareTemplateBuilder();