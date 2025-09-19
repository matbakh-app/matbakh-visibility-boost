
# Comprehensive System Testing Report
Generated: 2025-09-18T13:18:34.755Z
Duration: 31.45s

## Summary
- **Total Tests**: 13
- **Passed**: 9 ✅
- **Failed**: 4 ❌
- **Skipped**: 0 ⏭️
- **Success Rate**: 69.2%

## Test Suites


### Full Test Suite
- Duration: 11.57s
- Tests: 3 (1 passed, 2 failed, 0 skipped)


#### Jest Test Suite ❌
- Status: FAIL
- Duration: 8.19s

- Errors: Command failed: npm test -- --passWithNoTests --testPathIgnorePatterns="archive" --verbose
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
FAIL test/unit/sync-gmb.test.ts
  ● Test suite failed to run

    Cannot find module 'https://deno.land/std@0.178.0/testing/asserts.ts' from 'test/unit/sync-gmb.test.ts'

      1 |
    > 2 | import { assertEquals, assertExists } from 'https://deno.land/std@0.178.0/testing/asserts.ts';
        | ^
      3 |
      4 | // Simple response validation test
      5 | Deno.test('sync-gmb response structure', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/sync-gmb.test.ts:2:1)

FAIL test/unit/sync-ga4.test.ts
  ● Test suite failed to run

    Cannot find module 'https://deno.land/std@0.178.0/testing/asserts.ts' from 'test/unit/sync-ga4.test.ts'

      1 |
    > 2 | import { assertEquals, assertExists } from 'https://deno.land/std@0.178.0/testing/asserts.ts';
        | ^
      3 |
      4 | // Simple response validation test
      5 | Deno.test('sync-ga4 response structure', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/sync-ga4.test.ts:2:1)

FAIL test/smoke/routes.spec.ts
  ● Test suite failed to run

    Cannot find module '@playwright/test' from 'test/smoke/routes.spec.ts'

      1 |
    > 2 | import { test, expect } from '@playwright/test';
        | ^
      3 |
      4 | const routes = [
      5 |   '/',

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/smoke/routes.spec.ts:2:1)

FAIL src/components/analytics/__tests__/EventAnnotations.test.tsx
  EventAnnotations Component
    getScoreAtDate
      ✕ should return exact score for matching date (46 ms)
      ✕ should return closest score for non-matching date (2 ms)
      ✓ should return default score for empty data (4 ms)
      ✕ should handle single data point (2 ms)
    filterEvents
      ✓ should return all events when no filters applied (1 ms)
      ✕ should filter events by date range (1 ms)
      ✓ should filter events by visible types (1 ms)
      ✕ should apply both date range and type filters (1 ms)
      ✓ should return empty array when no events match filters (1 ms)
      ✓ should handle empty visible types array (1 ms)
    Event Positioning Logic
      ✕ should calculate correct positions for events within data range (1 ms)
      ✕ should handle events outside data range gracefully (1 ms)
    Event Type Validation
      ✓ should validate all event types are supported (1 ms)
      ✓ should handle events with different impact types
    Performance Considerations
      ✕ should handle large number of events efficiently (1 ms)
      ✕ should handle large score dataset efficiently (16 ms)
    Edge Cases
      ✓ should handle events with missing optional fields (1 ms)
      ✓ should handle invalid date formats gracefully
      ✓ should handle empty arrays (1 ms)

  ● EventAnnotations Component › getScoreAtDate › should return exact score for matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: undefined

      57 |     it('should return exact score for matching date', () => {
      58 |       const score = getScoreAtDate(mockScoreData, '2025-01-01');
    > 59 |       expect(score).toBe(65.5);
         |                     ^
      60 |     });
      61 |
      62 |     it('should return closest score for non-matching date', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:59:21)

  ● EventAnnotations Component › getScoreAtDate › should return closest score for non-matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      62 |     it('should return closest score for non-matching date', () => {
      63 |       const score = getScoreAtDate(mockScoreData, '2025-01-04');
    > 64 |       expect(score).toBe(68.8); // Closest to 2025-01-03
         |                     ^
      65 |     });
      66 |
      67 |     it('should return default score for empty data', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:64:21)

  ● EventAnnotations Component › getScoreAtDate › should handle single data point

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: 50

      73 |       const singlePoint = [mockScoreData[0]];
      74 |       const score = getScoreAtDate(singlePoint, '2025-01-10');
    > 75 |       expect(score).toBe(65.5);
         |                     ^
      76 |     });
      77 |   });
      78 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:75:21)

  ● EventAnnotations Component › filterEvents › should filter events by date range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      91 |       
      92 |       const filtered = filterEvents(mockEvents, dateRange);
    > 93 |       expect(filtered).toHaveLength(2);
         |                        ^
      94 |       expect(filtered[0].id).toBe('event-1');
      95 |       expect(filtered[1].id).toBe('event-2');
      96 |     });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:93:24)

  ● EventAnnotations Component › filterEvents › should apply both date range and type filters

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

      113 |       
      114 |       const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
    > 115 |       expect(filtered).toHaveLength(1);
          |                        ^
      116 |       expect(filtered[0].id).toBe('event-1');
      117 |     });
      118 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:115:24)

  ● EventAnnotations Component › Event Positioning Logic › should calculate correct positions for events within data range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      140 |       });
      141 |       
    > 142 |       expect(eventsInRange).toHaveLength(2);
          |                             ^
      143 |       
      144 |       // Test score positioning
      145 |       const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:142:29)

  ● EventAnnotations Component › Event Positioning Logic › should handle events outside data range gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      155 |       
      156 |       // Should return closest available score (2025-01-03)
    > 157 |       expect(score).toBe(68.8);
          |                     ^
      158 |     });
      159 |   });
      160 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:157:21)

  ● EventAnnotations Component › Performance Considerations › should handle large number of events efficiently

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      204 |       const endTime = performance.now();
      205 |       
    > 206 |       expect(filtered.length).toBeGreaterThan(0);
          |                               ^
      207 |       expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      208 |     });
      209 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:206:31)

  ● EventAnnotations Component › Performance Considerations › should handle large score dataset efficiently

    expect(received).toBe(expected) // Object.is equality

    Expected: "number"
    Received: "undefined"

      220 |       const endTime = performance.now();
      221 |       
    > 222 |       expect(typeof score).toBe('number');
          |                            ^
      223 |       expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
      224 |     });
      225 |   });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:222:28)

FAIL src/services/__tests__/vc.test.ts
  VC Service - Core Business Logic
    startVisibilityCheck
      ✕ should construct correct API request with all parameters (35 ms)
      ✕ should handle successful visibility check initiation (1 ms)
      ✕ should handle API errors gracefully (59 ms)
      ✓ should handle network errors (8 ms)
      ✓ should validate required parameters (1 ms)
      ✕ should handle different locales correctly
    getVCEnvironmentInfo
      ✓ should return environment info in development mode (1 ms)
      ✕ should return null in production mode (2 ms)
      ✕ should include correct environment variables (5 ms)
    Error Handling & Edge Cases
      ✕ should handle malformed API responses (3 ms)
      ✕ should handle rate limiting (2 ms)
      ✕ should handle server errors (1 ms)

  ● VC Service - Core Business Logic › startVisibilityCheck › should construct correct API request with all parameters

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle successful visibility check initiation

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle API errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid email format"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:69:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:59:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle different locales correctly

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should return null in production mode

    expect(received).toBeNull()

    Received: {"apiBase": "https://test-api.matbakh.app", "mode": "test", "provider": "aws"}

      124 |       const result = getVCEnvironmentInfo();
      125 |       
    > 126 |       expect(result).toBeNull();
          |                      ^
      127 |       
      128 |       // Restore
      129 |       if (originalEnv !== undefined) {

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:126:22)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should include correct environment variables

    expect(received).toBe(expected) // Object.is equality

    Expected: "development"
    Received: "test"

      140 |       if (result) {
      141 |         expect(result.apiBase).toBeDefined();
    > 142 |         expect(result.mode).toBe('development');
          |                             ^
      143 |       }
      144 |       
      145 |       // Restore

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:142:29)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle malformed API responses

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid JSON"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:162:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:153:60)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle rate limiting

    expect(received).rejects.toThrow(expected)

    Expected substring: "Rate limit exceeded"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:175:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:165:50)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle server errors

    expect(received).rejects.toThrow(expected)

    Expected substring: "Internal server error"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:188:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:178:50)

PASS src/lib/architecture-scanner/__tests__/enhanced-risk-assessor.test.ts
  EnhancedRiskAssessor
    assessRisk
      ✓ should classify critical system components as critical risk (12 ms)
      ✓ should classify components with migration paths as lower risk (1 ms)
      ✓ should classify components with Kiro alternatives as lower risk (5 ms)
      ✓ should classify debug/test components as safe (2 ms)
      ✓ should classify recently modified components as higher risk (1 ms)
      ✓ should classify old components as safer to archive (1 ms)
      ✓ should classify high complexity components with higher risk (1 ms)
      ✓ should never classify Kiro components as safe to archive (1 ms)
      ✓ should provide mitigation suggestions based on risk factors (1 ms)
    batchAssessRisk
      ✓ should assess multiple components in batch (12 ms)
    generateRiskReport
      ✓ should generate comprehensive risk report (3 ms)
      ✓ should count risk factors correctly (2 ms)
    risk factor assessment
      ✓ should detect development routes as low risk (13 ms)
      ✓ should handle file stat errors gracefully (1 ms)
      ✓ should provide confidence scores (1 ms)
    edge cases
      ✓ should handle components with no risk factors (1 ms)
      ✓ should handle components with mixed risk factors (1 ms)

PASS src/components/analytics/__tests__/TrendFilters.test.tsx
  TrendFilters Component
    Props Validation
      ✓ should validate TrendFilters interface structure (20 ms)
      ✓ should handle optional businessUnit property (1 ms)
      ✓ should validate BusinessUnit interface (2 ms)
    Score Type Handling
      ✓ should validate all score types (10 ms)
      ✓ should handle score type changes (2 ms)
    Date Range Handling
      ✓ should validate date range presets (1 ms)
      ✓ should generate correct date ranges for presets (1 ms)
      ✓ should handle custom date range changes (1 ms)
      ✓ should validate date range logic
    Business Unit Handling
      ✓ should validate mock business units structure (6 ms)
      ✓ should handle business unit selection
      ✓ should handle "all units" selection (1 ms)
    Filter State Management
      ✓ should maintain filter state consistency (1 ms)
      ✓ should handle partial filter updates (1 ms)
    Date Formatting
      ✓ should format dates correctly for input fields
      ✓ should format dates correctly for German locale display (180 ms)
    Integration Scenarios
      ✓ should handle complete filter workflow (6 ms)

FAIL src/services/__tests__/ProfileService.test.ts
  ProfileService
    Business Profile Management
      ✕ should create a new business profile (9 ms)
      ✕ should retrieve business profile by ID
      ✕ should update existing business profile
      ✕ should delete business profile (15 ms)
      ✕ should handle profile not found
      ✕ should validate required fields on creation
      ✕ should validate email format
    Profile Search and Filtering
      ✕ should search profiles by business name (1 ms)
      ✕ should filter profiles by category (1 ms)
      ✕ should filter profiles by location (1 ms)
    Profile Analytics
      ✕ should get profile completion percentage (1 ms)
      ✕ should identify missing profile fields
      ✕ should suggest profile improvements
    Error Handling
      ✕ should handle database connection errors
      ✕ should handle SQL syntax errors (1 ms)
      ✕ should handle duplicate email errors (1 ms)
    Integration Tests
      ✕ should complete full profile lifecycle

  ● ProfileService › Business Profile Management › should create a new business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should retrieve business profile by ID

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should update existing business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should delete business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should handle profile not found

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate required fields on creation

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate email format

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should search profiles by business name

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by category

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by location

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should get profile completion percentage

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should identify missing profile fields

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should suggest profile improvements

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle database connection errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle SQL syntax errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle duplicate email errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Integration Tests › should complete full profile lifecycle

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

PASS src/data/recommendations/__tests__/recommendations.test.ts
  Goal-Specific Recommendations
    getRecommendationsByGoal
      ✓ should return recommendations for a valid goal (11 ms)
      ✓ should return empty array for invalid goal (1 ms)
    getGoalProfile
      ✓ should return complete goal profile with recommendations (4 ms)
    getAllGoalProfiles
      ✓ should return all goal profiles (15 ms)
    getRecommendationsSorted
      ✓ should sort recommendations by impact score (1 ms)
      ✓ should sort recommendations by effort score (1 ms)
      ✓ should sort recommendations by combined score (1 ms)
    getQuickWins
      ✓ should return only high impact, low effort recommendations (1 ms)
    getStrategicInitiatives
      ✓ should return only high impact, high effort recommendations
    calculateGoalMetrics
      ✓ should calculate correct metrics for a goal (6 ms)
    Recommendation Data Quality
      ✓ should have valid data for all goals (99 ms)

PASS src/services/__tests__/forecasting-engine.test.ts
  ForecastingEngine
    generateForecast
      ✓ should generate forecast with valid data (11 ms)
      ✓ should throw error with insufficient data (64 ms)
      ✓ should generate different forecasts for different ranges (8 ms)
      ✓ should detect upward trend correctly (1 ms)
      ✓ should detect downward trend correctly (2 ms)
      ✓ should detect stable trend correctly (1 ms)
      ✓ should generate forecast points with confidence intervals (24 ms)
      ✓ should have increasing uncertainty over time (1 ms)
    detectTrendChanges
      ✓ should detect trend changes in data (5 ms)
      ✓ should return empty array for insufficient data (3 ms)
      ✓ should detect acceleration and deceleration (3 ms)
    getForecastSummary
      ✓ should generate comprehensive forecast summary (1 ms)
      ✓ should provide appropriate trend descriptions (2 ms)
      ✓ should provide confidence descriptions (1 ms)
      ✓ should generate insights based on forecast data (1 ms)
      ✓ should generate appropriate recommendations (1 ms)
    Edge Cases
      ✓ should handle data with missing values gracefully (6 ms)
      ✓ should handle extreme values correctly (3 ms)
      ✓ should handle identical values (1 ms)
      ✓ should handle very large datasets efficiently (14 ms)
    Statistical Accuracy
      ✓ should have reasonable R-squared for linear data (1 ms)
      ✓ should have lower R-squared for noisy data (1 ms)
      ✓ should have confidence that correlates with data quality (1 ms)

PASS src/components/analytics/__tests__/TrendChart.test.tsx
  TrendChart Component
    ✓ should validate props structure (11 ms)
    ✓ should handle different score types (4 ms)
    ✓ should validate mock data structure (9 ms)
    ✓ should validate event data structure (2 ms)
  TrendChart Data Validation
    ✓ should validate score values are within range (10 ms)
    ✓ should validate date format (16 ms)
    ✓ should validate business_id format (22 ms)

PASS src/lib/recommendation/__tests__/recommendationTrigger.test.ts
  RecommendationTrigger
    evaluateScoreTrend
      ✓ should not trigger for insufficient data (35 ms)
      ✓ should not trigger for stable scores (5 ms)
      ✓ should trigger drop for significant score decrease (3 ms)
      ✓ should trigger stagnation for unchanging scores (3 ms)
      ✓ should not trigger for improving scores (16 ms)
      ✓ should handle volatile scores appropriately (2 ms)
      ✓ should respect custom thresholds (2 ms)
      ✓ should provide appropriate metadata (2 ms)
      ✓ should not trigger for slight improvements (2 ms)
      ✓ should trigger drop for exactly threshold change (5 ms)
    evaluateScoreTrendWithContext
      ✓ should use contextual thresholds for different score types (2 ms)
      ✓ should adjust actions based on score type (2 ms)
      ✓ should handle industry-specific contexts (2 ms)
    Edge Cases and Error Handling
      ✓ should handle empty score arrays gracefully (2 ms)
      ✓ should handle invalid threshold configurations (146 ms)

PASS src/lib/forecast/__tests__/forecastEngine.test.ts
  ForecastEngine
    generateForecast
      ✓ should return flat trend for constant scores (18 ms)
      ✓ should return up trend for linearly increasing scores (32 ms)
      ✓ should return down trend for linearly decreasing scores (3 ms)
      ✓ should return empty array for insufficient data (131 ms)
      ✓ should handle high variance with wider confidence intervals (2 ms)
      ✓ should handle badly formatted data gracefully (15 ms)
      ✓ should generate correct number of forecast points for different ranges (3 ms)
      ✓ should have valid forecast point structure (18 ms)
      ✓ should have increasing uncertainty over time (1 ms)
    analyzeTrend
      ✓ should correctly identify flat trend (1 ms)
      ✓ should correctly identify upward trend (1 ms)
      ✓ should correctly identify downward trend (2 ms)
      ✓ should handle empty data (4 ms)
    assessDataQuality
      ✓ should assess good quality for clean data (4 ms)
      ✓ should identify issues with insufficient data (1 ms)
      ✓ should identify high volatility (1 ms)
    generateComprehensiveForecast
      ✓ should generate complete forecast result (4 ms)
    Edge Cases
      ✓ should handle single data point (20 ms)
      ✓ should handle identical dates (7 ms)
      ✓ should handle extreme values (16 ms)
      ✓ should handle unsorted data (1 ms)
    Performance
      ✓ should handle large datasets efficiently (14 ms)

FAIL src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts
  LegacyComponentDetector
    scanLegacyComponents
      ✓ should identify legacy components correctly (177 ms)
      ✓ should create proper backup plan (16 ms)
    Backend Dependency Analysis
      ✓ should detect Supabase backend dependencies (7 ms)
      ✓ should detect Lovable backend dependencies (9 ms)
      ✓ should provide migration paths for dependencies (6 ms)
    Route Usage Analysis
      ✓ should detect route usage in page components (21 ms)
      ✓ should identify Kiro alternatives for legacy routes (9 ms)
    Safe-to-Archive Classification
      ✕ should mark components as safe when they have Kiro alternatives (9 ms)
      ✕ should mark critical components as unsafe to archive (5 ms)
      ✕ should mark components with active backend dependencies as unsafe (6 ms)
      ✕ should mark unknown components without dependencies as safe (7 ms)
    Archive Manifest Generation
      ✓ should generate comprehensive archive manifest (34 ms)
    Error Handling
      ✓ should handle file read errors gracefully (14 ms)
      ✓ should handle malformed file content (4 ms)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components as safe when they have Kiro alternatives

    expect(received).toContain(expected) // indexOf

    Expected substring: "Kiro alternative available"
    Received string:    "Legacy component with clear migration path"

      281 |       const component = plan.components[0];
      282 |       expect(component.safeToArchive).toBe(true);
    > 283 |       expect(component.archiveReason).toContain('Kiro alternative available');
          |                                       ^
      284 |       expect(component.riskLevel).toBe('low');
      285 |     });
      286 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:283:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark critical components as unsafe to archive

    expect(received).toContain(expected) // indexOf

    Expected substring: "Critical system component"
    Received string:    "Medium-risk component - review recommended"

      299 |       const component = plan.components[0];
      300 |       expect(component.safeToArchive).toBe(false);
    > 301 |       expect(component.archiveReason).toContain('Critical system component');
          |                                       ^
      302 |       expect(component.riskLevel).toBe('critical');
      303 |     });
      304 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:301:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components with active backend dependencies as unsafe

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      324 |
      325 |       const component = plan.components[0];
    > 326 |       expect(component.safeToArchive).toBe(false);
          |                                       ^
      327 |       expect(component.archiveReason).toContain('manual review');
      328 |       expect(component.riskLevel).toBe('medium');
      329 |     });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:326:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark unknown components without dependencies as safe

    expect(received).toContain(expected) // indexOf

    Expected substring: "Unknown origin component with no active dependencies"
    Received string:    "Safe component with positive archival indicators"

      350 |       const component = plan.components[0];
      351 |       expect(component.safeToArchive).toBe(true);
    > 352 |       expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
          |                                       ^
      353 |       expect(component.riskLevel).toBe('medium');
      354 |     });
      355 |   });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:352:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

PASS src/utils/__tests__/event-utils.test.ts
  Event Utils
    filterEventsByDateRange
      ✓ should filter events within date range (5 ms)
      ✓ should return empty array when no events in range (1 ms)
    filterEventsByType
      ✓ should filter events by single type (1 ms)
      ✓ should filter events by multiple types
    filterEventsByImpact
      ✓ should filter events by positive impact (15 ms)
      ✓ should filter events by multiple impacts (2 ms)
    sortEventsByDate
      ✓ should sort events by date descending (default) (2 ms)
      ✓ should sort events by date ascending (1 ms)
    groupEventsByType
      ✓ should group events by type (1 ms)
    getEventsNearDate
      ✓ should get events within 7 days of target date (10 ms)
      ✓ should get events within custom day range
    formatEventForTooltip
      ✓ should format event with all details
      ✓ should format event without description
    getEventStatistics
      ✓ should calculate event statistics (1 ms)
    isEventOnDate
      ✓ should return true for matching date (1 ms)
      ✓ should return false for non-matching date (1 ms)
    getLastEventBeforeDate
      ✓ should get the most recent event before date
      ✓ should return null when no events before date
    validateEvent
      ✓ should return no errors for valid event
      ✓ should return errors for missing required fields
      ✓ should return error for invalid date

PASS src/services/__tests__/aws-rds-client.test.ts
  AwsRdsClient
    Query Execution
      ✓ should execute SELECT query for profiles successfully (3 ms)
      ✓ should execute INSERT query for profiles successfully (2 ms)
      ✓ should execute UPDATE query for profiles successfully (1 ms)
      ✓ should handle queries with no results (1 ms)
      ✓ should handle non-profile queries (1 ms)
    Single Query Execution
      ✓ should execute queryOne and return single result (1 ms)
      ✓ should return null when no results found
    Transaction Management
      ✓ should execute transaction callback successfully (1 ms)
      ✓ should handle transaction callback errors (18 ms)
    Error Handling
      ✓ should handle localStorage errors gracefully (2 ms)
      ✓ should handle JSON parsing errors (6 ms)

PASS src/lib/__tests__/todoGenerator.test.ts
  generateTodos
    Google My Business Checks
      ✓ should create high priority todo for missing photos (3 ms)
      ✓ should create high priority todo for missing hours (1 ms)
      ✓ should create medium priority todo for incomplete profile
    Meta/Facebook Checks
      ✓ should create medium priority todo for disabled messenger
      ✓ should create medium priority todo for missing photos (1 ms)
    Instagram Checks
      ✓ should create medium priority todo for missing business account (1 ms)
      ✓ should create low priority todo for low follower count
      ✓ should not create low follower todo for sufficient followers (2 ms)
    Industry-specific Checks
      Hospitality
        ✓ should create high priority todo for missing reservation system (1 ms)
        ✓ should create high priority todo for low ratings
        ✓ should not create rating todo for good ratings (1 ms)
      Retail
        ✓ should create high priority todo for missing online shop
    Satisfaction Logic
      ✓ should return fully satisfied when no high priority todos and score >= 80 (1 ms)
      ✓ should return not satisfied when high priority todos exist (1 ms)
      ✓ should return not satisfied when score < 80
      ✓ should handle missing score gracefully (1 ms)
    Edge Cases
      ✓ should handle empty analysis object
      ✓ should handle null/undefined analysis fields (1 ms)
      ✓ should handle unknown industry gracefully (1 ms)
    Todo Structure
      ✓ should return todos with correct structure (15 ms)

