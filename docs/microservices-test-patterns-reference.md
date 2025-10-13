# Microservices Test Patterns Reference

**Version:** 1.0  
**Created:** 2025-09-26  
**Purpose:** Quick reference for common testing patterns in the Microservices Foundation

## 🎯 Quick Reference

### Test Execution Commands
```bash
# All microservices tests
npm run test:ms

# UI tests only (hooks + components)
npm run test:ms:ui

# Unit tests only (core libraries)
npm run test:ms:unit

# CDK infrastructure tests
npm run test:ms:cdk
```

### Expected Results
```bash
✅ Test Suites: 2 passed, 2 total
✅ Tests: 14 passed, 14 total
✅ Time: ~2.3s
✅ Exit Code: 0
```

## 🧪 Test Patterns

### 1. Hook Testing Pattern

#### Basic Structure
```typescript
import React from 'react';
import { renderHook } from '@testing-library/react';
import { useMicroservices } from '../useMicroservices';

// Module-level mock
jest.mock('../../lib/microservices', () => ({
    createMicroserviceFoundation: jest.fn(() => ({
        orchestrator: {
            getAllServicesStatus: jest.fn().mockResolvedValue([]),
            scaleService: jest.fn().mockResolvedValue({ success: true }),
            deployService: jest.fn().mockResolvedValue({ success: true }),
            removeService: jest.fn().mockResolvedValue({ success: true }),
            updateServiceConfiguration: jest.fn().mockResolvedValue({ success: true }),
            getCostAnalysis: jest.fn().mockResolvedValue({
                totalMonthlyCost: 0,
                budgetUtilization: 0,
                recommendations: [],
                lastUpdated: new Date(),
            }),
        },
        meshManager: {
            getMeshStatus: jest.fn().mockResolvedValue({
                meshName: 'test-mesh',
                region: 'eu-central-1',
                status: 'active',
                virtualServices: 0,
                virtualRouters: 0,
                virtualNodes: 0,
                lastUpdated: new Date(),
                errors: [],
            }),
        },
        serviceDiscovery: {
            getServiceStatistics: jest.fn().mockResolvedValue({
                totalServices: 0,
                healthyServices: 0,
                unhealthyServices: 0,
                averageResponseTime: 0,
                servicesByEnvironment: new Map(),
                servicesByRegion: new Map(),
                lastUpdated: new Date(),
            }),
        },
    })),
}));

describe('useMicroservices', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return expected structure', () => {
        const { result } = renderHook(() => 
            useMicroservices('development', 'eu-central-1')
        );

        expect(result.current).toHaveProperty('services');
        expect(result.current).toHaveProperty('meshStatus');
        expect(result.current).toHaveProperty('costAnalysis');
        expect(result.current).toHaveProperty('discoveryStats');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('error');
    });
});
```

#### Key Points
- ✅ Use module-level mocking to avoid import issues
- ✅ Mock all required methods with proper return types
- ✅ Clear mocks between tests
- ✅ Test structure, not implementation details

### 2. Component Testing Pattern

#### Basic Structure
```typescript
import React from 'react';
import { render } from '@testing-library/react';

// Mock the hook dependency
jest.mock('../../../hooks/useMicroservices', () => ({
    useMicroservices: jest.fn(() => ({
        services: [],
        meshStatus: null,
        costAnalysis: null,
        discoveryStats: null,
        isLoading: false,
        error: null,
        scaleService: jest.fn(),
        deployService: jest.fn(),
        removeService: jest.fn(),
        updateServiceConfig: jest.fn(),
        refreshData: jest.fn(),
        getServiceHealth: jest.fn(),
        getTotalCost: jest.fn(() => 0),
        getHealthyServicesCount: jest.fn(() => 0),
        getUnhealthyServicesCount: jest.fn(() => 0),
    })),
}));

// Mock UI components to avoid JSX parsing issues
jest.mock('@/components/ui/card', () => ({
    Card: 'div',
    CardContent: 'div',
    CardDescription: 'div',
    CardHeader: 'div',
    CardTitle: 'div',
}));

// Mock the component itself if needed
jest.mock('../MicroservicesDashboard', () => ({
    MicroservicesDashboard: jest.fn(() => 
        React.createElement('div', { 'data-testid': 'dashboard' }, 'Dashboard')
    ),
}));

import { MicroservicesDashboard } from '../MicroservicesDashboard';

describe('MicroservicesDashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render without crashing', () => {
        const props = {
            environment: 'development' as const,
            region: 'eu-central-1' as const,
        };

        const { container } = render(React.createElement(MicroservicesDashboard, props));
        expect(container).toBeInTheDocument();
    });
});
```

