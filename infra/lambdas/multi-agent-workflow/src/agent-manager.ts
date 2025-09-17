/**
 * Agent Manager - Handles agent lifecycle, specialization, and coordination
 * Manages agent initialization, task assignment, and performance monitoring
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AgentDefinition,
  AgentType,
  AgentSpecialization,
  AgentCapability,
  AgentConfiguration,
  WorkflowStep,
  StepType,
  AgentPerformanceMetrics,
  CommunicationEntry,
  MemoryUpdate,
  AgentNotAvailableError,
  WorkflowError
} from './types';

export interface AgentExecutionResult {
  outputs: Record<string, any>;
  cost: number;
  qualityScore: number;
  processingTime: number;
  memoryUpdates: MemoryUpdate[];
  communicationLog: CommunicationEntry[];
}

export interface AgentInstance {
  id: string;
  definition: AgentDefinition;
  status: 'idle' | 'busy' | 'error' | 'maintenance';
  currentExecutions: string[];
  performanceMetrics: AgentPerformanceMetrics;
  lastHealthCheck: Date;
  memoryContexts: Map<string, any>;
}

export class AgentManager {
  private agents: Map<string, AgentInstance> = new Map();
  private agentCapabilities: Map<string, AgentCapability[]> = new Map();
  private loadBalancer: AgentLoadBalancer;
  private performanceTracker: AgentPerformanceTracker;

  constructor() {
    this.loadBalancer = new AgentLoadBalancer();
    this.performanceTracker = new AgentPerformanceTracker();
  }

  /**
   * Register an agent with the manager
   */
  async registerAgent(definition: AgentDefinition): Promise<void> {
    const instance: AgentInstance = {
      id: definition.id,
      definition,
      status: 'idle',
      currentExecutions: [],
      performanceMetrics: definition.performanceMetrics,
      lastHealthCheck: new Date(),
      memoryContexts: new Map()
    };

    this.agents.set(definition.id, instance);
    this.agentCapabilities.set(definition.id, definition.capabilities);

    console.log(`Agent registered: ${definition.id} (${definition.type})`);
  }

  /**
   * Initialize agent for a specific workflow execution
   */
  async initializeAgent(definition: AgentDefinition, executionId: string): Promise<void> {
    const agent = this.agents.get(definition.id);
    if (!agent) {
      throw new AgentNotAvailableError(definition.id);
    }

    // Check if agent is available
    if (agent.status === 'maintenance' || agent.status === 'error') {
      throw new AgentNotAvailableError(definition.id);
    }

    // Initialize memory context for this execution
    if (definition.memoryConfig.enabled) {
      await this.initializeAgentMemory(definition.id, executionId);
    }

    // Add execution to agent's current executions
    agent.currentExecutions.push(executionId);
    const max = this.getMaxConcurrentExecutions(agent);
    agent.status = 'busy'; // Always busy when executing

    console.log(`Agent initialized for execution: ${definition.id} -> ${executionId}`);
  }

  /**
   * Execute a workflow step with the appropriate agent
   */
  async executeStep(
    agentId: string,
    step: WorkflowStep,
    inputs: Record<string, any>,
    executionId: string
  ): Promise<AgentExecutionResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentNotAvailableError(agentId);
    }

    const startTime = Date.now();
    console.log(`Executing step ${step.id} with agent ${agentId}`);

    try {
      // Validate agent can handle this step type
      await this.validateAgentCapability(agent, step);

      // Execute step based on agent specialization
      const result = await this.executeStepByType(agent, step, inputs, executionId);

      // Update performance metrics
      const processingTime = Date.now() - startTime;
      await this.updateAgentPerformance(agentId, step, result, processingTime);

      return result;

    } catch (error) {
      console.error(`Step execution failed for agent ${agentId}:`, error);

      // Update error metrics
      await this.recordAgentError(agentId, step, error);

      throw error;
    }
  }

  /**
   * Check if agent is available for assignment
   */
  async isAgentAvailable(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    // Check agent status
    if (agent.status === 'maintenance' || agent.status === 'error') {
      return false;
    }

    // Check load capacity
    const maxConcurrentExecutions = this.getMaxConcurrentExecutions(agent);
    return agent.currentExecutions.length < maxConcurrentExecutions;
  }

  /**
   * Get agent specialization for step type matching
   */
  getAgentSpecialization(agentId: string): AgentSpecialization | undefined {
    const agent = this.agents.get(agentId);
    return agent?.definition.specialization;
  }

  /**
   * Get agent capabilities
   */
  getAgentCapabilities(agentId: string): AgentCapability[] {
    return this.agentCapabilities.get(agentId) || [];
  }



  /**
   * Get memory value from agent context
   */
  async getMemoryValue(agentId: string, contextKey: string, path?: string): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;

    const context = agent.memoryContexts.get(contextKey);
    if (!context) return undefined;

    if (path) {
      return this.getNestedValue(context, path);
    }

    return context;
  }

  /**
   * Update agent memory context
   */
  async updateAgentMemory(
    agentId: string,
    contextKey: string,
    data: any,
    executionId: string
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.memoryContexts.set(contextKey, data);

    // Record memory update
    const memoryUpdate: MemoryUpdate = {
      contextId: contextKey,
      operation: 'update',
      data,
      timestamp: new Date()
    };

    // This would typically be sent to the AI agent memory system
    console.log(`Memory updated for agent ${agentId}: ${contextKey}`);
  }



  /**
   * Get agent performance metrics
   */
  getAgentPerformance(agentId: string): AgentPerformanceMetrics | undefined {
    const agent = this.agents.get(agentId);
    return agent?.performanceMetrics;
  }



  /**
   * List all registered agents
   */
  listAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get optimal agent for a specific step type
   */
  async getOptimalAgent(stepType: StepType, requirements?: any): Promise<string | null> {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'idle' || agent.status === 'busy')
      .filter(agent => this.canHandleStepType(agent, stepType));

    if (availableAgents.length === 0) {
      return null;
    }

    // Use load balancer to select optimal agent
    return this.loadBalancer.selectAgent(availableAgents, stepType, requirements);
  }

  // Private methods

  /**
   * Fallback capability check by agent type
   */
  private canHandleStepType(agent: AgentInstance, stepType: StepType): boolean {
    const caps = agent.definition.capabilities || [];
    const byCaps = caps.some(cap => (cap as any).supported !== false && this.isCapabilityCompatible(cap, stepType));
    if (byCaps) return true;

    const typeMap: Record<AgentType, StepType[]> = {
      analysis_agent: ['analysis', 'validation'],
      content_agent: ['generation'],
      recommendation_agent: ['decision', 'analysis'],
      validation_agent: ['validation'],
      coordination_agent: ['aggregation', 'notification'],
      specialist_agent: ['analysis', 'generation', 'validation', 'decision'],
    };

    return (typeMap[agent.definition.type] || []).includes(stepType);
  }

  /**
   * Check if agent capability is compatible with step type
   */
  private isCapabilityCompatible(capability: AgentCapability, stepType: StepType): boolean {
    const compatibilityMap: Record<AgentCapability['type'], StepType[]> = {
      'text_analysis': ['analysis', 'validation'],
      'content_generation': ['generation'],
      'data_extraction': ['analysis', 'transformation'],
      'quality_assessment': ['validation'],
      'decision_making': ['decision'],
      'coordination': ['aggregation', 'notification'],
      'validation': ['validation'],
    };

    return compatibilityMap[capability.type]?.includes(stepType) || false;
  }

  private async validateAgentCapability(agent: AgentInstance, step: WorkflowStep): Promise<void> {
    const canHandle = this.canHandleStepType(agent, step.type);

    if (!canHandle) {
      throw new WorkflowError(
        `Agent ${agent.id} cannot handle step type: ${step.type}`,
        'CAPABILITY_MISMATCH',
        400
      );
    }
  }

  private async executeStepByType(
    agent: AgentInstance,
    step: WorkflowStep,
    inputs: Record<string, any>,
    executionId: string
  ): Promise<AgentExecutionResult> {
    const agentType = agent.definition.type;

    switch (agentType) {
      case 'analysis_agent':
        return await this.executeAnalysisStep(agent, step, inputs, executionId);

      case 'content_agent':
        return await this.executeContentStep(agent, step, inputs, executionId);

      case 'recommendation_agent':
        return await this.executeRecommendationStep(agent, step, inputs, executionId);

      case 'validation_agent':
        return await this.executeValidationStep(agent, step, inputs, executionId);

      case 'coordination_agent':
        return await this.executeCoordinationStep(agent, step, inputs, executionId);

      case 'specialist_agent':
        return await this.executeSpecialistStep(agent, step, inputs, executionId);

      default:
        throw new WorkflowError(`Unsupported agent type: ${agentType}`, 'UNSUPPORTED_AGENT_TYPE', 400);
    }
  }

  private async executeAnalysisStep(
    agent: AgentInstance,
    step: WorkflowStep,
    inputs: Record<string, any>,
    executionId: string
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // 🔁 Hier 1 ms Verzögerung einfügen
    await new Promise((res) => setTimeout(res, 1));

    // Simulate analysis processing
    const analysisResult = {
      insights: this.generateAnalysisInsights(inputs),
      metrics: this.calculateAnalysisMetrics(inputs),
      recommendations: this.generateAnalysisRecommendations(inputs)
    };

    const processingTime = Date.now() - startTime;
    const cost = this.calculateStepCost(agent, processingTime);
    const qualityScore = this.calculateQualityScore(analysisResult, agent.definition.specialization);

    return {
      outputs: analysisResult,
      cost,
      qualityScore,
      processingTime,
      memoryUpdates: [],
      communicationLog: []
    };
  }

  private async executeContentStep(
    agent: AgentInstance,
    step: WorkflowStep,
    inputs: Record<string, any>,
    executionId: string
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // Simulate content generation
    const contentResult = {
      content: this.generateContent(inputs, agent.definition.specialization),
      metadata: {
        wordCount: 0,
        readabilityScore: 0.8,
        tone: agent.definition.specialization.expertise.includes('formal') ? 'formal' : 'casual'
      }
    };

    contentResult.metadata.wordCount = contentResult.content.split(' ').length;

    const processingTime = Date.now() - startTime;
    const cost = this.calculateStepCost(agent, processingTime);
    const qualityScore = this.calculateContentQuality(contentResult);

    return {
      outputs: contentResult,
      cost,
      qualityScore,
      processingTime,
      memoryUpdates: [],
      communicationLog: []
    };
  }

  private async executeRecommendationStep(
    agent: AgentInstance,
    step: WorkflowStep,
    inputs: Record<string, any>,
    executionId: string
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // Generate recommendations based on analysis
    const recommendations = this.generateRecommendations(inputs, agent.definition.specialization);

    const processingTime = Date.now() - startTime;
    const cost = this.calculateStepCost(agent, processingTime);
    const qualityScore = this.calculateRecommendationQuality(recommendations);

    return {
      outputs: { recommendations },
      cost,
      qualityScore,
      processingTime,
      memoryUpdates: [],
      communicationLog: []
    };
  }

  private async executeValidationStep(
    agent: AgentInstance,
    step: WorkflowStep,
    inputs: Record<string, any>,
    executionId: string
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // Validate inputs against quality thresholds
    const validationResult = {
      isValid: true,
      score: 0.9,
      issues: [] as string[],
      suggestions: [] as string[]
    };

    // Perform validation checks
    for (const threshold of agent.definition.specialization.qualityThresholds) {
      const actualValue = this.extractMetricValue(inputs, threshold.metric);

      if (threshold.minValue !== undefined && actualValue < threshold.minValue) {
        validationResult.isValid = false;
        validationResult.issues.push(`${threshold.metric} below minimum: ${actualValue} < ${threshold.minValue}`);
      }

      if (threshold.maxValue !== undefined && actualValue > threshold.maxValue) {
        validationResult.isValid = false;
        validationResult.issues.push(`${threshold.metric} above maximum: ${actualValue} > ${threshold.maxValue}`);
      }
    }

    const processingTime = Date.now() - startTime;
    const cost = this.calculateStepCost(agent, processingTime);

    return {
      outputs: validationResult,
      cost,
      qualityScore: validationResult.score,
      processingTime,
      memoryUpdates: [],
      communicationLog: []
    };
  }

  private async executeCoordinationStep(
    agent: AgentInstance,
    step: WorkflowStep,
    inputs: Record<string, any>,
    executionId: string
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // Coordinate between multiple agents or steps
    const coordinationResult = {
      assignments: this.generateAgentAssignments(inputs),
      schedule: this.generateExecutionSchedule(inputs),
      dependencies: this.analyzeDependencies(inputs)
    };

    const processingTime = Date.now() - startTime;
    const cost = this.calculateStepCost(agent, processingTime);

    return {
      outputs: coordinationResult,
      cost,
      qualityScore: 0.85, // Coordination quality is harder to measure
      processingTime,
      memoryUpdates: [],
      communicationLog: []
    };
  }

  private async executeSpecialistStep(
    agent: AgentInstance,
    step: WorkflowStep,
    inputs: Record<string, any>,
    executionId: string
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // Execute domain-specific processing
    const specialistResult = this.executeSpecialistLogic(
      inputs,
      agent.definition.specialization.domain,
      agent.definition.specialization.expertise
    );

    const processingTime = Date.now() - startTime;
    const cost = this.calculateStepCost(agent, processingTime);
    const qualityScore = this.calculateSpecialistQuality(specialistResult, agent.definition.specialization);

    return {
      outputs: specialistResult,
      cost,
      qualityScore,
      processingTime,
      memoryUpdates: [],
      communicationLog: []
    };
  }

  private async initializeAgentMemory(agentId: string, executionId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Initialize memory contexts for this execution
    agent.memoryContexts.set(`execution:${executionId}`, {
      executionId,
      startTime: new Date(),
      context: {},
      history: []
    });

    console.log(`Memory initialized for agent ${agentId} execution ${executionId}`);
  }

  private async updateAgentPerformance(
    agentId: string,
    step: WorkflowStep,
    result: AgentExecutionResult,
    processingTime: number
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Update performance metrics
    const metrics = agent.performanceMetrics;

    // Update response time (moving average)
    metrics.averageResponseTime = (metrics.averageResponseTime * 0.9) + (processingTime * 0.1);

    // Erfolg, wenn Qualitäts-Score >= 0.7 (Heuristik)
    const succeeded = result.qualityScore >= 0.7 ? 1 : 0;

    // EMA mit „Ground Truth" (0/1)
    metrics.successRate = (metrics.successRate * 0.9) + (succeeded * 0.1);

    // Update quality score
    metrics.qualityScore = (metrics.qualityScore * 0.9) + (result.qualityScore * 0.1);

    // Update cost efficiency
    const efficiency = result.qualityScore / result.cost;
    metrics.costEfficiency = (metrics.costEfficiency * 0.9) + (efficiency * 0.1);

    metrics.lastUpdated = new Date();

    console.log(`Performance updated for agent ${agentId}: quality=${result.qualityScore}, cost=${result.cost}`);
  }

  private async recordAgentError(agentId: string, step: WorkflowStep, error: any): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Update error metrics
    const metrics = agent.performanceMetrics;
    metrics.lastUpdated = new Date();

    // If too many errors, mark agent as error state
    if (metrics.successRate < 0.5) {
      agent.status = 'error';
      console.warn(`Agent ${agentId} marked as error due to low success rate: ${metrics.successRate}`);
    }
  }

  async releaseAgentExecution(agentId: string, executionId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.currentExecutions = agent.currentExecutions.filter(id => id !== executionId);
    const max = this.getMaxConcurrentExecutions(agent);
    agent.status = agent.currentExecutions.length >= max ? 'busy' : (agent.currentExecutions.length ? 'busy' : 'idle');

    console.log(`Agent ${agentId} released from execution ${executionId}, status: ${agent.status}`);
  }

  private getMaxConcurrentExecutions(agent: AgentInstance): number {
    // Base on agent type and configuration
    switch (agent.definition.type) {
      case 'analysis_agent': return 3;
      case 'content_agent': return 2;
      case 'recommendation_agent': return 4;
      case 'validation_agent': return 5;
      case 'coordination_agent': return 1; // Coordination requires focus
      case 'specialist_agent': return 2;
      default: return 2;
    }
  }



  private calculateStepCost(agent: AgentInstance, processingTime: number): number {
    // Calculate cost based on agent capabilities and processing time
    const baseCost = agent.definition.capabilities.reduce((sum, cap) => sum + cap.costPerOperation, 0);
    const timeFactor = Math.max(processingTime / 1000, 0.001); // Convert to seconds, minimum 1ms
    return baseCost * timeFactor;
  }

  private calculateQualityScore(result: any, specialization: AgentSpecialization): number {
    // Simple quality scoring based on result completeness and specialization match
    let score = 0.7; // Base score

    if (result.insights && result.insights.length > 0) score += 0.1;
    if (result.metrics && Object.keys(result.metrics).length > 0) score += 0.1;
    if (result.recommendations && result.recommendations.length > 0) score += 0.1;

    return Math.min(1.0, score);
  }

  private calculateContentQuality(content: any): number {
    let score = 0.6; // Base score

    if (content.metadata.wordCount > 100) score += 0.1;
    if (content.metadata.readabilityScore > 0.7) score += 0.2;
    if (content.content.length > 500) score += 0.1;

    return Math.min(1.0, score);
  }

  private calculateRecommendationQuality(recommendations: any[]): number {
    let score = 0.5; // Base score

    if (recommendations.length >= 3) score += 0.2;
    if (recommendations.some(r => r.priority === 'high')) score += 0.1;
    if (recommendations.every(r => r.rationale)) score += 0.2;

    return Math.min(1.0, score);
  }

  private calculateSpecialistQuality(result: any, specialization: AgentSpecialization): number {
    // Quality based on domain expertise match
    let score = 0.7;

    if (specialization.domain === 'restaurant_analysis' && result.businessMetrics) score += 0.2;
    if (specialization.expertise.includes('competitive_analysis') && result.competitorData) score += 0.1;

    return Math.min(1.0, score);
  }

  private generateAnalysisInsights(inputs: Record<string, any>): any[] {
    // Mock analysis insights generation
    return [
      { type: 'trend', description: 'Positive growth trend detected', confidence: 0.85 },
      { type: 'anomaly', description: 'Unusual pattern in data segment', confidence: 0.72 }
    ];
  }

  private calculateAnalysisMetrics(inputs: Record<string, any>): Record<string, number> {
    // Mock metrics calculation
    return {
      accuracy: 0.89,
      completeness: 0.95,
      relevance: 0.82
    };
  }

  private generateAnalysisRecommendations(inputs: Record<string, any>): any[] {
    // Mock recommendations
    return [
      { action: 'optimize_content', priority: 'high', rationale: 'Low engagement detected' },
      { action: 'expand_reach', priority: 'medium', rationale: 'Growth opportunity identified' }
    ];
  }

  private generateContent(inputs: Record<string, any>, specialization: AgentSpecialization): string {
    // Mock content generation based on specialization
    const domain = specialization.domain;
    const tone = specialization.expertise.includes('formal') ? 'formal' : 'casual';

    return `Generated ${tone} content for ${domain} based on provided inputs. This content addresses the key requirements and maintains appropriate tone for the target audience.`;
  }

  private generateRecommendations(inputs: Record<string, any>, specialization: AgentSpecialization): any[] {
    // Mock recommendation generation
    return [
      {
        id: uuidv4(),
        title: 'Improve Online Presence',
        description: 'Enhance digital visibility through optimized content',
        priority: 'high',
        effort: 'medium',
        impact: 'high',
        rationale: 'Analysis shows significant opportunity for improvement'
      }
    ];
  }

  private generateAgentAssignments(inputs: Record<string, any>): any[] {
    return [
      { agentId: 'analysis-agent-1', task: 'data_analysis', priority: 1 },
      { agentId: 'content-agent-1', task: 'content_generation', priority: 2 }
    ];
  }

  private generateExecutionSchedule(inputs: Record<string, any>): any {
    return {
      phases: [
        { name: 'analysis', duration: 300, dependencies: [] },
        { name: 'generation', duration: 600, dependencies: ['analysis'] }
      ]
    };
  }

  private analyzeDependencies(inputs: Record<string, any>): any[] {
    return [
      { from: 'step1', to: 'step2', type: 'data_dependency' },
      { from: 'step2', to: 'step3', type: 'sequence_dependency' }
    ];
  }

  private executeSpecialistLogic(inputs: Record<string, any>, domain: string, expertise: string[]): any {
    // Domain-specific processing
    switch (domain) {
      case 'restaurant_analysis':
        return {
          businessMetrics: { revenue: 100000, customers: 500 },
          competitorData: { marketShare: 0.15, ranking: 3 },
          recommendations: ['improve_reviews', 'optimize_menu']
        };

      default:
        return { processed: true, domain, expertise };
    }
  }

  private extractMetricValue(inputs: Record<string, any>, metric: string): number {
    // Extract metric value from inputs
    return inputs[metric] || 0;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * Agent Load Balancer - Distributes work across available agents
 */
class AgentLoadBalancer {
  selectAgent(
    availableAgents: AgentInstance[],
    stepType: StepType,
    requirements?: any
  ): string {
    // Simple load balancing based on current load and performance
    const scored = availableAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, stepType, requirements)
    }));

    // Sort by score (higher is better)
    scored.sort((a, b) => b.score - a.score);

    return scored[0].agent.id;
  }

  private calculateAgentScore(
    agent: AgentInstance,
    stepType: StepType,
    requirements?: any
  ): number {
    let score = 0;

    // Performance factors
    score += agent.performanceMetrics.qualityScore * 0.4;
    score += agent.performanceMetrics.costEfficiency * 0.3;
    score += (1 - (agent.currentExecutions.length / 5)) * 0.2; // Load factor
    score += agent.performanceMetrics.successRate * 0.1;

    return score;
  }
}

/**
 * Agent Performance Tracker - Monitors and analyzes agent performance
 */
class AgentPerformanceTracker {
  private performanceHistory: Map<string, any[]> = new Map();

  recordPerformance(agentId: string, metrics: any): void {
    if (!this.performanceHistory.has(agentId)) {
      this.performanceHistory.set(agentId, []);
    }

    const history = this.performanceHistory.get(agentId)!;
    history.push({
      timestamp: new Date(),
      ...metrics
    });

    // Keep only last 100 records
    if (history.length > 100) {
      history.shift();
    }
  }

  getPerformanceTrend(agentId: string): any {
    const history = this.performanceHistory.get(agentId) || [];
    if (history.length < 2) return null;

    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    return {
      qualityTrend: this.calculateTrend(recent, older, 'qualityScore'),
      costTrend: this.calculateTrend(recent, older, 'costEfficiency'),
      speedTrend: this.calculateTrend(recent, older, 'averageResponseTime')
    };
  }

  private calculateTrend(recent: any[], older: any[], metric: string): number {
    if (recent.length === 0 || older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, item) => sum + item[metric], 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item[metric], 0) / older.length;

    return (recentAvg - olderAvg) / olderAvg;
  }
}