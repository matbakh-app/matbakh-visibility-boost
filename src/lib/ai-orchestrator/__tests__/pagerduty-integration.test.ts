/**
 * Tests for PagerDuty Integration
 */

import {
  PagerDutyIncident,
  PagerDutyIntegration,
  PagerDutyServiceConfig,
  PagerDutySeverity,
} from "../alerting/pagerduty-integration";
import {
  AlertMessage,
  AlertSeverity,
} from "../alerting/sns-notification-manager";

// Mock fetch globally
global.fetch = jest.fn();

describe("PagerDutyIntegration", () => {
  let integration: PagerDutyIntegration;
  let serviceConfig: PagerDutyServiceConfig;

  beforeEach(() => {
    serviceConfig = {
      integrationKey: "test-integration-key-12345",
      serviceName: "Hybrid Routing Alerts",
      escalationPolicyId: "policy-123",
    };

    integration = new PagerDutyIntegration(serviceConfig, "production");

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    integration.clearActiveIncidents();
  });

  describe("Incident Management", () => {
    it("should trigger a PagerDuty incident", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
        customDetails: {
          test: "data",
        },
      };

      const response = await integration.triggerIncident(incident);

      expect(response.status).toBe("success");
      expect(response.dedup_key).toBe("incident-123");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://events.pagerduty.com/v2/enqueue",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should acknowledge an incident", async () => {
      // First trigger an incident
      const mockTriggerResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTriggerResponse,
      });

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
      };

      await integration.triggerIncident(incident);

      // Now acknowledge it
      const mockAckResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAckResponse,
      });

      const response = await integration.acknowledgeIncident("incident-123");

      expect(response.status).toBe("success");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should resolve an incident", async () => {
      // First trigger an incident
      const mockTriggerResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTriggerResponse,
      });

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
      };

      await integration.triggerIncident(incident);

      // Now resolve it
      const mockResolveResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResolveResponse,
      });

      const response = await integration.resolveIncident("incident-123");

      expect(response.status).toBe("success");
      expect(integration.getActiveIncidents().size).toBe(0);
    });

    it("should throw error when acknowledging non-existent incident", async () => {
      await expect(
        integration.acknowledgeIncident("non-existent")
      ).rejects.toThrow("Incident not found: non-existent");
    });

    it("should throw error when resolving non-existent incident", async () => {
      await expect(integration.resolveIncident("non-existent")).rejects.toThrow(
        "Incident not found: non-existent"
      );
    });
  });

  describe("Alert Message Integration", () => {
    it("should create incident from alert message", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const alertMessage: AlertMessage = {
        severity: AlertSeverity.CRITICAL,
        alarmName: "production-hybrid-routing-high-failure-rate",
        metricName: "SupportModeSuccessRate",
        threshold: 95,
        currentValue: 85,
        timestamp: new Date(),
        environment: "production",
        description: "Success rate has fallen below 95%",
        recommendations: ["Check system health", "Review logs"],
      };

      const response = await integration.createIncidentFromAlert(alertMessage);

      expect(response.status).toBe("success");
      expect(response.dedup_key).toBe("incident-123");

      // Verify the payload structure
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.payload.custom_details).toEqual({
        alarmName: alertMessage.alarmName,
        metricName: alertMessage.metricName,
        threshold: alertMessage.threshold,
        currentValue: alertMessage.currentValue,
        environment: alertMessage.environment,
        description: alertMessage.description,
        recommendations: alertMessage.recommendations,
      });
    });

    it("should auto-resolve incident when alert clears", async () => {
      // First trigger an incident
      const mockTriggerResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTriggerResponse,
      });

      const alertMessage: AlertMessage = {
        severity: AlertSeverity.CRITICAL,
        alarmName: "production-hybrid-routing-high-failure-rate",
        metricName: "SupportModeSuccessRate",
        threshold: 95,
        currentValue: 85,
        timestamp: new Date(),
        environment: "production",
        description: "Success rate has fallen below 95%",
      };

      await integration.createIncidentFromAlert(alertMessage);

      // Now auto-resolve it
      const mockResolveResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResolveResponse,
      });

      const response = await integration.autoResolveIncident(alertMessage);

      expect(response).not.toBeNull();
      expect(response?.status).toBe("success");
      expect(integration.getActiveIncidents().size).toBe(0);
    });

    it("should return null when auto-resolving non-existent incident", async () => {
      const alertMessage: AlertMessage = {
        severity: AlertSeverity.CRITICAL,
        alarmName: "non-existent-alarm",
        metricName: "SomeMetric",
        threshold: 95,
        currentValue: 85,
        timestamp: new Date(),
        environment: "production",
        description: "Test",
      };

      const response = await integration.autoResolveIncident(alertMessage);

      expect(response).toBeNull();
    });
  });

  describe("Severity Mapping", () => {
    it("should map CRITICAL alert to CRITICAL PagerDuty severity", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const alertMessage: AlertMessage = {
        severity: AlertSeverity.CRITICAL,
        alarmName: "test-alarm",
        metricName: "TestMetric",
        threshold: 95,
        currentValue: 85,
        timestamp: new Date(),
        environment: "production",
        description: "Test",
      };

      await integration.createIncidentFromAlert(alertMessage);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.payload.severity).toBe(PagerDutySeverity.CRITICAL);
    });

    it("should map WARNING alert to WARNING PagerDuty severity", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const alertMessage: AlertMessage = {
        severity: AlertSeverity.WARNING,
        alarmName: "test-alarm",
        metricName: "TestMetric",
        threshold: 95,
        currentValue: 85,
        timestamp: new Date(),
        environment: "production",
        description: "Test",
      };

      await integration.createIncidentFromAlert(alertMessage);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.payload.severity).toBe(PagerDutySeverity.WARNING);
    });

    it("should map INFO alert to INFO PagerDuty severity", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const alertMessage: AlertMessage = {
        severity: AlertSeverity.INFO,
        alarmName: "test-alarm",
        metricName: "TestMetric",
        threshold: 95,
        currentValue: 85,
        timestamp: new Date(),
        environment: "production",
        description: "Test",
      };

      await integration.createIncidentFromAlert(alertMessage);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.payload.severity).toBe(PagerDutySeverity.INFO);
    });
  });

  describe("Specialized Incident Triggers", () => {
    it("should trigger high failure rate incident", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await integration.triggerHighFailureRateIncident(85, 95);

      expect(response.status).toBe("success");

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.payload.severity).toBe(PagerDutySeverity.CRITICAL);
      expect(payload.payload.custom_details.threshold).toBe(95);
      expect(payload.payload.custom_details.currentValue).toBe(85);
      expect(payload.payload.custom_details.recommendations).toHaveLength(5);
    });

    it("should trigger high latency incident", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await integration.triggerHighLatencyIncident(1500, 1000);

      expect(response.status).toBe("success");

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.payload.severity).toBe(PagerDutySeverity.WARNING);
      expect(payload.payload.custom_details.threshold).toBe(1000);
      expect(payload.payload.custom_details.currentValue).toBe(1500);
    });

    it("should trigger cost threshold incident", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await integration.triggerCostThresholdIncident(150, 100);

      expect(response.status).toBe("success");

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.payload.severity).toBe(PagerDutySeverity.WARNING);
      expect(payload.payload.custom_details.threshold).toBe(100);
      expect(payload.payload.custom_details.currentValue).toBe(150);
    });
  });

  describe("Incident Tracking", () => {
    it("should track active incidents", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
      };

      await integration.triggerIncident(incident);

      const activeIncidents = integration.getActiveIncidents();
      expect(activeIncidents.size).toBe(1);
      expect(activeIncidents.get("incident-123")).toEqual(incident);
    });

    it("should get incident by dedup key", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
      };

      await integration.triggerIncident(incident);

      const retrievedIncident = integration.getIncident("incident-123");
      expect(retrievedIncident).toEqual(incident);
    });

    it("should return undefined for non-existent incident", () => {
      const incident = integration.getIncident("non-existent");
      expect(incident).toBeUndefined();
    });

    it("should clear all active incidents", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
      };

      await integration.triggerIncident(incident);

      expect(integration.getActiveIncidents().size).toBe(1);

      integration.clearActiveIncidents();

      expect(integration.getActiveIncidents().size).toBe(0);
    });
  });

  describe("Configuration Management", () => {
    it("should get service configuration", () => {
      const config = integration.getServiceConfig();

      expect(config).toEqual(serviceConfig);
    });

    it("should update service configuration", () => {
      const newConfig = {
        integrationKey: "new-key-12345",
      };

      integration.updateServiceConfig(newConfig);

      const config = integration.getServiceConfig();
      expect(config.integrationKey).toBe("new-key-12345");
      expect(config.serviceName).toBe(serviceConfig.serviceName);
    });
  });

  describe("Error Handling", () => {
    it("should handle PagerDuty API errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
      };

      await expect(integration.triggerIncident(incident)).rejects.toThrow(
        "PagerDuty API error: 400 - Bad Request"
      );
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
      };

      await expect(integration.triggerIncident(incident)).rejects.toThrow(
        "Failed to send PagerDuty event: Network error"
      );
    });
  });

  describe("Payload Structure", () => {
    it("should include all required fields in payload", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const incident: PagerDutyIncident = {
        incidentKey: "test-incident-key",
        severity: PagerDutySeverity.CRITICAL,
        summary: "Test incident",
        source: "production-hybrid-routing",
        timestamp: new Date(),
        customDetails: {
          test: "data",
        },
        links: [{ href: "https://example.com", text: "Example Link" }],
      };

      await integration.triggerIncident(incident);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload).toHaveProperty("routing_key");
      expect(payload).toHaveProperty("event_action");
      expect(payload).toHaveProperty("dedup_key");
      expect(payload).toHaveProperty("payload");
      expect(payload).toHaveProperty("links");
      expect(payload).toHaveProperty("client");
      expect(payload).toHaveProperty("client_url");

      expect(payload.payload).toHaveProperty("summary");
      expect(payload.payload).toHaveProperty("source");
      expect(payload.payload).toHaveProperty("severity");
      expect(payload.payload).toHaveProperty("timestamp");
      expect(payload.payload).toHaveProperty("component");
      expect(payload.payload).toHaveProperty("group");
      expect(payload.payload).toHaveProperty("class");
      expect(payload.payload).toHaveProperty("custom_details");
    });

    it("should include dashboard links in payload", async () => {
      const mockResponse = {
        status: "success",
        message: "Event processed",
        dedup_key: "incident-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const alertMessage: AlertMessage = {
        severity: AlertSeverity.CRITICAL,
        alarmName: "test-alarm",
        metricName: "TestMetric",
        threshold: 95,
        currentValue: 85,
        timestamp: new Date(),
        environment: "production",
        description: "Test",
      };

      await integration.createIncidentFromAlert(alertMessage);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.links).toHaveLength(2);
      expect(payload.links[0].text).toBe("CloudWatch Dashboard");
      expect(payload.links[1].text).toBe("Hybrid Routing Dashboard");
    });
  });
});
