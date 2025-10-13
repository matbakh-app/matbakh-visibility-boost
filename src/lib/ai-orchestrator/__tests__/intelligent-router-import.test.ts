/**
 * Test to check if IntelligentRouter can be imported
 */

describe("IntelligentRouter Import Test", () => {
  it("should import IntelligentRouter without errors", async () => {
    const { IntelligentRouter } = await import("../intelligent-router");
    expect(IntelligentRouter).toBeDefined();
  });
});
