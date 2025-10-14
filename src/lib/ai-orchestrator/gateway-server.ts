import fastify from "fastify";
import { AiRouterGateway } from "./ai-router-gateway";
import { BanditLogger, ThompsonBandit } from "./bandit-controller";
import { AiRequest, ModelSpec, RouterInputContext } from "./types";

const app = fastify({ logger: true });

// Basic Auth configuration
const BASIC_AUTH_USERS = new Map([
  ["admin", "matbakh-ai-gateway-2025"],
  ["api-client", process.env.AI_GATEWAY_API_KEY || "default-api-key"],
  ["monitoring", process.env.AI_GATEWAY_MONITORING_KEY || "monitoring-key"],
]);

// Helper function to determine user role
const getUserRole = (username: string): string => {
  switch (username) {
    case "admin":
      return "admin";
    case "monitoring":
      return "monitoring";
    default:
      return "api-client";
  }
};

// Rate limiting configuration per user role
const RATE_LIMITS = {
  admin: { requests: 1000, window: 60000 }, // 1000 requests per minute
  "api-client": { requests: 100, window: 60000 }, // 100 requests per minute
  monitoring: { requests: 500, window: 60000 }, // 500 requests per minute
};

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (username: string, role: string): boolean => {
  const limit =
    RATE_LIMITS[role as keyof typeof RATE_LIMITS] || RATE_LIMITS["api-client"];
  const now = Date.now();
  const key = `${username}:${Math.floor(now / limit.window)}`;

  const current = rateLimiter.get(key) || {
    count: 0,
    resetTime: now + limit.window,
  };

  if (current.count >= limit.requests) {
    return false;
  }

  current.count++;
  rateLimiter.set(key, current);

  // Cleanup old entries
  if (Math.random() < 0.01) {
    // 1% chance to cleanup
    for (const [k, v] of rateLimiter.entries()) {
      if (v.resetTime < now) {
        rateLimiter.delete(k);
      }
    }
  }

  return true;
};

// Basic Auth middleware
const basicAuthMiddleware = async (request: any, reply: any) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Basic authentication required",
    });
  }

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [username, password] = credentials.split(":");

    const expectedPassword = BASIC_AUTH_USERS.get(username);
    if (!expectedPassword || expectedPassword !== password) {
      app.log.warn(
        `Authentication failed for user: ${username}, endpoint: ${request.url}, IP: ${request.ip}`
      );
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    // Add user info to request for logging
    request.user = { username, role: getUserRole(username) };

    // Log successful authentication
    app.log.info(
      `Authentication successful for user: ${username}, role: ${getUserRole(
        username
      )}, endpoint: ${request.url}`
    );
  } catch (error) {
    return reply.status(401).send({
      error: "Unauthorized",
      message: "Invalid authorization header format",
    });
  }
};

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const user = request.user;
  if (!user) {
    return reply.status(401).send({ error: "Authentication required" });
  }

  if (!checkRateLimit(user.username, user.role)) {
    const limit =
      RATE_LIMITS[user.role as keyof typeof RATE_LIMITS] ||
      RATE_LIMITS["api-client"];
    app.log.warn(
      `Rate limit exceeded for user: ${user.username}, role: ${user.role}, endpoint: ${request.url}`
    );
    return reply.status(429).send({
      error: "Rate limit exceeded",
      message: `Maximum ${limit.requests} requests per ${
        limit.window / 1000
      } seconds`,
      retryAfter: Math.ceil(limit.window / 1000),
    });
  }
};

// Admin middleware for admin-only endpoints
const adminAuthMiddleware = async (request: any, reply: any) => {
  await basicAuthMiddleware(request, reply);
  if (reply.sent) return; // If basic auth failed, stop here

  if (request.user?.role !== "admin") {
    return reply.status(403).send({
      error: "Forbidden",
      message: "Admin access required",
    });
  }
};

// Model specifications with realistic capabilities
const MODELS: ModelSpec[] = [
  {
    provider: "bedrock",
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    capability: {
      contextTokens: 200000,
      supportsTools: true,
      supportsJson: true,
      supportsVision: true,
      defaultLatencyMs: 600,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
    },
  },
  {
    provider: "google",
    modelId: "gemini-1.5-pro",
    capability: {
      contextTokens: 1000000,
      supportsTools: true,
      supportsJson: true,
      supportsVision: true,
      defaultLatencyMs: 700,
      costPer1kInput: 0.002,
      costPer1kOutput: 0.01,
    },
  },
  {
    provider: "meta",
    modelId: "llama-3-70b",
    capability: {
      contextTokens: 32768,
      supportsTools: false,
      supportsJson: false,
      supportsVision: false,
      defaultLatencyMs: 800,
      costPer1kInput: 0.001,
      costPer1kOutput: 0.006,
    },
  },
];

// Initialize components
const router = new AiRouterGateway({
  models: MODELS,
  defaultTemperature: 0.2,
  enableCaching: true,
  enableMetrics: true,
});

