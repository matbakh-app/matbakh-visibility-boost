# Kiro Purity Migration Guide

## Overview

This guide helps systematically migrate the 59 detected violations to achieve 95%+ purity score.

## Violation Triage (Batch Plan)

### Group A: Hooks using Supabase (Bulk) - ~18 items

**Files to migrate:**
- `useKpi.ts`, `useKpiSummary.ts`
- `useGoogleConnection.ts`, `useDashboardData.ts`
- `useBusinessContactData.ts`, `useAiRecommendations.ts`
- `useBedrockCategorySuggestions.ts`, `useDiversifiedCategorySelection.ts`
- `useEnhancedVisibilityCheck.ts`, `useFacebookConversions.ts`
- `useFeatureAccess.ts`, `usePartnerProfile.ts`
- `useRealtimeConnection.ts`, `useSmartCategorySelection.ts`

**Migration Pattern:**
```typescript
// BEFORE
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(...)
const { data } = await supabase.from('kpis').select('*').eq('restaurant_id', id)

// AFTER
import { dataApi } from '@/lib/data';
const { score, trends } = await dataApi.kpis.summary(id);
```

**Quick Migration Steps:**
1. Replace Supabase imports with `import { dataApi } from '@/lib/data'`
2. Replace `supabase.from('table')...` with `dataApi.table.method(...)`
3. If endpoint doesn't exist yet, it will throw a clear error with migration instructions
4. Add `// @kiro-allow supabase` temporarily if needed during transition

### Group B: UI Components (Supabase/Lovable) - ~10 items

**Files to migrate:**
- `ConsentBanner.tsx`, `Notes.tsx`, `CheckoutButton.tsx`
- `Logo.tsx` (Lovable), `ContactForm.tsx`

**Migration Pattern:**
```typescript
// BEFORE - Direct Supabase in component
const MyComponent = () => {
  const supabase = createClient(...)
  const [data, setData] = useState()
  
  useEffect(() => {
    supabase.from('table').select().then(setData)
  }, [])
}

// AFTER - Use data adapter via hook
const MyComponent = () => {
  const { data } = useMyData() // Hook uses dataApi internally
}
```

**For Logo.tsx (Lovable):**
- Replace with static SVG or asset import
- Remove Lovable-generated component entirely

### Group C: Guards & Realtime - ~5 items

**Files to migrate:**
- `guards/onboardingGuard.ts`
- `useRealtimeConnection.ts`

**Migration Strategy:**
- **Guards**: Replace Supabase auth checks with AWS Cognito/JWT validation
- **Realtime**: Consider WebSocket/SSE alternative or polling until AWS solution ready
- **Temporary**: Add `// @kiro-allow supabase` with TODO comment

### Group D: Edge Cases & False Positives

**Files to review:**
- `ContactForm.tsx` - May just contain "supabase" in comments
- Any file with legitimate transitional needs

**Solutions:**
- Add `// @kiro-allow supabase` at top of file
- Update regex patterns to ignore comments if needed
- Add to config allowlist: `"allow": { "supabase": ["src/path/to/file.tsx"] }`

## Migration Execution Plan

### Phase 1: Quick Wins (Target: 95%+ score)
1. **Logo.tsx**: Replace Lovable component with static asset
2. **Hooks bulk migration**: Use data adapter for 10-15 hooks
3. **UI components**: Move data calls to hooks using adapter

**Expected Impact**: ~40-50 violations resolved, score jumps to 95%+

### Phase 2: Complex Migrations
1. **Guards**: Implement AWS Cognito validation
2. **Realtime**: Implement WebSocket/SSE alternative
3. **Remaining edge cases**: Case-by-case analysis

### Phase 3: Cleanup
1. Remove temporary `@kiro-allow` comments
2. Implement remaining adapter endpoints
3. Achieve 98%+ score for Gold certification

## Using the Data Adapter

### 1. Basic Usage
```typescript
import { dataApi } from '@/lib/data';

// Replace Supabase calls
const kpiData = await dataApi.kpis.summary(restaurantId);
const profile = await dataApi.auth.profile();
```

### 2. Handling Not-Yet-Migrated Endpoints
```typescript
// Adapter will throw clear error with migration instructions
try {
  const data = await dataApi.features.complexFeature();
} catch (error) {
  // Error message: "complexFeature endpoint not yet migrated to AWS. Add to migration backlog."
  console.warn('Feature not ready, using fallback');
  // Implement fallback or temporary solution
}
```

### 3. Adding New Endpoints
```typescript
// In src/lib/data/index.ts
export const dataApi = {
  // ... existing endpoints
  
  newFeature: {
    getData(id: string) {
      return http<{ data: any }>(`/api/new-feature/${encodeURIComponent(id)}`);
    }
  }
};
```

## Configuration Management

### 1. Per-File Allowlist
```json
// kiro-purity.config.json
{
  "allow": {
    "supabase": [
      "src/components/ContactForm.tsx",
      "src/guards/onboardingGuard.ts"
    ]
  }
}
```

### 2. Per-File Override Comments
```typescript
// @kiro-allow supabase
// TODO: Migrate to AWS Cognito after auth refactor
import { createClient } from '@supabase/supabase-js';
```

### 3. Threshold Configuration
```json
{
  "thresholds": {
    "overall": 95,
    "auth": 90,
    "vc": 90,
    "apis": 85
  }
}
```

## Testing Your Changes

### 1. Local Testing
```bash
# Quick check
npm run kiro:purity

# Verbose output
npm run kiro:purity -- --verbose

# Strict mode (higher thresholds)
npm run kiro:purity:strict
```

### 2. CI Integration
- PR checks automatically run purity validation
- Fails if score drops below thresholds
- Generates detailed report with recommendations

### 3. Monitoring Progress
```bash
# Check specific patterns
npm run kiro:purity -- --patterns="src/hooks/**/*.ts"

# Focus on specific categories
npm run kiro:purity -- --patterns="src/components/auth/**/*.tsx"
```

## Success Metrics

### Target Scores
- **Overall**: 95%+ (required for certification)
- **Auth**: 90%+ (critical security components)
- **VC**: 90%+ (core business logic)
- **APIs**: 85%+ (data layer)

### Migration Milestones
1. **Phase 1 Complete**: 95%+ overall score
2. **Phase 2 Complete**: 97%+ overall score, all categories above thresholds
3. **Phase 3 Complete**: 98%+ overall score (Gold certification)

## Troubleshooting

### Common Issues
1. **False Positives**: Add `@kiro-allow` comment or config allowlist
2. **Missing Endpoints**: Implement in data adapter or add stub
3. **Complex Dependencies**: Use gradual migration with temporary allows

### Getting Help
1. Check the data adapter for available endpoints
2. Review violation details in purity report
3. Use `--verbose` flag for detailed analysis
4. Check CI artifacts for full reports

## Next Steps

1. Start with Group A (hooks) for maximum impact
2. Use the data adapter layer for clean migrations
3. Monitor progress with automated checks
4. Achieve 95%+ score for production readiness