/**
 * Guardrails Stack - Bedrock Guardrails Infrastructure
 * 
 * Implements:
 * - Domain-specific Bedrock Guardrails
 * - IAM roles for Guardrails access
 * - CloudWatch monitoring for safety violations
 * - Cost controls for Guardrails usage
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export interface GuardrailsStackProps extends cdk.StackProps {
    environment: 'development' | 'staging' | 'production';
    costBudgetUsd: number;
}

export class GuardrailsStack extends cdk.Stack {
    readonly guardrailsRole: iam.Role;
    readonly guardrailsLogGroup: logs.LogGroup;
    readonly costMonitoringLambda: lambda.Function;
    readonly guardrailIds: Record<string, string> = {};

    constructor(scope: Construct, id: string, props: GuardrailsStackProps) {
        super(scope, id, props);

        // 1. IAM Role für Guardrails Access
        this.createGuardrailsRole();

        // 2. CloudWatch Logging
        this.createLogging();

        // 3. Domain-specific Guardrails
        this.createDomainGuardrails(props.environment);

        // 4. Cost Monitoring
        this.createCostMonitoring(props.costBudgetUsd);

        // 5. CloudWatch Dashboards
        this.createMonitoringDashboard();

        // 6. Outputs
        this.createOutputs();
    }

    private createGuardrailsRole(): void {
        this.guardrailsRole = new iam.Role(this, 'GuardrailsRole', {
            roleName: `ai-guardrails-role-${this.stackName}`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            description: 'Role for AI Orchestrator to access Bedrock Guardrails',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
            ]
        });

        // Bedrock Guardrails permissions
        this.guardrailsRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:ApplyGuardrail',
                'bedrock:GetGuardrail',
                'bedrock:ListGuardrails'
            ],
            resources: [
                `arn:aws:bedrock:${this.region}:${this.account}:guardrail/*`
            ]
        }));

        // Comprehend permissions für PII detection
        this.guardrailsRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'comprehend:DetectPiiEntities',
                'comprehend:DetectSentiment',
                'comprehend:DetectToxicContent'
            ],
            resources: ['*']
        }));

        // CloudWatch Logs permissions
        this.guardrailsRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
            resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/ai-guardrails-*`
            ]
        })); \n
    } \n\n  private createLogging(): void { \n    this.guardrailsLogGroup = new logs.LogGroup(this, 'GuardrailsLogGroup', { \n      logGroupName: '/aws/ai-orchestrator/guardrails', \n      retention: logs.RetentionDays.THIRTY_DAYS, \n      removalPolicy: cdk.RemovalPolicy.DESTROY\n }); \n\n    // Metric Filter für Safety Violations\n    new logs.MetricFilter(this, 'SafetyViolationsMetric', {\n      logGroup: this.guardrailsLogGroup,\n      metricNamespace: 'AI/Guardrails',\n      metricName: 'SafetyViolations',\n      filterPattern: logs.FilterPattern.stringValue('$.violation.severity', '=', 'CRITICAL'),\n      metricValue: '1',\n      defaultValue: 0\n    });\n\n    // Metric Filter für PII Detections\n    new logs.MetricFilter(this, 'PIIDetectionsMetric', {\n      logGroup: this.guardrailsLogGroup,\n      metricNamespace: 'AI/Guardrails',\n      metricName: 'PIIDetections',\n      filterPattern: logs.FilterPattern.stringValue('$.violation.type', '=', 'PII'),\n      metricValue: '1',\n      defaultValue: 0\n    });\n  }\n\n  private createDomainGuardrails(environment: string): void {\n    const domains = [\n      {\n        name: 'legal',\n        description: 'Guardrail for legal domain content',\n        topicPolicyConfig: {\n          topicsConfig: [\n            {\n              name: 'Legal Advice',\n              definition: 'Content that provides specific legal advice or recommendations',\n              examples: ['You should sue them', 'This contract is invalid'],\n              type: 'DENY'\n            }\n          ]\n        },\n        contentPolicyConfig: {\n          filtersConfig: [\n            { type: 'SEXUAL', inputStrength: 'HIGH', outputStrength: 'HIGH' },\n            { type: 'VIOLENCE', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'HATE', inputStrength: 'HIGH', outputStrength: 'HIGH' },\n            { type: 'INSULTS', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'MISCONDUCT', inputStrength: 'HIGH', outputStrength: 'HIGH' },\n            { type: 'PROMPT_ATTACK', inputStrength: 'HIGH', outputStrength: 'NONE' }\n          ]\n        },\n        sensitiveInformationPolicyConfig: {\n          piiEntitiesConfig: [\n            { type: 'EMAIL', action: 'BLOCK' },\n            { type: 'PHONE', action: 'BLOCK' },\n            { type: 'SSN', action: 'BLOCK' },\n            { type: 'CREDIT_DEBIT_CARD_NUMBER', action: 'BLOCK' }\n          ]\n        }\n      },\n      {\n        name: 'medical',\n        description: 'Guardrail for medical domain content',\n        topicPolicyConfig: {\n          topicsConfig: [\n            {\n              name: 'Medical Diagnosis',\n              definition: 'Content that provides specific medical diagnoses or treatment recommendations',\n              examples: ['You have cancer', 'Take this medication'],\n              type: 'DENY'\n            }\n          ]\n        },\n        contentPolicyConfig: {\n          filtersConfig: [\n            { type: 'SEXUAL', inputStrength: 'HIGH', outputStrength: 'HIGH' },\n            { type: 'VIOLENCE', inputStrength: 'LOW', outputStrength: 'LOW' },\n            { type: 'HATE', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'INSULTS', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'MISCONDUCT', inputStrength: 'HIGH', outputStrength: 'HIGH' },\n            { type: 'PROMPT_ATTACK', inputStrength: 'HIGH', outputStrength: 'NONE' }\n          ]\n        },\n        sensitiveInformationPolicyConfig: {\n          piiEntitiesConfig: [\n            { type: 'EMAIL', action: 'ANONYMIZE' },\n            { type: 'PHONE', action: 'BLOCK' },\n            { type: 'SSN', action: 'BLOCK' },\n            { type: 'CREDIT_DEBIT_CARD_NUMBER', action: 'BLOCK' }\n          ]\n        }\n      },\n      {\n        name: 'culinary',\n        description: 'Guardrail for culinary/restaurant domain content',\n        contentPolicyConfig: {\n          filtersConfig: [\n            { type: 'SEXUAL', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'VIOLENCE', inputStrength: 'HIGH', outputStrength: 'HIGH' },\n            { type: 'HATE', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'INSULTS', inputStrength: 'LOW', outputStrength: 'LOW' },\n            { type: 'MISCONDUCT', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' }\n          ]\n        }\n      },\n      {\n        name: 'general',\n        description: 'General purpose guardrail for standard content',\n        contentPolicyConfig: {\n          filtersConfig: [\n            { type: 'SEXUAL', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'VIOLENCE', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'HATE', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' },\n            { type: 'INSULTS', inputStrength: 'LOW', outputStrength: 'LOW' },\n            { type: 'MISCONDUCT', inputStrength: 'MEDIUM', outputStrength: 'MEDIUM' }\n          ]\n        }\n      }\n    ];\n\n    domains.forEach(domain => {\n      const guardrail = new bedrock.CfnGuardrail(this, `${domain.name}Guardrail`, {\n        name: `${domain.name}-domain-guardrail-${environment}`,\n        description: domain.description,\n        blockedInputMessaging: `Content blocked by ${domain.name} domain guardrail`,\n        blockedOutputsMessaging: `Output blocked by ${domain.name} domain guardrail`,\n        topicPolicyConfig: domain.topicPolicyConfig,\n        contentPolicyConfig: domain.contentPolicyConfig,\n        sensitiveInformationPolicyConfig: domain.sensitiveInformationPolicyConfig,\n        tags: [\n          {\n            key: 'Domain',\n            value: domain.name\n          },\n          {\n            key: 'Environment',\n            value: environment\n          },\n          {\n            key: 'Purpose',\n            value: 'AI-Content-Safety'\n          }\n        ]\n      });\n\n      // Create Guardrail Version\n      const guardrailVersion = new bedrock.CfnGuardrailVersion(this, `${domain.name}GuardrailVersion`, {\n        guardrailIdentifier: guardrail.attrGuardrailId,\n        description: `Version 1 of ${domain.name} domain guardrail`\n      });\n\n      // Store Guardrail ID for outputs\n      this.guardrailIds[domain.name] = guardrail.attrGuardrailId;\n    });\n  }\n\n  private createCostMonitoring(budgetUsd: number): void {\n    this.costMonitoringLambda = new lambda.Function(this, 'GuardrailsCostMonitor', {\n      functionName: `ai-guardrails-cost-monitor-${this.stackName}`,\n      runtime: lambda.Runtime.NODEJS_20_X,\n      handler: 'index.handler',\n      code: lambda.Code.fromInline(`\n        const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');\n        const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');\n        \n        const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });\n        const costExplorer = new CostExplorerClient({ region: 'us-east-1' }); // Cost Explorer nur in us-east-1\n        \n        exports.handler = async (event) => {\n          try {\n            const endDate = new Date().toISOString().split('T')[0];\n            const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];\n            \n            const costCommand = new GetCostAndUsageCommand({\n              TimePeriod: {\n                Start: startDate,\n                End: endDate\n              },\n              Granularity: 'DAILY',\n              Metrics: ['BlendedCost'],\n              GroupBy: [\n                {\n                  Type: 'DIMENSION',\n                  Key: 'SERVICE'\n                }\n              ],\n              Filter: {\n                Dimensions: {\n                  Key: 'SERVICE',\n                  Values: ['Amazon Bedrock']\n                }\n              }\n            });\n            \n            const costResponse = await costExplorer.send(costCommand);\n            let bedrockCost = 0;\n            \n            if (costResponse.ResultsByTime && costResponse.ResultsByTime.length > 0) {\n              const result = costResponse.ResultsByTime[0];\n              if (result.Groups && result.Groups.length > 0) {\n                bedrockCost = parseFloat(result.Groups[0].Metrics.BlendedCost.Amount);\n              }\n            }\n            \n            // Publish cost metric\n            await cloudwatch.send(new PutMetricDataCommand({\n              Namespace: 'AI/Guardrails',\n              MetricData: [\n                {\n                  MetricName: 'DailyCostUSD',\n                  Value: bedrockCost,\n                  Unit: 'None',\n                  Timestamp: new Date()\n                }\n              ]\n            }));\n            \n            // Check budget threshold\n            const monthlyProjection = bedrockCost * 30;\n            const budgetThreshold = ${budgetUsd};\n            \n            if (monthlyProjection > budgetThreshold * 0.8) {\n              console.warn(\`Guardrails cost projection (\${monthlyProjection}) approaching budget (\${budgetThreshold})\`);\n              \n              await cloudwatch.send(new PutMetricDataCommand({\n                Namespace: 'AI/Guardrails',\n                MetricData: [\n                  {\n                    MetricName: 'BudgetAlert',\n                    Value: 1,\n                    Unit: 'Count',\n                    Timestamp: new Date()\n                  }\n                ]\n              }));\n            }\n            \n            return {\n              statusCode: 200,\n              body: JSON.stringify({\n                dailyCost: bedrockCost,\n                monthlyProjection,\n                budgetThreshold\n              })\n            };\n          } catch (error) {\n            console.error('Cost monitoring error:', error);\n            return {\n              statusCode: 500,\n              body: JSON.stringify({ error: error.message })\n            };\n          }\n        };\n      `),\n      timeout: cdk.Duration.minutes(5),\n      environment: {\n        BUDGET_USD: budgetUsd.toString()\n      },\n      role: this.guardrailsRole\n    });\n\n    // Cost Explorer permissions\n    this.costMonitoringLambda.addToRolePolicy(new iam.PolicyStatement({\n      effect: iam.Effect.ALLOW,\n      actions: [\n        'ce:GetCostAndUsage',\n        'ce:GetUsageReport'\n      ],\n      resources: ['*']\n    }));\n\n    // CloudWatch Metrics permissions\n    this.costMonitoringLambda.addToRolePolicy(new iam.PolicyStatement({\n      effect: iam.Effect.ALLOW,\n      actions: [\n        'cloudwatch:PutMetricData'\n      ],\n      resources: ['*']\n    }));\n\n    // Daily cost monitoring schedule\n    new events.Rule(this, 'DailyCostMonitoringRule', {\n      schedule: events.Schedule.rate(cdk.Duration.hours(24)),\n      targets: [new targets.LambdaFunction(this.costMonitoringLambda)],\n      description: 'Daily Bedrock Guardrails cost monitoring'\n    });\n  }\n\n  private createMonitoringDashboard(): void {\n    const dashboard = new cloudwatch.Dashboard(this, 'GuardrailsDashboard', {\n      dashboardName: `ai-guardrails-monitoring-${this.stackName}`\n    });\n\n    // Safety Violations Widget\n    dashboard.addWidgets(\n      new cloudwatch.GraphWidget({\n        title: 'Safety Violations (24h)',\n        left: [\n          new cloudwatch.Metric({\n            namespace: 'AI/Guardrails',\n            metricName: 'SafetyViolations',\n            statistic: 'Sum',\n            period: cdk.Duration.hours(1)\n          })\n        ],\n        width: 12,\n        height: 6\n      })\n    );\n\n    // PII Detections Widget\n    dashboard.addWidgets(\n      new cloudwatch.GraphWidget({\n        title: 'PII Detections (24h)',\n        left: [\n          new cloudwatch.Metric({\n            namespace: 'AI/Guardrails',\n            metricName: 'PIIDetections',\n            statistic: 'Sum',\n            period: cdk.Duration.hours(1)\n          })\n        ],\n        width: 12,\n        height: 6\n      })\n    );\n\n    // Cost Monitoring Widget\n    dashboard.addWidgets(\n      new cloudwatch.GraphWidget({\n        title: 'Daily Guardrails Cost (USD)',\n        left: [\n          new cloudwatch.Metric({\n            namespace: 'AI/Guardrails',\n            metricName: 'DailyCostUSD',\n            statistic: 'Average',\n            period: cdk.Duration.days(1)\n          })\n        ],\n        width: 12,\n        height: 6\n      })\n    );\n\n    // Budget Alert Widget\n    dashboard.addWidgets(\n      new cloudwatch.SingleValueWidget({\n        title: 'Budget Alerts',\n        metrics: [\n          new cloudwatch.Metric({\n            namespace: 'AI/Guardrails',\n            metricName: 'BudgetAlert',\n            statistic: 'Sum',\n            period: cdk.Duration.days(1)\n          })\n        ],\n        width: 12,\n        height: 6\n      })\n    );\n  }\n\n  private createOutputs(): void {\n    new cdk.CfnOutput(this, 'GuardrailsRoleArn', {\n      value: this.guardrailsRole.roleArn,\n      exportName: `ai-guardrails-role-arn-${this.stackName}`,\n      description: 'ARN of the Guardrails IAM role'\n    });\n\n    new cdk.CfnOutput(this, 'GuardrailsLogGroupName', {\n      value: this.guardrailsLogGroup.logGroupName,\n      exportName: `ai-guardrails-log-group-${this.stackName}`,\n      description: 'Name of the Guardrails CloudWatch Log Group'\n    });\n\n    // Output Guardrail IDs\n    Object.entries(this.guardrailIds).forEach(([domain, guardrailId]) => {\n      new cdk.CfnOutput(this, `${domain}GuardrailId`, {\n        value: guardrailId,\n        exportName: `ai-guardrail-${domain}-id-${this.stackName}`,\n        description: `Guardrail ID for ${domain} domain`\n      });\n    });\n\n    new cdk.CfnOutput(this, 'CostMonitoringLambdaArn', {\n      value: this.costMonitoringLambda.functionArn,\n      exportName: `ai-guardrails-cost-monitor-arn-${this.stackName}`,\n      description: 'ARN of the cost monitoring Lambda function'\n    });\n  }\n}