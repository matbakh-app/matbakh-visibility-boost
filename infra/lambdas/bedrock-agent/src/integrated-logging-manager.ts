/**
 * Integrated Logging Manager
 * 
 * Central orchestrator for all logging, security, and compliance systems.
 * Provides a unified interface for the Bedrock AI Core logging requirements.
 */

import { loggingSystem, AIOperationLog } from './logging-system';
import { piiDetectionSystem, PIIDetectionResult } from './pii-detection-system';
import { auditTrailSystem } from './audit-trail-system';
import { logRetentionSystem } from './log-retention-system';
import { postgresArchiveSystem } from './postgresql-archive-system';
import { randomUUID } from 'crypto';

export interface LoggingConfiguration {
  enable_cloudwatch: boolean;
  enable_dynamodb: boolean;
  enable_postgresql_archive: boolean;
  enable_pii_detection: boolean;
  enable_audit_trail: boolean;
  pii_detection_threshold: number;
  auto_anonymize: boolean;
  retention_policy: string;
  compliance_mode: 'strict' | 'standard' | 'minimal';
}

export interface AIOperationContext {
  operation_id?: string;
  user_id?: string;
  lead_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  persona_type?: string;
  request_source: 'web' | 'api' | 'internal';
}

export interface LoggingResult {
  operation_id: string;
  logged_successfully: boolean;
  pii_detected: boolean;
  compliance_status: 'compliant' | 'warning' | 'violation';
  actions_taken: string[];
  warnings: string[];
  errors: string[];
}

export class IntegratedLoggingManager {
  private config: LoggingConfiguration;

  constructor(config?: Partial<LoggingConfiguration>) {
    this.config = {
      enable_cloudwatch: true,
      enable_dynamodb: true,
      enable_postgresql_archive: true,
      enable_pii_detection: true,
      enable_audit_trail: true,
      pii_detection_threshold: 0.5,
      auto_anonymize: true,
      retention_policy: 'ai_operation_logs',
      compliance_mode: 'strict',
      ...config
    };
  }

