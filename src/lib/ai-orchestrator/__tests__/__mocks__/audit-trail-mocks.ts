/**
 * Audit Trail Mock Implementations
 *
 * Mock implementations for testing audit trail functionality
 * in the Bedrock Support Manager system.
 */

import type {
  AuditEvent,
  AuditEventType,
  AuditQuery,
  AuditReport,
} from "../../audit-trail-system";

/**
 * Mock Factory for Audit Trail System
 */
export class MockAuditTrailSystem {
  public logEvent = jest.fn();
  public queryEvents = jest.fn();
  public generateReport = jest.fn();
  public getEventById = jest.fn();
  public deleteOldEvents = jest.fn();

  constructor() {
    this.setupDefaultBehavior();
  }

  private setupDefaultBehavior(): void {
    // Default: Successful event logging
    this.logEvent.mockResolvedValue({
      eventId: "audit-event-123",
      timestamp: new Date(),
      success: true,
    });

    // Default: Empty query results
    this.queryEvents.mockResolvedValue({
      events: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
    });

    // Default: Clean audit report
    this.generateReport.mockResolvedValue({
      reportId: "audit-report-456",
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(),
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      recommendations: [],
    } as AuditReport);

    // Default: Event not found
    this.getEventById.mockResolvedValue(null);

    // Default: Successful cleanup
    this.deleteOldEvents.mockResolvedValue({
      deletedCount: 0,
      success: true,
    });
  }

  /**
   * Configure mock with sample events
   */
  configureSampleEvents(events: Partial<AuditEvent>[]): void {
    const fullEvents = events.map((event, index) => ({
      eventId: event.eventId || `event-${index}`,
      timestamp: event.timestamp || new Date(),
      eventType: event.eventType || "support_operation",
      severity: event.severity || "info",
      actor: event.actor || { type: "system", id: "bedrock-support" },
      resource: event.resource || { type: "support_manager", id: "default" },
      action: event.action || "test_action",
      outcome: event.outcome || "success",
      metadata: event.metadata || {},
      ...event,
    }));

    this.queryEvents.mockResolvedValue({
      events: fullEvents,
      totalCount: fullEvents.length,
      page: 1,
      pageSize: 50,
    });

    this.generateReport.mockResolvedValue({
      reportId: "audit-report-789",
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(),
      totalEvents: fullEvents.length,
      eventsByType: this.groupByType(fullEvents),
      eventsBySeverity: this.groupBySeverity(fullEvents),
      recommendations: [],
    });
  }

  /**
   * Configure mock for high-volume scenario
   */
  configureHighVolume(eventCount: number = 1000): void {
    this.queryEvents.mockResolvedValue({
      events: Array(50)
        .fill(null)
        .map((_, i) => this.createMockEvent(i)),
      totalCount: eventCount,
      page: 1,
      pageSize: 50,
    });

    this.generateReport.mockResolvedValue({
      reportId: "audit-report-high-volume",
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(),
      totalEvents: eventCount,
      eventsByType: {
        support_operation: eventCount * 0.4,
        infrastructure_audit: eventCount * 0.3,
        compliance_check: eventCount * 0.2,
        emergency_operation: eventCount * 0.1,
      },
      eventsBySeverity: {
        info: eventCount * 0.6,
        warning: eventCount * 0.3,
        error: eventCount * 0.08,
        critical: eventCount * 0.02,
      },
      recommendations: [
        "High event volume detected",
        "Consider increasing retention period",
      ],
    });
  }

  /**
   * Configure mock for compliance violations
   */
  configureComplianceViolations(): void {
    const violationEvents = [
      {
        eventId: "violation-1",
        eventType: "compliance_check" as AuditEventType,
        severity: "error" as const,
        outcome: "failure" as const,
        metadata: {
          violation: "GDPR data residency requirement not met",
          region: "us-east-1",
        },
      },
      {
        eventId: "violation-2",
        eventType: "compliance_check" as AuditEventType,
        severity: "warning" as const,
        outcome: "partial_success" as const,
        metadata: {
          violation: "PII detection threshold exceeded",
          count: 5,
        },
      },
    ];

    this.configureSampleEvents(violationEvents);
  }

  /**
   * Configure mock for error tracking
   */
  configureErrorTracking(): void {
    const errorEvents = Array(10)
      .fill(null)
      .map((_, i) => ({
        eventId: `error-${i}`,
        eventType: "support_operation" as AuditEventType,
        severity: "error" as const,
        outcome: "failure" as const,
        metadata: {
          error: `Test error ${i}`,
          stackTrace: "Mock stack trace",
        },
      }));

    this.configureSampleEvents(errorEvents);
  }

  // Helper methods
  private createMockEvent(index: number): AuditEvent {
    return {
      eventId: `event-${index}`,
      timestamp: new Date(Date.now() - index * 1000),
      eventType: "support_operation",
      severity: "info",
      actor: { type: "system", id: "bedrock-support" },
      resource: { type: "support_manager", id: "default" },
      action: `test_action_${index}`,
      outcome: "success",
      metadata: { index },
    };
  }

  private groupByType(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupBySeverity(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

/**
 * Test Data Generators for Audit Trail
 */
export class AuditTestDataGenerators {
  /**
   * Generate mock audit event
   */
  static auditEvent(overrides?: Partial<AuditEvent>): AuditEvent {
    return {
      eventId: "test-event-123",
      timestamp: new Date(),
      eventType: "support_operation",
      severity: "info",
      actor: {
        type: "system",
        id: "bedrock-support",
      },
      resource: {
        type: "support_manager",
        id: "default",
      },
      action: "test_action",
      outcome: "success",
      metadata: {},
      ...overrides,
    };
  }

  /**
   * Generate mock audit query
   */
  static auditQuery(overrides?: Partial<AuditQuery>): AuditQuery {
    return {
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(),
      eventTypes: [],
      severities: [],
      actors: [],
      outcomes: [],
      page: 1,
      pageSize: 50,
      ...overrides,
    };
  }

  /**
   * Generate mock audit report
   */
  static auditReport(overrides?: Partial<AuditReport>): AuditReport {
    return {
      reportId: "test-report-456",
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(),
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      recommendations: [],
      ...overrides,
    };
  }
}

/**
 * Export all audit trail mocks
 */
export const AuditTrailMocks = {
  AuditTrailSystem: MockAuditTrailSystem,
  TestData: AuditTestDataGenerators,
};
