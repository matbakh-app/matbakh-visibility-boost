# Jest Test Infrastructure Fix - Implementation Plan

## Task Overview

This implementation plan provides a systematic approach to fix the Jest test infrastructure issues across the matbakh.app codebase. Each task builds incrementally on previous tasks to ensure stable progress.

## Implementation Tasks

- [x] 1. Install Required Dependencies and Fix Package Configuration
  - Install AWS SDK packages for proper mock support
  - Update package.json with correct testing dependencies
  - Verify all required testing libraries are present
  - _Requirements: Phase 1 - AWS SDK & Mocks Stabilization_

- [x] 2. Fix Global Mock Configuration in setupTests.ts
  - Update AWS SDK mocks to use installed packages
  - Implement global mock cleanup with afterEach
  - Fix TypeScript issues in mock definitions
  - Add proper error handling for mock initialization
  - _Requirements: Phase 1 - AWS SDK & Mocks Stabilization_

- [x] 3. Migrate All Vitest Imports to Jest
  - Search and replace Vitest imports across all test files
  - Convert vi.fn() calls to jest.fn()
  - Update Vitest-specific APIs to Jest equivalents
  - Fix any import-related TypeScript errors
  - _Requirements: Phase 2 - Vitest → Jest Migration_

- [x] 4. Configure Test Environments for Different Test Types
  - Add @jest-environment node annotations to Lambda tests
  - Verify React tests use jsdom environment
  - Update jest.config.cjs for dual environment support
  - Test environment-specific functionality
  - _Requirements: Phase 3 - Test Environments for Lambda/Node_

- [x] 5. Fix ESM Module Transformation and Import Issues
  - Update transformIgnorePatterns in jest.config.cjs
  - Ensure import.meta.env polyfill works correctly
  - Fix any remaining module resolution errors
  - Validate ESM module imports work in tests
  - _Requirements: Phase 4 - ESM & import.meta.env Handling_

- [ ] 6. Implement Test Isolation and Global State Management
  - Encapsulate global helper functions properly
  - Add proper mock reset between tests
  - Clean up global state after each test
  - Document console.warn suppression
  - _Requirements: Phase 5 - Test Isolation & Global States_

- [ ] 7. Update Frontend Test Utilities and React Test Setup
  - Verify @testing-library packages are properly installed
  - Update React Hooks tests to use renderHook + act
  - Fix any React component test issues
  - Ensure proper jsdom environment setup
  - _Requirements: Phase 6 - Frontend Test Utilities_

- [ ] 8. Configure Coverage Collection and CI Integration
  - Activate and validate coverage collection
  - Update CI pipeline for Jest execution
  - Set up fail-fast on missing mocks
  - Optimize test execution performance
  - _Requirements: Phase 7 - Coverage & CI_

- [ ] 9. Validate All Test Suites Execute Successfully
  - Run complete test suite and fix any remaining issues
  - Verify no "Cannot find module" errors
  - Ensure all mocks work correctly
  - Validate test execution time is under 2 minutes
  - _Requirements: Definition of Done validation_

- [ ] 10. Create Documentation and Maintenance Guidelines
  - Document the new test infrastructure setup
  - Create guidelines for adding new tests
  - Document mock usage patterns
  - Create troubleshooting guide for common issues
  - _Requirements: Long-term maintenance and developer experience_