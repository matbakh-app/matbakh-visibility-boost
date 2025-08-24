# Old Flow Archive

This directory contains archived components and flows that have been replaced by the new React Router-based navigation system.

## Migration Complete ✅

**Cleanup Steps Completed:**
1. ✅ Archived old `Figma_Make` components with `activeView`-based navigation  
2. ✅ Removed all `useAppNavigation` hooks and `navigateToView` calls
3. ✅ Migrated to React Router (`useNavigate`, `Link` components)
4. ✅ Updated all profile components to use proper routing
5. ✅ Fixed TypeScript errors in Storybook and archived files

## Archived Components

- `Figma_Make/` - Old Figma prototype components with activeView-based navigation
- `ProfileRoutes-v1.tsx` - Old profile routing logic (replaced by App.tsx routes)

## Current Active Routes

- `/profile` → MyProfile component (protected)
- `/company-profile` → CompanyProfile component (protected)  
- All navigation uses React Router with proper history support

These archived files are kept for reference only and should not be imported or used in the active codebase.