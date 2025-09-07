/**
 * Simple Authentication Context for passwordless auth
 * Replaces complex Cognito/Amplify setup with simple JWT handling
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getCurrentUser, isAuthenticated, signOut, handleAuthCallback } from '@/services/auth';

export interface SimpleUser {
  id: string;
  email: string;
  name?: string;
}

export interface SimpleAuthContextType {
  user: SimpleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => void;
  checkAuthStatus: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useAuth = (): SimpleAuthContextType => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(() => {
    try {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
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

  const handleSignOut = useCallback(() => {
    signOut();
    setUser(null);
  }, []);

  // Initialize auth on mount and handle callback
  useEffect(() => {
    // Handle auth callback from magic link
    const { token, error } = handleAuthCallback();
    
    if (token) {
      console.log('✅ Auth callback successful');
    } else if (error) {
      console.error('❌ Auth callback failed:', error);
    }
    
    // Check current auth status
    checkAuthStatus();
  }, [checkAuthStatus]);

  const contextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signOut: handleSignOut,
    checkAuthStatus
  };

  return (
    <SimpleAuthContext.Provider value={contextValue}>
      {children}
    </SimpleAuthContext.Provider>
  );
};