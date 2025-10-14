/**
 * Meta Monitor - Kiro Execution Analysis using Direct Bedrock
 *
 * This module implements meta-level monitoring of Kiro execution patterns,
 * failure detection, and feedback generation using direct Bedrock access
 * for time-critical analysis (< 15s latency requirement).
 */

import { AiFeatureFlags } from "./ai-feature-flags";
import {
  DirectBedrockClient,
  SupportOperationRequest,
} from "./direct-bedrock-client";
import { IntelligentRouter } from "./intelligent-router";

// Kiro Execution Data Types
export interface KiroExecutionData {
  executionId: string;
  timestamp: Date;
  operation: string;
  status: "success" | "failure" | "timeout" | "error";
  latencyMs: number;
  context: {
    userId?: string;
    taskType?: string;
    complexity?: "simple" | "medium" | "complex";
    metadata?: Record<string, any>;
  };
  error?: {
    type: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance: {
    memoryUsage?: number;
    cpuUsage?: number;
    networkLatency?: number;
  };
  correlationId: string;
}

// Failure Pattern Detection
export interface FailurePattern {
  patternId: string;
  type:
    | "recurring_error"
    | "performance_degradation"
    | "timeout_cluster"
    | "resource_exhaustion";
  severity: "low" | "medium" | "high" | "critical";
  frequency: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  affectedOperations: string[];
  commonFactors: Record<string, any>;
  suggestedActions: string[];
  confidence: number; // 0-1 confidence score
}

// Execution Feedback
export interface ExecutionFeedback {
  feedbackId: string;
  executionId: string;
  timestamp: Date;
  type:
    | "optimization"
    | "warning"
    | "error_prevention"
    | "performance_improvement";
  priority: "low" | "medium" | "high" | "urgent";
  message: string;
  actionable: boolean;
  suggestedFix?: {
    description: string;
    code?: string;
    configuration?: Record<string, any>;
    estimatedImpact: string;
  };
  correlationId: string;
}

// Meta Monitor Configuration
export interface MetaMonitorConfig {
  analysisInterval: number; // How often to analyze execution patterns
  failureThreshold: number; // Number of failures before pattern detection
  performanceThreshold: number; // Latency threshold for performance issues
  retentionPeriod: number; // How long to keep execution data
  enableRealTimeAnalysis: boolean;
  enablePredictiveAnalysis: boolean;
  maxAnalysisLatency: number; // 15s max for direct Bedrock analysis
}

// Analysis Results
export interface ExecutionAnalysisResult {
  analysisId: string;
  timestamp: Date;
  executionCount: number;
  successRate: number;
  averageLatency: number;
  detectedPatterns: FailurePattern[];
  generatedFeedback: ExecutionFeedback[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  healthScore: number; // 0-100 overall health score
  analysisLatencyMs: number;
}

/**
 * Meta Monitor for Kiro Execution Analysis
 */
export class MetaMonitor {
  private config: MetaMonitorConfig;
  private featureFlags: AiFeatureFlags;
  private directBedrockClient: DirectBedrockClient;
  private intelligentRouter: IntelligentRouter;

  // Data storage and analysis
  private executionHistory: Map<string, KiroExecutionData> = new Map();
  private detectedPatterns: Map<string, FailurePattern> = new Map();
  private analysisCache: Map<string, ExecutionAnalysisResult> = new Map();

  // Monitoring and intervals
  private analysisInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();

  // Metrics
  private metrics: {
    totalAnalyses: number;
    patternsDetected: number;
    feedbackGenerated: number;
    averageAnalysisTime: number;
    successfulAnalyses: number;
    failedAnalyses: number;
  };

  constructor(
    directBedrockClient: DirectBedrockClient,
    intelligentRouter: IntelligentRouter,
    config?: Partial<MetaMonitorConfig>
  ) {
    this.directBedrockClient = directBedrockClient;
    this.intelligentRouter = intelligentRouter;
    this.featureFlags = new AiFeatureFlags();

    this.config = {
      analysisInterval: 300000, // 5 minutes
      failureThreshold: 3, // 3 failures to detect pattern
      performanceThreshold: 5000, // 5s latency threshold
      retentionPeriod: 86400000, // 24 hours
      enableRealTimeAnalysis: true,
      enablePredictiveAnalysis: true,
      maxAnalysisLatency: 15000, // 15s max analysis time
      ...config,
    };

    this.metrics = this.initializeMetrics();

    // Start monitoring if enabled
    if (this.featureFlags.isEnabled("ENABLE_META_MONITOR")) {
      this.startMonitoring();
    }
  }

