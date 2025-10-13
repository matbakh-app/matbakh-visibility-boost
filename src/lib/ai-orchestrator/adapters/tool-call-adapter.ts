import { ProviderResponse, RouteDecision, ToolSpec } from "../types";

// OpenAI-like unified tool schema for cross-provider compatibility
export interface UnifiedToolSpec {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
      additionalProperties?: boolean;
    };
  };
}

// Enhanced tool call result with provider context
export interface UnifiedToolCall {
  id?: string;
  type: "function";
  function: {
    name: string;
    arguments: string | Record<string, any>;
  };
  provider?: string;
  confidence?: number;
}

export interface ToolCallAdapter {
  // Normalize tool definitions to provider-native format
  mapTools(tools?: ToolSpec[]): any | undefined;

  // Convert to unified OpenAI-like schema
  toUnifiedSchema(tools?: ToolSpec[]): UnifiedToolSpec[] | undefined;

  // Convert from unified schema to provider format
  fromUnifiedSchema(tools?: UnifiedToolSpec[]): any | undefined;

  // Build provider request payload from neutral decision
  buildRequest(input: {
    prompt: string;
    decision: RouteDecision;
    streaming?: boolean;
    maxTokens?: number;
    tools?: ToolSpec[] | UnifiedToolSpec[];
  }): any;

  // Parse provider response -> neutral shape
  parseResponse(resp: any): ProviderResponse;

  // Parse tool calls with enhanced error handling
  parseToolCalls(resp: any): UnifiedToolCall[];

  // Estimate token count for cost calculation
  estimateTokens(text: string): { input: number; output: number };

  // Get provider-specific configuration
  getProviderConfig(): {
    maxContextTokens: number;
    supportsStreaming: boolean;
    supportsTools: boolean;
    supportsJsonMode?: boolean;
    supportsVision?: boolean;
    rateLimitRpm: number;
    fallbackProvider?: string;
  };

  // Validate tool specification
  validateToolSpec(tool: ToolSpec | UnifiedToolSpec): boolean;

  // Check if provider supports specific tool features
  supportsToolFeature(
    feature: "parallel_calls" | "streaming" | "json_schema" | "complex_types"
  ): boolean;
}

export abstract class BaseAdapter implements ToolCallAdapter {
  abstract mapTools(tools?: ToolSpec[]): any | undefined;
  abstract buildRequest(input: {
    prompt: string;
    decision: RouteDecision;
    streaming?: boolean;
    maxTokens?: number;
    tools?: ToolSpec[] | UnifiedToolSpec[];
  }): any;
  abstract parseResponse(resp: any): ProviderResponse;
  abstract getProviderConfig(): {
    maxContextTokens: number;
    supportsStreaming: boolean;
    supportsTools: boolean;
    supportsJsonMode?: boolean;
    supportsVision?: boolean;
    rateLimitRpm: number;
    fallbackProvider?: string;
  };

  // Convert ToolSpec to unified OpenAI-like schema
  toUnifiedSchema(tools?: ToolSpec[]): UnifiedToolSpec[] | undefined {
    if (!tools?.length) return undefined;

    return tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description || `Execute ${tool.name} function`,
        parameters: {
          type: "object" as const,
          properties: tool.parameters || {},
          required: this.extractRequiredFields(tool.parameters),
          additionalProperties: false,
        },
      },
    }));
  }

  // Convert unified schema back to provider format (default implementation)
  fromUnifiedSchema(tools?: UnifiedToolSpec[]): any | undefined {
    if (!tools?.length) return undefined;

    const toolSpecs: ToolSpec[] = tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters.properties,
    }));

    return this.mapTools(toolSpecs);
  }

  // Parse tool calls with enhanced error handling
  parseToolCalls(resp: any): UnifiedToolCall[] {
    try {
      const toolCalls = this.extractToolCallsFromResponse(resp);
      return toolCalls.map((call, index) => ({
        id: call.id || `call_${index}`,
        type: "function" as const,
        function: {
          name: call.name,
          arguments: this.normalizeArguments(call.arguments),
        },
        provider: this.getProviderName(),
        confidence: call.confidence || 1.0,
      }));
    } catch (error) {
      console.warn(`Failed to parse tool calls: ${error}`);
      return [];
    }
  }

  // Validate tool specification
  validateToolSpec(tool: ToolSpec | UnifiedToolSpec): boolean {
    try {
      if ("function" in tool) {
        // UnifiedToolSpec validation
        const func = tool.function;
        return !!(
          func.name &&
          func.parameters &&
          func.parameters.type === "object" &&
          func.parameters.properties
        );
      } else {
        // ToolSpec validation
        return !!(tool.name && typeof tool.name === "string");
      }
    } catch {
      return false;
    }
  }

  // Check if provider supports specific tool features (default: basic support)
  supportsToolFeature(
    feature: "parallel_calls" | "streaming" | "json_schema" | "complex_types"
  ): boolean {
    const config = this.getProviderConfig();
    switch (feature) {
      case "parallel_calls":
        return config.supportsTools;
      case "streaming":
        return config.supportsStreaming && config.supportsTools;
      case "json_schema":
        return config.supportsJsonMode || false;
      case "complex_types":
        return config.supportsTools;
      default:
        return false;
    }
  }

  // Simple token estimation (override for provider-specific tokenizers)
  estimateTokens(text: string): { input: number; output: number } {
    // Rough estimation: ~4 characters per token for most models
    const tokens = Math.ceil(text.length / 4);
    return { input: tokens, output: 0 };
  }

  // Common error handling with enhanced context
  protected handleError(error: any, provider: string, context?: string): never {
    const message = error?.message || "Unknown error";
    const contextStr = context ? ` (${context})` : "";
    throw new Error(`${provider} adapter error${contextStr}: ${message}`);
  }

  // Common response validation
  protected validateResponse(resp: any, provider: string): void {
    if (!resp) {
      throw new Error(`${provider} returned empty response`);
    }
  }

  // Helper methods for subclasses
  protected extractRequiredFields(parameters?: Record<string, any>): string[] {
    if (!parameters) return [];

    return Object.entries(parameters)
      .filter(
        ([_, schema]) => schema?.required === true || schema?.nullable === false
      )
      .map(([key]) => key);
  }

  protected normalizeArguments(args: any): string | Record<string, any> {
    if (typeof args === "string") {
      try {
        return JSON.parse(args);
      } catch {
        return args;
      }
    }
    return args || {};
  }

  // Abstract methods for subclasses to implement
  protected abstract extractToolCallsFromResponse(resp: any): Array<{
    id?: string;
    name: string;
    arguments: any;
    confidence?: number;
  }>;

  protected abstract getProviderName(): string;
}
