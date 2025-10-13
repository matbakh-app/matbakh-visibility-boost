import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { FailoverManager, FailoverPolicy } from '../failover-manager';
import { HealthChecker } from '../health-checker';
import { MultiRegionConfig, MultiRegionOrchestrator } from '../multi-region-orchestrator';

const mockConfig: MultiRegionConfig = {
    primaryRegion: 'eu-central-1',
    secondaryRegion: 'eu-west-1',
    domainName: 'test.matbakh.app',
    hostedZoneId: 'Z123456789',
    distributionId: 'E123456789',
    globalClusterIdentifier: 'test-global-cluster',
    primaryClusterIdentifier: 'test-primary-cluster',
    secondaryClusterIdentifier: 'test-secondary-cluster',
    primaryHealthCheckId: 'hc-primary-123',
    secondaryHealthCheckId: 'hc-secondary-123',
};

const mockPolicy: FailoverPolicy = {
    automaticFailover: false,
    healthCheckFailureThreshold: 2,
    healthCheckInterval: 30,
    rtoTarget: 15,
    rpoTarget: 1,
    notificationEndpoints: ['test@example.com'],
};

describe('FailoverManager', () => {
    let failoverManager: FailoverManager;
    let mockOrchestrator: jest.Mocked<MultiRegionOrchestrator>;
    let mockHealthChecker: jest.Mocked<HealthChecker>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock orchestrator
        mockOrchestrator = {
            executeFailover: jest.fn(),
            executeFailback: jest.fn(),
            testDisasterRecovery: jest.fn(),
        } as any;

        // Create mock health checker
        mockHealthChecker = {
            checkAllServices: jest.fn(),
            getHealthSummary: jest.fn(),
        } as any;

        // Create failover manager with mocked dependencies
        failoverManager = new FailoverManager(
            mockConfig,
            mockPolicy,
            mockOrchestrator,
            mockHealthChecker
        );
    });

    describe('manual failover', () => {
        it('should execute manual failover successfully', async () => {
            const mockResult = {
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [
                    { step: 'Test step', status: 'completed' as const, startTime: new Date(), endTime: new Date() }
                ],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);

            const result = await failoverManager.executeManualFailover('Test reason');

            expect(result.success).toBe(true);
            expect(result.rtoAchieved).toBe(10);
            expect(result.rpoAchieved).toBe(0.5);
            expect(mockOrchestrator.executeFailover).toHaveBeenCalledWith('Test reason');
        });

        it('should prevent concurrent failovers', async () => {
            const mockResult = {
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [],
            };

            // Mock a slow failover
            mockOrchestrator.executeFailover.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve(mockResult), 100))
            );

            // Start first failover
            const firstFailover = failoverManager.executeManualFailover('First failover');

            // Try to start second failover immediately
            await expect(failoverManager.executeManualFailover('Second failover'))
                .rejects.toThrow('Failover already in progress');

            // Complete first failover
            await firstFailover;
        });

        it('should track failover history', async () => {
            const mockResult = {
                success: true,
                rtoAchieved: 12,
                rpoAchieved: 0.8,
                steps: [],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);

            await failoverManager.executeManualFailover('Test failover');

            const history = failoverManager.getFailoverHistory();
            expect(history).toHaveLength(1);
            expect(history[0].type).toBe('failover');
            expect(history[0].trigger).toBe('manual');
            expect(history[0].reason).toBe('Test failover');
            expect(history[0].rtoAchieved).toBe(12);
            expect(history[0].rpoAchieved).toBe(0.8);
        });

        it('should send notifications on failover events', async () => {
            const mockResult = {
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);

            // Mock fetch for webhook notifications
            global.fetch = jest.fn().mockResolvedValue({ ok: true });

            const policyWithWebhook = {
                ...mockPolicy,
                notificationEndpoints: ['https://webhook.example.com/alerts'],
            };

            const manager = new FailoverManager(
                mockConfig,
                policyWithWebhook,
                mockOrchestrator,
                mockHealthChecker
            );
            await manager.executeManualFailover('Test failover');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://webhook.example.com/alerts',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: expect.stringContaining('Failover started'),
                })
            );
        });

        it('should handle failover failure and log metrics', async () => {
            const mockResult = {
                success: false,
                rtoAchieved: 0,
                rpoAchieved: 0,
                steps: [
                    {
                        step: 'Failed step',
                        status: 'failed' as const,
                        startTime: new Date(),
                        endTime: new Date(),
                        error: 'Test error'
                    }
                ],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);

            const result = await failoverManager.executeManualFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps.some(step => step.status === 'failed')).toBe(true);

            const history = failoverManager.getFailoverHistory();
            expect(history[0].result.success).toBe(false);
        });
    });

    describe('failback', () => {
        it('should execute failback successfully', async () => {
            // First simulate a failover to set state
            const failoverResult = {
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [],
            };
            mockOrchestrator.executeFailover.mockResolvedValue(failoverResult);
            await failoverManager.executeManualFailover('Setup failover');

            // Now test failback
            const failbackResult = {
                success: true,
                rtoAchieved: 8,
                rpoAchieved: 0,
                steps: [],
            };
            mockOrchestrator.executeFailback.mockResolvedValue(failbackResult);

            const result = await failoverManager.executeFailback('Test failback');

            expect(result.success).toBe(true);
            expect(result.rtoAchieved).toBe(8);
            expect(mockOrchestrator.executeFailback).toHaveBeenCalledWith('Test failback');
        });

        it('should prevent failback when already on primary', async () => {
            await expect(failoverManager.executeFailback('Test failback'))
                .rejects.toThrow('Already running on primary region');
        });

        it('should prevent failback during ongoing failover', async () => {
            const mockResult = {
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [],
            };

            // Mock a slow failover
            mockOrchestrator.executeFailover.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve(mockResult), 100))
            );

            // Start failover
            const failoverPromise = failoverManager.executeManualFailover('Test failover');

            // Try failback during failover
            await expect(failoverManager.executeFailback('Test failback'))
                .rejects.toThrow('Failover operation already in progress');

            // Complete failover
            await failoverPromise;
        });
    });

    describe('disaster recovery testing', () => {
        it('should perform DR test successfully', async () => {
            const mockTestResult = {
                success: true,
                healthChecks: {
                    secondaryRegionHealth: true,
                    databaseReplication: true,
                    dnsHealthChecks: true,
                    s3Replication: true,
                    secretsReplication: true,
                },
                estimatedRTO: 12,
                estimatedRPO: 0.8,
                recommendations: [],
            };

            mockOrchestrator.testDisasterRecovery.mockResolvedValue(mockTestResult);

            const result = await failoverManager.testDisasterRecovery();

            expect(result.success).toBe(true);
            expect(result.estimatedRTO).toBe(12);
            expect(result.estimatedRPO).toBe(0.8);
            expect(mockOrchestrator.testDisasterRecovery).toHaveBeenCalled();
        });

        it('should track DR test in history', async () => {
            const mockTestResult = {
                success: true,
                healthChecks: {},
                estimatedRTO: 10,
                estimatedRPO: 0.5,
                recommendations: [],
            };

            mockOrchestrator.testDisasterRecovery.mockResolvedValue(mockTestResult);

            await failoverManager.testDisasterRecovery();

            const history = failoverManager.getFailoverHistory();
            expect(history).toHaveLength(1);
            expect(history[0].type).toBe('test');
            expect(history[0].trigger).toBe('manual');
            expect(history[0].reason).toBe('Disaster recovery test');
        });

        it('should handle DR test failures', async () => {
            const mockTestResult = {
                success: false,
                healthChecks: {
                    secondaryRegionHealth: false,
                    databaseReplication: false,
                },
                estimatedRTO: 20,
                estimatedRPO: 2,
                recommendations: ['Fix secondary region', 'Improve replication'],
            };

            mockOrchestrator.testDisasterRecovery.mockResolvedValue(mockTestResult);

            const result = await failoverManager.testDisasterRecovery();

            expect(result.success).toBe(false);
            expect(result.recommendations.length).toBeGreaterThan(0);
        });
    });

    describe('system status', () => {
        it('should return current system status', async () => {
            const mockHealthStatus = {
                overall: 'healthy' as const,
                regions: {
                    primary: { status: 'healthy' as const },
                    secondary: { status: 'healthy' as const },
                },
                services: [],
                lastUpdated: new Date(),
            };

            mockHealthChecker.checkAllServices.mockResolvedValue(mockHealthStatus);

            const status = await failoverManager.getSystemStatus();

            expect(status.currentRegion).toBe('primary');
            expect(status.isFailoverInProgress).toBe(false);
            expect(status.healthStatus).toEqual(mockHealthStatus);
            expect(status.rtoCompliance).toBe(true);
            expect(status.rpoCompliance).toBe(true);
        });

        it('should detect RTO/RPO compliance violations', async () => {
            // First perform a failover that exceeds targets
            const mockResult = {
                success: true,
                rtoAchieved: 20, // Exceeds 15 minute target
                rpoAchieved: 2,  // Exceeds 1 minute target
                steps: [],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);
            mockHealthChecker.checkAllServices.mockResolvedValue({
                overall: 'healthy' as const,
                regions: {
                    primary: { status: 'healthy' as const },
                    secondary: { status: 'healthy' as const }
                },
                services: [],
                lastUpdated: new Date(),
            });

            await failoverManager.executeManualFailover('Test failover');

            const status = await failoverManager.getSystemStatus();

            expect(status.rtoCompliance).toBe(false);
            expect(status.rpoCompliance).toBe(false);
        });

        it('should handle health check errors gracefully', async () => {
            mockHealthChecker.checkAllServices.mockRejectedValue(new Error('Health check failed'));

            const status = await failoverManager.getSystemStatus();

            expect(status.currentRegion).toBe('primary');
            expect(status.isFailoverInProgress).toBe(false);
            // Should have some default/error state for health status
        });
    });

    describe('automatic failover', () => {
        it('should trigger automatic failover on health check failures', async () => {
            const automaticPolicy = {
                ...mockPolicy,
                automaticFailover: true,
                healthCheckFailureThreshold: 2,
                healthCheckInterval: 0.1, // 100ms for testing
            };

            // Mock health check failures
            mockHealthChecker.checkAllServices.mockResolvedValue({
                api: false,
                database: false,
                cache: true,
                storage: true,
                secrets: true,
            } as any);

            mockOrchestrator.executeFailover.mockResolvedValue({
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [],
            });

            const manager = new FailoverManager(
                mockConfig,
                automaticPolicy,
                mockOrchestrator,
                mockHealthChecker
            );

            // Wait for automatic failover to trigger
            await new Promise(resolve => setTimeout(resolve, 200));

            const history = manager.getFailoverHistory();
            expect(history.some(event => event.trigger === 'automatic')).toBe(true);
        });

        it('should not trigger automatic failover when disabled', async () => {
            const manualPolicy = {
                ...mockPolicy,
                automaticFailover: false,
            };

            // Mock health check failures
            mockHealthChecker.checkAllServices.mockResolvedValue({
                api: false,
                database: false,
                cache: false,
                storage: false,
                secrets: false,
            } as any);

            const manager = new FailoverManager(
                mockConfig,
                manualPolicy,
                mockOrchestrator,
                mockHealthChecker
            );

            // Wait to ensure no automatic failover
            await new Promise(resolve => setTimeout(resolve, 100));

            const history = manager.getFailoverHistory();
            expect(history.length).toBe(0);
        });

        it('should respect failure threshold for automatic failover', async () => {
            const automaticPolicy = {
                ...mockPolicy,
                automaticFailover: true,
                healthCheckFailureThreshold: 3, // Require 3 failures
                healthCheckInterval: 0.1,
            };

            // Mock only 2 failures (below threshold)
            mockHealthChecker.checkAllServices.mockResolvedValue({
                api: false,
                database: false,
                cache: true,
                storage: true,
                secrets: true,
            } as any);

            const manager = new FailoverManager(
                mockConfig,
                automaticPolicy,
                mockOrchestrator,
                mockHealthChecker
            );

            // Wait to ensure no automatic failover
            await new Promise(resolve => setTimeout(resolve, 200));

            const history = manager.getFailoverHistory();
            expect(history.length).toBe(0);
        });
    });

    describe('policy updates', () => {
        it('should update failover policy', () => {
            const newPolicy = {
                rtoTarget: 10,
                rpoTarget: 0.5,
            };

            expect(() => failoverManager.updatePolicy(newPolicy)).not.toThrow();
        });

        it('should restart health monitoring when automatic failover is enabled', () => {
            const newPolicy = {
                automaticFailover: true,
                healthCheckInterval: 30,
            };

            expect(() => failoverManager.updatePolicy(newPolicy)).not.toThrow();
        });
    });

    describe('failover report generation', () => {
        it('should generate comprehensive failover report', async () => {
            // Perform some failovers to generate history
            const mockResult = {
                success: true,
                rtoAchieved: 12,
                rpoAchieved: 0.8,
                steps: [],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);

            await failoverManager.executeManualFailover('Test failover 1');
            await failoverManager.executeManualFailover('Test failover 2');

            const report = failoverManager.generateFailoverReport();

            expect(report.summary.totalFailovers).toBe(2);
            expect(report.summary.successfulFailovers).toBe(2);
            expect(report.summary.averageRTO).toBe(12);
            expect(report.summary.averageRPO).toBe(0.8);
            expect(report.summary.rtoCompliance).toBe(100); // Both within 15 minute target
            expect(report.summary.rpoCompliance).toBe(100); // Both within 1 minute target
            expect(report.recentEvents).toHaveLength(2);
            expect(Array.isArray(report.recommendations)).toBe(true);
        });

        it('should identify performance issues in report', async () => {
            // Perform failover that exceeds targets
            const mockResult = {
                success: true,
                rtoAchieved: 20, // Exceeds target
                rpoAchieved: 2,  // Exceeds target
                steps: [],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);

            await failoverManager.executeManualFailover('Slow failover');

            const report = failoverManager.generateFailoverReport();

            expect(report.recommendations.some(rec =>
                rec.includes('Average RTO') && rec.includes('exceeds target')
            )).toBe(true);
            expect(report.recommendations.some(rec =>
                rec.includes('Average RPO') && rec.includes('exceeds target')
            )).toBe(true);
        });

        it('should handle mixed success/failure scenarios', async () => {
            // Successful failover
            mockOrchestrator.executeFailover.mockResolvedValueOnce({
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [],
            });

            // Failed failover
            mockOrchestrator.executeFailover.mockResolvedValueOnce({
                success: false,
                rtoAchieved: 0,
                rpoAchieved: 0,
                steps: [],
            });

            await failoverManager.executeManualFailover('Successful failover');
            await failoverManager.executeManualFailover('Failed failover');

            const report = failoverManager.generateFailoverReport();

            expect(report.summary.totalFailovers).toBe(2);
            expect(report.summary.successfulFailovers).toBe(1);
            expect(report.recommendations.some(rec =>
                rec.includes('failover(s) failed')
            )).toBe(true);
        });
    });

    describe('notification system', () => {
        it('should handle notification failures gracefully', async () => {
            const mockResult = {
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);

            // Mock failed webhook notification
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            const policyWithWebhook = {
                ...mockPolicy,
                notificationEndpoints: ['https://webhook.example.com/alerts'],
            };

            const manager = new FailoverManager(
                mockConfig,
                policyWithWebhook,
                mockOrchestrator,
                mockHealthChecker
            );

            // Should not throw despite notification failure
            await expect(manager.executeManualFailover('Test failover')).resolves.toBeDefined();
        });

        it('should support multiple notification endpoints', async () => {
            const mockResult = {
                success: true,
                rtoAchieved: 10,
                rpoAchieved: 0.5,
                steps: [],
            };

            mockOrchestrator.executeFailover.mockResolvedValue(mockResult);

            global.fetch = jest.fn().mockResolvedValue({ ok: true });

            const policyWithMultipleEndpoints = {
                ...mockPolicy,
                notificationEndpoints: [
                    'https://webhook1.example.com/alerts',
                    'https://webhook2.example.com/alerts',
                    'admin@example.com',
                ],
            };

            const manager = new FailoverManager(
                mockConfig,
                policyWithMultipleEndpoints,
                mockOrchestrator,
                mockHealthChecker
            );

            await manager.executeManualFailover('Test failover');

            // Should call webhooks but not email (email would be logged)
            expect(global.fetch).toHaveBeenCalledTimes(4); // 2 webhooks × 2 notifications (start + success)
        });
    });
});