FAIL src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts'

      18 | }));
      19 |
    > 20 | jest.mock('glob');
         |      ^
      21 |
      22 | const mockFs = fs as jest.Mocked<typeof fs>;
      23 | const mockGlob = glob as jest.MockedFunction<any>;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts:20:6)

FAIL src/services/__tests__/auth.test.ts
  ● Test suite failed to run

    TypeError: 'toString' called on an object that is not a valid instance of Location.

      30 | delete window.location;
      31 | // @ts-expect-error test shim
    > 32 | window.location = { 
         |                ^
      33 |   ...originalLocation, 
      34 |   href: 'http://localhost:3000', 
      35 |   hash: '', 

      at Object.toString (node_modules/jest-environment-jsdom/node_modules/jsdom/lib/jsdom/living/generated/Location.js:130:17)
          at String (<anonymous>)
          at Reflect.set (<anonymous>)
      at Object.<anonymous> (src/services/__tests__/auth.test.ts:32:16)

PASS src/services/__tests__/benchmark-comparison.test.ts
  BenchmarkComparisonService
    getIndustryBenchmarks
      ✓ should fetch benchmark data successfully (3 ms)
      ✓ should return null when benchmark not found (1 ms)
    compareToBenchmark
      ✓ should calculate comparison for score above 75th percentile (2 ms)
      ✓ should calculate comparison for score below 25th percentile (2 ms)
      ✓ should calculate comparison for average score (1 ms)
      ✓ should fallback to national benchmark when regional not available (1 ms)
    getMultiRegionBenchmarks
      ✓ should fetch benchmarks for multiple regions (1 ms)
      ✓ should handle empty results gracefully (1 ms)
    updateBenchmark
      ✓ should update benchmark data successfully (2 ms)
      ✓ should handle update errors gracefully (74 ms)
    calculateComparison (private method testing via public interface)
      ✓ should generate appropriate recommendations for each performance category (13 ms)
      ✓ should calculate improvement potential correctly (1 ms)
      ✓ should generate position descriptions correctly (1 ms)

PASS src/services/__tests__/score-history.test.ts
  ScoreHistoryService
    insertScore
      ✓ should insert a new score record (16 ms)
      ✓ should validate score_type enum values (1 ms)
      ✓ should validate source enum values (1 ms)
    insertScores (bulk)
      ✓ should insert multiple score records (1 ms)
    queryScoreHistory
      ✓ should query score history with filters (2 ms)
      ✓ should handle multiple score types in query (1 ms)
      ✓ should handle date range filters (3 ms)
    getScoreEvolution
      ✓ should calculate score evolution data (1 ms)
      ✓ should handle empty data gracefully (1 ms)
      ✓ should calculate trend correctly (1 ms)
    getBusinessAnalytics
      ✓ should generate comprehensive business analytics (2 ms)
    updateScore
      ✓ should update a score record (1 ms)
      ✓ should handle no fields to update (36 ms)
    deleteScore
      ✓ should delete a score record (1 ms)
      ✓ should handle record not found (1 ms)
    getLatestScores
      ✓ should get latest scores for all score types (3 ms)
  Score History Database Schema
    ✓ should validate table structure requirements (2 ms)
    ✓ should validate score_value constraints (1 ms)
    ✓ should validate foreign key relationship (1 ms)
    ✓ should validate index requirements

FAIL src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/architecture-compliance-checker.ts'

    Require stack:
      src/lib/architecture-scanner/architecture-compliance-checker.ts
      src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts

       6 | import { promises as fs } from 'fs';
       7 | import path from 'path';
    >  8 | import glob from 'glob';
         | ^
       9 |
      10 | export interface ComplianceRule {
      11 |   id: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/architecture-compliance-checker.ts:8:1)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts:8:1)

PASS src/lib/architecture-scanner/__tests__/test-selection-engine.test.ts
  TestSelectionEngine
    loadCoverageMap
      ✓ should load and parse test coverage map successfully (105 ms)
      ✓ should handle file read errors gracefully (36 ms)
      ✓ should handle invalid JSON gracefully (4 ms)
    detectInterfaceMismatches
      ✓ should detect interface mismatches correctly (16 ms)
      ✓ should provide appropriate suggested fixes (23 ms)
      ✓ should throw error if coverage map not loaded (5 ms)
    createKiroComponentFilter
      ✓ should classify components by origin correctly (8 ms)
      ✓ should handle file read errors during origin detection (7 ms)
    generateSafeTestSuite
      ✓ should generate safe test suite with correct categorization (9 ms)
      ✓ should exclude broken tests and interface mismatches (7 ms)
      ✓ should include excellent and good tests in validated list (8 ms)
      ✓ should create proper execution plan phases (10 ms)
      ✓ should include interface mismatches in results (14 ms)
    generateSafeTestReport
      ✓ should generate comprehensive test report (10 ms)
      ✓ should include correct statistics in report (6 ms)
      ✓ should list interface mismatches with details (8 ms)
    exportSafeTestSuite
      ✓ should export safe test suite to JSON file (9 ms)
      ✓ should handle export errors gracefully (9 ms)
    getTestExecutionCommand
      ✓ should generate correct test execution command (2 ms)
      ✓ should throw error if coverage map not loaded (2 ms)
  runTestSelection utility function
    ✓ should run complete test selection workflow (7 ms)
    ✓ should work without output directory (7 ms)

FAIL src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts
  SafeArchivalSystem
    executeArchival
      ✕ should execute complete archival process with default options (73 ms)
      ✕ should create symlinks when option is enabled (15 ms)
      ✕ should run validation checks when enabled (10 ms)
      ✕ should generate rollback script when enabled (10 ms)
      ✕ should process components in batches (15 ms)
      ✕ should handle validation failure and rollback (17 ms)
    dependency resolution
      ✕ should resolve component dependencies correctly (13 ms)
      ✕ should detect unresolved dependencies (19 ms)
    route redirectors
      ✕ should create route redirectors for legacy routes (14 ms)
      ✕ should generate redirect configuration file (10 ms)
    archive manifest
      ✕ should generate comprehensive archive manifest (10 ms)
      ✕ should include component checksums for integrity verification (8 ms)
      ✕ should preserve original file metadata (17 ms)
    rollback mechanism
      ✕ should create executable rollback script (19 ms)
      ✕ should include component restoration commands in rollback script (9 ms)
      ✕ should include validation checks in rollback script (8 ms)
    validation checks
      ✕ should run all required validation checks (8 ms)
      ✕ should save validation results (7 ms)
      ✕ should handle optional validation check failures gracefully (8 ms)
    component restoration
      ✓ should restore individual components from archive (3 ms)
      ✓ should handle component not found in archive (3 ms)
    archive listing
      ✓ should list all archived components (1 ms)
      ✓ should handle missing archive directory (2 ms)
    error handling
      ✓ should handle file system errors gracefully (4 ms)
      ✓ should handle component archival failures (7 ms)
      ✕ should handle validation command failures (10 ms)
    git history preservation
      ✕ should preserve git history when option is enabled (8 ms)
      ✕ should handle git history errors gracefully (9 ms)

  ● SafeArchivalSystem › executeArchival › should execute complete archival process with default options

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should create symlinks when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should run validation checks when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should generate rollback script when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should process components in batches

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should handle validation failure and rollback

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:188:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:176:68)

  ● SafeArchivalSystem › dependency resolution › should resolve component dependencies correctly

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › dependency resolution › should detect unresolved dependencies

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should create route redirectors for legacy routes

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should generate redirect configuration file

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should generate comprehensive archive manifest

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should include component checksums for integrity verification

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should preserve original file metadata

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should create executable rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include component restoration commands in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include validation checks in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should run all required validation checks

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should save validation results

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should handle optional validation check failures gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      361 |
      362 |       // Should not throw for optional check failure
    > 363 |       await expect(
          |             ^
      364 |         SafeArchivalSystem.executeArchival(mockArchivalPlan)
      365 |       ).resolves.toBeDefined();
      366 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:363:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:354:82)

  ● SafeArchivalSystem › error handling › should handle validation command failures

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:500:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:493:64)

  ● SafeArchivalSystem › git history preservation › should preserve git history when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › git history preservation › should handle git history errors gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      529 |
      530 |       // Should not throw for git history errors
    > 531 |       await expect(
          |             ^
      532 |         SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      533 |       ).resolves.toBeDefined();
      534 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:531:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:518:66)

PASS src/__tests__/performance/s3-performance.test.ts
  S3 Performance Tests
    Batch URL Generation Performance
      ✓ should handle batch requests efficiently (29 ms)
      ✓ should cache URLs for repeated requests (6 ms)
    Memory Usage
      ✓ should clean up expired URLs to prevent memory leaks (466 ms)

PASS src/lib/architecture-scanner/__tests__/targeted-test-executor.test.ts
  TargetedTestExecutor
    constructor
      ✓ should initialize with default options (13 ms)
      ✓ should initialize with custom options (1 ms)
    initializeTestRunner
      ✓ should initialize test runner with safe test suite (82 ms)
      ✓ should use default coverage map path if not provided (6 ms)
      ✓ should handle initialization errors gracefully (48 ms)
    executeTestSuite
      ✓ should execute all phases of test suite (97 ms)
      ✓ should handle empty phases gracefully (6 ms)
      ✓ should stop execution on fail-fast mode (22 ms)
    dry run mode
      ✓ should simulate test execution in dry run mode (14 ms)
    failure classification
      ✓ should classify interface mismatch failures as expected (23 ms)
      ✓ should classify timeout failures as infrastructure (48 ms)
      ✓ should classify dependency errors as infrastructure (58 ms)
      ✓ should classify assertion errors as unexpected (47 ms)
    report generation
      ✓ should generate comprehensive test report (46 ms)
      ✓ should save report files to disk (45 ms)
      ✓ should handle file write errors gracefully (46 ms)
      ✓ should generate appropriate recommendations (47 ms)
    confidence level adjustment
      ✓ should adjust confidence level based on execution results (45 ms)
      ✓ should lower confidence for unexpected failures (45 ms)
    concurrency control
      ✓ should respect max concurrency setting (220 ms)
  runTargetedTestExecution utility function
    ✓ should run complete targeted test execution workflow (49 ms)
    ✓ should work with default parameters (48 ms)
    ✓ should handle execution errors gracefully (2 ms)
  FailureClassification
    ✓ should create proper failure classification structure (1 ms)
  TestExecutionResult
    ✓ should create proper test execution result structure (1 ms)

PASS src/services/__tests__/persona-api.test.ts
  PersonaApiService
    Singleton Pattern
      ✓ should return the same instance (10 ms)
    Persona Detection
      ✓ should detect price-conscious persona (105 ms)
      ✓ should detect feature-seeker persona (102 ms)
      ✓ should detect decision-maker persona (106 ms)
      ✓ should detect technical-evaluator persona (107 ms)
      ✓ should handle insufficient data gracefully (102 ms)
    Persona Recommendations
      ✓ should provide price-conscious recommendations (103 ms)
      ✓ should provide feature-seeker recommendations (102 ms)
      ✓ should provide decision-maker recommendations (102 ms)
      ✓ should provide technical-evaluator recommendations (101 ms)
    Persona Analytics
      ✓ should track persona distribution (102 ms)
      ✓ should provide conversion rates by persona (101 ms)
      ✓ should track persona evolution over time (101 ms)
    Mock Mode
      ✓ should work in mock mode when enabled (104 ms)
      ✓ should use real API when mock mode is disabled (2 ms)
    Error Handling
      ✓ should handle API errors gracefully (10 ms)
      ✓ should handle network errors (7 ms)
      ✓ should validate input data (1 ms)
    Integration Tests
      ✓ should complete full persona workflow (306 ms)

Summary of all failing tests
FAIL test/unit/sync-gmb.test.ts
  ● Test suite failed to run

    Cannot find module 'https://deno.land/std@0.178.0/testing/asserts.ts' from 'test/unit/sync-gmb.test.ts'

      1 |
    > 2 | import { assertEquals, assertExists } from 'https://deno.land/std@0.178.0/testing/asserts.ts';
        | ^
      3 |
      4 | // Simple response validation test
      5 | Deno.test('sync-gmb response structure', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/sync-gmb.test.ts:2:1)

FAIL test/unit/sync-ga4.test.ts
  ● Test suite failed to run

    Cannot find module 'https://deno.land/std@0.178.0/testing/asserts.ts' from 'test/unit/sync-ga4.test.ts'

      1 |
    > 2 | import { assertEquals, assertExists } from 'https://deno.land/std@0.178.0/testing/asserts.ts';
        | ^
      3 |
      4 | // Simple response validation test
      5 | Deno.test('sync-ga4 response structure', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/sync-ga4.test.ts:2:1)

FAIL test/smoke/routes.spec.ts
  ● Test suite failed to run

    Cannot find module '@playwright/test' from 'test/smoke/routes.spec.ts'

      1 |
    > 2 | import { test, expect } from '@playwright/test';
        | ^
      3 |
      4 | const routes = [
      5 |   '/',

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/smoke/routes.spec.ts:2:1)

FAIL src/components/analytics/__tests__/EventAnnotations.test.tsx
  ● EventAnnotations Component › getScoreAtDate › should return exact score for matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: undefined

      57 |     it('should return exact score for matching date', () => {
      58 |       const score = getScoreAtDate(mockScoreData, '2025-01-01');
    > 59 |       expect(score).toBe(65.5);
         |                     ^
      60 |     });
      61 |
      62 |     it('should return closest score for non-matching date', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:59:21)

  ● EventAnnotations Component › getScoreAtDate › should return closest score for non-matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      62 |     it('should return closest score for non-matching date', () => {
      63 |       const score = getScoreAtDate(mockScoreData, '2025-01-04');
    > 64 |       expect(score).toBe(68.8); // Closest to 2025-01-03
         |                     ^
      65 |     });
      66 |
      67 |     it('should return default score for empty data', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:64:21)

  ● EventAnnotations Component › getScoreAtDate › should handle single data point

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: 50

      73 |       const singlePoint = [mockScoreData[0]];
      74 |       const score = getScoreAtDate(singlePoint, '2025-01-10');
    > 75 |       expect(score).toBe(65.5);
         |                     ^
      76 |     });
      77 |   });
      78 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:75:21)

  ● EventAnnotations Component › filterEvents › should filter events by date range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      91 |       
      92 |       const filtered = filterEvents(mockEvents, dateRange);
    > 93 |       expect(filtered).toHaveLength(2);
         |                        ^
      94 |       expect(filtered[0].id).toBe('event-1');
      95 |       expect(filtered[1].id).toBe('event-2');
      96 |     });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:93:24)

  ● EventAnnotations Component › filterEvents › should apply both date range and type filters

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

      113 |       
      114 |       const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
    > 115 |       expect(filtered).toHaveLength(1);
          |                        ^
      116 |       expect(filtered[0].id).toBe('event-1');
      117 |     });
      118 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:115:24)

  ● EventAnnotations Component › Event Positioning Logic › should calculate correct positions for events within data range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      140 |       });
      141 |       
    > 142 |       expect(eventsInRange).toHaveLength(2);
          |                             ^
      143 |       
      144 |       // Test score positioning
      145 |       const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:142:29)

  ● EventAnnotations Component › Event Positioning Logic › should handle events outside data range gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      155 |       
      156 |       // Should return closest available score (2025-01-03)
    > 157 |       expect(score).toBe(68.8);
          |                     ^
      158 |     });
      159 |   });
      160 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:157:21)

  ● EventAnnotations Component › Performance Considerations › should handle large number of events efficiently

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      204 |       const endTime = performance.now();
      205 |       
    > 206 |       expect(filtered.length).toBeGreaterThan(0);
          |                               ^
      207 |       expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      208 |     });
      209 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:206:31)

  ● EventAnnotations Component › Performance Considerations › should handle large score dataset efficiently

    expect(received).toBe(expected) // Object.is equality

    Expected: "number"
    Received: "undefined"

      220 |       const endTime = performance.now();
      221 |       
    > 222 |       expect(typeof score).toBe('number');
          |                            ^
      223 |       expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
      224 |     });
      225 |   });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:222:28)

FAIL src/services/__tests__/vc.test.ts
  ● VC Service - Core Business Logic › startVisibilityCheck › should construct correct API request with all parameters

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle successful visibility check initiation

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle API errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid email format"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:69:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:59:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle different locales correctly

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should return null in production mode

    expect(received).toBeNull()

    Received: {"apiBase": "https://test-api.matbakh.app", "mode": "test", "provider": "aws"}

      124 |       const result = getVCEnvironmentInfo();
      125 |       
    > 126 |       expect(result).toBeNull();
          |                      ^
      127 |       
      128 |       // Restore
      129 |       if (originalEnv !== undefined) {

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:126:22)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should include correct environment variables

    expect(received).toBe(expected) // Object.is equality

    Expected: "development"
    Received: "test"

      140 |       if (result) {
      141 |         expect(result.apiBase).toBeDefined();
    > 142 |         expect(result.mode).toBe('development');
          |                             ^
      143 |       }
      144 |       
      145 |       // Restore

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:142:29)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle malformed API responses

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid JSON"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:162:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:153:60)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle rate limiting

    expect(received).rejects.toThrow(expected)

    Expected substring: "Rate limit exceeded"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:175:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:165:50)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle server errors

    expect(received).rejects.toThrow(expected)

    Expected substring: "Internal server error"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:188:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:178:50)

FAIL src/services/__tests__/ProfileService.test.ts
  ● ProfileService › Business Profile Management › should create a new business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should retrieve business profile by ID

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should update existing business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should delete business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should handle profile not found

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate required fields on creation

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate email format

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should search profiles by business name

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by category

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by location

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should get profile completion percentage

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should identify missing profile fields

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should suggest profile improvements

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle database connection errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle SQL syntax errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle duplicate email errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Integration Tests › should complete full profile lifecycle

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

FAIL src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts
  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components as safe when they have Kiro alternatives

    expect(received).toContain(expected) // indexOf

    Expected substring: "Kiro alternative available"
    Received string:    "Legacy component with clear migration path"

      281 |       const component = plan.components[0];
      282 |       expect(component.safeToArchive).toBe(true);
    > 283 |       expect(component.archiveReason).toContain('Kiro alternative available');
          |                                       ^
      284 |       expect(component.riskLevel).toBe('low');
      285 |     });
      286 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:283:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark critical components as unsafe to archive

    expect(received).toContain(expected) // indexOf

    Expected substring: "Critical system component"
    Received string:    "Medium-risk component - review recommended"

      299 |       const component = plan.components[0];
      300 |       expect(component.safeToArchive).toBe(false);
    > 301 |       expect(component.archiveReason).toContain('Critical system component');
          |                                       ^
      302 |       expect(component.riskLevel).toBe('critical');
      303 |     });
      304 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:301:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components with active backend dependencies as unsafe

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      324 |
      325 |       const component = plan.components[0];
    > 326 |       expect(component.safeToArchive).toBe(false);
          |                                       ^
      327 |       expect(component.archiveReason).toContain('manual review');
      328 |       expect(component.riskLevel).toBe('medium');
      329 |     });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:326:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark unknown components without dependencies as safe

    expect(received).toContain(expected) // indexOf

    Expected substring: "Unknown origin component with no active dependencies"
    Received string:    "Safe component with positive archival indicators"

      350 |       const component = plan.components[0];
      351 |       expect(component.safeToArchive).toBe(true);
    > 352 |       expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
          |                                       ^
      353 |       expect(component.riskLevel).toBe('medium');
      354 |     });
      355 |   });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:352:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

FAIL src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts'

      18 | }));
      19 |
    > 20 | jest.mock('glob');
         |      ^
      21 |
      22 | const mockFs = fs as jest.Mocked<typeof fs>;
      23 | const mockGlob = glob as jest.MockedFunction<any>;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts:20:6)

FAIL src/services/__tests__/auth.test.ts
  ● Test suite failed to run

    TypeError: 'toString' called on an object that is not a valid instance of Location.

      30 | delete window.location;
      31 | // @ts-expect-error test shim
    > 32 | window.location = { 
         |                ^
      33 |   ...originalLocation, 
      34 |   href: 'http://localhost:3000', 
      35 |   hash: '', 

      at Object.toString (node_modules/jest-environment-jsdom/node_modules/jsdom/lib/jsdom/living/generated/Location.js:130:17)
          at String (<anonymous>)
          at Reflect.set (<anonymous>)
      at Object.<anonymous> (src/services/__tests__/auth.test.ts:32:16)

FAIL src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/architecture-compliance-checker.ts'

    Require stack:
      src/lib/architecture-scanner/architecture-compliance-checker.ts
      src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts

       6 | import { promises as fs } from 'fs';
       7 | import path from 'path';
    >  8 | import glob from 'glob';
         | ^
       9 |
      10 | export interface ComplianceRule {
      11 |   id: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/architecture-compliance-checker.ts:8:1)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts:8:1)

FAIL src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts
  ● SafeArchivalSystem › executeArchival › should execute complete archival process with default options

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should create symlinks when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should run validation checks when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should generate rollback script when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should process components in batches

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should handle validation failure and rollback

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:188:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:176:68)

  ● SafeArchivalSystem › dependency resolution › should resolve component dependencies correctly

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › dependency resolution › should detect unresolved dependencies

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should create route redirectors for legacy routes

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should generate redirect configuration file

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should generate comprehensive archive manifest

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should include component checksums for integrity verification

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should preserve original file metadata

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should create executable rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include component restoration commands in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include validation checks in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should run all required validation checks

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should save validation results

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should handle optional validation check failures gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      361 |
      362 |       // Should not throw for optional check failure
    > 363 |       await expect(
          |             ^
      364 |         SafeArchivalSystem.executeArchival(mockArchivalPlan)
      365 |       ).resolves.toBeDefined();
      366 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:363:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:354:82)

  ● SafeArchivalSystem › error handling › should handle validation command failures

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:500:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:493:64)

  ● SafeArchivalSystem › git history preservation › should preserve git history when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › git history preservation › should handle git history errors gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      529 |
      530 |       // Should not throw for git history errors
    > 531 |       await expect(
          |             ^
      532 |         SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      533 |       ).resolves.toBeDefined();
      534 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:531:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:518:66)


Test Suites: 11 failed, 16 passed, 27 total
Tests:       61 failed, 295 passed, 356 total
Snapshots:   0 total
Time:        6.98 s
Ran all test suites.