  /**
   * Analyze Kiro execution using direct Bedrock
   */
  async analyzeKiroExecution(
    executionData: KiroExecutionData
  ): Promise<ExecutionFeedback[]> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      // Check if meta monitor is enabled
      if (!this.featureFlags.isEnabled("ENABLE_META_MONITOR")) {
        throw new Error("Meta monitor is disabled");
      }

      // Store execution data
      this.storeExecutionData(executionData);

      // Perform real-time analysis if enabled
      if (this.config.enableRealTimeAnalysis) {
        const feedback = await this.performRealTimeAnalysis(
          executionData,
          correlationId
        );

        // Update metrics
        this.updateMetrics(true, Date.now() - startTime);

        return feedback;
      }

      return [];
    } catch (error) {
      console.error("Meta monitor analysis failed:", error);
      this.updateMetrics(false, Date.now() - startTime);
      return [];
    }
  }

  /**
   * Detect failure patterns in execution history
   */
  async detectFailurePatterns(): Promise<FailurePattern[]> {
    const startTime = Date.now();

    try {
      // Get recent execution data
      const recentExecutions = this.getRecentExecutions();
      const failures = recentExecutions.filter(
        (exec) => exec.status === "failure" || exec.status === "error"
      );

      if (failures.length < this.config.failureThreshold) {
        return [];
      }

      // Use direct Bedrock for pattern analysis
      const analysisRequest: SupportOperationRequest = {
        operation: "meta_monitor",
        priority: "high",
        prompt: this.buildPatternAnalysisPrompt(failures),
        context: {
          correlationId: this.generateCorrelationId(),
          metadata: {
            failureCount: failures.length,
            analysisType: "pattern_detection",
          },
        },
        maxTokens: 2048,
        temperature: 0.2,
      };

      // Route through intelligent router for optimal performance
      const response = await this.intelligentRouter.executeSupportOperation(
        analysisRequest
      );

      if (response.success && response.text) {
        const patterns = this.parsePatternAnalysisResponse(response.text);

        // Store detected patterns
        patterns.forEach((pattern) => {
          this.detectedPatterns.set(pattern.patternId, pattern);
        });

        // Update metrics
        this.metrics.patternsDetected += patterns.length;

        return patterns;
      }

      return [];
    } catch (error) {
      console.error("Pattern detection failed:", error);
      return [];
    }
  }

  /**
   * Generate execution feedback using direct Bedrock
   */
  async generateExecutionFeedback(
    executionData: KiroExecutionData,
    patterns: FailurePattern[]
  ): Promise<ExecutionFeedback[]> {
    try {
      const feedbackRequest: SupportOperationRequest = {
        operation: "meta_monitor",
        priority: "high",
        prompt: this.buildFeedbackGenerationPrompt(executionData, patterns),
        context: {
          correlationId: executionData.correlationId,
          metadata: {
            executionId: executionData.executionId,
            analysisType: "feedback_generation",
          },
        },
        maxTokens: 1536,
        temperature: 0.3,
      };

      // Route through intelligent router
      const response = await this.intelligentRouter.executeSupportOperation(
        feedbackRequest
      );

      if (response.success && response.text) {
        const feedback = this.parseFeedbackResponse(
          response.text,
          executionData
        );

        // Update metrics
        this.metrics.feedbackGenerated += feedback.length;

        return feedback;
      }

      return [];
    } catch (error) {
      console.error("Feedback generation failed:", error);
      return [];
    }
  }

