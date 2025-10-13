/**
 * Business Metrics Hook
 *
 * React hook for managing business metrics, conversion tracking, and AI ROI analysis
 */

import {
  aiBusinessIntegration,
  type AIBusinessEvent,
  type AIBusinessMetrics,
  type AIROIAnalysis,
  type PersonaBusinessProfile,
} from "@/lib/business-metrics/ai-business-integration";
import {
  businessMetricsService,
  type BusinessImpactReport,
  type ConversionEvent,
  type ConversionFunnel,
  type RevenueMetrics,
} from "@/lib/business-metrics/business-metrics-service";
import { useCallback, useEffect, useState } from "react";

export interface UseBusinessMetricsOptions {
  timeRange?: "7d" | "30d" | "90d";
  segmentId?: string;
  experimentId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export interface BusinessMetricsState {
  revenueMetrics: RevenueMetrics | null;
  conversionFunnel: ConversionFunnel[];
  aiMetrics: AIBusinessMetrics[];
  personaProfiles: PersonaBusinessProfile[];
  roiAnalysis: AIROIAnalysis | null;
  businessImpactReports: BusinessImpactReport[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useBusinessMetrics(options: UseBusinessMetricsOptions = {}) {
  const {
    timeRange = "30d",
    segmentId,
    experimentId,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [state, setState] = useState<BusinessMetricsState>({
    revenueMetrics: null,
    conversionFunnel: [],
    aiMetrics: [],
    personaProfiles: [],
    roiAnalysis: null,
    businessImpactReports: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const getDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    return { startDate, endDate };
  }, [timeRange]);

  const loadMetrics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { startDate, endDate } = getDateRange();

      // Load revenue metrics
      const revenueMetrics = businessMetricsService.getRevenueMetrics(
        startDate,
        endDate,
        segmentId,
        experimentId
      );

      // Load conversion funnel
      const conversionFunnel = businessMetricsService.getConversionFunnel(
        startDate,
        endDate,
        experimentId
      );

      // Load AI business metrics
      const aiMetrics = aiBusinessIntegration.getAIBusinessMetrics(
        startDate,
        endDate
      );

      // Load persona profiles
      const personaProfiles = aiBusinessIntegration.getPersonaBusinessProfiles(
        startDate,
        endDate
      );

      // Load ROI analysis
      const roiAnalysis = aiBusinessIntegration.generateAIROIAnalysis(
        startDate,
        endDate
      );

      // Load business impact reports
      const experiments = ["exp-001", "exp-002", "exp-003"];
      const businessImpactReports = experiments
        .map((expId) =>
          businessMetricsService.generateBusinessImpactReport(
            expId,
            startDate,
            endDate
          )
        )
        .filter((report): report is BusinessImpactReport => report !== null);

      setState({
        revenueMetrics,
        conversionFunnel,
        aiMetrics,
        personaProfiles,
        roiAnalysis,
        businessImpactReports,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load business metrics",
      }));
    }
  }, [getDateRange, segmentId, experimentId]);

