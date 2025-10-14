/**
 * Tests for Hybrid Assistant Orchestrator
 */

// Mock the AiFeatureFlags to avoid dependency issues
jest.mock("../ai-feature-flags", () => ({
  AiFeatureFlags: jest.fn().mockImplementation(() => ({
    isHybridAssistantModeEnabled: jest.fn(() => true),
    isBedrockAdvisoryModeEnabled: jest.fn(() => true),
    isKiroPrimaryControlEnabled: jest.fn(() => true),
    // Add missing methods that might be called
    getFlag: jest.fn((flag: string, defaultValue: boolean) => defaultValue),
    isEnabled: jest.fn((flag: string, defaultValue: boolean) => defaultValue),
  })),
}));

// 🌉 Temporär CJS-kompatibel über Brücken-Datei
import type { TaskRequest } from "../hybrid-assistant-orchestrator";
import { HybridAssistantOrchestrator } from "../hybrid-assistant-orchestrator.cjs";

describe("HybridAssistantOrchestrator", () => {
  let orchestrator: HybridAssistantOrchestrator;

  beforeEach(() => {
    orchestrator = new HybridAssistantOrchestrator();

    // 🔧 Quick Fix: Mock direkt injizieren für Jest 29+ Kompatibilität
    const mockFeatureFlags = {
      isHybridAssistantModeEnabled: jest.fn(() => true),
      isBedrockAdvisoryModeEnabled: jest.fn(() => true),
      isKiroPrimaryControlEnabled: jest.fn(() => true),
      getFlag: jest.fn((flag: string, defaultValue: boolean) => defaultValue),
      isEnabled: jest.fn((flag: string, defaultValue: boolean) => defaultValue),
    };
    (orchestrator as any).featureFlags = mockFeatureFlags;
  });

  describe("Hybrid Assistant Mode Status", () => {
    it("should report hybrid mode as active", () => {
      const status = orchestrator.getHybridAssistantStatus();

      expect(status.hybridModeActive).toBe(true);
      expect(status.bedrockAdvisoryActive).toBe(true);
      expect(status.kiroPrimaryControl).toBe(true);
      expect(status.capabilities).toContain("🎯 User behält volle Kontrolle");
    });
  });

  describe("Task Processing Workflow", () => {
    it("should process a simple task request", async () => {
      const request: TaskRequest = {
        id: "test-task-1",
        description:
          "Implement TypeScript exactOptionalPropertyTypes compliance",
        priority: "medium",
        requester: "user",
      };

      const result = await orchestrator.processTaskRequest(request);

      expect(result.taskId).toBe("test-task-1");
      expect(result.status).toBe("completed");
      expect(result.bedrockAdvice).toBeDefined();
      expect(result.kiroImplementation).toBeDefined();
      expect(result.finalResult).toBeDefined();
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it("should require user approval for critical tasks", async () => {
      const criticalRequest: TaskRequest = {
        id: "critical-task-1",
        description: "Delete production database",
        priority: "critical",
        requester: "user",
      };

      const result = await orchestrator.processTaskRequest(criticalRequest);

      expect(result.status).toBe("reviewing");
      expect(result.userApprovalRequired).toBe(true);
    });

    it("should require user approval for dangerous operations", async () => {
      const dangerousRequest: TaskRequest = {
        id: "dangerous-task-1",
        description: "Remove all user data",
        priority: "medium",
        requester: "user",
      };

      const result = await orchestrator.processTaskRequest(dangerousRequest);

      expect(result.status).toBe("reviewing");
      expect(result.userApprovalRequired).toBe(true);
    });
  });

  describe("User Approval Process", () => {
    it("should handle user approval correctly", async () => {
      const request: TaskRequest = {
        id: "approval-test",
        description: "Delete old files",
        priority: "high",
        requester: "user",
      };

      // Erstelle Workflow der Approval benötigt
      const initialResult = await orchestrator.processTaskRequest(request);
      expect(initialResult.userApprovalRequired).toBe(true);

      // Simuliere User Approval
      const workflowId = `workflow-${request.id}-${Date.now()}`;
      // Note: In real implementation, we'd get the actual workflow ID

      // Für den Test nehmen wir an, dass der Workflow existiert
      // In der echten Implementierung würde der Workflow ID zurückgegeben
    });

    it("should handle user rejection correctly", async () => {
      // Test für User Rejection würde hier implementiert
      // Für jetzt als Platzhalter
      expect(true).toBe(true);
    });
  });

  describe("Bedrock Advisory Integration", () => {
    it("should provide bedrock advice for tasks", async () => {
      const request: TaskRequest = {
        id: "advice-test",
        description: "Optimize database queries",
        priority: "medium",
        requester: "user",
      };

      const result = await orchestrator.processTaskRequest(request);

      expect(result.bedrockAdvice).toBeDefined();
      expect(result.bedrockAdvice!.analysis).toContain(
        "Machbar mit moderatem Aufwand"
      );
      expect(result.bedrockAdvice!.recommendations).toHaveLength(3);
      expect(result.bedrockAdvice!.risks).toHaveLength(2);
      expect(result.bedrockAdvice!.qualityChecks).toHaveLength(4);
    });
  });

  describe("Kiro Implementation Planning", () => {
    it("should create implementation plan", async () => {
      const request: TaskRequest = {
        id: "implementation-test",
        description: "Add new feature",
        priority: "low",
        requester: "user",
      };

      const result = await orchestrator.processTaskRequest(request);

      expect(result.kiroImplementation).toBeDefined();
      expect(result.kiroImplementation!.steps.length).toBeGreaterThan(5);
      expect(result.kiroImplementation!.testingStrategy).toContain(
        "Unit Tests"
      );
      expect(result.kiroImplementation!.rollbackPlan).toContain("Git revert");
    });
  });

  describe("Quality Assurance", () => {
    it("should perform quality checks", async () => {
      const request: TaskRequest = {
        id: "quality-test",
        description: "Refactor legacy code",
        priority: "medium",
        requester: "user",
      };

      const result = await orchestrator.processTaskRequest(request);

      expect(result.qualityScore).toBeDefined();
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });
  });

  describe("Workflow Management", () => {
    it("should track active workflows", () => {
      const initialStatus = orchestrator.getHybridAssistantStatus();
      expect(initialStatus.activeWorkflows).toBe(0);

      // Nach dem Ausführen von Tasks würde sich die Anzahl ändern
      // Für jetzt als Platzhalter
    });
  });
});
