#!/bin/bash

# Create Hybrid Auth Solution - Task A2.x
# Gradual migration approach without breaking existing functionality

set -e

echo "🔄 CREATING HYBRID AUTH SOLUTION"
echo "================================="
echo ""

# Step 1: Restore original main.tsx
echo "📝 Step 1: Restoring original main.tsx..."
if [ -f "src/main.tsx.backup" ]; then
    cp src/main.tsx.backup src/main.tsx
    echo "   ✅ Original main.tsx restored"
else
    echo "   ⚠️  No backup found, keeping current version"
fi

# Step 2: Create hybrid auth service
echo ""
echo "📝 Step 2: Creating hybrid auth service..."
cat > src/services/hybrid-auth.ts << 'EOF'
/**
 * Hybrid Authentication Service
 * Supports both legacy JWT and future Cognito migration
 */

// Legacy auth imports
import { 
  startAuth as legacyStartAuth,
  handleAuthCallback as legacyHandleCallback,
  isAuthenticated as legacyIsAuthenticated,
  getCurrentUser as legacyGetCurrentUser,
  signOut as legacySignOut
} from './auth';

interface HybridUser {
  id: string;
  email: string;
  name?: string;
  provider: 'legacy' | 'cognito';
}

interface AuthStartResponse {
  ok: boolean;
  error?: string;
}

/**
 * Check which auth provider to use
 */
function getAuthProvider(): 'legacy' | 'cognito' {
  return import.meta.env.VITE_USE_COGNITO === 'true' ? 'cognito' : 'legacy';
}

/**
 * Start authentication (supports both providers)
 */
export async function startAuth(email: string, name?: string): Promise<AuthStartResponse> {
  const provider = getAuthProvider();
  
  console.log(`🔐 Using ${provider} auth provider`);
  
  if (provider === 'cognito') {
    // TODO: Implement Cognito auth when ready
    console.log('⚠️  Cognito not implemented yet, falling back to legacy');
    return legacyStartAuth(email, name);
  }
  
  return legacyStartAuth(email, name);
}

/**
 * Handle auth callback
 */
export function handleAuthCallback(): { token: string | null; error: string | null } {
  const provider = getAuthProvider();
  
  if (provider === 'cognito') {
    // TODO: Handle Cognito callback
    console.log('⚠️  Cognito callback not implemented yet, falling back to legacy');
    return legacyHandleCallback();
  }
  
  return legacyHandleCallback();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const provider = getAuthProvider();
  
  if (provider === 'cognito') {
    // TODO: Check Cognito auth status
    console.log('⚠️  Cognito auth check not implemented yet, falling back to legacy');
    return legacyIsAuthenticated();
  }
  
  return legacyIsAuthenticated();
}

/**
 * Get current user
 */
export function getCurrentUser(): HybridUser | null {
  const provider = getAuthProvider();
  
  if (provider === 'cognito') {
    // TODO: Get Cognito user
    console.log('⚠️  Cognito user fetch not implemented yet, falling back to legacy');
    const legacyUser = legacyGetCurrentUser();
    return legacyUser ? { ...legacyUser, provider: 'legacy' } : null;
  }
  
  const legacyUser = legacyGetCurrentUser();
  return legacyUser ? { ...legacyUser, provider: 'legacy' } : null;
}

/**
 * Sign out user
 */
export function signOut(): void {
  const provider = getAuthProvider();
  
  if (provider === 'cognito') {
    // TODO: Cognito sign out
    console.log('⚠️  Cognito sign out not implemented yet, falling back to legacy');
    legacySignOut();
    return;
  }
  
  legacySignOut();
}

/**
 * Get auth environment info
 */
export function getAuthEnvironmentInfo() {
  return {
    provider: getAuthProvider(),
    cognitoEnabled: import.meta.env.VITE_USE_COGNITO === 'true',
    legacyFallback: true
  };
}

export type { HybridUser };
EOF

echo "   ✅ Hybrid auth service created"

# Step 3: Update SimpleAuthContext to use hybrid service
echo ""
echo "📝 Step 3: Updating SimpleAuthContext for hybrid support..."
cat > src/contexts/SimpleAuthContext.tsx.new << 'EOF'
/**
 * Simple Authentication Context for passwordless auth
 * Now supports hybrid auth with Cognito migration path
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  getCurrentUser, 
  isAuthenticated, 
  signOut, 
  handleAuthCallback,
  getAuthEnvironmentInfo,
  HybridUser
} from '@/services/hybrid-auth';

export interface SimpleUser {
  id: string;
  email: string;
  name?: string;
  provider?: 'legacy' | 'cognito';
}

export interface SimpleAuthContextType {
  user: SimpleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => void;
  checkAuthStatus: () => void;
  authInfo: any; // For debugging
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
    checkAuthStatus,
    authInfo: getAuthEnvironmentInfo()
  };

  return (
    <SimpleAuthContext.Provider value={contextValue}>
      {children}
    </SimpleAuthContext.Provider>
  );
};
EOF

mv src/contexts/SimpleAuthContext.tsx.new src/contexts/SimpleAuthContext.tsx
echo "   ✅ SimpleAuthContext updated for hybrid support"

# Step 4: Test build
echo ""
echo "🔨 Step 4: Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi

echo ""
echo "🎯 HYBRID AUTH SOLUTION COMPLETE"
echo "================================"
echo "   ✅ Hybrid auth service created"
echo "   ✅ Legacy auth preserved"
echo "   ✅ Cognito migration path prepared"
echo "   ✅ Feature flag system ready"
echo "   ✅ Build successful"
echo ""
echo "🔧 Current Status:"
echo "   Provider: $(grep VITE_USE_COGNITO .env || echo 'legacy (default)')"
echo "   Ready for gradual Cognito migration"
echo ""