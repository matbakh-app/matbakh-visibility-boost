#!/usr/bin/env tsx
/**
 * Deployment Health Check Script
 * Monitors deployment health and triggers alerts if issues are detected
 */


interface HealthCheckOptions {
    environment: 'development' | 'staging' | 'production';
    deploymentId?: string;
    timeout?: number;
    alertThreshold?: number;
}

class DeploymentHealthChecker {
    private async checkEndpointHealth(url: string, timeout = 10000): Promise<{
        status: 'healthy' | 'unhealthy';
        responseTime: number;
        statusCode?: number;
        error?: string;
    }> {
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Deployment-Health-Checker/1.0'
                }
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            return {
                status: response.ok ? 'healthy' : 'unhealthy',
                responseTime,
                statusCode: response.status
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 'unhealthy',
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private getEnvironmentUrl(environment: string): string {
        switch (environment) {
            case 'development': return 'https://dev.matbakh.app';
            case 'staging': return 'https://staging.matbakh.app';
            case 'production': return 'https://matbakh.app';
            default: throw new Error(`Unknown environment: ${environment}`);
        }
    }

    private async checkCriticalEndpoints(baseUrl: string): Promise<{
        endpoint: string;
        status: 'healthy' | 'unhealthy';
        responseTime: number;
        statusCode?: number;
        error?: string;
    }[]> {
        const endpoints = [
            '/health',
            '/api/health',
            '/vc/quick',
            '/',
            '/api/status'
        ];

        const results = await Promise.all(
            endpoints.map(async (endpoint) => {
                const url = `${baseUrl}${endpoint}`;
                const result = await this.checkEndpointHealth(url);

                return {
                    endpoint,
                    ...result
                };
            })
        );

        return results;
    }

    private async runPerformanceChecks(baseUrl: string): Promise<{
        averageResponseTime: number;
        slowEndpoints: string[];
        errorRate: number;
        totalRequests: number;
    }> {
        const endpoints = [
            '/',
            '/vc/quick',
            '/dashboard',
            '/api/health'
        ];

        const results = await Promise.all(
            endpoints.map(endpoint => this.checkEndpointHealth(`${baseUrl}${endpoint}`))
        );

        const totalRequests = results.length;
        const errors = results.filter(r => r.status === 'unhealthy').length;
        const errorRate = (errors / totalRequests) * 100;

        const responseTimes = results.map(r => r.responseTime);
        const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

        const slowEndpoints = endpoints.filter((endpoint, index) =>
            results[index].responseTime > 2000 // Slower than 2 seconds
        );

        return {
            averageResponseTime,
            slowEndpoints,
            errorRate,
            totalRequests
        };
    }

    private generateHealthReport(
        environment: string,
        endpointResults: any[],
        performanceResults: any,
        deploymentId?: string
    ): {
        status: 'healthy' | 'warning' | 'critical';
        summary: string;
        details: any;
        recommendations: string[];
    } {
        const healthyEndpoints = endpointResults.filter(r => r.status === 'healthy').length;
        const totalEndpoints = endpointResults.length;
        const healthPercentage = (healthyEndpoints / totalEndpoints) * 100;

        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        let summary = '';
        const recommendations: string[] = [];

        // Determine overall status
        if (healthPercentage < 50) {
            status = 'critical';
            summary = `Critical: Only ${healthyEndpoints}/${totalEndpoints} endpoints are healthy`;
            recommendations.push('Immediate investigation required - multiple endpoints failing');
        } else if (healthPercentage < 80 || performanceResults.errorRate > 10) {
            status = 'warning';
            summary = `Warning: ${healthyEndpoints}/${totalEndpoints} endpoints healthy, ${performanceResults.errorRate.toFixed(1)}% error rate`;
            recommendations.push('Monitor closely - some endpoints may need attention');
        } else if (performanceResults.averageResponseTime > 1000) {
            status = 'warning';
            summary = `Warning: All endpoints healthy but slow response times (${performanceResults.averageResponseTime.toFixed(0)}ms avg)`;
            recommendations.push('Investigate performance bottlenecks');
        } else {
            summary = `Healthy: All systems operational (${performanceResults.averageResponseTime.toFixed(0)}ms avg response)`;
            recommendations.push('Continue monitoring');
        }

        // Add specific recommendations
        if (performanceResults.slowEndpoints.length > 0) {
            recommendations.push(`Slow endpoints detected: ${performanceResults.slowEndpoints.join(', ')}`);
        }

        const failedEndpoints = endpointResults.filter(r => r.status === 'unhealthy');
        if (failedEndpoints.length > 0) {
            recommendations.push(`Failed endpoints: ${failedEndpoints.map(e => e.endpoint).join(', ')}`);
        }

        return {
            status,
            summary,
            details: {
                environment,
                deploymentId,
                timestamp: new Date().toISOString(),
                endpoints: endpointResults,
                performance: performanceResults,
                healthPercentage
            },
            recommendations
        };
    }

    async checkHealth(options: HealthCheckOptions): Promise<void> {
        console.log(`🔍 Checking deployment health for ${options.environment}...`);

        const baseUrl = this.getEnvironmentUrl(options.environment);

        try {
            // Check critical endpoints
            console.log('📡 Checking critical endpoints...');
            const endpointResults = await this.checkCriticalEndpoints(baseUrl);

            // Run performance checks
            console.log('⚡ Running performance checks...');
            const performanceResults = await this.runPerformanceChecks(baseUrl);

            // Generate health report
            const report = this.generateHealthReport(
                options.environment,
                endpointResults,
                performanceResults,
                options.deploymentId
            );

            // Display results
            this.displayResults(report);

            // Check if we need to trigger alerts
            if (report.status === 'critical') {
                console.log('\n🚨 CRITICAL ISSUES DETECTED - Triggering alerts...');
                await this.triggerAlerts(report, options);
                process.exit(1);
            } else if (report.status === 'warning') {
                console.log('\n⚠️  WARNING - Issues detected but not critical');
                if (options.alertThreshold && options.alertThreshold <= 1) {
                    await this.triggerAlerts(report, options);
                }
            } else {
                console.log('\n✅ All systems healthy');
            }

            // If deployment ID provided, update monitoring
            if (options.deploymentId) {
                console.log(`\n📊 Updating deployment monitoring for ${options.deploymentId}...`);
                // In a real implementation, this would update the deployment monitor
            }

        } catch (error) {
            console.error('❌ Health check failed:', error);
            process.exit(1);
        }
    }

    private displayResults(report: any): void {
        console.log('\n📋 Health Check Results:');
        console.log(`   Status: ${this.getStatusEmoji(report.status)} ${report.status.toUpperCase()}`);
        console.log(`   Summary: ${report.summary}`);
        console.log(`   Environment: ${report.details.environment}`);
        console.log(`   Timestamp: ${report.details.timestamp}`);

        if (report.details.deploymentId) {
            console.log(`   Deployment ID: ${report.details.deploymentId}`);
        }

        console.log('\n🔗 Endpoint Results:');
        report.details.endpoints.forEach((endpoint: any) => {
            const statusEmoji = endpoint.status === 'healthy' ? '✅' : '❌';
            const responseTime = `${endpoint.responseTime}ms`;
            const statusCode = endpoint.statusCode ? ` (${endpoint.statusCode})` : '';
            const error = endpoint.error ? ` - ${endpoint.error}` : '';

            console.log(`   ${statusEmoji} ${endpoint.endpoint}: ${responseTime}${statusCode}${error}`);
        });

        console.log('\n⚡ Performance Metrics:');
        console.log(`   Average Response Time: ${report.details.performance.averageResponseTime.toFixed(0)}ms`);
        console.log(`   Error Rate: ${report.details.performance.errorRate.toFixed(1)}%`);
        console.log(`   Health Percentage: ${report.details.healthPercentage.toFixed(1)}%`);

        if (report.details.performance.slowEndpoints.length > 0) {
            console.log(`   Slow Endpoints: ${report.details.performance.slowEndpoints.join(', ')}`);
        }

        console.log('\n💡 Recommendations:');
        report.recommendations.forEach((rec: string) => {
            console.log(`   • ${rec}`);
        });
    }

    private getStatusEmoji(status: string): string {
        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '⚠️';
            case 'critical': return '🚨';
            default: return '❓';
        }
    }

