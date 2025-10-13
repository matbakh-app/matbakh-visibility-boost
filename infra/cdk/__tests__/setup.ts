/**
 * CDK Test Setup
 * 
 * Suppress CDK deprecation warnings in tests
 */

const origWarn = console.warn;

beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation((msg?: any, ...args: any[]) => {
        const msgStr = String(msg);
        // Suppress CDK/JSII deprecation warnings
        if (msgStr.includes('.warnings.jsii.js')) return;
        if (msgStr.includes('deprecated')) return;
        if (msgStr.includes('JSII')) return;
        if (msgStr.includes('containerInsights')) return;
        if (msgStr.includes('[WARNING]')) return;

        origWarn(msg, ...args);
    });
});

afterAll(() => {
    (console.warn as any).mockRestore?.();
});