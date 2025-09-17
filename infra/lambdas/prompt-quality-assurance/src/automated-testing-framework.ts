import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  TestCase,
  TestResult,
  ValidationFramework,
  ValidationRule,
  QualityMetrics,
  RunTestSuiteRequest,
  QualityAssuranceError,
  TestExecutionError
} from './types';
import { QualityScoringEngine } from './quality-scoring-engine';

export class AutomatedTestingFramework {
  private bedrockClient: BedrockRuntimeClient;
  private dynamoClient: DynamoDBDocumentClient;
  private qualityScoringEngine: QualityScoringEngine;
  private tableName: string;
  private maxConcurrentTests: number;
  private defaultTimeout: number;

  constructor(
    tableName: string,
    region: string = 'eu-central-1',
    maxConcurrentTests: number = 5,
    defaultTimeout: number = 30000
  ) {
    this.bedrockClient = new BedrockRuntimeClient({ region });
    const dynamoDBClient = new DynamoDBClient({ region });
    this.dynamoClient = DynamoDBDocumentClient.from(dynamoDBClient);
    this.qualityScoringEngine = new QualityScoringEngine(region);
    this.tableName = tableName;
    this.maxConcurrentTests = maxConcurrentTests;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Create a new test case for a template
   */
  async createTestCase(testCase: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestCase> {
    try {
      const newTestCase: TestCase = {
        ...testCase,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          ...newTestCase,
          entityType: 'testCase'
        }
      }));

      return newTestCase;
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to create test case: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'TEST_CASE_CREATION_ERROR'
      );
    }
  }

  /**
   * Run a comprehensive test suite
   */
  async runTestSuite(request: RunTestSuiteRequest): Promise<{
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      warnings: number;
      executionTime: number;
    };
    results: TestResult[];
    recommendations: string[];
  }> {
    const startTime = Date.now();
    
    try {
      // Get test cases to run
      const testCases = await this.getTestCases(request);
      
      if (testCases.length === 0) {
        throw new TestExecutionError('No test cases found for the specified criteria');
      }

      // Run tests in batches to respect concurrency limits
      const results: TestResult[] = [];
      for (let i = 0; i < testCases.length; i += this.maxConcurrentTests) {
        const batch = testCases.slice(i, i + this.maxConcurrentTests);
        const batchResults = await Promise.all(
          batch.map(testCase => this.runSingleTest(testCase))
        );
        results.push(...batchResults);
      }

      // Calculate summary
      const summary = {
        totalTests: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        warnings: results.filter(r => r.status === 'warning').length,
        executionTime: Date.now() - startTime
      };

      // Generate recommendations based on results
      const recommendations = this.generateTestRecommendations(results);

      // Store test results
      await this.storeTestResults(results);

      return { summary, results, recommendations };
    } catch (error) {
      throw new TestExecutionError(
        `Test suite execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create validation framework with custom rules
   */
  async createValidationFramework(framework: Omit<ValidationFramework, 'id' | 'createdAt' | 'updatedAt'>): Promise<ValidationFramework> {
    try {
      const newFramework: ValidationFramework = {
        ...framework,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          ...newFramework,
          entityType: 'validationFramework'
        }
      }));

      return newFramework;
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to create validation framework: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FRAMEWORK_CREATION_ERROR'
      );
    }
  }

  /**
   * Validate prompt output against framework rules
   */
  async validateOutput(
    output: string,
    frameworkId: string,
    contextData?: Record<string, any>
  ): Promise<{
    isValid: boolean;
    violations: Array<{
      rule: ValidationRule;
      severity: string;
      message: string;
    }>;
    score: number;
  }> {
    try {
      const framework = await this.getValidationFramework(frameworkId);
      if (!framework) {
        throw new QualityAssuranceError('Validation framework not found', 'FRAMEWORK_NOT_FOUND', 404);
      }

      const violations: Array<{
        rule: ValidationRule;
        severity: string;
        message: string;
      }> = [];

      // Check each rule
      for (const rule of framework.rules) {
        const violation = await this.checkRule(rule, output, contextData);
        if (violation) {
          violations.push(violation);
        }
      }

      // Calculate validation score
      const errorCount = violations.filter(v => v.severity === 'error').length;
      const warningCount = violations.filter(v => v.severity === 'warning').length;
      const totalRules = framework.rules.length;
      
      const score = Math.max(0, 1 - (errorCount * 0.2 + warningCount * 0.1) / totalRules);

      return {
        isValid: errorCount === 0,
        violations,
        score
      };
    } catch (error) {
      throw new QualityAssuranceError(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_ERROR'
      );
    }
  }

  /**
   * Run regression tests to ensure changes don't break existing functionality
   */
  async runRegressionTests(templateId: string, newVersion: string, baselineVersion: string): Promise<{
    regressionDetected: boolean;
    qualityDelta: number;
    performanceDelta: number;
    failedTests: TestResult[];
    recommendations: string[];
  }> {
    try {
      // Get regression test cases for the template
      const testCases = await this.getTestCases({
        templateId,
        testType: 'regression'
      });

      if (testCases.length === 0) {
        throw new TestExecutionError('No regression test cases found for template');
      }

      // Run tests with both versions
      const [newResults, baselineResults] = await Promise.all([
        this.runTestsWithVersion(testCases, newVersion),
        this.runTestsWithVersion(testCases, baselineVersion)
      ]);

      // Compare results
      const qualityDelta = this.calculateQualityDelta(newResults, baselineResults);
      const performanceDelta = this.calculatePerformanceDelta(newResults, baselineResults);
      
      const failedTests = newResults.filter(result => {
        const baselineResult = this.findBaselineResult(baselineResults, result.testCaseId);
        return result.status === 'failed' || 
               (result.qualityMetrics.overallScore < 0.6 && 
                baselineResult && baselineResult.qualityMetrics.overallScore > 0.6);
      });

      const regressionDetected = qualityDelta < -0.1 || performanceDelta < -0.2 || failedTests.length > 0;

      const recommendations = this.generateRegressionRecommendations(
        regressionDetected,
        qualityDelta,
        performanceDelta,
        failedTests
      );

      return {
        regressionDetected,
        qualityDelta,
        performanceDelta,
        failedTests,
        recommendations
      };
    } catch (error) {
      throw new TestExecutionError(
        `Regression testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate performance benchmarks for templates
   */
  async generatePerformanceBenchmarks(templateId: string): Promise<{
    qualityBenchmark: QualityMetrics;
    performanceBenchmark: {
      averageResponseTime: number;
      tokenEfficiency: number;
      successRate: number;
    };
    testCoverage: {
      functionalTests: number;
      performanceTests: number;
      qualityTests: number;
      regressionTests: number;
    };
  }> {
    try {
      const testCases = await this.getTestCases({ templateId });
      const recentResults = await this.getRecentTestResults(templateId, 100);

      // Calculate quality benchmark
      const qualityBenchmark = this.calculateQualityBenchmark(recentResults);

      // Calculate performance benchmark
      const performanceBenchmark = this.calculatePerformanceBenchmark(recentResults);

      // Calculate test coverage
      const testCoverage = {
        functionalTests: testCases.filter(tc => tc.testType === 'functional').length,
        performanceTests: testCases.filter(tc => tc.testType === 'performance').length,
        qualityTests: testCases.filter(tc => tc.testType === 'quality').length,
        regressionTests: testCases.filter(tc => tc.testType === 'regression').length
      };

      return {
        qualityBenchmark,
        performanceBenchmark,
        testCoverage
      };
    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to generate benchmarks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BENCHMARK_GENERATION_ERROR'
      );
    }
  }

  // Private helper methods

  private async getTestCases(request: RunTestSuiteRequest): Promise<TestCase[]> {
    const queryParams: any = {
      TableName: this.tableName,
      FilterExpression: 'entityType = :entityType AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':entityType': 'testCase',
        ':isActive': true
      }
    };

    if (request.templateId) {
      queryParams.FilterExpression += ' AND templateId = :templateId';
      queryParams.ExpressionAttributeValues[':templateId'] = request.templateId;
    }

    if (request.testType) {
      queryParams.FilterExpression += ' AND testType = :testType';
      queryParams.ExpressionAttributeValues[':testType'] = request.testType;
    }

    const result = await this.dynamoClient.send(new QueryCommand(queryParams));
    return (result.Items || []) as TestCase[];
  }

  private async runSingleTest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Execute the prompt with test input data
      const output = await this.executePromptWithTestData(testCase);
      
      // Analyze quality metrics
      const qualityMetrics = await this.qualityScoringEngine.analyzeQuality({
        prompt: this.buildTestPrompt(testCase),
        output,
        contextData: testCase.inputData
      });

      // Check against expected criteria
      const validationResult = await this.validateTestOutput(output, qualityMetrics, testCase);

      const testResult: TestResult = {
        id: uuidv4(),
        testCaseId: testCase.id,
        executionId: uuidv4(),
        status: validationResult.status,
        actualOutput: output,
        qualityMetrics,
        performanceMetrics: {
          responseTime: Date.now() - startTime,
          tokenUsage: this.estimateTokenUsage(output)
        },
        failureReasons: validationResult.failureReasons,
        timestamp: new Date().toISOString()
      };

      return testResult;
    } catch (error) {
      return {
        id: uuidv4(),
        testCaseId: testCase.id,
        executionId: uuidv4(),
        status: 'failed',
        actualOutput: '',
        qualityMetrics: {
          relevanceScore: 0,
          coherenceScore: 0,
          completenessScore: 0,
          accuracyScore: 0,
          overallScore: 0,
          confidence: 0
        },
        performanceMetrics: {
          responseTime: Date.now() - startTime,
          tokenUsage: 0
        },
        failureReasons: [`Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        timestamp: new Date().toISOString()
      };
    }
  }

  private async executePromptWithTestData(testCase: TestCase): Promise<string> {
    const prompt = this.buildTestPrompt(testCase);
    
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: testCase.expectedOutputCriteria.maxTokens || 1000,
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.content[0].text;
  }

  private buildTestPrompt(testCase: TestCase): string {
    // Build prompt using test case input data
    let prompt = `Test Case: ${testCase.name}\n\n`;
    
    Object.entries(testCase.inputData).forEach(([key, value]) => {
      prompt += `${key}: ${JSON.stringify(value)}\n`;
    });
    
    return prompt;
  }

  private async validateTestOutput(
    output: string,
    qualityMetrics: QualityMetrics,
    testCase: TestCase
  ): Promise<{
    status: 'passed' | 'failed' | 'warning';
    failureReasons?: string[];
  }> {
    const failureReasons: string[] = [];
    
    // Check quality score
    if (qualityMetrics.overallScore < testCase.expectedOutputCriteria.minQualityScore) {
      failureReasons.push(
        `Quality score ${qualityMetrics.overallScore.toFixed(2)} below minimum ${testCase.expectedOutputCriteria.minQualityScore}`
      );
    }

    // Check token count
    const tokenCount = this.estimateTokenUsage(output);
    if (tokenCount > testCase.expectedOutputCriteria.maxTokens) {
      failureReasons.push(
        `Token count ${tokenCount} exceeds maximum ${testCase.expectedOutputCriteria.maxTokens}`
      );
    }

    // Check required elements
    const missingElements = testCase.expectedOutputCriteria.requiredElements.filter(
      element => !output.toLowerCase().includes(element.toLowerCase())
    );
    if (missingElements.length > 0) {
      failureReasons.push(`Missing required elements: ${missingElements.join(', ')}`);
    }

    // Check forbidden elements
    const forbiddenElements = testCase.expectedOutputCriteria.forbiddenElements.filter(
      element => output.toLowerCase().includes(element.toLowerCase())
    );
    if (forbiddenElements.length > 0) {
      failureReasons.push(`Contains forbidden elements: ${forbiddenElements.join(', ')}`);
    }

    // Determine status
    let status: 'passed' | 'failed' | 'warning' = 'passed';
    if (failureReasons.length > 0) {
      status = qualityMetrics.overallScore < 0.4 ? 'failed' : 'warning';
    }

    return { status, failureReasons: failureReasons.length > 0 ? failureReasons : undefined };
  }

  private async getValidationFramework(frameworkId: string): Promise<ValidationFramework | null> {
    const result = await this.dynamoClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { id: frameworkId, entityType: 'validationFramework' }
    }));

    return result.Item as ValidationFramework || null;
  }

  private async checkRule(
    rule: ValidationRule,
    output: string,
    contextData?: Record<string, any>
  ): Promise<{ rule: ValidationRule; severity: string; message: string } | null> {
    try {
      // Simple rule evaluation (in production, this would be more sophisticated)
      let violated = false;
      
      switch (rule.type) {
        case 'content':
          violated = this.checkContentRule(rule, output);
          break;
        case 'structure':
          violated = this.checkStructureRule(rule, output);
          break;
        case 'performance':
          violated = this.checkPerformanceRule(rule, output, contextData);
          break;
        case 'safety':
          violated = this.checkSafetyRule(rule, output);
          break;
      }

      if (violated) {
        return {
          rule,
          severity: rule.severity,
          message: rule.message
        };
      }

      return null;
    } catch (error) {
      return {
        rule,
        severity: 'error',
        message: `Rule evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private checkContentRule(rule: ValidationRule, output: string): boolean {
    // Simple content rule checking
    if (rule.condition.includes('contains')) {
      const searchTerm = rule.condition.split('contains')[1].trim().replace(/['"]/g, '');
      return !output.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    if (rule.condition.includes('length >')) {
      const minLength = parseInt(rule.condition.split('length >')[1].trim());
      return output.length <= minLength;
    }
    
    return false;
  }

  private checkStructureRule(rule: ValidationRule, output: string): boolean {
    // Check structural requirements
    if (rule.condition.includes('has_headings')) {
      return !/^#+\s/m.test(output) && !/\*\*.*\*\*/.test(output);
    }
    
    if (rule.condition.includes('has_bullets')) {
      return !/^[-*+]\s/m.test(output) && !/^\d+\.\s/m.test(output);
    }
    
    return false;
  }

  private checkPerformanceRule(rule: ValidationRule, output: string, contextData?: Record<string, any>): boolean {
    // Performance rule checking would use contextData for timing info
    return false; // Placeholder
  }

  private checkSafetyRule(rule: ValidationRule, output: string): boolean {
    // Safety rule checking for harmful content
    const harmfulPatterns = ['violence', 'hate', 'discrimination'];
    return harmfulPatterns.some(pattern => output.toLowerCase().includes(pattern));
  }

  private generateTestRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];
    
    const failureRate = results.filter(r => r.status === 'failed').length / results.length;
    if (failureRate > 0.2) {
      recommendations.push('High failure rate detected - review test cases and template quality');
    }
    
    const avgQuality = results.reduce((sum, r) => sum + r.qualityMetrics.overallScore, 0) / results.length;
    if (avgQuality < 0.7) {
      recommendations.push('Average quality score is low - consider prompt optimization');
    }
    
    const slowTests = results.filter(r => r.performanceMetrics.responseTime > 10000);
    if (slowTests.length > results.length * 0.3) {
      recommendations.push('Many tests are slow - optimize for performance');
    }
    
    return recommendations;
  }

  private async storeTestResults(results: TestResult[]): Promise<void> {
    // Store results in batches
    const batchSize = 25; // DynamoDB batch write limit
    
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await Promise.all(
        batch.map(result =>
          this.dynamoClient.send(new PutCommand({
            TableName: this.tableName,
            Item: {
              ...result,
              entityType: 'testResult'
            }
          }))
        )
      );
    }
  }

  private async runTestsWithVersion(testCases: TestCase[], version: string): Promise<TestResult[]> {
    // This would run tests with a specific template version
    // For now, return mock results
    return testCases.map(tc => ({
      id: uuidv4(),
      testCaseId: tc.id,
      executionId: uuidv4(),
      status: 'passed' as const,
      actualOutput: 'Mock output',
      qualityMetrics: {
        relevanceScore: 0.8,
        coherenceScore: 0.8,
        completenessScore: 0.8,
        accuracyScore: 0.8,
        overallScore: 0.8,
        confidence: 0.8
      },
      performanceMetrics: {
        responseTime: 2000,
        tokenUsage: 500
      },
      timestamp: new Date().toISOString()
    }));
  }

  private calculateQualityDelta(newResults: TestResult[], baselineResults: TestResult[]): number {
    const newAvg = newResults.reduce((sum, r) => sum + r.qualityMetrics.overallScore, 0) / newResults.length;
    const baselineAvg = baselineResults.reduce((sum, r) => sum + r.qualityMetrics.overallScore, 0) / baselineResults.length;
    return newAvg - baselineAvg;
  }

  private calculatePerformanceDelta(newResults: TestResult[], baselineResults: TestResult[]): number {
    const newAvg = newResults.reduce((sum, r) => sum + r.performanceMetrics.responseTime, 0) / newResults.length;
    const baselineAvg = baselineResults.reduce((sum, r) => sum + r.performanceMetrics.responseTime, 0) / baselineResults.length;
    return (baselineAvg - newAvg) / baselineAvg; // Positive delta means improvement
  }

  private findBaselineResult(baselineResults: TestResult[], testCaseId: string): TestResult | undefined {
    return baselineResults.find(r => r.testCaseId === testCaseId);
  }

  private generateRegressionRecommendations(
    regressionDetected: boolean,
    qualityDelta: number,
    performanceDelta: number,
    failedTests: TestResult[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (regressionDetected) {
      recommendations.push('Regression detected - consider reverting changes or additional optimization');
    }
    
    if (qualityDelta < -0.1) {
      recommendations.push(`Quality decreased by ${Math.abs(qualityDelta * 100).toFixed(1)}% - review prompt changes`);
    }
    
    if (performanceDelta < -0.2) {
      recommendations.push(`Performance decreased by ${Math.abs(performanceDelta * 100).toFixed(1)}% - optimize for speed`);
    }
    
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} tests failed - investigate specific failure reasons`);
    }
    
    return recommendations;
  }

  private async getRecentTestResults(templateId: string, limit: number): Promise<TestResult[]> {
    // This would query recent test results from DynamoDB
    // For now, return empty array
    return [];
  }

  private calculateQualityBenchmark(results: TestResult[]): QualityMetrics {
    if (results.length === 0) {
      return {
        relevanceScore: 0,
        coherenceScore: 0,
        completenessScore: 0,
        accuracyScore: 0,
        overallScore: 0,
        confidence: 0
      };
    }

    const sum = results.reduce((acc, result) => ({
      relevanceScore: acc.relevanceScore + result.qualityMetrics.relevanceScore,
      coherenceScore: acc.coherenceScore + result.qualityMetrics.coherenceScore,
      completenessScore: acc.completenessScore + result.qualityMetrics.completenessScore,
      accuracyScore: acc.accuracyScore + result.qualityMetrics.accuracyScore,
      overallScore: acc.overallScore + result.qualityMetrics.overallScore,
      confidence: acc.confidence + result.qualityMetrics.confidence
    }), {
      relevanceScore: 0,
      coherenceScore: 0,
      completenessScore: 0,
      accuracyScore: 0,
      overallScore: 0,
      confidence: 0
    });

    const count = results.length;
    return {
      relevanceScore: sum.relevanceScore / count,
      coherenceScore: sum.coherenceScore / count,
      completenessScore: sum.completenessScore / count,
      accuracyScore: sum.accuracyScore / count,
      overallScore: sum.overallScore / count,
      confidence: sum.confidence / count
    };
  }

  private calculatePerformanceBenchmark(results: TestResult[]): {
    averageResponseTime: number;
    tokenEfficiency: number;
    successRate: number;
  } {
    if (results.length === 0) {
      return {
        averageResponseTime: 0,
        tokenEfficiency: 0,
        successRate: 0
      };
    }

    const avgResponseTime = results.reduce((sum, r) => sum + r.performanceMetrics.responseTime, 0) / results.length;
    const avgTokenUsage = results.reduce((sum, r) => sum + r.performanceMetrics.tokenUsage, 0) / results.length;
    const successRate = results.filter(r => r.status === 'passed').length / results.length;

    return {
      averageResponseTime: avgResponseTime,
      tokenEfficiency: avgTokenUsage > 0 ? 1 / avgTokenUsage : 0,
      successRate
    };
  }

  private estimateTokenUsage(text: string): number {
    // Simple token estimation (roughly 4 characters per token)
    return Math.ceil(text.length / 4);
  }
}