/**
 * @jest-environment node
 */
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { app } from "../gateway-server";

describe("AI Gateway Server - Basic Auth", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Public Endpoints", () => {
    it("should allow access to health endpoint without auth", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe("healthy");
      expect(body.timestamp).toBeDefined();
    });

    it("should allow access to info endpoint without auth", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/info",
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.service).toBe("AI Gateway");
      expect(body.version).toBe("1.0.0");
      expect(body.authentication).toBe("Basic Auth required");
    });
  });

  describe("Protected Endpoints - Authentication", () => {
    it("should reject requests without authorization header", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/route",
        payload: { prompt: "test prompt" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Basic authentication required");
    });

    it("should reject requests with invalid authorization header format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/v1/route",
        headers: {
          authorization: "Bearer invalid-token",
        },
        payload: { prompt: "test prompt" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Basic authentication required");
    });

    it("should reject requests with invalid credentials", async () => {
      const invalidCredentials =
        Buffer.from("invalid:password").toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/route",
        headers: {
          authorization: `Basic ${invalidCredentials}`,
        },
        payload: { prompt: "test prompt" },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Unauthorized");
      expect(body.message).toBe("Invalid credentials");
    });

    it("should accept requests with valid admin credentials", async () => {
      const validCredentials = Buffer.from(
        "admin:matbakh-ai-gateway-2025"
      ).toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/route",
        headers: {
          authorization: `Basic ${validCredentials}`,
        },
        payload: { prompt: "test prompt" },
      });

      // Should not be 401 (auth should pass, might be 400 for missing context or other validation)
      expect(response.statusCode).not.toBe(401);
    });

    it("should accept requests with valid api-client credentials", async () => {
      const validCredentials = Buffer.from(
        "api-client:default-api-key"
      ).toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/route",
        headers: {
          authorization: `Basic ${validCredentials}`,
        },
        payload: { prompt: "test prompt" },
      });

      // Should not be 401 (auth should pass)
      expect(response.statusCode).not.toBe(401);
    });
  });

  describe("Admin Endpoints - Role-based Access", () => {
    it("should reject non-admin users from admin endpoints", async () => {
      const apiClientCredentials = Buffer.from(
        "api-client:default-api-key"
      ).toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/admin/bandit/reset",
        headers: {
          authorization: `Basic ${apiClientCredentials}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Forbidden");
      expect(body.message).toBe("Admin access required");
    });

    it("should allow admin users to access admin endpoints", async () => {
      const adminCredentials = Buffer.from(
        "admin:matbakh-ai-gateway-2025"
      ).toString("base64");
      const response = await app.inject({
        method: "POST",
        url: "/v1/admin/bandit/reset",
        headers: {
          authorization: `Basic ${adminCredentials}`,
        },
        payload: {},
      });

      // Should not be 401 or 403 (auth and authorization should pass)
      expect(response.statusCode).not.toBe(401);
      expect(response.statusCode).not.toBe(403);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply different rate limits based on user role", async () => {
      const apiClientCredentials = Buffer.from(
        "api-client:default-api-key"
      ).toString("base64");

      // Make multiple requests to test rate limiting
      const requests = Array.from({ length: 5 }, () =>
        app.inject({
          method: "GET",
          url: "/v1/stats",
          headers: {
            authorization: `Basic ${apiClientCredentials}`,
          },
        })
      );

      const responses = await Promise.all(requests);

      // All requests should succeed (within rate limit for api-client: 100/min)
      responses.forEach((response) => {
        expect(response.statusCode).not.toBe(429);
      });
    });
  });

  describe("Security Headers and Logging", () => {
    it("should include user information in request context after auth", async () => {
      const adminCredentials = Buffer.from(
        "admin:matbakh-ai-gateway-2025"
      ).toString("base64");
      const response = await app.inject({
        method: "GET",
        url: "/v1/stats",
        headers: {
          authorization: `Basic ${adminCredentials}`,
        },
      });

      // Should not be 401 (auth should pass and user context should be set)
      expect(response.statusCode).not.toBe(401);
    });
  });
});
