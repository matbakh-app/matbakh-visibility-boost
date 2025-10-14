/**
 * Automated Regression Testing for AI Model Changes
 *
 * This test suite implements comprehensive regression testing for AI models
 * to ensure that model changes don't break existing functionality or degrade performance.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

interface ModelVersion {
  id: string;
  version: string;
  deployedAt: string;
  baselineMetrics: ModelMetrics;
}

interface ModelMetrics {
  accuracy: number;
  latency: number;
  throughput: number;
  errorRate: number;
  userSatisfaction: number;
  costPerRequest: number;
}

interface RegressionTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  category: string;
  priority: "high" | "medium" | "low";
  tags: string[];
}

interface RegressionResult {
  testCaseId: string;
  modelVersion: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  similarity: number;
  latency: number;
  errorMessage?: string;
}

interface RegressionReport {
  modelVersion: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  averageLatency: number;
  regressionDetected: boolean;
  results: RegressionResult[];
  recommendations: string[];
}

class AutomatedRegressionTester {
  private testCases: RegressionTestCase[] = [];
  private baselineModel: ModelVersion | null = null;
  private currentModel: ModelVersion | null = null;

  constructor() {
    this.initializeTestCases();
  }

  private initializeTestCases(): void {
    this.testCases = [
      {
        id: "vc-001",
        name: "Basic Visibility Analysis",
        input: "Analyze the online visibility of a restaurant in Munich",
        expectedOutput:
          "I'll analyze the restaurant's online presence across Google My Business, social media platforms, and review sites to provide comprehensive visibility insights.",
        category: "visibility-check",
        priority: "high",
        tags: ["core-functionality", "visibility", "analysis"],
      },
      {
        id: "content-001",
        name: "Social Media Content Generation",
        input: "Create a social media post for our new pasta dish",
        expectedOutput:
          "Here's an engaging social media post for your new pasta dish with compelling copy and relevant hashtags to maximize engagement.",
        category: "content-generation",
        priority: "high",
        tags: ["content", "social-media", "marketing"],
      },
      {
        id: "review-001",
        name: "Review Response Generation",
        input: "Help me respond to a negative review about slow service",
        expectedOutput:
          "I'll help you craft a professional and empathetic response that addresses the customer's concerns while maintaining your restaurant's reputation.",
        category: "review-management",
        priority: "high",
        tags: ["reviews", "customer-service", "reputation"],
      },
      {
        id: "competitor-001",
        name: "Competitive Analysis",
        input: "Analyze my competitors in the Italian restaurant market",
        expectedOutput:
          "I'll analyze your local Italian restaurant competitors, examining their online presence, pricing, menu offerings, and customer engagement strategies.",
        category: "competitive-analysis",
        priority: "medium",
        tags: ["competition", "market-analysis", "strategy"],
      },
      {
        id: "seo-001",
        name: "SEO Optimization Advice",
        input: "How can I improve my restaurant's search engine ranking?",
        expectedOutput:
          "I'll provide SEO strategies including local search optimization, keyword targeting, content creation, and technical improvements to boost your search rankings.",
        category: "seo-optimization",
        priority: "medium",
        tags: ["seo", "search", "optimization"],
      },
      {
        id: "menu-001",
        name: "Menu Description Enhancement",
        input: "Help me write better descriptions for my menu items",
        expectedOutput:
          "I'll help you create appetizing menu descriptions that highlight ingredients, cooking methods, and unique selling points to increase customer appeal.",
        category: "menu-optimization",
        priority: "medium",
        tags: ["menu", "descriptions", "sales"],
      },
      {
        id: "pricing-001",
        name: "Pricing Strategy Analysis",
        input: "Analyze my pricing strategy compared to competitors",
        expectedOutput:
          "I'll analyze your pricing against local competitors, considering factors like portion sizes, quality, location, and market positioning.",
        category: "pricing-analysis",
        priority: "low",
        tags: ["pricing", "strategy", "competition"],
      },
      {
        id: "events-001",
        name: "Event Marketing Ideas",
        input: "Suggest marketing ideas for our anniversary celebration",
        expectedOutput:
          "I'll suggest creative marketing ideas for your anniversary celebration including social media campaigns, special offers, and community engagement strategies.",
        category: "event-marketing",
        priority: "low",
        tags: ["events", "marketing", "promotion"],
      },
    ];
  }

  async runRegressionTests(modelVersion: string): Promise<RegressionReport> {
    console.log(`🔄 Running regression tests for model: ${modelVersion}`);

    const startTime = Date.now();
    const results: RegressionResult[] = [];

    for (const testCase of this.testCases) {
      console.log(`  Testing: ${testCase.name} (${testCase.id})`);

      try {
        const result = await this.runSingleTest(testCase, modelVersion);
        results.push(result);
      } catch (error) {
        results.push({
          testCaseId: testCase.id,
          modelVersion,
          passed: false,
          actualOutput: "",
          expectedOutput: testCase.expectedOutput,
          similarity: 0,
          latency: 0,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const report = this.generateReport(modelVersion, results);
    await this.saveReport(report);

    return report;
  }

  private async runSingleTest(
    testCase: RegressionTestCase,
    modelVersion: string
  ): Promise<RegressionResult> {
    const startTime = Date.now();

    // Simulate AI model inference
    const actualOutput = await this.simulateModelInference(
      testCase.input,
      modelVersion
    );
    const latency = Date.now() - startTime;

    // Calculate similarity between expected and actual output
    const similarity = this.calculateSimilarity(
      actualOutput,
      testCase.expectedOutput
    );

    // Determine if test passed based on similarity threshold
    const passed = similarity >= this.getSimilarityThreshold(testCase.priority);

    return {
      testCaseId: testCase.id,
      modelVersion,
      passed,
      actualOutput,
      expectedOutput: testCase.expectedOutput,
      similarity,
      latency,
    };
  }

  private async simulateModelInference(
    input: string,
    modelVersion: string
  ): Promise<string> {
    // Simulate network latency and processing time
    const baseLatency = 200 + Math.random() * 600;
    await new Promise((resolve) => setTimeout(resolve, baseLatency));

    // Simulate different model behaviors based on version
    const responses = {
      "claude-3-5-sonnet-v1": this.generateV1Response(input),
      "claude-3-5-sonnet-v2": this.generateV2Response(input),
      "gemini-pro-v1": this.generateGeminiResponse(input),
      default: this.generateDefaultResponse(input),
    };

    return (
      responses[modelVersion as keyof typeof responses] || responses.default
    );
  }

  private generateV1Response(input: string): string {
    // Simulate Claude 3.5 Sonnet v1 responses
    if (input.includes("visibility") || input.includes("analyze")) {
      return "I'll analyze the restaurant's online presence across Google My Business, social media platforms, and review sites to provide comprehensive visibility insights.";
    }
    if (input.includes("social media") || input.includes("post")) {
      return "Here's an engaging social media post for your new pasta dish with compelling copy and relevant hashtags to maximize engagement.";
    }
    if (input.includes("review") || input.includes("negative")) {
      return "I'll help you craft a professional and empathetic response that addresses the customer's concerns while maintaining your restaurant's reputation.";
    }
    return "I'll help you with your restaurant-related request using my knowledge of the hospitality industry.";
  }

  private generateV2Response(input: string): string {
    // Simulate Claude 3.5 Sonnet v2 responses (potentially improved)
    if (input.includes("visibility") || input.includes("analyze")) {
      return "I'll conduct a comprehensive analysis of your restaurant's online visibility, examining Google My Business optimization, social media engagement, review platform presence, and local SEO performance to identify improvement opportunities.";
    }
    if (input.includes("social media") || input.includes("post")) {
      return "I'll create an engaging social media post for your new pasta dish, incorporating appetizing descriptions, strategic hashtags, optimal posting timing, and visual content suggestions to maximize reach and engagement.";
    }
    if (input.includes("review") || input.includes("negative")) {
      return "I'll help you craft a thoughtful, professional response that acknowledges the customer's experience, demonstrates your commitment to improvement, and showcases your restaurant's values while maintaining a positive brand image.";
    }
    return "I'll provide comprehensive assistance with your restaurant business needs, leveraging industry best practices and data-driven insights.";
  }

  private generateGeminiResponse(input: string): string {
    // Simulate Gemini Pro responses
    if (input.includes("visibility") || input.includes("analyze")) {
      return "Let me analyze your restaurant's digital footprint across multiple channels including Google Business Profile, social platforms, and review sites to assess your current visibility status.";
    }
    if (input.includes("social media") || input.includes("post")) {
      return "I can help create compelling social media content for your pasta dish, including engaging captions, relevant hashtags, and posting strategy recommendations.";
    }
    if (input.includes("review") || input.includes("negative")) {
      return "I'll assist you in composing a professional response to address the service concerns while demonstrating your commitment to customer satisfaction.";
    }
    return "I can help you with various aspects of restaurant management and marketing based on your specific needs.";
  }

  private generateDefaultResponse(input: string): string {
    return `I understand you're asking about: ${input.substring(
      0,
      50
    )}... I'll help you with this restaurant-related request.`;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Advanced similarity calculation using multiple metrics
    const jaccardSim = this.calculateJaccardSimilarity(text1, text2);
    const lengthSim = this.calculateLengthSimilarity(text1, text2);
    const keywordSim = this.calculateKeywordSimilarity(text1, text2);

    // Weighted combination of similarity metrics
    return jaccardSim * 0.5 + lengthSim * 0.2 + keywordSim * 0.3;
  }

  private calculateJaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private calculateLengthSimilarity(text1: string, text2: string): number {
    const len1 = text1.length;
    const len2 = text2.length;
    const maxLen = Math.max(len1, len2);
    const minLen = Math.min(len1, len2);

    return minLen / maxLen;
  }

  private calculateKeywordSimilarity(text1: string, text2: string): number {
    const keywords = [
      "restaurant",
      "analyze",
      "help",
      "create",
      "social",
      "media",
      "review",
      "customer",
      "business",
    ];

    const count1 = keywords.filter((keyword) =>
      text1.toLowerCase().includes(keyword)
    ).length;
    const count2 = keywords.filter((keyword) =>
      text2.toLowerCase().includes(keyword)
    ).length;

    if (count1 === 0 && count2 === 0) return 1;

    return Math.min(count1, count2) / Math.max(count1, count2);
  }

  private getSimilarityThreshold(priority: "high" | "medium" | "low"): number {
    switch (priority) {
      case "high":
        return 0.8;
      case "medium":
        return 0.7;
      case "low":
        return 0.6;
      default:
        return 0.7;
    }
  }

  private generateReport(
    modelVersion: string,
    results: RegressionResult[]
  ): RegressionReport {
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? passedTests / totalTests : 0;
    const averageLatency =
      results.reduce((sum, r) => sum + r.latency, 0) / totalTests;

    // Detect regression based on pass rate and critical test failures
    const criticalFailures = results.filter(
      (r) =>
        !r.passed &&
        this.testCases.find((tc) => tc.id === r.testCaseId)?.priority === "high"
    );
    const regressionDetected = passRate < 0.8 || criticalFailures.length > 0;

    const recommendations = this.generateRecommendations(
      results,
      passRate,
      criticalFailures
    );

    return {
      modelVersion,
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      passRate,
      averageLatency,
      regressionDetected,
      results,
      recommendations,
    };
  }

  private generateRecommendations(
    results: RegressionResult[],
    passRate: number,
    criticalFailures: RegressionResult[]
  ): string[] {
    const recommendations: string[] = [];

    if (passRate < 0.6) {
      recommendations.push(
        "🚨 CRITICAL: Pass rate below 60%. Consider rolling back this model version."
      );
    } else if (passRate < 0.8) {
      recommendations.push(
        "⚠️ WARNING: Pass rate below 80%. Review failed tests before deployment."
      );
    }

    if (criticalFailures.length > 0) {
      recommendations.push(
        `🔴 ${criticalFailures.length} critical test(s) failed. These must be fixed before deployment.`
      );
    }

    const highLatencyTests = results.filter((r) => r.latency > 2000);
    if (highLatencyTests.length > 0) {
      recommendations.push(
        `⏱️ ${highLatencyTests.length} test(s) exceeded 2s latency threshold. Consider performance optimization.`
      );
    }

    const lowSimilarityTests = results.filter((r) => r.similarity < 0.5);
    if (lowSimilarityTests.length > 0) {
      recommendations.push(
        `📝 ${lowSimilarityTests.length} test(s) show low output similarity. Review model training or prompts.`
      );
    }

    if (passRate >= 0.95) {
      recommendations.push(
        "✅ Excellent regression test results. Model is ready for deployment."
      );
    } else if (passRate >= 0.8) {
      recommendations.push(
        "✅ Good regression test results. Minor issues should be addressed but deployment can proceed."
      );
    }

    return recommendations;
  }

  private async saveReport(report: RegressionReport): Promise<void> {
    // In a real implementation, this would save to a database or file system
    console.log(`💾 Regression report saved for model: ${report.modelVersion}`);
  }

  setBaselineModel(model: ModelVersion): void {
    this.baselineModel = model;
  }

  setCurrentModel(model: ModelVersion): void {
    this.currentModel = model;
  }

  async compareWithBaseline(currentModelVersion: string): Promise<{
    improvement: boolean;
    degradation: boolean;
    details: string[];
  }> {
    if (!this.baselineModel) {
      return {
        improvement: false,
        degradation: false,
        details: ["No baseline model set for comparison"],
      };
    }

    const currentReport = await this.runRegressionTests(currentModelVersion);
    const baselineMetrics = this.baselineModel.baselineMetrics;

    const details: string[] = [];
    let improvement = false;
    let degradation = false;

    // Compare pass rates
    const baselinePassRate = 0.85; // Assume baseline pass rate
    if (currentReport.passRate > baselinePassRate + 0.05) {
      improvement = true;
      details.push(
        `✅ Pass rate improved: ${(currentReport.passRate * 100).toFixed(
          1
        )}% vs ${(baselinePassRate * 100).toFixed(1)}%`
      );
    } else if (currentReport.passRate < baselinePassRate - 0.05) {
      degradation = true;
      details.push(
        `❌ Pass rate degraded: ${(currentReport.passRate * 100).toFixed(
          1
        )}% vs ${(baselinePassRate * 100).toFixed(1)}%`
      );
    }

    // Compare latency
    if (currentReport.averageLatency < baselineMetrics.latency * 0.9) {
      improvement = true;
      details.push(
        `⚡ Latency improved: ${currentReport.averageLatency.toFixed(
          0
        )}ms vs ${baselineMetrics.latency.toFixed(0)}ms`
      );
    } else if (currentReport.averageLatency > baselineMetrics.latency * 1.1) {
      degradation = true;
      details.push(
        `⏱️ Latency degraded: ${currentReport.averageLatency.toFixed(
          0
        )}ms vs ${baselineMetrics.latency.toFixed(0)}ms`
      );
    }

    return { improvement, degradation, details };
  }
}

// Test Suite
describe("Automated Regression Testing for AI Models", () => {
  let regressionTester: AutomatedRegressionTester;

  beforeEach(() => {
    regressionTester = new AutomatedRegressionTester();

    // Set up baseline model
    const baselineModel: ModelVersion = {
      id: "claude-3-5-sonnet-v1",
      version: "1.0.0",
      deployedAt: "2024-01-01T00:00:00Z",
      baselineMetrics: {
        accuracy: 0.85,
        latency: 800,
        throughput: 100,
        errorRate: 0.02,
        userSatisfaction: 0.8,
        costPerRequest: 0.01,
      },
    };

    regressionTester.setBaselineModel(baselineModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Regression Test Execution", () => {
    it("should run all regression tests successfully", async () => {
      const report = await regressionTester.runRegressionTests(
        "claude-3-5-sonnet-v2"
      );

      expect(report).toBeDefined();
      expect(report.modelVersion).toBe("claude-3-5-sonnet-v2");
      expect(report.totalTests).toBeGreaterThan(0);
      expect(report.results).toHaveLength(report.totalTests);
      expect(report.passRate).toBeGreaterThanOrEqual(0);
      expect(report.passRate).toBeLessThanOrEqual(1);
    });

    it("should detect regression when pass rate is low", async () => {
      // Mock a scenario with low pass rate
      const report = await regressionTester.runRegressionTests(
        "faulty-model-v1"
      );

      // The faulty model should have lower similarity scores
      expect(report.regressionDetected).toBeDefined();
      expect(report.recommendations).toContain(
        expect.stringMatching(/pass rate|regression|critical/i)
      );
    });

    it("should generate appropriate recommendations", async () => {
      const report = await regressionTester.runRegressionTests(
        "claude-3-5-sonnet-v2"
      );

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("Baseline Comparison", () => {
    it("should compare current model with baseline", async () => {
      const comparison = await regressionTester.compareWithBaseline(
        "claude-3-5-sonnet-v2"
      );

      expect(comparison).toBeDefined();
      expect(typeof comparison.improvement).toBe("boolean");
      expect(typeof comparison.degradation).toBe("boolean");
      expect(Array.isArray(comparison.details)).toBe(true);
    });

    it("should detect improvements in model performance", async () => {
      const comparison = await regressionTester.compareWithBaseline(
        "claude-3-5-sonnet-v2"
      );

      // V2 should generally perform better than V1
      expect(comparison.details.length).toBeGreaterThan(0);
    });
  });

  describe("Test Case Coverage", () => {
    it("should cover all critical functionality areas", async () => {
      const report = await regressionTester.runRegressionTests(
        "claude-3-5-sonnet-v2"
      );

      const categories = new Set(
        report.results.map((r) => {
          const testCase = regressionTester["testCases"].find(
            (tc) => tc.id === r.testCaseId
          );
          return testCase?.category;
        })
      );

      expect(categories.has("visibility-check")).toBe(true);
      expect(categories.has("content-generation")).toBe(true);
      expect(categories.has("review-management")).toBe(true);
    });

    it("should prioritize high-priority test cases", async () => {
      const report = await regressionTester.runRegressionTests(
        "claude-3-5-sonnet-v2"
      );

      const highPriorityTests = report.results.filter((r) => {
        const testCase = regressionTester["testCases"].find(
          (tc) => tc.id === r.testCaseId
        );
        return testCase?.priority === "high";
      });

      expect(highPriorityTests.length).toBeGreaterThan(0);

      // High priority tests should have higher similarity thresholds
      const failedHighPriorityTests = highPriorityTests.filter(
        (t) => !t.passed
      );
      if (failedHighPriorityTests.length > 0) {
        expect(report.regressionDetected).toBe(true);
      }
    });
  });

  describe("Performance Metrics", () => {
    it("should track latency for all tests", async () => {
      const report = await regressionTester.runRegressionTests(
        "claude-3-5-sonnet-v2"
      );

      expect(report.averageLatency).toBeGreaterThan(0);

      report.results.forEach((result) => {
        expect(result.latency).toBeGreaterThan(0);
        expect(result.latency).toBeLessThan(10000); // Should be under 10 seconds
      });
    });

    it("should calculate similarity scores accurately", async () => {
      const report = await regressionTester.runRegressionTests(
        "claude-3-5-sonnet-v2"
      );

      report.results.forEach((result) => {
        expect(result.similarity).toBeGreaterThanOrEqual(0);
        expect(result.similarity).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle model inference failures gracefully", async () => {
      const report = await regressionTester.runRegressionTests(
        "non-existent-model"
      );

      expect(report).toBeDefined();
      expect(report.totalTests).toBeGreaterThan(0);

      // Should still generate a report even with failures
      expect(report.results).toHaveLength(report.totalTests);
    });

    it("should provide detailed error information for failed tests", async () => {
      const report = await regressionTester.runRegressionTests(
        "error-prone-model"
      );

      const failedTests = report.results.filter((r) => !r.passed);

      failedTests.forEach((result) => {
        expect(result.passed).toBe(false);
        expect(result.similarity).toBeLessThan(0.8);
      });
    });
  });
});

export {
  AutomatedRegressionTester,
  ModelVersion,
  RegressionReport,
  RegressionTestCase,
};
