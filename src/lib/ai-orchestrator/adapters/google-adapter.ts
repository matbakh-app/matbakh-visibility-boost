import { ProviderResponse, RouteDecision, ToolSpec } from "../types";
import { BaseAdapter } from "./tool-call-adapter";

export class GoogleAdapter extends BaseAdapter {
  mapTools(tools?: ToolSpec[]) {
    if (!tools?.length) return undefined;

    return {
      tools: [
        {
          functionDeclarations: tools.map((t) => ({
            name: t.name,
            description: t.description || "",
            parameters: {
              type: "object",
              properties: t.parameters || {},
              required: Object.keys(t.parameters || {}),
            },
          })),
        },
      ],
    };
  }

  // Enhanced mapping from unified schema to Google format
  override fromUnifiedSchema(tools?: UnifiedToolSpec[]): any | undefined {
    if (!tools?.length) return undefined;

    return {
      tools: [
        {
          functionDeclarations: tools.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description || "",
            parameters: {
              type: "object",
              properties: tool.function.parameters.properties,
              required: tool.function.parameters.required || [],
            },
          })),
        },
      ],
    };
  }

  buildRequest(input: {
    prompt: string;
    decision: RouteDecision;
    streaming?: boolean;
    maxTokens?: number;
    tools?: ToolSpec[] | UnifiedToolSpec[];
  }) {
    const { prompt, decision, streaming, maxTokens, tools } = input;

    const request: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: decision.temperature,
        maxOutputTokens: maxTokens || 1024,
        topP: 0.8,
        topK: 40,
      },
    };

    // Handle tools from decision or input parameter
    const toolsToUse = tools || decision.tools;
    if (toolsToUse?.length) {
      if (this.isUnifiedToolSpec(toolsToUse[0])) {
        Object.assign(
          request,
          this.fromUnifiedSchema(toolsToUse as UnifiedToolSpec[])
        );
      } else {
        Object.assign(request, this.mapTools(toolsToUse as ToolSpec[]));
      }
    }

    // Add safety settings for different domains
    request.safetySettings = this.getSafetySettings(prompt);

    return request;
  }

  parseResponse(resp: any): ProviderResponse {
    try {
      this.validateResponse(resp, "Google");

      // Handle different response formats
      const candidates = resp.candidates || [];
      if (candidates.length === 0) {
        return {
          text: "",
          toolCalls: [],
          raw: resp,
          tokensUsed: { input: 0, output: 0 },
        };
      }

      const candidate = candidates[0];
      const content = candidate.content;

      // Extract text content
      const textParts = content?.parts?.filter((p: any) => p.text) || [];
      const text = textParts.map((p: any) => p.text).join("\n");

      // Extract function calls
      const functionCalls =
        content?.parts?.filter((p: any) => p.functionCall) || [];
      const toolCalls = functionCalls.map((fc: any) => ({
        name: fc.functionCall.name,
        arguments: fc.functionCall.args || {},
      }));

      // Extract usage metadata
      const tokensUsed = {
        input: resp.usageMetadata?.promptTokenCount || 0,
        output: resp.usageMetadata?.candidatesTokenCount || 0,
      };

      return {
        text,
        toolCalls,
        raw: resp,
        tokensUsed,
      };
    } catch (error) {
      this.handleError(error, "Google");
    }
  }

  private getSafetySettings(prompt: string) {
    // Adjust safety settings based on content
    const isLegalContent =
      prompt.toLowerCase().includes("legal") ||
      prompt.toLowerCase().includes("law") ||
      prompt.toLowerCase().includes("compliance");

    const isMedicalContent =
      prompt.toLowerCase().includes("medical") ||
      prompt.toLowerCase().includes("health") ||
      prompt.toLowerCase().includes("diagnosis");

    if (isLegalContent || isMedicalContent) {
      return [
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_LOW_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_LOW_AND_ABOVE",
        },
      ];
    }

    return [
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
    ];
  }

  getProviderConfig() {
    return {
      maxContextTokens: 1000000, // Gemini 1.5 Pro context window
      supportsStreaming: true,
      supportsTools: true,
      supportsJsonMode: true, // Gemini supports JSON mode
      supportsVision: true, // Gemini supports vision
      rateLimitRpm: 300, // Requests per minute (varies by tier)
      fallbackProvider: "bedrock", // Fallback to Bedrock if Google fails
    };
  }

  // Google-specific token estimation
  override estimateTokens(text: string): { input: number; output: number } {
    // Gemini typically uses ~4 characters per token
    const tokens = Math.ceil(text.length / 4);
    return { input: tokens, output: 0 };
  }

  // Implementation of abstract methods
  protected extractToolCallsFromResponse(resp: any): Array<{
    id?: string;
    name: string;
    arguments: any;
    confidence?: number;
  }> {
    const candidates = resp.candidates || [];
    if (candidates.length === 0) return [];

    const candidate = candidates[0];
    const content = candidate.content;

    // Extract function calls from Google response format
    const functionCalls =
      content?.parts?.filter((p: any) => p.functionCall) || [];

    return functionCalls.map((fc: any, index: number) => ({
      id: fc.functionCall.id || `google_call_${index}`,
      name: fc.functionCall.name,
      arguments: fc.functionCall.args || {},
      confidence: candidate.finishReason === "STOP" ? 1.0 : 0.8, // Lower confidence for incomplete responses
    }));
  }

  protected getProviderName(): string {
    return "google";
  }

  // Enhanced tool feature support for Google
  override supportsToolFeature(
    feature: "parallel_calls" | "streaming" | "json_schema" | "complex_types"
  ): boolean {
    switch (feature) {
      case "parallel_calls":
        return true; // Gemini supports parallel function calls
      case "streaming":
        return false; // Google doesn't support streaming with function calls yet
      case "json_schema":
        return true; // Gemini supports structured output
      case "complex_types":
        return true; // Gemini handles complex nested types
      default:
        return super.supportsToolFeature(feature);
    }
  }

  // Helper method to check if tools are in unified format
  private isUnifiedToolSpec(tool: any): tool is UnifiedToolSpec {
    return tool && typeof tool === "object" && "function" in tool;
  }
}
