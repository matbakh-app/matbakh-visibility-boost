# Jest Test Infrastructure Fix - Requirements Document

## Introduction

The current Jest test infrastructure has multiple critical issues preventing tests from running successfully. We need to systematically fix all test environment problems to ensure reliable test execution across the entire codebase.

## Requirements

### Requirement 1: Fix Import/Module Resolution Issues

**User Story:** As a developer, I want all test files to properly import dependencies so that tests can run without module resolution errors.

#### Acceptance Criteria

1. WHEN tests import from 'vitest' THEN they SHALL be converted to use Jest imports
2. WHEN tests use import.meta.env THEN they SHALL access mocked environment variables
3. WHEN tests import AWS SDK modules THEN they SHALL use properly mocked versions
4. WHEN tests import Redis modules THEN they SHALL use properly mocked versions
5. WHEN ESM modules are imported THEN Jest SHALL properly transform them

### Requirement 2: Fix Mock Configuration Issues

**User Story:** As a developer, I want all mocks to be properly configured so that tests can run without mock-related errors.

#### Acceptance Criteria

1. WHEN tests use AWS SDK clients THEN they SHALL use properly typed mocks
2. WHEN tests use Redis clients THEN they SHALL use properly configured mocks
3. WHEN tests access environment variables THEN they SHALL get consistent mock values
4. WHEN tests use crypto functions THEN they SHALL use properly typed mocks
5. WHEN tests create mock objects THEN they SHALL have proper type safety

### Requirement 3: Fix Test Environment Configuration

**User Story:** As a developer, I want the Jest environment to be properly configured so that all tests run in a consistent environment.

#### Acceptance Criteria

1. WHEN Jest runs tests THEN it SHALL use the correct test environment (jsdom for React, node for Lambda)
2. WHEN Jest transforms modules THEN it SHALL properly handle TypeScript and ESM modules
3. WHEN Jest loads setup files THEN they SHALL execute without errors
4. WHEN Jest runs tests THEN it SHALL use proper timeout and worker configurations
5. WHEN Jest collects coverage THEN it SHALL include appropriate files and exclude test files

### Requirement 4: Migrate Vitest Tests to Jest

**User Story:** As a developer, I want all Vitest-based tests to be converted to Jest so that we have a unified testing framework.

#### Acceptance Criteria

1. WHEN tests import testing utilities THEN they SHALL use Jest imports instead of Vitest
2. WHEN tests use vi.fn() THEN they SHALL use jest.fn() instead
3. WHEN tests use Vitest-specific APIs THEN they SHALL use Jest equivalents
4. WHEN tests run THEN they SHALL execute successfully under Jest
5. WHEN test assertions are made THEN they SHALL use Jest-compatible matchers

### Requirement 5: Fix Lambda Test Infrastructure

**User Story:** As a developer, I want Lambda function tests to run properly so that I can verify AWS Lambda functionality.

#### Acceptance Criteria

1. WHEN Lambda tests run THEN they SHALL use proper AWS SDK mocks
2. WHEN Lambda tests access environment variables THEN they SHALL get appropriate test values
3. WHEN Lambda tests use DynamoDB THEN they SHALL use properly mocked clients
4. WHEN Lambda tests use Redis THEN they SHALL use properly mocked clients
5. WHEN Lambda tests execute THEN they SHALL complete without runtime errors

### Requirement 6: Fix Frontend Test Infrastructure

**User Story:** As a developer, I want React component tests to run properly so that I can verify UI functionality.

#### Acceptance Criteria

1. WHEN React tests run THEN they SHALL use jsdom environment
2. WHEN React tests use hooks THEN they SHALL be properly wrapped with testing utilities
3. WHEN React tests access environment variables THEN they SHALL get mocked values
4. WHEN React tests use external APIs THEN they SHALL use mocked implementations
5. WHEN React tests render components THEN they SHALL complete without errors

