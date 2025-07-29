# Canonical Categories Migration Guide

## Overview
This guide outlines the step-by-step process to migrate from slug-based category mapping to UUID-based canonical categories system.

## Pre-Migration Setup

### 1. Database Migration
Run the SQL migration script to create the new tables and populate data:

```sql
-- Execute the migration script provided earlier
-- This creates main_categories, updates gmb_categories, and sets up cross-tags
```

### 2. Validation Queries

After migration, run these validation queries:

```sql
-- Check all main categories are seeded
SELECT slug, id, name_de, is_active FROM public.main_categories ORDER BY sort_order;

-- Verify gmb_categories have main_category_id populated
SELECT name_de, haupt_kategorie, main_category_id 
FROM public.gmb_categories 
WHERE main_category_id IS NULL;
-- Result should be 0 rows

-- Check cross-tags are properly mapped
SELECT * FROM public.category_cross_tags WHERE target_main_category_id IS NULL;
-- Result should be 0 rows
```

## Code Migration Steps

### Step 1: Replace Hook Imports

Update all components that currently use the old hook:

```typescript
// OLD
import { useMainCategoryMapping } from "@/hooks/useMainCategoryMapping";
import { useSubCategoriesWithCrossTags } from "@/hooks/useSubCategoriesWithCrossTags";

// NEW
import { useMainCategoryMappingNew } from "@/hooks/useMainCategoryMappingNew";
import { useSubCategoriesWithCrossTagsNew } from "@/hooks/useSubCategoriesWithCrossTagsNew";
```

### Step 2: Update Component Logic

In components like `SubCategorySelector`, update the logic to work with UUIDs:

```typescript
// OLD - slug-based
const { slugsToIds, getCanonicalNameBySlug } = useMainCategoryMapping();
const { allSubCategories } = useSubCategoriesWithCrossTags(selectedMainCategories, language);

// NEW - UUID-based
const { uuidsBySlugs, nameById, loading } = useMainCategoryMappingNew();
const selectedMainCategoryUUIDs = uuidsBySlugs(selectedMainCategories);
const { allSubCategories } = useSubCategoriesWithCrossTagsNew(selectedMainCategoryUUIDs, language);
```

### Step 3: Update Data Flow

Ensure all category-related data flows use UUIDs:

1. **Form Submissions**: Convert slugs to UUIDs before saving
2. **Database Queries**: Use `main_category_id` instead of string matching
3. **API Responses**: Include both slugs (for UI) and UUIDs (for logic)

## Testing Checklist

### Functional Testing
- [ ] Category selection works in onboarding forms
- [ ] Subcategory suggestions appear correctly
- [ ] Cross-tag relationships display relevant categories
- [ ] Search and filtering functions properly
- [ ] Multiple language support (DE/EN) works

### Performance Testing
- [ ] Category loading is fast (< 100ms)
- [ ] Subcategory queries with cross-tags complete quickly
- [ ] No duplicate categories in suggestions
- [ ] Memory usage is reasonable with large category sets

### Data Integrity Testing
- [ ] All legacy categories have corresponding UUIDs
- [ ] Cross-tag relationships are bidirectional where expected
- [ ] No orphaned category references
- [ ] Audit logs capture category changes

## Rollback Plan

If issues arise, follow this rollback procedure:

1. **Immediate**: Switch components back to old hooks
2. **Data**: Restore from pre-migration backup
3. **Code**: Revert to previous commit
4. **Validation**: Run full test suite

## Post-Migration Tasks

### Step 1: Cleanup Legacy Code
After successful migration and testing:

```typescript
// Remove old implementations
rm src/hooks/useMainCategoryMapping.ts
rm src/hooks/useSubCategoriesWithCrossTags.ts

// Rename new implementations
mv src/hooks/useMainCategoryMappingNew.ts src/hooks/useMainCategoryMapping.ts
mv src/hooks/useSubCategoriesWithCrossTagsNew.ts src/hooks/useSubCategoriesWithCrossTags.ts
```

### Step 2: Add Constraints
Once all data is validated, add stricter constraints:

```sql
-- Enforce NOT NULL on main_category_id
ALTER TABLE public.gmb_categories
ALTER COLUMN main_category_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.gmb_categories
ADD CONSTRAINT fk_gmb_categories_main_category
FOREIGN KEY (main_category_id) REFERENCES public.main_categories(id);
```

### Step 3: Update Documentation
- [ ] Update API documentation with new data structures
- [ ] Update component documentation
- [ ] Create developer onboarding guide for new system

## Monitoring

After migration, monitor these metrics:

1. **Performance**:
   - Category loading times
   - Subcategory query performance
   - Cross-tag query efficiency

2. **Usage**:
   - Category selection patterns
   - Search query success rates
   - Cross-tag discovery rates

3. **Errors**:
   - Failed category lookups
   - Missing UUID mappings
   - Database constraint violations

## Benefits After Migration

✅ **Scalability**: Support for unlimited markets and languages
✅ **Performance**: Indexed UUID-based queries
✅ **Maintainability**: Clean separation between UI and data
✅ **Extensibility**: Easy to add new category features
✅ **Data Integrity**: Foreign key constraints and validation
✅ **Analytics**: Proper tracking of category usage patterns

## Support

For issues during migration:
1. Check validation queries first
2. Review error logs in Supabase
3. Test with minimal data set
4. Use rollback plan if needed