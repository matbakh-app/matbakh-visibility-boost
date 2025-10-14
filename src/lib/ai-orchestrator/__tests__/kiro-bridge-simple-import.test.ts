/**
 * Simple import test for KiroBridge to isolate transpilation issues
 */

describe("KiroBridge Simple Import Test", () => {
  it("should be able to import the module", async () => {
    // Dynamic import to avoid transpilation issues
    const module = await import("../kiro-bridge");

    console.log("🔍 Module imported:", Object.keys(module));
    console.log("🔍 KiroBridge type:", typeof module.KiroBridge);

    expect(module).toBeDefined();
    expect(module.KiroBridge).toBeDefined();
    expect(typeof module.KiroBridge).toBe("function");
  });

  it("should be able to create an instance with dynamic import", async () => {
    const { KiroBridge } = await import("../kiro-bridge");

    expect(() => new KiroBridge()).not.toThrow();

    const bridge = new KiroBridge();
    expect(bridge).toBeInstanceOf(KiroBridge);
  });
});