const bandit = new ThompsonBandit();
const logger = new BanditLogger({
  project: process.env.EVIDENTLY_PROJECT || "matbakh-ai-development",
});

// Health check endpoint (no auth required)
app.get("/health", async () => {
  return { status: "healthy", timestamp: new Date().toISOString() };
});

// Public info endpoint (no auth required)
app.get("/info", async () => {
  return {
    service: "AI Gateway",
    version: "1.0.0",
    providers: ["bedrock", "google", "meta"],
    endpoints: ["/v1/route", "/v1/models", "/v1/stats"],
    authentication: "Basic Auth required",
  };
});

// Main routing endpoint (requires auth)
app.post(
  "/v1/route",
  {
    preHandler: [basicAuthMiddleware, rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { prompt, context, tools } = request.body as {
        prompt: string;
        context?: RouterInputContext;
        tools?: any[];
      };

      if (!prompt) {
        return reply.status(400).send({ error: "Prompt is required" });
      }

      // Enhance context with bandit choice
      const banditContext = {
        domain: context?.domain,
        budgetTier: context?.budgetTier,
        requireTools: context?.requireTools,
        userId: context?.userId,
      };

      const suggestedArm = bandit.choose(banditContext);

      // Create AI request
      const aiRequest: AiRequest = {
        prompt,
        context: {
          ...context,
          // Bias towards bandit suggestion but don't force it
          preferredProvider: suggestedArm,
        } as RouterInputContext,
        tools,
      };

      // Execute the request
      const response = await router.execute(aiRequest);

      // Determine success based on response quality
      const success =
        response.success &&
        response.latencyMs < (context?.slaMs || 2000) &&
        (response.text?.length || 0) > 10;

      // Record bandit outcome
      bandit.record(
        response.provider as any,
        success,
        response.costEuro,
        response.latencyMs,
        banditContext
      );

      // Log to Evidently
      await logger.logOutcome({
        userId: context?.userId,
        arm: response.provider as any,
        success,
        latencyMs: response.latencyMs,
        costEuro: response.costEuro,
        domain: context?.domain,
        budgetTier: context?.budgetTier,
        requireTools: context?.requireTools,
        requestId: response.requestId,
      });

      return reply.send(response);
    } catch (error) {
      app.log.error("Route request failed:", error);
      return reply.status(500).send({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get available models for a context (requires auth)
app.post(
  "/v1/models",
  {
    preHandler: [basicAuthMiddleware, rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { context } = request.body as { context?: RouterInputContext };
      const models = router.getAvailableModels(context || {});

      return reply.send({
        models: models.map((m) => ({
          provider: m.provider,
          modelId: m.modelId,
          capability: m.capability,
        })),
      });
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get models" });
    }
  }
);

// Get bandit statistics (requires auth)
app.get(
  "/v1/stats",
  {
    preHandler: [basicAuthMiddleware, rateLimitMiddleware],
  },
  async (request, reply) => {
    try {
      const { context } = request.query as { context?: string };
      let banditContext;

      if (context) {
        try {
          banditContext = JSON.parse(context);
        } catch {
          return reply.status(400).send({ error: "Invalid context JSON" });
        }
      }

      const stats = bandit.getStats(banditContext);
      const bestArm = bandit.getBestArm(banditContext);

      return reply.send({
        stats,
        bestArm,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({ error: "Failed to get stats" });
    }
  }
);

// Update model capabilities (admin endpoint)
app.post(
  "/v1/admin/models/:provider/:modelId/capability",
  {
    preHandler: [adminAuthMiddleware],
  },
  async (request, reply) => {
    try {
      const { provider, modelId } = request.params as {
        provider: string;
        modelId: string;
      };
      const updates = request.body as any;

      router.updateModelCapability(provider, modelId, updates);

      return reply.send({ success: true, message: "Model capability updated" });
    } catch (error) {
      return reply
        .status(500)
        .send({ error: "Failed to update model capability" });
    }
  }
);

// Reset bandit for a context (admin endpoint)
app.post(
  "/v1/admin/bandit/reset",
  {
    preHandler: [adminAuthMiddleware],
  },
  async (request, reply) => {
    try {
      const { context } = request.body as { context?: any };
      bandit.resetContext(context);

      return reply.send({ success: true, message: "Bandit context reset" });
    } catch (error) {
      return reply.status(500).send({ error: "Failed to reset bandit" });
    }
  }
);

// Streaming endpoint (placeholder, requires auth)
app.post(
  "/v1/stream",
  {
    preHandler: [basicAuthMiddleware, rateLimitMiddleware],
  },
  async (request, reply) => {
    // TODO: Implement streaming support
    return reply.status(501).send({ error: "Streaming not yet implemented" });
  }
);

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send({ error: "Internal server error" });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "8080");
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });
    app.log.info(`AI Gateway server listening on ${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  app.log.info("Received SIGTERM, shutting down gracefully");
  await app.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  app.log.info("Received SIGINT, shutting down gracefully");
  await app.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

export { app, bandit, logger, router };
