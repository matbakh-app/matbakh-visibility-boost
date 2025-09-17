import React from 'react';
import { useAuthUnified } from '@/hooks/useAuthUnified';

/**
 * Komponente die Auth-Kontext erfordert
 */
export const RequireAuthContext: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const auth = useAuthUnified();
  
  if (auth.oauthError) {
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

/**
 * Einfacher Loader für Auth-Fehler
 */
export const SafeAuthLoader: React.FC = () => (
  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="text-yellow-800 font-semibold">⚠️ AuthProvider fehlt</div>
    <div className="text-yellow-600 text-sm">
      Diese Komponente benötigt einen AuthProvider im Component Tree.
    </div>
  </div>
);