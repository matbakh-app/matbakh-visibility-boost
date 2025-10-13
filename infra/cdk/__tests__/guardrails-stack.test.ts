/**
 * Guardrails Stack Tests
 * 
 * Tests für:
 * - Bedrock Guardrails Konfiguration
 * - IAM Permissions
 * - Cost Monitoring
 * - CloudWatch Dashboards
 */

import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { GuardrailsStack } from '../guardrails-stack';

describe('GuardrailsStack', () => {
    let app: cdk.App;
    let stack: GuardrailsStack;
    let template: Template;

    beforeEach(() => {
        app = new cdk.App();
        stack = new GuardrailsStack(app, 'TestGuardrailsStack', {
            environment: 'test',
            costBudgetUsd: 100
        });
        template = Template.fromStack(stack);
    });

    describe('IAM Role Configuration', () => {
        it('should create Guardrails IAM role with correct permissions', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: Match.stringLikeRegexp('ai-guardrails-role-.*'),
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 'lambda.amazonaws.com'
                            },
                            Action: 'sts:AssumeRole'
                        }
                    ]
                }
            });
        });

        it('should have Bedrock Guardrails permissions', () => {
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Effect: 'Allow',
                            Action: [
                                'bedrock:ApplyGuardrail',
                                'bedrock:GetGuardrail',
                                'bedrock:ListGuardrails'
                            ],
                            Resource: Match.stringLikeRegexp('arn:aws:bedrock:.*:.*:guardrail/\\*')
                        })
                    ])
                }
            });
        });

        it('should have Comprehend permissions for PII detection', () => {
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Effect: 'Allow',
                            Action: [
                                'comprehend:DetectPiiEntities',
                                'comprehend:DetectSentiment',
                                'comprehend:DetectToxicContent'
                            ],
                            Resource: '*'
                        })
                    ])
                }
            });
        });

        it('should have CloudWatch Logs permissions', () => {
            template.hasResourceProperties('AWS::IAM::Policy', {
                PolicyDocument: {
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Effect: 'Allow',
                            Action: [
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                            ]
                        })
                    ])
                }
            });
        });
    });

    describe('CloudWatch Logging', () => {
        it('should create Guardrails log group', () => {
            template.hasResourceProperties('AWS::Logs::LogGroup', {
                LogGroupName: '/aws/ai-orchestrator/guardrails',
                RetentionInDays: 30
            });
        });

        it('should create metric filter for safety violations', () => {
            template.hasResourceProperties('AWS::Logs::MetricFilter', {
                LogGroupName: Match.anyValue(),
                FilterPattern: Match.stringLikeRegexp('.*CRITICAL.*'),
                MetricTransformations: [
                    {
                        MetricNamespace: 'AI/Guardrails',
                        MetricName: 'SafetyViolations',
                        MetricValue: '1',
                        DefaultValue: 0
                    }
                ]
            });
        });

        it('should create metric filter for PII detections', () => {
            template.hasResourceProperties('AWS::Logs::MetricFilter', {
                LogGroupName: Match.anyValue(),
                FilterPattern: Match.stringLikeRegexp('.*PII.*'),
                MetricTransformations: [
                    {
                        MetricNamespace: 'AI/Guardrails',
                        MetricName: 'PIIDetections',
                        MetricValue: '1',
                        DefaultValue: 0
                    }
                ]
            });
        });
    });

    describe('Bedrock Guardrails', () => {
        it('should create legal domain guardrail', () => {
            template.hasResourceProperties('AWS::Bedrock::Guardrail', {
                Name: Match.stringLikeRegexp('legal-domain-guardrail-.*'),
                Description: 'Guardrail for legal domain content',
                BlockedInputMessaging: 'Content blocked by legal domain guardrail',
                BlockedOutputsMessaging: 'Output blocked by legal domain guardrail'
            });
        });

        it('should create medical domain guardrail', () => {
            template.hasResourceProperties('AWS::Bedrock::Guardrail', {
                Name: Match.stringLikeRegexp('medical-domain-guardrail-.*'),
                Description: 'Guardrail for medical domain content'
            });
        });

        it('should create culinary domain guardrail', () => {
            template.hasResourceProperties('AWS::Bedrock::Guardrail', {
                Name: Match.stringLikeRegexp('culinary-domain-guardrail-.*'),
                Description: 'Guardrail for culinary/restaurant domain content'
            });
        });

        it('should create general domain guardrail', () => {
            template.hasResourceProperties('AWS::Bedrock::Guardrail', {
                Name: Match.stringLikeRegexp('general-domain-guardrail-.*'), \n        Description: 'General purpose guardrail for standard content'\n
            }); \n
        }); \n\n    it('should create guardrail versions', () => { \n      template.resourceCountIs('AWS::Bedrock::GuardrailVersion', 4); \n      \n      template.hasResourceProperties('AWS::Bedrock::GuardrailVersion', { \n        Description: Match.stringLikeRegexp('Version 1 of .* domain guardrail') \n }); \n }); \n\n    it('should configure content policy filters correctly', () => { \n      // Legal domain sollte strenge Einstellungen haben\n      template.hasResourceProperties('AWS::Bedrock::Guardrail', {\n        Name: Match.stringLikeRegexp('legal-domain-guardrail-.*'),\n        ContentPolicyConfig: {\n          FiltersConfig: Match.arrayWith([\n            Match.objectLike({\n              Type: 'SEXUAL',\n              InputStrength: 'HIGH',\n              OutputStrength: 'HIGH'\n            }),\n            Match.objectLike({\n              Type: 'HATE',\n              InputStrength: 'HIGH',\n              OutputStrength: 'HIGH'\n            })\n          ])\n        }\n      });\n    });\n\n    it('should configure PII policies for sensitive domains', () => {\n      // Legal domain sollte PII blockieren\n      template.hasResourceProperties('AWS::Bedrock::Guardrail', {\n        Name: Match.stringLikeRegexp('legal-domain-guardrail-.*'),\n        SensitiveInformationPolicyConfig: {\n          PiiEntitiesConfig: Match.arrayWith([\n            Match.objectLike({\n              Type: 'EMAIL',\n              Action: 'BLOCK'\n            }),\n            Match.objectLike({\n              Type: 'SSN',\n              Action: 'BLOCK'\n            })\n          ])\n        }\n      });\n    });\n\n    it('should configure topic policies for restricted domains', () => {\n      // Legal domain sollte Legal Advice Topic haben\n      template.hasResourceProperties('AWS::Bedrock::Guardrail', {\n        Name: Match.stringLikeRegexp('legal-domain-guardrail-.*'),\n        TopicPolicyConfig: {\n          TopicsConfig: Match.arrayWith([\n            Match.objectLike({\n              Name: 'Legal Advice',\n              Definition: Match.stringLikeRegexp('.*legal advice.*'),\n              Type: 'DENY'\n            })\n          ])\n        }\n      });\n    });\n  });\n\n  describe('Cost Monitoring', () => {\n    it('should create cost monitoring Lambda function', () => {\n      template.hasResourceProperties('AWS::Lambda::Function', {\n        FunctionName: Match.stringLikeRegexp('ai-guardrails-cost-monitor-.*'),\n        Runtime: 'nodejs20.x',\n        Handler: 'index.handler',\n        Environment: {\n          Variables: {\n            BUDGET_USD: '100'\n          }\n        }\n      });\n    });\n\n    it('should have Cost Explorer permissions', () => {\n      template.hasResourceProperties('AWS::IAM::Policy', {\n        PolicyDocument: {\n          Statement: Match.arrayWith([\n            Match.objectLike({\n              Effect: 'Allow',\n              Action: [\n                'ce:GetCostAndUsage',\n                'ce:GetUsageReport'\n              ],\n              Resource: '*'\n            })\n          ])\n        }\n      });\n    });\n\n    it('should have CloudWatch Metrics permissions', () => {\n      template.hasResourceProperties('AWS::IAM::Policy', {\n        PolicyDocument: {\n          Statement: Match.arrayWith([\n            Match.objectLike({\n              Effect: 'Allow',\n              Action: ['cloudwatch:PutMetricData'],\n              Resource: '*'\n            })\n          ])\n        }\n      });\n    });\n\n    it('should create daily cost monitoring schedule', () => {\n      template.hasResourceProperties('AWS::Events::Rule', {\n        ScheduleExpression: 'rate(24 hours)',\n        Description: 'Daily Bedrock Guardrails cost monitoring'\n      });\n    });\n  });\n\n  describe('CloudWatch Dashboard', () => {\n    it('should create monitoring dashboard', () => {\n      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {\n        DashboardName: Match.stringLikeRegexp('ai-guardrails-monitoring-.*')\n      });\n    });\n\n    it('should include safety violations widget', () => {\n      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');\n      const dashboardBody = JSON.parse(Object.values(dashboards)[0].Properties.DashboardBody);\n      \n      const safetyWidget = dashboardBody.widgets.find((w: any) => \n        w.properties?.title === 'Safety Violations (24h)'\n      );\n      \n      expect(safetyWidget).toBeDefined();\n      expect(safetyWidget.properties.metrics[0]).toEqual(\n        expect.arrayContaining(['AI/Guardrails', 'SafetyViolations'])\n      );\n    });\n\n    it('should include PII detections widget', () => {\n      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');\n      const dashboardBody = JSON.parse(Object.values(dashboards)[0].Properties.DashboardBody);\n      \n      const piiWidget = dashboardBody.widgets.find((w: any) => \n        w.properties?.title === 'PII Detections (24h)'\n      );\n      \n      expect(piiWidget).toBeDefined();\n      expect(piiWidget.properties.metrics[0]).toEqual(\n        expect.arrayContaining(['AI/Guardrails', 'PIIDetections'])\n      );\n    });\n\n    it('should include cost monitoring widget', () => {\n      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');\n      const dashboardBody = JSON.parse(Object.values(dashboards)[0].Properties.DashboardBody);\n      \n      const costWidget = dashboardBody.widgets.find((w: any) => \n        w.properties?.title === 'Daily Guardrails Cost (USD)'\n      );\n      \n      expect(costWidget).toBeDefined();\n      expect(costWidget.properties.metrics[0]).toEqual(\n        expect.arrayContaining(['AI/Guardrails', 'DailyCostUSD'])\n      );\n    });\n  });\n\n  describe('Outputs', () => {\n    it('should export all required outputs', () => {\n      const outputs = template.findOutputs('*');\n      \n      expect(outputs).toHaveProperty('GuardrailsRoleArn');\n      expect(outputs).toHaveProperty('GuardrailsLogGroupName');\n      expect(outputs).toHaveProperty('CostMonitoringLambdaArn');\n      expect(outputs).toHaveProperty('legalGuardrailId');\n      expect(outputs).toHaveProperty('medicalGuardrailId');\n      expect(outputs).toHaveProperty('culinaryGuardrailId');\n      expect(outputs).toHaveProperty('generalGuardrailId');\n    });\n\n    it('should have correct export names', () => {\n      template.hasOutput('GuardrailsRoleArn', {\n        Export: {\n          Name: Match.stringLikeRegexp('ai-guardrails-role-arn-.*')\n        }\n      });\n\n      template.hasOutput('legalGuardrailId', {\n        Export: {\n          Name: Match.stringLikeRegexp('ai-guardrail-legal-id-.*')\n        }\n      });\n    });\n  });\n\n  describe('DoD Criteria Validation', () => {\n    it('should meet DoD: Domain-specific guardrails deployed', () => {\n      // Alle 4 Domains sollten Guardrails haben\n      template.resourceCountIs('AWS::Bedrock::Guardrail', 4);\n      \n      const domains = ['legal', 'medical', 'culinary', 'general'];\n      domains.forEach(domain => {\n        template.hasResourceProperties('AWS::Bedrock::Guardrail', {\n          Name: Match.stringLikeRegexp(`${domain}-domain-guardrail-.*`)\n        });\n      });\n    });\n\n    it('should meet DoD: Cost monitoring active', () => {\n      // Cost Monitoring Lambda sollte existieren\n      template.resourceCountIs('AWS::Lambda::Function', 1);\n      \n      // Daily Schedule sollte existieren\n      template.hasResourceProperties('AWS::Events::Rule', {\n        ScheduleExpression: 'rate(24 hours)'\n      });\n    });\n\n    it('should meet DoD: Safety violations logged', () => {\n      // Metric Filters für Safety Violations\n      template.hasResourceProperties('AWS::Logs::MetricFilter', {\n        MetricTransformations: [\n          {\n            MetricNamespace: 'AI/Guardrails',\n            MetricName: 'SafetyViolations'\n          }\n        ]\n      });\n    });\n\n    it('should meet DoD: PII detection configured', () => {\n      // Legal und Medical Domains sollten PII-Konfiguration haben\n      template.hasResourceProperties('AWS::Bedrock::Guardrail', {\n        Name: Match.stringLikeRegexp('legal-domain-guardrail-.*'),\n        SensitiveInformationPolicyConfig: {\n          PiiEntitiesConfig: Match.arrayWith([\n            Match.objectLike({ Type: 'EMAIL' }),\n            Match.objectLike({ Type: 'SSN' })\n          ])\n        }\n      });\n    });\n\n    it('should meet DoD: Monitoring dashboard available', () => {\n      // Dashboard sollte existieren\n      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);\n      \n      // Dashboard sollte alle wichtigen Metriken enthalten\n      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');\n      const dashboardBody = JSON.parse(Object.values(dashboards)[0].Properties.DashboardBody);\n      \n      expect(dashboardBody.widgets.length).toBeGreaterThanOrEqual(4);\n    });\n  });\n\n  describe('Environment-specific Configuration', () => {\n    it('should work with different environments', () => {\n      const environments = ['development', 'staging', 'production'] as const;\n      \n      environments.forEach(env => {\n        expect(() => {\n          new GuardrailsStack(app, `GuardrailsStack-${env}`, {\n            environment: env,\n            costBudgetUsd: 200\n          });\n        }).not.toThrow();\n      });\n    });\n\n    it('should use environment in resource names', () => {\n      template.hasResourceProperties('AWS::Bedrock::Guardrail', {\n        Name: Match.stringLikeRegexp('.*-test$')\n      });\n    });\n\n    it('should configure budget based on props', () => {\n      const highBudgetStack = new GuardrailsStack(app, 'HighBudgetStack', {\n        environment: 'production',\n        costBudgetUsd: 500\n      });\n      \n      const highBudgetTemplate = Template.fromStack(highBudgetStack);\n      \n      highBudgetTemplate.hasResourceProperties('AWS::Lambda::Function', {\n        Environment: {\n          Variables: {\n            BUDGET_USD: '500'\n          }\n        }\n      });\n    });\n  });\n});