#### Architecture Compliance ❌
- Status: FAIL
- Duration: 0.00s

- Errors: Command failed: npx tsx scripts/run-architecture-compliance.ts

node:internal/modules/run_main:123
    triggerUncaughtException(
    ^
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'glob' imported from /Users/macbookpro/Projects/matbakh-visibility-boost/src/lib/architecture-scanner/architecture-compliance-checker.ts
    at packageResolve (node:internal/modules/esm/resolve:873:9)
    at moduleResolve (node:internal/modules/esm/resolve:946:18)
    at defaultResolve (node:internal/modules/esm/resolve:1188:11)
    at nextResolve (node:internal/modules/esm/hooks:864:28)
    at resolveBase (file:///Users/macbookpro/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/esm/index.mjs?1758201492994:2:3744)
    at resolveDirectory (file:///Users/macbookpro/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/esm/index.mjs?1758201492994:2:4243)
    at resolveTsPaths (file:///Users/macbookpro/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/esm/index.mjs?1758201492994:2:4984)
    at async resolve (file:///Users/macbookpro/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/esm/index.mjs?1758201492994:2:5355)
    at async nextResolve (node:internal/modules/esm/hooks:864:22)
    at async Hooks.resolve (node:internal/modules/esm/hooks:306:24) {
  code: 'ERR_MODULE_NOT_FOUND'
}

Node.js v20.19.5


#### Kiro System Purity ✅
- Status: PASS
- Duration: 1.75s
- Details: System purity validation passed



### Critical User Journeys
- Duration: 0.00s
- Tests: 4 (3 passed, 1 failed, 0 skipped)


#### VC User Journey ❌
- Status: FAIL
- Duration: 0.00s

- Errors: Critical VC component missing: src/components/vc/VCQuick.tsx

#### Auth User Journey ✅
- Status: PASS
- Duration: 0.00s
- Details: All Auth components are accessible


#### Upload User Journey ✅
- Status: PASS
- Duration: 0.00s
- Details: Found 1 upload components


#### Dashboard User Journey ✅
- Status: PASS
- Duration: 0.00s
- Details: Found 1 dashboard components



### Performance Tests
- Duration: 19.88s
- Tests: 3 (2 passed, 1 failed, 0 skipped)


#### Build Performance ✅
- Status: PASS
- Duration: 10.14s
- Details: Build completed in 10.14s


#### Bundle Size ✅
- Status: PASS
- Duration: 0.00s
- Details: Total bundle size: 1.18MB


#### Test Execution Performance ❌
- Status: FAIL
- Duration: 9.74s

- Errors: Command failed: npm test -- --testNamePattern="should" --maxWorkers=1
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
FAIL src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts
  LegacyComponentDetector
    scanLegacyComponents
      ✓ should identify legacy components correctly (75 ms)
      ✓ should create proper backup plan (5 ms)
    Backend Dependency Analysis
      ✓ should detect Supabase backend dependencies (5 ms)
      ✓ should detect Lovable backend dependencies (3 ms)
      ✓ should provide migration paths for dependencies (3 ms)
    Route Usage Analysis
      ✓ should detect route usage in page components (3 ms)
      ✓ should identify Kiro alternatives for legacy routes (3 ms)
    Safe-to-Archive Classification
      ✕ should mark components as safe when they have Kiro alternatives (4 ms)
      ✕ should mark critical components as unsafe to archive (4 ms)
      ✕ should mark components with active backend dependencies as unsafe (3 ms)
      ✕ should mark unknown components without dependencies as safe (2 ms)
    Archive Manifest Generation
      ✓ should generate comprehensive archive manifest (5 ms)
    Error Handling
      ✓ should handle file read errors gracefully (9 ms)
      ✓ should handle malformed file content (2 ms)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components as safe when they have Kiro alternatives

    expect(received).toContain(expected) // indexOf

    Expected substring: "Kiro alternative available"
    Received string:    "Legacy component with clear migration path"

      281 |       const component = plan.components[0];
      282 |       expect(component.safeToArchive).toBe(true);
    > 283 |       expect(component.archiveReason).toContain('Kiro alternative available');
          |                                       ^
      284 |       expect(component.riskLevel).toBe('low');
      285 |     });
      286 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:283:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark critical components as unsafe to archive

    expect(received).toContain(expected) // indexOf

    Expected substring: "Critical system component"
    Received string:    "Medium-risk component - review recommended"

      299 |       const component = plan.components[0];
      300 |       expect(component.safeToArchive).toBe(false);
    > 301 |       expect(component.archiveReason).toContain('Critical system component');
          |                                       ^
      302 |       expect(component.riskLevel).toBe('critical');
      303 |     });
      304 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:301:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components with active backend dependencies as unsafe

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      324 |
      325 |       const component = plan.components[0];
    > 326 |       expect(component.safeToArchive).toBe(false);
          |                                       ^
      327 |       expect(component.archiveReason).toContain('manual review');
      328 |       expect(component.riskLevel).toBe('medium');
      329 |     });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:326:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark unknown components without dependencies as safe

    expect(received).toContain(expected) // indexOf

    Expected substring: "Unknown origin component with no active dependencies"
    Received string:    "Safe component with positive archival indicators"

      350 |       const component = plan.components[0];
      351 |       expect(component.safeToArchive).toBe(true);
    > 352 |       expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
          |                                       ^
      353 |       expect(component.riskLevel).toBe('medium');
      354 |     });
      355 |   });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:352:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

FAIL src/services/__tests__/ProfileService.test.ts
  ProfileService
    Business Profile Management
      ✕ should create a new business profile
      ✕ should retrieve business profile by ID
      ✕ should update existing business profile (1 ms)
      ✕ should delete business profile
      ✕ should handle profile not found (1 ms)
      ✕ should validate required fields on creation
      ✕ should validate email format (1 ms)
    Profile Search and Filtering
      ✕ should search profiles by business name
      ✕ should filter profiles by category
      ✕ should filter profiles by location
    Profile Analytics
      ✕ should get profile completion percentage
      ✕ should identify missing profile fields (1 ms)
      ✕ should suggest profile improvements
    Error Handling
      ✕ should handle database connection errors
      ✕ should handle SQL syntax errors
      ✕ should handle duplicate email errors (1 ms)
    Integration Tests
      ✕ should complete full profile lifecycle

  ● ProfileService › Business Profile Management › should create a new business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should retrieve business profile by ID

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should update existing business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should delete business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should handle profile not found

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate required fields on creation

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate email format

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should search profiles by business name

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by category

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by location

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should get profile completion percentage

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should identify missing profile fields

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should suggest profile improvements

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle database connection errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle SQL syntax errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle duplicate email errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Integration Tests › should complete full profile lifecycle

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

FAIL src/services/__tests__/vc.test.ts
  VC Service - Core Business Logic
    startVisibilityCheck
      ✕ should construct correct API request with all parameters (1 ms)
      ✕ should handle successful visibility check initiation
      ✕ should handle API errors gracefully (2 ms)
      ✓ should handle network errors (1 ms)
      ✓ should validate required parameters (1 ms)
      ✕ should handle different locales correctly
    getVCEnvironmentInfo
      ✓ should return environment info in development mode (1 ms)
      ✕ should return null in production mode (1 ms)
      ✕ should include correct environment variables (2 ms)
    Error Handling & Edge Cases
      ✕ should handle malformed API responses (1 ms)
      ✕ should handle rate limiting
      ✕ should handle server errors (1 ms)

  ● VC Service - Core Business Logic › startVisibilityCheck › should construct correct API request with all parameters

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle successful visibility check initiation

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle API errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid email format"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:69:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:59:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle different locales correctly

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should return null in production mode

    expect(received).toBeNull()

    Received: {"apiBase": "https://test-api.matbakh.app", "mode": "test", "provider": "aws"}

      124 |       const result = getVCEnvironmentInfo();
      125 |       
    > 126 |       expect(result).toBeNull();
          |                      ^
      127 |       
      128 |       // Restore
      129 |       if (originalEnv !== undefined) {

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:126:22)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should include correct environment variables

    expect(received).toBe(expected) // Object.is equality

    Expected: "development"
    Received: "test"

      140 |       if (result) {
      141 |         expect(result.apiBase).toBeDefined();
    > 142 |         expect(result.mode).toBe('development');
          |                             ^
      143 |       }
      144 |       
      145 |       // Restore

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:142:29)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle malformed API responses

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid JSON"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:162:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:153:60)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle rate limiting

    expect(received).rejects.toThrow(expected)

    Expected substring: "Rate limit exceeded"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:175:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:165:50)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle server errors

    expect(received).rejects.toThrow(expected)

    Expected substring: "Internal server error"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:188:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:178:50)

FAIL src/components/analytics/__tests__/EventAnnotations.test.tsx
  EventAnnotations Component
    getScoreAtDate
      ✕ should return exact score for matching date (1 ms)
      ✕ should return closest score for non-matching date (1 ms)
      ✓ should return default score for empty data
      ✕ should handle single data point (1 ms)
    filterEvents
      ✓ should return all events when no filters applied
      ✕ should filter events by date range (1 ms)
      ✓ should filter events by visible types (1 ms)
      ✕ should apply both date range and type filters
      ✓ should return empty array when no events match filters (1 ms)
      ✓ should handle empty visible types array
    Event Positioning Logic
      ✕ should calculate correct positions for events within data range
      ✕ should handle events outside data range gracefully
    Event Type Validation
      ✓ should validate all event types are supported
      ✓ should handle events with different impact types (1 ms)
    Performance Considerations
      ✕ should handle large number of events efficiently
      ✕ should handle large score dataset efficiently (1 ms)
    Edge Cases
      ✓ should handle events with missing optional fields
      ✓ should handle invalid date formats gracefully
      ✓ should handle empty arrays

  ● EventAnnotations Component › getScoreAtDate › should return exact score for matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: undefined

      57 |     it('should return exact score for matching date', () => {
      58 |       const score = getScoreAtDate(mockScoreData, '2025-01-01');
    > 59 |       expect(score).toBe(65.5);
         |                     ^
      60 |     });
      61 |
      62 |     it('should return closest score for non-matching date', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:59:21)

  ● EventAnnotations Component › getScoreAtDate › should return closest score for non-matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      62 |     it('should return closest score for non-matching date', () => {
      63 |       const score = getScoreAtDate(mockScoreData, '2025-01-04');
    > 64 |       expect(score).toBe(68.8); // Closest to 2025-01-03
         |                     ^
      65 |     });
      66 |
      67 |     it('should return default score for empty data', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:64:21)

  ● EventAnnotations Component › getScoreAtDate › should handle single data point

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: 50

      73 |       const singlePoint = [mockScoreData[0]];
      74 |       const score = getScoreAtDate(singlePoint, '2025-01-10');
    > 75 |       expect(score).toBe(65.5);
         |                     ^
      76 |     });
      77 |   });
      78 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:75:21)

  ● EventAnnotations Component › filterEvents › should filter events by date range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      91 |       
      92 |       const filtered = filterEvents(mockEvents, dateRange);
    > 93 |       expect(filtered).toHaveLength(2);
         |                        ^
      94 |       expect(filtered[0].id).toBe('event-1');
      95 |       expect(filtered[1].id).toBe('event-2');
      96 |     });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:93:24)

  ● EventAnnotations Component › filterEvents › should apply both date range and type filters

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

      113 |       
      114 |       const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
    > 115 |       expect(filtered).toHaveLength(1);
          |                        ^
      116 |       expect(filtered[0].id).toBe('event-1');
      117 |     });
      118 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:115:24)

  ● EventAnnotations Component › Event Positioning Logic › should calculate correct positions for events within data range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      140 |       });
      141 |       
    > 142 |       expect(eventsInRange).toHaveLength(2);
          |                             ^
      143 |       
      144 |       // Test score positioning
      145 |       const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:142:29)

  ● EventAnnotations Component › Event Positioning Logic › should handle events outside data range gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      155 |       
      156 |       // Should return closest available score (2025-01-03)
    > 157 |       expect(score).toBe(68.8);
          |                     ^
      158 |     });
      159 |   });
      160 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:157:21)

  ● EventAnnotations Component › Performance Considerations › should handle large number of events efficiently

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      204 |       const endTime = performance.now();
      205 |       
    > 206 |       expect(filtered.length).toBeGreaterThan(0);
          |                               ^
      207 |       expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      208 |     });
      209 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:206:31)

  ● EventAnnotations Component › Performance Considerations › should handle large score dataset efficiently

    expect(received).toBe(expected) // Object.is equality

    Expected: "number"
    Received: "undefined"

      220 |       const endTime = performance.now();
      221 |       
    > 222 |       expect(typeof score).toBe('number');
          |                            ^
      223 |       expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
      224 |     });
      225 |   });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:222:28)

FAIL src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts
  SafeArchivalSystem
    executeArchival
      ✕ should execute complete archival process with default options (21 ms)
      ✕ should create symlinks when option is enabled (10 ms)
      ✕ should run validation checks when enabled (13 ms)
      ✕ should generate rollback script when enabled (9 ms)
      ✕ should process components in batches (9 ms)
      ✕ should handle validation failure and rollback (11 ms)
    dependency resolution
      ✕ should resolve component dependencies correctly (14 ms)
      ✕ should detect unresolved dependencies (9 ms)
    route redirectors
      ✕ should create route redirectors for legacy routes (8 ms)
      ✕ should generate redirect configuration file (8 ms)
    archive manifest
      ✕ should generate comprehensive archive manifest (11 ms)
      ✕ should include component checksums for integrity verification (9 ms)
      ✕ should preserve original file metadata (8 ms)
    rollback mechanism
      ✕ should create executable rollback script (10 ms)
      ✕ should include component restoration commands in rollback script (8 ms)
      ✕ should include validation checks in rollback script (10 ms)
    validation checks
      ✕ should run all required validation checks (7 ms)
      ✕ should save validation results (7 ms)
      ✕ should handle optional validation check failures gracefully (8 ms)
    component restoration
      ✓ should restore individual components from archive (2 ms)
      ✓ should handle component not found in archive (1 ms)
    archive listing
      ✓ should list all archived components (1 ms)
      ✓ should handle missing archive directory (2 ms)
    error handling
      ✓ should handle file system errors gracefully (3 ms)
      ✓ should handle component archival failures (6 ms)
      ✕ should handle validation command failures (10 ms)
    git history preservation
      ✕ should preserve git history when option is enabled (7 ms)
      ✕ should handle git history errors gracefully (8 ms)

  ● SafeArchivalSystem › executeArchival › should execute complete archival process with default options

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should create symlinks when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should run validation checks when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should generate rollback script when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should process components in batches

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should handle validation failure and rollback

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:188:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:176:68)

  ● SafeArchivalSystem › dependency resolution › should resolve component dependencies correctly

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › dependency resolution › should detect unresolved dependencies

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should create route redirectors for legacy routes

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should generate redirect configuration file

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should generate comprehensive archive manifest

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should include component checksums for integrity verification

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should preserve original file metadata

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should create executable rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include component restoration commands in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include validation checks in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should run all required validation checks

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should save validation results

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should handle optional validation check failures gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      361 |
      362 |       // Should not throw for optional check failure
    > 363 |       await expect(
          |             ^
      364 |         SafeArchivalSystem.executeArchival(mockArchivalPlan)
      365 |       ).resolves.toBeDefined();
      366 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:363:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:354:82)

  ● SafeArchivalSystem › error handling › should handle validation command failures

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:500:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:493:64)

  ● SafeArchivalSystem › git history preservation › should preserve git history when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › git history preservation › should handle git history errors gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      529 |
      530 |       // Should not throw for git history errors
    > 531 |       await expect(
          |             ^
      532 |         SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      533 |       ).resolves.toBeDefined();
      534 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:531:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:518:66)

PASS src/services/__tests__/persona-api.test.ts
  PersonaApiService
    Singleton Pattern
      ✓ should return the same instance
    Persona Detection
      ✓ should detect price-conscious persona (103 ms)
      ✓ should detect feature-seeker persona (102 ms)
      ✓ should detect decision-maker persona (101 ms)
      ✓ should detect technical-evaluator persona (102 ms)
      ✓ should handle insufficient data gracefully (102 ms)
    Persona Recommendations
      ✓ should provide price-conscious recommendations (102 ms)
      ✓ should provide feature-seeker recommendations (102 ms)
      ✓ should provide decision-maker recommendations (101 ms)
      ✓ should provide technical-evaluator recommendations (100 ms)
    Persona Analytics
      ✓ should track persona distribution (102 ms)
      ✓ should provide conversion rates by persona (101 ms)
      ✓ should track persona evolution over time (101 ms)
    Mock Mode
      ✓ should work in mock mode when enabled (101 ms)
      ✓ should use real API when mock mode is disabled (1 ms)
    Error Handling
      ✓ should handle API errors gracefully (9 ms)
      ✓ should handle network errors (5 ms)
      ✓ should validate input data (1 ms)
    Integration Tests
      ✓ should complete full persona workflow (304 ms)

PASS src/__tests__/performance/s3-performance.test.ts
  S3 Performance Tests
    Batch URL Generation Performance
      ✓ should handle batch requests efficiently (19 ms)
      ✓ should cache URLs for repeated requests (3 ms)
    Memory Usage
      ✓ should clean up expired URLs to prevent memory leaks (378 ms)

PASS src/lib/forecast/__tests__/forecastEngine.test.ts
  ForecastEngine
    generateForecast
      ✓ should return flat trend for constant scores (3 ms)
      ✓ should return up trend for linearly increasing scores (1 ms)
      ✓ should return down trend for linearly decreasing scores (2 ms)
      ✓ should return empty array for insufficient data (7 ms)
      ✓ should handle high variance with wider confidence intervals (1 ms)
      ✓ should handle badly formatted data gracefully (2 ms)
      ✓ should generate correct number of forecast points for different ranges (1 ms)
      ✓ should have valid forecast point structure (10 ms)
      ✓ should have increasing uncertainty over time (1 ms)
    analyzeTrend
      ✓ should correctly identify flat trend (1 ms)
      ✓ should correctly identify upward trend
      ✓ should correctly identify downward trend
      ✓ should handle empty data (1 ms)
    assessDataQuality
      ✓ should assess good quality for clean data (1 ms)
      ✓ should identify issues with insufficient data
      ✓ should identify high volatility (1 ms)
    generateComprehensiveForecast
      ✓ should generate complete forecast result (2 ms)
    Edge Cases
      ✓ should handle single data point (1 ms)
      ✓ should handle identical dates (2 ms)
      ✓ should handle extreme values (1 ms)
      ✓ should handle unsorted data
    Performance
      ✓ should handle large datasets efficiently (6 ms)

PASS src/lib/recommendation/__tests__/recommendationTrigger.test.ts
  RecommendationTrigger
    evaluateScoreTrend
      ✓ should not trigger for insufficient data (2 ms)
      ✓ should not trigger for stable scores (2 ms)
      ✓ should trigger drop for significant score decrease (1 ms)
      ✓ should trigger stagnation for unchanging scores (2 ms)
      ✓ should not trigger for improving scores (1 ms)
      ✓ should handle volatile scores appropriately
      ✓ should respect custom thresholds
      ✓ should provide appropriate metadata (2 ms)
      ✓ should not trigger for slight improvements (1 ms)
      ✓ should trigger drop for exactly threshold change (1 ms)
    evaluateScoreTrendWithContext
      ✓ should use contextual thresholds for different score types (1 ms)
      ✓ should adjust actions based on score type (1 ms)
      ✓ should handle industry-specific contexts (1 ms)
    Edge Cases and Error Handling
      ✓ should handle empty score arrays gracefully (1 ms)
      ✓ should handle invalid threshold configurations (6 ms)

PASS src/services/__tests__/forecasting-engine.test.ts
  ForecastingEngine
    generateForecast
      ✓ should generate forecast with valid data (2 ms)
      ✓ should throw error with insufficient data (21 ms)
      ✓ should generate different forecasts for different ranges (1 ms)
      ✓ should detect upward trend correctly (1 ms)
      ✓ should detect downward trend correctly (1 ms)
      ✓ should detect stable trend correctly
      ✓ should generate forecast points with confidence intervals (4 ms)
      ✓ should have increasing uncertainty over time
    detectTrendChanges
      ✓ should detect trend changes in data (1 ms)
      ✓ should return empty array for insufficient data (1 ms)
      ✓ should detect acceleration and deceleration (1 ms)
    getForecastSummary
      ✓ should generate comprehensive forecast summary (1 ms)
      ✓ should provide appropriate trend descriptions (1 ms)
      ✓ should provide confidence descriptions
      ✓ should generate insights based on forecast data (1 ms)
      ✓ should generate appropriate recommendations (1 ms)
    Edge Cases
      ✓ should handle data with missing values gracefully
      ✓ should handle extreme values correctly (2 ms)
      ✓ should handle identical values
      ✓ should handle very large datasets efficiently (5 ms)
    Statistical Accuracy
      ✓ should have reasonable R-squared for linear data
      ✓ should have lower R-squared for noisy data (1 ms)
      ✓ should have confidence that correlates with data quality

PASS src/data/recommendations/__tests__/recommendations.test.ts
  Goal-Specific Recommendations
    getRecommendationsByGoal
      ✓ should return recommendations for a valid goal (2 ms)
      ✓ should return empty array for invalid goal
    getGoalProfile
      ✓ should return complete goal profile with recommendations (1 ms)
    getAllGoalProfiles
      ✓ should return all goal profiles (3 ms)
    getRecommendationsSorted
      ✓ should sort recommendations by impact score (1 ms)
      ✓ should sort recommendations by effort score
      ✓ should sort recommendations by combined score (1 ms)
    getQuickWins
      ✓ should return only high impact, low effort recommendations (1 ms)
    getStrategicInitiatives
      ✓ should return only high impact, high effort recommendations
    calculateGoalMetrics
      ✓ should calculate correct metrics for a goal (4 ms)
    Recommendation Data Quality
      ✓ should have valid data for all goals (30 ms)

PASS src/components/analytics/__tests__/TrendFilters.test.tsx
  TrendFilters Component
    Props Validation
      ✓ should validate TrendFilters interface structure (1 ms)
      ✓ should handle optional businessUnit property (2 ms)
      ✓ should validate BusinessUnit interface
    Score Type Handling
      ✓ should validate all score types (2 ms)
      ✓ should handle score type changes
    Date Range Handling
      ✓ should validate date range presets (1 ms)
      ✓ should generate correct date ranges for presets (1 ms)
      ✓ should handle custom date range changes
      ✓ should validate date range logic
    Business Unit Handling
      ✓ should validate mock business units structure (1 ms)
      ✓ should handle business unit selection
      ✓ should handle "all units" selection (1 ms)
    Filter State Management
      ✓ should maintain filter state consistency
      ✓ should handle partial filter updates (1 ms)
    Date Formatting
      ✓ should format dates correctly for input fields
      ✓ should format dates correctly for German locale display (20 ms)
    Integration Scenarios
      ✓ should handle complete filter workflow (1 ms)