  // Track conversion event
  const trackConversion = useCallback(
    (event: Omit<ConversionEvent, "id" | "timestamp">) => {
      try {
        const conversion = businessMetricsService.trackConversion(event);

        // Refresh metrics after tracking conversion
        if (!state.loading) {
          loadMetrics();
        }

        return conversion;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to track conversion",
        }));
        throw error;
      }
    },
    [loadMetrics, state.loading]
  );

  // Track AI business event
  const trackAIEvent = useCallback(
    (event: Omit<AIBusinessEvent, "timestamp">) => {
      try {
        const aiEvent = aiBusinessIntegration.trackAIEvent(event);

        // Refresh metrics after tracking AI event
        if (!state.loading) {
          loadMetrics();
        }

        return aiEvent;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to track AI event",
        }));
        throw error;
      }
    },
    [loadMetrics, state.loading]
  );

  // Get customer segments
  const getCustomerSegments = useCallback(() => {
    return businessMetricsService.getCustomerSegments();
  }, []);

  // Generate business impact report for specific experiment
  const generateBusinessImpactReport = useCallback(
    (experimentId: string, startDate?: Date, endDate?: Date) => {
      const { startDate: defaultStart, endDate: defaultEnd } = getDateRange();
      return businessMetricsService.generateBusinessImpactReport(
        experimentId,
        startDate || defaultStart,
        endDate || defaultEnd
      );
    },
    [getDateRange]
  );

  // Calculate conversion attribution
  const calculateAttribution = useCallback(
    (
      userId: string,
      model?:
        | "first_touch"
        | "last_touch"
        | "linear"
        | "time_decay"
        | "position_based"
        | "data_driven"
    ) => {
      return businessMetricsService.calculateAttribution(userId, model);
    },
    []
  );

  // Get real-time metrics summary
  const getMetricsSummary = useCallback(() => {
    if (!state.revenueMetrics || !state.roiAnalysis) return null;

    return {
      totalRevenue: state.revenueMetrics.totalRevenue,
      conversionRate: state.revenueMetrics.conversionRate,
      customerLTV: state.revenueMetrics.customerLifetimeValue,
      aiROI: state.roiAnalysis.overall.netROI,
      aiCost: state.roiAnalysis.overall.totalAICost,
      topPerformingProvider:
        state.roiAnalysis.byProvider[0]?.provider || "unknown",
      topPerformingPersona:
        state.roiAnalysis.byPersona[0]?.persona || "unknown",
    };
  }, [state.revenueMetrics, state.roiAnalysis]);

  // Export metrics data
  const exportMetrics = useCallback(
    (format: "json" | "csv" = "json") => {
      const data = {
        revenueMetrics: state.revenueMetrics,
        conversionFunnel: state.conversionFunnel,
        aiMetrics: state.aiMetrics,
        personaProfiles: state.personaProfiles,
        roiAnalysis: state.roiAnalysis,
        businessImpactReports: state.businessImpactReports,
        exportedAt: new Date().toISOString(),
        timeRange,
        segmentId,
        experimentId,
      };

      if (format === "json") {
        return JSON.stringify(data, null, 2);
      }

      // Simple CSV export for revenue metrics
      if (state.revenueMetrics) {
        const csvData = [
          ["Metric", "Value"],
          ["Total Revenue", state.revenueMetrics.totalRevenue.toString()],
          [
            "Recurring Revenue",
            state.revenueMetrics.recurringRevenue.toString(),
          ],
          ["One-time Revenue", state.revenueMetrics.oneTimeRevenue.toString()],
          [
            "Average Order Value",
            state.revenueMetrics.averageOrderValue.toString(),
          ],
          [
            "Customer Lifetime Value",
            state.revenueMetrics.customerLifetimeValue.toString(),
          ],
          [
            "Monthly Recurring Revenue",
            state.revenueMetrics.monthlyRecurringRevenue.toString(),
          ],
          [
            "Annual Recurring Revenue",
            state.revenueMetrics.annualRecurringRevenue.toString(),
          ],
          ["Conversion Rate", state.revenueMetrics.conversionRate.toString()],
          ["Churn Rate", state.revenueMetrics.churnRate.toString()],
          ["Retention Rate", state.revenueMetrics.retentionRate.toString()],
          [
            "Revenue Growth Rate",
            state.revenueMetrics.revenueGrowthRate.toString(),
          ],
        ];

        return csvData.map((row) => row.join(",")).join("\n");
      }

      return "";
    },
    [state, timeRange, segmentId, experimentId]
  );

  // Initial load
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadMetrics]);

  // Event listeners for real-time updates
  useEffect(() => {
    const unsubscribeConversion = businessMetricsService.on(
      "conversion:tracked",
      () => {
        if (!state.loading) {
          loadMetrics();
        }
      }
    );

    const unsubscribeAI = aiBusinessIntegration.on(
      "ai:request_completed",
      () => {
        if (!state.loading) {
          loadMetrics();
        }
      }
    );

    return () => {
      unsubscribeConversion();
      unsubscribeAI();
    };
  }, [loadMetrics, state.loading]);

  return {
    // State
    ...state,

    // Actions
    refresh: loadMetrics,
    trackConversion,
    trackAIEvent,

    // Utilities
    getCustomerSegments,
    generateBusinessImpactReport,
    calculateAttribution,
    getMetricsSummary,
    exportMetrics,

    // Computed values
    isStale: state.lastUpdated
      ? Date.now() - state.lastUpdated.getTime() > refreshInterval
      : false,
    hasData: !state.loading && !state.error && state.revenueMetrics !== null,
  };
}

export default useBusinessMetrics;
