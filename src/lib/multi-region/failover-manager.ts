import { HealthChecker } from './health-checker';
import { FailoverResult, MultiRegionConfig, MultiRegionOrchestrator } from './multi-region-orchestrator';

export interface FailoverPolicy {
    automaticFailover: boolean;
    healthCheckFailureThreshold: number;
    healthCheckInterval: number; // seconds
    rtoTarget: number; // minutes
    rpoTarget: number; // minutes
    notificationEndpoints: string[];
}

export interface FailoverEvent {
    id: string;
    timestamp: Date;
    type: 'failover' | 'failback' | 'test';
    trigger: 'automatic' | 'manual';
    reason: string;
    result: FailoverResult;
    duration: number;
    rtoAchieved: number;
    rpoAchieved: number;
}

export class FailoverManager {
    private orchestrator: MultiRegionOrchestrator;
    private healthChecker: HealthChecker;
    private isFailoverInProgress = false;
    private currentRegion: 'primary' | 'secondary' = 'primary';
    private failoverHistory: FailoverEvent[] = [];

    constructor(
        private config: MultiRegionConfig,
        private policy: FailoverPolicy,
        orchestrator?: MultiRegionOrchestrator,
        healthChecker?: HealthChecker
    ) {
        // Allow dependency injection for testing
        this.orchestrator = orchestrator || new MultiRegionOrchestrator(config);
        this.healthChecker = healthChecker || new HealthChecker(config);

        if (policy.automaticFailover) {
            this.startHealthMonitoring();
        }
    }

    /**
     * Start continuous health monitoring for automatic failover
     */
    private startHealthMonitoring(): void {
        setInterval(async () => {
            if (this.isFailoverInProgress) {
                return; // Skip if failover is already in progress
            }

            try {
                const healthStatus = await this.healthChecker.checkAllServices();

                if (this.shouldTriggerFailover(healthStatus)) {
                    console.log('Automatic failover triggered due to health check failures');
                    await this.executeAutomaticFailover('Health check failure');
                }
            } catch (error) {
                console.error('Error during health monitoring:', error);
            }
        }, this.policy.healthCheckInterval * 1000);
    }

    /**
     * Determine if automatic failover should be triggered
     */
    private shouldTriggerFailover(healthStatus: any): boolean {
        if (this.currentRegion === 'secondary') {
            return false; // Already failed over
        }

        const failedChecks = Object.values(healthStatus).filter(status => !status).length;
        return failedChecks >= this.policy.healthCheckFailureThreshold;
    }

    /**
     * Execute automatic failover
     */
    private async executeAutomaticFailover(reason: string): Promise<void> {
        if (this.isFailoverInProgress) {
            console.log('Failover already in progress, skipping automatic trigger');
            return;
        }

        console.log(`Executing automatic failover: ${reason}`);
        await this.executeFailover(reason, 'automatic');
    }

    /**
     * Execute manual failover
     */
    async executeManualFailover(reason: string): Promise<FailoverResult> {
        if (this.isFailoverInProgress) {
            throw new Error('Failover already in progress');
        }

        console.log(`Executing manual failover: ${reason}`);
        return await this.executeFailover(reason, 'manual');
    }