PASS src/lib/architecture-scanner/__tests__/enhanced-risk-assessor.test.ts
  EnhancedRiskAssessor
    assessRisk
      ✓ should classify critical system components as critical risk (1 ms)
      ✓ should classify components with migration paths as lower risk (1 ms)
      ✓ should classify components with Kiro alternatives as lower risk (1 ms)
      ✓ should classify debug/test components as safe (3 ms)
      ✓ should classify recently modified components as higher risk
      ✓ should classify old components as safer to archive (1 ms)
      ✓ should classify high complexity components with higher risk
      ✓ should never classify Kiro components as safe to archive (1 ms)
      ✓ should provide mitigation suggestions based on risk factors
    batchAssessRisk
      ✓ should assess multiple components in batch
    generateRiskReport
      ✓ should generate comprehensive risk report (1 ms)
      ✓ should count risk factors correctly (1 ms)
    risk factor assessment
      ✓ should detect development routes as low risk
      ✓ should handle file stat errors gracefully (1 ms)
      ✓ should provide confidence scores
    edge cases
      ✓ should handle components with no risk factors (1 ms)
      ✓ should handle components with mixed risk factors (1 ms)

PASS src/lib/architecture-scanner/__tests__/targeted-test-executor.test.ts
  TargetedTestExecutor
    constructor
      ✓ should initialize with default options
      ✓ should initialize with custom options
    initializeTestRunner
      ✓ should initialize test runner with safe test suite (10 ms)
      ✓ should use default coverage map path if not provided (2 ms)
      ✓ should handle initialization errors gracefully (16 ms)
    executeTestSuite
      ✓ should execute all phases of test suite (49 ms)
      ✓ should handle empty phases gracefully (4 ms)
      ✓ should stop execution on fail-fast mode (18 ms)
    dry run mode
      ✓ should simulate test execution in dry run mode (15 ms)
    failure classification
      ✓ should classify interface mismatch failures as expected (20 ms)
      ✓ should classify timeout failures as infrastructure (45 ms)
      ✓ should classify dependency errors as infrastructure (44 ms)
      ✓ should classify assertion errors as unexpected (46 ms)
    report generation
      ✓ should generate comprehensive test report (45 ms)
      ✓ should save report files to disk (45 ms)
      ✓ should handle file write errors gracefully (43 ms)
      ✓ should generate appropriate recommendations (46 ms)
    confidence level adjustment
      ✓ should adjust confidence level based on execution results (44 ms)
      ✓ should lower confidence for unexpected failures (46 ms)
    concurrency control
      ✓ should respect max concurrency setting (216 ms)
  runTargetedTestExecution utility function
    ✓ should run complete targeted test execution workflow (45 ms)
    ✓ should work with default parameters (42 ms)
    ✓ should handle execution errors gracefully (2 ms)
  FailureClassification
    ✓ should create proper failure classification structure (1 ms)
  TestExecutionResult
    ✓ should create proper test execution result structure

PASS src/lib/architecture-scanner/__tests__/test-selection-engine.test.ts
  TestSelectionEngine
    loadCoverageMap
      ✓ should load and parse test coverage map successfully (5 ms)
      ✓ should handle file read errors gracefully (14 ms)
      ✓ should handle invalid JSON gracefully (1 ms)
    detectInterfaceMismatches
      ✓ should detect interface mismatches correctly (1 ms)
      ✓ should provide appropriate suggested fixes (1 ms)
      ✓ should throw error if coverage map not loaded (1 ms)
    createKiroComponentFilter
      ✓ should classify components by origin correctly (1 ms)
      ✓ should handle file read errors during origin detection (2 ms)
    generateSafeTestSuite
      ✓ should generate safe test suite with correct categorization (7 ms)
      ✓ should exclude broken tests and interface mismatches (3 ms)
      ✓ should include excellent and good tests in validated list (2 ms)
      ✓ should create proper execution plan phases (3 ms)
      ✓ should include interface mismatches in results (3 ms)
    generateSafeTestReport
      ✓ should generate comprehensive test report (3 ms)
      ✓ should include correct statistics in report (3 ms)
      ✓ should list interface mismatches with details (2 ms)
    exportSafeTestSuite
      ✓ should export safe test suite to JSON file (3 ms)
      ✓ should handle export errors gracefully (3 ms)
    getTestExecutionCommand
      ✓ should generate correct test execution command (1 ms)
      ✓ should throw error if coverage map not loaded (1 ms)
  runTestSelection utility function
    ✓ should run complete test selection workflow (6 ms)
    ✓ should work without output directory (3 ms)

PASS src/services/__tests__/benchmark-comparison.test.ts
  BenchmarkComparisonService
    getIndustryBenchmarks
      ✓ should fetch benchmark data successfully (1 ms)
      ✓ should return null when benchmark not found
    compareToBenchmark
      ✓ should calculate comparison for score above 75th percentile (1 ms)
      ✓ should calculate comparison for score below 25th percentile
      ✓ should calculate comparison for average score (1 ms)
      ✓ should fallback to national benchmark when regional not available (1 ms)
    getMultiRegionBenchmarks
      ✓ should fetch benchmarks for multiple regions (1 ms)
      ✓ should handle empty results gracefully
    updateBenchmark
      ✓ should update benchmark data successfully (1 ms)
      ✓ should handle update errors gracefully (11 ms)
    calculateComparison (private method testing via public interface)
      ✓ should generate appropriate recommendations for each performance category (1 ms)
      ✓ should calculate improvement potential correctly
      ✓ should generate position descriptions correctly (1 ms)

PASS src/services/__tests__/score-history.test.ts
  ScoreHistoryService
    insertScore
      ✓ should insert a new score record (2 ms)
      ✓ should validate score_type enum values (4 ms)
      ✓ should validate source enum values
    insertScores (bulk)
      ✓ should insert multiple score records
    queryScoreHistory
      ✓ should query score history with filters (1 ms)
      ✓ should handle multiple score types in query
      ✓ should handle date range filters (1 ms)
    getScoreEvolution
      ✓ should calculate score evolution data (1 ms)
      ✓ should handle empty data gracefully
      ✓ should calculate trend correctly (1 ms)
    getBusinessAnalytics
      ✓ should generate comprehensive business analytics (1 ms)
    updateScore
      ✓ should update a score record (1 ms)
      ✓ should handle no fields to update (12 ms)
    deleteScore
      ✓ should delete a score record
      ✓ should handle record not found (1 ms)
    getLatestScores
      ✓ should get latest scores for all score types (1 ms)
  Score History Database Schema
    ✓ should validate table structure requirements (1 ms)
    ✓ should validate score_value constraints
    ✓ should validate foreign key relationship (1 ms)
    ✓ should validate index requirements

PASS src/components/analytics/__tests__/TrendChart.test.tsx
  TrendChart Component
    ✓ should validate props structure (1 ms)
    ✓ should handle different score types (5 ms)
    ✓ should validate mock data structure (1 ms)
    ✓ should validate event data structure (1 ms)
  TrendChart Data Validation
    ✓ should validate score values are within range (3 ms)
    ✓ should validate date format (6 ms)
    ✓ should validate business_id format (4 ms)

PASS src/lib/__tests__/todoGenerator.test.ts
  generateTodos
    Google My Business Checks
      ✓ should create high priority todo for missing photos (1 ms)
      ✓ should create high priority todo for missing hours (1 ms)
      ✓ should create medium priority todo for incomplete profile
    Meta/Facebook Checks
      ✓ should create medium priority todo for disabled messenger
      ✓ should create medium priority todo for missing photos
    Instagram Checks
      ✓ should create medium priority todo for missing business account
      ✓ should create low priority todo for low follower count (1 ms)
      ✓ should not create low follower todo for sufficient followers
    Industry-specific Checks
      Hospitality
        ✓ should create high priority todo for missing reservation system
        ✓ should create high priority todo for low ratings
        ✓ should not create rating todo for good ratings
      Retail
        ✓ should create high priority todo for missing online shop (1 ms)
    Satisfaction Logic
      ✓ should return fully satisfied when no high priority todos and score >= 80
      ✓ should return not satisfied when high priority todos exist (1 ms)
      ✓ should return not satisfied when score < 80
      ✓ should handle missing score gracefully
    Edge Cases
      ✓ should handle empty analysis object (1 ms)
      ✓ should handle null/undefined analysis fields
      ✓ should handle unknown industry gracefully (1 ms)
    Todo Structure
      ✓ should return todos with correct structure (5 ms)

PASS src/services/__tests__/aws-rds-client.test.ts
  AwsRdsClient
    Query Execution
      ✓ should execute SELECT query for profiles successfully (2 ms)
      ✓ should execute INSERT query for profiles successfully (1 ms)
      ✓ should execute UPDATE query for profiles successfully
      ✓ should handle queries with no results (1 ms)
      ✓ should handle non-profile queries
    Single Query Execution
      ✓ should execute queryOne and return single result (1 ms)
      ✓ should return null when no results found
    Transaction Management
      ✓ should execute transaction callback successfully (1 ms)
      ✓ should handle transaction callback errors (7 ms)
    Error Handling
      ✓ should handle localStorage errors gracefully (2 ms)
      ✓ should handle JSON parsing errors (1 ms)

PASS src/utils/__tests__/event-utils.test.ts
  Event Utils
    filterEventsByDateRange
      ✓ should filter events within date range (1 ms)
      ✓ should return empty array when no events in range (1 ms)
    filterEventsByType
      ✓ should filter events by single type
      ✓ should filter events by multiple types
    filterEventsByImpact
      ✓ should filter events by positive impact (1 ms)
      ✓ should filter events by multiple impacts
    sortEventsByDate
      ✓ should sort events by date descending (default) (1 ms)
      ✓ should sort events by date ascending
    groupEventsByType
      ✓ should group events by type (1 ms)
    getEventsNearDate
      ✓ should get events within 7 days of target date
      ✓ should get events within custom day range
    formatEventForTooltip
      ✓ should format event with all details
      ✓ should format event without description
    getEventStatistics
      ✓ should calculate event statistics (1 ms)
    isEventOnDate
      ✓ should return true for matching date
      ✓ should return false for non-matching date (1 ms)
    getLastEventBeforeDate
      ✓ should get the most recent event before date
      ✓ should return null when no events before date
    validateEvent
      ✓ should return no errors for valid event
      ✓ should return errors for missing required fields
      ✓ should return error for invalid date

FAIL src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts'

      18 | }));
      19 |
    > 20 | jest.mock('glob');
         |      ^
      21 |
      22 | const mockFs = fs as jest.Mocked<typeof fs>;
      23 | const mockGlob = glob as jest.MockedFunction<any>;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts:20:6)

FAIL src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/architecture-compliance-checker.ts'

    Require stack:
      src/lib/architecture-scanner/architecture-compliance-checker.ts
      src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts

       6 | import { promises as fs } from 'fs';
       7 | import path from 'path';
    >  8 | import glob from 'glob';
         | ^
       9 |
      10 | export interface ComplianceRule {
      11 |   id: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/architecture-compliance-checker.ts:8:1)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts:8:1)

FAIL src/services/__tests__/auth.test.ts
  ● Test suite failed to run

    TypeError: 'toString' called on an object that is not a valid instance of Location.

      30 | delete window.location;
      31 | // @ts-expect-error test shim
    > 32 | window.location = { 
         |                ^
      33 |   ...originalLocation, 
      34 |   href: 'http://localhost:3000', 
      35 |   hash: '', 

      at Object.toString (node_modules/jest-environment-jsdom/node_modules/jsdom/lib/jsdom/living/generated/Location.js:130:17)
          at String (<anonymous>)
          at Reflect.set (<anonymous>)
      at Object.<anonymous> (src/services/__tests__/auth.test.ts:32:16)

Summary of all failing tests
FAIL src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts
  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components as safe when they have Kiro alternatives

    expect(received).toContain(expected) // indexOf

    Expected substring: "Kiro alternative available"
    Received string:    "Legacy component with clear migration path"

      281 |       const component = plan.components[0];
      282 |       expect(component.safeToArchive).toBe(true);
    > 283 |       expect(component.archiveReason).toContain('Kiro alternative available');
          |                                       ^
      284 |       expect(component.riskLevel).toBe('low');
      285 |     });
      286 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:283:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark critical components as unsafe to archive

    expect(received).toContain(expected) // indexOf

    Expected substring: "Critical system component"
    Received string:    "Medium-risk component - review recommended"

      299 |       const component = plan.components[0];
      300 |       expect(component.safeToArchive).toBe(false);
    > 301 |       expect(component.archiveReason).toContain('Critical system component');
          |                                       ^
      302 |       expect(component.riskLevel).toBe('critical');
      303 |     });
      304 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:301:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components with active backend dependencies as unsafe

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      324 |
      325 |       const component = plan.components[0];
    > 326 |       expect(component.safeToArchive).toBe(false);
          |                                       ^
      327 |       expect(component.archiveReason).toContain('manual review');
      328 |       expect(component.riskLevel).toBe('medium');
      329 |     });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:326:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark unknown components without dependencies as safe

    expect(received).toContain(expected) // indexOf

    Expected substring: "Unknown origin component with no active dependencies"
    Received string:    "Safe component with positive archival indicators"

      350 |       const component = plan.components[0];
      351 |       expect(component.safeToArchive).toBe(true);
    > 352 |       expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
          |                                       ^
      353 |       expect(component.riskLevel).toBe('medium');
      354 |     });
      355 |   });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:352:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

FAIL src/services/__tests__/ProfileService.test.ts
  ● ProfileService › Business Profile Management › should create a new business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should retrieve business profile by ID

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should update existing business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should delete business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should handle profile not found

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate required fields on creation

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate email format

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should search profiles by business name

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by category

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by location

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should get profile completion percentage

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should identify missing profile fields

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should suggest profile improvements

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle database connection errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle SQL syntax errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle duplicate email errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Integration Tests › should complete full profile lifecycle

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

FAIL src/services/__tests__/vc.test.ts
  ● VC Service - Core Business Logic › startVisibilityCheck › should construct correct API request with all parameters

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle successful visibility check initiation

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle API errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid email format"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:69:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:59:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle different locales correctly

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should return null in production mode

    expect(received).toBeNull()

    Received: {"apiBase": "https://test-api.matbakh.app", "mode": "test", "provider": "aws"}

      124 |       const result = getVCEnvironmentInfo();
      125 |       
    > 126 |       expect(result).toBeNull();
          |                      ^
      127 |       
      128 |       // Restore
      129 |       if (originalEnv !== undefined) {

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:126:22)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should include correct environment variables

    expect(received).toBe(expected) // Object.is equality

    Expected: "development"
    Received: "test"

      140 |       if (result) {
      141 |         expect(result.apiBase).toBeDefined();
    > 142 |         expect(result.mode).toBe('development');
          |                             ^
      143 |       }
      144 |       
      145 |       // Restore

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:142:29)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle malformed API responses

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid JSON"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:162:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:153:60)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle rate limiting

    expect(received).rejects.toThrow(expected)

    Expected substring: "Rate limit exceeded"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:175:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:165:50)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle server errors

    expect(received).rejects.toThrow(expected)

    Expected substring: "Internal server error"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:188:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:178:50)

FAIL src/components/analytics/__tests__/EventAnnotations.test.tsx
  ● EventAnnotations Component › getScoreAtDate › should return exact score for matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: undefined

      57 |     it('should return exact score for matching date', () => {
      58 |       const score = getScoreAtDate(mockScoreData, '2025-01-01');
    > 59 |       expect(score).toBe(65.5);
         |                     ^
      60 |     });
      61 |
      62 |     it('should return closest score for non-matching date', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:59:21)

  ● EventAnnotations Component › getScoreAtDate › should return closest score for non-matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      62 |     it('should return closest score for non-matching date', () => {
      63 |       const score = getScoreAtDate(mockScoreData, '2025-01-04');
    > 64 |       expect(score).toBe(68.8); // Closest to 2025-01-03
         |                     ^
      65 |     });
      66 |
      67 |     it('should return default score for empty data', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:64:21)

  ● EventAnnotations Component › getScoreAtDate › should handle single data point

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: 50

      73 |       const singlePoint = [mockScoreData[0]];
      74 |       const score = getScoreAtDate(singlePoint, '2025-01-10');
    > 75 |       expect(score).toBe(65.5);
         |                     ^
      76 |     });
      77 |   });
      78 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:75:21)

  ● EventAnnotations Component › filterEvents › should filter events by date range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      91 |       
      92 |       const filtered = filterEvents(mockEvents, dateRange);
    > 93 |       expect(filtered).toHaveLength(2);
         |                        ^
      94 |       expect(filtered[0].id).toBe('event-1');
      95 |       expect(filtered[1].id).toBe('event-2');
      96 |     });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:93:24)

  ● EventAnnotations Component › filterEvents › should apply both date range and type filters

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

      113 |       
      114 |       const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
    > 115 |       expect(filtered).toHaveLength(1);
          |                        ^
      116 |       expect(filtered[0].id).toBe('event-1');
      117 |     });
      118 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:115:24)

  ● EventAnnotations Component › Event Positioning Logic › should calculate correct positions for events within data range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      140 |       });
      141 |       
    > 142 |       expect(eventsInRange).toHaveLength(2);
          |                             ^
      143 |       
      144 |       // Test score positioning
      145 |       const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:142:29)

  ● EventAnnotations Component › Event Positioning Logic › should handle events outside data range gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      155 |       
      156 |       // Should return closest available score (2025-01-03)
    > 157 |       expect(score).toBe(68.8);
          |                     ^
      158 |     });
      159 |   });
      160 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:157:21)

  ● EventAnnotations Component › Performance Considerations › should handle large number of events efficiently

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      204 |       const endTime = performance.now();
      205 |       
    > 206 |       expect(filtered.length).toBeGreaterThan(0);
          |                               ^
      207 |       expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      208 |     });
      209 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:206:31)

  ● EventAnnotations Component › Performance Considerations › should handle large score dataset efficiently

    expect(received).toBe(expected) // Object.is equality

    Expected: "number"
    Received: "undefined"

      220 |       const endTime = performance.now();
      221 |       
    > 222 |       expect(typeof score).toBe('number');
          |                            ^
      223 |       expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
      224 |     });
      225 |   });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:222:28)

FAIL src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts
  ● SafeArchivalSystem › executeArchival › should execute complete archival process with default options

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should create symlinks when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should run validation checks when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should generate rollback script when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should process components in batches

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should handle validation failure and rollback

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:188:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:176:68)

  ● SafeArchivalSystem › dependency resolution › should resolve component dependencies correctly

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › dependency resolution › should detect unresolved dependencies

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should create route redirectors for legacy routes

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should generate redirect configuration file

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should generate comprehensive archive manifest

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should include component checksums for integrity verification

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should preserve original file metadata

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should create executable rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include component restoration commands in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include validation checks in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should run all required validation checks

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should save validation results

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should handle optional validation check failures gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      361 |
      362 |       // Should not throw for optional check failure
    > 363 |       await expect(
          |             ^
      364 |         SafeArchivalSystem.executeArchival(mockArchivalPlan)
      365 |       ).resolves.toBeDefined();
      366 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:363:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:354:82)

  ● SafeArchivalSystem › error handling › should handle validation command failures

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:500:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:493:64)

  ● SafeArchivalSystem › git history preservation › should preserve git history when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › git history preservation › should handle git history errors gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      529 |
      530 |       // Should not throw for git history errors
    > 531 |       await expect(
          |             ^
      532 |         SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      533 |       ).resolves.toBeDefined();
      534 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:531:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:518:66)

FAIL src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts'

      18 | }));
      19 |
    > 20 | jest.mock('glob');
         |      ^
      21 |
      22 | const mockFs = fs as jest.Mocked<typeof fs>;
      23 | const mockGlob = glob as jest.MockedFunction<any>;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts:20:6)

FAIL src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/architecture-compliance-checker.ts'

    Require stack:
      src/lib/architecture-scanner/architecture-compliance-checker.ts
      src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts

       6 | import { promises as fs } from 'fs';
       7 | import path from 'path';
    >  8 | import glob from 'glob';
         | ^
       9 |
      10 | export interface ComplianceRule {
      11 |   id: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/architecture-compliance-checker.ts:8:1)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts:8:1)

