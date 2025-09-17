/**
 * Decision Engine - Handles decision trees and intelligent workflow routing
 * Manages complex decision logic, conditional branching, and adaptive workflows
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DecisionTree,
  DecisionNode,
  DecisionVariable,
  DecisionOutcome,
  DecisionAction,
  WorkflowExecution,
  WorkflowError
} from './types';

export interface DecisionContext {
  execution: WorkflowExecution;
  variables: Record<string, any>;
  stepOutputs: Record<string, any>;
  agentMetrics: Record<string, any>;
  environmentData: Record<string, any>;
}

export interface DecisionResult {
  outcomeId: string;
  outcome: DecisionOutcome;
  actions: DecisionAction[];
  confidence: number;
  reasoning: string[];
  variables: Record<string, any>;
}

export class DecisionEngine {
  private decisionHistory: Map<string, DecisionResult[]> = new Map();
  private variableResolvers: Map<string, VariableResolver> = new Map();
  private actionExecutors: Map<string, ActionExecutor> = new Map();
  
  // NEU: schneller Lookup
  private nodeIndex: Map<string, DecisionNode> = new Map();

  constructor() {
    this.initializeDefaultResolvers();
    this.initializeDefaultExecutors();
  }

  /**
   * Execute a decision tree with given context
   */
  async executeDecisionTree(
    tree: DecisionTree,
    execution: WorkflowExecution,
    additionalContext?: Record<string, any>
  ): Promise<DecisionResult> {
    console.log(`Executing decision tree: ${tree.id} for execution: ${execution.id}`);

    // Build decision context
    const context = await this.buildDecisionContext(tree, execution, additionalContext);

    // Resolve all variables
    const resolvedVariables = await this.resolveVariables(tree.variables, context);

    // Traverse decision tree
    const outcome = await this.traverseDecisionTree(tree, tree.rootNode, resolvedVariables, context);

    // Calculate confidence based on decision path
    const confidence = this.calculateDecisionConfidence(outcome, resolvedVariables);

    // Generate reasoning
    const reasoning = this.generateDecisionReasoning(outcome, resolvedVariables, context);

    const result: DecisionResult = {
      outcomeId: outcome.id,
      outcome,
      actions: outcome.actions,
      confidence,
      reasoning,
      variables: resolvedVariables
    };

    // Record decision in history
    this.recordDecision(execution.id, result);

    console.log(`Decision tree executed: ${tree.id} -> outcome: ${outcome.id} (confidence: ${confidence})`);

    return result;
  }

  /**
   * Create a dynamic decision tree based on workflow state
   */
  async createDynamicDecisionTree(
    execution: WorkflowExecution,
    criteria: DecisionCriteria
  ): Promise<DecisionTree> {
    const treeId = uuidv4();
    
    console.log(`Creating dynamic decision tree for execution: ${execution.id}`);

    // Analyze execution state to determine decision points
    const decisionPoints = this.analyzeExecutionState(execution, criteria);

    // Build decision nodes
    const rootNode = this.buildDecisionNodes(decisionPoints);

    // Generate variables based on execution context
    const variables = this.generateDecisionVariables(execution, criteria);

    // Create outcomes based on possible paths
    const outcomes = this.generateDecisionOutcomes(decisionPoints, criteria);

    const tree: DecisionTree = {
      id: treeId,
      name: `Dynamic Decision Tree - ${execution.workflowId}`,
      rootNode,
      variables,
      outcomes
    };

    return tree;
  }

  /**
   * Evaluate a single decision condition
   */
  async evaluateCondition(
    condition: string,
    variables: Record<string, any>,
    context: DecisionContext
  ): Promise<boolean> {
    try {
      const resolvedCondition = this.resolveConditionVariables(condition, variables);
      // Nur erlauben, wenn explizit gesetzt (z. B. aus Workflow-Metadaten in environmentData propagiert)
      const allow = Boolean((context.environmentData as any)?.allowCustomExpressions);
      if (!allow) return false;

      const result = this.safeEvaluate(resolvedCondition, { variables, context });
      return !!result;
    } catch (error) {
      console.error(`Condition evaluation failed: "${condition}"`, error);
      return false;
    }
  }

  /**
   * Get decision history for an execution
   */
  getDecisionHistory(executionId: string): DecisionResult[] {
    return this.decisionHistory.get(executionId) || [];
  }

  /**
   * Analyze decision patterns for optimization
   */
  analyzeDecisionPatterns(executionIds: string[]): DecisionPatternAnalysis {
    const allDecisions = executionIds.flatMap(id => this.getDecisionHistory(id));
    
    return {
      totalDecisions: allDecisions.length,
      averageConfidence: this.calculateAverageConfidence(allDecisions),
      commonOutcomes: this.findCommonOutcomes(allDecisions),
      decisionEffectiveness: this.calculateDecisionEffectiveness(allDecisions),
      optimizationSuggestions: this.generateOptimizationSuggestions(allDecisions)
    };
  }

  // Private methods

  private async buildDecisionContext(
    tree: DecisionTree,
    execution: WorkflowExecution,
    additionalContext?: Record<string, any>
  ): Promise<DecisionContext> {
    // Collect step outputs
    const stepOutputs: Record<string, any> = {};
    for (const step of execution.steps) {
      if (step.outputs) {
        stepOutputs[step.stepId] = step.outputs;
      }
    }

    // Collect agent metrics
    const agentMetrics: Record<string, any> = {};
    for (const agent of execution.agents) {
      agentMetrics[agent.agentId] = {
        processingTime: agent.totalProcessingTime,
        cost: agent.totalCost,
        qualityScore: agent.averageQualityScore,
        completedSteps: agent.completedSteps.length
      };
    }

    // Environment data
    const environmentData = {
      timestamp: new Date().toISOString(),
      executionDuration: execution.duration || 0,
      totalCost: execution.totalCost,
      qualityScore: execution.qualityScore || 0,
      ...additionalContext
    };

    return {
      execution,
      variables: {},
      stepOutputs,
      agentMetrics,
      environmentData
    };
  }

  private async resolveVariables(
    variables: DecisionVariable[],
    context: DecisionContext
  ): Promise<Record<string, any>> {
    const resolved: Record<string, any> = {};

    for (const variable of variables) {
      try {
        const resolver = this.variableResolvers.get(variable.source);
        if (resolver) {
          resolved[variable.name] = await resolver.resolve(variable, context);
        } else {
          // Direct resolution from context
          resolved[variable.name] = this.resolveVariableFromContext(variable, context);
        }

        // Apply default value if resolution failed
        if (resolved[variable.name] === undefined && variable.defaultValue !== undefined) {
          resolved[variable.name] = variable.defaultValue;
        }

      } catch (error) {
        console.error(`Variable resolution failed: ${variable.name}`, error);
        resolved[variable.name] = variable.defaultValue;
      }
    }

    return resolved;
  }

  private async traverseDecisionTree(
    tree: DecisionTree,
    node: DecisionNode,
    variables: Record<string, any>,
    context: DecisionContext
  ): Promise<DecisionOutcome> {
    console.log(`Traversing decision node: ${node.id} (type: ${node.type})`);

    switch (node.type) {
      case 'condition':
        if (!node.condition) {
          throw new WorkflowError(`Condition node missing condition: ${node.id}`, 'INVALID_DECISION_TREE', 400);
        }

        const conditionResult = await this.evaluateCondition(node.condition, variables, context);
        const nextNodeId = conditionResult ? node.trueNode : node.falseNode;

        if (!nextNodeId) {
          throw new WorkflowError(`Missing next node for condition: ${node.id}`, 'INVALID_DECISION_TREE', 400);
        }

        const nextNode = this.findNodeById(tree, nextNodeId);
        if (!nextNode) {
          throw new WorkflowError(`Node not found: ${nextNodeId}`, 'INVALID_DECISION_TREE', 400);
        }

        return await this.traverseDecisionTree(tree, nextNode, variables, context);

      case 'action':
        if (node.action) {
          await this.executeDecisionAction(node.action, context);
        }
        
        // Continue to next node if specified
        if (node.trueNode) {
          const actionNextNode = this.findNodeById(tree, node.trueNode);
          if (actionNextNode) {
            return await this.traverseDecisionTree(tree, actionNextNode, variables, context);
          }
        }
        
        // If no next node, find default outcome
        return this.findDefaultOutcome(tree);

      case 'leaf':
        // Find outcome by node ID
        const outcome = tree.outcomes.find(o => o.id === node.id);
        if (!outcome) {
          throw new WorkflowError(`Outcome not found for leaf node: ${node.id}`, 'INVALID_DECISION_TREE', 400);
        }
        return outcome;

      default:
        throw new WorkflowError(`Unknown node type: ${node.type}`, 'INVALID_DECISION_TREE', 400);
    }
  }

  // NEU: Index bauen (rekursiv)
  private buildNodeIndex(tree: DecisionTree): void {
    this.nodeIndex.clear();
    const visit = (node: DecisionNode | undefined | null) => {
      if (!node) return;
      this.nodeIndex.set(node.id, node);
      if (node.trueNode) visit(this.nodeIndex.get(node.trueNode)!);
      if (node.falseNode) visit(this.nodeIndex.get(node.falseNode)!);
    };
    // Start: Root eintragen und verlinkte Knoten nachträglich während findNodeById auflösen
    this.nodeIndex.set(tree.rootNode.id, tree.rootNode);
  }

  private findNodeById(tree: DecisionTree, nodeId: string): DecisionNode | null {
    if (!this.nodeIndex.size || !this.nodeIndex.has(tree.rootNode.id)) {
      this.buildNodeIndex(tree);
    }
    const fromIndex = this.nodeIndex.get(nodeId);
    if (fromIndex) return fromIndex;

    // Fallback: flache Suche (falls Index (noch) unvollständig)
    const queue: DecisionNode[] = [tree.rootNode];
    const seen = new Set<string>();
    while (queue.length) {
      const n = queue.shift()!;
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      if (n.id === nodeId) {
        this.nodeIndex.set(n.id, n);
        return n;
      }
      if (n.trueNode) {
        const maybe = this.nodeIndex.get(n.trueNode);
        if (maybe) queue.push(maybe);
      }
      if (n.falseNode) {
        const maybe = this.nodeIndex.get(n.falseNode);
        if (maybe) queue.push(maybe);
      }
    }
    return null;
  }

  private findDefaultOutcome(tree: DecisionTree): DecisionOutcome {
    // Return first outcome as default
    if (tree.outcomes.length === 0) {
      throw new WorkflowError('No outcomes defined in decision tree', 'INVALID_DECISION_TREE', 400);
    }
    return tree.outcomes[0];
  }

  private async executeDecisionAction(action: DecisionAction, context: DecisionContext): Promise<void> {
    const executor = this.actionExecutors.get(action.type);
    if (executor) {
      await executor.execute(action, context);
    } else {
      console.warn(`No executor found for action type: ${action.type}`);
    }
  }

  private resolveVariableFromContext(variable: DecisionVariable, context: DecisionContext): any {
    const parts = variable.source.split('.');
    let value: any = context;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }

    return value;
  }

  private resolveConditionVariables(condition: string, variables: Record<string, any>): string {
    let resolved = condition;
    
    for (const [name, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      const replacement = typeof value === 'string' ? `"${value}"` : String(value);
      resolved = resolved.replace(regex, replacement);
    }

    return resolved;
  }

  private safeEvaluate(expression: string, context: any): boolean {
    try {
      // Simple expression evaluation - in production, use a safer evaluator
      const func = new Function('context', `
        const { variables } = context;
        with (variables) {
          return Boolean(${expression});
        }
      `);
      return func(context);
    } catch (error) {
      console.error('Expression evaluation failed:', error);
      return false;
    }
  }

  private calculateDecisionConfidence(outcome: DecisionOutcome, variables: Record<string, any>): number {
    let confidence = outcome.probability || 0.7; // Base confidence

    // Adjust based on variable certainty
    const variableConfidence = Object.values(variables).reduce((sum, value) => {
      if (typeof value === 'number' && !isNaN(value)) return sum + 0.1;
      if (typeof value === 'boolean') return sum + 0.1;
      if (typeof value === 'string' && value.length > 0) return sum + 0.05;
      return sum;
    }, 0);

    confidence = Math.min(1.0, confidence + (variableConfidence / Object.keys(variables).length));

    return confidence;
  }

  private generateDecisionReasoning(
    outcome: DecisionOutcome,
    variables: Record<string, any>,
    context: DecisionContext
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Selected outcome: ${outcome.name}`);
    reasoning.push(`Based on ${Object.keys(variables).length} decision variables`);

    // Add variable-specific reasoning
    for (const [name, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null) {
        reasoning.push(`${name}: ${value}`);
      }
    }

    // Add context-specific reasoning
    if (context.execution.qualityScore) {
      reasoning.push(`Execution quality score: ${context.execution.qualityScore}`);
    }

    if (context.execution.totalCost > 0) {
      reasoning.push(`Total execution cost: ${context.execution.totalCost}`);
    }

    return reasoning;
  }

  private recordDecision(executionId: string, result: DecisionResult): void {
    if (!this.decisionHistory.has(executionId)) {
      this.decisionHistory.set(executionId, []);
    }

    const history = this.decisionHistory.get(executionId)!;
    history.push(result);

    // Keep only last 50 decisions per execution
    if (history.length > 50) {
      history.shift();
    }
  }

  private analyzeExecutionState(execution: WorkflowExecution, criteria: DecisionCriteria): DecisionPoint[] {
    const points: DecisionPoint[] = [];

    // Analyze quality scores
    if (execution.qualityScore !== undefined) {
      points.push({
        type: 'quality_threshold',
        condition: `qualityScore >= ${criteria.qualityThreshold || 0.8}`,
        weight: 0.3
      });
    }

    // Analyze cost
    if (execution.totalCost > 0) {
      points.push({
        type: 'cost_threshold',
        condition: `totalCost <= ${criteria.costThreshold || 100}`,
        weight: 0.2
      });
    }

    // Analyze execution time
    if (execution.duration) {
      points.push({
        type: 'time_threshold',
        condition: `duration <= ${criteria.timeThreshold || 300000}`, // 5 minutes
        weight: 0.2
      });
    }

    // Analyze step completion
    const completedSteps = execution.steps.filter(s => s.status === 'completed').length;
    const totalSteps = execution.steps.length;
    
    if (totalSteps > 0) {
      points.push({
        type: 'completion_rate',
        condition: `completionRate >= ${criteria.completionThreshold || 0.8}`,
        weight: 0.3
      });
    }

    return points;
  }

  private buildDecisionNodes(decisionPoints: DecisionPoint[]): DecisionNode {
    // Build a simple chain of decision nodes
    const rootNode: DecisionNode = {
      id: uuidv4(),
      type: 'condition',
      condition: decisionPoints[0]?.condition || 'true',
      trueNode: uuidv4(),
      falseNode: uuidv4()
    };

    return rootNode;
  }

  private generateDecisionVariables(execution: WorkflowExecution, criteria: DecisionCriteria): DecisionVariable[] {
    const variables: DecisionVariable[] = [];

    variables.push({
      name: 'qualityScore',
      type: 'number',
      source: 'execution.qualityScore',
      defaultValue: 0
    });

    variables.push({
      name: 'totalCost',
      type: 'number',
      source: 'execution.totalCost',
      defaultValue: 0
    });

    variables.push({
      name: 'duration',
      type: 'number',
      source: 'execution.duration',
      defaultValue: 0
    });

    variables.push({
      name: 'completionRate',
      type: 'number',
      source: 'calculated.completionRate',
      defaultValue: 0
    });

    return variables;
  }

  private generateDecisionOutcomes(decisionPoints: DecisionPoint[], criteria: DecisionCriteria): DecisionOutcome[] {
    const outcomes: DecisionOutcome[] = [];

    outcomes.push({
      id: uuidv4(),
      name: 'Continue Execution',
      description: 'All criteria met, continue with normal execution',
      actions: [
        {
          type: 'modify_workflow',
          parameters: { action: 'continue' }
        }
      ],
      probability: 0.7
    });

    outcomes.push({
      id: uuidv4(),
      name: 'Escalate for Review',
      description: 'Quality or performance issues detected, escalate for human review',
      actions: [
        {
          type: 'escalate',
          parameters: { reason: 'quality_threshold_not_met' }
        }
      ],
      probability: 0.2
    });

    outcomes.push({
      id: uuidv4(),
      name: 'Terminate Execution',
      description: 'Critical issues detected, terminate execution',
      actions: [
        {
          type: 'terminate',
          parameters: { reason: 'critical_failure' }
        }
      ],
      probability: 0.1
    });

    return outcomes;
  }

  private calculateAverageConfidence(decisions: DecisionResult[]): number {
    if (decisions.length === 0) return 0;
    return decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
  }

  private findCommonOutcomes(decisions: DecisionResult[]): Array<{ outcomeId: string; count: number; percentage: number }> {
    const counts = new Map<string, number>();
    
    for (const decision of decisions) {
      counts.set(decision.outcomeId, (counts.get(decision.outcomeId) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([outcomeId, count]) => ({
        outcomeId,
        count,
        percentage: (count / decisions.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateDecisionEffectiveness(decisions: DecisionResult[]): number {
    // Simple effectiveness calculation based on confidence and outcome success
    if (decisions.length === 0) return 0;
    
    const avgConfidence = this.calculateAverageConfidence(decisions);
    const successRate = decisions.filter(d => d.outcome.name.includes('Continue')).length / decisions.length;
    
    return (avgConfidence + successRate) / 2;
  }

  private generateOptimizationSuggestions(decisions: DecisionResult[]): string[] {
    const suggestions: string[] = [];
    
    const avgConfidence = this.calculateAverageConfidence(decisions);
    if (avgConfidence < 0.7) {
      suggestions.push('Consider refining decision criteria to improve confidence scores');
    }

    const escalationRate = decisions.filter(d => d.outcome.name.includes('Escalate')).length / decisions.length;
    if (escalationRate > 0.3) {
      suggestions.push('High escalation rate detected - review quality thresholds');
    }

    const terminationRate = decisions.filter(d => d.outcome.name.includes('Terminate')).length / decisions.length;
    if (terminationRate > 0.1) {
      suggestions.push('Consider implementing recovery mechanisms to reduce termination rate');
    }

    return suggestions;
  }

  private initializeDefaultResolvers(): void {
    this.variableResolvers.set('execution', new ExecutionVariableResolver());
    this.variableResolvers.set('agent', new AgentVariableResolver());
    this.variableResolvers.set('environment', new EnvironmentVariableResolver());
    this.variableResolvers.set('calculated', new CalculatedVariableResolver());
  }

  private initializeDefaultExecutors(): void {
    this.actionExecutors.set('assign_agent', new AssignAgentExecutor());
    this.actionExecutors.set('modify_workflow', new ModifyWorkflowExecutor());
    this.actionExecutors.set('escalate', new EscalateExecutor());
    this.actionExecutors.set('terminate', new TerminateExecutor());
    this.actionExecutors.set('send_notification', new NotificationExecutor());
  }
}

// Supporting interfaces and classes

interface DecisionCriteria {
  qualityThreshold?: number;
  costThreshold?: number;
  timeThreshold?: number;
  completionThreshold?: number;
}

interface DecisionPoint {
  type: string;
  condition: string;
  weight: number;
}

interface DecisionPatternAnalysis {
  totalDecisions: number;
  averageConfidence: number;
  commonOutcomes: Array<{ outcomeId: string; count: number; percentage: number }>;
  decisionEffectiveness: number;
  optimizationSuggestions: string[];
}

// Variable Resolvers

interface VariableResolver {
  resolve(variable: DecisionVariable, context: DecisionContext): Promise<any>;
}

class ExecutionVariableResolver implements VariableResolver {
  async resolve(variable: DecisionVariable, context: DecisionContext): Promise<any> {
    const path = variable.source.replace('execution.', '');
    return this.getNestedValue(context.execution, path);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

class AgentVariableResolver implements VariableResolver {
  async resolve(variable: DecisionVariable, context: DecisionContext): Promise<any> {
    const path = variable.source.replace('agent.', '');
    return this.getNestedValue(context.agentMetrics, path);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

class EnvironmentVariableResolver implements VariableResolver {
  async resolve(variable: DecisionVariable, context: DecisionContext): Promise<any> {
    const path = variable.source.replace('environment.', '');
    return this.getNestedValue(context.environmentData, path);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

class CalculatedVariableResolver implements VariableResolver {
  async resolve(variable: DecisionVariable, context: DecisionContext): Promise<any> {
    const calculationType = variable.source.replace('calculated.', '');
    
    switch (calculationType) {
      case 'completionRate':
        const completed = context.execution.steps.filter(s => s.status === 'completed').length;
        const total = context.execution.steps.length;
        return total > 0 ? completed / total : 0;
      
      case 'averageQuality':
        const qualityScores = context.execution.steps
          .filter(s => s.qualityScore !== undefined)
          .map(s => s.qualityScore!);
        return qualityScores.length > 0 
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
          : 0;
      
      case 'costEfficiency':
        return context.execution.qualityScore && context.execution.totalCost > 0
          ? context.execution.qualityScore / context.execution.totalCost
          : 0;
      
      default:
        return undefined;
    }
  }
}

// Action Executors

interface ActionExecutor {
  execute(action: DecisionAction, context: DecisionContext): Promise<void>;
}

class AssignAgentExecutor implements ActionExecutor {
  async execute(action: DecisionAction, context: DecisionContext): Promise<void> {
    console.log('Executing assign agent action:', action.parameters);
    // Implementation would reassign agents based on parameters
  }
}

class ModifyWorkflowExecutor implements ActionExecutor {
  async execute(action: DecisionAction, context: DecisionContext): Promise<void> {
    console.log('Executing modify workflow action:', action.parameters);
    // Implementation would modify workflow execution based on parameters
  }
}

class EscalateExecutor implements ActionExecutor {
  async execute(action: DecisionAction, context: DecisionContext): Promise<void> {
    console.log('Executing escalate action:', action.parameters);
    context.execution.metadata.humanReviewRequired = true;
  }
}

class TerminateExecutor implements ActionExecutor {
  async execute(action: DecisionAction, context: DecisionContext): Promise<void> {
    console.log('Executing terminate action:', action.parameters);
    context.execution.status = 'cancelled';
  }
}

class NotificationExecutor implements ActionExecutor {
  async execute(action: DecisionAction, context: DecisionContext): Promise<void> {
    console.log('Executing notification action:', action.parameters);
    // Implementation would send notifications based on parameters
  }
}