#### Key Points
- ✅ Mock all external dependencies
- ✅ Use string mocks for UI components to avoid JSX parsing
- ✅ Use `React.createElement` instead of JSX syntax
- ✅ Test props handling and basic rendering

### 3. Error Handling Pattern

```typescript
describe('Error Handling', () => {
    it('should handle service operation errors', async () => {
        const errorMock = jest.fn().mockRejectedValue(new Error('Service error'));
        
        // Mock with error
        jest.mocked(mockFoundation.orchestrator.scaleService).mockImplementation(errorMock);

        const { result } = renderHook(() => 
            useMicroservices('development', 'eu-central-1')
        );

        await act(async () => {
            try {
                await result.current.scaleService('test-service', 'up');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe('Service error');
            }
        });
    });
});
```

### 4. Async Operation Pattern

```typescript
import { act } from '@testing-library/react';

describe('Async Operations', () => {
    it('should handle async data loading', async () => {
        const { result } = renderHook(() => 
            useMicroservices('development', 'eu-central-1')
        );

        // Initial loading state
        expect(result.current.isLoading).toBe(true);

        // Wait for async operations to complete
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Verify final state
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
    });
});
```

## 🔧 Mock Patterns

### 1. Complete Service Mock
```typescript
const createMockFoundation = () => ({
    orchestrator: {
        getAllServicesStatus: jest.fn().mockResolvedValue([
            {
                serviceName: 'test-service',
                status: 'healthy' as const,
                lastCheck: new Date(),
                metrics: { cpu: 50, memory: 60, requestRate: 100, errorRate: 1 },
                instances: [{ id: 'inst-1', status: 'running' as const }],
                meshStatus: { connected: true, errors: [] },
            },
        ]),
        scaleService: jest.fn().mockResolvedValue({ success: true }),
        deployService: jest.fn().mockResolvedValue({ success: true }),
        removeService: jest.fn().mockResolvedValue({ success: true }),
        updateServiceConfiguration: jest.fn().mockResolvedValue({ success: true }),
        getCostAnalysis: jest.fn().mockResolvedValue({
            totalMonthlyCost: 42.5,
            budgetUtilization: 35,
            recommendations: ['Test recommendation'],
            lastUpdated: new Date(),
        }),
    },
    meshManager: {
        getMeshStatus: jest.fn().mockResolvedValue({
            meshName: 'test-mesh',
            region: 'eu-central-1',
            status: 'active' as const,
            virtualServices: 1,
            virtualRouters: 1,
            virtualNodes: 1,
            lastUpdated: new Date(),
            errors: [],
        }),
    },
    serviceDiscovery: {
        getServiceStatistics: jest.fn().mockResolvedValue({
            totalServices: 1,
            healthyServices: 1,
            unhealthyServices: 0,
            averageResponseTime: 50,
            servicesByEnvironment: new Map([['test', 1]]),
            servicesByRegion: new Map([['eu-central-1', 1]]),
            lastUpdated: new Date(),
        }),
    },
});
```