FAIL src/services/__tests__/auth.test.ts
  ● Test suite failed to run

    TypeError: 'toString' called on an object that is not a valid instance of Location.

      30 | delete window.location;
      31 | // @ts-expect-error test shim
    > 32 | window.location = { 
         |                ^
      33 |   ...originalLocation, 
      34 |   href: 'http://localhost:3000', 
      35 |   hash: '', 

      at Object.toString (node_modules/jest-environment-jsdom/node_modules/jsdom/lib/jsdom/living/generated/Location.js:130:17)
          at String (<anonymous>)
          at Reflect.set (<anonymous>)
      at Object.<anonymous> (src/services/__tests__/auth.test.ts:32:16)


Test Suites: 8 failed, 16 passed, 24 total
Tests:       61 failed, 295 passed, 356 total
Snapshots:   0 total
Time:        8.329 s, estimated 48 s
Ran all test suites with tests matching "should".



### Rollback Procedures
- Duration: 0.00s
- Tests: 3 (3 passed, 0 failed, 0 skipped)


#### Archive Rollback ✅
- Status: PASS
- Duration: 0.00s
- Details: Rollback script is available and executable


#### Component Restoration ✅
- Status: PASS
- Duration: 0.00s
- Details: Component restoration script is available


#### Branch Protection Rollback ✅
- Status: PASS
- Duration: 0.00s
- Details: Branch protection scripts are available




## Recommendations


### Critical Issues
- **Jest Test Suite**: Command failed: npm test -- --passWithNoTests --testPathIgnorePatterns="archive" --verbose
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
FAIL test/unit/sync-gmb.test.ts
  ● Test suite failed to run

    Cannot find module 'https://deno.land/std@0.178.0/testing/asserts.ts' from 'test/unit/sync-gmb.test.ts'

      1 |
    > 2 | import { assertEquals, assertExists } from 'https://deno.land/std@0.178.0/testing/asserts.ts';
        | ^
      3 |
      4 | // Simple response validation test
      5 | Deno.test('sync-gmb response structure', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/sync-gmb.test.ts:2:1)

FAIL test/unit/sync-ga4.test.ts
  ● Test suite failed to run

    Cannot find module 'https://deno.land/std@0.178.0/testing/asserts.ts' from 'test/unit/sync-ga4.test.ts'

      1 |
    > 2 | import { assertEquals, assertExists } from 'https://deno.land/std@0.178.0/testing/asserts.ts';
        | ^
      3 |
      4 | // Simple response validation test
      5 | Deno.test('sync-ga4 response structure', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/sync-ga4.test.ts:2:1)

FAIL test/smoke/routes.spec.ts
  ● Test suite failed to run

    Cannot find module '@playwright/test' from 'test/smoke/routes.spec.ts'

      1 |
    > 2 | import { test, expect } from '@playwright/test';
        | ^
      3 |
      4 | const routes = [
      5 |   '/',

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/smoke/routes.spec.ts:2:1)

FAIL src/components/analytics/__tests__/EventAnnotations.test.tsx
  EventAnnotations Component
    getScoreAtDate
      ✕ should return exact score for matching date (46 ms)
      ✕ should return closest score for non-matching date (2 ms)
      ✓ should return default score for empty data (4 ms)
      ✕ should handle single data point (2 ms)
    filterEvents
      ✓ should return all events when no filters applied (1 ms)
      ✕ should filter events by date range (1 ms)
      ✓ should filter events by visible types (1 ms)
      ✕ should apply both date range and type filters (1 ms)
      ✓ should return empty array when no events match filters (1 ms)
      ✓ should handle empty visible types array (1 ms)
    Event Positioning Logic
      ✕ should calculate correct positions for events within data range (1 ms)
      ✕ should handle events outside data range gracefully (1 ms)
    Event Type Validation
      ✓ should validate all event types are supported (1 ms)
      ✓ should handle events with different impact types
    Performance Considerations
      ✕ should handle large number of events efficiently (1 ms)
      ✕ should handle large score dataset efficiently (16 ms)
    Edge Cases
      ✓ should handle events with missing optional fields (1 ms)
      ✓ should handle invalid date formats gracefully
      ✓ should handle empty arrays (1 ms)

  ● EventAnnotations Component › getScoreAtDate › should return exact score for matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: undefined

      57 |     it('should return exact score for matching date', () => {
      58 |       const score = getScoreAtDate(mockScoreData, '2025-01-01');
    > 59 |       expect(score).toBe(65.5);
         |                     ^
      60 |     });
      61 |
      62 |     it('should return closest score for non-matching date', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:59:21)

  ● EventAnnotations Component › getScoreAtDate › should return closest score for non-matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      62 |     it('should return closest score for non-matching date', () => {
      63 |       const score = getScoreAtDate(mockScoreData, '2025-01-04');
    > 64 |       expect(score).toBe(68.8); // Closest to 2025-01-03
         |                     ^
      65 |     });
      66 |
      67 |     it('should return default score for empty data', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:64:21)

  ● EventAnnotations Component › getScoreAtDate › should handle single data point

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: 50

      73 |       const singlePoint = [mockScoreData[0]];
      74 |       const score = getScoreAtDate(singlePoint, '2025-01-10');
    > 75 |       expect(score).toBe(65.5);
         |                     ^
      76 |     });
      77 |   });
      78 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:75:21)

  ● EventAnnotations Component › filterEvents › should filter events by date range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      91 |       
      92 |       const filtered = filterEvents(mockEvents, dateRange);
    > 93 |       expect(filtered).toHaveLength(2);
         |                        ^
      94 |       expect(filtered[0].id).toBe('event-1');
      95 |       expect(filtered[1].id).toBe('event-2');
      96 |     });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:93:24)

  ● EventAnnotations Component › filterEvents › should apply both date range and type filters

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

      113 |       
      114 |       const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
    > 115 |       expect(filtered).toHaveLength(1);
          |                        ^
      116 |       expect(filtered[0].id).toBe('event-1');
      117 |     });
      118 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:115:24)

  ● EventAnnotations Component › Event Positioning Logic › should calculate correct positions for events within data range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      140 |       });
      141 |       
    > 142 |       expect(eventsInRange).toHaveLength(2);
          |                             ^
      143 |       
      144 |       // Test score positioning
      145 |       const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:142:29)

  ● EventAnnotations Component › Event Positioning Logic › should handle events outside data range gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      155 |       
      156 |       // Should return closest available score (2025-01-03)
    > 157 |       expect(score).toBe(68.8);
          |                     ^
      158 |     });
      159 |   });
      160 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:157:21)

  ● EventAnnotations Component › Performance Considerations › should handle large number of events efficiently

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      204 |       const endTime = performance.now();
      205 |       
    > 206 |       expect(filtered.length).toBeGreaterThan(0);
          |                               ^
      207 |       expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      208 |     });
      209 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:206:31)

  ● EventAnnotations Component › Performance Considerations › should handle large score dataset efficiently

    expect(received).toBe(expected) // Object.is equality

    Expected: "number"
    Received: "undefined"

      220 |       const endTime = performance.now();
      221 |       
    > 222 |       expect(typeof score).toBe('number');
          |                            ^
      223 |       expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
      224 |     });
      225 |   });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:222:28)

FAIL src/services/__tests__/vc.test.ts
  VC Service - Core Business Logic
    startVisibilityCheck
      ✕ should construct correct API request with all parameters (35 ms)
      ✕ should handle successful visibility check initiation (1 ms)
      ✕ should handle API errors gracefully (59 ms)
      ✓ should handle network errors (8 ms)
      ✓ should validate required parameters (1 ms)
      ✕ should handle different locales correctly
    getVCEnvironmentInfo
      ✓ should return environment info in development mode (1 ms)
      ✕ should return null in production mode (2 ms)
      ✕ should include correct environment variables (5 ms)
    Error Handling & Edge Cases
      ✕ should handle malformed API responses (3 ms)
      ✕ should handle rate limiting (2 ms)
      ✕ should handle server errors (1 ms)

  ● VC Service - Core Business Logic › startVisibilityCheck › should construct correct API request with all parameters

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle successful visibility check initiation

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle API errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid email format"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:69:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:59:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle different locales correctly

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should return null in production mode

    expect(received).toBeNull()

    Received: {"apiBase": "https://test-api.matbakh.app", "mode": "test", "provider": "aws"}

      124 |       const result = getVCEnvironmentInfo();
      125 |       
    > 126 |       expect(result).toBeNull();
          |                      ^
      127 |       
      128 |       // Restore
      129 |       if (originalEnv !== undefined) {

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:126:22)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should include correct environment variables

    expect(received).toBe(expected) // Object.is equality

    Expected: "development"
    Received: "test"

      140 |       if (result) {
      141 |         expect(result.apiBase).toBeDefined();
    > 142 |         expect(result.mode).toBe('development');
          |                             ^
      143 |       }
      144 |       
      145 |       // Restore

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:142:29)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle malformed API responses

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid JSON"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:162:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:153:60)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle rate limiting

    expect(received).rejects.toThrow(expected)

    Expected substring: "Rate limit exceeded"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:175:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:165:50)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle server errors

    expect(received).rejects.toThrow(expected)

    Expected substring: "Internal server error"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:188:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:178:50)

PASS src/lib/architecture-scanner/__tests__/enhanced-risk-assessor.test.ts
  EnhancedRiskAssessor
    assessRisk
      ✓ should classify critical system components as critical risk (12 ms)
      ✓ should classify components with migration paths as lower risk (1 ms)
      ✓ should classify components with Kiro alternatives as lower risk (5 ms)
      ✓ should classify debug/test components as safe (2 ms)
      ✓ should classify recently modified components as higher risk (1 ms)
      ✓ should classify old components as safer to archive (1 ms)
      ✓ should classify high complexity components with higher risk (1 ms)
      ✓ should never classify Kiro components as safe to archive (1 ms)
      ✓ should provide mitigation suggestions based on risk factors (1 ms)
    batchAssessRisk
      ✓ should assess multiple components in batch (12 ms)
    generateRiskReport
      ✓ should generate comprehensive risk report (3 ms)
      ✓ should count risk factors correctly (2 ms)
    risk factor assessment
      ✓ should detect development routes as low risk (13 ms)
      ✓ should handle file stat errors gracefully (1 ms)
      ✓ should provide confidence scores (1 ms)
    edge cases
      ✓ should handle components with no risk factors (1 ms)
      ✓ should handle components with mixed risk factors (1 ms)

PASS src/components/analytics/__tests__/TrendFilters.test.tsx
  TrendFilters Component
    Props Validation
      ✓ should validate TrendFilters interface structure (20 ms)
      ✓ should handle optional businessUnit property (1 ms)
      ✓ should validate BusinessUnit interface (2 ms)
    Score Type Handling
      ✓ should validate all score types (10 ms)
      ✓ should handle score type changes (2 ms)
    Date Range Handling
      ✓ should validate date range presets (1 ms)
      ✓ should generate correct date ranges for presets (1 ms)
      ✓ should handle custom date range changes (1 ms)
      ✓ should validate date range logic
    Business Unit Handling
      ✓ should validate mock business units structure (6 ms)
      ✓ should handle business unit selection
      ✓ should handle "all units" selection (1 ms)
    Filter State Management
      ✓ should maintain filter state consistency (1 ms)
      ✓ should handle partial filter updates (1 ms)
    Date Formatting
      ✓ should format dates correctly for input fields
      ✓ should format dates correctly for German locale display (180 ms)
    Integration Scenarios
      ✓ should handle complete filter workflow (6 ms)

FAIL src/services/__tests__/ProfileService.test.ts
  ProfileService
    Business Profile Management
      ✕ should create a new business profile (9 ms)
      ✕ should retrieve business profile by ID
      ✕ should update existing business profile
      ✕ should delete business profile (15 ms)
      ✕ should handle profile not found
      ✕ should validate required fields on creation
      ✕ should validate email format
    Profile Search and Filtering
      ✕ should search profiles by business name (1 ms)
      ✕ should filter profiles by category (1 ms)
      ✕ should filter profiles by location (1 ms)
    Profile Analytics
      ✕ should get profile completion percentage (1 ms)
      ✕ should identify missing profile fields
      ✕ should suggest profile improvements
    Error Handling
      ✕ should handle database connection errors
      ✕ should handle SQL syntax errors (1 ms)
      ✕ should handle duplicate email errors (1 ms)
    Integration Tests
      ✕ should complete full profile lifecycle

  ● ProfileService › Business Profile Management › should create a new business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should retrieve business profile by ID

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should update existing business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should delete business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should handle profile not found

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate required fields on creation

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate email format

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should search profiles by business name

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by category

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by location

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should get profile completion percentage

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should identify missing profile fields

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should suggest profile improvements

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle database connection errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle SQL syntax errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle duplicate email errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Integration Tests › should complete full profile lifecycle

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

PASS src/data/recommendations/__tests__/recommendations.test.ts
  Goal-Specific Recommendations
    getRecommendationsByGoal
      ✓ should return recommendations for a valid goal (11 ms)
      ✓ should return empty array for invalid goal (1 ms)
    getGoalProfile
      ✓ should return complete goal profile with recommendations (4 ms)
    getAllGoalProfiles
      ✓ should return all goal profiles (15 ms)
    getRecommendationsSorted
      ✓ should sort recommendations by impact score (1 ms)
      ✓ should sort recommendations by effort score (1 ms)
      ✓ should sort recommendations by combined score (1 ms)
    getQuickWins
      ✓ should return only high impact, low effort recommendations (1 ms)
    getStrategicInitiatives
      ✓ should return only high impact, high effort recommendations
    calculateGoalMetrics
      ✓ should calculate correct metrics for a goal (6 ms)
    Recommendation Data Quality
      ✓ should have valid data for all goals (99 ms)

PASS src/services/__tests__/forecasting-engine.test.ts
  ForecastingEngine
    generateForecast
      ✓ should generate forecast with valid data (11 ms)
      ✓ should throw error with insufficient data (64 ms)
      ✓ should generate different forecasts for different ranges (8 ms)
      ✓ should detect upward trend correctly (1 ms)
      ✓ should detect downward trend correctly (2 ms)
      ✓ should detect stable trend correctly (1 ms)
      ✓ should generate forecast points with confidence intervals (24 ms)
      ✓ should have increasing uncertainty over time (1 ms)
    detectTrendChanges
      ✓ should detect trend changes in data (5 ms)
      ✓ should return empty array for insufficient data (3 ms)
      ✓ should detect acceleration and deceleration (3 ms)
    getForecastSummary
      ✓ should generate comprehensive forecast summary (1 ms)
      ✓ should provide appropriate trend descriptions (2 ms)
      ✓ should provide confidence descriptions (1 ms)
      ✓ should generate insights based on forecast data (1 ms)
      ✓ should generate appropriate recommendations (1 ms)
    Edge Cases
      ✓ should handle data with missing values gracefully (6 ms)
      ✓ should handle extreme values correctly (3 ms)
      ✓ should handle identical values (1 ms)
      ✓ should handle very large datasets efficiently (14 ms)
    Statistical Accuracy
      ✓ should have reasonable R-squared for linear data (1 ms)
      ✓ should have lower R-squared for noisy data (1 ms)
      ✓ should have confidence that correlates with data quality (1 ms)

PASS src/components/analytics/__tests__/TrendChart.test.tsx
  TrendChart Component
    ✓ should validate props structure (11 ms)
    ✓ should handle different score types (4 ms)
    ✓ should validate mock data structure (9 ms)
    ✓ should validate event data structure (2 ms)
  TrendChart Data Validation
    ✓ should validate score values are within range (10 ms)
    ✓ should validate date format (16 ms)
    ✓ should validate business_id format (22 ms)

PASS src/lib/recommendation/__tests__/recommendationTrigger.test.ts
  RecommendationTrigger
    evaluateScoreTrend
      ✓ should not trigger for insufficient data (35 ms)
      ✓ should not trigger for stable scores (5 ms)
      ✓ should trigger drop for significant score decrease (3 ms)
      ✓ should trigger stagnation for unchanging scores (3 ms)
      ✓ should not trigger for improving scores (16 ms)
      ✓ should handle volatile scores appropriately (2 ms)
      ✓ should respect custom thresholds (2 ms)
      ✓ should provide appropriate metadata (2 ms)
      ✓ should not trigger for slight improvements (2 ms)
      ✓ should trigger drop for exactly threshold change (5 ms)
    evaluateScoreTrendWithContext
      ✓ should use contextual thresholds for different score types (2 ms)
      ✓ should adjust actions based on score type (2 ms)
      ✓ should handle industry-specific contexts (2 ms)
    Edge Cases and Error Handling
      ✓ should handle empty score arrays gracefully (2 ms)
      ✓ should handle invalid threshold configurations (146 ms)

PASS src/lib/forecast/__tests__/forecastEngine.test.ts
  ForecastEngine
    generateForecast
      ✓ should return flat trend for constant scores (18 ms)
      ✓ should return up trend for linearly increasing scores (32 ms)
      ✓ should return down trend for linearly decreasing scores (3 ms)
      ✓ should return empty array for insufficient data (131 ms)
      ✓ should handle high variance with wider confidence intervals (2 ms)
      ✓ should handle badly formatted data gracefully (15 ms)
      ✓ should generate correct number of forecast points for different ranges (3 ms)
      ✓ should have valid forecast point structure (18 ms)
      ✓ should have increasing uncertainty over time (1 ms)
    analyzeTrend
      ✓ should correctly identify flat trend (1 ms)
      ✓ should correctly identify upward trend (1 ms)
      ✓ should correctly identify downward trend (2 ms)
      ✓ should handle empty data (4 ms)
    assessDataQuality
      ✓ should assess good quality for clean data (4 ms)
      ✓ should identify issues with insufficient data (1 ms)
      ✓ should identify high volatility (1 ms)
    generateComprehensiveForecast
      ✓ should generate complete forecast result (4 ms)
    Edge Cases
      ✓ should handle single data point (20 ms)
      ✓ should handle identical dates (7 ms)
      ✓ should handle extreme values (16 ms)
      ✓ should handle unsorted data (1 ms)
    Performance
      ✓ should handle large datasets efficiently (14 ms)

FAIL src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts
  LegacyComponentDetector
    scanLegacyComponents
      ✓ should identify legacy components correctly (177 ms)
      ✓ should create proper backup plan (16 ms)
    Backend Dependency Analysis
      ✓ should detect Supabase backend dependencies (7 ms)
      ✓ should detect Lovable backend dependencies (9 ms)
      ✓ should provide migration paths for dependencies (6 ms)
    Route Usage Analysis
      ✓ should detect route usage in page components (21 ms)
      ✓ should identify Kiro alternatives for legacy routes (9 ms)
    Safe-to-Archive Classification
      ✕ should mark components as safe when they have Kiro alternatives (9 ms)
      ✕ should mark critical components as unsafe to archive (5 ms)
      ✕ should mark components with active backend dependencies as unsafe (6 ms)
      ✕ should mark unknown components without dependencies as safe (7 ms)
    Archive Manifest Generation
      ✓ should generate comprehensive archive manifest (34 ms)
    Error Handling
      ✓ should handle file read errors gracefully (14 ms)
      ✓ should handle malformed file content (4 ms)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components as safe when they have Kiro alternatives

    expect(received).toContain(expected) // indexOf

    Expected substring: "Kiro alternative available"
    Received string:    "Legacy component with clear migration path"

      281 |       const component = plan.components[0];
      282 |       expect(component.safeToArchive).toBe(true);
    > 283 |       expect(component.archiveReason).toContain('Kiro alternative available');
          |                                       ^
      284 |       expect(component.riskLevel).toBe('low');
      285 |     });
      286 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:283:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark critical components as unsafe to archive

    expect(received).toContain(expected) // indexOf

    Expected substring: "Critical system component"
    Received string:    "Medium-risk component - review recommended"

      299 |       const component = plan.components[0];
      300 |       expect(component.safeToArchive).toBe(false);
    > 301 |       expect(component.archiveReason).toContain('Critical system component');
          |                                       ^
      302 |       expect(component.riskLevel).toBe('critical');
      303 |     });
      304 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:301:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components with active backend dependencies as unsafe

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      324 |
      325 |       const component = plan.components[0];
    > 326 |       expect(component.safeToArchive).toBe(false);
          |                                       ^
      327 |       expect(component.archiveReason).toContain('manual review');
      328 |       expect(component.riskLevel).toBe('medium');
      329 |     });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:326:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark unknown components without dependencies as safe

    expect(received).toContain(expected) // indexOf

    Expected substring: "Unknown origin component with no active dependencies"
    Received string:    "Safe component with positive archival indicators"

      350 |       const component = plan.components[0];
      351 |       expect(component.safeToArchive).toBe(true);
    > 352 |       expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
          |                                       ^
      353 |       expect(component.riskLevel).toBe('medium');
      354 |     });
      355 |   });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:352:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

PASS src/utils/__tests__/event-utils.test.ts
  Event Utils
    filterEventsByDateRange
      ✓ should filter events within date range (5 ms)
      ✓ should return empty array when no events in range (1 ms)
    filterEventsByType
      ✓ should filter events by single type (1 ms)
      ✓ should filter events by multiple types
    filterEventsByImpact
      ✓ should filter events by positive impact (15 ms)
      ✓ should filter events by multiple impacts (2 ms)
    sortEventsByDate
      ✓ should sort events by date descending (default) (2 ms)
      ✓ should sort events by date ascending (1 ms)
    groupEventsByType
      ✓ should group events by type (1 ms)
    getEventsNearDate
      ✓ should get events within 7 days of target date (10 ms)
      ✓ should get events within custom day range
    formatEventForTooltip
      ✓ should format event with all details
      ✓ should format event without description
    getEventStatistics
      ✓ should calculate event statistics (1 ms)
    isEventOnDate
      ✓ should return true for matching date (1 ms)
      ✓ should return false for non-matching date (1 ms)
    getLastEventBeforeDate
      ✓ should get the most recent event before date
      ✓ should return null when no events before date
    validateEvent
      ✓ should return no errors for valid event
      ✓ should return errors for missing required fields
      ✓ should return error for invalid date

PASS src/services/__tests__/aws-rds-client.test.ts
  AwsRdsClient
    Query Execution
      ✓ should execute SELECT query for profiles successfully (3 ms)
      ✓ should execute INSERT query for profiles successfully (2 ms)
      ✓ should execute UPDATE query for profiles successfully (1 ms)
      ✓ should handle queries with no results (1 ms)
      ✓ should handle non-profile queries (1 ms)
    Single Query Execution
      ✓ should execute queryOne and return single result (1 ms)
      ✓ should return null when no results found
    Transaction Management
      ✓ should execute transaction callback successfully (1 ms)
      ✓ should handle transaction callback errors (18 ms)
    Error Handling
      ✓ should handle localStorage errors gracefully (2 ms)
      ✓ should handle JSON parsing errors (6 ms)

PASS src/lib/__tests__/todoGenerator.test.ts
  generateTodos
    Google My Business Checks
      ✓ should create high priority todo for missing photos (3 ms)
      ✓ should create high priority todo for missing hours (1 ms)
      ✓ should create medium priority todo for incomplete profile
    Meta/Facebook Checks
      ✓ should create medium priority todo for disabled messenger
      ✓ should create medium priority todo for missing photos (1 ms)
    Instagram Checks
      ✓ should create medium priority todo for missing business account (1 ms)
      ✓ should create low priority todo for low follower count
      ✓ should not create low follower todo for sufficient followers (2 ms)
    Industry-specific Checks
      Hospitality
        ✓ should create high priority todo for missing reservation system (1 ms)
        ✓ should create high priority todo for low ratings
        ✓ should not create rating todo for good ratings (1 ms)
      Retail
        ✓ should create high priority todo for missing online shop
    Satisfaction Logic
      ✓ should return fully satisfied when no high priority todos and score >= 80 (1 ms)
      ✓ should return not satisfied when high priority todos exist (1 ms)
      ✓ should return not satisfied when score < 80
      ✓ should handle missing score gracefully (1 ms)
    Edge Cases
      ✓ should handle empty analysis object
      ✓ should handle null/undefined analysis fields (1 ms)
      ✓ should handle unknown industry gracefully (1 ms)
    Todo Structure
      ✓ should return todos with correct structure (15 ms)

FAIL src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts'

      18 | }));
      19 |
    > 20 | jest.mock('glob');
         |      ^
      21 |
      22 | const mockFs = fs as jest.Mocked<typeof fs>;
      23 | const mockGlob = glob as jest.MockedFunction<any>;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts:20:6)

