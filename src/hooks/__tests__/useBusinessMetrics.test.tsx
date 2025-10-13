/**
 * useBusinessMetrics Hook Tests
 */

import { aiBusinessIntegration } from '@/lib/business-metrics/ai-business-integration';
import { businessMetricsService } from '@/lib/business-metrics/business-metrics-service';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useBusinessMetrics } from '../useBusinessMetrics';

// Mock the services
jest.mock('@/lib/business-metrics/business-metrics-service');
jest.mock('@/lib/business-metrics/ai-business-integration');

const mockBusinessMetricsService = businessMetricsService as jest.Mocked<typeof businessMetricsService>;
const mockAIBusinessIntegration = aiBusinessIntegration as jest.Mocked<typeof aiBusinessIntegration>;

describe('useBusinessMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations (synchronous for most tests)
    mockBusinessMetricsService.getRevenueMetrics.mockReturnValue({
      totalRevenue: 50000,
      recurringRevenue: 30000,
      oneTimeRevenue: 20000,
      averageOrderValue: 250,
      customerLifetimeValue: 1200,
      monthlyRecurringRevenue: 30000,
      annualRecurringRevenue: 360000,
      churnRate: 0.05,
      retentionRate: 0.95,
      conversionRate: 0.12,
      revenuePerUser: 400,
      revenueGrowthRate: 15.5
    });

    mockBusinessMetricsService.getConversionFunnel.mockReturnValue([
      {
        stage: 'Visitors',
        users: 1000,
        conversions: 1000,
        conversionRate: 1.0,
        dropoffRate: 0,
        averageTimeToConvert: 0,
        revenueGenerated: 0
      },
      {
        stage: 'Signups',
        users: 1000,
        conversions: 200,
        conversionRate: 0.2,
        dropoffRate: 0.8,
        averageTimeToConvert: 5,
        revenueGenerated: 0
      }
    ]);

    mockAIBusinessIntegration.getAIBusinessMetrics.mockReturnValue([
      {
        provider: 'bedrock',
        model: 'claude-3.5-sonnet',
        persona: 'profi',
        metrics: {
          totalRequests: 1000,
          successRate: 0.95,
          averageLatency: 1200,
          totalCost: 50,
          costPerRequest: 0.05,
          conversions: 120,
          conversionRate: 0.12,
          revenueGenerated: 30000,
          revenuePerRequest: 30,
          roi: 500,
          averageUserFeedback: 4.5,
          timeToConversion: 45
        },
        trends: {
          requestVolume: [],
          conversionRate: [],
          revenue: [],
          cost: [],
          roi: []
        }
      }
    ]);

    mockAIBusinessIntegration.getPersonaBusinessProfiles.mockReturnValue([
      {
        persona: 'profi',
        characteristics: {
          averageSessionDuration: 25,
          requestsPerSession: 3.5,
          preferredAIProvider: 'bedrock',
          conversionProbability: 0.25,
          averageOrderValue: 299.99,
          timeToConversion: 45,
          churnRisk: 0.05
        },
        businessMetrics: {
          totalUsers: 150,
          totalRevenue: 45000,
          conversionRate: 0.25,
          customerLifetimeValue: 2400,
          acquisitionCost: 120,
          retentionRate: 0.95
        },
        aiUsage: {
          preferredFeatures: ['advanced_analytics', 'custom_reports'],
          averageRequestsPerDay: 5.2,
          costPerUser: 2.5,
          satisfactionScore: 4.7
        }
      }
    ]);

    mockAIBusinessIntegration.generateAIROIAnalysis.mockReturnValue({
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      overall: {
        totalAICost: 500,
        totalRevenue: 50000,
        netROI: 9900,
        paybackPeriod: 3.65,
        breakEvenPoint: new Date('2024-01-04')
      },
      byProvider: [
        {
          provider: 'bedrock',
          cost: 300,
          revenue: 35000,
          roi: 11567,
          requests: 700,
          conversions: 84
        }
      ],
      byPersona: [
        {
          persona: 'profi',
          cost: 200,
          revenue: 30000,
          roi: 14900,
          users: 120,
          conversionRate: 0.25
        }
      ],
      recommendations: [
        {
          type: 'revenue_optimization',
          description: 'High ROI indicates opportunity to scale AI investments',
          expectedImpact: 5000,
          confidence: 0.8,
          priority: 'high'
        }
      ]
    });

    mockBusinessMetricsService.generateBusinessImpactReport.mockReturnValue({
      experimentId: 'exp-001',
      period: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      metrics: {
        control: {
          totalRevenue: 20000,
          recurringRevenue: 15000,
          oneTimeRevenue: 5000,
          averageOrderValue: 200,
          customerLifetimeValue: 1000,
          monthlyRecurringRevenue: 15000,
          annualRecurringRevenue: 180000,
          churnRate: 0.08,
          retentionRate: 0.92,
          conversionRate: 0.10,
          revenuePerUser: 333,
          revenueGrowthRate: 10
        },
        treatment: {
          totalRevenue: 25000,
          recurringRevenue: 18000,
          oneTimeRevenue: 7000,
          averageOrderValue: 250,
          customerLifetimeValue: 1250,
          monthlyRecurringRevenue: 18000,
          annualRecurringRevenue: 216000,
          churnRate: 0.06,
          retentionRate: 0.94,
          conversionRate: 0.125,
          revenuePerUser: 417,
          revenueGrowthRate: 15
        },
        lift: {
          revenue: 25,
          conversions: 25,
          averageOrderValue: 25,
          customerLifetimeValue: 25
        }
      },
      funnel: {
        control: [],
        treatment: []
      },
      significance: {
        isSignificant: true,
        pValue: 0.03,
        confidenceLevel: 95,
        sampleSize: {
          control: 100,
          treatment: 100
        }
      },
      recommendations: ['Roll out treatment variant - shows significant improvement'],
      estimatedAnnualImpact: 60000
    });

    mockBusinessMetricsService.getCustomerSegments.mockReturnValue([
      {
        id: 'premium-restaurants',
        name: 'Premium Restaurants',
        description: 'High-end restaurants',
        criteria: {},
        size: 245,
        averageRevenue: 299.99,
        conversionRate: 0.12,
        churnRate: 0.05,
        lifetimeValue: 2400
      }
    ]);

    mockBusinessMetricsService.on.mockReturnValue(() => {});
    mockAIBusinessIntegration.on.mockReturnValue(() => {});
  });

  describe('initialization', () => {
    it('should initialize and load metrics', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      // Wait for loading to complete (mocks are synchronous)
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have loaded data
      expect(result.current.revenueMetrics).toBeDefined();
      expect(result.current.error).toBeNull();
    });

    it('should load metrics on mount', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.revenueMetrics).toBeDefined();
      expect(result.current.conversionFunnel).toHaveLength(2);
      expect(result.current.aiMetrics).toHaveLength(1);
      expect(result.current.personaProfiles).toHaveLength(1);
      expect(result.current.roiAnalysis).toBeDefined();
      expect(result.current.businessImpactReports).toHaveLength(3); // 3 experiments
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle loading errors', async () => {
      mockBusinessMetricsService.getRevenueMetrics.mockImplementation(() => {
        throw new Error('Failed to load metrics');
      });

      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load metrics');
      expect(result.current.revenueMetrics).toBeNull();
    });
  });

  describe('options handling', () => {
    it('should use custom time range', async () => {
      const { result } = renderHook(() => useBusinessMetrics({ timeRange: '7d' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBusinessMetricsService.getRevenueMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        undefined,
        undefined
      );
    });

    it('should use custom segment ID', async () => {
      const { result } = renderHook(() => useBusinessMetrics({ segmentId: 'premium-restaurants' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBusinessMetricsService.getRevenueMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        'premium-restaurants',
        undefined
      );
    });

    it('should use custom experiment ID', async () => {
      const { result } = renderHook(() => useBusinessMetrics({ experimentId: 'exp-001' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockBusinessMetricsService.getRevenueMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
        undefined,
        'exp-001'
      );
    });
  });

  describe('trackConversion', () => {
    it('should track conversion and refresh metrics', async () => {
      mockBusinessMetricsService.trackConversion.mockReturnValue({
        id: 'conv-123',
        userId: 'user-123',
        sessionId: 'session-456',
        eventType: 'subscription',
        eventName: 'subscription_completed',
        value: 299.99,
        currency: 'EUR',
        timestamp: new Date(),
        metadata: { source: 'web' },
        properties: {}
      });

      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.trackConversion({
          userId: 'user-123',
          sessionId: 'session-456',
          eventType: 'subscription',
          eventName: 'subscription_completed',
          value: 299.99,
          currency: 'EUR',
          metadata: { source: 'web' },
          properties: {}
        });
      });

      expect(mockBusinessMetricsService.trackConversion).toHaveBeenCalledWith({
        userId: 'user-123',
        sessionId: 'session-456',
        eventType: 'subscription',
        eventName: 'subscription_completed',
        value: 299.99,
        currency: 'EUR',
        metadata: { source: 'web' },
        properties: {}
      });
    });

    it('should handle tracking errors', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock error after hook is loaded
      mockBusinessMetricsService.trackConversion.mockImplementation(() => {
        throw new Error('Tracking failed');
      });

      // The error should be caught and set in state, not thrown
      act(() => {
        try {
          result.current.trackConversion({
            userId: 'user-123',
            sessionId: 'session-456',
            eventType: 'subscription',
            eventName: 'subscription_completed',
            value: 299.99,
            currency: 'EUR',
            metadata: { source: 'web' },
            properties: {}
          });
        } catch (error) {
          // Expected to throw
        }
      });

      // Error should be set in state
      expect(result.current.error).toBe('Tracking failed');
    });
  });

  describe('trackAIEvent', () => {
    it('should track AI event and refresh metrics', async () => {
      mockAIBusinessIntegration.trackAIEvent.mockReturnValue({
        userId: 'user-123',
        sessionId: 'session-456',
        aiProvider: 'bedrock',
        aiModel: 'claude-3.5-sonnet',
        requestType: 'generation',
        persona: 'profi',
        latency: 1200,
        cost: 0.05,
        success: true,
        timestamp: new Date()
      });

      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.trackAIEvent({
          userId: 'user-123',
          sessionId: 'session-456',
          aiProvider: 'bedrock',
          aiModel: 'claude-3.5-sonnet',
          requestType: 'generation',
          persona: 'profi',
          latency: 1200,
          cost: 0.05,
          success: true
        });
      });

      expect(mockAIBusinessIntegration.trackAIEvent).toHaveBeenCalledWith({
        userId: 'user-123',
        sessionId: 'session-456',
        aiProvider: 'bedrock',
        aiModel: 'claude-3.5-sonnet',
        requestType: 'generation',
        persona: 'profi',
        latency: 1200,
        cost: 0.05,
        success: true
      });
    });
  });

  describe('utility functions', () => {
    it('should get customer segments', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const segments = result.current.getCustomerSegments();

      expect(segments).toHaveLength(1);
      expect(segments[0].id).toBe('premium-restaurants');
    });

    it('should generate business impact report', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const report = result.current.generateBusinessImpactReport('exp-001');

      expect(report).toBeDefined();
      expect(report?.experimentId).toBe('exp-001');
    });

    it('should get metrics summary', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const summary = result.current.getMetricsSummary();

      expect(summary).toMatchObject({
        totalRevenue: 50000,
        conversionRate: 0.12,
        customerLTV: 1200,
        aiROI: 9900,
        aiCost: 500,
        topPerformingProvider: 'bedrock',
        topPerformingPersona: 'profi'
      });
    });

    it('should export metrics as JSON', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const exportedData = result.current.exportMetrics('json');
      const parsedData = JSON.parse(exportedData);

      expect(parsedData).toHaveProperty('revenueMetrics');
      expect(parsedData).toHaveProperty('conversionFunnel');
      expect(parsedData).toHaveProperty('aiMetrics');
      expect(parsedData).toHaveProperty('exportedAt');
    });

    it('should export metrics as CSV', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const csvData = result.current.exportMetrics('csv');

      expect(csvData).toContain('Metric,Value');
      expect(csvData).toContain('Total Revenue,50000');
      expect(csvData).toContain('Conversion Rate,0.12');
    });
  });

  describe('computed values', () => {
    it('should calculate isStale correctly', async () => {
      const { result } = renderHook(() => useBusinessMetrics({ refreshInterval: 1000 }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isStale).toBe(false);

      // Force re-render with old timestamp by updating the hook state
      act(() => {
        // Simulate old lastUpdated by mocking Date.now
        const originalNow = Date.now;
        Date.now = jest.fn(() => originalNow() + 2000); // 2 seconds later
        
        // Trigger a re-render
        result.current.refresh();
        
        // Restore Date.now
        Date.now = originalNow;
      });

      await waitFor(() => {
        expect(result.current.isStale).toBe(false); // Should be false after refresh
      });
    });

    it('should calculate hasData correctly', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasData).toBe(true);
    });

    it('should return correct hasData value', async () => {
      const { result } = renderHook(() => useBusinessMetrics());

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should be true after loading with data
      expect(result.current.hasData).toBe(true);
    });

    it('should return false for hasData when error exists', async () => {
      mockBusinessMetricsService.getRevenueMetrics.mockImplementation(() => {
        throw new Error('Failed to load');
      });

      const { result } = renderHook(() => useBusinessMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasData).toBe(false);
    });
  });

  describe('auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh when enabled', async () => {
      const { result } = renderHook(() => 
        useBusinessMetrics({ autoRefresh: true, refreshInterval: 1000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockBusinessMetricsService.getRevenueMetrics.mock.calls.length;

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockBusinessMetricsService.getRevenueMetrics.mock.calls.length).toBe(initialCallCount + 1);
    });

    it('should not auto-refresh when disabled', async () => {
      const { result } = renderHook(() => 
        useBusinessMetrics({ autoRefresh: false, refreshInterval: 1000 })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockBusinessMetricsService.getRevenueMetrics.mock.calls.length;

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockBusinessMetricsService.getRevenueMetrics.mock.calls.length).toBe(initialCallCount);
    });
  });
});