  /**
   * Main method to log AI operations with full compliance checking
   */
  async logAIOperation(params: {
    operation_type: 'visibility_check' | 'content_generation' | 'persona_detection' | 'framework_analysis';
    provider: 'claude-3.5-sonnet' | 'gemini-pro' | 'gpt-4';
    prompt: string;
    response: string;
    token_usage: {
      input_tokens: number;
      output_tokens: number;
      total_cost_usd: number;
    };
    execution_time_ms: number;
    status: 'success' | 'error' | 'timeout' | 'rate_limited';
    error_message?: string;
    context: AIOperationContext;
  }): Promise<LoggingResult> {
    const operationId = params.context.operation_id || randomUUID();
    const timestamp = new Date().toISOString();
    
    const result: LoggingResult = {
      operation_id: operationId,
      logged_successfully: false,
      pii_detected: false,
      compliance_status: 'compliant',
      actions_taken: [],
      warnings: [],
      errors: []
    };

    try {
      // Step 1: PII Detection and Analysis
      let piiResult: PIIDetectionResult | null = null;
      if (this.config.enable_pii_detection) {
        const combinedContent = `${params.prompt}\n${params.response}`;
        piiResult = piiDetectionSystem.detectPII(combinedContent);
        result.pii_detected = piiResult.detected;

        if (piiResult.detected) {
          result.actions_taken.push('PII detected and flagged');
          
          if (piiResult.detection_metadata.highest_confidence > this.config.pii_detection_threshold) {
            result.compliance_status = 'warning';
            result.warnings.push(`High-confidence PII detected: ${piiResult.fields.join(', ')}`);
          }

          // Log PII detection event
          if (this.config.enable_audit_trail) {
            await auditTrailSystem.logPIIDetection({
              operation_id: operationId,
              content_hash: this.generateContentHash(combinedContent),
              pii_categories: piiResult.detection_metadata.categories_found,
              risk_score: piiResult.detection_metadata.highest_confidence,
              actions_taken: ['Content flagged', 'Redaction applied']
            });
            result.actions_taken.push('PII detection logged to audit trail');
          }
        }
      }

      // Step 2: Prepare sanitized content for logging
      const sanitizedPrompt = piiResult ? piiResult.redacted_content.split('\n')[0] : params.prompt;
      const sanitizedResponse = piiResult ? piiResult.redacted_content.split('\n')[1] || '' : params.response;

      // Step 3: Create comprehensive AI operation log
      const aiLog: AIOperationLog = {
        operation_id: operationId,
        timestamp,
        operation_type: params.operation_type,
        user_id: params.context.user_id,
        lead_id: params.context.lead_id,
        provider: params.provider,
        prompt_hash: this.generateContentHash(params.prompt),
        token_usage: params.token_usage,
        execution_time_ms: params.execution_time_ms,
        status: params.status,
        error_message: params.error_message,
        response_hash: this.generateContentHash(params.response),
        pii_detected: result.pii_detected,
        redacted_fields: piiResult?.fields || [],
        compliance_flags: {
          gdpr_compliant: this.assessGDPRCompliance(result.pii_detected, params.context),
          data_retention_days: this.getRetentionDays(params.operation_type),
          anonymization_required: result.pii_detected && this.config.auto_anonymize
        }
      };

      // Step 4: Multi-destination logging
      if (this.config.enable_cloudwatch || this.config.enable_dynamodb) {
        await loggingSystem.logAIOperation(aiLog);
        result.actions_taken.push('Logged to CloudWatch and DynamoDB');
      }

      // Step 5: PostgreSQL archiving for GDPR compliance
      if (this.config.enable_postgresql_archive && aiLog.compliance_flags.gdpr_compliant) {
        await postgresArchiveSystem.archiveAIOperation({
          operation_id: operationId,
          timestamp,
          operation_type: params.operation_type,
          user_id: params.context.user_id,
          provider: params.provider,
          token_usage: params.token_usage,
          execution_time_ms: params.execution_time_ms,
          status: params.status,
          pii_detected: result.pii_detected,
          compliance_flags: aiLog.compliance_flags
        });
        result.actions_taken.push('Archived to PostgreSQL for GDPR compliance');
      }

      // Step 6: Audit trail logging
      if (this.config.enable_audit_trail) {
        await auditTrailSystem.logAIOperation({
          operation_id: operationId,
          user_id: params.context.user_id,
          operation_type: params.operation_type,
          provider: params.provider,
          prompt_hash: aiLog.prompt_hash,
          pii_detected: result.pii_detected,
          outcome: params.status === 'success' ? 'success' : 'failure',
          error_message: params.error_message
        });
        result.actions_taken.push('Logged to audit trail');
      }

      // Step 7: Compliance assessment
      result.compliance_status = this.assessOverallCompliance(result, params.context);
      result.logged_successfully = true;

    } catch (error) {
      result.errors.push(`Logging failed: ${error.message}`);
      result.compliance_status = 'violation';
      
      // Fallback logging
      console.error('LOGGING_SYSTEM_ERROR:', {
        operation_id: operationId,
        error: error.message,
        context: params.context
      });
    }

    return result;
  }

  /**
   * Log user data access for GDPR compliance
   */
  async logDataAccess(params: {
    user_id: string;
    resource_type: string;
    resource_id: string;
    action: 'read' | 'write' | 'delete' | 'export';
    ip_address?: string;
    user_agent?: string;
    success: boolean;
  }): Promise<void> {
    if (!this.config.enable_audit_trail) return;

    await auditTrailSystem.logDataAccess({
      user_id: params.user_id,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      action: params.action,
      outcome: params.success ? 'success' : 'failure',
      ip_address: params.ip_address,
      user_agent: params.user_agent
    });
  }

