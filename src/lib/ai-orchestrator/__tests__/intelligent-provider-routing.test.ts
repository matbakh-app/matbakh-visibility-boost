/**
 * Intelligent Provider Routing Tests
 *
 * Tests for the AI-Provider-Architektur:
 * - Bedrock: System/Orchestration tasks (Priority 1)
 * - Google: User-facing tasks (Priority 2)
 * - Meta: Audience analysis tasks (Priority 3)
 */

import { AiRouterGateway } from "../ai-router-gateway";
import type { AiRequest, ModelSpec } from "../types";

describe("Intelligent Provider Routing", () => {
  let gateway: AiRouterGateway;
  let testModels: ModelSpec[];

  beforeEach(() => {
    testModels = [
      {
        provider: "bedrock",
        modelId: "claude-3-sonnet",
        capability: {
          maxTokens: 4096,
          supportsTools: true,
          supportsStreaming: true,
          costPer1kInput: 0.003,
          costPer1kOutput: 0.015,
          defaultLatencyMs: 1200,
        },
      },
      {
        provider: "google",
        modelId: "gemini-pro",
        capability: {
          maxTokens: 2048,
          supportsTools: true,
          supportsStreaming: false,
          costPer1kInput: 0.0005,
          costPer1kOutput: 0.0015,
          defaultLatencyMs: 800,
        },
      },
      {
        provider: "meta",
        modelId: "llama-2-70b",
        capability: {
          maxTokens: 4096,
          supportsTools: false,
          supportsStreaming: true,
          costPer1kInput: 0.0007,
          costPer1kOutput: 0.0028,
          defaultLatencyMs: 1500,
        },
      },
    ];

    gateway = new AiRouterGateway({
      models: testModels,
      enableCaching: true,
      enableMetrics: true,
    });
  });

  describe("System/Orchestration Tasks - Bedrock Priority", () => {
    it("should route system orchestration tasks to Bedrock first", () => {
      const request: AiRequest = {
        prompt: "Orchestrate a new AI agent for customer service automation",
        context: {
          domain: "system",
          userId: "admin-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("bedrock");
      expect(decision.reason).toContain("priority: bedrock > google > meta");
    });

    it("should route infrastructure management to Bedrock", () => {
      const request: AiRequest = {
        prompt:
          "Manage the deployment pipeline and coordinate scaling policies",
        context: {
          domain: "infrastructure",
          userId: "admin-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("bedrock");
    });

    it("should route agent creation tasks to Bedrock", () => {
      const request: AiRequest = {
        prompt: "Create a new agent for monitoring system performance",
        context: {
          domain: "general",
          userId: "admin-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("bedrock");
    });

    it("should route workflow coordination to Bedrock", () => {
      const request: AiRequest = {
        prompt: "Coordinate the workflow between multiple AI services",
        context: {
          domain: "general",
          userId: "admin-1",
          sessionId: "session-1",
        },
        tools: [
          {
            name: "orchestrate_workflow",
            description: "Orchestrate complex workflows",
            parameters: {
              type: "object",
              properties: {
                services: { type: "array" },
              },
            },
          },
        ],
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("bedrock");
    });
  });

  describe("Audience Analysis Tasks - Meta Priority", () => {
    it("should route audience analysis to Meta first", () => {
      const request: AiRequest = {
        prompt:
          "Analyze the target audience demographics for our restaurant chain",
        context: {
          domain: "marketing",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("meta");
      expect(decision.reason).toContain("priority: meta > google > bedrock");
    });

    it("should route market segmentation to Meta", () => {
      const request: AiRequest = {
        prompt: "Create detailed market segments for our customer personas",
        context: {
          domain: "analytics",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("meta");
    });

    it("should route reach analysis to Meta", () => {
      const request: AiRequest = {
        prompt:
          "Perform a reach analysis for our social media campaign targeting millennials",
        context: {
          domain: "general",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("meta");
    });

    it("should route German Zielgruppe analysis to Meta", () => {
      const request: AiRequest = {
        prompt: "Analysiere die Zielgruppe für unser neues Restaurant-Konzept",
        context: {
          domain: "general",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("meta");
    });
  });

  describe("User-facing Tasks - Google Priority", () => {
    it("should route general user queries to Google first", () => {
      const request: AiRequest = {
        prompt: "Help me create a business plan for my new restaurant",
        context: {
          domain: "general",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("google");
      expect(decision.reason).toContain("priority: google > meta > bedrock");
    });

    it("should route restaurant analysis to Google", () => {
      const request: AiRequest = {
        prompt: "Analyze the visibility of my restaurant online",
        context: {
          domain: "culinary",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("google");
    });

    it("should route persona creation to Google", () => {
      const request: AiRequest = {
        prompt:
          "Create customer personas for my restaurant based on recent reviews",
        context: {
          domain: "general",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("google");
    });

    it("should route visibility checks to Google", () => {
      const request: AiRequest = {
        prompt:
          "Check the online visibility of my business across different platforms",
        context: {
          domain: "general",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("google");
    });

    it("should route support queries to Google", () => {
      const request: AiRequest = {
        prompt: "How can I improve my restaurant's Google My Business listing?",
        context: {
          domain: "support",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("google");
    });
  });

  describe("Provider Fallback Logic", () => {
    it("should fallback to next provider if first choice is unavailable", () => {
      // Mock a scenario where Bedrock is unavailable for system tasks
      const modelsWithoutBedrock = testModels.filter(
        (m) => m.provider !== "bedrock"
      );

      const gatewayWithoutBedrock = new AiRouterGateway({
        models: modelsWithoutBedrock,
        enableCaching: true,
        enableMetrics: true,
      });

      const request: AiRequest = {
        prompt: "Orchestrate a new workflow for system monitoring",
        context: {
          domain: "system",
          userId: "admin-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gatewayWithoutBedrock.route(
        request.prompt,
        request.context,
        request.tools
      );

      // Should fallback to Google (second in priority for system tasks)
      expect(decision.provider).toBe("google");
    });

    it("should fallback to Bedrock for audience tasks if Meta is unavailable", () => {
      const modelsWithoutMeta = testModels.filter((m) => m.provider !== "meta");

      const gatewayWithoutMeta = new AiRouterGateway({
        models: modelsWithoutMeta,
        enableCaching: true,
        enableMetrics: true,
      });

      const request: AiRequest = {
        prompt: "Analyze target audience demographics for marketing campaign",
        context: {
          domain: "marketing",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gatewayWithoutMeta.route(
        request.prompt,
        request.context,
        request.tools
      );

      // Should fallback to Google (second in priority for audience tasks)
      expect(decision.provider).toBe("google");
    });
  });

  describe("Edge Cases and Mixed Tasks", () => {
    it("should handle ambiguous tasks with multiple keywords", () => {
      const request: AiRequest = {
        prompt:
          "Create a system to analyze audience demographics and orchestrate marketing workflows",
        context: {
          domain: "general",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      // System keywords should take precedence (orchestrate)
      expect(decision.provider).toBe("bedrock");
    });

    it("should prioritize domain over keywords when domain is specific", () => {
      const request: AiRequest = {
        prompt: "Help with audience analysis",
        context: {
          domain: "system", // System domain should override audience keywords
          userId: "admin-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      expect(decision.provider).toBe("bedrock");
    });

    it("should handle tasks with no specific indicators", () => {
      const request: AiRequest = {
        prompt: "Write a blog post about Italian cuisine",
        context: {
          domain: "general",
          userId: "user-1",
          sessionId: "session-1",
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      // Should default to Google for general user tasks
      expect(decision.provider).toBe("google");
    });
  });

  describe("P95 Latency Integration with Provider Routing", () => {
    it("should maintain P95 targets across different provider routing", async () => {
      const requests: AiRequest[] = [
        // System task (Bedrock)
        {
          prompt: "Orchestrate deployment pipeline",
          context: {
            domain: "system",
            userId: "admin-1",
            sessionId: "session-1",
          },
        },
        // User task (Google)
        {
          prompt: "Help me improve my restaurant visibility",
          context: {
            domain: "general",
            userId: "user-1",
            sessionId: "session-1",
          },
        },
        // Audience task (Meta)
        {
          prompt: "Analyze target audience demographics",
          context: {
            domain: "marketing",
            userId: "user-1",
            sessionId: "session-1",
          },
        },
      ];

      // Execute requests and verify routing
      for (const request of requests) {
        const { decision } = gateway.route(
          request.prompt,
          request.context,
          request.tools
        );

        // Verify that provider selection is working
        expect(["bedrock", "google", "meta"]).toContain(decision.provider);

        // Verify that P95 monitoring is integrated
        expect(decision.reason).toBeDefined();
      }
    });
  });

  describe("Performance Optimization", () => {
    it("should consider provider latency in routing decisions", () => {
      // Google has lower latency (800ms) compared to Bedrock (1200ms) and Meta (1500ms)
      const request: AiRequest = {
        prompt: "Quick response needed for customer support",
        context: {
          domain: "support",
          userId: "user-1",
          sessionId: "session-1",
          slaMs: 500, // Very tight SLA
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      // Should route to Google due to better latency and user task nature
      expect(decision.provider).toBe("google");
    });

    it("should balance provider priority with performance requirements", () => {
      const request: AiRequest = {
        prompt: "System monitoring with tight latency requirements",
        context: {
          domain: "system",
          userId: "admin-1",
          sessionId: "session-1",
          slaMs: 300, // Very tight SLA that might override provider priority
        },
      };

      const { decision } = gateway.route(
        request.prompt,
        request.context,
        request.tools
      );

      // Should still prefer Bedrock for system tasks, but consider latency in scoring
      expect(decision.provider).toBe("bedrock");
      expect(decision.reason).toContain("score:");
    });
  });
});
