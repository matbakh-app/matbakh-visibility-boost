/**
 * Tests for WorkflowOrchestrator
 */

import { WorkflowOrchestrator } from '../workflow-orchestrator';
import { AgentManager } from '../agent-manager';
import { DecisionEngine } from '../decision-engine';
import { CommunicationManager } from '../communication-manager';
import {
  WorkflowDefinition,
  WorkflowExecution,
  ExecutionStatus,
  WorkflowStep,
  AgentDefinition
} from '../types';
import { createMockAgentDefinition, createMockWorkflowExecution } from './setup';

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator;
  let mockAgentManager: jest.Mocked<AgentManager>;
  let mockDecisionEngine: jest.Mocked<DecisionEngine>;
  let mockCommunicationManager: jest.Mocked<CommunicationManager>;

  beforeEach(() => {
    // Create mocked dependencies
    mockAgentManager = {
      registerAgent: jest.fn(),
      initializeAgent: jest.fn(),
      executeStep: jest.fn(),
      isAgentAvailable: jest.fn(),
      getAgentSpecialization: jest.fn(),
      getAgentCapabilities: jest.fn(),
      getMemoryValue: jest.fn(),
      updateAgentMemory: jest.fn(),
      getAgentPerformance: jest.fn(),
      listAgents: jest.fn(),
      getOptimalAgent: jest.fn()
    } as any;

    mockDecisionEngine = {
      executeDecisionTree: jest.fn(),
      createDynamicDecisionTree: jest.fn(),
      evaluateCondition: jest.fn(),
      getDecisionHistory: jest.fn(),
      analyzeDecisionPatterns: jest.fn()
    } as any;

    mockCommunicationManager = {
      sendMessage: jest.fn(),
      broadcastMessage: jest.fn(),
      registerRoute: jest.fn(),
      createMessageQueue: jest.fn(),
      getMessages: jest.fn(),
      acknowledgeMessage: jest.fn(),
      getCommunicationStats: jest.fn(),
      getMessageHistory: jest.fn(),
      setupAgentCollaboration: jest.fn()
    } as any;

    orchestrator = new WorkflowOrchestrator(
      mockAgentManager,
      mockDecisionEngine,
      mockCommunicationManager
    );
  });

  describe('executeWorkflow', () => {
    it('should execute a simple workflow successfully', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      const mockStep: WorkflowStep = {
        id: 'test-step',
        name: 'Test Step',
        type: 'analysis',
        agentId: 'test-agent',
        inputs: [],
        outputs: [],
        conditions: [],
        timeout: 30,
        retryPolicy: {
          maxAttempts: 1,
          backoffStrategy: 'fixed',
          baseDelay: 1000,
          maxDelay: 5000,
          retryableErrors: []
        },
        dependencies: [],
        parallelExecution: false,
        metadata: {}
      };

      const mockWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'Test workflow',
        version: '1.0.0',
        category: 'business_analysis',
        steps: [mockStep],
        agents: [mockAgent],
        decisionTrees: [],
        metadata: {
          author: 'test',
          tags: ['test'],
          businessDomain: 'test',
          complexity: 'simple',
          estimatedDuration: 10,
          costEstimate: 0.1,
          successRate: 0.9,
          usageCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock agent availability and execution
      mockAgentManager.isAgentAvailable.mockResolvedValue(true);
      mockAgentManager.initializeAgent.mockResolvedValue(undefined);
      mockAgentManager.executeStep.mockResolvedValue({
        outputs: { result: 'success' },
        cost: 0.05,
        qualityScore: 0.9,
        processingTime: 1000,
        memoryUpdates: [],
        communicationLog: []
      });

      // Act
      const result = await orchestrator.executeWorkflow(
        mockWorkflow,
        { input: 'test' },
        'test-tenant',
        'test-user'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.workflowId).toBe('test-workflow');
      expect(result.inputs).toEqual({ input: 'test' });
      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.steps).toHaveLength(1);
      expect(result.agents).toHaveLength(1);

      // Verify agent interactions
      expect(mockAgentManager.isAgentAvailable).toHaveBeenCalledWith('test-agent');
      expect(mockAgentManager.initializeAgent).toHaveBeenCalledWith(mockAgent, result.id);
      expect(mockAgentManager.executeStep).toHaveBeenCalled();
    });

    it('should handle workflow validation errors', async () => {
      // Arrange
      const invalidWorkflow: WorkflowDefinition = {
        id: 'invalid-workflow',
        name: 'Invalid Workflow',
        description: 'Invalid workflow',
        version: '1.0.0',
        category: 'business_analysis',
        steps: [], // No steps - should cause validation error
        agents: [],
        decisionTrees: [],
        metadata: {
          author: 'test',
          tags: ['test'],
          businessDomain: 'test',
          complexity: 'simple',
          estimatedDuration: 10,
          costEstimate: 0.1,
          successRate: 0.9,
          usageCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const exec = await orchestrator.executeWorkflow(
        invalidWorkflow,
        { input: 'test' },
        'test-tenant',
        'test-user'
      );

      // Assert
      expect(exec.status).toBe('failed');
      expect(exec.errorDetails?.[0]?.errorType).toBe('WorkflowError');
    });

    it('should handle agent unavailability', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      const mockStep: WorkflowStep = {
        id: 'test-step',
        name: 'Test Step',
        type: 'analysis',
        agentId: 'unavailable-agent',
        inputs: [],
        outputs: [],
        conditions: [],
        timeout: 30,
        retryPolicy: {
          maxAttempts: 1,
          backoffStrategy: 'fixed',
          baseDelay: 1000,
          maxDelay: 5000,
          retryableErrors: []
        },
        dependencies: [],
        parallelExecution: false,
        metadata: {}
      };

      const mockWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'Test workflow',
        version: '1.0.0',
        category: 'business_analysis',
        steps: [mockStep],
        agents: [{ ...mockAgent, id: 'unavailable-agent' }],
        decisionTrees: [],
        metadata: {
          author: 'test',
          tags: ['test'],
          businessDomain: 'test',
          complexity: 'simple',
          estimatedDuration: 10,
          costEstimate: 0.1,
          successRate: 0.9,
          usageCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock agent unavailability
      mockAgentManager.isAgentAvailable.mockResolvedValue(false);

      // Act
      const result = await orchestrator.executeWorkflow(
        mockWorkflow,
        { input: 'test' },
        'test-tenant',
        'test-user'
      );

      // Assert
      expect(result.status).toBe('failed');
      expect(result.errorDetails).toHaveLength(1);
      expect(result.errorDetails?.[0]?.errorMessage).toContain('Agent not available');
    });

    it('should handle step execution timeout', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      const mockStep: WorkflowStep = {
        id: 'timeout-step',
        name: 'Timeout Step',
        type: 'analysis',
        agentId: 'test-agent',
        inputs: [],
        outputs: [],
        conditions: [],
        timeout: 1, // Very short timeout
        retryPolicy: {
          maxAttempts: 1,
          backoffStrategy: 'fixed',
          baseDelay: 1000,
          maxDelay: 5000,
          retryableErrors: []
        },
        dependencies: [],
        parallelExecution: false,
        metadata: {}
      };

      const mockWorkflow: WorkflowDefinition = {
        id: 'timeout-workflow',
        name: 'Timeout Workflow',
        description: 'Workflow with timeout',
        version: '1.0.0',
        category: 'business_analysis',
        steps: [mockStep],
        agents: [mockAgent],
        decisionTrees: [],
        metadata: {
          author: 'test',
          tags: ['test'],
          businessDomain: 'test',
          complexity: 'simple',
          estimatedDuration: 1,
          costEstimate: 0.1,
          successRate: 0.9,
          usageCount: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock slow agent execution
      mockAgentManager.isAgentAvailable.mockResolvedValue(true);
      mockAgentManager.initializeAgent.mockResolvedValue(undefined);
      mockAgentManager.executeStep.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000)) // Longer than timeout
      );

      // Act
      const result = await orchestrator.executeWorkflow(
        mockWorkflow,
        { input: 'test' },
        'test-tenant',
        'test-user'
      );

      // Assert
      expect(result.status).toBe('timeout');
      expect(result.errorDetails).toHaveLength(1);
      expect(result.errorDetails?.[0]?.errorType).toBe('ExecutionTimeoutError');
    });
  });

  describe('pauseExecution', () => {
    it('should pause a running execution', async () => {
      // Arrange
      const exec = createMockWorkflowExecution({ id: 'exec-1', status: 'running' });
      (orchestrator as any).activeExecutions.set(exec.id, exec);

      // Act
      await orchestrator.pauseExecution(exec.id);

      // Assert
      expect((orchestrator as any).activeExecutions.get(exec.id).status).toBe('paused');
    });

    it('should throw error for non-existent execution', async () => {
      // Act & Assert
      await expect(
        orchestrator.pauseExecution('non-existent-id')
      ).rejects.toThrow('Execution not found');
    });
  });

  describe('getExecutionStatus', () => {
    it('should return execution status for valid ID', () => {
      // Arrange
      const mockExecution = createMockWorkflowExecution();
      
      // Mock internal state (this would normally be set during execution)
      jest.spyOn(orchestrator, 'getExecutionStatus').mockReturnValue(mockExecution);

      // Act
      const result = orchestrator.getExecutionStatus(mockExecution.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockExecution.id);
      expect(result?.status).toBe('running');
    });

    it('should return undefined for invalid ID', () => {
      // Act
      const result = orchestrator.getExecutionStatus('invalid-id');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('listActiveExecutions', () => {
    it('should return list of active executions', () => {
      // Arrange
      const mockExecutions = [
        createMockWorkflowExecution(),
        { ...createMockWorkflowExecution(), id: 'execution-2' }
      ];

      jest.spyOn(orchestrator, 'listActiveExecutions').mockReturnValue(mockExecutions);

      // Act
      const result = orchestrator.listActiveExecutions();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('exec-1');
      expect(result[1].id).toBe('execution-2');
    });

    it('should return empty array when no active executions', () => {
      // Arrange
      jest.spyOn(orchestrator, 'listActiveExecutions').mockReturnValue([]);

      // Act
      const result = orchestrator.listActiveExecutions();

      // Assert
      expect(result).toHaveLength(0);
    });
  });
});