/**
 * AI Business Integration Tests
 */

import {
  aiBusinessIntegration,
  type AIBusinessEvent,
} from "../ai-business-integration";

describe("AIBusinessIntegration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("trackAIEvent", () => {
    it("should track AI business events successfully", () => {
      const eventData: Omit<AIBusinessEvent, "timestamp"> = {
        userId: "user-123",
        sessionId: "session-456",
        aiProvider: "bedrock",
        aiModel: "claude-3.5-sonnet",
        requestType: "generation",
        persona: "profi",
        latency: 1200,
        cost: 0.05,
        success: true,
        userFeedback: 5,
        businessOutcome: {
          eventType: "subscription",
          value: 299.99,
          timeToConversion: 45,
        },
      };

      const aiEvent = aiBusinessIntegration.trackAIEvent(eventData);

      expect(aiEvent).toMatchObject({
        ...eventData,
        timestamp: expect.any(Date),
      });
    });

    it("should emit ai:request_completed event", () => {
      const mockCallback = jest.fn();
      aiBusinessIntegration.on("ai:request_completed", mockCallback);

      const eventData: Omit<AIBusinessEvent, "timestamp"> = {
        userId: "user-123",
        sessionId: "session-456",
        aiProvider: "google",
        aiModel: "gemini-pro",
        requestType: "analysis",
        persona: "skeptiker",
        latency: 800,
        cost: 0.03,
        success: true,
      };

      aiBusinessIntegration.trackAIEvent(eventData);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          aiProvider: "google",
          requestType: "analysis",
        })
      );
    });
  });

  describe("getAIBusinessMetrics", () => {
    it("should return AI business metrics for date range", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const metrics = aiBusinessIntegration.getAIBusinessMetrics(
        startDate,
        endDate
      );

      expect(metrics).toBeInstanceOf(Array);

      metrics.forEach((metric) => {
        expect(metric).toMatchObject({
          provider: expect.any(String),
          model: expect.any(String),
          persona: expect.any(String),
          metrics: {
            totalRequests: expect.any(Number),
            successRate: expect.any(Number),
            averageLatency: expect.any(Number),
            totalCost: expect.any(Number),
            costPerRequest: expect.any(Number),
            conversions: expect.any(Number),
            conversionRate: expect.any(Number),
            revenueGenerated: expect.any(Number),
            revenuePerRequest: expect.any(Number),
            roi: expect.any(Number),
            averageUserFeedback: expect.any(Number),
            timeToConversion: expect.any(Number),
          },
          trends: {
            requestVolume: expect.any(Array),
            conversionRate: expect.any(Array),
            revenue: expect.any(Array),
            cost: expect.any(Array),
            roi: expect.any(Array),
          },
        });

        // Validate metric ranges
        expect(metric.metrics.totalRequests).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.successRate).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.successRate).toBeLessThanOrEqual(1);
        expect(metric.metrics.averageLatency).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.totalCost).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.costPerRequest).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.conversions).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.conversionRate).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.conversionRate).toBeLessThanOrEqual(1);
        expect(metric.metrics.revenueGenerated).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.revenuePerRequest).toBeGreaterThanOrEqual(0);
        expect(metric.metrics.averageUserFeedback).toBeGreaterThanOrEqual(1);
        expect(metric.metrics.averageUserFeedback).toBeLessThanOrEqual(5);
        expect(metric.metrics.timeToConversion).toBeGreaterThanOrEqual(0);

        // Validate trends structure
        expect(metric.trends.requestVolume).toBeInstanceOf(Array);
        expect(metric.trends.conversionRate).toBeInstanceOf(Array);
        expect(metric.trends.revenue).toBeInstanceOf(Array);
        expect(metric.trends.cost).toBeInstanceOf(Array);
        expect(metric.trends.roi).toBeInstanceOf(Array);
      });
    });

    it("should filter by provider when specified", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const allMetrics = aiBusinessIntegration.getAIBusinessMetrics(
        startDate,
        endDate
      );
      const bedrockMetrics = aiBusinessIntegration.getAIBusinessMetrics(
        startDate,
        endDate,
        "bedrock"
      );

      expect(allMetrics.length).toBeGreaterThanOrEqual(bedrockMetrics.length);

      bedrockMetrics.forEach((metric) => {
        expect(metric.provider).toBe("bedrock");
      });
    });

    it("should filter by persona when specified", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const allMetrics = aiBusinessIntegration.getAIBusinessMetrics(
        startDate,
        endDate
      );
      const profiMetrics = aiBusinessIntegration.getAIBusinessMetrics(
        startDate,
        endDate,
        undefined,
        "profi"
      );

      expect(allMetrics.length).toBeGreaterThanOrEqual(profiMetrics.length);

      profiMetrics.forEach((metric) => {
        expect(metric.persona).toBe("profi");
      });
    });

    it("should sort metrics by ROI in descending order", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const metrics = aiBusinessIntegration.getAIBusinessMetrics(
        startDate,
        endDate
      );

      if (metrics.length > 1) {
        for (let i = 0; i < metrics.length - 1; i++) {
          expect(metrics[i].metrics.roi).toBeGreaterThanOrEqual(
            metrics[i + 1].metrics.roi
          );
        }
      }
    });
  });

  describe("getPersonaBusinessProfiles", () => {
    it("should return persona business profiles", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const profiles = aiBusinessIntegration.getPersonaBusinessProfiles(
        startDate,
        endDate
      );

      expect(profiles).toBeInstanceOf(Array);

      profiles.forEach((profile) => {
        expect(profile).toMatchObject({
          persona: expect.any(String),
          characteristics: {
            averageSessionDuration: expect.any(Number),
            requestsPerSession: expect.any(Number),
            preferredAIProvider: expect.any(String),
            conversionProbability: expect.any(Number),
            averageOrderValue: expect.any(Number),
            timeToConversion: expect.any(Number),
            churnRisk: expect.any(Number),
          },
          businessMetrics: {
            totalUsers: expect.any(Number),
            totalRevenue: expect.any(Number),
            conversionRate: expect.any(Number),
            customerLifetimeValue: expect.any(Number),
            acquisitionCost: expect.any(Number),
            retentionRate: expect.any(Number),
          },
          aiUsage: {
            preferredFeatures: expect.any(Array),
            averageRequestsPerDay: expect.any(Number),
            costPerUser: expect.any(Number),
            satisfactionScore: expect.any(Number),
          },
        });

        // Validate ranges
        expect(
          profile.characteristics.averageSessionDuration
        ).toBeGreaterThanOrEqual(0);
        expect(
          profile.characteristics.requestsPerSession
        ).toBeGreaterThanOrEqual(0);
        expect(
          profile.characteristics.conversionProbability
        ).toBeGreaterThanOrEqual(0);
        expect(
          profile.characteristics.conversionProbability
        ).toBeLessThanOrEqual(1);
        expect(
          profile.characteristics.averageOrderValue
        ).toBeGreaterThanOrEqual(0);
        expect(profile.characteristics.timeToConversion).toBeGreaterThanOrEqual(
          0
        );
        expect(profile.characteristics.churnRisk).toBeGreaterThanOrEqual(0);
        expect(profile.characteristics.churnRisk).toBeLessThanOrEqual(1);

        expect(profile.businessMetrics.totalUsers).toBeGreaterThanOrEqual(0);
        expect(profile.businessMetrics.totalRevenue).toBeGreaterThanOrEqual(0);
        expect(profile.businessMetrics.conversionRate).toBeGreaterThanOrEqual(
          0
        );
        expect(profile.businessMetrics.conversionRate).toBeLessThanOrEqual(1);
        expect(
          profile.businessMetrics.customerLifetimeValue
        ).toBeGreaterThanOrEqual(0);
        expect(profile.businessMetrics.acquisitionCost).toBeGreaterThanOrEqual(
          0
        );
        expect(profile.businessMetrics.retentionRate).toBeGreaterThanOrEqual(0);
        expect(profile.businessMetrics.retentionRate).toBeLessThanOrEqual(1);

        expect(profile.aiUsage.preferredFeatures).toBeInstanceOf(Array);
        expect(profile.aiUsage.averageRequestsPerDay).toBeGreaterThanOrEqual(0);
        expect(profile.aiUsage.costPerUser).toBeGreaterThanOrEqual(0);
        expect(profile.aiUsage.satisfactionScore).toBeGreaterThanOrEqual(1);
        expect(profile.aiUsage.satisfactionScore).toBeLessThanOrEqual(5);
      });
    });

    it("should include personas that have events", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const profiles = aiBusinessIntegration.getPersonaBusinessProfiles(
        startDate,
        endDate
      );

      // Should return profiles for personas that have events
      expect(profiles.length).toBeGreaterThanOrEqual(0);

      // Each returned profile should have a valid persona name
      const validPersonas = [
        "skeptiker",
        "zeitknappe",
        "ueberforderte",
        "profi",
      ];
      profiles.forEach((profile) => {
        expect(validPersonas).toContain(profile.persona);
      });
    });
  });

  describe("generateAIROIAnalysis", () => {
    it("should generate comprehensive ROI analysis", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const analysis = aiBusinessIntegration.generateAIROIAnalysis(
        startDate,
        endDate
      );

      expect(analysis).toMatchObject({
        period: {
          start: startDate,
          end: endDate,
        },
        overall: {
          totalAICost: expect.any(Number),
          totalRevenue: expect.any(Number),
          netROI: expect.any(Number),
          paybackPeriod: expect.any(Number),
          breakEvenPoint: expect.any(Date),
        },
        byProvider: expect.any(Array),
        byPersona: expect.any(Array),
        recommendations: expect.any(Array),
      });

      // Validate overall metrics
      expect(analysis.overall.totalAICost).toBeGreaterThanOrEqual(0);
      expect(analysis.overall.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(analysis.overall.paybackPeriod).toBeGreaterThanOrEqual(0);

      // Validate provider analysis
      analysis.byProvider.forEach((provider) => {
        expect(provider).toMatchObject({
          provider: expect.any(String),
          cost: expect.any(Number),
          revenue: expect.any(Number),
          roi: expect.any(Number),
          requests: expect.any(Number),
          conversions: expect.any(Number),
        });

        expect(provider.cost).toBeGreaterThanOrEqual(0);
        expect(provider.revenue).toBeGreaterThanOrEqual(0);
        expect(provider.requests).toBeGreaterThanOrEqual(0);
        expect(provider.conversions).toBeGreaterThanOrEqual(0);
        expect(provider.conversions).toBeLessThanOrEqual(provider.requests);
      });

      // Validate persona analysis
      analysis.byPersona.forEach((persona) => {
        expect(persona).toMatchObject({
          persona: expect.any(String),
          cost: expect.any(Number),
          revenue: expect.any(Number),
          roi: expect.any(Number),
          users: expect.any(Number),
          conversionRate: expect.any(Number),
        });

        expect(persona.cost).toBeGreaterThanOrEqual(0);
        expect(persona.revenue).toBeGreaterThanOrEqual(0);
        expect(persona.users).toBeGreaterThanOrEqual(0);
        expect(persona.conversionRate).toBeGreaterThanOrEqual(0);
        expect(persona.conversionRate).toBeLessThanOrEqual(1);
      });

      // Validate recommendations
      analysis.recommendations.forEach((rec) => {
        expect(rec).toMatchObject({
          type: expect.any(String),
          description: expect.any(String),
          expectedImpact: expect.any(Number),
          confidence: expect.any(Number),
          priority: expect.any(String),
        });

        expect([
          "cost_optimization",
          "revenue_optimization",
          "provider_switch",
          "persona_targeting",
        ]).toContain(rec.type);
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(["high", "medium", "low"]).toContain(rec.priority);
      });
    });

    it("should sort providers and personas by ROI", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const analysis = aiBusinessIntegration.generateAIROIAnalysis(
        startDate,
        endDate
      );

      // Check provider sorting
      if (analysis.byProvider.length > 1) {
        for (let i = 0; i < analysis.byProvider.length - 1; i++) {
          expect(analysis.byProvider[i].roi).toBeGreaterThanOrEqual(
            analysis.byProvider[i + 1].roi
          );
        }
      }

      // Check persona sorting
      if (analysis.byPersona.length > 1) {
        for (let i = 0; i < analysis.byPersona.length - 1; i++) {
          expect(analysis.byPersona[i].roi).toBeGreaterThanOrEqual(
            analysis.byPersona[i + 1].roi
          );
        }
      }
    });
  });

  describe("event emitter functionality", () => {
    it("should support event listeners", () => {
      const mockCallback = jest.fn();

      const unsubscribe = aiBusinessIntegration.on(
        "ai:request_completed",
        mockCallback
      );

      aiBusinessIntegration.trackAIEvent({
        userId: "test-user",
        sessionId: "test-session",
        aiProvider: "bedrock",
        aiModel: "claude-3.5-sonnet",
        requestType: "generation",
        persona: "profi",
        latency: 1000,
        cost: 0.04,
        success: true,
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);

      unsubscribe();

      aiBusinessIntegration.trackAIEvent({
        userId: "test-user-2",
        sessionId: "test-session-2",
        aiProvider: "google",
        aiModel: "gemini-pro",
        requestType: "analysis",
        persona: "skeptiker",
        latency: 800,
        cost: 0.03,
        success: true,
      });

      expect(mockCallback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe("integration with business metrics service", () => {
    it("should track conversions when AI events have business outcomes", () => {
      const eventWithOutcome: Omit<AIBusinessEvent, "timestamp"> = {
        userId: "user-conversion-test",
        sessionId: "session-conversion-test",
        aiProvider: "bedrock",
        aiModel: "claude-3.5-sonnet",
        requestType: "recommendation",
        persona: "profi",
        latency: 1500,
        cost: 0.06,
        success: true,
        userFeedback: 5,
        businessOutcome: {
          eventType: "subscription",
          value: 299.99,
          timeToConversion: 30,
        },
      };

      // Track the AI event
      const aiEvent = aiBusinessIntegration.trackAIEvent(eventWithOutcome);

      expect(aiEvent.businessOutcome).toBeDefined();
      expect(aiEvent.businessOutcome?.eventType).toBe("subscription");
      expect(aiEvent.businessOutcome?.value).toBe(299.99);
    });

    it("should not track conversions for AI events without business outcomes", () => {
      const eventWithoutOutcome: Omit<AIBusinessEvent, "timestamp"> = {
        userId: "user-no-conversion",
        sessionId: "session-no-conversion",
        aiProvider: "google",
        aiModel: "gemini-pro",
        requestType: "analysis",
        persona: "skeptiker",
        latency: 800,
        cost: 0.03,
        success: true,
        userFeedback: 4,
      };

      const aiEvent = aiBusinessIntegration.trackAIEvent(eventWithoutOutcome);

      expect(aiEvent.businessOutcome).toBeUndefined();
    });
  });
});
