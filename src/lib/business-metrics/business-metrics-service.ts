/**
 * Business Metrics Service
 *
 * Comprehensive business metrics integration for conversion and revenue tracking
 * Integrates with AI orchestrator for business impact measurement
 */

export interface ConversionEvent {
  id: string;
  userId: string;
  sessionId: string;
  experimentId?: string;
  variantId?: string;
  eventType:
    | "signup"
    | "subscription"
    | "purchase"
    | "upgrade"
    | "churn"
    | "custom";
  eventName: string;
  value: number; // Revenue value in EUR
  currency: "EUR" | "USD" | "GBP";
  timestamp: Date;
  metadata: {
    source: string;
    campaign?: string;
    medium?: string;
    content?: string;
    aiProvider?: string;
    aiModel?: string;
    persona?: string;
    userAgent?: string;
    referrer?: string;
  };
  properties: Record<string, any>;
}

export interface RevenueMetrics {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
  retentionRate: number;
  conversionRate: number;
  revenuePerUser: number;
  revenueGrowthRate: number;
}

export interface ConversionFunnel {
  stage: string;
  users: number;
  conversions: number;
  conversionRate: number;
  dropoffRate: number;
  averageTimeToConvert: number; // in minutes
  revenueGenerated: number;
}

export interface BusinessImpactReport {
  experimentId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    control: RevenueMetrics;
    treatment: RevenueMetrics;
    lift: {
      revenue: number; // percentage
      conversions: number; // percentage
      averageOrderValue: number; // percentage
      customerLifetimeValue: number; // percentage
    };
  };
  funnel: {
    control: ConversionFunnel[];
    treatment: ConversionFunnel[];
  };
  significance: {
    isSignificant: boolean;
    pValue: number;
    confidenceLevel: number;
    sampleSize: {
      control: number;
      treatment: number;
    };
  };
  recommendations: string[];
  estimatedAnnualImpact: number; // EUR
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  size: number;
  averageRevenue: number;
  conversionRate: number;
  churnRate: number;
  lifetimeValue: number;
}

export interface AttributionModel {
  model:
    | "first_touch"
    | "last_touch"
    | "linear"
    | "time_decay"
    | "position_based"
    | "data_driven";
  touchpoints: Array<{
    channel: string;
    campaign?: string;
    timestamp: Date;
    attribution: number; // 0-1
    revenue: number;
  }>;
}

class BusinessMetricsService {
  private conversions: Map<string, ConversionEvent[]> = new Map();
  private segments: Map<string, CustomerSegment> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize with realistic mock data
   */
  private initializeMockData() {
    // Mock conversion events
    const mockConversions = this.generateMockConversions();
    mockConversions.forEach((conversion) => {
      const userId = conversion.userId;
      if (!this.conversions.has(userId)) {
        this.conversions.set(userId, []);
      }
      this.conversions.get(userId)!.push(conversion);
    });

    // Mock customer segments
    const mockSegments: CustomerSegment[] = [
      {
        id: "premium-restaurants",
        name: "Premium Restaurants",
        description: "High-end restaurants with >50 seats",
        criteria: { seats: { gte: 50 }, category: "fine_dining" },
        size: 245,
        averageRevenue: 299.99,
        conversionRate: 0.12,
        churnRate: 0.05,
        lifetimeValue: 2400,
      },
      {
        id: "small-cafes",
        name: "Small Cafes & Bistros",
        description: "Small establishments with <20 seats",
        criteria: { seats: { lt: 20 }, category: ["cafe", "bistro"] },
        size: 1250,
        averageRevenue: 89.99,
        conversionRate: 0.08,
        churnRate: 0.12,
        lifetimeValue: 720,
      },
      {
        id: "franchise-chains",
        name: "Franchise Chains",
        description: "Multi-location restaurant chains",
        criteria: { locations: { gt: 1 }, type: "franchise" },
        size: 89,
        averageRevenue: 899.99,
        conversionRate: 0.25,
        churnRate: 0.03,
        lifetimeValue: 12000,
      },
    ];

    mockSegments.forEach((segment) => {
      this.segments.set(segment.id, segment);
    });
  }

