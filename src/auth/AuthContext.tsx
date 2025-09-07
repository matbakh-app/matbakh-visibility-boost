/**
 * Authentication Context for matbakh.app
 * Phase A3.2 - Cognito Auth Integration
 * 
 * Provides authentication state and methods throughout the React app
 * using AWS Cognito via Amplify
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Auth } from 'aws-amplify';
import type { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';

// Types for authentication state and methods
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: 'owner' | 'admin' | 'user';
  locale: 'de' | 'en';
  profileComplete: boolean;
  onboardingStep: number;
  businessId?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  given_name?: string;
  family_name?: string;
  locale?: 'de' | 'en';
  user_role?: 'owner' | 'admin' | 'user';
}

export interface AuthContextType {
  // User state
  user: CognitoUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<CognitoUser>;
  signUp: (userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  
  // Password management
  forgotPassword: (email: string) => Promise<void>;
  forgotPasswordSubmit: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  
  // Token management
  getCurrentSession: () => Promise<CognitoUserSession>;
  refreshTokens: () => Promise<void>;
  
  // Profile management
  updateUserAttributes: (attributes: Record<string, string>) => Promise<void>;
  getUserAttributes: () => Promise<Record<string, string>>;
  
  // Error state
  error: AuthError | null;
  clearError: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  
  // Token refresh timer
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error: any): AuthError => {
    console.error('Authentication error:', error);
    
    const authError: AuthError = {
      code: error.code || 'UnknownError',
      message: error.message || 'An unknown error occurred',
      details: error,
      retryable: false
    };

    // Map common Cognito errors to user-friendly messages
    switch (error.code) {
      case 'UserNotConfirmedException':
        authError.message = 'Please verify your email address to continue.';
        authError.retryable = true;
        break;
      case 'NotAuthorizedException':
        authError.message = 'Invalid email or password. Please try again.';
        break;
      case 'UserNotFoundException':
        authError.message = 'No account found with this email address.';
        break;
      case 'TooManyRequestsException':
        authError.message = 'Too many attempts. Please try again in a few minutes.';
        authError.retryable = true;
        break;
      case 'NetworkError':
        authError.message = 'Connection error. Please check your internet connection.';
        authError.retryable = true;
        break;
      case 'InvalidParameterException':
        authError.message = 'Invalid input. Please check your information and try again.';
        break;
      default:
        authError.message = 'Authentication failed. Please try again.';
        authError.retryable = true;
    }

    setError(authError);
    return authError;
  }, []);

  /**
   * Extract user profile from Cognito user attributes
   */
  const extractUserProfile = useCallback(async (cognitoUser: CognitoUser): Promise<UserProfile> => {
    try {
      const attributes = await Auth.userAttributes(cognitoUser);
      const attributeMap = attributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {} as Record<string, string>);

      return {
        id: cognitoUser.getUsername(),
        email: attributeMap.email || '',
        displayName: attributeMap.given_name 
          ? `${attributeMap.given_name} ${attributeMap.family_name || ''}`.trim()
          : attributeMap.email?.split('@')[0] || 'User',
        firstName: attributeMap.given_name,
        lastName: attributeMap.family_name,
        role: (attributeMap['custom:user_role'] as any) || 'owner',
        locale: (attributeMap['custom:locale'] as any) || 'de',
        profileComplete: attributeMap['custom:profile_complete'] === 'true',
        onboardingStep: parseInt(attributeMap['custom:onboarding_step'] || '0'),
        businessId: attributeMap['custom:business_id'],
        createdAt: attributeMap.created_at,
        lastLoginAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to extract user profile:', error);
      // Return minimal profile if attribute extraction fails
      return {
        id: cognitoUser.getUsername(),
        email: cognitoUser.getUsername(),
        displayName: 'User',
        role: 'owner',
        locale: 'de',
        profileComplete: false,
        onboardingStep: 0
      };
    }
  }, []);

  /**
   * Schedule automatic token refresh
   */
  const scheduleTokenRefresh = useCallback((session: CognitoUserSession) => {
    // Clear existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    const expiresIn = session.getAccessToken().getExpiration() * 1000 - Date.now();
    const refreshTime = Math.max(expiresIn - 5 * 60 * 1000, 0); // 5 minutes before expiry

    const timer = setTimeout(async () => {
      try {
        setIsRefreshing(true);
        const newSession = await Auth.currentSession();
        scheduleTokenRefresh(newSession);
        console.log('🔄 Tokens refreshed automatically');
      } catch (error) {
        console.error('Failed to refresh tokens:', error);
        handleAuthError(error);
        // Force re-authentication
        await signOut();
      } finally {
        setIsRefreshing(false);
      }
    }, refreshTime);

    setRefreshTimer(timer);
  }, [refreshTimer]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();

      const currentUser = await Auth.currentAuthenticatedUser();
      const session = await Auth.currentSession();
      
      if (currentUser && session.isValid()) {
        setUser(currentUser);
        setIsAuthenticated(true);
        
        // Extract user profile
        const userProfile = await extractUserProfile(currentUser);
        setProfile(userProfile);
        
        // Schedule token refresh
        scheduleTokenRefresh(session);
        
        console.log('✅ User authenticated:', userProfile.email);
      }
    } catch (error) {
      // User not authenticated - this is normal for first visit
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      console.log('ℹ️ No authenticated user found');
    } finally {
      setIsLoading(false);
    }
  }, [extractUserProfile, scheduleTokenRefresh, clearError]);

  /**
   * Sign in user
   */
  const signIn = useCallback(async (email: string, password: string): Promise<CognitoUser> => {
    try {
      setIsLoading(true);
      clearError();

      const cognitoUser = await Auth.signIn(email, password);
      
      if (cognitoUser.challengeName === 'NEW_PASSWORD_REQUIRED') {
        // Handle new password required challenge
        throw new Error('New password required. Please contact support.');
      }

      setUser(cognitoUser);
      setIsAuthenticated(true);
      
      // Extract user profile
      const userProfile = await extractUserProfile(cognitoUser);
      setProfile(userProfile);
      
      // Schedule token refresh
      const session = await Auth.currentSession();
      scheduleTokenRefresh(session);
      
      console.log('✅ User signed in:', userProfile.email);
      return cognitoUser;
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [extractUserProfile, scheduleTokenRefresh, clearError, handleAuthError]);

  /**
   * Sign up new user
   */
  const signUp = useCallback(async (userData: SignUpData): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();

      const { email, password, ...attributes } = userData;
      
      await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          given_name: attributes.given_name || '',
          family_name: attributes.family_name || '',
          'custom:locale': attributes.locale || 'de',
          'custom:user_role': attributes.user_role || 'owner'
        }
      });

      console.log('✅ User signed up successfully:', email);
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleAuthError]);

  /**
   * Confirm sign up with verification code
   */
  const confirmSignUp = useCallback(async (email: string, code: string): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();

      await Auth.confirmSignUp(email, code);
      console.log('✅ Email confirmed for:', email);
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleAuthError]);

  /**
   * Resend confirmation code
   */
  const resendConfirmationCode = useCallback(async (email: string): Promise<void> => {
    try {
      clearError();
      await Auth.resendSignUp(email);
      console.log('✅ Confirmation code resent to:', email);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  }, [clearError, handleAuthError]);

  /**
   * Sign out user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();

      // Clear refresh timer
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        setRefreshTimer(null);
      }

      await Auth.signOut();
      
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      
      console.log('✅ User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state even if sign out fails
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTimer, clearError]);

  /**
   * Forgot password
   */
  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      clearError();
      await Auth.forgotPassword(email);
      console.log('✅ Password reset code sent to:', email);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  }, [clearError, handleAuthError]);

  /**
   * Submit forgot password with new password
   */
  const forgotPasswordSubmit = useCallback(async (
    email: string, 
    code: string, 
    newPassword: string
  ): Promise<void> => {
    try {
      clearError();
      await Auth.forgotPasswordSubmit(email, code, newPassword);
      console.log('✅ Password reset successful for:', email);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  }, [clearError, handleAuthError]);

  /**
   * Change password for authenticated user
   */
  const changePassword = useCallback(async (
    oldPassword: string, 
    newPassword: string
  ): Promise<void> => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      clearError();
      await Auth.changePassword(user, oldPassword, newPassword);
      console.log('✅ Password changed successfully');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  }, [user, clearError, handleAuthError]);

  /**
   * Get current session
   */
  const getCurrentSession = useCallback(async (): Promise<CognitoUserSession> => {
    try {
      return await Auth.currentSession();
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  }, [handleAuthError]);

  /**
   * Manually refresh tokens
   */
  const refreshTokens = useCallback(async (): Promise<void> => {
    try {
      setIsRefreshing(true);
      const session = await Auth.currentSession();
      scheduleTokenRefresh(session);
      console.log('🔄 Tokens refreshed manually');
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [scheduleTokenRefresh, handleAuthError]);

  /**
   * Update user attributes
   */
  const updateUserAttributes = useCallback(async (
    attributes: Record<string, string>
  ): Promise<void> => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      clearError();
      await Auth.updateUserAttributes(user, attributes);
      
      // Refresh user profile
      const updatedProfile = await extractUserProfile(user);
      setProfile(updatedProfile);
      
      console.log('✅ User attributes updated');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  }, [user, extractUserProfile, clearError, handleAuthError]);

  /**
   * Get user attributes
   */
  const getUserAttributes = useCallback(async (): Promise<Record<string, string>> => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      const attributes = await Auth.userAttributes(user);
      return attributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {} as Record<string, string>);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  }, [user, handleAuthError]);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
    
    // Cleanup on unmount
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [initializeAuth]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State
    user,
    profile,
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    
    // Methods
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    forgotPasswordSubmit,
    changePassword,
    getCurrentSession,
    refreshTokens,
    updateUserAttributes,
    getUserAttributes,
    clearError
  }), [
    user,
    profile,
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    forgotPasswordSubmit,
    changePassword,
    getCurrentSession,
    refreshTokens,
    updateUserAttributes,
    getUserAttributes,
    clearError
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;