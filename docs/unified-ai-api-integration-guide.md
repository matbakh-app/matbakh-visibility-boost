# Unified AI API - Developer Integration Guide

## 🎯 **Integration Overview**

This guide helps developers integrate the Unified AI API into existing matbakh.app components and new features.

---

## 🚀 **Step-by-Step Integration**

### Step 1: Install Dependencies

```bash
# Already included in the project
# No additional dependencies needed
```

### Step 2: Import the API

```typescript
// For direct API usage
import {
  createUnifiedAiApi,
  getUnifiedAiApi,
} from "@/lib/ai-orchestrator/unified-ai-api";

// For React components
import {
  useUnifiedAi,
  useProviderManagement,
  useAiMetrics,
} from "@/hooks/useUnifiedAi";

// For dashboard components
import { UnifiedAiDashboard } from "@/components/ai/UnifiedAiDashboard";
```

### Step 3: Basic Integration

```typescript
// pages/recipe-generator.tsx
import React from "react";
import { useUnifiedAi } from "@/hooks/useUnifiedAi";

export default function RecipeGenerator() {
  const { generateResponse, isLoading, response, error } = useUnifiedAi({
    enableAutoRetry: true,
    maxRetries: 3,
  });

  const generateRecipe = async (ingredients: string[]) => {
    await generateResponse({
      prompt: `Create a recipe using these ingredients: ${ingredients.join(
        ", "
      )}`,
      context: {
        domain: "culinary",
        locale: "de-DE",
        budgetTier: "standard",
      },
      tools: [
        {
          name: "get_nutrition_info",
          description: "Get nutritional information",
          parameters: { ingredient: { type: "string" } },
        },
      ],
    });
  };

  return (
    <div>
      <button onClick={() => generateRecipe(["tomatoes", "pasta", "basil"])}>
        {isLoading ? "Generating..." : "Generate Recipe"}
      </button>
      {response && (
        <div>
          <h3>Generated Recipe:</h3>
          <p>{response.text}</p>
          <small>
            Provider: {response.provider} | Cost: €{response.costEuro}
          </small>
        </div>
      )}
      {error && <div className="error">Error: {error.message}</div>}
    </div>
  );
}
```

---

## 🏗️ **Integration Patterns**

### Pattern 1: Simple Text Generation

```typescript
// components/ai/SimpleTextGenerator.tsx
import { useUnifiedAi } from "@/hooks/useUnifiedAi";

interface SimpleTextGeneratorProps {
  prompt: string;
  domain?: string;
  onResult?: (text: string) => void;
}

export function SimpleTextGenerator({
  prompt,
  domain,
  onResult,
}: SimpleTextGeneratorProps) {
  const { generateResponse, isLoading } = useUnifiedAi();

  const handleGenerate = async () => {
    const response = await generateResponse({
      prompt,
      context: { domain: domain || "general" },
    });

    if (response.success && onResult) {
      onResult(response.text);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={isLoading}>
      {isLoading ? "Generating..." : "Generate"}
    </button>
  );
}
```

### Pattern 2: Streaming Responses (Future)

```typescript
// components/ai/StreamingGenerator.tsx
import { useStreamingAi } from "@/hooks/useUnifiedAi";

export function StreamingGenerator() {
  const { startStreaming, streamedContent, isStreaming } = useStreamingAi();

  const handleStream = async () => {
    await startStreaming({
      prompt: "Write a long article about sustainable cooking",
      context: { domain: "culinary" },
    });
  };

  return (
    <div>
      <button onClick={handleStream} disabled={isStreaming}>
        {isStreaming ? "Streaming..." : "Start Stream"}
      </button>
      <div className="streaming-content">
        {streamedContent}
        {isStreaming && <span className="cursor">|</span>}
      </div>
    </div>
  );
}
```

### Pattern 3: Provider-Specific Features

```typescript
// components/ai/AdvancedGenerator.tsx
import { useUnifiedAi, useProviderManagement } from "@/hooks/useUnifiedAi";

export function AdvancedGenerator() {
  const { generateResponse } = useUnifiedAi();
  const { getProviderModels } = useProviderManagement();

  const generateWithVision = async (imageUrl: string, prompt: string) => {
    // This will automatically route to Bedrock or Google (vision-capable)
    const response = await generateResponse({
      prompt,
      context: {
        domain: "visual",
        requiresVision: true,
      },
      attachments: [{ type: "image", url: imageUrl }],
    });

    return response;
  };

  const generateWithTools = async (prompt: string) => {
    // This will route to providers that support tool calling
    const response = await generateResponse({
      prompt,
      context: { domain: "culinary" },
      tools: [
        {
          name: "search_recipes",
          description: "Search for recipes in database",
          parameters: {
            query: { type: "string" },
            cuisine: { type: "string", enum: ["italian", "german", "asian"] },
          },
        },
      ],
    });

    return response;
  };

  return <div>{/* Your UI components */}</div>;
}
```

