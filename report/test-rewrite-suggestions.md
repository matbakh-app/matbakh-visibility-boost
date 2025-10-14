# 🔧 Test Rewrite Suggestions - Critical Fixes Required

## 🎯 Priority 1: Critical Interface Mismatches

### 1. Persona API Test Complete Rewrite (URGENT)

**File:** `src/services/__tests__/persona-api.test.ts`  
**Status:** 🔴 COMPLETE REWRITE REQUIRED  

**Current Problem:**
- Tests API that doesn't exist
- Wrong method signatures
- Wrong return types
- Wrong business logic assumptions

**Suggested Rewrite:**

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PersonaApiService, personaApi } from '../persona-api';
import { UserBehavior, PersonaType } from '@/types/persona';

describe('PersonaApiService', () => {
  let service: PersonaApiService;

  beforeEach(() => {
    service = PersonaApiService.getInstance();
    jest.clearAllMocks();
  });

  describe('Mock Mode Detection', () => {
    it('should detect Solo-Sarah for fast decision making', async () => {
      service.setMockEnabled(true);
      
      const behavior: UserBehavior = {
        decisionSpeed: 0.9,
        deviceType: 'mobile',
        sessionDuration: 300000, // 5 minutes
        clickPatterns: [
          { elementId: 'quick-action', elementType: 'button', timestamp: Date.now() }
        ],
        informationConsumption: {
          preferredContentLength: 'short'
        }
      };

      const result = await service.detectPersona(behavior);
      
      expect(result.detectedPersona).toBe('Solo-Sarah');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning).toContain('Fast decision-making');
    });

    it('should detect Bewahrer-Ben for cautious behavior', async () => {
      service.setMockEnabled(true);
      
      const behavior: UserBehavior = {
        decisionSpeed: 0.2,
        deviceType: 'desktop',
        sessionDuration: 900000, // 15 minutes
        clickPatterns: [
          { elementId: 'security-info', elementType: 'link', timestamp: Date.now() }
        ],
        informationConsumption: {
          preferredContentLength: 'long'
        }
      };

      const result = await service.detectPersona(behavior);
      
      expect(result.detectedPersona).toBe('Bewahrer-Ben');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning).toContain('cautious behavior');
    });
  });

  describe('Persona Configuration', () => {
    it('should return correct config for Solo-Sarah', async () => {
      service.setMockEnabled(true);
      
      const config = await service.getPersonaConfig('Solo-Sarah');
      
      expect(config.name).toBe('Solo Sarah');
      expect(config.onboardingSteps).toBe(3);
      expect(config.preferredFeatures).toContain('quick-actions');
    });
  });

  describe('Event Tracking', () => {
    it('should track persona events in mock mode', async () => {
      service.setMockEnabled(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.trackPersonaEvent({
        eventType: 'persona_detected',
        persona: 'Solo-Sarah',
        userId: 'user-123',
        data: { confidence: 0.8 }
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Mock persona event tracked:',
        expect.objectContaining({
          eventType: 'persona_detected',
          persona: 'Solo-Sarah'
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});
```

### 2. VC Service Test Alignment (MEDIUM)

**File:** `src/services/__tests__/vc.test.ts`  
**Status:** 🟡 PARTIAL REWRITE REQUIRED  

**Issues to Fix:**
- Return type assertions don't match implementation
- Missing error handling scenarios
- Incomplete parameter validation

**Suggested Updates:**

```typescript
// Update assertions to match actual return types
it('should handle successful visibility check initiation', async () => {
  const mockResponse = {
    ok: true,
    json: async () => ({ token: 'abc123' }), // Remove 'success' property
  };
  (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

  const result = await startVisibilityCheck('test@restaurant.com');
  
  expect(result).toEqual({ token: 'abc123' }); // Match actual return type
  expect(result.error).toBeUndefined();
});

it('should handle API errors correctly', async () => {
  const mockResponse = {
    ok: false,
    status: 500,
  };
  (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

  const result = await startVisibilityCheck('test@restaurant.com');
  
  expect(result).toEqual({ error: true }); // Match actual error return
  expect(result.token).toBeUndefined();
});
```

## 🎯 Priority 2: Enhancement Opportunities

### 3. AWS RDS Client Test Simplification

**File:** `src/services/__tests__/aws-rds-client.test.ts`  
**Status:** 🟡 SIMPLIFICATION RECOMMENDED  

**Issues:**
- Over-complex transaction scenarios
- May not reflect real usage patterns
- Could provide false confidence

**Suggestions:**
- Focus on core CRUD operations
- Simplify transaction tests
- Add more realistic error scenarios
- Test connection pooling behavior

### 4. Component Test Coverage Gaps

**Files:** Various component test files  
**Status:** 🟡 ENHANCEMENT NEEDED  

**Missing Areas:**
- User interaction flows
- Error boundary testing
- Accessibility testing
- Performance testing

## 🎯 Priority 3: New Test Requirements

### 5. Integration Test Suite

**Status:** 🟢 NEW IMPLEMENTATION  

**Needed Tests:**
- Service-to-service communication
- API contract validation
- End-to-end user journeys
- Cross-browser compatibility

### 6. Performance Test Suite

**Status:** 🟢 NEW IMPLEMENTATION  

**Needed Tests:**
- Response time validation
- Memory usage monitoring
- Concurrent user simulation
- Load testing scenarios

## 📋 Implementation Checklist

### Immediate (Before Test Run)
- [ ] Rewrite persona API tests completely
- [ ] Fix VC service return type assertions
- [ ] Validate all mock configurations
- [ ] Test environment variable polyfills

### Short-term (Next Sprint)
- [ ] Simplify AWS RDS client tests
- [ ] Add missing component tests
- [ ] Implement basic integration tests
- [ ] Add performance benchmarks

### Long-term (Next Quarter)
- [ ] Full end-to-end test suite
- [ ] Contract testing implementation
- [ ] Mutation testing setup
- [ ] Automated test quality metrics

## 🎯 Success Metrics

### Test Quality Indicators
- **Coverage:** >80% line coverage
- **Reliability:** <5% flaky test rate
- **Performance:** <30s total test runtime
- **Maintainability:** <10% test code duplication

### Business Logic Validation
- **Interface Accuracy:** 100% API contract compliance
- **Error Handling:** All error paths tested
- **Edge Cases:** Boundary conditions covered
- **Integration:** Service interactions validated

---

**Next Action:** Implement Priority 1 fixes before running test suite