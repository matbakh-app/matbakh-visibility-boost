/**
 * Tests for Deployment Monitor
 */

/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import type { AlertConfig } from '../deployment-monitor';
import { DeploymentMonitor } from '../deployment-monitor';

describe('DeploymentMonitor', () => {
    let monitor: DeploymentMonitor;
    let mockAlertConfig: AlertConfig;

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        // Create monitor with fast intervals and predictable metrics for testing
        const mockProvider = () => ({
            errorRate: 1.5,
            responseTime: 120,
            throughput: 1000,
            availability: 99.9,
            activeConnections: 250
        });

        monitor = new DeploymentMonitor({
            collectionIntervalMs: 10, // Very fast for tests
            metricsProvider: mockProvider
        });
        mockAlertConfig = {
            type: 'webhook',
            endpoint: 'https://hooks.slack.com/test',
            threshold: {
                errorRate: 5,
                responseTime: 1000,
                deploymentDuration: 30 * 60 * 1000
            },
            enabled: true
        };
    });

    afterEach(() => {
        // Clean up any running monitoring
        monitor.stopMonitoring('test-deployment');
    });

    describe('startMonitoring', () => {
        it('should start monitoring a deployment', () => {
            expect(() => {
                monitor.startMonitoring('test-deployment', 'staging', mockAlertConfig);
            }).not.toThrow();
        });

        it('should stop existing monitoring when starting new monitoring for same deployment', () => {
            monitor.startMonitoring('test-deployment', 'staging', mockAlertConfig);

            // Starting monitoring again should not throw
            expect(() => {
                monitor.startMonitoring('test-deployment', 'staging', mockAlertConfig);
            }).not.toThrow();
        });
    });

    describe('stopMonitoring', () => {
        it('should stop monitoring a deployment', () => {
            monitor.startMonitoring('test-deployment', 'staging', mockAlertConfig);

            expect(() => {
                monitor.stopMonitoring('test-deployment');
            }).not.toThrow();
        });

        it('should handle stopping monitoring for non-existent deployment', () => {
            expect(() => {
                monitor.stopMonitoring('non-existent-deployment');
            }).not.toThrow();
        });
    });

    describe('getDeploymentMetrics', () => {
        it('should return empty array for deployment without metrics', () => {
            const metrics = monitor.getDeploymentMetrics('test-deployment');
            expect(metrics).toEqual([]);
        });

        it('should return metrics after monitoring starts', () => {
            monitor.startMonitoring('test-deployment', 'staging', mockAlertConfig);

            // Advance fake timers to trigger metrics collection
            jest.advanceTimersByTime(50); // 5 collection cycles

            const metrics = monitor.getDeploymentMetrics('test-deployment');
            expect(metrics.length).toBeGreaterThan(0);

            const latestMetrics = metrics[metrics.length - 1];
            expect(latestMetrics.deploymentId).toBe('test-deployment');
            expect(latestMetrics.environment).toBe('staging');
            expect(latestMetrics.metrics.errorRate).toBe(1.5); // From mock provider
            expect(latestMetrics.metrics.responseTime).toBe(120);
            expect(latestMetrics.metrics.throughput).toBe(1000);
            expect(latestMetrics.metrics.availability).toBe(99.9);
            expect(latestMetrics.metrics.activeConnections).toBe(250);

            monitor.stopMonitoring('test-deployment');
        });
    });

    describe('getDeploymentAlerts', () => {
        it('should return empty array for deployment without alerts', () => {
            const alerts = monitor.getDeploymentAlerts('test-deployment');
            expect(alerts).toEqual([]);
        });
    });

    describe('acknowledgeAlert', () => {
        it('should return false for non-existent alert', () => {
            const result = monitor.acknowledgeAlert('non-existent-alert');
            expect(result).toBe(false);
        });
    });

    describe('resolveAlert', () => {
        it('should return false for non-existent alert', () => {
            const result = monitor.resolveAlert('non-existent-alert');
            expect(result).toBe(false);
        });
    });

    describe('getActiveAlerts', () => {
        it('should return empty array initially', () => {
            const alerts = monitor.getActiveAlerts();
            expect(alerts).toEqual([]);
        });
    });

    describe('generateHealthReport', () => {
        it('should generate report for deployment without metrics', () => {
            const report = monitor.generateHealthReport('test-deployment');

            expect(report.deployment).toBe('test-deployment');
            expect(report.status).toBe('warning');
            expect(report.summary.avgErrorRate).toBe(0);
            expect(report.summary.avgResponseTime).toBe(0);
            expect(report.summary.availability).toBe(0);
            expect(report.summary.totalAlerts).toBe(0);
            expect(report.summary.activeAlerts).toBe(0);
            expect(report.recommendations).toContain('No metrics available for this deployment');
        });

        it('should generate healthy report for good metrics', () => {
            // Start monitoring to generate some metrics
            monitor.startMonitoring('test-deployment', 'staging', mockAlertConfig);

            // Advance timers to collect metrics
            jest.advanceTimersByTime(100); // 10 collection cycles

            const report = monitor.generateHealthReport('test-deployment');

            expect(report.deployment).toBe('test-deployment');
            expect(['healthy', 'warning', 'critical']).toContain(report.status);
            expect(report.summary.avgErrorRate).toBe(1.5); // From mock provider
            expect(report.summary.avgResponseTime).toBe(120);
            expect(report.summary.availability).toBe(99.9);
            expect(report.recommendations.length).toBeGreaterThan(0);

            monitor.stopMonitoring('test-deployment');
        });
    });

    describe('alert thresholds', () => {
        it('should handle disabled alerts', () => {
            const disabledConfig = {
                ...mockAlertConfig,
                enabled: false
            };

            expect(() => {
                monitor.startMonitoring('test-deployment', 'staging', disabledConfig);
            }).not.toThrow();
        });

        it('should handle different alert types', () => {
            const emailConfig = {
                ...mockAlertConfig,
                type: 'email' as const,
                endpoint: 'admin@matbakh.app'
            };

            expect(() => {
                monitor.startMonitoring('test-deployment', 'staging', emailConfig);
            }).not.toThrow();

            const slackConfig = {
                ...mockAlertConfig,
                type: 'slack' as const,
                endpoint: 'https://hooks.slack.com/services/test'
            };

            expect(() => {
                monitor.startMonitoring('test-deployment-2', 'staging', slackConfig);
            }).not.toThrow();

            monitor.stopMonitoring('test-deployment');
            monitor.stopMonitoring('test-deployment-2');
        });
    });

    describe('metrics collection', () => {
        it('should limit metrics history to 100 data points', () => {
            monitor.startMonitoring('test-deployment', 'staging', mockAlertConfig);

            // Advance timers to collect many metrics
            jest.advanceTimersByTime(1000); // 100 collection cycles

            const metrics = monitor.getDeploymentMetrics('test-deployment');
            expect(metrics.length).toBeLessThanOrEqual(100);

            monitor.stopMonitoring('test-deployment');
        });

        it('should collect metrics with proper structure', () => {
            monitor.startMonitoring('test-deployment', 'staging', mockAlertConfig);

            // Advance timers to collect metrics
            jest.advanceTimersByTime(20); // 2 collection cycles

            const metrics = monitor.getDeploymentMetrics('test-deployment');
            expect(metrics.length).toBeGreaterThan(0);

            const metric = metrics[0];
            expect(metric.timestamp).toBeInstanceOf(Date);
            expect(metric.deploymentId).toBe('test-deployment');
            expect(metric.environment).toBe('staging');
            expect(metric.metrics).toBeDefined();
            expect(metric.alerts).toBeDefined();
            expect(Array.isArray(metric.alerts)).toBe(true);

            monitor.stopMonitoring('test-deployment');
        });
    });

    describe('error handling', () => {
        it('should handle monitoring errors gracefully', () => {
            // Test with invalid configuration
            const invalidConfig = {
                ...mockAlertConfig,
                endpoint: '' // Invalid endpoint
            };

            expect(() => {
                monitor.startMonitoring('test-deployment', 'staging', invalidConfig);
            }).not.toThrow();

            monitor.stopMonitoring('test-deployment');
        });

        it('should handle multiple deployments', () => {
            monitor.startMonitoring('deployment-1', 'staging', mockAlertConfig);
            monitor.startMonitoring('deployment-2', 'production', mockAlertConfig);

            expect(monitor.getDeploymentMetrics('deployment-1')).toBeDefined();
            expect(monitor.getDeploymentMetrics('deployment-2')).toBeDefined();

            monitor.stopMonitoring('deployment-1');
            monitor.stopMonitoring('deployment-2');
        });
    });
});