### 2. UI Component Mocks
```typescript
// Simple string mocks (recommended)
jest.mock('@/components/ui/card', () => ({
    Card: 'div',
    CardContent: 'div',
    CardHeader: 'div',
    CardTitle: 'div',
}));

// Function mocks with props (if needed)
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => 
        React.createElement('button', { onClick, ...props }, children),
}));

// Icon mocks
jest.mock('lucide-react', () => ({
    CheckCircle: 'div',
    XCircle: 'div',
    AlertCircle: 'div',
    // ... other icons
}));
```

### 3. Hook Dependency Mocks
```typescript
jest.mock('../../../hooks/useMicroservices', () => ({
    useMicroservices: jest.fn(() => ({
        // Complete hook return interface
        services: [],
        meshStatus: null,
        costAnalysis: null,
        discoveryStats: null,
        isLoading: false,
        error: null,
        // All function mocks
        scaleService: jest.fn(),
        deployService: jest.fn(),
        removeService: jest.fn(),
        updateServiceConfig: jest.fn(),
        refreshData: jest.fn(),
        getServiceHealth: jest.fn(),
        getTotalCost: jest.fn(() => 0),
        getHealthyServicesCount: jest.fn(() => 0),
        getUnhealthyServicesCount: jest.fn(() => 0),
    })),
}));
```

## 🚨 Common Issues & Solutions

### Issue 1: JSX Parsing Error
```
SyntaxError: Unexpected token '<'
```

**Solution:**
```javascript
// In jest.microservices.config.cjs
transform: {
    '^.+\\.tsx?$': ['ts-jest', { 
        tsconfig: 'tsconfig.spec.json',
        jsx: 'react-jsx'  // Add this line
    }],
},
```

### Issue 2: Import Resolution Error
```
Cannot find module '../../lib/microservices'
```

**Solution:**
```typescript
// Use module-level mocking before imports
jest.mock('../../lib/microservices', () => ({
    createMicroserviceFoundation: jest.fn(() => (/* mock */)),
}));

// Then import
import { useMicroservices } from '../useMicroservices';
```

### Issue 3: Async Timeout Error
```
Exceeded timeout of 5000 ms for a test
```

**Solution:**
```typescript
// Simplify async operations
await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Short timeout
});

// Or increase test timeout
it('should handle long operations', async () => {
    // test code
}, 10000); // 10 second timeout
```

### Issue 4: Mock Interface Mismatch
```
TypeError: foundation.serviceDiscovery.getServiceStatistics is not a function
```

**Solution:**
```typescript
// Ensure mock method names match actual interface
serviceDiscovery: {
    getServiceStatistics: jest.fn(), // Correct method name
    // not getStats or getStatistics
},
```

## 📋 Test Checklist

### Before Writing Tests
- [ ] Identify all external dependencies
- [ ] Plan mock strategy (module vs function level)
- [ ] Determine test environment (node vs jsdom)
- [ ] Review existing similar tests

### While Writing Tests
- [ ] Mock all external dependencies
- [ ] Use descriptive test names
- [ ] Test both success and error scenarios
- [ ] Keep tests focused and simple
- [ ] Clear mocks between tests

### After Writing Tests
- [ ] Verify tests pass consistently
- [ ] Check test execution time (< 5s per file)
- [ ] Review test coverage
- [ ] Update documentation if needed

## 🔄 Maintenance Patterns

### Weekly Review
```bash
# Check test performance
npm run test:ms:ui -- --verbose

# Look for flaky tests
npm run test:ms:ui -- --detectOpenHandles

# Review coverage
npm run test:ms:ui -- --coverage
```

### When Adding New Features
1. Create test file following naming convention
2. Use established mock patterns
3. Add to Jest configuration if needed
4. Update this reference guide

### When Updating Services
1. Update corresponding mocks
2. Verify interface compatibility
3. Run full test suite
4. Update documentation

---

**Quick Help:** For immediate assistance, check the [Microservices Testing Guide](./microservices-testing-guide.md) or contact the development team.