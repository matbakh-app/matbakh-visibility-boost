/**
 * Zentrale Provider-Architektur - 0 Fehler Toleranz
 * Alle Provider in korrekter Reihenfolge für maximale Stabilität
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { CognitoAuthProvider } from './CognitoAuthContext';
import { SimpleAuthProvider } from './SimpleAuthContext';
import i18n from '../i18n';

// QueryClient mit optimalen Einstellungen
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 Minuten
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Feature flag für Cognito Migration
const USE_COGNITO = import.meta.env.VITE_USE_COGNITO === 'true';

console.log('🔐 Auth Provider in AppProviders:', USE_COGNITO ? 'Cognito' : 'Legacy');

const AuthProvider = USE_COGNITO ? CognitoAuthProvider : SimpleAuthProvider;

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Zentrale Provider-Komponente
 * Reihenfolge ist kritisch für Stabilität!
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

/**
 * Fallback-Komponente für fehlende Provider
 */
export const ProviderErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <React.Suspense fallback={<div>Loading providers...</div>}>
      <React.ErrorBoundary
        fallback={
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-red-800 font-semibold">Provider Error</h2>
            <p className="text-red-600">Ein kritischer Provider-Fehler ist aufgetreten.</p>
          </div>
        }
      >
        {children}
      </React.ErrorBoundary>
    </React.Suspense>
  );
};

export { queryClient };