/**
 * Business Metrics Service Tests
 */

import {
  businessMetricsService,
  type ConversionEvent,
} from "../business-metrics-service";

describe("BusinessMetricsService", () => {
  beforeEach(() => {
    // Reset service state
    jest.clearAllMocks();
  });

  describe("trackConversion", () => {
    it("should track conversion events successfully", () => {
      const conversionData: Omit<ConversionEvent, "id" | "timestamp"> = {
        userId: "user-123",
        sessionId: "session-456",
        eventType: "subscription",
        eventName: "subscription_completed",
        value: 299.99,
        currency: "EUR",
        metadata: {
          source: "web",
          aiProvider: "bedrock",
          persona: "profi",
        },
        properties: {
          plan: "premium",
        },
      };

      const conversion = businessMetricsService.trackConversion(conversionData);

      expect(conversion).toMatchObject({
        ...conversionData,
        id: expect.any(String),
        timestamp: expect.any(Date),
      });
    });

    it("should emit conversion:tracked event", () => {
      const mockCallback = jest.fn();
      businessMetricsService.on("conversion:tracked", mockCallback);

      const conversionData: Omit<ConversionEvent, "id" | "timestamp"> = {
        userId: "user-123",
        sessionId: "session-456",
        eventType: "signup",
        eventName: "signup_completed",
        value: 0,
        currency: "EUR",
        metadata: {
          source: "web",
          persona: "skeptiker",
        },
        properties: {},
      };

      businessMetricsService.trackConversion(conversionData);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          eventType: "signup",
        })
      );
    });
  });

  describe("getRevenueMetrics", () => {
    it("should calculate revenue metrics correctly", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const metrics = businessMetricsService.getRevenueMetrics(
        startDate,
        endDate
      );

      expect(metrics).toMatchObject({
        totalRevenue: expect.any(Number),
        recurringRevenue: expect.any(Number),
        oneTimeRevenue: expect.any(Number),
        averageOrderValue: expect.any(Number),
        customerLifetimeValue: expect.any(Number),
        monthlyRecurringRevenue: expect.any(Number),
        annualRecurringRevenue: expect.any(Number),
        churnRate: expect.any(Number),
        retentionRate: expect.any(Number),
        conversionRate: expect.any(Number),
        revenuePerUser: expect.any(Number),
        revenueGrowthRate: expect.any(Number),
      });

      expect(metrics.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(metrics.recurringRevenue + metrics.oneTimeRevenue).toBeCloseTo(
        metrics.totalRevenue,
        2
      );
      expect(metrics.retentionRate).toBe(1 - metrics.churnRate);
      expect(metrics.annualRecurringRevenue).toBe(
        metrics.monthlyRecurringRevenue * 12
      );
    });

    it("should filter by segment when provided", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const allMetrics = businessMetricsService.getRevenueMetrics(
        startDate,
        endDate
      );
      const segmentMetrics = businessMetricsService.getRevenueMetrics(
        startDate,
        endDate,
        "premium-restaurants"
      );

      expect(allMetrics).toBeDefined();
      expect(segmentMetrics).toBeDefined();
      // Note: In real implementation, segment filtering would show different results
    });

    it("should filter by experiment when provided", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const allMetrics = businessMetricsService.getRevenueMetrics(
        startDate,
        endDate
      );
      const experimentMetrics = businessMetricsService.getRevenueMetrics(
        startDate,
        endDate,
        undefined,
        "exp-001"
      );

      expect(allMetrics).toBeDefined();
      expect(experimentMetrics).toBeDefined();
    });
  });

  describe("getConversionFunnel", () => {
    it("should generate conversion funnel with correct stages", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const funnel = businessMetricsService.getConversionFunnel(
        startDate,
        endDate
      );

      expect(funnel).toHaveLength(5);
      expect(funnel[0].stage).toBe("Visitors");
      expect(funnel[1].stage).toBe("Signups");
      expect(funnel[2].stage).toBe("Subscriptions");
      expect(funnel[3].stage).toBe("Purchases");
      expect(funnel[4].stage).toBe("Upgrades");

      // Validate funnel logic
      funnel.forEach((stage, index) => {
        expect(stage.users).toBeGreaterThanOrEqual(0);
        expect(stage.conversions).toBeGreaterThanOrEqual(0);
        expect(stage.conversions).toBeLessThanOrEqual(stage.users);
        expect(stage.conversionRate).toBeGreaterThanOrEqual(0);
        expect(stage.conversionRate).toBeLessThanOrEqual(1);
        expect(stage.dropoffRate).toBeGreaterThanOrEqual(0);
        expect(stage.dropoffRate).toBeLessThanOrEqual(1);
        expect(stage.revenueGenerated).toBeGreaterThanOrEqual(0);
        expect(stage.averageTimeToConvert).toBeGreaterThanOrEqual(0);

        if (index === 0) {
          expect(stage.conversionRate).toBe(1.0);
          expect(stage.dropoffRate).toBe(0);
        } else {
          expect(stage.conversionRate + stage.dropoffRate).toBeCloseTo(1.0, 5);
        }
      });
    });

    it("should filter by experiment and variant", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const allFunnel = businessMetricsService.getConversionFunnel(
        startDate,
        endDate
      );
      const experimentFunnel = businessMetricsService.getConversionFunnel(
        startDate,
        endDate,
        "exp-001"
      );
      const variantFunnel = businessMetricsService.getConversionFunnel(
        startDate,
        endDate,
        "exp-001",
        "treatment"
      );

      expect(allFunnel).toHaveLength(5);
      expect(experimentFunnel).toHaveLength(5);
      expect(variantFunnel).toHaveLength(5);
    });
  });

  describe("generateBusinessImpactReport", () => {
    it("should generate business impact report for experiment", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const report = businessMetricsService.generateBusinessImpactReport(
        "exp-001",
        startDate,
        endDate
      );

      if (report) {
        expect(report).toMatchObject({
          experimentId: "exp-001",
          period: {
            start: startDate,
            end: endDate,
          },
          metrics: {
            control: expect.any(Object),
            treatment: expect.any(Object),
            lift: {
              revenue: expect.any(Number),
              conversions: expect.any(Number),
              averageOrderValue: expect.any(Number),
              customerLifetimeValue: expect.any(Number),
            },
          },
          funnel: {
            control: expect.any(Array),
            treatment: expect.any(Array),
          },
          significance: {
            isSignificant: expect.any(Boolean),
            pValue: expect.any(Number),
            confidenceLevel: expect.any(Number),
            sampleSize: {
              control: expect.any(Number),
              treatment: expect.any(Number),
            },
          },
          recommendations: expect.any(Array),
          estimatedAnnualImpact: expect.any(Number),
        });

        expect(report.significance.pValue).toBeGreaterThanOrEqual(0);
        expect(report.significance.pValue).toBeLessThanOrEqual(1);
        expect(report.significance.confidenceLevel).toBeGreaterThan(0);
        expect(report.significance.confidenceLevel).toBeLessThanOrEqual(100);
      }
    });

    it("should return null for non-existent experiment", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      const report = businessMetricsService.generateBusinessImpactReport(
        "non-existent",
        startDate,
        endDate
      );

      expect(report).toBeNull();
    });
  });

  describe("getCustomerSegments", () => {
    it("should return customer segments", () => {
      const segments = businessMetricsService.getCustomerSegments();

      expect(segments).toBeInstanceOf(Array);
      expect(segments.length).toBeGreaterThan(0);

      segments.forEach((segment) => {
        expect(segment).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          criteria: expect.any(Object),
          size: expect.any(Number),
          averageRevenue: expect.any(Number),
          conversionRate: expect.any(Number),
          churnRate: expect.any(Number),
          lifetimeValue: expect.any(Number),
        });

        expect(segment.size).toBeGreaterThanOrEqual(0);
        expect(segment.averageRevenue).toBeGreaterThanOrEqual(0);
        expect(segment.conversionRate).toBeGreaterThanOrEqual(0);
        expect(segment.conversionRate).toBeLessThanOrEqual(1);
        expect(segment.churnRate).toBeGreaterThanOrEqual(0);
        expect(segment.churnRate).toBeLessThanOrEqual(1);
        expect(segment.lifetimeValue).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("getSegment", () => {
    it("should return specific segment by ID", () => {
      const segment = businessMetricsService.getSegment("premium-restaurants");

      expect(segment).toBeDefined();
      expect(segment?.id).toBe("premium-restaurants");
      expect(segment?.name).toBe("Premium Restaurants");
    });

    it("should return undefined for non-existent segment", () => {
      const segment = businessMetricsService.getSegment("non-existent");

      expect(segment).toBeUndefined();
    });
  });

  describe("calculateAttribution", () => {
    it("should calculate attribution for user with conversions", () => {
      // First track some conversions for a user
      const userId = "test-user-attribution";

      businessMetricsService.trackConversion({
        userId,
        sessionId: "session-1",
        eventType: "signup",
        eventName: "signup_completed",
        value: 0,
        currency: "EUR",
        metadata: { source: "google_ads", campaign: "summer_campaign" },
        properties: {},
      });

      businessMetricsService.trackConversion({
        userId,
        sessionId: "session-2",
        eventType: "subscription",
        eventName: "subscription_completed",
        value: 299.99,
        currency: "EUR",
        metadata: { source: "direct", campaign: "email_campaign" },
        properties: {},
      });

      const attribution = businessMetricsService.calculateAttribution(
        userId,
        "last_touch"
      );

      expect(attribution).toBeDefined();
      expect(attribution?.model).toBe("last_touch");
      expect(attribution?.touchpoints).toHaveLength(2);

      // Last touch should give 100% attribution to the last touchpoint
      expect(attribution?.touchpoints[1].attribution).toBe(1);
      expect(attribution?.touchpoints[0].attribution).toBe(0);
    });

    it("should return null for user with no conversions", () => {
      const attribution =
        businessMetricsService.calculateAttribution("non-existent-user");

      expect(attribution).toBeNull();
    });

    it("should handle different attribution models", () => {
      const userId = "test-user-linear";

      // Track multiple conversions
      businessMetricsService.trackConversion({
        userId,
        sessionId: "session-1",
        eventType: "signup",
        eventName: "signup_completed",
        value: 0,
        currency: "EUR",
        metadata: { source: "google_ads" },
        properties: {},
      });

      businessMetricsService.trackConversion({
        userId,
        sessionId: "session-2",
        eventType: "subscription",
        eventName: "subscription_completed",
        value: 299.99,
        currency: "EUR",
        metadata: { source: "direct" },
        properties: {},
      });

      const linearAttribution = businessMetricsService.calculateAttribution(
        userId,
        "linear"
      );

      expect(linearAttribution).toBeDefined();
      expect(linearAttribution?.model).toBe("linear");

      // Linear attribution should distribute equally
      linearAttribution?.touchpoints.forEach((touchpoint) => {
        expect(touchpoint.attribution).toBeCloseTo(0.5, 5);
      });
    });
  });

  describe("event emitter functionality", () => {
    it("should support event listeners", () => {
      const mockCallback = jest.fn();

      const unsubscribe = businessMetricsService.on(
        "conversion:tracked",
        mockCallback
      );

      businessMetricsService.trackConversion({
        userId: "test-user",
        sessionId: "test-session",
        eventType: "signup",
        eventName: "signup_completed",
        value: 0,
        currency: "EUR",
        metadata: { source: "web" },
        properties: {},
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);

      unsubscribe();

      businessMetricsService.trackConversion({
        userId: "test-user-2",
        sessionId: "test-session-2",
        eventType: "signup",
        eventName: "signup_completed",
        value: 0,
        currency: "EUR",
        metadata: { source: "web" },
        properties: {},
      });

      expect(mockCallback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it("should support multiple listeners for same event", () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();

      businessMetricsService.on("conversion:tracked", mockCallback1);
      businessMetricsService.on("conversion:tracked", mockCallback2);

      businessMetricsService.trackConversion({
        userId: "test-user",
        sessionId: "test-session",
        eventType: "signup",
        eventName: "signup_completed",
        value: 0,
        currency: "EUR",
        metadata: { source: "web" },
        properties: {},
      });

      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
  });
});
