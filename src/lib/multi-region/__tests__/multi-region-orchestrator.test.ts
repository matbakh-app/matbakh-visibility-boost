import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MultiRegionConfig, MultiRegionOrchestrator } from '../multi-region-orchestrator';

// Mock AWS SDK clients directly
const mockRoute53Send = jest.fn();
const mockRDSSend = jest.fn();
const mockCloudFrontSend = jest.fn();
const mockSSMSend = jest.fn();
const mockCloudWatchSend = jest.fn();

// Mock AWS SDK modules
jest.mock('@aws-sdk/client-route-53', () => ({
    Route53Client: jest.fn(() => ({ send: mockRoute53Send })),
    ChangeResourceRecordSetsCommand: jest.fn(),
    GetHealthCheckCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-rds', () => ({
    RDSClient: jest.fn(() => ({ send: mockRDSSend })),
    ModifyDBClusterCommand: jest.fn(),
    DescribeDBClustersCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-cloudfront', () => ({
    CloudFrontClient: jest.fn(() => ({ send: mockCloudFrontSend })),
    CreateInvalidationCommand: jest.fn(),
    GetDistributionCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-ssm', () => ({
    SSMClient: jest.fn(() => ({ send: mockSSMSend })),
    PutParameterCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-cloudwatch', () => ({
    CloudWatchClient: jest.fn(() => ({ send: mockCloudWatchSend })),
    PutMetricDataCommand: jest.fn(),
}));

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