    /**
     * Execute failover (common logic for automatic and manual)
     */
    private async executeFailover(reason: string, trigger: 'automatic' | 'manual'): Promise<FailoverResult> {
        const startTime = new Date();
        this.isFailoverInProgress = true;

        try {
            // Send notification about failover start
            await this.sendNotification(`Failover started: ${reason}`, 'warning');

            // Execute the failover
            const result = await this.orchestrator.executeFailover(reason);

            // Update current region if successful
            if (result.success) {
                this.currentRegion = this.currentRegion === 'primary' ? 'secondary' : 'primary';
                await this.sendNotification(`Failover completed successfully to ${this.currentRegion} region`, 'success');
            } else {
                await this.sendNotification(`Failover failed: ${result.steps.find(s => s.status === 'failed')?.error}`, 'error');
            }

            // Record the event
            const event: FailoverEvent = {
                id: `failover-${Date.now()}`,
                timestamp: startTime,
                type: 'failover',
                trigger,
                reason,
                result,
                duration: (new Date().getTime() - startTime.getTime()) / 1000,
                rtoAchieved: result.rtoAchieved,
                rpoAchieved: result.rpoAchieved,
            };

            this.failoverHistory.push(event);

            // Check if RTO/RPO targets were met
            if (result.success) {
                if (result.rtoAchieved > this.policy.rtoTarget) {
                    await this.sendNotification(
                        `RTO target exceeded: ${result.rtoAchieved}min > ${this.policy.rtoTarget}min target`,
                        'warning'
                    );
                }

                if (result.rpoAchieved > this.policy.rpoTarget) {
                    await this.sendNotification(
                        `RPO target exceeded: ${result.rpoAchieved}min > ${this.policy.rpoTarget}min target`,
                        'warning'
                    );
                }
            }

            return result;

        } finally {
            this.isFailoverInProgress = false;
        }
    }

    /**
     * Execute failback to primary region
     */
    async executeFailback(reason: string = 'Manual failback'): Promise<FailoverResult> {
        if (this.isFailoverInProgress) {
            throw new Error('Failover operation already in progress');
        }

        if (this.currentRegion === 'primary') {
            throw new Error('Already running on primary region');
        }

        const startTime = new Date();
        this.isFailoverInProgress = true;

        try {
            await this.sendNotification(`Failback started: ${reason}`, 'info');

            const result = await this.orchestrator.executeFailback(reason);

            if (result.success) {
                this.currentRegion = 'primary';
                await this.sendNotification('Failback completed successfully to primary region', 'success');
            } else {
                await this.sendNotification(`Failback failed: ${result.steps.find(s => s.status === 'failed')?.error}`, 'error');
            }

            // Record the event
            const event: FailoverEvent = {
                id: `failback-${Date.now()}`,
                timestamp: startTime,
                type: 'failback',
                trigger: 'manual',
                reason,
                result,
                duration: (new Date().getTime() - startTime.getTime()) / 1000,
                rtoAchieved: result.rtoAchieved,
                rpoAchieved: result.rpoAchieved,
            };

            this.failoverHistory.push(event);

            return result;

        } finally {
            this.isFailoverInProgress = false;
        }
    }

    /**
     * Test disaster recovery without affecting production
     */
    async testDisasterRecovery(): Promise<any> {
        const startTime = new Date();

        try {
            await this.sendNotification('DR test started', 'info');

            const result = await this.orchestrator.testDisasterRecovery();

            // Record the test event
            const event: FailoverEvent = {
                id: `dr-test-${Date.now()}`,
                timestamp: startTime,
                type: 'test',
                trigger: 'manual',
                reason: 'Disaster recovery test',
                result: {
                    success: result.success,
                    rtoAchieved: result.estimatedRTO,
                    rpoAchieved: result.estimatedRPO,
                    steps: [],
                },
                duration: (new Date().getTime() - startTime.getTime()) / 1000,
                rtoAchieved: result.estimatedRTO,
                rpoAchieved: result.estimatedRPO,
            };

            this.failoverHistory.push(event);

            if (result.success) {
                await this.sendNotification('DR test completed successfully', 'success');
            } else {
                await this.sendNotification(
                    `DR test found issues: ${result.recommendations.join(', ')}`,
                    'warning'
                );
            }

            return result;

        } catch (error) {
            await this.sendNotification(`DR test failed: ${error}`, 'error');
            throw error;
        }
    }

