/**
 * AI Business Integration
 *
 * Integrates business metrics with AI orchestrator for comprehensive impact tracking
 */

import {
  businessMetricsService,
  type ConversionEvent,
} from "./business-metrics-service";

export interface AIBusinessEvent {
  userId: string;
  sessionId: string;
  aiProvider: "bedrock" | "google" | "meta";
  aiModel: string;
  requestType: "generation" | "analysis" | "recommendation" | "optimization";
  persona: "skeptiker" | "zeitknappe" | "ueberforderte" | "profi";
  experimentId?: string;
  variantId?: string;
  timestamp: Date;
  latency: number; // ms
  cost: number; // EUR
  success: boolean;
  userFeedback?: number; // 1-5 rating
  businessOutcome?: {
    eventType: ConversionEvent["eventType"];
    value: number;
    timeToConversion?: number; // minutes after AI interaction
  };
}

export interface AIBusinessMetrics {
  provider: string;
  model: string;
  persona: string;
  metrics: {
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    totalCost: number;
    costPerRequest: number;
    conversions: number;
    conversionRate: number;
    revenueGenerated: number;
    revenuePerRequest: number;
    roi: number; // (revenue - cost) / cost
    averageUserFeedback: number;
    timeToConversion: number; // average minutes
  };
  trends: {
    requestVolume: Array<{ date: Date; count: number }>;
    conversionRate: Array<{ date: Date; rate: number }>;
    revenue: Array<{ date: Date; amount: number }>;
    cost: Array<{ date: Date; amount: number }>;
    roi: Array<{ date: Date; value: number }>;
  };
}

export interface PersonaBusinessProfile {
  persona: string;
  characteristics: {
    averageSessionDuration: number; // minutes
    requestsPerSession: number;
    preferredAIProvider: string;
    conversionProbability: number;
    averageOrderValue: number;
    timeToConversion: number; // minutes
    churnRisk: number; // 0-1
  };
  businessMetrics: {
    totalUsers: number;
    totalRevenue: number;
    conversionRate: number;
    customerLifetimeValue: number;
    acquisitionCost: number;
    retentionRate: number;
  };
  aiUsage: {
    preferredFeatures: string[];
    averageRequestsPerDay: number;
    costPerUser: number;
    satisfactionScore: number;
  };
}

export interface AIROIAnalysis {
  period: {
    start: Date;
    end: Date;
  };
  overall: {
    totalAICost: number;
    totalRevenue: number;
    netROI: number;
    paybackPeriod: number; // days
    breakEvenPoint: Date;
  };
  byProvider: Array<{
    provider: string;
    cost: number;
    revenue: number;
    roi: number;
    requests: number;
    conversions: number;
  }>;
  byPersona: Array<{
    persona: string;
    cost: number;
    revenue: number;
    roi: number;
    users: number;
    conversionRate: number;
  }>;
  recommendations: Array<{
    type:
      | "cost_optimization"
      | "revenue_optimization"
      | "provider_switch"
      | "persona_targeting";
    description: string;
    expectedImpact: number; // EUR
    confidence: number; // 0-1
    priority: "high" | "medium" | "low";
  }>;
}

class AIBusinessIntegration {
  private aiEvents: AIBusinessEvent[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeMockData();
    this.setupBusinessMetricsIntegration();
  }

