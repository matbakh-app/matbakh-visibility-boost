/**
 * useAuthUnified - Clean Auth Hook Implementation
 * 
 * JTBD: "Get consistent, reliable auth state with minimal complexity"
 * 
 * This is the NEW, clean implementation that replaces the circular dependency
 * chain of useSafeAuth → useUnifiedAuth → AuthContext
 * 
 * @version 2.0.0
 * @since 2025-01-09
 */

import { useAuth as useSupabaseAuth } from '@/contexts/AuthContext';

/**
 * Unified Auth State Interface - Simplified and Clean
 */
export interface AuthUnifiedState {
  // Core Auth State
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Admin & Profile State
  isAdmin: boolean;
  hasCompletedUserProfile: boolean;
  
  // Auth Actions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Modal State (for VC flows)
  showAuthModal: boolean;
  authModalMode: 'login' | 'register';
  vcData: any | null;
  openAuthModal: (mode: 'login' | 'register', vcData?: any) => void;
  closeAuthModal: () => void;
  
  // Error State
  oauthError: string | null;
}

/**
 * useAuthUnified - The NEW standard auth hook
 * 
 * Direct connection to AuthContext without circular dependencies
 * Provides clean, typed interface for all auth operations
 */
export const useAuthUnified = (): AuthUnifiedState => {
  try {
    const auth = useSupabaseAuth();
    
    return {
      // Core State - Direct mapping from AuthContext
      user: auth.user,
      session: auth.session,
      isAuthenticated: auth.session !== null && auth.user !== null,
      isLoading: auth.loading,
      
      // Admin & Profile State
      isAdmin: auth.isAdmin,
      hasCompletedUserProfile: auth.hasCompletedUserProfile,
      
      // Auth Actions - Direct passthrough
      signIn: auth.signIn,
      signInWithGoogle: auth.signInWithGoogle,
      signInWithFacebook: auth.signInWithFacebook,
      signOut: auth.signOut,
      
      // Modal State - Direct passthrough
      showAuthModal: auth.showAuthModal,
      authModalMode: auth.authModalMode,
      vcData: auth.vcData,
      openAuthModal: auth.openAuthModal,
      closeAuthModal: auth.closeAuthModal,
      
      // Error State
      oauthError: auth.oauthError,
    };
  } catch (error) {
    // Fallback for cases where AuthContext is not available
    console.warn('⚠️ AuthContext not available, returning safe fallback:', error);
    
    return {
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
      hasCompletedUserProfile: false,
      signIn: async () => ({ error: 'Auth not available' }),
      signInWithGoogle: async () => { throw new Error('Auth not available'); },
      signInWithFacebook: async () => { throw new Error('Auth not available'); },
      signOut: async () => { throw new Error('Auth not available'); },
      showAuthModal: false,
      authModalMode: 'login',
      vcData: null,
      openAuthModal: () => {},
      closeAuthModal: () => {},
      oauthError: 'Auth system unavailable',
    };
  }
};

/**
 * Default export for easy migration
 */
export default useAuthUnified;

/**
 * Type export for components that need the interface
 */
export type { AuthUnifiedState };