    /**
     * Get current system status
     */
    async getSystemStatus(): Promise<{
        currentRegion: 'primary' | 'secondary';
        isFailoverInProgress: boolean;
        lastFailover?: FailoverEvent;
        healthStatus: any;
        rtoCompliance: boolean;
        rpoCompliance: boolean;
    }> {
        let healthStatus;
        try {
            healthStatus = await this.healthChecker.checkAllServices();
        } catch (error) {
            // Handle health check errors gracefully
            healthStatus = {
                overall: 'unhealthy' as const,
                regions: {
                    primary: { status: 'unhealthy' as const },
                    secondary: { status: 'unhealthy' as const },
                },
                services: [],
                lastUpdated: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }

        const lastFailover = this.failoverHistory
            .filter(e => e.type === 'failover')
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        const rtoCompliance = !lastFailover || lastFailover.rtoAchieved <= this.policy.rtoTarget;
        const rpoCompliance = !lastFailover || lastFailover.rpoAchieved <= this.policy.rpoTarget;

        return {
            currentRegion: this.currentRegion,
            isFailoverInProgress: this.isFailoverInProgress,
            lastFailover,
            healthStatus,
            rtoCompliance,
            rpoCompliance,
        };
    }

    /**
     * Get failover history
     */
    getFailoverHistory(limit?: number): FailoverEvent[] {
        const sorted = this.failoverHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * Update failover policy
     */
    updatePolicy(newPolicy: Partial<FailoverPolicy>): void {
        this.policy = { ...this.policy, ...newPolicy };

        // Restart health monitoring if automatic failover setting changed
        if (newPolicy.automaticFailover !== undefined) {
            if (newPolicy.automaticFailover && !this.policy.automaticFailover) {
                this.startHealthMonitoring();
            }
        }
    }

    /**
     * Send notification to configured endpoints
     */
    private async sendNotification(message: string, level: 'info' | 'warning' | 'error' | 'success'): Promise<void> {
        const notification = {
            timestamp: new Date().toISOString(),
            level,
            message,
            service: 'Multi-Region Failover Manager',
            currentRegion: this.currentRegion,
        };

        console.log(`[${level.toUpperCase()}] ${message}`);

        // Send to configured notification endpoints
        for (const endpoint of this.policy.notificationEndpoints) {
            try {
                if (endpoint.startsWith('http')) {
                    // Webhook notification
                    await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(notification),
                    });
                } else if (endpoint.includes('@')) {
                    // Email notification (would need SES integration)
                    console.log(`Email notification to ${endpoint}: ${message}`);
                }
            } catch (error) {
                console.error(`Failed to send notification to ${endpoint}:`, error);
            }
        }
    }

    /**
     * Generate failover report
     */
    generateFailoverReport(): {
        summary: {
            totalFailovers: number;
            successfulFailovers: number;
            averageRTO: number;
            averageRPO: number;
            rtoCompliance: number;
            rpoCompliance: number;
        };
        recentEvents: FailoverEvent[];
        recommendations: string[];
    } {
        const failovers = this.failoverHistory.filter(e => e.type === 'failover');
        const successful = failovers.filter(e => e.result.success);

        const averageRTO = successful.length > 0
            ? successful.reduce((sum, e) => sum + e.rtoAchieved, 0) / successful.length
            : 0;

        const averageRPO = successful.length > 0
            ? successful.reduce((sum, e) => sum + e.rpoAchieved, 0) / successful.length
            : 0;

        const rtoCompliant = successful.filter(e => e.rtoAchieved <= this.policy.rtoTarget).length;
        const rpoCompliant = successful.filter(e => e.rpoAchieved <= this.policy.rpoTarget).length;

        const recommendations: string[] = [];

        if (averageRTO > this.policy.rtoTarget) {
            recommendations.push(`Average RTO (${averageRTO.toFixed(1)}min) exceeds target (${this.policy.rtoTarget}min)`);
        }

        if (averageRPO > this.policy.rpoTarget) {
            recommendations.push(`Average RPO (${averageRPO.toFixed(1)}min) exceeds target (${this.policy.rpoTarget}min)`);
        }

        if (successful.length < failovers.length) {
            recommendations.push(`${failovers.length - successful.length} failover(s) failed - review failure causes`);
        }

        return {
            summary: {
                totalFailovers: failovers.length,
                successfulFailovers: successful.length,
                averageRTO,
                averageRPO,
                rtoCompliance: successful.length > 0 ? (rtoCompliant / successful.length) * 100 : 100,
                rpoCompliance: successful.length > 0 ? (rpoCompliant / successful.length) * 100 : 100,
            },
            recentEvents: this.getFailoverHistory(10),
            recommendations,
        };
    }
}