### Requirement 7: Ensure Test Isolation and Reliability

**User Story:** As a developer, I want tests to be isolated and reliable so that test results are consistent and trustworthy.

#### Acceptance Criteria

1. WHEN tests run THEN they SHALL not interfere with each other
2. WHEN mocks are used THEN they SHALL be properly reset between tests
3. WHEN tests access global state THEN it SHALL be properly cleaned up
4. WHEN tests run in parallel THEN they SHALL not cause race conditions
5. WHEN tests complete THEN they SHALL leave the environment in a clean state

### Requirement 8: Provide Comprehensive Error Handling

**User Story:** As a developer, I want clear error messages when tests fail so that I can quickly identify and fix issues.

#### Acceptance Criteria

1. WHEN tests fail due to mock issues THEN they SHALL provide clear error messages
2. WHEN tests fail due to import issues THEN they SHALL indicate the problematic module
3. WHEN tests fail due to environment issues THEN they SHALL suggest configuration fixes
4. WHEN tests timeout THEN they SHALL provide context about the hanging operation
5. WHEN tests have type errors THEN they SHALL provide specific type information

## Implementation Tasks (From GAP Analysis)

### Phase 1: AWS SDK & Mocks Stabilization

1. **Install AWS SDK packages:**
   ```bash
   npm install @aws-sdk/lib-dynamodb @aws-sdk/client-dynamodb
   ```

2. **Fix Mock in setupTests.ts:**
   - Verify `jest.mock('@aws-sdk/lib-dynamodb', ...)` provides correct send-Mock
   - Add global mock cleanup: `afterEach(() => { jest.clearAllMocks(); })`

### Phase 2: Vitest → Jest Migration

1. **Search and replace in all test files:**
   - `import { describe, it, expect, vi } from 'vitest'` → `import { describe, it, expect, jest, beforeEach } from '@jest/globals'`
   - `vi.fn()` → `jest.fn()`
   - `vi.spyOn()` → `jest.spyOn()`
   - `vi.mock()` → `jest.mock()`

### Phase 3: Test Environments for Lambda/Node

1. **Set Node environment for Lambda tests:**
   ```javascript
   /**
    * @jest-environment node
    */
   ```
   - React tests remain jsdom

### Phase 4: ESM & import.meta.env Handling

1. **Extend transformIgnorePatterns in jest.config.cjs:**
   ```javascript
   transformIgnorePatterns: [
     '/node_modules/(?!(@sparticuz|cheerio|jose)/)/'
   ]
   ```

2. **Keep import.meta.env polyfill in setupTests.ts** (already present)

### Phase 5: Test Isolation & Global States

1. **Encapsulate global helpers in setupTests.ts:**
   - `createMockMemoryContext`
   - `createMockFile`
   - Reset all with beforeEach/afterEach

2. **Keep console.warn suppression** but document it

### Phase 6: Frontend Test Utilities

1. **Ensure packages are installed:**
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
   ```

2. **Rewrite React Hooks tests** with renderHook + act (if outdated)

### Phase 7: Coverage & CI

1. **Activate collectCoverageFrom** in jest.config.cjs (already present)

2. **Adjust CI pipeline:**
   ```bash
   npx jest --coverage --maxWorkers=2
   ```

3. **Fail fast on missing mocks**

## Definition of Done

- ✅ No "Cannot find module ..." errors
- ✅ No Vitest imports in repository
- ✅ AWS SDK DynamoDB tests pass
- ✅ All mocks reset between tests
- ✅ Frontend tests run in jsdom environment
- ✅ Lambda tests run in node environment
- ✅ Total runtime < 2 minutes in CI

## Success Metrics

- All test suites pass without errors
- Test execution time is under 2 minutes for the full suite
- No mock-related runtime errors
- No import/module resolution errors
- 100% of tests use Jest (no Vitest dependencies)
- Test coverage collection works properly
- Tests can run in both local and CI environments