FAIL src/services/__tests__/auth.test.ts
  ● Test suite failed to run

    TypeError: 'toString' called on an object that is not a valid instance of Location.

      30 | delete window.location;
      31 | // @ts-expect-error test shim
    > 32 | window.location = { 
         |                ^
      33 |   ...originalLocation, 
      34 |   href: 'http://localhost:3000', 
      35 |   hash: '', 

      at Object.toString (node_modules/jest-environment-jsdom/node_modules/jsdom/lib/jsdom/living/generated/Location.js:130:17)
          at String (<anonymous>)
          at Reflect.set (<anonymous>)
      at Object.<anonymous> (src/services/__tests__/auth.test.ts:32:16)

PASS src/services/__tests__/benchmark-comparison.test.ts
  BenchmarkComparisonService
    getIndustryBenchmarks
      ✓ should fetch benchmark data successfully (3 ms)
      ✓ should return null when benchmark not found (1 ms)
    compareToBenchmark
      ✓ should calculate comparison for score above 75th percentile (2 ms)
      ✓ should calculate comparison for score below 25th percentile (2 ms)
      ✓ should calculate comparison for average score (1 ms)
      ✓ should fallback to national benchmark when regional not available (1 ms)
    getMultiRegionBenchmarks
      ✓ should fetch benchmarks for multiple regions (1 ms)
      ✓ should handle empty results gracefully (1 ms)
    updateBenchmark
      ✓ should update benchmark data successfully (2 ms)
      ✓ should handle update errors gracefully (74 ms)
    calculateComparison (private method testing via public interface)
      ✓ should generate appropriate recommendations for each performance category (13 ms)
      ✓ should calculate improvement potential correctly (1 ms)
      ✓ should generate position descriptions correctly (1 ms)

PASS src/services/__tests__/score-history.test.ts
  ScoreHistoryService
    insertScore
      ✓ should insert a new score record (16 ms)
      ✓ should validate score_type enum values (1 ms)
      ✓ should validate source enum values (1 ms)
    insertScores (bulk)
      ✓ should insert multiple score records (1 ms)
    queryScoreHistory
      ✓ should query score history with filters (2 ms)
      ✓ should handle multiple score types in query (1 ms)
      ✓ should handle date range filters (3 ms)
    getScoreEvolution
      ✓ should calculate score evolution data (1 ms)
      ✓ should handle empty data gracefully (1 ms)
      ✓ should calculate trend correctly (1 ms)
    getBusinessAnalytics
      ✓ should generate comprehensive business analytics (2 ms)
    updateScore
      ✓ should update a score record (1 ms)
      ✓ should handle no fields to update (36 ms)
    deleteScore
      ✓ should delete a score record (1 ms)
      ✓ should handle record not found (1 ms)
    getLatestScores
      ✓ should get latest scores for all score types (3 ms)
  Score History Database Schema
    ✓ should validate table structure requirements (2 ms)
    ✓ should validate score_value constraints (1 ms)
    ✓ should validate foreign key relationship (1 ms)
    ✓ should validate index requirements

FAIL src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/architecture-compliance-checker.ts'

    Require stack:
      src/lib/architecture-scanner/architecture-compliance-checker.ts
      src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts

       6 | import { promises as fs } from 'fs';
       7 | import path from 'path';
    >  8 | import glob from 'glob';
         | ^
       9 |
      10 | export interface ComplianceRule {
      11 |   id: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/architecture-compliance-checker.ts:8:1)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts:8:1)

PASS src/lib/architecture-scanner/__tests__/test-selection-engine.test.ts
  TestSelectionEngine
    loadCoverageMap
      ✓ should load and parse test coverage map successfully (105 ms)
      ✓ should handle file read errors gracefully (36 ms)
      ✓ should handle invalid JSON gracefully (4 ms)
    detectInterfaceMismatches
      ✓ should detect interface mismatches correctly (16 ms)
      ✓ should provide appropriate suggested fixes (23 ms)
      ✓ should throw error if coverage map not loaded (5 ms)
    createKiroComponentFilter
      ✓ should classify components by origin correctly (8 ms)
      ✓ should handle file read errors during origin detection (7 ms)
    generateSafeTestSuite
      ✓ should generate safe test suite with correct categorization (9 ms)
      ✓ should exclude broken tests and interface mismatches (7 ms)
      ✓ should include excellent and good tests in validated list (8 ms)
      ✓ should create proper execution plan phases (10 ms)
      ✓ should include interface mismatches in results (14 ms)
    generateSafeTestReport
      ✓ should generate comprehensive test report (10 ms)
      ✓ should include correct statistics in report (6 ms)
      ✓ should list interface mismatches with details (8 ms)
    exportSafeTestSuite
      ✓ should export safe test suite to JSON file (9 ms)
      ✓ should handle export errors gracefully (9 ms)
    getTestExecutionCommand
      ✓ should generate correct test execution command (2 ms)
      ✓ should throw error if coverage map not loaded (2 ms)
  runTestSelection utility function
    ✓ should run complete test selection workflow (7 ms)
    ✓ should work without output directory (7 ms)

FAIL src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts
  SafeArchivalSystem
    executeArchival
      ✕ should execute complete archival process with default options (73 ms)
      ✕ should create symlinks when option is enabled (15 ms)
      ✕ should run validation checks when enabled (10 ms)
      ✕ should generate rollback script when enabled (10 ms)
      ✕ should process components in batches (15 ms)
      ✕ should handle validation failure and rollback (17 ms)
    dependency resolution
      ✕ should resolve component dependencies correctly (13 ms)
      ✕ should detect unresolved dependencies (19 ms)
    route redirectors
      ✕ should create route redirectors for legacy routes (14 ms)
      ✕ should generate redirect configuration file (10 ms)
    archive manifest
      ✕ should generate comprehensive archive manifest (10 ms)
      ✕ should include component checksums for integrity verification (8 ms)
      ✕ should preserve original file metadata (17 ms)
    rollback mechanism
      ✕ should create executable rollback script (19 ms)
      ✕ should include component restoration commands in rollback script (9 ms)
      ✕ should include validation checks in rollback script (8 ms)
    validation checks
      ✕ should run all required validation checks (8 ms)
      ✕ should save validation results (7 ms)
      ✕ should handle optional validation check failures gracefully (8 ms)
    component restoration
      ✓ should restore individual components from archive (3 ms)
      ✓ should handle component not found in archive (3 ms)
    archive listing
      ✓ should list all archived components (1 ms)
      ✓ should handle missing archive directory (2 ms)
    error handling
      ✓ should handle file system errors gracefully (4 ms)
      ✓ should handle component archival failures (7 ms)
      ✕ should handle validation command failures (10 ms)
    git history preservation
      ✕ should preserve git history when option is enabled (8 ms)
      ✕ should handle git history errors gracefully (9 ms)

  ● SafeArchivalSystem › executeArchival › should execute complete archival process with default options

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should create symlinks when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should run validation checks when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should generate rollback script when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should process components in batches

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should handle validation failure and rollback

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:188:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:176:68)

  ● SafeArchivalSystem › dependency resolution › should resolve component dependencies correctly

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › dependency resolution › should detect unresolved dependencies

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should create route redirectors for legacy routes

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should generate redirect configuration file

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should generate comprehensive archive manifest

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should include component checksums for integrity verification

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should preserve original file metadata

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should create executable rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include component restoration commands in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include validation checks in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should run all required validation checks

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should save validation results

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should handle optional validation check failures gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      361 |
      362 |       // Should not throw for optional check failure
    > 363 |       await expect(
          |             ^
      364 |         SafeArchivalSystem.executeArchival(mockArchivalPlan)
      365 |       ).resolves.toBeDefined();
      366 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:363:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:354:82)

  ● SafeArchivalSystem › error handling › should handle validation command failures

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:500:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:493:64)

  ● SafeArchivalSystem › git history preservation › should preserve git history when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › git history preservation › should handle git history errors gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      529 |
      530 |       // Should not throw for git history errors
    > 531 |       await expect(
          |             ^
      532 |         SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      533 |       ).resolves.toBeDefined();
      534 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:531:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:518:66)

PASS src/__tests__/performance/s3-performance.test.ts
  S3 Performance Tests
    Batch URL Generation Performance
      ✓ should handle batch requests efficiently (29 ms)
      ✓ should cache URLs for repeated requests (6 ms)
    Memory Usage
      ✓ should clean up expired URLs to prevent memory leaks (466 ms)

PASS src/lib/architecture-scanner/__tests__/targeted-test-executor.test.ts
  TargetedTestExecutor
    constructor
      ✓ should initialize with default options (13 ms)
      ✓ should initialize with custom options (1 ms)
    initializeTestRunner
      ✓ should initialize test runner with safe test suite (82 ms)
      ✓ should use default coverage map path if not provided (6 ms)
      ✓ should handle initialization errors gracefully (48 ms)
    executeTestSuite
      ✓ should execute all phases of test suite (97 ms)
      ✓ should handle empty phases gracefully (6 ms)
      ✓ should stop execution on fail-fast mode (22 ms)
    dry run mode
      ✓ should simulate test execution in dry run mode (14 ms)
    failure classification
      ✓ should classify interface mismatch failures as expected (23 ms)
      ✓ should classify timeout failures as infrastructure (48 ms)
      ✓ should classify dependency errors as infrastructure (58 ms)
      ✓ should classify assertion errors as unexpected (47 ms)
    report generation
      ✓ should generate comprehensive test report (46 ms)
      ✓ should save report files to disk (45 ms)
      ✓ should handle file write errors gracefully (46 ms)
      ✓ should generate appropriate recommendations (47 ms)
    confidence level adjustment
      ✓ should adjust confidence level based on execution results (45 ms)
      ✓ should lower confidence for unexpected failures (45 ms)
    concurrency control
      ✓ should respect max concurrency setting (220 ms)
  runTargetedTestExecution utility function
    ✓ should run complete targeted test execution workflow (49 ms)
    ✓ should work with default parameters (48 ms)
    ✓ should handle execution errors gracefully (2 ms)
  FailureClassification
    ✓ should create proper failure classification structure (1 ms)
  TestExecutionResult
    ✓ should create proper test execution result structure (1 ms)

PASS src/services/__tests__/persona-api.test.ts
  PersonaApiService
    Singleton Pattern
      ✓ should return the same instance (10 ms)
    Persona Detection
      ✓ should detect price-conscious persona (105 ms)
      ✓ should detect feature-seeker persona (102 ms)
      ✓ should detect decision-maker persona (106 ms)
      ✓ should detect technical-evaluator persona (107 ms)
      ✓ should handle insufficient data gracefully (102 ms)
    Persona Recommendations
      ✓ should provide price-conscious recommendations (103 ms)
      ✓ should provide feature-seeker recommendations (102 ms)
      ✓ should provide decision-maker recommendations (102 ms)
      ✓ should provide technical-evaluator recommendations (101 ms)
    Persona Analytics
      ✓ should track persona distribution (102 ms)
      ✓ should provide conversion rates by persona (101 ms)
      ✓ should track persona evolution over time (101 ms)
    Mock Mode
      ✓ should work in mock mode when enabled (104 ms)
      ✓ should use real API when mock mode is disabled (2 ms)
    Error Handling
      ✓ should handle API errors gracefully (10 ms)
      ✓ should handle network errors (7 ms)
      ✓ should validate input data (1 ms)
    Integration Tests
      ✓ should complete full persona workflow (306 ms)

Summary of all failing tests
FAIL test/unit/sync-gmb.test.ts
  ● Test suite failed to run

    Cannot find module 'https://deno.land/std@0.178.0/testing/asserts.ts' from 'test/unit/sync-gmb.test.ts'

      1 |
    > 2 | import { assertEquals, assertExists } from 'https://deno.land/std@0.178.0/testing/asserts.ts';
        | ^
      3 |
      4 | // Simple response validation test
      5 | Deno.test('sync-gmb response structure', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/sync-gmb.test.ts:2:1)

FAIL test/unit/sync-ga4.test.ts
  ● Test suite failed to run

    Cannot find module 'https://deno.land/std@0.178.0/testing/asserts.ts' from 'test/unit/sync-ga4.test.ts'

      1 |
    > 2 | import { assertEquals, assertExists } from 'https://deno.land/std@0.178.0/testing/asserts.ts';
        | ^
      3 |
      4 | // Simple response validation test
      5 | Deno.test('sync-ga4 response structure', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/sync-ga4.test.ts:2:1)

FAIL test/smoke/routes.spec.ts
  ● Test suite failed to run

    Cannot find module '@playwright/test' from 'test/smoke/routes.spec.ts'

      1 |
    > 2 | import { test, expect } from '@playwright/test';
        | ^
      3 |
      4 | const routes = [
      5 |   '/',

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/smoke/routes.spec.ts:2:1)

FAIL src/components/analytics/__tests__/EventAnnotations.test.tsx
  ● EventAnnotations Component › getScoreAtDate › should return exact score for matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: undefined

      57 |     it('should return exact score for matching date', () => {
      58 |       const score = getScoreAtDate(mockScoreData, '2025-01-01');
    > 59 |       expect(score).toBe(65.5);
         |                     ^
      60 |     });
      61 |
      62 |     it('should return closest score for non-matching date', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:59:21)

  ● EventAnnotations Component › getScoreAtDate › should return closest score for non-matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      62 |     it('should return closest score for non-matching date', () => {
      63 |       const score = getScoreAtDate(mockScoreData, '2025-01-04');
    > 64 |       expect(score).toBe(68.8); // Closest to 2025-01-03
         |                     ^
      65 |     });
      66 |
      67 |     it('should return default score for empty data', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:64:21)

  ● EventAnnotations Component › getScoreAtDate › should handle single data point

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: 50

      73 |       const singlePoint = [mockScoreData[0]];
      74 |       const score = getScoreAtDate(singlePoint, '2025-01-10');
    > 75 |       expect(score).toBe(65.5);
         |                     ^
      76 |     });
      77 |   });
      78 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:75:21)

  ● EventAnnotations Component › filterEvents › should filter events by date range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      91 |       
      92 |       const filtered = filterEvents(mockEvents, dateRange);
    > 93 |       expect(filtered).toHaveLength(2);
         |                        ^
      94 |       expect(filtered[0].id).toBe('event-1');
      95 |       expect(filtered[1].id).toBe('event-2');
      96 |     });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:93:24)

  ● EventAnnotations Component › filterEvents › should apply both date range and type filters

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

      113 |       
      114 |       const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
    > 115 |       expect(filtered).toHaveLength(1);
          |                        ^
      116 |       expect(filtered[0].id).toBe('event-1');
      117 |     });
      118 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:115:24)

  ● EventAnnotations Component › Event Positioning Logic › should calculate correct positions for events within data range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      140 |       });
      141 |       
    > 142 |       expect(eventsInRange).toHaveLength(2);
          |                             ^
      143 |       
      144 |       // Test score positioning
      145 |       const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:142:29)

  ● EventAnnotations Component › Event Positioning Logic › should handle events outside data range gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      155 |       
      156 |       // Should return closest available score (2025-01-03)
    > 157 |       expect(score).toBe(68.8);
          |                     ^
      158 |     });
      159 |   });
      160 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:157:21)

  ● EventAnnotations Component › Performance Considerations › should handle large number of events efficiently

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      204 |       const endTime = performance.now();
      205 |       
    > 206 |       expect(filtered.length).toBeGreaterThan(0);
          |                               ^
      207 |       expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      208 |     });
      209 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:206:31)

  ● EventAnnotations Component › Performance Considerations › should handle large score dataset efficiently

    expect(received).toBe(expected) // Object.is equality

    Expected: "number"
    Received: "undefined"

      220 |       const endTime = performance.now();
      221 |       
    > 222 |       expect(typeof score).toBe('number');
          |                            ^
      223 |       expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
      224 |     });
      225 |   });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:222:28)

FAIL src/services/__tests__/vc.test.ts
  ● VC Service - Core Business Logic › startVisibilityCheck › should construct correct API request with all parameters

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle successful visibility check initiation

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle API errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid email format"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:69:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:59:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle different locales correctly

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should return null in production mode

    expect(received).toBeNull()

    Received: {"apiBase": "https://test-api.matbakh.app", "mode": "test", "provider": "aws"}

      124 |       const result = getVCEnvironmentInfo();
      125 |       
    > 126 |       expect(result).toBeNull();
          |                      ^
      127 |       
      128 |       // Restore
      129 |       if (originalEnv !== undefined) {

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:126:22)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should include correct environment variables

    expect(received).toBe(expected) // Object.is equality

    Expected: "development"
    Received: "test"

      140 |       if (result) {
      141 |         expect(result.apiBase).toBeDefined();
    > 142 |         expect(result.mode).toBe('development');
          |                             ^
      143 |       }
      144 |       
      145 |       // Restore

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:142:29)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle malformed API responses

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid JSON"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:162:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:153:60)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle rate limiting

    expect(received).rejects.toThrow(expected)

    Expected substring: "Rate limit exceeded"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:175:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:165:50)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle server errors

    expect(received).rejects.toThrow(expected)

    Expected substring: "Internal server error"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:188:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:178:50)

FAIL src/services/__tests__/ProfileService.test.ts
  ● ProfileService › Business Profile Management › should create a new business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should retrieve business profile by ID

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should update existing business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should delete business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should handle profile not found

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate required fields on creation

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate email format

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should search profiles by business name

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by category

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by location

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should get profile completion percentage

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should identify missing profile fields

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should suggest profile improvements

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle database connection errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle SQL syntax errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle duplicate email errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Integration Tests › should complete full profile lifecycle

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

FAIL src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts
  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components as safe when they have Kiro alternatives

    expect(received).toContain(expected) // indexOf

    Expected substring: "Kiro alternative available"
    Received string:    "Legacy component with clear migration path"

      281 |       const component = plan.components[0];
      282 |       expect(component.safeToArchive).toBe(true);
    > 283 |       expect(component.archiveReason).toContain('Kiro alternative available');
          |                                       ^
      284 |       expect(component.riskLevel).toBe('low');
      285 |     });
      286 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:283:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark critical components as unsafe to archive

    expect(received).toContain(expected) // indexOf

    Expected substring: "Critical system component"
    Received string:    "Medium-risk component - review recommended"

      299 |       const component = plan.components[0];
      300 |       expect(component.safeToArchive).toBe(false);
    > 301 |       expect(component.archiveReason).toContain('Critical system component');
          |                                       ^
      302 |       expect(component.riskLevel).toBe('critical');
      303 |     });
      304 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:301:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components with active backend dependencies as unsafe

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      324 |
      325 |       const component = plan.components[0];
    > 326 |       expect(component.safeToArchive).toBe(false);
          |                                       ^
      327 |       expect(component.archiveReason).toContain('manual review');
      328 |       expect(component.riskLevel).toBe('medium');
      329 |     });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:326:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark unknown components without dependencies as safe

    expect(received).toContain(expected) // indexOf

    Expected substring: "Unknown origin component with no active dependencies"
    Received string:    "Safe component with positive archival indicators"

      350 |       const component = plan.components[0];
      351 |       expect(component.safeToArchive).toBe(true);
    > 352 |       expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
          |                                       ^
      353 |       expect(component.riskLevel).toBe('medium');
      354 |     });
      355 |   });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:352:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

FAIL src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts'

      18 | }));
      19 |
    > 20 | jest.mock('glob');
         |      ^
      21 |
      22 | const mockFs = fs as jest.Mocked<typeof fs>;
      23 | const mockGlob = glob as jest.MockedFunction<any>;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts:20:6)

FAIL src/services/__tests__/auth.test.ts
  ● Test suite failed to run

    TypeError: 'toString' called on an object that is not a valid instance of Location.

      30 | delete window.location;
      31 | // @ts-expect-error test shim
    > 32 | window.location = { 
         |                ^
      33 |   ...originalLocation, 
      34 |   href: 'http://localhost:3000', 
      35 |   hash: '', 

      at Object.toString (node_modules/jest-environment-jsdom/node_modules/jsdom/lib/jsdom/living/generated/Location.js:130:17)
          at String (<anonymous>)
          at Reflect.set (<anonymous>)
      at Object.<anonymous> (src/services/__tests__/auth.test.ts:32:16)

FAIL src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/architecture-compliance-checker.ts'

    Require stack:
      src/lib/architecture-scanner/architecture-compliance-checker.ts
      src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts

       6 | import { promises as fs } from 'fs';
       7 | import path from 'path';
    >  8 | import glob from 'glob';
         | ^
       9 |
      10 | export interface ComplianceRule {
      11 |   id: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/architecture-compliance-checker.ts:8:1)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts:8:1)

FAIL src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts
  ● SafeArchivalSystem › executeArchival › should execute complete archival process with default options

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should create symlinks when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should run validation checks when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should generate rollback script when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should process components in batches

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should handle validation failure and rollback

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:188:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:176:68)

  ● SafeArchivalSystem › dependency resolution › should resolve component dependencies correctly

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › dependency resolution › should detect unresolved dependencies

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should create route redirectors for legacy routes

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should generate redirect configuration file

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should generate comprehensive archive manifest

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should include component checksums for integrity verification

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should preserve original file metadata

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should create executable rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include component restoration commands in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include validation checks in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should run all required validation checks

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should save validation results

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should handle optional validation check failures gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      361 |
      362 |       // Should not throw for optional check failure
    > 363 |       await expect(
          |             ^
      364 |         SafeArchivalSystem.executeArchival(mockArchivalPlan)
      365 |       ).resolves.toBeDefined();
      366 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:363:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:354:82)

  ● SafeArchivalSystem › error handling › should handle validation command failures

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:500:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:493:64)

  ● SafeArchivalSystem › git history preservation › should preserve git history when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › git history preservation › should handle git history errors gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      529 |
      530 |       // Should not throw for git history errors
    > 531 |       await expect(
          |             ^
      532 |         SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      533 |       ).resolves.toBeDefined();
      534 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:531:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:518:66)


Test Suites: 11 failed, 16 passed, 27 total
Tests:       61 failed, 295 passed, 356 total
Snapshots:   0 total
Time:        6.98 s
Ran all test suites.

- **Architecture Compliance**: Command failed: npx tsx scripts/run-architecture-compliance.ts

