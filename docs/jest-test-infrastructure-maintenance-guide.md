# Jest Test Infrastructure - Maintenance Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-15  
**Status:** ✅ Production Ready

## Overview

This guide provides comprehensive documentation for the Jest test infrastructure implemented in matbakh.app. The infrastructure has been fully migrated from Vitest to Jest with enhanced stability, performance, and CI/CD integration.

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx jest --testPathPattern="your-test-name"

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Test File Structure

```
src/
├── setupTests.cjs         # Global Jest setup file
└── __tests__/
    └── *.test.ts          # TypeScript test files
```

## Configuration Files

### Main Jest Configuration (`jest.config.cjs`)

```javascript
// Pure CommonJS/JavaScript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.cjs"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.spec.json",
        useESM: false,
      },
    ],
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/archive/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  clearMocks: true,
  maxWorkers: 1,
  watchman: false,
};
```

### TypeScript Configuration for Tests (`tsconfig.spec.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

## Setup File (setupTests.cjs)

### Global Test Helpers

```javascript
// In setupTests.cjs
global.createMockFile = (name, content, type = "text/plain") => {
  return new File([content], name, { type });
};

globalThis.import = {
  meta: {
    env: {
      VITE_API_URL: "https://test-api.example.com",
      VITE_APP_VERSION: "1.0.0-test",
    },
  },
};
```

### Mock AWS SDK

```javascript
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: () => ({
    send: jest.fn(),
    PutObjectCommand: jest.fn(),
  }),
}));
```

## Best Practices

### ✅ DO

1. **Keep setup file simple** - Only essential polyfills and global mocks
2. **Use CommonJS in setup** - Pure JavaScript, no TypeScript
3. **Use TypeScript in test files** - Full type safety in tests
4. **Clean mocks after each test** - Use afterEach() for mock resets
5. **Global mock at setup level** - Mock AWS SDK and other globals in setupTests.cjs

### ❌ DON'T

```javascript
// ❌ No ESM syntax
export {};

// ❌ No import statements
import something from 'somewhere';

// ❌ No TypeScript syntax
globalThis.myGlobal = 'value' as any;

// ❌ No import.meta in test files
import.meta.env.VITE_API_URL;
```

### ✅ DO

```javascript
// ✅ Pure CommonJS/JavaScript
// In setupTests.cjs

global.myFunction = () => {};
globalThis.myGlobal = "value";

jest.mock("@/services/my-service");
require("@testing-library/jest-dom");
```

## Test File Patterns

### TypeScript Test Files (\*.test.ts)

```typescript
import { describe, it, expect } from "@jest/globals";
import { render } from "@testing-library/react";
import { MyComponent } from "@/components/MyComponent";

describe("MyComponent", () => {
  it("should render", () => {
    const { container } = render(<MyComponent />);
    // Test code
  });
});
```

## Common Patterns

### Mock import.meta.env

```javascript
// In setupTests.cjs
globalThis.import = {
  meta: {
    env: {
      VITE_API_URL: "https://test-api.example.com",
      VITE_APP_VERSION: "1.0.0-test",
    },
  },
};
```

### Global Test Helpers

```javascript
// In setupTests.cjs
global.createMockFile = (name, content, type = "text/plain") => {
  return new File([content], name, { type });
};
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Tests
  run: npx jest --runInBand --coverage --bail --findRelatedTests
  env:
    NODE_ENV: test
```

### Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npx jest --findRelatedTests"
    }
  }
}
```

## Performance Tips

### With Coverage

```javascript
module.exports = {
  // ... other config
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/archive/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Troubleshooting

### Error: "Unexpected token 'export'"

```bash
# Check jest.config.cjs
# Remove any import statements
# Use 'module.exports' instead of 'export'
```

### Error: "Cannot find module"

```bash
# Check setupTests.cjs has no TypeScript syntax
# Use `global` instead of `globalThis` for Node compatibility
```

### Error: "This is not defined"

```bash
# Use `global` for Node environment
# Check if variable is properly defined in setupTests.cjs
```

## Configuration Snippets

### Minimal jest.config.cjs

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.cjs"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.spec.json",
        useESM: false,
      },
    ],
  },
};
```

## Quick Commands

```bash
# Run all tests
npx jest

# Run with coverage
npx jest --coverage

# Watch mode (development)
npx jest --watch

# Run specific test
npx jest --testPathPattern="your-test-name" --runInBand --verbose

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Related Files

- [Full Migration Report](./jest-setup-commonjs-migration-2025-01-14.md)
- [jest.config.cjs](../jest.config.cjs)
- [setupTests.cjs](../src/setupTests.cjs)
- [Testing Infrastructure Guide](./testing-infrastructure-guide.md)

---

**Status:** ✅ Production Ready  
**Last Updated:** 2025-01-15
