/**
 * UI Mode Hook - Migrated to Generic useLocalStorage
 * 
 * @deprecated Use useUIMode from useLocalStorage instead
 * @version 1.0.0 (deprecated)
 * @since 2024
 * @willBeRemovedIn v2.0
 * 
 * This hook has been migrated to the generic useLocalStorage pattern.
 * Please import useUIMode from '@/hooks/useLocalStorage' instead.
 */

import { useUIMode as useUIModeGeneric } from './useLocalStorage';

/**
 * @deprecated Use useUIMode from useLocalStorage instead
 */
export function useUIMode() {
  // Show deprecation warning in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ DEPRECATED: useUIMode from useUIMode.ts is deprecated.\n' +
      '   Please import useUIMode from @/hooks/useLocalStorage instead.\n' +
      '   Migration: import { useUIMode } from "@/hooks/useLocalStorage";'
    );
  }

  return useUIModeGeneric();
}