node:internal/modules/run_main:123
    triggerUncaughtException(
    ^
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'glob' imported from /Users/macbookpro/Projects/matbakh-visibility-boost/src/lib/architecture-scanner/architecture-compliance-checker.ts
    at packageResolve (node:internal/modules/esm/resolve:873:9)
    at moduleResolve (node:internal/modules/esm/resolve:946:18)
    at defaultResolve (node:internal/modules/esm/resolve:1188:11)
    at nextResolve (node:internal/modules/esm/hooks:864:28)
    at resolveBase (file:///Users/macbookpro/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/esm/index.mjs?1758201492994:2:3744)
    at resolveDirectory (file:///Users/macbookpro/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/esm/index.mjs?1758201492994:2:4243)
    at resolveTsPaths (file:///Users/macbookpro/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/esm/index.mjs?1758201492994:2:4984)
    at async resolve (file:///Users/macbookpro/.npm/_npx/fd45a72a545557e9/node_modules/tsx/dist/esm/index.mjs?1758201492994:2:5355)
    at async nextResolve (node:internal/modules/esm/hooks:864:22)
    at async Hooks.resolve (node:internal/modules/esm/hooks:306:24) {
  code: 'ERR_MODULE_NOT_FOUND'
}

Node.js v20.19.5

- **VC User Journey**: Critical VC component missing: src/components/vc/VCQuick.tsx
- **Test Execution Performance**: Command failed: npm test -- --testNamePattern="should" --maxWorkers=1
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
FAIL src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts
  LegacyComponentDetector
    scanLegacyComponents
      ✓ should identify legacy components correctly (75 ms)
      ✓ should create proper backup plan (5 ms)
    Backend Dependency Analysis
      ✓ should detect Supabase backend dependencies (5 ms)
      ✓ should detect Lovable backend dependencies (3 ms)
      ✓ should provide migration paths for dependencies (3 ms)
    Route Usage Analysis
      ✓ should detect route usage in page components (3 ms)
      ✓ should identify Kiro alternatives for legacy routes (3 ms)
    Safe-to-Archive Classification
      ✕ should mark components as safe when they have Kiro alternatives (4 ms)
      ✕ should mark critical components as unsafe to archive (4 ms)
      ✕ should mark components with active backend dependencies as unsafe (3 ms)
      ✕ should mark unknown components without dependencies as safe (2 ms)
    Archive Manifest Generation
      ✓ should generate comprehensive archive manifest (5 ms)
    Error Handling
      ✓ should handle file read errors gracefully (9 ms)
      ✓ should handle malformed file content (2 ms)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components as safe when they have Kiro alternatives

    expect(received).toContain(expected) // indexOf

    Expected substring: "Kiro alternative available"
    Received string:    "Legacy component with clear migration path"

      281 |       const component = plan.components[0];
      282 |       expect(component.safeToArchive).toBe(true);
    > 283 |       expect(component.archiveReason).toContain('Kiro alternative available');
          |                                       ^
      284 |       expect(component.riskLevel).toBe('low');
      285 |     });
      286 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:283:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark critical components as unsafe to archive

    expect(received).toContain(expected) // indexOf

    Expected substring: "Critical system component"
    Received string:    "Medium-risk component - review recommended"

      299 |       const component = plan.components[0];
      300 |       expect(component.safeToArchive).toBe(false);
    > 301 |       expect(component.archiveReason).toContain('Critical system component');
          |                                       ^
      302 |       expect(component.riskLevel).toBe('critical');
      303 |     });
      304 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:301:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components with active backend dependencies as unsafe

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      324 |
      325 |       const component = plan.components[0];
    > 326 |       expect(component.safeToArchive).toBe(false);
          |                                       ^
      327 |       expect(component.archiveReason).toContain('manual review');
      328 |       expect(component.riskLevel).toBe('medium');
      329 |     });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:326:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark unknown components without dependencies as safe

    expect(received).toContain(expected) // indexOf

    Expected substring: "Unknown origin component with no active dependencies"
    Received string:    "Safe component with positive archival indicators"

      350 |       const component = plan.components[0];
      351 |       expect(component.safeToArchive).toBe(true);
    > 352 |       expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
          |                                       ^
      353 |       expect(component.riskLevel).toBe('medium');
      354 |     });
      355 |   });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:352:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

FAIL src/services/__tests__/ProfileService.test.ts
  ProfileService
    Business Profile Management
      ✕ should create a new business profile
      ✕ should retrieve business profile by ID
      ✕ should update existing business profile (1 ms)
      ✕ should delete business profile
      ✕ should handle profile not found (1 ms)
      ✕ should validate required fields on creation
      ✕ should validate email format (1 ms)
    Profile Search and Filtering
      ✕ should search profiles by business name
      ✕ should filter profiles by category
      ✕ should filter profiles by location
    Profile Analytics
      ✕ should get profile completion percentage
      ✕ should identify missing profile fields (1 ms)
      ✕ should suggest profile improvements
    Error Handling
      ✕ should handle database connection errors
      ✕ should handle SQL syntax errors
      ✕ should handle duplicate email errors (1 ms)
    Integration Tests
      ✕ should complete full profile lifecycle

  ● ProfileService › Business Profile Management › should create a new business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should retrieve business profile by ID

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should update existing business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should delete business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should handle profile not found

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate required fields on creation

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate email format

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should search profiles by business name

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by category

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by location

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should get profile completion percentage

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should identify missing profile fields

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should suggest profile improvements

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle database connection errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle SQL syntax errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle duplicate email errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Integration Tests › should complete full profile lifecycle

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

FAIL src/services/__tests__/vc.test.ts
  VC Service - Core Business Logic
    startVisibilityCheck
      ✕ should construct correct API request with all parameters (1 ms)
      ✕ should handle successful visibility check initiation
      ✕ should handle API errors gracefully (2 ms)
      ✓ should handle network errors (1 ms)
      ✓ should validate required parameters (1 ms)
      ✕ should handle different locales correctly
    getVCEnvironmentInfo
      ✓ should return environment info in development mode (1 ms)
      ✕ should return null in production mode (1 ms)
      ✕ should include correct environment variables (2 ms)
    Error Handling & Edge Cases
      ✕ should handle malformed API responses (1 ms)
      ✕ should handle rate limiting
      ✕ should handle server errors (1 ms)

  ● VC Service - Core Business Logic › startVisibilityCheck › should construct correct API request with all parameters

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle successful visibility check initiation

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle API errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid email format"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:69:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:59:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle different locales correctly

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should return null in production mode

    expect(received).toBeNull()

    Received: {"apiBase": "https://test-api.matbakh.app", "mode": "test", "provider": "aws"}

      124 |       const result = getVCEnvironmentInfo();
      125 |       
    > 126 |       expect(result).toBeNull();
          |                      ^
      127 |       
      128 |       // Restore
      129 |       if (originalEnv !== undefined) {

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:126:22)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should include correct environment variables

    expect(received).toBe(expected) // Object.is equality

    Expected: "development"
    Received: "test"

      140 |       if (result) {
      141 |         expect(result.apiBase).toBeDefined();
    > 142 |         expect(result.mode).toBe('development');
          |                             ^
      143 |       }
      144 |       
      145 |       // Restore

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:142:29)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle malformed API responses

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid JSON"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:162:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:153:60)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle rate limiting

    expect(received).rejects.toThrow(expected)

    Expected substring: "Rate limit exceeded"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:175:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:165:50)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle server errors

    expect(received).rejects.toThrow(expected)

    Expected substring: "Internal server error"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:188:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:178:50)

FAIL src/components/analytics/__tests__/EventAnnotations.test.tsx
  EventAnnotations Component
    getScoreAtDate
      ✕ should return exact score for matching date (1 ms)
      ✕ should return closest score for non-matching date (1 ms)
      ✓ should return default score for empty data
      ✕ should handle single data point (1 ms)
    filterEvents
      ✓ should return all events when no filters applied
      ✕ should filter events by date range (1 ms)
      ✓ should filter events by visible types (1 ms)
      ✕ should apply both date range and type filters
      ✓ should return empty array when no events match filters (1 ms)
      ✓ should handle empty visible types array
    Event Positioning Logic
      ✕ should calculate correct positions for events within data range
      ✕ should handle events outside data range gracefully
    Event Type Validation
      ✓ should validate all event types are supported
      ✓ should handle events with different impact types (1 ms)
    Performance Considerations
      ✕ should handle large number of events efficiently
      ✕ should handle large score dataset efficiently (1 ms)
    Edge Cases
      ✓ should handle events with missing optional fields
      ✓ should handle invalid date formats gracefully
      ✓ should handle empty arrays

  ● EventAnnotations Component › getScoreAtDate › should return exact score for matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: undefined

      57 |     it('should return exact score for matching date', () => {
      58 |       const score = getScoreAtDate(mockScoreData, '2025-01-01');
    > 59 |       expect(score).toBe(65.5);
         |                     ^
      60 |     });
      61 |
      62 |     it('should return closest score for non-matching date', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:59:21)

  ● EventAnnotations Component › getScoreAtDate › should return closest score for non-matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      62 |     it('should return closest score for non-matching date', () => {
      63 |       const score = getScoreAtDate(mockScoreData, '2025-01-04');
    > 64 |       expect(score).toBe(68.8); // Closest to 2025-01-03
         |                     ^
      65 |     });
      66 |
      67 |     it('should return default score for empty data', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:64:21)

  ● EventAnnotations Component › getScoreAtDate › should handle single data point

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: 50

      73 |       const singlePoint = [mockScoreData[0]];
      74 |       const score = getScoreAtDate(singlePoint, '2025-01-10');
    > 75 |       expect(score).toBe(65.5);
         |                     ^
      76 |     });
      77 |   });
      78 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:75:21)

  ● EventAnnotations Component › filterEvents › should filter events by date range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      91 |       
      92 |       const filtered = filterEvents(mockEvents, dateRange);
    > 93 |       expect(filtered).toHaveLength(2);
         |                        ^
      94 |       expect(filtered[0].id).toBe('event-1');
      95 |       expect(filtered[1].id).toBe('event-2');
      96 |     });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:93:24)

  ● EventAnnotations Component › filterEvents › should apply both date range and type filters

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

      113 |       
      114 |       const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
    > 115 |       expect(filtered).toHaveLength(1);
          |                        ^
      116 |       expect(filtered[0].id).toBe('event-1');
      117 |     });
      118 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:115:24)

  ● EventAnnotations Component › Event Positioning Logic › should calculate correct positions for events within data range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      140 |       });
      141 |       
    > 142 |       expect(eventsInRange).toHaveLength(2);
          |                             ^
      143 |       
      144 |       // Test score positioning
      145 |       const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:142:29)

  ● EventAnnotations Component › Event Positioning Logic › should handle events outside data range gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      155 |       
      156 |       // Should return closest available score (2025-01-03)
    > 157 |       expect(score).toBe(68.8);
          |                     ^
      158 |     });
      159 |   });
      160 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:157:21)

  ● EventAnnotations Component › Performance Considerations › should handle large number of events efficiently

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      204 |       const endTime = performance.now();
      205 |       
    > 206 |       expect(filtered.length).toBeGreaterThan(0);
          |                               ^
      207 |       expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      208 |     });
      209 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:206:31)

  ● EventAnnotations Component › Performance Considerations › should handle large score dataset efficiently

    expect(received).toBe(expected) // Object.is equality

    Expected: "number"
    Received: "undefined"

      220 |       const endTime = performance.now();
      221 |       
    > 222 |       expect(typeof score).toBe('number');
          |                            ^
      223 |       expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
      224 |     });
      225 |   });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:222:28)

FAIL src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts
  SafeArchivalSystem
    executeArchival
      ✕ should execute complete archival process with default options (21 ms)
      ✕ should create symlinks when option is enabled (10 ms)
      ✕ should run validation checks when enabled (13 ms)
      ✕ should generate rollback script when enabled (9 ms)
      ✕ should process components in batches (9 ms)
      ✕ should handle validation failure and rollback (11 ms)
    dependency resolution
      ✕ should resolve component dependencies correctly (14 ms)
      ✕ should detect unresolved dependencies (9 ms)
    route redirectors
      ✕ should create route redirectors for legacy routes (8 ms)
      ✕ should generate redirect configuration file (8 ms)
    archive manifest
      ✕ should generate comprehensive archive manifest (11 ms)
      ✕ should include component checksums for integrity verification (9 ms)
      ✕ should preserve original file metadata (8 ms)
    rollback mechanism
      ✕ should create executable rollback script (10 ms)
      ✕ should include component restoration commands in rollback script (8 ms)
      ✕ should include validation checks in rollback script (10 ms)
    validation checks
      ✕ should run all required validation checks (7 ms)
      ✕ should save validation results (7 ms)
      ✕ should handle optional validation check failures gracefully (8 ms)
    component restoration
      ✓ should restore individual components from archive (2 ms)
      ✓ should handle component not found in archive (1 ms)
    archive listing
      ✓ should list all archived components (1 ms)
      ✓ should handle missing archive directory (2 ms)
    error handling
      ✓ should handle file system errors gracefully (3 ms)
      ✓ should handle component archival failures (6 ms)
      ✕ should handle validation command failures (10 ms)
    git history preservation
      ✕ should preserve git history when option is enabled (7 ms)
      ✕ should handle git history errors gracefully (8 ms)

  ● SafeArchivalSystem › executeArchival › should execute complete archival process with default options

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should create symlinks when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should run validation checks when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should generate rollback script when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should process components in batches

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should handle validation failure and rollback

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:188:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:176:68)

  ● SafeArchivalSystem › dependency resolution › should resolve component dependencies correctly

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › dependency resolution › should detect unresolved dependencies

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should create route redirectors for legacy routes

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should generate redirect configuration file

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should generate comprehensive archive manifest

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should include component checksums for integrity verification

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should preserve original file metadata

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should create executable rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include component restoration commands in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include validation checks in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should run all required validation checks

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should save validation results

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should handle optional validation check failures gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      361 |
      362 |       // Should not throw for optional check failure
    > 363 |       await expect(
          |             ^
      364 |         SafeArchivalSystem.executeArchival(mockArchivalPlan)
      365 |       ).resolves.toBeDefined();
      366 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:363:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:354:82)

  ● SafeArchivalSystem › error handling › should handle validation command failures

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:500:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:493:64)

  ● SafeArchivalSystem › git history preservation › should preserve git history when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › git history preservation › should handle git history errors gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      529 |
      530 |       // Should not throw for git history errors
    > 531 |       await expect(
          |             ^
      532 |         SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      533 |       ).resolves.toBeDefined();
      534 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:531:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:518:66)

PASS src/services/__tests__/persona-api.test.ts
  PersonaApiService
    Singleton Pattern
      ✓ should return the same instance
    Persona Detection
      ✓ should detect price-conscious persona (103 ms)
      ✓ should detect feature-seeker persona (102 ms)
      ✓ should detect decision-maker persona (101 ms)
      ✓ should detect technical-evaluator persona (102 ms)
      ✓ should handle insufficient data gracefully (102 ms)
    Persona Recommendations
      ✓ should provide price-conscious recommendations (102 ms)
      ✓ should provide feature-seeker recommendations (102 ms)
      ✓ should provide decision-maker recommendations (101 ms)
      ✓ should provide technical-evaluator recommendations (100 ms)
    Persona Analytics
      ✓ should track persona distribution (102 ms)
      ✓ should provide conversion rates by persona (101 ms)
      ✓ should track persona evolution over time (101 ms)
    Mock Mode
      ✓ should work in mock mode when enabled (101 ms)
      ✓ should use real API when mock mode is disabled (1 ms)
    Error Handling
      ✓ should handle API errors gracefully (9 ms)
      ✓ should handle network errors (5 ms)
      ✓ should validate input data (1 ms)
    Integration Tests
      ✓ should complete full persona workflow (304 ms)

PASS src/__tests__/performance/s3-performance.test.ts
  S3 Performance Tests
    Batch URL Generation Performance
      ✓ should handle batch requests efficiently (19 ms)
      ✓ should cache URLs for repeated requests (3 ms)
    Memory Usage
      ✓ should clean up expired URLs to prevent memory leaks (378 ms)

PASS src/lib/forecast/__tests__/forecastEngine.test.ts
  ForecastEngine
    generateForecast
      ✓ should return flat trend for constant scores (3 ms)
      ✓ should return up trend for linearly increasing scores (1 ms)
      ✓ should return down trend for linearly decreasing scores (2 ms)
      ✓ should return empty array for insufficient data (7 ms)
      ✓ should handle high variance with wider confidence intervals (1 ms)
      ✓ should handle badly formatted data gracefully (2 ms)
      ✓ should generate correct number of forecast points for different ranges (1 ms)
      ✓ should have valid forecast point structure (10 ms)
      ✓ should have increasing uncertainty over time (1 ms)
    analyzeTrend
      ✓ should correctly identify flat trend (1 ms)
      ✓ should correctly identify upward trend
      ✓ should correctly identify downward trend
      ✓ should handle empty data (1 ms)
    assessDataQuality
      ✓ should assess good quality for clean data (1 ms)
      ✓ should identify issues with insufficient data
      ✓ should identify high volatility (1 ms)
    generateComprehensiveForecast
      ✓ should generate complete forecast result (2 ms)
    Edge Cases
      ✓ should handle single data point (1 ms)
      ✓ should handle identical dates (2 ms)
      ✓ should handle extreme values (1 ms)
      ✓ should handle unsorted data
    Performance
      ✓ should handle large datasets efficiently (6 ms)

PASS src/lib/recommendation/__tests__/recommendationTrigger.test.ts
  RecommendationTrigger
    evaluateScoreTrend
      ✓ should not trigger for insufficient data (2 ms)
      ✓ should not trigger for stable scores (2 ms)
      ✓ should trigger drop for significant score decrease (1 ms)
      ✓ should trigger stagnation for unchanging scores (2 ms)
      ✓ should not trigger for improving scores (1 ms)
      ✓ should handle volatile scores appropriately
      ✓ should respect custom thresholds
      ✓ should provide appropriate metadata (2 ms)
      ✓ should not trigger for slight improvements (1 ms)
      ✓ should trigger drop for exactly threshold change (1 ms)
    evaluateScoreTrendWithContext
      ✓ should use contextual thresholds for different score types (1 ms)
      ✓ should adjust actions based on score type (1 ms)
      ✓ should handle industry-specific contexts (1 ms)
    Edge Cases and Error Handling
      ✓ should handle empty score arrays gracefully (1 ms)
      ✓ should handle invalid threshold configurations (6 ms)

PASS src/services/__tests__/forecasting-engine.test.ts
  ForecastingEngine
    generateForecast
      ✓ should generate forecast with valid data (2 ms)
      ✓ should throw error with insufficient data (21 ms)
      ✓ should generate different forecasts for different ranges (1 ms)
      ✓ should detect upward trend correctly (1 ms)
      ✓ should detect downward trend correctly (1 ms)
      ✓ should detect stable trend correctly
      ✓ should generate forecast points with confidence intervals (4 ms)
      ✓ should have increasing uncertainty over time
    detectTrendChanges
      ✓ should detect trend changes in data (1 ms)
      ✓ should return empty array for insufficient data (1 ms)
      ✓ should detect acceleration and deceleration (1 ms)
    getForecastSummary
      ✓ should generate comprehensive forecast summary (1 ms)
      ✓ should provide appropriate trend descriptions (1 ms)
      ✓ should provide confidence descriptions
      ✓ should generate insights based on forecast data (1 ms)
      ✓ should generate appropriate recommendations (1 ms)
    Edge Cases
      ✓ should handle data with missing values gracefully
      ✓ should handle extreme values correctly (2 ms)
      ✓ should handle identical values
      ✓ should handle very large datasets efficiently (5 ms)
    Statistical Accuracy
      ✓ should have reasonable R-squared for linear data
      ✓ should have lower R-squared for noisy data (1 ms)
      ✓ should have confidence that correlates with data quality

PASS src/data/recommendations/__tests__/recommendations.test.ts
  Goal-Specific Recommendations
    getRecommendationsByGoal
      ✓ should return recommendations for a valid goal (2 ms)
      ✓ should return empty array for invalid goal
    getGoalProfile
      ✓ should return complete goal profile with recommendations (1 ms)
    getAllGoalProfiles
      ✓ should return all goal profiles (3 ms)
    getRecommendationsSorted
      ✓ should sort recommendations by impact score (1 ms)
      ✓ should sort recommendations by effort score
      ✓ should sort recommendations by combined score (1 ms)
    getQuickWins
      ✓ should return only high impact, low effort recommendations (1 ms)
    getStrategicInitiatives
      ✓ should return only high impact, high effort recommendations
    calculateGoalMetrics
      ✓ should calculate correct metrics for a goal (4 ms)
    Recommendation Data Quality
      ✓ should have valid data for all goals (30 ms)

PASS src/components/analytics/__tests__/TrendFilters.test.tsx
  TrendFilters Component
    Props Validation
      ✓ should validate TrendFilters interface structure (1 ms)
      ✓ should handle optional businessUnit property (2 ms)
      ✓ should validate BusinessUnit interface
    Score Type Handling
      ✓ should validate all score types (2 ms)
      ✓ should handle score type changes
    Date Range Handling
      ✓ should validate date range presets (1 ms)
      ✓ should generate correct date ranges for presets (1 ms)
      ✓ should handle custom date range changes
      ✓ should validate date range logic
    Business Unit Handling
      ✓ should validate mock business units structure (1 ms)
      ✓ should handle business unit selection
      ✓ should handle "all units" selection (1 ms)
    Filter State Management
      ✓ should maintain filter state consistency
      ✓ should handle partial filter updates (1 ms)
    Date Formatting
      ✓ should format dates correctly for input fields
      ✓ should format dates correctly for German locale display (20 ms)
    Integration Scenarios
      ✓ should handle complete filter workflow (1 ms)

PASS src/lib/architecture-scanner/__tests__/enhanced-risk-assessor.test.ts
  EnhancedRiskAssessor
    assessRisk
      ✓ should classify critical system components as critical risk (1 ms)
      ✓ should classify components with migration paths as lower risk (1 ms)
      ✓ should classify components with Kiro alternatives as lower risk (1 ms)
      ✓ should classify debug/test components as safe (3 ms)
      ✓ should classify recently modified components as higher risk
      ✓ should classify old components as safer to archive (1 ms)
      ✓ should classify high complexity components with higher risk
      ✓ should never classify Kiro components as safe to archive (1 ms)
      ✓ should provide mitigation suggestions based on risk factors
    batchAssessRisk
      ✓ should assess multiple components in batch
    generateRiskReport
      ✓ should generate comprehensive risk report (1 ms)
      ✓ should count risk factors correctly (1 ms)
    risk factor assessment
      ✓ should detect development routes as low risk
      ✓ should handle file stat errors gracefully (1 ms)
      ✓ should provide confidence scores
    edge cases
      ✓ should handle components with no risk factors (1 ms)
      ✓ should handle components with mixed risk factors (1 ms)

PASS src/lib/architecture-scanner/__tests__/targeted-test-executor.test.ts
  TargetedTestExecutor
    constructor
      ✓ should initialize with default options
      ✓ should initialize with custom options
    initializeTestRunner
      ✓ should initialize test runner with safe test suite (10 ms)
      ✓ should use default coverage map path if not provided (2 ms)
      ✓ should handle initialization errors gracefully (16 ms)
    executeTestSuite
      ✓ should execute all phases of test suite (49 ms)
      ✓ should handle empty phases gracefully (4 ms)
      ✓ should stop execution on fail-fast mode (18 ms)
    dry run mode
      ✓ should simulate test execution in dry run mode (15 ms)
    failure classification
      ✓ should classify interface mismatch failures as expected (20 ms)
      ✓ should classify timeout failures as infrastructure (45 ms)
      ✓ should classify dependency errors as infrastructure (44 ms)
      ✓ should classify assertion errors as unexpected (46 ms)
    report generation
      ✓ should generate comprehensive test report (45 ms)
      ✓ should save report files to disk (45 ms)
      ✓ should handle file write errors gracefully (43 ms)
      ✓ should generate appropriate recommendations (46 ms)
    confidence level adjustment
      ✓ should adjust confidence level based on execution results (44 ms)
      ✓ should lower confidence for unexpected failures (46 ms)
    concurrency control
      ✓ should respect max concurrency setting (216 ms)
  runTargetedTestExecution utility function
    ✓ should run complete targeted test execution workflow (45 ms)
    ✓ should work with default parameters (42 ms)
    ✓ should handle execution errors gracefully (2 ms)
  FailureClassification
    ✓ should create proper failure classification structure (1 ms)
  TestExecutionResult
    ✓ should create proper test execution result structure

