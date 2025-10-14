/**
 * Route Redirects for Legacy Component Archival
 * Redirects legacy routes to new Kiro dashboards
 * Generated: 2025-09-18 as part of Task 9: Execute Safe Legacy Component Archival
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface RedirectMapping {
  from: string;
  to: string;
  description: string;
}

// Redirect mappings for archived legacy components
const REDIRECT_MAPPINGS: RedirectMapping[] = [
  // Upload system redirects
  {
    from: '/upload/legacy',
    to: '/upload',
    description: 'Legacy upload system → Kiro upload dashboard'
  },
  
  // VC (Visibility Check) redirects
  {
    from: '/vc/old',
    to: '/vc',
    description: 'Legacy VC system → Kiro VC dashboard'
  },
  
  // Onboarding redirects
  {
    from: '/onboarding/old',
    to: '/onboarding',
    description: 'Legacy onboarding → Kiro onboarding flow'
  },
  
  // Reports redirects
  {
    from: '/reports/old',
    to: '/reports',
    description: 'Legacy reports → Kiro reports dashboard'
  },
  
  // Dashboard redirects
  {
    from: '/dashboard/old',
    to: '/dashboard',
    description: 'Legacy dashboard → Kiro dashboard'
  },
  
  // Admin redirects
  {
    from: '/admin/old',
    to: '/admin',
    description: 'Legacy admin → Kiro admin panel'
  }
];

export const RouteRedirects: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find matching redirect
    const redirect = REDIRECT_MAPPINGS.find(mapping => 
      currentPath === mapping.from || currentPath.startsWith(mapping.from + '/')
    );
    
    if (redirect) {
      console.log(`🔀 Redirecting from ${redirect.from} to ${redirect.to}: ${redirect.description}`);
      
      // Preserve query parameters and hash
      const search = location.search;
      const hash = location.hash;
      const newPath = currentPath.replace(redirect.from, redirect.to);
      
      navigate(`${newPath}${search}${hash}`, { replace: true });
    }
  }, [location, navigate]);

  return null; // This component doesn't render anything
};

/**
 * Legacy Route Fallback Component
 * Shows a message for routes that were archived but don't have direct Kiro alternatives
 */
export const LegacyRouteFallback: React.FC<{ 
  originalRoute: string;
  suggestedAlternative?: string;
}> = ({ originalRoute, suggestedAlternative }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Route Archived</h3>
          <p className="mt-1 text-sm text-gray-500">
            The route <code className="bg-gray-100 px-1 rounded">{originalRoute}</code> has been archived as part of our system cleanup.
          </p>
          
          {suggestedAlternative && (
            <div className="mt-4">
              <button
                onClick={() => navigate(suggestedAlternative)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to {suggestedAlternative}
              </button>
            </div>
          )}
          
          <div className="mt-4">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteRedirects;