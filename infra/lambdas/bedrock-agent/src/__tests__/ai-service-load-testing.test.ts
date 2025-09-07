/**
 * AI Service Load Testing Suite
 * Tests performance, scalability, and reliability under various load conditions
 * Requirements: 8.3, 10.5, 11.4, 11.5
 */

import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { VCOrchestrator } from '../vc-orchestrator';
import { BusinessFrameworkEngine } from '../business-framework-engine';
import { PersonaDetectionEngine } from '../persona-detection-engine';
import { CostControlSystem } from '../cost-control-system';
import { PerformanceMonitoring } from '../performance-monitoring';
import { RequestQueueSystem } from '../request-queue-system';

// Mock AWS services for load testing
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-cloudwatch-logs');
jest.mock('@aws-sdk/client-dynamodb');

describe('AI Service Load Testing', () => {
  let vcOrchestrator: VCOrchestrator;
  let frameworkEngine: BusinessFrameworkEngine;
  let personaEngine: PersonaDetectionEngine;
  let costControl: CostControlSystem;
  let performanceMonitor: PerformanceMonitoring;
  let requestQueue: RequestQueueSystem;

  // Performance metrics tracking
  const performanceMetrics = {
    responseTime: [] as number[],
    throughput: [] as number[],
    errorRate: [] as number[],
    memoryUsage: [] as number[],
    cpuUsage: [] as number[]
  };

  const mockBedrockClient = {
    send: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (BedrockRuntimeClient as jest.Mock).mockImplementation(() => mockBedrockClient);

    // Initialize components
    vcOrchestrator = new VCOrchestrator();
    frameworkEngine = new BusinessFrameworkEngine();
    personaEngine = new PersonaDetectionEngine();
    costControl = new CostControlSystem();
    performanceMonitor = new PerformanceMonitoring();
    requestQueue = new RequestQueueSystem();

    // Setup default mock response
    mockBedrockClient.send.mockResolvedValue({
      body: new TextEncoder().encode(JSON.stringify({
        content: [{
          text: JSON.stringify({
            swot_analysis: {
              strengths: ['Test strength'],
              weaknesses: ['Test weakness'],
              opportunities: ['Test opportunity'],
              threats: ['Test threat']
            },
            visibility_score: 75,
            recommendations: [{ action: 'Test recommendation', impact: 'medium' }]
          })
        }]
      }))
    });
  });

  afterAll(() => {
    // Generate performance report
    console.log('\n=== AI SERVICE LOAD TESTING REPORT ===');
    
    if (performanceMetrics.responseTime.length > 0) {
      const avgResponseTime = performanceMetrics.responseTime.reduce((a, b) => a + b, 0) / performanceMetrics.responseTime.length;
      const maxResponseTime = Math.max(...performanceMetrics.responseTime);
      const minResponseTime = Math.min(...performanceMetrics.responseTime);
      const p95ResponseTime = performanceMetrics.responseTime.sort((a, b) => a - b)[Math.floor(performanceMetrics.responseTime.length * 0.95)];

      console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`P95 Response Time: ${p95ResponseTime.toFixed(2)}ms`);
      console.log(`Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
      console.log(`Min Response Time: ${minResponseTime.toFixed(2)}ms`);
    }

    if (performanceMetrics.throughput.length > 0) {
      const avgThroughput = performanceMetrics.throughput.reduce((a, b) => a + b, 0) / performanceMetrics.throughput.length;
      console.log(`Average Throughput: ${avgThroughput.toFixed(2)} requests/second`);
    }

    if (performanceMetrics.errorRate.length > 0) {
      const avgErrorRate = performanceMetrics.errorRate.reduce((a, b) => a + b, 0) / performanceMetrics.errorRate.length;
      console.log(`Average Error Rate: ${(avgErrorRate * 100).toFixed(2)}%`);
    }
  });

  describe('Baseline Performance Testing', () => {
    it('should meet response time requirements under normal load', async () => {
      const testDuration = 30000; // 30 seconds
      const requestInterval = 1000; // 1 request per second
      const startTime = Date.now();
      const responseTimes: number[] = [];
      let requestCount = 0;
      let errorCount = 0;

      while (Date.now() - startTime < testDuration) {
        const requestStart = Date.now();
        
        try {
          const businessData = {
            business_name: `Load Test Restaurant ${requestCount}`,
            location: { city: 'München', country: 'Germany' },
            main_category: 'restaurant',
            persona_type: 'Solo-Sarah'
          };

          await vcOrchestrator.executeAnalysis(`load-test-${requestCount}`, businessData);
          
          const responseTime = Date.now() - requestStart;
          responseTimes.push(responseTime);
          requestCount++;

          // Verify response time requirement (30 seconds max)
          expect(responseTime).toBeLessThan(30000);
          
        } catch (error) {
          errorCount++;
        }

        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // Calculate metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const errorRate = errorCount / (requestCount + errorCount);
      const throughput = requestCount / (testDuration / 1000);

      performanceMetrics.responseTime.push(...responseTimes);
      performanceMetrics.errorRate.push(errorRate);
      performanceMetrics.throughput.push(throughput);

      // Assertions
      expect(avgResponseTime).toBeLessThan(5000); // Average under 5 seconds
      expect(errorRate).toBeLessThan(0.01); // Less than 1% error rate
      expect(throughput).toBeGreaterThan(0.8); // At least 0.8 requests/second
    });

    it('should handle burst traffic effectively', async () => {
      const burstSize = 20;
      const burstPromises: Promise<any>[] = [];
      const startTime = Date.now();

      // Create burst of concurrent requests
      for (let i = 0; i < burstSize; i++) {
        const businessData = {
          business_name: `Burst Test Restaurant ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        burstPromises.push(
          vcOrchestrator.executeAnalysis(`burst-test-${i}`, businessData)
            .then(result => ({ success: true, responseTime: Date.now() - startTime, result }))
            .catch(error => ({ success: false, error, responseTime: Date.now() - startTime }))
        );
      }

      const results = await Promise.all(burstPromises);
      const successfulRequests = results.filter(r => r.success);
      const failedRequests = results.filter(r => !r.success);

      // Analyze results
      const responseTimes = results.map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const successRate = successfulRequests.length / results.length;

      performanceMetrics.responseTime.push(...responseTimes);

      // Assertions
      expect(successRate).toBeGreaterThan(0.9); // At least 90% success rate
      expect(maxResponseTime).toBeLessThan(45000); // Max 45 seconds under burst
      expect(avgResponseTime).toBeLessThan(15000); // Average under 15 seconds
    });

    it('should maintain performance with different persona types', async () => {
      const personaTypes = ['Solo-Sarah', 'Bewahrer-Ben', 'Wachstums-Walter', 'Ketten-Katrin'];
      const userTypes = ['Der Skeptiker', 'Der Überforderte', 'Der Profi', 'Der Zeitknappe'];
      const requestsPerPersona = 5;
      const allResults: Array<{ persona: string, responseTime: number, success: boolean }> = [];

      for (const businessPersona of personaTypes) {
        for (const userPersona of userTypes) {
          for (let i = 0; i < requestsPerPersona; i++) {
            const startTime = Date.now();
            
            try {
              const businessData = {
                business_name: `Persona Test ${businessPersona} ${userPersona} ${i}`,
                location: { city: 'München', country: 'Germany' },
                main_category: 'restaurant',
                persona_type: businessPersona,
                user_persona: userPersona
              };

              await vcOrchestrator.executeAnalysis(`persona-load-${businessPersona}-${userPersona}-${i}`, businessData);
              
              const responseTime = Date.now() - startTime;
              allResults.push({
                persona: `${businessPersona}/${userPersona}`,
                responseTime,
                success: true
              });

            } catch (error) {
              allResults.push({
                persona: `${businessPersona}/${userPersona}`,
                responseTime: Date.now() - startTime,
                success: false
              });
            }
          }
        }
      }

      // Analyze performance by persona
      const personaPerformance = allResults.reduce((acc, result) => {
        if (!acc[result.persona]) {
          acc[result.persona] = { responseTimes: [], successCount: 0, totalCount: 0 };
        }
        acc[result.persona].responseTimes.push(result.responseTime);
        acc[result.persona].totalCount++;
        if (result.success) acc[result.persona].successCount++;
        return acc;
      }, {} as Record<string, { responseTimes: number[], successCount: number, totalCount: number }>);

      // Verify consistent performance across personas
      Object.entries(personaPerformance).forEach(([persona, metrics]) => {
        const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
        const successRate = metrics.successCount / metrics.totalCount;

        expect(avgResponseTime).toBeLessThan(10000); // Under 10 seconds per persona
        expect(successRate).toBeGreaterThan(0.95); // 95% success rate per persona
      });

      performanceMetrics.responseTime.push(...allResults.map(r => r.responseTime));
    });
  });

  describe('Stress Testing', () => {
    it('should handle high concurrent load', async () => {
      const concurrentRequests = 50;
      const promises: Promise<any>[] = [];
      const startTime = Date.now();

      // Create high concurrent load
      for (let i = 0; i < concurrentRequests; i++) {
        const businessData = {
          business_name: `Stress Test Restaurant ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        promises.push(
          vcOrchestrator.executeAnalysis(`stress-test-${i}`, businessData)
            .then(result => ({ 
              success: true, 
              responseTime: Date.now() - startTime,
              queueTime: result.queue_time_ms || 0,
              processingTime: result.processing_time_ms || 0
            }))
            .catch(error => ({ 
              success: false, 
              error: error.message,
              responseTime: Date.now() - startTime
            }))
        );
      }

      const results = await Promise.all(promises);
      const successfulRequests = results.filter(r => r.success);
      const queuedRequests = results.filter(r => r.success && r.queueTime > 0);

      // Analyze stress test results
      const successRate = successfulRequests.length / results.length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const queueUtilization = queuedRequests.length / results.length;

      performanceMetrics.responseTime.push(...results.map(r => r.responseTime));
      performanceMetrics.errorRate.push(1 - successRate);

      // Stress test assertions
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success under stress
      expect(avgResponseTime).toBeLessThan(60000); // Under 60 seconds average
      expect(queueUtilization).toBeLessThan(0.7); // Queue not overwhelmed
    });

    it('should gracefully degrade under extreme load', async () => {
      const extremeLoad = 100;
      const promises: Promise<any>[] = [];

      // Mock slower responses to simulate system stress
      mockBedrockClient.send.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              body: new TextEncoder().encode(JSON.stringify({
                content: [{ text: JSON.stringify({ visibility_score: 70, degraded: true }) }]
              }))
            });
          }, Math.random() * 5000 + 2000); // 2-7 second delay
        })
      );

      const startTime = Date.now();

      for (let i = 0; i < extremeLoad; i++) {
        const businessData = {
          business_name: `Extreme Load Test ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        promises.push(
          vcOrchestrator.executeAnalysis(`extreme-test-${i}`, businessData)
            .then(result => ({ 
              success: true, 
              degraded: result.degraded_service || false,
              responseTime: Date.now() - startTime
            }))
            .catch(error => ({ 
              success: false, 
              error: error.message,
              responseTime: Date.now() - startTime
            }))
        );
      }

      const results = await Promise.all(promises);
      const successfulRequests = results.filter(r => r.success);
      const degradedRequests = results.filter(r => r.success && r.degraded);

      const successRate = successfulRequests.length / results.length;
      const degradationRate = degradedRequests.length / results.length;

      // Under extreme load, system should still function but may degrade
      expect(successRate).toBeGreaterThan(0.6); // At least 60% success
      expect(degradationRate).toBeLessThan(0.5); // Less than 50% degraded
    });

    it('should recover from temporary failures', async () => {
      let failureCount = 0;
      const maxFailures = 10;

      // Mock intermittent failures
      mockBedrockClient.send.mockImplementation(() => {
        if (failureCount < maxFailures) {
          failureCount++;
          return Promise.reject(new Error('Temporary service failure'));
        }
        return Promise.resolve({
          body: new TextEncoder().encode(JSON.stringify({
            content: [{ text: JSON.stringify({ visibility_score: 75 }) }]
          }))
        });
      });

      const recoveryPromises: Promise<any>[] = [];
      const requestCount = 20;

      for (let i = 0; i < requestCount; i++) {
        const businessData = {
          business_name: `Recovery Test ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        recoveryPromises.push(
          vcOrchestrator.executeAnalysis(`recovery-test-${i}`, businessData)
            .then(result => ({ success: true, retryCount: result.retry_count || 0 }))
            .catch(error => ({ success: false, error: error.message }))
        );

        // Stagger requests slightly
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const results = await Promise.all(recoveryPromises);
      const successfulRequests = results.filter(r => r.success);
      const retriedRequests = results.filter(r => r.success && r.retryCount > 0);

      const recoveryRate = successfulRequests.length / results.length;
      const retryUtilization = retriedRequests.length / results.length;

      // System should recover from temporary failures
      expect(recoveryRate).toBeGreaterThan(0.7); // At least 70% recovery
      expect(retryUtilization).toBeGreaterThan(0.3); // Retry mechanism used
    });
  });

  describe('Memory and Resource Testing', () => {
    it('should maintain stable memory usage under load', async () => {
      const memorySnapshots: number[] = [];
      const requestCount = 30;

      // Take initial memory snapshot
      const initialMemory = process.memoryUsage().heapUsed;
      memorySnapshots.push(initialMemory);

      // Execute requests while monitoring memory
      for (let i = 0; i < requestCount; i++) {
        const businessData = {
          business_name: `Memory Test Restaurant ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        await vcOrchestrator.executeAnalysis(`memory-test-${i}`, businessData);

        // Take memory snapshot every 5 requests
        if (i % 5 === 0) {
          const currentMemory = process.memoryUsage().heapUsed;
          memorySnapshots.push(currentMemory);
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);

      performanceMetrics.memoryUsage.push(...memorySnapshots);

      // Memory growth should be reasonable
      expect(memoryGrowthMB).toBeLessThan(100); // Less than 100MB growth
      
      // Check for memory leaks (no continuous growth)
      const growthTrend = memorySnapshots.slice(1).map((mem, i) => mem - memorySnapshots[i]);
      const avgGrowthPerSnapshot = growthTrend.reduce((a, b) => a + b, 0) / growthTrend.length;
      const avgGrowthMB = avgGrowthPerSnapshot / (1024 * 1024);

      expect(avgGrowthMB).toBeLessThan(10); // Less than 10MB average growth per snapshot
    });

    it('should handle large payload processing efficiently', async () => {
      const largeBusinessData = {
        business_name: 'Large Data Test Restaurant',
        location: {
          street: 'Very Long Street Name With Many Details',
          city: 'München',
          postal_code: '80331',
          country: 'Germany',
          coordinates: { lat: 48.1351, lng: 11.5820 }
        },
        main_category: 'restaurant',
        sub_categories: Array(50).fill(0).map((_, i) => `category_${i}`),
        description: 'A'.repeat(5000), // 5KB description
        menu_items: Array(100).fill(0).map((_, i) => ({
          name: `Menu Item ${i}`,
          description: 'B'.repeat(200),
          price: Math.random() * 50
        })),
        reviews: Array(200).fill(0).map((_, i) => ({
          rating: Math.floor(Math.random() * 5) + 1,
          text: 'C'.repeat(500),
          date: new Date().toISOString()
        })),
        persona_type: 'Wachstums-Walter'
      };

      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      const result = await vcOrchestrator.executeAnalysis('large-payload-test', largeBusinessData);

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const processingTime = endTime - startTime;
      const memoryIncrease = (endMemory - startMemory) / (1024 * 1024);

      // Large payload should still be processed efficiently
      expect(processingTime).toBeLessThan(45000); // Under 45 seconds
      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB memory increase
      expect(result.analysis_results).toBeDefined();
    });
  });

  describe('Queue System Load Testing', () => {
    it('should manage request queue effectively under load', async () => {
      const queueCapacity = 100;
      const requestCount = 150; // Exceed queue capacity
      const promises: Promise<any>[] = [];

      // Fill queue beyond capacity
      for (let i = 0; i < requestCount; i++) {
        const businessData = {
          business_name: `Queue Test Restaurant ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        promises.push(
          vcOrchestrator.executeAnalysis(`queue-test-${i}`, businessData)
            .then(result => ({
              success: true,
              queuePosition: result.queue_position || 0,
              waitTime: result.queue_wait_time_ms || 0,
              wasQueued: result.was_queued || false
            }))
            .catch(error => ({
              success: false,
              error: error.message,
              wasRejected: error.message.includes('queue full')
            }))
        );
      }

      const results = await Promise.all(promises);
      const successfulRequests = results.filter(r => r.success);
      const queuedRequests = results.filter(r => r.success && r.wasQueued);
      const rejectedRequests = results.filter(r => !r.success && r.wasRejected);

      const queueUtilization = queuedRequests.length / requestCount;
      const rejectionRate = rejectedRequests.length / requestCount;

      // Queue should handle overflow gracefully
      expect(queueUtilization).toBeGreaterThan(0.3); // Queue was utilized
      expect(rejectionRate).toBeLessThan(0.4); // Not too many rejections
      expect(successfulRequests.length).toBeGreaterThan(requestCount * 0.6); // At least 60% processed
    });

    it('should prioritize requests appropriately', async () => {
      const highPriorityRequests = 10;
      const normalPriorityRequests = 20;
      const allPromises: Promise<any>[] = [];

      // Submit normal priority requests first
      for (let i = 0; i < normalPriorityRequests; i++) {
        const businessData = {
          business_name: `Normal Priority ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah',
          priority: 'normal'
        };

        allPromises.push(
          vcOrchestrator.executeAnalysis(`normal-${i}`, businessData)
            .then(result => ({ type: 'normal', queuePosition: result.queue_position || 0 }))
        );
      }

      // Submit high priority requests
      for (let i = 0; i < highPriorityRequests; i++) {
        const businessData = {
          business_name: `High Priority ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Ketten-Katrin', // Enterprise persona = high priority
          priority: 'high'
        };

        allPromises.push(
          vcOrchestrator.executeAnalysis(`high-${i}`, businessData)
            .then(result => ({ type: 'high', queuePosition: result.queue_position || 0 }))
        );
      }

      const results = await Promise.all(allPromises);
      const highPriorityResults = results.filter(r => r.type === 'high');
      const normalPriorityResults = results.filter(r => r.type === 'normal');

      // High priority requests should have lower queue positions on average
      const avgHighPriorityPosition = highPriorityResults.reduce((sum, r) => sum + r.queuePosition, 0) / highPriorityResults.length;
      const avgNormalPriorityPosition = normalPriorityResults.reduce((sum, r) => sum + r.queuePosition, 0) / normalPriorityResults.length;

      expect(avgHighPriorityPosition).toBeLessThan(avgNormalPriorityPosition);
    });
  });

  describe('Cost Control Under Load', () => {
    it('should enforce cost limits under high load', async () => {
      // Mock approaching cost limit
      jest.spyOn(costControl, 'getCurrentMonthlyCost').mockResolvedValue(480); // Near $500 limit
      jest.spyOn(costControl, 'isMonthlyLimitReached').mockResolvedValue(false);

      const requestCount = 30;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < requestCount; i++) {
        const businessData = {
          business_name: `Cost Control Test ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Der Profi' // More expensive persona
        };

        promises.push(
          vcOrchestrator.executeAnalysis(`cost-test-${i}`, businessData)
            .then(result => ({
              success: true,
              costWarning: result.cost_warnings?.length > 0,
              degraded: result.degraded_service || false
            }))
            .catch(error => ({ success: false, error: error.message }))
        );
      }

      const results = await Promise.all(promises);
      const successfulRequests = results.filter(r => r.success);
      const costWarnings = results.filter(r => r.success && r.costWarning);
      const degradedRequests = results.filter(r => r.success && r.degraded);

      // Cost control should activate under load
      expect(costWarnings.length).toBeGreaterThan(0);
      expect(degradedRequests.length / successfulRequests.length).toBeLessThan(0.3); // Less than 30% degraded
    });

    it('should throttle requests when cost limit is reached', async () => {
      // Mock cost limit reached
      jest.spyOn(costControl, 'isMonthlyLimitReached').mockResolvedValue(true);

      const requestCount = 20;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < requestCount; i++) {
        const businessData = {
          business_name: `Throttle Test ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        promises.push(
          vcOrchestrator.executeAnalysis(`throttle-test-${i}`, businessData)
            .then(result => ({
              success: true,
              throttled: result.cost_limit_reached || false,
              degraded: result.degraded_service || false
            }))
            .catch(error => ({ success: false, error: error.message }))
        );
      }

      const results = await Promise.all(promises);
      const throttledRequests = results.filter(r => r.success && r.throttled);

      // Most requests should be throttled when limit is reached
      expect(throttledRequests.length / results.length).toBeGreaterThan(0.8);
    });
  });

  describe('Performance Monitoring and Alerting', () => {
    it('should track performance metrics accurately under load', async () => {
      const monitoringDuration = 20000; // 20 seconds
      const requestInterval = 500; // 2 requests per second
      const startTime = Date.now();
      let requestCount = 0;

      while (Date.now() - startTime < monitoringDuration) {
        const businessData = {
          business_name: `Monitoring Test ${requestCount}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        await vcOrchestrator.executeAnalysis(`monitoring-${requestCount}`, businessData);
        requestCount++;

        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // Get performance metrics
      const metrics = await performanceMonitor.getMetrics();

      expect(metrics.totalRequests).toBe(requestCount);
      expect(metrics.averageResponseTime).toBeLessThan(10000);
      expect(metrics.errorRate).toBeLessThan(0.05);
      expect(metrics.throughput).toBeGreaterThan(1.5); // At least 1.5 requests/second
    });

    it('should trigger alerts for performance degradation', async () => {
      // Mock slow responses to trigger alerts
      mockBedrockClient.send.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              body: new TextEncoder().encode(JSON.stringify({
                content: [{ text: JSON.stringify({ visibility_score: 70 }) }]
              }))
            });
          }, 15000); // 15 second delay to trigger alert
        })
      );

      const alertPromises: Promise<any>[] = [];
      const requestCount = 5;

      for (let i = 0; i < requestCount; i++) {
        const businessData = {
          business_name: `Alert Test ${i}`,
          location: { city: 'München', country: 'Germany' },
          main_category: 'restaurant',
          persona_type: 'Solo-Sarah'
        };

        alertPromises.push(
          vcOrchestrator.executeAnalysis(`alert-test-${i}`, businessData)
            .then(result => ({ success: true, responseTime: result.processing_time_ms }))
            .catch(error => ({ success: false, error: error.message }))
        );
      }

      const results = await Promise.all(alertPromises);
      const alerts = await performanceMonitor.getActiveAlerts();

      // Should trigger performance alerts
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.type === 'high_response_time')).toBe(true);
    });
  });
});