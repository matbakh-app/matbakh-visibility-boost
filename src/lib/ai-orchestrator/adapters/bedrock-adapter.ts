import { ProviderResponse, RouteDecision, ToolSpec } from "../types";
import { BaseAdapter, UnifiedToolSpec } from "./tool-call-adapter";

export class BedrockAdapter extends BaseAdapter {
  mapTools(tools?: ToolSpec[]) {
    if (!tools?.length) return undefined;

    // Anthropic tool schema via Bedrock toolUse format
    return tools.map((t) => ({
      name: t.name,
      description: t.description || "",
      input_schema: {
        type: "object",
        properties: t.parameters || {},
        required: Object.keys(t.parameters || {}),
      },
    }));
  }

  // Enhanced mapping from unified schema to Bedrock format
  override fromUnifiedSchema(tools?: UnifiedToolSpec[]): any | undefined {
    if (!tools?.length) return undefined;

    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description || "",
      input_schema: {
        type: "object",
        properties: tool.function.parameters.properties,
        required: tool.function.parameters.required || [],
        additionalProperties:
          tool.function.parameters.additionalProperties || false,
      },
    }));
  }

  buildRequest(input: {
    prompt: string;
    decision: RouteDecision;
    streaming?: boolean;
    maxTokens?: number;
    tools?: ToolSpec[] | UnifiedToolSpec[];
  }) {
    const { prompt, decision, streaming, maxTokens, tools } = input;

    const body: any = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens || 1024,
      temperature: decision.temperature,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    };

    // Handle tools from decision or input parameter
    const toolsToUse = tools || decision.tools;
    if (toolsToUse?.length) {
      if (this.isUnifiedToolSpec(toolsToUse[0])) {
        body.tools = this.fromUnifiedSchema(toolsToUse as UnifiedToolSpec[]);
      } else {
        body.tools = this.mapTools(toolsToUse as ToolSpec[]);
      }
    }

    // Add system message for domain-specific instructions
    if (prompt.includes("legal") || prompt.includes("compliance")) {
      body.system =
        "You are a precise legal assistant. Provide accurate, well-sourced information and clearly indicate when you cannot provide legal advice.";
    }

    return {
      modelId: decision.modelId,
      contentType: "application/json",
      accept: streaming
        ? "application/vnd.amazon.eventstream"
        : "application/json",
      body: JSON.stringify(body),
    };
  }

  parseResponse(resp: any): ProviderResponse {
    try {
      this.validateResponse(resp, "Bedrock");

      const body =
        typeof resp.body === "string" ? JSON.parse(resp.body) : resp.body;

      // Handle streaming response
      if (resp.body && typeof resp.body === "object" && resp.body.chunk) {
        return this.parseStreamingResponse(resp);
      }

      // Standard response parsing
      const text = body?.content?.map((c: any) => c.text).join("\n") || "";
      const toolCalls =
        body?.tool_calls?.map((tc: any) => ({
          name: tc.name,
          arguments: tc.input,
        })) || [];

      const tokensUsed = {
        input: body?.usage?.input_tokens || 0,
        output: body?.usage?.output_tokens || 0,
      };

      return {
        text,
        toolCalls,
        raw: body,
        tokensUsed,
      };
    } catch (error) {
      this.handleError(error, "Bedrock");
    }
  }

  private parseStreamingResponse(resp: any): ProviderResponse {
    // Handle Bedrock streaming response format
    let text = "";
    const toolCalls: Array<{ name: string; arguments: any }> = [];

    // Process streaming chunks
    if (resp.body?.chunk?.bytes) {
      const chunk = JSON.parse(
        Buffer.from(resp.body.chunk.bytes, "base64").toString()
      );
      if (chunk.delta?.text) {
        text += chunk.delta.text;
      }
    }

    return {
      text,
      toolCalls,
      raw: resp,
      tokensUsed: { input: 0, output: 0 }, // Updated in final chunk
    };
  }

  getProviderConfig() {
    return {
      maxContextTokens: 200000, // Claude 3.5 Sonnet context window
      supportsStreaming: true,
      supportsTools: true,
      supportsJsonMode: true, // Claude supports JSON mode
      supportsVision: true, // Claude 3.5 supports vision
      rateLimitRpm: 1000, // Requests per minute
      fallbackProvider: "google", // Fallback to Google if Bedrock fails
    };
  }

  // Bedrock-specific token estimation using Claude tokenizer patterns
  override estimateTokens(text: string): { input: number; output: number } {
    // More accurate estimation for Claude models
    // Claude typically uses ~3.5 characters per token
    const tokens = Math.ceil(text.length / 3.5);
    return { input: tokens, output: 0 };
  }

  // Implementation of abstract methods
  protected extractToolCallsFromResponse(resp: any): Array<{
    id?: string;
    name: string;
    arguments: any;
    confidence?: number;
  }> {
    const body =
      typeof resp.body === "string" ? JSON.parse(resp.body) : resp.body;

    // Handle Bedrock/Claude tool calls format
    if (body?.content) {
      return body.content
        .filter((c: any) => c.type === "tool_use")
        .map((toolUse: any, index: number) => ({
          id: toolUse.id || `bedrock_call_${index}`,
          name: toolUse.name,
          arguments: toolUse.input || {},
          confidence: 1.0, // Bedrock doesn't provide confidence scores
        }));
    }

    // Legacy format support
    if (body?.tool_calls) {
      return body.tool_calls.map((tc: any, index: number) => ({
        id: tc.id || `bedrock_legacy_${index}`,
        name: tc.name,
        arguments: tc.input || tc.arguments || {},
        confidence: 1.0,
      }));
    }

    return [];
  }

  protected getProviderName(): string {
    return "bedrock";
  }

  // Enhanced tool feature support for Bedrock
  override supportsToolFeature(
    feature: "parallel_calls" | "streaming" | "json_schema" | "complex_types"
  ): boolean {
    switch (feature) {
      case "parallel_calls":
        return true; // Claude supports parallel tool calls
      case "streaming":
        return true; // Bedrock supports streaming with tools
      case "json_schema":
        return true; // Claude supports structured output
      case "complex_types":
        return true; // Claude handles complex nested types well
      default:
        return super.supportsToolFeature(feature);
    }
  }

  // Helper method to check if tools are in unified format
  private isUnifiedToolSpec(tool: any): tool is UnifiedToolSpec {
    return tool && typeof tool === "object" && "function" in tool;
  }
}
