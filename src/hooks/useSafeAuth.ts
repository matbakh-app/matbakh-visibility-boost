/**
 * Sichere Auth-Hook mit 0-Fehler-Toleranz
 * Verhindert "useAuth must be used within AuthProvider" Crashes
 */

import { useContext } from 'react';
import { CognitoAuthContext } from '@/contexts/CognitoAuthContext';

export const useSafeAuth = () => {
  try {
    const context = useContext(CognitoAuthContext);
    
    if (!context) {
      console.warn('⚠️ useAuth called outside AuthProvider - returning fallback');
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        signIn: async () => { throw new Error('AuthProvider not available'); },
        signOut: async () => { throw new Error('AuthProvider not available'); },
        signUp: async () => { throw new Error('AuthProvider not available'); },
        confirmSignUp: async () => { throw new Error('AuthProvider not available'); },
        resetPassword: async () => { throw new Error('AuthProvider not available'); },
        confirmResetPassword: async () => { throw new Error('AuthProvider not available'); },
      };
    }
    
    return context;
  } catch (error) {
    console.error('❌ Auth context error:', error);
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Auth context unavailable',
      signIn: async () => { throw new Error('Auth context error'); },
      signOut: async () => { throw new Error('Auth context error'); },
      signUp: async () => { throw new Error('Auth context error'); },
      confirmSignUp: async () => { throw new Error('Auth context error'); },
      resetPassword: async () => { throw new Error('Auth context error'); },
      confirmResetPassword: async () => { throw new Error('Auth context error'); },
    };
  }
};

/**
 * Komponente die Auth-Kontext erfordert
 */
export const RequireAuthContext: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const auth = useSafeAuth();
  
  if (auth.error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-yellow-800 font-semibold">⚠️ AuthProvider fehlt</div>
        <div className="text-yellow-600 text-sm">
          Diese Komponente benötigt einen AuthProvider im Component Tree.
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};