describe('MultiRegionOrchestrator', () => {
    let orchestrator: MultiRegionOrchestrator;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        mockRoute53Send.mockReset();
        mockRDSSend.mockReset();
        mockCloudFrontSend.mockReset();
        mockSSMSend.mockReset();
        mockCloudWatchSend.mockReset();

        orchestrator = new MultiRegionOrchestrator(mockConfig);
    });

    describe('executeFailover', () => {
        it('should execute successful failover with all steps', async () => {
            // Mock successful secondary health validation
            mockRoute53Send.mockResolvedValueOnce({
                StatusList: [{ Status: 'Success', CheckedTime: new Date(), Latency: 100 }],
            });

            // Mock successful database promotion
            mockRDSSend
                .mockResolvedValueOnce({}) // ModifyDBClusterCommand
                .mockResolvedValueOnce({
                    DBClusters: [
                        {
                            Status: 'available',
                            GlobalWriteForwardingStatus: 'disabled', // Promotion complete
                        },
                    ],
                }); // DescribeDBClustersCommand

            // Mock successful DNS update
            mockRoute53Send.mockResolvedValueOnce({
                ChangeInfo: { Id: 'change-123', Status: 'INSYNC' },
            });

            // Mock successful CloudFront update
            mockCloudFrontSend
                .mockResolvedValueOnce({
                    Distribution: {
                        DistributionConfig: {
                            Origins: { Quantity: 1, Items: [] },
                            DefaultCacheBehavior: {},
                        },
                    },
                })
                .mockResolvedValueOnce({
                    Invalidation: { Id: 'invalidation-123' },
                });

            // Mock successful parameter updates
            mockSSMSend.mockResolvedValue({});

            // Mock successful metrics logging
            mockCloudWatchSend.mockResolvedValue({});

            // Mock successful health validation
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
            });

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(true);
            expect(result.steps).toHaveLength(6);
            expect(result.steps.every(step => step.status === 'completed')).toBe(true);
            expect(result.rtoAchieved).toBeGreaterThan(0);
            expect(result.rpoAchieved).toBeGreaterThanOrEqual(0);
            expect(result.rollbackPlan).toBeDefined();

            // Verify AWS calls were made
            expect(mockRoute53Send).toHaveBeenCalledTimes(2); // Health check + DNS update
            expect(mockRDSSend).toHaveBeenCalledTimes(3); // Modify + Describe + RPO calculation
            expect(mockCloudFrontSend).toHaveBeenCalledTimes(2); // Get + Invalidate
            expect(mockSSMSend).toHaveBeenCalledTimes(2); // 2 parameters
            expect(mockCloudWatchSend).toHaveBeenCalledTimes(1); // Metrics
        });

        it('should handle secondary region health check failure', async () => {
            // Mock unhealthy secondary region
            mockRoute53Send.mockResolvedValueOnce({
                StatusList: [{ Status: 'Failure', CheckedTime: new Date() }],
            });

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps).toHaveLength(1);
            expect(result.steps[0].status).toBe('failed');
            expect(result.steps[0].error).toContain('Secondary region is not healthy');

            // Verify no further AWS calls were made
            expect(mockRDSSend).toHaveBeenCalledTimes(0);
        });

        it('should handle database promotion failure', async () => {
            // Mock healthy secondary region
            mockRoute53Send.mockResolvedValueOnce({
                StatusList: [{ Status: 'Success' }],
            });

            // Mock database promotion failure
            mockRDSSend.mockRejectedValueOnce(new Error('Database promotion failed'));

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps).toHaveLength(2);
            expect(result.steps[0].status).toBe('completed'); // Health check passed
            expect(result.steps[1].status).toBe('failed'); // Database promotion failed
            expect(result.steps[1].error).toContain('Database promotion failed');
        });

        it('should handle DNS update failure', async () => {
            // Mock successful health check and database promotion
            mockRoute53Send.mockResolvedValueOnce({
                StatusList: [{ Status: 'Success' }],
            });

            mockRDSSend
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({
                    DBClusters: [{ Status: 'available', GlobalWriteForwardingStatus: 'disabled' }],
                });

            // Mock DNS update failure
            mockRoute53Send.mockRejectedValueOnce(new Error('DNS update failed'));

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps).toHaveLength(3);
            expect(result.steps[0].status).toBe('completed'); // Health check
            expect(result.steps[1].status).toBe('completed'); // Database promotion
            expect(result.steps[2].status).toBe('failed'); // DNS update
            expect(result.steps[2].error).toContain('DNS update failed');
        });

        it('should handle CloudFront update failure', async () => {
            // Mock successful steps until CloudFront
            mockRoute53Send
                .mockResolvedValueOnce({ StatusList: [{ Status: 'Success' }] })
                .mockResolvedValueOnce({ ChangeInfo: { Id: 'change-123', Status: 'INSYNC' } });

            mockRDSSend
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({
                    DBClusters: [{ Status: 'available', GlobalWriteForwardingStatus: 'disabled' }],
                });

            // Mock CloudFront failure
            mockCloudFrontSend.mockRejectedValueOnce(new Error('CloudFront update failed'));

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps).toHaveLength(4);
            expect(result.steps[3].status).toBe('failed');
            expect(result.steps[3].error).toContain('CloudFront update failed');
        });

        it('should handle parameter update failure', async () => {
            // Mock successful steps until parameters
            mockRoute53Send
                .mockResolvedValueOnce({ StatusList: [{ Status: 'Success' }] })
                .mockResolvedValueOnce({ ChangeInfo: { Id: 'change-123', Status: 'INSYNC' } });

            mockRDSSend
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({
                    DBClusters: [{ Status: 'available', GlobalWriteForwardingStatus: 'disabled' }],
                });

            mockCloudFrontSend
                .mockResolvedValueOnce({
                    Distribution: { DistributionConfig: { Origins: { Quantity: 1, Items: [] }, DefaultCacheBehavior: {} } },
                })
                .mockResolvedValueOnce({ Invalidation: { Id: 'invalidation-123' } });

            // Mock parameter update failure
            mockSSMSend.mockRejectedValueOnce(new Error('Parameter update failed'));

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps).toHaveLength(5);
            expect(result.steps[4].status).toBe('failed');
            expect(result.steps[4].error).toContain('Parameter update failed');
        });

        it('should handle health validation failure after switch', async () => {
            // Mock successful steps until health validation
            mockRoute53Send
                .mockResolvedValueOnce({ StatusList: [{ Status: 'Success' }] })
                .mockResolvedValueOnce({ ChangeInfo: { Id: 'change-123', Status: 'INSYNC' } });

            mockRDSSend
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({
                    DBClusters: [{ Status: 'available', GlobalWriteForwardingStatus: 'disabled' }],
                });

            mockCloudFrontSend
                .mockResolvedValueOnce({
                    Distribution: { DistributionConfig: { Origins: { Quantity: 1, Items: [] }, DefaultCacheBehavior: {} } },
                })
                .mockResolvedValueOnce({ Invalidation: { Id: 'invalidation-123' } });

            mockSSMSend.mockResolvedValue({});
            mockCloudWatchSend.mockResolvedValue({});

            // Mock failed health validation
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 500,
            });

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps).toHaveLength(6);
            expect(result.steps[5].status).toBe('failed');
            expect(result.steps[5].error).toContain('Health check failed: 500');
        });
    });

    describe('executeFailback', () => {
        it('should execute successful failback', async () => {
            // Mock successful primary health validation
            mockRoute53Send.mockResolvedValueOnce({
                StatusList: [{ Status: 'Success' }],
            });

            // Mock successful database promotion back to primary
            mockRDSSend
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({
                    DBClusters: [{ Status: 'available', GlobalWriteForwardingStatus: 'disabled' }],
                });

            // Mock successful DNS update back to primary
            mockRoute53Send.mockResolvedValueOnce({
                ChangeInfo: { Id: 'change-456', Status: 'INSYNC' },
            });

            // Mock successful CloudFront update
            mockCloudFrontSend
                .mockResolvedValueOnce({
                    Distribution: { DistributionConfig: { Origins: { Quantity: 1, Items: [] }, DefaultCacheBehavior: {} } },
                })
                .mockResolvedValueOnce({ Invalidation: { Id: 'invalidation-456' } });

            mockSSMSend.mockResolvedValue({});
            mockCloudWatchSend.mockResolvedValue({});

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
            });

            const result = await orchestrator.executeFailback('Test failback');

            expect(result.success).toBe(true);
            expect(result.steps).toHaveLength(6);
            expect(result.steps.every(step => step.status === 'completed')).toBe(true);
        });

        it('should handle primary region health check failure during failback', async () => {
            mockRoute53Send.mockResolvedValueOnce({
                StatusList: [{ Status: 'Failure' }],
            });

            const result = await orchestrator.executeFailback('Test failback');

            expect(result.success).toBe(false);
            expect(result.steps).toHaveLength(1);
            expect(result.steps[0].status).toBe('failed');
            expect(result.steps[0].error).toContain('Primary region is not ready for failback');
        });
    });

    describe('RTO/RPO measurement', () => {
        it('should measure RTO accurately', async () => {
            const startTime = Date.now();

            // Mock successful failover with some delay
            mockRoute53Send
                .mockResolvedValueOnce({ StatusList: [{ Status: 'Success' }] })
                .mockResolvedValueOnce({ ChangeInfo: { Id: 'change-123', Status: 'INSYNC' } });

            mockRDSSend
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ DBClusters: [{ Status: 'available', GlobalWriteForwardingStatus: 'disabled' }] });

            mockCloudFrontSend
                .mockResolvedValueOnce({ Distribution: { DistributionConfig: { Origins: { Quantity: 1, Items: [] }, DefaultCacheBehavior: {} } } })
                .mockResolvedValueOnce({ Invalidation: { Id: 'invalidation-123' } });

            mockSSMSend.mockResolvedValue({});
            mockCloudWatchSend.mockResolvedValue({});

            global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

            const result = await orchestrator.executeFailover('Test failover');
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(result.rtoAchieved).toBeGreaterThanOrEqual(0);
            expect(result.rtoAchieved).toBeLessThan((endTime - startTime) / (1000 * 60) + 1); // Within reasonable bounds
        });

        it('should calculate RPO based on replication lag', async () => {
            // Mock successful failover
            mockRoute53Send
                .mockResolvedValueOnce({ StatusList: [{ Status: 'Success' }] })
                .mockResolvedValueOnce({ ChangeInfo: { Id: 'change-123', Status: 'INSYNC' } });

            mockRDSSend
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ DBClusters: [{ Status: 'available', GlobalWriteForwardingStatus: 'disabled' }] });

            mockCloudFrontSend
                .mockResolvedValueOnce({ Distribution: { DistributionConfig: { Origins: { Quantity: 1, Items: [] }, DefaultCacheBehavior: {} } } })
                .mockResolvedValueOnce({ Invalidation: { Id: 'invalidation-123' } });

            mockSSMSend.mockResolvedValue({});
            mockCloudWatchSend.mockResolvedValue({});

            global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(true);
            expect(result.rpoAchieved).toBeGreaterThanOrEqual(0);
        });
    });

    describe('rollback plan generation', () => {
        it('should generate rollback plan on successful failover', async () => {
            // Mock successful failover
            mockRoute53Send
                .mockResolvedValueOnce({ StatusList: [{ Status: 'Success' }] })
                .mockResolvedValueOnce({ ChangeInfo: { Id: 'change-123', Status: 'INSYNC' } });

            mockRDSSend
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ DBClusters: [{ Status: 'available', GlobalWriteForwardingStatus: 'disabled' }] });

            mockCloudFrontSend
                .mockResolvedValueOnce({ Distribution: { DistributionConfig: { Origins: { Quantity: 1, Items: [] }, DefaultCacheBehavior: {} } } })
                .mockResolvedValueOnce({ Invalidation: { Id: 'invalidation-123' } });

            mockSSMSend.mockResolvedValue({});
            mockCloudWatchSend.mockResolvedValue({});

            global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(true);
            expect(result.rollbackPlan).toBeDefined();
            expect(result.rollbackPlan?.steps).toHaveLength(6);
            expect(result.rollbackPlan?.estimatedDuration).toBeGreaterThan(0);
            expect(result.rollbackPlan?.riskLevel).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should handle network timeouts', async () => {
            const timeoutError = new Error('Network timeout');
            timeoutError.name = 'TimeoutError';

            // Mock successful health check first, then timeout on actual operation
            mockRoute53Send
                .mockResolvedValueOnce({ StatusList: [{ Status: 'Success' }] })
                .mockRejectedValueOnce(timeoutError);

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps.some(step => step.error?.includes('Network timeout') || step.status === 'failed')).toBe(true);
        });

        it('should handle AWS service limits', async () => {
            const throttlingError = new Error('Throttling: Rate exceeded');
            throttlingError.name = 'Throttling';

            mockRoute53Send.mockResolvedValueOnce({ StatusList: [{ Status: 'Success' }] });
            mockRDSSend.mockRejectedValueOnce(throttlingError);

            const result = await orchestrator.executeFailover('Test failover');

            expect(result.success).toBe(false);
            expect(result.steps[1].error).toContain('Throttling');
        });
    });

    describe('configuration validation', () => {
        it('should validate required configuration', () => {
            expect(() => new MultiRegionOrchestrator({} as MultiRegionConfig)).toThrow();
        });

        it('should validate region differences', () => {
            const invalidConfig = {
                ...mockConfig,
                primaryRegion: 'eu-central-1',
                secondaryRegion: 'eu-central-1', // Same as primary
            };

            expect(() => new MultiRegionOrchestrator(invalidConfig)).toThrow('Primary and secondary regions must be different');
        });
    });
});