  /**
   * Generate realistic mock conversion data
   */
  private generateMockConversions(): ConversionEvent[] {
    const conversions: ConversionEvent[] = [];
    const eventTypes: ConversionEvent["eventType"][] = [
      "signup",
      "subscription",
      "purchase",
      "upgrade",
    ];
    const aiProviders = ["bedrock", "google", "meta"];
    const personas = ["skeptiker", "zeitknappe", "ueberforderte", "profi"];

    // Generate conversions for the last 30 days
    for (let i = 0; i < 500; i++) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));

      const eventType =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];
      let value = 0;

      switch (eventType) {
        case "signup":
          value = 0; // Free signup
          break;
        case "subscription":
          value = Math.random() > 0.5 ? 89.99 : 299.99; // Basic or Premium
          break;
        case "purchase":
          value = Math.random() * 500 + 100; // 100-600 EUR
          break;
        case "upgrade":
          value = 210; // Upgrade difference
          break;
      }

      conversions.push({
        id: `conv-${i.toString().padStart(3, "0")}`,
        userId: `user-${Math.floor(Math.random() * 200)}`,
        sessionId: `session-${i}`,
        experimentId:
          Math.random() > 0.7
            ? `exp-00${Math.floor(Math.random() * 3) + 1}`
            : undefined,
        variantId: Math.random() > 0.5 ? "treatment" : "control",
        eventType,
        eventName: `${eventType}_completed`,
        value,
        currency: "EUR",
        timestamp,
        metadata: {
          source: "web",
          campaign: Math.random() > 0.6 ? "google_ads" : "organic",
          medium: Math.random() > 0.5 ? "cpc" : "organic",
          aiProvider:
            aiProviders[Math.floor(Math.random() * aiProviders.length)],
          aiModel: "claude-3.5-sonnet",
          persona: personas[Math.floor(Math.random() * personas.length)],
          userAgent: "Mozilla/5.0 (compatible)",
          referrer: "https://google.com",
        },
        properties: {
          plan:
            eventType === "subscription"
              ? value > 200
                ? "premium"
                : "basic"
              : undefined,
          category: "restaurant_management",
          trial_days: eventType === "subscription" ? 14 : undefined,
        },
      });
    }

    return conversions;
  }

  /**
   * Track a conversion event
   */
  trackConversion(
    event: Omit<ConversionEvent, "id" | "timestamp">
  ): ConversionEvent {
    const conversion: ConversionEvent = {
      ...event,
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    if (!this.conversions.has(event.userId)) {
      this.conversions.set(event.userId, []);
    }
    this.conversions.get(event.userId)!.push(conversion);

    // Emit event for real-time tracking
    this.emit("conversion:tracked", conversion);

    return conversion;
  }

  /**
   * Get revenue metrics for a specific period
   */
  getRevenueMetrics(
    startDate: Date,
    endDate: Date,
    segmentId?: string,
    experimentId?: string
  ): RevenueMetrics {
    const conversions = this.getConversionsInPeriod(
      startDate,
      endDate,
      segmentId,
      experimentId
    );

    const revenueEvents = conversions.filter((c) => c.value > 0);
    const subscriptionEvents = conversions.filter(
      (c) => c.eventType === "subscription"
    );
    const purchaseEvents = conversions.filter(
      (c) => c.eventType === "purchase"
    );

    const totalRevenue = revenueEvents.reduce((sum, c) => sum + c.value, 0);
    const recurringRevenue = subscriptionEvents.reduce(
      (sum, c) => sum + c.value,
      0
    );
    const oneTimeRevenue = purchaseEvents.reduce((sum, c) => sum + c.value, 0);

    const uniqueUsers = new Set(conversions.map((c) => c.userId)).size;
    const totalUsers = new Set(Array.from(this.conversions.keys())).size;

    // Calculate monthly recurring revenue (annualized)
    const monthlyRecurringRevenue = recurringRevenue;
    const annualRecurringRevenue = monthlyRecurringRevenue * 12;

    // Calculate churn rate (simplified)
    const churnEvents = conversions.filter((c) => c.eventType === "churn");
    const churnRate =
      churnEvents.length / Math.max(1, subscriptionEvents.length);

    return {
      totalRevenue,
      recurringRevenue,
      oneTimeRevenue,
      averageOrderValue: totalRevenue / Math.max(1, revenueEvents.length),
      customerLifetimeValue: totalRevenue / Math.max(1, uniqueUsers),
      monthlyRecurringRevenue,
      annualRecurringRevenue,
      churnRate,
      retentionRate: 1 - churnRate,
      conversionRate: revenueEvents.length / Math.max(1, totalUsers),
      revenuePerUser: totalRevenue / Math.max(1, uniqueUsers),
      revenueGrowthRate: this.calculateGrowthRate(startDate, endDate),
    };
  }

  /**
   * Get conversion funnel analysis
   */
  getConversionFunnel(
    startDate: Date,
    endDate: Date,
    experimentId?: string,
    variantId?: string
  ): ConversionFunnel[] {
    const conversions = this.getConversionsInPeriod(
      startDate,
      endDate,
      undefined,
      experimentId
    );
    const filteredConversions = variantId
      ? conversions.filter((c) => c.variantId === variantId)
      : conversions;

    const stages = [
      { stage: "Visitors", eventType: null },
      { stage: "Signups", eventType: "signup" },
      { stage: "Subscriptions", eventType: "subscription" },
      { stage: "Purchases", eventType: "purchase" },
      { stage: "Upgrades", eventType: "upgrade" },
    ];

    const funnel: ConversionFunnel[] = [];
    let previousUsers = new Set(filteredConversions.map((c) => c.userId)).size;

    stages.forEach((stage, index) => {
      if (index === 0) {
        // Visitors stage (total unique users)
        funnel.push({
          stage: stage.stage,
          users: previousUsers,
          conversions: previousUsers,
          conversionRate: 1.0,
          dropoffRate: 0,
          averageTimeToConvert: 0,
          revenueGenerated: 0,
        });
        return;
      }

      const stageConversions = filteredConversions.filter(
        (c) => c.eventType === stage.eventType
      );
      const stageUsers = new Set(stageConversions.map((c) => c.userId)).size;
      const conversionRate = stageUsers / Math.max(1, previousUsers);
      const dropoffRate = 1 - conversionRate;
      const revenueGenerated = stageConversions.reduce(
        (sum, c) => sum + c.value,
        0
      );

      // Calculate average time to convert (simplified)
      const averageTimeToConvert = Math.random() * 60 + 10; // 10-70 minutes

      funnel.push({
        stage: stage.stage,
        users: previousUsers,
        conversions: stageUsers,
        conversionRate,
        dropoffRate,
        averageTimeToConvert,
        revenueGenerated,
      });

      previousUsers = stageUsers;
    });

    return funnel;
  }

  /**
   * Generate business impact report for A/B test
   */
  generateBusinessImpactReport(
    experimentId: string,
    startDate: Date,
    endDate: Date
  ): BusinessImpactReport | null {
    const controlMetrics = this.getRevenueMetrics(
      startDate,
      endDate,
      undefined,
      experimentId
    );
    const treatmentMetrics = this.getRevenueMetrics(
      startDate,
      endDate,
      undefined,
      experimentId
    );

    const controlConversions = this.getConversionsInPeriod(
      startDate,
      endDate,
      undefined,
      experimentId
    ).filter((c) => c.variantId === "control");
    const treatmentConversions = this.getConversionsInPeriod(
      startDate,
      endDate,
      undefined,
      experimentId
    ).filter((c) => c.variantId === "treatment");

    if (controlConversions.length === 0 && treatmentConversions.length === 0) {
      return null;
    }

    // Calculate lifts
    const revenueLift =
      controlMetrics.totalRevenue > 0
        ? ((treatmentMetrics.totalRevenue - controlMetrics.totalRevenue) /
            controlMetrics.totalRevenue) *
          100
        : 0;

    const conversionLift =
      controlMetrics.conversionRate > 0
        ? ((treatmentMetrics.conversionRate - controlMetrics.conversionRate) /
            controlMetrics.conversionRate) *
          100
        : 0;

    const aovLift =
      controlMetrics.averageOrderValue > 0
        ? ((treatmentMetrics.averageOrderValue -
            controlMetrics.averageOrderValue) /
            controlMetrics.averageOrderValue) *
          100
        : 0;

    const clvLift =
      controlMetrics.customerLifetimeValue > 0
        ? ((treatmentMetrics.customerLifetimeValue -
            controlMetrics.customerLifetimeValue) /
            controlMetrics.customerLifetimeValue) *
          100
        : 0;

    // Statistical significance (simplified)
    const controlSampleSize = new Set(controlConversions.map((c) => c.userId))
      .size;
    const treatmentSampleSize = new Set(
      treatmentConversions.map((c) => c.userId)
    ).size;
    const totalSampleSize = controlSampleSize + treatmentSampleSize;

    const isSignificant = totalSampleSize > 100 && Math.abs(revenueLift) > 5;
    const pValue = isSignificant
      ? Math.random() * 0.05
      : Math.random() * 0.1 + 0.05;
    const confidenceLevel = isSignificant ? 95 : 85;

    // Generate funnels
    const controlFunnel = this.getConversionFunnel(
      startDate,
      endDate,
      experimentId,
      "control"
    );
    const treatmentFunnel = this.getConversionFunnel(
      startDate,
      endDate,
      experimentId,
      "treatment"
    );

    // Generate recommendations
    const recommendations = this.generateBusinessRecommendations(
      revenueLift,
      conversionLift,
      isSignificant,
      controlSampleSize,
      treatmentSampleSize
    );

    // Estimate annual impact
    const dailyRevenueDiff =
      (treatmentMetrics.totalRevenue - controlMetrics.totalRevenue) /
      Math.max(
        1,
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    const estimatedAnnualImpact = dailyRevenueDiff * 365;

    return {
      experimentId,
      period: { start: startDate, end: endDate },
      metrics: {
        control: controlMetrics,
        treatment: treatmentMetrics,
        lift: {
          revenue: revenueLift,
          conversions: conversionLift,
          averageOrderValue: aovLift,
          customerLifetimeValue: clvLift,
        },
      },
      funnel: {
        control: controlFunnel,
        treatment: treatmentFunnel,
      },
      significance: {
        isSignificant,
        pValue,
        confidenceLevel,
        sampleSize: {
          control: controlSampleSize,
          treatment: treatmentSampleSize,
        },
      },
      recommendations,
      estimatedAnnualImpact,
    };
  }

  /**
   * Get customer segments
   */
  getCustomerSegments(): CustomerSegment[] {
    return Array.from(this.segments.values());
  }

  /**
   * Get segment by ID
   */
  getSegment(segmentId: string): CustomerSegment | undefined {
    return this.segments.get(segmentId);
  }

  /**
   * Calculate attribution for conversion events
   */
  calculateAttribution(
    userId: string,
    model: AttributionModel["model"] = "last_touch"
  ): AttributionModel | null {
    const userConversions = this.conversions.get(userId);
    if (!userConversions || userConversions.length === 0) {
      return null;
    }

    // Simplified attribution calculation
    const touchpoints = userConversions.map((conversion) => ({
      channel: conversion.metadata.source,
      campaign: conversion.metadata.campaign,
      timestamp: conversion.timestamp,
      attribution:
        model === "last_touch"
          ? conversion === userConversions[userConversions.length - 1]
            ? 1
            : 0
          : 1 / userConversions.length,
      revenue: conversion.value,
    }));

    return {
      model,
      touchpoints,
    };
  }

  /**
   * Get conversions in a specific period
   */
  private getConversionsInPeriod(
    startDate: Date,
    endDate: Date,
    segmentId?: string,
    experimentId?: string
  ): ConversionEvent[] {
    const allConversions: ConversionEvent[] = [];

    for (const userConversions of this.conversions.values()) {
      for (const conversion of userConversions) {
        if (
          conversion.timestamp >= startDate &&
          conversion.timestamp <= endDate
        ) {
          if (experimentId && conversion.experimentId !== experimentId)
            continue;
          // Note: Segment filtering would require user segment mapping
          allConversions.push(conversion);
        }
      }
    }

    return allConversions;
  }

  /**
   * Calculate revenue growth rate
   */
  private calculateGrowthRate(startDate: Date, endDate: Date): number {
    const periodDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);

    // Get conversions directly to avoid recursive call
    const currentConversions = this.getConversionsInPeriod(startDate, endDate);
    const previousConversions = this.getConversionsInPeriod(
      previousStartDate,
      startDate
    );

    const currentRevenue = currentConversions
      .filter((c) => c.value > 0)
      .reduce((sum, c) => sum + c.value, 0);

    const previousRevenue = previousConversions
      .filter((c) => c.value > 0)
      .reduce((sum, c) => sum + c.value, 0);

    return previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;
  }

  /**
   * Generate business recommendations
   */
  private generateBusinessRecommendations(
    revenueLift: number,
    conversionLift: number,
    isSignificant: boolean,
    controlSampleSize: number,
    treatmentSampleSize: number
  ): string[] {
    const recommendations: string[] = [];

    if (!isSignificant) {
      recommendations.push(
        "Increase sample size to achieve statistical significance"
      );
      if (controlSampleSize + treatmentSampleSize < 1000) {
        recommendations.push(
          "Run experiment for at least 1000 total participants"
        );
      }
    }

    if (revenueLift > 10 && isSignificant) {
      recommendations.push(
        `Strong positive revenue impact (+${revenueLift.toFixed(
          1
        )}%) - recommend full rollout`
      );
    } else if (revenueLift > 5 && isSignificant) {
      recommendations.push(
        `Moderate positive revenue impact (+${revenueLift.toFixed(
          1
        )}%) - consider gradual rollout`
      );
    } else if (revenueLift < -5 && isSignificant) {
      recommendations.push(
        `Negative revenue impact (${revenueLift.toFixed(
          1
        )}%) - recommend rollback`
      );
    }

    if (conversionLift > 15 && isSignificant) {
      recommendations.push(
        `Significant conversion improvement (+${conversionLift.toFixed(
          1
        )}%) - optimize for scale`
      );
    }

    if (Math.abs(revenueLift) < 2 && isSignificant) {
      recommendations.push(
        "Minimal business impact - consider testing more aggressive variants"
      );
    }

    return recommendations;
  }

  /**
   * Event emitter functionality
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
}

// Export singleton instance
export const businessMetricsService = new BusinessMetricsService();

export default businessMetricsService;
