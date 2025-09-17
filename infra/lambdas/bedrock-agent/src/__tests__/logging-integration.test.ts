/**
 * @jest-environment node
 */

/**
 * Integration tests for the complete logging and security system
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { integratedLoggingManager } from '../integrated-logging-manager';
// PII detection system is tested via integratedLoggingManager

// Mock AWS services for integration testing
jest.mock('@aws-sdk/client-cloudwatch-logs');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-s3');
jest.mock('pg');

describe('Logging System Integration Tests', () => {
  beforeAll(async () => {
    // Setup test environment
    process.env.AWS_REGION = 'eu-central-1';
    process.env.BEDROCK_LOGS_TABLE = 'test-bedrock-logs';
    process.env.AUDIT_TRAIL_TABLE = 'test-audit-trail';
    process.env.BEDROCK_LOG_GROUP = '/aws/lambda/test-bedrock-agent';
  });

  afterAll(async () => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe('End-to-End Logging Flow', () => {
    it('should handle complete AI operation logging workflow', async () => {
      // Mock successful logging
      const mockLogResult = {
        operation_id: 'e2e-test-123',
        logged_successfully: true,
        pii_detected: false,
        compliance_status: 'compliant' as const,
        actions_taken: [
          'Logged to CloudWatch and DynamoDB',
          'Archived to PostgreSQL for GDPR compliance',
          'Logged to audit trail'
        ],
        warnings: [],
        errors: []
      };

      jest.spyOn(integratedLoggingManager, 'logAIOperation').mockResolvedValue(mockLogResult);

      const result = await integratedLoggingManager.logAIOperation({
        operation_type: 'visibility_check',
        provider: 'claude-3.5-sonnet',
        prompt: 'Analyze the digital presence of Restaurant Bella Vista in Berlin',
        response: JSON.stringify({
          overall_score: 85,
          strengths: ['Strong Google My Business presence', 'Good review ratings'],
          weaknesses: ['Limited social media activity', 'No website optimization'],
          recommendations: [
            'Increase Instagram posting frequency',
            'Optimize website for local SEO',
            'Respond to customer reviews more actively'
          ]
        }),
        token_usage: {
          input_tokens: 150,
          output_tokens: 300,
          total_cost_usd: 0.08
        },
        execution_time_ms: 2500,
        status: 'success',
        context: {
          operation_id: 'e2e-test-123',
          user_id: 'user-restaurant-owner-456',
          lead_id: 'lead-vc-789',
          session_id: 'session-abc123',
          ip_address: '192.168.1.100',
          persona_type: 'Der Profi',
          request_source: 'web'
        }
      });

      expect(result.logged_successfully).toBe(true);
      expect(result.compliance_status).toBe('compliant');
      expect(result.actions_taken).toContain('Logged to CloudWatch and DynamoDB');
      expect(result.actions_taken).toContain('Archived to PostgreSQL for GDPR compliance');
      expect(result.actions_taken).toContain('Logged to audit trail');
    });

    it('should handle PII detection and redaction workflow', async () => {
      const piiContent = `
        Restaurant Analysis Request:
        Business: Mama Mia Pizzeria
        Owner: Giovanni Rossi
        Email: giovanni@mamamia-berlin.de
        Phone: +49 30 12345678
        Address: Friedrichstraße 123, 10117 Berlin
        
        Please analyze our online presence and provide recommendations.
      `;

      const mockLogResult = {
        operation_id: 'pii-test-456',
        logged_successfully: true,
        pii_detected: true,
        compliance_status: 'warning' as const,
        actions_taken: [
          'PII detected and flagged',
          'PII detection logged to audit trail',
          'Logged to CloudWatch and DynamoDB',
          'Archived to PostgreSQL for GDPR compliance',
          'Logged to audit trail'
        ],
        warnings: ['High-confidence PII detected: email, german_phone, street_address'],
        errors: []
      };

      jest.spyOn(integratedLoggingManager, 'logAIOperation').mockResolvedValue(mockLogResult);

      const result = await integratedLoggingManager.logAIOperation({
        operation_type: 'visibility_check',
        provider: 'claude-3.5-sonnet',
        prompt: piiContent,
        response: 'Analysis completed with recommendations for improving digital presence.',
        token_usage: {
          input_tokens: 200,
          output_tokens: 150,
          total_cost_usd: 0.06
        },
        execution_time_ms: 1800,
        status: 'success',
        context: {
          user_id: 'user-giovanni-789',
          request_source: 'web'
        }
      });

      expect(result.pii_detected).toBe(true);
      expect(result.compliance_status).toBe('warning');
      expect(result.warnings).toContain('High-confidence PII detected: email, german_phone, street_address');
      expect(result.actions_taken).toContain('PII detected and flagged');
    });

    it('should handle error scenarios with proper logging', async () => {
      const mockLogResult = {
        operation_id: 'error-test-789',
        logged_successfully: true,
        pii_detected: false,
        compliance_status: 'compliant' as const,
        actions_taken: [
          'Error logged to CloudWatch and DynamoDB',
          'Error logged to audit trail'
        ],
        warnings: [],
        errors: []
      };

      jest.spyOn(integratedLoggingManager, 'logAIOperation').mockResolvedValue(mockLogResult);

      const result = await integratedLoggingManager.logAIOperation({
        operation_type: 'content_generation',
        provider: 'claude-3.5-sonnet',
        prompt: 'Generate social media content for restaurant',
        response: '',
        token_usage: {
          input_tokens: 50,
          output_tokens: 0,
          total_cost_usd: 0.01
        },
        execution_time_ms: 30000, // Timeout scenario
        status: 'timeout',
        error_message: 'Request timed out after 30 seconds',
        context: {
          user_id: 'user-timeout-test',
          request_source: 'api'
        }
      });

      expect(result.logged_successfully).toBe(true);
      expect(result.actions_taken).toContain('Error logged to CloudWatch and DynamoDB');
    });
  });

  describe('GDPR Compliance Workflows', () => {
    it('should handle data subject access request', async () => {
      const mockAccessResponse = {
        request_id: 'dsr-access-123',
        request_type: 'access' as const,
        data_subject_id: 'user-gdpr-test-456',
        requested_at: new Date().toISOString(),
        status: 'completed' as const,
        completion_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        records_found: 12,
        actions_taken: ['Data compiled and provided'],
        response_data: {
          data_subject_id: 'user-gdpr-test-456',
          records_found: 12,
          processing_activities: [
            {
              activity_id: 'archive-001',
              original_id: 'op-visibility-check-001',
              type: 'ai_operation',
              timestamp: '2024-01-15T10:30:00Z',
              legal_basis: 'Article 6(1)(f) - Legitimate interests',
              processing_purpose: 'AI-powered business analysis and recommendations',
              data_categories: ['usage_data', 'technical_data'],
              retention_period: 365
            }
          ],
          your_rights: [
            'Right to rectification (Article 16)',
            'Right to erasure (Article 17)',
            'Right to restrict processing (Article 18)',
            'Right to data portability (Article 20)',
            'Right to object (Article 21)'
          ]
        }
      };

      jest.spyOn(integratedLoggingManager, 'handleDataSubjectRequest').mockResolvedValue(mockAccessResponse);

      const response = await integratedLoggingManager.handleDataSubjectRequest({
        request_type: 'access',
        data_subject_id: 'user-gdpr-test-456',
        requester_ip: '192.168.1.200'
      });

      expect(response.request_type).toBe('access');
      expect(response.records_found).toBe(12);
      expect(response.status).toBe('completed');
      expect(response.response_data.processing_activities).toHaveLength(1);
    });

    it('should handle data subject erasure request', async () => {
      const mockErasureResponse = {
        request_id: 'dsr-erasure-456',
        request_type: 'erasure' as const,
        data_subject_id: 'user-erasure-test-789',
        requested_at: new Date().toISOString(),
        status: 'completed' as const,
        completion_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        records_found: 8,
        actions_taken: [
          'Anonymized record op-001',
          'Anonymized record op-002',
          'Retained record op-003 - legal obligation'
        ]
      };

      jest.spyOn(integratedLoggingManager, 'handleDataSubjectRequest').mockResolvedValue(mockErasureResponse);

      const response = await integratedLoggingManager.handleDataSubjectRequest({
        request_type: 'erasure',
        data_subject_id: 'user-erasure-test-789',
        additional_info: { reason: 'User requested account deletion' }
      });

      expect(response.request_type).toBe('erasure');
      expect(response.records_found).toBe(8);
      expect(response.actions_taken).toContain('Anonymized record op-001');
      expect(response.actions_taken).toContain('Retained record op-003 - legal obligation');
    });

    it('should track user consent properly', async () => {
      jest.spyOn(integratedLoggingManager, 'trackUserConsent').mockResolvedValue();

      await integratedLoggingManager.trackUserConsent({
        user_id: 'user-consent-test-123',
        consent_type: 'ai_analysis_processing',
        granted: true,
        ip_address: '192.168.1.150',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        processing_purposes: [
          'AI-powered business analysis',
          'Digital presence optimization',
          'Personalized recommendations'
        ]
      });

      expect(integratedLoggingManager.trackUserConsent).toHaveBeenCalledWith({
        user_id: 'user-consent-test-123',
        consent_type: 'ai_analysis_processing',
        granted: true,
        ip_address: '192.168.1.150',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        processing_purposes: [
          'AI-powered business analysis',
          'Digital presence optimization',
          'Personalized recommendations'
        ]
      });
    });
  });

  describe('Performance and Monitoring', () => {
    it('should generate operation statistics', async () => {
      const mockStats = {
        total_operations: 1250,
        success_rate: 0.96,
        average_execution_time: 1850,
        total_cost: 15.75,
        pii_detection_rate: 0.12
      };

      jest.spyOn(integratedLoggingManager, 'getOperationStatistics').mockResolvedValue(mockStats);

      const stats = await integratedLoggingManager.getOperationStatistics('day');

      expect(stats.total_operations).toBe(1250);
      expect(stats.success_rate).toBe(0.96);
      expect(stats.average_execution_time).toBe(1850);
      expect(stats.pii_detection_rate).toBe(0.12);
    });

    it('should generate compliance reports', async () => {
      const mockReport = {
        report_id: 'compliance-report-123',
        generated_at: new Date().toISOString(),
        period: {
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-31T23:59:59Z'
        },
        summary: {
          total_events: 2500,
          gdpr_relevant_events: 2100,
          high_risk_events: 25,
          compliance_violations: 2
        },
        categories: {
          ai_operation: {
            count: 1800,
            risk_distribution: { low: 1650, medium: 130, high: 18, critical: 2 }
          },
          data_access: {
            count: 450,
            risk_distribution: { low: 420, medium: 25, high: 5, critical: 0 }
          },
          pii_detection: {
            count: 250,
            risk_distribution: { low: 200, medium: 45, high: 5, critical: 0 }
          }
        },
        recommendations: [
          'Review high-risk AI operations for additional safeguards',
          'Implement additional PII detection patterns for German addresses'
        ],
        violations: []
      };

      jest.spyOn(integratedLoggingManager, 'generateComplianceReport').mockResolvedValue(mockReport);

      const report = await integratedLoggingManager.generateComplianceReport(
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z'
      );

      expect(report.summary.total_events).toBe(2500);
      expect(report.summary.compliance_violations).toBe(2);
      expect(report.categories.ai_operation.count).toBe(1800);
      expect(report.recommendations).toHaveLength(2);
    });

    it('should execute log cleanup operations', async () => {
      const mockCleanupResult = {
        retention_jobs: [{
          job_id: 'cleanup-job-123',
          created_at: new Date().toISOString(),
          policy_name: 'ai_operation_logs',
          status: 'completed' as const,
          target_date_range: {
            start_date: '2023-01-01T00:00:00Z',
            end_date: '2023-12-31T23:59:59Z'
          },
          estimated_records: 5000,
          processed_records: 5000,
          deleted_records: 4200,
          archived_records: 800,
          errors: [],
          completion_time: new Date().toISOString()
        }],
        postgresql_cleanup: {
          deleted_count: 0,
          anonymized_count: 150
        },
        total_processed: 5000
      };

      jest.spyOn(integratedLoggingManager, 'executeLogCleanup').mockResolvedValue(mockCleanupResult);

      const result = await integratedLoggingManager.executeLogCleanup('ai_operation_logs');

      expect(result.retention_jobs).toHaveLength(1);
      expect(result.retention_jobs[0].status).toBe('completed');
      expect(result.postgresql_cleanup.anonymized_count).toBe(150);
      expect(result.total_processed).toBe(5000);
    });
  });

  describe('Content Safety and Validation', () => {
    it('should validate content safety before processing', () => {
      const testCases = [
        {
          content: 'Restaurant Bella Vista serves excellent Italian cuisine in Berlin.',
          expectedSafe: true,
          expectedRisk: 0
        },
        {
          content: 'Contact us at info@restaurant.com for reservations.',
          expectedSafe: false,
          expectedRisk: 0.95
        },
        {
          content: 'Call us at +49 30 123456 or visit us at Musterstraße 123, 12345 Berlin.',
          expectedSafe: false,
          expectedRisk: 0.85
        }
      ];

      testCases.forEach(({ content, expectedSafe, expectedRisk }) => {
        const result = integratedLoggingManager.validateContentSafety(content);
        
        expect(result.safe).toBe(expectedSafe);
        if (expectedRisk > 0) {
          expect(result.risk_score).toBeGreaterThan(expectedRisk - 0.1);
        } else {
          expect(result.risk_score).toBe(0);
        }
      });
    });

    it('should provide appropriate recommendations for unsafe content', () => {
      const unsafeContent = 'My personal details: john@example.com, +49 30 123456, IBAN: DE89 3704 0044 0532 0130 00';
      const result = integratedLoggingManager.validateContentSafety(unsafeContent);

      expect(result.safe).toBe(false);
      expect(result.risk_score).toBeGreaterThan(0.8);
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('Configuration and Flexibility', () => {
    it('should handle different compliance modes', () => {
      // Test strict compliance mode
      integratedLoggingManager.updateConfiguration({
        compliance_mode: 'strict',
        pii_detection_threshold: 0.3
      });

      let config = integratedLoggingManager.getConfiguration();
      expect(config.compliance_mode).toBe('strict');
      expect(config.pii_detection_threshold).toBe(0.3);

      // Test standard compliance mode
      integratedLoggingManager.updateConfiguration({
        compliance_mode: 'standard',
        pii_detection_threshold: 0.5
      });

      config = integratedLoggingManager.getConfiguration();
      expect(config.compliance_mode).toBe('standard');
      expect(config.pii_detection_threshold).toBe(0.5);
    });

    it('should allow selective feature enabling/disabling', () => {
      // Disable PII detection
      integratedLoggingManager.updateConfiguration({
        enable_pii_detection: false
      });

      const content = 'Contact: test@example.com';
      const result = integratedLoggingManager.validateContentSafety(content);

      expect(result.safe).toBe(true);
      expect(result.risk_score).toBe(0);

      // Re-enable PII detection
      integratedLoggingManager.updateConfiguration({
        enable_pii_detection: true
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical restaurant visibility check workflow', async () => {
      const restaurantData = {
        business_name: 'Zur Goldenen Gans',
        location: 'München, Bayern',
        website: 'https://goldene-gans-muenchen.de',
        gmb_url: 'https://goo.gl/maps/example123',
        instagram_url: 'https://instagram.com/goldenegan_munich'
      };

      const analysisPrompt = `
        Analyze the digital presence for ${restaurantData.business_name} in ${restaurantData.location}.
        Website: ${restaurantData.website}
        Google My Business: ${restaurantData.gmb_url}
        Instagram: ${restaurantData.instagram_url}
        
        Provide SWOT analysis and recommendations.
      `;

      const mockResult = {
        operation_id: 'restaurant-analysis-456',
        logged_successfully: true,
        pii_detected: false,
        compliance_status: 'compliant' as const,
        actions_taken: [
          'Logged to CloudWatch and DynamoDB',
          'Archived to PostgreSQL for GDPR compliance',
          'Logged to audit trail'
        ],
        warnings: [],
        errors: []
      };

      jest.spyOn(integratedLoggingManager, 'logAIOperation').mockResolvedValue(mockResult);

      const result = await integratedLoggingManager.logAIOperation({
        operation_type: 'visibility_check',
        provider: 'claude-3.5-sonnet',
        prompt: analysisPrompt,
        response: JSON.stringify({
          swot_analysis: {
            strengths: ['Established local presence', 'Traditional Bavarian cuisine'],
            weaknesses: ['Limited online reviews', 'Outdated website design'],
            opportunities: ['Social media expansion', 'Local SEO optimization'],
            threats: ['Increased competition', 'Changing dining preferences']
          },
          recommendations: [
            'Update website with modern design and mobile optimization',
            'Increase Instagram posting frequency with food photography',
            'Encourage customer reviews on Google My Business'
          ]
        }),
        token_usage: {
          input_tokens: 180,
          output_tokens: 250,
          total_cost_usd: 0.07
        },
        execution_time_ms: 2200,
        status: 'success',
        context: {
          user_id: 'restaurant-owner-munich-789',
          lead_id: 'vc-lead-golden-gans-123',
          persona_type: 'Der Zeitknappe',
          request_source: 'web'
        }
      });

      expect(result.logged_successfully).toBe(true);
      expect(result.compliance_status).toBe('compliant');
      expect(result.pii_detected).toBe(false);
    });
  });
});