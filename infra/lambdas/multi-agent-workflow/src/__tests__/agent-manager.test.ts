/**
 * Tests for AgentManager
 */

import { AgentManager } from '../agent-manager';
import {
  AgentDefinition,
  WorkflowStep,
  StepType,
  AgentType
} from '../types';
import { createMockAgentDefinition } from './setup';

describe('AgentManager', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  describe('registerAgent', () => {
    it('should register an agent successfully', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();

      // Act
      await agentManager.registerAgent(mockAgent);

      // Assert
      const agents = agentManager.listAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe(mockAgent.id);
      expect(agents[0].status).toBe('idle');
    });

    it('should register multiple agents', async () => {
      // Arrange
      const agent1 = createMockAgentDefinition();
      const agent2 = { ...createMockAgentDefinition(), id: 'agent-2', name: 'Agent 2' };

      // Act
      await agentManager.registerAgent(agent1);
      await agentManager.registerAgent(agent2);

      // Assert
      const agents = agentManager.listAgents();
      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.id)).toContain('test-agent');
      expect(agents.map(a => a.id)).toContain('agent-2');
    });
  });

  describe('initializeAgent', () => {
    it('should initialize agent for execution', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);

      // Act
      await agentManager.initializeAgent(mockAgent, 'test-execution-1');

      // Assert
      const agents = agentManager.listAgents();
      const agent = agents.find(a => a.id === mockAgent.id);
      expect(agent?.status).toBe('busy');
      expect(agent?.currentExecutions).toContain('test-execution-1');
    });

    it('should throw error for unregistered agent', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();

      // Act & Assert
      await expect(
        agentManager.initializeAgent(mockAgent, 'test-execution-1')
      ).rejects.toThrow('Agent not available');
    });

    it('should throw error for agent in maintenance', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);
      
      // Set agent to maintenance status
      const agents = agentManager.listAgents();
      agents[0].status = 'maintenance';

      // Act & Assert
      await expect(
        agentManager.initializeAgent(mockAgent, 'test-execution-1')
      ).rejects.toThrow('Agent not available');
    });
  });

  describe('executeStep', () => {
    it('should execute analysis step successfully', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      mockAgent.type = 'analysis_agent';
      await agentManager.registerAgent(mockAgent);
      await agentManager.initializeAgent(mockAgent, 'test-execution-1');

      const mockStep: WorkflowStep = {
        id: 'analysis-step',
        name: 'Analysis Step',
        type: 'analysis',
        agentId: mockAgent.id,
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

      const inputs = { data: 'test data' };

      // Act
      const result = await agentManager.executeStep(
        mockAgent.id,
        mockStep,
        inputs,
        'test-execution-1'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.outputs).toBeDefined();
      expect(result.cost).toBeGreaterThan(0);
      expect(result.qualityScore).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should execute content step successfully', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition({
        type: 'content_agent',
        capabilities: [{ 
          name: 'content_generation',
          type: 'content_generation', 
          inputTypes: ['text'],
          outputTypes: ['text'],
          processingTime: 1000,
          accuracy: 0.9,
          costPerOperation: 0.00005
        } as any],
      });
      await agentManager.registerAgent(mockAgent);
      await agentManager.initializeAgent(mockAgent, 'test-execution-1');

      const mockStep: WorkflowStep = {
        id: 'content-step',
        name: 'Content Step',
        type: 'generation',
        agentId: mockAgent.id,
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

      const inputs = { topic: 'restaurant marketing' };

      // Act
      const result = await agentManager.executeStep(
        mockAgent.id,
        mockStep,
        inputs,
        'test-execution-1'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.outputs).toBeDefined();
      expect(result.outputs.content).toBeDefined();
      expect(result.outputs.metadata).toBeDefined();
    });

    it('should throw error for unavailable agent', async () => {
      // Arrange
      const mockStep: WorkflowStep = {
        id: 'test-step',
        name: 'Test Step',
        type: 'analysis',
        agentId: 'non-existent-agent',
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

      // Act & Assert
      await expect(
        agentManager.executeStep(
          'non-existent-agent',
          mockStep,
          {},
          'test-execution-1'
        )
      ).rejects.toThrow('Agent not available');
    });

    it('should validate agent capability for step type', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      mockAgent.type = 'analysis_agent';
      mockAgent.capabilities = [{
        name: 'text_analysis',
        type: 'text_analysis',
        inputTypes: ['text'],
        outputTypes: ['json'],
        processingTime: 1000,
        accuracy: 0.9,
        costPerOperation: 0.01
      }];
      
      await agentManager.registerAgent(mockAgent);
      await agentManager.initializeAgent(mockAgent, 'test-execution-1');

      const incompatibleStep: WorkflowStep = {
        id: 'incompatible-step',
        name: 'Incompatible Step',
        type: 'human_review', // Not supported by analysis agent
        agentId: mockAgent.id,
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

      // Act & Assert
      await expect(
        agentManager.executeStep(
          mockAgent.id,
          incompatibleStep,
          {},
          'test-execution-1'
        )
      ).rejects.toThrow('cannot handle step type');
    });
  });

  describe('isAgentAvailable', () => {
    it('should return true for available agent', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);

      // Act
      const isAvailable = await agentManager.isAgentAvailable(mockAgent.id);

      // Assert
      expect(isAvailable).toBe(true);
    });

    it('should return false for non-existent agent', async () => {
      // Act
      const isAvailable = await agentManager.isAgentAvailable('non-existent');

      // Assert
      expect(isAvailable).toBe(false);
    });

    it('should return false for agent in maintenance', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);
      
      const agents = agentManager.listAgents();
      agents[0].status = 'maintenance';

      // Act
      const isAvailable = await agentManager.isAgentAvailable(mockAgent.id);

      // Assert
      expect(isAvailable).toBe(false);
    });

    it('should return false for agent at capacity', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);
      
      // Fill agent to capacity
      const agents = agentManager.listAgents();
      const agent = agents[0];
      
      // Add multiple executions to reach capacity
      for (let i = 0; i < 10; i++) {
        agent.currentExecutions.push(`execution-${i}`);
      }

      // Act
      const isAvailable = await agentManager.isAgentAvailable(mockAgent.id);

      // Assert
      expect(isAvailable).toBe(false);
    });
  });

  describe('getOptimalAgent', () => {
    it('should return optimal agent for step type', async () => {
      // Arrange
      const analysisAgent = createMockAgentDefinition();
      analysisAgent.id = 'analysis-agent';
      analysisAgent.type = 'analysis_agent';
      
      const contentAgent = createMockAgentDefinition();
      contentAgent.id = 'content-agent';
      contentAgent.type = 'content_agent';

      await agentManager.registerAgent(analysisAgent);
      await agentManager.registerAgent(contentAgent);

      // Act
      const optimalAgent = await agentManager.getOptimalAgent('analysis');

      // Assert
      expect(optimalAgent).toBe('analysis-agent');
    });

    it('should return null when no suitable agent available', async () => {
      // Arrange
      const analysisOnly = createMockAgentDefinition({
        capabilities: [{ 
          name: 'text_analysis',
          type: 'text_analysis', 
          inputTypes: ['text'],
          outputTypes: ['json'],
          processingTime: 1000,
          accuracy: 0.9,
          costPerOperation: 0.00005
        } as any],
      });
      await agentManager.registerAgent(analysisOnly);

      // Act - request generation capability which the agent doesn't have
      const optimalAgent = await agentManager.getOptimalAgent('generation');

      // Assert
      expect(optimalAgent).toBeNull();
    });
  });

  describe('getAgentPerformance', () => {
    it('should return performance metrics for registered agent', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);

      // Act
      const performance = agentManager.getAgentPerformance(mockAgent.id);

      // Assert
      expect(performance).toBeDefined();
      expect(performance?.averageResponseTime).toBeDefined();
      expect(performance?.successRate).toBeDefined();
      expect(performance?.qualityScore).toBeDefined();
      expect(performance?.costEfficiency).toBeDefined();
    });

    it('should return undefined for non-existent agent', () => {
      // Act
      const performance = agentManager.getAgentPerformance('non-existent');

      // Assert
      expect(performance).toBeUndefined();
    });
  });

  describe('memory management', () => {
    it('should get memory value for agent', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);
      await agentManager.initializeAgent(mockAgent, 'test-execution-1');

      // Set some memory data
      await agentManager.updateAgentMemory(
        mockAgent.id,
        'test-context',
        { key: 'value' },
        'test-execution-1'
      );

      // Act
      const memoryValue = await agentManager.getMemoryValue(mockAgent.id, 'test-context');

      // Assert
      expect(memoryValue).toEqual({ key: 'value' });
    });

    it('should return undefined for non-existent memory context', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);

      // Act
      const memoryValue = await agentManager.getMemoryValue(mockAgent.id, 'non-existent');

      // Assert
      expect(memoryValue).toBeUndefined();
    });

    it('should update agent memory successfully', async () => {
      // Arrange
      const mockAgent = createMockAgentDefinition();
      await agentManager.registerAgent(mockAgent);
      await agentManager.initializeAgent(mockAgent, 'test-execution-1');

      // Act
      await agentManager.updateAgentMemory(
        mockAgent.id,
        'test-context',
        { updated: 'data' },
        'test-execution-1'
      );

      // Assert
      const memoryValue = await agentManager.getMemoryValue(mockAgent.id, 'test-context');
      expect(memoryValue).toEqual({ updated: 'data' });
    });
  });
});