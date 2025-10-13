import { ProviderResponse, RouteDecision, ToolSpec } from "../types";
import { BaseAdapter } from "./tool-call-adapter";

export class MetaAdapter extends BaseAdapter {
  mapTools(tools?: ToolSpec[]) {
    // Meta/Llama models have limited tool support
    // For now, we'll format tools as structured prompts
    if (!tools?.length) return undefined;

    // Convert tools to structured prompt format for Llama
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description || "",
      parameters: tool.parameters || {},
      format: "structured_prompt", // Custom format for Llama
    }));
  }

  // Enhanced mapping from unified schema to Meta format
  override fromUnifiedSchema(tools?: UnifiedToolSpec[]): any | undefined {
    if (!tools?.length) return undefined;

    // Convert unified tools to Meta/Llama format
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description || "",
      parameters: tool.function.parameters.properties,
      format: "structured_prompt",
    }));
  }

  buildRequest(input: {
    prompt: string;
    decision: RouteDecision;
    streaming?: boolean;
    maxTokens?: number;
    tools?: ToolSpec[] | UnifiedToolSpec[];
  }) {
    const { prompt, decision, maxTokens, tools } = input;

    // Handle tools by embedding them in the prompt (Llama doesn't support structured tools)
    let enhancedPrompt = prompt;
    const toolsToUse = tools || decision.tools;
    if (toolsToUse?.length) {
      const toolDescriptions = this.formatToolsForPrompt(toolsToUse);
      enhancedPrompt = `${prompt}\n\nAvailable tools:\n${toolDescriptions}`;
    }

    // Format for Llama models (via Bedrock or direct endpoint)
    const request: any = {
      prompt: this.formatPromptForLlama(enhancedPrompt),
      temperature: decision.temperature,
      max_gen_len: maxTokens || 1024,
      top_p: 0.9,
    };

    // Add system prompt for different domains
    if (
      prompt.toLowerCase().includes("culinary") ||
      prompt.toLowerCase().includes("food")
    ) {
      request.system_prompt =
        "You are a knowledgeable culinary expert. Provide detailed, practical cooking advice and recipes.";
    }

    return request;
  }

  parseResponse(resp: any): ProviderResponse {
    try {
      this.validateResponse(resp, "Meta");

      // Handle different response formats (Bedrock vs direct)
      let text = "";
      let tokensUsed = { input: 0, output: 0 };

      if (resp.body) {
        // Bedrock format
        const body =
          typeof resp.body === "string" ? JSON.parse(resp.body) : resp.body;
        text = body.generation || body.generated_text || "";
        tokensUsed = {
          input: body.prompt_token_count || 0,
          output: body.generation_token_count || 0,
        };
      } else if (resp.generated_text) {
        // Direct endpoint format
        text = resp.generated_text;
        tokensUsed = this.estimateTokens(text);
      } else if (typeof resp === "string") {
        // Simple string response
        text = resp;
        tokensUsed = this.estimateTokens(text);
      }

      return {
        text,
        toolCalls: [], // Llama doesn't support structured tool calls yet
        raw: resp,
        tokensUsed,
      };
    } catch (error) {
      this.handleError(error, "Meta");
    }
  }

  private formatPromptForLlama(prompt: string): string {
    // Format prompt for Llama models with proper instruction format
    return `<s>[INST] ${prompt} [/INST]`;
  }

  getProviderConfig() {
    return {
      maxContextTokens: 32768, // Llama 3 70B context window
      supportsStreaming: false, // Limited streaming support
      supportsTools: false, // No structured tool calling
      supportsJsonMode: false, // Limited JSON mode support
      supportsVision: false, // No vision support
      rateLimitRpm: 100, // Conservative rate limit
      fallbackProvider: "bedrock", // Fallback to Bedrock if Meta fails
    };
  }

  // Meta-specific token estimation
  override estimateTokens(text: string): { input: number; output: number } {
    // Llama tokenizer typically uses ~4.2 characters per token
    const tokens = Math.ceil(text.length / 4.2);
    return { input: tokens, output: 0 };
  }

  // Implementation of abstract methods
  protected extractToolCallsFromResponse(resp: any): Array<{
    id?: string;
    name: string;
    arguments: any;
    confidence?: number;
  }> {
    // Meta/Llama doesn't support structured tool calls
    // We could implement text parsing for tool-like responses here
    // For now, return empty array
    return [];
  }

  protected getProviderName(): string {
    return "meta";
  }

  // Enhanced tool feature support for Meta (limited)
  override supportsToolFeature(
    feature: "parallel_calls" | "streaming" | "json_schema" | "complex_types"
  ): boolean {
    // Meta/Llama has very limited tool support
    return false;
  }

  // Helper method to format tools for prompt inclusion
  private formatToolsForPrompt(tools: (ToolSpec | UnifiedToolSpec)[]): string {
    return tools
      .map((tool) => {
        if ("function" in tool) {
          // UnifiedToolSpec
          const func = tool.function;
          const params = Object.keys(func.parameters.properties).join(", ");
          return `- ${func.name}(${params}): ${func.description}`;
        } else {
          // ToolSpec
          const params = Object.keys(tool.parameters || {}).join(", ");
          return `- ${tool.name}(${params}): ${
            tool.description || "No description"
          }`;
        }
      })
      .join("\n");
  }

  // Helper method to check if tools are in unified format
  private isUnifiedToolSpec(tool: any): tool is UnifiedToolSpec {
    return tool && typeof tool === "object" && "function" in tool;
  }

  // Check if model supports the requested features (legacy method for compatibility)
  supportsFeature(feature: "tools" | "streaming" | "json" | "vision"): boolean {
    switch (feature) {
      case "tools":
      case "json":
      case "vision":
        return false;
      case "streaming":
        return false; // Limited support
      default:
        return false;
    }
  }
}
