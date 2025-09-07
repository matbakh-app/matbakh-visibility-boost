/**
 * Audit Trail System for GDPR Compliance
 * 
 * Implements comprehensive audit logging for all AI operations,
 * data access, and compliance-related activities.
 */

import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createHash, randomUUID } from 'crypto';

export interface AuditEvent {
  audit_id: string;
  timestamp: string;
  event_type: 'ai_operation' | 'data_access' | 'pii_detection' | 'user_consent' | 'data_deletion' | 'system_access';
  actor: {
    type: 'user' | 'system' | 'admin' | 'ai_agent';
    id: string;
    ip_address?: string | undefined;
    user_agent?: string | undefined;
  };
  resource: {
    type: 'ai_model' | 'user_data' | 'business_data' | 'system_config';
    id: string;
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
  };
  action: string;
  outcome: 'success' | 'failure' | 'partial' | 'blocked';
  details: {
    description: string;
    metadata: Record<string, any>;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    compliance_flags: {
      gdpr_relevant: boolean;
      retention_required: boolean;
      notification_required: boolean;
    };
  };
  context: {
    session_id?: string;
    operation_id?: string;
    request_id?: string;
    trace_id?: string;
  };
}

export interface ComplianceReport {
  report_id: string;
  generated_at: string;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_events: number;
    gdpr_relevant_events: number;
    high_risk_events: number;
    compliance_violations: number;
  };
  categories: {
    [key: string]: {
      count: number;
      risk_distribution: Record<string, number>;
    };
  };
  recommendations: string[];
  violations: AuditEvent[];
}

export class AuditTrailSystem {
  private dynamoClient: DynamoDBClient;
  private auditTableName: string;
  
  constructor() {
    this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-central-1' });
    this.auditTableName = process.env.AUDIT_TRAIL_TABLE || 'bedrock_audit_trail';
  }

  /**
   * Log audit event
   */
  async logEvent(event: Partial<AuditEvent>): Promise<string> {
    const auditId = event.audit_id || randomUUID();
    const timestamp = new Date().toISOString();

    const fullEvent: AuditEvent = {
      audit_id: auditId,
      timestamp,
      event_type: event.event_type || 'system_access',
      actor: event.actor || { type: 'system', id: 'bedrock-agent' },
      resource: event.resource || { type: 'system_config', id: 'unknown', classification: 'internal' },
      action: event.action || 'unknown_action',
      outcome: event.outcome || 'success',
      details: {
        description: event.details?.description || 'No description provided',
        metadata: event.details?.metadata || {},
        risk_level: event.details?.risk_level || 'low',
        compliance_flags: {
          gdpr_relevant: event.details?.compliance_flags?.gdpr_relevant || false,
          retention_required: event.details?.compliance_flags?.retention_required || false,
          notification_required: event.details?.compliance_flags?.notification_required || false
        }
      },
      context: event.context || {}
    };

    // Calculate TTL (7 years for GDPR compliance)
    const ttl = Math.floor(Date.now() / 1000) + (7 * 365 * 24 * 60 * 60);

    const item = marshall({
      ...fullEvent,
      ttl,
      event_hash: this.generateEventHash(fullEvent)
    });

    const command = new PutItemCommand({
      TableName: this.auditTableName,
      Item: item
    });

    await this.dynamoClient.send(command);
    return auditId;
  }