---

## 🎛️ **Configuration Patterns**

### Environment-Specific Configuration

```typescript
// lib/ai-config.ts
import { UnifiedAiApiConfig } from "@/lib/ai-orchestrator/unified-ai-api";

const getAiConfig = (): Partial<UnifiedAiApiConfig> => {
  const env = process.env.NODE_ENV;

  const baseConfig = {
    enableCaching: true,
    enableMonitoring: true,
    enableFeatureFlags: true,
  };

  switch (env) {
    case "development":
      return {
        ...baseConfig,
        fallbackStrategy: "round-robin",
        maxRetries: 2,
        timeoutMs: 15000,
      };

    case "production":
      return {
        ...baseConfig,
        fallbackStrategy: "cost-optimized",
        maxRetries: 3,
        timeoutMs: 30000,
      };

    default:
      return baseConfig;
  }
};

export { getAiConfig };
```

### Feature-Specific Configuration

```typescript
// hooks/useRecipeAi.ts
import { useUnifiedAi } from "@/hooks/useUnifiedAi";

export function useRecipeAi() {
  return useUnifiedAi({
    enableAutoRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    onProviderSwitch: (from, to) => {
      console.log(`Recipe AI switched from ${from} to ${to}`);
    },
    onError: (error, context) => {
      // Log recipe generation errors
      console.error("Recipe generation failed:", error, context);
    },
  });
}

// hooks/useChatAi.ts
export function useChatAi() {
  return useUnifiedAi({
    enableAutoRetry: false, // Fast fail for chat
    maxRetries: 1,
    enableRealTimeMetrics: true,
  });
}
```

---

## 🔌 **Integration with Existing Components**

### Recipe Components

```typescript
// components/recipe/RecipeGenerator.tsx
import { useRecipeAi } from "@/hooks/useRecipeAi";
import { Recipe } from "@/types/recipe";

interface RecipeGeneratorProps {
  ingredients: string[];
  dietary?: string[];
  cuisine?: string;
  onRecipeGenerated: (recipe: Recipe) => void;
}

export function RecipeGenerator({
  ingredients,
  dietary,
  cuisine,
  onRecipeGenerated,
}: RecipeGeneratorProps) {
  const { generateResponse, isLoading, error } = useRecipeAi();

  const generateRecipe = async () => {
    const prompt = `
      Create a ${cuisine || "any"} recipe using: ${ingredients.join(", ")}
      Dietary restrictions: ${dietary?.join(", ") || "none"}
      
      Format as JSON with: title, ingredients, instructions, prep_time, cook_time, servings
    `;

    const response = await generateResponse({
      prompt,
      context: {
        domain: "culinary",
        locale: "de-DE",
        budgetTier: "standard",
        outputFormat: "json",
      },
    });

    if (response.success) {
      try {
        const recipe = JSON.parse(response.text) as Recipe;
        onRecipeGenerated(recipe);
      } catch (error) {
        console.error("Failed to parse recipe JSON:", error);
      }
    }
  };

  return (
    <div className="recipe-generator">
      <button
        onClick={generateRecipe}
        disabled={isLoading || ingredients.length === 0}
        className="generate-btn"
      >
        {isLoading ? "Generating Recipe..." : "Generate Recipe"}
      </button>

      {error && (
        <div className="error-message">
          Failed to generate recipe: {error.message}
        </div>
      )}
    </div>
  );
}
```

### Chat Components

```typescript
// components/chat/AiChatBot.tsx
import { useChatAi } from "@/hooks/useChatAi";
import { useState } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function AiChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { generateResponse, isLoading } = useChatAi();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const response = await generateResponse({
      prompt: `
        User: ${input}
        
        Previous conversation:
        ${messages
          .slice(-5)
          .map((m) => `${m.sender}: ${m.text}`)
          .join("\n")}
        
        Respond as a helpful cooking assistant.
      `,
      context: {
        domain: "culinary",
        conversational: true,
      },
    });

    if (response.success) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    }
  };

  return (
    <div className="chat-bot">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="text">{message.text}</div>
            <div className="timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai loading">
            <div className="text">Thinking...</div>
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask about cooking..."
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
```

