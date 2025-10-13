// Import KiroBridge directly without circular dependency
import { KiroBridge } from "../kiro-bridge";

// Debug: Check if import worked
console.log("🔍 KiroBridge imported:", typeof KiroBridge);
console.log("🔍 KiroBridge constructor:", KiroBridge?.constructor?.name);

describe("Kiro Bridge Examples", () => {
  // Dummy test to ensure test suite is detected
  it("should always pass", () => {
    expect(true).toBe(true);
  });

  it("should import KiroBridge class correctly", () => {
    expect(KiroBridge).toBeDefined();
    expect(typeof KiroBridge).toBe("function");
  });

  it("should create KiroBridge instance", () => {
    const bridge = new KiroBridge();
    expect(bridge).toBeInstanceOf(KiroBridge);
  });

  it("should initialize and shutdown KiroBridge", async () => {
    const bridge = new KiroBridge();
    await expect(bridge.initialize()).resolves.not.toThrow();
    await expect(bridge.shutdown()).resolves.not.toThrow();
  });

  it("should send diagnostic request", async () => {
    const bridge = new KiroBridge();
    await bridge.initialize();

    const correlationId = await bridge.sendDiagnosticRequest("system_health", {
      test: "data",
    });

    expect(correlationId).toBeDefined();
    expect(typeof correlationId).toBe("string");

    await bridge.shutdown();
  });

  it("should send execution data", async () => {
    const bridge = new KiroBridge();
    await bridge.initialize();

    const correlationId = await bridge.sendExecutionData(
      "test-execution",
      "test-operation",
      "completed",
      { result: "success" }
    );

    expect(correlationId).toBeDefined();
    expect(typeof correlationId).toBe("string");

    await bridge.shutdown();
  });

  it("should register and handle messages", async () => {
    const bridge = new KiroBridge();
    let handlerCalled = false;

    bridge.registerMessageHandler("diagnostic_response", async () => {
      handlerCalled = true;
    });

    await bridge.receiveMessage({
      id: "test-id",
      correlationId: "test-correlation",
      type: "diagnostic_response",
      priority: "medium",
      timestamp: new Date(),
      source: "kiro",
      destination: "bedrock",
      routingPath: "hybrid",
      payload: { test: "data" },
      metadata: {
        retryCount: 0,
        maxRetries: 3,
        timeout: 30000,
        expiresAt: new Date(Date.now() + 30000),
      },
    });

    expect(handlerCalled).toBe(true);
  });

  it("should provide communication stats", async () => {
    const bridge = new KiroBridge();
    const stats = bridge.getStats();

    expect(stats).toBeDefined();
    expect(typeof stats.messagesSent).toBe("number");
    expect(typeof stats.messagesReceived).toBe("number");
    expect(typeof stats.errorRate).toBe("number");
  });
});
