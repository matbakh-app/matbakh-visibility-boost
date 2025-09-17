/**
 * Zentrale Provider-Architektur - 0 Fehler Toleranz
 * Alle Provider in korrekter Reihenfolge für maximale Stabilität
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './AuthContext'; // Verwende das bestehende AuthContext
import { PersonaProvider } from './PersonaContext'; // NEW: Advanced Persona System
import { ErrorBoundary } from '@/components/ErrorBoundary';
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

console.log('🔐 Auth Provider in AppProviders: Legacy AuthContext (kompatibel)');

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
          <PersonaProvider>
            {children}
          </PersonaProvider>
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
      <ErrorBoundary
        fallback={
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-red-800 font-semibold">Provider Error</h2>
            <p className="text-red-600">Ein kritischer Provider-Fehler ist aufgetreten.</p>
          </div>
        }
      >
        {children}
      </ErrorBoundary>
    </React.Suspense>
  );
};

export { queryClient };