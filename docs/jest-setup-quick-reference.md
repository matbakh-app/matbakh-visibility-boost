# Jest Setup Quick Reference

**Last Updated:** 2025-01-14  
**Status:** Production Ready

## Quick Commands

```bash
# Run specific test
npx jest --testPathPattern="your-test-name" --runInBand --verbose

# Run all tests
npx jest

# Run with coverage
npx jest --coverage
```

## File Structure

- src/setupTests.cjs - CommonJS setup file
- src/__tests__/*.test.ts(x) - TypeScript test files
- jest.config.cjs - Jest configuration

## Setup File Rules (setupTests.cjs)

### DO
- Use pure JavaScript/CommonJS
- Use globalThis or global for globals
- Use require() for imports

### DON'T
- Use TypeScript syntax (as any)
- Use export statements
- Use import statements

## Troubleshooting

### Error: "Cannot use import statement"
Solution: Check jest.config.cjs has module: commonjs

### Error: "Unexpected token export"
Solution: Remove export statements from setupTests.cjs

### Error: "globalThis is not defined"
Solution: Use global instead for Node < 12

## Related Files

- Full Migration Report: jest-setup-commonjs-migration-2025-01-14.md
- Configuration: ../jest.config.cjs
- Setup File: ../src/setupTests.cjs

---

Quick Help: If tests fail after setup changes, check:
1. setupTests.cjs has no TypeScript syntax
2. jest.config.cjs uses module: commonjs
3. No export statements in setup file
4. Run with --runInBand for debugging