  /**
   * Perform comprehensive execution analysis
   */
  async performComprehensiveAnalysis(): Promise<ExecutionAnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    try {
      // Get execution statistics
      const recentExecutions = this.getRecentExecutions();
      const successRate = this.calculateSuccessRate(recentExecutions);
      const averageLatency = this.calculateAverageLatency(recentExecutions);

      // Detect patterns
      const patterns = await this.detectFailurePatterns();

      // Generate comprehensive feedback
      const allFeedback: ExecutionFeedback[] = [];
      for (const execution of recentExecutions.slice(-10)) {
        const feedback = await this.generateExecutionFeedback(
          execution,
          patterns
        );
        allFeedback.push(...feedback);
      }

      // Generate recommendations using direct Bedrock
      const recommendations = await this.generateRecommendations(
        recentExecutions,
        patterns,
        allFeedback
      );

      // Calculate health score
      const healthScore = this.calculateHealthScore(
        successRate,
        averageLatency,
        patterns
      );

      const result: ExecutionAnalysisResult = {
        analysisId,
        timestamp: new Date(),
        executionCount: recentExecutions.length,
        successRate,
        averageLatency,
        detectedPatterns: patterns,
        generatedFeedback: allFeedback,
        recommendations,
        healthScore,
        analysisLatencyMs: Date.now() - startTime,
      };

      // Cache the result
      this.analysisCache.set(analysisId, result);

      // Update metrics
      this.updateMetrics(true, Date.now() - startTime);

      return result;
    } catch (error) {
      console.error("Comprehensive analysis failed:", error);
      this.updateMetrics(false, Date.now() - startTime);

      // Return minimal result on error
      return {
        analysisId,
        timestamp: new Date(),
        executionCount: 0,
        successRate: 0,
        averageLatency: 0,
        detectedPatterns: [],
        generatedFeedback: [],
        recommendations: { immediate: [], shortTerm: [], longTerm: [] },
        healthScore: 0,
        analysisLatencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get meta monitor health status
   */
  getHealthStatus() {
    const recentExecutions = this.getRecentExecutions();
    const successRate = this.calculateSuccessRate(recentExecutions);

    return {
      isHealthy: successRate > 0.8 && this.metrics.successfulAnalyses > 0,
      executionCount: recentExecutions.length,
      successRate,
      patternsDetected: this.detectedPatterns.size,
      lastAnalysis: this.getLastAnalysisTime(),
      metrics: this.metrics,
    };
  }

  /**
   * Get meta monitor metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      executionHistorySize: this.executionHistory.size,
      detectedPatternsCount: this.detectedPatterns.size,
      analysisCacheSize: this.analysisCache.size,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear intervals
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = undefined;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Clear timeouts
    this.activeTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.activeTimeouts.clear();

    // Clear data
    this.executionHistory.clear();
    this.detectedPatterns.clear();
    this.analysisCache.clear();
  }

  // Private implementation methods

  private initializeMetrics() {
    return {
      totalAnalyses: 0,
      patternsDetected: 0,
      feedbackGenerated: 0,
      averageAnalysisTime: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
    };
  }

  private startMonitoring(): void {
    // Start periodic analysis
    this.analysisInterval = setInterval(async () => {
      try {
        await this.performComprehensiveAnalysis();
      } catch (error) {
        console.error("Periodic analysis failed:", error);
      }
    }, this.config.analysisInterval);

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, this.config.retentionPeriod / 4); // Cleanup every 6 hours if retention is 24h
  }

  private storeExecutionData(executionData: KiroExecutionData): void {
    this.executionHistory.set(executionData.executionId, executionData);
  }

  private async performRealTimeAnalysis(
    executionData: KiroExecutionData,
    correlationId: string
  ): Promise<ExecutionFeedback[]> {
    // Check if this execution indicates a problem
    if (
      executionData.status === "failure" ||
      executionData.status === "error" ||
      executionData.latencyMs > this.config.performanceThreshold
    ) {
      // Generate immediate feedback
      return await this.generateExecutionFeedback(executionData, []);
    }

    return [];
  }

  private getRecentExecutions(): KiroExecutionData[] {
    const cutoffTime = Date.now() - this.config.retentionPeriod;
    return Array.from(this.executionHistory.values()).filter(
      (exec) => exec.timestamp.getTime() > cutoffTime
    );
  }

  private calculateSuccessRate(executions: KiroExecutionData[]): number {
    if (executions.length === 0) return 1.0;

    const successCount = executions.filter(
      (exec) => exec.status === "success"
    ).length;
    return successCount / executions.length;
  }

  private calculateAverageLatency(executions: KiroExecutionData[]): number {
    if (executions.length === 0) return 0;

    const totalLatency = executions.reduce(
      (sum, exec) => sum + exec.latencyMs,
      0
    );
    return totalLatency / executions.length;
  }

  private calculateHealthScore(
    successRate: number,
    averageLatency: number,
    patterns: FailurePattern[]
  ): number {
    let score = 100;

    // Deduct for low success rate
    score -= (1 - successRate) * 50;

    // Deduct for high latency
    if (averageLatency > this.config.performanceThreshold) {
      score -= Math.min(
        30,
        (averageLatency / this.config.performanceThreshold - 1) * 20
      );
    }

    // Deduct for critical patterns
    const criticalPatterns = patterns.filter((p) => p.severity === "critical");
    score -= criticalPatterns.length * 15;

    // Deduct for high severity patterns
    const highPatterns = patterns.filter((p) => p.severity === "high");
    score -= highPatterns.length * 10;

    return Math.max(0, Math.round(score));
  }

  private buildPatternAnalysisPrompt(failures: KiroExecutionData[]): string {
    return `Analyze the following Kiro execution failures to detect patterns:

${failures
  .map(
    (f, i) => `
Failure ${i + 1}:
- Operation: ${f.operation}
- Error: ${f.error?.type} - ${f.error?.message}
- Latency: ${f.latencyMs}ms
- Context: ${JSON.stringify(f.context)}
- Timestamp: ${f.timestamp.toISOString()}
`
  )
  .join("\n")}

Please identify:
1. Recurring error patterns
2. Performance degradation patterns
3. Resource exhaustion patterns
4. Common factors across failures
5. Suggested remediation actions

Format your response as JSON with the following structure:
{
  "patterns": [
    {
      "type": "recurring_error|performance_degradation|timeout_cluster|resource_exhaustion",
      "severity": "low|medium|high|critical",
      "description": "Pattern description",
      "affectedOperations": ["operation1", "operation2"],
      "commonFactors": {"factor": "value"},
      "suggestedActions": ["action1", "action2"],
      "confidence": 0.85
    }
  ]
}`;
  }

  private buildFeedbackGenerationPrompt(
    executionData: KiroExecutionData,
    patterns: FailurePattern[]
  ): string {
    return `Generate actionable feedback for this Kiro execution:

Execution Details:
- Operation: ${executionData.operation}
- Status: ${executionData.status}
- Latency: ${executionData.latencyMs}ms
- Error: ${executionData.error?.message || "None"}
- Context: ${JSON.stringify(executionData.context)}

Related Patterns:
${patterns.map((p) => `- ${p.type}: ${p.severity} severity`).join("\n")}

Please provide:
1. Immediate optimization suggestions
2. Warning about potential issues
3. Error prevention recommendations
4. Performance improvement suggestions

Format as JSON:
{
  "feedback": [
    {
      "type": "optimization|warning|error_prevention|performance_improvement",
      "priority": "low|medium|high|urgent",
      "message": "Feedback message",
      "actionable": true,
      "suggestedFix": {
        "description": "Fix description",
        "estimatedImpact": "Impact description"
      }
    }
  ]
}`;
  }

  private async generateRecommendations(
    executions: KiroExecutionData[],
    patterns: FailurePattern[],
    feedback: ExecutionFeedback[]
  ): Promise<{ immediate: string[]; shortTerm: string[]; longTerm: string[] }> {
    try {
      const recommendationRequest: SupportOperationRequest = {
        operation: "meta_monitor",
        priority: "medium",
        prompt: `Based on the execution analysis, generate strategic recommendations:

Execution Summary:
- Total executions: ${executions.length}
- Success rate: ${this.calculateSuccessRate(executions)}
- Average latency: ${this.calculateAverageLatency(executions)}ms

Detected Patterns: ${patterns.length}
Generated Feedback: ${feedback.length}

Provide recommendations in three categories:
1. Immediate actions (can be done now)
2. Short-term improvements (1-2 weeks)
3. Long-term strategic changes (1+ months)

Format as JSON:
{
  "immediate": ["action1", "action2"],
  "shortTerm": ["improvement1", "improvement2"],
  "longTerm": ["strategy1", "strategy2"]
}`,
        context: {
          correlationId: this.generateCorrelationId(),
          metadata: { analysisType: "recommendations" },
        },
        maxTokens: 1024,
        temperature: 0.4,
      };

      const response = await this.intelligentRouter.executeSupportOperation(
        recommendationRequest
      );

      if (response.success && response.text) {
        try {
          const parsed = JSON.parse(response.text);
          return {
            immediate: parsed.immediate || [],
            shortTerm: parsed.shortTerm || [],
            longTerm: parsed.longTerm || [],
          };
        } catch (parseError) {
          console.error("Failed to parse recommendations:", parseError);
        }
      }
    } catch (error) {
      console.error("Recommendation generation failed:", error);
    }

    // Return default recommendations on error
    return {
      immediate: ["Monitor system health", "Check error logs"],
      shortTerm: ["Optimize performance bottlenecks", "Improve error handling"],
      longTerm: [
        "Implement predictive monitoring",
        "Enhance system architecture",
      ],
    };
  }

  private parsePatternAnalysisResponse(response: string): FailurePattern[] {
    try {
      const parsed = JSON.parse(response);
      return (parsed.patterns || []).map((p: any) => ({
        patternId: this.generatePatternId(),
        type: p.type,
        severity: p.severity,
        frequency: 1, // Will be updated as pattern is observed
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        affectedOperations: p.affectedOperations || [],
        commonFactors: p.commonFactors || {},
        suggestedActions: p.suggestedActions || [],
        confidence: p.confidence || 0.5,
      }));
    } catch (error) {
      console.error("Failed to parse pattern analysis response:", error);
      return [];
    }
  }

  private parseFeedbackResponse(
    response: string,
    executionData: KiroExecutionData
  ): ExecutionFeedback[] {
    try {
      const parsed = JSON.parse(response);
      return (parsed.feedback || []).map((f: any) => ({
        feedbackId: this.generateFeedbackId(),
        executionId: executionData.executionId,
        timestamp: new Date(),
        type: f.type,
        priority: f.priority,
        message: f.message,
        actionable: f.actionable || false,
        suggestedFix: f.suggestedFix,
        correlationId: executionData.correlationId,
      }));
    } catch (error) {
      console.error("Failed to parse feedback response:", error);
      return [];
    }
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.retentionPeriod;

    // Clean execution history
    for (const [id, execution] of this.executionHistory.entries()) {
      if (execution.timestamp.getTime() < cutoffTime) {
        this.executionHistory.delete(id);
      }
    }

    // Clean analysis cache
    for (const [id, analysis] of this.analysisCache.entries()) {
      if (analysis.timestamp.getTime() < cutoffTime) {
        this.analysisCache.delete(id);
      }
    }
  }

  private getLastAnalysisTime(): Date | null {
    const analyses = Array.from(this.analysisCache.values());
    if (analyses.length === 0) return null;

    return analyses.reduce(
      (latest, analysis) =>
        analysis.timestamp > latest ? analysis.timestamp : latest,
      analyses[0].timestamp
    );
  }

  private updateMetrics(success: boolean, latencyMs: number): void {
    this.metrics.totalAnalyses++;

    if (success) {
      this.metrics.successfulAnalyses++;
    } else {
      this.metrics.failedAnalyses++;
    }

    // Update average analysis time
    const totalTime =
      this.metrics.averageAnalysisTime * (this.metrics.totalAnalyses - 1) +
      latencyMs;
    this.metrics.averageAnalysisTime = totalTime / this.metrics.totalAnalyses;
  }

  private generateCorrelationId(): string {
    return `meta-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateAnalysisId(): string {
    return `analysis-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }

  private generatePatternId(): string {
    return `pattern-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }

  private generateFeedbackId(): string {
    return `feedback-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
  }
}

// Export types for external use
export {
  type ExecutionAnalysisResult,
  type ExecutionFeedback,
  type FailurePattern,
  type KiroExecutionData,
  type MetaMonitorConfig,
};
