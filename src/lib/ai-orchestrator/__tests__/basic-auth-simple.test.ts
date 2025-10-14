/**
 * @jest-environment node
 */
import { describe, expect, it } from "@jest/globals";
import fastify from "fastify";

describe("Basic Auth Implementation - Simple Test", () => {
  // Create a simple test server with just the auth middleware
  const createTestServer = () => {
    const app = fastify({ logger: false });

    // Basic Auth configuration
    const BASIC_AUTH_USERS = new Map([
      ["admin", "matbakh-ai-gateway-2025"],
      ["api-client", "default-api-key"],
      ["monitoring", "monitoring-key"],
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
          return reply.status(401).send({
            error: "Unauthorized",
            message: "Invalid credentials",
          });
        }

        // Add user info to request for logging
        request.user = { username, role: getUserRole(username) };
      } catch (error) {
        return reply.status(401).send({
          error: "Unauthorized",
          message: "Invalid authorization header format",
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

    // Health check endpoint (no auth required)
    app.get("/health", async () => {
      return { status: "healthy", timestamp: new Date().toISOString() };
    });

    // Public info endpoint (no auth required)
    app.get("/info", async () => {
      return {
        service: "AI Gateway",
        version: "1.0.0",
        authentication: "Basic Auth required",
      };
    });

    // Protected endpoint (requires auth)
    app.post(
      "/v1/test",
      {
        preHandler: [basicAuthMiddleware],
      },
      async (request, reply) => {
        return {
          message: "Success",
          user: request.user,
          timestamp: new Date().toISOString(),
        };
      }
    );

    // Admin endpoint
    app.post(
      "/v1/admin/test",
      {
        preHandler: [adminAuthMiddleware],
      },
      async (request, reply) => {
        return {
          message: "Admin access granted",
          user: request.user,
          timestamp: new Date().toISOString(),
        };
      }
    );

    return app;
  };

  describe("Route Registration", () => {
    it("should register all expected routes", async () => {
      const app = createTestServer();
      await app.ready();

      // Verify routes are registered
      const routes = app.printRoutes();
      expect(routes).toContain("health (GET, HEAD)");
      expect(routes).toContain("info (GET, HEAD)");
      expect(routes).toContain("test (POST)");
      expect(routes).toContain("admin/test (POST)");

      await app.close();
    });
  });

  describe("Public Endpoints", () => {
    it("should allow access to health endpoint without auth", async () => {
      const app = createTestServer();
      await app.ready();

      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("healthy");
      expect(body.timestamp).toBeDefined();

      await app.close();
    });

    it("should allow access to info endpoint without auth", async () => {
      const app = createTestServer();
      await app.ready();

      const response = await app.inject({
        method: "GET",
        url: "/info",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.service).toBe("AI Gateway");
      expect(body.version).toBe("1.0.0");
      expect(body.authentication).toBe("Basic Auth required");

      await app.close();
    });
  });

  describe("Protected Endpoints - Authentication", () => {
    it("should reject requests without authorization header", async () => {
      const app = createTestServer();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/v1/test",
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Basic authentication required");

      await app.close();
    });

    it("should reject requests with invalid authorization header format", async () => {
      const app = createTestServer();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/v1/test",
        headers: {
          authorization: "Bearer invalid-token",
        },
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Basic authentication required");

      await app.close();
    });

    it("should reject requests with invalid credentials", async () => {
      const app = createTestServer();
      await app.ready();

      const invalidCredentials =
        Buffer.from("invalid:password").toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/test",
        headers: {
          authorization: `Basic ${invalidCredentials}`,
        },
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Invalid credentials");

      await app.close();
    });

    it("should accept requests with valid admin credentials", async () => {
      const app = createTestServer();
      await app.ready();

      const validCredentials = Buffer.from(
        "admin:matbakh-ai-gateway-2025"
      ).toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/test",
        headers: {
          authorization: `Basic ${validCredentials}`,
        },
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe("Success");
      expect(body.user.username).toBe("admin");
      expect(body.user.role).toBe("admin");

      await app.close();
    });

    it("should accept requests with valid api-client credentials", async () => {
      const app = createTestServer();
      await app.ready();

      const validCredentials = Buffer.from(
        "api-client:default-api-key"
      ).toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/test",
        headers: {
          authorization: `Basic ${validCredentials}`,
        },
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe("Success");
      expect(body.user.username).toBe("api-client");
      expect(body.user.role).toBe("api-client");

      await app.close();
    });
  });

  describe("Admin Endpoints - Role-based Access", () => {
    it("should reject non-admin users from admin endpoints", async () => {
      const app = createTestServer();
      await app.ready();

      const apiClientCredentials = Buffer.from(
        "api-client:default-api-key"
      ).toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/admin/test",
        headers: {
          authorization: `Basic ${apiClientCredentials}`,
        },
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Forbidden");
      expect(body.message).toBe("Admin access required");

      await app.close();
    });

    it("should allow admin users to access admin endpoints", async () => {
      const app = createTestServer();
      await app.ready();

      const adminCredentials = Buffer.from(
        "admin:matbakh-ai-gateway-2025"
      ).toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/admin/test",
        headers: {
          authorization: `Basic ${adminCredentials}`,
        },
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe("Admin access granted");
      expect(body.user.username).toBe("admin");
      expect(body.user.role).toBe("admin");

      await app.close();
    });
  });

  describe("Authentication Edge Cases", () => {
    it("should handle malformed base64 credentials", async () => {
      const app = createTestServer();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/v1/test",
        headers: {
          authorization: "Basic invalid-base64!",
        },
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Unauthorized");
      // Malformed base64 gets decoded but results in invalid credentials
      expect(body.message).toBe("Invalid credentials");

      await app.close();
    });

    it("should handle credentials without colon separator", async () => {
      const app = createTestServer();
      await app.ready();

      const malformedCredentials =
        Buffer.from("adminpassword").toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/test",
        headers: {
          authorization: `Basic ${malformedCredentials}`,
        },
        payload: { test: "data" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Invalid credentials");

      await app.close();
    });
  });
});
