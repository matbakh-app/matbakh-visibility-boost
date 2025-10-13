import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HealthChecker } from '../health-checker';
import { MultiRegionConfig } from '../multi-region-orchestrator';

// Mock AWS SDK clients directly
const mockRoute53Send = jest.fn();
const mockRDSSend = jest.fn();
const mockElastiCacheSend = jest.fn();
const mockS3Send = jest.fn();
const mockSecretsSend = jest.fn();
const mockCloudWatchSend = jest.fn();

// Mock AWS SDK modules
jest.mock('@aws-sdk/client-route-53', () => ({
    Route53Client: jest.fn(() => ({ send: mockRoute53Send })),
    GetHealthCheckCommand: jest.fn(),
    GetHealthCheckStatusCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-rds', () => ({
    RDSClient: jest.fn(() => ({ send: mockRDSSend })),
    DescribeDBClustersCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-elasticache', () => ({
    ElastiCacheClient: jest.fn(() => ({ send: mockElastiCacheSend })),
    DescribeReplicationGroupsCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(() => ({ send: mockS3Send })),
    HeadObjectCommand: jest.fn(),
    GetBucketReplicationCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-secrets-manager', () => ({
    SecretsManagerClient: jest.fn(() => ({ send: mockSecretsSend })),
    GetSecretValueCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-cloudwatch', () => ({
    CloudWatchClient: jest.fn(() => ({ send: mockCloudWatchSend })),
    GetMetricDataCommand: jest.fn(),
    GetMetricStatisticsCommand: jest.fn(),
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

describe('HealthChecker', () => {
    let healthChecker: HealthChecker;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        mockRoute53Send.mockReset();
        mockRDSSend.mockReset();
        mockElastiCacheSend.mockReset();
        mockS3Send.mockReset();
        mockSecretsSend.mockReset();
        mockCloudWatchSend.mockReset();

        // Create HealthChecker with injected mock clients
        const mockClients = {
            route53: { send: mockRoute53Send } as any,
            primaryRds: { send: mockRDSSend } as any,
            secondaryRds: { send: mockRDSSend } as any,
            primaryCache: { send: mockElastiCacheSend } as any,
            secondaryCache: { send: mockElastiCacheSend } as any,
            primaryS3: { send: mockS3Send } as any,
            secondaryS3: { send: mockS3Send } as any,
            primarySecrets: { send: mockSecretsSend } as any,
            secondarySecrets: { send: mockSecretsSend } as any,
            cloudwatch: { send: mockCloudWatchSend } as any,
        };

        healthChecker = new HealthChecker(mockConfig, mockClients);
    });

    describe('checkAllServices', () => {
        it('should return healthy status when all services are healthy', async () => {
            // Mock healthy responses for all services
            mockRoute53Send
                .mockResolvedValueOnce({
                    HealthCheck: {
                        HealthCheckConfig: {
                            FullyQualifiedDomainName: 'api-eu-central-1.test.matbakh.app',
                        },
                    },
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Success', CheckedTime: new Date(), Latency: 100 }],
                })
                .mockResolvedValueOnce({
                    HealthCheck: {
                        HealthCheckConfig: {
                            FullyQualifiedDomainName: 'api-eu-west-1.test.matbakh.app',
                        },
                    },
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Success', CheckedTime: new Date(), Latency: 120 }],
                });

            mockRDSSend
                .mockResolvedValueOnce({
                    DBClusters: [
                        {
                            DBClusterIdentifier: 'test-primary-cluster',
                            Status: 'available',
                            Engine: 'aurora-postgresql',
                            EngineVersion: '15.4',
                            AvailabilityZones: ['eu-central-1a', 'eu-central-1b'],
                            BackupRetentionPeriod: 7,
                            MultiAZ: true,
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    DBClusters: [
                        {
                            DBClusterIdentifier: 'test-secondary-cluster',
                            Status: 'available',
                            Engine: 'aurora-postgresql',
                            EngineVersion: '15.4',
                            AvailabilityZones: ['eu-west-1a', 'eu-west-1b'],
                            BackupRetentionPeriod: 7,
                            MultiAZ: true,
                        },
                    ],
                });

            mockElastiCacheSend
                .mockResolvedValueOnce({
                    ReplicationGroups: [
                        {
                            ReplicationGroupId: 'test-cache-group-primary',
                            Status: 'available',
                            NumCacheClusters: 2,
                            MultiAZ: 'enabled',
                            CacheNodeType: 'cache.r6g.large',
                        },
                    ],
                })
                .mockResolvedValueOnce({
                    ReplicationGroups: [
                        {
                            ReplicationGroupId: 'test-cache-group-secondary',
                            Status: 'available',
                            NumCacheClusters: 2,
                            MultiAZ: 'enabled',
                            CacheNodeType: 'cache.r6g.large',
                        },
                    ],
                });

            mockS3Send
                .mockResolvedValueOnce({
                    ContentLength: 1024,
                    LastModified: new Date(),
                })
                .mockResolvedValueOnce({
                    ReplicationConfiguration: {
                        Role: 'arn:aws:iam::123456789012:role/replication-role',
                        Rules: [
                            {
                                ID: 'ReplicateAll',
                                Status: 'Enabled',
                            },
                        ],
                    },
                })
                .mockResolvedValueOnce({
                    ContentLength: 1024,
                    LastModified: new Date(),
                })
                .mockResolvedValueOnce({
                    ReplicationConfiguration: {
                        Role: 'arn:aws:iam::123456789012:role/replication-role',
                        Rules: [
                            {
                                ID: 'ReplicateAll',
                                Status: 'Enabled',
                            },
                        ],
                    },
                });

            mockSecretsSend
                .mockResolvedValueOnce({
                    SecretString: '{\"username\":\"test\",\"password\":\"secret\"}',
                })
                .mockResolvedValueOnce({
                    SecretString: '{\"username\":\"test\",\"password\":\"secret\"}',
                });

            mockCloudWatchSend.mockResolvedValue({
                Datapoints: [{ Average: 30000, Timestamp: new Date() }],
            });

            const result = await healthChecker.checkAllServices();

            expect(result.overall).toBe('healthy');
            expect(result.regions.primary.status).toBe('healthy');
            expect(result.regions.secondary.status).toBe('healthy');
            expect(result.services).toHaveLength(10); // 5 services × 2 regions
            expect(result.services.every(s => s.status === 'healthy')).toBe(true);
        });

        it('should return degraded status when some services are degraded', async () => {
            // Mock mixed health responses
            mockRoute53Send
                .mockResolvedValueOnce({
                    HealthCheck: {},
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Success' }],
                })
                .mockResolvedValueOnce({
                    HealthCheck: {},
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Success' }],
                });

            // Primary DB healthy, secondary degraded
            mockRDSSend
                .mockResolvedValueOnce({
                    DBClusters: [{ Status: 'available' }],
                })
                .mockResolvedValueOnce({
                    DBClusters: [{ Status: 'backing-up' }], // Degraded state
                });

            mockElastiCacheSend.mockResolvedValue({
                ReplicationGroups: [{ Status: 'available' }],
            });

            mockS3Send.mockResolvedValue({});
            mockSecretsSend.mockResolvedValue({ SecretString: '{}' });
            mockCloudWatchSend.mockResolvedValue({ Datapoints: [] });

            const result = await healthChecker.checkAllServices();

            expect(result.overall).toBe('degraded');
            expect(result.regions.primary.status).toBe('healthy');
            expect(result.regions.secondary.status).toBe('degraded');
        });

        it('should detect unhealthy services', async () => {
            // Mock failing health checks
            mockRoute53Send
                .mockResolvedValueOnce({
                    HealthCheck: {},
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Failure' }],
                })
                .mockResolvedValueOnce({
                    HealthCheck: {},
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Failure' }],
                });

            mockRDSSend.mockRejectedValue(new Error('Database unavailable'));
            mockElastiCacheSend.mockResolvedValue({ ReplicationGroups: [] });
            mockS3Send.mockRejectedValue(new Error('Access denied'));
            mockSecretsSend.mockRejectedValue(new Error('Secret not found'));
            mockCloudWatchSend.mockResolvedValue({ Datapoints: [] });

            const result = await healthChecker.checkAllServices();

            expect(result.overall).toBe('unhealthy');
            expect(result.services.some(s => s.status === 'unhealthy')).toBe(true);
        });

        it('should handle AWS service errors gracefully', async () => {
            // Mock AWS SDK errors
            mockRoute53Send.mockRejectedValue(new Error('AWS SDK Error'));
            mockRDSSend.mockRejectedValue(new Error('RDS Error'));
            mockElastiCacheSend.mockRejectedValue(new Error('Cache Error'));
            mockS3Send.mockRejectedValue(new Error('S3 Error'));
            mockSecretsSend.mockRejectedValue(new Error('Secrets Error'));
            mockCloudWatchSend.mockRejectedValue(new Error('CloudWatch Error'));

            const result = await healthChecker.checkAllServices();

            expect(result.overall).toBe('unhealthy');
            expect(result.services.every(s => s.error)).toBe(true);
            expect(result.services.every(s => s.status === 'unhealthy')).toBe(true);
        });
    });

    describe('API health checks', () => {
        it('should check API health via Route 53 health checks', async () => {
            mockRoute53Send
                .mockResolvedValueOnce({
                    HealthCheck: {
                        HealthCheckConfig: {
                            FullyQualifiedDomainName: 'api-eu-central-1.test.matbakh.app',
                        },
                    },
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Success', Latency: 150 }],
                });

            const result = await healthChecker.checkAllServices();
            const apiService = result.services.find(s => s.service === 'api' && s.region === 'eu-central-1');

            expect(apiService).toBeDefined();
            expect(apiService!.status).toBe('healthy');
            expect(apiService!.details.fqdn).toBe('api-eu-central-1.test.matbakh.app');
            expect(apiService!.details.latency).toBe(150);
        });

        it('should handle API health check failures', async () => {
            mockRoute53Send
                .mockResolvedValueOnce({
                    HealthCheck: {},
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Failure' }],
                });

            const result = await healthChecker.checkAllServices();
            const apiService = result.services.find(s => s.service === 'api' && s.region === 'eu-central-1');

            expect(apiService).toBeDefined();
            expect(apiService!.status).toBe('unhealthy');
        });
    });

    describe('database health checks', () => {
        it('should check database cluster health', async () => {
            // Mock all services to avoid interference
            mockRoute53Send.mockResolvedValue({ StatusList: [{ Status: 'Success' }] });
            mockElastiCacheSend.mockResolvedValue({ ReplicationGroups: [{ Status: 'available' }] });
            mockS3Send.mockResolvedValue({});
            mockSecretsSend.mockResolvedValue({ SecretString: '{}' });

            mockRDSSend.mockResolvedValue({
                DBClusters: [
                    {
                        Status: 'available',
                        Engine: 'aurora-postgresql',
                        MultiAZ: true,
                    },
                ],
            });

            // Mock CloudWatch to return 30 seconds (will be converted to 30000 ms)
            mockCloudWatchSend.mockResolvedValue({
                MetricDataResults: [
                    {
                        Values: [30], // 30 seconds
                    },
                ],
            });

            const result = await healthChecker.checkAllServices();
            const dbService = result.services.find(s => s.service === 'database' && s.region === 'eu-central-1');

            expect(dbService).toBeDefined();
            expect(dbService!.status).toBe('healthy');
            expect(dbService!.details.engine).toBe('aurora-postgresql');
            expect(dbService!.details.multiAZ).toBe(true);
            expect(dbService!.details.replicationLag).toBe(30000);
        });

        it('should detect high replication lag', async () => {
            // Mock all services to avoid interference
            mockRoute53Send.mockResolvedValue({ StatusList: [{ Status: 'Success' }] });
            mockElastiCacheSend.mockResolvedValue({ ReplicationGroups: [{ Status: 'available' }] });
            mockS3Send.mockResolvedValue({});
            mockSecretsSend.mockResolvedValue({ SecretString: '{}' });

            mockRDSSend.mockResolvedValue({
                DBClusters: [{ Status: 'available' }],
            });

            // Mock CloudWatch to return 120 seconds (will be converted to 120000 ms)
            mockCloudWatchSend.mockResolvedValue({
                MetricDataResults: [
                    {
                        Values: [120], // 120 seconds
                    },
                ],
            });

            const result = await healthChecker.checkAllServices();
            const dbService = result.services.find(s => s.service === 'database');

            expect(dbService).toBeDefined();
            expect(dbService!.details.replicationLag).toBe(120000);
        });

        it('should handle missing database cluster', async () => {
            mockRDSSend.mockRejectedValue(new Error('Cluster not found'));

            const result = await healthChecker.checkAllServices();
            const dbService = result.services.find(s => s.service === 'database');

            expect(dbService).toBeDefined();
            expect(dbService!.status).toBe('unhealthy');
            expect(dbService!.error).toContain('Cluster not found');
        });
    });

    describe('cache health checks', () => {
        it('should check ElastiCache replication group health', async () => {
            mockElastiCacheSend.mockResolvedValue({
                ReplicationGroups: [
                    {
                        Status: 'available',
                        NumCacheClusters: 2,
                        MultiAZ: 'enabled',
                    },
                ],
            });

            const result = await healthChecker.checkAllServices();
            const cacheService = result.services.find(s => s.service === 'cache');

            expect(cacheService).toBeDefined();
            expect(cacheService!.status).toBe('healthy');
            expect(cacheService!.details.numCacheClusters).toBe(2);
            expect(cacheService!.details.multiAZ).toBe('enabled');
        });

        it('should handle no cache configuration gracefully', async () => {
            mockElastiCacheSend.mockResolvedValue({
                ReplicationGroups: [],
            });

            const result = await healthChecker.checkAllServices();
            const cacheService = result.services.find(s => s.service === 'cache');

            expect(cacheService).toBeDefined();
            expect(cacheService!.status).toBe('healthy');
            expect(cacheService!.details.message).toBe('No replication groups configured');
        });

        it('should detect cache in creating state', async () => {
            mockElastiCacheSend.mockResolvedValue({
                ReplicationGroups: [{ Status: 'creating' }],
            });

            const result = await healthChecker.checkAllServices();
            const cacheService = result.services.find(s => s.service === 'cache');

            expect(cacheService).toBeDefined();
            expect(cacheService!.status).toBe('degraded');
        });
    });

    describe('storage health checks', () => {
        it('should check S3 bucket accessibility', async () => {
            mockS3Send
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({
                    ReplicationConfiguration: {
                        Rules: [{ Status: 'Enabled' }, { Status: 'Enabled' }],
                    },
                });

            const result = await healthChecker.checkAllServices();
            const storageService = result.services.find(s => s.service === 'storage');

            expect(storageService).toBeDefined();
            expect(storageService!.status).toBe('healthy');
            expect(storageService!.details.replicationRules).toBe(2);
        });

        it('should handle missing index.html gracefully', async () => {
            const notFoundError = new Error('Not Found');
            notFoundError.name = 'NotFound';
            mockS3Send.mockRejectedValueOnce(notFoundError).mockResolvedValueOnce({
                ReplicationConfiguration: { Rules: [] },
            });

            const result = await healthChecker.checkAllServices();
            const storageService = result.services.find(s => s.service === 'storage');

            expect(storageService).toBeDefined();
            expect(storageService!.status).toBe('healthy');
        });

        it('should detect S3 access denied', async () => {
            const accessDeniedError = new Error('Access Denied');
            accessDeniedError.name = 'AccessDenied';
            mockS3Send.mockRejectedValue(accessDeniedError);

            const result = await healthChecker.checkAllServices();
            const storageService = result.services.find(s => s.service === 'storage');

            expect(storageService).toBeDefined();
            expect(storageService!.status).toBe('unhealthy');
            expect(storageService!.error).toContain('Access Denied');
        });
    });

    describe('secrets health checks', () => {
        it('should check secrets manager accessibility', async () => {
            mockSecretsSend.mockResolvedValue({
                SecretString: '{}',
            });

            const result = await healthChecker.checkAllServices();
            const secretsService = result.services.find(s => s.service === 'secrets');

            expect(secretsService).toBeDefined();
            expect(secretsService!.status).toBe('healthy');
            expect(secretsService!.details.secretsAccessible).toBe(true);
        });

        it('should handle secret not found', async () => {
            const secretNotFoundError = new Error('Could not find the specified secret');
            mockSecretsSend.mockRejectedValue(secretNotFoundError);

            const result = await healthChecker.checkAllServices();
            const secretsService = result.services.find(s => s.service === 'secrets');

            expect(secretsService).toBeDefined();
            expect(secretsService!.status).toBe('unhealthy');
            expect(secretsService!.error).toContain('find the specified secret');
        });
    });

    describe('getHealthSummary', () => {
        it('should provide comprehensive health summary', async () => {
            // Mock successful health checks with realistic response times
            mockRoute53Send
                .mockResolvedValueOnce({
                    HealthCheck: {
                        HealthCheckConfig: {
                            FullyQualifiedDomainName: 'api-eu-central-1.test.matbakh.app',
                        },
                    },
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Success', CheckedTime: new Date(), Latency: 100 }],
                })
                .mockResolvedValueOnce({
                    HealthCheck: {
                        HealthCheckConfig: {
                            FullyQualifiedDomainName: 'api-eu-west-1.test.matbakh.app',
                        },
                    },
                })
                .mockResolvedValueOnce({
                    StatusList: [{ Status: 'Success', CheckedTime: new Date(), Latency: 120 }],
                });

            mockRDSSend.mockResolvedValue({
                DBClusters: [{ Status: 'available', Engine: 'aurora-postgresql', MultiAZ: true }],
            });

            mockElastiCacheSend.mockResolvedValue({
                ReplicationGroups: [{ Status: 'available' }],
            });

            mockS3Send.mockResolvedValue({});
            mockSecretsSend.mockResolvedValue({ SecretString: '{}' });

            // Mock replication lag - return 45 seconds (will be converted to 45000 ms)
            mockCloudWatchSend.mockResolvedValue({
                MetricDataResults: [
                    {
                        Values: [45], // 45 seconds
                    },
                ],
            });

            const summary = await healthChecker.getHealthSummary();

            expect(summary.timestamp).toBeInstanceOf(Date);
            expect(summary.overallStatus).toBe('healthy');
            expect(summary.regionStatus).toHaveProperty('eu-central-1');
            expect(summary.regionStatus).toHaveProperty('eu-west-1');
            expect(summary.serviceStatus).toBeDefined();
            expect(summary.metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
            expect(summary.metrics.successRate).toBeGreaterThanOrEqual(0);
            expect(summary.metrics.replicationLag).toBe(45000);
        });

        it('should calculate correct success rate with mixed health', async () => {
            // Mock 80% success rate (8 out of 10 services healthy)
            let callCount = 0;
            mockRoute53Send.mockImplementation(() => {
                callCount++;
                if (callCount <= 8) {
                    return Promise.resolve({ StatusList: [{ Status: 'Success' }] });
                }
                return Promise.resolve({ StatusList: [{ Status: 'Failure' }] });
            });

            mockRDSSend.mockResolvedValue({
                DBClusters: [{ Status: 'available' }],
            });

            mockElastiCacheSend.mockResolvedValue({
                ReplicationGroups: [{ Status: 'available' }],
            });

            mockS3Send.mockResolvedValue({});
            mockSecretsSend.mockResolvedValue({ SecretString: '{}' });
            mockCloudWatchSend.mockResolvedValue({ Datapoints: [] });

            const summary = await healthChecker.getHealthSummary();

            expect(summary.metrics.successRate).toBeGreaterThanOrEqual(70);
            expect(summary.metrics.successRate).toBeLessThanOrEqual(100);
        });

        it('should handle errors in health summary gracefully', async () => {
            // Mock all services failing
            mockRoute53Send.mockRejectedValue(new Error('Route53 Error'));
            mockRDSSend.mockRejectedValue(new Error('RDS Error'));
            mockElastiCacheSend.mockRejectedValue(new Error('Cache Error'));
            mockS3Send.mockRejectedValue(new Error('S3 Error'));
            mockSecretsSend.mockRejectedValue(new Error('Secrets Error'));
            mockCloudWatchSend.mockRejectedValue(new Error('CloudWatch Error'));

            const summary = await healthChecker.getHealthSummary();

            expect(summary.overallStatus).toBe('unhealthy');
            expect(summary.metrics.successRate).toBe(0);
        });
    });

    describe('response time tracking', () => {
        it('should track response times for all services', async () => {
            const startTime = Date.now();

            // Mock responses with delays
            mockRoute53Send.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ StatusList: [{ Status: 'Success' }] }), 50))
            );
            mockRDSSend.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ DBClusters: [{ Status: 'available' }] }), 100))
            );
            mockElastiCacheSend.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ ReplicationGroups: [{ Status: 'available' }] }), 75))
            );
            mockS3Send.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({}), 25))
            );
            mockSecretsSend.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ SecretString: '{}' }), 30))
            );
            mockCloudWatchSend.mockResolvedValue({ Datapoints: [] });

            const result = await healthChecker.checkAllServices();
            const endTime = Date.now();

            expect(endTime - startTime).toBeGreaterThan(100); // Should take at least 100ms
            expect(result.services.every(s => s.responseTime !== undefined)).toBe(true);
        });
    });
});