  /**
   * Handle user consent tracking
   */
  async trackUserConsent(params: {
    user_id: string;
    consent_type: string;
    granted: boolean;
    ip_address?: string;
    user_agent?: string;
    processing_purposes?: string[];
  }): Promise<void> {
    // Log to audit trail
    if (this.config.enable_audit_trail) {
      await auditTrailSystem.logUserConsent({
        user_id: params.user_id,
        consent_type: params.consent_type,
        granted: params.granted,
        ip_address: params.ip_address
      });
    }

    // Archive to PostgreSQL
    if (this.config.enable_postgresql_archive) {
      await postgresArchiveSystem.trackUserConsent({
        user_id: params.user_id,
        consent_type: params.consent_type,
        granted: params.granted,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        processing_purposes: params.processing_purposes || ['AI analysis', 'Business recommendations']
      });
    }
  }

  /**
   * Handle data subject requests (GDPR Articles 15-22)
   */
  async handleDataSubjectRequest(params: {
    request_type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
    data_subject_id: string;
    requester_ip?: string;
    additional_info?: any;
  }): Promise<any> {
    if (!this.config.enable_postgresql_archive) {
      throw new Error('PostgreSQL archive system required for data subject requests');
    }

    switch (params.request_type) {
      case 'access':
        return await postgresArchiveSystem.handleDataSubjectAccessRequest(params.data_subject_id);
      
      case 'erasure':
        return await postgresArchiveSystem.handleDataSubjectErasureRequest(
          params.data_subject_id,
          params.additional_info?.reason || 'User request'
        );
      
      default:
        throw new Error(`Data subject request type ${params.request_type} not yet implemented`);
    }
  }

  /**
   * Execute log cleanup based on retention policies
   */
  async executeLogCleanup(policyName?: string): Promise<any> {
    if (!this.config.enable_postgresql_archive) {
      return { message: 'Cleanup requires PostgreSQL archive system' };
    }

    const cleanupJobs = await logRetentionSystem.executeCleanup(policyName);
    const pgCleanup = await postgresArchiveSystem.cleanupExpiredRecords();

    return {
      retention_jobs: cleanupJobs,
      postgresql_cleanup: pgCleanup,
      total_processed: cleanupJobs.reduce((sum, job) => sum + job.processed_records, 0)
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: string, endDate: string): Promise<any> {
    if (!this.config.enable_audit_trail) {
      throw new Error('Audit trail system required for compliance reports');
    }

    return await auditTrailSystem.generateComplianceReport(startDate, endDate);
  }

  /**
   * Get operation statistics
   */
  async getOperationStatistics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    return await loggingSystem.getOperationStats(timeframe);
  }

  /**
   * Validate content safety before AI processing
   */
  validateContentSafety(content: string): {
    safe: boolean;
    risk_score: number;
    recommendations: string[];
  } {
    if (!this.config.enable_pii_detection) {
      return { safe: true, risk_score: 0, recommendations: [] };
    }

    return piiDetectionSystem.validateContentSafety(content);
  }

  /**
   * Private helper methods
   */
  private generateContentHash(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  private assessGDPRCompliance(piiDetected: boolean, context: AIOperationContext): boolean {
    // Implement GDPR compliance assessment logic
    if (this.config.compliance_mode === 'strict' && piiDetected && !context.user_id) {
      return false; // Cannot process PII without user identification
    }
    return true;
  }

  private getRetentionDays(operationType: string): number {
    const retentionMap = {
      'visibility_check': 365,
      'content_generation': 180,
      'persona_detection': 90,
      'framework_analysis': 365
    };
    return retentionMap[operationType] || 365;
  }

  private assessOverallCompliance(result: LoggingResult, context: AIOperationContext): 'compliant' | 'warning' | 'violation' {
    if (result.errors.length > 0) return 'violation';
    if (result.warnings.length > 0) return 'warning';
    if (result.pii_detected && this.config.compliance_mode === 'strict' && !context.user_id) {
      return 'violation';
    }
    return 'compliant';
  }

  /**
   * Update configuration
   */
  updateConfiguration(updates: Partial<LoggingConfiguration>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): LoggingConfiguration {
    return { ...this.config };
  }
}

// Export singleton instance
export const integratedLoggingManager = new IntegratedLoggingManager();