PASS src/lib/architecture-scanner/__tests__/test-selection-engine.test.ts
  TestSelectionEngine
    loadCoverageMap
      ✓ should load and parse test coverage map successfully (5 ms)
      ✓ should handle file read errors gracefully (14 ms)
      ✓ should handle invalid JSON gracefully (1 ms)
    detectInterfaceMismatches
      ✓ should detect interface mismatches correctly (1 ms)
      ✓ should provide appropriate suggested fixes (1 ms)
      ✓ should throw error if coverage map not loaded (1 ms)
    createKiroComponentFilter
      ✓ should classify components by origin correctly (1 ms)
      ✓ should handle file read errors during origin detection (2 ms)
    generateSafeTestSuite
      ✓ should generate safe test suite with correct categorization (7 ms)
      ✓ should exclude broken tests and interface mismatches (3 ms)
      ✓ should include excellent and good tests in validated list (2 ms)
      ✓ should create proper execution plan phases (3 ms)
      ✓ should include interface mismatches in results (3 ms)
    generateSafeTestReport
      ✓ should generate comprehensive test report (3 ms)
      ✓ should include correct statistics in report (3 ms)
      ✓ should list interface mismatches with details (2 ms)
    exportSafeTestSuite
      ✓ should export safe test suite to JSON file (3 ms)
      ✓ should handle export errors gracefully (3 ms)
    getTestExecutionCommand
      ✓ should generate correct test execution command (1 ms)
      ✓ should throw error if coverage map not loaded (1 ms)
  runTestSelection utility function
    ✓ should run complete test selection workflow (6 ms)
    ✓ should work without output directory (3 ms)

PASS src/services/__tests__/benchmark-comparison.test.ts
  BenchmarkComparisonService
    getIndustryBenchmarks
      ✓ should fetch benchmark data successfully (1 ms)
      ✓ should return null when benchmark not found
    compareToBenchmark
      ✓ should calculate comparison for score above 75th percentile (1 ms)
      ✓ should calculate comparison for score below 25th percentile
      ✓ should calculate comparison for average score (1 ms)
      ✓ should fallback to national benchmark when regional not available (1 ms)
    getMultiRegionBenchmarks
      ✓ should fetch benchmarks for multiple regions (1 ms)
      ✓ should handle empty results gracefully
    updateBenchmark
      ✓ should update benchmark data successfully (1 ms)
      ✓ should handle update errors gracefully (11 ms)
    calculateComparison (private method testing via public interface)
      ✓ should generate appropriate recommendations for each performance category (1 ms)
      ✓ should calculate improvement potential correctly
      ✓ should generate position descriptions correctly (1 ms)

PASS src/services/__tests__/score-history.test.ts
  ScoreHistoryService
    insertScore
      ✓ should insert a new score record (2 ms)
      ✓ should validate score_type enum values (4 ms)
      ✓ should validate source enum values
    insertScores (bulk)
      ✓ should insert multiple score records
    queryScoreHistory
      ✓ should query score history with filters (1 ms)
      ✓ should handle multiple score types in query
      ✓ should handle date range filters (1 ms)
    getScoreEvolution
      ✓ should calculate score evolution data (1 ms)
      ✓ should handle empty data gracefully
      ✓ should calculate trend correctly (1 ms)
    getBusinessAnalytics
      ✓ should generate comprehensive business analytics (1 ms)
    updateScore
      ✓ should update a score record (1 ms)
      ✓ should handle no fields to update (12 ms)
    deleteScore
      ✓ should delete a score record
      ✓ should handle record not found (1 ms)
    getLatestScores
      ✓ should get latest scores for all score types (1 ms)
  Score History Database Schema
    ✓ should validate table structure requirements (1 ms)
    ✓ should validate score_value constraints
    ✓ should validate foreign key relationship (1 ms)
    ✓ should validate index requirements

PASS src/components/analytics/__tests__/TrendChart.test.tsx
  TrendChart Component
    ✓ should validate props structure (1 ms)
    ✓ should handle different score types (5 ms)
    ✓ should validate mock data structure (1 ms)
    ✓ should validate event data structure (1 ms)
  TrendChart Data Validation
    ✓ should validate score values are within range (3 ms)
    ✓ should validate date format (6 ms)
    ✓ should validate business_id format (4 ms)

PASS src/lib/__tests__/todoGenerator.test.ts
  generateTodos
    Google My Business Checks
      ✓ should create high priority todo for missing photos (1 ms)
      ✓ should create high priority todo for missing hours (1 ms)
      ✓ should create medium priority todo for incomplete profile
    Meta/Facebook Checks
      ✓ should create medium priority todo for disabled messenger
      ✓ should create medium priority todo for missing photos
    Instagram Checks
      ✓ should create medium priority todo for missing business account
      ✓ should create low priority todo for low follower count (1 ms)
      ✓ should not create low follower todo for sufficient followers
    Industry-specific Checks
      Hospitality
        ✓ should create high priority todo for missing reservation system
        ✓ should create high priority todo for low ratings
        ✓ should not create rating todo for good ratings
      Retail
        ✓ should create high priority todo for missing online shop (1 ms)
    Satisfaction Logic
      ✓ should return fully satisfied when no high priority todos and score >= 80
      ✓ should return not satisfied when high priority todos exist (1 ms)
      ✓ should return not satisfied when score < 80
      ✓ should handle missing score gracefully
    Edge Cases
      ✓ should handle empty analysis object (1 ms)
      ✓ should handle null/undefined analysis fields
      ✓ should handle unknown industry gracefully (1 ms)
    Todo Structure
      ✓ should return todos with correct structure (5 ms)

PASS src/services/__tests__/aws-rds-client.test.ts
  AwsRdsClient
    Query Execution
      ✓ should execute SELECT query for profiles successfully (2 ms)
      ✓ should execute INSERT query for profiles successfully (1 ms)
      ✓ should execute UPDATE query for profiles successfully
      ✓ should handle queries with no results (1 ms)
      ✓ should handle non-profile queries
    Single Query Execution
      ✓ should execute queryOne and return single result (1 ms)
      ✓ should return null when no results found
    Transaction Management
      ✓ should execute transaction callback successfully (1 ms)
      ✓ should handle transaction callback errors (7 ms)
    Error Handling
      ✓ should handle localStorage errors gracefully (2 ms)
      ✓ should handle JSON parsing errors (1 ms)

PASS src/utils/__tests__/event-utils.test.ts
  Event Utils
    filterEventsByDateRange
      ✓ should filter events within date range (1 ms)
      ✓ should return empty array when no events in range (1 ms)
    filterEventsByType
      ✓ should filter events by single type
      ✓ should filter events by multiple types
    filterEventsByImpact
      ✓ should filter events by positive impact (1 ms)
      ✓ should filter events by multiple impacts
    sortEventsByDate
      ✓ should sort events by date descending (default) (1 ms)
      ✓ should sort events by date ascending
    groupEventsByType
      ✓ should group events by type (1 ms)
    getEventsNearDate
      ✓ should get events within 7 days of target date
      ✓ should get events within custom day range
    formatEventForTooltip
      ✓ should format event with all details
      ✓ should format event without description
    getEventStatistics
      ✓ should calculate event statistics (1 ms)
    isEventOnDate
      ✓ should return true for matching date
      ✓ should return false for non-matching date (1 ms)
    getLastEventBeforeDate
      ✓ should get the most recent event before date
      ✓ should return null when no events before date
    validateEvent
      ✓ should return no errors for valid event
      ✓ should return errors for missing required fields
      ✓ should return error for invalid date

FAIL src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts'

      18 | }));
      19 |
    > 20 | jest.mock('glob');
         |      ^
      21 |
      22 | const mockFs = fs as jest.Mocked<typeof fs>;
      23 | const mockGlob = glob as jest.MockedFunction<any>;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts:20:6)

FAIL src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/architecture-compliance-checker.ts'

    Require stack:
      src/lib/architecture-scanner/architecture-compliance-checker.ts
      src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts

       6 | import { promises as fs } from 'fs';
       7 | import path from 'path';
    >  8 | import glob from 'glob';
         | ^
       9 |
      10 | export interface ComplianceRule {
      11 |   id: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/architecture-compliance-checker.ts:8:1)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts:8:1)

FAIL src/services/__tests__/auth.test.ts
  ● Test suite failed to run

    TypeError: 'toString' called on an object that is not a valid instance of Location.

      30 | delete window.location;
      31 | // @ts-expect-error test shim
    > 32 | window.location = { 
         |                ^
      33 |   ...originalLocation, 
      34 |   href: 'http://localhost:3000', 
      35 |   hash: '', 

      at Object.toString (node_modules/jest-environment-jsdom/node_modules/jsdom/lib/jsdom/living/generated/Location.js:130:17)
          at String (<anonymous>)
          at Reflect.set (<anonymous>)
      at Object.<anonymous> (src/services/__tests__/auth.test.ts:32:16)

Summary of all failing tests
FAIL src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts
  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components as safe when they have Kiro alternatives

    expect(received).toContain(expected) // indexOf

    Expected substring: "Kiro alternative available"
    Received string:    "Legacy component with clear migration path"

      281 |       const component = plan.components[0];
      282 |       expect(component.safeToArchive).toBe(true);
    > 283 |       expect(component.archiveReason).toContain('Kiro alternative available');
          |                                       ^
      284 |       expect(component.riskLevel).toBe('low');
      285 |     });
      286 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:283:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark critical components as unsafe to archive

    expect(received).toContain(expected) // indexOf

    Expected substring: "Critical system component"
    Received string:    "Medium-risk component - review recommended"

      299 |       const component = plan.components[0];
      300 |       expect(component.safeToArchive).toBe(false);
    > 301 |       expect(component.archiveReason).toContain('Critical system component');
          |                                       ^
      302 |       expect(component.riskLevel).toBe('critical');
      303 |     });
      304 |

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:301:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark components with active backend dependencies as unsafe

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      324 |
      325 |       const component = plan.components[0];
    > 326 |       expect(component.safeToArchive).toBe(false);
          |                                       ^
      327 |       expect(component.archiveReason).toContain('manual review');
      328 |       expect(component.riskLevel).toBe('medium');
      329 |     });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:326:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

  ● LegacyComponentDetector › Safe-to-Archive Classification › should mark unknown components without dependencies as safe

    expect(received).toContain(expected) // indexOf

    Expected substring: "Unknown origin component with no active dependencies"
    Received string:    "Safe component with positive archival indicators"

      350 |       const component = plan.components[0];
      351 |       expect(component.safeToArchive).toBe(true);
    > 352 |       expect(component.archiveReason).toContain('Unknown origin component with no active dependencies');
          |                                       ^
      353 |       expect(component.riskLevel).toBe('medium');
      354 |     });
      355 |   });

      at src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:352:39
      at fulfilled (src/lib/architecture-scanner/__tests__/legacy-component-detector.test.ts:43:58)

FAIL src/services/__tests__/ProfileService.test.ts
  ● ProfileService › Business Profile Management › should create a new business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should retrieve business profile by ID

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should update existing business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should delete business profile

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should handle profile not found

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate required fields on creation

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Business Profile Management › should validate email format

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should search profiles by business name

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by category

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Search and Filtering › should filter profiles by location

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should get profile completion percentage

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should identify missing profile fields

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Profile Analytics › should suggest profile improvements

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle database connection errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle SQL syntax errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Error Handling › should handle duplicate email errors

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

  ● ProfileService › Integration Tests › should complete full profile lifecycle

    TypeError: ProfileService_1.ProfileService is not a constructor

      17 |
      18 |   beforeEach(() => {
    > 19 |     profileService = new ProfileService();
         |                      ^
      20 |     jest.clearAllMocks();
      21 |     mockExecuteQuery.mockClear();
      22 |     mockMapRecord.mockClear();

      at Object.<anonymous> (src/services/__tests__/ProfileService.test.ts:19:22)

FAIL src/services/__tests__/vc.test.ts
  ● VC Service - Core Business Logic › startVisibilityCheck › should construct correct API request with all parameters

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle successful visibility check initiation

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle API errors gracefully

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid email format"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:69:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:59:58)

  ● VC Service - Core Business Logic › startVisibilityCheck › should handle different locales correctly

    TypeError: resp.text is not a function

      25 |   });
      26 |
    > 27 |   const text = await resp.text();
         |                           ^
      28 |
      29 |   let data: any;
      30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should return null in production mode

    expect(received).toBeNull()

    Received: {"apiBase": "https://test-api.matbakh.app", "mode": "test", "provider": "aws"}

      124 |       const result = getVCEnvironmentInfo();
      125 |       
    > 126 |       expect(result).toBeNull();
          |                      ^
      127 |       
      128 |       // Restore
      129 |       if (originalEnv !== undefined) {

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:126:22)

  ● VC Service - Core Business Logic › getVCEnvironmentInfo › should include correct environment variables

    expect(received).toBe(expected) // Object.is equality

    Expected: "development"
    Received: "test"

      140 |       if (result) {
      141 |         expect(result.apiBase).toBeDefined();
    > 142 |         expect(result.mode).toBe('development');
          |                             ^
      143 |       }
      144 |       
      145 |       // Restore

      at Object.<anonymous> (src/services/__tests__/vc.test.ts:142:29)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle malformed API responses

    expect(received).rejects.toThrow(expected)

    Expected substring: "Invalid JSON"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:162:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:153:60)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle rate limiting

    expect(received).rejects.toThrow(expected)

    Expected substring: "Rate limit exceeded"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:175:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:165:50)

  ● VC Service - Core Business Logic › Error Handling & Edge Cases › should handle server errors

    expect(received).rejects.toThrow(expected)

    Expected substring: "Internal server error"
    Received message:   "resp.text is not a function"

          25 |   });
          26 |
        > 27 |   const text = await resp.text();
             |                           ^
          28 |
          29 |   let data: any;
          30 |   try {

      at src/services/vc.ts:27:27
      at fulfilled (src/services/vc.ts:5:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/services/__tests__/vc.test.ts:188:17
      at src/services/__tests__/vc.test.ts:8:71
      at Object.<anonymous>.__awaiter (src/services/__tests__/vc.test.ts:4:12)
      at Object.<anonymous> (src/services/__tests__/vc.test.ts:178:50)

FAIL src/components/analytics/__tests__/EventAnnotations.test.tsx
  ● EventAnnotations Component › getScoreAtDate › should return exact score for matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: undefined

      57 |     it('should return exact score for matching date', () => {
      58 |       const score = getScoreAtDate(mockScoreData, '2025-01-01');
    > 59 |       expect(score).toBe(65.5);
         |                     ^
      60 |     });
      61 |
      62 |     it('should return closest score for non-matching date', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:59:21)

  ● EventAnnotations Component › getScoreAtDate › should return closest score for non-matching date

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      62 |     it('should return closest score for non-matching date', () => {
      63 |       const score = getScoreAtDate(mockScoreData, '2025-01-04');
    > 64 |       expect(score).toBe(68.8); // Closest to 2025-01-03
         |                     ^
      65 |     });
      66 |
      67 |     it('should return default score for empty data', () => {

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:64:21)

  ● EventAnnotations Component › getScoreAtDate › should handle single data point

    expect(received).toBe(expected) // Object.is equality

    Expected: 65.5
    Received: 50

      73 |       const singlePoint = [mockScoreData[0]];
      74 |       const score = getScoreAtDate(singlePoint, '2025-01-10');
    > 75 |       expect(score).toBe(65.5);
         |                     ^
      76 |     });
      77 |   });
      78 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:75:21)

  ● EventAnnotations Component › filterEvents › should filter events by date range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      91 |       
      92 |       const filtered = filterEvents(mockEvents, dateRange);
    > 93 |       expect(filtered).toHaveLength(2);
         |                        ^
      94 |       expect(filtered[0].id).toBe('event-1');
      95 |       expect(filtered[1].id).toBe('event-2');
      96 |     });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:93:24)

  ● EventAnnotations Component › filterEvents › should apply both date range and type filters

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

      113 |       
      114 |       const filtered = filterEvents(mockEvents, dateRange, visibleTypes);
    > 115 |       expect(filtered).toHaveLength(1);
          |                        ^
      116 |       expect(filtered[0].id).toBe('event-1');
      117 |     });
      118 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:115:24)

  ● EventAnnotations Component › Event Positioning Logic › should calculate correct positions for events within data range

    expect(received).toHaveLength(expected)

    Expected length: 2
    Received length: 0
    Received array:  []

      140 |       });
      141 |       
    > 142 |       expect(eventsInRange).toHaveLength(2);
          |                             ^
      143 |       
      144 |       // Test score positioning
      145 |       const event1Score = getScoreAtDate(mockScoreData, eventsInRange[0].date);

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:142:29)

  ● EventAnnotations Component › Event Positioning Logic › should handle events outside data range gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 68.8
    Received: 50

      155 |       
      156 |       // Should return closest available score (2025-01-03)
    > 157 |       expect(score).toBe(68.8);
          |                     ^
      158 |     });
      159 |   });
      160 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:157:21)

  ● EventAnnotations Component › Performance Considerations › should handle large number of events efficiently

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

      204 |       const endTime = performance.now();
      205 |       
    > 206 |       expect(filtered.length).toBeGreaterThan(0);
          |                               ^
      207 |       expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      208 |     });
      209 |

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:206:31)

  ● EventAnnotations Component › Performance Considerations › should handle large score dataset efficiently

    expect(received).toBe(expected) // Object.is equality

    Expected: "number"
    Received: "undefined"

      220 |       const endTime = performance.now();
      221 |       
    > 222 |       expect(typeof score).toBe('number');
          |                            ^
      223 |       expect(endTime - startTime).toBeLessThan(5); // Should complete in < 5ms
      224 |     });
      225 |   });

      at Object.<anonymous> (src/components/analytics/__tests__/EventAnnotations.test.tsx:222:28)

FAIL src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts
  ● SafeArchivalSystem › executeArchival › should execute complete archival process with default options

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should create symlinks when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should run validation checks when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should generate rollback script when enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should process components in batches

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › executeArchival › should handle validation failure and rollback

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:188:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:176:68)

  ● SafeArchivalSystem › dependency resolution › should resolve component dependencies correctly

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › dependency resolution › should detect unresolved dependencies

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should create route redirectors for legacy routes

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › route redirectors › should generate redirect configuration file

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should generate comprehensive archive manifest

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should include component checksums for integrity verification

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › archive manifest › should preserve original file metadata

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should create executable rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include component restoration commands in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › rollback mechanism › should include validation checks in rollback script

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should run all required validation checks

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should save validation results

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › validation checks › should handle optional validation check failures gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      361 |
      362 |       // Should not throw for optional check failure
    > 363 |       await expect(
          |             ^
      364 |         SafeArchivalSystem.executeArchival(mockArchivalPlan)
      365 |       ).resolves.toBeDefined();
      366 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:363:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:354:82)

  ● SafeArchivalSystem › error handling › should handle validation command failures

    expect(received).rejects.toThrow(expected)

    Expected substring: "Required validation check failed"
    Received message:   "Validation failed after batch 1: glob is not defined"

          351 |           console.error(`Validation error: ${error.message}`);
          352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
        > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
              |                 ^
          354 |         }
          355 |       }
          356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)
      at Object.toThrow (node_modules/expect/build/index.js:218:22)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:500:17
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:493:64)

  ● SafeArchivalSystem › git history preservation › should preserve git history when option is enabled

    Validation failed after batch 1: glob is not defined

      351 |           console.error(`Validation error: ${error.message}`);
      352 |           await this.rollbackBatch(archivedComponents.slice(-batch.length));
    > 353 |           throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
          |                 ^
      354 |         }
      355 |       }
      356 |     }

      at Function.<anonymous> (src/lib/architecture-scanner/safe-archival-system.ts:353:17)
      at fulfilled (src/lib/architecture-scanner/safe-archival-system.ts:45:58)

  ● SafeArchivalSystem › git history preservation › should handle git history errors gracefully

    expect(received).resolves.toBeDefined()

    Received promise rejected instead of resolved
    Rejected to value: [Error: Validation failed after batch 1: glob is not defined]

      529 |
      530 |       // Should not throw for git history errors
    > 531 |       await expect(
          |             ^
      532 |         SafeArchivalSystem.executeArchival(mockArchivalPlan, options)
      533 |       ).resolves.toBeDefined();
      534 |     });

      at expect (node_modules/expect/build/index.js:113:15)
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:531:13
      at src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:46:71
      at Object.<anonymous>.__awaiter (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:42:12)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/safe-archival-system.test.ts:518:66)

FAIL src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts'

      18 | }));
      19 |
    > 20 | jest.mock('glob');
         |      ^
      21 |
      22 | const mockFs = fs as jest.Mocked<typeof fs>;
      23 | const mockGlob = glob as jest.MockedFunction<any>;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/kiro-system-purity-validator.test.ts:20:6)

FAIL src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts
  ● Test suite failed to run

    Cannot find module 'glob' from 'src/lib/architecture-scanner/architecture-compliance-checker.ts'

    Require stack:
      src/lib/architecture-scanner/architecture-compliance-checker.ts
      src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts

       6 | import { promises as fs } from 'fs';
       7 | import path from 'path';
    >  8 | import glob from 'glob';
         | ^
       9 |
      10 | export interface ComplianceRule {
      11 |   id: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (src/lib/architecture-scanner/architecture-compliance-checker.ts:8:1)
      at Object.<anonymous> (src/lib/architecture-scanner/__tests__/architecture-compliance-checker.test.ts:8:1)

FAIL src/services/__tests__/auth.test.ts
  ● Test suite failed to run

    TypeError: 'toString' called on an object that is not a valid instance of Location.

      30 | delete window.location;
      31 | // @ts-expect-error test shim
    > 32 | window.location = { 
         |                ^
      33 |   ...originalLocation, 
      34 |   href: 'http://localhost:3000', 
      35 |   hash: '', 

      at Object.toString (node_modules/jest-environment-jsdom/node_modules/jsdom/lib/jsdom/living/generated/Location.js:130:17)
          at String (<anonymous>)
          at Reflect.set (<anonymous>)
      at Object.<anonymous> (src/services/__tests__/auth.test.ts:32:16)


Test Suites: 8 failed, 16 passed, 24 total
Tests:       61 failed, 295 passed, 356 total
Snapshots:   0 total
Time:        8.329 s, estimated 48 s
Ran all test suites with tests matching "should".


### Next Steps
1. Address critical test failures before deployment
2. Review and fix failing user journeys
3. Optimize performance bottlenecks
4. Ensure rollback procedures are tested


## System Architecture Cleanup Status
- **Phase 1**: Architecture Discovery & Analysis ✅
- **Phase 2**: Selective Test Validation ✅
- **Phase 3**: Safe Legacy Component Archival ✅
- **Phase 4**: Protection & Governance ✅
- **Phase 5**: Comprehensive System Testing ⚠️

---
*Report generated by Comprehensive System Testing Script*
*Task 13: System Architecture Cleanup - Comprehensive Testing*
