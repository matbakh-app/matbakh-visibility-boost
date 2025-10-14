/**
 * Unified Auth Hook - Single Interface for All Auth Systems
 * 
 * @deprecated Use useAuthUnified instead
 * @version 1.0.0 (deprecated)
 * @since 2024
 * @willBeRemovedIn v2.0
 * 
 * This hook created circular dependencies and will be removed in v2.0.
 * Please migrate to useAuthUnified for a cleaner implementation.
 * Migration guide: docs/test-playbook-auth-migration.md
 */

import { useAuthUnified } from './useAuthUnified';

/**
 * @deprecated Use AuthUnifiedState from useAuthUnified instead
 */
export interface UnifiedAuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn?: (email: string, password: string) => Promise<any>;
  signOut?: () => Promise<void>;
  error?: string | null;
}

/**
 * @deprecated Use useAuthUnified instead
 */
export const useUnifiedAuth = (): UnifiedAuthState => {
  // Show deprecation warning in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ DEPRECATED: useUnifiedAuth is deprecated and will be removed in v2.0.\n' +
      '   This hook created circular dependencies.\n' +
      '   Please migrate to useAuthUnified instead.\n' +
      '   Migration guide: docs/test-playbook-auth-migration.md'
    );
  }

  try {
    // Delegate to the new, clean implementation
    const auth = useAuthUnified();
    
    // Map to old interface for backward compatibility
    return {
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      signIn: auth.signIn,
      signOut: auth.signOut,
      error: auth.oauthError,
    };
  } catch (error) {
    console.warn('⚠️ Auth system not available, returning fallback');
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Auth system unavailable',
    };
  }
};

/**
 * @deprecated Use useAuthUnified instead
 */
export const useAuth = useUnifiedAuth;
export default useUnifiedAuth;