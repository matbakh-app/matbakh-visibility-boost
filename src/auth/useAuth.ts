/**
 * useAuth Hook for matbakh.app
 * Phase A3.2 - Cognito Auth Integration
 * 
 * Custom hook to access authentication context throughout the app
 */

import { useContext } from 'react';
import AuthContext, { type AuthContextType } from './AuthContext';

/**
 * Custom hook to use the authentication context
 * 
 * @returns AuthContextType - Authentication state and methods
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, signIn, signOut } = useAuth();
 * 
 * if (isAuthenticated) {
 *   return <Dashboard user={user} onSignOut={signOut} />;
 * }
 * 
 * return <LoginForm onSignIn={signIn} />;
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }
  
  return context;
};

/**
 * Hook to check if user is authenticated
 * Useful for conditional rendering without full auth context
 * 
 * @returns boolean - Authentication status
 * 
 * @example
 * ```tsx
 * const isAuthenticated = useIsAuthenticated();
 * 
 * return (
 *   <div>
 *     {isAuthenticated ? 'Welcome back!' : 'Please log in'}
 *   </div>
 * );
 * ```
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook to get current user profile
 * Returns null if user is not authenticated
 * 
 * @returns UserProfile | null - Current user profile or null
 * 
 * @example
 * ```tsx
 * const userProfile = useUserProfile();
 * 
 * if (userProfile) {
 *   return <div>Hello, {userProfile.displayName}!</div>;
 * }
 * 
 * return <div>Not logged in</div>;
 * ```
 */
export const useUserProfile = () => {
  const { profile } = useAuth();
  return profile;
};

/**
 * Hook to get authentication loading state
 * Useful for showing loading spinners during auth operations
 * 
 * @returns boolean - Loading state
 * 
 * @example
 * ```tsx
 * const isLoading = useAuthLoading();
 * 
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 * ```
 */
export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuth();
  return isLoading;
};

/**
 * Hook to get authentication error state
 * Returns null if no error
 * 
 * @returns AuthError | null - Current error or null
 * 
 * @example
 * ```tsx
 * const authError = useAuthError();
 * 
 * if (authError) {
 *   return <ErrorMessage error={authError} />;
 * }
 * ```
 */
export const useAuthError = () => {
  const { error } = useAuth();
  return error;
};

/**
 * Hook for authentication actions
 * Returns only the action methods without state
 * 
 * @returns Object with authentication methods
 * 
 * @example
 * ```tsx
 * const { signIn, signOut, signUp } = useAuthActions();
 * 
 * const handleLogin = async (email: string, password: string) => {
 *   try {
 *     await signIn(email, password);
 *     // Handle successful login
 *   } catch (error) {
 *     // Handle login error
 *   }
 * };
 * ```
 */
export const useAuthActions = () => {
  const {
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    forgotPasswordSubmit,
    changePassword,
    updateUserAttributes,
    clearError
  } = useAuth();
  
  return {
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    forgotPasswordSubmit,
    changePassword,
    updateUserAttributes,
    clearError
  };
};

/**
 * Hook for token management
 * Returns token-related methods and state
 * 
 * @returns Object with token methods and refresh state
 * 
 * @example
 * ```tsx
 * const { getCurrentSession, refreshTokens, isRefreshing } = useTokens();
 * 
 * const handleAPICall = async () => {
 *   try {
 *     const session = await getCurrentSession();
 *     const token = session.getAccessToken().getJwtToken();
 *     // Use token for API call
 *   } catch (error) {
 *     // Handle token error
 *   }
 * };
 * ```
 */
export const useTokens = () => {
  const { getCurrentSession, refreshTokens, isRefreshing } = useAuth();
  
  return {
    getCurrentSession,
    refreshTokens,
    isRefreshing
  };
};

// Re-export the main hook as default
export default useAuth;