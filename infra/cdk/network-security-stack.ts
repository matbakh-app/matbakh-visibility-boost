/**
 * Network Security Stack - Cross-Cloud Egress & Isolation
 * 
 * Implements secure networking for AI provider access:
 * - AWS Network Firewall with FQDN allowlist
 * - NAT Gateway with restrictive Security Groups
 * - VPC Flow Logs for monitoring
 * - Connection pooling optimization
 */

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as networkfirewall from 'aws-cdk-lib/aws-networkfirewall';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface NetworkSecurityStackProps extends cdk.StackProps {
    vpc: ec2.IVpc;
    environment: 'development' | 'staging' | 'production';
}

export class NetworkSecurityStack extends cdk.Stack {
    readonly firewallArn: string;
    readonly egressSecurityGroup: ec2.SecurityGroup;

    constructor(scope: Construct, id: string, props: NetworkSecurityStackProps) {
        super(scope, id, props);

        // 1. FQDN-basierte Allowlist für AI Provider
        const allowedDomains = [
            // Google AI Endpoints
            '*.googleapis.com',
            'generativelanguage.googleapis.com',
            'aiplatform.googleapis.com',
            'europe-west1-aiplatform.googleapis.com', // EU-spezifisch
            'europe-west3-aiplatform.googleapis.com', // EU-spezifisch

            // Anthropic (falls Direct API benötigt)
            'api.anthropic.com',

            // Meta AI (nach Bedarf)
            // 'api.meta.ai', // Beispiel - tatsächliche Endpoints hinzufügen

            // Monitoring & Observability
            'monitoring.googleapis.com',
            'logging.googleapis.com'
        ];

        // 2. Network Firewall Rule Group
        const aiProviderRuleGroup = new networkfirewall.CfnRuleGroup(this, 'AiProviderRuleGroup', {
            capacity: 300,
            ruleGroupName: `ai-provider-allowlist-${props.environment}`,
            type: 'STATEFUL',
            description: 'FQDN allowlist for AI provider endpoints with TLS SNI inspection',
            ruleGroup: {
                rulesSource: {
                    rulesSourceList: {
                        targetTypes: ['TLS_SNI', 'HTTP_HOST'],
                        targets: allowedDomains,
                        generatedRulesType: 'ALLOWLIST'
                    }
                },
                ruleVariables: {
                    ipSets: {
                        'GOOGLE_AI_RANGES': {
                            definition: [
                                '8.8.8.0/24',      // Google Public DNS (für Auflösung)
                                '8.8.4.0/24',      // Google Public DNS
                                '142.250.0.0/15',  // Google Services
                                '172.217.0.0/16'   // Google APIs
                            ]
                        }
                    },
                    portSets: {
                        'HTTPS_PORTS': {
                            definition: ['443', '8443']
                        }
                    }
                },
                statefulRuleOptions: {
                    ruleOrder: 'STRICT_ORDER'
                }
            },
            tags: [
                { key: 'Environment', value: props.environment },
                { key: 'Service', value: 'ai-orchestration' },
                { key: 'Component', value: 'network-security' }
            ]
        });

        // 3. Network Firewall Policy
        const firewallPolicy = new networkfirewall.CfnFirewallPolicy(this, 'AiFirewallPolicy', {
            firewallPolicyName: `ai-orchestration-policy-${props.environment}`,
            firewallPolicy: {
                statefulRuleGroupReferences: [{
                    resourceArn: aiProviderRuleGroup.attrRuleGroupArn,
                    priority: 100
                }],
                statefulDefaultActions: [
                    'aws:drop_strict',    // Block unerlaubte Verbindungen
                    'aws:alert_strict'    // Alert für Monitoring
                ],
                statefulEngineOptions: {
                    ruleOrder: 'STRICT_ORDER',
                    streamExceptionPolicy: 'DROP'
                }
            },
            tags: [
                { key: 'Environment', value: props.environment },
                { key: 'Service', value: 'ai-orchestration' }
            ]
        });

        // 4. Network Firewall Deployment
        const firewall = new networkfirewall.CfnFirewall(this, 'AiNetworkFirewall', {
            firewallName: `ai-orchestration-fw-${props.environment}`,
            firewallPolicyArn: firewallPolicy.attrFirewallPolicyArn,
            vpcId: props.vpc.vpcId,
            subnetMappings: props.vpc.privateSubnets.map(subnet => ({
                subnetId: subnet.subnetId
            })),
            deleteProtection: props.environment === 'production',
            tags: [
                { key: 'Environment', value: props.environment },
                { key: 'Service', value: 'ai-orchestration' },
                { key: 'Component', value: 'network-firewall' }
            ]
        });

        this.firewallArn = firewall.attrFirewallArn;

        // 5. Restrictive Security Group für NAT Gateway Egress
        this.egressSecurityGroup = new ec2.SecurityGroup(this, 'AiEgressSg', {
            vpc: props.vpc,
            description: 'Restrictive egress for AI provider access',
            allowAllOutbound: false // Explizit keine Outbound-Regeln
        });

        // Nur HTTPS zu AI Providern erlauben
        this.egressSecurityGroup.addEgressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(443),
            'HTTPS to AI providers (filtered by Network Firewall)'
        );

        // DNS Resolution erlauben
        this.egressSecurityGroup.addEgressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.udp(53),
            'DNS resolution'
        );

        // 6. VPC Flow Logs für Monitoring
        const flowLogsGroup = new logs.LogGroup(this, 'AiNetworkFlowLogs', {
            logGroupName: `/aws/vpc/ai-orchestration/${props.environment}/flowlogs`,
            retention: props.environment === 'production'
                ? logs.RetentionDays.THIRTY_DAYS
                : logs.RetentionDays.SEVEN_DAYS,
            removalPolicy: props.environment === 'production'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY
        });

        const flowLog = new ec2.FlowLog(this, 'AiVpcFlowLog', {
            resourceType: ec2.FlowLogResourceType.fromVpc(props.vpc),
            destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogsGroup),
            trafficType: ec2.FlowLogTrafficType.ALL,
            maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE
        });

        // 7. CloudWatch Alarms für unerlaubte Verbindungen
        const unauthorizedConnectionsAlarm = new cloudwatch.Alarm(this, 'UnauthorizedConnectionsAlarm', {
            alarmName: `ai-orchestration-unauthorized-connections-${props.environment}`,
            alarmDescription: 'Alert when unauthorized connections are detected',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/VPC/FlowLogs',
                metricName: 'RejectedConnections',
                dimensionsMap: {
                    VpcId: props.vpc.vpcId
                },
                statistic: 'Sum'
            }),
            threshold: 10, // Alert bei mehr als 10 blockierten Verbindungen
            evaluationPeriods: 2,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
        });

        // 8. Outputs für andere Stacks
        new cdk.CfnOutput(this, 'NetworkFirewallArn', {
            value: this.firewallArn,
            exportName: `ai-network-firewall-arn-${props.environment}`,
            description: 'Network Firewall ARN for AI provider access control'
        });

        new cdk.CfnOutput(this, 'EgressSecurityGroupId', {
            value: this.egressSecurityGroup.securityGroupId,
            exportName: `ai-egress-sg-${props.environment}`,
            description: 'Security Group ID for AI provider egress traffic'
        });
    }
}
```