---

## 📊 **Monitoring Integration**

### Custom Metrics Dashboard

```typescript
// components/admin/AiMetricsDashboard.tsx
import { useAiMetrics } from "@/hooks/useUnifiedAi";
import { UnifiedAiDashboard } from "@/components/ai/UnifiedAiDashboard";

export function AiMetricsDashboard() {
  const { metrics, health, isLoading, refreshMetrics } = useAiMetrics(5000); // 5s refresh

  return (
    <div className="ai-metrics-dashboard">
      <div className="metrics-summary">
        <div className="metric-card">
          <h3>Total Requests</h3>
          <div className="value">{metrics?.totalRequests || 0}</div>
        </div>

        <div className="metric-card">
          <h3>Success Rate</h3>
          <div className="value">
            {metrics
              ? Math.round(
                  (metrics.successfulRequests / metrics.totalRequests) * 100
                )
              : 0}
            %
          </div>
        </div>

        <div className="metric-card">
          <h3>Avg Latency</h3>
          <div className="value">
            {metrics ? Math.round(metrics.averageLatency) : 0}ms
          </div>
        </div>

        <div className="metric-card">
          <h3>Cost/Request</h3>
          <div className="value">
            €{metrics ? metrics.costPerRequest.toFixed(4) : "0.0000"}
          </div>
        </div>
      </div>

      <div className="provider-health">
        <h3>Provider Health</h3>
        {health.map((h) => (
          <div key={h.provider} className={`provider-status ${h.status}`}>
            <span className="provider-name">{h.provider}</span>
            <span className="status">{h.status}</span>
            <span className="latency">{Math.round(h.latency)}ms</span>
          </div>
        ))}
      </div>

      <UnifiedAiDashboard className="full-dashboard" />
    </div>
  );
}
```

### Error Tracking Integration

```typescript
// lib/ai-error-tracking.ts
import { useUnifiedAi } from "@/hooks/useUnifiedAi";

// Sentry integration example
import * as Sentry from "@sentry/nextjs";

export function useAiWithErrorTracking() {
  return useUnifiedAi({
    onError: (error, context) => {
      // Track AI errors in Sentry
      Sentry.captureException(error, {
        tags: {
          component: "unified-ai-api",
          domain: context.context?.domain,
        },
        extra: {
          prompt: context.prompt?.substring(0, 100), // First 100 chars
          context: context.context,
        },
      });
    },
    onProviderSwitch: (from, to) => {
      // Track provider switches
      Sentry.addBreadcrumb({
        message: `AI provider switched from ${from} to ${to}`,
        category: "ai-routing",
        level: "info",
      });
    },
  });
}
```

---

## 🧪 **Testing Integration**

### Component Testing

