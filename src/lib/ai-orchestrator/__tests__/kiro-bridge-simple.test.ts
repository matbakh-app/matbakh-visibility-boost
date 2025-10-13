describe("KiroBridge Simple Test", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should import KiroBridge", async () => {
    const { KiroBridge } = await import("../kiro-bridge");
    expect(KiroBridge).toBeDefined();
  });
});
