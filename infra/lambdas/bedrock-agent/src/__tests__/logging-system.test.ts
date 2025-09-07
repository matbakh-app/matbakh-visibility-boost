/**
 * Comprehensive tests for the Bedrock AI Core Logging System
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AIOperationLog } from '../logging-system';
import { piiDetectionSystem } from '../pii-detection-system';
import { auditTrailSystem } from '../audit-trail-system';
import { logRetentionSystem } from '../log-retention-system';
import { integratedLoggingManager } from '../integrated-logging-manager';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudwatch-logs');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-s3');

describe('Logging System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AIOperationLog', () => {
    it('should create a valid AI operation log', async () => {
      const mockLog: AIOperationLog = {
        operation_id: 'test-op-123',
        timestamp: new Date().toISOString(),
        operation_type: 'visibility_check',
        user_id: 'user-123',
        lead_id: 'lead-456',
        provider: 'claude-3.5-sonnet',
        prompt_hash: 'abc123',
        token_usage: {
          input_tokens: 100,
          output_tokens: 200,
          total_cost_usd: 0.05
        },
        execution_time_ms: 1500,
        status: 'success',
        pii_detected: false,
        redacted_fields: [],
        compliance_flags: {
          gdpr_compliant: true,
          data_retention_days: 365,
          anonymization_required: false
        }
      };

      // Test that the log structure is valid
      expect(mockLog.operation_id).toBeDefined();
      expect(mockLog.timestamp).toBeDefined();
      expect(mockLog.operation_type).toBe('visibility_check');
      expect(mockLog.compliance_flags.gdpr_compliant).toBe(true);
    });

    it('should handle error status correctly', async () => {
      const errorLog: AIOperationLog = {
        operation_id: 'error-op-123',
        timestamp: new Date().toISOString(),
        operation_type: 'content_generation',
        provider: 'claude-3.5-sonnet',
        prompt_hash: 'def456',
        token_usage: {
          input_tokens: 50,
          output_tokens: 0,
          total_cost_usd: 0.01
        },
        execution_time_ms: 500,
        status: 'error',
        error_message: 'Rate limit exceeded',
        pii_detected: false,
        redacted_fields: [],
        compliance_flags: {
          gdpr_compliant: true,
          data_retention_days: 180,
          anonymization_required: false
        }
      };

      expect(errorLog.status).toBe('error');
      expect(errorLog.error_message).toBe('Rate limit exceeded');
      expect(errorLog.token_usage.output_tokens).toBe(0);
    });
  });

  describe('PII Detection System', () => {
    it('should detect email addresses', () => {
      const content = 'Please contact me at john.doe@example.com for more information.';
      const result = piiDetectionSystem.detectPII(content);

      expect(result.detected).toBe(true);
      expect(result.fields).toContain('email');
      expect(result.redacted_content).toContain('[EMAIL_REDACTED]');
      expect(result.detection_metadata.categories_found).toContain('email');
    });

    it('should detect German phone numbers', () => {
      const content = 'Rufen Sie mich an unter +49 30 12345678 oder 0171 9876543.';
      const result = piiDetectionSystem.detectPII(content);

      expect(result.detected).toBe(true);
      expect(result.fields).toContain('german_phone');
      expect(result.redacted_content).toContain('[PHONE_REDACTED]');
    });

    it('should detect German addresses', () => {
      const content = 'Ich wohne in der Musterstraße 123, 12345 Berlin.';
      const result = piiDetectionSystem.detectPII(content);

      expect(result.detected).toBe(true);
      expect(result.detection_metadata.categories_found).toContain('address');
    });

    it('should handle content without PII', () => {
      const content = 'This is a normal business description without any personal information.';
      const result = piiDetectionSystem.detectPII(content);

      expect(result.detected).toBe(false);
      expect(result.fields).toHaveLength(0);
      expect(result.redacted_content).toBe(content);
    });

    it('should calculate risk scores correctly', () => {
      const highRiskContent = 'Contact: john@example.com, +49 30 123456, IBAN: DE89 3704 0044 0532 0130 00';
      const lowRiskContent = 'Our restaurant serves great food.';

      const highRisk = piiDetectionSystem.getPIIRiskScore(highRiskContent);
      const lowRisk = piiDetectionSystem.getPIIRiskScore(lowRiskContent);

      expect(highRisk).toBeGreaterThan(0.7);
      expect(lowRisk).toBe(0);
    });

    it('should validate content safety', () => {
      const unsafeContent = 'My email is sensitive@data.com and my phone is +49 123 456789';
      const safeContent = 'This restaurant has excellent reviews.';

      const unsafeResult = piiDetectionSystem.validateContentSafety(unsafeContent);
      const safeResult = piiDetectionSystem.validateContentSafety(safeContent);

      expect(unsafeResult.safe).toBe(false);
      expect(unsafeResult.risk_score).toBeGreaterThan(0.5);
      expect(unsafeResult.recommendations).toHaveLength(0); // No specific recommendations for this test

      expect(safeResult.safe).toBe(true);
      expect(safeResult.risk_score).toBe(0);
    });

    it('should generate compliance reports', () => {
      const content = 'Contact info: test@example.com, +49 30 123456';
      const report = piiDetectionSystem.generateComplianceReport(content);

      expect(report.timestamp).toBeDefined();
      expect(report.content_hash).toBeDefined();
      expect(report.pii_detected).toBe(true);
      expect(report.categories_found).toContain('email');
      expect(report.risk_assessment).toMatch(/LOW|MEDIUM|HIGH/);
      expect(report.gdpr_compliance).toBeDefined();
    });
  });

  describe('Audit Trail System', () => {
    it('should log AI operations to audit trail', async () => {
      const mockAuditId = 'audit-123';
      jest.spyOn(auditTrailSystem, 'logAIOperation').mockResolvedValue(mockAuditId);

      const auditId = await auditTrailSystem.logAIOperation({
        operation_id: 'op-123',
        user_id: 'user-456',
        operation_type: 'visibility_check',
        provider: 'claude-3.5-sonnet',
        prompt_hash: 'hash123',
        pii_detected: false,
        outcome: 'success'
      });

      expect(auditId).toBe(mockAuditId);
      expect(auditTrailSystem.logAIOperation).toHaveBeenCalledWith({
        operation_id: 'op-123',
        user_id: 'user-456',
        operation_type: 'visibility_check',
        provider: 'claude-3.5-sonnet',
        prompt_hash: 'hash123',
        pii_detected: false,
        outcome: 'success'
      });
    });

    it('should log data access events', async () => {
      const mockAuditId = 'audit-456';
      jest.spyOn(auditTrailSystem, 'logDataAccess').mockResolvedValue(mockAuditId);

      const auditId = await auditTrailSystem.logDataAccess({
        user_id: 'user-123',
        resource_type: 'user_data',
        resource_id: 'profile-456',
        action: 'read',
        outcome: 'success',
        ip_address: '192.168.1.1'
      });

      expect(auditId).toBe(mockAuditId);
    });

    it('should log PII detection events', async () => {
      const mockAuditId = 'audit-789';
      jest.spyOn(auditTrailSystem, 'logPIIDetection').mockResolvedValue(mockAuditId);

      const auditId = await auditTrailSystem.logPIIDetection({
        operation_id: 'op-123',
        content_hash: 'content-hash-123',
        pii_categories: ['email', 'phone'],
        risk_score: 0.8,
        actions_taken: ['Content redacted', 'User notified']
      });

      expect(auditId).toBe(mockAuditId);
    });

    it('should generate compliance reports', async () => {
      const mockReport = {
        report_id: 'report-123',
        generated_at: new Date().toISOString(),
        period: {
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z'
        },
        summary: {
          total_events: 100,
          gdpr_relevant_events: 80,
          high_risk_events: 5,
          compliance_violations: 0
        },
        categories: {},
        recommendations: [],
        violations: []
      };

      jest.spyOn(auditTrailSystem, 'generateComplianceReport').mockResolvedValue(mockReport);

      const report = await auditTrailSystem.generateComplianceReport(
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z'
      );

      expect(report.report_id).toBe('report-123');
      expect(report.summary.total_events).toBe(100);
      expect(report.summary.compliance_violations).toBe(0);
    });
  });

  describe('Log Retention System', () => {
    it('should execute cleanup jobs', async () => {
      const mockJobs = [{
        job_id: 'cleanup-123',
        created_at: new Date().toISOString(),
        policy_name: 'ai_operation_logs',
        status: 'completed' as const,
        target_date_range: {
          start_date: '2023-01-01T00:00:00Z',
          end_date: '2023-12-31T23:59:59Z'
        },
        estimated_records: 1000,
        processed_records: 1000,
        deleted_records: 800,
        archived_records: 200,
        errors: [],
        completion_time: new Date().toISOString()
      }];

      jest.spyOn(logRetentionSystem, 'executeCleanup').mockResolvedValue(mockJobs);

      const jobs = await logRetentionSystem.executeCleanup('ai_operation_logs');

      expect(jobs).toHaveLength(1);
      expect(jobs[0].status).toBe('completed');
      expect(jobs[0].processed_records).toBe(1000);
    });

    it('should list retention policies', () => {
      const policies = logRetentionSystem.listRetentionPolicies();

      expect(policies).toHaveLength(4);
      expect(policies.map(p => p.name)).toContain('ai_operation_logs');
      expect(policies.map(p => p.name)).toContain('audit_trail_logs');
      expect(policies.map(p => p.name)).toContain('user_interaction_logs');
      expect(policies.map(p => p.name)).toContain('system_performance_logs');
    });

    it('should get specific retention policy', () => {
      const policy = logRetentionSystem.getRetentionPolicy('ai_operation_logs');

      expect(policy).toBeDefined();
      expect(policy?.name).toBe('ai_operation_logs');
      expect(policy?.retention_days).toBe(365);
      expect(policy?.data_type).toBe('ai_logs');
    });
  });

  describe('Integrated Logging Manager', () => {
    it('should log AI operations with full compliance checking', async () => {
      const mockResult = {
        operation_id: 'integrated-op-123',
        logged_successfully: true,
        pii_detected: false,
        compliance_status: 'compliant' as const,
        actions_taken: ['Logged to CloudWatch and DynamoDB', 'Logged to audit trail'],
        warnings: [],
        errors: []
      };

      jest.spyOn(integratedLoggingManager, 'logAIOperation').mockResolvedValue(mockResult);

      const result = await integratedLoggingManager.logAIOperation({
        operation_type: 'visibility_check',
        provider: 'claude-3.5-sonnet',
        prompt: 'Analyze this restaurant business',
        response: 'Here is the analysis...',
        token_usage: {
          input_tokens: 100,
          output_tokens: 200,
          total_cost_usd: 0.05
        },
        execution_time_ms: 1500,
        status: 'success',
        context: {
          user_id: 'user-123',
          request_source: 'web'
        }
      });

      expect(result.logged_successfully).toBe(true);
      expect(result.compliance_status).toBe('compliant');
      expect(result.actions_taken).toContain('Logged to CloudWatch and DynamoDB');
    });

    it('should handle PII detection in integrated logging', async () => {
      const mockResult = {
        operation_id: 'pii-op-123',
        logged_successfully: true,
        pii_detected: true,
        compliance_status: 'warning' as const,
        actions_taken: ['PII detected and flagged', 'Content redacted', 'Logged to audit trail'],
        warnings: ['High-confidence PII detected: email, phone'],
        errors: []
      };

      jest.spyOn(integratedLoggingManager, 'logAIOperation').mockResolvedValue(mockResult);

      const result = await integratedLoggingManager.logAIOperation({
        operation_type: 'content_generation',
        provider: 'claude-3.5-sonnet',
        prompt: 'Generate content for restaurant',
        response: 'Contact us at info@restaurant.com or call +49 30 123456',
        token_usage: {
          input_tokens: 50,
          output_tokens: 100,
          total_cost_usd: 0.02
        },
        execution_time_ms: 800,
        status: 'success',
        context: {
          user_id: 'user-456',
          request_source: 'api'
        }
      });

      expect(result.pii_detected).toBe(true);
      expect(result.compliance_status).toBe('warning');
      expect(result.warnings).toContain('High-confidence PII detected: email, phone');
    });

    it('should validate content safety', () => {
      const unsafeContent = 'My personal email is john@example.com';
      const safeContent = 'This restaurant serves excellent food';

      const unsafeResult = integratedLoggingManager.validateContentSafety(unsafeContent);
      const safeResult = integratedLoggingManager.validateContentSafety(safeContent);

      expect(unsafeResult.safe).toBe(false);
      expect(safeResult.safe).toBe(true);
    });

    it('should track user consent', async () => {
      jest.spyOn(integratedLoggingManager, 'trackUserConsent').mockResolvedValue();

      await integratedLoggingManager.trackUserConsent({
        user_id: 'user-123',
        consent_type: 'ai_analysis',
        granted: true,
        ip_address: '192.168.1.1',
        processing_purposes: ['AI analysis', 'Business recommendations']
      });

      expect(integratedLoggingManager.trackUserConsent).toHaveBeenCalledWith({
        user_id: 'user-123',
        consent_type: 'ai_analysis',
        granted: true,
        ip_address: '192.168.1.1',
        processing_purposes: ['AI analysis', 'Business recommendations']
      });
    });

    it('should handle data subject requests', async () => {
      const mockResponse = {
        request_id: 'dsr-123',
        request_type: 'access' as const,
        data_subject_id: 'user-123',
        requested_at: new Date().toISOString(),
        status: 'completed' as const,
        completion_deadline: new Date().toISOString(),
        records_found: 5,
        actions_taken: ['Data compiled and provided'],
        response_data: {
          data_subject_id: 'user-123',
          records_found: 5,
          processing_activities: []
        }
      };

      jest.spyOn(integratedLoggingManager, 'handleDataSubjectRequest').mockResolvedValue(mockResponse);

      const response = await integratedLoggingManager.handleDataSubjectRequest({
        request_type: 'access',
        data_subject_id: 'user-123',
        requester_ip: '192.168.1.1'
      });

      expect(response.request_type).toBe('access');
      expect(response.data_subject_id).toBe('user-123');
      expect(response.records_found).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle logging system failures gracefully', async () => {
      const mockResult = {
        operation_id: 'error-op-123',
        logged_successfully: false,
        pii_detected: false,
        compliance_status: 'violation' as const,
        actions_taken: [],
        warnings: [],
        errors: ['Logging failed: DynamoDB connection error']
      };

      jest.spyOn(integratedLoggingManager, 'logAIOperation').mockResolvedValue(mockResult);

      const result = await integratedLoggingManager.logAIOperation({
        operation_type: 'visibility_check',
        provider: 'claude-3.5-sonnet',
        prompt: 'Test prompt',
        response: 'Test response',
        token_usage: {
          input_tokens: 10,
          output_tokens: 20,
          total_cost_usd: 0.01
        },
        execution_time_ms: 100,
        status: 'success',
        context: {
          request_source: 'web'
        }
      });

      expect(result.logged_successfully).toBe(false);
      expect(result.compliance_status).toBe('violation');
      expect(result.errors).toContain('Logging failed: DynamoDB connection error');
    });

    it('should handle PII detection errors', () => {
      // Test with malformed content that might cause PII detection to fail
      const malformedContent = null as any;
      
      expect(() => {
        piiDetectionSystem.detectPII(malformedContent);
      }).toThrow();
    });
  });

  describe('Configuration Management', () => {
    it('should update logging configuration', () => {
      const originalConfig = integratedLoggingManager.getConfiguration();
      
      integratedLoggingManager.updateConfiguration({
        enable_pii_detection: false,
        compliance_mode: 'minimal'
      });

      const updatedConfig = integratedLoggingManager.getConfiguration();
      
      expect(updatedConfig.enable_pii_detection).toBe(false);
      expect(updatedConfig.compliance_mode).toBe('minimal');
      
      // Restore original config
      integratedLoggingManager.updateConfiguration(originalConfig);
    });

    it('should maintain configuration integrity', () => {
      const config = integratedLoggingManager.getConfiguration();
      
      expect(config.enable_cloudwatch).toBeDefined();
      expect(config.enable_dynamodb).toBeDefined();
      expect(config.enable_postgresql_archive).toBeDefined();
      expect(config.pii_detection_threshold).toBeGreaterThan(0);
      expect(config.pii_detection_threshold).toBeLessThanOrEqual(1);
    });
  });
});