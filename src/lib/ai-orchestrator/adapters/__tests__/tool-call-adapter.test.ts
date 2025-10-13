import { RouteDecision, ToolSpec } from "../../types";
import { BedrockAdapter } from "../bedrock-adapter";
import { GoogleAdapter } from "../google-adapter";
import { MetaAdapter } from "../meta-adapter";
import { UnifiedToolSpec } from "../tool-call-adapter";

describe("Enhanced Tool-Call Adapter", () => {
  const sampleToolSpec: ToolSpec = {
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      location: { type: "string", required: true },
      units: { type: "string", enum: ["celsius", "fahrenheit"] },
    },
  };

  const sampleUnifiedToolSpec: UnifiedToolSpec = {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
          units: { type: "string", enum: ["celsius", "fahrenheit"] },
        },
        required: ["location"],
        additionalProperties: false,
      },
    },
  };

  const mockRouteDecision: RouteDecision = {
    provider: "bedrock",
    modelId: "anthropic.claude-3-5-sonnet",
    temperature: 0.7,
    reason: "Test decision",
  };

  describe("BedrockAdapter", () => {
    let adapter: BedrockAdapter;

    beforeEach(() => {
      adapter = new BedrockAdapter();
    });

    it("should convert ToolSpec to unified schema", () => {
      const unified = adapter.toUnifiedSchema([sampleToolSpec]);

      expect(unified).toHaveLength(1);
      expect(unified![0]).toMatchObject({
        type: "function",
        function: {
          name: "get_weather",
          description: "Get current weather for a location",
          parameters: {
            type: "object",
            properties: sampleToolSpec.parameters,
            additionalProperties: false,
          },
        },
      });
    });

    it("should convert unified schema to Bedrock format", () => {
      const bedrockTools = adapter.fromUnifiedSchema([sampleUnifiedToolSpec]);

      expect(bedrockTools).toHaveLength(1);
      expect(bedrockTools[0]).toMatchObject({
        name: "get_weather",
        description: "Get current weather for a location",
        input_schema: {
          type: "object",
          properties: sampleUnifiedToolSpec.function.parameters.properties,
          required: ["location"],
          additionalProperties: false,
        },
      });
    });

    it("should validate tool specifications", () => {
      expect(adapter.validateToolSpec(sampleToolSpec)).toBe(true);
      expect(adapter.validateToolSpec(sampleUnifiedToolSpec)).toBe(true);
      expect(adapter.validateToolSpec({ name: "" } as ToolSpec)).toBe(false);
    });

    it("should support advanced tool features", () => {
      expect(adapter.supportsToolFeature("parallel_calls")).toBe(true);
      expect(adapter.supportsToolFeature("streaming")).toBe(true);
      expect(adapter.supportsToolFeature("json_schema")).toBe(true);
      expect(adapter.supportsToolFeature("complex_types")).toBe(true);
    });

    it("should build request with unified tools", () => {
      const request = adapter.buildRequest({
        prompt: "What is the weather in Berlin?",
        decision: mockRouteDecision,
        tools: [sampleUnifiedToolSpec],
      });

      const body = JSON.parse(request.body);
      expect(body.tools).toBeDefined();
      expect(body.tools[0].name).toBe("get_weather");
    });

    it("should parse tool calls from response", () => {
      const mockResponse = {
        body: JSON.stringify({
          content: [
            {
              type: "tool_use",
              id: "call_123",
              name: "get_weather",
              input: { location: "Berlin", units: "celsius" },
            },
          ],
        }),
      };

      const toolCalls = adapter.parseToolCalls(mockResponse);
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0]).toMatchObject({
        id: "call_123",
        type: "function",
        function: {
          name: "get_weather",
          arguments: { location: "Berlin", units: "celsius" },
        },
        provider: "bedrock",
      });
    });

    it("should provide enhanced provider config", () => {
      const config = adapter.getProviderConfig();
      expect(config).toMatchObject({
        maxContextTokens: 200000,
        supportsStreaming: true,
        supportsTools: true,
        supportsJsonMode: true,
        supportsVision: true,
        rateLimitRpm: 1000,
        fallbackProvider: "google",
      });
    });
  });

  describe("GoogleAdapter", () => {
    let adapter: GoogleAdapter;

    beforeEach(() => {
      adapter = new GoogleAdapter();
    });

    it("should convert unified schema to Google format", () => {
      const googleTools = adapter.fromUnifiedSchema([sampleUnifiedToolSpec]);

      expect(googleTools.tools).toHaveLength(1);
      expect(googleTools.tools[0].functionDeclarations[0]).toMatchObject({
        name: "get_weather",
        description: "Get current weather for a location",
        parameters: {
          type: "object",
          properties: sampleUnifiedToolSpec.function.parameters.properties,
          required: ["location"],
        },
      });
    });

    it("should parse tool calls from Google response", () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: "get_weather",
                    args: { location: "Berlin", units: "celsius" },
                  },
                },
              ],
            },
            finishReason: "STOP",
          },
        ],
      };

      const toolCalls = adapter.parseToolCalls(mockResponse);
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0]).toMatchObject({
        type: "function",
        function: {
          name: "get_weather",
          arguments: { location: "Berlin", units: "celsius" },
        },
        provider: "google",
        confidence: 1.0,
      });
    });

    it("should have correct tool feature support", () => {
      expect(adapter.supportsToolFeature("parallel_calls")).toBe(true);
      expect(adapter.supportsToolFeature("streaming")).toBe(false); // Google limitation
      expect(adapter.supportsToolFeature("json_schema")).toBe(true);
      expect(adapter.supportsToolFeature("complex_types")).toBe(true);
    });
  });

  describe("MetaAdapter", () => {
    let adapter: MetaAdapter;

    beforeEach(() => {
      adapter = new MetaAdapter();
    });

    it("should convert unified schema to Meta format", () => {
      const metaTools = adapter.fromUnifiedSchema([sampleUnifiedToolSpec]);

      expect(metaTools).toHaveLength(1);
      expect(metaTools[0]).toMatchObject({
        name: "get_weather",
        description: "Get current weather for a location",
        parameters: sampleUnifiedToolSpec.function.parameters.properties,
        format: "structured_prompt",
      });
    });

    it("should embed tools in prompt for Llama", () => {
      const request = adapter.buildRequest({
        prompt: "What is the weather in Berlin?",
        decision: mockRouteDecision,
        tools: [sampleUnifiedToolSpec],
      });

      expect(request.prompt).toContain("Available tools:");
      expect(request.prompt).toContain("get_weather");
    });

    it("should have limited tool feature support", () => {
      expect(adapter.supportsToolFeature("parallel_calls")).toBe(false);
      expect(adapter.supportsToolFeature("streaming")).toBe(false);
      expect(adapter.supportsToolFeature("json_schema")).toBe(false);
      expect(adapter.supportsToolFeature("complex_types")).toBe(false);
    });

    it("should return empty tool calls (no structured support)", () => {
      const mockResponse = { generated_text: "Some response" };
      const toolCalls = adapter.parseToolCalls(mockResponse);
      expect(toolCalls).toHaveLength(0);
    });
  });

  describe("Cross-Provider Compatibility", () => {
    it("should maintain consistent unified schema across providers", () => {
      const bedrock = new BedrockAdapter();
      const google = new GoogleAdapter();
      const meta = new MetaAdapter();

      const bedrockUnified = bedrock.toUnifiedSchema([sampleToolSpec]);
      const googleUnified = google.toUnifiedSchema([sampleToolSpec]);
      const metaUnified = meta.toUnifiedSchema([sampleToolSpec]);

      expect(bedrockUnified).toEqual(googleUnified);
      expect(googleUnified).toEqual(metaUnified);
    });

    it("should handle fallback providers correctly", () => {
      const bedrock = new BedrockAdapter();
      const google = new GoogleAdapter();
      const meta = new MetaAdapter();

      expect(bedrock.getProviderConfig().fallbackProvider).toBe("google");
      expect(google.getProviderConfig().fallbackProvider).toBe("bedrock");
      expect(meta.getProviderConfig().fallbackProvider).toBe("bedrock");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid tool specifications gracefully", () => {
      const adapter = new BedrockAdapter();

      expect(adapter.validateToolSpec({} as ToolSpec)).toBe(false);
      expect(adapter.validateToolSpec({ name: null } as any)).toBe(false);
      expect(adapter.toUnifiedSchema([])).toBeUndefined();
      expect(adapter.fromUnifiedSchema([])).toBeUndefined();
    });

    it("should handle malformed responses gracefully", () => {
      const adapter = new BedrockAdapter();

      const toolCalls = adapter.parseToolCalls({});
      expect(toolCalls).toEqual([]);

      const toolCalls2 = adapter.parseToolCalls(null);
      expect(toolCalls2).toEqual([]);
    });
  });
});
