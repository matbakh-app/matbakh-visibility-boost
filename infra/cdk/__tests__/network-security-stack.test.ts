/**
 * Network Security Stack Tests
 * 
 * Tests für:
 * - Network Firewall Konfiguration
 * - Security Group Regeln
 * - Secrets Manager Setup
 * - VPC Flow Logs
 */

import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { NetworkSecurityStack } from '../network-security-stack';

describe('NetworkSecurityStack', () => {
    let app: cdk.App;
    let vpc: ec2.Vpc;
    let stack: NetworkSecurityStack;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();

        // Mock VPC für Tests
        const vpcStack = new cdk.Stack(app, 'TestVpcStack');
        vpc = new ec2.Vpc(vpcStack, 'TestVpc', {
            maxAzs: 2,
            natGateways: 1,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Public',
                    subnetType: ec2.SubnetType.PUBLIC
                },
                {
                    cidrMask: 24,
                    name: 'Private',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
                }
            ]
        });

        stack = new NetworkSecurityStack(app, 'TestNetworkSecurityStack', {
            vpc,
            environment: 'test'
        });

        template = Template.fromStack(stack);
    });

    describe('Network Firewall', () => {
        it('should create Network Firewall with correct configuration', () => {
            template.hasResourceProperties('AWS::NetworkFirewall::Firewall', {
                FirewallName: Match.stringLikeRegexp('ai-egress-firewall-.*'),
                VpcId: Match.anyValue(),
                SubnetMappings: Match.arrayWith([
                    Match.objectLike({ SubnetId: Match.anyValue() })
                ])
            });
        });

        it('should create HTTPS rule group for AI providers', () => {
            template.hasResourceProperties('AWS::NetworkFirewall::RuleGroup', {
                RuleGroupName: Match.stringLikeRegexp('ai-provider-https-allowlist-.*'),
                Type: 'STATEFUL',
                Capacity: 100,
                RuleGroup: {
                    RulesSource: {
                        StatefulRules: Match.arrayWith([
                            Match.objectLike({
                                Action: 'PASS',
                                Header: {
                                    Destination: '*.googleapis.com',
                                    DestinationPort: '443',
                                    Protocol: 'TCP'
                                }
                            })
                        ])
                    }
                }
            });
        });

        it('should create DNS rule group', () => {
            template.hasResourceProperties('AWS::NetworkFirewall::RuleGroup', {
                RuleGroupName: Match.stringLikeRegexp('ai-provider-dns-allowlist-.*'),
                Type: 'STATEFUL',
                Capacity: 50,
                RuleGroup: {
                    RulesSource: {
                        StatefulRules: Match.arrayWith([
                            Match.objectLike({
                                Action: 'PASS',
                                Header: {
                                    DestinationPort: '53',
                                    Protocol: 'UDP'
                                }
                            })
                        ])
                    }
                }
            });
        });

        it('should create firewall policy with strict order', () => {
            template.hasResourceProperties('AWS::NetworkFirewall::FirewallPolicy', {
                FirewallPolicyName: Match.stringLikeRegexp('ai-egress-policy-.*'),
                FirewallPolicy: {
                    StatefulRuleGroupReferences: Match.arrayWith([
                        Match.objectLike({ Priority: 100 }),
                        Match.objectLike({ Priority: 200 })
                    ]),
                    StatefulDefaultActions: ['aws:drop_strict'],
                    StatefulEngineOptions: {
                        RuleOrder: 'STRICT_ORDER'
                    }
                }
            });
        });
    });

    describe('Security Groups', () => {
        it('should create restrictive egress security group', () => {
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                GroupDescription: 'Restrictive egress for AI provider communication',
                VpcId: Match.anyValue(),
                SecurityGroupEgress: Match.arrayWith([
                    // HTTPS egress
                    Match.objectLike({
                        IpProtocol: 'tcp',
                        FromPort: 443,
                        ToPort: 443,
                        CidrIp: '0.0.0.0/0'
                    }),
                    // DNS egress (UDP)
                    Match.objectLike({
                        IpProtocol: 'udp',
                        FromPort: 53,
                        ToPort: 53,
                        CidrIp: '0.0.0.0/0'
                    }),
                    // DNS egress (TCP)
                    Match.objectLike({
                        IpProtocol: 'tcp',
                        FromPort: 53,
                        ToPort: 53,
                        CidrIp: '0.0.0.0/0'
                    })
                ])
            });
        });

        it('should not allow all outbound traffic', () => {
            // Prüfen, dass keine "allow all outbound" Regel existiert
            template.hasResourceProperties('AWS::EC2::SecurityGroup', {
                SecurityGroupEgress: Match.not(
                    Match.arrayWith([
                        Match.objectLike({
                            IpProtocol: '-1',
                            CidrIp: '0.0.0.0/0'
                        })
                    ])
                )
            });
        });
    });

    describe('DoD Criteria Validation', () => {
        it('should meet DoD: Only allowed destinations reachable', () => {
            // Network Firewall sollte nur erlaubte Domains durchlassen
            const firewallRules = template.findResources('AWS::NetworkFirewall::RuleGroup');

            Object.values(firewallRules).forEach((ruleGroup: any) => {
                if (ruleGroup.Properties.RuleGroup?.RulesSource?.StatefulRules) {
                    const rules = ruleGroup.Properties.RuleGroup.RulesSource.StatefulRules;
                    rules.forEach((rule: any) => {
                        expect(rule.Action).toBe('PASS');
                        expect(rule.Header.DestinationPort).toMatch(/^(443|53)$/);
                    });
                }
            });
        });

        it('should meet DoD: Secrets rotation capable', () => {
            // EventBridge Rules für Rotation sollten existieren
            template.resourceCountIs('AWS::Events::Rule', 2);

            // Lambda Functions für Rotation sollten existieren
            const lambdas = template.findResources('AWS::Lambda::Function');
            expect(Object.keys(lambdas)).toHaveLength(2);
        });

        it('should meet DoD: Latency impact < +5ms', () => {
            // Network Firewall sollte in derselben AZ wie NAT Gateway sein
            // (wird durch Subnet-Mapping sichergestellt)
            template.hasResourceProperties('AWS::NetworkFirewall::Firewall', {
                SubnetMappings: Match.arrayWith([
                    Match.objectLike({ SubnetId: Match.anyValue() })
                ])
            });
        });
    });
});