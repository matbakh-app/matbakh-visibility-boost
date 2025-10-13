import { BedrockAdapter } from "../adapters/bedrock-adapter";
import { GoogleAdapter } from "../adapters/google-adapter";
import { MetaAdapter } from "../adapters/meta-adapter";
import { UnifiedToolSpec } from "../adapters/tool-call-adapter";
import { CapabilityMatrix } from "../capability-matrix";
import { FallbackManager } from "../fallback-manager";
import { AiRequest, RouteDecision } from "../types";

describe("Tool-Call Integration Tests", () => {
  const weatherTool: UnifiedToolSpec = {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name" },
          units: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            default: "celsius",
          },
        },
        required: ["location"],
        additionalProperties: false,
      },
    },
  };

  const calculatorTool: UnifiedToolSpec = {
    type: "function",
    function: {
      name: "calculate",
      description: "Perform mathematical calculations",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Mathematical expression to evaluate",
          },
          precision: { type: "number", minimum: 0, maximum: 10, default: 2 },
        },
        required: ["expression"],
        additionalProperties: false,
      },
    },
  };

  describe("Cross-Provider Tool Compatibility", () => {
    it("should handle unified tools across all providers", () => {
      const bedrock = new BedrockAdapter();
      const google = new GoogleAdapter();
      const meta = new MetaAdapter();

      const tools = [weatherTool, calculatorTool];

      // All adapters should handle unified schema
      const bedrockTools = bedrock.fromUnifiedSchema(tools);
      const googleTools = google.fromUnifiedSchema(tools);
      const metaTools = meta.fromUnifiedSchema(tools);

      expect(bedrockTools).toHaveLength(2);
      expect(googleTools.tools[0].functionDeclarations).toHaveLength(2);
      expect(metaTools).toHaveLength(2);

      // Verify tool names are preserved
      expect(bedrockTools[0].name).toBe("get_weather");
      expect(googleTools.tools[0].functionDeclarations[0].name).toBe(
        "get_weather"
      );
      expect(metaTools[0].name).toBe("get_weather");
    });

    it("should validate tools consistently across providers", () => {
      const adapters = [
        new BedrockAdapter(),
        new GoogleAdapter(),
        new MetaAdapter(),
      ];

      const validTool = weatherTool;
      const invalidTool = {
        type: "function",
        function: { name: "" },
      } as UnifiedToolSpec;

      adapters.forEach((adapter) => {
        expect(adapter.validateToolSpec(validTool)).toBe(true);
        expect(adapter.validateToolSpec(invalidTool)).toBe(false);
      });
    });
  });

  describe("Capability Matrix Integration", () => {
    it("should find models that support tools", () => {
      const toolSupportingModels = CapabilityMatrix.findModelsByCapability({
        supportsTools: true,
      });

      expect(toolSupportingModels.length).toBeGreaterThan(0);

      // Verify all returned models actually support tools
      toolSupportingModels.forEach((model) => {
        expect(model.capability.supportsTools).toBe(true);
      });
    });

    it("should recommend appropriate models for tool-heavy workloads", () => {
      const recommendations =
        CapabilityMatrix.getProviderRecommendations("bedrock");

      expect(recommendations.mostCapable).toBeDefined();
      expect(recommendations.fastest).toBeDefined();
      expect(recommendations.cheapest).toBeDefined();
    });

    it("should calculate costs accurately for tool-enabled models", () => {
      const cost = CapabilityMatrix.estimateCost(
        "anthropic.claude-3-5-sonnet",
        1000,
        500
      );
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe("number");
    });
  });

  describe("Fallback Manager with Tools", () => {
    let fallbackManager: FallbackManager;

    beforeEach(() => {
      fallbackManager = new FallbackManager({
        maxRetries: 2,
        retryDelayMs: 100,
        circuitBreakerThreshold: 3,
        degradationMode: "fast_answer",
      });
    });

    it("should handle tool-enabled fallbacks", async () => {
      const mockRequest: AiRequest = {
        prompt: "What is the weather in Berlin?",
        context: {
          requireTools: true,
          domain: "general",
        },
        tools: [weatherTool],
      };

      const originalDecision: RouteDecision = {
        provider: "bedrock",
        modelId: "anthropic.claude-3-5-sonnet",
        temperature: 0.7,
        tools: [weatherTool],
        reason: "Tool-enabled request",
      };

      let executionCount = 0;
      const mockExecutor = jest
        .fn()
        .mockImplementation(async (decision: RouteDecision) => {
          executionCount++;
          if (executionCount === 1) {
            throw new Error("Service temporarily unavailable");
          }
          return {
            text: "Weather information retrieved successfully",
            toolCalls: [
              {
                id: "call_123",
                type: "function" as const,
                function: {
                  name: "get_weather",
                  arguments: { location: "Berlin", units: "celsius" },
                },
              },
            ],
          };
        });

      const result = await fallbackManager.executeWithFallback(
        {
          originalRequest: mockRequest,
          originalDecision,
          attemptCount: 0,
          fallbackReason: "service_unavailable",
        },
        mockExecutor
      );

      expect(mockExecutor).toHaveBeenCalledTimes(2);
      expect(result.text).toContain("Weather information");
    });

    it("should provide degraded response when all tool-enabled providers fail", async () => {
      const mockRequest: AiRequest = {
        prompt: "Calculate 2 + 2",
        context: {
          requireTools: true,
          domain: "general",
        },
        tools: [calculatorTool],
      };

      const originalDecision: RouteDecision = {
        provider: "bedrock",
        modelId: "anthropic.claude-3-5-sonnet",
        temperature: 0.7,
        tools: [calculatorTool],
        reason: "Calculator request",
      };

      const mockExecutor = jest
        .fn()
        .mockRejectedValue(new Error("All providers down"));

      const result = await fallbackManager.executeWithFallback(
        {
          originalRequest: mockRequest,
          originalDecision,
          attemptCount: 0,
          fallbackReason: "service_unavailable",
        },
        mockExecutor
      );

      expect(result.success).toBe(true);
      expect(result.text).toContain("technical difficulties");
      expect(result.provider).toBe("fallback");
    });
  });

  describe("Provider-Specific Tool Features", () => {
    it("should correctly report tool feature support", () => {
      const bedrock = new BedrockAdapter();
      const google = new GoogleAdapter();
      const meta = new MetaAdapter();

      // Bedrock should support all features
      expect(bedrock.supportsToolFeature("parallel_calls")).toBe(true);
      expect(bedrock.supportsToolFeature("streaming")).toBe(true);
      expect(bedrock.supportsToolFeature("json_schema")).toBe(true);
      expect(bedrock.supportsToolFeature("complex_types")).toBe(true);

      // Google should support most features except streaming with tools
      expect(google.supportsToolFeature("parallel_calls")).toBe(true);
      expect(google.supportsToolFeature("streaming")).toBe(false);
      expect(google.supportsToolFeature("json_schema")).toBe(true);
      expect(google.supportsToolFeature("complex_types")).toBe(true);

      // Meta should support no advanced tool features
      expect(meta.supportsToolFeature("parallel_calls")).toBe(false);
      expect(meta.supportsToolFeature("streaming")).toBe(false);
      expect(meta.supportsToolFeature("json_schema")).toBe(false);
      expect(meta.supportsToolFeature("complex_types")).toBe(false);
    });
  });

  describe("Tool Call Parsing Robustness", () => {
    it("should handle various response formats gracefully", () => {
      const bedrock = new BedrockAdapter();
      const google = new GoogleAdapter();

      // Test with empty responses
      expect(bedrock.parseToolCalls({})).toEqual([]);
      expect(google.parseToolCalls({ candidates: [] })).toEqual([]);

      // Test with malformed responses
      expect(bedrock.parseToolCalls(null)).toEqual([]);
      expect(
        google.parseToolCalls({ candidates: [{ content: null }] })
      ).toEqual([]);

      // Test with partial responses
      const partialBedrockResponse = {
        body: JSON.stringify({
          content: [
            { type: "text", text: "Some text" },
            { type: "tool_use", name: "incomplete_tool" },
          ],
        }),
      };

      const toolCalls = bedrock.parseToolCalls(partialBedrockResponse);
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].function.name).toBe("incomplete_tool");
    });
  });

  describe("Performance and Cost Optimization", () => {
    it("should select appropriate models based on tool requirements", () => {
      // For simple tool calls, should prefer faster/cheaper models
      const fastModel = CapabilityMatrix.getFastestModel({
        supportsTools: true,
        maxCostPer1kInput: 0.001,
      });

      expect(fastModel).toBeDefined();
      expect(fastModel!.capability.supportsTools).toBe(true);

      // For complex tool calls, should prefer more capable models
      const capableModel = CapabilityMatrix.findModelsByCapability({
        supportsTools: true,
        supportsJson: true,
        minContextTokens: 100000,
      })[0];

      expect(capableModel).toBeDefined();
      expect(capableModel.capability.contextTokens).toBeGreaterThanOrEqual(
        100000
      );
    });

    it("should estimate costs accurately for tool-heavy requests", () => {
      const models = [
        "anthropic.claude-3-5-sonnet",
        "gemini-1.5-flash",
        "llama-3-8b",
      ];

      models.forEach((modelId) => {
        const cost = CapabilityMatrix.estimateCost(modelId, 2000, 1000);
        expect(cost).toBeGreaterThan(0);
        expect(Number.isFinite(cost)).toBe(true);
      });
    });
  });
});
