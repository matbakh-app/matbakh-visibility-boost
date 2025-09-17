/**
 * Workflow Orchestrator - Core engine for multi-step AI operations
 * Manages workflow execution, agent coordination, decision trees, timeouts, retries
 * Hardened for 8.2 Agent Collaboration Framework
 */

import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowDefinition,
  WorkflowExecution,
  StepExecution,
  AgentExecution,
  ExecutionStatus,
  WorkflowStep,
  AgentDefinition,
  DecisionTree,
  DecisionNode,
  StepCondition,
  CommunicationEntry,
  MemoryUpdate,
  ExecutionError,
  QualityGate,
  WorkflowError,
  ExecutionTimeoutError,
  AgentNotAvailableError
} from './types';
import { AgentManager } from './agent-manager';
import { DecisionEngine } from './decision-engine';
import { CommunicationManager } from './communication-manager';
import { createHandoff, handoffToJSON } from './handoff';

// Helper function for safe error pushing
function pushExecError(execution: WorkflowExecution, e: any) {
  if (!execution.errorDetails) execution.errorDetails = [];
  execution.errorDetails.push(e);
}

type Priority = 'low' | 'normal' | 'high' | 'urgent';

export class WorkflowOrchestrator {
  private agentManager: AgentManager;
  private decisionEngine: DecisionEngine;
  private communicationManager: CommunicationManager;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private executionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    agentManager: AgentManager,
    decisionEngine: DecisionEngine,
    communicationManager: CommunicationManager
  ) {
    this.agentManager = agentManager;
    this.decisionEngine = decisionEngine;
    this.communicationManager = communicationManager;
  }

  /**
   * Execute a workflow with comprehensive orchestration
   */
  async executeWorkflow(
    definition: WorkflowDefinition,
    inputs: Record<string, any>,
    tenantId: string,
    userId: string,
    priority: Priority = 'normal'
  ): Promise<WorkflowExecution> {
    const executionId = uuidv4();
    const startTime = new Date();

    const tags = (definition.metadata && Array.isArray(definition.metadata.tags))
      ? definition.metadata.tags
      : [];

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: definition.id,
      status: 'running',
      inputs,
      outputs: {},
      steps: [],
      agents: [],
      startTime,
      totalCost: 0,
      errorDetails: [],
      metadata: {
        userId,
        tenantId,
        priority,
        tags,
        childExecutionIds: [],
        humanReviewRequired: false,
        qualityGates: []
      }
    };

    this.activeExecutions.set(executionId, execution);
    console.log(`Starting workflow execution: ${executionId} for workflow: ${definition.id}`);

    try {
      await this.validateWorkflow(definition);
      await this.initializeAgents(definition.agents, definition, execution);

      const estMinutes = Number(definition.metadata?.estimatedDuration) || 5; // sane default
      this.setupExecutionTimeout(execution, estMinutes * 60 * 1000);

      await this.executeWorkflowSteps(definition, execution);

      // Sammle Step-Status
      const stepStatuses = execution.steps.map(s => s.status);

      // Priorisierte Aggregation
      if (stepStatuses.includes('timeout')) {
        execution.status = 'timeout';
      } else if (stepStatuses.includes('failed')) {
        execution.status = 'failed';
      } else {
        execution.status = 'completed';
      }

      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.qualityScore = this.calculateOverallQualityScore(execution);

      console.log(`Workflow execution completed: ${executionId} in ${execution.duration}ms`);
    } catch (error: any) {
      console.error(`Workflow execution failed: ${executionId}`, error);

      execution.status = 'failed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      execution.errorDetails = execution.errorDetails || [];
      execution.errorDetails.push({
        errorType: error?.constructor?.name || 'UnknownError',
        errorMessage: error?.message || 'Unknown error occurred',
        timestamp: new Date(),
        recoverable: false,
        retryCount: 0
      });
    } finally {
      this.cleanupExecution(executionId);
    }

    return execution;
  }

  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) throw new WorkflowError(`Execution not found: ${executionId}`, 'EXECUTION_NOT_FOUND', 404);
    if (execution.status !== 'running') throw new WorkflowError(`Cannot pause execution in status: ${execution.status}`, 'INVALID_STATUS', 400);

    execution.status = 'paused';

    for (const agentExecution of execution.agents) {
      await this.communicationManager.sendMessage({
        id: uuidv4(),
        fromAgent: 'orchestrator',
        toAgent: agentExecution.agentId,
        messageType: 'notification',
        content: { action: 'pause', executionId },
        timestamp: new Date(),
        acknowledged: false
      });
    }
    console.log(`Workflow execution paused: ${executionId}`);
  }

  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) throw new WorkflowError(`Execution not found: ${executionId}`, 'EXECUTION_NOT_FOUND', 404);
    if (execution.status !== 'paused') throw new WorkflowError(`Cannot resume execution in status: ${execution.status}`, 'INVALID_STATUS', 400);

    execution.status = 'running';

    for (const agentExecution of execution.agents) {
      await this.communicationManager.sendMessage({
        id: uuidv4(),
        fromAgent: 'orchestrator',
        toAgent: agentExecution.agentId,
        messageType: 'notification',
        content: { action: 'resume', executionId },
        timestamp: new Date(),
        acknowledged: false
      });
    }
    console.log(`Workflow execution resumed: ${executionId}`);
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) throw new WorkflowError(`Execution not found: ${executionId}`, 'EXECUTION_NOT_FOUND', 404);

    execution.status = 'cancelled';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

    for (const agentExecution of execution.agents) {
      await this.communicationManager.sendMessage({
        id: uuidv4(),
        fromAgent: 'orchestrator',
        toAgent: agentExecution.agentId,
        messageType: 'notification',
        content: { action: 'cancel', executionId },
        timestamp: new Date(),
        acknowledged: false
      });
    }

    this.cleanupExecution(executionId);
    console.log(`Workflow execution cancelled: ${executionId}`);
  }

  getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  listActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  // ---------- Private ----------

  private async validateWorkflow(definition: WorkflowDefinition): Promise<void> {
    if (!definition.steps || definition.steps.length === 0) {
      throw new WorkflowError('Workflow must have at least one step', 'VALIDATION_ERROR', 400);
    }
    if (!definition.agents || definition.agents.length === 0) {
      throw new WorkflowError('Workflow must have at least one agent', 'VALIDATION_ERROR', 400);
    }

    const stepIds = new Set(definition.steps.map(s => s.id));
    for (const step of definition.steps) {
      for (const depId of step.dependencies || []) {
        if (!stepIds.has(depId)) {
          throw new WorkflowError(`Invalid dependency: ${depId} in step ${step.id}`, 'VALIDATION_ERROR', 400);
        }
      }
    }

    const agentIds = new Set(definition.agents.map(a => a.id));
    for (const step of definition.steps) {
      if (!agentIds.has(step.agentId)) {
        throw new WorkflowError(`Invalid agent assignment: ${step.agentId} in step ${step.id}`, 'VALIDATION_ERROR', 400);
      }
    }
    console.log(`Workflow validation passed: ${definition.id}`);
  }

  private async initializeAgents(
    agentDefinitions: AgentDefinition[],
    definition: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    for (const agentDef of agentDefinitions) {
      try {
        const isAvailable = await this.agentManager.isAgentAvailable(agentDef.id);
        if (!isAvailable) throw new AgentNotAvailableError(agentDef.id);

        await this.agentManager.initializeAgent(agentDef, execution.id);

        // FIX: assignedSteps must come from workflow definition, not execution.steps (empty at this time)
        const assignedSteps = definition.steps
          .filter(s => s.agentId === agentDef.id)
          .map(s => s.id);

        const agentExecution: AgentExecution = {
          agentId: agentDef.id,
          status: 'pending',
          assignedSteps,
          completedSteps: [],
          totalProcessingTime: 0,
          totalCost: 0,
          averageQualityScore: 0,
          communicationLog: [],
          memoryUpdates: []
        };

        execution.agents.push(agentExecution);
      } catch (error) {
        console.error(`Failed to initialize agent ${agentDef.id}:`, error);
        throw error;
      }
    }
    console.log(`Initialized ${agentDefinitions.length} agents for execution: ${execution.id}`);
  }

  private setupExecutionTimeout(execution: WorkflowExecution, timeoutMs: number): void {
    const timeout = setTimeout(() => {
      console.log(`Execution timeout reached: ${execution.id}`);

      execution.status = 'timeout';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      execution.errorDetails = execution.errorDetails || [];
      execution.errorDetails.push({
        errorType: 'ExecutionTimeoutError',
        errorMessage: `Execution exceeded timeout of ${timeoutMs}ms`,
        timestamp: new Date(),
        recoverable: false,
        retryCount: 0
      });

      this.cleanupExecution(execution.id);
    }, Math.max(1, timeoutMs));

    this.executionTimeouts.set(execution.id, timeout);
  }

  private async executeWorkflowSteps(
    definition: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    const completedSteps = new Set<string>();
    const runningSteps = new Map<string, Promise<void>>();
    const dependencyGraph = this.buildDependencyGraph(definition.steps);

    // Configurable parallelism (default 1)
    const maxParallel = Number(definition.metadata?.maxConcurrentSteps) || 1;

    while (completedSteps.size < definition.steps.length && execution.status === 'running') {
      const readySteps = definition.steps.filter(step =>
        !completedSteps.has(step.id) &&
        !runningSteps.has(step.id) &&
        (step.dependencies || []).every(depId => completedSteps.has(depId))
      );

      for (const step of readySteps) {
        if (runningSteps.size >= maxParallel) break;

        const stepPromise = this.executeStep(step, definition, execution)
          .then(() => {
            completedSteps.add(step.id);
            runningSteps.delete(step.id);
          })
          .catch((error) => {
            console.error(`Step execution failed: ${step.id}`, error);
            runningSteps.delete(step.id);

            execution.errorDetails = execution.errorDetails || [];
            execution.errorDetails.push({
              stepId: step.id,
              agentId: step.agentId,
              errorType: error.constructor?.name || 'UnknownError',
              errorMessage: error.message || 'Unknown error',
              timestamp: new Date(),
              recoverable: this.isRecoverableError(error),
              retryCount: 0
            });

            if (!this.shouldContinueAfterError(step, error)) {
              execution.status = 'failed';
            }
          });

        runningSteps.set(step.id, stepPromise);
      }

      if (runningSteps.size > 0) {
        await Promise.race(Array.from(runningSteps.values()));
      }

      await new Promise(resolve => setTimeout(resolve, 50)); // small yield
    }

    if (runningSteps.size > 0) {
      await Promise.all(Array.from(runningSteps.values()));
    }
  }

  private async executeStep(
    step: WorkflowStep,
    definition: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    const startTime = new Date();
    console.log(`Executing step: ${step.id} with agent: ${step.agentId}`);

    const stepExecution: StepExecution = {
      stepId: step.id,
      agentId: step.agentId,
      status: 'running',
      inputs: {},
      outputs: {},
      startTime,
      attempts: 1,
      cost: 0
    };
    execution.steps.push(stepExecution);

    try {
      stepExecution.inputs = await this.prepareStepInputs(step, execution);

      // Per-step timeout (step.timeout in seconds or retryPolicy.timeoutMs)
      const stepTimeoutMs = (step.timeout * 1000) || Number(step.retryPolicy?.timeoutMs) || 0;

      const runOnce = async () => {
        const result = await this.agentManager.executeStep(
          step.agentId,
          step,
          stepExecution.inputs,
          execution.id
        );
        return result;
      };

      const result = stepTimeoutMs > 0
        ? await this.runWithTimeout(runOnce, stepTimeoutMs)
        : await runOnce();

      // Guard against undefined result
      if (!result) {
        throw new WorkflowError(`Step execution returned no result: ${step.id}`, 'EXECUTION_ERROR', 500);
      }

      stepExecution.outputs = result.outputs || {};
      stepExecution.cost = result.cost || 0;
      stepExecution.qualityScore = result.qualityScore || 0;

      execution.totalCost += result.cost;

      await this.processStepConditions(step, stepExecution, definition, execution);

      const agentExecution = execution.agents.find(a => a.agentId === step.agentId);
      if (agentExecution) {
        agentExecution.completedSteps.push(step.id);
        agentExecution.totalCost += result.cost;
        agentExecution.totalProcessingTime += stepExecution.duration || 0;
        // averageQualityScore simple update
        const scores = execution.steps
          .filter(s => s.agentId === step.agentId && s.qualityScore != null)
          .map(s => s.qualityScore as number);
        agentExecution.averageQualityScore = scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      }

      stepExecution.status = 'completed';
      stepExecution.endTime = new Date();
      stepExecution.duration = stepExecution.endTime.getTime() - stepExecution.startTime.getTime();

      // Determine next agent for handoff
      const nextAgentId = (definition.steps.find(s =>
        s.dependencies?.includes(step.id)
      ))?.agentId;

      // Log handoff for audit trail
      this.logStepHandoff(execution, step, stepExecution, nextAgentId);

      console.log(`Step completed: ${step.id} in ${stepExecution.duration}ms`);
    } catch (error: any) {
      console.error(`Step execution failed: ${step.id}`, error);

      stepExecution.status = error instanceof ExecutionTimeoutError ? 'timeout' : 'failed';
      stepExecution.endTime = new Date();
      stepExecution.duration = stepExecution.endTime.getTime() - stepExecution.startTime.getTime();
      stepExecution.outputs = stepExecution.outputs || {}; // Guard gegen undefined

      stepExecution.errorDetails = [{
        stepId: step.id,
        agentId: step.agentId,
        errorType: error?.constructor?.name || 'UnknownError',
        errorMessage: error?.message || String(error),
        timestamp: new Date(),
        recoverable: this.isRecoverableError(error),
        retryCount: stepExecution.attempts - 1
      }];

      // Log handoff for failed step (now safe because outputs is {})
      const nextAgentId = definition.steps.find(s => s.dependencies?.includes(step.id))?.agentId;
      this.logStepHandoff(execution, step, stepExecution, nextAgentId);

      if (this.shouldRetryStep(step, error, stepExecution.attempts)) {
        stepExecution.attempts++;
        await this.retryStep(step, stepExecution, definition, execution);
      } else {
        throw error;
      }
    }
  }

  private async prepareStepInputs(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<Record<string, any>> {
    const inputs: Record<string, any> = {};
    for (const input of step.inputs || []) {
      let value: any;
      try {
        switch (input.source.type) {
          case 'workflow_input':
            value = execution.inputs?.[input.source.reference];
            break;
          case 'step_output': {
            const src = execution.steps.find(s => s.stepId === input.source.reference);
            if (src?.outputs) {
              value = input.source.path
                ? this.getNestedValue(src.outputs, input.source.path)
                : src.outputs[input.name];
            }
            break;
          }
          case 'agent_memory':
            value = await this.agentManager.getMemoryValue(
              step.agentId,
              input.source.reference,
              input.source.path
            );
            break;
          case 'constant':
            value = input.source.reference;
            break;
          default:
            throw new WorkflowError(`Unsupported input source type: ${input.source.type}`, 'VALIDATION_ERROR', 400);
        }

        if (input.required && (value === undefined || value === null)) {
          throw new WorkflowError(`Required input missing: ${input.name}`, 'VALIDATION_ERROR', 400);
        }

        if (input.transformation && value !== undefined) {
          value = await this.applyTransformations(value, input.transformation);
        }

        inputs[input.name] = value;
      } catch (e) {
        console.error(`Failed to prepare input ${input.name}:`, e);
        throw e;
      }
    }
    return inputs;
  }

  private async processStepConditions(
    step: WorkflowStep,
    stepExecution: StepExecution,
    definition: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    for (const condition of step.conditions || []) {
      const shouldExecute = await this.evaluateCondition(condition, stepExecution, execution, definition);
      if (shouldExecute) {
        await this.executeConditionAction(condition, definition, execution);
      }
    }

    // Simple quality gate (optional)
    const minQuality = (step as any).minQualityScore;
    if (minQuality != null && stepExecution.qualityScore != null && stepExecution.qualityScore < minQuality) {
      execution.metadata.humanReviewRequired = true;
    }
  }

  private async evaluateCondition(
    condition: StepCondition,
    stepExecution: StepExecution,
    execution: WorkflowExecution,
    definition: WorkflowDefinition
  ): Promise<boolean> {
    switch (condition.type) {
      case 'success':
        return stepExecution.status === 'completed';
      case 'failure':
        return stepExecution.status === 'failed';
      case 'timeout':
        return stepExecution.status === 'timeout';
      case 'custom': {
        // Hardened: allow only if explicitly enabled at workflow level
        const allow = !!definition.metadata?.allowCustomExpressions;
        if (!allow) return false;
        return this.evaluateExpression(condition.expression, { stepExecution, execution });
      }
      default:
        return false;
    }
  }

  private async executeConditionAction(
    condition: StepCondition,
    definition: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    switch (condition.action.type) {
      case 'continue':
        break;
      case 'skip': {
        if (condition.action.target) {
          const targetStep = execution.steps.find(s => s.stepId === condition.action.target);
          if (targetStep && targetStep.status === 'running') {
            // do nothing; already running
          } else if (targetStep) {
            targetStep.status = 'completed';
          }
        }
        break;
      }
      case 'fail':
        execution.status = 'failed';
        break;
      case 'branch':
        if (condition.action.target) {
          await this.executeBranch(condition.action.target, definition, execution);
        }
        break;
      case 'notify':
        await this.sendNotification(condition.action.parameters, execution);
        break;
    }
  }

  private async executeBranch(
    target: string,
    definition: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    const decisionTree = (definition.decisionTrees || []).find(dt => dt.id === target);
    if (decisionTree) {
      const decision = await this.decisionEngine.executeDecisionTree(decisionTree, execution);
      for (const action of decision.actions) {
        await this.executeDecisionAction(action, execution);
      }
    }
  }

  private async executeDecisionAction(action: any, execution: WorkflowExecution): Promise<void> {
    switch (action.type) {
      case 'assign_agent':
        // TODO: dynamic re-assignment
        break;
      case 'modify_workflow':
        // TODO: dynamic step injection/removal
        break;
      case 'escalate':
        execution.metadata.humanReviewRequired = true;
        break;
      case 'terminate':
        execution.status = 'cancelled';
        break;
    }
  }

  private buildDependencyGraph(steps: WorkflowStep[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const step of steps) graph.set(step.id, step.dependencies || []);
    return graph;
  }

  private calculateOverallQualityScore(execution: WorkflowExecution): number {
    const stepScores = execution.steps
      .filter(s => s.qualityScore !== undefined)
      .map(s => s.qualityScore!) as number[];
    if (stepScores.length === 0) return 0;
    return stepScores.reduce((sum, score) => sum + score, 0) / stepScores.length;
  }

  private isRecoverableError(error: any): boolean {
    const recoverableErrors = ['TimeoutError', 'NetworkError', 'RateLimitError', 'TemporaryServiceError', 'ExecutionTimeoutError'];
    return recoverableErrors.includes(error?.constructor?.name);
  }

  private shouldContinueAfterError(step: WorkflowStep, error: any): boolean {
    return (step.conditions || []).some(c => c.type === 'failure' && c.action.type === 'continue');
  }

  private shouldRetryStep(step: WorkflowStep, error: any, attempts: number): boolean {
    const max = Number(step.retryPolicy?.maxAttempts) || 1;
    const retryable = Array.isArray(step.retryPolicy?.retryableErrors)
      ? step.retryPolicy.retryableErrors
      : [];
    return attempts < max && this.isRecoverableError(error) && retryable.includes(error?.constructor?.name);
  }

  private async retryStep(
    step: WorkflowStep,
    stepExecution: StepExecution,
    definition: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    const delay = this.calculateRetryDelay(step.retryPolicy, stepExecution.attempts);
    await new Promise(resolve => setTimeout(resolve, delay));
    stepExecution.status = 'running';
    stepExecution.startTime = new Date();
    await this.executeStep(step, definition, execution); // FIX: pass original definition
  }

  private calculateRetryDelay(retryPolicy: any, attempts: number): number {
    const base = Number(retryPolicy?.baseDelay) || 500;
    const max = Number(retryPolicy?.maxDelay) || 10_000;
    switch (retryPolicy?.backoffStrategy) {
      case 'fixed':
        return base;
      case 'linear':
        return base * attempts;
      case 'exponential':
        return Math.min(base * Math.pow(2, attempts - 1), max);
      default:
        return base;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async applyTransformations(value: any, transformations: any[]): Promise<any> {
    let result = value;
    for (const t of transformations) {
      switch (t.type) {
        case 'map':
          if (Array.isArray(result) && typeof t.parameters?.mapper === 'function') {
            result = result.map((item: any) => t.parameters.mapper(item));
          }
          break;
        case 'filter':
          if (Array.isArray(result) && typeof t.parameters?.predicate === 'function') {
            result = result.filter((item: any) => t.parameters.predicate(item));
          }
          break;
        case 'format':
          result = this.formatValue(result, t.parameters?.format);
          break;
      }
    }
    return result;
  }

  private formatValue(value: any, format?: string): any {
    switch (format) {
      case 'uppercase': return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase': return typeof value === 'string' ? value.toLowerCase() : value;
      case 'json': return JSON.stringify(value);
      default: return value;
    }
  }

  private evaluateExpression(expression: string, context: any): boolean {
    try {
      // NOTE: guarded by metadata.allowCustomExpressions in evaluateCondition
      const func = new Function('context', `with(context) { return ${expression}; }`);
      return func(context);
    } catch (error) {
      console.error('Expression evaluation failed:', error);
      return false;
    }
  }

  private async sendNotification(parameters: any, execution: WorkflowExecution): Promise<void> {
    await this.communicationManager.sendMessage({
      id: uuidv4(),
      fromAgent: 'orchestrator',
      toAgent: 'notification_service',
      messageType: 'notification',
      content: { executionId: execution.id, ...parameters },
      timestamp: new Date(),
      acknowledged: false
    });
  }

  /**
   * Log step handoff for audit trail
   */
  private logStepHandoff(
    execution: WorkflowExecution,
    step: WorkflowStep,
    stepExecution: StepExecution,
    nextAgentId?: string
  ) {
    try {
      const ticket = createHandoff({
        fromAgent: step.agentId,
        toAgent: nextAgentId || 'orchestrator',
        reason: stepExecution.status, // 'completed' | 'failed' | 'timeout'
        payload: { 
          stepId: step.id, 
          outputs: stepExecution.outputs, 
          error: stepExecution.errorDetails 
        },
        expectedOutcome: stepExecution.status === 'completed' ? 'consume_previous_step_outputs' : 'handle_step_failure',
        slaMs: 30_000,
        confidence: stepExecution.qualityScore ?? 0.5,
        annotations: { 
          executionId: execution.id, 
          workflowId: execution.workflowId,
          stepDuration: stepExecution.duration,
          stepCost: stepExecution.cost
        }
      });
      if (process.env.NODE_ENV !== 'test') {
        console.log('[handoff]', handoffToJSON(ticket));
      }
    } catch (e) {
      console.error('handoff logging failed', e);
    }
  }

  private cleanupExecution(executionId: string): void {
    const exec = this.activeExecutions.get(executionId);
    if (exec) {
      const rel: any = (this.agentManager as any).releaseAgentExecution;
      if (typeof rel === 'function') {
        for (const a of exec.agents) {
          rel.call(this.agentManager, a.agentId, executionId)
            .catch((err: any) => console.error('releaseAgentExecution failed', err));
        }
      }
    }

    const timeout = this.executionTimeouts.get(executionId);
    if (timeout) {
      clearTimeout(timeout);
      this.executionTimeouts.delete(executionId);
    }
    this.activeExecutions.delete(executionId);
    console.log(`Cleaned up execution: ${executionId}`);
  }

  private async runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        fn(),
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new ExecutionTimeoutError(`Step exceeded timeout of ${timeoutMs}ms`)), timeoutMs);
        })
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}