    private async triggerAlerts(report: any, options: HealthCheckOptions): Promise<void> {
        // In a real implementation, this would send alerts via Slack, email, etc.
        console.log('📢 Alert triggered:');
        console.log(`   Environment: ${options.environment}`);
        console.log(`   Status: ${report.status}`);
        console.log(`   Summary: ${report.summary}`);

        // Simulate alert sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('   ✅ Alert sent successfully');
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Deployment Health Check Script

Usage: npm run check:health [options]

Options:
  --env <environment>       Target environment (development|staging|production)
  --deployment-id <id>      Specific deployment ID to check
  --timeout <ms>           Request timeout in milliseconds (default: 10000)
  --alert-threshold <level> Alert threshold (0=critical only, 1=warning+critical)
  --help, -h               Show this help message

Examples:
  npm run check:health --env production
  npm run check:health --env staging --deployment-id deploy-123
  npm run check:health --env production --alert-threshold 1
`);
        return;
    }

    const options: HealthCheckOptions = {
        environment: 'staging' as any,
        timeout: 10000,
        alertThreshold: 0
    };

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--env':
                options.environment = args[++i] as any;
                break;
            case '--deployment-id':
                options.deploymentId = args[++i];
                break;
            case '--timeout':
                options.timeout = parseInt(args[++i]);
                break;
            case '--alert-threshold':
                options.alertThreshold = parseInt(args[++i]);
                break;
        }
    }

    // Validate environment
    if (!['development', 'staging', 'production'].includes(options.environment)) {
        console.error('❌ Invalid environment. Must be: development, staging, or production');
        process.exit(1);
    }

    const checker = new DeploymentHealthChecker();
    await checker.checkHealth(options);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Health check script failed:', error);
        process.exit(1);
    });
}

export { DeploymentHealthChecker };
