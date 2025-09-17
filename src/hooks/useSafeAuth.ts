/**
 * Safe Auth Hook - 0-Error Tolerance
 * 
 * @deprecated Use useAuthUnified instead
 * @version 1.0.0 (deprecated)
 * @since 2024
 * @willBeRemovedIn v2.0
 * 
 * This hook will be removed in v2.0. Please migrate to useAuthUnified.
 * Migration guide: docs/test-playbook-auth-migration.md
 */

import { useAuthUnified } from './useAuthUnified';

export const useSafeAuth = () => {
  // Show deprecation warning in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ DEPRECATED: useSafeAuth is deprecated and will be removed in v2.0.\n' +
      '   Please migrate to useAuthUnified instead.\n' +
      '   Migration guide: docs/test-playbook-auth-migration.md'
    );
  }

  try {
    // Use the new, clean implementation
    return useAuthUnified();
  } catch (error) {
    console.warn('⚠️ Auth system failed, returning safe fallback:', error);
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Auth system unavailable',
      signIn: async () => { throw new Error('Auth not available'); },
      signOut: async () => { throw new Error('Auth not available'); },
    };
  }
};

// Komponente wurde nach src/components/SafeAuthLoader.tsx ausgelagert