  /**
   * Initialize with mock AI business events
   */
  private initializeMockData() {
    const providers: AIBusinessEvent["aiProvider"][] = [
      "bedrock",
      "google",
      "meta",
    ];
    const personas: AIBusinessEvent["persona"][] = [
      "skeptiker",
      "zeitknappe",
      "ueberforderte",
      "profi",
    ];
    const requestTypes: AIBusinessEvent["requestType"][] = [
      "generation",
      "analysis",
      "recommendation",
      "optimization",
    ];

    // Generate mock events for the last 30 days
    for (let i = 0; i < 1000; i++) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));

      const provider = providers[Math.floor(Math.random() * providers.length)];
      const persona = personas[Math.floor(Math.random() * personas.length)];
      const requestType =
        requestTypes[Math.floor(Math.random() * requestTypes.length)];

      const success = Math.random() > 0.05; // 95% success rate
      const latency = Math.random() * 2000 + 200; // 200-2200ms
      const cost = this.calculateAICost(provider, requestType, latency);

      // Business outcome (conversion) happens in ~10% of successful AI interactions
      let businessOutcome: AIBusinessEvent["businessOutcome"] | undefined;
      if (success && Math.random() < 0.1) {
        const eventTypes: ConversionEvent["eventType"][] = [
          "signup",
          "subscription",
          "purchase",
          "upgrade",
        ];
        const eventType =
          eventTypes[Math.floor(Math.random() * eventTypes.length)];
        let value = 0;

        switch (eventType) {
          case "signup":
            value = 0;
            break;
          case "subscription":
            value = persona === "profi" ? 299.99 : 89.99;
            break;
          case "purchase":
            value = Math.random() * 500 + 100;
            break;
          case "upgrade":
            value = 210;
            break;
        }

        businessOutcome = {
          eventType,
          value,
          timeToConversion: Math.random() * 120 + 5, // 5-125 minutes
        };
      }

      this.aiEvents.push({
        userId: `user-${Math.floor(Math.random() * 200)}`,
        sessionId: `session-${i}`,
        aiProvider: provider,
        aiModel: this.getModelForProvider(provider),
        requestType,
        persona,
        experimentId:
          Math.random() > 0.7
            ? `exp-00${Math.floor(Math.random() * 3) + 1}`
            : undefined,
        variantId: Math.random() > 0.5 ? "treatment" : "control",
        timestamp,
        latency,
        cost,
        success,
        userFeedback: success
          ? Math.floor(Math.random() * 2) + 4
          : Math.floor(Math.random() * 3) + 1, // 4-5 for success, 1-3 for failure
        businessOutcome,
      });
    }
  }

  /**
   * Setup integration with business metrics service
   */
  private setupBusinessMetricsIntegration() {
    // Listen for AI events and track corresponding business metrics
    this.on("ai:request_completed", (event: AIBusinessEvent) => {
      if (event.businessOutcome) {
        // Track conversion in business metrics service
        businessMetricsService.trackConversion({
          userId: event.userId,
          sessionId: event.sessionId,
          experimentId: event.experimentId,
          variantId: event.variantId,
          eventType: event.businessOutcome.eventType,
          eventName: `${event.businessOutcome.eventType}_from_ai`,
          value: event.businessOutcome.value,
          currency: "EUR",
          metadata: {
            source: "ai_interaction",
            aiProvider: event.aiProvider,
            aiModel: event.aiModel,
            persona: event.persona,
            requestType: event.requestType,
            latency: event.latency.toString(),
            userFeedback: event.userFeedback?.toString() || "",
            timeToConversion:
              event.businessOutcome.timeToConversion?.toString() || "",
          },
          properties: {
            ai_cost: event.cost,
            ai_success: event.success,
            ai_latency: event.latency,
          },
        });
      }
    });
  }

  /**
   * Track AI business event
   */
  trackAIEvent(event: Omit<AIBusinessEvent, "timestamp">): AIBusinessEvent {
    const aiEvent: AIBusinessEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.aiEvents.push(aiEvent);
    this.emit("ai:request_completed", aiEvent);

    return aiEvent;
  }

  /**
   * Get AI business metrics for a specific period
   */
  getAIBusinessMetrics(
    startDate: Date,
    endDate: Date,
    provider?: string,
    persona?: string
  ): AIBusinessMetrics[] {
    const filteredEvents = this.aiEvents.filter((event) => {
      if (event.timestamp < startDate || event.timestamp > endDate)
        return false;
      if (provider && event.aiProvider !== provider) return false;
      if (persona && event.persona !== persona) return false;
      return true;
    });

    // Group by provider, model, and persona
    const groups = new Map<string, AIBusinessEvent[]>();

    filteredEvents.forEach((event) => {
      const key = `${event.aiProvider}-${event.aiModel}-${event.persona}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(event);
    });

    const metrics: AIBusinessMetrics[] = [];

    for (const [key, events] of groups) {
      const [provider, model, persona] = key.split("-");

      const totalRequests = events.length;
      const successfulRequests = events.filter((e) => e.success);
      const conversions = events.filter((e) => e.businessOutcome);
      const totalCost = events.reduce((sum, e) => sum + e.cost, 0);
      const totalRevenue = conversions.reduce(
        (sum, e) => sum + (e.businessOutcome?.value || 0),
        0
      );
      const feedbackEvents = events.filter((e) => e.userFeedback);
      const conversionTimes = conversions.filter(
        (e) => e.businessOutcome?.timeToConversion
      );

      metrics.push({
        provider,
        model,
        persona,
        metrics: {
          totalRequests,
          successRate: successfulRequests.length / totalRequests,
          averageLatency:
            events.reduce((sum, e) => sum + e.latency, 0) / totalRequests,
          totalCost,
          costPerRequest: totalCost / totalRequests,
          conversions: conversions.length,
          conversionRate: conversions.length / totalRequests,
          revenueGenerated: totalRevenue,
          revenuePerRequest: totalRevenue / totalRequests,
          roi:
            totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0,
          averageUserFeedback:
            feedbackEvents.reduce((sum, e) => sum + (e.userFeedback || 0), 0) /
            Math.max(1, feedbackEvents.length),
          timeToConversion:
            conversionTimes.reduce(
              (sum, e) => sum + (e.businessOutcome?.timeToConversion || 0),
              0
            ) / Math.max(1, conversionTimes.length),
        },
        trends: this.calculateTrends(events, startDate, endDate),
      });
    }

    return metrics.sort((a, b) => b.metrics.roi - a.metrics.roi);
  }

  /**
   * Get persona business profiles
   */
  getPersonaBusinessProfiles(
    startDate: Date,
    endDate: Date
  ): PersonaBusinessProfile[] {
    const personas: AIBusinessEvent["persona"][] = [
      "skeptiker",
      "zeitknappe",
      "ueberforderte",
      "profi",
    ];
    const profiles: PersonaBusinessProfile[] = [];

    personas.forEach((persona) => {
      const personaEvents = this.aiEvents.filter(
        (e) =>
          e.persona === persona &&
          e.timestamp >= startDate &&
          e.timestamp <= endDate
      );

      if (personaEvents.length === 0) return;

      const sessions = new Map<string, AIBusinessEvent[]>();
      personaEvents.forEach((event) => {
        if (!sessions.has(event.sessionId)) {
          sessions.set(event.sessionId, []);
        }
        sessions.get(event.sessionId)!.push(event);
      });

      const conversions = personaEvents.filter((e) => e.businessOutcome);
      const uniqueUsers = new Set(personaEvents.map((e) => e.userId));
      const totalRevenue = conversions.reduce(
        (sum, e) => sum + (e.businessOutcome?.value || 0),
        0
      );
      const totalCost = personaEvents.reduce((sum, e) => sum + e.cost, 0);

      // Calculate session metrics
      const sessionDurations = Array.from(sessions.values()).map(
        (sessionEvents) => {
          const sortedEvents = sessionEvents.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
          const duration =
            sortedEvents.length > 1
              ? (sortedEvents[sortedEvents.length - 1].timestamp.getTime() -
                  sortedEvents[0].timestamp.getTime()) /
                (1000 * 60)
              : 5; // Default 5 minutes for single-event sessions
          return duration;
        }
      );

      const averageSessionDuration =
        sessionDurations.reduce((sum, d) => sum + d, 0) /
        sessionDurations.length;
      const requestsPerSession = personaEvents.length / sessions.size;

      // Find preferred AI provider
      const providerCounts = new Map<string, number>();
      personaEvents.forEach((e) => {
        providerCounts.set(
          e.aiProvider,
          (providerCounts.get(e.aiProvider) || 0) + 1
        );
      });
      const preferredProvider =
        Array.from(providerCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] || "bedrock";

      profiles.push({
        persona,
        characteristics: {
          averageSessionDuration,
          requestsPerSession,
          preferredAIProvider: preferredProvider,
          conversionProbability: conversions.length / uniqueUsers.size,
          averageOrderValue: totalRevenue / Math.max(1, conversions.length),
          timeToConversion:
            conversions.reduce(
              (sum, e) => sum + (e.businessOutcome?.timeToConversion || 0),
              0
            ) / Math.max(1, conversions.length),
          churnRisk: this.calculateChurnRisk(persona),
        },
        businessMetrics: {
          totalUsers: uniqueUsers.size,
          totalRevenue,
          conversionRate: conversions.length / personaEvents.length,
          customerLifetimeValue: totalRevenue / uniqueUsers.size,
          acquisitionCost: totalCost / uniqueUsers.size,
          retentionRate: 1 - this.calculateChurnRisk(persona),
        },
        aiUsage: {
          preferredFeatures: this.getPreferredFeatures(persona),
          averageRequestsPerDay:
            personaEvents.length /
            Math.max(
              1,
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            ),
          costPerUser: totalCost / uniqueUsers.size,
          satisfactionScore:
            personaEvents
              .filter((e) => e.userFeedback)
              .reduce((sum, e) => sum + (e.userFeedback || 0), 0) /
            Math.max(1, personaEvents.filter((e) => e.userFeedback).length),
        },
      });
    });

    return profiles;
  }

  /**
   * Generate AI ROI analysis
   */
  generateAIROIAnalysis(startDate: Date, endDate: Date): AIROIAnalysis {
    const events = this.aiEvents.filter(
      (e) => e.timestamp >= startDate && e.timestamp <= endDate
    );

    const totalAICost = events.reduce((sum, e) => sum + e.cost, 0);
    const conversions = events.filter((e) => e.businessOutcome);
    const totalRevenue = conversions.reduce(
      (sum, e) => sum + (e.businessOutcome?.value || 0),
      0
    );
    const netROI =
      totalAICost > 0 ? ((totalRevenue - totalAICost) / totalAICost) * 100 : 0;

    // Calculate payback period (simplified)
    const dailyRevenue =
      totalRevenue /
      Math.max(
        1,
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    const paybackPeriod =
      dailyRevenue > 0 ? totalAICost / dailyRevenue : Infinity;

    const breakEvenPoint = new Date(startDate);
    if (paybackPeriod !== Infinity) {
      breakEvenPoint.setDate(
        breakEvenPoint.getDate() + Math.ceil(paybackPeriod)
      );
    }

    // By provider analysis
    const providerGroups = new Map<string, AIBusinessEvent[]>();
    events.forEach((event) => {
      if (!providerGroups.has(event.aiProvider)) {
        providerGroups.set(event.aiProvider, []);
      }
      providerGroups.get(event.aiProvider)!.push(event);
    });

    const byProvider = Array.from(providerGroups.entries()).map(
      ([provider, providerEvents]) => {
        const cost = providerEvents.reduce((sum, e) => sum + e.cost, 0);
        const providerConversions = providerEvents.filter(
          (e) => e.businessOutcome
        );
        const revenue = providerConversions.reduce(
          (sum, e) => sum + (e.businessOutcome?.value || 0),
          0
        );

        return {
          provider,
          cost,
          revenue,
          roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
          requests: providerEvents.length,
          conversions: providerConversions.length,
        };
      }
    );

    // By persona analysis
    const personaGroups = new Map<string, AIBusinessEvent[]>();
    events.forEach((event) => {
      if (!personaGroups.has(event.persona)) {
        personaGroups.set(event.persona, []);
      }
      personaGroups.get(event.persona)!.push(event);
    });

    const byPersona = Array.from(personaGroups.entries()).map(
      ([persona, personaEvents]) => {
        const cost = personaEvents.reduce((sum, e) => sum + e.cost, 0);
        const personaConversions = personaEvents.filter(
          (e) => e.businessOutcome
        );
        const revenue = personaConversions.reduce(
          (sum, e) => sum + (e.businessOutcome?.value || 0),
          0
        );
        const uniqueUsers = new Set(personaEvents.map((e) => e.userId)).size;

        return {
          persona,
          cost,
          revenue,
          roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
          users: uniqueUsers,
          conversionRate: personaConversions.length / personaEvents.length,
        };
      }
    );

    // Generate recommendations
    const recommendations = this.generateROIRecommendations(
      byProvider,
      byPersona,
      netROI
    );

    return {
      period: { start: startDate, end: endDate },
      overall: {
        totalAICost,
        totalRevenue,
        netROI,
        paybackPeriod,
        breakEvenPoint,
      },
      byProvider: byProvider.sort((a, b) => b.roi - a.roi),
      byPersona: byPersona.sort((a, b) => b.roi - a.roi),
      recommendations,
    };
  }

  /**
   * Calculate AI cost based on provider and request type
   */
  private calculateAICost(
    provider: string,
    requestType: string,
    latency: number
  ): number {
    const baseCosts = {
      bedrock: 0.003, // per 1k tokens
      google: 0.002,
      meta: 0.001,
    };

    const requestMultipliers = {
      generation: 1.0,
      analysis: 0.8,
      recommendation: 1.2,
      optimization: 1.5,
    };

    const estimatedTokens = Math.max(100, latency / 10); // Rough estimation
    const baseCost =
      (baseCosts[provider as keyof typeof baseCosts] || 0.003) *
      (estimatedTokens / 1000);
    const multiplier =
      requestMultipliers[requestType as keyof typeof requestMultipliers] || 1.0;

    return baseCost * multiplier;
  }

  /**
   * Get model for provider
   */
  private getModelForProvider(provider: string): string {
    const models = {
      bedrock: "claude-3.5-sonnet",
      google: "gemini-pro",
      meta: "llama-2-70b",
    };
    return models[provider as keyof typeof models] || "unknown";
  }

  /**
   * Calculate trends for metrics
   */
  private calculateTrends(
    events: AIBusinessEvent[],
    startDate: Date,
    endDate: Date
  ) {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const trends = {
      requestVolume: [] as Array<{ date: Date; count: number }>,
      conversionRate: [] as Array<{ date: Date; rate: number }>,
      revenue: [] as Array<{ date: Date; amount: number }>,
      cost: [] as Array<{ date: Date; amount: number }>,
      roi: [] as Array<{ date: Date; value: number }>,
    };

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const dayEvents = events.filter((e) => {
        const eventDate = new Date(e.timestamp);
        return eventDate.toDateString() === date.toDateString();
      });

      const conversions = dayEvents.filter((e) => e.businessOutcome);
      const revenue = conversions.reduce(
        (sum, e) => sum + (e.businessOutcome?.value || 0),
        0
      );
      const cost = dayEvents.reduce((sum, e) => sum + e.cost, 0);

      trends.requestVolume.push({ date, count: dayEvents.length });
      trends.conversionRate.push({
        date,
        rate: dayEvents.length > 0 ? conversions.length / dayEvents.length : 0,
      });
      trends.revenue.push({ date, amount: revenue });
      trends.cost.push({ date, amount: cost });
      trends.roi.push({
        date,
        value: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
      });
    }

    return trends;
  }

  /**
   * Calculate churn risk for persona
   */
  private calculateChurnRisk(persona: string): number {
    const churnRisks = {
      skeptiker: 0.15,
      zeitknappe: 0.08,
      ueberforderte: 0.2,
      profi: 0.05,
    };
    return churnRisks[persona as keyof typeof churnRisks] || 0.1;
  }

  /**
   * Get preferred features for persona
   */
  private getPreferredFeatures(persona: string): string[] {
    const features = {
      skeptiker: ["data_analysis", "benchmarking", "reporting"],
      zeitknappe: ["quick_insights", "automation", "summaries"],
      ueberforderte: ["guided_setup", "tutorials", "support"],
      profi: ["advanced_analytics", "custom_reports", "api_access"],
    };
    return features[persona as keyof typeof features] || [];
  }

  /**
   * Generate ROI recommendations
   */
  private generateROIRecommendations(
    byProvider: any[],
    byPersona: any[],
    overallROI: number
  ): AIROIAnalysis["recommendations"] {
    const recommendations: AIROIAnalysis["recommendations"] = [];

    // Provider recommendations
    const bestProvider = byProvider[0];
    const worstProvider = byProvider[byProvider.length - 1];

    if (
      bestProvider &&
      worstProvider &&
      bestProvider.roi - worstProvider.roi > 50
    ) {
      recommendations.push({
        type: "provider_switch",
        description: `Switch more traffic from ${worstProvider.provider} to ${
          bestProvider.provider
        } (${(bestProvider.roi - worstProvider.roi).toFixed(
          1
        )}% ROI difference)`,
        expectedImpact:
          ((bestProvider.roi - worstProvider.roi) * worstProvider.cost) / 100,
        confidence: 0.8,
        priority: "high",
      });
    }

    // Persona recommendations
    const bestPersona = byPersona[0];
    const worstPersona = byPersona[byPersona.length - 1];

    if (
      bestPersona &&
      worstPersona &&
      bestPersona.roi > 100 &&
      worstPersona.roi < 0
    ) {
      recommendations.push({
        type: "persona_targeting",
        description: `Focus marketing on ${
          bestPersona.persona
        } segment (${bestPersona.roi.toFixed(
          1
        )}% ROI vs ${worstPersona.roi.toFixed(1)}%)`,
        expectedImpact: Math.abs(worstPersona.revenue - worstPersona.cost),
        confidence: 0.7,
        priority: "medium",
      });
    }

    // Overall ROI recommendations
    if (overallROI < 0) {
      recommendations.push({
        type: "cost_optimization",
        description:
          "Negative ROI detected - implement cost optimization measures",
        expectedImpact: Math.abs(overallROI) * 1000, // Estimated savings
        confidence: 0.9,
        priority: "high",
      });
    } else if (overallROI > 200) {
      recommendations.push({
        type: "revenue_optimization",
        description: "High ROI indicates opportunity to scale AI investments",
        expectedImpact: overallROI * 500, // Estimated additional revenue
        confidence: 0.6,
        priority: "medium",
      });
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
export const aiBusinessIntegration = new AIBusinessIntegration();

export default aiBusinessIntegration;
