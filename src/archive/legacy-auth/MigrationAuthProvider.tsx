/**
 * Migration Auth Provider for matbakh.app
 * Phase A3.2 - Cognito Auth Integration
 * 
 * This provider wraps both Supabase and Cognito authentication
 * to support gradual migration from Supabase to AWS Cognito
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Auth } from 'aws-amplify';
import { configureAmplify } from './AmplifyConfig';
import { AuthProvider as SupabaseAuthProvider, useAuth as useSupabaseAuth } from '@/contexts/AuthContext';
import type { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js';

// Feature flags for migration control
const FEATURE_FLAGS = {
  ENABLE_COGNITO: import.meta.env.VITE_ENABLE_COGNITO === 'true',
  DUAL_AUTH_MODE: import.meta.env.VITE_DUAL_AUTH_MODE === 'true',
  FORCE_COGNITO: import.meta.env.VITE_FORCE_COGNITO === 'true'
};

// Migration Auth Context Type
interface MigrationAuthContextType {
  // Current auth provider
  activeProvider: 'supabase' | 'cognito';
  
  // Cognito-specific state
  cognitoUser: CognitoUser | null;
  cognitoSession: CognitoUserSession | null;
  cognitoLoading: boolean;
  cognitoError: string | null;
  
  // Unified auth methods
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, attributes?: Record<string, string>) => Promise<any>;
  signOut: () => Promise<void>;
  
  // Migration methods
  migrateToCognito: () => Promise<void>;
  checkMigrationStatus: () => Promise<boolean>;
  
  // Utility methods
  getCurrentUser: () => any;
  isAuthenticated: () => boolean;
  getAuthToken: () => Promise<string | null>;
}

const MigrationAuthContext = createContext<MigrationAuthContextType | undefined>(undefined);

// Migration Auth Provider Component
export const MigrationAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cognito state
  const [cognitoUser, setCognitoUser] = useState<CognitoUser | null>(null);
  const [cognitoSession, setCognitoSession] = useState<CognitoUserSession | null>(null);
  const [cognitoLoading, setCognitoLoading] = useState(true);
  const [cognitoError, setCognitoError] = useState<string | null>(null);
  
  // Migration state
  const [activeProvider, setActiveProvider] = useState<'supabase' | 'cognito'>('supabase');
  
  // Get Supabase auth context
  const supabaseAuth = useSupabaseAuth();

  /**
   * Initialize Amplify and Cognito auth state
   */
  useEffect(() => {
    const initializeCognito = async () => {
      try {
        // Configure Amplify
        configureAmplify();
        
        // Check if Cognito is enabled
        if (!FEATURE_FLAGS.ENABLE_COGNITO) {
          console.log('🔐 Cognito disabled, using Supabase only');
          setCognitoLoading(false);
          return;
        }

        // Try to get current Cognito user
        try {
          const currentUser = await Auth.currentAuthenticatedUser();
          const session = await Auth.currentSession();
          
          if (currentUser && session.isValid()) {
            setCognitoUser(currentUser);
            setCognitoSession(session);
            
            // If force Cognito or dual mode, switch to Cognito
            if (FEATURE_FLAGS.FORCE_COGNITO || FEATURE_FLAGS.DUAL_AUTH_MODE) {
              setActiveProvider('cognito');
            }
            
            console.log('✅ Cognito user authenticated:', currentUser.getUsername());
          }
        } catch (error) {
          // No Cognito user - this is normal
          console.log('ℹ️ No Cognito user found, using Supabase');
        }
      } catch (error) {
        console.error('❌ Failed to initialize Cognito:', error);
        setCognitoError('Failed to initialize authentication');
      } finally {
        setCognitoLoading(false);
      }
    };

    initializeCognito();
  }, []);

  /**
   * Unified sign in method
   */
  const signIn = useCallback(async (email: string, password: string) => {
    if (activeProvider === 'cognito' || FEATURE_FLAGS.FORCE_COGNITO) {
      try {
        setCognitoLoading(true);
        setCognitoError(null);
        
        const cognitoUser = await Auth.signIn(email, password);
        const session = await Auth.currentSession();
        
        setCognitoUser(cognitoUser);
        setCognitoSession(session);
        setActiveProvider('cognito');
        
        console.log('✅ Cognito sign in successful');
        return { user: cognitoUser, error: null };
      } catch (error) {
        console.error('❌ Cognito sign in failed:', error);
        setCognitoError(error instanceof Error ? error.message : 'Sign in failed');
        
        // Fallback to Supabase if Cognito fails and dual mode is enabled
        if (FEATURE_FLAGS.DUAL_AUTH_MODE) {
          console.log('🔄 Falling back to Supabase auth');
          return supabaseAuth.signIn(email, password);
        }
        
        throw error;
      } finally {
        setCognitoLoading(false);
      }
    } else {
      // Use Supabase auth
      return supabaseAuth.signIn(email, password);
    }
  }, [activeProvider, supabaseAuth]);

  /**
   * Unified sign up method
   */
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    attributes?: Record<string, string>
  ) => {
    if (activeProvider === 'cognito' || FEATURE_FLAGS.FORCE_COGNITO) {
      try {
        setCognitoLoading(true);
        setCognitoError(null);
        
        const result = await Auth.signUp({
          username: email,
          password,
          attributes: {
            email,
            ...attributes
          }
        });
        
        console.log('✅ Cognito sign up successful');
        return { user: result.user, error: null };
      } catch (error) {
        console.error('❌ Cognito sign up failed:', error);
        setCognitoError(error instanceof Error ? error.message : 'Sign up failed');
        
        // Fallback to Supabase if Cognito fails and dual mode is enabled
        if (FEATURE_FLAGS.DUAL_AUTH_MODE) {
          console.log('🔄 Falling back to Supabase auth');
          // Note: Supabase signUp method signature might be different
          // This would need to be adapted based on the actual Supabase implementation
        }
        
        throw error;
      } finally {
        setCognitoLoading(false);
      }
    } else {
      // Use Supabase auth - would need to implement based on Supabase API
      throw new Error('Supabase sign up not implemented in migration provider');
    }
  }, [activeProvider]);

  /**
   * Unified sign out method
   */
  const signOut = useCallback(async () => {
    try {
      if (activeProvider === 'cognito' || cognitoUser) {
        await Auth.signOut();
        setCognitoUser(null);
        setCognitoSession(null);
      }
      
      // Always sign out from Supabase as well in dual mode
      if (FEATURE_FLAGS.DUAL_AUTH_MODE || activeProvider === 'supabase') {
        await supabaseAuth.signOut();
      }
      
      setActiveProvider('supabase');
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }, [activeProvider, cognitoUser, supabaseAuth]);

  /**
   * Migrate user from Supabase to Cognito
   */
  const migrateToCognito = useCallback(async () => {
    if (!supabaseAuth.user) {
      throw new Error('No Supabase user to migrate');
    }

    try {
      setCognitoLoading(true);
      setCognitoError(null);

      // Create Cognito user with Supabase user data
      const result = await Auth.signUp({
        username: supabaseAuth.user.email!,
        password: 'TEMP_PASSWORD_' + Math.random().toString(36), // Temporary password
        attributes: {
          email: supabaseAuth.user.email!,
          given_name: supabaseAuth.user.user_metadata?.given_name || '',
          family_name: supabaseAuth.user.user_metadata?.family_name || '',
          'custom:supabase_id': supabaseAuth.user.id,
          'custom:user_role': 'owner', // Default role
          'custom:locale': 'de'
        }
      });

      // Force password reset on first login
      // This would require additional implementation

      console.log('✅ User migration to Cognito initiated');
      return result;
    } catch (error) {
      console.error('❌ Migration to Cognito failed:', error);
      setCognitoError(error instanceof Error ? error.message : 'Migration failed');
      throw error;
    } finally {
      setCognitoLoading(false);
    }
  }, [supabaseAuth.user]);

  /**
   * Check if user has been migrated to Cognito
   */
  const checkMigrationStatus = useCallback(async (): Promise<boolean> => {
    if (!supabaseAuth.user) {
      return false;
    }

    try {
      // Check if user exists in Cognito by trying to initiate password reset
      await Auth.forgotPassword(supabaseAuth.user.email!);
      return true;
    } catch (error) {
      // If user doesn't exist, forgotPassword will fail
      return false;
    }
  }, [supabaseAuth.user]);

  /**
   * Get current user (unified)
   */
  const getCurrentUser = useCallback(() => {
    if (activeProvider === 'cognito' && cognitoUser) {
      return cognitoUser;
    }
    return supabaseAuth.user;
  }, [activeProvider, cognitoUser, supabaseAuth.user]);

  /**
   * Check if user is authenticated (unified)
   */
  const isAuthenticated = useCallback(() => {
    if (activeProvider === 'cognito') {
      return !!cognitoUser && !!cognitoSession && cognitoSession.isValid();
    }
    return !!supabaseAuth.user;
  }, [activeProvider, cognitoUser, cognitoSession, supabaseAuth.user]);

  /**
   * Get authentication token (unified)
   */
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      if (activeProvider === 'cognito' && cognitoSession) {
        return cognitoSession.getAccessToken().getJwtToken();
      }
      
      if (supabaseAuth.session) {
        return supabaseAuth.session.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }, [activeProvider, cognitoSession, supabaseAuth.session]);

  const contextValue: MigrationAuthContextType = {
    activeProvider,
    cognitoUser,
    cognitoSession,
    cognitoLoading,
    cognitoError,
    signIn,
    signUp,
    signOut,
    migrateToCognito,
    checkMigrationStatus,
    getCurrentUser,
    isAuthenticated,
    getAuthToken
  };

  return (
    <MigrationAuthContext.Provider value={contextValue}>
      {children}
    </MigrationAuthContext.Provider>
  );
};

/**
 * Hook to use migration auth context
 */
export const useMigrationAuth = (): MigrationAuthContextType => {
  const context = useContext(MigrationAuthContext);
  if (context === undefined) {
    throw new Error('useMigrationAuth must be used within a MigrationAuthProvider');
  }
  return context;
};

/**
 * Wrapper component that provides both Supabase and Cognito auth
 */
export const UnifiedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SupabaseAuthProvider>
      <MigrationAuthProvider>
        {children}
      </MigrationAuthProvider>
    </SupabaseAuthProvider>
  );
};

export default MigrationAuthProvider;