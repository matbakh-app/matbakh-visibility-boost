# Microservices Testing Guide

**Version:** 1.0  
**Last Updated:** 2025-09-26  
**Maintainer:** Development Team  

## 🎯 Overview

This guide provides comprehensive instructions for testing the Microservices Foundation system, including setup, execution, and troubleshooting.

## 🏗️ Test Architecture

### Test Structure
```
├── jest.microservices.config.cjs          # Jest configuration for microservices
├── src/hooks/__tests__/
│   └── useMicroservices-minimal.test.tsx  # Hook functionality tests
├── src/components/microservices/__tests__/
│   └── MicroservicesDashboard-basic.test.tsx # Component integration tests
└── src/lib/microservices/__tests__/        # Core library tests
    ├── microservice-orchestrator-enhanced.test.ts
    ├── service-discovery-manager.test.ts
    └── app-mesh-manager.test.ts
```

### Test Categories

#### 1. Unit Tests (`src/lib/microservices/__tests__/`)
- **Purpose**: Test individual microservices components
- **Environment**: Node.js
- **Focus**: Business logic, AWS integrations, error handling

#### 2. Hook Tests (`src/hooks/__tests__/`)
- **Purpose**: Test React hooks for microservices
- **Environment**: jsdom
- **Focus**: State management, async operations, dependency injection

#### 3. Component Tests (`src/components/microservices/__tests__/`)
- **Purpose**: Test React components and UI integration
- **Environment**: jsdom
- **Focus**: Rendering, user interactions, data display

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure dependencies are installed
npm install

# Verify Jest configuration
npx jest --showConfig
```

### Running Tests

#### All Microservices Tests
```bash
npm run test:ms
```

#### UI Tests Only
```bash
npm run test:ms:ui
```

#### Unit Tests Only
```bash
npm run test:ms:unit
```

#### CDK Infrastructure Tests
```bash
npm run test:ms:cdk
```

### Expected Output
```bash
✅ Test Suites: 2 passed, 2 total
✅ Tests: 14 passed, 14 total
✅ Snapshots: 0 total
✅ Time: ~2.3s
✅ Exit Code: 0
```

## 🔧 Configuration Details

### Jest Configuration (`jest.microservices.config.cjs`)

```javascript
module.exports = {
    projects: [
        {
            displayName: 'ui',
            testEnvironment: 'jsdom',
            preset: 'ts-jest',
            testMatch: [
                '<rootDir>/src/components/microservices/__tests__/*.test.tsx',
                '<rootDir>/src/hooks/__tests__/useMicroservices-*.test.tsx'
            ],
            setupFilesAfterEnv: ['<rootDir>/test/setup-ui.ts'],
            transform: {
                '^.+\\.tsx?$': ['ts-jest', { 
                    tsconfig: 'tsconfig.spec.json',
                    jsx: 'react-jsx'  // Critical for JSX parsing
                }],
            },
        },
        // ... other projects
    ],
};
```

### Key Configuration Features
- **JSX Support**: Proper React JSX transformation
- **TypeScript**: Full TypeScript support with strict mode
- **Module Mapping**: Path aliases (`@/` → `src/`)
- **Setup Files**: Automated test environment setup

## 🧪 Writing Tests

### Hook Testing Pattern

```typescript
import React from 'react';
import { renderHook } from '@testing-library/react';
import { useMicroservices } from '../useMicroservices';

// Mock the microservices module
jest.mock('../../lib/microservices', () => ({
    createMicroserviceFoundation: jest.fn(() => ({
        orchestrator: {
            getAllServicesStatus: jest.fn().mockResolvedValue([]),
            // ... other methods
        },
    })),
}));

describe('useMicroservices', () => {
    it('should return expected structure', () => {
        const { result } = renderHook(() => 
            useMicroservices('development', 'eu-central-1')
        );

        expect(result.current).toHaveProperty('services');
        expect(result.current).toHaveProperty('isLoading');
        // ... other assertions
    });
});
```

### Component Testing Pattern

```typescript
import React from 'react';
import { render } from '@testing-library/react';
import { MicroservicesDashboard } from '../MicroservicesDashboard';

// Mock dependencies
jest.mock('../../../hooks/useMicroservices', () => ({
    useMicroservices: jest.fn(() => ({
        services: [],
        isLoading: false,
        // ... mock return values
    })),
}));