```typescript
// __tests__/components/RecipeGenerator.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecipeGenerator } from "@/components/recipe/RecipeGenerator";
import { useRecipeAi } from "@/hooks/useRecipeAi";

// Mock the AI hook
jest.mock("@/hooks/useRecipeAi");
const mockUseRecipeAi = useRecipeAi as jest.MockedFunction<typeof useRecipeAi>;

describe("RecipeGenerator", () => {
  const mockGenerateResponse = jest.fn();
  const mockOnRecipeGenerated = jest.fn();

  beforeEach(() => {
    mockUseRecipeAi.mockReturnValue({
      generateResponse: mockGenerateResponse,
      isLoading: false,
      error: null,
      response: null,
      // ... other properties
    });
  });

  it("should generate recipe when button clicked", async () => {
    mockGenerateResponse.mockResolvedValue({
      success: true,
      text: JSON.stringify({
        title: "Test Recipe",
        ingredients: ["ingredient1"],
        instructions: ["step1"],
      }),
    });

    render(
      <RecipeGenerator
        ingredients={["tomatoes", "pasta"]}
        onRecipeGenerated={mockOnRecipeGenerated}
      />
    );

    fireEvent.click(screen.getByText("Generate Recipe"));

    await waitFor(() => {
      expect(mockGenerateResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            domain: "culinary",
          }),
        })
      );
    });

    expect(mockOnRecipeGenerated).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Recipe",
      })
    );
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/ai-integration.test.ts
import { createUnifiedAiApi } from "@/lib/ai-orchestrator/unified-ai-api";
import { setupUnifiedAiMocks } from "@/lib/ai-orchestrator/test-mocks";

describe("AI Integration", () => {
  let api: ReturnType<typeof createUnifiedAiApi>;
  let mocks: ReturnType<typeof setupUnifiedAiMocks>;

  beforeEach(() => {
    mocks = setupUnifiedAiMocks();
    api = createUnifiedAiApi();

    // Inject mocks
    (api as any).multiProvider = mocks.multiProvider;
    (api as any).cache = mocks.cache;
    (api as any).monitor = mocks.monitor;
  });

  it("should handle recipe generation flow", async () => {
    mocks.multiProvider.routeRequest.mockResolvedValue({
      content: JSON.stringify({
        title: "Pasta with Tomatoes",
        ingredients: ["pasta", "tomatoes", "basil"],
        instructions: ["Boil pasta", "Add tomatoes", "Garnish with basil"],
      }),
      provider: "meta",
      success: true,
    });

    const response = await api.generateResponse({
      prompt: "Create a pasta recipe with tomatoes and basil",
      context: {
        domain: "culinary",
        outputFormat: "json",
      },
    });

    expect(response.success).toBe(true);
    expect(response.provider).toBe("meta");

    const recipe = JSON.parse(response.text);
    expect(recipe.title).toBe("Pasta with Tomatoes");
  });
});
```

---

## 🚀 **Deployment Integration**

### Environment Configuration

```bash
# .env.development
NODE_ENV=development
AWS_REGION=eu-central-1
GOOGLE_AI_API_KEY=dev-key
META_API_KEY=dev-key
EVIDENTLY_PROJECT=matbakh-ai-dev

# .env.production
NODE_ENV=production
AWS_REGION=eu-central-1
GOOGLE_AI_API_KEY=prod-key
META_API_KEY=prod-key
EVIDENTLY_PROJECT=matbakh-ai-prod
```

### Next.js Configuration

```typescript
// next.config.js
module.exports = {
  env: {
    UNIFIED_AI_ENABLED: process.env.UNIFIED_AI_ENABLED || "true",
  },
  // ... other config
};
```

### Feature Flag Integration

```typescript
// lib/feature-flags.ts
export const isUnifiedAiEnabled = () => {
  return process.env.UNIFIED_AI_ENABLED === "true";
};

// components/ConditionalAiFeature.tsx
import { isUnifiedAiEnabled } from "@/lib/feature-flags";
import { RecipeGenerator } from "@/components/recipe/RecipeGenerator";
import { LegacyRecipeGenerator } from "@/components/recipe/LegacyRecipeGenerator";

export function ConditionalAiFeature(props: any) {
  if (isUnifiedAiEnabled()) {
    return <RecipeGenerator {...props} />;
  }

  return <LegacyRecipeGenerator {...props} />;
}
```

---

## 📋 **Integration Checklist**

### Pre-Integration

- [ ] Review API documentation
- [ ] Set up environment variables
- [ ] Configure provider access (AWS, Google, Meta)
- [ ] Test connectivity to all providers

### During Integration

- [ ] Import required hooks and components
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Configure provider preferences
- [ ] Set up monitoring and logging

### Post-Integration

- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test error scenarios
- [ ] Validate performance metrics
- [ ] Document usage patterns

### Production Deployment

- [ ] Configure production environment
- [ ] Set up monitoring dashboards
- [ ] Configure alerts and notifications
- [ ] Test rollback procedures
- [ ] Train team on new features

---

## 🆘 **Support & Resources**

### Documentation

- **API Reference**: `docs/unified-ai-api-documentation.md`
- **Quick Reference**: `docs/unified-ai-api-quick-reference.md`
- **Test Examples**: `src/lib/ai-orchestrator/__tests__/`

### Team Support

- **Slack Channel**: #ai-integration
- **Code Reviews**: Tag @ai-team for reviews
- **Office Hours**: Tuesdays 2-4 PM for AI integration questions

### Troubleshooting

- **Common Issues**: See troubleshooting section in main docs
- **Debug Mode**: Set `DEBUG=unified-ai:*` for detailed logging
- **Health Checks**: Use `/providers/health` endpoint

---

**Happy Integrating!** 🚀

_This guide will be updated as new features and patterns emerge._
