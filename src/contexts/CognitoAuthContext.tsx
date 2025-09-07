/**
 * Cognito Authentication Context
 * Provides Cognito-based authentication with migration support
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Hub } from '@aws-amplify/core'; // FIXED: Correct import path
import {
  initializeCognito,
  getCurrentUser,
  isAuthenticated,
  signOut as cognitoSignOut,
  signInWithPassword,
  signUp,
  confirmSignUp,
  forgotPassword,
  forgotPasswordSubmit,
  federatedSignIn,
  startAuth,
  handleAuthCallback,
  CognitoUser,
  CognitoAuthError
} from '@/services/cognito-auth';

export interface CognitoAuthContextType {
  user: CognitoUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  signInWithPassword: (email: string, password: string) => Promise<CognitoUser>;
  signUp: (email: string, password: string, attributes?: Record<string, string>) => Promise<any>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
  signOut: () => Promise<void>;

  forgotPassword: (email: string) => Promise<any>;
  forgotPasswordSubmit: (email: string, code: string, newPassword: string) => Promise<any>;

  federatedSignIn: (provider: 'Google') => Promise<void>;

  startAuth: (email: string, name?: string) => Promise<{ ok: boolean; error?: string }>;

  checkAuthStatus: () => Promise<void>;
}

const CognitoAuthContext = createContext<CognitoAuthContextType | undefined>(undefined);

export const useCognitoAuth = (): CognitoAuthContextType => {
  const context = useContext(CognitoAuthContext);
  if (context === undefined) {
    throw new Error('useCognitoAuth must be used within a CognitoAuthProvider');
  }
  return context;
};

export const CognitoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeCognito();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const { token, error } = handleAuthCallback();
      if (token) {
        console.log('✅ Auth callback successful');
      } else if (error) {
        console.error('❌ Auth callback failed:', error);
      }

      const authenticated = await isAuthenticated();
      if (authenticated) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const hubListener = (data: any) => {
      const { payload } = data;
      console.log('Auth Hub Event:', payload.event);

      switch (payload.event) {
        case 'signIn':
          console.log('✅ User signed in');
          checkAuthStatus();
          break;
        case 'signOut':
          console.log('✅ User signed out');
          setUser(null);
          break;
        case 'signUp':
          console.log('✅ User signed up');
          break;
        case 'signIn_failure':
          console.error('❌ Sign in failure', payload.data);
          setUser(null);
          break;
        case 'tokenRefresh':
          console.log('🔄 Token refreshed');
          checkAuthStatus();
          break;
        case 'tokenRefresh_failure':
          console.error('❌ Token refresh failure');
          setUser(null);
          break;
      }
    };

    Hub.listen('auth', hubListener);
    return () => Hub.remove('auth', hubListener);
  }, [checkAuthStatus]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleSignInWithPassword = useCallback(async (email: string, password: string): Promise<CognitoUser> => {
    try {
      const user = await signInWithPassword(email, password);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, attributes?: Record<string, string>) => {
    try {
      return await signUp(email, password, attributes);
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }, []);

  const handleConfirmSignUp = useCallback(async (email: string, code: string) => {
    try {
      return await confirmSignUp(email, code);
    } catch (error) {
      console.error('Confirm sign up failed:', error);
      throw error;
    }
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      await cognitoSignOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }, []);

  const handleForgotPassword = useCallback(async (email: string) => {
    try {
      return await forgotPassword(email);
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  }, []);

  const handleForgotPasswordSubmit = useCallback(async (email: string, code: string, newPassword: string) => {
    try {
      return await forgotPasswordSubmit(email, code, newPassword);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }, []);

  const handleFederatedSignIn = useCallback(async (provider: 'Google') => {
    try {
      await federatedSignIn(provider);
    } catch (error) {
      console.error('Federated sign in failed:', error);
      throw error;
    }
  }, []);

  const handleStartAuth = useCallback(async (email: string, name?: string) => {
    try {
      return await startAuth(email, name);
    } catch (error) {
      console.error('Start auth failed:', error);
      throw error;
    }
  }, []);

  const contextValue: CognitoAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signInWithPassword: handleSignInWithPassword,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    signOut: handleSignOut,
    forgotPassword: handleForgotPassword,
    forgotPasswordSubmit: handleForgotPasswordSubmit,
    federatedSignIn: handleFederatedSignIn,
    startAuth: handleStartAuth,
    checkAuthStatus
  };

  return (
    <CognitoAuthContext.Provider value={contextValue}>
      {children}
    </CognitoAuthContext.Provider>
  );
};

export const useAuth = useCognitoAuth;
export type { CognitoUser };