describe('MicroservicesDashboard', () => {
    it('should render without crashing', () => {
        const props = {
            environment: 'development' as const,
            region: 'eu-central-1' as const,
        };

        const { container } = render(
            React.createElement(MicroservicesDashboard, props)
        );
        
        expect(container).toBeInTheDocument();
    });
});
```

## 🔍 Debugging Tests

### Common Issues & Solutions

#### 1. JSX Parsing Errors
**Error:** `SyntaxError: Unexpected token '<'`

**Solution:**
```javascript
// In jest.microservices.config.cjs
transform: {
    '^.+\\.tsx?$': ['ts-jest', { 
        jsx: 'react-jsx'  // Add this line
    }],
},
```

#### 2. Import Resolution Errors
**Error:** `Cannot find module '../../lib/microservices'`

**Solution:**
```typescript
// Use module-level mocking
jest.mock('../../lib/microservices', () => ({
    createMicroserviceFoundation: jest.fn(() => (/* mock implementation */)),
}));
```

#### 3. Async Operation Timeouts
**Error:** `Exceeded timeout of 5000 ms for a test`

**Solution:**
```typescript
// Simplify async operations in tests
it('should handle async operations', async () => {
    const { result } = renderHook(() => useMicroservices('dev', 'eu-central-1'));
    
    // Wait for initial load without complex async chains
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.isLoading).toBe(false);
});
```

### Debug Commands

```bash
# Run tests with verbose output
npm run test:ms:ui -- --verbose

# Run specific test file
npx jest src/hooks/__tests__/useMicroservices-minimal.test.tsx

# Run tests in watch mode
npm run test:ms:ui -- --watch

# Generate coverage report
npm run test:ms:ui -- --coverage
```

## 📊 Test Coverage

### Current Coverage Metrics
- **Hook Tests**: 6 test cases
  - Structure validation
  - Environment support
  - Initial state verification
  - Utility functions
  
- **Component Tests**: 8 test cases
  - Rendering validation
  - Props handling
  - Environment compatibility
  - Integration testing

### Coverage Goals
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

## 🔄 Continuous Integration

### GitHub Actions Integration

```yaml
# In .github/workflows/
- name: Run Microservices Tests
  run: |
    npm run test:ms:ui
    npm run test:ms:unit
    npm run test:ms:cdk
```

### Pre-commit Hooks
```bash
# Add to package.json scripts
"pre-commit": "npm run test:ms:ui && npm run lint"
```

## 🛠️ Maintenance

### Regular Tasks

#### Weekly
- [ ] Review test execution times
- [ ] Check for flaky tests
- [ ] Update mock data if services change

#### Monthly
- [ ] Review test coverage metrics
- [ ] Update dependencies
- [ ] Refactor outdated test patterns

#### Quarterly
- [ ] Performance benchmark review
- [ ] Test architecture evaluation
- [ ] Documentation updates

### Adding New Tests

#### For New Hooks
1. Create test file: `src/hooks/__tests__/useNewHook-minimal.test.tsx`
2. Follow the established mocking pattern
3. Add to Jest configuration if needed
4. Update this documentation

#### For New Components
1. Create test file: `src/components/path/__tests__/Component-basic.test.tsx`
2. Mock all external dependencies
3. Use `React.createElement` to avoid JSX parsing issues
4. Test core functionality and props handling

## 📚 Best Practices

### Do's ✅
- Use descriptive test names
- Mock external dependencies completely
- Test error scenarios
- Keep tests focused and simple
- Use dependency injection for testability

### Don'ts ❌
- Don't test implementation details
- Don't use complex async chains in tests
- Don't rely on external services
- Don't skip error handling tests
- Don't ignore TypeScript errors in tests

## 🆘 Troubleshooting

### Getting Help

1. **Check this guide** for common issues
2. **Review test logs** for specific error messages
3. **Check Jest configuration** for environment issues
4. **Verify mock implementations** match actual interfaces
5. **Contact the development team** for complex issues

### Emergency Procedures

If all tests are failing:
1. Verify Jest configuration is correct
2. Check that all dependencies are installed
3. Ensure TypeScript compilation is working
4. Validate mock implementations
5. Consider reverting recent changes

---

**Last Updated:** 2025-09-26  
**Next Review:** 2025-10-26  
**Maintainer:** Development Team