  /**
   * Log AI operation audit event
   */
  async logAIOperation(params: {
    operation_id: string;
    user_id?: string;
    operation_type: string;
    provider: string;
    prompt_hash: string;
    pii_detected: boolean;
    outcome: 'success' | 'failure';
    error_message?: string;
  }): Promise<string> {
    return this.logEvent({
      event_type: 'ai_operation',
      actor: {
        type: params.user_id ? 'user' : 'system',
        id: params.user_id || 'anonymous'
      },
      resource: {
        type: 'ai_model',
        id: params.provider,
        classification: 'confidential'
      },
      action: `execute_${params.operation_type}`,
      outcome: params.outcome,
      details: {
        description: `AI operation ${params.operation_type} executed using ${params.provider}`,
        metadata: {
          operation_id: params.operation_id,
          prompt_hash: params.prompt_hash,
          pii_detected: params.pii_detected,
          error_message: params.error_message
        },
        risk_level: params.pii_detected ? 'high' : 'medium',
        compliance_flags: {
          gdpr_relevant: true,
          retention_required: true,
          notification_required: params.pii_detected
        }
      },
      context: {
        operation_id: params.operation_id
      }
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(params: {
    user_id: string;
    resource_type: string;
    resource_id: string;
    action: 'read' | 'write' | 'delete' | 'export';
    outcome: 'success' | 'failure' | 'blocked';
    ip_address?: string;
    user_agent?: string;
  }): Promise<string> {
    return this.logEvent({
      event_type: 'data_access',
      actor: {
        type: 'user',
        id: params.user_id,
        ip_address: params.ip_address,
        user_agent: params.user_agent
      },
      resource: {
        type: params.resource_type as any,
        id: params.resource_id,
        classification: 'confidential'
      },
      action: params.action,
      outcome: params.outcome,
      details: {
        description: `User ${params.action} access to ${params.resource_type}`,
        metadata: {
          resource_type: params.resource_type,
          resource_id: params.resource_id
        },
        risk_level: params.action === 'delete' ? 'high' : 'medium',
        compliance_flags: {
          gdpr_relevant: true,
          retention_required: true,
          notification_required: params.action === 'export'
        }
      }
    });
  }

  /**
   * Log PII detection event
   */
  async logPIIDetection(params: {
    operation_id: string;
    content_hash: string;
    pii_categories: string[];
    risk_score: number;
    actions_taken: string[];
  }): Promise<string> {
    return this.logEvent({
      event_type: 'pii_detection',
      actor: {
        type: 'system',
        id: 'pii-detection-system'
      },
      resource: {
        type: 'user_data',
        id: params.content_hash,
        classification: 'restricted'
      },
      action: 'detect_pii',
      outcome: 'success',
      details: {
        description: `PII detected in content with risk score ${params.risk_score}`,
        metadata: {
          operation_id: params.operation_id,
          pii_categories: params.pii_categories,
          risk_score: params.risk_score,
          actions_taken: params.actions_taken
        },
        risk_level: params.risk_score > 0.7 ? 'critical' : params.risk_score > 0.4 ? 'high' : 'medium',
        compliance_flags: {
          gdpr_relevant: true,
          retention_required: true,
          notification_required: params.risk_score > 0.8
        }
      },
      context: {
        operation_id: params.operation_id
      }
    });
  }

  /**
   * Log user consent event
   */
  async logUserConsent(params: {
    user_id: string;
    consent_type: string;
    granted: boolean;
    ip_address?: string;
  }): Promise<string> {
    return this.logEvent({
      event_type: 'user_consent',
      actor: {
        type: 'user',
        id: params.user_id,
        ip_address: params.ip_address
      },
      resource: {
        type: 'user_data',
        id: params.user_id,
        classification: 'restricted'
      },
      action: params.granted ? 'grant_consent' : 'revoke_consent',
      outcome: 'success',
      details: {
        description: `User ${params.granted ? 'granted' : 'revoked'} consent for ${params.consent_type}`,
        metadata: {
          consent_type: params.consent_type,
          granted: params.granted
        },
        risk_level: 'medium',
        compliance_flags: {
          gdpr_relevant: true,
          retention_required: true,
          notification_required: false
        }
      }
    });
  }

  /**
   * Query audit events with filters
   */
  async queryEvents(filters: {
    event_type?: string;
    actor_id?: string;
    start_date?: string;
    end_date?: string;
    risk_level?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    let keyConditionExpression = '';
    let filterExpression = '';
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    if (filters.event_type) {
      keyConditionExpression = 'event_type = :event_type';
      expressionAttributeValues[':event_type'] = filters.event_type;
    }

    if (filters.start_date) {
      filterExpression += (filterExpression ? ' AND ' : '') + '#timestamp >= :start_date';
      expressionAttributeValues[':start_date'] = filters.start_date;
      expressionAttributeNames['#timestamp'] = 'timestamp';
    }

    if (filters.end_date) {
      filterExpression += (filterExpression ? ' AND ' : '') + '#timestamp <= :end_date';
      expressionAttributeValues[':end_date'] = filters.end_date;
      expressionAttributeNames['#timestamp'] = 'timestamp';
    }

    const command = keyConditionExpression ? new QueryCommand({
      TableName: this.auditTableName,
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: filterExpression || undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? marshall(expressionAttributeValues) : undefined,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      Limit: filters.limit || 100,
      ScanIndexForward: false
    }) : new ScanCommand({
      TableName: this.auditTableName,
      FilterExpression: filterExpression || undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? marshall(expressionAttributeValues) : undefined,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      Limit: filters.limit || 100
    });

    const result = await this.dynamoClient.send(command);
    return result.Items?.map(item => unmarshall(item) as AuditEvent) || [];
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: string, endDate: string): Promise<ComplianceReport> {
    const events = await this.queryEvents({
      start_date: startDate,
      end_date: endDate,
      limit: 10000
    });

    const summary = {
      total_events: events.length,
      gdpr_relevant_events: events.filter(e => e.details.compliance_flags.gdpr_relevant).length,
      high_risk_events: events.filter(e => ['high', 'critical'].includes(e.details.risk_level)).length,
      compliance_violations: events.filter(e => e.outcome === 'blocked' || e.details.risk_level === 'critical').length
    };

    const categories: Record<string, any> = {};
    events.forEach(event => {
      if (!categories[event.event_type]) {
        categories[event.event_type] = {
          count: 0,
          risk_distribution: { low: 0, medium: 0, high: 0, critical: 0 }
        };
      }
      categories[event.event_type].count++;
      categories[event.event_type].risk_distribution[event.details.risk_level]++;
    });

    const recommendations: string[] = [];
    if (summary.compliance_violations > 0) {
      recommendations.push('Review and address compliance violations');
    }
    if (summary.high_risk_events > summary.total_events * 0.1) {
      recommendations.push('High percentage of high-risk events - review security measures');
    }

    const violations = events.filter(e => 
      e.outcome === 'blocked' || 
      e.details.risk_level === 'critical' ||
      (e.details.compliance_flags.notification_required && e.outcome !== 'success')
    );

    return {
      report_id: randomUUID(),
      generated_at: new Date().toISOString(),
      period: { start_date: startDate, end_date: endDate },
      summary,
      categories,
      recommendations,
      violations
    };
  }

  /**
   * Generate event hash for deduplication
   */
  private generateEventHash(event: AuditEvent): string {
    const hashInput = `${event.event_type}:${event.actor.id}:${event.resource.id}:${event.action}:${event.timestamp}`;
    return createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  /**
   * Clean up old audit events (respecting GDPR retention)
   */
  async cleanupOldEvents(): Promise<{ deleted_count: number }> {
    // DynamoDB TTL handles automatic cleanup
    // This method is for manual cleanup if needed
    return { deleted_count: 0 };
  }
}

// Export singleton instance
export const auditTrailSystem = new AuditTrailSystem();