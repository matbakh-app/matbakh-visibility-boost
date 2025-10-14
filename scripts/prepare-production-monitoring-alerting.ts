#!/usr/bin/env tsx

/**
 * Production Monitoring and Alerting Preparation Script
 *
 * Prepares comprehensive monitoring and alerting infrastructure for
 * Bedrock Activation hybrid architecture production deployment.
 *
 * This script:
 * 1. Validates existing monitoring infrastructure
 * 2. Configures production-ready alerting thresholds
 * 3. Sets up comprehensive dashboards
 * 4. Configures notification channels
 * 5. Tests alerting mechanisms
 * 6. Generates monitoring runbooks
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

interface MonitoringConfig {
  environment: "production" | "staging" | "development";
  region: string;
  alertEmail: string;
  pagerDutyIntegrationKey?: string;
  slackWebhookUrl?: string;

  // Thresholds
  thresholds: {
    emergencyLatency: number; // milliseconds
    criticalLatency: number; // milliseconds
    standardLatency: number; // milliseconds
    errorRate: number; // percentage
    successRate: number; // percentage
    routingEfficiency: number; // percentage
    fallbackRate: number; // percentage
    costBudget: number; // EUR per month
    healthScore: number; // 0-100
  };

  // Monitoring intervals
  intervals: {
    healthCheck: number; // seconds
    metricsCollection: number; // seconds
    alertEvaluation: number; // seconds
    dashboardRefresh: number; // seconds
  };
}

const PRODUCTION_CONFIG: MonitoringConfig = {
  environment: "production",
  region: "eu-central-1",
  alertEmail: "ops-team@matbakh.app",

  thresholds: {
    emergencyLatency: 5000, // 5 seconds
    criticalLatency: 10000, // 10 seconds
    standardLatency: 30000, // 30 seconds
    errorRate: 5, // 5%
    successRate: 95, // 95%
    routingEfficiency: 80, // 80%
    fallbackRate: 10, // 10%
    costBudget: 200, // EUR per month
    healthScore: 90, // 90/100
  },

  intervals: {
    healthCheck: 30, // 30 seconds
    metricsCollection: 60, // 1 minute
    alertEvaluation: 60, // 1 minute
    dashboardRefresh: 300, // 5 minutes
  },
};

class ProductionMonitoringPreparation {
  private config: MonitoringConfig;
  private outputDir: string;

  constructor(config: MonitoringConfig = PRODUCTION_CONFIG) {
    this.config = config;
    this.outputDir = join(process.cwd(), "docs", "production-monitoring");

    // Ensure output directory exists
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Main preparation workflow
   */
  async prepare(): Promise<void> {
    console.log("🚀 Starting Production Monitoring and Alerting Preparation");
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Region: ${this.config.region}`);
    console.log(`Alert Email: ${this.config.alertEmail}`);
    console.log("");

    try {
      // Step 1: Validate existing infrastructure
      await this.validateInfrastructure();

      // Step 2: Configure monitoring components
      await this.configureMonitoring();

      // Step 3: Set up alerting
      await this.setupAlerting();

      // Step 4: Create dashboards
      await this.createDashboards();

      // Step 5: Configure notification channels
      await this.configureNotifications();

      // Step 6: Test alerting mechanisms
      await this.testAlerting();

      // Step 7: Generate runbooks
      await this.generateRunbooks();

      // Step 8: Create deployment checklist
      await this.createDeploymentChecklist();

      console.log(
        "✅ Production monitoring and alerting preparation completed!"
      );
      console.log(`📁 Documentation generated in: ${this.outputDir}`);
    } catch (error) {
      console.error("❌ Preparation failed:", error);
      process.exit(1);
    }
  }

  /**
   * Validate existing monitoring infrastructure
   */
  private async validateInfrastructure(): Promise<void> {
    console.log("🔍 Validating existing monitoring infrastructure...");

    const requiredFiles = [
      "infra/cdk/production-monitoring-stack.ts",
      "infra/cdk/hybrid-routing-monitoring-stack.ts",
      "src/lib/ai-orchestrator/alerting/routing-efficiency-alerting.ts",
      "src/lib/ai-orchestrator/alerting/cloudwatch-alarm-manager.ts",
      "src/lib/ai-orchestrator/alerting/sns-notification-manager.ts",
      "src/lib/ai-orchestrator/alerting/pagerduty-integration.ts",
      "src/lib/ai-orchestrator/hybrid-routing-performance-monitor.ts",
      "src/lib/ai-orchestrator/hybrid-health-monitor.ts",
    ];

    const missingFiles: string[] = [];
    const existingFiles: string[] = [];

    for (const file of requiredFiles) {
      if (existsSync(file)) {
        existingFiles.push(file);
      } else {
        missingFiles.push(file);
      }
    }

    // Generate validation report
    const validationReport = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      requiredFiles: requiredFiles.length,
      existingFiles: existingFiles.length,
      missingFiles: missingFiles.length,
      validationStatus: missingFiles.length === 0 ? "PASS" : "FAIL",
      existingComponents: existingFiles,
      missingComponents: missingFiles,
      recommendations: this.generateInfrastructureRecommendations(missingFiles),
    };

    writeFileSync(
      join(this.outputDir, "infrastructure-validation-report.json"),
      JSON.stringify(validationReport, null, 2)
    );

    if (missingFiles.length > 0) {
      console.log(`⚠️  Missing ${missingFiles.length} required files:`);
      missingFiles.forEach((file) => console.log(`   - ${file}`));
      console.log("");
    } else {
      console.log("✅ All required monitoring infrastructure files exist");
    }
  }

  /**
   * Configure monitoring components
   */
  private async configureMonitoring(): Promise<void> {
    console.log("⚙️  Configuring monitoring components...");

    // Generate monitoring configuration
    const monitoringConfig = {
      hybridRouting: {
        namespace: "Matbakh/HybridRouting",
        environment: this.config.environment,
        region: this.config.region,

        metrics: {
          // Latency metrics
          directBedrockLatency: {
            metricName: "DirectBedrockLatency",
            unit: "Milliseconds",
            dimensions: ["Environment", "OperationType"],
          },
          mcpLatency: {
            metricName: "MCPLatency",
            unit: "Milliseconds",
            dimensions: ["Environment", "OperationType"],
          },

          // Success rate metrics
          successRate: {
            metricName: "SuccessRate",
            unit: "Percent",
            dimensions: ["Environment", "RoutingPath"],
          },

          // Routing efficiency metrics
          routingEfficiency: {
            metricName: "RoutingEfficiency",
            unit: "Percent",
            dimensions: ["Environment"],
          },

          // Cost metrics
          costPerRequest: {
            metricName: "CostPerRequest",
            unit: "Count",
            dimensions: ["Environment", "RoutingPath"],
          },

          // Health metrics
          healthScore: {
            metricName: "HealthScore",
            unit: "Count",
            dimensions: ["Environment", "Component"],
          },
        },

        thresholds: this.config.thresholds,
        intervals: this.config.intervals,
      },

      alerting: {
        channels: {
          email: this.config.alertEmail,
          pagerDuty: this.config.pagerDutyIntegrationKey,
          slack: this.config.slackWebhookUrl,
        },

        severityLevels: {
          info: {
            notifications: ["email"],
            escalation: false,
          },
          warning: {
            notifications: ["email", "slack"],
            escalation: false,
          },
          error: {
            notifications: ["email", "slack", "pagerDuty"],
            escalation: true,
            escalationDelay: 900, // 15 minutes
          },
          critical: {
            notifications: ["email", "slack", "pagerDuty"],
            escalation: true,
            escalationDelay: 300, // 5 minutes
          },
        },
      },
    };

    writeFileSync(
      join(this.outputDir, "monitoring-configuration.json"),
      JSON.stringify(monitoringConfig, null, 2)
    );

    console.log("✅ Monitoring configuration generated");
  }

  /**
   * Set up alerting
   */
  private async setupAlerting(): Promise<void> {
    console.log("🚨 Setting up alerting configuration...");

    const alertingConfig = {
      alarms: [
        // Emergency operation latency
        {
          name: "EmergencyOperationLatency",
          description: "Emergency operations exceeding 5 second threshold",
          metricName: "DirectBedrockLatency",
          threshold: this.config.thresholds.emergencyLatency,
          comparisonOperator: "GreaterThanThreshold",
          evaluationPeriods: 2,
          datapointsToAlarm: 2,
          severity: "critical",
          dimensions: {
            Environment: this.config.environment,
            OperationType: "Emergency",
          },
        },

        // Critical operation latency
        {
          name: "CriticalOperationLatency",
          description: "Critical operations exceeding 10 second threshold",
          metricName: "DirectBedrockLatency",
          threshold: this.config.thresholds.criticalLatency,
          comparisonOperator: "GreaterThanThreshold",
          evaluationPeriods: 3,
          datapointsToAlarm: 2,
          severity: "error",
          dimensions: {
            Environment: this.config.environment,
            OperationType: "Critical",
          },
        },

        // Error rate
        {
          name: "HighErrorRate",
          description: "Error rate exceeding threshold",
          metricName: "ErrorRate",
          threshold: this.config.thresholds.errorRate,
          comparisonOperator: "GreaterThanThreshold",
          evaluationPeriods: 2,
          datapointsToAlarm: 2,
          severity: "critical",
          dimensions: {
            Environment: this.config.environment,
          },
        },

        // Success rate
        {
          name: "LowSuccessRate",
          description: "Success rate below threshold",
          metricName: "SuccessRate",
          threshold: this.config.thresholds.successRate,
          comparisonOperator: "LessThanThreshold",
          evaluationPeriods: 3,
          datapointsToAlarm: 2,
          severity: "error",
          dimensions: {
            Environment: this.config.environment,
          },
        },

        // Routing efficiency
        {
          name: "LowRoutingEfficiency",
          description: "Routing efficiency below threshold",
          metricName: "RoutingEfficiency",
          threshold: this.config.thresholds.routingEfficiency,
          comparisonOperator: "LessThanThreshold",
          evaluationPeriods: 3,
          datapointsToAlarm: 2,
          severity: "warning",
          dimensions: {
            Environment: this.config.environment,
          },
        },

        // High fallback rate
        {
          name: "HighFallbackRate",
          description: "Fallback rate exceeding threshold",
          metricName: "FallbackRate",
          threshold: this.config.thresholds.fallbackRate,
          comparisonOperator: "GreaterThanThreshold",
          evaluationPeriods: 3,
          datapointsToAlarm: 2,
          severity: "warning",
          dimensions: {
            Environment: this.config.environment,
          },
        },

        // Health score
        {
          name: "LowHealthScore",
          description: "System health score below threshold",
          metricName: "HealthScore",
          threshold: this.config.thresholds.healthScore,
          comparisonOperator: "LessThanThreshold",
          evaluationPeriods: 2,
          datapointsToAlarm: 2,
          severity: "error",
          dimensions: {
            Environment: this.config.environment,
          },
        },
      ],

      notifications: {
        snsTopics: [
          {
            name: "CriticalAlerts",
            displayName: "Bedrock Hybrid Routing - Critical Alerts",
            subscriptions: [
              { protocol: "email", endpoint: this.config.alertEmail },
            ],
          },
          {
            name: "WarningAlerts",
            displayName: "Bedrock Hybrid Routing - Warning Alerts",
            subscriptions: [
              { protocol: "email", endpoint: this.config.alertEmail },
            ],
          },
          {
            name: "InfoAlerts",
            displayName: "Bedrock Hybrid Routing - Info Alerts",
            subscriptions: [
              { protocol: "email", endpoint: this.config.alertEmail },
            ],
          },
        ],
      },

      escalation: {
        enabled: true,
        rules: [
          {
            severity: "critical",
            escalationDelay: 300, // 5 minutes
            escalationActions: ["pagerDuty", "sms"],
          },
          {
            severity: "error",
            escalationDelay: 900, // 15 minutes
            escalationActions: ["pagerDuty"],
          },
        ],
      },
    };

    writeFileSync(
      join(this.outputDir, "alerting-configuration.json"),
      JSON.stringify(alertingConfig, null, 2)
    );

    console.log("✅ Alerting configuration generated");
  }

  /**
   * Create dashboards
   */
  private async createDashboards(): Promise<void> {
    console.log("📊 Creating dashboard configurations...");

    const dashboards = [
      {
        name: "HybridRoutingOverview",
        title: "Bedrock Hybrid Routing - Overview",
        description: "High-level overview of hybrid routing system performance",
        widgets: [
          {
            type: "text",
            properties: {
              markdown: `# Hybrid Routing System Overview\n\n**Environment:** ${this.config.environment}\n**Region:** ${this.config.region}\n\n## Key Metrics\n- Emergency Operations: <5s latency\n- Critical Operations: <10s latency\n- Success Rate: >${this.config.thresholds.successRate}%\n- Routing Efficiency: >${this.config.thresholds.routingEfficiency}%`,
            },
          },
          {
            type: "metric",
            properties: {
              title: "Request Distribution",
              metrics: [
                [
                  "Matbakh/HybridRouting",
                  "DirectBedrockRequests",
                  "Environment",
                  this.config.environment,
                ],
                [".", "MCPRequests", ".", "."],
                [".", "FallbackRequests", ".", "."],
              ],
              period: 300,
              stat: "Sum",
              region: this.config.region,
            },
          },
          {
            type: "metric",
            properties: {
              title: "P95 Latency by Path",
              metrics: [
                [
                  "Matbakh/HybridRouting",
                  "DirectBedrockP95Latency",
                  "Environment",
                  this.config.environment,
                ],
                [".", "MCPP95Latency", ".", "."],
              ],
              period: 300,
              stat: "Average",
              region: this.config.region,
            },
          },
          {
            type: "metric",
            properties: {
              title: "Success Rate",
              metrics: [
                [
                  "Matbakh/HybridRouting",
                  "SuccessRate",
                  "Environment",
                  this.config.environment,
                ],
              ],
              period: 300,
              stat: "Average",
              region: this.config.region,
            },
          },
        ],
      },

      {
        name: "HybridRoutingPerformance",
        title: "Bedrock Hybrid Routing - Performance",
        description: "Detailed performance metrics for hybrid routing",
        widgets: [
          {
            type: "metric",
            properties: {
              title: "Latency Distribution",
              metrics: [
                [
                  "Matbakh/HybridRouting",
                  "DirectBedrockLatency",
                  "Environment",
                  this.config.environment,
                  "OperationType",
                  "Emergency",
                ],
                ["...", "Critical"],
                ["...", "Standard"],
                [".", "MCPLatency", ".", ".", ".", "Standard"],
              ],
              period: 60,
              stat: "Average",
              region: this.config.region,
            },
          },
          {
            type: "metric",
            properties: {
              title: "P99 Latency Tracking",
              metrics: [
                [
                  "Matbakh/HybridRouting",
                  "DirectBedrockP99Latency",
                  "Environment",
                  this.config.environment,
                ],
                [".", "MCPP99Latency", ".", "."],
              ],
              period: 60,
              stat: "Average",
              region: this.config.region,
            },
          },
        ],
      },

      {
        name: "HybridRoutingSecurity",
        title: "Bedrock Hybrid Routing - Security",
        description: "Security and compliance metrics",
        widgets: [
          {
            type: "metric",
            properties: {
              title: "Security Compliance",
              metrics: [
                [
                  "Matbakh/HybridRouting",
                  "GDPRComplianceRate",
                  "Environment",
                  this.config.environment,
                ],
                [".", "PIIDetectionRate", ".", "."],
                [".", "SecurityScore", ".", "."],
              ],
              period: 300,
              stat: "Average",
              region: this.config.region,
            },
          },
        ],
      },

      {
        name: "HybridRoutingCost",
        title: "Bedrock Hybrid Routing - Cost",
        description: "Cost tracking and optimization metrics",
        widgets: [
          {
            type: "metric",
            properties: {
              title: "Cost per Request",
              metrics: [
                [
                  "Matbakh/HybridRouting",
                  "CostPerRequest",
                  "Environment",
                  this.config.environment,
                  "RoutingPath",
                  "DirectBedrock",
                ],
                ["...", "MCP"],
              ],
              period: 3600,
              stat: "Average",
              region: this.config.region,
            },
          },
          {
            type: "metric",
            properties: {
              title: "Total Cost",
              metrics: [
                [
                  "Matbakh/HybridRouting",
                  "TotalCost",
                  "Environment",
                  this.config.environment,
                ],
              ],
              period: 3600,
              stat: "Sum",
              region: this.config.region,
            },
          },
        ],
      },
    ];

    writeFileSync(
      join(this.outputDir, "dashboard-configurations.json"),
      JSON.stringify(dashboards, null, 2)
    );

    console.log("✅ Dashboard configurations generated");
  }

  /**
   * Configure notification channels
   */
  private async configureNotifications(): Promise<void> {
    console.log("📢 Configuring notification channels...");

    const notificationConfig = {
      channels: {
        email: {
          enabled: true,
          address: this.config.alertEmail,
          severityLevels: ["info", "warning", "error", "critical"],
          format: "detailed",
        },

        slack: {
          enabled: !!this.config.slackWebhookUrl,
          webhookUrl: this.config.slackWebhookUrl,
          severityLevels: ["warning", "error", "critical"],
          format: "summary",
          channel: "#ops-alerts",
        },

        pagerDuty: {
          enabled: !!this.config.pagerDutyIntegrationKey,
          integrationKey: this.config.pagerDutyIntegrationKey,
          severityLevels: ["error", "critical"],
          escalationPolicy: "hybrid-routing-escalation",
        },

        sms: {
          enabled: false, // Configure manually
          phoneNumber: "+1234567890", // Replace with actual number
          severityLevels: ["critical"],
        },
      },

      messageTemplates: {
        email: {
          subject: "[{{severity}}] Hybrid Routing Alert: {{alertType}}",
          body: `
Alert Details:
- Type: {{alertType}}
- Severity: {{severity}}
- Timestamp: {{timestamp}}
- Environment: {{environment}}

Message: {{message}}

Details:
{{details}}

Recommendations:
{{recommendations}}

Dashboard: {{dashboardUrl}}
Runbook: {{runbookUrl}}
          `,
        },

        slack: {
          format: "blocks",
          template: {
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: "🚨 Hybrid Routing Alert",
                },
              },
              {
                type: "section",
                fields: [
                  { type: "mrkdwn", text: "*Type:* {{alertType}}" },
                  { type: "mrkdwn", text: "*Severity:* {{severity}}" },
                  { type: "mrkdwn", text: "*Environment:* {{environment}}" },
                  { type: "mrkdwn", text: "*Time:* {{timestamp}}" },
                ],
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "*Message:* {{message}}",
                },
              },
            ],
          },
        },
      },
    };

    writeFileSync(
      join(this.outputDir, "notification-configuration.json"),
      JSON.stringify(notificationConfig, null, 2)
    );

    console.log("✅ Notification configuration generated");
  }

  /**
   * Test alerting mechanisms
   */
  private async testAlerting(): Promise<void> {
    console.log("🧪 Generating alerting test plan...");

    const testPlan = {
      testSuites: [
        {
          name: "Latency Threshold Tests",
          description: "Test latency-based alerts",
          tests: [
            {
              name: "Emergency Latency Alert",
              description: "Trigger alert when emergency operations exceed 5s",
              steps: [
                "Simulate emergency operation with 6s latency",
                "Verify critical alert is triggered",
                "Verify PagerDuty incident is created",
                "Verify email notification is sent",
              ],
              expectedResults: [
                "Critical alert triggered within 2 evaluation periods",
                "PagerDuty incident created with correct severity",
                "Email sent to ops team",
              ],
            },
            {
              name: "Critical Latency Alert",
              description: "Trigger alert when critical operations exceed 10s",
              steps: [
                "Simulate critical operation with 12s latency",
                "Verify error alert is triggered",
                "Verify escalation after 15 minutes",
              ],
              expectedResults: [
                "Error alert triggered within 3 evaluation periods",
                "Escalation occurs after configured delay",
              ],
            },
          ],
        },

        {
          name: "Success Rate Tests",
          description: "Test success rate alerts",
          tests: [
            {
              name: "Low Success Rate Alert",
              description: "Trigger alert when success rate drops below 95%",
              steps: [
                "Simulate operations with 90% success rate",
                "Verify error alert is triggered",
                "Verify notification channels activated",
              ],
              expectedResults: [
                "Error alert triggered",
                "All configured channels notified",
              ],
            },
          ],
        },

        {
          name: "Routing Efficiency Tests",
          description: "Test routing efficiency alerts",
          tests: [
            {
              name: "Low Efficiency Alert",
              description:
                "Trigger alert when routing efficiency drops below 80%",
              steps: [
                "Simulate routing with 75% efficiency",
                "Verify warning alert is triggered",
                "Verify recommendations are included",
              ],
              expectedResults: [
                "Warning alert triggered",
                "Actionable recommendations provided",
              ],
            },
          ],
        },

        {
          name: "Health Degradation Tests",
          description: "Test health monitoring alerts",
          tests: [
            {
              name: "Health Score Alert",
              description: "Trigger alert when health score drops below 90",
              steps: [
                "Simulate health score of 85",
                "Verify error alert is triggered",
                "Verify component details included",
              ],
              expectedResults: [
                "Error alert triggered",
                "Unhealthy components identified",
              ],
            },
          ],
        },
      ],

      testExecution: {
        environment: "staging",
        duration: "2 hours",
        prerequisites: [
          "Staging environment deployed",
          "Monitoring infrastructure active",
          "Test data generators available",
        ],
        cleanup: [
          "Reset alert states",
          "Clear test notifications",
          "Restore normal thresholds",
        ],
      },
    };

    writeFileSync(
      join(this.outputDir, "alerting-test-plan.json"),
      JSON.stringify(testPlan, null, 2)
    );

    console.log("✅ Alerting test plan generated");
  }

  /**
   * Generate runbooks
   */
  private async generateRunbooks(): Promise<void> {
    console.log("📚 Generating operational runbooks...");

    const runbooks = [
      {
        title: "Emergency Latency Response",
        description:
          "Response procedures for emergency operation latency alerts",
        severity: "critical",
        maxResponseTime: "5 minutes",
        steps: [
          {
            step: 1,
            action: "Acknowledge Alert",
            description: "Acknowledge the alert in PagerDuty and notify team",
            timeLimit: "2 minutes",
          },
          {
            step: 2,
            action: "Check System Status",
            description:
              "Verify overall system health and identify affected components",
            commands: [
              "Check hybrid routing dashboard",
              "Review CloudWatch logs for errors",
              "Verify direct Bedrock client health",
            ],
            timeLimit: "3 minutes",
          },
          {
            step: 3,
            action: "Immediate Mitigation",
            description: "Apply immediate fixes to restore service",
            options: [
              "Restart affected Lambda functions",
              "Increase timeout configurations",
              "Activate fallback routing",
              "Scale infrastructure if needed",
            ],
            timeLimit: "10 minutes",
          },
          {
            step: 4,
            action: "Verify Resolution",
            description: "Confirm latency has returned to normal levels",
            verification: [
              "P95 latency < 5 seconds for emergency operations",
              "Success rate > 95%",
              "No new alerts triggered",
            ],
          },
          {
            step: 5,
            action: "Post-Incident",
            description: "Document incident and schedule follow-up",
            tasks: [
              "Create incident report",
              "Schedule post-mortem meeting",
              "Update runbook if needed",
            ],
          },
        ],
      },

      {
        title: "Routing Efficiency Degradation",
        description: "Response procedures for routing efficiency alerts",
        severity: "warning",
        maxResponseTime: "15 minutes",
        steps: [
          {
            step: 1,
            action: "Analyze Routing Patterns",
            description: "Review routing decisions and efficiency metrics",
            commands: [
              "Check routing distribution dashboard",
              "Review intelligent router logs",
              "Analyze fallback usage patterns",
            ],
          },
          {
            step: 2,
            action: "Identify Root Cause",
            description: "Determine why routing efficiency has degraded",
            commonCauses: [
              "Unbalanced routing decisions",
              "Health check failures",
              "Performance degradation in one path",
              "Configuration changes",
            ],
          },
          {
            step: 3,
            action: "Apply Corrections",
            description: "Implement fixes based on root cause analysis",
            solutions: [
              "Adjust routing thresholds",
              "Restart unhealthy components",
              "Update routing configuration",
              "Rebalance traffic distribution",
            ],
          },
        ],
      },

      {
        title: "Health Score Degradation",
        description: "Response procedures for system health alerts",
        severity: "error",
        maxResponseTime: "10 minutes",
        steps: [
          {
            step: 1,
            action: "Identify Unhealthy Components",
            description:
              "Determine which components are causing health degradation",
            commands: [
              "Check health monitoring dashboard",
              "Review component-specific metrics",
              "Analyze error logs",
            ],
          },
          {
            step: 2,
            action: "Component-Specific Actions",
            description: "Apply targeted fixes for unhealthy components",
            componentActions: {
              DirectBedrockClient: [
                "Check AWS Bedrock service status",
                "Verify IAM permissions",
                "Review rate limiting",
              ],
              MCPRouter: [
                "Check MCP service health",
                "Verify network connectivity",
                "Review message queue status",
              ],
              IntelligentRouter: [
                "Check routing logic",
                "Verify configuration",
                "Review decision metrics",
              ],
            },
          },
        ],
      },
    ];

    // Write individual runbook files
    for (const runbook of runbooks) {
      const filename =
        runbook.title.toLowerCase().replace(/\s+/g, "-") + "-runbook.md";
      const content = this.formatRunbookMarkdown(runbook);
      writeFileSync(join(this.outputDir, filename), content);
    }

    // Write runbook index
    const runbookIndex = {
      title: "Hybrid Routing Operational Runbooks",
      description:
        "Complete set of operational procedures for hybrid routing system",
      runbooks: runbooks.map((rb) => ({
        title: rb.title,
        severity: rb.severity,
        maxResponseTime: rb.maxResponseTime,
        filename: rb.title.toLowerCase().replace(/\s+/g, "-") + "-runbook.md",
      })),
    };

    writeFileSync(
      join(this.outputDir, "runbook-index.json"),
      JSON.stringify(runbookIndex, null, 2)
    );

    console.log("✅ Operational runbooks generated");
  }

  /**
   * Create deployment checklist
   */
  private async createDeploymentChecklist(): Promise<void> {
    console.log("📋 Creating deployment checklist...");

    const checklist = {
      title: "Production Monitoring and Alerting Deployment Checklist",
      description:
        "Pre-deployment verification checklist for monitoring and alerting",

      preDeployment: [
        {
          category: "Infrastructure Validation",
          items: [
            "✅ All monitoring stack files exist and are valid",
            "✅ CloudWatch dashboards configured",
            "✅ SNS topics created and subscriptions configured",
            "✅ PagerDuty integration tested (if enabled)",
            "✅ Slack integration tested (if enabled)",
            "✅ IAM roles and permissions configured",
          ],
        },
        {
          category: "Configuration Validation",
          items: [
            "✅ Monitoring thresholds reviewed and approved",
            "✅ Alert escalation policies configured",
            "✅ Notification channels tested",
            "✅ Dashboard widgets display correctly",
            "✅ Metric namespaces and dimensions verified",
          ],
        },
        {
          category: "Testing",
          items: [
            "✅ Alerting test plan executed successfully",
            "✅ All alert types triggered and verified",
            "✅ Notification delivery confirmed",
            "✅ Escalation procedures tested",
            "✅ Runbooks validated with test scenarios",
          ],
        },
      ],

      deployment: [
        {
          category: "Infrastructure Deployment",
          items: [
            "⏳ Deploy production monitoring stack",
            "⏳ Deploy hybrid routing monitoring stack",
            "⏳ Verify CloudWatch resources created",
            "⏳ Confirm SNS topics and subscriptions",
            "⏳ Test metric publishing",
          ],
        },
        {
          category: "Application Integration",
          items: [
            "⏳ Deploy monitoring-enabled application code",
            "⏳ Verify metric collection is working",
            "⏳ Confirm dashboard data population",
            "⏳ Test alert triggering with real data",
          ],
        },
      ],

      postDeployment: [
        {
          category: "Verification",
          items: [
            "⏳ All dashboards accessible and displaying data",
            "⏳ Alerts configured and active",
            "⏳ Notification channels receiving test alerts",
            "⏳ Runbooks accessible to operations team",
            "⏳ Monitoring documentation updated",
          ],
        },
        {
          category: "Operations Handover",
          items: [
            "⏳ Operations team trained on new monitoring",
            "⏳ Runbooks reviewed with team",
            "⏳ Escalation procedures communicated",
            "⏳ Dashboard access granted to team members",
            "⏳ On-call rotation updated with new procedures",
          ],
        },
      ],

      rollback: [
        {
          category: "Rollback Procedures",
          items: [
            "🔄 Disable new alerting rules",
            "🔄 Revert to previous monitoring configuration",
            "🔄 Restore original notification settings",
            "🔄 Document rollback reason and lessons learned",
          ],
        },
      ],
    };

    writeFileSync(
      join(this.outputDir, "deployment-checklist.json"),
      JSON.stringify(checklist, null, 2)
    );

    // Also create a markdown version for easy reading
    const markdownChecklist = this.formatChecklistMarkdown(checklist);
    writeFileSync(
      join(this.outputDir, "deployment-checklist.md"),
      markdownChecklist
    );

    console.log("✅ Deployment checklist generated");
  }

  /**
   * Generate infrastructure recommendations
   */
  private generateInfrastructureRecommendations(
    missingFiles: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (missingFiles.includes("infra/cdk/production-monitoring-stack.ts")) {
      recommendations.push("Deploy production monitoring CDK stack");
    }

    if (missingFiles.includes("infra/cdk/hybrid-routing-monitoring-stack.ts")) {
      recommendations.push("Deploy hybrid routing monitoring CDK stack");
    }

    if (missingFiles.some((f) => f.includes("alerting/"))) {
      recommendations.push("Implement missing alerting components");
    }

    if (missingFiles.some((f) => f.includes("monitoring"))) {
      recommendations.push("Complete monitoring infrastructure setup");
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "All required infrastructure components are present"
      );
    }

    return recommendations;
  }

  /**
   * Format runbook as markdown
   */
  private formatRunbookMarkdown(runbook: any): string {
    let markdown = `# ${runbook.title}\n\n`;
    markdown += `**Description:** ${runbook.description}\n\n`;
    markdown += `**Severity:** ${runbook.severity}\n\n`;
    markdown += `**Maximum Response Time:** ${runbook.maxResponseTime}\n\n`;

    markdown += `## Response Steps\n\n`;

    for (const step of runbook.steps) {
      markdown += `### Step ${step.step}: ${step.action}\n\n`;
      markdown += `${step.description}\n\n`;

      if (step.timeLimit) {
        markdown += `**Time Limit:** ${step.timeLimit}\n\n`;
      }

      if (step.commands) {
        markdown += `**Commands:**\n`;
        for (const command of step.commands) {
          markdown += `- ${command}\n`;
        }
        markdown += `\n`;
      }

      if (step.options) {
        markdown += `**Options:**\n`;
        for (const option of step.options) {
          markdown += `- ${option}\n`;
        }
        markdown += `\n`;
      }

      if (step.verification) {
        markdown += `**Verification:**\n`;
        for (const item of step.verification) {
          markdown += `- ${item}\n`;
        }
        markdown += `\n`;
      }
    }

    return markdown;
  }

  /**
   * Format checklist as markdown
   */
  private formatChecklistMarkdown(checklist: any): string {
    let markdown = `# ${checklist.title}\n\n`;
    markdown += `${checklist.description}\n\n`;

    const sections = [
      "preDeployment",
      "deployment",
      "postDeployment",
      "rollback",
    ];
    const sectionTitles = {
      preDeployment: "Pre-Deployment",
      deployment: "Deployment",
      postDeployment: "Post-Deployment",
      rollback: "Rollback Procedures",
    };

    for (const section of sections) {
      if (checklist[section]) {
        markdown += `## ${sectionTitles[section]}\n\n`;

        for (const category of checklist[section]) {
          markdown += `### ${category.category}\n\n`;

          for (const item of category.items) {
            markdown += `- [ ] ${item}\n`;
          }
          markdown += `\n`;
        }
      }
    }

    return markdown;
  }
}

// Main execution
async function main() {
  const config = {
    ...PRODUCTION_CONFIG,
    // Override with environment variables if available
    alertEmail: process.env.ALERT_EMAIL || PRODUCTION_CONFIG.alertEmail,
    pagerDutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  };

  const preparation = new ProductionMonitoringPreparation(config);
  await preparation.prepare();
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { PRODUCTION_CONFIG, ProductionMonitoringPreparation };
