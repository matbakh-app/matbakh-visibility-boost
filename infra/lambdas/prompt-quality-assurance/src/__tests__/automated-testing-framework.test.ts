import { jest } from '@jest/globals';
import { AutomatedTestingFramework } from '../automated-testing-framework';
import { mockTestCase } from './setup';

// Mock the AWS SDK
const mockSend = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: mockSend
    })
  },
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  QueryCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: mockSend
  })),
  InvokeModelCommand: jest.fn()
}));

// Mock QualityScoringEngine
jest.mock('../quality-scoring-engine', () => ({
  QualityScoringEngine: jest.fn().mockImplementation(() => ({
    analyzeQuality: jest.fn().mockResolvedValue({
      relevanceScore: 0.8,
      coherenceScore: 0.85,
      completenessScore: 0.75,
      accuracyScore: 0.9,
      overallScore: 0.825,
      confidence: 0.8
    })
  }))
}));

describe('AutomatedTestingFramework', () => {
  let testingFramework: AutomatedTestingFramework;

  beforeEach(() => {
    testingFramework = new AutomatedTestingFramework('test-table', 'eu-central-1', 3, 10000);
    jest.clearAllMocks();
  });

  describe('createTestCase', () => {
    it('should create a new test case successfully', async () => {
      mockSend.mockResolvedValueOnce({});

      const testCaseData = {
        templateId: 'template-123',
        name: 'Test visibility analysis',
        description: 'Test basic visibility analysis functionality',
        inputData: { businessName: 'Test Restaurant', location: 'Berlin' },
        expectedOutputCriteria: {
          minQualityScore: 0.7,
          maxTokens: 1000,
          maxResponseTime: 5000,
          requiredElements: ['visibility', 'recommendations'],
          forbiddenElements: ['error', 'failed']
        },
        testType: 'functional' as const,
        isActive: true
      };

      const result = await testingFramework.createTestCase(testCaseData);

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid-1234');
      expect(result.templateId).toBe('template-123');
      expect(result.name).toBe('Test visibility analysis');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle creation error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      const testCaseData = {
        templateId: 'template-123',
        name: 'Test case',
        description: 'Test description',
        inputData: {},
        expectedOutputCriteria: {
          minQualityScore: 0.7,
          maxTokens: 1000,
          maxResponseTime: 5000,
          requiredElements: [],
          forbiddenElements: []
        },
        testType: 'functional' as const,
        isActive: true
      };

      await expect(testingFramework.createTestCase(testCaseData)).rejects.toThrow('Failed to create test case');
    });
  });

  describe('runTestSuite', () => {
    it('should run test suite successfully', async () => {
      const mockTestCases = [
        { ...mockTestCase, id: 'test-1' },
        { ...mockTestCase, id: 'test-2' },
        { ...mockTestCase, id: 'test-3' }
      ];

      // Mock getting test cases
      mockSend.mockResolvedValueOnce({
        Items: mockTestCases
      });

      // Mock Bedrock responses for test executions
      const mockBedrockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'This restaurant has good visibility with active social media presence and positive reviews. I recommend optimizing the Google My Business profile.'
          }]
        }))
      };

      mockSend.mockResolvedValue(mockBedrockResponse);

      // Mock storing test results
      mockSend.mockResolvedValue({});

      const request = {
        templateId: 'template-123',
        testType: 'functional'
      };

      const result = await testingFramework.runTestSuite(request);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalTests).toBe(3);
      expect(result.summary.passed).toBeGreaterThanOrEqual(0);
      expect(result.summary.failed).toBeGreaterThanOrEqual(0);
      expect(result.summary.warnings).toBeGreaterThanOrEqual(0);
      expect(result.summary.executionTime).toBeGreaterThan(0);
      expect(result.results).toHaveLength(3);
      expect(result.recommendations).toBeDefined();
    });

    it('should handle no test cases found', async () => {
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      const request = {
        templateId: 'template-123'
      };

      await expect(testingFramework.runTestSuite(request)).rejects.toThrow('No test cases found');
    });

    it('should handle test execution errors gracefully', async () => {
      const mockTestCases = [mockTestCase];

      mockSend.mockResolvedValueOnce({
        Items: mockTestCases
      });

      // Mock Bedrock failure
      mockSend.mockRejectedValueOnce(new Error('Bedrock error'));

      // Mock storing results
      mockSend.mockResolvedValue({});

      const request = {
        templateId: 'template-123'
      };

      const result = await testingFramework.runTestSuite(request);

      expect(result.summary.failed).toBe(1);
      expect(result.results[0].status).toBe('failed');
      expect(result.results[0].failureReasons).toContain('Test execution failed: Bedrock error');
    });
  });

  describe('createValidationFramework', () => {
    it('should create validation framework successfully', async () => {
      mockSend.mockResolvedValueOnce({});

      const frameworkData = {
        name: 'Restaurant Content Validation',
        description: 'Validates restaurant-specific content quality',
        rules: [
          {
            id: 'rule-1',
            name: 'Contains restaurant keywords',
            type: 'content' as const,
            condition: 'contains restaurant',
            severity: 'warning' as const,
            message: 'Response should contain restaurant-related keywords'
          }
        ],
        isActive: true,
        applicableTemplates: ['template-123']
      };

      const result = await testingFramework.createValidationFramework(frameworkData);

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid-1234');
      expect(result.name).toBe('Restaurant Content Validation');
      expect(result.rules).toHaveLength(1);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('validateOutput', () => {
    it('should validate output against framework rules', async () => {
      const mockFramework = {
        id: 'framework-123',
        name: 'Test Framework',
        rules: [
          {
            id: 'rule-1',
            name: 'Contains restaurant',
            type: 'content',
            condition: 'contains restaurant',
            severity: 'error',
            message: 'Must contain restaurant keyword'
          },
          {
            id: 'rule-2',
            name: 'Minimum length',
            type: 'content',
            condition: 'length > 50',
            severity: 'warning',
            message: 'Response should be at least 50 characters'
          }
        ],
        isActive: true,
        applicableTemplates: ['template-123'],
        createdAt: '2025-01-09T10:00:00Z',
        updatedAt: '2025-01-09T10:00:00Z'
      };

      mockSend.mockResolvedValueOnce({
        Item: mockFramework
      });

      const output = 'This restaurant has excellent visibility and should focus on improving their online presence.';

      const result = await testingFramework.validateOutput(output, 'framework-123');

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.score).toBeGreaterThan(0.8);
    });

    it('should detect validation violations', async () => {
      const mockFramework = {
        id: 'framework-123',
        name: 'Test Framework',
        rules: [
          {
            id: 'rule-1',
            name: 'Contains restaurant',
            type: 'content',
            condition: 'contains restaurant',
            severity: 'error',
            message: 'Must contain restaurant keyword'
          }
        ],
        isActive: true,
        applicableTemplates: ['template-123'],
        createdAt: '2025-01-09T10:00:00Z',
        updatedAt: '2025-01-09T10:00:00Z'
      };

      mockSend.mockResolvedValueOnce({
        Item: mockFramework
      });

      const output = 'This business has good visibility.'; // Missing 'restaurant' keyword

      const result = await testingFramework.validateOutput(output, 'framework-123');

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].severity).toBe('error');
      expect(result.score).toBeLessThan(1.0);
    });

    it('should handle framework not found', async () => {
      mockSend.mockResolvedValueOnce({});

      await expect(
        testingFramework.validateOutput('test output', 'non-existent-framework')
      ).rejects.toThrow('Validation framework not found');
    });
  });

  describe('runRegressionTests', () => {
    it('should detect regression in quality', async () => {
      const mockTestCases = [mockTestCase];

      mockSend.mockResolvedValueOnce({
        Items: mockTestCases
      });

      const result = await testingFramework.runRegressionTests(
        'template-123',
        'v2.0',
        'v1.0'
      );

      expect(result).toBeDefined();
      expect(result.regressionDetected).toBeDefined();
      expect(result.qualityDelta).toBeDefined();
      expect(result.performanceDelta).toBeDefined();
      expect(result.failedTests).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle no regression test cases', async () => {
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      await expect(
        testingFramework.runRegressionTests('template-123', 'v2.0', 'v1.0')
      ).rejects.toThrow('No regression test cases found');
    });
  });

  describe('generatePerformanceBenchmarks', () => {
    it('should generate performance benchmarks', async () => {
      const mockTestCases = [
        { ...mockTestCase, testType: 'functional' },
        { ...mockTestCase, testType: 'performance' },
        { ...mockTestCase, testType: 'quality' }
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockTestCases
      });

      const result = await testingFramework.generatePerformanceBenchmarks('template-123');

      expect(result).toBeDefined();
      expect(result.qualityBenchmark).toBeDefined();
      expect(result.performanceBenchmark).toBeDefined();
      expect(result.testCoverage).toBeDefined();
      expect(result.testCoverage.functionalTests).toBe(1);
      expect(result.testCoverage.performanceTests).toBe(1);
      expect(result.testCoverage.qualityTests).toBe(1);
    });
  });

  describe('validation rule checking', () => {
    it('should check content rules correctly', () => {
      const framework = testingFramework as any;
      
      const containsRule = {
        id: 'rule-1',
        type: 'content',
        condition: 'contains restaurant',
        severity: 'error',
        message: 'Must contain restaurant'
      };
      
      const lengthRule = {
        id: 'rule-2',
        type: 'content',
        condition: 'length > 100',
        severity: 'warning',
        message: 'Should be longer'
      };
      
      const goodOutput = 'This restaurant has excellent visibility and online presence.';
      const shortOutput = 'Short text.';
      const badOutput = 'This business is good.';
      
      expect(framework.checkContentRule(containsRule, goodOutput)).toBe(false); // No violation
      expect(framework.checkContentRule(containsRule, badOutput)).toBe(true); // Violation
      expect(framework.checkContentRule(lengthRule, shortOutput)).toBe(true); // Violation
      expect(framework.checkContentRule(lengthRule, goodOutput)).toBe(false); // No violation
    });

    it('should check structure rules correctly', () => {
      const framework = testingFramework as any;
      
      const headingsRule = {
        id: 'rule-1',
        type: 'structure',
        condition: 'has_headings',
        severity: 'warning',
        message: 'Should have headings'
      };
      
      const bulletsRule = {
        id: 'rule-2',
        type: 'structure',
        condition: 'has_bullets',
        severity: 'warning',
        message: 'Should have bullet points'
      };
      
      const structuredOutput = '# Main Heading\n\n- Bullet point 1\n- Bullet point 2';
      const plainOutput = 'Just plain text without structure.';
      
      expect(framework.checkStructureRule(headingsRule, structuredOutput)).toBe(false); // No violation
      expect(framework.checkStructureRule(headingsRule, plainOutput)).toBe(true); // Violation
      expect(framework.checkStructureRule(bulletsRule, structuredOutput)).toBe(false); // No violation
      expect(framework.checkStructureRule(bulletsRule, plainOutput)).toBe(true); // Violation
    });

    it('should check safety rules correctly', () => {
      const framework = testingFramework as any;
      
      const safetyRule = {
        id: 'rule-1',
        type: 'safety',
        condition: 'no_harmful_content',
        severity: 'error',
        message: 'Contains harmful content'
      };
      
      const safeOutput = 'This restaurant provides excellent service and food quality.';
      const harmfulOutput = 'This place promotes violence and hate against customers.';
      
      expect(framework.checkSafetyRule(safetyRule, safeOutput)).toBe(false); // No violation
      expect(framework.checkSafetyRule(safetyRule, harmfulOutput)).toBe(true); // Violation
    });
  });

  describe('test result validation', () => {
    it('should validate test output against criteria', async () => {
      const framework = testingFramework as any;
      
      const goodOutput = 'This restaurant has excellent visibility with active social media presence and positive customer reviews. I recommend optimizing the Google My Business profile to improve local search rankings.';
      const goodQualityMetrics = {
        relevanceScore: 0.9,
        coherenceScore: 0.85,
        completenessScore: 0.8,
        accuracyScore: 0.9,
        overallScore: 0.86,
        confidence: 0.8
      };
      
      const testCase = {
        ...mockTestCase,
        expectedOutputCriteria: {
          minQualityScore: 0.8,
          maxTokens: 1000,
          maxResponseTime: 5000,
          requiredElements: ['restaurant', 'visibility', 'recommend'],
          forbiddenElements: ['error', 'failed']
        }
      };
      
      const result = await framework.validateTestOutput(goodOutput, goodQualityMetrics, testCase);
      
      expect(result.status).toBe('passed');
      expect(result.failureReasons).toBeUndefined();
    });

    it('should detect test failures', async () => {
      const framework = testingFramework as any;
      
      const poorOutput = 'Bad response.';
      const poorQualityMetrics = {
        relevanceScore: 0.3,
        coherenceScore: 0.4,
        completenessScore: 0.2,
        accuracyScore: 0.3,
        overallScore: 0.3,
        confidence: 0.5
      };
      
      const testCase = {
        ...mockTestCase,
        expectedOutputCriteria: {
          minQualityScore: 0.7,
          maxTokens: 100,
          maxResponseTime: 5000,
          requiredElements: ['restaurant', 'visibility'],
          forbiddenElements: ['bad']
        }
      };
      
      const result = await framework.validateTestOutput(poorOutput, poorQualityMetrics, testCase);
      
      expect(result.status).toBe('failed');
      expect(result.failureReasons).toBeDefined();
      expect(result.failureReasons?.length).toBeGreaterThan(0);
    });
  });

  describe('utility methods', () => {
    it('should estimate token usage correctly', () => {
      const framework = testingFramework as any;
      
      const shortText = 'Test';
      const longText = 'This is a longer text that should have more tokens estimated based on character count.';
      
      const shortTokens = framework.estimateTokenUsage(shortText);
      const longTokens = framework.estimateTokenUsage(longText);
      
      expect(shortTokens).toBe(1); // 4 chars / 4 = 1 token
      expect(longTokens).toBeGreaterThan(shortTokens);
      expect(longTokens).toBe(Math.ceil(longText.length / 4));
    });
  });
});